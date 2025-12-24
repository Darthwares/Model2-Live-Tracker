'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  ExternalLink,
  FileText,
  Github,
  TrendingUp,
  Cpu,
  MessageSquare,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import type { Model } from '@/lib/db/schema';

interface ModelCardProps {
  model: Model;
}

const providerColors: Record<string, string> = {
  OpenAI: 'bg-green-500/10 text-green-500 border-green-500/20',
  Anthropic: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  Google: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  Meta: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  xAI: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  Mistral: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  Cohere: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
};

export function ModelCard({ model }: ModelCardProps) {
  const benchmarks = (model.benchmarks || {}) as Record<string, number>;
  const highlights = (model.highlights || []) as string[];
  const tags = (model.tags || []) as string[];

  return (
    <Card className="group hover:border-primary/50 transition-all duration-300">
      <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
        <div className="flex items-start justify-between gap-2 sm:gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
              <Badge
                variant="outline"
                className={`text-[10px] sm:text-xs ${providerColors[model.provider] || 'bg-gray-500/10 text-gray-400'}`}
              >
                {model.provider}
              </Badge>
              {model.isAvailable && (
                <Badge variant="outline" className="text-[10px] sm:text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                  Available
                </Badge>
              )}
            </div>
            <CardTitle className="text-base sm:text-xl group-hover:text-primary transition-colors truncate">
              <Link href={`/model/${model.slug}`}>{model.name}</Link>
            </CardTitle>
            <CardDescription className="mt-1 flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-sm">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 shrink-0" />
                {format(new Date(model.releaseDate), 'MMM d, yyyy')}
              </span>
              {model.modelType && (
                <>
                  <span className="text-muted-foreground hidden sm:inline">•</span>
                  <span className="flex items-center gap-1">
                    <Cpu className="h-3 w-3 shrink-0" />
                    {model.modelType}
                  </span>
                </>
              )}
              {model.parameters && (
                <span className="hidden sm:inline text-muted-foreground">
                  • {model.parameters}
                </span>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6 pb-3 sm:pb-6">
        {model.description && (
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
            {model.description}
          </p>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 4).map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-[10px] sm:text-xs">
                {tag}
              </Badge>
            ))}
            {tags.length > 4 && (
              <Badge variant="secondary" className="text-[10px] sm:text-xs">
                +{tags.length - 4}
              </Badge>
            )}
          </div>
        )}

        {/* Key Benchmarks */}
        {Object.keys(benchmarks).length > 0 && (
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
              Key Benchmarks
            </div>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {Object.entries(benchmarks)
                .slice(0, 3)
                .map(([key, value]) => (
                  <div
                    key={key}
                    className="bg-muted/50 rounded-md px-1.5 sm:px-3 py-1.5 sm:py-2 text-center"
                  >
                    <div className="text-[9px] sm:text-xs text-muted-foreground uppercase truncate">
                      {key}
                    </div>
                    <div className="text-sm sm:text-lg font-semibold">{value}%</div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Highlights - Hidden on very small screens */}
        {highlights.length > 0 && (
          <div className="space-y-1.5 sm:space-y-2 hidden sm:block">
            <ul className="text-xs sm:text-sm text-muted-foreground space-y-0.5 sm:space-y-1">
              {highlights.slice(0, 2).map((highlight, i) => (
                <li key={i} className="flex items-start gap-1.5 sm:gap-2">
                  <span className="text-primary mt-0.5 sm:mt-1">•</span>
                  <span className="line-clamp-1">{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Separator />

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <Button asChild size="sm" variant="default" className="text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3">
            <Link href={`/model/${model.slug}`}>
              View Details
            </Link>
          </Button>
          {model.documentationUrl && (
            <Button asChild size="sm" variant="outline" className="text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3">
              <a href={model.documentationUrl} target="_blank" rel="noopener noreferrer">
                <FileText className="h-3 w-3 mr-1" />
                Docs
              </a>
            </Button>
          )}
          {model.announcementUrl && (
            <Button asChild size="sm" variant="outline" className="text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3 hidden sm:inline-flex">
              <a href={model.announcementUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3 mr-1" />
                News
              </a>
            </Button>
          )}
          {model.githubUrl && (
            <Button asChild size="sm" variant="outline" className="text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3">
              <a href={model.githubUrl} target="_blank" rel="noopener noreferrer">
                <Github className="h-3 w-3" />
                <span className="sr-only sm:not-sr-only sm:ml-1">GitHub</span>
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
