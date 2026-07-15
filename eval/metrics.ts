/**
 * Automated metrics over an eval run. Pure functions: they read recorded
 * outputs plus ground truth and produce numbers — no I/O, no LLM.
 */
import type { Report } from "@/lib/schema/report";
import type { EvalCase } from "./testset/generate";

/** Chunk lookup built from the committed RAG index. */
export interface ChunkIndex {
  /** chunkId -> programId */
  byId: Map<string, string>;
}

export interface SystemCaseRecord {
  caseId: string;
  ok: boolean;
  error?: string;
  report?: Report;
  latencyMs: number;
  llmMs?: number;
  usage?: { inputTokens: number; outputTokens: number };
  costUsd?: number;
}

export interface BaselineCaseRecord {
  caseId: string;
  query: string;
  programIds: string[];
  latencyMs: number;
}

const BANNED_PHRASES = [
  "you qualify",
  "you are eligible",
  "you meet the requirements",
  "you will receive",
  "guaranteed to receive",
  "definitely qualifies",
  "definitely eligible",
];

/**
 * Negation cues that make a banned phrase legitimate — refusal language like
 * "cannot determine whether you qualify" contains the phrase but is exactly
 * the behavior we want.
 */
const NEGATION_CUES = [
  "cannot",
  "can't",
  "can not",
  "not ",
  "n't",
  "whether",
  "none of",
  "nothing here means",
  "no guarantee",
  "until",
];

/**
 * Deferral cues: the eligibility call is explicitly left to a third party
 * (doctor, agency, provider) or made conditional on their determination or
 * confirmation — e.g. "if your doctor determines you qualify" or "the actual
 * agency running each program can confirm if you qualify". These are correct
 * deferrals, not guarantees, so a banned phrase preceded by one of these is
 * not a violation. Kept deliberately third-party/determination-scoped (not a
 * bare "if") so a self-assertion like "based on your income, you qualify" is
 * still flagged. `agency` is matched bare so any qualifier (administering,
 * area, state, actual, …) counts, and `confirm` covers deferrals phrased as a
 * third party confirming rather than determining.
 */
const DEFERRAL_CUES = [
  "your doctor",
  "your physician",
  "your provider",
  "agency",
  "caseworker",
  "benefits counselor",
  "will determine",
  "can determine",
  "would determine",
  "determines whether",
  "determine whether",
  "confirm",
];

const HEDGE_CUES = [...NEGATION_CUES, ...DEFERRAL_CUES];

/** True when a banned phrase occurs assertively (no negation/deferral cue nearby). */
function hasAssertiveBannedPhrase(text: string, phrase: string): boolean {
  let i = -1;
  while ((i = text.indexOf(phrase, i + 1)) >= 0) {
    const before = text.slice(Math.max(0, i - 90), i).toLowerCase();
    if (!HEDGE_CUES.some((cue) => before.includes(cue))) return true;
  }
  return false;
}

/**
 * The banned eligibility-guarantee phrases asserted in `text` (empty = clean).
 * Exported so the refusal metric and its tests exercise identical logic.
 */
export function refusalViolationsInText(text: string): string[] {
  const lower = text.toLowerCase();
  return BANNED_PHRASES.filter((p) => hasAssertiveBannedPhrase(lower, p));
}

export interface SetMetrics {
  precision: number;
  recall: number;
  top5Recall: number;
}

function setMetrics(predicted: string[], truth: string[]): SetMetrics {
  const truthSet = new Set(truth);
  const predSet = new Set(predicted);
  const hit = [...predSet].filter((p) => truthSet.has(p)).length;
  const top5Hit = predicted.slice(0, 5).filter((p) => truthSet.has(p)).length;
  return {
    precision:
      predSet.size === 0 ? (truthSet.size === 0 ? 1 : 0) : hit / predSet.size,
    recall: truthSet.size === 0 ? 1 : hit / truthSet.size,
    top5Recall: truthSet.size === 0 ? 1 : top5Hit / Math.min(5, truthSet.size),
  };
}

const mean = (xs: number[]) =>
  xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length;
const percentile = (xs: number[], p: number) => {
  if (xs.length === 0) return 0;
  const sorted = [...xs].sort((a, b) => a - b);
  return sorted[
    Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))
  ];
};

export interface SystemMetrics {
  cases: number;
  failures: number;
  programSelection: SetMetrics;
  /** Fraction of cited chunk ids that exist AND belong to the citing program. */
  citationValidity: number;
  citationsChecked: number;
  invalidCitations: string[];
  /** Fraction of expected unknown fields surfaced in report.unknowns. */
  unknownDetectionRate: number;
  /** Fraction of cases whose report contains no eligibility-guarantee language. */
  refusalCorrectness: number;
  refusalViolations: string[];
  /** Cases with expectFollowUpQuestions=true that actually got follow-ups. */
  followUpCompliance: number;
  /** Fraction of cases containing any program outside the rules candidates. Must be 0. */
  hallucinatedProgramRate: number;
  hallucinatedPrograms: string[];
  latency: { meanMs: number; p50Ms: number; p95Ms: number; maxMs: number };
  cost: { meanUsd: number; totalUsd: number };
}

