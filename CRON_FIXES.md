# FPL Data Cron Job Fixes

## 🚨 Issues Identified

### 1. **Cron Job Timezone Problem**
- **Problem**: Cron job was configured for `Asia/Kolkata` timezone, but Railway runs in UTC
- **Result**: Cron job was running at wrong time or not at all
- **Fix**: Changed timezone to `UTC` and updated schedule logic

### 2. **Data Insertion Strategy**
- **Problem**: Current approach uses `DELETE + INSERT` instead of proper historical tracking
- **Result**: Each run overwrites all data instead of creating historical snapshots
- **Current Status**: Using DELETE + INSERT for now, but added timestamp tracking

### 3. **Missing Monitoring**
- **Problem**: No way to check if cron job is running or when it last executed
- **Fix**: Added health check endpoints

## 🔧 Fixes Implemented

### 1. **Fixed Timezone Configuration**
```javascript
// Before (WRONG for Railway)
cron.schedule('31 18 * * 1', () => {
  refreshFPLData();
}, {
  scheduled: true,
  timezone: "Asia/Kolkata"  // ❌ Railway runs in UTC
});

// After (CORRECT for Railway)
cron.schedule('31 18 * * 1', () => {
  refreshFPLData();
}, {
  scheduled: true,
  timezone: "UTC"  // ✅ Railway runs in UTC
});
```

### 2. **Added Health Check Endpoints**
- **`/api/cron-status`**: Shows cron job schedule and next run time
- **`/api/data-status`**: Shows data freshness and gameweek information

### 3. **Enhanced Logging**
- Added timestamp tracking for each refresh
- Added gameweek identification logging
- Better error handling and console output

## 📅 Cron Job Schedule

- **Expression**: `31 18 * * 1` (Every Monday at 6:31 PM UTC)
- **IST Equivalent**: Tuesday at 12:01 AM IST
- **Timezone**: UTC (for Railway deployment)
- **Frequency**: Weekly on Mondays

## 🧪 Testing the Fixes

### 1. **Deploy to Railway**
```bash
git add .
git commit -m "Fix cron job timezone and add health checks"
git push origin main
```

### 2. **Test New Endpoints**
```bash
# Check cron status
curl https://your-railway-app.railway.app/api/cron-status

# Check data status
curl https://your-railway-app.railway.app/api/data-status

# Test manual refresh
curl -X POST https://your-railway-app.railway.app/api/refresh-fpl-data
```

### 3. **Monitor Next Scheduled Run**
- **Next Run**: Monday, August 18, 2025 at 6:31 PM UTC
- **IST Time**: Tuesday, August 19, 2025 at 12:01 AM IST

## 🔍 Monitoring Cron Job

### Check Railway Logs
1. Go to Railway dashboard
2. Select your project
3. Go to "Deployments" → "View Logs"
4. Look for these log messages:
   - `⏰ Scheduled FPL data refresh: Every Monday at 6:31 PM UTC`
   - `🔄 Starting automated FPL data refresh...`
   - `✅ FPL data refresh completed successfully!`

### Health Check Endpoints
- **Cron Status**: `/api/cron-status`
- **Data Status**: `/api/data-status`
- **Manual Refresh**: `POST /api/refresh-fpl-data`

## 🚀 Next Steps

### 1. **Deploy Changes**
- Push code changes to Railway
- Verify new endpoints work
- Check cron job initialization logs

### 2. **Monitor Next Run**
- Wait for Monday 6:31 PM UTC
- Check Railway logs for execution
- Verify data gets updated

### 3. **Future Improvements**
- Implement true historical data tracking (no DELETE)
- Add cron job execution logging to database
- Add email/Slack notifications for failures
- Implement retry logic for failed runs

## ⚠️ Important Notes

1. **Railway Timezone**: Always use UTC for cron jobs on Railway
2. **Data Strategy**: Current DELETE + INSERT approach will be improved in future
3. **Monitoring**: Use new health check endpoints to monitor cron job status
4. **Manual Refresh**: Available at `/api/refresh-fpl-data` for immediate updates

## 🔗 Related Files

- `server.js` - Main server with cron job configuration
- `refresh-schedule.md` - Original cron job documentation
- `railway.json` - Railway deployment configuration
- `package.json` - Dependencies including node-cron
