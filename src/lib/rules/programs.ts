import type { Profile } from "@/lib/schema/profile";

/** Result of a single rule predicate against a profile field. */
export type RuleOutcome = "match" | "no-match" | "unknown";

export interface Program {
  id: string;
  name: string;
  /** Corpus document this program's facts come from. */
  corpusDocumentId: string;
  /** Deterministic predicates. No LLM logic here, ever. */
  predicates: ReadonlyArray<(profile: Profile) => RuleOutcome>;
}

/** Registry of Washington-state eldercare funding programs. */
export const programs: readonly Program[] = [
  // TODO: wa-medicaid-copes, wa-cares-fund, va-aid-attendance, medicare-home-health, ...
];
