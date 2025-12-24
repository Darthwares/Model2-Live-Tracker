import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import type { Model } from '@/lib/db/schema';

// Check if Redis is configured
function isRedisConfigured(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

// Lazy-load Redis client
let _redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!isRedisConfigured()) {
    return null;
  }
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return _redis;
}

// Rate limiter (lazy-loaded, returns null if Redis not configured)
let _ratelimit: Ratelimit | null = null;

export function getRatelimit(): Ratelimit | null {
  if (!isRedisConfigured()) {
    return null;
  }
  if (!_ratelimit) {
    _ratelimit = new Ratelimit({
      redis: getRedis()!,
      limiter: Ratelimit.slidingWindow(10, '10 s'),
      analytics: true,
    });
  }
  return _ratelimit;
}

// Export functions
export { getRedis as redis, isRedisConfigured, getRatelimit as ratelimit };

// Cache keys
const CACHE_KEYS = {
  LATEST_MODELS: 'latest_models',
  MODEL_DETAIL: (slug: string) => `model:${slug}`,
  TIMELINE: 'timeline',
  LAST_FETCH: 'last_fetch_time',
};

// Cache TTL (in seconds)
const CACHE_TTL = {
  LATEST_MODELS: 60 * 5, // 5 minutes
  MODEL_DETAIL: 60 * 15, // 15 minutes
  TIMELINE: 60 * 2, // 2 minutes
};

// Cache functions - all return null/void gracefully if Redis not configured
export async function getCachedModels(): Promise<Model[] | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    const cached = await redis.get<Model[]>(CACHE_KEYS.LATEST_MODELS);
    return cached;
  } catch (error) {
    console.error('Error getting cached models:', error);
    return null;
  }
}

export async function setCachedModels(models: Model[]): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(CACHE_KEYS.LATEST_MODELS, models, {
      ex: CACHE_TTL.LATEST_MODELS,
    });
  } catch (error) {
    console.error('Error setting cached models:', error);
  }
}

export async function getCachedModel(slug: string): Promise<Model | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    const cached = await redis.get<Model>(CACHE_KEYS.MODEL_DETAIL(slug));
    return cached;
  } catch (error) {
    console.error('Error getting cached model:', error);
    return null;
  }
}

export async function setCachedModel(slug: string, model: Model): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(CACHE_KEYS.MODEL_DETAIL(slug), model, {
      ex: CACHE_TTL.MODEL_DETAIL,
    });
  } catch (error) {
    console.error('Error setting cached model:', error);
  }
}

export async function invalidateCache(): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    const keys = await redis.keys('model:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    await redis.del(CACHE_KEYS.LATEST_MODELS);
    await redis.del(CACHE_KEYS.TIMELINE);
  } catch (error) {
    console.error('Error invalidating cache:', error);
  }
}

export async function setLastFetchTime(): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(CACHE_KEYS.LAST_FETCH, new Date().toISOString());
  } catch (error) {
    console.error('Error setting last fetch time:', error);
  }
}

export async function getLastFetchTime(): Promise<string | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    return await redis.get<string>(CACHE_KEYS.LAST_FETCH);
  } catch (error) {
    console.error('Error getting last fetch time:', error);
    return null;
  }
}
