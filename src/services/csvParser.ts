import { parse } from 'csv-parse/sync';
import fs from 'fs';
import { csvFiles } from '../config';
import { Festival, SteamFeature, SyncLog, generateSlug } from '../models';

function parseBoolean(value: string): boolean {
  return value?.toUpperCase() === 'TRUE';
}

function parseNumber(value: string): number | null {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
}

function cleanString(value: string | undefined): string {
  if (!value) return '';
  return value.trim();
}

/**
 * Calculate days until a deadline date (for consistency validation)
 */
function calculateDaysUntil(deadlineStr: string | null): number | null {
  if (!deadlineStr) return null;
  
  const deadline = new Date(deadlineStr);
  if (isNaN(deadline.getTime())) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);
  
  const diffTime = deadline.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Generate a unique slug for a festival, including year if deadline is provided
 */
function generateUniqueSlug(name: string, deadline: string | null): string {
  const baseSlug = generateSlug(name);
  
  // If there's a deadline, extract the year and append it to make slug unique
  if (deadline) {
    const year = deadline.split('-')[0];
    if (year && year.length === 4) {
      return `${baseSlug}-${year}`;
    }
  }
  
  return baseSlug;
}

export async function parseCuratedCSV(): Promise<void> {
  const filePath = csvFiles.curated;
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`Curated CSV file not found: ${filePath}`);
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  
  // Split into lines and skip the first 2 info rows
  const lines = fileContent.split('\n');
  const dataLines = lines.slice(2).join('\n'); // Skip first 2 rows (info rows)
  
  const records = parse(dataLines, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    relax_quotes: true,
  });

  const festivals = records
    .filter((row: Record<string, string>) => {
      const name = row['Festival'] || row[''] || Object.values(row)[0];
      return name && typeof name === 'string' && name.trim() !== '' && 
             !name.includes('OPEN') && !name.includes('CLOSING');
    })
    .map((row: Record<string, string>) => {
      const name = cleanString(row['Festival'] || Object.values(row)[0] as string);
      const deadline = cleanString(row['Deadline (YYYY-MM-DD)']) || null;
      const daysToSubmitRaw = row['Days to submit'];
      const parsedDaysToSubmit = parseNumber(daysToSubmitRaw);
      const calculatedDays = calculateDaysUntil(deadline);
      
      // Log consistency check
      console.log(`  🎮 ${name}:`);
      console.log(`     - Deadline: "${deadline}" | Days (sheet): ${parsedDaysToSubmit} | Days (calculated): ${calculatedDays}`);
      if (deadline && parsedDaysToSubmit !== null && calculatedDays !== null) {
        const diff = Math.abs(parsedDaysToSubmit - calculatedDays);
        if (diff <= 1) {
          console.log(`     ✅ CONSISTENT (diff: ${diff})`);
        } else {
          console.log(`     ⚠️ MISMATCH! Sheet=${parsedDaysToSubmit}, Calculated=${calculatedDays}, diff=${diff}`);
        }
      }
      
      return {
        name,
        slug: generateUniqueSlug(name, deadline),
        type: cleanString(row['Type']),
        when: cleanString(row['When']),
        deadline,
        submissionOpen: parseBoolean(row['Submission Open']),
        price: cleanString(row['Price']),
        hasSteamPage: cleanString(row['Steam page']),
        worthIt: cleanString(row['Was it worth the price?\nOpinions are biased (check comments)']),
        comments: cleanString(row['Comments']),
        eventOfficialPage: cleanString(row['Event official page']),
        latestSteamPage: cleanString(row['Latest Steam page']),
        daysToSubmit: parsedDaysToSubmit,
        category: 'curated' as const,
      };
    })
    .filter((f: { name: string }) => f.name && f.name.length > 0);

  // Upsert festivals using slug as unique identifier
  for (const festival of festivals) {
    await Festival.findOneAndUpdate(
      { slug: festival.slug },
      festival,
      { upsert: true, new: true }
    );
  }

  console.log(`✅ Synced ${festivals.length} curated festivals`);
}

