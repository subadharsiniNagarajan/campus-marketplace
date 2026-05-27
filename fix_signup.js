const fs = require('fs');
const path = require('path');

console.log('🔧 Starting Signup Fix Script...\n');

// Fix 1: frontend/index.html - Fix quote escaping
console.log('📝 Fix 1: Fixing frontend/index.html quote escaping...');
const indexPath = path.join(__dirname, 'frontend', 'index.html');
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Replace all instances of double single-quotes with single quotes
indexContent = indexContent.replace(/onclick="switchTab\(''login''\)"/g, 'onclick="switchTab(\'login\')"');
indexContent = indexContent.replace(/onclick="switchTab\(''signup''\)"/g, 'onclick="switchTab(\'signup\')"');

fs.writeFileSync(indexPath, indexContent, 'utf8');
console.log('✅ Fixed frontend/index.html\n');

// Fix 2: backend/server.js - Add JWT token to signup response
console.log('📝 Fix 2: Adding JWT token to signup response...');
const serverPath = path.join(__dirname, 'backend', 'server.js');
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Find and replace signup response
const signupOldResponse = `res.json({ success: true, message: 'Account created successfully.', userId: user._id, name: user.name });`;
const signupNewResponse = `const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      success: true, 
      message: 'Account created successfully.', 
      userId: user._id, 
      name: user.name,
      token: token
    });`;

if (serverContent.includes(signupOldResponse)) {
  serverContent = serverContent.replace(signupOldResponse, signupNewResponse);
  console.log('✅ Fixed signup response\n');
} else {
  console.log('⚠️  Signup response already fixed or pattern not found\n');
}

// Fix 3: backend/server.js - Add JWT token to login response
console.log('📝 Fix 3: Adding JWT token to login response...');
const loginOldResponse = `res.json({ success: true, message: 'Login successful.', userId: user._id, name: user.name });`;
const loginNewResponse = `const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      success: true, 
      message: 'Login successful.', 
      userId: user._id, 
      name: user.name,
      token: token
    });`;

if (serverContent.includes(loginOldResponse)) {
  serverContent = serverContent.replace(loginOldResponse, loginNewResponse);
  console.log('✅ Fixed login response\n');
} else {
  console.log('⚠️  Login response already fixed or pattern not found\n');
}

fs.writeFileSync(serverPath, serverContent, 'utf8');
console.log('✅ Fixed backend/server.js\n');

console.log('🎉 All fixes applied successfully!\n');
console.log('📋 Next steps:');
console.log('   1. Restart backend server: cd backend && node server.js');
console.log('   2. Clear browser cache and hard refresh (Ctrl+Shift+R)');
console.log('   3. Test signup at http://localhost:3000\n');
