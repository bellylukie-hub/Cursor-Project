const db = require('../db/database');

function parseJson(val, fallback) {
  if (!val) return fallback;
  try { return JSON.parse(val); } catch { return fallback; }
}

function rowToSchedule(r) {
  return {
    id: r.id, assetType: r.asset_type, assetId: r.asset_id,
    triggerType: r.trigger_type, intervalValue: r.interval_value, intervalUnit: r.interval_unit,
    taskName: r.task_name, taskDescription: r.task_description, partsHint: r.parts_hint,
    active: !!r.active, createdAt: r.created_at
  };
}

function rowToWorkOrder(r) {
  return {
    id: r.id, assetType: r.asset_type, assetId: r.asset_id, fleetUnitId: r.fleet_unit_id,
    tripId: r.trip_id, triggerType: r.trigger_type, title: r.title, description: r.description,
    status: r.status, priority: r.priority, odometerKm: r.odometer_km,
    openedAt: r.opened_at, closedAt: r.closed_at, openedBy: r.opened_by, assignedTo: r.assigned_to,
    laborHours: r.labor_hours, laborCost: r.labor_cost, partsCost: r.parts_cost, notes: r.notes
  };
}

function rowToPart(r) {
  return {
    id: r.id, sku: r.sku, name: r.name, category: r.category, unit: r.unit,
    unitCost: r.unit_cost, compatibleAssets: r.compatible_assets, minStock: r.min_stock,
    notes: r.notes, active: !!r.active
  };
}

function rowToStock(r) {
  return {
    id: r.id, partId: r.part_id, warehouse: r.warehouse, quantity: r.quantity, updatedAt: r.updated_at
  };
}

function rowToIssue(r) {
  return {
    id: r.id, workOrderId: r.work_order_id, partId: r.part_id, quantity: r.quantity,
    issuedTo: r.issued_to, issuedAt: r.issued_at, notes: r.notes
  };
}

function getWorkshopBundle() {
  return {
    schedules: listMaintenanceSchedules(),
    workOrders: listWorkOrders(),
    parts: listPartsCatalog(),
    stock: listPartsStock(),
    issues: listPartsIssues()
  };
}

function listMaintenanceSchedules() {
  return db.prepare('SELECT * FROM maintenance_schedules ORDER BY asset_type, task_name').all().map(rowToSchedule);
}

function upsertMaintenanceSchedule(body) {
  const id = body.id || `MS-${Date.now()}`;
  db.prepare(`
    INSERT INTO maintenance_schedules (id, asset_type, asset_id, trigger_type, interval_value, interval_unit, task_name, task_description, parts_hint, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      asset_type = excluded.asset_type, asset_id = excluded.asset_id, trigger_type = excluded.trigger_type,
      interval_value = excluded.interval_value, interval_unit = excluded.interval_unit,
      task_name = excluded.task_name, task_description = excluded.task_description,
      parts_hint = excluded.parts_hint, active = excluded.active
  `).run(id, body.assetType, body.assetId, body.triggerType, body.intervalValue || null,
    body.intervalUnit || '', body.taskName, body.taskDescription || '', body.partsHint || '',
    body.active ? 1 : 0);
  return rowToSchedule(db.prepare('SELECT * FROM maintenance_schedules WHERE id = ?').get(id));
}

function listWorkOrders(status) {
  const sql = status
    ? 'SELECT * FROM maintenance_work_orders WHERE status = ? ORDER BY opened_at DESC'
    : 'SELECT * FROM maintenance_work_orders ORDER BY opened_at DESC';
  const rows = status ? db.prepare(sql).all(status) : db.prepare(sql).all();
  return rows.map(rowToWorkOrder);
}

