export interface ProgressBarProps {
  step: number;
  total: number;
}

/** Questionnaire progress indicator. */
export function ProgressBar({ step, total }: ProgressBarProps) {
  const pct = Math.round((step / total) * 100);
  return (
    <div className="mb-6">
      <div className="mb-1 flex justify-between text-sm text-neutral-600">
        <span>
          Question {step} of {total}
        </span>
        <span>{pct}%</span>
      </div>
      <div
        role="progressbar"
        aria-label={`Question ${step} of ${total}`}
        aria-valuenow={step}
        aria-valuemin={0}
        aria-valuemax={total}
        className="h-2 w-full rounded bg-neutral-200"
      >
        <div
          className="h-2 rounded bg-accent transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
