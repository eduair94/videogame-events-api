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
  syncedNames: string[];
  error?: string;
}

interface FullSyncResult {
  curatedCount: number;
  onTheFenceCount: number;
  steamFeaturesCount: number;
  totalFestivals: number;
  deletedCount: number;
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
 * Calculate days until a deadline date
 */
function calculateDaysUntil(deadlineStr: string | null): number | null {
  if (!deadlineStr) return null;
  
  // Parse date in YYYY-MM-DD format
  const deadline = new Date(deadlineStr);
  if (isNaN(deadline.getTime())) return null;
  
  const today = new Date();
  // Reset time to start of day for accurate day calculation
  today.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);
  
  const diffTime = deadline.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Builds the CSV export URL for a Google Sheet
 */
function buildExportUrl(spreadsheetId: string, gid: string): string {
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
}

/**
 * Fetches CSV content from Google Sheets export URL
 * Adds cache-busting parameter to ensure we get the latest version
 */
async function fetchSheetAsCSV(gid: string): Promise<string> {
  // Add timestamp to bust any caching
  const cacheBuster = Date.now();
  const url = `${buildExportUrl(SPREADSHEET_ID, gid)}&_=${cacheBuster}`;
  
  console.log(`    🌐 Fetching URL: ${url}`);
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    redirect: 'follow'
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const content = await response.text();
  console.log(`    📄 Received ${content.length} bytes`);
  
  return content;
}

/**
 * Parses and syncs the Curated festivals sheet
 */
async function syncCuratedSheet(syncTimestamp: Date): Promise<SheetSyncResult> {
  const syncedNames: string[] = [];
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

    // Log available columns from first record
    if (records.length > 0) {
      console.log(`    📋 Available columns: ${Object.keys(records[0]).join(', ')}`);
    }

    const festivalsRaw = records
      .filter((row: Record<string, string>) => {
        const name = row['Festival'] || row[''] || Object.values(row)[0];
        return name && typeof name === 'string' && name.trim() !== '' && 
               !name.includes('OPEN') && !name.includes('CLOSING');
      })
      .map((row: Record<string, string>) => {
        const name = cleanString(row['Festival'] || Object.values(row)[0] as string);
        const daysToSubmitRaw = row['Days to submit'];
        const submissionOpenRaw = row['Submission Open'];
        const deadlineRaw = row['Deadline (YYYY-MM-DD)'];
        
        const parsedDaysToSubmit = parseNumber(daysToSubmitRaw);
        const deadlineStr = cleanString(deadlineRaw) || null;
        const calculatedDays = calculateDaysUntil(deadlineStr);
        
        // Debug log for each festival
        console.log(`    🎮 ${name}:`);
        console.log(`       - Days to submit (raw): "${daysToSubmitRaw}" → parsed: ${parsedDaysToSubmit}`);
        console.log(`       - Deadline (raw): "${deadlineRaw}" → cleaned: "${deadlineStr}"`);
        console.log(`       - Calculated days from deadline: ${calculatedDays}`);
        if (deadlineStr && parsedDaysToSubmit !== null && calculatedDays !== null) {
          const diff = Math.abs(parsedDaysToSubmit - calculatedDays);
          if (diff <= 1) {
            console.log(`       ✅ CONSISTENT: Sheet says ${parsedDaysToSubmit}, calculated ${calculatedDays} (diff: ${diff})`);
          } else {
            console.log(`       ⚠️ MISMATCH: Sheet says ${parsedDaysToSubmit}, calculated ${calculatedDays} (diff: ${diff})`);
          }
        }
        console.log(`       - Submission Open (raw): "${submissionOpenRaw}" → parsed: ${parseBoolean(submissionOpenRaw)}`);
        
        return {
          name,
          type: cleanString(row['Type']),
          when: cleanString(row['When']),
          deadline: deadlineStr,
          submissionOpen: parseBoolean(submissionOpenRaw),
          price: cleanString(row['Price']),
          hasSteamPage: cleanString(row['Steam page']),
          worthIt: cleanString(row['Was it worth the price?\nOpinions are biased (check comments)']),
          comments: cleanString(row['Comments']),
          eventOfficialPage: cleanString(row['Event official page']),
          latestSteamPage: cleanString(row['Latest Steam page']),
          daysToSubmit: parsedDaysToSubmit,
          category: 'curated' as const,
          lastSyncedAt: syncTimestamp,
        };
      })
      .filter((f: { name: string }) => f.name && f.name.length > 0);

    // Deduplicate by name - keep the first occurrence (which is typically the most recent in the sheet)
    const seenNames = new Set<string>();
    const festivals = festivalsRaw.filter((f: { name: string }) => {
      if (seenNames.has(f.name)) {
        console.log(`    ⚠️ Skipping duplicate: "${f.name}"`);
        return false;
      }
      seenNames.add(f.name);
      return true;
    });

    console.log(`    📊 After deduplication: ${festivals.length} unique festivals (${festivalsRaw.length - festivals.length} duplicates removed)`);

    // Upsert festivals and track synced names
    let syncedCount = 0;
    for (const festival of festivals) {
      try {
        await Festival.findOneAndUpdate(
          { name: festival.name, category: 'curated' },
          festival,
          { upsert: true, new: true }
        );
        syncedNames.push(festival.name);
        syncedCount++;
      } catch (upsertError) {
        const errMsg = upsertError instanceof Error ? upsertError.message : 'Unknown error';
        console.error(`    ❌ Failed to upsert "${festival.name}": ${errMsg}`);
        // Continue with next festival instead of failing completely
      }
    }

    console.log(`  ✅ Synced ${syncedCount} curated festivals`);
    return { success: true, count: syncedCount, syncedNames };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`  ❌ Error syncing curated: ${message}`);
    return { success: false, count: 0, syncedNames, error: message };
  }
}

