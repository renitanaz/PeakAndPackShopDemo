/**
 * PeakAndPack — Admin Migration Script
 * Run once after deploying the extension:
 *   node backend/migrate-admin.js
 *
 * What it does:
 *   1. Adds sort_order column to products table (if not present)
 *   2. Creates an admin user: admin@peakandpack.com / adminpass123
 *   3. Seeds sort_order values for existing products
 */

const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

// Adjust this path to match your PeakAndPack DB location
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../database.sqlite');

const db = new Database(DB_PATH);

console.log('Running admin migration...');

// 1. Add sort_order to products if missing
const cols = db.prepare("PRAGMA table_info(products)").all().map(c => c.name);
if (!cols.includes('sort_order')) {
  db.prepare('ALTER TABLE products ADD COLUMN sort_order INTEGER DEFAULT 0').run();
  console.log('  Added sort_order column to products');
} else {
  console.log('  sort_order column already exists');
}

// 2. Seed sort_order values (id order)
db.prepare(`
  UPDATE products SET sort_order = id WHERE sort_order = 0
`).run();
console.log('  Seeded sort_order values');

// 3. Add role column to users if missing
const userCols = db.prepare("PRAGMA table_info(users)").all().map(c => c.name);
if (!userCols.includes('role')) {
  db.prepare("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'customer'").run();
  console.log('  Added role column to users');
} else {
  console.log('  role column already exists');
}

// 4. Create admin user (skip if already exists)
const existing = db.prepare("SELECT id FROM users WHERE email = ?").get('admin@peakandpack.com');
if (!existing) {
  const hash = bcrypt.hashSync('adminpass123', 10);
  db.prepare(
    "INSERT INTO users (email, password, role) VALUES (?, ?, 'admin')"
  ).run('admin@peakandpack.com', hash);
  console.log('  Created admin user: admin@peakandpack.com / adminpass123');
} else {
  // Make sure existing admin has role set
  db.prepare("UPDATE users SET role = 'admin' WHERE email = ?").run('admin@peakandpack.com');
  console.log('  Admin user already exists, ensured role is set');
}

console.log('Migration complete.');
db.close();
