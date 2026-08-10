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

    const MENU_GUIDE = [
        {
            section: 'Main',
            items: [
                {
                    id: 'dashboard', icon: '📊', label: 'Dashboard',
                    keywords: ['dashboard', 'home', 'overview', 'main'],
                    description: 'Your command centre. See total trucks in DRC, NB/SB outstanding counts, POD pending, orange/red alerts, and quick links into trip lists. Click any stat card to drill down.'
                }
            ]
        },
        {
            section: 'Operations',
            items: [
                {
                    id: 'nb-operations', icon: '🚛', label: 'NB Operations', moduleId: 'nb-operations',
                    keywords: ['nb operations', 'northbound', 'nb trucks', 'nb live'],
                    description: 'Live northbound trucks entering DRC. Upload NB files, filter by area/border/KPI, and use workflow columns (Border → Kanyaka → Offloading → POD) with status dates and user logs. 💬 opens the comment modal.'
                },
                {
                    id: 'sb-operations', icon: '🚛', label: 'SB Operations', moduleId: 'sb-operations',
                    keywords: ['sb operations', 'southbound', 'sb trucks', 'sb live', 'loading', 'dispatch'],
                    description: 'Live southbound trucks exiting DRC. Tracks Loading → Documents → Seal → Escort → Dispatch → Kanyaka → Border Exit. Upload SB files and update status per workflow column.'
                },
                {
                    id: 'border-clearance', icon: '🛂', label: 'Border Clearance', moduleId: 'border-clearance',
                    keywords: ['border clearance', 'border', 'kbp', 'whisky', 'direct', 'bn process', 'exit'],
                    description: 'Dedicated border view with separate **NB** and **SB** tables. Each clearance status is its own column showing date and who recorded it. KPI cards summarise Kasumbalesa, Sakania, and Mokambo performance.'
                },
                {
                    id: 'pod-management', icon: '📋', label: 'POD Management', moduleId: 'pod-management',
                    keywords: ['pod', 'proof of delivery', 'pod management', 'invoicing', 'scan pod'],
                    description: 'Proof-of-delivery pipeline: **Collect → Scan → Upload → Send to Invoicing**. Filter by area/KPI, use row action buttons or 💬 to advance each stage and track overdue PODs.'
                }
            ]
        },
        {
            section: 'Areas',
            items: [
                {
                    id: 'area-browser', icon: '🗺️', label: 'Area Trucks', moduleId: 'area-browser',
                    keywords: ['area trucks', 'area browser', 'areas', 'kanyaka', 'kolwezi', 'kasumbalesa area'],
                    description: 'Browse trucks by geographic area (Kanyaka, Kolwezi, Kasumbalesa, etc.). Full live table with NB/SB workflow status columns, comments, and filters — useful for area supervisors.'
                }
            ]
        },
        {
            section: 'Communication',
            items: [
                {
                    id: 'communication-matrix', icon: '📇', label: 'Communication Matrix', moduleId: 'communication-matrix',
                    keywords: ['communication matrix', 'contacts', 'matrix', 'clearing agent', 'phone'],
                    description: 'Directory of contacts by function and area — clearing agents, border officers, dispatchers, POD team. Add or edit contacts and link them to borders or areas.'
                },
                {
                    id: 'driver-registry', icon: '📱', label: 'Driver Registry', moduleId: 'driver-registry',
                    keywords: ['driver registry', 'driver contact', 'whatsapp', 'drc number', 'register driver'],
                    description: 'NB driver contacts registered at border: name, truck, DRC mobile, WhatsApp, border, and registration notes. Used when recording driver details during clearance.'
                },
                {
                    id: 'internal-communication', icon: '✉️', label: 'Internal Communication', moduleId: 'internal-communication',
                    keywords: ['internal communication', 'email', 'chat', 'whatsapp', 'messages', 'inbox'],
                    description: 'Team email (inbox, sent, drafts) plus chat rooms for borders, areas, and direct messages. Trip-linked threads for KBP queues, dispatch updates, and POD alerts.'
                },
                {
                    id: 'helpdesk', icon: '🎫', label: 'Helpdesk', moduleId: 'helpdesk',
                    keywords: ['helpdesk', 'support', 'issue', 'bug', 'report problem', 'technical', 'ticket'],
                    description: 'Log web app issues for the technical team. Each ticket has a logged date, target resolve time, and SLA KPI (green/orange/red). Super Admin and managers see the full team queue.'
                }
            ]
        },
        {
            section: 'Management',
            items: [
                {
                    id: 'assets', icon: '🚗', label: 'Assets & Equipment', moduleId: 'assets',
                    keywords: ['assets', 'equipment', 'vehicles', 'fleet documents', 'insurance'],
                    description: 'Fleet assets and equipment register — vehicles, phones, radios. Track documents, expiry dates, operational status, and handover records.'
                },
                {
                    id: 'client-orders', icon: '📦', label: 'Client Orders', moduleId: 'client-orders',
                    keywords: ['client orders', 'orders', 'custom order', 'customer order', 'schedule truck', 'allocate', 'fms order', 'commodity', 'container'],
                    description: 'Full FMS client order form: client, route (from Route Catalog), loading/offloading points, borders, commodity, cargo type (Bulk, Container, OOG), container lines, parties, and hazmat. Filter the grid and allocate trucks or schedule via Trip Scheduler.'
                },
                {
                    id: 'clients', icon: '👥', label: 'Clients', moduleId: 'clients',
                    keywords: ['clients', 'client register', 'customer', 'shipper', 'crm', 'client management'],
                    description: 'Dedicated client register — name, contact person, phone, WhatsApp, email, address, and status. Clients are linked to Client Orders and appear in Trip Scheduler order dropdowns.'
                },
                {
                    id: 'route-catalog', icon: '🗺️', label: 'Route Catalog', moduleId: 'route-catalog',
                    keywords: ['route catalog', 'routes', 'stations', 'loading point', 'offloading point', 'domestic', 'international', 'route template'],
                    description: 'Pre-create routes before use: countries, stations, loading/offloading points, and route templates. Same country = domestic; different countries = international with border fields. Client Orders pull stations and points from here.'
                },
                {
                    id: 'trip-scheduler', icon: '📅', label: 'Trip Scheduler', moduleId: 'trip-scheduler',
                    keywords: ['trip scheduler', 'schedule trip', 'trip', 'allocate orders', 'fleet set', 'loading date', 'multi order trip'],
                    description: 'Assign a truck/trailer/driver fleet set to one or more **Client Orders**. Select an order from the dropdown — route, cargo, borders, commodity, loading points, and container details auto-fill. Save links orders to the trip and marks them allocated.'
                },
                {
                    id: 'fleet-registry', icon: '🚛', label: 'Fleet Registry', moduleId: 'fleet-registry',
                    keywords: ['fleet registry', 'register truck', 'trailer', 'driver', 'gps', 'fleet set', 'superlink', 'fms register', 'vehicle spec'],
                    description: 'Register trucks, trailers, and drivers with full FMS vehicle fields (~87 columns in Full Register). Link truck + trailer + driver as a fleet set; pair superlink front/rear trailers. GPS coordinates power the Fleet Map and Position Live pin links.'
                },
                {
                    id: 'runner-fees', icon: '💰', label: 'Runner Fees', moduleId: 'runner-fees',
                    keywords: ['runner fees', 'runner', 'fees', 'transporter fees', 'border fees'],
                    description: 'Calculate runner/transporter fees from border dwell time and Kanyaka transit. Filter by transporter and date range; supports border and Kanyaka NB/SB fee tiers.'
                },
                {
                    id: 'reports', icon: '📈', label: 'Reports', moduleId: 'reports',
                    keywords: ['reports', 'report', 'export', 'analytics', 'summary', 'customize', 'columns', 'csv'],
                    description: 'Customizable reports for every sidebar menu. Use Cross-Menu Custom Report to combine fields from multiple menus (NB + Border + POD, etc.) with shared filters, or open a single-module report.'
                },
                {
                    id: 'turnarounds', icon: '🔄', label: 'Turnarounds', moduleId: 'turnarounds',
                    keywords: ['turnarounds', 'turnaround', 'same truck', 'nb to sb'],
                    description: 'End-to-end NB→SB journey on the same truck: border clearance through POD, then SB loading through border exit. Links to fleet same-truck policy settings.'
                },
                {
                    id: 'fleet-map', icon: '🗺️', label: 'Fleet Map', moduleId: 'fleet-map',
                    keywords: ['fleet map', 'truck map', 'gps map', 'pin', 'tracking map', 'openstreetmap', 'leaflet'],
                    description: 'Interactive map of all fleet trucks with GPS. Click a pin to see truck plate, driver, location, and open the detailed position map. Also available from Position Live and Fleet Registry.'
                },
                {
                    id: 'position-live', icon: '📍', label: 'Position Live', moduleId: 'position-live',
                    keywords: ['position live', 'gps', 'position', 'tracking', 'location'],
                    description: 'Live truck positions with workflow status columns and latest comments. Click a position cell with 📍 to open the truck map, or use Fleet Map to see all trucks at once.'
                }
            ]
        },
        {
            section: 'Admin',
            items: [
                {
                    id: 'admin-users', icon: '👥', label: 'Manage Users', adminPage: 'admin-users',
                    keywords: ['manage users', 'users', 'create user', 'accounts'],
                    description: 'Create and edit user accounts, assign roles, areas, and contact details. Ban or activate users and reset passwords.'
                },
                {
                    id: 'admin-roles', icon: '🛡️', label: 'Role Manager', adminPage: 'admin-roles',
                    keywords: ['role manager', 'roles', 'permissions', 'super admin', 'moderator'],
                    description: 'Define roles (Super Admin, Manager, Moderator, User) and their global permissions — read, edit, manage users, manage settings, view logs.'
                },
                {
                    id: 'admin-settings', icon: '⚙️', label: 'System Settings', adminPage: 'admin-settings',
                    keywords: ['system settings', 'settings', 'maintenance', 'session', 'backup'],
                    description: 'Global config: sign-ups, maintenance mode, session timeout, interest rate, support email, app name, and database backup schedule.'
                },
                {
                    id: 'admin-themes', icon: '🎨', label: 'Themes', adminPage: 'admin-themes',
                    keywords: ['themes', 'theme', 'colours', 'colors', 'appearance', 'look'],
                    description: 'Pick a colour theme (Ocean Blue, Midnight Pro, Forest Logistics, Copper Haul, Arctic Light, Royal Purple). Applies instantly across the whole application.'
                },
                {
                    id: 'admin-kpi-settings', icon: '🎯', label: 'KPI Settings', adminPage: 'admin-kpi-settings',
                    keywords: ['kpi settings', 'kpi targets', 'sla', 'targets', 'hours target'],
                    description: 'Configure SLA targets per workflow step, border process step (KBP, Whisky, Direct, SB exit), POD stages, and module-level KPI rules.'
                },
                {
                    id: 'admin-audit-logs', icon: '📋', label: 'Audit Logs', adminPage: 'admin-audit-logs',
                    keywords: ['audit logs', 'audit', 'log', 'history', 'who changed'],
                    description: 'Searchable timeline of every create, update, delete, and blocked action — who did it, when, from which IP, and what changed.'
                },
                {
                    id: 'admin-area-statuses', icon: '📍', label: 'Area Status Lists', adminPage: 'admin-area-statuses',
                    keywords: ['area status lists', 'area statuses', 'status list', 'configure statuses'],
                    description: 'Configure valid status names per area for NB, SB, and border workflows (Kasumbalesa, Kanyaka, Kolwezi, Sakania, Mokambo, etc.).'
                },
                {
                    id: 'admin-area-assignments', icon: '🗺️', label: 'Area Assignments', adminPage: 'admin-area-assignments',
                    keywords: ['area assignments', 'assign areas', 'user areas', 'assigned areas'],
                    description: 'Assign which geographic areas each user can see and work on. Controls data filtering for moderators and area teams.'
                },
                {
                    id: 'admin-module-permissions', icon: '🔐', label: 'Module Permissions', adminPage: 'admin-module-permissions',
                    keywords: ['module permissions', 'module access', 'view edit delete', 'per module'],
                    description: 'Fine-grained access: set **view / edit / delete** per operational module (NB, SB, Border, POD, etc.) and per area for each user.'
                },
                {
                    id: 'admin-fleet-settings', icon: '🚛', label: 'Fleet — Same Truck for SB', adminPage: 'admin-fleet-settings',
                    keywords: ['fleet', 'same truck', 'sb fleet', 'turnaround truck'],
                    description: 'Policy for whether the same physical truck must continue on the SB leg after NB turnaround. Affects turnarounds and trip linking.'
                },
                {
                    id: 'admin-freight-settings', icon: '📦', label: 'Freight & FMS Settings', adminPage: 'admin-freight-settings',
                    keywords: ['freight settings', 'fms settings', 'trip scheduler settings', 'route catalog settings', 'client order settings', 'fleet registry settings', 'order prefix', 'max orders per trip'],
                    description: 'Configure Trip Scheduler defaults (transporter, loading time, max orders per trip), Client Order rules (order number prefix, default status), Route Catalog enforcement, and Fleet Registry policies (superlink, FMS register tab, asset locking).'
                },
                {
                    id: 'admin-helpdesk-settings', icon: '🎫', label: 'Helpdesk SLA Settings', adminPage: 'admin-helpdesk-settings',
                    keywords: ['helpdesk settings', 'helpdesk sla', 'support sla', 'ticket kpi', 'resolution target'],
                    description: 'Configure first-response and resolution SLA targets per priority (urgent, high, normal, low). Drives helpdesk KPI colours and overdue alerts.'
                },
                {
                    id: 'admin-upload-templates', icon: '📤', label: 'Upload Templates', adminPage: 'admin-upload-templates',
                    keywords: ['upload templates', 'templates', 'live file', 'column template', 'excel'],
                    description: 'Super Admin only. Define column layouts for NB/SB live file uploads and position uploads — which fields appear in operations tables.'
                }
            ]
        }
    ];

    function canSeeMenuItem(item, ctx) {
        if (ctx.isSuperAdmin) return true;
        if (item.adminPage && typeof canAccessAdminPage === 'function') {
            return canAccessAdminPage(item.adminPage);
        }
        if (item.moduleId && typeof canAccessModule === 'function') {
            return canAccessModule(item.moduleId);
        }
        return true;
    }

    function findMenuItems(query) {
        const q = String(query || '').toLowerCase().trim();
        if (!q) return [];
        const hits = [];
        MENU_GUIDE.forEach(sec => {
            sec.items.forEach(item => {
                const hay = [item.label, item.id, ...(item.keywords || [])].join(' ').toLowerCase();
                if (hay.includes(q) || item.keywords?.some(k => q.includes(k) || k.includes(q))) {
                    hits.push({ ...item, section: sec.section });
                }
            });
        });
        return hits;
    }

    function formatMenuItemLine(item, ctx) {
        const allowed = canSeeMenuItem(item, ctx);
        const line = `**${item.icon} ${item.label}** — ${item.description}`;
        if (!allowed) {
            return `${line}\n🔒 *You do not have access — please check with your Admin.*`;
        }
        return line;
    }

    function getFullMenuGuide(ctx) {
        return MENU_GUIDE.map(sec => {
            const lines = sec.items.map(item => `• ${formatMenuItemLine(item, ctx)}`).join('\n\n');
            return `**${sec.section}**\n${lines}`;
        }).join('\n\n');
    }

    function getMenuItemHelp(itemId, ctx) {
        for (const sec of MENU_GUIDE) {
            const item = sec.items.find(i => i.id === itemId);
            if (item) {
                return `**${sec.section} → ${item.icon} ${item.label}**\n\n${formatMenuItemLine(item, ctx)}`;
            }
        }
        return null;
    }

    function pageHelp(ctx) {
        for (const sec of MENU_GUIDE) {
            const item = sec.items.find(i => i.id === ctx.page);
            if (item) return formatMenuItemLine(item, ctx);
        }
        return null;
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

    const FREIGHT_KEYWORDS = /client order|trip scheduler|route catalog|fleet registry|superlink|fms|freight|allocate order|loading point|offloading|container|oog|custom order/i;

    function freightWorkflowHelp(topic) {
        const guides = {
            orders: `**Client Orders workflow:**\n1. Register clients under **Management → Clients**\n2. Create a route in **Route Catalog** (or pick origin/destination manually)\n3. **Management → Client Orders** → Create Order — fill header, route & borders, load/commodity, parties\n4. Allocate a fleet set directly, or schedule via **Trip Scheduler**\n\nCargo types: Bulk Loose, Break Bulk, Bulk Liquid, Container, OOG. Container/OOG orders support multiple container lines and seal numbers.`,
            scheduler: `**Trip Scheduler workflow:**\n1. Open **Management → Trip Scheduler**\n2. Set trip reference, loading date/time, and select a **Truck / Fleet Set**\n3. Under **Add Client Order to Trip**, pick an order from the dropdown — fields auto-fill from the order\n4. Click **Add to Trip** (repeat for multiple orders if allowed)\n5. **Save Trip** — orders are linked, marked allocated, and assigned to the fleet unit\n\nAdmins configure defaults under **Admin → Freight & FMS Settings**.`,
            routes: `**Route Catalog:**\n• Add **countries** and **stations** (e.g. Durban, Kolwezi, Kasumbalesa)\n• Link **loading points** to origin stations and **offloading points** to destinations\n• Create **route templates** with domestic/international type and default borders\n• Client Orders use catalog stations/points in cascading dropdowns\n\nAdmin can require catalog routes only: **Admin → Freight & FMS Settings → Route Catalog**.`,
            fleet: `**Fleet Registry:**\n• **Trucks** and **Trailers** — full FMS specs (owner, fleet no, engine, GPS, tanks, etc.)\n• **Superlink Pair** — link front + rear trailers with combined capacity\n• **Fleet Set** — assign truck + trailer + driver; linked assets cannot join other sets (if locking enabled)\n• **Full Register** tab shows all ~87 FMS columns in one grid\n\nConfigure superlink, FMS register visibility, and asset locking in **Admin → Freight & FMS Settings**.`,
            clients: `**Clients register:**\nAdd customers under **Management → Clients** with contact details and WhatsApp. These clients appear in Client Order forms and Trip Scheduler order labels (order no | client | route | cargo).`
        };
        return guides[topic] || guides.orders;
    }

    function matchQuery(q, patterns) {
        return patterns.some(p => (p instanceof RegExp ? p.test(q) : q.includes(p)));
    }

    window.generateHelpResponse = function (query, ctx) {
        const q = String(query || '').trim().toLowerCase();
        if (!q) return 'Please type a question or pick a quick topic below.';

        if (matchQuery(q, ['hello', 'hi', 'hey', 'help'])) {
            const pageTip = pageHelp(ctx);
            return `Hello **${ctx.user?.username || 'there'}**! I'm your Truck Control assistant.\n\n${pageTip ? `You're on **${ctx.page}**: ${pageTip}\n\n` : ''}Ask about any **sidebar menu** item, workflows, borders, POD, **Client Orders**, **Trip Scheduler**, **Route Catalog**, or permissions.\n• Type **"menu"** for the full navigation guide\n• Type **"trip scheduler"** or **"client orders"** for FMS workflows\n• Type **"my access"** to see what you can open`;
        }

        if (matchQuery(q, ['menu', 'sidebar', 'navigation', 'all menus', 'all pages', 'menu guide', 'what is in the menu', 'list menus'])) {
            return `**Sidebar menu guide** — every section and what it does:\n\n${getFullMenuGuide(ctx)}\n\nAsk about any item by name, e.g. *"What is Border Clearance?"* or *"Runner Fees"*`;
        }

        const menuHits = findMenuItems(q);
        if (menuHits.length === 1) {
            const item = menuHits[0];
            return `**${item.section} → ${item.icon} ${item.label}**\n\n${formatMenuItemLine(item, ctx)}`;
        }
        if (menuHits.length > 1 && menuHits.length <= 4) {
            return `I found several menu items matching that:\n\n${menuHits.map(item =>
                `**${item.icon} ${item.label}** (${item.section})\n${item.description}`
            ).join('\n\n')}\n\nAsk about one by its full name for more detail.`;
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

        if (matchQuery(q, ['trip scheduler', 'schedule trip', 'trip schedule', 'allocate to trip', 'link order to trip'])) {
            if (!ctx.modules.some(m => m.id === 'trip-scheduler') && !ctx.isSuperAdmin) {
                return adminAccessDenied(ctx, 'Trip Scheduler');
            }
            return freightWorkflowHelp('scheduler');
        }

        if (matchQuery(q, ['client order', 'custom order', 'create order', 'fms order', 'order form'])) {
            if (!ctx.modules.some(m => m.id === 'client-orders') && !ctx.isSuperAdmin) {
                return adminAccessDenied(ctx, 'Client Orders');
            }
            return freightWorkflowHelp('orders');
        }

        if (matchQuery(q, ['route catalog', 'loading point', 'offloading point', 'route template', 'pre-defined route'])) {
            if (!ctx.modules.some(m => m.id === 'route-catalog') && !ctx.isSuperAdmin) {
                return adminAccessDenied(ctx, 'Route Catalog');
            }
            return freightWorkflowHelp('routes');
        }

        if (matchQuery(q, ['fleet registry', 'superlink', 'fleet set', 'fms register', 'register truck', 'vehicle spec'])) {
            if (!ctx.modules.some(m => m.id === 'fleet-registry') && !ctx.isSuperAdmin) {
                return adminAccessDenied(ctx, 'Fleet Registry');
            }
            return freightWorkflowHelp('fleet');
        }

        if (matchQuery(q, ['clients menu', 'client register', 'add client', 'customer register'])) {
            if (!ctx.modules.some(m => m.id === 'clients') && !ctx.isSuperAdmin) {
                return adminAccessDenied(ctx, 'Clients');
            }
            return freightWorkflowHelp('clients');
        }

        if (matchQuery(q, ['freight settings', 'fms settings', 'freight admin', 'configure trip', 'order prefix'])) {
            if (requiresAdmin(ctx)) return adminAccessDenied(ctx, 'Freight & FMS Settings');
            return pageHelp({ ...ctx, page: 'admin-freight-settings' }) || freightWorkflowHelp('scheduler');
        }

        if (FREIGHT_KEYWORDS.test(q) && !ADMIN_KEYWORDS.test(q)) {
            const hits = findMenuItems(q).filter(i => ['client-orders', 'clients', 'route-catalog', 'trip-scheduler', 'fleet-registry'].includes(i.id));
            if (hits.length === 1) {
                return `**${hits[0].section} → ${hits[0].icon} ${hits[0].label}**\n\n${formatMenuItemLine(hits[0], ctx)}`;
            }
        }

        if (matchQuery(q, ['helpdesk', 'report issue', 'log issue', 'support ticket', 'bug report'])) {
            if (!ctx.modules.some(m => m.id === 'helpdesk') && !ctx.isSuperAdmin) {
                return adminAccessDenied(ctx, 'Helpdesk');
            }
            return '**Helpdesk workflow:**\n1. Open **Communication → Helpdesk**\n2. Click **Report Issue** — describe the problem, pick category and priority\n3. Each ticket records **logged date**, **target resolve time**, and **first response due** from SLA settings\n4. Technical team (Super Admin / Manager) uses **Team Queue** to assign, comment, and resolve\n5. KPI badges: **green** = on track · **orange** = approaching deadline · **red** = overdue (first response + resolution)\n\nAdmins configure SLA hours per priority under **Admin → Helpdesk SLA Settings**.';
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
            if (q.includes('freight') || q.includes('fms') || q.includes('trip scheduler') || q.includes('client order')) {
                return pageHelp({ ...ctx, page: 'admin-freight-settings' });
            }
            if (q.includes('module') && q.includes('permission')) {
                return pageHelp({ ...ctx, page: 'admin-module-permissions' });
            }
            return 'As an administrator you can manage users, roles, module permissions, area statuses, KPI targets, **Freight & FMS Settings**, and fleet turnaround rules from the **Admin** section in the sidebar.';
        }

        if (matchQuery(q, ['this page', 'current page', 'where am i'])) {
            const tip = getMenuItemHelp(ctx.page, ctx);
            if (tip) return tip;
            return `You are on page **${ctx.page || 'unknown'}**. Type **"menu"** for the full sidebar guide.`;
        }

        return `I didn't find a specific answer for that. Try:\n• **Menu** — full sidebar guide\n• **Client orders** or **Trip scheduler** — FMS freight workflows\n• **Route catalog** or **Fleet registry**\n• **NB workflow** / **SB workflow** / **Border** / **POD**\n• **Freight settings** (admins) — configure Trip Scheduler, orders, routes, fleet\n• **My access** — what you can open\n• Name any menu item, e.g. *Clients*, *Themes*, *Position Live*\n\n${!ctx.isSuperAdmin ? 'For admin-only pages, please **check with your Admin**.' : ''}`;
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
                    <button type="button" onclick="sendHelpAssistantMessage('Menu guide')">Menu guide</button>
                    <button type="button" onclick="sendHelpAssistantMessage('My access')">My access</button>
                    <button type="button" onclick="sendHelpAssistantMessage('NB workflow')">NB workflow</button>
                    <button type="button" onclick="sendHelpAssistantMessage('SB workflow')">SB workflow</button>
                    <button type="button" onclick="sendHelpAssistantMessage('Border clearance')">Border</button>
                    <button type="button" onclick="sendHelpAssistantMessage('Client orders')">Client orders</button>
                    <button type="button" onclick="sendHelpAssistantMessage('Trip scheduler')">Trip scheduler</button>
                    <button type="button" onclick="sendHelpAssistantMessage('Route catalog')">Route catalog</button>
                    <button type="button" onclick="sendHelpAssistantMessage('How do I update status?')">Update status</button>
                    <button type="button" onclick="sendHelpAssistantMessage('Helpdesk')">Helpdesk</button>
                    <button type="button" onclick="sendHelpAssistantMessage('Help on this page')">This page</button>
                </div>
                <div class="help-assistant-input-row">
                    <input type="text" id="helpAssistantInput" class="form-control" placeholder="Ask about workflows, client orders, trip scheduler, borders…" onkeydown="if(event.key==='Enter')sendHelpAssistantMessage()">
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
