import type { Confidence } from "@/lib/schema/report";

export interface ConfidenceBadgeProps {
  confidence: Confidence;
}

const STYLES: Record<Confidence, string> = {
  high: "bg-emerald-100 text-emerald-800 border-emerald-300",
  medium: "bg-amber-100 text-amber-800 border-amber-300",
  low: "bg-neutral-100 text-neutral-700 border-neutral-300",
};

const LABELS: Record<Confidence, string> = {
  high: "High relevance",
  medium: "Medium relevance",
  low: "Low relevance",
};

/**
 * Confidence is derived deterministically from rule outcomes, retrieval
 * quality, and unknown-field count — never chosen by the model. The tooltip
 * explains that derivation rather than restating the label.
 */
const EXPLANATIONS: Record<Confidence, string> = {
  high:
    "Your answers strongly matched this program's rules, and its details were confidently found in the source material.",
  medium:
    "This program may apply, but either some of your answers were unknown or its details were only partially confirmed in the source material.",
  low:
    "Either key information was missing, this program is a lower-priority match, or its current details could not be confirmed in the source material.",
};

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${STYLES[confidence]}`}
      title={EXPLANATIONS[confidence]}
    >
      {LABELS[confidence]}
    </span>
  );
}
