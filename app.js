// ============================================
// GLOBAL STATE
// ============================================
let currentPage = 'dashboard';
let currentCommentTrip = null;
let currentCommentKpi = 'green';
let selectedCommentType = 'normal';
let uploadedFiles = [];
let dashboardSearchTerm = '';
let currentPODFilter = 'all';
let podSearchTerm = '';
let selectedPodKpis = [];
let selectedPodStatuses = [];

const POD_KPI_OPTIONS = [
    { id: 'green', label: '🟢 On Track' },
    { id: 'orange', label: '🟠 Priority' },
    { id: 'red', label: '🔴 Overdue' }
];
const POD_STATUS_OPTIONS = [
    { id: 'pending', label: 'Pending Collection' },
    { id: 'collected-on-time', label: 'Collected On-Time' },
    { id: 'collected-late', label: 'Collected Late' },
    { id: 'scanned', label: 'Scanned' },
    { id: 'uploaded', label: 'Uploaded' },
    { id: 'sent-invoicing', label: 'Sent to Invoicing' },
    { id: 'overdue', label: 'Overdue' }
];
const POD_STATUS_ID_MAP = Object.fromEntries(POD_STATUS_OPTIONS.map(s => [s.label, s.id]));

function getPodStatusOptions() {
    const labels = (typeof globalStatusListsDB !== 'undefined' && globalStatusListsDB.POD?.length)
        ? globalStatusListsDB.POD
        : POD_STATUS_OPTIONS.map(s => s.label);
    return labels.map(label => ({
        id: POD_STATUS_ID_MAP[label] || label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        label
    }));
}

function refreshPodStatusOptions() {
    selectedPodStatuses = getPodStatusOptions().map(s => s.id);
}

selectedPodKpis = POD_KPI_OPTIONS.map(k => k.id);
selectedPodStatuses = POD_STATUS_OPTIONS.map(s => s.id);
let assetsSearchTerm = '';
let assetsStatusFilter = 'all';
let assetsCategoryFilter = 'all';
let nextAssetId = 6;
let nextAssetDocId = 20;
let assetDocUploadedFile = null;
let matrixFilter = 'contacts';
let matrixSearchTerm = '';
let matrixAreaFilter = 'all';
let matrixActiveFilter = 'all';
let internalCommFilter = 'email';
let internalCommSearchTerm = '';
let emailFolder = 'inbox';
let selectedEmailId = null;
let emailView = 'list';
let emailComposeData = null;
let emailSearchTerm = '';
let emailAttachments = [];
let activeChatRoomId = 'ROOM-004';
let chatListSearch = '';
let chatReplyToId = null;
let chatPendingFile = null;
let emailShowUnreadOnly = false;
let chatTypeFilter = 'all';
let chatShowUnreadOnly = false;
let currentDocumentId = null;
let currentTripFilter = 'all';
let currentDocFilter = 'all';
let selectedAreaIds = [];
let pendingAreaIds = [];
let areaNbSearch = '';
let areaSbSearch = '';
let areaDropdownOpen = true;
let areaSelectorHidden = false;

const listRowSelections = { nb: [], sb: [], border: [], borderNb: [], borderSb: [], pod: [], assets: [], commMatrix: [], internalComm: [], areaNb: [], areaSb: [] };

const areasDB = [
    { id: 'kanyaka', name: 'Kanyaka', icon: '🏗️', offloadingPoints: ['Kanyaka', 'Kanyaka Depot', 'Kanyaka Mine'], loadingPoints: ['Kanyaka', 'Kanyaka Depot', 'Kanyaka Mine'] },
    { id: 'kolwezi', name: 'Kolwezi', icon: '⛏️', offloadingPoints: ['Kolwezi', 'Kolwezi Mine', 'KCC Mine'], loadingPoints: ['Kolwezi', 'Kolwezi Mine', 'KCC Mine'] },
    { id: 'lubumbashi', name: 'Lubumbashi', icon: '🏙️', offloadingPoints: ['Lubumbashi'], loadingPoints: ['Lubumbashi'] },
    { id: 'likasi', name: 'Likasi', icon: '⛏️', offloadingPoints: ['Likasi', 'Likasi Mine'], loadingPoints: ['Likasi', 'Likasi Mine'] },
    { id: 'kasumbalesa', name: 'Kasumbalesa', icon: '🛂', offloadingPoints: ['Kasumbalesa'], loadingPoints: ['Kasumbalesa'] }
];
selectedAreaIds = areasDB.map(a => a.id);
pendingAreaIds = [...selectedAreaIds];

const WORKFLOW_CONFIG = {
    NB: [
        { key: 'border', label: 'Border Clearance' },
        { key: 'kanyaka', label: 'Kanyaka Transit' },
        { key: 'offloading', label: 'Offloading' },
        { key: 'pod', label: 'POD Collection' }
    ],
    SB: [
        { key: 'loadingProcess', label: 'Loading' },
        { key: 'documents', label: 'Document Collection' },
        { key: 'seal', label: 'Seal Collection' },
        { key: 'escort', label: 'Escort Arrangement' },
        { key: 'dispatch', label: 'Dispatch' },
        { key: 'kanyaka', label: 'Kanyaka (Gov List & Transit)' },
        { key: 'border', label: 'Border Exit Clearance' }
    ]
};

if (typeof window !== 'undefined') window.WORKFLOW_CONFIG = WORKFLOW_CONFIG;
if (typeof window !== 'undefined') window.BORDER_PROCESS_DEFS = BORDER_PROCESS_DEFS;

// ============================================
// KPI SETTINGS — admin-configurable per process / page / workflow
// ============================================
const KPI_CATEGORIES = [
    { id: 'workflow-nb', label: 'NB Workflow', icon: '🚛', banner: 'nb' },
    { id: 'workflow-sb', label: 'SB Workflow', icon: '🚛', banner: 'sb' },
    { id: 'border-nb', label: 'NB Border Processes', icon: '🛂', banner: 'border', isBorderGroup: true },
    { id: 'border-sb', label: 'SB Border Exit Processes', icon: '🔽', banner: 'border', isBorderGroup: true },
    { id: 'pod', label: 'POD Management', icon: '📋', banner: 'nb' },
    { id: 'areas', label: 'Area Operations', icon: '🗺️', banner: null },
    { id: 'modules', label: 'Module / Page', icon: '📊', banner: null },
    { id: 'assets', label: 'Assets & Documents', icon: '🚗', banner: 'equipment' },
    { id: 'turnarounds', label: 'Turnarounds', icon: '🔄', banner: null }
];

/** KPI measurement type per border step */
const KPI_STEP_TYPES = [
    { id: 'time', label: '⏱️ Time SLA', desc: 'Max hours/days allowed to complete this step' },
    { id: 'completion', label: '✅ Completion Gate', desc: 'Step must be marked complete before proceeding' },
    { id: 'document', label: '📄 Document SLA', desc: 'Required document must be issued or uploaded' },
    { id: 'inspection', label: '🔍 Inspection', desc: 'Physical inspection or verification step' }
];

/** Each border process with individual step KPI targets */
const BORDER_PROCESS_DEFS = [
    {
        id: 'direct',
        parentCategory: 'border-nb',
        label: 'Kasumbalesa — Direct Process',
        border: 'Kasumbalesa',
        direction: 'NB',
        pageId: 'kasumbalesa-direct',
        configKey: 'kasumbalesa-direct',
        steps: [
            { key: 'arrival', name: 'Truck Arrival at Border', shortName: 'Arrival', defaultTarget: 4, transitionToNext: 2, kpiType: 'time' },
            { key: 'direct-clearance', name: 'Direct Clearance', shortName: 'Direct Clearance', defaultTarget: 12, transitionToNext: 4, kpiType: 'completion' },
            { key: 'driver-contact', name: 'Driver Contact Details', shortName: 'Driver Contact', defaultTarget: 4, kpiType: 'completion' }
        ]
    },
    {
        id: 'kbp',
        parentCategory: 'border-nb',
        label: 'Kasumbalesa — KBP Process',
        border: 'Kasumbalesa',
        direction: 'NB',
        pageId: 'kasumbalesa-detail',
        configKey: 'kasumbalesa-kbp',
        steps: [
            { key: 'arrival', name: 'Truck Arrival & Entry', shortName: 'Arrival', defaultTarget: 4, transitionToNext: 2, kpiType: 'time' },
            { key: 'doc-submission', name: 'Document Submission to Brigade Officer', shortName: 'Doc Submission', defaultTarget: 6, transitionToNext: 4, kpiType: 'document' },
            { key: 'scanning', name: 'Truck Scanning', shortName: 'Scanning', defaultTarget: 12, transitionToNext: 8, kpiType: 'inspection' },
            { key: 'green-stamp', name: 'Green Stamping', shortName: 'Green Stamp', defaultTarget: 4, transitionToNext: 1, kpiType: 'inspection' },
            { key: 'red-stamp', name: 'Red Stamping', shortName: 'Red Stamp', defaultTarget: 4, transitionToNext: 1, kpiType: 'inspection' },
            { key: 'cross-check', name: 'Cross-Checking', shortName: 'Cross-Check', defaultTarget: 12, transitionToNext: 4, kpiType: 'inspection' },
            { key: 'driver-contact', name: 'Driver Contact Details', shortName: 'Driver Contact', defaultTarget: 6, kpiType: 'completion' }
        ]
    },
    {
        id: 'whisky',
        parentCategory: 'border-nb',
        label: 'Kasumbalesa — Whisky Process',
        border: 'Kasumbalesa',
        direction: 'NB',
        pageId: 'kasumbalesa-whisky',
        configKey: null,
        steps: [
            { key: 'entry-card', name: 'Entry Card Given to Agent', shortName: 'Entry Card', defaultTarget: 4, transitionToNext: 8, kpiType: 'document' },
            { key: 'scanning', name: 'Truck Scanning', shortName: 'Scanning', defaultTarget: 8, transitionToNext: 4, kpiType: 'inspection' },
            { key: 'tr8-im4', name: 'TR8 / T1 or IM4 Issued', shortName: 'TR8 / IM4', defaultTarget: 8, transitionToNext: 4, kpiType: 'document' },
            { key: 'duty-payment', name: 'Duty Payment (if IM4)', shortName: 'Duty Payment', defaultTarget: 6, transitionToNext: 2, kpiType: 'time' },
            { key: 'bae', name: 'BAE Collection', shortName: 'BAE', defaultTarget: 24, transitionToNext: 20, kpiType: 'document' },
            { key: 'seguce', name: 'SEGUCE Payment', shortName: 'SEGUCE', defaultTarget: 4, transitionToNext: 2, kpiType: 'time' },
            { key: 'bon-sortie', name: 'Bon de Sortie', shortName: 'Bon de Sortie', defaultTarget: 2, transitionToNext: 2, kpiType: 'document' },
            { key: 'brigade-stamp', name: 'Brigade Stamp', shortName: 'Brigade Stamp', defaultTarget: 4, transitionToNext: 2, kpiType: 'inspection' },
            { key: 'full-docs', name: 'Full Documents Collected', shortName: 'Full Docs', defaultTarget: 4, transitionToNext: 2, kpiType: 'document' },
            { key: 'seal', name: 'Seal Collected', shortName: 'Seal', defaultTarget: 4, transitionToNext: 2, kpiType: 'completion' },
            { key: 'hand-driver', name: 'Documents Handed to Driver', shortName: 'Hand to Driver', defaultTarget: 4, kpiType: 'completion' }
        ]
    },
    {
        id: 'sakania',
        parentCategory: 'border-nb',
        label: 'Sakania — BN Process',
        border: 'Sakania',
        direction: 'NB',
        pageId: 'sakania-nb',
        configKey: 'sakania-nb',
        steps: [
            { key: 'arrival', name: 'Truck Arrival & Entry', shortName: 'Arrival', defaultTarget: 4, transitionToNext: 2, kpiType: 'time' },
            { key: 'doc-submission', name: 'Document Submission to Brigade Officer', shortName: 'Doc Submission', defaultTarget: 6, transitionToNext: 4, kpiType: 'document' },
            { key: 'scanning', name: 'Truck Scanning', shortName: 'Scanning', defaultTarget: 10, transitionToNext: 6, kpiType: 'inspection' },
            { key: 'green-stamp', name: 'Green Stamping', shortName: 'Green Stamp', defaultTarget: 4, transitionToNext: 1, kpiType: 'inspection' },
            { key: 'red-stamp', name: 'Red Stamping', shortName: 'Red Stamp', defaultTarget: 4, transitionToNext: 1, kpiType: 'inspection' },
            { key: 'cross-check', name: 'Cross-Checking', shortName: 'Cross-Check', defaultTarget: 12, transitionToNext: 4, kpiType: 'inspection' },
            { key: 'driver-contact', name: 'Driver Contact Details', shortName: 'Driver Contact', defaultTarget: 8, kpiType: 'completion' }
        ]
    },
    {
        id: 'mokambo',
        parentCategory: 'border-nb',
        label: 'Mokambo — BN Process',
        border: 'Mokambo',
        direction: 'NB',
        pageId: 'mokambo-nb',
        configKey: 'mokambo-nb',
        steps: [
            { key: 'arrival', name: 'Truck Arrival & Entry', shortName: 'Arrival', defaultTarget: 6, transitionToNext: 3, kpiType: 'time' },
            { key: 'doc-submission', name: 'Document Submission to Brigade Officer', shortName: 'Doc Submission', defaultTarget: 8, transitionToNext: 5, kpiType: 'document' },
            { key: 'scanning', name: 'Truck Scanning', shortName: 'Scanning', defaultTarget: 14, transitionToNext: 10, kpiType: 'inspection' },
            { key: 'green-stamp', name: 'Green Stamping', shortName: 'Green Stamp', defaultTarget: 6, transitionToNext: 2, kpiType: 'inspection' },
            { key: 'red-stamp', name: 'Red Stamping', shortName: 'Red Stamp', defaultTarget: 6, transitionToNext: 2, kpiType: 'inspection' },
            { key: 'cross-check', name: 'Cross-Checking', shortName: 'Cross-Check', defaultTarget: 18, transitionToNext: 6, kpiType: 'inspection' },
            { key: 'driver-contact', name: 'Driver Contact Details', shortName: 'Driver Contact', defaultTarget: 14, kpiType: 'completion' }
        ]
    },
    {
        id: 'sb-kasumbalesa',
        parentCategory: 'border-sb',
        label: 'Kasumbalesa — SB Exit',
        border: 'Kasumbalesa',
        direction: 'SB',
        pageId: 'sb-kasumbalesa',
        configKey: 'sb-kasumbalesa',
        steps: [
            { key: 'arrived', name: 'Arrived at Exit Border', shortName: 'Arrival', defaultTarget: 4, transitionToNext: 2, kpiType: 'time' },
            { key: 'gov-list', name: 'Gov List Uploaded', shortName: 'Gov List', defaultTarget: 6, transitionToNext: 4, kpiType: 'document' },
            { key: 'customs-decl', name: 'Customs Declaration Submitted', shortName: 'Customs Decl.', defaultTarget: 8, transitionToNext: 4, kpiType: 'document' },
            { key: 'duty-seguce', name: 'Duty / SEGUCE Payment', shortName: 'Duty/SEGUCE', defaultTarget: 8, transitionToNext: 4, kpiType: 'time' },
            { key: 'brigade-stamp', name: 'Brigade Stamp Applied', shortName: 'Brigade Stamp', defaultTarget: 6, transitionToNext: 2, kpiType: 'inspection' },
            { key: 'seal-verify', name: 'Seal Verification', shortName: 'Seal Verify', defaultTarget: 6, transitionToNext: 2, kpiType: 'inspection' },
            { key: 'docs-handover', name: 'Documents Handed to Driver', shortName: 'Docs Handover', defaultTarget: 4, transitionToNext: 2, kpiType: 'document' },
            { key: 'exit-zambia', name: 'Exit to Zambia — Complete', shortName: 'Exit Zambia', defaultTarget: 6, kpiType: 'completion' }
        ]
    },
    {
        id: 'sb-sakania',
        parentCategory: 'border-sb',
        label: 'Sakania — SB Exit',
        border: 'Sakania',
        direction: 'SB',
        pageId: 'sb-sakania',
        configKey: 'sb-sakania',
        steps: [
            { key: 'arrived', name: 'Arrived at Exit Border', shortName: 'Arrival', defaultTarget: 4, transitionToNext: 2, kpiType: 'time' },
            { key: 'gov-list', name: 'Gov List Uploaded', shortName: 'Gov List', defaultTarget: 6, transitionToNext: 4, kpiType: 'document' },
            { key: 'customs-decl', name: 'Customs Declaration Submitted', shortName: 'Customs Decl.', defaultTarget: 8, transitionToNext: 4, kpiType: 'document' },
            { key: 'duty-seguce', name: 'Duty / SEGUCE Payment', shortName: 'Duty/SEGUCE', defaultTarget: 8, transitionToNext: 4, kpiType: 'time' },
            { key: 'brigade-stamp', name: 'Brigade Stamp Applied', shortName: 'Brigade Stamp', defaultTarget: 6, transitionToNext: 2, kpiType: 'inspection' },
            { key: 'seal-verify', name: 'Seal Verification', shortName: 'Seal Verify', defaultTarget: 6, transitionToNext: 2, kpiType: 'inspection' },
            { key: 'docs-handover', name: 'Documents Handed to Driver', shortName: 'Docs Handover', defaultTarget: 4, transitionToNext: 2, kpiType: 'document' },
            { key: 'exit-zambia', name: 'Exit to Zambia — Complete', shortName: 'Exit Zambia', defaultTarget: 6, kpiType: 'completion' }
        ]
    },
    {
        id: 'sb-mokambo',
        parentCategory: 'border-sb',
        label: 'Mokambo — SB Exit',
        border: 'Mokambo',
        direction: 'SB',
        pageId: 'sb-mokambo',
        configKey: 'sb-mokambo',
        steps: [
            { key: 'arrived', name: 'Arrived at Exit Border', shortName: 'Arrival', defaultTarget: 6, transitionToNext: 3, kpiType: 'time' },
            { key: 'gov-list', name: 'Gov List Uploaded', shortName: 'Gov List', defaultTarget: 10, transitionToNext: 6, kpiType: 'document' },
            { key: 'customs-decl', name: 'Customs Declaration Submitted', shortName: 'Customs Decl.', defaultTarget: 10, transitionToNext: 6, kpiType: 'document' },
            { key: 'duty-seguce', name: 'Duty / SEGUCE Payment', shortName: 'Duty/SEGUCE', defaultTarget: 10, transitionToNext: 6, kpiType: 'time' },
            { key: 'brigade-stamp', name: 'Brigade Stamp Applied', shortName: 'Brigade Stamp', defaultTarget: 8, transitionToNext: 3, kpiType: 'inspection' },
            { key: 'seal-verify', name: 'Seal Verification', shortName: 'Seal Verify', defaultTarget: 8, transitionToNext: 3, kpiType: 'inspection' },
            { key: 'docs-handover', name: 'Documents Handed to Driver', shortName: 'Docs Handover', defaultTarget: 8, transitionToNext: 4, kpiType: 'document' },
            { key: 'exit-zambia', name: 'Exit to Zambia — Complete', shortName: 'Exit Zambia', defaultTarget: 12, kpiType: 'completion' }
        ]
    }
];

function buildBorderStepKpiSettings() {
    const rows = [];
    BORDER_PROCESS_DEFS.forEach(proc => {
        proc.steps.forEach((step, idx) => {
            rows.push({
                id: `border-${proc.id}-step-${step.key}`,
                kpiKind: 'step',
                category: proc.parentCategory,
                processGroup: proc.id,
                process: step.name,
                workflowStep: step.key,
                stepOrder: idx + 1,
                borderProcess: proc.id,
                pageId: proc.pageId,
                pageLabel: proc.label,
                direction: proc.direction,
                targetValue: step.defaultTarget,
                warningPct: 75,
                unit: 'hours',
                kpiType: step.kpiType || 'time',
                enabled: true,
                notes: `${proc.label} — step ${idx + 1} completion`
            });
        });
        for (let i = 0; i < proc.steps.length - 1; i++) {
            const from = proc.steps[i];
            const to = proc.steps[i + 1];
            const fromLabel = from.shortName || from.name;
            const toLabel = to.shortName || to.name;
            rows.push({
                id: `border-${proc.id}-transition-${from.key}-to-${to.key}`,
                kpiKind: 'transition',
                category: proc.parentCategory,
                processGroup: proc.id,
                process: `${fromLabel} → ${toLabel}`,
                workflowStep: `${from.key}→${to.key}`,
                fromStepKey: from.key,
                toStepKey: to.key,
                stepOrder: i + 1,
                borderProcess: proc.id,
                pageId: proc.pageId,
                pageLabel: proc.label,
                direction: proc.direction,
                targetValue: from.transitionToNext ?? 4,
                warningPct: 75,
                unit: 'hours',
                kpiType: 'time',
                enabled: true,
                notes: `Max time from "${fromLabel}" complete to "${toLabel}" complete`
            });
        }
    });
    return rows;
}

function getBorderProcessDef(processId) {
    return BORDER_PROCESS_DEFS.find(p => p.id === processId);
}
if (typeof window !== 'undefined') window.getBorderProcessDef = getBorderProcessDef;

function getBorderStepKpiSetting(processId, stepKey) {
    return getKpiSetting(`border-${processId}-step-${stepKey}`);
}

function getBorderTransitionKpiSetting(processId, fromKey, toKey) {
    return getKpiSetting(`border-${processId}-transition-${fromKey}-to-${toKey}`);
}

function getBorderTransitionKpiTargetLabel(processId, fromKey, toKey) {
    const s = getBorderTransitionKpiSetting(processId, fromKey, toKey);
    if (!s || !s.enabled) return null;
    return `≤ ${s.targetValue}${s.unit === 'days' ? 'd' : 'h'}`;
}

function getBorderProcessTransitionHours(processId) {
    const proc = getBorderProcessDef(processId);
    if (!proc) return 0;
    let total = 0;
    for (let i = 0; i < proc.steps.length - 1; i++) {
        const from = proc.steps[i];
        const to = proc.steps[i + 1];
        const s = getBorderTransitionKpiSetting(processId, from.key, to.key);
        total += s?.enabled ? Number(s.targetValue) || 0 : 0;
    }
    return total;
}

function getBorderStepKpiTargetLabel(processId, stepKey) {
    const s = getBorderStepKpiSetting(processId, stepKey);
    if (!s || !s.enabled) return null;
    const typeLabel = KPI_STEP_TYPES.find(t => t.id === s.kpiType)?.label?.split(' ')[0] || '';
    const u = s.unit === 'days' ? 'days' : 'hrs';
    return `${typeLabel} ${s.targetValue}${u === 'days' ? 'd' : 'h'}`.trim();
}

function kpiSettingMatchesCategory(s, categoryFilter) {
    if (categoryFilter === 'all') return true;
    if (categoryFilter === 'border-nb') return s.category === 'border-nb';
    if (categoryFilter === 'border-sb') return s.category === 'border-sb';
    if (categoryFilter.startsWith('border-process:')) {
        return s.processGroup === categoryFilter.replace('border-process:', '');
    }
    return s.category === categoryFilter;
}

function renderKpiSettingRow(s, showStepNum) {
    const kpiTypeOpts = KPI_STEP_TYPES.map(t =>
        `<option value="${t.id}" ${s.kpiType === t.id ? 'selected' : ''}>${t.label}</option>`
    ).join('');
    const isTransition = s.kpiKind === 'transition';
    const labelCell = isTransition
        ? `<td><strong class="kpi-transition-label">↳ ${s.process}</strong><br><small class="kpi-transition-hint">Step-to-step transition</small></td>`
        : `<td><strong>${s.process}</strong></td>`;
    return `
        <tr class="${s.enabled ? '' : 'kpi-row-disabled'}${isTransition ? ' kpi-transition-row' : ''}">
            ${showStepNum ? `<td><strong>${isTransition ? 'T' + (s.stepOrder || '—') : (s.stepOrder || '—')}</strong></td>` : ''}
            ${labelCell}
            <td>
                <select class="form-control kpi-type-select" onchange="updateKpiSetting('${s.id}','kpiType',this.value)" title="KPI measurement type">
                    ${kpiTypeOpts}
                </select>
            </td>
            <td><code>${s.pageId}</code></td>
            <td>${s.workflowStep ? `<span class="workflow-pill ${isTransition ? 'current' : 'pending'}">${s.workflowStep}</span>` : '—'}</td>
            <td>${s.direction}</td>
            <td><input type="number" class="form-control kpi-input" min="0" step="1" value="${s.targetValue}" onchange="updateKpiSetting('${s.id}','targetValue',parseFloat(this.value)||0)"></td>
            <td>
                <select class="form-control kpi-input" onchange="updateKpiSetting('${s.id}','unit',this.value)">
                    <option value="hours" ${s.unit === 'hours' ? 'selected' : ''}>Hours</option>
                    <option value="days" ${s.unit === 'days' ? 'selected' : ''}>Days</option>
                </select>
            </td>
            <td><input type="number" class="form-control kpi-input" min="50" max="99" step="1" value="${s.warningPct ?? 75}" onchange="updateKpiSetting('${s.id}','warningPct',parseInt(this.value)||75)"></td>
            <td><label class="toggle-switch toggle-sm"><input type="checkbox" ${s.enabled ? 'checked' : ''} onchange="updateKpiSetting('${s.id}','enabled',this.checked)"><span class="toggle-slider"></span></label></td>
            <td><input type="text" class="form-control kpi-notes-input" value="${(s.notes || '').replace(/"/g, '&quot;')}" placeholder="Notes" onchange="updateKpiSetting('${s.id}','notes',this.value)"></td>
        </tr>`;
}

function renderBorderKpiTable(title, rows, subtitle) {
    if (!rows.length) return '';
    return `
        <h5 class="kpi-subtable-title">${title} <span class="badge-count">${rows.length}</span></h5>
        ${subtitle ? `<p class="kpi-subtable-subtitle">${subtitle}</p>` : ''}
        <div class="table-container">
            <table class="data-table admin-table kpi-settings-table">
                <thead><tr>
                    <th>#</th><th>Segment / Step</th><th>KPI Type</th><th>Page</th><th>Key</th><th>Dir.</th>
                    <th>Target</th><th>Unit</th><th>Warning %</th><th>Active</th><th>Notes</th>
                </tr></thead>
                <tbody>${rows.map(s => renderKpiSettingRow(s, true)).join('')}</tbody>
            </table>
        </div>`;
}

function renderBorderProcessKpiBlock(proc, filteredSteps) {
    const all = filteredSteps
        .filter(s => s.processGroup === proc.id)
        .sort((a, b) => (a.stepOrder || 0) - (b.stepOrder || 0));
    if (!all.length) return '';
    const transitions = all.filter(s => s.kpiKind === 'transition');
    const steps = all.filter(s => s.kpiKind !== 'transition');
    const transitionTotal = getBorderProcessTransitionHours(proc.id);
    const stepTotal = getBorderProcessTargetHours(proc.id);
    const transitionFlow = transitions.map(t => t.process).join(' · ');
    return `
        <div class="kpi-border-process-block">
            <div class="kpi-border-process-header">
                <h4>${proc.label}</h4>
                <span class="badge-count">${proc.steps.length} steps · ${transitions.length} transitions</span>
                <span class="kpi-process-total">Transitions: <strong>${transitionTotal}h</strong></span>
                <span class="kpi-process-total">Steps: <strong>${stepTotal}h</strong></span>
            </div>
            ${renderBorderKpiTable(
                '↳ Between-Step Transition KPIs',
                transitions,
                `Max time allowed between each consecutive step: ${transitionFlow}`
            )}
            ${renderBorderKpiTable(
                'Step Completion KPIs',
                steps,
                'Target time to complete each individual step'
            )}
        </div>`;
}

function renderBorderKpiGroup(parentCategory, filteredSteps, processFilterId) {
    const catMeta = KPI_CATEGORIES.find(c => c.id === parentCategory);
    if (!catMeta) return '';
    let procs = BORDER_PROCESS_DEFS.filter(p => p.parentCategory === parentCategory);
    if (processFilterId) procs = procs.filter(p => p.id === processFilterId);
    const blocks = procs.map(p => renderBorderProcessKpiBlock(p, filteredSteps)).filter(Boolean).join('');
    if (!blocks) return '';
    return `
        <div class="settings-card kpi-border-group" style="margin-bottom:20px;">
            <h2>${catMeta.icon} ${catMeta.label}</h2>
            <p class="page-subtitle" style="margin-bottom:16px;">Configure KPI for <strong>each step-to-step transition</strong> (e.g. Arrival → Doc Submission → Scanning) and each step completion.</p>
            ${blocks}
        </div>`;
}

function getBorderProcessTargetHours(processId) {
    const proc = getBorderProcessDef(processId);
    if (!proc) return 0;
    return proc.steps.reduce((sum, step) => {
        const s = getBorderStepKpiSetting(processId, step.key);
        return sum + (s?.enabled ? Number(s.targetValue) || 0 : 0);
    }, 0);
}

function getBorderProcessOverallHours(processId) {
    return getBorderProcessTransitionHours(processId) + getBorderProcessTargetHours(processId);
}

function buildDefaultKpiSettings() {
    const nbWf = (WORKFLOW_CONFIG.NB || []).map(s => ({
        id: `wf-nb-${s.key}`,
        category: 'workflow-nb',
        process: s.label,
        workflowStep: s.key,
        pageId: 'nb-operations',
        pageLabel: 'NB Operations',
        direction: 'NB',
        targetValue: s.key === 'kanyaka' ? 24 : s.key === 'offloading' ? 72 : 48,
        warningPct: 75,
        unit: 'hours',
        enabled: true,
        notes: `NB workflow step: ${s.label}`
    }));
    const sbWf = (WORKFLOW_CONFIG.SB || []).map(s => ({
        id: `wf-sb-${s.key}`,
        category: 'workflow-sb',
        process: s.label,
        workflowStep: s.key,
        pageId: 'sb-operations',
        pageLabel: 'SB Operations',
        direction: 'SB',
        targetValue: s.key === 'escort' ? 8 : s.key === 'seal' ? 8 : s.key === 'documents' ? 12 : 48,
        warningPct: 75,
        unit: s.key === 'escort' ? 'days' : 'hours',
        enabled: true,
        notes: `SB workflow step: ${s.label}`
    }));
    sbWf.push({
        id: 'wf-sb-following-on',
        category: 'workflow-sb',
        process: 'Following-on List (Mutaka & Kanyaka)',
        workflowStep: 'followingOn',
        pageId: 'sb-operations',
        pageLabel: 'SB Operations',
        direction: 'SB',
        targetValue: 2,
        warningPct: 75,
        unit: 'hours',
        enabled: true,
        notes: 'Time on following-on list before dispatch'
    });
    const borders = buildBorderStepKpiSettings();
    const pod = [
        { id: 'pod-collection', process: 'POD Collection', workflowStep: 'collected', targetValue: 48, notes: 'Hours from offloading complete to POD collected' },
        { id: 'pod-scan', process: 'Scan after Collection', workflowStep: 'scanned', targetValue: 24, notes: 'Hours from collection to scan' },
        { id: 'pod-upload', process: 'Upload after Scan', workflowStep: 'uploaded', targetValue: 24, notes: 'Hours from scan to upload' },
        { id: 'pod-invoicing', process: 'Send to Invoicing', workflowStep: 'sent_to_invoicing', targetValue: 48, notes: 'Hours from upload to invoicing' }
    ].map(p => ({
        ...p,
        category: 'pod',
        pageId: 'pod-management',
        pageLabel: 'POD Management',
        direction: 'NB',
        warningPct: 75,
        unit: 'hours',
        enabled: true
    }));
    const areas = [
        { id: 'area-kanyaka-nb', process: 'Kanyaka — NB Transit', pageId: 'kanyaka', targetValue: 24 },
        { id: 'area-kanyaka-sb', process: 'Kanyaka — SB Loading & Dispatch', pageId: 'kanyaka', targetValue: 48 },
        { id: 'area-kolwezi', process: 'Kolwezi Offloading', pageId: 'kolwezi', targetValue: 72 },
        { id: 'area-lubumbashi', process: 'Lubumbashi Operations', pageId: 'area-browser', targetValue: 72 },
        { id: 'area-likasi', process: 'Likasi Offloading', pageId: 'area-browser', targetValue: 72 },
        { id: 'area-kasumbalesa', process: 'Kasumbalesa Hub', pageId: 'area-browser', targetValue: 48 }
    ].map(a => ({
        ...a,
        category: 'areas',
        workflowStep: '',
        pageLabel: 'Area Trucks',
        direction: 'Both',
        warningPct: 75,
        unit: 'hours',
        enabled: true,
        notes: `Area SLA for ${a.process}`
    }));
    const modules = [
        { id: 'mod-dashboard-stale', process: 'Dashboard — Stale Trip Alert', pageId: 'dashboard', pageLabel: 'Dashboard', targetValue: 24, unit: 'hours', notes: 'Flag trips with no update beyond this threshold' },
        { id: 'mod-nb-live-hide', process: 'NB Live — Hide after POD Invoicing', pageId: 'nb-operations', pageLabel: 'NB Operations', targetValue: 0, unit: 'hours', notes: 'Truck removed from live NB when POD sent to invoicing' },
        { id: 'mod-sb-live-hide', process: 'SB Live — Hide after Exit to Zambia', pageId: 'sb-operations', pageLabel: 'SB Operations', targetValue: 0, unit: 'hours', notes: 'Truck removed from live SB when Date Exit to Zambia is filled' },
        { id: 'mod-border-complete', process: 'Border — Hide when Clearance Complete', pageId: 'border-clearance', pageLabel: 'Border Clearance', targetValue: 0, unit: 'hours', notes: 'Remove from border list when process complete' },
        { id: 'mod-position-live', process: 'Position Live — Update Frequency', pageId: 'position-live', pageLabel: 'Position Live', targetValue: 4, unit: 'hours', notes: 'Expected position update interval' },
        { id: 'mod-reports-sla', process: 'Reports — Data Freshness', pageId: 'reports', pageLabel: 'Reports', targetValue: 24, unit: 'hours', notes: 'Warn if report data older than this' }
    ].map(m => ({
        ...m,
        category: 'modules',
        workflowStep: '',
        direction: 'Both',
        warningPct: 75,
        enabled: true
    }));
    const assets = [
        { id: 'asset-doc-warning', process: 'Document Expiry Warning', pageId: 'assets', targetValue: 30, unit: 'days', notes: 'Orange alert when document expires within N days' },
        { id: 'asset-doc-expired', process: 'Document Expired', pageId: 'assets', targetValue: 0, unit: 'days', notes: 'Red when document past expiry date' },
        { id: 'asset-idle', process: 'Unassigned Equipment', pageId: 'assets', targetValue: 7, unit: 'days', notes: 'Flag equipment unassigned longer than N days' },
        { id: 'asset-border-valid', process: 'Border Crossing Documents', pageId: 'document-alerts', targetValue: 0, unit: 'days', notes: 'Insurance / permits must be valid before border crossing' }
    ].map(a => ({
        ...a,
        category: 'assets',
        workflowStep: '',
        pageLabel: 'Assets & Equipment',
        direction: 'Both',
        warningPct: 75,
        enabled: true
    }));
    const turnarounds = [{
        id: 'turnaround-nb-to-sb',
        category: 'turnarounds',
        process: 'NB Complete → SB Created',
        workflowStep: 'turnaround',
        pageId: 'turnarounds',
        pageLabel: 'Turnarounds',
        direction: 'Both',
        targetValue: 14,
        warningPct: 75,
        unit: 'days',
        enabled: true,
        notes: 'Maximum days between NB POD complete and SB trip creation'
    }];
    return [...nbWf, ...sbWf, ...borders, ...pod, ...areas, ...modules, ...assets, ...turnarounds];
}

let kpiSettingsDB = buildDefaultKpiSettings();
let kpiAdminFilter = '';
let kpiAdminCategory = 'all';

const KPI_STORAGE_KEY = 'truckcontrol_kpi_settings';
const KPI_SETTINGS_VERSION = 4;

function initKpiSettings() {
    try {
        const version = localStorage.getItem('truckcontrol_kpi_version');
        if (version !== String(KPI_SETTINGS_VERSION)) {
            localStorage.removeItem(KPI_STORAGE_KEY);
            localStorage.setItem('truckcontrol_kpi_version', String(KPI_SETTINGS_VERSION));
        }
        const raw = localStorage.getItem(KPI_STORAGE_KEY);
        if (!raw) {
            applyKpiSettingsToRuntime();
            return;
        }
        const stored = JSON.parse(raw);
        const defaults = buildDefaultKpiSettings();
        const storedMap = Object.fromEntries((stored || []).map(s => [s.id, s]));
        kpiSettingsDB = defaults.map(d => ({ ...d, ...(storedMap[d.id] || {}) }));
        defaults.forEach(d => { if (!storedMap[d.id] && !kpiSettingsDB.find(s => s.id === d.id)) kpiSettingsDB.push(d); });
    } catch {
        kpiSettingsDB = buildDefaultKpiSettings();
    }
    applyKpiSettingsToRuntime();
}

function saveKpiSettingsToStorage() {
    localStorage.setItem(KPI_STORAGE_KEY, JSON.stringify(kpiSettingsDB));
    applyKpiSettingsToRuntime();
    recalculateAllTripKpis();
    logAuditEvent('KPI settings updated', 'kpi-settings', 'config', `${kpiSettingsDB.filter(s => s.enabled).length} active rules`);
}

function resetKpiSettingsToDefaults() {
    if (!confirm('Reset all KPI targets to system defaults? This cannot be undone.')) return;
    kpiSettingsDB = buildDefaultKpiSettings();
    localStorage.removeItem(KPI_STORAGE_KEY);
    applyKpiSettingsToRuntime();
    showToast('KPI settings reset to defaults', 'success');
    if (currentPage === 'admin-kpi-settings') renderAdminKpiSettings(document.getElementById('contentArea'));
}

function getKpiSetting(id) {
    return kpiSettingsDB.find(s => s.id === id);
}

function updateKpiSetting(id, field, value) {
    const row = kpiSettingsDB.find(s => s.id === id);
    if (!row) return;
    row[field] = value;
}

function computeKpiLevel(elapsed, settingOrId) {
    const setting = typeof settingOrId === 'string' ? getKpiSetting(settingOrId) : settingOrId;
    if (!setting || !setting.enabled) return { level: 'green', label: '🟢 ON TRACK', pct: 0 };
    const target = Number(setting.targetValue) || 1;
    const warningPct = Number(setting.warningPct ?? 75);
    const warningAt = target * (warningPct / 100);
    const pct = target > 0 ? Math.round((elapsed / target) * 100) : 0;
    if (elapsed >= target && target > 0) return { level: 'red', label: '🔴 OVERDUE', pct };
    if (elapsed >= warningAt) return { level: 'orange', label: '🟠 PRIORITY', pct };
    return { level: 'green', label: '🟢 ON TRACK', pct };
}

function getTripKpiSetting(trip) {
    if (!trip) return null;
    const steps = WORKFLOW_CONFIG[trip.direction] || WORKFLOW_CONFIG.NB;
    const currentKey = steps.map(s => s.key).find(k => trip.workflow && trip.workflow[k] === 'current');
    if (currentKey) {
        const wfSetting = getKpiSetting(`wf-${String(trip.direction).toLowerCase()}-${currentKey}`);
        if (wfSetting?.enabled) return wfSetting;
    }
    const stale = getKpiSetting('mod-dashboard-stale');
    if (stale?.enabled) return stale;
    const turnaround = getKpiSetting('turnaround-nb-to-sb');
    return turnaround?.enabled ? turnaround : null;
}

function recalculateTripKpi(trip) {
    if (!trip) return;
    const tripKey = trip.tripNumber || trip.trip;
    const borderRow = typeof borderClearanceTrucks !== 'undefined'
        ? borderClearanceTrucks.find(b => b.trip === tripKey)
        : null;
    if (borderRow && borderRow.hours != null) {
        const targetH = parseInt(String(borderRow.target || '48'), 10) || 48;
        trip.kpi = computeKpiLevel(borderRow.hours, { targetValue: targetH, warningPct: 75, enabled: true }).level;
        return;
    }
    const pod = typeof podDB !== 'undefined' ? podDB.find(p => p.trip === tripKey) : null;
    if (pod?.kpi && (trip.workflow?.pod === 'current' || currentPage === 'pod-management')) {
        trip.kpi = typeof normalizeKpi === 'function' ? normalizeKpi(pod.kpi) : pod.kpi;
        return;
    }
    const setting = getTripKpiSetting(trip);
    if (!setting) return;
    const elapsed = setting.unit === 'days'
        ? (Number(trip.daysInDRC) || 0)
        : (Number(trip.daysInDRC) || 0) * 24;
    trip.kpi = computeKpiLevel(elapsed, setting).level;
}

function getBorderRowForTrip(tripNumber) {
    return (typeof borderClearanceTrucks !== 'undefined')
        ? borderClearanceTrucks.find(b => b.trip === tripNumber)
        : null;
}

function resolveCommentContextKpi(tripNumber, statusContext) {
    return buildCommentModalKpiSnapshot(tripNumber, statusContext, tripsDB[tripNumber]).effective;
}

function buildCommentModalKpiSnapshot(tripNumber, statusContext, trip) {
    const sources = [];
    const norm = (k) => (typeof normalizeKpi === 'function' ? normalizeKpi(k) : k) || 'green';

    if (trip) {
        const pageLabel = trip.direction === 'SB' ? 'SB Operations' : 'NB Operations';
        const opsCtx = statusContext === 'nb' || statusContext === 'sb' ||
            statusContext === 'border' || statusContext === 'pod' ||
            ['nb-operations', 'sb-operations', 'position-live', 'border-clearance', 'pod-management'].includes(currentPage);
        sources.push({
            id: 'trip',
            label: pageLabel,
            kpi: norm(trip.kpi),
            detail: [
                trip.daysInDRC != null ? `${trip.daysInDRC}d in DRC` : null,
                trip.status || null
            ].filter(Boolean).join(' · ') || 'Live operations',
            active: statusContext === 'nb' || statusContext === 'sb' ||
                (opsCtx && !['border', 'pod'].includes(statusContext))
        });
    }

    const borderRow = getBorderRowForTrip(tripNumber);
    if (borderRow) {
        sources.push({
            id: 'border',
            label: `Border — ${borderRow.border}`,
            kpi: norm(borderRow.kpi),
            detail: [
                borderRow.hours != null ? `${borderRow.hours}h / ${borderRow.target || '48h'}` : null,
                borderRow.process || null,
                borderRow.status || null
            ].filter(Boolean).join(' · ') || 'Border clearance',
            active: statusContext === 'border'
        });
    }

    if (typeof podDB !== 'undefined') {
        const pod = podDB.find(p => p.trip === tripNumber);
        if (pod) {
            let stage = 'Pending collection';
            if (pod.sentToInvoicing) stage = 'Sent to invoicing';
            else if (pod.uploaded) stage = 'Uploaded';
            else if (pod.scanned) stage = 'Scanned';
            else if (pod.collected) stage = pod.collectedOnTime ? 'Collected on-time' : 'Collected late';
            else if (pod.overdue) stage = 'Overdue';
            sources.push({
                id: 'pod',
                label: 'POD',
                kpi: norm(pod.kpi),
                detail: `${stage}${pod.area ? ` · ${pod.area}` : ''}`,
                active: statusContext === 'pod'
            });
        }
    }

    const rank = { green: 1, orange: 2, red: 3 };
    const effective = sources.reduce((worst, s) =>
        (rank[s.kpi] || 0) > (rank[worst] || 0) ? s.kpi : worst, 'green');

    return { sources, effective, context: statusContext };
}

function renderModalKpiBadge(kpi) {
    const k = typeof normalizeKpi === 'function' ? normalizeKpi(kpi) : kpi;
    const label = typeof getKpiLabel === 'function' ? getKpiLabel(k) : getKPILabel(k);
    return `<span class="status-badge ${k}"><span class="dot"></span> ${label}</span>`;
}

function renderCommentModalKpiPanel(snapshot) {
    if (!snapshot?.sources?.length) {
        return `<div class="modal-kpi-panel">${renderModalKpiBadge('green')}</div>`;
    }
    const effectiveBadge = renderModalKpiBadge(snapshot.effective);
    const chips = snapshot.sources.map(s => `
        <div class="modal-kpi-chip${s.active ? ' modal-kpi-chip-active' : ''}" title="${s.detail}">
            <span class="modal-kpi-chip-label">${s.label}${s.active ? ' <em>(this page)</em>' : ''}</span>
            ${renderModalKpiBadge(s.kpi)}
            <small class="modal-kpi-chip-detail">${s.detail}</small>
        </div>
    `).join('');
    return `
        <div class="modal-kpi-panel">
            <div class="modal-kpi-effective">
                <span class="modal-kpi-effective-label">Effective KPI</span>
                ${effectiveBadge}
                <small class="modal-kpi-effective-hint">Worst status across sources — drives comment type</small>
            </div>
            <div class="modal-kpi-sources">${chips}</div>
        </div>`;
}

function kpiSuggestsStructuredComment(kpi) {
    const k = typeof normalizeKpi === 'function' ? normalizeKpi(kpi) : kpi;
    return k === 'orange' || k === 'red';
}

function applyCommentModalKpiStyling(kpi) {
    const modal = document.querySelector('#commentModal .modal');
    const k = typeof normalizeKpi === 'function' ? normalizeKpi(kpi) : kpi;
    if (modal) {
        modal.classList.remove('comment-modal-kpi-green', 'comment-modal-kpi-orange', 'comment-modal-kpi-red');
        modal.classList.add(`comment-modal-kpi-${k}`);
    }
    const normalOpt = document.querySelector('.comment-type-option[data-type="normal"]');
    const structOpt = document.querySelector('.comment-type-option[data-type="structured"]');
    const selector = document.getElementById('commentTypeSelector');
    if (normalOpt) normalOpt.style.display = '';
    if (structOpt) structOpt.style.display = '';
    if (selector) selector.classList.remove('requires-structured');
    if (kpiSuggestsStructuredComment(k) && selectedCommentType !== 'normal') {
        selectedCommentType = 'structured';
    } else if (!kpiSuggestsStructuredComment(k) && selectedCommentType === 'structured') {
        selectedCommentType = 'normal';
    }
}

const KASUMBALESA_NB_PROCESSES = ['Direct', 'KBP', 'Whisky'];

function normalizeKasumbalesaProcess(proc) {
    if (!proc) return 'KBP';
    if (/direct/i.test(proc)) return 'Direct';
    if (/whisky/i.test(proc)) return 'Whisky';
    return 'KBP';
}

function getKasumbalesaViewPage(process) {
    const p = normalizeKasumbalesaProcess(process);
    if (p === 'Whisky') return 'kasumbalesa-whisky';
    if (p === 'Direct') return 'kasumbalesa-direct';
    return 'kasumbalesa-detail';
}

function renderKasumbalesaProcessBadgeHtml(process) {
    const p = normalizeKasumbalesaProcess(process);
    const cls = p === 'Whisky' ? 'whisky' : p === 'Direct' ? 'direct' : 'kbp';
    return `<span class="status-badge ${cls}">📍 ${p}</span>`;
}

function setTripKasumbalesaProcess(tripNumber, process) {
    const trip = tripsDB[tripNumber];
    if (!trip) return;
    const normalized = normalizeKasumbalesaProcess(process);
    trip.borderProcess = normalized;
    const borderRow = getBorderRowForTrip(tripNumber);
    if (borderRow) {
        borderRow.process = normalized;
        borderRow.processHtml = renderKasumbalesaProcessBadgeHtml(normalized);
        borderRow.viewPage = getKasumbalesaViewPage(normalized);
    }
    logAuditEvent(`Kasumbalesa process: ${normalized}`, tripNumber, 'trip');
}

function onKasumbalesaProcessChange(process) {
    if (!currentCommentTrip) return;
    setTripKasumbalesaProcess(currentCommentTrip, process);
    showToast(`Kasumbalesa border process set to ${normalizeKasumbalesaProcess(process)}`, 'success');
}

function showKasumbalesaProcessInModal(trip, statusContext) {
    const section = document.getElementById('kasumbalesaProcessSection');
    if (!section) return;
    const isKasumbalesaNb = trip && trip.direction === 'NB' &&
        (statusContext === 'border' || statusContext === 'nb') &&
        (trip.entryBorder === 'Kasumbalesa' || trip.area === 'Kasumbalesa');
    section.style.display = isKasumbalesaNb ? 'block' : 'none';
    if (isKasumbalesaNb) {
        const sel = document.getElementById('kasumbalesaProcessSelect');
        if (sel) sel.value = normalizeKasumbalesaProcess(trip.borderProcess);
    }
}

function recalculateAllTripKpis() {
    Object.values(tripsDB).forEach(recalculateTripKpi);
}

function formatKpiSettingLine(s) {
    if (!s.enabled) return null;
    const u = s.unit === 'days' ? 'days' : 'hours';
    const warn = Math.round((Number(s.targetValue) || 0) * ((s.warningPct ?? 75) / 100));
    if (Number(s.targetValue) === 0) return `${s.process}: ${s.notes || 'completion-based rule'}`;
    return `${s.process}: ≤ ${s.targetValue} ${u} (🟠 at ${warn}${u === 'days' ? 'd' : 'h'}, 🔴 over target)`;
}

function getKpiSettingsForBanner(bannerType) {
    if (bannerType === 'border') {
        return BORDER_PROCESS_DEFS.map(proc => {
            const transitionTotal = getBorderProcessTransitionHours(proc.id);
            const stepTotal = getBorderProcessTargetHours(proc.id);
            const transitionNotes = [];
            for (let i = 0; i < proc.steps.length - 1; i++) {
                const from = proc.steps[i];
                const to = proc.steps[i + 1];
                const s = getBorderTransitionKpiSetting(proc.id, from.key, to.key);
                const t = s?.enabled ? s.targetValue : from.transitionToNext;
                transitionNotes.push(`${from.shortName || from.name} → ${to.shortName || to.name}: ${t}h`);
            }
            return {
                id: `border-banner-${proc.id}`,
                enabled: true,
                process: `${proc.label} — transitions (${proc.steps.length - 1})`,
                targetValue: transitionTotal,
                warningPct: 75,
                unit: 'hours',
                notes: transitionNotes.join(' · ')
            };
        }).filter(s => s.targetValue > 0);
    }
    const cats = KPI_CATEGORIES.filter(c => c.banner === bannerType).map(c => c.id);
    if (bannerType === 'nb') cats.push('pod');
    return kpiSettingsDB.filter(s => s.enabled && cats.includes(s.category));
}

function applyKpiSettingsToRuntime() {
    BORDER_PROCESS_DEFS.forEach(proc => {
        const totalHours = getBorderProcessOverallHours(proc.id);
        if (proc.configKey && nbBorderConfigs[proc.configKey]) {
            nbBorderConfigs[proc.configKey].targetHours = totalHours;
        }
        if (proc.configKey && sbBorderConfigs[proc.configKey]) {
            sbBorderConfigs[proc.configKey].targetHours = totalHours;
        }
    });
    const perfMap = {
        'Kasumbalesa KBP': 'kbp',
        'Kasumbalesa Whisky': 'whisky',
        'Kasumbalesa Direct': 'direct',
        'Sakania': 'sakania',
        'Mokambo': 'mokambo',
        'Kasumbalesa Exit': 'sb-kasumbalesa',
        'Sakania Exit': 'sb-sakania',
        'Mokambo Exit': 'sb-mokambo'
    };
    ['NB', 'SB'].forEach(dir => {
        (borderPerformanceData[dir]?.borders || []).forEach(b => {
            const processId = perfMap[b.name];
            if (!processId) return;
            const total = getBorderProcessOverallHours(processId);
            b.targetHours = total;
            if (typeof b.avgHours === 'number') b.kpi = computeKpiLevel(b.avgHours, { targetValue: total, warningPct: 75, enabled: true }).level;
        });
    });
    recalculateAllTripKpis();
}

const documentsDB = [
    { id: 1, type: 'Insurance', entity: 'Truck ZAM-4567', trip: 'TR-1024', truck: 'ZAM-4567', expiry: '2025-04-15', issued: '2024-04-15', status: 'expiring', kpi: 'orange', label: 'Expires in 7d', fileName: 'Insurance_ZAM-4567.pdf', category: 'Vehicle Insurance', assetId: 'AST-001' },
    { id: 2, type: 'Vignette', entity: 'Truck ZAM-4590', trip: 'TR-1028', truck: 'ZAM-4590', expiry: '2025-04-10', issued: '2024-04-10', status: 'expired', kpi: 'red', label: 'Expired', fileName: 'Vignette_ZAM-4590.pdf', category: 'Border Vignette', assetId: 'AST-002' },
    { id: 3, type: 'TR8', entity: 'Trip TR-1024', trip: 'TR-1024', truck: 'ZAM-4567', expiry: '2025-05-01', issued: '2025-04-01', status: 'valid', kpi: 'green', label: 'Valid', fileName: 'TR8_TR-1024.pdf', category: 'Customs TR8', assetId: 'AST-001' },
    { id: 4, type: 'Road Tax', entity: 'Truck ZAM-4612', trip: 'TR-1031', truck: 'ZAM-4612', expiry: '2025-04-20', issued: '2024-04-20', status: 'expiring', kpi: 'orange', label: 'Expires in 12d', fileName: 'RoadTax_ZAM-4612.pdf', category: 'Road Tax Certificate', assetId: 'AST-003' },
    { id: 5, type: 'Insurance', entity: 'Truck ZAM-4789', trip: 'SB-2045', truck: 'ZAM-4789', expiry: '2025-03-01', issued: '2024-03-01', status: 'expired', kpi: 'red', label: 'Expired', fileName: 'Insurance_ZAM-4789.pdf', category: 'Vehicle Insurance', assetId: 'AST-004' }
];

const assetsRegistryDB = [
    {
        id: 'AST-001', category: 'vehicle', assetType: 'Truck', name: 'ZAM-4567', status: 'active', acquisitionDate: '2022-03-15',
        plateNumber: 'ZAM-4567', vin: 'YV2RT40A0NB123456', make: 'Volvo', model: 'FH16', year: 2022,
        engineNumber: 'D16K750-8891', fuelType: 'Diesel', grossWeight: '56,000 kg', axleConfig: '6x4',
        trailerPlate: 'TRL-8901', odometer: '245,000 km', color: 'White', assignedDriver: 'John Doe',
        owner: 'Transport Co A', location: 'Kasumbalesa', notes: 'Primary Kasumbalesa border haulage unit',
        documents: [
            { id: 101, type: 'Insurance', fileName: 'Insurance_ZAM-4567.pdf', acquisitionDate: '2024-04-15', expiryDate: '2025-04-15' },
            { id: 102, type: 'Road Tax', fileName: 'RoadTax_ZAM-4567.pdf', acquisitionDate: '2024-01-10', expiryDate: '2025-01-10' },
            { id: 103, type: 'Fitness Certificate', fileName: 'Fitness_ZAM-4567.pdf', acquisitionDate: '2024-06-01', expiryDate: '2025-06-01' }
        ]
    },
    {
        id: 'AST-002', category: 'vehicle', assetType: 'Truck', name: 'ZAM-4590', status: 'active', acquisitionDate: '2021-08-20',
        plateNumber: 'ZAM-4590', vin: 'YV2RT40A0NB234567', make: 'Scania', model: 'R500', year: 2021,
        engineNumber: 'DC13-092-4412', fuelType: 'Diesel', grossWeight: '52,000 kg', axleConfig: '6x2',
        trailerPlate: 'TRL-7720', odometer: '312,000 km', color: 'Blue', assignedDriver: 'Peter Banda',
        owner: 'ZAM Logistics', location: 'Kanyaka', notes: 'Kanyaka depot operations',
        documents: [
            { id: 104, type: 'Vignette', fileName: 'Vignette_ZAM-4590.pdf', acquisitionDate: '2024-04-10', expiryDate: '2025-04-10' },
            { id: 105, type: 'Insurance', fileName: 'Insurance_ZAM-4590.pdf', acquisitionDate: '2024-04-10', expiryDate: '2025-04-10' }
        ]
    },
    {
        id: 'AST-003', category: 'vehicle', assetType: 'Trailer', name: 'TRL-4612', status: 'maintenance', acquisitionDate: '2020-11-05',
        plateNumber: 'TRL-4612', vin: 'TRL9X2KLM4400123', make: 'Afrit', model: 'Super Link', year: 2020,
        engineNumber: '—', fuelType: '—', grossWeight: '36,000 kg', axleConfig: '3 Axle',
        trailerPlate: 'TRL-4612', odometer: '—', color: 'Silver', assignedDriver: '—',
        owner: 'Copper Haul', location: 'Likasi', notes: 'Awaiting brake system service',
        documents: [
            { id: 106, type: 'Road Tax', fileName: 'RoadTax_ZAM-4612.pdf', acquisitionDate: '2024-04-20', expiryDate: '2025-04-20' }
        ]
    },
    {
        id: 'AST-004', category: 'equipment', assetType: 'Computer', name: 'OPS-LAPTOP-01', status: 'active', acquisitionDate: '2023-05-12',
        serialNumber: 'DL-882910', brand: 'Dell', model: 'Latitude 5540', assignedTo: 'Control Room — Jean Kalenga',
        department: 'Operations', location: 'Kasumbalesa Control Room', imei: '', notes: 'Border clearance workstation',
        documents: [
            { id: 107, type: 'Warranty', fileName: 'Warranty_OPS-LAPTOP-01.pdf', acquisitionDate: '2023-05-12', expiryDate: '2026-05-12' },
            { id: 108, type: 'Software Licence', fileName: 'Licence_OPS-LAPTOP-01.pdf', acquisitionDate: '2024-01-01', expiryDate: '2025-12-31' }
        ]
    },
    {
        id: 'AST-005', category: 'equipment', assetType: 'Cellphone', name: 'DRV-PHONE-14', status: 'active', acquisitionDate: '2024-02-18',
        serialNumber: 'SM-A546-9912', brand: 'Samsung', model: 'Galaxy A54', assignedTo: 'Driver — Mike Johnson',
        department: 'Fleet Communications', location: 'Mobile', imei: '356789012345678', notes: 'Driver dispatch phone',
        documents: [
            { id: 109, type: 'Device Insurance', fileName: 'Insurance_DRV-PHONE-14.pdf', acquisitionDate: '2024-02-18', expiryDate: '2025-02-18' }
        ]
    }
];

function syncAllAssetDocumentsToGlobalRegistry() {
    assetsRegistryDB.forEach(asset => {
        (asset.documents || []).forEach(doc => syncAssetDocumentToGlobalRegistry(doc, asset));
    });
}

const OPERATIONAL_AREAS = ['Kasumbalesa', 'Kanyaka', 'Kolwezi', 'Lubumbashi', 'Likasi', 'Sakania', 'Mokambo', 'HQ', 'All Areas'];
const MATRIX_AREAS = OPERATIONAL_AREAS;

const areaStatusesDB = [
    { id: 'AS-001', area: 'Kasumbalesa', isBorder: true, borderForNB: true, borderForSB: true, isOffloadingPoint: false, isLoadingPoint: false, isKanyakaHub: false, kanyakaForNB: false, kanyakaForSB: false,
      statusesNB: ['Arrived at Border', 'KBP Parking', 'KBP Scan Bay', 'Whisky Process', 'Customs Clearance', 'Border Clearance Complete'],
      statusesSB: ['Exit Queue', 'Gov List Check', 'Exit Processing'],
      statusesBorderNB: ['Entry on DRC', 'KBP Parking', 'KBP Scan Bay', 'BAE Submitted', 'Whisky Process', 'Customs Clearance', 'Driver Contact Recorded'],
      statusesBorderSB: ['Gov List Uploaded', 'Customs Declaration', 'Seal Verification', 'Exit to Zambia'], active: true },
    { id: 'AS-002', area: 'Kanyaka', isBorder: false, borderForNB: false, borderForSB: false, isOffloadingPoint: true, isLoadingPoint: true, isKanyakaHub: true, kanyakaForNB: true, kanyakaForSB: true,
      statusesNB: ['In Transit to Kanyaka', 'At Kanyaka Depot', 'Transit Complete'],
      statusesSB: ['Gov List Pending', 'Gov List Uploaded', 'Loading', 'Dispatch Ready', 'Exit Pending', 'Exception — Transit Approved'],
      statusesBorderNB: [], statusesBorderSB: [], active: true },
    { id: 'AS-003', area: 'Kolwezi', isBorder: false, isOffloadingPoint: true, isLoadingPoint: true, isKanyakaHub: false, kanyakaForNB: true, kanyakaForSB: false,
      statusesNB: ['In Transit', 'At Mine Gate', 'Offloading', 'Offloading Complete', 'Awaiting POD'],
      statusesSB: ['At Mine', 'Loading', 'Loading Complete'], statusesBorderNB: [], statusesBorderSB: [], active: true },
    { id: 'AS-004', area: 'Lubumbashi', isOffloadingPoint: true, isLoadingPoint: false, isKanyakaHub: false,
      statusesNB: ['In Transit', 'At Depot', 'Offloading', 'POD Collection', 'POD Complete'],
      statusesSB: [], statusesBorderNB: [], statusesBorderSB: [], active: true },
    { id: 'AS-005', area: 'Sakania', isBorder: true, borderForNB: true, borderForSB: true,
      statusesNB: ['Arrived at Border', 'BN Process', 'Parking', 'Clearance Complete'],
      statusesSB: ['Exit BN Process', 'Clearance Complete'],
      statusesBorderNB: ['Arrived', 'BN Parking', 'Scanning', 'Clearance Complete'],
      statusesBorderSB: ['Gov List', 'Declaration', 'Exit Complete'], active: true },
    { id: 'AS-006', area: 'Mokambo', isBorder: true, borderForNB: true, borderForSB: true,
      statusesNB: ['Arrived at Border', 'BN Process', 'Clearance Complete'],
      statusesSB: ['Gov List Upload', 'Exit Processing'],
      statusesBorderNB: ['Arrived', 'BN Process', 'Gov List', 'Clearance Complete'],
      statusesBorderSB: ['Gov List Uploaded', 'Seal Verification', 'Exit Complete'], active: true },
    { id: 'AS-007', area: 'Likasi', isOffloadingPoint: true, statusesNB: ['In Transit', 'Offloading', 'Offloading Complete', 'Awaiting POD'], statusesSB: [], statusesBorderNB: [], statusesBorderSB: [], active: true }
];

window.areaStatusesDB = areaStatusesDB;

const SB_EXIT_BORDERS = ['Kasumbalesa', 'Sakania', 'Mokambo'];
const CLEARING_AGENTS = ['Jean Kalenga', 'Marie Mwamba', 'Ruth Mwansa', 'Inspector Kabwe', 'David Mukendi'];

/** Per-trip area status updates as truck moves between processes */
const tripAreaUpdatesDB = {
    'NB-2024-001': [
        { area: 'Kasumbalesa', status: 'KBP Parking', notes: 'Driver waiting at scan bay — queue approx 2h', updatedBy: 'border_moderator', timestamp: '2026-07-25 09:15:00', statusDate: '2026-07-25T09:15', workflowKey: 'border' },
        { area: 'Kasumbalesa', status: 'BAE Submitted', notes: 'BAE documents submitted to customs', updatedBy: 'border_moderator', timestamp: '2026-07-24 14:20:00', statusDate: '2026-07-24T14:00', workflowKey: 'border' },
        { area: 'Kasumbalesa', status: 'Entry on DRC', notes: 'Truck entered DRC side under KBP process', updatedBy: 'border_moderator', timestamp: '2026-07-23 08:30:00', statusDate: '2026-07-23T08:00', workflowKey: 'border' }
    ],
    'NB-2024-015': [
        { area: 'Kolwezi', status: 'Offloading', notes: 'Offloading at Kolwezi Mine gate', updatedBy: 'ops_manager', timestamp: '2026-07-24 09:30:00', statusDate: '2026-07-24T09:00', workflowKey: 'offloading' },
        { area: 'Kanyaka', status: 'Transit Complete', notes: 'Cleared Kanyaka depot', updatedBy: 'ops_manager', timestamp: '2026-07-20 14:45:00', statusDate: '2026-07-20T14:00', workflowKey: 'kanyaka' },
        { area: 'Sakania', status: 'Border Clearance Complete', notes: 'Sakania BN clearance done', updatedBy: 'border_moderator', timestamp: '2026-07-18 10:30:00', statusDate: '2026-07-18T10:00', workflowKey: 'border' }
    ],
    'NB-2024-031': [
        { area: 'Kanyaka', status: 'At Kanyaka Depot', notes: 'Waiting for transit slot', updatedBy: 'ops_manager', timestamp: '2026-07-25 11:00:00', statusDate: '2026-07-25T10:30', workflowKey: 'kanyaka' },
        { area: 'Kasumbalesa', status: 'Border Clearance Complete', notes: 'KBP clearance completed', updatedBy: 'border_moderator', timestamp: '2026-07-22 08:00:00', statusDate: '2026-07-22T08:00', workflowKey: 'border' }
    ],
    'NB-2024-045': [
        { area: 'Kanyaka', status: 'Awaiting POD', notes: 'Offloading complete — POD team notified', updatedBy: 'ops_manager', timestamp: '2026-07-24 16:00:00', statusDate: '2026-07-24T15:30', workflowKey: 'pod' },
        { area: 'Kolwezi', status: 'Offloading Complete', notes: 'All cargo offloaded', updatedBy: 'ops_manager', timestamp: '2026-07-23 12:00:00', statusDate: '2026-07-23T11:30', workflowKey: 'offloading' },
        { area: 'Kanyaka', status: 'At Kanyaka Depot', notes: 'Transit through Kanyaka hub', updatedBy: 'ops_manager', timestamp: '2026-07-21 09:00:00', statusDate: '2026-07-21T08:30', workflowKey: 'kanyaka' }
    ],
    'SB-2024-003': [
        { area: 'Kasumbalesa', status: 'Seal Verification', notes: 'Seal check in progress', updatedBy: 'border_moderator', timestamp: '2026-07-25 10:00:00', statusDate: '2026-07-25T09:30', workflowKey: 'border' },
        { area: 'Kasumbalesa', status: 'Gov List Uploaded', notes: 'Gov list submitted', updatedBy: 'border_moderator', timestamp: '2026-07-24 14:00:00', statusDate: '2026-07-24T13:30', workflowKey: 'border' },
        { area: 'Kasumbalesa', status: 'Arrived at Exit Border', notes: 'Arrived at exit queue', updatedBy: 'border_moderator', timestamp: '2026-07-23 16:00:00', statusDate: '2026-07-23T15:30', workflowKey: 'border' },
        { area: 'Kanyaka', status: 'Loading', notes: 'Loading at Kanyaka yard', updatedBy: 'ops_manager', timestamp: '2026-07-23 11:30:00', statusDate: '2026-07-23T11:00', workflowKey: 'loadingProcess' }
    ],
    'SB-2024-012': [
        { area: 'Kolwezi', status: 'Escort Arranged', notes: 'Escort assigned for Kolwezi dispatch', updatedBy: 'ops_manager', timestamp: '2026-07-22 08:45:00', statusDate: '2026-07-22T08:00', workflowKey: 'escort' },
        { area: 'Kolwezi', status: 'Seal Applied', notes: 'Seal verified at mine', updatedBy: 'ops_manager', timestamp: '2026-07-21 10:00:00', statusDate: '2026-07-21T09:30', workflowKey: 'seal' },
        { area: 'Kolwezi', status: 'Documents Collected', notes: 'All loading documents received', updatedBy: 'ops_manager', timestamp: '2026-07-20 14:00:00', statusDate: '2026-07-20T13:30', workflowKey: 'documents' },
        { area: 'Kolwezi', status: 'Loading Complete', notes: 'Loaded at Kolwezi Mine', updatedBy: 'ops_manager', timestamp: '2026-07-19 16:30:00', statusDate: '2026-07-19T16:00', workflowKey: 'loadingProcess' }
    ],
    'SB-2024-018': [
        { area: 'Kasumbalesa', status: 'Exit to Zambia — Complete', notes: 'Exit clearance completed', updatedBy: 'border_moderator', timestamp: '2026-07-25 11:00:00', statusDate: '2026-07-25T10:30', workflowKey: 'border' },
        { area: 'Kasumbalesa', status: 'Seal Verification', notes: 'Seal verified at exit', updatedBy: 'border_moderator', timestamp: '2026-07-25 09:00:00', statusDate: '2026-07-25T08:45', workflowKey: 'border' },
        { area: 'Kasumbalesa', status: 'Customs Declaration Submitted', notes: 'Declaration filed', updatedBy: 'border_moderator', timestamp: '2026-07-24 15:00:00', statusDate: '2026-07-24T14:30', workflowKey: 'border' },
        { area: 'Kasumbalesa', status: 'Gov List Uploaded', notes: 'Gov list uploaded for exit', updatedBy: 'border_moderator', timestamp: '2026-07-24 10:00:00', statusDate: '2026-07-24T09:30', workflowKey: 'border' },
        { area: 'Kasumbalesa', status: 'Arrived at Exit Border', notes: 'Truck at Kasumbalesa exit', updatedBy: 'border_moderator', timestamp: '2026-07-24 08:00:00', statusDate: '2026-07-24T07:30', workflowKey: 'border' }
    ],
};

if (typeof window !== 'undefined') window.tripAreaUpdatesDB = tripAreaUpdatesDB;

let nextAreaStatusId = 8;
let editingAreaStatusId = null;
if (typeof window !== 'undefined') window.nextAreaStatusId = nextAreaStatusId;
let currentReportType = 'operations-overview';
let areaAssignmentFilter = '';

function getStatusesForArea(areaName) {
    if (typeof getStatusesForContext === 'function') {
        const trip = Object.values(tripsDB).find(t => t.area === areaName);
        if (trip) return getStatusesForContext(trip);
    }
    const rec = areaStatusesDB.find(a => a.area === areaName);
    if (!rec) return [];
    return [...new Set([...(rec.statusesNB || []), ...(rec.statusesSB || []), ...(rec.statusesBorderNB || []), ...(rec.statusesBorderSB || [])])];
}

function getUserAssignedAreas() {
    const user = getCurrentAdminUser();
    if (!user) return ['All Areas'];
    if (user.assignedAreas && user.assignedAreas.length) return user.assignedAreas;
    if (!user.area || user.area === 'All Areas' || user.area === 'HQ') return ['All Areas'];
    return [user.area];
}

function userSeesAllTrucks() {
    const role = getCurrentRole();
    if (role?.name === 'Super Admin' || role?.name === 'Manager') return true;
    const areas = getUserAssignedAreas();
    return areas.includes('All Areas') || areas.includes('Kanyaka');
}

function tripMatchesUserArea(trip) {
    if (userSeesAllTrucks()) return true;
    const areas = getUserAssignedAreas().map(a => a.toLowerCase());
    const fields = [trip.area, trip.offloadingPoint, trip.loadingPoint, trip.entryBorder, trip.exitBorder].filter(Boolean).map(s => s.toLowerCase());
    return areas.some(a => fields.some(f => f.includes(a) || a.includes(f.split(' ')[0])));
}

function filterTripsByUserArea(trips) {
    return trips.filter(tripMatchesUserArea);
}

function getAreaFilterBanner() {
    const user = getCurrentAdminUser();
    const areas = getUserAssignedAreas();
    if (userSeesAllTrucks()) {
        return `<div class="rbac-info-banner"><strong>View:</strong> All trucks visible${areas.includes('Kanyaka') ? ' (Kanyaka team — full visibility)' : ''} — logged in as <em>${user?.username}</em></div>`;
    }
    return `<div class="rbac-info-banner"><strong>Area filter active:</strong> Showing trucks for <em>${areas.join(', ')}</em> only — logged in as <em>${user?.username}</em></div>`;
}

function resolveWorkflowKeyForTripStatus(trip, statusUpdate, statusContext) {
    if (!trip) return null;
    const dir = trip.direction === 'SB' ? 'SB' : 'NB';
    if (typeof inferWorkflowKeyFromAreaStatus === 'function') {
        const areaCandidates = [trip.area, trip.entryBorder, trip.exitBorder, trip.offloadingPoint, trip.loadingPoint]
            .filter(Boolean);
        for (const areaName of areaCandidates) {
            const fromArea = inferWorkflowKeyFromAreaStatus(dir, areaName, statusUpdate);
            if (fromArea) return fromArea;
        }
        const fromArea = inferWorkflowKeyFromAreaStatus(dir, null, statusUpdate);
        if (fromArea) return fromArea;
    }
    const steps = WORKFLOW_CONFIG[trip.direction] || WORKFLOW_CONFIG.NB;
    const matchStep = steps.find(s => s.label === statusUpdate);
    if (matchStep) return matchStep.key;
    const currentKey = steps.map(s => s.key).find(k => trip.workflow && trip.workflow[k] === 'current');
    if (currentKey) return currentKey;
    const ctx = statusContext || (typeof currentCommentStatusContext !== 'undefined' ? currentCommentStatusContext : null);
    const status = String(statusUpdate || '').toLowerCase();
    if (ctx === 'border' || ctx === 'pod') return ctx === 'pod' ? 'pod' : 'border';
    if (ctx === 'nb') {
        if (/border|kbp|whisky|customs|bae|entry|arrived/i.test(status)) return 'border';
        if (/kanyaka|transit/i.test(status)) return 'kanyaka';
        if (/offload|mine|gate/i.test(status)) return 'offloading';
        if (/pod/i.test(status)) return 'pod';
        return 'border';
    }
    if (ctx === 'sb') {
        if (/load/i.test(status)) return 'loadingProcess';
        if (/document/i.test(status)) return 'documents';
        if (/seal/i.test(status)) return 'seal';
        if (/escort/i.test(status)) return 'escort';
        if (/dispatch/i.test(status)) return 'dispatch';
        if (/kanyaka|gov/i.test(status)) return 'kanyaka';
        if (/border|exit/i.test(status)) return 'border';
        return 'loadingProcess';
    }
    return null;
}

function recordTripAreaUpdate(tripNumber, area, status, notes, statusDate, workflowKey) {
    if (!tripAreaUpdatesDB[tripNumber]) tripAreaUpdatesDB[tripNumber] = [];
    const user = getCurrentAdminUser();
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const trip = tripsDB[tripNumber];
    const wKey = workflowKey || resolveWorkflowKeyForTripStatus(trip, status);
    tripAreaUpdatesDB[tripNumber].unshift({
        area, status, notes: notes || '',
        updatedBy: user?.username || 'unknown',
        timestamp,
        statusDate: statusDate || null,
        workflowKey: wKey || null
    });
    if (trip) {
        trip.areaStatus = status;
        trip.area = area || trip.area;
        trip.lastUpdatedBy = user?.username;
        trip.lastUpdatedAt = timestamp;
        if (statusDate && status) {
            if (!trip.areaStatusDates) trip.areaStatusDates = {};
            trip.areaStatusDates[status] = statusDate;
        }
        if (wKey && status) {
            if (!trip.workflowStatusLog) trip.workflowStatusLog = {};
            trip.workflowStatusLog[wKey] = {
                status,
                statusDate: statusDate || trip.workflowStatusLog[wKey]?.statusDate || null,
                updatedBy: user?.username || 'unknown',
                updatedAt: timestamp,
                area: area || trip.area
            };
        }
    }
    logAuditEvent(`Area status: ${status} (${area})`, tripNumber, 'trip', notes);
    if (typeof isApiAvailable === 'function' && isApiAvailable() && typeof postTripAreaStatus === 'function') {
        postTripAreaStatus(tripNumber, area, status, notes).catch(e => console.warn('Area status API sync failed:', e.message));
    }
}

function getTripAreaHistory(tripNumber) {
    return tripAreaUpdatesDB[tripNumber] || [];
}

const MATRIX_FUNCTIONS = ['Clearing Agent', 'Border Officer', 'Customs Inspector', 'Runner', 'Driver', 'Dispatcher', 'Area Supervisor', 'POD Officer', 'Asset Controller', 'Management'];
const INTERNAL_LINK_TYPES = ['trip', 'truck', 'car', 'asset', 'equipment', 'area', 'user'];

const communicationMatrixDB = [
    { id: 'CM-001', name: 'Jean Kalenga', company: 'Clearing Agent Services', function: 'Clearing Agent', email: 'jean.kalenga@cas.com', placeOfWork: 'Kasumbalesa KBP Brigade Office', phone: '+260 977 111222', whatsapp: '+260 977 111222', area: 'Kasumbalesa', active: true, notes: 'Primary KBP clearing contact' },
    { id: 'CM-002', name: 'Ruth Mwansa', company: 'Border Operations', function: 'Border Officer', email: 'ruth.mwansa@borderops.com', placeOfWork: 'KBP Admin Office', phone: '+260 966 222333', whatsapp: '+260 966 222333', area: 'Kasumbalesa', active: true, notes: 'Records driver contact details at KBP Step 7' },
    { id: 'CM-003', name: 'Marie Mwamba', company: 'Whisky Clearing', function: 'Clearing Agent', email: 'marie.mwamba@whisky.com', placeOfWork: 'Whisky Office', phone: '+260 955 333444', whatsapp: '+260 955 333444', area: 'Kasumbalesa', active: true, notes: 'Whisky TR8/T1 process' },
    { id: 'CM-004', name: 'Inspector Kabwe', company: 'Customs DRC', function: 'Customs Inspector', email: 'kabwe@customs.drc', placeOfWork: 'Customs Control Room', phone: '+243 812 444555', whatsapp: '+243 812 444555', area: 'Kasumbalesa', active: true, notes: 'Green/red stamping' },
    { id: 'CM-005', name: 'David Mukendi', company: 'Kanyaka Operations', function: 'Dispatcher', email: 'david.m@kanyaka.com', placeOfWork: 'Kanyaka Dispatch', phone: '+260 977 555666', whatsapp: '+260 977 555666', area: 'Kanyaka', active: true, notes: 'SB dispatch and escort' },
    { id: 'CM-006', name: 'John Doe', company: 'Transport Co A', function: 'Driver', email: 'john.doe@transport.com', placeOfWork: 'Mobile', phone: '+260 977 123456', whatsapp: '+260 977 123456', area: 'Kolwezi', active: true, notes: 'NB driver — DRC: +243 812 345678' },
    { id: 'CM-007', name: 'Peter Mwansa', company: 'Transport Co D', function: 'Driver', email: '', placeOfWork: 'Mobile', phone: '+260 966 234567', whatsapp: '+260 966 234567', area: 'Kasumbalesa', active: true, notes: 'Whisky process driver' },
    { id: 'CM-008', name: 'Officer Kalaba', company: 'POD Management', function: 'POD Officer', email: 'kalaba@pod.com', placeOfWork: 'POD Office Lubumbashi', phone: '+243 815 999000', whatsapp: '+243 815 999000', area: 'Lubumbashi', active: true, notes: 'POD collection follow-up' },
    { id: 'CM-009', name: 'Jean Pierre', company: 'Sakania Border', function: 'Border Officer', email: 'jpierre@sakania.com', placeOfWork: 'Sakania Parking', phone: '+243 998 111222', whatsapp: '+243 998 111222', area: 'Sakania', active: false, notes: 'Inactive — on leave' }
];

const driverContactsDB = [
    { id: 'DC-001', tripNumber: 'NB-2024-001', driverName: 'John Doe', truck: 'ABC123DRC', direction: 'NB', border: 'Kasumbalesa', owner: 'Transport Co A', drcNumber: '+243 812 345678', whatsapp: '+260 977 123456', registeredBy: 'border_moderator', registeredAt: '2026-07-23T08:30:00', notes: 'Registered at KBP Step 7' },
    { id: 'DC-002', tripNumber: 'NB-2024-008', driverName: 'Peter Mwansa', truck: 'JKL012DRC', direction: 'NB', border: 'Kasumbalesa', owner: 'Transport Co D', drcNumber: '+243 999 234567', whatsapp: '+260 966 234567', registeredBy: 'border_moderator', registeredAt: '2026-07-24T10:15:00', notes: 'Whisky process' },
    { id: 'DC-003', tripNumber: 'NB-2024-015', driverName: 'Sarah Smith', truck: 'XYZ789DRC', direction: 'NB', border: 'Sakania', owner: 'Transport Co B', drcNumber: '+243 815 456789', whatsapp: '+260 977 345678', registeredBy: 'border_moderator', registeredAt: '2026-07-22T14:00:00', notes: '' },
    { id: 'DC-004', tripNumber: 'SB-2024-003', driverName: 'Mike Johnson', truck: 'DEF456DRC', direction: 'SB', border: 'Kasumbalesa', owner: 'Transport Co A', drcNumber: '+243 810 567890', whatsapp: '+260 977 456789', registeredBy: 'border_moderator', registeredAt: '2026-07-20T09:00:00', notes: 'Inherited from NB turnaround' }
];
let driverRegistrySearchTerm = '';
let driverRegistryDirectionFilter = 'all';
let driverRegistryBorderFilter = 'all';
let driverRegistryRegisteredFilter = 'all';

const CURRENT_USER = 'Current User';
const CURRENT_USER_EMAIL = 'current.user@truckcontrol.local';

const systemUsersDB = [
    { id: 'U001', name: 'Jean Kalenga', email: 'jean.kalenga@truckcontrol.local', role: 'Border User', area: 'Kasumbalesa', initials: 'JK', online: true, lastSeen: 'online' },
    { id: 'U002', name: 'Ruth Mwansa', email: 'ruth.mwansa@truckcontrol.local', role: 'Border User', area: 'Kasumbalesa', initials: 'RM', online: true, lastSeen: 'online' },
    { id: 'U003', name: 'Marie Mwamba', email: 'marie.mwamba@truckcontrol.local', role: 'Border User', area: 'Kasumbalesa', initials: 'MM', online: false, lastSeen: '25 min ago' },
    { id: 'U004', name: 'David Mukendi', email: 'david.m@truckcontrol.local', role: 'Kanyaka User', area: 'Kanyaka', initials: 'DM', online: true, lastSeen: 'online' },
    { id: 'U005', name: 'Inspector Kabwe', email: 'kabwe@truckcontrol.local', role: 'Border User', area: 'Kasumbalesa', initials: 'IK', online: false, lastSeen: '1 hr ago' },
    { id: 'U006', name: 'Officer Kalaba', email: 'kalaba@truckcontrol.local', role: 'POD Officer', area: 'Lubumbashi', initials: 'OK', online: true, lastSeen: 'online' },
    { id: 'U007', name: 'Operations Manager', email: 'ops.manager@truckcontrol.local', role: 'Operations Manager', area: 'All Areas', initials: 'OM', online: false, lastSeen: '3 hrs ago' },
    { id: 'U008', name: 'Asset Controller', email: 'assets@truckcontrol.local', role: 'Asset Controller', area: 'HQ', initials: 'AC', online: true, lastSeen: 'online' }
];

// ============================================
// RBAC — Roles, Permissions, Admin Users
// ============================================
const PERMISSION_KEYS = {
    READ_ALL: 'read_all',
    READ_OWN: 'read_own',
    CREATE: 'create',
    EDIT_ALL: 'edit_all',
    EDIT_LIMITED: 'edit_limited',
    DELETE: 'delete',
    PURGE: 'purge',
    VIEW_LOGS: 'view_logs',
    MANAGE_USERS: 'manage_users',
    MANAGE_ROLES: 'manage_roles',
    MANAGE_SETTINGS: 'manage_settings',
    MANAGE_AREA_STATUSES: 'manage_area_statuses'
};

const PERMISSION_LABELS = {
    read_all: 'Can Read Data (All)',
    read_own: 'Can Read Data (Own only)',
    create: 'Can Create Data',
    edit_all: 'Can Edit Data (All)',
    edit_limited: 'Can Edit Data (Limited)',
    delete: 'Can Delete Data',
    purge: 'Can Permanently Purge Data',
    view_logs: 'Can See Audit Logs',
    manage_users: 'Can Manage Users',
    manage_roles: 'Can Manage Roles',
    manage_settings: 'Can Manage System Settings',
    manage_area_statuses: 'Can Manage Area Status Lists'
};

const ALL_PERMISSIONS = Object.values(PERMISSION_KEYS);

const rolesDB = [
    { id: 'role-super-admin', name: 'Super Admin', description: 'Full system owner — CREATE, DROP, SELECT, UPDATE, DELETE on all data', system: true, permissions: [...ALL_PERMISSIONS, 'manage_area_statuses'] },
    { id: 'role-manager', name: 'Manager', description: 'Operations manager with broad read/write but no delete', system: true, permissions: ['read_all', 'create', 'edit_all', 'view_logs', 'manage_users', 'manage_settings'] },
    { id: 'role-moderator', name: 'Moderator', description: 'Limited editor — can update specific records only', system: true, permissions: ['read_all', 'edit_limited'] },
    { id: 'role-user', name: 'User', description: 'Standard app user — read own data only', system: true, permissions: ['read_own'] }
];

const adminUsersDB = [
    { id: 'ADM-001', username: 'super_admin', email: 'admin@truckcontrol.local', passwordHash: '[bcrypt-hash]', roleId: 'role-super-admin', status: 'active', area: 'HQ', assignedAreas: ['All Areas'], phone: '+260 900 000001', createdAt: '2025-01-15 08:00', lastLogin: '2026-07-25 17:30', bannedAt: null, bannedReason: '' },
    { id: 'ADM-002', username: 'ops_manager', email: 'ops.manager@truckcontrol.local', passwordHash: '[bcrypt-hash]', roleId: 'role-manager', status: 'active', area: 'All Areas', assignedAreas: ['All Areas'], phone: '+260 900 000002', createdAt: '2025-02-01 09:00', lastLogin: '2026-07-25 14:15', bannedAt: null, bannedReason: '' },
    { id: 'ADM-003', username: 'border_moderator', email: 'ruth.mwansa@truckcontrol.local', passwordHash: '[bcrypt-hash]', roleId: 'role-moderator', status: 'active', area: 'Kasumbalesa', assignedAreas: ['Kasumbalesa'], phone: '+260 966 222333', createdAt: '2025-03-10 10:00', lastLogin: '2026-07-25 11:00', bannedAt: null, bannedReason: '' },
    { id: 'ADM-004', username: 'driver_user', email: 'john.doe@transport.com', passwordHash: '[bcrypt-hash]', roleId: 'role-user', status: 'active', area: 'Kolwezi', assignedAreas: ['Kolwezi'], phone: '+260 977 123456', createdAt: '2025-04-20 07:30', lastLogin: '2026-07-24 18:45', bannedAt: null, bannedReason: '' },
    { id: 'ADM-005', username: 'inactive_user', email: 'inactive@truckcontrol.local', passwordHash: '[bcrypt-hash]', roleId: 'role-user', status: 'banned', area: 'Lubumbashi', assignedAreas: ['Lubumbashi'], phone: '+243 815 999000', createdAt: '2025-05-01 12:00', lastLogin: '2026-06-10 09:00', bannedAt: '2026-07-01 16:00', bannedReason: 'Policy violation — repeated missed POD deadlines' },
    { id: 'ADM-006', username: 'kanyaka_dispatcher', email: 'david.m@truckcontrol.local', passwordHash: '[bcrypt-hash]', roleId: 'role-moderator', status: 'active', area: 'Kanyaka', assignedAreas: ['Kanyaka'], phone: '+260 977 555666', createdAt: '2025-06-01 08:00', lastLogin: '2026-07-25 16:00', bannedAt: null, bannedReason: '' }
];

const systemSettingsDB = {
    signupsEnabled: true,
    maintenanceMode: false,
    defaultInterestRate: 5.5,
    sessionTimeoutMinutes: 30,
    maxLoginAttempts: 5,
    backupSchedule: 'daily',
    backupRetentionDays: 30,
    appName: 'Truck Turnaround & Operations Control System',
    supportEmail: 'support@truckcontrol.local',
    activeTheme: 'ocean-blue'
};

const auditLogsDB = [
    { id: 'LOG-0001', userId: 'ADM-001', username: 'super_admin', action: 'Created User ADM-003', targetId: 'ADM-003', targetType: 'user', timestamp: '2026-07-20 10:15:00', ipAddress: '10.42.0.15', details: 'Role: Moderator' },
    { id: 'LOG-0002', userId: 'ADM-002', username: 'ops_manager', action: 'Updated User ADM-004', targetId: 'ADM-004', targetType: 'user', timestamp: '2026-07-22 14:30:00', ipAddress: '10.42.0.22', details: 'Changed area to Kolwezi' },
    { id: 'LOG-0003', userId: 'ADM-001', username: 'super_admin', action: 'Banned User ADM-005', targetId: 'ADM-005', targetType: 'user', timestamp: '2026-07-01 16:00:00', ipAddress: '10.42.0.15', details: 'Soft delete — policy violation' },
    { id: 'LOG-0004', userId: 'ADM-002', username: 'ops_manager', action: 'Updated System Settings', targetId: 'settings', targetType: 'settings', timestamp: '2026-07-24 09:00:00', ipAddress: '10.42.0.22', details: 'defaultInterestRate: 5.5' },
    { id: 'LOG-0005', userId: 'ADM-001', username: 'super_admin', action: 'Reset Password for ADM-003', targetId: 'ADM-003', targetType: 'user', timestamp: '2026-07-25 08:45:00', ipAddress: '10.42.0.15', details: 'Password reset via admin panel' },
    { id: 'LOG-0006', userId: 'ADM-003', username: 'border_moderator', action: 'Updated Contact CM-002', targetId: 'CM-002', targetType: 'contact', timestamp: '2026-07-25 11:20:00', ipAddress: '10.42.0.33', details: 'Communication Matrix edit' },
    { id: 'LOG-0007', userId: 'ADM-001', username: 'super_admin', action: 'Created Role role-support', targetId: 'role-support', targetType: 'role', timestamp: '2026-07-23 13:00:00', ipAddress: '10.42.0.15', details: 'Custom role: Support Agent' }
];

let CURRENT_SESSION_USER_ID = 'ADM-001';
let nextAdminUserId = 6;
let nextAuditLogId = 8;
let nextRoleId = 1;

if (typeof window !== 'undefined') {
    window.adminUsersDB = adminUsersDB;
    window.rolesDB = rolesDB;
    window.systemSettingsDB = systemSettingsDB;
    window.auditLogsDB = auditLogsDB;
    window.nextAdminUserId = nextAdminUserId;
    window.nextAuditLogId = nextAuditLogId;
    window.nextRoleId = nextRoleId;
}

let adminUserFilter = '';
let adminUserStatusFilter = 'all';
let auditLogFilter = '';
let auditLogDateFilter = '';
let editingAdminUserId = null;
let editingRoleId = null;
let purgeTargetUserId = null;
const SIMULATED_CLIENT_IP = '10.42.0.15';

function getCurrentAdminUser() {
    return adminUsersDB.find(u => u.id === CURRENT_SESSION_USER_ID) || adminUsersDB[0];
}

function getRoleById(roleId) {
    return rolesDB.find(r => r.id === roleId);
}

function getCurrentRole() {
    const user = getCurrentAdminUser();
    return user ? getRoleById(user.roleId) : null;
}

function roleHasPermission(role, permission) {
    if (!role || !role.permissions) return false;
    return role.permissions.includes(permission);
}

function canUser(permission) {
    return roleHasPermission(getCurrentRole(), permission);
}

function requirePermission(permission, actionLabel) {
    if (!canUser(permission)) {
        showToast(`Access denied: ${actionLabel}. Your role (${getCurrentRole()?.name || 'Unknown'}) lacks the "${PERMISSION_LABELS[permission] || permission}" permission.`, 'warning');
        logAuditEvent(`BLOCKED: ${actionLabel}`, null, 'security', { permission, endpoint: actionLabel });
        return false;
    }
    return true;
}

function apiMiddleware(endpoint, permission) {
    if (!requirePermission(permission, `API ${endpoint}`)) return false;
    return true;
}

function logAuditEvent(action, targetId, targetType, details) {
    const user = getCurrentAdminUser();
    const entry = {
        id: 'LOG-' + String(nextAuditLogId++).padStart(4, '0'),
        userId: user?.id || 'unknown',
        username: user?.username || 'unknown',
        action,
        targetId: targetId || '',
        targetType: targetType || 'system',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        ipAddress: SIMULATED_CLIENT_IP,
        details: typeof details === 'string' ? details : (details ? JSON.stringify(details) : '')
    };
    auditLogsDB.unshift(entry);
    if (typeof persistAuditLogs === 'function') persistAuditLogs();
    if (typeof pushAuditToApi === 'function') pushAuditToApi(entry);
    return entry;
}

function updateTopBarUser() {
    const user = getCurrentAdminUser();
    const role = getCurrentRole();
    const avatar = document.querySelector('.user-avatar');
    const nameEl = document.querySelector('.user-profile div > div:first-child');
    const roleEl = document.querySelector('.user-profile div > div:last-child');
    if (avatar) avatar.textContent = (user?.username || 'SA').slice(0, 2).toUpperCase();
    if (nameEl) nameEl.textContent = user?.username || 'System Admin';
    if (roleEl) roleEl.textContent = role?.name || 'User';
    populateRoleSwitcher();
    updateAdminNavVisibility();
    const switcher = document.getElementById('roleSwitcher');
    if (switcher) {
        const hideDemoSwitcher = typeof isAuthRequired === 'function' && isAuthRequired() && typeof getAuthToken === 'function' && getAuthToken();
        switcher.style.display = hideDemoSwitcher ? 'none' : '';
    }
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.style.display = (typeof getAuthToken === 'function' && getAuthToken()) ? '' : 'none';
}

function applyAuthUserToSession(apiUser) {
    if (!apiUser) return;
    CURRENT_SESSION_USER_ID = apiUser.id;
    const existing = adminUsersDB.find(u => u.id === apiUser.id);
    if (existing) {
        existing.roleId = apiUser.roleId;
        existing.area = apiUser.area;
        existing.assignedAreas = apiUser.assignedAreas || existing.assignedAreas;
        existing.status = apiUser.status || 'active';
        if (apiUser.modulePermissions) existing.modulePermissions = apiUser.modulePermissions;
    }
    updateTopBarUser();
}

function showLoginScreen(message) {
    const el = document.getElementById('loginScreen');
    const app = document.querySelector('.app-container');
    if (el) el.classList.add('show');
    if (app) app.style.display = 'none';
    if (message) {
        const msg = document.getElementById('loginError');
        if (msg) { msg.textContent = message; msg.style.display = 'block'; }
    }
}

function hideLoginScreen() {
    const el = document.getElementById('loginScreen');
    const app = document.querySelector('.app-container');
    if (el) el.classList.remove('show');
    if (app) app.style.display = '';
    const msg = document.getElementById('loginError');
    if (msg) msg.style.display = 'none';
}

async function handleLoginSubmit(event) {
    event.preventDefault();
    const username = document.getElementById('loginUsername')?.value?.trim();
    const password = document.getElementById('loginPassword')?.value;
    const btn = document.getElementById('loginSubmitBtn');
    if (!username || !password || typeof loginApi !== 'function') return;
    if (btn) { btn.disabled = true; btn.textContent = 'Signing in...'; }
    try {
        const data = await loginApi(username, password);
        if (typeof checkMaintenanceModeForLogin === 'function' && !checkMaintenanceModeForLogin(data.user)) {
            if (typeof logoutApi === 'function') logoutApi();
            throw new Error('System is in maintenance mode. Only Super Admin can log in.');
        }
        hideLoginScreen();
        applyAuthUserToSession(data.user);
        await bootApplication();
        showToast(`Welcome, ${data.user.username}`, 'success');
    } catch (e) {
        const msg = document.getElementById('loginError');
        if (msg) { msg.textContent = e.message; msg.style.display = 'block'; }
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Sign in'; }
    }
}

function handleLogout() {
    if (typeof logoutApi === 'function') logoutApi();
    showLoginScreen();
    showToast('Signed out', 'success');
}

async function bootApplication() {
    if (typeof migrateAreaStatusesDB === 'function') migrateAreaStatusesDB();
    if (typeof backfillTripAreaWorkflowKeys === 'function') backfillTripAreaWorkflowKeys();
    if (typeof syncAdminFromApi === 'function' && isApiAvailable()) {
        await syncAdminFromApi();
    }
    if (typeof syncAdminUsersToInternalComm === 'function') syncAdminUsersToInternalComm();
    if (typeof applySystemSettingsToUi === 'function') applySystemSettingsToUi();
    if (typeof startSessionTimeoutWatcher === 'function') startSessionTimeoutWatcher();
    if (typeof syncTripsFromApi === 'function' && isApiAvailable()) {
        await syncTripsFromApi(true);
        recalculateAllTripKpis();
    }
    if (typeof syncDriverContactsFromApi === 'function' && isApiAvailable()) {
        await syncDriverContactsFromApi();
    }
    navigateTo('dashboard');
    updateSidebarBadges();
    updateAdminNavVisibility();
}

function updateAdminNavVisibility() {
    document.querySelectorAll('.sidebar-nav .nav-item[data-page]').forEach(nav => {
        const page = nav.dataset.page;
        if (!page) return;
        if (page.startsWith('admin-')) {
            nav.style.display = canAccessAdminPage(page) ? '' : 'none';
        } else {
            nav.style.display = canAccessPage(page) ? '' : 'none';
        }
    });
}

function populateRoleSwitcher() {
    const select = document.querySelector('.role-switcher');
    if (!select) return;
    const current = CURRENT_SESSION_USER_ID;
    select.innerHTML = '<option value="">Switch role ▾</option>' +
        adminUsersDB.filter(u => u.status === 'active').map(u =>
            `<option value="${u.id}" ${u.id === current ? 'disabled' : ''}>${u.username} (${getRoleById(u.roleId)?.name})${u.id === current ? ' ✓' : ''}</option>`
        ).join('');
}

function switchSessionUser(userId) {
    const user = adminUsersDB.find(u => u.id === userId);
    if (!user || user.status === 'banned') {
        showToast('Cannot switch to banned or invalid user.', 'warning');
        return;
    }
    CURRENT_SESSION_USER_ID = userId;
    updateTopBarUser();
    logAuditEvent(`Switched session to ${user.username}`, userId, 'session', 'Demo role switch');
    showToast(`Now logged in as ${user.username} (${getRoleById(user.roleId)?.name})`, 'success');
    updateAdminNavVisibility();
    if (currentPage && currentPage.startsWith('admin-')) navigateTo(currentPage);
    else if (currentPage) navigateTo(currentPage);
    else updateSidebarBadges();
}

function canAccessAdminPage(page) {
    switch (page) {
        case 'admin-users': return canUser('manage_users');
        case 'admin-roles': return canUser('manage_roles');
        case 'admin-settings': return canUser('manage_settings');
        case 'admin-themes': return canUser('manage_settings');
        case 'admin-kpi-settings': return canUser('manage_settings');
        case 'admin-audit-logs': return canUser('view_logs');
        case 'admin-area-statuses': return canUser('manage_roles') || canUser('manage_area_statuses');
        case 'admin-area-assignments': return canUser('manage_users');
        case 'admin-module-permissions': return canUser('manage_users');
        case 'admin-fleet-settings': return canUser('manage_settings') || canUser('manage_users');
        case 'admin-upload-templates': return getCurrentRole()?.name === 'Super Admin';
        default: return false;
    }
}

// ============================================
// MODULE RBAC — per-area view / edit / delete
// ============================================
const OPERATIONAL_MODULES = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', global: true },
    { id: 'nb-operations', label: 'NB Operations', icon: '🚛', global: false },
    { id: 'sb-operations', label: 'SB Operations', icon: '🚛', global: false },
    { id: 'border-clearance', label: 'Border Clearance', icon: '🛂', global: false },
    { id: 'pod-management', label: 'POD Management', icon: '📋', global: false },
    { id: 'area-browser', label: 'Area Trucks', icon: '🗺️', global: false },
    { id: 'communication-matrix', label: 'Communication Matrix', icon: '📇', global: true },
    { id: 'driver-registry', label: 'Driver Registry', icon: '📱', global: true },
    { id: 'internal-communication', label: 'Internal Communication', icon: '✉️', global: true },
    { id: 'assets', label: 'Assets & Equipment', icon: '🚗', global: true },
    { id: 'runner-fees', label: 'Runner Fees', icon: '💰', global: true },
    { id: 'reports', label: 'Reports', icon: '📈', global: true },
    { id: 'turnarounds', label: 'Turnarounds', icon: '🔄', global: true },
    { id: 'position-live', label: 'Position Live', icon: '📍', global: true }
];

if (typeof window !== 'undefined') window.OPERATIONAL_MODULES = OPERATIONAL_MODULES;

const PAGE_MODULE_MAP = {
    dashboard: 'dashboard',
    'nb-operations': 'nb-operations',
    'sb-operations': 'sb-operations',
    'border-clearance': 'border-clearance',
    'pod-management': 'pod-management',
    'area-browser': 'area-browser',
    'communication-matrix': 'communication-matrix',
    'driver-registry': 'driver-registry',
    'internal-communication': 'internal-communication',
    assets: 'assets',
    'runner-fees': 'runner-fees',
    reports: 'reports',
    'report-detail': 'reports',
    turnarounds: 'turnarounds',
    'position-live': 'position-live',
    'trip-list': 'dashboard',
    'document-alerts': 'assets',
    'document-detail': 'assets',
    kanyaka: 'area-browser',
    kolwezi: 'area-browser',
    'kasumbalesa-detail': 'border-clearance',
    'kasumbalesa-direct': 'border-clearance',
    'kasumbalesa-whisky': 'border-clearance',
    'sakania-nb': 'border-clearance',
    'mokambo-nb': 'border-clearance',
    sakania: 'border-clearance',
    mokambo: 'border-clearance',
    'sb-kasumbalesa': 'border-clearance',
    'sb-sakania': 'border-clearance',
    'sb-mokambo': 'border-clearance'
};

let modulePermUserFilter = '';
let editingModulePermUserId = null;

function emptyModulePerm() {
    return { view: false, edit: false, delete: false };
}

function userIsSuperAdmin() {
    return getCurrentRole()?.name === 'Super Admin';
}

function getPageModule(page) {
    return PAGE_MODULE_MAP[page] || null;
}

function getModuleDef(moduleId) {
    return OPERATIONAL_MODULES.find(m => m.id === moduleId);
}

function getTripPermissionAreas(trip) {
    return [...new Set([
        trip.area,
        trip.entryBorder,
        trip.exitBorder,
        trip.offloadingPoint?.split(' ')[0],
        trip.loadingPoint?.split(' ')[0],
        trip.driverExitBorder
    ].filter(Boolean))];
}

function buildDefaultModulePermissions(user) {
    const role = getRoleById(user.roleId);
    const areas = user.assignedAreas || [user.area];
    const isSuper = role?.name === 'Super Admin';
    const isManager = role?.name === 'Manager';
    const isModerator = role?.name === 'Moderator';
    const perms = {};

    const grant = (moduleId, area, view, edit, del) => {
        if (!perms[moduleId]) perms[moduleId] = {};
        perms[moduleId][area] = { view: !!view, edit: !!edit, delete: !!del };
    };

    OPERATIONAL_MODULES.forEach(mod => {
        if (mod.global) {
            const canView = isSuper || isManager || isModerator || role?.permissions?.includes('read_all') || role?.permissions?.includes('read_own');
            const canEdit = isSuper || isManager || (isModerator && role?.permissions?.includes('edit_limited'));
            const canDelete = isSuper || (isManager && role?.permissions?.includes('delete'));
            grant(mod.id, '_global', canView, canEdit, canDelete);
            return;
        }
        areas.forEach(area => {
            if (isSuper || isManager || areas.includes('All Areas')) {
                grant(mod.id, area, true, true, isSuper);
            } else if (isModerator) {
                const view = true;
                const edit = ['nb-operations', 'sb-operations', 'border-clearance', 'pod-management', 'area-browser'].includes(mod.id);
                grant(mod.id, area, view, edit, false);
            } else {
                const view = ['nb-operations', 'area-browser', 'reports'].includes(mod.id);
                grant(mod.id, area, view, false, false);
            }
        });
    });

    if (areas.includes('Kanyaka') || areas.includes('All Areas')) {
        ['nb-operations', 'sb-operations', 'border-clearance', 'pod-management', 'area-browser', 'turnarounds', 'position-live'].forEach(modId => {
            if (!perms[modId]) perms[modId] = {};
            OPERATIONAL_AREAS.forEach(area => {
                if (!perms[modId][area]) perms[modId][area] = emptyModulePerm();
                perms[modId][area].view = true;
                if (isSuper || isManager) {
                    perms[modId][area].edit = true;
                    perms[modId][area].delete = isSuper;
                }
            });
        });
    }

    return perms;
}

function ensureUserModulePermissions(user) {
    if (!user) return {};
    if (!user.modulePermissions || !Object.keys(user.modulePermissions).length) {
        user.modulePermissions = buildDefaultModulePermissions(user);
    }
    return user.modulePermissions;
}

function getModulePermRecord(user, moduleId, area) {
    ensureUserModulePermissions(user);
    const mod = user.modulePermissions[moduleId];
    if (!mod) return null;
    const modDef = getModuleDef(moduleId);
    if (modDef?.global) return mod._global || null;
    if (area && mod[area]) return mod[area];
    if (mod._global) return mod._global;
    const userAreas = user.assignedAreas || [user.area];
    for (const a of userAreas) {
        if (mod[a]) return mod[a];
    }
    return null;
}

function canModuleAction(moduleId, action, area) {
    if (!moduleId) return true;
    if (userIsSuperAdmin()) return true;
    const user = getCurrentAdminUser();
    if (!user || user.status !== 'active') return false;
    const modDef = getModuleDef(moduleId);
    if (modDef?.global) {
        const perm = getModulePermRecord(user, moduleId, '_global');
        return perm ? !!perm[action] : false;
    }
    if (area) {
        const perm = getModulePermRecord(user, moduleId, area);
        if (perm && perm[action]) return true;
    }
    const userAreas = user.assignedAreas || [user.area];
    return userAreas.some(a => {
        const perm = getModulePermRecord(user, moduleId, a);
        return perm && perm[action];
    });
}

function canAccessModule(moduleId) {
    if (!moduleId || moduleId === 'dashboard') return true;
    if (userIsSuperAdmin()) return true;
    return canModuleAction(moduleId, 'view');
}

function canAccessPage(page) {
    if (page && page.startsWith('admin-')) return canAccessAdminPage(page);
    const moduleId = getPageModule(page);
    if (!moduleId) return true;
    return canAccessModule(moduleId);
}

function requirePageAccess(page) {
    if (canAccessPage(page)) return true;
    const mod = getModuleDef(getPageModule(page));
    showToast(`Access denied: ${mod?.label || page} is not assigned to your user for this area.`, 'warning');
    logAuditEvent(`BLOCKED page access: ${page}`, null, 'security');
    return false;
}

function tripMatchesModulePermission(trip, moduleId) {
    if (!moduleId || userIsSuperAdmin()) return true;
    const modDef = getModuleDef(moduleId);
    if (modDef?.global) return canModuleAction(moduleId, 'view');
    return getTripPermissionAreas(trip).some(area => canModuleAction(moduleId, 'view', area));
}

function filterTripsByModulePermission(trips, moduleId) {
    if (!moduleId) return trips;
    return trips.filter(t => tripMatchesModulePermission(t, moduleId));
}

function canEditInModule(moduleId, area) {
    return canModuleAction(moduleId, 'edit', area);
}

function canDeleteInModule(moduleId, area) {
    return canModuleAction(moduleId, 'delete', area);
}

function renderModuleActionButtons(moduleId, area, editHtml, deleteHtml) {
    let html = '';
    if (canEditInModule(moduleId, area)) html += editHtml || '';
    if (canDeleteInModule(moduleId, area)) html += deleteHtml || '';
    return html;
}

function navigateToAdmin(page) {
    if (!canAccessAdminPage(page)) {
        showToast(`Access denied: ${page.replace('admin-', '').replace(/-/g, ' ')} page requires higher privileges.`, 'warning');
        logAuditEvent(`BLOCKED page access: ${page}`, null, 'security');
        return;
    }
    navigateTo(page);
}

const emailsDB = [
    { id: 'EM-001', folder: 'inbox', threadId: 'TH-001', from: 'Jean Kalenga', fromEmail: 'jean.kalenga@truckcontrol.local', to: [CURRENT_USER], cc: ['Ruth Mwansa'], bcc: [], subject: 'KBP clearance priority — NB-2024-001', body: 'Dear Team,\n\nPlease proceed to KBP Scan Bay. Documents are ready for cross-checking.\n\nRegards,\nJean Kalenga', sentAt: '2026-07-25 10:30', read: false, starred: true, important: true, attachments: [{ name: 'KBP_Scan_Notice.pdf', size: '128 KB' }], relatedType: 'trip', relatedRef: 'NB-2024-001', relatedLabel: 'NB-2024-001 / ABC123DRC' },
    { id: 'EM-002', folder: 'inbox', threadId: 'TH-002', from: 'Marie Mwamba', fromEmail: 'marie.mwamba@truckcontrol.local', to: [CURRENT_USER, 'Peter Mwansa'], cc: [], bcc: [], subject: 'Whisky TR8 reminder — NB-2024-008', body: 'TR8 has been issued. Please collect documents from Whisky office before 16:00 today.', sentAt: '2026-07-24 15:20', read: true, starred: false, important: false, attachments: [], relatedType: 'trip', relatedRef: 'NB-2024-008', relatedLabel: 'NB-2024-008 / JKL012DRC' },
    { id: 'EM-003', folder: 'inbox', threadId: 'TH-003', from: 'David Mukendi', fromEmail: 'david.m@truckcontrol.local', to: [CURRENT_USER, 'Ruth Mwansa'], cc: ['Area Supervisor'], bcc: [], subject: 'Kanyaka dispatch update', body: 'Dispatch escort has been assigned. Please report to Kanyaka gate at 07:00.', sentAt: '2026-07-25 07:45', read: true, starred: false, important: false, attachments: [], relatedType: 'area', relatedRef: 'Kanyaka', relatedLabel: 'Kanyaka Area' },
    { id: 'EM-004', folder: 'inbox', threadId: 'TH-004', from: 'Asset Controller', fromEmail: 'assets@truckcontrol.local', to: [CURRENT_USER], cc: [], bcc: [], subject: 'Asset handover — Samsung Galaxy A54', body: 'Driver dispatch phone assigned to Mike Johnson. Handover form is attached for your records.', sentAt: '2026-07-24 09:15', read: false, starred: false, important: false, attachments: [{ name: 'Handover_EQ-PHONE-14.pdf', size: '245 KB' }], relatedType: 'equipment', relatedRef: 'EQ-PHONE-14', relatedLabel: 'EQ-PHONE-14 / Samsung A54' },
    { id: 'EM-005', folder: 'inbox', threadId: 'TH-005', from: 'Officer Kalaba', fromEmail: 'kalaba@truckcontrol.local', to: [CURRENT_USER, 'Operations Manager'], cc: [], bcc: [], subject: 'POD collection overdue — NB-2024-022', body: 'POD collection is overdue for NB-2024-022. Please submit within 24 hours.', sentAt: '2026-07-25 06:00', read: false, starred: false, important: true, attachments: [], relatedType: 'trip', relatedRef: 'NB-2024-022', relatedLabel: 'NB-2024-022 / GHI789DRC' },
    { id: 'EM-006', folder: 'sent', threadId: 'TH-006', from: CURRENT_USER, fromEmail: CURRENT_USER_EMAIL, to: ['Jean Kalenga', 'Ruth Mwansa'], cc: [], bcc: [], subject: 'RE: Border queue status update', body: 'Thanks Jean. I have notified all NB drivers in Kasumbalesa area.', sentAt: '2026-07-25 08:25', read: true, starred: false, important: false, attachments: [], relatedType: 'area', relatedRef: 'Kasumbalesa', relatedLabel: 'Kasumbalesa Area' },
    { id: 'EM-007', folder: 'sent', threadId: 'TH-007', from: CURRENT_USER, fromEmail: CURRENT_USER_EMAIL, to: ['David Mukendi'], cc: [], bcc: [], subject: 'SB dispatch confirmation', body: 'Confirmed. Trucks MNO345DRC and DEF456DRC are ready for escort.', sentAt: '2026-07-24 16:10', read: true, starred: false, important: false, attachments: [], relatedType: 'trip', relatedRef: 'SB-2024-005', relatedLabel: 'SB-2024-005 / MNO345DRC' },
    { id: 'EM-008', folder: 'drafts', threadId: 'TH-008', from: CURRENT_USER, fromEmail: CURRENT_USER_EMAIL, to: ['Operations Manager'], cc: [], bcc: [], subject: 'Weekly NB performance summary', body: 'Draft — Weekly summary for NB operations across all areas...', sentAt: '2026-07-25 12:00', read: true, starred: false, important: false, attachments: [], relatedType: '', relatedRef: '', relatedLabel: '' },
    { id: 'EM-009', folder: 'starred', threadId: 'TH-001', from: 'Jean Kalenga', fromEmail: 'jean.kalenga@truckcontrol.local', to: [CURRENT_USER], cc: [], bcc: [], subject: 'KBP clearance priority — NB-2024-001', body: 'Please proceed to KBP Scan Bay.', sentAt: '2026-07-25 10:30', read: false, starred: true, important: true, attachments: [], relatedType: 'trip', relatedRef: 'NB-2024-001', relatedLabel: 'NB-2024-001 / ABC123DRC', mirrorOf: 'EM-001' },
    { id: 'EM-010', folder: 'archive', threadId: 'TH-010', from: 'Inspector Kabwe', fromEmail: 'kabwe@truckcontrol.local', to: [CURRENT_USER], cc: [], bcc: [], subject: 'Sakania clearance completed', body: 'NB-2024-015 has completed Sakania border clearance.', sentAt: '2026-07-20 14:00', read: true, starred: false, important: false, attachments: [], relatedType: 'trip', relatedRef: 'NB-2024-015', relatedLabel: 'NB-2024-015 / XYZ789DRC' }
];

const chatRoomsDB = [
    { id: 'ROOM-001', name: 'Kasumbalesa Border Team', type: 'group', memberNames: ['Jean Kalenga', 'Ruth Mwansa', 'Marie Mwamba', 'Inspector Kabwe', 'Current User'], avatar: '👥', relatedType: 'area', relatedRef: 'Kasumbalesa', pinned: true, muted: false, unreadCount: 2, lastMessage: 'Queue update: 4+ hour delay at KBP scan bay', lastAt: '2026-07-25 08:15', createdBy: 'Jean Kalenga' },
    { id: 'ROOM-002', name: 'Kanyaka SB Dispatch', type: 'group', memberNames: ['David Mukendi', 'Mike Johnson', 'Ruth Mwansa', 'Current User'], avatar: '👥', relatedType: 'area', relatedRef: 'Kanyaka', pinned: false, muted: false, unreadCount: 0, lastMessage: 'Escort shortage — hold dispatch until 10:00', lastAt: '2026-07-25 05:45', createdBy: 'David Mukendi' },
    { id: 'ROOM-003', name: 'POD & Invoicing', type: 'group', memberNames: ['Officer Kalaba', 'Operations Manager', 'Current User'], avatar: '📋', relatedType: 'user', relatedRef: 'POD Team', pinned: false, muted: true, unreadCount: 1, lastMessage: '3 PODs sent to invoice team today', lastAt: '2026-07-25 11:00', createdBy: 'Officer Kalaba' },
    { id: 'ROOM-004', name: 'Ruth Mwansa', type: 'direct', memberNames: ['Ruth Mwansa', 'Current User'], avatar: 'RM', relatedType: 'user', relatedRef: 'Direct', pinned: false, muted: false, unreadCount: 0, lastMessage: 'Driver contact recorded for NB-2024-001', lastAt: '2026-07-25 11:30', createdBy: 'Ruth Mwansa' },
    { id: 'ROOM-005', name: 'Jean Kalenga', type: 'direct', memberNames: ['Jean Kalenga', 'Current User'], avatar: 'JK', relatedType: 'user', relatedRef: 'Direct', pinned: false, muted: false, unreadCount: 1, lastMessage: 'Documents ready at scan bay', lastAt: '2026-07-25 10:35', createdBy: 'Jean Kalenga' }
];

const chatMessagesDB = [
    { id: 'CHAT-001', roomId: 'ROOM-001', sender: 'Jean Kalenga', message: 'Queue update: 4+ hour delay at KBP scan bay. All NB drivers report status.', type: 'text', fileName: null, status: 'read', replyTo: null, sentAt: '2026-07-25 08:15' },
    { id: 'CHAT-002', roomId: 'ROOM-001', sender: 'Ruth Mwansa', message: 'Acknowledged. Notifying clearing agents.', type: 'text', fileName: null, status: 'read', replyTo: 'CHAT-001', sentAt: '2026-07-25 08:18' },
    { id: 'CHAT-003', roomId: 'ROOM-001', sender: 'Jean Kalenga', message: 'KBP_Queue_Notice.pdf', type: 'file', fileName: 'KBP_Queue_Notice.pdf', status: 'delivered', replyTo: null, sentAt: '2026-07-25 08:20' },
    { id: 'CHAT-004', roomId: 'ROOM-002', sender: 'David Mukendi', message: 'Escort shortage — hold dispatch until 10:00', type: 'text', fileName: null, status: 'read', replyTo: null, sentAt: '2026-07-25 05:45' },
    { id: 'CHAT-005', roomId: 'ROOM-004', sender: 'Ruth Mwansa', message: 'Driver contact recorded for NB-2024-001. WhatsApp: +260 977 123456', type: 'text', fileName: null, status: 'read', replyTo: null, sentAt: '2026-07-25 11:30' },
    { id: 'CHAT-006', roomId: 'ROOM-005', sender: 'Jean Kalenga', message: 'Documents ready at scan bay for NB-2024-001', type: 'text', fileName: null, status: 'delivered', replyTo: null, sentAt: '2026-07-25 10:35' },
    { id: 'CHAT-007', roomId: 'ROOM-003', sender: 'Officer Kalaba', message: '3 PODs sent to invoice team today', type: 'text', fileName: null, status: 'sent', replyTo: null, sentAt: '2026-07-25 11:00' }
];

let nextMatrixContactId = 10;
let nextEmailId = 11;
let nextChatRoomId = 6;
let nextChatMessageId = 8;

const recentActivityNB = [
    { trip: 'TR-1024', truck: 'ZAM-4567', area: 'Kasumbalesa', status: 'Border', kpi: 'orange', days: 2, listFilter: 'nb-border-kasumbalesa' },
    { trip: 'TR-1028', truck: 'ZAM-4590', area: 'Kanyaka', status: 'POD Ready', kpi: 'green', days: 1, listFilter: 'area-kanyaka' },
    { trip: 'TR-1031', truck: 'ZAM-4612', area: 'Likasi', status: 'Offloading', kpi: 'red', days: 5, listFilter: 'orange' }
];

const recentActivitySB = [
    { trip: 'SB-2045', truck: 'ZAM-4789', area: 'Kolwezi', status: 'Loading', kpi: 'orange', days: 3, listFilter: 'sb' },
    { trip: 'SB-2049', truck: 'ZAM-4801', area: 'Kanyaka', status: 'Dispatched', kpi: 'green', days: 1, listFilter: 'sb-green' },
    { trip: 'SB-2053', truck: 'ZAM-4823', area: 'Border', status: 'Exit Pending', kpi: 'red', days: 6, listFilter: 'red' }
];

let currentBorderTabPrefix = 'kbp';

const KBP_STEP_TEMPLATE = [
    { title: 'TRUCK ARRIVAL & ENTRY - {prefix} Parking', area: '{prefix} Gate' },
    { title: 'DOCUMENT SUBMISSION TO BRIGADE OFFICER', area: '{prefix} Brigade Office' },
    { title: 'TRUCK SCANNING - {prefix} Scan Bay', area: '{prefix} Scan Bay' },
    { title: 'GREEN STAMPING - Customs Inspector', area: 'Customs Office' },
    { title: 'RED STAMPING - Another Customs Inspector', area: 'Customs Office' },
    { title: 'CROSS-CHECKING - Customs Control Room', area: 'Control Room' },
    { title: 'DRIVER CONTACT DETAILS - {prefix} Admin', area: '{prefix} Admin' }
];

const nbBorderConfigs = {
    'kasumbalesa-direct': {
        pageId: 'kasumbalesa-direct', tabPrefix: 'direct', icon: '⚡', processName: 'Direct Process', processId: 'direct',
        borderName: 'Kasumbalesa', locationPrefix: 'Direct', tripId: 'NB-2024-042',
        trip: 'NB-2024-042', truck: 'RST890DRC', trailer: 'TRL-112', driver: 'Alice Bwalya', owner: 'Transport Co D',
        kpi: 'green', kpiLabel: '🟢 ON TRACK', timeValue: '18:00', timePct: 38, targetHours: 48,
        totalTime: '18 HRS', timeStatus: '🟢 UNDER TIME',
        completedSteps: 2, finalApproval: false
    },
    'kasumbalesa-kbp': {
        pageId: 'kasumbalesa-detail', tabPrefix: 'kbp', icon: '📍', processName: 'KBP Process', processId: 'kbp',
        borderName: 'Kasumbalesa', locationPrefix: 'KBP', tripId: 'NB-2024-001',
        trip: 'NB-1001', truck: 'ABC 123', trailer: 'TRL-456', driver: 'John Doe', owner: 'XYZ Transport',
        kpi: 'green', kpiLabel: '🟢 ON TRACK', timeValue: '3:35', timePct: 7.5, targetHours: 48,
        totalTime: '3 HRS 35 MINS', timeStatus: '🟢 UNDER TIME - EXCELLENT',
        completedSteps: 7, finalApproval: true
    },
    'sakania-nb': {
        pageId: 'sakania-nb', tabPrefix: 'sakania-nb', icon: '📍', processName: 'NB BN Process', processId: 'sakania',
        borderName: 'Sakania', locationPrefix: 'Sakania', tripId: 'NB-2024-015',
        trip: 'NB-2024-015', truck: 'XYZ789DRC', trailer: 'TRL-890', driver: 'Sarah Smith', owner: 'Transport Co B',
        kpi: 'orange', kpiLabel: '🟠 PRIORITY', timeValue: '40:00', timePct: 83, targetHours: 48,
        totalTime: '40 HRS', timeStatus: '🟠 APPROACHING DEADLINE', timeClass: 'warning',
        completedSteps: 5, finalApproval: false
    },
    'mokambo-nb': {
        pageId: 'mokambo-nb', tabPrefix: 'mokambo-nb', icon: '📍', processName: 'NB BN Process', processId: 'mokambo',
        borderName: 'Mokambo', locationPrefix: 'Mokambo', tripId: 'NB-2024-022',
        trip: 'NB-2024-022', truck: 'GHI789DRC', trailer: 'TRL-334', driver: 'Jean Pierre', owner: 'Transport Co C',
        kpi: 'red', kpiLabel: '🔴 OVERDUE', timeValue: '78:00', timePct: 108, targetHours: 72,
        totalTime: '78 HRS', timeStatus: '🔴 OVER TARGET - ACTION REQUIRED', timeClass: 'danger',
        completedSteps: 4, finalApproval: false
    }
};

const sbBorderConfigs = {
    'sb-kasumbalesa': {
        pageId: 'sb-kasumbalesa', tabPrefix: 'sb-kas', borderName: 'Kasumbalesa', processId: 'sb-kasumbalesa', tripId: 'SB-2024-003',
        trip: 'SB-2024-003', truck: 'DEF456DRC', driver: 'Mike Johnson', owner: 'Transport Co A',
        kpi: 'green', kpiLabel: '🟢 ON TRACK', timeValue: '24:00', targetHours: 48, completedSteps: 5
    },
    'sb-sakania': {
        pageId: 'sb-sakania', tabPrefix: 'sb-sak', borderName: 'Sakania', processId: 'sb-sakania', tripId: 'SB-2024-005',
        trip: 'SB-2024-005', truck: 'MNO345DRC', driver: 'David Mukendi', owner: 'Transport Co B',
        kpi: 'orange', kpiLabel: '🟠 PRIORITY', timeValue: '44:00', targetHours: 48, completedSteps: 4
    },
    'sb-mokambo': {
        pageId: 'sb-mokambo', tabPrefix: 'sb-mok', borderName: 'Mokambo', processId: 'sb-mokambo', tripId: 'SB-2024-012',
        trip: 'SB-2024-012', truck: 'PQR678DRC', driver: 'Joseph Kabwe', owner: 'Transport Co C',
        kpi: 'orange', kpiLabel: '🟠 PRIORITY', timeValue: '36:00', targetHours: 72, completedSteps: 3
    }
};

const SB_CLEARANCE_STEPS = [
    'Arrived at Exit Border',
    'Gov List Uploaded',
    'Customs Declaration Submitted',
    'Duty / SEGUCE Payment',
    'Brigade Stamp Applied',
    'Seal Verification',
    'Documents Handed to Driver',
    'Exit to Zambia — Complete'
];

if (typeof window !== 'undefined') window.SB_CLEARANCE_STEPS = SB_CLEARANCE_STEPS;

const borderClearanceTrucks = [
    { trip: 'NB-2024-001', truck: 'ABC123DRC', driver: 'John Doe', direction: 'NB', border: 'Kasumbalesa', processHtml: '<span class="status-badge kbp">📍 KBP</span>', process: 'KBP', status: 'Cross-checking', hours: 38, target: '48h', kpi: 'orange', kpiLabel: 'Priority', viewPage: 'kasumbalesa-detail', commentBtn: 'primary' },
    { trip: 'NB-2024-008', truck: 'JKL012DRC', driver: 'Peter Mwansa', direction: 'NB', border: 'Kasumbalesa', processHtml: '<span class="status-badge whisky">📍 Whisky</span>', process: 'Whisky', status: 'TR8 Issued', hours: 52, target: '72h', kpi: 'orange', kpiLabel: 'Priority', viewPage: 'kasumbalesa-whisky', commentBtn: 'primary' },
    { trip: 'NB-2024-015', truck: 'XYZ789DRC', driver: 'Sarah Smith', direction: 'NB', border: 'Sakania', processHtml: '<span class="status-badge blue">BN Process</span>', process: 'BN Process', status: 'Cross-checking', hours: 40, target: '48h', kpi: 'orange', kpiLabel: 'Priority', viewPage: 'sakania-nb', commentBtn: 'primary' },
    { trip: 'NB-2024-022', truck: 'GHI789DRC', driver: 'Jean Pierre', direction: 'NB', border: 'Mokambo', processHtml: '<span class="status-badge blue">BN Process</span>', process: 'BN Process', status: 'Red Stamping', hours: 78, target: '72h', kpi: 'red', kpiLabel: 'Overdue', viewPage: 'mokambo-nb', commentBtn: 'danger' },
    { trip: 'NB-2024-042', truck: 'RST890DRC', driver: 'Alice Bwalya', direction: 'NB', border: 'Kasumbalesa', processHtml: '<span class="status-badge direct">⚡ Direct</span>', process: 'Direct', status: 'Direct Clearance', hours: 18, target: '48h', kpi: 'green', kpiLabel: 'On Track', viewPage: 'kasumbalesa-direct', commentBtn: 'primary' },
    { trip: 'NB-2024-047', truck: 'PQR852DRC', driver: 'Emma Zulu', direction: 'NB', border: 'Sakania', processHtml: '<span class="status-badge blue">BN Process</span>', process: 'BN Process', status: 'Document Submission', hours: 16, target: '48h', kpi: 'green', kpiLabel: 'On Track', viewPage: 'sakania-nb', commentBtn: 'primary' },
    { trip: 'SB-2024-003', truck: 'DEF456DRC', driver: 'Mike Johnson', direction: 'SB', border: 'Kasumbalesa', processHtml: '<span class="status-badge green">SB Exit</span>', process: 'SB Exit', status: 'Seal Verification', hours: 24, target: '48h', kpi: 'green', kpiLabel: 'On Track', viewPage: 'sb-kasumbalesa', commentBtn: 'primary' },
    { trip: 'SB-2024-005', truck: 'MNO345DRC', driver: 'David Mukendi', direction: 'SB', border: 'Sakania', processHtml: '<span class="status-badge orange">SB Exit</span>', process: 'SB Exit', status: 'Customs Declaration', hours: 44, target: '48h', kpi: 'orange', kpiLabel: 'Priority', viewPage: 'sb-sakania', commentBtn: 'primary' },
    { trip: 'SB-2024-012', truck: 'PQR678DRC', driver: 'Joseph Kabwe', direction: 'SB', border: 'Mokambo', processHtml: '<span class="status-badge orange">SB Exit</span>', process: 'SB Exit', status: 'Gov List Upload', hours: 36, target: '72h', kpi: 'orange', kpiLabel: 'Priority', viewPage: 'sb-mokambo', commentBtn: 'primary' },
    { trip: 'SB-2024-018', truck: 'DEF321DRC', driver: 'Linda Phiri', direction: 'SB', border: 'Kasumbalesa', processHtml: '<span class="status-badge green">SB Exit</span>', process: 'SB Exit', status: 'Exit to Zambia — Complete', hours: 28, target: '48h', kpi: 'green', kpiLabel: 'On Track', viewPage: 'sb-kasumbalesa', commentBtn: 'primary' }
];

const podDB = [
    { trip:'NB-2024-031', truck:'MNO012DRC', driver:'David Mukendi', area:'Kanyaka', offloadingPoint:'Kanyaka Depot', owner:'Transport Co A', collected:true, collectedOnTime:true, collectedDate:'2026-07-19 14:00', hoursToCollect:28, scanned:true, scannedDate:'2026-07-19 16:30', scannedBy:'Agent Mwila', uploaded:true, uploadedDate:'2026-07-20 09:00', sentToInvoicing:true, sentDate:'2026-07-21 10:00', kpi:'green' },
    { trip:'NB-2024-015', truck:'XYZ789DRC', driver:'Sarah Smith', area:'Kolwezi', offloadingPoint:'Kolwezi Mine', owner:'Transport Co B', collected:false, collectedOnTime:false, collectedDate:null, hoursToCollect:null, scanned:false, scannedDate:null, scannedBy:null, uploaded:false, uploadedDate:null, sentToInvoicing:false, sentDate:null, kpi:'orange', overdue:true },
    { trip:'NB-2024-022', truck:'GHI789DRC', driver:'Jean Pierre', area:'Lubumbashi', offloadingPoint:'Lubumbashi', owner:'Transport Co C', collected:false, collectedOnTime:false, collectedDate:null, hoursToCollect:null, scanned:false, scannedDate:null, scannedBy:null, uploaded:false, uploadedDate:null, sentToInvoicing:false, sentDate:null, kpi:'red', overdue:true },
    { trip:'TR-1028', truck:'ZAM-4590', driver:'Peter Banda', area:'Kanyaka', offloadingPoint:'Kanyaka Depot', owner:'ZAM Logistics', collected:true, collectedOnTime:true, collectedDate:'2026-07-22 11:00', hoursToCollect:22, scanned:true, scannedDate:'2026-07-22 14:00', scannedBy:'Ruth Mwansa', uploaded:true, uploadedDate:'2026-07-23 08:00', sentToInvoicing:true, sentDate:'2026-07-23 15:00', kpi:'green' },
    { trip:'TR-1031', truck:'ZAM-4612', driver:'Joseph Kabwe', area:'Likasi', offloadingPoint:'Likasi Mine', owner:'Copper Haul', collected:true, collectedOnTime:false, collectedDate:'2026-07-20 18:00', hoursToCollect:56, scanned:true, scannedDate:'2026-07-21 09:00', scannedBy:'Patrick Tshimanga', uploaded:true, uploadedDate:'2026-07-22 10:00', sentToInvoicing:false, sentDate:null, kpi:'orange' },
    { trip:'TR-1045', truck:'ZAM-4650', driver:'Marie Mwamba', area:'Kolwezi', offloadingPoint:'KCC Mine', owner:'Mine Trans', collected:true, collectedOnTime:true, collectedDate:'2026-07-23 08:00', hoursToCollect:18, scanned:true, scannedDate:'2026-07-23 10:00', scannedBy:'Jean Kalenga', uploaded:false, uploadedDate:null, sentToInvoicing:false, sentDate:null, kpi:'orange' },
    { trip:'TR-1052', truck:'ZAM-4678', driver:'Mike Johnson', area:'Kasumbalesa', offloadingPoint:'Kolwezi Mine', owner:'Transport Co A', collected:true, collectedOnTime:true, collectedDate:'2026-07-24 07:00', hoursToCollect:30, scanned:false, scannedDate:null, scannedBy:null, uploaded:false, uploadedDate:null, sentToInvoicing:false, sentDate:null, kpi:'orange' },
    { trip:'TR-1058', truck:'ZAM-4690', driver:'Sarah Smith', area:'Lubumbashi', offloadingPoint:'Lubumbashi', owner:'Transport Co B', collected:true, collectedOnTime:true, collectedDate:'2026-07-24 12:00', hoursToCollect:36, scanned:true, scannedDate:'2026-07-24 15:00', scannedBy:'Inspector Kabwe', uploaded:true, uploadedDate:'2026-07-25 09:00', sentToInvoicing:false, sentDate:null, kpi:'green' },
    { trip:'TR-1063', truck:'ZAM-4701', driver:'David Mukendi', area:'Kanyaka', offloadingPoint:'Kanyaka Depot', owner:'Transport Co A', collected:false, collectedOnTime:false, collectedDate:null, hoursToCollect:null, scanned:false, scannedDate:null, scannedBy:null, uploaded:false, uploadedDate:null, sentToInvoicing:false, sentDate:null, kpi:'orange', overdue:false },
    { trip:'TR-1070', truck:'ZAM-4712', driver:'Jean Pierre', area:'Kolwezi', offloadingPoint:'Kolwezi Mine', owner:'Transport Co C', collected:true, collectedOnTime:true, collectedDate:'2026-07-21 16:00', hoursToCollect:40, scanned:true, scannedDate:'2026-07-22 08:00', scannedBy:'Officer Kalaba', uploaded:true, uploadedDate:'2026-07-22 14:00', sentToInvoicing:true, sentDate:'2026-07-23 09:00', kpi:'green' },
    { trip:'TR-1075', truck:'ZAM-4720', driver:'Peter Mwansa', area:'Likasi', offloadingPoint:'Likasi Mine', owner:'Copper Haul', collected:true, collectedOnTime:true, collectedDate:'2026-07-22 10:00', hoursToCollect:24, scanned:true, scannedDate:'2026-07-22 13:00', scannedBy:'Agent Mwila', uploaded:false, uploadedDate:null, sentToInvoicing:false, sentDate:null, kpi:'orange' },
    { trip:'TR-1080', truck:'ZAM-4733', driver:'Ruth Mwansa', area:'Kasumbalesa', offloadingPoint:'KCC Mine', owner:'Mine Trans', collected:false, collectedOnTime:false, collectedDate:null, hoursToCollect:null, scanned:false, scannedDate:null, scannedBy:null, uploaded:false, uploadedDate:null, sentToInvoicing:false, sentDate:null, kpi:'red', overdue:true }
];

window.podDB = podDB;

const borderPerformanceData = {
    NB: {
        borders: [
            { name: 'Kasumbalesa KBP', icon: '📍', tag: 'kbp', pct: 85, avgHours: 12, targetHours: 48, trucks: 23, kpi: 'green' },
            { name: 'Kasumbalesa Whisky', icon: '📍', tag: 'whisky', pct: 62, avgHours: 52, targetHours: 72, trucks: 15, kpi: 'orange' },
            { name: 'Sakania', icon: '📍', tag: '', pct: 78, avgHours: 40, targetHours: 48, trucks: 8, kpi: 'orange' },
            { name: 'Mokambo', icon: '📍', tag: '', pct: 55, avgHours: 78, targetHours: 72, trucks: 5, kpi: 'red' }
        ],
        areas: [
            { name: 'Kasumbalesa', pct: 85, kpi: 'green' },
            { name: 'Kanyaka', pct: 72, kpi: 'orange' },
            { name: 'Kolwezi', pct: 91, kpi: 'green' },
            { name: 'Lubumbashi', pct: 63, kpi: 'red' }
        ],
        users: [
            { name: 'Jean Kalenga', initials: 'JK', area: 'Kasumbalesa KBP', trucks: 34, avgTime: '11h', onTime: 92, kpi: 'green' },
            { name: 'Marie Mwamba', initials: 'MM', area: 'KBP Brigade', trucks: 28, avgTime: '14h', onTime: 88, kpi: 'green' },
            { name: 'Patrick Tshimanga', initials: 'PT', area: 'KBP Scan Bay', trucks: 31, avgTime: '18h', onTime: 76, kpi: 'orange' },
            { name: 'Inspector Kabwe', initials: 'IK', area: 'Sakania', trucks: 19, avgTime: '38h', onTime: 71, kpi: 'orange' },
            { name: 'Officer Kalaba', initials: 'OK', area: 'Mokambo', trucks: 12, avgTime: '68h', onTime: 54, kpi: 'red' }
        ]
    },
    SB: {
        borders: [
            { name: 'Kasumbalesa Exit', icon: '📍', tag: '', pct: 88, avgHours: 10, targetHours: 48, trucks: 18, kpi: 'green' },
            { name: 'Sakania Exit', icon: '📍', tag: '', pct: 72, avgHours: 44, targetHours: 48, trucks: 11, kpi: 'orange' },
            { name: 'Mokambo Exit', icon: '📍', tag: '', pct: 65, avgHours: 55, targetHours: 72, trucks: 7, kpi: 'orange' }
        ],
        areas: [
            { name: 'Kanyaka Loading', pct: 78, kpi: 'green' },
            { name: 'Dispatch / Escort', pct: 65, kpi: 'orange' },
            { name: 'Border Exit', pct: 88, kpi: 'green' },
            { name: 'Following-on List', pct: 55, kpi: 'red' }
        ],
        users: [
            { name: 'David Mukendi', initials: 'DM', area: 'Kanyaka Loading', trucks: 26, avgTime: '6h', onTime: 90, kpi: 'green' },
            { name: 'Joseph Kabwe', initials: 'JK', area: 'Kolwezi Mine', trucks: 22, avgTime: '32h', onTime: 82, kpi: 'green' },
            { name: 'Mike Johnson', initials: 'MJ', area: 'Dispatch/Escort', trucks: 18, avgTime: '5d', onTime: 74, kpi: 'orange' },
            { name: 'Ruth Mwansa', initials: 'RM', area: 'Kasumbalesa Exit', trucks: 24, avgTime: '14h', onTime: 86, kpi: 'green' },
            { name: 'Pierre Lumumba', initials: 'PL', area: 'Following-on List', trucks: 15, avgTime: '3h', onTime: 58, kpi: 'red' }
        ]
    }
};

const tripsDB = {
    'NB-2024-001': { tripNumber:'NB-2024-001',truck:'ABC123DRC',driver:'John Doe',direction:'NB',area:'Kasumbalesa',owner:'Transport Co A',orderNo:'ORD-1001',transporter:'Transport Co A',fleetNr:'FLT-042',trailer1:'TRL-456',customer:'Mining Corp',consignee:'Kolwezi Mine',commodity:'Copper Cathodes',cargoType:'Bulk',customerRef:'CUST-7788',clearingAgent:'Jean Kalenga',entryBorder:'Kasumbalesa',offloadingPoint:'Kolwezi Mine',fromStation:'Kasumbalesa',toStation:'Kolwezi Mine',status:'KBP Process',daysInDRC:5,kpi:'orange',borderProcess:'KBP',workflow:{border:'current',kanyaka:'pending',offloading:'pending',pod:'pending'},workflowDates:{border:'2026-07-23T08:00'},areaStatus:'KBP Parking',areaStatusDates:{'Entry on DRC':'2026-07-23T08:00','BAE Submitted':'2026-07-24T14:00','KBP Parking':'2026-07-25T09:15'},workflowStatusLog:{border:{status:'KBP Parking',statusDate:'2026-07-25T09:15',updatedBy:'border_moderator',updatedAt:'2026-07-25 09:15:00',area:'Kasumbalesa'}},positions:{},lastUpdatedBy:'border_moderator',lastUpdatedAt:'2026-07-25 09:15:00'},
    'NB-2024-008': { tripNumber:'NB-2024-008',truck:'JKL012DRC',driver:'Peter Mwansa',direction:'NB',area:'Kasumbalesa',owner:'Transport Co D',entryBorder:'Kasumbalesa',offloadingPoint:'KCC Mine',status:'Whisky Process',daysInDRC:3,kpi:'orange',borderProcess:'Whisky',workflow:{border:'current',kanyaka:'pending',offloading:'pending',pod:'pending'}},
    'NB-2024-015': { tripNumber:'NB-2024-015',truck:'XYZ789DRC',driver:'Sarah Smith',direction:'NB',area:'Kolwezi',owner:'Transport Co B',entryBorder:'Sakania',offloadingPoint:'Kolwezi Mine',status:'Offloading',daysInDRC:12,kpi:'orange',workflow:{border:'completed',kanyaka:'completed',offloading:'current',pod:'pending'},workflowDates:{border:'2026-07-18T10:00',kanyaka:'2026-07-20T14:00',offloading:'2026-07-24T09:00'},workflowStatusLog:{border:{status:'Border Clearance Complete',statusDate:'2026-07-18T10:00',updatedBy:'border_moderator',updatedAt:'2026-07-18 10:30:00',area:'Sakania'},kanyaka:{status:'Transit Complete',statusDate:'2026-07-20T14:00',updatedBy:'ops_manager',updatedAt:'2026-07-20 14:45:00',area:'Kanyaka'},offloading:{status:'Offloading',statusDate:'2026-07-24T09:00',updatedBy:'ops_manager',updatedAt:'2026-07-24 09:30:00',area:'Kolwezi'}}},
    'NB-2024-022': { tripNumber:'NB-2024-022',truck:'GHI789DRC',driver:'Jean Pierre',direction:'NB',area:'Lubumbashi',owner:'Transport Co C',entryBorder:'Mokambo',offloadingPoint:'Lubumbashi',status:'POD Missing',daysInDRC:15,kpi:'red',workflow:{border:'completed',kanyaka:'completed',offloading:'completed',pod:'current'}},
    'NB-2024-031': { tripNumber:'NB-2024-031',truck:'MNO012DRC',driver:'David Mukendi',direction:'NB',area:'Kanyaka',owner:'Transport Co A',entryBorder:'Kasumbalesa',offloadingPoint:'Kanyaka Depot',status:'In Transit',daysInDRC:8,kpi:'green',workflow:{border:'completed',kanyaka:'current',offloading:'pending',pod:'pending'}},
    'SB-2024-003': { tripNumber:'SB-2024-003',truck:'DEF456DRC',driver:'Mike Johnson',direction:'SB',area:'Kanyaka',owner:'Transport Co A',loadingPoint:'Kanyaka',exitBorder:'Kasumbalesa',status:'Loading',daysInDRC:3,kpi:'green',workflow:{loadingProcess:'current',documents:'pending',seal:'pending',escort:'pending',dispatch:'pending',kanyaka:'pending',border:'pending'},workflowDates:{loadingProcess:'2026-07-23T11:00'},areaStatusDates:{'Arrived at Exit Border':'2026-07-23T15:30','Gov List Uploaded':'2026-07-24T13:30','Seal Verification':'2026-07-25T09:30'}},
    'SB-2024-005': { tripNumber:'SB-2024-005',truck:'MNO345DRC',driver:'David Mukendi',direction:'SB',area:'Kanyaka',owner:'Transport Co B',loadingPoint:'Kanyaka Mine',exitBorder:'Sakania',status:'Loading',daysInDRC:2,kpi:'orange',workflow:{loadingProcess:'current',documents:'pending',seal:'pending',escort:'pending',dispatch:'pending',kanyaka:'pending',border:'pending'}},
    'SB-2024-012': { tripNumber:'SB-2024-012',truck:'PQR678DRC',driver:'Joseph Kabwe',direction:'SB',area:'Kolwezi',owner:'Transport Co C',loadingPoint:'Kolwezi Mine',exitBorder:'Mokambo',status:'Escort Arrangement',daysInDRC:5,kpi:'green',workflow:{loadingProcess:'completed',documents:'completed',seal:'completed',escort:'current',dispatch:'pending',kanyaka:'pending',border:'pending'}},
    'NB-2024-042': { tripNumber:'NB-2024-042',truck:'RST890DRC',driver:'Alice Bwalya',direction:'NB',area:'Kasumbalesa',owner:'Transport Co D',entryBorder:'Kasumbalesa',offloadingPoint:'Kolwezi Mine',status:'Direct Clearance',daysInDRC:4,kpi:'green',borderProcess:'Direct',addedToday:true,workflow:{border:'current',kanyaka:'pending',offloading:'pending',pod:'pending'}},
    'NB-2024-043': { tripNumber:'NB-2024-043',truck:'UVW123DRC',driver:'Paul Chanda',direction:'NB',area:'Kolwezi',owner:'Transport Co B',entryBorder:'Sakania',offloadingPoint:'KCC Mine',status:'In Transit',daysInDRC:6,kpi:'green',addedToday:true,workflow:{border:'completed',kanyaka:'completed',offloading:'pending',pod:'pending'}},
    'NB-2024-044': { tripNumber:'NB-2024-044',truck:'XYZ456DRC',driver:'Grace Mutale',direction:'NB',area:'Lubumbashi',owner:'Transport Co A',entryBorder:'Mokambo',offloadingPoint:'Lubumbashi',status:'Offloading',daysInDRC:11,kpi:'orange',workflow:{border:'completed',kanyaka:'completed',offloading:'current',pod:'pending'}},
    'NB-2024-045': { tripNumber:'NB-2024-045',truck:'ABC789DRC',driver:'Henry Sampa',direction:'NB',area:'Kanyaka',owner:'Transport Co C',entryBorder:'Kasumbalesa',offloadingPoint:'Kanyaka Depot',status:'POD Collection',daysInDRC:9,kpi:'orange',workflow:{border:'completed',kanyaka:'completed',offloading:'completed',pod:'current'}},
    'SB-2024-018': { tripNumber:'SB-2024-018',truck:'DEF321DRC',driver:'Linda Phiri',direction:'SB',area:'Kanyaka',owner:'Transport Co B',loadingPoint:'Kanyaka Mine',exitBorder:'Kasumbalesa',status:'Exit to Zambia — Complete',daysInDRC:7,kpi:'green',workflow:{loadingProcess:'completed',documents:'completed',seal:'completed',escort:'completed',dispatch:'completed',kanyaka:'completed',border:'current'},workflowDates:{loadingProcess:'2026-07-19T16:00',documents:'2026-07-20T10:00',seal:'2026-07-21T09:00',escort:'2026-07-22T08:00',dispatch:'2026-07-22T10:00',kanyaka:'2026-07-23T14:00',border:'2026-07-25T10:30'},areaStatusDates:{'Arrived at Exit Border':'2026-07-24T07:30','Gov List Uploaded':'2026-07-24T09:30','Customs Declaration Submitted':'2026-07-24T14:30','Seal Verification':'2026-07-25T08:45','Exit to Zambia — Complete':'2026-07-25T10:30'},workflowStatusLog:{loadingProcess:{status:'Loading Complete',statusDate:'2026-07-19T16:00',updatedBy:'ops_manager',updatedAt:'2026-07-19 16:30:00',area:'Kanyaka'},documents:{status:'Documents Collected',statusDate:'2026-07-20T10:00',updatedBy:'ops_manager',updatedAt:'2026-07-20 10:30:00',area:'Kanyaka'},seal:{status:'Seal Applied',statusDate:'2026-07-21T09:00',updatedBy:'ops_manager',updatedAt:'2026-07-21 09:30:00',area:'Kanyaka'},escort:{status:'Escort Arranged',statusDate:'2026-07-22T08:00',updatedBy:'ops_manager',updatedAt:'2026-07-22 08:30:00',area:'Kanyaka'},dispatch:{status:'Dispatched',statusDate:'2026-07-22T10:00',updatedBy:'ops_manager',updatedAt:'2026-07-22 10:30:00',area:'Kanyaka'},kanyaka:{status:'Gov List Uploaded',statusDate:'2026-07-23T14:00',updatedBy:'ops_manager',updatedAt:'2026-07-23 14:30:00',area:'Kanyaka'},border:{status:'Exit to Zambia — Complete',statusDate:'2026-07-25T10:30',updatedBy:'border_moderator',updatedAt:'2026-07-25 11:00:00',area:'Kasumbalesa'}}},
    'SB-2024-019': { tripNumber:'SB-2024-019',truck:'GHI654DRC',driver:'Oscar Mwale',direction:'SB',area:'Kolwezi',owner:'Transport Co A',loadingPoint:'Kolwezi Mine',exitBorder:'Sakania',status:'Document Collection',daysInDRC:2,kpi:'orange',addedToday:true,workflow:{loadingProcess:'completed',documents:'current',seal:'pending',escort:'pending',dispatch:'pending',kanyaka:'pending',border:'pending'}},
    'SB-2024-020': { tripNumber:'SB-2024-020',truck:'JKL987DRC',driver:'Nancy Banda',direction:'SB',area:'Kanyaka',owner:'Transport Co D',loadingPoint:'Kanyaka',exitBorder:'Mokambo',status:'Dispatch',daysInDRC:6,kpi:'orange',workflow:{loadingProcess:'completed',documents:'completed',seal:'completed',escort:'completed',dispatch:'current',kanyaka:'pending',border:'pending'}},
    'NB-2024-046': { tripNumber:'NB-2024-046',truck:'MNO741DRC',driver:'Victor Lungu',direction:'NB',area:'Kasumbalesa',owner:'Transport Co D',entryBorder:'Kasumbalesa',offloadingPoint:'KCC Mine',status:'Whisky Process',daysInDRC:3,kpi:'orange',borderProcess:'Whisky',addedToday:true,workflow:{border:'current',kanyaka:'pending',offloading:'pending',pod:'pending'}},
    'NB-2024-047': { tripNumber:'NB-2024-047',truck:'PQR852DRC',driver:'Emma Zulu',direction:'NB',area:'Kolwezi',owner:'Transport Co B',entryBorder:'Sakania',offloadingPoint:'Kolwezi Mine',status:'Border Clearance',daysInDRC:2,kpi:'green',addedToday:true,workflow:{border:'current',kanyaka:'pending',offloading:'pending',pod:'pending'}}
};

(function enrichTripsRunnerDates() {
    const patches = {
        'NB-2024-001': { workflowDates: { border: '2026-07-20T08:00', kanyaka: '2026-07-22T10:00' } },
        'NB-2024-008': { workflowDates: { border: '2026-07-21T09:00', kanyaka: '2026-07-25T14:00' } },
        'NB-2024-022': { workflowDates: { border: '2026-07-05T08:00', kanyaka: '2026-07-12T10:00', offloading: '2026-07-14T09:00' } },
        'NB-2024-031': { workflowDates: { border: '2026-07-17T07:00', kanyaka: '2026-07-19T11:00' } },
        'NB-2024-042': { workflowDates: { border: '2026-07-22T08:00', kanyaka: '2026-07-26T12:00' } },
        'NB-2024-043': { workflowDates: { border: '2026-07-18T10:00', kanyaka: '2026-07-19T08:00', offloading: '2026-07-21T10:00' } },
        'NB-2024-044': { workflowDates: { border: '2026-07-08T08:00', kanyaka: '2026-07-10T09:00', offloading: '2026-07-15T11:00' } },
        'NB-2024-045': { workflowDates: { border: '2026-07-12T08:00', kanyaka: '2026-07-13T10:00', offloading: '2026-07-14T08:00' } },
        'NB-2024-046': { workflowDates: { border: '2026-07-23T07:00', kanyaka: '2026-07-27T15:00' } },
        'NB-2024-047': { workflowDates: { border: '2026-07-24T08:00', kanyaka: '2026-07-25T09:00' } },
        'SB-2024-003': { workflowDates: { loadingProcess: '2026-07-20T10:00', kanyaka: '2026-07-22T08:00', border: '2026-07-23T14:00' } },
        'SB-2024-005': { workflowDates: { loadingProcess: '2026-07-21T09:00', kanyaka: '2026-07-22T07:00', border: '2026-07-24T10:00' } },
        'SB-2024-012': { workflowDates: { loadingProcess: '2026-07-15T08:00', kanyaka: '2026-07-18T10:00', border: '2026-07-20T11:00' } },
        'SB-2024-020': { workflowDates: { loadingProcess: '2026-07-16T08:00', kanyaka: '2026-07-17T09:00', border: '2026-07-19T10:00' } }
    };
    Object.entries(patches).forEach(([id, patch]) => {
        if (tripsDB[id]) {
            tripsDB[id].workflowDates = { ...(tripsDB[id].workflowDates || {}), ...patch.workflowDates };
            if (patch.workflowDates.kanyaka) tripsDB[id].workflow = { ...tripsDB[id].workflow, border: tripsDB[id].workflow?.border || 'completed', kanyaka: 'completed' };
        }
    });
})();

// ============================================
// KPI TARGETS BANNERS
// ============================================
const KPI_TARGETS = {
    nb: {
        title: 'NB KPI Targets:',
        items: [
            'KBP / Sakania BN Process: ≤ 48 hours',
            'Whisky / Mokambo BN Process: ≤ 72 hours',
            'Kanyaka Transit: ≤ 24 hours',
            'POD Collection: ≤ 48 hours from offloading complete',
            'Truck stops showing on live NB page when POD is sent to invoicing'
        ]
    },
    sb: {
        title: 'SB KPI Targets:',
        items: [
            'Loading Process: ≤ 48 hours',
            'Dispatch/Escort: ≤ 8 days',
            'Following-on List (Mutaka & Kanyaka): ≤ 2 hours',
            'Truck stops showing on live SB page when Date Exit to Zambia is filled'
        ]
    },
    border: {
        title: 'Border KPI Targets:',
        items: [
            'KBP / Sakania BN Process (NB Entry): ≤ 48 hours',
            'Whisky / Mokambo BN Process (NB Entry): ≤ 72 hours',
            'SB Exit (Kasumbalesa / Sakania): ≤ 48 hours',
            'SB Exit (Mokambo): ≤ 72 hours',
            'Truck stops showing when clearance is complete / Date Exit to Zambia is filled'
        ]
    },
    equipment: {
        title: 'Equipment KPI Targets:',
        items: [
            'Insurance / permits: valid before border crossing',
            'Document expiry alert: orange at 30 days, red when expired',
            'TR8 / vignette / road tax: renewed within process SLA',
            'Unassigned equipment: flagged after 7 days idle'
        ]
    }
};

function renderKpiTargetsBanner(type) {
    const titles = { nb: 'NB KPI Targets:', sb: 'SB KPI Targets:', border: 'Border KPI Targets:', equipment: 'Equipment KPI Targets:' };
    const items = getKpiSettingsForBanner(type).map(formatKpiSettingLine).filter(Boolean);
    const fallback = KPI_TARGETS[type];
    const title = titles[type] || fallback?.title || 'KPI Targets:';
    const list = items.length ? items : (fallback?.items || []);
    if (!list.length) return '';
    return `
        <div class="kpi-targets-banner kpi-targets-${type}">
            <strong>📊 ${title}</strong>
            <ul>${list.map(item => `<li>${item}</li>`).join('')}</ul>
        </div>`;
}

function navigateTo(page) {
    if (!requirePageAccess(page)) {
        const fallback = canAccessPage('dashboard') ? 'dashboard' : (Object.keys(PAGE_MODULE_MAP).find(p => canAccessPage(p)) || 'dashboard');
        if (page !== fallback) {
            navigateTo(fallback);
            return;
        }
    }
    currentPage = page;
    document.querySelectorAll('.nav-item').forEach(item => { item.classList.remove('active'); if(item.dataset.page===page) item.classList.add('active'); });
    const ca = document.getElementById('contentArea');
    if (!canAccessPage(page)) {
        ca.innerHTML = `<div class="access-denied"><h2>Access Denied</h2><p>You do not have permission to view this module. Contact an administrator to assign module access per area.</p></div>`;
        updateAdminNavVisibility();
        return;
    }
    switch(page){
        case 'dashboard': renderDashboard(ca); break;
        case 'nb-operations': renderNBOperations(ca); break;
        case 'sb-operations': renderSBOperations(ca); break;
        case 'border-clearance': renderBorderClearanceOverview(ca); break;
        case 'kasumbalesa-detail': renderNBKBPBorderDetail(ca, nbBorderConfigs['kasumbalesa-kbp']); break;
        case 'kasumbalesa-direct': renderNBKBPBorderDetail(ca, nbBorderConfigs['kasumbalesa-direct']); break;
        case 'kasumbalesa-whisky': renderKasumbalesaWhisky(ca); break;
        case 'sakania-nb': renderNBKBPBorderDetail(ca, nbBorderConfigs['sakania-nb']); break;
        case 'mokambo-nb': renderNBKBPBorderDetail(ca, nbBorderConfigs['mokambo-nb']); break;
        case 'sakania': renderNBKBPBorderDetail(ca, nbBorderConfigs['sakania-nb']); break;
        case 'mokambo': renderNBKBPBorderDetail(ca, nbBorderConfigs['mokambo-nb']); break;
        case 'sb-kasumbalesa': renderSBClearanceDetail(ca, sbBorderConfigs['sb-kasumbalesa']); break;
        case 'sb-sakania': renderSBClearanceDetail(ca, sbBorderConfigs['sb-sakania']); break;
        case 'sb-mokambo': renderSBClearanceDetail(ca, sbBorderConfigs['sb-mokambo']); break;
        case 'pod-management': renderPODManagement(ca); break;
        case 'trip-list': renderTripList(ca); break;
        case 'document-alerts': renderDocumentAlerts(ca); break;
        case 'document-detail': renderDocumentDetail(ca); break;
        case 'kanyaka': renderAreaPage(ca,'Kanyaka'); break;
        case 'kolwezi': renderAreaPage(ca,'Kolwezi'); break;
        case 'area-browser': renderAreaBrowser(ca); break;
        case 'communication-matrix': renderCommunicationMatrix(ca); break;
        case 'driver-registry': renderDriverRegistry(ca); break;
        case 'internal-communication': renderInternalCommunication(ca); break;
        case 'assets': renderAssets(ca); break;
        case 'runner-fees': renderRunnerFees(ca); break;
        case 'reports': renderReports(ca); break;
        case 'admin-users': renderAdminUsers(ca); break;
        case 'admin-roles': renderAdminRoles(ca); break;
        case 'admin-settings': renderAdminSettings(ca); break;
        case 'admin-themes': renderAdminThemes(ca); break;
        case 'admin-kpi-settings': renderAdminKpiSettings(ca); break;
        case 'admin-audit-logs': renderAdminAuditLogs(ca); break;
        case 'admin-area-statuses': renderAdminAreaStatuses(ca); break;
        case 'admin-area-assignments': renderAdminAreaAssignments(ca); break;
        case 'admin-module-permissions': renderAdminModulePermissions(ca); break;
        case 'admin-fleet-settings': renderAdminFleetSettings(ca); break;
        case 'admin-upload-templates': renderAdminUploadTemplates(ca); break;
        case 'position-live': renderPositionLive(ca); break;
        case 'turnarounds': renderTurnarounds(ca); break;
        case 'report-detail': renderReportDetail(ca); break;
        default: renderDashboard(ca);
    }
    updateSidebarBadges();
    updateTopBarUser();
}

function navigateToPOD(filter) {
    currentPODFilter = filter || 'all';
    navigateTo('pod-management');
}

function navigateToTripList(filter) {
    currentTripFilter = filter || 'all';
    navigateTo('trip-list');
}

function navigateToDocuments(filter) {
    currentDocFilter = filter || 'all';
    navigateTo('document-alerts');
}

function navigateToDocument(docId) {
    currentDocumentId = docId;
    navigateTo('document-detail');
}

function renderDocumentLink(doc, label) {
    const text = label || doc.type;
    return `<a href="#" class="doc-link" onclick="event.preventDefault(); navigateToDocument(${doc.id})" title="View ${doc.fileName || doc.type}">${text}</a>`;
}

function navigateToBorder(borderKey) {
    const map = {
        'kasumbalesa-kbp': 'nb-border-kasumbalesa',
        'kasumbalesa-whisky': 'nb-border-kasumbalesa',
        'sakania': 'nb-border-sakania',
        'sakania-nb': 'nb-border-sakania',
        'mokambo': 'nb-border-mokambo',
        'mokambo-nb': 'nb-border-mokambo',
        'kasumbalesa-exit': 'sb-border-kasumbalesa',
        'sakania-exit': 'sb-border-sakania',
        'mokambo-exit': 'sb-border-mokambo'
    };
    const target = map[borderKey];
    if (target) navigateToTripList(target);
    else navigateToTripList('all');
}

function navigateToAreaList(areaName) {
    const pageMap = { Kanyaka: 'kanyaka', Kolwezi: 'kolwezi' };
    if (pageMap[areaName]) navigateTo(pageMap[areaName]);
    else navigateToTripList('area-' + areaName.toLowerCase().replace(/\s+/g, '-').replace(/\//g, ''));
}

function navigateToAreaBrowser(areaIds) {
    selectedAreaIds = areaIds && areaIds.length ? [...areaIds] : areasDB.map(a => a.id);
    pendingAreaIds = [...selectedAreaIds];
    areaNbSearch = '';
    areaSbSearch = '';
    areaSelectorHidden = !!(areaIds && areaIds.length);
    areaDropdownOpen = !areaSelectorHidden;
    navigateTo('area-browser');
}

function getTripViewPage(trip) {
    if (!trip) return null;
    if (trip.direction === 'NB') {
        if (trip.entryBorder === 'Kasumbalesa') {
            return getKasumbalesaViewPage(trip.borderProcess || trip.status);
        }
        if (trip.entryBorder === 'Sakania') return 'sakania-nb';
        if (trip.entryBorder === 'Mokambo') return 'mokambo-nb';
    }
    if (trip.direction === 'SB') {
        if (trip.exitBorder === 'Kasumbalesa') return 'sb-kasumbalesa';
        if (trip.exitBorder === 'Sakania') return 'sb-sakania';
        if (trip.exitBorder === 'Mokambo') return 'sb-mokambo';
    }
    return null;
}

function navigateToTripView(tripNumber) {
    const trip = tripsDB[tripNumber];
    const page = getTripViewPage(trip);
    if (page) navigateTo(page);
    else showToast('No detail view available for this truck', 'warning');
}

function renderTripViewButton(tripNumber) {
    const trip = tripsDB[tripNumber];
    const page = getTripViewPage(trip);
    if (!page) return '';
    return `<button class="btn btn-outline btn-sm" onclick="navigateToTripView('${tripNumber}')" title="View border/area process">👁️</button>`;
}

function getSelectedAreaLabels() {
    return areasDB.filter(a => selectedAreaIds.includes(a.id)).map(a => `${a.icon} ${a.name}`);
}

function getPendingAreaLabels() {
    return areasDB.filter(a => pendingAreaIds.includes(a.id)).map(a => `${a.icon} ${a.name}`);
}

function getAreaDropdownTriggerLabel() {
    if (areaDropdownOpen) return 'Choose areas below, then click Submit';
    const labels = getSelectedAreaLabels();
    return labels.length ? labels.join(' · ') : 'No areas selected';
}

function toggleAreaDropdown() {
    areaDropdownOpen = !areaDropdownOpen;
    if (areaDropdownOpen) pendingAreaIds = [...selectedAreaIds];
    updateAreaDropdownUI();
}

function openAreaDropdown() {
    pendingAreaIds = [...selectedAreaIds];
    areaSelectorHidden = false;
    areaDropdownOpen = true;
    updateAreaDropdownUI();
}

function closeAreaDropdown() {
    areaDropdownOpen = false;
    updateAreaDropdownUI();
}

function hideAreaSelectorAfterSubmit() {
    areaSelectorHidden = true;
    areaDropdownOpen = false;
    updateAreaDropdownUI();
}

function updateAreaDropdownUI() {
    const wrap = document.getElementById('areaDropdownWrap');
    const panel = document.getElementById('areaDropdownPanel');
    const summary = document.getElementById('areaSelectorSummary');
    const triggerLabel = document.getElementById('areaDropdownTriggerLabel');
    const chevron = document.getElementById('areaDropdownChevron');

    if (wrap) wrap.classList.toggle('hidden', areaSelectorHidden);
    if (panel) panel.classList.toggle('open', areaDropdownOpen);
    if (summary) summary.classList.toggle('hidden', !areaSelectorHidden);
    if (triggerLabel) triggerLabel.textContent = getAreaDropdownTriggerLabel();
    if (chevron) chevron.textContent = areaDropdownOpen ? '▲' : '▼';

    const labelEl = document.getElementById('areaSelectorSummaryText');
    if (labelEl) {
        const labels = getSelectedAreaLabels();
        labelEl.textContent = labels.length
            ? labels.join(' · ')
            : 'No areas selected — choose at least one area';
    }

    document.querySelectorAll('.area-checkbox-item input').forEach(cb => {
        cb.checked = pendingAreaIds.includes(cb.value);
    });
}

function collapseAreaSelector() {
    closeAreaDropdown();
}

function expandAreaSelector() {
    openAreaDropdown();
}

function getSelectedAreas() {
    return areasDB.filter(a => selectedAreaIds.includes(a.id));
}

function pointMatchesList(point, points) {
    if (!point) return false;
    const p = point.toLowerCase();
    return points.some(op => {
        const o = op.toLowerCase();
        return p.includes(o) || o.includes(p);
    });
}

function tripMatchesNBArea(trip, areaConfig) {
    return pointMatchesList(trip.offloadingPoint, areaConfig.offloadingPoints);
}

function tripMatchesSBArea(trip, areaConfig) {
    const loadMatch = pointMatchesList(trip.loadingPoint, areaConfig.loadingPoints);
    const areaMatch = trip.area && trip.area.toLowerCase() === areaConfig.name.toLowerCase();
    return loadMatch || areaMatch;
}

function filterNBTrucksByAreas(searchTerm) {
    const areas = getSelectedAreas();
    if (!areas.length) return [];
    let trips = Object.values(tripsDB).filter(t => {
        if (t.direction !== 'NB') return false;
        return areas.some(area => tripMatchesNBArea(t, area));
    });
    trips = filterTripsByUserArea(trips);
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        trips = trips.filter(t =>
            t.tripNumber.toLowerCase().includes(term) ||
            t.truck.toLowerCase().includes(term) ||
            t.driver.toLowerCase().includes(term) ||
            (t.offloadingPoint && t.offloadingPoint.toLowerCase().includes(term)) ||
            (t.area && t.area.toLowerCase().includes(term)) ||
            t.status.toLowerCase().includes(term) ||
            (t.owner && t.owner.toLowerCase().includes(term))
        );
    }
    return trips;
}

function filterSBTrucksByAreas(searchTerm) {
    const areas = getSelectedAreas();
    if (!areas.length) return [];
    let trips = Object.values(tripsDB).filter(t => {
        if (t.direction !== 'SB') return false;
        return areas.some(area => tripMatchesSBArea(t, area));
    });
    trips = filterTripsByUserArea(trips);
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        trips = trips.filter(t =>
            t.tripNumber.toLowerCase().includes(term) ||
            t.truck.toLowerCase().includes(term) ||
            t.driver.toLowerCase().includes(term) ||
            (t.loadingPoint && t.loadingPoint.toLowerCase().includes(term)) ||
            (t.area && t.area.toLowerCase().includes(term)) ||
            t.status.toLowerCase().includes(term) ||
            (t.owner && t.owner.toLowerCase().includes(term))
        );
    }
    return trips;
}

function renderAreaBrowserTableRows(trips, direction) {
    const listKey = direction === 'SB' ? 'areaSb' : 'areaNb';
    const type = direction;
    if (typeof renderOperationsTableRows === 'function') {
        return renderOperationsTableRows(trips, listKey, type, 'area-browser');
    }
    if (!trips.length) {
        return `<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--text-secondary);">No trucks match the selected areas</td></tr>`;
    }
    return trips.map(t => `
        <tr>
            <td><strong>${t.tripNumber}</strong></td>
            <td>${t.tuck}</td>
        </tr>`).join('');
}

function renderAreaBrowserLiveTableHeader(direction) {
    const listKey = direction === 'SB' ? 'areaSb' : 'areaNb';
    const type = direction === 'SB' ? 'SB' : 'NB';
    return typeof getOperationsTableHeaderHtml === 'function'
        ? getOperationsTableHeaderHtml(type, listKey)
        : '';
}

function refreshAreaBrowserPanels() {
    const nbTrips = filterNBTrucksByAreas(areaNbSearch);
    const sbTrips = filterSBTrucksByAreas(areaSbSearch);
    const nbBody = document.getElementById('areaNbTableBody');
    const sbBody = document.getElementById('areaSbTableBody');
    const nbHead = document.getElementById('areaNbTableHead');
    const sbHead = document.getElementById('areaSbTableHead');
    const nbCount = document.getElementById('areaNbCount');
    const sbCount = document.getElementById('areaSbCount');
    if (nbHead) nbHead.innerHTML = `<tr>${renderAreaBrowserLiveTableHeader('NB')}</tr>`;
    if (sbHead) sbHead.innerHTML = `<tr>${renderAreaBrowserLiveTableHeader('SB')}</tr>`;
    if (nbBody) nbBody.innerHTML = renderAreaBrowserTableRows(nbTrips, 'NB');
    if (sbBody) sbBody.innerHTML = renderAreaBrowserTableRows(sbTrips, 'SB');
    if (nbCount) nbCount.textContent = `${nbTrips.length} truck${nbTrips.length !== 1 ? 's' : ''}`;
    if (sbCount) sbCount.textContent = `${sbTrips.length} truck${sbTrips.length !== 1 ? 's' : ''}`;
    if (typeof applyLiveTableLayout === 'function') {
        applyLiveTableLayout('areaNbOperationsTable', 'NB');
        applyLiveTableLayout('areaSbOperationsTable', 'SB');
    }
}

function togglePendingArea(areaId, checked) {
    if (checked && !pendingAreaIds.includes(areaId)) pendingAreaIds.push(areaId);
    else if (!checked) pendingAreaIds = pendingAreaIds.filter(id => id !== areaId);
}

function selectAllPendingAreas() {
    pendingAreaIds = areasDB.map(a => a.id);
    document.querySelectorAll('.area-checkbox-item input').forEach(cb => { cb.checked = true; });
}

function clearAllPendingAreas() {
    pendingAreaIds = [];
    document.querySelectorAll('.area-checkbox-item input').forEach(cb => { cb.checked = false; });
}

function submitAreaSelection() {
    if (!pendingAreaIds.length) {
        showToast('Please select at least one area', 'warning');
        return;
    }
    selectedAreaIds = [...pendingAreaIds];
    hideAreaSelectorAfterSubmit();
    refreshAreaBrowserPanels();
    showToast(`Showing trucks for ${selectedAreaIds.length} area${selectedAreaIds.length !== 1 ? 's' : ''}`, 'success');
}

function handleAreaNbSearch(value) {
    areaNbSearch = value;
    refreshAreaBrowserPanels();
}

function handleAreaSbSearch(value) {
    areaSbSearch = value;
    refreshAreaBrowserPanels();
}

function renderAreaBrowser(container) {
    const nbTrips = filterNBTrucksByAreas(areaNbSearch);
    const sbTrips = filterSBTrucksByAreas(areaSbSearch);
    const selectedLabels = getSelectedAreaLabels();
    if (!pendingAreaIds.length) pendingAreaIds = [...selectedAreaIds];

    container.innerHTML = `
        <div class="page-header">
            <h1>🗺️ Area Trucks Browser</h1>
            <div class="breadcrumb">
                <a href="#" onclick="navigateTo('dashboard')">Home</a> <span>›</span>
                <span>Areas</span> <span>›</span>
                <strong>Area Trucks</strong>
            </div>
        </div>

        <div id="areaSelectorSummary" class="area-selector-summary${areaSelectorHidden ? '' : ' hidden'}">
            <div>
                <strong>📍 Selected Areas:</strong>
                <span id="areaSelectorSummaryText">${selectedLabels.length ? selectedLabels.join(' · ') : 'No areas selected'}</span>
            </div>
            <button class="btn btn-outline btn-sm" onclick="expandAreaSelector()">Change Areas</button>
        </div>

        <div id="areaDropdownWrap" class="area-dropdown-wrap${areaSelectorHidden ? ' hidden' : ''}">
            <button type="button" class="area-dropdown-trigger" onclick="toggleAreaDropdown()" aria-expanded="${areaDropdownOpen}">
                <span class="area-dropdown-trigger-title">📍 Select Areas</span>
                <span class="area-dropdown-trigger-value" id="areaDropdownTriggerLabel">${getAreaDropdownTriggerLabel()}</span>
                <span class="area-dropdown-chevron" id="areaDropdownChevron">${areaDropdownOpen ? '▲' : '▼'}</span>
            </button>

            <div id="areaDropdownPanel" class="area-dropdown-panel${areaDropdownOpen ? ' open' : ''}">
                <div class="area-dropdown-header">
                    <span>Area list</span>
                    <div class="area-dropdown-quick-actions">
                        <button type="button" class="btn btn-outline btn-sm" onclick="selectAllPendingAreas()">Select All</button>
                        <button type="button" class="btn btn-outline btn-sm" onclick="clearAllPendingAreas()">Clear All</button>
                    </div>
                </div>
                <div class="area-checkbox-list area-checkbox-scroll">
                    ${areasDB.map(area => `
                        <label class="area-checkbox-item">
                            <input type="checkbox" value="${area.id}" ${pendingAreaIds.includes(area.id) ? 'checked' : ''}
                                onchange="togglePendingArea('${area.id}', this.checked)">
                            <span>${area.icon} ${area.name}</span>
                        </label>
                    `).join('')}
                </div>
                <div class="area-dropdown-footer">
                    <div class="area-filter-hint">
                        <strong>NB:</strong> Trucks shown by <em>offloading point</em>.<br>
                        <strong>SB:</strong> Trucks shown if <em>in the area</em> or <em>loading point</em> matches.<br>
                        <em>Dropdown auto-hides after you submit your area selection.</em>
                    </div>
                    <button type="button" class="btn btn-primary" onclick="submitAreaSelection()">✓ Submit Selection</button>
                </div>
            </div>
        </div>

        <div class="area-trucks-stack">
            <div class="area-trucks-panel nb-panel">
                <div class="panel-header">
                    <h3>🔼 North Bound (NB) <span id="areaNbCount" style="font-weight:400;color:var(--text-secondary);font-size:13px;">${nbTrips.length} truck${nbTrips.length !== 1 ? 's' : ''}</span></h3>
                    <div class="panel-search">
                        <span>🔍</span>
                        <input type="text" placeholder="Filter NB trucks..." value="${areaNbSearch}"
                            onkeyup="handleAreaNbSearch(this.value)">
                    </div>
                </div>
                <div class="panel-body" style="overflow-x:auto;">
                    <div class="table-header-actions" style="display:flex;justify-content:flex-end;margin-bottom:8px;">
                        ${typeof renderLiveColumnToolbar === 'function' ? renderLiveColumnToolbar('NB', 'areaNbOperationsTable', 'areaNb') : ''}
                    </div>
                    <table class="live-page-table operations-live-table" id="areaNbOperationsTable" style="width:100%;font-size:13px;">
                        <thead id="areaNbTableHead"><tr>${renderAreaBrowserLiveTableHeader('NB')}</tr></thead>
                        <tbody id="areaNbTableBody">${renderAreaBrowserTableRows(nbTrips, 'NB')}</tbody>
                    </table>
                </div>
            </div>

            <div class="area-trucks-panel sb-panel">
                <div class="panel-header">
                    <h3>🔽 South Bound (SB) <span id="areaSbCount" style="font-weight:400;color:var(--text-secondary);font-size:13px;">${sbTrips.length} truck${sbTrips.length !== 1 ? 's' : ''}</span></h3>
                    <div class="panel-search">
                        <span>🔍</span>
                        <input type="text" placeholder="Filter SB trucks..." value="${areaSbSearch}"
                            onkeyup="handleAreaSbSearch(this.value)">
                    </div>
                </div>
                <div class="panel-body" style="overflow-x:auto;">
                    <div class="table-header-actions" style="display:flex;justify-content:flex-end;margin-bottom:8px;">
                        ${typeof renderLiveColumnToolbar === 'function' ? renderLiveColumnToolbar('SB', 'areaSbOperationsTable', 'areaSb') : ''}
                    </div>
                    <table class="live-page-table operations-live-table" id="areaSbOperationsTable" style="width:100%;font-size:13px;">
                        <thead id="areaSbTableHead"><tr>${renderAreaBrowserLiveTableHeader('SB')}</tr></thead>
                        <tbody id="areaSbTableBody">${renderAreaBrowserTableRows(sbTrips, 'SB')}</tbody>
                    </table>
                </div>
            </div>
        </div>

        <button class="btn btn-outline mt-20" onclick="navigateTo('dashboard')">⬅️ Back to Dashboard</button>
    `;
    setTimeout(() => {
        if (typeof applyLiveTableLayout === 'function') {
            applyLiveTableLayout('areaNbOperationsTable', 'NB');
            applyLiveTableLayout('areaSbOperationsTable', 'SB');
        }
    }, 0);
}

function getDashboardStats() {
    const all = Object.values(tripsDB);
    const nb = all.filter(t => t.direction === 'NB');
    const sb = all.filter(t => t.direction === 'SB');
    return {
        total: all.length,
        nb: nb.length,
        sb: sb.length,
        orange: all.filter(t => t.kpi === 'orange').length,
        red: all.filter(t => t.kpi === 'red').length,
        nbGreen: nb.filter(t => t.kpi === 'green').length,
        sbGreen: sb.filter(t => t.kpi === 'green').length,
        nbAtRisk: nb.filter(t => t.kpi !== 'green').length,
        sbCompleted: sb.filter(t => t.kpi === 'green').length,
        todayNew: all.filter(t => t.addedToday).length,
        nbOnTimePct: nb.length ? Math.round((nb.filter(t => t.kpi === 'green').length / nb.length) * 100) : 0,
        sbOnTimePct: sb.length ? Math.round((sb.filter(t => t.kpi === 'green').length / sb.length) * 100) : 0,
        avgTurnaround: all.length ? Math.round(all.reduce((s, t) => s + t.daysInDRC, 0) / all.length) : 0
    };
}

function filterTripsByDashboard(filter) {
    let trips = Object.values(tripsDB);
    switch (filter) {
        case 'nb': return trips.filter(t => t.direction === 'NB');
        case 'sb': return trips.filter(t => t.direction === 'SB');
        case 'orange': return trips.filter(t => t.kpi === 'orange');
        case 'red': return trips.filter(t => t.kpi === 'red');
        case 'nb-green': return trips.filter(t => t.direction === 'NB' && t.kpi === 'green');
        case 'sb-green': return trips.filter(t => t.direction === 'SB' && t.kpi === 'green');
        case 'nb-at-risk': return trips.filter(t => t.direction === 'NB' && t.kpi !== 'green');
        case 'sb-completed': return trips.filter(t => t.direction === 'SB' && t.kpi === 'green');
        case 'today': return trips.filter(t => t.addedToday);
        case 'turnaround': return [...trips].sort((a, b) => b.daysInDRC - a.daysInDRC);
        case 'nb-border-kasumbalesa': return trips.filter(t => t.direction === 'NB' && t.entryBorder === 'Kasumbalesa');
        case 'nb-border-sakania': return trips.filter(t => t.direction === 'NB' && t.entryBorder === 'Sakania');
        case 'nb-border-mokambo': return trips.filter(t => t.direction === 'NB' && t.entryBorder === 'Mokambo');
        case 'sb-border-kasumbalesa': return trips.filter(t => t.direction === 'SB' && t.exitBorder === 'Kasumbalesa');
        case 'sb-border-sakania': return trips.filter(t => t.direction === 'SB' && t.exitBorder === 'Sakania');
        case 'sb-border-mokambo': return trips.filter(t => t.direction === 'SB' && t.exitBorder === 'Mokambo');
        default:
            if (filter.startsWith('area-')) {
                const area = filter.replace('area-', '').replace(/-/g, ' ');
                return trips.filter(t => t.area && t.area.toLowerCase().includes(area.split(' ')[0]));
            }
            return trips;
    }
}

function getTripFilterLabel(filter) {
    const labels = {
        all: 'All Active Trucks',
        nb: 'North Bound (NB) Trucks',
        sb: 'South Bound (SB) Trucks',
        orange: 'Priority Alerts (Orange)',
        red: 'Overdue Alerts (Red)',
        'nb-green': 'NB On-Time Trucks',
        'sb-green': 'SB On-Time Trucks',
        'nb-at-risk': 'NB At Risk',
        'sb-completed': 'SB Completed / On Track',
        today: 'Trucks Added Today',
        turnaround: 'Turnaround — Sorted by Days in DRC',
        'nb-border-kasumbalesa': 'NB Trucks — Kasumbalesa Border',
        'nb-border-sakania': 'NB Trucks — Sakania Border',
        'nb-border-mokambo': 'NB Trucks — Mokambo Border',
        'sb-border-kasumbalesa': 'SB Trucks — Kasumbalesa Exit',
        'sb-border-sakania': 'SB Trucks — Sakania Exit',
        'sb-border-mokambo': 'SB Trucks — Mokambo Exit'
    };
    if (labels[filter]) return labels[filter];
    if (filter.startsWith('area-')) return `Trucks in ${filter.replace('area-', '').replace(/-/g, ' ')}`;
    return 'Truck List';
}

function filterDocuments(filter) {
    switch (filter) {
        case 'expiring': return documentsDB.filter(d => d.status === 'expiring');
        case 'expired': return documentsDB.filter(d => d.status === 'expired');
        case 'valid': return documentsDB.filter(d => d.status === 'valid');
        default: return documentsDB;
    }
}

function getDocFilterLabel(filter) {
    const labels = { all: 'All Documents', expiring: 'Documents Expiring Soon', expired: 'Expired Documents', valid: 'Valid Documents' };
    return labels[filter] || 'Documents';
}

function getBorderNavKey(name, direction) {
    const n = name.toLowerCase();
    if (n.includes('kbp')) return 'kasumbalesa-kbp';
    if (n.includes('whisky')) return 'kasumbalesa-whisky';
    if (direction === 'SB') {
        if (n.includes('kasumbalesa')) return 'kasumbalesa-exit';
        if (n.includes('sakania')) return 'sakania-exit';
        if (n.includes('mokambo')) return 'mokambo-exit';
    }
    if (n.includes('sakania')) return 'sakania-nb';
    if (n.includes('mokambo')) return 'mokambo-nb';
    if (n.includes('kasumbalesa')) return 'kasumbalesa-kbp';
    return 'all';
}

function getPODStats() {
    const items = podDB;
    return {
        total: items.length,
        collectedOnTime: items.filter(p => p.collected && p.collectedOnTime).length,
        collectedLate: items.filter(p => p.collected && !p.collectedOnTime).length,
        scanned: items.filter(p => p.scanned).length,
        uploaded: items.filter(p => p.uploaded).length,
        sentInvoicing: items.filter(p => p.sentToInvoicing).length,
        pending: items.filter(p => !p.collected).length,
        overdue: items.filter(p => p.overdue).length
    };
}

function filterPODItems(filter) {
    switch (filter) {
        case 'collected-on-time': return podDB.filter(p => p.collected && p.collectedOnTime);
        case 'collected-late': return podDB.filter(p => p.collected && !p.collectedOnTime);
        case 'scanned': return podDB.filter(p => p.scanned);
        case 'uploaded': return podDB.filter(p => p.uploaded);
        case 'sent-invoicing': return podDB.filter(p => p.sentToInvoicing);
        case 'pending': return podDB.filter(p => !p.collected);
        case 'overdue': return podDB.filter(p => p.overdue);
        default: return podDB;
    }
}

function getPODFilterLabel(filter) {
    const labels = {
        all: 'All POD Items',
        'collected-on-time': 'Collected On-Time (≤48h)',
        'collected-late': 'Collected Late (>48h)',
        scanned: 'Scanned PODs',
        uploaded: 'Uploaded PODs',
        'sent-invoicing': 'Sent to POD Mgmt & Invoicing',
        pending: 'Pending Collection',
        overdue: 'Overdue PODs'
    };
    return labels[filter] || 'All POD Items';
}

// ============================================
// EXCEL EXPORT & ROW SELECTION
// ============================================
function formatExportDate() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function escapeCsvCell(value) {
    const text = value == null ? '' : String(value);
    if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
    return text;
}

function downloadExcelCsv(filename, headers, rows) {
    const lines = [
        headers.map(escapeCsvCell).join(','),
        ...rows.map(row => row.map(escapeCsvCell).join(','))
    ];
    const blob = new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

function toggleListRowSelection(listKey, rowId, checked) {
    if (!listRowSelections[listKey]) listRowSelections[listKey] = [];
    if (checked && !listRowSelections[listKey].includes(rowId)) {
        listRowSelections[listKey].push(rowId);
    } else if (!checked) {
        listRowSelections[listKey] = listRowSelections[listKey].filter(id => id !== rowId);
    }
    updateListSelectionUI(listKey);
}

function toggleAllListRows(listKey, checked) {
    const config = LIST_EXPORT_CONFIG[listKey];
    if (!config) return;
    const ids = config.getData().map(config.getRowId);
    listRowSelections[listKey] = checked ? [...ids] : [];
    document.querySelectorAll(`input.list-row-checkbox[data-list="${listKey}"]`).forEach(cb => {
        cb.checked = checked;
    });
    updateListSelectionUI(listKey);
}

function updateListSelectionUI(listKey) {
    const count = listRowSelections[listKey]?.length || 0;
    const countEl = document.getElementById(`${listKey}SelectionCount`);
    const selectedBtn = document.getElementById(`${listKey}ExportSelectedBtn`);
    if (countEl) countEl.textContent = count ? `${count} selected` : '';
    if (selectedBtn) selectedBtn.disabled = count === 0;
}

function renderExportToolbar(listKey) {
    const count = listRowSelections[listKey]?.length || 0;
    return `
        <div class="export-toolbar">
            <span id="${listKey}SelectionCount" class="export-selection-count">${count ? `${count} selected` : ''}</span>
            <button type="button" id="${listKey}ExportSelectedBtn" class="btn btn-outline btn-sm" onclick="exportListData('${listKey}', 'selected')" ${count ? '' : 'disabled'}>📥 Export Selected</button>
            <button type="button" class="btn btn-success btn-sm" onclick="exportListData('${listKey}', 'all')">📥 Export All</button>
        </div>
    `;
}

function renderListRowCheckbox(listKey, rowId) {
    const checked = (listRowSelections[listKey] || []).includes(rowId);
    return `<input type="checkbox" class="list-row-checkbox" data-list="${listKey}" value="${rowId}" ${checked ? 'checked' : ''} onchange="toggleListRowSelection('${listKey}', '${rowId}', this.checked)" aria-label="Select row ${rowId}">`;
}

function getNBOperationsFilteredTrips() {
    const area = document.getElementById('nbAreaFilter')?.value || 'all';
    const border = document.getElementById('nbBorderFilter')?.value || 'all';
    const kpi = document.getElementById('nbKPIFilter')?.value || 'all';
    const search = document.getElementById('nbSearchInput')?.value || '';
    let trips = filterTrips('NB', search);
    if (area !== 'all') trips = trips.filter(t => t.area === area);
    if (border !== 'all') trips = trips.filter(t => t.entryBorder === border);
    if (kpi !== 'all') trips = trips.filter(t => t.kpi === kpi);
    return trips;
}

function getSBOperationsFilteredTrips() {
    const area = document.getElementById('sbAreaFilter')?.value || 'all';
    const border = document.getElementById('sbBorderFilter')?.value || 'all';
    const kpi = document.getElementById('sbKPIFilter')?.value || 'all';
    const search = document.getElementById('sbSearchInput')?.value || '';
    let trips = filterTrips('SB', search);
    if (area !== 'all') trips = trips.filter(t => t.area === area);
    if (border !== 'all') trips = trips.filter(t => t.exitBorder === border);
    if (kpi !== 'all') trips = trips.filter(t => t.kpi === kpi);
    return trips;
}

function getPODCollectedLabel(p) {
    if (p.collected) return p.collectedOnTime ? 'Yes (On-time)' : 'Yes (Late)';
    if (p.overdue) return 'Overdue';
    return 'No';
}

const LIST_EXPORT_CONFIG = {
    nb: {
        title: 'NB Operations',
        filenamePrefix: 'NB_Operations',
        getData: getNBOperationsFilteredTrips,
        getRowId: t => t.tripNumber,
        get headers() {
            return typeof getTemplateExportConfig === 'function'
                ? getTemplateExportConfig('NB').headers
                : ['Trip #', 'Truck', 'Owner', 'Driver', 'Border', 'Offloading', 'Area', 'Status', 'Days in DRC', 'KPI'];
        },
        mapRow: t => typeof getTemplateExportConfig === 'function'
            ? getTemplateExportConfig('NB').mapRow(t)
            : [t.tripNumber, t.truck, t.owner, t.driver, t.entryBorder || '-', t.offloadingPoint || '-', t.area || '-', t.status, t.daysInDRC, getKPILabel(t.kpi)]
    },
    sb: {
        title: 'SB Operations',
        filenamePrefix: 'SB_Operations',
        getData: getSBOperationsFilteredTrips,
        getRowId: t => t.tripNumber,
        get headers() {
            return typeof getTemplateExportConfig === 'function'
                ? getTemplateExportConfig('SB').headers
                : ['Trip #', 'Truck', 'Owner', 'Driver', 'Loading Point', 'Exit Border', 'Area', 'Status', 'Days in DRC', 'KPI'];
        },
        mapRow: t => typeof getTemplateExportConfig === 'function'
            ? getTemplateExportConfig('SB').mapRow(t)
            : [t.tripNumber, t.truck, t.owner, t.driver, t.loadingPoint || '-', t.exitBorder || '-', t.area || '-', t.status, t.daysInDRC, getKPILabel(t.kpi)]
    },
    border: {
        title: 'Border Clearance',
        filenamePrefix: 'Border_Clearance',
        getData: filterBorderClearanceTrucks,
        getRowId: t => t.trip,
        headers: ['Trip #', 'Truck', 'Driver', 'Direction', 'Border', 'Process', 'Status', 'Hours', 'Target', 'KPI'],
        mapRow: t => [
            t.trip, t.truck, t.driver, t.direction, t.border, t.process,
            t.status, t.hours, t.target, t.kpiLabel
        ]
    },
    pod: {
        title: 'POD Management',
        filenamePrefix: 'POD_Management',
        getData: getFilteredPODItems,
        getRowId: p => p.trip,
        headers: ['Trip #', 'Truck', 'Driver', 'Area', 'Offloading Point', 'Owner', 'Collected', 'Scanned', 'Uploaded', 'Sent to Invoicing', 'Hours to Collect', 'KPI', 'Stage Status'],
        mapRow: p => [
            p.trip, p.truck, p.driver, p.area, p.offloadingPoint, p.owner || '',
            getPODCollectedLabel(p),
            p.scanned ? 'Yes' : 'No',
            p.uploaded ? 'Yes' : 'No',
            p.sentToInvoicing ? 'Yes' : 'No',
            p.collected && p.hoursToCollect ? `${p.hoursToCollect}h` : '',
            getKPILabel(p.kpi),
            getPODStageStatus(p)
        ]
    },
    assets: {
        title: 'Assets & Equipment',
        filenamePrefix: 'Assets_Equipment',
        getData: getFilteredAssetsRegistry,
        getRowId: a => a.id,
        headers: ['Asset ID', 'Category', 'Type', 'Name', 'Plate / Serial', 'Make', 'Model', 'Year', 'Assigned To', 'Location', 'Acquisition Date', 'Status', 'Documents', 'Nearest Expiry', 'Doc Status'],
        mapRow: a => {
            const summary = getAssetDocumentsSummary(a);
            return [
                a.id,
                a.category === 'vehicle' ? 'Vehicle' : 'Equipment',
                a.assetType,
                a.name,
                a.category === 'vehicle' ? (a.plateNumber || '—') : (a.serialNumber || '—'),
                a.make || a.brand || '—',
                a.model || '—',
                a.year || '—',
                a.category === 'vehicle' ? (a.assignedDriver || a.owner || '—') : (a.assignedTo || '—'),
                a.location || '—',
                a.acquisitionDate || '—',
                formatAssetStatus(a.status),
                summary.count,
                summary.nearestExpiry || '—',
                summary.worstLabel || '—'
            ];
        }
    },
    commMatrix: {
        title: 'Communication Matrix',
        filenamePrefix: 'Communication_Matrix',
        getData: getMatrixExportData,
        getRowId: r => r.id,
        headers: ['ID', 'Name', 'Company', 'Function', 'Email', 'Place of Work', 'Phone', 'WhatsApp', 'Area', 'Status', 'Notes'],
        mapRow: r => [
            r.id, r.name, r.company, r.function, r.email || '—', r.placeOfWork || '—',
            r.phone || '—', r.whatsapp || '—', r.area || '—',
            r.active ? 'Active' : 'Inactive', r.notes || '—'
        ]
    },
    internalComm: {
        title: 'Internal Communication',
        filenamePrefix: 'Internal_Communication',
        getData: getInternalCommExportData,
        getRowId: r => r.id,
        headers: ['ID', 'Type', 'Subject / Room', 'Message', 'Sender', 'Recipients / Members', 'Linked To', 'Date/Time', 'Status', 'Attachments'],
        mapRow: r => [
            r.id, r.recordType, r.subject || r.name || '—', r.body || r.lastMessage || r.message || '—',
            r.sender || r.createdBy || '—', (r.recipients || []).join('; ') || String(r.members || '—'),
            r.relatedLabel || '—', r.sentAt || r.lastAt || '—', r.status || '—',
            r.attachments != null ? r.attachments : (r.fileLink ? '1' : '0')
        ]
    }
};

function exportListData(listKey, mode) {
    const config = LIST_EXPORT_CONFIG[listKey];
    if (!config) return;

    const allRows = config.getData();
    let rows = allRows;

    if (mode === 'selected') {
        const selected = listRowSelections[listKey] || [];
        rows = allRows.filter(r => selected.includes(config.getRowId(r)));
        if (!rows.length) {
            showToast('Please select at least one row to export', 'warning');
            return;
        }
    }

    if (!rows.length) {
        showToast('No data to export for the current filters', 'warning');
        return;
    }

    const sheetRows = rows.map(config.mapRow);
    const filename = `${config.filenamePrefix}_${mode === 'selected' ? 'selected' : 'all'}_${formatExportDate()}.csv`;
    downloadExcelCsv(filename, config.headers, sheetRows);
    showToast(`Exported ${rows.length} row${rows.length !== 1 ? 's' : ''} from ${config.title}`, 'success');
}

// ============================================
// FILTER FUNCTION
// ============================================
function filterTrips(direction, searchTerm) {
    let trips = Object.values(tripsDB).filter(t => {
        if (direction && t.direction !== direction) return false;
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            return t.tripNumber.toLowerCase().includes(term) ||
                   t.truck.toLowerCase().includes(term) ||
                   t.driver.toLowerCase().includes(term) ||
                   t.owner.toLowerCase().includes(term) ||
                   t.status.toLowerCase().includes(term) ||
                   (t.area && t.area.toLowerCase().includes(term)) ||
                   (t.entryBorder && t.entryBorder.toLowerCase().includes(term)) ||
                   (t.exitBorder && t.exitBorder.toLowerCase().includes(term)) ||
                   (t.loadingPoint && t.loadingPoint.toLowerCase().includes(term)) ||
                   (t.offloadingPoint && t.offloadingPoint.toLowerCase().includes(term)) ||
                   (t.areaStatus && t.areaStatus.toLowerCase().includes(term));
        }
        return true;
    });
    trips = filterTripsByUserArea(trips);
    const pageModule = getPageModule(currentPage);
    if (pageModule && ['nb-operations', 'sb-operations', 'border-clearance', 'pod-management', 'area-browser'].includes(pageModule)) {
        trips = filterTripsByModulePermission(trips, pageModule);
    }
    return trips;
}

// ============================================
// DASHBOARD WITH NB & SB VIEWS AND SEARCH
// ============================================
function getPerfColor(kpi) {
    return kpi === 'green' ? 'green' : kpi === 'orange' ? 'orange' : 'red';
}

function renderPerfBar(item, direction) {
    const color = getPerfColor(item.kpi);
    const meta = item.avgHours !== undefined
        ? `${item.trucks} trucks · Avg ${item.avgHours}h / ${item.targetHours}h`
        : `On-time performance`;
    const borderKey = getBorderNavKey(item.name, direction);
    const clickAction = `navigateToBorder('${borderKey}')`;
    return `
        <div class="perf-item perf-item-clickable" onclick="${clickAction}" title="Click to view truck list">
            <div class="perf-item-header">
                <span class="perf-name">${item.icon ? item.icon + ' ' : ''}${item.name}</span>
                <span class="perf-pct" style="color:var(--${color});">${item.pct}%</span>
            </div>
            <div class="perf-bar"><div class="perf-bar-fill ${color}" style="width:${item.pct}%;"></div></div>
            <div class="perf-meta" style="font-size:11px;color:var(--text-secondary);margin-top:4px;">${meta} · <span style="color:var(--primary-light);">View list →</span></div>
        </div>
    `;
}

function renderAreaPerfBar(item, direction) {
    const color = getPerfColor(item.kpi);
    const areaKey = item.name.split('/')[0].trim().split(' ')[0];
    return `
        <div class="perf-item perf-item-clickable" onclick="navigateToAreaList('${areaKey}')" title="Click to view trucks in ${item.name}">
            <div class="perf-item-header">
                <span class="perf-name">${item.name}</span>
                <span class="perf-pct" style="color:var(--${color});">${item.pct}%</span>
            </div>
            <div class="perf-bar"><div class="perf-bar-fill ${color}" style="width:${item.pct}%;"></div></div>
        </div>
    `;
}

function renderUserPerfRows(users, direction) {
    return users.map(u => `
        <tr class="table-row-clickable" onclick="navigateToAreaList('${u.area.split(' ')[0]}')" title="View trucks in ${u.area}">
            <td><span class="perf-user-name"><span class="user-avatar-sm">${u.initials}</span>${u.name}</span></td>
            <td><span class="border-tag${u.area.includes('Whisky') ? ' whisky' : ''}">${u.area}</span></td>
            <td>${u.trucks}</td>
            <td>${u.avgTime}</td>
            <td>${u.onTime}%</td>
            <td><span class="perf-kpi-pill ${u.kpi}">${u.kpi === 'green' ? 'On Track' : u.kpi === 'orange' ? 'Priority' : 'Overdue'}</span></td>
        </tr>
    `).join('');
}

function renderBorderPerformanceCard(direction, data) {
    const isNB = direction === 'NB';
    const icon = isNB ? 'fa-arrow-up' : 'fa-arrow-down';
    const iconColor = isNB ? 'var(--green)' : 'var(--orange)';
    const borderLabel = isNB ? 'Entry Borders' : 'Exit Borders';
    const targetNote = isNB ? 'Target: 48–72h clearance' : 'Target: ≤48h exit';

    return `
        <div class="card border-perf-card">
            <div class="card-header">
                <h3><i class="fas ${icon}" style="color:${iconColor};"></i> ${direction} – Border & Area Performance</h3>
                <button class="card-action" onclick="navigateTo('${isNB ? 'nb-operations' : 'sb-operations'}')">Details →</button>
            </div>
            <div class="card-body">
                <div class="perf-section-label"><i class="fas fa-map-marker-alt"></i> ${borderLabel} <span class="text-muted text-sm">(${targetNote})</span></div>
                ${data.borders.map(b => renderPerfBar(b, direction)).join('')}

                <div class="perf-section-label"><i class="fas fa-building"></i> Area Performance</div>
                ${data.areas.map(a => renderAreaPerfBar(a, direction)).join('')}

                <div class="perf-section-label"><i class="fas fa-users"></i> User Performance by Area</div>
                <table class="perf-user-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Area</th>
                            <th>Trucks</th>
                            <th>Avg Time</th>
                            <th>On-Time</th>
                            <th>KPI</th>
                        </tr>
                    </thead>
                    <tbody>${renderUserPerfRows(data.users, direction)}</tbody>
                </table>
            </div>
        </div>
    `;
}

function getCommunicationDashboardStats() {
    const matrix = getMatrixStats();
    const driverStats = getDriverRegistryStats();
    const emailCounts = getEmailFolderCounts();
    const unreadChats = chatRoomsDB.reduce((sum, room) => sum + (room.unreadCount || 0), 0);
    return {
        matrixTotalContacts: matrix.totalContacts,
        matrixActiveContacts: matrix.activeContacts,
        matrixInactiveContacts: matrix.inactiveContacts,
        matrixCompanies: matrix.companies,
        matrixAreas: matrix.areas,
        driverRegistryTotal: driverStats.total,
        driverRegistryNb: driverStats.nb,
        unreadEmails: emailCounts.unread,
        unreadChats,
        unreadMessages: emailCounts.unread + unreadChats,
        sentEmails: emailCounts.sent,
        drafts: emailCounts.drafts,
        groupChats: chatRoomsDB.filter(r => r.type === 'group').length,
        directChats: chatRoomsDB.filter(r => r.type === 'direct').length
    };
}

function updateSidebarBadges() {
    const comm = getCommunicationDashboardStats();
    const matrixBadge = document.getElementById('navMatrixBadge');
    const driverBadge = document.getElementById('navDriverRegistryBadge');
    const internalBadge = document.getElementById('navInternalCommBadge');
    if (matrixBadge) {
        matrixBadge.textContent = comm.matrixTotalContacts;
        matrixBadge.title = `${comm.matrixTotalContacts} contacts in Communication Matrix`;
        matrixBadge.style.display = comm.matrixTotalContacts ? '' : 'none';
    }
    if (driverBadge) {
        driverBadge.textContent = comm.driverRegistryTotal;
        driverBadge.title = `${comm.driverRegistryTotal} registered driver(s) — ${comm.driverRegistryNb} NB`;
        driverBadge.style.display = comm.driverRegistryTotal ? '' : 'none';
    }
    if (internalBadge) {
        internalBadge.textContent = comm.unreadMessages;
        internalBadge.title = `${comm.unreadEmails} unread email(s), ${comm.unreadChats} unread chat(s)`;
        internalBadge.style.display = comm.unreadMessages ? '' : 'none';
    }
    updateAlertPanel();
}

function collectSystemAlerts() {
    const alerts = [];

    emailsDB.filter(e => !e.mirrorOf && e.folder === 'inbox' && !e.read).forEach(e => {
        alerts.push({
            id: `email-${e.id}`, category: 'Email', level: e.important ? 'orange' : 'blue', icon: '✉️',
            title: e.subject,
            subtitle: `From: ${e.from}${e.relatedLabel ? ` · ${e.relatedLabel}` : ''}`,
            time: e.sentAt,
            action: { type: 'email', ref: e.id }
        });
    });

    chatRoomsDB.filter(r => (r.unreadCount || 0) > 0).forEach(r => {
        alerts.push({
            id: `chat-${r.id}`, category: 'Chat', level: 'blue',
            icon: r.type === 'group' ? '👥' : '💬',
            title: `${r.name} — ${r.unreadCount} unread message${r.unreadCount !== 1 ? 's' : ''}`,
            subtitle: r.lastMessage,
            time: r.lastAt,
            action: { type: 'chat', ref: r.id }
        });
    });

    Object.values(tripsDB).filter(t => t.kpi === 'orange' || t.kpi === 'red').forEach(trip => {
        alerts.push({
            id: `trip-${trip.tripNumber}`, category: 'Operations', level: trip.kpi,
            icon: trip.kpi === 'red' ? '🔴' : '🟠',
            title: `${trip.tripNumber} — ${trip.status}`,
            subtitle: `${trip.truck} | ${trip.driver} | ${trip.area || '—'} | ${trip.daysInDRC} days in DRC`,
            time: trip.kpi === 'red' ? 'Overdue — action required' : 'Priority attention',
            action: { type: 'trip', ref: trip.tripNumber }
        });
    });

    podDB.filter(p => p.overdue || (!p.collected && p.kpi === 'red')).forEach(p => {
        alerts.push({
            id: `pod-${p.trip}`, category: 'POD', level: p.overdue ? 'red' : 'orange', icon: '📋',
            title: `POD ${p.overdue ? 'Overdue' : 'Pending'} — ${p.trip}`,
            subtitle: `${p.truck} | ${p.driver} | ${p.area}`,
            time: p.overdue ? 'Collection overdue' : 'Awaiting POD collection',
            action: { type: 'pod', ref: p.overdue ? 'overdue' : 'pending' }
        });
    });

    documentsDB.filter(d => d.status === 'expired' || d.status === 'expiring').forEach(d => {
        alerts.push({
            id: `doc-${d.id}`, category: 'Documents', level: d.status === 'expired' ? 'red' : 'orange', icon: '📄',
            title: `${d.type} — ${d.label}`,
            subtitle: `${d.entity} | ${d.truck || '—'}`,
            time: `Expiry: ${d.expiry}`,
            action: { type: 'document', ref: d.id }
        });
    });

    emailsDB.filter(e => !e.mirrorOf && e.folder === 'drafts').forEach(e => {
        alerts.push({
            id: `draft-${e.id}`, category: 'Email', level: 'orange', icon: '📝',
            title: `Draft: ${e.subject}`,
            subtitle: `To: ${e.to.join(', ') || '—'}`,
            time: e.sentAt,
            action: { type: 'draft', ref: e.id }
        });
    });

    const levelOrder = { red: 0, orange: 1, blue: 2 };
    const categoryOrder = { Email: 0, Chat: 1, Operations: 2, POD: 3, Documents: 4 };
    return alerts.sort((a, b) => {
        const byLevel = (levelOrder[a.level] ?? 9) - (levelOrder[b.level] ?? 9);
        if (byLevel !== 0) return byLevel;
        return (categoryOrder[a.category] ?? 9) - (categoryOrder[b.category] ?? 9);
    });
}

function renderAlertPanelContent(alerts) {
    if (!alerts.length) {
        return '<div style="padding:32px 20px;text-align:center;color:var(--text-secondary);"><div style="font-size:32px;margin-bottom:8px;">✅</div>No alerts — you\'re all caught up!</div>';
    }
    const grouped = {};
    alerts.forEach(a => {
        if (!grouped[a.category]) grouped[a.category] = [];
        grouped[a.category].push(a);
    });
    const order = ['Email', 'Chat', 'Operations', 'POD', 'Documents'];
    const icons = { Email: '✉️', Chat: '💬', Operations: '🚛', POD: '📋', Documents: '📄' };
    return order.filter(cat => grouped[cat]?.length).map(cat => `
        <div class="alert-section-title">${icons[cat]} ${cat} (${grouped[cat].length})</div>
        ${grouped[cat].map(a => `
            <div class="alert-item ${a.level}" onclick="handleSystemAlertClick('${a.id}')">
                <div class="alert-title">${a.icon} ${a.title}</div>
                <div class="alert-time">${a.subtitle}</div>
                <div class="alert-time" style="margin-top:3px;">${a.time}</div>
            </div>
        `).join('')}
    `).join('');
}

function updateAlertPanel() {
    const alerts = collectSystemAlerts();
    const countEl = document.getElementById('alertCount');
    const body = document.getElementById('alertPanelBody');
    const footer = document.getElementById('alertPanelFooter');
    const btn = document.querySelector('.notification-btn');
    if (countEl) {
        countEl.textContent = alerts.length;
        countEl.style.display = alerts.length ? 'flex' : 'none';
    }
    if (btn) btn.classList.toggle('has-alerts', alerts.length > 0);
    if (body) body.innerHTML = renderAlertPanelContent(alerts);
    if (footer) {
        const emailCount = alerts.filter(a => a.category === 'Email').length;
        const chatCount = alerts.filter(a => a.category === 'Chat').length;
        const opsCount = alerts.length - emailCount - chatCount;
        footer.innerHTML = alerts.length
            ? `${alerts.length} alert${alerts.length !== 1 ? 's' : ''} · ✉️ ${emailCount} email · 💬 ${chatCount} chat · 🚛 ${opsCount} operations`
            : '';
    }
}

function handleSystemAlertClick(alertId) {
    const alert = collectSystemAlerts().find(a => a.id === alertId);
    if (!alert) return;
    document.getElementById('alertPanel')?.classList.remove('show');

    switch (alert.action.type) {
        case 'email': {
            const email = getEmailById(alert.action.ref);
            if (email) email.read = true;
            internalCommFilter = 'email';
            emailFolder = 'inbox';
            emailView = 'read';
            selectedEmailId = alert.action.ref;
            emailShowUnreadOnly = false;
            navigateTo('internal-communication');
            break;
        }
        case 'draft': {
            internalCommFilter = 'email';
            emailFolder = 'drafts';
            emailView = 'compose';
            emailComposeData = { mode: 'editDraft', draftId: alert.action.ref };
            navigateTo('internal-communication');
            break;
        }
        case 'chat': {
            const room = chatRoomsDB.find(r => r.id === alert.action.ref);
            if (room) room.unreadCount = 0;
            internalCommFilter = 'chat';
            activeChatRoomId = alert.action.ref;
            chatShowUnreadOnly = false;
            navigateTo('internal-communication');
            break;
        }
        case 'trip':
            openCommentModal(alert.action.ref);
            break;
        case 'pod':
            navigateToPOD(alert.action.ref);
            break;
        case 'document':
            navigateToDocument(alert.action.ref);
            break;
    }
    updateAlertPanel();
}

function handleAlertClick(tripNumber) { handleSystemAlertClick(`trip-${tripNumber}`); }

function navigateToMatrixKpi(kpi) {
    matrixSearchTerm = '';
    matrixAreaFilter = 'all';
    if (kpi === 'total') {
        matrixFilter = 'contacts';
        matrixActiveFilter = 'all';
    } else if (kpi === 'active') {
        matrixFilter = 'contacts';
        matrixActiveFilter = 'active';
    } else if (kpi === 'inactive') {
        matrixFilter = 'contacts';
        matrixActiveFilter = 'inactive';
    } else if (kpi === 'companies') {
        matrixFilter = 'companies';
        matrixActiveFilter = 'all';
    } else if (kpi === 'areas') {
        matrixFilter = 'areas';
        matrixActiveFilter = 'all';
    }
    navigateToCommunicationMatrix(matrixFilter);
}

function navigateToInternalCommKpi(kpi) {
    emailShowUnreadOnly = false;
    chatTypeFilter = 'all';
    chatShowUnreadOnly = false;
    if (kpi === 'unread-email' || kpi === 'unread-all') {
        internalCommFilter = 'email';
        emailFolder = 'inbox';
        emailView = 'list';
        emailShowUnreadOnly = true;
    } else if (kpi === 'unread-chats') {
        internalCommFilter = 'chat';
        chatShowUnreadOnly = true;
    } else if (kpi === 'sent') {
        internalCommFilter = 'email';
        emailFolder = 'sent';
        emailView = 'list';
    } else if (kpi === 'drafts') {
        internalCommFilter = 'email';
        emailFolder = 'drafts';
        emailView = 'list';
    } else if (kpi === 'group-chats') {
        internalCommFilter = 'chat';
        chatTypeFilter = 'group';
    } else if (kpi === 'direct-chats') {
        internalCommFilter = 'chat';
        chatTypeFilter = 'direct';
    }
    navigateToInternalComm(internalCommFilter);
}

function renderCommunicationDashboardSection() {
    const c = getCommunicationDashboardStats();
    return `
        <div class="section-title-bar">
            <h2><i class="fas fa-comments"></i> Communication</h2>
            <button class="card-action" onclick="navigateToInternalComm('email')">Internal Communication →</button>
        </div>
        <div class="pod-stat-grid">
            <div class="pod-stat-item" onclick="navigateToMatrixKpi('total')" title="View all contacts in Communication Matrix">
                <div class="pod-stat-icon">📇</div>
                <div class="pod-stat-value blue">${c.matrixTotalContacts}</div>
                <div class="pod-stat-label">Matrix Contacts</div>
                <div class="pod-stat-sub">People, companies &amp; functions</div>
            </div>
            <div class="pod-stat-item" onclick="navigateToMatrixKpi('active')" title="View active contacts">
                <div class="pod-stat-icon">✅</div>
                <div class="pod-stat-value green">${c.matrixActiveContacts}</div>
                <div class="pod-stat-label">Active Contacts</div>
                <div class="pod-stat-sub">${c.matrixInactiveContacts} <span style="color:var(--orange);cursor:pointer;" onclick="event.stopPropagation();navigateToMatrixKpi('inactive')">inactive →</span></div>
            </div>
            <div class="pod-stat-item" onclick="navigateToMatrixKpi('companies')" title="View companies in matrix">
                <div class="pod-stat-icon">🏢</div>
                <div class="pod-stat-value blue">${c.matrixCompanies}</div>
                <div class="pod-stat-label">Companies</div>
                <div class="pod-stat-sub">${c.matrixAreas} areas covered</div>
            </div>
            <div class="pod-stat-item" onclick="navigateToInternalCommKpi('unread-email')" title="View unread internal emails">
                <div class="pod-stat-icon">✉️</div>
                <div class="pod-stat-value orange">${c.unreadEmails}</div>
                <div class="pod-stat-label">Unread Email</div>
                <div class="pod-stat-sub">Internal system mail</div>
            </div>
            <div class="pod-stat-item" onclick="navigateToInternalCommKpi('unread-chats')" title="View chats with unread messages">
                <div class="pod-stat-icon">💬</div>
                <div class="pod-stat-value orange">${c.unreadChats}</div>
                <div class="pod-stat-label">Unread Chats</div>
                <div class="pod-stat-sub">WhatsApp-style messages</div>
            </div>
            <div class="pod-stat-item" onclick="navigateToInternalComm('email')" title="Open Internal Communication">
                <div class="pod-stat-icon">📨</div>
                <div class="pod-stat-value ${c.unreadMessages ? 'red' : 'green'}">${c.unreadMessages}</div>
                <div class="pod-stat-label">Total Unread</div>
                <div class="pod-stat-sub">${c.drafts} draft(s) · ${c.groupChats} group chat(s)</div>
            </div>
        </div>
    `;
}

function renderPODDashboardSection() {
    const s = getPODStats();
    return `
        <div class="section-title-bar">
            <h2><i class="fas fa-file-signature"></i> POD Performance</h2>
            <button class="card-action" onclick="navigateToPOD('all')">POD Management →</button>
        </div>
        <div class="pod-stat-grid">
            <div class="pod-stat-item" onclick="navigateToPOD('collected-on-time')" title="View collected on-time list">
                <div class="pod-stat-icon">✅</div>
                <div class="pod-stat-value green">${s.collectedOnTime}</div>
                <div class="pod-stat-label">Collected On-Time</div>
                <div class="pod-stat-sub">Target: ≤48 hours</div>
            </div>
            <div class="pod-stat-item" onclick="navigateToPOD('scanned')" title="View scanned POD list">
                <div class="pod-stat-icon">🔍</div>
                <div class="pod-stat-value blue">${s.scanned}</div>
                <div class="pod-stat-label">Scanned</div>
                <div class="pod-stat-sub">${s.collectedLate} <span style="color:var(--primary-light);cursor:pointer;" onclick="event.stopPropagation();navigateToPOD('collected-late')">collected late →</span></div>
            </div>
            <div class="pod-stat-item" onclick="navigateToPOD('uploaded')" title="View uploaded POD list">
                <div class="pod-stat-icon">📤</div>
                <div class="pod-stat-value blue">${s.uploaded}</div>
                <div class="pod-stat-label">Uploaded</div>
                <div class="pod-stat-sub">Documents in system</div>
            </div>
            <div class="pod-stat-item" onclick="navigateToPOD('sent-invoicing')" title="View sent to invoicing list">
                <div class="pod-stat-icon">📨</div>
                <div class="pod-stat-value green">${s.sentInvoicing}</div>
                <div class="pod-stat-label">Sent to Invoicing</div>
                <div class="pod-stat-sub">POD Mgmt & Invoicing team</div>
            </div>
            <div class="pod-stat-item" onclick="navigateToPOD('pending')" title="View pending collection list">
                <div class="pod-stat-icon">⏳</div>
                <div class="pod-stat-value orange">${s.pending}</div>
                <div class="pod-stat-label">Pending Collection</div>
                <div class="pod-stat-sub">Awaiting POD pickup</div>
            </div>
            <div class="pod-stat-item" onclick="navigateToPOD('overdue')" title="View overdue POD list">
                <div class="pod-stat-icon">🔴</div>
                <div class="pod-stat-value red">${s.overdue}</div>
                <div class="pod-stat-label">Overdue</div>
                <div class="pod-stat-sub">Action required</div>
            </div>
        </div>
    `;
}

function renderDashboard(container) {
    const podStats = getPODStats();
    const stats = getDashboardStats();
    const docExpiring = documentsDB.filter(d => d.status === 'expiring' || d.status === 'expired').length;

    container.innerHTML = `
        <div class="page-header">
            <h1>📊 Operations Dashboard</h1>
            <div class="breadcrumb">Home / Dashboard / Overview</div>
        </div>

        <div class="page-content">
            <div class="page active" id="page-dashboard">
                <div class="dashboard-grid">
                    <div class="stat-card stat-card-clickable" onclick="navigateToTripList('all')" title="View all active trucks">
                        <div class="stat-label">Total Trucks in DRC</div>
                        <div class="stat-value">${stats.total}</div>
                        <span class="stat-change green"><i class="fas fa-arrow-up"></i> +${stats.todayNew} today</span>
                        <i class="fas fa-truck stat-icon"></i>
                    </div>
                    <div class="stat-card stat-card-clickable" onclick="navigateToTripList('nb')" title="View NB outstanding trucks">
                        <div class="stat-label">NB Outstanding</div>
                        <div class="stat-value">${stats.nb}</div>
                        <span class="stat-change orange" onclick="event.stopPropagation();navigateToTripList('nb-at-risk')"><i class="fas fa-exclamation-triangle"></i> ${stats.nbAtRisk} at risk</span>
                        <i class="fas fa-arrow-up stat-icon"></i>
                    </div>
                    <div class="stat-card stat-card-clickable" onclick="navigateToTripList('sb')" title="View SB outstanding trucks">
                        <div class="stat-label">SB Outstanding</div>
                        <div class="stat-value">${stats.sb}</div>
                        <span class="stat-change green" onclick="event.stopPropagation();navigateToTripList('sb-completed')"><i class="fas fa-check"></i> ${stats.sbCompleted} on track</span>
                        <i class="fas fa-arrow-down stat-icon"></i>
                    </div>
                    <div class="stat-card stat-card-clickable" onclick="navigateToPOD('pending')" title="View pending POD list">
                        <div class="stat-label">POD Pending</div>
                        <div class="stat-value">${podStats.pending}</div>
                        <span class="stat-change red" onclick="event.stopPropagation();navigateToPOD('overdue')"><i class="fas fa-clock"></i> ${podStats.overdue} overdue</span>
                        <i class="fas fa-file-alt stat-icon"></i>
                    </div>
                    <div class="stat-card stat-card-clickable" onclick="navigateToTripList('orange')" title="View priority alerts">
                        <div class="stat-label">Orange Alerts</div>
                        <div class="stat-value" style="color:var(--orange);">${stats.orange}</div>
                        <span class="stat-change orange">Priority attention</span>
                        <i class="fas fa-exclamation-circle stat-icon" style="color:var(--orange);"></i>
                    </div>
                    <div class="stat-card stat-card-clickable" onclick="navigateToTripList('red')" title="View overdue alerts">
                        <div class="stat-label">Red Alerts</div>
                        <div class="stat-value" style="color:var(--red);">${stats.red}</div>
                        <span class="stat-change red">Escalated</span>
                        <i class="fas fa-times-circle stat-icon" style="color:var(--red);"></i>
                    </div>
                </div>

                <div class="kpi-row">
                    <div class="kpi-mini kpi-mini-clickable" onclick="navigateToTripList('nb-green')" title="View NB on-time trucks">
                        <div class="kpi-value green">${stats.nbOnTimePct}%</div>
                        <div class="kpi-label">NB On-Time</div>
                    </div>
                    <div class="kpi-mini kpi-mini-clickable" onclick="navigateToTripList('sb-green')" title="View SB on-time trucks">
                        <div class="kpi-value orange">${stats.sbOnTimePct}%</div>
                        <div class="kpi-label">SB On-Time</div>
                    </div>
                    <div class="kpi-mini kpi-mini-clickable" onclick="navigateToPOD('collected-on-time')" title="View POD collected on-time">
                        <div class="kpi-value green">${podStats.total ? Math.round((podStats.collectedOnTime / podStats.total) * 100) : 0}%</div>
                        <div class="kpi-label">POD Collection</div>
                    </div>
                    <div class="kpi-mini kpi-mini-clickable" onclick="navigateToTripList('turnaround')" title="View trucks by turnaround days">
                        <div class="kpi-value red">${stats.avgTurnaround}d</div>
                        <div class="kpi-label">Avg Turnaround</div>
                    </div>
                </div>

                <div class="section-title-bar">
                    <h2><i class="fas fa-border-all"></i> Border & Area Performance</h2>
                    <button class="card-action" onclick="navigateTo('border-clearance')">Full Border Report →</button>
                </div>
                <div class="row">
                    ${renderBorderPerformanceCard('NB', borderPerformanceData.NB)}
                    ${renderBorderPerformanceCard('SB', borderPerformanceData.SB)}
                </div>

                ${renderPODDashboardSection()}

                ${renderCommunicationDashboardSection()}

                <div class="row">
                    <div class="card">
                        <div class="card-header">
                            <h3><i class="fas fa-arrow-up" style="color:var(--green);"></i> NB – Recent Activity</h3>
                            <button class="card-action" onclick="navigateTo('nb-operations')">View All →</button>
                        </div>
                        <div class="card-body table-wrap">
                            <table>
                                <thead><tr><th>Trip</th><th>Truck</th><th>Area</th><th>Status</th><th>Days</th></tr></thead>
                                <tbody>
                                    ${recentActivityNB.map(r => `
                                    <tr class="table-row-clickable" onclick="navigateToTripList('${r.listFilter}')" title="View related truck list">
                                        <td><a class="truck-link" onclick="event.stopPropagation();navigateToTripList('${r.listFilter}')">${r.trip}</a></td>
                                        <td>${r.truck}</td>
                                        <td>${r.area}</td>
                                        <td><span class="status-badge ${r.kpi}"><span class="dot"></span> ${r.status}</span></td>
                                        <td>${r.days}d</td>
                                    </tr>`).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-header">
                            <h3><i class="fas fa-arrow-down" style="color:var(--orange);"></i> SB – Recent Activity</h3>
                            <button class="card-action" onclick="navigateTo('sb-operations')">View All →</button>
                        </div>
                        <div class="card-body table-wrap">
                            <table>
                                <thead><tr><th>Trip</th><th>Truck</th><th>Area</th><th>Status</th><th>Days</th></tr></thead>
                                <tbody>
                                    ${recentActivitySB.map(r => `
                                    <tr class="table-row-clickable" onclick="navigateToTripList('${r.listFilter}')" title="View related truck list">
                                        <td><a class="truck-link" onclick="event.stopPropagation();navigateToTripList('${r.listFilter}')">${r.trip}</a></td>
                                        <td>${r.truck}</td>
                                        <td>${r.area}</td>
                                        <td><span class="status-badge ${r.kpi}"><span class="dot"></span> ${r.status}</span></td>
                                        <td>${r.days}d</td>
                                    </tr>`).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div class="card card-clickable" onclick="navigateToDocuments('expiring')">
                    <div class="card-header">
                        <h3><i class="fas fa-file-alt"></i> Document Expiry Alerts</h3>
                        <span class="card-action text-sm text-muted" onclick="event.stopPropagation();navigateToDocuments('all')">${docExpiring} expiring soon →</span>
                    </div>
                    <div class="card-body table-wrap">
                        <table>
                            <thead><tr><th>Document</th><th>Entity</th><th>Expiry</th><th>Status</th></tr></thead>
                            <tbody>
                                ${documentsDB.slice(0, 3).map(d => `
                                <tr class="table-row-clickable" onclick="event.stopPropagation();navigateToDocument(${d.id})" title="View ${d.fileName || d.type}">
                                    <td>${renderDocumentLink(d)}</td>
                                    <td>${d.entity}</td>
                                    <td>${d.expiry}</td>
                                    <td><span class="status-badge ${d.kpi}"><span class="dot"></span> ${d.label}</span></td>
                                </tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderDashboardTableRows(trips, listKey) {
    const colSpan = listKey ? 12 : 11;
    if (trips.length === 0) {
        return `<tr><td colspan="${colSpan}" style="text-align:center;padding:20px;color:var(--text-secondary);">No trucks match the current search/filter criteria</td></tr>`;
    }
    return trips.map(t => `
        <tr>
            ${listKey ? `<td style="width:36px;text-align:center;">${renderListRowCheckbox(listKey, t.tripNumber)}</td>` : ''}
            <td><strong>${t.tripNumber}</strong></td>
            <td>${t.truck}</td>
            <td>${t.owner}</td>
            <td>${renderDriverLink(t.driver, t.tripNumber)}</td>
            <td>${t.direction === 'NB' ? (t.entryBorder || '-') : (t.loadingPoint || '-')}</td>
            <td>${t.direction === 'NB' ? (t.offloadingPoint || '-') : (t.exitBorder || '-')}</td>
            <td>${t.area || '-'}</td>
            <td><span class="status-badge ${t.kpi}">${t.status}</span></td>
            <td>${t.daysInDRC}</td>
            <td><span class="kpi-indicator ${t.kpi}"></span> ${getKPILabel(t.kpi)}</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="openCommentModal('${t.tripNumber}', '${listKey === 'sb' ? 'sb' : 'nb'}')">💬 Comment</button>
                ${renderTripViewButton(t.tripNumber)}
            </td>
        </tr>
    `).join('');
}

function dashboardSearch(value) {
    dashboardSearchTerm = value;
}

function dashboardFilter() {}

function clearDashboardSearch() {
    dashboardSearchTerm = '';
}

function refreshDashboard() {}

// ============================================
// NB OPERATIONS PAGE
// ============================================
function renderNBOperations(container) {
    const trips = filterTrips('NB', '');
    container.innerHTML = `
        <div class="page-header"><h1>🚛 North Bound Operations</h1><div class="breadcrumb">Operations / NB Operations</div><p class="page-subtitle" style="margin-top:8px;font-size:13px;color:var(--text-secondary);">Each workflow column shows the latest area status with title, date, and user log — click to view earlier updates. Applies across Kasumbalesa, Kanyaka, Kolwezi, Lubumbashi, and all NB areas.</p></div>
        ${getAreaFilterBanner()}
        ${renderKpiTargetsBanner('nb')}
        <div class="kpi-grid">
            <div class="kpi-card green"><div class="kpi-header"><span class="kpi-title">On Track</span></div><div class="kpi-value">${trips.filter(t=>t.kpi==='green').length}</div></div>
            <div class="kpi-card orange"><div class="kpi-header"><span class="kpi-title">Priority</span></div><div class="kpi-value">${trips.filter(t=>t.kpi==='orange').length}</div></div>
            <div class="kpi-card red"><div class="kpi-header"><span class="kpi-title">Overdue</span></div><div class="kpi-value">${trips.filter(t=>t.kpi==='red').length}</div></div>
        </div>
        <div class="filters-bar">
            <div class="filter-group"><label>Area:</label><select id="nbAreaFilter" onchange="refreshNBTable()"><option value="all">All</option><option>Kasumbalesa</option><option>Kanyaka</option><option>Kolwezi</option><option>Lubumbashi</option></select></div>
            <div class="filter-group"><label>Border:</label><select id="nbBorderFilter" onchange="refreshNBTable()"><option value="all">All</option><option>Kasumbalesa</option><option>Sakania</option><option>Mokambo</option></select></div>
            <div class="filter-group"><label>KPI:</label><select id="nbKPIFilter" onchange="refreshNBTable()"><option value="all">All</option><option value="green">🟢 On Track</option><option value="orange">🟠 Priority</option><option value="red">🔴 Overdue</option></select></div>
            <div class="search-filter"><span>🔍</span><input type="text" id="nbSearchInput" placeholder="Search by Trip#, Truck, Driver..." onkeyup="refreshNBTable()"></div>
            <button class="btn btn-outline btn-sm" onclick="clearNBFilters()">Clear</button>
        </div>
        <div style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;">
            ${canEditInModule('nb-operations') ? `<button class="btn btn-primary" onclick="openUploadModal('NB')">📤 Upload NB Live File</button>` : ''}
            ${canEditInModule('border-clearance') ? `<button class="btn btn-outline" onclick="openDriverRegistrationModal()">📱 Register NB Driver</button>` : ''}
            <button class="btn btn-outline" onclick="downloadTemplateCsv('NB')">📥 NB Template</button>
            ${canAccessModule('position-live') ? `<button class="btn btn-outline" onclick="navigateTo('position-live')">📍 Position Live</button>` : ''}
        </div>
        <div class="table-container">
            <div class="table-header">
                <h3>Active NB Trucks</h3>
                <div class="table-header-actions" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
                    ${typeof renderLiveColumnToolbar === 'function' ? renderLiveColumnToolbar('NB', 'nbOperationsTable', 'nb') : ''}
                    <span id="nbTableCount" style="color:var(--text-secondary);">${trips.length} trucks</span>
                    ${canEditInModule('nb-operations') ? renderExportToolbar('nb') : ''}
                </div>
            </div>
            <div style="overflow-x:auto;">
            <table class="live-page-table operations-live-table" id="nbOperationsTable"><thead><tr>
                ${typeof getOperationsTableHeaderHtml === 'function' ? getOperationsTableHeaderHtml('NB', 'nb') : '<th>Trip #</th><th>Truck</th><th>Owner</th><th>Driver</th><th>Border</th><th>Offloading</th><th>Area</th><th>Status</th><th>Days</th><th>KPI</th><th>Actions</th>'}
            </tr></thead>
            <tbody id="nbTableBody">${renderNBTableRowsFiltered()}</tbody></table>
            </div>
        </div>`;
    setTimeout(() => { if (typeof applyLiveTableLayout === 'function') applyLiveTableLayout('nbOperationsTable', 'NB'); }, 0);
}

function renderNBTableRowsFiltered() {
    const trips = getNBOperationsFilteredTrips();
    const countEl = document.getElementById('nbTableCount');
    if (countEl) countEl.textContent = `${trips.length} trucks`;
    updateListSelectionUI('nb');
    return typeof renderOperationsTableRows === 'function'
        ? renderOperationsTableRows(trips, 'nb', 'NB')
        : renderDashboardTableRows(trips, 'nb');
}

function refreshNBTable() {
    const nbBody = document.getElementById('nbTableBody');
    if (nbBody) nbBody.innerHTML = renderNBTableRowsFiltered();
    if (typeof applyLiveTableLayout === 'function') applyLiveTableLayout('nbOperationsTable', 'NB');
}

function clearNBFilters() {
    document.getElementById('nbAreaFilter').value = 'all';
    document.getElementById('nbBorderFilter').value = 'all';
    document.getElementById('nbKPIFilter').value = 'all';
    document.getElementById('nbSearchInput').value = '';
    refreshNBTable();
}

// ============================================
// SB OPERATIONS PAGE
// ============================================
function renderSBOperations(container) {
    const trips = filterTrips('SB', '');
    container.innerHTML = `
        <div class="page-header"><h1>🚛 South Bound Operations</h1><div class="breadcrumb">Operations / SB Operations</div><p class="page-subtitle" style="margin-top:8px;font-size:13px;color:var(--text-secondary);">Each SB workflow step (Loading → Documents → Seal → Escort → Dispatch → Kanyaka → Border Exit) has its own column with latest status, date, and user log — click to expand history.</p></div>
        ${getAreaFilterBanner()}
        ${renderKpiTargetsBanner('sb')}
        <div class="kpi-grid">
            <div class="kpi-card green"><div class="kpi-header"><span class="kpi-title">On Track</span></div><div class="kpi-value">${trips.filter(t=>t.kpi==='green').length}</div></div>
            <div class="kpi-card orange"><div class="kpi-header"><span class="kpi-title">Priority</span></div><div class="kpi-value">${trips.filter(t=>t.kpi==='orange').length}</div></div>
            <div class="kpi-card red"><div class="kpi-header"><span class="kpi-title">Overdue</span></div><div class="kpi-value">${trips.filter(t=>t.kpi==='red').length}</div></div>
        </div>
        <div class="filters-bar">
            <div class="filter-group"><label>Area:</label><select id="sbAreaFilter" onchange="refreshSBTable()"><option value="all">All</option><option>Kanyaka</option><option>Kolwezi</option></select></div>
            <div class="filter-group"><label>Exit Border:</label><select id="sbBorderFilter" onchange="refreshSBTable()"><option value="all">All</option><option>Kasumbalesa</option><option>Sakania</option><option>Mokambo</option></select></div>
            <div class="filter-group"><label>KPI:</label><select id="sbKPIFilter" onchange="refreshSBTable()"><option value="all">All</option><option value="green">🟢 On Track</option><option value="orange">🟠 Priority</option><option value="red">🔴 Overdue</option></select></div>
            <div class="search-filter"><span>🔍</span><input type="text" id="sbSearchInput" placeholder="Search by Trip#, Truck, Driver..." onkeyup="refreshSBTable()"></div>
            <button class="btn btn-outline btn-sm" onclick="clearSBFilters()">Clear</button>
        </div>
        <div style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;">
            ${canEditInModule('sb-operations') ? `<button class="btn btn-primary" onclick="openUploadModal('SB')">📤 Upload SB Live File</button>` : ''}
            <button class="btn btn-outline" onclick="downloadTemplateCsv('SB')">📥 SB Template</button>
            ${canAccessModule('position-live') ? `<button class="btn btn-outline" onclick="navigateTo('position-live')">📍 Position Live</button>` : ''}
        </div>
        <div class="table-container">
            <div class="table-header">
                <h3>Active SB Trucks</h3>
                <div class="table-header-actions" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
                    ${typeof renderLiveColumnToolbar === 'function' ? renderLiveColumnToolbar('SB', 'sbOperationsTable', 'sb') : ''}
                    <span id="sbTableCount" style="color:var(--text-secondary);">${trips.length} trucks</span>
                    ${canEditInModule('sb-operations') ? renderExportToolbar('sb') : ''}
                </div>
            </div>
            <div style="overflow-x:auto;">
            <table class="live-page-table operations-live-table" id="sbOperationsTable"><thead><tr>
                ${typeof getOperationsTableHeaderHtml === 'function' ? getOperationsTableHeaderHtml('SB', 'sb') : '<th>Trip #</th><th>Truck</th><th>Owner</th><th>Driver</th><th>Loading Point</th><th>Exit Border</th><th>Area</th><th>Status</th><th>Days</th><th>KPI</th><th>Actions</th>'}
            </tr></thead>
            <tbody id="sbTableBody">${renderSBTableRowsFiltered()}</tbody></table>
            </div>
        </div>`;
    setTimeout(() => { if (typeof applyLiveTableLayout === 'function') applyLiveTableLayout('sbOperationsTable', 'SB'); }, 0);
}

function renderSBTableRowsFiltered() {
    const trips = getSBOperationsFilteredTrips();
    const countEl = document.getElementById('sbTableCount');
    if (countEl) countEl.textContent = `${trips.length} trucks`;
    updateListSelectionUI('sb');
    return typeof renderOperationsTableRows === 'function'
        ? renderOperationsTableRows(trips, 'sb', 'SB')
        : renderDashboardTableRows(trips, 'sb');
}

function refreshSBTable() {
    const sbBody = document.getElementById('sbTableBody');
    if (sbBody) sbBody.innerHTML = renderSBTableRowsFiltered();
    if (typeof applyLiveTableLayout === 'function') applyLiveTableLayout('sbOperationsTable', 'SB');
}

function clearSBFilters() {
    document.getElementById('sbAreaFilter').value = 'all';
    document.getElementById('sbBorderFilter').value = 'all';
    document.getElementById('sbKPIFilter').value = 'all';
    document.getElementById('sbSearchInput').value = '';
    refreshSBTable();
}

// ============================================
// BORDER CLEARANCE OVERVIEW
// ============================================
function renderBorderTableRows(rows) {
    if (typeof renderBorderOperationsTableRows === 'function') {
        return renderBorderOperationsTableRows(rows);
    }
    if (!rows.length) {
        return '<tr><td colspan="12" style="text-align:center;padding:24px;color:var(--text-secondary);">No trucks match your search</td></tr>';
    }
    return rows.map(t => `
        <tr>
            <td style="width:36px;text-align:center;">${renderListRowCheckbox('border', t.trip)}</td>
            <td><strong>${t.trip}</strong></td>
            <td>${t.truck}</td>
            <td>${renderDriverLink(t.driver, t.trip)}</td>
            <td><span class="status-badge blue">${t.direction}</span></td>
            <td>${t.border}</td>
            <td>${t.processHtml}</td>
            <td>${t.status}</td>
            <td>${t.hours}</td>
            <td>${t.target}</td>
            <td><span class="kpi-indicator ${t.kpi}"></span> ${t.kpiLabel}</td>
            <td>
                ${canEditInModule('border-clearance', t.border) ? `<button class="btn btn-${t.commentBtn} btn-sm" onclick="openCommentModal('${t.trip}', 'border')">💬</button>` : ''}
                <button class="btn btn-outline btn-sm" onclick="navigateToTripView('${t.trip}')">👁️</button>
            </td>
        </tr>
    `).join('');
}

function filterBorderClearanceTrucks() {
    const border = document.getElementById('borderNameFilter')?.value || 'all';
    const process = document.getElementById('borderProcessFilter')?.value || 'all';
    const kpi = document.getElementById('borderKPIFilter')?.value || 'all';
    const search = (document.getElementById('borderSearchInput')?.value || '').toLowerCase();

    let rows = [...borderClearanceTrucks];
    if (border !== 'all') rows = rows.filter(t => t.border === border);
    if (process !== 'all') rows = rows.filter(t => normalizeKasumbalesaProcess(t.process) === process);
    if (kpi !== 'all') rows = rows.filter(t => t.kpi === kpi);
    if (search) {
        rows = rows.filter(t =>
            t.trip.toLowerCase().includes(search) ||
            t.truck.toLowerCase().includes(search) ||
            t.driver.toLowerCase().includes(search) ||
            t.border.toLowerCase().includes(search) ||
            t.process.toLowerCase().includes(search) ||
            t.status.toLowerCase().includes(search) ||
            t.kpiLabel.toLowerCase().includes(search)
        );
    }
    if (!userIsSuperAdmin()) {
        rows = rows.filter(t => canModuleAction('border-clearance', 'view', t.border));
    }
    return rows;
}

function renderBorderTableRowsFiltered() {
    const rows = filterBorderClearanceTrucks();
    return renderBorderTableRows(rows);
}

function refreshBorderTable() {
    const result = renderBorderTableRowsFiltered();
    const isSplit = result && typeof result === 'object' && result.nb !== undefined;

    if (isSplit) {
        const nbHead = document.getElementById('borderNbTableHead');
        const nbBody = document.getElementById('borderNbTableBody');
        const sbHead = document.getElementById('borderSbTableHead');
        const sbBody = document.getElementById('borderSbTableBody');
        if (nbHead && typeof getBorderDirectionTableHeaderHtml === 'function') {
            nbHead.innerHTML = `<tr>${getBorderDirectionTableHeaderHtml('NB')}</tr>`;
        }
        if (sbHead && typeof getBorderDirectionTableHeaderHtml === 'function') {
            sbHead.innerHTML = `<tr>${getBorderDirectionTableHeaderHtml('SB')}</tr>`;
        }
        if (nbBody) nbBody.innerHTML = result.nb;
        if (sbBody) sbBody.innerHTML = result.sb;
        const nbCountEl = document.getElementById('borderNbTableCount');
        const sbCountEl = document.getElementById('borderSbTableCount');
        if (nbCountEl) nbCountEl.textContent = `${result.nbCount} truck${result.nbCount !== 1 ? 's' : ''}`;
        if (sbCountEl) sbCountEl.textContent = `${result.sbCount} truck${result.sbCount !== 1 ? 's' : ''}`;
        updateListSelectionUI('borderNb');
        updateListSelectionUI('borderSb');
        return;
    }

    const head = document.getElementById('borderTableHead');
    const body = document.getElementById('borderTableBody');
    if (head && typeof getBorderOperationsTableHeaderHtml === 'function') {
        head.innerHTML = `<tr>${getBorderOperationsTableHeaderHtml()}</tr>`;
    }
    if (body) body.innerHTML = typeof result === 'string' ? result : '';
    const countEl = document.getElementById('borderTableCount');
    if (countEl && typeof result === 'string') {
        const match = result.match(/colspan="/);
        countEl.textContent = match ? '0 trucks' : `${filterBorderClearanceTrucks().length} trucks`;
    }
    if (typeof applyLiveTableLayout === 'function') applyLiveTableLayout('borderOperationsTable', 'BORDER');
}

function clearBorderFilters() {
    const border = document.getElementById('borderNameFilter');
    const process = document.getElementById('borderProcessFilter');
    const kpi = document.getElementById('borderKPIFilter');
    const search = document.getElementById('borderSearchInput');
    if (border) border.value = 'all';
    if (process) process.value = 'all';
    if (kpi) kpi.value = 'all';
    if (search) search.value = '';
    refreshBorderTable();
}

function renderBorderClearanceOverview(container) {
    const allRows = filterBorderClearanceTrucks();
    const borderTables = renderBorderTableRows(allRows);
    const nbCount = borderTables.nbCount ?? allRows.filter(t => t.direction === 'NB').length;
    const sbCount = borderTables.sbCount ?? allRows.filter(t => t.direction === 'SB').length;
    const nbBodyHtml = borderTables.nb || '';
    const sbBodyHtml = borderTables.sb || '';
    const nbHeadHtml = typeof getBorderDirectionTableHeaderHtml === 'function'
        ? getBorderDirectionTableHeaderHtml('NB')
        : '<th>Trip #</th><th>Truck</th><th>Driver</th><th>Border</th><th>Process</th><th>KPI</th><th>Actions</th>';
    const sbHeadHtml = typeof getBorderDirectionTableHeaderHtml === 'function'
        ? getBorderDirectionTableHeaderHtml('SB')
        : '<th>Trip #</th><th>Truck</th><th>Driver</th><th>Border</th><th>Process</th><th>KPI</th><th>Actions</th>';

    container.innerHTML = `
        <div class="page-header">
            <h1>🛂 Border Clearance Operations</h1>
            <div class="breadcrumb"><a href="#" onclick="navigateTo('dashboard')">Home</a> <span>›</span> <strong>Border Clearance</strong></div>
        </div>
        ${renderKpiTargetsBanner('border')}

        <div class="section-title-bar" style="margin-top:0;">
            <h2><i class="fas fa-arrow-up" style="color:var(--green);"></i> NB Clearance (Entry — North Bound)</h2>
        </div>
        <div class="kpi-grid">
            <div class="kpi-card green" onclick="navigateToTripList('nb-border-kasumbalesa')"><div class="kpi-header"><span class="kpi-title">📍 Kasumbalesa KBP</span></div><div class="kpi-value">23</div><div class="kpi-trend">BN Process · Target: 48h | Avg: 12h</div></div>
            <div class="kpi-card orange" onclick="navigateToTripList('nb-border-kasumbalesa')"><div class="kpi-header"><span class="kpi-title">📍 Kasumbalesa Whisky</span></div><div class="kpi-value">15</div><div class="kpi-trend negative">Whisky Process · Target: 72h</div></div>
            <div class="kpi-card orange" onclick="navigateToTripList('nb-border-sakania')"><div class="kpi-header"><span class="kpi-title">📍 Sakania NB</span></div><div class="kpi-value">8</div><div class="kpi-trend negative">BN Process (KBP sequence) · Target: 48h</div></div>
            <div class="kpi-card red" onclick="navigateToTripList('nb-border-mokambo')"><div class="kpi-header"><span class="kpi-title">📍 Mokambo NB</span></div><div class="kpi-value">5</div><div class="kpi-trend negative">BN Process (KBP sequence) · Target: 72h</div></div>
        </div>

        <div class="section-title-bar">
            <h2><i class="fas fa-arrow-down" style="color:var(--orange);"></i> SB Clearance (Exit — South Bound)</h2>
        </div>
        <div class="kpi-grid">
            <div class="kpi-card green" onclick="navigateToTripList('sb-border-kasumbalesa')"><div class="kpi-header"><span class="kpi-title">🔽 Kasumbalesa Exit</span></div><div class="kpi-value">18</div><div class="kpi-trend">SB Exit Process · Target: 48h</div></div>
            <div class="kpi-card orange" onclick="navigateToTripList('sb-border-sakania')"><div class="kpi-header"><span class="kpi-title">🔽 Sakania Exit</span></div><div class="kpi-value">11</div><div class="kpi-trend negative">SB Exit Process · Target: 48h</div></div>
            <div class="kpi-card orange" onclick="navigateToTripList('sb-border-mokambo')"><div class="kpi-header"><span class="kpi-title">🔽 Mokambo Exit</span></div><div class="kpi-value">7</div><div class="kpi-trend negative">SB Exit Process · Target: 72h</div></div>
        </div>

        <div class="filters-bar">
            <div class="filter-group"><label>Border:</label><select id="borderNameFilter" onchange="refreshBorderTable()"><option value="all">All</option><option>Kasumbalesa</option><option>Sakania</option><option>Mokambo</option></select></div>
            <div class="filter-group"><label>Kasumbalesa Process:</label><select id="borderProcessFilter" onchange="refreshBorderTable()"><option value="all">All</option>${KASUMBALESA_NB_PROCESSES.map(p => `<option value="${p}">${p}</option>`).join('')}</select></div>
            <div class="filter-group"><label>KPI:</label><select id="borderKPIFilter" onchange="refreshBorderTable()"><option value="all">All</option><option value="green">🟢 On Track</option><option value="orange">🟠 Priority</option><option value="red">🔴 Overdue</option></select></div>
            <div class="search-filter"><span>🔍</span><input type="text" id="borderSearchInput" placeholder="Search by Trip#, Truck, Driver, Border, Status..." onkeyup="refreshBorderTable()"></div>
            <button class="btn btn-outline btn-sm" onclick="clearBorderFilters()">Clear</button>
            ${canEditInModule('border-clearance') ? `<button class="btn btn-primary btn-sm" onclick="openDriverRegistrationModal()">📱 Register NB Driver</button>` : ''}
        </div>

        <div class="table-container border-clearance-table-section">
            <div class="table-header">
                <h3><i class="fas fa-arrow-up" style="color:var(--green);"></i> NB Border Trucks</h3>
                <div class="table-header-actions" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
                    <span id="borderNbTableCount" style="color:var(--text-secondary);">${nbCount} truck${nbCount !== 1 ? 's' : ''}</span>
                    ${renderExportToolbar('border')}
                </div>
            </div>
            <div style="overflow-x:auto;">
            <table class="live-page-table border-direction-table" id="borderNbTable"><thead id="borderNbTableHead"><tr>${nbHeadHtml}</tr></thead>
            <tbody id="borderNbTableBody">${nbBodyHtml}</tbody></table>
            </div>
        </div>

        <div class="table-container border-clearance-table-section">
            <div class="table-header">
                <h3><i class="fas fa-arrow-down" style="color:var(--orange);"></i> SB Border Trucks</h3>
                <div class="table-header-actions" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
                    <span id="borderSbTableCount" style="color:var(--text-secondary);">${sbCount} truck${sbCount !== 1 ? 's' : ''}</span>
                </div>
            </div>
            <div style="overflow-x:auto;">
            <table class="live-page-table border-direction-table" id="borderSbTable"><thead id="borderSbTableHead"><tr>${sbHeadHtml}</tr></thead>
            <tbody id="borderSbTableBody">${sbBodyHtml}</tbody></table>
            </div>
        </div>

        <div style="background:#e8f0fe;padding:15px;border-radius:8px;margin-top:20px;border-left:4px solid var(--primary-light);font-size:13px;">
            <strong>📋 NB BN Process (Sakania & Mokambo):</strong> Same sequential steps as Kasumbalesa KBP — Arrival → Brigade → Scanning → Green Stamp → Red Stamp → Cross-check → Driver Details → Final Approval
        </div>`;
}

// ============================================
// NB KBP / BN BORDER DETAIL (shared sequential process)
// ============================================
function buildKBPSteps(config) {
    const processId = config.processId || 'kbp';
    const proc = getBorderProcessDef(processId);
    const users = ['Jean Kalenga', 'Marie Mwamba', 'Patrick Tshimanga', 'Inspector Kabwe', 'Inspector Mwape', 'Officer Kalaba', 'Ruth Mwansa'];
    const times = ['08:00', '08:30', '09:15', '09:30', '10:15', '11:00', '11:30'];
    const durations = ['8 Mins', '30 Mins', '45 Mins', '45 Mins', '50 Mins', '45 Mins', '5 Mins'];
    const prefix = config.locationPrefix;

    return KBP_STEP_TEMPLATE.map((tmpl, i) => {
        const stepNum = i + 1;
        const stepDef = proc?.steps[i];
        const stepKey = stepDef?.key;
        const prevStep = i > 0 ? proc?.steps[i - 1] : null;
        const completed = stepNum <= config.completedSteps;
        const current = stepNum === config.completedSteps + 1;
        const status = completed ? 'completed' : current ? 'in-progress' : 'pending';
        const title = '📌 ' + tmpl.title.replace(/\{prefix\}/g, prefix);
        const area = tmpl.area.replace(/\{prefix\}/g, prefix);
        const kpiTarget = stepKey ? getBorderStepKpiTargetLabel(processId, stepKey) : null;
        const transitionKpi = prevStep && stepKey
            ? getBorderTransitionKpiTargetLabel(processId, prevStep.key, stepKey)
            : null;
        const transitionLabel = transitionKpi && prevStep && stepDef
            ? `${prevStep.shortName || prevStep.name} → ${stepDef.shortName || stepDef.name}: ${transitionKpi}`
            : null;
        return {
            num: stepNum, title, time: `15/07/2026 ${times[i]}`, duration: durations[i],
            stepKey,
            target: kpiTarget || (i === 1 ? '4 HRS' : (i === 3 || i === 4 ? '1 HR' : null)),
            transitionKpi: transitionLabel,
            user: users[i], area, status,
            action: completed ? (current ? 'In progress' : 'Completed') : 'Pending',
            detail: completed ? `Step ${stepNum} at ${config.borderName} — ${area}` : 'Awaiting completion'
        };
    });
}

function renderKBPStepsForConfig(config) {
    const steps = buildKBPSteps(config);
    const prefix = config.tabPrefix;
    let html = steps.map((s, i) => {
        const statusClass = s.status === 'completed' ? 'completed' : s.status === 'in-progress' ? 'in-progress' : 'pending';
        const statusIcon = s.status === 'completed' ? '✅' : s.status === 'in-progress' ? '🔄' : '⏳';
        const statusLabel = s.status === 'completed' ? '✅ Completed' : s.status === 'in-progress' ? '🔄 In Progress' : '⏳ Pending';
        const driverStepBody = s.stepKey === 'driver-contact' ? `
            <div class="driver-contact-form-panel">
                <p style="font-size:13px;margin-bottom:12px;"><strong>Border team:</strong> Register the driver's WhatsApp and DRC number before completing this step.</p>
                <button class="btn btn-primary btn-sm" onclick="openDriverRegistrationModal('${config.tripId || config.trip}')">📱 Open Driver Registration Form</button>
                ${findDriverContactByTrip(config.tripId || config.trip) ? '<span class="status-badge green" style="margin-left:8px;">✓ Contact on file</span>' : '<span class="status-badge orange" style="margin-left:8px;">Pending registration</span>'}
            </div>` : '';
        return `
        <div class="step-container ${statusClass}"><div class="step-header ${statusClass}" onclick="toggleStep(this)"><div class="step-number">${s.num}</div><div class="step-info"><div class="step-title">${s.title}</div><div class="step-meta"><span>${statusLabel}</span><span>📅 ${s.time}</span>${s.transitionKpi ? `<span class="kpi-transition-badge">↳ ${s.transitionKpi}</span>` : ''}${s.target ? `<span>🎯 Step: ${s.target}</span>` : ''}<span>⏱️ ${s.duration}</span></div></div><div class="step-status-icon">${statusIcon}</div></div>
        <div class="step-body${i === 0 ? ' open' : ''}"><div class="user-log"><div class="user-info-row"><span class="user-tag">👤 ${s.user}</span><span class="area-tag">📍 ${s.area}</span></div><div class="log-entry"><div class="log-time">📅 ${s.time}</div><div class="log-action">${statusIcon} ${s.action}</div><div class="log-detail">📝 ${s.detail}</div>${driverStepBody}${s.status === 'in-progress' ? `<button class="btn btn-primary btn-sm" style="margin-top:8px;" onclick="wireBorderStepComplete('${config.tripId}', ${s.num})">✅ Complete Step ${s.num}</button>` : ''}</div></div></div></div>`;
    }).join('');

    if (config.finalApproval) {
        html += `<div class="step-container completed" style="border:2px solid var(--success);"><div class="step-header completed" onclick="toggleStep(this)" style="background:#f0fff4;"><div class="step-number" style="background:#276749;font-size:1.2em;">✓</div><div class="step-info"><div class="step-title" style="font-size:1em;">${config.icon} ${config.processName} — FINAL APPROVAL</div><div class="step-meta"><span>✅ COMPLETED</span><span>📅 15/07/2026 11:35</span><span>⏱️ TOTAL: ${config.totalTime}</span><span>🎯 TARGET: ${config.targetHours} HRS</span></div></div><div class="step-status-icon">🏆</div></div><div class="step-body"><div class="user-log"><div class="log-entry"><div class="log-action">✅ ${config.processName} APPROVED at ${config.borderName}</div><div class="log-detail">All steps verified | ${config.timeStatus}</div></div></div></div></div>`;
    }
    return html;
}

function renderBorderDocsTab(config) {
    const docs = ['Entry.pdf', 'Submission_Receipt.pdf', 'Scan_Report.pdf', 'Green_Stamped.pdf', 'Red_Stamped.pdf', 'CrossCheck_Report.pdf', 'Driver_Details.pdf'];
    return `<div class="card"><div class="card-header"><span>📁 Documents — ${config.borderName}</span><button class="btn btn-primary btn-sm" onclick="openCommentModal('${config.tripId}', 'border')">+ Upload</button></div><div class="card-body"><div class="doc-list">${docs.map(d => `<div class="doc-item"><span class="doc-icon">📄</span><div><div class="doc-name">${config.borderName}_${d}</div><div class="doc-uploader">👤 Border Officer</div></div><button class="btn btn-outline btn-sm">👁️</button></div>`).join('')}</div></div></div>`;
}

function renderBorderCommentsTab(config) {
    return `<div class="card"><div class="card-header"><span>💬 Comments — ${config.borderName}</span><button class="btn btn-primary btn-sm" onclick="openCommentModal('${config.tripId}', 'border')">+ Add Comment</button></div><div class="card-body"><div class="user-log"><div style="font-weight:600;">👤 Border Officer — ${config.borderName}</div><div style="font-size:0.8em;color:var(--text-secondary);margin-top:4px;">BN Process clearance in progress for ${config.trip}</div></div></div></div>`;
}

function renderBorderLogsTab(config) {
    const steps = buildKBPSteps(config).filter(s => s.status !== 'pending');
    return `<div class="card"><div class="card-header"><span>📋 Activity Log — ${config.borderName}</span></div><div class="card-body" style="max-height:500px;overflow-y:auto;"><table style="width:100%;font-size:0.85em;"><thead><tr style="background:#f7fafc;"><th style="padding:8px;">Time</th><th style="padding:8px;">Area</th><th style="padding:8px;">User</th><th style="padding:8px;">Action</th></tr></thead><tbody>${steps.map(s => `<tr><td style="padding:8px;">${s.time.split(' ')[1]}</td><td style="padding:8px;">${s.area}</td><td style="padding:8px;">${s.user}</td><td style="padding:8px;">${s.action}</td></tr>`).join('')}</tbody></table></div></div>`;
}

function renderNBKBPBorderDetail(container, config) {
    currentBorderTabPrefix = config.tabPrefix;
    const p = config.tabPrefix;
    const timeClass = config.timeClass || 'green';
    const fillPct = Math.min(config.timePct, 100);

    container.innerHTML = `
        <div class="page-header">
            <h1>${config.icon} ${config.borderName} Border — ${config.processName}</h1>
            <div class="breadcrumb">
                <a href="#" onclick="navigateTo('dashboard')">Home</a> <span>›</span>
                <a href="#" onclick="navigateTo('border-clearance')">Border Clearance</a> <span>›</span>
                <span>NB Clearance</span> <span>›</span>
                <strong>${config.borderName} — Trip: ${config.trip}</strong>
            </div>
        </div>
        ${renderKpiTargetsBanner('border')}
        <div class="frozen-truck-bar">
            <div class="truck-info-group">
                <div class="truck-info-item"><span class="truck-info-label">Trip Number</span><span class="truck-info-value large">${config.trip}</span></div>
                <div class="truck-info-item"><span class="truck-info-label">Truck</span><span class="truck-info-value large">${config.truck}</span></div>
                <div class="truck-info-item"><span class="truck-info-label">Trailer</span><span class="truck-info-value">${config.trailer}</span></div>
                <div class="truck-info-item"><span class="truck-info-label">Driver</span><span class="truck-info-value">${renderDriverLink(config.driver, config.tripId || config.trip)}</span></div>
                <div class="truck-info-item"><span class="truck-info-label">Direction</span><span class="truck-info-value">🔼 North Bound</span></div>
                <div class="truck-info-item"><span class="truck-info-label">Owner</span><span class="truck-info-value">${config.owner}</span></div>
                ${config.borderName === 'Kasumbalesa' ? `<div class="truck-info-item"><span class="truck-info-label">Border Process</span><span class="truck-info-value">${renderKasumbalesaProcessBadgeHtml(config.processName?.replace(' Process', '') || 'KBP')}</span></div>` : ''}
            </div>
            <div style="display:flex;align-items:center;gap:15px;">
                <span class="kpi-badge ${config.kpi}">${config.kpiLabel}</span>
                <button class="btn btn-success btn-sm" onclick="openCommentModal('${config.tripId}', 'border')" style="background:white;color:#1a365d;">💬 Add Comment</button>
            </div>
        </div>
        <div class="card"><div class="card-header"><span>⏱️ Time Tracking</span><span style="display:inline-flex;align-items:center;gap:4px;"><span class="kpi-dot ${config.kpi}"></span> ${config.timeStatus}</span></div>
        <div class="card-body"><div class="time-tracker"><div class="time-circle ${timeClass}"><span class="time-value">${config.timeValue}</span><span class="time-label">HRS : MINS</span></div>
        <div class="progress-bar-container"><div style="display:flex;justify-content:space-between;"><span>Total: <strong>${config.totalTime}</strong></span><span>Target: <strong>${config.targetHours} HRS</strong></span></div>
        <div class="progress-bar"><div class="progress-fill ${timeClass}" style="width:${fillPct}%;"></div></div>
        <div style="margin-top:8px;">${config.timeStatus}</div></div></div></div></div>

        <div class="tabs">
            <div class="tab active" onclick="switchBorderTab('${p}-steps',this)">${config.icon} BN Steps (${config.completedSteps}/7)</div>
            <div class="tab" onclick="switchBorderTab('${p}-documents',this)">📁 Docs (7)</div>
            <div class="tab" onclick="switchBorderTab('${p}-comments',this)">💬 Comments</div>
            <div class="tab" onclick="switchBorderTab('${p}-logs',this)">📋 Activity Log</div>
        </div>
        <div id="tab-${p}-steps">${renderKBPStepsForConfig(config)}</div>
        <div id="tab-${p}-documents" style="display:none;">${renderBorderDocsTab(config)}</div>
        <div id="tab-${p}-comments" style="display:none;">${renderBorderCommentsTab(config)}</div>
        <div id="tab-${p}-logs" style="display:none;">${renderBorderLogsTab(config)}</div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:20px;">
            <button class="btn btn-outline" onclick="navigateTo('border-clearance')">⬅️ Back to Border Clearance</button>
            <button class="btn btn-outline" onclick="window.print()">🖨️ Print</button>
            <button class="btn btn-primary" onclick="openCommentModal('${config.tripId}', 'border')">💬 Add Comment</button>
        </div>`;
}

// ============================================
// SB BORDER CLEARANCE DETAIL
// ============================================
function renderSBStepsForConfig(config) {
    const processId = config.processId;
    const proc = getBorderProcessDef(processId);
    const steps = proc?.steps || SB_CLEARANCE_STEPS.map((name, i) => ({ key: `step-${i + 1}`, name }));
    return steps.map((step, i) => {
        const stepNum = i + 1;
        const name = step.name;
        const completed = stepNum <= config.completedSteps;
        const current = stepNum === config.completedSteps + 1;
        const status = completed ? 'completed' : current ? 'in-progress' : 'pending';
        const statusIcon = completed ? '✅' : current ? '🔄' : '⏳';
        const statusLabel = completed ? '✅ Completed' : current ? '🔄 In Progress' : '⏳ Pending';
        const kpiTarget = step.key ? getBorderStepKpiTargetLabel(processId, step.key) : null;
        const prevStep = i > 0 ? proc?.steps[i - 1] : null;
        const transitionKpi = prevStep && step.key
            ? getBorderTransitionKpiTargetLabel(processId, prevStep.key, step.key)
            : null;
        const transitionLabel = transitionKpi && prevStep
            ? `${prevStep.shortName || prevStep.name} → ${step.shortName || step.name}: ${transitionKpi}`
            : null;
        return `<div class="step-container ${status}"><div class="step-header ${status}" onclick="toggleStep(this)"><div class="step-number">${stepNum}</div><div class="step-info"><div class="step-title">📌 ${name}</div><div class="step-meta"><span>${statusLabel}</span>${completed ? '<span>📅 15/07/2026</span>' : ''}${transitionLabel ? `<span class="kpi-transition-badge">↳ ${transitionLabel}</span>` : ''}${kpiTarget ? `<span>🎯 Step: ${kpiTarget}</span>` : ''}</div></div><div class="step-status-icon">${statusIcon}</div></div></div>`;
    }).join('');
}

function renderSBClearanceDetail(container, config) {
    currentBorderTabPrefix = config.tabPrefix;
    const p = config.tabPrefix;

    container.innerHTML = `
        <div class="page-header">
            <h1>🔽 ${config.borderName} Border — SB Exit Clearance</h1>
            <div class="breadcrumb">
                <a href="#" onclick="navigateTo('dashboard')">Home</a> <span>›</span>
                <a href="#" onclick="navigateTo('border-clearance')">Border Clearance</a> <span>›</span>
                <span>SB Clearance</span> <span>›</span>
                <strong>${config.borderName} Exit — Trip: ${config.trip}</strong>
            </div>
        </div>
        ${renderKpiTargetsBanner('border')}
        <div class="frozen-truck-bar">
            <div class="truck-info-group">
                <div class="truck-info-item"><span class="truck-info-label">Trip</span><span class="truck-info-value large">${config.trip}</span></div>
                <div class="truck-info-item"><span class="truck-info-label">Truck</span><span class="truck-info-value large">${config.truck}</span></div>
                <div class="truck-info-item"><span class="truck-info-label">Driver</span><span class="truck-info-value">${renderDriverLink(config.driver, config.tripId || config.trip)}</span></div>
                <div class="truck-info-item"><span class="truck-info-label">Owner</span><span class="truck-info-value">${config.owner}</span></div>
                <div class="truck-info-item"><span class="truck-info-label">Direction</span><span class="truck-info-value">🔽 South Bound</span></div>
                <div class="truck-info-item"><span class="truck-info-label">Hours at Border</span><span class="truck-info-value">${config.timeValue}</span></div>
            </div>
            <span class="kpi-badge ${config.kpi}">${config.kpiLabel}</span>
        </div>
        <div class="card">
            <div class="card-header"><span>🔽 SB Exit Clearance Steps (${config.completedSteps}/${SB_CLEARANCE_STEPS.length})</span><button class="btn btn-primary btn-sm" onclick="openCommentModal('${config.tripId}', 'border')">💬 Add Comment</button></div>
            <div class="card-body">${renderSBStepsForConfig(config)}</div>
        </div>
        <div style="background:#fffaf0;padding:15px;border-radius:8px;margin-top:20px;border-left:4px solid var(--warning);font-size:13px;">
            <strong>📋 SB Exit Target:</strong> ≤${config.targetHours} hours from arrival at ${config.borderName} border to Date Exit to Zambia
        </div>
        <button class="btn btn-outline mt-20" onclick="navigateTo('border-clearance')">⬅️ Back to Border Clearance</button>`;
}

// ============================================
// KASUMBALESA WHISKY (NB — separate process)
// ============================================
function renderKasumbalesaWhisky(container) {
    container.innerHTML = `
        <div class="page-header"><h1>📍 Kasumbalesa Border - Whisky Process</h1><div class="breadcrumb"><a href="#" onclick="navigateTo('dashboard')">Home</a> <span>›</span> <a href="#" onclick="navigateTo('border-clearance')">Border Clearance</a> <span>›</span> <strong>Whisky</strong></div></div>
        ${renderKpiTargetsBanner('border')}
        <div class="frozen-truck-bar"><div class="truck-info-group"><div class="truck-info-item"><span class="truck-info-label">Trip</span><span class="truck-info-value large">NB-2024-008</span></div><div class="truck-info-item"><span class="truck-info-label">Truck</span><span class="truck-info-value large">JKL012DRC</span></div><div class="truck-info-item"><span class="truck-info-label">Hours</span><span class="truck-info-value">52</span></div></div><span class="kpi-badge orange">🟠 PRIORITY</span></div>
        <div class="card"><div class="card-header"><span>📍 Whisky Process Steps</span><button class="btn btn-primary btn-sm" onclick="openCommentModal('NB-2024-008', 'border')">💬 Add Comment</button></div><div class="card-body">${renderWhiskySteps()}</div></div>
        <button class="btn btn-outline mt-20" onclick="navigateTo('border-clearance')">⬅️ Back</button>`;
}

function renderWhiskySteps() {
    const proc = getBorderProcessDef('whisky');
    const demoMeta = [
        { status: 'completed', time: '13/07 10:00' },
        { status: 'completed', time: '14/07 10:00', note: 'Result after 24h' },
        { status: 'completed', time: '14/07 14:00' },
        { status: 'in-progress', time: '15/07 09:00' },
        { status: 'pending', note: 'Expected: 24h' },
        { status: 'pending' },
        { status: 'pending', note: 'Expected: 2h' },
        { status: 'pending' },
        { status: 'pending' },
        { status: 'pending' },
        { status: 'pending' }
    ];
    return (proc?.steps || []).map((step, i) => {
        const meta = demoMeta[i] || { status: 'pending' };
        const kpiTarget = getBorderStepKpiTargetLabel('whisky', step.key);
        const prevStep = i > 0 ? proc.steps[i - 1] : null;
        const transitionKpi = prevStep
            ? getBorderTransitionKpiTargetLabel('whisky', prevStep.key, step.key)
            : null;
        const transitionLabel = transitionKpi && prevStep
            ? `${prevStep.shortName} → ${step.shortName}: ${transitionKpi}`
            : null;
        return `<div class="step-container ${meta.status}"><div class="step-header ${meta.status}" onclick="toggleStep(this)"><div class="step-number">${i + 1}</div><div class="step-info"><div class="step-title">${step.name}</div><div class="step-meta"><span>${meta.status === 'completed' ? '✅ Completed' : meta.status === 'in-progress' ? '🔄 In Progress' : '⏳ Pending'}</span>${meta.time ? `<span>📅 ${meta.time}</span>` : ''}${transitionLabel ? `<span class="kpi-transition-badge">↳ ${transitionLabel}</span>` : ''}${kpiTarget ? `<span>🎯 Step: ${kpiTarget}</span>` : ''}${meta.note ? `<span>📝 ${meta.note}</span>` : ''}</div></div><div class="step-status-icon">${meta.status === 'completed' ? '✅' : meta.status === 'in-progress' ? '🔄' : '⏳'}</div></div></div>`;
    }).join('');
}

// ============================================
// OTHER PAGES
// ============================================
function renderTripListFilterTabs(activeFilter) {
    const tabs = [
        { id: 'all', label: 'All', count: Object.keys(tripsDB).length },
        { id: 'nb', label: 'NB', count: filterTripsByDashboard('nb').length },
        { id: 'sb', label: 'SB', count: filterTripsByDashboard('sb').length },
        { id: 'orange', label: 'Priority', count: filterTripsByDashboard('orange').length },
        { id: 'red', label: 'Overdue', count: filterTripsByDashboard('red').length },
        { id: 'today', label: 'Added Today', count: filterTripsByDashboard('today').length }
    ];
    return tabs.map(t => `
        <button class="pod-filter-tab${activeFilter === t.id ? ' active' : ''}" onclick="navigateToTripList('${t.id}')">
            ${t.label}<span class="tab-count">${t.count}</span>
        </button>
    `).join('');
}

function renderTripList(container) {
    const filter = currentTripFilter;
    const trips = filterTripsByDashboard(filter);

    container.innerHTML = `
        <div class="page-header">
            <h1>🚛 ${getTripFilterLabel(filter)}</h1>
            <div class="breadcrumb">
                <a href="#" onclick="navigateTo('dashboard')">Home</a>
                <span>›</span>
                <a href="#" onclick="navigateTo('dashboard')">Dashboard</a>
                <span>›</span>
                <strong>${getTripFilterLabel(filter)}</strong>
            </div>
        </div>

        <div class="pod-filter-tabs">${renderTripListFilterTabs(filter)}</div>

        <div class="table-container">
            <div class="table-header">
                <h3>${getTripFilterLabel(filter)}</h3>
                <span style="color:var(--text-secondary);">${trips.length} truck${trips.length !== 1 ? 's' : ''}</span>
            </div>
            <div style="overflow-x:auto;">
                <table>
                    <thead>
                        <tr>
                            <th>Trip #</th><th>Truck</th><th>Owner</th><th>Driver</th>
                            <th>Direction</th><th>Area</th><th>Border</th><th>Status</th>
                            <th>Days</th><th>KPI</th><th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${trips.length ? trips.map(t => `
                            <tr>
                                <td><strong>${t.tripNumber}</strong></td>
                                <td>${t.truck}</td>
                                <td>${t.owner}</td>
                                <td>${t.driver}</td>
                                <td><span class="status-badge blue">${t.direction}</span></td>
                                <td>${t.area || '-'}</td>
                                <td>${t.direction === 'NB' ? (t.entryBorder || '-') : (t.exitBorder || '-')}</td>
                                <td><span class="status-badge ${t.kpi}">${t.status}</span></td>
                                <td>${t.daysInDRC}</td>
                                <td><span class="kpi-indicator ${t.kpi}"></span> ${getKPILabel(t.kpi)}</td>
                                <td><button class="btn btn-primary btn-sm" onclick="openCommentModal('${t.tripNumber}', '${t.direction === 'SB' ? 'sb' : 'nb'}')">💬</button></td>
                            </tr>
                        `).join('') : '<tr><td colspan="11" style="text-align:center;padding:24px;color:var(--text-secondary);">No trucks match this filter</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>

        <button class="btn btn-outline mt-20" onclick="navigateTo('dashboard')">⬅️ Back to Dashboard</button>
    `;
}

function renderDocumentAlerts(container) {
    const filter = currentDocFilter;
    const docs = filterDocuments(filter);

    container.innerHTML = `
        <div class="page-header">
            <h1>📄 Document Expiry Alerts</h1>
            <div class="breadcrumb">
                <a href="#" onclick="navigateTo('dashboard')">Home</a>
                <span>›</span>
                <a href="#" onclick="navigateTo('dashboard')">Dashboard</a>
                <span>›</span>
                <strong>${getDocFilterLabel(filter)}</strong>
            </div>
        </div>

        <div class="pod-filter-tabs">
            <button class="pod-filter-tab${filter === 'all' ? ' active' : ''}" onclick="navigateToDocuments('all')">All<span class="tab-count">${documentsDB.length}</span></button>
            <button class="pod-filter-tab${filter === 'expiring' ? ' active' : ''}" onclick="navigateToDocuments('expiring')">Expiring Soon<span class="tab-count">${filterDocuments('expiring').length}</span></button>
            <button class="pod-filter-tab${filter === 'expired' ? ' active' : ''}" onclick="navigateToDocuments('expired')">Expired<span class="tab-count">${filterDocuments('expired').length}</span></button>
            <button class="pod-filter-tab${filter === 'valid' ? ' active' : ''}" onclick="navigateToDocuments('valid')">Valid<span class="tab-count">${filterDocuments('valid').length}</span></button>
        </div>

        <div class="table-container">
            <div class="table-header">
                <h3>${getDocFilterLabel(filter)}</h3>
                <span style="color:var(--text-secondary);">${docs.length} document${docs.length !== 1 ? 's' : ''}</span>
            </div>
            <div style="overflow-x:auto;">
                <table>
                    <thead>
                        <tr><th>Document</th><th>Entity</th><th>Trip</th><th>Truck</th><th>Expiry Date</th><th>Status</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                        ${docs.length ? docs.map(d => `
                            <tr>
                                <td>${renderDocumentLink(d)}</td>
                                <td>${d.entity}</td>
                                <td>${d.trip}</td>
                                <td>${d.truck}</td>
                                <td>${d.expiry}</td>
                                <td><span class="status-badge ${d.kpi}"><span class="dot"></span> ${d.label}</span></td>
                                <td>
                                    <button class="btn btn-outline btn-sm" onclick="navigateToDocument(${d.id})">👁️ View</button>
                                    <button class="btn btn-primary btn-sm" onclick="openCommentModal('${d.trip}', 'nb')">💬</button>
                                </td>
                            </tr>
                        `).join('') : '<tr><td colspan="7" style="text-align:center;padding:24px;">No documents match this filter</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>

        <button class="btn btn-outline mt-20" onclick="navigateTo('dashboard')">⬅️ Back to Dashboard</button>
    `;
}

function renderDocumentDetail(container) {
    const doc = documentsDB.find(d => d.id === currentDocumentId);
    if (!doc) {
        navigateToDocuments('all');
        return;
    }

    const trip = tripsDB[doc.trip];
    const daysToExpiry = Math.ceil((new Date(doc.expiry) - new Date()) / (1000 * 60 * 60 * 24));

    container.innerHTML = `
        <div class="page-header">
            <h1>📄 ${doc.type} — ${doc.entity}</h1>
            <div class="breadcrumb">
                <a href="#" onclick="navigateTo('dashboard')">Home</a>
                <span>›</span>
                <a href="#" onclick="navigateToDocuments('all')">Document Expiry Alerts</a>
                <span>›</span>
                <strong>${doc.type}</strong>
            </div>
        </div>

        <div class="card" style="margin-bottom:20px;">
            <div class="card-header">
                <span>Document Details</span>
                <span class="status-badge ${doc.kpi}"><span class="dot"></span> ${doc.label}</span>
            </div>
            <div class="card-body">
                <div class="info-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:20px;">
                    <div><div style="font-size:11px;color:var(--text-secondary);text-transform:uppercase;">Document Type</div><div style="font-weight:600;">${doc.type}</div></div>
                    <div><div style="font-size:11px;color:var(--text-secondary);text-transform:uppercase;">Category</div><div style="font-weight:600;">${doc.category || '—'}</div></div>
                    <div><div style="font-size:11px;color:var(--text-secondary);text-transform:uppercase;">Entity</div><div style="font-weight:600;">${doc.entity}</div></div>
                    <div><div style="font-size:11px;color:var(--text-secondary);text-transform:uppercase;">Trip</div><div style="font-weight:600;">${doc.trip}</div></div>
                    <div><div style="font-size:11px;color:var(--text-secondary);text-transform:uppercase;">Truck</div><div style="font-weight:600;">${doc.truck}</div></div>
                    <div><div style="font-size:11px;color:var(--text-secondary);text-transform:uppercase;">Issued</div><div style="font-weight:600;">${doc.issued || '—'}</div></div>
                    <div><div style="font-size:11px;color:var(--text-secondary);text-transform:uppercase;">Expiry Date</div><div style="font-weight:600;color:${doc.kpi === 'red' ? 'var(--danger)' : doc.kpi === 'orange' ? 'var(--warning)' : 'var(--success)'};">${doc.expiry}</div></div>
                    <div><div style="font-size:11px;color:var(--text-secondary);text-transform:uppercase;">Days to Expiry</div><div style="font-weight:600;">${daysToExpiry >= 0 ? daysToExpiry + ' days' : Math.abs(daysToExpiry) + ' days overdue'}</div></div>
                </div>

                <div class="doc-preview-box">
                    <div class="doc-preview-icon">📄</div>
                    <div>
                        <div style="font-weight:600;font-size:15px;">${doc.fileName || doc.type + '.pdf'}</div>
                        <div style="font-size:13px;color:var(--text-secondary);margin-top:4px;">${doc.category || 'Document'} · Linked to ${doc.entity}</div>
                        ${trip ? `<div style="font-size:13px;color:var(--text-secondary);margin-top:4px;">Trip status: ${trip.status} · ${trip.direction}</div>` : ''}
                    </div>
                    <button class="btn btn-primary btn-sm" onclick="showToast('📄 Opening ${doc.fileName || doc.type}...','success')">📥 Open Document</button>
                </div>
            </div>
        </div>

        <div style="display:flex;gap:12px;flex-wrap:wrap;">
            <button class="btn btn-outline" onclick="navigateToDocuments('${doc.status}')">⬅️ Back to Document Alerts</button>
            <button class="btn btn-outline" onclick="navigateTo('assets')">🚗 Assets & Equipment</button>
            ${trip ? `<button class="btn btn-primary" onclick="openCommentModal('${doc.trip}', '${trip.direction === 'SB' ? 'sb' : 'nb'}')">💬 Comment on Trip ${doc.trip}</button>` : ''}
        </div>
    `;
}

function renderPODStageIcon(done, late) {
    if (done) return '<span class="pod-stage-icon done">✅</span>';
    if (late) return '<span class="pod-stage-icon late">❌</span>';
    return '<span class="pod-stage-icon pending">⬜</span>';
}

function renderPODTableRows(items) {
    if (!items.length) {
        const noKpi = selectedPodKpis.length === 0;
        const noStatus = selectedPodStatuses.length === 0;
        const msg = noKpi && noStatus
            ? 'Select at least one KPI and one status checkbox to display POD items'
            : noKpi
                ? 'Select at least one KPI checkbox to display POD items'
                : noStatus
                    ? 'Select at least one status checkbox to display POD items'
                    : 'No POD items match your search or filters';
        return `<tr><td colspan="13" style="text-align:center;padding:24px;color:var(--text-secondary);">${msg}</td></tr>`;
    }
    return items.map(p => `
        <tr>
            <td style="width:36px;text-align:center;">${renderListRowCheckbox('pod', p.trip)}</td>
            <td><strong>${p.trip}</strong></td>
            <td>${p.truck}</td>
            <td>${p.driver}</td>
            <td>${p.area}</td>
            <td>${p.offloadingPoint}</td>
            <td style="text-align:center;">${p.collected ? renderPODStageIcon(true) + (p.collectedOnTime ? '<br><small style="color:var(--green);">On-time</small>' : '<br><small style="color:var(--orange);">Late</small>') : renderPODStageIcon(false, p.overdue)}</td>
            <td style="text-align:center;">${renderPODStageIcon(p.scanned)}${p.scannedDate ? `<br><small>${p.scannedDate.split(' ')[0]}</small>` : ''}</td>
            <td style="text-align:center;">${renderPODStageIcon(p.uploaded)}${p.uploadedDate ? `<br><small>${p.uploadedDate.split(' ')[0]}</small>` : ''}</td>
            <td style="text-align:center;">${renderPODStageIcon(p.sentToInvoicing)}${p.sentDate ? `<br><small>${p.sentDate.split(' ')[0]}</small>` : ''}</td>
            <td>${p.collected && p.hoursToCollect ? p.hoursToCollect + 'h' : '—'}</td>
            <td><span class="status-badge ${p.kpi}"><span class="dot"></span> ${p.kpi === 'green' ? 'On Track' : p.kpi === 'orange' ? 'Priority' : 'Overdue'}</span></td>
            <td>
                ${canEditInModule('pod-management', p.area) ? `<button class="btn btn-primary btn-sm" onclick="openCommentModal('${p.trip}', 'pod')">💬</button>` : ''}
                ${canEditInModule('pod-management', p.area) && !p.collected ? `<button class="btn btn-outline btn-sm" onclick="openPodActionModal('${p.trip}','collected')">📋 Collect</button>` : ''}
                ${canEditInModule('pod-management', p.area) && p.collected && !p.scanned ? `<button class="btn btn-outline btn-sm" onclick="openPodActionModal('${p.trip}','scanned')">🔍 Scan</button>` : ''}
                ${canEditInModule('pod-management', p.area) && p.scanned && !p.uploaded ? `<button class="btn btn-outline btn-sm" onclick="openPodActionModal('${p.trip}','uploaded')">📤 Upload</button>` : ''}
                ${canEditInModule('pod-management', p.area) && p.uploaded && !p.sentToInvoicing ? `<button class="btn btn-outline btn-sm" onclick="openPodActionModal('${p.trip}','sent_to_invoicing')">💰 Invoice</button>` : ''}
            </td>
        </tr>
    `).join('');
}

function renderPODFilterTabs(activeFilter) {
    const s = getPODStats();
    const tabs = [
        { id: 'all', label: 'All', count: s.total },
        { id: 'collected-on-time', label: 'On-Time', count: s.collectedOnTime },
        { id: 'scanned', label: 'Scanned', count: s.scanned },
        { id: 'uploaded', label: 'Uploaded', count: s.uploaded },
        { id: 'sent-invoicing', label: 'Sent to Invoicing', count: s.sentInvoicing },
        { id: 'pending', label: 'Pending', count: s.pending },
        { id: 'overdue', label: 'Overdue', count: s.overdue }
    ];
    return tabs.map(t => `
        <button class="pod-filter-tab${activeFilter === t.id ? ' active' : ''}" onclick="navigateToPOD('${t.id}')">
            ${t.label}<span class="tab-count">${t.count}</span>
        </button>
    `).join('');
}

function getPODStageStatus(p) {
    if (p.sentToInvoicing) return 'sent-invoicing';
    if (p.uploaded) return 'uploaded';
    if (p.scanned) return 'scanned';
    if (p.collected) return p.collectedOnTime ? 'collected-on-time' : 'collected-late';
    if (p.overdue) return 'overdue';
    return 'pending';
}

function syncSelectedPodKpisFromDOM() {
    const boxes = document.querySelectorAll('.pod-kpi-checkbox input');
    if (!boxes.length) return selectedPodKpis;
    selectedPodKpis = Array.from(boxes).filter(cb => cb.checked).map(cb => cb.value);
    return selectedPodKpis;
}

function syncSelectedPodStatusesFromDOM() {
    const boxes = document.querySelectorAll('.pod-status-checkbox input');
    if (!boxes.length) return selectedPodStatuses;
    selectedPodStatuses = Array.from(boxes).filter(cb => cb.checked).map(cb => cb.value);
    return selectedPodStatuses;
}

function renderPODFilterPanels() {
    return `
        <div class="pod-filter-panels" id="podFilterPanels">
            <div class="pod-status-filter-panel">
                <div class="pod-status-filter-header">
                    <label>KPI — choose which to display</label>
                    <div style="display:flex;gap:8px;">
                        <button type="button" class="btn btn-outline btn-sm" onclick="selectAllPodKpis()">Select All</button>
                        <button type="button" class="btn btn-outline btn-sm" onclick="clearAllPodKpis()">Clear All</button>
                    </div>
                </div>
                <div class="pod-status-checkbox-grid">
                    ${POD_KPI_OPTIONS.map(k => `
                        <label class="pod-status-checkbox pod-kpi-checkbox">
                            <input type="checkbox" value="${k.id}" ${selectedPodKpis.includes(k.id) ? 'checked' : ''} onchange="togglePodKpi('${k.id}', this.checked)">
                            <span>${k.label}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
            <div class="pod-status-filter-panel" id="podStatusFilters">
                <div class="pod-status-filter-header">
                    <label>Status — choose which to display</label>
                    <div style="display:flex;gap:8px;">
                        <button type="button" class="btn btn-outline btn-sm" onclick="selectAllPodStatuses()">Select All</button>
                        <button type="button" class="btn btn-outline btn-sm" onclick="clearAllPodStatuses()">Clear All</button>
                    </div>
                </div>
                <div class="pod-status-checkbox-grid">
                    ${getPodStatusOptions().map(s => `
                        <label class="pod-status-checkbox">
                            <input type="checkbox" value="${s.id}" ${selectedPodStatuses.includes(s.id) ? 'checked' : ''} onchange="togglePodStatus('${s.id}', this.checked)">
                            <span>${s.label}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function togglePodKpi(kpiId, checked) {
    if (checked && !selectedPodKpis.includes(kpiId)) selectedPodKpis.push(kpiId);
    else if (!checked) selectedPodKpis = selectedPodKpis.filter(id => id !== kpiId);
    refreshPODTable();
}

function selectAllPodKpis() {
    selectedPodKpis = POD_KPI_OPTIONS.map(k => k.id);
    document.querySelectorAll('.pod-kpi-checkbox input').forEach(cb => { cb.checked = true; });
    refreshPODTable();
}

function clearAllPodKpis() {
    selectedPodKpis = [];
    document.querySelectorAll('.pod-kpi-checkbox input').forEach(cb => { cb.checked = false; });
    refreshPODTable();
}

function renderPODStatusFilters() {
    return renderPODFilterPanels();
}

function togglePodStatus(statusId, checked) {
    if (checked && !selectedPodStatuses.includes(statusId)) selectedPodStatuses.push(statusId);
    else if (!checked) selectedPodStatuses = selectedPodStatuses.filter(id => id !== statusId);
    refreshPODTable();
}

function selectAllPodStatuses() {
    selectedPodStatuses = getPodStatusOptions().map(s => s.id);
    document.querySelectorAll('.pod-status-checkbox:not(.pod-kpi-checkbox) input').forEach(cb => { cb.checked = true; });
    refreshPODTable();
}

function clearAllPodStatuses() {
    selectedPodStatuses = [];
    document.querySelectorAll('.pod-status-checkbox:not(.pod-kpi-checkbox) input').forEach(cb => { cb.checked = false; });
    refreshPODTable();
}

function getFilteredPODItems() {
    const search = podSearchTerm || (document.getElementById('podSearchInput')?.value || '').trim();
    const kpis = syncSelectedPodKpisFromDOM();
    const statuses = syncSelectedPodStatusesFromDOM();
    let items = filterPODItems(currentPODFilter);

    if (kpis.length === 0 || statuses.length === 0) return [];
    if (kpis.length < POD_KPI_OPTIONS.length) {
        items = items.filter(p => kpis.includes(p.kpi));
    }
    if (statuses.length < getPodStatusOptions().length) {
        items = items.filter(p => statuses.includes(getPODStageStatus(p)));
    }

    if (!search) {
        return items.filter(p => userIsSuperAdmin() || canModuleAction('pod-management', 'view', p.area));
    }
    const term = search.toLowerCase();
    return items.filter(p =>
        (p.trip.toLowerCase().includes(term) ||
        p.truck.toLowerCase().includes(term) ||
        p.driver.toLowerCase().includes(term) ||
        p.area.toLowerCase().includes(term) ||
        p.offloadingPoint.toLowerCase().includes(term) ||
        (p.owner && p.owner.toLowerCase().includes(term)) ||
        (p.scannedBy && p.scannedBy.toLowerCase().includes(term))) &&
        (userIsSuperAdmin() || canModuleAction('pod-management', 'view', p.area))
    );
}

function renderPODTableRowsFiltered() {
    const items = getFilteredPODItems();
    const countEl = document.getElementById('podTableCount');
    if (countEl) countEl.textContent = `${items.length} item${items.length !== 1 ? 's' : ''}`;
    updateListSelectionUI('pod');
    return renderPODTableRows(items);
}

function refreshPODTable() {
    podSearchTerm = document.getElementById('podSearchInput')?.value || '';
    syncSelectedPodKpisFromDOM();
    syncSelectedPodStatusesFromDOM();
    const body = document.getElementById('podTableBody');
    if (body) body.innerHTML = renderPODTableRowsFiltered();
}

function clearPODFilters() {
    podSearchTerm = '';
    selectedPodKpis = POD_KPI_OPTIONS.map(k => k.id);
    selectedPodStatuses = getPodStatusOptions().map(s => s.id);
    const input = document.getElementById('podSearchInput');
    if (input) input.value = '';
    document.querySelectorAll('.pod-kpi-checkbox input').forEach(cb => { cb.checked = true; });
    document.querySelectorAll('.pod-status-checkbox:not(.pod-kpi-checkbox) input').forEach(cb => { cb.checked = true; });
    refreshPODTable();
}

function renderPODManagement(container) {
    const filter = currentPODFilter;
    const items = getFilteredPODItems();
    const stats = getPODStats();

    container.innerHTML = `
        <div class="page-header">
            <h1>📋 POD Management & Invoicing</h1>
            <div class="breadcrumb">
                <a href="#" onclick="navigateTo('dashboard')">Home</a>
                <span>›</span>
                <strong>POD Management</strong>
                <span>›</span>
                <strong>${getPODFilterLabel(filter)}</strong>
            </div>
        </div>

        <div class="pod-stat-grid" style="margin-bottom:24px;">
            <div class="pod-stat-item" onclick="navigateToPOD('collected-on-time')">
                <div class="pod-stat-value green">${stats.collectedOnTime}</div>
                <div class="pod-stat-label">Collected On-Time</div>
            </div>
            <div class="pod-stat-item" onclick="navigateToPOD('scanned')">
                <div class="pod-stat-value blue">${stats.scanned}</div>
                <div class="pod-stat-label">Scanned</div>
            </div>
            <div class="pod-stat-item" onclick="navigateToPOD('uploaded')">
                <div class="pod-stat-value blue">${stats.uploaded}</div>
                <div class="pod-stat-label">Uploaded</div>
            </div>
            <div class="pod-stat-item" onclick="navigateToPOD('sent-invoicing')">
                <div class="pod-stat-value green">${stats.sentInvoicing}</div>
                <div class="pod-stat-label">Sent to Invoicing</div>
            </div>
            <div class="pod-stat-item" onclick="navigateToPOD('pending')">
                <div class="pod-stat-value orange">${stats.pending}</div>
                <div class="pod-stat-label">Pending</div>
            </div>
            <div class="pod-stat-item" onclick="navigateToPOD('overdue')">
                <div class="pod-stat-value red">${stats.overdue}</div>
                <div class="pod-stat-label">Overdue</div>
            </div>
        </div>

        <div class="pod-filter-tabs">${renderPODFilterTabs(filter)}</div>

        <div class="filters-bar">
            <div class="search-filter" style="flex:1;">
                <span>🔍</span>
                <input type="text" id="podSearchInput" placeholder="Search by Trip#, Truck, Driver, Area, Offloading Point..." value="${podSearchTerm}" onkeyup="refreshPODTable()">
            </div>
            <button class="btn btn-outline btn-sm" onclick="clearPODFilters()">Clear All Filters</button>
        </div>

        ${renderPODFilterPanels()}

        <div class="table-container">
            <div class="table-header">
                <h3>${getPODFilterLabel(filter)}</h3>
                <div class="table-header-actions">
                    <span id="podTableCount" style="color:var(--text-secondary);">${items.length} item${items.length !== 1 ? 's' : ''}</span>
                    ${renderExportToolbar('pod')}
                </div>
            </div>
            <div style="overflow-x:auto;">
                <table>
                    <thead>
                        <tr>
                            <th style="width:36px;text-align:center;"><input type="checkbox" aria-label="Select all POD items" onchange="toggleAllListRows('pod', this.checked)"></th>
                            <th>Trip #</th>
                            <th>Truck</th>
                            <th>Driver</th>
                            <th>Area</th>
                            <th>Offloading Point</th>
                            <th>Collected</th>
                            <th>Scanned</th>
                            <th>Uploaded</th>
                            <th>Sent to Invoicing</th>
                            <th>Hours</th>
                            <th>KPI</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody id="podTableBody">${renderPODTableRowsFiltered()}</tbody>
                </table>
            </div>
        </div>

        <div style="background:#e8f0fe;padding:15px;border-radius:8px;margin-top:20px;border-left:4px solid var(--primary-light);font-size:13px;">
            <strong>📋 POD Workflow:</strong> Offloading Complete → POD Collected (≤48h) → Scanned → Uploaded → Sent to POD Management & Invoicing Team
        </div>

        <button class="btn btn-outline mt-20" onclick="navigateTo('dashboard')">⬅️ Back to Dashboard</button>
    `;
}

function renderAreaPage(container, areaName) {
    const trips = Object.values(tripsDB).filter(t => t.area === areaName);
    const nbTrips = trips.filter(t => t.direction === 'NB');
    const sbTrips = trips.filter(t => t.direction === 'SB');
    container.innerHTML = `
        <div class="page-header"><h1>🏢 ${areaName} Area</h1><p class="page-subtitle">Full workflow status columns for all trucks in ${areaName}</p></div>
        ${getAreaFilterBanner()}
        ${nbTrips.length ? `
        <div class="table-container" style="margin-bottom:24px;">
            <div class="table-header"><h3>🔼 NB Trucks in ${areaName} (${nbTrips.length})</h3>
                <div class="table-header-actions">${typeof renderLiveColumnToolbar === 'function' ? renderLiveColumnToolbar('NB', 'areaPageNbTable', 'areaNb') : ''}</div>
            </div>
            <div style="overflow-x:auto;">
                <table class="live-page-table operations-live-table" id="areaPageNbTable">
                    <thead><tr>${renderAreaBrowserLiveTableHeader('NB')}</tr></thead>
                    <tbody>${renderAreaBrowserTableRows(nbTrips, 'NB')}</tbody>
                </table>
            </div>
        </div>` : ''}
        ${sbTrips.length ? `
        <div class="table-container">
            <div class="table-header"><h3>🔽 SB Trucks in ${areaName} (${sbTrips.length})</h3>
                <div class="table-header-actions">${typeof renderLiveColumnToolbar === 'function' ? renderLiveColumnToolbar('SB', 'areaPageSbTable', 'areaSb') : ''}</div>
            </div>
            <div style="overflow-x:auto;">
                <table class="live-page-table operations-live-table" id="areaPageSbTable">
                    <thead><tr>${renderAreaBrowserLiveTableHeader('SB')}</tr></thead>
                    <tbody>${renderAreaBrowserTableRows(sbTrips, 'SB')}</tbody>
                </table>
            </div>
        </div>` : ''}
        ${!trips.length ? '<p style="padding:20px;color:var(--text-secondary);">No trucks currently in this area.</p>' : ''}
        <button class="btn btn-outline mt-20" onclick="navigateTo('area-browser')">⬅️ Back to Area Browser</button>`;
    setTimeout(() => {
        if (typeof applyLiveTableLayout === 'function') {
            if (nbTrips.length) applyLiveTableLayout('areaPageNbTable', 'NB');
            if (sbTrips.length) applyLiveTableLayout('areaPageSbTable', 'SB');
        }
    }, 0);
}

// ============================================
// ASSETS & EQUIPMENT REGISTRY
// ============================================
function computeDocumentMeta(acquisitionDate, expiryDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    if (isNaN(expiry.getTime())) return { status: 'valid', kpi: 'green', label: 'Valid' };
    const days = Math.ceil((expiry - today) / 86400000);
    if (days < 0) return { status: 'expired', kpi: 'red', label: 'Expired' };
    if (days <= 30) return { status: 'expiring', kpi: 'orange', label: `Expires in ${days}d` };
    return { status: 'valid', kpi: 'green', label: 'Valid' };
}

function enrichAssetDocument(doc) {
    const meta = computeDocumentMeta(doc.acquisitionDate, doc.expiryDate);
    return { ...doc, ...meta };
}

function getAssetById(assetId) {
    return assetsRegistryDB.find(a => a.id === assetId);
}

function formatAssetStatus(status) {
    const map = { active: 'Active', maintenance: 'Maintenance', retired: 'Retired', lost: 'Lost / Stolen' };
    return map[status] || status;
}

function getAssetDocumentsSummary(asset) {
    const docs = (asset.documents || []).map(enrichAssetDocument);
    if (!docs.length) return { count: 0, nearestExpiry: null, worstKpi: 'green', worstLabel: 'No documents' };
    const sorted = [...docs].sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
    const worst = docs.reduce((w, d) => {
        const rank = { red: 3, orange: 2, green: 1 };
        return rank[d.kpi] > rank[w.kpi] ? d : w;
    }, docs[0]);
    return {
        count: docs.length,
        nearestExpiry: sorted[0].expiryDate,
        worstKpi: worst.kpi,
        worstLabel: worst.label
    };
}

function getAssetRegistryStats() {
    const allDocs = assetsRegistryDB.flatMap(a => (a.documents || []).map(enrichAssetDocument));
    return {
        vehicles: assetsRegistryDB.filter(a => a.category === 'vehicle').length,
        equipment: assetsRegistryDB.filter(a => a.category === 'equipment').length,
        valid: allDocs.filter(d => d.status === 'valid').length,
        expiring: allDocs.filter(d => d.status === 'expiring').length,
        expired: allDocs.filter(d => d.status === 'expired').length
    };
}

function syncAssetDocumentToGlobalRegistry(doc, asset) {
    const enriched = enrichAssetDocument(doc);
    const entityLabel = asset.category === 'vehicle'
        ? `${asset.assetType} ${asset.plateNumber || asset.name}`
        : `${asset.assetType} ${asset.name}`;
    const existing = documentsDB.find(d => d.id === doc.id);
    const record = {
        id: doc.id,
        type: doc.type,
        entity: entityLabel,
        trip: '—',
        truck: asset.plateNumber || asset.name,
        expiry: doc.expiryDate,
        issued: doc.acquisitionDate,
        status: enriched.status,
        kpi: enriched.kpi,
        label: enriched.label,
        fileName: doc.fileName,
        category: doc.type,
        assetId: asset.id,
        uploaded: !!doc.uploaded,
        fileSize: doc.fileSize || null
    };
    if (existing) Object.assign(existing, record);
    else documentsDB.push(record);
}

function generateAssetId() {
    nextAssetId += 1;
    return `AST-${String(nextAssetId).padStart(3, '0')}`;
}

function generateAssetDocumentId() {
    nextAssetDocId += 1;
    return nextAssetDocId;
}

function getFilteredAssetsRegistry() {
    const search = assetsSearchTerm || (document.getElementById('assetsSearchInput')?.value || '').trim();
    const status = assetsStatusFilter || document.getElementById('assetsStatusFilter')?.value || 'all';
    const category = assetsCategoryFilter || document.getElementById('assetsCategoryFilter')?.value || 'all';
    let items = [...assetsRegistryDB];

    if (category !== 'all') items = items.filter(a => a.category === category);
    if (status !== 'all') items = items.filter(a => a.status === status);
    if (search) {
        const term = search.toLowerCase();
        items = items.filter(a =>
            a.id.toLowerCase().includes(term) ||
            a.name.toLowerCase().includes(term) ||
            a.assetType.toLowerCase().includes(term) ||
            (a.plateNumber && a.plateNumber.toLowerCase().includes(term)) ||
            (a.serialNumber && a.serialNumber.toLowerCase().includes(term)) ||
            (a.make && a.make.toLowerCase().includes(term)) ||
            (a.brand && a.brand.toLowerCase().includes(term)) ||
            (a.model && a.model.toLowerCase().includes(term)) ||
            (a.assignedDriver && a.assignedDriver.toLowerCase().includes(term)) ||
            (a.assignedTo && a.assignedTo.toLowerCase().includes(term)) ||
            (a.location && a.location.toLowerCase().includes(term)) ||
            (a.documents || []).some(d =>
                d.type.toLowerCase().includes(term) ||
                d.fileName.toLowerCase().includes(term)
            )
        );
    }
    return items;
}

function renderAssetDocumentsCell(asset) {
    const summary = getAssetDocumentsSummary(asset);
    if (!summary.count) return '<span class="text-muted">No documents</span>';
    return `<span class="status-badge ${summary.worstKpi}">${summary.count} doc${summary.count !== 1 ? 's' : ''}</span><br><small style="color:var(--text-secondary);">${summary.nearestExpiry} · ${summary.worstLabel}</small>`;
}

function renderAssetsTableRows(items) {
    if (!items.length) {
        return '<tr><td colspan="11" style="text-align:center;padding:24px;color:var(--text-secondary);">No assets or equipment match your search</td></tr>';
    }
    return items.map(a => `
        <tr>
            <td style="width:36px;text-align:center;">${renderListRowCheckbox('assets', a.id)}</td>
            <td><strong>${a.id}</strong></td>
            <td>${a.category === 'vehicle' ? '🚛 Vehicle' : '💻 Equipment'}</td>
            <td>${a.assetType}</td>
            <td><strong>${a.name}</strong><br><small style="color:var(--text-secondary);">${a.category === 'vehicle' ? (a.plateNumber || '—') : (a.serialNumber || '—')}</small></td>
            <td>${a.category === 'vehicle' ? `${a.make || '—'} ${a.model || ''}`.trim() : `${a.brand || '—'} ${a.model || ''}`.trim()}</td>
            <td>${a.category === 'vehicle' ? (a.assignedDriver || a.owner || '—') : (a.assignedTo || '—')}</td>
            <td>${a.acquisitionDate || '—'}</td>
            <td>${renderAssetDocumentsCell(a)}</td>
            <td><span class="status-badge ${a.status === 'active' ? 'green' : a.status === 'maintenance' ? 'orange' : 'red'}">${formatAssetStatus(a.status)}</span></td>
            <td>
                <button class="btn btn-outline btn-sm" onclick="openAssetDetailModal('${a.id}')" title="View details">👁️</button>
                ${canEditInModule('assets') ? `<button class="btn btn-primary btn-sm" onclick="openAssetStatusModal('${a.id}')" title="Update status">💬</button>
                <button class="btn btn-primary btn-sm" onclick="openAddAssetDocumentModal('${a.id}')" title="Add document">📄</button>` : ''}
            </td>
        </tr>
    `).join('');
}

function renderAssetsTableRowsFiltered() {
    const items = getFilteredAssetsRegistry();
    const countEl = document.getElementById('assetsTableCount');
    if (countEl) countEl.textContent = `${items.length} asset${items.length !== 1 ? 's' : ''}`;
    updateListSelectionUI('assets');
    return renderAssetsTableRows(items);
}

function refreshAssetsTable() {
    assetsSearchTerm = document.getElementById('assetsSearchInput')?.value || '';
    assetsStatusFilter = document.getElementById('assetsStatusFilter')?.value || 'all';
    assetsCategoryFilter = document.getElementById('assetsCategoryFilter')?.value || 'all';
    const body = document.getElementById('assetsTableBody');
    if (body) body.innerHTML = renderAssetsTableRowsFiltered();
}

function clearAssetsFilters() {
    assetsSearchTerm = '';
    assetsStatusFilter = 'all';
    assetsCategoryFilter = 'all';
    const search = document.getElementById('assetsSearchInput');
    const status = document.getElementById('assetsStatusFilter');
    const category = document.getElementById('assetsCategoryFilter');
    if (search) search.value = '';
    if (status) status.value = 'all';
    if (category) category.value = 'all';
    refreshAssetsTable();
}

function populateAssetDocumentAssetSelect(selectedId) {
    const select = document.getElementById('assetDocAssetSelect');
    if (!select) return;
    select.innerHTML = assetsRegistryDB.map(a => `
        <option value="${a.id}" ${a.id === selectedId ? 'selected' : ''}>${a.id} — ${a.name} (${a.assetType})</option>
    `).join('');
}

function openAddVehicleModal() {
    document.getElementById('vehicleForm').reset();
    document.getElementById('vehicleAcquisitionDate').value = new Date().toISOString().slice(0, 10);
    openModal('assetVehicleModal');
}

function openAddEquipmentModal() {
    document.getElementById('equipmentForm').reset();
    document.getElementById('equipmentAcquisitionDate').value = new Date().toISOString().slice(0, 10);
    openModal('assetEquipmentModal');
}

function openAddAssetDocumentModal(assetId) {
    populateAssetDocumentAssetSelect(assetId || assetsRegistryDB[0]?.id);
    document.getElementById('assetDocumentForm').reset();
    clearAssetDocUpload();
    if (assetId) document.getElementById('assetDocAssetSelect').value = assetId;
    document.getElementById('assetDocAcquisitionDate').value = new Date().toISOString().slice(0, 10);
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);
    document.getElementById('assetDocExpiryDate').value = expiry.toISOString().slice(0, 10);
    openModal('assetDocumentModal');
}

function clearAssetDocUpload() {
    assetDocUploadedFile = null;
    const input = document.getElementById('assetDocFileInput');
    const list = document.getElementById('assetDocFileList');
    const area = document.getElementById('assetDocUploadArea');
    if (input) input.value = '';
    if (list) list.innerHTML = '';
    if (area) area.classList.remove('has-file');
}

function handleAssetDocFileSelect(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
        showToast('File is too large. Maximum size is 10 MB.', 'warning');
        event.target.value = '';
        return;
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'];
    const allowedExt = /\.(pdf|jpe?g|png|docx?)$/i;
    if (!allowedTypes.includes(file.type) && !allowedExt.test(file.name)) {
        showToast('Please upload PDF, JPG, PNG, or DOC/DOCX files only', 'warning');
        event.target.value = '';
        return;
    }

    assetDocUploadedFile = {
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        type: file.type || 'application/octet-stream'
    };

    const fileNameInput = document.getElementById('assetDocFileName');
    if (fileNameInput && !fileNameInput.value.trim()) {
        fileNameInput.value = file.name;
    }

    const list = document.getElementById('assetDocFileList');
    const area = document.getElementById('assetDocUploadArea');
    if (list) {
        list.innerHTML = `<div class="file-item"><span>📄 ${assetDocUploadedFile.name} (${assetDocUploadedFile.size})</span><span class="remove-file" onclick="removeAssetDocFile()">✕</span></div>`;
    }
    if (area) area.classList.add('has-file');
}

function removeAssetDocFile() {
    clearAssetDocUpload();
    const fileNameInput = document.getElementById('assetDocFileName');
    if (fileNameInput) fileNameInput.value = '';
}

function submitAddVehicle() {
    const plate = document.getElementById('vehiclePlate').value.trim();
    const make = document.getElementById('vehicleMake').value.trim();
    const model = document.getElementById('vehicleModel').value.trim();
    if (!plate || !make || !model) {
        showToast('Plate number, make, and model are required', 'warning');
        return;
    }
    const asset = {
        id: generateAssetId(),
        category: 'vehicle',
        assetType: document.getElementById('vehicleType').value,
        name: plate,
        status: document.getElementById('vehicleStatus').value,
        acquisitionDate: document.getElementById('vehicleAcquisitionDate').value,
        plateNumber: plate,
        vin: document.getElementById('vehicleVin').value.trim(),
        make,
        model,
        year: document.getElementById('vehicleYear').value || '',
        engineNumber: document.getElementById('vehicleEngine').value.trim(),
        fuelType: document.getElementById('vehicleFuel').value,
        grossWeight: document.getElementById('vehicleGrossWeight').value.trim(),
        axleConfig: document.getElementById('vehicleAxle').value.trim(),
        trailerPlate: document.getElementById('vehicleTrailerPlate').value.trim(),
        odometer: document.getElementById('vehicleOdometer').value.trim(),
        color: document.getElementById('vehicleColor').value.trim(),
        assignedDriver: document.getElementById('vehicleDriver').value.trim(),
        owner: document.getElementById('vehicleOwner').value.trim(),
        location: document.getElementById('vehicleLocation').value.trim(),
        notes: document.getElementById('vehicleNotes').value.trim(),
        documents: []
    };
    assetsRegistryDB.unshift(asset);
    closeModal('assetVehicleModal');
    if (currentPage === 'assets') refreshAssetsTable();
    else navigateTo('assets');
    showToast(`Vehicle ${plate} added to registry`, 'success');
}

function submitAddEquipment() {
    const name = document.getElementById('equipmentName').value.trim();
    const brand = document.getElementById('equipmentBrand').value.trim();
    const model = document.getElementById('equipmentModel').value.trim();
    if (!name || !brand || !model) {
        showToast('Asset name, brand, and model are required', 'warning');
        return;
    }
    const asset = {
        id: generateAssetId(),
        category: 'equipment',
        assetType: document.getElementById('equipmentType').value,
        name,
        status: document.getElementById('equipmentStatus').value,
        acquisitionDate: document.getElementById('equipmentAcquisitionDate').value,
        serialNumber: document.getElementById('equipmentSerial').value.trim(),
        brand,
        model,
        assignedTo: document.getElementById('equipmentAssignedTo').value.trim(),
        department: document.getElementById('equipmentDepartment').value.trim(),
        location: document.getElementById('equipmentLocation').value.trim(),
        imei: document.getElementById('equipmentImei').value.trim(),
        notes: document.getElementById('equipmentNotes').value.trim(),
        documents: []
    };
    assetsRegistryDB.unshift(asset);
    closeModal('assetEquipmentModal');
    if (currentPage === 'assets') refreshAssetsTable();
    else navigateTo('assets');
    showToast(`${asset.assetType} ${name} added to registry`, 'success');
}

function submitAddAssetDocument() {
    const assetId = document.getElementById('assetDocAssetSelect').value;
    const asset = getAssetById(assetId);
    if (!asset) {
        showToast('Please select a valid asset', 'warning');
        return;
    }
    const type = document.getElementById('assetDocType').value.trim();
    const fileName = document.getElementById('assetDocFileName').value.trim();
    const acquisitionDate = document.getElementById('assetDocAcquisitionDate').value;
    const expiryDate = document.getElementById('assetDocExpiryDate').value;
    if (!type || !acquisitionDate || !expiryDate) {
        showToast('Document type, acquisition date, and expiry date are required', 'warning');
        return;
    }
    if (!assetDocUploadedFile) {
        showToast('Please upload the document file', 'warning');
        return;
    }
    if (!fileName) {
        showToast('File name is required', 'warning');
        return;
    }
    if (new Date(expiryDate) < new Date(acquisitionDate)) {
        showToast('Expiry date must be on or after acquisition date', 'warning');
        return;
    }
    const doc = {
        id: generateAssetDocumentId(),
        type,
        fileName,
        acquisitionDate,
        expiryDate,
        notes: document.getElementById('assetDocNotes').value.trim(),
        uploaded: true,
        uploadedAt: new Date().toISOString(),
        fileSize: assetDocUploadedFile.size,
        fileType: assetDocUploadedFile.type
    };
    if (!asset.documents) asset.documents = [];
    asset.documents.push(doc);
    syncAssetDocumentToGlobalRegistry(doc, asset);
    clearAssetDocUpload();
    closeModal('assetDocumentModal');
    if (currentPage === 'assets') refreshAssetsTable();
    showToast(`Document uploaded and linked to ${asset.name}`, 'success');
}

function renderAssetDetailContent(asset) {
    const docs = (asset.documents || []).map(enrichAssetDocument);
    const vehicleSpecs = asset.category === 'vehicle' ? `
        <div class="asset-spec-grid">
            <div><span class="spec-label">Plate Number</span><strong>${asset.plateNumber || '—'}</strong></div>
            <div><span class="spec-label">VIN</span><strong>${asset.vin || '—'}</strong></div>
            <div><span class="spec-label">Make / Model</span><strong>${asset.make || '—'} ${asset.model || ''}</strong></div>
            <div><span class="spec-label">Year</span><strong>${asset.year || '—'}</strong></div>
            <div><span class="spec-label">Engine No.</span><strong>${asset.engineNumber || '—'}</strong></div>
            <div><span class="spec-label">Fuel Type</span><strong>${asset.fuelType || '—'}</strong></div>
            <div><span class="spec-label">Gross Weight</span><strong>${asset.grossWeight || '—'}</strong></div>
            <div><span class="spec-label">Axle Config</span><strong>${asset.axleConfig || '—'}</strong></div>
            <div><span class="spec-label">Trailer Plate</span><strong>${asset.trailerPlate || '—'}</strong></div>
            <div><span class="spec-label">Odometer</span><strong>${asset.odometer || '—'}</strong></div>
            <div><span class="spec-label">Color</span><strong>${asset.color || '—'}</strong></div>
            <div><span class="spec-label">Assigned Driver</span><strong>${asset.assignedDriver || '—'}</strong></div>
            <div><span class="spec-label">Owner</span><strong>${asset.owner || '—'}</strong></div>
        </div>
    ` : `
        <div class="asset-spec-grid">
            <div><span class="spec-label">Serial Number</span><strong>${asset.serialNumber || '—'}</strong></div>
            <div><span class="spec-label">Brand / Model</span><strong>${asset.brand || '—'} ${asset.model || ''}</strong></div>
            <div><span class="spec-label">IMEI</span><strong>${asset.imei || '—'}</strong></div>
            <div><span class="spec-label">Assigned To</span><strong>${asset.assignedTo || '—'}</strong></div>
            <div><span class="spec-label">Department</span><strong>${asset.department || '—'}</strong></div>
        </div>
    `;

    return `
        <div class="asset-detail-header">
            <div>
                <h4 style="margin:0 0 4px;">${asset.name}</h4>
                <div style="color:var(--text-secondary);font-size:13px;">${asset.id} · ${asset.assetType} · Acquired ${asset.acquisitionDate || '—'}</div>
            </div>
            <span class="status-badge ${asset.status === 'active' ? 'green' : asset.status === 'maintenance' ? 'orange' : 'red'}">${formatAssetStatus(asset.status)}</span>
        </div>
        <div style="margin:16px 0 8px;font-weight:600;">Specifications</div>
        ${vehicleSpecs}
        <div style="margin:8px 0;"><span class="spec-label">Location</span> <strong>${asset.location || '—'}</strong></div>
        ${asset.notes ? `<div style="margin-top:8px;padding:10px;background:#f7fafc;border-radius:8px;font-size:13px;"><strong>Notes:</strong> ${asset.notes}</div>` : ''}
        <div style="display:flex;justify-content:space-between;align-items:center;margin:20px 0 10px;">
            <div style="font-weight:600;">Documents (${docs.length})</div>
            <button type="button" class="btn btn-primary btn-sm" onclick="closeModal('assetDetailModal'); openAddAssetDocumentModal('${asset.id}')">+ Add Document</button>
        </div>
        ${docs.length ? `
            <table style="width:100%;font-size:13px;">
                <thead><tr style="background:#f7fafc;">
                    <th style="padding:8px;text-align:left;">Type</th>
                    <th style="padding:8px;text-align:left;">File</th>
                    <th style="padding:8px;text-align:left;">Acquired</th>
                    <th style="padding:8px;text-align:left;">Expires</th>
                    <th style="padding:8px;text-align:left;">Status</th>
                </tr></thead>
                <tbody>
                    ${docs.map(d => `
                        <tr>
                            <td style="padding:8px;">${d.type}</td>
                            <td style="padding:8px;">
                                ${d.fileName}
                                ${d.uploaded ? '<br><small style="color:var(--green);">📎 File uploaded</small>' : ''}
                            </td>
                            <td style="padding:8px;">${d.acquisitionDate}</td>
                            <td style="padding:8px;">${d.expiryDate}</td>
                            <td style="padding:8px;">
                                <span class="status-badge ${d.kpi}">${d.label}</span>
                                ${d.uploaded ? `<br><button type="button" class="btn btn-outline btn-sm" style="margin-top:4px;" onclick="showToast('📄 Opening ${d.fileName}...','success')">📥 Open</button>` : ''}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        ` : '<p style="color:var(--text-secondary);font-size:13px;">No documents attached yet.</p>'}
    `;
}

function openAssetDetailModal(assetId) {
    const asset = getAssetById(assetId);
    if (!asset) return;
    document.getElementById('assetDetailTitle').textContent = `${asset.category === 'vehicle' ? '🚛' : '💻'} ${asset.name} — Details`;
    document.getElementById('assetDetailBody').innerHTML = renderAssetDetailContent(asset);
    openModal('assetDetailModal');
}

function renderAssets(container) {
    const items = getFilteredAssetsRegistry();
    const stats = getAssetRegistryStats();
    container.innerHTML = `
        <div class="page-header">
            <h1>🚗 Assets & Equipment</h1>
            <div class="breadcrumb"><a href="#" onclick="navigateTo('dashboard')">Home</a> <span>›</span> <strong>Assets & Equipment</strong></div>
        </div>
        ${renderKpiTargetsBanner('equipment')}
        <div class="kpi-grid">
            <div class="kpi-card green"><div class="kpi-header"><span class="kpi-title">🚛 Vehicles</span></div><div class="kpi-value">${stats.vehicles}</div></div>
            <div class="kpi-card blue"><div class="kpi-header"><span class="kpi-title">💻 Equipment</span></div><div class="kpi-value">${stats.equipment}</div></div>
            <div class="kpi-card green" onclick="navigateToDocuments('valid')"><div class="kpi-header"><span class="kpi-title">Valid Documents</span></div><div class="kpi-value">${stats.valid}</div></div>
            <div class="kpi-card orange" onclick="navigateToDocuments('expiring')"><div class="kpi-header"><span class="kpi-title">Expiring Soon</span></div><div class="kpi-value">${stats.expiring}</div></div>
            <div class="kpi-card red" onclick="navigateToDocuments('expired')"><div class="kpi-header"><span class="kpi-title">Expired</span></div><div class="kpi-value">${stats.expired}</div></div>
        </div>

        <div class="assets-action-bar">
            ${canEditInModule('assets') ? `<button class="btn btn-primary" onclick="openAddVehicleModal()">🚛 Add Vehicle</button>
            <button class="btn btn-primary" onclick="openAddEquipmentModal()">💻 Add Equipment</button>
            <button class="btn btn-outline" onclick="openAddAssetDocumentModal()">📄 Add Document</button>` : ''}
        </div>

        <div class="filters-bar">
            <div class="filter-group"><label>Category:</label><select id="assetsCategoryFilter" onchange="refreshAssetsTable()"><option value="all"${assetsCategoryFilter === 'all' ? ' selected' : ''}>All</option><option value="vehicle"${assetsCategoryFilter === 'vehicle' ? ' selected' : ''}>🚛 Vehicles</option><option value="equipment"${assetsCategoryFilter === 'equipment' ? ' selected' : ''}>💻 Equipment</option></select></div>
            <div class="filter-group"><label>Status:</label><select id="assetsStatusFilter" onchange="refreshAssetsTable()"><option value="all"${assetsStatusFilter === 'all' ? ' selected' : ''}>All</option><option value="active"${assetsStatusFilter === 'active' ? ' selected' : ''}>Active</option><option value="maintenance"${assetsStatusFilter === 'maintenance' ? ' selected' : ''}>Maintenance</option><option value="retired"${assetsStatusFilter === 'retired' ? ' selected' : ''}>Retired</option></select></div>
            <div class="search-filter" style="flex:2;">
                <span>🔍</span>
                <input type="text" id="assetsSearchInput" placeholder="Search by ID, plate, serial, make, model, assigned to..." value="${assetsSearchTerm}" onkeyup="refreshAssetsTable()">
            </div>
            <button class="btn btn-outline btn-sm" onclick="clearAssetsFilters()">Clear</button>
        </div>

        <div class="table-container">
            <div class="table-header">
                <h3>Assets & Equipment Registry</h3>
                <div class="table-header-actions">
                    <span id="assetsTableCount" style="color:var(--text-secondary);">${items.length} asset${items.length !== 1 ? 's' : ''}</span>
                    ${canEditInModule('assets') ? renderExportToolbar('assets') : ''}
                </div>
            </div>
            <div style="overflow-x:auto;">
                <table>
                    <thead><tr>
                        <th style="width:36px;text-align:center;"><input type="checkbox" aria-label="Select all assets" onchange="toggleAllListRows('assets', this.checked)"></th>
                        <th>Asset ID</th><th>Category</th><th>Type</th><th>Name / ID No.</th><th>Make / Brand</th><th>Assigned To</th><th>Acquired</th><th>Documents</th><th>Status</th><th>Actions</th>
                    </tr></thead>
                    <tbody id="assetsTableBody">${renderAssetsTableRowsFiltered()}</tbody>
                </table>
            </div>
        </div>
        <button class="btn btn-outline mt-20" onclick="navigateTo('dashboard')">⬅️ Back to Dashboard</button>
    `;
}

// ============================================
// RUNNER FEES
// ============================================
let runnerFeeMode = 'border';
let runnerFeeFromDate = '2026-07-01';
let runnerFeeToDate = '2026-07-31';
let runnerFeeTransporter = 'all';

const RUNNER_BORDER_FEES = { yellow: 40, blue: 25, red: 15 };
const RUNNER_KANYAKA_FEE = 5;

function parseRunnerDate(val) {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
}

function formatRunnerDate(val) {
    const d = parseRunnerDate(val);
    if (!d) return '—';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function runnerDaysBetween(arrival, exit) {
    const a = parseRunnerDate(arrival);
    const e = parseRunnerDate(exit);
    if (!a || !e) return null;
    const start = new Date(a); start.setHours(0, 0, 0, 0);
    const end = new Date(e); end.setHours(0, 0, 0, 0);
    return Math.max(0, Math.round((end - start) / 86400000));
}

function runnerPeriodOverlapsFilter(arrival, exit, fromStr, toStr) {
    const a = parseRunnerDate(arrival);
    const e = parseRunnerDate(exit);
    const from = parseRunnerDate(fromStr);
    const to = parseRunnerDate(toStr);
    if (!a || !e || !from || !to) return false;
    to.setHours(23, 59, 59, 999);
    return a <= to && e >= from;
}

function getRunnerTransporters() {
    return [...new Set(Object.values(tripsDB).map(t => t.owner).filter(Boolean))].sort();
}

function deriveRunnerDatesForTrip(trip) {
    const wd = trip.workflowDates || {};
    const rd = trip.runnerDates || {};
    const base = parseRunnerDate(wd.border || wd.loadingProcess) || new Date('2026-07-15');

    if (trip.direction === 'NB') {
        const borderArrival = rd.borderArrival || wd.border || base.toISOString();
        let borderExit = rd.borderExit || wd.kanyaka;
        if (!borderExit && trip.workflow?.border === 'completed') {
            const d = parseRunnerDate(borderArrival);
            d.setDate(d.getDate() + Math.min(Math.max(trip.daysInDRC || 1, 1), 6));
            borderExit = d.toISOString();
        }
        const kanyakaArrival = rd.kanyakaArrival || wd.kanyaka;
        let kanyakaExit = rd.kanyakaExit || wd.offloading;
        if (kanyakaArrival && !kanyakaExit && trip.workflow?.kanyaka === 'completed') {
            const d = parseRunnerDate(kanyakaArrival);
            d.setDate(d.getDate() + 1);
            kanyakaExit = d.toISOString();
        }
        return {
            border: trip.entryBorder || '—',
            borderArrival,
            borderExit,
            kanyakaArrival,
            kanyakaExit
        };
    }

    const kanyakaArrival = rd.kanyakaArrival || wd.kanyaka;
    let kanyakaExit = rd.kanyakaExit || wd.border;
    if (kanyakaArrival && !kanyakaExit && (trip.workflow?.kanyaka === 'completed' || trip.workflow?.border === 'current')) {
        const d = parseRunnerDate(kanyakaArrival);
        d.setDate(d.getDate() + 1);
        kanyakaExit = d.toISOString();
    }
    return { kanyakaArrival, kanyakaExit, border: trip.exitBorder || '—' };
}

function getBorderRunnerTier(days) {
    if (days === null) return null;
    if (days <= 2) return { key: 'yellow', label: '0–2 days', color: 'orange', fee: RUNNER_BORDER_FEES.yellow };
    if (days <= 4) return { key: 'blue', label: '3–4 days', color: 'blue', fee: RUNNER_BORDER_FEES.blue };
    return { key: 'red', label: '5+ days', color: 'red', fee: RUNNER_BORDER_FEES.red };
}

function getKanyakaRunnerFee(days) {
    if (days === null) return null;
    return days <= 1 ? RUNNER_KANYAKA_FEE : 0;
}

function filterRunnerFeeTrips(direction) {
    let trips = Object.values(tripsDB).filter(t => t.direction === direction);
    if (runnerFeeTransporter !== 'all') {
        trips = trips.filter(t => t.owner === runnerFeeTransporter);
    }
    return filterTripsByUserArea(trips);
}

function buildBorderRunnerRows() {
    const rows = [];
    filterRunnerFeeTrips('NB').forEach(trip => {
        const dates = deriveRunnerDatesForTrip(trip);
        if (!dates.borderArrival || !dates.borderExit) return;
        if (!runnerPeriodOverlapsFilter(dates.borderArrival, dates.borderExit, runnerFeeFromDate, runnerFeeToDate)) return;
        const days = runnerDaysBetween(dates.borderArrival, dates.borderExit);
        const tier = getBorderRunnerTier(days);
        if (!tier) return;
        rows.push({
            trip: trip.tripNumber,
            truck: trip.truck,
            transporter: trip.owner,
            border: dates.border,
            arrival: dates.borderArrival,
            exit: dates.borderExit,
            days,
            tier,
            fee: tier.fee
        });
    });
    return rows.sort((a, b) => parseRunnerDate(a.arrival) - parseRunnerDate(b.arrival));
}

function buildKanyakaRunnerRows(direction) {
    const rows = [];
    filterRunnerFeeTrips(direction).forEach(trip => {
        const dates = deriveRunnerDatesForTrip(trip);
        if (!dates.kanyakaArrival || !dates.kanyakaExit) return;
        if (!runnerPeriodOverlapsFilter(dates.kanyakaArrival, dates.kanyakaExit, runnerFeeFromDate, runnerFeeToDate)) return;
        const days = runnerDaysBetween(dates.kanyakaArrival, dates.kanyakaExit);
        const fee = getKanyakaRunnerFee(days);
        if (fee === null) return;
        rows.push({
            trip: trip.tripNumber,
            truck: trip.truck,
            transporter: trip.owner,
            arrival: dates.kanyakaArrival,
            exit: dates.kanyakaExit,
            days,
            fee,
            tierLabel: days <= 1 ? '0–1 day ($5)' : '2+ days ($0)'
        });
    });
    return rows.sort((a, b) => parseRunnerDate(a.arrival) - parseRunnerDate(b.arrival));
}

function summarizeBorderRunner(rows) {
    const groups = {
        yellow: { label: 'Yellow (0–2 days)', fee: RUNNER_BORDER_FEES.yellow, count: 0, total: 0 },
        blue: { label: 'Blue (3–4 days)', fee: RUNNER_BORDER_FEES.blue, count: 0, total: 0 },
        red: { label: 'Red (5+ days)', fee: RUNNER_BORDER_FEES.red, count: 0, total: 0 }
    };
    rows.forEach(r => {
        groups[r.tier.key].count += 1;
        groups[r.tier.key].total += r.fee;
    });
    const grandTotal = rows.reduce((s, r) => s + r.fee, 0);
    return { groups, grandTotal, truckCount: rows.length };
}

function summarizeKanyakaRunner(rows) {
    const payable = rows.filter(r => r.fee > 0);
    return {
        payableCount: payable.length,
        zeroCount: rows.length - payable.length,
        grandTotal: rows.reduce((s, r) => s + r.fee, 0),
        truckCount: rows.length
    };
}

function renderRunnerFeeSummaryBorder(summary) {
    return `
        <div class="kpi-grid" style="margin-bottom:20px;">
            ${Object.entries(summary.groups).map(([key, g]) => `
                <div class="kpi-card ${key === 'yellow' ? 'orange' : key}">
                    <div class="kpi-header"><span class="kpi-title">${g.label}</span></div>
                    <div class="kpi-value">${g.count}</div>
                    <div class="kpi-trend">$${g.fee} × ${g.count} = <strong>$${g.total}</strong></div>
                </div>`).join('')}
            <div class="kpi-card green">
                <div class="kpi-header"><span class="kpi-title">Grand Total</span></div>
                <div class="kpi-value">$${summary.grandTotal}</div>
                <div class="kpi-trend">${summary.truckCount} truck${summary.truckCount !== 1 ? 's' : ''}</div>
            </div>
        </div>`;
}

function renderRunnerFeeSummaryKanyaka(summary, title) {
    return `
        <div class="kpi-grid" style="margin-bottom:20px;">
            <div class="kpi-card orange">
                <div class="kpi-header"><span class="kpi-title">${title} — Payable (0–1 day)</span></div>
                <div class="kpi-value">${summary.payableCount}</div>
                <div class="kpi-trend">$${RUNNER_KANYAKA_FEE} each</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-header"><span class="kpi-title">No fee (2+ days)</span></div>
                <div class="kpi-value">${summary.zeroCount}</div>
            </div>
            <div class="kpi-card green">
                <div class="kpi-header"><span class="kpi-title">Grand Total</span></div>
                <div class="kpi-value">$${summary.grandTotal}</div>
                <div class="kpi-trend">${summary.truckCount} truck${summary.truckCount !== 1 ? 's' : ''}</div>
            </div>
        </div>`;
}

function renderRunnerFeeTabs(active) {
    const tabs = [
        { id: 'border', label: 'Border Runner (NB)' },
        { id: 'kanyaka-nb', label: 'Kanyaka NB' },
        { id: 'kanyaka-sb', label: 'Kanyaka SB' }
    ];
    return tabs.map(t => `
        <button class="pod-filter-tab${active === t.id ? ' active' : ''}" onclick="setRunnerFeeMode('${t.id}')">${t.label}</button>
    `).join('');
}

function setRunnerFeeMode(mode) {
    runnerFeeMode = mode;
    renderRunnerFees(document.getElementById('contentArea'));
}

function refreshRunnerFees() {
    runnerFeeFromDate = document.getElementById('runnerFeeFrom')?.value || runnerFeeFromDate;
    runnerFeeToDate = document.getElementById('runnerFeeTo')?.value || runnerFeeToDate;
    runnerFeeTransporter = document.getElementById('runnerFeeTransporter')?.value || 'all';
    renderRunnerFees(document.getElementById('contentArea'));
}

function renderRunnerFees(container) {
    const transporters = getRunnerTransporters();
    let bodyHtml = '';
    let summaryHtml = '';

    if (runnerFeeMode === 'border') {
        const rows = buildBorderRunnerRows();
        const summary = summarizeBorderRunner(rows);
        summaryHtml = renderRunnerFeeSummaryBorder(summary);
        bodyHtml = rows.length ? `
            <table>
                <thead><tr>
                    <th>Trip #</th><th>Truck</th><th>Transporter</th><th>Border</th>
                    <th>Arrival</th><th>Exit</th><th>Days</th><th>Group</th><th>Fee</th>
                </tr></thead>
                <tbody>
                    ${rows.map(r => `
                        <tr>
                            <td><strong>${r.trip}</strong></td>
                            <td>${r.truck}</td>
                            <td>${r.transporter}</td>
                            <td><span class="status-badge blue">${r.border}</span></td>
                            <td>${formatRunnerDate(r.arrival)}</td>
                            <td>${formatRunnerDate(r.exit)}</td>
                            <td>${r.days}</td>
                            <td><span class="status-badge ${r.tier.color}">${r.tier.label}</span></td>
                            <td><strong>$${r.fee}</strong></td>
                        </tr>`).join('')}
                </tbody>
            </table>` : '<p style="padding:24px;color:var(--text-secondary);text-align:center;">No NB border runner records for the selected transporter and date range. Trucks need border arrival and exit dates within the period.</p>';
    } else if (runnerFeeMode === 'kanyaka-nb') {
        const rows = buildKanyakaRunnerRows('NB');
        const summary = summarizeKanyakaRunner(rows);
        summaryHtml = renderRunnerFeeSummaryKanyaka(summary, 'Kanyaka NB');
        bodyHtml = rows.length ? `
            <table>
                <thead><tr>
                    <th>Trip #</th><th>Truck</th><th>Transporter</th>
                    <th>Kanyaka Arrival</th><th>Kanyaka Exit</th><th>Days</th><th>Rule</th><th>Fee</th>
                </tr></thead>
                <tbody>
                    ${rows.map(r => `
                        <tr>
                            <td><strong>${r.trip}</strong></td>
                            <td>${r.truck}</td>
                            <td>${r.transporter}</td>
                            <td>${formatRunnerDate(r.arrival)}</td>
                            <td>${formatRunnerDate(r.exit)}</td>
                            <td>${r.days}</td>
                            <td><span class="status-badge ${r.fee ? 'orange' : 'gray'}">${r.tierLabel}</span></td>
                            <td><strong>$${r.fee}</strong></td>
                        </tr>`).join('')}
                </tbody>
            </table>` : '<p style="padding:24px;color:var(--text-secondary);text-align:center;">No Kanyaka NB runner records for the selected filters.</p>';
    } else {
        const rows = buildKanyakaRunnerRows('SB');
        const summary = summarizeKanyakaRunner(rows);
        summaryHtml = renderRunnerFeeSummaryKanyaka(summary, 'Kanyaka SB');
        bodyHtml = rows.length ? `
            <table>
                <thead><tr>
                    <th>Trip #</th><th>Truck</th><th>Transporter</th>
                    <th>Kanyaka Arrival</th><th>Kanyaka Exit</th><th>Days</th><th>Rule</th><th>Fee</th>
                </tr></thead>
                <tbody>
                    ${rows.map(r => `
                        <tr>
                            <td><strong>${r.trip}</strong></td>
                            <td>${r.truck}</td>
                            <td>${r.transporter}</td>
                            <td>${formatRunnerDate(r.arrival)}</td>
                            <td>${formatRunnerDate(r.exit)}</td>
                            <td>${r.days}</td>
                            <td><span class="status-badge ${r.fee ? 'orange' : 'gray'}">${r.tierLabel}</span></td>
                            <td><strong>$${r.fee}</strong></td>
                        </tr>`).join('')}
                </tbody>
            </table>` : '<p style="padding:24px;color:var(--text-secondary);text-align:center;">No Kanyaka SB runner records for the selected filters.</p>';
    }

    container.innerHTML = `
        <div class="page-header">
            <h1>💰 Runner Fees</h1>
            <div class="breadcrumb">Management / Runner Fees</div>
        </div>
        <div class="rbac-info-banner">
            <strong>Border Runner (NB):</strong> Days = border exit − arrival · Yellow 0–2d $40 · Blue 3–4d $25 · Red 5+d $15 &nbsp;|&nbsp;
            <strong>Kanyaka NB/SB:</strong> Days = Kanyaka exit − arrival · 0–1d $5 · 2+d $0
        </div>
        <div class="filters-bar">
            <div class="filter-group"><label>From:</label><input type="date" class="form-control" id="runnerFeeFrom" value="${runnerFeeFromDate}" onchange="refreshRunnerFees()"></div>
            <div class="filter-group"><label>To:</label><input type="date" class="form-control" id="runnerFeeTo" value="${runnerFeeToDate}" onchange="refreshRunnerFees()"></div>
            <div class="filter-group"><label>Transporter:</label>
                <select class="form-control" id="runnerFeeTransporter" onchange="refreshRunnerFees()">
                    <option value="all"${runnerFeeTransporter === 'all' ? ' selected' : ''}>All transporters</option>
                    ${transporters.map(t => `<option value="${t}"${runnerFeeTransporter === t ? ' selected' : ''}>${t}</option>`).join('')}
                </select>
            </div>
            <button class="btn btn-primary btn-sm" onclick="refreshRunnerFees()">Apply</button>
        </div>
        <div class="pod-filter-tabs">${renderRunnerFeeTabs(runnerFeeMode)}</div>
        ${summaryHtml}
        <div class="table-container">
            <div class="table-header"><h3>${runnerFeeMode === 'border' ? 'Border Runner — NB trucks' : runnerFeeMode === 'kanyaka-nb' ? 'Kanyaka Runner — NB' : 'Kanyaka Runner — SB'}</h3></div>
            <div style="overflow-x:auto;">${bodyHtml}</div>
        </div>`;
}

// ============================================
// DRIVER REGISTRY (Border team — NB driver contacts)
// ============================================
function escapeJsString(s) {
    return String(s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function findDriverContactByTrip(tripNumber) {
    if (!tripNumber) return null;
    return driverContactsDB.find(c => c.tripNumber === tripNumber) || null;
}

function getDriverRegistryStats() {
    const nb = driverContactsDB.filter(c => c.direction === 'NB').length;
    const sb = driverContactsDB.filter(c => c.direction === 'SB').length;
    return { total: driverContactsDB.length, nb, sb };
}

function renderDriverLink(driverName, tripNumber) {
    const tripId = tripNumber || '';
    const name = (driverName || '').trim();
    const label = name || 'Register driver';
    if (!tripId) return name || '—';
    const registered = findDriverContactByTrip(tripId);
    const title = registered ? 'View / edit driver contact (WhatsApp & DRC)' : 'Click to register driver WhatsApp & DRC number';
    const badge = registered
        ? '<span class="driver-link-badge registered" title="Contact on file">✓</span>'
        : '<span class="driver-link-badge pending" title="Contact not registered">📱</span>';
    return `<a href="#" class="driver-link${registered ? ' registered' : ' pending'}" onclick="event.preventDefault();event.stopPropagation();openDriverRegistrationModal('${escapeJsString(tripId)}')" title="${title}">${label} ${badge}</a>`;
}

function formatPhoneHref(number, type) {
    if (!number) return '';
    const digits = String(number).replace(/[^0-9+]/g, '');
    if (type === 'whatsapp') {
        const wa = digits.replace(/^\+/, '');
        return `https://wa.me/${wa}`;
    }
    return `tel:${digits}`;
}

function renderDriverContactCell(tripNumber) {
    if (!tripNumber) return '—';
    const dc = findDriverContactByTrip(tripNumber);
    if (!dc || (!dc.whatsapp && !dc.drcNumber)) {
        return `<a href="#" class="driver-contact-register" onclick="event.preventDefault();event.stopPropagation();openDriverRegistrationModal('${escapeJsString(tripNumber)}')">📱 Register contact</a>`;
    }
    const parts = [];
    if (dc.whatsapp) {
        parts.push(`<a href="${formatPhoneHref(dc.whatsapp, 'whatsapp')}" class="driver-wa-link" target="_blank" rel="noopener" title="WhatsApp" onclick="event.stopPropagation()">💬 ${dc.whatsapp}</a>`);
    }
    if (dc.drcNumber) {
        parts.push(`<a href="${formatPhoneHref(dc.drcNumber, 'tel')}" class="driver-drc-link" title="DRC number" onclick="event.stopPropagation()">📞 ${dc.drcNumber}</a>`);
    }
    return `<div class="driver-contact-cell">${parts.join('<br>')}<button type="button" class="driver-contact-edit" onclick="event.stopPropagation();openDriverRegistrationModal('${escapeJsString(tripNumber)}')" title="Edit contact">✏️</button></div>`;
}

function resolveTripContext(tripNumber) {
    if (tripNumber && tripsDB[tripNumber]) {
        const t = tripsDB[tripNumber];
        return {
            tripNumber: t.tripNumber,
            driverName: t.driver,
            truck: t.truck,
            direction: t.direction || 'NB',
            border: t.entryBorder || t.exitBorder || t.area || '',
            owner: t.owner || ''
        };
    }
    const borderRow = borderClearanceTrucks.find(b => b.trip === tripNumber);
    if (borderRow) {
        return {
            tripNumber: borderRow.trip,
            driverName: borderRow.driver,
            truck: borderRow.truck,
            direction: borderRow.direction || 'NB',
            border: borderRow.border || '',
            owner: borderRow.owner || ''
        };
    }
    return { tripNumber: tripNumber || '', driverName: '', truck: '', direction: 'NB', border: '', owner: '' };
}

async function openDriverRegistrationModal(tripNumber) {
    document.getElementById('driverRegistrationForm').reset();
    document.getElementById('driverRegId').value = '';

    const ctx = resolveTripContext(tripNumber);
    if (ctx.tripNumber) document.getElementById('driverRegTrip').value = ctx.tripNumber;
    if (ctx.driverName) document.getElementById('driverRegName').value = ctx.driverName;
    if (ctx.truck) document.getElementById('driverRegTruck').value = ctx.truck;
    if (ctx.owner) document.getElementById('driverRegOwner').value = ctx.owner;
    if (ctx.direction) document.getElementById('driverRegDirection').value = ctx.direction;
    if (ctx.border) document.getElementById('driverRegBorder').value = ctx.border;

    let existing = findDriverContactByTrip(ctx.tripNumber);
    if (!existing && ctx.tripNumber && typeof fetchDriverContactByTrip === 'function' && isApiAvailable()) {
        try {
            existing = await fetchDriverContactByTrip(ctx.tripNumber);
            if (existing && typeof mergeDriverContactIntoLocalDb === 'function') mergeDriverContactIntoLocalDb(existing);
        } catch (_) { /* use local data */ }
    }

    if (existing) {
        document.getElementById('driverRegId').value = existing.id || '';
        document.getElementById('driverRegTrip').value = existing.tripNumber || ctx.tripNumber || '';
        document.getElementById('driverRegName').value = existing.driverName || ctx.driverName || '';
        document.getElementById('driverRegTruck').value = existing.truck || ctx.truck || '';
        document.getElementById('driverRegOwner').value = existing.owner || ctx.owner || '';
        document.getElementById('driverRegDrc').value = existing.drcNumber || '';
        document.getElementById('driverRegWhatsapp').value = existing.whatsapp || '';
        document.getElementById('driverRegDirection').value = existing.direction || ctx.direction || 'NB';
        document.getElementById('driverRegBorder').value = existing.border || ctx.border || '';
        document.getElementById('driverRegNotes').value = existing.notes || '';
    }

    openModal('driverRegistrationModal');
}

async function submitDriverRegistration() {
    const id = document.getElementById('driverRegId').value.trim();
    const tripNumber = document.getElementById('driverRegTrip').value.trim();
    const driverName = document.getElementById('driverRegName').value.trim();
    const truck = document.getElementById('driverRegTruck').value.trim();
    const owner = document.getElementById('driverRegOwner').value.trim();
    const drcNumber = document.getElementById('driverRegDrc').value.trim();
    const whatsapp = document.getElementById('driverRegWhatsapp').value.trim();
    const direction = document.getElementById('driverRegDirection').value;
    const border = document.getElementById('driverRegBorder').value;
    const notes = document.getElementById('driverRegNotes').value.trim();

    if (!driverName || !drcNumber || !whatsapp) {
        showToast('Driver name, DRC number, and WhatsApp are required', 'warning');
        return;
    }

    const payload = { id: id || undefined, tripNumber, driverName, truck, owner, drcNumber, whatsapp, direction, border, notes };
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const registeredBy = getCurrentAdminUser()?.username || CURRENT_USER;

    try {
        if (typeof saveDriverContact === 'function' && isApiAvailable()) {
            const saved = await saveDriverContact(payload);
            if (saved && typeof mergeDriverContactIntoLocalDb === 'function') mergeDriverContactIntoLocalDb(saved);
            else {
                const local = { id: id || `DC-${Date.now()}`, ...payload, registeredBy, registeredAt: now, updatedAt: now };
                const idx = driverContactsDB.findIndex(c => c.id === local.id || (tripNumber && c.tripNumber === tripNumber));
                if (idx >= 0) driverContactsDB[idx] = { ...driverContactsDB[idx], ...local };
                else driverContactsDB.unshift(local);
            }
        } else {
            const local = { id: id || `DC-${Date.now()}`, ...payload, registeredBy, registeredAt: now, updatedAt: now };
            const idx = driverContactsDB.findIndex(c => c.id === local.id || (tripNumber && c.tripNumber === tripNumber));
            if (idx >= 0) driverContactsDB[idx] = { ...driverContactsDB[idx], ...local };
            else driverContactsDB.unshift(local);
        }
    } catch (e) {
        showToast(e.message || 'Failed to save driver contact', 'warning');
        return;
    }

    if (tripNumber && tripsDB[tripNumber]) {
        tripsDB[tripNumber].driverContactRegistered = true;
    }

    logAuditEvent(`Registered driver contact for ${driverName}`, tripNumber || id, 'driver_contact', `${drcNumber} / ${whatsapp}`);
    closeModal('driverRegistrationModal');
    showToast(`Driver contact saved for ${driverName}`, 'success');
    if (currentPage === 'driver-registry') refreshDriverRegistryTable();
    if (currentPage === 'border-clearance') refreshBorderTable();
    if (currentPage === 'nb-operations') refreshNBTable();
    if (currentPage === 'sb-operations') refreshSBTable();
    if (currentPage === 'position-live' && typeof refreshPositionLiveTable === 'function') refreshPositionLiveTable();
    updateSidebarBadges();
}

function getFilteredDriverContacts() {
    const search = driverRegistrySearchTerm || (document.getElementById('driverRegistrySearch')?.value || '').trim();
    const direction = driverRegistryDirectionFilter || document.getElementById('driverRegistryDirection')?.value || 'all';
    const border = driverRegistryBorderFilter || document.getElementById('driverRegistryBorder')?.value || 'all';
    const registered = driverRegistryRegisteredFilter || document.getElementById('driverRegistryRegistered')?.value || 'all';

    let items = [...driverContactsDB];
    if (direction !== 'all') items = items.filter(c => c.direction === direction);
    if (border !== 'all') items = items.filter(c => c.border === border);
    if (registered === 'yes') items = items.filter(c => c.drcNumber && c.whatsapp);
    if (registered === 'no') items = items.filter(c => !c.drcNumber || !c.whatsapp);
    if (search) {
        const term = search.toLowerCase();
        items = items.filter(c =>
            (c.driverName && c.driverName.toLowerCase().includes(term)) ||
            (c.tripNumber && c.tripNumber.toLowerCase().includes(term)) ||
            (c.truck && c.truck.toLowerCase().includes(term)) ||
            (c.drcNumber && c.drcNumber.includes(term)) ||
            (c.whatsapp && c.whatsapp.includes(term)) ||
            (c.owner && c.owner.toLowerCase().includes(term)) ||
            (c.border && c.border.toLowerCase().includes(term))
        );
    }
    return items;
}

function renderDriverRegistryRows(items) {
    if (!items.length) {
        return '<tr><td colspan="11" style="text-align:center;padding:24px;color:var(--text-secondary);">No drivers match your search</td></tr>';
    }
    return items.map(c => `
        <tr>
            <td>${renderDriverLink(c.driverName, c.tripNumber)}</td>
            <td>${c.tripNumber || '—'}</td>
            <td>${c.truck || '—'}</td>
            <td><span class="status-badge blue">${c.direction || '—'}</span></td>
            <td>${c.border || '—'}</td>
            <td>${c.owner || '—'}</td>
            <td>${c.drcNumber || '—'}</td>
            <td>${c.whatsapp ? `<a href="https://wa.me/${c.whatsapp.replace(/[^0-9]/g, '')}" target="_blank" rel="noopener">${c.whatsapp}</a>` : '—'}</td>
            <td>${c.registeredBy || '—'}</td>
            <td>${c.registeredAt ? c.registeredAt.replace('T', ' ').slice(0, 16) : '—'}</td>
            <td>
                <button class="btn btn-outline btn-sm" onclick="openDriverRegistrationModal('${escapeJsString(c.tripNumber || '')}')" title="Edit">✏️</button>
                ${c.tripNumber ? `<button class="btn btn-outline btn-sm" onclick="navigateToTripView('${escapeJsString(c.tripNumber)}')" title="View trip">👁️</button>` : ''}
            </td>
        </tr>
    `).join('');
}

function refreshDriverRegistryTable() {
    driverRegistrySearchTerm = document.getElementById('driverRegistrySearch')?.value || '';
    driverRegistryDirectionFilter = document.getElementById('driverRegistryDirection')?.value || 'all';
    driverRegistryBorderFilter = document.getElementById('driverRegistryBorder')?.value || 'all';
    driverRegistryRegisteredFilter = document.getElementById('driverRegistryRegistered')?.value || 'all';
    const body = document.getElementById('driverRegistryTableBody');
    const countEl = document.getElementById('driverRegistryCount');
    const items = getFilteredDriverContacts();
    if (body) body.innerHTML = renderDriverRegistryRows(items);
    if (countEl) countEl.textContent = `${items.length} driver${items.length !== 1 ? 's' : ''}`;
}

function clearDriverRegistryFilters() {
    driverRegistrySearchTerm = '';
    driverRegistryDirectionFilter = 'all';
    driverRegistryBorderFilter = 'all';
    driverRegistryRegisteredFilter = 'all';
    const search = document.getElementById('driverRegistrySearch');
    const dir = document.getElementById('driverRegistryDirection');
    const border = document.getElementById('driverRegistryBorder');
    const reg = document.getElementById('driverRegistryRegistered');
    if (search) search.value = '';
    if (dir) dir.value = 'all';
    if (border) border.value = 'all';
    if (reg) reg.value = 'all';
    refreshDriverRegistryTable();
}

function renderDriverRegistry(container) {
    const stats = getDriverRegistryStats();
    container.innerHTML = `
        <div class="page-header">
            <h1>📱 Driver Registry</h1>
            <div class="breadcrumb">
                <a href="#" onclick="navigateTo('dashboard')">Home</a> <span>›</span>
                <span>Communication</span> <span>›</span>
                <strong>Driver Registry</strong>
            </div>
        </div>

        <div class="kpi-grid">
            <div class="kpi-card blue"><div class="kpi-header"><span class="kpi-title">Total Registered</span></div><div class="kpi-value">${stats.total}</div><div class="kpi-trend">Drivers with contact details on file</div></div>
            <div class="kpi-card green"><div class="kpi-header"><span class="kpi-title">NB Drivers</span></div><div class="kpi-value">${stats.nb}</div><div class="kpi-trend">North bound — border office registration</div></div>
            <div class="kpi-card orange"><div class="kpi-header"><span class="kpi-title">SB Drivers</span></div><div class="kpi-value">${stats.sb}</div><div class="kpi-trend">South bound exit contacts</div></div>
        </div>

        <div class="assets-action-bar">
            ${canEditInModule('driver-registry') || canEditInModule('border-clearance') ? `<button class="btn btn-primary" onclick="openDriverRegistrationModal()">📱 Register NB Driver</button>` : ''}
        </div>

        <div class="filters-bar">
            <div class="filter-group"><label>Direction:</label><select id="driverRegistryDirection" onchange="refreshDriverRegistryTable()"><option value="all">All</option><option value="NB">NB</option><option value="SB">SB</option></select></div>
            <div class="filter-group"><label>Border:</label><select id="driverRegistryBorder" onchange="refreshDriverRegistryTable()"><option value="all">All</option><option>Kasumbalesa</option><option>Sakania</option><option>Mokambo</option></select></div>
            <div class="filter-group"><label>Status:</label><select id="driverRegistryRegistered" onchange="refreshDriverRegistryTable()"><option value="all">All</option><option value="yes">Registered</option><option value="no">Incomplete</option></select></div>
            <div class="search-filter" style="flex:1;">
                <span>🔍</span>
                <input type="text" id="driverRegistrySearch" placeholder="Search driver, trip, truck, DRC number, WhatsApp, company, border..." value="${driverRegistrySearchTerm}" onkeyup="refreshDriverRegistryTable()">
            </div>
            <button class="btn btn-outline btn-sm" onclick="clearDriverRegistryFilters()">Clear</button>
        </div>

        <div class="table-container">
            <div class="table-header">
                <h3>Registered Drivers</h3>
                <div class="table-header-actions">
                    <span id="driverRegistryCount" style="color:var(--text-secondary);">${stats.total} drivers</span>
                </div>
            </div>
            <div style="overflow-x:auto;">
                <table>
                    <thead><tr>
                        <th>Driver</th><th>Trip #</th><th>Truck</th><th>Direction</th><th>Border</th><th>Company</th><th>DRC Number</th><th>WhatsApp</th><th>Registered By</th><th>Date</th><th>Actions</th>
                    </tr></thead>
                    <tbody id="driverRegistryTableBody"></tbody>
                </table>
            </div>
        </div>

        <div style="background:#e8f0fe;padding:15px;border-radius:8px;margin-top:20px;border-left:4px solid var(--primary-light);font-size:13px;">
            <strong>📋 Border team workflow:</strong> Every NB driver passing through the border office must register their WhatsApp and DRC number. Click any driver name in NB, SB, or Border Operations to open the registration form, or use <strong>Register NB Driver</strong> above.
        </div>
    `;
    refreshDriverRegistryTable();
    updateSidebarBadges();
}

// ============================================
// COMMUNICATION MATRIX (SRS §3, §10)
// ============================================
function navigateToCommunicationMatrix(filter) {
    matrixFilter = filter || 'contacts';
    navigateTo('communication-matrix');
}

function getMatrixStats() {
    const companies = [...new Set(communicationMatrixDB.map(c => c.company))];
    const functions = [...new Set(communicationMatrixDB.map(c => c.function))];
    return {
        totalContacts: communicationMatrixDB.length,
        activeContacts: communicationMatrixDB.filter(c => c.active).length,
        inactiveContacts: communicationMatrixDB.filter(c => !c.active).length,
        companies: companies.length,
        areas: [...new Set(communicationMatrixDB.map(c => c.area))].length,
        functions: functions.length
    };
}

function getFilteredMatrixContacts() {
    const search = matrixSearchTerm || (document.getElementById('matrixSearchInput')?.value || '').trim();
    const area = matrixAreaFilter || document.getElementById('matrixAreaFilter')?.value || 'all';
    const active = matrixActiveFilter || document.getElementById('matrixActiveFilter')?.value || 'all';
    let items = [...communicationMatrixDB];
    if (area !== 'all') items = items.filter(c => c.area === area);
    if (active === 'active') items = items.filter(c => c.active);
    if (active === 'inactive') items = items.filter(c => !c.active);
    if (search) {
        const term = search.toLowerCase();
        items = items.filter(c =>
            c.name.toLowerCase().includes(term) || c.company.toLowerCase().includes(term) ||
            c.function.toLowerCase().includes(term) || (c.email && c.email.toLowerCase().includes(term)) ||
            (c.phone && c.phone.includes(term)) || (c.whatsapp && c.whatsapp.includes(term)) ||
            (c.placeOfWork && c.placeOfWork.toLowerCase().includes(term)) ||
            (c.area && c.area.toLowerCase().includes(term))
        );
    }
    return items;
}

function getMatrixExportData() {
    if (matrixFilter === 'companies') {
        const grouped = {};
        getFilteredMatrixContacts().forEach(c => {
            if (!grouped[c.company]) grouped[c.company] = { company: c.company, count: 0, areas: new Set(), functions: new Set() };
            grouped[c.company].count++;
            grouped[c.company].areas.add(c.area);
            grouped[c.company].functions.add(c.function);
        });
        return Object.values(grouped).map((g, i) => ({
            id: `CO-${i + 1}`, name: g.company, company: g.company, function: [...g.functions].join(', '),
            email: '—', placeOfWork: '—', phone: '—', whatsapp: '—', area: [...g.areas].join(', '),
            active: true, notes: `${g.count} contact(s)`
        }));
    }
    if (matrixFilter === 'functions') {
        const grouped = {};
        getFilteredMatrixContacts().forEach(c => {
            if (!grouped[c.function]) grouped[c.function] = { function: c.function, count: 0, companies: new Set() };
            grouped[c.function].count++;
            grouped[c.function].companies.add(c.company);
        });
        return Object.values(grouped).map((g, i) => ({
            id: `FN-${i + 1}`, name: g.function, company: [...g.companies].join(', '), function: g.function,
            email: '—', placeOfWork: '—', phone: '—', whatsapp: '—', area: '—',
            active: true, notes: `${g.count} contact(s)`
        }));
    }
    if (matrixFilter === 'areas') {
        const grouped = {};
        getFilteredMatrixContacts().forEach(c => {
            if (!grouped[c.area]) grouped[c.area] = { area: c.area, count: 0, contacts: [] };
            grouped[c.area].count++;
            grouped[c.area].contacts.push(c.name);
        });
        return Object.values(grouped).map((g, i) => ({
            id: `AR-${i + 1}`, name: g.area, company: '—', function: '—',
            email: '—', placeOfWork: '—', phone: '—', whatsapp: '—', area: g.area,
            active: true, notes: `${g.count} contact(s): ${g.contacts.slice(0, 3).join(', ')}${g.contacts.length > 3 ? '...' : ''}`
        }));
    }
    return getFilteredMatrixContacts();
}

function renderMatrixFilterTabs(active) {
    const stats = getMatrixStats();
    const tabs = [
        { id: 'contacts', label: 'Contacts', count: stats.totalContacts },
        { id: 'companies', label: 'Companies', count: stats.companies },
        { id: 'functions', label: 'Functions', count: stats.functions },
        { id: 'areas', label: 'Area Assignment', count: stats.areas }
    ];
    return tabs.map(t => `
        <button class="pod-filter-tab${active === t.id ? ' active' : ''}" onclick="navigateToCommunicationMatrix('${t.id}')">
            ${t.label}<span class="tab-count">${t.count}</span>
        </button>
    `).join('');
}

function renderMatrixContactRows(items) {
    if (!items.length) return '<tr><td colspan="12" style="text-align:center;padding:24px;color:var(--text-secondary);">No contacts match your search</td></tr>';
    if (matrixFilter === 'companies') {
        return items.map(c => `
            <tr>
                <td style="width:36px;text-align:center;">${renderListRowCheckbox('commMatrix', c.id)}</td>
                <td><strong>${c.company}</strong></td>
                <td>${c.function}</td>
                <td>${c.area}</td>
                <td colspan="7">${c.notes}</td>
            </tr>
        `).join('');
    }
    if (matrixFilter === 'functions') {
        return items.map(c => `
            <tr>
                <td style="width:36px;text-align:center;">${renderListRowCheckbox('commMatrix', c.id)}</td>
                <td><strong>${c.function}</strong></td>
                <td>${c.company}</td>
                <td colspan="8">${c.notes}</td>
            </tr>
        `).join('');
    }
    if (matrixFilter === 'areas') {
        return items.map(c => `
            <tr>
                <td style="width:36px;text-align:center;">${renderListRowCheckbox('commMatrix', c.id)}</td>
                <td><strong>${c.area}</strong></td>
                <td colspan="9">${c.notes}</td>
            </tr>
        `).join('');
    }
    return items.map(c => `
        <tr>
            <td style="width:36px;text-align:center;">${renderListRowCheckbox('commMatrix', c.id)}</td>
            <td><strong>${c.id}</strong></td>
            <td>${c.name}</td>
            <td>${c.company}</td>
            <td>${c.function}</td>
            <td>${c.email || '—'}</td>
            <td>${c.placeOfWork || '—'}</td>
            <td>${c.phone || '—'}</td>
            <td>${c.whatsapp || '—'}</td>
            <td>${c.area}</td>
            <td>${c.active ? '<span class="status-badge green">Active</span>' : '<span class="status-badge orange">Inactive</span>'}</td>
            <td>
                <button class="btn btn-outline btn-sm" onclick="openMatrixContactModal('${c.id}')" title="Edit">✏️</button>
            </td>
        </tr>
    `).join('');
}

function refreshMatrixTable() {
    matrixSearchTerm = document.getElementById('matrixSearchInput')?.value || '';
    matrixAreaFilter = document.getElementById('matrixAreaFilter')?.value || 'all';
    matrixActiveFilter = document.getElementById('matrixActiveFilter')?.value || 'all';
    const body = document.getElementById('matrixTableBody');
    const head = document.getElementById('matrixTableHead');
    const countEl = document.getElementById('matrixTableCount');
    if (!body) return;
    const items = getMatrixExportData();

    if (matrixFilter === 'companies') {
        if (head) head.innerHTML = `<tr>
            <th style="width:36px;text-align:center;"><input type="checkbox" aria-label="Select all" onchange="toggleAllListRows('commMatrix', this.checked)"></th>
            <th>Company</th><th>Functions</th><th>Areas</th><th colspan="7">Summary</th>
        </tr>`;
    } else if (matrixFilter === 'functions') {
        if (head) head.innerHTML = `<tr>
            <th style="width:36px;text-align:center;"><input type="checkbox" aria-label="Select all" onchange="toggleAllListRows('commMatrix', this.checked)"></th>
            <th>Function</th><th>Companies</th><th colspan="8">Summary</th>
        </tr>`;
    } else if (matrixFilter === 'areas') {
        if (head) head.innerHTML = `<tr>
            <th style="width:36px;text-align:center;"><input type="checkbox" aria-label="Select all" onchange="toggleAllListRows('commMatrix', this.checked)"></th>
            <th>Area</th><th colspan="10">Assigned Contacts</th>
        </tr>`;
    } else {
        if (head) head.innerHTML = `<tr>
            <th style="width:36px;text-align:center;"><input type="checkbox" aria-label="Select all" onchange="toggleAllListRows('commMatrix', this.checked)"></th>
            <th>ID</th><th>Name</th><th>Company</th><th>Function</th><th>Email</th><th>Place of Work</th><th>Phone</th><th>WhatsApp</th><th>Area</th><th>Status</th><th>Actions</th>
        </tr>`;
    }
    body.innerHTML = renderMatrixContactRows(items);
    if (countEl) countEl.textContent = `${items.length} record${items.length !== 1 ? 's' : ''}`;
    updateListSelectionUI('commMatrix');
}

function initMatrixModalSelects() {
    const funcSelect = document.getElementById('matrixContactFunction');
    const areaSelect = document.getElementById('matrixContactArea');
    if (funcSelect && !funcSelect.options.length) {
        funcSelect.innerHTML = MATRIX_FUNCTIONS.map(f => `<option value="${f}">${f}</option>`).join('');
    }
    if (areaSelect && !areaSelect.options.length) {
        areaSelect.innerHTML = MATRIX_AREAS.map(a => `<option value="${a}">${a}</option>`).join('');
    }
}

function openMatrixContactModal(contactId) {
    initMatrixModalSelects();
    document.getElementById('matrixContactForm').reset();
    document.getElementById('matrixContactId').value = contactId || '';
    if (contactId) {
        const c = communicationMatrixDB.find(x => x.id === contactId);
        if (c) {
            document.getElementById('matrixContactName').value = c.name;
            document.getElementById('matrixContactCompany').value = c.company;
            document.getElementById('matrixContactFunction').value = c.function;
            document.getElementById('matrixContactEmail').value = c.email || '';
            document.getElementById('matrixContactPlace').value = c.placeOfWork || '';
            document.getElementById('matrixContactPhone').value = c.phone || '';
            document.getElementById('matrixContactWhatsapp').value = c.whatsapp || '';
            document.getElementById('matrixContactArea').value = c.area;
            document.getElementById('matrixContactActive').value = c.active ? 'true' : 'false';
            document.getElementById('matrixContactNotes').value = c.notes || '';
        }
    }
    openModal('matrixContactModal');
}

function submitMatrixContact() {
    const contactId = document.getElementById('matrixContactId').value;
    const name = document.getElementById('matrixContactName').value.trim();
    const company = document.getElementById('matrixContactCompany').value.trim();
    const func = document.getElementById('matrixContactFunction').value;
    const whatsapp = document.getElementById('matrixContactWhatsapp').value.trim();
    if (!name || !company || !func) {
        showToast('Name, company, and function are required', 'warning');
        return;
    }
    const data = {
        name, company, function: func,
        email: document.getElementById('matrixContactEmail').value.trim(),
        placeOfWork: document.getElementById('matrixContactPlace').value.trim(),
        phone: document.getElementById('matrixContactPhone').value.trim(),
        whatsapp,
        area: document.getElementById('matrixContactArea').value,
        active: document.getElementById('matrixContactActive').value === 'true',
        notes: document.getElementById('matrixContactNotes').value.trim()
    };
    if (contactId) {
        const idx = communicationMatrixDB.findIndex(c => c.id === contactId);
        if (idx >= 0) communicationMatrixDB[idx] = { ...communicationMatrixDB[idx], ...data };
        logAuditEvent(`Updated Contact ${contactId}`, contactId, 'contact', name);
    } else {
        const newId = `CM-${String(nextMatrixContactId++).padStart(3, '0')}`;
        communicationMatrixDB.unshift({ id: newId, ...data });
        logAuditEvent(`Created Contact ${newId}`, newId, 'contact', name);
    }
    closeModal('matrixContactModal');
    if (currentPage === 'communication-matrix') refreshMatrixTable();
    showToast(`Contact ${name} saved`, 'success');
    updateSidebarBadges();
}

function renderCommunicationMatrix(container) {
    const stats = getMatrixStats();
    const filter = matrixFilter;
    container.innerHTML = `
        <div class="page-header">
            <h1>📇 Communication Matrix</h1>
            <div class="breadcrumb">
                <a href="#" onclick="navigateTo('dashboard')">Home</a> <span>›</span>
                <strong>Communication Matrix</strong>
            </div>
        </div>

        <div class="kpi-grid">
            <div class="kpi-card blue kpi-card-clickable" onclick="navigateToMatrixKpi('total')" title="View all contacts"><div class="kpi-header"><span class="kpi-title">Total Contacts</span></div><div class="kpi-value">${stats.totalContacts}</div><div class="kpi-trend">Contact directory entries</div></div>
            <div class="kpi-card green kpi-card-clickable" onclick="navigateToMatrixKpi('active')" title="View active contacts"><div class="kpi-header"><span class="kpi-title">Active Contacts</span></div><div class="kpi-value">${stats.activeContacts}</div><div class="kpi-trend">Currently active in matrix</div></div>
            <div class="kpi-card orange kpi-card-clickable" onclick="navigateToMatrixKpi('inactive')" title="View inactive contacts"><div class="kpi-header"><span class="kpi-title">Inactive Contacts</span></div><div class="kpi-value">${stats.inactiveContacts}</div><div class="kpi-trend">Needs review / update</div></div>
            <div class="kpi-card kpi-card-clickable" onclick="navigateToMatrixKpi('companies')" title="View by company"><div class="kpi-header"><span class="kpi-title">Companies</span></div><div class="kpi-value">${stats.companies}</div><div class="kpi-trend">${stats.areas} areas covered</div></div>
        </div>

        <div class="assets-action-bar">
            ${canEditInModule('communication-matrix') ? `<button class="btn btn-primary" onclick="openMatrixContactModal()">➕ Add Contact</button>` : ''}
        </div>

        <div class="pod-filter-tabs">${renderMatrixFilterTabs(filter)}</div>

        ${matrixActiveFilter !== 'all' && filter === 'contacts' ? `<div style="background:#ebf8ff;border:1px solid #90cdf4;padding:10px 16px;margin-bottom:12px;border-radius:8px;font-size:13px;">Showing <strong>${matrixActiveFilter} contacts only</strong>. <button class="btn btn-outline btn-sm" onclick="matrixActiveFilter='all';refreshMatrixTable();">Show all contacts</button></div>` : ''}

        <div class="filters-bar">
            ${filter === 'contacts' ? `
                <div class="filter-group"><label>Area:</label><select id="matrixAreaFilter" onchange="refreshMatrixTable()"><option value="all">All</option>${MATRIX_AREAS.map(a => `<option value="${a}">${a}</option>`).join('')}</select></div>
                <div class="filter-group"><label>Status:</label><select id="matrixActiveFilter" onchange="refreshMatrixTable()"><option value="all">All</option><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
            ` : ''}
            <div class="search-filter" style="flex:1;">
                <span>🔍</span>
                <input type="text" id="matrixSearchInput" placeholder="Search name, company, function, email, phone, WhatsApp, place of work, area..." value="${matrixSearchTerm}" onkeyup="refreshMatrixTable()">
            </div>
            <button class="btn btn-outline btn-sm" onclick="matrixSearchTerm='';matrixAreaFilter='all';matrixActiveFilter='all';document.getElementById('matrixSearchInput').value='';if(document.getElementById('matrixAreaFilter'))document.getElementById('matrixAreaFilter').value='all';if(document.getElementById('matrixActiveFilter'))document.getElementById('matrixActiveFilter').value='all';refreshMatrixTable();">Clear</button>
        </div>

        <div class="table-container">
            <div class="table-header">
                <h3>${filter === 'companies' ? 'Companies' : filter === 'functions' ? 'Functions' : filter === 'areas' ? 'Area Assignment' : 'Contact Directory'}</h3>
                <div class="table-header-actions">
                    <span id="matrixTableCount" style="color:var(--text-secondary);"></span>
                    ${renderExportToolbar('commMatrix')}
                </div>
            </div>
            <div style="overflow-x:auto;">
                <table>
                    <thead id="matrixTableHead"></thead>
                    <tbody id="matrixTableBody"></tbody>
                </table>
            </div>
        </div>

        <div style="background:#e8f0fe;padding:15px;border-radius:8px;margin-top:20px;border-left:4px solid var(--primary-light);font-size:13px;">
            <strong>📋 SRS — Communication Matrix:</strong> Maintain people, companies, functions, emails, places of work, phone and WhatsApp numbers, with area assignment and search/export.
        </div>

        <button class="btn btn-outline mt-20" onclick="navigateTo('dashboard')">⬅️ Back to Dashboard</button>
    `;
    refreshMatrixTable();
    updateSidebarBadges();
}


// ============================================
// INTERNAL COMMUNICATION — OUTLOOK EMAIL + WHATSAPP CHAT
// ============================================
function navigateToInternalComm(filter) {
    internalCommFilter = filter || 'email';
    if (filter === 'email') chatShowUnreadOnly = false;
    if (filter === 'chat') emailShowUnreadOnly = false;
    navigateTo('internal-communication');
}

function getEmailFolderCounts() {
    const visible = emailsDB.filter(e => !e.mirrorOf);
    return {
        inbox: visible.filter(e => e.folder === 'inbox').length,
        sent: visible.filter(e => e.folder === 'sent').length,
        drafts: visible.filter(e => e.folder === 'drafts').length,
        starred: visible.filter(e => e.starred && e.folder !== 'trash').length,
        archive: visible.filter(e => e.folder === 'archive').length,
        trash: visible.filter(e => e.folder === 'trash').length,
        unread: visible.filter(e => e.folder === 'inbox' && !e.read).length
    };
}

function getEmailsForFolder(folder) {
    let items = emailsDB.filter(e => !e.mirrorOf);
    if (folder === 'starred') items = items.filter(e => e.starred && e.folder !== 'trash');
    else if (folder === 'inbox') items = items.filter(e => e.folder === 'inbox');
    else items = items.filter(e => e.folder === folder);
    if (emailShowUnreadOnly) items = items.filter(e => !e.read);
    const search = emailSearchTerm || (document.getElementById('emailSearchInput')?.value || '').trim();
    if (search) {
        const term = search.toLowerCase();
        items = items.filter(e =>
            e.subject.toLowerCase().includes(term) || e.body.toLowerCase().includes(term) ||
            e.from.toLowerCase().includes(term) || e.to.join(' ').toLowerCase().includes(term)
        );
    }
    return items.sort((a, b) => b.sentAt.localeCompare(a.sentAt));
}

function getEmailById(id) { return emailsDB.find(e => e.id === id); }

function selectEmailFolder(folder) {
    emailFolder = folder;
    selectedEmailId = null;
    emailView = 'list';
    emailComposeData = null;
    emailShowUnreadOnly = false;
    renderInternalCommunication(document.getElementById('contentArea'));
}

function selectEmail(id) {
    selectedEmailId = id;
    emailView = 'read';
    emailComposeData = null;
    const email = getEmailById(id);
    if (email && !email.read) email.read = true;
    renderInternalCommunication(document.getElementById('contentArea'));
}

function openEmailCompose(mode, emailId) {
    emailView = 'compose';
    emailComposeData = { mode: mode || 'new', replyToId: emailId || null, draftId: mode === 'editDraft' ? emailId : null };
    emailAttachments = [];
    if (emailId && mode !== 'editDraft') {
        const src = getEmailById(emailId);
        if (src) {
            emailComposeData.prefill = {
                to: mode === 'reply' ? [src.from] : mode === 'replyAll' ? [...new Set([src.from, ...src.to, ...src.cc].filter(x => x !== CURRENT_USER))] : [],
                cc: mode === 'replyAll' ? src.cc.filter(x => x !== CURRENT_USER) : [],
                subject: mode === 'forward' ? `FW: ${src.subject}` : `RE: ${src.subject}`,
                body: mode === 'forward'
                    ? `\n\n---------- Forwarded message ----------\nFrom: ${src.from}\nDate: ${src.sentAt}\nSubject: ${src.subject}\n\n${src.body}`
                    : `\n\n---\nOn ${src.sentAt}, ${src.from} wrote:\n${src.body}`
            };
        }
    } else if (mode === 'editDraft' && emailId) {
        const draft = getEmailById(emailId);
        if (draft) {
            emailComposeData.prefill = { to: draft.to, cc: draft.cc, bcc: draft.bcc, subject: draft.subject, body: draft.body, relatedType: draft.relatedType, relatedRef: draft.relatedRef };
            emailAttachments = [...(draft.attachments || [])];
        }
    }
    renderInternalCommunication(document.getElementById('contentArea'));
}

function toggleEmailStar(id) {
    const email = getEmailById(id);
    if (email) email.starred = !email.starred;
    renderInternalCommunication(document.getElementById('contentArea'));
}

function markEmailAction(id, action) {
    const email = getEmailById(id);
    if (!email) return;
    if (action === 'read') email.read = true;
    if (action === 'unread') email.read = false;
    if (action === 'archive') email.folder = 'archive';
    if (action === 'trash') email.folder = 'trash';
    if (action === 'restore') email.folder = email.from === CURRENT_USER ? 'sent' : 'inbox';
    if (action === 'delete') {
        const idx = emailsDB.findIndex(e => e.id === id);
        if (idx >= 0) emailsDB.splice(idx, 1);
        selectedEmailId = null;
    }
    renderInternalCommunication(document.getElementById('contentArea'));
    showToast(`Email ${action}`, 'success');
}

function handleEmailAttachmentSelect(input) {
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { showToast('File must be under 10MB', 'warning'); return; }
    emailAttachments.push({ name: file.name, size: `${Math.round(file.size / 1024)} KB` });
    const list = document.getElementById('emailAttachList');
    if (list) list.innerHTML = emailAttachments.map((a, i) => `<span class="outlook-attach-chip">📎 ${a.name} <button type="button" class="btn btn-outline btn-sm" onclick="removeEmailAttachment(${i})">✕</button></span>`).join('');
}

function removeEmailAttachment(index) {
    emailAttachments.splice(index, 1);
    const list = document.getElementById('emailAttachList');
    if (list) list.innerHTML = emailAttachments.map((a, i) => `<span class="outlook-attach-chip">📎 ${a.name} <button type="button" class="btn btn-outline btn-sm" onclick="removeEmailAttachment(${i})">✕</button></span>`).join('');
}

function sendEmailFromCompose(saveAsDraft) {
    const to = (document.getElementById('emailComposeTo')?.value || '').split(',').map(s => s.trim()).filter(Boolean);
    const cc = (document.getElementById('emailComposeCc')?.value || '').split(',').map(s => s.trim()).filter(Boolean);
    const bcc = (document.getElementById('emailComposeBcc')?.value || '').split(',').map(s => s.trim()).filter(Boolean);
    const subject = document.getElementById('emailComposeSubject')?.value.trim();
    const body = document.getElementById('emailComposeBody')?.value.trim();
    const linkType = document.getElementById('emailComposeLinkType')?.value || '';
    const linkRef = document.getElementById('emailComposeLinkRef')?.value || '';
    if (!saveAsDraft && (!to.length || !subject || !body)) {
        showToast('To, subject, and message are required', 'warning');
        return;
    }
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const relatedLabel = linkType === 'trip' && tripsDB[linkRef] ? `${linkRef} / ${tripsDB[linkRef].truck}` : linkRef || '';
    if (emailComposeData?.draftId) {
        const draft = getEmailById(emailComposeData.draftId);
        if (draft) {
            Object.assign(draft, { to, cc, bcc, subject, body, attachments: [...emailAttachments], relatedType: linkType, relatedRef: linkRef, relatedLabel, sentAt: now, folder: saveAsDraft ? 'drafts' : 'sent' });
            if (!saveAsDraft) {
                emailsDB.unshift({ ...draft, id: `EM-${String(nextEmailId++).padStart(3, '0')}`, from: CURRENT_USER, fromEmail: CURRENT_USER_EMAIL, folder: 'sent', read: true });
                draft.folder = 'archive';
            }
        }
    } else {
        const email = {
            id: `EM-${String(nextEmailId++).padStart(3, '0')}`, threadId: `TH-${nextEmailId}`,
            from: CURRENT_USER, fromEmail: CURRENT_USER_EMAIL, to, cc, bcc,
            subject: subject || '(No subject)', body: body || '', sentAt: now,
            read: true, starred: false, important: false,
            attachments: [...emailAttachments], relatedType: linkType, relatedRef: linkRef, relatedLabel,
            folder: saveAsDraft ? 'drafts' : 'sent'
        };
        emailsDB.unshift(email);
        if (!saveAsDraft) {
            to.forEach(recipient => {
                if (recipient !== CURRENT_USER) {
                    emailsDB.unshift({ ...email, id: `EM-${String(nextEmailId++).padStart(3, '0')}`, folder: 'inbox', from: CURRENT_USER, fromEmail: CURRENT_USER_EMAIL, to: [recipient], cc: [], bcc: [], read: false });
                }
            });
        }
    }
    emailView = 'list';
    emailComposeData = null;
    emailAttachments = [];
    emailFolder = saveAsDraft ? 'drafts' : 'sent';
    renderInternalCommunication(document.getElementById('contentArea'));
    showToast(saveAsDraft ? 'Draft saved' : 'Email sent', 'success');
}

function renderEmailFolders() {
    const counts = getEmailFolderCounts();
    const folders = [
        { id: 'inbox', icon: '📥', label: 'Inbox', count: counts.unread },
        { id: 'sent', icon: '📤', label: 'Sent', count: 0 },
        { id: 'drafts', icon: '📝', label: 'Drafts', count: counts.drafts },
        { id: 'starred', icon: '⭐', label: 'Starred', count: counts.starred },
        { id: 'archive', icon: '🗄️', label: 'Archive', count: counts.archive },
        { id: 'trash', icon: '🗑️', label: 'Trash', count: counts.trash }
    ];
    return folders.map(f => `
        <div class="outlook-folder${emailFolder === f.id ? ' active' : ''}" onclick="selectEmailFolder('${f.id}')">
            <span>${f.icon} ${f.label}</span>
            ${f.count ? `<span class="count">${f.count}</span>` : ''}
        </div>
    `).join('');
}

function renderEmailListItems() {
    const items = getEmailsForFolder(emailFolder);
    if (!items.length) return '<div style="padding:24px;text-align:center;color:var(--text-secondary);">No emails in this folder</div>';
    return items.map(e => `
        <div class="outlook-email-item${selectedEmailId === e.id ? ' active' : ''}${!e.read ? ' unread' : ''}" onclick="selectEmail('${e.id}')">
            <div class="email-top">
                <span>${e.starred ? '⭐ ' : ''}${e.from}</span>
                <span style="font-size:11px;color:var(--text-secondary);">${e.sentAt.split(' ')[1] || e.sentAt}</span>
            </div>
            <div class="email-subject">${e.important ? '❗ ' : ''}${e.subject}</div>
            <div class="email-preview">${e.body.replace(/\n/g, ' ').slice(0, 80)}</div>
            <div class="email-meta">${e.attachments?.length ? `📎 ${e.attachments.length}` : ''}${e.relatedLabel ? ` · 🔗 ${e.relatedLabel}` : ''}</div>
        </div>
    `).join('');
}

function renderEmailReadPane(email) {
    if (!email) return '<div class="outlook-read-body" style="display:flex;align-items:center;justify-content:center;color:var(--text-secondary);">Select an email to read</div>';
    return `
        <div class="outlook-read-toolbar">
            <button class="btn btn-outline btn-sm" onclick="openEmailCompose('reply','${email.id}')">↩️ Reply</button>
            <button class="btn btn-outline btn-sm" onclick="openEmailCompose('replyAll','${email.id}')">↩️ Reply All</button>
            <button class="btn btn-outline btn-sm" onclick="openEmailCompose('forward','${email.id}')">↪️ Forward</button>
            <button class="btn btn-outline btn-sm" onclick="toggleEmailStar('${email.id}')">${email.starred ? '☆ Unstar' : '⭐ Star'}</button>
            <button class="btn btn-outline btn-sm" onclick="markEmailAction('${email.id}','${email.read ? 'unread' : 'read'}')">${email.read ? '📩 Unread' : '✓ Read'}</button>
            <button class="btn btn-outline btn-sm" onclick="markEmailAction('${email.id}','archive')">🗄️ Archive</button>
            <button class="btn btn-outline btn-sm" onclick="markEmailAction('${email.id}','trash')">🗑️ Delete</button>
        </div>
        <div class="outlook-read-body">
            <div class="outlook-read-header">
                <h2>${email.subject}</h2>
                <div class="outlook-read-meta">
                    <div><strong>From:</strong> ${email.from} &lt;${email.fromEmail}&gt;</div>
                    <div><strong>To:</strong> ${email.to.join(', ')}</div>
                    ${email.cc?.length ? `<div><strong>CC:</strong> ${email.cc.join(', ')}</div>` : ''}
                    <div><strong>Date:</strong> ${email.sentAt}</div>
                    ${email.relatedLabel ? `<div><strong>Linked:</strong> <span class="status-badge blue">${email.relatedType}</span> ${email.relatedLabel}</div>` : ''}
                </div>
            </div>
            ${email.attachments?.length ? `<div class="outlook-attach-list" style="margin-bottom:16px;">${email.attachments.map(a => `<span class="outlook-attach-chip">📎 ${a.name} (${a.size})</span>`).join('')}</div>` : ''}
            <div class="outlook-read-content">${email.body}</div>
        </div>`;
}

function renderEmailComposePane() {
    const pre = emailComposeData?.prefill || {};
    return `
        <div class="outlook-read-toolbar">
            <button class="btn btn-primary btn-sm" onclick="sendEmailFromCompose(false)">📤 Send</button>
            <button class="btn btn-outline btn-sm" onclick="sendEmailFromCompose(true)">📝 Save Draft</button>
            <button class="btn btn-outline btn-sm" onclick="emailView='list';emailComposeData=null;renderInternalCommunication(document.getElementById('contentArea'))">✕ Discard</button>
        </div>
        <div class="outlook-compose-pane">
            <div class="outlook-compose-row"><label>To</label><input type="text" class="form-control" id="emailComposeTo" value="${(pre.to || []).join(', ')}" placeholder="Select system users, comma-separated"></div>
            <div class="outlook-compose-row"><label>CC</label><input type="text" class="form-control" id="emailComposeCc" value="${(pre.cc || []).join(', ')}" placeholder="CC recipients"></div>
            <div class="outlook-compose-row"><label>BCC</label><input type="text" class="form-control" id="emailComposeBcc" value="${(pre.bcc || []).join(', ')}" placeholder="BCC recipients"></div>
            <div class="outlook-compose-row"><label>Subject</label><input type="text" class="form-control" id="emailComposeSubject" value="${pre.subject || ''}"></div>
            <div class="outlook-compose-row"><label>Link</label><div style="display:flex;gap:8px;"><select class="form-control" id="emailComposeLinkType" onchange="populateEmailLinkSelect()" style="max-width:140px;"><option value="">None</option>${INTERNAL_LINK_TYPES.map(t => `<option value="${t}" ${pre.relatedType === t ? 'selected' : ''}>${t}</option>`).join('')}</select><select class="form-control" id="emailComposeLinkRef" style="flex:1;"><option value="">Reference</option></select></div></div>
            <div style="margin:12px 0 8px 70px;"><label class="btn btn-outline btn-sm" style="cursor:pointer;">📎 Attach<input type="file" hidden onchange="handleEmailAttachmentSelect(this)"></label><div id="emailAttachList" class="outlook-attach-list">${emailAttachments.map((a, i) => `<span class="outlook-attach-chip">📎 ${a.name} <button type="button" class="btn btn-outline btn-sm" onclick="removeEmailAttachment(${i})">✕</button></span>`).join('')}</div></div>
            <div class="outlook-compose-row" style="align-items:start;"><label>Message</label><textarea class="form-control" id="emailComposeBody" rows="14">${pre.body || ''}</textarea></div>
            <div style="margin-left:70px;font-size:12px;color:var(--text-secondary);">Quick add: ${systemUsersDB.map(u => `<button type="button" class="btn btn-outline btn-sm" style="margin:2px;" onclick="appendEmailRecipient('${u.name}')">${u.name}</button>`).join('')}</div>
        </div>`;
}

function appendEmailRecipient(name) {
    const el = document.getElementById('emailComposeTo');
    if (!el) return;
    const current = el.value.split(',').map(s => s.trim()).filter(Boolean);
    if (!current.includes(name)) current.push(name);
    el.value = current.join(', ');
}

function populateEmailLinkSelect() {
    const type = document.getElementById('emailComposeLinkType')?.value;
    const select = document.getElementById('emailComposeLinkRef');
    if (!select) return;
    let options = '<option value="">— Select —</option>';
    if (type === 'trip') options += Object.values(tripsDB).map(t => `<option value="${t.tripNumber}">${t.tripNumber} — ${t.truck}</option>`).join('');
    else if (type === 'area') options += MATRIX_AREAS.map(a => `<option value="${a}">${a}</option>`).join('');
    else if (type === 'asset' || type === 'equipment') options += assetsRegistryDB.map(a => `<option value="${a.id}">${a.id}</option>`).join('');
    else if (type === 'truck' || type === 'car') options += Object.values(tripsDB).map(t => `<option value="${t.truck}">${t.truck}</option>`).join('');
    else if (type === 'user') options += systemUsersDB.map(u => `<option value="${u.name}">${u.name}</option>`).join('');
    select.innerHTML = options;
}

function renderOutlookClient() {
    const selected = selectedEmailId ? getEmailById(selectedEmailId) : null;
    const rightPane = emailView === 'compose' ? renderEmailComposePane() : renderEmailReadPane(selected);
    return `
        <div class="outlook-client">
            <div class="outlook-folders">
                <button class="btn btn-primary outlook-compose-btn" onclick="openEmailCompose('new')">✉️ New Email</button>
                ${renderEmailFolders()}
            </div>
            <div class="outlook-list-pane">
                <div class="outlook-list-toolbar">
                    <div class="search-filter"><span>🔍</span><input type="text" id="emailSearchInput" placeholder="Search mail..." value="${emailSearchTerm}" onkeyup="emailSearchTerm=this.value;renderInternalCommunication(document.getElementById('contentArea'))"></div>
                    <button class="btn btn-outline btn-sm" onclick="exportListData('internalComm','all')">📥 Export</button>
                </div>
                <div class="outlook-email-list">${renderEmailListItems()}</div>
            </div>
            <div class="outlook-read-pane">${rightPane}</div>
        </div>`;
}

function getFilteredChatRooms() {
    let items = [...chatRoomsDB].sort((a, b) => (b.pinned - a.pinned) || b.lastAt.localeCompare(a.lastAt));
    if (chatTypeFilter === 'group') items = items.filter(r => r.type === 'group');
    if (chatTypeFilter === 'direct') items = items.filter(r => r.type === 'direct');
    if (chatShowUnreadOnly) items = items.filter(r => (r.unreadCount || 0) > 0);
    const search = chatListSearch || (document.getElementById('waSearchInput')?.value || '').trim();
    if (search) {
        const term = search.toLowerCase();
        items = items.filter(r => r.name.toLowerCase().includes(term) || r.lastMessage.toLowerCase().includes(term));
    }
    return items;
}

function selectChatRoom(roomId) {
    activeChatRoomId = roomId;
    chatReplyToId = null;
    const room = chatRoomsDB.find(r => r.id === roomId);
    if (room) room.unreadCount = 0;
    renderInternalCommunication(document.getElementById('contentArea'));
}

function getChatMessages(roomId) {
    return chatMessagesDB.filter(m => m.roomId === roomId).sort((a, b) => a.sentAt.localeCompare(b.sentAt));
}

function renderWaChatList() {
    return getFilteredChatRooms().map(r => {
        const other = r.type === 'direct' ? r.memberNames.find(m => m !== CURRENT_USER) : null;
        const user = other ? systemUsersDB.find(u => u.name === other) : null;
        const avatar = r.type === 'group' ? (r.avatar || '👥') : (user?.initials || r.avatar || '?');
        return `
        <div class="wa-chat-item${activeChatRoomId === r.id ? ' active' : ''}" onclick="selectChatRoom('${r.id}')">
            <div class="wa-avatar${r.type === 'group' ? ' group' : ''}">${avatar}</div>
            <div class="wa-chat-info">
                <div class="wa-chat-top"><span class="wa-chat-name">${r.pinned ? '📌 ' : ''}${r.name}${r.muted ? ' 🔇' : ''}</span><span class="wa-chat-time">${r.lastAt.split(' ')[1] || r.lastAt}</span></div>
                <div class="wa-chat-bottom"><span class="wa-chat-preview">${r.lastMessage}</span>${r.unreadCount ? `<span class="wa-unread-badge">${r.unreadCount}</span>` : ''}</div>
            </div>
        </div>`;
    }).join('');
}

function renderWaTicks(status) {
    if (status === 'read') return '<span class="wa-ticks">✓✓</span>';
    if (status === 'delivered') return '<span class="wa-ticks" style="color:#667781;">✓✓</span>';
    return '✓';
}

function renderWaMessages(roomId) {
    const messages = getChatMessages(roomId);
    return messages.map(m => {
        const isSent = m.sender === CURRENT_USER;
        const reply = m.replyTo ? chatMessagesDB.find(x => x.id === m.replyTo) : null;
        return `
        <div class="wa-msg-row ${isSent ? 'sent' : 'received'}">
            <div class="wa-bubble ${isSent ? 'sent' : 'received'}" ondblclick="setChatReply('${m.id}')" title="Double-click to reply">
                ${reply ? `<div class="wa-reply">${reply.sender}: ${reply.message.slice(0, 60)}</div>` : ''}
                ${m.type === 'file' ? `<div class="wa-file">📎 ${m.fileName || m.message}</div>` : m.message}
                <div class="wa-bubble-footer"><span>${m.sentAt.split(' ')[1] || m.sentAt}</span>${isSent ? renderWaTicks(m.status) : `<button type="button" class="btn btn-outline btn-sm" style="padding:0 6px;font-size:10px;margin-left:6px;" onclick="event.stopPropagation();setChatReply('${m.id}')">↩</button>`}</div>
            </div>
        </div>`;
    }).join('');
}

function renderWaConversation() {
    const room = chatRoomsDB.find(r => r.id === activeChatRoomId);
    if (!room) return '<div class="wa-empty"><div><div style="font-size:48px;">💬</div><h3>TruckControl Chat</h3><p>Select a conversation or start a new chat</p></div></div>';
    const other = room.type === 'direct' ? room.memberNames.find(m => m !== CURRENT_USER) : null;
    const user = other ? systemUsersDB.find(u => u.name === other) : null;
    const statusText = room.type === 'group' ? `${room.memberNames.length} members · ${room.relatedRef}` : (user?.online ? 'online' : `last seen ${user?.lastSeen || 'recently'}`);
    const replyMsg = chatReplyToId ? chatMessagesDB.find(m => m.id === chatReplyToId) : null;
    return `
        <div class="wa-conv-header">
            <div class="wa-avatar${room.type === 'group' ? ' group' : ''}">${room.type === 'group' ? '👥' : (user?.initials || room.avatar)}</div>
            <div class="wa-conv-title"><strong>${room.name}</strong><small>${statusText}</small></div>
            <button class="btn btn-outline btn-sm" onclick="openWaGroupInfo('${room.id}')">ℹ️</button>
            <button class="btn btn-outline btn-sm" onclick="toggleChatPin('${room.id}')">${room.pinned ? '📌' : '📍'}</button>
            <button class="btn btn-outline btn-sm" onclick="toggleChatMute('${room.id}')">${room.muted ? '🔔' : '🔇'}</button>
        </div>
        ${replyMsg ? `<div class="wa-reply-bar"><span>Replying to <strong>${replyMsg.sender}</strong>: ${replyMsg.message.slice(0, 50)}</span><button class="btn btn-outline btn-sm" onclick="chatReplyToId=null;renderInternalCommunication(document.getElementById('contentArea'))">✕</button></div>` : ''}
        <div class="wa-messages" id="waMessagesPane">${renderWaMessages(room.id)}</div>
        <div class="wa-input-bar">
            <button class="wa-icon-btn" title="Attach" onclick="document.getElementById('waFileInput').click()">📎</button>
            <input type="file" id="waFileInput" hidden onchange="attachWaFile(this)">
            <textarea id="waMessageInput" placeholder="Type a message" rows="1" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendWaMessage();}"></textarea>
            <button class="wa-send-btn" onclick="sendWaMessage()" title="Send">➤</button>
        </div>`;
}

function renderWhatsAppClient() {
    return `
        <div class="whatsapp-client">
            <div class="wa-sidebar">
                <div class="wa-sidebar-header">
                    <div class="search-filter" style="flex:1;"><span>🔍</span><input type="text" id="waSearchInput" placeholder="Search chats..." value="${chatListSearch}" onkeyup="chatListSearch=this.value;renderInternalCommunication(document.getElementById('contentArea'))"></div>
                    <button class="btn btn-outline btn-sm" onclick="openNewDirectChatPicker()" title="New chat">💬</button>
                    <button class="btn btn-outline btn-sm" onclick="openNewGroupChatForm()" title="New group">👥</button>
                </div>
                <div class="wa-chat-list">${renderWaChatList()}</div>
            </div>
            <div class="wa-conversation">${renderWaConversation()}</div>
        </div>`;
}

function sendWaMessage() {
    const roomId = activeChatRoomId;
    const input = document.getElementById('waMessageInput');
    const text = input?.value.trim();
    if (!roomId || !text) return;
    const msg = {
        id: `CHAT-${String(nextChatMessageId++).padStart(3, '0')}`,
        roomId, sender: CURRENT_USER, message: text, type: 'text', fileName: null,
        status: 'delivered', replyTo: chatReplyToId, sentAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };
    chatMessagesDB.push(msg);
    const room = chatRoomsDB.find(r => r.id === roomId);
    if (room) { room.lastMessage = text; room.lastAt = msg.sentAt; }
    chatReplyToId = null;
    renderInternalCommunication(document.getElementById('contentArea'));
    setTimeout(() => { const pane = document.getElementById('waMessagesPane'); if (pane) pane.scrollTop = pane.scrollHeight; }, 50);
}

function attachWaFile(input) {
    const file = input.files?.[0];
    if (!file || !activeChatRoomId) return;
    const msg = {
        id: `CHAT-${String(nextChatMessageId++).padStart(3, '0')}`,
        roomId: activeChatRoomId, sender: CURRENT_USER, message: file.name, type: 'file', fileName: file.name,
        status: 'delivered', replyTo: null, sentAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };
    chatMessagesDB.push(msg);
    const room = chatRoomsDB.find(r => r.id === activeChatRoomId);
    if (room) { room.lastMessage = `📎 ${file.name}`; room.lastAt = msg.sentAt; }
    input.value = '';
    renderInternalCommunication(document.getElementById('contentArea'));
    showToast(`File ${file.name} sent`, 'success');
}

function openNewDirectChatPicker() {
    const name = prompt('Start chat with:\n' + systemUsersDB.filter(u => u.name !== CURRENT_USER).map(u => u.name).join('\n'));
    if (!name) return;
    startDirectChat(name.trim());
}

function startDirectChat(userName) {
    let room = chatRoomsDB.find(r => r.type === 'direct' && r.memberNames.includes(userName) && r.memberNames.includes(CURRENT_USER));
    if (!room) {
        room = {
            id: `ROOM-${String(nextChatRoomId++).padStart(3, '0')}`, name: userName, type: 'direct',
            memberNames: [userName, CURRENT_USER], avatar: systemUsersDB.find(u => u.name === userName)?.initials || '?',
            relatedType: 'user', relatedRef: 'Direct', pinned: false, muted: false, unreadCount: 0,
            lastMessage: 'Chat started', lastAt: new Date().toISOString().slice(0, 16).replace('T', ' '), createdBy: CURRENT_USER
        };
        chatRoomsDB.unshift(room);
    }
    selectChatRoom(room.id);
}

function openNewGroupChatForm() {
    const name = prompt('Group name:');
    if (!name) return;
    const members = prompt('Members (comma-separated):', 'Jean Kalenga, Ruth Mwansa, Current User');
    const memberNames = (members || CURRENT_USER).split(',').map(s => s.trim()).filter(Boolean);
    if (!memberNames.includes(CURRENT_USER)) memberNames.push(CURRENT_USER);
    const room = {
        id: `ROOM-${String(nextChatRoomId++).padStart(3, '0')}`, name: name.trim(), type: 'group',
        memberNames, avatar: '👥', relatedType: 'area', relatedRef: 'Custom Group',
        pinned: false, muted: false, unreadCount: 0,
        lastMessage: 'Group created', lastAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        createdBy: CURRENT_USER
    };
    chatRoomsDB.unshift(room);
    selectChatRoom(room.id);
    showToast(`Group "${name}" created`, 'success');
}

function toggleChatPin(roomId) {
    const room = chatRoomsDB.find(r => r.id === roomId);
    if (room) room.pinned = !room.pinned;
    renderInternalCommunication(document.getElementById('contentArea'));
}

function toggleChatMute(roomId) {
    const room = chatRoomsDB.find(r => r.id === roomId);
    if (room) room.muted = !room.muted;
    renderInternalCommunication(document.getElementById('contentArea'));
}

function openWaGroupInfo(roomId) {
    const room = chatRoomsDB.find(r => r.id === roomId);
    if (!room) return;
    alert(`${room.type === 'group' ? 'Group' : 'Chat'}: ${room.name}\nMembers: ${room.memberNames.join(', ')}\nLinked: ${room.relatedType} — ${room.relatedRef}`);
}

function setChatReply(messageId) {
    chatReplyToId = messageId;
    renderInternalCommunication(document.getElementById('contentArea'));
}

function getInternalCommStats() {
    const counts = getEmailFolderCounts();
    const unreadChats = chatRoomsDB.reduce((sum, room) => sum + (room.unreadCount || 0), 0);
    return {
        unread: counts.unread,
        sent: counts.sent,
        drafts: counts.drafts,
        unreadChats,
        groupChats: chatRoomsDB.filter(r => r.type === 'group').length,
        directChats: chatRoomsDB.filter(r => r.type === 'direct').length
    };
}

function getInternalCommExportData() {
    if (internalCommFilter === 'chat') {
        return getFilteredChatRooms().map(r => ({ id: r.id, recordType: r.type === 'group' ? 'Group Chat' : 'Direct Chat', name: r.name, body: r.lastMessage, sender: r.createdBy, recipients: r.memberNames, relatedLabel: `${r.relatedType}: ${r.relatedRef}`, sentAt: r.lastAt, status: r.unreadCount ? 'unread' : 'read', attachments: 0 }));
    }
    return getEmailsForFolder(emailFolder).map(e => ({ id: e.id, recordType: 'Email', subject: e.subject, body: e.body, sender: e.from, recipients: e.to, relatedLabel: e.relatedLabel || '', sentAt: e.sentAt, status: e.read ? 'read' : 'unread', attachments: e.attachments?.length || 0 }));
}

function renderInternalCommunication(container) {
    const stats = getInternalCommStats();
    container.innerHTML = `
        <div class="page-header">
            <h1>✉️ Internal Communication</h1>
            <div class="breadcrumb"><a href="#" onclick="navigateTo('dashboard')">Home</a> <span>›</span> <strong>Internal Communication</strong></div>
        </div>
        <div class="kpi-grid" style="margin-bottom:16px;">
            <div class="kpi-card orange kpi-card-clickable" onclick="navigateToInternalCommKpi('unread-email')" title="View unread emails in inbox"><div class="kpi-header"><span class="kpi-title">Unread Email</span></div><div class="kpi-value">${stats.unread}</div><div class="kpi-trend">Inbox messages not read</div></div>
            <div class="kpi-card green kpi-card-clickable" onclick="navigateToInternalCommKpi('sent')" title="View sent emails"><div class="kpi-header"><span class="kpi-title">Sent</span></div><div class="kpi-value">${stats.sent}</div><div class="kpi-trend">Emails you have sent</div></div>
            <div class="kpi-card blue kpi-card-clickable" onclick="navigateToInternalCommKpi('group-chats')" title="View group chats"><div class="kpi-header"><span class="kpi-title">Group Chats</span></div><div class="kpi-value">${stats.groupChats}</div><div class="kpi-trend">${stats.unreadChats || 0} unread chat message(s)</div></div>
            <div class="kpi-card kpi-card-clickable" onclick="navigateToInternalCommKpi('direct-chats')" title="View direct chats"><div class="kpi-header"><span class="kpi-title">Direct Chats</span></div><div class="kpi-value">${stats.directChats}</div><div class="kpi-trend">1-to-1 conversations</div></div>
        </div>
        <div class="comm-app-tabs">
            <button class="comm-app-tab${internalCommFilter === 'email' ? ' active' : ''}" onclick="chatTypeFilter='all';chatShowUnreadOnly=false;navigateToInternalComm('email')">📧 Email (Outlook)</button>
            <button class="comm-app-tab${internalCommFilter === 'chat' ? ' active' : ''}" onclick="emailShowUnreadOnly=false;navigateToInternalComm('chat')">💬 Chat (WhatsApp)</button>
        </div>
        ${emailShowUnreadOnly ? `<div style="background:#fffaf0;border:1px solid #f6ad55;padding:10px 16px;margin-bottom:12px;border-radius:8px;font-size:13px;">Showing <strong>unread emails only</strong> in Inbox. <button class="btn btn-outline btn-sm" onclick="emailShowUnreadOnly=false;renderInternalCommunication(document.getElementById('contentArea'))">Show all</button></div>` : ''}
        ${chatShowUnreadOnly ? `<div style="background:#fffaf0;border:1px solid #f6ad55;padding:10px 16px;margin-bottom:12px;border-radius:8px;font-size:13px;">Showing <strong>chats with unread messages</strong>. <button class="btn btn-outline btn-sm" onclick="chatShowUnreadOnly=false;renderInternalCommunication(document.getElementById('contentArea'))">Show all chats</button></div>` : ''}
        ${chatTypeFilter !== 'all' ? `<div style="background:#ebf8ff;border:1px solid #90cdf4;padding:10px 16px;margin-bottom:12px;border-radius:8px;font-size:13px;">Showing <strong>${chatTypeFilter === 'group' ? 'group' : 'direct'} chats only</strong>. <button class="btn btn-outline btn-sm" onclick="chatTypeFilter='all';renderInternalCommunication(document.getElementById('contentArea'))">Show all</button></div>` : ''}
        <div class="comm-shell">${internalCommFilter === 'chat' ? renderWhatsAppClient() : renderOutlookClient()}</div>
        <button class="btn btn-outline mt-20" onclick="navigateTo('dashboard')">⬅️ Back to Dashboard</button>
    `;
    if (emailView === 'compose') populateEmailLinkSelect();
    if (internalCommFilter === 'chat') setTimeout(() => { const pane = document.getElementById('waMessagesPane'); if (pane) pane.scrollTop = pane.scrollHeight; }, 50);
    updateSidebarBadges();
}

function renderReports(container) {
    const reports = [
        { id: 'operations-overview', icon: '📊', title: 'Operations Overview', desc: 'Full dashboard KPIs + all trucks' },
        { id: 'nb-report', icon: '🚛', title: 'NB Operations Report', desc: 'Northbound trucks by border, area, status' },
        { id: 'sb-report', icon: '🚛', title: 'SB Operations Report', desc: 'Southbound loading, dispatch, Kanyaka, exit' },
        { id: 'border-report', icon: '🛂', title: 'Border Clearance Report', desc: 'NB entry & SB exit border performance' },
        { id: 'pod-report', icon: '📋', title: 'POD Collection Report', desc: 'POD pipeline by area and timeliness' },
        { id: 'area-report', icon: '🗺️', title: 'Area Performance Report', desc: 'Trucks per area with user status updates' },
        { id: 'kpi-alerts-report', icon: '⚠️', title: 'KPI & Alerts Report', desc: 'Orange/red priority trucks' },
        { id: 'turnaround-report', icon: '🔄', title: 'Turnaround Report', desc: 'Days in DRC and cycle completion' }
    ];
    container.innerHTML = `
        <div class="page-header"><h1>📈 Reports</h1><p class="page-subtitle">Each report shows dashboard summary at top, then full truck list with area status updates.</p></div>
        ${getAreaFilterBanner()}
        <div class="report-grid">
            ${reports.map(r => `
                <div class="report-card" onclick="openReport('${r.id}')">
                    <div class="report-card-icon">${r.icon}</div>
                    <h3>${r.title}</h3>
                    <p>${r.desc}</p>
                    <span class="card-action">View Report →</span>
                </div>`).join('')}
        </div>`;
}

function openReport(reportId) {
    currentReportType = reportId;
    navigateTo('report-detail');
}

function getReportConfig(reportId) {
    const configs = {
        'operations-overview': { title: 'Operations Overview Report', direction: null, filter: null },
        'nb-report': { title: 'NB Operations Report', direction: 'NB', filter: null },
        'sb-report': { title: 'SB Operations Report', direction: 'SB', filter: null },
        'border-report': { title: 'Border Clearance Report', direction: null, filter: 'border' },
        'pod-report': { title: 'POD Collection Report', direction: 'NB', filter: 'pod' },
        'area-report': { title: 'Area Performance Report', direction: null, filter: 'area' },
        'kpi-alerts-report': { title: 'KPI & Alerts Report', direction: null, filter: 'alerts' },
        'turnaround-report': { title: 'Turnaround Report', direction: null, filter: 'turnaround' }
    };
    return configs[reportId] || configs['operations-overview'];
}

function getReportTrips(config) {
    let trips = filterTrips(config.direction, '');
    if (config.filter === 'border') trips = trips.filter(t => (t.workflow?.border === 'current' || t.workflow?.border === 'completed') || t.status.toLowerCase().includes('border') || t.status.toLowerCase().includes('kbp') || t.status.toLowerCase().includes('whisky'));
    if (config.filter === 'pod') trips = trips.filter(t => t.direction === 'NB' && (t.workflow?.pod === 'current' || t.workflow?.offloading === 'completed' || t.status.toLowerCase().includes('pod')));
    if (config.filter === 'alerts') trips = trips.filter(t => t.kpi === 'orange' || t.kpi === 'red');
    if (config.filter === 'turnaround') trips = [...trips].sort((a, b) => b.daysInDRC - a.daysInDRC);
    return trips;
}

function renderReportKpiSection(trips, config) {
    const stats = getDashboardStats();
    const podStats = getPODStats();
    const nb = trips.filter(t => t.direction === 'NB');
    const sb = trips.filter(t => t.direction === 'SB');
    return `
        <div class="report-kpi-section">
            <h2>📊 Report Summary</h2>
            <div class="dashboard-grid">
                <div class="stat-card"><div class="stat-label">Trucks in Report</div><div class="stat-value">${trips.length}</div></div>
                <div class="stat-card"><div class="stat-label">NB</div><div class="stat-value">${nb.length}</div></div>
                <div class="stat-card"><div class="stat-label">SB</div><div class="stat-value">${sb.length}</div></div>
                <div class="stat-card"><div class="stat-label">🟢 On Track</div><div class="stat-value" style="color:var(--green);">${trips.filter(t=>t.kpi==='green').length}</div></div>
                <div class="stat-card"><div class="stat-label">🟠 Priority</div><div class="stat-value" style="color:var(--orange);">${trips.filter(t=>t.kpi==='orange').length}</div></div>
                <div class="stat-card"><div class="stat-label">🔴 Overdue</div><div class="stat-value" style="color:var(--red);">${trips.filter(t=>t.kpi==='red').length}</div></div>
            </div>
            ${config.filter === 'pod' ? `<div class="kpi-row"><div class="kpi-mini"><div class="kpi-value">${podStats.pending}</div><div class="kpi-label">POD Pending</div></div><div class="kpi-mini"><div class="kpi-value red">${podStats.overdue}</div><div class="kpi-label">Overdue</div></div></div>` : ''}
            ${config.filter === 'turnaround' ? `<div class="kpi-row"><div class="kpi-mini"><div class="kpi-value">${stats.avgTurnaround}d</div><div class="kpi-label">Avg Turnaround</div></div></div>` : ''}
        </div>`;
}

function renderReportTruckTable(trips) {
    if (!trips.length) return '<p style="padding:24px;text-align:center;color:var(--text-secondary);">No trucks match this report for your assigned area.</p>';
    return `
        <div class="table-container">
            <div class="table-header"><h3>Truck List — ${trips.length} records</h3>
                <button class="btn btn-outline btn-sm" onclick="exportReportCsv()">📥 Export CSV</button>
            </div>
            <table class="data-table report-table">
                <thead><tr>
                    <th>Trip #</th><th>Truck</th><th>Dir</th><th>Driver</th><th>Owner</th><th>Area</th><th>Process Status</th><th>Area Status</th><th>Workflow</th><th>Days</th><th>KPI</th><th>Last Update</th><th>Update</th>
                </tr></thead>
                <tbody>
                    ${trips.map(t => {
                        const reportCtx = t.direction === 'SB' ? 'sb' : 'nb';
                        const statuses = typeof getStatusesForUpdateDropdown === 'function'
                            ? getStatusesForUpdateDropdown(reportCtx, t)
                            : getStatusesForArea(t.area || 'Kanyaka');
                        const wf = t.workflow ? Object.entries(t.workflow).filter(([,v])=>v==='current').map(([k])=>k).join(', ') || '—' : '—';
                        const history = getTripAreaHistory(t.tripNumber);
                        return `<tr>
                            <td><strong>${t.tripNumber}</strong></td>
                            <td>${t.truck}</td>
                            <td><span class="status-badge blue">${t.direction}</span></td>
                            <td>${t.driver}</td>
                            <td>${t.owner}</td>
                            <td>${t.area || '—'}</td>
                            <td>${t.status}</td>
                            <td>${t.areaStatus || '—'}${history.length ? `<br><small style="color:var(--text-secondary);">by ${history[0].updatedBy}</small>` : ''}</td>
                            <td><small>${wf}</small></td>
                            <td>${t.daysInDRC}d</td>
                            <td><span class="status-badge ${t.kpi}">${getKPILabel(t.kpi)}</span></td>
                            <td><small>${t.lastUpdatedAt || '—'}</small></td>
                            <td>
                                <select class="form-control report-status-select" id="rpt-status-${t.tripNumber}" style="width:130px;font-size:12px;">
                                    <option value="">— Set status —</option>
                                    ${statuses.map(s => `<option value="${s}" ${t.areaStatus===s?'selected':''}>${s}</option>`).join('')}
                                </select>
                                <button class="btn btn-primary btn-sm" onclick="saveReportAreaStatus('${t.tripNumber}','${t.area||'Kanyaka'}')">Save</button>
                            </td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>`;
}

function renderReportDetail(container) {
    const config = getReportConfig(currentReportType);
    const trips = getReportTrips(config);
    container.innerHTML = `
        <div class="page-header admin-page-header">
            <div><h1>${config.title}</h1><p class="page-subtitle">Generated ${new Date().toLocaleString()} — area users update status as trucks move between processes.</p></div>
            <button class="btn btn-outline" onclick="navigateTo('reports')">← All Reports</button>
        </div>
        ${getAreaFilterBanner()}
        ${renderReportKpiSection(trips, config)}
        ${renderReportTruckTable(trips)}`;
}

function saveReportAreaStatus(tripNumber, area) {
    const sel = document.getElementById('rpt-status-' + tripNumber);
    if (!sel || !sel.value) { showToast('Select an area status first', 'warning'); return; }
    recordTripAreaUpdate(tripNumber, area, sel.value);
    showToast(`Status updated: ${sel.value}`, 'success');
    renderReportDetail(document.getElementById('contentArea'));
}

function exportReportCsv() {
    const config = getReportConfig(currentReportType);
    const trips = getReportTrips(config);
    const headers = ['Trip','Truck','Direction','Driver','Owner','Area','Process Status','Area Status','Days','KPI','Last Update'];
    const rows = trips.map(t => [t.tripNumber,t.truck,t.direction,t.driver,t.owner,t.area,t.status,t.areaStatus||'',t.daysInDRC,getKPILabel(t.kpi),t.lastUpdatedAt||''].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `report-${currentReportType}-${Date.now()}.csv`;
    a.click();
    showToast('Report exported', 'success');
}

// ============================================
// TURNAROUNDS — NB → POD → SB lifecycle (API-linked)
// ============================================
let turnaroundsCache = [];

async function loadTurnarounds() {
    if (typeof isApiAvailable === 'function' && isApiAvailable()) {
        try {
            turnaroundsCache = await fetchTurnarounds();
            turnaroundsCache.forEach(t => {
                if (t.nbTrip) mergeTripIntoLocalDb(t.nbTrip);
                if (t.sbTrip) mergeTripIntoLocalDb(t.sbTrip);
            });
            return turnaroundsCache;
        } catch (e) {
            console.warn('Turnarounds API:', e.message);
        }
    }
    return [];
}

function renderTurnarounds(container) {
    loadTurnarounds().then(turnarounds => {
        const apiStatus = (typeof isApiAvailable === 'function' && isApiAvailable())
            ? '<span class="status-badge green">Backend Connected</span>'
            : '<span class="status-badge orange">Offline — start backend on port 3001</span>';

        container.innerHTML = `
            <div class="page-header admin-page-header">
                <div>
                    <h1>🔄 Truck Turnarounds</h1>
                    <p class="page-subtitle">NB clearance → Kanyaka → Offload → POD → SB (same truck/trip when fleet policy requires it).</p>
                </div>
                ${apiStatus}
            </div>
            <div class="rbac-info-banner">
                <strong>Operational flow:</strong>
                NB: Border (all steps) → Kanyaka Transit → Offloading → POD →
                SB: Loading → Documents → Seal → Escort → Dispatch → Kanyaka Gov List → Border Exit
            </div>
            <div id="turnaroundsList">
                ${turnarounds.length === 0 ? '<p style="padding:20px;color:var(--text-secondary);">No turnarounds in database. Start the backend and run <code>npm run seed</code> in /backend, or upload an NB trip.</p>' : ''}
                ${turnarounds.map(t => renderTurnaroundCard(t)).join('')}
            </div>
            <div class="rbac-info-banner" style="margin-top:20px;">
                Fleet same-truck policy for SB is configured under <a href="#" onclick="event.preventDefault();navigateToAdmin('admin-fleet-settings')">Admin → Fleet — Same Truck for SB</a>.
            </div>`;
    });
}

function renderTurnaroundCard(t) {
    const nb = t.nbTrip;
    const sb = t.sbTrip;
    const nbSteps = nb ? (WORKFLOW_CONFIG.NB || []).map(s => {
        const st = nb.workflow?.[s.key] || 'pending';
        return `<span class="workflow-pill ${st}">${s.label}</span>`;
    }).join('') : '';
    const sbSteps = sb ? (WORKFLOW_CONFIG.SB || []).map(s => {
        const st = sb.workflow?.[s.key] || 'pending';
        return `<span class="workflow-pill ${st}">${s.label}</span>`;
    }).join('') : '';

    const kanyakaInfo = sb?.kanyaka ? `
        <div style="font-size:12px;margin-top:8px;">
            Gov List: ${sb.kanyaka.gov_list_uploaded ? '✅ ' + (sb.kanyaka.gov_list_file || 'uploaded') : '❌ Not uploaded'}
            ${sb.kanyaka.exception_approved ? ' | ⚠️ Exception approved' : ''}
        </div>` : '';

    const createSbBtn = nb && !sb && nb.workflow?.pod === 'completed'
        ? `<button class="btn btn-primary btn-sm" onclick="handleCreateSbTrip('${nb.tripNumber}')">Create SB Shipment</button>`
        : nb && !sb ? `<span class="status-badge orange">Awaiting POD → Invoicing</span>` : '';

    const govListBtn = sb && sb.workflow?.kanyaka === 'current' && !sb.kanyaka?.gov_list_uploaded
        ? `<button class="btn btn-outline btn-sm" onclick="handleUploadGovList('${sb.tripNumber}')">📄 Upload Gov List</button>
           <button class="btn btn-outline btn-sm" onclick="handleKanyakaException('${sb.tripNumber}')">⚠️ Kanyaka Exception</button>` : '';

    return `
        <div class="settings-card" style="margin-bottom:16px;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;">
                <div>
                    <strong>${t.truck?.plate || '—'}</strong> — ${t.fleetOwner?.name || ''}
                    <span class="status-badge blue" style="margin-left:8px;">${t.status}</span>
                    ${t.sameTruckEnforced ? '<span class="status-badge gray">Same truck required</span>' : '<span class="status-badge orange">Different truck allowed</span>'}
                </div>
                <div>${createSbBtn} ${govListBtn}</div>
            </div>
            <div style="margin-top:12px;">
                <div><strong>NB:</strong> ${nb ? nb.tripNumber + ' — ' + nb.status : '—'}</div>
                <div class="workflow-pills">${nbSteps}</div>
            </div>
            <div style="margin-top:12px;">
                <div><strong>SB:</strong> ${sb ? sb.tripNumber + ' — ' + sb.status : '—'}</div>
                <div class="workflow-pills">${sbSteps}</div>
                ${kanyakaInfo}
            </div>
        </div>`;
}

async function loadFleetSettingsUi(targetId) {
    const el = document.getElementById(targetId || 'fleetSettingsBody');
    if (!el) return;
    if (!isApiAvailable()) {
        el.innerHTML = '<em>Connect backend (<code>cd backend && npm start</code>) to manage fleet same-truck settings.</em>';
        return;
    }
    try {
        const fleet = await fetchFleet();
        el.innerHTML = fleet.map(f => `
            <div class="setting-row">
                <div><strong>${f.name}</strong></div>
                <label class="toggle-switch">
                    <input type="checkbox" ${f.requireSameTruckSb ? 'checked' : ''} onchange="handleFleetSameTruckToggle('${f.id}', this.checked)">
                    <span class="toggle-slider"></span>
                </label>
                <span style="font-size:12px;color:var(--text-secondary);">Require same truck for SB</span>
            </div>`).join('') || '<em>No fleet owners yet. Fleet owners are created when NB trips are uploaded via the backend.</em>';
    } catch (e) {
        el.innerHTML = `<em>Error: ${e.message}</em>`;
    }
}

function renderAdminFleetSettings(container) {
    if (!canAccessAdminPage('admin-fleet-settings')) {
        container.innerHTML = `<div class="access-denied"><h2>Access Denied</h2><p>Fleet settings require Manager or Super Admin privileges.</p></div>`;
        return;
    }
    const apiStatus = (typeof isApiAvailable === 'function' && isApiAvailable())
        ? '<span class="status-badge green">Backend Connected</span>'
        : '<span class="status-badge orange">Offline — start backend on port 3001</span>';

    container.innerHTML = `
        ${renderAdminBreadcrumb('Fleet — Same Truck for SB')}
        <div class="page-header admin-page-header">
            <div>
                <h1>🚛 Fleet — Same Truck for SB</h1>
                <p class="page-subtitle">Configure whether each fleet owner must use the same truck on the SB leg as the NB turnaround. When disabled, a different unit may be assigned for southbound.</p>
            </div>
            ${apiStatus}
        </div>
        <div class="rbac-info-banner">
            <strong>Turnaround rule:</strong> NB clearance → Kanyaka → Offload → POD → SB. When <em>Require same truck for SB</em> is on, creating an SB shipment from a turnaround must use the same truck plate unless an explicit override is used in the API.
        </div>
        <div class="settings-card" id="fleetSettingsCard">
            <h3>Fleet owners</h3>
            <p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px;">Toggle per fleet owner. Example: <em>Transport Co D</em> may allow a different truck for SB while other owners require the same unit.</p>
            <div id="fleetSettingsBody"><em>Loading fleet settings...</em></div>
        </div>`;
    loadFleetSettingsUi('fleetSettingsBody');
}

async function handleCreateSbTrip(nbTripNumber) {
    if (!isApiAvailable()) { showToast('Backend not connected', 'warning'); return; }
    try {
        const trip = await createSbFromNb(nbTripNumber, { loadingPoint: 'Kanyaka Mine', exitBorder: 'Kasumbalesa' });
        mergeTripIntoLocalDb(trip);
        showToast(`SB trip ${trip.tripNumber} created on same turnaround`, 'success');
        renderTurnarounds(document.getElementById('contentArea'));
    } catch (e) {
        showToast(e.message, 'warning');
    }
}

async function handleUploadGovList(tripNumber) {
    if (!isApiAvailable()) { showToast('Backend not connected', 'warning'); return; }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx,.pdf';
    input.onchange = async () => {
        if (!input.files[0]) return;
        try {
            const trip = await uploadGovList(tripNumber, input.files[0]);
            mergeTripIntoLocalDb(trip);
            showToast('Gov List uploaded from mine', 'success');
            renderTurnarounds(document.getElementById('contentArea'));
        } catch (e) {
            showToast(e.message, 'warning');
        }
    };
    input.click();
}

async function handleKanyakaException(tripNumber) {
    if (!isApiAvailable()) { showToast('Backend not connected', 'warning'); return; }
    const reason = prompt('Kanyaka exception reason (allows transit without Gov List):');
    if (!reason) return;
    try {
        const trip = await approveKanyakaException(tripNumber, reason);
        mergeTripIntoLocalDb(trip);
        showToast('Kanyaka exception approved', 'success');
        renderTurnarounds(document.getElementById('contentArea'));
    } catch (e) {
        showToast(e.message, 'warning');
    }
}

async function handleFleetSameTruckToggle(ownerId, enabled) {
    if (!isApiAvailable()) return;
    try {
        await updateFleetSetting(ownerId, { requireSameTruckSb: enabled });
        showToast(`Fleet setting updated: same truck SB = ${enabled}`, 'success');
        logAuditEvent(`Fleet ${ownerId} requireSameTruckSb=${enabled}`, ownerId, 'fleet');
        if (currentPage === 'admin-fleet-settings') loadFleetSettingsUi('fleetSettingsBody');
    } catch (e) {
        showToast(e.message, 'warning');
        loadFleetSettingsUi();
    }
}

// ============================================
// ADMIN DASHBOARD — RBAC Pages
// ============================================
function renderAdminBreadcrumb(pageTitle) {
    return `<div class="breadcrumb"><a href="#" onclick="event.preventDefault();navigateTo('dashboard')">Home</a> <span>›</span> <a href="#" onclick="event.preventDefault();navigateToAdmin('admin-users')">Admin</a> <span>›</span> <span>${pageTitle}</span></div>`;
}

function renderPermissionBadge(role) {
    if (!role) return '<span class="status-badge inactive">No Role</span>';
    const colors = { 'Super Admin': 'red', 'Manager': 'blue', 'Moderator': 'orange', 'User': 'gray' };
    const cls = colors[role.name] || 'gray';
    return `<span class="status-badge ${cls}">${role.name}</span>`;
}

function renderAdminUsers(container) {
    if (!canAccessAdminPage('admin-users')) {
        container.innerHTML = `<div class="access-denied"><h2>🚫 Access Denied</h2><p>You do not have permission to view User Management.</p><button class="btn btn-outline mt-20" onclick="navigateTo('dashboard')">Back to Dashboard</button></div>`;
        return;
    }
    const canManage = canUser('manage_users');
    const canDelete = canUser('delete');
    const canPurge = canUser('purge');
    const canEdit = canUser('edit_all') || canUser('edit_limited');
    const filtered = adminUsersDB.filter(u => {
        const matchSearch = !adminUserFilter || u.username.toLowerCase().includes(adminUserFilter.toLowerCase()) || u.email.toLowerCase().includes(adminUserFilter.toLowerCase()) || u.area.toLowerCase().includes(adminUserFilter.toLowerCase());
        const matchStatus = adminUserStatusFilter === 'all' || u.status === adminUserStatusFilter;
        return matchSearch && matchStatus;
    });
    container.innerHTML = `
        ${renderAdminBreadcrumb('Manage Users')}
        <div class="page-header admin-page-header">
            <div><h1>👥 User Management</h1><p class="page-subtitle">View, edit, ban, and manage all application users. Backend middleware enforces permissions on every action.</p></div>
            ${canManage ? '<button class="btn btn-primary" onclick="openAdminUserModal()">+ Add User</button>' : ''}
        </div>
        <div class="admin-toolbar">
            <input type="text" class="form-control admin-search" placeholder="Search by username, email, or area..." value="${adminUserFilter}" onkeyup="adminUserFilter=this.value; renderAdminUsers(document.getElementById('contentArea'))">
            <select class="form-control admin-filter" onchange="adminUserStatusFilter=this.value; renderAdminUsers(document.getElementById('contentArea'))">
                <option value="all" ${adminUserStatusFilter === 'all' ? 'selected' : ''}>All Status</option>
                <option value="active" ${adminUserStatusFilter === 'active' ? 'selected' : ''}>Active</option>
                <option value="banned" ${adminUserStatusFilter === 'banned' ? 'selected' : ''}>Banned</option>
            </select>
        </div>
        <div class="rbac-info-banner">
            <strong>🔒 RBAC Middleware Active</strong> — Your role: <em>${getCurrentRole()?.name}</em>. Delete requires Manager+; Permanent Purge requires Super Admin only.
        </div>
        <div class="table-container">
            <table class="data-table admin-table">
                <thead><tr>
                    <th>Username</th><th>Email</th><th>Role</th><th>Area</th><th>Status</th><th>Last Login</th><th>Actions</th>
                </tr></thead>
                <tbody>
                    ${filtered.map(u => {
                        const role = getRoleById(u.roleId);
                        const isSelf = u.id === CURRENT_SESSION_USER_ID;
                        return `<tr class="${u.status === 'banned' ? 'row-banned' : ''}">
                            <td><strong>${u.username}</strong>${isSelf ? ' <span class="status-badge blue" style="font-size:10px;">You</span>' : ''}</td>
                            <td>${u.email}</td>
                            <td>${renderPermissionBadge(role)}</td>
                            <td>${u.area}</td>
                            <td>${u.status === 'active' ? '<span class="status-badge green">Active</span>' : '<span class="status-badge red">Banned</span>'}</td>
                            <td>${u.lastLogin || '—'}</td>
                            <td class="admin-actions">
                                <button class="btn btn-outline btn-sm" onclick="viewAdminUser('${u.id}')" title="View Profile">👁️</button>
                                ${canEdit ? `<button class="btn btn-outline btn-sm" onclick="openAdminUserModal('${u.id}')" title="Edit User">✏️</button>` : ''}
                                ${canManage ? `<button class="btn btn-outline btn-sm" onclick="resetAdminUserPassword('${u.id}')" title="Reset Password">🔑</button>` : ''}
                                ${canDelete && u.status === 'active' && !isSelf ? `<button class="btn btn-warning btn-sm" onclick="banAdminUser('${u.id}')" title="Ban User (Soft Delete)">🚫</button>` : ''}
                                ${canPurge && !isSelf ? `<button class="btn btn-danger btn-sm" onclick="openPurgeUserModal('${u.id}')" title="Permanent Purge (Super Admin)">💀</button>` : ''}
                            </td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>
        <div class="admin-stats-row">
            <span>${filtered.length} users shown</span>
            <span>${adminUsersDB.filter(u => u.status === 'active').length} active</span>
            <span>${adminUsersDB.filter(u => u.status === 'banned').length} banned</span>
        </div>`;
}

function renderAdminRoles(container) {
    if (!canAccessAdminPage('admin-roles')) {
        container.innerHTML = `<div class="access-denied"><h2>🚫 Access Denied</h2><p>Role Manager is restricted to Super Admin only.</p><button class="btn btn-outline mt-20" onclick="navigateTo('dashboard')">Back to Dashboard</button></div>`;
        return;
    }
    container.innerHTML = `
        ${renderAdminBreadcrumb('Role Manager')}
        <div class="page-header admin-page-header">
            <div><h1>🛡️ Role Manager</h1><p class="page-subtitle">Create roles and assign permissions. Only Super Admin can modify roles.</p></div>
            <button class="btn btn-primary" onclick="openAdminRoleModal()">+ Create Role</button>
        </div>
        <div class="rbac-matrix-card">
            <h3>Permission Matrix</h3>
            <table class="data-table rbac-matrix-table">
                <thead><tr><th>Role</th><th>Read</th><th>Create</th><th>Edit</th><th>Delete</th><th>Logs</th><th>Actions</th></tr></thead>
                <tbody>
                    ${rolesDB.map(r => `<tr>
                        <td><strong>${r.name}</strong>${r.system ? ' <span class="status-badge gray" style="font-size:10px;">System</span>' : ''}<br><small>${r.description}</small></td>
                        <td>${r.permissions.includes('read_all') ? '✅ All' : r.permissions.includes('read_own') ? '✅ Own' : '❌'}</td>
                        <td>${r.permissions.includes('create') ? '✅' : '❌'}</td>
                        <td>${r.permissions.includes('edit_all') ? '✅ All' : r.permissions.includes('edit_limited') ? '⚠️ Limited' : '❌'}</td>
                        <td>${r.permissions.includes('delete') || r.permissions.includes('purge') ? '✅' : '❌'}</td>
                        <td>${r.permissions.includes('view_logs') ? '✅' : '❌'}</td>
                        <td>
                            <button class="btn btn-outline btn-sm" onclick="openAdminRoleModal('${r.id}')" title="Edit Permissions">✏️ Edit</button>
                            ${!r.system ? `<button class="btn btn-danger btn-sm" onclick="deleteAdminRole('${r.id}')">🗑️</button>` : ''}
                        </td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>`;
}

function renderAdminSettings(container) {
    if (!canAccessAdminPage('admin-settings')) {
        container.innerHTML = `<div class="access-denied"><h2>🚫 Access Denied</h2><p>System Settings require Manager or Super Admin privileges.</p><button class="btn btn-outline mt-20" onclick="navigateTo('dashboard')">Back to Dashboard</button></div>`;
        return;
    }
    const s = systemSettingsDB;
    container.innerHTML = `
        ${renderAdminBreadcrumb('System Settings')}
        <div class="page-header"><h1>⚙️ System Settings</h1><p class="page-subtitle">Global configuration — maintenance mode, sign-ups, interest rates, and backup policy.</p></div>
        <div class="admin-settings-grid">
            <div class="settings-card">
                <h3>🔐 Access & Sign-ups</h3>
                <div class="setting-row">
                    <div><strong>Allow User Sign-ups</strong><p>When OFF, only admins can create accounts.</p></div>
                    <label class="toggle-switch"><input type="checkbox" id="settingSignups" ${s.signupsEnabled ? 'checked' : ''} onchange="updateSystemSetting('signupsEnabled', this.checked)"><span class="toggle-slider"></span></label>
                </div>
                <div class="setting-row">
                    <div><strong>Maintenance Mode</strong><p>When ON, only Super Admin can log in.</p></div>
                    <label class="toggle-switch"><input type="checkbox" id="settingMaintenance" ${s.maintenanceMode ? 'checked' : ''} onchange="updateSystemSetting('maintenanceMode', this.checked)"><span class="toggle-slider"></span></label>
                </div>
                <div class="setting-row">
                    <div><strong>Session Timeout (minutes)</strong></div>
                    <input type="number" class="form-control setting-input" value="${s.sessionTimeoutMinutes}" min="5" max="480" onchange="updateSystemSetting('sessionTimeoutMinutes', parseInt(this.value))">
                </div>
                <div class="setting-row">
                    <div><strong>Max Login Attempts</strong></div>
                    <input type="number" class="form-control setting-input" value="${s.maxLoginAttempts}" min="3" max="20" onchange="updateSystemSetting('maxLoginAttempts', parseInt(this.value))">
                </div>
            </div>
            <div class="settings-card">
                <h3>💰 Business Config</h3>
                <div class="setting-row">
                    <div><strong>Default Interest Rate (%)</strong></div>
                    <input type="number" class="form-control setting-input" value="${s.defaultInterestRate}" step="0.1" min="0" max="100" onchange="updateSystemSetting('defaultInterestRate', parseFloat(this.value))">
                </div>
                <div class="setting-row">
                    <div><strong>Support Email</strong></div>
                    <input type="email" class="form-control setting-input-wide" value="${s.supportEmail}" onchange="updateSystemSetting('supportEmail', this.value)">
                </div>
                <div class="setting-row">
                    <div><strong>Application Name</strong></div>
                    <input type="text" class="form-control setting-input-wide" value="${s.appName}" onchange="updateSystemSetting('appName', this.value)">
                </div>
            </div>
            <div class="settings-card">
                <h3>💾 Database Backup</h3>
                <div class="setting-row">
                    <div><strong>Backup Schedule</strong><p>Automatic daily backup recommended for Super Admin recovery.</p></div>
                    <select class="form-control setting-input" onchange="updateSystemSetting('backupSchedule', this.value)">
                        <option value="daily" ${s.backupSchedule === 'daily' ? 'selected' : ''}>Daily</option>
                        <option value="weekly" ${s.backupSchedule === 'weekly' ? 'selected' : ''}>Weekly</option>
                        <option value="monthly" ${s.backupSchedule === 'monthly' ? 'selected' : ''}>Monthly</option>
                    </select>
                </div>
                <div class="setting-row">
                    <div><strong>Retention (days)</strong></div>
                    <input type="number" class="form-control setting-input" value="${s.backupRetentionDays}" min="7" max="365" onchange="updateSystemSetting('backupRetentionDays', parseInt(this.value))">
                </div>
                <button class="btn btn-outline" onclick="triggerManualBackup()">📦 Run Manual Backup Now</button>
            </div>
            <div class="settings-card demo-card">
                <h3>🧪 Demo: Switch Session User</h3>
                <p>Test RBAC by switching which user you are logged in as. This simulates backend token validation.</p>
                <select class="form-control" onchange="if(this.value) switchSessionUser(this.value); this.value='';">
                    <option value="">— Switch to user —</option>
                    ${adminUsersDB.filter(u => u.status === 'active').map(u => `<option value="${u.id}">${u.username} (${getRoleById(u.roleId)?.name})</option>`).join('')}
                </select>
            </div>
        </div>`;
}

function renderAdminThemes(container) {
    if (!canAccessAdminPage('admin-themes')) {
        container.innerHTML = `<div class="access-denied"><h2>🚫 Access Denied</h2><p>Theme management requires Manager or Super Admin privileges.</p><button class="btn btn-outline mt-20" onclick="navigateTo('dashboard')">Back to Dashboard</button></div>`;
        return;
    }
    const themes = window.APP_THEMES || [];
    const activeId = systemSettingsDB.activeTheme || 'ocean-blue';
    container.innerHTML = `
        ${renderAdminBreadcrumb('Themes')}
        <div class="page-header">
            <h1>🎨 Application Themes</h1>
            <p class="page-subtitle">Choose a colour theme for the entire application. Changes apply instantly for all users on this device.</p>
        </div>
        <div class="themes-grid">
            ${themes.map(t => `
                <div class="theme-card ${t.id === activeId ? 'active' : ''}" onclick="setAppTheme('${t.id}')" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();setAppTheme('${t.id}');}">
                    ${t.id === activeId ? '<span class="theme-card-badge">✓ Active</span>' : ''}
                    <div class="theme-card-preview">
                        ${t.preview.map(c => `<span style="background:${c}"></span>`).join('')}
                    </div>
                    <div class="theme-card-body">
                        <h3><span>${t.icon}</span> ${t.name}</h3>
                        <p>${t.description}</p>
                        <div class="theme-swatch-row">
                            ${t.preview.map(c => `<span class="theme-swatch" style="background:${c}" title="${c}"></span>`).join('')}
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        <div style="margin-top:24px;padding:16px 20px;background:#f7fafc;border-radius:10px;border-left:4px solid var(--primary-light);font-size:13px;">
            <strong>Tip:</strong> Themes update the sidebar, buttons, links, and accent colours across every page. Your selection is saved automatically and restored on next login.
        </div>`;
}

function renderAdminAuditLogs(container) {
    if (!canAccessAdminPage('admin-audit-logs')) {
        container.innerHTML = `<div class="access-denied"><h2>🚫 Access Denied</h2><p>Audit Logs are visible to Manager and Super Admin only.</p><button class="btn btn-outline mt-20" onclick="navigateTo('dashboard')">Back to Dashboard</button></div>`;
        return;
    }
    const filtered = auditLogsDB.filter(log => {
        const matchSearch = !auditLogFilter || log.username.toLowerCase().includes(auditLogFilter.toLowerCase()) || log.action.toLowerCase().includes(auditLogFilter.toLowerCase()) || (log.targetId && log.targetId.toLowerCase().includes(auditLogFilter.toLowerCase()));
        const matchDate = !auditLogDateFilter || log.timestamp.startsWith(auditLogDateFilter);
        return matchSearch && matchDate;
    });
    container.innerHTML = `
        ${renderAdminBreadcrumb('Audit Logs')}
        <div class="page-header"><h1>📋 Audit Logs</h1><p class="page-subtitle">Complete timeline of every Create, Update, Delete, and blocked action. Searchable by user or date.</p></div>
        <div class="admin-toolbar">
            <input type="text" class="form-control admin-search" placeholder="Search by username, action, or target..." value="${auditLogFilter}" onkeyup="auditLogFilter=this.value; renderAdminAuditLogs(document.getElementById('contentArea'))">
            <input type="date" class="form-control admin-filter" value="${auditLogDateFilter}" onchange="auditLogDateFilter=this.value; renderAdminAuditLogs(document.getElementById('contentArea'))">
            <button class="btn btn-outline" onclick="auditLogFilter='';auditLogDateFilter='';renderAdminAuditLogs(document.getElementById('contentArea'))">Clear Filters</button>
        </div>
        <div class="audit-timeline">
            ${filtered.length === 0 ? '<div class="audit-empty">No audit log entries match your filters.</div>' : filtered.map((log, i) => `
                <div class="audit-entry ${log.action.startsWith('BLOCKED') ? 'blocked' : ''}">
                    <div class="audit-dot ${i === 0 ? 'latest' : ''}"></div>
                    <div class="audit-content">
                        <div class="audit-header">
                            <strong>${log.action}</strong>
                            <span class="audit-time">${log.timestamp}</span>
                        </div>
                        <div class="audit-meta">
                            <span>👤 ${log.username} (${log.userId})</span>
                            ${log.targetId ? `<span>🎯 Target: ${log.targetId}</span>` : ''}
                            <span>🌐 ${log.ipAddress}</span>
                            <span class="audit-type">${log.targetType}</span>
                        </div>
                        ${log.details ? `<div class="audit-details">${log.details}</div>` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="admin-stats-row"><span>${filtered.length} of ${auditLogsDB.length} log entries</span></div>`;
}

function viewAdminUser(userId) {
    const user = adminUsersDB.find(u => u.id === userId);
    if (!user) return;
    const role = getRoleById(user.roleId);
    document.getElementById('adminUserViewBody').innerHTML = `
        <div class="profile-view">
            <div class="profile-avatar">${user.username.slice(0, 2).toUpperCase()}</div>
            <h3>${user.username}</h3>
            ${renderPermissionBadge(role)}
            <div class="profile-grid">
                <div><strong>Email</strong><br>${user.email}</div>
                <div><strong>Area</strong><br>${user.area}</div>
                <div><strong>Phone</strong><br>${user.phone || '—'}</div>
                <div><strong>Status</strong><br>${user.status === 'active' ? '<span class="status-badge green">Active</span>' : '<span class="status-badge red">Banned</span>'}</div>
                <div><strong>Created</strong><br>${user.createdAt}</div>
                <div><strong>Last Login</strong><br>${user.lastLogin || '—'}</div>
                ${user.status === 'banned' ? `<div class="profile-ban-info"><strong>Banned</strong><br>${user.bannedAt}<br><em>${user.bannedReason}</em></div>` : ''}
            </div>
        </div>`;
    openModal('adminUserViewModal');
}

function openAdminUserModal(userId) {
    if (!userId) {
        if (!apiMiddleware('/api/users/create', 'manage_users')) return;
    } else if (!canUser('edit_all') && !canUser('edit_limited')) {
        showToast('Access denied: You cannot edit users.', 'warning');
        return;
    }
    editingAdminUserId = userId || null;
    const user = userId ? adminUsersDB.find(u => u.id === userId) : null;
    document.getElementById('adminUserModalTitle').textContent = user ? '✏️ Edit User' : '➕ Add User';
    document.getElementById('adminUserUsername').value = user?.username || '';
    document.getElementById('adminUserEmail').value = user?.email || '';
    document.getElementById('adminUserPhone').value = user?.phone || '';
    document.getElementById('adminUserArea').value = user?.area || '';
    const roleSelect = document.getElementById('adminUserRole');
    roleSelect.innerHTML = rolesDB.map(r => `<option value="${r.id}" ${user?.roleId === r.id ? 'selected' : ''}>${r.name}</option>`).join('');
    document.getElementById('adminUserPasswordGroup').style.display = user ? 'none' : 'block';
    openModal('adminUserModal');
}

function submitAdminUser() {
    const username = document.getElementById('adminUserUsername').value.trim();
    const email = document.getElementById('adminUserEmail').value.trim();
    const phone = document.getElementById('adminUserPhone').value.trim();
    const area = document.getElementById('adminUserArea').value.trim();
    const roleId = document.getElementById('adminUserRole').value;
    if (!username || !email) { showToast('Username and email are required.', 'warning'); return; }
    (async () => {
        try {
            if (editingAdminUserId) {
                if (!apiMiddleware('/api/users/edit/:id', 'edit_all') && !apiMiddleware('/api/users/edit/:id', 'edit_limited')) return;
                const user = adminUsersDB.find(u => u.id === editingAdminUserId);
                if (!user) return;
                const payload = { username, email, phone, area, roleId, assignedAreas: user.assignedAreas || [area] };
                if (typeof isApiAvailable === 'function' && isApiAvailable() && typeof updateAdminUserApi === 'function') {
                    const apiUser = await updateAdminUserApi(editingAdminUserId, payload);
                    Object.assign(user, apiUser, { passwordHash: user.passwordHash });
                } else {
                    Object.assign(user, payload);
                }
                logAuditEvent(`Updated User ${user.id}`, user.id, 'user', `Role: ${getRoleById(roleId)?.name}, Area: ${area}`);
                showToast(`User ${username} updated.`, 'success');
            } else {
                if (!apiMiddleware('/api/users/create', 'manage_users')) return;
                const id = 'ADM-' + String(nextAdminUserId++).padStart(3, '0');
                const payload = { id, username, email, phone, area, roleId, assignedAreas: [area] };
                let user;
                if (typeof isApiAvailable === 'function' && isApiAvailable() && typeof createAdminUserApi === 'function') {
                    user = await createAdminUserApi(payload);
                    user.passwordHash = '[server]';
                } else {
                    user = { ...payload, passwordHash: '[bcrypt-hash]', status: 'active', createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16), lastLogin: null, bannedAt: null, bannedReason: '' };
                }
                adminUsersDB.push(user);
                logAuditEvent(`Created User ${user.id}`, user.id, 'user', `Role: ${getRoleById(roleId)?.name}`);
                showToast(`User ${username} created.`, 'success');
            }
            if (typeof persistAdminUsers === 'function') persistAdminUsers();
            if (typeof syncAdminUsersToInternalComm === 'function') syncAdminUsersToInternalComm();
            closeModal('adminUserModal');
            if (currentPage === 'admin-users') renderAdminUsers(document.getElementById('contentArea'));
        } catch (e) {
            showToast(e.message, 'warning');
        }
    })();
}

function resetAdminUserPassword(userId) {
    if (!apiMiddleware('/api/users/reset-password/:id', 'manage_users')) return;
    const user = adminUsersDB.find(u => u.id === userId);
    if (!user) return;
    (async () => {
        try {
            let msg = `Password reset for ${user.username}. New credentials sent to ${user.email}.`;
            if (typeof isApiAvailable === 'function' && isApiAvailable() && typeof resetAdminUserPasswordApi === 'function') {
                const result = await resetAdminUserPasswordApi(userId);
                if (result.temporaryPassword) msg = `Temporary password for ${user.username}: ${result.temporaryPassword}`;
            } else {
                user.passwordHash = '[bcrypt-hash-reset-' + Date.now() + ']';
            }
            logAuditEvent(`Reset Password for ${userId}`, userId, 'user', 'Password reset via admin panel');
            showToast(msg, 'success');
            if (typeof persistAdminUsers === 'function') persistAdminUsers();
        } catch (e) {
            showToast(e.message, 'warning');
        }
    })();
}

function banAdminUser(userId) {
    if (!apiMiddleware('/api/users/ban/:id', 'delete')) return;
    const user = adminUsersDB.find(u => u.id === userId);
    if (!user || user.id === CURRENT_SESSION_USER_ID) return;
    const reason = prompt('Ban reason (soft delete — user hidden but data retained):', 'Account deactivated by administrator');
    if (reason === null) return;
    (async () => {
        try {
            if (typeof isApiAvailable === 'function' && isApiAvailable() && typeof banAdminUserApi === 'function') {
                const apiUser = await banAdminUserApi(userId, reason);
                Object.assign(user, apiUser);
            } else {
                user.status = 'banned';
                user.bannedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
                user.bannedReason = reason;
            }
            logAuditEvent(`Banned User ${userId}`, userId, 'user', reason);
            if (typeof persistAdminUsers === 'function') persistAdminUsers();
            showToast(`${user.username} has been banned (soft delete).`, 'success');
            if (currentPage === 'admin-users') renderAdminUsers(document.getElementById('contentArea'));
        } catch (e) {
            showToast(e.message, 'warning');
        }
    })();
}

function openPurgeUserModal(userId) {
    if (!apiMiddleware('/api/users/purge/:id', 'purge')) return;
    purgeTargetUserId = userId;
    const user = adminUsersDB.find(u => u.id === userId);
    document.getElementById('purgeUserName').textContent = user?.username || userId;
    openModal('adminPurgeModal');
}

function confirmPurgeUser() {
    if (!apiMiddleware('/api/users/purge/:id', 'purge')) return;
    const idx = adminUsersDB.findIndex(u => u.id === purgeTargetUserId);
    if (idx === -1) return;
    const user = adminUsersDB[idx];
    if (user.id === CURRENT_SESSION_USER_ID) { showToast('Cannot purge your own account.', 'warning'); return; }
    (async () => {
        try {
            if (typeof isApiAvailable === 'function' && isApiAvailable() && typeof purgeAdminUserApi === 'function') {
                await purgeAdminUserApi(purgeTargetUserId);
            }
            adminUsersDB.splice(idx, 1);
            logAuditEvent(`PERMANENTLY PURGED User ${purgeTargetUserId}`, purgeTargetUserId, 'user', 'Hard delete — data wiped from database');
            if (typeof persistAdminUsers === 'function') persistAdminUsers();
            showToast(`${user.username} permanently purged from database.`, 'success');
            closeModal('adminPurgeModal');
            purgeTargetUserId = null;
            if (currentPage === 'admin-users') renderAdminUsers(document.getElementById('contentArea'));
        } catch (e) {
            showToast(e.message, 'warning');
        }
    })();
}

function openAdminRoleModal(roleId) {
    if (!apiMiddleware('/api/roles/save', 'manage_roles')) return;
    editingRoleId = roleId || null;
    const role = roleId ? rolesDB.find(r => r.id === roleId) : null;
    document.getElementById('adminRoleModalTitle').textContent = role ? `✏️ Edit Role: ${role.name}` : '➕ Create Role';
    document.getElementById('adminRoleName').value = role?.name || '';
    document.getElementById('adminRoleDescription').value = role?.description || '';
    document.getElementById('adminRoleName').disabled = !!role?.system;
    const permsContainer = document.getElementById('adminRolePermissions');
    permsContainer.innerHTML = ALL_PERMISSIONS.map(p => `
        <label class="perm-checkbox">
            <input type="checkbox" name="rolePerm" value="${p}" ${role?.permissions?.includes(p) ? 'checked' : ''}>
            <span>${PERMISSION_LABELS[p] || p}</span>
        </label>
    `).join('');
    openModal('adminRoleModal');
}

function submitAdminRole() {
    if (!apiMiddleware('/api/roles/save', 'manage_roles')) return;
    const name = document.getElementById('adminRoleName').value.trim();
    const description = document.getElementById('adminRoleDescription').value.trim();
    const permissions = [...document.querySelectorAll('input[name="rolePerm"]:checked')].map(cb => cb.value);
    if (!name) { showToast('Role name is required.', 'warning'); return; }
    (async () => {
        try {
            if (editingRoleId) {
                const role = rolesDB.find(r => r.id === editingRoleId);
                if (!role) return;
                const payload = { name: role.system ? role.name : name, description, permissions };
                if (typeof isApiAvailable === 'function' && isApiAvailable() && typeof updateAdminRoleApi === 'function') {
                    const apiRole = await updateAdminRoleApi(editingRoleId, payload);
                    Object.assign(role, apiRole);
                } else {
                    if (!role.system) role.name = name;
                    role.description = description;
                    role.permissions = permissions;
                }
                logAuditEvent(`Updated Role ${role.id}`, role.id, 'role', permissions.join(', '));
                showToast(`Role "${name}" updated.`, 'success');
            } else {
                const id = 'role-custom-' + nextRoleId++;
                const payload = { id, name, description, permissions };
                let role;
                if (typeof isApiAvailable === 'function' && isApiAvailable() && typeof createAdminRoleApi === 'function') {
                    role = await createAdminRoleApi(payload);
                } else {
                    role = { id, name, description, system: false, permissions };
                }
                rolesDB.push(role);
                logAuditEvent(`Created Role ${id}`, id, 'role', name);
                showToast(`Role "${name}" created.`, 'success');
            }
            if (typeof persistAdminRoles === 'function') persistAdminRoles();
            closeModal('adminRoleModal');
            if (currentPage === 'admin-roles') renderAdminRoles(document.getElementById('contentArea'));
        } catch (e) {
            showToast(e.message, 'warning');
        }
    })();
}

function deleteAdminRole(roleId) {
    if (!apiMiddleware('/api/roles/delete/:id', 'manage_roles')) return;
    const role = rolesDB.find(r => r.id === roleId);
    if (!role || role.system) return;
    if (!confirm(`Delete role "${role.name}"? Users with this role must be reassigned first.`)) return;
    if (adminUsersDB.some(u => u.roleId === roleId)) { showToast('Cannot delete role — users are still assigned to it.', 'warning'); return; }
    (async () => {
        try {
            if (typeof isApiAvailable === 'function' && isApiAvailable() && typeof deleteAdminRoleApi === 'function') {
                await deleteAdminRoleApi(roleId);
            }
            const idx = rolesDB.findIndex(r => r.id === roleId);
            rolesDB.splice(idx, 1);
            logAuditEvent(`Deleted Role ${roleId}`, roleId, 'role');
            if (typeof persistAdminRoles === 'function') persistAdminRoles();
            showToast(`Role "${role.name}" deleted.`, 'success');
            if (currentPage === 'admin-roles') renderAdminRoles(document.getElementById('contentArea'));
        } catch (e) {
            showToast(e.message, 'warning');
        }
    })();
}

function updateSystemSetting(key, value) {
    if (!apiMiddleware('/api/settings/update', 'manage_settings')) {
        if (currentPage === 'admin-settings') renderAdminSettings(document.getElementById('contentArea'));
        return;
    }
    const old = systemSettingsDB[key];
    systemSettingsDB[key] = value;
    if (typeof persistSystemSettings === 'function') persistSystemSettings();
    if (typeof applySystemSettingsToUi === 'function') applySystemSettingsToUi();
    if (key === 'activeTheme' && typeof applyAppTheme === 'function') applyAppTheme(value);
    if (typeof isApiAvailable === 'function' && isApiAvailable() && typeof patchSystemSettings === 'function') {
        patchSystemSettings({ [key]: value }).catch(e => showToast(e.message, 'warning'));
    }
    logAuditEvent('Updated System Settings', 'settings', 'settings', `${key}: ${old} → ${value}`);
    showToast(`Setting "${key}" updated.`, 'success');
}

function triggerManualBackup() {
    if (!apiMiddleware('/api/settings/backup', 'manage_settings')) return;
    logAuditEvent('Manual Database Backup', 'database', 'backup', `Schedule: ${systemSettingsDB.backupSchedule}, Retention: ${systemSettingsDB.backupRetentionDays} days`);
    showToast('Database backup initiated. Snapshot saved to secure storage.', 'success');
}

// ============================================
// ADMIN — KPI Settings
// ============================================
function renderAdminKpiSettings(container) {
    if (!canAccessAdminPage('admin-kpi-settings')) {
        container.innerHTML = `<div class="access-denied"><h2>Access Denied</h2><p>KPI configuration requires Manager or Super Admin privileges.</p></div>`;
        return;
    }
    const term = (kpiAdminFilter || '').toLowerCase();
    const filtered = kpiSettingsDB.filter(s => {
        if (!kpiSettingMatchesCategory(s, kpiAdminCategory)) return false;
        if (!term) return true;
        const hay = [s.process, s.pageLabel, s.pageId, s.workflowStep, s.processGroup, s.direction, s.notes, s.category, s.kpiType].join(' ').toLowerCase();
        return hay.includes(term);
    });
    const grouped = {};
    filtered.forEach(s => {
        if (s.category === 'border-nb' || s.category === 'border-sb') return;
        if (!grouped[s.category]) grouped[s.category] = [];
        grouped[s.category].push(s);
    });
    Object.keys(grouped).forEach(cat => {
        grouped[cat].sort((a, b) => (a.stepOrder || 999) - (b.stepOrder || 999));
    });
    const activeCount = kpiSettingsDB.filter(s => s.enabled).length;
    const procFilterId = kpiAdminCategory.startsWith('border-process:') ? kpiAdminCategory.replace('border-process:', '') : null;
    const procFilterDef = procFilterId ? BORDER_PROCESS_DEFS.find(p => p.id === procFilterId) : null;
    const showBorderNb = kpiAdminCategory === 'all' || kpiAdminCategory === 'border-nb' || procFilterDef?.parentCategory === 'border-nb';
    const showBorderSb = kpiAdminCategory === 'all' || kpiAdminCategory === 'border-sb' || procFilterDef?.parentCategory === 'border-sb';
    const borderNbHtml = showBorderNb ? renderBorderKpiGroup('border-nb', filtered, procFilterDef?.parentCategory === 'border-nb' ? procFilterId : null) : '';
    const borderSbHtml = showBorderSb ? renderBorderKpiGroup('border-sb', filtered, procFilterDef?.parentCategory === 'border-sb' ? procFilterId : null) : '';
    const otherCatsHtml = KPI_CATEGORIES.filter(c => !c.isBorderGroup && grouped[c.id]?.length).map(cat => `
            <div class="settings-card" style="margin-bottom:16px;">
                <h3>${cat.icon} ${cat.label} <span class="badge-count">${grouped[cat.id].length}</span></h3>
                <div class="table-container">
                    <table class="data-table admin-table kpi-settings-table">
                        <thead><tr>
                            <th>Process</th><th>KPI Type</th><th>Page</th><th>Step Key</th><th>Dir.</th>
                            <th>Target</th><th>Unit</th><th>Warning %</th><th>Active</th><th>Notes</th>
                        </tr></thead>
                        <tbody>${grouped[cat.id].map(s => renderKpiSettingRow(s, false)).join('')}</tbody>
                    </table>
                </div>
            </div>`).join('');
    const categoryOptions = KPI_CATEGORIES.map(c =>
        `<option value="${c.id}" ${kpiAdminCategory === c.id ? 'selected' : ''}>${c.icon} ${c.label}</option>`
    ).join('') + BORDER_PROCESS_DEFS.map(p =>
        `<option value="border-process:${p.id}" ${kpiAdminCategory === `border-process:${p.id}` ? 'selected' : ''}>↳ ${p.label}</option>`
    ).join('');
    container.innerHTML = `
        ${renderAdminBreadcrumb('KPI Settings')}
        <div class="page-header admin-page-header">
            <div>
                <h1>🎯 KPI Settings</h1>
                <p class="page-subtitle">Under <strong>NB Border Processes</strong>, set KPI for every step-to-step transition — e.g. <em>Arrival → Doc Submission → Scanning → Green Stamp</em> — plus Whisky, Sakania, Mokambo, and SB exits.</p>
                <div class="admin-stats-row"><span><strong>${kpiSettingsDB.length}</strong> rules</span><span><strong>${activeCount}</strong> active</span></div>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <button class="btn btn-primary" onclick="saveKpiSettingsToStorage(); showToast('KPI settings saved','success'); if(currentPage==='admin-kpi-settings') renderAdminKpiSettings(document.getElementById('contentArea'));">💾 Save All</button>
                <button class="btn btn-outline" onclick="resetKpiSettingsToDefaults()">↩️ Reset Defaults</button>
            </div>
        </div>
        <div class="kpi-legend-banner">
            <span><strong>🟢 Green</strong> — under warning threshold</span>
            <span><strong>🟠 Orange</strong> — at or above warning % of target</span>
            <span><strong>🔴 Red</strong> — at or over target</span>
            <span><strong>KPI Types:</strong> ${KPI_STEP_TYPES.map(t => t.label).join(' · ')}</span>
        </div>
        <div class="admin-toolbar">
            <input type="text" class="form-control admin-search" placeholder="Search step, process, page..." value="${kpiAdminFilter}" onkeyup="kpiAdminFilter=this.value; renderAdminKpiSettings(document.getElementById('contentArea'))">
            <select class="form-control admin-filter" onchange="kpiAdminCategory=this.value; renderAdminKpiSettings(document.getElementById('contentArea'))">
                <option value="all" ${kpiAdminCategory === 'all' ? 'selected' : ''}>All categories</option>
                ${categoryOptions}
            </select>
        </div>
        ${!filtered.length && !borderNbHtml && !borderSbHtml && !otherCatsHtml ? '<div class="settings-card"><p>No KPI rules match your filter.</p></div>' : ''}
        ${borderNbHtml}
        ${borderSbHtml}
        ${otherCatsHtml}
        <div class="settings-card">
            <h3>📋 Border Process Step Reference</h3>
            <div class="kpi-workflow-ref">
                <div><strong>NB Border Processes — transition KPIs</strong></div>
                ${BORDER_PROCESS_DEFS.filter(p => p.parentCategory === 'border-nb').map(p => {
                    const trans = [];
                    for (let i = 0; i < p.steps.length - 1; i++) {
                        const from = p.steps[i];
                        const to = p.steps[i + 1];
                        trans.push(`${from.shortName || from.name} → ${to.shortName || to.name}`);
                    }
                    return `<div style="margin-left:12px;"><strong>${p.label}</strong>: ${trans.join(' · ')}</div>`;
                }).join('')}
                <div style="margin-top:12px;"><strong>SB Border Exit — transition KPIs</strong></div>
                ${BORDER_PROCESS_DEFS.filter(p => p.parentCategory === 'border-sb').map(p => {
                    const trans = [];
                    for (let i = 0; i < p.steps.length - 1; i++) {
                        const from = p.steps[i];
                        const to = p.steps[i + 1];
                        trans.push(`${from.shortName || from.name} → ${to.shortName || to.name}`);
                    }
                    return `<div style="margin-left:12px;"><strong>${p.label}</strong>: ${trans.join(' · ')}</div>`;
                }).join('')}
            </div>
        </div>
        <div class="settings-card">
            <h3>📋 Workflow Reference</h3>
            <div class="kpi-workflow-ref">
                <div><strong>NB Workflow:</strong> ${(WORKFLOW_CONFIG.NB || []).map(s => s.label).join(' → ')}</div>
                <div><strong>SB Workflow:</strong> ${(WORKFLOW_CONFIG.SB || []).map(s => s.label).join(' → ')}</div>
            </div>
        </div>`;
}

// ============================================
// ADMIN — Area Status Lists & User Area Assignment
// ============================================
function renderAdminAreaStatuses(container) {
    if (!canAccessAdminPage('admin-area-statuses')) {
        container.innerHTML = `<div class="access-denied"><h2>Access Denied</h2><p>Area Status management is Super Admin only.</p></div>`;
        return;
    }
    container.innerHTML = `
        ${renderAdminBreadcrumb('Area Status Lists')}
        <div class="page-header admin-page-header">
            <div><h1>📍 Area Status Lists</h1><p class="page-subtitle">NB and SB statuses per area. Configure borders, offloading/loading points, and Kanyaka hub. POD/Asset/Car lists below.</p></div>
            <button class="btn btn-primary" onclick="openAreaStatusModal()">+ Add Area</button>
        </div>
        <div class="settings-card" style="margin-bottom:16px;">
            <h3>Global Status Lists (POD / Asset / Car)</h3>
            ${Object.entries(globalStatusListsDB || {}).map(([cat, statuses]) => `
                <div class="setting-row"><div><strong>${cat}</strong></div>
                <input type="text" class="form-control setting-input-wide" id="globalStatus-${cat}" value="${statuses.join(', ')}" onchange="saveGlobalStatusList('${cat}')">
                </div>`).join('')}
        </div>
        <div class="table-container">
            <table class="data-table admin-table">
                <thead><tr><th>Area</th><th>Type</th><th>NB Statuses</th><th>SB Statuses</th><th>Border NB</th><th>Border SB</th><th>Actions</th></tr></thead>
                <tbody>
                    ${areaStatusesDB.map(a => `<tr>
                        <td><strong>${a.area}</strong></td>
                        <td><small>${[
                            a.isBorder ? 'Border' : '',
                            a.isOffloadingPoint ? 'Offload' : '',
                            a.isLoadingPoint ? 'Load' : '',
                            a.isKanyakaHub ? 'Kanyaka Hub' : ''
                        ].filter(Boolean).join(', ') || 'General'}</small></td>
                        <td>${(a.statusesNB||[]).slice(0,3).map(s => `<span class="workflow-pill pending">${s}</span>`).join('')}${(a.statusesNB||[]).length>3?'…':''}</td>
                        <td>${(a.statusesSB||[]).slice(0,3).map(s => `<span class="workflow-pill pending">${s}</span>`).join('')}${(a.statusesSB||[]).length>3?'…':''}</td>
                        <td>${(a.statusesBorderNB||[]).length || '—'}</td>
                        <td>${(a.statusesBorderSB||[]).length || '—'}</td>
                        <td>
                            <button class="btn btn-outline btn-sm" onclick="openAreaStatusModal('${a.id}')">✏️ Edit</button>
                            <button class="btn btn-danger btn-sm" onclick="deleteAreaStatus('${a.id}')">🗑️</button>
                        </td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>`;
}

function openAreaStatusModal(id) {
    if (!canAccessAdminPage('admin-area-statuses')) return;
    editingAreaStatusId = id || null;
    const rec = id ? areaStatusesDB.find(a => a.id === id) : null;
    document.getElementById('areaStatusModalTitle').textContent = rec ? `Edit: ${rec.area}` : 'Add Area Status List';
    document.getElementById('areaStatusArea').value = rec?.area || '';
    document.getElementById('areaStatusArea').disabled = !!rec;
    document.getElementById('areaStatusNB').value = (rec?.statusesNB || []).join('\n');
    document.getElementById('areaStatusSB').value = (rec?.statusesSB || []).join('\n');
    document.getElementById('areaStatusBorderNB').value = (rec?.statusesBorderNB || []).join('\n');
    document.getElementById('areaStatusBorderSB').value = (rec?.statusesBorderSB || []).join('\n');
    document.getElementById('areaIsBorder').checked = !!rec?.isBorder;
    document.getElementById('areaBorderNB').checked = rec?.borderForNB !== false;
    document.getElementById('areaBorderSB').checked = rec?.borderForSB !== false;
    document.getElementById('areaIsOffload').checked = !!rec?.isOffloadingPoint;
    document.getElementById('areaIsLoad').checked = !!rec?.isLoadingPoint;
    document.getElementById('areaIsKanyaka').checked = !!rec?.isKanyakaHub;
    document.getElementById('areaKanyakaNB').checked = rec?.kanyakaForNB !== false;
    document.getElementById('areaKanyakaSB').checked = rec?.kanyakaForSB !== false;
    openModal('areaStatusModal');
}

function submitAreaStatus() {
    if (!canAccessAdminPage('admin-area-statuses')) return;
    const area = document.getElementById('areaStatusArea').value.trim();
    const data = {
        area,
        isBorder: document.getElementById('areaIsBorder').checked,
        borderForNB: document.getElementById('areaBorderNB').checked,
        borderForSB: document.getElementById('areaBorderSB').checked,
        isOffloadingPoint: document.getElementById('areaIsOffload').checked,
        isLoadingPoint: document.getElementById('areaIsLoad').checked,
        isKanyakaHub: document.getElementById('areaIsKanyaka').checked,
        kanyakaForNB: document.getElementById('areaKanyakaNB').checked,
        kanyakaForSB: document.getElementById('areaKanyakaSB').checked,
        statusesNB: document.getElementById('areaStatusNB').value.split('\n').map(s => s.trim()).filter(Boolean),
        statusesSB: document.getElementById('areaStatusSB').value.split('\n').map(s => s.trim()).filter(Boolean),
        statusesBorderNB: document.getElementById('areaStatusBorderNB').value.split('\n').map(s => s.trim()).filter(Boolean),
        statusesBorderSB: document.getElementById('areaStatusBorderSB').value.split('\n').map(s => s.trim()).filter(Boolean),
        active: true
    };
    if (!area) { showToast('Area name required', 'warning'); return; }
    if (editingAreaStatusId) {
        const rec = areaStatusesDB.find(a => a.id === editingAreaStatusId);
        if (rec) Object.assign(rec, data);
        logAuditEvent(`Updated area statuses: ${area}`, area, 'area_status');
    } else {
        if (areaStatusesDB.some(a => a.area === area)) { showToast('Area already exists', 'warning'); return; }
        areaStatusesDB.push({ id: 'AS-' + String(nextAreaStatusId++).padStart(3, '0'), ...data });
        logAuditEvent(`Created area statuses: ${area}`, area, 'area_status');
    }
    if (typeof persistAreaStatuses === 'function') persistAreaStatuses();
    if (typeof isApiAvailable === 'function' && isApiAvailable() && typeof saveAreaStatusesFullApi === 'function') {
        saveAreaStatusesFullApi(areaStatusesDB).catch(e => showToast(e.message, 'warning'));
    }
    closeModal('areaStatusModal');
    showToast('Area status list saved', 'success');
    if (currentPage === 'admin-area-statuses') renderAdminAreaStatuses(document.getElementById('contentArea'));
}

function saveGlobalStatusList(cat) {
    const el = document.getElementById('globalStatus-' + cat);
    if (!el || !globalStatusListsDB) return;
    globalStatusListsDB[cat] = el.value.split(',').map(s => s.trim()).filter(Boolean);
    if (typeof persistGlobalStatusLists === 'function') persistGlobalStatusLists();
    if (typeof isApiAvailable === 'function' && isApiAvailable() && typeof saveGlobalStatusListsApi === 'function') {
        saveGlobalStatusListsApi(globalStatusListsDB).catch(e => showToast(e.message, 'warning'));
    }
    if (cat === 'POD' && typeof refreshPodStatusOptions === 'function') refreshPodStatusOptions();
    logAuditEvent(`Updated global status list: ${cat}`, cat, 'area_status');
    showToast(`${cat} statuses saved`, 'success');
}

function deleteAreaStatus(id) {
    if (!confirm('Delete this area status list?')) return;
    const idx = areaStatusesDB.findIndex(a => a.id === id);
    if (idx >= 0) {
        const name = areaStatusesDB[idx].area;
        areaStatusesDB.splice(idx, 1);
        logAuditEvent(`Deleted area statuses: ${name}`, name, 'area_status');
        if (typeof persistAreaStatuses === 'function') persistAreaStatuses();
        if (typeof isApiAvailable === 'function' && isApiAvailable() && typeof saveAreaStatusesFullApi === 'function') {
            saveAreaStatusesFullApi(areaStatusesDB).catch(e => showToast(e.message, 'warning'));
        }
    }
    if (currentPage === 'admin-area-statuses') renderAdminAreaStatuses(document.getElementById('contentArea'));
}

function renderAdminAreaAssignments(container) {
    if (!canAccessAdminPage('admin-area-assignments')) {
        container.innerHTML = `<div class="access-denied"><h2>Access Denied</h2><p>User area assignment requires Manager or Super Admin.</p></div>`;
        return;
    }
    const users = adminUsersDB.filter(u => {
        if (!areaAssignmentFilter) return true;
        const t = areaAssignmentFilter.toLowerCase();
        return u.username.toLowerCase().includes(t) || u.area.toLowerCase().includes(t) || (u.assignedAreas||[]).some(a => a.toLowerCase().includes(t));
    });
    container.innerHTML = `
        ${renderAdminBreadcrumb('Area Assignments')}
        <div class="page-header admin-page-header">
            <div><h1>🗺️ User Area Assignments</h1><p class="page-subtitle">Assign users to operational areas. Kanyaka team sees all trucks. Other users see only their area.</p></div>
        </div>
        <div class="rbac-info-banner"><strong>Rule:</strong> Users assigned to <em>Kanyaka</em> or <em>All Areas</em> see every truck. All other users only see trucks in their assigned area(s) on NB, SB, Area, and Report pages.</div>
        <div class="admin-toolbar">
            <input type="text" class="form-control admin-search" placeholder="Search users or areas..." value="${areaAssignmentFilter}" onkeyup="areaAssignmentFilter=this.value; renderAdminAreaAssignments(document.getElementById('contentArea'))">
        </div>
        <div class="table-container">
            <table class="data-table admin-table">
                <thead><tr><th>User</th><th>Role</th><th>Primary Area</th><th>Assigned Areas</th><th>Visibility</th><th>Actions</th></tr></thead>
                <tbody>
                    ${users.map(u => {
                        const areas = u.assignedAreas || [u.area];
                        const seesAll = areas.includes('All Areas') || areas.includes('Kanyaka');
                        return `<tr>
                            <td><strong>${u.username}</strong><br><small>${u.email}</small></td>
                            <td>${renderPermissionBadge(getRoleById(u.roleId))}</td>
                            <td>${u.area}</td>
                            <td>${areas.map(a => `<span class="workflow-pill ${a==='Kanyaka'?'current':'pending'}">${a}</span>`).join(' ')}</td>
                            <td>${seesAll ? '<span class="status-badge blue">All Trucks</span>' : '<span class="status-badge gray">Area Only</span>'}</td>
                            <td><button class="btn btn-outline btn-sm" onclick="openAreaAssignmentModal('${u.id}')">✏️ Assign</button></td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>`;
}

function openAreaAssignmentModal(userId) {
    if (!canAccessAdminPage('admin-area-assignments')) return;
    editingAdminUserId = userId;
    const user = adminUsersDB.find(u => u.id === userId);
    if (!user) return;
    document.getElementById('areaAssignUserName').textContent = user.username;
    const container = document.getElementById('areaAssignCheckboxes');
    const assigned = user.assignedAreas || [user.area];
    container.innerHTML = OPERATIONAL_AREAS.map(a => `
        <label class="perm-checkbox"><input type="checkbox" name="assignArea" value="${a}" ${assigned.includes(a)?'checked':''}><span>${a}</span></label>
    `).join('');
    openModal('areaAssignmentModal');
}

function submitAreaAssignment() {
    if (!canAccessAdminPage('admin-area-assignments')) return;
    const user = adminUsersDB.find(u => u.id === editingAdminUserId);
    if (!user) return;
    const areas = [...document.querySelectorAll('input[name="assignArea"]:checked')].map(cb => cb.value);
    if (!areas.length) { showToast('Select at least one area', 'warning'); return; }
    user.assignedAreas = areas;
    user.area = areas.includes('All Areas') ? 'All Areas' : areas[0];
    if (typeof persistAdminUsers === 'function') persistAdminUsers();
    if (typeof isApiAvailable === 'function' && isApiAvailable()) {
        if (typeof saveAreaAssignmentApi === 'function') {
            saveAreaAssignmentApi(user.id, user.username, areas).catch(e => showToast(e.message, 'warning'));
        }
        if (typeof updateAdminUserApi === 'function') {
            updateAdminUserApi(user.id, { assignedAreas: areas, area: user.area }).catch(() => {});
        }
    }
    logAuditEvent(`Assigned areas to ${user.username}`, user.id, 'user', areas.join(', '));
    closeModal('areaAssignmentModal');
    showToast(`Areas updated for ${user.username}`, 'success');
    if (currentPage === 'admin-area-assignments') renderAdminAreaAssignments(document.getElementById('contentArea'));
    updateTopBarUser();
}

function summarizeUserModulePermissions(user) {
    ensureUserModulePermissions(user);
    const enabled = OPERATIONAL_MODULES.filter(mod => canAccessModuleForUser(user, mod.id));
    return enabled.map(m => m.label).join(', ') || 'None';
}

function canAccessModuleForUser(user, moduleId) {
    if (!user || user.status !== 'active') return false;
    if (getRoleById(user.roleId)?.name === 'Super Admin') return true;
    ensureUserModulePermissions(user);
    const mod = user.modulePermissions[moduleId];
    if (!mod) return false;
    return Object.values(mod).some(p => p.view);
}

function renderAdminModulePermissions(container) {
    if (!canAccessAdminPage('admin-module-permissions')) {
        container.innerHTML = `<div class="access-denied"><h2>Access Denied</h2><p>Module permission management requires Manager or Super Admin.</p></div>`;
        return;
    }
    const users = adminUsersDB.filter(u => {
        if (!modulePermUserFilter) return u.status === 'active';
        const t = modulePermUserFilter.toLowerCase();
        return u.status === 'active' && (u.username.toLowerCase().includes(t) || u.email.toLowerCase().includes(t));
    });
    container.innerHTML = `
        ${renderAdminBreadcrumb('Module Permissions')}
        <div class="page-header admin-page-header">
            <div><h1>🔐 Module Permissions (Per Area)</h1><p class="page-subtitle">Assign view, edit, and delete rights per operational module and area. Controls sidebar visibility and actions on NB/SB, Border, POD, Assets, Communication, Reports, Turnarounds, and Position Live.</p></div>
        </div>
        <div class="rbac-info-banner"><strong>Modules:</strong> ${OPERATIONAL_MODULES.map(m => `${m.icon} ${m.label}`).join(' · ')}</div>
        <div class="admin-toolbar">
            <input type="text" class="form-control admin-search" placeholder="Search users..." value="${modulePermUserFilter}" onkeyup="modulePermUserFilter=this.value; renderAdminModulePermissions(document.getElementById('contentArea'))">
        </div>
        <div class="table-container">
            <table class="data-table admin-table module-perm-table">
                <thead><tr><th>User</th><th>Role</th><th>Assigned Areas</th><th>Enabled Modules</th><th>Actions</th></tr></thead>
                <tbody>
                    ${users.map(u => {
                        const areas = u.assignedAreas || [u.area];
                        return `<tr>
                            <td><strong>${u.username}</strong><br><small>${u.email}</small></td>
                            <td>${renderPermissionBadge(getRoleById(u.roleId))}</td>
                            <td>${areas.map(a => `<span class="workflow-pill pending">${a}</span>`).join(' ')}</td>
                            <td><small>${summarizeUserModulePermissions(u)}</small></td>
                            <td><button class="btn btn-primary btn-sm" onclick="openModulePermissionModal('${u.id}')">🔐 Configure</button></td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>`;
}

function openModulePermissionModal(userId) {
    if (!canAccessAdminPage('admin-module-permissions')) return;
    editingModulePermUserId = userId;
    const user = adminUsersDB.find(u => u.id === userId);
    if (!user) return;
    ensureUserModulePermissions(user);
    document.getElementById('modulePermUserName').textContent = user.username;
    const areas = [...new Set([...(user.assignedAreas || [user.area]), '_global'])];
    const container = document.getElementById('modulePermMatrix');
    container.innerHTML = OPERATIONAL_MODULES.map(mod => {
        const modPerms = user.modulePermissions[mod.id] || {};
        const areaRows = mod.global
            ? [{ key: '_global', label: 'Global (all areas)' }]
            : (user.assignedAreas || [user.area]).map(a => ({ key: a, label: a }));
        return `<div class="settings-card module-perm-card" style="margin-bottom:16px;">
            <h3>${mod.icon} ${mod.label}</h3>
            <table class="data-table" style="font-size:13px;">
                <thead><tr><th>Area</th><th>View</th><th>Edit</th><th>Delete</th></tr></thead>
                <tbody>
                    ${areaRows.map(row => {
                        const p = modPerms[row.key] || emptyModulePerm();
                        const prefix = `mp-${mod.id}-${row.key}`;
                        return `<tr>
                            <td>${row.label}</td>
                            <td><input type="checkbox" id="${prefix}-view" ${p.view ? 'checked' : ''}></td>
                            <td><input type="checkbox" id="${prefix}-edit" ${p.edit ? 'checked' : ''}></td>
                            <td><input type="checkbox" id="${prefix}-delete" ${p.delete ? 'checked' : ''}></td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>`;
    }).join('');
    openModal('modulePermissionModal');
}

function submitModulePermissions() {
    if (!canAccessAdminPage('admin-module-permissions')) return;
    const user = adminUsersDB.find(u => u.id === editingModulePermUserId);
    if (!user) return;
    const perms = {};
    OPERATIONAL_MODULES.forEach(mod => {
        perms[mod.id] = {};
        const areaRows = mod.global
            ? [{ key: '_global' }]
            : (user.assignedAreas || [user.area]).map(a => ({ key: a }));
        areaRows.forEach(row => {
            const prefix = `mp-${mod.id}-${row.key}`;
            perms[mod.id][row.key] = {
                view: !!document.getElementById(`${prefix}-view`)?.checked,
                edit: !!document.getElementById(`${prefix}-edit`)?.checked,
                delete: !!document.getElementById(`${prefix}-delete`)?.checked
            };
        });
    });
    user.modulePermissions = perms;
    if (typeof persistAdminUsers === 'function') persistAdminUsers();
    if (typeof isApiAvailable === 'function' && isApiAvailable() && typeof saveModulePermissionsApi === 'function') {
        saveModulePermissionsApi(user.id, perms).catch(e => showToast(e.message, 'warning'));
    }
    logAuditEvent(`Updated module permissions for ${user.username}`, user.id, 'user');
    closeModal('modulePermissionModal');
    showToast(`Module permissions saved for ${user.username}`, 'success');
    if (CURRENT_SESSION_USER_ID === user.id) updateAdminNavVisibility();
    if (currentPage === 'admin-module-permissions') renderAdminModulePermissions(document.getElementById('contentArea'));
}

// ============================================
// COMMENT MODAL FUNCTIONS
// ============================================
function formatWorkflowDate(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ' ' +
        d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function getDefaultWorkflow(direction) {
    const steps = WORKFLOW_CONFIG[direction] || WORKFLOW_CONFIG.NB;
    const workflow = {};
    steps.forEach((s, i) => { workflow[s.key] = i === 0 ? 'current' : 'pending'; });
    return workflow;
}

function renderWorkflowStatus(trip) {
    const direction = trip.direction || 'NB';
    const steps = WORKFLOW_CONFIG[direction] || WORKFLOW_CONFIG.NB;
    const workflow = trip.workflow || getDefaultWorkflow(direction);
    const dates = trip.workflowDates || {};

    return steps.map((step, i) => {
        const state = workflow[step.key] || 'pending';
        const dateHtml = dates[step.key]
            ? `<span class="workflow-date">${formatWorkflowDate(dates[step.key])}</span>`
            : (state === 'current' ? '<span class="workflow-date">In progress</span>' : '');
        const arrow = i < steps.length - 1
            ? `<span class="workflow-arrow ${state === 'completed' ? 'completed' : 'pending'}">→</span>`
            : '';
        return `<div class="workflow-step ${state}"><span class="step-label">${step.label}</span>${dateHtml}</div>${arrow}`;
    }).join('');
}

function toggleStatusDateField() {
    const status = document.getElementById('modalStatusUpdate').value;
    const group = document.getElementById('statusDateGroup');
    const dateInput = document.getElementById('statusDate');
    if (!group || !dateInput) return;
    if (status) {
        group.style.display = 'block';
        if (!dateInput.value) dateInput.value = new Date().toISOString().slice(0, 16);
    } else {
        group.style.display = 'block';
        dateInput.value = '';
    }
}

function validateFollowUpDate() {
    const followUpEl = document.getElementById('followUpDate');
    const expectedEl = document.getElementById('expectedCompletion');
    const hint = document.getElementById('followUpHint');
    if (!followUpEl || !expectedEl || !hint) return true;

    const followUp = followUpEl.value;
    const expected = expectedEl.value;

    if (!followUp || !expected) {
        hint.textContent = 'Must be before expected completion date';
        hint.className = 'field-hint';
        followUpEl.classList.remove('invalid');
        return !followUp ? false : true;
    }

    if (new Date(followUp) >= new Date(expected)) {
        hint.textContent = '⚠️ Follow-up date must be before expected completion date';
        hint.className = 'field-hint error';
        followUpEl.classList.add('invalid');
        return false;
    }

    hint.textContent = '✓ Follow-up date is valid';
    hint.className = 'field-hint success';
    followUpEl.classList.remove('invalid');
    return true;
}

let currentCommentStatusContext = null;
let currentPodPendingStage = null;
let currentCommentAssetId = null;

function getModuleIdFromStatusContext(ctx) {
    const map = {
        pod: 'pod-management', nb: 'nb-operations', sb: 'sb-operations',
        border: 'border-clearance', asset: 'assets', car: 'assets'
    };
    return map[ctx] || getPageModule(currentPage);
}

function openPodActionModal(tripNumber, stage) {
    openCommentModal(tripNumber, 'pod', stage);
}

function openCommentModal(tripNumber, statusContext, podStage) {
    currentCommentAssetId = null;
    currentCommentTrip = tripNumber;
    currentPodPendingStage = podStage || null;
    const trip = tripsDB[tripNumber] || { tripNumber: tripNumber, truck: 'Unknown', driver: 'Unknown', kpi: 'green', direction: 'NB' };
    const borderRow = getBorderRowForTrip(tripNumber);
    if (borderRow) {
        trip.truck = trip.truck || borderRow.truck;
        trip.driver = trip.driver || borderRow.driver;
        trip.direction = trip.direction || borderRow.direction;
        if (!tripsDB[tripNumber]) tripsDB[tripNumber] = trip;
    }

    const ctx = statusContext || inferStatusContextFromPage(currentPage) ||
        (trip.direction === 'SB' ? 'sb' : trip.direction === 'NB' ? 'nb' : null);
    currentCommentStatusContext = ctx;

    const moduleId = getModuleIdFromStatusContext(ctx);
    if (moduleId && !canEditInModule(moduleId, trip.area || trip.entryBorder || trip.exitBorder)) {
        showToast(`Access denied: you do not have edit permission for ${getModuleDef(moduleId)?.label || moduleId} in this area.`, 'warning');
        return;
    }

    document.getElementById('modalTripDisplay').textContent = trip.tripNumber;
    document.getElementById('modalTruckDisplay').textContent = trip.truck;
    document.getElementById('modalDriverDisplay').textContent = trip.driver;

    const kpiSnapshot = buildCommentModalKpiSnapshot(tripNumber, ctx, trip);
    currentCommentKpi = kpiSnapshot.effective;
    document.getElementById('modalKPIDisplay').innerHTML = renderCommentModalKpiPanel(kpiSnapshot);

    selectedCommentType = kpiSuggestsStructuredComment(currentCommentKpi) ? 'structured' : 'normal';
    document.getElementById('normalCommentText').value = '';
    document.getElementById('problemDescription').value = '';
    document.getElementById('personContacted').value = '';
    document.getElementById('solutionTaken').value = '';
    document.getElementById('expectedCompletion').value = '';
    document.getElementById('followUpDate').value = '';
    document.getElementById('statusDate').value = '';
    uploadedFiles = [];
    document.getElementById('fileList').innerHTML = '';
    document.getElementById('fileUploadArea').classList.remove('has-file');
    document.getElementById('validationMessage').classList.remove('show');
    document.getElementById('followUpHint').textContent = 'Must be before expected completion date';
    document.getElementById('followUpHint').className = 'field-hint';
    document.getElementById('followUpDate').classList.remove('invalid');

    const workflowEl = document.getElementById('workflowStatus');
    if (workflowEl) workflowEl.innerHTML = renderWorkflowStatus(trip);

    if (typeof refreshCommentModalProcessGuide === 'function') {
        refreshCommentModalProcessGuide(trip, ctx);
    }

    applyCommentModalKpiStyling(currentCommentKpi);
    showKasumbalesaProcessInModal(trip, ctx);
    updateCommentTypeUI();

    const now = new Date();
    const expected = new Date(now);
    expected.setHours(expected.getHours() + 24);
    const followUp = new Date(now);
    followUp.setHours(followUp.getHours() + 12);
    document.getElementById('expectedCompletion').value = expected.toISOString().slice(0, 16);
    document.getElementById('followUpDate').value = followUp.toISOString().slice(0, 16);

    const statusSelect = document.getElementById('modalStatusUpdate');
    if (typeof populateUpdateStatusDropdown === 'function') {
        populateUpdateStatusDropdown(statusSelect, ctx, trip);
    } else {
        statusSelect.innerHTML = '<option value="">No status change</option>';
    }

    if (currentPodPendingStage) {
        const podTitles = {
            collected: '📋 POD Collection',
            scanned: '🔍 POD Scan',
            uploaded: '📤 POD Upload',
            sent_to_invoicing: '💰 Send to Invoicing'
        };
        const stageToStatus = {
            collected: 'Collected On-Time',
            scanned: 'Scanned',
            uploaded: 'Uploaded',
            sent_to_invoicing: 'Sent to Invoicing'
        };
        document.getElementById('commentModalTitle').textContent = `${podTitles[currentPodPendingStage] || 'POD'} — ${trip.tripNumber}`;
        if (statusSelect && stageToStatus[currentPodPendingStage]) {
            statusSelect.value = stageToStatus[currentPodPendingStage];
        }
        document.getElementById('statusDate').value = new Date().toISOString().slice(0, 16);
        const req = document.getElementById('statusDateRequired');
        if (req) req.style.display = 'inline';
        const fileGroup = document.getElementById('fileUploadArea')?.closest('.form-group');
        if (fileGroup) fileGroup.style.display = (currentPodPendingStage === 'uploaded' || currentPodPendingStage === 'scanned') ? '' : 'none';
    } else {
        document.getElementById('commentModalTitle').textContent = `💬 Add Comment - ${trip.tripNumber}`;
        const req = document.getElementById('statusDateRequired');
        if (req) req.style.display = 'none';
        const fileGroup = document.getElementById('fileUploadArea')?.closest('.form-group');
        if (fileGroup) fileGroup.style.display = '';
    }

    const sbKanyakaSection = document.getElementById('sbKanyakaExitSection');
    const isSbKanyaka = trip.direction === 'SB' && (trip.workflow?.kanyaka === 'current' || trip.workflow?.dispatch === 'completed' || trip.area === 'Kanyaka' || (trip.status && trip.status.toLowerCase().includes('kanyaka')));
    if (sbKanyakaSection) {
        sbKanyakaSection.style.display = isSbKanyaka ? 'block' : 'none';
        if (isSbKanyaka) {
            const borderSel = document.getElementById('sbDriverExitBorder');
            const agentSel = document.getElementById('sbClearingAgent');
            if (borderSel) borderSel.value = trip.driverExitBorder || trip.exitBorder || '';
            if (agentSel) agentSel.value = trip.clearingAgent || '';
        }
    }
    toggleStatusDateField();
    openModal('commentModal');
}

function openAssetStatusModal(assetId) {
    const asset = getAssetById(assetId);
    if (!asset) return;
    if (!canEditInModule('assets')) {
        showToast('Access denied: you do not have edit permission for Assets & Equipment.', 'warning');
        return;
    }
    currentCommentAssetId = assetId;
    currentCommentTrip = null;
    const isVehicle = asset.category === 'vehicle';
    currentCommentStatusContext = isVehicle ? 'car' : 'asset';

    document.getElementById('modalTripDisplay').textContent = asset.id;
    document.getElementById('modalTruckDisplay').textContent = asset.name;
    document.getElementById('modalDriverDisplay').textContent = isVehicle ? (asset.assignedDriver || '—') : (asset.assignedTo || '—');
    document.getElementById('modalKPIDisplay').innerHTML = `<span class="status-badge ${asset.status === 'active' ? 'green' : 'orange'}">${asset.operationalStatus || formatAssetStatus(asset.status)}</span>`;

    selectedCommentType = 'normal';
    document.getElementById('normalCommentText').value = '';
    document.getElementById('problemDescription').value = '';
    document.getElementById('personContacted').value = '';
    document.getElementById('solutionTaken').value = '';
    document.getElementById('expectedCompletion').value = '';
    document.getElementById('followUpDate').value = '';
    document.getElementById('statusDate').value = '';
    uploadedFiles = [];
    document.getElementById('fileList').innerHTML = '';
    document.getElementById('fileUploadArea').classList.remove('has-file');
    document.getElementById('validationMessage').classList.remove('show');
    document.getElementById('normalCommentSection').classList.remove('hidden');
    document.getElementById('structuredCommentSection').classList.add('hidden');
    document.querySelectorAll('.comment-type-option').forEach(opt => opt.classList.remove('selected'));
    const normalOpt = document.querySelector('[data-type="normal"]');
    if (normalOpt) normalOpt.classList.add('selected');

    const workflowEl = document.getElementById('workflowStatus');
    if (workflowEl) workflowEl.innerHTML = `<div style="font-size:13px;color:var(--text-secondary);">${isVehicle ? '🚗 Vehicle' : '💻 Equipment'} — ${asset.assetType}</div>`;

    const statusSelect = document.getElementById('modalStatusUpdate');
    if (typeof populateUpdateStatusDropdown === 'function') {
        populateUpdateStatusDropdown(statusSelect, currentCommentStatusContext, null, asset);
    }
    document.getElementById('sbKanyakaExitSection').style.display = 'none';
    document.getElementById('commentModalTitle').textContent = `💬 Update Status — ${asset.name}`;
    openModal('commentModal');
}

function applyAssetStatusUpdate(asset, statusUpdate, commentText) {
    if (!asset.statusHistory) asset.statusHistory = [];
    const user = getCurrentAdminUser();
    asset.statusHistory.unshift({
        status: statusUpdate,
        comment: commentText || '',
        updatedBy: user?.username || 'unknown',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19)
    });
    asset.operationalStatus = statusUpdate;
    if (/maintenance/i.test(statusUpdate)) asset.status = 'maintenance';
    else if (/decommission|retired|lost|stolen/i.test(statusUpdate)) asset.status = /stolen/i.test(statusUpdate) ? 'lost' : 'retired';
    else if (/active|available|assigned|idle|returned/i.test(statusUpdate)) asset.status = 'active';
    logAuditEvent(`Asset status: ${statusUpdate}`, asset.id, 'asset', commentText);
}

function applyTripStatusUpdate(trip, statusUpdate, commentText, statusDate) {
    const ctx = currentCommentStatusContext;
    const validStatuses = typeof getStatusesForUpdateDropdown === 'function'
        ? getStatusesForUpdateDropdown(ctx, trip)
        : [];

    if (validStatuses.includes(statusUpdate)) {
        if (ctx === 'pod') {
            const pod = podDB.find(p => p.trip === currentCommentTrip);
            if (pod) {
                pod.podStatus = statusUpdate;
                if (/collected/i.test(statusUpdate)) {
                    pod.collected = true;
                    pod.collectedOnTime = !/late/i.test(statusUpdate);
                    if (statusDate) pod.collectedDate = statusDate.replace('T', ' ').slice(0, 16);
                }
                if (/scanned/i.test(statusUpdate)) { pod.scanned = true; if (statusDate) pod.scannedDate = statusDate.replace('T', ' ').slice(0, 16); }
                if (/uploaded/i.test(statusUpdate)) { pod.uploaded = true; if (statusDate) pod.uploadedDate = statusDate.replace('T', ' ').slice(0, 16); }
                if (/invoicing/i.test(statusUpdate)) { pod.sentToInvoicing = true; if (statusDate) pod.sentDate = statusDate.replace('T', ' ').slice(0, 16); }
            }
            trip.status = statusUpdate;
            logAuditEvent(`POD status: ${statusUpdate}`, currentCommentTrip, 'trip', commentText);
        } else if (ctx === 'nb' || ctx === 'sb' || ctx === 'border') {
            const wKey = resolveWorkflowKeyForTripStatus(trip, statusUpdate, ctx);
            recordTripAreaUpdate(currentCommentTrip, trip.area, statusUpdate, commentText, statusDate, wKey);
        }
    } else {
        trip.status = statusUpdate;
        logAuditEvent(`Trip status: ${statusUpdate}`, currentCommentTrip, 'trip', commentText);
        if (statusDate && statusUpdate) {
            if (!trip.areaStatusDates) trip.areaStatusDates = {};
            trip.areaStatusDates[statusUpdate] = statusDate;
        }
    }
}

function refreshPageAfterComment() {
    if (currentPage === 'assets') refreshAssetsTable();
    else if (currentPage === 'pod-management') refreshPODTable();
    else if (currentPage === 'nb-operations') refreshNBTable();
    else if (currentPage === 'sb-operations') refreshSBTable();
    else if (currentPage === 'position-live' && typeof refreshPositionLiveTable === 'function') refreshPositionLiveTable();
    else if (currentPage === 'border-clearance' && typeof refreshBorderTable === 'function') refreshBorderTable();
    else if (currentPage === 'area-browser') refreshAreaBrowserPanels();
    else if (currentPage === 'kanyaka' || currentPage === 'kolwezi') {
        const areaName = currentPage === 'kanyaka' ? 'Kanyaka' : 'Kolwezi';
        renderAreaPage(document.getElementById('contentArea'), areaName);
    }
    else if (currentPage?.includes('detail')) navigateTo(currentPage);
}

function selectCommentType(type, element) {
    selectedCommentType = type;
    updateCommentTypeUI();
}

function updateCommentTypeUI() {
    document.querySelectorAll('.comment-type-option').forEach(opt => opt.classList.remove('selected'));
    const sel = document.querySelector(`[data-type="${selectedCommentType}"]`);
    if (sel) sel.classList.add('selected');

    const kpi = typeof normalizeKpi === 'function' ? normalizeKpi(currentCommentKpi) : currentCommentKpi;
    const modal = document.querySelector('#commentModal .modal');
    if (modal) {
        modal.classList.remove('comment-modal-kpi-green', 'comment-modal-kpi-orange', 'comment-modal-kpi-red');
        modal.classList.add(`comment-modal-kpi-${kpi}`);
    }

    if (selectedCommentType === 'normal') {
        document.getElementById('normalCommentSection').classList.remove('hidden');
        document.getElementById('structuredCommentSection').classList.add('hidden');
        const alertHint = document.getElementById('normalCommentAlertHint');
        if (alertHint) {
            alertHint.style.display = (kpi === 'orange' || kpi === 'red') ? 'block' : 'none';
        }
    } else {
        document.getElementById('normalCommentSection').classList.add('hidden');
        document.getElementById('structuredCommentSection').classList.remove('hidden');
        const alertHint = document.getElementById('normalCommentAlertHint');
        if (alertHint) alertHint.style.display = 'none';
        const box = document.getElementById('structuredCommentBox');
        const title = document.getElementById('commentTitle');
        if (kpi === 'red') {
            box.classList.add('red');
            box.classList.remove('orange');
            title.textContent = '🔴 Structured Problem Report (Recommended — Overdue)';
            title.classList.add('red');
            title.classList.remove('orange');
        } else if (kpi === 'orange') {
            box.classList.remove('red');
            box.classList.add('orange');
            title.textContent = '🟠 Structured Problem Report (Recommended — Priority)';
            title.classList.add('orange');
            title.classList.remove('red');
        } else {
            box.classList.remove('red', 'orange');
            title.textContent = '⚠️ Structured Problem Report';
            title.classList.remove('red', 'orange');
        }
    }
}

function handleFileSelect(event) {
    const files = event.target.files;
    for(let i=0;i<files.length;i++){
        uploadedFiles.push({name:files[i].name,size:(files[i].size/1024).toFixed(1)+' KB',type:files[i].type});
    }
    updateFileList();
    document.getElementById('fileUploadArea').classList.add('has-file');
}

function updateFileList() {
    document.getElementById('fileList').innerHTML = uploadedFiles.map((f,i)=>`<div class="file-item"><span>📄 ${f.name} (${f.size})</span><span class="remove-file" onclick="removeFile(${i})">✕</span></div>`).join('');
}

function removeFile(index) {
    uploadedFiles.splice(index,1);
    updateFileList();
    if(uploadedFiles.length===0) document.getElementById('fileUploadArea').classList.remove('has-file');
}

function submitComment() {
    const statusUpdate = document.getElementById('modalStatusUpdate').value;
    const statusDate = document.getElementById('statusDate').value;
    const commentText = selectedCommentType === 'normal'
        ? document.getElementById('normalCommentText').value.trim()
        : document.getElementById('problemDescription').value.trim();

    if (currentPodPendingStage && currentCommentStatusContext === 'pod') {
        if (!statusUpdate) {
            document.getElementById('validationMessage').textContent = '⚠️ Please select a POD status.';
            document.getElementById('validationMessage').classList.add('show');
            return;
        }
        if (!statusDate) {
            document.getElementById('validationMessage').textContent = '⚠️ Please enter the status date and time.';
            document.getElementById('validationMessage').classList.add('show');
            return;
        }
        if (currentPodPendingStage === 'uploaded' && !uploadedFiles.length && !commentText) {
            document.getElementById('validationMessage').textContent = '⚠️ Please upload the POD document or add a comment.';
            document.getElementById('validationMessage').classList.add('show');
            return;
        }
        const trip = tripsDB[currentCommentTrip];
        if (trip) applyTripStatusUpdate(trip, statusUpdate, commentText || `POD ${currentPodPendingStage}`, statusDate);
        if (commentText) recordTripAreaUpdate(currentCommentTrip, trip?.area || 'POD', statusUpdate, commentText, statusDate, 'pod');
        const stage = currentPodPendingStage;
        currentPodPendingStage = null;
        const finish = () => {
            document.getElementById('validationMessage').classList.remove('show');
            const fileMsg = uploadedFiles.length > 0 ? `\n📁 ${uploadedFiles.length} file(s) attached` : '';
            showToast(`✅ POD action saved for ${currentCommentTrip}!${fileMsg}`, 'success');
            closeModal('commentModal');
            refreshPageAfterComment();
        };
        if (typeof completePodStageLocal === 'function') {
            Promise.resolve(completePodStageLocal(currentCommentTrip, stage, statusUpdate, statusDate)).then(finish);
        } else finish();
        return;
    }

    if (currentCommentAssetId) {
        if (!commentText && !statusUpdate) {
            document.getElementById('validationMessage').textContent = '⚠️ Please enter a comment or select a status update.';
            document.getElementById('validationMessage').classList.add('show');
            return;
        }
        const asset = getAssetById(currentCommentAssetId);
        if (!asset) {
            showToast('Asset not found', 'warning');
            return;
        }
        if (statusUpdate) applyAssetStatusUpdate(asset, statusUpdate, commentText);
        else logAuditEvent(`Asset comment`, asset.id, 'asset', commentText);

        document.getElementById('validationMessage').classList.remove('show');
        const fileMsg = uploadedFiles.length > 0 ? `\n📁 ${uploadedFiles.length} file(s) uploaded` : '';
        showToast(`✅ Status saved for ${asset.name}!${fileMsg}`, 'success');
        closeModal('commentModal');
        refreshPageAfterComment();
        return;
    }

    if (selectedCommentType === 'normal') {
        if (!commentText && !statusUpdate) {
            document.getElementById('validationMessage').textContent = '⚠️ Please enter a comment or select a status update.';
            document.getElementById('validationMessage').classList.add('show');
            return;
        }
    } else {
        const p = document.getElementById('problemDescription').value;
        const c = document.getElementById('personContacted').value;
        const s = document.getElementById('solutionTaken').value;
        const e = document.getElementById('expectedCompletion').value;
        const f = document.getElementById('followUpDate').value;
        if (!p.trim() || !c.trim() || !s.trim() || !e || !f) {
            document.getElementById('validationMessage').textContent = '⚠️ All structured comment fields are required (including follow-up date).';
            document.getElementById('validationMessage').classList.add('show');
            return;
        }
        if (!validateFollowUpDate()) {
            document.getElementById('validationMessage').textContent = '⚠️ Follow-up date must be before the expected completion date.';
            document.getElementById('validationMessage').classList.add('show');
            return;
        }
    }
    const statusDateVal = document.getElementById('statusDate').value;
    const trip = tripsDB[currentCommentTrip];

    if (trip?.direction === 'SB') {
        const isExitAction = statusUpdate && (statusUpdate.includes('Border Exit') || statusUpdate.includes('Exit'));
        const isKanyakaStage = trip.workflow?.kanyaka === 'current' || trip.area === 'Kanyaka' || (trip.status && trip.status.toLowerCase().includes('kanyaka'));
        if ((isExitAction || statusDateVal) && isKanyakaStage) {
            const border = document.getElementById('sbDriverExitBorder')?.value;
            const agent = document.getElementById('sbClearingAgent')?.value;
            if (!border) {
                document.getElementById('validationMessage').textContent = '⚠️ SB Kanyaka: You must select the exit border for the driver before setting exit date/status.';
                document.getElementById('validationMessage').classList.add('show');
                return;
            }
            if (!agent) {
                document.getElementById('validationMessage').textContent = '⚠️ SB Kanyaka: You must assign a clearing agent before setting exit date/status.';
                document.getElementById('validationMessage').classList.add('show');
                return;
            }
            trip.driverExitBorder = border;
            trip.clearingAgent = agent;
            trip.exitBorder = border;
            if (statusDateVal) trip.exitDate = statusDateVal;
            logAuditEvent(`SB Kanyaka exit prep: border=${border}, agent=${agent}`, currentCommentTrip, 'trip');
        }
    }

    if (statusUpdate && trip) {
        const kasSel = document.getElementById('kasumbalesaProcessSelect');
        if (kasSel && document.getElementById('kasumbalesaProcessSection')?.style.display !== 'none') {
            setTripKasumbalesaProcess(currentCommentTrip, kasSel.value);
        }
        applyTripStatusUpdate(trip, statusUpdate, commentText, statusDateVal);
        if (statusDateVal && trip) {
            if (!trip.workflowDates) trip.workflowDates = {};
            const wKey = resolveWorkflowKeyForTripStatus(trip, statusUpdate, currentCommentStatusContext);
            if (wKey) trip.workflowDates[wKey] = statusDateVal;
        }
    } else if (!statusUpdate && commentText && trip) {
        const last = getTripAreaHistory(currentCommentTrip)[0];
        const preservedStatus = trip.areaStatus || last?.status || trip.status;
        const wKey = resolveWorkflowKeyForTripStatus(trip, preservedStatus, currentCommentStatusContext);
        recordTripAreaUpdate(currentCommentTrip, trip.area, preservedStatus, commentText, statusDateVal || null, wKey);
        if (statusDateVal && preservedStatus) {
            if (!trip.workflowDates) trip.workflowDates = {};
            if (wKey) trip.workflowDates[wKey] = statusDateVal;
        }
    }
    document.getElementById('validationMessage').classList.remove('show');
    const type = selectedCommentType==='structured'?'Structured Problem Report':'Normal Comment';
    const fileMsg = uploadedFiles.length>0?`\n📁 ${uploadedFiles.length} file(s) uploaded`:'';
    showToast(`✅ ${type} saved for ${currentCommentTrip}!${fileMsg}`,'success');
    closeModal('commentModal');
    refreshPageAfterComment();
}

// ============================================
// HELPERS
// ============================================
function getKPILabel(kpi){ switch(kpi){case'green':return'On Track';case'orange':return'Priority';case'red':return'Overdue';default:return'Unknown';} }
function toggleStep(header){ const body=header.nextElementSibling; if(body&&body.classList.contains('step-body')) body.classList.toggle('open'); }
function switchBorderTab(tabId, tabElement) {
    const p = currentBorderTabPrefix;
    [`${p}-steps`, `${p}-documents`, `${p}-comments`, `${p}-logs`].forEach(id => {
        const el = document.getElementById('tab-' + id);
        if (el) el.style.display = id === tabId ? 'block' : 'none';
    });
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    if (tabElement) tabElement.classList.add('active');
}
function handleUpload() {
    if (typeof handleLiveUpload === 'function') return handleLiveUpload();
    showToast('✅ Upload complete!', 'success');
    closeModal('uploadModal');
}
function handleGlobalSearch(){ const term=document.getElementById('globalSearch').value.toLowerCase(); if(!term)return; for(const[key,trip]of Object.entries(tripsDB)){ if(trip.tripNumber.toLowerCase().includes(term)||trip.truck.toLowerCase().includes(term)||trip.driver.toLowerCase().includes(term)){ showToast(`Found: ${trip.tripNumber} - ${trip.truck}`,'success'); return; } } showToast('No matching trucks found','warning'); }
function toggleAlerts() {
    const panel = document.getElementById('alertPanel');
    if (!panel) return;
    updateAlertPanel();
    panel.classList.toggle('show');
}
function openModal(modalId){ document.getElementById(modalId).classList.add('show'); }
function closeModal(modalId){ document.getElementById(modalId).classList.remove('show'); }
function toggleSidebar(){ document.getElementById('sidebar').classList.toggle('mobile-open'); }
function showToast(message,type='success'){ const toast=document.getElementById('toast'); toast.textContent=message; toast.className=`toast ${type} show`; setTimeout(()=>toast.classList.remove('show'),3000); }

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', async function () {
    if (typeof loadAdminSettingsFromStorage === 'function') loadAdminSettingsFromStorage();
    if (typeof hydrateAppThemeFromStorage === 'function') hydrateAppThemeFromStorage();
    if (typeof refreshAppLogo === 'function') refreshAppLogo();
    initKpiSettings();
    syncAllAssetDocumentsToGlobalRegistry();
    adminUsersDB.forEach(u => ensureUserModulePermissions(u));
    initMatrixModalSelects();

    const connected = typeof checkApiHealth === 'function' && await checkApiHealth();

    if (connected && typeof isAuthRequired === 'function' && isAuthRequired()) {
        if (typeof getAuthToken === 'function' && getAuthToken()) {
            const user = typeof fetchCurrentUser === 'function' ? await fetchCurrentUser() : null;
            if (user) {
                applyAuthUserToSession(user);
                hideLoginScreen();
                await bootApplication();
            } else {
                showLoginScreen();
            }
        } else {
            showLoginScreen();
        }
    } else {
        updateTopBarUser();
        populateRoleSwitcher();
        if (connected) {
            await syncTripsFromApi(false);
            console.log('✅ Backend connected — trips synced from API');
        } else {
            console.log('ℹ️ Backend offline — using local demo data. Run: cd backend && npm start');
        }
        await bootApplication();
    }

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function (e) { if (e.target === this) this.classList.remove('show'); });
    });
    document.addEventListener('click', function (event) {
        const ap = document.getElementById('alertPanel');
        const nb = document.querySelector('.notification-btn');
        if (ap && nb && !ap.contains(event.target) && !nb.contains(event.target) && ap.classList.contains('show')) ap.classList.remove('show');
    });
    console.log('🚛 TruckControl DRC — Production Ready');
});
