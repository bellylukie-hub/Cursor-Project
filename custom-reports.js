/**
 * Customizable reports — one report builder per sidebar menu item.
 * Column selection, KPI filters, saved layouts, and CSV export.
 */
(function () {
    const LAYOUT_STORAGE_KEY = 'truckcontrol_custom_report_layouts_v1';
    const COMBINED_LAYOUT_STORAGE_KEY = 'truckcontrol_combined_report_layouts_v1';
    const COMBINED_REPORT_ID = '__combined__';

    /** Modules whose rows can be joined on trip # in a cross-menu report */
    const TRIP_JOIN_MODULES = new Set([
        'dashboard', 'nb-operations', 'sb-operations', 'border-clearance', 'pod-management',
        'area-browser', 'position-live', 'driver-registry', 'runner-fees'
    ]);

    const REPORT_CATALOG = [
        {
            section: 'Main',
            items: [
                { id: 'dashboard', icon: '📊', title: 'Dashboard', desc: 'All active trucks with KPI summary and turnaround metrics' }
            ]
        },
        {
            section: 'Operations',
            items: [
                { id: 'nb-operations', icon: '🚛', title: 'NB Operations', desc: 'Northbound trucks — border, area, workflow status' },
                { id: 'sb-operations', icon: '🚛', title: 'SB Operations', desc: 'Southbound trucks — loading through border exit' },
                { id: 'border-clearance', icon: '🛂', title: 'Border Clearance', desc: 'NB entry and SB exit clearance performance' },
                { id: 'pod-management', icon: '📋', title: 'POD Management', desc: 'POD collection pipeline and timeliness' }
            ]
        },
        {
            section: 'Areas',
            items: [
                { id: 'area-browser', icon: '🗺️', title: 'Area Trucks', desc: 'Trucks across selected operational areas (NB + SB)' }
            ]
        },
        {
            section: 'Communication',
            items: [
                { id: 'communication-matrix', icon: '📇', title: 'Communication Matrix', desc: 'Contacts, companies, and escalation paths' },
                { id: 'driver-registry', icon: '📱', title: 'Driver Registry', desc: 'Registered driver WhatsApp and DRC numbers' },
                { id: 'internal-communication', icon: '✉️', title: 'Internal Communication', desc: 'Emails and chat conversations' }
            ]
        },
        {
            section: 'Management',
            items: [
                { id: 'assets', icon: '🚗', title: 'Assets & Equipment', desc: 'Fleet assets, documents, and expiry status' },
                { id: 'runner-fees', icon: '💰', title: 'Runner Fees', desc: 'Border and Kanyaka runner fee calculations' },
                { id: 'turnarounds', icon: '🔄', title: 'Turnarounds', desc: 'NB → POD → SB lifecycle per truck' },
                { id: 'position-live', icon: '📍', title: 'Position Live', desc: 'Live operations position and workflow status' }
            ]
        },
        {
            section: 'Admin',
            items: [
                { id: 'admin-users', icon: '👥', title: 'Manage Users', desc: 'System users, roles, and account status' },
                { id: 'admin-roles', icon: '🛡️', title: 'Role Manager', desc: 'Roles and permission definitions' },
                { id: 'admin-settings', icon: '⚙️', title: 'System Settings', desc: 'Application configuration values' },
                { id: 'admin-themes', icon: '🎨', title: 'Themes', desc: 'Colour theme catalogue' },
                { id: 'admin-kpi-settings', icon: '🎯', title: 'KPI Settings', desc: 'KPI targets and thresholds' },
                { id: 'admin-audit-logs', icon: '📋', title: 'Audit Logs', desc: 'User actions and system events' },
                { id: 'admin-area-statuses', icon: '📍', title: 'Area Status Lists', desc: 'Per-area workflow status definitions' },
                { id: 'admin-area-assignments', icon: '🗺️', title: 'Area Assignments', desc: 'User-to-area assignment matrix' },
                { id: 'admin-module-permissions', icon: '🔐', title: 'Module Permissions', desc: 'Per-user module and area access' },
                { id: 'admin-fleet-settings', icon: '🚛', title: 'Fleet — Same Truck for SB', desc: 'Fleet owner same-truck policy flags' },
                { id: 'admin-upload-templates', icon: '📤', title: 'Upload Templates', desc: 'NB/SB/LIVE upload column templates' }
            ]
        }
    ];

    const LEGACY_REPORT_MAP = {
        'operations-overview': 'dashboard',
        'nb-report': 'nb-operations',
        'sb-report': 'sb-operations',
        'border-report': 'border-clearance',
        'pod-report': 'pod-management',
        'area-report': 'area-browser',
        'kpi-alerts-report': 'dashboard',
        'turnaround-report': 'turnarounds'
    };

    let currentReportModuleId = 'dashboard';
    let reportBuilderState = {
        selectedColumnIds: [],
        kpiFilter: 'all',
        searchTerm: '',
        layoutName: ''
    };

    let combinedReportState = {
        selectedModules: ['nb-operations', 'border-clearance', 'pod-management'],
        selectedFieldKeys: [],
        filters: {
            direction: 'all',
            kpi: 'all',
            area: 'all',
            border: 'all',
            podCollected: 'all',
            search: ''
        },
        layoutName: ''
    };

    function col(id, label, getValue) {
        return { id, label, getValue };
    }

    function tripCols(direction) {
        const isNB = direction === 'NB';
        return [
            col('tripNumber', 'Trip #', r => r.tripNumber),
            col('truck', 'Truck', r => r.truck),
            col('owner', 'Owner', r => r.owner),
            col('driver', 'Driver', r => r.driver),
            col(isNB ? 'entryBorder' : 'loadingPoint', isNB ? 'Border' : 'Loading Point', r => isNB ? (r.entryBorder || '—') : (r.loadingPoint || '—')),
            col(isNB ? 'offloadingPoint' : 'exitBorder', isNB ? 'Offloading' : 'Exit Border', r => isNB ? (r.offloadingPoint || '—') : (r.exitBorder || '—')),
            col('area', 'Area', r => r.area || '—'),
            col('status', 'Status', r => r.status),
            col('areaStatus', 'Area Status', r => r.areaStatus || '—'),
            col('daysInDRC', 'Days in DRC', r => r.daysInDRC),
            col('kpi', 'KPI', r => typeof getKPILabel === 'function' ? getKPILabel(r.kpi) : r.kpi),
            col('lastUpdatedAt', 'Last Update', r => r.lastUpdatedAt || '—')
        ];
    }

    function getReportAreaBrowserTrips() {
        const hasSelection = typeof selectedAreaIds !== 'undefined' && selectedAreaIds.length > 0;
        if (hasSelection) {
            const nb = typeof filterNBTrucksByAreas === 'function' ? filterNBTrucksByAreas('') : [];
            const sb = typeof filterSBTrucksByAreas === 'function' ? filterSBTrucksByAreas('') : [];
            return [...nb, ...sb];
        }
        if (!areasDB?.length) {
            return typeof filterTripsByUserArea === 'function'
                ? filterTripsByUserArea(Object.values(tripsDB))
                : Object.values(tripsDB);
        }
        const seen = new Set();
        const out = [];
        areasDB.forEach(area => {
            Object.values(tripsDB).forEach(t => {
                if (seen.has(t.tripNumber)) return;
                const match = (t.direction === 'NB' && typeof tripMatchesNBArea === 'function' && tripMatchesNBArea(t, area))
                    || (t.direction === 'SB' && typeof tripMatchesSBArea === 'function' && tripMatchesSBArea(t, area));
                if (match && (typeof filterTripsByUserArea !== 'function' || filterTripsByUserArea([t]).length)) {
                    seen.add(t.tripNumber);
                    out.push(t);
                }
            });
        });
        return out;
    }

    function getReportPODItems() {
        if (typeof canAccessModule === 'function' && !canAccessModule('pod-management')) return [];
        return podDB.filter(p => userIsSuperAdmin() || canModuleAction('pod-management', 'view', p.area));
    }

    function getReportInternalCommRows() {
        const emails = emailsDB.filter(e => !e.mirrorOf).map(e => ({
            _id: `email-${e.id}`,
            recordType: 'Email',
            subject: e.subject,
            body: (e.body || '').slice(0, 120),
            sender: e.from,
            recipients: (e.to || []).join('; '),
            folder: e.folder,
            relatedLabel: e.relatedLabel || '—',
            sentAt: e.sentAt,
            status: e.read ? 'Read' : 'Unread',
            important: e.important ? 'Yes' : 'No'
        }));
        const chats = chatRoomsDB.map(r => ({
            _id: `chat-${r.id}`,
            recordType: r.type === 'group' ? 'Group Chat' : 'Direct Chat',
            subject: r.name,
            body: (r.lastMessage || '').slice(0, 120),
            sender: r.createdBy || '—',
            recipients: (r.memberNames || []).join('; ') || String(r.members || '—'),
            folder: 'chat',
            relatedLabel: r.relatedType ? `${r.relatedType}: ${r.relatedRef}` : '—',
            sentAt: r.lastAt,
            status: r.unreadCount ? `${r.unreadCount} unread` : 'Read',
            important: '—'
        }));
        return [...emails, ...chats];
    }

    function getReportRunnerFeeRows() {
        const border = typeof buildBorderRunnerRows === 'function' ? buildBorderRunnerRows() : [];
        const knb = typeof buildKanyakaRunnerRows === 'function' ? buildKanyakaRunnerRows('NB') : [];
        const ksb = typeof buildKanyakaRunnerRows === 'function' ? buildKanyakaRunnerRows('SB') : [];
        return [
            ...border.map(r => ({ ...r, feeCategory: 'Border Runner', feeAmount: r.fee, tierLabel: r.tier?.label || '—' })),
            ...knb.map(r => ({ ...r, feeCategory: 'Kanyaka NB', feeAmount: r.fee, tierLabel: r.tierLabel })),
            ...ksb.map(r => ({ ...r, feeCategory: 'Kanyaka SB', feeAmount: r.fee, tierLabel: r.tierLabel }))
        ];
    }

    function getReportTurnaroundRows() {
        const cache = typeof turnaroundsCache !== 'undefined' ? turnaroundsCache : [];
        return cache.map((t, i) => ({
            _id: t.id || `ta-${i}`,
            truck: t.truck?.plate || '—',
            fleetOwner: t.fleetOwner?.name || '—',
            turnaroundStatus: t.status || '—',
            nbTrip: t.nbTrip?.tripNumber || '—',
            nbStatus: t.nbTrip?.status || '—',
            sbTrip: t.sbTrip?.tripNumber || '—',
            sbStatus: t.sbTrip?.status || '—',
            sameTruckPolicy: t.sameTruckEnforced ? 'Required' : 'Optional'
        }));
    }

    function getReportPositionLiveTrips() {
        let trips = Object.values(tripsDB);
        if (typeof filterTripsByUserArea === 'function') trips = filterTripsByUserArea(trips);
        return trips;
    }

    function getReportAdminUsers() {
        return adminUsersDB.map(u => ({
            _id: u.id,
            username: u.username,
            fullName: u.fullName || '—',
            email: u.email || '—',
            role: typeof getRoleById === 'function' ? (getRoleById(u.roleId)?.name || '—') : '—',
            area: u.area || '—',
            assignedAreas: (u.assignedAreas || []).join(', ') || '—',
            status: u.status || '—',
            lastLogin: u.lastLogin || '—'
        }));
    }

    function getReportAdminRoles() {
        return rolesDB.map(r => ({
            _id: r.id,
            name: r.name,
            description: r.description || '—',
            permissions: (r.permissions || []).length,
            usersAssigned: adminUsersDB.filter(u => u.roleId === r.id).length
        }));
    }

    function getReportAdminSettings() {
        const s = systemSettingsDB || {};
        return Object.entries(s).map(([key, val]) => ({
            _id: key,
            setting: key,
            value: typeof val === 'object' ? JSON.stringify(val) : String(val ?? '—')
        }));
    }

    function getReportAdminThemes() {
        const themes = typeof window.APP_THEMES !== 'undefined' ? window.APP_THEMES : {};
        return Object.entries(themes).map(([id, t]) => ({
            _id: id,
            themeId: id,
            name: t.name || id,
            primary: t.colors?.primary || '—',
            active: systemSettingsDB?.activeTheme === id ? 'Yes' : 'No'
        }));
    }

    function getReportAdminKpiSettings() {
        return (kpiSettingsDB || []).map(k => ({
            _id: k.id,
            process: k.process,
            page: k.pageLabel || k.pageId || '—',
            target: k.targetValue,
            unit: k.unit || '—',
            notes: k.notes || '—'
        }));
    }

    function getReportAdminAuditLogs() {
        return auditLogsDB.map(l => ({
            _id: l.id,
            timestamp: l.timestamp,
            user: l.user || '—',
            action: l.action,
            module: l.module || '—',
            details: l.details || '—'
        }));
    }

    function getReportAdminAreaStatuses() {
        return areaStatusesDB.map(a => ({
            _id: a.id,
            area: a.area,
            nbStatuses: (a.statusesNB || []).length,
            sbStatuses: (a.statusesSB || []).length,
            borderNbStatuses: (a.statusesBorderNB || []).length,
            borderSbStatuses: (a.statusesBorderSB || []).length
        }));
    }

    function getReportAdminAreaAssignments() {
        return adminUsersDB.map(u => ({
            _id: u.id,
            username: u.username,
            role: typeof getRoleById === 'function' ? (getRoleById(u.roleId)?.name || '—') : '—',
            primaryArea: u.area || '—',
            assignedAreas: (u.assignedAreas || []).join(', ') || '—',
            status: u.status
        }));
    }

    function getReportAdminModulePermissions() {
        const rows = [];
        adminUsersDB.forEach(u => {
            const perms = u.modulePermissions || {};
            Object.entries(perms).forEach(([modId, areas]) => {
                rows.push({
                    _id: `${u.id}-${modId}`,
                    username: u.username,
                    module: modId,
                    areas: Array.isArray(areas) ? areas.join(', ') : String(areas),
                    access: areas && areas.length ? 'Granted' : 'None'
                });
            });
        });
        return rows;
    }

    function getReportAdminFleetSettings() {
        const owners = [...new Set(Object.values(tripsDB).map(t => t.owner).filter(Boolean))];
        return owners.map((name, i) => ({
            _id: `fleet-${i}`,
            fleetOwner: name,
            nbTrips: Object.values(tripsDB).filter(t => t.owner === name && t.direction === 'NB').length,
            sbTrips: Object.values(tripsDB).filter(t => t.owner === name && t.direction === 'SB').length,
            note: 'Configure same-truck policy in Admin → Fleet when backend is connected'
        }));
    }

    function getReportAdminUploadTemplates() {
        const tpl = typeof uploadTemplatesDB !== 'undefined' ? uploadTemplatesDB : {};
        return Object.entries(tpl).map(([key, t]) => ({
            _id: key,
            templateKey: key,
            label: t.label || key,
            columns: (t.columns || []).join(', '),
            columnCount: (t.columns || []).length
        }));
    }

    const REPORT_MODULE_REGISTRY = {
        dashboard: {
            label: 'Dashboard',
            filenamePrefix: 'Dashboard',
            canAccess: () => typeof canAccessPage === 'function' ? canAccessPage('dashboard') : true,
            getData: () => typeof filterTripsByUserArea === 'function'
                ? filterTripsByUserArea(Object.values(tripsDB))
                : Object.values(tripsDB),
            getColumns: () => [
                col('tripNumber', 'Trip #', r => r.tripNumber),
                col('direction', 'Direction', r => r.direction),
                col('truck', 'Truck', r => r.truck),
                col('driver', 'Driver', r => r.driver),
                col('owner', 'Owner', r => r.owner),
                col('area', 'Area', r => r.area || '—'),
                col('status', 'Status', r => r.status),
                col('daysInDRC', 'Days in DRC', r => r.daysInDRC),
                col('kpi', 'KPI', r => typeof getKPILabel === 'function' ? getKPILabel(r.kpi) : r.kpi),
                col('lastUpdatedAt', 'Last Update', r => r.lastUpdatedAt || '—')
            ],
            kpiTypes: ['all', 'green', 'orange', 'red'],
            renderKpi: (rows) => renderTripKpiSummary(rows, 'Dashboard')
        },
        'nb-operations': {
            label: 'NB Operations',
            filenamePrefix: 'NB_Operations',
            canAccess: () => typeof canAccessModule === 'function' ? canAccessModule('nb-operations') : true,
            getData: () => typeof getOperationsTripsBase === 'function' ? getOperationsTripsBase('NB') : [],
            getColumns: () => tripCols('NB'),
            kpiTypes: ['all', 'green', 'orange', 'red'],
            renderKpi: (rows) => renderTripKpiSummary(rows, 'NB Operations')
        },
        'sb-operations': {
            label: 'SB Operations',
            filenamePrefix: 'SB_Operations',
            canAccess: () => typeof canAccessModule === 'function' ? canAccessModule('sb-operations') : true,
            getData: () => typeof getOperationsTripsBase === 'function' ? getOperationsTripsBase('SB') : [],
            getColumns: () => tripCols('SB'),
            kpiTypes: ['all', 'green', 'orange', 'red'],
            renderKpi: (rows) => renderTripKpiSummary(rows, 'SB Operations')
        },
        'border-clearance': {
            label: 'Border Clearance',
            filenamePrefix: 'Border_Clearance',
            canAccess: () => typeof canAccessModule === 'function' ? canAccessModule('border-clearance') : true,
            getData: () => typeof getBorderClearanceRowsBase === 'function' ? getBorderClearanceRowsBase() : [],
            getColumns: () => [
                col('trip', 'Trip #', r => r.trip),
                col('truck', 'Truck', r => r.truck),
                col('driver', 'Driver', r => r.driver),
                col('direction', 'Direction', r => r.direction),
                col('border', 'Border', r => r.border),
                col('process', 'Process', r => r.process),
                col('status', 'Status', r => r.status),
                col('hours', 'Hours', r => r.hours),
                col('target', 'Target', r => r.target),
                col('kpi', 'KPI', r => r.kpiLabel || r.kpi)
            ],
            kpiTypes: ['all', 'green', 'orange', 'red'],
            renderKpi: (rows) => renderGenericKpiSummary(rows, [
                { label: 'Total Trucks', value: rows.length },
                { label: 'NB', value: rows.filter(r => r.direction === 'NB').length },
                { label: 'SB', value: rows.filter(r => r.direction === 'SB').length },
                { label: 'At Risk', value: rows.filter(r => r.kpi === 'orange' || r.kpi === 'red').length, color: 'orange' }
            ])
        },
        'pod-management': {
            label: 'POD Management',
            filenamePrefix: 'POD_Management',
            canAccess: () => typeof canAccessModule === 'function' ? canAccessModule('pod-management') : true,
            getData: getReportPODItems,
            getColumns: () => [
                col('trip', 'Trip #', r => r.trip),
                col('truck', 'Truck', r => r.truck),
                col('driver', 'Driver', r => r.driver),
                col('area', 'Area', r => r.area),
                col('offloadingPoint', 'Offloading', r => r.offloadingPoint),
                col('owner', 'Owner', r => r.owner || '—'),
                col('collected', 'Collected', r => typeof getPODCollectedLabel === 'function' ? getPODCollectedLabel(r) : (r.collected ? 'Yes' : 'No')),
                col('scanned', 'Scanned', r => r.scanned ? 'Yes' : 'No'),
                col('uploaded', 'Uploaded', r => r.uploaded ? 'Yes' : 'No'),
                col('sentInvoicing', 'Sent to Invoicing', r => r.sentToInvoicing ? 'Yes' : 'No'),
                col('hoursToCollect', 'Hours to Collect', r => r.collected && r.hoursToCollect ? `${r.hoursToCollect}h` : '—'),
                col('kpi', 'KPI', r => typeof getKPILabel === 'function' ? getKPILabel(r.kpi) : r.kpi),
                col('stageStatus', 'Stage', r => typeof getPODStageStatus === 'function' ? getPODStageStatus(r) : '—')
            ],
            kpiTypes: ['all', 'green', 'orange', 'red'],
            renderKpi: (rows) => {
                const pending = rows.filter(r => !r.collected).length;
                const overdue = rows.filter(r => r.overdue).length;
                return renderGenericKpiSummary(rows, [
                    { label: 'Total PODs', value: rows.length },
                    { label: 'Pending', value: pending, color: 'orange' },
                    { label: 'Overdue', value: overdue, color: 'red' },
                    { label: 'Collected', value: rows.filter(r => r.collected).length, color: 'green' }
                ]);
            }
        },
        'area-browser': {
            label: 'Area Trucks',
            filenamePrefix: 'Area_Trucks',
            canAccess: () => typeof canAccessModule === 'function' ? canAccessModule('area-browser') : true,
            getData: getReportAreaBrowserTrips,
            getColumns: () => [
                col('tripNumber', 'Trip #', r => r.tripNumber),
                col('direction', 'Direction', r => r.direction),
                col('truck', 'Truck', r => r.truck),
                col('driver', 'Driver', r => r.driver),
                col('area', 'Area', r => r.area || '—'),
                col('status', 'Status', r => r.status),
                col('daysInDRC', 'Days', r => r.daysInDRC),
                col('kpi', 'KPI', r => typeof getKPILabel === 'function' ? getKPILabel(r.kpi) : r.kpi)
            ],
            kpiTypes: ['all', 'green', 'orange', 'red'],
            renderKpi: (rows) => renderTripKpiSummary(rows, 'Area Trucks')
        },
        'communication-matrix': {
            label: 'Communication Matrix',
            filenamePrefix: 'Communication_Matrix',
            canAccess: () => typeof canAccessModule === 'function' ? canAccessModule('communication-matrix') : true,
            getData: () => typeof getFilteredMatrixContacts === 'function' ? getFilteredMatrixContacts() : communicationMatrixDB,
            getColumns: () => [
                col('id', 'ID', r => r.id),
                col('name', 'Name', r => r.name),
                col('company', 'Company', r => r.company),
                col('function', 'Function', r => r.function),
                col('email', 'Email', r => r.email || '—'),
                col('phone', 'Phone', r => r.phone || '—'),
                col('whatsapp', 'WhatsApp', r => r.whatsapp || '—'),
                col('area', 'Area', r => r.area || '—'),
                col('active', 'Status', r => r.active ? 'Active' : 'Inactive'),
                col('notes', 'Notes', r => r.notes || '—')
            ],
            renderKpi: (rows) => renderGenericKpiSummary(rows, [
                { label: 'Contacts', value: rows.length },
                { label: 'Active', value: rows.filter(r => r.active).length, color: 'green' },
                { label: 'Inactive', value: rows.filter(r => !r.active).length },
                { label: 'Companies', value: [...new Set(rows.map(r => r.company))].length }
            ])
        },
        'driver-registry': {
            label: 'Driver Registry',
            filenamePrefix: 'Driver_Registry',
            canAccess: () => typeof canAccessModule === 'function' ? canAccessModule('driver-registry') : true,
            getData: () => typeof getFilteredDriverContacts === 'function' ? getFilteredDriverContacts() : driverContactsDB,
            getColumns: () => [
                col('driverName', 'Driver', r => r.driverName),
                col('tripNumber', 'Trip #', r => r.tripNumber || '—'),
                col('truck', 'Truck', r => r.truck || '—'),
                col('direction', 'Direction', r => r.direction || '—'),
                col('border', 'Border', r => r.border || '—'),
                col('owner', 'Company', r => r.owner || '—'),
                col('drcNumber', 'DRC Number', r => r.drcNumber || '—'),
                col('whatsapp', 'WhatsApp', r => r.whatsapp || '—'),
                col('registeredBy', 'Registered By', r => r.registeredBy || '—'),
                col('registeredAt', 'Date', r => r.registeredAt ? r.registeredAt.replace('T', ' ').slice(0, 16) : '—')
            ],
            renderKpi: (rows) => {
                const stats = typeof getDriverRegistryStats === 'function' ? getDriverRegistryStats() : { total: rows.length, nb: 0, sb: 0 };
                return renderGenericKpiSummary(rows, [
                    { label: 'Total', value: stats.total },
                    { label: 'NB', value: stats.nb, color: 'green' },
                    { label: 'SB', value: stats.sb, color: 'orange' },
                    { label: 'Complete', value: rows.filter(r => r.drcNumber && r.whatsapp).length }
                ]);
            }
        },
        'internal-communication': {
            label: 'Internal Communication',
            filenamePrefix: 'Internal_Communication',
            canAccess: () => typeof canAccessModule === 'function' ? canAccessModule('internal-communication') : true,
            getData: getReportInternalCommRows,
            getColumns: () => [
                col('recordType', 'Type', r => r.recordType),
                col('subject', 'Subject / Room', r => r.subject),
                col('body', 'Preview', r => r.body),
                col('sender', 'Sender', r => r.sender),
                col('recipients', 'Recipients', r => r.recipients),
                col('folder', 'Folder', r => r.folder),
                col('relatedLabel', 'Linked To', r => r.relatedLabel),
                col('sentAt', 'Date/Time', r => r.sentAt),
                col('status', 'Status', r => r.status)
            ],
            renderKpi: (rows) => {
                const stats = typeof getInternalCommStats === 'function' ? getInternalCommStats() : {};
                return renderGenericKpiSummary(rows, [
                    { label: 'Records', value: rows.length },
                    { label: 'Unread Email', value: stats.unread || 0, color: 'orange' },
                    { label: 'Sent', value: stats.sent || 0 },
                    { label: 'Chats', value: (stats.groupChats || 0) + (stats.directChats || 0) }
                ]);
            }
        },
        assets: {
            label: 'Assets & Equipment',
            filenamePrefix: 'Assets_Equipment',
            canAccess: () => typeof canAccessModule === 'function' ? canAccessModule('assets') : true,
            getData: () => typeof getFilteredAssetsRegistry === 'function' ? getFilteredAssetsRegistry() : assetsRegistryDB,
            getColumns: () => [
                col('id', 'Asset ID', r => r.id),
                col('category', 'Category', r => r.category === 'vehicle' ? 'Vehicle' : 'Equipment'),
                col('assetType', 'Type', r => r.assetType),
                col('name', 'Name', r => r.name),
                col('plateSerial', 'Plate / Serial', r => r.category === 'vehicle' ? (r.plateNumber || '—') : (r.serialNumber || '—')),
                col('assigned', 'Assigned To', r => r.category === 'vehicle' ? (r.assignedDriver || r.owner || '—') : (r.assignedTo || '—')),
                col('location', 'Location', r => r.location || '—'),
                col('status', 'Status', r => typeof formatAssetStatus === 'function' ? formatAssetStatus(r.status) : r.status)
            ],
            renderKpi: (rows) => {
                const stats = typeof getAssetRegistryStats === 'function' ? getAssetRegistryStats() : {};
                return renderGenericKpiSummary(rows, [
                    { label: 'Total Assets', value: rows.length },
                    { label: 'Vehicles', value: stats.vehicles || rows.filter(r => r.category === 'vehicle').length },
                    { label: 'Equipment', value: stats.equipment || rows.filter(r => r.category !== 'vehicle').length },
                    { label: 'Expiring Docs', value: stats.expiringDocs || 0, color: 'orange' }
                ]);
            }
        },
        'runner-fees': {
            label: 'Runner Fees',
            filenamePrefix: 'Runner_Fees',
            canAccess: () => typeof canAccessModule === 'function' ? canAccessModule('runner-fees') : true,
            getData: getReportRunnerFeeRows,
            getColumns: () => [
                col('feeCategory', 'Category', r => r.feeCategory),
                col('trip', 'Trip #', r => r.trip),
                col('truck', 'Truck', r => r.truck),
                col('transporter', 'Transporter', r => r.transporter),
                col('border', 'Border', r => r.border || '—'),
                col('arrival', 'Arrival', r => typeof formatRunnerDate === 'function' ? formatRunnerDate(r.arrival) : r.arrival),
                col('exit', 'Exit', r => typeof formatRunnerDate === 'function' ? formatRunnerDate(r.exit) : r.exit),
                col('days', 'Days', r => r.days),
                col('tierLabel', 'Tier', r => r.tierLabel),
                col('feeAmount', 'Fee ($)', r => r.feeAmount)
            ],
            renderKpi: (rows) => {
                const total = rows.reduce((s, r) => s + (Number(r.feeAmount) || 0), 0);
                return renderGenericKpiSummary(rows, [
                    { label: 'Fee Lines', value: rows.length },
                    { label: 'Border', value: rows.filter(r => r.feeCategory === 'Border Runner').length },
                    { label: 'Kanyaka', value: rows.filter(r => r.feeCategory?.includes('Kanyaka')).length },
                    { label: 'Total Fees', value: `$${total}`, color: 'green' }
                ]);
            }
        },
        turnarounds: {
            label: 'Turnarounds',
            filenamePrefix: 'Turnarounds',
            canAccess: () => typeof canAccessModule === 'function' ? canAccessModule('turnarounds') : true,
            getData: getReportTurnaroundRows,
            getColumns: () => [
                col('truck', 'Truck', r => r.truck),
                col('fleetOwner', 'Fleet Owner', r => r.fleetOwner),
                col('turnaroundStatus', 'Status', r => r.turnaroundStatus),
                col('nbTrip', 'NB Trip', r => r.nbTrip),
                col('nbStatus', 'NB Status', r => r.nbStatus),
                col('sbTrip', 'SB Trip', r => r.sbTrip),
                col('sbStatus', 'SB Status', r => r.sbStatus),
                col('sameTruckPolicy', 'Same Truck', r => r.sameTruckPolicy)
            ],
            renderKpi: (rows) => renderGenericKpiSummary(rows, [
                { label: 'Turnarounds', value: rows.length },
                { label: 'With SB', value: rows.filter(r => r.sbTrip !== '—').length, color: 'green' },
                { label: 'NB Only', value: rows.filter(r => r.sbTrip === '—').length, color: 'orange' },
                { label: 'Same Truck', value: rows.filter(r => r.sameTruckPolicy === 'Required').length }
            ])
        },
        'position-live': {
            label: 'Position Live',
            filenamePrefix: 'Position_Live',
            canAccess: () => typeof canAccessModule === 'function' ? canAccessModule('position-live') : true,
            getData: getReportPositionLiveTrips,
            getColumns: () => [
                col('tripNumber', 'Trip #', r => r.tripNumber),
                col('direction', 'Direction', r => r.direction),
                col('truck', 'Truck', r => r.truck),
                col('driver', 'Driver', r => r.driver),
                col('owner', 'Owner', r => r.owner),
                col('area', 'Area', r => r.area || '—'),
                col('status', 'Status', r => r.status),
                col('daysInDRC', 'Days', r => r.daysInDRC),
                col('kpi', 'KPI', r => typeof getKPILabel === 'function' ? getKPILabel(r.kpi) : r.kpi)
            ],
            kpiTypes: ['all', 'green', 'orange', 'red'],
            renderKpi: (rows) => renderTripKpiSummary(rows, 'Position Live')
        },
        'admin-users': {
            label: 'Manage Users',
            filenamePrefix: 'Admin_Users',
            canAccess: () => typeof canAccessAdminPage === 'function' ? canAccessAdminPage('admin-users') : false,
            getData: getReportAdminUsers,
            getColumns: () => [
                col('username', 'Username', r => r.username),
                col('fullName', 'Full Name', r => r.fullName),
                col('email', 'Email', r => r.email),
                col('role', 'Role', r => r.role),
                col('area', 'Primary Area', r => r.area),
                col('assignedAreas', 'Assigned Areas', r => r.assignedAreas),
                col('status', 'Status', r => r.status),
                col('lastLogin', 'Last Login', r => r.lastLogin)
            ],
            renderKpi: (rows) => renderGenericKpiSummary(rows, [
                { label: 'Users', value: rows.length },
                { label: 'Active', value: rows.filter(r => r.status === 'active').length, color: 'green' },
                { label: 'Banned', value: rows.filter(r => r.status === 'banned').length, color: 'red' }
            ])
        },
        'admin-roles': {
            label: 'Role Manager',
            filenamePrefix: 'Admin_Roles',
            canAccess: () => typeof canAccessAdminPage === 'function' ? canAccessAdminPage('admin-roles') : false,
            getData: getReportAdminRoles,
            getColumns: () => [
                col('name', 'Role', r => r.name),
                col('description', 'Description', r => r.description),
                col('permissions', 'Permissions', r => r.permissions),
                col('usersAssigned', 'Users', r => r.usersAssigned)
            ],
            renderKpi: (rows) => renderGenericKpiSummary(rows, [{ label: 'Roles', value: rows.length }])
        },
        'admin-settings': {
            label: 'System Settings',
            filenamePrefix: 'Admin_Settings',
            canAccess: () => typeof canAccessAdminPage === 'function' ? canAccessAdminPage('admin-settings') : false,
            getData: getReportAdminSettings,
            getColumns: () => [
                col('setting', 'Setting', r => r.setting),
                col('value', 'Value', r => r.value)
            ],
            renderKpi: (rows) => renderGenericKpiSummary(rows, [{ label: 'Settings', value: rows.length }])
        },
        'admin-themes': {
            label: 'Themes',
            filenamePrefix: 'Admin_Themes',
            canAccess: () => typeof canAccessAdminPage === 'function' ? canAccessAdminPage('admin-themes') : false,
            getData: getReportAdminThemes,
            getColumns: () => [
                col('name', 'Theme', r => r.name),
                col('themeId', 'ID', r => r.themeId),
                col('primary', 'Primary Colour', r => r.primary),
                col('active', 'Active', r => r.active)
            ],
            renderKpi: (rows) => renderGenericKpiSummary(rows, [{ label: 'Themes', value: rows.length }])
        },
        'admin-kpi-settings': {
            label: 'KPI Settings',
            filenamePrefix: 'Admin_KPI_Settings',
            canAccess: () => typeof canAccessAdminPage === 'function' ? canAccessAdminPage('admin-kpi-settings') : false,
            getData: getReportAdminKpiSettings,
            getColumns: () => [
                col('process', 'Process', r => r.process),
                col('page', 'Page', r => r.page),
                col('target', 'Target', r => r.target),
                col('unit', 'Unit', r => r.unit),
                col('notes', 'Notes', r => r.notes)
            ],
            renderKpi: (rows) => renderGenericKpiSummary(rows, [{ label: 'KPI Rules', value: rows.length }])
        },
        'admin-audit-logs': {
            label: 'Audit Logs',
            filenamePrefix: 'Admin_Audit_Logs',
            canAccess: () => typeof canAccessAdminPage === 'function' ? canAccessAdminPage('admin-audit-logs') : false,
            getData: getReportAdminAuditLogs,
            getColumns: () => [
                col('timestamp', 'Timestamp', r => r.timestamp),
                col('user', 'User', r => r.user),
                col('action', 'Action', r => r.action),
                col('module', 'Module', r => r.module),
                col('details', 'Details', r => r.details)
            ],
            renderKpi: (rows) => renderGenericKpiSummary(rows, [{ label: 'Log Entries', value: rows.length }])
        },
        'admin-area-statuses': {
            label: 'Area Status Lists',
            filenamePrefix: 'Admin_Area_Statuses',
            canAccess: () => typeof canAccessAdminPage === 'function' ? canAccessAdminPage('admin-area-statuses') : false,
            getData: getReportAdminAreaStatuses,
            getColumns: () => [
                col('area', 'Area', r => r.area),
                col('nbStatuses', 'NB Statuses', r => r.nbStatuses),
                col('sbStatuses', 'SB Statuses', r => r.sbStatuses),
                col('borderNbStatuses', 'Border NB', r => r.borderNbStatuses),
                col('borderSbStatuses', 'Border SB', r => r.borderSbStatuses)
            ],
            renderKpi: (rows) => renderGenericKpiSummary(rows, [{ label: 'Areas', value: rows.length }])
        },
        'admin-area-assignments': {
            label: 'Area Assignments',
            filenamePrefix: 'Admin_Area_Assignments',
            canAccess: () => typeof canAccessAdminPage === 'function' ? canAccessAdminPage('admin-area-assignments') : false,
            getData: getReportAdminAreaAssignments,
            getColumns: () => [
                col('username', 'User', r => r.username),
                col('role', 'Role', r => r.role),
                col('primaryArea', 'Primary Area', r => r.primaryArea),
                col('assignedAreas', 'Assigned Areas', r => r.assignedAreas),
                col('status', 'Status', r => r.status)
            ],
            renderKpi: (rows) => renderGenericKpiSummary(rows, [{ label: 'Users', value: rows.length }])
        },
        'admin-module-permissions': {
            label: 'Module Permissions',
            filenamePrefix: 'Admin_Module_Permissions',
            canAccess: () => typeof canAccessAdminPage === 'function' ? canAccessAdminPage('admin-module-permissions') : false,
            getData: getReportAdminModulePermissions,
            getColumns: () => [
                col('username', 'User', r => r.username),
                col('module', 'Module', r => r.module),
                col('areas', 'Areas', r => r.areas),
                col('access', 'Access', r => r.access)
            ],
            renderKpi: (rows) => renderGenericKpiSummary(rows, [{ label: 'Permission Rows', value: rows.length }])
        },
        'admin-fleet-settings': {
            label: 'Fleet — Same Truck for SB',
            filenamePrefix: 'Admin_Fleet_Settings',
            canAccess: () => typeof canAccessAdminPage === 'function' ? canAccessAdminPage('admin-fleet-settings') : false,
            getData: getReportAdminFleetSettings,
            getColumns: () => [
                col('fleetOwner', 'Fleet Owner', r => r.fleetOwner),
                col('nbTrips', 'NB Trips', r => r.nbTrips),
                col('sbTrips', 'SB Trips', r => r.sbTrips),
                col('note', 'Note', r => r.note)
            ],
            renderKpi: (rows) => renderGenericKpiSummary(rows, [{ label: 'Fleet Owners', value: rows.length }])
        },
        'admin-upload-templates': {
            label: 'Upload Templates',
            filenamePrefix: 'Admin_Upload_Templates',
            canAccess: () => typeof canAccessAdminPage === 'function' ? canAccessAdminPage('admin-upload-templates') : false,
            getData: getReportAdminUploadTemplates,
            getColumns: () => [
                col('templateKey', 'Key', r => r.templateKey),
                col('label', 'Label', r => r.label),
                col('columnCount', 'Columns', r => r.columnCount),
                col('columns', 'Column List', r => r.columns)
            ],
            renderKpi: (rows) => renderGenericKpiSummary(rows, [{ label: 'Templates', value: rows.length }])
        }
    };

    function renderTripKpiSummary(rows, title) {
        const nb = rows.filter(r => r.direction === 'NB').length;
        const sb = rows.filter(r => r.direction === 'SB').length;
        return renderGenericKpiSummary(rows, [
            { label: `${title} — Total`, value: rows.length },
            { label: 'NB', value: nb },
            { label: 'SB', value: sb },
            { label: 'On Track', value: rows.filter(r => r.kpi === 'green').length, color: 'green' },
            { label: 'Priority', value: rows.filter(r => r.kpi === 'orange').length, color: 'orange' },
            { label: 'Overdue', value: rows.filter(r => r.kpi === 'red').length, color: 'red' }
        ]);
    }

    function renderGenericKpiSummary(rows, cards) {
        return `
            <div class="report-kpi-section">
                <h2>📊 Report Summary</h2>
                <div class="dashboard-grid">
                    ${cards.map(c => `
                        <div class="stat-card">
                            <div class="stat-label">${c.label}</div>
                            <div class="stat-value"${c.color ? ` style="color:var(--${c.color});"` : ''}>${c.value}</div>
                        </div>`).join('')}
                </div>
            </div>`;
    }

    function getReportDefinition(moduleId) {
        return REPORT_MODULE_REGISTRY[moduleId] || REPORT_MODULE_REGISTRY.dashboard;
    }

    function resolveReportModuleId(id) {
        if (id === COMBINED_REPORT_ID) return COMBINED_REPORT_ID;
        return LEGACY_REPORT_MAP[id] || id;
    }

    function getDefaultColumnIds(moduleId) {
        const def = getReportDefinition(moduleId);
        return def.getColumns().map(c => c.id);
    }

    function loadSavedLayouts() {
        try {
            const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            return {};
        }
    }

    function saveSavedLayouts(layouts) {
        try {
            localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layouts));
        } catch (e) { /* ignore */ }
    }

    function getReportRows(moduleId) {
        const def = getReportDefinition(moduleId);
        if (!def.canAccess()) return [];
        let rows = def.getData() || [];
        if (reportBuilderState.kpiFilter && reportBuilderState.kpiFilter !== 'all' && def.kpiTypes) {
            rows = rows.filter(r => r.kpi === reportBuilderState.kpiFilter);
        }
        const term = (reportBuilderState.searchTerm || '').trim().toLowerCase();
        if (term) {
            rows = rows.filter(r => JSON.stringify(r).toLowerCase().includes(term));
        }
        return rows;
    }

    function getActiveColumns(moduleId) {
        const def = getReportDefinition(moduleId);
        const allCols = def.getColumns();
        const selected = reportBuilderState.selectedColumnIds.length
            ? reportBuilderState.selectedColumnIds
            : allCols.map(c => c.id);
        return allCols.filter(c => selected.includes(c.id));
    }

    function initReportBuilderState(moduleId, preset) {
        const layouts = loadSavedLayouts();
        const saved = layouts[moduleId];
        reportBuilderState = {
            selectedColumnIds: saved?.columns || getDefaultColumnIds(moduleId),
            kpiFilter: preset === 'kpi-alerts-report' ? 'orange' : (saved?.kpiFilter || 'all'),
            searchTerm: '',
            layoutName: saved?.name || ''
        };
        if (preset === 'kpi-alerts-report') {
            reportBuilderState.kpiFilter = 'all';
            reportBuilderState._alertOnly = true;
        }
    }

    function applyAlertOnlyFilter(rows, moduleId) {
        if (!reportBuilderState._alertOnly) return rows;
        if (['dashboard', 'nb-operations', 'sb-operations', 'area-browser', 'position-live'].includes(moduleId)) {
            return rows.filter(r => r.kpi === 'orange' || r.kpi === 'red');
        }
        return rows;
    }

    // ─── Cross-menu (multi-source) report builder ───────────────────────────

    function getCatalogItem(moduleId) {
        return REPORT_CATALOG.flatMap(s => s.items).find(i => i.id === moduleId);
    }

    function getAccessibleModuleIds() {
        return REPORT_CATALOG.flatMap(s => s.items)
            .map(i => i.id)
            .filter(id => {
                const def = REPORT_MODULE_REGISTRY[id];
                return def && def.canAccess();
            });
    }

    function getTripKeyFromRow(moduleId, row) {
        if (!row) return null;
        if (moduleId === 'border-clearance' || moduleId === 'pod-management' || moduleId === 'runner-fees') {
            return row.trip || null;
        }
        if (moduleId === 'driver-registry') return row.tripNumber || null;
        return row.tripNumber || row.trip || null;
    }

    function getModuleFieldCatalog(moduleId) {
        const def = REPORT_MODULE_REGISTRY[moduleId];
        if (!def) return [];
        const label = def.label || moduleId;
        return def.getColumns().map(c => ({
            key: `${moduleId}:${c.id}`,
            moduleId,
            colId: c.id,
            label: `${label} — ${c.label}`,
            shortLabel: c.label,
            getValue: c.getValue
        }));
    }

    function getDefaultCombinedFieldKeys(moduleIds) {
        const defaults = {
            'nb-operations': ['tripNumber', 'truck', 'driver', 'status', 'kpi'],
            'sb-operations': ['tripNumber', 'truck', 'driver', 'status', 'kpi'],
            'border-clearance': ['trip', 'border', 'process', 'status', 'kpi'],
            'pod-management': ['trip', 'collected', 'scanned', 'kpi'],
            'driver-registry': ['driverName', 'whatsapp', 'drcNumber'],
            'dashboard': ['tripNumber', 'direction', 'truck', 'kpi']
        };
        const keys = [];
        moduleIds.forEach(mid => {
            const cols = defaults[mid] || getModuleFieldCatalog(mid).slice(0, 3).map(f => f.colId);
            cols.forEach(colId => keys.push(`${mid}:${colId}`));
        });
        return keys;
    }

    function initCombinedReportState(saved) {
        const accessible = getAccessibleModuleIds();
        combinedReportState.selectedModules = (saved?.selectedModules || combinedReportState.selectedModules)
            .filter(id => accessible.includes(id));
        if (!combinedReportState.selectedModules.length) {
            combinedReportState.selectedModules = accessible.slice(0, Math.min(3, accessible.length));
        }
        combinedReportState.selectedFieldKeys = saved?.selectedFieldKeys?.length
            ? saved.selectedFieldKeys.filter(k => combinedReportState.selectedModules.includes(k.split(':')[0]))
            : getDefaultCombinedFieldKeys(combinedReportState.selectedModules);
        combinedReportState.filters = { ...combinedReportState.filters, ...(saved?.filters || {}) };
        combinedReportState.layoutName = saved?.layoutName || '';
    }

    function loadCombinedLayouts() {
        try {
            const raw = localStorage.getItem(COMBINED_LAYOUT_STORAGE_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            return {};
        }
    }

    function saveCombinedLayouts(layouts) {
        try {
            localStorage.setItem(COMBINED_LAYOUT_STORAGE_KEY, JSON.stringify(layouts));
        } catch (e) { /* ignore */ }
    }

    function buildModuleLookups(moduleIds) {
        const lookups = {};
        moduleIds.forEach(mid => {
            const def = REPORT_MODULE_REGISTRY[mid];
            if (!def?.canAccess()) return;
            lookups[mid] = new Map();
            (def.getData() || []).forEach(row => {
                const key = getTripKeyFromRow(mid, row);
                if (key) lookups[mid].set(key, row);
            });
        });
        return lookups;
    }

    function getPrimaryTripRow(merged) {
        for (const mid of ['nb-operations', 'sb-operations', 'dashboard', 'area-browser', 'position-live', 'border-clearance', 'pod-management', 'driver-registry', 'runner-fees']) {
            if (merged[mid]) return merged[mid];
        }
        return null;
    }

    function buildCombinedTripRows() {
        const tripModules = combinedReportState.selectedModules.filter(id => TRIP_JOIN_MODULES.has(id));
        if (!tripModules.length) return { tripRows: [], standaloneSections: buildStandaloneSections() };

        const lookups = buildModuleLookups(tripModules);
        const allKeys = new Set();
        tripModules.forEach(mid => lookups[mid]?.forEach((_, k) => allKeys.add(k)));

        let tripRows = [...allKeys].map(tripKey => {
            const merged = { _tripKey: tripKey };
            tripModules.forEach(mid => { merged[mid] = lookups[mid]?.get(tripKey) || null; });
            return merged;
        });

        tripRows = applyCombinedFilters(tripRows);
        return { tripRows, standaloneSections: buildStandaloneSections() };
    }

    function applyCombinedFilters(mergedRows) {
        const f = combinedReportState.filters;
        return mergedRows.filter(merged => {
            const trip = getPrimaryTripRow(merged);
            if (f.direction !== 'all' && trip?.direction && trip.direction !== f.direction) return false;
            if (f.kpi !== 'all' && trip?.kpi && trip.kpi !== f.kpi) return false;
            if (f.area !== 'all' && trip?.area && trip.area !== f.area) return false;
            if (f.border !== 'all') {
                const borders = [trip?.entryBorder, trip?.exitBorder, merged['border-clearance']?.border].filter(Boolean);
                if (borders.length && !borders.includes(f.border)) return false;
            }
            if (f.podCollected === 'yes' && merged['pod-management'] && !merged['pod-management'].collected) return false;
            if (f.podCollected === 'no' && merged['pod-management'] && merged['pod-management'].collected) return false;
            if (f.podCollected === 'overdue' && merged['pod-management'] && !merged['pod-management'].overdue) return false;
            if (f.search) {
                const term = f.search.toLowerCase();
                const blob = JSON.stringify(merged).toLowerCase();
                if (!blob.includes(term)) return false;
            }
            return true;
        });
    }

    function buildStandaloneSections() {
        const standaloneIds = combinedReportState.selectedModules.filter(id => !TRIP_JOIN_MODULES.has(id));
        return standaloneIds.map(moduleId => {
            const def = REPORT_MODULE_REGISTRY[moduleId];
            if (!def?.canAccess()) return null;
            let rows = def.getData() || [];
            const f = combinedReportState.filters;
            if (f.search) {
                const term = f.search.toLowerCase();
                rows = rows.filter(r => JSON.stringify(r).toLowerCase().includes(term));
            }
            const fieldKeys = combinedReportState.selectedFieldKeys.filter(k => k.startsWith(moduleId + ':'));
            const fields = fieldKeys.map(k => getModuleFieldCatalog(moduleId).find(c => c.key === k)).filter(Boolean);
            const item = getCatalogItem(moduleId);
            return { moduleId, title: item?.title || def.label, icon: item?.icon || '📄', rows, fields };
        }).filter(Boolean);
    }

    function getActiveCombinedFields() {
        return combinedReportState.selectedFieldKeys
            .map(k => {
                const moduleId = k.split(':')[0];
                return getModuleFieldCatalog(moduleId).find(f => f.key === k);
            })
            .filter(Boolean);
    }

    function getAreaFilterOptions() {
        const areas = new Set();
        Object.values(tripsDB).forEach(t => { if (t.area) areas.add(t.area); });
        return [...areas].sort();
    }

    function getBorderFilterOptions() {
        return ['Kasumbalesa', 'Sakania', 'Mokambo'];
    }

    function renderCombinedSourcePicker() {
        return REPORT_CATALOG.map(section => {
            const items = section.items.filter(i => {
                const def = REPORT_MODULE_REGISTRY[i.id];
                return def && def.canAccess();
            });
            if (!items.length) return '';
            return `
                <div class="combined-source-group">
                    <div class="combined-source-group-title">${section.section}</div>
                    <div class="combined-source-chips">
                        ${items.map(i => `
                            <label class="combined-source-chip${TRIP_JOIN_MODULES.has(i.id) ? ' trip-join' : ' standalone'}">
                                <input type="checkbox" value="${i.id}"
                                    ${combinedReportState.selectedModules.includes(i.id) ? 'checked' : ''}
                                    onchange="onCombinedModuleToggle('${i.id}', this.checked)">
                                ${i.icon} ${i.title}
                                ${TRIP_JOIN_MODULES.has(i.id) ? '<span class="combined-join-hint">links on Trip #</span>' : ''}
                            </label>`).join('')}
                    </div>
                </div>`;
        }).join('');
    }

    function renderCombinedFieldPicker() {
        const modules = combinedReportState.selectedModules;
        if (!modules.length) {
            return '<p class="report-empty">Select at least one menu data source above.</p>';
        }
        return modules.map(moduleId => {
            const item = getCatalogItem(moduleId);
            const fields = getModuleFieldCatalog(moduleId);
            const selectedInModule = combinedReportState.selectedFieldKeys.filter(k => k.startsWith(moduleId + ':'));
            return `
                <div class="combined-field-module">
                    <div class="combined-field-module-header">
                        <strong>${item?.icon || ''} ${item?.title || moduleId}</strong>
                        <span class="text-muted text-sm">${selectedInModule.length} / ${fields.length} fields</span>
                        <button type="button" class="btn btn-outline btn-sm" onclick="toggleCombinedModuleFields('${moduleId}', true)">All</button>
                        <button type="button" class="btn btn-outline btn-sm" onclick="toggleCombinedModuleFields('${moduleId}', false)">None</button>
                    </div>
                    <div class="report-column-chips">
                        ${fields.map(f => `
                            <label class="report-column-chip">
                                <input type="checkbox" value="${f.key}"
                                    ${combinedReportState.selectedFieldKeys.includes(f.key) ? 'checked' : ''}
                                    onchange="onCombinedFieldToggle('${f.key}', this.checked)">
                                ${f.shortLabel}
                            </label>`).join('')}
                    </div>
                </div>`;
        }).join('');
    }

    function renderCombinedFilterBar() {
        const f = combinedReportState.filters;
        const areas = getAreaFilterOptions();
        const hasPod = combinedReportState.selectedModules.includes('pod-management');
        const layouts = loadCombinedLayouts();
        return `
            <div class="report-builder-row">
                <div class="filter-group">
                    <label>Direction</label>
                    <select class="form-control" onchange="onCombinedFilterChange('direction', this.value)">
                        <option value="all"${f.direction === 'all' ? ' selected' : ''}>All</option>
                        <option value="NB"${f.direction === 'NB' ? ' selected' : ''}>NB</option>
                        <option value="SB"${f.direction === 'SB' ? ' selected' : ''}>SB</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>KPI</label>
                    <select class="form-control" onchange="onCombinedFilterChange('kpi', this.value)">
                        <option value="all"${f.kpi === 'all' ? ' selected' : ''}>All KPIs</option>
                        <option value="green"${f.kpi === 'green' ? ' selected' : ''}>🟢 On Track</option>
                        <option value="orange"${f.kpi === 'orange' ? ' selected' : ''}>🟠 Priority</option>
                        <option value="red"${f.kpi === 'red' ? ' selected' : ''}>🔴 Overdue</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Area</label>
                    <select class="form-control" onchange="onCombinedFilterChange('area', this.value)">
                        <option value="all"${f.area === 'all' ? ' selected' : ''}>All areas</option>
                        ${areas.map(a => `<option value="${a}"${f.area === a ? ' selected' : ''}>${a}</option>`).join('')}
                    </select>
                </div>
                <div class="filter-group">
                    <label>Border</label>
                    <select class="form-control" onchange="onCombinedFilterChange('border', this.value)">
                        <option value="all"${f.border === 'all' ? ' selected' : ''}>All borders</option>
                        ${getBorderFilterOptions().map(b => `<option value="${b}"${f.border === b ? ' selected' : ''}>${b}</option>`).join('')}
                    </select>
                </div>
                ${hasPod ? `
                <div class="filter-group">
                    <label>POD status</label>
                    <select class="form-control" onchange="onCombinedFilterChange('podCollected', this.value)">
                        <option value="all"${f.podCollected === 'all' ? ' selected' : ''}>All POD</option>
                        <option value="no"${f.podCollected === 'no' ? ' selected' : ''}>Pending</option>
                        <option value="yes"${f.podCollected === 'yes' ? ' selected' : ''}>Collected</option>
                        <option value="overdue"${f.podCollected === 'overdue' ? ' selected' : ''}>Overdue</option>
                    </select>
                </div>` : ''}
                <div class="filter-group" style="flex:1;min-width:180px;">
                    <label>Search all fields</label>
                    <input type="text" class="form-control" placeholder="Trip, truck, driver…" value="${f.search || ''}"
                        onkeyup="onCombinedFilterChange('search', this.value)">
                </div>
                <div class="filter-group">
                    <label>Saved layout</label>
                    <select class="form-control" onchange="onCombinedLayoutSelect(this.value)">
                        <option value="">— New / unsaved —</option>
                        ${Object.keys(layouts).map(n => `<option value="${n}"${combinedReportState.layoutName === n ? ' selected' : ''}>${n}</option>`).join('')}
                    </select>
                </div>
            </div>`;
    }

    function renderCombinedReportBuilder() {
        return `
            <div class="report-builder-panel combined-report-panel">
                <h3 class="combined-builder-title">🔧 Cross-Menu Report Builder</h3>
                <p class="combined-builder-desc">Choose data from <strong>multiple menus</strong>, pick which fields appear in one report, and apply shared filters.</p>

                <div class="combined-builder-step">
                    <h4>1. Select menu data sources</h4>
                    ${renderCombinedSourcePicker()}
                </div>

                <div class="combined-builder-step">
                    <h4>2. Choose fields from each menu</h4>
                    <div class="combined-field-picker">${renderCombinedFieldPicker()}</div>
                </div>

                <div class="combined-builder-step">
                    <h4>3. Filter options</h4>
                    ${renderCombinedFilterBar()}
                </div>

                <div class="report-builder-actions">
                    <input type="text" class="form-control" id="combinedLayoutName" placeholder="Layout name to save…"
                        value="${combinedReportState.layoutName || ''}" style="max-width:220px;">
                    <button class="btn btn-outline btn-sm" onclick="saveCombinedReportLayout()">💾 Save Layout</button>
                    <button class="btn btn-primary btn-sm" onclick="runCombinedReport()">▶ Generate Report</button>
                    <button class="btn btn-outline btn-sm" onclick="exportCombinedReport()">📥 Export CSV</button>
                </div>
            </div>`;
    }

    function renderCombinedTripTable(tripRows, fields) {
        if (!fields.length) {
            return '<p class="report-empty">Select at least one field from the menus above.</p>';
        }
        if (!tripRows.length) {
            return '<p class="report-empty">No trip-linked records match your filters. Try adjusting filters or adding more menu sources.</p>';
        }
        return `
            <div class="table-container">
                <div class="table-header">
                    <h3>Combined Trip Report — ${tripRows.length} row${tripRows.length !== 1 ? 's' : ''}</h3>
                    <span class="text-muted text-sm">Trip-linked menus merged on Trip #</span>
                </div>
                <div style="overflow-x:auto;">
                    <table class="data-table report-table">
                        <thead><tr>
                            <th>Trip #</th>
                            ${fields.map(f => `<th>${f.label}</th>`).join('')}
                        </tr></thead>
                        <tbody>
                            ${tripRows.map(merged => `
                                <tr>
                                    <td><strong>${merged._tripKey}</strong></td>
                                    ${fields.map(f => {
                                        const row = merged[f.moduleId];
                                        const val = row ? f.getValue(row) : '—';
                                        return `<td>${val ?? '—'}</td>`;
                                    }).join('')}
                                </tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
    }

    function renderCombinedStandaloneSection(section) {
        if (!section.fields.length) return '';
        return `
            <div class="table-container combined-standalone-section">
                <div class="table-header">
                    <h3>${section.icon} ${section.title} — ${section.rows.length} record${section.rows.length !== 1 ? 's' : ''}</h3>
                    <span class="text-muted text-sm">Standalone section (not trip-linked)</span>
                </div>
                <div style="overflow-x:auto;">
                    <table class="data-table report-table">
                        <thead><tr>${section.fields.map(f => `<th>${f.shortLabel}</th>`).join('')}</tr></thead>
                        <tbody>
                            ${section.rows.length ? section.rows.map(r => `
                                <tr>${section.fields.map(f => `<td>${f.getValue(r) ?? '—'}</td>`).join('')}</tr>
                            `).join('') : '<tr><td colspan="99" class="report-empty">No records</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>`;
    }

    function renderCombinedReportResults() {
        const tripFieldKeys = combinedReportState.selectedFieldKeys.filter(k => {
            const mid = k.split(':')[0];
            return TRIP_JOIN_MODULES.has(mid);
        });
        const fields = tripFieldKeys.map(k => getModuleFieldCatalog(k.split(':')[0]).find(f => f.key === k)).filter(Boolean);
        const { tripRows, standaloneSections } = buildCombinedTripRows();

        const tripModules = combinedReportState.selectedModules.filter(id => TRIP_JOIN_MODULES.has(id));
        let html = '';
        if (tripModules.length) {
            html += renderCombinedTripTable(tripRows, fields);
        }
        standaloneSections.forEach(sec => { html += renderCombinedStandaloneSection(sec); });
        if (!tripModules.length && !standaloneSections.length) {
            html = '<p class="report-empty">Select menus and fields, then click Generate Report.</p>';
        }
        return html;
    }

    function renderCombinedReportDetail(container) {
        container.innerHTML = `
            <div class="page-header admin-page-header">
                <div>
                    <h1>🔧 Cross-Menu Custom Report</h1>
                    <p class="page-subtitle">Combine fields from different menus into one report with shared filters.</p>
                </div>
                <button class="btn btn-outline" onclick="navigateTo('reports')">← All Reports</button>
            </div>
            ${typeof getAreaFilterBanner === 'function' ? getAreaFilterBanner() : ''}
            ${renderCombinedReportBuilder()}
            <div id="combinedReportResults">${renderCombinedReportResults()}</div>`;
    }

    function openCombinedReportBuilder(savedLayoutName) {
        currentReportModuleId = COMBINED_REPORT_ID;
        if (savedLayoutName) {
            const layouts = loadCombinedLayouts();
            initCombinedReportState(layouts[savedLayoutName] || null);
            combinedReportState.layoutName = savedLayoutName;
        } else {
            initCombinedReportState(null);
        }
        navigateTo('report-detail');
    }

    function runCombinedReport() {
        const wrap = document.getElementById('combinedReportResults');
        if (wrap) wrap.innerHTML = renderCombinedReportResults();
        else refreshCustomReport();
        showToast('Report generated', 'success');
    }

    function onCombinedModuleToggle(moduleId, checked) {
        if (checked) {
            if (!combinedReportState.selectedModules.includes(moduleId)) {
                combinedReportState.selectedModules.push(moduleId);
                getDefaultCombinedFieldKeys([moduleId]).forEach(k => {
                    if (!combinedReportState.selectedFieldKeys.includes(k)) {
                        combinedReportState.selectedFieldKeys.push(k);
                    }
                });
            }
        } else {
            combinedReportState.selectedModules = combinedReportState.selectedModules.filter(id => id !== moduleId);
            combinedReportState.selectedFieldKeys = combinedReportState.selectedFieldKeys.filter(k => !k.startsWith(moduleId + ':'));
        }
        refreshCombinedBuilderUi();
    }

    function onCombinedFieldToggle(fieldKey, checked) {
        if (checked && !combinedReportState.selectedFieldKeys.includes(fieldKey)) {
            combinedReportState.selectedFieldKeys.push(fieldKey);
            const moduleId = fieldKey.split(':')[0];
            if (!combinedReportState.selectedModules.includes(moduleId)) {
                combinedReportState.selectedModules.push(moduleId);
            }
        } else if (!checked) {
            combinedReportState.selectedFieldKeys = combinedReportState.selectedFieldKeys.filter(k => k !== fieldKey);
        }
        const wrap = document.getElementById('combinedReportResults');
        if (wrap) wrap.innerHTML = renderCombinedReportResults();
    }

    function toggleCombinedModuleFields(moduleId, selectAll) {
        const fields = getModuleFieldCatalog(moduleId);
        combinedReportState.selectedFieldKeys = combinedReportState.selectedFieldKeys.filter(k => !k.startsWith(moduleId + ':'));
        if (selectAll) {
            fields.forEach(f => combinedReportState.selectedFieldKeys.push(f.key));
            if (!combinedReportState.selectedModules.includes(moduleId)) {
                combinedReportState.selectedModules.push(moduleId);
            }
        }
        refreshCombinedBuilderUi();
    }

    function onCombinedFilterChange(key, value) {
        combinedReportState.filters[key] = value;
        const wrap = document.getElementById('combinedReportResults');
        if (wrap) wrap.innerHTML = renderCombinedReportResults();
    }

    function refreshCombinedBuilderUi() {
        const panel = document.querySelector('.combined-report-panel');
        if (!panel) {
            refreshCustomReport();
            return;
        }
        const temp = document.createElement('div');
        temp.innerHTML = renderCombinedReportBuilder();
        panel.replaceWith(temp.firstElementChild);
        const wrap = document.getElementById('combinedReportResults');
        if (wrap) wrap.innerHTML = renderCombinedReportResults();
    }

    function saveCombinedReportLayout() {
        const name = document.getElementById('combinedLayoutName')?.value?.trim();
        if (!name) {
            showToast('Enter a layout name to save', 'warning');
            return;
        }
        const layouts = loadCombinedLayouts();
        layouts[name] = {
            selectedModules: [...combinedReportState.selectedModules],
            selectedFieldKeys: [...combinedReportState.selectedFieldKeys],
            filters: { ...combinedReportState.filters },
            layoutName: name
        };
        saveCombinedLayouts(layouts);
        combinedReportState.layoutName = name;
        showToast(`Cross-menu layout "${name}" saved`, 'success');
        refreshCombinedBuilderUi();
    }

    function onCombinedLayoutSelect(name) {
        if (!name) {
            initCombinedReportState(null);
            refreshCustomReport();
            return;
        }
        const layouts = loadCombinedLayouts();
        initCombinedReportState(layouts[name]);
        combinedReportState.layoutName = name;
        refreshCustomReport();
    }

    function exportCombinedReport() {
        const { tripRows, standaloneSections } = buildCombinedTripRows();
        const tripFields = combinedReportState.selectedFieldKeys
            .filter(k => TRIP_JOIN_MODULES.has(k.split(':')[0]))
            .map(k => getModuleFieldCatalog(k.split(':')[0]).find(f => f.key === k))
            .filter(Boolean);

        const sheets = [];
        if (tripFields.length && tripRows.length) {
            sheets.push({
                name: 'Combined_Trips',
                headers: ['Trip #', ...tripFields.map(f => f.label)],
                rows: tripRows.map(m => [m._tripKey, ...tripFields.map(f => {
                    const row = m[f.moduleId];
                    return row ? f.getValue(row) : '—';
                })])
            });
        }
        standaloneSections.forEach(sec => {
            if (!sec.fields.length || !sec.rows.length) return;
            sheets.push({
                name: sec.title.replace(/[^a-z0-9]/gi, '_').slice(0, 28),
                headers: sec.fields.map(f => f.shortLabel),
                rows: sec.rows.map(r => sec.fields.map(f => f.getValue(r)))
            });
        });

        if (!sheets.length) {
            showToast('No data to export — select fields and generate report first', 'warning');
            return;
        }

        const primary = sheets[0];
        const filename = `Cross_Menu_Report_${typeof formatExportDate === 'function' ? formatExportDate() : Date.now()}.csv`;
        if (typeof downloadExcelCsv === 'function') {
            downloadExcelCsv(filename, primary.headers, primary.rows);
        }
        if (sheets.length > 1) {
            showToast(`Exported trip table. ${sheets.length - 1} standalone section(s) also ready — export again after switching if needed.`, 'success');
        } else {
            showToast(`Exported ${primary.rows.length} row${primary.rows.length !== 1 ? 's' : ''}`, 'success');
        }
    }

    function isCombinedReportMode() {
        return resolveReportModuleId(currentReportModuleId) === COMBINED_REPORT_ID;
    }

    function renderReportBuilderToolbar(moduleId) {
        const def = getReportDefinition(moduleId);
        const allCols = def.getColumns();
        const layouts = loadSavedLayouts();
        const savedNames = Object.keys(layouts);
        return `
            <div class="report-builder-panel">
                <div class="report-builder-row">
                    <div class="filter-group" style="flex:1;">
                        <label>Search report data</label>
                        <input type="text" class="form-control" id="reportBuilderSearch" placeholder="Filter rows…" value="${reportBuilderState.searchTerm || ''}" onkeyup="onReportBuilderSearch(this.value)">
                    </div>
                    ${def.kpiTypes ? `
                    <div class="filter-group">
                        <label>KPI filter</label>
                        <select class="form-control" id="reportKpiFilter" onchange="onReportKpiFilterChange(this.value)">
                            <option value="all"${reportBuilderState.kpiFilter === 'all' ? ' selected' : ''}>All KPIs</option>
                            <option value="green"${reportBuilderState.kpiFilter === 'green' ? ' selected' : ''}>🟢 On Track</option>
                            <option value="orange"${reportBuilderState.kpiFilter === 'orange' ? ' selected' : ''}>🟠 Priority</option>
                            <option value="red"${reportBuilderState.kpiFilter === 'red' ? ' selected' : ''}>🔴 Overdue</option>
                        </select>
                    </div>` : ''}
                    <div class="filter-group">
                        <label>Saved layout</label>
                        <select class="form-control" id="reportLayoutSelect" onchange="onReportLayoutSelect(this.value)">
                            <option value="">— Default columns —</option>
                            ${savedNames.map(n => `<option value="${n}"${layouts[n]?.moduleId === moduleId && reportBuilderState.layoutName === n ? ' selected' : ''}>${n}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="report-builder-row">
                    <div class="report-column-picker">
                        <label>Columns <button type="button" class="btn btn-outline btn-sm" onclick="toggleAllReportColumns(true)">All</button> <button type="button" class="btn btn-outline btn-sm" onclick="toggleAllReportColumns(false)">None</button></label>
                        <div class="report-column-chips">
                            ${allCols.map(c => `
                                <label class="report-column-chip">
                                    <input type="checkbox" value="${c.id}" ${reportBuilderState.selectedColumnIds.includes(c.id) ? 'checked' : ''} onchange="onReportColumnToggle('${c.id}', this.checked)">
                                    ${c.label}
                                </label>`).join('')}
                        </div>
                    </div>
                </div>
                <div class="report-builder-actions">
                    <input type="text" class="form-control" id="reportLayoutName" placeholder="Layout name to save…" value="${reportBuilderState.layoutName || ''}" style="max-width:220px;">
                    <button class="btn btn-outline btn-sm" onclick="saveCustomReportLayout()">💾 Save Layout</button>
                    <button class="btn btn-primary btn-sm" onclick="exportCustomReport()">📥 Export CSV</button>
                    <button class="btn btn-outline btn-sm" onclick="refreshCustomReport()">🔄 Refresh</button>
                </div>
            </div>`;
    }

    function renderReportDataTable(moduleId, rows) {
        const cols = getActiveColumns(moduleId);
        if (!rows.length) {
            return '<p class="report-empty">No records match this report for your filters and permissions.</p>';
        }
        return `
            <div class="table-container">
                <div class="table-header">
                    <h3>Report Data — ${rows.length} record${rows.length !== 1 ? 's' : ''}</h3>
                </div>
                <div style="overflow-x:auto;">
                    <table class="data-table report-table">
                        <thead><tr>${cols.map(c => `<th>${c.label}</th>`).join('')}</tr></thead>
                        <tbody>
                            ${rows.map(r => `<tr>${cols.map(c => `<td>${c.getValue(r) ?? '—'}</td>`).join('')}</tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
    }

    function renderModuleReportButton(moduleId) {
        const def = REPORT_MODULE_REGISTRY[moduleId];
        if (!def || !def.canAccess()) return '';
        return `<button type="button" class="btn btn-outline btn-sm" onclick="openModuleReport('${moduleId}')" title="Open customizable report">📈 Report</button>`;
    }

    function renderReports(container) {
        const sections = REPORT_CATALOG.map(section => {
            const items = section.items.filter(item => {
                const def = REPORT_MODULE_REGISTRY[item.id];
                return def && def.canAccess();
            });
            if (!items.length) return '';
            return `
                <div class="report-section">
                    <h2 class="report-section-title">${section.section}</h2>
                    <div class="report-grid">
                        ${items.map(r => `
                            <div class="report-card" onclick="openModuleReport('${r.id}')">
                                <div class="report-card-icon">${r.icon}</div>
                                <h3>${r.title}</h3>
                                <p>${r.desc}</p>
                                <span class="card-action">Customize & View →</span>
                            </div>`).join('')}
                    </div>
                </div>`;
        }).join('');

        container.innerHTML = `
            <div class="page-header">
                <h1>📈 Reports</h1>
                <p class="page-subtitle">Single-module reports or combine data from <strong>multiple menus</strong> with shared filters.</p>
            </div>
            ${typeof getAreaFilterBanner === 'function' ? getAreaFilterBanner() : ''}
            <div class="report-grid" style="margin-bottom:28px;">
                <div class="report-card report-card-featured" onclick="openCombinedReportBuilder()">
                    <div class="report-card-icon">🔧</div>
                    <h3>Cross-Menu Custom Report</h3>
                    <p>Pick data sources from different menus (NB Ops + Border + POD + Drivers…), choose which fields to include, and apply filters — all in one report.</p>
                    <span class="card-action">Build Combined Report →</span>
                </div>
            </div>
            ${sections || '<p style="padding:24px;color:var(--text-secondary);">No reports available for your role.</p>'}`;
    }

    function renderReportDetail(container) {
        if (isCombinedReportMode()) {
            renderCombinedReportDetail(container);
            return;
        }
        const moduleId = resolveReportModuleId(currentReportModuleId);
        const def = getReportDefinition(moduleId);
        if (!def.canAccess()) {
            container.innerHTML = `<div class="access-denied"><h2>Access Denied</h2><p>You do not have permission to view this report.</p><button class="btn btn-outline" onclick="navigateTo('reports')">← All Reports</button></div>`;
            return;
        }
        const catalogItem = REPORT_CATALOG.flatMap(s => s.items).find(i => i.id === moduleId);
        let rows = getReportRows(moduleId);
        rows = applyAlertOnlyFilter(rows, moduleId);
        container.innerHTML = `
            <div class="page-header admin-page-header">
                <div>
                    <h1>${catalogItem?.icon || '📈'} ${def.label} Report</h1>
                    <p class="page-subtitle">Generated ${new Date().toLocaleString()} — customize columns and filters below.</p>
                </div>
                <button class="btn btn-outline" onclick="navigateTo('reports')">← All Reports</button>
            </div>
            ${typeof getAreaFilterBanner === 'function' ? getAreaFilterBanner() : ''}
            ${def.renderKpi(rows)}
            ${renderReportBuilderToolbar(moduleId)}
            <div id="reportDataTableWrap">${renderReportDataTable(moduleId, rows)}</div>`;
    }

    function openModuleReport(moduleId) {
        currentReportModuleId = moduleId;
        initReportBuilderState(moduleId);
        navigateTo('report-detail');
    }

    function openReport(reportId) {
        currentReportModuleId = resolveReportModuleId(reportId);
        initReportBuilderState(currentReportModuleId, reportId);
        navigateTo('report-detail');
    }

    function refreshCustomReport() {
        const container = document.getElementById('contentArea');
        if (!container) return;
        renderReportDetail(container);
    }

    function onReportBuilderSearch(value) {
        reportBuilderState.searchTerm = value;
        const moduleId = resolveReportModuleId(currentReportModuleId);
        let rows = getReportRows(moduleId);
        rows = applyAlertOnlyFilter(rows, moduleId);
        const wrap = document.getElementById('reportDataTableWrap');
        if (wrap) wrap.innerHTML = renderReportDataTable(moduleId, rows);
    }

    function onReportKpiFilterChange(value) {
        reportBuilderState.kpiFilter = value;
        reportBuilderState._alertOnly = false;
        refreshCustomReport();
    }

    function onReportColumnToggle(colId, checked) {
        if (checked && !reportBuilderState.selectedColumnIds.includes(colId)) {
            reportBuilderState.selectedColumnIds.push(colId);
        } else if (!checked) {
            reportBuilderState.selectedColumnIds = reportBuilderState.selectedColumnIds.filter(id => id !== colId);
        }
        onReportBuilderSearch(reportBuilderState.searchTerm);
    }

    function toggleAllReportColumns(selectAll) {
        const moduleId = resolveReportModuleId(currentReportModuleId);
        reportBuilderState.selectedColumnIds = selectAll
            ? getReportDefinition(moduleId).getColumns().map(c => c.id)
            : [];
        refreshCustomReport();
    }

    function saveCustomReportLayout() {
        const name = document.getElementById('reportLayoutName')?.value?.trim();
        if (!name) {
            showToast('Enter a layout name to save', 'warning');
            return;
        }
        const moduleId = resolveReportModuleId(currentReportModuleId);
        const layouts = loadSavedLayouts();
        layouts[name] = {
            moduleId,
            columns: [...reportBuilderState.selectedColumnIds],
            kpiFilter: reportBuilderState.kpiFilter
        };
        saveSavedLayouts(layouts);
        reportBuilderState.layoutName = name;
        showToast(`Layout "${name}" saved`, 'success');
        refreshCustomReport();
    }

    function onReportLayoutSelect(name) {
        if (!name) {
            const moduleId = resolveReportModuleId(currentReportModuleId);
            reportBuilderState.selectedColumnIds = getDefaultColumnIds(moduleId);
            reportBuilderState.layoutName = '';
            refreshCustomReport();
            return;
        }
        const layouts = loadSavedLayouts();
        const layout = layouts[name];
        if (!layout) return;
        reportBuilderState.selectedColumnIds = layout.columns || [];
        reportBuilderState.kpiFilter = layout.kpiFilter || 'all';
        reportBuilderState.layoutName = name;
        refreshCustomReport();
    }

    function exportCustomReport() {
        if (isCombinedReportMode()) {
            exportCombinedReport();
            return;
        }
        const moduleId = resolveReportModuleId(currentReportModuleId);
        const def = getReportDefinition(moduleId);
        let rows = getReportRows(moduleId);
        rows = applyAlertOnlyFilter(rows, moduleId);
        const cols = getActiveColumns(moduleId);
        if (!rows.length) {
            showToast('No data to export', 'warning');
            return;
        }
        const headers = cols.map(c => c.label);
        const sheetRows = rows.map(r => cols.map(c => c.getValue(r)));
        const filename = `${def.filenamePrefix}_${typeof formatExportDate === 'function' ? formatExportDate() : Date.now()}.csv`;
        if (typeof downloadExcelCsv === 'function') {
            downloadExcelCsv(filename, headers, sheetRows);
        }
        showToast(`Exported ${rows.length} row${rows.length !== 1 ? 's' : ''}`, 'success');
    }

    function exportReportCsv() {
        exportCustomReport();
    }

    // Backward-compatible config for any legacy references
    function getReportConfig(reportId) {
        const moduleId = resolveReportModuleId(reportId);
        const def = getReportDefinition(moduleId);
        return { title: `${def.label} Report`, moduleId };
    }

    // Expose globals
    window.REPORT_CATALOG = REPORT_CATALOG;
    window.REPORT_MODULE_REGISTRY = REPORT_MODULE_REGISTRY;
    window.renderModuleReportButton = renderModuleReportButton;
    window.renderReports = renderReports;
    window.renderReportDetail = renderReportDetail;
    window.openCombinedReportBuilder = openCombinedReportBuilder;
    window.runCombinedReport = runCombinedReport;
    window.onCombinedModuleToggle = onCombinedModuleToggle;
    window.onCombinedFieldToggle = onCombinedFieldToggle;
    window.toggleCombinedModuleFields = toggleCombinedModuleFields;
    window.onCombinedFilterChange = onCombinedFilterChange;
    window.saveCombinedReportLayout = saveCombinedReportLayout;
    window.onCombinedLayoutSelect = onCombinedLayoutSelect;
    window.exportCombinedReport = exportCombinedReport;
    window.openModuleReport = openModuleReport;
    window.openReport = openReport;
    window.refreshCustomReport = refreshCustomReport;
    window.onReportBuilderSearch = onReportBuilderSearch;
    window.onReportKpiFilterChange = onReportKpiFilterChange;
    window.onReportColumnToggle = onReportColumnToggle;
    window.toggleAllReportColumns = toggleAllReportColumns;
    window.saveCustomReportLayout = saveCustomReportLayout;
    window.onReportLayoutSelect = onReportLayoutSelect;
    window.exportCustomReport = exportCustomReport;
    window.exportReportCsv = exportReportCsv;
    window.getReportConfig = getReportConfig;
    window.currentReportModuleId = currentReportModuleId;

    Object.defineProperty(window, 'currentReportType', {
        get() { return currentReportModuleId; },
        set(v) { currentReportModuleId = resolveReportModuleId(v); }
    });
})();
