import dotenv from 'dotenv';
dotenv.config();

import { connectDatabase, disconnectDatabase } from '../database';
import { runPostSyncEnrichment } from '../services/cronEnrichment';

async function testEnrichment() {
  console.log('🧪 Testing post-sync enrichment...\n');
  
  try {
    await connectDatabase();
    
    const result = await runPostSyncEnrichment({
      imageLimit: 2,  // Test with just 2 images
      aiLimit: 1      // Test with just 1 AI enrichment
    });
    
    console.log('\n📊 Test Results:');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await disconnectDatabase();
  }
}

testEnrichment();
