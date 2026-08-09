/**
 * Trip Scheduler — assign trucks, trailers, drivers to multiple client orders
 */
(function () {
    const STORAGE_KEY = 'truckcontrol_trip_scheduler_v1';
    let tripsDB = [];
    let schedulerOrders = [];
    let schedulerUnits = [];
    let schedulerDrivers = [];
    let schedulerClients = [];
    let currentTripId = null;
    let draftTripOrders = [];

    function saveLocal() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ trips: tripsDB })); } catch (_) {}
    }

    function loadLocal() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return false;
            tripsDB = JSON.parse(raw).trips || [];
            return true;
        } catch (_) { return false; }
    }

    function getDriverById(id) {
        return schedulerDrivers.find(d => d.id === id) || null;
    }

    function getUnitById(id) {
        return schedulerUnits.find(u => u.id === id) || null;
    }

    function getOrderById(id) {
        return schedulerOrders.find(o => o.id === id) || null;
    }

    function getClientName(clientId) {
        const c = schedulerClients.find(x => x.id === clientId);
        if (c) return c.name;
        if (typeof getFleetClientById === 'function') return getFleetClientById(clientId)?.name || '';
        return '';
    }

    function getOrderIdsOnOtherTrips() {
        const ids = new Set();
        tripsDB.forEach(t => {
            if (t.id === currentTripId) return;
            if (['cancelled', 'completed'].includes(t.status)) return;
            (t.tripOrders || []).forEach(to => { if (to.orderId) ids.add(to.orderId); });
        });
        return ids;
    }

    function getAvailableOrdersForTrip() {
        const onDraft = new Set(draftTripOrders.map(to => to.orderId));
        const onOtherTrips = getOrderIdsOnOtherTrips();
        const currentTripOrderIds = new Set(
            (currentTripId ? (tripsDB.find(t => t.id === currentTripId)?.tripOrders || []) : [])
                .map(to => to.orderId)
        );

        return schedulerOrders.filter(o => {
            if (!['draft', 'confirmed', 'allocated'].includes(o.status)) return false;
            if (onDraft.has(o.id)) return false;
            if (onOtherTrips.has(o.id)) return false;
            if (o.status === 'allocated' && !currentTripOrderIds.has(o.id)) return false;
            return true;
        });
    }

    function buildOrderOptionLabel(o) {
        if (typeof buildClientOrderSchedulerLabel === 'function') return buildClientOrderSchedulerLabel(o);
        return `${o.orderNumber} — ${getClientName(o.clientId)} — ${o.origin} → ${o.destination} (${o.cargoType || ''})`;
    }

    function buildTripOrderLineFromClientOrder(order, overrides) {
        overrides = overrides || {};
        const ld = order.loadDetails || {};
        const containerLines = ld.containerLines || [];
        const firstContainer = containerLines[0] || {};
        return {
            slNo: draftTripOrders.length + 1,
            orderId: order.id,
            orderNumber: order.orderNumber,
            clientId: order.clientId,
            clientName: getClientName(order.clientId),
            customerRef: order.customerRef || '',
            fromStation: order.origin || '',
            toStation: order.destination || '',
            loadingPoint: order.loadingPoint || '',
            offloadingPoint: order.offloadingPoint || '',
            routeType: order.routeType || '',
            cargoType: order.cargoType || '',
            commodity: order.commodity || '',
            orderLoadType: ld.orderLoadType || '',
            containerNo: firstContainer.containerNo || '',
            containerType: firstContainer.type || firstContainer.containerType || '',
            containerLines: containerLines.slice(),
            shipper: order.shipper || '',
            consignee: order.consignee || '',
            readyToLoadOn: order.readyToLoadOn || '',
            entryBorder: overrides.entryBorder ?? order.entryBorder ?? '',
            viaBorder1: overrides.viaBorder1 ?? order.viaBorder1 ?? '',
            viaBorder2: overrides.viaBorder2 ?? order.viaBorder2 ?? '',
            exitBorder: order.exitBorder || '',
            portOfEntry: order.portOfEntry || '',
            seal: overrides.seal ?? ld.sealNo ?? firstContainer.seal ?? '',
            trailerPosition: overrides.trailerPosition || 'First',
            remarks: overrides.remarks ?? ld.driverInstructions ?? ld.specialInstructions ?? order.notes ?? ''
        };
    }

    function setFieldValue(id, value) {
        const el = document.getElementById(id);
        if (el) el.value = value ?? '';
    }

    function applyTripHeaderFromOrder(order) {
        if (!order) return;
        const po = document.getElementById('tsPoOrder');
        const inv = document.getElementById('tsClientInvoice');
        const loadDate = document.getElementById('tsLoadDate');
        if (po && !po.value.trim()) setFieldValue('tsPoOrder', order.customerRef || order.orderNumber || '');
        if (inv && !inv.value.trim()) setFieldValue('tsClientInvoice', order.invoiceParty || '');
        if (loadDate && order.readyToLoadOn) loadDate.value = order.readyToLoadOn;
    }

    async function syncSchedulerData() {
        if (typeof syncFleetOrdersFromApi === 'function') await syncFleetOrdersFromApi();

        if (typeof isApiAvailable === 'function' && isApiAvailable() && typeof fetchTripSchedulerBundle === 'function') {
            try {
                const bundle = await fetchTripSchedulerBundle();
                tripsDB = bundle.trips || tripsDB;
                schedulerOrders = bundle.orders || [];
                schedulerUnits = bundle.units || [];
                schedulerDrivers = bundle.drivers || [];
                saveLocal();
            } catch (e) { console.warn('Trip scheduler API sync failed:', e.message); }
        } else {
            loadLocal();
        }

        if (typeof getFleetOrders === 'function') {
            const all = getFleetOrders();
            if (!schedulerOrders.length) {
                schedulerOrders = all.filter(o => ['draft', 'confirmed', 'allocated'].includes(o.status));
            } else {
                all.forEach(o => {
                    const idx = schedulerOrders.findIndex(x => x.id === o.id);
                    if (idx >= 0) schedulerOrders[idx] = o;
                    else if (['draft', 'confirmed', 'allocated'].includes(o.status)) schedulerOrders.push(o);
                });
            }
        }
        if (typeof getFleetUnits === 'function') schedulerUnits = getFleetUnits();
        if (typeof getFleetDrivers === 'function') schedulerDrivers = getFleetDrivers();
        if (typeof getFleetClients === 'function') schedulerClients = getFleetClients();
    }

    function canEdit() {
        return typeof canEditInModule === 'function' ? canEditInModule('trip-scheduler') : true;
    }

    function tripStatusBadge(s) {
        const map = { draft: 'gray', scheduled: 'blue', in_transit: 'orange', completed: 'green', cancelled: 'red' };
        return `<span class="status-badge ${map[s] || 'gray'}">${s || 'draft'}</span>`;
    }

    function renderTripOrderRows(orders) {
        if (!orders.length) {
            return '<tr><td colspan="15" style="text-align:center;padding:16px;color:var(--text-secondary);">No orders added — select a client order above and click Add to Trip.</td></tr>';
        }
        return orders.map((to, i) => `<tr>
            <td>${to.slNo || i + 1}</td>
            <td><strong>${to.orderNumber || '—'}</strong><div style="font-size:11px;color:var(--text-secondary);">${to.clientName || ''}</div></td>
            <td>${to.customerRef || '—'}</td>
            <td>${to.fromStation || '—'} → ${to.toStation || '—'}</td>
            <td>${to.loadingPoint || '—'}</td>
            <td>${to.offloadingPoint || '—'}</td>
            <td>${to.commodity || '—'}</td>
            <td>${to.cargoType || '—'}</td>
            <td>${to.containerNo || '—'}${to.containerType ? `<div style="font-size:11px;">${to.containerType}</div>` : ''}</td>
            <td>${to.entryBorder || '—'}</td>
            <td>${to.viaBorder1 || '—'}</td>
            <td>${to.viaBorder2 || '—'}</td>
            <td>${to.seal || '—'}</td>
            <td>${to.trailerPosition || 'First'}</td>
            <td><button class="btn btn-sm btn-outline" onclick="removeTripOrderLine(${i})">✕</button></td>
        </tr>`).join('');
    }

    function renderTripForm(trip) {
        trip = trip || {};
        const orders = trip.tripOrders || draftTripOrders || [];
        const availableOrders = getAvailableOrdersForTrip();

        const unitOpts = schedulerUnits.map(u => {
            const d = schedulerDrivers.find(dr => dr.id === u.driverId);
            return `<option value="${u.id}"${u.id === trip.fleetUnitId ? ' selected' : ''}>${u.truckPlate}${u.trailerPlate ? ' + ' + u.trailerPlate : ''} — ${d?.name || 'No driver'}</option>`;
        }).join('') || '<option value="">No fleet units</option>';

        const driverOpts = schedulerDrivers.map(d =>
            `<option value="${d.id}"${d.id === trip.driverId ? ' selected' : ''}>${d.name}</option>`
        ).join('');

        const orderOpts = availableOrders.length
            ? `<option value="">— Select client order —</option>${availableOrders.map(o =>
                `<option value="${o.id}">${buildOrderOptionLabel(o)}</option>`
            ).join('')}`
            : '<option value="">No unscheduled client orders available</option>';

        return `
            <div class="trip-scheduler-form">
                <div class="rbac-info-banner" style="margin-bottom:16px;">
                    <strong>Linked to Client Orders</strong> — choose a client order from the dropdown below. Trip fields auto-fill from the order (route, cargo, borders, commodity, loading/offloading points).
                </div>
                <div class="form-grid-3">
                    <div class="form-group"><label>Trip Reference</label><input class="form-control" id="tsTripRef" value="${trip.tripReference || 'New Trip Ref'}" placeholder="TR-2026-001"></div>
                    <div class="form-group"><label>Sch. Loading Date</label><input type="date" class="form-control" id="tsLoadDate" value="${trip.scheduledLoadingDate || new Date().toISOString().slice(0, 10)}"></div>
                    <div class="form-group"><label>Scheduled Time</label><input type="time" class="form-control" id="tsLoadTime" value="${trip.scheduledTime || '07:00'}"></div>
                </div>
                <div class="form-grid-3">
                    <div class="form-group"><label>Transporter</label><input class="form-control" id="tsTransporter" value="${trip.transporter || 'Greendoor Group'}"></div>
                    <div class="form-group"><label>Truck / Fleet Set</label><select class="form-control" id="tsFleetUnit" onchange="onTripFleetUnitChange()">${unitOpts}</select></div>
                    <div class="form-group"><label>Driver</label><select class="form-control" id="tsDriver">${driverOpts}</select></div>
                </div>
                <div class="form-grid-3">
                    <div class="form-group"><label>2nd Trailer</label><input class="form-control" id="tsSecondTrailer" value="${trip.secondTrailerPlate || ''}" placeholder="Optional"></div>
                    <div class="form-group"><label>Co-Driver</label><input class="form-control" id="tsCoDriver" value="${trip.coDriver || ''}"></div>
                    <div class="form-group"><label>Current Truck Position</label><input class="form-control" id="tsTruckPosition" value="${trip.currentTruckPosition || ''}"></div>
                </div>
                <div class="form-grid-3">
                    <div class="form-group"><label>Bivac No</label><input class="form-control" id="tsBivac" value="${trip.bivacNo || ''}"></div>
                    <div class="form-group"><label>Client Invoice No</label><input class="form-control" id="tsClientInvoice" value="${trip.clientInvoiceNo || ''}"></div>
                    <div class="form-group"><label>PO / Client Order No</label><input class="form-control" id="tsPoOrder" value="${trip.poClientOrderNo || ''}"></div>
                </div>

                <div class="trip-order-entry" style="margin:20px 0;padding:16px;background:#f7fafc;border-radius:8px;border:1px solid var(--border);">
                    <h4 style="margin:0 0 4px;">Add Client Order to Trip</h4>
                    <p style="margin:0 0 12px;font-size:13px;color:var(--text-secondary);">Select an order from Client Orders — details populate automatically.</p>
                    <div class="form-group">
                        <label>Client Order *</label>
                        <select class="form-control" id="tsAddOrderId" onchange="onTripOrderSelect()">${orderOpts}</select>
                    </div>
                    <div class="form-grid-3">
                        <div class="form-group"><label>Client</label><input class="form-control" id="tsAddClient" readonly></div>
                        <div class="form-group"><label>Customer Ref</label><input class="form-control" id="tsAddCustomerRef" readonly></div>
                        <div class="form-group"><label>Ready to Load</label><input class="form-control" id="tsAddReadyToLoad" readonly></div>
                    </div>
                    <div class="form-grid-2">
                        <div class="form-group"><label>From Station</label><input class="form-control" id="tsAddFrom" readonly></div>
                        <div class="form-group"><label>To Station</label><input class="form-control" id="tsAddTo" readonly></div>
                    </div>
                    <div class="form-grid-2">
                        <div class="form-group"><label>Loading Point</label><input class="form-control" id="tsAddLoadingPoint" readonly></div>
                        <div class="form-group"><label>Offloading Point</label><input class="form-control" id="tsAddOffloadingPoint" readonly></div>
                    </div>
                    <div class="form-grid-3">
                        <div class="form-group"><label>Commodity</label><input class="form-control" id="tsAddCommodity" readonly></div>
                        <div class="form-group"><label>Cargo Type</label><input class="form-control" id="tsAddCargoType" readonly></div>
                        <div class="form-group"><label>Load Type</label><input class="form-control" id="tsAddLoadType" readonly></div>
                    </div>
                    <div class="form-grid-3">
                        <div class="form-group"><label>Container No</label><input class="form-control" id="tsAddContainerNo" readonly></div>
                        <div class="form-group"><label>Container Type</label><input class="form-control" id="tsAddContainerType" readonly></div>
                        <div class="form-group"><label>Route Type</label><input class="form-control" id="tsAddRouteType" readonly></div>
                    </div>
                    <div class="form-grid-2">
                        <div class="form-group"><label>Shipper</label><input class="form-control" id="tsAddShipper" readonly></div>
                        <div class="form-group"><label>Consignee</label><input class="form-control" id="tsAddConsignee" readonly></div>
                    </div>
                    <div class="form-grid-3">
                        <div class="form-group"><label>Entry Border</label><input class="form-control" id="tsAddEntryBorder"></div>
                        <div class="form-group"><label>Via Border 1</label><input class="form-control" id="tsAddVia1"></div>
                        <div class="form-group"><label>Via Border 2</label><input class="form-control" id="tsAddVia2"></div>
                    </div>
                    <div class="form-grid-2">
                        <div class="form-group"><label>Seal</label><input class="form-control" id="tsAddSeal"></div>
                        <div class="form-group"><label>Trailer Position</label>
                            <div class="radio-row">
                                ${['First', 'Second', 'Both'].map(p => `<label><input type="radio" name="tsTrailerPos" value="${p}"${p === 'First' ? ' checked' : ''}> ${p}</label>`).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="form-group"><label>Remarks / Driver Instructions</label><input class="form-control" id="tsAddRemarks"></div>
                    <div style="margin-top:10px;"><button type="button" class="btn btn-primary btn-sm" onclick="addOrderToTripDraft()">➕ Add to Trip</button></div>
                </div>

                <div class="table-container" style="box-shadow:none;">
                    <div class="table-header"><h3>Trip Orders (${orders.length})</h3></div>
                    <table class="client-orders-grid" style="min-width:1600px;">
                        <thead><tr>
                            <th>Sl</th><th>Order No / Client</th><th>Cust. Ref</th><th>From / To</th>
                            <th>Loading Pt</th><th>Offload Pt</th><th>Commodity</th><th>Cargo Type</th>
                            <th>Container</th><th>Entry Border</th><th>Via 1</th><th>Via 2</th><th>Seal</th><th>Trailer Pos</th><th></th>
                        </tr></thead>
                        <tbody id="tsOrdersBody">${renderTripOrderRows(orders)}</tbody>
                    </table>
                </div>
            </div>`;
    }

    window.onTripFleetUnitChange = function () {
        const unit = getUnitById(document.getElementById('tsFleetUnit')?.value);
        if (unit?.driverId) {
            const sel = document.getElementById('tsDriver');
            if (sel) sel.value = unit.driverId;
        }
    };

    window.onTripOrderSelect = function () {
        const orderId = document.getElementById('tsAddOrderId')?.value;
        if (!orderId) {
            ['tsAddClient', 'tsAddCustomerRef', 'tsAddReadyToLoad', 'tsAddFrom', 'tsAddTo',
                'tsAddLoadingPoint', 'tsAddOffloadingPoint', 'tsAddCommodity', 'tsAddCargoType',
                'tsAddLoadType', 'tsAddContainerNo', 'tsAddContainerType', 'tsAddRouteType',
                'tsAddShipper', 'tsAddConsignee', 'tsAddEntryBorder', 'tsAddVia1', 'tsAddVia2',
                'tsAddSeal', 'tsAddRemarks'].forEach(id => setFieldValue(id, ''));
            return;
        }
        const order = getOrderById(orderId);
        if (!order) return;
        const ld = order.loadDetails || {};
        const firstContainer = (ld.containerLines || [])[0] || {};

        setFieldValue('tsAddClient', getClientName(order.clientId));
        setFieldValue('tsAddCustomerRef', order.customerRef || '');
        setFieldValue('tsAddReadyToLoad', order.readyToLoadOn || '');
        setFieldValue('tsAddFrom', order.origin || '');
        setFieldValue('tsAddTo', order.destination || '');
        setFieldValue('tsAddLoadingPoint', order.loadingPoint || '');
        setFieldValue('tsAddOffloadingPoint', order.offloadingPoint || '');
        setFieldValue('tsAddCommodity', order.commodity || '');
        setFieldValue('tsAddCargoType', order.cargoType || '');
        setFieldValue('tsAddLoadType', ld.orderLoadType || '');
        setFieldValue('tsAddContainerNo', firstContainer.containerNo || '');
        setFieldValue('tsAddContainerType', firstContainer.type || firstContainer.containerType || '');
        setFieldValue('tsAddRouteType', order.routeType || '');
        setFieldValue('tsAddShipper', order.shipper || '');
        setFieldValue('tsAddConsignee', order.consignee || '');
        setFieldValue('tsAddEntryBorder', order.entryBorder || '');
        setFieldValue('tsAddVia1', order.viaBorder1 || '');
        setFieldValue('tsAddVia2', order.viaBorder2 || '');
        setFieldValue('tsAddSeal', ld.sealNo || firstContainer.seal || '');
        setFieldValue('tsAddRemarks', ld.driverInstructions || ld.specialInstructions || order.notes || '');

        if (!draftTripOrders.length) applyTripHeaderFromOrder(order);
    };

    window.addOrderToTripDraft = function () {
        const orderId = document.getElementById('tsAddOrderId')?.value;
        const order = getOrderById(orderId);
        if (!order) { showToast('Select a client order', 'warning'); return; }
        if (draftTripOrders.some(to => to.orderId === orderId)) {
            showToast('Order already on this trip', 'warning'); return;
        }
        const trailerPos = document.querySelector('input[name="tsTrailerPos"]:checked')?.value || 'First';
        const line = buildTripOrderLineFromClientOrder(order, {
            entryBorder: document.getElementById('tsAddEntryBorder')?.value || order.entryBorder || '',
            viaBorder1: document.getElementById('tsAddVia1')?.value || order.viaBorder1 || '',
            viaBorder2: document.getElementById('tsAddVia2')?.value || order.viaBorder2 || '',
            seal: document.getElementById('tsAddSeal')?.value || '',
            trailerPosition: trailerPos,
            remarks: document.getElementById('tsAddRemarks')?.value || ''
        });
        line.slNo = draftTripOrders.length + 1;
        draftTripOrders.push(line);
        if (draftTripOrders.length === 1) applyTripHeaderFromOrder(order);
        refreshTripFormBody();
        showToast(`Order ${order.orderNumber} linked to trip`, 'success');
    };

    window.removeTripOrderLine = function (idx) {
        draftTripOrders.splice(idx, 1);
        draftTripOrders.forEach((to, i) => { to.slNo = i + 1; });
        refreshTripFormBody();
    };

    function refreshTripFormBody() {
        const el = document.getElementById('tripSchedulerFormArea');
        if (!el) return;
        const trip = currentTripId ? tripsDB.find(t => t.id === currentTripId) : {};
        el.innerHTML = renderTripForm({ ...trip, tripOrders: draftTripOrders });
    }

    function collectTripPayload() {
        const unit = getUnitById(document.getElementById('tsFleetUnit')?.value);
        return {
            id: currentTripId || undefined,
            tripReference: document.getElementById('tsTripRef')?.value.trim() || `TR-${Date.now().toString().slice(-6)}`,
            scheduledLoadingDate: document.getElementById('tsLoadDate')?.value,
            scheduledTime: document.getElementById('tsLoadTime')?.value || '07:00',
            transporter: document.getElementById('tsTransporter')?.value.trim(),
            fleetUnitId: unit?.id || null,
            truckPlate: unit?.truckPlate || '',
            trailerPlate: unit?.trailerPlate || '',
            secondTrailerPlate: document.getElementById('tsSecondTrailer')?.value.trim(),
            driverId: document.getElementById('tsDriver')?.value || unit?.driverId,
            coDriver: document.getElementById('tsCoDriver')?.value.trim(),
            currentTruckPosition: document.getElementById('tsTruckPosition')?.value.trim(),
            bivacNo: document.getElementById('tsBivac')?.value.trim(),
            clientInvoiceNo: document.getElementById('tsClientInvoice')?.value.trim(),
            poClientOrderNo: document.getElementById('tsPoOrder')?.value.trim(),
            status: draftTripOrders.length ? 'scheduled' : 'draft',
            tripOrders: draftTripOrders.slice()
        };
    }

    window.saveTripScheduler = async function () {
        const payload = collectTripPayload();
        if (!payload.fleetUnitId) { showToast('Select a truck / fleet set', 'warning'); return; }
        if (!payload.tripOrders.length) { showToast('Add at least one client order to the trip', 'warning'); return; }
        try {
            let saved = null;
            if (typeof saveTripApi === 'function' && typeof isApiAvailable === 'function' && isApiAvailable()) {
                saved = await saveTripApi(payload);
            }
            if (saved) {
                const idx = tripsDB.findIndex(t => t.id === saved.id);
                if (idx >= 0) tripsDB[idx] = saved; else tripsDB.unshift(saved);
            } else {
                payload.id = payload.id || `TRIP-${Date.now()}`;
                const idx = tripsDB.findIndex(t => t.id === payload.id);
                if (idx >= 0) tripsDB[idx] = payload; else tripsDB.unshift(payload);
            }
            if (typeof scheduleFleetOrdersForTrip === 'function') scheduleFleetOrdersForTrip(payload);
            saveLocal();
            currentTripId = null;
            draftTripOrders = [];
            showToast('Trip saved — client orders allocated to truck', 'success');
            const ca = document.getElementById('contentArea');
            if (currentPage === 'trip-scheduler' && ca) renderTripScheduler(ca);
        } catch (e) { showToast(e.message, 'error'); }
    };

    window.newTripScheduler = function () {
        currentTripId = null;
        draftTripOrders = [];
        const el = document.getElementById('tripSchedulerFormArea');
        if (el) el.innerHTML = renderTripForm({});
    };

    window.editTripScheduler = function (tripId) {
        const trip = tripsDB.find(t => t.id === tripId);
        if (!trip) return;
        currentTripId = tripId;
        draftTripOrders = (trip.tripOrders || []).slice();
        const el = document.getElementById('tripSchedulerFormArea');
        if (el) el.innerHTML = renderTripForm(trip);
    };

    window.renderTripScheduler = async function (container) {
        await syncSchedulerData();
        const edit = canEdit();
        const trips = tripsDB.slice();

        container.innerHTML = `
            <div class="page-header">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;">
                    <div>
                        <h1>📅 Trip Scheduler</h1>
                        <div class="breadcrumb">Freight Management / Schedule trucks, trailers &amp; drivers to client orders</div>
                    </div>
                    ${edit ? `<div style="display:flex;gap:8px;">
                        <button class="btn btn-outline" onclick="newTripScheduler()">+ New Trip</button>
                        <button class="btn btn-primary" onclick="saveTripScheduler()">💾 Save Trip</button>
                    </div>` : ''}
                </div>
            </div>
            <div id="tripSchedulerFormArea">${renderTripForm(currentTripId ? trips.find(t => t.id === currentTripId) : {})}</div>
            <div class="table-container" style="margin-top:24px;">
                <div class="table-header"><h3>Saved Trips (${trips.length})</h3></div>
                <table class="data-table">
                    <thead><tr>
                        <th>Trip Ref</th><th>Loading Date</th><th>Transporter</th><th>Truck</th><th>Trailer</th>
                        <th>Driver</th><th>Client Orders</th><th>Status</th>${edit ? '<th></th>' : ''}
                    </tr></thead>
                    <tbody>
                        ${trips.length ? trips.map(t => {
                            const driver = schedulerDrivers.find(d => d.id === t.driverId);
                            const orderLabels = (t.tripOrders || []).map(to => to.orderNumber).filter(Boolean).join(', ');
                            return `<tr>
                                <td><strong>${t.tripReference}</strong></td>
                                <td>${t.scheduledLoadingDate || '—'} ${t.scheduledTime || ''}</td>
                                <td>${t.transporter || '—'}</td>
                                <td>${t.truckPlate || '—'}</td>
                                <td>${t.trailerPlate || '—'}${t.secondTrailerPlate ? ' + ' + t.secondTrailerPlate : ''}</td>
                                <td>${driver?.name || '—'}</td>
                                <td>${orderLabels || (t.tripOrders || []).length}</td>
                                <td>${tripStatusBadge(t.status)}</td>
                                ${edit ? `<td><button class="btn btn-sm btn-outline" onclick="editTripScheduler('${t.id}')">✏️</button></td>` : ''}
                            </tr>`;
                        }).join('') : '<tr><td colspan="9" style="text-align:center;padding:20px;">No trips scheduled yet.</td></tr>'}
                    </tbody>
                </table>
            </div>`;
    };

    loadLocal();
})();
