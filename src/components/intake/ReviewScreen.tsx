"use client";

import type { QuestionDef, RawAnswers } from "@/components/intake/questions";
import { formatAnswer } from "@/components/intake/questions";

export interface ReviewScreenProps {
  questions: QuestionDef[];
  answers: RawAnswers;
  onEdit: (questionId: QuestionDef["id"]) => void;
  onSubmit: () => void;
  submitting: boolean;
}

/** Lets the family review answers before submitting. */
export function ReviewScreen({
  questions,
  answers,
  onEdit,
  onSubmit,
  submitting,
}: ReviewScreenProps) {
  return (
    <section>
      <h2 className="text-xl font-medium">Review your answers</h2>
      <p className="mt-2 text-sm text-neutral-500">
        Check everything before submitting. Answers marked “I don’t know” or
        “Prefer not to say” are kept as unknowns — the screening never fills
        in a guess.
      </p>

      <dl className="mt-6 divide-y divide-neutral-200 border-y border-neutral-200">
        {questions.map((q) => (
          <div key={q.id} className="flex items-start gap-4 py-3">
            <div className="flex-1">
              <dt className="text-sm text-neutral-500">{q.prompt}</dt>
              <dd className="mt-0.5">{formatAnswer(answers[q.id])}</dd>
            </div>
            <button
              type="button"
              onClick={() => onEdit(q.id)}
              className="text-sm underline"
            >
              Edit
            </button>
          </div>
        ))}
      </dl>

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        className="mt-8 rounded bg-neutral-900 px-6 py-3 text-white disabled:opacity-50"
      >
        {submitting ? "Generating your report…" : "Submit answers"}
      </button>
      {submitting && (
        <p className="mt-2 text-sm text-neutral-500">
          This can take up to a couple of minutes.
        </p>
      )}
    </section>
  );
}
