const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Thiếu mật khẩu' });

  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get('admin');
  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return res.status(401).json({ error: 'Mật khẩu không đúng' });
  }

  const token = jwt.sign({ id: admin.id }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token });
});

router.post('/change-password', authMiddleware, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Thiếu thông tin' });
  if (newPassword.length < 4) return res.status(400).json({ error: 'Mật khẩu mới tối thiểu 4 ký tự' });

  const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.admin.id);
  if (!bcrypt.compareSync(currentPassword, admin.password_hash)) {
    return res.status(401).json({ error: 'Mật khẩu hiện tại không đúng' });
  }

  db.prepare('UPDATE admins SET password_hash=? WHERE id=?').run(bcrypt.hashSync(newPassword, 10), req.admin.id);
  res.json({ ok: true });
});

module.exports = router;
