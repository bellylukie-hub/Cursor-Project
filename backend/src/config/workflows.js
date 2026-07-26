/**
 * Operational workflow definitions.
 * NB: clearance must complete fully before Kanyaka → Offload → POD.
 * SB: load → documents → seal → escort → dispatch → Kanyaka (gov list) → border exit.
 */

const NB_BORDER_KBP = [
  'Truck Arrival & Entry',
  'Document Submission to Brigade Officer',
  'Truck Scanning',
  'Green Stamping',
  'Red Stamping',
  'Cross-Checking',
  'Driver Contact Details'
];

const NB_BORDER_WHISKY = [
  'Entry Card',
  'Scanning',
  'TR8 / T1 / IM4',
  'Duty Payment',
  'BAE',
  'SEGUCE',
  'Bon de Sortie',
  'Brigade Stamp',
  'Full Documents',
  'Seal Collected',
  'Hand to Driver'
];

const SB_BORDER_EXIT = [
  'Arrived at Exit Border',
  'Gov List Uploaded',
  'Customs Declaration Submitted',
  'Duty / SEGUCE Payment',
  'Brigade Stamp Applied',
  'Seal Verification',
  'Documents Handed to Driver',
  'Exit to Zambia — Complete'
];

const NB_WORKFLOW = [
  { key: 'border', label: 'Border Clearance', order: 1, requiresSubSteps: true },
  { key: 'kanyaka', label: 'Kanyaka Transit', order: 2 },
  { key: 'offloading', label: 'Offloading', order: 3 },
  { key: 'pod', label: 'POD Collection', order: 4 }
];

const SB_WORKFLOW = [
  { key: 'loading', label: 'Loading', order: 1 },
  { key: 'documents', label: 'Document Collection', order: 2 },
  { key: 'seal', label: 'Seal Collection', order: 3 },
  { key: 'escort', label: 'Escort Arrangement', order: 4 },
  { key: 'dispatch', label: 'Dispatch', order: 5 },
  { key: 'kanyaka_sb', label: 'Kanyaka (Gov List & Transit)', order: 6, requiresGovList: true },
  { key: 'border', label: 'Border Exit Clearance', order: 7, requiresSubSteps: true }
];

/** Map legacy frontend SB keys to backend keys */
const LEGACY_SB_KEY_MAP = {
  loadingPlan: 'loading',
  loadingProcess: 'loading',
  kanyaka: 'kanyaka_sb'
};

/** Map backend keys to legacy frontend display keys */
const FRONTEND_SB_KEY_MAP = {
  loading: 'loadingProcess',
  documents: 'documents',
  seal: 'seal',
  escort: 'escort',
  dispatch: 'dispatch',
  kanyaka_sb: 'kanyaka',
  border: 'border'
};

function getBorderSteps(processType) {
  if (processType === 'Whisky') return NB_BORDER_WHISKY;
  if (processType === 'KBP' || processType === 'BN') return NB_BORDER_KBP;
  return SB_BORDER_EXIT;
}

function getWorkflowSteps(direction) {
  return direction === 'NB' ? NB_WORKFLOW : SB_WORKFLOW;
}

function getNextStepKey(direction, currentKey) {
  const steps = getWorkflowSteps(direction);
  const idx = steps.findIndex(s => s.key === currentKey);
  return idx >= 0 && idx < steps.length - 1 ? steps[idx + 1].key : null;
}

module.exports = {
  NB_BORDER_KBP,
  NB_BORDER_WHISKY,
  SB_BORDER_EXIT,
  NB_WORKFLOW,
  SB_WORKFLOW,
  LEGACY_SB_KEY_MAP,
  FRONTEND_SB_KEY_MAP,
  getBorderSteps,
  getWorkflowSteps,
  getNextStepKey
};
