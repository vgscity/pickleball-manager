const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/data — public (viewer can read without auth)
router.get('/', (req, res) => {
  const row = db.prepare('SELECT value FROM app_data WHERE key = ?').get('state');
  if (!row) return res.json(null);
  try {
    res.json(JSON.parse(row.value));
  } catch {
    res.json(null);
  }
});

// PUT /api/data — requires auth
router.put('/', authMiddleware, (req, res) => {
  const value = JSON.stringify(req.body);
  db.prepare('INSERT OR REPLACE INTO app_data (key, value) VALUES (?, ?)').run('state', value);
  res.json({ ok: true });
});

module.exports = router;
