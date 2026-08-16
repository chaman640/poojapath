/**
 * Simple in-memory rate limiter (sliding window).
 *
 * Render ke single instance ke liye kaafi hai. Agar aap aage chal kar
 * multiple instances chalayein, to isko Redis (Upstash) se replace karein —
 * interface wahi rahega.
 */

type Entry = { hits: number[]; blockedUntil?: number };

const buckets = new Map<string, Entry>();
let lastSweep = Date.now();

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, entry] of buckets) {
    const fresh = entry.hits.filter((t) => now - t < 3_600_000);
    if (fresh.length === 0 && (!entry.blockedUntil || entry.blockedUntil < now)) {
      buckets.delete(key);
    } else {
      entry.hits = fresh;
    }
  }
}

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export function rateLimit(
  key: string,
  { limit, windowMs, blockMs = 0 }: { limit: number; windowMs: number; blockMs?: number },
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const entry = buckets.get(key) ?? { hits: [] };

  if (entry.blockedUntil && entry.blockedUntil > now) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((entry.blockedUntil - now) / 1000),
    };
  }

  entry.hits = entry.hits.filter((t) => now - t < windowMs);

  if (entry.hits.length >= limit) {
    if (blockMs > 0) entry.blockedUntil = now + blockMs;
    buckets.set(key, entry);
    const retry = entry.blockedUntil
      ? Math.ceil((entry.blockedUntil - now) / 1000)
      : Math.ceil((windowMs - (now - entry.hits[0])) / 1000);
    return { ok: false, remaining: 0, retryAfterSeconds: Math.max(retry, 1) };
  }

  entry.hits.push(now);
  buckets.set(key, entry);
  return { ok: true, remaining: limit - entry.hits.length, retryAfterSeconds: 0 };
}

/** Proxy ke peeche client IP nikalna (Render/Cloudflare ke headers) */
export function clientIp(req: Request): string {
  const h = req.headers;
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return h.get("cf-connecting-ip") || h.get("x-real-ip") || "unknown";
}
