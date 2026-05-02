# 🚀 Campus Mart - Quick Deployment Guide

## ⚡ Deploy in 5 Minutes (Recommended)

### Step 1: Go to Render
👉 **https://render.com/dashboard**

### Step 2: Create New Web Service
1. Click **"New +"** button (top right)
2. Select **"Web Service"**

### Step 3: Connect GitHub
1. Click **"Connect account"** under GitHub
2. Select repository: **`campus-mart-`**
3. Click **"Connect"**

### Step 4: Configure Service
Fill in these settings:

| Setting | Value |
|---------|-------|
| **Name** | `campus-mart` |
| **Root Directory** | `backend` |
| **Environment** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

### Step 5: Add Environment Variables
Click **"Advanced"** → **"Add Environment Variable"**

Add these two variables:

```
MONGO_URI = mongodb+srv://campusmart:suba%401401@cluster0.k8zcvfn.mongodb.net/campusmart?retryWrites=true&w=majority&appName=Cluster0

JWT_SECRET = campusmart_admin_jwt_secret_2024
```

### Step 6: Deploy!
1. Click **"Create Web Service"**
2. Wait 2-3 minutes ⏳
3. Your app will be live! 🎉

### Step 7: Get Your URL
After deployment completes, you'll see:
```
✅ Live at: https://campus-mart.onrender.com
```

---

## 🔧 Update Frontend (Important!)

After deployment, update your frontend to use the new URL:

### Files to Update:
1. `frontend/index.html`
2. `frontend/script.js`
3. `frontend/dashboard.html`
4. `frontend/buy.html`
5. `frontend/sell.html`
6. `frontend/chat.html`
7. `frontend/settings.html`
8. `frontend/admin.html`
9. `frontend/admin-login.html`

### Change This:
```javascript
const API_URL = "http://localhost:3000";
```

### To This:
```javascript
const API_URL = "https://campus-mart.onrender.com";  // Your actual Render URL
```

### Then Commit & Push:
```bash
git add .
git commit -m "Update API URL to production"
git push origin main
```

Render will automatically redeploy with the new changes!

---

## ✅ Verify Everything Works

Test these features:
- [ ] Open your app URL
- [ ] Sign up with college email
- [ ] Login works
- [ ] List an item
- [ ] Browse items
- [ ] Send a chat message
- [ ] Receive chat message in real-time
- [ ] Admin login works

---

## 🆘 Troubleshooting

### App shows "Application Error"
**Solution**: Check Render logs
1. Go to your service dashboard
2. Click "Logs" tab
3. Look for error messages

### Can't connect to MongoDB
**Solution**: Check environment variables
1. Go to "Environment" tab
2. Verify `MONGO_URI` is set correctly
3. No extra spaces or quotes

### Chat not working
**Solution**: Check Socket.io connection
1. Open browser console (F12)
2. Look for WebSocket errors
3. Verify API_URL is correct in frontend

### Images not uploading
**Solution**: Render's filesystem is ephemeral
- Images will be lost on restart
- For production, use Cloudinary or AWS S3
- For testing, current setup works fine

---

## 💡 Pro Tips

### Free Tier Limitations:
- App sleeps after 15 minutes of inactivity
- First request after sleep takes ~30 seconds to wake up
- 750 hours/month free (enough for one app 24/7)

### Keep App Awake (Optional):
Use a service like **UptimeRobot** to ping your app every 5 minutes:
1. Go to https://uptimerobot.com
2. Add monitor: `https://campus-mart.onrender.com`
3. Check interval: 5 minutes

### Custom Domain (Optional):
1. Buy domain (Namecheap, GoDaddy)
2. In Render: Settings → Custom Domain
3. Add your domain
4. Update DNS records as shown

---

## 📊 What You Get

✅ **Full Socket.io support** - Real-time chat works perfectly  
✅ **MongoDB connection** - All data persists  
✅ **File uploads** - Images work (ephemeral on free tier)  
✅ **HTTPS** - Automatic SSL certificate  
✅ **Auto-deploy** - Push to GitHub = automatic deployment  
✅ **Free tier** - No credit card required  

---

## 🎓 For Your College Project

### What to Submit:
1. **Live URL**: `https://campus-mart.onrender.com`
2. **GitHub Repo**: `https://github.com/subadharsiniNagarajan/campus-mart-`
3. **Documentation**: This README + VERCEL_ERROR_EXPLAINED.md
4. **Demo Video**: Record yourself using the app

### Presentation Points:
- ✅ Full-stack MERN application
- ✅ Real-time chat with Socket.io
- ✅ User authentication with JWT
- ✅ Admin moderation system
- ✅ Image upload functionality
- ✅ Rating system
- ✅ Responsive design
- ✅ Deployed to production

---

## 🚀 Alternative: Railway (Also Great)

If Render doesn't work, try Railway:

1. Go to **https://railway.app**
2. Sign up with GitHub
3. **New Project** → **Deploy from GitHub**
4. Select `campus-mart-` repo
5. Add environment variables (same as above)
6. Deploy!

Railway gives you $5 free credit per month.

---

## ❓ Questions?

**Render not working?** → Try Railway  
**Need custom domain?** → See "Custom Domain" section above  
**Want to use Vercel?** → Read VERCEL_ERROR_EXPLAINED.md (not recommended)  
**Images disappearing?** → Normal on free tier, use cloud storage for production  

---

## 🎉 You're Done!

Your Campus Mart is now live and accessible to anyone with the URL. Share it with your classmates and start trading! 🎓📚

**Next Steps**:
1. Test all features thoroughly
2. Share with friends for feedback
3. Add more features (wishlist, notifications, etc.)
4. Consider upgrading to paid tier for production use

---

**Made with ❤️ by Suba Darsini**  
**RIT Chennai**
