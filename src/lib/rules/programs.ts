import type { Profile } from "@/lib/schema/profile";

/**
 * Layer 1: deterministic rule predicates over the normalized profile.
 * No LLM here, ever. A rule over an unknown field returns "unknown" — never
 * a guess. Every rule cites the corpus document that justifies it.
 *
 * Bracket boundaries: intake brackets were chosen to sit near program
 * thresholds. When a bracket genuinely straddles a threshold (part of the
 * bracket passes, part fails), the rule returns "unknown" rather than
 * picking a side. When a bracket edge approximates a threshold within a
 * small sliver (e.g. $85,000 edge vs. $84,354 TSOA limit), the rule treats
 * the edge as aligned and the comment notes the approximation.
 */

export type RuleOutcome = "pass" | "fail" | "unknown";

export interface Rule {
  id: string;
  description: string;
  /** Profile fields consulted; surfaced as missing data when outcome is "unknown". */
  fields: readonly string[];
  evaluate: (profile: Profile) => RuleOutcome;
}

export interface ProgramRules {
  programId: string;
  programName: string;
  /** Corpus document (src/data/corpus/) that justifies this program's rules. */
  corpusDocumentId: string;
  rules: readonly Rule[];
  /**
   * Reporting-only metadata: facts a professional must verify whenever this
   * program is surfaced, even when every screening rule passes (the rules
   * pass on proxies; these are the underlying requirements the intake does
   * not collect). Never consulted for classification, confidence, or
   * ranking — they only feed "information still needed" in the report.
   */
  alwaysNeeded?: readonly string[];
}

const UNK = "unknown";

/* ------------------------------------------------------------------ */
/* Shared predicates                                                    */
/* ------------------------------------------------------------------ */

// Nursing facility level of care (NFLOC) proxy. NFLOC is determined by the
// state CARE assessment (wa-medicaid-copes.md, wa-apple-health-ltc.md), which
// we cannot run; substantial ADL need is a screening proxy: 2+ ADLs → worth
// assessing; 0 ADLs → no indication of nursing-level need; 1 → uncertain.
function nflocProxy(p: Profile): RuleOutcome {
  if (p.adlHelpCount === UNK) return "unknown";
  if (p.adlHelpCount >= 2) return "pass";
  if (p.adlHelpCount === 0) return "fail";
  return "unknown";
}

// NFLOC proxy for COPES and Apple Health LTC only: nursing-facility residence
// leaves WAC 388-106-0355(a) ("care provided by or under the supervision of a
// registered nurse or a licensed practical nurse on a daily basis")
// unresolved even when no ADL help is reported — the CARE assessment decides,
// not the self-report. Other nflocProxy users (TSOA, MAC, PACE) are community
// programs and keep the plain proxy: institutional residence must not soften
// their screening.
function nflocProxyOrInstitutional(p: Profile): RuleOutcome {
  if (
    p.adlHelpCount !== UNK &&
    p.adlHelpCount === 0 &&
    p.livingSituation === "nursing_facility"
  ) {
    return "unknown";
  }
  return nflocProxy(p);
}

// Age 55+ requirement shared by TSOA, MAC (wa-tsoa.md, wa-mac.md).
function age55(p: Profile): RuleOutcome {
  if (p.age === UNK) return "unknown";
  return p.age >= 55 ? "pass" : "fail";
}

// SSI-related age/disability gate for institutional Medicaid programs:
// 65+, or 18–64 and blind/disabled under SSI criteria
// (wa-medicaid-copes.md, wa-apple-health-ltc.md). We do not collect a
// disability determination, so 18–64 is unknown, never a guess.
function ssiRelatedAge(p: Profile): RuleOutcome {
  if (p.age === UNK) return "unknown";
  return p.age >= 65 ? "pass" : "unknown";
}

// Income vs. the Special Income Level, $2,982/month (300% of the SSI FBR,
// 1/1/2026) (wa-medicaid-copes.md, wa-apple-health-ltc.md). The
// $1,000–$2,999 bracket straddles the SIL → unknown. Income above the SIL
// can still qualify through the Medically Needy pathway after deductions,
// so higher brackets are unknown, not fail.
function silIncome(p: Profile): RuleOutcome {
  if (p.monthlyIncomeBracket === UNK) return "unknown";
  if (p.monthlyIncomeBracket === "under_1000") return "pass";
  return "unknown";
}