function openWorkOrder(body, user) {
  const id = body.id || `WO-${Date.now()}`;
  db.prepare(`
    INSERT INTO maintenance_work_orders (id, asset_type, asset_id, fleet_unit_id, trip_id, trigger_type, title, description, status, priority, odometer_km, opened_by, assigned_to, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, body.assetType, body.assetId, body.fleetUnitId || null, body.tripId || null,
    body.triggerType || 'manual', body.title, body.description || '', body.status || 'open',
    body.priority || 'normal', body.odometerKm || null, user?.username || 'system',
    body.assignedTo || '', body.notes || '');
  if (body.fleetUnitId) {
    db.prepare('UPDATE fleet_units SET status = \'maintenance\' WHERE id = ?').run(body.fleetUnitId);
  }
  return rowToWorkOrder(db.prepare('SELECT * FROM maintenance_work_orders WHERE id = ?').get(id));
}

function updateWorkOrder(id, patch) {
  const row = db.prepare('SELECT * FROM maintenance_work_orders WHERE id = ?').get(id);
  if (!row) throw new Error('Work order not found');
  const status = patch.status ?? row.status;
  const closedAt = status === 'closed' || status === 'completed' ? new Date().toISOString().slice(0, 16).replace('T', ' ') : row.closed_at;
  db.prepare(`
    UPDATE maintenance_work_orders SET
      status = ?, priority = ?, assigned_to = ?, labor_hours = ?, labor_cost = ?, parts_cost = ?,
      closed_at = ?, notes = ?, description = ?
    WHERE id = ?
  `).run(status, patch.priority ?? row.priority, patch.assignedTo ?? row.assigned_to,
    patch.laborHours ?? row.labor_hours, patch.laborCost ?? row.labor_cost, patch.partsCost ?? row.parts_cost,
    closedAt, patch.notes ?? row.notes, patch.description ?? row.description, id);
  if ((status === 'closed' || status === 'completed') && row.fleet_unit_id) {
    db.prepare('UPDATE fleet_units SET status = \'available\' WHERE id = ? AND status = \'maintenance\'').run(row.fleet_unit_id);
  }
  return rowToWorkOrder(db.prepare('SELECT * FROM maintenance_work_orders WHERE id = ?').get(id));
}

function listPartsCatalog() {
  return db.prepare('SELECT * FROM parts_catalog WHERE active = 1 ORDER BY name').all().map(rowToPart);
}

function upsertPart(body) {
  const id = body.id || `PART-${Date.now()}`;
  db.prepare(`
    INSERT INTO parts_catalog (id, sku, name, category, unit, unit_cost, compatible_assets, min_stock, notes, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      sku = excluded.sku, name = excluded.name, category = excluded.category, unit = excluded.unit,
      unit_cost = excluded.unit_cost, compatible_assets = excluded.compatible_assets,
      min_stock = excluded.min_stock, notes = excluded.notes, active = excluded.active
  `).run(id, body.sku, body.name, body.category || '', body.unit || 'pcs', body.unitCost || 0,
    body.compatibleAssets || '', body.minStock || 0, body.notes || '', body.active ? 1 : 0);
  return rowToPart(db.prepare('SELECT * FROM parts_catalog WHERE id = ?').get(id));
}

function listPartsStock() {
  return db.prepare('SELECT * FROM parts_stock ORDER BY warehouse, part_id').all().map(rowToStock);
}

function adjustStock(partId, warehouse, delta, user) {
  const wh = warehouse || 'main';
  let row = db.prepare('SELECT * FROM parts_stock WHERE part_id = ? AND warehouse = ?').get(partId, wh);
  if (!row) {
    const id = `STK-${Date.now()}`;
    db.prepare('INSERT INTO parts_stock (id, part_id, warehouse, quantity) VALUES (?, ?, ?, ?)')
      .run(id, partId, wh, Math.max(0, delta));
  } else {
    const newQty = Math.max(0, row.quantity + delta);
    db.prepare('UPDATE parts_stock SET quantity = ?, updated_at = datetime(\'now\') WHERE id = ?').run(newQty, row.id);
  }
  return listPartsStock().find(s => s.partId === partId && s.warehouse === wh);
}

function listPartsIssues() {
  return db.prepare('SELECT * FROM parts_issues ORDER BY issued_at DESC').all().map(rowToIssue);
}

function issuePartToWorkOrder(body, user) {
  const part = db.prepare('SELECT * FROM parts_catalog WHERE id = ?').get(body.partId);
  if (!part) throw new Error('Part not found');
  const qty = Number(body.quantity || 0);
  if (qty <= 0) throw new Error('Quantity required');
  const stockRow = db.prepare('SELECT * FROM parts_stock WHERE part_id = ? AND warehouse = ?').get(body.partId, body.warehouse || 'main');
  if (!stockRow || stockRow.quantity < qty) throw new Error('Insufficient stock');
  const id = body.id || `ISS-${Date.now()}`;
  db.prepare(`
    INSERT INTO parts_issues (id, work_order_id, part_id, quantity, issued_to, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, body.workOrderId || null, body.partId, qty, user?.username || body.issuedTo || 'workshop', body.notes || '');
  adjustStock(body.partId, body.warehouse || 'main', -qty, user);
  if (body.workOrderId) {
    const cost = qty * (part.unit_cost || 0);
    db.prepare('UPDATE maintenance_work_orders SET parts_cost = parts_cost + ? WHERE id = ?').run(cost, body.workOrderId);
  }
  return rowToIssue(db.prepare('SELECT * FROM parts_issues WHERE id = ?').get(id));
}

function checkPostTripMaintenance(fleetUnitId, tripId, odometerKm) {
  const unit = db.prepare('SELECT * FROM fleet_units WHERE id = ?').get(fleetUnitId);
  if (!unit) return [];
  const schedules = db.prepare(`
    SELECT * FROM maintenance_schedules WHERE active = 1
      AND (asset_id = ? OR asset_id = ? OR asset_type = 'fleet_unit')
  `).all(unit.truck_plate, unit.id);
  const created = [];
  schedules.forEach(s => {
    if (s.trigger_type === 'after_trip') {
      const wo = openWorkOrder({
        assetType: s.asset_type,
        assetId: s.asset_id,
        fleetUnitId,
        tripId,
        triggerType: 'after_trip',
        title: s.task_name,
        description: s.task_description,
        odometerKm
      }, { username: 'system' });
      created.push(wo);
    }
  });
  return created;
}

module.exports = {
  getWorkshopBundle,
  listMaintenanceSchedules,
  upsertMaintenanceSchedule,
  listWorkOrders,
  openWorkOrder,
  updateWorkOrder,
  listPartsCatalog,
  upsertPart,
  listPartsStock,
  adjustStock,
  listPartsIssues,
  issuePartToWorkOrder,
  checkPostTripMaintenance
};
