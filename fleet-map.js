/**
 * Interactive fleet map — truck GPS pins (Leaflet + OpenStreetMap)
 */
(function () {
    const DEFAULT_CENTER = [-11.5, 26.5];
    const DEFAULT_ZOOM = 6;

    let pageMap = null;
    let pageMarkers = [];
    let modalMap = null;
    let modalMarkers = [];
    let fleetMapStatusTab = 'NB';
    let fleetMapSearchNb = '';
    let fleetMapSearchSb = '';

    function getFleetMapTruckPlates() {
        return new Set(getMappableUnits().map(u => u.truckPlate).filter(Boolean));
    }

    function getFleetMapTrips(direction) {
        const plates = getFleetMapTruckPlates();
        if (!plates.size || !window.tripsDB) return [];
        return Object.values(window.tripsDB).filter(t => t.direction === direction && plates.has(t.truck));
    }

    function filterFleetMapTrips(trips, direction) {
        let list = [...trips];
        const kpiEl = document.getElementById(direction === 'NB' ? 'fleetMapNbKpiFilter' : 'fleetMapSbKpiFilter');
        const kpi = kpiEl?.value || 'all';
        if (kpi !== 'all') list = list.filter(t => (t.kpi || 'green') === kpi);
        const term = (direction === 'NB' ? fleetMapSearchNb : fleetMapSearchSb).toLowerCase();
        if (term) {
            list = list.filter(t =>
                String(t.tripNumber || t.trip || '').toLowerCase().includes(term)
                || String(t.truck || '').toLowerCase().includes(term)
                || String(t.driver || '').toLowerCase().includes(term)
                || String(t.area || '').toLowerCase().includes(term)
                || String(t.status || '').toLowerCase().includes(term)
            );
        }
        return list;
    }

    function renderFleetMapStatusSection() {
        const nbTrips = filterFleetMapTrips(getFleetMapTrips('NB'), 'NB');
        const sbTrips = filterFleetMapTrips(getFleetMapTrips('SB'), 'SB');
        const tab = fleetMapStatusTab;
        const listKey = tab === 'NB' ? 'fleet-map-nb' : 'fleet-map-sb';
        const type = tab;
        const trips = tab === 'NB' ? nbTrips : sbTrips;
        const tableId = tab === 'NB' ? 'fleetMapNbTable' : 'fleetMapSbTable';
        const headerHtml = typeof getOperationsTableHeaderHtml === 'function'
            ? getOperationsTableHeaderHtml(type, listKey)
            : '<th>Trip #</th><th>Truck</th><th>Driver</th><th>Status</th><th>KPI</th><th>Actions</th>';
        const bodyHtml = typeof renderOperationsTableRows === 'function'
            ? renderOperationsTableRows(trips, listKey, type, tab === 'NB' ? 'nb-operations' : 'sb-operations')
            : '<tr><td colspan="8" style="text-align:center;padding:16px;">No trips</td></tr>';
        const colToolbar = typeof renderLiveColumnToolbar === 'function'
            ? renderLiveColumnToolbar(type, tableId, listKey)
            : '';

        return `
            <div class="settings-card fleet-map-status-card" style="margin-top:12px;">
                <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:12px;">
                    <h3 style="margin:0;">Truck operational status (on map)</h3>
                    <div class="comm-app-tabs" style="margin:0;">
                        <button type="button" class="comm-app-tab${tab === 'NB' ? ' active' : ''}" onclick="setFleetMapStatusTab('NB')">🚛 NB (${nbTrips.length})</button>
                        <button type="button" class="comm-app-tab${tab === 'SB' ? ' active' : ''}" onclick="setFleetMapStatusTab('SB')">🚛 SB (${sbTrips.length})</button>
                    </div>
                </div>
                <div class="filters-bar" style="margin-bottom:12px;">
                    <div class="filter-group"><label>KPI:</label>
                        <select id="fleetMap${tab}KpiFilter" onchange="refreshFleetMapStatusTables()">
                            <option value="all">All</option>
                            <option value="green">🟢 On Track</option>
                            <option value="orange">🟠 Priority</option>
                            <option value="red">🔴 Overdue</option>
                        </select>
                    </div>
                    <div class="search-filter"><span>🔍</span>
                        <input type="text" id="fleetMap${tab}Search" placeholder="Search Trip#, Truck, Driver…" value="${tab === 'NB' ? fleetMapSearchNb : fleetMapSearchSb}" onkeyup="fleetMapSearch${tab === 'NB' ? 'Nb' : 'Sb'}=this.value;refreshFleetMapStatusTables()">
                    </div>
                    <button type="button" class="btn btn-outline btn-sm" onclick="clearFleetMapStatusFilters()">Clear</button>
                </div>
                <div class="table-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px;">
                    <span style="color:var(--text-secondary);font-size:13px;">${trips.length} truck(s) with GPS on map · ${type} operations view</span>
                    ${colToolbar}
                </div>
                <div style="overflow-x:auto;">
                    <table class="live-page-table operations-live-table" id="${tableId}">
                        <thead><tr>${headerHtml}</tr></thead>
                        <tbody>${bodyHtml}</tbody>
                    </table>
                </div>
            </div>`;
    }

    window.setFleetMapStatusTab = function (tab) {
        fleetMapStatusTab = tab === 'SB' ? 'SB' : 'NB';
        refreshFleetMapStatusTables();
    };

    window.clearFleetMapStatusFilters = function () {
        fleetMapSearchNb = '';
        fleetMapSearchSb = '';
        const nbS = document.getElementById('fleetMapNbSearch');
        const sbS = document.getElementById('fleetMapSbSearch');
        const nbK = document.getElementById('fleetMapNbKpiFilter');
        const sbK = document.getElementById('fleetMapSbKpiFilter');
        if (nbS) nbS.value = '';
        if (sbS) sbS.value = '';
        if (nbK) nbK.value = 'all';
        if (sbK) sbK.value = 'all';
        refreshFleetMapStatusTables();
    };

    window.refreshFleetMapStatusTables = function () {
        const host = document.getElementById('fleetMapStatusHost');
        if (!host) return;
        host.innerHTML = renderFleetMapStatusSection();
        const tableId = fleetMapStatusTab === 'NB' ? 'fleetMapNbTable' : 'fleetMapSbTable';
        const ctx = fleetMapStatusTab;
        setTimeout(() => {
            if (typeof applyLiveTableLayout === 'function') applyLiveTableLayout(tableId, ctx);
        }, 0);
    };

    function ensureLeaflet() {
        return typeof L !== 'undefined';
    }

    function getMappableUnits() {
        const units = typeof getFleetUnits === 'function' ? getFleetUnits() : [];
        return units.filter(u => u.gpsLat != null && u.gpsLng != null && !isNaN(u.gpsLat) && !isNaN(u.gpsLng));
    }

    function getDriverName(unit) {
        if (!unit?.driverId) return '—';
        const drivers = typeof getFleetDrivers === 'function' ? getFleetDrivers() : [];
        return drivers.find(d => d.id === unit.driverId)?.name || '—';
    }

    function getTripForUnit(unit) {
        if (!unit?.truckPlate || !window.tripsDB) return null;
        return Object.values(window.tripsDB).find(t => t.truck === unit.truckPlate) || null;
    }

    function getOrderForUnit(unit) {
        if (!unit?.id || typeof getFleetOrders !== 'function') return null;
        const allocs = typeof getFleetAllocations === 'function' ? getFleetAllocations() : [];
        const orders = getFleetOrders();
        const alloc = allocs.find(a => a.fleetUnitId === unit.id && a.status !== 'cancelled');
        if (!alloc) return null;
        return orders.find(o => o.id === alloc.orderId) || null;
    }

    function statusColor(status) {
        const map = { allocated: '#dd6b20', in_transit: '#38a169', available: '#3182ce', maintenance: '#718096' };
        return map[status] || '#2b6cb0';
    }

    function truckIcon(color) {
        return L.divIcon({
            className: 'fleet-map-pin',
            html: `<span class="fleet-map-pin-dot" style="background:${color}"></span>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
            popupAnchor: [0, -14]
        });
    }

    function escapeHtml(str) {
        return String(str ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function buildPopupContent(unit) {
        const driver = getDriverName(unit);
        const trip = getTripForUnit(unit);
        const order = getOrderForUnit(unit);
        const plate = escapeHtml(unit.truckPlate);
        const trailer = unit.trailerPlate ? ` + ${escapeHtml(unit.trailerPlate)}` : '';
        const updated = unit.gpsUpdatedAt ? new Date(unit.gpsUpdatedAt).toLocaleString() : '—';
        const tripLine = trip
            ? `<div><strong>Trip:</strong> ${escapeHtml(trip.tripNumber || trip.trip || '—')}</div>`
            : '';
        const orderLine = order
            ? `<div><strong>Order:</strong> ${escapeHtml(order.orderNumber || order.id)}</div>`
            : '';

        return `<div class="fleet-map-popup">
            <div class="fleet-map-popup-title">🚛 ${plate}${trailer}</div>
            <div><strong>Driver:</strong> ${escapeHtml(driver)}</div>
            <div><strong>Location:</strong> ${escapeHtml(unit.gpsLabel || 'Live GPS')}</div>
            <div><strong>Status:</strong> ${escapeHtml(unit.status || '—')}</div>
            ${tripLine}${orderLine}
            <div style="font-size:11px;color:#718096;margin-top:4px;">${unit.gpsLat.toFixed(5)}, ${unit.gpsLng.toFixed(5)} · ${updated}</div>
            <div class="fleet-map-popup-actions">
                <button type="button" class="btn btn-primary btn-sm" onclick="openFleetGpsMap('${escapeHtml(unit.id)}')">📍 Truck detail map</button>
            </div>
        </div>`;
    }

    function clearMarkers(markers) {
        markers.forEach(m => {
            try { m.remove(); } catch (e) { /* ignore */ }
        });
        markers.length = 0;
    }

    function destroyMap(mapRef) {
        if (!mapRef) return null;
        try { mapRef.remove(); } catch (e) { /* ignore */ }
        return null;
    }

    function fitMapToUnits(map, units, focusUnitId) {
        if (!map || !units.length) return;
        if (focusUnitId) {
            const focus = units.find(u => u.id === focusUnitId);
            if (focus) {
                map.setView([focus.gpsLat, focus.gpsLng], 11);
                return;
            }
        }
        if (units.length === 1) {
            map.setView([units[0].gpsLat, units[0].gpsLng], 10);
            return;
        }
        const bounds = L.latLngBounds(units.map(u => [u.gpsLat, u.gpsLng]));
        map.fitBounds(bounds.pad(0.15));
    }

    function renderMarkers(map, units, markers, focusUnitId) {
        clearMarkers(markers);
        units.forEach(unit => {
            const marker = L.marker([unit.gpsLat, unit.gpsLng], {
                icon: truckIcon(statusColor(unit.status)),
                title: unit.truckPlate
            });
            marker.bindPopup(buildPopupContent(unit), { maxWidth: 320 });
            marker.addTo(map);
            markers.push(marker);
            if (focusUnitId && unit.id === focusUnitId) {
                setTimeout(() => {
                    marker.openPopup();
                }, 350);
            }
        });
    }

    function initMapOnElement(el, units, opts) {
        if (!ensureLeaflet() || !el) return null;
        const map = L.map(el, { scrollWheelZoom: true }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19
        }).addTo(map);
        const markers = opts.markers || [];
        renderMarkers(map, units, markers, opts.focusUnitId);
        fitMapToUnits(map, units, opts.focusUnitId);
        setTimeout(() => { try { map.invalidateSize(); } catch (e) { /* ignore */ } }, 200);
        return map;
    }

    function refreshMap(map, markers, units, focusUnitId) {
        if (!map) return;
        renderMarkers(map, units, markers, focusUnitId);
        fitMapToUnits(map, units, focusUnitId);
        setTimeout(() => { try { map.invalidateSize(); } catch (e) { /* ignore */ } }, 100);
    }

    window.renderFleetMap = function (container) {
        const units = getMappableUnits();
        const noGps = (typeof getFleetUnits === 'function' ? getFleetUnits() : []).length - units.length;

        container.innerHTML = `
            <div class="page-header admin-page-header">
                <div>
                    <h1>🗺️ Fleet Map</h1>
                    <p class="page-subtitle">Live truck positions — click a pin to view truck details and open the position map</p>
                </div>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <button class="btn btn-outline" onclick="navigateTo('position-live')">📍 Position Live</button>
                    <button class="btn btn-outline" onclick="navigateTo('fleet-registry')">🚛 Fleet Registry</button>
                    <button class="btn btn-primary" onclick="refreshFleetMapPage()">↻ Refresh</button>
                </div>
            </div>
            <div class="kpi-row">
                <div class="kpi-mini"><div class="kpi-value">${units.length}</div><div class="kpi-label">Trucks on map</div></div>
                <div class="kpi-mini"><div class="kpi-value">${noGps > 0 ? noGps : '—'}</div><div class="kpi-label">Missing GPS</div></div>
            </div>
            ${units.length ? '' : `<div class="settings-card" style="margin-bottom:12px;"><p style="margin:0;color:var(--text-secondary);">No trucks with GPS coordinates yet. Add latitude/longitude in <strong>Fleet Registry</strong> → edit a fleet set → GPS tracking.</p></div>`}
            <div class="settings-card fleet-map-card">
                <div id="fleetMapPageContainer" class="fleet-map-container"></div>
            </div>
            <div id="fleetMapStatusHost">${renderFleetMapStatusSection()}</div>`;

        pageMap = destroyMap(pageMap);
        pageMarkers = [];
        const el = document.getElementById('fleetMapPageContainer');
        if (!el) return;

        if (!ensureLeaflet()) {
            el.innerHTML = '<p style="padding:24px;color:var(--danger);">Map library failed to load. Check your network connection and refresh.</p>';
            return;
        }

        pageMap = initMapOnElement(el, units, { markers: pageMarkers });
        setTimeout(() => {
            if (typeof applyLiveTableLayout === 'function') {
                const tableId = fleetMapStatusTab === 'NB' ? 'fleetMapNbTable' : 'fleetMapSbTable';
                applyLiveTableLayout(tableId, fleetMapStatusTab);
            }
        }, 0);
    };

    window.refreshFleetMapPage = function () {
        const ca = document.getElementById('contentArea');
        if (ca && typeof renderFleetMap === 'function') renderFleetMap(ca);
    };

    window.focusFleetMapTruck = function (unitId) {
        const units = getMappableUnits();
        if (!pageMap) {
            if (typeof navigateTo === 'function') navigateTo('fleet-map');
            setTimeout(() => focusFleetMapTruck(unitId), 400);
            return;
        }
        refreshMap(pageMap, pageMarkers, units, unitId);
        const unit = units.find(u => u.id === unitId);
        if (unit) {
            const el = document.getElementById('fleetMapPageContainer');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    };

    window.openFleetMapModal = function (opts) {
        if (!ensureLeaflet()) {
            if (typeof showToast === 'function') showToast('Map library not loaded', 'error');
            return;
        }
        const units = getMappableUnits();
        if (!units.length) {
            if (typeof showToast === 'function') showToast('No trucks with GPS coordinates. Add GPS in Fleet Registry.', 'warning');
            return;
        }
        const focusUnitId = typeof opts === 'string' ? opts : (opts?.unitId || (opts?.truckPlate && typeof findFleetUnitByTruckPlate === 'function' ? findFleetUnitByTruckPlate(opts.truckPlate)?.id : null));

        const modal = document.getElementById('fleetMapModal');
        if (!modal) return;

        const countEl = document.getElementById('fleetMapModalCount');
        if (countEl) countEl.textContent = `${units.length} truck${units.length !== 1 ? 's' : ''} with GPS`;

        if (typeof openModal === 'function') openModal('fleetMapModal');
        else modal.style.display = 'flex';

        modalMap = destroyMap(modalMap);
        modalMarkers = [];
        const el = document.getElementById('fleetMapModalContainer');
        if (!el) return;

        modalMap = initMapOnElement(el, units, { markers: modalMarkers, focusUnitId });
    };

    window.refreshFleetMapModal = function () {
        const units = getMappableUnits();
        if (modalMap) refreshMap(modalMap, modalMarkers, units);
    };

    window.initFleetGpsLeafletMap = function (containerEl, unit) {
        if (!ensureLeaflet() || !containerEl || !unit) return null;
        containerEl.innerHTML = '';
        const map = L.map(containerEl, { scrollWheelZoom: true }).setView([unit.gpsLat, unit.gpsLng], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap',
            maxZoom: 19
        }).addTo(map);
        const markers = [];
        renderMarkers(map, [unit], markers);
        setTimeout(() => { try { map.invalidateSize(); } catch (e) { /* ignore */ } }, 200);
        return map;
    };

    window.destroyFleetGpsLeafletMap = function (map) {
        return destroyMap(map);
    };

    document.addEventListener('click', (e) => {
        const closeBtn = e.target.closest('[data-close-fleet-map-modal]');
        if (closeBtn) {
            modalMap = destroyMap(modalMap);
            modalMarkers = [];
        }
    });
})();
