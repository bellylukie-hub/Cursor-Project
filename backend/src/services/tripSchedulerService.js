const db = require('../db/database');
const routeCatalog = require('./routeCatalogService');
const fleetOrder = require('./fleetOrderService');

function rowToTrip(r) {
  let tripOrders = [];
  try { tripOrders = r.trip_orders_json ? JSON.parse(r.trip_orders_json) : []; } catch (_) {}
  return {
    id: r.id, tripReference: r.trip_reference, scheduledLoadingDate: r.scheduled_loading_date,
    scheduledTime: r.scheduled_time, transporter: r.transporter,
    fleetUnitId: r.fleet_unit_id, truckPlate: r.truck_plate, trailerPlate: r.trailer_plate,
    secondTrailerPlate: r.second_trailer_plate, driverId: r.driver_id, coDriver: r.co_driver,
    currentTruckPosition: r.current_truck_position, bivacNo: r.bivac_no,
    clientInvoiceNo: r.client_invoice_no, poClientOrderNo: r.po_client_order_no,
    status: r.status, notes: r.notes, createdBy: r.created_by,
    createdAt: r.created_at, updatedAt: r.updated_at, tripOrders
  };
}

function listTrips() {
  return db.prepare('SELECT * FROM fleet_trips ORDER BY created_at DESC').all().map(rowToTrip);
}

function getTripById(id) {
  const r = db.prepare('SELECT * FROM fleet_trips WHERE id = ?').get(id);
  return r ? rowToTrip(r) : null;
}

function upsertTrip(body, user) {
  const id = body.id || `TRIP-${Date.now()}`;
  const tripRef = body.tripReference || `TR-${Date.now().toString().slice(-6)}`;
  const tripOrders = body.tripOrders || [];

  db.prepare(`
    INSERT INTO fleet_trips (
      id, trip_reference, scheduled_loading_date, scheduled_time, transporter,
      fleet_unit_id, truck_plate, trailer_plate, second_trailer_plate,
      driver_id, co_driver, current_truck_position, bivac_no, client_invoice_no,
      po_client_order_no, status, notes, trip_orders_json, created_by, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      trip_reference = excluded.trip_reference, scheduled_loading_date = excluded.scheduled_loading_date,
      scheduled_time = excluded.scheduled_time, transporter = excluded.transporter,
      fleet_unit_id = excluded.fleet_unit_id, truck_plate = excluded.truck_plate,
      trailer_plate = excluded.trailer_plate, second_trailer_plate = excluded.second_trailer_plate,
      driver_id = excluded.driver_id, co_driver = excluded.co_driver,
      current_truck_position = excluded.current_truck_position, bivac_no = excluded.bivac_no,
      client_invoice_no = excluded.client_invoice_no, po_client_order_no = excluded.po_client_order_no,
      status = excluded.status, notes = excluded.notes,
      trip_orders_json = excluded.trip_orders_json, updated_at = datetime('now')
  `).run(
    id, tripRef, body.scheduledLoadingDate || '', body.scheduledTime || '07:00',
    body.transporter || 'Greendoor Group', body.fleetUnitId || null,
    body.truckPlate || '', body.trailerPlate || '', body.secondTrailerPlate || '',
    body.driverId || null, body.coDriver || '', body.currentTruckPosition || '',
    body.bivacNo || '', body.clientInvoiceNo || '', body.poClientOrderNo || '',
    body.status || 'draft', body.notes || '', JSON.stringify(tripOrders),
    user?.username || 'system'
  );

  // Link orders to trip via allocations
  tripOrders.forEach(to => {
    if (!to.orderId || !body.fleetUnitId) return;
    try {
      fleetOrder.createOrderAllocation({
        orderId: to.orderId, fleetUnitId: body.fleetUnitId,
        scheduledDate: body.scheduledLoadingDate, status: 'scheduled'
      }, user);
    } catch (_) { /* already allocated */ }
  });

  return getTripById(id);
}

