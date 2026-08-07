const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  listTrips,
  getTripFull,
  completeWorkflowStep,
  completeBorderSubStep,
  uploadGovList,
  approveKanyakaException,
  advancePodStage,
  logAudit
} = require('../services/workflowEngine');
const {
  createNbTrip,
  createSbTrip,
  createSbTripFromTurnaround,
  upsertTripFromLiveUpload,
  getTurnaroundFull,
  listTurnarounds,
  updateFleetSettings,
  listFleetOwners
} = require('../services/turnaroundService');
const {
  listDriverContacts,
  getDriverContactById,
  getDriverContactByTrip,
  upsertDriverContact
} = require('../services/driverContactService');
const db = require('../db/database');
const env = require('../config/env');

const router = express.Router();

const uploadDir = env.uploadsDir;
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

function getUser(req) {
  return req.user || { id: 'ADM-001', username: 'super_admin' };
}

// Users & roles (read-only for authenticated clients)
router.get('/users', (req, res) => {
  try {
    const { listUsers } = require('../services/authService');
    res.json({ users: listUsers() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/roles', (_req, res) => {
  try {
    const { listRoles } = require('../services/authService');
    res.json({ roles: listRoles() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin — settings, users, roles, audit, area config
const adminSvc = () => require('../services/adminService');

router.get('/settings', (_req, res) => {
  try {
    res.json({ settings: adminSvc().getSystemSettings() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch('/settings', (req, res) => {
  try {
    const settings = adminSvc().updateSystemSettings(req.body, getUser(req));
    res.json({ settings });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.get('/audit-logs', (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 200;
    res.json({ logs: adminSvc().listAuditLogs(limit) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/audit-logs', (req, res) => {
  try {
    const { action, targetId, targetType, details } = req.body;
    adminSvc().logAuditEntry(action, targetId, targetType, details, getUser(req));
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/users', (req, res) => {
  try {
    const user = adminSvc().createUser(req.body, getUser(req));
    res.status(201).json({ user });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.patch('/users/:userId', (req, res) => {
  try {
    const user = adminSvc().updateUser(req.params.userId, req.body, getUser(req));
    res.json({ user });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/users/:userId/ban', (req, res) => {
  try {
    const user = adminSvc().banUser(req.params.userId, req.body.reason, getUser(req));
    res.json({ user });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.delete('/users/:userId', (req, res) => {
  try {
    adminSvc().purgeUser(req.params.userId, getUser(req));
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/users/:userId/reset-password', (req, res) => {
  try {
    const result = adminSvc().resetUserPassword(req.params.userId, getUser(req));
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/roles', (req, res) => {
  try {
    const role = adminSvc().createRole(req.body, getUser(req));
    res.status(201).json({ role });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.patch('/roles/:roleId', (req, res) => {
  try {
    const role = adminSvc().updateRole(req.params.roleId, req.body, getUser(req));
    res.json({ role });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.delete('/roles/:roleId', (req, res) => {
  try {
    adminSvc().deleteRole(req.params.roleId, getUser(req));
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.get('/admin/area-statuses-full', (_req, res) => {
  try {
    const records = adminSvc().getAreaStatusesFull();
    res.json({ areaStatuses: records });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/admin/area-statuses-full', (req, res) => {
  try {
    const records = adminSvc().saveAreaStatusesFull(req.body.areaStatuses || [], getUser(req));
    res.json({ areaStatuses: records });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.get('/admin/global-status-lists', (_req, res) => {
  try {
    res.json({ lists: adminSvc().getGlobalStatusLists() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/admin/global-status-lists', (req, res) => {
  try {
    const lists = adminSvc().saveGlobalStatusLists(req.body.lists || {}, getUser(req));
    res.json({ lists });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.patch('/users/:userId/module-permissions', (req, res) => {
  try {
    const user = adminSvc().saveModulePermissions(req.params.userId, req.body.modulePermissions || {}, getUser(req));
    res.json({ user });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.get('/admin/upload-templates', (_req, res) => {
  try {
    res.json({ templates: adminSvc().getUploadTemplates() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/admin/upload-templates', (req, res) => {
  try {
    const templates = adminSvc().saveUploadTemplates(req.body.templates || {}, getUser(req));
    res.json({ templates });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Trips
router.get('/trips', (req, res) => {
  try {
    const trips = listTrips({ direction: req.query.direction });
    res.json({ trips });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/trips/:tripNumber', (req, res) => {
  try {
    const trip = getTripFull(req.params.tripNumber);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    res.json({ trip });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/trips/upload-nb', upload.single('file'), (req, res) => {
  try {
    const body = req.body;
    const trip = upsertTripFromLiveUpload('NB', {
      tripNumber: body.tripNumber,
      truck: body.truck,
      driver: body.driver,
      owner: body.owner,
      area: body.area || 'Kasumbalesa',
      entryBorder: body.entryBorder || 'Kasumbalesa',
      offloadingPoint: body.offloadingPoint,
      borderProcess: body.borderProcess || 'KBP',
      trailerPlate: body.trailerPlate,
      status: body.status
    }, getUser(req));
    res.status(201).json({ trip, message: 'NB trip saved from live upload.' });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/trips/upload-sb', upload.single('file'), (req, res) => {
  try {
    const body = req.body;
    const trip = upsertTripFromLiveUpload('SB', {
      tripNumber: body.tripNumber,
      truck: body.truck,
      driver: body.driver,
      owner: body.owner,
      area: body.area || 'Kanyaka',
      loadingPoint: body.loadingPoint || 'Kanyaka Mine',
      exitBorder: body.exitBorder || body.border || 'Kasumbalesa',
      status: body.status || 'Loading'
    }, getUser(req));
    res.status(201).json({ trip, message: 'SB trip saved from live upload.' });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/trips/:tripNumber/advance-step', (req, res) => {
  try {
    const { stepKey } = req.body;
    if (!stepKey) return res.status(400).json({ error: 'stepKey is required' });
    const trip = completeWorkflowStep(req.params.tripNumber, stepKey, getUser(req));
    res.json({ trip });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/trips/:tripNumber/border-step/:stepOrder/complete', (req, res) => {
  try {
    const stepOrder = parseInt(req.params.stepOrder, 10);
    const trip = completeBorderSubStep(req.params.tripNumber, stepOrder, getUser(req));
    res.json({ trip });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Turnarounds
router.get('/turnarounds', (_req, res) => {
  try {
    res.json({ turnarounds: listTurnarounds() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/turnarounds/:id', (req, res) => {
  try {
    const turnaround = getTurnaroundFull(req.params.id);
    if (!turnaround) return res.status(404).json({ error: 'Turnaround not found' });
    res.json({ turnaround });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/turnarounds/from-nb/:nbTripNumber/create-sb', (req, res) => {
  try {
    const trip = createSbTripFromTurnaround(req.params.nbTripNumber, req.body, getUser(req));
    res.status(201).json({ trip, message: 'SB trip created on same turnaround. Flow: Load → Documents → Seal → Escort → Dispatch → Kanyaka Gov List → Border Exit.' });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Kanyaka
router.post('/kanyaka/:tripNumber/gov-list', upload.single('file'), (req, res) => {
  try {
    const fileName = req.file?.originalname || req.body.fileName || 'gov-list.csv';
    const trip = uploadGovList(req.params.tripNumber, fileName, getUser(req));
    res.json({ trip, message: 'Gov List uploaded from mine. Kanyaka transit can proceed.' });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/kanyaka/:tripNumber/exception', (req, res) => {
  try {
    const { reason, approvedBy } = req.body;
    if (!reason) return res.status(400).json({ error: 'reason is required' });
    const trip = approveKanyakaException(req.params.tripNumber, reason, approvedBy, getUser(req));
    res.json({ trip, message: 'Kanyaka exception approved. Transit allowed without Gov List.' });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// POD
router.post('/pod/:tripNumber/:stage', (req, res) => {
  try {
    const stage = req.params.stage;
    const valid = ['collected', 'scanned', 'uploaded', 'sent_to_invoicing'];
    if (!valid.includes(stage)) return res.status(400).json({ error: `Invalid stage. Use: ${valid.join(', ')}` });
    const trip = advancePodStage(req.params.tripNumber, stage, getUser(req));
    res.json({ trip });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Driver contacts (border team registration)
router.get('/driver-contacts', (req, res) => {
  try {
    const contacts = listDriverContacts({
      search: req.query.search,
      direction: req.query.direction,
      border: req.query.border,
      registered: req.query.registered
    });
    res.json({ contacts });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/driver-contacts/by-trip/:tripNumber', (req, res) => {
  try {
    const contact = getDriverContactByTrip(req.params.tripNumber);
    if (!contact) return res.status(404).json({ error: 'No driver contact for this trip' });
    res.json({ contact });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/driver-contacts/:id', (req, res) => {
  try {
    const contact = getDriverContactById(req.params.id);
    if (!contact) return res.status(404).json({ error: 'Driver contact not found' });
    res.json({ contact });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/driver-contacts', (req, res) => {
  try {
    const contact = upsertDriverContact(req.body, getUser(req));
    res.status(201).json({ contact, message: 'Driver contact saved' });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Fleet
router.get('/fleet', (_req, res) => {
  try {
    res.json({ fleet: listFleetOwners() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch('/fleet/:ownerId', (req, res) => {
  try {
    const owner = updateFleetSettings(req.params.ownerId, req.body, getUser(req));
    res.json({ owner: { id: owner.id, name: owner.name, requireSameTruckSb: owner.require_same_truck_sb === 1 } });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Area statuses & assignments

router.get('/area-statuses', (_req, res) => {
  const rows = db.prepare('SELECT * FROM area_status_lists WHERE active = 1').all();
  res.json({ areaStatuses: rows.map(r => ({ id: r.id, area: r.area, statuses: JSON.parse(r.statuses), active: r.active === 1 })) });
});

router.post('/area-statuses', (req, res) => {
  const { id, area, statuses } = req.body;
  if (!area || !statuses?.length) return res.status(400).json({ error: 'area and statuses required' });
  const sid = id || `AS-${Date.now()}`;
  db.prepare(`INSERT INTO area_status_lists (id, area, statuses) VALUES (?, ?, ?) ON CONFLICT(area) DO UPDATE SET statuses = excluded.statuses`).run(sid, area, JSON.stringify(statuses));
  res.json({ ok: true });
});

router.get('/area-assignments', (_req, res) => {
  const rows = db.prepare('SELECT * FROM user_area_assignments').all();
  res.json({ assignments: rows.map(r => ({ userId: r.user_id, username: r.username, assignedAreas: JSON.parse(r.assigned_areas) })) });
});

router.post('/area-assignments', (req, res) => {
  const { userId, username, assignedAreas } = req.body;
  if (!userId || !assignedAreas?.length) return res.status(400).json({ error: 'userId and assignedAreas required' });
  db.prepare(`INSERT INTO user_area_assignments (user_id, username, assigned_areas, updated_at) VALUES (?, ?, ?, datetime('now')) ON CONFLICT(user_id) DO UPDATE SET assigned_areas = excluded.assigned_areas, updated_at = datetime('now')`).run(userId, username, JSON.stringify(assignedAreas));
  res.json({ ok: true });
});

router.post('/trips/:tripNumber/area-status', (req, res) => {
  const { area, status, notes } = req.body;
  const user = getUser(req);
  if (!status) return res.status(400).json({ error: 'status required' });
  db.prepare(`INSERT INTO trip_area_updates (trip_number, area, status, updated_by, notes) VALUES (?, ?, ?, ?, ?)`).run(req.params.tripNumber, area || '', status, user.username, notes || '');
  res.json({ ok: true });
});

router.post('/live-uploads', (req, res) => {
  const { type, fileName, rowCount, results } = req.body;
  db.prepare(`INSERT INTO uploads (upload_type, file_name, file_path, uploaded_by) VALUES (?, ?, ?, ?)`)
    .run(type, fileName || 'upload.csv', '', getUser(req).username);
  res.json({ ok: true, type, rowCount, results });
});

router.get('/position-uploads', (_req, res) => {
  const rows = db.prepare(`SELECT * FROM uploads WHERE upload_type = 'POSITION' ORDER BY uploaded_at DESC LIMIT 50`).all();
  res.json({ uploads: rows });
});

router.post('/position-uploads', (req, res) => {
  const payload = req.body;
  db.prepare(`INSERT INTO uploads (upload_type, file_name, file_path, uploaded_by) VALUES ('POSITION', ?, ?, ?)`)
    .run(payload.fileName || 'position.csv', '', getUser(req).username);
  res.json({ ok: true, upload: payload });
});

// Fleet registry, client orders & allocations
const fleetOrderSvc = () => require('../services/fleetOrderService');

router.get('/fleet-orders/bundle', (_req, res) => {
  try {
    res.json(fleetOrderSvc().getFullFleetOrderBundle());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/fleet-orders/stats', (_req, res) => {
  try {
    res.json({ stats: fleetOrderSvc().getFleetOrderStats() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/clients', (_req, res) => {
  try { res.json({ clients: fleetOrderSvc().listClients() }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/clients', (req, res) => {
  try {
    const client = fleetOrderSvc().upsertClient(req.body);
    res.status(201).json({ client });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.get('/fleet-drivers', (_req, res) => {
  try { res.json({ drivers: fleetOrderSvc().listFleetDrivers() }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/fleet-drivers', (req, res) => {
  try {
    const driver = fleetOrderSvc().upsertFleetDriver(req.body);
    res.status(201).json({ driver });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.get('/fleet-units', (_req, res) => {
  try { res.json({ units: fleetOrderSvc().listFleetUnits() }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/fleet-units', (req, res) => {
  try {
    const unit = fleetOrderSvc().upsertFleetUnit(req.body);
    res.status(201).json({ unit });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.patch('/fleet-units/:unitId/gps', (req, res) => {
  try {
    const existing = fleetOrderSvc().getUnitById(req.params.unitId);
    if (!existing) return res.status(404).json({ error: 'Fleet unit not found' });
    const unit = fleetOrderSvc().upsertFleetUnit({
      ...existing,
      ...req.body,
      id: existing.id,
      gpsUpdatedAt: new Date().toISOString()
    });
    res.json({ unit });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.get('/client-orders', (_req, res) => {
  try { res.json({ orders: fleetOrderSvc().listClientOrders() }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/client-orders', (req, res) => {
  try {
    const order = fleetOrderSvc().upsertClientOrder(req.body, getUser(req));
    res.status(201).json({ order });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.get('/order-allocations', (req, res) => {
  try {
    res.json({ allocations: fleetOrderSvc().listOrderAllocations(req.query.orderId) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/order-allocations', (req, res) => {
  try {
    const allocation = fleetOrderSvc().createOrderAllocation(req.body, getUser(req));
    res.status(201).json({ allocation });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

module.exports = router;
