/**
 * PeakAndPack — Admin Routes Extension
 * Drop this file into your backend/routes/ folder and
 * register it in server.js with:
 *   const adminRoutes = require('./routes/admin-routes');
 *   app.use('/api/admin', adminRoutes);
 *
 * Requires: express, better-sqlite3 (already used by PeakAndPack),
 *           multer (add to package.json: npm install multer),
 *           csv-stringify (add: npm install csv-stringify)
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { stringify } = require('csv-stringify/sync');
const upload = multer({ storage: multer.memoryStorage() });

// Middleware: verify admin role
// PeakAndPack JWT payload has { userId, role }
// Admin users must have role === 'admin'
function requireAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorised' });
  }
  try {
    const jwt = require('jsonwebtoken');
    const payload = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
    if (payload.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// ── GET /api/admin/products ─────────────────────────────────────────────────
// Returns all products with their sort_order field for drag-and-drop reordering
router.get('/products', requireAdmin, (req, res) => {
  try {
    const db = req.app.locals.db;
    const products = db.prepare(
      'SELECT id, name, price, stock, category, sort_order FROM products ORDER BY sort_order ASC, id ASC'
    ).all();
    res.json({ products });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/admin/products/:id ──────────────────────────────────────────
// Deletes a product. Returns 404 if not found.
router.delete('/products/:id', requireAdmin, (req, res) => {
  try {
    const db = req.app.locals.db;
    const product = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ deleted: true, id: Number(req.params.id) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/admin/products/reorder ───────────────────────────────────────
// Accepts: { order: [{ id, sort_order }] }
// Updates sort_order for each product in the list.
router.patch('/products/reorder', requireAdmin, (req, res) => {
  try {
    const db = req.app.locals.db;
    const { order } = req.body;
    if (!Array.isArray(order)) {
      return res.status(400).json({ error: 'order must be an array' });
    }
    const update = db.prepare('UPDATE products SET sort_order = ? WHERE id = ?');
    const updateAll = db.transaction((items) => {
      for (const item of items) {
        update.run(item.sort_order, item.id);
      }
    });
    updateAll(order);
    res.json({ updated: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/admin/products/import ─────────────────────────────────────────
// Accepts: multipart/form-data with a CSV file field named 'file'
// CSV format: name,price,stock,category
// Inserts each row as a new product.
router.post('/products/import', requireAdmin, upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const db = req.app.locals.db;
    const csv = req.file.buffer.toString('utf8');
    const lines = csv.trim().split('\n');
    const header = lines[0].toLowerCase().split(',').map(h => h.trim());

    const nameIdx = header.indexOf('name');
    const priceIdx = header.indexOf('price');
    const stockIdx = header.indexOf('stock');
    const categoryIdx = header.indexOf('category');

    if (nameIdx === -1 || priceIdx === -1) {
      return res.status(400).json({ error: 'CSV must have name and price columns' });
    }

    const insert = db.prepare(
      'INSERT INTO products (name, price, stock, category, sort_order) VALUES (?, ?, ?, ?, (SELECT COALESCE(MAX(sort_order),0)+1 FROM products))'
    );
    const insertAll = db.transaction((rows) => {
      for (const row of rows) {
        insert.run(
          row[nameIdx].trim(),
          parseFloat(row[priceIdx]) || 0,
          parseInt(row[stockIdx]) || 0,
          categoryIdx >= 0 ? row[categoryIdx].trim() : 'uncategorised'
        );
      }
    });

    const dataRows = lines.slice(1).map(l => l.split(','));
    insertAll(dataRows);
    res.json({ imported: dataRows.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/products/export ──────────────────────────────────────────
// Returns all products as a downloadable CSV file.
router.get('/products/export', requireAdmin, (req, res) => {
  try {
    const db = req.app.locals.db;
    const products = db.prepare(
      'SELECT id, name, price, stock, category FROM products ORDER BY id ASC'
    ).all();
    const csv = stringify(products, { header: true });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
