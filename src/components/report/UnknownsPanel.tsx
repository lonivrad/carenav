import { questionForField } from "@/lib/report/field-labels";

export interface UnknownsPanelProps {
  unknowns: string[];
  followUpQuestions: string[];
}

/** Surfaces what couldn't be determined and why — the report never guesses. */
export function UnknownsPanel({ unknowns, followUpQuestions }: UnknownsPanelProps) {
  if (unknowns.length === 0) return null;

  return (
    <section className="mt-8 rounded border border-amber-200 bg-amber-50 p-5">
      <h2 className="text-lg font-medium text-amber-900">
        What we couldn&rsquo;t determine
      </h2>
      <p className="mt-1 text-sm text-amber-900">
        {unknowns.length} answer{unknowns.length === 1 ? " was" : "s were"} left
        unknown or declined. We never guess at missing information — this
        affects which programs appear and how confidently, so filling these in
        may change the report.
      </p>
      {followUpQuestions.length > 0 && (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-900">
          {followUpQuestions.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ul>
      )}
      {followUpQuestions.length === 0 && (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-900">
          {unknowns.map((field) => (
            <li key={field}>{questionForField(field)}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
