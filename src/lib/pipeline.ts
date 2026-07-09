import manifest from "@/data/corpus-manifest.json";
import { explainCandidates, type ReportGenerator } from "@/lib/llm/explain";
import { assignConfidence } from "@/lib/llm/confidence";
import { questionForField } from "@/lib/report/field-labels";
import { mergeStillNeeded } from "@/lib/report/still-needed";
import { retrieveForPrograms, type ProgramRetrieval } from "@/lib/rag/retrieve";
import { selectCandidates, type Candidate } from "@/lib/rules/engine";
import type { Intake } from "@/lib/schema/intake";
import { normalize } from "@/lib/schema/normalize";
import {
  REPORT_DISCLAIMER,
  reportSchema,
  type Report,
} from "@/lib/schema/report";

/** Official source URLs per program, from corpus provenance — never the model. */
const officialLinksById = new Map<string, string[]>(
  (manifest as { documents: { id: string; sourceUrls: string[] }[] }).documents.map(
    (d) => [d.id, d.sourceUrls],
  ),
);

/**
 * Orchestrates the full screening pipeline:
 * normalize intake → rules (Layer 1) → RAG (Layer 2) → LLM (Layer 3) →
 * deterministic assembly (confidence, citations, provenance, disclaimer).
 */
export async function runScreening(
  intake: Intake,
  opts: { generate?: ReportGenerator } = {},
): Promise<Report> {
  // Layer 0–1: normalize, then deterministic candidate selection.
  const profile = normalize(intake);
  const allCandidates = selectCandidates(profile);
  const candidates = allCandidates.filter((c) => c.status !== "excluded");

  // Layer 2: program-scoped retrieval from the committed corpus index.
  const retrievals = await retrieveForPrograms(
    candidates.map((c) => c.programId),
    profile,
  );

  // Layer 3: the model explains; validation + cross-checks inside.
  const llmReport = await explainCandidates(
    { profile, candidates, retrievals },
    ...(opts.generate ? [opts.generate] : []),
  );

  // Deterministic assembly — the LLM proposed, these modules dispose.
  const candidateById = new Map(candidates.map((c) => [c.programId, c]));
  const retrievalById = new Map<string, ProgramRetrieval>(
    retrievals.map((r) => [r.programId, r]),
  );

  const programs = llmReport.programs
    .map((p) => {
      const candidate = candidateById.get(p.programId) as Candidate;
      const retrieval = retrievalById.get(p.programId);
      return {
        programId: p.programId,
        programName: candidate.programName,
        status: (!retrieval || retrieval.status === "retrieval_failed"
          ? "unverified"
          : "ok") as "ok" | "unverified",
        relevanceLabel: assignConfidence(candidate, retrieval),
        whyThisMayApply: p.whyThisMayApply,
        whatItCovers: p.whatItCovers,
        // Deterministic backstop: every rules-known missing fact survives
        // even if the model dropped it (union, deduplicated by coverage).
        informationStillNeeded: mergeStillNeeded(p.informationStillNeeded, [
          ...candidate.unknownFields,
          ...candidate.alwaysNeeded,
        ]),
        citations: [...new Set(p.whatItCovers.flatMap((c) => c.chunkIds))],
        nextSteps: p.nextSteps,
        officialLinks: officialLinksById.get(p.programId) ?? [],
      };
    })
    .sort(
      (a, b) =>
        ["high", "medium", "low"].indexOf(a.relevanceLabel) -
        ["high", "medium", "low"].indexOf(b.relevanceLabel),
    );

  // Report-level unknowns come from the rules engine, not the model.
  const unknowns = [...new Set(candidates.flatMap((c) => c.unknownFields))];

  // Follow-up questions: the model's, plus a deterministic fallback so a
  // mostly-unknown profile always asks rather than recommends.
  const followUpQuestions = [...llmReport.followUpQuestions];
  const highlyUncertain =
    candidates.length > 0 &&
    candidates.every((c) => c.status === "possibly_relevant") &&
    unknowns.length >= 5;
  if (highlyUncertain && followUpQuestions.length === 0) {
    followUpQuestions.push(
      ...unknowns
        .filter((f) => !f.includes("not collected"))
        .slice(0, 6)
        .map(questionForField),
    );
  }

  return reportSchema.parse({
    overallSummary: llmReport.overallSummary,
    programs,
    unknowns,
    followUpQuestions,
    disclaimer: REPORT_DISCLAIMER,
  });
}
