# Worksheet A — medicaid-edge-08

Bucket: **medicaid_edge**

## Family attributes


| Attribute                     | Answer                        |
| ----------------------------- | ----------------------------- |
| Age of person needing care    | 84                            |
| Washington county             | Skagit                        |
| Living situation              | family_home                   |
| Daily activities needing help | dressing, mobility, toileting |
| Diagnosis                     | dementia                      |
| Veteran                       | no                            |
| Marital status                | widowed                       |
| Monthly income bracket        | (declined: prefer_not_to_say) |
| Countable assets bracket      | 85000_to_160000               |
| Home ownership                | rents                         |
| Current coverage              | medicare, medicaid            |
| Moved to WA in past 5 years   | no                            |
| WA Cares participation        | exempt                        |
| Family note (free text)       | —                             |




## Program judgments

Read the 12 corpus docs in `src/data/corpus/` against the attributes above. For each program write exactly one label in the Label column:

- `WI` — worth-investigating
- `NWI` — not-worth-investigating
- `UNK` — unknown-need-more-info (the docs plus these attributes do not settle it)


| Program                                                                             | Label (WI / NWI / UNK) | Why (one line)                                                                                                          |
| ----------------------------------------------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| wa-medicaid-copes — Medicaid COPES waiver (Community Options Program En try System) | WI                     | Age 84, dementia, Medicaid coverage, and 3 ADLs make COPES worth investigating.                                         |
| wa-medicaid-cfc — Medicaid Community First Choice (CFC)                             | WI                     | Already has Medicaid and significant community-based care needs.                                                        |
| wa-apple-health-ltc — Apple Health long-term care (WA institutional/LTSS Medicaid)  | WI                     | Medicaid plus substantial functional impairment makes LTSS eligibility worth investigating.                             |
| wa-cares-fund — WA Cares Fund (Washington long-term care insurance)                 | NWI                    | WA Cares participation is **exempt**, which is disqualifying.                                                           |
| va-aid-attendance — VA Aid & Attendance (increased monthly pension)                 | NWI                    | Person is not a veteran.                                                                                                |
| va-housebound — VA Housebound benefit (increased monthly pension)                   | NWI                    | Person is not a veteran.                                                                                                |
| medicare-home-health — Medicare home health benefit                                 | UNK                    | Homebound status, skilled-care need, and provider certification are not provided.                                       |
| medicare-snf — Medicare skilled nursing facility (SNF) coverage                     | UNK                    | No qualifying inpatient hospital stay or physician-certified skilled-care need is provided.                             |
| wa-pace — PACE — Program of All-Inclusive Care for the Elderly (Washington)         | NWI                    | Skagit County is outside Washington’s PACE service area.                                                                |
| wa-tsoa — Tailored Supports for Older Adults (TSOA)                                 | WI                     | Age 55+, lives at home with significant care needs, making TSOA worth investigating.                                    |
| wa-mac — Medicaid Alternative Care (MAC)                                            | WI                     | Already has Medicaid, is 55+, lives at home, and has significant care needs; verify the remaining program requirements. |
| wa-respite-care — Respite care programs in Washington                               | WI                     | Dementia with substantial care needs makes respite worth investigating if an unpaid caregiver is involved.              |


