const fs = require('fs');

// ── 1. BACKEND: enrich /chat/threads ─────────────────────────────────────────
let srv = fs.readFileSync('backend/server.js', 'utf8');

const OLD_ENRICH = `    // Enrich with item names
    const threads = [];
    for (const t of seen.values()) {
      const item = await Item.findById(t.itemId).select('name').lean();
      threads.push({ ...t, itemName: item ? item.name : 'Deleted item' });
    }`;

const NEW_ENRICH = `    // Enrich with item name, other user's real name, and buy/sell context
    const threads = [];
    for (const t of seen.values()) {
      const item      = await Item.findById(t.itemId).select('name sellerEmail').lean();
      const otherUser = await User.findOne({ email: t.otherEmail }).select('name').lean();
      // isSelling = true  -> current user is the seller (other person is buying from them)
      // isSelling = false -> current user is the buyer  (other person is selling to them)
      const isSelling = !!(item && item.sellerEmail && item.sellerEmail.toLowerCase() === me);
      threads.push({
        ...t,
        itemName:  item      ? item.name      : 'Deleted item',
        otherName: otherUser ? otherUser.name : t.otherEmail,
        isSelling
      });
    }`;

if (srv.includes(OLD_ENRICH)) {
  srv = srv.replace(OLD_ENRICH, NEW_ENRICH);
  console.log('server.js patched OK');
} else {
  console.error('server.js: old pattern not found — check for encoding differences');
  process.exit(1);
}

fs.writeFileSync('backend/server.js', srv, 'utf8');

// ── 2. FRONTEND: rewrite chat.html inline script ──────────────────────────────
// We rewrite only the <script> block, keeping HTML structure intact.
let html = fs.readFileSync('frontend/chat.html', 'utf8');

const OLD_SCRIPT = `  <script src="script.js"></script>
  <script>
    requireAuth();
    const user = getUser();
    document.getElementById('nav-username').textContent = user.name;
    document.getElementById('avatar-initials').textContent = user.name.charAt(0).toUpperCase();

    let activeThread = null;
    let socket       = null;

    // Tracks every rendered message key so appendMessage() never renders the same message twice.
    const renderedMsgIds = new Set();

    function msgKey(m) {
      return m._id ? String(m._id) : (m.senderEmail + '|' + m.text + '|' + m.createdAt);
    }

    // ── Socket ───────────────────────────────────────────────────────────────
    function initSocket() {
      if (socket) return; // only ever create one socket
      socket = io(API, { transports: ['websocket', 'polling'] });

      socket.on('connect', function () {
        setSocketStatus(true);
        if (activeThread) joinRoom(activeThread);
      });

      socket.on('disconnect', function () { setSocketStatus(false); });

      socket.on('room_joined', function (d) {
        console.log('[Socket] joined room:', d.room);
      });

      // Single listener — dedup is handled inside appendMessage()
      socket.on('new_message', function (msg) { appendMessage(msg); });

      socket.on('error', function (d) { console.error('[Socket] error:', d.message); });
    }

    function setSocketStatus(connected) {
      var dot = document.getElementById('socket-status');
      if (!dot) return;
      dot.className = 'socket-dot ' + (connected ? 'connected' : 'disconnected');
      dot.title     = connected ? 'Connected — real-time' : 'Disconnected';
    }

    function joinRoom(thread) {
      if (!socket || !thread) return;
      socket.emit('join_room', {
        itemId:     thread.itemId,
        myEmail:    user.email,
        otherEmail: thread.otherEmail
      });
    }

    // ── Thread list ──────────────────────────────────────────────────────────
    async function loadThreads() {
      try {
        var res  = await fetch(API + '/chat/threads?myEmail=' + encodeURIComponent(user.email));
        var data = await res.json();
        var list = document.getElementById('threads-list');

        if (!data.success || !data.threads.length) {
          list.innerHTML = '<div class="no-threads">No conversations yet.<br>Go to Buy page and message a seller.</div>';
          return;
        }

        list.innerHTML = data.threads.map(function (t) {
          var safeName = esc(t.itemName).replace(/'/g, "\\'");
          return '<div class="thread-item" id="thread-' + t.itemId + '-' + t.otherEmail + '"' 
            + ' onclick="openThread(\\''  + t.itemId    + '\\',\\'' + t.otherEmail + '\\',\\'' + safeName + '\')">' 
            + '<div class="t-name">' + esc(t.otherEmail) + '</div>'
            + '<div class="t-item">📦 ' + esc(t.itemName) + '</div>'
            + '<div class="t-preview">' + esc(t.lastMsg.substring(0, 50)) + (t.lastMsg.length > 50 ? '...' : '') + '</div>'
            + '</div>';
        }).join('');

        var p = new URLSearchParams(window.location.search);
        if (p.get('itemId') && p.get('otherEmail')) {
          openThread(p.get('itemId'), p.get('otherEmail'), p.get('itemName') || 'Item');
        }
      } catch (err) {
        console.error('[loadThreads] error:', err);
      }
    }

    // ── Open a conversation ──────────────────────────────────────────────────
    function openThread(itemId, otherEmail, itemName) {
      activeThread = { itemId: itemId, otherEmail: otherEmail, itemName: itemName };

      document.querySelectorAll('.thread-item').forEach(function (el) { el.classList.remove('active'); });
      var el = document.getElementById('thread-' + itemId + '-' + otherEmail);
      if (el) el.classList.add('active');

      joinRoom(activeThread);

      var panel = document.getElementById('chat-panel');
      panel.innerHTML =
        '<div class="chat-header">'
          + '<div class="ch-avatar">' + otherEmail.charAt(0).toUpperCase() + '</div>'
          + '<div class="ch-info">'
            + '<div class="ch-name">' + esc(otherEmail) + '</div>'
            + '<div class="ch-item">📦 ' + esc(itemName) + '</div>'
          + '</div>'
        + '</div>'
        + '<div class="messages-area" id="messages-area"></div>'
        + '<div class="chat-input-area">'
          + '<textarea id="msg-input" placeholder="Type a message..." rows="1"'
          + ' onkeydown="if(event.key===\\'Enter\\'&&!event.shiftKey){event.preventDefault();sendMessage();}"' 
          + ' oninput="autoResize(this)"></textarea>'
          + '<button class="btn-send" onclick="sendMessage()" id="send-btn" title="Send">➤</button>'
        + '</div>';

      fetchMessages();
    }`;

