import { z } from "zod";

/** A citation pointing at a specific corpus chunk. Every claim must carry one. */
export const citationSchema = z.object({
  chunkId: z.string(),
  documentId: z.string(),
});

export const confidenceSchema = z.enum(["low", "medium", "high"]);

/** One program the LLM explains. It may only reference programs it was given. */
export const programEntrySchema = z.object({
  programId: z.string(),
  /** "appears worth investigating" framing only — never eligibility claims. */
  explanation: z.string(),
  confidence: confidenceSchema,
  citations: z.array(citationSchema).min(1),
});

/** Explicit unknowns — missing user data is surfaced, never guessed. */
export const unknownEntrySchema = z.object({
  field: z.string(),
  whyItMatters: z.string(),
});

/**
 * Structured LLM output (Layer 3). Validated with one retry, then hard failure.
 */
export const reportSchema = z.object({
  programs: z.array(programEntrySchema),
  unknowns: z.array(unknownEntrySchema),
  nextSteps: z.array(z.string()),
});

export type Citation = z.infer<typeof citationSchema>;
export type Confidence = z.infer<typeof confidenceSchema>;
export type ProgramEntry = z.infer<typeof programEntrySchema>;
export type UnknownEntry = z.infer<typeof unknownEntrySchema>;
export type Report = z.infer<typeof reportSchema>;