function addOrderToTrip(tripId, orderPayload, user) {
  const trip = getTripById(tripId);
  if (!trip) throw new Error('Trip not found');
  const order = fleetOrder.getOrderById(orderPayload.orderId);
  if (!order) throw new Error('Order not found');

  const route = routeCatalog.resolveRoute(
    orderPayload.originStationId || '',
    orderPayload.destStationId || ''
  );

  const ld = order.loadDetails || {};
  const containerLines = ld.containerLines || [];
  const firstContainer = containerLines[0] || {};
  const line = {
    slNo: (trip.tripOrders || []).length + 1,
    orderId: order.id, orderNumber: order.orderNumber,
    clientId: order.clientId,
    clientName: order.client?.name || '',
    customerRef: order.customerRef || '',
    fromStation: order.origin, toStation: order.destination,
    loadingPoint: order.loadingPoint || '',
    offloadingPoint: order.offloadingPoint || '',
    routeType: order.routeType || '',
    cargoType: order.cargoType, commodity: order.commodity,
    orderLoadType: ld.orderLoadType || '',
    containerNo: orderPayload.containerNo || firstContainer.containerNo || '',
    containerType: firstContainer.type || firstContainer.containerType || '',
    containerLines,
    shipper: order.shipper || '', consignee: order.consignee || '',
    readyToLoadOn: order.readyToLoadOn || '',
    trailerPosition: orderPayload.trailerPosition || 'First',
    entryBorder: orderPayload.entryBorder || order.entryBorder || route.entryBorder || '',
    viaBorder1: orderPayload.viaBorder1 || order.viaBorder1 || route.viaBorder1 || '',
    viaBorder2: orderPayload.viaBorder2 || order.viaBorder2 || route.viaBorder2 || '',
    exitBorder: order.exitBorder || '', portOfEntry: order.portOfEntry || '',
    seal: orderPayload.seal || ld.sealNo || firstContainer.seal || '',
    remarks: orderPayload.remarks || ld.driverInstructions || ld.specialInstructions || order.notes || ''
  };

  const tripOrders = [...(trip.tripOrders || []), line];
  return upsertTrip({ ...trip, tripOrders, status: 'scheduled' }, user);
}

function seedDemoTrips() {
  const count = db.prepare('SELECT COUNT(*) AS c FROM fleet_trips').get().c;
  if (count > 0) return { seeded: false };
  fleetOrder.seedFleetOrderData();
  const orders = fleetOrder.listClientOrders();
  const units = fleetOrder.listFleetUnits();
  if (!orders.length || !units.length) return { seeded: false };

  upsertTrip({
    id: 'TRIP-001', tripReference: 'TR-2026-001',
    scheduledLoadingDate: '2026-08-10', scheduledTime: '07:00',
    transporter: 'Greendoor Group', fleetUnitId: units[0].id,
    truckPlate: units[0].truckPlate, trailerPlate: units[0].trailerPlate,
    driverId: units[0].driverId, status: 'scheduled',
    tripOrders: [{
      slNo: 1, orderId: orders[0].id, orderNumber: orders[0].orderNumber,
      fromStation: orders[0].origin, toStation: orders[0].destination,
      cargoType: orders[0].cargoType, commodity: orders[0].commodity,
      entryBorder: orders[0].entryBorder || 'Kasumbalesa', trailerPosition: 'First'
    }]
  }, { username: 'super_admin' });
  return { seeded: true };
}

function getSchedulerBundle() {
  return {
    trips: listTrips(),
    catalog: routeCatalog.getFullCatalog(),
    orders: fleetOrder.listClientOrders().filter(o => ['draft', 'confirmed', 'allocated'].includes(o.status)),
    units: fleetOrder.listFleetUnits(),
    drivers: fleetOrder.listFleetDrivers()
  };
}

module.exports = {
  listTrips, getTripById, upsertTrip, addOrderToTrip, seedDemoTrips, getSchedulerBundle
};
