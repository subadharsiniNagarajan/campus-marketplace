const API = 'http://localhost:3000';

// ===== AUTH HELPERS =====
function saveUser(user) {
  localStorage.setItem('campusmart_user', JSON.stringify(user));
}

function getUser() {
  try { return JSON.parse(localStorage.getItem('campusmart_user')); } catch { return null; }
}

// Returns the Authorization header for authenticated API calls
function userAuthHeaders() {
  const u = getUser();
  if (u && u.token) return { 'Authorization': 'Bearer ' + u.token };
  return {};
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
      // Save user info AND the JWT token for authenticated API calls
      saveUser({ id: data.userId, name: data.name, email, token: data.token });
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
        // Save user info AND the JWT token
        saveUser({ id: data.userId, name: data.name, email, token: data.token });
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

// ===== IMAGE UPLOAD — MULTI (up to 7, with compression + drag-and-drop + reorder) =====
var selectedFiles  = [];   // array of { file: File, dataUrl: string, compressed: Blob }
var dragSrcIndex   = null;
var MAX_IMAGES     = 7;
var MAX_SIZE_BYTES = 5 * 1024 * 1024;
var ALLOWED_TYPES  = ['image/jpeg', 'image/jpg', 'image/png'];

// ── Compress a single image via canvas ──────────────────────────────────────
function compressImage(file, maxW, maxH, quality) {
  return new Promise(function (resolve) {
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        var w = img.width, h = img.height;
        if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
        if (h > maxH) { w = Math.round(w * maxH / h); h = maxH; }
        var canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        canvas.toBlob(function (blob) { resolve(blob); }, 'image/jpeg', quality);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ── Show / hide progress bar ─────────────────────────────────────────────────
function showProgress(pct, label) {
  var wrap  = document.getElementById('img-progress-wrap');
  var bar   = document.getElementById('img-progress-bar');
  var lbl   = document.getElementById('img-progress-label');
  if (!wrap) return;
  wrap.style.display = 'flex';
  bar.style.width    = pct + '%';
  if (lbl) lbl.textContent = label || '';
}
function hideProgress() {
  var wrap = document.getElementById('img-progress-wrap');
  if (wrap) wrap.style.display = 'none';
}

// ── Process incoming File objects ────────────────────────────────────────────
async function processFiles(files) {
  var errors = [];
  var toAdd  = [];

  for (var i = 0; i < files.length; i++) {
    var f = files[i];
    if (!ALLOWED_TYPES.includes(f.type)) {
      errors.push('"' + f.name + '": Only JPG and PNG formats are allowed.');
      continue;
    }
    if (f.size > MAX_SIZE_BYTES) {
      errors.push('"' + f.name + '": Each image must be less than 5 MB.');
      continue;
    }
    if (selectedFiles.length + toAdd.length >= MAX_IMAGES) {
      errors.push('Maximum ' + MAX_IMAGES + ' images allowed. Some files were skipped.');
      break;
    }
    toAdd.push(f);
  }

  if (errors.length) {
    var alertEl = document.getElementById('sell-alert');
    if (alertEl) {
      alertEl.className = 'alert alert-error show';
      alertEl.textContent = errors[0]; // show first error
    }
  }

  if (!toAdd.length) return;

  // Compress each file
  showProgress(10, 'Compressing images…');
  var step = 80 / toAdd.length;
  var pct  = 10;

  for (var j = 0; j < toAdd.length; j++) {
    var raw = toAdd[j];
    pct += step;
    showProgress(Math.round(pct), 'Compressing ' + (j + 1) + ' of ' + toAdd.length + '…');

    var compressed = await compressImage(raw, 1200, 1200, 0.82);
    var dataUrl    = await new Promise(function (res) {
      var r = new FileReader();
      r.onload = function (e) { res(e.target.result); };
      r.readAsDataURL(compressed);
    });

    selectedFiles.push({ file: raw, dataUrl: dataUrl, compressed: compressed });
  }

  showProgress(100, 'Done!');
  setTimeout(hideProgress, 600);
  renderImageGrid();
}

// ── File input handler ───────────────────────────────────────────────────────
function handleMultiImageSelect(event) {
  var files = Array.from(event.target.files);
  event.target.value = '';
  processFiles(files);
}

// ── Drag-and-drop handlers ───────────────────────────────────────────────────
function onDragOver(e) {
  e.preventDefault();
  document.getElementById('img-dropzone').classList.add('drag-over');
}
function onDragLeave(e) {
  document.getElementById('img-dropzone').classList.remove('drag-over');
}
function onDrop(e) {
  e.preventDefault();
  document.getElementById('img-dropzone').classList.remove('drag-over');
  var files = Array.from(e.dataTransfer.files);
  processFiles(files);
}

// ── Remove image ─────────────────────────────────────────────────────────────
function removeMultiImage(idx) {
  selectedFiles.splice(idx, 1);
  renderImageGrid();
}

// ── Drag-to-reorder ──────────────────────────────────────────────────────────
function onThumbDragStart(e, idx) {
  dragSrcIndex = idx;
  e.dataTransfer.effectAllowed = 'move';
  e.currentTarget.classList.add('dragging');
}
function onThumbDragOver(e, idx) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}
function onThumbDrop(e, idx) {
  e.preventDefault();
  if (dragSrcIndex === null || dragSrcIndex === idx) return;
  var moved = selectedFiles.splice(dragSrcIndex, 1)[0];
  selectedFiles.splice(idx, 0, moved);
  dragSrcIndex = null;
  renderImageGrid();
}
function onThumbDragEnd(e) {
  dragSrcIndex = null;
  document.querySelectorAll('.ipg-item').forEach(function (el) { el.classList.remove('dragging'); });
}

// ── Render the preview grid ──────────────────────────────────────────────────
function renderImageGrid() {
  var grid  = document.getElementById('img-preview-grid');
  var label = document.getElementById('img-count-label');
  if (!grid) return;

  if (!selectedFiles.length) {
    grid.innerHTML = '';
    if (label) label.textContent = '';
    return;
  }

  grid.innerHTML = selectedFiles.map(function (entry, idx) {
    var isMain = idx === 0;
    return '<div class="ipg-item' + (isMain ? ' ipg-main' : '') + '"'
      + ' draggable="true"'
      + ' ondragstart="onThumbDragStart(event,' + idx + ')"'
      + ' ondragover="onThumbDragOver(event,' + idx + ')"'
      + ' ondrop="onThumbDrop(event,' + idx + ')"'
      + ' ondragend="onThumbDragEnd(event)">'
      + (isMain ? '<div class="ipg-main-badge">⭐ Main</div>' : '')
      + '<img src="' + entry.dataUrl + '" class="ipg-img" alt="Image ' + (idx+1) + '" />'
      + '<div class="ipg-overlay">'
      + '  <button type="button" class="ipg-btn ipg-del" onclick="removeMultiImage(' + idx + ')" title="Remove">🗑️</button>'
      + (idx > 0 ? '  <button type="button" class="ipg-btn ipg-move" onclick="moveToMain(' + idx + ')" title="Set as main">⭐</button>' : '')
      + '</div>'
      + '<div class="ipg-drag-hint">⠿ drag</div>'
      + '</div>';
  }).join('');

  if (label) label.textContent = selectedFiles.length + ' of ' + MAX_IMAGES + ' image' + (selectedFiles.length > 1 ? 's' : '') + ' uploaded';
}

// ── Move image to first position (make it main) ──────────────────────────────
function moveToMain(idx) {
  var moved = selectedFiles.splice(idx, 1)[0];
  selectedFiles.unshift(moved);
  renderImageGrid();
}

// Legacy compat
function handleImageSelect(event) { handleMultiImageSelect(event); }
function removeImage() { selectedFiles = []; renderImageGrid(); }

// ===== SELL =====
async function handleSell(e) {
  e.preventDefault();
  const btn  = document.getElementById('sell-btn');
  const user = getUser();

  // Validate category
  const category = document.getElementById('item-category').value;
  if (!category) {
    showAlert('sell-alert', '⚠️ Please select a category before listing.');
    return;
  }

  // Deal type
  const dealType   = document.querySelector('input[name="deal_type"]:checked').value;
  const isSell     = dealType === 'sell';
  const priceVal   = document.getElementById('item-price').value;
  const exchangeFor = document.getElementById('item-exchange-for').value.trim();

  if (isSell) {
    if (!priceVal || isNaN(priceVal) || Number(priceVal) < 0) {
      showAlert('sell-alert', '⚠️ Please enter a valid price.');
      return;
    }
  } else {
    if (!exchangeFor) {
      showAlert('sell-alert', '⚠️ Please specify what you want to exchange for.');
      return;
    }
  }

  const formData = new FormData();
  formData.append('name',         document.getElementById('item-name').value.trim());
  formData.append('category',     category);
  formData.append('subject',      document.getElementById('item-subject').value.trim());
  formData.append('price',        isSell ? Number(priceVal) : 0);
  formData.append('condition',    document.getElementById('item-condition').value);
  formData.append('description',  document.getElementById('item-description').value.trim());
  formData.append('deal_type',    dealType);
  formData.append('exchange_for', exchangeFor);
  formData.append('user_id',      user.id);
  formData.append('seller_email', user.email);

  // Append up to 7 compressed images
  selectedFiles.forEach(function (entry, i) {
    var blob = entry.compressed || entry.file;
    formData.append('images', blob, 'image_' + i + '.jpg');
  });

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Submitting…';
  showProgress(20, 'Uploading…');

  try {
    const res  = await fetch(`${API}/addItem`, { method: 'POST', body: formData });
    showProgress(100, 'Done!');
    const data = await res.json();

    if (!res.ok) {
      showAlert('sell-alert', data.error || 'Failed to list item.');
    } else {
      showAlert('sell-alert', '✅ Item submitted for evaluation! An admin will review it shortly.', 'success');
      document.getElementById('sell-form').reset();
      selectedFiles = [];
      renderImageGrid();
      hideProgress();
      // Reset deal type UI
      document.getElementById('price-group').style.display    = '';
      document.getElementById('exchange-group').style.display = 'none';
    }
  } catch {
    showAlert('sell-alert', 'Cannot connect to server. Is it running?');
  } finally {
    hideProgress();
    btn.disabled = false;
    btn.innerHTML = 'Submit for Evaluation';
  }
}

// Redirect logged-in users away from login page
if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
  if (getUser()) window.location.href = 'dashboard.html';
}
