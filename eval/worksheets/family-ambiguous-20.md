# Worksheet A — ambiguous-20

Bucket: **ambiguous**

## Family attributes


| Attribute                     | Answer                        |
| ----------------------------- | ----------------------------- |
| Age of person needing care    | 91                            |
| Washington county             | (declined: unknown)           |
| Living situation              | own_home                      |
| Daily activities needing help | dressing, mobility, eating    |
| Diagnosis                     | heart_disease                 |
| Veteran                       | no                            |
| Marital status                | (declined: prefer_not_to_say) |
| Monthly income bracket        | under_1000                    |
| Countable assets bracket      | 2000_to_85000                 |
| Home ownership                | (declined: unknown)           |
| Current coverage              | (declined: prefer_not_to_say) |
| Moved to WA in past 5 years   | no                            |
| WA Cares participation        | not_contributing              |
| Family note (free text)       | —                             |




## Program judgments

Read the 12 corpus docs in `src/data/corpus/` against the attributes above. For each program write exactly one label in the Label column:

- `WI` — worth-investigating
- `NWI` — not-worth-investigating
- `UNK` — unknown-need-more-info (the docs plus these attributes do not settle it)


| Program                                                                            | Label (WI / NWI / UNK) | Why (one line)                                                                                          |
| ---------------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------- |
| wa-medicaid-copes — Medicaid COPES waiver (Community Options Program Entry System) | WI                     | Age 65+, lives at home, 3 ADLs, and low income make COPES worth investigating.                          |
| wa-medicaid-cfc — Medicaid Community First Choice (CFC)                            | WI                     | Lives in the community with substantial ADL needs; Medicaid eligibility should be evaluated.            |
| wa-apple-health-ltc — Apple Health long-term care (WA institutional/LTSS Medicaid) | WI                     | Appears to meet age and likely functional criteria for LTSS; financial eligibility should be evaluated. |
| wa-cares-fund — WA Cares Fund (Washington long-term care insurance)                | NWI                    | Not contributing to WA Cares, so contribution requirements are not met.                                 |
| va-aid-attendance — VA Aid & Attendance (increased monthly pension)                | NWI                    | Person is not a veteran.                                                                                |
| va-housebound — VA Housebound benefit (increased monthly pension)                  | NWI                    | Person is not a veteran.                                                                                |
| medicare-home-health — Medicare home health benefit                                | UNK                    | Homebound status, skilled-care need, and provider certification are not provided.                       |
| medicare-snf — Medicare skilled nursing facility (SNF) coverage                    | UNK                    | No qualifying inpatient hospital stay or physician-certified skilled-care need is provided.             |
| wa-pace — PACE — Program of All-Inclusive Care for the Elderly (Washington)        | UNK                    | Meets age and likely care needs, but county/service area is unknown.                                    |
| wa-tsoa — Tailored Supports for Older Adults (TSOA)                                | WI                     | Age 55+, lives at home, and has significant care needs, making TSOA worth investigating.                |
| wa-mac — Medicaid Alternative Care (MAC)                                           | NWI                    | Current Apple Health enrollment and unpaid caregiver are not established.                               |
| wa-respite-care — Respite care programs in Washington                              | WI                     | Significant care needs suggest respite is worth investigating if an unpaid caregiver is involved.       |


