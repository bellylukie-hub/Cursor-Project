/**
 * Control Room layout — module rail, auto-hide sidebar, theme hooks.
 */
(function () {
    const MODULE_STORAGE_KEY = 'truckcontrol_active_module';
    const SIDEBAR_PIN_KEY = 'truckcontrol_sidebar_pinned';
    const THEME_ID = 'control-room-black';
    let hideTimer = null;
    let sidebarListenersBound = false;

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
            || (typeof getUserThemeId === 'function' && getUserThemeId() === THEME_ID);
    }

    function isSidebarPinned() {
        try { return localStorage.getItem(SIDEBAR_PIN_KEY) === '1'; } catch { return false; }
    }

    function setSidebarPinned(pinned) {
        try { localStorage.setItem(SIDEBAR_PIN_KEY, pinned ? '1' : '0'); } catch (_) {}
        document.body.classList.toggle('sidebar-pinned', pinned);
        updateSidebarPinButton();
        if (pinned) openSidebar(true);
        else scheduleSidebarHide(0);
    }

    function setBodyLayoutClass() {
        document.body.classList.toggle('layout-control-room', isControlRoomTheme());
        document.body.classList.toggle('sidebar-auto-hide', true);
        document.body.classList.toggle('sidebar-pinned', isSidebarPinned());
    }

    function getActiveModule() {
        try { return localStorage.getItem(MODULE_STORAGE_KEY) || 'main'; } catch { return 'main'; }
    }

    function saveActiveModule(id) {
        try { localStorage.setItem(MODULE_STORAGE_KEY, id); } catch (_) {}
    }

    function isSidebarExpanded() {
        return document.body.classList.contains('sidebar-open')
            || document.body.classList.contains('sidebar-peek')
            || document.body.classList.contains('sidebar-pinned');
    }

    function showAllNavSections(showAll) {
        document.querySelectorAll('.sidebar-nav .nav-section').forEach(section => {
            if (showAll) {
                section.style.display = '';
                return;
            }
            const moduleId = getActiveModule();
            const titles = MODULE_SECTION_MAP[moduleId] || MODULE_SECTION_MAP.main;
            const titleEl = section.querySelector('.nav-section-title');
            const title = titleEl?.textContent?.trim() || '';
            const match = titles.some(t => title.startsWith(t) || title === t);
            section.style.display = match ? '' : 'none';
        });
    }

    function filterSidebarByModule(moduleId) {
        document.querySelectorAll('.module-rail-item').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.module === moduleId);
        });
        showAllNavSections(isSidebarExpanded());
    }

    function openSidebar(persistent) {
        clearTimeout(hideTimer);
        document.body.classList.add(persistent ? 'sidebar-open' : 'sidebar-peek');
        document.body.classList.remove('sidebar-hidden');
        showAllNavSections(true);
    }

    function closeSidebar() {
        if (isSidebarPinned()) return;
        document.body.classList.remove('sidebar-open', 'sidebar-peek');
        document.body.classList.add('sidebar-hidden');
        showAllNavSections(false);
        filterSidebarByModule(getActiveModule());
    }

    function scheduleSidebarHide(delayMs) {
        clearTimeout(hideTimer);
        if (isSidebarPinned()) return;
        hideTimer = setTimeout(() => {
            if (!document.querySelector('.sidebar:hover') && !document.querySelector('.sidebar-trigger-zone:hover')) {
                closeSidebar();
            }
        }, delayMs ?? 450);
    }

    function updateSidebarPinButton() {
        const btn = document.getElementById('sidebarPinBtn');
        if (!btn) return;
        const pinned = isSidebarPinned();
        btn.textContent = pinned ? '📌' : '📍';
        btn.title = pinned ? 'Unpin menu (auto-hide overlay)' : 'Pin menu (push content aside)';
        btn.setAttribute('aria-pressed', pinned ? 'true' : 'false');
    }

    function bindSidebarAutoHide() {
        if (sidebarListenersBound) return;
        sidebarListenersBound = true;

        const zone = document.getElementById('sidebarTriggerZone');
        const sidebar = document.getElementById('sidebar');
        if (zone) {
            zone.addEventListener('mouseenter', () => openSidebar(false));
            zone.addEventListener('mouseleave', () => scheduleSidebarHide(300));
        }
        if (sidebar) {
            sidebar.addEventListener('mouseenter', () => {
                clearTimeout(hideTimer);
                openSidebar(isSidebarPinned());
            });
            sidebar.addEventListener('mouseleave', () => scheduleSidebarHide(400));
            sidebar.addEventListener('focusin', () => openSidebar(false));
        }
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !isSidebarPinned()) closeSidebar();
        });
        document.querySelector('.sidebar-nav')?.addEventListener('click', (e) => {
            if (e.target.closest('.nav-item')) scheduleSidebarHide(500);
        });
    }

    window.setControlRoomModule = function (moduleId, navigate) {
        const id = MODULE_SECTION_MAP[moduleId] ? moduleId : 'main';
        saveActiveModule(id);
        filterSidebarByModule(id);
        openSidebar(false);
        if (navigate !== false) {
            const page = MODULE_DEFAULT_PAGE[id] || 'dashboard';
            if (typeof navigateTo === 'function') navigateTo(page);
            else if (typeof navigateToAdmin === 'function' && id === 'admin') navigateToAdmin(page);
        }
        if (!isSidebarPinned()) scheduleSidebarHide(600);
    };

    window.syncControlRoomModuleForPage = function (page) {
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

    window.toggleSidebarPin = function () {
        setSidebarPinned(!isSidebarPinned());
        if (typeof showToast === 'function') {
            showToast(isSidebarPinned() ? 'Menu pinned open' : 'Menu will auto-hide', 'success');
        }
    };

    window.toggleAppSidebar = function () {
        const sidebar = document.getElementById('sidebar');
        if (window.innerWidth <= 768 && sidebar) {
            sidebar.classList.toggle('mobile-open');
            return;
        }
        if (isSidebarPinned() || isSidebarExpanded()) {
            setSidebarPinned(false);
            closeSidebar();
        } else {
            openSidebar(true);
            scheduleSidebarHide(2500);
        }
    };

    window.onSidebarNavigate = function () {
        if (!isSidebarPinned()) scheduleSidebarHide(500);
    };

    window.initControlRoomUi = function () {
        setBodyLayoutClass();
        bindSidebarAutoHide();
        updateSidebarPinButton();
        filterSidebarByModule(getActiveModule());
        const login = document.getElementById('loginScreen');
        // Split login layout is the only markup in index.html — never strip login-screen-v2.
        if (login) login.classList.add('login-screen-v2');
        if (isSidebarPinned()) openSidebar(true);
        else closeSidebar();
        if (typeof currentPage !== 'undefined' && currentPage) {
            syncControlRoomModuleForPage(currentPage);
        }
    };

    window.initSidebarAutoHide = function () {
        sidebarListenersBound = false;
        initControlRoomUi();
    };

    window.onAppThemeApplied = function (theme) {
        setBodyLayoutClass();
        const login = document.getElementById('loginScreen');
        if (login) login.classList.add('login-screen-v2');
        showAllNavSections(isSidebarExpanded());
        filterSidebarByModule(getActiveModule());
    };

    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initControlRoomUi, 0);
    });
})();
