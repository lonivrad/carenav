export interface DisclaimerBannerProps {
  text: string;
}

/**
 * Compact, non-sticky safety note. A short always-visible reminder that this is
 * educational screening, with the full disclaimer one tap away in a native,
 * keyboard-accessible disclosure — so it never covers the report content.
 */
export function DisclaimerBanner({ text }: DisclaimerBannerProps) {
  return (
    <details className="rounded-cta border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 font-medium text-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [&::-webkit-details-marker]:hidden">
        <span aria-hidden className="text-accent-secondary">
          ⓘ
        </span>
        Educational screening only — not an eligibility decision.
        <span className="ml-auto text-xs font-normal text-accent">
          Full disclaimer
        </span>
      </summary>
      <p className="mt-2 leading-relaxed">{text}</p>
    </details>
  );
}
