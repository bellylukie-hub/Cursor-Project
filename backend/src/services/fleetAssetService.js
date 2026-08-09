const db = require('../db/database');

function parseDetails(r) {
  try { return r.details_json ? JSON.parse(r.details_json) : {}; } catch (_) { return {}; }
}

function rowToTruck(r) {
  const details = parseDetails(r);
  return {
    id: r.id, plate: r.plate, make: r.make || '', model: r.model || '',
    capacityMt: r.capacity_mt, status: r.status, fleetSetId: r.fleet_set_id,
    owner: r.owner || details.owner || '', fleetNo: r.fleet_no || details.fleetNo || '',
    notes: r.notes || details.remarks || '', details
  };
}

function rowToTrailer(r) {
  const details = parseDetails(r);
  return {
    id: r.id, plate: r.plate, trailerType: r.trailer_type || 'standard',
    capacityMt: r.capacity_mt, sideHeightMt: r.side_height_mt,
    status: r.status, fleetSetId: r.fleet_set_id, pairedTrailerId: r.paired_trailer_id,
    owner: r.owner || details.owner || '', fleetNo: r.fleet_no || details.fleetNo || '',
    notes: r.notes || details.remarks || '', details
  };
}

function listTrucks() {
  return db.prepare('SELECT * FROM fleet_trucks ORDER BY plate').all().map(rowToTruck);
}

function listTrailers() {
  return db.prepare('SELECT * FROM fleet_trailers ORDER BY plate').all().map(rowToTrailer);
}

function getTruckById(id) {
  const r = db.prepare('SELECT * FROM fleet_trucks WHERE id = ?').get(id);
  return r ? rowToTruck(r) : null;
}

function getTrailerById(id) {
  const r = db.prepare('SELECT * FROM fleet_trailers WHERE id = ?').get(id);
  return r ? rowToTrailer(r) : null;
}

function upsertTruck(body) {
  const id = body.id || `TRK-${Date.now()}`;
  const plate = (body.plate || body.details?.registrationNo || '').trim().toUpperCase();
  if (!plate) throw new Error('Registration No / plate is required');

  const existing = db.prepare('SELECT * FROM fleet_trucks WHERE plate = ? AND id != ?').get(plate, id);
  if (existing) throw new Error(`Truck plate ${plate} already registered`);

  const details = body.details || {};
  const owner = body.owner || details.owner || '';
  const fleetNo = body.fleetNo || details.fleetNo || '';

  db.prepare(`
    INSERT INTO fleet_trucks (id, plate, make, model, capacity_mt, status, fleet_set_id, notes, owner, fleet_no, details_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      plate = excluded.plate, make = excluded.make, model = excluded.model,
      capacity_mt = excluded.capacity_mt, status = excluded.status,
      fleet_set_id = excluded.fleet_set_id, notes = excluded.notes,
      owner = excluded.owner, fleet_no = excluded.fleet_no, details_json = excluded.details_json
  `).run(
    id, plate,
    body.make || details.vehicleMake || '',
    body.model || details.vehicleModel || '',
    body.capacityMt || details.loadingCapacity || null,
    body.status || (details.active === false ? 'inactive' : 'available'),
    body.fleetSetId || null,
    details.remarks || body.notes || '',
    owner, fleetNo,
    JSON.stringify(details)
  );
  return getTruckById(id);
}

function upsertTrailer(body) {
  const id = body.id || `TRL-${Date.now()}`;
  const plate = (body.plate || body.details?.registrationNo || '').trim().toUpperCase();
  if (!plate) throw new Error('Registration No / plate is required');

  const existing = db.prepare('SELECT * FROM fleet_trailers WHERE plate = ? AND id != ?').get(plate, id);
  if (existing) throw new Error(`Trailer plate ${plate} already registered`);

  const trailerType = body.trailerType || body.details?.trailerType || 'standard';
  if (!['standard', 'superlink-front', 'superlink-rear'].includes(trailerType)) {
    throw new Error('Invalid trailer type');
  }

  const details = body.details || {};
  const owner = body.owner || details.owner || '';
  const fleetNo = body.fleetNo || details.fleetNo || '';

  db.prepare(`
    INSERT INTO fleet_trailers (id, plate, trailer_type, capacity_mt, side_height_mt, status, fleet_set_id, paired_trailer_id, notes, owner, fleet_no, details_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      plate = excluded.plate, trailer_type = excluded.trailer_type,
      capacity_mt = excluded.capacity_mt, side_height_mt = excluded.side_height_mt,
      status = excluded.status, fleet_set_id = excluded.fleet_set_id,
      paired_trailer_id = excluded.paired_trailer_id, notes = excluded.notes,
      owner = excluded.owner, fleet_no = excluded.fleet_no, details_json = excluded.details_json
  `).run(
    id, plate, trailerType,
    body.capacityMt || details.loadingCapacity || null,
    body.sideHeightMt || details.heightCm || null,
    body.status || (details.active === false ? 'inactive' : 'available'),
    body.fleetSetId || null, body.pairedTrailerId || null,
    details.remarks || body.notes || '',
    owner, fleetNo,
    JSON.stringify(details)
  );

  if (body.pairedTrailerId) {
    db.prepare('UPDATE fleet_trailers SET paired_trailer_id = ? WHERE id = ?').run(id, body.pairedTrailerId);
    db.prepare('UPDATE fleet_trailers SET paired_trailer_id = ? WHERE id = ?').run(body.pairedTrailerId, id);
  }

  return getTrailerById(id);
}

