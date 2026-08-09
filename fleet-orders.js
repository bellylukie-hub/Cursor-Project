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
    let clientOrderFormTab = 'header';

    const CLEARING_AGENTS = [
        'Jean Kalenga Clearing', 'Mukendi Logistics', 'Border Express DRC',
        'Kasumbalesa Agents Ltd', 'Sakania Clearance Co', 'Whisky Process Agents'
    ];

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
        { id: 'kanyaka', name: 'Kanyaka', country: 'CD', countryName: 'DRC', loadingPoints: ['Kanyaka Mine'], offloadingPoints: ['Kanyaka Depot'] }
    ];

    const INTERNATIONAL_ROUTES = {
        'ZA-CD': { entryBorder: 'Kasumbalesa', viaBorder1: '', viaBorder2: '', portOfEntry: 'Durban Port', exitBorder: '' },
        'TZ-CD': { entryBorder: 'Kasumbalesa', viaBorder1: 'Sakania', viaBorder2: '', portOfEntry: 'Dar Port', exitBorder: '' },
        'ZM-CD': { entryBorder: 'Kasumbalesa', viaBorder1: '', viaBorder2: '', portOfEntry: '', exitBorder: '' },
        'CD-ZA': { entryBorder: '', viaBorder1: '', viaBorder2: '', portOfEntry: '', exitBorder: 'Kasumbalesa' },
        'CD-ZM': { entryBorder: '', viaBorder1: '', viaBorder2: '', portOfEntry: '', exitBorder: 'Kasumbalesa' },
        'CD-TZ': { entryBorder: '', viaBorder1: 'Sakania', viaBorder2: '', portOfEntry: '', exitBorder: 'Kasumbalesa' }
    };

    function stationOptions(selectedId) {
        const empty = `<option value=""${!selectedId ? ' selected' : ''}>— Select station —</option>`;
        return empty + ROUTE_STATIONS.map(s =>
            `<option value="${s.id}"${s.id === selectedId ? ' selected' : ''}>${s.name} (${s.countryName})</option>`
        ).join('');
    }

    function getStationById(id) {
        return ROUTE_STATIONS.find(s => s.id === id) || null;
    }

    function resolveOrderRoute(originId, destId) {
        const origin = getStationById(originId);
        const dest = getStationById(destId);
        if (!origin || !dest) {
            return { routeType: 'domestic', showBorders: false, originCountry: '', destinationCountry: '' };
        }
        const base = {
            origin: origin.name,
            destination: dest.name,
            originCountry: origin.country,
            destinationCountry: dest.country,
            loadingPoint: (origin.loadingPoints || [])[0] || origin.name,
            offloadingPoint: (dest.offloadingPoints || [])[0] || dest.name
        };
        if (origin.country === dest.country) {
            return {
                ...base,
                routeType: 'domestic',
                showBorders: false,
                entryBorder: '', viaBorder1: '', viaBorder2: '', portOfEntry: '', exitBorder: ''
            };
        }
        const routeKey = `${origin.country}-${dest.country}`;
        const intl = INTERNATIONAL_ROUTES[routeKey] || {
            entryBorder: 'Kasumbalesa', viaBorder1: '', viaBorder2: '',
            portOfEntry: (origin.loadingPoints || [])[0] || '', exitBorder: 'Kasumbalesa'
        };
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
        return [o.cargoType, ld.orderLoadType].filter(Boolean).join(' / ') || '—';
    }

    window.onClientOrderRouteChange = function () {
        const originId = document.getElementById('coFormOriginStation')?.value;
        const destId = document.getElementById('coFormDestStation')?.value;
        const route = resolveOrderRoute(originId, destId);
        const borderSec = document.getElementById('coBorderSection');
        const domesticNote = document.getElementById('coDomesticRouteNote');
        if (document.getElementById('coFormOrigin')) document.getElementById('coFormOrigin').value = route.origin || '';
        if (document.getElementById('coFormDestination')) document.getElementById('coFormDestination').value = route.destination || '';
        if (document.getElementById('coFormLoadingPoint')) document.getElementById('coFormLoadingPoint').value = route.loadingPoint || '';
        if (document.getElementById('coFormOffloadingPoint')) document.getElementById('coFormOffloadingPoint').value = route.offloadingPoint || '';
        if (document.getElementById('coFormRouteType')) document.getElementById('coFormRouteType').value = route.routeType;
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
        const originStation = ROUTE_STATIONS.find(s => s.name === o.origin)?.id || '';
        const destStation = ROUTE_STATIONS.find(s => s.name === o.destination)?.id || '';
        const route = resolveOrderRoute(originStation, destStation);
        const showBorders = o.routeType === 'international' || route.showBorders;
        const agentOpts = (sel) => CLEARING_AGENTS.map(a => `<option value="${a}"${a === sel ? ' selected' : ''}>${a}</option>`).join('');

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
                <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;">Select <strong>origin</strong> and <strong>destination</strong> stations. Borders are filled automatically for international routes; same-country trips need no border.</p>
                <div class="form-grid-2">
                    <div class="form-group"><label>Origin Station *</label><select class="form-control" id="coFormOriginStation" onchange="onClientOrderRouteChange()">${stationOptions(originStation)}</select></div>
                    <div class="form-group"><label>Destination Station *</label><select class="form-control" id="coFormDestStation" onchange="onClientOrderRouteChange()">${stationOptions(destStation)}</select></div>
                </div>
                <div class="form-grid-2">
                    <div class="form-group"><label>Loading Point</label><input class="form-control" id="coFormLoadingPoint" value="${o.loadingPoint || route.loadingPoint || ''}"></div>
                    <div class="form-group"><label>Offloading Point</label><input class="form-control" id="coFormOffloadingPoint" value="${o.offloadingPoint || route.offloadingPoint || ''}"></div>
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
                    <div class="form-group"><label>Cargo Type *</label><select class="form-control" id="coFormCargoType">
                        ${['Bulk Loose', 'Break Bulk', 'Liquid', 'Container', 'General', 'Tank'].map(t => `<option${(o.cargoType || '') === t ? ' selected' : ''}>${t}</option>`).join('')}
                    </select></div>
                </div>
                <div class="form-group"><label>Description of Goods</label><textarea class="form-control" id="coFormDescGoods" rows="2">${ld.descriptionOfGoods || ''}</textarea></div>
                <div class="form-grid-3">
                    <div class="form-group"><label>Order Load Type</label>
                        <div class="radio-row">${['Normal', 'Pre-load', 'Ex-W Ho'].map(t => `<label><input type="radio" name="coLoadType" value="${t}"${(ld.orderLoadType || 'Normal') === t ? ' checked' : ''}> ${t}</label>`).join('')}</div>
                    </div>
                    <div class="form-group"><label>OOG Type</label><input class="form-control" id="coFormOogType" value="${ld.oogType || ''}"></div>
                    <div class="form-group"><label>Commodity Rate Type</label>
                        <div class="radio-row">${['Standard', 'Single Line Entry', 'Consolidation'].map(t => `<label><input type="radio" name="coRateType" value="${t}"${(ld.commodityRateType || 'Standard') === t ? ' checked' : ''}> ${t}</label>`).join('')}</div>
                    </div>
                </div>
                <div class="form-grid-4">
                    <div class="form-group"><label>Qty 20'</label><input type="number" class="form-control" id="coFormQty20" value="${ld.qty20 || ''}"></div>
                    <div class="form-group"><label>Qty 40'</label><input type="number" class="form-control" id="coFormQty40" value="${ld.qty40 || ''}"></div>
                    <div class="form-group"><label>Packing</label><input class="form-control" id="coFormPacking" value="${ld.packing || ''}"></div>
                    <div class="form-group"><label>Wt (Kg)</label><input type="number" class="form-control" id="coFormWeightKg" value="${ld.weightKg || ''}"></div>
                </div>
                <div class="form-grid-4">
                    <div class="form-group"><label>Quantity</label><input type="number" class="form-control" id="coFormQuantity" value="${ld.quantity || ''}"></div>
                    <div class="form-group"><label>Qty / Truck</label><input type="number" class="form-control" id="coFormQtyPerTruck" value="${ld.qtyPerTruck || ''}"></div>
                    <div class="form-group"><label>Tonnage</label><input type="number" class="form-control" id="coFormTonnage" value="${ld.tonnage || ''}"></div>
                    <div class="form-group"><label>No of Loads</label><input type="number" class="form-control" id="coFormNoOfLoads" value="${ld.noOfLoads || ''}"></div>
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
                    <div class="form-group"><label>Shipper / Customer</label><input class="form-control" id="coFormShipper" value="${o.shipper || ''}"></div>
                    <div class="form-group"><label>Consignee</label><input class="form-control" id="coFormConsignee" value="${o.consignee || ''}"></div>
                </div>
                <div class="form-group"><label>Invoice Party</label><input class="form-control" id="coFormInvoiceParty" value="${o.invoiceParty || ''}"></div>
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
            loadingPoint: document.getElementById('coFormLoadingPoint')?.value.trim(),
            offloadingPoint: document.getElementById('coFormOffloadingPoint')?.value.trim(),
            originCountry: route.originCountry,
            destinationCountry: route.destinationCountry,
            routeType: route.routeType,
            ...borderFields,
            commodity: document.getElementById('coFormCommodity')?.value.trim(),
            cargoType: document.getElementById('coFormCargoType')?.value,
            shipper: document.getElementById('coFormShipper')?.value.trim(),
            consignee: document.getElementById('coFormConsignee')?.value.trim(),
            invoiceParty: document.getElementById('coFormInvoiceParty')?.value.trim(),
            notes: document.getElementById('coFormSpecialInstr')?.value.trim(),
            kpi: 'green',
            loadDetails: {
                descriptionOfGoods: document.getElementById('coFormDescGoods')?.value.trim(),
                orderLoadType: loadType,
                oogType: document.getElementById('coFormOogType')?.value.trim(),
                commodityRateType: rateType,
                qty20: document.getElementById('coFormQty20')?.value,
                qty40: document.getElementById('coFormQty40')?.value,
                packing: document.getElementById('coFormPacking')?.value.trim(),
                weightKg: document.getElementById('coFormWeightKg')?.value,
                quantity: document.getElementById('coFormQuantity')?.value,
                qtyPerTruck: document.getElementById('coFormQtyPerTruck')?.value,
                tonnage: document.getElementById('coFormTonnage')?.value,
                noOfLoads: document.getElementById('coFormNoOfLoads')?.value,
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
                commodity: 'Sulphuric Acid', cargoType: 'Liquid', customerRef: 'REF-9921',
                shipper: 'Copper Logistics SA', consignee: 'Likasi Plant', impExp: 'DOM',
                requiredDate: '2026-08-20', status: 'draft', priority: 'normal', kpi: 'orange',
                loadDetails: { orderLoadType: 'Pre-load', packing: 'Tank', tonnage: 800, noOfLoads: 20, isHaz: true, unNumber: 'UN1830' }
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
            <div class="table-container client-orders-table-wrap">
                <div class="table-header"><h3>Orders (${orders.length})</h3></div>
                <table class="client-orders-grid">
                    <thead><tr>
                        <th>Order No</th><th>Order Date</th><th>Ready to Load</th><th>Complete By</th>
                        <th>Commodity</th><th>Customer Ref</th><th>Shipper</th><th>Consignee</th>
                        <th>Origin</th><th>Destination</th><th>Cargo / Load Type</th><th>Tonnage</th>
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
                                <td>${ld.tonnage || '—'}</td>
                                <td style="min-width:180px;font-size:12px;">${routeSummary(o)}</td>
                                <td>${orderStatusBadge(o.status)}</td>
                                <td style="white-space:nowrap;">
                                    ${canEdit ? `<button class="btn btn-sm btn-outline" onclick="openAllocateFleetModal('${o.id}')">🚛</button>` : ''}
                                    ${canEdit ? `<button class="btn btn-sm btn-outline" onclick="openClientOrderModal('${o.id}')">✏️</button>` : ''}
                                    ${allocs[0] ? `<button class="btn btn-sm btn-primary" onclick="openFleetGpsMap('${allocs[0].fleetUnitId}')">📍</button>` : ''}
                                </td>
                            </tr>`;
                        }).join('') : '<tr><td colspan="16" style="text-align:center;padding:24px;color:var(--text-secondary);">No orders yet. Create a client order and schedule a truck-trailer-driver set.</td></tr>'}
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
            const saved = await persistToApi(saveFleetUnitApi, payload);
            if (saved) {
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
        clientOrderFormTab = 'header';
        document.getElementById('clientOrderModalTitle').textContent = orderId ? 'Edit Order' : 'Create Client Order';
        const body = document.getElementById('clientOrderFormBody');
        if (body) body.innerHTML = renderClientOrderFormBody(o);
        openModal('clientOrderModal');
        setClientOrderFormTab('header');
        if (document.getElementById('coFormOriginStation')) onClientOrderRouteChange();
    };

    window.submitClientOrderForm = async function () {
        const payload = collectClientOrderPayload();
        if (!payload.clientId) { showToast('Select a client', 'warning'); return; }
        if (!payload.commodity) { showToast('Commodity is required', 'warning'); setClientOrderFormTab('load'); return; }
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
        else if (currentPage === 'fleet-registry') renderFleetRegistry(ca);
        else if (currentPage === 'dashboard' && typeof renderDashboard === 'function') renderDashboard(ca);
        if (typeof updateSidebarBadges === 'function') updateSidebarBadges();
    }

    window.getFleetOrderDashboardStats = getFleetOrderStats;
    window.findFleetUnitByTruckPlate = findUnitByTruckPlate;
    window.syncFleetOrdersFromApi = syncFleetOrdersFromApi;

    if (!loadLocal()) seedDemoIfEmpty();
})();
