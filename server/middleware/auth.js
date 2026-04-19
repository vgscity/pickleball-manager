const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'pickleball_secret_2024';

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Chưa đăng nhập' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token không hợp lệ' });
  }
}

function superAdminMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Chưa đăng nhập' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.isSuperAdmin) return res.status(403).json({ error: 'Không có quyền' });
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Token không hợp lệ' });
  }
}

module.exports = { authMiddleware, superAdminMiddleware, JWT_SECRET };
