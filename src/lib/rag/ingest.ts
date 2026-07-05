/**
 * Layer 2 build step: chunk + embed the curated corpus in src/data/corpus/
 * and write the prebuilt vector index to src/lib/rag/index.json.
 *
 * Runs offline (build time). Runtime retrieval never fetches externally.
 */

export interface CorpusChunk {
  chunkId: string;
  documentId: string;
  text: string;
  embedding: number[];
}

export interface VectorIndex {
  version: number;
  embeddingModel: string;
  chunks: CorpusChunk[];
}

export async function ingestCorpus(): Promise<VectorIndex> {
  throw new Error("Not implemented");
}
