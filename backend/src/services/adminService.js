const crypto = require('crypto');
const db = require('../db/database');
const { hashPassword, getUserById, getRoleById } = require('./authService');

const DEFAULT_SYSTEM_SETTINGS = {
  signupsEnabled: true,
  maintenanceMode: false,
  defaultInterestRate: 5.5,
  sessionTimeoutMinutes: 30,
  maxLoginAttempts: 5,
  backupSchedule: 'daily',
  backupRetentionDays: 30,
  appName: 'Truck Turnaround & Operations Control System',
  supportEmail: 'support@truckcontrol.local'
};

function getJsonSetting(key, fallback) {
  const row = db.prepare('SELECT value FROM system_settings WHERE key = ?').get(key);
  if (!row) return fallback;
  try {
    return JSON.parse(row.value);
  } catch {
    return row.value;
  }
}

function setJsonSetting(key, value) {
  db.prepare(`
    INSERT INTO system_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `).run(key, typeof value === 'string' ? value : JSON.stringify(value));
}

function getSystemSettings() {
  const settings = { ...DEFAULT_SYSTEM_SETTINGS };
  const rows = db.prepare('SELECT key, value FROM system_settings').all();
  rows.forEach(r => {
    try {
      settings[r.key] = JSON.parse(r.value);
    } catch {
      settings[r.key] = r.value;
    }
  });
  return settings;
}

function updateSystemSettings(patch, user) {
  const current = getSystemSettings();
  const next = { ...current, ...patch };
  Object.entries(patch).forEach(([key, value]) => {
    setJsonSetting(key, value);
  });
  logAuditEntry('Updated System Settings', 'settings', 'settings', JSON.stringify(patch), user);
  return next;
}

function isMaintenanceMode() {
  return !!getSystemSettings().maintenanceMode;
}

function listAuditLogs(limit = 200) {
  return db.prepare(`
    SELECT id, user_id AS userId, username, action, target_id AS targetId, target_type AS targetType,
           timestamp, ip_address AS ipAddress, details
    FROM audit_logs ORDER BY timestamp DESC LIMIT ?
  `).all(limit).map(r => ({
    id: `LOG-${String(r.id).padStart(4, '0')}`,
    userId: r.userId,
    username: r.username,
    action: r.action,
    targetId: r.targetId || '',
    targetType: r.targetType || 'system',
    timestamp: r.timestamp,
    ipAddress: r.ipAddress || '',
    details: r.details || ''
  }));
}

