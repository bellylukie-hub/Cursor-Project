/**
 * Application themes — CSS variable packs applied via data-theme on <html>.
 */
(function () {
    const STORAGE_KEY = 'truckcontrol_system_settings';

    const APP_THEMES = [
        {
            id: 'ocean-blue',
            name: 'Ocean Blue',
            description: 'Classic professional blue — the default TruckControl look.',
            icon: '🌊',
            preview: ['#1a365d', '#2b6cb0', '#1e2a3a'],
            vars: {
                '--primary': '#1a365d',
                '--primary-light': '#2b6cb0',
                '--bg-main': '#edf2f7',
                '--bg-sidebar': '#1e2a3a',
                '--bg-card': '#ffffff',
                '--text-primary': '#2d3748',
                '--text-secondary': '#718096',
                '--border': '#e2e8f0',
                '--logo-grad-start': '#63b3ed',
                '--logo-grad-end': '#2b6cb0',
                '--sidebar-accent': '#90cdf4',
                '--sidebar-nav-active': 'rgba(43, 108, 176, 0.22)'
            }
        },
        {
            id: 'midnight-pro',
            name: 'Midnight Pro',
            description: 'Deep indigo sidebar with vibrant violet accents.',
            icon: '🌙',
            preview: ['#1a1b2e', '#6c63ff', '#0f0f1a'],
            vars: {
                '--primary': '#1a1b2e',
                '--primary-light': '#6c63ff',
                '--bg-main': '#f0f0f8',
                '--bg-sidebar': '#0f0f1a',
                '--bg-card': '#ffffff',
                '--text-primary': '#1a1b2e',
                '--text-secondary': '#6b7280',
                '--border': '#e5e7f0',
                '--logo-grad-start': '#a78bfa',
                '--logo-grad-end': '#6c63ff',
                '--sidebar-accent': '#c4b5fd',
                '--sidebar-nav-active': 'rgba(108, 99, 255, 0.25)'
            }
        },
        {
            id: 'forest-logistics',
            name: 'Forest Logistics',
            description: 'Fresh emerald greens — ideal for dispatch and transit teams.',
            icon: '🌲',
            preview: ['#1c4532', '#38a169', '#1a2e23'],
            vars: {
                '--primary': '#1c4532',
                '--primary-light': '#38a169',
                '--bg-main': '#edf7f1',
                '--bg-sidebar': '#1a2e23',
                '--bg-card': '#ffffff',
                '--text-primary': '#1a3328',
                '--text-secondary': '#5f7a6e',
                '--border': '#d8ebe0',
                '--logo-grad-start': '#68d391',
                '--logo-grad-end': '#276749',
                '--sidebar-accent': '#9ae6b4',
                '--sidebar-nav-active': 'rgba(56, 161, 105, 0.22)'
            }
        },
        {
            id: 'copper-haul',
            name: 'Copper Haul',
            description: 'Warm copper and amber tones inspired by mining corridors.',
            icon: '⛏️',
            preview: ['#7b341e', '#dd6b20', '#2d1f14'],
            vars: {
                '--primary': '#7b341e',
                '--primary-light': '#dd6b20',
                '--bg-main': '#faf5f0',
                '--bg-sidebar': '#2d1f14',
                '--bg-card': '#ffffff',
                '--text-primary': '#3d2914',
                '--text-secondary': '#8b7355',
                '--border': '#f0e0d0',
                '--logo-grad-start': '#f6ad55',
                '--logo-grad-end': '#c05621',
                '--sidebar-accent': '#fbd38d',
                '--sidebar-nav-active': 'rgba(221, 107, 32, 0.22)'
            }
        },
        {
            id: 'arctic-light',
            name: 'Arctic Light',
            description: 'Bright, airy interface with crisp sky-blue highlights.',
            icon: '❄️',
            preview: ['#2c5282', '#4299e1', '#f7fafc'],
            vars: {
                '--primary': '#2c5282',
                '--primary-light': '#4299e1',
                '--bg-main': '#f7fafc',
                '--bg-sidebar': '#ffffff',
                '--bg-card': '#ffffff',
                '--text-primary': '#2d3748',
                '--text-secondary': '#718096',
                '--border': '#e2e8f0',
                '--logo-grad-start': '#90cdf4',
                '--logo-grad-end': '#3182ce',
                '--sidebar-accent': '#4299e1',
                '--sidebar-nav-active': 'rgba(66, 153, 225, 0.12)',
                '--sidebar-text': '#4a5568',
                '--sidebar-text-muted': '#718096',
                '--sidebar-border': '#e2e8f0'
            }
        },
        {
            id: 'royal-purple',
            name: 'Royal Purple',
            description: 'Premium purple palette for executive dashboards.',
            icon: '👑',
            preview: ['#44337a', '#805ad5', '#1a1625'],
            vars: {
                '--primary': '#44337a',
                '--primary-light': '#805ad5',
                '--bg-main': '#f5f0ff',
                '--bg-sidebar': '#1a1625',
                '--bg-card': '#ffffff',
                '--text-primary': '#322659',
                '--text-secondary': '#7c6a9a',
                '--border': '#e9d8fd',
                '--logo-grad-start': '#d6bcfa',
                '--logo-grad-end': '#805ad5',
                '--sidebar-accent': '#d6bcfa',
                '--sidebar-nav-active': 'rgba(128, 90, 213, 0.25)'
            }
        }
    ];

    window.APP_THEMES = APP_THEMES;

    window.getAppThemeById = function (id) {
        return APP_THEMES.find(t => t.id === id) || APP_THEMES[0];
    };

    window.getAppLogoSvgHtml = function (size) {
        const s = size || 48;
        const uid = 'logo' + Math.random().toString(36).slice(2, 8);
        return `<svg class="app-logo-svg" width="${s}" height="${s}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <defs>
                <linearGradient id="${uid}-g" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
                    <stop stop-color="var(--logo-grad-start, #63b3ed)"/>
                    <stop offset="1" stop-color="var(--logo-grad-end, #2b6cb0)"/>
                </linearGradient>
                <linearGradient id="${uid}-g2" x1="20" y1="44" x2="48" y2="20" gradientUnits="userSpaceOnUse">
                    <stop stop-color="var(--logo-grad-end, #2b6cb0)"/>
                    <stop offset="1" stop-color="var(--logo-grad-start, #63b3ed)"/>
                </linearGradient>
            </defs>
            <circle cx="32" cy="32" r="28" fill="url(#${uid}-g)" opacity="0.18"/>
            <circle cx="32" cy="32" r="28" stroke="url(#${uid}-g)" stroke-width="1.5" opacity="0.35"/>
            <path d="M14 38c4-10 12-16 18-16s14 6 18 16" stroke="url(#${uid}-g)" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
            <rect x="16" y="30" width="32" height="14" rx="3" fill="url(#${uid}-g2)"/>
            <rect x="20" y="26" width="14" height="8" rx="2" fill="url(#${uid}-g)"/>
            <circle cx="22" cy="46" r="4" fill="#1e2a3a" stroke="url(#${uid}-g)" stroke-width="1.5"/>
            <circle cx="42" cy="46" r="4" fill="#1e2a3a" stroke="url(#${uid}-g)" stroke-width="1.5"/>
            <path d="M34 30h10l4 4v4H34V30z" fill="url(#${uid}-g)" opacity="0.9"/>
            <circle cx="48" cy="18" r="3" fill="var(--logo-grad-start, #63b3ed)"/>
            <path d="M32 18 L48 18" stroke="var(--logo-grad-start, #63b3ed)" stroke-width="1.5" stroke-dasharray="2 2" opacity="0.7"/>
        </svg>`;
    };

    window.getAppLogoBlockHtml = function (variant) {
        const compact = variant === 'compact';
        const title = (window.systemSettingsDB?.appName || 'TruckControl DRC').replace(/Truck Turnaround.*Control System/i, 'TruckControl DRC');
        const shortTitle = title.length > 22 ? 'TruckControl' : title.split(' ')[0] || 'TruckControl';
        return `<div class="app-logo ${compact ? 'app-logo-compact' : ''}">
            ${getAppLogoSvgHtml(compact ? 40 : 48)}
            <div class="app-logo-text">
                <span class="app-logo-title logo-text">${shortTitle}</span>
                <span class="app-logo-subtitle">DRC Operations</span>
            </div>
        </div>`;
    };

    window.applyAppTheme = function (themeId) {
        const theme = getAppThemeById(themeId);
        const root = document.documentElement;
        root.setAttribute('data-theme', theme.id);
        Object.entries(theme.vars).forEach(([key, val]) => root.style.setProperty(key, val));
        document.body?.classList.toggle('theme-light-sidebar', theme.id === 'arctic-light');
        return theme;
    };

    window.setAppTheme = function (themeId) {
        if (typeof canUser === 'function' && !canUser('manage_settings') && !(typeof userIsSuperAdmin === 'function' && userIsSuperAdmin())) {
            if (typeof showToast === 'function') showToast('Only administrators can change themes. Please check with your Admin.', 'warning');
            return null;
        }
        const theme = applyAppTheme(themeId);
        if (window.systemSettingsDB) {
            window.systemSettingsDB.activeTheme = theme.id;
            if (typeof persistSystemSettings === 'function') persistSystemSettings();
            if (typeof isApiAvailable === 'function' && isApiAvailable() && typeof patchSystemSettings === 'function') {
                patchSystemSettings({ activeTheme: theme.id }).catch(() => {});
            }
            if (typeof logAuditEvent === 'function') {
                logAuditEvent('Changed application theme', 'settings', 'theme', theme.name);
            }
        }
        if (typeof showToast === 'function') showToast(`Theme applied: ${theme.name}`, 'success');
        if (currentPage === 'admin-themes' && typeof renderAdminThemes === 'function') {
            const ca = document.getElementById('contentArea');
            if (ca) renderAdminThemes(ca);
        }
        return theme;
    };

    window.hydrateAppThemeFromStorage = function () {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const stored = raw ? JSON.parse(raw) : null;
            const id = stored?.activeTheme || window.systemSettingsDB?.activeTheme || 'ocean-blue';
            applyAppTheme(id);
            if (window.systemSettingsDB && !window.systemSettingsDB.activeTheme) {
                window.systemSettingsDB.activeTheme = id;
            }
        } catch {
            applyAppTheme('ocean-blue');
        }
    };

    window.refreshAppLogo = function () {
        const sidebar = document.getElementById('sidebarLogoWrap');
        const login = document.getElementById('loginLogoWrap');
        if (sidebar && typeof getAppLogoBlockHtml === 'function') {
            sidebar.innerHTML = getAppLogoBlockHtml();
        }
        if (login && typeof getAppLogoBlockHtml === 'function') {
            login.innerHTML = getAppLogoBlockHtml('compact');
        }
        const s = window.systemSettingsDB;
        if (s?.appName) {
            document.querySelectorAll('.app-logo-title.logo-text').forEach(el => {
                const name = s.appName.replace(/Truck Turnaround.*Control System/i, 'TruckControl DRC');
                el.textContent = name.length > 22 ? 'TruckControl' : (name.split('—')[0].trim().split(' ')[0] || 'TruckControl');
            });
        }
    };

    hydrateAppThemeFromStorage();
})();
