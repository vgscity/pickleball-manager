const bcrypt = require('bcryptjs');

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

async function query(sql, params = []) {
  if (USE_PG) {
    const result = await pool.query(sql, params);
    return result.rows;
  } else {
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
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            club_name TEXT DEFAULT '',
            plan TEXT DEFAULT 'free',
            public_token TEXT UNIQUE,
            is_super_admin BOOLEAN DEFAULT false,
            created_at TIMESTAMPTZ DEFAULT NOW()
          )
        `);
        await query(`
          CREATE TABLE IF NOT EXISTS app_data (
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            key TEXT NOT NULL,
            value TEXT NOT NULL,
            PRIMARY KEY (user_id, key)
          )
        `);
      } else {
        sqliteDb.exec(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            club_name TEXT DEFAULT '',
            plan TEXT DEFAULT 'free',
            public_token TEXT UNIQUE,
            is_super_admin INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now'))
          );
          CREATE TABLE IF NOT EXISTS app_data (
            user_id INTEGER NOT NULL,
            key TEXT NOT NULL,
            value TEXT NOT NULL,
            PRIMARY KEY (user_id, key),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          );
        `);
      }

      // No auto-seed — super admin is created via one-time setup API

      // Import data-backup.json into SQLite if empty (local dev)
      if (!USE_PG) {
        const fs = require('fs');
        const path = require('path');
        const backupPath = path.join(__dirname, '..', 'data-backup.json');
        const superAdmin = (await query('SELECT id FROM users WHERE is_super_admin = $1', [USE_PG ? true : 1]))[0];
        if (superAdmin && fs.existsSync(backupPath)) {
          const existing = await query('SELECT value FROM app_data WHERE user_id = $1 AND key = $2', [superAdmin.id, 'state']);
          if (existing.length === 0) {
            const backup = fs.readFileSync(backupPath, 'utf8');
            await query('INSERT OR REPLACE INTO app_data (user_id, key, value) VALUES ($1, $2, $3)', [superAdmin.id, 'state', backup]);
            console.log('Đã import data-backup.json vào local dev user');
          }
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

module.exports = { query, initDb, USE_PG };
