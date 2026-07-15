# Independent labeling report (Phase 7.5)

Blind manual labels (filled 2026-07-09, locked before comparison) vs the sealed system snapshot. Labeling never imported or read src/lib/rules/; relevance was judged by reading chunks against queries.

## Summary

- Subset: 26 families (5 per bucket + 6th ambiguous), 12 labeled queries × 40 chunks. Index sha256 `af18af047074…` (matches the Phase 7 run).
- **Exact-set-match rate:** strict (system set = manual WI): **0/26** (0.0%); lenient (system set = manual WI∪UNK): **11/26** (42.3%).
- **Program-set P/R (system vs manual):** strict P 43.8% / R 85.6%; lenient P 99.6% / R 82.5%. Phase 7 (rules-derived truth): P 100.0% / R 100.0%.
- **Unknown handling:** manual UNK labels: 110; system included 93 of them (73 with an explicit missing-info flag) and excluded 17. Unknown-vs-included and unknown-vs-excluded are itemized separately in the disagreement table.
- **Missing-info flag gap (system behavior finding, not a ground-truth disagreement):** 20 of the 93 manual-UNK programs the system included carry no missing-info flag explaining what's unresolved (only 73/93, 78.5%, do). This is not about whether those programs should be included — it's about whether the system explains why when it includes them.
- **Reconciliation (2026-07-09):** 25 asset-policy rows corrected to NWI — 17 UNK→NWI (high-asset bucket + ambiguous-04) and 8 WI→NWI (simple-20, veteran-20, medicaid-edge-20, medicaid-edge-08/wa-tsoa) — per the corpus's flat resource standards. 4 exception rows corrected WI→UNK (simple-05/wa-tsoa, medicaid-edge-13/wa-tsoa, ambiguous-03/wa-medicaid-copes, ambiguous-03/wa-apple-health-ltc). Two proposed future rule changes: (a) TSOA Medicaid enrollment: fail → unknown when insurance.medicaid is true; (b) NFLOC proxy: fail → unknown when livingSituation is nursing_facility. The rows for simple-01 and medicaid-edge-08 (wa-medicaid-copes / wa-apple-health-ltc, enrolled-in-Medicaid pathway) were left open here pending a decision on the Medicaid-enrollment financial predicate; that decision was taken and implemented the same day — see the addendum below (commit `4bffac4`), which softened `medicaidAssets` to return `unknown` (not `fail`) when reported Medicaid enrollment conflicts with above-limit assets, so all four programs are now included as possibly relevant with the enrollment conflict surfaced as missing information (the manual WI labels stand). No Medicaid-enrollment rows remain unreconciled.
- **Retrieval vs manual relevance (12 queries):** precision 100.0%, recall 81.5%, top-5 recall 82.1% (system returns top-3, program-scoped). Phase 7 retriever-defined numbers were program-set-level (P 100.0% / R 100.0% / top-5 100.0%) — not chunk-level, so the chunk-level gap here is the first independent measurement, not a regression.
- Task A disagreements: 55; Task B disagreements: 11.

### Conventions

- System program set = programs in the recorded Phase 7 report. Strict compares against manual WI; lenient against WI∪UNK (the system includes unknown-status programs by design, so both views are shown).
- Retrieval comparison uses the system's top-3 program-scoped chunks per query against the manual R set over all 40 chunks; manual R chunks belonging to other programs can therefore never be retrieved by construction — those rows are the scoping cost made visible.

## Per-program confusion

| Program | Over-included (sys in, manual NWI) | Under-included (sys out, manual WI) | UNK vs included | UNK vs excluded | Buckets |
|---|---|---|---|---|---|
| wa-medicaid-copes | 0 | 6 | 0 | 0 | underInclude:simple×2, underInclude:veteran×1, underInclude:medicaid_edge×2, underInclude:ambiguous×1 |
| wa-apple-health-ltc | 0 | 6 | 0 | 0 | underInclude:simple×2, underInclude:veteran×1, underInclude:medicaid_edge×2, underInclude:ambiguous×1 |
| wa-tsoa | 0 | 5 | 0 | 0 | underInclude:simple×2, underInclude:medicaid_edge×3 |
| wa-mac | 1 | 0 | 0 | 0 | overInclude:ambiguous×1 |

## Retrieval per query

