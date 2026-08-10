const db = require('../db/database');
const adminService = require('./adminService');

function getJsonSetting(key, fallback) {
  const row = db.prepare('SELECT value FROM system_settings WHERE key = ?').get(key);
  if (!row) return fallback;
  try { return JSON.parse(row.value); } catch (_) { return row.value; }
}

function setJsonSetting(key, value) {
  db.prepare(`
    INSERT INTO system_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `).run(key, typeof value === 'string' ? value : JSON.stringify(value));
}

const DEFAULT_SETTINGS = {
  slaByPriority: {
    urgent: { firstResponseHours: 1, resolutionHours: 4 },
    high: { firstResponseHours: 2, resolutionHours: 8 },
    normal: { firstResponseHours: 4, resolutionHours: 24 },
    low: { firstResponseHours: 8, resolutionHours: 48 }
  },
  categories: ['Bug / Error', 'Access / Permissions', 'Data Issue', 'Workflow', 'Performance', 'Feature Request', 'Other'],
  autoAssignTechTeam: true,
  notifyOnOverdue: true
};

function isTechTeamUser(user) {
  const role = user?.roleName || user?.role || '';
  const perms = user?.permissions || [];
  return role === 'Super Admin' || role === 'Manager'
    || perms.includes('*')
    || perms.includes('manage_settings')
    || perms.includes('manage_users');
}

function getSettings() {
  return { ...DEFAULT_SETTINGS, ...getJsonSetting('helpdesk_settings', {}) };
}

function saveSettings(patch, user) {
  const next = { ...getSettings(), ...patch };
  setJsonSetting('helpdesk_settings', next);
  adminService.logAuditEntry('Updated Helpdesk settings', 'helpdesk_settings', 'settings', JSON.stringify(patch), user);
  return next;
}

function rowToComment(r) {
  return {
    id: r.id, ticketId: r.ticket_id, authorUserId: r.author_user_id,
    authorUsername: r.author_username, body: r.body,
    isInternal: !!r.is_internal, createdAt: r.created_at
  };
}

function rowToTicket(r, comments) {
  return {
    id: r.id, ticketNumber: r.ticket_number, subject: r.subject,
    description: r.description, category: r.category, priority: r.priority,
    status: r.status, modulePage: r.module_page, browserInfo: r.browser_info,
    reporterUserId: r.reporter_user_id, reporterUsername: r.reporter_username,
    assigneeUserId: r.assignee_user_id, assigneeUsername: r.assignee_username,
    area: r.area, relatedType: r.related_type, relatedRef: r.related_ref,
    targetResolveAt: r.target_resolve_at,
    targetFirstResponseAt: r.target_first_response_at,
    firstResponseAt: r.first_response_at,
    resolvedAt: r.resolved_at, closedAt: r.closed_at,
    createdAt: r.created_at, updatedAt: r.updated_at,
    comments: comments || []
  };
}

function computeTargetResolveAt(priority, createdAt) {
  const settings = getSettings();
  const sla = settings.slaByPriority[priority] || settings.slaByPriority.normal;
  const base = createdAt ? new Date(createdAt.replace(' ', 'T')) : new Date();
  const target = new Date(base.getTime() + (sla.resolutionHours || 24) * 3600000);
  return target.toISOString().slice(0, 19).replace('T', ' ');
}

function computeTargetFirstResponseAt(priority, createdAt) {
  const settings = getSettings();
  const sla = settings.slaByPriority[priority] || settings.slaByPriority.normal;
  const base = createdAt ? new Date(createdAt.replace(' ', 'T')) : new Date();
  const target = new Date(base.getTime() + (sla.firstResponseHours || 4) * 3600000);
  return target.toISOString().slice(0, 19).replace('T', ' ');
}

function listComments(ticketId) {
  return db.prepare('SELECT * FROM helpdesk_comments WHERE ticket_id = ? ORDER BY created_at ASC').all(ticketId)
    .map(rowToComment);
}

function listTickets(filters = {}) {
  let sql = 'SELECT * FROM helpdesk_tickets WHERE 1=1';
  const params = [];
  if (filters.status && filters.status !== 'all') { sql += ' AND status = ?'; params.push(filters.status); }
  if (filters.priority && filters.priority !== 'all') { sql += ' AND priority = ?'; params.push(filters.priority); }
  if (filters.reporterUserId) { sql += ' AND reporter_user_id = ?'; params.push(filters.reporterUserId); }
  if (filters.assigneeUserId) { sql += ' AND assignee_user_id = ?'; params.push(filters.assigneeUserId); }
  if (filters.openOnly) { sql += " AND status NOT IN ('resolved', 'closed')"; }
  sql += ' ORDER BY created_at DESC';
  const limit = Math.min(parseInt(filters.limit, 10) || 500, 1000);
  sql += ` LIMIT ${limit}`;
  return db.prepare(sql).all(...params).map(r => rowToTicket(r, listComments(r.id)));
}

