import type { CorpusChunk } from "@/lib/rag/ingest";

export interface RetrievedPassage {
  chunk: CorpusChunk;
  score: number;
}

/**
 * Layer 2: retrieve passages for a query from the prebuilt index ONLY.
 * No external fetches at runtime.
 */
export async function retrieve(
  query: string,
  opts?: { topK?: number; documentIds?: string[] },
): Promise<RetrievedPassage[]> {
  void query;
  void opts;
  throw new Error("Not implemented");
}
