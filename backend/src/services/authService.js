const crypto = require('crypto');
const db = require('../db/database');
const env = require('../config/env');

const PBKDF2_ITERATIONS = 120000;
const PBKDF2_KEYLEN = 32;
const PBKDF2_DIGEST = 'sha256';

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  const check = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(check, 'hex'));
}

function base64url(input) {
  return Buffer.from(input).toString('base64url');
}

function signToken(payload) {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify({ ...payload, exp: Date.now() + parseExpires(env.jwtExpiresIn) }));
  const sig = crypto.createHmac('sha256', env.jwtSecret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

function verifyToken(token) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token');
  const [header, body, sig] = parts;
  const expected = crypto.createHmac('sha256', env.jwtSecret).update(`${header}.${body}`).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    throw new Error('Invalid token signature');
  }
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
  if (payload.exp && Date.now() > payload.exp) throw new Error('Session expired');
  const user = getUserById(payload.sub);
  if (!user || user.status !== 'active') throw new Error('User inactive or not found');
  return formatUserSession(user);
}

function parseExpires(str) {
  const m = String(str).match(/^(\d+)([smhd])$/);
  if (!m) return 12 * 60 * 60 * 1000;
  const n = parseInt(m[1], 10);
  const unit = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[m[2]];
  return n * unit;
}

function getRoleById(roleId) {
  return db.prepare('SELECT * FROM roles WHERE id = ?').get(roleId);
}

function getUserById(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

function getUserByUsername(username) {
  return db.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE').get(username);
}

function formatUserSession(user) {
  const role = getRoleById(user.role_id);
  const permissions = role ? JSON.parse(role.permissions || '[]') : [];
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    roleId: user.role_id,
    roleName: role?.name || 'User',
    status: user.status,
    area: user.area,
    assignedAreas: JSON.parse(user.assigned_areas || '[]'),
    modulePermissions: JSON.parse(user.module_permissions || '{}'),
    permissions: role?.name === 'Super Admin' ? ['*'] : permissions,
    phone: user.phone
  };
}

function login(username, password, ipAddress) {
  const user = getUserByUsername(username);
  if (!user) throw new Error('Invalid username or password');
  if (user.status !== 'active') throw new Error('Account is not active');
  if (!verifyPassword(password, user.password_hash)) throw new Error('Invalid username or password');

  const { isMaintenanceMode } = require('./adminService');
  if (isMaintenanceMode()) {
    const role = getRoleById(user.role_id);
    if (role?.name !== 'Super Admin') {
      throw new Error('System is in maintenance mode. Only Super Admin can log in.');
    }
  }

  db.prepare(`UPDATE users SET last_login = datetime('now') WHERE id = ?`).run(user.id);
  db.prepare(`
    INSERT INTO audit_logs (user_id, username, action, target_type, ip_address, details)
    VALUES (?, ?, 'User login', 'session', ?, 'Successful login')
  `).run(user.id, user.username, ipAddress || '');

  const session = formatUserSession(user);
  const token = signToken({ sub: user.id, username: user.username, roleId: user.role_id });
  return { token, user: session };
}

function listUsers() {
  return db.prepare('SELECT id, username, email, role_id, status, area, assigned_areas, phone, created_at, last_login FROM users ORDER BY username').all()
    .map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      roleId: u.role_id,
      status: u.status,
      area: u.area,
      assignedAreas: JSON.parse(u.assigned_areas || '[]'),
      phone: u.phone,
      createdAt: u.created_at,
      lastLogin: u.last_login
    }));
}

function listRoles() {
  return db.prepare('SELECT * FROM roles ORDER BY name').all().map(r => ({
    id: r.id,
    name: r.name,
    description: r.description,
    system: r.system === 1,
    permissions: JSON.parse(r.permissions || '[]')
  }));
}

module.exports = {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  login,
  listUsers,
  listRoles,
  getUserById,
  formatUserSession
};
