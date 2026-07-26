/**
 * TruckControl API client — connects frontend to backend workflow engine.
 */
const API_BASE = (typeof window !== 'undefined' && window.TRUCKCONTROL_API)
  ? window.TRUCKCONTROL_API
  : (typeof location !== 'undefined' && location.port === '3001')
    ? '/api'
    : 'http://localhost:3001/api';

let apiAvailable = false;

function apiHeaders() {
  const userId = typeof CURRENT_SESSION_USER_ID !== 'undefined' ? CURRENT_SESSION_USER_ID : 'ADM-001';
  const user = typeof getCurrentAdminUser === 'function' ? getCurrentAdminUser() : null;
  return {
    'Content-Type': 'application/json',
    'X-User-Id': userId,
    'X-Username': user?.username || 'super_admin'
  };
}

async function apiRequest(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...apiHeaders(), ...(options.headers || {}) }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `API error ${res.status}`);
  return data;
}

async function checkApiHealth() {
  try {
    await apiRequest('/health');
    apiAvailable = true;
    return true;
  } catch {
    apiAvailable = false;
    return false;
  }
}

function isApiAvailable() {
  return apiAvailable;
}

async function fetchAllTrips() {
  const data = await apiRequest('/trips');
  return data.trips || [];
}

async function fetchTrip(tripNumber) {
  const data = await apiRequest(`/trips/${encodeURIComponent(tripNumber)}`);
  return data.trip;
}

async function uploadNbTrip(payload) {
  const form = new FormData();
  Object.entries(payload).forEach(([k, v]) => { if (v != null) form.append(k, v); });
  const res = await fetch(`${API_BASE}/trips/upload-nb`, { method: 'POST', headers: { 'X-User-Id': apiHeaders()['X-User-Id'], 'X-Username': apiHeaders()['X-Username'] }, body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data;
}

async function advanceWorkflowStep(tripNumber, stepKey) {
  const backendKey = stepKey === 'loadingProcess' || stepKey === 'loadingPlan' ? 'loading'
    : stepKey === 'kanyaka' ? 'kanyaka_sb' : stepKey;
  const data = await apiRequest(`/trips/${encodeURIComponent(tripNumber)}/advance-step`, {
    method: 'POST',
    body: JSON.stringify({ stepKey: backendKey })
  });
  return data.trip;
}

async function completeBorderStep(tripNumber, stepOrder) {
  const data = await apiRequest(`/trips/${encodeURIComponent(tripNumber)}/border-step/${stepOrder}/complete`, { method: 'POST' });
  return data.trip;
}

async function createSbFromNb(nbTripNumber, payload = {}) {
  const data = await apiRequest(`/turnarounds/from-nb/${encodeURIComponent(nbTripNumber)}/create-sb`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return data.trip;
}

async function uploadGovList(tripNumber, file) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE}/kanyaka/${encodeURIComponent(tripNumber)}/gov-list`, {
    method: 'POST',
    headers: { 'X-User-Id': apiHeaders()['X-User-Id'], 'X-Username': apiHeaders()['X-Username'] },
    body: form
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Gov list upload failed');
  return data.trip;
}

async function approveKanyakaException(tripNumber, reason) {
  const data = await apiRequest(`/kanyaka/${encodeURIComponent(tripNumber)}/exception`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  });
  return data.trip;
}

async function advancePodStage(tripNumber, stage) {
  const data = await apiRequest(`/pod/${encodeURIComponent(tripNumber)}/${stage}`, { method: 'POST' });
  return data.trip;
}

async function fetchTurnarounds() {
  const data = await apiRequest('/turnarounds');
  return data.turnarounds || [];
}

async function fetchFleet() {
  const data = await apiRequest('/fleet');
  return data.fleet || [];
}

async function updateFleetSetting(ownerId, settings) {
  const data = await apiRequest(`/fleet/${ownerId}`, { method: 'PATCH', body: JSON.stringify(settings) });
  return data.owner;
}

function mergeTripIntoLocalDb(trip) {
  if (!trip || !trip.tripNumber) return;
  tripsDB[trip.tripNumber] = {
    tripNumber: trip.tripNumber,
    truck: trip.truck,
    driver: trip.driver,
    direction: trip.direction,
    area: trip.area,
    owner: trip.owner,
    entryBorder: trip.entryBorder,
    exitBorder: trip.exitBorder,
    offloadingPoint: trip.offloadingPoint,
    loadingPoint: trip.loadingPoint,
    borderProcess: trip.borderProcess,
    status: trip.status,
    daysInDRC: trip.daysInDRC || 0,
    kpi: trip.kpi || 'green',
    workflow: trip.workflow || {},
    workflowDates: trip.workflowDates || {},
    turnaroundId: trip.turnaroundId,
    truckId: trip.truckId,
    currentStepKey: trip.currentStepKey,
    borderSteps: trip.borderSteps,
    kanyaka: trip.kanyaka,
    pod: trip.pod,
    sameTruckEnforced: trip.sameTruckEnforced
  };
}

async function syncTripsFromApi() {
  if (!apiAvailable) return false;
  try {
    const trips = await fetchAllTrips();
    trips.forEach(mergeTripIntoLocalDb);
    return true;
  } catch (e) {
    console.warn('Failed to sync trips from API:', e.message);
    return false;
  }
}
