const API = 'http://localhost:3000';

// ===== AUTH HELPERS =====
function saveUser(user) {
  localStorage.setItem('campusmart_user', JSON.stringify(user));
}

function getUser() {
  try { return JSON.parse(localStorage.getItem('campusmart_user')); } catch { return null; }
}

function requireAuth() {
  if (!getUser()) window.location.href = 'index.html';
}

function logout() {
  localStorage.removeItem('campusmart_user');
  window.location.href = 'index.html';
}

// ===== ALERT HELPER =====
function showAlert(id, message, type = 'error') {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = `alert alert-${type} show`;
  el.textContent = message;
  if (type === 'success') setTimeout(() => el.classList.remove('show'), 4000);
}

// ===== TAB SWITCH =====
function switchTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('login-form').style.display = isLogin ? 'block' : 'none';
  document.getElementById('signup-form').style.display = isLogin ? 'none' : 'block';
  document.getElementById('tab-login').classList.toggle('active', isLogin);
  document.getElementById('tab-signup').classList.toggle('active', !isLogin);
  const alert = document.getElementById('alert');
  if (alert) alert.classList.remove('show');
}

// ===== LOGIN =====
async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Logging in...';

  try {
    const res = await fetch(`${API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (!res.ok) {
      showAlert('alert', data.error || 'Login failed.');
    } else {
      saveUser({ id: data.userId, name: data.name, email });
      window.location.href = 'dashboard.html';
    }
  } catch {
    showAlert('alert', 'Cannot connect to server. Is it running?');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Login';
  }
}

// ===== SIGNUP =====
async function handleSignup(e) {
  e.preventDefault();
  const btn = document.getElementById('signup-btn');
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Creating account...';

  try {
    const res = await fetch(`${API}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();

    if (!res.ok) {
      showAlert('alert', data.error || 'Signup failed.');
    } else {
      showAlert('alert', 'Account created! Logging you in...', 'success');
      setTimeout(() => {
        saveUser({ id: data.userId, name: data.name, email });
        window.location.href = 'dashboard.html';
      }, 1200);
    }
  } catch {
    showAlert('alert', 'Cannot connect to server. Is it running?');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Create Account';
  }
}

// ===== IMAGE PREVIEW =====
function previewImage(event) {
  const file = event.target.files[0];
  if (!file) return;
  const preview = document.getElementById('image-preview');
  const img = document.getElementById('preview-img');
  const reader = new FileReader();
  reader.onload = e => {
    img.src = e.target.result;
    preview.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

// ===== SELL =====
async function handleSell(e) {
  e.preventDefault();
  const btn = document.getElementById('sell-btn');
  const user = getUser();

  const formData = new FormData();
  formData.append('name', document.getElementById('item-name').value.trim());
  formData.append('category', document.getElementById('item-category').value);
  formData.append('subject', document.getElementById('item-subject').value.trim());
  formData.append('price', document.getElementById('item-price').value);
  formData.append('condition', document.getElementById('item-condition').value);
  formData.append('description', document.getElementById('item-description').value.trim());
  formData.append('contact', document.getElementById('item-contact').value.trim());
  formData.append('user_id', user.id);

  const imageFile = document.getElementById('item-image').files[0];
  if (imageFile) formData.append('image', imageFile);

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Listing item...';

  try {
    const res = await fetch(`${API}/addItem`, { method: 'POST', body: formData });
    const data = await res.json();

    if (!res.ok) {
      showAlert('sell-alert', data.error || 'Failed to list item.');
    } else {
      showAlert('sell-alert', '🎉 Item listed successfully!', 'success');
      document.getElementById('sell-form').reset();
      document.getElementById('image-preview').style.display = 'none';
    }
  } catch {
    showAlert('sell-alert', 'Cannot connect to server. Is it running?');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '🚀 List Item for Sale';
  }
}

// Redirect logged-in users away from login page
if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
  if (getUser()) window.location.href = 'dashboard.html';
}
