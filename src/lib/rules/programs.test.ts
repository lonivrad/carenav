import { describe, expect, it } from "vitest";

import type { Profile } from "@/lib/schema/profile";
import { evaluateProgram } from "@/lib/rules/engine";
import { programs, type RuleOutcome } from "@/lib/rules/programs";

const base: Profile = {
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

type Overrides = Omit<Partial<Profile>, "veteran" | "insurance"> & {
  veteran?: Partial<Profile["veteran"]>;
  insurance?: Partial<Profile["insurance"]>;
};

const prof = (over: Overrides = {}): Profile => ({
  ...base,
  ...over,
  veteran: { ...base.veteran, ...over.veteran },
  insurance: { ...base.insurance, ...over.insurance },
});

const byId = (programId: string) => {
  const program = programs.find((p) => p.programId === programId);
  if (!program) throw new Error(`unknown program ${programId}`);
  return program;
};

const outcome = (
  programId: string,
  ruleId: string,
  profile: Profile,
): RuleOutcome => {
  const result = evaluateProgram(byId(programId), profile).ruleResults.find(
    (r) => r.ruleId === ruleId,
  );
  if (!result) throw new Error(`unknown rule ${ruleId}`);
  return result.outcome;
};

describe("registry shape", () => {
  it("covers all 12 corpus programs with distinct ids", () => {
    expect(programs).toHaveLength(12);
    expect(new Set(programs.map((p) => p.programId)).size).toBe(12);
    for (const p of programs) {
      expect(p.rules.length).toBeGreaterThan(0);
      expect(p.corpusDocumentId).toBeTruthy();
    }
  });
});

describe("age thresholds", () => {
  it("TSOA/MAC require 55+: 54 fails, 55 passes", () => {
    expect(outcome("wa-tsoa", "tsoa-age", prof({ age: 54 }))).toBe("fail");
    expect(outcome("wa-tsoa", "tsoa-age", prof({ age: 55 }))).toBe("pass");
    expect(outcome("wa-mac", "mac-age", prof({ age: 54 }))).toBe("fail");
    expect(outcome("wa-mac", "mac-age", prof({ age: 55 }))).toBe("pass");
    expect(outcome("wa-tsoa", "tsoa-age", prof({ age: "unknown" }))).toBe(
      "unknown",
    );
  });

  it("PACE: under 55 fails, 55–64 unknown (disability not collected), 65+ passes", () => {
    expect(outcome("wa-pace", "pace-age", prof({ age: 54 }))).toBe("fail");
    expect(outcome("wa-pace", "pace-age", prof({ age: 55 }))).toBe("unknown");
    expect(outcome("wa-pace", "pace-age", prof({ age: 64 }))).toBe("unknown");
    expect(outcome("wa-pace", "pace-age", prof({ age: 65 }))).toBe("pass");
    expect(outcome("wa-pace", "pace-age", prof({ age: "unknown" }))).toBe(
      "unknown",
    );
  });

  it("COPES/Apple Health LTC: 64 is unknown (SSI disability route), 65 passes", () => {
    expect(outcome("wa-medicaid-copes", "copes-age", prof({ age: 64 }))).toBe(
      "unknown",
    );
    expect(outcome("wa-medicaid-copes", "copes-age", prof({ age: 65 }))).toBe(
      "pass",
    );
    expect(outcome("wa-apple-health-ltc", "ahltc-age", prof({ age: 18 }))).toBe(
      "unknown",
    );
  });
});

describe("ADL thresholds", () => {
  it("NFLOC proxy: 0 fails, 1 unknown, 2 passes", () => {
    for (const [count, expected] of [
      [0, "fail"],
      [1, "unknown"],
      [2, "pass"],
    ] as const) {
      expect(
        outcome("wa-medicaid-copes", "copes-nfloc", prof({ adlHelpCount: count })),
      ).toBe(expected);
      expect(
        outcome("wa-pace", "pace-nfloc", prof({ adlHelpCount: count })),
      ).toBe(expected);
      expect(
        outcome("wa-tsoa", "tsoa-nfloc", prof({ adlHelpCount: count })),
      ).toBe(expected);
    }
    expect(
      outcome("wa-mac", "mac-nfloc", prof({ adlHelpCount: "unknown" })),
    ).toBe("unknown");
  });

  it("CFC: 0 fails, 1–2 unknown, 3 passes", () => {
    expect(outcome("wa-medicaid-cfc", "cfc-adl-need", prof({ adlHelpCount: 0 }))).toBe("fail");
    expect(outcome("wa-medicaid-cfc", "cfc-adl-need", prof({ adlHelpCount: 2 }))).toBe("unknown");
    expect(outcome("wa-medicaid-cfc", "cfc-adl-need", prof({ adlHelpCount: 3 }))).toBe("pass");
  });

  it("WA Cares trigger: <3 is unknown (ADL sets differ), never a fail", () => {
    expect(outcome("wa-cares-fund", "wacares-adl-trigger", prof({ adlHelpCount: 0 }))).toBe("unknown");
    expect(outcome("wa-cares-fund", "wacares-adl-trigger", prof({ adlHelpCount: 2 }))).toBe("unknown");
    expect(outcome("wa-cares-fund", "wacares-adl-trigger", prof({ adlHelpCount: 3 }))).toBe("pass");
  });

  it("VA A&A care need: 1+ passes, 0 unknown (alternate clinical routes)", () => {
    expect(outcome("va-aid-attendance", "vaaa-care-need", prof({ adlHelpCount: 0 }))).toBe("unknown");
    expect(outcome("va-aid-attendance", "vaaa-care-need", prof({ adlHelpCount: 1 }))).toBe("pass");
  });

  it("respite: any care need passes, none is unknown", () => {
    expect(outcome("wa-respite-care", "respite-care-need", prof({ adlHelpCount: 0 }))).toBe("unknown");
    expect(outcome("wa-respite-care", "respite-care-need", prof({ adlHelpCount: 1 }))).toBe("pass");
  });

  it("Medicare home health skilled-need proxy: 1+ passes, 0 unknown", () => {
    expect(outcome("medicare-home-health", "mhh-skilled-need", prof({ adlHelpCount: 0 }))).toBe("unknown");
    expect(outcome("medicare-home-health", "mhh-skilled-need", prof({ adlHelpCount: 1 }))).toBe("pass");
    expect(outcome("medicare-home-health", "mhh-skilled-need", prof({ adlHelpCount: "unknown" }))).toBe("unknown");
  });
});

describe("income thresholds", () => {
  it("TSOA ($3,976 limit): brackets pass/straddle/fail correctly", () => {
    expect(outcome("wa-tsoa", "tsoa-income", prof({ monthlyIncomeBracket: "under_1000" }))).toBe("pass");
    expect(outcome("wa-tsoa", "tsoa-income", prof({ monthlyIncomeBracket: "1000_to_2999" }))).toBe("pass");
    // $3,000–3,999 straddles the $3,976 limit.
    expect(outcome("wa-tsoa", "tsoa-income", prof({ monthlyIncomeBracket: "3000_to_3999" }))).toBe("unknown");
    expect(outcome("wa-tsoa", "tsoa-income", prof({ monthlyIncomeBracket: "4000_or_more" }))).toBe("fail");
    expect(outcome("wa-tsoa", "tsoa-income", prof({ monthlyIncomeBracket: "unknown" }))).toBe("unknown");
  });

  it("SIL ($2,982): only under_1000 clearly passes; higher brackets stay unknown (MN pathway)", () => {
    expect(outcome("wa-medicaid-copes", "copes-income", prof({ monthlyIncomeBracket: "under_1000" }))).toBe("pass");
    // $1,000–2,999 straddles the SIL.
    expect(outcome("wa-medicaid-copes", "copes-income", prof({ monthlyIncomeBracket: "1000_to_2999" }))).toBe("unknown");
    // Above the SIL the Medically Needy pathway may still apply — never fail.
    expect(outcome("wa-medicaid-copes", "copes-income", prof({ monthlyIncomeBracket: "4000_or_more" }))).toBe("unknown");
    expect(outcome("wa-apple-health-ltc", "ahltc-income", prof({ monthlyIncomeBracket: "3000_to_3999" }))).toBe("unknown");
  });
});

describe("asset thresholds", () => {
  it("Medicaid limit ($2,000 single): single above fails, married stays unknown (spousal protections)", () => {
    const off = { insurance: { medicaid: false as const } };
    expect(outcome("wa-medicaid-copes", "copes-assets", prof({ countableAssetsBracket: "under_2000", ...off }))).toBe("pass");
    expect(
      outcome("wa-medicaid-copes", "copes-assets", prof({ countableAssetsBracket: "2000_to_85000", maritalStatus: "single", ...off })),
    ).toBe("fail");
    expect(
      outcome("wa-medicaid-copes", "copes-assets", prof({ countableAssetsBracket: "2000_to_85000", maritalStatus: "married", ...off })),
    ).toBe("unknown");
    expect(
      outcome("wa-medicaid-copes", "copes-assets", prof({ countableAssetsBracket: "160000_or_more", maritalStatus: "widowed", ...off })),
    ).toBe("fail");
    expect(
      outcome("wa-medicaid-copes", "copes-assets", prof({ countableAssetsBracket: "2000_to_85000", maritalStatus: "unknown", ...off })),
    ).toBe("unknown");
    expect(
      outcome("wa-apple-health-ltc", "ahltc-assets", prof({ countableAssetsBracket: "unknown", ...off })),
    ).toBe("unknown");
  });

  it("Medicaid limit with reported enrollment: above-limit assets conflict → unknown, never fail", () => {
    const on = { insurance: { medicaid: true as const } };
    // Enrolled + under the limit is still a clean pass.
    expect(outcome("wa-medicaid-copes", "copes-assets", prof({ countableAssetsBracket: "under_2000", ...on }))).toBe("pass");
    // Enrolled + above the limit: CN implies ≤$2k, MAGI has no asset test —
    // conflicting signals stay unknown for every above-limit bracket.
    expect(
      outcome("wa-medicaid-copes", "copes-assets", prof({ countableAssetsBracket: "2000_to_85000", maritalStatus: "single", ...on })),
    ).toBe("unknown");
    expect(
      outcome("wa-apple-health-ltc", "ahltc-assets", prof({ countableAssetsBracket: "85000_to_160000", maritalStatus: "widowed", ...on })),
    ).toBe("unknown");
    expect(
      outcome("wa-medicaid-copes", "copes-assets", prof({ countableAssetsBracket: "160000_or_more", maritalStatus: "single", ...on })),
    ).toBe("unknown");
    // Deliberate minimal-change choice: unknown enrollment does not soften
    // the single above-limit fail (only a positive enrollment report does).
    expect(
      outcome("wa-medicaid-copes", "copes-assets", prof({ countableAssetsBracket: "2000_to_85000", maritalStatus: "single", insurance: { medicaid: "unknown" } })),
    ).toBe("fail");
  });

  it("TSOA limits ($84,354 single / $156,883 married)", () => {
    expect(outcome("wa-tsoa", "tsoa-assets", prof({ countableAssetsBracket: "under_2000" }))).toBe("pass");
    expect(outcome("wa-tsoa", "tsoa-assets", prof({ countableAssetsBracket: "2000_to_85000", maritalStatus: "single" }))).toBe("pass");
    expect(outcome("wa-tsoa", "tsoa-assets", prof({ countableAssetsBracket: "85000_to_160000", maritalStatus: "married" }))).toBe("pass");
    expect(outcome("wa-tsoa", "tsoa-assets", prof({ countableAssetsBracket: "85000_to_160000", maritalStatus: "single" }))).toBe("fail");
    expect(outcome("wa-tsoa", "tsoa-assets", prof({ countableAssetsBracket: "85000_to_160000", maritalStatus: "unknown" }))).toBe("unknown");
    expect(outcome("wa-tsoa", "tsoa-assets", prof({ countableAssetsBracket: "160000_or_more", maritalStatus: "married" }))).toBe("fail");
    expect(outcome("wa-tsoa", "tsoa-assets", prof({ countableAssetsBracket: "unknown" }))).toBe("unknown");
  });

  it("VA net worth ($163,699): top bracket straddles the limit", () => {
    expect(outcome("va-aid-attendance", "vaaa-net-worth", prof({ countableAssetsBracket: "85000_to_160000" }))).toBe("pass");
    expect(outcome("va-aid-attendance", "vaaa-net-worth", prof({ countableAssetsBracket: "160000_or_more" }))).toBe("unknown");
    expect(outcome("va-housebound", "vahb-net-worth", prof({ countableAssetsBracket: "unknown" }))).toBe("unknown");
  });
});

describe("veteran gates", () => {
  it("non-veterans are excluded from VA programs with the rule named", () => {
    const c = evaluateProgram(
      byId("va-aid-attendance"),
      prof({
        veteran: {
          isVeteran: false,
          serviceEra: "not_applicable",
          dischargeType: "not_applicable",
        },
      }),
    );
    expect(c.status).toBe("excluded");
    expect(c.failedRules).toContain("vaaa-veteran");
  });

  it("unknown veteran status stays unknown", () => {
    expect(
      outcome("va-aid-attendance", "vaaa-veteran", prof({ veteran: { isVeteran: "unknown" } })),
    ).toBe("unknown");
  });

  it("wartime service: peacetime fails, each wartime era passes, unknown stays unknown", () => {
    for (const era of ["wwii", "korea", "vietnam", "gulf_war_or_later"] as const) {
      expect(outcome("va-aid-attendance", "vaaa-wartime", prof({ veteran: { serviceEra: era } }))).toBe("pass");
    }
    expect(outcome("va-aid-attendance", "vaaa-wartime", prof({ veteran: { serviceEra: "peacetime" } }))).toBe("fail");
    expect(outcome("va-housebound", "vahb-wartime", prof({ veteran: { serviceEra: "unknown" } }))).toBe("unknown");
  });

  it("discharge: honorable/general pass, OTH unknown, bad conduct/dishonorable fails", () => {
    expect(outcome("va-aid-attendance", "vaaa-discharge", prof({ veteran: { dischargeType: "honorable" } }))).toBe("pass");
    expect(outcome("va-aid-attendance", "vaaa-discharge", prof({ veteran: { dischargeType: "general" } }))).toBe("pass");
    expect(outcome("va-aid-attendance", "vaaa-discharge", prof({ veteran: { dischargeType: "other_than_honorable" } }))).toBe("unknown");
    expect(outcome("va-aid-attendance", "vaaa-discharge", prof({ veteran: { dischargeType: "bad_conduct_or_dishonorable" } }))).toBe("fail");
    expect(outcome("va-housebound", "vahb-discharge", prof({ veteran: { dischargeType: "unknown" } }))).toBe("unknown");
  });

  it("housebound proxy: mobility need passes, otherwise unknown", () => {
    expect(
      outcome("va-housebound", "vahb-housebound", prof({ adlsNeedingHelp: ["mobility"] })),
    ).toBe("pass");
    expect(
      outcome("va-housebound", "vahb-housebound", prof({ adlsNeedingHelp: ["bathing"] })),
    ).toBe("unknown");
    expect(
      outcome("va-housebound", "vahb-housebound", prof({ adlsNeedingHelp: "unknown" })),
    ).toBe("unknown");
  });
});

describe("insurance and enrollment gates", () => {
  it("Medicare programs require Medicare", () => {
    expect(outcome("medicare-home-health", "mhh-medicare", prof({ insurance: { medicare: false } }))).toBe("fail");
    expect(outcome("medicare-snf", "msnf-medicare", prof({ insurance: { medicare: false } }))).toBe("fail");
    expect(outcome("medicare-snf", "msnf-medicare", prof({ insurance: { medicare: "unknown" } }))).toBe("unknown");
  });

  it("Medicaid enrollment splits TSOA and MAC in opposite directions", () => {
    const onMedicaid = prof({ insurance: { medicaid: true } });
    const offMedicaid = prof({ insurance: { medicaid: false } });
    // The intake checkbox cannot distinguish CN/ABP (barred) from MN/MSP
    // ("may still qualify"), so reported enrollment is unknown, never fail.
    expect(outcome("wa-tsoa", "tsoa-not-on-medicaid", onMedicaid)).toBe("unknown");
    expect(outcome("wa-tsoa", "tsoa-not-on-medicaid", offMedicaid)).toBe("pass");
    expect(
      outcome("wa-tsoa", "tsoa-not-on-medicaid", prof({ insurance: { medicaid: "unknown" } })),
    ).toBe("unknown");
    expect(outcome("wa-mac", "mac-medicaid", onMedicaid)).toBe("pass");
    expect(outcome("wa-mac", "mac-medicaid", offMedicaid)).toBe("fail");
    expect(outcome("wa-mac", "mac-medicaid", prof({ insurance: { medicaid: "unknown" } }))).toBe("unknown");
  });

  it("CFC treats non-enrollment as unknown (could still apply), never fail", () => {
    expect(outcome("wa-medicaid-cfc", "cfc-medicaid", prof({ insurance: { medicaid: false } }))).toBe("unknown");
    expect(outcome("wa-medicaid-cfc", "cfc-medicaid", prof({ insurance: { medicaid: "unknown" } }))).toBe("unknown");
  });

  it("WA Cares vesting: contributing passes; exemption and non-contribution fail", () => {
    expect(outcome("wa-cares-fund", "wacares-vesting", prof({ waCaresParticipation: "contributing" }))).toBe("pass");
    expect(outcome("wa-cares-fund", "wacares-vesting", prof({ waCaresParticipation: "exempt" }))).toBe("fail");
    expect(outcome("wa-cares-fund", "wacares-vesting", prof({ waCaresParticipation: "not_contributing" }))).toBe("fail");
    expect(outcome("wa-cares-fund", "wacares-vesting", prof({ waCaresParticipation: "unknown" }))).toBe("unknown");
  });
});

describe("setting and location gates", () => {
  it("Medicare home health: nursing facility fails, ALF/AFH count as home", () => {
    expect(outcome("medicare-home-health", "mhh-at-home", prof({ livingSituation: "nursing_facility" }))).toBe("fail");
    expect(outcome("medicare-home-health", "mhh-at-home", prof({ livingSituation: "assisted_living" }))).toBe("pass");
    expect(outcome("medicare-home-health", "mhh-at-home", prof({ livingSituation: "adult_family_home" }))).toBe("pass");
    expect(outcome("medicare-home-health", "mhh-at-home", prof({ livingSituation: "other" }))).toBe("unknown");
    expect(outcome("medicare-home-health", "mhh-at-home", prof({ livingSituation: "unknown" }))).toBe("unknown");
  });

  it("MAC requires living at home, not a licensed facility", () => {
    expect(outcome("wa-mac", "mac-setting", prof({ livingSituation: "own_home" }))).toBe("pass");
    expect(outcome("wa-mac", "mac-setting", prof({ livingSituation: "family_home" }))).toBe("pass");
    for (const s of ["assisted_living", "adult_family_home", "nursing_facility"] as const) {
      expect(outcome("wa-mac", "mac-setting", prof({ livingSituation: s }))).toBe("fail");
    }
    expect(outcome("wa-mac", "mac-setting", prof({ livingSituation: "other" }))).toBe("unknown");
  });

  it("PACE service area: the four operator counties pass, others fail", () => {
    for (const county of ["King", "Snohomish", "Pierce", "Spokane"] as const) {
      expect(outcome("wa-pace", "pace-service-area", prof({ county }))).toBe("pass");
    }
    expect(outcome("wa-pace", "pace-service-area", prof({ county: "Yakima" }))).toBe("fail");
    expect(outcome("wa-pace", "pace-service-area", prof({ county: "unknown" }))).toBe("unknown");
  });
});

describe("not-collected data stays unknown", () => {
  it("Medicare SNF can never be more than possibly_relevant (3-day stay not collected)", () => {
    const c = evaluateProgram(byId("medicare-snf"), base);
    expect(c.status).toBe("possibly_relevant");
    expect(c.unknownFields).toContain("recentHospitalStay (not collected)");
  });

  it("MAC and respite always surface the missing caregiver question", () => {
    expect(evaluateProgram(byId("wa-mac"), base).unknownFields).toContain(
      "unpaidCaregiver (not collected)",
    );
    expect(evaluateProgram(byId("wa-respite-care"), base).unknownFields).toContain(
      "unpaidCaregiver (not collected)",
    );
  });
});

describe("conflicting inputs", () => {
  it("veteran=false dominates even if a wartime era is present", () => {
    const c = evaluateProgram(
      byId("va-aid-attendance"),
      prof({ veteran: { isVeteran: false, serviceEra: "vietnam", dischargeType: "honorable" } }),
    );
    expect(c.status).toBe("excluded");
    expect(c.failedRules).toEqual(["vaaa-veteran"]);
  });

  it("rules read their declared fields independently on inconsistent profiles", () => {
    // adlHelpCount says 3, but the ADL list is empty — count-based rules
    // trust the count; list-based rules trust the list.
    const inconsistent = prof({ adlsNeedingHelp: [], adlHelpCount: 3 });
    expect(outcome("wa-cares-fund", "wacares-adl-trigger", inconsistent)).toBe("pass");
    expect(outcome("va-housebound", "vahb-housebound", inconsistent)).toBe("unknown");
  });
});

describe("NFLOC proxy and nursing-facility residence", () => {
  it("COPES/AHLTC: 0 ADLs + nursing facility → unknown (daily-nursing criterion unresolved)", () => {
    const nfResident = prof({
      adlsNeedingHelp: [],
      adlHelpCount: 0,
      livingSituation: "nursing_facility",
    });
    expect(outcome("wa-medicaid-copes", "copes-nfloc", nfResident)).toBe("unknown");
    expect(outcome("wa-apple-health-ltc", "ahltc-nfloc", nfResident)).toBe("unknown");
  });

  it("0 ADLs outside a nursing facility still fails; ADL counts otherwise unchanged", () => {
    expect(
      outcome("wa-medicaid-copes", "copes-nfloc", prof({ adlHelpCount: 0, livingSituation: "own_home" })),
    ).toBe("fail");
    expect(
      outcome("wa-medicaid-copes", "copes-nfloc", prof({ adlHelpCount: 2, livingSituation: "nursing_facility" })),
    ).toBe("pass");
    expect(
      outcome("wa-apple-health-ltc", "ahltc-nfloc", prof({ adlHelpCount: "unknown", livingSituation: "nursing_facility" })),
    ).toBe("unknown");
  });

  it("community programs keep the plain proxy: TSOA/PACE/MAC 0-ADL NF residents still fail NFLOC", () => {
    const nfResident = prof({ adlHelpCount: 0, livingSituation: "nursing_facility" });
    expect(outcome("wa-tsoa", "tsoa-nfloc", nfResident)).toBe("fail");
    expect(outcome("wa-pace", "pace-nfloc", nfResident)).toBe("fail");
    expect(outcome("wa-mac", "mac-nfloc", nfResident)).toBe("fail");
  });
});

describe("classification-level regressions for the three rule changes", () => {
  it("enrolled-in-Medicaid family with above-limit assets: COPES/AHLTC possibly relevant, not excluded (simple-01 shape)", () => {
    const p = prof({
      age: 71,
      maritalStatus: "single",
      countableAssetsBracket: "2000_to_85000",
      monthlyIncomeBracket: "under_1000",
      insurance: { medicaid: true },
    });
    for (const id of ["wa-medicaid-copes", "wa-apple-health-ltc"]) {
      const c = evaluateProgram(byId(id), p);
      expect(c.status).toBe("possibly_relevant");
      expect(c.unknownFields).toContain("insurance.medicaid");
    }
  });

  it("non-enrolled high-asset single family stays excluded (high-asset regression)", () => {
    const p = prof({
      maritalStatus: "single",
      countableAssetsBracket: "85000_to_160000",
      insurance: { medicaid: false },
    });
    expect(evaluateProgram(byId("wa-medicaid-copes"), p).status).toBe("excluded");
    expect(evaluateProgram(byId("wa-apple-health-ltc"), p).status).toBe("excluded");
    expect(evaluateProgram(byId("wa-tsoa"), p).status).toBe("excluded");
  });

  it("on-Medicaid family is no longer hard-excluded from TSOA (enrollment type unknowable)", () => {
    const p = prof({
      insurance: { medicaid: true },
      countableAssetsBracket: "under_2000",
      monthlyIncomeBracket: "under_1000",
    });
    const c = evaluateProgram(byId("wa-tsoa"), p);
    expect(c.status).toBe("possibly_relevant");
    expect(c.failedRules).toEqual([]);
  });

  it("TSOA stays excluded when assets independently fail, regardless of enrollment (medicaid-edge-08 shape)", () => {
    const p = prof({
      maritalStatus: "widowed",
      countableAssetsBracket: "85000_to_160000",
      insurance: { medicaid: true },
    });
    const c = evaluateProgram(byId("wa-tsoa"), p);
    expect(c.status).toBe("excluded");
    expect(c.failedRules).toContain("tsoa-assets");
  });

  it("0-ADL nursing-facility resident: COPES/AHLTC possibly relevant, TSOA excluded (ambiguous-03 shape)", () => {
    const p = prof({
      age: 87,
      maritalStatus: "single",
      adlsNeedingHelp: [],
      adlHelpCount: 0,
      livingSituation: "nursing_facility",
      diagnosisCategory: "dementia",
      countableAssetsBracket: "under_2000",
      monthlyIncomeBracket: "under_1000",
      insurance: { medicare: true, medicaid: false },
    });
    expect(evaluateProgram(byId("wa-medicaid-copes"), p).status).toBe("possibly_relevant");
    expect(evaluateProgram(byId("wa-apple-health-ltc"), p).status).toBe("possibly_relevant");
    expect(evaluateProgram(byId("wa-tsoa"), p).status).toBe("excluded");
  });
});

describe("alwaysNeeded reporting metadata (classification-inert)", () => {
  it("exists only on the three proxy-pass programs with the documented facts", () => {
    const byNeed = Object.fromEntries(
      programs.map((p) => [p.programId, p.alwaysNeeded ?? []]),
    );
    expect(byNeed["medicare-home-health"]).toEqual([
      "homebound status and provider certification (not collected)",
      "skilled nursing/therapy care need (not collected)",
    ]);
    expect(byNeed["va-housebound"]).toEqual([
      "substantial confinement to home due to permanent disability (not collected)",
    ]);
    expect(byNeed["va-aid-attendance"]).toEqual([
      "clinical Aid & Attendance examination findings, VA Form 21-2680 (not collected)",
    ]);
    for (const p of programs) {
      if (!["medicare-home-health", "va-housebound", "va-aid-attendance"].includes(p.programId)) {
        expect(p.alwaysNeeded).toBeUndefined();
      }
    }
  });

  it("propagates to the candidate without touching status or unknownFields", () => {
    // A profile where all three programs' rules fully pass (mobility help
    // satisfies the vahb-housebound proxy).
    const passing = prof({
      insurance: { medicare: true, medicaid: false },
      countableAssetsBracket: "under_2000",
      adlsNeedingHelp: ["bathing", "dressing", "mobility"],
      adlHelpCount: 3,
    });
    for (const [id, expectedNeeds] of [
      ["medicare-home-health", 2],
      ["va-aid-attendance", 1],
      ["va-housebound", 1],
    ] as const) {
      const c = evaluateProgram(byId(id), passing);
      expect(c.status).toBe("likely_relevant"); // unchanged by alwaysNeeded
      expect(c.unknownFields).toEqual([]); // unchanged by alwaysNeeded
      expect(c.alwaysNeeded).toHaveLength(expectedNeeds);
    }
    // Programs without metadata carry an empty list.
    expect(evaluateProgram(byId("wa-respite-care"), passing).alwaysNeeded).toEqual([]);
  });

  it("does not perturb classification for an all-unknown profile", () => {
    const allUnknown = prof({
      age: "unknown",
      county: "unknown",
      livingSituation: "unknown",
      adlsNeedingHelp: "unknown",
      adlHelpCount: "unknown",
      diagnosisCategory: "unknown",
      veteran: { isVeteran: "unknown", serviceEra: "unknown", dischargeType: "unknown" },
      maritalStatus: "unknown",
      monthlyIncomeBracket: "unknown",
      countableAssetsBracket: "unknown",
      ownsHome: "unknown",
      insurance: { medicare: "unknown", medicaid: "unknown", ltcInsurance: "unknown", privateInsurance: "unknown" },
      recentRelocation: "unknown",
      waCaresParticipation: "unknown",
    });
    for (const p of programs) {
      expect(evaluateProgram(p, allUnknown).status).toBe("possibly_relevant");
    }
  });
});
