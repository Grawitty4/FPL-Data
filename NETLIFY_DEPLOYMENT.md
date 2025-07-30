# Netlify Deployment Guide

## 🚀 Quick Deploy to Netlify

### Step 1: Connect to GitHub
1. Go to [Netlify](https://app.netlify.com/)
2. Click "New site from Git"
3. Choose "GitHub"
4. Select your repository: `Grawitty4/FPL-Data`

### Step 2: Configure Build Settings
- **Build command**: `npm run build`
- **Publish directory**: `build`
- **Node version**: `18` (or latest LTS)

### Step 3: Add Environment Variable
1. Go to **Site settings** → **Environment variables**
2. Add new variable:
   - **Key**: `REACT_APP_API_URL`
   - **Value**: `https://inexpensive-trains-production.up.railway.app`
3. Click "Save"

### Step 4: Deploy
1. Click "Deploy site"
2. Wait for build to complete
3. Your site will be live!

## 🔧 Manual Deploy (Alternative)

If you prefer to upload the build folder manually:

1. **Build locally**:
   ```bash
   npm run build
   ```

2. **Upload to Netlify**:
   - Go to Netlify dashboard
   - Drag and drop the `build` folder
   - Add environment variable as above

## ✅ Verification

After deployment, your site should:
- ✅ Load without "Failed to fetch player data" errors
- ✅ Display FPL player data with all columns
- ✅ Show team names and positions correctly
- ✅ Have working sorting functionality

## 🔗 Your URLs

- **Frontend**: https://fpldataanalysis.netlify.app
- **Backend API**: https://inexpensive-trains-production.up.railway.app
- **GitHub**: https://github.com/Grawitty4/FPL-Data

## 🆘 Troubleshooting

### If you still see "Failed to fetch player data":
1. Check that environment variable is set correctly
2. Verify the Railway backend is running
3. Check browser console for specific errors

### If build fails:
1. Ensure all dependencies are in package.json
2. Check Node.js version compatibility
3. Review build logs in Netlify dashboard 