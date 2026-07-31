/**
 * Live Operations — uploads, position files, area statuses, comm sync, API wiring
 */
(function () {
    const POSITION_SLOTS = ['morning', 'afternoon', 'evening'];
    const POSITION_SLOT_LABELS = { morning: '08:00', afternoon: '14:00', evening: '20:00' };

    window.globalStatusListsDB = {
        POD: ['Pending Collection', 'Collected On-Time', 'Collected Late', 'Scanned', 'Uploaded', 'Sent to Invoicing', 'Overdue'],
        ASSET: ['Active', 'Assigned to Trip', 'At Border', 'In Maintenance', 'Idle', 'Decommissioned'],
        CAR: ['Available', 'On Trip', 'At Loading', 'At Border', 'Dispatched', 'Returned']
    };

    const LIVE_UPLOAD_CSV_COLUMNS = [
        'OrderNo', 'DateLoaded', 'DispatchDate', 'Delivered', 'TripNumber', 'OrderOwner', 'Transporter',
        'FleetNr', 'Truck', 'Trailer1', 'Trailer2', 'Driver', 'ClearingAgent', 'Border',
        'PaSentOn', 'Customer', 'Consignee', 'InvoiceParty', 'FromStation', 'LoadingPoint',
        'ToStation', 'OffloadingPoint', 'CargoType', 'Commodity', 'CustomerRef'
    ];

    window.uploadTemplatesDB = {
        NB: {
            name: 'NB Live Upload',
            columns: LIVE_UPLOAD_CSV_COLUMNS,
            description: 'Northbound live file — full template columns for Active NB Trucks table'
        },
        SB: {
            name: 'SB Live Upload',
            columns: LIVE_UPLOAD_CSV_COLUMNS,
            description: 'Southbound live file — full template columns for Active SB Trucks table'
        },
        POSITION: {
            name: 'Position File (3× daily)',
            columns: ['TripNumber', 'Truck', 'Position', 'Area', 'AreaStatus', 'ProcessComment', 'Timestamp'],
            description: 'Position upload 3× per day — must match trucks from NB live file. Position 08:00 / mid day / evening columns on live page.'
        },
        LIVE: {
            name: 'Live Operations Master',
            columns: ['OrderNo', 'DateLoaded', 'DispatchDate', 'Delivered', 'TripNumber', 'OrderOwner', 'Transporter', 'FleetNr', 'Truck', 'Trailer1', 'Trailer2', 'Driver', 'DriverContact', 'ClearingAgent', 'Border', 'PaSentOn', 'Customer', 'Consignee', 'InvoiceParty', 'FromStation', 'LoadingPoint', 'ToStation', 'OffloadingPoint', 'CargoType', 'Commodity', 'CustomerRef'],
            description: 'Master live file columns — reflected on Position Live page'
        }
    };

    window.TEMPLATE_COLUMN_REGISTRY = {
        NB: {
            TripNumber: { field: 'tripNumber', label: 'Trip #' },
            Truck: { field: 'truck', label: 'Truck' },
            Driver: { field: 'driver', label: 'Driver' },
            Owner: { field: 'owner', label: 'Owner' },
            EntryBorder: { field: 'entryBorder', label: 'Border' },
            OffloadingPoint: { field: 'offloadingPoint', label: 'Offloading' },
            Area: { field: 'area', label: 'Area' },
            BorderProcess: { field: 'borderProcess', label: 'Border Process' },
            Status: { field: 'status', label: 'Status', isStatus: true }
        },
        SB: {
            TripNumber: { field: 'tripNumber', label: 'Trip #' },
            Truck: { field: 'truck', label: 'Truck' },
            Driver: { field: 'driver', label: 'Driver' },
            Owner: { field: 'owner', label: 'Owner' },
            LoadingPoint: { field: 'loadingPoint', label: 'Loading Point' },
            ExitBorder: { field: 'exitBorder', label: 'Exit Border' },
            Area: { field: 'area', label: 'Area' },
            Status: { field: 'status', label: 'Status', isStatus: true }
        }
    };

    /** Position Live page — static column definitions */
    const LIVE_STATIC_COLUMNS = [
        { key: 'rowNum', label: '#', computed: 'rowIndex', width: '40px' },
        { key: 'orderNo', label: 'Order No', field: 'orderNo' },
        { key: 'dateLoaded', label: 'Date Loaded', field: 'dateLoaded', format: 'date' },
        { key: 'dispatchDate', label: 'Dispatch Date', field: 'dispatchDate', format: 'date' },
        { key: 'delivered', label: 'Delivered', field: 'delivered', format: 'date' },
        { key: 'tripNumber', label: 'Trip Ref.', field: 'tripNumber' },
        { key: 'orderOwner', label: 'Order Owner', field: 'orderOwner' },
        { key: 'transporter', label: 'Transporter', field: 'transporter' },
        { key: 'fleetNr', label: 'Fleet Nr.', field: 'fleetNr' },
        { key: 'truck', label: 'Truck', field: 'truck' },
        { key: 'driver', label: 'Driver', field: 'driver', isDriverLink: true },
        { key: 'driverContact', label: 'Driver Contact', computed: 'driverContact' },
        { key: 'trailer1', label: 'Trailer 1', field: 'trailer1' },
        { key: 'trailer2', label: 'Trailer 2', field: 'trailer2' },
        { key: 'clearingAgent', label: 'Clearing Agent', field: 'clearingAgent' },
        { key: 'border', label: 'Border', computed: 'border' },
        { key: 'paSentOn', label: 'PA sent on', field: 'paSentOn', format: 'date' },
        { key: 'customer', label: 'Customer', field: 'customer' },
        { key: 'consignee', label: 'Consignee', field: 'consignee' },
        { key: 'invoiceParty', label: 'Invoice Party', field: 'invoiceParty' },
        { key: 'fromStation', label: 'From Station', field: 'fromStation' },
        { key: 'loadingPoint', label: 'Loading Point', field: 'loadingPoint' },
        { key: 'toStation', label: 'To Station', field: 'toStation' },
        { key: 'offloadingPoint', label: 'Offloading Point', field: 'offloadingPoint' },
        { key: 'cargoType', label: 'Cargo Type', field: 'cargoType' },
        { key: 'commodity', label: 'Commodity', field: 'commodity' },
        { key: 'customerRef', label: 'Customer Ref.', field: 'customerRef' },
        { key: 'latestComment', label: 'Comment from User in Area', computed: 'latestComment', wide: true },
        { key: 'positionMorning', label: 'Position 08:00', computed: 'position', slot: 'morning' },
        { key: 'positionAfternoon', label: 'Position mid day', computed: 'position', slot: 'afternoon' },
        { key: 'positionEvening', label: 'Position evening', computed: 'position', slot: 'evening' }
    ];

    const LIVE_POSITION_SLOT_MAP = {
        morning: 'positionMorning',
        afternoon: 'positionAfternoon',
        evening: 'positionEvening'
    };

    window.LIVE_STATIC_COLUMNS = LIVE_STATIC_COLUMNS;

    window.getLiveWorkflowSteps = function (direction) {
        const wf = window.WORKFLOW_CONFIG || {};
        return wf[direction] || wf.NB || [];
    };

    window.getLiveWorkflowDateColumns = function (direction) {
        return getLiveWorkflowSteps(direction).map(step => ({
            key: `wf_${step.key}`,
            label: step.label,
            workflowKey: step.key,
            isWorkflowDate: true
        }));
    };

    window.getLivePageColumns = function (direction) {
        const wfCols = getLiveWorkflowDateColumns(direction);
        const staticBeforeComment = LIVE_STATIC_COLUMNS.filter(c => c.key !== 'latestComment' && !c.key.startsWith('position'));
        const commentCol = LIVE_STATIC_COLUMNS.find(c => c.key === 'latestComment');
        const positionCols = LIVE_STATIC_COLUMNS.filter(c => c.key.startsWith('position'));
        return [...staticBeforeComment, ...wfCols, commentCol, ...positionCols].filter(Boolean);
    };

    window.getOperationsRetainedColumns = function (context) {
        const cols = [
            { key: 'retained_area', label: 'Area', retained: 'area' },
            { key: 'retained_status', label: 'Status', retained: 'status', isStatus: true },
            { key: 'retained_days', label: 'Days', retained: 'days' },
            { key: 'retained_kpi', label: 'KPI', retained: 'kpi' }
        ];
        if (context === 'NB' || context === 'BORDER') {
            cols.splice(1, 0, { key: 'retained_borderProcess', label: 'Border Process', retained: 'borderProcess' });
        }
        return cols;
    };

    window.getWorkflowColumnsForContext = function (context) {
        if (context === 'NB') return getLiveWorkflowDateColumns('NB');
        if (context === 'SB') return getLiveWorkflowDateColumns('SB');
        if (context === 'BORDER') {
            const dir = document.getElementById('borderDirectionFilter')?.value || 'all';
            if (dir === 'NB') return getLiveWorkflowDateColumns('NB');
            if (dir === 'SB') return getLiveWorkflowDateColumns('SB');
            return [
                ...getLiveWorkflowDateColumns('NB').map(c => ({ ...c, key: `nb_${c.key}`, workflowDirection: 'NB' })),
                ...getLiveWorkflowDateColumns('SB').map(c => ({ ...c, key: `sb_${c.key}`, workflowDirection: 'SB' }))
            ];
        }
        return [];
    };

    window.getFullOperationsColumns = function (context) {
        const staticBeforeComment = LIVE_STATIC_COLUMNS.filter(c => c.key !== 'latestComment' && !c.key.startsWith('position'));
        const commentCol = LIVE_STATIC_COLUMNS.find(c => c.key === 'latestComment');
        const positionCols = LIVE_STATIC_COLUMNS.filter(c => c.key.startsWith('position'));
        const wfCols = getWorkflowColumnsForContext(context);
        const retained = getOperationsRetainedColumns(context);
        return [...staticBeforeComment, ...wfCols, commentCol, ...positionCols, ...retained].filter(Boolean);
    };

    const COLUMN_PREFS_KEY = 'truckcontrol_live_column_prefs';
    const DEFAULT_FROZEN_COLUMNS = ['rowNum', 'tripNumber', 'truck', 'driver'];
    const COL_WIDTH_ESTIMATE = {
        rowNum: 44, tripNumber: 108, truck: 118, driver: 130, driverContact: 150, orderNo: 96,
        latestComment: 220, retained_area: 100, retained_status: 130, retained_kpi: 110
    };

    window.normalizeKpi = function (kpi) {
        return kpi === 'orange' || kpi === 'red' ? kpi : 'green';
    };

    window.getKpiLabel = function (kpi) {
        const k = normalizeKpi(kpi);
        if (typeof getKPILabel === 'function') return getKPILabel(k);
        return k === 'red' ? 'Overdue' : k === 'orange' ? 'Priority' : 'On Track';
    };

    window.renderKpiTruckCell = function (trip) {
        const kpi = normalizeKpi(trip.kpi);
        const truck = trip.truck || '—';
        return `<span class="live-truck-cell kpi-${kpi}" title="${getKpiLabel(kpi)}">${truck}</span>`;
    };

    window.renderKpiStatusBadge = function (trip, borderRow) {
        const kpi = normalizeKpi(trip.kpi || borderRow?.kpi);
        const status = trip.status || borderRow?.status || '—';
        return `<span class="status-badge kpi-status-badge kpi-${kpi}">${status}</span>`;
    };

    window.renderKpiPill = function (trip, borderRow) {
        const kpi = normalizeKpi(trip.kpi || borderRow?.kpi);
        const label = borderRow?.kpiLabel || getKpiLabel(kpi);
        return `<span class="kpi-pill kpi-${kpi}"><span class="kpi-indicator ${kpi}"></span>${label}</span>`;
    };

    window.renderBorderProcessBadge = function (trip, borderRow) {
        const proc = borderRow?.process || trip.borderProcess || '—';
        const procClass = /kbp/i.test(proc) ? 'kbp' : /whisky/i.test(proc) ? 'whisky' : /sb/i.test(proc) ? 'sb-exit' : 'process-neutral';
        return `<span class="status-badge ${procClass}">${proc}</span>`;
    };

    window.getColumnPrefs = function (context) {
        try {
            const all = JSON.parse(localStorage.getItem(COLUMN_PREFS_KEY) || '{}');
            const prefs = all[context] || {};
            return {
                hidden: Array.isArray(prefs.hidden) ? prefs.hidden : [],
                frozen: Array.isArray(prefs.frozen) && prefs.frozen.length ? prefs.frozen : [...DEFAULT_FROZEN_COLUMNS]
            };
        } catch {
            return { hidden: [], frozen: [...DEFAULT_FROZEN_COLUMNS] };
        }
    };

    window.saveColumnPrefs = function (context, prefs) {
        try {
            const all = JSON.parse(localStorage.getItem(COLUMN_PREFS_KEY) || '{}');
            all[context] = prefs;
            localStorage.setItem(COLUMN_PREFS_KEY, JSON.stringify(all));
        } catch (_) { /* ignore */ }
    };

    window.getEffectiveOperationsColumns = function (context) {
        const prefs = getColumnPrefs(context);
        return getFullOperationsColumns(context).filter(c => !prefs.hidden.includes(c.key));
    };

    window.isColumnFrozen = function (context, colKey) {
        return getColumnPrefs(context).frozen.includes(colKey);
    };

    window.renderLiveColumnHeaderCell = function (col, context) {
        const frozen = isColumnFrozen(context, col.key);
        const cls = [
            col.wide ? 'live-comment-col' : '',
            col.isWorkflowDate ? 'live-wf-date-cell' : '',
            frozen ? 'live-col-frozen' : ''
        ].filter(Boolean).join(' ');
        return `<th class="${cls}" data-col-key="${col.key}" data-frozen="${frozen ? '1' : '0'}">${col.label}${frozen ? ' <span class="col-pin" title="Frozen column">📌</span>' : ''}</th>`;
    };

    window.renderLiveColumnBodyCell = function (col, context, innerHtml) {
        const frozen = isColumnFrozen(context, col.key);
        const cls = [
            col.wide ? 'live-comment-col' : '',
            col.isWorkflowDate ? 'live-wf-date-cell' : '',
            frozen ? 'live-col-frozen' : ''
        ].filter(Boolean).join(' ');
        return `<td class="${cls}" data-col-key="${col.key}" data-frozen="${frozen ? '1' : '0'}">${innerHtml}</td>`;
    };

    window.renderLiveColumnToolbar = function (context, tableId, listKey) {
        const cols = getFullOperationsColumns(context);
        const prefs = getColumnPrefs(context);
        const hiddenCount = prefs.hidden.length;
        const frozenCount = prefs.frozen.length;
        return `<div class="live-column-toolbar">
            <button type="button" class="btn btn-outline btn-sm" onclick="openLiveColumnPanel('${context}', '${tableId}', '${listKey || ''}')">⚙️ Columns${hiddenCount ? ` <span class="badge">${cols.length - hiddenCount}/${cols.length}</span>` : ''}</button>
            <span class="live-column-hint">${frozenCount} frozen · ${hiddenCount} hidden</span>
        </div>`;
    };

    window.openLiveColumnPanel = function (context, tableId, listKey) {
        const cols = getFullOperationsColumns(context);
        const prefs = getColumnPrefs(context);
        let panel = document.getElementById('liveColumnPanel');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'liveColumnPanel';
            panel.className = 'live-column-panel';
            document.body.appendChild(panel);
        }
        panel.innerHTML = `
            <div class="live-column-panel-header">
                <strong>⚙️ Show / Hide & Freeze Columns</strong>
                <button type="button" class="btn btn-outline btn-sm" onclick="closeLiveColumnPanel()">✕</button>
            </div>
            <p class="live-column-panel-desc">Toggle visibility. Pin 📌 columns to freeze them when scrolling horizontally. Preferences are saved per page.</p>
            <div class="live-column-panel-actions">
                <button type="button" class="btn btn-outline btn-sm" onclick="resetLiveColumnPrefs('${context}', '${tableId}', '${listKey}')">Reset defaults</button>
                <button type="button" class="btn btn-outline btn-sm" onclick="showAllLiveColumns('${context}', '${tableId}', '${listKey}')">Show all</button>
            </div>
            <div class="live-column-list">
                ${cols.map(col => {
                    const visible = !prefs.hidden.includes(col.key);
                    const frozen = prefs.frozen.includes(col.key);
                    return `<label class="live-column-item">
                        <input type="checkbox" ${visible ? 'checked' : ''} onchange="toggleLiveColumnVisibility('${context}', '${col.key}', '${tableId}', '${listKey}')">
                        <span class="live-column-label">${col.label}</span>
                        <button type="button" class="col-freeze-btn${frozen ? ' active' : ''}" title="${frozen ? 'Unfreeze' : 'Freeze column'}" onclick="event.preventDefault();toggleLiveColumnFreeze('${context}', '${col.key}', '${tableId}', '${listKey}')">📌</button>
                    </label>`;
                }).join('')}
            </div>`;
        panel.classList.add('show');
        panel.dataset.context = context;
        panel.dataset.tableId = tableId;
        panel.dataset.listKey = listKey || '';
    };

    window.closeLiveColumnPanel = function () {
        const panel = document.getElementById('liveColumnPanel');
        if (panel) panel.classList.remove('show');
    };

    window.toggleLiveColumnVisibility = function (context, colKey, tableId, listKey) {
        const prefs = getColumnPrefs(context);
        const idx = prefs.hidden.indexOf(colKey);
        if (idx >= 0) prefs.hidden.splice(idx, 1);
        else prefs.hidden.push(colKey);
        saveColumnPrefs(context, prefs);
        refreshLiveTableWithColumns(context, tableId, listKey);
        openLiveColumnPanel(context, tableId, listKey);
    };

    window.toggleLiveColumnFreeze = function (context, colKey, tableId, listKey) {
        const prefs = getColumnPrefs(context);
        const idx = prefs.frozen.indexOf(colKey);
        if (idx >= 0) prefs.frozen.splice(idx, 1);
        else prefs.frozen.push(colKey);
        saveColumnPrefs(context, prefs);
        refreshLiveTableWithColumns(context, tableId, listKey);
        openLiveColumnPanel(context, tableId, listKey);
    };

    window.showAllLiveColumns = function (context, tableId, listKey) {
        const prefs = getColumnPrefs(context);
        prefs.hidden = [];
        saveColumnPrefs(context, prefs);
        refreshLiveTableWithColumns(context, tableId, listKey);
        openLiveColumnPanel(context, tableId, listKey);
    };

    window.resetLiveColumnPrefs = function (context, tableId, listKey) {
        saveColumnPrefs(context, { hidden: [], frozen: [...DEFAULT_FROZEN_COLUMNS] });
        refreshLiveTableWithColumns(context, tableId, listKey);
        openLiveColumnPanel(context, tableId, listKey);
    };

    window.refreshLiveTableWithColumns = function (context, tableId, listKey) {
        const table = document.getElementById(tableId);
        if (!table) return;
        const headRow = table.querySelector('thead tr');
        if (context === 'BORDER') {
            if (headRow) headRow.innerHTML = getBorderOperationsTableHeaderHtml();
            const body = document.getElementById('borderTableBody');
            if (body && typeof renderBorderTableRowsFiltered === 'function') body.innerHTML = renderBorderTableRowsFiltered();
        } else if (context === 'POSITION' || context.startsWith('POSITION_')) {
            if (typeof refreshPositionLiveTable === 'function') refreshPositionLiveTable();
        } else if (context === 'NB') {
            if (headRow) headRow.innerHTML = getOperationsTableHeaderHtml('NB', listKey || 'nb');
            const body = document.getElementById('nbTableBody');
            if (body && typeof renderNBTableRowsFiltered === 'function') body.innerHTML = renderNBTableRowsFiltered();
        } else if (context === 'SB') {
            if (headRow) headRow.innerHTML = getOperationsTableHeaderHtml('SB', listKey || 'sb');
            const body = document.getElementById('sbTableBody');
            if (body && typeof renderSBTableRowsFiltered === 'function') body.innerHTML = renderSBTableRowsFiltered();
        }
        applyLiveTableLayout(tableId, context);
    };

    function getKpiRowBg(tr) {
        if (!tr) return '#fff';
        if (tr.classList.contains('kpi-row-green')) return '#f0fff8';
        if (tr.classList.contains('kpi-row-orange')) return '#fffaf0';
        if (tr.classList.contains('kpi-row-red')) return '#fff5f5';
        return '#fff';
    }

    window.applyLiveTableLayout = function (tableId, context) {
        const table = document.getElementById(tableId);
        if (!table) return;
        const prefs = getColumnPrefs(context);
        table.querySelectorAll('[data-col-key]').forEach(el => {
            const key = el.dataset.colKey;
            const hidden = prefs.hidden.includes(key);
            const frozen = prefs.frozen.includes(key) && !hidden;
            el.style.display = hidden ? 'none' : '';
            el.classList.toggle('live-col-frozen', frozen);
            if (!frozen) {
                el.style.position = '';
                el.style.left = '';
                el.style.zIndex = '';
                el.style.background = '';
            }
        });
        let left = 0;
        const checkboxCol = table.querySelector('thead th:first-child input[type="checkbox"]');
        if (checkboxCol) left = checkboxCol.closest('th').offsetWidth || 36;
        prefs.frozen.forEach(key => {
            if (prefs.hidden.includes(key)) return;
            const cells = table.querySelectorAll(`[data-col-key="${key}"]`);
            cells.forEach(cell => {
                if (cell.style.display === 'none') return;
                cell.style.position = 'sticky';
                cell.style.left = left + 'px';
                cell.style.zIndex = cell.tagName === 'TH' ? 5 : 4;
                cell.style.background = cell.tagName === 'TH' ? '#edf2f7' : getKpiRowBg(cell.closest('tr'));
            });
            const sample = cells[0];
            left += (sample && sample.offsetWidth) || COL_WIDTH_ESTIMATE[key] || 96;
        });
        table.querySelectorAll('tbody tr').forEach(tr => {
            const actions = tr.querySelector('.live-actions-col');
            if (actions) actions.style.background = getKpiRowBg(tr);
        });
    };

    window.getKpiRowClass = function (trip) {
        return `kpi-row-${normalizeKpi(trip?.kpi)}`;
    };

    window.mergeBorderRowWithTrip = function (borderRow) {
        const trip = (window.tripsDB && window.tripsDB[borderRow.trip]) || {};
        return {
            ...trip,
            tripNumber: borderRow.trip,
            truck: borderRow.truck || trip.truck,
            driver: borderRow.driver || trip.driver,
            direction: borderRow.direction || trip.direction || 'NB',
            area: trip.area || borderRow.border,
            borderProcess: borderRow.process || trip.borderProcess,
            status: borderRow.status || trip.status,
            daysInDRC: trip.daysInDRC != null ? trip.daysInDRC : 0,
            kpi: borderRow.kpi || trip.kpi || 'green',
            entryBorder: trip.entryBorder || (borderRow.direction === 'NB' ? borderRow.border : trip.entryBorder),
            exitBorder: trip.exitBorder || (borderRow.direction === 'SB' ? borderRow.border : trip.exitBorder),
            positions: trip.positions || {},
            _borderRow: borderRow
        };
    };

    window.resolveRetainedCellValue = function (trip, col) {
        const borderRow = trip._borderRow;
        switch (col.retained) {
            case 'area':
                return trip.area || borderRow?.border || '—';
            case 'borderProcess':
                return renderBorderProcessBadge(trip, borderRow);
            case 'status':
                return renderKpiStatusBadge(trip, borderRow);
            case 'days': {
                const daysVal = trip.daysInDRC != null && trip.daysInDRC !== ''
                    ? trip.daysInDRC
                    : (borderRow?.hours != null && borderRow.hours !== '' ? borderRow.hours : '—');
                return `<span class="kpi-days kpi-${normalizeKpi(trip.kpi)}">${daysVal}</span>`;
            }
            case 'kpi':
                return renderKpiPill(trip, borderRow);
            default:
                return '—';
        }
    };

    window.renderOperationsCellHtml = function (trip, col, rowIndex) {
        if (col.retained) return resolveRetainedCellValue(trip, col);
        const content = resolveLiveCellValue(trip, col, rowIndex);
        if (col.isWorkflowDate) {
            const wfDir = col.workflowDirection || trip.direction || 'NB';
            const dateVal = getTripWorkflowStatusDate(trip, col.workflowKey, wfDir);
            const formatted = dateVal ? formatLiveDate(dateVal) : '—';
            return formatted !== '—'
                ? `<div class="live-status-date"><span class="live-status-date-label">${col.label}</span><span class="live-status-date-value">${formatted}</span></div>`
                : '—';
        }
        return content;
    };

    window.ensureTripLiveFields = function (trip) {
        if (!trip) return trip;
        trip.orderOwner = trip.orderOwner || trip.owner || '';
        trip.transporter = trip.transporter || trip.owner || '';
        trip.orderNo = trip.orderNo || trip.tripNumber || '';
        trip.fromStation = trip.fromStation || (trip.direction === 'NB' ? (trip.entryBorder || '') : (trip.loadingPoint || ''));
        trip.toStation = trip.toStation || (trip.direction === 'NB' ? (trip.offloadingPoint || '') : (trip.exitBorder || ''));
        trip.dateLoaded = trip.dateLoaded || trip.workflowDates?.loadingProcess || trip.workflowDates?.loading || '';
        trip.dispatchDate = trip.dispatchDate || trip.workflowDates?.dispatch || '';
        trip.delivered = trip.delivered || trip.workflowDates?.pod || trip.deliveredDate || '';
        trip.trailer1 = trip.trailer1 || trip.trailer || '';
        if (!trip.positions) trip.positions = {};
        return trip;
    };

    window.formatLiveDate = function (val) {
        if (!val) return '—';
        const d = new Date(val);
        if (isNaN(d.getTime())) return val;
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
            ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    };

    window.getTripWorkflowStatusDate = function (trip, workflowKey, workflowDirection) {
        if (!trip) return '';
        const dir = workflowDirection || trip.direction || 'NB';
        const dates = trip.workflowDates || {};
        const areaDates = trip.areaStatusDates || {};
        if (dates[workflowKey]) return dates[workflowKey];
        const step = getLiveWorkflowSteps(dir).find(s => s.key === workflowKey);
        if (step && areaDates[step.label]) return areaDates[step.label];
        return '';
    };

    window.renderLatestAreaCommentHtml = function (tripNumber) {
        const history = typeof getTripAreaHistory === 'function' ? getTripAreaHistory(tripNumber) : [];
        const latest = history[0];
        if (!latest || (!latest.notes && !latest.status)) return '—';
        const text = latest.notes || latest.status;
        const meta = `${latest.updatedBy || '—'} · ${latest.timestamp || '—'}`;
        const stackCount = history.length;
        return `<div class="live-comment-cell">
            <div class="live-comment-text">${text}</div>
            <div class="live-comment-meta">${meta}${stackCount > 1 ? ` <span class="live-comment-stack" title="${stackCount} comments on file">(+${stackCount - 1} earlier)</span>` : ''}</div>
        </div>`;
    };

    window.getTripPositionText = function (tripNumber, slot) {
        const trip = window.tripsDB?.[tripNumber];
        if (trip?.positions?.[slot]) return trip.positions[slot];
        const today = new Date().toISOString().slice(0, 10);
        const upload = (window.positionUploadsDB || []).find(p => p.date === today && p.slot === slot);
        if (!upload) return '—';
        const match = upload.matched?.find(m => m.tripNumber === tripNumber);
        if (!match) return '—';
        return match.positionText || `${match.latitude}, ${match.longitude}` || '—';
    };

    window.getTripNumber = function (trip) {
        return trip?.tripNumber || trip?.trip || trip?._borderRow?.trip || '';
    };

    window.resolveLiveCellValue = function (trip, col, rowIndex) {
        ensureTripLiveFields(trip);
        const tripNumber = getTripNumber(trip);
        if (col.computed === 'rowIndex') return rowIndex + 1;
        if (col.isWorkflowDate) {
            const wfDir = col.workflowDirection || trip.direction || 'NB';
            const dateVal = getTripWorkflowStatusDate(trip, col.workflowKey, wfDir);
            return dateVal ? formatLiveDate(dateVal) : '—';
        }
        if (col.computed === 'driverContact') {
            return typeof renderDriverContactCell === 'function'
                ? renderDriverContactCell(tripNumber)
                : '—';
        }
        if (col.computed === 'border') {
            return trip.direction === 'SB' ? (trip.exitBorder || trip.border || '—') : (trip.entryBorder || trip.border || '—');
        }
        if (col.computed === 'latestComment') return renderLatestAreaCommentHtml(tripNumber);
        if (col.computed === 'position' && col.slot) return getTripPositionText(tripNumber, col.slot);
        if (col.field === 'truck') return renderKpiTruckCell(trip);
        if (col.isDriverLink) {
            const driverName = trip.driver || trip._borderRow?.driver || '';
            return typeof renderDriverLink === 'function'
                ? renderDriverLink(driverName, tripNumber)
                : (driverName || '—');
        }
        const val = trip[col.field];
        if (col.format === 'date') return val ? formatLiveDate(val) : '—';
        return val != null && val !== '' ? val : '—';
    };

    window.getPositionLiveContextKey = function (direction) {
        return `POSITION_${direction || 'NB'}`;
    };

    window.getEffectiveLivePageColumns = function (direction) {
        const ctx = getPositionLiveContextKey(direction);
        const prefs = getColumnPrefs(ctx);
        return getLivePageColumns(direction).filter(c => !prefs.hidden.includes(c.key));
    };

    window.renderLivePageTableRows = function (trips, direction) {
        const ctx = getPositionLiveContextKey(direction);
        const cols = getEffectiveLivePageColumns(direction);
        if (!trips.length) {
            return `<tr><td colspan="${cols.length + 1}" style="text-align:center;padding:24px;color:var(--text-secondary);">No trucks on live page</td></tr>`;
        }
        return trips.map((trip, i) => {
            ensureTripLiveFields(trip);
            const area = trip.area || trip.entryBorder || trip.exitBorder;
            const canEdit = typeof canEditInModule === 'function' ? canEditInModule('position-live', area) : true;
            const cells = cols.map(col => renderLiveColumnBodyCell(col, ctx, renderOperationsCellHtml(trip, col, i))).join('');
            const kpi = normalizeKpi(trip.kpi);
            const commentBtn = canEdit
                ? `<button class="btn btn-sm kpi-comment-btn kpi-${kpi}" onclick="openCommentModal('${trip.tripNumber}', '${trip.direction === 'SB' ? 'sb' : 'nb'}')">💬</button>`
                : '';
            return `<tr class="${getKpiRowClass(trip)}">${cells}<td class="live-actions-col">${commentBtn}</td></tr>`;
        }).join('');
    };

    window.renderLivePageTableHeader = function (direction) {
        const ctx = getPositionLiveContextKey(direction);
        const cols = getEffectiveLivePageColumns(direction);
        return cols.map(c => renderLiveColumnHeaderCell(c, ctx)).join('') + '<th class="live-actions-col">Actions</th>';
    };

    window.mapLiveUploadFields = function (trip, row) {
        const map = {
            orderNo: row.OrderNo || row.orderNo,
            dateLoaded: row.DateLoaded || row.dateLoaded,
            dispatchDate: row.DispatchDate || row.dispatchDate,
            delivered: row.Delivered || row.delivered,
            tripNumber: row.TripNumber || row.tripNumber || trip.tripNumber,
            orderOwner: row.OrderOwner || row.orderOwner || row.Owner || row.owner,
            transporter: row.Transporter || row.transporter || row.Owner || row.owner,
            fleetNr: row.FleetNr || row.fleetNr,
            truck: row.Truck || row.truck || trip.truck,
            trailer1: row.Trailer1 || row.trailer1 || row.Trailer,
            trailer2: row.Trailer2 || row.trailer2,
            driver: row.Driver || row.driver || trip.driver,
            clearingAgent: row.ClearingAgent || row.clearingAgent,
            paSentOn: row.PaSentOn || row.paSentOn,
            customer: row.Customer || row.customer,
            consignee: row.Consignee || row.consignee,
            invoiceParty: row.InvoiceParty || row.invoiceParty,
            fromStation: row.FromStation || row.fromStation,
            loadingPoint: row.LoadingPoint || row.loadingPoint || trip.loadingPoint,
            toStation: row.ToStation || row.toStation,
            offloadingPoint: row.OffloadingPoint || row.offloadingPoint || trip.offloadingPoint,
            cargoType: row.CargoType || row.cargoType,
            commodity: row.Commodity || row.commodity,
            customerRef: row.CustomerRef || row.customerRef,
            owner: row.OrderOwner || row.Owner || row.owner || trip.owner,
            area: row.Area || row.area || trip.area,
            borderProcess: row.BorderProcess || row.borderProcess || trip.borderProcess,
            status: row.Status || row.status || trip.status
        };
        const borderVal = row.Border || row.border || row.EntryBorder || row.entryBorder || row.ExitBorder || row.exitBorder;
        if (borderVal) {
            if (trip.direction === 'SB') trip.exitBorder = borderVal;
            else trip.entryBorder = borderVal;
        }
        Object.entries(map).forEach(([k, v]) => { if (v != null && v !== '') trip[k] = v; });
        return trip;
    };

    window.getTemplateColumns = function (type) {
        const tpl = uploadTemplatesDB[type];
        if (!tpl) return [];
        const reg = TEMPLATE_COLUMN_REGISTRY[type] || {};
        return tpl.columns.map(col => {
            const meta = reg[col] || {};
            return {
                key: col,
                field: meta.field || col.charAt(0).toLowerCase() + col.slice(1),
                label: meta.label || col,
                isStatus: !!meta.isStatus
            };
        });
    };

    window.getOperationsTableHeaderHtml = function (type, listKey) {
        const context = type === 'SB' ? 'SB' : 'NB';
        const cols = getEffectiveOperationsColumns(context);
        const checkbox = listKey
            ? `<th style="width:36px;text-align:center;" class="live-col-checkbox"><input type="checkbox" aria-label="Select all trucks" onchange="toggleAllListRows('${listKey}', this.checked)"></th>`
            : '';
        const headers = cols.map(c => renderLiveColumnHeaderCell(c, context)).join('');
        return `${checkbox}${headers}<th class="live-actions-col">Actions</th>`;
    };

    window.getBorderOperationsTableHeaderHtml = function () {
        const context = 'BORDER';
        const cols = getEffectiveOperationsColumns(context);
        const checkbox = `<th style="width:36px;text-align:center;" class="live-col-checkbox"><input type="checkbox" aria-label="Select all border trucks" onchange="toggleAllListRows('border', this.checked)"></th>`;
        const headers = cols.map(c => renderLiveColumnHeaderCell(c, context)).join('');
        return `${checkbox}${headers}<th class="live-actions-col">Actions</th>`;
    };

    window.renderOperationsTableRows = function (trips, listKey, type) {
        const context = type === 'SB' ? 'SB' : 'NB';
        const cols = getEffectiveOperationsColumns(context);
        const moduleId = type === 'NB' ? 'nb-operations' : 'sb-operations';
        const statusCtx = type === 'NB' ? 'nb' : 'sb';
        const colSpan = (listKey ? 1 : 0) + cols.length + 1;
        if (!trips.length) {
            return `<tr><td colspan="${colSpan}" style="text-align:center;padding:20px;color:var(--text-secondary);">No trucks match the current search/filter criteria</td></tr>`;
        }
        return trips.map((t, i) => {
            ensureTripLiveFields(t);
            const area = t.area || t.entryBorder || t.exitBorder || t.offloadingPoint || t.loadingPoint;
            const canEdit = typeof canEditInModule !== 'function' || canEditInModule(moduleId, area);
            const cells = cols.map(col => renderLiveColumnBodyCell(col, context, renderOperationsCellHtml(t, col, i))).join('');
            const kpi = normalizeKpi(t.kpi);
            const commentBtn = canEdit
                ? `<button class="btn btn-sm kpi-comment-btn kpi-${kpi}" onclick="openCommentModal('${t.tripNumber}', '${statusCtx}')">💬 Comment</button>`
                : '';
            const viewBtn = typeof renderTripViewButton === 'function' ? renderTripViewButton(t.tripNumber) : '';
            return `<tr class="${getKpiRowClass(t)}">
                ${listKey ? `<td style="width:36px;text-align:center;" class="live-col-checkbox">${typeof renderListRowCheckbox === 'function' ? renderListRowCheckbox(listKey, t.tripNumber) : ''}</td>` : ''}
                ${cells}
                <td class="live-actions-col">${commentBtn}${viewBtn}</td>
            </tr>`;
        }).join('');
    };

    window.renderBorderOperationsTableRows = function (rows) {
        const context = 'BORDER';
        const cols = getEffectiveOperationsColumns(context);
        const colSpan = cols.length + 2;
        if (!rows.length) {
            return `<tr><td colspan="${colSpan}" style="text-align:center;padding:24px;color:var(--text-secondary);">No trucks match your search</td></tr>`;
        }
        return rows.map((borderRow, i) => {
            const trip = mergeBorderRowWithTrip(borderRow);
            ensureTripLiveFields(trip);
            const canEdit = typeof canEditInModule === 'function' ? canEditInModule('border-clearance', borderRow.border) : true;
            const statusCtx = borderRow.direction === 'SB' ? 'sb' : 'border';
            const cells = cols.map(col => renderLiveColumnBodyCell(col, context, renderOperationsCellHtml(trip, col, i))).join('');
            const kpi = normalizeKpi(trip.kpi);
            const commentBtn = canEdit
                ? `<button class="btn btn-sm kpi-comment-btn kpi-${kpi}" onclick="openCommentModal('${borderRow.trip}', '${statusCtx}')">💬</button>`
                : '';
            const viewBtn = `<button class="btn btn-outline btn-sm" onclick="navigateToTripView('${borderRow.trip}')">👁️</button>`;
            return `<tr class="${getKpiRowClass(trip)}">
                <td style="width:36px;text-align:center;" class="live-col-checkbox">${typeof renderListRowCheckbox === 'function' ? renderListRowCheckbox('border', borderRow.trip) : ''}</td>
                ${cells}
                <td class="live-actions-col">${commentBtn}${viewBtn}</td>
            </tr>`;
        }).join('');
    };

    window.getTemplateExportConfig = function (type) {
        const context = type === 'SB' ? 'SB' : 'NB';
        const cols = getFullOperationsColumns(context);
        return {
            headers: cols.map(c => c.label).concat(['Actions']),
            mapRow: t => {
                ensureTripLiveFields(t);
                const cells = cols.map((col, i) => {
                    if (col.retained === 'status') return t.status || '';
                    if (col.retained === 'kpi') return typeof getKPILabel === 'function' ? getKPILabel(t.kpi) : t.kpi;
                    if (col.retained === 'borderProcess') return t.borderProcess || '';
                    if (col.isWorkflowDate) {
                        const wfDir = col.workflowDirection || t.direction || context;
                        const d = getTripWorkflowStatusDate(t, col.workflowKey, wfDir);
                        return d ? formatLiveDate(d) : '';
                    }
                    if (col.computed === 'latestComment') {
                        const h = typeof getTripAreaHistory === 'function' ? getTripAreaHistory(t.tripNumber)[0] : null;
                        return h ? (h.notes || h.status || '') : '';
                    }
                    if (col.computed === 'driverContact') {
                        const dc = typeof findDriverContactByTrip === 'function' ? findDriverContactByTrip(t.tripNumber) : null;
                        return dc ? `${dc.whatsapp || ''} ${dc.drcNumber || ''}`.trim() : '';
                    }
                    if (col.computed === 'position' && col.slot) return getTripPositionText(t.tripNumber, col.slot);
                    if (col.computed === 'border') return t.direction === 'SB' ? (t.exitBorder || '') : (t.entryBorder || '');
                    if (col.computed === 'rowIndex') return '';
                    if (col.isDriverLink) return t.driver || '';
                    if (col.format === 'date' && t[col.field]) return formatLiveDate(t[col.field]);
                    return t[col.field] || '';
                });
                return cells;
            }
        };
    };

    window.liveUploadsDB = [];
    window.positionUploadsDB = [];
    let nextLiveUploadId = 1;
    let nextPositionUploadId = 1;

    function normalizeAreaRecord(rec) {
        if (rec.statusesNB !== undefined) return rec;
        const all = rec.statuses || [];
        return {
            ...rec,
            isBorder: ['Kasumbalesa', 'Sakania', 'Mokambo'].includes(rec.area),
            borderForNB: ['Kasumbalesa', 'Sakania', 'Mokambo'].includes(rec.area),
            borderForSB: ['Kasumbalesa', 'Sakania', 'Mokambo'].includes(rec.area),
            isOffloadingPoint: ['Kolwezi', 'Lubumbashi', 'Likasi', 'Kanyaka'].includes(rec.area),
            isLoadingPoint: ['Kolwezi', 'Kanyaka'].includes(rec.area),
            isKanyakaHub: rec.area === 'Kanyaka',
            kanyakaForNB: rec.area === 'Kanyaka',
            kanyakaForSB: rec.area === 'Kanyaka',
            statusesNB: rec.area === 'Kanyaka' ? all.filter(s => s.includes('Transit') || s.includes('Depot')) : all,
            statusesSB: rec.area === 'Kanyaka' ? all.filter(s => !s.includes('Transit to')) : all,
            statusesBorderNB: rec.area === 'Kasumbalesa' ? ['KBP Parking', 'KBP Scan Bay', 'Whisky Process', 'Customs Clearance'] : all.slice(0, 4),
            statusesBorderSB: ['Gov List Uploaded', 'Customs Declaration', 'Seal Verification', 'Exit to Zambia']
        };
    }

    window.migrateAreaStatusesDB = function () {
        if (!window.areaStatusesDB) return;
        window.areaStatusesDB = window.areaStatusesDB.map(normalizeAreaRecord);
    };

    window.getStatusesForUpdateDropdown = function (statusContext, trip, asset) {
        const global = window.globalStatusListsDB || {};
        if (statusContext === 'pod') return [...(global.POD || [])];
        if (statusContext === 'asset') return [...(global.ASSET || [])];
        if (statusContext === 'car') return [...(global.CAR || [])];

        const areas = window.areaStatusesDB || [];
        const findArea = (name) => areas.find(a => a.area === name);

        if (statusContext === 'nb' && trip) {
            const rec = findArea(trip.area) || findArea(trip.entryBorder) ||
                areas.find(a => a.isOffloadingPoint && trip.offloadingPoint && trip.offloadingPoint.toLowerCase().includes(a.area.toLowerCase()));
            if (!rec) return [];
            const list = [...(rec.statusesNB || [])];
            if (rec.isBorder && rec.borderForNB) list.push(...(rec.statusesBorderNB || []));
            if (rec.isKanyakaHub && rec.kanyakaForNB) list.push(...(rec.statusesNB || []).filter(s => /kanyaka|transit/i.test(s)));
            return [...new Set(list)];
        }

        if (statusContext === 'sb' && trip) {
            const rec = findArea(trip.area) || findArea(trip.loadingPoint?.split(' ')[0]) || findArea(trip.exitBorder);
            if (!rec) return [];
            const list = [...(rec.statusesSB || [])];
            if (rec.isLoadingPoint) list.push(...(rec.statusesSB || []).filter(s => /load/i.test(s)));
            if (rec.isKanyakaHub && rec.kanyakaForSB) list.push(...(rec.statusesSB || []));
            return [...new Set(list)];
        }

        if (statusContext === 'border' && trip) {
            const borderName = trip.direction === 'NB' ? (trip.entryBorder || trip.area) : (trip.exitBorder || trip.driverExitBorder || trip.area);
            const rec = findArea(borderName) || areas.find(a => a.isBorder);
            if (!rec) return [];
            if (trip.direction === 'NB') return [...new Set([...(rec.statusesBorderNB || []), ...(rec.statusesNB || [])])];
            return [...new Set([...(rec.statusesBorderSB || []), ...(rec.statusesSB || [])])];
        }

        return [];
    };

    window.populateUpdateStatusDropdown = function (selectEl, statusContext, trip, asset) {
        if (!selectEl) return;
        const labels = {
            pod: 'POD Status',
            asset: 'Asset Status',
            car: 'Car / Vehicle Status',
            nb: 'Area Status (NB)',
            sb: 'Area Status (SB)',
            border: 'Area Status (Border Clearance)'
        };
        const statuses = getStatusesForUpdateDropdown(statusContext, trip, asset);
        selectEl.innerHTML = '<option value="">No status change</option>';
        if (statuses.length) {
            const label = labels[statusContext] || 'Update Status';
            selectEl.innerHTML += `<optgroup label="${label}">` +
                statuses.map(s => `<option value="${s.replace(/"/g, '&quot;')}">${s}</option>`).join('') +
                '</optgroup>';
        }
    };

    window.inferStatusContextFromPage = function (page) {
        if (!page) return null;
        if (page === 'pod-management') return 'pod';
        if (page === 'nb-operations') return 'nb';
        if (page === 'sb-operations') return 'sb';
        if (page === 'position-live') return 'nb';
        if (page === 'assets') return 'asset';
        if (page === 'border-clearance' || page.includes('detail') || page.includes('kasumbalesa') ||
            page.includes('sakania') || page.includes('mokambo') || page.includes('whisky') || page.startsWith('sb-')) {
            return 'border';
        }
        return null;
    };

    /** @deprecated use getStatusesForUpdateDropdown */
    window.getStatusesForContext = function (trip) {
        const ctx = inferStatusContextFromPage(window.currentPage) || (trip?.direction === 'SB' ? 'sb' : 'nb');
        return getStatusesForUpdateDropdown(ctx, trip);
    };

    function pointMatches(point, area) {
        if (!point || !area) return false;
        return point.toLowerCase().includes(area.toLowerCase());
    }

    window.getStatusesForArea = function (areaName) {
        const rec = (window.areaStatusesDB || []).find(a => a.area === areaName);
        if (!rec) return [];
        return [...new Set([...(rec.statusesNB || []), ...(rec.statusesSB || [])])];
    };

    window.syncAdminUsersToInternalComm = function () {
        if (!window.adminUsersDB || !window.systemUsersDB) return;
        window.adminUsersDB.filter(u => u.status === 'active').forEach(au => {
            const displayName = au.username.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            const initials = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
            const existing = window.systemUsersDB.find(s => s.email === au.email);
            if (existing) {
                existing.name = displayName;
                existing.email = au.email;
                existing.initials = initials;
                existing.area = au.area;
            } else {
                window.systemUsersDB.push({
                    id: 'U-' + au.id, name: displayName, email: au.email,
                    role: window.getRoleById ? (window.getRoleById(au.roleId)?.name || 'User') : 'User',
                    area: au.area, initials, online: false, lastSeen: '—'
                });
            }
        });
        if (typeof window.getCurrentAdminUser === 'function') {
            const cu = window.getCurrentAdminUser();
            if (cu) {
                window.CURRENT_USER = cu.username.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                window.CURRENT_USER_EMAIL = cu.email;
            }
        }
    };

    window.parseCsvUpload = function (text) {
        const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) return [];
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        return lines.slice(1).map(line => {
            const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            const row = {};
            headers.forEach((h, i) => { row[h] = vals[i] || ''; });
            return row;
        });
    };

    window.processNbLiveUpload = async function (rows, fileName) {
        const results = { created: 0, updated: 0, errors: [] };
        for (const row of rows) {
            const tripNumber = row.TripNumber || row.tripNumber;
            const truck = row.Truck || row.truck;
            if (!tripNumber || !truck) { results.errors.push('Missing TripNumber or Truck'); continue; }
            try {
                if (typeof isApiAvailable === 'function' && isApiAvailable()) {
                    await uploadNbTrip({
                        tripNumber, truck,
                        driver: row.Driver || row.driver || 'TBD',
                        owner: row.OrderOwner || row.Owner || row.owner || 'Unknown',
                        area: row.Area || row.area || 'Kasumbalesa',
                        entryBorder: row.Border || row.EntryBorder || row.entryBorder || 'Kasumbalesa',
                        offloadingPoint: row.OffloadingPoint || row.offloadingPoint || '',
                        borderProcess: row.BorderProcess || row.borderProcess || 'KBP'
                    });
                    if (window.tripsDB[tripNumber]) mapLiveUploadFields(window.tripsDB[tripNumber], row);
                    results.created++;
                } else {
                    if (!window.tripsDB[tripNumber]) {
                        window.tripsDB[tripNumber] = mapLiveUploadFields({
                            tripNumber, truck, driver: row.Driver || 'TBD', direction: 'NB',
                            area: row.Area || 'Kasumbalesa', owner: row.Owner || row.OrderOwner || 'Unknown',
                            entryBorder: row.EntryBorder || row.Border || 'Kasumbalesa',
                            offloadingPoint: row.OffloadingPoint || '', status: row.Status || 'Border Clearance',
                            daysInDRC: 0, kpi: 'green', borderProcess: row.BorderProcess || 'KBP',
                            workflow: { border: 'current', kanyaka: 'pending', offloading: 'pending', pod: 'pending' },
                            positions: {}
                        }, row);
                        results.created++;
                    } else {
                        mapLiveUploadFields(window.tripsDB[tripNumber], row);
                        results.updated++;
                    }
                }
            } catch (e) { results.errors.push(`${tripNumber}: ${e.message}`); }
        }
        window.liveUploadsDB.unshift({
            id: 'LU-' + nextLiveUploadId++, type: 'NB', fileName, rowCount: rows.length,
            results, uploadedBy: window.getCurrentAdminUser?.()?.username || 'system',
            uploadedAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
        });
        if (typeof syncTripsFromApi === 'function' && isApiAvailable()) await syncTripsFromApi();
        return results;
    };

    window.processSbLiveUpload = async function (rows, fileName) {
        const results = { created: 0, updated: 0, errors: [] };
        for (const row of rows) {
            const tripNumber = row.TripNumber || row.tripNumber;
            const truck = row.Truck || row.truck;
            if (!tripNumber || !truck) continue;
            if (!window.tripsDB[tripNumber]) {
                window.tripsDB[tripNumber] = mapLiveUploadFields({
                    tripNumber, truck, driver: row.Driver || 'TBD', direction: 'SB',
                    area: row.Area || 'Kanyaka', owner: row.Owner || row.OrderOwner || 'Unknown',
                    loadingPoint: row.LoadingPoint || 'Kanyaka Mine', exitBorder: row.ExitBorder || row.Border || 'Kasumbalesa',
                    status: row.Status || 'Loading', daysInDRC: 0, kpi: 'green',
                    workflow: { loadingProcess: 'current', documents: 'pending', seal: 'pending', escort: 'pending', dispatch: 'pending', kanyaka: 'pending', border: 'pending' },
                    positions: {}
                }, row);
                results.created++;
            } else {
                mapLiveUploadFields(window.tripsDB[tripNumber], row);
                results.updated++;
            }
        }
        window.liveUploadsDB.unshift({
            id: 'LU-' + nextLiveUploadId++, type: 'SB', fileName, rowCount: rows.length,
            results, uploadedBy: window.getCurrentAdminUser?.()?.username || 'system',
            uploadedAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
        });
        return results;
    };

    window.getCurrentPositionSlot = function () {
        const h = new Date().getHours();
        if (h < 12) return 'morning';
        if (h < 17) return 'afternoon';
        return 'evening';
    };

    window.processPositionUpload = async function (rows, fileName, slot) {
        const useSlot = slot || getCurrentPositionSlot();
        const today = new Date().toISOString().slice(0, 10);
        const nbTrips = Object.values(window.tripsDB || {}).filter(t => t.direction === 'NB');
        const nbTrucks = new Set(nbTrips.map(t => t.truck.toUpperCase()));

        const matched = [];
        const unmatched = [];
        rows.forEach(row => {
            const tripNumber = row.TripNumber || row.tripNumber;
            const truck = (row.Truck || row.truck || '').toUpperCase();
            const trip = window.tripsDB[tripNumber] || nbTrips.find(t => t.truck.toUpperCase() === truck);
            const history = typeof getTripAreaHistory === 'function' ? getTripAreaHistory(trip?.tripNumber || tripNumber) : [];

            const positionText = row.Position || row.position ||
                ((row.Latitude || row.latitude) && (row.Longitude || row.longitude)
                    ? `${row.Latitude || row.latitude}, ${row.Longitude || row.longitude}` : '');

            const entry = {
                tripNumber: trip?.tripNumber || tripNumber,
                truck: row.Truck || row.truck,
                latitude: row.Latitude || row.latitude || '—',
                longitude: row.Longitude || row.longitude || '—',
                positionText,
                area: row.Area || row.area || trip?.area || '—',
                areaStatus: row.AreaStatus || row.areaStatus || trip?.areaStatus || '—',
                processComment: row.ProcessComment || row.processComment || '',
                timestamp: row.Timestamp || row.timestamp || new Date().toISOString().replace('T', ' ').slice(0, 19),
                areaUpdates: history,
                matched: !!(trip && (nbTrucks.has(truck) || trip.direction === 'NB'))
            };
            if (trip && positionText) {
                if (!trip.positions) trip.positions = {};
                trip.positions[useSlot] = positionText;
            }
            if (entry.matched) matched.push(entry);
            else unmatched.push(entry);
        });

        const upload = {
            id: 'POS-' + nextPositionUploadId++,
            slot: useSlot, slotLabel: POSITION_SLOT_LABELS[useSlot],
            date: today, fileName,
            matched, unmatched,
            uploadedBy: window.getCurrentAdminUser?.()?.username || 'system',
            uploadedAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
        };
        window.positionUploadsDB.unshift(upload);

        if (typeof isApiAvailable === 'function' && isApiAvailable()) {
            try {
                await apiRequest('/position-uploads', { method: 'POST', body: JSON.stringify(upload) });
            } catch (_) { /* local ok */ }
        }
        return upload;
    };

    window.wirePodStageAction = async function (tripNumber, stage) {
        const labels = { collected: 'Collected', scanned: 'Scanned', uploaded: 'Uploaded', sent_to_invoicing: 'Sent to Invoicing' };
        if (typeof isApiAvailable === 'function' && isApiAvailable()) {
            try {
                const trip = await advancePodStage(tripNumber, stage);
                if (typeof mergeTripIntoLocalDb === 'function') mergeTripIntoLocalDb(trip);
                const pod = window.podDB?.find(p => p.trip === tripNumber);
                if (pod) {
                    if (stage === 'collected') { pod.collected = true; pod.collectedOnTime = true; pod.collectedDate = new Date().toISOString().slice(0, 16).replace('T', ' '); }
                    if (stage === 'scanned') pod.scanned = true;
                    if (stage === 'uploaded') pod.uploaded = true;
                    if (stage === 'sent_to_invoicing') pod.sentToInvoicing = true;
                }
                if (typeof logAuditEvent === 'function') logAuditEvent(`POD ${labels[stage]}: ${tripNumber}`, tripNumber, 'pod', stage);
                if (typeof showToast === 'function') showToast(`POD ${labels[stage]} via API`, 'success');
                if (window.currentPage === 'pod-management' && typeof refreshPODTable === 'function') refreshPODTable();
                return true;
            } catch (e) {
                if (typeof showToast === 'function') showToast(e.message, 'warning');
                return false;
            }
        }
        const pod = window.podDB?.find(p => p.trip === tripNumber);
        if (pod) {
            if (stage === 'collected') { pod.collected = true; pod.collectedOnTime = true; }
            if (stage === 'scanned') pod.scanned = true;
            if (stage === 'uploaded') pod.uploaded = true;
            if (stage === 'sent_to_invoicing') pod.sentToInvoicing = true;
        }
        if (typeof showToast === 'function') showToast(`POD ${labels[stage]} (local)`, 'success');
        if (window.currentPage === 'pod-management' && typeof refreshPODTable === 'function') refreshPODTable();
        return true;
    };

    window.wireBorderStepComplete = async function (tripNumber, stepOrder) {
        if (typeof isApiAvailable === 'function' && isApiAvailable()) {
            try {
                const trip = await completeBorderStep(tripNumber, stepOrder);
                if (typeof mergeTripIntoLocalDb === 'function') mergeTripIntoLocalDb(trip);
                if (typeof showToast === 'function') showToast(`Border step ${stepOrder} completed via API`, 'success');
                if (window.currentPage) window.navigateTo(window.currentPage);
                return true;
            } catch (e) {
                if (typeof showToast === 'function') showToast(e.message, 'warning');
                return false;
            }
        }
        if (typeof showToast === 'function') showToast(`Border step ${stepOrder} marked complete (local)`, 'success');
        return true;
    };

    window.handleLiveUpload = async function () {
        const type = document.getElementById('uploadType')?.value || 'NB';
        const fileInput = document.getElementById('uploadFileInput');
        const file = fileInput?.files?.[0];
        if (!file) { if (typeof showToast === 'function') showToast('Select a file first', 'warning'); return; }

        const text = await file.text();
        const rows = parseCsvUpload(text);
        if (!rows.length) { if (typeof showToast === 'function') showToast('No data rows found', 'warning'); return; }

        let result;
        if (type === 'POSITION') {
            const slot = document.getElementById('positionSlot')?.value;
            result = await processPositionUpload(rows, file.name, slot);
            if (typeof showToast === 'function') showToast(`Position upload: ${result.matched.length} matched, ${result.unmatched.length} unmatched`, result.unmatched.length ? 'warning' : 'success');
        } else if (type === 'NB') {
            result = await processNbLiveUpload(rows, file.name);
            if (typeof showToast === 'function') showToast(`NB upload: ${result.created} created, ${result.updated} updated`, result.errors.length ? 'warning' : 'success');
        } else {
            result = await processSbLiveUpload(rows, file.name);
            if (typeof showToast === 'function') showToast(`SB upload: ${result.created} created, ${result.updated} updated`, 'success');
        }

        if (typeof closeModal === 'function') closeModal('uploadModal');
        if (type === 'POSITION' && window.currentPage === 'position-live') renderPositionLive(document.getElementById('contentArea'));
        else if ((type === 'NB' || type === 'SB') && window.currentPage === 'position-live') renderPositionLive(document.getElementById('contentArea'));
        else if (type === 'NB' && window.currentPage === 'nb-operations') window.navigateTo('nb-operations');
        else if (type === 'SB' && window.currentPage === 'sb-operations') window.navigateTo('sb-operations');
    };

    window.renderAdminUploadTemplates = function (container) {
        if (!window.canAccessAdminPage || !canAccessAdminPage('admin-upload-templates')) {
            container.innerHTML = '<div class="access-denied"><h2>Access Denied</h2><p>Upload Templates are restricted to Super Admin only.</p></div>';
            return;
        }
        container.innerHTML = `
            ${typeof renderAdminBreadcrumb === 'function' ? renderAdminBreadcrumb('Upload Templates') : ''}
            <div class="page-header admin-page-header">
                <div><h1>📤 Excel Upload Templates</h1><p class="page-subtitle">Define column templates for NB, SB, and Position (3× daily) live file uploads.</p></div>
            </div>
            ${Object.entries(uploadTemplatesDB).map(([key, tpl]) => `
                <div class="settings-card" style="margin-bottom:16px;">
                    <h3>${tpl.name} (${key})</h3>
                    <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;">${tpl.description}</p>
                    <div class="form-group"><label>Columns (comma-separated)</label>
                        <input type="text" class="form-control" id="tpl-cols-${key}" value="${tpl.columns.join(', ')}">
                    </div>
                    <button class="btn btn-primary btn-sm" onclick="saveUploadTemplate('${key}')">💾 Save Template</button>
                    <button class="btn btn-outline btn-sm" onclick="downloadTemplateCsv('${key}')">📥 Download CSV Template</button>
                </div>`).join('')}
            <div class="rbac-info-banner"><strong>NB / SB columns:</strong> Columns defined here are reflected in <em>Active NB Trucks</em> and <em>Active SB Trucks</em> tables and CSV exports. <strong>Position file:</strong> Upload 3× daily (morning 08:00, afternoon 14:00, evening 20:00). Trucks must match NB live file.</div>`;
    };

    window.saveUploadTemplate = function (key) {
        const el = document.getElementById('tpl-cols-' + key);
        if (!el) return;
        uploadTemplatesDB[key].columns = el.value.split(',').map(c => c.trim()).filter(Boolean);
        if (typeof logAuditEvent === 'function') logAuditEvent(`Updated upload template: ${key}`, key, 'template');
        if (typeof showToast === 'function') showToast(`Template ${key} saved — ${key === 'NB' || key === 'SB' ? 'operations table columns updated' : 'saved'}`, 'success');
        if (key === 'NB' && window.currentPage === 'nb-operations' && typeof refreshNBTable === 'function') refreshNBTable();
        else if (key === 'SB' && window.currentPage === 'sb-operations' && typeof refreshSBTable === 'function') refreshSBTable();
        else if (key === 'NB' && window.currentPage === 'nb-operations') window.navigateTo('nb-operations');
        else if (key === 'SB' && window.currentPage === 'sb-operations') window.navigateTo('sb-operations');
    };

    window.downloadTemplateCsv = function (key) {
        const tpl = uploadTemplatesDB[key];
        const csv = tpl.columns.join(',') + '\n';
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${key}_Live_Template.csv`;
        a.click();
    };

    let livePageDirectionFilter = 'NB';
    let livePageSearchTerm = '';

    window.refreshPositionLiveTable = function () {
        const body = document.getElementById('livePageTableBody');
        const head = document.getElementById('livePageTableHead');
        const countEl = document.getElementById('livePageTableCount');
        if (!body) return;
        const direction = document.getElementById('livePageDirectionFilter')?.value || livePageDirectionFilter || 'NB';
        livePageDirectionFilter = direction;
        const search = (document.getElementById('livePageSearch')?.value || livePageSearchTerm || '').toLowerCase();
        let trips = Object.values(window.tripsDB || {}).filter(t => t.direction === direction);
        if (search) {
            trips = trips.filter(t =>
                (t.tripNumber || '').toLowerCase().includes(search) ||
                (t.truck || '').toLowerCase().includes(search) ||
                (t.driver || '').toLowerCase().includes(search) ||
                (t.orderNo || '').toLowerCase().includes(search) ||
                (t.customer || '').toLowerCase().includes(search) ||
                (t.owner || '').toLowerCase().includes(search)
            );
        }
        if (head) head.innerHTML = `<tr>${renderLivePageTableHeader(direction)}</tr>`;
        body.innerHTML = renderLivePageTableRows(trips, direction);
        if (countEl) countEl.textContent = `${trips.length} truck${trips.length !== 1 ? 's' : ''}`;
        applyLiveTableLayout('livePageTable', getPositionLiveContextKey(direction));
    };

    window.renderPositionLive = function (container) {
        const today = new Date().toISOString().slice(0, 10);
        const todayUploads = positionUploadsDB.filter(p => p.date === today);
        const direction = livePageDirectionFilter || 'NB';
        const wfSteps = getLiveWorkflowSteps(direction);

        container.innerHTML = `
            <div class="page-header admin-page-header">
                <div>
                    <h1>📍 Position Live</h1>
                    <p class="page-subtitle">Master live operations view — ${direction === 'NB' ? 'Border → Kanyaka → Offloading → POD' : 'Loading → Documents → Seal → Escort → Dispatch → Kanyaka → Border Exit'}</p>
                </div>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <button class="btn btn-primary" onclick="openUploadModal('POSITION')">📤 Upload Position File</button>
                    <button class="btn btn-outline" onclick="openUploadModal('${direction}')">📤 Upload ${direction} Live File</button>
                </div>
            </div>
            ${typeof getAreaFilterBanner === 'function' ? getAreaFilterBanner() : ''}
            <div class="kpi-row">
                ${POSITION_SLOTS.map(slot => {
                    const up = todayUploads.find(u => u.slot === slot);
                    return `<div class="kpi-mini"><div class="kpi-value">${up ? up.matched.length : '—'}</div><div class="kpi-label">${POSITION_SLOT_LABELS[slot]}</div></div>`;
                }).join('')}
            </div>

            <div class="filters-bar">
                <div class="filter-group"><label>Direction:</label>
                    <select id="livePageDirectionFilter" onchange="refreshPositionLiveTable()">
                        <option value="NB"${direction === 'NB' ? ' selected' : ''}>NB — North Bound</option>
                        <option value="SB"${direction === 'SB' ? ' selected' : ''}>SB — South Bound</option>
                    </select>
                </div>
                <div class="search-filter" style="flex:1;">
                    <span>🔍</span>
                    <input type="text" id="livePageSearch" placeholder="Search trip, truck, driver, order, customer..." value="${livePageSearchTerm}" onkeyup="refreshPositionLiveTable()">
                </div>
                <button class="btn btn-outline btn-sm" onclick="livePageSearchTerm='';document.getElementById('livePageSearch').value='';refreshPositionLiveTable();">Clear</button>
            </div>

            <div class="table-container live-page-table-wrap">
                <div class="table-header">
                    <h3>Live Operations — ${direction}</h3>
                    <div class="table-header-actions" style="display:flex;align-items:center;gap:12px;">
                        ${renderLiveColumnToolbar(getPositionLiveContextKey(direction), 'livePageTable', '')}
                        <span id="livePageTableCount" style="color:var(--text-secondary);"></span>
                    </div>
                </div>
                <div style="overflow-x:auto;">
                    <table class="live-page-table" id="livePageTable">
                        <thead id="livePageTableHead"></thead>
                        <tbody id="livePageTableBody"></tbody>
                    </table>
                </div>
            </div>

            <div style="background:#edf2f7;padding:12px 16px;border-radius:8px;margin:16px 0;font-size:12px;">
                <strong>Workflow status dates (${direction}):</strong>
                ${wfSteps.map(s => s.label).join(' → ')} — dates appear as columns when recorded via status update + date in comments.
            </div>

            ${todayUploads.length ? todayUploads.map(up => `
                <div class="settings-card" style="margin-bottom:12px;">
                    <h4 style="margin:0 0 8px;">Today's ${up.slotLabel} upload — ${up.fileName} <small>(${up.matched.length} matched)</small></h4>
                    ${up.unmatched.length ? `<p style="color:var(--orange);font-size:12px;">⚠️ ${up.unmatched.length} trucks not matched</p>` : ''}
                </div>`).join('') : '<p style="padding:12px;color:var(--text-secondary);font-size:13px;">No position uploads today. Upload NB live file first, then position 3× daily (08:00, mid day, evening).</p>'}

            <div class="settings-card"><h3>Recent Live Uploads (NB/SB)</h3>
                ${liveUploadsDB.slice(0, 5).map(u => `<div style="padding:8px 0;border-bottom:1px solid var(--border);font-size:13px;">
                    <strong>${u.type}</strong> ${u.fileName} — ${u.rowCount} rows — ${u.uploadedAt} by ${u.uploadedBy}
                </div>`).join('') || '<em>No uploads yet</em>'}
            </div>`;
        refreshPositionLiveTable();
    };

    window.openUploadModal = function (direction) {
        const uploadType = document.getElementById('uploadType');
        const title = document.getElementById('uploadModalTitle');
        const posSlot = document.getElementById('positionSlotGroup');
        const tplHint = document.getElementById('uploadTemplateHint');
        if (uploadType) uploadType.value = direction || 'NB';
        if (title) title.textContent = direction === 'POSITION' ? '📤 Upload Position File' : `📤 Upload ${direction || 'NB'} Live Data`;
        if (posSlot) posSlot.style.display = direction === 'POSITION' ? 'block' : 'none';
        const key = direction === 'POSITION' ? 'POSITION' : (direction || 'NB');
        if (tplHint && uploadTemplatesDB[key]) {
            tplHint.innerHTML = `<strong>Template columns:</strong> ${uploadTemplatesDB[key].columns.join(', ')} <button class="btn btn-outline btn-sm" onclick="downloadTemplateCsv('${key}')">Download</button>`;
        }
        if (typeof openModal === 'function') openModal('uploadModal');
        const uploadTypeEl = document.getElementById('uploadType');
        if (uploadTypeEl && !uploadTypeEl._bound) {
            uploadTypeEl._bound = true;
            uploadTypeEl.addEventListener('change', function () {
                const posSlot = document.getElementById('positionSlotGroup');
                const key = this.value;
                if (posSlot) posSlot.style.display = key === 'POSITION' ? 'block' : 'none';
                const tplHint = document.getElementById('uploadTemplateHint');
                if (tplHint && uploadTemplatesDB[key]) {
                    tplHint.innerHTML = `<strong>Template columns:</strong> ${uploadTemplatesDB[key].columns.join(', ')} <button class="btn btn-outline btn-sm" onclick="downloadTemplateCsv('${key}')">Download</button>`;
                }
            });
        }
    };

})();
