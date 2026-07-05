import { NextResponse } from "next/server";

/** Baseline keyword-search endpoint for evaluation comparisons. */
export async function POST(): Promise<NextResponse> {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
