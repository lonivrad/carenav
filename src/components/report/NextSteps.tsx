import { stripChunkIds } from "@/components/report/format";

export interface NextStepsProps {
  steps: string[];
}

/**
 * Next steps for discussing a program with a professional. Every step is shown
 * inline, in the exact order the report provides — stressed caregivers should
 * never have to click to discover what to do. All steps share one typographic
 * weight; ordering is conveyed by numbering and spacing alone, so no step is
 * implied to matter more than the backend guarantees.
 */
export function NextSteps({ steps }: NextStepsProps) {
  if (steps.length === 0) return null;

  return (
    <div className="mt-3 border-l-2 border-accent-secondary/40 pl-3">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-accent-secondary">
        Start here
      </h4>

      {steps.length === 1 ? (
        <p className="mt-1 leading-relaxed text-text-body">
          {stripChunkIds(steps[0])}
        </p>
      ) : (
        <ol className="mt-1.5 space-y-2">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-2.5">
              <span
                aria-hidden
                className="mt-px shrink-0 text-sm font-semibold tabular-nums text-accent-secondary"
              >
                {i + 1}.
              </span>
              <span className="leading-relaxed text-text-body">
                {stripChunkIds(step)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
