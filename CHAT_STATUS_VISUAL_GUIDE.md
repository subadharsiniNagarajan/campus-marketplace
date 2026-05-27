# Chat Status System - Visual Guide

## 🎨 Visual Changes Overview

This guide shows exactly what users will see with the new chat status system.

---

## 1. Status Badges

### Available Item (Green Badge)
```
┌────────────────────────────────────────┐
│ 📦 Physics Textbook [Available] ✓     │
│    ↑                 ↑                 │
│    Item name         Green badge       │
└────────────────────────────────────────┘
```
- **Color**: Green (#10b981)
- **Text**: "AVAILABLE"
- **Meaning**: Item is still for sale, chat is active

### Reserved Item (Orange Badge)
```
┌────────────────────────────────────────┐
│ 📦 Physics Textbook [Reserved] ⏳      │
│    ↑                 ↑                 │
│    Item name         Orange badge      │
└────────────────────────────────────────┘
```
- **Color**: Orange (#f59e0b)
- **Text**: "RESERVED"
- **Meaning**: Item is on hold, chat still active

### Sold Item (Red Badge)
```
┌────────────────────────────────────────┐
│ 📦 Physics Textbook [Sold] ✗          │
│    ↑                 ↑                 │
│    Item name         Red badge         │
└────────────────────────────────────────┘
```
- **Color**: Red (#ef4444)
- **Text**: "SOLD"
- **Meaning**: Item is sold, chat is closed

---

## 2. Complete Chat Interface - Available Item

```
╔════════════════════════════════════════════════════════╗
║  CampusMart                    🏠 🛍️ 🛒 💬 [Profile] ║
╠════════════════════════════════════════════════════════╣
║  💬 My Messages                                        ║
║  Real-time private conversations with other students.  ║
╠═══════════════════╦════════════════════════════════════╣
║ 💬 Conversations  ║ 📦 Physics Textbook [Available]   ║ ← Green
║ ● Connected       ║────────────────────────────────────║
║                   ║  JD  John Doe                      ║
║ ┌───────────────┐ ║      📦 Physics Textbook           ║
║ │ John Doe      │ ║────────────────────────────────────║
║ │ (Physics...)  │ ║                                    ║
║ │ Hi, is this...│ ║  Hi, is this still available?      ║
║ └───────────────┘ ║  You · 10:30 AM                    ║
║                   ║                                    ║
║ ┌───────────────┐ ║         Yes, it is! 😊             ║
║ │ Sarah Lee     │ ║         John Doe · 10:31 AM        ║
║ │ (Calculator)  │ ║                                    ║
║ │ Thanks!       │ ║  Great! Can we meet tomorrow?      ║
║ └───────────────┘ ║  You · 10:32 AM                    ║
║                   ║                                    ║
║                   ║────────────────────────────────────║
║                   ║ 📷 │ Type a message...        ➤   ║ ← Active
╚═══════════════════╩════════════════════════════════════╝
```

**Key Features**:
- ✅ Green "Available" badge
- ✅ Input field is active (white background)
- ✅ Camera and send buttons are enabled
- ✅ Placeholder: "Type a message..."

---

## 3. Complete Chat Interface - Sold Item

```
╔════════════════════════════════════════════════════════╗
║  CampusMart                    🏠 🛍️ 🛒 💬 [Profile] ║
╠════════════════════════════════════════════════════════╣
║  💬 My Messages                                        ║
║  Real-time private conversations with other students.  ║
╠═══════════════════╦════════════════════════════════════╣
║ 💬 Conversations  ║ 📦 Physics Textbook [Sold]        ║ ← Red
║ ● Connected       ║────────────────────────────────────║
║                   ║  JD  John Doe                      ║
║ ┌───────────────┐ ║      📦 Physics Textbook           ║
║ │ John Doe      │ ║────────────────────────────────────║
║ │ (Physics...)  │ ║ ┌────────────────────────────────┐ ║
║ │ Hi, is this...│ ║ │ 🔒 This item has been sold.    │ ║ ← Banner
║ └───────────────┘ ║ │    This conversation is closed.│ ║
║                   ║ └────────────────────────────────┘ ║
║ ┌───────────────┐ ║                                    ║
║ │ Sarah Lee     │ ║  Hi, is this still available?      ║
║ │ (Calculator)  │ ║  You · 10:30 AM                    ║
║ │ Thanks!       │ ║                                    ║
║ └───────────────┘ ║         Yes, it is! 😊             ║
║                   ║         John Doe · 10:31 AM        ║
║                   ║                                    ║
║                   ║  Great! Can we meet tomorrow?      ║
║                   ║  You · 10:32 AM                    ║
║                   ║                                    ║
║                   ║────────────────────────────────────║
║                   ║ 📷 │ This conversation is closed ➤ ║ ← Disabled
╚═══════════════════╩════════════════════════════════════╝
```

**Key Features**:
- ❌ Red "Sold" badge
- ❌ Red banner with lock icon
- ❌ Input field is disabled (grey background)
- ❌ Camera and send buttons are disabled
- ❌ Placeholder: "This conversation is closed"
- ✅ Previous messages are still visible

---

## 4. Status Badge Styles

### CSS Implementation
```css
.item-status-badge {
  display: inline-block;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-left: 0.5rem;
}

/* Green for Available */
.item-status-badge.available {
  background: #10b981;
  color: #fff;
}

/* Orange for Reserved */
.item-status-badge.reserved {
  background: #f59e0b;
  color: #fff;
}

/* Red for Sold */
.item-status-badge.sold {
  background: #ef4444;
  color: #fff;
}
```

### Visual Representation
```
┌─────────────┐  ┌──────────────┐  ┌────────────┐
│ AVAILABLE   │  │  RESERVED    │  │   SOLD     │
│   (Green)   │  │  (Orange)    │  │   (Red)    │
└─────────────┘  └──────────────┘  └────────────┘
   #10b981          #f59e0b           #ef4444
```

---

## 5. Sold Banner Design

### Banner Layout
```
┌──────────────────────────────────────────────────┐
│  🔒  This item has been sold.                    │
│      This conversation is closed.                │
└──────────────────────────────────────────────────┘
```

### CSS Implementation
```css
.chat-sold-banner {
  background: #fef2f2;        /* Light red background */
  border: 1px solid #fecaca;  /* Red border */
  border-radius: 8px;
  padding: 0.75rem 1rem;
  margin: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: #991b1b;             /* Dark red text */
  font-size: 0.88rem;
  font-weight: 600;
}
```

### Color Scheme
- **Background**: Light red (#fef2f2)
- **Border**: Medium red (#fecaca)
- **Text**: Dark red (#991b1b)
- **Icon**: Lock emoji 🔒

---

## 6. Disabled Input State

### Before (Active)
```
┌────────────────────────────────────────────┐
│ 📷 │ Type a message...              ➤    │
│    │ [White background, clickable]       │
└────────────────────────────────────────────┘
```

### After (Disabled)
```
┌────────────────────────────────────────────┐
│ 📷 │ This conversation is closed    ➤    │
│    │ [Grey background, not clickable]    │
└────────────────────────────────────────────┘
```

### CSS Implementation
```css
.chat-input-area.disabled {
  opacity: 0.6;
  pointer-events: none;  /* Prevents all clicks */
}

.chat-input-area.disabled textarea {
  background: #f3f4f6;   /* Grey background */
  color: #9ca3af;        /* Grey text */
}
```

---

## 7. Mobile View

### Available Item (Mobile)
```
┌─────────────────────────┐
│ ☰  CampusMart      [👤] │
├─────────────────────────┤
│ 📦 Physics Textbook     │
│    [Available] ✓        │ ← Green badge
├─────────────────────────┤
│  JD  John Doe           │
│      📦 Physics Textbook│
├─────────────────────────┤
│                         │
│  Hi, is this still      │
│  available?             │
│  You · 10:30 AM         │
│                         │
│         Yes, it is! 😊  │
│         John · 10:31 AM │
│                         │
├─────────────────────────┤
│ 📷 │ Type...       ➤   │ ← Active
└─────────────────────────┘
```

### Sold Item (Mobile)
```
┌─────────────────────────┐
│ ☰  CampusMart      [👤] │
├─────────────────────────┤
│ 📦 Physics Textbook     │
│    [Sold] ✗            │ ← Red badge
├─────────────────────────┤
│  JD  John Doe           │
│      📦 Physics Textbook│
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │ 🔒 Item sold.       │ │ ← Banner
│ │    Chat closed.     │ │
│ └─────────────────────┘ │
│                         │
│  Hi, is this still      │
│  available?             │
│  You · 10:30 AM         │
│                         │
│         Yes, it is! 😊  │
│         John · 10:31 AM │
│                         │
├─────────────────────────┤
│ 📷 │ Chat closed   ➤   │ ← Disabled
└─────────────────────────┘
```

---

## 8. User Flow Diagram

```
┌─────────────────┐
│  Item Listed    │
│  Status:        │
│  Available      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Buyer Opens    │
│  Chat           │
│  ✓ Can message  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Buyer Submits  │
│  Purchase       │
│  Request        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Seller Accepts │
│  Purchase       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Item Status    │
│  → Sold         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Chat Updates   │
│  • Red badge    │
│  • Banner shown │
│  • Input locked │
│  ✗ Can't message│
└─────────────────┘
```

---

## 9. Error Messages

### Trying to Send Message on Sold Item
```
┌────────────────────────────────────┐
│  ⚠️ This item has been sold.      │
│     You cannot send new messages. │
└────────────────────────────────────┘
```
- Appears as a toast notification at bottom of screen
- Dark background (#1f2937)
- White text
- Auto-dismisses after 3 seconds

### Trying to Attach Image on Sold Item
```
┌────────────────────────────────────┐
│  ⚠️ This item has been sold.      │
│     You cannot send new messages. │
└────────────────────────────────────┘
```
- Same toast notification
- Prevents file picker from opening

---

## 10. Comparison Table

| Feature | Available Item | Sold Item |
|---------|---------------|-----------|
| **Status Badge** | 🟢 Green "AVAILABLE" | 🔴 Red "SOLD" |
| **Banner** | ❌ Not shown | ✅ Red banner with lock |
| **Message Input** | ✅ Active, white | ❌ Disabled, grey |
| **Send Button** | ✅ Enabled | ❌ Disabled |
| **Camera Button** | ✅ Enabled | ❌ Disabled |
| **Placeholder** | "Type a message..." | "This conversation is closed" |
| **Can Send Text** | ✅ Yes | ❌ No |
| **Can Send Images** | ✅ Yes | ❌ No |
| **View History** | ✅ Yes | ✅ Yes |
| **Scroll Messages** | ✅ Yes | ✅ Yes |

---

## 11. Color Palette

```
Available (Green):
  Badge: #10b981
  Text:  #ffffff

Reserved (Orange):
  Badge: #f59e0b
  Text:  #ffffff

Sold (Red):
  Badge:      #ef4444
  Text:       #ffffff
  Banner BG:  #fef2f2
  Banner Border: #fecaca
  Banner Text: #991b1b

Disabled Input:
  Background: #f3f4f6
  Text:       #9ca3af
  Opacity:    0.6
```

---

## 12. Responsive Breakpoints

### Desktop (> 768px)
- Full sidebar with conversation list
- Wide chat panel
- Full-size status badge
- Multi-line banner text

### Tablet (768px - 480px)
- Collapsible sidebar
- Medium chat panel
- Compact status badge
- Single-line banner text

### Mobile (< 480px)
- Hidden sidebar (toggle button)
- Full-width chat panel
- Small status badge
- Abbreviated banner text

---

## 13. Accessibility Features

### Screen Reader Announcements
```html
<span class="item-status-badge sold" 
      role="status" 
      aria-live="polite">
  Sold
</span>

<div class="chat-sold-banner" 
     role="alert" 
     aria-live="assertive">
  This item has been sold. This conversation is closed.
</div>

<textarea disabled 
          aria-label="Message input disabled because item is sold"
          aria-describedby="sold-banner">
</textarea>
```

### Keyboard Navigation
- Tab through conversations
- Enter to open chat
- Escape to close modals
- Disabled inputs skip in tab order

---

## 14. Animation & Transitions

### Badge Color Transition
```css
.item-status-badge {
  transition: background-color 0.3s ease;
}
```

### Banner Slide-In
```css
.chat-sold-banner {
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Input Disable Fade
```css
.chat-input-area {
  transition: opacity 0.3s ease;
}
```

---

## 15. Success Indicators

### ✅ System Working Correctly When:

1. **Badge Updates**
   - Opens available item → Green badge
   - Opens sold item → Red badge
   - Status changes → Badge updates

2. **Banner Appears**
   - Sold item opened → Banner visible
   - Available item → No banner

3. **Input Disabled**
   - Sold item → Grey, unclickable
   - Available item → White, clickable

4. **Messages Blocked**
   - Try to send on sold item → Error toast
   - Try to send on available item → Message sent

5. **History Preserved**
   - All previous messages visible
   - Can scroll through history
   - Timestamps intact

---

This visual guide provides a complete picture of how the chat status system looks and behaves from a user's perspective.
