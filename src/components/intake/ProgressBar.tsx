export interface ProgressBarProps {
  step: number;
  total: number;
}

/** Questionnaire progress indicator. */
export function ProgressBar({ step, total }: ProgressBarProps) {
  return (
    <div role="progressbar" aria-valuenow={step} aria-valuemax={total}>
      {/* TODO */}
    </div>
  );
}
