export interface DisclaimerBannerProps {
  text: string;
}

/** Persistent reminder that this is educational screening, not a determination. */
export function DisclaimerBanner({ text }: DisclaimerBannerProps) {
  return (
    <div className="sticky top-0 z-10 border-b border-neutral-300 bg-neutral-100 px-4 py-3 text-sm text-neutral-700">
      <div className="mx-auto max-w-3xl">{text}</div>
    </div>
  );
}
