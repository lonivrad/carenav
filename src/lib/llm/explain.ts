import type { Candidate } from "@/lib/rules/engine";
import type { ProgramRetrieval } from "@/lib/rag/retrieve";
import type { Report } from "@/lib/schema/report";

/**
 * Layer 3: ask the model to explain and prioritize the candidates it is given.
 * It never adds programs and never asserts eligibility. Output is validated
 * against reportSchema with one retry, then hard failure.
 */
export async function explainCandidates(input: {
  candidates: Candidate[];
  retrievals: ProgramRetrieval[];
}): Promise<Report> {
  void input;
  throw new Error("Not implemented");
}
