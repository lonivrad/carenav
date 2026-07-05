/**
 * System prompt with trust boundaries for Layer 3.
 *
 * The prompt constrains language and sourcing only. It must never encode
 * eligibility thresholds — those live exclusively in src/lib/rules/.
 */
export const SYSTEM_PROMPT = `TODO`;

export function buildUserPrompt(): string {
  throw new Error("Not implemented");
}
