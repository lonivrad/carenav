# Worksheet A — simple-10

Bucket: **simple**

## Family attributes


| Attribute                     | Answer                 |
| ----------------------------- | ---------------------- |
| Age of person needing care    | 81                     |
| Washington county             | Adams                  |
| Living situation              | own_home               |
| Daily activities needing help | dressing, transferring |
| Diagnosis                     | stroke                 |
| Veteran                       | no                     |
| Marital status                | married                |
| Monthly income bracket        | under_1000             |
| Countable assets bracket      | 2000_to_85000          |
| Home ownership                | owns                   |
| Current coverage              | medicare               |
| Moved to WA in past 5 years   | no                     |
| WA Cares participation        | exempt                 |
| Family note (free text)       | —                      |


## Program judgments

Read the 12 corpus docs in `src/data/corpus/` against the attributes above. For each program write exactly one label in the Label column:

- `WI` — worth-investigating
- `NWI` — not-worth-investigating
- `UNK` — unknown-need-more-info (the docs plus these attributes do not settle it)


| Program                                                                            | Label (WI / NWI / UNK) | Why (one line)                                                                                                |
| ---------------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------- |
| wa-medicaid-copes — Medicaid COPES waiver (Community Options Program Entry System) | WI                     | Age 81 with stroke and two ADLs makes COPES worth investigating.                                              |
| wa-medicaid-cfc — Medicaid Community First Choice (CFC)                            | WI                     | Lives in the community with significant functional needs; Medicaid eligibility should be evaluated.           |
| wa-apple-health-ltc — Apple Health long-term care (WA institutional/LTSS Medicaid) | WI                     | Functional impairment and low income make LTSS eligibility worth investigating.                               |
| wa-cares-fund — WA Cares Fund (Washington long-term care insurance)                | NWI                    | WA Cares participation is **exempt**, which is disqualifying.                                                 |
| va-aid-attendance — VA Aid & Attendance (increased monthly pension)                | NWI                    | Person is not a veteran.                                                                                      |
| va-housebound — VA Housebound benefit (increased monthly pension)                  | NWI                    | Person is not a veteran.                                                                                      |
| medicare-home-health — Medicare home health benefit                                | UNK                    | Homebound status, need for skilled care, and provider certification are not provided.                         |
| medicare-snf — Medicare skilled nursing facility (SNF) coverage                    | UNK                    | No qualifying 3-day inpatient hospital stay or physician-certified skilled-care need is provided.             |
| wa-pace — PACE — Program of All-Inclusive Care for the Elderly (Washington)        | NWI                    | Adams County is outside Washington’s PACE service area.                                                       |
| wa-tsoa — Tailored Supports for Older Adults (TSOA)                                | WI                     | Age 55+, lives at home, and has functional care needs, making TSOA worth investigating.                       |
| wa-mac — Medicaid Alternative Care (MAC)                                           | NWI                    | Requires current Apple Health (Medicaid) enrollment and an unpaid caregiver, neither of which is established. |
| wa-respite-care — Respite care programs in Washington                              | WI                     | Stroke-related care needs make respite worth investigating if an unpaid caregiver is involved.                |


