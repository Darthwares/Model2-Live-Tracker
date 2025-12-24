'use client';

import { ModelCard } from './model-card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import type { Model } from '@/lib/db/schema';

interface TimelineProps {
  models: Model[];
  isLoading?: boolean;
}

function groupModelsByDate(models: Model[]): Record<string, Model[]> {
  const groups: Record<string, Model[]> = {};

  for (const model of models) {
    const date = format(new Date(model.releaseDate), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(model);
  }

  return groups;
}

function formatDateLabel(dateStr: string): string {
  const date = parseISO(dateStr);

  if (isToday(date)) {
    return 'Today';
  }

  if (isYesterday(date)) {
    return 'Yesterday';
  }

  return format(date, 'EEEE, MMMM d, yyyy');
}

function TimelineSkeleton() {
  return (
    <div className="space-y-8">
      {[1, 2, 3].map((i) => (
        <div key={i} className="relative pl-8 pb-8 border-l-2 border-muted last:border-l-0 last:pb-0">
          <div className="absolute left-0 top-0 -translate-x-1/2 w-4 h-4 rounded-full bg-muted" />
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Timeline({ models, isLoading }: TimelineProps) {
  if (isLoading) {
    return <TimelineSkeleton />;
  }

  if (models.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🤖</div>
        <h3 className="text-xl font-semibold mb-2">No Models Yet</h3>
        <p className="text-muted-foreground">
          Check back soon for the latest AI model releases.
        </p>
      </div>
    );
  }

  const groupedModels = groupModelsByDate(models);
  const sortedDates = Object.keys(groupedModels).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-8">
      {sortedDates.map((date, index) => {
        const dateModels = groupedModels[date];
        const isFirst = index === 0;

        return (
          <div
            key={date}
            className="relative pl-8 pb-8 border-l-2 border-muted last:border-l-0 last:pb-0"
          >
            {/* Timeline dot */}
            <div
              className={`absolute left-0 top-0 -translate-x-1/2 w-4 h-4 rounded-full border-2 ${
                isFirst
                  ? 'bg-primary border-primary animate-pulse'
                  : 'bg-background border-muted-foreground'
              }`}
            />

            {/* Date header */}
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-semibold">{formatDateLabel(date)}</h2>
              <Badge variant="secondary" className="text-xs">
                {dateModels.length} {dateModels.length === 1 ? 'release' : 'releases'}
              </Badge>
            </div>

            {/* Models for this date */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {dateModels.map((model) => (
                <ModelCard key={model.id} model={model} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
