import { NextRequest, NextResponse } from 'next/server';
import { db, models } from '@/lib/db';
import { getCachedModel, setCachedModel } from '@/lib/cache';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Try to get from cache first
    const cached = await getCachedModel(slug);
    if (cached) {
      return NextResponse.json({ model: cached, cached: true });
    }

    // Fetch from database
    const result = await db
      .select()
      .from(models)
      .where(eq(models.slug, slug))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    const model = result[0];

    // Cache the result
    await setCachedModel(slug, model);

    return NextResponse.json({ model, cached: false });
  } catch (error) {
    console.error('Error fetching model:', error);
    return NextResponse.json(
      { error: 'Failed to fetch model' },
      { status: 500 }
    );
  }
}
