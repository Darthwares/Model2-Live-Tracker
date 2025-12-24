'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Calendar,
  Cpu,
  ExternalLink,
  FileText,
  Github,
  Twitter,
  Linkedin,
  MessageSquare,
  TrendingUp,
  DollarSign,
  BookOpen,
  Sparkles,
  BarChart3,
  Users,
} from 'lucide-react';
import type { Model } from '@/lib/db/schema';

interface ModelDetailClientProps {
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

const platformIcons: Record<string, React.ReactNode> = {
  twitter: <Twitter className="h-4 w-4" />,
  linkedin: <Linkedin className="h-4 w-4" />,
  reddit: <MessageSquare className="h-4 w-4" />,
};

export function ModelDetailClient({ model }: ModelDetailClientProps) {
  const benchmarks = (model.benchmarks || {}) as Record<string, number>;
  const highlights = (model.highlights || []) as string[];
  const tags = (model.tags || []) as string[];
  const socialPosts = (model.socialPosts || []) as { platform: string; url: string; content: string }[];
  const comparisons = (model.comparisons || []) as { model: string; comparison: string }[];
  const pricingInfo = (model.pricingInfo || {}) as { input?: number; output?: number };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back to home</span>
              </Link>
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold">{model.name}</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Badge
              variant="outline"
              className={providerColors[model.provider] || 'bg-gray-500/10 text-gray-400'}
            >
              {model.provider}
            </Badge>
            {model.isAvailable && (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                Available Now
              </Badge>
            )}
            {model.modelType && (
              <Badge variant="secondary">
                <Cpu className="h-3 w-3 mr-1" />
                {model.modelType}
              </Badge>
            )}
            {model.parameters && (
              <Badge variant="secondary">{model.parameters}</Badge>
            )}
          </div>

          <h1 className="text-4xl font-bold mb-4">{model.name}</h1>

          <div className="flex items-center gap-4 text-muted-foreground mb-6">
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Released {format(new Date(model.releaseDate), 'MMMM d, yyyy')}
            </span>
            {model.contextWindow && (
              <span>
                Context: {(model.contextWindow / 1000).toFixed(0)}K tokens
              </span>
            )}
          </div>

          {model.description && (
            <p className="text-lg text-muted-foreground max-w-3xl">
              {model.description}
            </p>
          )}

          {/* Quick Links */}
          <div className="flex flex-wrap gap-3 mt-6">
            {model.documentationUrl && (
              <Button asChild>
                <a href={model.documentationUrl} target="_blank" rel="noopener noreferrer">
                  <FileText className="h-4 w-4 mr-2" />
                  Documentation
                </a>
              </Button>
            )}
            {model.announcementUrl && (
              <Button variant="outline" asChild>
                <a href={model.announcementUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Announcement
                </a>
              </Button>
            )}
            {model.paperUrl && (
              <Button variant="outline" asChild>
                <a href={model.paperUrl} target="_blank" rel="noopener noreferrer">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Research Paper
                </a>
              </Button>
            )}
            {model.githubUrl && (
              <Button variant="outline" asChild>
                <a href={model.githubUrl} target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4 mr-2" />
                  GitHub
                </a>
              </Button>
            )}
          </div>
        </div>

        <Separator className="my-8" />

        {/* Tabs Section */}
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="flex-wrap h-auto gap-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="comparisons">Comparisons</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Key Highlights */}
              {highlights.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-yellow-500" />
                      Key Highlights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {highlights.map((highlight, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm shrink-0">
                            {i + 1}
                          </div>
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Tags */}
              {tags.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Capabilities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-sm">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Full Content */}
            {model.fullContent && (
              <Card>
                <CardHeader>
                  <CardTitle>Full Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-neutral dark:prose-invert max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: model.fullContent }} />
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Benchmarks Tab */}
          <TabsContent value="benchmarks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Benchmark Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(benchmarks).length > 0 ? (
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Object.entries(benchmarks).map(([key, value]) => (
                      <div
                        key={key}
                        className="bg-muted/50 rounded-lg p-4 text-center"
                      >
                        <div className="text-xs uppercase text-muted-foreground mb-1">
                          {key}
                        </div>
                        <div className="text-3xl font-bold">{value}%</div>
                        <div className="w-full bg-muted rounded-full h-2 mt-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(value, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No benchmark data available yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Pricing Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pricingInfo.input || pricingInfo.output ? (
                  <div className="grid sm:grid-cols-2 gap-6">
                    {pricingInfo.input && (
                      <div className="bg-muted/50 rounded-lg p-6 text-center">
                        <div className="text-sm text-muted-foreground mb-2">
                          Input Price
                        </div>
                        <div className="text-3xl font-bold">
                          ${pricingInfo.input}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          per 1M tokens
                        </div>
                      </div>
                    )}
                    {pricingInfo.output && (
                      <div className="bg-muted/50 rounded-lg p-6 text-center">
                        <div className="text-sm text-muted-foreground mb-2">
                          Output Price
                        </div>
                        <div className="text-3xl font-bold">
                          ${pricingInfo.output}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          per 1M tokens
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Pricing information not available yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Comparisons Tab */}
          <TabsContent value="comparisons" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Model Comparisons
                </CardTitle>
              </CardHeader>
              <CardContent>
                {comparisons.length > 0 ? (
                  <div className="space-y-4">
                    {comparisons.map((comp, i) => (
                      <div key={i} className="border rounded-lg p-4">
                        <div className="font-medium mb-2 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          vs {comp.model}
                        </div>
                        <p className="text-muted-foreground">{comp.comparison}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No comparison data available yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Tab */}
          <TabsContent value="social" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Social Media Posts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {socialPosts.length > 0 ? (
                  <div className="space-y-4">
                    {socialPosts.map((post, i) => (
                      <a
                        key={i}
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {platformIcons[post.platform] || <ExternalLink className="h-4 w-4" />}
                          <span className="font-medium capitalize">{post.platform}</span>
                        </div>
                        <p className="text-muted-foreground line-clamp-3">
                          {post.content}
                        </p>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No social media posts found yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-muted-foreground">
            Last updated: {format(new Date(model.updatedAt), 'MMM d, yyyy h:mm a')}
          </div>
        </div>
      </footer>
    </div>
  );
}