/**
 * Parses and syncs the On the Fence festivals sheet
 */
async function syncOnTheFenceSheet(syncTimestamp: Date): Promise<SheetSyncResult> {
  const syncedNames: string[] = [];
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

    // Log available columns from first record
    if (records.length > 0) {
      console.log(`    📋 Available columns: ${Object.keys(records[0]).join(', ')}`);
    }

    const festivalsRaw = records
      .filter((row: Record<string, string>) => {
        const name = row['Festival'] || Object.values(row)[0];
        return name && typeof name === 'string' && name.trim() !== '';
      })
      .map((row: Record<string, string>) => {
        const name = cleanString(row['Festival'] || Object.values(row)[0] as string);
        const daysToSubmitRaw = row['Days to submit'];
        const submissionOpenRaw = row['Submission Open'];
        const deadlineRaw = row['Deadline (YYYY-MM-DD)'];
        
        const parsedDaysToSubmit = parseNumber(daysToSubmitRaw);
        const deadlineStr = cleanString(deadlineRaw) || null;
        const calculatedDays = calculateDaysUntil(deadlineStr);
        
        // Debug log for each festival
        console.log(`    🎮 ${name}:`);
        console.log(`       - Days to submit (raw): "${daysToSubmitRaw}" → parsed: ${parsedDaysToSubmit}`);
        console.log(`       - Deadline (raw): "${deadlineRaw}" → cleaned: "${deadlineStr}"`);
        console.log(`       - Calculated days from deadline: ${calculatedDays}`);
        if (deadlineStr && parsedDaysToSubmit !== null && calculatedDays !== null) {
          const diff = Math.abs(parsedDaysToSubmit - calculatedDays);
          if (diff <= 1) {
            console.log(`       ✅ CONSISTENT: Sheet says ${parsedDaysToSubmit}, calculated ${calculatedDays} (diff: ${diff})`);
          } else {
            console.log(`       ⚠️ MISMATCH: Sheet says ${parsedDaysToSubmit}, calculated ${calculatedDays} (diff: ${diff})`);
          }
        }
        console.log(`       - Submission Open (raw): "${submissionOpenRaw}" → parsed: ${parseBoolean(submissionOpenRaw)}`);
        
        return {
          name,
          type: cleanString(row['Type']),
          when: cleanString(row['When']),
          deadline: deadlineStr,
          submissionOpen: parseBoolean(submissionOpenRaw),
          price: cleanString(row['Price']),
          hasSteamPage: cleanString(row['Steam page']),
          worthIt: cleanString(row['Was it worth the price?\nOpinions are biased (check comments)']),
          comments: cleanString(row['Comments']),
          eventOfficialPage: cleanString(row['Event official page']),
          latestSteamPage: cleanString(row['Latest Steam page']),
          daysToSubmit: parsedDaysToSubmit,
          category: 'on-the-fence' as const,
          lastSyncedAt: syncTimestamp,
        };
      })
      .filter((f: { name: string }) => f.name && f.name.length > 0);

    // Deduplicate by name - keep the first occurrence (which is typically the most recent in the sheet)
    const seenNames = new Set<string>();
    const festivals = festivalsRaw.filter((f: { name: string }) => {
      if (seenNames.has(f.name)) {
        console.log(`    ⚠️ Skipping duplicate: "${f.name}"`);
        return false;
      }
      seenNames.add(f.name);
      return true;
    });

    console.log(`    📊 After deduplication: ${festivals.length} unique festivals (${festivalsRaw.length - festivals.length} duplicates removed)`);

    // Upsert festivals and track synced names
    let syncedCount = 0;
    for (const festival of festivals) {
      try {
        await Festival.findOneAndUpdate(
          { name: festival.name, category: 'on-the-fence' },
          festival,
          { upsert: true, new: true }
        );
        syncedNames.push(festival.name);
        syncedCount++;
      } catch (upsertError) {
        const errMsg = upsertError instanceof Error ? upsertError.message : 'Unknown error';
        console.error(`    ❌ Failed to upsert "${festival.name}": ${errMsg}`);
        // Continue with next festival instead of failing completely
      }
    }

    console.log(`  ✅ Synced ${syncedCount} on-the-fence festivals`);
    return { success: true, count: syncedCount, syncedNames };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`  ❌ Error syncing on-the-fence: ${message}`);
    return { success: false, count: 0, syncedNames, error: message };
  }
}

