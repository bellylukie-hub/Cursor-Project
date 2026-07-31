/**
 * TruckControl API client — production auth + workflow engine.
 */
const API_BASE = (typeof window !== 'undefined' && window.TRUCKCONTROL_API)
  ? window.TRUCKCONTROL_API
  : (typeof location !== 'undefined' && (location.port === '3001' || location.pathname === '/'))
    ? '/api'
    : 'http://localhost:3001/api';

const AUTH_TOKEN_KEY = 'truckcontrol_auth_token';
const AUTH_USER_KEY = 'truckcontrol_auth_user';

let apiAvailable = false;
let authRequired = false;
let authToken = null;
let authUser = null;

function loadStoredAuth() {
  try {
    authToken = sessionStorage.getItem(AUTH_TOKEN_KEY);
    const raw = sessionStorage.getItem(AUTH_USER_KEY);
    authUser = raw ? JSON.parse(raw) : null;
  } catch {
    authToken = null;
    authUser = null;
  }
}

function saveAuth(token, user) {
  authToken = token;
  authUser = user;
  sessionStorage.setItem(AUTH_TOKEN_KEY, token);
  sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

function clearAuth() {
  authToken = null;
  authUser = null;
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_USER_KEY);
}

function getAuthToken() { return authToken; }
function getAuthUser() { return authUser; }
function isAuthRequired() { return authRequired; }

function apiHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
    return headers;
  }
  const userId = typeof CURRENT_SESSION_USER_ID !== 'undefined' ? CURRENT_SESSION_USER_ID : 'ADM-001';
  const user = typeof getCurrentAdminUser === 'function' ? getCurrentAdminUser() : null;
  headers['X-User-Id'] = userId;
  headers['X-Username'] = user?.username || 'super_admin';
  return headers;
}

function authOnlyHeaders() {
  const h = {};
  if (authToken) h.Authorization = `Bearer ${authToken}`;
  else {
    h['X-User-Id'] = typeof CURRENT_SESSION_USER_ID !== 'undefined' ? CURRENT_SESSION_USER_ID : 'ADM-001';
    h['X-Username'] = (typeof getCurrentAdminUser === 'function' && getCurrentAdminUser()?.username) || 'super_admin';
  }
  return h;
}

async function apiRequest(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...apiHeaders(), ...(options.headers || {}) }
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && authRequired) {
    clearAuth();
    if (typeof showLoginScreen === 'function') showLoginScreen('Session expired. Please sign in again.');
    throw new Error(data.error || 'Session expired');
  }
  if (!res.ok) throw new Error(data.error || `API error ${res.status}`);
  return data;
}

async function checkApiHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    const data = await res.json();
    authRequired = !!data.requireAuth;
    apiAvailable = true;
    return true;
  } catch {
    apiAvailable = false;
    return false;
  }
}

async function loginApi(username, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  saveAuth(data.token, data.user);
  apiAvailable = true;
  authRequired = true;
  return data;
}

async function fetchCurrentUser() {
  if (!authToken) return null;
  try {
    const data = await apiRequest('/auth/me');
    authUser = data.user;
    sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(authUser));
    return authUser;
  } catch {
    return null;
  }
}

function logoutApi() {
  clearAuth();
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
  const res = await fetch(`${API_BASE}/trips/upload-nb`, { method: 'POST', headers: authOnlyHeaders(), body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data;
}

async function uploadSbTrip(payload) {
  const form = new FormData();
  Object.entries(payload).forEach(([k, v]) => { if (v != null) form.append(k, v); });
  const res = await fetch(`${API_BASE}/trips/upload-sb`, { method: 'POST', headers: authOnlyHeaders(), body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data;
}

async function postLiveUploadRecord(payload) {
  return apiRequest('/live-uploads', { method: 'POST', body: JSON.stringify(payload) });
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
    headers: authOnlyHeaders(),
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

async function postTripAreaStatus(tripNumber, area, status, notes) {
  return apiRequest(`/trips/${encodeURIComponent(tripNumber)}/area-status`, {
    method: 'POST',
    body: JSON.stringify({ area, status, notes: notes || '' })
  });
}

async function syncTripsFromApi(authoritative) {
  if (!apiAvailable) return false;
  try {
    const trips = await fetchAllTrips();
    if (authoritative) {
      Object.keys(tripsDB).forEach(k => {
        if (!trips.find(t => t.tripNumber === k)) delete tripsDB[k];
      });
    }
    trips.forEach(mergeTripIntoLocalDb);
    return true;
  } catch (e) {
    console.warn('Failed to sync trips from API:', e.message);
    return false;
  }
}

async function fetchDriverContacts(params = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== '' && v !== 'all'))
  ).toString();
  const data = await apiRequest(`/driver-contacts${qs ? `?${qs}` : ''}`);
  return data.contacts || [];
}

async function fetchDriverContactByTrip(tripNumber) {
  try {
    const data = await apiRequest(`/driver-contacts/by-trip/${encodeURIComponent(tripNumber)}`);
    return data.contact;
  } catch (e) {
    if (String(e.message).includes('404') || String(e.message).includes('No driver contact')) return null;
    throw e;
  }
}

async function saveDriverContact(payload) {
  const data = await apiRequest('/driver-contacts', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return data.contact;
}

function mergeDriverContactIntoLocalDb(contact) {
  if (!contact || typeof driverContactsDB === 'undefined') return;
  const tripKey = contact.tripNumber || '';
  let idx = contact.id ? driverContactsDB.findIndex(c => c.id === contact.id) : -1;
  if (idx < 0 && tripKey) idx = driverContactsDB.findIndex(c => c.tripNumber === tripKey);
  if (idx >= 0) driverContactsDB[idx] = { ...driverContactsDB[idx], ...contact };
  else if (contact.id) driverContactsDB.unshift(contact);
}

async function syncDriverContactsFromApi() {
  if (!apiAvailable || typeof driverContactsDB === 'undefined') return false;
  try {
    const contacts = await fetchDriverContacts();
    if (!contacts.length) return true;
    contacts.forEach(c => mergeDriverContactIntoLocalDb(c));
    return true;
  } catch (e) {
    console.warn('Failed to sync driver contacts from API:', e.message);
    return false;
  }
}

loadStoredAuth();
