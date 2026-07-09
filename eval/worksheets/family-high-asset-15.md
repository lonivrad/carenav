# Worksheet A — high-asset-15

Bucket: **high_asset**

## Family attributes


| Attribute                     | Answer           |
| ----------------------------- | ---------------- |
| Age of person needing care    | 73               |
| Washington county             | Clark            |
| Living situation              | family_home      |
| Daily activities needing help | eating, dressing |
| Diagnosis                     | dementia         |
| Veteran                       | yes              |
| Service era                   | vietnam          |
| Discharge type                | honorable        |
| Marital status                | single           |
| Monthly income bracket        | 3000_to_3999     |
| Countable assets bracket      | 160000_or_more   |
| Home ownership                | owns             |
| Current coverage              | medicare         |
| Moved to WA in past 5 years   | no               |
| WA Cares participation        | exempt           |
| Family note (free text)       | —                |




## Program judgments

Read the 12 corpus docs in `src/data/corpus/` against the attributes above. For each program write exactly one label in the Label column:

- `WI` — worth-investigating
- `NWI` — not-worth-investigating
- `UNK` — unknown-need-more-info (the docs plus these attributes do not settle it)


| Program                                                                            | Label (WI / NWI / UNK) | Why (one line)                                                                                                                           |     |     |
| ---------------------------------------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --- | --- |
| wa-medicaid-copes — Medicaid COPES waiver (Community Options Program Entry System) | UNK                    | Functional need is present, but Medicaid financial eligibility cannot be determined.                                                     |     |     |
| wa-medicaid-cfc — Medicaid Community First Choice (CFC)                            | UNK                    | Community resident with care needs, but Medicaid eligibility and NFLOC are not confirmed.                                                |     |     |
| wa-apple-health-ltc — Apple Health long-term care (WA institutional/LTSS Medicaid) | UNK                    | Likely functional need, but Medicaid financial eligibility cannot be confirmed.                                                          |     |     |
| wa-cares-fund — WA Cares Fund (Washington long-term care insurance)                | NWI                    | WA Cares participation is **exempt**, which is disqualifying.                                                                            |     |     |
| va-aid-attendance — VA Aid & Attendance (increased monthly pension)                | UNK                    | Veteran/service and clinical criteria are met, but the asset bracket (≥$160k) does not establish whether net worth exceeds the VA limit. |     |     |
| va-housebound — VA Housebound benefit (increased monthly pension)                  | UNK                    | Veteran criteria are met, but housebound status and pension financial eligibility are not established.                                   |     |     |
| medicare-home-health — Medicare home health benefit                                | UNK                    | Homebound status, skilled-care need, and provider certification are not provided.                                                        |     |     |
| medicare-snf — Medicare skilled nursing facility (SNF) coverage                    | UNK                    | No qualifying inpatient hospital stay or physician-certified skilled-care need is provided.                                              |     |     |
| wa-pace — PACE — Program of All-Inclusive Care for the Elderly (Washington)        | NWI                    | Clark County is outside Washington’s PACE service area.                                                                                  |     |     |
| wa-tsoa — Tailored Supports for Older Adults (TSOA)                                | UNK                    | Age and care needs fit, but caregiver and financial eligibility are not fully established.                                               |     |     |
| wa-mac — Medicaid Alternative Care (MAC)                                           | NWI                    | Requires current Apple Health enrollment and an unpaid caregiver, neither of which is provided.                                          |     |     |
| wa-respite-care — Respite care programs in Washington                              | WI                     | Dementia with significant care needs makes respite worth investigating if an unpaid caregiver is involved.                               |     |     |


