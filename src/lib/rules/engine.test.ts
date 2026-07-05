import { describe, expect, it } from "vitest";

import type { Profile } from "@/lib/schema/profile";
import { evaluateProgram, selectCandidates } from "@/lib/rules/engine";
import { programs, type ProgramRules } from "@/lib/rules/programs";

const baseProfile: Profile = {
  state: "WA",
  age: 82,
  county: "King",
  livingSituation: "own_home",
  adlsNeedingHelp: ["bathing", "dressing", "transferring"],
  adlHelpCount: 3,
  diagnosisCategory: "dementia",
  veteran: { isVeteran: true, serviceEra: "vietnam", dischargeType: "honorable" },
  maritalStatus: "married",
  monthlyIncomeBracket: "1000_to_2999",
  countableAssetsBracket: "under_2000",
  ownsHome: true,
  insurance: {
    medicare: true,
    medicaid: true,
    ltcInsurance: false,
    privateInsurance: false,
  },
  recentRelocation: false,
  waCaresParticipation: "contributing",
};

/** Synthetic programs to exercise every classification branch in isolation. */
const synthetic = (outcomes: ("pass" | "fail" | "unknown")[]): ProgramRules => ({
  programId: "synthetic",
  programName: "Synthetic",
  corpusDocumentId: "synthetic",
  rules: outcomes.map((outcome, i) => ({
    id: `rule-${i}`,
    description: `always ${outcome}`,
    fields: [`field-${i}`],
    evaluate: () => outcome,
  })),
});

describe("evaluateProgram classification", () => {
  it("classifies all-pass as likely_relevant", () => {
    const c = evaluateProgram(synthetic(["pass", "pass"]), baseProfile);
    expect(c.status).toBe("likely_relevant");
    expect(c.unknownFields).toEqual([]);
    expect(c.failedRules).toEqual([]);
    expect(c.ruleResults).toHaveLength(2);
  });

  it("classifies passes + unknowns as possibly_relevant and lists missing fields", () => {
    const c = evaluateProgram(
      synthetic(["pass", "unknown", "unknown"]),
      baseProfile,
    );
    expect(c.status).toBe("possibly_relevant");
    expect(c.unknownFields).toEqual(["field-1", "field-2"]);
    expect(c.failedRules).toEqual([]);
  });

  it("classifies any hard fail as excluded and names the failing rule", () => {
    const c = evaluateProgram(synthetic(["pass", "fail"]), baseProfile);
    expect(c.status).toBe("excluded");
    expect(c.failedRules).toEqual(["rule-1"]);
  });

  it("lets a fail dominate unknowns (excluded, not possibly_relevant)", () => {
    const c = evaluateProgram(synthetic(["unknown", "fail"]), baseProfile);
    expect(c.status).toBe("excluded");
    expect(c.failedRules).toEqual(["rule-1"]);
    // Unknown fields are still reported for transparency.
    expect(c.unknownFields).toEqual(["field-0"]);
  });

  it("deduplicates unknown fields shared across rules", () => {
    const program: ProgramRules = {
      programId: "dup",
      programName: "Dup",
      corpusDocumentId: "dup",
      rules: [0, 1].map((i) => ({
        id: `r${i}`,
        description: "shared field",
        fields: ["sharedField"],
        evaluate: () => "unknown" as const,
      })),
    };
    const c = evaluateProgram(program, baseProfile);
    expect(c.unknownFields).toEqual(["sharedField"]);
  });

  it("classifies a program with no rules as likely_relevant", () => {
    const c = evaluateProgram(synthetic([]), baseProfile);
    expect(c.status).toBe("likely_relevant");
  });

  it("carries program identity through to the candidate", () => {
    const c = evaluateProgram(programs[0], baseProfile);
    expect(c.programId).toBe(programs[0].programId);
    expect(c.programName).toBe(programs[0].programName);
    expect(c.corpusDocumentId).toBe(programs[0].corpusDocumentId);
  });
});

describe("selectCandidates", () => {
  it("evaluates every program in the default registry", () => {
    const candidates = selectCandidates(baseProfile);
    expect(candidates).toHaveLength(programs.length);
    expect(candidates.map((c) => c.programId)).toEqual(
      programs.map((p) => p.programId),
    );
  });

  it("accepts a custom registry", () => {
    const candidates = selectCandidates(baseProfile, [synthetic(["pass"])]);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].status).toBe("likely_relevant");
  });

  it("produces the expected classification spread for a known profile", () => {
    const byId = Object.fromEntries(
      selectCandidates(baseProfile).map((c) => [c.programId, c]),
    );
    // 82-year-old veteran in King County, 3 ADLs, on Medicare + Medicaid,
    // contributed to WA Cares, income $1,000–2,999, assets under $2,000.
    expect(byId["wa-cares-fund"].status).toBe("likely_relevant");
    expect(byId["va-aid-attendance"].status).toBe("likely_relevant");
    expect(byId["wa-pace"].status).toBe("likely_relevant");
    expect(byId["medicare-home-health"].status).toBe("likely_relevant");
    expect(byId["wa-medicaid-cfc"].status).toBe("likely_relevant");
    // Income bracket straddles the SIL → missing data, not a guess.
    expect(byId["wa-medicaid-copes"].status).toBe("possibly_relevant");
    expect(byId["wa-medicaid-copes"].unknownFields).toEqual([
      "monthlyIncomeBracket",
    ]);
    // On Medicaid → TSOA excluded by the named rule (MAC is the counterpart).
    expect(byId["wa-tsoa"].status).toBe("excluded");
    expect(byId["wa-tsoa"].failedRules).toEqual(["tsoa-not-on-medicaid"]);
    expect(byId["wa-mac"].status).toBe("possibly_relevant");
    expect(byId["wa-mac"].unknownFields).toEqual([
      "unpaidCaregiver (not collected)",
    ]);
  });

  it("never guesses: an all-unknown profile yields only possibly_relevant", () => {
    const allUnknown: Profile = {
      state: "WA",
      age: "unknown",
      county: "unknown",
      livingSituation: "unknown",
      adlsNeedingHelp: "unknown",
      adlHelpCount: "unknown",
      diagnosisCategory: "unknown",
      veteran: {
        isVeteran: "unknown",
        serviceEra: "unknown",
        dischargeType: "unknown",
      },
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
    const candidates = selectCandidates(allUnknown);
    for (const c of candidates) {
      expect(c.status).toBe("possibly_relevant");
      expect(c.failedRules).toEqual([]);
      expect(c.unknownFields.length).toBeGreaterThan(0);
    }
  });
});
