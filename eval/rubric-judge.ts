/**
 * Automated rubric scoring — LLM-as-judge (INTERIM SIGNAL, NOT HUMAN-VERIFIED).
 *
 * Scores the 15-case stratified sample from eval/results/run-latest.json against
 * the five criteria in eval/rubric.md and writes eval/results/rubric-scores.md.
 *
 * These scores are produced by a model, not a human. They are an automated
 * interim signal only; human scoring against eval/rubric.md remains the intended
 * gold standard (see docs/evaluation.md). The judge shares the generator's model
 * family, so treat the numbers as directional and watch for self-preference.
 *
 * Reproduce: `npm run eval:rubric` (paid — one judge call per sampled case).
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

import { loadEnvLocal } from "@/lib/rag/local-env";
import type { Report } from "@/lib/schema/report";
import type { SystemCaseRecord } from "./metrics";
import { rubricSample } from "./sample";

loadEnvLocal();

const EVAL_DIR = dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = join(EVAL_DIR, "results");

/** Judge model — configurable; defaults to the shipping explanation model. */
export const JUDGE_MODEL = process.env.RUBRIC_JUDGE_MODEL ?? "claude-sonnet-5";

/**
 * The five rubric criteria with their 5/3/1 anchors, kept verbatim in sync with
 * eval/rubric.md so the judge scores exactly what a human rater would read.
 */
export const RUBRIC_JUDGE_SYSTEM_PROMPT = `You are an impartial evaluator scoring one CareNav screening report against a fixed rubric. CareNav is an educational tool that tells a family which eldercare funding programs "appear worth investigating" — it never determines eligibility.

Score each of the five criteria independently on a 1–5 integer scale. Be strict: reserve 5 for reports that fully meet the criterion, use 3 for "adequate with a specific flaw", and 1 for a real defect. Judge only what the report says; do not reward or penalize length. For each criterion give a one-sentence justification citing concrete evidence from the report.

Criteria and anchors:

1. grounding — Do factual statements about programs match the cited corpus passages, with nothing filled in from general knowledge? 5: every claim traceable to its citations, no unsupported statements. 3: broadly supported but at least one sentence stretches past the cited passage. 1: statements appear invented or contradict the cited passages. (You see the citation ids but not the corpus text, so score on internal consistency and whether claims are hedged to what a citation could support; flag anything that reads like outside knowledge.)

2. clarity — Could a stressed family member with no benefits background understand this on first read (plain words, short sentences, ~8th-grade level)? 5: reads effortlessly, jargon absent or explained. 3: understandable but requires rereading or tolerating jargon. 1: bureaucratic, dense, or confusing.

3. hedging — Does the language stay on the right side of "appears worth investigating" — never implying a determination, never scaremongering, saying plainly when something is unknown? 5: consistently exploratory tone, unknowns stated without false confidence, eligibility questions deflected correctly. 3: mostly right but at least one sentence over- or under-qualifies. 1: asserts or strongly implies qualification/disqualification.

4. actionability — Could the family act on the next steps today (who to call, what form, what to gather), and are the steps right for that program? 5: concrete, correctly targeted, realistically ordered. 3: directionally right but vague. 1: missing, generic, or wrong-agency steps.

5. unknownHandling — Does the report make missing information feel like a manageable to-do list (what's missing, why it matters, how to answer it) rather than a dead end? 5: unknowns specific, explained, paired with follow-up questions when they gate the screening. 3: unknowns listed but not connected to consequences. 1: unknowns ignored or glossed over.`;

const criterionSchema = z.object({
  score: z.number().int().min(1).max(5),
  justification: z.string(),
});
export const rubricScoreSchema = z.object({
  grounding: criterionSchema,
  clarity: criterionSchema,
  hedging: criterionSchema,
  actionability: criterionSchema,
  unknownHandling: criterionSchema,
});
export type RubricScore = z.infer<typeof rubricScoreSchema>;

const CRITERIA = [
  "grounding",
  "clarity",
  "hedging",
  "actionability",
  "unknownHandling",
] as const;

