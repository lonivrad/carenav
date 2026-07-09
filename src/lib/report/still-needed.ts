import { FIELD_QUESTIONS } from "@/lib/report/field-labels";

/**
 * Deterministic backstop for per-program "information still needed": the
 * model proposes its own phrasing, but every missing fact the rules engine
 * knows about (unknown fields plus alwaysNeeded reporting metadata) must
 * survive into the report even if the model drops it. The LLM proposes,
 * this module disposes.
 */

const STOPWORDS = new Set([
  "what",
  "whether",
  "their",
  "they",
  "them",
  "your",
  "does",
  "do",
  "the",
  "a",
  "an",
  "and",
  "or",
  "to",
  "of",
  "in",
  "for",
  "not",
  "collected",
  "status",
  "need",
  "needed",
  "provider",
  "with",
  "due",
  "have",
  "has",
]);

const significantTokens = (text: string): string[] =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s/-]/g, " ")
    .split(/[\s/-]+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w));

/** Render a missing fact for the family: mapped question, or a plain phrase. */
export function renderMissingFact(fact: string): string {
  const base = fact.replace(/ \(not collected\)$/, "");
  const mapped = FIELD_QUESTIONS[base];
  if (mapped) return mapped;
  if (base.includes(".") || /^[a-z]+[A-Z]/.test(base)) {
    // Field-name style (insurance.medicaid, adlHelpCount): fall back to the
    // shared question renderer's convention.
    return `Can you provide: ${base.replace(/\./g, " → ")}?`;
  }
  // alwaysNeeded entries are already plain phrases.
  return base.charAt(0).toUpperCase() + base.slice(1);
}

/** True when the model's own items already cover this fact's key terms. */
function coveredByModel(rendered: string, modelText: string): boolean {
  const tokens = significantTokens(rendered);
  if (tokens.length === 0) return true;
  const hits = tokens.filter((t) => modelText.includes(t)).length;
  return hits / tokens.length >= 0.5;
}

/**
 * Union of the model's proposed items and the rules-known missing facts,
 * skipping facts the model has already expressed in its own words.
 */
export function mergeStillNeeded(
  modelItems: string[],
  missingFacts: string[],
): string[] {
  const out = [...modelItems];
  const modelText = modelItems.join(" ").toLowerCase();
  const seen = new Set(out.map((s) => s.toLowerCase()));
  for (const fact of missingFacts) {
    const rendered = renderMissingFact(fact);
    if (seen.has(rendered.toLowerCase())) continue;
    if (coveredByModel(rendered, modelText)) continue;
    out.push(rendered);
    seen.add(rendered.toLowerCase());
  }
  return out;
}
