const fs = require('fs');

// ─── PATCH 1: backend/server.js — enrich /chat/threads with otherName + isSelling ───
let srv = fs.readFileSync('backend/server.js', 'utf8');

// Find the threads enrichment block and replace it
const oldEnrich = `    // Enrich with item names
    const threads = [];
    for (const t of seen.values()) {
      const item = await Item.findById(t.itemId).select('name').lean();
      threads.push({ ...t, itemName: item ? item.name : 'Deleted item' });
    }`;

const newEnrich = `    // Enrich with item name, other user's display name, and buy/sell context
    const threads = [];
    for (const t of seen.values()) {
      const item      = await Item.findById(t.itemId).select('name sellerEmail').lean();
      const otherUser = await User.findOne({ email: t.otherEmail }).select('name').lean();
      // isSelling = true  -> current user is the seller (other person is buying)
      // isSelling = false -> current user is the buyer  (other person is selling)
      const isSelling = item && item.sellerEmail && item.sellerEmail.toLowerCase() === me;
      threads.push({
        ...t,
        itemName:  item      ? item.name   : 'Deleted item',
        otherName: otherUser ? otherUser.name : t.otherEmail,
        isSelling: !!isSelling
      });
    }`;

if (srv.includes(oldEnrich)) {
  srv = srv.replace(oldEnrich, newEnrich);
  console.log('server.js: threads enrichment patched OK');
} else {
  console.log('server.js: WARNING — old pattern not found, trying fuzzy match');
  // Try to find and replace just the item select line
  srv = srv.replace(
    "const item = await Item.findById(t.itemId).select('name').lean();",
    "const item      = await Item.findById(t.itemId).select('name sellerEmail').lean();\n      const otherUser = await User.findOne({ email: t.otherEmail }).select('name').lean();\n      const isSelling = item && item.sellerEmail && item.sellerEmail.toLowerCase() === me;"
  );
  srv = srv.replace(
    "threads.push({ ...t, itemName: item ? item.name : 'Deleted item' });",
    "threads.push({ ...t, itemName: item ? item.name : 'Deleted item', otherName: otherUser ? otherUser.name : t.otherEmail, isSelling: !!isSelling });"
  );
  console.log('server.js: fuzzy patch applied');
}

fs.writeFileSync('backend/server.js', srv, 'utf8');

// ─── PATCH 2: frontend/chat.html — better thread display + reliable navigation ───
let html = fs.readFileSync('frontend/chat.html', 'utf8');

// Replace the loadThreads function's thread rendering and openThread call
const oldThreadRender = `        list.innerHTML = data.threads.map(function (t) {
          var safeName = esc(t.itemName).replace(/'/g, "\\'");
          return '<div class="thread-item" id="thread-' + t.itemId + '-' + t.otherEmail + '"' 
            + ' onclick="openThread(\\''  + t.itemId    + '\\',\\'' + t.otherEmail + '\\',\\'' + safeName + '\\')">' 
            + '<div class="t-name">' + esc(t.otherEmail) + '</div>'
            + '<div class="t-item">📦 ' + esc(t.itemName) + '</div>'
            + '<div class="t-preview">' + esc(t.lastMsg.substring(0, 50)) + (t.lastMsg.length > 50 ? '...' : '') + '</div>'
            + '</div>';
        }).join('');`;

const newThreadRender = `        // Store threads in a map so openThread can look up full data by index
        window._threads = {};
        list.innerHTML = data.threads.map(function (t, idx) {
          window._threads[idx] = t;
          // Role label: if current user is seller -> other person is Buying; else Selling
          var roleLabel = t.isSelling ? 'Buying' : 'Selling';
          var displayName = esc(t.otherName || t.otherEmail);
          var label = displayName + ' (' + roleLabel + ': ' + esc(t.itemName) + ')';
          return '<div class="thread-item" id="thread-' + t.itemId + '-' + t.otherEmail + '"'
            + ' onclick="openThreadByIndex(' + idx + ')">'
            + '<div class="t-name">' + label + '</div>'
            + '<div class="t-preview">' + esc(t.lastMsg.substring(0, 60)) + (t.lastMsg.length > 60 ? '...' : '') + '</div>'
            + '</div>';
        }).join('');`;

