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
  createSbTripFromTurnaround,
  getTurnaroundFull,
  listTurnarounds,
  updateFleetSettings,
  listFleetOwners
} = require('../services/turnaroundService');

const router = express.Router();

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

function getUser(req) {
  return {
    id: req.headers['x-user-id'] || 'ADM-001',
    username: req.headers['x-username'] || 'super_admin'
  };
}

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'truckcontrol-api', version: '1.0.0' });
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
    const trip = createNbTrip({
      tripNumber: body.tripNumber,
      truck: body.truck,
      driver: body.driver,
      owner: body.owner,
      area: body.area || 'Kasumbalesa',
      entryBorder: body.entryBorder || 'Kasumbalesa',
      offloadingPoint: body.offloadingPoint,
      borderProcess: body.borderProcess || 'KBP',
      trailerPlate: body.trailerPlate
    }, getUser(req));
    res.status(201).json({ trip, message: 'NB trip created. Truck must complete full border clearance before Kanyaka.' });
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

module.exports = router;
