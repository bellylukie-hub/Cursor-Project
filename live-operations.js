/**
 * Live Operations — uploads, position files, area statuses, comm sync, API wiring
 */
(function () {
    const POSITION_SLOTS = ['morning', 'afternoon', 'evening'];
    const POSITION_SLOT_LABELS = { morning: '08:00', afternoon: '14:00', evening: '20:00' };

    window.globalStatusListsDB = {
        POD: ['Pending Collection', 'Collected On-Time', 'Collected Late', 'Scanned', 'Uploaded', 'Sent to Invoicing', 'Overdue'],
        ASSET: ['Active', 'Assigned to Trip', 'At Border', 'In Maintenance', 'Idle', 'Decommissioned'],
        CAR: ['Available', 'On Trip', 'At Loading', 'At Border', 'Dispatched', 'Returned']
    };

    window.uploadTemplatesDB = {
        NB: {
            name: 'NB Live Upload',
            columns: ['TripNumber', 'Truck', 'Driver', 'Owner', 'EntryBorder', 'OffloadingPoint', 'Area', 'BorderProcess', 'Status'],
            description: 'Northbound live file — uploaded trucks enter border clearance workflow'
        },
        SB: {
            name: 'SB Live Upload',
            columns: ['TripNumber', 'Truck', 'Driver', 'Owner', 'LoadingPoint', 'ExitBorder', 'Area', 'Status'],
            description: 'Southbound live file — trucks enter loading → documents → seal → escort → dispatch flow'
        },
        POSITION: {
            name: 'Position File (3× daily)',
            columns: ['TripNumber', 'Truck', 'Latitude', 'Longitude', 'Area', 'AreaStatus', 'ProcessComment', 'Timestamp'],
            description: 'Position upload 3× per day — must match trucks from NB live file. Shows with area comments and process dates.'
        }
    };

    window.liveUploadsDB = [];
    window.positionUploadsDB = [];
    let nextLiveUploadId = 1;
    let nextPositionUploadId = 1;

    function normalizeAreaRecord(rec) {
        if (rec.statusesNB !== undefined) return rec;
        const all = rec.statuses || [];
        return {
            ...rec,
            isBorder: ['Kasumbalesa', 'Sakania', 'Mokambo'].includes(rec.area),
            borderForNB: ['Kasumbalesa', 'Sakania', 'Mokambo'].includes(rec.area),
            borderForSB: ['Kasumbalesa', 'Sakania', 'Mokambo'].includes(rec.area),
            isOffloadingPoint: ['Kolwezi', 'Lubumbashi', 'Likasi', 'Kanyaka'].includes(rec.area),
            isLoadingPoint: ['Kolwezi', 'Kanyaka'].includes(rec.area),
            isKanyakaHub: rec.area === 'Kanyaka',
            kanyakaForNB: rec.area === 'Kanyaka',
            kanyakaForSB: rec.area === 'Kanyaka',
            statusesNB: rec.area === 'Kanyaka' ? all.filter(s => s.includes('Transit') || s.includes('Depot')) : all,
            statusesSB: rec.area === 'Kanyaka' ? all.filter(s => !s.includes('Transit to')) : all,
            statusesBorderNB: rec.area === 'Kasumbalesa' ? ['KBP Parking', 'KBP Scan Bay', 'Whisky Process', 'Customs Clearance'] : all.slice(0, 4),
            statusesBorderSB: ['Gov List Uploaded', 'Customs Declaration', 'Seal Verification', 'Exit to Zambia']
        };
    }

    window.migrateAreaStatusesDB = function () {
        if (!window.areaStatusesDB) return;
        window.areaStatusesDB = window.areaStatusesDB.map(normalizeAreaRecord);
    };

    window.getStatusesForContext = function (trip) {
        if (!trip) return [];
        const lists = [];
        const areaRec = (window.areaStatusesDB || []).find(a => a.area === trip.area || a.area === trip.entryBorder || a.area === trip.exitBorder);

        if (trip.direction === 'NB') {
            if (trip.workflow?.border === 'current' || (trip.status && /border|kbp|whisky/i.test(trip.status))) {
                const borderArea = trip.entryBorder || trip.area;
                const br = (window.areaStatusesDB || []).find(a => a.area === borderArea && a.isBorder);
                if (br) lists.push(...(br.statusesBorderNB || br.statusesNB || []));
            }
            if (trip.workflow?.kanyaka === 'current') {
                const k = (window.areaStatusesDB || []).find(a => a.isKanyakaHub);
                if (k) lists.push(...(k.statusesNB || []).filter(s => s.includes('Kanyaka') || s.includes('Transit') || s.includes('Gov')));
            }
            if (trip.workflow?.offloading === 'current') {
                const off = (window.areaStatusesDB || []).find(a => a.isOffloadingPoint && (a.area === trip.area || pointMatches(trip.offloadingPoint, a.area)));
                if (off) lists.push(...(off.statusesNB || []));
            }
            if (trip.workflow?.pod === 'current') lists.push(...(window.globalStatusListsDB.POD || []));
            if (areaRec) lists.push(...(areaRec.statusesNB || []));
        } else if (trip.direction === 'SB') {
            const wf = trip.workflow || {};
            if (wf.loadingProcess === 'current') {
                const load = (window.areaStatusesDB || []).find(a => a.isLoadingPoint);
                if (load) lists.push(...(load.statusesSB || []).filter(s => /load/i.test(s)));
            }
            if (wf.documents === 'current') lists.push('Documents Collected', 'TR8 Received', 'Permits Verified');
            if (wf.seal === 'current') lists.push('Seal Collected', 'Seal Verified');
            if (wf.escort === 'current') lists.push('Escort Arranged', 'Escort Assigned');
            if (wf.dispatch === 'current') lists.push('Dispatched', 'En Route');
            if (wf.kanyaka === 'current') {
                const k = (window.areaStatusesDB || []).find(a => a.isKanyakaHub);
                if (k) lists.push(...(k.statusesSB || []));
            }
            if (wf.border === 'current') {
                const br = (window.areaStatusesDB || []).find(a => a.area === (trip.exitBorder || trip.driverExitBorder) && a.isBorder);
                if (br) lists.push(...(br.statusesBorderSB || br.statusesSB || []));
            }
            if (areaRec) lists.push(...(areaRec.statusesSB || []));
        }

        if (trip.assetContext) lists.push(...(window.globalStatusListsDB.ASSET || []));
        if (trip.carContext) lists.push(...(window.globalStatusListsDB.CAR || []));

        return [...new Set(lists.filter(Boolean))];
    };

    function pointMatches(point, area) {
        if (!point || !area) return false;
        return point.toLowerCase().includes(area.toLowerCase());
    }

    window.getStatusesForArea = function (areaName) {
        const rec = (window.areaStatusesDB || []).find(a => a.area === areaName);
        if (!rec) return [];
        return [...new Set([...(rec.statusesNB || []), ...(rec.statusesSB || [])])];
    };

    window.syncAdminUsersToInternalComm = function () {
        if (!window.adminUsersDB || !window.systemUsersDB) return;
        window.adminUsersDB.filter(u => u.status === 'active').forEach(au => {
            const displayName = au.username.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            const initials = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
            const existing = window.systemUsersDB.find(s => s.email === au.email);
            if (existing) {
                existing.name = displayName;
                existing.email = au.email;
                existing.initials = initials;
                existing.area = au.area;
            } else {
                window.systemUsersDB.push({
                    id: 'U-' + au.id, name: displayName, email: au.email,
                    role: window.getRoleById ? (window.getRoleById(au.roleId)?.name || 'User') : 'User',
                    area: au.area, initials, online: false, lastSeen: '—'
                });
            }
        });
        if (typeof window.getCurrentAdminUser === 'function') {
            const cu = window.getCurrentAdminUser();
            if (cu) {
                window.CURRENT_USER = cu.username.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                window.CURRENT_USER_EMAIL = cu.email;
            }
        }
    };

    window.parseCsvUpload = function (text) {
        const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) return [];
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        return lines.slice(1).map(line => {
            const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            const row = {};
            headers.forEach((h, i) => { row[h] = vals[i] || ''; });
            return row;
        });
    };

    window.processNbLiveUpload = async function (rows, fileName) {
        const results = { created: 0, updated: 0, errors: [] };
        for (const row of rows) {
            const tripNumber = row.TripNumber || row.tripNumber;
            const truck = row.Truck || row.truck;
            if (!tripNumber || !truck) { results.errors.push('Missing TripNumber or Truck'); continue; }
            try {
                if (typeof isApiAvailable === 'function' && isApiAvailable()) {
                    await uploadNbTrip({
                        tripNumber, truck,
                        driver: row.Driver || row.driver || 'TBD',
                        owner: row.Owner || row.owner || 'Unknown',
                        area: row.Area || row.area || 'Kasumbalesa',
                        entryBorder: row.EntryBorder || row.entryBorder || 'Kasumbalesa',
                        offloadingPoint: row.OffloadingPoint || row.offloadingPoint || '',
                        borderProcess: row.BorderProcess || row.borderProcess || 'KBP'
                    });
                    results.created++;
                } else {
                    if (!window.tripsDB[tripNumber]) {
                        window.tripsDB[tripNumber] = {
                            tripNumber, truck, driver: row.Driver || 'TBD', direction: 'NB',
                            area: row.Area || 'Kasumbalesa', owner: row.Owner || 'Unknown',
                            entryBorder: row.EntryBorder || 'Kasumbalesa',
                            offloadingPoint: row.OffloadingPoint || '', status: row.Status || 'Border Clearance',
                            daysInDRC: 0, kpi: 'green', borderProcess: row.BorderProcess || 'KBP',
                            workflow: { border: 'current', kanyaka: 'pending', offloading: 'pending', pod: 'pending' }
                        };
                        results.created++;
                    } else results.updated++;
                }
            } catch (e) { results.errors.push(`${tripNumber}: ${e.message}`); }
        }
        window.liveUploadsDB.unshift({
            id: 'LU-' + nextLiveUploadId++, type: 'NB', fileName, rowCount: rows.length,
            results, uploadedBy: window.getCurrentAdminUser?.()?.username || 'system',
            uploadedAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
        });
        if (typeof syncTripsFromApi === 'function' && isApiAvailable()) await syncTripsFromApi();
        return results;
    };

    window.processSbLiveUpload = async function (rows, fileName) {
        const results = { created: 0, updated: 0, errors: [] };
        for (const row of rows) {
            const tripNumber = row.TripNumber || row.tripNumber;
            const truck = row.Truck || row.truck;
            if (!tripNumber || !truck) continue;
            if (!window.tripsDB[tripNumber]) {
                window.tripsDB[tripNumber] = {
                    tripNumber, truck, driver: row.Driver || 'TBD', direction: 'SB',
                    area: row.Area || 'Kanyaka', owner: row.Owner || 'Unknown',
                    loadingPoint: row.LoadingPoint || 'Kanyaka Mine', exitBorder: row.ExitBorder || 'Kasumbalesa',
                    status: row.Status || 'Loading', daysInDRC: 0, kpi: 'green',
                    workflow: { loadingProcess: 'current', documents: 'pending', seal: 'pending', escort: 'pending', dispatch: 'pending', kanyaka: 'pending', border: 'pending' }
                };
                results.created++;
            } else results.updated++;
        }
        window.liveUploadsDB.unshift({
            id: 'LU-' + nextLiveUploadId++, type: 'SB', fileName, rowCount: rows.length,
            results, uploadedBy: window.getCurrentAdminUser?.()?.username || 'system',
            uploadedAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
        });
        return results;
    };

    window.getCurrentPositionSlot = function () {
        const h = new Date().getHours();
        if (h < 12) return 'morning';
        if (h < 17) return 'afternoon';
        return 'evening';
    };

    window.processPositionUpload = async function (rows, fileName, slot) {
        const useSlot = slot || getCurrentPositionSlot();
        const today = new Date().toISOString().slice(0, 10);
        const nbTrips = Object.values(window.tripsDB || {}).filter(t => t.direction === 'NB');
        const nbTrucks = new Set(nbTrips.map(t => t.truck.toUpperCase()));

        const matched = [];
        const unmatched = [];
        rows.forEach(row => {
            const tripNumber = row.TripNumber || row.tripNumber;
            const truck = (row.Truck || row.truck || '').toUpperCase();
            const trip = window.tripsDB[tripNumber] || nbTrips.find(t => t.truck.toUpperCase() === truck);
            const history = typeof getTripAreaHistory === 'function' ? getTripAreaHistory(trip?.tripNumber || tripNumber) : [];

            const entry = {
                tripNumber: trip?.tripNumber || tripNumber,
                truck: row.Truck || row.truck,
                latitude: row.Latitude || row.latitude || '—',
                longitude: row.Longitude || row.longitude || '—',
                area: row.Area || row.area || trip?.area || '—',
                areaStatus: row.AreaStatus || row.areaStatus || trip?.areaStatus || '—',
                processComment: row.ProcessComment || row.processComment || '',
                timestamp: row.Timestamp || row.timestamp || new Date().toISOString().replace('T', ' ').slice(0, 19),
                areaUpdates: history,
                matched: !!(trip && (nbTrucks.has(truck) || trip.direction === 'NB'))
            };
            if (entry.matched) matched.push(entry);
            else unmatched.push(entry);
        });

        const upload = {
            id: 'POS-' + nextPositionUploadId++,
            slot: useSlot, slotLabel: POSITION_SLOT_LABELS[useSlot],
            date: today, fileName,
            matched, unmatched,
            uploadedBy: window.getCurrentAdminUser?.()?.username || 'system',
            uploadedAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
        };
        window.positionUploadsDB.unshift(upload);

        if (typeof isApiAvailable === 'function' && isApiAvailable()) {
            try {
                await apiRequest('/position-uploads', { method: 'POST', body: JSON.stringify(upload) });
            } catch (_) { /* local ok */ }
        }
        return upload;
    };

    window.wirePodStageAction = async function (tripNumber, stage) {
        const labels = { collected: 'Collected', scanned: 'Scanned', uploaded: 'Uploaded', sent_to_invoicing: 'Sent to Invoicing' };
        if (typeof isApiAvailable === 'function' && isApiAvailable()) {
            try {
                const trip = await advancePodStage(tripNumber, stage);
                if (typeof mergeTripIntoLocalDb === 'function') mergeTripIntoLocalDb(trip);
                const pod = window.podDB?.find(p => p.trip === tripNumber);
                if (pod) {
                    if (stage === 'collected') { pod.collected = true; pod.collectedOnTime = true; pod.collectedDate = new Date().toISOString().slice(0, 16).replace('T', ' '); }
                    if (stage === 'scanned') pod.scanned = true;
                    if (stage === 'uploaded') pod.uploaded = true;
                    if (stage === 'sent_to_invoicing') pod.sentToInvoicing = true;
                }
                if (typeof logAuditEvent === 'function') logAuditEvent(`POD ${labels[stage]}: ${tripNumber}`, tripNumber, 'pod', stage);
                if (typeof showToast === 'function') showToast(`POD ${labels[stage]} via API`, 'success');
                if (window.currentPage === 'pod-management' && typeof refreshPODTable === 'function') refreshPODTable();
                return true;
            } catch (e) {
                if (typeof showToast === 'function') showToast(e.message, 'warning');
                return false;
            }
        }
        const pod = window.podDB?.find(p => p.trip === tripNumber);
        if (pod) {
            if (stage === 'collected') { pod.collected = true; pod.collectedOnTime = true; }
            if (stage === 'scanned') pod.scanned = true;
            if (stage === 'uploaded') pod.uploaded = true;
            if (stage === 'sent_to_invoicing') pod.sentToInvoicing = true;
        }
        if (typeof showToast === 'function') showToast(`POD ${labels[stage]} (local)`, 'success');
        if (window.currentPage === 'pod-management' && typeof refreshPODTable === 'function') refreshPODTable();
        return true;
    };

    window.wireBorderStepComplete = async function (tripNumber, stepOrder) {
        if (typeof isApiAvailable === 'function' && isApiAvailable()) {
            try {
                const trip = await completeBorderStep(tripNumber, stepOrder);
                if (typeof mergeTripIntoLocalDb === 'function') mergeTripIntoLocalDb(trip);
                if (typeof showToast === 'function') showToast(`Border step ${stepOrder} completed via API`, 'success');
                if (window.currentPage) window.navigateTo(window.currentPage);
                return true;
            } catch (e) {
                if (typeof showToast === 'function') showToast(e.message, 'warning');
                return false;
            }
        }
        if (typeof showToast === 'function') showToast(`Border step ${stepOrder} marked complete (local)`, 'success');
        return true;
    };

    window.handleLiveUpload = async function () {
        const type = document.getElementById('uploadType')?.value || 'NB';
        const fileInput = document.getElementById('uploadFileInput');
        const file = fileInput?.files?.[0];
        if (!file) { if (typeof showToast === 'function') showToast('Select a file first', 'warning'); return; }

        const text = await file.text();
        const rows = parseCsvUpload(text);
        if (!rows.length) { if (typeof showToast === 'function') showToast('No data rows found', 'warning'); return; }

        let result;
        if (type === 'POSITION') {
            const slot = document.getElementById('positionSlot')?.value;
            result = await processPositionUpload(rows, file.name, slot);
            if (typeof showToast === 'function') showToast(`Position upload: ${result.matched.length} matched, ${result.unmatched.length} unmatched`, result.unmatched.length ? 'warning' : 'success');
        } else if (type === 'NB') {
            result = await processNbLiveUpload(rows, file.name);
            if (typeof showToast === 'function') showToast(`NB upload: ${result.created} created, ${result.updated} updated`, result.errors.length ? 'warning' : 'success');
        } else {
            result = await processSbLiveUpload(rows, file.name);
            if (typeof showToast === 'function') showToast(`SB upload: ${result.created} created, ${result.updated} updated`, 'success');
        }

        if (typeof closeModal === 'function') closeModal('uploadModal');
        if (type === 'POSITION' && window.currentPage === 'position-live') renderPositionLive(document.getElementById('contentArea'));
        else if (type === 'NB' && window.currentPage === 'nb-operations') window.navigateTo('nb-operations');
        else if (type === 'SB' && window.currentPage === 'sb-operations') window.navigateTo('sb-operations');
    };

    window.renderAdminUploadTemplates = function (container) {
        if (!window.canAccessAdminPage || !canAccessAdminPage('admin-settings')) {
            container.innerHTML = '<div class="access-denied"><h2>Access Denied</h2></div>';
            return;
        }
        container.innerHTML = `
            ${typeof renderAdminBreadcrumb === 'function' ? renderAdminBreadcrumb('Upload Templates') : ''}
            <div class="page-header admin-page-header">
                <div><h1>📤 Excel Upload Templates</h1><p class="page-subtitle">Define column templates for NB, SB, and Position (3× daily) live file uploads.</p></div>
            </div>
            ${Object.entries(uploadTemplatesDB).map(([key, tpl]) => `
                <div class="settings-card" style="margin-bottom:16px;">
                    <h3>${tpl.name} (${key})</h3>
                    <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;">${tpl.description}</p>
                    <div class="form-group"><label>Columns (comma-separated)</label>
                        <input type="text" class="form-control" id="tpl-cols-${key}" value="${tpl.columns.join(', ')}">
                    </div>
                    <button class="btn btn-primary btn-sm" onclick="saveUploadTemplate('${key}')">💾 Save Template</button>
                    <button class="btn btn-outline btn-sm" onclick="downloadTemplateCsv('${key}')">📥 Download CSV Template</button>
                </div>`).join('')}
            <div class="rbac-info-banner"><strong>Position file:</strong> Upload 3× daily (morning 08:00, afternoon 14:00, evening 20:00). Trucks must match NB live file. Each position shows area comments and process dates.</div>`;
    };

    window.saveUploadTemplate = function (key) {
        const el = document.getElementById('tpl-cols-' + key);
        if (!el) return;
        uploadTemplatesDB[key].columns = el.value.split(',').map(c => c.trim()).filter(Boolean);
        if (typeof logAuditEvent === 'function') logAuditEvent(`Updated upload template: ${key}`, key, 'template');
        if (typeof showToast === 'function') showToast(`Template ${key} saved`, 'success');
    };

    window.downloadTemplateCsv = function (key) {
        const tpl = uploadTemplatesDB[key];
        const csv = tpl.columns.join(',') + '\n';
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${key}_Live_Template.csv`;
        a.click();
    };

    window.renderPositionLive = function (container) {
        const today = new Date().toISOString().slice(0, 10);
        const todayUploads = positionUploadsDB.filter(p => p.date === today);
        container.innerHTML = `
            <div class="page-header admin-page-header">
                <div><h1>📍 Position Live (3× Daily)</h1><p class="page-subtitle">Position files matched to NB trucks — with area comments and process timestamps.</p></div>
                <button class="btn btn-primary" onclick="openUploadModal('POSITION')">📤 Upload Position File</button>
            </div>
            ${typeof getAreaFilterBanner === 'function' ? getAreaFilterBanner() : ''}
            <div class="kpi-row">
                ${POSITION_SLOTS.map(slot => {
                    const up = todayUploads.find(u => u.slot === slot);
                    return `<div class="kpi-mini"><div class="kpi-value">${up ? up.matched.length : '—'}</div><div class="kpi-label">${POSITION_SLOT_LABELS[slot]} ${slot}</div></div>`;
                }).join('')}
            </div>
            ${todayUploads.length === 0 ? '<p style="padding:20px;color:var(--text-secondary);">No position uploads today. Upload NB live file first, then position 3× daily.</p>' : ''}
            ${todayUploads.map(up => `
                <div class="settings-card" style="margin-bottom:16px;">
                    <h3>${up.slotLabel} — ${up.fileName} <small>(${up.matched.length} matched)</small></h3>
                    <table class="data-table report-table"><thead><tr>
                        <th>Trip</th><th>Truck</th><th>Position</th><th>Area Status</th><th>Comment</th><th>Process History</th>
                    </tr></thead><tbody>
                        ${up.matched.map(m => `<tr>
                            <td>${m.tripNumber}</td><td>${m.truck}</td>
                            <td>${m.latitude}, ${m.longitude}</td>
                            <td>${m.areaStatus}</td><td>${m.processComment || '—'}</td>
                            <td>${(m.areaUpdates || []).slice(0, 3).map(h => `<small>${h.timestamp}: ${h.status} (${h.updatedBy})</small>`).join('<br>') || '—'}</td>
                        </tr>`).join('')}
                    </tbody></table>
                    ${up.unmatched.length ? `<p style="color:var(--orange);font-size:12px;margin-top:8px;">⚠️ ${up.unmatched.length} trucks not matched to NB live file</p>` : ''}
                </div>`).join('')}
            <div class="settings-card"><h3>Recent Live Uploads (NB/SB)</h3>
                ${liveUploadsDB.slice(0, 5).map(u => `<div style="padding:8px 0;border-bottom:1px solid var(--border);font-size:13px;">
                    <strong>${u.type}</strong> ${u.fileName} — ${u.rowCount} rows — ${u.uploadedAt} by ${u.uploadedBy}
                </div>`).join('') || '<em>No uploads yet</em>'}
            </div>`;
    };

    window.openUploadModal = function (direction) {
        const uploadType = document.getElementById('uploadType');
        const title = document.getElementById('uploadModalTitle');
        const posSlot = document.getElementById('positionSlotGroup');
        const tplHint = document.getElementById('uploadTemplateHint');
        if (uploadType) uploadType.value = direction || 'NB';
        if (title) title.textContent = direction === 'POSITION' ? '📤 Upload Position File' : `📤 Upload ${direction || 'NB'} Live Data`;
        if (posSlot) posSlot.style.display = direction === 'POSITION' ? 'block' : 'none';
        const key = direction === 'POSITION' ? 'POSITION' : (direction || 'NB');
        if (tplHint && uploadTemplatesDB[key]) {
            tplHint.innerHTML = `<strong>Template columns:</strong> ${uploadTemplatesDB[key].columns.join(', ')} <button class="btn btn-outline btn-sm" onclick="downloadTemplateCsv('${key}')">Download</button>`;
        }
        if (typeof openModal === 'function') openModal('uploadModal');
        const uploadTypeEl = document.getElementById('uploadType');
        if (uploadTypeEl && !uploadTypeEl._bound) {
            uploadTypeEl._bound = true;
            uploadTypeEl.addEventListener('change', function () {
                const posSlot = document.getElementById('positionSlotGroup');
                const key = this.value;
                if (posSlot) posSlot.style.display = key === 'POSITION' ? 'block' : 'none';
                const tplHint = document.getElementById('uploadTemplateHint');
                if (tplHint && uploadTemplatesDB[key]) {
                    tplHint.innerHTML = `<strong>Template columns:</strong> ${uploadTemplatesDB[key].columns.join(', ')} <button class="btn btn-outline btn-sm" onclick="downloadTemplateCsv('${key}')">Download</button>`;
                }
            });
        }
    };

})();
