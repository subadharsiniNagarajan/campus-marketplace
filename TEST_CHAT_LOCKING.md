# 🧪 Chat Locking - Quick Test Guide

## ⚡ Quick Test (5 minutes)

### Prerequisites
✅ Server running on http://localhost:3000
✅ Two user accounts (or use incognito mode)

---

## 📝 Test Steps

### Step 1: Create a Purchase Request
1. **Login as Buyer**
   - Go to http://localhost:3000
   - Login with buyer account
   
2. **Find an Item**
   - Browse marketplace
   - Click on any item
   
3. **Request to Buy**
   - Click "Request to Buy" button
   - Confirm the request
   
4. **Start Chat**
   - Click "Message Seller"
   - Send a test message: "Hi, is this still available?"
   - ✅ **Expected:** Chat works normally

---

### Step 2: Accept Purchase Request (Seller)
1. **Login as Seller** (different browser or incognito)
   - Go to http://localhost:3000
   - Login with seller account
   
2. **View Purchase Requests**
   - Go to Dashboard
   - Find "Purchase Requests" section
   - See the pending request
   
3. **Accept Request**
   - Click "Accept" button
   - ✅ **Expected:** Item status changes to "Reserved"

---

### Step 3: Verify Chat is Locked (Buyer)
1. **Return to Buyer Browser**
   - Go to Chat page
   - Open the conversation with seller
   
2. **Check Locked UI**
   - ✅ **Should see:**
     ```
     ┌─────────────────────────────────┐
     │         🔒                      │
     │   Conversation Closed           │
     │                                 │
     │ This item is no longer          │
     │ available. This conversation    │
     │ has been archived.              │
     └─────────────────────────────────┘
     ```
   
3. **Try to Send Message**
   - Try typing in input box
   - ✅ **Expected:** Input is disabled
   - ✅ **Expected:** Placeholder says "This conversation is closed"
   
4. **Try to Send Image**
   - Click attach button (📷)
   - ✅ **Expected:** Toast shows "This conversation is closed"
   
5. **Check Previous Messages**
   - ✅ **Expected:** Previous messages still visible
   - ✅ **Expected:** Can scroll through history

---

## ✅ Success Checklist

### Visual Elements
- [ ] 🔒 Lock icon visible
- [ ] Red banner with "Conversation Closed" title
- [ ] Message: "This item is no longer available..."
- [ ] Input area is greyed out
- [ ] Send button is disabled
- [ ] Attach button is disabled

### Functionality
- [ ] Cannot type in textarea
- [ ] Cannot click send button
- [ ] Cannot open attach popup
- [ ] Toast shows when trying to attach
- [ ] Previous messages are visible
- [ ] Can scroll through message history

### Backend Validation
- [ ] Trying to send via API returns error
- [ ] Item status is "Reserved" in database
- [ ] Only seller and buyer can message (if Reserved)

---

## 🐛 Troubleshooting

### Banner Not Showing
**Check:**
1. Open browser console (F12)
2. Look for `fetchMessages` response
3. Verify `itemStatus` field exists
4. Check if it's "Reserved" or "Sold"

**Fix:**
- Refresh the page
- Clear browser cache
- Check backend is returning itemStatus

### Can Still Send Messages
**Check:**
1. Input area has class `locked`
2. Textarea is disabled
3. Send button is disabled

**Fix:**
- Hard refresh (Ctrl+Shift+R)
- Check browser console for errors
- Verify chat.html was updated

### Attach Button Still Works
**Check:**
1. Click attach button
2. Should see toast notification
3. Popup should NOT appear

**Fix:**
- Verify `showAttachPopup()` has locked check
- Check browser console for errors

---

## 🎯 Expected Behavior Summary

| Action | Available Item | Reserved/Sold Item |
|--------|---------------|-------------------|
| Send text message | ✅ Works | ❌ Blocked (toast) |
| Send image | ✅ Works | ❌ Blocked (toast) |
| Open attach popup | ✅ Works | ❌ Blocked (toast) |
| View messages | ✅ Works | ✅ Works (read-only) |
| Input enabled | ✅ Yes | ❌ No (disabled) |
| Banner visible | ❌ No | ✅ Yes (🔒) |

---

## 📸 Screenshots to Verify

### Before (Available Item)
- Normal chat interface
- Active input field
- No banner

### After (Reserved Item)
- 🔒 Red banner at top
- Greyed out input area
- "This conversation is closed" placeholder
- Previous messages visible below banner

---

## 🔄 Alternative Test (Without Purchase)

If you want to test without going through purchase flow:

1. **Manually Update Database**
   ```javascript
   // In MongoDB or via backend console
   db.items.updateOne(
     { _id: "ITEM_ID" },
     { $set: { item_status: "Reserved" } }
   )
   ```

2. **Refresh Chat Page**
   - Should immediately show locked UI

3. **Change Back to Test**
   ```javascript
   db.items.updateOne(
     { _id: "ITEM_ID" },
     { $set: { item_status: "Available" } }
   )
   ```

---

## 📊 Test Results Template

```
Date: _______________
Tester: _______________

✅ Banner displays correctly
✅ Input is disabled
✅ Send button is disabled
✅ Attach button is disabled
✅ Toast notifications work
✅ Previous messages visible
✅ Cannot send messages
✅ Cannot send images
✅ Cannot open attach popup

Notes:
_________________________________
_________________________________
_________________________________

Status: PASS / FAIL
```

---

## 🎉 Success!

If all checks pass, the chat locking system is working perfectly!

**What this means:**
- ✅ Chats automatically close when items are Reserved/Sold
- ✅ Users cannot continue messaging after purchase
- ✅ Message history is preserved
- ✅ Clear visual feedback
- ✅ Secure implementation

---

*Test Duration: ~5 minutes*
*Difficulty: Easy*
*Status: Ready for Testing*