/**
 * Parses and syncs the Steam feature tracker sheet
 * Note: Steam features don't need deletion tracking as they're keyed by festivalName
 */
async function syncSteamTrackerSheet(): Promise<SheetSyncResult> {
  const syncedNames: string[] = [];
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
      syncedNames.push(feature.festivalName);
      syncedCount++;
    }

    console.log(`  ✅ Synced ${syncedCount} Steam features`);
    return { success: true, count: syncedCount, syncedNames };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`  ❌ Error syncing steam tracker: ${message}`);
    return { success: false, count: 0, syncedNames, error: message };
  }
}

/**
 * Syncs all sheets from Google Sheets directly to MongoDB
 * No filesystem operations - works in serverless environments
 * 
 * After syncing, removes any festivals that weren't updated in this sync
 * (i.e., festivals that were deleted from the spreadsheet)
 */
export async function syncFromGoogleSheets(): Promise<FullSyncResult> {
  console.log('\n🔄 Syncing from Google Sheets to MongoDB...');
  console.log(`📊 Spreadsheet ID: ${SPREADSHEET_ID}\n`);

  const errors: string[] = [];
  const timestamp = new Date();
  let deletedCount = 0;
  
  // Sync Curated sheet
  const curatedResult = await syncCuratedSheet(timestamp);
  if (!curatedResult.success && curatedResult.error) {
    errors.push(`Curated: ${curatedResult.error}`);
  }

  // Sync On the Fence sheet
  const onTheFenceResult = await syncOnTheFenceSheet(timestamp);
  if (!onTheFenceResult.success && onTheFenceResult.error) {
    errors.push(`On the Fence: ${onTheFenceResult.error}`);
  }

  // Sync Steam Tracker sheet
  const steamResult = await syncSteamTrackerSheet();
  if (!steamResult.success && steamResult.error) {
    errors.push(`Steam Tracker: ${steamResult.error}`);
  }

  // Delete festivals that weren't synced in this run (removed from spreadsheet)
  // Only delete if we successfully synced at least one festival from each category
  if (curatedResult.success && curatedResult.count > 0) {
    const staleCurated = await Festival.find({
      category: 'curated',
      $or: [
        { lastSyncedAt: { $lt: timestamp } },
        { lastSyncedAt: { $exists: false } },
        { lastSyncedAt: null }
      ]
    });
    
    if (staleCurated.length > 0) {
      console.log(`\n🗑️ Removing ${staleCurated.length} stale curated festivals:`);
      for (const fest of staleCurated) {
        console.log(`   - ${fest.name} (last synced: ${fest.lastSyncedAt || 'never'})`);
      }
      
      const deleteResult = await Festival.deleteMany({
        category: 'curated',
        $or: [
          { lastSyncedAt: { $lt: timestamp } },
          { lastSyncedAt: { $exists: false } },
          { lastSyncedAt: null }
        ]
      });
      deletedCount += deleteResult.deletedCount;
    }
  }

  if (onTheFenceResult.success && onTheFenceResult.count > 0) {
    const staleOnTheFence = await Festival.find({
      category: 'on-the-fence',
      $or: [
        { lastSyncedAt: { $lt: timestamp } },
        { lastSyncedAt: { $exists: false } },
        { lastSyncedAt: null }
      ]
    });
    
    if (staleOnTheFence.length > 0) {
      console.log(`\n🗑️ Removing ${staleOnTheFence.length} stale on-the-fence festivals:`);
      for (const fest of staleOnTheFence) {
        console.log(`   - ${fest.name} (last synced: ${fest.lastSyncedAt || 'never'})`);
      }
      
      const deleteResult = await Festival.deleteMany({
        category: 'on-the-fence',
        $or: [
          { lastSyncedAt: { $lt: timestamp } },
          { lastSyncedAt: { $exists: false } },
          { lastSyncedAt: null }
        ]
      });
      deletedCount += deleteResult.deletedCount;
    }
  }

  // Log the sync operation
  const result: FullSyncResult = {
    curatedCount: curatedResult.count,
    onTheFenceCount: onTheFenceResult.count,
    steamFeaturesCount: steamResult.count,
    totalFestivals: curatedResult.count + onTheFenceResult.count,
    deletedCount,
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
  console.log(`   Deleted stale entries: ${result.deletedCount}`);
  
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
