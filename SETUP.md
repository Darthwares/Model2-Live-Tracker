# Model Tracker Setup Guide

This guide will help you complete the setup for the AI Model Tracker application.

## Prerequisites

- Vercel CLI installed (already available)
- Access to Vercel, Neon, and Upstash accounts

## Step 1: Create Neon Postgres Database

1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project or use existing one
3. Copy the **DATABASE_URL** connection string
4. The format should be: `postgresql://username:password@hostname/database?sslmode=require`

## Step 2: Create Upstash Redis Cache

1. Go to [Upstash Console](https://console.upstash.com/)
2. Create a new Redis database
3. Copy the **REST URL** and **REST Token**

## Step 3: Deploy to Vercel

Run these commands in the project directory:

```bash
cd /home/chibionos/model2/model-tracker

# Link to Vercel (choose "Create new project")
vercel link

# Add environment variables to Vercel
vercel env add DATABASE_URL
vercel env add UPSTASH_REDIS_REST_URL
vercel env add UPSTASH_REDIS_REST_TOKEN
vercel env add PERPLEXITY_API_KEY
vercel env add GOOGLE_GEMINI_API_KEY
vercel env add GROK_API_KEY
vercel env add OPENAI_API_KEY
vercel env add FIRECRAWL_API_KEY
vercel env add TAVILY_API_KEY
vercel env add JINA_API_KEY
vercel env add CRON_SECRET

# Deploy
vercel --prod
```

### Alternative: Use Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Import the project from your Git repository
3. Add the following environment variables in Settings > Environment Variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon Postgres connection string |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST Token |
| `PERPLEXITY_API_KEY` | Your Perplexity API key |
| `GOOGLE_GEMINI_API_KEY` | Your Google Gemini API key |
| `GROK_API_KEY` | Your xAI Grok API key |
| `OPENAI_API_KEY` | Your OpenAI API key |
| `FIRECRAWL_API_KEY` | Your Firecrawl API key |
| `TAVILY_API_KEY` | Your Tavily API key |
| `JINA_API_KEY` | Your Jina API key |
| `CRON_SECRET` | A random secret for cron authentication |

## Step 4: Push Database Schema

After setting up the DATABASE_URL, run:

```bash
npm run db:push
```

This will create all the necessary tables in your Neon database.

## Step 5: Verify Cron Job

The cron job is configured to run every 4 hours at minute 0. You can verify it in:
- Vercel Dashboard > Project > Settings > Cron Jobs

The cron configuration is in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/fetch-models",
      "schedule": "0 */4 * * *"
    }
  ]
}
```

## Step 6: Test Manually (Optional)

To manually trigger the cron job for testing:

```bash
curl -X POST https://your-domain.vercel.app/api/cron/fetch-models \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Project Structure

```
model-tracker/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── cron/fetch-models/   # Cron job endpoint
│   │   │   └── models/              # Models API
│   │   ├── model/[slug]/            # Model detail pages
│   │   └── page.tsx                 # Homepage with timeline
│   ├── components/                  # UI components
│   │   ├── header.tsx
│   │   ├── timeline.tsx
│   │   ├── model-card.tsx
│   │   └── sidebar-filters.tsx
│   └── lib/
│       ├── db/                      # Database (Neon + Drizzle)
│       ├── cache/                   # Redis cache (Upstash)
│       └── ai/                      # AI research agents
│           ├── research-agent.ts    # Perplexity, Grok, Gemini
│           └── scraper.ts           # Tavily, Jina scrapers
├── drizzle.config.ts
├── vercel.json                      # Cron configuration
└── .env.local                       # Environment variables
```

## Features

- **AI Research Agents**: Uses Perplexity for news discovery, Grok for detailed research, and Gemini for content generation
- **Automatic Updates**: Cron job runs every 4 hours to fetch new model releases
- **Caching**: Redis caching with Upstash for fast page loads
- **Timeline View**: Chronological display of model releases
- **Detail Pages**: Comprehensive model information with benchmarks, pricing, and social posts
- **Filtering**: Filter by provider, model type, and search

## API Keys Used

| Service | Purpose |
|---------|---------|
| Perplexity | Searching for latest AI model releases |
| xAI Grok | Detailed model research and benchmarks |
| Google Gemini | Content generation and social post analysis |
| Tavily | Web search for additional context |
| Jina | Web page scraping for documentation |
| Firecrawl | Alternative web scraping |
