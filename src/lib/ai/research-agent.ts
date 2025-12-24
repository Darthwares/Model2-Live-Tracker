import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { NewModel } from '@/lib/db/schema';

// Lazy-loaded AI clients
let _perplexity: OpenAI | null = null;
let _grok: OpenAI | null = null;
let _genAI: GoogleGenerativeAI | null = null;

function getPerplexity(): OpenAI {
  if (!_perplexity) {
    _perplexity = new OpenAI({
      apiKey: process.env.PERPLEXITY_API_KEY,
      baseURL: 'https://api.perplexity.ai',
    });
  }
  return _perplexity;
}

function getGrok(): OpenAI {
  if (!_grok) {
    // Use OpenAI as fallback if Grok API key not available or has issues
    if (process.env.GROK_API_KEY) {
      _grok = new OpenAI({
        apiKey: process.env.GROK_API_KEY,
        baseURL: 'https://api.x.ai/v1',
      });
    } else {
      // Fallback to OpenAI
      _grok = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }
  return _grok;
}

function getOpenAI(): OpenAI {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

function getGenAI(): GoogleGenerativeAI {
  if (!_genAI) {
    _genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
  }
  return _genAI;
}

// Types for model discovery
interface DiscoveredModel {
  name: string;
  provider: string;
  releaseDate: string;
  description: string;
  sourceUrl?: string;
}

interface ModelDetails {
  description: string;
  modelType: string;
  parameters?: string;
  contextWindow?: number;
  benchmarks: Record<string, number>;
  documentationUrl?: string;
  announcementUrl?: string;
  paperUrl?: string;
  pricingInfo?: { input: number; output: number };
  highlights: string[];
  socialPosts: { platform: string; url: string; content: string }[];
  comparisons: { model: string; comparison: string }[];
}

// Search for latest model releases using Perplexity
export async function searchLatestModelReleases(): Promise<DiscoveredModel[]> {
  const today = new Date().toISOString().split('T')[0];
  return searchModelReleasesForPeriod(today, today);
}

// Search for model releases within a specific date range
export async function searchModelReleasesForPeriod(
  startDate: string,
  endDate: string
): Promise<DiscoveredModel[]> {
  try {
    const response = await getPerplexity().chat.completions.create({
      model: 'sonar-pro',
      messages: [
        {
          role: 'system',
          content: `You are an AI model release tracker. Search for AI model releases and announcements within the specified date range. Focus on major providers like OpenAI, Anthropic, Google, Meta, xAI, Mistral, Cohere, AI21 Labs, DeepSeek, Stability AI, Runway, ElevenLabs, and other notable AI labs.

Return ONLY a valid JSON array of discovered models. Each object must have:
- name: Full model name (e.g., "GPT-4.5", "Claude 3.5 Sonnet", "Gemini 2.0 Pro")
- provider: Company name
- releaseDate: ISO date string (YYYY-MM-DD format)
- description: Brief description of the model and its key capabilities
- sourceUrl: URL to the announcement, blog post, or documentation

Include all types: language models, vision models, audio/speech models, video models, image generation models, and multimodal models.
If no models were released in the period, return an empty array [].`,
        },
        {
          role: 'user',
          content: `Find ALL AI models released or announced between ${startDate} and ${endDate} (inclusive). Be comprehensive - include major releases, updates, and new versions. Search news, blog posts, and announcements. Return as JSON array.`,
        },
      ],
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content || '[]';

    // Extract JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch (error) {
    console.error('Error searching for model releases with Perplexity:', error);
    return [];
  }
}

// Get detailed information about a model using Grok (with OpenAI fallback)
export async function getModelDetailsWithGrok(
  modelName: string,
  provider: string
): Promise<Partial<ModelDetails>> {
  // Try Grok first, fall back to OpenAI
  const clients = [
    { client: getGrok(), model: 'grok-2-latest', name: 'Grok' },
    { client: getOpenAI(), model: 'gpt-4o-mini', name: 'OpenAI' },
  ];

  for (const { client, model, name } of clients) {
    try {
      const response = await client.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: `You are an expert AI researcher. Provide detailed, accurate information about AI models. Include benchmarks, pricing, capabilities, and comparisons. Always cite sources when possible.`,
          },
          {
            role: 'user',
            content: `Research the AI model "${modelName}" by ${provider}. Provide:
1. Detailed description of capabilities
2. Model type (LLM, VLM, multimodal, etc.)
3. Parameter count if known
4. Context window size
5. Key benchmarks (MMLU, HumanEval, GPQA, etc.) with scores
6. Documentation URL
7. Paper URL if available
8. Pricing information (input/output per million tokens)
9. 3-5 key highlights or improvements
10. Comparisons with similar models

Return as JSON object with these fields: description, modelType, parameters, contextWindow, benchmarks (object), documentationUrl, paperUrl, pricingInfo (object with input/output), highlights (array), comparisons (array of {model, comparison}).`,
          },
        ],
        temperature: 0.2,
      });

      const content = response.choices[0]?.message?.content || '{}';

      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        console.log(`Got model details using ${name}`);
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error(`Error getting model details with ${name}:`, error);
      // Continue to next client
    }
  }
  return {};
}

