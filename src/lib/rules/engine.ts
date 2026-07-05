import type { Profile } from "@/lib/schema/profile";
import type { Program, RuleOutcome } from "@/lib/rules/programs";

export interface Candidate {
  program: Program;
  /** Per-predicate outcomes, preserved so unknowns surface downstream. */
  outcomes: RuleOutcome[];
}

/**
 * Layer 1: deterministic candidate selection.
 * A program is excluded only on a definite "no-match"; unknowns keep it in
 * play and are reported as unknowns, never guessed around.
 */
export function selectCandidates(
  profile: Profile,
  registry: readonly Program[],
): Candidate[] {
  void profile;
  void registry;
  throw new Error("Not implemented");
}
