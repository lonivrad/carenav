import { z } from "zod";

/**
 * Raw questionnaire answers exactly as submitted by the intake flow.
 * Fields are intentionally permissive here; normalization happens in profile.ts.
 */
export const intakeSchema = z.object({
  answers: z.record(z.string(), z.unknown()),
});

export type Intake = z.infer<typeof intakeSchema>;
