import type { Profile } from "@/lib/schema/profile";
import {
  programs,
  type ProgramRules,
  type RuleOutcome,
} from "@/lib/rules/programs";

/**
 * Layer 1: deterministic candidate selection. Pure functions — no LLM, no I/O.
 *
 * Classification:
 * - likely_relevant   — every rule passes
 * - possibly_relevant — no rule fails, but at least one is unknown
 *                       (unknownFields lists what's missing)
 * - excluded          — at least one rule hard-fails (failedRules names them)
 */

export type CandidateStatus =
  | "likely_relevant"
  | "possibly_relevant"
  | "excluded";

export interface RuleResult {
  ruleId: string;
  description: string;
  outcome: RuleOutcome;
  fields: readonly string[];
}

export interface Candidate {
  programId: string;
  programName: string;
  corpusDocumentId: string;
  status: CandidateStatus;
  ruleResults: RuleResult[];
  /** Profile fields (deduplicated) behind unknown outcomes. */
  unknownFields: string[];
  /** Ids of the rules that failed (nonempty exactly when excluded). */
  failedRules: string[];
  /**
   * Reporting-only facts copied from the program definition — requirements a
   * professional must verify regardless of rule outcomes. Never used for
   * classification, confidence, or ranking.
   */
  alwaysNeeded: string[];
}

export function evaluateProgram(
  program: ProgramRules,
  profile: Profile,
): Candidate {
  const ruleResults: RuleResult[] = program.rules.map((rule) => ({
    ruleId: rule.id,
    description: rule.description,
    outcome: rule.evaluate(profile),
    fields: rule.fields,
  }));

  const failedRules = ruleResults
    .filter((r) => r.outcome === "fail")
    .map((r) => r.ruleId);
  const unknownFields = [
    ...new Set(
      ruleResults
        .filter((r) => r.outcome === "unknown")
        .flatMap((r) => r.fields),
    ),
  ];

  const status: CandidateStatus =
    failedRules.length > 0
      ? "excluded"
      : unknownFields.length > 0
        ? "possibly_relevant"
        : "likely_relevant";

  return {
    programId: program.programId,
    programName: program.programName,
    corpusDocumentId: program.corpusDocumentId,
    status,
    ruleResults,
    unknownFields,
    failedRules,
    alwaysNeeded: [...(program.alwaysNeeded ?? [])],
  };
}

export function selectCandidates(
  profile: Profile,
  registry: readonly ProgramRules[] = programs,
): Candidate[] {
  return registry.map((program) => evaluateProgram(program, profile));
}
