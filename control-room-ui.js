/**
 * Control Room Black — login shell, module rail, and layout helpers.
 */
(function () {
    const MODULE_STORAGE_KEY = 'truckcontrol_active_module';
    const THEME_ID = 'control-room-black';

    const MODULE_DEFAULT_PAGE = {
        main: 'dashboard',
        operations: 'nb-operations',
        freight: 'client-orders',
        communication: 'internal-communication',
        admin: 'admin-users'
    };

    const MODULE_SECTION_MAP = {
        main: ['Main'],
        operations: ['Operations', 'Areas'],
        freight: ['Management'],
        communication: ['Communication'],
        admin: ['Admin', 'Development']
    };

    function isControlRoomTheme() {
        return document.documentElement.getAttribute('data-theme') === THEME_ID
            || (window.systemSettingsDB?.activeTheme === THEME_ID);
    }

    function setBodyLayoutClass() {
        document.body.classList.toggle('layout-control-room', isControlRoomTheme());
    }

    function getActiveModule() {
        try {
            return localStorage.getItem(MODULE_STORAGE_KEY) || 'main';
        } catch {
            return 'main';
        }
    }

    function saveActiveModule(id) {
        try { localStorage.setItem(MODULE_STORAGE_KEY, id); } catch (_) {}
    }

    function filterSidebarByModule(moduleId) {
        const titles = MODULE_SECTION_MAP[moduleId] || MODULE_SECTION_MAP.main;
        document.querySelectorAll('.sidebar-nav .nav-section').forEach(section => {
            const titleEl = section.querySelector('.nav-section-title');
            const title = titleEl?.textContent?.trim() || '';
            const match = titles.some(t => title.startsWith(t) || title === t);
            section.style.display = match ? '' : 'none';
        });
        document.querySelectorAll('.module-rail-item').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.module === moduleId);
        });
    }

    window.setControlRoomModule = function (moduleId, navigate) {
        if (!isControlRoomTheme()) return;
        const id = MODULE_SECTION_MAP[moduleId] ? moduleId : 'main';
        saveActiveModule(id);
        filterSidebarByModule(id);
        if (navigate !== false) {
            const page = MODULE_DEFAULT_PAGE[id] || 'dashboard';
            if (typeof navigateTo === 'function') navigateTo(page);
            else if (typeof navigateToAdmin === 'function' && id === 'admin') navigateToAdmin(page);
        }
    };

    window.syncControlRoomModuleForPage = function (page) {
        if (!isControlRoomTheme()) return;
        const ops = ['nb-operations', 'sb-operations', 'border-clearance', 'pod-management', 'area-browser', 'position-live'];
        const freight = ['assets', 'client-orders', 'clients', 'route-catalog', 'trip-scheduler', 'fleet-registry', 'runner-fees', 'reports', 'turnarounds', 'fleet-map'];
        const comm = ['communication-matrix', 'driver-registry', 'internal-communication', 'helpdesk'];
        const admin = page?.startsWith('admin-') || page === 'custom-sql-page';
        let mod = 'main';
        if (page === 'dashboard') mod = 'main';
        else if (ops.includes(page)) mod = 'operations';
        else if (freight.includes(page)) mod = 'freight';
        else if (comm.includes(page)) mod = 'communication';
        else if (admin) mod = 'admin';
        saveActiveModule(mod);
        filterSidebarByModule(mod);
    };

    window.initControlRoomUi = function () {
        setBodyLayoutClass();
        if (!isControlRoomTheme()) return;
        filterSidebarByModule(getActiveModule());
        const login = document.getElementById('loginScreen');
        if (login) login.classList.add('login-screen-v2');
        if (typeof currentPage !== 'undefined' && currentPage) {
            syncControlRoomModuleForPage(currentPage);
        }
    };

    window.onAppThemeApplied = function (theme) {
        setBodyLayoutClass();
        if (theme?.id === THEME_ID) {
            initControlRoomUi();
        } else {
            document.querySelectorAll('.sidebar-nav .nav-section').forEach(s => { s.style.display = ''; });
            document.getElementById('loginScreen')?.classList.remove('login-screen-v2');
        }
    };

    const origApply = window.applyAppTheme;
    if (typeof origApply === 'function') {
        window.applyAppTheme = function (themeId) {
            const theme = origApply(themeId);
            if (typeof onAppThemeApplied === 'function') onAppThemeApplied(theme);
            return theme;
        };
    }

    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initControlRoomUi, 0);
    });
})();
