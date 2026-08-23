/**
 * Offline queue — persists failed API writes and replays when connectivity returns.
 */
(function () {
    const QUEUE_KEY = 'truckcontrol_offline_queue_v1';

    function readQueue() {
        try {
            const raw = localStorage.getItem(QUEUE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (_) {
            return [];
        }
    }

    function writeQueue(items) {
        try { localStorage.setItem(QUEUE_KEY, JSON.stringify(items)); } catch (_) {}
    }

    window.enqueueOfflineAction = function (action) {
        const q = readQueue();
        q.push({ ...action, queuedAt: Date.now() });
        writeQueue(q);
    };

    window.flushOfflineQueue = async function () {
        if (typeof isApiAvailable !== 'function' || !isApiAvailable()) return 0;
        const q = readQueue();
        if (!q.length) return 0;
        const remaining = [];
        let flushed = 0;
        for (const item of q) {
            try {
                if (item.type === 'chat' && typeof sendInternalChatMessageApi === 'function') {
                    await sendInternalChatMessageApi(item.payload);
                    flushed++;
                } else if (item.type === 'email' && typeof sendInternalEmailApi === 'function') {
                    await sendInternalEmailApi(item.payload);
                    flushed++;
                } else {
                    remaining.push(item);
                }
            } catch (_) {
                remaining.push(item);
            }
        }
        writeQueue(remaining);
        if (flushed && typeof syncInternalCommFromApi === 'function') {
            try { await syncInternalCommFromApi(); } catch (_) {}
        }
        if (flushed && typeof showToast === 'function') {
            showToast(`Synced ${flushed} offline message(s)`, 'success');
        }
        return flushed;
    };

    window.addEventListener('online', () => {
        flushOfflineQueue();
    });

    if (typeof checkApiHealth === 'function') {
        setInterval(() => {
            checkApiHealth().then(ok => { if (ok) flushOfflineQueue(); });
        }, 30000);
    }
})();
