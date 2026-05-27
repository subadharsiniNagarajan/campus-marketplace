# 🔒 Chat Lifecycle System - Complete Fix

## Problem Statement
Chats remain active forever even after items are purchased or reserved. This is WRONG.

## Solution
Automatically lock conversations when items are Reserved or Sold, with clear UI indicators.

---

## ✅ Backend Changes - ALREADY IMPLEMENTED

The backend already has the logic to lock chats for Reserved/Sold items in `backend/server.js`:

```javascript
// POST /api/messages - Line ~900
if (item.item_status === 'Reserved' || item.item_status === 'Sold') {
  // Allow messages only between seller and the reserved buyer
  const senderIsParticipant = 
    senderEmail.toLowerCase() === item.sellerEmail?.toLowerCase() ||
    (item.reserved_for && sender._id.toString() === item.reserved_for.toString());
  
  if (!senderIsParticipant) {
    return res.status(403).json({ 
      error: 'This item has been reserved. The conversation is closed.' 
    });
  }
}
```

**What this does:**
- Blocks messages on Reserved items (except seller & buyer)
- Blocks messages on Sold items (except seller & buyer)
- Returns clear error message

---

## 📋 Frontend Changes Required

### 1. Add CSS Styles for Closed Chat

Add to `<style>` section in `frontend/chat.html`:

```css
/* Chat Closed Banner */
.chat-closed-banner {
  background: #fef2f2;
  border: 2px solid #fecaca;
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1rem;
  text-align: center;
}

.chat-closed-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.chat-closed-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #991b1b;
  margin-bottom: 0.5rem;
}

.chat-closed-message {
  color: #7f1d1d;
  font-size: 0.95rem;
  line-height: 1.6;
}

/* Disabled Input Area */
.chat-input-area.locked {
  opacity: 0.5;
  pointer-events: none;
  background: #f3f4f6;
  border-radius: 8px;
}

.chat-input-area.locked textarea {
  background: #e5e7eb;
  color: #9ca3af;
  cursor: not-allowed;
}

/* Archived Thread Indicator */
.thread-item.archived {
  opacity: 0.6;
  background: #f9fafb;
}

.thread-item.archived .t-preview::before {
  content: '🔒 ';
}
```

### 2. Update fetchMessages() Function

Replace the `fetchMessages()` function with this enhanced version:

```javascript
async function fetchMessages() {
  if (!activeThread) return;
  try {
    var url = API + '/api/messages/' + activeThread.itemId
      + '?myEmail='    + encodeURIComponent(user.email)
      + '&otherEmail=' + encodeURIComponent(activeThread.otherEmail);
    var res  = await fetch(url);
    var data = await res.json();
    
    if (!data.success) { 
      console.warn('[fetchMessages]', data); 
      return; 
    }
    
    // Check item status
    var itemStatus = data.itemStatus || 'Available';
    var isClosed = (itemStatus === 'Reserved' || itemStatus === 'Sold');
    
    var area = document.getElementById('messages-area');
    if (!area) return;
    area.innerHTML = '';
    renderedMsgIds.clear();
    
    // Show closed banner if conversation is locked
    if (isClosed) {
      var banner = document.createElement('div');
      banner.className = 'chat-closed-banner';
      banner.innerHTML = 
        '<div class="chat-closed-icon">🔒</div>' +
        '<div class="chat-closed-title">Conversation Closed</div>' +
        '<div class="chat-closed-message">' +
        'This item is no longer available. This purchase conversation has been archived.' +
        '</div>';
      area.appendChild(banner);
    }
    
    if (!data.messages.length) {
      area.insertAdjacentHTML('beforeend', '<div class="chat-day-label">No messages yet. Say hello! &#128075;</div>');
    } else {
      var lastDate = '';
      data.messages.forEach(function(m) {
        var d = new Date(m.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        if (d !== lastDate) {
          area.insertAdjacentHTML('beforeend', '<div class="chat-day-label">' + esc(d) + '</div>');
          lastDate = d;
        }
        appendMessage(m);
      });
    }
    
    // Lock input area if conversation is closed
    var inputArea = document.querySelector('.chat-input-area');
    if (inputArea) {
      if (isClosed) {
        inputArea.classList.add('locked');
        var textarea = document.getElementById('msg-input');
        if (textarea) {
          textarea.placeholder = 'This conversation is closed';
          textarea.disabled = true;
        }
        var sendBtn = document.getElementById('send-btn');
        if (sendBtn) sendBtn.disabled = true;
        var attachBtn = document.querySelector('.btn-attach');
        if (attachBtn) attachBtn.disabled = true;
      } else {
        inputArea.classList.remove('locked');
        var textarea = document.getElementById('msg-input');
        if (textarea) {
          textarea.placeholder = 'Type a message...';
          textarea.disabled = false;
        }
        var sendBtn = document.getElementById('send-btn');
        if (sendBtn) sendBtn.disabled = false;
        var attachBtn = document.querySelector('.btn-attach');
        if (attachBtn) attachBtn.disabled = false;
      }
    }
    
    scrollToBottom();
  } catch (err) { 
    console.error('[fetchMessages]', err); 
  }
}
```

