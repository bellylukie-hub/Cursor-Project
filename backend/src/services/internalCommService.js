const db = require('../db/database');
const { getUserByEmail, getUserByLoginIdentifier } = require('./authService');

function parseJson(val, fallback) {
  if (!val) return fallback;
  try { return JSON.parse(val); } catch { return fallback; }
}

function rowToEmail(row) {
  if (!row) return null;
  return {
    id: row.id,
    from: row.from_name,
    fromEmail: row.from_email,
    to: parseJson(row.to_names, []),
    toEmails: parseJson(row.to_emails, []),
    cc: parseJson(row.cc_emails, []),
    bcc: parseJson(row.bcc_emails, []),
    forUserEmail: row.for_user_email,
    ownerEmail: row.owner_email,
    folder: row.folder,
    subject: row.subject,
    body: row.body,
    sentAt: row.sent_at,
    read: !!row.read_flag,
    starred: !!row.starred,
    important: !!row.important,
    attachments: parseJson(row.attachments, []),
    relatedType: row.related_type || '',
    relatedRef: row.related_ref || '',
    relatedLabel: row.related_label || '',
    threadId: row.thread_id || '',
    mirrorOf: row.mirror_of || null
  };
}

function rowToRoom(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    memberEmails: parseJson(row.member_emails, []),
    memberNames: parseJson(row.member_names, []),
    avatar: row.avatar || '💬',
    lastMessage: row.last_message || '',
    lastAt: row.last_at,
    pinned: !!row.pinned,
    muted: !!row.muted,
    relatedType: row.related_type || 'user',
    relatedRef: row.related_ref || '',
    createdBy: row.created_by_name || '',
    unreadCount: 0
  };
}

function rowToMessage(row) {
  if (!row) return null;
  return {
    id: row.id,
    roomId: row.room_id,
    sender: row.sender_name,
    senderEmail: row.sender_email,
    message: row.message,
    sentAt: row.sent_at,
    status: row.status || 'delivered',
    replyTo: row.reply_to || null,
    attachmentName: row.attachment_name || null
  };
}

