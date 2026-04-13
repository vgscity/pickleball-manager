const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Thiếu mật khẩu' });

  const { rows } = await pool.query('SELECT * FROM admins WHERE username = $1', ['admin']);
  const admin = rows[0];
  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return res.status(401).json({ error: 'Mật khẩu không đúng' });
  }

  const token = jwt.sign({ id: admin.id }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token });
});

router.post('/change-password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Thiếu thông tin' });
  if (newPassword.length < 4) return res.status(400).json({ error: 'Mật khẩu mới tối thiểu 4 ký tự' });

  const { rows } = await pool.query('SELECT * FROM admins WHERE id = $1', [req.admin.id]);
  const admin = rows[0];
  if (!bcrypt.compareSync(currentPassword, admin.password_hash)) {
    return res.status(401).json({ error: 'Mật khẩu hiện tại không đúng' });
  }

  await pool.query('UPDATE admins SET password_hash=$1 WHERE id=$2', [bcrypt.hashSync(newPassword, 10), req.admin.id]);
  res.json({ ok: true });
});

module.exports = router;
