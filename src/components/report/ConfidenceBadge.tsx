import type { Confidence } from "@/lib/schema/report";

export interface ConfidenceBadgeProps {
  confidence: Confidence;
}

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  return <span>{confidence}</span>;
}
