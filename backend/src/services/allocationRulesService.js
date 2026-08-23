const db = require('../db/database');

function parseJson(val, fallback) {
  if (!val) return fallback;
  try { return JSON.parse(val); } catch { return fallback; }
}

function normLoc(s) {
  return String(s || '').trim().toLowerCase();
}

function getOrderLoadsState(order) {
  const ld = order.loadDetails || {};
  const totalLoads = Number(ld.noOfLoads || ld.loadsTotal || 0) || Math.ceil(Number(ld.tonnage || ld.quantity || 0) / Number(ld.qtyPerTruck || 34) || 1);
  const allocated = Number(ld.loadsAllocated || 0);
  const remaining = Number(ld.loadsRemaining != null ? ld.loadsRemaining : totalLoads - allocated);
  return { totalLoads, allocated, remaining, qtyPerTruck: Number(ld.qtyPerTruck || 34), tonnage: Number(ld.tonnage || 0) };
}

function getUnitLastDestination(unitId) {
  const u = db.prepare('SELECT last_destination, last_origin, truck_plate FROM fleet_units WHERE id = ?').get(unitId);
  return u || null;
}

function listWeightRegulations(countryCode) {
  let rows = db.prepare('SELECT * FROM weight_regulations WHERE active = 1 ORDER BY country_code').all();
  if (countryCode) rows = rows.filter(r => r.country_code === countryCode);
  return rows.map(r => ({
    id: r.id, countryCode: r.country_code, name: r.name,
    gvwMaxMt: r.gvw_max_mt, gcmMaxMt: r.gcm_max_mt,
    axleLimits: parseJson(r.axle_limits_json, {}),
    containerRules: parseJson(r.container_rules_json, {}),
    notes: r.notes || ''
  }));
}

function getTruckTrailerCapacity(unitId) {
  const unit = db.prepare('SELECT truck_plate, trailer_plate FROM fleet_units WHERE id = ?').get(unitId);
  if (!unit) return { truckMt: 0, trailerMt: 0, combinedMt: 0 };
  let truckMt = 0;
  let trailerMt = 0;
  if (unit.truck_plate) {
    const t = db.prepare('SELECT capacity_mt, details_json FROM fleet_trucks WHERE plate = ? COLLATE NOCASE').get(unit.truck_plate);
    truckMt = t?.capacity_mt || 0;
    const dj = parseJson(t?.details_json, {});
    if (!truckMt && dj.grossWeight) truckMt = Number(dj.grossWeight) || 0;
  }
  if (unit.trailer_plate) {
    const tr = db.prepare('SELECT capacity_mt FROM fleet_trailers WHERE plate = ? COLLATE NOCASE').get(unit.trailer_plate);
    trailerMt = tr?.capacity_mt || 0;
  }
  return { truckMt, trailerMt, combinedMt: truckMt + trailerMt };
}

function buildWeightPlan(order, unitId, containers, countries) {
  const ld = order.loadDetails || {};
  const containerLines = containers || ld.containerLines || [];
  const capacity = getTruckTrailerCapacity(unitId);
  const regs = listWeightRegulations();
  const countryList = countries || [order.originCountry, order.destinationCountry].filter(Boolean);
  const applicable = regs.filter(r => countryList.includes(r.countryCode));
  const strictest = applicable.reduce((best, r) => {
    if (!best || (r.gvwMaxMt && r.gvwMaxMt < best.gvwMaxMt)) return r;
    return best;
  }, null);
  const maxLegal = strictest?.gvwMaxMt || capacity.combinedMt || 56;
  const loadTonnage = Number(ld.qtyPerTruck || ld.tonnage / (ld.noOfLoads || 1) || 34);
  const positions = ['Front', 'Middle', 'Rear'];
  const suggestions = containerLines.map((c, i) => {
    const wt = Number(c.weightMt || c.grossWeight || loadTonnage / containerLines.length || 0);
    const pos = c.position || positions[i % positions.length];
    return {
      containerNo: c.containerNo || c.containerNumber || `CNTR-${i + 1}`,
      suggestedPosition: pos,
      weightMt: wt,
      withinLimit: wt <= maxLegal / Math.max(containerLines.length, 1)
    };
  });
  const totalWeight = suggestions.reduce((s, x) => s + x.weightMt, 0);
  const compliant = totalWeight <= maxLegal && totalWeight <= capacity.combinedMt;
  return {
    compliant,
    totalWeightMt: totalWeight,
    maxLegalMt: maxLegal,
    vehicleCapacityMt: capacity.combinedMt,
    regulation: strictest,
    suggestions,
    warnings: compliant ? [] : [
      totalWeight > maxLegal ? `Total ${totalWeight.toFixed(1)}t exceeds legal limit ${maxLegal}t (${strictest?.name || 'route'})` : null,
      totalWeight > capacity.combinedMt ? `Total exceeds vehicle rated capacity ${capacity.combinedMt}t` : null
    ].filter(Boolean),
    userMustValidate: true
  };
}

