const db = require('../db/database');

function rowToClient(r) {
  return {
    id: r.id, name: r.name, contactPerson: r.contact_person, email: r.email,
    phone: r.phone, whatsapp: r.whatsapp, address: r.address, status: r.status,
    createdAt: r.created_at
  };
}

function rowToDriver(r) {
  return {
    id: r.id, name: r.name, drcNumber: r.drc_number, whatsapp: r.whatsapp,
    licenseNumber: r.license_number, status: r.status, createdAt: r.created_at
  };
}

function rowToUnit(r, driver) {
  return {
    id: r.id, truckPlate: r.truck_plate, trailerPlate: r.trailer_plate, horsePlate: r.horse_plate,
    vehicleType: r.vehicle_type, driverId: r.driver_id, driver: driver || null,
    gpsDeviceId: r.gps_device_id, gpsLat: r.gps_lat, gpsLng: r.gps_lng, gpsLabel: r.gps_label,
    gpsUpdatedAt: r.gps_updated_at, ownerId: r.owner_id, status: r.status, notes: r.notes,
    createdAt: r.created_at
  };
}

function rowToOrder(r, client) {
  let loadDetails = {};
  try { loadDetails = r.order_details_json ? JSON.parse(r.order_details_json) : {}; } catch (_) {}
  return {
    id: r.id, orderNumber: r.order_number, clientId: r.client_id, client: client || null,
    origin: r.origin, destination: r.destination, loadingPoint: r.loading_point,
    offloadingPoint: r.offloading_point, commodity: r.commodity, cargoType: r.cargo_type,
    customerRef: r.customer_ref, requiredDate: r.required_date, priority: r.priority,
    status: r.status, kpi: r.kpi, notes: r.notes, createdBy: r.created_by,
    createdAt: r.created_at, updatedAt: r.updated_at,
    orderDate: r.order_date, readyToLoadOn: r.ready_to_load_on, completeLoadsBy: r.complete_loads_by,
    shipper: r.shipper, consignee: r.consignee, invoiceParty: r.invoice_party, impExp: r.imp_exp,
    originCountry: r.origin_country, destinationCountry: r.destination_country,
    routeType: r.route_type || 'domestic',
    entryBorder: r.entry_border, viaBorder1: r.via_border_1, viaBorder2: r.via_border_2,
    portOfEntry: r.port_of_entry, exitBorder: r.exit_border,
    entryBorderAgent: r.entry_border_agent, viaBorder1Agent: r.via_border_1_agent,
    viaBorder2Agent: r.via_border_2_agent, portEntryAgent: r.port_entry_agent,
    exitBorderAgent: r.exit_border_agent,
    loadDetails
  };
}

function rowToAllocation(r, order, unit) {
  return {
    id: r.id, orderId: r.order_id, fleetUnitId: r.fleet_unit_id, order: order || null,
    fleetUnit: unit || null, scheduledDate: r.scheduled_date, status: r.status,
    allocatedBy: r.allocated_by, allocatedAt: r.allocated_at, notes: r.notes
  };
}

function getDriverById(id) {
  if (!id) return null;
  const r = db.prepare('SELECT * FROM fleet_drivers WHERE id = ?').get(id);
  return r ? rowToDriver(r) : null;
}

function getClientById(id) {
  if (!id) return null;
  const r = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
  return r ? rowToClient(r) : null;
}

function getUnitById(id) {
  if (!id) return null;
  const r = db.prepare('SELECT * FROM fleet_units WHERE id = ?').get(id);
  return r ? rowToUnit(r, getDriverById(r.driver_id)) : null;
}

function listClients() {
  return db.prepare('SELECT * FROM clients ORDER BY name').all().map(rowToClient);
}

function upsertClient(body) {
  const id = body.id || `CLI-${Date.now()}`;
  db.prepare(`
    INSERT INTO clients (id, name, contact_person, email, phone, whatsapp, address, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name, contact_person = excluded.contact_person, email = excluded.email,
      phone = excluded.phone, whatsapp = excluded.whatsapp, address = excluded.address, status = excluded.status
  `).run(id, body.name, body.contactPerson || '', body.email || '', body.phone || '',
    body.whatsapp || '', body.address || '', body.status || 'active');
  return getClientById(id);
}

