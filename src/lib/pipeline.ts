import type { Intake } from "@/lib/schema/intake";
import type { Report } from "@/lib/schema/report";

/**
 * Orchestrates the full screening pipeline:
 * normalize intake → rules (Layer 1) → RAG (Layer 2) → LLM (Layer 3).
 */
export async function runScreening(intake: Intake): Promise<Report> {
  void intake;
  throw new Error("Not implemented");
}