function validateAllocation(orderId, fleetUnitId, details = {}) {
  const orderRow = db.prepare('SELECT * FROM client_orders WHERE id = ?').get(orderId);
  if (!orderRow) throw new Error('Order not found');
  const unit = db.prepare('SELECT * FROM fleet_units WHERE id = ?').get(fleetUnitId);
  if (!unit) throw new Error('Fleet unit not found');

  const order = {
    id: orderRow.id,
    origin: orderRow.origin,
    destination: orderRow.destination,
    originCountry: orderRow.origin_country,
    destinationCountry: orderRow.destination_country,
    loadDetails: parseJson(orderRow.order_details_json, {})
  };

  const loads = getOrderLoadsState(order);
  const loadQty = Number(details.loadQty || 1);
  if (loads.remaining <= 0) {
    return { ok: false, code: 'NO_CARGO_LEFT', message: 'No loads remaining on this order — cargo fully allocated.' };
  }
  if (loadQty > loads.remaining) {
    return { ok: false, code: 'EXCESS_QTY', message: `Only ${loads.remaining} load(s) remaining; requested ${loadQty}.` };
  }

  const orderOrigin = normLoc(order.origin);
  const lastDest = normLoc(unit.last_destination);
  let requiresEmptyTrip = false;
  let emptyTrip = null;

  if (lastDest && orderOrigin && lastDest !== orderOrigin) {
    requiresEmptyTrip = true;
    const existing = db.prepare(`
      SELECT * FROM empty_trip_legs
      WHERE fleet_unit_id = ? AND status IN ('planned', 'in_transit')
        AND LOWER(from_location) = ? AND LOWER(to_location) = ?
    `).get(fleetUnitId, lastDest, orderOrigin);
    if (!existing && !details.emptyTripAcknowledged) {
      return {
        ok: false,
        code: 'EMPTY_TRIP_REQUIRED',
        message: `Truck last destination is "${unit.last_destination}". Empty repositioning to "${order.origin}" required before loading this order.`,
        emptyTrip: { from: unit.last_destination, to: order.origin }
      };
    }
    emptyTrip = existing;
  }

  const weightPlan = buildWeightPlan(order, fleetUnitId, details.containers, details.countries);
  if (!weightPlan.compliant && !details.weightOverrideAcknowledged) {
    return {
      ok: false,
      code: 'WEIGHT_WARNING',
      message: weightPlan.warnings.join('; '),
      weightPlan
    };
  }

  return {
    ok: true,
    loads,
    requiresEmptyTrip,
    emptyTrip,
    weightPlan
  };
}

function applyAllocationLoadDecrement(orderId, loadQty = 1) {
  const row = db.prepare('SELECT order_details_json FROM client_orders WHERE id = ?').get(orderId);
  if (!row) return null;
  const ld = parseJson(row.order_details_json, {});
  const totalLoads = Number(ld.noOfLoads || 0) || Math.ceil(Number(ld.tonnage || 0) / Number(ld.qtyPerTruck || 34) || 1);
  const allocated = Number(ld.loadsAllocated || 0) + loadQty;
  const remaining = Math.max(0, totalLoads - allocated);
  ld.loadsAllocated = allocated;
  ld.loadsRemaining = remaining;
  ld.loadsTotal = totalLoads;
  db.prepare('UPDATE client_orders SET order_details_json = ?, updated_at = datetime(\'now\') WHERE id = ?')
    .run(JSON.stringify(ld), orderId);
  if (remaining <= 0) {
    db.prepare('UPDATE client_orders SET status = \'completed\', updated_at = datetime(\'now\') WHERE id = ?').run(orderId);
  }
  return ld;
}

function createEmptyTripLeg(body, user) {
  const id = body.id || `ET-${Date.now()}`;
  db.prepare(`
    INSERT INTO empty_trip_legs (id, fleet_unit_id, from_location, to_location, status, trip_reference, scheduled_date, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, body.fleetUnitId, body.fromLocation, body.toLocation, body.status || 'planned',
    body.tripReference || '', body.scheduledDate || '', body.notes || '');
  db.prepare('UPDATE fleet_units SET status = \'repositioning\' WHERE id = ?').run(body.fleetUnitId);
  return db.prepare('SELECT * FROM empty_trip_legs WHERE id = ?').get(id);
}

function completeEmptyTripLeg(id) {
  const leg = db.prepare('SELECT * FROM empty_trip_legs WHERE id = ?').get(id);
  if (!leg) throw new Error('Empty trip not found');
  db.prepare('UPDATE empty_trip_legs SET status = \'completed\', completed_at = datetime(\'now\') WHERE id = ?').run(id);
  db.prepare('UPDATE fleet_units SET last_destination = ?, last_origin = ?, status = \'available\' WHERE id = ?')
    .run(leg.to_location, leg.from_location, leg.fleet_unit_id);
  return db.prepare('SELECT * FROM empty_trip_legs WHERE id = ?').get(id);
}

module.exports = {
  validateAllocation,
  applyAllocationLoadDecrement,
  buildWeightPlan,
  listWeightRegulations,
  getOrderLoadsState,
  createEmptyTripLeg,
  completeEmptyTripLeg
};
