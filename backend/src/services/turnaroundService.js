const db = require('../db/database');
const {
  initWorkflowSteps,
  initBorderSteps,
  initKanyakaRecord,
  initPodRecord,
  logAudit,
  now,
  getTripFull,
  getTurnaround,
  getFleetOwner,
  getTruck
} = require('./workflowEngine');

function generateId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function getOrCreateFleetOwner(name) {
  let owner = db.prepare('SELECT * FROM fleet_owners WHERE name = ?').get(name);
  if (!owner) {
    const id = generateId('FO');
    db.prepare('INSERT INTO fleet_owners (id, name) VALUES (?, ?)').run(id, name);
    owner = db.prepare('SELECT * FROM fleet_owners WHERE id = ?').get(id);
  }
  return owner;
}

function getOrCreateTruck(plateNumber, ownerId, driver, trailerPlate) {
  let truck = db.prepare('SELECT * FROM trucks WHERE plate_number = ?').get(plateNumber);
  if (!truck) {
    const id = generateId('TRK');
    db.prepare(`
      INSERT INTO trucks (id, plate_number, trailer_plate, owner_id, assigned_driver)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, plateNumber, trailerPlate || null, ownerId, driver || null);
    truck = db.prepare('SELECT * FROM trucks WHERE id = ?').get(id);
  } else if (driver) {
    db.prepare('UPDATE trucks SET assigned_driver = ? WHERE id = ?').run(driver, truck.id);
  }
  return truck;
}

function createNbTrip(payload, user = {}) {
  const {
    tripNumber,
    truck: plateNumber,
    driver,
    owner: ownerName,
    area,
    entryBorder,
    offloadingPoint,
    borderProcess = 'KBP',
    trailerPlate
  } = payload;

  if (!tripNumber || !plateNumber || !ownerName) {
    throw new Error('tripNumber, truck (plate), and owner are required for NB upload');
  }

  const existing = db.prepare('SELECT id FROM trips WHERE trip_number = ?').get(tripNumber);
  if (existing) throw new Error(`Trip ${tripNumber} already exists`);

  const fleetOwner = getOrCreateFleetOwner(ownerName);
  const truck = getOrCreateTruck(plateNumber, fleetOwner.id, driver, trailerPlate);

  const turnaroundId = generateId('TA');
  const tripId = generateId('TRP');
  const ts = now();

  db.prepare(`
    INSERT INTO turnarounds (id, truck_id, same_truck_enforced, status, created_at)
    VALUES (?, ?, ?, 'nb_active', ?)
  `).run(turnaroundId, truck.id, fleetOwner.require_same_truck_sb, ts);

  db.prepare(`
    INSERT INTO trips (
      id, trip_number, direction, turnaround_id, truck_id, driver, owner, area,
      entry_border, offloading_point, border_process, status, current_step_key, created_at, updated_at
    ) VALUES (?, ?, 'NB', ?, ?, ?, ?, ?, ?, ?, ?, 'Border Clearance', 'border', ?, ?)
  `).run(
    tripId, tripNumber, turnaroundId, truck.id, driver, ownerName, area,
    entryBorder, offloadingPoint, borderProcess, ts, ts
  );

  db.prepare('UPDATE turnarounds SET nb_trip_id = ? WHERE id = ?').run(tripId, turnaroundId);

  initWorkflowSteps(tripId, 'NB');
  initBorderSteps(tripId, 'NB', borderProcess);
  initKanyakaRecord(tripId, 'NB');
  initPodRecord(tripId, turnaroundId);

  logAudit(`Created NB trip ${tripNumber}`, tripNumber, 'trip', JSON.stringify(payload), user);

  return getTripFull(tripNumber);
}

function createSbTripFromTurnaround(nbTripNumber, payload = {}, user = {}) {
  const nbTrip = db.prepare('SELECT * FROM trips WHERE trip_number = ? AND direction = ?').get(nbTripNumber, 'NB');
  if (!nbTrip) throw new Error(`NB trip not found: ${nbTripNumber}`);

  const turnaround = getTurnaround(nbTrip.turnaround_id);
  if (!turnaround) throw new Error('Turnaround not found');

  if (turnaround.sb_trip_id) {
    const sb = db.prepare('SELECT trip_number FROM trips WHERE id = ?').get(turnaround.sb_trip_id);
    throw new Error(`SB trip already exists for this turnaround: ${sb?.trip_number}`);
  }

  const pod = db.prepare('SELECT * FROM pod_records WHERE trip_id = ?').get(nbTrip.id);
  if (!pod?.sent_to_invoicing) {
    throw new Error('NB POD must be sent to invoicing before creating SB shipment on the same turnaround.');
  }

  const truck = getTruck(nbTrip.truck_id);
  const fleetOwner = truck?.owner_id ? getFleetOwner(truck.owner_id) : getOrCreateFleetOwner(nbTrip.owner);

  let truckId = nbTrip.truck_id;
  let truckPlate = truck?.plate_number;

  if (payload.truck && payload.truck !== truckPlate) {
    if (turnaround.same_truck_enforced || fleetOwner.require_same_truck_sb) {
      if (!payload.overrideSameTruck) {
        throw new Error(
          `Fleet "${nbTrip.owner}" requires the same truck (${truckPlate}) for SB. ` +
          'Set overrideSameTruck=true only if fleet policy allows a different unit.'
        );
      }
      const altTruck = getOrCreateTruck(payload.truck, fleetOwner.id, payload.driver || nbTrip.driver);
      truckId = altTruck.id;
      truckPlate = altTruck.plate_number;
      logAudit(`SB truck override: ${truckPlate} instead of ${getTruck(nbTrip.truck_id)?.plate_number}`, nbTripNumber, 'turnaround', 'overrideSameTruck', user);
    }
  }

  const tripNumber = payload.tripNumber || nbTripNumber.replace(/^NB/, 'SB');
  const existing = db.prepare('SELECT id FROM trips WHERE trip_number = ?').get(tripNumber);
  if (existing) throw new Error(`Trip ${tripNumber} already exists`);

  const tripId = generateId('TRP');
  const ts = now();

  db.prepare(`
    INSERT INTO trips (
      id, trip_number, direction, turnaround_id, truck_id, driver, owner, area,
      exit_border, loading_point, status, current_step_key, created_at, updated_at
    ) VALUES (?, ?, 'SB', ?, ?, ?, ?, ?, ?, ?, 'Loading', 'loading', ?, ?)
  `).run(
    tripId, tripNumber, turnaround.id, truckId,
    payload.driver || nbTrip.driver,
    nbTrip.owner,
    payload.area || 'Kanyaka',
    payload.exitBorder || 'Kasumbalesa',
    payload.loadingPoint || 'Kanyaka Mine',
    ts, ts
  );

  db.prepare('UPDATE turnarounds SET sb_trip_id = ?, status = ? WHERE id = ?')
    .run(tripId, 'sb_active', turnaround.id);

  initWorkflowSteps(tripId, 'SB');
  initBorderSteps(tripId, 'SB', 'SB_EXIT');
  initKanyakaRecord(tripId, 'SB');

  logAudit(`Created SB trip ${tripNumber} linked to NB ${nbTripNumber}`, tripNumber, 'trip', `turnaround=${turnaround.id}`, user);

  return getTripFull(tripNumber);
}

function getTurnaroundFull(turnaroundId) {
  const turnaround = getTurnaround(turnaroundId);
  if (!turnaround) return null;

  const nbTrip = turnaround.nb_trip_id
    ? db.prepare('SELECT trip_number FROM trips WHERE id = ?').get(turnaround.nb_trip_id)
    : null;
  const sbTrip = turnaround.sb_trip_id
    ? db.prepare('SELECT trip_number FROM trips WHERE id = ?').get(turnaround.sb_trip_id)
    : null;

  const truck = getTruck(turnaround.truck_id);
  const fleetOwner = truck?.owner_id ? getFleetOwner(truck.owner_id) : null;

  return {
    id: turnaround.id,
    status: turnaround.status,
    truck: truck ? { id: truck.id, plate: truck.plate_number, driver: truck.assigned_driver } : null,
    fleetOwner: fleetOwner ? { id: fleetOwner.id, name: fleetOwner.name, requireSameTruckSb: fleetOwner.require_same_truck_sb === 1 } : null,
    sameTruckEnforced: turnaround.same_truck_enforced === 1,
    nbTripNumber: nbTrip?.trip_number || null,
    sbTripNumber: sbTrip?.trip_number || null,
    createdAt: turnaround.created_at,
    completedAt: turnaround.completed_at,
    nbTrip: nbTrip ? getTripFull(nbTrip.trip_number) : null,
    sbTrip: sbTrip ? getTripFull(sbTrip.trip_number) : null
  };
}

function listTurnarounds() {
  return db.prepare('SELECT id FROM turnarounds ORDER BY created_at DESC')
    .all()
    .map(r => getTurnaroundFull(r.id));
}

function updateFleetSettings(ownerId, settings, user = {}) {
  const owner = getFleetOwner(ownerId);
  if (!owner) throw new Error('Fleet owner not found');

  if (settings.requireSameTruckSb !== undefined) {
    db.prepare('UPDATE fleet_owners SET require_same_truck_sb = ? WHERE id = ?')
      .run(settings.requireSameTruckSb ? 1 : 0, ownerId);
    logAudit(`Fleet setting updated: require_same_truck_sb=${settings.requireSameTruckSb}`, ownerId, 'fleet', owner.name, user);
  }

  return getFleetOwner(ownerId);
}

function listFleetOwners() {
  return db.prepare('SELECT * FROM fleet_owners ORDER BY name').all().map(o => ({
    id: o.id,
    name: o.name,
    requireSameTruckSb: o.require_same_truck_sb === 1
  }));
}

module.exports = {
  createNbTrip,
  createSbTripFromTurnaround,
  getTurnaroundFull,
  listTurnarounds,
  updateFleetSettings,
  listFleetOwners,
  getOrCreateFleetOwner
};
