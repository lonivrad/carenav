# Corpus verification report

Verification pass over all 32 `<!-- VERIFY -->` markers in `src/data/corpus/`
(2026-07-05). Method: every claim classified FETCHABLE or HUMAN-ONLY; each
FETCHABLE claim resolved only by fetching the primary source and quoting the
supporting text; no claim confirmed from model knowledge. After edits:
`npm run ingest` rebuilt the index (38 chunks, 12 programs) and `npm test`
passed (74 tests), including the live retrieval smoke test.

Outcome: 24 items VERIFIED (markers removed, sources added to frontmatter and
manifest), 1 item STILL UNVERIFIED (marker retained), 7 items HUMAN-VERIFY
(markers replaced, wording hedged).

---

## VERIFIED

### wa-pace

- **Stale WAC citations (L43).** Source:
  https://app.leg.wa.gov/wac/default.aspx?cite=182-513-1230 — "WSR 21-18-045,
  § 182-513-1230, filed 8/25/21, effective 9/25/21." Rules were indeed amended
  after the HCA page's 2018 revision date. **Correction:** doc now notes the
  9/25/2021 effective date and to prefer the WAC over the manual page.
- **Spokane ZIP typo (L75).** Source:
  https://www.providence.org/locations/wa/elderplace-spokane — "Providence
  PACE Spokane, 6018 N Astor St, Spokane, WA 99208." DSHS prints 98208 for the
  same center. **Correction:** doc now states ZIP 99208 and flags the DSHS
  misprint.
- **ZIP-defined service areas (L82).** Source:
  https://www.dshs.wa.gov/altsa/program-all-inclusive-care-elderly-pace —
  "DSHS currently contracts with Providence PACE, International Community
  Health Services (ICHS) and PNW PACE Partners (PNW PACE)"; applicants must
  "live in their coverage area (see zip codes)" per a downloadable "PACE
  Coverage Area Zip Codes" spreadsheet; no counties listed. **Correction:**
  county list kept explicitly as inference; a HUMAN-VERIFY note points to the
  ZIP spreadsheet (Excel download, not machine-fetched here).

### wa-cares-fund

- **10-year vesting phrasing (L25).** Source:
  https://app.leg.wa.gov/rcw/default.aspx?cite=50B.04.050 — "A total of ten
  years without interruption of five or more consecutive years"; "Three years
  within the last six years from the date of application for benefits"; "at
  least 500 hours during each" qualifying year. **Correction:** doc now quotes
  the statutory phrasing and fixes the citation (the doc previously cited RCW
  50A.04; the correct chapter is RCW 50B.04).
- **Out-of-state / residency (L44).** Sources:
  https://wacaresfund.wa.gov/help-support/frequently-asked-questions and
  https://wacaresfund.wa.gov/qualify — "Washington workers can choose to
  continue participating in the WA Cares Fund if they move out of state";
  "Benefits will be available to out-of-state participants who meet
  contribution requirements and need care starting in July 2030."
  **Correction:** the flat "must live in Washington to use benefits" wording
  was softened — no page states a residency rule verbatim; the doc now derives
  it from the July 2030 out-of-state start date and adds the opt-in conditions
  (within 1 year of leaving; 3+ years contributed).
- **Family caregiver wages (L64) — CONTRADICTED.** Source:
  https://wacaresfund.wa.gov/benefits — "If you have a family member who helps
  you out on a regular basis, they may qualify to become your paid caregiver,"
  with "Paying a family caregiver, including training (10 hours/week for 2
  years): $31,200" as a worked example. **Correction:** the doc's "unclear
  whether family caregivers can be paid" was replaced — WA Cares explicitly
  pays family caregivers.

### va-aid-attendance

- **MAPR payment math (L63).** Source:
  https://www.va.gov/pension/veterans-pension-rates/ — "We'll base your
  payment amount on the difference between your income for VA purposes and a
  limit that Congress sets (called the Maximum Annual Pension Rate, or MAPR)";
  A&A veteran-no-dependents MAPR $29,093 effective December 1, 2025 (matches
  the doc's figure). **Correction:** doc now quotes the VA formula and notes
  per-month figures are derived, since VA publishes annual amounts.
- **Surviving-spouse rates (L66).** Sources:
  https://www.va.gov/pension/survivors-pension-rates/ and
  https://www.va.gov/family-and-caregiver-benefits/survivor-compensation/survivors-pension/
  — survivor A&A MAPR (no dependents) $18,697 effective December 1, 2025;
  Survivors Pension "offers monthly payments to qualified surviving spouses
  and unmarried dependent children of wartime Veterans." **Correction:** doc
  gained a sourced surviving-spouse note.

### va-housebound

- **38 CFR 3.351 definition (L28).** Source:
  https://www.law.cornell.edu/cfr/text/38/3.351 (ecfr.gov bot-blocked; Cornell
  LII reproduction used) — paragraph (d): "(1) Has additional disability or
  disabilities independently ratable at 60 percent or more, separate and
  distinct from the permanent disability rated as 100 percent disabling…, or
  (2) Is 'permanently housebound' by reason of disability or disabilities...
  substantially confined to his or her dwelling and the immediate premises."
  **Correction:** doc now quotes the regulatory text directly.