if (html.includes("var safeName = esc(t.itemName).replace")) {
  html = html.replace(oldThreadRender, newThreadRender);
  console.log('chat.html: thread render patched OK');
} else {
  // Fallback: replace just the inner map content
  html = html.replace(
    /list\.innerHTML = data\.threads\.map\(function \(t\) \{[\s\S]*?\}\)\.join\(''\);/,
    newThreadRender
  );
  console.log('chat.html: thread render patched via regex');
}

// Add openThreadByIndex helper right before the openThread function
const openThreadFn = `    // ── Open a conversation ──────────────────────────────────────────────────
    function openThread(itemId, otherEmail, itemName) {`;

const openThreadWithHelper = `    // ── Open a conversation ──────────────────────────────────────────────────
    // Called from thread list — looks up full thread data by index
    function openThreadByIndex(idx) {
      var t = window._threads && window._threads[idx];
      if (!t) return;
      openThread(t.itemId, t.otherEmail, t.itemName, t.otherName, t.isSelling);
    }

    function openThread(itemId, otherEmail, itemName, otherName, isSelling) {`;

if (html.includes(openThreadFn)) {
  html = html.replace(openThreadFn, openThreadWithHelper);
  console.log('chat.html: openThreadByIndex helper added OK');
} else {
  console.log('chat.html: WARNING — openThread pattern not found');
}

// Update openThread body to use otherName in the header and show role in chat header
const oldHeader = `      var panel = document.getElementById('chat-panel');
      panel.innerHTML =
        '<div class="chat-header">'
          + '<div class="ch-avatar">' + otherEmail.charAt(0).toUpperCase() + '</div>'
          + '<div class="ch-info">'
            + '<div class="ch-name">' + esc(otherEmail) + '</div>'
            + '<div class="ch-item">📦 ' + esc(itemName) + '</div>'
          + '</div>'
        + '</div>'`;

const newHeader = `      var displayName = otherName || otherEmail;
      var roleLabel   = isSelling ? 'Buying' : 'Selling';
      var panel = document.getElementById('chat-panel');
      panel.innerHTML =
        '<div class="chat-header">'
          + '<div class="ch-avatar">' + displayName.charAt(0).toUpperCase() + '</div>'
          + '<div class="ch-info">'
            + '<div class="ch-name">' + esc(displayName) + '</div>'
            + '<div class="ch-item">📦 ' + roleLabel + ': ' + esc(itemName) + '</div>'
          + '</div>'
        + '</div>'`;

if (html.includes(oldHeader)) {
  html = html.replace(oldHeader, newHeader);
  console.log('chat.html: chat header patched OK');
} else {
  console.log('chat.html: WARNING — chat header pattern not found');
}

// Also update activeThread to store otherName and isSelling
html = html.replace(
  'activeThread = { itemId: itemId, otherEmail: otherEmail, itemName: itemName };',
  'activeThread = { itemId: itemId, otherEmail: otherEmail, itemName: itemName, otherName: otherName, isSelling: isSelling };'
);

// Update auto-open from URL params to pass extra args (they'll be undefined, which is fine)
html = html.replace(
  "openThread(p.get('itemId'), p.get('otherEmail'), p.get('itemName') || 'Item');",
  "openThread(p.get('itemId'), p.get('otherEmail'), p.get('itemName') || 'Item', p.get('otherName') || '', false);"
);

fs.writeFileSync('frontend/chat.html', html, 'utf8');
console.log('chat.html: all patches written');

// ─── Verify ───────────────────────────────────────────────────────────────────
const h2 = fs.readFileSync('frontend/chat.html', 'utf8');
const s2 = fs.readFileSync('backend/server.js', 'utf8');
console.log('\nVerification:');
console.log('  otherName in server.js  :', s2.includes('otherName'));
console.log('  isSelling in server.js  :', s2.includes('isSelling'));
console.log('  openThreadByIndex in html:', h2.includes('openThreadByIndex'));
console.log('  roleLabel in html        :', h2.includes('roleLabel'));
console.log('  Buying/Selling label     :', h2.includes("'Buying'") && h2.includes("'Selling'"));
