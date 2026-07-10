import type { ProgramEntry, RelevanceLabel } from "@/lib/schema/report";

export interface ReportSummaryProps {
  /** Expected already sorted highest-relevance first (see sortByRelevance). */
  programs: ProgramEntry[];
}

const RELEVANCE_TEXT: Record<RelevanceLabel, string> = {
  high: "High relevance",
  medium: "Medium relevance",
  low: "Low relevance",
};

/**
 * Compact index of the programs most worth exploring first: rank, name, and
 * relevance, each a jump link to its full card below. Explanations live only in
 * the cards — this is a scannable table of contents, not a second copy.
 */
export function ReportSummary({ programs }: ReportSummaryProps) {
  if (programs.length === 0) return null;
  const top = programs.slice(0, 3);

  return (
    <section
      aria-labelledby="summary-heading"
      className="mt-6 rounded-cta border border-neutral-200 p-5"
    >
      <h2 id="summary-heading" className="text-lg font-semibold text-accent">
        Most worth exploring first
      </h2>

      <ol className="mt-3 space-y-1">
        {top.map((entry, i) => (
          <li key={entry.programId}>
            <a
              href={`#program-${entry.programId}`}
              className="group flex items-baseline gap-2 rounded-cta py-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <span
                aria-hidden
                className="shrink-0 text-sm font-semibold tabular-nums text-accent-secondary"
              >
                {i + 1}.
              </span>
              <span className="flex-1">
                <span className="font-medium text-accent group-hover:underline">
                  {entry.programName}
                </span>
                <span className="text-sm text-neutral-500">
                  {" "}
                  — {RELEVANCE_TEXT[entry.relevanceLabel]}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ol>

      <p className="mt-2 text-sm text-neutral-500" aria-hidden>
        View details below ↓
      </p>
    </section>
  );
}
