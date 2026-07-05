import { z } from "zod";

/**
 * A field the family did not answer is represented explicitly as "unknown" —
 * never inferred or defaulted.
 */
export const unknownable = <T extends z.ZodTypeAny>(schema: T) =>
  z.union([schema, z.literal("unknown")]);

/**
 * Normalized family profile consumed by the rules engine (Layer 1).
 */
export const profileSchema = z.object({
  state: z.literal("WA"),
  // TODO: normalized fields (age, veteran status, care needs, finances, ...)
});

export type Profile = z.infer<typeof profileSchema>;
