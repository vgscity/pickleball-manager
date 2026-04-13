const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const bcrypt = require('bcryptjs');

const dataDir = process.env.DATA_DIR || __dirname;
const db = new DatabaseSync(path.join(dataDir, 'pickleball.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS app_data (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Seed default admin
const adminExists = db.prepare('SELECT id FROM admins WHERE username = ?').get('admin');
if (!adminExists) {
  const hash = bcrypt.hashSync('admin', 10);
  db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run('admin', hash);
  console.log('Tài khoản admin mặc định: admin / admin');
}

module.exports = db;
