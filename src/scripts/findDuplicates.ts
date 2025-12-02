import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../database';
import { Festival } from '../models/Festival';

dotenv.config();

async function main() {
  await connectDatabase();
  
  console.log('🔍 Looking for duplicate festivals...\n');
  
  // Find duplicates by name + category
  const duplicates = await Festival.aggregate([
    { 
      $group: { 
        _id: { name: '$name', category: '$category' }, 
        count: { $sum: 1 }, 
        slugs: { $push: '$slug' },
        ids: { $push: '$_id' }
      } 
    },
    { $match: { count: { $gt: 1 } } },
    { $sort: { count: -1 } }
  ]);
  
  if (duplicates.length === 0) {
    console.log('✅ No duplicates found!');
    await disconnectDatabase();
    return;
  }
  
  console.log(`Found ${duplicates.length} duplicate groups:\n`);
  
  for (const d of duplicates) {
    console.log(`📌 Name: "${d._id.name}" | Category: ${d._id.category} | Count: ${d.count}`);
    console.log(`   Slugs: ${d.slugs.join(', ')}`);
  }
  
  // If running with --fix flag, remove duplicates keeping the one without year suffix
  if (process.argv.includes('--fix')) {
    console.log('\n🔧 Fixing duplicates...\n');
    
    for (const d of duplicates) {
      const slugs = d.slugs as string[];
      const ids = d.ids as mongoose.Types.ObjectId[];
      
      // Find the slug without year suffix (the "clean" one)
      const yearPattern = /-20\d{2}$/;
      const cleanSlugIndex = slugs.findIndex(s => !yearPattern.test(s));
      
      if (cleanSlugIndex !== -1) {
        // Keep the clean one, delete the others
        const toKeep = slugs[cleanSlugIndex];
        const toDelete = ids.filter((_, i) => i !== cleanSlugIndex);
        
        console.log(`   Keeping: ${toKeep}`);
        console.log(`   Deleting: ${slugs.filter((_, i) => i !== cleanSlugIndex).join(', ')}`);
        
        const result = await Festival.deleteMany({ _id: { $in: toDelete } });
        console.log(`   ✅ Deleted ${result.deletedCount} duplicate(s)\n`);
      } else {
        // All have year suffix, keep the first one
        const toKeep = slugs[0];
        const toDelete = ids.slice(1);
        
        console.log(`   Keeping: ${toKeep}`);
        console.log(`   Deleting: ${slugs.slice(1).join(', ')}`);
        
        const result = await Festival.deleteMany({ _id: { $in: toDelete } });
        console.log(`   ✅ Deleted ${result.deletedCount} duplicate(s)\n`);
      }
    }
    
    console.log('✨ Duplicates fixed!');
  } else {
    console.log('\n💡 Run with --fix to remove duplicates');
  }
  
  await disconnectDatabase();
}

main().catch(console.error);