function listFleetDrivers() {
  return db.prepare('SELECT * FROM fleet_drivers ORDER BY name').all().map(rowToDriver);
}

function upsertFleetDriver(body) {
  const id = body.id || `DRV-${Date.now()}`;
  db.prepare(`
    INSERT INTO fleet_drivers (id, name, drc_number, whatsapp, license_number, status)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name, drc_number = excluded.drc_number, whatsapp = excluded.whatsapp,
      license_number = excluded.license_number, status = excluded.status
  `).run(id, body.name, body.drcNumber || '', body.whatsapp || '', body.licenseNumber || '', body.status || 'active');
  return getDriverById(id);
}

function listFleetUnits() {
  return db.prepare('SELECT * FROM fleet_units ORDER BY truck_plate').all()
    .map(r => rowToUnit(r, getDriverById(r.driver_id)));
}

function upsertFleetUnit(body) {
  const id = body.id || `FU-${Date.now()}`;
  const plate = (body.truckPlate || '').trim().toUpperCase();
  if (!plate) throw new Error('Truck plate is required');
  db.prepare(`
    INSERT INTO fleet_units (id, truck_plate, trailer_plate, horse_plate, vehicle_type, driver_id,
      gps_device_id, gps_lat, gps_lng, gps_label, gps_updated_at, owner_id, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      truck_plate = excluded.truck_plate, trailer_plate = excluded.trailer_plate,
      horse_plate = excluded.horse_plate, vehicle_type = excluded.vehicle_type,
      driver_id = excluded.driver_id, gps_device_id = excluded.gps_device_id,
      gps_lat = excluded.gps_lat, gps_lng = excluded.gps_lng, gps_label = excluded.gps_label,
      gps_updated_at = excluded.gps_updated_at, owner_id = excluded.owner_id,
      status = excluded.status, notes = excluded.notes
  `).run(
    id, plate, body.trailerPlate || '', body.horsePlate || '', body.vehicleType || 'Truck',
    body.driverId || null, body.gpsDeviceId || null,
    body.gpsLat != null ? body.gpsLat : null, body.gpsLng != null ? body.gpsLng : null,
    body.gpsLabel || '', body.gpsUpdatedAt || (body.gpsLat != null ? new Date().toISOString() : null),
    body.ownerId || null, body.status || 'available', body.notes || ''
  );
  return getUnitById(id);
}

function listClientOrders() {
  return db.prepare('SELECT * FROM client_orders ORDER BY created_at DESC').all()
    .map(r => rowToOrder(r, getClientById(r.client_id)));
}

