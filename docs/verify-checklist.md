# Corpus VERIFY checklist

**Status (2026-07-05): verification pass complete.** 24 items verified
against fetched primary sources, 7 converted to `HUMAN-VERIFY` markers, 1
still unverified (va-aid-attendance care-cost evidence). Full quotes and
corrections: `eval/results/corpus-verification-report.md`.

Every `<!-- VERIFY -->` marker in `src/data/corpus/`, grouped by document.
Check items off as claims are confirmed against primary sources; when a claim
is verified, update the corpus doc, remove the marker, and re-run
`npm run ingest` so the index reflects the corrected text.

## wa-pace.md (5)

- [x] **L43 — Stale WAC citations.** HCA manual page shows a 2018 revision
  date citing WACs effective 2017. Confirm the cited rules are still current
  in the Washington Administrative Code.
- [x] **L63 — Premium amounts.** *(HUMAN-VERIFY — marker replaced with contact/question in the doc)* Premiums are set by each PACE organization
  and not published centrally. Call Providence ElderPlace / Franciscan /
  Sound PACE intake lines for current Medicare-only premium figures.
- [x] **L75 — Spokane ZIP typo.** DSHS prints the Spokane center's ZIP as
  98208 (an Everett-area ZIP; Spokane is 992xx — likely 99208). Confirm the
  address before relying on it.
- [x] **L82 — County coverage.** *(HUMAN-VERIFY — marker replaced with contact/question in the doc)* King/Snohomish/Pierce/Spokane coverage is
  inferred from center locations; DSHS defines service areas by ZIP. Confirm
  against the DSHS PACE ZIP list.
- [x] **L97 — Document checklist.** *(HUMAN-VERIFY — marker replaced with contact/question in the doc)* No official applicant document checklist
  is published; intake lines walk applicants through requirements. Confirm
  with a PACE organization what applicants must supply.

## wa-apple-health-ltc.md (4)

- [x] **L30 — 30-day processing framing.** Comes from HCA worker guidance and
  search snippets; fetch WAC 182-513-1320 rule text to confirm.
- [x] **L43 — MN spenddown mechanics.** WAC 182-513-1395 was not fetched; the
  "income below the private facility rate" ceiling is sourced from a 2003
  DSHS brochure. Verify current mechanics and the current private
  nursing-facility rate.
- [x] **L69 — Personal needs allowance.** Which PNA applies to a given client
  depends on payment source and was not fully disambiguated. Verify against
  the current PNA table.
- [x] **L76 — Nursing-facility service description.** Relies on a 2003 DSHS
  brochure; re-verify current benefit detail.

## wa-tsoa.md (3)

- [x] **L36 — Medicaid-enrollment exclusion rule.** WAC 182-513-1615 was not
  fetched directly; the DSHS manual implies CN/ABP enrollment terminates
  TSOA. Fetch the WAC text to confirm.
- [x] **L65 — Step 3 benefit figures.** Figures are the "as of 7/1/2024"
  amounts printed in the April 2026 DSHS manual; current amount is
  recalculated from home care agency rates (HCS Rates website, "MAC-TSOA"
  tab). Pull the current figure.
- [x] **L88 — Enrollment-pause intake.** *(HUMAN-VERIFY — marker replaced with contact/question in the doc)* Unclear whether full applications
  are financially processed during the pause or intake is waitlist-only (the
  waitlist FAQ says joining requires only basic demographics). Confirm with
  DSHS/HCS.

## wa-respite-care.md (3)

- [x] **L65 — FCSP respite caps.** *(HUMAN-VERIFY — marker replaced with contact/question in the doc)* No statewide dollar/hour cap published;
  amounts vary by AAA and local budget, waitlists possible. Confirm with the
  relevant Area Agency on Aging.
- [x] **L68 — DDA respite details.** IFS annual budget tiers and Overnight
  Planned Respite Services (OPRS) details were not confirmed from official
  pages. Verify with DDA sources.
