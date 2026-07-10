import type { ProgramEntry, RelevanceLabel } from "@/lib/schema/report";

/**
 * Presentation-only helpers for ordering and counting programs by their
 * (already-derived) relevance label. These never compute or alter relevance —
 * that is done deterministically in confidence.ts. They only sort/count the
 * labels the report already carries, for a scannable UI.
 */
export const RELEVANCE_RANK: Record<RelevanceLabel, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export const RELEVANCE_ORDER: RelevanceLabel[] = ["high", "medium", "low"];

/** Highest relevance first; stable within a label (preserves input order). */
export function sortByRelevance(programs: ProgramEntry[]): ProgramEntry[] {
  return [...programs].sort(
    (a, b) => RELEVANCE_RANK[a.relevanceLabel] - RELEVANCE_RANK[b.relevanceLabel],
  );
}

export function relevanceCounts(
  programs: ProgramEntry[],
): Record<RelevanceLabel, number> {
  const counts: Record<RelevanceLabel, number> = { high: 0, medium: 0, low: 0 };
  for (const p of programs) counts[p.relevanceLabel]++;
  return counts;
}
