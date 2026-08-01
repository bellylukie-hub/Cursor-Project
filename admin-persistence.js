/**
 * Admin settings persistence — localStorage + optional API sync.
 */
(function () {
    const STORAGE_KEYS = {
        users: 'truckcontrol_admin_users',
        roles: 'truckcontrol_admin_roles',
        settings: 'truckcontrol_system_settings',
        audit: 'truckcontrol_audit_logs',
        areaStatuses: 'truckcontrol_area_statuses',
        globalStatusLists: 'truckcontrol_global_status_lists',
        uploadTemplates: 'truckcontrol_upload_templates',
        meta: 'truckcontrol_admin_meta'
    };

    function readJson(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch {
            return fallback;
        }
    }

    function writeJson(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function getMeta() {
        return readJson(STORAGE_KEYS.meta, { nextAdminUserId: 7, nextAuditLogId: 8, nextRoleId: 1, nextAreaStatusId: 8 });
    }

    function saveMeta(meta) {
        writeJson(STORAGE_KEYS.meta, { ...getMeta(), ...meta });
    }

    window.loadAdminSettingsFromStorage = function () {
        const storedUsers = readJson(STORAGE_KEYS.users, null);
        if (storedUsers?.length && window.adminUsersDB) {
            window.adminUsersDB.length = 0;
            storedUsers.forEach(u => window.adminUsersDB.push(u));
        }
        const storedRoles = readJson(STORAGE_KEYS.roles, null);
        if (storedRoles?.length && window.rolesDB) {
            window.rolesDB.length = 0;
            storedRoles.forEach(r => window.rolesDB.push(r));
        }
        const storedSettings = readJson(STORAGE_KEYS.settings, null);
        if (storedSettings && window.systemSettingsDB) {
            Object.assign(window.systemSettingsDB, storedSettings);
        }
        const storedAudit = readJson(STORAGE_KEYS.audit, null);
        if (storedAudit?.length && window.auditLogsDB) {
            window.auditLogsDB.length = 0;
            storedAudit.forEach(l => window.auditLogsDB.push(l));
        }
        const storedAreas = readJson(STORAGE_KEYS.areaStatuses, null);
        if (storedAreas?.length && window.areaStatusesDB) {
            window.areaStatusesDB.length = 0;
            storedAreas.forEach(a => window.areaStatusesDB.push(a));
        }
        const storedGlobal = readJson(STORAGE_KEYS.globalStatusLists, null);
        if (storedGlobal && window.globalStatusListsDB) {
            Object.assign(window.globalStatusListsDB, storedGlobal);
        }
        const storedTemplates = readJson(STORAGE_KEYS.uploadTemplates, null);
        if (storedTemplates && window.uploadTemplatesDB) {
            Object.entries(storedTemplates).forEach(([k, v]) => {
                if (window.uploadTemplatesDB[k]) Object.assign(window.uploadTemplatesDB[k], v);
            });
        }
        const meta = getMeta();
        if (typeof window.nextAdminUserId !== 'undefined') window.nextAdminUserId = meta.nextAdminUserId;
        if (typeof window.nextAuditLogId !== 'undefined') window.nextAuditLogId = meta.nextAuditLogId;
        if (typeof window.nextRoleId !== 'undefined') window.nextRoleId = meta.nextRoleId;
        if (typeof window.nextAreaStatusId !== 'undefined') window.nextAreaStatusId = meta.nextAreaStatusId;
        if (typeof window.applySystemSettingsToUi === 'function') window.applySystemSettingsToUi();
        if (typeof window.refreshPodStatusOptions === 'function') window.refreshPodStatusOptions();
        if (typeof window.rebuildLiveColumnsFromTemplates === 'function') window.rebuildLiveColumnsFromTemplates();
    };

    window.persistAdminUsers = function () {
        writeJson(STORAGE_KEYS.users, window.adminUsersDB);
        saveMeta({ nextAdminUserId: window.nextAdminUserId });
    };

    window.persistAdminRoles = function () {
        writeJson(STORAGE_KEYS.roles, window.rolesDB);
        saveMeta({ nextRoleId: window.nextRoleId });
    };

    window.persistSystemSettings = function () {
        writeJson(STORAGE_KEYS.settings, window.systemSettingsDB);
    };

    window.persistAuditLogs = function () {
        writeJson(STORAGE_KEYS.audit, window.auditLogsDB);
        saveMeta({ nextAuditLogId: window.nextAuditLogId });
    };

    window.persistAreaStatuses = function () {
        writeJson(STORAGE_KEYS.areaStatuses, window.areaStatusesDB);
        saveMeta({ nextAreaStatusId: window.nextAreaStatusId });
    };

    window.persistGlobalStatusLists = function () {
        writeJson(STORAGE_KEYS.globalStatusLists, window.globalStatusListsDB);
    };

    window.persistUploadTemplates = function () {
        writeJson(STORAGE_KEYS.uploadTemplates, window.uploadTemplatesDB);
    };

    window.persistAllAdminData = function () {
        persistAdminUsers();
        persistAdminRoles();
        persistSystemSettings();
        persistAuditLogs();
        persistAreaStatuses();
        persistGlobalStatusLists();
        persistUploadTemplates();
    };

    function mergeUsersFromApi(apiUsers) {
        if (!apiUsers?.length || !window.adminUsersDB) return;
        apiUsers.forEach(au => {
            const existing = window.adminUsersDB.find(u => u.id === au.id);
            const row = {
                id: au.id,
                username: au.username,
                email: au.email || '',
                passwordHash: '[server]',
                roleId: au.roleId,
                status: au.status || 'active',
                area: au.area || '',
                assignedAreas: au.assignedAreas || [au.area].filter(Boolean),
                phone: au.phone || '',
                createdAt: au.createdAt || '',
                lastLogin: au.lastLogin || null,
                bannedAt: au.bannedAt || null,
                bannedReason: au.bannedReason || '',
                modulePermissions: au.modulePermissions || existing?.modulePermissions
            };
            if (existing) Object.assign(existing, row);
            else window.adminUsersDB.push(row);
        });
        persistAdminUsers();
    }

    function mergeRolesFromApi(apiRoles) {
        if (!apiRoles?.length || !window.rolesDB) return;
        apiRoles.forEach(ar => {
            const existing = window.rolesDB.find(r => r.id === ar.id);
            const row = {
                id: ar.id,
                name: ar.name,
                description: ar.description || '',
                system: !!ar.system,
                permissions: ar.permissions || []
            };
            if (existing) Object.assign(existing, row);
            else window.rolesDB.push(row);
        });
        persistAdminRoles();
    }

    window.syncAdminFromApi = async function () {
        if (typeof isApiAvailable !== 'function' || !isApiAvailable()) return false;
        try {
            if (typeof fetchAdminUsers === 'function') {
                const users = await fetchAdminUsers();
                mergeUsersFromApi(users);
            }
            if (typeof fetchAdminRoles === 'function') {
                const roles = await fetchAdminRoles();
                mergeRolesFromApi(roles);
            }
            if (typeof fetchSystemSettings === 'function') {
                const settings = await fetchSystemSettings();
                if (settings && window.systemSettingsDB) {
                    Object.assign(window.systemSettingsDB, settings);
                    persistSystemSettings();
                    if (typeof applySystemSettingsToUi === 'function') applySystemSettingsToUi();
                }
            }
            if (typeof fetchAuditLogs === 'function') {
                const logs = await fetchAuditLogs();
                if (logs?.length && window.auditLogsDB) {
                    const existingIds = new Set(window.auditLogsDB.map(l => l.id));
                    logs.forEach(log => {
                        if (!existingIds.has(log.id)) window.auditLogsDB.unshift(log);
                    });
                    window.auditLogsDB.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
                    persistAuditLogs();
                }
            }
            if (typeof fetchAreaStatusesFull === 'function') {
                const areas = await fetchAreaStatusesFull();
                if (areas?.length && window.areaStatusesDB) {
                    window.areaStatusesDB.length = 0;
                    areas.forEach(a => window.areaStatusesDB.push(a));
                    persistAreaStatuses();
                }
            }
            if (typeof fetchGlobalStatusLists === 'function') {
                const lists = await fetchGlobalStatusLists();
                if (lists && window.globalStatusListsDB) {
                    Object.assign(window.globalStatusListsDB, lists);
                    persistGlobalStatusLists();
                    if (typeof refreshPodStatusOptions === 'function') refreshPodStatusOptions();
                }
            }
            if (typeof fetchUploadTemplates === 'function') {
                const templates = await fetchUploadTemplates();
                if (templates && window.uploadTemplatesDB) {
                    Object.entries(templates).forEach(([k, v]) => {
                        if (window.uploadTemplatesDB[k]) Object.assign(window.uploadTemplatesDB[k], v);
                    });
                    persistUploadTemplates();
                    if (typeof rebuildLiveColumnsFromTemplates === 'function') rebuildLiveColumnsFromTemplates();
                }
            }
            if (typeof syncAdminUsersToInternalComm === 'function') syncAdminUsersToInternalComm();
            window.adminUsersDB?.forEach(u => {
                if (typeof ensureUserModulePermissions === 'function') ensureUserModulePermissions(u);
            });
            return true;
        } catch (e) {
            console.warn('Admin API sync failed:', e.message);
            return false;
        }
    };

    window.pushAuditToApi = function (entry) {
        if (typeof isApiAvailable !== 'function' || !isApiAvailable() || typeof postAuditLog !== 'function') return;
        postAuditLog({
            action: entry.action,
            targetId: entry.targetId,
            targetType: entry.targetType,
            details: entry.details
        }).catch(e => console.warn('Audit API push failed:', e.message));
    };

    window.applySystemSettingsToUi = function () {
        const s = window.systemSettingsDB;
        if (!s) return;
        if (s.appName) {
            document.title = s.appName;
            const brand = document.querySelector('.sidebar-header h2, .app-title, .logo-text');
            if (brand) brand.textContent = s.appName.length > 40 ? 'TruckControl' : s.appName;
        }
    };

    let sessionActivityAt = Date.now();
    let sessionTimer = null;

    window.resetSessionActivity = function () {
        sessionActivityAt = Date.now();
    };

    window.startSessionTimeoutWatcher = function () {
        if (sessionTimer) return;
        ['click', 'keydown', 'mousemove', 'scroll'].forEach(evt => {
            document.addEventListener(evt, resetSessionActivity, { passive: true });
        });
        sessionTimer = setInterval(() => {
            const mins = window.systemSettingsDB?.sessionTimeoutMinutes;
            if (!mins || mins <= 0) return;
            const elapsed = (Date.now() - sessionActivityAt) / 60000;
            if (elapsed >= mins) {
                if (typeof handleLogout === 'function') handleLogout();
                if (typeof showToast === 'function') showToast('Session timed out due to inactivity.', 'warning');
                sessionActivityAt = Date.now();
            }
        }, 30000);
    };

    window.checkMaintenanceModeForLogin = function (user) {
        if (!window.systemSettingsDB?.maintenanceMode) return true;
        const role = typeof getRoleById === 'function' ? getRoleById(user?.roleId) : null;
        if (role?.name === 'Super Admin') return true;
        return false;
    };
})();