- [x] **L88 — Proof documents.** *(HUMAN-VERIFY — marker replaced with contact/question in the doc)* No fetched page enumerates proof documents
  beyond the application itself. Confirm with FCSP/AAA intake.

## wa-mac.md (3)

- [x] **L39 — Regulatory text.** WAC 182-513-1605 could not be fetched;
  criteria are from the DSHS manual. Fetch the WAC to confirm.
- [x] **L41 — Caregiver relationship test.** Whether any test applies beyond
  "unpaid family caregiver, age 18+" was not enumerated. Confirm scope.
- [x] **L54 — Step 3 amount.** Printed amount is "as of 7/1/2024"; current
  amount is recalculated from home care agency rates (HCS Rates website,
  "MAC-TSOA" tab). Pull the current figure.

## wa-cares-fund.md (3)

- [x] **L25 — 10-year vesting phrasing.** RCW 50A.04 phrases it as 10 years
  "without interruption of five or more consecutive years"; the website says
  only "at least 10 years." Check the RCW for the exact rule.
- [x] **L44 — Residency requirement.** Out-of-state opt-in and the July 2030
  date are confirmed on wacaresfund.wa.gov; the in-state residency
  requirement for initial benefit use is implied but not stated verbatim.
  Find an authoritative statement.
- [x] **L64 — Family caregiver wages.** Whether benefits can pay wages to
  family caregivers (vs. only caregiver education and respite) was not
  explicitly stated on the benefits page. Confirm.

## va-aid-attendance.md (3)

- [x] **L63 — Monthly payment math.** Payments are annual MAPR minus
  countable income, divided by 12; VA publishes annual figures only, so any
  per-month dollar amounts shown elsewhere should be checked.
- [x] **L66 — Surviving-spouse rates.** Not covered in this document; fetched
  pages covered veteran rates only. Decide whether to add a
  surviving-spouse section with sourced rates.
- [ ] **L91 — Care-cost evidence.** *(STILL UNVERIFIED — source ambiguous)* Whether additional evidence of
  unreimbursed care costs is required for A&A specifically was not detailed
  on the fetched pages. Confirm with VA guidance.

## va-housebound.md (2)

- [x] **L28 — Regulatory definition.** 38 CFR 3.351 housebound criteria
  (single permanent 100% disability plus confinement, or 100% plus separate
  60%) were not confirmed from the fetched VA pages. Verify against the CFR.
- [x] **L41 — Married/two-veteran rates.** Housebound rates for
  married-veteran and two-veteran households were not captured from the
  rates page. Pull them.

## wa-medicaid-cfc.md (2)

- [x] **L36 — In-home participation.** Whether in-home CFC clients ever pay
  participation toward cost of care was not confirmed (only ALF
  room-and-board figures were). Verify.
- [x] **L39 — "Entitlement" characterization.** The 1915(k) state-plan basis
  is confirmed by the DSHS manual, but the "entitlement" framing comes from
  secondary sources. Confirm or soften the wording.

## medicare-snf.md (2)

- [x] **L61 — Benefit period definition.** Commonly stated as beginning on
  inpatient admission and ending after 60 consecutive days without inpatient
  hospital or SNF care; the fetched pages reference benefit periods without
  the full definition. Verify on Medicare.gov.
- [x] **L82 — Document checklist.** *(HUMAN-VERIFY — marker replaced with contact/question in the doc)* Medicare.gov publishes no explicit
  beneficiary document checklist; hospital and SNF handle certification
  paperwork. Confirm nothing is required of the beneficiary directly.

## medicare-home-health.md (1)

- [x] **L75 — Paperwork checklist.** *(HUMAN-VERIFY — marker replaced with contact/question in the doc)* Medicare.gov publishes no explicit
  beneficiary paperwork checklist; the agency and provider assemble
  certification records. Confirm nothing is required of the beneficiary
  directly.

## wa-medicaid-copes.md (1)

- [x] **L32 — NFLOC thresholds.** Exact CARE-score thresholds constituting
  nursing facility level of care (WAC 388-106-0355) were not fetched. Fetch
  the rule text to confirm.
