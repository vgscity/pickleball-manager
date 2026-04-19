const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { query, USE_PG } = require('../db');
const { superAdminMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/superadmin/needs-setup — public, kiểm tra đã có super admin chưa
router.get('/needs-setup', async (req, res) => {
  try {
    const rows = await query('SELECT id FROM users WHERE is_super_admin = $1 LIMIT 1', [USE_PG ? true : 1]);
    res.json({ needsSetup: rows.length === 0 });
  } catch (e) {
    res.json({ needsSetup: false });
  }
});

// POST /api/superadmin/setup — tạo super admin lần đầu, chỉ hoạt động khi chưa có ai
router.post('/setup', async (req, res) => {
  try {
    const rows = await query('SELECT id FROM users WHERE is_super_admin = $1 LIMIT 1', [USE_PG ? true : 1]);
    if (rows.length > 0) {
      return res.status(403).json({ error: 'Super admin đã được thiết lập' });
    }

    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Thiếu email hoặc mật khẩu' });
    if (password.length < 6) return res.status(400).json({ error: 'Mật khẩu tối thiểu 6 ký tự' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Email không hợp lệ' });

    const hash = bcrypt.hashSync(password, 10);
    const isSuper = USE_PG ? true : 1;

    // Nếu email đã tồn tại (đã đăng ký CLB trước) → nâng cấp lên super admin
    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.length > 0) {
      await query('UPDATE users SET is_super_admin=$1, plan=$2, password_hash=$3 WHERE email=$4',
        [isSuper, 'pro', hash, email.toLowerCase()]);
    } else {
      await query(
        'INSERT INTO users (email, password_hash, club_name, plan, is_super_admin) VALUES ($1, $2, $3, $4, $5)',
        [email.toLowerCase(), hash, 'Super Admin', 'pro', isSuper]
      );
    }

    console.log(`Super admin đã được tạo: ${email}`);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

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
