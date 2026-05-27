# Chat System Status Implementation Guide

## Overview
This guide implements an improved chat system that automatically closes conversations when items are sold, while preserving message history.

## Changes Made

### 1. Backend Changes (backend/server.js)

#### A. Database Schema Update
Added `item_status` field to the Item schema:
```javascript
item_status: { type: String, enum: ['Available', 'Reserved', 'Sold'], default: 'Available' }
```

#### B. New API Endpoint
**PUT /items/:id/status** - Update item status
- Allows seller to change status between Available, Reserved, and Sold
- Automatically syncs `sold` boolean field when status is 'Sold'
- Only the item owner can update status

#### C. Modified Endpoints

**PUT /items/:id/sold** - Enhanced to update item_status
```javascript
item.sold = true;
item.item_status = 'Sold';
```

**POST /api/messages** - Prevent messages on sold items
```javascript
// Check item status before allowing message
const item = await Item.findById(itemId).select('item_status').lean();
if (item.item_status === 'Sold') {
  return res.status(403).json({ 
    error: 'This item has been sold. The conversation is closed.' 
  });
}
```

**GET /api/messages/:itemId** - Return item status with messages
```javascript
const item = await Item.findById(itemId).select('item_status name').lean();
res.json({ 
  success: true, 
  messages,
  itemStatus: item.item_status || 'Available',
  itemName: item.name
});
```

**PUT /api/purchases/:id/respond** - Update item_status when purchase accepted/declined
```javascript
if (action === 'accept') {
  await Item.findByIdAndUpdate(purchase.itemId, { 
    sold: true, 
    item_status: 'Sold' 
  });
}
```

### 2. Frontend Changes (frontend/chat.html)

#### A. New CSS Styles

**Status Badge**
```css
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
```

**Sold Banner**
```css
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
```

**Disabled Input State**
```css
.chat-input-area.disabled { 
  opacity:.6; 
  pointer-events:none; 
}
.chat-input-area.disabled textarea { 
  background:#f3f4f6; 
  color:#9ca3af; 
}
```

#### B. JavaScript Changes

**Track Current Status**
```javascript
var currentItemStatus = 'Available'; // Global variable
```

**Update Chat Status Function**
```javascript
function updateChatStatus(status) {
  currentItemStatus = status || 'Available';
  var badge = document.getElementById('item-status-badge');
  var inputWrap = document.getElementById('chat-input-wrap');
  var messagesArea = document.getElementById('messages-area');
  
  // Update badge
  badge.className = 'item-status-badge ' + status.toLowerCase();
  badge.textContent = status;
  
  // If sold, disable input and show banner
  if (status === 'Sold') {
    inputWrap.classList.add('disabled');
    document.getElementById('msg-input').placeholder = 'This conversation is closed';
    
    // Add sold banner
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

**Modified openThread Function**
Add status badge to item context bar:
```javascript
var statusBadge = document.createElement('span');
statusBadge.className = 'item-status-badge available';
statusBadge.id = 'item-status-badge';
statusBadge.textContent = 'Available';
ctxTitleRow.appendChild(statusBadge);
```

**Modified fetchMessages Function**
```javascript
var data = await res.json();
// Update item status
updateChatStatus(data.itemStatus || 'Available');
```

**Modified sendMessage Function**
```javascript
async function sendMessage() {
  if (currentItemStatus === 'Sold') {
    showToast('This item has been sold. You cannot send new messages.');
    return;
  }
  // ... rest of send logic
}
```

## Features Implemented

### ✅ 1. Item Status Tracking
- Three states: Available, Reserved, Sold
- Stored in database and synced across all views
- Automatically updated when purchase is accepted

### ✅ 2. Visual Status Indicators
- **Green badge** for Available items
- **Orange badge** for Reserved items  
- **Red badge** for Sold items
- Badge displayed prominently in chat header

### ✅ 3. Sold Item Banner
- Red banner appears when item is sold
- Shows lock icon 🔒 and clear message
- Positioned above message area for visibility

### ✅ 4. Disabled Input for Sold Items
- Message input field becomes read-only
- Greyed out appearance
- Placeholder text changes to "This conversation is closed"
- Send button disabled
- Attach image button disabled

### ✅ 5. Message History Preservation
- All previous messages remain visible
- Users can scroll through conversation history
- No messages are deleted
- Read-only access to past conversations

### ✅ 6. Server-Side Validation
- Backend prevents new messages on sold items
- Returns clear error message
- Maintains data integrity

### ✅ 7. Real-Time Status Updates
- Status checked when opening conversation
- Updated when fetching messages
- Prevents race conditions

## Testing Checklist

### Test Scenario 1: Available Item
- [ ] Chat opens normally
- [ ] Green "Available" badge shows
- [ ] Can send text messages
- [ ] Can send images
- [ ] No banner displayed

### Test Scenario 2: Sold Item
- [ ] Red "Sold" badge shows
- [ ] Red banner appears with lock icon
- [ ] Message input is disabled and greyed out
- [ ] Cannot type new messages
- [ ] Cannot send images
- [ ] Previous messages are visible
- [ ] Can scroll through history

### Test Scenario 3: Status Transition
- [ ] Start conversation on available item
- [ ] Seller marks item as sold
- [ ] Buyer refreshes or reopens chat
- [ ] Status updates correctly
- [ ] Input becomes disabled

### Test Scenario 4: Purchase Flow
- [ ] Buyer submits purchase request
- [ ] Seller accepts purchase
- [ ] Item status changes to "Sold"
- [ ] Chat becomes read-only for both users

## Migration Notes

### Existing Data
All existing items will have `item_status: 'Available'` by default. Items with `sold: true` should be migrated:

```javascript
// Run this migration script once
db.items.updateMany(
  { sold: true, item_status: { $exists: false } },
  { $set: { item_status: 'Sold' } }
);

