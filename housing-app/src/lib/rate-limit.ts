// In-process sliding-window rate limiter, per implementation_plan.md Phase 5
// ("not a Redis-backed limiter, since caching infra is out of scope").
// Known limitation (flagged in the implementation_plan.md review): this is
// per-instance, so it stops being effective once the API runs behind a load
// balancer across multiple Node processes — acceptable for a single-instance
// MVP deployment, revisit if/when horizontal scaling lands.

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 5;

const hits = new Map<string, number[]>();

export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);

  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    hits.set(key, timestamps);
    return true;
  }

  timestamps.push(now);
  hits.set(key, timestamps);
  return false;
}

export function rateLimitKeyFromRequest(request: Request, extra?: string): string {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  return extra ? `${ip}:${extra}` : ip;
}