export async function parseOnTheFenceCSV(): Promise<void> {
  const filePath = csvFiles.onTheFence;
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`On The Fence CSV file not found: ${filePath}`);
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  
  // Skip the first 2 info rows
  const lines = fileContent.split('\n');
  const dataLines = lines.slice(2).join('\n');
  
  const records = parse(dataLines, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    relax_quotes: true,
  });

  const festivals = records
    .filter((row: Record<string, string>) => {
      const name = row['Festival'] || Object.values(row)[0];
      return name && typeof name === 'string' && name.trim() !== '';
    })
    .map((row: Record<string, string>) => {
      const name = cleanString(row['Festival'] || Object.values(row)[0] as string);
      const deadline = cleanString(row['Deadline (YYYY-MM-DD)']) || null;
      const daysToSubmitRaw = row['Days to submit'];
      const parsedDaysToSubmit = parseNumber(daysToSubmitRaw);
      const calculatedDays = calculateDaysUntil(deadline);
      
      // Log consistency check
      console.log(`  🎮 ${name}:`);
      console.log(`     - Deadline: "${deadline}" | Days (sheet): ${parsedDaysToSubmit} | Days (calculated): ${calculatedDays}`);
      if (deadline && parsedDaysToSubmit !== null && calculatedDays !== null) {
        const diff = Math.abs(parsedDaysToSubmit - calculatedDays);
        if (diff <= 1) {
          console.log(`     ✅ CONSISTENT (diff: ${diff})`);
        } else {
          console.log(`     ⚠️ MISMATCH! Sheet=${parsedDaysToSubmit}, Calculated=${calculatedDays}, diff=${diff}`);
        }
      }
      
      return {
        name,
        slug: generateUniqueSlug(name, deadline),
        type: cleanString(row['Type']),
        when: cleanString(row['When']),
        deadline,
        submissionOpen: parseBoolean(row['Submission Open']),
        price: cleanString(row['Price']),
        hasSteamPage: cleanString(row['Steam page']),
        worthIt: cleanString(row['Was it worth the price?\nOpinions are biased (check comments)']),
        comments: cleanString(row['Comments']),
        eventOfficialPage: cleanString(row['Event official page']),
        latestSteamPage: cleanString(row['Latest Steam page']),
        daysToSubmit: parsedDaysToSubmit,
        category: 'on-the-fence' as const,
      };
    })
    .filter((f: { name: string }) => f.name && f.name.length > 0);

  // Upsert festivals using slug as unique identifier
  for (const festival of festivals) {
    await Festival.findOneAndUpdate(
      { slug: festival.slug },
      festival,
      { upsert: true, new: true }
    );
  }

  console.log(`✅ Synced ${festivals.length} on-the-fence festivals`);
}

export async function parseSteamTrackerCSV(): Promise<void> {
  const filePath = csvFiles.steamTracker;
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`Steam Tracker CSV file not found: ${filePath}`);
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  
  // Parse with custom column handling for duplicate headers
  const lines = fileContent.split('\n');
  const dataLines = lines.slice(1); // Skip header

  const steamFeatures: Array<{
    festivalName: string;
    year2021: string;
    year2022: string;
    year2023: string;
    details2021: string;
    details2022: string;
    details2023: string;
  }> = [];

  for (const line of dataLines) {
    const cols = line.split(',').map((c) => c.trim());
    
    if (cols[0] && cols[0] !== '' && cols[0] !== 'Festival') {
      steamFeatures.push({
        festivalName: cleanString(cols[0]),
        year2021: cleanString(cols[1]),
        year2022: cleanString(cols[2]),
        year2023: cleanString(cols[3]),
        details2021: cleanString(cols[4]),
        details2022: cleanString(cols[5]),
        details2023: cleanString(cols[6]),
      });
    }
  }

  for (const feature of steamFeatures) {
    await SteamFeature.findOneAndUpdate(
      { festivalName: feature.festivalName },
      feature,
      { upsert: true, new: true }
    );
  }

  console.log(`✅ Synced ${steamFeatures.length} Steam feature records`);
}

export async function syncAllData(): Promise<{
  festivalsCount: number;
  steamFeaturesCount: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let festivalsCount = 0;
  let steamFeaturesCount = 0;

  try {
    await parseCuratedCSV();
    const curatedCount = await Festival.countDocuments({ category: 'curated' });
    festivalsCount += curatedCount;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error parsing curated CSV';
    errors.push(message);
    console.error('❌ Error parsing curated CSV:', message);
  }

  try {
    await parseOnTheFenceCSV();
    const onTheFenceCount = await Festival.countDocuments({ category: 'on-the-fence' });
    festivalsCount += onTheFenceCount;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error parsing on-the-fence CSV';
    errors.push(message);
    console.error('❌ Error parsing on-the-fence CSV:', message);
  }

  try {
    await parseSteamTrackerCSV();
    steamFeaturesCount = await SteamFeature.countDocuments();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error parsing steam tracker CSV';
    errors.push(message);
    console.error('❌ Error parsing steam tracker CSV:', message);
  }

  // Log the sync operation
  await SyncLog.create({
    syncedAt: new Date(),
    filesProcessed: Object.values(csvFiles),
    festivalsCount,
    steamFeaturesCount,
    status: errors.length === 0 ? 'success' : errors.length < 3 ? 'partial' : 'failed',
    syncErrors: errors,
  });

  return { festivalsCount, steamFeaturesCount, errors };
}
