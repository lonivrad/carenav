import type { Candidate } from "@/lib/rules/engine";
import type { ProgramRetrieval } from "@/lib/rag/retrieve";
import type { RelevanceLabel } from "@/lib/schema/report";

/**
 * Deterministic confidence labeling: rules result × retrieval quality ×
 * unknown count. The LLM proposes a relevance label; this module disposes —
 * the value returned here is what the report shows, always.
 */

/** Retrieval similarity at or above this reads as strong topical support. */
const STRONG_RETRIEVAL_SCORE = 0.6;

/** More missing fields than this caps a possibly-relevant program at low. */
const MAX_UNKNOWNS_FOR_MEDIUM = 2;

export function assignConfidence(
  candidate: Candidate,
  retrieval: ProgramRetrieval | undefined,
): RelevanceLabel {
  // No verified passages → never more than low, regardless of rules.
  if (!retrieval || retrieval.status === "retrieval_failed") return "low";
  const bestScore = retrieval.chunks[0]?.score ?? 0;

  if (candidate.status === "likely_relevant") {
    return bestScore >= STRONG_RETRIEVAL_SCORE ? "high" : "medium";
  }

  if (candidate.status === "possibly_relevant") {
    const fewUnknowns =
      candidate.unknownFields.length <= MAX_UNKNOWNS_FOR_MEDIUM;
    return fewUnknowns && bestScore >= STRONG_RETRIEVAL_SCORE
      ? "medium"
      : "low";
  }

  // Excluded programs are filtered before this point; defensively: low.
  return "low";
}