const NEW_SCRIPT = `  <script src="script.js"></script>
  <script>
    requireAuth();
    const user = getUser();
    document.getElementById('nav-username').textContent = user.name;
    document.getElementById('avatar-initials').textContent = user.name.charAt(0).toUpperCase();

    let activeThread = null;
    let socket       = null;

    // Thread data store — keyed by index so onclick never needs string-escaping
    var _threadStore = [];

    // Tracks every rendered message key so appendMessage() never renders the same message twice.
    const renderedMsgIds = new Set();

    function msgKey(m) {
      return m._id ? String(m._id) : (m.senderEmail + '|' + m.text + '|' + m.createdAt);
    }

    // ── Socket ───────────────────────────────────────────────────────────────
    function initSocket() {
      if (socket) return; // only ever create one socket
      socket = io(API, { transports: ['websocket', 'polling'] });

      socket.on('connect', function () {
        setSocketStatus(true);
        if (activeThread) joinRoom(activeThread);
      });

      socket.on('disconnect', function () { setSocketStatus(false); });

      socket.on('room_joined', function (d) {
        console.log('[Socket] joined room:', d.room);
      });

      // Single listener — dedup is handled inside appendMessage()
      socket.on('new_message', function (msg) { appendMessage(msg); });

      socket.on('error', function (d) { console.error('[Socket] error:', d.message); });
    }

    function setSocketStatus(connected) {
      var dot = document.getElementById('socket-status');
      if (!dot) return;
      dot.className = 'socket-dot ' + (connected ? 'connected' : 'disconnected');
      dot.title     = connected ? 'Connected — real-time' : 'Disconnected';
    }

    function joinRoom(thread) {
      if (!socket || !thread) return;
      socket.emit('join_room', {
        itemId:     thread.itemId,
        myEmail:    user.email,
        otherEmail: thread.otherEmail
      });
    }

    // ── Thread list ──────────────────────────────────────────────────────────
    async function loadThreads() {
      try {
        var res  = await fetch(API + '/chat/threads?myEmail=' + encodeURIComponent(user.email));
        var data = await res.json();
        var list = document.getElementById('threads-list');

        if (!data.success || !data.threads.length) {
          list.innerHTML = '<div class="no-threads">No conversations yet.<br>Go to Buy page and message a seller.</div>';
          return;
        }

        // Store full thread objects so openThreadAt() can retrieve them safely
        _threadStore = data.threads;

        list.innerHTML = data.threads.map(function (t, idx) {
          // isSelling = current user is the seller → other person is Buying from them
          // isSelling = false → current user is Buying from the other person
          var role        = t.isSelling ? 'Buying' : 'Selling';
          var displayName = esc(t.otherName || t.otherEmail);
          var headline    = displayName + ' (' + role + ': ' + esc(t.itemName) + ')';
          var preview     = esc(t.lastMsg.substring(0, 60)) + (t.lastMsg.length > 60 ? '...' : '');
          return '<div class="thread-item" id="thread-' + t.itemId + '-' + t.otherEmail + '"'
            + ' onclick="openThreadAt(' + idx + ')">'
            + '<div class="t-name">' + headline + '</div>'
            + '<div class="t-preview">' + preview + '</div>'
            + '</div>';
        }).join('');

        // Auto-open from URL params (arriving from Buy page)
        var p = new URLSearchParams(window.location.search);
        if (p.get('itemId') && p.get('otherEmail')) {
          // Find matching thread in store, or fall back to minimal data
          var match = _threadStore.find(function (t) {
            return String(t.itemId) === p.get('itemId') && t.otherEmail === p.get('otherEmail');
          });
          if (match) {
            openThreadAt(_threadStore.indexOf(match));
          } else {
            openThread(p.get('itemId'), p.get('otherEmail'), p.get('itemName') || 'Item', '', false);
          }
        }
      } catch (err) {
        console.error('[loadThreads] error:', err);
      }
    }

    // Called from onclick — looks up full thread data by index (no string-escaping needed)
    function openThreadAt(idx) {
      var t = _threadStore[idx];
      if (!t) return;
      openThread(t.itemId, t.otherEmail, t.itemName, t.otherName, t.isSelling);
    }

    // ── Open a conversation ──────────────────────────────────────────────────
    function openThread(itemId, otherEmail, itemName, otherName, isSelling) {
      activeThread = { itemId: itemId, otherEmail: otherEmail, itemName: itemName };

      document.querySelectorAll('.thread-item').forEach(function (el) { el.classList.remove('active'); });
      var el = document.getElementById('thread-' + itemId + '-' + otherEmail);
      if (el) el.classList.add('active');

      joinRoom(activeThread);

      // Display name: prefer real name, fall back to email
      var displayName = otherName || otherEmail;
      // Role label from the other person's perspective
      var roleLabel   = isSelling ? 'Buying' : 'Selling';

      var panel = document.getElementById('chat-panel');
      panel.innerHTML =
        '<div class="chat-header">'
          + '<div class="ch-avatar">' + esc(displayName).charAt(0).toUpperCase() + '</div>'
          + '<div class="ch-info">'
            + '<div class="ch-name">' + esc(displayName) + '</div>'
            + '<div class="ch-item">📦 ' + roleLabel + ': ' + esc(itemName) + '</div>'
          + '</div>'
        + '</div>'
        + '<div class="messages-area" id="messages-area"></div>'
        + '<div class="chat-input-area">'
          + '<textarea id="msg-input" placeholder="Type a message..." rows="1"'
          + ' onkeydown="if(event.key===\\'Enter\\'&&!event.shiftKey){event.preventDefault();sendMessage();}"'
          + ' oninput="autoResize(this)"></textarea>'
          + '<button class="btn-send" onclick="sendMessage()" id="send-btn" title="Send">➤</button>'
        + '</div>';

      fetchMessages();
    }`;

