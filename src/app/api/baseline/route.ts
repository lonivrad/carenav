import { NextResponse } from "next/server";

import { keywordSearch } from "@/lib/baseline/search";

/** Baseline keyword-search endpoint for evaluation comparisons. */
export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const query = (body as { query?: unknown })?.query;
  if (typeof query !== "string" || query.trim().length === 0) {
    return NextResponse.json({ error: "missing_query" }, { status: 400 });
  }

  const results = keywordSearch(query);
  return NextResponse.json({ results });
}
