/**
 * Phase 7.5 stratified subset — fixed and deterministic so the snapshot,
 * the worksheets, and the later comparison all agree on membership.
 *
 * 26 families: 5 per bucket, plus a 6th ambiguous case so the marquee
 * adversarial variants (all-unknown, conflicting answers, out-of-state note,
 * prompt injection) are all represented.
 */
export const SUBSET_IDS: string[] = [
  // simple: spread across the bucket
  "simple-01",
  "simple-05",
  "simple-10",
  "simple-15",
  "simple-20",
  // veteran: covers wartime/peacetime eras and a disqualifying discharge
  "veteran-01",
  "veteran-04",
  "veteran-05",
  "veteran-11",
  "veteran-20",
  // medicaid edge: boundary ages/brackets, married cases, missing income
  "medicaid-edge-01",
  "medicaid-edge-05",
  "medicaid-edge-08",
  "medicaid-edge-13",
  "medicaid-edge-20",
  // high asset
  "high-asset-01",
  "high-asset-05",
  "high-asset-10",
  "high-asset-15",
  "high-asset-20",
  // ambiguous: the special adversarial cases plus two partial profiles
  "ambiguous-01", // everything declined
  "ambiguous-03", // conflicting answers
  "ambiguous-04", // out-of-state ZIP in free text
  "ambiguous-06", // prompt injection in free text
  "ambiguous-12",
  "ambiguous-20",
];

/**
 * Task B query picks: 12 (family, program) pairs spread across buckets.
 * The query string itself is captured verbatim in the sealed snapshot and
 * printed on the corresponding relevance worksheet.
 */
export const QUERY_PICKS: { caseId: string; programId: string }[] = [
  { caseId: "simple-01", programId: "wa-mac" },
  { caseId: "simple-10", programId: "medicare-home-health" },
  { caseId: "simple-20", programId: "wa-respite-care" },
  { caseId: "veteran-01", programId: "va-aid-attendance" },
  { caseId: "veteran-05", programId: "wa-tsoa" },
  { caseId: "veteran-20", programId: "medicare-snf" },
  { caseId: "medicaid-edge-01", programId: "wa-apple-health-ltc" },
  { caseId: "medicaid-edge-05", programId: "wa-medicaid-copes" },
  { caseId: "high-asset-01", programId: "wa-medicaid-cfc" },
  { caseId: "high-asset-15", programId: "va-housebound" },
  { caseId: "ambiguous-01", programId: "wa-cares-fund" },
  { caseId: "ambiguous-12", programId: "wa-pace" },
];
