const express = require('express');
const { query } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/data — requires auth, user-scoped
router.get('/', authMiddleware, async (req, res) => {
  const rows = await query('SELECT value FROM app_data WHERE user_id = $1 AND key = $2', [req.user.id, 'state']);
  if (rows.length === 0) return res.json(null);
  try { res.json(JSON.parse(rows[0].value)); } catch { res.json(null); }
});

// PUT /api/data — requires auth, user-scoped
router.put('/', authMiddleware, async (req, res) => {
  const value = JSON.stringify(req.body);
  if (USE_PG()) {
    await query(
      'INSERT INTO app_data (user_id, key, value) VALUES ($1, $2, $3) ON CONFLICT (user_id, key) DO UPDATE SET value=$3',
      [req.user.id, 'state', value]
    );
  } else {
    await query(
      'INSERT OR REPLACE INTO app_data (user_id, key, value) VALUES ($1, $2, $3)',
      [req.user.id, 'state', value]
    );
  }
  res.json({ ok: true });
});

// GET /api/data/public/:token — viewer mode, no auth
router.get('/public/:token', async (req, res) => {
  const userRows = await query('SELECT id FROM users WHERE public_token = $1 AND plan = $2', [req.params.token, 'pro']);
  if (userRows.length === 0) return res.status(404).json({ error: 'Link không hợp lệ' });
  const rows = await query('SELECT value FROM app_data WHERE user_id = $1 AND key = $2', [userRows[0].id, 'state']);
  if (rows.length === 0) return res.json(null);
  try { res.json(JSON.parse(rows[0].value)); } catch { res.json(null); }
});

function USE_PG() { return !!process.env.DATABASE_URL; }

module.exports = router;
