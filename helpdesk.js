/**
 * Helpdesk — users log web app issues; Super Admin / technical team manage queue with SLA KPIs
 */
(function () {
    const STORAGE_KEY = 'truckcontrol_helpdesk_v1';
    let ticketsDB = [];
    let settingsDB = {};
    let helpdeskTab = 'my';
    let helpdeskFilter = { status: 'all', priority: 'all', search: '' };

    const PRIORITIES = ['low', 'normal', 'high', 'urgent'];
    const STATUSES = ['open', 'in_progress', 'waiting', 'resolved', 'closed'];

    function saveLocal() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ tickets: ticketsDB, settings: settingsDB })); } catch (_) {}
    }

    function loadLocal() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return false;
            const data = JSON.parse(raw);
            ticketsDB = data.tickets || [];
            settingsDB = data.settings || {};
            return true;
        } catch (_) { return false; }
    }

    function defaultSettings() {
        return {
            slaByPriority: {
                urgent: { firstResponseHours: 1, resolutionHours: 4 },
                high: { firstResponseHours: 2, resolutionHours: 8 },
                normal: { firstResponseHours: 4, resolutionHours: 24 },
                low: { firstResponseHours: 8, resolutionHours: 48 }
            },
            categories: ['Bug / Error', 'Access / Permissions', 'Data Issue', 'Workflow', 'Performance', 'Feature Request', 'Other']
        };
    }

    function getSettings() {
        return { ...defaultSettings(), ...settingsDB };
    }

    window.canManageHelpdesk = function () {
        if (typeof userIsSuperAdmin === 'function' && userIsSuperAdmin()) return true;
        if (typeof canUser === 'function' && (canUser('manage_settings') || canUser('manage_users'))) return true;
        const role = typeof getCurrentRole === 'function' ? getCurrentRole() : null;
        return role?.name === 'Manager';
    };

    function getCurrentUserInfo() {
        const u = typeof getCurrentAdminUser === 'function' ? getCurrentAdminUser() : null;
        return { id: u?.id || 'local-user', username: u?.username || 'user', area: u?.area || '' };
    }

    function computeTargetResolveAt(priority, createdAt) {
        const sla = getSettings().slaByPriority[priority] || getSettings().slaByPriority.normal;
        const base = createdAt ? new Date(createdAt.replace(' ', 'T')) : new Date();
        return new Date(base.getTime() + (sla.resolutionHours || 24) * 3600000).toISOString().slice(0, 19).replace('T', ' ');
    }

    function parseDate(s) {
        if (!s) return null;
        const d = new Date(s.replace(' ', 'T'));
        return isNaN(d.getTime()) ? null : d;
    }

    function hoursBetween(from, to) {
        const a = parseDate(from);
        const b = to ? parseDate(to) : new Date();
        if (!a || !b) return 0;
        return (b - a) / 3600000;
    }

    window.getHelpdeskTicketSla = function (ticket) {
        const settings = getSettings();
        const sla = settings.slaByPriority[ticket.priority] || settings.slaByPriority.normal;
        const targetHours = sla.resolutionHours || 24;
        const elapsed = hoursBetween(ticket.createdAt, ticket.resolvedAt || ticket.closedAt);
        const targetAt = parseDate(ticket.targetResolveAt);
        const now = new Date();
        const isClosed = ['resolved', 'closed'].includes(ticket.status);
        let level = 'green';
        if (isClosed) {
            level = elapsed <= targetHours ? 'green' : 'red';
        } else if (targetAt && targetAt < now) {
            level = 'red';
        } else if (targetAt && (targetAt - now) < targetHours * 0.25 * 3600000) {
            level = 'orange';
        } else if (elapsed >= targetHours * 0.75) {
            level = 'orange';
        }
        return { level, elapsedHours: Math.round(elapsed * 10) / 10, targetHours, targetResolveAt: ticket.targetResolveAt };
    };

    function slaBadge(ticket) {
        const sla = getHelpdeskTicketSla(ticket);
        const map = { green: 'green', orange: 'orange', red: 'red' };
        const label = ['resolved', 'closed'].includes(ticket.status)
            ? `${sla.elapsedHours}h / ${sla.targetHours}h`
            : (sla.level === 'red' ? 'OVERDUE' : `${sla.elapsedHours}h elapsed`);
        return `<span class="status-badge ${map[sla.level]}">${label}</span>`;
    }

    function statusBadge(s) {
        const map = { open: 'blue', in_progress: 'orange', waiting: 'gray', resolved: 'green', closed: 'gray' };
        return `<span class="status-badge ${map[s] || 'gray'}">${(s || 'open').replace('_', ' ')}</span>`;
    }

    function priorityBadge(p) {
        const map = { urgent: 'red', high: 'orange', normal: 'blue', low: 'gray' };
        return `<span class="status-badge ${map[p] || 'gray'}">${p || 'normal'}</span>`;
    }

    window.syncHelpdeskFromApi = async function () {
        if (typeof isApiAvailable === 'function' && isApiAvailable() && typeof fetchHelpdeskBundle === 'function') {
            try {
                const bundle = await fetchHelpdeskBundle();
                ticketsDB = bundle.tickets || ticketsDB;
                if (bundle.allTickets && canManageHelpdesk()) ticketsDB = bundle.allTickets;
                settingsDB = bundle.settings || settingsDB;
                saveLocal();
                return true;
            } catch (e) { console.warn('Helpdesk API sync failed:', e.message); }
        }
        loadLocal();
        return false;
    };

    window.getHelpdeskStats = function () {
        const open = ticketsDB.filter(t => !['resolved', 'closed'].includes(t.status));
        const overdue = open.filter(t => getHelpdeskTicketSla(t).level === 'red');
        const mine = ticketsDB.filter(t => {
            const me = getCurrentUserInfo();
            return t.reporterUserId === me.id || t.reporterUsername === me.username;
        });
        return {
            total: ticketsDB.length,
            open: open.length,
            overdue: overdue.length,
            mineOpen: mine.filter(t => !['resolved', 'closed'].includes(t.status)).length
        };
    };

    function filteredTickets(list) {
        const q = (helpdeskFilter.search || '').toLowerCase();
        return list.filter(t => {
            if (helpdeskFilter.status !== 'all' && t.status !== helpdeskFilter.status) return false;
            if (helpdeskFilter.priority !== 'all' && t.priority !== helpdeskFilter.priority) return false;
            if (!q) return true;
            const hay = [t.ticketNumber, t.subject, t.description, t.reporterUsername, t.category, t.modulePage].join(' ').toLowerCase();
            return hay.includes(q);
        });
    }

    function renderTicketRows(tickets, canManage) {
        if (!tickets.length) {
            return '<tr><td colspan="10" style="text-align:center;padding:24px;color:var(--text-secondary);">No issues logged yet. Click <strong>Report Issue</strong> to create one.</td></tr>';
        }
        return tickets.map(t => `<tr>
            <td><strong>${t.ticketNumber}</strong><div style="font-size:11px;color:var(--text-secondary);">${t.createdAt?.slice(0, 10) || '—'}</div></td>
            <td>${t.subject || '—'}</td>
            <td>${t.category || '—'}</td>
            <td>${priorityBadge(t.priority)}</td>
            <td>${statusBadge(t.status)}</td>
            <td>${t.reporterUsername || '—'}</td>
            <td>${t.assigneeUsername || '—'}</td>
            <td style="font-size:12px;">${t.targetResolveAt?.slice(0, 16) || '—'}</td>
            <td>${slaBadge(t)}</td>
            <td style="white-space:nowrap;">
                <button class="btn btn-sm btn-outline" onclick="openHelpdeskTicketModal('${t.id}')">View</button>
                ${canManage ? `<button class="btn btn-sm btn-primary" onclick="quickResolveHelpdeskTicket('${t.id}')">✓</button>` : ''}
            </td>
        </tr>`).join('');
    }

    window.renderHelpdesk = async function (container) {
        await syncHelpdeskFromApi();
        const canManage = canManageHelpdesk();
        const stats = getHelpdeskStats();
        const me = getCurrentUserInfo();
        const myTickets = filteredTickets(ticketsDB.filter(t => t.reporterUserId === me.id || t.reporterUsername === me.username));
        const teamTickets = filteredTickets(ticketsDB);
        const showList = helpdeskTab === 'team' && canManage ? teamTickets : myTickets;

        container.innerHTML = `
            <div class="page-header">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;">
                    <div>
                        <h1>🎫 Helpdesk</h1>
                        <div class="breadcrumb">Communication / Report web app issues — tracked with SLA targets for the technical team</div>
                    </div>
                    <button class="btn btn-primary" onclick="openHelpdeskTicketModal()">+ Report Issue</button>
                </div>
            </div>
            <div class="kpi-grid" style="margin-bottom:20px;">
                <div class="kpi-card blue"><div class="kpi-card-value">${stats.mineOpen}</div><div class="kpi-card-label">My Open Issues</div></div>
                ${canManage ? `<div class="kpi-card orange"><div class="kpi-card-value">${stats.open}</div><div class="kpi-card-label">Team Open Queue</div></div>
                <div class="kpi-card red"><div class="kpi-card-value">${stats.overdue}</div><div class="kpi-card-label">Overdue (past target)</div></div>` : ''}
                <div class="kpi-card green"><div class="kpi-card-value">${ticketsDB.filter(t => ['resolved','closed'].includes(t.status)).length}</div><div class="kpi-card-label">Resolved</div></div>
            </div>
            <div class="filters-bar" style="margin-bottom:16px;">
                ${canManage ? `<button class="btn ${helpdeskTab === 'my' ? 'btn-primary' : 'btn-outline'}" onclick="setHelpdeskTab('my')">My Issues</button>
                <button class="btn ${helpdeskTab === 'team' ? 'btn-primary' : 'btn-outline'}" onclick="setHelpdeskTab('team')">Team Queue</button>
                <button class="btn btn-outline" onclick="navigateToAdmin('admin-helpdesk-settings')">⚙️ SLA Settings</button>` : ''}
                <select class="form-control" style="width:140px;" onchange="helpdeskSetFilter('status', this.value); refreshHelpdeskPage()">
                    <option value="all">All status</option>
                    ${STATUSES.map(s => `<option value="${s}"${helpdeskFilter.status === s ? ' selected' : ''}>${s.replace('_', ' ')}</option>`).join('')}
                </select>
                <select class="form-control" style="width:130px;" onchange="helpdeskSetFilter('priority', this.value); refreshHelpdeskPage()">
                    <option value="all">All priority</option>
                    ${PRIORITIES.map(p => `<option value="${p}"${helpdeskFilter.priority === p ? ' selected' : ''}>${p}</option>`).join('')}
                </select>
                <input type="text" class="form-control" placeholder="Search tickets..." style="flex:1;min-width:180px;" value="${helpdeskFilter.search}" oninput="helpdeskSetFilter('search', this.value); refreshHelpdeskPage()">
            </div>
            <div class="table-container">
                <div class="table-header"><h3>${helpdeskTab === 'team' && canManage ? 'Team Issue Queue' : 'My Reported Issues'} (${showList.length})</h3></div>
                <table class="data-table" style="min-width:1100px;">
                    <thead><tr>
                        <th>Ticket</th><th>Subject</th><th>Category</th><th>Priority</th><th>Status</th>
                        <th>Reporter</th><th>Assignee</th><th>Target Resolve</th><th>SLA / KPI</th><th></th>
                    </tr></thead>
                    <tbody>${renderTicketRows(showList, canManage)}</tbody>
                </table>
            </div>`;
    };

    window.setHelpdeskTab = function (tab) {
        helpdeskTab = tab;
        refreshHelpdeskPage();
    };

    window.helpdeskSetFilter = function (key, val) {
        helpdeskFilter[key] = val;
    };

    window.refreshHelpdeskPage = function () {
        const ca = document.getElementById('contentArea');
        if (currentPage === 'helpdesk' && ca) renderHelpdesk(ca);
        if (typeof updateSidebarBadges === 'function') updateSidebarBadges();
    };

    window.openHelpdeskTicketModal = function (ticketId) {
        const t = ticketId ? ticketsDB.find(x => x.id === ticketId) : null;
        const me = getCurrentUserInfo();
        const canManage = canManageHelpdesk();
        const settings = getSettings();
        const users = typeof adminUsersDB !== 'undefined' ? adminUsersDB.filter(u => u.status === 'active') : [];

        document.getElementById('helpdeskModalTitle').textContent = t ? `${t.ticketNumber} — ${t.subject}` : 'Report New Issue';
        document.getElementById('helpdeskFormId').value = t?.id || '';
        document.getElementById('helpdeskFormSubject').value = t?.subject || '';
        document.getElementById('helpdeskFormDescription').value = t?.description || '';
        document.getElementById('helpdeskFormCategory').innerHTML = settings.categories.map(c =>
            `<option value="${c}"${t?.category === c ? ' selected' : ''}>${c}</option>`
        ).join('');
        document.getElementById('helpdeskFormPriority').value = t?.priority || 'normal';
        document.getElementById('helpdeskFormStatus').value = t?.status || 'open';
        document.getElementById('helpdeskFormModule').value = t?.modulePage || (typeof currentPage !== 'undefined' ? currentPage : '');
        document.getElementById('helpdeskFormArea').value = t?.area || me.area || '';
        document.getElementById('helpdeskFormBrowser').value = t?.browserInfo || navigator.userAgent.slice(0, 200);

        const statusRow = document.getElementById('helpdeskStatusRow');
        const assignRow = document.getElementById('helpdeskAssignRow');
        if (statusRow) statusRow.style.display = t && canManage ? 'block' : 'none';
        if (assignRow) assignRow.style.display = t && canManage ? 'block' : 'none';
        const assignSel = document.getElementById('helpdeskFormAssignee');
        if (assignSel) {
            assignSel.innerHTML = `<option value="">— Unassigned —</option>${users.map(u =>
                `<option value="${u.id}" data-name="${u.username}"${t?.assigneeUserId === u.id ? ' selected' : ''}>${u.username}</option>`
            ).join('')}`;
        }

        const commentsEl = document.getElementById('helpdeskCommentsBody');
        const comments = (t?.comments || []).filter(c => canManage || !c.isInternal);
        if (commentsEl) {
            commentsEl.innerHTML = comments.length ? comments.map(c => `
                <div style="margin-bottom:10px;padding:10px;background:${c.isInternal ? '#fffaf0' : '#f7fafc'};border-radius:8px;border:1px solid var(--border);">
                    <div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px;">
                        <strong>${c.authorUsername || '—'}</strong> · ${c.createdAt || ''}${c.isInternal ? ' · <em>Internal note</em>' : ''}
                    </div>
                    <div style="font-size:13px;white-space:pre-wrap;">${c.body || ''}</div>
                </div>`).join('') : '<p style="color:var(--text-secondary);font-size:13px;">No comments yet.</p>';
        }

        const slaEl = document.getElementById('helpdeskSlaInfo');
        if (slaEl && t) {
            const sla = getHelpdeskTicketSla(t);
            slaEl.innerHTML = `Logged: <strong>${t.createdAt || '—'}</strong> · Target resolve: <strong>${t.targetResolveAt || '—'}</strong> · SLA: ${slaBadge(t)}`;
            slaEl.style.display = 'block';
        } else if (slaEl) slaEl.style.display = 'none';

        document.getElementById('helpdeskCommentBox').value = '';
        document.getElementById('helpdeskInternalNote').checked = false;
        openModal('helpdeskModal');
    };

    window.submitHelpdeskTicketForm = async function () {
        const me = getCurrentUserInfo();
        const id = document.getElementById('helpdeskFormId')?.value;
        const priority = document.getElementById('helpdeskFormPriority')?.value || 'normal';
        const assignSel = document.getElementById('helpdeskFormAssignee');
        const assignOpt = assignSel?.selectedOptions?.[0];
        const payload = {
            id: id || undefined,
            subject: document.getElementById('helpdeskFormSubject')?.value.trim(),
            description: document.getElementById('helpdeskFormDescription')?.value.trim(),
            category: document.getElementById('helpdeskFormCategory')?.value,
            priority,
            status: document.getElementById('helpdeskFormStatus')?.value || 'open',
            modulePage: document.getElementById('helpdeskFormModule')?.value.trim(),
            area: document.getElementById('helpdeskFormArea')?.value.trim(),
            browserInfo: document.getElementById('helpdeskFormBrowser')?.value.trim(),
            reporterUserId: me.id,
            reporterUsername: me.username,
            assigneeUserId: assignOpt?.value || null,
            assigneeUsername: assignOpt?.dataset?.name || null,
            targetResolveAt: id ? undefined : computeTargetResolveAt(priority)
        };
        if (!payload.subject) { showToast('Subject is required', 'warning'); return; }
        try {
            let saved = null;
            if (typeof saveHelpdeskTicketApi === 'function' && typeof isApiAvailable === 'function' && isApiAvailable()) {
                saved = await saveHelpdeskTicketApi(payload);
            }
            if (saved) {
                const idx = ticketsDB.findIndex(x => x.id === saved.id);
                if (idx >= 0) ticketsDB[idx] = saved; else ticketsDB.unshift(saved);
            } else {
                payload.id = payload.id || `HDT-${Date.now()}`;
                payload.ticketNumber = payload.ticketNumber || `HD-${10000 + ticketsDB.length + 1}`;
                payload.createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
                payload.comments = [];
                const idx = ticketsDB.findIndex(x => x.id === payload.id);
                if (idx >= 0) ticketsDB[idx] = { ...ticketsDB[idx], ...payload };
                else ticketsDB.unshift(payload);
            }
            saveLocal();
            closeModal('helpdeskModal');
            showToast(id ? 'Issue updated' : 'Issue logged — technical team notified', 'success');
            refreshHelpdeskPage();
        } catch (e) { showToast(e.message, 'error'); }
    };

    window.submitHelpdeskComment = async function () {
        const ticketId = document.getElementById('helpdeskFormId')?.value;
        const body = document.getElementById('helpdeskCommentBox')?.value.trim();
        if (!ticketId || !body) { showToast('Enter a comment', 'warning'); return; }
        const isInternal = document.getElementById('helpdeskInternalNote')?.checked;
        try {
            if (typeof addHelpdeskCommentApi === 'function' && typeof isApiAvailable === 'function' && isApiAvailable()) {
                const result = await addHelpdeskCommentApi(ticketId, { body, isInternal });
                if (result?.ticket) {
                    const idx = ticketsDB.findIndex(x => x.id === ticketId);
                    if (idx >= 0) ticketsDB[idx] = result.ticket;
                }
            } else {
                const t = ticketsDB.find(x => x.id === ticketId);
                if (t) {
                    t.comments = t.comments || [];
                    t.comments.push({
                        id: Date.now(), ticketId, body, isInternal,
                        authorUsername: getCurrentUserInfo().username,
                        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
                    });
                }
            }
            saveLocal();
            openHelpdeskTicketModal(ticketId);
            showToast('Comment added', 'success');
        } catch (e) { showToast(e.message, 'error'); }
    };

    window.quickResolveHelpdeskTicket = async function (ticketId) {
        if (!canManageHelpdesk()) return;
        const payload = { id: ticketId, status: 'resolved', resolvedAt: new Date().toISOString().slice(0, 19).replace('T', ' ') };
        try {
            if (typeof saveHelpdeskTicketApi === 'function' && isApiAvailable()) await saveHelpdeskTicketApi(payload);
            const idx = ticketsDB.findIndex(x => x.id === ticketId);
            if (idx >= 0) ticketsDB[idx] = { ...ticketsDB[idx], ...payload };
            saveLocal();
            showToast('Issue marked resolved', 'success');
            refreshHelpdeskPage();
        } catch (e) { showToast(e.message, 'error'); }
    };

    window.renderAdminHelpdeskSettings = function (container) {
        if (typeof canAccessAdminPage === 'function' && !canAccessAdminPage('admin-helpdesk-settings')) {
            container.innerHTML = `<div class="access-denied"><h2>Access Denied</h2><p>Helpdesk SLA settings require Manager or Super Admin privileges.</p></div>`;
            return;
        }
        const s = getSettings();
        const priRows = PRIORITIES.map(p => {
            const sla = s.slaByPriority[p] || {};
            return `<tr>
                <td><strong>${p}</strong></td>
                <td><input type="number" class="form-control kpi-input" id="hdSlaResp_${p}" value="${sla.firstResponseHours ?? 4}" min="1"></td>
                <td><input type="number" class="form-control kpi-input" id="hdSlaRes_${p}" value="${sla.resolutionHours ?? 24}" min="1"></td>
            </tr>`;
        }).join('');

        container.innerHTML = `
            ${typeof renderAdminBreadcrumb === 'function' ? renderAdminBreadcrumb('Helpdesk SLA Settings') : ''}
            <div class="page-header admin-page-header">
                <div>
                    <h1>🎫 Helpdesk SLA & KPI Targets</h1>
                    <p class="page-subtitle">Set target response and resolution times per priority. Tickets show green / orange / red KPI based on logged date vs target.</p>
                </div>
            </div>
            <div class="settings-card">
                <h3>Resolution SLA by priority (hours)</h3>
                <table class="data-table kpi-settings-table">
                    <thead><tr><th>Priority</th><th>First Response (hrs)</th><th>Resolution Target (hrs)</th></tr></thead>
                    <tbody>${priRows}</tbody>
                </table>
                <div style="margin-top:16px;">
                    <button class="btn btn-primary" onclick="saveHelpdeskSettingsAdmin()">💾 Save SLA Settings</button>
                </div>
            </div>
            <div class="rbac-info-banner" style="margin-top:16px;">
                <strong>KPI rules:</strong> Green = within target · Orange = approaching deadline · Red = past target resolve time.
                Configure global helpdesk KPIs also under <a href="#" onclick="event.preventDefault();navigateToAdmin('admin-kpi-settings')">Admin → KPI Settings</a>.
            </div>`;
    };

    window.saveHelpdeskSettingsAdmin = async function () {
        const slaByPriority = {};
        PRIORITIES.forEach(p => {
            slaByPriority[p] = {
                firstResponseHours: parseInt(document.getElementById(`hdSlaResp_${p}`)?.value, 10) || 4,
                resolutionHours: parseInt(document.getElementById(`hdSlaRes_${p}`)?.value, 10) || 24
            };
        });
        settingsDB = { ...getSettings(), slaByPriority };
        saveLocal();
        try {
            if (typeof saveHelpdeskSettingsApi === 'function' && isApiAvailable()) {
                await saveHelpdeskSettingsApi({ slaByPriority });
            }
        } catch (e) { console.warn(e.message); }
        if (typeof logAuditEvent === 'function') logAuditEvent('Updated Helpdesk SLA settings', 'helpdesk', 'settings');
        showToast('Helpdesk SLA settings saved', 'success');
    };

    if (!loadLocal()) settingsDB = defaultSettings();
})();
