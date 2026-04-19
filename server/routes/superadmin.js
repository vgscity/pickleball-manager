const express = require('express');
const crypto = require('crypto');
const { query } = require('../db');
const { superAdminMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/superadmin/users
router.get('/users', superAdminMiddleware, async (req, res) => {
  const rows = await query(
    'SELECT id, email, club_name, plan, public_token, created_at FROM users WHERE is_super_admin = $1 ORDER BY created_at DESC',
    [process.env.DATABASE_URL ? false : 0]
  );
  res.json(rows);
});

// PUT /api/superadmin/users/:id/plan
router.put('/users/:id/plan', superAdminMiddleware, async (req, res) => {
  const { plan } = req.body;
  if (!['free', 'pro'].includes(plan)) return res.status(400).json({ error: 'Plan không hợp lệ' });

  let publicToken = null;
  if (plan === 'pro') {
    const existing = await query('SELECT public_token FROM users WHERE id = $1', [req.params.id]);
    publicToken = existing[0]?.public_token || crypto.randomBytes(12).toString('hex');
    await query('UPDATE users SET plan=$1, public_token=$2 WHERE id=$3', [plan, publicToken, req.params.id]);
  } else {
    await query('UPDATE users SET plan=$1 WHERE id=$2', [plan, req.params.id]);
  }

  res.json({ ok: true, publicToken });
});

// DELETE /api/superadmin/users/:id
router.delete('/users/:id', superAdminMiddleware, async (req, res) => {
  await query('DELETE FROM users WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
