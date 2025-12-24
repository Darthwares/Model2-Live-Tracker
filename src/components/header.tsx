'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Cpu, Search, Filter, Github, Twitter, RefreshCw, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  onSearch?: (query: string) => void;
  onFilterProvider?: (provider: string | null) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  lastUpdated?: string;
}

const providers = [
  'All Providers',
  'OpenAI',
  'Anthropic',
  'Google',
  'Meta',
  'xAI',
  'Mistral',
  'Cohere',
  'AI21 Labs',
];

export function Header({
  onSearch,
  onFilterProvider,
  onRefresh,
  isRefreshing,
  lastUpdated,
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('All Providers');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
    setMobileSearchOpen(false);
  };

  const handleProviderSelect = (provider: string) => {
    setSelectedProvider(provider);
    onFilterProvider?.(provider === 'All Providers' ? null : provider);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex h-14 sm:h-16 items-center justify-between gap-2">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Cpu className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base sm:text-lg leading-none">Model Tracker</span>
              <span className="text-[10px] sm:text-xs text-muted-foreground hidden xs:block">AI Model Releases</span>
            </div>
          </Link>

          {/* Desktop Search and Filters */}
          <div className="hidden md:flex items-center gap-4 flex-1 max-w-xl mx-8">
            <form onSubmit={handleSearch} className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search models..."
                className="pl-10 pr-4"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  {selectedProvider}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by Provider</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {providers.map((provider) => (
                  <DropdownMenuItem
                    key={provider}
                    onClick={() => handleProviderSelect(provider)}
                    className={selectedProvider === provider ? 'bg-accent' : ''}
                  >
                    {provider}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Mobile Search Button */}
            <Dialog open={mobileSearchOpen} onOpenChange={setMobileSearchOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Search className="h-4 w-4" />
                  <span className="sr-only">Search</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Search Models</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search models..."
                      className="pl-10 pr-4"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Filter by Provider</p>
                    <div className="flex flex-wrap gap-2">
                      {providers.map((provider) => (
                        <Button
                          key={provider}
                          type="button"
                          variant={selectedProvider === provider ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleProviderSelect(provider)}
                        >
                          {provider}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Button type="submit" className="w-full">
                    Search
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            {/* Mobile Filter Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Filter className="h-4 w-4" />
                  <span className="sr-only">Filter</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by Provider</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {providers.map((provider) => (
                  <DropdownMenuItem
                    key={provider}
                    onClick={() => handleProviderSelect(provider)}
                    className={selectedProvider === provider ? 'bg-accent' : ''}
                  >
                    {provider}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {lastUpdated && (
              <span className="hidden lg:inline text-xs text-muted-foreground">
                Updated {lastUpdated}
              </span>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="relative"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="sr-only">Refresh</span>
            </Button>

            <div className="hidden sm:flex items-center gap-1">
              <Button variant="ghost" size="icon" asChild>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="h-4 w-4" />
                  <span className="sr-only">GitHub</span>
                </a>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Twitter className="h-4 w-4" />
                  <span className="sr-only">Twitter</span>
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
