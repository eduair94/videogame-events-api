import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import { Festival, IFestival } from '../models';

interface EnrichmentResult {
  imageUrl: string | null;
  logoUrl: string | null;
  description: string | null;
  twitter: string | null;
  discord: string | null;
  location: string | null;
  organizer: string | null;
  success: boolean;
  error?: string;
}

interface EnrichmentStats {
  total: number;
  enriched: number;
  failed: number;
  skipped: number;
  errors: string[];
}

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Fetches a webpage and returns the HTML content
 */
async function fetchPage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.log(`  ⚠️ HTTP ${response.status} for ${url}`);
      return null;
    }

    return await response.text();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.log(`  ⚠️ Failed to fetch ${url}: ${message}`);
    return null;
  }
}

/**
 * Extracts metadata from a webpage
 */
function extractMetadata(html: string, baseUrl: string): EnrichmentResult {
  const $ = cheerio.load(html);
  
  // Extract Open Graph and meta tags
  const ogImage = $('meta[property="og:image"]').attr('content');
  const ogDescription = $('meta[property="og:description"]').attr('content');
  const metaDescription = $('meta[name="description"]').attr('content');
  const twitterImage = $('meta[name="twitter:image"]').attr('content');
  
  // Try to find logo
  let logoUrl: string | null = null;
  const logoSelectors = [
    'link[rel="icon"]',
    'link[rel="shortcut icon"]',
    'link[rel="apple-touch-icon"]',
    '.logo img',
    '#logo img',
    'header img[src*="logo"]',
    'img[alt*="logo" i]',
    'img[class*="logo" i]',
  ];
  
  for (const selector of logoSelectors) {
    const element = $(selector).first();
    const src = element.attr('href') || element.attr('src');
    if (src) {
      logoUrl = resolveUrl(src, baseUrl);
      break;
    }
  }

  // Find social links
  let twitter: string | null = null;
  let discord: string | null = null;
  
  $('a[href*="twitter.com"], a[href*="x.com"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href && !twitter) {
      twitter = href;
    }
  });

  $('a[href*="discord"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href && !discord) {
      discord = href;
    }
  });

  // Try to find location info
  let location: string | null = null;
  const locationPatterns = [
    /(?:held in|located in|takes place in|happening in)\s+([A-Z][a-zA-Z\s,]+)/i,
    /([A-Z][a-zA-Z]+,\s*[A-Z]{2,})/,  // City, STATE/Country pattern
  ];
  
  const bodyText = $('body').text();
  for (const pattern of locationPatterns) {
    const match = bodyText.match(pattern);
    if (match) {
      location = match[1].trim();
      break;
    }
  }

  // Try to find organizer
  let organizer: string | null = null;
  const organizerPatterns = [
    /(?:organized by|hosted by|presented by|brought to you by)\s+([A-Za-z0-9\s&]+)/i,
  ];
  
  for (const pattern of organizerPatterns) {
    const match = bodyText.match(pattern);
    if (match) {
      organizer = match[1].trim().substring(0, 100);
      break;
    }
  }

  // Resolve image URLs
  const imageUrl = ogImage || twitterImage ? resolveUrl(ogImage || twitterImage || '', baseUrl) : null;

  return {
    imageUrl,
    logoUrl,
    description: (ogDescription || metaDescription || '').substring(0, 500) || null,
    twitter,
    discord,
    location,
    organizer,
    success: true,
  };
}

/**
 * Resolves a relative URL to an absolute URL
 */
function resolveUrl(url: string, baseUrl: string): string | null {
  if (!url) return null;
  
  try {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.startsWith('//')) {
      return 'https:' + url;
    }
    const base = new URL(baseUrl);
    return new URL(url, base).href;
  } catch {
    return null;
  }
}

/**
 * Enriches a single festival with data from its official page
 */
async function enrichFestival(festival: IFestival): Promise<EnrichmentResult> {
  const url = festival.eventOfficialPage;
  
  if (!url || url.trim() === '') {
    return {
      imageUrl: null,
      logoUrl: null,
      description: null,
      twitter: null,
      discord: null,
      location: null,
      organizer: null,
      success: false,
      error: 'No official page URL',
    };
  }

  // Clean up URL - take the first one if multiple are listed
  const cleanUrl = url.split('\n')[0].split(' ')[0].trim();
  
  // Skip Google Forms and other non-scrapeable URLs
  if (cleanUrl.includes('docs.google.com/forms') || cleanUrl.includes('forms.gle')) {
    return {
      imageUrl: null,
      logoUrl: null,
      description: `Submission form for ${festival.name}`,
      twitter: null,
      discord: null,
      location: null,
      organizer: null,
      success: true,
    };
  }

  const html = await fetchPage(cleanUrl);
  
  if (!html) {
    return {
      imageUrl: null,
      logoUrl: null,
      description: null,
      twitter: null,
      discord: null,
      location: null,
      organizer: null,
      success: false,
      error: 'Failed to fetch page',
    };
  }

  return extractMetadata(html, cleanUrl);
}

/**
 * Enriches a single festival and updates it in the database
 */
