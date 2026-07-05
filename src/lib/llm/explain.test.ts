import { describe, expect, it, vi } from "vitest";

import { crossCheck, explainCandidates } from "@/lib/llm/explain";
import type { Candidate } from "@/lib/rules/engine";
import type { ProgramRetrieval } from "@/lib/rag/retrieve";
import type { LlmReport } from "@/lib/schema/report";
import type { Profile } from "@/lib/schema/profile";

const profile: Profile = {
  state: "WA",
  age: 82,
  county: "King",
  livingSituation: "own_home",
  adlsNeedingHelp: ["bathing"],
  adlHelpCount: 1,
  diagnosisCategory: "unknown",
  veteran: { isVeteran: "unknown", serviceEra: "unknown", dischargeType: "unknown" },
  maritalStatus: "unknown",
  monthlyIncomeBracket: "unknown",
  countableAssetsBracket: "unknown",
  ownsHome: "unknown",
  insurance: {
    medicare: "unknown",
    medicaid: "unknown",
    ltcInsurance: "unknown",
    privateInsurance: "unknown",
  },
  recentRelocation: "unknown",
  waCaresParticipation: "unknown",
};

const candidates: Candidate[] = [
  {
    programId: "wa-tsoa",
    programName: "TSOA",
    corpusDocumentId: "wa-tsoa",
    status: "possibly_relevant",
    ruleResults: [],
    unknownFields: ["monthlyIncomeBracket"],
    failedRules: [],
  },
];

const retrievals: ProgramRetrieval[] = [
  {
    programId: "wa-tsoa",
    status: "ok",
    chunks: [
      {
        chunkId: "wa-tsoa#01-eligibility",
        programId: "wa-tsoa",
        documentId: "wa-tsoa",
        docPath: "src/data/corpus/wa-tsoa.md",
        heading: "Eligibility",
        sourceUrls: ["https://www.dshs.wa.gov"],
        text: "…",
        score: 0.7,
      },
    ],
  },
];

const validReport: LlmReport = {
  overallSummary: "Summary.",
  followUpQuestions: ["Roughly what is their monthly income?"],
  programs: [
    {
      programId: "wa-tsoa",
      proposedRelevance: "medium",
      whyThisMayApply: "Because the person is 82 and needs help with bathing.",
      whatItCovers: [
        { text: "Supports family caregivers.", chunkIds: ["wa-tsoa#01-eligibility"] },
      ],
      informationStillNeeded: ["Monthly income"],
      nextSteps: ["Call Community Living Connections."],
    },
  ],
};

describe("crossCheck", () => {
  it("accepts a valid report", () => {
    expect(crossCheck(validReport, candidates, retrievals)).toEqual([]);
  });

  it("flags invented programs", () => {
    const bad = {
      ...validReport,
      programs: [
        ...validReport.programs,
        { ...validReport.programs[0], programId: "invented-program" },
      ],
    };
    expect(crossCheck(bad, candidates, retrievals).join(" ")).toContain(
      "invented-program",
    );
  });

  it("flags uncited claims and unknown chunk ids", () => {
    const uncited = {
      ...validReport,
      programs: [
        {
          ...validReport.programs[0],
          whatItCovers: [
            { text: "Uncited claim.", chunkIds: [] },
            { text: "Bad citation.", chunkIds: ["nonexistent#chunk"] },
          ],
        },
      ],
    };
    const problems = crossCheck(uncited, candidates, retrievals);
    expect(problems.some((p) => p.includes("no citation"))).toBe(true);
    expect(problems.some((p) => p.includes("nonexistent#chunk"))).toBe(true);
  });

  it("flags coverage claims for retrieval-failed programs", () => {
    const failedRetrievals: ProgramRetrieval[] = [
      { programId: "wa-tsoa", status: "retrieval_failed", bestScore: 0.1 },
    ];
    const problems = crossCheck(validReport, candidates, failedRetrievals);
    expect(problems.join(" ")).toContain("RETRIEVAL_FAILED");
  });

  it("flags missing candidates", () => {
    const empty = { ...validReport, programs: [] };
    expect(crossCheck(empty, candidates, retrievals).join(" ")).toContain(
      "missing from the report",
    );
  });
});

describe("explainCandidates — validate, retry once, fail loud", () => {
  it("returns a valid report on the first attempt", async () => {
    const generate = vi.fn().mockResolvedValue(validReport);
    const report = await explainCandidates(
      { profile, candidates, retrievals },
      generate,
    );
    expect(report).toEqual(validReport);
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it("retries once with corrective feedback on invalid output, then succeeds", async () => {
    const generate = vi
      .fn()
      .mockResolvedValueOnce({ nonsense: true })
      .mockResolvedValueOnce(validReport);
    const report = await explainCandidates(
      { profile, candidates, retrievals },
      generate,
    );
    expect(report).toEqual(validReport);
    expect(generate).toHaveBeenCalledTimes(2);
    // Second call carries the correction message.
    expect(generate.mock.calls[1][1]).toContain("Schema errors");
  });

  it("fails loud after two invalid attempts", async () => {
    const generate = vi.fn().mockResolvedValue({ nonsense: true });
    await expect(
      explainCandidates({ profile, candidates, retrievals }, generate),
    ).rejects.toThrow(/failed schema validation after retry/);
    expect(generate).toHaveBeenCalledTimes(2);
  });

  it("fails loud when cross-checks keep failing (e.g., invented citations)", async () => {
    const bad = {
      ...validReport,
      programs: [
        {
          ...validReport.programs[0],
          whatItCovers: [{ text: "Bad.", chunkIds: ["fake#chunk"] }],
        },
      ],
    };
    const generate = vi.fn().mockResolvedValue(bad);
    await expect(
      explainCandidates({ profile, candidates, retrievals }, generate),
    ).rejects.toThrow(/cross-checks after retry/);
    expect(generate).toHaveBeenCalledTimes(2);
  });
});
