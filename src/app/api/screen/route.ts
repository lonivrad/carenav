import { NextResponse } from "next/server";

import { runScreening } from "@/lib/pipeline";
import { intakeSchema } from "@/lib/schema/intake";

/** Full pipeline endpoint: normalize → rules → RAG → LLM → report. */
export const maxDuration = 120;

export async function POST(request: Request): Promise<NextResponse> {
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
