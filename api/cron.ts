import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDatabase } from '../src/database';
import { runPostSyncEnrichment } from '../src/services/cronEnrichment';
import { syncFromGoogleSheets } from '../src/services/googleSheetsSync';

// Frontend revalidation URL
const FRONTEND_REVALIDATE_URL = 'https://videogame-festival-front.vercel.app/api/revalidate';

// Cache the database connection
let isConnected = false;

async function ensureDbConnection() {
  if (!isConnected) {
    await connectDatabase();
    isConnected = true;
  }
}

/**
 * Triggers frontend cache revalidation after sync
 * This ensures the frontend displays the latest data
 */
async function triggerFrontendRevalidation(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('\n🔄 Step 3: Triggering frontend revalidation...');
    
    const response = await fetch(FRONTEND_REVALIDATE_URL, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Frontend revalidation triggered successfully');
      return { success: true, message: 'Revalidation triggered' };
    } else {
      const errorText = await response.text();
      console.log(`   ⚠️ Frontend revalidation failed: HTTP ${response.status}`);
      return { success: false, message: `HTTP ${response.status}: ${errorText}` };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.log(`   ⚠️ Frontend revalidation error: ${message}`);
    return { success: false, message };
  }
}

/**
 * Vercel Cron Job Handler for Google Sheets Sync
 * 
 * This endpoint is called automatically by Vercel Cron.
 * It syncs data from the public Google Spreadsheet to MongoDB,
 * then enriches new festivals with images and AI content.
 * 
 * Security: Protected by CRON_SECRET environment variable
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify the request is from Vercel Cron
  const authHeader = req.headers.authorization;
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error('Unauthorized cron request');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('🔄 Cron job started: Google Sheets sync + enrichment');
  const startTime = Date.now();

  try {
    await ensureDbConnection();
    
    // Step 1: Sync from Google Sheets
    console.log('\n📊 Step 1: Syncing from Google Sheets...');
    const syncResult = await syncFromGoogleSheets();
    
    // Step 2: Enrich new festivals with images and AI content
    console.log('\n🎨 Step 2: Enriching new festivals...');
    const enrichmentResult = await runPostSyncEnrichment({
      imageLimit: 5,  // Process up to 5 new images per cron run
      aiLimit: 3,     // Process up to 3 AI enrichments per cron run
    });
    
    // Step 3: Trigger frontend revalidation to refresh cached data
    const revalidationResult = await triggerFrontendRevalidation();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`\n✅ Cron job completed in ${duration}s`);
    console.log(`   Festivals synced: ${syncResult.totalFestivals}`);
    console.log(`   Deleted: ${syncResult.deletedCount}`);
    console.log(`   Images enriched: ${enrichmentResult.images.updated}`);
    console.log(`   AI enriched: ${enrichmentResult.ai.enriched}`);
    console.log(`   Frontend revalidated: ${revalidationResult.success}`);
    
    return res.status(200).json({
      success: true,
      message: 'Sync and enrichment completed successfully',
      duration: `${duration}s`,
      data: {
        sync: {
          curatedCount: syncResult.curatedCount,
          onTheFenceCount: syncResult.onTheFenceCount,
          steamFeaturesCount: syncResult.steamFeaturesCount,
          totalFestivals: syncResult.totalFestivals,
          deletedCount: syncResult.deletedCount,
          errors: syncResult.errors,
        },
        enrichment: {
          images: {
            total: enrichmentResult.images.total,
            updated: enrichmentResult.images.updated,
            failed: enrichmentResult.images.failed,
          },
          ai: {
            total: enrichmentResult.ai.total,
            enriched: enrichmentResult.ai.enriched,
            failed: enrichmentResult.ai.failed,
          }
        },
        revalidation: revalidationResult,
        timestamp: syncResult.timestamp.toISOString()
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Cron job failed:', message);
    
    return res.status(500).json({
      success: false,
      error: message,
      timestamp: new Date().toISOString()
    });
  }
}
