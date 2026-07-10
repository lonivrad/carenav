import { IntakeFlow } from "@/components/intake/IntakeFlow";

export const metadata = {
  title: "Intake — CareNav",
};

export default function IntakePage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 pb-16 pt-8">
      <p className="text-sm font-semibold uppercase tracking-wide text-accent-secondary">
        Care funding screening
      </p>
      <h1 className="mt-1 text-2xl font-medium leading-tight tracking-tight text-accent sm:text-3xl">
        A few questions about your situation
      </h1>

      <div className="mt-6">
        <IntakeFlow />
      </div>

      <div className="mt-10 border-t border-neutral-200 pt-5 text-sm leading-relaxed text-neutral-600">
        <p>
          About 10 minutes. Every question offers “I don’t know” or “Prefer not
          to say” — unanswered items are kept as unknowns, never guessed.
        </p>
        <p className="mt-2">
          Educational screening only: it does not determine eligibility or
          provide legal or financial advice.
        </p>
      </div>
    </main>
  );
}
