/**
 * Freight / FMS admin configuration — trip scheduler, client orders, route catalog, fleet registry.
 */
(function () {
    const STORAGE_KEY = 'truckcontrol_freight_settings_v1';

    const DEFAULT_FREIGHT_SETTINGS = {
        defaultTransporter: 'Greendoor Group',
        defaultLoadingTime: '07:00',
        maxOrdersPerTrip: 10,
        allowMultiOrderTrips: true,
        autoAllocateOrdersOnTripSave: true,
        linkTripOrdersToClientOrders: true,
        requireCatalogRoutesForOrders: false,
        allowManualRouteSelection: true,
        defaultNewOrderStatus: 'draft',
        autoGenerateOrderNumber: true,
        orderNumberPrefix: 'GG-',
        defaultClientStatus: 'active',
        requireDriverOnFleetSet: true,
        allowSuperlinkPairing: true,
        showFullFmsRegisterTab: true,
        lockLinkedFleetAssets: true
    };

    const freightSettingsDB = { ...DEFAULT_FREIGHT_SETTINGS };

    function saveLocal() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(freightSettingsDB)); } catch (_) {}
    }

    function loadLocal() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return false;
            Object.assign(freightSettingsDB, JSON.parse(raw));
            return true;
        } catch (_) { return false; }
    }

    window.getFreightSettings = function () {
        return { ...freightSettingsDB };
    };

    window.persistFreightSettings = function () {
        saveLocal();
        if (typeof persistFreightSettingsStorage === 'function') persistFreightSettingsStorage();
    };

    window.loadFreightSettingsFromStorage = function () {
        loadLocal();
    };

    window.applyFreightSettingsPatch = function (patch) {
        Object.assign(freightSettingsDB, patch || {});
        saveLocal();
        if (typeof persistFreightSettingsStorage === 'function') persistFreightSettingsStorage();
    };

    function boolToggle(id, key, label, hint) {
        const checked = freightSettingsDB[key] !== false;
        return `
            <div class="form-group" style="margin-bottom:14px;">
                <label class="toggle-row" style="display:flex;align-items:flex-start;gap:12px;cursor:pointer;">
                    <label class="toggle-switch" style="margin-top:2px;flex-shrink:0;">
                        <input type="checkbox" id="${id}" ${checked ? 'checked' : ''} onchange="updateFreightSetting('${key}', this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                    <span><strong>${label}</strong>${hint ? `<div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">${hint}</div>` : ''}</span>
                </label>
            </div>`;
    }

    function textField(id, key, label, type, placeholder) {
        const val = freightSettingsDB[key] ?? '';
        return `
            <div class="form-group">
                <label>${label}</label>
                <input type="${type || 'text'}" class="form-control" id="${id}" value="${val}" placeholder="${placeholder || ''}">
            </div>`;
    }

    window.renderAdminFreightSettings = function (container) {
        if (typeof canAccessAdminPage === 'function' && !canAccessAdminPage('admin-freight-settings')) {
            container.innerHTML = `<div class="access-denied"><h2>Access Denied</h2><p>Freight &amp; FMS settings require Manager or Super Admin privileges.</p></div>`;
            return;
        }
        const fs = freightSettingsDB;
        const apiStatus = (typeof isApiAvailable === 'function' && isApiAvailable())
            ? '<span class="status-badge green">Backend Connected</span>'
            : '<span class="status-badge orange">Offline — settings saved locally</span>';

        container.innerHTML = `
            ${typeof renderAdminBreadcrumb === 'function' ? renderAdminBreadcrumb('Freight & FMS Settings') : ''}
            <div class="page-header admin-page-header">
                <div>
                    <h1>📦 Freight &amp; FMS Settings</h1>
                    <p class="page-subtitle">Configure Client Orders, Route Catalog, Trip Scheduler, and Fleet Registry behaviour for your organisation.</p>
                </div>
                ${apiStatus}
            </div>
            <div class="rbac-info-banner">
                <strong>Applies across modules:</strong> Trip Scheduler defaults, client order rules, route catalog enforcement, and fleet registry linking policies.
            </div>
            <div class="admin-settings-grid">
                <div class="settings-card">
                    <h3>📅 Trip Scheduler</h3>
                    ${textField('fsDefaultTransporter', 'defaultTransporter', 'Default Transporter', 'text', 'Greendoor Group')}
                    ${textField('fsDefaultLoadingTime', 'defaultLoadingTime', 'Default Loading Time', 'time', '07:00')}
                    ${textField('fsMaxOrdersPerTrip', 'maxOrdersPerTrip', 'Max Orders per Trip', 'number', '10')}
                    ${boolToggle('fsAllowMulti', 'allowMultiOrderTrips', 'Allow multiple client orders per trip', 'One truck can carry cargo from several client orders on the same trip.')}
                    ${boolToggle('fsAutoAlloc', 'autoAllocateOrdersOnTripSave', 'Auto-allocate orders when trip is saved', 'Marks client orders as allocated and links them to the fleet unit.')}
                    ${boolToggle('fsLinkOrders', 'linkTripOrdersToClientOrders', 'Link trip cargo to Client Orders dropdown', 'Trip scheduler selects orders from Client Orders and auto-fills fields.')}
                </div>
                <div class="settings-card">
                    <h3>📦 Client Orders &amp; Clients</h3>
                    ${textField('fsOrderPrefix', 'orderNumberPrefix', 'Order Number Prefix', 'text', 'GG-')}
                    <div class="form-group">
                        <label>Default New Order Status</label>
                        <select class="form-control" id="fsDefaultOrderStatus">
                            ${['draft', 'confirmed'].map(s => `<option value="${s}"${fs.defaultNewOrderStatus === s ? ' selected' : ''}>${s}</option>`).join('')}
                        </select>
                    </div>
                    ${boolToggle('fsAutoOrderNo', 'autoGenerateOrderNumber', 'Auto-generate order numbers', 'When blank, system assigns the next order number using the prefix above.')}
                    <div class="form-group">
                        <label>Default Client Status</label>
                        <select class="form-control" id="fsDefaultClientStatus">
                            ${['active', 'inactive'].map(s => `<option value="${s}"${fs.defaultClientStatus === s ? ' selected' : ''}>${s}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="settings-card">
                    <h3>🗺️ Route Catalog</h3>
                    ${boolToggle('fsRequireCatalog', 'requireCatalogRoutesForOrders', 'Require pre-defined catalog routes for orders', 'Users must pick a route template; manual origin/destination only if manual selection is also enabled.')}
                    ${boolToggle('fsAllowManual', 'allowManualRouteSelection', 'Allow manual route selection', 'Permit choosing origin/destination stations without a pre-defined route template.')}
                </div>
                <div class="settings-card">
                    <h3>🚛 Fleet Registry</h3>
                    ${boolToggle('fsRequireDriver', 'requireDriverOnFleetSet', 'Require driver on fleet set', 'A truck + trailer fleet set must have a driver assigned before saving.')}
                    ${boolToggle('fsSuperlink', 'allowSuperlinkPairing', 'Allow superlink trailer pairing', 'Enable front + rear trailer pairing for superlink units.')}
                    ${boolToggle('fsFullRegister', 'showFullFmsRegisterTab', 'Show Full FMS Register tab', 'Display the full ~87-column vehicle register grid in Fleet Registry.')}
                    ${boolToggle('fsLockAssets', 'lockLinkedFleetAssets', 'Lock linked fleet assets', 'Once linked in a fleet set, truck/trailer/driver cannot join another set.')}
                </div>
            </div>
            <div style="margin-top:20px;display:flex;gap:10px;flex-wrap:wrap;">
                <button class="btn btn-primary" onclick="saveFreightSettingsAdmin()">💾 Save Freight Settings</button>
                <button class="btn btn-outline" onclick="resetFreightSettingsAdmin()">↺ Reset to Defaults</button>
            </div>`;
    };

    window.updateFreightSetting = function (key, value) {
        if (key === 'maxOrdersPerTrip') value = Math.max(1, parseInt(value, 10) || 1);
        freightSettingsDB[key] = value;
        saveLocal();
        if (typeof persistFreightSettingsStorage === 'function') persistFreightSettingsStorage();
    };

    window.saveFreightSettingsAdmin = async function () {
        const patch = {
            defaultTransporter: document.getElementById('fsDefaultTransporter')?.value.trim() || DEFAULT_FREIGHT_SETTINGS.defaultTransporter,
            defaultLoadingTime: document.getElementById('fsDefaultLoadingTime')?.value || DEFAULT_FREIGHT_SETTINGS.defaultLoadingTime,
            maxOrdersPerTrip: Math.max(1, parseInt(document.getElementById('fsMaxOrdersPerTrip')?.value, 10) || DEFAULT_FREIGHT_SETTINGS.maxOrdersPerTrip),
            allowMultiOrderTrips: document.getElementById('fsAllowMulti')?.checked !== false,
            autoAllocateOrdersOnTripSave: document.getElementById('fsAutoAlloc')?.checked !== false,
            linkTripOrdersToClientOrders: document.getElementById('fsLinkOrders')?.checked !== false,
            orderNumberPrefix: document.getElementById('fsOrderPrefix')?.value.trim() || DEFAULT_FREIGHT_SETTINGS.orderNumberPrefix,
            defaultNewOrderStatus: document.getElementById('fsDefaultOrderStatus')?.value || 'draft',
            autoGenerateOrderNumber: document.getElementById('fsAutoOrderNo')?.checked !== false,
            defaultClientStatus: document.getElementById('fsDefaultClientStatus')?.value || 'active',
            requireCatalogRoutesForOrders: document.getElementById('fsRequireCatalog')?.checked === true,
            allowManualRouteSelection: document.getElementById('fsAllowManual')?.checked !== false,
            requireDriverOnFleetSet: document.getElementById('fsRequireDriver')?.checked !== false,
            allowSuperlinkPairing: document.getElementById('fsSuperlink')?.checked !== false,
            showFullFmsRegisterTab: document.getElementById('fsFullRegister')?.checked !== false,
            lockLinkedFleetAssets: document.getElementById('fsLockAssets')?.checked !== false
        };
        Object.assign(freightSettingsDB, patch);
        saveLocal();
        if (typeof persistFreightSettingsStorage === 'function') persistFreightSettingsStorage();
        try {
            if (typeof saveFreightSettingsApi === 'function' && typeof isApiAvailable === 'function' && isApiAvailable()) {
                await saveFreightSettingsApi(patch);
            }
        } catch (e) { console.warn('Freight settings API save failed:', e.message); }
        if (typeof logAuditEvent === 'function') logAuditEvent('Updated Freight & FMS Settings', 'freight_settings', 'settings', JSON.stringify(patch));
        if (typeof showToast === 'function') showToast('Freight & FMS settings saved', 'success');
    };

    window.resetFreightSettingsAdmin = function () {
        if (!confirm('Reset all Freight & FMS settings to defaults?')) return;
        Object.assign(freightSettingsDB, DEFAULT_FREIGHT_SETTINGS);
        saveLocal();
        if (typeof showToast === 'function') showToast('Freight settings reset', 'success');
        if (currentPage === 'admin-freight-settings') {
            renderAdminFreightSettings(document.getElementById('contentArea'));
        }
    };

    window.freightSettingsDB = freightSettingsDB;
    loadLocal();
})();
