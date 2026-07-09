# Worksheet A — high-asset-01

Bucket: **high_asset**

## Family attributes


| Attribute                     | Answer                        |
| ----------------------------- | ----------------------------- |
| Age of person needing care    | 90                            |
| Washington county             | Jefferson                     |
| Living situation              | own_home                      |
| Daily activities needing help | dressing, mobility, toileting |
| Diagnosis                     | stroke                        |
| Veteran                       | no                            |
| Marital status                | single                        |
| Monthly income bracket        | 4000_or_more                  |
| Countable assets bracket      | 85000_to_160000               |
| Home ownership                | owns                          |
| Current coverage              | medicare                      |
| Moved to WA in past 5 years   | no                            |
| WA Cares participation        | exempt                        |
| Family note (free text)       | —                             |


## Program judgments

Read the 12 corpus docs in `src/data/corpus/` against the attributes above. For each program write exactly one label in the Label column:

- `WI` — worth-investigating
- `NWI` — not-worth-investigating
- `UNK` — unknown-need-more-info (the docs plus these attributes do not settle it)


| Program                                                                            | Label (WI / NWI / UNK) | Why (one line)                                                                                                           |
| ---------------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| wa-medicaid-copes — Medicaid COPES waiver (Community Options Program Entry System) | UNK                    | Functional need is present, but financial eligibility under Medicaid cannot be determined from the information provided. |
| wa-medicaid-cfc — Medicaid Community First Choice (CFC)                            | UNK                    | Community resident with significant ADL needs, but Medicaid eligibility is unknown.                                      |
| wa-apple-health-ltc — Apple Health long-term care (WA institutional/LTSS Medicaid) | UNK                    | LTSS functional criteria appear likely, but Medicaid financial eligibility cannot be confirmed.                          |
| wa-cares-fund — WA Cares Fund (Washington long-term care insurance)                | NWI                    | WA Cares participation is **exempt**, which is disqualifying.                                                            |
| va-aid-attendance — VA Aid & Attendance (increased monthly pension)                | NWI                    | Person is not a veteran.                                                                                                 |
| va-housebound — VA Housebound benefit (increased monthly pension)                  | NWI                    | Person is not a veteran.                                                                                                 |
| medicare-home-health — Medicare home health benefit                                | UNK                    | Homebound status, need for skilled care, and provider certification are not provided.                                    |
| medicare-snf — Medicare skilled nursing facility (SNF) coverage                    | UNK                    | No qualifying inpatient hospital stay or physician-certified skilled-care need is provided.                              |
| wa-pace — PACE — Program of All-Inclusive Care for the Elderly (Washington)        | NWI                    | Jefferson County is outside Washington’s PACE service area.                                                              |
| wa-tsoa — Tailored Supports for Older Adults (TSOA)                                | UNK                    | Age and ADL needs fit, but financial/caregiver eligibility cannot be determined.                                         |
| wa-mac — Medicaid Alternative Care (MAC)                                           | NWI                    | Requires current Apple Health enrollment and an unpaid caregiver, neither of which is provided.                          |
| wa-respite-care — Respite care programs in Washington                              | WI                     | Significant functional impairment makes respite worth investigating if an unpaid caregiver is involved.                  |


