// ============================================
// GLOBAL STATE
// ============================================
let currentPage = 'dashboard';
let currentCommentTrip = null;
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
selectedPodKpis = POD_KPI_OPTIONS.map(k => k.id);
selectedPodStatuses = POD_STATUS_OPTIONS.map(s => s.id);
let assetsSearchTerm = '';
let assetsStatusFilter = 'all';
let currentDocumentId = null;
let currentTripFilter = 'all';
let currentDocFilter = 'all';
let selectedAreaIds = [];
let pendingAreaIds = [];
let areaNbSearch = '';
let areaSbSearch = '';
let areaDropdownOpen = true;

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
        { key: 'loadingPlan', label: 'Loading Plan' },
        { key: 'loadingProcess', label: 'Loading Process' },
        { key: 'dispatch', label: 'Dispatch/Escort' },
        { key: 'kanyaka', label: 'Kanyaka SB' },
        { key: 'border', label: 'Border Exit' }
    ]
};

const documentsDB = [
    { id: 1, type: 'Insurance', entity: 'Truck ZAM-4567', trip: 'TR-1024', truck: 'ZAM-4567', expiry: '2025-04-15', issued: '2024-04-15', status: 'expiring', kpi: 'orange', label: 'Expires in 7d', fileName: 'Insurance_ZAM-4567.pdf', category: 'Vehicle Insurance' },
    { id: 2, type: 'Vignette', entity: 'Truck ZAM-4590', trip: 'TR-1028', truck: 'ZAM-4590', expiry: '2025-04-10', issued: '2024-04-10', status: 'expired', kpi: 'red', label: 'Expired', fileName: 'Vignette_ZAM-4590.pdf', category: 'Border Vignette' },
    { id: 3, type: 'TR8', entity: 'Trip TR-1024', trip: 'TR-1024', truck: 'ZAM-4567', expiry: '2025-05-01', issued: '2025-04-01', status: 'valid', kpi: 'green', label: 'Valid', fileName: 'TR8_TR-1024.pdf', category: 'Customs TR8' },
    { id: 4, type: 'Road Tax', entity: 'Truck ZAM-4612', trip: 'TR-1031', truck: 'ZAM-4612', expiry: '2025-04-20', issued: '2024-04-20', status: 'expiring', kpi: 'orange', label: 'Expires in 12d', fileName: 'RoadTax_ZAM-4612.pdf', category: 'Road Tax Certificate' },
    { id: 5, type: 'Insurance', entity: 'Truck ZAM-4789', trip: 'SB-2045', truck: 'ZAM-4789', expiry: '2025-03-01', issued: '2024-03-01', status: 'expired', kpi: 'red', label: 'Expired', fileName: 'Insurance_ZAM-4789.pdf', category: 'Vehicle Insurance' }
];

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
    'kasumbalesa-kbp': {
        pageId: 'kasumbalesa-detail', tabPrefix: 'kbp', icon: '📍', processName: 'KBP Process',
        borderName: 'Kasumbalesa', locationPrefix: 'KBP', tripId: 'NB-2024-001',
        trip: 'NB-1001', truck: 'ABC 123', trailer: 'TRL-456', driver: 'John Doe', owner: 'XYZ Transport',
        kpi: 'green', kpiLabel: '🟢 ON TRACK', timeValue: '3:35', timePct: 7.5, targetHours: 48,
        totalTime: '3 HRS 35 MINS', timeStatus: '🟢 UNDER TIME - EXCELLENT',
        completedSteps: 7, finalApproval: true
    },
    'sakania-nb': {
        pageId: 'sakania-nb', tabPrefix: 'sakania-nb', icon: '📍', processName: 'NB BN Process',
        borderName: 'Sakania', locationPrefix: 'Sakania', tripId: 'NB-2024-015',
        trip: 'NB-2024-015', truck: 'XYZ789DRC', trailer: 'TRL-890', driver: 'Sarah Smith', owner: 'Transport Co B',
        kpi: 'orange', kpiLabel: '🟠 PRIORITY', timeValue: '40:00', timePct: 83, targetHours: 48,
        totalTime: '40 HRS', timeStatus: '🟠 APPROACHING DEADLINE', timeClass: 'warning',
        completedSteps: 5, finalApproval: false
    },
    'mokambo-nb': {
        pageId: 'mokambo-nb', tabPrefix: 'mokambo-nb', icon: '📍', processName: 'NB BN Process',
        borderName: 'Mokambo', locationPrefix: 'Mokambo', tripId: 'NB-2024-022',
        trip: 'NB-2024-022', truck: 'GHI789DRC', trailer: 'TRL-334', driver: 'Jean Pierre', owner: 'Transport Co C',
        kpi: 'red', kpiLabel: '🔴 OVERDUE', timeValue: '78:00', timePct: 108, targetHours: 72,
        totalTime: '78 HRS', timeStatus: '🔴 OVER TARGET - ACTION REQUIRED', timeClass: 'danger',
        completedSteps: 4, finalApproval: false
    }
};

