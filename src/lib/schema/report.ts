import { z } from "zod";

/**
 * Report schemas (Layer 3 output).
 *
 * Two layers:
 * - llmReportSchema — what the model must return (validated with one retry,
 *   then hard failure). The model proposes relevance; it never decides it.
 * - reportSchema — the final report served to the UI: LLM content merged with
 *   deterministic confidence labels, provenance links, rule unknowns, and the
 *   fixed disclaimer. Assembled in pipeline.ts, never by the model.
 */

export const relevanceLabelValues = ["high", "medium", "low"] as const;
export const relevanceLabelSchema = z.enum(relevanceLabelValues);
export type RelevanceLabel = z.infer<typeof relevanceLabelSchema>;

/**
 * One factual sentence about a program, mapped to the corpus chunks that
 * support it. Every factual claim must carry at least one chunk id —
 * enforced structurally here and cross-checked against the retrieval set.
 */
export const citedClaimSchema = z.object({
  text: z.string(),
  chunkIds: z.array(z.string()),
});
export type CitedClaim = z.infer<typeof citedClaimSchema>;

/** Per-program content produced by the LLM. */
export const llmProgramSchema = z.object({
  programId: z.string(),
  /** Proposed only — confidence.ts derives the final label deterministically. */
  proposedRelevance: relevanceLabelSchema,
  /** Plain-English "why this may apply" — must reference profile facts. */
  whyThisMayApply: z.string(),
  /** "What it generally covers" — factual claims, each cited to chunks. */
  whatItCovers: z.array(citedClaimSchema),
  /** What is still needed, phrased for the family (from rule unknowns). */
  informationStillNeeded: z.array(z.string()),
  /** Concrete next-step actions grounded in the retrieved chunks. */
  nextSteps: z.array(z.string()),
});
export type LlmProgram = z.infer<typeof llmProgramSchema>;

/** Full structured output required from the model. */
export const llmReportSchema = z.object({
  overallSummary: z.string(),
  /** Required when critical fields were unknown; may be empty otherwise. */
  followUpQuestions: z.array(z.string()),
  programs: z.array(llmProgramSchema),
});
export type LlmReport = z.infer<typeof llmReportSchema>;

/** Final per-program entry after deterministic post-processing. */
export const programEntrySchema = z.object({
  programId: z.string(),
  programName: z.string(),
  /** "unverified" when retrieval failed — no coverage claims are shown. */
  status: z.enum(["ok", "unverified"]),
  /** Final label — derived by confidence.ts, not by the model. */
  relevanceLabel: relevanceLabelSchema,
  whyThisMayApply: z.string(),
  whatItCovers: z.array(citedClaimSchema),
  informationStillNeeded: z.array(z.string()),
  /** All chunk ids cited by this entry (deduplicated). */
  citations: z.array(z.string()),
  nextSteps: z.array(z.string()),
  /** Official source URLs from corpus provenance (never model-generated). */
  officialLinks: z.array(z.string()),
});
export type ProgramEntry = z.infer<typeof programEntrySchema>;

export const reportSchema = z.object({
  overallSummary: z.string(),
  programs: z.array(programEntrySchema),
  /** Missing profile fields aggregated from the rules engine. */
  unknowns: z.array(z.string()),
  followUpQuestions: z.array(z.string()),
  disclaimer: z.string(),
});
export type Report = z.infer<typeof reportSchema>;

export const REPORT_DISCLAIMER =
  "This screening is educational only. It identifies programs that appear " +
  "worth investigating based on the information provided — it does not " +
  "determine eligibility, provide legal or financial advice, or estimate " +
  "benefit amounts. Program rules and dollar limits change; verify current " +
  "details with the program's official contacts before making decisions, " +
  "and consider consulting an elder-law attorney, benefits counselor, or " +
  "the Community Living Connections line (1-855-567-0252).";

/** Kept for backward compatibility with UI components. */
export type Confidence = RelevanceLabel;
export const confidenceSchema = relevanceLabelSchema;
