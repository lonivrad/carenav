# Worksheet A — veteran-05

Bucket: **veteran**

## Family attributes


| Attribute                     | Answer                          |
| ----------------------------- | ------------------------------- |
| Age of person needing care    | 85                              |
| Washington county             | Jefferson                       |
| Living situation              | own_home                        |
| Daily activities needing help | dressing, bathing, transferring |
| Diagnosis                     | heart_disease                   |
| Veteran                       | yes                             |
| Service era                   | peacetime                       |
| Discharge type                | general                         |
| Marital status                | single                          |
| Monthly income bracket        | 1000_to_2999                    |
| Countable assets bracket      | under_2000                      |
| Home ownership                | owns                            |
| Current coverage              | medicare                        |
| Moved to WA in past 5 years   | no                              |
| WA Cares participation        | not_contributing                |
| Family note (free text)       | —                               |




## Program judgments

Read the 12 corpus docs in `src/data/corpus/` against the attributes above. For each program write exactly one label in the Label column:

- `WI` — worth-investigating
- `NWI` — not-worth-investigating
- `UNK` — unknown-need-more-info (the docs plus these attributes do not settle it)


| Program                                                                            | Label (WI / NWI / UNK) | Why (one line)                                                                                     |
| ---------------------------------------------------------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------- |
| wa-medicaid-copes — Medicaid COPES waiver (Community Options Program Entry System) | WI                     | Age 85 with three ADLs and low assets makes COPES worth investigating.                             |
| wa-medicaid-cfc — Medicaid Community First Choice (CFC)                            | WI                     | Community resident with substantial care needs; Medicaid eligibility should be evaluated.          |
| wa-apple-health-ltc — Apple Health long-term care (WA institutional/LTSS Medicaid) | WI                     | Significant functional impairment makes LTSS eligibility worth investigating.                      |
| wa-cares-fund — WA Cares Fund (Washington long-term care insurance)                | NWI                    | Not contributing to WA Cares, so contribution requirements are not met.                            |
| va-aid-attendance — VA Aid & Attendance (increased monthly pension)                | NWI                    | Peacetime service does not meet the wartime service requirement for VA pension benefits.           |
| va-housebound — VA Housebound benefit (increased monthly pension)                  | NWI                    | Peacetime service does not meet the wartime service requirement for VA pension benefits.           |
| medicare-home-health — Medicare home health benefit                                | UNK                    | Homebound status, skilled-care need, and physician certification are not provided.                 |
| medicare-snf — Medicare skilled nursing facility (SNF) coverage                    | UNK                    | No qualifying 3-day inpatient hospital stay or skilled nursing need is provided.                   |
| wa-pace — PACE — Program of All-Inclusive Care for the Elderly (Washington)        | NWI                    | Jefferson County is outside Washington’s PACE service area.                                        |
| wa-tsoa — Tailored Supports for Older Adults (TSOA)                                | WI                     | Age 55+, lives at home, and has significant care needs, making TSOA worth investigating.           |
| wa-mac — Medicaid Alternative Care (MAC)                                           | NWI                    | Requires current Apple Health enrollment and an unpaid caregiver, neither of which is established. |
| wa-respite-care — Respite care programs in Washington                              | WI                     | Extensive ADL needs make respite worth investigating if an unpaid caregiver is involved.           |