function linkSuperlinkPair(frontId, rearId) {
  const front = getTrailerById(frontId);
  const rear = getTrailerById(rearId);
  if (!front || !rear) throw new Error('Both superlink trailers are required');
  if (front.trailerType !== 'superlink-front') throw new Error('First trailer must be superlink front');
  if (rear.trailerType !== 'superlink-rear') throw new Error('Second trailer must be superlink rear');
  if (front.fleetSetId || rear.fleetSetId) throw new Error('Trailers already assigned to a fleet set');
  if (front.pairedTrailerId || rear.pairedTrailerId) throw new Error('Trailers already paired');

  db.prepare('UPDATE fleet_trailers SET paired_trailer_id = ?, status = ? WHERE id = ?').run(rearId, 'paired', frontId);
  db.prepare('UPDATE fleet_trailers SET paired_trailer_id = ?, status = ? WHERE id = ?').run(frontId, 'paired', rearId);
  return { front: getTrailerById(frontId), rear: getTrailerById(rearId) };
}

function releaseAssetFromSet(assetType, assetId) {
  if (assetType === 'truck') {
    db.prepare('UPDATE fleet_trucks SET fleet_set_id = NULL, status = ? WHERE id = ?').run('available', assetId);
  } else {
    const t = getTrailerById(assetId);
    db.prepare('UPDATE fleet_trailers SET fleet_set_id = NULL, status = ? WHERE id = ?').run(
      t?.pairedTrailerId ? 'paired' : 'available', assetId
    );
  }
}

function assignAssetsToSet(setId, { truckId, trailerId, secondTrailerId }) {
  if (truckId) {
    const truck = getTruckById(truckId);
    if (!truck) throw new Error('Truck not found');
    if (truck.fleetSetId && truck.fleetSetId !== setId) throw new Error(`Truck ${truck.plate} is already in another fleet set`);
    db.prepare('UPDATE fleet_trucks SET fleet_set_id = ?, status = ? WHERE id = ?').run(setId, 'assigned', truckId);
  }
  if (trailerId) {
    const trailer = getTrailerById(trailerId);
    if (!trailer) throw new Error('Trailer not found');
    if (trailer.fleetSetId && trailer.fleetSetId !== setId) throw new Error(`Trailer ${trailer.plate} is already in another fleet set`);
    db.prepare('UPDATE fleet_trailers SET fleet_set_id = ?, status = ? WHERE id = ?').run(setId, 'assigned', trailerId);
    if (trailer.pairedTrailerId) {
      db.prepare('UPDATE fleet_trailers SET fleet_set_id = ?, status = ? WHERE id = ?').run(setId, 'assigned', trailer.pairedTrailerId);
    }
  }
  if (secondTrailerId && secondTrailerId !== trailerId) {
    const t2 = getTrailerById(secondTrailerId);
    if (!t2) throw new Error('Second trailer not found');
    if (t2.fleetSetId && t2.fleetSetId !== setId) throw new Error(`Trailer ${t2.plate} is already in another fleet set`);
    db.prepare('UPDATE fleet_trailers SET fleet_set_id = ?, status = ? WHERE id = ?').run(setId, 'assigned', secondTrailerId);
  }
}

module.exports = {
  listTrucks, listTrailers, getTruckById, getTrailerById,
  upsertTruck, upsertTrailer, linkSuperlinkPair, releaseAssetFromSet, assignAssetsToSet
};
