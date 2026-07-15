import { NextResponse } from "next/server";

import { runScreening } from "@/lib/pipeline";
import { createRateLimiter } from "@/lib/rate-limit";
import { intakeSchema } from "@/lib/schema/intake";

/** Full pipeline endpoint: normalize → rules → RAG → LLM → report. */
export const maxDuration = 120;

// Each screening spends ~$0.11 of paid API, so guard against runaway callers.
// Per-instance, in-memory limiter — see the README's known limitations.
const RATE_LIMIT_MAX = Number(process.env.SCREEN_RATE_LIMIT_MAX ?? 5);
const RATE_LIMIT_WINDOW_MS = Number(
  process.env.SCREEN_RATE_LIMIT_WINDOW_MS ?? 60_000,
);
const checkRateLimit = createRateLimiter({
  limit: RATE_LIMIT_MAX,
  windowMs: RATE_LIMIT_WINDOW_MS,
});

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // First entry is the originating client; the rest are proxies.
    return forwarded.split(",")[0]!.trim();
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function POST(request: Request): Promise<NextResponse> {
  const limit = checkRateLimit(clientKey(request));
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: "rate_limited",
        message:
          "Too many screening requests from this address. Each report calls " +
          "paid APIs; please wait before trying again.",
        retryAfterSeconds: limit.retryAfterSeconds,
      },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = intakeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "invalid_intake",
        details: parsed.error.issues.map(
          (i) => `${i.path.join(".")}: ${i.message}`,
        ),
      },
      { status: 400 },
    );
  }

  try {
    const report = await runScreening(parsed.data);
    return NextResponse.json({ report });
  } catch (err) {
    // Fail loud, leak nothing: validation already retried once inside.
    console.error("screening failed:", err);
    return NextResponse.json({ error: "screening_failed" }, { status: 502 });
  }
}
