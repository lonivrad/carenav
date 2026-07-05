import type { Citation } from "@/lib/schema/report";

export interface CitationLinkProps {
  citation: Citation;
}

/** Links a claim to the corpus chunk that supports it. */
export function CitationLink({ citation }: CitationLinkProps) {
  void citation;
  return <sup>{/* TODO */}</sup>;
}
