import { NextResponse } from "next/server";

/** Full pipeline endpoint: normalize → rules → RAG → LLM. */
export async function POST(): Promise<NextResponse> {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
