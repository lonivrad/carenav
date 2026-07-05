import { z } from "zod";

/**
 * Raw questionnaire answers exactly as submitted by the intake flow.
 *
 * Every question offers "I don't know" and "Prefer not to say"; both are
 * carried through as explicit decline values and normalize to "unknown" in
 * the profile — never to a guessed default.
 */

export const declineValues = ["unknown", "prefer_not_to_say"] as const;
export const declinedSchema = z.enum(declineValues);
export type Declined = z.infer<typeof declinedSchema>;

export const waCountyValues = [
  "Adams", "Asotin", "Benton", "Chelan", "Clallam", "Clark", "Columbia",
  "Cowlitz", "Douglas", "Ferry", "Franklin", "Garfield", "Grant",
  "Grays Harbor", "Island", "Jefferson", "King", "Kitsap", "Kittitas",
  "Klickitat", "Lewis", "Lincoln", "Mason", "Okanogan", "Pacific",
  "Pend Oreille", "Pierce", "San Juan", "Skagit", "Skamania", "Snohomish",
  "Spokane", "Stevens", "Thurston", "Wahkiakum", "Walla Walla", "Whatcom",
  "Whitman", "Yakima",
] as const;

export const adlValues = [
  "bathing",
  "dressing",
  "transferring",
  "toileting",
  "eating",
  "mobility",
] as const;

export const livingSituationValues = [
  "own_home",
  "family_home",
  "assisted_living",
  "adult_family_home",
  "nursing_facility",
  "other",
] as const;

export const diagnosisCategoryValues = [
  "dementia",
  "parkinsons",
  "stroke",
  "heart_disease",
  "cancer",
  "mental_health",
  "developmental_disability",
  "other",
  "none",
] as const;

export const serviceEraValues = [
  "wwii",
  "korea",
  "vietnam",
  "gulf_war_or_later",
  "peacetime",
] as const;

export const dischargeTypeValues = [
  "honorable",
  "general",
  "other_than_honorable",
  "bad_conduct_or_dishonorable",
] as const;

export const maritalStatusValues = [
  "single",
  "married",
  "widowed",
  "divorced",
] as const;

/** Bracket edges chosen near program thresholds (MNIL ~$994, SIL ~$2,982, TSOA ~$3,976). */
export const incomeBracketValues = [
  "under_1000",
  "1000_to_2999",
  "3000_to_3999",
  "4000_or_more",
] as const;

/** Bracket edges near Medicaid ($2,000), TSOA single (~$84k) and married (~$157k) limits. */
export const assetsBracketValues = [
  "under_2000",
  "2000_to_85000",
  "85000_to_160000",
  "160000_or_more",
] as const;

export const homeOwnershipValues = ["owns", "rents", "other"] as const;

export const insuranceValues = [
  "medicare",
  "medicaid",
  "ltc_insurance",
  "private",
] as const;

export const waCaresParticipationValues = [
  "contributing",
  "exempt",
  "not_contributing",
] as const;

const yesNo = z.enum(["yes", "no"]);

export const intakeSchema = z.object({
  careRecipientAge: z.union([
    z.number().int().min(18).max(120),
    declinedSchema,
  ]),
  county: z.union([z.enum(waCountyValues), declinedSchema]),
  livingSituation: z.union([z.enum(livingSituationValues), declinedSchema]),
  /** Empty array is a real answer: no help needed with any listed ADL. */
  adlsNeedingHelp: z.union([z.array(z.enum(adlValues)), declinedSchema]),
  diagnosisCategory: z
    .union([z.enum(diagnosisCategoryValues), declinedSchema])
    .optional(),
  isVeteran: z.union([yesNo, declinedSchema]),
  /** Asked only when isVeteran is "yes". */
  serviceEra: z.union([z.enum(serviceEraValues), declinedSchema]).optional(),
  /** Asked only when isVeteran is "yes". */
  dischargeType: z
    .union([z.enum(dischargeTypeValues), declinedSchema])
    .optional(),
  maritalStatus: z.union([z.enum(maritalStatusValues), declinedSchema]),
  monthlyIncomeBracket: z.union([z.enum(incomeBracketValues), declinedSchema]),
  countableAssetsBracket: z.union([
    z.enum(assetsBracketValues),
    declinedSchema,
  ]),
  homeOwnership: z.union([z.enum(homeOwnershipValues), declinedSchema]),
  /** Empty array is a real answer: none of the listed coverage. */
  currentInsurance: z.union([z.array(z.enum(insuranceValues)), declinedSchema]),
  /** Moved to Washington within the past 5 years. */
  recentRelocation: z.union([yesNo, declinedSchema]),
  waCaresParticipation: z.union([
    z.enum(waCaresParticipationValues),
    declinedSchema,
  ]),
});

export type Intake = z.infer<typeof intakeSchema>;
export type WaCounty = (typeof waCountyValues)[number];
export type Adl = (typeof adlValues)[number];
