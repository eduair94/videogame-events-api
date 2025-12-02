/**
 * Cron Enrichment Service
 * 
 * Provides enrichment functions that can be called from the Vercel cron job
 * after syncing data from Google Sheets. These functions enrich newly synced
 * festivals with images and AI-generated content.
 */

import fetch from 'node-fetch';
import { config } from '../config';
import { Festival } from '../models';
import { convertToAIEnrichment, getGameEventDetails } from './aiEnrichment';

// Configuration from environment
const AI_ENRICHMENT_VERSION = parseInt(process.env.AI_ENRICHMENT_VERSION || '1', 10);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

interface ImageSearchStats {
  total: number;
  updated: number;
  failed: number;
  skipped: number;
  errors: string[];
}

interface AIEnrichmentStats {
  total: number;
  enriched: number;
  failed: number;
  skipped: number;
  errors: string[];
}

interface GoogleImageResult {
  url: string;
  width: number;
  height: number;
}

interface GoogleSearchResponse {
  status: string;
  results?: GoogleImageResult[];
}

/**
 * Sleep helper function
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Search for an image using RapidAPI Google Image Search
 */
async function searchGoogleImage(query: string): Promise<string | null> {
  if (!config.rapidApi.key) {
    return null;
  }

  const url = `https://${config.rapidApi.googleSearchHost}/search`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': config.rapidApi.key,
        'X-RapidAPI-Host': config.rapidApi.googleSearchHost,
      },
      body: JSON.stringify({
        q: query,
        num: 5,
        type: 'image',
      }),
    });

    if (!response.ok) {
      console.log(`  ⚠️ RapidAPI HTTP ${response.status}`);
      return null;
    }

    const data = await response.json() as GoogleSearchResponse;

    // Extract image URL from results
    if (data.results && data.results.length > 0) {
      // Find the first valid image URL
      for (const result of data.results) {
        if (result.url && result.url.startsWith('http')) {
          return result.url;
        }
      }
    }

    return null;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.log(`  ⚠️ Image search error: ${message}`);
    return null;
  }
}

/**
 * Enrich festivals that are missing images
 * Called after Google Sheets sync to add images to new festivals
 * 
 * @param limit Maximum number of festivals to process (default: 5 for cron)
 * @param delayMs Delay between API calls to respect rate limits
 */
export async function enrichNewFestivalsWithImages(options: {
  limit?: number;
  delayMs?: number;
} = {}): Promise<ImageSearchStats> {
  const { limit = 5, delayMs = 1500 } = options;

  const stats: ImageSearchStats = {
    total: 0,
    updated: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  if (!config.rapidApi.key) {
    console.log('⚠️ RapidAPI key not configured, skipping image enrichment');
    return stats;
  }

  // Find festivals without imageUrl
  const festivals = await Festival.find({
    $or: [
      { 'enrichment.imageUrl': null },
      { 'enrichment.imageUrl': '' },
      { 'enrichment.imageUrl': { $exists: false } },
    ],
  }).limit(limit);

  stats.total = festivals.length;

  if (stats.total === 0) {
    console.log('ℹ️ No festivals need image enrichment');
    return stats;
  }

  console.log(`\n🖼️ Enriching ${stats.total} festivals with images...`);

  for (let i = 0; i < festivals.length; i++) {
    const festival = festivals[i];
    const progress = `[${i + 1}/${stats.total}]`;

    console.log(`${progress} Searching image for: ${festival.name}`);

    try {
      // Create search query: "steam" + event name for better results
      const searchQuery = `steam ${festival.name}`;
      const imageUrl = await searchGoogleImage(searchQuery);

      if (imageUrl) {
        festival.enrichment.imageUrl = imageUrl;
        festival.enrichment.lastCheckedAt = new Date();
        await festival.save();

        console.log(`  ✅ Found image`);
        stats.updated++;
      } else {
        console.log(`  ❌ No image found`);
        stats.failed++;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.log(`  ❌ Error: ${message}`);
      stats.errors.push(`${festival.name}: ${message}`);
      stats.failed++;
    }

    // Respect rate limits
    if (i < festivals.length - 1) {
      await sleep(delayMs);
    }
  }

  return stats;
}

/**
 * Enrich festivals that are missing AI-generated content
 * Called after Google Sheets sync to add AI content to new festivals
 * 
 * @param limit Maximum number of festivals to process (default: 3 for cron)
 * @param delayMs Delay between API calls to respect rate limits
 */
export async function enrichNewFestivalsWithAI(options: {
  limit?: number;
  delayMs?: number;
} = {}): Promise<AIEnrichmentStats> {
  const { limit = 3, delayMs = 2000 } = options;

  const stats: AIEnrichmentStats = {
    total: 0,
    enriched: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  if (!GEMINI_API_KEY) {
    console.log('⚠️ Gemini API key not configured, skipping AI enrichment');
    return stats;
  }

  // Find festivals that need AI enrichment (pending status or no status)
  const festivals = await Festival.find({
    $or: [
      { 'aiEnrichment.enrichmentStatus': { $in: ['pending', null] } },
      { 'aiEnrichment.enrichmentStatus': { $exists: false } },
      { 'aiEnrichment.version': { $lt: AI_ENRICHMENT_VERSION } },
      { 'aiEnrichment.version': { $exists: false } }
    ],
  }).limit(limit);

  stats.total = festivals.length;

  if (stats.total === 0) {
    console.log('ℹ️ No festivals need AI enrichment');
    return stats;
  }

  console.log(`\n🤖 Enriching ${stats.total} festivals with AI content...`);

  for (let i = 0; i < festivals.length; i++) {
    const festival = festivals[i];
    const progress = `[${i + 1}/${stats.total}]`;

    console.log(`${progress} AI enriching: ${festival.name}`);

    try {
      const eventData = await getGameEventDetails(festival.name, GEMINI_API_KEY);

      if (!eventData) {
        console.log(`  ⚠️ No AI data returned`);
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
        stats.failed++;
        continue;
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

      console.log(`  ✅ AI enriched successfully`);
      stats.enriched++;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.log(`  ❌ Error: ${message}`);
      stats.errors.push(`${festival.name}: ${message}`);
      
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
      stats.failed++;
    }

    // Respect rate limits
    if (i < festivals.length - 1) {
      await sleep(delayMs);
    }
  }

  return stats;
}

/**
 * Run all enrichment tasks for newly synced festivals
 * This is the main function called from the cron job
 */
export async function runPostSyncEnrichment(options: {
  imageLimit?: number;
  aiLimit?: number;
} = {}): Promise<{
  images: ImageSearchStats;
  ai: AIEnrichmentStats;
}> {
  const { imageLimit = 5, aiLimit = 3 } = options;

  console.log('\n🔄 Starting post-sync enrichment...');

  // Run image enrichment first (faster)
  const imageStats = await enrichNewFestivalsWithImages({ limit: imageLimit });

  // Run AI enrichment (slower, more expensive)
  const aiStats = await enrichNewFestivalsWithAI({ limit: aiLimit });

  console.log('\n📊 Post-sync enrichment complete:');
  console.log(`   Images: ${imageStats.updated} updated, ${imageStats.failed} failed`);
  console.log(`   AI: ${aiStats.enriched} enriched, ${aiStats.failed} failed`);

  return { images: imageStats, ai: aiStats };
}
