/**
 * Synthetic family generator: produces intake cases with ground-truth
 * candidate-program labels for eval/testset/families.json.
 */

export interface LabeledFamily {
  id: string;
  answers: Record<string, unknown>;
  expectedProgramIds: string[];
}

export function generateFamilies(count: number): LabeledFamily[] {
  void count;
  throw new Error("Not implemented");
}