// Assets vs. the Medicaid resource limit, $2,000 single (wa-medicaid-copes.md,
// wa-apple-health-ltc.md). Married couples get spousal impoverishment
// protections ($72,529 state / $162,660 federal community-spouse allowance),
// so any married bracket above $2,000 is unknown rather than fail; the
// $160,000+ bracket also straddles the $162,660 federal maximum.
function medicaidAssets(p: Profile): RuleOutcome {
  if (p.countableAssetsBracket === UNK) return "unknown";
  if (p.countableAssetsBracket === "under_2000") return "pass";
  // Reported Medicaid enrollment conflicts with above-limit assets: CN
  // enrollment implies ≤$2k countable, MAGI coverage has no asset test, and
  // wa-medicaid-copes.md pathway 1 makes CN enrollees financially eligible
  // outright. Conflicting signals are unknown, never a guessed fail.
  if (p.insurance.medicaid === true) return "unknown";
  if (p.maritalStatus === UNK) return "unknown";
  if (p.maritalStatus === "married") return "unknown";
  return "fail";
}

// VA pension gates shared by Aid & Attendance and Housebound
// (va-aid-attendance.md, va-housebound.md).
function isVeteran(p: Profile): RuleOutcome {
  if (p.veteran.isVeteran === UNK) return "unknown";
  // Surviving-spouse benefits exist but are outside the corpus scope
  // (va-aid-attendance.md flags survivor rates as not covered).
  return p.veteran.isVeteran ? "pass" : "fail";
}

// Wartime service requirement: at least 1 day during a recognized wartime
// period (va-aid-attendance.md). Peacetime-only service does not qualify.
function vaWartime(p: Profile): RuleOutcome {
  const era = p.veteran.serviceEra;
  if (era === UNK) return "unknown";
  if (era === "not_applicable") return "fail";
  return era === "peacetime" ? "fail" : "pass";
}

// Discharge "not dishonorable" (va-aid-attendance.md). Other-than-honorable
// discharges are adjudicated case-by-case → unknown.
function vaDischarge(p: Profile): RuleOutcome {
  const d = p.veteran.dischargeType;
  if (d === UNK) return "unknown";
  if (d === "not_applicable") return "fail";
  if (d === "bad_conduct_or_dishonorable") return "fail";
  if (d === "other_than_honorable") return "unknown";
  return "pass";
}

// VA pension net worth limit $163,699 (effective 12/1/2025)
// (va-aid-attendance.md). Net worth combines assets and annual income; we
// screen on the asset bracket only. The $160,000+ bracket straddles the
// limit → unknown.
function vaNetWorth(p: Profile): RuleOutcome {
  if (p.countableAssetsBracket === UNK) return "unknown";
  return p.countableAssetsBracket === "160000_or_more" ? "unknown" : "pass";
}

// Medicare enrollment gate (medicare-home-health.md, medicare-snf.md).
function hasMedicare(p: Profile): RuleOutcome {
  if (p.insurance.medicare === UNK) return "unknown";
  return p.insurance.medicare ? "pass" : "fail";
}

/* ------------------------------------------------------------------ */
/* Registry                                                            */
/* ------------------------------------------------------------------ */