// Get social media posts about a model (with OpenAI fallback)
export async function getSocialPostsWithGemini(
  modelName: string,
  provider: string
): Promise<{ platform: string; url: string; content: string }[]> {
  const prompt = `Search for recent social media posts (Twitter/X, LinkedIn, Reddit) about the AI model "${modelName}" by ${provider}.

Return a JSON array of posts with:
- platform: "twitter", "linkedin", or "reddit"
- url: URL to the post
- content: Brief summary of the post content

If no posts found, return empty array [].
Only return the JSON array, no other text.`;

  // Try Gemini first
  try {
    const model = getGenAI().getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const result = await model.generateContent(prompt);
    const content = result.response.text();
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      console.log('Got social posts using Gemini');
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('Error getting social posts with Gemini, trying OpenAI:', error);
  }

  // Fallback to OpenAI
  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    });
    const content = response.choices[0]?.message?.content || '[]';
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      console.log('Got social posts using OpenAI');
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('Error getting social posts with OpenAI:', error);
  }

  return [];
}

// Generate full content page for a model (with OpenAI fallback)
export async function generateModelContent(
  modelName: string,
  provider: string,
  details: Partial<ModelDetails>
): Promise<string> {
  const prompt = `Write a comprehensive article about the AI model "${modelName}" by ${provider}.

Use this information as context:
${JSON.stringify(details, null, 2)}

Structure the article with these sections:
1. Overview - Introduction and key capabilities
2. Technical Specifications - Parameters, context window, architecture
3. Benchmark Results - Performance on standard benchmarks
4. Pricing & Availability - How to access and costs
5. Key Improvements - What's new compared to previous versions
6. Comparisons - How it stacks up against competitors
7. Getting Started - Quick start guide and links

Write in markdown format. Be accurate and cite sources where possible.
Keep it informative but concise (around 1000-1500 words).`;

  // Try Gemini first
  try {
    const model = getGenAI().getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const result = await model.generateContent(prompt);
    console.log('Generated content using Gemini');
    return result.response.text();
  } catch (error) {
    console.error('Error generating content with Gemini, trying OpenAI:', error);
  }

  // Fallback to OpenAI
  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });
    console.log('Generated content using OpenAI');
    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error generating content with OpenAI:', error);
  }

  return '';
}

// Main research function that orchestrates all AI agents
export async function researchModel(
  modelName: string,
  provider: string,
  releaseDate: string,
  sourceUrl?: string
): Promise<Partial<NewModel>> {
  console.log(`Researching model: ${modelName} by ${provider}`);

  // Run research in parallel
  const [details, socialPosts] = await Promise.all([
    getModelDetailsWithGrok(modelName, provider),
    getSocialPostsWithGemini(modelName, provider),
  ]);

  // Generate full content
  const fullContent = await generateModelContent(modelName, provider, details);

  // Create slug from model name
  const slug = modelName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return {
    name: modelName,
    slug,
    provider,
    releaseDate: new Date(releaseDate),
    announcementDate: new Date(releaseDate),
    description: details.description || `${modelName} by ${provider}`,
    modelType: details.modelType || 'LLM',
    parameters: details.parameters,
    contextWindow: details.contextWindow,
    documentationUrl: details.documentationUrl,
    announcementUrl: sourceUrl,
    paperUrl: details.paperUrl,
    benchmarks: details.benchmarks || {},
    pricingInfo: details.pricingInfo || {},
    socialPosts: socialPosts || [],
    comparisons: details.comparisons || [],
    highlights: details.highlights || [],
    fullContent,
    tags: [details.modelType?.toLowerCase() || 'llm', provider.toLowerCase()],
    isAvailable: true,
    fetchedAt: new Date(),
  };
}

