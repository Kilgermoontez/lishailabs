const jwt = require('jsonwebtoken');
const AdminModel = require('../models/AdminModel');

const requireAuth = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Authentication required.' });

  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET || 'lishai-development-secret');
  } catch (_) {
    return res.status(401).json({ message: 'Invalid or expired session.' });
  }
  try {
    const admin = await AdminModel.findById(req.admin.id);
    if (!admin) return res.status(401).json({ message: 'Account no longer exists.' });
    req.admin = { ...req.admin, email: admin.email, role: admin.role };
    if (admin.must_reset_password && !(req.method === 'GET' && req.path === '/auth/me')
      && !(req.method === 'PUT' && req.path === '/auth/password')) {
      return res.status(403).json({ message: 'Change your password before accessing the admin console.' });
    }
    return next();
  } catch (error) {
    console.error('Unable to verify admin account:', error);
    return res.status(500).json({ message: 'Unable to verify your account.' });
  }
};

module.exports = { requireAuth };

