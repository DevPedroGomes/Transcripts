import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const rateLimit = {
  api: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, "10 s"),
    analytics: true,
    prefix: "@upstash/ratelimit",
  }),
  transcription: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, "1 m"),
    analytics: true,
    prefix: "@upstash/ratelimit/transcription",
  }),
  auth: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, "1 m"),
    analytics: true,
    prefix: "@upstash/ratelimit/auth",
  }),
};

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
};

export async function checkRateLimit(
  identifier: string,
  type: 'api' | 'transcription' | 'auth' = 'api'
): Promise<RateLimitResult> {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn("Upstash Redis credentials not found. Rate limiting disabled.");
    return {
      success: true,
      limit: 100,
      remaining: 99,
      reset: 0,
      retryAfter: 0,
    };
  }

  try {
    const result = await rateLimit[type].limit(identifier);
    const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      retryAfter: retryAfter > 0 ? retryAfter : 0,
    };
  } catch (error) {
    console.error("Rate limit error:", error);
    return {
      success: true,
      limit: 10,
      remaining: 10,
      reset: 0,
      retryAfter: 0,
    };
  }
}

export function getClientIp(request: Request): string {
  const headers = request.headers;
  const xForwardedFor = headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  const cfConnectingIP = headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  const xRealIP = headers.get('x-real-ip');
  if (xRealIP) {
    return xRealIP;
  }
  return '127.0.0.1';
}

export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.reset / 1000).toString(),
  };

  if (result.retryAfter) {
    headers['Retry-After'] = result.retryAfter.toString();
  }

  return headers;
}