async function scoreOne(
  client: Anthropic,
  report: Report,
): Promise<RubricScore> {
  const response = await client.messages.parse({
    model: JUDGE_MODEL,
    max_tokens: 2000,
    system: RUBRIC_JUDGE_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Score this CareNav report. It is provided as JSON exactly as served to the family.\n\n${JSON.stringify(
          report,
          null,
          2,
        )}`,
      },
    ],
    output_config: { format: zodOutputFormat(rubricScoreSchema), effort: "low" },
  });
  if (!response.parsed_output) {
    throw new Error("judge returned no parseable rubric score");
  }
  return response.parsed_output;
}

function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

async function main() {
  const runLatest = JSON.parse(
    readFileSync(join(RESULTS_DIR, "run-latest.json"), "utf8"),
  ) as { systemRecords: SystemCaseRecord[] };

  const reportById = new Map<string, Report>();
  for (const r of runLatest.systemRecords) {
    if (r.ok && r.report) reportById.set(r.caseId, r.report);
  }

  // Sample the canonical 15 from the testset (in order) — the same list
  // results.md documents — not from run-latest's concurrent completion order.
  const testset = JSON.parse(
    readFileSync(join(EVAL_DIR, "testset/families.json"), "utf8"),
  ) as { cases: { id: string; category: string }[] };
  const sample = rubricSample(testset.cases);

  const client = new Anthropic();
  const rows: { id: string; score: RubricScore }[] = [];
  for (const id of sample) {
    const report = reportById.get(id);
    if (!report) {
      console.warn(`skip ${id}: no successful report in run-latest.json`);
      continue;
    }
    console.log(`scoring ${id}…`);
    rows.push({ id, score: await scoreOne(client, report) });
  }

  const generatedAt = new Date().toISOString();
  const md = renderScores(rows, generatedAt);
  mkdirSync(RESULTS_DIR, { recursive: true });
  writeFileSync(join(RESULTS_DIR, "rubric-scores.md"), md);
  console.log(`\nWrote eval/results/rubric-scores.md (${rows.length} cases).`);
}

function renderScores(
  rows: { id: string; score: RubricScore }[],
  generatedAt: string,
): string {
  const lines: string[] = [];
  lines.push("# Rubric scores — MODEL-GENERATED (LLM-as-judge), NOT HUMAN-VERIFIED");
  lines.push("");
  lines.push(
    "> **These numbers were produced by a model, not a human.** They are an " +
      "automated LLM-as-judge pass over the 15-case sample and are an interim " +
      "signal only. Human scoring against `eval/rubric.md` remains the intended " +
      "gold standard and is the next step. The judge (" +
      `\`${JUDGE_MODEL}\`) shares the explanation model's family, so scores may ` +
      "carry self-preference — read them as directional, not authoritative.",
  );
  lines.push("");
  lines.push(
    `Generated ${generatedAt} by \`eval/rubric-judge.ts\` (\`npm run eval:rubric\`), ` +
      "scoring the reports in `eval/results/run-latest.json`. Judge prompt and " +
      "schema are in that script; re-running reproduces this file.",
  );
  lines.push("");
  lines.push("| case id | grounding | clarity | hedging | next steps | unknowns |");
  lines.push("|---|---|---|---|---|---|");
  for (const { id, score } of rows) {
    lines.push(
      `| ${id} | ${score.grounding.score} | ${score.clarity.score} | ` +
        `${score.hedging.score} | ${score.actionability.score} | ` +
        `${score.unknownHandling.score} |`,
    );
  }
  const means = CRITERIA.map((c) => mean(rows.map((r) => r.score[c].score)));
  lines.push(
    `| **mean** | ${means.map((m) => m.toFixed(2)).join(" | ")} |`,
  );
  lines.push("");

  const flagged = rows.filter((r) =>
    CRITERIA.some((c) => r.score[c].score === 1),
  );
  lines.push("## Flagged (any criterion scored 1 — investigate, do not average away)");
  lines.push("");
  if (flagged.length === 0) {
    lines.push("None.");
  } else {
    for (const { id, score } of flagged) {
      const ones = CRITERIA.filter((c) => score[c].score === 1);
      for (const c of ones) {
        lines.push(`- **${id}** — ${c}: ${score[c].justification}`);
      }
    }
  }
  lines.push("");
  return lines.join("\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
