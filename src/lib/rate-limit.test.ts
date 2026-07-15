import { describe, expect, it } from "vitest";

import { createRateLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
  it("allows requests up to the limit within a window", () => {
    const check = createRateLimiter({ limit: 3, windowMs: 60_000 });

    expect(check("a", 0).allowed).toBe(true);
    expect(check("a", 100).allowed).toBe(true);
    const third = check("a", 200);
    expect(third.allowed).toBe(true);
    expect(third.remaining).toBe(0);
  });

  it("blocks the request that exceeds the limit", () => {
    const check = createRateLimiter({ limit: 2, windowMs: 60_000 });

    check("a", 0);
    check("a", 10);
    const blocked = check("a", 20);

    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("reports retryAfterSeconds counting down to the window reset", () => {
    const check = createRateLimiter({ limit: 1, windowMs: 60_000 });

    check("a", 0);
    const blocked = check("a", 15_000);

    // Window resets at 60_000; 45s remain, rounded up.
    expect(blocked.resetAt).toBe(60_000);
    expect(blocked.retryAfterSeconds).toBe(45);
  });

  it("resets the count once the window elapses", () => {
    const check = createRateLimiter({ limit: 1, windowMs: 60_000 });

    expect(check("a", 0).allowed).toBe(true);
    expect(check("a", 30_000).allowed).toBe(false);
    // At exactly windowMs the window rolls over.
    expect(check("a", 60_000).allowed).toBe(true);
  });

  it("tracks keys independently", () => {
    const check = createRateLimiter({ limit: 1, windowMs: 60_000 });

    expect(check("a", 0).allowed).toBe(true);
    expect(check("b", 0).allowed).toBe(true);
    expect(check("a", 1).allowed).toBe(false);
    expect(check("b", 1).allowed).toBe(false);
  });
});
