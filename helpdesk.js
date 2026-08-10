/**
 * Helpdesk — users log web app issues; Super Admin / technical team manage queue with SLA KPIs
 */
(function () {
    const STORAGE_KEY = 'truckcontrol_helpdesk_v1';
    let myTicketsDB = [];
    let teamTicketsDB = [];
    let settingsDB = {};
    let helpdeskTab = 'my';
    let helpdeskFilter = { status: 'all', priority: 'all', search: '' };

    const PRIORITIES = ['low', 'normal', 'high', 'urgent'];
    const STATUSES = ['open', 'in_progress', 'waiting', 'resolved', 'closed'];

    function escapeHtml(str) {
        return String(str ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function saveLocal() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                myTickets: myTicketsDB,
                teamTickets: canManageHelpdesk() ? teamTicketsDB : [],
                settings: settingsDB
            }));
        } catch (_) {}
    }

    function loadLocal() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return false;
            const data = JSON.parse(raw);
            myTicketsDB = data.myTickets || data.tickets || [];
            teamTicketsDB = data.teamTickets || [];
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

    function computeTargetResolveAt(priority, createdAt) {
        const sla = getSettings().slaByPriority[priority] || getSettings().slaByPriority.normal;
        const base = createdAt ? new Date(createdAt.replace(' ', 'T')) : new Date();
        return new Date(base.getTime() + (sla.resolutionHours || 24) * 3600000).toISOString().slice(0, 19).replace('T', ' ');
    }

    function computeTargetFirstResponseAt(priority, createdAt) {
        const sla = getSettings().slaByPriority[priority] || getSettings().slaByPriority.normal;
        const base = createdAt ? new Date(createdAt.replace(' ', 'T')) : new Date();
        return new Date(base.getTime() + (sla.firstResponseHours || 4) * 3600000).toISOString().slice(0, 19).replace('T', ' ');
    }

    function slaLevel(elapsedHours, targetHours, targetAt, isDone, doneWithinTarget) {
        if (isDone) return doneWithinTarget ? 'green' : 'red';
        const now = new Date();
        const target = parseDate(targetAt);
        if (target && target < now) return 'red';
        if (target && (target - now) < targetHours * 0.25 * 3600000) return 'orange';
        if (elapsedHours >= targetHours * 0.75) return 'orange';
        return 'green';
    }

    window.getHelpdeskTicketSla = function (ticket) {
        const settings = getSettings();
        const sla = settings.slaByPriority[ticket.priority] || settings.slaByPriority.normal;
        const resolutionTargetHours = sla.resolutionHours || 24;
        const firstResponseTargetHours = sla.firstResponseHours || 4;
        const resolutionElapsed = hoursBetween(ticket.createdAt, ticket.resolvedAt || ticket.closedAt);
        const firstResponseElapsed = hoursBetween(ticket.createdAt, ticket.firstResponseAt);
        const isClosed = ['resolved', 'closed'].includes(ticket.status);
        const targetResolveAt = ticket.targetResolveAt || computeTargetResolveAt(ticket.priority, ticket.createdAt);
        const targetFirstResponseAt = ticket.targetFirstResponseAt || computeTargetFirstResponseAt(ticket.priority, ticket.createdAt);

        const resolution = {
            level: slaLevel(
                isClosed ? resolutionElapsed : hoursBetween(ticket.createdAt),
                resolutionTargetHours,
                targetResolveAt,
                isClosed,
                resolutionElapsed <= resolutionTargetHours
            ),
            elapsedHours: Math.round((isClosed ? resolutionElapsed : hoursBetween(ticket.createdAt)) * 10) / 10,
            targetHours: resolutionTargetHours,
            targetAt: targetResolveAt
        };

        const firstResponse = {
            level: ticket.firstResponseAt
                ? (firstResponseElapsed <= firstResponseTargetHours ? 'green' : 'red')
                : slaLevel(hoursBetween(ticket.createdAt), firstResponseTargetHours, targetFirstResponseAt, false, false),
            elapsedHours: Math.round((ticket.firstResponseAt ? firstResponseElapsed : hoursBetween(ticket.createdAt)) * 10) / 10,
            targetHours: firstResponseTargetHours,
            targetAt: targetFirstResponseAt,
            metAt: ticket.firstResponseAt || null
        };

        const level = [resolution.level, firstResponse.level].includes('red') ? 'red'
            : [resolution.level, firstResponse.level].includes('orange') ? 'orange' : 'green';

        return { level, resolution, firstResponse, targetResolveAt, targetFirstResponseAt };
    };

    function slaBadge(ticket, type) {
        const sla = getHelpdeskTicketSla(ticket);
        const part = type === 'response' ? sla.firstResponse : sla.resolution;
        const map = { green: 'green', orange: 'orange', red: 'red' };
        let label;
        if (type === 'response') {
            label = part.metAt
                ? `${part.elapsedHours}h response`
                : (part.level === 'red' ? 'NO RESPONSE' : `${part.elapsedHours}h wait`);
        } else {
            label = ['resolved', 'closed'].includes(ticket.status)
                ? `${part.elapsedHours}h / ${part.targetHours}h`
                : (part.level === 'red' ? 'OVERDUE' : `${part.elapsedHours}h elapsed`);
        }
        return `<span class="status-badge ${map[part.level]}" title="${type === 'response' ? 'First response SLA' : 'Resolution SLA'}">${label}</span>`;
    }

    function formatDateTime(s) {
        if (!s) return '—';
        return s.length >= 16 ? s.slice(0, 16) : s;
    }

    function statusBadge(s) {
        const map = { open: 'blue', in_progress: 'orange', waiting: 'gray', resolved: 'green', closed: 'gray' };
        return `<span class="status-badge ${map[s] || 'gray'}">${(s || 'open').replace('_', ' ')}</span>`;
    }

    function priorityBadge(p) {
        const map = { urgent: 'red', high: 'orange', normal: 'blue', low: 'gray' };
        return `<span class="status-badge ${map[p] || 'gray'}">${p || 'normal'}</span>`;
    }

    function mergeTicketLists(primary, secondary) {
        const map = new Map();
        [...primary, ...secondary].forEach(t => { if (t?.id) map.set(t.id, t); });
        return Array.from(map.values()).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    }

    function activeTicketsDB() {
        return canManageHelpdesk() && helpdeskTab === 'team' ? teamTicketsDB : myTicketsDB;
    }

    window.syncHelpdeskFromApi = async function () {
        if (typeof isApiAvailable === 'function' && isApiAvailable() && typeof fetchHelpdeskBundle === 'function') {
            try {
                const bundle = await fetchHelpdeskBundle();
                myTicketsDB = (bundle.tickets || []).slice();
                if (bundle.allTickets && canManageHelpdesk()) teamTicketsDB = bundle.allTickets.slice();
                if (bundle.settings) settingsDB = bundle.settings;
                saveLocal();
                return true;
            } catch (e) { console.warn('Helpdesk API sync failed:', e.message); }
        }
        loadLocal();
        return false;
    };

    window.getHelpdeskStats = function () {
        const source = canManageHelpdesk() ? teamTicketsDB : myTicketsDB;
        const open = source.filter(t => !['resolved', 'closed'].includes(t.status));
        const overdue = open.filter(t => getHelpdeskTicketSla(t).level === 'red');
        const me = getCurrentUserInfo();
        const mine = myTicketsDB.filter(t => t.reporterUserId === me.id || t.reporterUsername === me.username);
        return {
            total: source.length,
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

    function findTicket(id) {
        return myTicketsDB.find(x => x.id === id) || teamTicketsDB.find(x => x.id === id) || null;
    }

    function upsertLocalTicket(saved) {
        if (!saved?.id) return;
        const lists = [myTicketsDB];
        if (canManageHelpdesk()) lists.push(teamTicketsDB);
        lists.forEach(list => {
            const idx = list.findIndex(x => x.id === saved.id);
            if (idx >= 0) list[idx] = saved;
            else if (list === myTicketsDB) list.unshift(saved);
            else if (canManageHelpdesk()) list.unshift(saved);
        });
    }

    function renderTicketRows(tickets, canManage) {
        if (!tickets.length) {
            return '<tr><td colspan="12" style="text-align:center;padding:24px;color:var(--text-secondary);">No issues logged yet. Click <strong>Report Issue</strong> to create one.</td></tr>';
        }
        return tickets.map(t => `<tr>
            <td><strong>${escapeHtml(t.ticketNumber)}</strong></td>
            <td>${escapeHtml(t.subject || '—')}</td>
            <td>${escapeHtml(t.category || '—')}</td>
            <td>${priorityBadge(t.priority)}</td>
            <td>${statusBadge(t.status)}</td>
            <td>${escapeHtml(t.reporterUsername || '—')}</td>
            <td>${escapeHtml(t.assigneeUsername || '—')}</td>
            <td style="font-size:12px;white-space:nowrap;">${formatDateTime(t.createdAt)}</td>
            <td style="font-size:12px;white-space:nowrap;">${formatDateTime(t.targetResolveAt)}</td>
            <td style="font-size:12px;white-space:nowrap;">${t.firstResponseAt ? formatDateTime(t.firstResponseAt) : formatDateTime(t.targetFirstResponseAt)}</td>
            <td style="white-space:nowrap;">${slaBadge(t, 'response')} ${slaBadge(t, 'resolution')}</td>
            <td style="white-space:nowrap;">
                <button class="btn btn-sm btn-outline" onclick="openHelpdeskTicketModal('${escapeHtml(t.id)}')">View</button>
                ${canManage ? `<button class="btn btn-sm btn-primary" onclick="quickResolveHelpdeskTicket('${escapeHtml(t.id)}')">✓</button>` : ''}
            </td>
        </tr>`).join('');
    }

    window.renderHelpdesk = async function (container) {
        await syncHelpdeskFromApi();
        const canManage = canManageHelpdesk();
        const stats = getHelpdeskStats();
        const me = getCurrentUserInfo();
        const myTickets = filteredTickets(myTicketsDB.filter(t => t.reporterUserId === me.id || t.reporterUsername === me.username));
        const teamTickets = filteredTickets(teamTicketsDB);
        const showList = helpdeskTab === 'team' && canManage ? teamTickets : myTickets;

        container.innerHTML = `
            <div class="page-header">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;">
                    <div>
                        <h1>🎫 Helpdesk</h1>
                        <div class="breadcrumb">Communication / Report web app issues — logged date, target resolve time, and SLA KPI for the technical team</div>
                    </div>
                    <button class="btn btn-primary" onclick="openHelpdeskTicketModal()">+ Report Issue</button>
                </div>
            </div>
            <div class="kpi-grid" style="margin-bottom:20px;">
                <div class="kpi-card blue"><div class="kpi-card-value">${stats.mineOpen}</div><div class="kpi-card-label">My Open Issues</div></div>
                ${canManage ? `<div class="kpi-card orange"><div class="kpi-card-value">${stats.open}</div><div class="kpi-card-label">Team Open Queue</div></div>
                <div class="kpi-card red"><div class="kpi-card-value">${stats.overdue}</div><div class="kpi-card-label">Overdue (past SLA)</div></div>` : ''}
                <div class="kpi-card green"><div class="kpi-card-value">${(canManage ? teamTicketsDB : myTicketsDB).filter(t => ['resolved','closed'].includes(t.status)).length}</div><div class="kpi-card-label">Resolved</div></div>
            </div>
            <div class="filters-bar" style="margin-bottom:16px;">
                ${canManage ? `<button class="btn ${helpdeskTab === 'my' ? 'btn-primary' : 'btn-outline'}" onclick="setHelpdeskTab('my')">My Issues</button>
                <button class="btn ${helpdeskTab === 'team' ? 'btn-primary' : 'btn-outline'}" onclick="setHelpdeskTab('team')">Team Queue (${teamTickets.length})</button>
                <button class="btn btn-outline" onclick="navigateToAdmin('admin-helpdesk-settings')">⚙️ SLA Settings</button>` : ''}
                <select class="form-control" style="width:140px;" onchange="helpdeskSetFilter('status', this.value); refreshHelpdeskPage()">
                    <option value="all">All status</option>
                    ${STATUSES.map(s => `<option value="${s}"${helpdeskFilter.status === s ? ' selected' : ''}>${s.replace('_', ' ')}</option>`).join('')}
                </select>
                <select class="form-control" style="width:130px;" onchange="helpdeskSetFilter('priority', this.value); refreshHelpdeskPage()">
                    <option value="all">All priority</option>
                    ${PRIORITIES.map(p => `<option value="${p}"${helpdeskFilter.priority === p ? ' selected' : ''}>${p}</option>`).join('')}
                </select>
                <input type="text" class="form-control" placeholder="Search tickets..." style="flex:1;min-width:180px;" value="${escapeHtml(helpdeskFilter.search)}" oninput="helpdeskSetFilter('search', this.value); refreshHelpdeskPage()">
            </div>
            <div class="table-container">
                <div class="table-header"><h3>${helpdeskTab === 'team' && canManage ? 'Team Issue Queue' : 'My Reported Issues'} (${showList.length})</h3></div>
                <table class="data-table" style="min-width:1280px;">
                    <thead><tr>
                        <th>Ticket</th><th>Subject</th><th>Category</th><th>Priority</th><th>Status</th>
                        <th>Reporter</th><th>Assignee</th><th>Logged</th><th>Target Resolve</th><th>First Response</th><th>SLA / KPI</th><th></th>
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
        const t = ticketId ? findTicket(ticketId) : null;
        const me = getCurrentUserInfo();
        const canManage = canManageHelpdesk();
        const settings = getSettings();
        const users = typeof adminUsersDB !== 'undefined' ? adminUsersDB.filter(u => u.status === 'active') : [];

        document.getElementById('helpdeskModalTitle').textContent = t ? `${t.ticketNumber} — ${t.subject}` : 'Report New Issue';
        document.getElementById('helpdeskFormId').value = t?.id || '';
        document.getElementById('helpdeskFormSubject').value = t?.subject || '';
        document.getElementById('helpdeskFormDescription').value = t?.description || '';
        document.getElementById('helpdeskFormCategory').innerHTML = settings.categories.map(c =>
            `<option value="${escapeHtml(c)}"${t?.category === c ? ' selected' : ''}>${escapeHtml(c)}</option>`
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
                `<option value="${escapeHtml(u.id)}" data-name="${escapeHtml(u.username)}"${t?.assigneeUserId === u.id ? ' selected' : ''}>${escapeHtml(u.username)}</option>`
            ).join('')}`;
        }

        const commentsEl = document.getElementById('helpdeskCommentsBody');
        const comments = (t?.comments || []).filter(c => canManage || !c.isInternal);
        if (commentsEl) {
            commentsEl.innerHTML = comments.length ? comments.map(c => `
                <div style="margin-bottom:10px;padding:10px;background:${c.isInternal ? '#fffaf0' : '#f7fafc'};border-radius:8px;border:1px solid var(--border);">
                    <div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px;">
                        <strong>${escapeHtml(c.authorUsername || '—')}</strong> · ${escapeHtml(c.createdAt || '')}${c.isInternal ? ' · <em>Internal note</em>' : ''}
                    </div>
                    <div style="font-size:13px;white-space:pre-wrap;">${escapeHtml(c.body || '')}</div>
                </div>`).join('') : '<p style="color:var(--text-secondary);font-size:13px;">No comments yet.</p>';
        }

        const slaEl = document.getElementById('helpdeskSlaInfo');
        if (slaEl && t) {
            const sla = getHelpdeskTicketSla(t);
            slaEl.innerHTML = `
                Logged: <strong>${formatDateTime(t.createdAt)}</strong> ·
                Target resolve: <strong>${formatDateTime(sla.targetResolveAt)}</strong> ·
                First response due: <strong>${t.firstResponseAt ? formatDateTime(t.firstResponseAt) + ' (met)' : formatDateTime(sla.targetFirstResponseAt)}</strong><br>
                SLA: ${slaBadge(t, 'response')} ${slaBadge(t, 'resolution')}`;
            slaEl.style.display = 'block';
        } else if (slaEl) slaEl.style.display = 'none';

        document.getElementById('helpdeskCommentBox').value = '';
        document.getElementById('helpdeskInternalNote').checked = false;
        const internalWrap = document.getElementById('helpdeskInternalNoteWrap');
        if (internalWrap) internalWrap.style.display = canManage ? 'flex' : 'none';
        const commentsSection = document.getElementById('helpdeskCommentsSection');
        if (commentsSection) commentsSection.style.display = t ? 'block' : 'none';
        openModal('helpdeskModal');
    };

    window.submitHelpdeskTicketForm = async function () {
        const me = getCurrentUserInfo();
        const id = document.getElementById('helpdeskFormId')?.value;
        const existing = id ? findTicket(id) : null;
        const priority = document.getElementById('helpdeskFormPriority')?.value || 'normal';
        const assignSel = document.getElementById('helpdeskFormAssignee');
        const assignOpt = assignSel?.selectedOptions?.[0];
        const canManage = canManageHelpdesk();
        const createdAt = existing?.createdAt || new Date().toISOString().slice(0, 19).replace('T', ' ');
        const priorityChanged = existing && existing.priority !== priority;

        const payload = {
            id: id || undefined,
            subject: document.getElementById('helpdeskFormSubject')?.value.trim(),
            description: document.getElementById('helpdeskFormDescription')?.value.trim(),
            category: document.getElementById('helpdeskFormCategory')?.value,
            priority,
            modulePage: document.getElementById('helpdeskFormModule')?.value.trim(),
            area: document.getElementById('helpdeskFormArea')?.value.trim(),
            browserInfo: document.getElementById('helpdeskFormBrowser')?.value.trim(),
            reporterUserId: existing?.reporterUserId || me.id,
            reporterUsername: existing?.reporterUsername || me.username
        };

        if (canManage && existing) {
            payload.status = document.getElementById('helpdeskFormStatus')?.value || existing.status;
            payload.assigneeUserId = assignOpt?.value || null;
            payload.assigneeUsername = assignOpt?.dataset?.name || null;
        }

        if (!id) {
            payload.status = 'open';
            payload.targetResolveAt = computeTargetResolveAt(priority, createdAt);
            payload.targetFirstResponseAt = computeTargetFirstResponseAt(priority, createdAt);
        } else if (priorityChanged) {
            payload.targetResolveAt = computeTargetResolveAt(priority, createdAt);
            payload.targetFirstResponseAt = computeTargetFirstResponseAt(priority, createdAt);
        }

        if (!payload.subject) { showToast('Subject is required', 'warning'); return; }
        if (!payload.description) { showToast('Description is required', 'warning'); return; }

        try {
            let saved = null;
            if (typeof saveHelpdeskTicketApi === 'function' && typeof isApiAvailable === 'function' && isApiAvailable()) {
                saved = await saveHelpdeskTicketApi(payload);
            }
            if (saved) {
                upsertLocalTicket(saved);
            } else {
                const local = {
                    ...existing,
                    ...payload,
                    id: payload.id || `HDT-${Date.now()}`,
                    ticketNumber: existing?.ticketNumber || `HD-${10000 + myTicketsDB.length + 1}`,
                    createdAt,
                    comments: existing?.comments || []
                };
                upsertLocalTicket(local);
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
        const isInternal = canManageHelpdesk() && document.getElementById('helpdeskInternalNote')?.checked;
        try {
            if (typeof addHelpdeskCommentApi === 'function' && typeof isApiAvailable === 'function' && isApiAvailable()) {
                const result = await addHelpdeskCommentApi(ticketId, { body, isInternal });
                if (result?.ticket) upsertLocalTicket(result.ticket);
            } else {
                const t = findTicket(ticketId);
                if (t) {
                    t.comments = t.comments || [];
                    const comment = {
                        id: Date.now(), ticketId, body, isInternal,
                        authorUsername: getCurrentUserInfo().username,
                        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
                    };
                    t.comments.push(comment);
                    if (!t.firstResponseAt && !isInternal && t.reporterUsername !== getCurrentUserInfo().username) {
                        t.firstResponseAt = comment.createdAt;
                        if (t.status === 'open') t.status = 'in_progress';
                    }
                    upsertLocalTicket(t);
                }
            }
            saveLocal();
            openHelpdeskTicketModal(ticketId);
            showToast('Comment added', 'success');
        } catch (e) { showToast(e.message, 'error'); }
    };

    window.quickResolveHelpdeskTicket = async function (ticketId) {
        if (!canManageHelpdesk()) return;
        const existing = findTicket(ticketId);
        if (!existing) return;
        const payload = {
            id: ticketId,
            status: 'resolved',
            resolvedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
        };
        try {
            let saved = null;
            if (typeof saveHelpdeskTicketApi === 'function' && isApiAvailable()) {
                saved = await saveHelpdeskTicketApi(payload);
            }
            const merged = saved || { ...existing, ...payload };
            upsertLocalTicket(merged);
            saveLocal();
            showToast('Issue marked resolved', 'success');
            refreshHelpdeskPage();
        } catch (e) { showToast(e.message, 'error'); }
    };

    window.renderAdminHelpdeskSettings = function (container) {
        const canManage = typeof canManageHelpdesk === 'function' && canManageHelpdesk();
        if (!canManage && typeof canAccessAdminPage === 'function' && !canAccessAdminPage('admin-helpdesk-settings')) {
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
                    <p class="page-subtitle">Set target response and resolution times per priority. Tickets show green / orange / red KPI based on logged date vs targets.</p>
                </div>
            </div>
            <div class="settings-card">
                <h3>SLA targets by priority (hours)</h3>
                <table class="data-table kpi-settings-table">
                    <thead><tr><th>Priority</th><th>First Response (hrs)</th><th>Resolution Target (hrs)</th></tr></thead>
                    <tbody>${priRows}</tbody>
                </table>
                <div style="margin-top:16px;">
                    <button class="btn btn-primary" onclick="saveHelpdeskSettingsAdmin()">💾 Save SLA Settings</button>
                </div>
            </div>
            <div class="rbac-info-banner" style="margin-top:16px;">
                <strong>KPI rules:</strong> Green = within target · Orange = approaching deadline · Red = past target time.
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
