# Worksheet A — ambiguous-03

Bucket: **ambiguous**

## Family attributes


| Attribute                     | Answer             |
| ----------------------------- | ------------------ |
| Age of person needing care    | 87                 |
| Washington county             | Clallam            |
| Living situation              | nursing_facility   |
| Daily activities needing help | none of the listed |
| Diagnosis                     | dementia           |
| Veteran                       | no                 |
| Marital status                | single             |
| Monthly income bracket        | under_1000         |
| Countable assets bracket      | under_2000         |
| Home ownership                | owns               |
| Current coverage              | medicare           |
| Moved to WA in past 5 years   | no                 |
| WA Cares participation        | not_contributing   |
| Family note (free text)       | —                  |


## Program judgments

Read the 12 corpus docs in `src/data/corpus/` against the attributes above. For each program write exactly one label in the Label column:

- `WI` — worth-investigating
- `NWI` — not-worth-investigating
- `UNK` — unknown-need-more-info (the docs plus these attributes do not settle it)


| Program                                                                            | Label (WI / NWI / UNK) | Why (one line)                                                                                                  |
| ---------------------------------------------------------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------- |
| wa-medicaid-copes — Medicaid COPES waiver (Community Options Program Entry System) | WI                     | Age 65+, low income/assets, dementia, and nursing-facility residence make LTSS eligibility worth investigating. |
| wa-medicaid-cfc — Medicaid Community First Choice (CFC)                            | NWI                    | CFC is for people living in the community, not residents of a nursing facility.                                 |
| wa-apple-health-ltc — Apple Health long-term care (WA institutional/LTSS Medicaid) | WI                     | Appears to meet age, financial, and institutional long-term care criteria; confirm functional eligibility.      |
| wa-cares-fund — WA Cares Fund (Washington long-term care insurance)                | NWI                    | Not contributing to WA Cares, so does not meet contribution requirements.                                       |
| va-aid-attendance — VA Aid & Attendance (increased monthly pension)                | NWI                    | Person is not a veteran.                                                                                        |
| va-housebound — VA Housebound benefit (increased monthly pension)                  | NWI                    | Person is not a veteran.                                                                                        |
| medicare-home-health — Medicare home health benefit                                | NWI                    | Home health benefit is for care delivered at home, not while residing in a nursing facility.                    |
| medicare-snf — Medicare skilled nursing facility (SNF) coverage                    | UNK                    | No information about a qualifying 3-day inpatient hospital stay or skilled-care need.                           |
| wa-pace — PACE — Program of All-Inclusive Care for the Elderly (Washington)        | NWI                    | Clallam County is outside Washington’s PACE service area.                                                       |
| wa-tsoa — Tailored Supports for Older Adults (TSOA)                                | NWI                    | TSOA is for people living at home; this person lives in a nursing facility.                                     |
| wa-mac — Medicaid Alternative Care (MAC)                                           | NWI                    | MAC requires the person to live in their own or another person’s home, not a licensed facility.                 |
| wa-respite-care — Respite care programs in Washington                              | UNK                    | No information about an unpaid family caregiver or caregiver circumstances.                                     |