| Query | Bucket | Precision | Recall | Top-5 recall | Retrieved | Manual R count |
|---|---|---|---|---|---|---|
| simple-01/wa-mac | simple | 100.0% | 33.3% | 40.0% | 2 | 6 |
| simple-10/medicare-home-health | simple | 100.0% | 100.0% | 100.0% | 3 | 3 |
| simple-20/wa-respite-care | simple | 100.0% | 75.0% | 75.0% | 3 | 4 |
| veteran-01/va-aid-attendance | veteran | 100.0% | 75.0% | 75.0% | 3 | 4 |
| veteran-05/wa-tsoa | veteran | 100.0% | 60.0% | 60.0% | 3 | 5 |
| veteran-20/medicare-snf | veteran | 100.0% | 100.0% | 100.0% | 3 | 3 |
| medicaid-edge-01/wa-apple-health-ltc | medicaid_edge | 100.0% | 60.0% | 60.0% | 3 | 5 |
| medicaid-edge-05/wa-medicaid-copes | medicaid_edge | 100.0% | 100.0% | 100.0% | 3 | 3 |
| high-asset-01/wa-medicaid-cfc | high_asset | 100.0% | 100.0% | 100.0% | 2 | 2 |
| high-asset-15/va-housebound | high_asset | 100.0% | 100.0% | 100.0% | 2 | 2 |
| ambiguous-01/wa-cares-fund | ambiguous | 100.0% | 100.0% | 100.0% | 3 | 3 |
| ambiguous-12/wa-pace | ambiguous | 100.0% | 75.0% | 75.0% | 3 | 4 |

## Disagreement table

Every row is either a system error worth fixing before Phase 8, or a manual label worth revisiting — the reconciliation column is where that call gets recorded.

