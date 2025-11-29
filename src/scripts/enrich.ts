import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { enrichAllFestivals, enrichFromSteamPages, getEnrichmentStats } from '../services/enrichmentService';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/festivals';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'all';
  
  console.log('🎮 Festival Enrichment Script');
  console.log('==============================\n');
  
  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Parse options from command line
    const options = {
      force: args.includes('--force'),
      limit: 0,
      delayMs: 1000,
    };

    const limitIndex = args.indexOf('--limit');
    if (limitIndex !== -1 && args[limitIndex + 1]) {
      options.limit = parseInt(args[limitIndex + 1], 10);
    }

    const delayIndex = args.indexOf('--delay');
    if (delayIndex !== -1 && args[delayIndex + 1]) {
      options.delayMs = parseInt(args[delayIndex + 1], 10);
    }

    // Show current stats first
    const initialStats = await getEnrichmentStats();
    console.log('📊 Current enrichment status:');
    console.log(`   Total festivals: ${initialStats.total}`);
    console.log(`   Verified: ${initialStats.verified}`);
    console.log(`   Pending: ${initialStats.pending}`);
    console.log(`   Failed: ${initialStats.failed}`);
    console.log(`   With images: ${initialStats.withImages}`);
    console.log(`   With descriptions: ${initialStats.withDescriptions}`);
    console.log(`   With social links: ${initialStats.withSocialLinks}`);
    console.log();

    switch (command) {
      case 'stats':
        // Just show stats, already done above
        break;

      case 'steam':
        console.log('🎮 Enriching from Steam pages...\n');
        const steamStats = await enrichFromSteamPages(options);
        console.log('\n📊 Steam enrichment results:');
        console.log(`   Processed: ${steamStats.total}`);
        console.log(`   Enriched: ${steamStats.enriched}`);
        console.log(`   Skipped: ${steamStats.skipped}`);
        console.log(`   Failed: ${steamStats.failed}`);
        break;

      case 'all':
      default:
        console.log(`🔍 Enriching festivals from official pages...`);
        console.log(`   Options: force=${options.force}, limit=${options.limit || 'unlimited'}, delay=${options.delayMs}ms\n`);
        
        const stats = await enrichAllFestivals(options);
        
        console.log('\n==============================');
        console.log('📊 Enrichment Results:');
        console.log(`   Processed: ${stats.total}`);
        console.log(`   Enriched: ${stats.enriched}`);
        console.log(`   Failed: ${stats.failed}`);
        
        if (stats.errors.length > 0) {
          console.log('\n❌ Errors:');
          stats.errors.slice(0, 10).forEach(err => console.log(`   - ${err}`));
          if (stats.errors.length > 10) {
            console.log(`   ... and ${stats.errors.length - 10} more errors`);
          }
        }
        break;
    }

    // Show final stats
    const finalStats = await getEnrichmentStats();
    console.log('\n📊 Final enrichment status:');
    console.log(`   Verified: ${finalStats.verified}`);
    console.log(`   Pending: ${finalStats.pending}`);
    console.log(`   Failed: ${finalStats.failed}`);
    console.log(`   With images: ${finalStats.withImages}`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Show usage if help is requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Festival Enrichment Script
==========================

Usage: npx ts-node src/scripts/enrich.ts [command] [options]

Commands:
  all     Enrich from official festival pages (default)
  steam   Enrich from Steam pages (for better images)
  stats   Show enrichment statistics only

Options:
  --force         Re-enrich already processed festivals
  --limit <n>     Limit number of festivals to process
  --delay <ms>    Delay between requests (default: 1000ms)
  --help, -h      Show this help message

Examples:
  npx ts-node src/scripts/enrich.ts
  npx ts-node src/scripts/enrich.ts --limit 20
  npx ts-node src/scripts/enrich.ts steam --limit 50
  npx ts-node src/scripts/enrich.ts all --force --limit 10
  `);
  process.exit(0);
}

main();
