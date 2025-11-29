import * as dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Festival, generateSlug } from '../models/Festival';
import { convertToAIEnrichment, getGameEventDetails } from '../services/aiEnrichment';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/indie-festivals';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const AI_ENRICHMENT_VERSION = parseInt(process.env.AI_ENRICHMENT_VERSION || '1', 10);
const DELAY_BETWEEN_REQUESTS = parseInt(process.env.AI_ENRICHMENT_DELAY || '2000', 10);

interface EnrichmentStats {
  total: number;
  enriched: number;
  failed: number;
  skipped: number;
  alreadyUpToDate: number;
  outdatedVersion: number;
}

/**
 * Sleep helper function
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate slugs for all festivals that don't have one
 */
async function generateMissingSlugs(): Promise<number> {
  console.log('\n📝 Generating missing slugs...');
  
  const festivalsWithoutSlug = await Festival.find({ 
    $or: [{ slug: null }, { slug: '' }, { slug: { $exists: false } }] 
  });
  
  let updated = 0;
  
  for (const festival of festivalsWithoutSlug) {
    let baseSlug = generateSlug(festival.name);
    let slug = baseSlug;
    let counter = 1;

    // Check for duplicate slugs
    while (true) {
      const existing = await Festival.findOne({ 
        slug, 
        _id: { $ne: festival._id } 
      });
      if (!existing) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    await Festival.updateOne(
      { _id: festival._id },
      { $set: { slug } }
    );
    updated++;
    console.log(`  ✓ Generated slug for "${festival.name}": ${slug}`);
  }
  
  console.log(`✅ Generated ${updated} slugs`);
  return updated;
}

/**
 * Enrich a single festival with AI-generated data
 */
async function enrichFestival(
  festival: mongoose.Document & { name: string; _id: mongoose.Types.ObjectId }
): Promise<'enriched' | 'failed' | 'skipped'> {
  try {
    console.log(`\n🔍 Enriching: "${festival.name}"...`);
    
    const eventData = await getGameEventDetails(festival.name, GEMINI_API_KEY);
    
    if (!eventData) {
      console.log(`  ⚠️ No data returned for "${festival.name}"`);
      await Festival.updateOne(
        { _id: festival._id },
        { 
          $set: { 
            'aiEnrichment.enrichmentStatus': 'failed',
            'aiEnrichment.version': AI_ENRICHMENT_VERSION,
            'aiEnrichment.enrichedAt': new Date()
          } 
        }
      );
      return 'failed';
    }
    
    const aiEnrichment = convertToAIEnrichment(eventData);
    
    await Festival.updateOne(
      { _id: festival._id },
      { 
        $set: { 
          aiEnrichment: {
            ...aiEnrichment,
            version: AI_ENRICHMENT_VERSION,
            enrichedAt: new Date(),
            enrichmentStatus: 'enriched'
          }
        } 
      }
    );
    
    console.log(`  ✅ Enriched "${festival.name}" successfully (v${AI_ENRICHMENT_VERSION})`);
    return 'enriched';
    
  } catch (error) {
    console.error(`  ❌ Error enriching "${festival.name}":`, error);
    await Festival.updateOne(
      { _id: festival._id },
      { 
        $set: { 
          'aiEnrichment.enrichmentStatus': 'failed',
          'aiEnrichment.version': AI_ENRICHMENT_VERSION,
          'aiEnrichment.enrichedAt': new Date()
        } 
      }
    );
    return 'failed';
  }
}

/**
 * Main function to enrich all festivals
 */
async function enrichAllFestivals(options: {
  forceReEnrich?: boolean;
  limit?: number;
  category?: 'curated' | 'on-the-fence';
  onlyFailed?: boolean;
}): Promise<EnrichmentStats> {
  const { forceReEnrich = false, limit, category, onlyFailed = false } = options;
  
  const stats: EnrichmentStats = {
    total: 0,
    enriched: 0,
    failed: 0,
    skipped: 0,
    alreadyUpToDate: 0,
    outdatedVersion: 0
  };

  // Build query - only fetch festivals that need enrichment
  const query: Record<string, unknown> = {};
  
  if (!forceReEnrich) {
    if (onlyFailed) {
      // Retry failed ones, but only if version matches current
      query['aiEnrichment.enrichmentStatus'] = 'failed';
    } else {
      // Fetch festivals that either:
      // 1. Have never been enriched (pending/null status)
      // 2. Have an outdated version (version < current)
      query.$or = [
        { 'aiEnrichment.enrichmentStatus': { $in: ['pending', null] } },
        { 'aiEnrichment.enrichmentStatus': { $exists: false } },
        { 'aiEnrichment.version': { $lt: AI_ENRICHMENT_VERSION } },
        { 'aiEnrichment.version': { $exists: false } }
      ];
    }
  }
  
  if (category) {
    query.category = category;
  }

  // Get festivals to enrich
  let festivalsQuery = Festival.find(query).sort({ name: 1 });
  if (limit) {
    festivalsQuery = festivalsQuery.limit(limit);
  }
  
  const festivals = await festivalsQuery;
  stats.total = festivals.length;
  
  // Count how many have outdated versions
  stats.outdatedVersion = festivals.filter(f => 
    f.aiEnrichment?.enrichmentStatus === 'enriched' && 
    (f.aiEnrichment?.version || 0) < AI_ENRICHMENT_VERSION
  ).length;
  
  if (stats.total === 0) {
    console.log('ℹ️ No festivals to enrich - all are up to date');
    return stats;
  }

  console.log(`\n🚀 Starting AI enrichment for ${stats.total} festivals...`);
  console.log(`   Current version: ${AI_ENRICHMENT_VERSION}`);
  console.log(`   Outdated versions to update: ${stats.outdatedVersion}`);
  console.log(`   Delay between requests: ${DELAY_BETWEEN_REQUESTS}ms`);
  
  // Process festivals
  for (let i = 0; i < festivals.length; i++) {
    const festival = festivals[i];
    
    const result = await enrichFestival(festival);
    
    switch (result) {
      case 'enriched':
        stats.enriched++;
        break;
      case 'failed':
        stats.failed++;
        break;
      case 'skipped':
        stats.skipped++;
        break;
    }
    
    // Progress update
    const progress = ((i + 1) / festivals.length * 100).toFixed(1);
    console.log(`📊 Progress: ${i + 1}/${festivals.length} (${progress}%)`);
    
    // Delay between requests to avoid rate limiting
    if (i < festivals.length - 1) {
      await sleep(DELAY_BETWEEN_REQUESTS);
    }
  }
  
  return stats;
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  console.log('🎮 Festival AI Enrichment Script');
  console.log('================================\n');
  
  // Check for API key
  if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY environment variable is not set');
    process.exit(1);
  }

  // Parse command line arguments
  const args = process.argv.slice(2);
  const forceReEnrich = args.includes('--force') || args.includes('-f');
  const onlyFailed = args.includes('--retry-failed') || args.includes('-r');
  const onlySlugs = args.includes('--slugs-only') || args.includes('-s');
  const limitArg = args.find(arg => arg.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : undefined;
  const categoryArg = args.find(arg => arg.startsWith('--category='));
  const category = categoryArg ? categoryArg.split('=')[1] as 'curated' | 'on-the-fence' : undefined;

  console.log('Configuration:');
  console.log(`  AI Enrichment Version: ${AI_ENRICHMENT_VERSION}`);
  console.log(`  Delay between requests: ${DELAY_BETWEEN_REQUESTS}ms`);
  console.log('');
  console.log('Options:');
  console.log(`  Force re-enrich: ${forceReEnrich}`);
  console.log(`  Retry failed: ${onlyFailed}`);
  console.log(`  Only slugs: ${onlySlugs}`);
  console.log(`  Limit: ${limit || 'none'}`);
  console.log(`  Category: ${category || 'all'}`);

  try {
    // Connect to MongoDB
    console.log('\n📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Generate missing slugs first
    await generateMissingSlugs();
    
    if (onlySlugs) {
      console.log('\n✅ Slug generation complete (--slugs-only flag set)');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Run AI enrichment
    const stats = await enrichAllFestivals({
      forceReEnrich,
      limit,
      category,
      onlyFailed
    });

    // Print summary
    console.log('\n================================');
    console.log('📊 Enrichment Summary');
    console.log('================================');
    console.log(`AI Enrichment Version: ${AI_ENRICHMENT_VERSION}`);
    console.log(`Total processed: ${stats.total}`);
    console.log(`Successfully enriched: ${stats.enriched}`);
    console.log(`Failed: ${stats.failed}`);
    console.log(`Skipped: ${stats.skipped}`);
    console.log(`Outdated versions updated: ${stats.outdatedVersion}`);

    // Disconnect
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    console.log('🎉 Done!');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the script
main();
