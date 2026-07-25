// ============================================
// GLOBAL STATE
// ============================================
let currentPage = 'dashboard';
let currentCommentTrip = null;
let selectedCommentType = 'normal';
let uploadedFiles = [];
let dashboardSearchTerm = '';
let currentPODFilter = 'all';
let currentTripFilter = 'all';
let currentDocFilter = 'all';

const documentsDB = [
    { id: 1, type: 'Insurance', entity: 'Truck ZAM-4567', trip: 'TR-1024', truck: 'ZAM-4567', expiry: '2025-04-15', status: 'expiring', kpi: 'orange', label: 'Expires in 7d' },
    { id: 2, type: 'Vignette', entity: 'Truck ZAM-4590', trip: 'TR-1028', truck: 'ZAM-4590', expiry: '2025-04-10', status: 'expired', kpi: 'red', label: 'Expired' },
    { id: 3, type: 'TR8', entity: 'Trip TR-1024', trip: 'TR-1024', truck: 'ZAM-4567', expiry: '2025-05-01', status: 'valid', kpi: 'green', label: 'Valid' },
    { id: 4, type: 'Road Tax', entity: 'Truck ZAM-4612', trip: 'TR-1031', truck: 'ZAM-4612', expiry: '2025-04-20', status: 'expiring', kpi: 'orange', label: 'Expires in 12d' },
    { id: 5, type: 'Insurance', entity: 'Truck ZAM-4789', trip: 'SB-2045', truck: 'ZAM-4789', expiry: '2025-03-01', status: 'expired', kpi: 'red', label: 'Expired' }
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
            { name: 'Kasumbalesa KBP', icon: '🅺', tag: 'kbp', pct: 85, avgHours: 12, targetHours: 48, trucks: 23, kpi: 'green' },
            { name: 'Kasumbalesa Whisky', icon: '🥃', tag: 'whisky', pct: 62, avgHours: 52, targetHours: 72, trucks: 15, kpi: 'orange' },
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
    'NB-2024-001': { tripNumber:'NB-2024-001',truck:'ABC123DRC',driver:'John Doe',direction:'NB',area:'Kasumbalesa',owner:'Transport Co A',entryBorder:'Kasumbalesa',offloadingPoint:'Kolwezi Mine',status:'KBP Process',daysInDRC:5,kpi:'orange',borderProcess:'KBP',workflow:{border:'current',kanyaka:'pending',offloading:'pending',pod:'pending'}},
    'NB-2024-008': { tripNumber:'NB-2024-008',truck:'JKL012DRC',driver:'Peter Mwansa',direction:'NB',area:'Kasumbalesa',owner:'Transport Co D',entryBorder:'Kasumbalesa',offloadingPoint:'KCC Mine',status:'Whisky Process',daysInDRC:3,kpi:'orange',borderProcess:'Whisky',workflow:{border:'current',kanyaka:'pending',offloading:'pending',pod:'pending'}},
    'NB-2024-015': { tripNumber:'NB-2024-015',truck:'XYZ789DRC',driver:'Sarah Smith',direction:'NB',area:'Kolwezi',owner:'Transport Co B',entryBorder:'Sakania',offloadingPoint:'Kolwezi Mine',status:'Offloading',daysInDRC:12,kpi:'orange',workflow:{border:'completed',kanyaka:'completed',offloading:'current',pod:'pending'}},
    'NB-2024-022': { tripNumber:'NB-2024-022',truck:'GHI789DRC',driver:'Jean Pierre',direction:'NB',area:'Lubumbashi',owner:'Transport Co C',entryBorder:'Mokambo',offloadingPoint:'Lubumbashi',status:'POD Missing',daysInDRC:15,kpi:'red',workflow:{border:'completed',kanyaka:'completed',offloading:'completed',pod:'current'}},
    'NB-2024-031': { tripNumber:'NB-2024-031',truck:'MNO012DRC',driver:'David Mukendi',direction:'NB',area:'Kanyaka',owner:'Transport Co A',entryBorder:'Kasumbalesa',offloadingPoint:'Kanyaka Depot',status:'In Transit',daysInDRC:8,kpi:'green',workflow:{border:'completed',kanyaka:'current',offloading:'pending',pod:'pending'}},
    'SB-2024-003': { tripNumber:'SB-2024-003',truck:'DEF456DRC',driver:'Mike Johnson',direction:'SB',area:'Kanyaka',owner:'Transport Co A',loadingPoint:'Kanyaka',exitBorder:'Kasumbalesa',status:'Loading Process',daysInDRC:3,kpi:'green',workflow:{loadingPlan:'completed',loadingProcess:'current',dispatch:'pending',kanyaka:'pending',border:'pending'}},
    'SB-2024-005': { tripNumber:'SB-2024-005',truck:'MNO345DRC',driver:'David Mukendi',direction:'SB',area:'Kanyaka',owner:'Transport Co B',loadingPoint:'Kanyaka Mine',exitBorder:'Sakania',status:'Loading Delay',daysInDRC:2,kpi:'orange',workflow:{loadingPlan:'completed',loadingProcess:'current',dispatch:'pending',kanyaka:'pending',border:'pending'}},
    'SB-2024-012': { tripNumber:'SB-2024-012',truck:'PQR678DRC',driver:'Joseph Kabwe',direction:'SB',area:'Kolwezi',owner:'Transport Co C',loadingPoint:'Kolwezi Mine',exitBorder:'Mokambo',status:'Dispatch Ready',daysInDRC:5,kpi:'green',workflow:{loadingPlan:'completed',loadingProcess:'completed',dispatch:'current',kanyaka:'pending',border:'pending'}},
    'NB-2024-042': { tripNumber:'NB-2024-042',truck:'RST890DRC',driver:'Alice Bwalya',direction:'NB',area:'Kasumbalesa',owner:'Transport Co D',entryBorder:'Kasumbalesa',offloadingPoint:'Kolwezi Mine',status:'Border Clearance',daysInDRC:4,kpi:'green',addedToday:true,workflow:{border:'current',kanyaka:'pending',offloading:'pending',pod:'pending'}},
    'NB-2024-043': { tripNumber:'NB-2024-043',truck:'UVW123DRC',driver:'Paul Chanda',direction:'NB',area:'Kolwezi',owner:'Transport Co B',entryBorder:'Sakania',offloadingPoint:'KCC Mine',status:'In Transit',daysInDRC:6,kpi:'green',addedToday:true,workflow:{border:'completed',kanyaka:'completed',offloading:'pending',pod:'pending'}},
    'NB-2024-044': { tripNumber:'NB-2024-044',truck:'XYZ456DRC',driver:'Grace Mutale',direction:'NB',area:'Lubumbashi',owner:'Transport Co A',entryBorder:'Mokambo',offloadingPoint:'Lubumbashi',status:'Offloading',daysInDRC:11,kpi:'orange',workflow:{border:'completed',kanyaka:'completed',offloading:'current',pod:'pending'}},
    'NB-2024-045': { tripNumber:'NB-2024-045',truck:'ABC789DRC',driver:'Henry Sampa',direction:'NB',area:'Kanyaka',owner:'Transport Co C',entryBorder:'Kasumbalesa',offloadingPoint:'Kanyaka Depot',status:'POD Collection',daysInDRC:9,kpi:'orange',workflow:{border:'completed',kanyaka:'completed',offloading:'completed',pod:'current'}},
    'SB-2024-018': { tripNumber:'SB-2024-018',truck:'DEF321DRC',driver:'Linda Phiri',direction:'SB',area:'Kanyaka',owner:'Transport Co B',loadingPoint:'Kanyaka Mine',exitBorder:'Kasumbalesa',status:'Border Exit',daysInDRC:7,kpi:'green',workflow:{loadingPlan:'completed',loadingProcess:'completed',dispatch:'completed',kanyaka:'completed',border:'current'}},
    'SB-2024-019': { tripNumber:'SB-2024-019',truck:'GHI654DRC',driver:'Oscar Mwale',direction:'SB',area:'Kolwezi',owner:'Transport Co A',loadingPoint:'Kolwezi Mine',exitBorder:'Sakania',status:'Loading Process',daysInDRC:2,kpi:'orange',addedToday:true,workflow:{loadingPlan:'completed',loadingProcess:'current',dispatch:'pending',kanyaka:'pending',border:'pending'}},
    'SB-2024-020': { tripNumber:'SB-2024-020',truck:'JKL987DRC',driver:'Nancy Banda',direction:'SB',area:'Kanyaka',owner:'Transport Co D',loadingPoint:'Kanyaka',exitBorder:'Mokambo',status:'Dispatch/Escort',daysInDRC:6,kpi:'orange',workflow:{loadingPlan:'completed',loadingProcess:'completed',dispatch:'current',kanyaka:'pending',border:'pending'}},
    'NB-2024-046': { tripNumber:'NB-2024-046',truck:'MNO741DRC',driver:'Victor Lungu',direction:'NB',area:'Kasumbalesa',owner:'Transport Co D',entryBorder:'Kasumbalesa',offloadingPoint:'KCC Mine',status:'Whisky Process',daysInDRC:3,kpi:'orange',addedToday:true,workflow:{border:'current',kanyaka:'pending',offloading:'pending',pod:'pending'}},
    'NB-2024-047': { tripNumber:'NB-2024-047',truck:'PQR852DRC',driver:'Emma Zulu',direction:'NB',area:'Kolwezi',owner:'Transport Co B',entryBorder:'Sakania',offloadingPoint:'Kolwezi Mine',status:'Border Clearance',daysInDRC:2,kpi:'green',addedToday:true,workflow:{border:'current',kanyaka:'pending',offloading:'pending',pod:'pending'}}
};

