/**
 * Role-aware in-app help assistant (rule-based guide for Truck Control software).
 */
(function () {
    const ADMIN_KEYWORDS = /admin|user management|role|permission|audit|kpi setting|area status config|upload template|module permission/i;
    const ADMIN_PAGES = /^admin-/;

    function buildHelpContext() {
        const role = typeof getCurrentRole === 'function' ? getCurrentRole() : null;
        const user = typeof getCurrentAdminUser === 'function' ? getCurrentAdminUser() : null;
        const isSuperAdmin = typeof userIsSuperAdmin === 'function' && userIsSuperAdmin();
        const areas = typeof getUserAssignedAreas === 'function' ? getUserAssignedAreas() : ['All Areas'];
        const modules = (window.OPERATIONAL_MODULES || []).filter(m =>
            typeof canAccessModule === 'function' && canAccessModule(m.id)
        );
        const editableModules = modules.filter(m =>
            typeof canEditInModule === 'function' && canEditInModule(m.id)
        );
        const page = typeof currentPage !== 'undefined' ? currentPage : '';
        const pageModule = typeof getPageModule === 'function' ? getPageModule(page) : null;
        return { role, user, isSuperAdmin, areas, modules, editableModules, page, pageModule };
    }

    function adminAccessDenied(ctx, topic) {
        return `🔒 **${topic || 'That feature'}** is restricted to administrators or users with specific permissions.\n\nYour role: **${ctx.role?.name || 'Unknown'}**. Please **check with your Admin** if you need access to this area of the software.`;
    }

    function requiresAdmin(ctx) {
        if (ctx.isSuperAdmin) return false;
        if (typeof canUser === 'function' && (canUser('manage_users') || canUser('manage_settings'))) return false;
        return true;
    }

    function pageHelp(ctx) {
        const map = {
            dashboard: 'The **Dashboard** shows KPI summaries and quick links. Use filters to find trucks. Click a trip to open comments or view details.',
            'nb-operations': '**NB Operations** lists northbound trucks. Upload live files, filter by area/border/KPI, and use 💬 to record status updates. Each workflow column shows the latest status date and who updated it.',
            'sb-operations': '**SB Operations** tracks southbound loading through border exit. Status columns follow: Loading → Documents → Seal → Escort → Dispatch → Kanyaka → Border Exit.',
            'border-clearance': '**Border Clearance** has separate **NB** and **SB** tables. Each status is its own column with date and user log. NB uses KBP / Whisky / Direct / BN processes depending on border.',
            'pod-management': '**POD Management** tracks proof-of-delivery: Collect → Scan → Upload → Send to Invoicing. Use action buttons or 💬 on each row.',
            'area-browser': '**Area Trucks** shows all trucks currently in a geographic area with full workflow status columns.',
            'internal-communication': '**Internal Communication** provides email-style messages and team chat rooms linked to trips and borders.',
            'driver-registry': '**Driver Registry** stores NB driver contacts registered at border (DRC number, WhatsApp).',
            'assets': '**Assets & Equipment** manages fleet documents, insurance, and vehicle status.',
            'reports': '**Reports** generates operational summaries. Choose report type and date range.',
            'position-live': '**Position Live** shows truck GPS positions with workflow and comment columns.',
            'admin-users': '**Admin → Users** creates accounts and assigns roles, areas, and module permissions.',
            'admin-roles': '**Admin → Roles** defines permission sets (read, edit, manage users, etc.).',
            'admin-module-permissions': '**Admin → Module Permissions** controls view/edit/delete per module and per area.',
            'admin-area-statuses': '**Admin → Area Statuses** configures valid status lists for each area (NB, SB, border).',
            'admin-kpi-settings': '**Admin → KPI Settings** sets SLA targets per workflow step and border process.'
        };
        return map[ctx.page] || null;
    }

    function workflowHelp(direction) {
        const cfg = (window.WORKFLOW_CONFIG || {})[direction] || [];
        const lines = cfg.map((s, i) => `${i + 1}. **${s.label}**`).join('\n');
        return `**${direction} journey** (in order):\n${lines}\n\nOpen any trip's comment modal to see the macro workflow bar plus the **detailed step sequence** for the driver's current area.`;
    }

    function borderHelp(ctx) {
        const defs = window.BORDER_PROCESS_DEFS || [];
        const nb = defs.filter(p => p.direction === 'NB').map(p =>
            `• **${p.label}**: ${p.steps.map(s => s.shortName || s.name).join(' → ')}`
        ).join('\n');
        const sb = defs.filter(p => p.direction === 'SB').map(p =>
            `• **${p.label}**: ${p.steps.map(s => s.shortName || s.name).join(' → ')}`
        ).join('\n');
        return `**NB border processes:**\n${nb}\n\n**SB exit processes:**\n${sb}`;
    }

    function accessSummary(ctx) {
        if (ctx.isSuperAdmin) {
            return `You are logged in as **Super Admin** (${ctx.user?.username || '—'}). You have **full access** to all modules, areas, and admin settings.`;
        }
        const modList = ctx.modules.map(m => {
            const canEdit = ctx.editableModules.some(e => e.id === m.id);
            return `• ${m.icon} ${m.label} — ${canEdit ? 'view & edit' : 'view only'}`;
        }).join('\n') || '• No operational modules assigned';
        return `**Role:** ${ctx.role?.name || 'Unknown'}\n**User:** ${ctx.user?.username || '—'}\n**Assigned areas:** ${ctx.areas.join(', ')}\n\n**Modules you can access:**\n${modList}\n\nFor changes to your access, please **check with your Admin**.`;
    }

    function statusUpdateHelp(ctx) {
        if (!ctx.editableModules.length) {
            return adminAccessDenied(ctx, 'Recording status updates');
        }
        return `To update a truck status:\n1. Find the truck on NB/SB Operations, Border Clearance, or an Area page.\n2. Click **💬 Comment**.\n3. Choose **Normal Comment** (routine update) or **Problem Report** (priority/overdue issues).\n4. Optionally pick a new status from the dropdown and set the **status date**.\n5. Submit.\n\nThe **process sequence panel** below the workflow bar shows what step comes next in the driver's current area.`;
    }

    function matchQuery(q, patterns) {
        return patterns.some(p => (p instanceof RegExp ? p.test(q) : q.includes(p)));
    }

    window.generateHelpResponse = function (query, ctx) {
        const q = String(query || '').trim().toLowerCase();
        if (!q) return 'Please type a question or pick a quick topic below.';

        if (matchQuery(q, ['hello', 'hi', 'hey', 'help'])) {
            const pageTip = pageHelp(ctx);
            return `Hello **${ctx.user?.username || 'there'}**! I'm your Truck Control assistant.\n\n${pageTip ? `You're on **${ctx.page}**: ${pageTip}\n\n` : ''}Ask about workflows, border processes, POD, permissions, or how to update status. Type **"my access"** to see what you can do.`;
        }

        if (matchQuery(q, ['my access', 'my role', 'what can i', 'permissions', 'my permission'])) {
            return accessSummary(ctx);
        }

        if (matchQuery(q, ['nb workflow', 'northbound', 'nb journey', 'nb steps'])) {
            return workflowHelp('NB');
        }

        if (matchQuery(q, ['sb workflow', 'southbound', 'sb journey', 'sb steps'])) {
            return workflowHelp('SB');
        }

        if (matchQuery(q, ['border', 'kbp', 'whisky', 'direct', 'bn process', 'exit clearance'])) {
            if (!ctx.modules.some(m => m.id === 'border-clearance') && !ctx.isSuperAdmin) {
                return adminAccessDenied(ctx, 'Border Clearance');
            }
            return borderHelp(ctx);
        }

        if (matchQuery(q, ['update status', 'add comment', 'comment modal', 'record status', 'how do i update'])) {
            return statusUpdateHelp(ctx);
        }

        if (matchQuery(q, ['pod', 'proof of delivery', 'collect pod'])) {
            if (!ctx.modules.some(m => m.id === 'pod-management') && !ctx.isSuperAdmin) {
                return adminAccessDenied(ctx, 'POD Management');
            }
            return '**POD workflow:** Collected → Scanned → Uploaded → Sent to Invoicing.\n\nUse the POD Management page. Each row has action buttons for the next stage, or use 💬 to add a comment with a status change.';
        }

        if (matchQuery(q, ['sequence', 'next step', 'what comes after', 'process order', 'current area'])) {
            return "Open a trip's **💬 Comment** modal. Under **Workflow Progress** you'll see the overall journey. Below that, the **process sequence panel** lists every step for the driver's **current area** in order, highlights the current step, and shows **what comes next**.";
        }

        if (matchQuery(q, ['kanyaka', 'kolwezi', 'kasumbalesa', 'sakania', 'mokambo', 'area status'])) {
            const areas = window.areaStatusesDB || [];
            const hits = areas.filter(a => q.includes(a.area.toLowerCase()));
            if (hits.length) {
                return hits.map(rec => {
                    const nb = (rec.statusesBorderNB || rec.statusesNB || []).join(' → ') || '—';
                    const sb = (rec.statusesBorderSB || rec.statusesSB || []).join(' → ') || '—';
                    return `**${rec.area}**\nNB statuses: ${nb}\nSB statuses: ${sb}`;
                }).join('\n\n');
            }
            return "Area-specific statuses are configured in **Admin → Area Statuses**. Open a trip comment modal to see the live sequence for that truck's current area.";
        }

        if (ADMIN_KEYWORDS.test(q) || (ctx.page && ADMIN_PAGES.test(ctx.page))) {
            if (requiresAdmin(ctx)) {
                return adminAccessDenied(ctx, 'Administration settings');
            }
            if (q.includes('kpi')) {
                return pageHelp({ ...ctx, page: 'admin-kpi-settings' }) || 'KPI settings let admins set SLA targets per workflow step and border process step.';
            }
            if (q.includes('area status')) {
                return pageHelp({ ...ctx, page: 'admin-area-statuses' });
            }
            if (q.includes('user')) {
                return pageHelp({ ...ctx, page: 'admin-users' });
            }
            if (q.includes('role')) {
                return pageHelp({ ...ctx, page: 'admin-roles' });
            }
            if (q.includes('module') && q.includes('permission')) {
                return pageHelp({ ...ctx, page: 'admin-module-permissions' });
            }
            return 'As an administrator you can manage users, roles, module permissions, area statuses, and KPI targets from the **Admin** section in the sidebar.';
        }

        if (matchQuery(q, ['this page', 'current page', 'where am i'])) {
            const tip = pageHelp(ctx);
            return tip || `You are on page **${ctx.page || 'unknown'}**. Navigate using the sidebar or ask about NB/SB workflow, border clearance, or POD.`;
        }

        return `I didn't find a specific answer for that. Try asking about:\n• **NB workflow** or **SB workflow**\n• **Border KBP / Whisky / Direct**\n• **How to update status**\n• **POD process**\n• **My access** (what you can do)\n• **This page** (help for where you are now)\n\n${!ctx.isSuperAdmin ? 'For admin-only features, please **check with your Admin**.' : ''}`;
    };

    function renderHelpMessages(messages) {
        const box = document.getElementById('helpAssistantMessages');
        if (!box) return;
        box.innerHTML = messages.map(m => `
            <div class="help-msg help-msg-${m.role}">
                <div class="help-msg-bubble">${m.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')}</div>
            </div>
        `).join('');
        box.scrollTop = box.scrollHeight;
    }

    let helpMessages = [];

    function pushHelpMessage(role, text) {
        helpMessages.push({ role, text, at: Date.now() });
        renderHelpMessages(helpMessages);
    }

    window.toggleHelpAssistant = function (forceOpen) {
        const panel = document.getElementById('helpAssistantPanel');
        const fab = document.getElementById('helpAssistantFab');
        if (!panel) return;
        const open = forceOpen === true ? true : forceOpen === false ? false : !panel.classList.contains('open');
        panel.classList.toggle('open', open);
        if (fab) fab.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open && !helpMessages.length) {
            const ctx = buildHelpContext();
            const welcome = generateHelpResponse('hello', ctx);
            pushHelpMessage('assistant', welcome);
        }
    };

    window.sendHelpAssistantMessage = function (text) {
        const input = document.getElementById('helpAssistantInput');
        const msg = (text || input?.value || '').trim();
        if (!msg) return;
        if (input) input.value = '';
        pushHelpMessage('user', msg);
        const ctx = buildHelpContext();
        setTimeout(() => {
            pushHelpMessage('assistant', generateHelpResponse(msg, ctx));
        }, 200);
    };

    window.initHelpAssistant = function () {
        if (document.getElementById('helpAssistantFab')) return;

        const wrap = document.createElement('div');
        wrap.id = 'helpAssistantRoot';
        wrap.innerHTML = `
            <button type="button" id="helpAssistantFab" class="help-assistant-fab" aria-label="Open help assistant" aria-expanded="false" onclick="toggleHelpAssistant()">
                <span class="help-fab-icon">🤖</span><span class="help-fab-label">Help</span>
            </button>
            <div id="helpAssistantPanel" class="help-assistant-panel" role="dialog" aria-label="Truck Control Help Assistant">
                <div class="help-assistant-header">
                    <div><strong>🤖 Truck Control Assistant</strong><div class="help-assistant-sub">Guides & procedures · respects your role</div></div>
                    <button type="button" class="btn btn-outline btn-sm" onclick="toggleHelpAssistant(false)" aria-label="Close">✕</button>
                </div>
                <div id="helpAssistantMessages" class="help-assistant-messages"></div>
                <div class="help-quick-chips">
                    <button type="button" onclick="sendHelpAssistantMessage('My access')">My access</button>
                    <button type="button" onclick="sendHelpAssistantMessage('NB workflow')">NB workflow</button>
                    <button type="button" onclick="sendHelpAssistantMessage('SB workflow')">SB workflow</button>
                    <button type="button" onclick="sendHelpAssistantMessage('Border KBP process')">Border</button>
                    <button type="button" onclick="sendHelpAssistantMessage('How do I update status?')">Update status</button>
                    <button type="button" onclick="sendHelpAssistantMessage('What comes next in the process?')">Next step</button>
                    <button type="button" onclick="sendHelpAssistantMessage('Help on this page')">This page</button>
                </div>
                <div class="help-assistant-input-row">
                    <input type="text" id="helpAssistantInput" class="form-control" placeholder="Ask about workflows, borders, POD, permissions…" onkeydown="if(event.key==='Enter')sendHelpAssistantMessage()">
                    <button type="button" class="btn btn-primary btn-sm" onclick="sendHelpAssistantMessage()">Send</button>
                </div>
            </div>
        `;
        document.body.appendChild(wrap);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHelpAssistant);
    } else {
        initHelpAssistant();
    }
})();
