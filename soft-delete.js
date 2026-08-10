/**
 * Shared soft-delete: Super Admin can delete & restore; Manager/users with delete permission can delete only.
 * Deleted rows stay visible when "Show deleted" is checked (faded). Status filters can target "Deleted" only.
 */
(function () {
    const registry = {};
    const uiState = {};

    function escJs(val) {
        return String(val ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    }

    window.registerSoftDeleteModule = function (moduleId, config) {
        registry[moduleId] = config;
        if (!uiState[moduleId]) uiState[moduleId] = { showDeleted: false };
    };

    window.isRecordDeleted = function (record) {
        return !!(record && (record.deletedAt || record.status === 'deleted'));
    };

    window.canRestoreRecords = function () {
        return typeof userIsSuperAdmin === 'function' && userIsSuperAdmin();
    };

    window.canSoftDeleteRecord = function (moduleId, area) {
        if (typeof userIsSuperAdmin === 'function' && userIsSuperAdmin()) return true;
        if (typeof canDeleteInModule === 'function' && canDeleteInModule(moduleId, area)) return true;
        const role = typeof getCurrentRole === 'function' ? getCurrentRole() : null;
        if (role?.name === 'Manager' && typeof canEditInModule === 'function' && canEditInModule(moduleId, area)) {
            return true;
        }
        return false;
    };

    window.getSoftDeleteUi = function (moduleId) {
        if (!uiState[moduleId]) uiState[moduleId] = { showDeleted: false };
        return uiState[moduleId];
    };

    window.setSoftDeleteShowDeleted = function (moduleId, show, refreshFn) {
        getSoftDeleteUi(moduleId).showDeleted = !!show;
        if (refreshFn && typeof window[refreshFn] === 'function') window[refreshFn]();
        else registry[moduleId]?.refresh?.();
    };

    window.filterListWithSoftDelete = function (items, moduleId, statusFilter, statusFn) {
        const ui = getSoftDeleteUi(moduleId);
        const getStatus = typeof statusFn === 'function' ? statusFn : () => 'all';
        const deleted = items.filter(isRecordDeleted);
        const active = items.filter(r => !isRecordDeleted(r));

        if (statusFilter === 'deleted') return deleted;

        let result = statusFilter === 'all' || !statusFilter
            ? active
            : active.filter(r => getStatus(r) === statusFilter);

        if (ui.showDeleted) {
            const deletedPart = statusFilter === 'all' || !statusFilter
                ? deleted
                : deleted.filter(r => getStatus(r) === statusFilter);
            result = [...result, ...deletedPart];
        }
        return result;
    };

    window.applySoftDeleteFilter = function (items, moduleId) {
        return filterListWithSoftDelete(items, moduleId, 'all');
    };

    window.softDeleteRowClass = function (record) {
        return isRecordDeleted(record) ? 'row-deleted' : '';
    };

    window.renderSoftDeleteBadge = function (record) {
        if (!isRecordDeleted(record)) return '';
        return ' <span class="status-badge row-deleted-badge" title="Deleted record">Deleted</span>';
    };

    window.renderSoftDeleteShowCheckbox = function (moduleId, refreshFn) {
        const ui = getSoftDeleteUi(moduleId);
        const fn = escJs(refreshFn || registry[moduleId]?.refreshName || '');
        return `<label class="soft-delete-show-checkbox" title="Show deleted rows (faded). Super Admin can restore them.">
            <input type="checkbox" ${ui.showDeleted ? 'checked' : ''} onchange="setSoftDeleteShowDeleted('${escJs(moduleId)}', this.checked, '${fn}')">
            Show deleted
        </label>`;
    };

    window.renderSoftDeleteActions = function (moduleId, recordId, area, refreshFn) {
        const config = registry[moduleId];
        const record = config?.findById?.(recordId);
        if (!record) return '';
        const fn = escJs(refreshFn || config?.refreshName || '');
        const id = escJs(recordId);
        const ar = escJs(area || '_global');
        if (isRecordDeleted(record)) {
            if (canRestoreRecords()) {
                return `<button type="button" class="btn btn-outline btn-sm soft-delete-restore" onclick="restoreSoftDeletedRecord('${escJs(moduleId)}', '${id}', '${fn}')" title="Restore (Super Admin)">♻️ Restore</button>`;
            }
            return '<span class="soft-delete-locked" title="Deleted — only Super Admin can restore">🗑️</span>';
        }
        if (!canSoftDeleteRecord(moduleId, area)) return '';
        return `<button type="button" class="btn btn-danger btn-sm" onclick="confirmSoftDeleteRecord('${escJs(moduleId)}', '${id}', '${ar}', '${fn}')" title="Delete">🗑️</button>`;
    };

    window.confirmSoftDeleteRecord = function (moduleId, recordId, area, refreshFn) {
        if (!canSoftDeleteRecord(moduleId, area)) {
            if (typeof showToast === 'function') showToast('You do not have permission to delete this record.', 'warning');
            return;
        }
        const label = registry[moduleId]?.label || 'record';
        const reason = prompt(`Delete this ${label}? It will be hidden from lists but can be restored by Super Admin.\n\nReason (optional):`, '');
        if (reason === null) return;
        softDeleteRecord(moduleId, recordId, area, reason, refreshFn);
    };

    window.softDeleteRecord = function (moduleId, recordId, area, reason, refreshFn) {
        const config = registry[moduleId];
        const record = config?.findById?.(recordId);
        if (!record) {
            if (typeof showToast === 'function') showToast('Record not found', 'warning');
            return false;
        }
        if (isRecordDeleted(record)) return false;
        if (!canSoftDeleteRecord(moduleId, area)) {
            if (typeof showToast === 'function') showToast('You do not have permission to delete this record.', 'warning');
            return false;
        }
        const user = typeof getCurrentAdminUser === 'function' ? getCurrentAdminUser() : null;
        record.deletedAt = new Date().toISOString();
        record.deletedBy = user?.username || 'system';
        record.deletedReason = reason || '';
        if (record.status && record.status !== 'deleted') record._statusBeforeDelete = record.status;
        if (typeof logAuditEvent === 'function') {
            logAuditEvent(`Soft deleted ${moduleId}: ${recordId}`, recordId, moduleId, reason || 'No reason given');
        }
        if (typeof config?.onDelete === 'function') config.onDelete(record);
        if (refreshFn && typeof window[refreshFn] === 'function') window[refreshFn]();
        else config?.refresh?.();
        if (typeof updateSidebarBadges === 'function') updateSidebarBadges();
        if (typeof showToast === 'function') showToast(`${config?.label || 'Record'} deleted. Tick "Show deleted" to view it.`, 'success');
        return true;
    };

    window.restoreSoftDeletedRecord = function (moduleId, recordId, refreshFn) {
        if (!canRestoreRecords()) {
            if (typeof showToast === 'function') showToast('Only Super Admin can restore deleted records.', 'warning');
            return false;
        }
        const config = registry[moduleId];
        const record = config?.findById?.(recordId);
        if (!record || !isRecordDeleted(record)) return false;
        delete record.deletedAt;
        delete record.deletedBy;
        delete record.deletedReason;
        if (record._statusBeforeDelete) {
            record.status = record._statusBeforeDelete;
            delete record._statusBeforeDelete;
        }
        if (typeof logAuditEvent === 'function') {
            logAuditEvent(`Restored ${moduleId}: ${recordId}`, recordId, moduleId, 'Reactivated by Super Admin');
        }
        if (typeof config?.onRestore === 'function') config.onRestore(record);
        if (refreshFn && typeof window[refreshFn] === 'function') window[refreshFn]();
        else config?.refresh?.();
        if (typeof updateSidebarBadges === 'function') updateSidebarBadges();
        if (typeof showToast === 'function') showToast(`${config?.label || 'Record'} restored.`, 'success');
        return true;
    };

    window.initSoftDeleteModules = function () {
        registerSoftDeleteModule('assets', {
            label: 'asset',
            refreshName: 'refreshAssetsTable',
            findById: id => (typeof getAssetById === 'function' ? getAssetById(id) : null),
            refresh: () => { if (typeof refreshAssetsTable === 'function') refreshAssetsTable(); }
        });
        registerSoftDeleteModule('communication-matrix', {
            label: 'contact',
            refreshName: 'refreshMatrixTable',
            findById: id => (window.communicationMatrixDB || []).find(c => String(c.id) === String(id)),
            refresh: () => { if (typeof refreshMatrixTable === 'function') refreshMatrixTable(); }
        });
        registerSoftDeleteModule('driver-registry', {
            label: 'driver contact',
            refreshName: 'refreshDriverRegistryTable',
            findById: id => (window.driverContactsDB || []).find(c => String(c.id) === String(id) || c.tripNumber === id),
            refresh: () => { if (typeof refreshDriverRegistryTable === 'function') refreshDriverRegistryTable(); }
        });
        registerSoftDeleteModule('pod-management', {
            label: 'POD record',
            refreshName: 'refreshPODTable',
            findById: id => (window.podDB || []).find(p => p.trip === id),
            refresh: () => { if (typeof refreshPODTable === 'function') refreshPODTable(); }
        });
        registerSoftDeleteModule('nb-operations', {
            label: 'NB trip',
            refreshName: 'refreshNBOperationsTable',
            findById: id => (window.tripsDB || {})[id],
            refresh: () => {
                if (typeof refreshNBOperationsTable === 'function') refreshNBOperationsTable();
                else if (typeof navigateTo === 'function' && typeof currentPage !== 'undefined') navigateTo(currentPage);
            }
        });
        registerSoftDeleteModule('sb-operations', {
            label: 'SB trip',
            refreshName: 'refreshSBOperationsTable',
            findById: id => (window.tripsDB || {})[id],
            refresh: () => {
                if (typeof refreshSBOperationsTable === 'function') refreshSBOperationsTable();
                else if (typeof navigateTo === 'function' && typeof currentPage !== 'undefined') navigateTo(currentPage);
            }
        });
        registerSoftDeleteModule('border-clearance', {
            label: 'border trip',
            refreshName: 'refreshBorderClearanceTable',
            findById: id => (window.tripsDB || {})[id],
            refresh: () => { if (typeof refreshBorderClearancePanels === 'function') refreshBorderClearancePanels(); }
        });
        registerSoftDeleteModule('area-browser', {
            label: 'area trip',
            refreshName: 'refreshAreaBrowserPanels',
            findById: id => (window.tripsDB || {})[id],
            refresh: () => { if (typeof refreshAreaBrowserPanels === 'function') refreshAreaBrowserPanels(); }
        });
        registerSoftDeleteModule('client-orders', {
            label: 'client order',
            refreshName: 'refreshClientOrdersPage',
            findById: id => (typeof getOrderById === 'function' ? getOrderById(id) : null),
            refresh: () => { if (typeof refreshClientOrdersPage === 'function') refreshClientOrdersPage(); }
        });
        registerSoftDeleteModule('clients', {
            label: 'client',
            refreshName: 'refreshClientsPage',
            findById: id => (window.clientsDB || []).find(c => c.id === id),
            refresh: () => { if (typeof refreshClientsPage === 'function') refreshClientsPage(); }
        });
        registerSoftDeleteModule('helpdesk', {
            label: 'helpdesk ticket',
            refreshName: 'refreshHelpdeskPage',
            findById: id => (typeof findHelpdeskTicketById === 'function' ? findHelpdeskTicketById(id) : null),
            refresh: () => { if (typeof refreshHelpdeskPage === 'function') refreshHelpdeskPage(); }
        });
    };
})();
