const { verifyToken } = require('../services/authService');
const env = require('../config/env');

function authenticate(req, res, next) {
  if (!env.requireAuth) {
    req.user = {
      id: req.headers['x-user-id'] || 'ADM-001',
      username: req.headers['x-username'] || 'super_admin',
      roleId: 'role-super-admin',
      roleName: 'Super Admin',
      permissions: ['*']
    };
    return next();
  }

  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch (e) {
    return res.status(401).json({ error: e.message || 'Invalid or expired session' });
  }
}

function requirePermission(...permissions) {
  return (req, res, next) => {
    const userPerms = req.user?.permissions || [];
    if (userPerms.includes('*') || permissions.some(p => userPerms.includes(p))) {
      return next();
    }
    return res.status(403).json({ error: 'Insufficient permissions for this action' });
  };
}

module.exports = { authenticate, requirePermission };