function getTicketById(id) {
  const r = db.prepare('SELECT * FROM helpdesk_tickets WHERE id = ?').get(id);
  return r ? rowToTicket(r, listComments(id)) : null;
}

function nextTicketNumber() {
  const row = db.prepare("SELECT ticket_number FROM helpdesk_tickets WHERE ticket_number LIKE 'HD-%' ORDER BY ticket_number DESC LIMIT 1").get();
  if (!row) return 'HD-10001';
  const n = parseInt(String(row.ticket_number).replace('HD-', ''), 10);
  return `HD-${(n + 1) || 10001}`;
}

function canUserAccessTicket(ticket, user) {
  if (!ticket || !user) return false;
  if (isTechTeamUser(user)) return true;
  const userId = user.id || user.userId;
  return ticket.reporterUserId === userId || ticket.reporterUsername === user.username;
}

function upsertTicket(body, user) {
  const id = body.id || `HDT-${Date.now()}`;
  const existing = db.prepare('SELECT * FROM helpdesk_tickets WHERE id = ?').get(id);

  if (existing) {
    if (!canUserAccessTicket(rowToTicket(existing, []), user)) {
      throw new Error('Not authorized to update this ticket');
    }
    const isTech = isTechTeamUser(user);
    const priority = body.priority !== undefined ? body.priority : existing.priority;
    const priorityChanged = body.priority !== undefined && body.priority !== existing.priority;
    const createdAt = existing.created_at;
    let targetResolveAt = existing.target_resolve_at;
    let targetFirstResponseAt = existing.target_first_response_at;
    if (body.targetResolveAt !== undefined) targetResolveAt = body.targetResolveAt;
    else if (priorityChanged) targetResolveAt = computeTargetResolveAt(priority, createdAt);
    if (body.targetFirstResponseAt !== undefined) targetFirstResponseAt = body.targetFirstResponseAt;
    else if (priorityChanged) targetFirstResponseAt = computeTargetFirstResponseAt(priority, createdAt);

    const status = body.status !== undefined ? body.status : existing.status;
    const resolvedAt = status === 'resolved'
      ? (body.resolvedAt || existing.resolved_at || new Date().toISOString().slice(0, 19).replace('T', ' '))
      : (body.resolvedAt !== undefined ? body.resolvedAt : existing.resolved_at);
    const closedAt = status === 'closed'
      ? (body.closedAt || existing.closed_at || new Date().toISOString().slice(0, 19).replace('T', ' '))
      : (body.closedAt !== undefined ? body.closedAt : existing.closed_at);

    const subject = body.subject !== undefined ? (String(body.subject).trim() || existing.subject) : existing.subject;
    const description = body.description !== undefined ? body.description : existing.description;
    const category = body.category !== undefined ? body.category : existing.category;
    const modulePage = body.modulePage !== undefined ? body.modulePage : existing.module_page;
    const browserInfo = body.browserInfo !== undefined ? body.browserInfo : existing.browser_info;
    const area = body.area !== undefined ? body.area : existing.area;
    const relatedType = body.relatedType !== undefined ? body.relatedType : existing.related_type;
    const relatedRef = body.relatedRef !== undefined ? body.relatedRef : existing.related_ref;
    const assigneeUserId = isTech && body.assigneeUserId !== undefined ? body.assigneeUserId : existing.assignee_user_id;
    const assigneeUsername = isTech && body.assigneeUsername !== undefined ? body.assigneeUsername : existing.assignee_username;
    const firstResponseAt = body.firstResponseAt !== undefined ? body.firstResponseAt : existing.first_response_at;

    db.prepare(`
      UPDATE helpdesk_tickets SET
        subject = ?, description = ?, category = ?, priority = ?, status = ?,
        module_page = ?, browser_info = ?, assignee_user_id = ?, assignee_username = ?,
        area = ?, related_type = ?, related_ref = ?,
        target_resolve_at = ?, target_first_response_at = ?,
        first_response_at = ?, resolved_at = ?, closed_at = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      subject, description, category, priority, status,
      modulePage, browserInfo, assigneeUserId, assigneeUsername,
      area, relatedType, relatedRef,
      targetResolveAt, targetFirstResponseAt,
      firstResponseAt, resolvedAt, closedAt,
      id
    );

    adminService.logAuditEntry(`Updated helpdesk ticket ${existing.ticket_number}`, id, 'helpdesk', subject, user);
    return getTicketById(id);
  }

  const subject = (body.subject || '').trim();
  if (!subject) throw new Error('Subject is required');
  const priority = body.priority || 'normal';
  const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const ticketNumber = body.ticketNumber || nextTicketNumber();
  const targetResolveAt = body.targetResolveAt || computeTargetResolveAt(priority, createdAt);
  const targetFirstResponseAt = body.targetFirstResponseAt || computeTargetFirstResponseAt(priority, createdAt);
  const status = body.status || 'open';

  db.prepare(`
    INSERT INTO helpdesk_tickets (
      id, ticket_number, subject, description, category, priority, status,
      module_page, browser_info, reporter_user_id, reporter_username,
      assignee_user_id, assignee_username, area, related_type, related_ref,
      target_resolve_at, target_first_response_at, first_response_at, resolved_at, closed_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(
    id, ticketNumber, subject,
    body.description || '',
    body.category || 'Other',
    priority, status,
    body.modulePage || '', body.browserInfo || '',
    body.reporterUserId || user?.id || user?.userId || null,
    body.reporterUsername || user?.username || 'user',
    body.assigneeUserId || null, body.assigneeUsername || null,
    body.area || '', body.relatedType || '', body.relatedRef || '',
    targetResolveAt, targetFirstResponseAt, null, null, null,
    createdAt
  );

  adminService.logAuditEntry(`Created helpdesk ticket ${ticketNumber}`, id, 'helpdesk', subject, user);
  return getTicketById(id);
}

function addComment(ticketId, body, user) {
  const ticket = getTicketById(ticketId);
  if (!ticket) throw new Error('Ticket not found');
  if (!canUserAccessTicket(ticket, user)) throw new Error('Not authorized to comment on this ticket');

  const isInternal = !!body.isInternal;
  if (isInternal && !isTechTeamUser(user)) throw new Error('Only the technical team can post internal notes');

  const authorId = user?.id || user?.userId || null;
  const authorName = user?.username || 'user';
  const result = db.prepare(`
    INSERT INTO helpdesk_comments (ticket_id, author_user_id, author_username, body, is_internal, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `).run(ticketId, authorId, authorName, body.body || '', isInternal ? 1 : 0);

  if (!ticket.firstResponseAt && authorId !== ticket.reporterUserId && !isInternal) {
    db.prepare(`UPDATE helpdesk_tickets SET first_response_at = datetime('now'), status = CASE WHEN status = 'open' THEN 'in_progress' ELSE status END, updated_at = datetime('now') WHERE id = ?`)
      .run(ticketId);
  }

  if (body.status && isTechTeamUser(user)) {
    db.prepare(`UPDATE helpdesk_tickets SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(body.status, ticketId);
  }

  return rowToComment(db.prepare('SELECT * FROM helpdesk_comments WHERE id = ?').get(result.lastInsertRowid));
}

function getStats(filters = {}) {
  const tickets = listTickets({ ...filters, limit: 1000 });
  const open = tickets.filter(t => !['resolved', 'closed'].includes(t.status));
  const now = new Date();
  const overdue = open.filter(t => t.targetResolveAt && new Date(t.targetResolveAt.replace(' ', 'T')) < now);
  const responseOverdue = open.filter(t => !t.firstResponseAt && t.targetFirstResponseAt && new Date(t.targetFirstResponseAt.replace(' ', 'T')) < now);
  const byStatus = {};
  tickets.forEach(t => { byStatus[t.status] = (byStatus[t.status] || 0) + 1; });
  return {
    total: tickets.length, open: open.length, overdue: overdue.length,
    responseOverdue: responseOverdue.length,
    resolved: tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
    byStatus
  };
}

function getBundle(user, options = {}) {
  const isTech = options.isTechTeam;
  const userId = user?.id || user?.userId;
  const filters = isTech ? { limit: 500 } : { reporterUserId: userId, limit: 200 };
  return {
    tickets: listTickets(filters),
    allTickets: isTech ? listTickets({ limit: 500 }) : undefined,
    settings: getSettings(),
    stats: getStats(isTech ? {} : { reporterUserId: userId })
  };
}

module.exports = {
  getSettings, saveSettings, listTickets, getTicketById, upsertTicket,
  addComment, getStats, getBundle, computeTargetResolveAt, computeTargetFirstResponseAt,
  isTechTeamUser, canUserAccessTicket, DEFAULT_SETTINGS
};