function displayNameFromUsername(username) {
  return String(username || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function resolveRecipient(token) {
  const t = String(token || '').trim();
  if (!t) return null;
  if (t.includes('@')) {
    let user = getUserByEmail(t);
    if (!user) {
      user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(t);
    }
    if (user) {
      return { email: user.email, name: displayNameFromUsername(user.username), username: user.username };
    }
    if (t.toLowerCase().endsWith('@truckcontrol.local')) {
      const localUser = getUserByLoginIdentifier(t.split('@')[0]);
      if (localUser) {
        return { email: localUser.email, name: displayNameFromUsername(localUser.username), username: localUser.username };
      }
    }
  }
  let user = getUserByLoginIdentifier(t);
  if (!user) {
    user = db.prepare(`
      SELECT * FROM users WHERE LOWER(username) = LOWER(?)
        OR LOWER(email) = LOWER(?)
        OR LOWER(REPLACE(username, '_', ' ')) = LOWER(?)
    `).get(t, t, t);
  }
  if (!user) return null;
  return { email: user.email, name: displayNameFromUsername(user.username), username: user.username };
}

function insertEmailRecord(record) {
  db.prepare(`
    INSERT INTO internal_emails (
      id, from_email, from_name, to_emails, to_names, cc_emails, bcc_emails,
      for_user_email, owner_email, folder, subject, body, sent_at,
      read_flag, starred, important, attachments, related_type, related_ref, related_label, thread_id, mirror_of
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    record.id,
    record.fromEmail,
    record.fromName,
    JSON.stringify(record.toEmails || []),
    JSON.stringify(record.toNames || []),
    JSON.stringify(record.ccEmails || []),
    JSON.stringify(record.bccEmails || []),
    record.forUserEmail,
    record.ownerEmail || null,
    record.folder,
    record.subject || '',
    record.body || '',
    record.sentAt || new Date().toISOString().slice(0, 16).replace('T', ' '),
    record.read ? 1 : 0,
    record.starred ? 1 : 0,
    record.important ? 1 : 0,
    JSON.stringify(record.attachments || []),
    record.relatedType || '',
    record.relatedRef || '',
    record.relatedLabel || '',
    record.threadId || '',
    record.mirrorOf || null
  );
}

function listMailbox(userEmail) {
  const email = String(userEmail || '').toLowerCase();
  const rows = db.prepare(`
    SELECT * FROM internal_emails
    WHERE LOWER(for_user_email) = ?
    ORDER BY sent_at DESC
  `).all(email);
  return rows.map(rowToEmail);
}

function sendEmail(payload, sender) {
  const senderEmail = String(sender.email || '').toLowerCase();
  const senderName = sender.displayName || sender.username || senderEmail;
  const toTokens = (payload.to || []).map(String);
  const ccTokens = (payload.cc || []).map(String);
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const baseId = payload.id || `EM-${Date.now()}`;
  const threadId = payload.threadId || `TH-${Date.now()}`;

  const bccTokens = (payload.bcc || []).map(String);
  const recipients = [];
  [...toTokens, ...ccTokens, ...bccTokens].forEach(token => {
    const r = resolveRecipient(token);
    if (r && !recipients.find(x => x.email.toLowerCase() === r.email.toLowerCase())) {
      recipients.push(r);
    }
  });

  const toNames = recipients.map(r => r.name);
  const toEmails = recipients.map(r => r.email);

  const sentId = `${baseId}-sent`;
  insertEmailRecord({
    id: sentId,
    fromEmail: senderEmail,
    fromName: senderName,
    toEmails,
    toNames,
    ccEmails: ccTokens.map(t => resolveRecipient(t)?.email).filter(Boolean),
    bccEmails: (payload.bcc || []).map(t => resolveRecipient(t)?.email).filter(Boolean),
    forUserEmail: senderEmail,
    ownerEmail: senderEmail,
    folder: 'sent',
    subject: payload.subject,
    body: payload.body,
    sentAt: now,
    read: true,
    starred: !!payload.starred,
    important: !!payload.important,
    attachments: payload.attachments || [],
    relatedType: payload.relatedType,
    relatedRef: payload.relatedRef,
    relatedLabel: payload.relatedLabel,
    threadId
  });

  recipients.forEach((recipient, idx) => {
    if (recipient.email.toLowerCase() === senderEmail) return;
    insertEmailRecord({
      id: `${baseId}-in-${idx}`,
      fromEmail: senderEmail,
      fromName: senderName,
      toEmails: [recipient.email],
      toNames: [recipient.name],
      ccEmails: [],
      bccEmails: [],
      forUserEmail: recipient.email.toLowerCase(),
      ownerEmail: recipient.email.toLowerCase(),
      folder: 'inbox',
      subject: payload.subject,
      body: payload.body,
      sentAt: now,
      read: false,
      starred: false,
      important: !!payload.important,
      attachments: payload.attachments || [],
      relatedType: payload.relatedType,
      relatedRef: payload.relatedRef,
      relatedLabel: payload.relatedLabel,
      threadId,
      mirrorOf: sentId
    });
  });

  return { ok: true, sentId, deliveredTo: recipients.map(r => r.email) };
}

function updateEmail(emailId, userEmail, patch) {
  const email = String(userEmail || '').toLowerCase();
  const row = db.prepare('SELECT * FROM internal_emails WHERE id = ? AND LOWER(for_user_email) = ?').get(emailId, email);
  if (!row) throw new Error('Email not found');
  const folder = patch.folder ?? row.folder;
  const readFlag = patch.read !== undefined ? (patch.read ? 1 : 0) : row.read_flag;
  const starred = patch.starred !== undefined ? (patch.starred ? 1 : 0) : row.starred;
  db.prepare('UPDATE internal_emails SET folder = ?, read_flag = ?, starred = ? WHERE id = ?').run(folder, readFlag, starred, emailId);
  return rowToEmail(db.prepare('SELECT * FROM internal_emails WHERE id = ?').get(emailId));
}

function listChatData(userEmail) {
  const email = String(userEmail || '').toLowerCase();
  const rooms = db.prepare('SELECT * FROM internal_chat_rooms ORDER BY last_at DESC').all()
    .map(rowToRoom)
    .filter(room => (room.memberEmails || []).some(e => String(e).toLowerCase() === email));
  const roomIds = rooms.map(r => r.id);
  const messages = roomIds.length
    ? db.prepare(`SELECT * FROM internal_chat_messages WHERE room_id IN (${roomIds.map(() => '?').join(',')}) ORDER BY sent_at ASC`).all(...roomIds).map(rowToMessage)
    : [];
  return { rooms, messages };
}

function createChatRoom(payload, sender) {
  const senderEmail = String(sender.email || '').toLowerCase();
  const senderName = sender.displayName || sender.username || senderEmail;
  const memberEmails = [...new Set([senderEmail, ...(payload.memberEmails || []).map(e => String(e).toLowerCase())])];
  const memberNames = payload.memberNames || [];
  const id = payload.id || `ROOM-${Date.now()}`;
  db.prepare(`
    INSERT INTO internal_chat_rooms (id, name, type, member_emails, member_names, avatar, last_message, last_at, pinned, muted, related_type, related_ref, created_by_email, created_by_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), 0, 0, ?, ?, ?, ?)
  `).run(
    id,
    payload.name,
    payload.type || 'direct',
    JSON.stringify(memberEmails),
    JSON.stringify(memberNames),
    payload.avatar || '💬',
    payload.lastMessage || 'Chat started',
    payload.relatedType || 'user',
    payload.relatedRef || '',
    senderEmail,
    senderName
  );
  return rowToRoom(db.prepare('SELECT * FROM internal_chat_rooms WHERE id = ?').get(id));
}

function sendChatMessage(payload, sender) {
  const senderEmail = String(sender.email || '').toLowerCase();
  const senderName = sender.displayName || sender.username || senderEmail;
  const id = payload.id || `MSG-${Date.now()}`;
  const room = db.prepare('SELECT * FROM internal_chat_rooms WHERE id = ?').get(payload.roomId);
  if (!room) throw new Error('Chat room not found');
  const members = parseJson(room.member_emails, []);
  if (!members.some(e => String(e).toLowerCase() === senderEmail)) {
    throw new Error('Not a member of this chat room');
  }
  const preview = payload.attachmentName ? `📎 ${payload.attachmentName}` : (payload.message || '').slice(0, 120);
  db.prepare(`
    INSERT INTO internal_chat_messages (id, room_id, sender_email, sender_name, message, sent_at, status, reply_to, attachment_name)
    VALUES (?, ?, ?, ?, ?, datetime('now'), 'delivered', ?, ?)
  `).run(id, payload.roomId, senderEmail, senderName, payload.message || '', payload.replyTo || null, payload.attachmentName || null);
  db.prepare('UPDATE internal_chat_rooms SET last_message = ?, last_at = datetime(\'now\') WHERE id = ?').run(preview, payload.roomId);
  return rowToMessage(db.prepare('SELECT * FROM internal_chat_messages WHERE id = ?').get(id));
}

function findOrCreateDirectRoom(otherEmail, sender) {
  const senderEmail = String(sender.email || '').toLowerCase();
  const other = String(otherEmail || '').toLowerCase();
  const rooms = db.prepare('SELECT * FROM internal_chat_rooms WHERE type = ?').all('direct');
  for (const row of rooms) {
    const members = parseJson(row.member_emails, []).map(e => String(e).toLowerCase());
    if (members.includes(senderEmail) && members.includes(other)) {
      return rowToRoom(row);
    }
  }
  const otherUser = getUserByEmail(other) || db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(other);
  const otherName = otherUser
    ? displayNameFromUsername(otherUser.username)
    : other;
  return createChatRoom({
    name: otherName,
    type: 'direct',
    memberEmails: [senderEmail, other],
    memberNames: [
      sender.displayName || sender.username,
      otherName
    ],
    avatar: otherName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
    lastMessage: 'Chat started'
  }, sender);
}

module.exports = {
  listMailbox,
  sendEmail,
  updateEmail,
  listChatData,
  createChatRoom,
  sendChatMessage,
  findOrCreateDirectRoom,
  resolveRecipient
};