function upsertClientOrder(body, user) {
  const id = body.id || `ORD-${Date.now()}`;
  const orderNumber = (body.orderNumber || `CO-${Date.now().toString().slice(-6)}`).trim();
  const loadDetails = body.loadDetails || {};
  db.prepare(`
    INSERT INTO client_orders (
      id, order_number, client_id, origin, destination, loading_point, offloading_point,
      commodity, cargo_type, customer_ref, required_date, priority, status, kpi, notes, created_by,
      order_date, ready_to_load_on, complete_loads_by, shipper, consignee, invoice_party, imp_exp,
      origin_country, destination_country, route_type,
      entry_border, via_border_1, via_border_2, port_of_entry, exit_border,
      entry_border_agent, via_border_1_agent, via_border_2_agent, port_entry_agent, exit_border_agent,
      order_details_json, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now')
    )
    ON CONFLICT(id) DO UPDATE SET
      order_number = excluded.order_number, client_id = excluded.client_id,
      origin = excluded.origin, destination = excluded.destination,
      loading_point = excluded.loading_point, offloading_point = excluded.offloading_point,
      commodity = excluded.commodity, cargo_type = excluded.cargo_type,
      customer_ref = excluded.customer_ref, required_date = excluded.required_date,
      priority = excluded.priority, status = excluded.status, kpi = excluded.kpi, notes = excluded.notes,
      order_date = excluded.order_date, ready_to_load_on = excluded.ready_to_load_on,
      complete_loads_by = excluded.complete_loads_by, shipper = excluded.shipper,
      consignee = excluded.consignee, invoice_party = excluded.invoice_party, imp_exp = excluded.imp_exp,
      origin_country = excluded.origin_country, destination_country = excluded.destination_country,
      route_type = excluded.route_type,
      entry_border = excluded.entry_border, via_border_1 = excluded.via_border_1,
      via_border_2 = excluded.via_border_2, port_of_entry = excluded.port_of_entry,
      exit_border = excluded.exit_border,
      entry_border_agent = excluded.entry_border_agent, via_border_1_agent = excluded.via_border_1_agent,
      via_border_2_agent = excluded.via_border_2_agent, port_entry_agent = excluded.port_entry_agent,
      exit_border_agent = excluded.exit_border_agent,
      order_details_json = excluded.order_details_json, updated_at = datetime('now')
  `).run(
    id, orderNumber, body.clientId, body.origin || '', body.destination || '',
    body.loadingPoint || '', body.offloadingPoint || '', body.commodity || '', body.cargoType || '',
    body.customerRef || '', body.requiredDate || '', body.priority || 'normal',
    body.status || 'draft', body.kpi || 'green', body.notes || '', user?.username || body.createdBy || 'system',
    body.orderDate || '', body.readyToLoadOn || '', body.completeLoadsBy || '',
    body.shipper || '', body.consignee || '', body.invoiceParty || '', body.impExp || '',
    body.originCountry || '', body.destinationCountry || '', body.routeType || 'domestic',
    body.entryBorder || '', body.viaBorder1 || '', body.viaBorder2 || '', body.portOfEntry || '', body.exitBorder || '',
    body.entryBorderAgent || '', body.viaBorder1Agent || '', body.viaBorder2Agent || '',
    body.portEntryAgent || '', body.exitBorderAgent || '',
    JSON.stringify(loadDetails)
  );
  return getOrderById(id);
}

function getOrderById(id) {
  const r = db.prepare('SELECT * FROM client_orders WHERE id = ?').get(id);
  return r ? rowToOrder(r, getClientById(r.client_id)) : null;
}

function listOrderAllocations(orderId) {
  const sql = orderId
    ? 'SELECT * FROM order_allocations WHERE order_id = ? ORDER BY allocated_at DESC'
    : 'SELECT * FROM order_allocations ORDER BY allocated_at DESC';
  const rows = orderId
    ? db.prepare(sql).all(orderId)
    : db.prepare(sql).all();
  return rows.map(r => rowToAllocation(r, getOrderById(r.order_id), getUnitById(r.fleet_unit_id)));
}

function createOrderAllocation(body, user) {
  const id = body.id || `ALL-${Date.now()}`;
  const order = getOrderById(body.orderId);
  const unit = getUnitById(body.fleetUnitId);
  if (!order) throw new Error('Order not found');
  if (!unit) throw new Error('Fleet unit not found');
  const existing = db.prepare('SELECT id FROM order_allocations WHERE order_id = ? AND fleet_unit_id = ?')
    .get(body.orderId, body.fleetUnitId);
  if (existing && existing.id !== id) throw new Error('This fleet unit is already allocated to this order');

  db.prepare(`
    INSERT INTO order_allocations (id, order_id, fleet_unit_id, scheduled_date, status, allocated_by, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      scheduled_date = excluded.scheduled_date, status = excluded.status, notes = excluded.notes
  `).run(id, body.orderId, body.fleetUnitId, body.scheduledDate || '', body.status || 'scheduled',
    user?.username || 'system', body.notes || '');

  db.prepare(`UPDATE client_orders SET status = 'allocated', updated_at = datetime('now') WHERE id = ? AND status IN ('draft', 'confirmed')`)
    .run(body.orderId);
  db.prepare(`UPDATE fleet_units SET status = 'allocated' WHERE id = ?`).run(body.fleetUnitId);

  return rowToAllocation(
    db.prepare('SELECT * FROM order_allocations WHERE id = ?').get(id),
    order, unit
  );
}

