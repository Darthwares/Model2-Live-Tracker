'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, Clock, Zap, Brain, Eye, Music, Video, Layers } from 'lucide-react';

interface SidebarFiltersProps {
  selectedProviders: string[];
  selectedTypes: string[];
  onProviderToggle: (provider: string) => void;
  onTypeToggle: (type: string) => void;
  onClearFilters: () => void;
  stats?: {
    totalModels: number;
    todayReleases: number;
    providers: { name: string; count: number }[];
    types: { name: string; count: number }[];
  };
}

const typeIcons: Record<string, React.ReactNode> = {
  LLM: <Brain className="h-4 w-4" />,
  VLM: <Eye className="h-4 w-4" />,
  Audio: <Music className="h-4 w-4" />,
  Video: <Video className="h-4 w-4" />,
  Multimodal: <Layers className="h-4 w-4" />,
};

export function SidebarFilters({
  selectedProviders,
  selectedTypes,
  onProviderToggle,
  onTypeToggle,
  onClearFilters,
  stats,
}: SidebarFiltersProps) {
  const hasActiveFilters = selectedProviders.length > 0 || selectedTypes.length > 0;

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4" />
              Total Models
            </span>
            <span className="font-semibold">{stats?.totalModels ?? 0}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Zap className="h-4 w-4 text-yellow-500" />
              Today&apos;s Releases
            </span>
            <Badge variant="secondary">{stats?.todayReleases ?? 0}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Providers Filter */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Providers</CardTitle>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                onClick={onClearFilters}
              >
                Clear all
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {(stats?.providers ?? []).map(({ name, count }) => (
            <button
              key={name}
              onClick={() => onProviderToggle(name)}
              className={`w-full flex items-center justify-between text-sm py-1.5 px-2 rounded-md transition-colors ${
                selectedProviders.includes(name)
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-muted'
              }`}
            >
              <span>{name}</span>
              <Badge variant="outline" className="text-xs">
                {count}
              </Badge>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Model Types Filter */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Model Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(stats?.types ?? []).map(({ name, count }) => (
            <button
              key={name}
              onClick={() => onTypeToggle(name)}
              className={`w-full flex items-center justify-between text-sm py-1.5 px-2 rounded-md transition-colors ${
                selectedTypes.includes(name)
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-muted'
              }`}
            >
              <span className="flex items-center gap-2">
                {typeIcons[name] || <Brain className="h-4 w-4" />}
                {name}
              </span>
              <Badge variant="outline" className="text-xs">
                {count}
              </Badge>
            </button>
          ))}
        </CardContent>
      </Card>

      <Separator />

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Auto-updating
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            New models are automatically fetched every 4 hours. Last check performed
            by our AI research agents using Perplexity, Grok, and Gemini.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
