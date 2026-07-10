import { describe, expect, it } from "vitest";

import { buildUserPrompt } from "@/lib/llm/prompts";
import type { Candidate } from "@/lib/rules/engine";
import type { ProgramRetrieval } from "@/lib/rag/retrieve";
import type { Profile } from "@/lib/schema/profile";

const profile: Profile = {
  state: "WA",
  age: 80,
  county: "King",
  livingSituation: "own_home",
  adlsNeedingHelp: ["bathing"],
  adlHelpCount: 1,
  diagnosisCategory: [],
  veteran: { isVeteran: false, serviceEra: "not_applicable", dischargeType: "not_applicable" },
  maritalStatus: "single",
  monthlyIncomeBracket: "under_1000",
  countableAssetsBracket: "under_2000",
  ownsHome: false,
  insurance: { medicare: true, medicaid: false, ltcInsurance: false, privateInsurance: false },
  recentRelocation: false,
  waCaresParticipation: "not_contributing",
};

const candidate = (over: Partial<Candidate>): Candidate => ({
  programId: "medicare-home-health",
  programName: "Medicare home health benefit",
  corpusDocumentId: "medicare-home-health",
  status: "likely_relevant",
  ruleResults: [],
  unknownFields: [],
  failedRules: [],
  alwaysNeeded: [],
  ...over,
});

const retrievals: ProgramRetrieval[] = [
  { programId: "medicare-home-health", status: "retrieval_failed", bestScore: 0 },
];

describe("buildUserPrompt missing-data line", () => {
  it("includes both unknownFields and alwaysNeeded", () => {
    const prompt = buildUserPrompt({
      profile,
      candidates: [
        candidate({
          unknownFields: ["monthlyIncomeBracket"],
          alwaysNeeded: ["homebound status and provider certification (not collected)"],
        }),
      ],
      retrievals,
    });
    expect(prompt).toContain(
      "Missing data: monthlyIncomeBracket, homebound status and provider certification (not collected)",
    );
  });

  it("says none only when both lists are empty", () => {
    const prompt = buildUserPrompt({
      profile,
      candidates: [candidate({})],
      retrievals,
    });
    expect(prompt).toContain("Missing data: none");
  });
});