function getFleetOrderStats() {
  const orders = db.prepare('SELECT status, kpi FROM client_orders').all();
  const units = db.prepare('SELECT status FROM fleet_units').all();
  const allocs = db.prepare('SELECT status FROM order_allocations').all();
  const pending = orders.filter(o => o.status === 'draft' || o.status === 'confirmed').length;
  const allocated = orders.filter(o => o.status === 'allocated' || o.status === 'in_transit').length;
  const overdue = orders.filter(o => o.kpi === 'red').length;
  const available = units.filter(u => u.status === 'available').length;
  const scheduled = allocs.filter(a => a.status === 'scheduled').length;
  return { totalOrders: orders.length, pending, allocated, overdue, availableUnits: available, scheduled };
}

function seedFleetOrderData() {
  const clientCount = db.prepare('SELECT COUNT(*) AS c FROM clients').get().c;
  if (clientCount > 0) return { seeded: false };

  const clients = [
    { id: 'CLI-001', name: 'Mining Corp DRC', contactPerson: 'Jean Mukendi', phone: '+243 990 111 222', whatsapp: '+243990111222', email: 'ops@miningcorp.cd' },
    { id: 'CLI-002', name: 'Copper Logistics SA', contactPerson: 'Sarah Mwamba', phone: '+243 991 333 444', whatsapp: '+243991333444', email: 'dispatch@copperlog.cd' },
    { id: 'CLI-003', name: 'Kolwezi Trading Co', contactPerson: 'Peter Banda', phone: '+243 992 555 666', whatsapp: '+243992555666', email: 'orders@kolwezi.cd' }
  ];
  clients.forEach(c => upsertClient(c));

  const drivers = [
    { id: 'DRV-001', name: 'John Doe', drcNumber: '+243 812 345 678', whatsapp: '+243812345678', licenseNumber: 'DRC-LIC-4421' },
    { id: 'DRV-002', name: 'Alice Bwalya', drcNumber: '+243 813 456 789', whatsapp: '+243813456789', licenseNumber: 'DRC-LIC-8832' },
    { id: 'DRV-003', name: 'Jean Pierre', drcNumber: '+243 814 567 890', whatsapp: '+243814567890', licenseNumber: 'DRC-LIC-2290' }
  ];
  drivers.forEach(d => upsertFleetDriver(d));

  const units = [
    { id: 'FU-001', truckPlate: 'ABC123DRC', trailerPlate: 'TRL-456', vehicleType: 'Truck', driverId: 'DRV-001', gpsDeviceId: 'GPS-001', gpsLat: -10.7167, gpsLng: 25.4667, gpsLabel: 'Kasumbalesa', status: 'available' },
    { id: 'FU-002', truckPlate: 'XYZ789DRC', trailerPlate: 'TRL-890', vehicleType: 'Truck', driverId: 'DRV-002', gpsDeviceId: 'GPS-002', gpsLat: -11.6600, gpsLng: 27.4794, gpsLabel: 'Kolwezi', status: 'available' },
    { id: 'FU-003', truckPlate: 'RST890DRC', trailerPlate: 'TRL-112', vehicleType: 'Horse', driverId: 'DRV-003', gpsDeviceId: 'GPS-003', gpsLat: -12.3714, gpsLng: 26.6836, gpsLabel: 'Lubumbashi', status: 'available' }
  ];
  units.forEach(u => upsertFleetUnit(u));

  const orders = [
    {
      id: 'ORD-001', orderNumber: 'GG-15776', clientId: 'CLI-001',
      orderDate: '2026-08-01', readyToLoadOn: '2026-08-10', completeLoadsBy: '2026-08-15',
      origin: 'Durban', destination: 'Kolwezi', originCountry: 'ZA', destinationCountry: 'CD',
      loadingPoint: 'Durban Port', offloadingPoint: 'Kolwezi Mine', routeType: 'international',
      entryBorder: 'Kasumbalesa', portOfEntry: 'Durban Port',
      entryBorderAgent: 'Jean Kalenga Clearing',
      commodity: 'Copper Cathodes', cargoType: 'Bulk Loose', customerRef: 'CUST-7788',
      shipper: 'Mining Corp DRC', consignee: 'Kolwezi Mine', invoiceParty: 'Mining Corp DRC',
      impExp: 'IMP', requiredDate: '2026-08-15', status: 'confirmed', priority: 'high',
      loadDetails: {
        descriptionOfGoods: 'Copper cathodes — bulk loose',
        orderLoadType: 'Normal', commodityRateType: 'Standard',
        packing: 'Bulk', quantity: 1200, qtyPerTruck: 34, tonnage: 1200, noOfLoads: 35,
        isHaz: false
      }
    },
    {
      id: 'ORD-002', orderNumber: 'GG-15780', clientId: 'CLI-002',
      orderDate: '2026-08-05', readyToLoadOn: '2026-08-12', completeLoadsBy: '2026-08-20',
      origin: 'Lubumbashi', destination: 'Kolwezi', originCountry: 'CD', destinationCountry: 'CD',
      loadingPoint: 'Lubumbashi Depot', offloadingPoint: 'Kolwezi Mine', routeType: 'domestic',
      commodity: 'Sulphuric Acid', cargoType: 'Bulk Liquid', customerRef: 'REF-9921',
      shipper: 'Copper Logistics SA', consignee: 'Likasi Plant', impExp: 'DOM',
      requiredDate: '2026-08-20', status: 'draft', priority: 'normal',
      loadDetails: {
        descriptionOfGoods: 'Sulphuric acid tankers', orderLoadType: 'Pre-load',
        packing: 'Tank', litre: 40000, liquidType: 'Sulphuric acid', tonnage: 800, noOfLoads: 20, isHaz: true,
        unNumber: 'UN1830', imoClass: '8', imoDescription: 'Sulphuric acid'
      }
    },
    {
      id: 'ORD-003', orderNumber: 'GG-15782', clientId: 'CLI-001',
      orderDate: '2026-08-07', readyToLoadOn: '2026-08-14', completeLoadsBy: '2026-08-22',
      origin: 'Durban', destination: 'Lusaka', originCountry: 'ZA', destinationCountry: 'ZM',
      loadingPoint: 'Durban Port', offloadingPoint: 'Lusaka Depot', routeType: 'international',
      entryBorder: 'Kasumbalesa', commodity: 'Bottles', cargoType: 'Break Bulk', customerRef: 'REF-4412',
      shipper: 'Mining Corp DRC', consignee: 'Lusaka Depot', impExp: 'IMP',
      requiredDate: '2026-08-22', status: 'confirmed', priority: 'normal',
      loadDetails: {
        descriptionOfGoods: 'Glass bottles — break bulk cartons',
        orderLoadType: 'Normal', packingUnit: '0.0721 KG CARTONS', unitWeight: 0.07,
        packing: 'Cartons', quantity: 50000, qtyPerTruck: 428571, tonnage: 360, noOfLoads: 12, isHaz: false
      }
    }
  ];
  orders.forEach(o => upsertClientOrder(o, { username: 'super_admin' }));

  createOrderAllocation({ id: 'ALL-001', orderId: 'ORD-001', fleetUnitId: 'FU-001', scheduledDate: '2026-08-10', status: 'scheduled' }, { username: 'super_admin' });

  return { seeded: true };
}

function getFullFleetOrderBundle() {
  seedFleetOrderData();
  return {
    clients: listClients(),
    drivers: listFleetDrivers(),
    units: listFleetUnits(),
    orders: listClientOrders(),
    allocations: listOrderAllocations(),
    stats: getFleetOrderStats()
  };
}

module.exports = {
  listClients, upsertClient, getClientById,
  listFleetDrivers, upsertFleetDriver, getDriverById,
  listFleetUnits, upsertFleetUnit, getUnitById,
  listClientOrders, upsertClientOrder, getOrderById,
  listOrderAllocations, createOrderAllocation,
  getFleetOrderStats, seedFleetOrderData, getFullFleetOrderBundle
};
