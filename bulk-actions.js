/**
 * Bulk list actions toolbar — shown when row checkboxes are selected.
 * Trip modules: NB, SB, Border, POD. Asset module: subset of actions.
 */
(function () {
    const TRIP_ACTIONS = [
        { id: 'send_sms', icon: '💬', label: 'Send Sms', permission: 'edit', instant: false },
        { id: 'set_trip_details', icon: '〰️', label: 'Set trip details', permission: 'edit' },
        { id: 'assign_tags', icon: '🏷️', label: 'Assign Tags', permission: 'edit' },
        { id: 'create_task', icon: '☑️', label: 'Create Task', permission: 'edit' },
        { id: 'clear_dn', icon: '🚫', label: 'Clear DN', permission: 'edit', instant: true },
        { id: 'replace_tags', icon: '🏷️', label: 'Replace Tags', permission: 'edit' },
        { id: 'unplug_trailer', icon: '🚫', label: 'Unplug Trailer', permission: 'edit', instant: true },
        { id: 'area_notification', icon: '⚠️', label: 'Create Area Notification', permission: 'edit' },
        { id: 'bulk_comments', icon: '💬', label: 'Bulk Comments', permission: 'edit' },
        { id: 'request_update', icon: '🔔', label: 'Request Update', permission: 'edit', instant: true },
        { id: 'set_location', icon: '🚩', label: 'Set Location', permission: 'edit' },
        { id: 'upload_files', icon: '📤', label: 'Upload Files', permission: 'edit' },
        { id: 'history_report', icon: '📋', label: 'Show History Report', permission: 'view' },
        { id: 'delete', icon: '🗑️', label: 'Delete', permission: 'delete', className: 'bulk-action-danger' },
        { id: 'restore', icon: '♻️', label: 'Restore', permission: 'restore', className: 'soft-delete-restore' }
    ];

    const ASSET_ACTIONS = [
        { id: 'assign_tags', icon: '🏷️', label: 'Assign Tags', permission: 'edit' },
        { id: 'bulk_comments', icon: '💬', label: 'Bulk Comments', permission: 'edit' },
        { id: 'upload_files', icon: '📤', label: 'Upload Files', permission: 'edit' },
        { id: 'delete', icon: '🗑️', label: 'Delete', permission: 'delete', className: 'bulk-action-danger' },
        { id: 'restore', icon: '♻️', label: 'Restore', permission: 'restore', className: 'soft-delete-restore' }
    ];

    const STATUS_CONTEXT_BY_LIST = {
        nb: 'nb',
        sb: 'sb',
        border: 'border',
        borderNb: 'border',
        borderSb: 'border',
        pod: 'pod'
    };

    if (!window.bulkTasksDB) window.bulkTasksDB = [];

    function escJs(val) {
        return String(val ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    }

    function escHtml(val) {
        return String(val ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function getListCfg(listKey) {
        return window.LIST_BULK_DELETE_CONFIG?.[listKey] || null;
    }

    function getEntityType(listKey) {
        const cfg = getListCfg(listKey);
        return cfg?.entityType || 'trip';
    }

    function getSelectedIds(listKey) {
        return (window.listRowSelections?.[listKey] || []).slice();
    }

    function getSelectedRecords(listKey) {
        const cfg = getListCfg(listKey);
        const ids = getSelectedIds(listKey);
        if (!cfg) return { ids, records: [], cfg: null };
        const all = cfg.getData();
        const records = all.filter(r => ids.includes(cfg.getRowId(r)));
        return { ids, records, cfg };
    }

    function resolveTrip(tripId) {
        if (window.tripsDB?.[tripId]) return window.tripsDB[tripId];
        const border = (window.borderClearanceTrucks || []).find(b => b.trip === tripId);
        const pod = (window.podDB || []).find(p => p.trip === tripId);
        const stub = {
            tripNumber: tripId,
            truck: border?.truck || pod?.truck || '—',
            driver: border?.driver || pod?.driver || '—',
            direction: border?.direction || (String(tripId).startsWith('SB') ? 'SB' : 'NB'),
            area: border?.border || pod?.area || '—',
            tags: [],
            positions: {}
        };
        window.tripsDB[tripId] = stub;
        return stub;
    }

    function getTripIdsFromSelection(listKey) {
        const { ids, records, cfg } = getSelectedRecords(listKey);
        if (!cfg) return [];
        if (cfg.entityType === 'asset') return [];
        return ids.length ? ids : records.map(cfg.getRowId);
    }

    function canBulkAction(listKey, action) {
        const cfg = getListCfg(listKey);
        if (!cfg) return false;
        if (action.permission === 'delete') {
            return typeof canSoftDeleteRecord === 'function' && canSoftDeleteRecord(cfg.moduleId, '_global');
        }
        if (action.permission === 'restore') {
            return typeof canRestoreRecords === 'function' && canRestoreRecords();
        }
        if (action.permission === 'view') {
            return typeof canAccessModule === 'function' ? canAccessModule(cfg.moduleId) : true;
        }
        return typeof canEditInModule === 'function' && canEditInModule(cfg.moduleId, '_global');
    }

    function getActionsForList(listKey) {
        const entity = getEntityType(listKey);
        return entity === 'asset' ? ASSET_ACTIONS : TRIP_ACTIONS;
    }

    function refreshList(listKey) {
        const cfg = getListCfg(listKey);
        if (cfg?.refreshFn && typeof window[cfg.refreshFn] === 'function') window[cfg.refreshFn]();
    }

    function getCurrentUserName() {
        return typeof getCurrentAdminUser === 'function' ? (getCurrentAdminUser()?.username || 'system') : 'system';
    }

    function ensureTripTags(trip) {
        if (!Array.isArray(trip.tags)) trip.tags = [];
    }

    function ensureAssetTags(asset) {
        if (!Array.isArray(asset.tags)) asset.tags = [];
    }

    window.renderListBulkActionBar = function (listKey) {
        const cfg = getListCfg(listKey);
        if (!cfg) return '';
        const count = getSelectedIds(listKey).length;
        const actions = getActionsForList(listKey).filter(a => canBulkAction(listKey, a));
        if (!actions.length) return '';
        const buttons = actions.map(a => {
            const cls = ['list-bulk-action-btn', a.className || ''].filter(Boolean).join(' ');
            if (a.id === 'delete') {
                return `<button type="button" class="${cls}" data-action="${a.id}" onclick="bulkSoftDeleteSelected('${escJs(listKey)}')"><span class="list-bulk-action-icon">${a.icon}</span><span class="list-bulk-action-label">${a.label}</span></button>`;
            }
            if (a.id === 'restore') {
                return `<button type="button" class="${cls}" data-action="${a.id}" onclick="bulkRestoreSelected('${escJs(listKey)}')"><span class="list-bulk-action-icon">${a.icon}</span><span class="list-bulk-action-label">${a.label}</span></button>`;
            }
            if (a.instant) {
                return `<button type="button" class="${cls}" data-action="${a.id}" onclick="runBulkInstantAction('${escJs(listKey)}','${a.id}')"><span class="list-bulk-action-icon">${a.icon}</span><span class="list-bulk-action-label">${a.label}</span></button>`;
            }
            return `<button type="button" class="${cls}" data-action="${a.id}" onclick="openBulkActionModal('${escJs(listKey)}','${a.id}')"><span class="list-bulk-action-icon">${a.icon}</span><span class="list-bulk-action-label">${a.label}</span></button>`;
        }).join('');
        return `
            <div id="${listKey}BulkActions" class="list-bulk-actions" style="display:${count > 0 ? 'flex' : 'none'};" role="toolbar" aria-label="Bulk actions for selected rows">
                <span class="list-bulk-actions-count">${count ? `${count} selected` : ''}</span>
                <div class="list-bulk-actions-buttons">${buttons}</div>
                <button type="button" class="btn btn-outline btn-sm list-bulk-action-clear" onclick="clearListSelection('${escJs(listKey)}')" title="Clear selection" aria-label="Clear selection">✕</button>
            </div>`;
    };

    window.runBulkInstantAction = function (listKey, actionId) {
        const tripIds = getTripIdsFromSelection(listKey);
        if (!tripIds.length) {
            if (typeof showToast === 'function') showToast('No rows selected', 'warning');
            return;
        }
        if (actionId === 'clear_dn') {
            if (!confirm(`Clear delivery note (DN) for ${tripIds.length} selected trip(s)?`)) return;
            tripIds.forEach(id => {
                const trip = resolveTrip(id);
                trip.deliveryNote = '';
                trip.dnNumber = '';
                if (typeof logAuditEvent === 'function') logAuditEvent('Cleared DN (bulk)', id, 'trip');
            });
            if (typeof showToast === 'function') showToast(`DN cleared on ${tripIds.length} trip(s)`, 'success');
            refreshList(listKey);
            return;
        }
        if (actionId === 'unplug_trailer') {
            if (!confirm(`Unplug trailer for ${tripIds.length} selected trip(s)?`)) return;
            tripIds.forEach(id => {
                const trip = resolveTrip(id);
                trip.trailer1 = '';
                trip.trailer2 = '';
                trip.trailer = '';
                if (typeof logAuditEvent === 'function') logAuditEvent('Unplugged trailer (bulk)', id, 'trip');
            });
            if (typeof showToast === 'function') showToast(`Trailer unplugged on ${tripIds.length} trip(s)`, 'success');
            refreshList(listKey);
            return;
        }
        if (actionId === 'request_update') {
            const note = prompt(`Request status update from drivers/operators for ${tripIds.length} trip(s).\n\nMessage (optional):`, 'Please send a position and status update.');
            if (note === null) return;
            tripIds.forEach(id => {
                const trip = resolveTrip(id);
                trip.updateRequestedAt = new Date().toISOString();
                trip.updateRequestedBy = getCurrentUserName();
                if (typeof recordTripAreaUpdate === 'function') {
                    recordTripAreaUpdate(id, trip.area || trip.entryBorder || trip.exitBorder || 'Operations', 'Update Requested', note, null, null);
                } else if (typeof logAuditEvent === 'function') {
                    logAuditEvent('Update requested (bulk)', id, 'trip', note);
                }
            });
            if (typeof showToast === 'function') showToast(`Update requested for ${tripIds.length} trip(s)`, 'success');
            refreshList(listKey);
        }
    };

    let bulkModalState = { listKey: null, actionId: null };

    window.openBulkActionModal = function (listKey, actionId) {
        const { ids, records, cfg } = getSelectedRecords(listKey);
        if (!ids.length) {
            if (typeof showToast === 'function') showToast('No rows selected', 'warning');
            return;
        }
        bulkModalState = { listKey, actionId };
        const titleEl = document.getElementById('bulkActionModalTitle');
        const bodyEl = document.getElementById('bulkActionModalBody');
        const footerEl = document.getElementById('bulkActionModalFooter');
        if (!titleEl || !bodyEl) return;

        const action = getActionsForList(listKey).find(a => a.id === actionId);
        titleEl.textContent = `${action?.label || actionId} — ${ids.length} selected`;

        if (actionId === 'history_report') {
            bodyEl.innerHTML = renderHistoryReportBody(listKey, ids);
            if (footerEl) footerEl.innerHTML = `<button class="btn btn-outline" onclick="closeModal('bulkActionModal')">Close</button><button class="btn btn-primary" onclick="downloadBulkHistoryReport('${escJs(listKey)}')">📥 Download CSV</button>`;
            document.getElementById('bulkActionModal')?.classList.add('show');
            return;
        }

        if (actionId === 'send_sms') {
            bodyEl.innerHTML = renderSendSmsBody(ids);
            if (footerEl) footerEl.innerHTML = `<button class="btn btn-outline" onclick="closeModal('bulkActionModal')">Close</button>`;
            document.getElementById('bulkActionModal')?.classList.add('show');
            return;
        }

        bodyEl.innerHTML = renderBulkFormBody(listKey, actionId, ids, cfg);
        if (footerEl) {
            footerEl.innerHTML = `<button class="btn btn-outline" onclick="closeModal('bulkActionModal')">Cancel</button><button class="btn btn-primary" onclick="submitBulkActionModal()">Apply</button>`;
        }
        document.getElementById('bulkActionModal')?.classList.add('show');
    };

    function renderSendSmsBody(tripIds) {
        const defaultMsg = 'Please confirm your current position and trip status.';
        const rows = tripIds.map(id => {
            const trip = resolveTrip(id);
            const dc = typeof findDriverContactByTrip === 'function' ? findDriverContactByTrip(id) : null;
            const phone = dc?.whatsapp || dc?.drcNumber || '';
            return `<tr data-trip="${escHtml(id)}">
                <td><strong>${escHtml(id)}</strong></td>
                <td>${escHtml(trip.driver || '—')}</td>
                <td>${phone ? escHtml(phone) : '<span class="text-muted">No contact</span>'}</td>
                <td class="bulk-sms-send-cell">${phone ? `<button type="button" class="btn btn-outline btn-sm" onclick="sendBulkSmsToTrip('${escJs(id)}')">Send SMS</button>` : '—'}</td>
            </tr>`;
        }).join('');
        return `
            <div class="form-group"><label>SMS template</label><textarea class="form-control" id="bulkSmsTemplate" rows="2">${escHtml(defaultMsg)}</textarea></div>
            <p class="field-hint" style="margin-bottom:12px;">Opens your device SMS app per driver. Register contacts in Driver Registry if missing.</p>
            <div style="overflow-x:auto;"><table class="bulk-sms-table"><thead><tr><th>Trip</th><th>Driver</th><th>WhatsApp / DRC</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
    }

    window.sendBulkSmsToTrip = function (tripId) {
        const msg = document.getElementById('bulkSmsTemplate')?.value || 'Please confirm your current position and trip status.';
        const dc = typeof findDriverContactByTrip === 'function' ? findDriverContactByTrip(tripId) : null;
        const phone = (dc?.whatsapp || dc?.drcNumber || '').replace(/\s/g, '');
        if (!phone) {
            if (typeof showToast === 'function') showToast('No driver contact on file for this trip', 'warning');
            return;
        }
        window.open(`sms:${phone}?body=${encodeURIComponent(msg)}`, '_blank');
    };

    function renderBulkFormBody(listKey, actionId, ids, cfg) {
        const count = ids.length;
        const common = `<p class="bulk-action-summary">${count} record${count !== 1 ? 's' : ''} selected</p>`;
        if (actionId === 'set_trip_details') {
            return `${common}
                <div class="form-grid-2">
                    <div class="form-group"><label>Status</label><input class="form-control" id="bulkTripStatus" placeholder="Leave blank to keep current"></div>
                    <div class="form-group"><label>Area</label><input class="form-control" id="bulkTripArea" placeholder="e.g. Kasumbalesa"></div>
                    <div class="form-group"><label>Border</label><input class="form-control" id="bulkTripBorder" placeholder="Entry / exit border"></div>
                    <div class="form-group"><label>Offloading / Loading point</label><input class="form-control" id="bulkTripPoint" placeholder="Location point"></div>
                </div>
                <div class="form-group"><label>Notes (logged on each trip)</label><textarea class="form-control" id="bulkTripNotes" rows="2"></textarea></div>`;
        }
        if (actionId === 'assign_tags' || actionId === 'replace_tags') {
            return `${common}
                <div class="form-group"><label>${actionId === 'replace_tags' ? 'Replace with tags' : 'Tags to add'} (comma-separated)</label>
                <input class="form-control" id="bulkTagsInput" placeholder="e.g. Priority, VIP, Hold"></div>
                <p class="field-hint">${actionId === 'replace_tags' ? 'Existing tags will be replaced.' : 'Tags are merged with any existing tags.'}</p>`;
        }
        if (actionId === 'create_task') {
            return `${common}
                <div class="form-group"><label>Task title *</label><input class="form-control" id="bulkTaskTitle" placeholder="e.g. Follow up border clearance"></div>
                <div class="form-grid-2">
                    <div class="form-group"><label>Due date</label><input type="datetime-local" class="form-control" id="bulkTaskDue"></div>
                    <div class="form-group"><label>Assignee</label><input class="form-control" id="bulkTaskAssignee" placeholder="Username or team"></div>
                </div>
                <div class="form-group"><label>Description</label><textarea class="form-control" id="bulkTaskDesc" rows="2"></textarea></div>`;
        }
        if (actionId === 'area_notification') {
            return `${common}
                <div class="form-group"><label>Notification message *</label><textarea class="form-control" id="bulkAreaNotifMsg" rows="3" placeholder="Alert message for area teams"></textarea></div>
                <div class="form-group"><label>Priority</label><select class="form-control" id="bulkAreaNotifPriority"><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></div>`;
        }
        if (actionId === 'bulk_comments') {
            const entity = cfg?.entityType || 'trip';
            return `${common}
                <div class="form-group"><label>Comment *</label><textarea class="form-control" id="bulkCommentText" rows="3" placeholder="Applied to all selected ${entity === 'asset' ? 'assets' : 'trips'}"></textarea></div>
                ${entity === 'trip' ? `<div class="form-group"><label>Status update (optional)</label><input class="form-control" id="bulkCommentStatus" placeholder="Leave blank for comment only"></div>` : ''}`;
        }
        if (actionId === 'set_location') {
            return `${common}
                <div class="form-group"><label>Location / position *</label><input class="form-control" id="bulkLocationInput" placeholder="e.g. KBP Parking, Kolwezi Mine gate"></div>
                <div class="form-group"><label>GPS / map link (optional)</label><input class="form-control" id="bulkLocationGps" placeholder="https://maps.google.com/..."></div>`;
        }
        if (actionId === 'upload_files') {
            return `${common}
                <div class="form-group"><label>File description</label><input class="form-control" id="bulkFileDesc" placeholder="e.g. POD scan, border document"></div>
                <div class="form-group"><label>Select files</label><input type="file" class="form-control" id="bulkFileInput" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"></div>
                <p class="field-hint">Files are attached to each selected record.</p>`;
        }
        return common;
    }

    function renderHistoryReportBody(listKey, ids) {
        const sections = ids.map(id => {
            const history = typeof getTripAreaHistory === 'function' ? getTripAreaHistory(id) : (window.tripAreaUpdatesDB?.[id] || []);
            const trip = resolveTrip(id);
            const rows = history.length
                ? history.map(h => `<tr><td>${escHtml(h.status || '—')}</td><td>${escHtml(h.area || '—')}</td><td>${escHtml(h.notes || '')}</td><td>${escHtml(h.updatedBy || '')}</td><td>${escHtml(h.timestamp || h.statusDate || '')}</td></tr>`).join('')
                : '<tr><td colspan="5" class="text-muted">No history entries</td></tr>';
            return `<div class="bulk-history-section"><h4>${escHtml(id)} — ${escHtml(trip.truck || '')} / ${escHtml(trip.driver || '')}</h4>
                <table><thead><tr><th>Status</th><th>Area</th><th>Notes</th><th>User</th><th>Date</th></tr></thead><tbody>${rows}</tbody></table></div>`;
        }).join('');
        return `<div class="bulk-history-report">${sections || '<p>No data</p>'}</div>`;
    }

    window.downloadBulkHistoryReport = function (listKey) {
        const ids = getTripIdsFromSelection(listKey);
        const headers = ['Trip', 'Status', 'Area', 'Notes', 'User', 'Date'];
        const rows = [];
        ids.forEach(id => {
            const history = typeof getTripAreaHistory === 'function' ? getTripAreaHistory(id) : (window.tripAreaUpdatesDB?.[id] || []);
            if (!history.length) rows.push([id, '', '', '', '', '']);
            else history.forEach(h => rows.push([id, h.status || '', h.area || '', h.notes || '', h.updatedBy || '', h.timestamp || h.statusDate || '']));
        });
        if (typeof downloadExcelCsv === 'function') {
            downloadExcelCsv(`History_Report_${listKey}_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
        }
        if (typeof showToast === 'function') showToast(`Exported history for ${ids.length} trip(s)`, 'success');
    };

    window.submitBulkActionModal = function () {
        const { listKey, actionId } = bulkModalState;
        if (!listKey || !actionId) return;
        const { ids, cfg } = getSelectedRecords(listKey);
        if (!ids.length) return;

        if (actionId === 'set_trip_details') {
            const status = document.getElementById('bulkTripStatus')?.value.trim();
            const area = document.getElementById('bulkTripArea')?.value.trim();
            const border = document.getElementById('bulkTripBorder')?.value.trim();
            const point = document.getElementById('bulkTripPoint')?.value.trim();
            const notes = document.getElementById('bulkTripNotes')?.value.trim();
            ids.forEach(id => {
                const trip = resolveTrip(id);
                if (status) trip.status = status;
                if (area) trip.area = area;
                if (border) {
                    if (trip.direction === 'SB') trip.exitBorder = border;
                    else trip.entryBorder = border;
                }
                if (point) {
                    if (trip.direction === 'SB') trip.loadingPoint = point;
                    else trip.offloadingPoint = point;
                }
                if (notes && typeof recordTripAreaUpdate === 'function') {
                    recordTripAreaUpdate(id, trip.area || area || 'Operations', trip.status || 'Updated', notes, null, null);
                }
            });
            if (typeof showToast === 'function') showToast(`Trip details updated for ${ids.length} trip(s)`, 'success');
        } else if (actionId === 'assign_tags' || actionId === 'replace_tags') {
            const raw = document.getElementById('bulkTagsInput')?.value || '';
            const tags = raw.split(',').map(t => t.trim()).filter(Boolean);
            if (!tags.length) { if (typeof showToast === 'function') showToast('Enter at least one tag', 'warning'); return; }
            if (cfg?.entityType === 'asset') {
                ids.forEach(id => {
                    const asset = typeof getAssetById === 'function' ? getAssetById(id) : (window.assetsRegistryDB || []).find(a => a.id === id);
                    if (!asset) return;
                    ensureAssetTags(asset);
                    asset.tags = actionId === 'replace_tags' ? [...tags] : [...new Set([...asset.tags, ...tags])];
                });
            } else {
                ids.forEach(id => {
                    const trip = resolveTrip(id);
                    ensureTripTags(trip);
                    trip.tags = actionId === 'replace_tags' ? [...tags] : [...new Set([...trip.tags, ...tags])];
                });
            }
            if (typeof showToast === 'function') showToast(`Tags ${actionId === 'replace_tags' ? 'replaced' : 'assigned'} on ${ids.length} record(s)`, 'success');
        } else if (actionId === 'create_task') {
            const title = document.getElementById('bulkTaskTitle')?.value.trim();
            if (!title) { if (typeof showToast === 'function') showToast('Task title is required', 'warning'); return; }
            const due = document.getElementById('bulkTaskDue')?.value || '';
            const assignee = document.getElementById('bulkTaskAssignee')?.value.trim() || '';
            const desc = document.getElementById('bulkTaskDesc')?.value.trim() || '';
            ids.forEach(id => {
                window.bulkTasksDB.push({
                    id: 'TASK-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
                    title, due, assignee, description: desc,
                    linkedId: id, listKey, createdAt: new Date().toISOString(), createdBy: getCurrentUserName(), status: 'open'
                });
            });
            if (typeof showToast === 'function') showToast(`Created task "${title}" for ${ids.length} record(s)`, 'success');
        } else if (actionId === 'area_notification') {
            const msg = document.getElementById('bulkAreaNotifMsg')?.value.trim();
            const priority = document.getElementById('bulkAreaNotifPriority')?.value || 'normal';
            if (!msg) { if (typeof showToast === 'function') showToast('Notification message is required', 'warning'); return; }
            ids.forEach(id => {
                const trip = resolveTrip(id);
                const area = trip.area || trip.entryBorder || trip.exitBorder || 'Operations';
                const note = `[${priority.toUpperCase()}] ${msg}`;
                if (typeof recordTripAreaUpdate === 'function') {
                    recordTripAreaUpdate(id, area, 'Area Notification', note, null, null);
                }
                if (typeof logAuditEvent === 'function') logAuditEvent('Area notification (bulk)', id, 'trip', note);
            });
            if (typeof showToast === 'function') showToast(`Area notification sent for ${ids.length} trip(s)`, 'success');
        } else if (actionId === 'bulk_comments') {
            const text = document.getElementById('bulkCommentText')?.value.trim();
            const status = document.getElementById('bulkCommentStatus')?.value.trim();
            if (!text) { if (typeof showToast === 'function') showToast('Comment is required', 'warning'); return; }
            if (cfg?.entityType === 'asset') {
                ids.forEach(id => {
                    const asset = typeof getAssetById === 'function' ? getAssetById(id) : null;
                    if (asset && typeof logAuditEvent === 'function') logAuditEvent('Bulk comment', id, 'asset', text);
                });
            } else {
                const ctx = STATUS_CONTEXT_BY_LIST[listKey] || 'nb';
                ids.forEach(id => {
                    if (status && typeof applyTripStatusUpdate === 'function') {
                        window.currentCommentTrip = id;
                        window.currentCommentStatusContext = ctx;
                        applyTripStatusUpdate(resolveTrip(id), status, text, new Date().toISOString().slice(0, 16));
                    } else if (typeof recordTripAreaUpdate === 'function') {
                        const trip = resolveTrip(id);
                        recordTripAreaUpdate(id, trip.area || 'Operations', trip.status || 'Comment', text, null, null);
                    }
                });
            }
            if (typeof showToast === 'function') showToast(`Comment applied to ${ids.length} record(s)`, 'success');
        } else if (actionId === 'set_location') {
            const loc = document.getElementById('bulkLocationInput')?.value.trim();
            const gps = document.getElementById('bulkLocationGps')?.value.trim();
            if (!loc) { if (typeof showToast === 'function') showToast('Location is required', 'warning'); return; }
            ids.forEach(id => {
                const trip = resolveTrip(id);
                if (!trip.positions) trip.positions = {};
                trip.positions.latest = { label: loc, gps: gps || '', updatedAt: new Date().toISOString(), updatedBy: getCurrentUserName() };
                trip.currentLocation = loc;
                if (typeof recordTripAreaUpdate === 'function') {
                    recordTripAreaUpdate(id, trip.area || 'Operations', 'Location Updated', `Set location: ${loc}${gps ? ' · ' + gps : ''}`, null, null);
                }
            });
            if (typeof showToast === 'function') showToast(`Location set on ${ids.length} trip(s)`, 'success');
        } else if (actionId === 'upload_files') {
            const input = document.getElementById('bulkFileInput');
            const desc = document.getElementById('bulkFileDesc')?.value.trim() || 'Bulk upload';
            const files = input?.files ? Array.from(input.files) : [];
            if (!files.length) { if (typeof showToast === 'function') showToast('Select at least one file', 'warning'); return; }
            const readFile = f => new Promise(resolve => {
                const reader = new FileReader();
                reader.onload = () => resolve({ name: f.name, dataUrl: reader.result });
                reader.readAsDataURL(f);
            });
            Promise.all(files.map(readFile)).then(fileData => {
                if (cfg?.entityType === 'asset') {
                    ids.forEach(id => {
                        const asset = typeof getAssetById === 'function' ? getAssetById(id) : null;
                        if (!asset) return;
                        if (!asset.documents) asset.documents = [];
                        fileData.forEach(fd => {
                            asset.documents.push({
                                type: desc, fileName: fd.name, uploadedAt: new Date().toISOString().slice(0, 10),
                                fileDataUrl: fd.dataUrl, status: 'valid'
                            });
                        });
                        if (typeof logAuditEvent === 'function') logAuditEvent('Bulk file upload', id, 'asset', desc);
                    });
                } else {
                    ids.forEach(id => {
                        const trip = resolveTrip(id);
                        if (!trip.attachments) trip.attachments = [];
                        fileData.forEach(fd => {
                            trip.attachments.push({
                                name: fd.name, description: desc, dataUrl: fd.dataUrl,
                                uploadedAt: new Date().toISOString(), uploadedBy: getCurrentUserName()
                            });
                        });
                        if (typeof logAuditEvent === 'function') logAuditEvent('Bulk file upload', id, 'trip', desc);
                    });
                }
                if (typeof showToast === 'function') showToast(`Attached ${files.length} file(s) to ${ids.length} record(s)`, 'success');
                closeModal('bulkActionModal');
                refreshList(listKey);
            });
            return;
        }

        closeModal('bulkActionModal');
        refreshList(listKey);
        if (typeof updateSidebarBadges === 'function') updateSidebarBadges();
    };
})();
