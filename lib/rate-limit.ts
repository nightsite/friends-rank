type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 20;

export function rateLimitLogin(key: string): { ok: true } | { ok: false; retryAfter: number } {
  const now = Date.now();
  let b = store.get(key);
  if (!b || now > b.resetAt) {
    b = { count: 0, resetAt: now + WINDOW_MS };
    store.set(key, b);
  }
  b.count += 1;
  if (b.count > MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((b.resetAt - now) / 1000);
    return { ok: false, retryAfter: Math.max(1, retryAfter) };
  }
  return { ok: true };
}
