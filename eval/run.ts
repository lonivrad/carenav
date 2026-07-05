/**
 * Eval runner: executes the keyword baseline and the full pipeline over
 * eval/testset/families.json with bounded concurrency, records per-report
 * wall-clock latency and token cost, and writes:
 *
 *   eval/results/run-latest.json — raw per-case records (checkpointed as it runs)
 *   eval/results/results.md     — metrics table, baseline vs system
 *
 * Usage: npm run eval [-- --limit 5 --concurrency 5]
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

import { keywordSearch } from "@/lib/baseline/search";
import { EXPLAIN_MODEL, type ReportGenerator } from "@/lib/llm/explain";
import { SYSTEM_PROMPT } from "@/lib/llm/prompts";
import { loadEnvLocal } from "@/lib/rag/local-env";
import { runScreening } from "@/lib/pipeline";
import { llmReportSchema } from "@/lib/schema/report";
import type { Intake } from "@/lib/schema/intake";
import rawIndex from "@/lib/rag/index.json";

import {
  computeBaselineMetrics,
  computeSystemMetrics,
  renderResultsMarkdown,
  type BaselineCaseRecord,
  type SystemCaseRecord,
} from "./metrics";
import type { EvalCase } from "./testset/generate";

/* ---------------------------------------------------------------- setup -- */

loadEnvLocal();

const EVAL_DIR = dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = join(EVAL_DIR, "results");

// claude-sonnet-5 list pricing per million tokens.
const INPUT_USD_PER_M = 3;
const OUTPUT_USD_PER_M = 15;

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const i = args.indexOf(flag);
    return i >= 0 ? Number(args[i + 1]) : undefined;
  };
  return {
    limit: get("--limit"),
    concurrency: get("--concurrency") ?? 5,
    /** Re-score eval/results/run-latest.json without re-running anything. */
    recompute: args.includes("--recompute"),
  };
}

/* ------------------------------------------------------------- baseline -- */

/** Free-text query a family member might plausibly type. */
export function buildBaselineQuery(intake: Intake): string {
  const terms: string[] = ["Washington"];
  if (typeof intake.careRecipientAge === "number") terms.push("elderly");
  if (intake.county !== "unknown" && intake.county !== "prefer_not_to_say") {
    terms.push(intake.county);
  }
  if (intake.isVeteran === "yes") terms.push("veteran");
  if (
    intake.diagnosisCategory &&
    intake.diagnosisCategory !== "none" &&
    intake.diagnosisCategory !== "unknown" &&
    intake.diagnosisCategory !== "prefer_not_to_say"
  ) {
    terms.push(intake.diagnosisCategory.replace(/_/g, " "));
  }
  if (Array.isArray(intake.adlsNeedingHelp) && intake.adlsNeedingHelp.length > 0) {
    terms.push("help", intake.adlsNeedingHelp[0]);
  }
  if (Array.isArray(intake.currentInsurance)) {
    terms.push(...intake.currentInsurance.map((v) => v.replace(/_/g, " ")));
  }
  terms.push("care funding");
  return terms.join(" ");
}

/* --------------------------------------------- usage-capturing generator -- */

interface UsageBox {
  inputTokens: number;
  outputTokens: number;
  llmMs: number;
}

/** Mirrors explain.ts's default generator, additionally recording usage. */
function makeRecordingGenerator(box: UsageBox): ReportGenerator {
  const client = new Anthropic();
  return async (userPrompt, correction) => {
    const messages: Anthropic.MessageParam[] = [
      { role: "user", content: userPrompt },
    ];
    if (correction) {
      messages.push({
        role: "user",
        content: `Your previous output was invalid and has been discarded. ${correction} Produce the full report again, corrected.`,
      });
    }
    const t0 = Date.now();
    const response = await client.messages.parse({
      model: EXPLAIN_MODEL,
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages,
      output_config: { format: zodOutputFormat(llmReportSchema) },
    });
    box.llmMs += Date.now() - t0;
    box.inputTokens += response.usage.input_tokens;
    box.outputTokens += response.usage.output_tokens;
    return response.parsed_output;
  };
}

/* -------------------------------------------------------------- workers -- */

