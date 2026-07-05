import { z } from "zod";
import {
  adlValues,
  assetsBracketValues,
  diagnosisCategoryValues,
  dischargeTypeValues,
  incomeBracketValues,
  insuranceValues,
  livingSituationValues,
  maritalStatusValues,
  serviceEraValues,
  waCaresParticipationValues,
  waCountyValues,
} from "@/lib/schema/intake";

/**
 * Normalized family profile consumed by the rules engine (Layer 1).
 *
 * A field the family did not answer (or declined to answer) is represented
 * explicitly as "unknown" — never inferred or defaulted.
 */
export const unknownable = <T extends z.ZodTypeAny>(schema: T) =>
  z.union([schema, z.literal("unknown")]);

/** For fields that can also be structurally irrelevant (e.g., service era for non-veterans). */
const unknownableOrNa = <T extends z.ZodTypeAny>(schema: T) =>
  z.union([schema, z.literal("unknown"), z.literal("not_applicable")]);

export const profileSchema = z.object({
  state: z.literal("WA"),
  age: unknownable(z.number().int().min(18).max(120)),
  county: unknownable(z.enum(waCountyValues)),
  livingSituation: unknownable(z.enum(livingSituationValues)),
  /** Empty array means no help needed with any listed ADL (a known answer). */
  adlsNeedingHelp: unknownable(z.array(z.enum(adlValues))),
  /** Derived from adlsNeedingHelp; "unknown" exactly when the list is unknown. */
  adlHelpCount: unknownable(z.number().int().min(0).max(adlValues.length)),
  diagnosisCategory: unknownable(z.enum(diagnosisCategoryValues)),
  veteran: z.object({
    isVeteran: unknownable(z.boolean()),
    serviceEra: unknownableOrNa(z.enum(serviceEraValues)),
    dischargeType: unknownableOrNa(z.enum(dischargeTypeValues)),
  }),
  maritalStatus: unknownable(z.enum(maritalStatusValues)),
  monthlyIncomeBracket: unknownable(z.enum(incomeBracketValues)),
  countableAssetsBracket: unknownable(z.enum(assetsBracketValues)),
  ownsHome: unknownable(z.boolean()),
  insurance: z.object({
    medicare: unknownable(z.boolean()),
    medicaid: unknownable(z.boolean()),
    ltcInsurance: unknownable(z.boolean()),
    privateInsurance: unknownable(z.boolean()),
  }),
  /** Moved to Washington within the past 5 years. */
  recentRelocation: unknownable(z.boolean()),
  waCaresParticipation: unknownable(z.enum(waCaresParticipationValues)),
  /**
   * Free text from the family, passed through verbatim (undefined when not
   * provided). Data only: never read by rules, never embedded for retrieval.
   */
  additionalNotes: z.string().optional(),
});

export type Profile = z.infer<typeof profileSchema>;
export type InsuranceKind = (typeof insuranceValues)[number];
