import { describe, expect, it } from "vitest";

import type { Intake } from "@/lib/schema/intake";
import { normalize } from "@/lib/schema/normalize";

const fullyAnswered: Intake = {
  careRecipientAge: 82,
  county: "King",
  livingSituation: "own_home",
  adlsNeedingHelp: ["bathing", "dressing", "transferring"],
  diagnosisCategory: "dementia",
  isVeteran: "yes",
  serviceEra: "vietnam",
  dischargeType: "honorable",
  maritalStatus: "married",
  monthlyIncomeBracket: "1000_to_2999",
  countableAssetsBracket: "under_2000",
  homeOwnership: "owns",
  currentInsurance: ["medicare", "medicaid"],
  recentRelocation: "no",
  waCaresParticipation: "not_contributing",
};

const allUnknown: Intake = {
  careRecipientAge: "unknown",
  county: "unknown",
  livingSituation: "unknown",
  adlsNeedingHelp: "unknown",
  diagnosisCategory: "unknown",
  isVeteran: "unknown",
  serviceEra: "unknown",
  dischargeType: "unknown",
  maritalStatus: "unknown",
  monthlyIncomeBracket: "unknown",
  countableAssetsBracket: "unknown",
  homeOwnership: "unknown",
  currentInsurance: "unknown",
  recentRelocation: "unknown",
  waCaresParticipation: "unknown",
};

describe("normalize", () => {
  it("normalizes a fully answered intake", () => {
    const p = normalize(fullyAnswered);
    expect(p).toEqual({
      state: "WA",
      age: 82,
      county: "King",
      livingSituation: "own_home",
      adlsNeedingHelp: ["bathing", "dressing", "transferring"],
      adlHelpCount: 3,
      diagnosisCategory: "dementia",
      veteran: {
        isVeteran: true,
        serviceEra: "vietnam",
        dischargeType: "honorable",
      },
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
      waCaresParticipation: "not_contributing",
    });
  });

  it("keeps every unknown answer as an explicit unknown — never a default", () => {
    const p = normalize(allUnknown);
    expect(p.age).toBe("unknown");
    expect(p.county).toBe("unknown");
    expect(p.livingSituation).toBe("unknown");
    expect(p.adlsNeedingHelp).toBe("unknown");
    expect(p.adlHelpCount).toBe("unknown");
    expect(p.diagnosisCategory).toBe("unknown");
    expect(p.veteran.isVeteran).toBe("unknown");
    expect(p.veteran.serviceEra).toBe("unknown");
    expect(p.veteran.dischargeType).toBe("unknown");
    expect(p.maritalStatus).toBe("unknown");
    expect(p.monthlyIncomeBracket).toBe("unknown");
    expect(p.countableAssetsBracket).toBe("unknown");
    expect(p.ownsHome).toBe("unknown");
    expect(p.insurance).toEqual({
      medicare: "unknown",
      medicaid: "unknown",
      ltcInsurance: "unknown",
      privateInsurance: "unknown",
    });
    expect(p.recentRelocation).toBe("unknown");
    expect(p.waCaresParticipation).toBe("unknown");
  });

  it('normalizes "prefer_not_to_say" to "unknown" everywhere', () => {
    const declinedAll = Object.fromEntries(
      Object.entries(allUnknown).map(([k]) => [k, "prefer_not_to_say"]),
    ) as unknown as Intake;
    expect(normalize(declinedAll)).toEqual(normalize(allUnknown));
  });

  it("treats an empty ADL list as a known answer, not an unknown", () => {
    const p = normalize({ ...fullyAnswered, adlsNeedingHelp: [] });
    expect(p.adlsNeedingHelp).toEqual([]);
    expect(p.adlHelpCount).toBe(0);
  });

  it("treats an empty insurance list as known 'no coverage', not unknown", () => {
    const p = normalize({ ...fullyAnswered, currentInsurance: [] });
    expect(p.insurance).toEqual({
      medicare: false,
      medicaid: false,
      ltcInsurance: false,
      privateInsurance: false,
    });
  });

  it("marks service era and discharge not_applicable for confirmed non-veterans", () => {
    const p = normalize({
      ...fullyAnswered,
      isVeteran: "no",
      serviceEra: undefined,
      dischargeType: undefined,
    });
    expect(p.veteran).toEqual({
      isVeteran: false,
      serviceEra: "not_applicable",
      dischargeType: "not_applicable",
    });
  });

  it("keeps era/discharge unknown (not not_applicable) when veteran status is unknown", () => {
    const p = normalize({
      ...fullyAnswered,
      isVeteran: "unknown",
      serviceEra: undefined,
      dischargeType: undefined,
    });
    expect(p.veteran).toEqual({
      isVeteran: "unknown",
      serviceEra: "unknown",
      dischargeType: "unknown",
    });
  });

  it("keeps era/discharge unknown for a veteran who declined those questions", () => {
    const p = normalize({
      ...fullyAnswered,
      serviceEra: "prefer_not_to_say",
      dischargeType: "unknown",
    });
    expect(p.veteran.isVeteran).toBe(true);
    expect(p.veteran.serviceEra).toBe("unknown");
    expect(p.veteran.dischargeType).toBe("unknown");
  });

  it("normalizes a missing optional diagnosis to unknown", () => {
    const p = normalize({ ...fullyAnswered, diagnosisCategory: undefined });
    expect(p.diagnosisCategory).toBe("unknown");
  });

  it("maps home ownership to a boolean and keeps declines unknown", () => {
    expect(normalize({ ...fullyAnswered, homeOwnership: "rents" }).ownsHome).toBe(false);
    expect(normalize({ ...fullyAnswered, homeOwnership: "other" }).ownsHome).toBe(false);
    expect(
      normalize({ ...fullyAnswered, homeOwnership: "prefer_not_to_say" }).ownsHome,
    ).toBe("unknown");
  });
});