export const programs: readonly ProgramRules[] = [
  {
    programId: "wa-medicaid-copes",
    programName: "Medicaid COPES waiver",
    corpusDocumentId: "wa-medicaid-copes",
    rules: [
      {
        // wa-medicaid-copes.md: "18+ and blind or disabled under SSI
        // criteria, or age 65+". Disability status is not collected.
        id: "copes-age",
        description: "Age 65+, or 18–64 with an SSI-criteria disability",
        fields: ["age"],
        evaluate: ssiRelatedAge,
      },
      {
        // wa-medicaid-copes.md: CARE assessment must find nursing facility
        // level of care. Nursing-facility residence leaves the daily-nursing
        // criterion open even with no reported ADL help.
        id: "copes-nfloc",
        description: "Needs nursing-facility level of care (ADL proxy)",
        fields: ["adlHelpCount", "livingSituation"],
        evaluate: nflocProxyOrInstitutional,
      },
      {
        // wa-medicaid-copes.md: income at/below the SIL ($2,982, 1/1/2026),
        // or Medically Needy pathway above it.
        id: "copes-income",
        description: "Income within the Special Income Level ($2,982/month)",
        fields: ["monthlyIncomeBracket"],
        evaluate: silIncome,
      },
      {
        // wa-medicaid-copes.md: $2,000/$3,000 resource standard with
        // spousal impoverishment protections.
        id: "copes-assets",
        description: "Countable assets within the Medicaid resource limit ($2,000 single)",
        fields: ["countableAssetsBracket", "maritalStatus", "insurance.medicaid"],
        evaluate: medicaidAssets,
      },
    ],
  },
  {
    programId: "wa-medicaid-cfc",
    programName: "Medicaid Community First Choice",
    corpusDocumentId: "wa-medicaid-cfc",
    rules: [
      {
        // wa-medicaid-cfc.md: CN/ABP community Medicaid required. Someone
        // not yet enrolled may still be able to apply → unknown, not fail.
        id: "cfc-medicaid",
        description: "Enrolled in (or able to enroll in) community Medicaid (CN/ABP)",
        fields: ["insurance.medicaid"],
        evaluate: (p) => {
          if (p.insurance.medicaid === UNK) return "unknown";
          return p.insurance.medicaid ? "pass" : "unknown";
        },
      },
      {
        // wa-medicaid-cfc.md: NFLOC required; continuing CFC requires unmet
        // need in at least three ADLs.
        id: "cfc-adl-need",
        description: "Substantial ADL need (3+ ADLs for ongoing CFC)",
        fields: ["adlHelpCount"],
        evaluate: (p) => {
          if (p.adlHelpCount === UNK) return "unknown";
          if (p.adlHelpCount >= 3) return "pass";
          if (p.adlHelpCount === 0) return "fail";
          return "unknown";
        },
      },
    ],
  },
  {
    programId: "wa-apple-health-ltc",
    programName: "Apple Health long-term care",
    corpusDocumentId: "wa-apple-health-ltc",
    rules: [
      {
        // wa-apple-health-ltc.md: SSI-related criteria (65+, or blind/
        // disabled) or MAGI-based institutional coverage.
        id: "ahltc-age",
        description: "Age 65+, or 18–64 with an SSI-criteria disability",
        fields: ["age"],
        evaluate: ssiRelatedAge,
      },
      {
        // wa-apple-health-ltc.md: functional eligibility via CARE assessment.
        // Nursing-facility residence leaves the daily-nursing criterion open
        // even with no reported ADL help.
        id: "ahltc-nfloc",
        description: "Needs nursing-facility level of care (ADL proxy)",
        fields: ["adlHelpCount", "livingSituation"],
        evaluate: nflocProxyOrInstitutional,
      },
      {
        // wa-apple-health-ltc.md: income at/below SIL; MN pathway above.
        id: "ahltc-income",
        description: "Income within the Special Income Level ($2,982/month)",
        fields: ["monthlyIncomeBracket"],
        evaluate: silIncome,
      },
      {
        // wa-apple-health-ltc.md: $2,000/$3,000 resource standard, spousal
        // protections, $1,130,000 home equity limit (home equity not
        // collected as a dollar figure).
        id: "ahltc-assets",
        description: "Countable assets within the Medicaid resource limit ($2,000 single)",
        fields: ["countableAssetsBracket", "maritalStatus", "insurance.medicaid"],
        evaluate: medicaidAssets,
      },
    ],
  },
  {
    programId: "wa-cares-fund",
    programName: "WA Cares Fund",
    corpusDocumentId: "wa-cares-fund",
    rules: [
      {
        // wa-cares-fund.md: must have contributed (10-year, 3-of-6, or
        // born-before-1968 partial pathway); an approved exemption bars
        // qualifying.
        id: "wacares-vesting",
        description: "Contributed to WA Cares through work (no exemption)",
        fields: ["waCaresParticipation"],
        evaluate: (p) => {
          if (p.waCaresParticipation === UNK) return "unknown";
          return p.waCaresParticipation === "contributing" ? "pass" : "fail";
        },
      },
      {
        // wa-cares-fund.md: care trigger is help with 3+ ADLs for 90+ days.
        // WA Cares also counts bed mobility and medication management, which
        // the intake does not ask — so fewer than 3 of our six ADLs is
        // unknown, not fail.
        id: "wacares-adl-trigger",
        description: "Needs help with 3+ activities of daily living",
        fields: ["adlHelpCount"],
        evaluate: (p) => {
          if (p.adlHelpCount === UNK) return "unknown";
          return p.adlHelpCount >= 3 ? "pass" : "unknown";
        },
      },
    ],
  },
  {
    programId: "va-aid-attendance",
    programName: "VA Aid & Attendance",
    corpusDocumentId: "va-aid-attendance",
    // vaaa-care-need passes on an ADL proxy; the actual clinical criteria
    // are certified by a medical examiner (va-aid-attendance.md).
    alwaysNeeded: [
      "clinical Aid & Attendance examination findings, VA Form 21-2680 (not collected)",
    ],
    rules: [
      {
        id: "vaaa-veteran",
        description: "Veteran of the U.S. military",
        fields: ["veteran.isVeteran"],
        evaluate: isVeteran,
      },
      {
        id: "vaaa-wartime",
        description: "Served at least 1 day during a recognized wartime period",
        fields: ["veteran.serviceEra"],
        evaluate: vaWartime,
      },
      {
        id: "vaaa-discharge",
        description: "Discharge was not dishonorable",
        fields: ["veteran.dischargeType"],
        evaluate: vaDischarge,
      },
      {
        // va-aid-attendance.md: clinical criteria include needing another
        // person's help with daily activities; bed confinement, nursing-home
        // residence, and severe visual impairment are alternate routes we do
        // not collect → 0 ADLs is unknown, not fail.
        id: "vaaa-care-need",
        description: "Needs another person's help with daily activities",
        fields: ["adlHelpCount"],
        evaluate: (p) => {
          if (p.adlHelpCount === UNK) return "unknown";
          return p.adlHelpCount >= 1 ? "pass" : "unknown";
        },
      },
      {
        id: "vaaa-net-worth",
        description: "Net worth within the VA pension limit ($163,699)",
        fields: ["countableAssetsBracket"],
        evaluate: vaNetWorth,
      },
    ],
  },
  {
    programId: "va-housebound",
    programName: "VA Housebound benefit",
    corpusDocumentId: "va-housebound",
    // vahb-housebound passes on a mobility-help proxy; actual substantial
    // confinement to home is never collected (va-housebound.md).
    alwaysNeeded: [
      "substantial confinement to home due to permanent disability (not collected)",
    ],
    rules: [
      {
        id: "vahb-veteran",
        description: "Veteran of the U.S. military",
        fields: ["veteran.isVeteran"],
        evaluate: isVeteran,
      },
      {
        id: "vahb-wartime",
        description: "Served at least 1 day during a recognized wartime period",
        fields: ["veteran.serviceEra"],
        evaluate: vaWartime,
      },
      {
        id: "vahb-discharge",
        description: "Discharge was not dishonorable",
        fields: ["veteran.dischargeType"],
        evaluate: vaDischarge,
      },
      {
        // va-housebound.md: "spends most of their time in their home because
        // of a permanent disability" — not asked directly; needing help with
        // mobility is a weak positive proxy, anything else is unknown.
        id: "vahb-housebound",
        description: "Substantially confined to home by permanent disability",
        fields: ["adlsNeedingHelp"],
        evaluate: (p) => {
          if (p.adlsNeedingHelp === UNK) return "unknown";
          return p.adlsNeedingHelp.includes("mobility") ? "pass" : "unknown";
        },
      },
      {
        id: "vahb-net-worth",
        description: "Net worth within the VA pension limit ($163,699)",
        fields: ["countableAssetsBracket"],
        evaluate: vaNetWorth,
      },
    ],
  },
  {
    programId: "medicare-home-health",
    programName: "Medicare home health benefit",
    corpusDocumentId: "medicare-home-health",
    // mhh-skilled-need passes on an ADL proxy; the benefit actually gates on
    // homebound certification and intermittent SKILLED care
    // (medicare-home-health.md) — neither collected by the intake.
    alwaysNeeded: [
      "homebound status and provider certification (not collected)",
      "skilled nursing/therapy care need (not collected)",
    ],
    rules: [
      {
        // medicare-home-health.md: covered by Part A and/or Part B.
        id: "mhh-medicare",
        description: "Enrolled in Medicare",
        fields: ["insurance.medicare"],
        evaluate: hasMedicare,
      },
      {
        // medicare-home-health.md: needs part-time/intermittent skilled
        // care. Skilled needs are clinical, not ADL-based — any ADL need is
        // a positive signal; none is unknown, not fail.
        id: "mhh-skilled-need",
        description: "Indication of a skilled or personal care need",
        fields: ["adlHelpCount"],
        evaluate: (p) => {
          if (p.adlHelpCount === UNK) return "unknown";
          return p.adlHelpCount >= 1 ? "pass" : "unknown";
        },
      },
      {
        // medicare-home-health.md: care is delivered at home (assisted
        // living and adult family homes count as home; a nursing facility
        // does not).
        id: "mhh-at-home",
        description: "Lives at home (not in a nursing facility)",
        fields: ["livingSituation"],
        evaluate: (p) => {
          if (p.livingSituation === UNK) return "unknown";
          if (p.livingSituation === "nursing_facility") return "fail";
          if (p.livingSituation === "other") return "unknown";
          return "pass";
        },
      },
    ],
  },
  {
    programId: "medicare-snf",
    programName: "Medicare skilled nursing facility coverage",
    corpusDocumentId: "medicare-snf",
    rules: [
      {
        id: "msnf-medicare",
        description: "Enrolled in Medicare Part A",
        fields: ["insurance.medicare"],
        evaluate: hasMedicare,
      },
      {
        // medicare-snf.md: requires a qualifying 3-day inpatient hospital
        // stay and daily skilled care — neither is collected by the intake,
        // so this rule is always unknown and SNF can never be more than
        // possibly relevant.
        id: "msnf-qualifying-stay",
        description: "Recent 3-day inpatient hospital stay with daily skilled-care need",
        fields: ["recentHospitalStay (not collected)"],
        evaluate: () => "unknown",
      },
    ],
  },
  {
    programId: "wa-pace",
    programName: "PACE (Program of All-Inclusive Care for the Elderly)",
    corpusDocumentId: "wa-pace",
    rules: [
      {
        // wa-pace.md: 55+ and disabled, or 65+ (WAC 182-513-1230).
        // Disability determination is not collected, so 55–64 is unknown.
        id: "pace-age",
        description: "Age 65+, or 55–64 with a disability determination",
        fields: ["age"],
        evaluate: (p) => {
          if (p.age === UNK) return "unknown";
          if (p.age >= 65) return "pass";
          if (p.age >= 55) return "unknown";
          return "fail";
        },
      },
      {
        // wa-pace.md: must live in a PACE service area. Centers operate in
        // King, Snohomish, Pierce, and Spokane counties (county list is
        // inferred from center locations; DSHS defines service areas by ZIP
        // — flagged VERIFY in the corpus doc).
        id: "pace-service-area",
        description: "Lives in a county with a PACE organization",
        fields: ["county"],
        evaluate: (p) => {
          if (p.county === UNK) return "unknown";
          return ["King", "Snohomish", "Pierce", "Spokane"].includes(p.county)
            ? "pass"
            : "fail";
        },
      },
      {
        // wa-pace.md: needs nursing-home level of care, certified by the state.
        id: "pace-nfloc",
        description: "Needs nursing-facility level of care (ADL proxy)",
        fields: ["adlHelpCount"],
        evaluate: nflocProxy,
      },
    ],
  },
  {
    programId: "wa-tsoa",
    programName: "Tailored Supports for Older Adults",
    corpusDocumentId: "wa-tsoa",
    rules: [
      {
        // wa-tsoa.md: care receiver age 55+.
        id: "tsoa-age",
        description: "Care receiver is age 55 or older",
        fields: ["age"],
        evaluate: age55,
      },
      {
        // wa-tsoa.md: gross income ≤ 400% of the SSI FBR = $3,976/month
        // (1/1/2026). The $3,000–$3,999 bracket straddles the limit.
        id: "tsoa-income",
        description: "Income within the TSOA limit ($3,976/month)",
        fields: ["monthlyIncomeBracket"],
        evaluate: (p) => {
          if (p.monthlyIncomeBracket === UNK) return "unknown";
          if (p.monthlyIncomeBracket === "4000_or_more") return "fail";
          if (p.monthlyIncomeBracket === "3000_to_3999") return "unknown";
          return "pass";
        },
      },
      {
        // wa-tsoa.md: resources ≤ $84,354 single (the $85,000 bracket edge
        // approximates this limit) / $156,883 married (the $160,000 edge
        // approximates this limit).
        id: "tsoa-assets",
        description: "Resources within the TSOA limit ($84,354 single / $156,883 married)",
        fields: ["countableAssetsBracket", "maritalStatus"],
        evaluate: (p) => {
          if (p.countableAssetsBracket === UNK) return "unknown";
          if (
            p.countableAssetsBracket === "under_2000" ||
            p.countableAssetsBracket === "2000_to_85000"
          ) {
            return "pass";
          }
          if (p.countableAssetsBracket === "160000_or_more") return "fail";
          // $85,000–$160,000: within the married limit, above the single one.
          if (p.maritalStatus === UNK) return "unknown";
          return p.maritalStatus === "married" ? "pass" : "fail";
        },
      },
      {
        // wa-tsoa.md: nursing facility level of care required.
        id: "tsoa-nfloc",
        description: "Needs nursing-facility level of care (ADL proxy)",
        fields: ["adlHelpCount"],
        evaluate: nflocProxy,
      },
      {
        // wa-tsoa.md: CN/ABP enrollment bars TSOA ("A person who receives
        // apple health coverage under a categorically needy (CN) or
        // alternative benefit plan (ABP) program is not eligible"), but
        // Medically Needy / Medicare Savings Program coverage "may still
        // qualify" — and the intake checkbox cannot distinguish the coverage
        // type, so enrollment is unknown, never a guessed fail.
        id: "tsoa-not-on-medicaid",
        description: "Not on CN/ABP Medicaid (MN/MSP coverage may still qualify)",
        fields: ["insurance.medicaid"],
        evaluate: (p) => {
          if (p.insurance.medicaid === UNK) return "unknown";
          return p.insurance.medicaid ? "unknown" : "pass";
        },
      },
    ],
  },
  {
    programId: "wa-mac",
    programName: "Medicaid Alternative Care",
    corpusDocumentId: "wa-mac",
    rules: [
      {
        // wa-mac.md: care receiver age 55+.
        id: "mac-age",
        description: "Care receiver is age 55 or older",
        fields: ["age"],
        evaluate: age55,
      },
      {
        // wa-mac.md: currently enrolled in CN or ABP Apple Health — this is
        // the program's financial eligibility; not enrolled → not MAC
        // (TSOA is the non-Medicaid counterpart).
        id: "mac-medicaid",
        description: "Currently enrolled in Medicaid (Apple Health CN/ABP)",
        fields: ["insurance.medicaid"],
        evaluate: (p) => {
          if (p.insurance.medicaid === UNK) return "unknown";
          return p.insurance.medicaid ? "pass" : "fail";
        },
      },
      {
        // wa-mac.md: lives in their own home or another's home — not a
        // licensed residential facility.
        id: "mac-setting",
        description: "Lives at home (not in a licensed residential facility)",
        fields: ["livingSituation"],
        evaluate: (p) => {
          if (p.livingSituation === UNK) return "unknown";
          if (
            p.livingSituation === "own_home" ||
            p.livingSituation === "family_home"
          ) {
            return "pass";
          }
          if (p.livingSituation === "other") return "unknown";
          return "fail";
        },
      },
      {
        // wa-mac.md: meets NFLOC but has chosen not to use other LTSS.
        id: "mac-nfloc",
        description: "Needs nursing-facility level of care (ADL proxy)",
        fields: ["adlHelpCount"],
        evaluate: nflocProxy,
      },
      {
        // wa-mac.md: MAC supports an unpaid family caregiver (18+) — the
        // intake does not ask whether one exists.
        id: "mac-caregiver",
        description: "Has an unpaid family caregiver (age 18+)",
        fields: ["unpaidCaregiver (not collected)"],
        evaluate: () => "unknown",
      },
    ],
  },
  {
    programId: "wa-respite-care",
    programName: "Respite care programs",
    corpusDocumentId: "wa-respite-care",
    rules: [
      {
        // wa-respite-care.md: FCSP serves caregivers of adults 18+ who need
        // care; Lifespan vouchers require 40+ hrs/week of caregiving. Any
        // ADL need indicates a caregiving load; none is unknown (supervision
        // needs aren't fully captured by ADLs).
        id: "respite-care-need",
        description: "Care receiver needs ongoing care or supervision",
        fields: ["adlHelpCount"],
        evaluate: (p) => {
          if (p.adlHelpCount === UNK) return "unknown";
          return p.adlHelpCount >= 1 ? "pass" : "unknown";
        },
      },
      {
        // wa-respite-care.md: all three channels support an unpaid
        // caregiver — the intake does not ask whether one exists.
        id: "respite-caregiver",
        description: "Has an unpaid caregiver providing regular care",
        fields: ["unpaidCaregiver (not collected)"],
        evaluate: () => "unknown",
      },
    ],
  },
];
