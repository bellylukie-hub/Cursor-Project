/**
 * TruckControl — system language (EN / FR / PT)
 */
(function () {
    const STORAGE_KEY = 'truckcontrol_lang';

    const STRINGS = {
        en: {
            'app.name': 'TruckControl',
            'nav.dashboard': 'Dashboard',
            'nav.nb-operations': 'NB Operations',
            'nav.sb-operations': 'SB Operations',
            'nav.border-clearance': 'Border Clearance',
            'nav.pod-management': 'POD Management',
            'nav.area-browser': 'Area Trucks',
            'nav.communication-matrix': 'Communication Matrix',
            'nav.driver-registry': 'Driver Registry',
            'nav.internal-communication': 'Internal Communication',
            'nav.helpdesk': 'Helpdesk',
            'nav.assets': 'Assets & Equipment',
            'nav.client-orders': 'Client Orders',
            'nav.clients': 'Clients',
            'nav.route-catalog': 'Route Catalog',
            'nav.trip-scheduler': 'Trip Scheduler',
            'nav.fleet-registry': 'Fleet Registry',
            'nav.runner-fees': 'Runner Fees',
            'nav.reports': 'Reports',
            'nav.turnarounds': 'Turnarounds',
            'nav.fleet-map': 'Fleet Map',
            'nav.position-live': 'Position Live',
            'nav.admin-users': 'Manage Users',
            'nav.admin-settings': 'System Settings',
            'nav.admin-themes': 'Themes',
            'nav.admin-kpi-settings': 'KPI Settings',
            'nav.reports.team-kpi': 'Team KPI Achievement',
            'login.title': 'Sign in',
            'login.sub': 'Use your username or email to access the console.',
            'login.username': 'Username or email',
            'login.password': 'Password',
            'login.submit': 'Sign in',
            'login.demo': 'Demo login',
            'login.demoOffline': 'Or open ?demo=1 for instant offline preview (no sign-in).',
            'search.placeholder': 'Search trucks, trips, orders...',
            'lang.label': 'Language',
            'common.send': 'Send',
            'common.saveDraft': 'Save Draft',
            'common.discard': 'Discard',
            'common.back': 'Back to Dashboard',
            'common.print': 'Print',
            'common.exportPdf': 'Export PDF',
            'common.exportCsv': 'Export CSV',
            'comm.email': 'Email',
            'comm.chat': 'Chat',
            'comm.to': 'To',
            'comm.cc': 'CC',
            'comm.bcc': 'BCC',
            'comm.subject': 'Subject',
            'comm.message': 'Message',
            'comm.quickAdd': 'System users — click to add to To:',
            'comm.typeMessage': 'Type a message',
            'comm.newChat': 'New chat',
            'comm.newGroup': 'New group',
            'comm.colleagues': 'colleague(s) available for email & chat',
            'comm.refreshContacts': 'Refresh contacts',
            'settings.language': 'System language',
            'settings.languageHint': 'Applies to menus, buttons, and main screens for your session.'
        },
        fr: {
            'app.name': 'TruckControl',
            'nav.dashboard': 'Tableau de bord',
            'nav.nb-operations': 'Opérations NB',
            'nav.sb-operations': 'Opérations SB',
            'nav.border-clearance': 'Douane',
            'nav.pod-management': 'Gestion POD',
            'nav.area-browser': 'Camions par zone',
            'nav.communication-matrix': 'Matrice de communication',
            'nav.driver-registry': 'Registre chauffeurs',
            'nav.internal-communication': 'Communication interne',
            'nav.helpdesk': 'Helpdesk',
            'nav.assets': 'Actifs & équipements',
            'nav.client-orders': 'Commandes clients',
            'nav.clients': 'Clients',
            'nav.route-catalog': 'Catalogue des routes',
            'nav.trip-scheduler': 'Planificateur de trajets',
            'nav.fleet-registry': 'Registre flotte',
            'nav.runner-fees': 'Frais runners',
            'nav.reports': 'Rapports',
            'nav.turnarounds': 'Turnarounds',
            'nav.fleet-map': 'Carte flotte',
            'nav.position-live': 'Position en direct',
            'nav.admin-users': 'Gérer les utilisateurs',
            'nav.admin-settings': 'Paramètres système',
            'nav.admin-themes': 'Thèmes',
            'nav.admin-kpi-settings': 'Paramètres KPI',
            'nav.reports.team-kpi': 'Performance KPI par équipe',
            'login.title': 'Connexion',
            'login.sub': 'Utilisez votre identifiant ou e-mail pour accéder à la console.',
            'login.username': 'Identifiant ou e-mail',
            'login.password': 'Mot de passe',
            'login.submit': 'Se connecter',
            'login.demo': 'Connexion démo',
            'login.demoOffline': 'Ou ouvrez ?demo=1 pour un aperçu hors ligne instantané.',
            'search.placeholder': 'Rechercher camions, trajets, commandes...',
            'lang.label': 'Langue',
            'common.send': 'Envoyer',
            'common.saveDraft': 'Enregistrer brouillon',
            'common.discard': 'Abandonner',
            'common.back': 'Retour au tableau de bord',
            'common.print': 'Imprimer',
            'common.exportPdf': 'Exporter PDF',
            'common.exportCsv': 'Exporter CSV',
            'comm.email': 'E-mail',
            'comm.chat': 'Chat',
            'comm.to': 'À',
            'comm.cc': 'CC',
            'comm.bcc': 'BCC',
            'comm.subject': 'Sujet',
            'comm.message': 'Message',
            'comm.quickAdd': 'Utilisateurs — cliquer pour ajouter à À :',
            'comm.typeMessage': 'Tapez un message',
            'comm.newChat': 'Nouveau chat',
            'comm.newGroup': 'Nouveau groupe',
            'comm.colleagues': 'collègue(s) disponibles pour e-mail et chat',
            'comm.refreshContacts': 'Actualiser contacts',
            'settings.language': 'Langue du système',
            'settings.languageHint': 'S\'applique aux menus, boutons et écrans principaux.'
        },
        pt: {
            'app.name': 'TruckControl',
            'nav.dashboard': 'Painel',
            'nav.nb-operations': 'Operações NB',
            'nav.sb-operations': 'Operações SB',
            'nav.border-clearance': 'Desalfandegamento',
            'nav.pod-management': 'Gestão POD',
            'nav.area-browser': 'Camiões por área',
            'nav.communication-matrix': 'Matriz de comunicação',
            'nav.driver-registry': 'Registo de motoristas',
            'nav.internal-communication': 'Comunicação interna',
            'nav.helpdesk': 'Helpdesk',
            'nav.assets': 'Ativos & equipamentos',
            'nav.client-orders': 'Pedidos de clientes',
            'nav.clients': 'Clientes',
            'nav.route-catalog': 'Catálogo de rotas',
            'nav.trip-scheduler': 'Agendador de viagens',
            'nav.fleet-registry': 'Registo de frota',
            'nav.runner-fees': 'Taxas runner',
            'nav.reports': 'Relatórios',
            'nav.turnarounds': 'Turnarounds',
            'nav.fleet-map': 'Mapa da frota',
            'nav.position-live': 'Posição ao vivo',
            'nav.admin-users': 'Gerir utilizadores',
            'nav.admin-settings': 'Configurações do sistema',
            'nav.admin-themes': 'Temas',
            'nav.admin-kpi-settings': 'Configurações KPI',
            'nav.reports.team-kpi': 'Desempenho KPI da equipa',
            'login.title': 'Entrar',
            'login.sub': 'Use o seu utilizador ou e-mail para aceder à consola.',
            'login.username': 'Utilizador ou e-mail',
            'login.password': 'Senha',
            'login.submit': 'Entrar',
            'login.demo': 'Login demo',
            'login.demoOffline': 'Ou abra ?demo=1 para pré-visualização offline instantânea.',
            'search.placeholder': 'Pesquisar camiões, viagens, pedidos...',
            'lang.label': 'Idioma',
            'common.send': 'Enviar',
            'common.saveDraft': 'Guardar rascunho',
            'common.discard': 'Descartar',
            'common.back': 'Voltar ao painel',
            'common.print': 'Imprimir',
            'common.exportPdf': 'Exportar PDF',
            'common.exportCsv': 'Exportar CSV',
            'comm.email': 'E-mail',
            'comm.chat': 'Chat',
            'comm.to': 'Para',
            'comm.cc': 'CC',
            'comm.bcc': 'BCC',
            'comm.subject': 'Assunto',
            'comm.message': 'Mensagem',
            'comm.quickAdd': 'Utilizadores — clique para adicionar a Para:',
            'comm.typeMessage': 'Digite uma mensagem',
            'comm.newChat': 'Nova conversa',
            'comm.newGroup': 'Novo grupo',
            'comm.colleagues': 'colega(s) disponíveis para e-mail e chat',
            'comm.refreshContacts': 'Atualizar contactos',
            'settings.language': 'Idioma do sistema',
            'settings.languageHint': 'Aplica-se a menus, botões e telas principais.'
        }
    };

    let currentLang = 'en';

    function normalizeLang(code) {
        const c = String(code || 'en').toLowerCase().slice(0, 2);
        return STRINGS[c] ? c : 'en';
    }

    function loadLang() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) return normalizeLang(stored);
            if (window.systemSettingsDB?.language) return normalizeLang(window.systemSettingsDB.language);
        } catch (_) {}
        return 'en';
    }

    currentLang = loadLang();

    window.t = function (key) {
        const pack = STRINGS[currentLang] || STRINGS.en;
        return pack[key] || STRINGS.en[key] || key;
    };

    window.getAppLanguage = function () { return currentLang; };

    window.setAppLanguage = function (lang, silent) {
        currentLang = normalizeLang(lang);
        try { localStorage.setItem(STORAGE_KEY, currentLang); } catch (_) {}
        if (window.systemSettingsDB) window.systemSettingsDB.language = currentLang;
        const sel = document.getElementById('languageSelect');
        if (sel) sel.value = currentLang;
        applyI18n();
        if (!silent && typeof showToast === 'function') {
            showToast(`Language: ${currentLang === 'fr' ? 'Français' : currentLang === 'pt' ? 'Português' : 'English'}`, 'success');
        }
        if (typeof currentPage !== 'undefined' && typeof navigateTo === 'function') {
            navigateTo(currentPage);
        }
    };

    function setText(el, text) {
        if (!el || !text) return;
        el.textContent = text;
    }

    window.applyI18n = function () {
        currentLang = loadLang();
        const sel = document.getElementById('languageSelect');
        if (sel) sel.value = currentLang;

        document.querySelectorAll('.nav-item[data-page]').forEach(a => {
            const page = a.dataset.page;
            const label = t(`nav.${page}`);
            if (!label || label === `nav.${page}`) return;
            const icon = a.querySelector('.icon');
            const badge = a.querySelector('.badge');
            const parts = [];
            if (icon) parts.push(icon.outerHTML);
            parts.push(label);
            if (badge) parts.push(badge.outerHTML);
            a.innerHTML = parts.join(' ');
        });

        setText(document.querySelector('.login-panel h1'), t('login.title'));
        const loginSub = document.querySelector('.login-panel .login-sub');
        if (loginSub) loginSub.textContent = t('login.sub');
        const loginUserLbl = document.querySelector('#loginUsername')?.closest('.form-group')?.querySelector('label');
        if (loginUserLbl) loginUserLbl.textContent = t('login.username');
        const loginPassLbl = document.querySelector('#loginPassword')?.closest('.form-group')?.querySelector('label');
        if (loginPassLbl) loginPassLbl.textContent = t('login.password');
        const loginBtn = document.getElementById('loginSubmitBtn');
        if (loginBtn && !loginBtn.disabled) loginBtn.textContent = t('login.submit');
        const search = document.getElementById('globalSearch');
        if (search) search.placeholder = t('search.placeholder');

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            const val = t(key);
            if (val && val !== key) el.textContent = val;
        });

        document.documentElement.lang = currentLang;
    };

    document.addEventListener('DOMContentLoaded', () => {
        applyI18n();
    });
})();
