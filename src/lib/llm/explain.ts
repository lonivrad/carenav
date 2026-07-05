import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

import type { Candidate } from "@/lib/rules/engine";
import type { ProgramRetrieval } from "@/lib/rag/retrieve";
import type { Profile } from "@/lib/schema/profile";
import { llmReportSchema, type LlmReport } from "@/lib/schema/report";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/llm/prompts";

/** Latest Sonnet. */
export const EXPLAIN_MODEL = "claude-sonnet-5";

export interface ExplainInput {
  profile: Profile;
  candidates: Candidate[];
  retrievals: ProgramRetrieval[];
}

/** Injectable for tests: returns the raw (unvalidated) model output. */
export type ReportGenerator = (
  userPrompt: string,
  correction?: string,
) => Promise<unknown>;

const defaultGenerator: ReportGenerator = async (userPrompt, correction) => {
  const client = new Anthropic();
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userPrompt },
  ];
  if (correction) {
    messages.push({
      role: "user",
      content: `Your previous output was invalid and has been discarded. ${correction} Produce the full report again, corrected.`,
    });
  }
  const response = await client.messages.parse({
    model: EXPLAIN_MODEL,
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    messages,
    output_config: {
      format: zodOutputFormat(llmReportSchema),
    },
  });
  return response.parsed_output;
};

/**
 * Cross-checks beyond schema shape — enforced mechanically, not by trust:
 * - the model never adds programs it wasn't given;
 * - every coverage claim cites at least one chunk id;
 * - every cited chunk id exists in that program's retrieved set;
 * - retrieval-failed programs carry no coverage claims.
 * Returns a list of violations (empty = valid).
 */
export function crossCheck(
  report: LlmReport,
  candidates: Candidate[],
  retrievals: ProgramRetrieval[],
): string[] {
  const problems: string[] = [];
  const candidateIds = new Set(candidates.map((c) => c.programId));
  const retrievalById = new Map(retrievals.map((r) => [r.programId, r]));

  for (const program of report.programs) {
    if (!candidateIds.has(program.programId)) {
      problems.push(
        `Program "${program.programId}" was not among the provided candidates.`,
      );
      continue;
    }
    const retrieval = retrievalById.get(program.programId);
    const availableChunkIds = new Set(
      retrieval?.status === "ok" ? retrieval.chunks.map((c) => c.chunkId) : [],
    );
    const retrievalFailed = !retrieval || retrieval.status === "retrieval_failed";

    if (retrievalFailed && program.whatItCovers.length > 0) {
      problems.push(
        `Program "${program.programId}" had RETRIEVAL_FAILED but includes coverage claims — whatItCovers must be empty.`,
      );
    }
    for (const claim of program.whatItCovers) {
      if (claim.chunkIds.length === 0) {
        problems.push(
          `Program "${program.programId}": claim "${claim.text.slice(0, 60)}…" has no citation.`,
        );
      }
      for (const chunkId of claim.chunkIds) {
        if (!availableChunkIds.has(chunkId)) {
          problems.push(
            `Program "${program.programId}": cited chunk "${chunkId}" was not among the provided passages.`,
          );
        }
      }
    }
  }

  const reportedIds = new Set(report.programs.map((p) => p.programId));
  for (const id of candidateIds) {
    if (!reportedIds.has(id)) {
      problems.push(`Candidate program "${id}" is missing from the report.`);
    }
  }
  return problems;
}

/**
 * Layer 3: ask the model to explain and prioritize the candidates it is
 * given. Output is Zod-validated and cross-checked; one retry with the
 * validation errors fed back, then hard failure.
 */
export async function explainCandidates(
  input: ExplainInput,
  generate: ReportGenerator = defaultGenerator,
): Promise<LlmReport> {
  const userPrompt = buildUserPrompt(input);

  let correction: string | undefined;
  for (let attempt = 1; attempt <= 2; attempt++) {
    let raw: unknown;
    try {
      raw = await generate(userPrompt, correction);
    } catch (err) {
      if (attempt === 2) throw err;
      correction = "The output failed schema validation.";
      continue;
    }

    const parsed = llmReportSchema.safeParse(raw);
    if (!parsed.success) {
      correction = `Schema errors: ${parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .slice(0, 10)
        .join("; ")}.`;
      if (attempt === 2) {
        throw new Error(
          `LLM report failed schema validation after retry: ${correction}`,
        );
      }
      continue;
    }

    const problems = crossCheck(parsed.data, input.candidates, input.retrievals);
    if (problems.length === 0) return parsed.data;

    correction = `Constraint violations: ${problems.slice(0, 10).join(" ")}`;
    if (attempt === 2) {
      throw new Error(
        `LLM report failed citation/program cross-checks after retry: ${correction}`,
      );
    }
  }
  // Unreachable, but keeps the compiler satisfied.
  throw new Error("LLM report generation failed");
}
