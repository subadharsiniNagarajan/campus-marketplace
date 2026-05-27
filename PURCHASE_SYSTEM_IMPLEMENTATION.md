# 🛒 Purchase System Implementation Guide

## Overview
This guide implements a proper purchase request flow that separates chat (for discussion) from transactions (purchase requests).

---

## ✅ Backend Changes - COMPLETE

### 1. Database Schema Updates

#### Purchase Schema - Updated Status Values
```javascript
purchaseStatus: { 
  type: String, 
  enum: ['pending', 'accepted', 'rejected', 'reserved'], 
  default: 'pending' 
}
```

#### Item Schema - Added Reserved Tracking
```javascript
item_status: { 
  type: String, 
  enum: ['Available', 'Reserved', 'Sold'], 
  default: 'Available' 
},
reserved_for: { 
  type: mongoose.Schema.Types.ObjectId, 
  ref: 'User', 
  default: null 
}
```

### 2. API Endpoints Modified

#### GET /items - Hide Reserved Items
- Only shows Available items to general users
- Reserved items visible only to seller
- Filters out reserved items from marketplace

#### POST /api/purchase - Simplified Purchase Request
- Removed unnecessary fields (interaction, pickupTime)
- Checks if item is Available before creating request
- Prevents duplicate pending requests
- Returns purchaseId for tracking

#### PUT /api/purchases/:id/respond - Enhanced Accept/Reject
- When seller accepts:
  - Sets item_status = 'Reserved'
  - Sets reserved_for = buyer's user ID
  - Rejects all other pending requests for same item
  - Item disappears from marketplace
- When seller rejects:
  - Sets purchaseStatus = 'rejected'
  - Item remains Available

#### POST /api/messages - Updated Chat Locking
- Blocks messages on Reserved items (except between seller and reserved buyer)
- Blocks messages on Sold items
- Allows ongoing conversation between seller and buyer after reservation

---

## 📋 Frontend Changes Required

### 1. Update product-details.html

#### Replace "Buy Item" Button
```javascript
// OLD:
<button class="btn-pd-buy" id="btn-buy" onclick="buyItem()">
  &#128722; Buy Item
</button>

// NEW:
<button class="btn-pd-buy" id="btn-buy" onclick="requestToBuy()">
  &#128722; Request to Buy
</button>
```

#### Update buyItem() Function
```javascript
// OLD function:
function buyItem() {
  var id = urlParams.get('id');
  if (id) window.location.href = 'purchase.html?id=' + encodeURIComponent(id);
}

// NEW function:
async function requestToBuy() {
  if (!currentItem) return;
  
  // Show confirmation
  if (!confirm('Send purchase request for ' + currentItem.name + '?')) return;
  
  var btn = document.getElementById('btn-buy');
  btn.disabled = true;
  btn.textContent = 'Sending Request...';
  
  try {
    var res = await fetch(API_BASE + '/api/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemId: currentItem._id,
        buyerEmail: user.email,
        note: '' // Optional: can add a note input field
      })
    });
    
    var data = await res.json();
    
    if (res.ok && data.success) {
      // Redirect to purchase process page
      window.location.href = 'purchase-process.html?id=' + encodeURIComponent(data.purchaseId);
    } else {
      alert(data.error || 'Failed to send request');
      btn.disabled = false;
      btn.textContent = '🛒 Request to Buy';
    }
  } catch (err) {
    alert('Network error. Please try again.');
    btn.disabled = false;
    btn.textContent = '🛒 Request to Buy';
  }
}
```

#### Remove "Mark as Sold" Button
```javascript
// REMOVE this entire section:
<div id="pd-own-listing" class="pd-own-listing" style="display:none;">
  <div class="pd-own-badge">&#128204; This is your listing</div>
  <button class="btn-pd-mark-sold" id="btn-mark-sold" onclick="markAsSold()">Mark as Sold</button>
</div>

// REMOVE the markAsSold() function
```

### 2. Create purchase-process.html