// ============================================
// NAVIGATION
// ============================================
function navigateTo(page) {
    currentPage = page;
    document.querySelectorAll('.nav-item').forEach(item => { item.classList.remove('active'); if(item.dataset.page===page) item.classList.add('active'); });
    const ca = document.getElementById('contentArea');
    switch(page){
        case 'dashboard': renderDashboard(ca); break;
        case 'nb-operations': renderNBOperations(ca); break;
        case 'sb-operations': renderSBOperations(ca); break;
        case 'border-clearance': renderBorderClearanceOverview(ca); break;
        case 'kasumbalesa-detail': renderKasumbalesaKBPDetail(ca); break;
        case 'kasumbalesa-whisky': renderKasumbalesaWhisky(ca); break;
        case 'sakania': renderBorderDetail(ca,'Sakania'); break;
        case 'mokambo': renderBorderDetail(ca,'Mokambo'); break;
        case 'pod-management': renderPODManagement(ca); break;
        case 'trip-list': renderTripList(ca); break;
        case 'document-alerts': renderDocumentAlerts(ca); break;
        case 'kanyaka': renderAreaPage(ca,'Kanyaka'); break;
        case 'kolwezi': renderAreaPage(ca,'Kolwezi'); break;
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

function navigateToBorder(borderKey) {
    const map = {
        'kasumbalesa-kbp': 'kasumbalesa-detail',
        'kasumbalesa-whisky': 'kasumbalesa-whisky',
        'sakania': 'sakania',
        'mokambo': 'mokambo',
        'kasumbalesa-exit': () => navigateToTripList('sb-border-kasumbalesa'),
        'sakania-exit': () => navigateToTripList('sb-border-sakania'),
        'mokambo-exit': () => navigateToTripList('sb-border-mokambo')
    };
    const target = map[borderKey];
    if (typeof target === 'function') target();
    else if (target) navigateTo(target);
    else navigateToTripList('all');
}

function navigateToAreaList(areaName) {
    const pageMap = { Kanyaka: 'kanyaka', Kolwezi: 'kolwezi' };
    if (pageMap[areaName]) navigateTo(pageMap[areaName]);
    else navigateToTripList('area-' + areaName.toLowerCase().replace(/\s+/g, '-').replace(/\//g, ''));
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
    if (direction === 'SB' && n.includes('kasumbalesa')) return 'kasumbalesa-exit';
    if (direction === 'SB' && n.includes('sakania')) return 'sakania-exit';
    if (direction === 'SB' && n.includes('mokambo')) return 'mokambo-exit';
    if (n.includes('sakania')) return 'sakania';
    if (n.includes('mokambo')) return 'mokambo';
    if (n.includes('kasumbalesa')) return 'nb-border-kasumbalesa';
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
    const clickAction = (borderKey === 'kasumbalesa-kbp' || borderKey === 'kasumbalesa-whisky' || borderKey === 'sakania' || borderKey === 'mokambo')
        ? `navigateToBorder('${borderKey}')`
        : `navigateToTripList('${direction === 'NB' ? 'nb' : 'sb'}-border-${item.name.toLowerCase().replace(/\s+exit/i, '').split(' ')[0]}')`;
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
                <div class="pod-stat-sub">${s.collectedLate} collected late</div>
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
                                <tr class="table-row-clickable" onclick="event.stopPropagation();navigateToDocuments('${d.status === 'expiring' ? 'expiring' : d.status === 'expired' ? 'expired' : 'valid'}')" title="View document list">
                                    <td>${d.type}</td>
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
                ${t.entryBorder === 'Kasumbalesa' ? `<button class="btn btn-outline btn-sm" onclick="navigateTo('kasumbalesa-detail')">👁️</button>` :
                  t.entryBorder === 'Sakania' ? `<button class="btn btn-outline btn-sm" onclick="navigateTo('sakania')">👁️</button>` :
                  t.entryBorder === 'Mokambo' ? `<button class="btn btn-outline btn-sm" onclick="navigateTo('mokambo')">👁️</button>` :
                  t.exitBorder ? `<button class="btn btn-outline btn-sm" onclick="navigateTo('${t.exitBorder.toLowerCase()}')">👁️</button>` : ''}
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
function renderBorderClearanceOverview(container) {
    container.innerHTML = `
        <div class="page-header"><h1>🛂 Border Clearance Operations</h1><div class="breadcrumb"><a href="#" onclick="navigateTo('dashboard')">Home</a> <span>›</span> <strong>Border Clearance</strong></div></div>
        <div class="kpi-grid">
            <div class="kpi-card green" onclick="navigateTo('kasumbalesa-detail')"><div class="kpi-header"><span class="kpi-title">🅺 Kasumbalesa KBP</span></div><div class="kpi-value">23</div><div class="kpi-trend">Target: 48h | Avg: 12h</div></div>
            <div class="kpi-card orange" onclick="navigateTo('kasumbalesa-whisky')"><div class="kpi-header"><span class="kpi-title">🥃 Kasumbalesa Whisky</span></div><div class="kpi-value">15</div><div class="kpi-trend negative">Target: 72h | Avg: 52h</div></div>
            <div class="kpi-card orange" onclick="navigateTo('sakania')"><div class="kpi-header"><span class="kpi-title">📍 Sakania</span></div><div class="kpi-value">8</div><div class="kpi-trend negative">Target: 48h | Avg: 40h</div></div>
            <div class="kpi-card red" onclick="navigateTo('mokambo')"><div class="kpi-header"><span class="kpi-title">📍 Mokambo</span></div><div class="kpi-value">5</div><div class="kpi-trend negative">Target: 72h | Avg: 78h</div></div>
        </div>
        <div class="table-container">
            <div class="table-header"><h3>All Border Trucks</h3></div>
            <table><thead><tr><th>Trip #</th><th>Truck</th><th>Border</th><th>Process</th><th>Status</th><th>Hours</th><th>Target</th><th>KPI</th><th>Actions</th></tr></thead>
            <tbody>
                <tr><td><strong>NB-2024-001</strong></td><td>ABC123DRC</td><td>Kasumbalesa</td><td><span class="status-badge kbp">🅺 KBP</span></td><td>Cross-checking</td><td>38</td><td>48h</td><td><span class="kpi-indicator orange"></span> Priority</td><td><button class="btn btn-primary btn-sm" onclick="openCommentModal('NB-2024-001')">💬 Comment</button> <button class="btn btn-outline btn-sm" onclick="navigateTo('kasumbalesa-detail')">👁️</button></td></tr>
                <tr><td><strong>NB-2024-008</strong></td><td>JKL012DRC</td><td>Kasumbalesa</td><td><span class="status-badge whisky">🥃 Whisky</span></td><td>TR8 Issued</td><td>52</td><td>72h</td><td><span class="kpi-indicator orange"></span> Priority</td><td><button class="btn btn-primary btn-sm" onclick="openCommentModal('NB-2024-008')">💬 Comment</button> <button class="btn btn-outline btn-sm" onclick="navigateTo('kasumbalesa-whisky')">👁️</button></td></tr>
                <tr><td><strong>NB-2024-015</strong></td><td>XYZ789DRC</td><td>Sakania</td><td><span class="status-badge blue">Standard</span></td><td>Documents Handed</td><td>40</td><td>48h</td><td><span class="kpi-indicator orange"></span> Priority</td><td><button class="btn btn-primary btn-sm" onclick="openCommentModal('NB-2024-015')">💬 Comment</button> <button class="btn btn-outline btn-sm" onclick="navigateTo('sakania')">👁️</button></td></tr>
                <tr><td><strong>NB-2024-022</strong></td><td>GHI789DRC</td><td>Mokambo</td><td><span class="status-badge red">IM4</span></td><td>Duty Payment</td><td>78</td><td>72h</td><td><span class="kpi-indicator red"></span> Overdue</td><td><button class="btn btn-danger btn-sm" onclick="openCommentModal('NB-2024-022')">💬 Urgent</button> <button class="btn btn-outline btn-sm" onclick="navigateTo('mokambo')">👁️</button></td></tr>
            </tbody></table>
        </div>`;
}

// ============================================
// KASUMBALESA KBP DETAIL WITH FROZEN BAR
// ============================================
function renderKasumbalesaKBPDetail(container) {
    container.innerHTML = `
        <div class="page-header"><h1>🅺 Kasumbalesa Border - KBP Process Detail</h1><div class="breadcrumb"><a href="#" onclick="navigateTo('dashboard')">Home</a> <span>›</span> <a href="#" onclick="navigateTo('border-clearance')">Border Clearance</a> <span>›</span> <strong>Truck: ABC 123 | Trip: NB-1001</strong></div></div>
        <div class="frozen-truck-bar">
            <div class="truck-info-group">
                <div class="truck-info-item"><span class="truck-info-label">Trip Number</span><span class="truck-info-value large">NB-1001</span></div>
                <div class="truck-info-item"><span class="truck-info-label">Truck</span><span class="truck-info-value large">ABC 123</span></div>
                <div class="truck-info-item"><span class="truck-info-label">Trailer</span><span class="truck-info-value">TRL-456</span></div>
                <div class="truck-info-item"><span class="truck-info-label">Driver</span><span class="truck-info-value">John Doe</span></div>
                <div class="truck-info-item"><span class="truck-info-label">Direction</span><span class="truck-info-value">🔼 North Bound</span></div>
                <div class="truck-info-item"><span class="truck-info-label">Owner</span><span class="truck-info-value">XYZ Transport</span></div>
            </div>
            <div style="display:flex;align-items:center;gap:15px;">
                <span class="kpi-badge green">🟢 ON TRACK</span>
                <button class="btn btn-success btn-sm" onclick="openCommentModal('NB-2024-001')" style="background:white;color:#1a365d;">💬 Add Comment</button>
            </div>
        </div>
        <div class="card"><div class="card-header"><span>⏱️ Time Tracking</span><span style="display:inline-flex;align-items:center;gap:4px;"><span class="kpi-dot green"></span> UNDER TIME</span></div><div class="card-body"><div class="time-tracker"><div class="time-circle"><span class="time-value">3:35</span><span class="time-label">HRS : MINS</span></div><div class="progress-bar-container"><div style="display:flex;justify-content:space-between;"><span>Total: <strong>3 HRS 35 MINS</strong></span><span>Target: <strong>48 HRS</strong></span></div><div class="progress-bar"><div class="progress-fill" style="width:7.5%;"></div></div><div style="display:flex;justify-content:space-between;font-size:0.8em;color:var(--text-secondary);"><span>7.5% Used</span><span>44 HRS 25 MINS remaining</span></div><div style="margin-top:8px;">🟢 UNDER TIME - EXCELLENT</div></div></div></div></div>
        <div class="tabs"><div class="tab active" onclick="switchBorderTab('kbp-steps',this)">🅺 KBP Steps</div><div class="tab" onclick="switchBorderTab('kbp-documents',this)">📁 Docs (7)</div><div class="tab" onclick="switchBorderTab('kbp-comments',this)">💬 Comments (3)</div><div class="tab" onclick="switchBorderTab('kbp-logs',this)">📋 Activity Log</div></div>
        <div id="tab-kbp-steps">${renderKBPSteps()}</div>
        <div id="tab-kbp-documents" style="display:none;">${renderDocumentsTab()}</div>
        <div id="tab-kbp-comments" style="display:none;">${renderCommentsTab()}</div>
        <div id="tab-kbp-logs" style="display:none;">${renderActivityLogTab()}</div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:20px;"><button class="btn btn-outline" onclick="navigateTo('border-clearance')">⬅️ Back</button><button class="btn btn-outline" onclick="window.print()">🖨️ Print</button><button class="btn btn-primary" onclick="openCommentModal('NB-2024-001')">💬 Add Comment</button></div>`;
}

function renderKBPSteps() {
    const steps = [
        {num:1,title:'📌 TRUCK ARRIVAL & ENTRY - KBP Parking',time:'15/07/2026 08:00',duration:'8 Mins',user:'Jean Kalenga',area:'KBP Gate',action:'Truck entered KBP Parking',detail:'Entry Time: 08:00 | Doc: Entry_ABC123.pdf'},
        {num:2,title:'📌 DOCUMENT SUBMISSION TO BRIGADE OFFICER',time:'15/07/2026 08:30',duration:'30 Mins',target:'4 HRS',user:'Marie Mwamba',area:'KBP Brigade Office',action:'Documents submitted',detail:'Titre ☑ | POD ☑ | Officer: Col. Mutombo'},
        {num:3,title:'📌 TRUCK SCANNING - KBP Scan Bay',time:'15/07/2026 09:15',duration:'45 Mins',user:'Patrick Tshimanga',area:'KBP Scan Bay',action:'Scanning completed - PASS',detail:'Scan ID: KBP-SCAN-0034 | Result: PASS ✅'},
        {num:4,title:'📌 GREEN STAMPING - Customs Inspector',time:'15/07/2026 09:30',duration:'45 Mins',target:'1 HR',user:'Inspector Kabwe',area:'Customs Office',action:'Green stamp applied',detail:'Ref: GS-20260715-089 | Runner: David Mwila'},
        {num:5,title:'📌 RED STAMPING - Another Customs Inspector',time:'15/07/2026 10:15',duration:'50 Mins',target:'1 HR',user:'Inspector Mwape',area:'Customs Office',action:'Red stamp applied',detail:'Ref: RS-20260715-156'},
        {num:6,title:'📌 CROSS-CHECKING - Customs Control Room',time:'15/07/2026 11:00',duration:'45 Mins',user:'Officer Kalaba',area:'Control Room',action:'Cross-checking completed',detail:'Ref: CC-20260715-234 | APPROVED ✅'},
        {num:7,title:'📌 DRIVER CONTACT DETAILS - KBP Admin',time:'15/07/2026 11:30',duration:'5 Mins',user:'Ruth Mwansa',area:'KBP Admin',action:'Driver details recorded',detail:'WhatsApp: +260 977 123456 | DRC: +243 812 345678'}
    ];
    let html = steps.map((s,i) => `
        <div class="step-container completed"><div class="step-header completed" onclick="toggleStep(this)"><div class="step-number">${s.num}</div><div class="step-info"><div class="step-title">${s.title}</div><div class="step-meta"><span>✅ Completed</span><span>📅 ${s.time}</span>${s.target?`<span>🎯 Target: ${s.target}</span>`:''}<span>⏱️ ${s.duration}</span></div></div><div class="step-status-icon">✅</div></div>
        <div class="step-body${i===0?' open':''}"><div class="user-log"><div class="user-info-row"><span class="user-tag">👤 ${s.user}</span><span class="area-tag">📍 ${s.area}</span></div><div class="log-entry"><div class="log-time">📅 ${s.time}</div><div class="log-action">✅ ${s.action}</div><div class="log-detail">📝 ${s.detail}</div></div></div></div></div>
    `).join('');
    html += `<div class="step-container completed" style="border:2px solid var(--success);"><div class="step-header completed" onclick="toggleStep(this)" style="background:#f0fff4;"><div class="step-number" style="background:#276749;font-size:1.2em;">✓</div><div class="step-info"><div class="step-title" style="font-size:1em;">🅺 KBP PROCESS - FINAL APPROVAL</div><div class="step-meta"><span>✅ COMPLETED</span><span>📅 15/07/2026 11:35</span><span>⏱️ TOTAL: 3 HRS 35 MINS</span><span>🎯 TARGET: 48 HRS</span></div></div><div class="step-status-icon">🏆</div></div><div class="step-body"><div class="user-log"><div class="user-info-row"><span class="user-tag">👤 Pierre Lumumba</span><span class="area-tag">📍 KBP Supervisor Office</span></div><div class="log-entry"><div class="log-time">📅 15/07/2026 11:35</div><div class="log-action">✅ KBP Process APPROVED - 3.5 HRS</div><div class="log-detail">All 7 steps verified | Status: 🟢 EXCELLENT | Next: NB Transit</div></div></div></div></div>`;
    return html;
}

function renderDocumentsTab() {
    const docs = ['Entry_ABC123.pdf','Submission_Receipt.pdf','Scan_Report.pdf','Green_Stamped.pdf','Red_Stamped.pdf','CrossCheck_Report.pdf','Driver_Details.pdf'];
    return `<div class="card"><div class="card-header"><span>📁 Documents</span><button class="btn btn-primary btn-sm" onclick="openCommentModal('NB-2024-001')">+ Upload</button></div><div class="card-body"><div class="doc-list">${docs.map(d=>`<div class="doc-item"><span class="doc-icon">📄</span><div><div class="doc-name">${d}</div><div class="doc-uploader">👤 KBP Officer</div></div><button class="btn btn-outline btn-sm">👁️</button></div>`).join('')}</div></div>`;
}

function renderCommentsTab() {
    return `<div class="card"><div class="card-header"><span>💬 Comments & Issues Log</span><button class="btn btn-primary btn-sm" onclick="openCommentModal('NB-2024-001')">+ Add Comment</button></div><div class="card-body">
        <div class="user-log" style="margin-bottom:12px;"><div style="font-weight:600;">👤 Inspector Kabwe - Customs Office</div><div style="font-size:0.8em;color:var(--text-secondary);">📅 15/07/2026 09:45 | 🟠 Problem Report</div><div style="margin-top:8px;"><strong>Problem:</strong> Missing stamp on Titre<br><strong>Person Contacted:</strong> Col. Mutombo<br><strong>Solution:</strong> Supplementary stamp verification<br><strong>Expected Completion:</strong> 15/07/2026 10:00</div></div>
        <div class="user-log" style="margin-bottom:12px;"><div style="font-weight:600;">👤 Marie Mwamba - KBP Brigade</div><div style="font-size:0.8em;color:var(--text-secondary);">📅 15/07/2026 08:35 | 💬 Normal Comment</div><div style="margin-top:8px;">Documents submitted on time. All paperwork in order.</div></div>
        <div class="user-log"><div style="font-weight:600;">👤 Pierre Lumumba (Supervisor)</div><div style="font-size:0.8em;color:var(--text-secondary);">📅 15/07/2026 11:35 | 💬 Normal Comment</div><div style="margin-top:8px;">All processes completed. 🟢 EXCELLENT - 7.5% of time used.</div></div>
    </div></div>`;
}

function renderActivityLogTab() {
    return `<div class="card"><div class="card-header"><span>📋 Complete Activity Log</span></div><div class="card-body" style="max-height:500px;overflow-y:auto;"><table style="width:100%;font-size:0.85em;"><thead><tr style="background:#f7fafc;"><th style="padding:8px;">Time</th><th style="padding:8px;">Area</th><th style="padding:8px;">User</th><th style="padding:8px;">Action</th></tr></thead><tbody>${['08:00|KBP Gate|Jean Kalenga|Truck entered','08:30|KBP Brigade|Marie Mwamba|Docs submitted','09:15|KBP Scan|Patrick Tshimanga|Scan PASS','09:30|Customs|Inspector Kabwe|Green stamp','10:15|Customs|Inspector Mwape|Red stamp','11:00|Control Room|Officer Kalaba|Cross-check APPROVED','11:30|KBP Admin|Ruth Mwansa|Driver details','11:35|Supervisor|Pierre Lumumba|KBP APPROVED'].map(r=>`<tr><td style="padding:8px;">${r.split('|')[0]}</td><td style="padding:8px;">${r.split('|')[1]}</td><td style="padding:8px;">${r.split('|')[2]}</td><td style="padding:8px;">${r.split('|')[3]}</td></tr>`).join('')}</tbody></table></div></div>`;
}

// ============================================
// KASUMBALESA WHISKY
// ============================================
function renderKasumbalesaWhisky(container) {
    container.innerHTML = `
        <div class="page-header"><h1>🥃 Kasumbalesa Border - Whisky Process</h1><div class="breadcrumb"><a href="#" onclick="navigateTo('dashboard')">Home</a> <span>›</span> <a href="#" onclick="navigateTo('border-clearance')">Border Clearance</a> <span>›</span> <strong>Whisky</strong></div></div>
        <div class="frozen-truck-bar"><div class="truck-info-group"><div class="truck-info-item"><span class="truck-info-label">Trip</span><span class="truck-info-value large">NB-2024-008</span></div><div class="truck-info-item"><span class="truck-info-label">Truck</span><span class="truck-info-value large">JKL012DRC</span></div><div class="truck-info-item"><span class="truck-info-label">Hours</span><span class="truck-info-value">52</span></div></div><span class="kpi-badge orange">🟠 PRIORITY</span></div>
        <div class="card"><div class="card-header"><span>🥃 Whisky Process Steps</span><button class="btn btn-primary btn-sm" onclick="openCommentModal('NB-2024-008')">💬 Add Comment</button></div><div class="card-body">${renderWhiskySteps()}</div></div>
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
function renderBorderDetail(container, borderName) {
    const trip = borderName==='Sakania'?tripsDB['NB-2024-015']:tripsDB['NB-2024-022'];
    container.innerHTML = `
        <div class="page-header"><h1>📍 ${borderName} Border Detail</h1><div class="breadcrumb"><a href="#" onclick="navigateTo('dashboard')">Home</a> <span>›</span> <a href="#" onclick="navigateTo('border-clearance')">Border Clearance</a> <span>›</span> <strong>${borderName}</strong></div></div>
        <div class="frozen-truck-bar"><div class="truck-info-group"><div class="truck-info-item"><span class="truck-info-label">Trip</span><span class="truck-info-value large">${trip.tripNumber}</span></div><div class="truck-info-item"><span class="truck-info-label">Truck</span><span class="truck-info-value large">${trip.truck}</span></div><div class="truck-info-item"><span class="truck-info-label">Driver</span><span class="truck-info-value">${trip.driver}</span></div><div class="truck-info-item"><span class="truck-info-label">Hours</span><span class="truck-info-value">${trip.daysInDRC*8}</span></div></div><span class="kpi-badge ${trip.kpi}">${trip.kpi==='red'?'🔴 OVERDUE':'🟠 PRIORITY'}</span></div>
        <div class="card"><div class="card-header"><h3>Active Trucks at ${borderName}</h3><button class="btn btn-primary btn-sm" onclick="openCommentModal('${trip.tripNumber}')">💬 Add Comment</button></div><div class="card-body"><p>Detailed border view for ${borderName}.</p></div></div>
        <button class="btn btn-outline mt-20" onclick="navigateTo('border-clearance')">⬅️ Back</button>`;
}

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
                                <td><strong>${d.type}</strong></td>
                                <td>${d.entity}</td>
                                <td>${d.trip}</td>
                                <td>${d.truck}</td>
                                <td>${d.expiry}</td>
                                <td><span class="status-badge ${d.kpi}"><span class="dot"></span> ${d.label}</span></td>
                                <td><button class="btn btn-primary btn-sm" onclick="openCommentModal('${d.trip}')">💬</button></td>
                            </tr>
                        `).join('') : '<tr><td colspan="7" style="text-align:center;padding:24px;">No documents match this filter</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>

        <button class="btn btn-outline mt-20" onclick="navigateTo('dashboard')">⬅️ Back to Dashboard</button>
    `;
}

function renderPODStageIcon(done, late) {
    if (done) return '<span class="pod-stage-icon done">✅</span>';
    if (late) return '<span class="pod-stage-icon late">❌</span>';
    return '<span class="pod-stage-icon pending">⬜</span>';
}

function renderPODTableRows(items) {
    if (!items.length) {
        return '<tr><td colspan="12" style="text-align:center;padding:24px;color:var(--text-secondary);">No POD items match this filter</td></tr>';
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

function renderPODManagement(container) {
    const filter = currentPODFilter;
    const items = filterPODItems(filter);
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

        <div class="table-container">
            <div class="table-header">
                <h3>${getPODFilterLabel(filter)}</h3>
                <span style="color:var(--text-secondary);">${items.length} item${items.length !== 1 ? 's' : ''}</span>
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
                    <tbody>${renderPODTableRows(items)}</tbody>
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

function renderRunnerFees(container) {
    container.innerHTML = `<div class="page-header"><h1>💰 Runner Fees</h1></div><div class="card"><div class="card-header"><h3>Fee Rates</h3></div><div class="card-body"><p>Sakania/Kasumbalesa: 0-2d: $40 | 3-4d: $25 | 5+d: $15</p><p>Kanyaka: 0-1d: $5</p></div></div>`;
}

function renderReports(container) {
    container.innerHTML = `<div class="page-header"><h1>📈 Reports</h1></div><div class="kpi-grid">${['NB Turnaround','SB Turnaround','POD','Runner Fees'].map(r=>`<div class="kpi-card" onclick="showToast('${r} Report generated!','success')"><div class="kpi-header"><span>${r} Report</span></div></div>`).join('')}</div>`;
}

// ============================================
// COMMENT MODAL FUNCTIONS
// ============================================
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
    uploadedFiles = [];
    document.getElementById('fileList').innerHTML = '';
    document.getElementById('fileUploadArea').classList.remove('has-file');
    document.getElementById('validationMessage').classList.remove('show');

    updateCommentTypeUI();

    const now = new Date();
    now.setHours(now.getHours()+24);
    document.getElementById('expectedCompletion').value = now.toISOString().slice(0,16);

    const statusSelect = document.getElementById('modalStatusUpdate');
    statusSelect.innerHTML = '<option value="">No status change</option>';
    if (trip.direction==='NB') {
        statusSelect.innerHTML += '<option>Border Clearance Complete</option><option>Arrived at Kanyaka</option><option>Offloading Complete</option><option>POD Collected</option>';
    } else if (trip.direction==='SB') {
        statusSelect.innerHTML += '<option>Loading Complete</option><option>Dispatched</option><option>Arrived at Kanyaka SB</option><option>Border Exit Complete</option>';
    }

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
        if(!p.trim()||!c.trim()||!s.trim()||!e){
            document.getElementById('validationMessage').textContent = '⚠️ All structured comment fields are required.';
            document.getElementById('validationMessage').classList.add('show');
            return;
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
function switchBorderTab(tabId,tabElement){
    ['kbp-steps','kbp-documents','kbp-comments','kbp-logs'].forEach(id=>{const el=document.getElementById('tab-'+id);if(el)el.style.display=id===tabId?'block':'none';});
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    if(tabElement)tabElement.classList.add('active');
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
