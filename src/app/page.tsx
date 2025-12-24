'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/header';
import { Timeline } from '@/components/timeline';
import { SidebarFilters } from '@/components/sidebar-filters';
import type { Model } from '@/lib/db/schema';
import { formatDistanceToNow, isToday } from 'date-fns';

interface ModelStats {
  totalModels: number;
  todayReleases: number;
  providers: { name: string; count: number }[];
  types: { name: string; count: number }[];
}

export default function Home() {
  const [models, setModels] = useState<Model[]>([]);
  const [filteredModels, setFilteredModels] = useState<Model[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<ModelStats>({
    totalModels: 0,
    todayReleases: 0,
    providers: [],
    types: [],
  });

  // Fetch models from API
  const fetchModels = useCallback(async () => {
    try {
      const response = await fetch('/api/models');
      const data = await response.json();

      if (data.models) {
        setModels(data.models);
        calculateStats(data.models);
        setLastUpdated(
          data.cached
            ? 'from cache'
            : formatDistanceToNow(new Date(), { addSuffix: true })
        );
      }
    } catch (error) {
      console.error('Error fetching models:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Calculate stats from models
  const calculateStats = (modelList: Model[]) => {
    const providerCounts: Record<string, number> = {};
    const typeCounts: Record<string, number> = {};
    let todayCount = 0;

    for (const model of modelList) {
      // Count by provider
      providerCounts[model.provider] = (providerCounts[model.provider] || 0) + 1;

      // Count by type
      if (model.modelType) {
        typeCounts[model.modelType] = (typeCounts[model.modelType] || 0) + 1;
      }

      // Count today's releases
      if (isToday(new Date(model.releaseDate))) {
        todayCount++;
      }
    }

    setStats({
      totalModels: modelList.length,
      todayReleases: todayCount,
      providers: Object.entries(providerCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      types: Object.entries(typeCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
    });
  };

  // Filter models based on current filters
  useEffect(() => {
    let filtered = [...models];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (model) =>
          model.name.toLowerCase().includes(query) ||
          model.provider.toLowerCase().includes(query) ||
          model.description?.toLowerCase().includes(query)
      );
    }

    // Filter by providers
    if (selectedProviders.length > 0) {
      filtered = filtered.filter((model) =>
        selectedProviders.includes(model.provider)
      );
    }

    // Filter by types
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(
        (model) => model.modelType && selectedTypes.includes(model.modelType)
      );
    }

    setFilteredModels(filtered);
  }, [models, searchQuery, selectedProviders, selectedTypes]);

  // Initial fetch
  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchModels();
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Handle provider filter
  const handleProviderToggle = (provider: string) => {
    setSelectedProviders((prev) =>
      prev.includes(provider)
        ? prev.filter((p) => p !== provider)
        : [...prev, provider]
    );
  };

  // Handle type filter
  const handleTypeToggle = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSelectedProviders([]);
    setSelectedTypes([]);
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        onSearch={handleSearch}
        onFilterProvider={(provider) => {
          if (provider) {
            setSelectedProviders([provider]);
          } else {
            setSelectedProviders([]);
          }
        }}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        lastUpdated={lastUpdated}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full lg:w-72 shrink-0">
            <div className="sticky top-24">
              <SidebarFilters
                selectedProviders={selectedProviders}
                selectedTypes={selectedTypes}
                onProviderToggle={handleProviderToggle}
                onTypeToggle={handleTypeToggle}
                onClearFilters={handleClearFilters}
                stats={stats}
              />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">AI Model Releases</h1>
              <p className="text-muted-foreground">
                Track the latest AI model releases from leading labs. Updated every 4 hours.
              </p>
            </div>

            <Timeline models={filteredModels} isLoading={isLoading} />
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Powered by AI research agents using Perplexity, Grok, and Gemini.
            </p>
            <p className="text-sm text-muted-foreground">
              Data sourced from official announcements and documentation.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
