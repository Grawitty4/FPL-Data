# Backend Deployment Guide - Fix "Failed to fetch player data"

## 🚨 Problem
Your Netlify frontend is trying to connect to `localhost:3001` which only works locally. You need to deploy the backend to a cloud service.

## 🚀 Quick Fix: Deploy to Railway (Recommended)

### Step 1: Prepare Your Code
1. **Commit your changes** to Git
2. **Push to GitHub/GitLab** repository

### Step 2: Deploy to Railway
1. Go to [Railway.app](https://railway.app)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your repository
6. Railway will automatically detect it's a Node.js app

### Step 3: Configure Environment Variables
In Railway dashboard, go to your project → Variables tab and add:
```
DATABASE_URL=postgresql://postgres:Acc1234%24%24@db.fwqrrngzrbtqycmlcyid.supabase.co:5432/postgres?sslmode=require
PORT=3001
NODE_ENV=production
FPL_API_URL=https://fantasy.premierleague.com/api/bootstrap-static/
```

### Step 4: Get Your Backend URL
1. Railway will give you a URL like: `https://your-app-name.railway.app`
2. Copy this URL

### Step 5: Update Frontend Configuration
1. Go to your Netlify dashboard
2. Site settings → Environment variables
3. Add: `REACT_APP_API_URL` = `https://your-app-name.railway.app`
4. Redeploy your Netlify site

## 🔧 Alternative: Deploy to Heroku

### Step 1: Install Heroku CLI
```bash
# macOS
brew install heroku/brew/heroku

# Or download from https://devcenter.heroku.com/articles/heroku-cli
```

### Step 2: Deploy
```bash
# Login to Heroku
heroku login

# Create Heroku app
heroku create your-fpl-backend

# Set environment variables
heroku config:set DATABASE_URL="postgresql://postgres:Acc1234%24%24@db.fwqrrngzrbtqycmlcyid.supabase.co:5432/postgres?sslmode=require"
heroku config:set NODE_ENV=production
heroku config:set FPL_API_URL="https://fantasy.premierleague.com/api/bootstrap-static/"

# Deploy
git push heroku main
```

### Step 3: Update Frontend
Set `REACT_APP_API_URL` in Netlify to your Heroku URL.

## 🌐 Alternative: Deploy to Render

1. Go to [Render.com](https://render.com)
2. Create new Web Service
3. Connect your GitHub repo
4. Set build command: `npm install`
5. Set start command: `node server.js`
6. Add environment variables
7. Deploy

## ✅ Verification Steps

### Test Backend API
```bash
# Test database connection
curl https://your-backend-url.railway.app/api/test-db

# Test FPL data
curl https://your-backend-url.railway.app/api/fpl-data

# Test stored data
curl https://your-backend-url.railway.app/api/stored-fpl-data
```

### Test Frontend
1. Visit your Netlify site
2. Check browser console for errors
3. Try accessing the FPL data page
4. Verify data loads correctly

## 🔍 Troubleshooting

### Common Issues:

1. **CORS Errors**
   - Update CORS in server.js to allow your Netlify domain
   ```javascript
   app.use(cors({
     origin: ['https://your-netlify-site.netlify.app', 'http://localhost:3000']
   }));
   ```

2. **Database Connection Issues**
   - Verify DATABASE_URL is correct
   - Check Supabase connection settings

3. **Environment Variables**
   - Ensure all variables are set in Railway/Heroku
   - Check variable names match exactly

4. **Build Errors**
   - Check Railway/Heroku logs
   - Verify package.json has all dependencies

## 📞 Support

If you encounter issues:
1. Check the deployment platform logs
2. Verify environment variables
3. Test API endpoints directly
4. Check browser console for specific error messages

## 🎯 Expected Result

After deployment:
- ✅ Backend API accessible at `https://your-backend-url.railway.app`
- ✅ Frontend connects to production backend
- ✅ FPL data loads successfully
- ✅ Database operations work
- ✅ Automated refresh schedule runs 