const sbBorderConfigs = {
    'sb-kasumbalesa': {
        pageId: 'sb-kasumbalesa', tabPrefix: 'sb-kas', borderName: 'Kasumbalesa', tripId: 'SB-2024-003',
        trip: 'SB-2024-003', truck: 'DEF456DRC', driver: 'Mike Johnson', owner: 'Transport Co A',
        kpi: 'green', kpiLabel: '🟢 ON TRACK', timeValue: '24:00', targetHours: 48, completedSteps: 5
    },
    'sb-sakania': {
        pageId: 'sb-sakania', tabPrefix: 'sb-sak', borderName: 'Sakania', tripId: 'SB-2024-005',
        trip: 'SB-2024-005', truck: 'MNO345DRC', driver: 'David Mukendi', owner: 'Transport Co B',
        kpi: 'orange', kpiLabel: '🟠 PRIORITY', timeValue: '44:00', targetHours: 48, completedSteps: 4
    },
    'sb-mokambo': {
        pageId: 'sb-mokambo', tabPrefix: 'sb-mok', borderName: 'Mokambo', tripId: 'SB-2024-012',
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

const borderClearanceTrucks = [
    { trip: 'NB-2024-001', truck: 'ABC123DRC', driver: 'John Doe', direction: 'NB', border: 'Kasumbalesa', processHtml: '<span class="status-badge kbp">📍 KBP</span>', process: 'KBP', status: 'Cross-checking', hours: 38, target: '48h', kpi: 'orange', kpiLabel: 'Priority', viewPage: 'kasumbalesa-detail', commentBtn: 'primary' },
    { trip: 'NB-2024-008', truck: 'JKL012DRC', driver: 'Peter Mwansa', direction: 'NB', border: 'Kasumbalesa', processHtml: '<span class="status-badge whisky">📍 Whisky</span>', process: 'Whisky', status: 'TR8 Issued', hours: 52, target: '72h', kpi: 'orange', kpiLabel: 'Priority', viewPage: 'kasumbalesa-whisky', commentBtn: 'primary' },
    { trip: 'NB-2024-015', truck: 'XYZ789DRC', driver: 'Sarah Smith', direction: 'NB', border: 'Sakania', processHtml: '<span class="status-badge blue">BN Process</span>', process: 'BN Process', status: 'Cross-checking', hours: 40, target: '48h', kpi: 'orange', kpiLabel: 'Priority', viewPage: 'sakania-nb', commentBtn: 'primary' },
    { trip: 'NB-2024-022', truck: 'GHI789DRC', driver: 'Jean Pierre', direction: 'NB', border: 'Mokambo', processHtml: '<span class="status-badge blue">BN Process</span>', process: 'BN Process', status: 'Red Stamping', hours: 78, target: '72h', kpi: 'red', kpiLabel: 'Overdue', viewPage: 'mokambo-nb', commentBtn: 'danger' },
    { trip: 'NB-2024-042', truck: 'RST890DRC', driver: 'Alice Bwalya', direction: 'NB', border: 'Kasumbalesa', processHtml: '<span class="status-badge kbp">📍 KBP</span>', process: 'KBP', status: 'Border Clearance', hours: 32, target: '48h', kpi: 'green', kpiLabel: 'On Track', viewPage: 'kasumbalesa-detail', commentBtn: 'primary' },
    { trip: 'NB-2024-047', truck: 'PQR852DRC', driver: 'Emma Zulu', direction: 'NB', border: 'Sakania', processHtml: '<span class="status-badge blue">BN Process</span>', process: 'BN Process', status: 'Document Submission', hours: 16, target: '48h', kpi: 'green', kpiLabel: 'On Track', viewPage: 'sakania-nb', commentBtn: 'primary' },
    { trip: 'SB-2024-003', truck: 'DEF456DRC', driver: 'Mike Johnson', direction: 'SB', border: 'Kasumbalesa', processHtml: '<span class="status-badge green">SB Exit</span>', process: 'SB Exit', status: 'Seal Verification', hours: 24, target: '48h', kpi: 'green', kpiLabel: 'On Track', viewPage: 'sb-kasumbalesa', commentBtn: 'primary' },
    { trip: 'SB-2024-005', truck: 'MNO345DRC', driver: 'David Mukendi', direction: 'SB', border: 'Sakania', processHtml: '<span class="status-badge orange">SB Exit</span>', process: 'SB Exit', status: 'Customs Declaration', hours: 44, target: '48h', kpi: 'orange', kpiLabel: 'Priority', viewPage: 'sb-sakania', commentBtn: 'primary' },
    { trip: 'SB-2024-012', truck: 'PQR678DRC', driver: 'Joseph Kabwe', direction: 'SB', border: 'Mokambo', processHtml: '<span class="status-badge orange">SB Exit</span>', process: 'SB Exit', status: 'Gov List Upload', hours: 36, target: '72h', kpi: 'orange', kpiLabel: 'Priority', viewPage: 'sb-mokambo', commentBtn: 'primary' },
    { trip: 'SB-2024-018', truck: 'DEF321DRC', driver: 'Linda Phiri', direction: 'SB', border: 'Kasumbalesa', processHtml: '<span class="status-badge green">SB Exit</span>', process: 'SB Exit', status: 'Border Exit', hours: 28, target: '48h', kpi: 'green', kpiLabel: 'On Track', viewPage: 'sb-kasumbalesa', commentBtn: 'primary' }
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
    'NB-2024-001': { tripNumber:'NB-2024-001',truck:'ABC123DRC',driver:'John Doe',direction:'NB',area:'Kasumbalesa',owner:'Transport Co A',entryBorder:'Kasumbalesa',offloadingPoint:'Kolwezi Mine',status:'KBP Process',daysInDRC:5,kpi:'orange',borderProcess:'KBP',workflow:{border:'current',kanyaka:'pending',offloading:'pending',pod:'pending'},workflowDates:{border:'2026-07-23T08:00'}},
    'NB-2024-008': { tripNumber:'NB-2024-008',truck:'JKL012DRC',driver:'Peter Mwansa',direction:'NB',area:'Kasumbalesa',owner:'Transport Co D',entryBorder:'Kasumbalesa',offloadingPoint:'KCC Mine',status:'Whisky Process',daysInDRC:3,kpi:'orange',borderProcess:'Whisky',workflow:{border:'current',kanyaka:'pending',offloading:'pending',pod:'pending'}},
    'NB-2024-015': { tripNumber:'NB-2024-015',truck:'XYZ789DRC',driver:'Sarah Smith',direction:'NB',area:'Kolwezi',owner:'Transport Co B',entryBorder:'Sakania',offloadingPoint:'Kolwezi Mine',status:'Offloading',daysInDRC:12,kpi:'orange',workflow:{border:'completed',kanyaka:'completed',offloading:'current',pod:'pending'},workflowDates:{border:'2026-07-18T10:00',kanyaka:'2026-07-20T14:00',offloading:'2026-07-24T09:00'}},
    'NB-2024-022': { tripNumber:'NB-2024-022',truck:'GHI789DRC',driver:'Jean Pierre',direction:'NB',area:'Lubumbashi',owner:'Transport Co C',entryBorder:'Mokambo',offloadingPoint:'Lubumbashi',status:'POD Missing',daysInDRC:15,kpi:'red',workflow:{border:'completed',kanyaka:'completed',offloading:'completed',pod:'current'}},
    'NB-2024-031': { tripNumber:'NB-2024-031',truck:'MNO012DRC',driver:'David Mukendi',direction:'NB',area:'Kanyaka',owner:'Transport Co A',entryBorder:'Kasumbalesa',offloadingPoint:'Kanyaka Depot',status:'In Transit',daysInDRC:8,kpi:'green',workflow:{border:'completed',kanyaka:'current',offloading:'pending',pod:'pending'}},
    'SB-2024-003': { tripNumber:'SB-2024-003',truck:'DEF456DRC',driver:'Mike Johnson',direction:'SB',area:'Kanyaka',owner:'Transport Co A',loadingPoint:'Kanyaka',exitBorder:'Kasumbalesa',status:'Loading Process',daysInDRC:3,kpi:'green',workflow:{loadingPlan:'completed',loadingProcess:'current',dispatch:'pending',kanyaka:'pending',border:'pending'},workflowDates:{loadingPlan:'2026-07-22T07:00',loadingProcess:'2026-07-23T11:00'}},
    'SB-2024-005': { tripNumber:'SB-2024-005',truck:'MNO345DRC',driver:'David Mukendi',direction:'SB',area:'Kanyaka',owner:'Transport Co B',loadingPoint:'Kanyaka Mine',exitBorder:'Sakania',status:'Loading Delay',daysInDRC:2,kpi:'orange',workflow:{loadingPlan:'completed',loadingProcess:'current',dispatch:'pending',kanyaka:'pending',border:'pending'}},
    'SB-2024-012': { tripNumber:'SB-2024-012',truck:'PQR678DRC',driver:'Joseph Kabwe',direction:'SB',area:'Kolwezi',owner:'Transport Co C',loadingPoint:'Kolwezi Mine',exitBorder:'Mokambo',status:'Dispatch Ready',daysInDRC:5,kpi:'green',workflow:{loadingPlan:'completed',loadingProcess:'completed',dispatch:'current',kanyaka:'pending',border:'pending'}},
    'NB-2024-042': { tripNumber:'NB-2024-042',truck:'RST890DRC',driver:'Alice Bwalya',direction:'NB',area:'Kasumbalesa',owner:'Transport Co D',entryBorder:'Kasumbalesa',offloadingPoint:'Kolwezi Mine',status:'Border Clearance',daysInDRC:4,kpi:'green',addedToday:true,workflow:{border:'current',kanyaka:'pending',offloading:'pending',pod:'pending'}},
    'NB-2024-043': { tripNumber:'NB-2024-043',truck:'UVW123DRC',driver:'Paul Chanda',direction:'NB',area:'Kolwezi',owner:'Transport Co B',entryBorder:'Sakania',offloadingPoint:'KCC Mine',status:'In Transit',daysInDRC:6,kpi:'green',addedToday:true,workflow:{border:'completed',kanyaka:'completed',offloading:'pending',pod:'pending'}},
    'NB-2024-044': { tripNumber:'NB-2024-044',truck:'XYZ456DRC',driver:'Grace Mutale',direction:'NB',area:'Lubumbashi',owner:'Transport Co A',entryBorder:'Mokambo',offloadingPoint:'Lubumbashi',status:'Offloading',daysInDRC:11,kpi:'orange',workflow:{border:'completed',kanyaka:'completed',offloading:'current',pod:'pending'}},
    'NB-2024-045': { tripNumber:'NB-2024-045',truck:'ABC789DRC',driver:'Henry Sampa',direction:'NB',area:'Kanyaka',owner:'Transport Co C',entryBorder:'Kasumbalesa',offloadingPoint:'Kanyaka Depot',status:'POD Collection',daysInDRC:9,kpi:'orange',workflow:{border:'completed',kanyaka:'completed',offloading:'completed',pod:'current'}},
    'SB-2024-018': { tripNumber:'SB-2024-018',truck:'DEF321DRC',driver:'Linda Phiri',direction:'SB',area:'Kanyaka',owner:'Transport Co B',loadingPoint:'Kanyaka Mine',exitBorder:'Kasumbalesa',status:'Border Exit',daysInDRC:7,kpi:'green',workflow:{loadingPlan:'completed',loadingProcess:'completed',dispatch:'completed',kanyaka:'completed',border:'current'},workflowDates:{loadingPlan:'2026-07-17T08:00',loadingProcess:'2026-07-19T16:00',dispatch:'2026-07-22T10:00',kanyaka:'2026-07-23T14:00',border:'2026-07-25T09:00'}},
    'SB-2024-019': { tripNumber:'SB-2024-019',truck:'GHI654DRC',driver:'Oscar Mwale',direction:'SB',area:'Kolwezi',owner:'Transport Co A',loadingPoint:'Kolwezi Mine',exitBorder:'Sakania',status:'Loading Process',daysInDRC:2,kpi:'orange',addedToday:true,workflow:{loadingPlan:'completed',loadingProcess:'current',dispatch:'pending',kanyaka:'pending',border:'pending'}},
    'SB-2024-020': { tripNumber:'SB-2024-020',truck:'JKL987DRC',driver:'Nancy Banda',direction:'SB',area:'Kanyaka',owner:'Transport Co D',loadingPoint:'Kanyaka',exitBorder:'Mokambo',status:'Dispatch/Escort',daysInDRC:6,kpi:'orange',workflow:{loadingPlan:'completed',loadingProcess:'completed',dispatch:'current',kanyaka:'pending',border:'pending'}},
    'NB-2024-046': { tripNumber:'NB-2024-046',truck:'MNO741DRC',driver:'Victor Lungu',direction:'NB',area:'Kasumbalesa',owner:'Transport Co D',entryBorder:'Kasumbalesa',offloadingPoint:'KCC Mine',status:'Whisky Process',daysInDRC:3,kpi:'orange',borderProcess:'Whisky',addedToday:true,workflow:{border:'current',kanyaka:'pending',offloading:'pending',pod:'pending'}},
    'NB-2024-047': { tripNumber:'NB-2024-047',truck:'PQR852DRC',driver:'Emma Zulu',direction:'NB',area:'Kolwezi',owner:'Transport Co B',entryBorder:'Sakania',offloadingPoint:'Kolwezi Mine',status:'Border Clearance',daysInDRC:2,kpi:'green',addedToday:true,workflow:{border:'current',kanyaka:'pending',offloading:'pending',pod:'pending'}}
};

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
    const config = KPI_TARGETS[type];
    if (!config) return '';
    return `
        <div class="kpi-targets-banner kpi-targets-${type}">
            <strong>📊 ${config.title}</strong>
            <ul>${config.items.map(item => `<li>${item}</li>`).join('')}</ul>
        </div>`;
}

function navigateTo(page) {
    currentPage = page;
    document.querySelectorAll('.nav-item').forEach(item => { item.classList.remove('active'); if(item.dataset.page===page) item.classList.add('active'); });
    const ca = document.getElementById('contentArea');
    switch(page){
        case 'dashboard': renderDashboard(ca); break;
        case 'nb-operations': renderNBOperations(ca); break;
        case 'sb-operations': renderSBOperations(ca); break;
        case 'border-clearance': renderBorderClearanceOverview(ca); break;
        case 'kasumbalesa-detail': renderNBKBPBorderDetail(ca, nbBorderConfigs['kasumbalesa-kbp']); break;
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
        case 'assets': renderAssets(ca); break;
        case 'runner-fees': renderRunnerFees(ca); break;
        case 'reports': renderReports(ca); break;
        default: renderDashboard(ca);
    }
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
    areaDropdownOpen = !(areaIds && areaIds.length);
    navigateTo('area-browser');
}

function getTripViewPage(trip) {
    if (!trip) return null;
    if (trip.direction === 'NB') {
        if (trip.entryBorder === 'Kasumbalesa') {
            if (trip.borderProcess === 'Whisky' || (trip.status && trip.status.includes('Whisky'))) {
                return 'kasumbalesa-whisky';
            }
            return 'kasumbalesa-detail';
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
    areaDropdownOpen = true;
    updateAreaDropdownUI();
}

function closeAreaDropdown() {
    areaDropdownOpen = false;
    updateAreaDropdownUI();
}

function updateAreaDropdownUI() {
    const panel = document.getElementById('areaDropdownPanel');
    const summary = document.getElementById('areaSelectorSummary');
    const triggerLabel = document.getElementById('areaDropdownTriggerLabel');
    const chevron = document.getElementById('areaDropdownChevron');

    if (panel) panel.classList.toggle('open', areaDropdownOpen);
    if (summary) summary.classList.toggle('hidden', areaDropdownOpen);
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
    if (!trips.length) {
        return `<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--text-secondary);">No trucks match the selected areas</td></tr>`;
    }
    return trips.map(t => `
        <tr>
            <td><strong>${t.tripNumber}</strong></td>
            <td>${t.truck}</td>
            <td>${t.driver}</td>
            <td>${direction === 'NB' ? (t.offloadingPoint || '—') : (t.loadingPoint || '—')}</td>
            <td>${t.area || '—'}</td>
            <td><span class="status-badge ${t.kpi}">${t.status}</span></td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="openCommentModal('${t.tripNumber}')">💬</button>
                ${renderTripViewButton(t.tripNumber)}
            </td>
        </tr>
    `).join('');
}

function refreshAreaBrowserPanels() {
    const nbTrips = filterNBTrucksByAreas(areaNbSearch);
    const sbTrips = filterSBTrucksByAreas(areaSbSearch);
    const nbBody = document.getElementById('areaNbTableBody');
    const sbBody = document.getElementById('areaSbTableBody');
    const nbCount = document.getElementById('areaNbCount');
    const sbCount = document.getElementById('areaSbCount');
    if (nbBody) nbBody.innerHTML = renderAreaBrowserTableRows(nbTrips, 'NB');
    if (sbBody) sbBody.innerHTML = renderAreaBrowserTableRows(sbTrips, 'SB');
    if (nbCount) nbCount.textContent = `${nbTrips.length} truck${nbTrips.length !== 1 ? 's' : ''}`;
    if (sbCount) sbCount.textContent = `${sbTrips.length} truck${sbTrips.length !== 1 ? 's' : ''}`;
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
    closeAreaDropdown();
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

        <div id="areaSelectorSummary" class="area-selector-summary${areaDropdownOpen ? ' hidden' : ''}">
            <div>
                <strong>📍 Selected Areas:</strong>
                <span id="areaSelectorSummaryText">${selectedLabels.length ? selectedLabels.join(' · ') : 'No areas selected'}</span>
            </div>
            <button class="btn btn-outline btn-sm" onclick="expandAreaSelector()">Change Areas</button>
        </div>

        <div class="area-dropdown-wrap">
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
                        <strong>SB:</strong> Trucks shown if <em>in the area</em> or <em>loading point</em> matches.
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
                <div class="panel-body">
                    <table style="width:100%;font-size:13px;">
                        <thead><tr style="background:#f7fafc;">
                            <th style="padding:10px;text-align:left;">Trip</th>
                            <th style="padding:10px;text-align:left;">Truck</th>
                            <th style="padding:10px;text-align:left;">Driver</th>
                            <th style="padding:10px;text-align:left;">Offloading</th>
                            <th style="padding:10px;text-align:left;">Current Area</th>
                            <th style="padding:10px;text-align:left;">Status</th>
                            <th style="padding:10px;text-align:left;">Actions</th>
                        </tr></thead>
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
                <div class="panel-body">
                    <table style="width:100%;font-size:13px;">
                        <thead><tr style="background:#f7fafc;">
                            <th style="padding:10px;text-align:left;">Trip</th>
                            <th style="padding:10px;text-align:left;">Truck</th>
                            <th style="padding:10px;text-align:left;">Driver</th>
                            <th style="padding:10px;text-align:left;">Loading</th>
                            <th style="padding:10px;text-align:left;">Current Area</th>
                            <th style="padding:10px;text-align:left;">Status</th>
                            <th style="padding:10px;text-align:left;">Actions</th>
                        </tr></thead>
                        <tbody id="areaSbTableBody">${renderAreaBrowserTableRows(sbTrips, 'SB')}</tbody>
                    </table>
                </div>
            </div>
        </div>

        <button class="btn btn-outline mt-20" onclick="navigateTo('dashboard')">⬅️ Back to Dashboard</button>
    `;
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
// FILTER FUNCTION
// ============================================
function filterTrips(direction, searchTerm) {
    return Object.values(tripsDB).filter(t => {
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
                   (t.offloadingPoint && t.offloadingPoint.toLowerCase().includes(term));
        }
        return true;
    });
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

function renderDashboardTableRows(trips) {
    if (trips.length === 0) {
        return '<tr><td colspan="11" style="text-align:center;padding:20px;color:var(--text-secondary);">No trucks match the current search/filter criteria</td></tr>';
    }
    return trips.map(t => `
        <tr>
            <td><strong>${t.tripNumber}</strong></td>
            <td>${t.truck}</td>
            <td>${t.owner}</td>
            <td>${t.driver}</td>
            <td>${t.direction === 'NB' ? (t.entryBorder || '-') : (t.loadingPoint || '-')}</td>
            <td>${t.direction === 'NB' ? (t.offloadingPoint || '-') : (t.exitBorder || '-')}</td>
            <td>${t.area || '-'}</td>
            <td><span class="status-badge ${t.kpi}">${t.status}</span></td>
            <td>${t.daysInDRC}</td>
            <td><span class="kpi-indicator ${t.kpi}"></span> ${getKPILabel(t.kpi)}</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="openCommentModal('${t.tripNumber}')">💬 Comment</button>
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
        <div class="page-header"><h1>🚛 North Bound Operations</h1><div class="breadcrumb">Operations / NB Operations</div></div>
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
        <div style="display:flex;gap:10px;margin-bottom:20px;">
            <button class="btn btn-primary" onclick="openUploadModal('NB')">📤 Upload NB Data</button>
        </div>
        <div class="table-container">
            <div class="table-header"><h3>Active NB Trucks</h3><span id="nbTableCount" style="color:var(--text-secondary);">${trips.length} trucks</span></div>
            <table><thead><tr><th>Trip #</th><th>Truck</th><th>Owner</th><th>Driver</th><th>Border</th><th>Offloading</th><th>Area</th><th>Status</th><th>Days</th><th>KPI</th><th>Actions</th></tr></thead>
            <tbody id="nbTableBody">${renderNBTableRowsFiltered()}</tbody></table>
        </div>`;
}

function renderNBTableRowsFiltered() {
    const area = document.getElementById('nbAreaFilter')?.value || 'all';
    const border = document.getElementById('nbBorderFilter')?.value || 'all';
    const kpi = document.getElementById('nbKPIFilter')?.value || 'all';
    const search = document.getElementById('nbSearchInput')?.value || '';

    let trips = filterTrips('NB', search);
    if (area !== 'all') trips = trips.filter(t => t.area === area);
    if (border !== 'all') trips = trips.filter(t => t.entryBorder === border);
    if (kpi !== 'all') trips = trips.filter(t => t.kpi === kpi);

    const countEl = document.getElementById('nbTableCount');
    if (countEl) countEl.textContent = `${trips.length} trucks`;

    return renderDashboardTableRows(trips);
}

function refreshNBTable() {
    const nbBody = document.getElementById('nbTableBody');
    if (nbBody) nbBody.innerHTML = renderNBTableRowsFiltered();
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
        <div class="page-header"><h1>🚛 South Bound Operations</h1><div class="breadcrumb">Operations / SB Operations</div></div>
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
        <div style="display:flex;gap:10px;margin-bottom:20px;">
            <button class="btn btn-primary" onclick="openUploadModal('SB')">📤 Upload SB Data</button>
        </div>
        <div class="table-container">
            <div class="table-header"><h3>Active SB Trucks</h3><span id="sbTableCount" style="color:var(--text-secondary);">${trips.length} trucks</span></div>
            <table><thead><tr><th>Trip #</th><th>Truck</th><th>Owner</th><th>Driver</th><th>Loading Point</th><th>Exit Border</th><th>Area</th><th>Status</th><th>Days</th><th>KPI</th><th>Actions</th></tr></thead>
            <tbody id="sbTableBody">${renderSBTableRowsFiltered()}</tbody></table>
        </div>`;
}

function renderSBTableRowsFiltered() {
    const area = document.getElementById('sbAreaFilter')?.value || 'all';
    const border = document.getElementById('sbBorderFilter')?.value || 'all';
    const kpi = document.getElementById('sbKPIFilter')?.value || 'all';
    const search = document.getElementById('sbSearchInput')?.value || '';

    let trips = filterTrips('SB', search);
    if (area !== 'all') trips = trips.filter(t => t.area === area);
    if (border !== 'all') trips = trips.filter(t => t.exitBorder === border);
    if (kpi !== 'all') trips = trips.filter(t => t.kpi === kpi);

    const countEl = document.getElementById('sbTableCount');
    if (countEl) countEl.textContent = `${trips.length} trucks`;

    return renderDashboardTableRows(trips);
}

function refreshSBTable() {
    const sbBody = document.getElementById('sbTableBody');
    if (sbBody) sbBody.innerHTML = renderSBTableRowsFiltered();
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
    if (!rows.length) {
        return '<tr><td colspan="10" style="text-align:center;padding:24px;color:var(--text-secondary);">No trucks match your search</td></tr>';
    }
    return rows.map(t => `
        <tr>
            <td><strong>${t.trip}</strong></td>
            <td>${t.truck}</td>
            <td><span class="status-badge blue">${t.direction}</span></td>
            <td>${t.border}</td>
            <td>${t.processHtml}</td>
            <td>${t.status}</td>
            <td>${t.hours}</td>
            <td>${t.target}</td>
            <td><span class="kpi-indicator ${t.kpi}"></span> ${t.kpiLabel}</td>
            <td>
                <button class="btn btn-${t.commentBtn} btn-sm" onclick="openCommentModal('${t.trip}')">💬</button>
                <button class="btn btn-outline btn-sm" onclick="navigateToTripView('${t.trip}')">👁️</button>
            </td>
        </tr>
    `).join('');
}

function filterBorderClearanceTrucks() {
    const direction = document.getElementById('borderDirectionFilter')?.value || 'all';
    const border = document.getElementById('borderNameFilter')?.value || 'all';
    const kpi = document.getElementById('borderKPIFilter')?.value || 'all';
    const search = (document.getElementById('borderSearchInput')?.value || '').toLowerCase();

    let rows = [...borderClearanceTrucks];
    if (direction !== 'all') rows = rows.filter(t => t.direction === direction);
    if (border !== 'all') rows = rows.filter(t => t.border === border);
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
    return rows;
}

function renderBorderTableRowsFiltered() {
    const rows = filterBorderClearanceTrucks();
    const countEl = document.getElementById('borderTableCount');
    if (countEl) countEl.textContent = `${rows.length} truck${rows.length !== 1 ? 's' : ''}`;
    return renderBorderTableRows(rows);
}

function refreshBorderTable() {
    const body = document.getElementById('borderTableBody');
    if (body) body.innerHTML = renderBorderTableRowsFiltered();
}

function clearBorderFilters() {
    const direction = document.getElementById('borderDirectionFilter');
    const border = document.getElementById('borderNameFilter');
    const kpi = document.getElementById('borderKPIFilter');
    const search = document.getElementById('borderSearchInput');
    if (direction) direction.value = 'all';
    if (border) border.value = 'all';
    if (kpi) kpi.value = 'all';
    if (search) search.value = '';
    refreshBorderTable();
}

function renderBorderClearanceOverview(container) {
    const total = borderClearanceTrucks.length;
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
            <div class="filter-group"><label>Direction:</label><select id="borderDirectionFilter" onchange="refreshBorderTable()"><option value="all">All</option><option value="NB">NB</option><option value="SB">SB</option></select></div>
            <div class="filter-group"><label>Border:</label><select id="borderNameFilter" onchange="refreshBorderTable()"><option value="all">All</option><option>Kasumbalesa</option><option>Sakania</option><option>Mokambo</option></select></div>
            <div class="filter-group"><label>KPI:</label><select id="borderKPIFilter" onchange="refreshBorderTable()"><option value="all">All</option><option value="green">🟢 On Track</option><option value="orange">🟠 Priority</option><option value="red">🔴 Overdue</option></select></div>
            <div class="search-filter"><span>🔍</span><input type="text" id="borderSearchInput" placeholder="Search by Trip#, Truck, Driver, Border, Status..." onkeyup="refreshBorderTable()"></div>
            <button class="btn btn-outline btn-sm" onclick="clearBorderFilters()">Clear</button>
        </div>

        <div class="table-container">
            <div class="table-header"><h3>All Border Trucks</h3><span id="borderTableCount" style="color:var(--text-secondary);">${total} trucks</span></div>
            <table><thead><tr><th>Trip #</th><th>Truck</th><th>Direction</th><th>Border</th><th>Process</th><th>Status</th><th>Hours</th><th>Target</th><th>KPI</th><th>Actions</th></tr></thead>
            <tbody id="borderTableBody">${renderBorderTableRowsFiltered()}</tbody></table>
        </div>

        <div style="background:#e8f0fe;padding:15px;border-radius:8px;margin-top:20px;border-left:4px solid var(--primary-light);font-size:13px;">
            <strong>📋 NB BN Process (Sakania & Mokambo):</strong> Same sequential steps as Kasumbalesa KBP — Arrival → Brigade → Scanning → Green Stamp → Red Stamp → Cross-check → Driver Details → Final Approval
        </div>`;
}

// ============================================
// NB KBP / BN BORDER DETAIL (shared sequential process)
// ============================================
function buildKBPSteps(config) {
    const users = ['Jean Kalenga', 'Marie Mwamba', 'Patrick Tshimanga', 'Inspector Kabwe', 'Inspector Mwape', 'Officer Kalaba', 'Ruth Mwansa'];
    const times = ['08:00', '08:30', '09:15', '09:30', '10:15', '11:00', '11:30'];
    const durations = ['8 Mins', '30 Mins', '45 Mins', '45 Mins', '50 Mins', '45 Mins', '5 Mins'];
    const prefix = config.locationPrefix;

    return KBP_STEP_TEMPLATE.map((tmpl, i) => {
        const stepNum = i + 1;
        const completed = stepNum <= config.completedSteps;
        const current = stepNum === config.completedSteps + 1;
        const status = completed ? 'completed' : current ? 'in-progress' : 'pending';
        const title = '📌 ' + tmpl.title.replace(/\{prefix\}/g, prefix);
        const area = tmpl.area.replace(/\{prefix\}/g, prefix);
        return {
            num: stepNum, title, time: `15/07/2026 ${times[i]}`, duration: durations[i],
            target: i === 1 ? '4 HRS' : (i === 3 || i === 4 ? '1 HR' : null),
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
        return `
        <div class="step-container ${statusClass}"><div class="step-header ${statusClass}" onclick="toggleStep(this)"><div class="step-number">${s.num}</div><div class="step-info"><div class="step-title">${s.title}</div><div class="step-meta"><span>${statusLabel}</span><span>📅 ${s.time}</span>${s.target ? `<span>🎯 Target: ${s.target}</span>` : ''}<span>⏱️ ${s.duration}</span></div></div><div class="step-status-icon">${statusIcon}</div></div>
        <div class="step-body${i === 0 ? ' open' : ''}"><div class="user-log"><div class="user-info-row"><span class="user-tag">👤 ${s.user}</span><span class="area-tag">📍 ${s.area}</span></div><div class="log-entry"><div class="log-time">📅 ${s.time}</div><div class="log-action">${statusIcon} ${s.action}</div><div class="log-detail">📝 ${s.detail}</div></div></div></div></div>`;
    }).join('');

    if (config.finalApproval) {
        html += `<div class="step-container completed" style="border:2px solid var(--success);"><div class="step-header completed" onclick="toggleStep(this)" style="background:#f0fff4;"><div class="step-number" style="background:#276749;font-size:1.2em;">✓</div><div class="step-info"><div class="step-title" style="font-size:1em;">${config.icon} ${config.processName} — FINAL APPROVAL</div><div class="step-meta"><span>✅ COMPLETED</span><span>📅 15/07/2026 11:35</span><span>⏱️ TOTAL: ${config.totalTime}</span><span>🎯 TARGET: ${config.targetHours} HRS</span></div></div><div class="step-status-icon">🏆</div></div><div class="step-body"><div class="user-log"><div class="log-entry"><div class="log-action">✅ ${config.processName} APPROVED at ${config.borderName}</div><div class="log-detail">All steps verified | ${config.timeStatus}</div></div></div></div></div>`;
    }
    return html;
}

function renderBorderDocsTab(config) {
    const docs = ['Entry.pdf', 'Submission_Receipt.pdf', 'Scan_Report.pdf', 'Green_Stamped.pdf', 'Red_Stamped.pdf', 'CrossCheck_Report.pdf', 'Driver_Details.pdf'];
    return `<div class="card"><div class="card-header"><span>📁 Documents — ${config.borderName}</span><button class="btn btn-primary btn-sm" onclick="openCommentModal('${config.tripId}')">+ Upload</button></div><div class="card-body"><div class="doc-list">${docs.map(d => `<div class="doc-item"><span class="doc-icon">📄</span><div><div class="doc-name">${config.borderName}_${d}</div><div class="doc-uploader">👤 Border Officer</div></div><button class="btn btn-outline btn-sm">👁️</button></div>`).join('')}</div></div></div>`;
}

function renderBorderCommentsTab(config) {
    return `<div class="card"><div class="card-header"><span>💬 Comments — ${config.borderName}</span><button class="btn btn-primary btn-sm" onclick="openCommentModal('${config.tripId}')">+ Add Comment</button></div><div class="card-body"><div class="user-log"><div style="font-weight:600;">👤 Border Officer — ${config.borderName}</div><div style="font-size:0.8em;color:var(--text-secondary);margin-top:4px;">BN Process clearance in progress for ${config.trip}</div></div></div></div>`;
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
                <div class="truck-info-item"><span class="truck-info-label">Driver</span><span class="truck-info-value">${config.driver}</span></div>
                <div class="truck-info-item"><span class="truck-info-label">Direction</span><span class="truck-info-value">🔼 North Bound</span></div>
                <div class="truck-info-item"><span class="truck-info-label">Owner</span><span class="truck-info-value">${config.owner}</span></div>
            </div>
            <div style="display:flex;align-items:center;gap:15px;">
                <span class="kpi-badge ${config.kpi}">${config.kpiLabel}</span>
                <button class="btn btn-success btn-sm" onclick="openCommentModal('${config.tripId}')" style="background:white;color:#1a365d;">💬 Add Comment</button>
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
            <button class="btn btn-primary" onclick="openCommentModal('${config.tripId}')">💬 Add Comment</button>
        </div>`;
}

// ============================================
// SB BORDER CLEARANCE DETAIL
// ============================================
function renderSBStepsForConfig(config) {
    return SB_CLEARANCE_STEPS.map((name, i) => {
        const stepNum = i + 1;
        const completed = stepNum <= config.completedSteps;
        const current = stepNum === config.completedSteps + 1;
        const status = completed ? 'completed' : current ? 'in-progress' : 'pending';
        const statusIcon = completed ? '✅' : current ? '🔄' : '⏳';
        const statusLabel = completed ? '✅ Completed' : current ? '🔄 In Progress' : '⏳ Pending';
        return `<div class="step-container ${status}"><div class="step-header ${status}" onclick="toggleStep(this)"><div class="step-number">${stepNum}</div><div class="step-info"><div class="step-title">📌 ${name}</div><div class="step-meta"><span>${statusLabel}</span>${completed ? '<span>📅 15/07/2026</span>' : ''}</div></div><div class="step-status-icon">${statusIcon}</div></div></div>`;
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
                <div class="truck-info-item"><span class="truck-info-label">Driver</span><span class="truck-info-value">${config.driver}</span></div>
                <div class="truck-info-item"><span class="truck-info-label">Owner</span><span class="truck-info-value">${config.owner}</span></div>
                <div class="truck-info-item"><span class="truck-info-label">Direction</span><span class="truck-info-value">🔽 South Bound</span></div>
                <div class="truck-info-item"><span class="truck-info-label">Hours at Border</span><span class="truck-info-value">${config.timeValue}</span></div>
            </div>
            <span class="kpi-badge ${config.kpi}">${config.kpiLabel}</span>
        </div>
        <div class="card">
            <div class="card-header"><span>🔽 SB Exit Clearance Steps (${config.completedSteps}/${SB_CLEARANCE_STEPS.length})</span><button class="btn btn-primary btn-sm" onclick="openCommentModal('${config.tripId}')">💬 Add Comment</button></div>
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
        <div class="card"><div class="card-header"><span>📍 Whisky Process Steps</span><button class="btn btn-primary btn-sm" onclick="openCommentModal('NB-2024-008')">💬 Add Comment</button></div><div class="card-body">${renderWhiskySteps()}</div></div>
        <button class="btn btn-outline mt-20" onclick="navigateTo('border-clearance')">⬅️ Back</button>`;
}

function renderWhiskySteps() {
    const steps = [
        {name:'Entry Card Given to Agent',status:'completed',time:'13/07 10:00'},{name:'Truck Scanning',status:'completed',time:'14/07 10:00',note:'Result after 24h'},
        {name:'TR8/T1 or IM4 Issued',status:'completed',time:'14/07 14:00'},{name:'Duty Payment (if IM4)',status:'in-progress',time:'15/07 09:00'},
        {name:'BAE Collection',status:'pending',note:'Expected: 24h'},{name:'SEGUCE Payment',status:'pending'},{name:'Bon de Sortie',status:'pending',note:'Expected: 2h'},
        {name:'Brigade Stamp',status:'pending'},{name:'Full Documents Collected',status:'pending'},{name:'Seal Collected',status:'pending'},{name:'Documents Handed to Driver',status:'pending'}
    ];
    return steps.map((s,i)=>`<div class="step-container ${s.status}"><div class="step-header ${s.status}" onclick="toggleStep(this)"><div class="step-number">${i+1}</div><div class="step-info"><div class="step-title">${s.name}</div><div class="step-meta"><span>${s.status==='completed'?'✅ Completed':s.status==='in-progress'?'🔄 In Progress':'⏳ Pending'}</span>${s.time?`<span>📅 ${s.time}</span>`:''}${s.note?`<span>📝 ${s.note}</span>`:''}</div></div><div class="step-status-icon">${s.status==='completed'?'✅':s.status==='in-progress'?'🔄':'⏳'}</div></div></div>`).join('');
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
                                <td><button class="btn btn-primary btn-sm" onclick="openCommentModal('${t.tripNumber}')">💬</button></td>
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
                                    <button class="btn btn-primary btn-sm" onclick="openCommentModal('${d.trip}')">💬</button>
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
            ${trip ? `<button class="btn btn-primary" onclick="openCommentModal('${doc.trip}')">💬 Comment on Trip ${doc.trip}</button>` : ''}
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
        return `<tr><td colspan="12" style="text-align:center;padding:24px;color:var(--text-secondary);">${msg}</td></tr>`;
    }
    return items.map(p => `
        <tr>
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
            <td><button class="btn btn-primary btn-sm" onclick="openCommentModal('${p.trip}')">💬</button></td>
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
                    ${POD_STATUS_OPTIONS.map(s => `
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
    selectedPodStatuses = POD_STATUS_OPTIONS.map(s => s.id);
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
    if (statuses.length < POD_STATUS_OPTIONS.length) {
        items = items.filter(p => statuses.includes(getPODStageStatus(p)));
    }

    if (!search) return items;
    const term = search.toLowerCase();
    return items.filter(p =>
        p.trip.toLowerCase().includes(term) ||
        p.truck.toLowerCase().includes(term) ||
        p.driver.toLowerCase().includes(term) ||
        p.area.toLowerCase().includes(term) ||
        p.offloadingPoint.toLowerCase().includes(term) ||
        (p.owner && p.owner.toLowerCase().includes(term)) ||
        (p.scannedBy && p.scannedBy.toLowerCase().includes(term))
    );
}

function renderPODTableRowsFiltered() {
    const items = getFilteredPODItems();
    const countEl = document.getElementById('podTableCount');
    if (countEl) countEl.textContent = `${items.length} item${items.length !== 1 ? 's' : ''}`;
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
    selectedPodStatuses = POD_STATUS_OPTIONS.map(s => s.id);
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
                <span id="podTableCount" style="color:var(--text-secondary);">${items.length} item${items.length !== 1 ? 's' : ''}</span>
            </div>
            <div style="overflow-x:auto;">
                <table>
                    <thead>
                        <tr>
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
    const trips = Object.values(tripsDB).filter(t=>t.area===areaName);
    container.innerHTML = `<div class="page-header"><h1>🏢 ${areaName} Area</h1></div><div class="table-container"><div class="table-header"><h3>Trucks in ${areaName} (${trips.length})</h3></div><table><thead><tr><th>Trip</th><th>Truck</th><th>Driver</th><th>Direction</th><th>Status</th><th>Actions</th></tr></thead><tbody>${trips.map(t=>`<tr><td>${t.tripNumber}</td><td>${t.truck}</td><td>${t.driver}</td><td><span class="status-badge blue">${t.direction}</span></td><td><span class="status-badge ${t.kpi}">${t.status}</span></td><td><button class="btn btn-primary btn-sm" onclick="openCommentModal('${t.tripNumber}')">💬 Comment</button></td></tr>`).join('')||'<tr><td colspan="6">No trucks</td></tr>'}</tbody></table></div>`;
}

function renderAssetsTableRows(items) {
    if (!items.length) {
        return '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-secondary);">No equipment or documents match your search</td></tr>';
    }
    return items.map(d => `
        <tr>
            <td>${renderDocumentLink(d)}</td>
            <td>${d.entity}</td>
            <td>${d.trip}</td>
            <td>${d.truck}</td>
            <td>${d.expiry}</td>
            <td><span class="kpi-indicator ${d.kpi}"></span> ${d.label}</td>
            <td><button class="btn btn-outline btn-sm" onclick="navigateToDocuments('${d.status}')">👁️</button></td>
        </tr>
    `).join('');
}

function getFilteredAssets() {
    const search = assetsSearchTerm || (document.getElementById('assetsSearchInput')?.value || '').trim();
    const status = assetsStatusFilter || document.getElementById('assetsStatusFilter')?.value || 'all';
    let items = [...documentsDB];
    if (status !== 'all') items = items.filter(d => d.status === status);
    if (search) {
        const term = search.toLowerCase();
        items = items.filter(d =>
            d.type.toLowerCase().includes(term) ||
            d.entity.toLowerCase().includes(term) ||
            d.trip.toLowerCase().includes(term) ||
            d.truck.toLowerCase().includes(term) ||
            d.expiry.includes(term) ||
            d.label.toLowerCase().includes(term) ||
            d.status.toLowerCase().includes(term)
        );
    }
    return items;
}

function renderAssetsTableRowsFiltered() {
    const items = getFilteredAssets();
    const countEl = document.getElementById('assetsTableCount');
    if (countEl) countEl.textContent = `${items.length} record${items.length !== 1 ? 's' : ''}`;
    return renderAssetsTableRows(items);
}

function refreshAssetsTable() {
    assetsSearchTerm = document.getElementById('assetsSearchInput')?.value || '';
    assetsStatusFilter = document.getElementById('assetsStatusFilter')?.value || 'all';
    const body = document.getElementById('assetsTableBody');
    if (body) body.innerHTML = renderAssetsTableRowsFiltered();
}

function clearAssetsFilters() {
    assetsSearchTerm = '';
    assetsStatusFilter = 'all';
    const search = document.getElementById('assetsSearchInput');
    const status = document.getElementById('assetsStatusFilter');
    if (search) search.value = '';
    if (status) status.value = 'all';
    refreshAssetsTable();
}

function renderAssets(container) {
    const items = getFilteredAssets();
    container.innerHTML = `
        <div class="page-header">
            <h1>🚗 Assets & Equipment</h1>
            <div class="breadcrumb"><a href="#" onclick="navigateTo('dashboard')">Home</a> <span>›</span> <strong>Assets & Equipment</strong></div>
        </div>
        ${renderKpiTargetsBanner('equipment')}
        <div class="kpi-grid">
            <div class="kpi-card green" onclick="navigateToDocuments('valid')"><div class="kpi-header"><span class="kpi-title">Valid Documents</span></div><div class="kpi-value">${documentsDB.filter(d => d.status === 'valid').length}</div></div>
            <div class="kpi-card orange" onclick="navigateToDocuments('expiring')"><div class="kpi-header"><span class="kpi-title">Expiring Soon</span></div><div class="kpi-value">${documentsDB.filter(d => d.status === 'expiring').length}</div></div>
            <div class="kpi-card red" onclick="navigateToDocuments('expired')"><div class="kpi-header"><span class="kpi-title">Expired</span></div><div class="kpi-value">${documentsDB.filter(d => d.status === 'expired').length}</div></div>
        </div>

        <div class="filters-bar">
            <div class="filter-group"><label>Status:</label><select id="assetsStatusFilter" onchange="refreshAssetsTable()"><option value="all"${assetsStatusFilter === 'all' ? ' selected' : ''}>All</option><option value="valid"${assetsStatusFilter === 'valid' ? ' selected' : ''}>🟢 Valid</option><option value="expiring"${assetsStatusFilter === 'expiring' ? ' selected' : ''}>🟠 Expiring Soon</option><option value="expired"${assetsStatusFilter === 'expired' ? ' selected' : ''}>🔴 Expired</option></select></div>
            <div class="search-filter" style="flex:2;">
                <span>🔍</span>
                <input type="text" id="assetsSearchInput" placeholder="Search by type, entity, trip, truck, expiry..." value="${assetsSearchTerm}" onkeyup="refreshAssetsTable()">
            </div>
            <button class="btn btn-outline btn-sm" onclick="clearAssetsFilters()">Clear</button>
        </div>

        <div class="table-container">
            <div class="table-header">
                <h3>Equipment & Document Registry</h3>
                <div style="display:flex;align-items:center;gap:12px;">
                    <span id="assetsTableCount" style="color:var(--text-secondary);">${items.length} record${items.length !== 1 ? 's' : ''}</span>
                    <button class="btn btn-primary btn-sm" onclick="navigateToDocuments('all')">View All Documents</button>
                </div>
            </div>
            <table>
                <thead><tr><th>Type</th><th>Entity</th><th>Trip</th><th>Truck</th><th>Expiry</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody id="assetsTableBody">${renderAssetsTableRowsFiltered()}</tbody>
            </table>
        </div>
        <button class="btn btn-outline mt-20" onclick="navigateTo('dashboard')">⬅️ Back to Dashboard</button>
    `;
}

function renderRunnerFees(container) {
    container.innerHTML = `<div class="page-header"><h1>💰 Runner Fees</h1></div><div class="card"><div class="card-header"><h3>Fee Rates</h3></div><div class="card-body"><p>Sakania/Kasumbalesa: 0-2d: $40 | 3-4d: $25 | 5+d: $15</p><p>Kanyaka: 0-1d: $5</p></div></div>`;
}

function renderReports(container) {
    container.innerHTML = `<div class="page-header"><h1>📈 Reports</h1></div><div class="kpi-grid">${['NB Turnaround','SB Turnaround','POD','Runner Fees'].map(r=>`<div class="kpi-card" onclick="showToast('${r} Report generated!','success')"><div class="kpi-header"><span>${r} Report</span></div></div>`).join('')}</div>`;
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

function openCommentModal(tripNumber) {
    currentCommentTrip = tripNumber;
    const trip = tripsDB[tripNumber] || {tripNumber:tripNumber,truck:'Unknown',driver:'Unknown',kpi:'green'};
    document.getElementById('modalTripDisplay').textContent = trip.tripNumber;
    document.getElementById('modalTruckDisplay').textContent = trip.truck;
    document.getElementById('modalDriverDisplay').textContent = trip.driver;
    document.getElementById('modalKPIDisplay').innerHTML = `<span class="status-badge ${trip.kpi}">${getKPILabel(trip.kpi)}</span>`;

    selectedCommentType = (trip.kpi==='orange'||trip.kpi==='red')?'structured':'normal';
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

    updateCommentTypeUI();

    const now = new Date();
    const expected = new Date(now);
    expected.setHours(expected.getHours() + 24);
    const followUp = new Date(now);
    followUp.setHours(followUp.getHours() + 12);
    document.getElementById('expectedCompletion').value = expected.toISOString().slice(0, 16);
    document.getElementById('followUpDate').value = followUp.toISOString().slice(0, 16);

    const statusSelect = document.getElementById('modalStatusUpdate');
    statusSelect.innerHTML = '<option value="">No status change</option>';
    if (trip.direction === 'NB') {
        statusSelect.innerHTML += '<option>Border Clearance Complete</option><option>Arrived at Kanyaka</option><option>Offloading Complete</option><option>POD Collected</option>';
    } else if (trip.direction === 'SB') {
        statusSelect.innerHTML += '<option>Loading Complete</option><option>Dispatched</option><option>Arrived at Kanyaka SB</option><option>Border Exit Complete</option>';
    }
    toggleStatusDateField();

    document.getElementById('commentModalTitle').textContent = `💬 Add Comment - ${trip.tripNumber}`;
    openModal('commentModal');
}

function selectCommentType(type, element) {
    selectedCommentType = type;
    updateCommentTypeUI();
}

function updateCommentTypeUI() {
    document.querySelectorAll('.comment-type-option').forEach(opt=>opt.classList.remove('selected'));
    const sel = document.querySelector(`[data-type="${selectedCommentType}"]`);
    if(sel) sel.classList.add('selected');

    if(selectedCommentType==='normal'){
        document.getElementById('normalCommentSection').classList.remove('hidden');
        document.getElementById('structuredCommentSection').classList.add('hidden');
    } else {
        document.getElementById('normalCommentSection').classList.add('hidden');
        document.getElementById('structuredCommentSection').classList.remove('hidden');
        const trip = tripsDB[currentCommentTrip];
        if(trip && trip.kpi==='red'){
            document.getElementById('structuredCommentBox').classList.add('red');
            document.getElementById('commentTitle').textContent = '🔴 Structured Problem Report (Required for Overdue)';
            document.getElementById('commentTitle').classList.add('red');
            document.getElementById('commentTitle').classList.remove('orange');
        } else {
            document.getElementById('structuredCommentBox').classList.remove('red');
            document.getElementById('commentTitle').textContent = '🟠 Structured Problem Report (Required for Priority/Overdue)';
            document.getElementById('commentTitle').classList.add('orange');
            document.getElementById('commentTitle').classList.remove('red');
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
    if(selectedCommentType==='normal'){
        if(!document.getElementById('normalCommentText').value.trim()){
            document.getElementById('validationMessage').textContent = '⚠️ Please enter a comment.';
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
    const statusUpdate = document.getElementById('modalStatusUpdate').value;
    const statusDate = document.getElementById('statusDate').value;
    if (statusUpdate && statusDate) {
        const trip = tripsDB[currentCommentTrip];
        if (trip) {
            if (!trip.workflowDates) trip.workflowDates = {};
            const stepKeys = (WORKFLOW_CONFIG[trip.direction] || WORKFLOW_CONFIG.NB).map(s => s.key);
            const currentKey = stepKeys.find(k => trip.workflow && trip.workflow[k] === 'current');
            if (currentKey) trip.workflowDates[currentKey] = statusDate;
        }
    }
    document.getElementById('validationMessage').classList.remove('show');
    const type = selectedCommentType==='structured'?'Structured Problem Report':'Normal Comment';
    const fileMsg = uploadedFiles.length>0?`\n📁 ${uploadedFiles.length} file(s) uploaded`:'';
    showToast(`✅ ${type} saved for ${currentCommentTrip}!${fileMsg}`,'success');
    closeModal('commentModal');
    if(currentPage.includes('detail')||currentPage==='border-clearance') navigateTo(currentPage);
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
function openUploadModal(direction){ document.getElementById('uploadType').value=direction; document.getElementById('uploadModalTitle').textContent=`📤 Upload ${direction} Data`; openModal('uploadModal'); }
function handleUpload(){ showToast('✅ Upload complete!','success'); closeModal('uploadModal'); }
function handleGlobalSearch(){ const term=document.getElementById('globalSearch').value.toLowerCase(); if(!term)return; for(const[key,trip]of Object.entries(tripsDB)){ if(trip.tripNumber.toLowerCase().includes(term)||trip.truck.toLowerCase().includes(term)||trip.driver.toLowerCase().includes(term)){ showToast(`Found: ${trip.tripNumber} - ${trip.truck}`,'success'); return; } } showToast('No matching trucks found','warning'); }
function handleAlertClick(tripNumber){ toggleAlerts(); openCommentModal(tripNumber); }
function openModal(modalId){ document.getElementById(modalId).classList.add('show'); }
function closeModal(modalId){ document.getElementById(modalId).classList.remove('show'); }
function toggleAlerts(){ document.getElementById('alertPanel').classList.toggle('show'); }
function toggleSidebar(){ document.getElementById('sidebar').classList.toggle('mobile-open'); }
function showToast(message,type='success'){ const toast=document.getElementById('toast'); toast.textContent=message; toast.className=`toast ${type} show`; setTimeout(()=>toast.classList.remove('show'),3000); }

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded',function(){
    navigateTo('dashboard');
    document.querySelectorAll('.modal-overlay').forEach(overlay=>{ overlay.addEventListener('click',function(e){ if(e.target===this)this.classList.remove('show'); }); });
    document.addEventListener('click',function(event){ const ap=document.getElementById('alertPanel'); const nb=document.querySelector('.notification-btn'); if(ap&&nb&&!ap.contains(event.target)&&!nb.contains(event.target)&&ap.classList.contains('show'))ap.classList.remove('show'); });
    console.log('🚛 TruckControl DRC - Complete Demo Ready');
});
