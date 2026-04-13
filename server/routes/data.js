const express = require('express');
const { pool } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/data — public
router.get('/', async (req, res) => {
  const { rows } = await pool.query('SELECT value FROM app_data WHERE key = $1', ['state']);
  if (rows.length === 0) return res.json(null);
  try {
    res.json(JSON.parse(rows[0].value));
  } catch {
    res.json(null);
  }
});

// PUT /api/data — requires auth
router.put('/', authMiddleware, async (req, res) => {
  const value = JSON.stringify(req.body);
  await pool.query(
    'INSERT INTO app_data (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
    ['state', value]
  );
  res.json({ ok: true });
});

module.exports = router;
