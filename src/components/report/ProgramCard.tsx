import type { ProgramEntry } from "@/lib/schema/report";
import { ConfidenceBadge } from "@/components/report/ConfidenceBadge";
import { CitationLink } from "@/components/report/CitationLink";
import { NextSteps } from "@/components/report/NextSteps";
import { sourceLabel, stripChunkIds } from "@/components/report/format";

export interface ProgramCardProps {
  entry: ProgramEntry;
  /** 1-based position in the sorted list — matches the summary index. */
  rank: number;
}

const summaryClass =
  "flex cursor-pointer list-none items-center gap-1.5 rounded-cta py-1 text-sm font-medium text-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [&::-webkit-details-marker]:hidden";

const caret = (
  <span
    aria-hidden
    className="text-xs text-accent-secondary transition-transform group-open:rotate-90"
  >
    ▸
  </span>
);

/** One program that appears worth investigating. Never asserts eligibility. */
export function ProgramCard({ entry, rank }: ProgramCardProps) {
  const sourcesAnchor = `sources-${entry.programId}`;

  return (
    <article
      id={`program-${entry.programId}`}
      className="flex h-full scroll-mt-8 flex-col rounded-cta border border-neutral-200 p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span
            aria-hidden
            className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-pill bg-accent text-sm font-semibold text-text-on-dark"
          >
            {rank}
          </span>
          <h3 className="text-lg font-semibold text-accent">
            {entry.programName}
          </h3>
        </div>
        <ConfidenceBadge confidence={entry.relevanceLabel} />
      </div>

      {entry.status === "unverified" && (
        <p className="mt-2 text-sm text-amber-800">
          We could not verify current details for this program from our sources —
          treat this as a starting point for your own research, not a confirmed
          match.
        </p>
      )}

      <p className="mt-2 leading-relaxed text-text-body">
        {stripChunkIds(entry.whyThisMayApply)}
      </p>

      <NextSteps steps={entry.nextSteps} />

      {(entry.whatItCovers.length > 0 ||
        entry.informationStillNeeded.length > 0 ||
        entry.officialLinks.length > 0) && (
        <div className="mt-auto space-y-2 pt-4">
          {entry.whatItCovers.length > 0 && (
            <details className="group">
              <summary className={summaryClass}>
                {caret}
                What it generally covers
              </summary>
              <div className="mt-1.5 rounded-cta border border-neutral-200 bg-neutral-50/70 px-4 py-3">
                <ul className="list-disc space-y-1 pl-4 text-sm leading-relaxed text-text-body">
                  {entry.whatItCovers.map((claim, i) => (
                    <li key={i}>
                      {stripChunkIds(claim.text)}
                      {claim.chunkIds.map((chunkId, j) => (
                        <CitationLink
                          key={chunkId}
                          chunkId={chunkId}
                          index={j + 1}
                          sourcesAnchor={sourcesAnchor}
                        />
                      ))}
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          )}

          {entry.informationStillNeeded.length > 0 && (
            <details className="group">
              <summary className={summaryClass}>
                {caret}
                Information still needed
              </summary>
              <div className="mt-1.5 rounded-cta border border-accent-secondary/40 border-l-4 border-l-accent-secondary bg-accent-secondary/10 px-4 py-3">
                <ul className="list-disc space-y-1 pl-4 text-sm leading-relaxed text-text-body">
                  {entry.informationStillNeeded.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </details>
          )}

          {entry.officialLinks.length > 0 && (
            <details id={sourcesAnchor} className="group scroll-mt-8">
              <summary className={summaryClass}>
                {caret}
                Sources ({entry.officialLinks.length})
              </summary>
              <div className="mt-1.5 rounded-cta bg-neutral-50/60 px-4 py-2.5">
                <ul className="space-y-1 pl-4 text-xs">
                  {entry.officialLinks.map((url) => {
                    const { host, slug } = sourceLabel(url);
                    return (
                      <li key={url}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={url}
                          className="text-accent underline hover:text-accent-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                        >
                          {host}
                          {slug && (
                            <span className="text-neutral-500"> · {slug}</span>
                          )}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </details>
          )}
        </div>
      )}
    </article>
  );
}
