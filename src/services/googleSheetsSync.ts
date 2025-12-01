/**
 * Google Sheets Sync Service
 * 
 * This service fetches data directly from the public "Worthy festivals for Indie games" 
 * Google Spreadsheet and syncs it to MongoDB in-memory (no filesystem operations).
 * 
 * Compatible with serverless environments like Vercel.
 * 
 * Spreadsheet: https://docs.google.com/spreadsheets/d/1NGseGNHv6Tth5e_yuRWzeVczQkzqXXGF4k16IsvyiTE
 */

import { parse } from 'csv-parse/sync';
import fetch from 'node-fetch';
import { Festival, SteamFeature, SyncLog } from '../models';

// The spreadsheet ID from the URL
const SPREADSHEET_ID = '1NGseGNHv6Tth5e_yuRWzeVczQkzqXXGF4k16IsvyiTE';

// Sheet configurations with their GIDs
// GID can be found in the URL: ...edit#gid=XXXXXX
const SHEETS = {
  curated: {
    name: 'Curated',
    gid: '0',
    description: 'Main list of verified festivals'
  },
  onTheFence: {
    name: 'On the Fence',
    gid: '857302855',
    description: 'Festivals under consideration'
  },
  steamTracker: {
    name: 'Steam feature tracker',
    gid: '2061623943',
    description: 'Steam sale/featuring opportunities'
  }
} as const;

// Type definitions
interface SheetSyncResult {
  success: boolean;
  count: number;
  error?: string;
}

interface FullSyncResult {
  curatedCount: number;
  onTheFenceCount: number;
  steamFeaturesCount: number;
  totalFestivals: number;
  errors: string[];
  timestamp: Date;
}

// Helper functions
function parseBoolean(value: string): boolean {
  return value?.toUpperCase() === 'TRUE';
}

function parseNumber(value: string): number | null {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
}

function cleanString(value: string | undefined): string {
  if (!value) return '';
  return value.trim();
}

/**
 * Builds the CSV export URL for a Google Sheet
 */
function buildExportUrl(spreadsheetId: string, gid: string): string {
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
}

/**
 * Fetches CSV content from Google Sheets export URL
 */
async function fetchSheetAsCSV(gid: string): Promise<string> {
  const url = buildExportUrl(SPREADSHEET_ID, gid);
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    redirect: 'follow'
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.text();
}

/**
 * Parses and syncs the Curated festivals sheet
 */
async function syncCuratedSheet(): Promise<SheetSyncResult> {
  try {
    console.log(`  📥 Fetching: ${SHEETS.curated.name}...`);
    const csvContent = await fetchSheetAsCSV(SHEETS.curated.gid);
    
    // Skip the first 2 info rows
    const lines = csvContent.split('\n');
    const dataLines = lines.slice(2).join('\n');
    
    const records = parse(dataLines, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      relax_quotes: true,
    });

    const festivals = records
      .filter((row: Record<string, string>) => {
        const name = row['Festival'] || row[''] || Object.values(row)[0];
        return name && typeof name === 'string' && name.trim() !== '' && 
               !name.includes('OPEN') && !name.includes('CLOSING');
      })
      .map((row: Record<string, string>) => ({
        name: cleanString(row['Festival'] || Object.values(row)[0] as string),
        type: cleanString(row['Type']),
        when: cleanString(row['When']),
        deadline: cleanString(row['Deadline (YYYY-MM-DD)']) || null,
        submissionOpen: parseBoolean(row['Submission Open']),
        price: cleanString(row['Price']),
        hasSteamPage: cleanString(row['Steam page']),
        worthIt: cleanString(row['Was it worth the price?\nOpinions are biased (check comments)']),
        comments: cleanString(row['Comments']),
        eventOfficialPage: cleanString(row['Event official page']),
        latestSteamPage: cleanString(row['Latest Steam page']),
        daysToSubmit: parseNumber(row['Days to submit']),
        category: 'curated' as const,
      }))
      .filter((f: { name: string }) => f.name && f.name.length > 0);

    // Upsert festivals
    let syncedCount = 0;
    for (const festival of festivals) {
      await Festival.findOneAndUpdate(
        { name: festival.name, category: 'curated' },
        festival,
        { upsert: true, new: true }
      );
      syncedCount++;
    }

    console.log(`  ✅ Synced ${syncedCount} curated festivals`);
    return { success: true, count: syncedCount };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`  ❌ Error syncing curated: ${message}`);
    return { success: false, count: 0, error: message };
  }
}

/**
 * Parses and syncs the On the Fence festivals sheet
 */
