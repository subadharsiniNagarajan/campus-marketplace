const http = require('http');

console.log('🧪 Testing Signup Fix...\n');

// Test 1: Test signup endpoint
console.log('📝 Test 1: Testing POST /signup endpoint...');

const signupData = JSON.stringify({
  name: 'Test User',
  email: 'testuser@ritchennai.edu.in',
  password: 'test123456'
});

const signupOptions = {
  hostname: 'localhost',
  port: 3000,
  path: '/signup',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': signupData.length
  }
};

const signupReq = http.request(signupOptions, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('Response:', response);
      
      if (response.token) {
        console.log('✅ SUCCESS: Token is present in response');
        console.log('   Token:', response.token.substring(0, 20) + '...');
      } else {
        console.log('❌ FAIL: Token is missing from response');
      }
      
      if (response.userId) {
        console.log('✅ SUCCESS: userId is present');
      }
      
      if (response.name) {
        console.log('✅ SUCCESS: name is present');
      }
      
      console.log('\n📝 Test 2: Testing POST /login endpoint...');
      testLogin();
      
    } catch (err) {
      console.log('❌ FAIL: Invalid JSON response');
      console.log('Error:', err.message);
      console.log('Raw response:', data);
    }
  });
});

signupReq.on('error', (error) => {
  if (error.code === 'ECONNREFUSED') {
    console.log('❌ FAIL: Cannot connect to server. Is it running on port 3000?');
  } else {
    console.log('❌ FAIL:', error.message);
  }
});

signupReq.write(signupData);
signupReq.end();

// Test 2: Test login endpoint
function testLogin() {
  const loginData = JSON.stringify({
    email: 'testuser@ritchennai.edu.in',
    password: 'test123456'
  });

  const loginOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': loginData.length
    }
  };

  const loginReq = http.request(loginOptions, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log('Response:', response);
        
        if (response.token) {
          console.log('✅ SUCCESS: Token is present in login response');
          console.log('   Token:', response.token.substring(0, 20) + '...');
        } else {
          console.log('❌ FAIL: Token is missing from login response');
        }
        
        if (response.userId) {
          console.log('✅ SUCCESS: userId is present');
        }
        
        if (response.name) {
          console.log('✅ SUCCESS: name is present');
        }
        
        console.log('\n🎉 All backend tests completed!');
        console.log('\n📋 Next steps:');
        console.log('   1. Open http://localhost:3000 in your browser');
        console.log('   2. Clear browser cache (Ctrl+Shift+Delete)');
        console.log('   3. Hard refresh (Ctrl+Shift+R)');
        console.log('   4. Click "Sign Up" tab');
        console.log('   5. Fill form and submit');
        console.log('   6. Check browser console for errors (F12)');
        console.log('   7. Verify redirect to dashboard\n');
        
      } catch (err) {
        console.log('❌ FAIL: Invalid JSON response');
        console.log('Error:', err.message);
        console.log('Raw response:', data);
      }
    });
  });

  loginReq.on('error', (error) => {
    console.log('❌ FAIL:', error.message);
  });

  loginReq.write(loginData);
  loginReq.end();
}
