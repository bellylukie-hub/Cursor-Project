const db = require('../db/database');
const {
  getWorkflowSteps,
  getBorderSteps,
  getNextStepKey
} = require('../config/workflows');

function now() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function getTrip(tripNumber) {
  return db.prepare('SELECT * FROM trips WHERE trip_number = ?').get(tripNumber);
}

function getTripById(id) {
  return db.prepare('SELECT * FROM trips WHERE id = ?').get(id);
}

function getWorkflowStepsForTrip(tripId) {
  return db.prepare('SELECT * FROM workflow_steps WHERE trip_id = ? ORDER BY step_order').all(tripId);
}

function getBorderStepsForTrip(tripId) {
  return db.prepare('SELECT * FROM border_clearance_steps WHERE trip_id = ? ORDER BY step_order').all(tripId);
}

function getKanyakaRecord(tripId) {
  return db.prepare('SELECT * FROM kanyaka_records WHERE trip_id = ?').get(tripId);
}

function getPodRecord(tripId) {
  return db.prepare('SELECT * FROM pod_records WHERE trip_id = ?').get(tripId);
}

function getTurnaround(id) {
  return db.prepare('SELECT * FROM turnarounds WHERE id = ?').get(id);
}

function getTruck(id) {
  return db.prepare('SELECT * FROM trucks WHERE id = ?').get(id);
}

function getFleetOwner(id) {
  return db.prepare('SELECT * FROM fleet_owners WHERE id = ?').get(id);
}

