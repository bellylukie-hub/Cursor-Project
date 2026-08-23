/**
 * Fuel control — consumption vs distance (GPS/satellite), fleet map integration
 */
(function () {
    const STORAGE_KEY = 'truckcontrol_fuel_v1';
    let transactionsDB = [];
    let overviewDB = [];
    let selectedUnitId = '';

    function saveLocal() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ transactions: transactionsDB })); } catch (_) {}
    }

    function loadLocal() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return false;
            transactionsDB = JSON.parse(raw).transactions || [];
            return true;
        } catch (_) { return false; }
    }

    async function syncFuel() {
        if (typeof isApiAvailable !== 'function' || !isApiAvailable()) return;
        try {
            if (typeof fetchFuelOverviewApi === 'function') {
                const data = await fetchFuelOverviewApi();
                overviewDB = data.fleet || [];
            }
            if (selectedUnitId && typeof fetchFuelAnalysisApi === 'function') {
                const a = await fetchFuelAnalysisApi(selectedUnitId);
                transactionsDB = a.transactions || [];
            }
            saveLocal();
        } catch (e) { console.warn('Fuel sync:', e.message); }
    }

    function units() {
        if (typeof getFleetUnits === 'function') return getFleetUnits();
        return overviewDB.map(o => ({ id: o.fleetUnitId, truckPlate: o.truckPlate, gpsLat: o.gpsLat, gpsLng: o.gpsLng }));
    }

    window.renderFuelControl = function (container) {
        if (!loadLocal()) transactionsDB = [];
        syncFuel().then(() => {
            const fleet = units();
            if (!selectedUnitId && fleet[0]) selectedUnitId = fleet[0].id;
            const analysis = overviewDB.find(o => o.fleetUnitId === selectedUnitId) || {};
            const txs = transactionsDB.filter(t => !selectedUnitId || t.fleetUnitId === selectedUnitId);

            container.innerHTML = `
            <div class="page-header">
                <h1>⛽ Fuel Control</h1>
                <div class="breadcrumb"><a href="#" onclick="navigateTo('dashboard')">Home</a> › <strong>Fuel Control</strong></div>
            </div>
            <div class="kpi-grid" style="margin-bottom:16px;">
                <div class="kpi-card blue kpi-card-clickable" onclick="navigateTo('fleet-map')" title="View on fleet map">
                    <div class="kpi-title">Fleet units tracked</div><div class="kpi-value">${fleet.length}</div>
                    <div class="kpi-trend">GPS + satellite correlation</div>
                </div>
                <div class="kpi-card green"><div class="kpi-title">Avg L/100km (selected)</div><div class="kpi-value">${analysis.avgLitresPer100Km != null ? analysis.avgLitresPer100Km.toFixed(1) : '—'}</div></div>
                <div class="kpi-card orange"><div class="kpi-title">Total litres (selected)</div><div class="kpi-value">${analysis.totalLitres != null ? analysis.totalLitres.toFixed(0) : txs.reduce((s,t)=>s+Number(t.litres||0),0)}</div></div>
                <div class="kpi-card"><div class="kpi-title">Efficiency flag</div><div class="kpi-value">${analysis.efficiencyFlag || 'normal'}</div></div>
            </div>
            <div class="settings-card" style="margin-bottom:16px;">
                <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:end;">
                    <div class="form-group" style="flex:1;min-width:200px;">
                        <label>Fleet unit</label>
                        <select class="form-control" id="fuelUnitSelect" onchange="selectFuelUnit(this.value)">
                            ${fleet.map(u => `<option value="${u.id}" ${u.id === selectedUnitId ? 'selected' : ''}>${u.truckPlate || u.id}</option>`).join('')}
                        </select>
                    </div>
                    <button class="btn btn-primary" onclick="recordFuelIssue()">+ Record fuel issue</button>
                    <button class="btn btn-outline" onclick="syncFuelData()">🔄 Refresh</button>
                    <button class="btn btn-outline" onclick="navigateTo('fleet-map')">🗺️ Map view</button>
                </div>
            </div>
            <div class="settings-card">
                <h3>Fuel transactions & consumption analysis</h3>
                <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;">
                    Litres per 100 km is calculated from <strong>odometer</strong> deltas and issue volumes (industry standard). Engine HP normalises consumption for fleet benchmarking.
                </p>
                <table class="data-table"><thead><tr>
                    <th>Date</th><th>Station</th><th>Litres</th><th>Odometer km</th><th>Distance km</th><th>L/100km</th><th>GPS</th><th>Source</th><th>Flag</th>
                </tr></thead><tbody>
                ${txs.length ? txs.map(t => `<tr>
                    <td>${t.recordedAt || ''}</td>
                    <td>${t.fuelStation || '—'}</td>
                    <td><strong>${Number(t.litres || 0).toFixed(1)}</strong></td>
                    <td>${t.odometerKm != null ? t.odometerKm : '—'}</td>
                    <td>${t.distanceKm != null ? t.distanceKm.toFixed(0) : '—'}</td>
                    <td>${t.litresPer100Km != null ? t.litresPer100Km.toFixed(1) : '—'}</td>
                    <td>${t.gpsLat ? `${t.gpsLat.toFixed(3)}, ${t.gpsLng.toFixed(3)}` : '—'}</td>
                    <td>${t.satelliteSource || 'manual'}</td>
                    <td>${t.efficiencyFlag === 'high' ? '🔴 high' : t.efficiencyFlag === 'low' ? '🟢 low' : '—'}</td>
                </tr>`).join('') : '<tr><td colspan="9">No fuel transactions — record an issue to start tracking.</td></tr>'}
                </tbody></table>
            </div>`;
        });
    };

    window.selectFuelUnit = function (id) {
        selectedUnitId = id;
        syncFuel().then(() => {
            const ca = document.getElementById('contentArea');
            if (ca && currentPage === 'fuel-control') renderFuelControl(ca);
        });
    };

    window.syncFuelData = function () {
        syncFuel().then(() => {
            showToast('Fuel data refreshed', 'success');
            const ca = document.getElementById('contentArea');
            if (ca) renderFuelControl(ca);
        });
    };

    window.recordFuelIssue = function () {
        const litres = Number(prompt('Litres issued:', '200') || 0);
        if (!litres) return;
        const odo = Number(prompt('Odometer km (optional):', '') || 0) || null;
        const payload = {
            fleetUnitId: selectedUnitId,
            litres,
            odometerKm: odo,
            transactionType: 'issue',
            fuelStation: prompt('Fuel station:', 'Depot') || '',
            satelliteSource: 'manual'
        };
        (async () => {
            try {
                if (typeof recordFuelTransactionApi === 'function' && isApiAvailable()) {
                    await recordFuelTransactionApi(payload);
                } else {
                    transactionsDB.unshift({
                        id: `FUEL-${Date.now()}`, ...payload,
                        recordedAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
                    });
                    saveLocal();
                }
                showToast('Fuel issue recorded', 'success');
                syncFuelData();
            } catch (e) { showToast(e.message, 'error'); }
        })();
    };
})();
