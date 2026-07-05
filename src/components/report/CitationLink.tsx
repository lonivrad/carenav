export interface CitationLinkProps {
  chunkId: string;
  /** Display index within the claim, e.g. 1 for the first citation. */
  index: number;
  /** Anchor id of this program's sources list. */
  sourcesAnchor: string;
}

/** Links a claim to the corpus passage that supports it, via the program's sources list. */
export function CitationLink({ chunkId, index, sourcesAnchor }: CitationLinkProps) {
  return (
    <sup>
      <a
        href={`#${sourcesAnchor}`}
        title={`Source passage: ${chunkId}`}
        className="ml-0.5 text-blue-700 no-underline hover:underline"
      >
        [{index}]
      </a>
    </sup>
  );
}
