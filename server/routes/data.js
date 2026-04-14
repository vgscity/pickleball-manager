const express = require('express');
const { query } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  const rows = await query('SELECT value FROM app_data WHERE key = $1', ['state']);
  if (rows.length === 0) return res.json(null);
  try {
    res.json(JSON.parse(rows[0].value));
  } catch {
    res.json(null);
  }
});

router.put('/', authMiddleware, async (req, res) => {
  const value = JSON.stringify(req.body);
  await query(
    'INSERT INTO app_data (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
    ['state', value]
  );
  res.json({ ok: true });
});

module.exports = router;
