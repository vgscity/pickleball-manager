const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('../db');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// ─── Đăng ký ─────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { email, password, clubName } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Thiếu email hoặc mật khẩu' });
  if (password.length < 6) return res.status(400).json({ error: 'Mật khẩu tối thiểu 6 ký tự' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Email không hợp lệ' });

  const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
  if (existing.length > 0) return res.status(409).json({ error: 'Email đã được đăng ký' });

  const hash = bcrypt.hashSync(password, 10);
  await query(
    'INSERT INTO users (email, password_hash, club_name, plan) VALUES ($1, $2, $3, $4)',
    [email.toLowerCase(), hash, clubName || '', 'free']
  );

  const rows = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
  const user = rows[0];
  const token = jwt.sign({ id: user.id, email: user.email, plan: user.plan, isSuperAdmin: false }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, plan: 'free', clubName: user.club_name, email: user.email });
});

// ─── Đăng nhập ────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Thiếu thông tin' });

  const rows = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
  const user = rows[0];
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
  }

  const isSuperAdmin = user.is_super_admin === true || user.is_super_admin === 1;
  const token = jwt.sign(
    { id: user.id, email: user.email, plan: user.plan, isSuperAdmin },
    JWT_SECRET, { expiresIn: '30d' }
  );
  res.json({ token, plan: user.plan, clubName: user.club_name, email: user.email, isSuperAdmin });
});

// ─── Đổi mật khẩu ────────────────────────────────────────────────────────────
router.post('/change-password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Thiếu thông tin' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'Mật khẩu mới tối thiểu 6 ký tự' });

  const rows = await query('SELECT * FROM users WHERE id = $1', [req.user.id]);
  const user = rows[0];
  if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
    return res.status(401).json({ error: 'Mật khẩu hiện tại không đúng' });
  }

  await query('UPDATE users SET password_hash=$1 WHERE id=$2', [bcrypt.hashSync(newPassword, 10), req.user.id]);
  res.json({ ok: true });
});

// ─── Thông tin user hiện tại ─────────────────────────────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
  const rows = await query('SELECT id, email, club_name, plan, public_token, is_super_admin FROM users WHERE id=$1', [req.user.id]);
  const u = rows[0];
  if (!u) return res.status(404).json({ error: 'Không tìm thấy' });
  res.json({
    id: u.id,
    email: u.email,
    clubName: u.club_name,
    plan: u.plan,
    publicToken: u.public_token,
    isSuperAdmin: u.is_super_admin === true || u.is_super_admin === 1,
  });
});

module.exports = router;