- **Married/two-veteran Housebound rates (L41).** Source:
  https://www.va.gov/pension/veterans-pension-rates/ — effective December 1,
  2025: one of two married veterans Housebound $26,710; both Housebound
  $30,580; one Housebound + one A&A $38,350. **Correction:** rates added.

### wa-mac

- **WAC 182-513-1605 criteria (L39).** Source:
  https://app.leg.wa.gov/wac/default.aspx?cite=182-513-1605 — "Be age 55 or
  older"; "Be assessed as meeting nursing facility level of care under WAC
  388-106-0355, and choose to receive services under the MAC program"; "Have
  an eligible unpaid caregiver under WAC 388-106-1905"; effective 6/28/25
  (WSR 25-12-036). **Correction:** criteria now cited to the rule, not just
  the manual.
- **Caregiver relationship test (L41).** Source:
  https://app.leg.wa.gov/wac/default.aspx?cite=388-106-1905 — "an unpaid
  caregiver who: (i) Is age 18 or older" plus care-planning participation;
  no family-relationship requirement in the rule. **Correction:** doc now
  notes the WAC requires only an unpaid caregiver 18+, though DSHS materials
  say "family caregiver."
- **Step 3 amount (L54).** Source:
  https://www.dshs.wa.gov/sites/default/files/ALTSA/msd/documents/All_HCS_Rates.pdf
  (text extracted locally with pdftotext) — "MAC/TSOA Rates Effective
  07/01/2025 … an average of $928 per month not to exceed $5,568 in a six
  month period" (all three program variants; an earlier printing of the same
  2025–26 table in the PDF shows $880/$5,280; the 2024–25 table shows
  $844/$5,064; benefit level rule: WAC 388-106-1920). **Correction:** doc
  updated from the stale $844 figure to the current $928/$5,568 with the
  discrepancy noted.

### wa-tsoa

- **CN/ABP exclusion (L36).** Source:
  https://app.leg.wa.gov/wac/default.aspx?cite=182-513-1615 — "A person who
  receives apple health coverage under a categorically needy (CN) or
  alternative benefit plan (ABP) program is not eligible for TSOA"; effective
  8/10/25 (WSR 25-15-053). **Correction:** implication upgraded to a direct
  quote of the rule.
- **Step 3 amount (L65).** Same source and correction as wa-mac Step 3 above.

### wa-apple-health-ltc

- **30-day institutional status (L30).** Source:
  https://app.leg.wa.gov/wac/default.aspx?cite=182-513-1320 — "A person must
  reside in a medical institution thirty consecutive days or more, or based on
  a department assessment, be likely to reside in a medical institution thirty
  consecutive days or more" (effective 2/17/2017). **Correction:** 30-day
  framing now quoted from the rule, including the HCB-waiver pathway to
  institutional status.
- **MN spenddown mechanics (L43).** Source:
  https://app.leg.wa.gov/wac/default.aspx?cite=182-513-1395 — income between
  the state-contracted rate and the private facility rate → "eligible to
  receive institutional services at the state-contracted rate," three- or
  six-month base period, MN eligibility when "additional medical expenses
  incurred during the base period exceeds the total remaining income for all
  months of the base period minus the total state-contracted rate."
  **Correction:** mechanics now cited to the current rule instead of the 2003
  brochure.
- **PNA by payment source (L69).** Source:
  https://app.leg.wa.gov/wac/default.aspx?cite=182-513-1105 (effective
  12/5/2025, WSR 25-22-083) — separate PNA amounts by setting/funding source;
  "the current PNA and room and board standards … are published under the
  institutional standards on the Washington apple health (medicaid) income and
  resource standards chart located at www.hca.wa.gov." **Correction:** marker
  replaced with the rule citation and pointer to the published chart.
- **Nursing-facility services (L76).** Source:
  https://www.dshs.wa.gov/altsa/residential-care-services/long-term-care-residential-options
  — nursing homes provide "24-hour supervised nursing care, personal care,
  therapy, nutrition management, organized activities, social services, room,
  board and laundry." **Correction:** 2003-brochure description replaced with
  the current DSHS page's wording.

### wa-medicaid-cfc

