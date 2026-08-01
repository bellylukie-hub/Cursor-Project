/**
 * Process sequence guide — shows ordered steps for the trip's current area / workflow phase.
 */
(function () {
    function getTripCurrentWorkflowKey(trip) {
        const wf = trip?.workflow || {};
        const current = Object.entries(wf).find(([, v]) => v === 'current');
        if (current) return current[0];
        const dir = trip?.direction || 'NB';
        const status = trip?.areaStatus || trip?.status;
        if (status && typeof inferWorkflowKeyFromAreaStatus === 'function') {
            return inferWorkflowKeyFromAreaStatus(dir, trip.area, status);
        }
        return dir === 'SB' ? 'loadingProcess' : 'border';
    }

    function resolveTripAreaRecord(trip) {
        const areas = window.areaStatusesDB || [];
        const candidates = [
            trip?.area,
            trip?.direction === 'SB' ? trip?.exitBorder : trip?.entryBorder,
            trip?.offloadingPoint,
            trip?.loadingPoint
        ].filter(Boolean);
        for (const name of candidates) {
            const exact = areas.find(a => a.area === name);
            if (exact) return exact;
            const partial = areas.find(a =>
                name.toLowerCase().includes(a.area.toLowerCase()) ||
                a.area.toLowerCase().includes(String(name).toLowerCase().split(' ')[0])
            );
            if (partial) return partial;
        }
        return null;
    }

    function resolveBorderProcessId(trip) {
        const dir = trip?.direction || 'NB';
        const border = dir === 'SB' ? (trip?.exitBorder || trip?.area) : (trip?.entryBorder || trip?.area);
        if (dir === 'SB') {
            const b = String(border || '').toLowerCase();
            if (b.includes('sakania')) return 'sb-sakania';
            if (b.includes('mokambo')) return 'sb-mokambo';
            return 'sb-kasumbalesa';
        }
        const proc = String(trip?.borderProcess || '').toLowerCase();
        if (proc.includes('whisky')) return 'whisky';
        if (proc.includes('direct')) return 'direct';
        if (proc.includes('kbp')) return 'kbp';
        const b = String(border || '').toLowerCase();
        if (b.includes('sakania')) return 'sakania';
        if (b.includes('mokambo')) return 'mokambo';
        return 'kbp';
    }

    function getWorkflowStepLabel(direction, workflowKey) {
        const steps = (window.WORKFLOW_CONFIG || {})[direction] || [];
        const hit = steps.find(s => s.key === workflowKey);
        return hit?.label || workflowKey;
    }

    function getCompletedStatusSet(trip) {
        const done = new Set();
        Object.keys(trip?.areaStatusDates || {}).forEach(s => done.add(s.toLowerCase().trim()));
        const tripNumber = trip?.tripNumber || trip?.trip;
        if (tripNumber && typeof getTripAreaHistory === 'function') {
            getTripAreaHistory(tripNumber).forEach(h => {
                if (h.status) done.add(String(h.status).toLowerCase().trim());
            });
        }
        return done;
    }

    function matchStepCompleted(stepLabel, completedSet) {
        const label = String(stepLabel).toLowerCase().trim();
        if (completedSet.has(label)) return true;
        for (const s of completedSet) {
            if (s.includes(label) || label.includes(s)) return true;
        }
        return false;
    }

    function getStepMeta(trip, stepLabel) {
        const tripNumber = trip?.tripNumber || trip?.trip;
        const date = trip?.areaStatusDates?.[stepLabel];
        let updatedBy = trip?.lastUpdatedBy;
        let updatedAt = trip?.lastUpdatedAt;
        if (tripNumber && typeof getTripAreaHistory === 'function') {
            const hit = getTripAreaHistory(tripNumber).find(h => h.status === stepLabel);
            if (hit) {
                updatedBy = hit.updatedBy || updatedBy;
                updatedAt = hit.timestamp || hit.updatedAt || updatedAt;
            }
        }
        return { date, updatedBy, updatedAt };
    }

    function buildStepsFromLabels(trip, labels, currentLabel) {
        const completedSet = getCompletedStatusSet(trip);
        let currentIdx = labels.findIndex(l =>
            l === currentLabel ||
            String(l).toLowerCase() === String(currentLabel || '').toLowerCase()
        );
        if (currentIdx < 0) {
            currentIdx = labels.findIndex(l => !matchStepCompleted(l, completedSet));
        }
        if (currentIdx < 0 && labels.length) currentIdx = labels.length - 1;

        return labels.map((label, i) => {
            let state = 'pending';
            if (currentIdx >= 0) {
                if (i < currentIdx) state = 'completed';
                else if (i === currentIdx) state = 'current';
            } else if (matchStepCompleted(label, completedSet)) {
                state = 'completed';
            }
            const meta = getStepMeta(trip, label);
            return { label, state, ...meta };
        });
    }

    window.getProcessSequenceForTrip = function (trip, statusContext) {
        if (!trip) return { areaLabel: 'Unknown', workflowKey: null, steps: [] };

        const direction = trip.direction || 'NB';
        const workflowKey = getTripCurrentWorkflowKey(trip);
        const currentStatus = trip.areaStatus || trip.status ||
            trip.workflowStatusLog?.[workflowKey]?.status || '';
        const areaRec = resolveTripAreaRecord(trip);

        if (workflowKey === 'border') {
            const processId = resolveBorderProcessId(trip);
            const proc = typeof getBorderProcessDef === 'function' ? getBorderProcessDef(processId) : null;
            const labels = proc?.steps?.map(s => s.name) ||
                (direction === 'SB' ? (window.SB_CLEARANCE_STEPS || []) : []);
            const borderName = direction === 'SB' ? (trip.exitBorder || trip.area) : (trip.entryBorder || trip.area);
            return {
                areaLabel: proc?.label || `${borderName || 'Border'} ${direction === 'SB' ? 'Exit' : 'Clearance'}`,
                workflowKey,
                steps: buildStepsFromLabels(trip, labels, currentStatus)
            };
        }

        let labels = [];
        if (areaRec && typeof getStatusesForAreaRecord === 'function') {
            labels = getStatusesForAreaRecord(areaRec, direction);
        }
        if (!labels.length && typeof buildAreaStatusWorkflowMaps === 'function') {
            const maps = buildAreaStatusWorkflowMaps();
            const map = direction === 'SB' ? maps.sb : maps.nb;
            const areas = window.areaStatusesDB || [];
            areas.forEach(rec => {
                const all = typeof getStatusesForAreaRecord === 'function'
                    ? getStatusesForAreaRecord(rec, direction)
                    : [...(rec.statusesNB || []), ...(rec.statusesSB || [])];
                all.forEach(s => {
                    if (map[String(s).toLowerCase().trim()] === workflowKey && !labels.includes(s)) {
                        labels.push(s);
                    }
                });
            });
        }

        if (!labels.length) {
            const wfSteps = (window.WORKFLOW_CONFIG || {})[direction] || [];
            labels = wfSteps.map(s => s.label);
        }

        const areaLabel = areaRec?.area || trip.area ||
            getWorkflowStepLabel(direction, workflowKey);

        return {
            areaLabel: `${areaLabel} — ${getWorkflowStepLabel(direction, workflowKey)}`,
            workflowKey,
            steps: buildStepsFromLabels(trip, labels, currentStatus)
        };
    };

    function formatGuideDate(val) {
        if (!val) return '';
        if (typeof formatWorkflowDate === 'function') return formatWorkflowDate(val);
        if (typeof formatLiveDate === 'function') return formatLiveDate(val);
        return String(val);
    }

    window.renderCurrentAreaProcessTimeline = function (trip, statusContext) {
        const seq = getProcessSequenceForTrip(trip, statusContext);
        if (!seq.steps.length) {
            return `<div class="process-sequence-empty">No process sequence configured for this area.</div>`;
        }

        const currentStep = seq.steps.find(s => s.state === 'current');
        const nextStep = seq.steps[seq.steps.indexOf(currentStep) + 1];

        const stepsHtml = seq.steps.map((step, i) => {
            const dateHtml = step.date
                ? `<span class="process-seq-date">${formatGuideDate(step.date)}</span>`
                : (step.state === 'current' ? '<span class="process-seq-date">In progress</span>' : '');
            const arrow = i < seq.steps.length - 1
                ? `<span class="process-seq-arrow ${step.state === 'completed' ? 'completed' : 'pending'}">→</span>`
                : '';
            return `<div class="process-seq-step ${step.state}" title="${step.label}">
                <span class="process-seq-num">${i + 1}</span>
                <span class="process-seq-label">${step.label}</span>
                ${dateHtml}
            </div>${arrow}`;
        }).join('');

        const nextHint = currentStep && nextStep
            ? `<div class="process-seq-next-hint"><strong>Next:</strong> ${nextStep.label}</div>`
            : (!currentStep && seq.steps.every(s => s.state === 'completed')
                ? `<div class="process-seq-next-hint"><strong>All steps complete</strong> in this phase.</div>`
                : '');

        return `<div class="process-sequence-panel">
            <div class="process-sequence-header">
                <span class="process-sequence-title">📍 ${seq.areaLabel}</span>
                <span class="process-sequence-sub">Follow these steps in order for the driver's current area</span>
            </div>
            <div class="process-sequence-track">${stepsHtml}</div>
            ${nextHint}
        </div>`;
    };

    window.refreshCommentModalProcessGuide = function (trip, statusContext) {
        const el = document.getElementById('currentAreaProcessTimeline');
        if (!el || typeof renderCurrentAreaProcessTimeline !== 'function') return;
        el.innerHTML = renderCurrentAreaProcessTimeline(trip, statusContext);
        el.style.display = '';
    };
})();