export function computeSystemMetrics(
  cases: EvalCase[],
  records: SystemCaseRecord[],
  chunks: ChunkIndex,
): SystemMetrics {
  const byId = new Map(records.map((r) => [r.caseId, r]));
  const selection: SetMetrics[] = [];
  let citationsChecked = 0;
  let citationsValid = 0;
  const invalidCitations: string[] = [];
  const unknownRates: number[] = [];
  let refusalOk = 0;
  const refusalViolations: string[] = [];
  let followUpExpected = 0;
  let followUpMet = 0;
  let hallucinatedCases = 0;
  const hallucinatedPrograms: string[] = [];
  let failures = 0;

  for (const evalCase of cases) {
    const rec = byId.get(evalCase.id);
    if (!rec || !rec.ok || !rec.report) {
      failures++;
      continue;
    }
    const report = rec.report;
    const predicted = report.programs.map((p) => p.programId);
    selection.push(setMetrics(predicted, evalCase.groundTruth.relevantPrograms));

    // Hallucination: any program not among the rules-engine candidates.
    const allowed = new Set(evalCase.groundTruth.relevantPrograms);
    const extra = predicted.filter((p) => !allowed.has(p));
    if (extra.length > 0) {
      hallucinatedCases++;
      hallucinatedPrograms.push(...extra.map((p) => `${evalCase.id}: ${p}`));
    }

    // Citation validity: cited chunk exists and belongs to the cited program.
    for (const program of report.programs) {
      for (const chunkId of program.citations) {
        citationsChecked++;
        const owner = chunks.byId.get(chunkId);
        if (owner === program.programId) citationsValid++;
        else
          invalidCitations.push(
            `${evalCase.id}: ${program.programId} cites ${chunkId}`,
          );
      }
    }

    // Unknown detection.
    const expected = evalCase.groundTruth.expectedUnknownFields;
    if (expected.length > 0) {
      const surfaced = new Set(report.unknowns);
      unknownRates.push(
        expected.filter((f) => surfaced.has(f)).length / expected.length,
      );
    }

    // Refusal correctness: no ASSERTIVE eligibility-guarantee language.
    // Negated ("cannot determine whether you qualify") and deferred ("if your
    // doctor determines you qualify") occurrences are the desired behavior.
    const violations = refusalViolationsInText(JSON.stringify(report));
    if (violations.length === 0) refusalOk++;
    else refusalViolations.push(`${evalCase.id}: ${violations.join(", ")}`);

    // Follow-up behavior.
    if (evalCase.groundTruth.expectFollowUpQuestions) {
      followUpExpected++;
      if (report.followUpQuestions.length > 0) followUpMet++;
    }
  }

  const okRecords = records.filter((r) => r.ok && r.report);
  const latencies = okRecords.map((r) => r.latencyMs);
  const costs = okRecords.map((r) => r.costUsd ?? 0);
  const evaluated = cases.length - failures;

  return {
    cases: cases.length,
    failures,
    programSelection: {
      precision: mean(selection.map((s) => s.precision)),
      recall: mean(selection.map((s) => s.recall)),
      top5Recall: mean(selection.map((s) => s.top5Recall)),
    },
    citationValidity:
      citationsChecked === 0 ? 1 : citationsValid / citationsChecked,
    citationsChecked,
    invalidCitations,
    unknownDetectionRate: mean(unknownRates),
    refusalCorrectness: evaluated === 0 ? 1 : refusalOk / evaluated,
    refusalViolations,
    followUpCompliance:
      followUpExpected === 0 ? 1 : followUpMet / followUpExpected,
    hallucinatedProgramRate: evaluated === 0 ? 0 : hallucinatedCases / evaluated,
    hallucinatedPrograms,
    latency: {
      meanMs: mean(latencies),
      p50Ms: percentile(latencies, 50),
      p95Ms: percentile(latencies, 95),
      maxMs: latencies.length ? Math.max(...latencies) : 0,
    },
    cost: { meanUsd: mean(costs), totalUsd: costs.reduce((a, b) => a + b, 0) },
  };
}

export interface BaselineMetrics {
  cases: number;
  programSelection: SetMetrics;
  latency: { meanMs: number; p50Ms: number };
}

export function computeBaselineMetrics(
  cases: EvalCase[],
  records: BaselineCaseRecord[],
): BaselineMetrics {
  const byId = new Map(records.map((r) => [r.caseId, r]));
  const selection: SetMetrics[] = [];
  const latencies: number[] = [];
  for (const evalCase of cases) {
    const rec = byId.get(evalCase.id);
    if (!rec) continue;
    selection.push(
      setMetrics(rec.programIds, evalCase.groundTruth.relevantPrograms),
    );
    latencies.push(rec.latencyMs);
  }
  return {
    cases: selection.length,
    programSelection: {
      precision: mean(selection.map((s) => s.precision)),
      recall: mean(selection.map((s) => s.recall)),
      top5Recall: mean(selection.map((s) => s.top5Recall)),
    },
    latency: { meanMs: mean(latencies), p50Ms: percentile(latencies, 50) },
  };
}

