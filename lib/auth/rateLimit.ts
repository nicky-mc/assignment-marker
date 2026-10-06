// A modest per-user limit on marking, in memory (resets on restart, per server instance).
const LIMIT = 60;
const WINDOW_MS = 60 * 60 * 1000;
const hits = new Map<string, number[]>();

export function checkRateLimit(key: string, now = Date.now()): { ok: true } | { ok: false; retryAfterMinutes: number } {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= LIMIT) {
    hits.set(key, recent);
    return { ok: false, retryAfterMinutes: Math.max(1, Math.ceil((recent[0] + WINDOW_MS - now) / 60000)) };
  }
  recent.push(now);
  hits.set(key, recent);
  return { ok: true };
}

export const MARKS_PER_HOUR = LIMIT;
