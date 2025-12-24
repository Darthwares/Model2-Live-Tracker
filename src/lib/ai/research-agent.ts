import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { NewModel } from '@/lib/db/schema';

// Initialize AI clients
const perplexity = new OpenAI({
  apiKey: process.env.PERPLEXITY_API_KEY,
  baseURL: 'https://api.perplexity.ai',
});

const grok = new OpenAI({
  apiKey: process.env.GROK_API_KEY,
  baseURL: 'https://api.x.ai/v1',
});

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

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

  try {
    const response = await perplexity.chat.completions.create({
      model: 'sonar-pro',
      messages: [
        {
          role: 'system',
          content: `You are an AI model release tracker. Search for the latest AI model releases and announcements from today or the past 24 hours. Focus on major providers like OpenAI, Anthropic, Google, Meta, xAI, Mistral, Cohere, AI21 Labs, and emerging labs.

Return ONLY a valid JSON array of discovered models. Each object must have:
- name: Full model name (e.g., "GPT-4.5", "Claude 4", "Gemini 2.0 Pro")
- provider: Company name
- releaseDate: ISO date string
- description: Brief description of the model
- sourceUrl: URL to the announcement or documentation

If no new models were released today, return an empty array [].`,
        },
        {
          role: 'user',
          content: `Find all AI models released or announced on ${today} or in the past 24 hours. Include language models, vision models, audio models, and multimodal models. Return as JSON array.`,
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

// Get detailed information about a model using Grok
export async function getModelDetailsWithGrok(
  modelName: string,
  provider: string
): Promise<Partial<ModelDetails>> {
  try {
    const response = await grok.chat.completions.create({
      model: 'grok-2-latest',
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
      return JSON.parse(jsonMatch[0]);
    }
    return {};
  } catch (error) {
    console.error('Error getting model details with Grok:', error);
    return {};
  }
}

// Get social media posts about a model using Gemini
export async function getSocialPostsWithGemini(
  modelName: string,
  provider: string
): Promise<{ platform: string; url: string; content: string }[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const result = await model.generateContent(`
      Search for recent social media posts (Twitter/X, LinkedIn, Reddit) about the AI model "${modelName}" by ${provider}.

      Return a JSON array of posts with:
      - platform: "twitter", "linkedin", or "reddit"
      - url: URL to the post
      - content: Brief summary of the post content

      If no posts found, return empty array [].
      Only return the JSON array, no other text.
    `);

    const content = result.response.text();

    // Extract JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch (error) {
    console.error('Error getting social posts with Gemini:', error);
    return [];
  }
}

// Generate full content page for a model using Gemini
export async function generateModelContent(
  modelName: string,
  provider: string,
  details: Partial<ModelDetails>
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const result = await model.generateContent(`
      Write a comprehensive article about the AI model "${modelName}" by ${provider}.

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
      Keep it informative but concise (around 1000-1500 words).
    `);

    return result.response.text();
  } catch (error) {
    console.error('Error generating model content:', error);
    return '';
  }
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
