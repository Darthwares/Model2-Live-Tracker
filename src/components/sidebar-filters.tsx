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
    <div className="space-y-3 sm:space-y-6">
      {/* Quick Stats - Horizontal on mobile, vertical on desktop */}
      <Card>
        <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
          <CardTitle className="text-xs sm:text-sm font-medium">Quick Stats</CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
          <div className="flex flex-row lg:flex-col gap-3 sm:gap-3 lg:space-y-3">
            <div className="flex-1 lg:flex-none flex items-center justify-between text-xs sm:text-sm bg-muted/50 lg:bg-transparent rounded-lg p-2 lg:p-0">
              <span className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Total Models</span>
                <span className="sm:hidden">Models</span>
              </span>
              <span className="font-semibold">{stats?.totalModels ?? 0}</span>
            </div>
            <div className="flex-1 lg:flex-none flex items-center justify-between text-xs sm:text-sm bg-muted/50 lg:bg-transparent rounded-lg p-2 lg:p-0">
              <span className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
                <span className="hidden sm:inline">Today&apos;s Releases</span>
                <span className="sm:hidden">Today</span>
              </span>
              <Badge variant="secondary" className="text-[10px] sm:text-xs">{stats?.todayReleases ?? 0}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Providers Filter */}
      <Card>
        <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs sm:text-sm font-medium">Providers</CardTitle>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-[10px] sm:text-xs text-muted-foreground hover:text-foreground"
                onClick={onClearFilters}
              >
                Clear all
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
          {/* Horizontal scrollable on mobile, vertical list on desktop */}
          <div className="flex flex-wrap lg:flex-col gap-1.5 sm:gap-2 lg:space-y-2">
            {(stats?.providers ?? []).map(({ name, count }) => (
              <button
                key={name}
                onClick={() => onProviderToggle(name)}
                className={`flex items-center justify-between text-xs sm:text-sm py-1 sm:py-1.5 px-2 sm:px-2 rounded-md transition-colors lg:w-full ${
                  selectedProviders.includes(name)
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted bg-muted/50 lg:bg-transparent'
                }`}
              >
                <span className="whitespace-nowrap">{name}</span>
                <Badge variant="outline" className="text-[10px] sm:text-xs ml-1.5 sm:ml-2">
                  {count}
                </Badge>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Model Types Filter */}
      <Card>
        <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
          <CardTitle className="text-xs sm:text-sm font-medium">Model Types</CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
          {/* Horizontal scrollable on mobile, vertical list on desktop */}
          <div className="flex flex-wrap lg:flex-col gap-1.5 sm:gap-2 lg:space-y-2">
            {(stats?.types ?? []).map(({ name, count }) => (
              <button
                key={name}
                onClick={() => onTypeToggle(name)}
                className={`flex items-center justify-between text-xs sm:text-sm py-1 sm:py-1.5 px-2 sm:px-2 rounded-md transition-colors lg:w-full ${
                  selectedTypes.includes(name)
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted bg-muted/50 lg:bg-transparent'
                }`}
              >
                <span className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
                  {typeIcons[name] || <Brain className="h-3 w-3 sm:h-4 sm:w-4" />}
                  {name}
                </span>
                <Badge variant="outline" className="text-[10px] sm:text-xs ml-1.5 sm:ml-2">
                  {count}
                </Badge>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator className="hidden lg:block" />

      {/* Recent Activity - Hidden on mobile to save space */}
      <Card className="hidden lg:block">
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