- **In-home participation (L36).** Source:
  https://app.leg.wa.gov/wac/default.aspx?cite=182-513-1215 —
  "Post-eligibility treatment of income rules do not apply if the client is
  eligible under subsection (1)(a) or (b)" (noninstitutional CN/ABP or
  spousal-impoverishment institutional spouse); waiver-pathway clients remain
  subject to participation. **Correction:** doc now states precisely which
  CFC clients pay no participation.
- **1915(k)/entitlement characterization (L39).** Source:
  https://www.law.cornell.edu/cfr/text/42/441.500 (medicaid.gov bot-blocked) —
  the subpart "implements section 1915(k) of the Act, referred to as the
  Community First Choice option," making attendant services available "to
  eligible individuals, as needed." **Correction:** "entitlement" framing
  replaced with the regulation's own state-plan-option language.

### wa-medicaid-copes

- **NFLOC criteria (L32).** Source:
  https://app.leg.wa.gov/wac/default.aspx?cite=388-106-0355 (effective
  2/12/2015, WSR 15-03-038) — criteria (a)–(d): daily nursing care or
  supervision; 3+ ADLs at specified assistance levels; 2+ ADLs at higher
  levels; or cognitive impairment ("disorientation, memory impairment,
  impaired decision making, or wandering") plus an ADL need. **Correction:**
  criteria summarized in the doc with the rule quote.

### medicare-snf

- **Benefit period definition (L61).** Source:
  https://www.law.cornell.edu/cfr/text/42/409.60 (Medicare.gov bot-blocked;
  the underlying regulation used instead) — "The initial benefit period begins
  on the day the beneficiary receives inpatient hospital, inpatient CAH, or
  SNF services for the first time…"; "a benefit period ends when a beneficiary
  has, for at least 60 consecutive days, not been an inpatient" of a hospital,
  CAH, or SNF. **Correction:** full definition added with the CFR citation.

### wa-respite-care

- **IFS tiers / OPRS (L68).** Sources:
  https://app.leg.wa.gov/wac/default.aspx?cite=388-828-9140 — IFS annual
  allocation levels "up to: $1,200 / $1,800 / $2,400 / $3,600" (effective
  10/18/2021, WSR 21-19-093); and https://www.dshs.wa.gov/dda/respite — OPRS
  for adults 18+ living with family/primary caregivers, "provided in a
  community setting, such as a home or apartment," "only one person at a
  time," "up to fourteen days within a calendar year." **Correction:** both
  sets of details added with citations.

---

## STILL UNVERIFIED

- **va-aid-attendance — care-cost evidence (formerly L91).** The fetched page
  (https://www.va.gov/pension/aid-attendance-housebound/) lists only VA Form
  21-2680 (medical-examiner section) and VA Form 21-0779 (nursing-home
  residents) and never addresses whether unreimbursed care-cost evidence is
  required for A&A specifically — ambiguous, so the `<!-- VERIFY -->` marker
  remains in place per the verification rules. (Fetch attempts against
  ecfr.gov for the underlying regulations were bot-blocked with a redirect to
  unblock.federalregister.gov.)

Fetch notes: medicare.gov, medicaid.gov, and ecfr.gov all block automated
fetches (HTTP 403 / bot-wall). Where possible the underlying regulation was
fetched from Cornell LII instead and cited as the URL actually consulted.

---

## HUMAN-VERIFY

Markers replaced with `<!-- HUMAN-VERIFY: … -->` and hedged wording; each
lists the exact question and contact.

1. **wa-pace — Medicare-only premiums.** Ask each PACE organization's intake
   line for current Medicare-only premium amounts. Providence PACE
   (206) 320-5325; ICHS PACE (206) 462-7100; PNW PACE Partners (253) 459-7270.
2. **wa-pace — applicant document checklist.** Ask the same intake lines what
   documents an applicant must bring.
3. **wa-pace — ZIP coverage check.** Open the "PACE Coverage Area Zip Codes"
   spreadsheet linked from
   https://www.dshs.wa.gov/altsa/program-all-inclusive-care-elderly-pace (or
   ask the intake line) to confirm a given ZIP is served.
4. **wa-respite-care — FCSP respite caps.** Ask the local Area Agency on Aging
   (via Community Living Connections, 1-855-567-0252) about current FCSP
   respite budget limits and waitlists in the family's county.
5. **wa-respite-care — Lifespan Respite proof documents.** Ask Lifespan
   Respite WA (lifespanrespitewa.org) whether any documentation beyond the
   application form is required.
6. **wa-tsoa — enrollment-pause intake.** Ask Home & Community Services (via
   Community Living Connections, 1-855-567-0252) whether TSOA applications are
   financially processed during the pause or intake is waitlist-only.
7. **medicare-snf / medicare-home-health — beneficiary paperwork.** Ask the
   SNF admissions office / home health agency what, if anything, the
   beneficiary must supply beyond insurance cards and ID (general questions:
   1-800-MEDICARE, 1-800-633-4227).
