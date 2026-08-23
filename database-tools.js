/**
 * Database Browser, Query Developer, and custom SQL-based pages (Super Admin).
 */
(function () {
    const STORAGE_KEY = 'truckcontrol_custom_sql_pages_v1';
    let dbBrowserState = { selectedTable: null, offset: 0, limit: 50 };
    let queryDevState = { lastSql: 'SELECT * FROM trips LIMIT 25', lastResult: null, editingPageId: null };
    let currentCustomSqlPageId = null;

    function escHtml(s) {
        return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function escJs(s) {
        return String(s ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    }

    function canUseDatabaseTools() {
        return typeof userIsSuperAdmin === 'function' && userIsSuperAdmin();
    }

    function apiReady() {
        return typeof isApiAvailable === 'function' && isApiAvailable();
    }

    function readSavedPages() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const list = raw ? JSON.parse(raw) : [];
            return Array.isArray(list) ? list : [];
        } catch (_) {
            return [];
        }
    }

    function writeSavedPages(pages) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
        refreshCustomSqlNav();
    }

    function getSavedPage(id) {
        return readSavedPages().find(p => p.id === id) || null;
    }

    function generatePageId() {
        return `csp-${Date.now().toString(36)}`;
    }

    function renderBackendRequiredBanner() {
        return `<div class="rbac-info-banner" style="margin:16px 0;">
            <strong>Backend connection required.</strong> Database tools read from the production SQLite database via the API.
            Start the server with <code>docker compose up</code> or <code>npm start</code> in <code>backend/</code>, then refresh.
        </div>`;
    }

    function renderAccessDenied(container) {
        container.innerHTML = `<div class="access-denied" style="padding:40px;text-align:center;">
            <div style="font-size:48px;margin-bottom:12px;">🔒</div>
            <h2>Super Admin only</h2>
            <p style="color:var(--text-secondary);max-width:480px;margin:12px auto;">Database Browser and Query Developer are restricted to Super Admin users.</p>
            <button class="btn btn-outline mt-20" onclick="navigateTo('dashboard')">← Back to Dashboard</button>
        </div>`;
    }

    function renderResultsTable(columns, rows, opts = {}) {
        if (!columns.length) {
            return `<p style="padding:16px;color:var(--text-secondary);">Query returned no columns.</p>`;
        }
        const head = columns.map(c => `<th>${escHtml(c)}</th>`).join('');
        const body = rows.length
            ? rows.map(row => `<tr>${columns.map(c => `<td>${escHtml(row[c] == null ? '' : row[c])}</td>`).join('')}</tr>`).join('')
            : `<tr><td colspan="${columns.length}" style="text-align:center;padding:20px;color:var(--text-secondary);">No rows returned</td></tr>`;
        const meta = opts.meta ? `<div style="padding:8px 12px;font-size:12px;color:var(--text-secondary);border-top:1px solid var(--border);">${opts.meta}</div>` : '';
        return `<div class="table-container" style="margin-top:12px;">
            <div style="overflow-x:auto;max-height:${opts.maxHeight || '480px'};overflow-y:auto;">
                <table class="data-table" style="width:100%;font-size:13px;"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
            </div>${meta}</div>`;
    }

    function exportResultsCsv(columns, rows, filename) {
        if (typeof downloadExcelCsv === 'function') {
            downloadExcelCsv(filename, columns, rows.map(r => columns.map(c => r[c])));
        }
    }

  // ─── Database Browser ───────────────────────────────────────────
    window.renderDatabaseBrowser = async function (container) {
        if (!canUseDatabaseTools()) return renderAccessDenied(container);

        let dbInfoHtml = '';
        if (apiReady() && typeof fetchDbInfo === 'function') {
            try {
                const info = await fetchDbInfo();
                if (info?.name) {
                    dbInfoHtml = `<div class="rbac-info-banner" style="margin-top:12px;margin-bottom:0;">
                        <strong>Database:</strong> <code>${escHtml(info.name)}</code>
                        ${info.engine ? `<span style="margin-left:8px;color:var(--text-secondary);">${escHtml(info.engine)}</span>` : ''}
                        ${info.path ? `<br><span style="font-size:12px;color:var(--text-secondary);">Path: <code>${escHtml(info.path)}</code></span>` : ''}
                    </div>`;
                }
            } catch (_) { /* shown after tables load */ }
        }

        container.innerHTML = `<div class="page-header">
            <h1>🗄️ Database Browser</h1>
            ${typeof renderAdminBreadcrumb === 'function' ? renderAdminBreadcrumb('Database Browser') : ''}
            <p class="page-subtitle" style="margin-top:8px;color:var(--text-secondary);">Browse SQLite tables, columns, and row data from the live database (read-only).</p>
            ${dbInfoHtml}
        </div>
        <div id="dbBrowserRoot"><p style="padding:24px;color:var(--text-secondary);">Loading tables…</p></div>`;

        if (!apiReady()) {
            document.getElementById('dbBrowserRoot').innerHTML = renderBackendRequiredBanner();
            return;
        }

        await refreshDatabaseBrowserView();
    };

    async function refreshDatabaseBrowserView() {
        const root = document.getElementById('dbBrowserRoot');
        if (!root) return;
        try {
            const tables = typeof fetchDbTables === 'function' ? await fetchDbTables() : [];
            const selected = dbBrowserState.selectedTable || tables[0]?.name || null;
            dbBrowserState.selectedTable = selected;

            let schemaHtml = '';
            let dataHtml = '<p style="padding:16px;color:var(--text-secondary);">Select a table</p>';
            if (selected) {
                const schema = await fetchDbTableSchema(selected);
                const data = await fetchDbTableRows(selected, { limit: dbBrowserState.limit, offset: dbBrowserState.offset });
                schemaHtml = `<div class="card" style="margin-bottom:16px;"><div class="card-header">Schema — ${escHtml(selected)}</div><div class="card-body" style="overflow-x:auto;">
                    <table style="width:100%;font-size:13px;"><thead><tr><th>Column</th><th>Type</th><th>PK</th><th>Not null</th><th>Default</th></tr></thead>
                    <tbody>${(schema.columns || []).map(c => `<tr>
                        <td><strong>${escHtml(c.name)}</strong></td><td>${escHtml(c.type)}</td>
                        <td>${c.pk ? '✓' : ''}</td><td>${c.notnull ? '✓' : ''}</td><td>${escHtml(c.dflt_value ?? '')}</td>
                    </tr>`).join('')}</tbody></table></div></div>`;

                const total = data.total || 0;
                const page = Math.floor(dbBrowserState.offset / dbBrowserState.limit) + 1;
                const pages = Math.max(1, Math.ceil(total / dbBrowserState.limit));
                dataHtml = renderResultsTable(data.columns || [], data.rows || [], {
                    meta: `${total} row(s) · page ${page} of ${pages}`,
                    maxHeight: '520px'
                }) + `<div style="display:flex;gap:8px;margin-top:12px;align-items:center;flex-wrap:wrap;">
                    <button class="btn btn-outline btn-sm" ${dbBrowserState.offset <= 0 ? 'disabled' : ''} onclick="dbBrowserPrevPage()">← Prev</button>
                    <button class="btn btn-outline btn-sm" ${dbBrowserState.offset + dbBrowserState.limit >= total ? 'disabled' : ''} onclick="dbBrowserNextPage()">Next →</button>
                    <span style="font-size:12px;color:var(--text-secondary);">Rows per page:</span>
                    <select class="form-control" style="width:auto;" onchange="dbBrowserSetLimit(this.value)">
                        ${[25, 50, 100, 200].map(n => `<option value="${n}"${dbBrowserState.limit === n ? ' selected' : ''}>${n}</option>`).join('')}
                    </select>
                    <button class="btn btn-outline btn-sm" onclick="dbBrowserExportCsv()">📥 Export page CSV</button>
                </div>`;
                window._dbBrowserLastData = data;
            }

            root.innerHTML = `<div style="display:grid;grid-template-columns:minmax(200px,260px) 1fr;gap:16px;align-items:start;">
                <div class="card"><div class="card-header">Tables (${tables.length})</div><div class="card-body" style="padding:0;max-height:70vh;overflow-y:auto;">
                    ${tables.map(t => `<button type="button" class="db-table-pick${t.name === selected ? ' active' : ''}" onclick="dbBrowserSelectTable('${escJs(t.name)}')" style="display:block;width:100%;text-align:left;padding:10px 14px;border:none;border-bottom:1px solid var(--border);background:${t.name === selected ? '#ebf8ff' : '#fff'};cursor:pointer;">
                        <strong>${escHtml(t.name)}</strong><br><small style="color:var(--text-secondary);">${t.rowCount ?? 0} rows</small>
                    </button>`).join('') || '<p style="padding:12px;">No tables found</p>'}
                </div></div>
                <div>${schemaHtml}${dataHtml}</div>
            </div>`;
        } catch (e) {
            root.innerHTML = `<div class="rbac-info-banner" style="margin:16px 0;"><strong>Error loading database:</strong> ${escHtml(e.message)}</div>`;
        }
    }

    window.dbBrowserSelectTable = function (name) {
        dbBrowserState.selectedTable = name;
        dbBrowserState.offset = 0;
        refreshDatabaseBrowserView();
    };

    window.dbBrowserPrevPage = function () {
        dbBrowserState.offset = Math.max(0, dbBrowserState.offset - dbBrowserState.limit);
        refreshDatabaseBrowserView();
    };

    window.dbBrowserNextPage = function () {
        dbBrowserState.offset += dbBrowserState.limit;
        refreshDatabaseBrowserView();
    };

    window.dbBrowserSetLimit = function (val) {
        dbBrowserState.limit = parseInt(val, 10) || 50;
        dbBrowserState.offset = 0;
        refreshDatabaseBrowserView();
    };

    window.dbBrowserExportCsv = function () {
        const data = window._dbBrowserLastData;
        if (!data) return;
        exportResultsCsv(data.columns, data.rows, `${dbBrowserState.selectedTable || 'table'}-export.csv`);
    };

  // ─── Query Developer ────────────────────────────────────────────
    window.renderQueryDeveloper = function (container) {
        if (!canUseDatabaseTools()) return renderAccessDenied(container);

        const pages = readSavedPages();
        container.innerHTML = `<div class="page-header">
            <h1>🧪 Query Developer</h1>
            ${typeof renderAdminBreadcrumb === 'function' ? renderAdminBreadcrumb('Query Developer') : ''}
            <p class="page-subtitle" style="margin-top:8px;color:var(--text-secondary);">Write SELECT queries against the database, test results, and publish them as custom menu pages.</p>
        </div>
        ${apiReady() ? '' : renderBackendRequiredBanner()}
        <div class="db-query-layout">
            <div class="card" style="margin-bottom:16px;">
                <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
                    <span>SQL Editor <small style="font-weight:normal;color:var(--text-secondary);">(SELECT only · max 500 rows)</small></span>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;">
                        <button class="btn btn-primary btn-sm" onclick="runQueryDeveloperSql()">▶ Run query</button>
                        <button class="btn btn-outline btn-sm" onclick="saveQueryAsCustomPage()">💾 Save as page</button>
                    </div>
                </div>
                <div class="card-body">
                    <textarea id="queryDevSql" class="form-control db-sql-editor" rows="8" placeholder="SELECT trip_number, truck, status FROM trips LIMIT 50">${escHtml(queryDevState.lastSql)}</textarea>
                    <div id="queryDevStatus" style="margin-top:8px;font-size:12px;color:var(--text-secondary);"></div>
                </div>
            </div>
            <div id="queryDevResults"></div>
            <div class="card" style="margin-top:20px;">
                <div class="card-header">Saved custom pages (${pages.length})</div>
                <div class="card-body" style="padding:0;">
                    <table style="width:100%;font-size:13px;">
                        <thead><tr style="background:#f7fafc;"><th style="padding:10px;text-align:left;">Page</th><th>Published</th><th>SQL preview</th><th>Actions</th></tr></thead>
                        <tbody>${pages.length ? pages.map(p => `<tr>
                            <td style="padding:10px;">${escHtml(p.icon || '📄')} <strong>${escHtml(p.title)}</strong></td>
                            <td style="padding:10px;">${p.published ? '<span class="status-badge green">Yes</span>' : '<span class="status-badge orange">Draft</span>'}</td>
                            <td style="padding:10px;max-width:320px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:monospace;font-size:11px;">${escHtml(p.sql)}</td>
                            <td style="padding:10px;white-space:nowrap;">
                                <button class="btn btn-outline btn-sm" onclick="loadQueryPageIntoEditor('${escJs(p.id)}')">Edit</button>
                                <button class="btn btn-outline btn-sm" onclick="navigateToCustomSqlPage('${escJs(p.id)}')">Open</button>
                                <button class="btn btn-outline btn-sm" onclick="toggleQueryPagePublished('${escJs(p.id)}')">${p.published ? 'Unpublish' : 'Publish'}</button>
                                <button class="btn btn-danger btn-sm" onclick="deleteQueryPage('${escJs(p.id)}')">🗑️</button>
                            </td>
                        </tr>`).join('') : '<tr><td colspan="4" style="padding:20px;text-align:center;color:var(--text-secondary);">No saved pages yet. Run a query and click <strong>Save as page</strong>.</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>`;

        if (queryDevState.lastResult) {
            renderQueryDevResults(queryDevState.lastResult);
        }
    };

    window.runQueryDeveloperSql = async function () {
        const sql = document.getElementById('queryDevSql')?.value?.trim();
        const status = document.getElementById('queryDevStatus');
        if (!sql) {
            if (status) status.textContent = 'Enter a SQL query first.';
            return;
        }
        if (!apiReady()) {
            if (status) status.textContent = 'API not connected.';
            return;
        }
        if (status) status.textContent = 'Running…';
        try {
            const result = await runDbQueryApi(sql);
            queryDevState.lastSql = sql;
            queryDevState.lastResult = result;
            if (status) {
                status.textContent = `${result.rowCount} row(s) in ${result.durationMs}ms${result.truncated ? ' (limit reached)' : ''}`;
            }
            renderQueryDevResults(result);
        } catch (e) {
            if (status) status.textContent = `Error: ${e.message}`;
            document.getElementById('queryDevResults').innerHTML = `<div class="rbac-info-banner" style="margin-top:12px;">${escHtml(e.message)}</div>`;
        }
    };

    function renderQueryDevResults(result) {
        const el = document.getElementById('queryDevResults');
        if (!el || !result) return;
        el.innerHTML = `<div class="card"><div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
            <span>Results</span>
            <button class="btn btn-outline btn-sm" onclick="exportQueryDevCsv()">📥 Export CSV</button>
        </div><div class="card-body" style="padding:0;">
            ${renderResultsTable(result.columns, result.rows, { meta: `${result.rowCount} rows · ${result.durationMs}ms`, maxHeight: '420px' })}
        </div></div>`;
        window._queryDevLastResult = result;
    }

    window.exportQueryDevCsv = function () {
        const r = window._queryDevLastResult;
        if (!r) return;
        exportResultsCsv(r.columns, r.rows, 'query-export.csv');
    };

    window.saveQueryAsCustomPage = function () {
        const sql = document.getElementById('queryDevSql')?.value?.trim();
        if (!sql) {
            showToast('Enter SQL before saving', 'warning');
            return;
        }
        const existing = queryDevState.editingPageId ? getSavedPage(queryDevState.editingPageId) : null;
        const title = prompt('Page title (shown in menu):', existing?.title || 'My Data Page');
        if (!title) return;
        const icon = prompt('Menu icon (emoji):', existing?.icon || '📊') || '📊';
        const published = confirm('Publish this page to the sidebar now?\n\nOK = Published (visible in Development menu)\nCancel = Save as draft only');

        const pages = readSavedPages();
        const id = existing?.id || generatePageId();
        const page = {
            id,
            title: title.trim(),
            icon: icon.trim() || '📄',
            sql,
            published,
            updatedAt: new Date().toISOString()
        };
        const idx = pages.findIndex(p => p.id === id);
        if (idx >= 0) pages[idx] = page;
        else pages.unshift(page);
        writeSavedPages(pages);
        queryDevState.editingPageId = id;
        showToast(`Page "${title}" saved${published ? ' and published' : ''}`, 'success');
        if (typeof logAuditEvent === 'function') {
            logAuditEvent(`Saved SQL page: ${title}`, id, 'sql_page', sql.slice(0, 200));
        }
        const ca = document.getElementById('contentArea');
        if (currentPage === 'admin-query-developer' && ca) renderQueryDeveloper(ca);
    };

    window.loadQueryPageIntoEditor = function (id) {
        const page = getSavedPage(id);
        if (!page) return;
        queryDevState.editingPageId = id;
        queryDevState.lastSql = page.sql;
        const ta = document.getElementById('queryDevSql');
        if (ta) ta.value = page.sql;
        showToast(`Loaded "${page.title}" into editor`, 'success');
    };

    window.toggleQueryPagePublished = function (id) {
        const pages = readSavedPages();
        const page = pages.find(p => p.id === id);
        if (!page) return;
        page.published = !page.published;
        page.updatedAt = new Date().toISOString();
        writeSavedPages(pages);
        showToast(page.published ? 'Page published to Development menu' : 'Page unpublished', 'success');
        const ca = document.getElementById('contentArea');
        if (currentPage === 'admin-query-developer' && ca) renderQueryDeveloper(ca);
    };

    window.deleteQueryPage = function (id) {
        const page = getSavedPage(id);
        if (!page || !confirm(`Delete page "${page.title}"?`)) return;
        writeSavedPages(readSavedPages().filter(p => p.id !== id));
        showToast('Page deleted', 'success');
        const ca = document.getElementById('contentArea');
        if (currentPage === 'admin-query-developer' && ca) renderQueryDeveloper(ca);
        if (currentCustomSqlPageId === id) navigateTo('dashboard');
    };

  // ─── Custom SQL pages (published from Query Developer) ──────────
    window.navigateToCustomSqlPage = function (pageId) {
        currentCustomSqlPageId = pageId;
        navigateTo('custom-sql-page');
    };

    window.renderCustomSqlPage = async function (container) {
        const page = getSavedPage(currentCustomSqlPageId);
        if (!page) {
            container.innerHTML = `<div class="page-header"><h1>Custom page not found</h1></div>
                <button class="btn btn-outline" onclick="navigateToAdmin('admin-query-developer')">← Query Developer</button>`;
            return;
        }
        if (!canUseDatabaseTools() && !page.published) {
            return renderAccessDenied(container);
        }

        container.innerHTML = `<div class="page-header">
            <h1>${escHtml(page.icon)} ${escHtml(page.title)}</h1>
            <div class="breadcrumb"><a href="#" onclick="event.preventDefault();navigateTo('dashboard')">Home</a> <span>›</span> <strong>${escHtml(page.title)}</strong></div>
        </div>
        ${apiReady() ? '' : renderBackendRequiredBanner()}
        <div class="card"><div class="card-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
            <span>Live query results</span>
            <div style="display:flex;gap:8px;">
                <button class="btn btn-outline btn-sm" onclick="refreshCustomSqlPage()">🔄 Refresh</button>
                ${canUseDatabaseTools() ? `<button class="btn btn-outline btn-sm" onclick="navigateToAdmin('admin-query-developer')">🧪 Edit in Query Developer</button>` : ''}
            </div>
        </div>
        <div class="card-body" id="customSqlPageBody"><p style="color:var(--text-secondary);">Loading…</p></div></div>
        <details style="margin-top:16px;font-size:12px;color:var(--text-secondary);"><summary>SQL query</summary><pre style="background:#f7fafc;padding:12px;border-radius:8px;overflow:auto;">${escHtml(page.sql)}</pre></details>`;

        await refreshCustomSqlPageData(page);
    };

    async function refreshCustomSqlPageData(page) {
        const body = document.getElementById('customSqlPageBody');
        if (!body) return;
        if (!apiReady()) return;
        try {
            const result = await runDbQueryApi(page.sql);
            body.innerHTML = renderResultsTable(result.columns, result.rows, {
                meta: `${result.rowCount} row(s) · ${result.durationMs}ms`,
                maxHeight: '560px'
            }) + `<div style="margin-top:8px;"><button class="btn btn-outline btn-sm" onclick="exportCustomSqlPageCsv()">📥 Export CSV</button></div>`;
            window._customSqlPageResult = result;
        } catch (e) {
            body.innerHTML = `<div class="rbac-info-banner">${escHtml(e.message)}</div>`;
        }
    }

    window.refreshCustomSqlPage = function () {
        const page = getSavedPage(currentCustomSqlPageId);
        if (page) refreshCustomSqlPageData(page);
    };

    window.exportCustomSqlPageCsv = function () {
        const r = window._customSqlPageResult;
        const page = getSavedPage(currentCustomSqlPageId);
        if (!r) return;
        exportResultsCsv(r.columns, r.rows, `${(page?.title || 'page').replace(/\s+/g, '-')}.csv`);
    };

    window.refreshCustomSqlNav = function () {
        const nav = document.getElementById('customSqlNavSection');
        if (!nav) return;
        const pages = readSavedPages().filter(p => p.published);
        if (!canUseDatabaseTools() && !pages.length) {
            nav.style.display = 'none';
            return;
        }
        nav.style.display = pages.length || canUseDatabaseTools() ? '' : 'none';
        const list = document.getElementById('customSqlNavList');
        if (!list) return;
        list.innerHTML = pages.map(p => `
            <a class="nav-item" onclick="navigateToCustomSqlPage('${escJs(p.id)}')" data-page="custom-sql-page" data-custom-sql-id="${escHtml(p.id)}">
                <span class="icon">${escHtml(p.icon || '📄')}</span> ${escHtml(p.title)}
            </a>
        `).join('');
    };

    window.initCustomSqlNav = function () {
        refreshCustomSqlNav();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCustomSqlNav);
    } else {
        initCustomSqlNav();
    }
})();
