export interface NextStepsProps {
  steps: string[];
}

/** Concrete next steps for discussing programs with a professional. */
export function NextSteps({ steps }: NextStepsProps) {
  if (steps.length === 0) return null;
  return (
    <section className="mt-3">
      <h4 className="text-sm font-medium text-neutral-700">Next steps</h4>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-neutral-700">
        {steps.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ul>
    </section>
  );
}
