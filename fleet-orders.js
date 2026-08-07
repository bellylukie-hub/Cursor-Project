/**
 * Client Orders, Fleet Registry (truck + trailer + driver), and Order Allocation
 */
(function () {
    const STORAGE_KEY = 'truckcontrol_fleet_orders_v1';

    let clientsDB = [];
    let fleetDriversDB = [];
    let fleetUnitsDB = [];
    let clientOrdersDB = [];
    let orderAllocationsDB = [];

    let orderFilter = { search: '', status: 'all', clientId: 'all' };
    let fleetFilter = { search: '', status: 'all' };
    let fleetRegistryTab = 'units';

    function uid(prefix) { return `${prefix}-${Date.now()}`; }

    function saveLocal() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                clients: clientsDB, drivers: fleetDriversDB, units: fleetUnitsDB,
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
            { id: 'FU-001', truckPlate: 'ABC123DRC', trailerPlate: 'TRL-456', vehicleType: 'Truck', driverId: 'DRV-001', gpsDeviceId: 'GPS-001', gpsLat: -10.7167, gpsLng: 25.4667, gpsLabel: 'Kasumbalesa', status: 'allocated' },
            { id: 'FU-002', truckPlate: 'XYZ789DRC', trailerPlate: 'TRL-890', vehicleType: 'Truck', driverId: 'DRV-002', gpsDeviceId: 'GPS-002', gpsLat: -11.66, gpsLng: 27.4794, gpsLabel: 'Kolwezi', status: 'available' }
        ];
        clientOrdersDB = [
            { id: 'ORD-001', orderNumber: 'CO-2026-1001', clientId: 'CLI-001', origin: 'Durban', destination: 'Kolwezi Mine', loadingPoint: 'Durban Port', offloadingPoint: 'Kolwezi Mine', commodity: 'Copper Cathodes', cargoType: 'Bulk', requiredDate: '2026-08-15', status: 'allocated', priority: 'high', kpi: 'green' },
            { id: 'ORD-002', orderNumber: 'CO-2026-1002', clientId: 'CLI-002', origin: 'Dar es Salaam', destination: 'Likasi', commodity: 'Sulphuric Acid', cargoType: 'Liquid', requiredDate: '2026-08-20', status: 'draft', priority: 'normal', kpi: 'orange' }
        ];
        orderAllocationsDB = [
            { id: 'ALL-001', orderId: 'ORD-001', fleetUnitId: 'FU-001', scheduledDate: '2026-08-10', status: 'scheduled', allocatedBy: 'super_admin' }
        ];
        saveLocal();
    }

    function applyBundle(bundle) {
        if (!bundle) return;
        clientsDB = bundle.clients || clientsDB;
        fleetDriversDB = bundle.drivers || fleetDriversDB;
        fleetUnitsDB = bundle.units || fleetUnitsDB;
        clientOrdersDB = bundle.orders || clientOrdersDB;
        orderAllocationsDB = bundle.allocations || orderAllocationsDB;
        saveLocal();
    }

    async function syncFleetOrdersFromApi() {
        if (typeof isApiAvailable !== 'function' || !isApiAvailable()) {
            if (!loadLocal()) seedDemoIfEmpty();
            return false;
        }
        try {
            const bundle = await fetchFleetOrderBundle();
            applyBundle(bundle);
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
    function filteredOrders() {
        const q = (orderFilter.search || '').toLowerCase();
        return clientOrdersDB.filter(o => {
            const client = getClientById(o.clientId);
            if (orderFilter.status !== 'all' && o.status !== orderFilter.status) return false;
            if (orderFilter.clientId !== 'all' && o.clientId !== orderFilter.clientId) return false;
            if (!q) return true;
            const hay = [o.orderNumber, o.commodity, o.origin, o.destination, client?.name].join(' ').toLowerCase();
            return hay.includes(q);
        });
    }

    window.renderClientOrders = function (container) {
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
            <div class="filters-bar">
                <div class="search-filter" style="flex:1;"><span>🔍</span>
                    <input type="text" placeholder="Search order, client, commodity..." value="${orderFilter.search}" oninput="fleetOrderSetFilter('search', this.value)">
                </div>
                <select class="form-control" onchange="fleetOrderSetFilter('status', this.value)">
                    <option value="all"${orderFilter.status === 'all' ? ' selected' : ''}>All statuses</option>
                    ${['draft', 'confirmed', 'allocated', 'in_transit', 'completed', 'cancelled'].map(s =>
                        `<option value="${s}"${orderFilter.status === s ? ' selected' : ''}>${s}</option>`).join('')}
                </select>
                <select class="form-control" onchange="fleetOrderSetFilter('clientId', this.value)">
                    <option value="all">All clients</option>
                    ${clientsDB.map(c => `<option value="${c.id}"${orderFilter.clientId === c.id ? ' selected' : ''}>${c.name}</option>`).join('')}
                </select>
            </div>
            <div class="table-container">
                <div class="table-header"><h3>Orders (${orders.length})</h3></div>
                <table>
                    <thead><tr>
                        <th>Order #</th><th>Client</th><th>Route</th><th>Commodity</th><th>Required</th>
                        <th>Status</th><th>KPI</th><th>Allocated Fleet</th><th>Actions</th>
                    </tr></thead>
                    <tbody>
                        ${orders.length ? orders.map(o => {
                            const client = getClientById(o.clientId);
                            const allocs = getAllocationsForOrder(o.id);
                            const fleetLabels = allocs.map(a => {
                                const u = getUnitById(a.fleetUnitId);
                                return u ? `${u.truckPlate}${u.trailerPlate ? '/' + u.trailerPlate : ''}` : '—';
                            }).join(', ') || '—';
                            return `<tr>
                                <td><strong>${o.orderNumber}</strong></td>
                                <td>${client?.name || '—'}</td>
                                <td>${o.origin || '—'} → ${o.destination || '—'}</td>
                                <td>${o.commodity || '—'}</td>
                                <td>${o.requiredDate || '—'}</td>
                                <td>${orderStatusBadge(o.status)}</td>
                                <td>${kpiBadge(o.kpi)}</td>
                                <td>${fleetLabels}</td>
                                <td style="white-space:nowrap;">
                                    ${canEdit ? `<button class="btn btn-sm btn-outline" onclick="openAllocateFleetModal('${o.id}')">🚛 Schedule</button>` : ''}
                                    ${canEdit ? `<button class="btn btn-sm btn-outline" onclick="openClientOrderModal('${o.id}')">✏️</button>` : ''}
                                    ${allocs[0] ? `<button class="btn btn-sm btn-primary" onclick="openFleetGpsMap('${allocs[0].fleetUnitId}')">📍 Map</button>` : ''}
                                </td>
                            </tr>`;
                        }).join('') : '<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--text-secondary);">No orders yet. Create a client order and schedule a truck-trailer-driver set.</td></tr>'}
                    </tbody>
                </table>
            </div>`;
    };

    window.fleetOrderSetFilter = function (key, val) {
        orderFilter[key] = val;
        const ca = document.getElementById('contentArea');
        if (currentPage === 'client-orders' && ca) renderClientOrders(ca);
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
                        ${canEdit ? `<button class="btn btn-outline" onclick="openFleetDriverModal()">+ Driver</button>` : ''}
                        ${canEdit ? `<button class="btn btn-primary" onclick="openFleetUnitModal()">+ Truck / Fleet Set</button>` : ''}
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
                <button class="btn ${fleetRegistryTab === 'units' ? 'btn-primary' : 'btn-outline'}" onclick="setFleetRegistryTab('units')">Trucks & Trailers</button>
                <button class="btn ${fleetRegistryTab === 'drivers' ? 'btn-primary' : 'btn-outline'}" onclick="setFleetRegistryTab('drivers')">Drivers</button>
                <button class="btn ${fleetRegistryTab === 'clients' ? 'btn-primary' : 'btn-outline'}" onclick="setFleetRegistryTab('clients')">Clients</button>
                <div class="search-filter" style="flex:1;margin-left:12px;"><span>🔍</span>
                    <input type="text" placeholder="Search..." value="${fleetFilter.search}" oninput="fleetRegistrySetSearch(this.value)">
                </div>
            </div>
            ${fleetRegistryTab === 'units' ? renderUnitsTable(units, canEdit) : ''}
            ${fleetRegistryTab === 'drivers' ? renderDriversTable(drivers, canEdit) : ''}
            ${fleetRegistryTab === 'clients' ? renderClientsTable(clientsDB, canEdit) : ''}`;
    };

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
            if (typeof saveClientApi === 'function' && isApiAvailable()) {
                const saved = await saveClientApi(payload);
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
            if (typeof saveFleetDriverApi === 'function' && isApiAvailable()) {
                const saved = await saveFleetDriverApi(payload);
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
        document.getElementById('fleetUnitModalTitle').textContent = unitId ? 'Edit Fleet Set' : 'Register Truck + Trailer + Driver';
        document.getElementById('fleetUnitFormId').value = u.id || '';
        document.getElementById('fleetUnitFormTruck').value = u.truckPlate || '';
        document.getElementById('fleetUnitFormTrailer').value = u.trailerPlate || '';
        document.getElementById('fleetUnitFormType').value = u.vehicleType || 'Truck';
        document.getElementById('fleetUnitFormGpsId').value = u.gpsDeviceId || '';
        document.getElementById('fleetUnitFormGpsLat').value = u.gpsLat != null ? u.gpsLat : '';
        document.getElementById('fleetUnitFormGpsLng').value = u.gpsLng != null ? u.gpsLng : '';
        document.getElementById('fleetUnitFormGpsLabel').value = u.gpsLabel || '';
        const driverSel = document.getElementById('fleetUnitFormDriver');
        driverSel.innerHTML = '<option value="">— Select driver —</option>' +
            fleetDriversDB.map(d => `<option value="${d.id}"${d.id === u.driverId ? ' selected' : ''}>${d.name} (${d.whatsapp || 'no WhatsApp'})</option>`).join('');
        openModal('fleetUnitModal');
    };

    window.submitFleetUnitForm = async function () {
        const lat = parseFloat(document.getElementById('fleetUnitFormGpsLat').value);
        const lng = parseFloat(document.getElementById('fleetUnitFormGpsLng').value);
        const payload = {
            id: document.getElementById('fleetUnitFormId').value || undefined,
            truckPlate: document.getElementById('fleetUnitFormTruck').value.trim(),
            trailerPlate: document.getElementById('fleetUnitFormTrailer').value.trim(),
            vehicleType: document.getElementById('fleetUnitFormType').value,
            driverId: document.getElementById('fleetUnitFormDriver').value || null,
            gpsDeviceId: document.getElementById('fleetUnitFormGpsId').value.trim(),
            gpsLat: isNaN(lat) ? null : lat,
            gpsLng: isNaN(lng) ? null : lng,
            gpsLabel: document.getElementById('fleetUnitFormGpsLabel').value.trim(),
            status: 'available'
        };
        if (!payload.truckPlate) { showToast('Truck plate is required', 'warning'); return; }
        try {
            if (typeof saveFleetUnitApi === 'function' && isApiAvailable()) {
                const saved = await saveFleetUnitApi(payload);
                const idx = fleetUnitsDB.findIndex(x => x.id === saved.id);
                if (idx >= 0) fleetUnitsDB[idx] = saved; else fleetUnitsDB.push(saved);
            } else {
                payload.id = payload.id || uid('FU');
                const idx = fleetUnitsDB.findIndex(x => x.id === payload.id);
                if (idx >= 0) fleetUnitsDB[idx] = { ...fleetUnitsDB[idx], ...payload };
                else fleetUnitsDB.push(payload);
            }
            saveLocal();
            closeModal('fleetUnitModal');
            showToast('Fleet unit saved', 'success');
            refreshFleetPages();
        } catch (e) { showToast(e.message, 'error'); }
    };

    window.openClientOrderModal = function (orderId) {
        const o = orderId ? getOrderById(orderId) : {};
        document.getElementById('clientOrderModalTitle').textContent = orderId ? 'Edit Order' : 'Create Client Order';
        document.getElementById('clientOrderFormId').value = o.id || '';
        document.getElementById('clientOrderFormNumber').value = o.orderNumber || '';
        document.getElementById('clientOrderFormOrigin').value = o.origin || '';
        document.getElementById('clientOrderFormDestination').value = o.destination || '';
        document.getElementById('clientOrderFormCommodity').value = o.commodity || '';
        document.getElementById('clientOrderFormCargo').value = o.cargoType || 'Bulk';
        document.getElementById('clientOrderFormRequired').value = o.requiredDate || '';
        document.getElementById('clientOrderFormPriority').value = o.priority || 'normal';
        document.getElementById('clientOrderFormStatus').value = o.status || 'draft';
        const clientSel = document.getElementById('clientOrderFormClient');
        clientSel.innerHTML = clientsDB.map(c => `<option value="${c.id}"${c.id === o.clientId ? ' selected' : ''}>${c.name}</option>`).join('') ||
            '<option value="">— Add a client first —</option>';
        openModal('clientOrderModal');
    };

    window.submitClientOrderForm = async function () {
        const payload = {
            id: document.getElementById('clientOrderFormId').value || undefined,
            orderNumber: document.getElementById('clientOrderFormNumber').value.trim(),
            clientId: document.getElementById('clientOrderFormClient').value,
            origin: document.getElementById('clientOrderFormOrigin').value.trim(),
            destination: document.getElementById('clientOrderFormDestination').value.trim(),
            commodity: document.getElementById('clientOrderFormCommodity').value.trim(),
            cargoType: document.getElementById('clientOrderFormCargo').value,
            requiredDate: document.getElementById('clientOrderFormRequired').value,
            priority: document.getElementById('clientOrderFormPriority').value,
            status: document.getElementById('clientOrderFormStatus').value,
            kpi: 'green'
        };
        if (!payload.clientId) { showToast('Select a client', 'warning'); return; }
        try {
            if (typeof saveClientOrderApi === 'function' && isApiAvailable()) {
                const saved = await saveClientOrderApi(payload);
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
            if (typeof saveOrderAllocationApi === 'function' && isApiAvailable()) {
                const saved = await saveOrderAllocationApi(payload);
                orderAllocationsDB.push(saved);
                const oidx = clientOrdersDB.findIndex(o => o.id === payload.orderId);
                if (oidx >= 0) clientOrdersDB[oidx].status = 'allocated';
                const uidx = fleetUnitsDB.findIndex(u => u.id === payload.fleetUnitId);
                if (uidx >= 0) fleetUnitsDB[uidx].status = 'allocated';
            } else {
                payload.id = uid('ALL');
                payload.allocatedBy = typeof getCurrentUser === 'function' ? getCurrentUser()?.username : 'user';
                orderAllocationsDB.push(payload);
                const oidx = clientOrdersDB.findIndex(o => o.id === payload.orderId);
                if (oidx >= 0) clientOrdersDB[oidx].status = 'allocated';
                const uidx = fleetUnitsDB.findIndex(u => u.id === payload.fleetUnitId);
                if (uidx >= 0) fleetUnitsDB[uidx].status = 'allocated';
            }
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
        else if (currentPage === 'fleet-registry') renderFleetRegistry(ca);
        else if (currentPage === 'dashboard' && typeof renderDashboard === 'function') renderDashboard(ca);
        if (typeof updateSidebarBadges === 'function') updateSidebarBadges();
    }

    window.getFleetOrderDashboardStats = getFleetOrderStats;
    window.findFleetUnitByTruckPlate = findUnitByTruckPlate;
    window.syncFleetOrdersFromApi = syncFleetOrdersFromApi;

    if (!loadLocal()) seedDemoIfEmpty();
})();
