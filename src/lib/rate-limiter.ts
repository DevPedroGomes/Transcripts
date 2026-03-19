import { NextRequest } from 'next/server';

const stores = new Map<string, Map<string, number[]>>();

export function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',').pop()?.trim() ||
    'unknown'
  );
}

export function checkRateLimit(
  ip: string,
  endpointKey: string,
  opts: { maxRequests: number; windowMs: number }
): { limited: boolean; reason?: string } {
  const now = Date.now();

  if (!stores.has(endpointKey)) {
    stores.set(endpointKey, new Map());
  }
  const store = stores.get(endpointKey)!;

  // Clean up old entries across all IPs periodically
  if (Math.random() < 0.1) {
    for (const [key, timestamps] of store) {
      const filtered = timestamps.filter((t) => now - t < opts.windowMs);
      if (filtered.length === 0) store.delete(key);
      else store.set(key, filtered);
    }
  }

  const timestamps = (store.get(ip) || []).filter((t) => now - t < opts.windowMs);

  if (timestamps.length >= opts.maxRequests) {
    const oldestInWindow = timestamps[0];
    const retryAfter = Math.ceil((opts.windowMs - (now - oldestInWindow)) / 1000);
    return {
      limited: true,
      reason: `Limite de requisicoes atingido. Tente novamente em ${retryAfter}s.`,
    };
  }

  timestamps.push(now);
  store.set(ip, timestamps);
  return { limited: false };
}