async function enrichAndUpdateFestival(festival: IFestival): Promise<boolean> {
  console.log(`🔍 Enriching: ${festival.name}`);
  
  const result = await enrichFestival(festival);
  
  const updateData = {
    'enrichment.lastCheckedAt': new Date(),
    'enrichment.verificationStatus': result.success ? 'verified' : 'failed',
    ...(result.imageUrl && { 'enrichment.imageUrl': result.imageUrl }),
    ...(result.logoUrl && { 'enrichment.logoUrl': result.logoUrl }),
    ...(result.description && { 'enrichment.description': result.description }),
    ...(result.twitter && { 'enrichment.twitter': result.twitter }),
    ...(result.discord && { 'enrichment.discord': result.discord }),
    ...(result.location && { 'enrichment.location': result.location }),
    ...(result.organizer && { 'enrichment.organizer': result.organizer }),
    ...(result.success && { 'enrichment.verifiedAt': new Date() }),
  };

  await Festival.findByIdAndUpdate(festival._id, { $set: updateData });
  
  if (result.success) {
    const fields = [
      result.imageUrl && 'image',
      result.description && 'description',
      result.twitter && 'twitter',
      result.discord && 'discord',
    ].filter(Boolean);
    console.log(`  ✅ Found: ${fields.join(', ') || 'basic info'}`);
  } else {
    console.log(`  ❌ ${result.error}`);
  }

  return result.success;
}

/**
 * Enriches all festivals that haven't been enriched yet
 */
export async function enrichAllFestivals(options: {
  force?: boolean;
  limit?: number;
  delayMs?: number;
} = {}): Promise<EnrichmentStats> {
  const { force = false, limit = 0, delayMs = 1000 } = options;

  const query = force 
    ? {} 
    : {
        $or: [
          { 'enrichment.verificationStatus': 'pending' },
          { 'enrichment.verificationStatus': { $exists: false } },
          { enrichment: { $exists: false } },
        ],
      };

  let festivalsQuery = Festival.find(query).sort({ name: 1 });
  
  if (limit > 0) {
    festivalsQuery = festivalsQuery.limit(limit);
  }

  const festivals = await festivalsQuery;

  const stats: EnrichmentStats = {
    total: festivals.length,
    enriched: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  console.log(`\n📊 Found ${festivals.length} festivals to enrich\n`);

  for (let i = 0; i < festivals.length; i++) {
    const festival = festivals[i];
    
    try {
      const success = await enrichAndUpdateFestival(festival);
      if (success) {
        stats.enriched++;
      } else {
        stats.failed++;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      stats.errors.push(`${festival.name}: ${message}`);
      stats.failed++;
    }

    // Progress update every 10 festivals
    if ((i + 1) % 10 === 0) {
      console.log(`\n📈 Progress: ${i + 1}/${festivals.length} (${stats.enriched} enriched, ${stats.failed} failed)\n`);
    }

    // Rate limiting delay
    if (i < festivals.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return stats;
}

/**
 * Enriches festivals from Steam pages (gets better images)
 */
export async function enrichFromSteamPages(options: {
  limit?: number;
  delayMs?: number;
} = {}): Promise<EnrichmentStats> {
  const { limit = 0, delayMs = 1500 } = options;

  const query = {
    latestSteamPage: { $exists: true, $nin: ['', null] },
    $or: [
      { 'enrichment.imageUrl': null },
      { 'enrichment.imageUrl': { $exists: false } },
    ],
  };

  let festivalsQuery = Festival.find(query).sort({ name: 1 });
  
  if (limit > 0) {
    festivalsQuery = festivalsQuery.limit(limit);
  }

  const festivals = await festivalsQuery;

  const stats: EnrichmentStats = {
    total: festivals.length,
    enriched: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  console.log(`\n🎮 Found ${festivals.length} festivals with Steam pages to check\n`);

  for (let i = 0; i < festivals.length; i++) {
    const festival = festivals[i];
    const steamUrl = festival.latestSteamPage;
    
    if (!steamUrl || steamUrl.includes('#VALUE!')) {
      stats.skipped++;
      continue;
    }

    console.log(`🎮 Checking Steam page: ${festival.name}`);
    
    const html = await fetchPage(steamUrl);
    
    if (html) {
      const $ = cheerio.load(html);
      const capsuleImage = $('img.sale_header_capsule').attr('src') ||
                          $('img[src*="header_586x192"]').attr('src') ||
                          $('meta[property="og:image"]').attr('content');
      
      if (capsuleImage) {
        await Festival.findByIdAndUpdate(festival._id, {
          $set: { 'enrichment.imageUrl': capsuleImage },
        });
        console.log(`  ✅ Found Steam image`);
        stats.enriched++;
      } else {
        stats.failed++;
      }
    } else {
      stats.failed++;
    }

    if (i < festivals.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return stats;
}

/**
 * Gets enrichment statistics
 */
export async function getEnrichmentStats(): Promise<{
  total: number;
  verified: number;
  pending: number;
  failed: number;
  withImages: number;
  withDescriptions: number;
  withSocialLinks: number;
}> {
  const [
    total,
    verified,
    pending,
    failed,
    withImages,
    withDescriptions,
    withTwitter,
    withDiscord,
  ] = await Promise.all([
    Festival.countDocuments(),
    Festival.countDocuments({ 'enrichment.verificationStatus': 'verified' }),
    Festival.countDocuments({ 
      $or: [
        { 'enrichment.verificationStatus': 'pending' },
        { 'enrichment.verificationStatus': { $exists: false } },
      ],
    }),
    Festival.countDocuments({ 'enrichment.verificationStatus': 'failed' }),
    Festival.countDocuments({ 'enrichment.imageUrl': { $ne: null } }),
    Festival.countDocuments({ 'enrichment.description': { $ne: null } }),
    Festival.countDocuments({ 'enrichment.twitter': { $ne: null } }),
    Festival.countDocuments({ 'enrichment.discord': { $ne: null } }),
  ]);

  return {
    total,
    verified,
    pending,
    failed,
    withImages,
    withDescriptions,
    withSocialLinks: withTwitter + withDiscord,
  };
}