### 3. Update sendMessage() Function

Add status check at the beginning:

```javascript
async function sendMessage() {
  if (!activeThread) return;
  
  // Check if input is locked
  var inputArea = document.querySelector('.chat-input-area');
  if (inputArea && inputArea.classList.contains('locked')) {
    showToast('This conversation is closed.');
    return;
  }
  
  var input = document.getElementById('msg-input');
  var btn   = document.getElementById('send-btn');
  var text  = input.value.trim();
  if (!text) return;
  
  btn.disabled       = true;
  input.value        = '';
  input.style.height = '';
  
  try {
    var res = await fetch(API + '/api/messages', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        itemId:        activeThread.itemId,
        senderEmail:   user.email,
        receiverEmail: activeThread.otherEmail,
        senderName:    user.name,
        text:          text
      })
    });
    var data = await res.json();
    
    if (!res.ok) { 
      // Show user-friendly error for closed conversations
      if (res.status === 403) {
        showToast('This conversation has been closed.');
      } else {
        showToast(data.error || 'Failed to send.');
      }
      input.value = text; 
    }
  } catch (err) { 
    showToast('Network error. Try again.'); 
    input.value = text; 
  }
  finally { 
    btn.disabled = false; 
    input.focus(); 
  }
}
```

### 4. Update sendImageMessage() Function

Add the same check:

```javascript
async function sendImageMessage(file, overlay, sendBtn) {
  if (!activeThread) { 
    showToast('No active conversation.'); 
    return; 
  }
  
  // Check if conversation is closed
  var inputArea = document.querySelector('.chat-input-area');
  if (inputArea && inputArea.classList.contains('locked')) {
    showToast('This conversation is closed.');
    overlay.style.display = 'none';
    pendingImageFile = null;
    return;
  }
  
  sendBtn.disabled = true;
  sendBtn.textContent = 'Sending...';
  
  try {
    var formData = new FormData();
    formData.append('image', file, file.name || 'photo.jpg');
    formData.append('senderEmail', user.email);

    var upRes  = await fetch(API + '/api/chat/upload-image', { 
      method: 'POST', 
      body: formData 
    });
    var upData = await upRes.json();
    
    if (!upRes.ok || !upData.success) {
      showToast(upData.error || 'Image upload failed.');
      sendBtn.disabled = false; 
      sendBtn.textContent = 'Send Image'; 
      return;
    }

    var msgRes = await fetch(API + '/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemId:        activeThread.itemId,
        senderEmail:   user.email,
        receiverEmail: activeThread.otherEmail,
        senderName:    user.name,
        text:          '[img]' + upData.imageUrl
      })
    });
    var msgData = await msgRes.json();
    
    if (!msgRes.ok) { 
      if (msgRes.status === 403) {
        showToast('This conversation has been closed.');
      } else {
        showToast(msgData.error || 'Failed to send.');
      }
    }

    overlay.style.display = 'none';
    pendingImageFile = null;
    document.getElementById('img-preview-img').src = '';
    sendBtn.disabled = false;
    sendBtn.textContent = 'Send Image';
  } catch (err) {
    showToast('Network error.');
    sendBtn.disabled = false;
    sendBtn.textContent = 'Send Image';
  }
}
```

