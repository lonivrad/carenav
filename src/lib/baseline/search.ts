import { readFileSync } from "node:fs";
import { join } from "node:path";

import manifest from "@/data/corpus-manifest.json";

export interface BaselineResult {
  programId: string;
  programName: string;
  matchedTerms: string[];
}

const CORPUS_ROOT = join(process.cwd(), "src/data");

/**
 * Deliberately primitive comparator: plain substring matching over the raw
 * corpus text, in manifest order. No ranking, no relevance scoring, no
 * unknown-field handling — this is the baseline that Layers 1-3 are
 * evaluated against.
 */
export function keywordSearch(query: string): BaselineResult[] {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
  if (terms.length === 0) return [];

  const documents = (
    manifest as { documents: { id: string; file: string; name: string }[] }
  ).documents;

  const results: BaselineResult[] = [];
  for (const doc of documents) {
    const text = readFileSync(join(CORPUS_ROOT, doc.file), "utf8").toLowerCase();
    const haystack = `${doc.name.toLowerCase()}\n${text}`;
    const matchedTerms = terms.filter((t) => haystack.includes(t));
    if (matchedTerms.length > 0) {
      results.push({ programId: doc.id, programName: doc.name, matchedTerms });
    }
  }
  return results;
}