Create a new file `frontend/purchase-process.html` with:

**Key Features:**
- Progress steps: Request Sent → Waiting for Seller → Reserved
- Real-time status updates (auto-refresh every 10 seconds)
- Item information display
- Status-specific messages and icons
- Action buttons: Message Seller, View Item

**Status Display:**
- **pending**: ⏳ "Waiting for Seller Approval"
- **accepted/reserved**: 🎉 "Item Reserved for You!"
- **rejected**: ❌ "Request Declined"

### 3. Update Dashboard (Seller View)

Add purchase requests section to dashboard for sellers:

```javascript
// In dashboard.html, add:
async function loadPurchaseRequests() {
  try {
    var res = await fetch(API_BASE + '/api/purchases/seller?sellerEmail=' + encodeURIComponent(user.email));
    var data = await res.json();
    
    if (data.success && data.purchases) {
      var pending = data.purchases.filter(function(p) { return p.purchaseStatus === 'pending'; });
      
      if (pending.length > 0) {
        // Show notification badge
        // Display pending requests
        renderPurchaseRequests(pending);
      }
    }
  } catch (err) {
    console.error('Load purchase requests error:', err);
  }
}

function renderPurchaseRequests(requests) {
  // Create UI to show pending requests
  // Add Accept/Reject buttons
}

async function respondToPurchase(purchaseId, action) {
  try {
    var res = await fetch(API_BASE + '/api/purchases/' + purchaseId + '/respond', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sellerEmail: user.email,
        action: action, // 'accept' or 'reject'
        sellerNote: '' // Optional note
      })
    });
    
    var data = await res.json();
    
    if (res.ok) {
      alert(action === 'accept' ? 'Purchase request accepted!' : 'Purchase request rejected');
      loadPurchaseRequests(); // Refresh list
    } else {
      alert(data.error || 'Failed to respond');
    }
  } catch (err) {
    alert('Network error');
  }
}
```

### 4. Update Chat System

The chat system already has the backend logic to lock conversations for Reserved items. The frontend chat.html needs to:

1. Check item status when loading messages
2. Show "Conversation Closed" banner for Reserved items (if user is not the buyer/seller)
3. Disable input for non-participants

This is already partially implemented in the chat status system.

### 5. Remove Old Purchase Flow

**Delete or rename:**
- `frontend/purchase.html` (old purchase page)

**Remove references to:**
- "Complete Transaction" buttons
- "Mark as Sold" manual buttons
- Old purchase confirmation flow

---

## 🎯 User Flow

### Buyer Flow
```
1. Browse items on marketplace
   ↓
2. Click on item → View product details
   ↓
3. Click "Request to Buy" button
   ↓
4. Confirmation popup appears
   ↓
5. Redirected to purchase-process.html
   ↓
6. See status: "Waiting for Seller Approval"
   ↓
7. Seller accepts → Status changes to "Reserved"
   ↓
8. Item removed from marketplace
   ↓
9. Buyer can message seller to arrange pickup
```

### Seller Flow
```
1. List item on marketplace
   ↓
2. Receive purchase request notification
   ↓
3. View request details on dashboard
   ↓
4. Click "Accept" or "Reject"
   ↓
5. If Accept:
   - Item becomes Reserved
   - Item hidden from marketplace
   - Other requests auto-rejected
   - Can message buyer
   ↓
6. Arrange pickup with buyer via chat
```

---

## 🔒 Security & Business Logic

### Item Visibility Rules
- **Available**: Visible to everyone
- **Reserved**: Visible only to seller and reserved buyer
- **Sold**: Hidden from marketplace (future state)

### Chat Access Rules
- **Available items**: Anyone can message seller
- **Reserved items**: Only seller and reserved buyer can message
- **Sold items**: Chat locked for everyone

### Purchase Request Rules
- Only one pending request per buyer per item
- Cannot request your own items
- Cannot request unavailable items
- Seller can only accept one request (others auto-rejected)

---

## 📊 Database Migration

Run this migration to update existing data:

```javascript
// migrate_purchase_system.js
const mongoose = require('mongoose');

async function migrate() {
  await mongoose.connect(MONGO_URI);
  
  // Update old purchase statuses
  await db.collection('purchases').updateMany(
    { purchaseStatus: 'Pending Sale' },
    { $set: { purchaseStatus: 'pending' } }
  );
  
  await db.collection('purchases').updateMany(
    { purchaseStatus: 'Accepted' },
    { $set: { purchaseStatus: 'accepted' } }
  );
  
  await db.collection('purchases').updateMany(
    { purchaseStatus: 'Declined' },
    { $set: { purchaseStatus: 'rejected' } }
  );
  
  console.log('Migration complete');
  await mongoose.connection.close();
}

migrate();
```

---

## ✅ Testing Checklist

### Test 1: Request to Buy
- [ ] Click "Request to Buy" on available item
- [ ] Confirmation popup appears
- [ ] Redirected to purchase-process page
- [ ] Status shows "Waiting for Seller"

### Test 2: Seller Accepts
- [ ] Seller sees pending request
- [ ] Seller clicks "Accept"
- [ ] Item status changes to Reserved
- [ ] Item disappears from marketplace
- [ ] Buyer sees "Reserved" status
- [ ] Other pending requests rejected

### Test 3: Seller Rejects
- [ ] Seller clicks "Reject"
- [ ] Buyer sees "Request Declined"
- [ ] Item remains Available
- [ ] Item still visible on marketplace

### Test 4: Reserved Item Visibility
- [ ] Reserved item not visible on homepage
- [ ] Reserved item not in search results
- [ ] Reserved item not in category browse
- [ ] Seller can still see their reserved item
- [ ] Reserved buyer can access item details

### Test 5: Chat Locking
- [ ] Available item: Anyone can message
- [ ] Reserved item: Only buyer/seller can message
- [ ] Other users see "Conversation Closed"
- [ ] Input disabled for non-participants

### Test 6: Duplicate Prevention
- [ ] Cannot send multiple pending requests
- [ ] Error message shown for duplicate
- [ ] Existing request ID returned

---

## 🎨 UI/UX Improvements

### Status Icons
- ⏳ Pending
- 🎉 Accepted/Reserved
- ❌ Rejected

### Color Scheme
- **Pending**: Yellow/Orange (#fef3c7)
- **Accepted**: Green (#d1fae5)
- **Rejected**: Red (#fee2e2)
- **Reserved**: Blue (#dbeafe)

### Progress Indicator
- Visual progress bar
- Step circles with numbers
- Active step highlighted
- Completed steps with checkmarks

---

## 📝 Summary of Changes

### Backend ✅ COMPLETE
- [x] Updated purchase schema statuses
- [x] Added reserved_for field to items
- [x] Modified GET /items to hide reserved items
- [x] Simplified POST /api/purchase
- [x] Enhanced PUT /api/purchases/:id/respond
- [x] Updated POST /api/messages for reserved items

### Frontend ⏳ PENDING
- [ ] Update product-details.html button
- [ ] Create purchase-process.html page
- [ ] Add seller dashboard purchase requests
- [ ] Update chat locking UI
- [ ] Remove old purchase flow
- [ ] Test all flows

---

## 🚀 Deployment Steps

1. **Backup database**
2. **Deploy backend changes** (already done)
3. **Run migration script**
4. **Update frontend files**
5. **Test thoroughly**
6. **Deploy to production**

---

## 💡 Future Enhancements

1. **Email Notifications**: Notify seller of new requests
2. **Push Notifications**: Real-time alerts
3. **Request Expiry**: Auto-reject after 48 hours
4. **Multiple Buyers**: Allow seller to compare requests
5. **Rating System**: Rate transaction after completion
6. **Pickup Confirmation**: Mark when item is picked up
7. **Payment Integration**: Add payment gateway

---

*Last Updated: May 27, 2026*
*Status: Backend Complete, Frontend Pending*
