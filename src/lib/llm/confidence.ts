import type { Confidence } from "@/lib/schema/report";
import type { Candidate } from "@/lib/rules/engine";

/**
 * Assign a confidence label from rule outcomes and retrieval quality.
 * Deterministic — the LLM never chooses its own confidence.
 */
export function assignConfidence(candidate: Candidate): Confidence {
  void candidate;
  throw new Error("Not implemented");
}
