const { randomUUID } = require('crypto');
const db = require('../db/database');

function rowToContact(row) {
  if (!row) return null;
  return {
    id: row.id,
    tripNumber: row.trip_number,
    driverName: row.driver_name,
    truck: row.truck,
    direction: row.direction,
    border: row.border,
    owner: row.owner,
    drcNumber: row.drc_number,
    whatsapp: row.whatsapp,
    registeredBy: row.registered_by,
    registeredAt: row.registered_at,
    updatedAt: row.updated_at,
    notes: row.notes || ''
  };
}

function listDriverContacts(filters = {}) {
  let sql = 'SELECT * FROM driver_contacts WHERE 1=1';
  const params = [];

  if (filters.direction && filters.direction !== 'all') {
    sql += ' AND direction = ?';
    params.push(filters.direction);
  }
  if (filters.border && filters.border !== 'all') {
    sql += ' AND border = ?';
    params.push(filters.border);
  }
  if (filters.registered === 'yes') {
    sql += ' AND drc_number IS NOT NULL AND drc_number != \'\' AND whatsapp IS NOT NULL AND whatsapp != \'\'';
  }
  if (filters.registered === 'no') {
    sql += ' AND (drc_number IS NULL OR drc_number = \'\' OR whatsapp IS NULL OR whatsapp = \'\')';
  }

  sql += ' ORDER BY datetime(registered_at) DESC';

  let rows = db.prepare(sql).all(...params);

  if (filters.search) {
    const term = filters.search.toLowerCase();
    rows = rows.filter(r =>
      (r.driver_name && r.driver_name.toLowerCase().includes(term)) ||
      (r.trip_number && r.trip_number.toLowerCase().includes(term)) ||
      (r.truck && r.truck.toLowerCase().includes(term)) ||
      (r.drc_number && r.drc_number.includes(term)) ||
      (r.whatsapp && r.whatsapp.includes(term)) ||
      (r.owner && r.owner.toLowerCase().includes(term)) ||
      (r.border && r.border.toLowerCase().includes(term))
    );
  }

  return rows.map(rowToContact);
}

function getDriverContactById(id) {
  const row = db.prepare('SELECT * FROM driver_contacts WHERE id = ?').get(id);
  return rowToContact(row);
}

function getDriverContactByTrip(tripNumber) {
  const row = db.prepare(
    'SELECT * FROM driver_contacts WHERE trip_number = ? ORDER BY datetime(updated_at) DESC LIMIT 1'
  ).get(tripNumber);
  return rowToContact(row);
}

function upsertDriverContact(payload, user) {
  const {
    id,
    tripNumber,
    driverName,
    truck,
    direction,
    border,
    owner,
    drcNumber,
    whatsapp,
    notes
  } = payload;

  if (!driverName || !String(driverName).trim()) {
    throw new Error('Driver name is required');
  }
  if (!drcNumber || !String(drcNumber).trim()) {
    throw new Error('DRC number is required');
  }
  if (!whatsapp || !String(whatsapp).trim()) {
    throw new Error('WhatsApp number is required');
  }

  const now = new Date().toISOString();
  const registeredBy = user?.username || user?.id || 'system';

  let existing = null;
  if (id) {
    existing = db.prepare('SELECT * FROM driver_contacts WHERE id = ?').get(id);
  } else if (tripNumber) {
    existing = db.prepare('SELECT * FROM driver_contacts WHERE trip_number = ?').get(tripNumber);
  }

  if (existing) {
    db.prepare(`
      UPDATE driver_contacts SET
        trip_number = ?, driver_name = ?, truck = ?, direction = ?, border = ?, owner = ?,
        drc_number = ?, whatsapp = ?, notes = ?, registered_by = ?, updated_at = ?
      WHERE id = ?
    `).run(
      tripNumber || existing.trip_number,
      String(driverName).trim(),
      truck || existing.truck || null,
      direction || existing.direction || 'NB',
      border || existing.border || null,
      owner || existing.owner || null,
      String(drcNumber).trim(),
      String(whatsapp).trim(),
      notes || '',
      registeredBy,
      now,
      existing.id
    );
    return getDriverContactById(existing.id);
  }

  const newId = `DC-${randomUUID().slice(0, 8).toUpperCase()}`;
  db.prepare(`
    INSERT INTO driver_contacts (
      id, trip_number, driver_name, truck, direction, border, owner,
      drc_number, whatsapp, notes, registered_by, registered_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    newId,
    tripNumber || null,
    String(driverName).trim(),
    truck || null,
    direction || 'NB',
    border || null,
    owner || null,
    String(drcNumber).trim(),
    String(whatsapp).trim(),
    notes || '',
    registeredBy,
    now,
    now
  );
  return getDriverContactById(newId);
}

function seedDriverContacts(contacts) {
  if (!Array.isArray(contacts)) return;
  const insert = db.prepare(`
    INSERT OR IGNORE INTO driver_contacts (
      id, trip_number, driver_name, truck, direction, border, owner,
      drc_number, whatsapp, notes, registered_by, registered_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const tx = db.transaction((rows) => {
    rows.forEach(c => {
      insert.run(
        c.id,
        c.tripNumber || null,
        c.driverName,
        c.truck || null,
        c.direction || 'NB',
        c.border || null,
        c.owner || null,
        c.drcNumber,
        c.whatsapp,
        c.notes || '',
        c.registeredBy || 'system',
        c.registeredAt || new Date().toISOString(),
        c.updatedAt || new Date().toISOString()
      );
    });
  });
  tx(contacts);
}

module.exports = {
  listDriverContacts,
  getDriverContactById,
  getDriverContactByTrip,
  upsertDriverContact,
  seedDriverContacts
};
