import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDatabase } from '../../src/database';
import { syncFromGoogleSheets } from '../../src/services/googleSheetsSync';

// Cache the database connection
let isConnected = false;

async function ensureDbConnection() {
  if (!isConnected) {
    await connectDatabase();
    isConnected = true;
  }
}

/**
 * Vercel Cron Job Handler for Google Sheets Sync
 * 
 * This endpoint is called automatically by Vercel Cron.
 * It syncs data from the public Google Spreadsheet to MongoDB.
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

  console.log('🔄 Cron job started: Google Sheets sync');
  const startTime = Date.now();

  try {
    await ensureDbConnection();
    
    const result = await syncFromGoogleSheets();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`✅ Cron job completed in ${duration}s`);
    console.log(`   Festivals: ${result.totalFestivals}, Steam: ${result.steamFeaturesCount}`);
    
    return res.status(200).json({
      success: true,
      message: 'Sync completed successfully',
      duration: `${duration}s`,
      data: {
        curatedCount: result.curatedCount,
        onTheFenceCount: result.onTheFenceCount,
        steamFeaturesCount: result.steamFeaturesCount,
        totalFestivals: result.totalFestivals,
        errors: result.errors,
        timestamp: result.timestamp.toISOString()
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
