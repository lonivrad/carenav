/**
 * The canonical 15-case rubric sample: 3 per category, spread across each
 * (first, middle, last), in testset order. Shared by the eval runner (which
 * lists the sample in results.md) and the rubric judge (which scores it), so
 * both always reference exactly the same cases.
 */
export function rubricSample(cases: { id: string; category: string }[]): string[] {
  const byCategory = new Map<string, { id: string; category: string }[]>();
  for (const c of cases) {
    byCategory.set(c.category, [...(byCategory.get(c.category) ?? []), c]);
  }
  const sample: string[] = [];
  for (const group of byCategory.values()) {
    const picks = [0, Math.floor(group.length / 2), group.length - 1]
      .map((i) => group[i]?.id)
      .filter((id): id is string => Boolean(id));
    sample.push(...new Set(picks));
  }
  return sample.slice(0, 15);
}
