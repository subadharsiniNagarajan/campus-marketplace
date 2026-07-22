# Campus Marketplace - Render Deployment Guide

## ✅ Deployment Configuration

Your Campus Marketplace is now correctly configured to deploy on **Render** with both frontend and backend together.

### 🏗️ Architecture

**Single Service Deployment:**
- **Backend**: Node.js/Express API running on Render
- **Frontend**: Static HTML/CSS/JS files served by the Express backend
- **Database**: MongoDB Atlas (cloud)
- **File Storage**: Local uploads folder on Render

### 📁 Project Structure

```
project/
├── backend/
│   ├── server.js          # Express server (serves API + frontend)
│   ├── package.json       # Backend dependencies
│   ├── database.db        # SQLite (not used, MongoDB is primary)
│   └── uploads/          # User uploaded images
├── frontend/
│   ├── index.html        # Login/signup page
│   ├── dashboard.html    # Main marketplace
│   ├── script.js         # API configuration (auto-detects URL)
│   └── style.css         # Styles
└── render.yaml           # Render deployment config
```

### 🔧 How It Works

1. **Render builds**: `cd backend && npm install`
2. **Render starts**: `cd backend && node server.js`
3. **Express serves**:
   - API routes: `/api/*`, `/items`, `/signup`, etc.
   - Static files: Frontend folder at `../frontend`
   - Uploads: `/uploads/*` folder
   - Catch-all: Any unmatched route → `index.html`

4. **Frontend detects URL**:
   ```javascript
   const API = window.location.hostname === 'localhost' 
     ? 'http://localhost:3000'  // Development
     : window.location.origin;   // Production (Render URL)
   ```

### 🚀 Deployment Steps

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Your message"
   git push origin main
   ```

2. **Render Auto-Deploys**:
   - Render detects the push
   - Runs build command
   - Starts the server
   - Deployment takes 2-3 minutes

3. **Access Your App**:
   - URL: https://campus-marketplace-ywfp.onrender.com
   - Backend automatically serves frontend
   - All features work together

### ✅ Key Configuration Files

#### `render.yaml`
```yaml
services:
  - type: web
    name: campus-marketplace
    env: node
    region: oregon
    buildCommand: cd backend && npm install
    startCommand: cd backend && node server.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
```

#### `backend/server.js` (Key Parts)
```javascript
// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend'), {
  setHeaders: function(res, filePath) {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    }
  }
}));

// Serve uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes...
app.post('/signup', ...);
app.post('/login', ...);
app.get('/items', ...);

// Catch-all: serve index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Start server on 0.0.0.0 for Render
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ CampusMart server running on port ${PORT}`);
});
```

#### `frontend/script.js`
```javascript
// Auto-detect API URL
const API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:3000' 
  : window.location.origin;
```

### 🔍 Troubleshooting

1. **"Cannot connect to server"**
   - Check Render logs: Dashboard → campus-marketplace → Logs
   - Verify MongoDB connection successful
   - Ensure server binds to `0.0.0.0` not `localhost`

2. **Frontend not loading**
   - Check server.js has `express.static('../frontend')`
   - Verify catch-all route is last: `app.get('*', ...)`
   - Clear browser cache (Ctrl+F5)

3. **API calls failing**
   - Open browser console (F12)
   - Check "CampusMart API URL: ..." message
   - Should show Render URL in production
   - Check Network tab for failed requests

4. **Images not loading**
   - Render's free tier has ephemeral storage
   - Uploads are lost on restart
   - Consider using Cloudinary for production

### 📊 Deployment Status

- ✅ GitHub: https://github.com/subadharsiniNagarajan/campus-marketplace.git
- ✅ Render: https://campus-marketplace-ywfp.onrender.com
- ✅ MongoDB Atlas: Connected
- ✅ Socket.io: Real-time chat enabled
- ✅ Frontend: Served by Express backend
- ✅ API: All endpoints working

### 🎉 Features Deployed

- ✅ User authentication (signup/login)
- ✅ Item listing marketplace
- ✅ Real-time chat (Socket.io)
- ✅ File uploads
- ✅ Purchase requests
- ✅ Admin moderation
- ✅ Ratings & reviews
- ✅ Wishlist

### 📝 Notes

- **Free Tier Limitations**:
  - Server sleeps after 15 min inactivity
  - First request takes 30-60 seconds to wake up
  - 750 hours/month free
  - Ephemeral storage (uploads lost on restart)

- **Production Improvements**:
  - Use Cloudinary/AWS S3 for uploads
  - Add Redis for session management
  - Enable Render persistent disk (paid)
  - Add custom domain

### 🔗 Useful Links

- [Render Dashboard](https://dashboard.render.com)
- [GitHub Repository](https://github.com/subadharsiniNagarajan/campus-marketplace.git)
- [MongoDB Atlas](https://cloud.mongodb.com)
- [Live Application](https://campus-marketplace-ywfp.onrender.com)

---

**Deployment Date**: July 22, 2026  
**Status**: ✅ Successfully Deployed