| Family / query | Bucket | Program / chunk | System label | Manual label | Reconciliation |
|---|---|---|---|---|---|
| simple-01 | simple | wa-medicaid-copes | excluded | WI |  |
| simple-01 | simple | wa-apple-health-ltc | excluded | WI |  |
| simple-01 | simple | medicare-home-health | included (medium), no missing-info flag | UNK |  |
| simple-01 | simple | wa-tsoa | excluded | WI |  |
| simple-05 | simple | wa-tsoa | excluded | WI | Manual label corrected to UNK; system should soften TSOA Medicaid-enrollment predicate from fail to unknown because Medicaid checkbox does not distinguish CN/ABP from MN/MSP. |
| simple-10 | simple | medicare-home-health | included (medium), no missing-info flag | UNK |  |
| simple-15 | simple | medicare-home-health | included (medium), no missing-info flag | UNK |  |
| simple-20 | simple | wa-medicaid-copes | excluded | WI | Manual label corrected to NWI — corpus states flat resource standard and the asset bracket + marital status settle ineligibility. |
| simple-20 | simple | wa-apple-health-ltc | excluded | WI | Manual label corrected to NWI — corpus states flat resource standard and the asset bracket + marital status settle ineligibility. |
| veteran-01 | veteran | va-aid-attendance | included (medium), no missing-info flag | UNK |  |
| veteran-01 | veteran | va-housebound | included (medium), no missing-info flag | UNK |  |
| veteran-01 | veteran | medicare-home-health | included (medium), no missing-info flag | UNK |  |
| veteran-04 | veteran | medicare-home-health | included (medium), no missing-info flag | UNK |  |
| veteran-05 | veteran | medicare-home-health | included (medium), no missing-info flag | UNK |  |
| veteran-11 | veteran | medicare-home-health | included (medium), no missing-info flag | UNK |  |
| veteran-20 | veteran | wa-medicaid-copes | excluded | WI | Manual label corrected to NWI — corpus states flat resource standard and the asset bracket + marital status settle ineligibility. |
| veteran-20 | veteran | wa-apple-health-ltc | excluded | WI | Manual label corrected to NWI — corpus states flat resource standard and the asset bracket + marital status settle ineligibility. |
| veteran-20 | veteran | medicare-home-health | included (medium), no missing-info flag | UNK |  |
| medicaid-edge-01 | medicaid_edge | medicare-home-health | included (medium), no missing-info flag | UNK |  |
| medicaid-edge-05 | medicaid_edge | medicare-home-health | included (medium), no missing-info flag | UNK |  |
| medicaid-edge-08 | medicaid_edge | wa-medicaid-copes | excluded | WI |  |
| medicaid-edge-08 | medicaid_edge | wa-apple-health-ltc | excluded | WI |  |
| medicaid-edge-08 | medicaid_edge | medicare-home-health | included (medium), no missing-info flag | UNK |  |
| medicaid-edge-08 | medicaid_edge | wa-tsoa | excluded | WI | Manual label corrected to NWI — corpus states flat resource standard and the asset bracket + marital status settle ineligibility. |
| medicaid-edge-13 | medicaid_edge | wa-tsoa | excluded | WI | Manual label corrected to UNK; system should soften TSOA Medicaid-enrollment predicate from fail to unknown because Medicaid checkbox does not distinguish CN/ABP from MN/MSP. |
| medicaid-edge-20 | medicaid_edge | wa-medicaid-copes | excluded | WI | Manual label corrected to NWI — corpus states flat resource standard and the asset bracket + marital status settle ineligibility. |
| medicaid-edge-20 | medicaid_edge | wa-apple-health-ltc | excluded | WI | Manual label corrected to NWI — corpus states flat resource standard and the asset bracket + marital status settle ineligibility. |
| medicaid-edge-20 | medicaid_edge | wa-tsoa | excluded | WI | Manual label corrected to NWI — corpus states flat resource standard and the asset bracket + marital status settle ineligibility. |
| high-asset-01 | high_asset | wa-medicaid-copes | excluded | UNK | Manual label corrected to NWI — corpus states flat resource standard and the asset bracket + marital status settle ineligibility. |
| high-asset-01 | high_asset | wa-apple-health-ltc | excluded | UNK | Manual label corrected to NWI — corpus states flat resource standard and the asset bracket + marital status settle ineligibility. |
| high-asset-01 | high_asset | wa-tsoa | excluded | UNK | Manual label corrected to NWI — corpus states flat resource standard and the asset bracket + marital status settle ineligibility. |
| high-asset-05 | high_asset | wa-medicaid-copes | excluded | UNK | Manual label corrected to NWI — corpus states flat resource standard and the asset bracket + marital status settle ineligibility. |
| high-asset-05 | high_asset | wa-apple-health-ltc | excluded | UNK | Manual label corrected to NWI — corpus states flat resource standard and the asset bracket + marital status settle ineligibility. |
| high-asset-05 | high_asset | medicare-home-health | included (medium), no missing-info flag | UNK |  |
| high-asset-05 | high_asset | wa-tsoa | excluded | UNK | Manual label corrected to NWI — corpus states flat resource standard and the asset bracket + marital status settle ineligibility. |
| high-asset-10 | high_asset | wa-medicaid-copes | excluded | UNK | Manual label corrected to NWI — corpus states flat resource standard and the asset bracket + marital status settle ineligibility. |
| high-asset-10 | high_asset | wa-apple-health-ltc | excluded | UNK | Manual label corrected to NWI — corpus states flat resource standard and the asset bracket + marital status settle ineligibility. |
| high-asset-10 | high_asset | va-aid-attendance | included (medium), no missing-info flag | UNK |  |
| high-asset-10 | high_asset | medicare-home-health | included (medium), no missing-info flag | UNK |  |
| high-asset-10 | high_asset | wa-tsoa | excluded | UNK | Manual label corrected to NWI — corpus states flat resource standard and the asset bracket + marital status settle ineligibility. |
| high-asset-15 | high_asset | wa-medicaid-copes | excluded | UNK | Manual label corrected to NWI — corpus states flat resource standard and the asset bracket + marital status settle ineligibility. |
| high-asset-15 | high_asset | wa-apple-health-ltc | excluded | UNK | Manual label corrected to NWI — corpus states flat resource standard and the asset bracket + marital status settle ineligibility. |
| high-asset-15 | high_asset | medicare-home-health | included (medium), no missing-info flag | UNK |  |
| high-asset-15 | high_asset | wa-tsoa | excluded | UNK | Manual label corrected to NWI — corpus states flat resource standard and the asset bracket + marital status settle ineligibility. |
| high-asset-20 | high_asset | wa-medicaid-copes | excluded | UNK | Manual label corrected to NWI — corpus states flat resource standard and the asset bracket + marital status settle ineligibility. |
| high-asset-20 | high_asset | wa-apple-health-ltc | excluded | UNK | Manual label corrected to NWI — corpus states flat resource standard and the asset bracket + marital status settle ineligibility. |
| high-asset-20 | high_asset | medicare-home-health | included (medium), no missing-info flag | UNK |  |
| high-asset-20 | high_asset | wa-tsoa | excluded | UNK | Manual label corrected to NWI — corpus states flat resource standard and the asset bracket + marital status settle ineligibility. |
| ambiguous-03 | ambiguous | wa-medicaid-copes | excluded | WI | Manual label corrected to UNK; system should soften NFLOC proxy from fail to unknown for nursing-facility residence because daily nursing-care criterion is unresolved, not disproven. |
| ambiguous-03 | ambiguous | wa-apple-health-ltc | excluded | WI | Manual label corrected to UNK; system should soften NFLOC proxy from fail to unknown for nursing-facility residence because daily nursing-care criterion is unresolved, not disproven. |
| ambiguous-04 | ambiguous | wa-medicaid-copes | excluded | UNK | Manual label corrected to NWI — corpus states flat resource standard and the asset bracket + marital status settle ineligibility. |
| ambiguous-04 | ambiguous | wa-apple-health-ltc | excluded | UNK | Manual label corrected to NWI — corpus states flat resource standard and the asset bracket + marital status settle ineligibility. |
| ambiguous-04 | ambiguous | medicare-home-health | included (medium), no missing-info flag | UNK |  |
| ambiguous-06 | ambiguous | medicare-home-health | included (medium), no missing-info flag | UNK |  |
| ambiguous-20 | ambiguous | wa-mac | included (low) | NWI |  |
| query-01 | simple | wa-apple-health-ltc#00-overview-eligibility-part-1 | not retrieved (top-3, program-scoped) | R |  |
| query-01 | simple | wa-apple-health-ltc#01-overview-eligibility-part-2 | not retrieved (top-3, program-scoped) | R |  |
| query-01 | simple | wa-apple-health-ltc#03-how-to-apply | not retrieved (top-3, program-scoped) | R |  |
| query-01 | simple | wa-apple-health-ltc#04-documentation-needed | not retrieved (top-3, program-scoped) | R |  |
| query-03 | simple | wa-respite-care#03-documentation-needed | not retrieved (top-3, program-scoped) | R |  |
| query-04 | veteran | va-aid-attendance#02-how-to-apply | not retrieved (top-3, program-scoped) | R |  |
| query-05 | veteran | wa-tsoa#02-what-it-covers | not retrieved (top-3, program-scoped) | R |  |
| query-05 | veteran | wa-tsoa#04-documentation-needed | not retrieved (top-3, program-scoped) | R |  |
| query-07 | medicaid_edge | wa-apple-health-ltc#02-what-it-covers | not retrieved (top-3, program-scoped) | R |  |
| query-07 | medicaid_edge | wa-apple-health-ltc#04-documentation-needed | not retrieved (top-3, program-scoped) | R |  |
| query-12 | ambiguous | wa-pace#01-what-it-covers | not retrieved (top-3, program-scoped) | R |  |

