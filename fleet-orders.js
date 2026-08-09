/**
 * Client Orders, Fleet Registry (truck + trailer + driver), and Order Allocation
 */
(function () {
    const STORAGE_KEY = 'truckcontrol_fleet_orders_v1';

    let clientsDB = [];
    let fleetDriversDB = [];
    let fleetUnitsDB = [];
    let trucksDB = [];
    let trailersDB = [];
    let clientOrdersDB = [];
    let orderAllocationsDB = [];

    function defaultOrderFilter() {
        const today = new Date();
        const sixMonthsAgo = new Date(today);
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const fmt = d => d.toISOString().slice(0, 10);
        return {
            orderRef: '', impExpNo: '', customerRef: '',
            shipper: 'all', consignee: 'all', invoiceParty: 'all',
            fromCountry: 'all', fromStation: 'all', loadingPoint: 'all',
            toCountry: 'all', toStation: 'all', offloadingPoint: 'all',
            containerNo: '', commodity: 'all', status: 'all',
            orderOwner: 'all', fromDate: fmt(sixMonthsAgo), toDate: fmt(today),
            cargoType: 'all', invCurrency: 'all',
            urgentOnly: false, incViaStations: false
        };
    }

    function uniqueOrderValues(key, nestedKey) {
        const vals = new Set();
        clientOrdersDB.forEach(o => {
            let v = nestedKey ? (o.loadDetails || {})[nestedKey] : o[key];
            if (v) vals.add(v);
        });
        return Array.from(vals).sort();
    }

    function getStations() {
        if (typeof getRouteCatalogStations === 'function') return getRouteCatalogStations();
        return ROUTE_STATIONS.map(s => ({ ...s, countryCode: s.country, loadingPoints: s.loadingPoints || [], offloadingPoints: s.offloadingPoints || [] }));
    }

    function routeCountries() {
        if (typeof getRouteCatalogCountries === 'function') {
            const c = getRouteCatalogCountries();
            if (c.length) return c;
        }
        const map = new Map();
        getStations().forEach(s => map.set(s.countryCode || s.country, s.countryName));
        return Array.from(map.entries()).map(([code, name]) => ({ code, name }));
    }

    function stationsForCountry(countryCode) {
        if (typeof stationsForRouteCountry === 'function') return stationsForRouteCountry(countryCode);
        const stations = getStations();
        if (!countryCode || countryCode === 'all') return stations;
        return stations.filter(s => (s.countryCode || s.country) === countryCode);
    }

    function loadingPointsList(countryCode, stationName) {
        const points = new Set();
        getStations().forEach(s => {
            const cc = s.countryCode || s.country;
            if (countryCode !== 'all' && cc !== countryCode) return;
            if (stationName !== 'all' && s.name !== stationName) return;
            (s.loadingPoints || []).forEach(p => points.add(p));
        });
        clientOrdersDB.forEach(o => { if (o.loadingPoint) points.add(o.loadingPoint); });
        return Array.from(points).sort();
    }

    function offloadingPointsList(countryCode, stationName) {
        const points = new Set();
        getStations().forEach(s => {
            const cc = s.countryCode || s.country;
            if (countryCode !== 'all' && cc !== countryCode) return;
            if (stationName !== 'all' && s.name !== stationName) return;
            (s.offloadingPoints || []).forEach(p => points.add(p));
        });
        clientOrdersDB.forEach(o => { if (o.offloadingPoint) points.add(o.offloadingPoint); });
        return Array.from(points).sort();
    }

    function filterOpt(value, label, selected) {
        return `<option value="${value}"${value === selected ? ' selected' : ''}>${label}</option>`;
    }

    function renderOrderFilterPanel() {
        const f = orderFilter;
        const countries = routeCountries();
        const fromStations = stationsForCountry(f.fromCountry);
        const toStations = stationsForCountry(f.toCountry);
        const commodities = uniqueOrderValues('commodity');
        const shipperSet = new Set([...uniqueOrderValues('shipper'), ...clientsDB.map(c => c.name)]);
        const shippers = Array.from(shipperSet).filter(Boolean).sort();
        const consignees = uniqueOrderValues('consignee');
        const invoiceParties = uniqueOrderValues('invoiceParty');
        const loadPoints = loadingPointsList(f.fromCountry, f.fromStation);
        const offloadPoints = offloadingPointsList(f.toCountry, f.toStation);

        return `
            <div class="co-filter-panel">
                <div class="co-filter-title">ORDER ENTRY — Search &amp; Filter</div>
                <div class="co-filter-grid">
                    <div class="co-filter-col">
                        <div class="co-filter-field"><label>Order Ref.</label><input class="form-control" id="coFiltOrderRef" value="${f.orderRef}" placeholder="GG-15776"></div>
                        <div class="co-filter-field"><label>Imp/Exp No.</label><input class="form-control" id="coFiltImpExpNo" value="${f.impExpNo}" placeholder="IMP / EXP / DOM"></div>
                        <div class="co-filter-field"><label>Customer Ref</label><input class="form-control" id="coFiltCustomerRef" value="${f.customerRef}"></div>
                        <div class="co-filter-field"><label>Shipper/Customer</label><select class="form-control" id="coFiltShipper">${filterOpt('all', 'ALL', f.shipper)}${shippers.map(s => filterOpt(s, s, f.shipper)).join('')}</select></div>
                        <div class="co-filter-field"><label>Consignee</label><select class="form-control" id="coFiltConsignee">${filterOpt('all', 'ALL', f.consignee)}${consignees.map(s => filterOpt(s, s, f.consignee)).join('')}</select></div>
                        <div class="co-filter-field"><label>Invoice Party</label><select class="form-control" id="coFiltInvoiceParty">${filterOpt('all', 'ALL', f.invoiceParty)}${invoiceParties.map(s => filterOpt(s, s, f.invoiceParty)).join('')}</select></div>
                    </div>
                    <div class="co-filter-col">
                        <div class="co-filter-field"><label>From Country</label><select class="form-control" id="coFiltFromCountry" onchange="fleetOrderFilterCountryChange('from')">${filterOpt('all', '<ALL>', f.fromCountry)}${countries.map(c => filterOpt(c.code, c.name, f.fromCountry)).join('')}</select></div>
                        <div class="co-filter-field"><label>From Station</label><select class="form-control" id="coFiltFromStation">${filterOpt('all', '<ALL>', f.fromStation)}${fromStations.map(s => filterOpt(s.name, s.name, f.fromStation)).join('')}</select></div>
                        <div class="co-filter-field"><label>Loading Point</label><select class="form-control" id="coFiltLoadingPoint">${filterOpt('all', '<ALL>', f.loadingPoint)}${loadPoints.map(p => filterOpt(p, p, f.loadingPoint)).join('')}</select></div>
                        <div class="co-filter-field"><label>To Country</label><select class="form-control" id="coFiltToCountry" onchange="fleetOrderFilterCountryChange('to')">${filterOpt('all', '<ALL>', f.toCountry)}${countries.map(c => filterOpt(c.code, c.name, f.toCountry)).join('')}</select></div>
                        <div class="co-filter-field"><label>To Station</label><select class="form-control" id="coFiltToStation">${filterOpt('all', '<ALL>', f.toStation)}${toStations.map(s => filterOpt(s.name, s.name, f.toStation)).join('')}</select></div>
                        <div class="co-filter-field"><label>Offloading Point</label><select class="form-control" id="coFiltOffloadingPoint">${filterOpt('all', '<ALL>', f.offloadingPoint)}${offloadPoints.map(p => filterOpt(p, p, f.offloadingPoint)).join('')}</select></div>
                    </div>
                    <div class="co-filter-col">
                        <div class="co-filter-field"><label>Container No.</label><input class="form-control" id="coFiltContainerNo" value="${f.containerNo}"></div>
                        <div class="co-filter-field"><label>Commodity</label><select class="form-control" id="coFiltCommodity">${filterOpt('all', '<ALL>', f.commodity)}${commodities.map(c => filterOpt(c, c, f.commodity)).join('')}</select></div>
                        <div class="co-filter-field"><label>Status</label><select class="form-control" id="coFiltStatus">${filterOpt('all', 'ALL', f.status)}${['draft', 'confirmed', 'allocated', 'in_transit', 'completed', 'cancelled'].map(s => filterOpt(s, s, f.status)).join('')}</select></div>
                        <div class="co-filter-field"><label>Order Owner</label><select class="form-control" id="coFiltOrderOwner">${filterOpt('all', 'ALL', f.orderOwner)}${uniqueOrderValues('createdBy').map(o => filterOpt(o, o, f.orderOwner)).join('')}<option value="Greendoor Group"${f.orderOwner === 'Greendoor Group' ? ' selected' : ''}>Greendoor Group</option></select></div>
                        <div class="co-filter-field"><label>From Date</label><input type="date" class="form-control" id="coFiltFromDate" value="${f.fromDate}"></div>
                        <div class="co-filter-field"><label>To Date</label><input type="date" class="form-control" id="coFiltToDate" value="${f.toDate}"></div>
                    </div>
                    <div class="co-filter-col">
                        <div class="co-filter-field"><label>Cargo Type</label><select class="form-control" id="coFiltCargoType">${filterOpt('all', '<ALL>', f.cargoType)}${CARGO_TYPES.map(t => filterOpt(t, t, f.cargoType)).join('')}</select></div>
                        <div class="co-filter-field"><label>Inv Currency</label><select class="form-control" id="coFiltInvCurrency">${filterOpt('all', '<ALL>', f.invCurrency)}${filterOpt('USD', 'United States Dollar', f.invCurrency)}${filterOpt('ZAR', 'South African Rand', f.invCurrency)}${filterOpt('CDF', 'Congolese Franc', f.invCurrency)}</select></div>
                        <div class="co-filter-actions-stack">
                            <button type="button" class="btn btn-outline btn-sm" onclick="fleetOrderToggleTonnage()">${orderShowTonnageDetails ? '✓ ' : ''}Show Tonnage Details</button>
                        </div>
                    </div>
                    <div class="co-filter-col co-filter-col-actions">
                        <label class="co-filter-check"><input type="checkbox" id="coFiltUrgent"${f.urgentOnly ? ' checked' : ''}> Urgent / Priority</label>
                        <label class="co-filter-check"><input type="checkbox" id="coFiltViaStations"${f.incViaStations ? ' checked' : ''}> Inc Via Stations</label>
                        <div class="co-filter-btn-row">
                            <button type="button" class="btn btn-primary" onclick="fleetOrderFetch()">🔍 Fetch</button>
                            <button type="button" class="btn btn-outline" onclick="fleetOrderClearFilters()">↺ Clear All</button>
                        </div>
                    </div>
                </div>
            </div>`;
    }

    function readOrderFilterFromForm() {
        return {
            orderRef: document.getElementById('coFiltOrderRef')?.value.trim() || '',
            impExpNo: document.getElementById('coFiltImpExpNo')?.value.trim() || '',
            customerRef: document.getElementById('coFiltCustomerRef')?.value.trim() || '',
            shipper: document.getElementById('coFiltShipper')?.value || 'all',
            consignee: document.getElementById('coFiltConsignee')?.value || 'all',
            invoiceParty: document.getElementById('coFiltInvoiceParty')?.value || 'all',
            fromCountry: document.getElementById('coFiltFromCountry')?.value || 'all',
            fromStation: document.getElementById('coFiltFromStation')?.value || 'all',
            loadingPoint: document.getElementById('coFiltLoadingPoint')?.value || 'all',
            toCountry: document.getElementById('coFiltToCountry')?.value || 'all',
            toStation: document.getElementById('coFiltToStation')?.value || 'all',
            offloadingPoint: document.getElementById('coFiltOffloadingPoint')?.value || 'all',
            containerNo: document.getElementById('coFiltContainerNo')?.value.trim() || '',
            commodity: document.getElementById('coFiltCommodity')?.value || 'all',
            status: document.getElementById('coFiltStatus')?.value || 'all',
            orderOwner: document.getElementById('coFiltOrderOwner')?.value || 'all',
            fromDate: document.getElementById('coFiltFromDate')?.value || '',
            toDate: document.getElementById('coFiltToDate')?.value || '',
            cargoType: document.getElementById('coFiltCargoType')?.value || 'all',
            invCurrency: document.getElementById('coFiltInvCurrency')?.value || 'all',
            urgentOnly: document.getElementById('coFiltUrgent')?.checked || false,
            incViaStations: document.getElementById('coFiltViaStations')?.checked || false
        };
    }

    window.fleetOrderFetch = function () {
        orderFilter = readOrderFilterFromForm();
        orderFilterApplied = true;
        const ca = document.getElementById('contentArea');
        if (currentPage === 'client-orders' && ca) renderClientOrders(ca);
        if (typeof showToast === 'function') showToast('Filters applied', 'success');
    };

    window.fleetOrderClearFilters = function () {
        orderFilter = defaultOrderFilter();
        orderFilterApplied = false;
        orderShowTonnageDetails = false;
        const ca = document.getElementById('contentArea');
        if (currentPage === 'client-orders' && ca) renderClientOrders(ca);
    };

    window.fleetOrderToggleTonnage = function () {
        orderShowTonnageDetails = !orderShowTonnageDetails;
        const ca = document.getElementById('contentArea');
        if (currentPage === 'client-orders' && ca) renderClientOrders(ca);
    };

    window.fleetOrderFilterCountryChange = function (side) {
        if (side === 'from') {
            const el = document.getElementById('coFiltFromStation');
            if (el) el.value = 'all';
        } else {
            const el = document.getElementById('coFiltToStation');
            if (el) el.value = 'all';
        }
        orderFilter = readOrderFilterFromForm();
        const ca = document.getElementById('contentArea');
        if (currentPage === 'client-orders' && ca) {
            const panel = document.querySelector('.co-filter-panel');
            if (panel) panel.outerHTML = renderOrderFilterPanel();
        }
    };

    let orderFilter = defaultOrderFilter();
    let orderFilterApplied = false;
    let orderShowTonnageDetails = false;
    let fleetFilter = { search: '', status: 'all' };
    let fleetRegistryTab = 'sets';
    let clientOrderFormTab = 'header';

    const CLEARING_AGENTS = [
        'Jean Kalenga Clearing', 'Mukendi Logistics', 'Border Express DRC',
        'Kasumbalesa Agents Ltd', 'Sakania Clearance Co', 'Whisky Process Agents'
    ];

    const CARGO_TYPES = ['OOG', 'Container', 'Bulk Loose', 'Break Bulk', 'Bulk Liquid'];
    const BULK_CARGO_TYPES = ['Bulk Loose', 'Break Bulk', 'Bulk Liquid'];
    const BREAKBULK_PACKING_UNITS = [
        '0.0721 KG CARTONS', '0.17 KG BAGS', '0.5KG PLASTIC ITEM', '1 KG EMPTY', 'BAGS', 'CARTONS', 'PALLETS'
    ];
    const OOG_TYPES = [
        { value: 'Open top/flat rack (containerized)', hint: 'OOG cargo loaded on truck together with flat rack/open top container.' },
        { value: 'Breakbulk (Container Unpacked)', hint: 'Cargo arrives in open top/flat rack but unpacked in port — only cargo on truck.' },
        { value: 'Breakbulk (not containerized)', hint: 'Cargo loaded/offloaded without container (e.g. Ro-Ro vehicles).' }
    ];

    function uid(prefix) {
        return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    }

    const ROUTE_STATIONS = [
        { id: 'durban', name: 'Durban', country: 'ZA', countryName: 'South Africa', loadingPoints: ['Durban Port', 'Clayville'] },
        { id: 'johannesburg', name: 'Johannesburg', country: 'ZA', countryName: 'South Africa', loadingPoints: ['City Deep', 'Johannesburg Depot'] },
        { id: 'ndola', name: 'Ndola', country: 'ZM', countryName: 'Zambia', loadingPoints: ['Ndola Depot'], offloadingPoints: ['Ndola Mine'] },
        { id: 'lusaka', name: 'Lusaka', country: 'ZM', countryName: 'Zambia', loadingPoints: ['Lusaka Hub'], offloadingPoints: ['Lusaka Depot'] },
        { id: 'kasumbalesa', name: 'Kasumbalesa', country: 'CD', countryName: 'DRC', loadingPoints: ['Kasumbalesa Border'], offloadingPoints: ['Kasumbalesa Yard'] },
        { id: 'lubumbashi', name: 'Lubumbashi', country: 'CD', countryName: 'DRC', loadingPoints: ['Lubumbashi Depot', 'Kamoto'], offloadingPoints: ['Lubumbashi Mine'] },
        { id: 'kolwezi', name: 'Kolwezi', country: 'CD', countryName: 'DRC', loadingPoints: ['Kolwezi Hub'], offloadingPoints: ['Kolwezi Mine', 'Mutanda'] },
        { id: 'likasi', name: 'Likasi', country: 'CD', countryName: 'DRC', offloadingPoints: ['Likasi Depot', 'Likasi Plant'] },
        { id: 'dar', name: 'Dar es Salaam', country: 'TZ', countryName: 'Tanzania', loadingPoints: ['Dar Port', 'Dar Depot'] },
        { id: 'kanyaka', name: 'Kanyaka', country: 'CD', countryName: 'DRC', loadingPoints: ['Kanyaka Mine'], offloadingPoints: ['Kanyaka Depot'] },
        { id: 'beira', name: 'Beira', country: 'MZ', countryName: 'Mozambique', loadingPoints: ['Beira Access World', 'Beira Port'] }
    ];

    const INTERNATIONAL_ROUTES = {
        'ZA-CD': { entryBorder: 'Kasumbalesa', viaBorder1: '', viaBorder2: '', portOfEntry: 'Durban Port', exitBorder: '' },
        'TZ-CD': { entryBorder: 'Kasumbalesa', viaBorder1: 'Sakania', viaBorder2: '', portOfEntry: 'Dar Port', exitBorder: '' },
        'ZM-CD': { entryBorder: 'Kasumbalesa', viaBorder1: '', viaBorder2: '', portOfEntry: '', exitBorder: '' },
        'CD-ZA': { entryBorder: '', viaBorder1: '', viaBorder2: '', portOfEntry: '', exitBorder: 'Kasumbalesa' },
        'CD-ZM': { entryBorder: '', viaBorder1: '', viaBorder2: '', portOfEntry: '', exitBorder: 'Kasumbalesa' },
        'CD-TZ': { entryBorder: '', viaBorder1: 'Sakania', viaBorder2: '', portOfEntry: '', exitBorder: 'Kasumbalesa' },
        'MZ-CD': { entryBorder: 'Kasumbalesa', viaBorder1: 'Forbes/Machipanda', viaBorder2: 'Chirundu', portOfEntry: '', exitBorder: 'Forbes/Machipanda' }
    };

    function stationOptions(selectedId, countryCode) {
        const stations = countryCode ? stationsForCountry(countryCode) : getStations();
        const empty = `<option value=""${!selectedId ? ' selected' : ''}>— Select station —</option>`;
        return empty + stations.map(s =>
            `<option value="${s.id}"${s.id === selectedId ? ' selected' : ''}>${s.name} (${s.countryName || s.countryCode || s.country})</option>`
        ).join('');
    }

    function pointOptions(points, selected) {
        const empty = `<option value=""${!selected ? ' selected' : ''}>— Select point —</option>`;
        return empty + (points || []).map(p => `<option value="${p}"${p === selected ? ' selected' : ''}>${p}</option>`).join('');
    }

    function getStationById(id) {
        if (typeof getRouteCatalogStationById === 'function') {
            const s = getRouteCatalogStationById(id);
            if (s) return s;
        }
        return getStations().find(s => s.id === id) || null;
    }

    function resolveOrderRoute(originId, destId) {
        if (typeof resolveRouteFromCatalog === 'function') {
            const r = resolveRouteFromCatalog(originId, destId);
            if (r.origin) return r;
        }
        const origin = getStationById(originId);
        const dest = getStationById(destId);
        if (!origin || !dest) {
            return { routeType: 'domestic', showBorders: false, originCountry: '', destinationCountry: '', loadingPoints: [], offloadingPoints: [] };
        }
        const oc = origin.countryCode || origin.country;
        const dc = dest.countryCode || dest.country;
        const base = {
            origin: origin.name, destination: dest.name,
            originCountry: oc, destinationCountry: dc,
            loadingPoints: origin.loadingPoints || [], offloadingPoints: dest.offloadingPoints || [],
            loadingPoint: (origin.loadingPoints || [])[0] || origin.name,
            offloadingPoint: (dest.offloadingPoints || [])[0] || dest.name
        };
        if (oc === dc) {
            return { ...base, routeType: 'domestic', showBorders: false, entryBorder: '', viaBorder1: '', viaBorder2: '', portOfEntry: '', exitBorder: '' };
        }
        const routeKey = `${oc}-${dc}`;
        const intl = INTERNATIONAL_ROUTES[routeKey] || { entryBorder: 'Kasumbalesa', viaBorder1: '', viaBorder2: '', portOfEntry: (origin.loadingPoints || [])[0] || '', exitBorder: 'Kasumbalesa' };
        return { ...base, ...intl, routeType: 'international', showBorders: true };
    }

    function routeSummary(o) {
        if (o.routeType === 'domestic' || (!o.entryBorder && !o.exitBorder)) {
            return `${o.origin || '—'} → ${o.destination || '—'} <span class="status-badge green" style="font-size:10px;">Same country</span>`;
        }
        const parts = [o.entryBorder, o.viaBorder1, o.viaBorder2, o.exitBorder].filter(Boolean);
        return `${o.origin || '—'} → ${parts.join(' → ') || 'Border'} → ${o.destination || '—'}`;
    }

    function loadTypeLabel(o) {
        const ld = o.loadDetails || {};
        const parts = [o.cargoType];
        if (o.cargoType === 'OOG' && ld.oogType) parts.push(ld.oogType.split('(')[0].trim());
        else if (o.cargoType === 'Bulk Liquid' && ld.litre) parts.push(`${ld.litre}L`);
        else if (o.cargoType === 'Break Bulk' && ld.packingUnit) parts.push(ld.packingUnit.split(' ').slice(-1)[0]);
        else if (ld.orderLoadType) parts.push(ld.orderLoadType);
        return parts.filter(Boolean).join(' / ') || '—';
    }

    window.onClientOrderCargoTypeChange = function () {
        const cargoType = document.getElementById('coFormCargoType')?.value || '';
        const oogRow = document.getElementById('coOogTypeRow');
        const containerSec = document.getElementById('coContainerSection');
        const bulkSec = document.getElementById('coBulkSection');
        const oogDetailsSec = document.getElementById('coOogDetailsSection');
        const litreRow = document.getElementById('coBulkLiquidRow');
        const breakBulkRow = document.getElementById('coBreakBulkRow');
        const bulkTitle = document.getElementById('coBulkSectionTitle');
        if (oogRow) oogRow.style.display = cargoType === 'OOG' ? 'block' : 'none';
        if (containerSec) containerSec.style.display = (cargoType === 'Container' || cargoType === 'OOG') ? 'block' : 'none';
        if (bulkSec) bulkSec.style.display = BULK_CARGO_TYPES.includes(cargoType) ? 'block' : 'none';
        if (oogDetailsSec) oogDetailsSec.style.display = cargoType === 'OOG' ? 'block' : 'none';
        if (litreRow) litreRow.style.display = cargoType === 'Bulk Liquid' ? 'block' : 'none';
        if (breakBulkRow) breakBulkRow.style.display = cargoType === 'Break Bulk' ? 'block' : 'none';
        if (bulkTitle) {
            const titles = {
                'Bulk Loose': 'Bulk Loose — weight & tonnage',
                'Break Bulk': 'Break Bulk — packing units & quantities',
                'Bulk Liquid': 'Bulk Liquid — litres, weight & tank loads'
            };
            bulkTitle.textContent = titles[cargoType] || 'Load quantities';
        }
    };

    window.onClientOrderOogTypeChange = function () {
        const sel = document.getElementById('coFormOogType');
        const hint = document.getElementById('coOogTypeHint');
        if (!sel || !hint) return;
        const match = OOG_TYPES.find(t => t.value === sel.value);
        hint.textContent = match?.hint || '';
    };

    window.addContainerLine = function () {
        const tbody = document.getElementById('coContainerLinesBody');
        if (!tbody) return;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input class="form-control" placeholder="CONT-123" data-field="containerNo"></td>
            <td><input class="form-control" placeholder="40HC" data-field="containerType"></td>
            <td><input class="form-control" type="number" step="0.001" data-field="contTare" placeholder="0.000"></td>
            <td><input class="form-control" type="number" step="0.01" data-field="nettWt"></td>
            <td><input class="form-control" type="number" step="0.01" data-field="grossWt"></td>
            <td><input class="form-control" data-field="sealNo"></td>
            <td><label><input type="checkbox" data-field="oog"> OOG</label> <label><input type="checkbox" data-field="genset"> Genset</label></td>
            <td><button type="button" class="btn btn-sm btn-outline" onclick="this.closest('tr').remove()">✕</button></td>`;
        tbody.appendChild(row);
    };

    window.openContainerDetailsModal = function () {
        const lines = collectContainerLines();
        const ld = {};
        const body = document.getElementById('containerDetailsModalBody');
        if (!body) return;
        body.innerHTML = `
            <div class="form-grid-3">
                <div class="form-group"><label>Container Type</label><select class="form-control" id="cdContainerType"><option>20GP</option><option>40HC</option><option>40FR</option><option>20OT</option><option>40OT</option></select></div>
                <div class="form-group"><label>Cont Tare</label><input class="form-control" id="cdContTare" type="number" step="0.001" value="0.000"></div>
                <div class="form-group"><label>Qty</label><input class="form-control" id="cdQty" type="number" value="1"></div>
            </div>
            <div class="form-grid-3">
                <div class="form-group"><label>Nett Wt</label><input class="form-control" id="cdNettWt" type="number" step="0.001" value="0.000"></div>
                <div class="form-group"><label>Gross Wt</label><input class="form-control" id="cdGrossWt" type="number" step="0.001" value="0.000"></div>
                <div class="form-group"><label>Load Type</label><input class="form-control" id="cdLoadType" placeholder="FCL / LCL"></div>
            </div>
            <div class="form-grid-2">
                <div class="form-group"><label>Container No</label><input class="form-control" id="cdContainerNo"></div>
                <div class="form-group"><label>Seal No</label><input class="form-control" id="cdSealNo"></div>
            </div>
            <div class="form-group"><label>Instructions To OPS</label><textarea class="form-control" id="cdInstrOps" rows="2"></textarea></div>
            <div class="form-grid-3" style="margin:12px 0;">
                <label><input type="checkbox" id="cdGenset"> Genset Required</label>
                <label><input type="checkbox" id="cdFuel"> Fuel to be supplied</label>
                <label><input type="checkbox" id="cdSoc"> Shipper Owned Container</label>
                <label><input type="checkbox" id="cdOog" checked> OOG</label>
                <label><input type="checkbox" id="cdUnpacked"> Unpacked in port</label>
                <label><input type="checkbox" id="cdExport"> Export/Empties</label>
            </div>
            <div class="form-grid-2">
                <div class="form-group"><label>Empty Container Drop Off</label><input class="form-control" id="cdDropOff"></div>
                <div class="form-group"><label>Empty Container Depot</label><input class="form-control" id="cdDepot"></div>
            </div>
            <p style="font-size:12px;color:var(--text-secondary);">Existing lines: ${lines.length}. Click Apply to add this container to the order lines table.</p>`;
        openModal('containerDetailsModal');
    };

    window.applyContainerDetailsModal = function () {
        const tbody = document.getElementById('coContainerLinesBody');
        if (!tbody) { closeModal('containerDetailsModal'); return; }
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input class="form-control" value="${document.getElementById('cdContainerNo')?.value || ''}" data-field="containerNo"></td>
            <td><input class="form-control" value="${document.getElementById('cdContainerType')?.value || ''}" data-field="containerType"></td>
            <td><input class="form-control" type="number" step="0.001" value="${document.getElementById('cdContTare')?.value || ''}" data-field="contTare"></td>
            <td><input class="form-control" type="number" step="0.01" value="${document.getElementById('cdNettWt')?.value || ''}" data-field="nettWt"></td>
            <td><input class="form-control" type="number" step="0.01" value="${document.getElementById('cdGrossWt')?.value || ''}" data-field="grossWt"></td>
            <td><input class="form-control" value="${document.getElementById('cdSealNo')?.value || ''}" data-field="sealNo"></td>
            <td><label><input type="checkbox" data-field="oog"${document.getElementById('cdOog')?.checked ? ' checked' : ''}> OOG</label> <label><input type="checkbox" data-field="genset"${document.getElementById('cdGenset')?.checked ? ' checked' : ''}> Genset</label></td>
            <td><button type="button" class="btn btn-sm btn-outline" onclick="this.closest('tr').remove()">✕</button></td>`;
        tbody.appendChild(row);
        const instr = document.getElementById('cdInstrOps')?.value;
        if (instr) {
            const el = document.getElementById('coFormOogInstr');
            if (el) el.value = instr;
        }
        closeModal('containerDetailsModal');
        if (typeof showToast === 'function') showToast('Container line added', 'success');
    };

    function collectContainerLines() {
        const rows = document.querySelectorAll('#coContainerLinesBody tr');
        return Array.from(rows).map((row, i) => ({
            slNo: i + 1,
            containerNo: row.querySelector('[data-field="containerNo"]')?.value.trim() || '',
            containerType: row.querySelector('[data-field="containerType"]')?.value.trim() || '',
            contTare: row.querySelector('[data-field="contTare"]')?.value || '',
            nettWt: row.querySelector('[data-field="nettWt"]')?.value || '',
            grossWt: row.querySelector('[data-field="grossWt"]')?.value || '',
            sealNo: row.querySelector('[data-field="sealNo"]')?.value.trim() || '',
            oog: row.querySelector('[data-field="oog"]')?.checked || false,
            genset: row.querySelector('[data-field="genset"]')?.checked || false
        })).filter(r => r.containerNo || r.containerType);
    }

    function renderContainerLines(lines) {
        return (lines || []).map((c, i) => `
            <tr>
                <td><input class="form-control" value="${c.containerNo || ''}" data-field="containerNo"></td>
                <td><input class="form-control" value="${c.containerType || ''}" data-field="containerType"></td>
                <td><input class="form-control" type="number" step="0.001" value="${c.contTare || ''}" data-field="contTare"></td>
                <td><input class="form-control" type="number" step="0.01" value="${c.nettWt || ''}" data-field="nettWt"></td>
                <td><input class="form-control" type="number" step="0.01" value="${c.grossWt || ''}" data-field="grossWt"></td>
                <td><input class="form-control" value="${c.sealNo || ''}" data-field="sealNo"></td>
                <td><label><input type="checkbox" data-field="oog"${c.oog ? ' checked' : ''}> OOG</label> <label><input type="checkbox" data-field="genset"${c.genset ? ' checked' : ''}> Genset</label></td>
                <td><button type="button" class="btn btn-sm btn-outline" onclick="this.closest('tr').remove()">✕</button></td>
            </tr>`).join('');
    }

    window.onClientOrderRouteTemplateChange = function () {
        const tplId = document.getElementById('coFormRouteTemplate')?.value;
        if (!tplId) return;
        const templates = typeof getRouteCatalogTemplates === 'function' ? getRouteCatalogTemplates() : [];
        const tpl = templates.find(t => t.id === tplId);
        if (!tpl) return;
        const origin = getStationById(tpl.originStationId);
        const dest = getStationById(tpl.destinationStationId);
        if (origin) {
            document.getElementById('coFormOriginCountry').value = origin.countryCode || origin.country || '';
            document.getElementById('coFormOriginStation').innerHTML = stationOptions(tpl.originStationId, origin.countryCode || origin.country);
            document.getElementById('coFormOriginStation').value = tpl.originStationId;
        }
        if (dest) {
            document.getElementById('coFormDestCountry').value = dest.countryCode || dest.country || '';
            document.getElementById('coFormDestStation').innerHTML = stationOptions(tpl.destinationStationId, dest.countryCode || dest.country);
            document.getElementById('coFormDestStation').value = tpl.destinationStationId;
        }
        onClientOrderRouteChange();
    };

    window.onClientOrderOriginCountryChange = function () {
        const cc = document.getElementById('coFormOriginCountry')?.value;
        const sel = document.getElementById('coFormOriginStation');
        if (sel) { sel.innerHTML = stationOptions('', cc); sel.value = ''; }
        const lp = document.getElementById('coFormLoadingPoint');
        if (lp && lp.tagName === 'SELECT') lp.innerHTML = pointOptions([], '');
        onClientOrderRouteChange();
    };

    window.onClientOrderDestCountryChange = function () {
        const cc = document.getElementById('coFormDestCountry')?.value;
        const sel = document.getElementById('coFormDestStation');
        if (sel) { sel.innerHTML = stationOptions('', cc); sel.value = ''; }
        const op = document.getElementById('coFormOffloadingPoint');
        if (op && op.tagName === 'SELECT') op.innerHTML = pointOptions([], '');
        onClientOrderRouteChange();
    };

    window.onClientOrderRouteChange = function () {
        const originId = document.getElementById('coFormOriginStation')?.value;
        const destId = document.getElementById('coFormDestStation')?.value;
        const route = resolveOrderRoute(originId, destId);
        const borderSec = document.getElementById('coBorderSection');
        const domesticNote = document.getElementById('coDomesticRouteNote');
        const routeTypeLabel = document.getElementById('coRouteTypeLabel');
        if (document.getElementById('coFormOrigin')) document.getElementById('coFormOrigin').value = route.origin || '';
        if (document.getElementById('coFormDestination')) document.getElementById('coFormDestination').value = route.destination || '';
        const loadEl = document.getElementById('coFormLoadingPoint');
        const offEl = document.getElementById('coFormOffloadingPoint');
        if (loadEl?.tagName === 'SELECT') {
            loadEl.innerHTML = pointOptions(route.loadingPoints, route.loadingPoint);
            loadEl.value = route.loadingPoint || '';
        } else if (loadEl) loadEl.value = route.loadingPoint || '';
        if (offEl?.tagName === 'SELECT') {
            offEl.innerHTML = pointOptions(route.offloadingPoints, route.offloadingPoint);
            offEl.value = route.offloadingPoint || '';
        } else if (offEl) offEl.value = route.offloadingPoint || '';
        if (document.getElementById('coFormRouteType')) document.getElementById('coFormRouteType').value = route.routeType;
        if (routeTypeLabel) routeTypeLabel.innerHTML = route.routeType === 'international'
            ? `<span class="status-badge orange">International</span> ${route.originCountryName || route.originCountry} → ${route.destinationCountryName || route.destinationCountry}`
            : `<span class="status-badge green">Domestic</span> Same country (${route.originCountryName || route.originCountry || '—'})`;
        if (borderSec) borderSec.style.display = route.showBorders ? 'block' : 'none';
        if (domesticNote) domesticNote.style.display = route.showBorders ? 'none' : 'block';
        if (route.showBorders) {
            const map = { EntryBorder: 'entryBorder', ViaBorder1: 'viaBorder1', ViaBorder2: 'viaBorder2', PortOfEntry: 'portOfEntry', ExitBorder: 'exitBorder' };
            Object.entries(map).forEach(([fid, rkey]) => {
                const el = document.getElementById('coForm' + fid);
                if (el && route[rkey] != null) el.value = route[rkey];
            });
        } else {
            ['EntryBorder', 'ViaBorder1', 'ViaBorder2', 'PortOfEntry', 'ExitBorder'].forEach(fid => {
                const el = document.getElementById('coForm' + fid);
                if (el) el.value = '';
            });
            ['EntryAgent', 'Via1Agent', 'Via2Agent', 'PortAgent', 'ExitAgent'].forEach(fid => {
                const el = document.getElementById('coForm' + fid);
                if (el) el.value = '';
            });
        }
    };

    window.setClientOrderFormTab = function (tab) {
        clientOrderFormTab = tab;
        document.querySelectorAll('.co-form-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
        document.querySelectorAll('.co-form-panel').forEach(p => p.style.display = p.dataset.panel === tab ? 'block' : 'none');
    };

    function renderClientOrderFormBody(o) {
        o = o || {};
        const ld = o.loadDetails || {};
        const cargoType = o.cargoType || 'Bulk Loose';
        const stations = getStations();
        const originStation = ld.originStationId || stations.find(s => s.name === o.origin)?.id || '';
        const destStation = ld.destStationId || stations.find(s => s.name === o.destination)?.id || '';
        const originSt = getStationById(originStation);
        const destSt = getStationById(destStation);
        const originCountry = originSt?.countryCode || originSt?.country || o.originCountry || countries[0]?.code || '';
        const destCountry = destSt?.countryCode || destSt?.country || o.destinationCountry || countries[1]?.code || countries[0]?.code || '';
        const route = resolveOrderRoute(originStation, destStation);
        const showBorders = o.routeType === 'international' || route.showBorders;
        const countries = routeCountries();
        const templates = typeof getRouteCatalogTemplates === 'function' ? getRouteCatalogTemplates() : [];
        const clientOpts = (sel) => clientsDB.map(c => `<option value="${c.name}"${c.name === sel ? ' selected' : ''}>${c.name}</option>`).join('');
        const agentOpts = (sel) => CLEARING_AGENTS.map(a => `<option value="${a}"${a === sel ? ' selected' : ''}>${a}</option>`).join('');
        const oogOpts = (sel) => OOG_TYPES.map(t => `<option value="${t.value}"${t.value === (ld.oogType || '') ? ' selected' : ''}>${t.value}</option>`).join('');
        const selectedOogHint = OOG_TYPES.find(t => t.value === (ld.oogType || ''))?.hint || OOG_TYPES[0].hint;
        const containerLines = ld.containerLines || [];
        const selectedRouteTpl = ld.routeTemplateId || route.routeTemplateId || '';

        return `
            <div class="co-form-tabs">
                <button type="button" class="co-form-tab active" data-tab="header" onclick="setClientOrderFormTab('header')">Order Header</button>
                <button type="button" class="co-form-tab" data-tab="route" onclick="setClientOrderFormTab('route')">Route & Borders</button>
                <button type="button" class="co-form-tab" data-tab="load" onclick="setClientOrderFormTab('load')">Load & Commodity</button>
                <button type="button" class="co-form-tab" data-tab="parties" onclick="setClientOrderFormTab('parties')">Parties & Instructions</button>
            </div>
            <input type="hidden" id="coFormId" value="${o.id || ''}">
            <input type="hidden" id="coFormRouteType" value="${o.routeType || route.routeType}">

            <div class="co-form-panel" data-panel="header">
                <div class="form-grid-3">
                    <div class="form-group"><label>Client *</label><select class="form-control" id="coFormClient">${clientsDB.map(c => `<option value="${c.id}"${c.id === o.clientId ? ' selected' : ''}>${c.name}</option>`).join('') || '<option value="">Add client first</option>'}</select></div>
                    <div class="form-group"><label>Order No</label><input class="form-control" id="coFormNumber" value="${o.orderNumber || ''}" placeholder="Auto"></div>
                    <div class="form-group"><label>Customer Ref</label><input class="form-control" id="coFormCustomerRef" value="${o.customerRef || ''}"></div>
                </div>
                <div class="form-grid-3">
                    <div class="form-group"><label>Order Date</label><input type="date" class="form-control" id="coFormOrderDate" value="${o.orderDate || new Date().toISOString().slice(0, 10)}"></div>
                    <div class="form-group"><label>Ready to Load On</label><input type="date" class="form-control" id="coFormReadyToLoad" value="${o.readyToLoadOn || ''}"></div>
                    <div class="form-group"><label>Complete load(s) by</label><input type="date" class="form-control" id="coFormCompleteBy" value="${o.completeLoadsBy || o.requiredDate || ''}"></div>
                </div>
                <div class="form-grid-3">
                    <div class="form-group"><label>IMP / EXP</label><select class="form-control" id="coFormImpExp"><option value="IMP"${o.impExp === 'IMP' ? ' selected' : ''}>Import</option><option value="EXP"${o.impExp === 'EXP' ? ' selected' : ''}>Export</option><option value="DOM"${o.impExp === 'DOM' ? ' selected' : ''}>Domestic</option></select></div>
                    <div class="form-group"><label>Priority</label><select class="form-control" id="coFormPriority"><option value="normal"${o.priority === 'normal' ? ' selected' : ''}>Normal</option><option value="high"${o.priority === 'high' ? ' selected' : ''}>High</option><option value="urgent"${o.priority === 'urgent' ? ' selected' : ''}>Urgent</option></select></div>
                    <div class="form-group"><label>Status</label><select class="form-control" id="coFormStatus">${['draft', 'confirmed', 'allocated', 'in_transit', 'completed', 'cancelled'].map(s => `<option value="${s}"${o.status === s ? ' selected' : ''}>${s}</option>`).join('')}</select></div>
                </div>
            </div>

            <div class="co-form-panel" data-panel="route" style="display:none;">
                <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;">Select a <strong>pre-defined route</strong> from the catalog, or pick origin/destination by country. Loading points link to origin; offloading points link to destination. Same country = domestic; different countries = international.</p>
                <div class="form-group">
                    <label>Pre-defined Route</label>
                    <select class="form-control" id="coFormRouteTemplate" onchange="onClientOrderRouteTemplateChange()">
                        <option value="">— Manual selection —</option>
                        ${templates.map(t => `<option value="${t.id}"${t.id === selectedRouteTpl ? ' selected' : ''}>${t.name} (${t.routeType})</option>`).join('')}
                    </select>
                </div>
                <div id="coRouteTypeLabel" style="margin-bottom:12px;">${route.routeType === 'international' ? `<span class="status-badge orange">International</span>` : `<span class="status-badge green">Domestic</span>`}</div>
                <div class="form-grid-2">
                    <div class="form-group"><label>Origin Country *</label><select class="form-control" id="coFormOriginCountry" onchange="onClientOrderOriginCountryChange()">${countries.map(c => `<option value="${c.code}"${c.code === originCountry ? ' selected' : ''}>${c.name}</option>`).join('')}</select></div>
                    <div class="form-group"><label>Destination Country *</label><select class="form-control" id="coFormDestCountry" onchange="onClientOrderDestCountryChange()">${countries.map(c => `<option value="${c.code}"${c.code === destCountry ? ' selected' : ''}>${c.name}</option>`).join('')}</select></div>
                </div>
                <div class="form-grid-2">
                    <div class="form-group"><label>Origin Station *</label><select class="form-control" id="coFormOriginStation" onchange="onClientOrderRouteChange()">${stationOptions(originStation, originCountry)}</select></div>
                    <div class="form-group"><label>Destination Station *</label><select class="form-control" id="coFormDestStation" onchange="onClientOrderRouteChange()">${stationOptions(destStation, destCountry)}</select></div>
                </div>
                <div class="form-grid-2">
                    <div class="form-group"><label>Loading Point *</label><select class="form-control" id="coFormLoadingPoint">${pointOptions(route.loadingPoints, o.loadingPoint || route.loadingPoint)}</select></div>
                    <div class="form-group"><label>Offloading Point *</label><select class="form-control" id="coFormOffloadingPoint">${pointOptions(route.offloadingPoints, o.offloadingPoint || route.offloadingPoint)}</select></div>
                </div>
                <input type="hidden" id="coFormOrigin" value="${o.origin || route.origin || ''}">
                <input type="hidden" id="coFormDestination" value="${o.destination || route.destination || ''}">
                <div id="coDomesticRouteNote" class="rbac-info-banner" style="display:${showBorders ? 'none' : 'block'};margin:12px 0;">
                    <strong>Domestic route</strong> — same country. No entry/exit border required.
                </div>
                <div id="coBorderSection" style="display:${showBorders ? 'block' : 'none'};margin-top:12px;padding:12px;background:#f7fafc;border-radius:8px;border:1px solid var(--border);">
                    <h4 style="margin:0 0 12px;">International borders & clearing agents</h4>
                    <div class="form-grid-2">
                        <div class="form-group"><label>Entry Border</label><input class="form-control" id="coFormEntryBorder" value="${o.entryBorder || ''}"></div>
                        <div class="form-group"><label>Entry Border Clearing Agent</label><select class="form-control" id="coFormEntryAgent"><option value="">—</option>${agentOpts(o.entryBorderAgent)}</select></div>
                    </div>
                    <div class="form-grid-2">
                        <div class="form-group"><label>Via Border 1</label><input class="form-control" id="coFormViaBorder1" value="${o.viaBorder1 || ''}"></div>
                        <div class="form-group"><label>Via Border 1 Agent</label><select class="form-control" id="coFormVia1Agent"><option value="">—</option>${agentOpts(o.viaBorder1Agent)}</select></div>
                    </div>
                    <div class="form-grid-2">
                        <div class="form-group"><label>Via Border 2</label><input class="form-control" id="coFormViaBorder2" value="${o.viaBorder2 || ''}"></div>
                        <div class="form-group"><label>Via Border 2 Agent</label><select class="form-control" id="coFormVia2Agent"><option value="">—</option>${agentOpts(o.viaBorder2Agent)}</select></div>
                    </div>
                    <div class="form-grid-2">
                        <div class="form-group"><label>Port of Entry</label><input class="form-control" id="coFormPortOfEntry" value="${o.portOfEntry || ''}"></div>
                        <div class="form-group"><label>Port Agent</label><select class="form-control" id="coFormPortAgent"><option value="">—</option>${agentOpts(o.portEntryAgent)}</select></div>
                    </div>
                    <div class="form-grid-2">
                        <div class="form-group"><label>Exit Border</label><input class="form-control" id="coFormExitBorder" value="${o.exitBorder || ''}"></div>
                        <div class="form-group"><label>Exit Border Agent</label><select class="form-control" id="coFormExitAgent"><option value="">—</option>${agentOpts(o.exitBorderAgent)}</select></div>
                    </div>
                </div>
            </div>

            <div class="co-form-panel" data-panel="load" style="display:none;">
                <div class="form-grid-2">
                    <div class="form-group"><label>Commodity *</label><input class="form-control" id="coFormCommodity" value="${o.commodity || ''}"></div>
                    <div class="form-group"><label>Cargo Type *</label><select class="form-control" id="coFormCargoType" onchange="onClientOrderCargoTypeChange()">
                        ${CARGO_TYPES.map(t => `<option value="${t}"${cargoType === t ? ' selected' : ''}>${t}</option>`).join('')}
                    </select></div>
                </div>
                <div class="form-group" id="coOogTypeRow" style="display:${cargoType === 'OOG' ? 'block' : 'none'};">
                    <label>OOG Type *</label>
                    <select class="form-control" id="coFormOogType" onchange="onClientOrderOogTypeChange()">
                        <option value="">— Select OOG type —</option>
                        ${oogOpts(ld.oogType)}
                    </select>
                    <p id="coOogTypeHint" class="field-hint" style="margin-top:6px;font-size:12px;color:var(--text-secondary);">${selectedOogHint}</p>
                </div>
                <div class="form-group"><label>Description of Goods</label><textarea class="form-control" id="coFormDescGoods" rows="2">${ld.descriptionOfGoods || ''}</textarea></div>
                <div class="form-grid-3">
                    <div class="form-group"><label>Order Load Type</label>
                        <div class="radio-row">${['Normal', 'Pre-load', 'Ex-W Ho'].map(t => `<label><input type="radio" name="coLoadType" value="${t}"${(ld.orderLoadType || 'Normal') === t ? ' checked' : ''}> ${t}</label>`).join('')}</div>
                    </div>
                    <div class="form-group"><label>Commodity Rate Type</label>
                        <div class="radio-row">${['Standard', 'Single Line Entry', 'Consolidation'].map(t => `<label><input type="radio" name="coRateType" value="${t}"${(ld.commodityRateType || 'Standard') === t ? ' checked' : ''}> ${t}</label>`).join('')}</div>
                    </div>
                </div>
                <div id="coContainerSection" style="display:${cargoType === 'Container' || cargoType === 'OOG' ? 'block' : 'none'};margin:12px 0;padding:12px;background:#f7fafc;border-radius:8px;border:1px solid var(--border);">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                        <h4 style="margin:0;">Container Details</h4>
                        <div style="display:flex;gap:8px;">
                            <button type="button" class="btn btn-sm btn-outline" onclick="openContainerDetailsModal()">📦 Container / OOG Details</button>
                            <button type="button" class="btn btn-sm btn-outline" onclick="addContainerLine()">+ Add Container</button>
                        </div>
                    </div>
                    <div class="form-grid-2" style="margin-bottom:12px;">
                        <div class="form-group"><label>Qty 20'</label><input type="number" class="form-control" id="coFormQty20" value="${ld.qty20 || ''}"></div>
                        <div class="form-group"><label>Qty 40'</label><input type="number" class="form-control" id="coFormQty40" value="${ld.qty40 || ''}"></div>
                    </div>
                    <div class="table-container" style="box-shadow:none;">
                        <table class="client-orders-grid" style="min-width:0;">
                            <thead><tr><th>Container No</th><th>Type</th><th>Tare</th><th>Nett Wt</th><th>Gross Wt</th><th>Seal</th><th>Flags</th><th></th></tr></thead>
                            <tbody id="coContainerLinesBody">${renderContainerLines(containerLines)}</tbody>
                        </table>
                    </div>
                </div>
                <div id="coOogDetailsSection" style="display:${cargoType === 'OOG' ? 'block' : 'none'};margin:12px 0;padding:12px;background:#fffaf0;border-radius:8px;border:1px solid #fbd38d;">
                    <h4 style="margin:0 0 10px;">OOG Loading Details</h4>
                    <div class="form-grid-3">
                        <div class="form-group"><label>Container Tare</label><input class="form-control" id="coFormContTare" value="${ld.containerTare || ''}"></div>
                        <div class="form-group"><label>Seal No</label><input class="form-control" id="coFormSealNo" value="${ld.sealNo || ''}"></div>
                        <div class="form-group"><label>Load Type</label><input class="form-control" id="coFormOogLoadType" value="${ld.oogLoadType || ''}" placeholder="Flat rack / Open top"></div>
                    </div>
                    <div class="form-group"><label>Instructions to OPS</label><textarea class="form-control" id="coFormOogInstr" rows="2">${ld.oogInstructions || ''}</textarea></div>
                </div>
                <div id="coBulkSection" style="display:${BULK_CARGO_TYPES.includes(cargoType) ? 'block' : 'none'};margin-top:8px;padding:12px;background:#f7fafc;border-radius:8px;border:1px solid var(--border);">
                    <h4 id="coBulkSectionTitle" style="margin:0 0 12px;">${cargoType === 'Break Bulk' ? 'Break Bulk — packing units & quantities' : cargoType === 'Bulk Liquid' ? 'Bulk Liquid — litres, weight & tank loads' : 'Bulk Loose — weight & tonnage'}</h4>
                    <div id="coBreakBulkRow" style="display:${cargoType === 'Break Bulk' ? 'block' : 'none'};margin-bottom:12px;">
                        <div class="form-grid-2">
                            <div class="form-group"><label>Packing Unit</label>
                                <select class="form-control" id="coFormPackingUnit">
                                    <option value="">— Select unit —</option>
                                    ${BREAKBULK_PACKING_UNITS.map(u => `<option value="${u}"${(ld.packingUnit || '') === u ? ' selected' : ''}>${u}</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group"><label>Unit Weight</label><input type="number" step="0.01" class="form-control" id="coFormUnitWeight" value="${ld.unitWeight || ''}" placeholder="e.g. 0.07"></div>
                        </div>
                    </div>
                    <div class="form-grid-4">
                        <div class="form-group"><label>Packing</label><input class="form-control" id="coFormPacking" value="${ld.packing || ''}" placeholder="${cargoType === 'Bulk Liquid' ? 'Tank' : 'Bags / Cartons'}"></div>
                        <div class="form-group"><label>Wt (Kg)</label><input type="number" class="form-control" id="coFormWeightKg" value="${ld.weightKg || ''}"></div>
                        <div class="form-group"><label>Quantity</label><input type="number" class="form-control" id="coFormQuantity" value="${ld.quantity || ''}"></div>
                        <div class="form-group"><label>Qty / Truck</label><input type="number" class="form-control" id="coFormQtyPerTruck" value="${ld.qtyPerTruck || ''}"></div>
                    </div>
                    <div id="coBulkLiquidRow" style="display:${cargoType === 'Bulk Liquid' ? 'block' : 'none'};">
                        <div class="form-grid-2">
                            <div class="form-group"><label>Litre</label><input type="number" step="0.01" class="form-control" id="coFormLitre" value="${ld.litre || ''}"></div>
                            <div class="form-group"><label>Tank / Liquid Type</label><input class="form-control" id="coFormLiquidType" value="${ld.liquidType || ''}" placeholder="Sulphuric acid, fuel, etc."></div>
                        </div>
                    </div>
                    <div class="form-grid-2">
                        <div class="form-group"><label>Tonnage</label><input type="number" class="form-control" id="coFormTonnage" value="${ld.tonnage || ''}"></div>
                        <div class="form-group"><label>No of Loads</label><input type="number" class="form-control" id="coFormNoOfLoads" value="${ld.noOfLoads || ''}"></div>
                    </div>
                </div>
                <div class="form-grid-2" style="margin-top:8px;">
                    <div class="form-group"><label>Hazardous</label>
                        <div class="radio-row"><label><input type="radio" name="coHaz" value="false"${!ld.isHaz ? ' checked' : ''}> Non Haz</label><label><input type="radio" name="coHaz" value="true"${ld.isHaz ? ' checked' : ''}> Haz</label></div>
                    </div>
                    <div class="form-group"><label>UN Number</label><input class="form-control" id="coFormUnNumber" value="${ld.unNumber || ''}"></div>
                </div>
                <div class="form-grid-2">
                    <div class="form-group"><label>IMO Class</label><input class="form-control" id="coFormImoClass" value="${ld.imoClass || ''}"></div>
                    <div class="form-group"><label>IMO Description</label><input class="form-control" id="coFormImoDesc" value="${ld.imoDescription || ''}"></div>
                </div>
            </div>

            <div class="co-form-panel" data-panel="parties" style="display:none;">
                <div class="form-grid-2">
                    <div class="form-group"><label>Shipper / Customer *</label>
                        <select class="form-control" id="coFormShipper">${clientOpts(o.shipper || '')}<option value="__custom__">— Type custom —</option></select>
                        <input class="form-control" id="coFormShipperCustom" style="margin-top:6px;display:none;" placeholder="Custom shipper name">
                    </div>
                    <div class="form-group"><label>Consignee *</label>
                        <input class="form-control" id="coFormConsignee" value="${o.consignee || ''}" list="coConsigneeList">
                        <datalist id="coConsigneeList">${clientsDB.map(c => `<option value="${c.name}">`).join('')}</datalist>
                    </div>
                </div>
                <div class="form-grid-2">
                    <div class="form-group"><label>Invoice Party *</label><input class="form-control" id="coFormInvoiceParty" value="${o.invoiceParty || ''}"></div>
                    <div class="form-group"><label>Customer Consignor</label><input class="form-control" id="coFormCustomerConsignor" value="${ld.customerConsignor || ''}"></div>
                </div>
                <div class="form-group"><label>Customer Consignee</label><input class="form-control" id="coFormCustomerConsignee" value="${ld.customerConsignee || ''}"></div>
                <div class="form-group"><label>Driver Instructions</label><textarea class="form-control" id="coFormDriverInstr" rows="2">${ld.driverInstructions || ''}</textarea></div>
                <div class="form-group"><label>Special Instructions (Ops)</label><textarea class="form-control" id="coFormSpecialInstr" rows="2">${ld.specialInstructions || o.notes || ''}</textarea></div>
            </div>`;
    }

    function collectClientOrderPayload() {
        const originId = document.getElementById('coFormOriginStation')?.value;
        const destId = document.getElementById('coFormDestStation')?.value;
        const route = resolveOrderRoute(originId, destId);
        const loadType = document.querySelector('input[name="coLoadType"]:checked')?.value || 'Normal';
        const rateType = document.querySelector('input[name="coRateType"]:checked')?.value || 'Standard';
        const isHaz = document.querySelector('input[name="coHaz"]:checked')?.value === 'true';
        const borderFields = route.routeType === 'domestic' ? {
            entryBorder: '', viaBorder1: '', viaBorder2: '', portOfEntry: '', exitBorder: '',
            entryBorderAgent: '', viaBorder1Agent: '', viaBorder2Agent: '', portEntryAgent: '', exitBorderAgent: ''
        } : {
            entryBorder: document.getElementById('coFormEntryBorder')?.value.trim() || '',
            viaBorder1: document.getElementById('coFormViaBorder1')?.value.trim() || '',
            viaBorder2: document.getElementById('coFormViaBorder2')?.value.trim() || '',
            portOfEntry: document.getElementById('coFormPortOfEntry')?.value.trim() || '',
            exitBorder: document.getElementById('coFormExitBorder')?.value.trim() || '',
            entryBorderAgent: document.getElementById('coFormEntryAgent')?.value || '',
            viaBorder1Agent: document.getElementById('coFormVia1Agent')?.value || '',
            viaBorder2Agent: document.getElementById('coFormVia2Agent')?.value || '',
            portEntryAgent: document.getElementById('coFormPortAgent')?.value || '',
            exitBorderAgent: document.getElementById('coFormExitAgent')?.value || ''
        };
        const loadEl = document.getElementById('coFormLoadingPoint');
        const offEl = document.getElementById('coFormOffloadingPoint');
        const shipperSel = document.getElementById('coFormShipper');
        let shipper = shipperSel?.value === '__custom__'
            ? document.getElementById('coFormShipperCustom')?.value.trim()
            : shipperSel?.value?.trim();
        return {
            id: document.getElementById('coFormId')?.value || undefined,
            orderNumber: document.getElementById('coFormNumber')?.value.trim(),
            clientId: document.getElementById('coFormClient')?.value,
            orderDate: document.getElementById('coFormOrderDate')?.value,
            readyToLoadOn: document.getElementById('coFormReadyToLoad')?.value,
            completeLoadsBy: document.getElementById('coFormCompleteBy')?.value,
            requiredDate: document.getElementById('coFormCompleteBy')?.value,
            customerRef: document.getElementById('coFormCustomerRef')?.value.trim(),
            impExp: document.getElementById('coFormImpExp')?.value,
            priority: document.getElementById('coFormPriority')?.value,
            status: document.getElementById('coFormStatus')?.value,
            origin: document.getElementById('coFormOrigin')?.value || route.origin,
            destination: document.getElementById('coFormDestination')?.value || route.destination,
            loadingPoint: loadEl?.value?.trim() || '',
            offloadingPoint: offEl?.value?.trim() || '',
            originCountry: route.originCountry,
            destinationCountry: route.destinationCountry,
            routeType: route.routeType,
            ...borderFields,
            commodity: document.getElementById('coFormCommodity')?.value.trim(),
            cargoType: document.getElementById('coFormCargoType')?.value,
            shipper: shipper || '',
            consignee: document.getElementById('coFormConsignee')?.value.trim(),
            invoiceParty: document.getElementById('coFormInvoiceParty')?.value.trim(),
            notes: document.getElementById('coFormSpecialInstr')?.value.trim(),
            kpi: 'green',
            loadDetails: {
                originStationId: originId, destStationId: destId,
                routeTemplateId: document.getElementById('coFormRouteTemplate')?.value || route.routeTemplateId || '',
                customerConsignor: document.getElementById('coFormCustomerConsignor')?.value.trim(),
                customerConsignee: document.getElementById('coFormCustomerConsignee')?.value.trim(),
                descriptionOfGoods: document.getElementById('coFormDescGoods')?.value.trim(),
                orderLoadType: loadType,
                oogType: document.getElementById('coFormOogType')?.value || '',
                commodityRateType: rateType,
                qty20: document.getElementById('coFormQty20')?.value,
                qty40: document.getElementById('coFormQty40')?.value,
                packing: document.getElementById('coFormPacking')?.value.trim(),
                packingUnit: document.getElementById('coFormPackingUnit')?.value || '',
                unitWeight: document.getElementById('coFormUnitWeight')?.value,
                litre: document.getElementById('coFormLitre')?.value,
                liquidType: document.getElementById('coFormLiquidType')?.value.trim(),
                weightKg: document.getElementById('coFormWeightKg')?.value,
                quantity: document.getElementById('coFormQuantity')?.value,
                qtyPerTruck: document.getElementById('coFormQtyPerTruck')?.value,
                tonnage: document.getElementById('coFormTonnage')?.value,
                noOfLoads: document.getElementById('coFormNoOfLoads')?.value,
                containerLines: collectContainerLines(),
                containerTare: document.getElementById('coFormContTare')?.value.trim(),
                sealNo: document.getElementById('coFormSealNo')?.value.trim(),
                oogLoadType: document.getElementById('coFormOogLoadType')?.value.trim(),
                oogInstructions: document.getElementById('coFormOogInstr')?.value.trim(),
                isHaz,
                unNumber: document.getElementById('coFormUnNumber')?.value.trim(),
                imoClass: document.getElementById('coFormImoClass')?.value.trim(),
                imoDescription: document.getElementById('coFormImoDesc')?.value.trim(),
                driverInstructions: document.getElementById('coFormDriverInstr')?.value.trim(),
                specialInstructions: document.getElementById('coFormSpecialInstr')?.value.trim()
            }
        };
    }


    function saveLocal() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                clients: clientsDB, drivers: fleetDriversDB, units: fleetUnitsDB,
                trucks: trucksDB, trailers: trailersDB,
                orders: clientOrdersDB, allocations: orderAllocationsDB
            }));
        } catch (e) { /* ignore */ }
    }

    function loadLocal() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return false;
            const data = JSON.parse(raw);
            clientsDB = data.clients || [];
            fleetDriversDB = data.drivers || [];
            fleetUnitsDB = data.units || [];
            trucksDB = data.trucks || [];
            trailersDB = data.trailers || [];
            clientOrdersDB = data.orders || [];
            orderAllocationsDB = data.allocations || [];
            return true;
        } catch (e) { return false; }
    }

    function seedDemoIfEmpty() {
        if (clientOrdersDB.length) return;
        clientsDB = [
            { id: 'CLI-001', name: 'Mining Corp DRC', contactPerson: 'Jean Mukendi', phone: '+243 990 111 222', whatsapp: '+243990111222', email: 'ops@miningcorp.cd', status: 'active' },
            { id: 'CLI-002', name: 'Copper Logistics SA', contactPerson: 'Sarah Mwamba', phone: '+243 991 333 444', whatsapp: '+243991333444', email: 'dispatch@copperlog.cd', status: 'active' }
        ];
        fleetDriversDB = [
            { id: 'DRV-001', name: 'John Doe', drcNumber: '+243 812 345 678', whatsapp: '+243812345678', licenseNumber: 'DRC-LIC-4421', status: 'active' },
            { id: 'DRV-002', name: 'Alice Bwalya', drcNumber: '+243 813 456 789', whatsapp: '+243813456789', licenseNumber: 'DRC-LIC-8832', status: 'active' }
        ];
        fleetUnitsDB = [
            { id: 'FU-001', truckPlate: 'ABC123DRC', trailerPlate: 'TRL-456', vehicleType: 'Truck', driverId: 'DRV-001', truckId: 'TRK-001', trailerId: 'TRL-001', gpsDeviceId: 'GPS-001', gpsLat: -10.7167, gpsLng: 25.4667, gpsLabel: 'Kasumbalesa', status: 'allocated' },
            { id: 'FU-002', truckPlate: 'XYZ789DRC', trailerPlate: 'TRL-890', vehicleType: 'Truck', driverId: 'DRV-002', truckId: 'TRK-002', trailerId: 'TRL-002', gpsDeviceId: 'GPS-002', gpsLat: -11.66, gpsLng: 27.4794, gpsLabel: 'Kolwezi', status: 'available' }
        ];
        trucksDB = [
            { id: 'TRK-001', plate: 'ABC123DRC', make: 'Volvo', model: 'FH16', capacityMt: 26, status: 'assigned', fleetSetId: 'FU-001',
              owner: 'Greendoor Group', fleetNo: 'FLT-001', details: {
                owner: 'Greendoor Group', fleetNo: 'FLT-001', registrationNo: 'ABC123DRC', vehicleMake: 'Volvo', vehicleModel: 'FH16',
                vehicleType: 'Horse', typeOfBody: 'Truck Tractor', tareWeight: 8500, loadingCapacity: 26, colour: 'White',
                active: true, available: false, onTheRoad: true, noOfTrips: 142,
                chassisNo: 'CH-4421', engineNo: 'EN-8832', engineMake: 'Volvo', horsePower: '550',
                gpsId: 'GPS-001', gprsId: 'GPRS-001', defaultDriver: 'DRV-001', driverName: 'DRV-001', defaultTrailer: 'TRL-001'
              } },
            { id: 'TRK-002', plate: 'XYZ789DRC', make: 'Scania', model: 'R500', capacityMt: 26, status: 'assigned', fleetSetId: 'FU-002',
              owner: 'Greendoor Group', fleetNo: 'FLT-002', details: {
                owner: 'Greendoor Group', fleetNo: 'FLT-002', registrationNo: 'XYZ789DRC', vehicleMake: 'Scania', vehicleModel: 'R500',
                vehicleType: 'Horse', active: true, available: false, gpsId: 'GPS-002',
                defaultDriver: 'DRV-002', driverName: 'DRV-002', defaultTrailer: 'TRL-002', defaultSecondTrailer: 'TRL-003', trailerPosition: 'Both'
              } }
        ];
        trailersDB = [
            { id: 'TRL-001', plate: 'TRL-456', trailerType: 'standard', capacityMt: 34, sideHeightMt: 270, status: 'assigned', fleetSetId: 'FU-001',
              owner: 'Greendoor Group', details: {
                registrationNo: 'TRL-456', typeOfBody: 'Flatdeck', tareWeight: 6200, loadingCapacity: 34,
                heightCm: 270, trailerLengthM: 12.5, twistlocks: 'Yes', suspensionType: 'Air Ride', uprightPockets: '4', active: true
              } },
            { id: 'TRL-002', plate: 'TRL-890', trailerType: 'superlink-front', capacityMt: 18, sideHeightMt: 150, status: 'assigned', fleetSetId: 'FU-002', pairedTrailerId: 'TRL-003',
              owner: 'Greendoor Group', details: { registrationNo: 'TRL-890', typeOfBody: 'Superlink Front', loadingCapacity: 18, heightCm: 150, trailerLengthM: 9, twistlocks: 'Yes', active: true } },
            { id: 'TRL-003', plate: 'TRL-891', trailerType: 'superlink-rear', capacityMt: 20, sideHeightMt: 150, status: 'assigned', fleetSetId: 'FU-002', pairedTrailerId: 'TRL-002',
              owner: 'Greendoor Group', details: { registrationNo: 'TRL-891', typeOfBody: 'Superlink Rear', loadingCapacity: 20, heightCm: 150, trailerLengthM: 9, trailerBellyTank: 'Yes', bellyTankCapacity: 400, active: true } }
        ];
        clientOrdersDB = [
            {
                id: 'ORD-001', orderNumber: 'GG-15776', clientId: 'CLI-001',
                orderDate: '2026-08-01', readyToLoadOn: '2026-08-10', completeLoadsBy: '2026-08-15',
                origin: 'Durban', destination: 'Kolwezi', originCountry: 'ZA', destinationCountry: 'CD',
                loadingPoint: 'Durban Port', offloadingPoint: 'Kolwezi Mine', routeType: 'international',
                entryBorder: 'Kasumbalesa', portOfEntry: 'Durban Port', entryBorderAgent: 'Jean Kalenga Clearing',
                commodity: 'Copper Cathodes', cargoType: 'Bulk Loose', customerRef: 'CUST-7788',
                shipper: 'Mining Corp DRC', consignee: 'Kolwezi Mine', invoiceParty: 'Mining Corp DRC',
                impExp: 'IMP', requiredDate: '2026-08-15', status: 'allocated', priority: 'high', kpi: 'green',
                loadDetails: { orderLoadType: 'Normal', packing: 'Bulk', quantity: 1200, tonnage: 1200, noOfLoads: 35, isHaz: false }
            },
            {
                id: 'ORD-002', orderNumber: 'GG-15780', clientId: 'CLI-002',
                orderDate: '2026-08-05', readyToLoadOn: '2026-08-12', completeLoadsBy: '2026-08-20',
                origin: 'Lubumbashi', destination: 'Kolwezi', originCountry: 'CD', destinationCountry: 'CD',
                loadingPoint: 'Lubumbashi Depot', offloadingPoint: 'Kolwezi Mine', routeType: 'domestic',
                commodity: 'Sulphuric Acid', cargoType: 'Bulk Liquid', customerRef: 'REF-9921',
                shipper: 'Copper Logistics SA', consignee: 'Likasi Plant', impExp: 'DOM',
                requiredDate: '2026-08-20', status: 'draft', priority: 'normal', kpi: 'orange',
                loadDetails: { orderLoadType: 'Pre-load', packing: 'Tank', litre: 40000, liquidType: 'Sulphuric acid', tonnage: 800, noOfLoads: 20, isHaz: true, unNumber: 'UN1830' }
            },
            {
                id: 'ORD-003', orderNumber: 'GG-15782', clientId: 'CLI-001',
                orderDate: '2026-08-07', readyToLoadOn: '2026-08-14', completeLoadsBy: '2026-08-22',
                origin: 'Durban', destination: 'Lusaka', originCountry: 'ZA', destinationCountry: 'ZM',
                loadingPoint: 'Durban Port', offloadingPoint: 'Lusaka Depot', routeType: 'international',
                entryBorder: 'Kasumbalesa', commodity: 'Bottles', cargoType: 'Break Bulk', customerRef: 'REF-4412',
                shipper: 'Mining Corp DRC', consignee: 'Lusaka Depot', impExp: 'IMP',
                requiredDate: '2026-08-22', status: 'confirmed', priority: 'normal', kpi: 'green',
                loadDetails: { orderLoadType: 'Normal', packingUnit: '0.0721 KG CARTONS', unitWeight: 0.07, packing: 'Cartons', quantity: 50000, qtyPerTruck: 428571, tonnage: 360, noOfLoads: 12, isHaz: false }
            }
        ];
        orderAllocationsDB = [
            { id: 'ALL-001', orderId: 'ORD-001', fleetUnitId: 'FU-001', scheduledDate: '2026-08-10', status: 'scheduled', allocatedBy: 'super_admin' }
        ];
        saveLocal();
    }

    function applyBundle(bundle) {
        if (!bundle) return;
        // Merge server data with any local-only records (e.g. if API was briefly unavailable)
        const mergeById = (local, remote, idKey = 'id') => {
            const map = new Map((remote || []).map(r => [r[idKey], r]));
            (local || []).forEach(item => {
                if (item && item[idKey] && !map.has(item[idKey])) map.set(item[idKey], item);
            });
            return Array.from(map.values());
        };
        clientsDB = mergeById(clientsDB, bundle.clients);
        fleetDriversDB = mergeById(fleetDriversDB, bundle.drivers);
        fleetUnitsDB = mergeById(fleetUnitsDB, bundle.units);
        trucksDB = mergeById(trucksDB, bundle.trucks);
        trailersDB = mergeById(trailersDB, bundle.trailers);
        clientOrdersDB = mergeById(clientOrdersDB, bundle.orders);
        orderAllocationsDB = mergeById(orderAllocationsDB, bundle.allocations);
        saveLocal();
    }

    async function persistToApi(saveFn, payload, mergeFn) {
        if (typeof saveFn !== 'function' || typeof isApiAvailable !== 'function' || !isApiAvailable()) {
            return null;
        }
        try {
            return await saveFn(payload);
        } catch (e) {
            if (typeof showToast === 'function') {
                showToast(`Saved locally only — server sync failed: ${e.message}. Stay logged in and check Docker is running.`, 'warning');
            }
            console.warn('Fleet API save failed:', e.message);
            return null;
        }
    }

    async function syncFleetOrdersFromApi() {
        if (typeof syncRouteCatalogFromApi === 'function') await syncRouteCatalogFromApi();
        if (typeof isApiAvailable !== 'function' || !isApiAvailable()) {
            if (!loadLocal()) seedDemoIfEmpty();
            return false;
        }
        try {
            const bundle = await fetchFleetOrderBundle();
            applyBundle(bundle);
            if (!clientOrdersDB.length && !clientsDB.length) seedDemoIfEmpty();
            return true;
        } catch (e) {
            console.warn('Fleet orders sync failed:', e.message);
            if (!loadLocal()) seedDemoIfEmpty();
            return false;
        }
    }

    function getDriverById(id) { return fleetDriversDB.find(d => d.id === id) || null; }
    function getClientById(id) { return clientsDB.find(c => c.id === id) || null; }
    function getUnitById(id) { return fleetUnitsDB.find(u => u.id === id) || null; }
    function getOrderById(id) { return clientOrdersDB.find(o => o.id === id) || null; }

    function getDriverForUnit(unit) {
        if (!unit) return null;
        return getDriverById(unit.driverId);
    }

    function getAllocationsForOrder(orderId) {
        return orderAllocationsDB.filter(a => a.orderId === orderId);
    }

    function findUnitByTruckPlate(plate) {
        const p = String(plate || '').replace(/\s+/g, '').toUpperCase();
        return fleetUnitsDB.find(u => String(u.truckPlate || '').replace(/\s+/g, '').toUpperCase() === p);
    }

    function getFleetOrderStats() {
        const pending = clientOrdersDB.filter(o => o.status === 'draft' || o.status === 'confirmed').length;
        const allocated = clientOrdersDB.filter(o => o.status === 'allocated' || o.status === 'in_transit').length;
        const overdue = clientOrdersDB.filter(o => o.kpi === 'red').length;
        const available = fleetUnitsDB.filter(u => u.status === 'available').length;
        const scheduled = orderAllocationsDB.filter(a => a.status === 'scheduled').length;
        return {
            totalOrders: clientOrdersDB.length, pending, allocated, overdue,
            availableUnits: available, scheduled, totalClients: clientsDB.length,
            totalDrivers: fleetDriversDB.length, totalUnits: fleetUnitsDB.length
        };
    }

    function canEditFleet() {
        return typeof canEditInModule === 'function'
            ? (canEditInModule('client-orders') || canEditInModule('fleet-registry'))
            : true;
    }

    function whatsappLink(num) {
        const digits = String(num || '').replace(/\D/g, '');
        return digits ? `https://wa.me/${digits}` : '#';
    }

    function orderStatusBadge(status) {
        const map = { draft: 'gray', confirmed: 'blue', allocated: 'orange', in_transit: 'green', completed: 'green', cancelled: 'red' };
        return `<span class="status-badge ${map[status] || 'gray'}">${status || '—'}</span>`;
    }

    function kpiBadge(kpi) {
        return `<span class="status-badge ${kpi || 'green'}"><span class="dot"></span> ${(kpi || 'green').toUpperCase()}</span>`;
    }

    // ─── GPS Map Modal ───────────────────────────────────────────────
    window.openFleetGpsMap = function (opts) {
        const unit = typeof opts === 'string' ? getUnitById(opts) : (opts?.unitId ? getUnitById(opts.unitId) : findUnitByTruckPlate(opts?.truckPlate));
        if (!unit) {
            if (typeof showToast === 'function') showToast('No fleet unit found for this truck. Register it in Fleet Registry and add GPS.', 'warning');
            return;
        }
        if (unit.gpsLat == null || unit.gpsLng == null) {
            if (typeof showToast === 'function') showToast('GPS not configured for this truck. Add GPS coordinates in Fleet Registry.', 'warning');
            return;
        }
        const driver = getDriverForUnit(unit);
        const lat = unit.gpsLat;
        const lng = unit.gpsLng;
        const pad = 0.08;
        const bbox = `${lng - pad},${lat - pad},${lng + pad},${lat + pad}`;
        const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
        const modal = document.getElementById('fleetGpsMapModal');
        if (!modal) return;
        document.getElementById('fleetGpsMapTitle').textContent = `📍 ${unit.truckPlate}${unit.trailerPlate ? ' + ' + unit.trailerPlate : ''}`;
        document.getElementById('fleetGpsMapMeta').innerHTML = `
            <div><strong>Driver:</strong> ${driver ? `<a href="${whatsappLink(driver.whatsapp)}" target="_blank" rel="noopener">${driver.name} 📱 WhatsApp</a>` : '—'}</div>
            <div><strong>GPS device:</strong> ${unit.gpsDeviceId || '—'} · <strong>Location:</strong> ${unit.gpsLabel || 'Live'}</div>
            <div><strong>Coordinates:</strong> ${lat.toFixed(5)}, ${lng.toFixed(5)} · Updated: ${unit.gpsUpdatedAt ? new Date(unit.gpsUpdatedAt).toLocaleString() : '—'}</div>`;
        document.getElementById('fleetGpsMapFrame').src = mapUrl;
        document.getElementById('fleetGpsMapExternal').href = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=12/${lat}/${lng}`;
        if (typeof openModal === 'function') openModal('fleetGpsMapModal');
        else modal.style.display = 'flex';
    };

    // ─── Client Orders Page ──────────────────────────────────────────
    function orderMatchesFilter(o, f) {
        const client = getClientById(o.clientId);
        const ld = o.loadDetails || {};
        const shipperName = o.shipper || client?.name || '';

        if (f.orderRef && !(o.orderNumber || '').toLowerCase().includes(f.orderRef.toLowerCase())) return false;
        if (f.impExpNo && !(o.impExp || '').toLowerCase().includes(f.impExpNo.toLowerCase())) return false;
        if (f.customerRef && !(o.customerRef || '').toLowerCase().includes(f.customerRef.toLowerCase())) return false;
        if (f.shipper !== 'all' && shipperName !== f.shipper) return false;
        if (f.consignee !== 'all' && (o.consignee || '') !== f.consignee) return false;
        if (f.invoiceParty !== 'all' && (o.invoiceParty || '') !== f.invoiceParty) return false;
        if (f.fromCountry !== 'all' && (o.originCountry || '') !== f.fromCountry) return false;
        if (f.fromStation !== 'all' && (o.origin || '') !== f.fromStation) return false;
        if (f.loadingPoint !== 'all' && (o.loadingPoint || '') !== f.loadingPoint) return false;
        if (f.toCountry !== 'all' && (o.destinationCountry || '') !== f.toCountry) return false;
        if (f.toStation !== 'all' && (o.destination || '') !== f.toStation) return false;
        if (f.offloadingPoint !== 'all' && (o.offloadingPoint || '') !== f.offloadingPoint) return false;
        if (f.containerNo) {
            const containers = (ld.containerLines || []).map(c => c.containerNo).join(' ');
            if (!containers.toLowerCase().includes(f.containerNo.toLowerCase())) return false;
        }
        if (f.commodity !== 'all' && (o.commodity || '') !== f.commodity) return false;
        if (f.status !== 'all' && o.status !== f.status) return false;
        if (f.orderOwner !== 'all' && (o.createdBy || '') !== f.orderOwner && f.orderOwner !== 'Greendoor Group') return false;
        if (f.cargoType !== 'all' && (o.cargoType || '') !== f.cargoType) return false;
        if (f.urgentOnly && !['high', 'urgent'].includes(o.priority)) return false;
        if (f.incViaStations && !(o.viaBorder1 || o.viaBorder2)) return false;
        if (f.fromDate && o.orderDate && o.orderDate < f.fromDate) return false;
        if (f.toDate && o.orderDate && o.orderDate > f.toDate) return false;
        return true;
    }

    function filteredOrders() {
        const f = orderFilter;
        if (!orderFilterApplied) return clientOrdersDB.slice();
        return clientOrdersDB.filter(o => orderMatchesFilter(o, f));
    }

    window.renderClientOrders = async function (container) {
        try {
            if (typeof syncRouteCatalogFromApi === 'function') await syncRouteCatalogFromApi();
            const stats = getFleetOrderStats();
            const orders = filteredOrders();
            const canEdit = canEditFleet();

        container.innerHTML = `
            <div class="page-header">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;">
                    <div>
                        <h1>📦 Client Orders</h1>
                        <div class="breadcrumb">Management / Client Orders — create orders, schedule trucks, allocate fleet sets</div>
                    </div>
                    ${canEdit ? `<button class="btn btn-primary" onclick="openClientOrderModal()">+ New Client Order</button>` : ''}
                </div>
            </div>
            <div class="kpi-grid" style="margin-bottom:20px;">
                <div class="kpi-card blue"><div class="kpi-card-value">${stats.totalOrders}</div><div class="kpi-card-label">Total Orders</div></div>
                <div class="kpi-card orange"><div class="kpi-card-value">${stats.pending}</div><div class="kpi-card-label">Awaiting Allocation</div></div>
                <div class="kpi-card green"><div class="kpi-card-value">${stats.allocated}</div><div class="kpi-card-label">Allocated / In Transit</div></div>
                <div class="kpi-card red"><div class="kpi-card-value">${stats.overdue}</div><div class="kpi-card-label">Overdue KPI</div></div>
            </div>
            ${renderOrderFilterPanel()}
            <div class="table-container client-orders-table-wrap">
                <div class="table-header"><h3>Orders (${orders.length}${orderFilterApplied ? ' filtered' : ''})</h3></div>
                <table class="client-orders-grid">
                    <thead><tr>
                        <th>Order No</th><th>Order Date</th><th>Ready to Load</th><th>Complete By</th>
                        <th>Commodity</th><th>Customer Ref</th><th>Shipper</th><th>Consignee</th>
                        <th>Origin</th><th>Destination</th><th>Cargo / Load Type</th>
                        ${orderShowTonnageDetails ? '<th>Qty</th><th>Qty/Truck</th><th>Litre</th>' : ''}
                        <th>Tonnage</th><th>No of Loads</th>
                        <th>Route / Borders</th><th>Status</th><th>Actions</th>
                    </tr></thead>
                    <tbody>
                        ${orders.length ? orders.map(o => {
                            const ld = o.loadDetails || {};
                            const allocs = getAllocationsForOrder(o.id);
                            return `<tr>
                                <td><strong>${o.orderNumber || '—'}</strong></td>
                                <td>${o.orderDate || '—'}</td>
                                <td>${o.readyToLoadOn || '—'}</td>
                                <td>${o.completeLoadsBy || o.requiredDate || '—'}</td>
                                <td>${o.commodity || '—'}</td>
                                <td>${o.customerRef || '—'}</td>
                                <td>${o.shipper || getClientById(o.clientId)?.name || '—'}</td>
                                <td>${o.consignee || '—'}</td>
                                <td>${o.origin || '—'}</td>
                                <td>${o.destination || '—'}</td>
                                <td>${loadTypeLabel(o)}</td>
                                ${orderShowTonnageDetails ? `<td>${ld.quantity || '—'}</td><td>${ld.qtyPerTruck || '—'}</td><td>${ld.litre || '—'}</td>` : ''}
                                <td>${ld.tonnage || '—'}</td>
                                <td>${ld.noOfLoads || '—'}</td>
                                <td style="min-width:180px;font-size:12px;">${routeSummary(o)}</td>
                                <td>${orderStatusBadge(o.status)}</td>
                                <td style="white-space:nowrap;">
                                    ${canEdit ? `<button class="btn btn-sm btn-outline" onclick="openAllocateFleetModal('${o.id}')">🚛</button>` : ''}
                                    ${canEdit ? `<button class="btn btn-sm btn-outline" onclick="openClientOrderModal('${o.id}')">✏️</button>` : ''}
                                    ${allocs[0] ? `<button class="btn btn-sm btn-primary" onclick="openFleetGpsMap('${allocs[0].fleetUnitId}')">📍</button>` : ''}
                                </td>
                            </tr>`;
                        }).join('') : `<tr><td colspan="${orderShowTonnageDetails ? 19 : 16}" style="text-align:center;padding:24px;color:var(--text-secondary);">${orderFilterApplied ? 'No orders match your filters. Click Clear All or adjust criteria.' : 'No orders yet. Create a client order and click Fetch to search.'}</td></tr>`}
                    </tbody>
                </table>
            </div>`;
        } catch (e) {
            console.error('Client Orders render error:', e);
            container.innerHTML = `<div class="page-header"><h1>📦 Client Orders</h1></div>
                <div class="rbac-info-banner" style="margin:20px 0;">
                    <strong>Could not load Client Orders.</strong> ${e.message || 'Unknown error'}
                    <div style="margin-top:10px;"><button class="btn btn-primary" onclick="navigateTo('client-orders')">Retry</button></div>
                </div>`;
        }
    };

    window.fleetOrderSetFilter = function (key, val) {
        orderFilter[key] = val;
        orderFilterApplied = true;
        const ca = document.getElementById('contentArea');
        if (currentPage === 'client-orders' && ca) renderClientOrders(ca);
    };

    // ─── Clients Management Page ───────────────────────────────────
    window.renderClientsManagement = function (container) {
        const canEdit = canEditFleet();
        const q = (fleetFilter.search || '').toLowerCase();
        const clients = clientsDB.filter(c => {
            if (!q) return true;
            return [c.name, c.contactPerson, c.phone, c.email, c.whatsapp].join(' ').toLowerCase().includes(q);
        });

        container.innerHTML = `
            <div class="page-header">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;">
                    <div>
                        <h1>👥 Clients</h1>
                        <div class="breadcrumb">Management / Maintain client records used in client orders (shipper, consignee, invoice party)</div>
                    </div>
                    ${canEdit ? `<button class="btn btn-primary" onclick="openClientModal()">+ Add Client</button>` : ''}
                </div>
            </div>
            <div class="kpi-grid" style="margin-bottom:20px;">
                <div class="kpi-card blue"><div class="kpi-card-value">${clientsDB.length}</div><div class="kpi-card-label">Total Clients</div></div>
                <div class="kpi-card green"><div class="kpi-card-value">${clientOrdersDB.length}</div><div class="kpi-card-label">Orders</div></div>
            </div>
            <div class="filters-bar">
                <div class="search-filter" style="flex:1;"><span>🔍</span>
                    <input type="text" placeholder="Search clients..." value="${fleetFilter.search}" oninput="fleetRegistrySetSearch(this.value)">
                </div>
            </div>
            ${renderClientsTable(clients, canEdit)}`;
    };

    // ─── Fleet Registry Page ─────────────────────────────────────────
    window.renderFleetRegistry = function (container) {
        const stats = getFleetOrderStats();
        const canEdit = canEditFleet();
        const q = (fleetFilter.search || '').toLowerCase();

        const units = fleetUnitsDB.filter(u => {
            if (fleetFilter.status !== 'all' && u.status !== fleetFilter.status) return false;
            if (!q) return true;
            const driver = getDriverForUnit(u);
            const hay = [u.truckPlate, u.trailerPlate, u.gpsDeviceId, driver?.name, driver?.whatsapp].join(' ').toLowerCase();
            return hay.includes(q);
        });

        const drivers = fleetDriversDB.filter(d => {
            if (!q) return true;
            return [d.name, d.whatsapp, d.drcNumber, d.licenseNumber].join(' ').toLowerCase().includes(q);
        });

        container.innerHTML = `
            <div class="page-header">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;">
                    <div>
                        <h1>🚛 Fleet Registry</h1>
                        <div class="breadcrumb">Management / Register trucks, trailers, drivers — link them as a fleet set</div>
                    </div>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;">
                        ${canEdit ? `<button class="btn btn-outline" onclick="openFleetTruckModal()">+ Truck</button>` : ''}
                        ${canEdit ? `<button class="btn btn-outline" onclick="openFleetTrailerModal()">+ Trailer</button>` : ''}
                        ${canEdit ? `<button class="btn btn-outline" onclick="openSuperlinkPairModal()">🔗 Superlink Pair</button>` : ''}
                        ${canEdit ? `<button class="btn btn-outline" onclick="openFleetDriverModal()">+ Driver</button>` : ''}
                        ${canEdit ? `<button class="btn btn-primary" onclick="openFleetUnitModal()">+ Fleet Set</button>` : ''}
                    </div>
                </div>
            </div>
            <div class="kpi-grid" style="margin-bottom:20px;">
                <div class="kpi-card blue"><div class="kpi-card-value">${stats.totalUnits}</div><div class="kpi-card-label">Fleet Units</div></div>
                <div class="kpi-card green"><div class="kpi-card-value">${stats.availableUnits}</div><div class="kpi-card-label">Available</div></div>
                <div class="kpi-card blue"><div class="kpi-card-value">${stats.totalDrivers}</div><div class="kpi-card-label">Drivers</div></div>
                <div class="kpi-card orange"><div class="kpi-card-value">${stats.totalClients}</div><div class="kpi-card-label">Clients</div></div>
            </div>
            <div class="filters-bar">
                <button class="btn ${fleetRegistryTab === 'register' ? 'btn-primary' : 'btn-outline'}" onclick="setFleetRegistryTab('register')">Full Register</button>
                <button class="btn ${fleetRegistryTab === 'sets' ? 'btn-primary' : 'btn-outline'}" onclick="setFleetRegistryTab('sets')">Fleet Sets</button>
                <button class="btn ${fleetRegistryTab === 'trucks' ? 'btn-primary' : 'btn-outline'}" onclick="setFleetRegistryTab('trucks')">Trucks</button>
                <button class="btn ${fleetRegistryTab === 'trailers' ? 'btn-primary' : 'btn-outline'}" onclick="setFleetRegistryTab('trailers')">Trailers</button>
                <button class="btn ${fleetRegistryTab === 'drivers' ? 'btn-primary' : 'btn-outline'}" onclick="setFleetRegistryTab('drivers')">Drivers</button>
                <div class="search-filter" style="flex:1;margin-left:12px;"><span>🔍</span>
                    <input type="text" placeholder="Search..." value="${fleetFilter.search}" oninput="fleetRegistrySetSearch(this.value)">
                </div>
            </div>
            ${fleetRegistryTab === 'register' ? renderFullRegisterTab() : ''}
            ${fleetRegistryTab === 'sets' ? renderUnitsTable(units, canEdit) : ''}
            ${fleetRegistryTab === 'trucks' ? renderTrucksTable(trucksDB, canEdit) : ''}
            ${fleetRegistryTab === 'trailers' ? renderTrailersTable(trailersDB, canEdit) : ''}
            ${fleetRegistryTab === 'drivers' ? renderDriversTable(drivers, canEdit) : ''}`;
    };

    function renderFullRegisterTab() {
        const vehicles = [
            ...trucksDB.map(t => ({ ...t, _assetType: 'truck' })),
            ...trailersDB.map(t => ({ ...t, _assetType: 'trailer' }))
        ];
        if (typeof renderFleetFullRegisterTable === 'function') {
            return renderFleetFullRegisterTable(vehicles, { trailers: trailersDB, drivers: fleetDriversDB });
        }
        return '<p>Full register unavailable.</p>';
    }

    window.openFleetVehicleByType = function (assetType, id) {
        if (assetType === 'truck') openFleetTruckModal(id);
        else openFleetTrailerModal(id);
    };

    function renderTrucksTable(trucks, canEdit) {
        const q = (fleetFilter.search || '').toLowerCase();
        const rows = trucks.filter(t => !q || [t.plate, t.make, t.model, t.owner, t.fleetNo, t.details?.driverName].join(' ').toLowerCase().includes(q));
        const trailerName = (id) => trailersDB.find(x => x.id === id)?.plate || '—';
        return `<div class="table-container"><div class="table-header"><h3>Trucks / Vehicles</h3></div>
            <div class="client-orders-table-wrap"><table class="client-orders-grid" style="min-width:1400px;">
            <thead><tr>
                <th>Owner</th><th>Fleet No</th><th>Registration No</th><th>Make</th><th>Model</th>
                <th>Default Trailer</th><th>2nd Trailer</th><th>Driver</th><th>Capacity</th><th>GPS Id</th><th>Active</th><th>Set</th><th></th>
            </tr></thead><tbody>
            ${rows.map(t => {
                const d = t.details || {};
                const driver = fleetDriversDB.find(dr => dr.id === d.driverName || dr.id === d.defaultDriver);
                return `<tr>
                    <td>${t.owner || d.owner || '—'}</td>
                    <td>${t.fleetNo || d.fleetNo || '—'}</td>
                    <td><strong>${t.plate}</strong></td>
                    <td>${t.make || d.vehicleMake || '—'}</td>
                    <td>${t.model || d.vehicleModel || '—'}</td>
                    <td>${trailerName(d.defaultTrailer)}</td>
                    <td>${trailerName(d.defaultSecondTrailer)}</td>
                    <td>${driver?.name || d.driverName || '—'}</td>
                    <td>${t.capacityMt || d.loadingCapacity || '—'}</td>
                    <td>${d.gpsId || '—'}</td>
                    <td>${d.active !== false ? '✓' : '—'}</td>
                    <td>${t.fleetSetId ? '<span class="status-badge blue">Linked</span>' : '—'}</td>
                    <td>${canEdit ? `<button class="btn btn-sm btn-outline" onclick="openFleetTruckModal('${t.id}')">✏️</button>` : ''}</td>
                </tr>`;
            }).join('') || '<tr><td colspan="13" style="text-align:center;padding:20px;">No trucks registered.</td></tr>'}
            </tbody></table></div></div>`;
    }

    function renderTrailersTable(trailers, canEdit) {
        const q = (fleetFilter.search || '').toLowerCase();
        const rows = trailers.filter(t => !q || [t.plate, t.trailerType, t.owner, t.fleetNo].join(' ').toLowerCase().includes(q));
        const typeLabel = { standard: 'Standard', 'superlink-front': 'Superlink Front', 'superlink-rear': 'Superlink Rear' };
        return `<div class="table-container"><div class="table-header"><h3>Trailers</h3></div>
            <div class="client-orders-table-wrap"><table class="client-orders-grid" style="min-width:1200px;">
            <thead><tr>
                <th>Owner</th><th>Fleet No</th><th>Registration No</th><th>Type</th><th>Body</th>
                <th>Tare Wt</th><th>Load Cap.</th><th>Height</th><th>Length</th><th>Paired</th><th>Set</th><th></th>
            </tr></thead><tbody>
            ${rows.map(t => {
                const d = t.details || {};
                const paired = t.pairedTrailerId ? trailersDB.find(x => x.id === t.pairedTrailerId) : null;
                return `<tr>
                    <td>${t.owner || d.owner || '—'}</td>
                    <td>${t.fleetNo || d.fleetNo || '—'}</td>
                    <td><strong>${t.plate}</strong></td>
                    <td>${typeLabel[t.trailerType] || t.trailerType}</td>
                    <td>${d.typeOfBody || '—'}</td>
                    <td>${d.tareWeight || '—'}</td>
                    <td>${t.capacityMt || d.loadingCapacity || '—'}</td>
                    <td>${t.sideHeightMt || d.heightCm || '—'}</td>
                    <td>${d.trailerLengthM || '—'}</td>
                    <td>${paired ? paired.plate : '—'}</td>
                    <td>${t.fleetSetId ? '<span class="status-badge blue">Linked</span>' : '—'}</td>
                    <td>${canEdit && !t.fleetSetId ? `<button class="btn btn-sm btn-outline" onclick="openFleetTrailerModal('${t.id}')">✏️</button>` : ''}</td>
                </tr>`;
            }).join('') || '<tr><td colspan="12" style="text-align:center;padding:20px;">No trailers registered.</td></tr>'}
            </tbody></table></div></div>`;
    }

    function renderUnitsTable(units, canEdit) {
        return `<div class="table-container"><div class="table-header"><h3>Fleet Sets — Truck + Trailer + Driver + GPS</h3></div>
            <table><thead><tr>
                <th>Truck</th><th>Trailer</th><th>Type</th><th>Driver</th><th>WhatsApp</th>
                <th>GPS Device</th><th>Location</th><th>Status</th><th>Actions</th>
            </tr></thead><tbody>
            ${units.map(u => {
                const d = getDriverForUnit(u);
                return `<tr>
                    <td><strong>${u.truckPlate}</strong></td>
                    <td>${u.trailerPlate || '—'}</td>
                    <td>${u.vehicleType || 'Truck'}</td>
                    <td>${d?.name || '—'}</td>
                    <td>${d?.whatsapp ? `<a href="${whatsappLink(d.whatsapp)}" target="_blank" rel="noopener">📱 ${d.whatsapp}</a>` : '—'}</td>
                    <td>${u.gpsDeviceId || '—'}</td>
                    <td>${u.gpsLabel || (u.gpsLat != null ? `${u.gpsLat.toFixed(3)}, ${u.gpsLng.toFixed(3)}` : '—')}</td>
                    <td>${orderStatusBadge(u.status)}</td>
                    <td style="white-space:nowrap;">
                        ${canEdit ? `<button class="btn btn-sm btn-outline" onclick="openFleetUnitModal('${u.id}')">✏️</button>` : ''}
                        ${u.gpsLat != null ? `<button class="btn btn-sm btn-primary" onclick="openFleetGpsMap('${u.id}')">📍 Map</button>` : ''}
                    </td>
                </tr>`;
            }).join('') || '<tr><td colspan="9" style="text-align:center;padding:20px;">No fleet units registered.</td></tr>'}
            </tbody></table></div>`;
    }

    function renderDriversTable(drivers, canEdit) {
        return `<div class="table-container"><div class="table-header"><h3>Drivers</h3>
            ${canEdit ? `<button class="btn btn-sm btn-primary" onclick="openFleetDriverModal()">+ Add</button>` : ''}</div>
            <table><thead><tr><th>Name</th><th>DRC #</th><th>WhatsApp</th><th>License</th><th>Status</th><th></th></tr></thead><tbody>
            ${drivers.map(d => `<tr>
                <td>${d.name}</td>
                <td>${d.drcNumber || '—'}</td>
                <td><a href="${whatsappLink(d.whatsapp)}" target="_blank" rel="noopener">📱 ${d.whatsapp || '—'}</a></td>
                <td>${d.licenseNumber || '—'}</td>
                <td>${orderStatusBadge(d.status)}</td>
                <td>${canEdit ? `<button class="btn btn-sm btn-outline" onclick="openFleetDriverModal('${d.id}')">✏️</button>` : ''}</td>
            </tr>`).join('') || '<tr><td colspan="6" style="text-align:center;padding:20px;">No drivers.</td></tr>'}
            </tbody></table></div>`;
    }

    function renderClientsTable(clients, canEdit) {
        return `<div class="table-container"><div class="table-header"><h3>Clients</h3>
            ${canEdit ? `<button class="btn btn-sm btn-primary" onclick="openClientModal()">+ Add Client</button>` : ''}</div>
            <table><thead><tr><th>Name</th><th>Contact</th><th>Phone</th><th>WhatsApp</th><th>Email</th><th></th></tr></thead><tbody>
            ${clients.map(c => `<tr>
                <td><strong>${c.name}</strong></td>
                <td>${c.contactPerson || '—'}</td>
                <td>${c.phone || '—'}</td>
                <td>${c.whatsapp ? `<a href="${whatsappLink(c.whatsapp)}" target="_blank" rel="noopener">📱</a>` : '—'}</td>
                <td>${c.email || '—'}</td>
                <td>${canEdit ? `<button class="btn btn-sm btn-outline" onclick="openClientModal('${c.id}')">✏️</button>` : ''}</td>
            </tr>`).join('') || '<tr><td colspan="6" style="text-align:center;padding:20px;">No clients.</td></tr>'}
            </tbody></table></div>`;
    }

    window.setFleetRegistryTab = function (tab) {
        fleetRegistryTab = tab;
        const ca = document.getElementById('contentArea');
        if (currentPage === 'fleet-registry' && ca) renderFleetRegistry(ca);
    };

    window.fleetRegistrySetSearch = function (val) {
        fleetFilter.search = val;
        const ca = document.getElementById('contentArea');
        if (currentPage === 'fleet-registry' && ca) renderFleetRegistry(ca);
    };

    // ─── Modals ──────────────────────────────────────────────────────
    window.openClientModal = function (clientId) {
        const c = clientId ? getClientById(clientId) : {};
        document.getElementById('clientModalTitle').textContent = clientId ? 'Edit Client' : 'Add Client';
        document.getElementById('clientFormId').value = c.id || '';
        document.getElementById('clientFormName').value = c.name || '';
        document.getElementById('clientFormContact').value = c.contactPerson || '';
        document.getElementById('clientFormPhone').value = c.phone || '';
        document.getElementById('clientFormWhatsapp').value = c.whatsapp || '';
        document.getElementById('clientFormEmail').value = c.email || '';
        openModal('clientModal');
    };

    window.submitClientForm = async function () {
        const payload = {
            id: document.getElementById('clientFormId').value || undefined,
            name: document.getElementById('clientFormName').value.trim(),
            contactPerson: document.getElementById('clientFormContact').value.trim(),
            phone: document.getElementById('clientFormPhone').value.trim(),
            whatsapp: document.getElementById('clientFormWhatsapp').value.trim(),
            email: document.getElementById('clientFormEmail').value.trim(),
            status: 'active'
        };
        if (!payload.name) { showToast('Client name is required', 'warning'); return; }
        try {
            const saved = await persistToApi(saveClientApi, payload);
            if (saved) {
                const idx = clientsDB.findIndex(x => x.id === saved.id);
                if (idx >= 0) clientsDB[idx] = saved; else clientsDB.push(saved);
            } else {
                payload.id = payload.id || uid('CLI');
                const idx = clientsDB.findIndex(x => x.id === payload.id);
                if (idx >= 0) clientsDB[idx] = { ...clientsDB[idx], ...payload };
                else clientsDB.push(payload);
            }
            saveLocal();
            closeModal('clientModal');
            showToast('Client saved', 'success');
            refreshFleetPages();
        } catch (e) { showToast(e.message, 'error'); }
    };

    window.openFleetDriverModal = function (driverId) {
        const d = driverId ? getDriverById(driverId) : {};
        document.getElementById('fleetDriverModalTitle').textContent = driverId ? 'Edit Driver' : 'Register Driver';
        document.getElementById('fleetDriverFormId').value = d.id || '';
        document.getElementById('fleetDriverFormName').value = d.name || '';
        document.getElementById('fleetDriverFormDrc').value = d.drcNumber || '';
        document.getElementById('fleetDriverFormWhatsapp').value = d.whatsapp || '';
        document.getElementById('fleetDriverFormLicense').value = d.licenseNumber || '';
        openModal('fleetDriverModal');
    };

    window.submitFleetDriverForm = async function () {
        const payload = {
            id: document.getElementById('fleetDriverFormId').value || undefined,
            name: document.getElementById('fleetDriverFormName').value.trim(),
            drcNumber: document.getElementById('fleetDriverFormDrc').value.trim(),
            whatsapp: document.getElementById('fleetDriverFormWhatsapp').value.trim(),
            licenseNumber: document.getElementById('fleetDriverFormLicense').value.trim(),
            status: 'active'
        };
        if (!payload.name) { showToast('Driver name is required', 'warning'); return; }
        try {
            const saved = await persistToApi(saveFleetDriverApi, payload);
            if (saved) {
                const idx = fleetDriversDB.findIndex(x => x.id === saved.id);
                if (idx >= 0) fleetDriversDB[idx] = saved; else fleetDriversDB.push(saved);
            } else {
                payload.id = payload.id || uid('DRV');
                const idx = fleetDriversDB.findIndex(x => x.id === payload.id);
                if (idx >= 0) fleetDriversDB[idx] = { ...fleetDriversDB[idx], ...payload };
                else fleetDriversDB.push(payload);
            }
            saveLocal();
            closeModal('fleetDriverModal');
            showToast('Driver saved', 'success');
            refreshFleetPages();
        } catch (e) { showToast(e.message, 'error'); }
    };

    window.openFleetUnitModal = function (unitId) {
        const u = unitId ? getUnitById(unitId) : {};
        const availTrucks = trucksDB.filter(t => !t.fleetSetId || t.fleetSetId === u.id);
        const availTrailers = trailersDB.filter(t => !t.fleetSetId || t.fleetSetId === u.id);
        document.getElementById('fleetUnitModalTitle').textContent = unitId ? 'Edit Fleet Set' : 'Create Fleet Set (Truck + Trailer + Driver)';
        document.getElementById('fleetUnitFormId').value = u.id || '';
        document.getElementById('fleetUnitFormTruckId').innerHTML = `<option value="">— Select truck —</option>${availTrucks.map(t =>
            `<option value="${t.id}"${t.id === u.truckId ? ' selected' : ''}>${t.plate} (${t.capacityMt || '?'} MT)</option>`
        ).join('')}`;
        document.getElementById('fleetUnitFormTrailerId').innerHTML = `<option value="">— Select trailer —</option>${availTrailers.filter(t => t.trailerType !== 'superlink-rear').map(t =>
            `<option value="${t.id}"${t.id === u.trailerId ? ' selected' : ''}>${t.plate} — ${t.trailerType}${t.pairedTrailerId ? ' (+ rear)' : ''}</option>`
        ).join('')}`;
        document.getElementById('fleetUnitFormType').value = u.vehicleType || 'Truck';
        document.getElementById('fleetUnitFormDriver').innerHTML = '<option value="">— Select driver —</option>' +
            fleetDriversDB.map(d => `<option value="${d.id}"${d.id === u.driverId ? ' selected' : ''}>${d.name}</option>`).join('');
        document.getElementById('fleetUnitFormGpsId').value = u.gpsDeviceId || '';
        document.getElementById('fleetUnitFormGpsLat').value = u.gpsLat != null ? u.gpsLat : '';
        document.getElementById('fleetUnitFormGpsLng').value = u.gpsLng != null ? u.gpsLng : '';
        document.getElementById('fleetUnitFormGpsLabel').value = u.gpsLabel || '';
        openModal('fleetUnitModal');
    };

    function releaseFleetSetAssets(setId) {
        trucksDB.forEach(t => { if (t.fleetSetId === setId) { t.fleetSetId = null; t.status = 'available'; } });
        trailersDB.forEach(t => { if (t.fleetSetId === setId) { t.fleetSetId = null; t.status = t.pairedTrailerId ? 'paired' : 'available'; } });
    }

    function linkAssetsToFleetSet(setId, truckId, trailerId) {
        releaseFleetSetAssets(setId);
        const truck = trucksDB.find(t => t.id === truckId);
        const trailer = trailersDB.find(t => t.id === trailerId);
        if (truck) { truck.fleetSetId = setId; truck.status = 'assigned'; }
        if (trailer) {
            trailer.fleetSetId = setId; trailer.status = 'assigned';
            if (trailer.pairedTrailerId) {
                const rear = trailersDB.find(t => t.id === trailer.pairedTrailerId);
                if (rear) { rear.fleetSetId = setId; rear.status = 'assigned'; }
            }
        }
    }

    window.submitFleetUnitForm = async function () {
        const truckId = document.getElementById('fleetUnitFormTruckId').value;
        const trailerId = document.getElementById('fleetUnitFormTrailerId').value;
        const truck = trucksDB.find(t => t.id === truckId);
        const trailer = trailersDB.find(t => t.id === trailerId);
        const rear = trailer?.pairedTrailerId ? trailersDB.find(t => t.id === trailer.pairedTrailerId) : null;
        const lat = parseFloat(document.getElementById('fleetUnitFormGpsLat').value);
        const lng = parseFloat(document.getElementById('fleetUnitFormGpsLng').value);
        const setId = document.getElementById('fleetUnitFormId').value || uid('FU');
        const payload = {
            id: setId, truckId, trailerId, secondTrailerId: rear?.id || null,
            truckPlate: truck?.plate || '', trailerPlate: trailer ? `${trailer.plate}${rear ? ' + ' + rear.plate : ''}` : '',
            vehicleType: document.getElementById('fleetUnitFormType').value,
            driverId: document.getElementById('fleetUnitFormDriver').value || null,
            gpsDeviceId: document.getElementById('fleetUnitFormGpsId').value.trim(),
            gpsLat: isNaN(lat) ? null : lat, gpsLng: isNaN(lng) ? null : lng,
            gpsLabel: document.getElementById('fleetUnitFormGpsLabel').value.trim(), status: 'available'
        };
        if (!truckId) { showToast('Select a truck for this fleet set', 'warning'); return; }
        if (truck?.fleetSetId && truck.fleetSetId !== setId) { showToast(`Truck ${truck.plate} is already in another set`, 'warning'); return; }
        if (trailer?.fleetSetId && trailer.fleetSetId !== setId) { showToast(`Trailer ${trailer.plate} is already in another set`, 'warning'); return; }
        try {
            linkAssetsToFleetSet(setId, truckId, trailerId);
            const saved = await persistToApi(saveFleetUnitApi, payload);
            if (saved) {
                const idx = fleetUnitsDB.findIndex(x => x.id === saved.id);
                if (idx >= 0) fleetUnitsDB[idx] = saved; else fleetUnitsDB.push(saved);
            } else {
                const idx = fleetUnitsDB.findIndex(x => x.id === setId);
                if (idx >= 0) fleetUnitsDB[idx] = { ...fleetUnitsDB[idx], ...payload };
                else fleetUnitsDB.push(payload);
            }
            saveLocal();
            closeModal('fleetUnitModal');
            showToast('Fleet set saved', 'success');
            refreshFleetPages();
        } catch (e) { showToast(e.message, 'error'); }
    };

    window.openFleetTruckModal = function (truckId) {
        const t = truckId ? trucksDB.find(x => x.id === truckId) : { details: { active: true } };
        document.getElementById('fleetTruckModalTitle').textContent = truckId ? 'Edit Truck / Vehicle' : 'Register Truck / Vehicle';
        document.getElementById('fleetTruckFormId').value = t.id || '';
        const body = document.getElementById('fleetTruckModalBody');
        if (body && typeof renderFleetVehicleForm === 'function') {
            body.innerHTML = renderFleetVehicleForm('truck', FLEET_TRUCK_SECTIONS, t, { trailers: trailersDB, drivers: fleetDriversDB });
        }
        openModal('fleetTruckModal');
    };

    window.submitFleetTruckForm = async function () {
        const existing = document.getElementById('fleetTruckFormId').value;
        const base = existing ? trucksDB.find(x => x.id === existing) || {} : {};
        const collected = typeof collectFleetVehicleForm === 'function'
            ? collectFleetVehicleForm('truck', FLEET_TRUCK_SECTIONS, base)
            : base;
        const payload = {
            id: existing || undefined,
            plate: collected.plate,
            make: collected.make,
            model: collected.model,
            capacityMt: collected.capacityMt,
            owner: collected.details?.owner || collected.owner,
            fleetNo: collected.details?.fleetNo,
            status: collected.details?.active === false ? 'inactive' : (base.status || 'available'),
            fleetSetId: base.fleetSetId || null,
            details: collected.details || {}
        };
        if (!payload.plate) { showToast('Registration No is required', 'warning'); return; }
        try {
            let saved = null;
            if (typeof saveFleetTruckApi === 'function' && typeof isApiAvailable === 'function' && isApiAvailable()) {
                saved = await saveFleetTruckApi(payload);
            }
            payload.id = saved?.id || payload.id || uid('TRK');
            const row = saved || { ...payload, owner: payload.owner, fleetNo: payload.fleetNo };
            const idx = trucksDB.findIndex(x => x.id === payload.id);
            if (idx >= 0) trucksDB[idx] = row; else trucksDB.push(row);
            saveLocal();
            closeModal('fleetTruckModal');
            showToast('Truck saved with full FMS details', 'success');
            refreshFleetPages();
        } catch (e) { showToast(e.message, 'error'); }
    };

    window.openFleetTrailerModal = function (trailerId) {
        const t = trailerId ? trailersDB.find(x => x.id === trailerId) : { details: { active: true, trailerType: 'standard' } };
        document.getElementById('fleetTrailerModalTitle').textContent = trailerId ? 'Edit Trailer' : 'Register Trailer';
        document.getElementById('fleetTrailerFormId').value = t.id || '';
        const body = document.getElementById('fleetTrailerModalBody');
        if (body && typeof renderFleetVehicleForm === 'function') {
            body.innerHTML = renderFleetVehicleForm('trailer', FLEET_TRAILER_SECTIONS, t, {});
        }
        openModal('fleetTrailerModal');
    };

    window.submitFleetTrailerForm = async function () {
        const existing = document.getElementById('fleetTrailerFormId').value;
        const base = existing ? trailersDB.find(x => x.id === existing) || {} : {};
        const collected = typeof collectFleetVehicleForm === 'function'
            ? collectFleetVehicleForm('trailer', FLEET_TRAILER_SECTIONS, base)
            : base;
        const payload = {
            id: existing || undefined,
            plate: collected.plate,
            trailerType: collected.trailerType || collected.details?.trailerType || 'standard',
            capacityMt: collected.capacityMt,
            sideHeightMt: collected.sideHeightMt || collected.details?.heightCm,
            owner: collected.details?.owner,
            fleetNo: collected.details?.fleetNo,
            status: collected.details?.active === false ? 'inactive' : (base.status || 'available'),
            fleetSetId: base.fleetSetId || null,
            pairedTrailerId: base.pairedTrailerId || null,
            details: collected.details || {}
        };
        if (!payload.plate) { showToast('Registration No is required', 'warning'); return; }
        try {
            let saved = null;
            if (typeof saveFleetTrailerApi === 'function' && typeof isApiAvailable === 'function' && isApiAvailable()) {
                saved = await saveFleetTrailerApi(payload);
            }
            payload.id = saved?.id || payload.id || uid('TRL');
            const row = saved || payload;
            const idx = trailersDB.findIndex(x => x.id === payload.id);
            if (idx >= 0) trailersDB[idx] = row; else trailersDB.push(row);
            saveLocal();
            closeModal('fleetTrailerModal');
            showToast('Trailer saved with full FMS details', 'success');
            refreshFleetPages();
        } catch (e) { showToast(e.message, 'error'); }
    };

    window.openSuperlinkPairModal = function () {
        const fronts = trailersDB.filter(t => t.trailerType === 'superlink-front' && !t.pairedTrailerId && !t.fleetSetId);
        const rears = trailersDB.filter(t => t.trailerType === 'superlink-rear' && !t.pairedTrailerId && !t.fleetSetId);
        document.getElementById('superlinkFrontSel').innerHTML = fronts.map(t =>
            `<option value="${t.id}">${t.plate} (${t.capacityMt || '?'} MT)</option>`
        ).join('') || '<option value="">Register superlink front first</option>';
        document.getElementById('superlinkRearSel').innerHTML = rears.map(t =>
            `<option value="${t.id}">${t.plate} (${t.capacityMt || '?'} MT)</option>`
        ).join('') || '<option value="">Register superlink rear first</option>';
        openModal('superlinkPairModal');
    };

    window.submitSuperlinkPairForm = async function () {
        const frontId = document.getElementById('superlinkFrontSel').value;
        const rearId = document.getElementById('superlinkRearSel').value;
        if (!frontId || !rearId) { showToast('Select front and rear superlink trailers', 'warning'); return; }
        try {
            if (typeof linkSuperlinkApi === 'function' && typeof isApiAvailable === 'function' && isApiAvailable()) {
                await linkSuperlinkApi(frontId, rearId);
            }
            const front = trailersDB.find(t => t.id === frontId);
            const rear = trailersDB.find(t => t.id === rearId);
            if (front) { front.pairedTrailerId = rearId; front.status = 'paired'; }
            if (rear) { rear.pairedTrailerId = frontId; rear.status = 'paired'; }
            saveLocal();
            closeModal('superlinkPairModal');
            showToast('Superlink pair linked', 'success');
            refreshFleetPages();
        } catch (e) { showToast(e.message, 'error'); }
    };

    window.openClientOrderModal = async function (orderId) {
        if (typeof syncRouteCatalogFromApi === 'function') await syncRouteCatalogFromApi();
        const o = orderId ? getOrderById(orderId) : {};
        clientOrderFormTab = 'header';
        document.getElementById('clientOrderModalTitle').textContent = orderId ? 'Edit Order' : 'Create Client Order';
        const body = document.getElementById('clientOrderFormBody');
        if (body) body.innerHTML = renderClientOrderFormBody(o);
        openModal('clientOrderModal');
        setClientOrderFormTab('header');
        onClientOrderCargoTypeChange();
        try { if (document.getElementById('coFormOriginStation')) onClientOrderRouteChange(); } catch (_) {}
    };

    window.submitClientOrderForm = async function () {
        const payload = collectClientOrderPayload();
        if (!payload.clientId) { showToast('Select a client', 'warning'); setClientOrderFormTab('header'); return; }
        if (!payload.commodity) { showToast('Commodity is required', 'warning'); setClientOrderFormTab('load'); return; }
        if (payload.cargoType === 'OOG' && !payload.loadDetails.oogType) {
            showToast('Select an OOG type', 'warning'); setClientOrderFormTab('load'); return;
        }
        if (!payload.origin || !payload.destination) { showToast('Select origin and destination stations', 'warning'); setClientOrderFormTab('route'); return; }
        try {
            const saved = await persistToApi(saveClientOrderApi, payload);
            if (saved) {
                const idx = clientOrdersDB.findIndex(x => x.id === saved.id);
                if (idx >= 0) clientOrdersDB[idx] = saved; else clientOrdersDB.push(saved);
            } else {
                payload.id = payload.id || uid('ORD');
                payload.orderNumber = payload.orderNumber || `CO-${Date.now().toString().slice(-6)}`;
                const idx = clientOrdersDB.findIndex(x => x.id === payload.id);
                if (idx >= 0) clientOrdersDB[idx] = { ...clientOrdersDB[idx], ...payload };
                else clientOrdersDB.push(payload);
            }
            saveLocal();
            closeModal('clientOrderModal');
            showToast('Order saved', 'success');
            refreshFleetPages();
        } catch (e) { showToast(e.message, 'error'); }
    };

    window.openAllocateFleetModal = function (orderId) {
        const o = getOrderById(orderId);
        if (!o) return;
        document.getElementById('allocateOrderId').value = orderId;
        document.getElementById('allocateOrderLabel').textContent = `${o.orderNumber} — ${getClientById(o.clientId)?.name || ''}`;
        const sel = document.getElementById('allocateFleetUnit');
        const available = fleetUnitsDB.filter(u => u.status === 'available' || getAllocationsForOrder(orderId).some(a => a.fleetUnitId === u.id));
        sel.innerHTML = available.map(u => {
            const d = getDriverForUnit(u);
            return `<option value="${u.id}">${u.truckPlate}${u.trailerPlate ? ' + ' + u.trailerPlate : ''} — ${d?.name || 'No driver'}${u.gpsDeviceId ? ' [GPS]' : ''}</option>`;
        }).join('') || '<option value="">No available fleet units — register in Fleet Registry</option>';
        document.getElementById('allocateScheduledDate').value = o.requiredDate || new Date().toISOString().slice(0, 10);
        openModal('allocateFleetModal');
    };

    window.submitAllocateFleetForm = async function () {
        const payload = {
            orderId: document.getElementById('allocateOrderId').value,
            fleetUnitId: document.getElementById('allocateFleetUnit').value,
            scheduledDate: document.getElementById('allocateScheduledDate').value,
            status: 'scheduled'
        };
        if (!payload.fleetUnitId) { showToast('Select a fleet unit', 'warning'); return; }
        try {
            const saved = await persistToApi(saveOrderAllocationApi, payload);
            if (saved) {
                orderAllocationsDB.push(saved);
            } else {
                payload.id = uid('ALL');
                payload.allocatedBy = typeof getCurrentUser === 'function' ? getCurrentUser()?.username : 'user';
                orderAllocationsDB.push(payload);
            }
            const oidx = clientOrdersDB.findIndex(o => o.id === payload.orderId);
            if (oidx >= 0) clientOrdersDB[oidx].status = 'allocated';
            const uidx = fleetUnitsDB.findIndex(u => u.id === payload.fleetUnitId);
            if (uidx >= 0) fleetUnitsDB[uidx].status = 'allocated';
            saveLocal();
            closeModal('allocateFleetModal');
            showToast('Truck scheduled and allocated to order', 'success');
            refreshFleetPages();
        } catch (e) { showToast(e.message, 'error'); }
    };

    function refreshFleetPages() {
        const ca = document.getElementById('contentArea');
        if (!ca) return;
        if (currentPage === 'client-orders') renderClientOrders(ca);
        else if (currentPage === 'clients') renderClientsManagement(ca);
        else if (currentPage === 'fleet-registry') renderFleetRegistry(ca);
        else if (currentPage === 'route-catalog' && typeof renderRouteCatalog === 'function') renderRouteCatalog(ca);
        else if (currentPage === 'trip-scheduler' && typeof renderTripScheduler === 'function') renderTripScheduler(ca);
        else if (currentPage === 'dashboard' && typeof renderDashboard === 'function') renderDashboard(ca);
        if (typeof updateSidebarBadges === 'function') updateSidebarBadges();
    }

    window.getFleetOrderDashboardStats = getFleetOrderStats;
    window.findFleetUnitByTruckPlate = findUnitByTruckPlate;
    window.syncFleetOrdersFromApi = syncFleetOrdersFromApi;
    window.getFleetClients = () => clientsDB.slice();
    window.getFleetOrders = () => clientOrdersDB.slice();
    window.getFleetUnits = () => fleetUnitsDB.slice();
    window.getFleetDrivers = () => fleetDriversDB.slice();
    window.getFleetTrucks = () => trucksDB.slice();
    window.getFleetTrailers = () => trailersDB.slice();

    if (!loadLocal()) seedDemoIfEmpty();
})();