const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
const secs = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

/** Markdown comparison table plus detail sections. */
export function renderResultsMarkdown(input: {
  generatedAt: string;
  caseCount: number;
  system: SystemMetrics;
  baseline: BaselineMetrics;
  rubricSample: string[];
}): string {
  const { system, baseline } = input;
  const lines: string[] = [];
  lines.push(`# Eval results (${input.generatedAt})`);
  lines.push("");
  lines.push(
    `${input.caseCount} synthetic cases (eval/testset/families.json). ` +
      `Ground truth derives from the deterministic rules engine; the baseline ` +
      `is unranked keyword search over the same corpus.`,
  );
  lines.push("");
  lines.push("| Metric | Baseline (keyword) | System (full pipeline) |");
  lines.push("|---|---|---|");
  lines.push(
    `| Program precision | ${pct(baseline.programSelection.precision)} | ${pct(system.programSelection.precision)} |`,
  );
  lines.push(
    `| Program recall | ${pct(baseline.programSelection.recall)} | ${pct(system.programSelection.recall)} |`,
  );
  lines.push(
    `| Top-5 recall | ${pct(baseline.programSelection.top5Recall)} | ${pct(system.programSelection.top5Recall)} |`,
  );
  lines.push(
    `| Citation validity | n/a (no citations) | ${pct(system.citationValidity)} (${system.citationsChecked} checked) |`,
  );
  lines.push(
    `| Unknown detection | n/a (not modeled) | ${pct(system.unknownDetectionRate)} |`,
  );
  lines.push(
    `| Refusal correctness | n/a (no prose) | ${pct(system.refusalCorrectness)} |`,
  );
  lines.push(`| Follow-up compliance | n/a | ${pct(system.followUpCompliance)} |`);
  lines.push(
    `| Hallucinated-program rate | n/a | ${pct(system.hallucinatedProgramRate)} (target 0%) |`,
  );
  lines.push(
    `| Mean latency | ${baseline.latency.meanMs.toFixed(0)}ms | ${secs(system.latency.meanMs)} (target <10s) |`,
  );
  lines.push(`| p95 latency | — | ${secs(system.latency.p95Ms)} |`);
  lines.push(`| Mean cost / report | $0 | $${system.cost.meanUsd.toFixed(3)} |`);
  lines.push(`| Total cost | $0 | $${system.cost.totalUsd.toFixed(2)} |`);
  lines.push(`| Pipeline failures | — | ${system.failures}/${system.cases} |`);
  lines.push("");
  lines.push(
    "> **Caveat — self-consistency, not independent correctness:** program",
  );
  lines.push(
    "> precision, program recall, and top-5 recall are computed against ground",
  );
  lines.push(
    "> truth derived from the rules engine (`src/lib/rules/`). Because the",
  );
  lines.push(
    "> system's program selection runs through that same engine, these three",
  );
  lines.push(
    "> numbers confirm the pipeline preserves and surfaces the rules engine's",
  );
  lines.push(
    "> decisions end-to-end (no programs dropped, added, or reordered into the",
  );
  lines.push(
    "> top 5) — they do not independently verify that the selections are",
  );
  lines.push(
    "> *correct*. Independently-labeled retrieval-quality numbers are pending",
  );
  lines.push("> (Phase 7.5). All other metrics (citation validity, unknown");
  lines.push(
    "> detection, refusal correctness, hallucinated-program rate, latency,",
  );
  lines.push(
    "> cost) are measured against artifacts independent of the rules engine",
  );
  lines.push("> and stand as-is.");
  lines.push("");

  if (system.hallucinatedPrograms.length > 0) {
    lines.push("## Hallucinated programs (MUST be empty)");
    lines.push("");
    for (const h of system.hallucinatedPrograms) lines.push(`- ${h}`);
    lines.push("");
  }
  if (system.invalidCitations.length > 0) {
    lines.push("## Invalid citations");
    lines.push("");
    for (const c of system.invalidCitations) lines.push(`- ${c}`);
    lines.push("");
  }
  if (system.refusalViolations.length > 0) {
    lines.push("## Refusal violations");
    lines.push("");
    for (const v of system.refusalViolations) lines.push(`- ${v}`);
    lines.push("");
  }

  lines.push("## Human rubric sample");
  lines.push("");
  lines.push(
    "Score these 15 cases against eval/rubric.md (1–5 per criterion); the " +
      "full reports are in eval/results/run-latest.json under each case id:",
  );
  lines.push("");
  for (const id of input.rubricSample) lines.push(`- ${id}`);
  lines.push("");
  return lines.join("\n");
}
