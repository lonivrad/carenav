import type { Declined, Intake } from "@/lib/schema/intake";
import { profileSchema, type Profile } from "@/lib/schema/profile";

const isDeclined = (v: unknown): v is Declined =>
  v === "unknown" || v === "prefer_not_to_say";

/** Declined or missing answers become explicit "unknown" — never a default. */
const orUnknown = <T>(v: T | Declined | undefined): T | "unknown" =>
  v === undefined || isDeclined(v) ? "unknown" : v;

const yesNoToBool = (
  v: "yes" | "no" | Declined,
): boolean | "unknown" => (isDeclined(v) ? "unknown" : v === "yes");

/**
 * Normalize raw questionnaire answers into the profile consumed by the rules
 * engine. Output is validated against profileSchema (Zod at every boundary).
 */
export function normalize(intake: Intake): Profile {
  const adls = orUnknown(intake.adlsNeedingHelp);
  const isVeteran = yesNoToBool(intake.isVeteran);
  const insurance = orUnknown(intake.currentInsurance);
  const ownership = orUnknown(intake.homeOwnership);

  const profile: Profile = {
    state: "WA",
    age: orUnknown(intake.careRecipientAge),
    county: orUnknown(intake.county),
    livingSituation: orUnknown(intake.livingSituation),
    adlsNeedingHelp: adls,
    adlHelpCount: adls === "unknown" ? "unknown" : adls.length,
    diagnosisCategory: orUnknown(intake.diagnosisCategory),
    veteran: {
      isVeteran,
      // Era/discharge are structurally irrelevant for confirmed non-veterans;
      // for veterans (or unknown status) a missing answer stays unknown.
      serviceEra:
        isVeteran === false ? "not_applicable" : orUnknown(intake.serviceEra),
      dischargeType:
        isVeteran === false
          ? "not_applicable"
          : orUnknown(intake.dischargeType),
    },
    maritalStatus: orUnknown(intake.maritalStatus),
    monthlyIncomeBracket: orUnknown(intake.monthlyIncomeBracket),
    countableAssetsBracket: orUnknown(intake.countableAssetsBracket),
    ownsHome: ownership === "unknown" ? "unknown" : ownership === "owns",
    insurance:
      insurance === "unknown"
        ? {
            medicare: "unknown",
            medicaid: "unknown",
            ltcInsurance: "unknown",
            privateInsurance: "unknown",
          }
        : {
            medicare: insurance.includes("medicare"),
            medicaid: insurance.includes("medicaid"),
            ltcInsurance: insurance.includes("ltc_insurance"),
            privateInsurance: insurance.includes("private"),
          },
    recentRelocation: yesNoToBool(intake.recentRelocation),
    waCaresParticipation: orUnknown(intake.waCaresParticipation),
  };
  const notes = intake.additionalNotes?.trim();
  if (notes) profile.additionalNotes = notes;

  return profileSchema.parse(profile);
}
