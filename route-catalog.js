/**
 * Route Catalog — countries, stations, loading/offloading points, pre-defined routes
 */
(function () {
    const STORAGE_KEY = 'truckcontrol_route_catalog_v1';
    let countriesDB = [];
    let stationsDB = [];
    let routeTemplatesDB = [];

    const FALLBACK_STATIONS = [
        { id: 'durban', name: 'Durban', countryCode: 'ZA', countryName: 'South Africa', loadingPoints: ['Durban Port', 'Clayville'], offloadingPoints: [] },
        { id: 'johannesburg', name: 'Johannesburg', countryCode: 'ZA', countryName: 'South Africa', loadingPoints: ['City Deep', 'Johannesburg Depot'], offloadingPoints: [] },
        { id: 'ndola', name: 'Ndola', countryCode: 'ZM', countryName: 'Zambia', loadingPoints: ['Ndola Depot'], offloadingPoints: ['Ndola Mine'] },
        { id: 'lusaka', name: 'Lusaka', countryCode: 'ZM', countryName: 'Zambia', loadingPoints: ['Lusaka Hub'], offloadingPoints: ['Lusaka Depot'] },
        { id: 'kasumbalesa', name: 'Kasumbalesa', countryCode: 'CD', countryName: 'DRC', loadingPoints: ['Kasumbalesa Border'], offloadingPoints: ['Kasumbalesa Yard'] },
        { id: 'lubumbashi', name: 'Lubumbashi', countryCode: 'CD', countryName: 'DRC', loadingPoints: ['Lubumbashi Depot', 'Kamoto'], offloadingPoints: ['Lubumbashi Mine'] },
        { id: 'kolwezi', name: 'Kolwezi', countryCode: 'CD', countryName: 'DRC', loadingPoints: ['Kolwezi Hub'], offloadingPoints: ['Kolwezi Mine', 'Mutanda'] },
        { id: 'likasi', name: 'Likasi', countryCode: 'CD', countryName: 'DRC', loadingPoints: [], offloadingPoints: ['Likasi Depot', 'Likasi Plant'] },
        { id: 'dar', name: 'Dar es Salaam', countryCode: 'TZ', countryName: 'Tanzania', loadingPoints: ['Dar Port', 'Dar Depot'], offloadingPoints: [] },
        { id: 'kanyaka', name: 'Kanyaka', countryCode: 'CD', countryName: 'DRC', loadingPoints: ['Kanyaka Mine'], offloadingPoints: ['Kanyaka Depot'] },
        { id: 'beira', name: 'Beira', countryCode: 'MZ', countryName: 'Mozambique', loadingPoints: ['Beira Access World', 'Beira Port'], offloadingPoints: [] }
    ];

    function saveLocal() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ countries: countriesDB, stations: stationsDB, routeTemplates: routeTemplatesDB }));
        } catch (_) { /* ignore */ }
    }

    function loadLocal() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return false;
            const data = JSON.parse(raw);
            countriesDB = data.countries || [];
            stationsDB = data.stations || [];
            routeTemplatesDB = data.routeTemplates || [];
            return stationsDB.length > 0;
        } catch (_) { return false; }
    }

    function seedFallback() {
        if (stationsDB.length) return;
        countriesDB = [
            { code: 'ZA', name: 'South Africa' }, { code: 'ZM', name: 'Zambia' },
            { code: 'CD', name: 'DRC' }, { code: 'TZ', name: 'Tanzania' }, { code: 'MZ', name: 'Mozambique' }
        ];
        stationsDB = FALLBACK_STATIONS.map(s => ({ ...s, status: 'active' }));
        routeTemplatesDB = [
            { id: 'RT-ZA-CD', name: 'Durban → Kolwezi (ZA→CD)', originStationId: 'durban', destinationStationId: 'kolwezi', originCountry: 'ZA', destinationCountry: 'CD', routeType: 'international', entryBorder: 'Kasumbalesa', portOfEntry: 'Durban Port', defaultLoadingPoint: 'Durban Port', defaultOffloadingPoint: 'Kolwezi Mine', status: 'active' },
            { id: 'RT-dom-lub-kol', name: 'Lubumbashi → Kolwezi (domestic)', originStationId: 'lubumbashi', destinationStationId: 'kolwezi', originCountry: 'CD', destinationCountry: 'CD', routeType: 'domestic', status: 'active' },
            { id: 'RT-MZ-CD', name: 'Beira → Kolwezi (MZ→CD)', originStationId: 'beira', destinationStationId: 'kolwezi', originCountry: 'MZ', destinationCountry: 'CD', routeType: 'international', entryBorder: 'Kasumbalesa', viaBorder1: 'Forbes/Machipanda', viaBorder2: 'Chirundu', exitBorder: 'Forbes/Machipanda', defaultLoadingPoint: 'Beira Access World', defaultOffloadingPoint: 'Kolwezi Mine', status: 'active' }
        ];
        saveLocal();
    }

    function applyCatalog(catalog) {
        if (!catalog) return;
        countriesDB = catalog.countries || countriesDB;
        stationsDB = catalog.stations || stationsDB;
        routeTemplatesDB = catalog.routeTemplates || routeTemplatesDB;
        saveLocal();
    }

    async function syncRouteCatalogFromApi() {
        if (typeof isApiAvailable === 'function' && isApiAvailable() && typeof fetchRouteCatalog === 'function') {
            try {
                const catalog = await fetchRouteCatalog();
                applyCatalog(catalog);
                return true;
            } catch (e) {
                console.warn('Route catalog sync failed:', e.message);
            }
        }
        if (!loadLocal()) seedFallback();
        return false;
    }

    function getCountries() { return countriesDB.slice(); }
    function getStations() { return stationsDB.slice(); }
    function getRouteTemplates() { return routeTemplatesDB.filter(r => r.status !== 'inactive'); }

    function getStationById(id) {
        return stationsDB.find(s => s.id === id) || null;
    }

    function stationsForCountry(countryCode) {
        if (!countryCode || countryCode === 'all') return stationsDB.filter(s => s.status !== 'inactive');
        return stationsDB.filter(s => s.countryCode === countryCode && s.status !== 'inactive');
    }

    function resolveRouteFromCatalog(originStationId, destStationId) {
        const origin = getStationById(originStationId);
        const dest = getStationById(destStationId);
        if (!origin || !dest) return { routeType: 'domestic', showBorders: false };

        const template = routeTemplatesDB.find(t =>
            t.originStationId === originStationId && t.destinationStationId === destStationId && t.status !== 'inactive'
        );

        const loadingPoints = origin.loadingPoints || [];
        const offloadingPoints = dest.offloadingPoints || [];
        const base = {
            origin: origin.name, destination: dest.name,
            originCountry: origin.countryCode, destinationCountry: dest.countryCode,
            originCountryName: origin.countryName, destinationCountryName: dest.countryName,
            loadingPoints, offloadingPoints,
            loadingPoint: loadingPoints[0] || origin.name,
            offloadingPoint: offloadingPoints[0] || dest.name
        };

        if (origin.countryCode === dest.countryCode) {
            return { ...base, routeType: 'domestic', showBorders: false, entryBorder: '', viaBorder1: '', viaBorder2: '', portOfEntry: '', exitBorder: '' };
        }

        if (template) {
            return {
                ...base, routeType: 'international', showBorders: true,
                entryBorder: template.entryBorder || '', viaBorder1: template.viaBorder1 || '',
                viaBorder2: template.viaBorder2 || '', portOfEntry: template.portOfEntry || '',
                exitBorder: template.exitBorder || '',
                loadingPoint: template.defaultLoadingPoint || base.loadingPoint,
                offloadingPoint: template.defaultOffloadingPoint || base.offloadingPoint,
                routeTemplateId: template.id, routeTemplateName: template.name
            };
        }

        return {
            ...base, routeType: 'international', showBorders: true,
            entryBorder: 'Kasumbalesa', viaBorder1: '', viaBorder2: '',
            portOfEntry: loadingPoints[0] || '', exitBorder: 'Kasumbalesa'
        };
    }

    function canEdit() {
        return typeof canEditInModule === 'function' ? canEditInModule('route-catalog') : true;
    }

    window.renderRouteCatalog = async function (container) {
        await syncRouteCatalogFromApi();
        const countries = getCountries();
        const stations = getStations();
        const routes = getRouteTemplates();
        const edit = canEdit();

        container.innerHTML = `
            <div class="page-header">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;">
                    <div>
                        <h1>🗺️ Route Catalog</h1>
                        <div class="breadcrumb">Management / Pre-define routes, stations, loading & offloading points before orders use them</div>
                    </div>
                    ${edit ? `<div style="display:flex;gap:8px;"><button class="btn btn-outline" onclick="openStationModal()">+ Station</button><button class="btn btn-primary" onclick="openRouteTemplateModal()">+ Route</button></div>` : ''}
                </div>
            </div>
            <div class="kpi-grid" style="margin-bottom:20px;">
                <div class="kpi-card blue"><div class="kpi-card-value">${countries.length}</div><div class="kpi-card-label">Countries</div></div>
                <div class="kpi-card green"><div class="kpi-card-value">${stations.length}</div><div class="kpi-card-label">Stations</div></div>
                <div class="kpi-card orange"><div class="kpi-card-value">${routes.length}</div><div class="kpi-card-label">Pre-defined Routes</div></div>
                <div class="kpi-card blue"><div class="kpi-card-value">${routes.filter(r => r.routeType === 'international').length}</div><div class="kpi-card-label">International</div></div>
            </div>
            <div class="table-container" style="margin-bottom:24px;">
                <div class="table-header"><h3>Stations &amp; Points</h3></div>
                <table class="data-table">
                    <thead><tr><th>Station</th><th>Country</th><th>Loading Points</th><th>Offloading Points</th><th>Status</th>${edit ? '<th></th>' : ''}</tr></thead>
                    <tbody>
                        ${stations.length ? stations.map(s => `<tr>
                            <td><strong>${s.name}</strong></td>
                            <td>${s.countryName || s.countryCode}</td>
                            <td>${(s.loadingPoints || []).join(', ') || '—'}</td>
                            <td>${(s.offloadingPoints || []).join(', ') || '—'}</td>
                            <td><span class="status-badge ${s.status === 'active' ? 'green' : 'gray'}">${s.status || 'active'}</span></td>
                            ${edit ? `<td><button class="btn btn-sm btn-outline" onclick="openStationModal('${s.id}')">✏️</button></td>` : ''}
                        </tr>`).join('') : '<tr><td colspan="6" style="text-align:center;padding:20px;">No stations — add stations first.</td></tr>'}
                    </tbody>
                </table>
            </div>
            <div class="table-container">
                <div class="table-header"><h3>Pre-defined Routes</h3></div>
                <table class="data-table">
                    <thead><tr><th>Route Name</th><th>Origin</th><th>Destination</th><th>Type</th><th>Borders</th><th>Default Points</th>${edit ? '<th></th>' : ''}</tr></thead>
                    <tbody>
                        ${routes.length ? routes.map(r => {
                            const os = getStationById(r.originStationId);
                            const ds = getStationById(r.destinationStationId);
                            const borders = [r.entryBorder, r.viaBorder1, r.viaBorder2, r.exitBorder].filter(Boolean).join(' → ') || '—';
                            return `<tr>
                                <td><strong>${r.name}</strong></td>
                                <td>${os?.name || r.originStationId} (${r.originCountry})</td>
                                <td>${ds?.name || r.destinationStationId} (${r.destinationCountry})</td>
                                <td><span class="status-badge ${r.routeType === 'international' ? 'orange' : 'green'}">${r.routeType}</span></td>
                                <td style="font-size:12px;">${borders}</td>
                                <td style="font-size:12px;">${r.defaultLoadingPoint || '—'} → ${r.defaultOffloadingPoint || '—'}</td>
                                ${edit ? `<td><button class="btn btn-sm btn-outline" onclick="openRouteTemplateModal('${r.id}')">✏️</button></td>` : ''}
                            </tr>`;
                        }).join('') : '<tr><td colspan="7" style="text-align:center;padding:20px;">No routes yet — create a route linking origin and destination stations.</td></tr>'}
                    </tbody>
                </table>
            </div>`;
    };

    window.openStationModal = function (stationId) {
        const s = stationId ? getStationById(stationId) : null;
        const countries = getCountries();
        document.getElementById('rcStationId').value = s?.id || '';
        document.getElementById('rcStationName').value = s?.name || '';
        document.getElementById('rcStationCountry').innerHTML = countries.map(c =>
            `<option value="${c.code}"${c.code === (s?.countryCode || '') ? ' selected' : ''}>${c.name}</option>`
        ).join('');
        document.getElementById('rcLoadingPoints').value = (s?.loadingPoints || []).join('\n');
        document.getElementById('rcOffloadingPoints').value = (s?.offloadingPoints || []).join('\n');
        document.getElementById('stationModalTitle').textContent = s ? 'Edit Station' : 'Add Station';
        openModal('stationModal');
    };

    window.submitStationForm = async function () {
        const payload = {
            id: document.getElementById('rcStationId').value || undefined,
            name: document.getElementById('rcStationName').value.trim(),
            countryCode: document.getElementById('rcStationCountry').value,
            loadingPoints: document.getElementById('rcLoadingPoints').value.split('\n').map(s => s.trim()).filter(Boolean),
            offloadingPoints: document.getElementById('rcOffloadingPoints').value.split('\n').map(s => s.trim()).filter(Boolean),
            status: 'active'
        };
        if (!payload.name) { showToast('Station name is required', 'warning'); return; }
        try {
            let saved = null;
            if (typeof saveRouteStationApi === 'function' && typeof isApiAvailable === 'function' && isApiAvailable()) {
                saved = await saveRouteStationApi(payload);
            }
            if (saved) {
                const idx = stationsDB.findIndex(x => x.id === saved.id);
                if (idx >= 0) stationsDB[idx] = saved; else stationsDB.push(saved);
            } else {
                payload.id = payload.id || `ST-${Date.now()}`;
                const country = getCountries().find(c => c.code === payload.countryCode);
                const row = { ...payload, countryName: country?.name || payload.countryCode };
                const idx = stationsDB.findIndex(x => x.id === payload.id);
                if (idx >= 0) stationsDB[idx] = row; else stationsDB.push(row);
            }
            saveLocal();
            closeModal('stationModal');
            showToast('Station saved', 'success');
            const ca = document.getElementById('contentArea');
            if (currentPage === 'route-catalog' && ca) renderRouteCatalog(ca);
        } catch (e) { showToast(e.message, 'error'); }
    };

    window.openRouteTemplateModal = function (routeId) {
        const r = routeId ? routeTemplatesDB.find(x => x.id === routeId) : null;
        const stations = getStations();
        const stationOpts = (sel) => stations.map(s =>
            `<option value="${s.id}"${s.id === sel ? ' selected' : ''}>${s.name} (${s.countryName || s.countryCode})</option>`
        ).join('');
        document.getElementById('rcRouteId').value = r?.id || '';
        document.getElementById('rcRouteName').value = r?.name || '';
        document.getElementById('rcRouteOrigin').innerHTML = `<option value="">— Select —</option>${stationOpts(r?.originStationId)}`;
        document.getElementById('rcRouteDest').innerHTML = `<option value="">— Select —</option>${stationOpts(r?.destinationStationId)}`;
        document.getElementById('rcRouteEntryBorder').value = r?.entryBorder || '';
        document.getElementById('rcRouteVia1').value = r?.viaBorder1 || '';
        document.getElementById('rcRouteVia2').value = r?.viaBorder2 || '';
        document.getElementById('rcRoutePort').value = r?.portOfEntry || '';
        document.getElementById('rcRouteExitBorder').value = r?.exitBorder || '';
        document.getElementById('rcRouteLoadPoint').value = r?.defaultLoadingPoint || '';
        document.getElementById('rcRouteOffloadPoint').value = r?.defaultOffloadingPoint || '';
        document.getElementById('routeTemplateModalTitle').textContent = r ? 'Edit Route' : 'Create Route';
        openModal('routeTemplateModal');
    };

    window.submitRouteTemplateForm = async function () {
        const payload = {
            id: document.getElementById('rcRouteId').value || undefined,
            name: document.getElementById('rcRouteName').value.trim(),
            originStationId: document.getElementById('rcRouteOrigin').value,
            destinationStationId: document.getElementById('rcRouteDest').value,
            entryBorder: document.getElementById('rcRouteEntryBorder').value.trim(),
            viaBorder1: document.getElementById('rcRouteVia1').value.trim(),
            viaBorder2: document.getElementById('rcRouteVia2').value.trim(),
            portOfEntry: document.getElementById('rcRoutePort').value.trim(),
            exitBorder: document.getElementById('rcRouteExitBorder').value.trim(),
            defaultLoadingPoint: document.getElementById('rcRouteLoadPoint').value.trim(),
            defaultOffloadingPoint: document.getElementById('rcRouteOffloadPoint').value.trim(),
            status: 'active'
        };
        if (!payload.originStationId || !payload.destinationStationId) {
            showToast('Select origin and destination stations', 'warning'); return;
        }
        try {
            let saved = null;
            if (typeof saveRouteTemplateApi === 'function' && typeof isApiAvailable === 'function' && isApiAvailable()) {
                saved = await saveRouteTemplateApi(payload);
            }
            if (saved) {
                const idx = routeTemplatesDB.findIndex(x => x.id === saved.id);
                if (idx >= 0) routeTemplatesDB[idx] = saved; else routeTemplatesDB.push(saved);
            } else {
                const origin = getStationById(payload.originStationId);
                const dest = getStationById(payload.destinationStationId);
                payload.id = payload.id || `RT-${Date.now()}`;
                payload.name = payload.name || `${origin?.name} → ${dest?.name}`;
                payload.originCountry = origin?.countryCode || '';
                payload.destinationCountry = dest?.countryCode || '';
                payload.routeType = payload.originCountry === payload.destinationCountry ? 'domestic' : 'international';
                const idx = routeTemplatesDB.findIndex(x => x.id === payload.id);
                if (idx >= 0) routeTemplatesDB[idx] = payload; else routeTemplatesDB.push(payload);
            }
            saveLocal();
            closeModal('routeTemplateModal');
            showToast('Route saved', 'success');
            const ca = document.getElementById('contentArea');
            if (currentPage === 'route-catalog' && ca) renderRouteCatalog(ca);
        } catch (e) { showToast(e.message, 'error'); }
    };

    // Public API for fleet-orders.js
    window.getRouteCatalogCountries = getCountries;
    window.getRouteCatalogStations = getStations;
    window.getRouteCatalogTemplates = getRouteTemplates;
    window.getRouteCatalogStationById = getStationById;
    window.resolveRouteFromCatalog = resolveRouteFromCatalog;
    window.stationsForRouteCountry = stationsForCountry;
    window.syncRouteCatalogFromApi = syncRouteCatalogFromApi;

    if (!loadLocal()) seedFallback();
})();
