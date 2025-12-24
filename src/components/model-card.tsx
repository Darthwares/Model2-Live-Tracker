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
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant="outline"
                className={providerColors[model.provider] || 'bg-gray-500/10 text-gray-400'}
              >
                {model.provider}
              </Badge>
              {model.isAvailable && (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                  Available
                </Badge>
              )}
            </div>
            <CardTitle className="text-xl group-hover:text-primary transition-colors">
              <Link href={`/model/${model.slug}`}>{model.name}</Link>
            </CardTitle>
            <CardDescription className="mt-1 flex items-center gap-2 text-sm">
              <Calendar className="h-3 w-3" />
              {format(new Date(model.releaseDate), 'MMM d, yyyy')}
              {model.modelType && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <Cpu className="h-3 w-3" />
                  {model.modelType}
                </>
              )}
              {model.parameters && (
                <>
                  <span className="text-muted-foreground">•</span>
                  {model.parameters}
                </>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {model.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {model.description}
          </p>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Key Benchmarks */}
        {Object.keys(benchmarks).length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="h-4 w-4" />
              Key Benchmarks
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(benchmarks)
                .slice(0, 3)
                .map(([key, value]) => (
                  <div
                    key={key}
                    className="bg-muted/50 rounded-md px-3 py-2 text-center"
                  >
                    <div className="text-xs text-muted-foreground uppercase">
                      {key}
                    </div>
                    <div className="text-lg font-semibold">{value}%</div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Highlights */}
        {highlights.length > 0 && (
          <div className="space-y-2">
            <ul className="text-sm text-muted-foreground space-y-1">
              {highlights.slice(0, 3).map((highlight, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span className="line-clamp-1">{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Separator />

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="default">
            <Link href={`/model/${model.slug}`}>
              View Details
            </Link>
          </Button>
          {model.documentationUrl && (
            <Button asChild size="sm" variant="outline">
              <a href={model.documentationUrl} target="_blank" rel="noopener noreferrer">
                <FileText className="h-3 w-3 mr-1" />
                Docs
              </a>
            </Button>
          )}
          {model.announcementUrl && (
            <Button asChild size="sm" variant="outline">
              <a href={model.announcementUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3 mr-1" />
                Announcement
              </a>
            </Button>
          )}
          {model.githubUrl && (
            <Button asChild size="sm" variant="outline">
              <a href={model.githubUrl} target="_blank" rel="noopener noreferrer">
                <Github className="h-3 w-3 mr-1" />
                GitHub
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
