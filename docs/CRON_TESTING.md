# Cron Job Testing Guide

This guide explains how to manually trigger and test the cron job that syncs data from Google Sheets and enriches festivals.

## Overview

The cron job performs the following steps:
1. **Sync from Google Sheets** - Fetches latest festival data from the spreadsheet
2. **Delete stale entries** - Removes festivals that no longer exist in the spreadsheet
3. **Enrich with images** - Adds images to new festivals via Google Image Search (RapidAPI)
4. **Enrich with AI** - Adds AI-generated content to new festivals via Gemini API

## API Endpoint

```
POST /api/cron
```

### Authentication

The cron endpoint is protected by a `CRON_SECRET` environment variable. You must include this secret in the `Authorization` header:

```
Authorization: Bearer YOUR_CRON_SECRET
```

## Testing Locally

### 1. Start the Development Server

```bash
npm run dev
```

The server will start at `http://localhost:3000`.

### 2. Trigger the Cron Job with cURL

```bash
curl -X GET http://localhost:3000/api/cron \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Replace `YOUR_CRON_SECRET` with the value from your `.env` file.

### 3. Using PowerShell (Windows)

```powershell
$headers = @{
    "Authorization" = "Bearer YOUR_CRON_SECRET"
}
Invoke-WebRequest -Uri "http://localhost:3000/api/cron" -Headers $headers -Method GET
```

### 4. Using HTTPie

```bash
http GET http://localhost:3000/api/cron Authorization:"Bearer YOUR_CRON_SECRET"
```

## Testing on Vercel (Production)

### Production URL

```
https://videogame-events-api.vercel.app/api/cron
```

### Trigger with cURL

```bash
curl -X GET https://videogame-events-api.vercel.app/api/cron \
  -H "Authorization: Bearer YOUR_PRODUCTION_CRON_SECRET"
```

## Expected Response

### Success Response (200)

```json
{
  "success": true,
  "message": "Sync and enrichment completed successfully",
  "duration": "15.23s",
  "data": {
    "sync": {
      "curatedCount": 214,
      "onTheFenceCount": 3,
      "steamFeaturesCount": 89,
      "totalFestivals": 217,
      "deletedCount": 0,
      "errors": []
    },
    "enrichment": {
      "images": {
        "total": 5,
        "updated": 3,
        "failed": 2
      },
      "ai": {
        "total": 3,
        "enriched": 2,
        "failed": 1
      }
    },
    "timestamp": "2025-12-02T12:00:00.000Z"
  }
}
```

### Unauthorized Response (401)

```json
{
  "error": "Unauthorized"
}
```

### Error Response (500)

```json
{
  "success": false,
  "error": "Error message here",
  "timestamp": "2025-12-02T12:00:00.000Z"
}
```

## Environment Variables Required

Make sure these are set in your `.env` file (local) or Vercel environment variables (production):

| Variable | Description | Required |
|----------|-------------|----------|
| `CRON_SECRET` | Secret for authenticating cron requests | Yes |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `RAPIDAPI_KEY` | RapidAPI key for Google Image Search | For images |
| `GEMINI_API_KEY` | Google Gemini API key for AI enrichment | For AI |
| `AI_ENRICHMENT_VERSION` | Version number for AI enrichment (default: 1) | No |

## Running Individual Components

You can also run individual sync/enrichment scripts manually:

### Sync from Google Sheets only
```bash
npm run sync:sheets
```

### Sync images only
```bash
npm run sync:images
```

### AI enrichment only
```bash
npm run enrich:ai
```

### AI enrichment with options
```bash
# Force re-enrich all
npm run enrich:ai:force

# Retry failed enrichments
npm run enrich:ai:retry

# Generate slugs only
npm run enrich:slugs

# Limit to specific count
npx ts-node src/scripts/aiEnrichFestivals.ts --limit=10

# Only specific category
npx ts-node src/scripts/aiEnrichFestivals.ts --category=curated
```

## Vercel Cron Configuration

The cron is configured in `vercel.json` to run daily at midnight UTC:

```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "0 0 * * *"
    }
  ]
}
```

### Cron Schedule Format
- `0 0 * * *` = Every day at 00:00 UTC
- `0 */6 * * *` = Every 6 hours
- `0 12 * * *` = Every day at 12:00 UTC

## Troubleshooting

### "Unauthorized" Error
- Check that your `CRON_SECRET` matches in both the request header and environment variable
- Ensure the header format is exactly: `Authorization: Bearer YOUR_SECRET`

### Timeout on Vercel
- Vercel has a 10-second timeout for hobby plans, 60 seconds for Pro
- The enrichment limits are set conservatively (5 images, 3 AI) to stay within limits
- If needed, reduce the limits in `api/cron.ts`

### No Festivals Being Enriched
- Check if festivals already have images/AI content
- Run `npm run sync:sheets` first to ensure data is synced
- Check MongoDB for festivals with `enrichment.imageUrl: null` or `aiEnrichment.enrichmentStatus: 'pending'`

## Testing the Test Script

There's also a test script you can run locally:

```bash
npx ts-node src/scripts/testEnrichment.ts
```

This runs a limited enrichment (2 images, 1 AI) to verify everything works.