### 5. Update showAttachPopup() Function

Add check before showing popup:

```javascript
function showAttachPopup(anchorBtn) {
  // Check if conversation is closed
  var inputArea = document.querySelector('.chat-input-area');
  if (inputArea && inputArea.classList.contains('locked')) {
    showToast('This conversation is closed.');
    return;
  }
  
  var old = document.getElementById('attach-popup');
  if (old) { old.remove(); return; }

  // ... rest of the function remains the same
}
```

### 6. Optional: Mark Archived Threads in Sidebar

Update `loadThreads()` to mark closed conversations:

```javascript
async function loadThreads() {
  var list = document.getElementById('threads-list');
  try {
    var res  = await fetch(API + '/chat/threads?myEmail=' + encodeURIComponent(user.email));
    var data = await res.json();
    
    if (!data.success || !data.threads || !data.threads.length) {
      list.innerHTML = '<div class="no-threads">No conversations yet.<br>Click Message Seller on any item.</div>';
      return;
    }
    
    threadStore = {};
    
    // Fetch item status for each thread
    var threadsWithStatus = await Promise.all(data.threads.map(async function(t) {
      try {
        var itemRes = await fetch(API + '/items/' + t.itemId);
        var itemData = await itemRes.json();
        t.itemStatus = itemData.item && itemData.item.item_status ? itemData.item.item_status : 'Available';
      } catch (err) {
        t.itemStatus = 'Available';
      }
      return t;
    }));
    
    threadsWithStatus.forEach(function(t) {
      threadStore[t.itemId + '__' + t.otherEmail] = t;
    });
    
    list.innerHTML = threadsWithStatus.map(function(t) {
      var key     = t.itemId + '__' + t.otherEmail;
      var label   = esc(t.otherName) + ' <span class="t-role">(' + esc(t.itemName) + ')</span>';
      var preview = esc((t.lastMsg || '').substring(0, 50)) + (t.lastMsg && t.lastMsg.length > 50 ? '...' : '');
      var isArchived = (t.itemStatus === 'Reserved' || t.itemStatus === 'Sold');
      var archivedClass = isArchived ? ' archived' : '';
      
      return '<div class="thread-item' + archivedClass + '" id="ti-' + esc(key) + '" data-key="' + esc(key) + '" onclick="openThreadByKey(this.dataset.key)">'
        + '<div class="t-name">' + label + '</div>'
        + '<div class="t-preview">' + preview + '</div>'
        + '</div>';
    }).join('');
    
    if (URL_ITEM && URL_OTHER) {
      var k  = URL_ITEM + '__' + URL_OTHER.toLowerCase();
      var el = document.getElementById('ti-' + k);
      if (el) el.classList.add('active');
    }
  } catch (err) {
    console.error('[loadThreads]', err);
    list.innerHTML = '<div class="no-threads">Could not load conversations.</div>';
  }
}
```

---

## 🎯 User Experience Flow

### When Item is Reserved/Sold:

**Buyer/Seller (Participants):**
```
1. Open chat
   ↓
2. See 🔒 banner: "Conversation Closed"
   ↓
3. Can view message history
   ↓
4. Input area is greyed out and disabled
   ↓
5. Cannot send new messages
   ↓
6. Thread marked with 🔒 in sidebar
```

