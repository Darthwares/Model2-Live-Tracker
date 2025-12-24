import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db, models } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { ModelDetailClient } from './model-detail-client';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const result = await db
      .select()
      .from(models)
      .where(eq(models.slug, slug))
      .limit(1);

    if (result.length === 0) {
      return { title: 'Model Not Found' };
    }

    const model = result[0];

    return {
      title: `${model.name} - Model Tracker`,
      description: model.description || `Details about ${model.name} by ${model.provider}`,
      openGraph: {
        title: model.name,
        description: model.description || `AI Model by ${model.provider}`,
        images: model.imageUrl ? [model.imageUrl] : [],
      },
    };
  } catch {
    return { title: 'Model Not Found' };
  }
}

export default async function ModelPage({ params }: PageProps) {
  const { slug } = await params;

  try {
    const result = await db
      .select()
      .from(models)
      .where(eq(models.slug, slug))
      .limit(1);

    if (result.length === 0) {
      notFound();
    }

    const model = result[0];

    return <ModelDetailClient model={model} />;
  } catch {
    notFound();
  }
}
