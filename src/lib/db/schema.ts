import { pgTable, text, timestamp, uuid, jsonb, boolean, integer, serial } from 'drizzle-orm/pg-core';

// AI Model releases table
export const models = pgTable('models', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  provider: text('provider').notNull(), // OpenAI, Anthropic, Google, Meta, xAI, Mistral, etc.
  releaseDate: timestamp('release_date').notNull(),
  announcementDate: timestamp('announcement_date'),

  // Model details
  description: text('description'),
  modelType: text('model_type'), // LLM, VLM, Image, Audio, Video, Multimodal
  parameters: text('parameters'), // e.g., "70B", "405B"
  contextWindow: integer('context_window'), // in tokens

  // Availability
  isAvailable: boolean('is_available').default(false),
  apiEndpoint: text('api_endpoint'),
  pricingInfo: jsonb('pricing_info'), // { input: 0.003, output: 0.015 }

  // Documentation and links
  documentationUrl: text('documentation_url'),
  announcementUrl: text('announcement_url'),
  paperUrl: text('paper_url'),
  huggingfaceUrl: text('huggingface_url'),
  githubUrl: text('github_url'),

  // Benchmarks
  benchmarks: jsonb('benchmarks'), // { mmlu: 89.5, humaneval: 92.1, ... }

  // Social media posts
  socialPosts: jsonb('social_posts'), // [{ platform: 'twitter', url: '...', content: '...' }]

  // Comparisons with other models
  comparisons: jsonb('comparisons'), // [{ modelId: '...', comparison: '...' }]

  // Full research content
  fullContent: text('full_content'), // Markdown content for detail page

  // Metadata
  imageUrl: text('image_url'),
  tags: jsonb('tags'), // ['reasoning', 'coding', 'vision']
  highlights: jsonb('highlights'), // Key features/improvements

  // Tracking
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  fetchedAt: timestamp('fetched_at').defaultNow(), // When data was last fetched
});

// Daily news feed entries
export const newsEntries = pgTable('news_entries', {
  id: serial('id').primaryKey(),
  modelId: uuid('model_id').references(() => models.id),
  title: text('title').notNull(),
  summary: text('summary'),
  content: text('content'),
  sourceUrl: text('source_url'),
  sourceName: text('source_name'),
  publishedAt: timestamp('published_at').notNull(),
  newsType: text('news_type'), // 'release', 'update', 'announcement', 'benchmark', 'comparison'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Cron job execution log
export const cronLogs = pgTable('cron_logs', {
  id: serial('id').primaryKey(),
  jobType: text('job_type').notNull(),
  status: text('status').notNull(), // 'success', 'error', 'partial'
  modelsFound: integer('models_found').default(0),
  modelsAdded: integer('models_added').default(0),
  errorMessage: text('error_message'),
  executionTimeMs: integer('execution_time_ms'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Types
export type Model = typeof models.$inferSelect;
export type NewModel = typeof models.$inferInsert;
export type NewsEntry = typeof newsEntries.$inferSelect;
export type NewNewsEntry = typeof newsEntries.$inferInsert;
export type CronLog = typeof cronLogs.$inferSelect;