async function runCase(evalCase: EvalCase): Promise<{
  baseline: BaselineCaseRecord;
  system: SystemCaseRecord;
}> {
  // Baseline: instant, local, unranked.
  const query = buildBaselineQuery(evalCase.intake);
  const b0 = Date.now();
  const matches = keywordSearch(query);
  const baseline: BaselineCaseRecord = {
    caseId: evalCase.id,
    query,
    programIds: matches.map((m) => m.programId),
    latencyMs: Date.now() - b0,
  };

  // Full pipeline with per-report wall clock and token accounting.
  const box: UsageBox = { inputTokens: 0, outputTokens: 0, llmMs: 0 };
  const t0 = Date.now();
  let system: SystemCaseRecord;
  try {
    const report = await runScreening(evalCase.intake, {
      generate: makeRecordingGenerator(box),
    });
    system = {
      caseId: evalCase.id,
      ok: true,
      report,
      latencyMs: Date.now() - t0,
      llmMs: box.llmMs,
      usage: { inputTokens: box.inputTokens, outputTokens: box.outputTokens },
      costUsd:
        (box.inputTokens / 1e6) * INPUT_USD_PER_M +
        (box.outputTokens / 1e6) * OUTPUT_USD_PER_M,
    };
  } catch (err) {
    system = {
      caseId: evalCase.id,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      latencyMs: Date.now() - t0,
      llmMs: box.llmMs,
    };
  }
  return { baseline, system };
}

async function pool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
  onDone: (result: R, index: number) => void,
): Promise<void> {
  let next = 0;
  const lanes = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (next < items.length) {
        const index = next++;
        const result = await worker(items[index], index);
        onDone(result, index);
      }
    },
  );
  await Promise.all(lanes);
}

/* ----------------------------------------------------------------- main -- */

/** Deterministic 15-case rubric sample: 3 per category, spread across it. */
function rubricSample(cases: EvalCase[]): string[] {
  const byCategory = new Map<string, EvalCase[]>();
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

async function main() {
  const { limit, concurrency, recompute } = parseArgs();
  const testset = JSON.parse(
    readFileSync(join(EVAL_DIR, "testset/families.json"), "utf8"),
  ) as { cases: EvalCase[] };
  const cases = limit ? testset.cases.slice(0, limit) : testset.cases;

  mkdirSync(RESULTS_DIR, { recursive: true });

  if (recompute) {
    const prior = JSON.parse(
      readFileSync(join(RESULTS_DIR, "run-latest.json"), "utf8"),
    ) as {
      startedAt: string;
      baselineRecords: BaselineCaseRecord[];
      systemRecords: SystemCaseRecord[];
    };
    const priorCases = testset.cases.filter((c) =>
      prior.systemRecords.some((r) => r.caseId === c.id),
    );
    finishRun(prior.startedAt, priorCases, prior.baselineRecords, prior.systemRecords);
    return;
  }

  const baselineRecords: BaselineCaseRecord[] = [];
  const systemRecords: SystemCaseRecord[] = [];
  const startedAt = new Date().toISOString();

  const checkpoint = () => {
    writeFileSync(
      join(RESULTS_DIR, "run-latest.json"),
      JSON.stringify(
        {
          startedAt,
          completed: systemRecords.length,
          total: cases.length,
          baselineRecords,
          systemRecords,
        },
        null,
        2,
      ) + "\n",
    );
  };

  console.log(`Running ${cases.length} cases at concurrency ${concurrency}…`);
  let done = 0;
  await pool(
    cases,
    concurrency,
    (c) => runCase(c),
    ({ baseline, system }) => {
      baselineRecords.push(baseline);
      systemRecords.push(system);
      done++;
      checkpoint();
      const status = system.ok
        ? `${(system.latencyMs / 1000).toFixed(1)}s $${system.costUsd?.toFixed(3)}`
        : `FAILED: ${system.error?.slice(0, 80)}`;
      console.log(`  [${done}/${cases.length}] ${system.caseId} — ${status}`);
    },
  );

  finishRun(startedAt, cases, baselineRecords, systemRecords);
}

function finishRun(
  startedAt: string,
  cases: EvalCase[],
  baselineRecords: BaselineCaseRecord[],
  systemRecords: SystemCaseRecord[],
) {
  const chunkIndex = {
    byId: new Map(
      (rawIndex as { chunks: { chunkId: string; programId: string }[] }).chunks.map(
        (c) => [c.chunkId, c.programId] as [string, string],
      ),
    ),
  };
  const system = computeSystemMetrics(cases, systemRecords, chunkIndex);
  const baseline = computeBaselineMetrics(cases, baselineRecords);
  const markdown = renderResultsMarkdown({
    generatedAt: startedAt,
    caseCount: cases.length,
    system,
    baseline,
    rubricSample: rubricSample(cases),
  });
  writeFileSync(join(RESULTS_DIR, "results.md"), markdown);

  console.log("\n" + markdown);
  console.log("Raw records: eval/results/run-latest.json");
  if (system.hallucinatedProgramRate > 0) {
    console.error(
      "HALLUCINATED-PROGRAM RATE IS NONZERO — investigate before shipping.",
    );
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
