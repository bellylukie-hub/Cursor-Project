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

router.get('/freight-settings', (_req, res) => {
  try {
    res.json({ settings: adminSvc().getFreightSettings() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch('/freight-settings', (req, res) => {
  try {
    const settings = adminSvc().updateFreightSettings(req.body, getUser(req));
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
  } catch (e) {
    res.status(400).json({ error: e.message, code: e.code, details: e.details });
  }
});

router.post('/order-allocations/validate', (req, res) => {
  try {
    const allocRules = require('../services/allocationRulesService');
    const result = allocRules.validateAllocation(req.body.orderId, req.body.fleetUnitId, req.body);
    res.json(result);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post('/empty-trip-legs', (req, res) => {
  try {
    const leg = require('../services/allocationRulesService').createEmptyTripLeg(req.body, getUser(req));
    res.status(201).json({ leg });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post('/allocation/weight-plan', (req, res) => {
  try {
    const order = fleetOrderSvc().getOrderById(req.body.orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const plan = require('../services/allocationRulesService').buildWeightPlan(
      order, req.body.fleetUnitId, req.body.containers, req.body.countries
    );
    res.json({ plan });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Workshop — maintenance, repairs, parts store
const workshopSvc = () => require('../services/workshopService');

router.get('/workshop/bundle', (_req, res) => {
  try { res.json(workshopSvc().getWorkshopBundle()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/workshop/work-orders', (req, res) => {
  try { res.json({ workOrders: workshopSvc().listWorkOrders(req.query.status) }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/workshop/work-orders', (req, res) => {
  try {
    const wo = workshopSvc().openWorkOrder(req.body, getUser(req));
    res.status(201).json({ workOrder: wo });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.patch('/workshop/work-orders/:id', (req, res) => {
  try {
    const wo = workshopSvc().updateWorkOrder(req.params.id, req.body);
    res.json({ workOrder: wo });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post('/workshop/schedules', (req, res) => {
  try {
    const schedule = workshopSvc().upsertMaintenanceSchedule(req.body);
    res.status(201).json({ schedule });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post('/workshop/parts', (req, res) => {
  try {
    const part = workshopSvc().upsertPart(req.body);
    res.status(201).json({ part });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post('/workshop/parts/issue', (req, res) => {
  try {
    const issue = workshopSvc().issuePartToWorkOrder(req.body, getUser(req));
    res.status(201).json({ issue });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post('/workshop/stock/adjust', (req, res) => {
  try {
    const stock = workshopSvc().adjustStock(req.body.partId, req.body.warehouse, Number(req.body.delta || 0), getUser(req));
    res.json({ stock });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Fuel control
const fuelSvc = () => require('../services/fuelService');

router.get('/fuel/transactions', (req, res) => {
  try { res.json({ transactions: fuelSvc().listFuelTransactions(req.query.fleetUnitId) }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/fuel/transactions', (req, res) => {
  try {
    const tx = fuelSvc().recordFuelTransaction(req.body, getUser(req));
    res.status(201).json({ transaction: tx });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.get('/fuel/analysis/:fleetUnitId', (req, res) => {
  try { res.json(fuelSvc().getFuelAnalysis(req.params.fleetUnitId)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/fuel/overview', (_req, res) => {
  try { res.json({ fleet: fuelSvc().getFuelFleetOverview() }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/weight-regulations', (_req, res) => {
  try {
    res.json({ regulations: require('../services/allocationRulesService').listWeightRegulations() });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Route catalog (stations, loading/offloading points, pre-defined routes)
const routeCatalogSvc = () => require('../services/routeCatalogService');

router.get('/route-catalog', (_req, res) => {
  try { res.json(routeCatalogSvc().getFullCatalog()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/route-catalog/resolve', (req, res) => {
  try {
    const route = routeCatalogSvc().resolveRoute(req.query.originStationId, req.query.destStationId);
    res.json({ route });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post('/route-catalog/stations', (req, res) => {
  try {
    const station = routeCatalogSvc().upsertStation(req.body);
    res.status(201).json({ station });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post('/route-catalog/routes', (req, res) => {
  try {
    const route = routeCatalogSvc().upsertRouteTemplate(req.body);
    res.status(201).json({ route });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Trip scheduler (multi-order truck scheduling)
const tripSchedulerSvc = () => require('../services/tripSchedulerService');

router.get('/trip-scheduler/bundle', (_req, res) => {
  try { res.json(tripSchedulerSvc().getSchedulerBundle()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/trip-scheduler/trips', (_req, res) => {
  try { res.json({ trips: tripSchedulerSvc().listTrips() }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/trip-scheduler/trips', (req, res) => {
  try {
    const trip = tripSchedulerSvc().upsertTrip(req.body, getUser(req));
    res.status(201).json({ trip });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post('/trip-scheduler/trips/:tripId/orders', (req, res) => {
  try {
    const trip = tripSchedulerSvc().addOrderToTrip(req.params.tripId, req.body, getUser(req));
    res.json({ trip });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Fleet trucks & trailers (assets for fleet sets)
const fleetAssetSvc = () => require('../services/fleetAssetService');

router.get('/fleet-trucks', (_req, res) => {
  try { res.json({ trucks: fleetAssetSvc().listTrucks() }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/fleet-trucks', (req, res) => {
  try {
    const truck = fleetAssetSvc().upsertTruck(req.body);
    res.status(201).json({ truck });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.get('/fleet-trailers', (_req, res) => {
  try { res.json({ trailers: fleetAssetSvc().listTrailers() }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/fleet-trailers', (req, res) => {
  try {
    const trailer = fleetAssetSvc().upsertTrailer(req.body);
    res.status(201).json({ trailer });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post('/fleet-trailers/link-superlink', (req, res) => {
  try {
    const pair = fleetAssetSvc().linkSuperlinkPair(req.body.frontId, req.body.rearId);
    res.json(pair);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Helpdesk
const helpdeskSvc = () => require('../services/helpdeskService');

router.get('/helpdesk/bundle', (req, res) => {
  try {
    const user = getUser(req);
    const isTechTeam = helpdeskSvc().isTechTeamUser(user);
    res.json(helpdeskSvc().getBundle(user, { isTechTeam }));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/helpdesk/tickets', (req, res) => {
  try {
    const user = getUser(req);
    const isTech = helpdeskSvc().isTechTeamUser(user);
    const filters = { ...req.query };
    if (!isTech) filters.reporterUserId = user?.id || user?.userId;
    res.json({ tickets: helpdeskSvc().listTickets(filters) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/helpdesk/tickets', (req, res) => {
  try {
    const ticket = helpdeskSvc().upsertTicket(req.body, getUser(req));
    res.status(201).json({ ticket });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.patch('/helpdesk/tickets/:id', (req, res) => {
  try {
    const ticket = helpdeskSvc().upsertTicket({ ...req.body, id: req.params.id }, getUser(req));
    res.json({ ticket });
  } catch (e) {
    const code = e.message.includes('Not authorized') ? 403 : 400;
    res.status(code).json({ error: e.message });
  }
});

router.post('/helpdesk/tickets/:id/comments', (req, res) => {
  try {
    const comment = helpdeskSvc().addComment(req.params.id, req.body, getUser(req));
    res.status(201).json({ comment, ticket: helpdeskSvc().getTicketById(req.params.id) });
  } catch (e) {
    const code = e.message.includes('Not authorized') ? 403 : 400;
    res.status(code).json({ error: e.message });
  }
});

router.get('/helpdesk/settings', (_req, res) => {
  try { res.json({ settings: helpdeskSvc().getSettings() }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/helpdesk/settings', (req, res) => {
  try {
    const user = getUser(req);
    if (!helpdeskSvc().isTechTeamUser(user)) {
      return res.status(403).json({ error: 'Not authorized to change helpdesk settings' });
    }
    const settings = helpdeskSvc().saveSettings(req.body, user);
    res.json({ settings });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.get('/helpdesk/stats', (req, res) => {
  try { res.json({ stats: helpdeskSvc().getStats(req.query) }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// Database explorer — Super Admin only (SELECT queries + table browser)
const dbExplorerSvc = () => require('../services/databaseExplorerService');

function requireSuperAdmin(req, res, next) {
  try {
    dbExplorerSvc().assertSuperAdmin(getUser(req));
    next();
  } catch (e) {
    res.status(403).json({ error: e.message });
  }
}

router.get('/admin/db/tables', requireSuperAdmin, (_req, res) => {
  try {
    res.json({ tables: dbExplorerSvc().listTables() });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/admin/db/info', requireSuperAdmin, (_req, res) => {
  try {
    res.json(dbExplorerSvc().getDatabaseInfo());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/admin/db/tables/:tableName/schema', requireSuperAdmin, (req, res) => {
  try {
    res.json(dbExplorerSvc().getTableSchema(req.params.tableName));
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.get('/admin/db/tables/:tableName/rows', requireSuperAdmin, (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = parseInt(req.query.offset, 10) || 0;
    res.json(dbExplorerSvc().browseTable(req.params.tableName, { limit, offset }));
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post('/admin/db/query', requireSuperAdmin, (req, res) => {
  try {
    const sql = req.body?.sql || '';
    const maxRows = Math.min(parseInt(req.body?.maxRows, 10) || dbExplorerSvc().MAX_ROWS, dbExplorerSvc().MAX_ROWS);
    const result = dbExplorerSvc().runSelectQuery(sql, getUser(req), { maxRows });
    res.json(result);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Internal communication — shared mailbox & chat (cross-user delivery)
const internalCommSvc = () => require('../services/internalCommService');

function commSender(req) {
  const u = getUser(req);
  const { getUserByUsername } = require('../services/authService');
  const dbUser = u.email ? u : getUserByUsername(u.username);
  const email = dbUser?.email || req.headers['x-user-email'] || `${u.username}@truckcontrol.local`;
  return {
    email,
    username: u.username || dbUser?.username,
    displayName: (u.username || dbUser?.username || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  };
}

router.get('/internal-comm/contacts', (req, res) => {
  try {
    const sender = commSender(req);
    const contacts = internalCommSvc().listContacts()
      .filter(c => c.email.toLowerCase() !== String(sender.email || '').toLowerCase());
    res.json({ contacts });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/internal-comm/mailbox', (req, res) => {
  try {
    const sender = commSender(req);
    res.json({ emails: internalCommSvc().listMailbox(sender.email) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/internal-comm/emails', (req, res) => {
  try {
    const result = internalCommSvc().sendEmail(req.body, commSender(req));
    res.status(201).json(result);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.patch('/internal-comm/emails/:emailId', (req, res) => {
  try {
    const sender = commSender(req);
    const email = internalCommSvc().updateEmail(req.params.emailId, sender.email, req.body);
    res.json({ email });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.get('/internal-comm/chat', (req, res) => {
  try {
    const sender = commSender(req);
    res.json(internalCommSvc().listChatData(sender.email));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/internal-comm/chat/rooms', (req, res) => {
  try {
    const room = internalCommSvc().createChatRoom(req.body, commSender(req));
    res.status(201).json({ room });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post('/internal-comm/chat/direct', (req, res) => {
  try {
    const { email } = req.body;
    const room = internalCommSvc().findOrCreateDirectRoom(email, commSender(req));
    res.json({ room });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post('/internal-comm/chat/messages', (req, res) => {
  try {
    const message = internalCommSvc().sendChatMessage(req.body, commSender(req));
    res.status(201).json({ message });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post('/internal-comm/chat/rooms/:roomId/read', (req, res) => {
  try {
    const sender = commSender(req);
    const room = internalCommSvc().markRoomRead(req.params.roomId, sender.email, req.body?.lastMessageId);
    res.json({ room });
  } catch (e) { res.status(400).json({ error: e.message }); }
});


module.exports = router;
