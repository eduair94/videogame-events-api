import dotenv from 'dotenv';
dotenv.config();

import { connectDatabase, disconnectDatabase } from '../database';
import { enrichImagesFromGoogleSearch } from '../services/enrichmentService';

async function main() {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  let limit = 10;
  let delay = 2000;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      limit = parseInt(args[i + 1], 10);
    }
    if (args[i] === '--delay' && args[i + 1]) {
      delay = parseInt(args[i + 1], 10);
    }
    if (args[i] === '--all') {
      limit = 0; // 0 means no limit
    }
  }

  console.log('🖼️  Image Sync from Google Search');
  console.log('================================\n');

  if (!process.env.RAPIDAPI_KEY) {
    console.error('❌ Error: RAPIDAPI_KEY environment variable is not set');
    console.log('\nPlease add RAPIDAPI_KEY to your .env file');
    process.exit(1);
  }

  try {
    await connectDatabase();
    
    console.log(`Options: limit=${limit || 'unlimited'}, delay=${delay}ms\n`);
    
    const stats = await enrichImagesFromGoogleSearch({
      limit: limit || 1000, // If 0, set a high limit
      delayMs: delay,
    });

    console.log('\n✅ Image sync completed!');
    console.log(`   Updated: ${stats.updated} festivals`);
    console.log(`   Failed: ${stats.failed}`);
    
    if (stats.errors.length > 0) {
      console.log('\n⚠️  Errors:');
      stats.errors.forEach(err => console.log(`   - ${err}`));
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await disconnectDatabase();
  }
}

main();