if (html.includes(OLD_SCRIPT)) {
  html = html.replace(OLD_SCRIPT, NEW_SCRIPT);
  console.log('chat.html patched OK');
} else {
  console.error('chat.html: old script block not found — check for encoding differences');
  // Show first 100 chars of what we're looking for vs what's in the file
  const searchStart = OLD_SCRIPT.substring(0, 80);
  console.error('Looking for:', JSON.stringify(searchStart));
  const idx = html.indexOf('loadThreads');
  console.error('loadThreads found at index:', idx);
  process.exit(1);
}

fs.writeFileSync('frontend/chat.html', html, 'utf8');

// ── Verify ────────────────────────────────────────────────────────────────────
const h2 = fs.readFileSync('frontend/chat.html', 'utf8');
const s2 = fs.readFileSync('backend/server.js', 'utf8');
const checks = [
  ['server: otherName returned',    s2.includes('otherName')],
  ['server: isSelling returned',    s2.includes('isSelling')],
  ['server: sellerEmail selected',  s2.includes("select('name sellerEmail')")],
  ['chat: _threadStore array',      h2.includes('_threadStore')],
  ['chat: openThreadAt function',   h2.includes('function openThreadAt')],
  ['chat: role label Buying',       h2.includes("'Buying'")],
  ['chat: role label Selling',      h2.includes("'Selling'")],
  ['chat: displayName in header',   h2.includes('esc(displayName)')],
  ['chat: no raw email in onclick',!h2.includes("openThread(\\''")],
];
console.log('\nVerification:');
checks.forEach(function(c) { console.log('  ' + (c[1] ? 'OK  ' : 'FAIL') + ' ' + c[0]); });
const allOk = checks.every(function(c) { return c[1]; });
console.log(allOk ? '\nAll checks passed.' : '\nSome checks FAILED.');
