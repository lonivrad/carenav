import { IntakeFlow } from "@/components/intake/IntakeFlow";

export const metadata = {
  title: "Intake — CareNav",
};

export default function IntakePage() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-semibold">Care funding screening</h1>
      <p className="mt-2 text-sm text-neutral-500">
        About 10 minutes. Every question offers “I don’t know” and “Prefer not
        to say” — unanswered items are treated as unknowns, never guessed.
        This screening is educational only: it does not determine eligibility
        or provide legal or financial advice.
      </p>
      <div className="mt-8">
        <IntakeFlow />
      </div>
    </main>
  );
}
