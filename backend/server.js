const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'peakandpack-secret-key';

app.use(cors());
app.use(express.json());

// ---- DATABASE SETUP ----
const db = new Database(':memory:');

db.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    category TEXT,
    stock INTEGER DEFAULT 100,
    image_url TEXT
  );

  CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    total REAL,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    price REAL
  );
`);

// Seed products: trekking, camping, travel, and mountaineering gear
// (some with intentional data issues for QA practice)
const products = [
  { name: 'Trekking Poles (Pair)', description: 'Adjustable aluminum trekking poles with cork grips', price: 34.99, category: 'Trekking', stock: 50, image_url: 'https://picsum.photos/seed/trekkingpoles/300/200' },
  { name: '4-Season Tent', description: '2-person mountaineering tent, wind and snow rated', price: 320.00, category: 'Mountaineering', stock: 15, image_url: 'https://picsum.photos/seed/tent/300/200' },
  { name: 'Camping Stove', description: 'Compact butane stove for backcountry cooking', price: 45.99, category: 'Camping', stock: 40, image_url: 'https://picsum.photos/seed/stove/300/200' },
  // BUG #1: Negative price
  { name: 'Sleeping Bag (-15C)', description: 'Down-filled sleeping bag rated to -15C', price: -89.00, category: 'Camping', stock: 30, image_url: 'https://picsum.photos/seed/sleepingbag/300/200' },
  { name: 'Headlamp', description: 'Rechargeable LED headlamp, 300 lumens', price: 24.99, category: 'Trekking', stock: 60, image_url: 'https://picsum.photos/seed/headlamp/300/200' },
  // BUG #2: Empty name
  { name: '', description: 'Mystery item with no name', price: 9.99, category: 'Misc', stock: 5, image_url: 'https://picsum.photos/seed/mystery/300/200' },
  { name: 'GPS Watch', description: 'Multi-sport GPS watch with altimeter and barometer', price: 249.99, category: 'Mountaineering', stock: 20, image_url: 'https://picsum.photos/seed/gpswatch/300/200' },
  { name: '60L Travel Backpack', description: 'Expedition-grade 60L hiking and travel backpack', price: 145.00, category: 'Travel', stock: 35, image_url: 'https://picsum.photos/seed/backpack/300/200' },
  // BUG #3: Extremely high price (likely a data entry error)
  { name: 'Insulated Water Bottle', description: 'Double-wall insulated steel bottle, 1L', price: 9999.99, category: 'Trekking', stock: 80, image_url: 'https://picsum.photos/seed/bottle/300/200' },
  { name: 'Climbing Harness', description: 'Adjustable mountaineering harness with gear loops', price: 64.99, category: 'Mountaineering', stock: 25, image_url: 'https://picsum.photos/seed/harness/300/200' },
];

const insertProduct = db.prepare('INSERT INTO products (name, description, price, category, stock, image_url) VALUES (?, ?, ?, ?, ?, ?)');
products.forEach(p => insertProduct.run(p.name, p.description, p.price, p.category, p.stock, p.image_url));

// Seed test user
const hashedPassword = bcrypt.hashSync('password123', 10);
db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)').run('Test User', 'test@peakandpack.com', hashedPassword);

// ---- MIDDLEWARE ----
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });
  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    next();
  } catch {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// ---- ROUTES ----

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// GET /api/products — BUG #4: Returns products with negative/invalid prices (no filtering)
app.get('/api/products', (req, res) => {
  const { category, search, sort } = req.query;
  let query = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  if (category) { query += ' AND category = ?'; params.push(category); }
  if (search) { query += ' AND (name LIKE ? OR description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

  // BUG #5: Sort parameter not sanitized (SQL injection risk in sort column)
  if (sort === 'price_asc') query += ' ORDER BY price ASC';
  else if (sort === 'price_desc') query += ' ORDER BY price DESC';
  else if (sort === 'name') query += ' ORDER BY name ASC';
  // BUG: default sort missing — results are non-deterministic

  const products = db.prepare(query).all(...params);
  res.json({ products, total: products.length });
});

// GET /api/products/:id
app.get('/api/products/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// GET /api/categories
app.get('/api/categories', (req, res) => {
  const rows = db.prepare('SELECT DISTINCT category FROM products').all();
  res.json({ categories: rows.map(r => r.category) });
});

// POST /api/auth/register
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  // BUG #6: No input validation — accepts empty name/email/password
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const hashed = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)').run(name || '', email, hashed);
  const token = jwt.sign({ id: result.lastInsertRowid, email }, JWT_SECRET, { expiresIn: '24h' });
  res.status(201).json({ message: 'User created', token, user: { id: result.lastInsertRowid, name, email } });
});

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

// GET /api/cart (in-memory per-user simulation)
const carts = {};
app.get('/api/cart', authenticateToken, (req, res) => {
  const cart = carts[req.user.id] || [];
  // BUG #7: Cart total calculation uses client-side prices (not verified against DB)
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  res.json({ items: cart, total: Math.round(total * 100) / 100 });
});

// POST /api/cart
app.post('/api/cart', authenticateToken, (req, res) => {
  const { product_id, quantity = 1 } = req.body;
  if (!product_id) return res.status(400).json({ error: 'product_id required' });

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  if (!carts[req.user.id]) carts[req.user.id] = [];
  const existing = carts[req.user.id].find(i => i.product_id === product_id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    carts[req.user.id].push({ product_id, name: product.name, price: product.price, quantity });
  }
  res.json({ message: 'Added to cart', cart: carts[req.user.id] });
});

// DELETE /api/cart/:product_id
app.delete('/api/cart/:product_id', authenticateToken, (req, res) => {
  const pid = parseInt(req.params.product_id);
  if (!carts[req.user.id]) return res.status(404).json({ error: 'Cart empty' });
  carts[req.user.id] = carts[req.user.id].filter(i => i.product_id !== pid);
  res.json({ message: 'Item removed', cart: carts[req.user.id] });
});

// POST /api/orders/checkout — BUG #8: No stock check before placing order
app.post('/api/orders/checkout', authenticateToken, (req, res) => {
  const cart = carts[req.user.id] || [];
  if (cart.length === 0) return res.status(400).json({ error: 'Cart is empty' });

  // BUG #9: Discount code "SAVE10" gives 100% discount (should be 10%)
  const { discount_code } = req.body;
  let discount = 0;
  if (discount_code === 'SAVE10') discount = 1.0; // Should be 0.10

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal * (1 - discount);

  const order = db.prepare('INSERT INTO orders (user_id, total, status) VALUES (?, ?, ?)').run(req.user.id, total, 'confirmed');
  const insertItem = db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)');

  cart.forEach(item => insertItem.run(order.lastInsertRowid, item.product_id, item.quantity, item.price));
  carts[req.user.id] = []; // Clear cart

  res.status(201).json({
    message: 'Order placed successfully',
    order_id: order.lastInsertRowid,
    total: Math.round(total * 100) / 100,
    status: 'confirmed'
  });
});

// GET /api/orders — BUG #10: Returns ALL users' orders (missing user filter)
app.get('/api/orders', authenticateToken, (req, res) => {
  // Should be: WHERE user_id = req.user.id
  const orders = db.prepare(`
    SELECT o.*, GROUP_CONCAT(oi.product_id || 'x' || oi.quantity) as items
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `).all();
  res.json({ orders });
});

// GET /api/orders/:id
app.get('/api/orders/:id', authenticateToken, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const items = db.prepare(`
    SELECT oi.*, p.name as product_name
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
  `).all(req.params.id);
  res.json({ ...order, items });
});

// GET /api/search — BUG #11: Returns 500 when query param missing (instead of 400)
app.get('/api/search', (req, res) => {
  const { q } = req.query;
  const results = db.prepare('SELECT * FROM products WHERE name LIKE ? OR description LIKE ?')
    .all(`%${q}%`, `%${q}%`); // crashes if q is undefined
  res.json({ results, query: q });
});

app.listen(PORT, () => {
  console.log(`PeakAndPack API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Products: http://localhost:${PORT}/api/products`);
  console.log('\n🐛 Known bugs for QA practice:');
  console.log('  1. Negative price on Sleeping Bag (-15C)');
  console.log('  2. Product with empty name in DB');
  console.log('  3. Insulated Water Bottle priced at $9,999.99');
  console.log('  4. No validation of price on products endpoint');
  console.log('  5. No default sort — non-deterministic results');
  console.log('  6. Register allows empty name field');
  console.log('  7. Cart total uses client-side prices (not verified)');
  console.log('  8. No stock check before order placement');
  console.log('  9. Discount code SAVE10 = 100% off (should be 10%)');
  console.log('  10. GET /api/orders returns all users orders');
  console.log('  11. GET /api/search crashes if ?q param missing');
});
