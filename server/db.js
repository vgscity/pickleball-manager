const bcrypt = require('bcryptjs');

// Dùng PostgreSQL trên Render, SQLite local
const USE_PG = !!process.env.DATABASE_URL;

let pool, sqliteDb;

if (USE_PG) {
  const { Pool } = require('pg');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
} else {
  const { DatabaseSync } = require('node:sqlite');
  const path = require('path');
  sqliteDb = new DatabaseSync(path.join(__dirname, 'pickleball.db'));
  console.log('Dùng SQLite local');
}

// Unified query interface
async function query(sql, params = []) {
  if (USE_PG) {
    const result = await pool.query(sql, params);
    return result.rows;
  } else {
    // Convert $1,$2 → ?, ? for SQLite
    const sqliteSql = sql.replace(/\$\d+/g, '?');
    if (/^\s*(INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)/i.test(sql)) {
      sqliteDb.prepare(sqliteSql).run(...params);
      return [];
    } else {
      return sqliteDb.prepare(sqliteSql).all(...params);
    }
  }
}

async function initDb(retries = 10, delay = 3000) {
  for (let i = 1; i <= retries; i++) {
    try {
      if (USE_PG) {
        await query(`
          CREATE TABLE IF NOT EXISTS admins (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL
          )
        `);
        await query(`
          CREATE TABLE IF NOT EXISTS app_data (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
          )
        `);
      } else {
        sqliteDb.exec(`
          CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL
          );
          CREATE TABLE IF NOT EXISTS app_data (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
          );
        `);
      }

      // Seed default admin
      const rows = await query('SELECT id FROM admins WHERE username = $1', ['admin']);
      if (rows.length === 0) {
        const hash = bcrypt.hashSync('admin', 10);
        await query('INSERT INTO admins (username, password_hash) VALUES ($1, $2)', ['admin', hash]);
        console.log('Tài khoản admin mặc định: admin / admin');
      }

      // Import data-backup.json vào SQLite nếu DB trống
      if (!USE_PG) {
        const fs = require('fs');
        const path = require('path');
        const backupPath = path.join(__dirname, '..', 'data-backup.json');
        const existing = await query('SELECT value FROM app_data WHERE key = $1', ['state']);
        if (existing.length === 0 && fs.existsSync(backupPath)) {
          const backup = fs.readFileSync(backupPath, 'utf8');
          await query(
            "INSERT OR REPLACE INTO app_data (key, value) VALUES ($1, $2)",
            ['state', backup]
          );
          console.log('Đã import data-backup.json vào SQLite local');
        }
      }

      console.log('Database đã sẵn sàng');
      return;
    } catch (err) {
      console.log(`Kết nối DB thất bại (lần ${i}/${retries}):`, err.message);
      if (i === retries) throw err;
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

module.exports = { query, initDb };