async function syncOnTheFenceSheet(): Promise<SheetSyncResult> {
  try {
    console.log(`  📥 Fetching: ${SHEETS.onTheFence.name}...`);
    const csvContent = await fetchSheetAsCSV(SHEETS.onTheFence.gid);
    
    // Skip the first 2 info rows
    const lines = csvContent.split('\n');
    const dataLines = lines.slice(2).join('\n');
    
    const records = parse(dataLines, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      relax_quotes: true,
    });

    const festivals = records
      .filter((row: Record<string, string>) => {
        const name = row['Festival'] || Object.values(row)[0];
        return name && typeof name === 'string' && name.trim() !== '';
      })
      .map((row: Record<string, string>) => ({
        name: cleanString(row['Festival'] || Object.values(row)[0] as string),
        type: cleanString(row['Type']),
        when: cleanString(row['When']),
        deadline: cleanString(row['Deadline (YYYY-MM-DD)']) || null,
        submissionOpen: parseBoolean(row['Submission Open']),
        price: cleanString(row['Price']),
        hasSteamPage: cleanString(row['Steam page']),
        worthIt: cleanString(row['Was it worth the price?\nOpinions are biased (check comments)']),
        comments: cleanString(row['Comments']),
        eventOfficialPage: cleanString(row['Event official page']),
        latestSteamPage: cleanString(row['Latest Steam page']),
        daysToSubmit: parseNumber(row['Days to submit']),
        category: 'on-the-fence' as const,
      }))
      .filter((f: { name: string }) => f.name && f.name.length > 0);

    // Upsert festivals
    let syncedCount = 0;
    for (const festival of festivals) {
      await Festival.findOneAndUpdate(
        { name: festival.name, category: 'on-the-fence' },
        festival,
        { upsert: true, new: true }
      );
      syncedCount++;
    }

    console.log(`  ✅ Synced ${syncedCount} on-the-fence festivals`);
    return { success: true, count: syncedCount };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`  ❌ Error syncing on-the-fence: ${message}`);
    return { success: false, count: 0, error: message };
  }
}

/**
 * Parses and syncs the Steam feature tracker sheet
 */
async function syncSteamTrackerSheet(): Promise<SheetSyncResult> {
  try {
    console.log(`  📥 Fetching: ${SHEETS.steamTracker.name}...`);
    const csvContent = await fetchSheetAsCSV(SHEETS.steamTracker.gid);
    
    // Parse with custom handling for complex headers
    const lines = csvContent.split('\n');
    const dataLines = lines.slice(1); // Skip header

    const steamFeatures: Array<{
      festivalName: string;
      year2021: string;
      year2022: string;
      year2023: string;
      details2021: string;
      details2022: string;
      details2023: string;
    }> = [];

    for (const line of dataLines) {
      const cols = line.split(',').map((c) => c.trim());
      
      if (cols[0] && cols[0] !== '' && cols[0] !== 'Festival') {
        steamFeatures.push({
          festivalName: cleanString(cols[0]),
          year2021: cleanString(cols[1]),
          year2022: cleanString(cols[2]),
          year2023: cleanString(cols[3]),
          details2021: cleanString(cols[4]),
          details2022: cleanString(cols[5]),
          details2023: cleanString(cols[6]),
        });
      }
    }

    // Upsert steam features
    let syncedCount = 0;
    for (const feature of steamFeatures) {
      await SteamFeature.findOneAndUpdate(
        { festivalName: feature.festivalName },
        feature,
        { upsert: true, new: true }
      );
      syncedCount++;
    }

    console.log(`  ✅ Synced ${syncedCount} Steam features`);
    return { success: true, count: syncedCount };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`  ❌ Error syncing steam tracker: ${message}`);
    return { success: false, count: 0, error: message };
  }
}

/**
 * Syncs all sheets from Google Sheets directly to MongoDB
 * No filesystem operations - works in serverless environments
 */
export async function syncFromGoogleSheets(): Promise<FullSyncResult> {
  console.log('\n🔄 Syncing from Google Sheets to MongoDB...');
  console.log(`📊 Spreadsheet ID: ${SPREADSHEET_ID}\n`);

  const errors: string[] = [];
  const timestamp = new Date();
  
  // Sync Curated sheet
  const curatedResult = await syncCuratedSheet();
  if (!curatedResult.success && curatedResult.error) {
    errors.push(`Curated: ${curatedResult.error}`);
  }

  // Sync On the Fence sheet
  const onTheFenceResult = await syncOnTheFenceSheet();
  if (!onTheFenceResult.success && onTheFenceResult.error) {
    errors.push(`On the Fence: ${onTheFenceResult.error}`);
  }

  // Sync Steam Tracker sheet
  const steamResult = await syncSteamTrackerSheet();
  if (!steamResult.success && steamResult.error) {
    errors.push(`Steam Tracker: ${steamResult.error}`);
  }

  // Log the sync operation
  const result: FullSyncResult = {
    curatedCount: curatedResult.count,
    onTheFenceCount: onTheFenceResult.count,
    steamFeaturesCount: steamResult.count,
    totalFestivals: curatedResult.count + onTheFenceResult.count,
    errors,
    timestamp
  };

  // Create sync log
  await SyncLog.create({
    syncedAt: timestamp,
    filesProcessed: ['Google Sheets - Curated', 'Google Sheets - On the Fence', 'Google Sheets - Steam Tracker'],
    festivalsCount: result.totalFestivals,
    steamFeaturesCount: result.steamFeaturesCount,
    status: errors.length === 0 ? 'success' : errors.length < 3 ? 'partial' : 'failed',
    syncErrors: errors,
  });

  console.log('\n📊 Sync Summary:');
  console.log(`   Curated festivals: ${result.curatedCount}`);
  console.log(`   On-the-fence festivals: ${result.onTheFenceCount}`);
  console.log(`   Steam features: ${result.steamFeaturesCount}`);
  console.log(`   Total festivals: ${result.totalFestivals}`);
  
  if (errors.length > 0) {
    console.log(`\n⚠️ Errors: ${errors.length}`);
    errors.forEach(e => console.log(`   - ${e}`));
  } else {
    console.log('\n✅ All sheets synced successfully!');
  }

  return result;
}

/**
 * Gets the spreadsheet configuration (for API info endpoints)
 */
export function getSpreadsheetConfig() {
  return {
    spreadsheetId: SPREADSHEET_ID,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}`,
    sheets: SHEETS
  };
}
