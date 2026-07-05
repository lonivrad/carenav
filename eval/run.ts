/**
 * Runs the full pipeline and the keyword baseline over eval/testset/families.json,
 * writing timestamped JSON + markdown summaries to eval/results/.
 */

export interface EvalRunOptions {
  limit?: number;
}

export async function runEval(opts?: EvalRunOptions): Promise<void> {
  void opts;
  throw new Error("Not implemented");
}
