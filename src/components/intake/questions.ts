import type { Intake } from "@/lib/schema/intake";
import { adlValues, insuranceValues, waCountyValues } from "@/lib/schema/intake";

/** Partial raw answers accumulated while the flow is in progress. */
export type RawAnswers = { [K in keyof Intake]?: Intake[K] };

export interface Option {
  value: string;
  label: string;
}

export interface QuestionDef {
  id: keyof Intake;
  prompt: string;
  help?: string;
  kind: "age" | "single" | "select" | "multi";
  options?: Option[];
  /** For multi questions: an explicit "none of these" answer (empty array). */
  noneLabel?: string;
  visibleWhen?: (answers: RawAnswers) => boolean;
}

/** Human-readable labels for every raw answer value, reused by the review screen. */
export const VALUE_LABELS: Record<string, string> = {
  unknown: "I don't know",
  prefer_not_to_say: "Prefer not to say",
  yes: "Yes",
  no: "No",
  own_home: "In their own home",
  family_home: "In a family member's home",
  assisted_living: "Assisted living facility",
  adult_family_home: "Adult family home",
  nursing_facility: "Nursing facility",
  other: "Other",
  bathing: "Bathing",
  dressing: "Dressing",
  transferring: "Transferring (bed/chair)",
  toileting: "Toileting",
  eating: "Eating",
  mobility: "Moving around (mobility)",
  dementia: "Dementia / Alzheimer's",
  parkinsons: "Parkinson's disease",
  stroke: "Stroke",
  heart_disease: "Heart disease",
  cancer: "Cancer",
  mental_health: "Mental health condition",
  developmental_disability: "Developmental disability",
  none: "None of these / no diagnosis",
  wwii: "World War II",
  korea: "Korean War era",
  vietnam: "Vietnam era",
  gulf_war_or_later: "Gulf War or later",
  peacetime: "Peacetime service",
  honorable: "Honorable",
  general: "General",
  other_than_honorable: "Other than honorable",
  bad_conduct_or_dishonorable: "Bad conduct / dishonorable",
  single: "Single (never married)",
  married: "Married",
  widowed: "Widowed",
  divorced: "Divorced",
  under_1000: "Under $1,000 / month",
  "1000_to_2999": "$1,000 – $2,999 / month",
  "3000_to_3999": "$3,000 – $3,999 / month",
  "4000_or_more": "$4,000 or more / month",
  under_2000: "Under $2,000",
  "2000_to_85000": "$2,000 – $85,000",
  "85000_to_160000": "$85,000 – $160,000",
  "160000_or_more": "$160,000 or more",
  owns: "Owns their home",
  rents: "Rents",
  medicare: "Medicare",
  medicaid: "Medicaid (Apple Health)",
  ltc_insurance: "Long-term care insurance",
  private: "Private / employer insurance",
  contributing: "Yes, has contributed through work",
  exempt: "Has an approved exemption",
  not_contributing: "Has not contributed",
};

const opts = (values: readonly string[]): Option[] =>
  values.map((value) => ({ value, label: VALUE_LABELS[value] ?? value }));

export const QUESTIONS: QuestionDef[] = [
  {
    id: "careRecipientAge",
    kind: "age",
    prompt: "How old is the person who needs care?",
    help: "Their age helps identify which programs are worth looking into — several have minimum ages (55, 65).",
  },
  {
    id: "county",
    kind: "select",
    prompt: "Which Washington county do they live in?",
    help: "Some programs (like PACE) only operate in certain areas.",
    options: opts(waCountyValues),
  },
  {
    id: "livingSituation",
    kind: "single",
    prompt: "Where do they currently live?",
    options: opts([
      "own_home",
      "family_home",
      "assisted_living",
      "adult_family_home",
      "nursing_facility",
      "other",
    ]),
  },
  {
    id: "adlsNeedingHelp",
    kind: "multi",
    prompt: "Which everyday activities do they need help with?",
    help: "Select all that apply. “Help” includes supervision, reminders, or set-up assistance.",
    options: opts(adlValues),
    noneLabel: "No help needed with any of these",
  },
  {
    id: "diagnosisCategory",
    kind: "multi",
    prompt: "Has a doctor diagnosed any of the following? (optional)",
    help: "Select all that apply.",
    options: opts([
      "dementia",
      "parkinsons",
      "stroke",
      "heart_disease",
      "cancer",
      "mental_health",
      "developmental_disability",
      "other",
    ]),
    noneLabel: "None of these / no diagnosis",
  },
  {
    id: "isVeteran",
    kind: "single",
    prompt: "Did they serve in the U.S. military?",
    options: opts(["yes", "no"]),
  },
  {
    id: "serviceEra",
    kind: "single",
    prompt: "When did they serve?",
    help: "VA pension benefits depend on service during recognized wartime periods.",
    options: opts(["wwii", "korea", "vietnam", "gulf_war_or_later", "peacetime"]),
    visibleWhen: (a) => a.isVeteran === "yes",
  },
  {
    id: "dischargeType",
    kind: "single",
    prompt: "What type of discharge did they receive?",
    options: opts([
      "honorable",
      "general",
      "other_than_honorable",
      "bad_conduct_or_dishonorable",
    ]),
    visibleWhen: (a) => a.isVeteran === "yes",
  },
  {
    id: "maritalStatus",
    kind: "single",
    prompt: "What is their marital status?",
    help: "Several programs have different financial rules for married couples.",
    options: opts(["single", "married", "widowed", "divorced"]),
  },
  {
    id: "monthlyIncomeBracket",
    kind: "single",
    prompt: "Roughly what is their monthly income?",
    help: "Include Social Security, pensions, and other regular income. A rough bracket is enough.",
    options: opts(["under_1000", "1000_to_2999", "3000_to_3999", "4000_or_more"]),
  },
  {
    id: "countableAssetsBracket",
    kind: "single",
    prompt: "Roughly what are their countable assets?",
    help: "Savings, investments, and property other than the home they live in. A rough bracket is enough.",
    options: opts([
      "under_2000",
      "2000_to_85000",
      "85000_to_160000",
      "160000_or_more",
    ]),
  },
  {
    id: "homeOwnership",
    kind: "single",
    prompt: "Do they own their home?",
    options: opts(["owns", "rents", "other"]),
  },
  {
    id: "currentInsurance",
    kind: "multi",
    prompt: "What health coverage do they currently have?",
    help: "Select all that apply.",
    options: opts(insuranceValues),
    noneLabel: "None of these",
  },
  {
    id: "recentRelocation",
    kind: "single",
    prompt: "Did they move to Washington within the past 5 years?",
    help: "Some programs look at residency history and recent financial transfers.",
    options: opts(["yes", "no"]),
  },
  {
    id: "waCaresParticipation",
    kind: "single",
    prompt: "Have they contributed to the WA Cares Fund through work?",
    help: "WA Cares deductions (0.58% of pay) started July 2023 for most Washington workers.",
    options: opts(["contributing", "exempt", "not_contributing"]),
  },
];

/** Questions visible for the current answers (veteran follow-ups are conditional). */
export const visibleQuestions = (answers: RawAnswers): QuestionDef[] =>
  QUESTIONS.filter((q) => !q.visibleWhen || q.visibleWhen(answers));

/** Format a raw answer for display on the review screen. */
export function formatAnswer(value: Intake[keyof Intake] | undefined): string {
  if (value === undefined) return "—";
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return "None";
    return value.map((v) => VALUE_LABELS[v] ?? v).join(", ");
  }
  return VALUE_LABELS[value] ?? value;
}
