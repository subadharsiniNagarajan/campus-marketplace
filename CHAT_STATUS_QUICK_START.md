# Chat Status System - Quick Start Guide

## 🚀 Quick Implementation Steps

### Step 1: Backend is Already Updated ✅
The backend changes have been applied to `backend/server.js`:
- ✅ Added `item_status` field to Item schema
- ✅ Added PUT `/items/:id/status` endpoint
- ✅ Modified POST `/api/messages` to block sold items
- ✅ Modified GET `/api/messages/:itemId` to return status
- ✅ Updated purchase response handler

### Step 2: Run Database Migration

```bash
# Navigate to project root
cd "C:\Users\Suba Darsini\Downloads\campus mart (3) (1)\campus mart (2)\campus mart\New folder"

# Run migration script
node migrate_item_status.js
```

Expected output:
```
🚀 Starting item_status migration...
✅ Connected to MongoDB
📊 Total items in database: X
✅ Updated Y sold items to status 'Sold'
✅ Updated Z available items to status 'Available'
✅ Migration completed successfully!
```

### Step 3: Update Frontend Chat

Replace the content of `frontend/chat.html` with the improved version. Key changes needed:

#### A. Add CSS Styles (in `<style>` section)

```css
/* Item status badge */
.item-status-badge { 
  display:inline-block; 
  padding:.25rem .6rem; 
  border-radius:6px; 
  font-size:.7rem; 
  font-weight:700; 
  text-transform:uppercase; 
  letter-spacing:.5px;
  margin-left:.5rem;
}
.item-status-badge.available { background:#10b981; color:#fff; }
.item-status-badge.reserved { background:#f59e0b; color:#fff; }
.item-status-badge.sold { background:#ef4444; color:#fff; }

/* Sold banner */
.chat-sold-banner {
  background:#fef2f2;
  border:1px solid #fecaca;
  border-radius:8px;
  padding:.75rem 1rem;
  margin:.75rem;
  display:flex;
  align-items:center;
  gap:.6rem;
  color:#991b1b;
  font-size:.88rem;
  font-weight:600;
}
.chat-sold-banner-icon { font-size:1.3rem; }

/* Disabled input state */
.chat-input-area.disabled { opacity:.6; pointer-events:none; }
.chat-input-area.disabled textarea { background:#f3f4f6; color:#9ca3af; }
```

#### B. Add JavaScript Variable (at top of script)

```javascript
var currentItemStatus = 'Available'; // Track current item status
```

#### C. Add Status Update Function

```javascript
function updateChatStatus(status) {
  currentItemStatus = status || 'Available';
  var badge = document.getElementById('item-status-badge');
  var inputWrap = document.getElementById('chat-input-wrap');
  var messagesArea = document.getElementById('messages-area');
  
  if (!badge || !inputWrap || !messagesArea) return;
  
  // Update badge
  badge.className = 'item-status-badge ' + status.toLowerCase();
  badge.textContent = status;
  
  // If sold, disable input and show banner
  if (status === 'Sold') {
    inputWrap.classList.add('disabled');
    document.getElementById('msg-input').placeholder = 'This conversation is closed';
    
    // Add sold banner if not already present
    if (!document.getElementById('sold-banner')) {
      var banner = document.createElement('div');
      banner.className = 'chat-sold-banner';
      banner.id = 'sold-banner';
      banner.innerHTML = '<span class="chat-sold-banner-icon">🔒</span>' +
        '<span>This item has been sold. This conversation is closed.</span>';
      messagesArea.parentNode.insertBefore(banner, messagesArea);
    }
  } else {
    inputWrap.classList.remove('disabled');
    document.getElementById('msg-input').placeholder = 'Type a message...';
    var banner = document.getElementById('sold-banner');
    if (banner) banner.remove();
  }
}
```

#### D. Modify openThread Function

Add status badge to item context bar (after creating ctxTtl):

```javascript
// Create title row with status badge
var ctxTitleRow = document.createElement('div');
ctxTitleRow.style.display = 'flex';
ctxTitleRow.style.alignItems = 'center';

var ctxTtl = document.createElement('span');
ctxTtl.className = 'item-ctx-title';
ctxTtl.textContent = itemName;

var statusBadge = document.createElement('span');
statusBadge.className = 'item-status-badge available';
statusBadge.id = 'item-status-badge';
statusBadge.textContent = 'Available';

ctxTitleRow.appendChild(ctxTtl);
ctxTitleRow.appendChild(statusBadge);
ctxInfo.appendChild(ctxLbl);
ctxInfo.appendChild(ctxTitleRow); // Instead of just ctxTtl
```

Add ID to input wrapper:

```javascript
var inputWrap = document.createElement('div');
inputWrap.className = 'chat-input-area';
inputWrap.id = 'chat-input-wrap'; // Add this ID
```

#### E. Modify fetchMessages Function

Add status update after receiving data:

```javascript
var data = await res.json();
if (!data.success) { console.warn('[fetchMessages]', data); return; }

// Update item status
updateChatStatus(data.itemStatus || 'Available');

var area = document.getElementById('messages-area');
// ... rest of function
```

