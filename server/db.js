const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

async function initDb(retries = 10, delay = 3000) {
  for (let i = 1; i <= retries; i++) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS admins (
          id SERIAL PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS app_data (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
      `);

      // Seed default admin
      const { rows } = await pool.query('SELECT id FROM admins WHERE username = $1', ['admin']);
      if (rows.length === 0) {
        const hash = bcrypt.hashSync('admin', 10);
        await pool.query('INSERT INTO admins (username, password_hash) VALUES ($1, $2)', ['admin', hash]);
        console.log('Tài khoản admin mặc định: admin / admin');
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

module.exports = { pool, initDb };
