"use client";

import type { Intake } from "@/lib/schema/intake";
import type { QuestionDef } from "@/components/intake/questions";

type Answer = Intake[keyof Intake] | undefined;

export interface QuestionStepProps {
  question: QuestionDef;
  value: Answer;
  onChange: (value: Answer) => void;
}

const btnBase =
  "block w-full rounded border px-4 py-3 text-left transition-colors duration-[var(--duration-nav)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const btnOff = "border-neutral-400 hover:border-accent";
const btnOn = "border-accent bg-accent text-text-on-dark";

function ChoiceButton({
  selected,
  label,
  onClick,
}: {
  selected: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`${btnBase} ${selected ? btnOn : btnOff}`}
    >
      {label}
    </button>
  );
}

// Skip actions are deliberately lighter than real answers: smaller type, a
// lighter border, muted text, and sized to their content rather than full
// width — so declining reads as a secondary escape hatch, not an answer.
const declineBase =
  "rounded-cta border px-4 py-2.5 text-sm transition-colors duration-[var(--duration-nav)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const declineOff =
  "border-neutral-300 text-neutral-600 hover:border-neutral-400 hover:text-neutral-800";
const declineOn = "border-accent bg-accent/5 font-medium text-accent";

function DeclineButton({
  selected,
  label,
  onClick,
}: {
  selected: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`${declineBase} ${selected ? declineOn : declineOff}`}
    >
      {label}
    </button>
  );
}

/** One step of the intake questionnaire. */
export function QuestionStep({ question, value, onChange }: QuestionStepProps) {
  const declined = value === "unknown" || value === "prefer_not_to_say";

  const declineButtons = (
    <div className="mt-4 border-t border-neutral-200 pt-4">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
        Skip this question
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <DeclineButton
          selected={value === "unknown"}
          label="I don't know"
          onClick={() => onChange("unknown")}
        />
        <DeclineButton
          selected={value === "prefer_not_to_say"}
          label="Prefer not to say"
          onClick={() => onChange("prefer_not_to_say")}
        />
      </div>
    </div>
  );

  return (
    <fieldset data-question={question.id}>
      <legend className="text-xl font-medium">{question.prompt}</legend>
      {question.help && (
        <p className="mt-2 text-sm text-neutral-600">{question.help}</p>
      )}

      <div className="mt-4 space-y-2">
        {question.kind === "age" && (
          <input
            type="number"
            inputMode="numeric"
            min={18}
            max={120}
            placeholder="Age in years"
            aria-label="Age in years"
            value={typeof value === "number" ? value : ""}
            onChange={(e) => {
              const n = e.target.valueAsNumber;
              onChange(Number.isNaN(n) ? undefined : n);
            }}
            className="w-40 rounded border border-neutral-400 px-4 py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          />
        )}

        {question.kind === "select" && (
          <select
            aria-label={question.prompt}
            value={typeof value === "string" && !declined ? value : ""}
            onChange={(e) => onChange(e.target.value as Answer)}
            className="w-full rounded border border-neutral-400 px-4 py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <option value="" disabled>
              Select…
            </option>
            {question.options?.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        )}

        {question.kind === "single" &&
          question.options?.map((o) => (
            <ChoiceButton
              key={o.value}
              selected={value === o.value}
              label={o.label}
              onClick={() => onChange(o.value as Answer)}
            />
          ))}

        {question.kind === "multi" && (
          <>
            {question.options?.map((o) => {
              const list = Array.isArray(value) ? (value as string[]) : [];
              const checked = list.includes(o.value);
              return (
                <ChoiceButton
                  key={o.value}
                  selected={checked}
                  label={`${checked ? "☑" : "☐"} ${o.label}`}
                  onClick={() => {
                    const next = checked
                      ? list.filter((v) => v !== o.value)
                      : [...list, o.value];
                    // Deselecting everything returns to "unanswered" — an
                    // explicit empty answer comes only from the none button.
                    onChange(next.length === 0 ? undefined : (next as Answer));
                  }}
                />
              );
            })}
            {question.noneLabel && (
              <ChoiceButton
                selected={Array.isArray(value) && value.length === 0}
                label={question.noneLabel}
                onClick={() => onChange([] as unknown as Answer)}
              />
            )}
          </>
        )}
      </div>

      {declineButtons}
    </fieldset>
  );
}
