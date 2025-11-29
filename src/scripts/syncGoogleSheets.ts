/**
 * Google Sheets to CSV Sync Script
 * 
 * This script fetches data from the public "Worthy festivals for Indie games" 
 * Google Spreadsheet and saves it as CSV files locally.
 * 
 * Spreadsheet: https://docs.google.com/spreadsheets/d/1NGseGNHv6Tth5e_yuRWzeVczQkzqXXGF4k16IsvyiTE
 * 
 * The spreadsheet contains three sheets:
 * 1. Curated - Main list of verified festivals (gid=0)
 * 2. On the Fence - Festivals under consideration (gid=1513498498)
 * 3. Steam feature tracker - Steam sale/featuring opportunities (gid=1458498498)
 * 
 * Note: We use direct CSV export URLs instead of the public-google-sheets-parser
 * library because the spreadsheet has complex headers with merged cells that
 * the parser doesn't handle correctly.
 */

import dotenv from 'dotenv';
import * as fs from 'fs';
import fetch from 'node-fetch';
import * as path from 'path';

dotenv.config();

// The spreadsheet ID from the URL
const SPREADSHEET_ID = '1NGseGNHv6Tth5e_yuRWzeVczQkzqXXGF4k16IsvyiTE';

// Output directory for CSV files
const OUTPUT_DIR = process.env.CSV_DATA_PATH || './downloads';

// Sheet configurations with their GIDs and corresponding output file names
// GID can be found in the URL: ...edit#gid=XXXXXX
const SHEETS = [
  {
    name: 'Curated',
    gid: '0',
    outputFile: 'Worthy festivals for Indie games - Curated.csv',
    description: 'Main list of verified festivals'
  },
  {
    name: 'On the Fence',
    gid: '857302855',
    outputFile: 'Worthy festivals for Indie games - On the Fence.csv',
    description: 'Festivals under consideration'
  },
  {
    name: 'Steam feature tracker',
    gid: '2061623943',
    outputFile: 'Worthy festivals for Indie games - Steam feature tracker.csv',
    description: 'Steam sale/featuring opportunities'
  }
];

/**
 * Builds the CSV export URL for a Google Sheet
 */
function buildExportUrl(spreadsheetId: string, gid: string): string {
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
}

/**
 * Fetches CSV content from Google Sheets export URL
 */
async function fetchSheetAsCSV(
  spreadsheetId: string,
  gid: string
): Promise<string | null> {
  const url = buildExportUrl(spreadsheetId, gid);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      redirect: 'follow'
    });

    if (!response.ok) {
      console.log(`  ⚠️ HTTP ${response.status}: ${response.statusText}`);
      return null;
    }

    const csvContent = await response.text();
    return csvContent;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.log(`  ⚠️ Fetch error: ${message}`);
    return null;
  }
}

/**
 * Counts rows in CSV content (excluding empty rows)
 */
function countCSVRows(csvContent: string): number {
  const lines = csvContent.split('\n').filter(line => line.trim() !== '');
  return Math.max(0, lines.length - 1); // Subtract header row
}

/**
 * Fetches a sheet and saves it as CSV
 */
async function fetchAndSaveSheet(
  spreadsheetId: string,
  sheetConfig: typeof SHEETS[0],
  outputPath: string
): Promise<{ success: boolean; rowCount: number; error?: string }> {
  try {
    console.log(`  📥 Fetching sheet: ${sheetConfig.name} (gid=${sheetConfig.gid})...`);
    
    const csvContent = await fetchSheetAsCSV(spreadsheetId, sheetConfig.gid);
    
    if (!csvContent) {
      return { success: false, rowCount: 0, error: 'Failed to fetch sheet' };
    }

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write CSV file
    fs.writeFileSync(outputPath, csvContent, 'utf-8');
    
    const rowCount = countCSVRows(csvContent);
    console.log(`  ✅ Saved ${rowCount} rows to: ${path.basename(outputPath)}`);
    
    return { success: true, rowCount };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`  ❌ Error: ${message}`);
    return { success: false, rowCount: 0, error: message };
  }
}

/**
 * Main sync function - fetches all sheets and saves as CSV
 */
async function syncFromGoogleSheets(): Promise<void> {
  console.log('🔄 Google Sheets to CSV Sync');
  console.log('============================\n');
  console.log(`📊 Spreadsheet ID: ${SPREADSHEET_ID}`);
  console.log(`📁 Output directory: ${path.resolve(OUTPUT_DIR)}\n`);

  const results: Array<{
    sheet: string;
    success: boolean;
    rowCount: number;
    error?: string;
  }> = [];

  for (const sheet of SHEETS) {
    const outputPath = path.join(OUTPUT_DIR, sheet.outputFile);
    console.log(`\n📋 ${sheet.name} (${sheet.description})`);
    
    const result = await fetchAndSaveSheet(SPREADSHEET_ID, sheet, outputPath);
    results.push({
      sheet: sheet.name,
      ...result
    });

    // Small delay between requests to be nice to Google's servers
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Print summary
  console.log('\n============================');
  console.log('📊 Sync Summary\n');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  successful.forEach(r => {
    console.log(`   - ${r.sheet}: ${r.rowCount} rows`);
  });
  
  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}/${results.length}`);
    failed.forEach(r => {
      console.log(`   - ${r.sheet}: ${r.error}`);
    });
  }

  const totalRows = successful.reduce((sum, r) => sum + r.rowCount, 0);
  console.log(`\n📈 Total rows synced: ${totalRows}`);
  console.log('\n✨ CSV sync complete!');
}

/**
 * Sync from Google Sheets and then sync to MongoDB
 */
async function fullSync(): Promise<void> {
  const args = process.argv.slice(2);
  const skipDb = args.includes('--csv-only');
  
  // Step 1: Sync from Google Sheets to CSV
  await syncFromGoogleSheets();
  
  if (skipDb) {
    console.log('\n⏭️ Skipping database sync (--csv-only mode)');
    return;
  }

  // Step 2: Sync from CSV to MongoDB
  console.log('\n\n🔄 Now syncing CSV to MongoDB...\n');
  
  // Import the sync function dynamically to avoid circular dependencies
  const { syncAllData } = await import('../services');
  const { connectDatabase, disconnectDatabase } = await import('../database');
  
  try {
    await connectDatabase();
    const result = await syncAllData();
    
    console.log('\n📊 Database Sync Results:');
    console.log(`   Festivals: ${result.festivalsCount}`);
    console.log(`   Steam Features: ${result.steamFeaturesCount}`);
    
    if (result.errors.length > 0) {
      console.log(`   Errors: ${result.errors.length}`);
    }
    
    await disconnectDatabase();
  } catch (error) {
    console.error('❌ Database sync failed:', error);
    process.exit(1);
  }
}

// Show help if requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Google Sheets Sync Script
=========================

Syncs data from the public "Worthy festivals for Indie games" Google Spreadsheet
to local CSV files and optionally to MongoDB.

Usage: npx ts-node src/scripts/syncGoogleSheets.ts [options]

Options:
  --csv-only    Only sync to CSV files, skip MongoDB sync
  --help, -h    Show this help message

Examples:
  npx ts-node src/scripts/syncGoogleSheets.ts              # Full sync (CSV + MongoDB)
  npx ts-node src/scripts/syncGoogleSheets.ts --csv-only   # CSV only

The script will fetch from:
  ${SPREADSHEET_ID}

And save to:
  ${path.resolve(OUTPUT_DIR)}
  `);
  process.exit(0);
}

// Run the sync
fullSync().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
