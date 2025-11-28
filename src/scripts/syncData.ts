/**
 * Standalone script to sync CSV data to MongoDB
 * Run with: npm run sync
 */

import { connectDatabase, disconnectDatabase } from '../database';
import { syncAllData } from '../services';

async function main(): Promise<void> {
  console.log('🚀 Starting data synchronization...\n');

  try {
    await connectDatabase();

    const result = await syncAllData();

    console.log('\n📊 Sync Summary:');
    console.log(`   - Festivals synced: ${result.festivalsCount}`);
    console.log(`   - Steam features synced: ${result.steamFeaturesCount}`);
    
    if (result.errors.length > 0) {
      console.log('\n⚠️ Errors encountered:');
      result.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    } else {
      console.log('\n✅ Sync completed successfully!');
    }
  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  } finally {
    await disconnectDatabase();
  }
}

main();
