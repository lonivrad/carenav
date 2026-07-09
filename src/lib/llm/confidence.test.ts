import { describe, expect, it } from "vitest";

import { assignConfidence } from "@/lib/llm/confidence";
import type { Candidate } from "@/lib/rules/engine";
import type { ProgramRetrieval, RetrievedChunk } from "@/lib/rag/retrieve";

const candidate = (
  status: Candidate["status"],
  unknownFields: string[] = [],
): Candidate => ({
  programId: "p",
  programName: "P",
  corpusDocumentId: "p",
  status,
  ruleResults: [],
  unknownFields,
  failedRules: [],
  alwaysNeeded: [],
});

const chunk = (score: number): RetrievedChunk => ({
  chunkId: "p#00",
  programId: "p",
  documentId: "p",
  docPath: "src/data/corpus/p.md",
  heading: "Eligibility",
  sourceUrls: ["https://example.gov"],
  text: "…",
  score,
});

const ok = (score: number): ProgramRetrieval => ({
  programId: "p",
  status: "ok",
  chunks: [chunk(score)],
});

const failed: ProgramRetrieval = {
  programId: "p",
  status: "retrieval_failed",
  bestScore: 0.2,
};

describe("assignConfidence — deterministic, the LLM never decides", () => {
  it("caps at low whenever retrieval failed or is missing", () => {
    expect(assignConfidence(candidate("likely_relevant"), failed)).toBe("low");
    expect(assignConfidence(candidate("likely_relevant"), undefined)).toBe("low");
    expect(assignConfidence(candidate("possibly_relevant"), failed)).toBe("low");
  });

  it("likely_relevant: high with strong retrieval, medium with weak", () => {
    expect(assignConfidence(candidate("likely_relevant"), ok(0.75))).toBe("high");
    expect(assignConfidence(candidate("likely_relevant"), ok(0.6))).toBe("high");
    expect(assignConfidence(candidate("likely_relevant"), ok(0.59))).toBe("medium");
  });

  it("possibly_relevant: medium only with few unknowns AND strong retrieval", () => {
    expect(
      assignConfidence(candidate("possibly_relevant", ["a"]), ok(0.7)),
    ).toBe("medium");
    expect(
      assignConfidence(candidate("possibly_relevant", ["a", "b"]), ok(0.7)),
    ).toBe("medium");
    expect(
      assignConfidence(candidate("possibly_relevant", ["a", "b", "c"]), ok(0.9)),
    ).toBe("low");
    expect(
      assignConfidence(candidate("possibly_relevant", ["a"]), ok(0.5)),
    ).toBe("low");
  });

  it("excluded (defensive): low", () => {
    expect(assignConfidence(candidate("excluded"), ok(0.9))).toBe("low");
  });
});
