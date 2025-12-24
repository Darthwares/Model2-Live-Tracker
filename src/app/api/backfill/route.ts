import { NextResponse } from 'next/server';
import { db, models } from '@/lib/db';
import { backfillModelsForMonth, backfillModelsForDateRange } from '@/lib/ai/research-agent';
import { invalidateCache } from '@/lib/cache';
import { eq } from 'drizzle-orm';

export const maxDuration = 300; // 5 minutes max for backfill

export async function POST(request: Request) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { year, month, startDate, endDate } = body;

    const logs: string[] = [];
    const logProgress = (message: string) => {
      console.log(message);
      logs.push(`[${new Date().toISOString()}] ${message}`);
    };

    let researchedModels;

    if (year && month) {
      // Backfill by month
      logProgress(`Starting monthly backfill for ${year}-${String(month).padStart(2, '0')}`);
      researchedModels = await backfillModelsForMonth(year, month, logProgress);
    } else if (startDate && endDate) {
      // Backfill by date range
      logProgress(`Starting date range backfill from ${startDate} to ${endDate}`);
      researchedModels = await backfillModelsForDateRange(startDate, endDate, logProgress);
    } else {
      return NextResponse.json(
        { error: 'Please provide either {year, month} or {startDate, endDate}' },
        { status: 400 }
      );
    }

    // Insert models into database
    let inserted = 0;
    let skipped = 0;

    for (const modelData of researchedModels) {
      if (!modelData.slug || !modelData.name) {
        logProgress(`Skipping model with missing data`);
        skipped++;
        continue;
      }

      try {
        // Check if model already exists
        const existing = await db.query.models.findFirst({
          where: eq(models.slug, modelData.slug),
        });

        if (existing) {
          logProgress(`Model already exists: ${modelData.name} (${modelData.slug})`);
          skipped++;
          continue;
        }

        // Insert new model
        await db.insert(models).values({
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

        logProgress(`Inserted: ${modelData.name}`);
        inserted++;
      } catch (error) {
        logProgress(`Error inserting ${modelData.name}: ${error}`);
        skipped++;
      }
    }

    // Invalidate cache
    await invalidateCache();
    logProgress('Cache invalidated');

    return NextResponse.json({
      success: true,
      summary: {
        discovered: researchedModels.length,
        inserted,
        skipped,
      },
      logs,
    });
  } catch (error) {
    console.error('Backfill error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

// GET endpoint to check backfill status or get instructions
export async function GET() {
  return NextResponse.json({
    message: 'Backfill API',
    usage: {
      method: 'POST',
      headers: {
        Authorization: 'Bearer YOUR_CRON_SECRET',
        'Content-Type': 'application/json',
      },
      body: {
        option1: { year: 2024, month: 12 },
        option2: { startDate: '2024-12-01', endDate: '2024-12-31' },
      },
    },
  });
}
