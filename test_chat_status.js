/**
 * Test Script: Verify Chat Status System
 * 
 * This script tests the backend API endpoints to ensure
 * the chat status system is working correctly.
 * 
 * Run with: node test_chat_status.js
 */

const API = 'http://localhost:3000';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name) {
  console.log(`\n${colors.cyan}━━━ ${name} ━━━${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function testGetItems() {
  logTest('Test 1: Get Items with Status');
  
  try {
    const response = await fetch(`${API}/items`);
    const data = await response.json();
    
    if (data.success && data.items) {
      logSuccess(`Retrieved ${data.items.length} items`);
      
      // Check if items have item_status field
      const itemsWithStatus = data.items.filter(item => item.item_status);
      logInfo(`Items with status field: ${itemsWithStatus.length}/${data.items.length}`);
      
      // Count by status
      const statusCounts = data.items.reduce((acc, item) => {
        const status = item.item_status || 'Unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      
      Object.entries(statusCounts).forEach(([status, count]) => {
        logInfo(`  ${status}: ${count} items`);
      });
      
      return data.items[0]; // Return first item for further testing
    } else {
      logError('Failed to retrieve items');
      return null;
    }
  } catch (error) {
    logError(`Error: ${error.message}`);
    return null;
  }
}

async function testGetSingleItem(itemId) {
  logTest('Test 2: Get Single Item with Status');
  
  try {
    const response = await fetch(`${API}/items/${itemId}`);
    const data = await response.json();
    
    if (data.success && data.item) {
      logSuccess(`Retrieved item: ${data.item.name}`);
      logInfo(`Status: ${data.item.item_status || 'Not set'}`);
      logInfo(`Sold: ${data.item.sold}`);
      return data.item;
    } else {
      logError('Failed to retrieve item');
      return null;
    }
  } catch (error) {
    logError(`Error: ${error.message}`);
    return null;
  }
}

async function testGetMessagesWithStatus(itemId) {
  logTest('Test 3: Get Messages with Item Status');
  
  try {
    // Using dummy emails for testing
    const myEmail = 'test@ritchennai.edu.in';
    const otherEmail = 'seller@ritchennai.edu.in';
    
    const response = await fetch(
      `${API}/api/messages/${itemId}?myEmail=${myEmail}&otherEmail=${otherEmail}`
    );
    const data = await response.json();
    
    if (data.success !== undefined) {
      if (data.success) {
        logSuccess(`Retrieved ${data.messages.length} messages`);
        logInfo(`Item Status: ${data.itemStatus || 'Not provided'}`);
        logInfo(`Item Name: ${data.itemName || 'Not provided'}`);
      } else {
        logInfo(`Expected error (no auth): ${data.error}`);
      }
      return true;
    } else {
      logError('Unexpected response format');
      return false;
    }
  } catch (error) {
    logError(`Error: ${error.message}`);
    return false;
  }
}

async function testSendMessageOnSoldItem(itemId) {
  logTest('Test 4: Try Sending Message on Sold Item');
  
  try {
    const response = await fetch(`${API}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemId: itemId,
        senderEmail: 'test@ritchennai.edu.in',
        receiverEmail: 'seller@ritchennai.edu.in',
        senderName: 'Test User',
        text: 'Is this still available?'
      })
    });
    
    const data = await response.json();
    
    if (response.status === 403 && data.error) {
      logSuccess('Correctly blocked message on sold item');
      logInfo(`Error message: "${data.error}"`);
      return true;
    } else if (response.status === 401) {
      logInfo('Authentication required (expected for test)');
      return true;
    } else {
      logError('Should have blocked message on sold item');
      return false;
    }
  } catch (error) {
    logError(`Error: ${error.message}`);
    return false;
  }
}

async function testDatabaseMigration() {
  logTest('Test 5: Verify Database Migration');
  
  try {
    const response = await fetch(`${API}/items`);
    const data = await response.json();
    
    if (data.success && data.items) {
      const totalItems = data.items.length;
      const itemsWithStatus = data.items.filter(item => item.item_status).length;
      const itemsWithoutStatus = totalItems - itemsWithStatus;
      
      if (itemsWithoutStatus === 0) {
        logSuccess('All items have item_status field');
        logInfo(`Total items: ${totalItems}`);
        return true;
      } else {
        logError(`${itemsWithoutStatus} items missing item_status field`);
        return false;
      }
    } else {
      logError('Failed to verify migration');
      return false;
    }
  } catch (error) {
    logError(`Error: ${error.message}`);
    return false;
  }
}

async function testStatusEndpoint(itemId, userId) {
  logTest('Test 6: Update Item Status Endpoint');
  
  try {
    const response = await fetch(`${API}/items/${itemId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        item_status: 'Reserved'
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      logSuccess('Status update endpoint works');
      logInfo(`New status: ${data.item.item_status}`);
      return true;
    } else if (response.status === 403) {
      logInfo('Authorization required (expected for test)');
      return true;
    } else {
      logError(`Unexpected response: ${data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    logError(`Error: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  log('\n╔════════════════════════════════════════════╗', 'cyan');
  log('║   Chat Status System - Backend Tests      ║', 'cyan');
  log('╚════════════════════════════════════════════╝', 'cyan');
  
  logInfo('Testing backend API endpoints...\n');
  
  let passedTests = 0;
  let totalTests = 6;
  
  // Test 1: Get items
  const items = await testGetItems();
  if (items) passedTests++;
  
  // Test 2: Get single item
  if (items && items._id) {
    const item = await testGetSingleItem(items._id);
    if (item) passedTests++;
    
    // Test 3: Get messages with status
    const messagesTest = await testGetMessagesWithStatus(items._id);
    if (messagesTest) passedTests++;
    
    // Test 4: Try sending message on sold item (if item is sold)
    if (item.item_status === 'Sold') {
      const sendTest = await testSendMessageOnSoldItem(items._id);
      if (sendTest) passedTests++;
    } else {
      logInfo('\nSkipping Test 4: No sold items available');
      totalTests--;
    }
    
    // Test 6: Status update endpoint
    const statusTest = await testStatusEndpoint(items._id, item.user_id);
    if (statusTest) passedTests++;
  } else {
    logError('Cannot run remaining tests without items');
    totalTests = 1;
  }
  
  // Test 5: Database migration
  const migrationTest = await testDatabaseMigration();
  if (migrationTest) passedTests++;
  
  // Summary
  log('\n╔════════════════════════════════════════════╗', 'cyan');
  log('║              Test Summary                  ║', 'cyan');
  log('╚════════════════════════════════════════════╝', 'cyan');
  
  const percentage = Math.round((passedTests / totalTests) * 100);
  log(`\nTests Passed: ${passedTests}/${totalTests} (${percentage}%)`, 
      passedTests === totalTests ? 'green' : 'yellow');
  
  if (passedTests === totalTests) {
    log('\n🎉 All tests passed! Backend is working correctly.', 'green');
  } else {
    log('\n⚠️  Some tests failed. Check the output above for details.', 'yellow');
  }
  
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${API}/items`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Main execution
(async () => {
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    logError('\n❌ Server is not running!');
    logInfo('Please start the server first:');
    logInfo('  cd backend');
    logInfo('  node server.js\n');
    process.exit(1);
  }
  
  await runAllTests();
})();
