# Worksheet A — medicaid-edge-20

Bucket: **medicaid_edge**

## Family attributes


| Attribute                     | Answer                           |
| ----------------------------- | -------------------------------- |
| Age of person needing care    | 67                               |
| Washington county             | Whitman                          |
| Living situation              | family_home                      |
| Daily activities needing help | bathing, toileting, transferring |
| Diagnosis                     | parkinsons                       |
| Veteran                       | no                               |
| Marital status                | widowed                          |
| Monthly income bracket        | 3000_to_3999                     |
| Countable assets bracket      | 85000_to_160000                  |
| Home ownership                | owns                             |
| Current coverage              | medicare                         |
| Moved to WA in past 5 years   | no                               |
| WA Cares participation        | not_contributing                 |
| Family note (free text)       | —                                |




## Program judgments

Read the 12 corpus docs in `src/data/corpus/` against the attributes above. For each program write exactly one label in the Label column:

- `WI` — worth-investigating
- `NWI` — not-worth-investigating
- `UNK` — unknown-need-more-info (the docs plus these attributes do not settle it)


| Program                                                                            | Label (WI / NWI / UNK) | Why (one line)                                                                                                             |
| ---------------------------------------------------------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| wa-medicaid-copes — Medicaid COPES waiver (Community Options Program Entry System) | WI                     | Age 67 with Parkinson’s and three ADLs makes COPES worth investigating despite financial eligibility needing verification. |
| wa-medicaid-cfc — Medicaid Community First Choice (CFC)                            | WI                     | Community resident with substantial care needs; Medicaid eligibility should be evaluated.                                  |
| wa-apple-health-ltc — Apple Health long-term care (WA institutional/LTSS Medicaid) | WI                     | Significant functional impairment makes LTSS eligibility worth investigating.                                              |
| wa-cares-fund — WA Cares Fund (Washington long-term care insurance)                | NWI                    | Not contributing to WA Cares, so contribution requirements are not met.                                                    |
| va-aid-attendance — VA Aid & Attendance (increased monthly pension)                | NWI                    | Person is not a veteran.                                                                                                   |
| va-housebound — VA Housebound benefit (increased monthly pension)                  | NWI                    | Person is not a veteran.                                                                                                   |
| medicare-home-health — Medicare home health benefit                                | UNK                    | Homebound status, skilled-care need, and provider certification are not provided.                                          |
| medicare-snf — Medicare skilled nursing facility (SNF) coverage                    | UNK                    | No qualifying inpatient hospital stay or physician-certified skilled-care need is provided.                                |
| wa-pace — PACE — Program of All-Inclusive Care for the Elderly (Washington)        | NWI                    | Whitman County is outside Washington’s PACE service area.                                                                  |
| wa-tsoa — Tailored Supports for Older Adults (TSOA)                                | WI                     | Age 55+, community dwelling, and significant care needs make TSOA worth investigating.                                     |
| wa-mac — Medicaid Alternative Care (MAC)                                           | NWI                    | Requires current Apple Health enrollment and an unpaid caregiver, neither is established.                                  |
| wa-respite-care — Respite care programs in Washington                              | WI                     | Parkinson’s with substantial ADL assistance needs makes respite worth investigating if an unpaid caregiver is involved.    |


