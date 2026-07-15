/**
 * Per-key fixed-window rate limiter.
 *
 * In-memory only: state lives in a Map on the current server instance, so in a
 * multi-instance / serverless deployment the effective limit is per instance,
 * not global. That is an accepted tradeoff for a lightweight abuse guard on a
 * paid endpoint — see the README's known limitations.
 */

export interface RateLimitResult {
  /** Whether this request is permitted. */
  allowed: boolean;
  /** Configured maximum requests per window. */
  limit: number;
  /** Requests remaining in the current window (never negative). */
  remaining: number;
  /** Epoch ms at which the current window resets. */
  resetAt: number;
  /** Whole seconds until the window resets (0 when allowed). */
  retryAfterSeconds: number;
}

export interface RateLimiterOptions {
  /** Maximum requests permitted within each window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

interface WindowState {
  count: number;
  windowStart: number;
}

/**
 * Create a fixed-window limiter. Each returned `check` call records one hit for
 * the given key and reports whether it stayed within the limit. Pass `now` in
 * tests for deterministic control over window boundaries.
 */
export function createRateLimiter(options: RateLimiterOptions) {
  const { limit, windowMs } = options;
  // In-memory map is acceptable here because serverless instances are
  // short-lived; a production deployment would back this with a shared store
  // like Redis so the limit holds across instances.
  const buckets = new Map<string, WindowState>();

  return function check(key: string, now: number = Date.now()): RateLimitResult {
    const existing = buckets.get(key);

    let state: WindowState;
    if (!existing || now - existing.windowStart >= windowMs) {
      state = { count: 0, windowStart: now };
    } else {
      state = existing;
    }

    state.count += 1;
    buckets.set(key, state);

    const resetAt = state.windowStart + windowMs;
    const allowed = state.count <= limit;

    return {
      allowed,
      limit,
      remaining: Math.max(0, limit - state.count),
      resetAt,
      retryAfterSeconds: allowed
        ? 0
        : Math.max(1, Math.ceil((resetAt - now) / 1000)),
    };
  };
}
