# FPL Data Refresh Schedule

## 🕐 Automated Refresh Schedule

**Frequency**: Every Tuesday at 12:01 AM IST (Indian Standard Time)  
**Timezone**: Asia/Kolkata (UTC+5:30)  
**UTC Time**: Monday 6:31 PM UTC (previous day)

## 📊 What Gets Updated

- **Players**: All 666+ FPL players with latest stats (INSERT only - preserves historical data)
- **Teams**: 20 Premier League teams (UPSERT - updates existing)
- **Positions**: 4 player positions (UPSERT - updates existing)
- **All Statistics**: 40+ data points per player including:
  - Form, points, goals, assists
  - Expected goals, creativity, threat
  - ICT index, bonus points, cards
  - Per-90 statistics

## 📈 Historical Data Strategy

- **Players Table**: INSERT only - creates new record each Tuesday
- **Historical Tracking**: Each player can have multiple records over time
- **Trend Analysis**: Compare performance across different time periods
- **Data Retention**: All historical snapshots preserved for analysis

## 🔧 Available Endpoints

### Check Data Status
```bash
curl http://localhost:3001/api/data-status
```

### Manual Refresh (On-Demand)
```bash
curl -X POST http://localhost:3001/api/refresh-fpl-data
```

### View Stored Data (Latest Only)
```bash
curl http://localhost:3001/api/stored-fpl-data
```

### View Player Historical Data
```bash
curl http://localhost:3001/api/player-history/381
```

## ⚙️ Configuration

The cron job is configured in `server.js`:
```javascript
cron.schedule('31 18 * * 1', () => {
  refreshFPLData();
}, {
  scheduled: true,
  timezone: "Asia/Kolkata"
});
```

## 🚀 How It Works

1. **Automatic**: Runs every Tuesday at 12:01 AM IST
2. **Fetches**: Fresh data from FPL official API
3. **Teams/Positions**: UPSERT - updates existing records
4. **Players**: INSERT only - creates new historical snapshots
5. **Logs**: Console output with success/error messages
6. **Error Handling**: Graceful failure with retry on next schedule

## 📝 Logs

The server logs will show:
- `🔄 Starting automated FPL data refresh...`
- `✅ FPL data refresh completed successfully! Updated X players`
- `❌ Error during automated FPL data refresh:` (if errors occur)

## 🛠️ Troubleshooting

If the automated refresh fails:
1. Check server logs for error messages
2. Use manual refresh endpoint to test
3. Verify database connection
4. Check FPL API availability

## 📅 Next Refresh

The system will automatically refresh every Tuesday at 12:01 AM IST.
You can also trigger manual refreshes anytime using the API endpoint. 