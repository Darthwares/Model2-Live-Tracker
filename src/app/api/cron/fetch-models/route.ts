import { NextRequest, NextResponse } from 'next/server';
import { db, models, cronLogs, newsEntries } from '@/lib/db';
import { fetchNewModels } from '@/lib/ai/research-agent';
import { invalidateCache, setLastFetchTime } from '@/lib/cache';
import { eq } from 'drizzle-orm';

// Verify the request is from Vercel Cron
function verifyCronRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const userAgent = request.headers.get('user-agent');

  // In production, verify it's from Vercel Cron
  if (process.env.VERCEL_ENV === 'production') {
    return userAgent === 'vercel-cron';
  }

  // In development, check for auth header
  if (authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    return true;
  }

  return userAgent === 'vercel-cron';
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Verify the request
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('Starting cron job: fetch-models');

    // Fetch new models using AI research agent
    const newModels = await fetchNewModels();

    console.log(`Found ${newModels.length} new models`);

    let modelsAdded = 0;

    // Insert new models into database
    for (const modelData of newModels) {
      try {
        // Check if model already exists
        const existing = await db
          .select()
          .from(models)
          .where(eq(models.slug, modelData.slug!))
          .limit(1);

        if (existing.length === 0 && modelData.name && modelData.slug) {
          // Insert new model
          const [inserted] = await db
            .insert(models)
            .values({
              name: modelData.name,
              slug: modelData.slug,
              provider: modelData.provider || 'Unknown',
              releaseDate: modelData.releaseDate || new Date(),
              announcementDate: modelData.announcementDate,
              description: modelData.description,
              modelType: modelData.modelType,
              parameters: modelData.parameters,
              contextWindow: modelData.contextWindow,
              documentationUrl: modelData.documentationUrl,
              announcementUrl: modelData.announcementUrl,
              paperUrl: modelData.paperUrl,
              benchmarks: modelData.benchmarks,
              pricingInfo: modelData.pricingInfo,
              socialPosts: modelData.socialPosts,
              comparisons: modelData.comparisons,
              highlights: modelData.highlights,
              fullContent: modelData.fullContent,
              tags: modelData.tags,
              isAvailable: modelData.isAvailable,
              fetchedAt: new Date(),
            })
            .returning();

          modelsAdded++;

          // Add news entry for the new model
          await db.insert(newsEntries).values({
            modelId: inserted.id,
            title: `New Model Release: ${modelData.name}`,
            summary: modelData.description,
            sourceUrl: modelData.announcementUrl,
            sourceName: modelData.provider,
            publishedAt: modelData.releaseDate || new Date(),
            newsType: 'release',
          });

          console.log(`Added model: ${modelData.name}`);
        } else {
          console.log(`Model ${modelData.name} already exists, skipping`);
        }
      } catch (insertError) {
        console.error(`Error inserting model ${modelData.name}:`, insertError);
      }
    }

    // Invalidate cache so fresh data is fetched
    await invalidateCache();
    await setLastFetchTime();

    const executionTime = Date.now() - startTime;

    // Log the cron execution
    await db.insert(cronLogs).values({
      jobType: 'fetch-models',
      status: 'success',
      modelsFound: newModels.length,
      modelsAdded,
      executionTimeMs: executionTime,
    });

    return NextResponse.json({
      success: true,
      modelsFound: newModels.length,
      modelsAdded,
      executionTimeMs: executionTime,
    });
  } catch (error) {
    const executionTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error('Cron job error:', error);

    // Log the error
    await db.insert(cronLogs).values({
      jobType: 'fetch-models',
      status: 'error',
      errorMessage,
      executionTimeMs: executionTime,
    });

    return NextResponse.json(
      { error: 'Cron job failed', message: errorMessage },
      { status: 500 }
    );
  }
}

// Allow manual trigger via POST for testing
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Forward to GET handler
  return GET(request);
}
