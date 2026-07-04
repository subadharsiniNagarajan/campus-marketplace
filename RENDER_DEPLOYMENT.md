# Trifting - Render Deployment Guide

## Live URL
🚀 **https://trifting.onrender.com**

## Deployment Configuration

### 1. Environment Variables (Required)
Add these in your Render dashboard under **Environment Variables**:

```
MONGO_URI=mongodb+srv://campusmart:suba%401401@cluster0.k8zcvfn.mongodb.net/campusmart?retryWrites=true&w=majority&appName=Cluster0

JWT_SECRET=campusmart_admin_jwt_secret_2024

NODE_ENV=production
```

### 2. Render Settings

**Service Type:** Web Service

**Build Settings:**
- **Build Command:** `cd backend && npm install`
- **Start Command:** `cd backend && npm start`
- **Root Directory:** Leave empty (or use `/`)
- **Environment:** Node

**Advanced Settings:**
- **Health Check Path:** `/` (optional)
- **Auto-Deploy:** Yes (deploys on git push)

### 3. Static Frontend Deployment

Since your frontend is static HTML/CSS/JS, you have two options:

#### Option A: Serve frontend from backend (Current Setup)
The backend already serves static files from the `frontend` folder:
```javascript
app.use(express.static(path.join(__dirname, '../frontend')));
```

Frontend will be accessible at: https://trifting.onrender.com

#### Option B: Deploy frontend separately on Render Static Site
1. Create a new **Static Site** on Render
2. Point to the `frontend` directory
3. Update API URLs in frontend files to point to backend service

### 4. CORS Configuration

The backend is configured to allow all origins:
```javascript
app.use(cors({ origin: '*', ... }));
```

For production, you may want to restrict this to your frontend domain.

### 5. File Uploads

⚠️ **Important:** Render's ephemeral filesystem means uploaded files will be lost on service restart.

**Solutions:**
- Use cloud storage (AWS S3, Cloudinary, etc.)
- Or accept that uploads are temporary during free tier usage

### 6. Database Connection

MongoDB Atlas is already configured. Ensure:
- Your MongoDB Atlas cluster allows connections from `0.0.0.0/0` (all IPs) or add Render's IPs
- The database user has read/write permissions

### 7. Deployment Checklist

- [x] Update server.js to use environment variables
- [x] Create render.yaml configuration file
- [x] Add .env.example for reference
- [ ] Set environment variables in Render dashboard
- [ ] Push code to GitHub
- [ ] Connect Render to GitHub repository
- [ ] Deploy and test

### 8. Post-Deployment Testing

Test these endpoints:
- `GET /` - Frontend homepage
- `POST /signup` - User registration
- `POST /login` - User login
- `GET /items` - Fetch items
- `POST /admin/login` - Admin login

### 9. Monitoring

- Check Render logs for errors
- Monitor MongoDB Atlas metrics
- Set up health checks

### 10. Free Tier Limitations

Render Free Tier:
- Service spins down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds (cold start)
- 750 hours/month free (sufficient for one always-on service)

## Support

For issues, check:
1. Render service logs
2. MongoDB Atlas connection status
3. Environment variables configuration