function logAudit(action, targetId, targetType, details, user = { id: 'system', username: 'system' }) {
  db.prepare(`
    INSERT INTO audit_logs (user_id, username, action, target_id, target_type, ip_address, details)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(user.id, user.username, action, targetId || '', targetType || 'system', '127.0.0.1', details || '');
}

function initWorkflowSteps(tripId, direction) {
  const steps = getWorkflowSteps(direction);
  const insert = db.prepare(`
    INSERT INTO workflow_steps (trip_id, step_key, step_order, label, status, started_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  steps.forEach((step, i) => {
    const status = i === 0 ? 'current' : 'pending';
    const started = i === 0 ? now() : null;
    insert.run(tripId, step.key, step.order, step.label, status, started);
  });
}

function initBorderSteps(tripId, direction, borderProcess) {
  const processType = direction === 'SB' ? 'SB_EXIT' : (borderProcess || 'KBP');
  const stepNames = direction === 'SB'
    ? getBorderSteps('SB_EXIT')
    : getBorderSteps(borderProcess || 'KBP');

  const insert = db.prepare(`
    INSERT INTO border_clearance_steps (trip_id, process_type, step_order, step_name, status)
    VALUES (?, ?, ?, ?, ?)
  `);
  stepNames.forEach((name, i) => {
    insert.run(tripId, processType, i + 1, name, i === 0 ? 'current' : 'pending');
  });
}

function initKanyakaRecord(tripId, direction) {
  db.prepare(`
    INSERT INTO kanyaka_records (trip_id, direction) VALUES (?, ?)
  `).run(tripId, direction);
}

function initPodRecord(tripId, turnaroundId) {
  db.prepare(`
    INSERT INTO pod_records (trip_id, turnaround_id) VALUES (?, ?)
  `).run(tripId, turnaroundId);
}

function allBorderStepsComplete(tripId) {
  const steps = getBorderStepsForTrip(tripId);
  return steps.length > 0 && steps.every(s => s.status === 'completed');
}

function validateCanAdvance(trip, stepKey) {
  const steps = getWorkflowStepsForTrip(trip.id);
  const target = steps.find(s => s.step_key === stepKey);
  if (!target) throw new Error(`Unknown workflow step: ${stepKey}`);
  if (target.status === 'completed') throw new Error(`Step "${target.label}" is already completed`);

  const current = steps.find(s => s.status === 'current');
  if (!current) throw new Error('No current workflow step found');
  if (current.step_key !== stepKey) {
    throw new Error(`Cannot advance to "${target.label}". Current step is "${current.label}". Steps must be completed in order.`);
  }

  if (stepKey === 'kanyaka' || stepKey === 'kanyaka_sb') {
    if (stepKey === 'kanyaka') {
      if (!allBorderStepsComplete(trip.id)) {
        throw new Error('NB border clearance must be fully completed before Kanyaka transit.');
      }
    }
    const kanyaka = getKanyakaRecord(trip.id);
    if (stepKey === 'kanyaka_sb') {
      const priorSteps = steps.filter(s => s.step_order < target.step_order);
      if (!priorSteps.every(s => s.status === 'completed')) {
        throw new Error('SB loading, documents, seal, escort, and dispatch must complete before Kanyaka.');
      }
      if (!kanyaka?.gov_list_uploaded && !kanyaka?.exception_approved) {
        throw new Error('Gov List must be uploaded from the mine (or Kanyaka exception approved) before transit.');
      }
    }
  }

  if (stepKey === 'offloading') {
    const kanyaka = getKanyakaRecord(trip.id);
    const kanyakaStep = steps.find(s => s.step_key === 'kanyaka');
    if (kanyakaStep?.status !== 'completed') {
      throw new Error('Kanyaka transit must be completed before offloading.');
    }
    if (kanyaka && !kanyaka.transit_completed_at && !kanyaka.exception_approved) {
      throw new Error('Kanyaka transit not marked complete.');
    }
  }

  if (stepKey === 'pod') {
    const offload = steps.find(s => s.step_key === 'offloading');
    if (offload?.status !== 'completed') {
      throw new Error('Offloading must be completed before POD collection.');
    }
  }

  if (stepKey === 'border' && trip.direction === 'SB') {
    const kanyakaSb = steps.find(s => s.step_key === 'kanyaka_sb');
    if (kanyakaSb?.status !== 'completed') {
      throw new Error('Kanyaka SB (gov list & transit) must complete before border exit clearance.');
    }
  }

  if (stepKey === 'border' && trip.direction === 'NB') {
    // Completing border step itself handled via border sub-steps
  }

  return { current, target, steps };
}

function completeWorkflowStep(tripNumber, stepKey, user = {}) {
  const trip = getTrip(tripNumber);
  if (!trip) throw new Error(`Trip not found: ${tripNumber}`);

  const { current, target } = validateCanAdvance(trip, stepKey);

  if (stepKey === 'border' && (target.requiresSubSteps || true)) {
    if (!allBorderStepsComplete(trip.id)) {
      throw new Error('All border clearance sub-steps must be completed before advancing past border.');
    }
  }

  const ts = now();
  db.prepare(`UPDATE workflow_steps SET status = 'completed', completed_at = ? WHERE trip_id = ? AND step_key = ?`)
    .run(ts, trip.id, stepKey);

  const nextKey = getNextStepKey(trip.direction, stepKey);
  let newStatus = trip.status;
  let newCurrentKey = nextKey;

  if (nextKey) {
    db.prepare(`UPDATE workflow_steps SET status = 'current', started_at = ? WHERE trip_id = ? AND step_key = ?`)
      .run(ts, trip.id, nextKey);
    const nextStep = getWorkflowSteps(trip.direction).find(s => s.key === nextKey);
    newStatus = nextStep?.label || nextKey;
  } else {
    newStatus = trip.direction === 'NB' ? 'NB Complete — Awaiting SB' : 'Exit to Zambia — Complete';
    newCurrentKey = null;
    if (trip.direction === 'SB') {
      db.prepare(`UPDATE trips SET exit_to_zambia_at = ? WHERE id = ?`).run(ts, trip.id);
      db.prepare(`UPDATE turnarounds SET status = 'completed', completed_at = ? WHERE id = ?`)
        .run(ts, trip.turnaround_id);
    }
  }

  db.prepare(`UPDATE trips SET status = ?, current_step_key = ?, updated_at = ? WHERE id = ?`)
    .run(newStatus, newCurrentKey, ts, trip.id);

  if (stepKey === 'kanyaka' || stepKey === 'kanyaka_sb') {
    db.prepare(`UPDATE kanyaka_records SET transit_completed_at = ? WHERE trip_id = ?`).run(ts, trip.id);
  }

  logAudit(`Completed workflow step: ${target.label}`, trip.trip_number, 'trip', `step=${stepKey}`, user);

  return getTripFull(tripNumber);
}

function completeBorderSubStep(tripNumber, stepOrder, user = {}) {
  const trip = getTrip(tripNumber);
  if (!trip) throw new Error(`Trip not found: ${tripNumber}`);

  const borderSteps = getBorderStepsForTrip(trip.id);
  const step = borderSteps.find(s => s.step_order === stepOrder);
  if (!step) throw new Error(`Border step ${stepOrder} not found`);
  if (step.status === 'completed') throw new Error(`Border step "${step.step_name}" already completed`);

  const current = borderSteps.find(s => s.status === 'current');
  if (current && current.step_order !== stepOrder) {
    throw new Error(`Must complete "${current.step_name}" before "${step.step_name}"`);
  }

  const ts = now();
  db.prepare(`UPDATE border_clearance_steps SET status = 'completed', completed_at = ? WHERE trip_id = ? AND step_order = ?`)
    .run(ts, trip.id, stepOrder);

  const next = borderSteps.find(s => s.step_order === stepOrder + 1);
  if (next) {
    db.prepare(`UPDATE border_clearance_steps SET status = 'current' WHERE trip_id = ? AND step_order = ?`)
      .run(trip.id, stepOrder + 1);
  } else {
    const wfStep = getWorkflowStepsForTrip(trip.id).find(s => s.step_key === 'border');
    if (wfStep && wfStep.status === 'current') {
      completeWorkflowStep(tripNumber, 'border', user);
    }
  }

  logAudit(`Completed border step: ${step.step_name}`, trip.trip_number, 'border', `order=${stepOrder}`, user);
  return getTripFull(tripNumber);
}

function uploadGovList(tripNumber, fileName, user = {}) {
  const trip = getTrip(tripNumber);
  if (!trip) throw new Error(`Trip not found: ${tripNumber}`);
  if (trip.direction !== 'SB') throw new Error('Gov List upload applies to SB trips at Kanyaka only');

  const kanyakaStep = getWorkflowStepsForTrip(trip.id).find(s => s.step_key === 'kanyaka_sb');
  if (!kanyakaStep) throw new Error('Kanyaka SB step not initialized');

  const ts = now();
  db.prepare(`
    INSERT INTO kanyaka_records (trip_id, direction, gov_list_uploaded, gov_list_file, gov_list_uploaded_at)
    VALUES (?, 'SB', 1, ?, ?)
    ON CONFLICT(trip_id) DO UPDATE SET
      gov_list_uploaded = 1, gov_list_file = excluded.gov_list_file, gov_list_uploaded_at = excluded.gov_list_uploaded_at
  `).run(trip.id, fileName, ts);

  logAudit(`Uploaded Gov List for ${tripNumber}`, trip.trip_number, 'kanyaka', fileName, user);
  return getTripFull(tripNumber);
}

function approveKanyakaException(tripNumber, reason, approvedBy = 'super_admin', user = {}) {
  const trip = getTrip(tripNumber);
  if (!trip) throw new Error(`Trip not found: ${tripNumber}`);

  const ts = now();
  db.prepare(`
    INSERT INTO kanyaka_records (trip_id, direction, exception_reason, exception_approved, exception_approved_at, exception_approved_by)
    VALUES (?, ?, ?, 1, ?, ?)
    ON CONFLICT(trip_id) DO UPDATE SET
      exception_reason = excluded.exception_reason,
      exception_approved = 1,
      exception_approved_at = excluded.exception_approved_at,
      exception_approved_by = excluded.exception_approved_by
  `).run(trip.id, trip.direction, reason, ts, approvedBy);

  logAudit(`Kanyaka exception approved for ${tripNumber}`, trip.trip_number, 'kanyaka', reason, user);
  return getTripFull(tripNumber);
}

function advancePodStage(tripNumber, stage, user = {}) {
  const trip = getTrip(tripNumber);
  if (!trip || trip.direction !== 'NB') throw new Error('POD applies to NB trips only');

  const pod = getPodRecord(trip.id);
  if (!pod) throw new Error('POD record not found');

  const podStep = getWorkflowStepsForTrip(trip.id).find(s => s.step_key === 'pod');
  if (podStep?.status !== 'current' && stage === 'collected') {
    const offload = getWorkflowStepsForTrip(trip.id).find(s => s.step_key === 'offloading');
    if (offload?.status !== 'completed') {
      throw new Error('Offloading must be completed before POD collection.');
    }
    db.prepare(`UPDATE workflow_steps SET status = 'current', started_at = ? WHERE trip_id = ? AND step_key = 'pod'`)
      .run(now(), trip.id);
  }

  const ts = now();
  const updates = {
    collected: () => db.prepare(`UPDATE pod_records SET collected = 1, collected_on_time = 1, collected_date = ? WHERE trip_id = ?`).run(ts, trip.id),
    scanned: () => {
      if (!pod.collected) throw new Error('POD must be collected before scanning');
      db.prepare(`UPDATE pod_records SET scanned = 1, scanned_date = ?, scanned_by = ? WHERE trip_id = ?`).run(ts, user.username || 'agent', trip.id);
    },
    uploaded: () => {
      if (!pod.scanned) throw new Error('POD must be scanned before upload');
      db.prepare(`UPDATE pod_records SET uploaded = 1, uploaded_date = ? WHERE trip_id = ?`).run(ts, trip.id);
    },
    sent_to_invoicing: () => {
      if (!pod.uploaded) throw new Error('POD must be uploaded before sending to invoicing');
      db.prepare(`UPDATE pod_records SET sent_to_invoicing = 1, sent_date = ? WHERE trip_id = ?`).run(ts, trip.id);
      completeWorkflowStep(tripNumber, 'pod', user);
      db.prepare(`UPDATE turnarounds SET status = 'nb_complete' WHERE id = ?`).run(trip.turnaround_id);
    }
  };

  if (!updates[stage]) throw new Error(`Unknown POD stage: ${stage}`);
  updates[stage]();

  logAudit(`POD stage: ${stage} for ${tripNumber}`, trip.trip_number, 'pod', stage, user);
  return getTripFull(tripNumber);
}

function tripToFrontend(trip, workflow, border, kanyaka, pod, turnaround, truck) {
  const workflowObj = {};
  const workflowDates = {};
  workflow.forEach(s => {
    const key = trip.direction === 'SB' && s.step_key === 'loading' ? 'loadingProcess'
      : trip.direction === 'SB' && s.step_key === 'kanyaka_sb' ? 'kanyaka'
      : s.step_key;
    workflowObj[key] = s.status;
    if (s.started_at) workflowDates[key] = s.started_at;
    if (s.completed_at) workflowDates[key + '_completed'] = s.completed_at;
  });

  return {
    tripNumber: trip.trip_number,
    truck: truck?.plate_number || trip.truck_id,
    driver: trip.driver,
    direction: trip.direction,
    area: trip.area,
    owner: trip.owner,
    entryBorder: trip.entry_border,
    exitBorder: trip.exit_border,
    offloadingPoint: trip.offloading_point,
    loadingPoint: trip.loading_point,
    borderProcess: trip.border_process,
    status: trip.status,
    daysInDRC: trip.days_in_drc,
    kpi: trip.kpi,
    workflow: workflowObj,
    workflowDates,
    turnaroundId: trip.turnaround_id,
    truckId: trip.truck_id,
    currentStepKey: trip.current_step_key,
    exitToZambiaAt: trip.exit_to_zambia_at,
    borderSteps: border,
    kanyaka,
    pod,
    turnaround,
    sameTruckEnforced: turnaround?.same_truck_enforced === 1
  };
}

function getTripFull(tripNumber) {
  const trip = getTrip(tripNumber);
  if (!trip) return null;
  const workflow = getWorkflowStepsForTrip(trip.id);
  const border = getBorderStepsForTrip(trip.id);
  const kanyaka = getKanyakaRecord(trip.id);
  const pod = getPodRecord(trip.id);
  const turnaround = trip.turnaround_id ? getTurnaround(trip.turnaround_id) : null;
  const truck = getTruck(trip.truck_id);
  return tripToFrontend(trip, workflow, border, kanyaka, pod, turnaround, truck);
}

function listTrips(filters = {}) {
  let sql = 'SELECT trip_number FROM trips WHERE 1=1';
  const params = [];
  if (filters.direction) { sql += ' AND direction = ?'; params.push(filters.direction); }
  sql += ' ORDER BY created_at DESC';
  return db.prepare(sql).all(...params).map(r => getTripFull(r.trip_number));
}

module.exports = {
  now,
  getTrip,
  getTripById,
  getTripFull,
  listTrips,
  initWorkflowSteps,
  initBorderSteps,
  initKanyakaRecord,
  initPodRecord,
  completeWorkflowStep,
  completeBorderSubStep,
  uploadGovList,
  approveKanyakaException,
  advancePodStage,
  logAudit,
  getWorkflowStepsForTrip,
  getBorderStepsForTrip,
  getKanyakaRecord,
  getPodRecord,
  getTurnaround,
  getTruck,
  getFleetOwner,
  allBorderStepsComplete,
  validateCanAdvance
};
