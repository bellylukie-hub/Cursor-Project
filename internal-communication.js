/**
 * Internal Communication — user-scoped email/chat, persistence, ribbon, and theme.
 */
(function () {
    const STORAGE_KEY = 'truckcontrol_internal_comm_v2';
    const SHARED_MAILBOX_KEY = 'truckcontrol_internal_comm_shared_mailbox_v1';
    const LEGACY_USER = 'Current User';
    const LEGACY_EMAIL = 'current.user@truckcontrol.local';
    let commPollTimer = null;
    let lastKnownUnreadEmail = 0;
    let lastKnownUnreadChat = 0;

    let commRibbonTab = 'home';
    let commTheme = 'light';
    let commDataLoaded = false;

    function getCurrentCommUserName() {
        const cu = typeof getCurrentAdminUser === 'function' ? getCurrentAdminUser() : null;
        if (cu?.username) {
            return cu.username.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        }
        return window.CURRENT_USER || LEGACY_USER;
    }

    function getCurrentCommUserEmail() {
        const cu = typeof getCurrentAdminUser === 'function' ? getCurrentAdminUser() : null;
        const email = cu?.email || window.CURRENT_USER_EMAIL || LEGACY_EMAIL;
        if (email && email.includes('@')) return email;
        const uname = cu?.username || window.CURRENT_USER;
        if (uname) return `${String(uname).toLowerCase().replace(/\s+/g, '_')}@truckcontrol.local`;
        return LEGACY_EMAIL;
    }

    function isProductionSession() {
        return typeof isAuthRequired === 'function' && isAuthRequired()
            && typeof getAuthToken === 'function' && !!getAuthToken();
    }

    function storageKey() {
        const email = getCurrentCommUserEmail();
        return `${STORAGE_KEY}:${email}`;
    }

    function readStore() {
        try {
            const raw = localStorage.getItem(storageKey());
            return raw ? JSON.parse(raw) : null;
        } catch (_) {
            return null;
        }
    }

    function writeStore() {
        if (typeof emailsDB === 'undefined') return;
        try {
            localStorage.setItem(storageKey(), JSON.stringify({
                emails: emailsDB,
                chatRooms: chatRoomsDB,
                chatMessages: chatMessagesDB,
                lastReadByRoom: window.__commLastReadByRoom || {},
                nextEmailId: typeof nextEmailId !== 'undefined' ? nextEmailId : 11,
                nextChatRoomId: typeof nextChatRoomId !== 'undefined' ? nextChatRoomId : 6,
                nextChatMessageId: typeof nextChatMessageId !== 'undefined' ? nextChatMessageId : 8,
                commTheme
            }));
        } catch (e) {
            console.warn('Internal comm save failed:', e.message);
        }
    }

    function replaceLegacyUserRefs(name, email) {
        const fixList = arr => {
            (arr || []).forEach(item => {
                if (!item) return;
                if (Array.isArray(item.to)) item.to = item.to.map(v => v === LEGACY_USER ? name : v);
                if (Array.isArray(item.cc)) item.cc = item.cc.map(v => v === LEGACY_USER ? name : v);
                if (Array.isArray(item.memberNames)) item.memberNames = item.memberNames.map(v => v === LEGACY_USER ? name : v);
                if (item.from === LEGACY_USER) item.from = name;
                if (item.fromEmail === LEGACY_EMAIL) item.fromEmail = email;
                if (item.sender === LEGACY_USER) item.sender = name;
                if (item.createdBy === LEGACY_USER) item.createdBy = name;
            });
        };
        if (typeof emailsDB !== 'undefined') fixList(emailsDB);
        if (typeof chatRoomsDB !== 'undefined') fixList(chatRoomsDB);
        if (typeof chatMessagesDB !== 'undefined') fixList(chatMessagesDB);
    }

    function isEmailOwnedByCurrentUser(email) {
        if (!email) return false;
        const name = getCurrentCommUserName();
        const userEmail = getCurrentCommUserEmail().toLowerCase();
        if (email.forUserEmail && email.forUserEmail.toLowerCase() === userEmail) return true;
        if (email.ownerEmail && email.ownerEmail.toLowerCase() === userEmail) return true;
        if (email.mirrorOf && (email.fromEmail || '').toLowerCase() === userEmail) return false;
        if (email.folder === 'sent' || email.folder === 'drafts') {
            return email.from === name || (email.fromEmail || '').toLowerCase() === userEmail;
        }
        if (email.folder === 'inbox') {
            return (email.toEmails || []).some(e => String(e).toLowerCase() === userEmail)
                || (email.to || []).includes(name);
        }
        if (email.folder === 'starred' || email.folder === 'archive' || email.folder === 'trash') {
            return (email.to || []).includes(name) || email.from === name
                || (email.toEmails || []).some(e => String(e).toLowerCase() === userEmail)
                || (email.fromEmail || '').toLowerCase() === userEmail;
        }
        return false;
    }

    function getVisibleEmails() {
        return (emailsDB || []).filter(isEmailOwnedByCurrentUser);
    }

    function getRoomUnreadCount(room) {
        if (!room) return 0;
        const userEmail = getCurrentCommUserEmail().toLowerCase();
        const lastRead = (window.__commLastReadByRoom || {})[room.id]?.[userEmail];
        const messages = (chatMessagesDB || []).filter(m => m.roomId === room.id);
        const name = getCurrentCommUserName();
        const isMine = m => m.sender === name || (m.senderEmail || '').toLowerCase() === userEmail;
        if (!lastRead) {
            return messages.filter(m => !isMine(m)).length;
        }
        const idx = messages.findIndex(m => m.id === lastRead);
        const unread = idx < 0
            ? messages.filter(m => !isMine(m))
            : messages.slice(idx + 1).filter(m => !isMine(m));
        return unread.length;
    }

    function syncRoomUnreadCounts() {
        (chatRoomsDB || []).forEach(room => {
            room.unreadCount = getRoomUnreadCount(room);
        });
    }

    function markRoomRead(roomId) {
        const userEmail = getCurrentCommUserEmail().toLowerCase();
        if (!window.__commLastReadByRoom) window.__commLastReadByRoom = {};
        if (!window.__commLastReadByRoom[roomId]) window.__commLastReadByRoom[roomId] = {};
        const messages = (chatMessagesDB || []).filter(m => m.roomId === roomId);
        const last = messages[messages.length - 1];
        window.__commLastReadByRoom[roomId][userEmail] = last?.id || null;
        const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
        messages.forEach(m => {
            if (!isCommMessageFromMeLocal(m) && last) {
                const msgIdx = messages.findIndex(x => x.id === m.id);
                const lastIdx = messages.findIndex(x => x.id === last.id);
                if (msgIdx <= lastIdx) m.readAt = m.readAt || now;
            }
        });
        const room = chatRoomsDB.find(r => r.id === roomId);
        if (room) {
            room.unreadCount = 0;
            if (!room.readCursors) room.readCursors = {};
            room.readCursors[userEmail] = last?.id || null;
        }
        if (typeof isApiAvailable === 'function' && isApiAvailable() && typeof markInternalChatRoomReadApi === 'function' && last) {
            markInternalChatRoomReadApi(roomId, last.id).then(apiRoom => {
                if (apiRoom && room) room.readCursors = apiRoom.readCursors || room.readCursors;
            }).catch(() => {});
        }
        writeStore();
    }

    function isCommMessageFromMeLocal(msg) {
        const name = getCurrentCommUserName();
        const email = getCurrentCommUserEmail().toLowerCase();
        return msg.sender === name || String(msg.senderEmail || '').toLowerCase() === email;
    }

    function lookupUserByRecipient(token) {
        const t = String(token || '').trim();
        if (!t) return null;
        const norm = s => String(s || '').toLowerCase();
        const displayFromUsername = u => u.username.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        if (t.includes('@')) {
            const fromAdminEmail = (adminUsersDB || []).find(u => norm(u.email) === norm(t));
            if (fromAdminEmail) {
                return { name: displayFromUsername(fromAdminEmail), email: fromAdminEmail.email || t, username: fromAdminEmail.username };
            }
            const fromSystem = (systemUsersDB || []).find(u => norm(u.email) === norm(t));
            if (fromSystem) return fromSystem;
        }
        const fromAdmin = (adminUsersDB || []).find(u =>
            norm(u.username) === norm(t) || norm(u.email) === norm(t)
            || norm(displayFromUsername(u)) === norm(t)
        );
        if (fromAdmin) {
            const email = fromAdmin.email || `${fromAdmin.username}@truckcontrol.local`;
            return { name: displayFromUsername(fromAdmin), email, username: fromAdmin.username };
        }
        return (systemUsersDB || []).find(u =>
            u.name === t || norm(u.email) === norm(t) || norm(u.email?.split('@')[0]) === norm(t)
        ) || null;
    }

    function deliverEmailCopies(sentEmail, recipients) {
        const senderEmail = getCurrentCommUserEmail();
        recipients.forEach(recipient => {
            const user = lookupUserByRecipient(recipient);
            const recipientEmail = user?.email || (recipient.includes('@') ? recipient : null);
            if (!recipientEmail || recipientEmail.toLowerCase() === senderEmail.toLowerCase()) return;
            emailsDB.unshift({
                ...sentEmail,
                id: `EM-${String(nextEmailId++).padStart(3, '0')}`,
                folder: 'inbox',
                forUserEmail: recipientEmail.toLowerCase(),
                ownerEmail: recipientEmail.toLowerCase(),
                to: [user?.name || recipient],
                toEmails: [recipientEmail],
                cc: [],
                bcc: [],
                read: false,
                mirrorOf: sentEmail.id
            });
        });
        pushToSharedMailbox(sentEmail, recipients);
    }

    function readSharedMailbox() {
        try {
            const raw = localStorage.getItem(SHARED_MAILBOX_KEY);
            return raw ? JSON.parse(raw) : { emails: [], chatRooms: [], chatMessages: [] };
        } catch (_) {
            return { emails: [], chatRooms: [], chatMessages: [] };
        }
    }

    function writeSharedMailbox(data) {
        try { localStorage.setItem(SHARED_MAILBOX_KEY, JSON.stringify(data)); } catch (_) {}
    }

    function pushToSharedMailbox(sentEmail, recipients) {
        const shared = readSharedMailbox();
        shared.emails = shared.emails || [];
        const senderEmail = getCurrentCommUserEmail().toLowerCase();
        if (!shared.emails.some(e => e.id === sentEmail.id)) {
            shared.emails.unshift({ ...sentEmail, ownerEmail: senderEmail, forUserEmail: senderEmail });
        }
        recipients.forEach(recipient => {
            const user = lookupUserByRecipient(recipient);
            const recipientEmail = user?.email || (recipient.includes('@') ? recipient : null);
            if (!recipientEmail || recipientEmail.toLowerCase() === senderEmail) return;
            const copyId = `${sentEmail.id}-to-${recipientEmail}`;
            if (shared.emails.some(e => e.id === copyId)) return;
            shared.emails.unshift({
                ...sentEmail,
                id: copyId,
                folder: 'inbox',
                forUserEmail: recipientEmail.toLowerCase(),
                ownerEmail: recipientEmail.toLowerCase(),
                to: [user?.name || recipient],
                toEmails: [recipientEmail],
                read: false,
                mirrorOf: sentEmail.id
            });
        });
        writeSharedMailbox(shared);
    }

    function mergeSharedMailboxIntoLocal() {
        const shared = readSharedMailbox();
        const userEmail = getCurrentCommUserEmail().toLowerCase();
        (shared.emails || []).forEach(email => {
            if (String(email.forUserEmail || '').toLowerCase() !== userEmail) return;
            if ((emailsDB || []).some(e => e.id === email.id)) return;
            emailsDB.unshift({ ...email });
        });
    }

    function pushCommNotification(title, body) {
        if (typeof showToast === 'function') showToast(body, 'success');
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            try { new Notification(title, { body, icon: '/favicon.svg' }); } catch (_) {}
        }
    }

    function requestCommNotificationPermission() {
        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
            Notification.requestPermission().catch(() => {});
        }
    }

    function countUnreadEmails() {
        return getVisibleEmails().filter(e => e.folder === 'inbox' && !e.read).length;
    }

    function countUnreadChats() {
        return (chatRoomsDB || []).reduce((sum, room) => sum + getRoomUnreadCount(room), 0);
    }

    function mergeRecordsById(localList, apiList) {
        const map = new Map();
        (localList || []).forEach(item => {
            if (item?.id) map.set(item.id, item);
        });
        (apiList || []).forEach(item => {
            if (item?.id) map.set(item.id, item);
        });
        return Array.from(map.values());
    }

    async function syncInternalCommFromApi() {
        if (typeof isApiAvailable !== 'function' || !isApiAvailable() || typeof fetchInternalMailboxApi !== 'function') {
            mergeSharedMailboxIntoLocal();
            return false;
        }
        try {
            const prevUnread = countUnreadEmails();
            const mailbox = await fetchInternalMailboxApi();
            if (mailbox?.length) {
                emailsDB.splice(0, emailsDB.length, ...mailbox);
            }
            if (typeof fetchInternalChatApi === 'function') {
                const chat = await fetchInternalChatApi();
                if (chat?.rooms?.length) {
                    const mergedRooms = mergeRecordsById(chatRoomsDB, chat.rooms);
                    mergedRooms.forEach(r => {
                        if (typeof window.normalizeDirectRoomForViewer === 'function') window.normalizeDirectRoomForViewer(r);
                    });
                    chatRoomsDB.splice(0, chatRoomsDB.length, ...mergedRooms);
                }
                if (chat?.messages?.length) {
                    const mergedMsgs = mergeRecordsById(chatMessagesDB, chat.messages);
                    mergedMsgs.sort((a, b) => String(a.sentAt || '').localeCompare(String(b.sentAt || '')));
                    chatMessagesDB.splice(0, chatMessagesDB.length, ...mergedMsgs);
                }
            }
            syncRoomUnreadCounts();
            writeStore();
            const prevChatUnread = lastKnownUnreadChat;
            const newUnread = countUnreadEmails();
            const newChatUnread = countUnreadChats();
            if (newUnread > prevUnread) {
                const latest = getVisibleEmails().find(e => e.folder === 'inbox' && !e.read);
                if (latest) pushCommNotification('New email', `${latest.from}: ${latest.subject}`);
            }
            if (newChatUnread > prevChatUnread) {
                const name = getCurrentCommUserName();
                let latestMsg = null;
                let latestRoom = null;
                (chatRoomsDB || []).forEach(room => {
                    const unread = getRoomUnreadCount(room);
                    if (!unread) return;
                    const msgs = (chatMessagesDB || []).filter(m => m.roomId === room.id && m.sender !== name);
                    const last = msgs[msgs.length - 1];
                    if (last && (!latestMsg || last.sentAt > latestMsg.sentAt)) {
                        latestMsg = last;
                        latestRoom = room;
                    }
                });
                if (latestMsg) {
                    pushCommNotification('New chat message', `${latestMsg.sender} in ${latestRoom?.name || 'Chat'}: ${(latestMsg.message || '').slice(0, 80)}`);
                }
            }
            lastKnownUnreadEmail = newUnread;
            lastKnownUnreadChat = newChatUnread;
            if (typeof updateSidebarBadges === 'function') updateSidebarBadges();
            return true;
        } catch (e) {
            console.warn('Internal comm API sync failed:', e.message);
            mergeSharedMailboxIntoLocal();
            return false;
        }
    }

    function startCommPolling() {
        if (commPollTimer) clearInterval(commPollTimer);
        lastKnownUnreadEmail = countUnreadEmails();
        lastKnownUnreadChat = countUnreadChats();
        requestCommNotificationPermission();
        commPollTimer = setInterval(() => {
            syncInternalCommFromApi().then(() => {
                if (typeof currentPage !== 'undefined' && currentPage === 'internal-communication') {
                    if (typeof shouldSkipInternalCommAutoRender === 'function' && shouldSkipInternalCommAutoRender()) {
                        if (typeof updateSidebarBadges === 'function') updateSidebarBadges();
                        return;
                    }
                    if (typeof refreshInternalCommView === 'function') {
                        refreshInternalCommView(true);
                    } else if (typeof renderInternalCommunication === 'function') {
                        renderInternalCommunication(document.getElementById('contentArea'), true);
                    }
                }
            });
        }, 5000);
    }

    function seedWelcomeData() {
        const name = getCurrentCommUserName();
        const email = getCurrentCommUserEmail();
        emailsDB.splice(0, emailsDB.length);
        chatRoomsDB.splice(0, chatRoomsDB.length);
        chatMessagesDB.splice(0, chatMessagesDB.length);
        emailsDB.push({
            id: 'EM-001', folder: 'inbox', threadId: 'TH-001',
            from: 'System', fromEmail: 'system@truckcontrol.local',
            to: [name], toEmails: [email], forUserEmail: email, ownerEmail: email,
            cc: [], bcc: [],
            subject: 'Welcome to TruckControl Internal Mail',
            body: `Hello ${name},\n\nYour internal mailbox is ready. Messages you send to colleagues will appear in their inbox using their account email (${email} is your address).\n\nUse the ribbon tabs (Home, View, Help) for mail actions and switch Dark Mode from View.`,
            sentAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
            read: false, starred: false, important: false, attachments: []
        });
        chatRoomsDB.push({
            id: 'ROOM-001', name: 'Operations Team', type: 'group',
            memberNames: [name], memberEmails: [email],
            avatar: '👥', relatedType: 'user', relatedRef: 'Team',
            pinned: true, muted: false, unreadCount: 0,
            lastMessage: 'Welcome — start a conversation using New Chat',
            lastAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
            createdBy: name
        });
        if (typeof nextEmailId !== 'undefined') nextEmailId = 2;
        if (typeof nextChatRoomId !== 'undefined') nextChatRoomId = 2;
        if (typeof nextChatMessageId !== 'undefined') nextChatMessageId = 1;
    }

    function applyLoadedData(data) {
        emailsDB.splice(0, emailsDB.length, ...(data.emails || []));
        chatRoomsDB.splice(0, chatRoomsDB.length, ...(data.chatRooms || []));
        chatMessagesDB.splice(0, chatMessagesDB.length, ...(data.chatMessages || []));
        window.__commLastReadByRoom = data.lastReadByRoom || {};
        if (typeof nextEmailId !== 'undefined' && data.nextEmailId) nextEmailId = data.nextEmailId;
        if (typeof nextChatRoomId !== 'undefined' && data.nextChatRoomId) nextChatRoomId = data.nextChatRoomId;
        if (typeof nextChatMessageId !== 'undefined' && data.nextChatMessageId) nextChatMessageId = data.nextChatMessageId;
        commTheme = data.commTheme || commTheme;
    }

    function ensureCommHasContent() {
        if ((emailsDB || []).length === 0 && (chatRoomsDB || []).length === 0) {
            seedWelcomeData();
        }
    }

    function initInternalComm(force) {
        if (typeof emailsDB === 'undefined' || (commDataLoaded && !force)) return;
        const stored = readStore();
        if (stored) {
            applyLoadedData(stored);
        }
        ensureCommHasContent();
        replaceLegacyUserRefs(getCurrentCommUserName(), getCurrentCommUserEmail());
        mergeSharedMailboxIntoLocal();
        syncInternalCommFromApi().finally(() => {
            ensureCommHasContent();
            syncRoomUnreadCounts();
            applyCommTheme(commTheme, true);
            commDataLoaded = true;
            writeStore();
            startCommPolling();
            if (typeof currentPage !== 'undefined' && currentPage === 'internal-communication') {
                if (typeof refreshInternalCommView === 'function') {
                    refreshInternalCommView(true);
                } else if (typeof renderInternalCommunication === 'function') {
                    renderInternalCommunication(document.getElementById('contentArea'), true);
                }
            }
        });
    }

    function applyCommTheme(theme, silent) {
        commTheme = theme === 'dark' ? 'dark' : 'light';
        const shell = document.querySelector('.comm-shell');
        if (shell) shell.classList.toggle('comm-dark', commTheme === 'dark');
        if (!silent) writeStore();
    }

    window.toggleCommTheme = function () {
        applyCommTheme(commTheme === 'dark' ? 'light' : 'dark');
        if (typeof refreshInternalCommView === 'function' && currentPage === 'internal-communication') {
            refreshInternalCommView(true);
        } else if (typeof renderInternalCommunication === 'function' && currentPage === 'internal-communication') {
            renderInternalCommunication(document.getElementById('contentArea'), true);
        }
        showToast(`${commTheme === 'dark' ? 'Dark' : 'Light'} mode enabled for email & chat`, 'success');
    };

    window.setCommRibbonTab = function (tab) {
        commRibbonTab = tab;
        if (typeof refreshInternalCommView === 'function' && currentPage === 'internal-communication') {
            refreshInternalCommView(true);
        } else if (typeof renderInternalCommunication === 'function' && currentPage === 'internal-communication') {
            renderInternalCommunication(document.getElementById('contentArea'), true);
        }
    };

    function ribbonBtn(label, icon, onclick, disabled) {
        return `<button type="button" class="comm-ribbon-btn" onclick="${onclick}" ${disabled ? 'disabled' : ''}><span class="comm-ribbon-icon">${icon}</span><span>${label}</span></button>`;
    }

    window.renderCommRibbon = function () {
        const isEmail = internalCommFilter === 'email';
        const isChat = internalCommFilter === 'chat';
        const tabs = [
            { id: 'home', label: 'Home' },
            { id: 'view', label: 'View' },
            { id: 'help', label: 'Help' }
        ];
        let groups = '';
        if (commRibbonTab === 'home') {
            if (isEmail) {
                groups = `<div class="comm-ribbon-group"><div class="comm-ribbon-group-label">New</div><div class="comm-ribbon-group-btns">${ribbonBtn('New mail', '✉️', "openEmailCompose('new')")}</div></div>
                <div class="comm-ribbon-group"><div class="comm-ribbon-group-label">Respond</div><div class="comm-ribbon-group-btns">${ribbonBtn('Reply', '↩️', selectedEmailId ? `openEmailCompose('reply','${selectedEmailId}')` : '', !selectedEmailId)}${ribbonBtn('Forward', '↪️', selectedEmailId ? `openEmailCompose('forward','${selectedEmailId}')` : '', !selectedEmailId)}</div></div>
                <div class="comm-ribbon-group"><div class="comm-ribbon-group-label">Move</div><div class="comm-ribbon-group-btns">${ribbonBtn('Archive', '🗄️', selectedEmailId ? `markEmailAction('${selectedEmailId}','archive')` : '', !selectedEmailId)}${ribbonBtn('Delete', '🗑️', selectedEmailId ? `markEmailAction('${selectedEmailId}','trash')` : '', !selectedEmailId)}</div></div>
                <div class="comm-ribbon-group"><div class="comm-ribbon-group-label">Tags</div><div class="comm-ribbon-group-btns">${ribbonBtn('Mark read', '✓', selectedEmailId ? `markEmailAction('${selectedEmailId}','read')` : '', !selectedEmailId)}${ribbonBtn('Star', '⭐', selectedEmailId ? `toggleEmailStar('${selectedEmailId}')` : '', !selectedEmailId)}</div></div>`;
            } else if (isChat) {
                groups = `<div class="comm-ribbon-group"><div class="comm-ribbon-group-label">Chat</div><div class="comm-ribbon-group-btns">${ribbonBtn('New chat', '💬', 'openNewDirectChatPicker()')}${ribbonBtn('New group', '👥', 'openNewGroupChatForm()')}${ribbonBtn('Refresh', '🔄', 'forceRefreshInternalCommMessages()')}</div></div>
                <div class="comm-ribbon-group"><div class="comm-ribbon-group-label">Room</div><div class="comm-ribbon-group-btns">${ribbonBtn('Pin', '📌', activeChatRoomId ? `toggleChatPin('${activeChatRoomId}')` : '', !activeChatRoomId)}${ribbonBtn('Mute', '🔇', activeChatRoomId ? `toggleChatMute('${activeChatRoomId}')` : '', !activeChatRoomId)}</div></div>`;
            }
        } else if (commRibbonTab === 'view') {
            groups = `<div class="comm-ribbon-group"><div class="comm-ribbon-group-label">Layout</div><div class="comm-ribbon-group-btns">${ribbonBtn('Unread only', '📩', isEmail ? "emailShowUnreadOnly=!emailShowUnreadOnly;refreshInternalCommView(true)" : "chatShowUnreadOnly=!chatShowUnreadOnly;refreshInternalCommView(true)")}${ribbonBtn('Sync', '🔄', 'refreshInternalComm()')}</div></div>
            <div class="comm-ribbon-group"><div class="comm-ribbon-group-label">Theme</div><div class="comm-ribbon-group-btns">${ribbonBtn(commTheme === 'dark' ? 'Light mode' : 'Dark mode', commTheme === 'dark' ? '☀️' : '🌙', 'toggleCommTheme()')}</div></div>`;
        } else {
            groups = `<div class="comm-ribbon-group"><div class="comm-ribbon-group-label">Help</div><div class="comm-ribbon-group-btns">${ribbonBtn('Help', '❓', "typeof toggleHelpAssistant==='function'&&toggleHelpAssistant(true)")}${ribbonBtn('Tips', '💡', "showToast('Link emails to trips, areas, or assets from the compose Link field.','success')")}${ribbonBtn('Support', '🎧', "navigateTo('helpdesk')")}${ribbonBtn('Feedback', '💬', "openEmailCompose('new');setTimeout(()=>{const s=document.getElementById('emailComposeSubject');if(s)s.value='TruckControl feedback';},50)")}</div></div>`;
        }
        return `<div class="comm-ribbon">
            <div class="comm-ribbon-tabs">${tabs.map(t => `<button type="button" class="comm-ribbon-tab${commRibbonTab === t.id ? ' active' : ''}" onclick="setCommRibbonTab('${t.id}')">${t.label}</button>`).join('')}</div>
            <div class="comm-ribbon-body">${groups}</div>
            <div class="comm-ribbon-account">${getCurrentCommUserEmail()}</div>
        </div>`;
    };

    window.refreshInternalComm = function () {
        if (typeof clearInternalCommContactsCache === 'function') clearInternalCommContactsCache();
        initInternalComm(true);
        if (typeof syncAdminUsersToInternalComm === 'function') syncAdminUsersToInternalComm();
        refreshInternalCommContacts().then(() => {
            syncInternalCommFromApi().then(() => {
                syncRoomUnreadCounts();
                writeStore();
                if (typeof updateSidebarBadges === 'function') updateSidebarBadges();
                if (typeof refreshInternalCommView === 'function' && currentPage === 'internal-communication') {
                    refreshInternalCommView(true);
                }
                showToast('Mailbox synced', 'success');
            });
        });
    };

    window.__resetInternalCommSession = function () {
        commDataLoaded = false;
        emailsDB.splice(0, emailsDB.length);
        chatRoomsDB.splice(0, chatRoomsDB.length);
        chatMessagesDB.splice(0, chatMessagesDB.length);
        window.__commLastReadByRoom = {};
    };

    window.getCurrentCommUserName = getCurrentCommUserName;
    window.getCurrentCommUserEmail = getCurrentCommUserEmail;
    window.persistInternalComm = writeStore;
    window.initInternalComm = initInternalComm;
    window.isEmailOwnedByCurrentUser = isEmailOwnedByCurrentUser;
    window.getVisibleEmails = getVisibleEmails;
    window.getRoomUnreadCount = getRoomUnreadCount;
    window.syncCommRoomUnreadCounts = syncRoomUnreadCounts;
    window.markCommRoomRead = markRoomRead;
    window.deliverInternalEmailCopies = deliverEmailCopies;
    window.syncInternalCommFromApi = syncInternalCommFromApi;
    window.pushCommNotification = pushCommNotification;
    window.getCommTheme = () => commTheme;
})();
