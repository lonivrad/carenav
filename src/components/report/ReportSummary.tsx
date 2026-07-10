import type { ProgramEntry } from "@/lib/schema/report";
import { ConfidenceBadge } from "@/components/report/ConfidenceBadge";
import { RELEVANCE_ORDER, relevanceCounts } from "@/components/report/relevance";
import { stripChunkIds } from "@/components/report/format";

export interface ReportSummaryProps {
  /** Expected already sorted highest-relevance first (see sortByRelevance). */
  programs: ProgramEntry[];
}

const COUNT_LABELS: Record<(typeof RELEVANCE_ORDER)[number], string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

const COUNT_STYLES: Record<(typeof RELEVANCE_ORDER)[number], string> = {
  high: "border-emerald-300 bg-emerald-50 text-emerald-900",
  medium: "border-amber-300 bg-amber-50 text-amber-900",
  low: "border-neutral-300 bg-neutral-50 text-neutral-800",
};

/**
 * At-a-glance header so the report is scannable in seconds: how many programs
 * fell into each relevance band, and the top three to look at first. All values
 * are derived from the programs already in the report — nothing is recomputed.
 */
export function ReportSummary({ programs }: ReportSummaryProps) {
  if (programs.length === 0) return null;

  const counts = relevanceCounts(programs);
  const top = programs.slice(0, 3);

  return (
    <section
      aria-labelledby="summary-heading"
      className="mt-6 rounded-cta border border-neutral-200 bg-white p-5 shadow-sm"
    >
      <h2 id="summary-heading" className="text-lg font-semibold text-accent">
        Most worth exploring first
      </h2>

      <ul className="mt-3 flex flex-wrap gap-2">
        {RELEVANCE_ORDER.map((label) => (
          <li
            key={label}
            className={`inline-flex items-baseline gap-1.5 rounded-pill border px-3 py-1 text-sm font-medium ${COUNT_STYLES[label]}`}
          >
            <span className="text-base font-semibold">{counts[label]}</span>
            {COUNT_LABELS[label]} relevance
          </li>
        ))}
      </ul>

      <ol className="mt-4 space-y-2">
        {top.map((entry, i) => (
          <li key={entry.programId}>
            <a
              href={`#program-${entry.programId}`}
              className="group flex items-start gap-3 rounded-cta p-2 hover:bg-accent/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <span
                aria-hidden
                className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-pill bg-accent text-sm font-semibold text-text-on-dark"
              >
                {i + 1}
              </span>
              <span className="flex-1">
                <span className="font-medium text-accent group-hover:underline">
                  {entry.programName}
                </span>
                <span className="mt-0.5 block text-sm text-text-body">
                  {stripChunkIds(entry.whyThisMayApply)}
                </span>
              </span>
              <ConfidenceBadge confidence={entry.relevanceLabel} />
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