db.items.updateMany(
  { sold: false, item_status: { $exists: false } },
  { $set: { item_status: 'Available' } }
);
```

## API Reference

### Update Item Status
```
PUT /items/:id/status
Body: {
  user_id: "seller_user_id",
  item_status: "Available" | "Reserved" | "Sold"
}
Response: {
  success: true,
  message: "Item status updated to Sold.",
  item: { ... }
}
```

### Get Messages with Status
```
GET /api/messages/:itemId?myEmail=...&otherEmail=...
Response: {
  success: true,
  messages: [...],
  itemStatus: "Available" | "Reserved" | "Sold",
  itemName: "Item Name"
}
```

### Send Message (with validation)
```
POST /api/messages
Body: {
  itemId: "...",
  senderEmail: "...",
  receiverEmail: "...",
  senderName: "...",
  text: "..."
}
Response (if sold): {
  error: "This item has been sold. The conversation is closed."
}
```

## Benefits

1. **Trust & Clarity**: Users immediately know if an item is still available
2. **Reduced Confusion**: No more messaging about sold items
3. **History Preservation**: Past conversations remain accessible
4. **Professional UX**: Clear visual indicators and helpful messages
5. **Data Integrity**: Server-side validation prevents invalid states
6. **Scalable**: Easy to add more statuses (e.g., "Pending", "On Hold")

## Future Enhancements

1. **Auto-Reserve**: Automatically set status to "Reserved" when purchase request is pending
2. **Status Notifications**: Notify users when item status changes
3. **Seller Controls**: Allow seller to manually change status from chat interface
4. **Status History**: Track status changes over time
5. **Bulk Status Update**: Admin panel to update multiple items at once

## Troubleshooting

### Issue: Status not updating
- Check browser console for errors
- Verify API endpoint is returning `itemStatus` field
- Clear browser cache and reload

### Issue: Can still send messages on sold items
- Verify backend validation is in place
- Check that `item_status` field exists in database
- Ensure frontend is checking `currentItemStatus` before sending

### Issue: Banner not showing
- Check that `updateChatStatus()` is called after fetching messages
- Verify DOM elements exist before manipulation
- Check CSS is loaded correctly

## Conclusion

This implementation creates a trusted, professional chat system that automatically handles item lifecycle changes while preserving valuable conversation history. The system is robust, user-friendly, and maintains data integrity at both frontend and backend levels.
