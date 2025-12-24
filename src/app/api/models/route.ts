import { NextRequest, NextResponse } from 'next/server';
import { db, models } from '@/lib/db';
import { getCachedModels, setCachedModels } from '@/lib/cache';
import { desc, ilike, and, SQL } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const provider = searchParams.get('provider');
    const modelType = searchParams.get('type');

    // Try to get from cache first (only for default queries)
    if (!provider && !modelType && offset === 0 && limit === 50) {
      const cached = await getCachedModels();
      if (cached) {
        return NextResponse.json({ models: cached, cached: true });
      }
    }

    // Build conditions array
    const conditions: SQL[] = [];

    if (provider) {
      conditions.push(ilike(models.provider, `%${provider}%`));
    }

    if (modelType) {
      conditions.push(ilike(models.modelType, `%${modelType}%`));
    }

    // Execute query with conditions
    const result = conditions.length > 0
      ? await db
          .select()
          .from(models)
          .where(and(...conditions))
          .orderBy(desc(models.releaseDate))
          .limit(limit)
          .offset(offset)
      : await db
          .select()
          .from(models)
          .orderBy(desc(models.releaseDate))
          .limit(limit)
          .offset(offset);

    // Cache the default query result
    if (!provider && !modelType && offset === 0 && limit === 50) {
      await setCachedModels(result);
    }

    return NextResponse.json({ models: result, cached: false });
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    );
  }
}