#### F. Modify sendMessage Function

Add status check at the beginning:

```javascript
async function sendMessage() {
  if (!activeThread) return;
  
  // Check if item is sold
  if (currentItemStatus === 'Sold') {
    showToast('This item has been sold. You cannot send new messages.');
    return;
  }
  
  var input = document.getElementById('msg-input');
  // ... rest of function
}
```

#### G. Modify Image Send Functions

Add status check to `sendImageMessage` and `showAttachPopup`:

```javascript
async function sendImageMessage(file, overlay, sendBtn) {
  if (!activeThread) { showToast('No active conversation.'); return; }
  
  // Check if item is sold
  if (currentItemStatus === 'Sold') {
    showToast('This item has been sold. You cannot send new messages.');
    return;
  }
  
  // ... rest of function
}

function showAttachPopup(anchorBtn) {
  // Check if item is sold
  if (currentItemStatus === 'Sold') {
    showToast('This item has been sold. You cannot send new messages.');
    return;
  }
  
  // ... rest of function
}
```

### Step 4: Restart Server

```bash
# Stop the server (Ctrl+C)
# Start it again
cd backend
node server.js
```

### Step 5: Test the System

1. **Test Available Item**:
   - Open a chat for an available item
   - Verify green "Available" badge shows
   - Send a message - should work ✅

2. **Test Sold Item**:
   - Have seller mark an item as sold (from dashboard)
   - Open chat for that item
   - Verify red "Sold" badge shows
   - Verify red banner appears
   - Try to send message - should be blocked ✅
   - Verify previous messages are visible ✅

3. **Test Purchase Flow**:
   - Buyer submits purchase request
   - Seller accepts purchase
   - Both users refresh chat
   - Verify status changes to "Sold"
   - Verify chat becomes read-only ✅

## 🎯 What Users Will See

### Before Item is Sold:
```
┌─────────────────────────────────────┐
│ 📦 Physics Textbook [Available]    │ ← Green badge
├─────────────────────────────────────┤
│ John Doe                            │
│ 📦 Physics Textbook                 │
├─────────────────────────────────────┤
│                                     │
│  Hi, is this still available?       │
│  You · 10:30 AM                     │
│                                     │
│         Yes, it is! 😊              │
│         John Doe · 10:31 AM         │
│                                     │
├─────────────────────────────────────┤
│ 📷 [Type a message...]         ➤   │ ← Active input
└─────────────────────────────────────┘
```

### After Item is Sold:
```
┌─────────────────────────────────────┐
│ 📦 Physics Textbook [Sold]         │ ← Red badge
├─────────────────────────────────────┤
│ John Doe                            │
│ 📦 Physics Textbook                 │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 🔒 This item has been sold.     │ │ ← Red banner
│ │    This conversation is closed. │ │
│ └─────────────────────────────────┘ │
│                                     │
│  Hi, is this still available?       │
│  You · 10:30 AM                     │
│                                     │
│         Yes, it is! 😊              │
│         John Doe · 10:31 AM         │
│                                     │
├─────────────────────────────────────┤
│ 📷 [This conversation is closed]  ➤│ ← Disabled (greyed)
└─────────────────────────────────────┘
```

## 🔧 Troubleshooting

### Problem: Status not showing
**Solution**: Clear browser cache (Ctrl+Shift+Delete) and reload

### Problem: Can still send messages on sold items
**Solution**: 
1. Check browser console for errors
2. Verify `currentItemStatus` variable is being set
3. Ensure backend validation is working (check server logs)

### Problem: Migration script fails
**Solution**:
1. Check MongoDB connection string
2. Ensure `mongoose` is installed: `npm install mongoose`
3. Check network connectivity

### Problem: Banner not appearing
**Solution**:
1. Verify `updateChatStatus()` is called in `fetchMessages()`
2. Check that `messages-area` element exists
3. Inspect element to see if banner is created but hidden

## 📝 Summary

After completing these steps, your chat system will:
- ✅ Show clear status badges (Available/Reserved/Sold)
- ✅ Display a prominent banner when items are sold
- ✅ Disable message input for sold items
- ✅ Preserve all message history
- ✅ Prevent new messages via both UI and API
- ✅ Provide clear feedback to users

## 🎉 Success Criteria

You'll know it's working when:
1. Opening a sold item's chat shows a red "Sold" badge
2. A red banner appears saying "This item has been sold"
3. The message input is greyed out and disabled
4. Trying to send a message shows an error toast
5. Previous messages are still visible and scrollable
6. Available items work normally with green badge

## 📚 Additional Resources

- Full implementation details: `CHAT_STATUS_IMPLEMENTATION.md`
- Backend API reference: See "API Reference" section in implementation guide
- Database schema: See `backend/server.js` line 62-80

## 🆘 Need Help?

If you encounter issues:
1. Check the browser console for JavaScript errors
2. Check server logs for API errors
3. Verify database migration completed successfully
4. Review the full implementation guide for detailed explanations
