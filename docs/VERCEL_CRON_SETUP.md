# Vercel Cron Jobs Setup Guide

This guide explains how to set up automatic syncing of Google Sheets data to MongoDB using Vercel Cron Jobs.

## Overview

The cron job automatically syncs data from the public "Worthy festivals for Indie games" Google Spreadsheet to your MongoDB database at regular intervals.

**Default Schedule**: Every 6 hours (`0 */6 * * *`)

---

## Prerequisites

1. ✅ Project deployed to Vercel
2. ✅ MongoDB Atlas database configured
3. ✅ `MONGODB_URI` environment variable set in Vercel

---

## Step 1: Generate a CRON_SECRET

The cron endpoint is protected by a secret to prevent unauthorized access.

### Generate a secure secret:

**Option 1: Using OpenSSL (recommended)**
```bash
openssl rand -base64 32
```

**Option 2: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Option 3: Online generator**
Use a secure password generator to create a 32+ character random string.

**Example output:**
```
K7x9mPqR2sT5vW8yA3bC6dE9fG2hJ5kL8mN1pQ4rS7uV0wX3
```

---

## Step 2: Add Environment Variable in Vercel

1. Go to your project in the [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Settings** → **Environment Variables**
3. Add a new variable:

| Name | Value |
|------|-------|
| `CRON_SECRET` | `your-generated-secret-here` |

4. Select environments: ✅ Production, ✅ Preview (optional)
5. Click **Save**

---

## Step 3: Deploy

Push your changes to trigger a new deployment:

```bash
git add .
git commit -m "Add cron job for Google Sheets sync"
git push
```

Vercel will automatically detect the cron configuration in `vercel.json`.

---

## Step 4: Verify Cron Job Setup

### Check in Vercel Dashboard:

1. Go to your project in Vercel
2. Click **Settings** → **Crons**
3. You should see your cron job listed:
   - **Path**: `/api/cron`
   - **Schedule**: `0 */6 * * *` (Every 6 hours)

### Manual Test:

You can manually trigger the cron job using curl:

```bash
curl -X GET https://YOUR-PROJECT.vercel.app/api/cron \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Expected response:**
```json
{
  "success": true,
  "message": "Sync completed successfully",
  "duration": "3.45s",
  "data": {
    "curatedCount": 210,
    "onTheFenceCount": 6,
    "steamFeaturesCount": 90,
    "totalFestivals": 216,
    "errors": [],
    "timestamp": "2025-11-28T12:00:00.000Z"
  }
}
```

---

## Cron Schedule Reference

The schedule uses standard cron syntax: `minute hour day month weekday`

| Schedule | Cron Expression | Description |
|----------|-----------------|-------------|
| Every 6 hours | `0 */6 * * *` | **Default** - Runs at 00:00, 06:00, 12:00, 18:00 UTC |
| Every hour | `0 * * * *` | More frequent updates |
| Every 12 hours | `0 */12 * * *` | Twice daily |
| Daily at midnight | `0 0 * * *` | Once per day |
| Daily at 6 AM UTC | `0 6 * * *` | Morning sync |
| Every Monday at 9 AM | `0 9 * * 1` | Weekly |

### Change the Schedule:

Edit `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-sheets",
      "schedule": "0 * * * *"  // Change to hourly
    }
  ]
}
```

---

## Vercel Cron Limits

| Plan | Cron Jobs | Min Interval | Max Duration |
|------|-----------|--------------|--------------|
| Hobby (Free) | 2 | 1 day | 10 seconds |
| Pro | 40 | 1 minute | 60 seconds |
| Enterprise | Unlimited | 1 minute | 300 seconds |

⚠️ **Note**: On the Hobby (free) plan, cron jobs can only run once per day minimum.

---

## Monitoring & Logs

### View Cron Execution Logs:

1. Go to Vercel Dashboard → Your Project
2. Click **Logs** tab
3. Filter by function: `api/cron/sync-sheets`

### Check Cron History:

1. Go to **Settings** → **Crons**
2. Click on your cron job to see execution history

---

## Troubleshooting

### "Unauthorized" Error (401)

- Verify `CRON_SECRET` is set correctly in Vercel Environment Variables
- Make sure the secret matches exactly (no extra spaces)
- Redeploy after adding the environment variable

### "Function Timeout" Error

- Vercel functions have execution time limits
- The sync is optimized for speed, but large datasets may timeout
- Consider upgrading to Pro plan for longer execution times (60s)

### "Database Connection" Error

- Verify `MONGODB_URI` is set correctly
- Check MongoDB Atlas IP whitelist (should allow 0.0.0.0/0 for Vercel)
- Verify database cluster is running

### Cron Not Running

- Check Vercel plan limits (Hobby = 1/day minimum)
- Verify `vercel.json` syntax is correct
- Check deployment logs for errors

---

## Security Best Practices

1. **Never commit `CRON_SECRET` to git** - Always use environment variables
2. **Use a strong secret** - At least 32 characters, randomly generated
3. **Rotate secrets periodically** - Update the secret every few months
4. **Monitor execution logs** - Check for unusual activity

---

## File Structure

```
api/
├── index.ts              # Main API handler
└── cron/
    └── sync-sheets.ts    # Cron job handler

vercel.json               # Cron configuration
```

---

## Environment Variables Summary

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | ✅ Yes | MongoDB connection string |
| `CRON_SECRET` | ✅ Yes | Secret for cron authentication |
| `NODE_ENV` | No | Set to `production` |

---

## Quick Reference

```bash
# Test cron manually
curl -X GET https://YOUR-PROJECT.vercel.app/api/cron/sync-sheets \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Check sync status via API
curl https://YOUR-PROJECT.vercel.app/api/sync/last

# View cron logs in Vercel CLI
vercel logs --follow
```

---

## Additional Resources

- [Vercel Cron Jobs Documentation](https://vercel.com/docs/cron-jobs)
- [Cron Expression Generator](https://crontab.guru/)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
