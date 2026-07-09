# Worksheet A — veteran-04

Bucket: **veteran**

## Family attributes


| Attribute                     | Answer                      |
| ----------------------------- | --------------------------- |
| Age of person needing care    | 80                          |
| Washington county             | Lincoln                     |
| Living situation              | own_home                    |
| Daily activities needing help | dressing, mobility          |
| Diagnosis                     | heart_disease               |
| Veteran                       | yes                         |
| Service era                   | gulf_war_or_later           |
| Discharge type                | bad_conduct_or_dishonorable |
| Marital status                | married                     |
| Monthly income bracket        | under_1000                  |
| Countable assets bracket      | 2000_to_85000               |
| Home ownership                | owns                        |
| Current coverage              | medicare                    |
| Moved to WA in past 5 years   | no                          |
| WA Cares participation        | exempt                      |
| Family note (free text)       | —                           |




## Program judgments

Read the 12 corpus docs in `src/data/corpus/` against the attributes above. For each program write exactly one label in the Label column:

- `WI` — worth-investigating
- `NWI` — not-worth-investigating
- `UNK` — unknown-need-more-info (the docs plus these attributes do not settle it)


| Program                                                                            | Label (WI / NWI / UNK) | Why (one line)                                                                                     |
| ---------------------------------------------------------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------- |
| wa-medicaid-copes — Medicaid COPES waiver (Community Options Program Entry System) | WI                     | Age 80 with dressing assistance and low income makes COPES worth investigating.                    |
| wa-medicaid-cfc — Medicaid Community First Choice (CFC)                            | WI                     | Community resident with functional needs; Medicaid eligibility should be evaluated.                |
| wa-apple-health-ltc — Apple Health long-term care (WA institutional/LTSS Medicaid) | WI                     | Functional impairment and low income make LTSS eligibility worth investigating.                    |
| wa-cares-fund — WA Cares Fund (Washington long-term care insurance)                | NWI                    | WA Cares participation is **exempt**, which is disqualifying.                                      |
| va-aid-attendance — VA Aid & Attendance (increased monthly pension)                | NWI                    | Bad conduct/dishonorable discharge does not meet the VA discharge requirement.                     |
| va-housebound — VA Housebound benefit (increased monthly pension)                  | NWI                    | Bad conduct/dishonorable discharge does not meet the VA discharge requirement.                     |
| medicare-home-health — Medicare home health benefit                                | UNK                    | Homebound status, skilled-care need, and physician certification are not provided.                 |
| medicare-snf — Medicare skilled nursing facility (SNF) coverage                    | UNK                    | No qualifying 3-day inpatient hospital stay or skilled nursing need is provided.                   |
| wa-pace — PACE — Program of All-Inclusive Care for the Elderly (Washington)        | NWI                    | Lincoln County is outside Washington’s PACE service area.                                          |
| wa-tsoa — Tailored Supports for Older Adults (TSOA)                                | WI                     | Age 55+, lives at home, and has functional needs, making TSOA worth investigating.                 |
| wa-mac — Medicaid Alternative Care (MAC)                                           | NWI                    | Requires current Apple Health enrollment and an unpaid caregiver, neither of which is established. |
| wa-respite-care — Respite care programs in Washington                              | WI                     | Functional impairment makes respite worth investigating if an unpaid caregiver is involved.        |


