#!/usr/bin/env python3
with open('frontend/chat.html', 'r', encoding='utf-8') as f:
    c = f.read()

OLD = (
    "        var itemStatus    = data.itemStatus || 'Available';\n"
    "        var chatCompleted = data.chatCompleted || (itemStatus === 'Completed');\n"
    "        var isReserved    = (itemStatus === 'Reserved');"
)
NEW = (
    "        var itemStatus    = data.itemStatus || 'Available';\n"
    "        // chatCompleted is true for both 'Sold' and 'Completed' item_status values\n"
    "        var chatCompleted = data.chatCompleted || (itemStatus === 'Completed') || (itemStatus === 'Sold');\n"
    "        var isReserved    = (itemStatus === 'Reserved');"
)
if OLD in c:
    c = c.replace(OLD, NEW, 1)
    print('[OK] chat.html: chatCompleted now covers Sold and Completed')
else:
    print('[FAIL] anchor not found')

with open('frontend/chat.html', 'w', encoding='utf-8') as f:
    f.write(c)
print('[OK] chat.html written')

# verify
with open('frontend/chat.html', 'r', encoding='utf-8') as f:
    v = f.read()
print('chatCompleted covers Sold:', "itemStatus === 'Sold'" in v)
print('chatCompleted covers Completed:', "itemStatus === 'Completed'" in v)
print('chatCompleted uses data.chatCompleted:', 'data.chatCompleted' in v)

# verify backend
with open('backend/server.js', 'r', encoding='utf-8') as f:
    s = f.read()
print()
print('backend chatCompleted returned:', 'chatCompleted: chatCompleted' in s)
print('backend checks Sold OR Completed:', "st === 'Sold' || st === 'Completed'" in s)
print('threads filter Sold:', "itemStatus === 'Sold') continue" in s)
print('threads filter Completed:', "itemStatus === 'Completed') continue" in s or "'Completed' || itemStatus === 'Sold'" in s)
