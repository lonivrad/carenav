/**
 * Plain-language labels for profile fields, shared between the pipeline
 * (follow-up question fallback) and the report UI (unknowns panel). Kept
 * free of server-only imports so client components can use it directly.
 */
export const FIELD_QUESTIONS: Record<string, string> = {
  age: "How old is the person who needs care?",
  county: "Which Washington county do they live in?",
  livingSituation: "Where do they currently live?",
  adlHelpCount: "Which everyday activities do they need help with?",
  adlsNeedingHelp: "Which everyday activities do they need help with?",
  "veteran.isVeteran": "Did they serve in the U.S. military?",
  "veteran.serviceEra": "When did they serve in the military?",
  "veteran.dischargeType": "What type of military discharge did they receive?",
  maritalStatus: "What is their marital status?",
  monthlyIncomeBracket: "Roughly what is their monthly income?",
  countableAssetsBracket: "Roughly what are their countable assets?",
  "insurance.medicare": "Are they enrolled in Medicare?",
  "insurance.medicaid": "Are they enrolled in Medicaid (Apple Health)?",
  waCaresParticipation: "Have they contributed to the WA Cares Fund through work?",
};

export const questionForField = (field: string): string =>
  FIELD_QUESTIONS[field.replace(/ \(not collected\)$/, "")] ??
  `Can you provide: ${field.replace(/\./g, " → ").replace(/ \(not collected\)$/, "")}?`;
