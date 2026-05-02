# Campus Mart - Deployment Guide

## ⚠️ IMPORTANT: Vercel Limitations

Your application uses **Socket.io for real-time chat**, which **does NOT work on Vercel** because:
- Vercel uses serverless functions (stateless, short-lived)
- Socket.io requires persistent WebSocket connections
- Vercel's infrastructure doesn't support long-running connections

## 🎯 Recommended Deployment Options

### Option 1: Deploy to Render (RECOMMENDED)
**Best for your full-stack app with Socket.io**

1. **Create account**: https://render.com
2. **Create Web Service**:
   - Connect your GitHub repo
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
   - Environment: Node
   - Add environment variable: `MONGO_URI` (your MongoDB connection string)

3. **Deploy Frontend** (optional separate static site):
   - Create Static Site
   - Build Command: (leave empty)
   - Publish Directory: `frontend`

**Pros**: 
- ✅ Full Socket.io support
- ✅ Free tier available
- ✅ Easy setup
- ✅ Persistent connections

### Option 2: Deploy to Railway
**Another excellent option for full-stack apps**

1. **Create account**: https://railway.app
2. **New Project** → Deploy from GitHub
3. **Configure**:
   - Root Directory: `backend`
   - Start Command: `npm start`
   - Add MongoDB URI as environment variable

**Pros**:
- ✅ Socket.io works perfectly
- ✅ Simple deployment
- ✅ Free $5 credit monthly

### Option 3: Deploy to Heroku
**Traditional but reliable**

1. Create Heroku account
2. Install Heroku CLI
3. Deploy:
```bash
heroku create campus-mart
git push heroku main
heroku config:set MONGO_URI="your_mongodb_uri"
```

### Option 4: Use Vercel (Frontend Only) + Separate Backend
**Split deployment - more complex**

1. **Frontend on Vercel**:
   - Deploy only the `frontend` folder
   - Update API_URL to point to your backend

2. **Backend on Render/Railway**:
   - Deploy backend separately
   - Keep Socket.io functionality

## 🔧 If You Must Use Vercel

You'll need to **remove Socket.io** and use **polling** instead:

### Changes Required:
1. Remove Socket.io from backend
2. Use HTTP polling for chat (fetch messages every 2-3 seconds)
3. Update frontend to poll instead of using WebSocket

**This is NOT recommended** as it:
- ❌ Increases server load
- ❌ Delays message delivery
- ❌ Wastes bandwidth
- ❌ Poor user experience

## 📝 Environment Variables Needed

For any deployment platform, set these:

```
MONGO_URI=mongodb+srv://campusmart:suba%401401@cluster0.k8zcvfn.mongodb.net/campusmart?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=campusmart_admin_jwt_secret_2024
PORT=3000
NODE_ENV=production
```

⚠️ **Security Note**: Your MongoDB credentials are currently exposed in the code. Move them to environment variables!

## 🚀 Quick Start (Render Deployment)

1. Push your code to GitHub (already done ✅)
2. Go to https://render.com/dashboard
3. Click "New +" → "Web Service"
4. Connect your GitHub repo: `subadharsiniNagarajan/campus-mart-`
5. Configure:
   - **Name**: campus-mart
   - **Root Directory**: `backend`
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. Add Environment Variables (click "Advanced"):
   - `MONGO_URI`: (your MongoDB connection string)
   - `JWT_SECRET`: campusmart_admin_jwt_secret_2024
7. Click "Create Web Service"
8. Wait 2-3 minutes for deployment
9. Your app will be live at: `https://campus-mart.onrender.com`

## 📱 Update Frontend API URL

After deploying backend, update `frontend/index.html`, `frontend/script.js`, etc.:

```javascript
// Change from:
const API_URL = "http://localhost:3000";

// To:
const API_URL = "https://campus-mart.onrender.com";
```

Then redeploy or commit the change.

## ✅ Verification Checklist

After deployment:
- [ ] Backend is running (check logs)
- [ ] MongoDB connection successful
- [ ] Frontend loads correctly
- [ ] Login/Signup works
- [ ] Items can be listed
- [ ] Chat messages send/receive in real-time
- [ ] Image uploads work
- [ ] Admin panel accessible

## 🆘 Troubleshooting

### "Application Error" or 500 errors
- Check environment variables are set correctly
- Verify MongoDB connection string
- Check deployment logs

### Chat not working
- Ensure Socket.io is running (check server logs)
- Verify CORS settings allow your frontend domain
- Check browser console for WebSocket errors

### Images not loading
- Ensure `uploads` folder is writable
- Check file size limits (5MB max)
- Verify multer configuration

## 📚 Additional Resources

- [Render Docs](https://render.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Socket.io Deployment](https://socket.io/docs/v4/server-deployment/)
