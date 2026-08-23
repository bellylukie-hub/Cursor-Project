const db = require('../db/database');

function parseJson(val, fallback) {
  if (!val) return fallback;
  try { return JSON.parse(val); } catch { return fallback; }
}

function rowToFuelTx(r) {
  return {
    id: r.id, fleetUnitId: r.fleet_unit_id, driverId: r.driver_id, tripId: r.trip_id,
    transactionType: r.transaction_type, fuelStation: r.fuel_station,
    litres: r.litres, cost: r.cost, odometerKm: r.odometer_km,
    gpsLat: r.gps_lat, gpsLng: r.gps_lng,
    tankLevelBefore: r.tank_level_before, tankLevelAfter: r.tank_level_after,
    satelliteSource: r.satellite_source, recordedAt: r.recorded_at,
    recordedBy: r.recorded_by, notes: r.notes
  };
}

function listFuelTransactions(fleetUnitId) {
  const sql = fleetUnitId
    ? 'SELECT * FROM fuel_transactions WHERE fleet_unit_id = ? ORDER BY recorded_at DESC'
    : 'SELECT * FROM fuel_transactions ORDER BY recorded_at DESC LIMIT 500';
  const rows = fleetUnitId ? db.prepare(sql).all(fleetUnitId) : db.prepare(sql).all();
  return rows.map(rowToFuelTx);
}

function recordFuelTransaction(body, user) {
  const id = body.id || `FUEL-${Date.now()}`;
  db.prepare(`
    INSERT INTO fuel_transactions (id, fleet_unit_id, driver_id, trip_id, transaction_type, fuel_station, litres, cost, odometer_km, gps_lat, gps_lng, tank_level_before, tank_level_after, satellite_source, recorded_by, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, body.fleetUnitId, body.driverId || null, body.tripId || null,
    body.transactionType || 'issue', body.fuelStation || '', Number(body.litres || 0),
    Number(body.cost || 0), body.odometerKm || null, body.gpsLat || null, body.gpsLng || null,
    body.tankLevelBefore || null, body.tankLevelAfter || null, body.satelliteSource || 'manual',
    user?.username || 'system', body.notes || '');
  if (body.odometerKm != null) {
    db.prepare('UPDATE fleet_units SET odometer_km = ? WHERE id = ?').run(body.odometerKm, body.fleetUnitId);
  }
  return rowToFuelTx(db.prepare('SELECT * FROM fuel_transactions WHERE id = ?').get(id));
}

function getFuelAnalysis(fleetUnitId) {
  const txs = listFuelTransactions(fleetUnitId).filter(t => t.transactionType === 'issue' && t.litres > 0);
  const unit = db.prepare('SELECT * FROM fleet_units WHERE id = ?').get(fleetUnitId);
  const truck = unit?.truck_plate
    ? db.prepare('SELECT details_json, capacity_mt FROM fleet_trucks WHERE plate = ? COLLATE NOCASE').get(unit.truck_plate)
    : null;
  const engine = parseJson(truck?.details_json, {});
  const tankCapacityL = Number(engine.fuelTank1Capacity || engine.fuelTankCapacity || 400);
  const engineHp = Number(engine.enginePowerHp || engine.horsepower || 0);

  const rows = [];
  let prevOdo = null;
  txs.sort((a, b) => String(a.recordedAt).localeCompare(String(b.recordedAt)));
  txs.forEach(t => {
    const odo = Number(t.odometerKm || 0);
    const distanceKm = prevOdo && odo > prevOdo ? odo - prevOdo : null;
    const litres = Number(t.litres || 0);
    const lPer100 = distanceKm && distanceKm > 0 ? (litres / distanceKm) * 100 : null;
    const normConsumption = engineHp ? (lPer100 ? lPer100 / (engineHp / 100) : null) : lPer100;
    rows.push({
      ...t,
      distanceKm,
      litresPer100Km: lPer100,
      normIndex: normConsumption,
      tankCapacityL,
      engineHp,
      efficiencyFlag: lPer100 != null && lPer100 > 45 ? 'high' : lPer100 != null && lPer100 < 25 ? 'low' : 'normal'
    });
    if (odo) prevOdo = odo;
  });

  const totalLitres = txs.reduce((s, t) => s + Number(t.litres || 0), 0);
  const totalDistance = rows.reduce((s, r) => s + (r.distanceKm || 0), 0);
  const avgLPer100 = totalDistance > 0 ? (totalLitres / totalDistance) * 100 : null;

  return {
    fleetUnitId,
    truckPlate: unit?.truck_plate,
    gpsLat: unit?.gps_lat,
    gpsLng: unit?.gps_lng,
    tankCapacityL,
    engineHp,
    summary: {
      totalLitres,
      totalDistanceKm: totalDistance,
      avgLitresPer100Km: avgLPer100,
      transactionCount: txs.length
    },
    transactions: rows.reverse()
  };
}

function getFuelFleetOverview() {
  const units = db.prepare('SELECT id, truck_plate, gps_lat, gps_lng, odometer_km FROM fleet_units').all();
  return units.map(u => {
    const analysis = getFuelAnalysis(u.id);
    return {
      fleetUnitId: u.id,
      truckPlate: u.truck_plate,
      gpsLat: u.gps_lat,
      gpsLng: u.gps_lng,
      odometerKm: u.odometer_km,
      avgLitresPer100Km: analysis.summary.avgLitresPer100Km,
      totalLitres: analysis.summary.totalLitres,
      efficiencyFlag: analysis.transactions[0]?.efficiencyFlag || 'normal'
    };
  });
}

module.exports = {
  listFuelTransactions,
  recordFuelTransaction,
  getFuelAnalysis,
  getFuelFleetOverview
};