---

## Addendum (2026-07-09): rule changes implemented

Commit `4bffac4` ("fix: soften eligibility predicates for unresolved intake
facts") implemented the two proposed rule changes plus the
Medicaid-enrollment financial predicate, resolving the 9 rows this report
left pointing at the rules engine:

- **simple-01 / medicaid-edge-08 × wa-medicaid-copes, wa-apple-health-ltc
  (4 rows)** — `medicaidAssets` now returns unknown (not fail) when the
  family reports current Medicaid enrollment alongside above-limit assets;
  all four programs are now included as possibly relevant with the
  enrollment conflict surfaced as missing information. The manual WI labels
  stand.
- **simple-01 / simple-05 / medicaid-edge-13 × wa-tsoa (3 rows)** —
  `tsoa-not-on-medicaid` now returns unknown (not fail) for reported
  enrollment, since the intake checkbox cannot distinguish CN/ABP (barred)
  from MN/MSP ("may still qualify"). Final labels: UNK.
- **ambiguous-03 × wa-medicaid-copes, wa-apple-health-ltc (2 rows)** — a
  scoped NFLOC proxy returns unknown (not fail) for 0-ADL nursing-facility
  residents (WAC 388-106-0355(a) unresolved); TSOA/MAC/PACE keep the plain
  proxy, so ambiguous-03/wa-tsoa correctly remains excluded. Final labels:
  UNK.

A fresh 100-case eval after the changes: hallucinated-program rate 0.0%,
citation validity 100.0% (1,509 citations), 0 failures; ground truth
regenerated (10 families gained programs, none lost). All 13
predicted-delta checks matched, including the regressions (high-asset
families remain excluded; medicaid-edge-08/wa-tsoa remains excluded via
tsoa-assets).
