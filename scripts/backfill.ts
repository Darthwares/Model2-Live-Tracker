#!/usr/bin/env npx tsx

import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import * as schema from '../src/lib/db/schema';
import { backfillModelsForMonth, backfillModelsForDateRange } from '../src/lib/ai/research-agent';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Usage:
  npx tsx scripts/backfill.ts --month 2024 12
  npx tsx scripts/backfill.ts --range 2024-12-01 2024-12-31
  npx tsx scripts/backfill.ts --last-month
    `);
    process.exit(1);
  }

  let researchedModels;

  if (args[0] === '--month' && args[1] && args[2]) {
    const year = parseInt(args[1]);
    const month = parseInt(args[2]);
    console.log(`\n🔍 Backfilling models for ${year}-${String(month).padStart(2, '0')}...\n`);
    researchedModels = await backfillModelsForMonth(year, month);
  } else if (args[0] === '--range' && args[1] && args[2]) {
    const startDate = args[1];
    const endDate = args[2];
    console.log(`\n🔍 Backfilling models from ${startDate} to ${endDate}...\n`);
    researchedModels = await backfillModelsForDateRange(startDate, endDate);
  } else if (args[0] === '--last-month') {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const year = lastMonth.getFullYear();
    const month = lastMonth.getMonth() + 1;
    console.log(`\n🔍 Backfilling models for last month (${year}-${String(month).padStart(2, '0')})...\n`);
    researchedModels = await backfillModelsForMonth(year, month);
  } else {
    console.error('Invalid arguments. Run without arguments for usage.');
    process.exit(1);
  }

  console.log(`\n📊 Found ${researchedModels.length} models to insert\n`);

  let inserted = 0;
  let skipped = 0;

  for (const modelData of researchedModels) {
    if (!modelData.slug || !modelData.name) {
      console.log(`⏭️  Skipping model with missing data`);
      skipped++;
      continue;
    }

    try {
      // Check if model already exists
      const existing = await db.query.models.findFirst({
        where: eq(schema.models.slug, modelData.slug),
      });

      if (existing) {
        console.log(`⏭️  Already exists: ${modelData.name}`);
        skipped++;
        continue;
      }

      // Insert new model
      await db.insert(schema.models).values({
        name: modelData.name!,
        slug: modelData.slug!,
        provider: modelData.provider!,
        releaseDate: modelData.releaseDate!,
        announcementDate: modelData.announcementDate,
        description: modelData.description,
        modelType: modelData.modelType,
        parameters: modelData.parameters,
        contextWindow: modelData.contextWindow,
        documentationUrl: modelData.documentationUrl,
        announcementUrl: modelData.announcementUrl,
        paperUrl: modelData.paperUrl,
        benchmarks: modelData.benchmarks || {},
        pricingInfo: modelData.pricingInfo || {},
        socialPosts: modelData.socialPosts || [],
        comparisons: modelData.comparisons || [],
        highlights: modelData.highlights || [],
        fullContent: modelData.fullContent,
        tags: modelData.tags || [],
        isAvailable: modelData.isAvailable ?? true,
        fetchedAt: new Date(),
      });

      console.log(`✅ Inserted: ${modelData.name} by ${modelData.provider}`);
      inserted++;
    } catch (error) {
      console.log(`❌ Error inserting ${modelData.name}: ${error}`);
      skipped++;
    }
  }

  console.log(`
📈 Backfill Complete!
   Inserted: ${inserted}
   Skipped: ${skipped}
   Total: ${researchedModels.length}
  `);
}

main().catch(console.error);