// Fetch all new models for today
export async function fetchNewModels(): Promise<Partial<NewModel>[]> {
  console.log('Starting model discovery...');

  // Search for new model releases
  const discoveredModels = await searchLatestModelReleases();

  console.log(`Discovered ${discoveredModels.length} potential new models`);

  if (discoveredModels.length === 0) {
    return [];
  }

  // Research each discovered model
  const researchedModels: Partial<NewModel>[] = [];

  for (const discovered of discoveredModels) {
    try {
      const modelData = await researchModel(
        discovered.name,
        discovered.provider,
        discovered.releaseDate,
        discovered.sourceUrl
      );
      researchedModels.push(modelData);
    } catch (error) {
      console.error(`Error researching model ${discovered.name}:`, error);
    }
  }

  return researchedModels;
}

// Helper to get date ranges for a month
function getWeekRangesForMonth(year: number, month: number): { start: string; end: string }[] {
  const ranges: { start: string; end: string }[] = [];
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  let currentStart = new Date(firstDay);

  while (currentStart <= lastDay) {
    const currentEnd = new Date(currentStart);
    currentEnd.setDate(currentEnd.getDate() + 6);

    // Don't go past the last day of the month
    if (currentEnd > lastDay) {
      currentEnd.setTime(lastDay.getTime());
    }

    ranges.push({
      start: currentStart.toISOString().split('T')[0],
      end: currentEnd.toISOString().split('T')[0],
    });

    // Move to next week
    currentStart = new Date(currentEnd);
    currentStart.setDate(currentStart.getDate() + 1);
  }

  return ranges;
}

// Backfill models for a specific month
export async function backfillModelsForMonth(
  year: number,
  month: number,
  onProgress?: (message: string) => void
): Promise<Partial<NewModel>[]> {
  const log = onProgress || console.log;
  log(`Starting backfill for ${year}-${String(month).padStart(2, '0')}...`);

  const weekRanges = getWeekRangesForMonth(year, month);
  const allDiscoveredModels: DiscoveredModel[] = [];

  // Search week by week to get more comprehensive results
  for (const range of weekRanges) {
    log(`Searching for models: ${range.start} to ${range.end}`);

    try {
      const models = await searchModelReleasesForPeriod(range.start, range.end);
      log(`Found ${models.length} models in this period`);
      allDiscoveredModels.push(...models);

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      log(`Error searching period ${range.start} to ${range.end}: ${error}`);
    }
  }

  // Deduplicate by model name
  const uniqueModels = new Map<string, DiscoveredModel>();
  for (const model of allDiscoveredModels) {
    const key = `${model.name.toLowerCase()}-${model.provider.toLowerCase()}`;
    if (!uniqueModels.has(key)) {
      uniqueModels.set(key, model);
    }
  }

  log(`Total unique models discovered: ${uniqueModels.size}`);

  // Research each discovered model
  const researchedModels: Partial<NewModel>[] = [];
  const modelsArray = Array.from(uniqueModels.values());

  for (let i = 0; i < modelsArray.length; i++) {
    const discovered = modelsArray[i];
    log(`Researching (${i + 1}/${modelsArray.length}): ${discovered.name} by ${discovered.provider}`);

    try {
      const modelData = await researchModel(
        discovered.name,
        discovered.provider,
        discovered.releaseDate,
        discovered.sourceUrl
      );
      researchedModels.push(modelData);

      // Delay between research calls
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      log(`Error researching model ${discovered.name}: ${error}`);
    }
  }

  log(`Backfill complete. Researched ${researchedModels.length} models.`);
  return researchedModels;
}

// Backfill models for a date range
export async function backfillModelsForDateRange(
  startDate: string,
  endDate: string,
  onProgress?: (message: string) => void
): Promise<Partial<NewModel>[]> {
  const log = onProgress || console.log;
  log(`Starting backfill from ${startDate} to ${endDate}...`);

  // Search the full date range
  const discoveredModels = await searchModelReleasesForPeriod(startDate, endDate);
  log(`Discovered ${discoveredModels.length} potential models`);

  if (discoveredModels.length === 0) {
    return [];
  }

  // Research each discovered model
  const researchedModels: Partial<NewModel>[] = [];

  for (let i = 0; i < discoveredModels.length; i++) {
    const discovered = discoveredModels[i];
    log(`Researching (${i + 1}/${discoveredModels.length}): ${discovered.name} by ${discovered.provider}`);

    try {
      const modelData = await researchModel(
        discovered.name,
        discovered.provider,
        discovered.releaseDate,
        discovered.sourceUrl
      );
      researchedModels.push(modelData);

      // Delay between research calls
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      log(`Error researching model ${discovered.name}: ${error}`);
    }
  }

  log(`Backfill complete. Researched ${researchedModels.length} models.`);
  return researchedModels;
}
