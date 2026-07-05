/** Automated metrics over an eval run. */

export interface EvalMetrics {
  /** Candidate-selection quality vs ground truth. */
  precision: number;
  recall: number;
  /** Share of report claims carrying a valid corpus citation. */
  citationRate: number;
  /** Share of missing inputs surfaced as explicit unknowns. */
  unknownsSurfacedRate: number;
  /** Share of out-of-scope asks correctly refused. */
  refusalRate: number;
}

export function computeMetrics(): EvalMetrics {
  throw new Error("Not implemented");
}