function logAuditEntry(action, targetId, targetType, details, user = {}) {
  db.prepare(`
    INSERT INTO audit_logs (user_id, username, action, target_id, target_type, ip_address, details)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    user.id || user.userId || null,
    user.username || 'system',
    action,
    targetId || null,
    targetType || 'system',
    user.ipAddress || '',
    typeof details === 'string' ? details : JSON.stringify(details || {})
  );
}

function formatUserRow(u) {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    roleId: u.role_id,
    status: u.status,
    area: u.area,
    assignedAreas: JSON.parse(u.assigned_areas || '[]'),
    modulePermissions: JSON.parse(u.module_permissions || '{}'),
    phone: u.phone,
    createdAt: u.created_at,
    lastLogin: u.last_login,
    bannedReason: u.banned_reason || ''
  };
}

function createUser(payload, actor) {
  const id = payload.id || `ADM-${Date.now()}`;
  const passwordHash = payload.password
    ? hashPassword(payload.password)
    : hashPassword(crypto.randomBytes(8).toString('hex'));
  db.prepare(`
    INSERT INTO users (id, username, email, password_hash, role_id, status, area, assigned_areas, module_permissions, phone)
    VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)
  `).run(
    id,
    payload.username,
    payload.email || '',
    passwordHash,
    payload.roleId,
    payload.area || '',
    JSON.stringify(payload.assignedAreas || [payload.area].filter(Boolean)),
    JSON.stringify(payload.modulePermissions || {}),
    payload.phone || ''
  );
  logAuditEntry(`Created User ${id}`, id, 'user', `Role: ${payload.roleId}`, actor);
  return formatUserRow(getUserById(id));
}

function updateUser(userId, payload, actor) {
  const user = getUserById(userId);
  if (!user) throw new Error('User not found');
  db.prepare(`
    UPDATE users SET
      username = COALESCE(?, username),
      email = COALESCE(?, email),
      role_id = COALESCE(?, role_id),
      area = COALESCE(?, area),
      assigned_areas = COALESCE(?, assigned_areas),
      module_permissions = COALESCE(?, module_permissions),
      phone = COALESCE(?, phone)
    WHERE id = ?
  `).run(
    payload.username ?? null,
    payload.email ?? null,
    payload.roleId ?? null,
    payload.area ?? null,
    payload.assignedAreas ? JSON.stringify(payload.assignedAreas) : null,
    payload.modulePermissions ? JSON.stringify(payload.modulePermissions) : null,
    payload.phone ?? null,
    userId
  );
  logAuditEntry(`Updated User ${userId}`, userId, 'user', JSON.stringify(payload), actor);
  return formatUserRow(getUserById(userId));
}

function banUser(userId, reason, actor) {
  const user = getUserById(userId);
  if (!user) throw new Error('User not found');
  db.prepare(`UPDATE users SET status = 'banned', banned_reason = ? WHERE id = ?`).run(reason || '', userId);
  logAuditEntry(`Banned User ${userId}`, userId, 'user', reason || '', actor);
  return formatUserRow(getUserById(userId));
}

function purgeUser(userId, actor) {
  const user = getUserById(userId);
  if (!user) throw new Error('User not found');
  db.prepare('DELETE FROM user_area_assignments WHERE user_id = ?').run(userId);
  db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  logAuditEntry(`PERMANENTLY PURGED User ${userId}`, userId, 'user', 'Hard delete', actor);
  return { ok: true };
}

function resetUserPassword(userId, actor) {
  const user = getUserById(userId);
  if (!user) throw new Error('User not found');
  const temp = crypto.randomBytes(6).toString('hex');
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(temp), userId);
  logAuditEntry(`Reset Password for ${userId}`, userId, 'user', 'Password reset via admin panel', actor);
  return { ok: true, temporaryPassword: temp };
}

function createRole(payload, actor) {
  const id = payload.id || `role-custom-${Date.now()}`;
  db.prepare(`
    INSERT INTO roles (id, name, description, permissions, system)
    VALUES (?, ?, ?, ?, 0)
  `).run(id, payload.name, payload.description || '', JSON.stringify(payload.permissions || []));
  logAuditEntry(`Created Role ${id}`, id, 'role', payload.name, actor);
  return { id, name: payload.name, description: payload.description, system: false, permissions: payload.permissions || [] };
}

function updateRole(roleId, payload, actor) {
  const role = getRoleById(roleId);
  if (!role) throw new Error('Role not found');
  if (role.system === 1 && payload.name && payload.name !== role.name) {
    throw new Error('Cannot rename system role');
  }
  db.prepare(`
    UPDATE roles SET
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      permissions = COALESCE(?, permissions)
    WHERE id = ?
  `).run(
    payload.name ?? null,
    payload.description ?? null,
    payload.permissions ? JSON.stringify(payload.permissions) : null,
    roleId
  );
  logAuditEntry(`Updated Role ${roleId}`, roleId, 'role', JSON.stringify(payload.permissions || []), actor);
  const updated = getRoleById(roleId);
  return {
    id: updated.id,
    name: updated.name,
    description: updated.description,
    system: updated.system === 1,
    permissions: JSON.parse(updated.permissions || '[]')
  };
}

function deleteRole(roleId, actor) {
  const role = getRoleById(roleId);
  if (!role) throw new Error('Role not found');
  if (role.system === 1) throw new Error('Cannot delete system role');
  const count = db.prepare('SELECT COUNT(*) AS c FROM users WHERE role_id = ?').get(roleId).c;
  if (count > 0) throw new Error('Cannot delete role — users are still assigned');
  db.prepare('DELETE FROM roles WHERE id = ?').run(roleId);
  logAuditEntry(`Deleted Role ${roleId}`, roleId, 'role', '', actor);
  return { ok: true };
}

function getAreaStatusesFull() {
  return getJsonSetting('area_statuses_full', null);
}

function saveAreaStatusesFull(records, actor) {
  setJsonSetting('area_statuses_full', records);
  records.forEach(rec => {
    if (!rec.area) return;
    const statuses = [...new Set([...(rec.statusesNB || []), ...(rec.statusesSB || [])])];
    db.prepare(`
      INSERT INTO area_status_lists (id, area, statuses, active)
      VALUES (?, ?, ?, 1)
      ON CONFLICT(area) DO UPDATE SET statuses = excluded.statuses, active = 1
    `).run(rec.id || `AS-${rec.area}`, rec.area, JSON.stringify(statuses));
  });
  logAuditEntry('Updated area status lists', 'area_statuses', 'area_status', `${records.length} areas`, actor);
  return records;
}

function getGlobalStatusLists() {
  return getJsonSetting('global_status_lists', null);
}

function saveGlobalStatusLists(lists, actor) {
  setJsonSetting('global_status_lists', lists);
  logAuditEntry('Updated global status lists', 'global_status', 'area_status', Object.keys(lists || {}).join(', '), actor);
  return lists;
}

function saveAreaAssignment(userId, username, assignedAreas, actor) {
  db.prepare(`
    INSERT INTO user_area_assignments (user_id, username, assigned_areas, updated_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET assigned_areas = excluded.assigned_areas, username = excluded.username, updated_at = datetime('now')
  `).run(userId, username, JSON.stringify(assignedAreas));
  db.prepare('UPDATE users SET assigned_areas = ?, area = ? WHERE id = ?').run(
    JSON.stringify(assignedAreas),
    assignedAreas.includes('All Areas') ? 'All Areas' : (assignedAreas[0] || ''),
    userId
  );
  logAuditEntry(`Assigned areas to ${username}`, userId, 'user', assignedAreas.join(', '), actor);
  return { ok: true };
}

function saveModulePermissions(userId, modulePermissions, actor) {
  const user = getUserById(userId);
  if (!user) throw new Error('User not found');
  db.prepare('UPDATE users SET module_permissions = ? WHERE id = ?').run(JSON.stringify(modulePermissions), userId);
  logAuditEntry(`Updated module permissions for ${user.username}`, userId, 'user', '', actor);
  return formatUserRow(getUserById(userId));
}

function getUploadTemplates() {
  return getJsonSetting('upload_templates', null);
}

function saveUploadTemplates(templates, actor) {
  setJsonSetting('upload_templates', templates);
  logAuditEntry('Updated upload templates', 'upload_templates', 'template', Object.keys(templates || {}).join(', '), actor);
  return templates;
}

module.exports = {
  getSystemSettings,
  updateSystemSettings,
  isMaintenanceMode,
  listAuditLogs,
  logAuditEntry,
  createUser,
  updateUser,
  banUser,
  purgeUser,
  resetUserPassword,
  createRole,
  updateRole,
  deleteRole,
  getAreaStatusesFull,
  saveAreaStatusesFull,
  getGlobalStatusLists,
  saveGlobalStatusLists,
  saveAreaAssignment,
  saveModulePermissions,
  getUploadTemplates,
  saveUploadTemplates
};
