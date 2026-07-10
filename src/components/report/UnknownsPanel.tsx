import { questionForField } from "@/lib/report/field-labels";

export interface UnknownsPanelProps {
  unknowns: string[];
  followUpQuestions: string[];
}

/** Fixed display order for grouped categories. */
const CATEGORY_ORDER = [
  "About the person",
  "Care needs",
  "Finances",
  "Insurance & benefits",
  "Military service",
] as const;

type Category = (typeof CATEGORY_ORDER)[number];

/** Maps a rules-engine field key to a display category (presentation only). */
function categoryForField(field: string): Category {
  const key = field.replace(/ \(not collected\)$/, "");
  if (key.startsWith("veteran.")) return "Military service";
  if (key.startsWith("insurance.") || key === "waCaresParticipation")
    return "Insurance & benefits";
  if (key === "monthlyIncomeBracket" || key === "countableAssetsBracket")
    return "Finances";
  if (key === "adlHelpCount" || key === "adlsNeedingHelp") return "Care needs";
  return "About the person";
}

/** Removes exact-duplicate strings while preserving first-seen order. */
function dedupe(items: string[]): string[] {
  return [...new Set(items)];
}

/** Surfaces what couldn't be determined and why — the report never guesses. */
export function UnknownsPanel({ unknowns, followUpQuestions }: UnknownsPanelProps) {
  if (unknowns.length === 0) return null;

  // Prefer the LLM's plain-language questions when present. They are free text
  // with no category metadata, so we only dedupe them — grouping would require
  // inventing structure. The rules-engine field keys, by contrast, group cleanly.
  const useFollowUps = followUpQuestions.length > 0;

  const grouped = new Map<Category, string[]>();
  if (!useFollowUps) {
    for (const category of CATEGORY_ORDER) grouped.set(category, []);
    for (const field of unknowns) {
      grouped.get(categoryForField(field))!.push(questionForField(field));
    }
    for (const [category, qs] of grouped) grouped.set(category, dedupe(qs));
  }

  const followUps = dedupe(followUpQuestions);

  return (
    <section className="mt-8 rounded-cta border border-neutral-200 bg-neutral-50 p-5">
      <h2 className="text-base font-semibold text-text-body">
        What we couldn&rsquo;t determine
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-neutral-600">
        {unknowns.length} answer{unknowns.length === 1 ? " was" : "s were"} left
        unknown or declined. We never guess at missing information — this affects
        which programs appear and how confidently, so filling these in may change
        the report.
      </p>

      {useFollowUps ? (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-neutral-700">
          {followUps.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 space-y-4">
          {CATEGORY_ORDER.filter((c) => (grouped.get(c)?.length ?? 0) > 0).map(
            (category) => (
              <div key={category}>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  {category}
                </h3>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-neutral-700">
                  {grouped.get(category)!.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
              </div>
            ),
          )}
        </div>
      )}
    </section>
  );
}