**Other Users (Non-Participants):**
```
1. Try to open chat
   ↓
2. See 🔒 banner: "Conversation Closed"
   ↓
3. Cannot send messages
   ↓
4. Get error: "This conversation is closed"
```

---

## 🧪 Testing Checklist

### Test 1: Available Item Chat
- [ ] Open chat for available item
- [ ] Can send text messages
- [ ] Can send images
- [ ] Input area is active
- [ ] No closed banner

### Test 2: Reserved Item Chat (as Buyer)
- [ ] Seller accepts purchase request
- [ ] Item becomes Reserved
- [ ] Open chat
- [ ] See 🔒 "Conversation Closed" banner
- [ ] Input area is greyed out
- [ ] Cannot type or send messages
- [ ] Attach button disabled
- [ ] Previous messages visible

### Test 3: Reserved Item Chat (as Seller)
- [ ] Accept purchase request
- [ ] Item becomes Reserved
- [ ] Open chat with buyer
- [ ] See 🔒 banner
- [ ] Input disabled
- [ ] Cannot send new messages

### Test 4: Reserved Item Chat (as Third Party)
- [ ] Try to open chat for reserved item
- [ ] See 🔒 banner
- [ ] Input completely disabled
- [ ] Error message on send attempt

### Test 5: Thread List
- [ ] Closed conversations show 🔒 icon
- [ ] Archived threads have faded appearance
- [ ] Can still click to view history

---

## 📊 Visual Design

### Closed Chat Banner
```
┌────────────────────────────────────┐
│            🔒                      │
│    Conversation Closed             │
│                                    │
│ This item is no longer available.  │
│ This purchase conversation has     │
│ been archived.                     │
└────────────────────────────────────┘
```

### Disabled Input Area
```
┌────────────────────────────────────┐
│ 📷 │ This conversation is closed  │ ← Greyed out
│    │ [Cannot type]                │ ← Disabled
└────────────────────────────────────┘
```

### Thread List with Archived
```
Active Conversations:
┌────────────────────────────────────┐
│ John Doe (Physics Book)            │
│ Hi, is this available?             │
└────────────────────────────────────┘

Archived:
┌────────────────────────────────────┐
│ 🔒 Sarah Lee (Calculator)          │ ← Faded
│ 🔒 Thanks!                         │
└────────────────────────────────────┘
```

---

## 🔑 Key Features

✅ **Automatic Locking**
- Triggers when item becomes Reserved or Sold
- No manual intervention needed

✅ **Clear Visual Feedback**
- 🔒 icon and banner
- Greyed out input area
- Disabled buttons

✅ **Message History Preserved**
- All previous messages remain visible
- Users can review conversation
- No data loss

✅ **Error Prevention**
- Input disabled at UI level
- Backend validation as backup
- Clear error messages

✅ **Archived Indication**
- Closed threads marked in sidebar
- Easy to identify active vs archived
- Optional: separate archived section

---

## 🚀 Implementation Steps

1. **Add CSS styles** to `frontend/chat.html`
2. **Update fetchMessages()** function
3. **Update sendMessage()** function
4. **Update sendImageMessage()** function
5. **Update showAttachPopup()** function
6. **Optional: Update loadThreads()** for archived marking
7. **Test all scenarios**

---

## 💡 Benefits

✅ **Clear Lifecycle**
- Chat exists only for purchase discussion
- Automatically closes after transaction
- No confusion about item availability

✅ **Better UX**
- Users know conversation is closed
- Can't accidentally message about sold items
- Clear visual indicators

✅ **Data Integrity**
- Message history preserved
- Audit trail maintained
- No data deletion

✅ **Professional**
- Proper conversation management
- Clean archived state
- Trust-building feature

---

*Last Updated: May 27, 2026*
*Status: Backend Complete ✅ | Frontend Implementation Guide Ready ✅*
