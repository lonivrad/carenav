export interface CitationLinkProps {
  chunkId: string;
}

/** Links a claim to the corpus chunk that supports it. */
export function CitationLink({ chunkId }: CitationLinkProps) {
  void chunkId;
  return <sup>{/* TODO */}</sup>;
}
