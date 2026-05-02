const fs = require('fs');

// ── 1. Patch backend/server.js ────────────────────────────────────────────────
let srv = fs.readFileSync('backend/server.js', 'utf8');

// Replace the enrichment block inside /chat/threads
srv = srv.replace(
  `    // Enrich with item names
    const threads = [];
    for (const t of seen.values()) {
      const item = await Item.findById(t.itemId).select('name').lean();
      threads.push({ ...t, itemName: item ? item.name : 'Deleted item' });
    }`,
  `    // Enrich with item name, other user's real name, and buy/sell role
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
    }`
);

fs.writeFileSync('backend/server.js', srv, 'utf8');
console.log('server.js patched:', srv.includes('otherName') && srv.includes('isSelling') ? 'OK' : 'FAIL');

// ── 2. Patch frontend/chat.html ───────────────────────────────────────────────
let html = fs.readFileSync('frontend/chat.html', 'utf8');

// ── 2a. Replace the thread list rendering ─────────────────────────────────────
// Old: builds onclick strings with escaped args, shows email + item name
// New: stores threads in window._threads[], uses index-based onclick, shows Name (Role: Item)
const OLD_RENDER = `        list.innerHTML = data.threads.map(function (t) {
          var safeName = esc(t.itemName).replace(/'/g, "\\'");
          return '<div class="thread-item" id="thread-' + t.itemId + '-' + t.otherEmail + '"' 
            + ' onclick="openThread(\\''  + t.itemId    + '\\',\\'' + t.otherEmail + '\\',\\'' + safeName + '\')">' 
            + '<div class="t-name">' + esc(t.otherEmail) + '</div>'
            + '<div class="t-item">📦 ' + esc(t.itemName) + '</div>'
            + '<div class="t-preview">' + esc(t.lastMsg.substring(0, 50)) + (t.lastMsg.length > 50 ? '...' : '') + '</div>'
            + '</div>';
        }).join('');`;

const NEW_RENDER = `        // Store full thread objects so openThread can access them without string-escaping
        window._chatThreads = data.threads;

        list.innerHTML = data.threads.map(function (t, idx) {
          // Role from the current user's perspective:
          //   isSelling = true  -> other person is Buying from me
          //   isSelling = false -> other person is Selling to me
          var role        = t.isSelling ? 'Buying' : 'Selling';
          var displayName = esc(t.otherName || t.otherEmail);
          var preview     = esc(t.lastMsg.substring(0, 55)) + (t.lastMsg.length > 55 ? '...' : '');
          return '<div class="thread-item" id="thread-' + t.itemId + '-' + t.otherEmail + '"'
            + ' onclick="openThreadByIdx(' + idx + ')">'
            + '<div class="t-name">' + displayName + '</div>'
            + '<div class="t-item">📦 ' + role + ': ' + esc(t.itemName) + '</div>'
            + '<div class="t-preview">' + preview + '</div>'
            + '</div>';
        }).join('');`;

html = html.replace(OLD_RENDER, NEW_RENDER);

// ── 2b. Add openThreadByIdx helper + update openThread signature ───────────────
const OLD_OPEN_FN = `    // ── Open a conversation ──────────────────────────────────────────────────
    function openThread(itemId, otherEmail, itemName) {
      activeThread = { itemId: itemId, otherEmail: otherEmail, itemName: itemName };`;

const NEW_OPEN_FN = `    // ── Open a conversation ──────────────────────────────────────────────────
    // Called from the thread list — looks up the full thread object by index
    // so we never have to escape strings inside onclick attributes.
    function openThreadByIdx(idx) {
      var t = window._chatThreads && window._chatThreads[idx];
      if (!t) return;
      openThread(t.itemId, t.otherEmail, t.itemName, t.otherName || t.otherEmail, t.isSelling);
    }

    function openThread(itemId, otherEmail, itemName, otherName, isSelling) {
      activeThread = { itemId: itemId, otherEmail: otherEmail, itemName: itemName, otherName: otherName, isSelling: isSelling };`;

html = html.replace(OLD_OPEN_FN, NEW_OPEN_FN);

// ── 2c. Update the chat header to show real name + role label ─────────────────
const OLD_HEADER = `      var panel = document.getElementById('chat-panel');
      panel.innerHTML =
        '<div class="chat-header">'
          + '<div class="ch-avatar">' + otherEmail.charAt(0).toUpperCase() + '</div>'
          + '<div class="ch-info">'
            + '<div class="ch-name">' + esc(otherEmail) + '</div>'
            + '<div class="ch-item">📦 ' + esc(itemName) + '</div>'
          + '</div>'
        + '</div>'`;

const NEW_HEADER = `      var displayName = otherName || otherEmail;
      var roleLabel   = isSelling ? 'Buying' : 'Selling';
      var panel = document.getElementById('chat-panel');
      panel.innerHTML =
        '<div class="chat-header">'
          + '<div class="ch-avatar">' + esc(displayName).charAt(0).toUpperCase() + '</div>'
          + '<div class="ch-info">'
            + '<div class="ch-name">' + esc(displayName) + '</div>'
            + '<div class="ch-item">📦 ' + roleLabel + ': ' + esc(itemName) + '</div>'
          + '</div>'
        + '</div>'`;

html = html.replace(OLD_HEADER, NEW_HEADER);

// ── 2d. Fix auto-open from URL params (arriving from Buy page) ────────────────
// The URL only has itemId, otherEmail, itemName — no otherName/isSelling.
// Pass safe defaults; the thread list will show the full info when loaded.
html = html.replace(
  `          openThread(p.get('itemId'), p.get('otherEmail'), p.get('itemName') || 'Item');`,
  `          openThread(p.get('itemId'), p.get('otherEmail'), p.get('itemName') || 'Item', p.get('otherEmail'), false);`
);

fs.writeFileSync('frontend/chat.html', html, 'utf8');

// ── Verify ────────────────────────────────────────────────────────────────────
const h = fs.readFileSync('frontend/chat.html', 'utf8');
const s = fs.readFileSync('backend/server.js', 'utf8');
const checks = [
  ['server: otherName returned',    s.includes('otherName')],
  ['server: isSelling returned',    s.includes('isSelling')],
  ['html: _chatThreads store',      h.includes('_chatThreads')],
  ['html: openThreadByIdx',         h.includes('openThreadByIdx')],
  ['html: role label Buying',       h.includes("'Buying'")],
  ['html: role label Selling',      h.includes("'Selling'")],
  ['html: displayName in header',   h.includes('displayName')],
  ['html: no raw email in t-name',  !h.includes("esc(t.otherEmail) + '</div>'")],
];
console.log('\nVerification:');
checks.forEach(function(c) { console.log('  ' + (c[1] ? 'OK  ' : 'FAIL') + ' ' + c[0]); });
