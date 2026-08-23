/**
 * Workshop — maintenance schedules, work orders, repairs, parts store
 */
(function () {
    const STORAGE_KEY = 'truckcontrol_workshop_v1';
    let schedulesDB = [];
    let workOrdersDB = [];
    let partsDB = [];
    let stockDB = [];
    let issuesDB = [];
    let workshopTab = 'work-orders';

    function uid(p) { return `${p}-${Date.now().toString(36)}`; }

    function saveLocal() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                schedules: schedulesDB, workOrders: workOrdersDB, parts: partsDB, stock: stockDB, issues: issuesDB
            }));
        } catch (_) {}
    }

    function loadLocal() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return false;
            const d = JSON.parse(raw);
            schedulesDB = d.schedules || [];
            workOrdersDB = d.workOrders || [];
            partsDB = d.parts || [];
            stockDB = d.stock || [];
            issuesDB = d.issues || [];
            return true;
        } catch (_) { return false; }
    }

    function seedDemo() {
        schedulesDB = [
            { id: 'MS-1', assetType: 'fleet_unit', assetId: 'FU-001', triggerType: 'after_trip', taskName: 'Post-trip inspection', taskDescription: 'Brakes, tyres, lights, coupling', partsHint: 'Brake pads, engine oil', active: true },
            { id: 'MS-2', assetType: 'fleet_unit', assetId: 'FU-001', triggerType: 'mileage', intervalValue: 15000, intervalUnit: 'km', taskName: '15,000 km service', taskDescription: 'Oil, filters, gearbox check', partsHint: 'Oil filter, air filter', active: true }
        ];
        partsDB = [
            { id: 'PART-1', sku: 'BRK-PAD-SET', name: 'Brake pad set (heavy truck)', category: 'Brakes', unit: 'set', unitCost: 180, minStock: 4 },
            { id: 'PART-2', sku: 'OIL-15W40-20L', name: 'Engine oil 15W40 20L', category: 'Lubricants', unit: 'drum', unitCost: 95, minStock: 10 },
            { id: 'PART-3', sku: 'TYRE-315-80R22', name: 'Tyre 315/80 R22.5', category: 'Tyres', unit: 'pcs', unitCost: 420, minStock: 8 }
        ];
        stockDB = partsDB.map(p => ({ id: `STK-${p.id}`, partId: p.id, warehouse: 'main', quantity: p.minStock * 2 }));
        workOrdersDB = [
            { id: 'WO-1', assetType: 'fleet_unit', assetId: 'FU-002', fleetUnitId: 'FU-002', triggerType: 'after_trip', title: 'Replace rear brake pads', status: 'open', priority: 'high', openedAt: '2026-08-20 09:00', laborHours: 0, partsCost: 0, notes: 'Driver report — grinding noise' }
        ];
        saveLocal();
    }

    async function syncFromApi() {
        if (typeof isApiAvailable !== 'function' || !isApiAvailable()) return;
        try {
            const data = await fetchWorkshopBundleApi();
            if (data.schedules) schedulesDB = data.schedules;
            if (data.workOrders) workOrdersDB = data.workOrders;
            if (data.parts) partsDB = data.parts;
            if (data.stock) stockDB = data.stock;
            if (data.issues) issuesDB = data.issues;
            saveLocal();
        } catch (e) { console.warn('Workshop sync:', e.message); }
    }

    function initWorkshop() {
        if (!loadLocal()) seedDemo();
        syncFromApi();
    }

    function fleetUnitsList() {
        if (typeof getFleetUnits === 'function') return getFleetUnits();
        return [];
    }

    function statusBadge(s) {
        const map = { open: 'orange', in_progress: 'blue', closed: 'green', completed: 'green' };
        return `<span class="status-badge ${map[s] || 'gray'}">${s || 'open'}</span>`;
    }

    function renderWorkOrdersTable() {
        if (!workOrdersDB.length) return '<p style="color:var(--text-secondary);">No work orders — open one after a trip or from a maintenance schedule.</p>';
        return `<table class="data-table"><thead><tr>
            <th>WO</th><th>Asset</th><th>Title</th><th>Trigger</th><th>Status</th><th>Parts $</th><th>Opened</th><th></th>
        </tr></thead><tbody>
        ${workOrdersDB.map(w => `
            <tr>
                <td><code>${w.id}</code></td>
                <td>${w.fleetUnitId || w.assetId}</td>
                <td><strong>${w.title}</strong><br><small>${w.description || ''}</small></td>
                <td>${w.triggerType || 'manual'}</td>
                <td>${statusBadge(w.status)}</td>
                <td>${(w.partsCost || 0).toFixed(0)}</td>
                <td>${w.openedAt || ''}</td>
                <td>
                    ${w.status === 'open' ? `<button class="btn btn-outline btn-sm" onclick="closeWorkOrder('${w.id}')">✓ Close</button>` : ''}
                    <button class="btn btn-outline btn-sm" onclick="openIssuePartModal('${w.id}')">🔧 Issue parts</button>
                </td>
            </tr>`).join('')}
        </tbody></table>`;
    }

    function renderPartsStore() {
        const rows = partsDB.map(p => {
            const stk = stockDB.find(s => s.partId === p.id && s.warehouse === 'main');
            const qty = stk?.quantity || 0;
            const low = qty < (p.minStock || 0);
            return `<tr class="${low ? 'row-warning' : ''}">
                <td><code>${p.sku}</code></td>
                <td><strong>${p.name}</strong><br><small>${p.category || ''}</small></td>
                <td>${qty} ${p.unit}${low ? ' ⚠️ low' : ''}</td>
                <td>${(p.unitCost || 0).toFixed(2)}</td>
                <td><button class="btn btn-outline btn-sm" onclick="adjustPartStock('${p.id}', 1)">+1</button>
                    <button class="btn btn-outline btn-sm" onclick="adjustPartStock('${p.id}', -1)">−1</button></td>
            </tr>`;
        }).join('');
        return `<table class="data-table"><thead><tr><th>SKU</th><th>Part</th><th>Stock</th><th>Unit cost</th><th></th></tr></thead><tbody>${rows || '<tr><td colspan="5">No parts in catalog</td></tr>'}</tbody></table>`;
    }

    function renderSchedulesTable() {
        return `<table class="data-table"><thead><tr><th>Asset</th><th>Trigger</th><th>Task</th><th>Interval</th><th>Parts hint</th></tr></thead><tbody>
        ${schedulesDB.map(s => `<tr>
            <td>${s.assetId}</td>
            <td>${s.triggerType}</td>
            <td><strong>${s.taskName}</strong><br><small>${s.taskDescription || ''}</small></td>
            <td>${s.triggerType === 'mileage' ? `${s.intervalValue} ${s.intervalUnit}` : '—'}</td>
            <td>${s.partsHint || ''}</td>
        </tr>`).join('') || '<tr><td colspan="5">No schedules</td></tr>'}
        </tbody></table>`;
    }

    window.renderWorkshop = function (container) {
        initWorkshop();
        container.innerHTML = `
        <div class="page-header">
            <h1>🔧 Workshop & Parts Store</h1>
            <div class="breadcrumb"><a href="#" onclick="navigateTo('dashboard')">Home</a> › <strong>Workshop</strong></div>
        </div>
        <div class="kpi-grid" style="margin-bottom:16px;">
            <div class="kpi-card orange"><div class="kpi-title">Open work orders</div><div class="kpi-value">${workOrdersDB.filter(w => w.status === 'open').length}</div></div>
            <div class="kpi-card blue"><div class="kpi-title">Maintenance schedules</div><div class="kpi-value">${schedulesDB.length}</div></div>
            <div class="kpi-card green"><div class="kpi-title">Parts in catalog</div><div class="kpi-value">${partsDB.length}</div></div>
            <div class="kpi-card"><div class="kpi-title">Low stock alerts</div><div class="kpi-value">${partsDB.filter(p => {
                const stk = stockDB.find(s => s.partId === p.id); return (stk?.quantity || 0) < (p.minStock || 0);
            }).length}</div></div>
        </div>
        <div class="comm-app-tabs">
            <button class="comm-app-tab${workshopTab === 'work-orders' ? ' active' : ''}" onclick="setWorkshopTab('work-orders')">🛠️ Work orders & repairs</button>
            <button class="comm-app-tab${workshopTab === 'parts' ? ' active' : ''}" onclick="setWorkshopTab('parts')">📦 Parts store</button>
            <button class="comm-app-tab${workshopTab === 'schedules' ? ' active' : ''}" onclick="setWorkshopTab('schedules')">📅 Maintenance plans</button>
        </div>
        <div style="margin:12px 0;">
            ${workshopTab === 'work-orders' ? `<button class="btn btn-primary btn-sm" onclick="openNewWorkOrderModal()">+ Open work order</button> <button class="btn btn-outline btn-sm" onclick="syncWorkshop()">🔄 Sync</button>` : ''}
            ${workshopTab === 'parts' ? `<button class="btn btn-primary btn-sm" onclick="openNewPartModal()">+ Add part</button>` : ''}
            ${workshopTab === 'schedules' ? `<button class="btn btn-primary btn-sm" onclick="openNewScheduleModal()">+ Add schedule</button>` : ''}
        </div>
        <div class="settings-card">
            ${workshopTab === 'work-orders' ? renderWorkOrdersTable() : ''}
            ${workshopTab === 'parts' ? renderPartsStore() : ''}
            ${workshopTab === 'schedules' ? renderSchedulesTable() : ''}
        </div>
        <p style="font-size:12px;color:var(--text-secondary);margin-top:12px;">
            Maintenance triggers: <strong>after each trip</strong> or <strong>mileage interval</strong>. Parts issued from store are linked to work orders and update stock automatically.
        </p>`;
    };

    window.setWorkshopTab = function (tab) {
        workshopTab = tab;
        const ca = document.getElementById('contentArea');
        if (ca && currentPage === 'workshop') renderWorkshop(ca);
    };

    window.syncWorkshop = function () {
        syncFromApi().then(() => {
            showToast('Workshop data synced', 'success');
            setWorkshopTab(workshopTab);
        });
    };

    window.openNewWorkOrderModal = function () {
        const units = fleetUnitsList();
        const title = prompt('Work order title:', 'Post-trip inspection');
        if (!title) return;
        const fleetUnitId = units[0]?.id || '';
        const payload = {
            assetType: 'fleet_unit', assetId: fleetUnitId, fleetUnitId,
            triggerType: 'manual', title, status: 'open', priority: 'normal'
        };
        (async () => {
            try {
                if (typeof isApiAvailable === 'function' && isApiAvailable() && typeof openWorkOrderApi === 'function') {
                    const wo = await openWorkOrderApi(payload);
                    workOrdersDB.unshift(wo);
                } else {
                    payload.id = uid('WO');
                    payload.openedAt = new Date().toISOString().slice(0, 16).replace('T', ' ');
                    workOrdersDB.unshift(payload);
                }
                saveLocal();
                showToast('Work order opened', 'success');
                setWorkshopTab('work-orders');
            } catch (e) { showToast(e.message, 'error'); }
        })();
    };

    window.closeWorkOrder = async function (id) {
        try {
            if (typeof updateWorkOrderApi === 'function' && isApiAvailable()) {
                await updateWorkOrderApi(id, { status: 'closed' });
            }
            const w = workOrdersDB.find(x => x.id === id);
            if (w) { w.status = 'closed'; w.closedAt = new Date().toISOString().slice(0, 16).replace('T', ' '); }
            saveLocal();
            setWorkshopTab('work-orders');
        } catch (e) { showToast(e.message, 'error'); }
    };

    window.openIssuePartModal = function (workOrderId) {
        const partId = partsDB[0]?.id;
        if (!partId) { showToast('Add parts to catalog first', 'warning'); return; }
        const qty = Number(prompt('Quantity to issue:', '1') || 0);
        if (!qty) return;
        (async () => {
            try {
                const payload = { workOrderId, partId, quantity: qty };
                if (typeof issuePartApi === 'function' && isApiAvailable()) {
                    await issuePartApi(payload);
                    await syncFromApi();
                } else {
                    const p = partsDB.find(x => x.id === partId);
                    const stk = stockDB.find(s => s.partId === partId);
                    if (stk) stk.quantity = Math.max(0, stk.quantity - qty);
                    const w = workOrdersDB.find(x => x.id === workOrderId);
                    if (w) w.partsCost = (w.partsCost || 0) + qty * (p?.unitCost || 0);
                    issuesDB.push({ id: uid('ISS'), workOrderId, partId, quantity: qty, issuedAt: new Date().toISOString() });
                    saveLocal();
                }
                showToast('Part issued to work order', 'success');
                setWorkshopTab('work-orders');
            } catch (e) { showToast(e.message, 'error'); }
        })();
    };

    window.adjustPartStock = async function (partId, delta) {
        try {
            if (typeof adjustPartStockApi === 'function' && isApiAvailable()) {
                await adjustPartStockApi({ partId, delta });
                await syncFromApi();
            } else {
                let stk = stockDB.find(s => s.partId === partId);
                if (!stk) { stk = { id: uid('STK'), partId, warehouse: 'main', quantity: 0 }; stockDB.push(stk); }
                stk.quantity = Math.max(0, (stk.quantity || 0) + delta);
                saveLocal();
            }
            setWorkshopTab('parts');
        } catch (e) { showToast(e.message, 'error'); }
    };

    window.openNewPartModal = function () {
        const sku = prompt('SKU:', 'PART-NEW');
        const name = prompt('Part name:', '');
        if (!name) return;
        (async () => {
            const payload = { sku, name, category: 'General', unit: 'pcs', unitCost: 0, minStock: 2, active: true };
            try {
                if (typeof upsertPartApi === 'function' && isApiAvailable()) {
                    await upsertPartApi(payload);
                    await syncFromApi();
                } else {
                    payload.id = uid('PART');
                    partsDB.push(payload);
                    stockDB.push({ id: uid('STK'), partId: payload.id, warehouse: 'main', quantity: 0 });
                    saveLocal();
                }
                showToast('Part added', 'success');
                setWorkshopTab('parts');
            } catch (e) { showToast(e.message, 'error'); }
        })();
    };

    window.openNewScheduleModal = function () {
        const taskName = prompt('Maintenance task name:', 'Post-trip service');
        if (!taskName) return;
        const trigger = prompt('Trigger: after_trip or mileage', 'after_trip');
        schedulesDB.push({
            id: uid('MS'), assetType: 'fleet_unit', assetId: 'FU-001',
            triggerType: trigger || 'after_trip', taskName, taskDescription: '', active: true
        });
        saveLocal();
        setWorkshopTab('schedules');
    };

    initWorkshop();
})();
