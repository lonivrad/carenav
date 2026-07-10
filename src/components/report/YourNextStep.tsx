import type { ProgramEntry } from "@/lib/schema/report";
import { stripChunkIds } from "@/components/report/format";

export interface YourNextStepProps {
  /** Expected already sorted highest-relevance first (see sortByRelevance). */
  programs: ProgramEntry[];
}

/**
 * The single most useful thing to do first: the first next-step of the
 * highest-ranked program, surfaced verbatim. No new recommendation is invented —
 * this only elevates an action already present in that program's card.
 */
export function YourNextStep({ programs }: YourNextStepProps) {
  const top = programs[0];
  const action = top?.nextSteps[0];
  if (!top || !action) return null;

  return (
    <section
      aria-labelledby="next-step-heading"
      className="mt-6 rounded-cta border border-accent bg-accent/5 p-5"
    >
      <h2
        id="next-step-heading"
        className="text-sm font-semibold uppercase tracking-wide text-accent"
      >
        Your next step
      </h2>
      <p className="mt-2 leading-relaxed text-text-body">
        <span className="font-semibold">{top.programName}:</span>{" "}
        {stripChunkIds(action)}
      </p>
    </section>
  );
}
