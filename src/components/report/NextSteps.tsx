export interface NextStepsProps {
  steps: string[];
}

/**
 * Next steps for discussing a program with a professional. The first step is
 * surfaced as the primary action; any remaining steps stay one tap away in a
 * native, keyboard-accessible disclosure. Order is taken as given — the report
 * lists steps in the sequence the family should follow.
 */
export function NextSteps({ steps }: NextStepsProps) {
  if (steps.length === 0) return null;
  const [primary, ...rest] = steps;

  return (
    <div className="mt-3 border-l-2 border-accent-secondary/40 pl-3">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-accent-secondary">
        Start here
      </h4>
      <p className="mt-0.5 leading-relaxed text-text-body">{primary}</p>

      {rest.length > 0 && (
        <details className="group mt-1.5">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-cta text-sm font-medium text-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [&::-webkit-details-marker]:hidden">
            <span
              aria-hidden
              className="text-xs text-accent-secondary transition-transform group-open:rotate-90"
            >
              ▸
            </span>
            {rest.length} more step{rest.length === 1 ? "" : "s"}
          </summary>
          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm leading-relaxed text-text-body">
            {rest.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
