# FPL Player Analyzer - Deployment Guide

## 🚀 Netlify Deployment

### Prerequisites
- Netlify account
- Custom domain (optional)
- Git repository with your code

### Deployment Steps

1. **Connect to Git Repository**
   - Go to Netlify dashboard
   - Click "New site from Git"
   - Connect your GitHub/GitLab repository
   - Select the repository containing this project

2. **Build Settings**
   - **Build command**: `npm run build`
   - **Publish directory**: `build`
   - **Node version**: 18 (specified in netlify.toml)

3. **Environment Variables** (if needed for frontend)
   - Go to Site settings > Environment variables
   - Add any required environment variables

4. **Deploy**
   - Click "Deploy site"
   - Netlify will build and deploy your React app

### Custom Domain Setup

1. **Add Custom Domain**
   - Go to Site settings > Domain management
   - Click "Add custom domain"
   - Enter your domain name

2. **DNS Configuration**
   - Add CNAME record pointing to your Netlify site
   - Or use Netlify's nameservers for full DNS management

3. **SSL Certificate**
   - Netlify automatically provides SSL certificates
   - Force HTTPS redirect in Site settings > Domain management

### Important Notes

⚠️ **Backend API**: This React app connects to a backend API running on `localhost:3001`. For production:

1. **Deploy Backend Separately**
   - Deploy the Node.js backend to a service like:
     - Heroku
     - Railway
     - DigitalOcean
     - AWS/GCP/Azure

2. **Update API URLs**
   - Change `http://localhost:3001` to your production backend URL
   - Update in `src/FPLData.js` and other API calls

3. **Environment Variables**
   - Set production database URL
   - Configure CORS for your domain

### Current Configuration

- **React**: 18.2.0
- **React Router**: 6.23.1
- **Build**: Optimized production build
- **Routing**: Client-side routing with fallback to index.html

### Troubleshooting

**Build Errors**:
- Ensure Node.js version 18+
- Check package.json dependencies
- Verify all imports are correct

**Routing Issues**:
- The `netlify.toml` file handles client-side routing
- All routes redirect to index.html for React Router

**API Connection**:
- Frontend will work but API calls will fail until backend is deployed
- Update API URLs to production backend URL 