import dotenv from 'dotenv';
import mongoose from 'mongoose';
dotenv.config();

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('No MONGODB_URI');
    return;
  }
  
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  if (!db) { 
    console.log('No db'); 
    return; 
  }
  
  const col = db.collection('festivals');
  
  // Get all TurnBased
  const turnBased = await col.find({ name: { $regex: 'Turn', $options: 'i' } }).toArray();
  console.log('Turn festivals:', turnBased.length);
  turnBased.forEach(f => console.log(' -', JSON.stringify(f.name), '|', f.slug, '|', f.category));
  
  // Get all Rogue
  const rogue = await col.find({ name: { $regex: 'Rogue', $options: 'i' } }).toArray();
  console.log('\nRogue festivals:', rogue.length);
  rogue.forEach(f => console.log(' -', f.name, '|', f.slug, '|', f.category));
  
  // Get all NYX
  const nyx = await col.find({ name: { $regex: 'NYX', $options: 'i' } }).toArray();
  console.log('\nNYX festivals:', nyx.length);
  nyx.forEach(f => console.log(' -', f.name, '|', f.slug, '|', f.category));
  
  // Check total count
  const total = await col.countDocuments();
  console.log('\nTotal festivals:', total);
  
  // Check indexes
  const indexes = await col.indexes();
  console.log('\nIndexes:');
  indexes.forEach(idx => console.log(' -', idx.name, JSON.stringify(idx.key), idx.unique ? 'UNIQUE' : ''));
  
  await mongoose.disconnect();
}

main().catch(console.error);
