# Worksheet A — medicaid-edge-05

Bucket: **medicaid_edge**

## Family attributes


| Attribute                     | Answer                         |
| ----------------------------- | ------------------------------ |
| Age of person needing care    | 64                             |
| Washington county             | Clallam                        |
| Living situation              | own_home                       |
| Daily activities needing help | transferring, eating, dressing |
| Diagnosis                     | dementia                       |
| Veteran                       | no                             |
| Marital status                | married                        |
| Monthly income bracket        | 1000_to_2999                   |
| Countable assets bracket      | 2000_to_85000                  |
| Home ownership                | rents                          |
| Current coverage              | medicare                       |
| Moved to WA in past 5 years   | no                             |
| WA Cares participation        | exempt                         |
| Family note (free text)       | —                              |




## Program judgments

Read the 12 corpus docs in `src/data/corpus/` against the attributes above. For each program write exactly one label in the Label column:

- `WI` — worth-investigating
- `NWI` — not-worth-investigating
- `UNK` — unknown-need-more-info (the docs plus these attributes do not settle it)


| Program                                                                            | Label (WI / NWI / UNK) | Why (one line)                                                                                             |
| ---------------------------------------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------- |
| wa-medicaid-copes — Medicaid COPES waiver (Community Options Program Entry System) | WI                     | Dementia with 3 ADLs makes Medicaid LTSS eligibility worth investigating.                                  |
| wa-medicaid-cfc — Medicaid Community First Choice (CFC)                            | WI                     | Community resident with significant ADL needs; Medicaid eligibility should be evaluated.                   |
| wa-apple-health-ltc — Apple Health long-term care (WA institutional/LTSS Medicaid) | WI                     | Likely meets functional criteria; financial eligibility should be evaluated.                               |
| wa-cares-fund — WA Cares Fund (Washington long-term care insurance)                | NWI                    | WA Cares participation is **exempt**, which is disqualifying.                                              |
| va-aid-attendance — VA Aid & Attendance (increased monthly pension)                | NWI                    | Person is not a veteran.                                                                                   |
| va-housebound — VA Housebound benefit (increased monthly pension)                  | NWI                    | Person is not a veteran.                                                                                   |
| medicare-home-health — Medicare home health benefit                                | UNK                    | Homebound status, skilled-care need, and provider certification are not provided.                          |
| medicare-snf — Medicare skilled nursing facility (SNF) coverage                    | UNK                    | No qualifying inpatient hospital stay or physician-certified skilled-care need is provided.                |
| wa-pace — PACE — Program of All-Inclusive Care for the Elderly (Washington)        | NWI                    | Clallam County is outside Washington’s PACE service area.                                                  |
| wa-tsoa — Tailored Supports for Older Adults (TSOA)                                | WI                     | Age 55+, lives at home, and significant care needs make TSOA worth investigating.                          |
| wa-mac — Medicaid Alternative Care (MAC)                                           | NWI                    | Requires current Apple Health enrollment and an unpaid caregiver, neither of which is provided.            |
| wa-respite-care — Respite care programs in Washington                              | WI                     | Dementia with substantial care needs makes respite worth investigating if an unpaid caregiver is involved. |


