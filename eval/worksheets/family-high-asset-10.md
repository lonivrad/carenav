# Worksheet A — high-asset-10

Bucket: **high_asset**

## Family attributes


| Attribute                     | Answer                  |
| ----------------------------- | ----------------------- |
| Age of person needing care    | 69                      |
| Washington county             | Grant                   |
| Living situation              | family_home             |
| Daily activities needing help | bathing, eating         |
| Diagnosis                     | none                    |
| Veteran                       | yes                     |
| Service era                   | vietnam                 |
| Discharge type                | honorable               |
| Marital status                | divorced                |
| Monthly income bracket        | 3000_to_3999            |
| Countable assets bracket      | 85000_to_160000         |
| Home ownership                | owns                    |
| Current coverage              | medicare, ltc_insurance |
| Moved to WA in past 5 years   | no                      |
| WA Cares participation        | not_contributing        |
| Family note (free text)       | —                       |




## Program judgments

Read the 12 corpus docs in `src/data/corpus/` against the attributes above. For each program write exactly one label in the Label column:

- `WI` — worth-investigating
- `NWI` — not-worth-investigating
- `UNK` — unknown-need-more-info (the docs plus these attributes do not settle it)


| Program                                                                            | Label (WI / NWI / UNK) | Why (one line)                                                                                                  |
| ---------------------------------------------------------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------- |
| wa-medicaid-copes — Medicaid COPES waiver (Community Options Program Entry System) | UNK                    | Functional need is present, but Medicaid financial eligibility cannot be determined.                            |
| wa-medicaid-cfc — Medicaid Community First Choice (CFC)                            | UNK                    | Community resident with care needs, but Medicaid eligibility and NFLOC are not confirmed.                       |
| wa-apple-health-ltc — Apple Health long-term care (WA institutional/LTSS Medicaid) | UNK                    | Functional need exists, but Medicaid financial eligibility cannot be determined.                                |
| wa-cares-fund — WA Cares Fund (Washington long-term care insurance)                | NWI                    | Not contributing to WA Cares, so contribution requirements are not met.                                         |
| va-aid-attendance — VA Aid & Attendance (increased monthly pension)                | UNK                    | Veteran, honorable discharge, Vietnam service, age 65+, and needs help with ADLs make this worth investigating. |
| va-housebound — VA Housebound benefit (increased monthly pension)                  | UNK                    | Veteran requirements are met, but the worksheet does not establish the required housebound criterion.           |
| medicare-home-health — Medicare home health benefit                                | UNK                    | Homebound status, skilled-care need, and provider certification are not provided.                               |
| medicare-snf — Medicare skilled nursing facility (SNF) coverage                    | UNK                    | No qualifying inpatient hospital stay or physician-certified skilled-care need is provided.                     |
| wa-pace — PACE — Program of All-Inclusive Care for the Elderly (Washington)        | NWI                    | Grant County is outside Washington’s PACE service area.                                                         |
| wa-tsoa — Tailored Supports for Older Adults (TSOA)                                | UNK                    | Age and care needs fit, but caregiver and financial eligibility are not fully established.                      |
| wa-mac — Medicaid Alternative Care (MAC)                                           | NWI                    | Requires current Apple Health enrollment and an unpaid caregiver, neither of which is provided.                 |
| wa-respite-care — Respite care programs in Washington                              | WI                     | Significant care needs make respite worth investigating if an unpaid caregiver is involved.                     |


