# Worksheet A — ambiguous-04

Bucket: **ambiguous**

## Family attributes


| Attribute                     | Answer                                                              |
| ----------------------------- | ------------------------------------------------------------------- |
| Age of person needing care    | 70                                                                  |
| Washington county             | Douglas                                                             |
| Living situation              | own_home                                                            |
| Daily activities needing help | dressing                                                            |
| Diagnosis                     | none                                                                |
| Veteran                       | no                                                                  |
| Marital status                | single                                                              |
| Monthly income bracket        | under_1000                                                          |
| Countable assets bracket      | 2000_to_85000                                                       |
| Home ownership                | rents                                                               |
| Current coverage              | medicare                                                            |
| Moved to WA in past 5 years   | yes                                                                 |
| WA Cares participation        | exempt                                                              |
| Family note (free text)       | We just moved from Boise, Idaho last month. Previous ZIP was 83702. |




## Program judgments

Read the 12 corpus docs in `src/data/corpus/` against the attributes above. For each program write exactly one label in the Label column:

- `WI` — worth-investigating
- `NWI` — not-worth-investigating
- `UNK` — unknown-need-more-info (the docs plus these attributes do not settle it)


| Program                                                                            | Label (WI / NWI / UNK) | Why (one line)                                                                                 |
| ---------------------------------------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------- |
| wa-medicaid-copes — Medicaid COPES waiver (Community Options Program Entry System) | UNK                    | Age and finances fit, but NFLOC cannot be determined from one ADL alone.                       |
| wa-medicaid-cfc — Medicaid Community First Choice (CFC)                            | UNK                    | Community resident, but Medicaid/NFLOC eligibility cannot be confirmed.                        |
| wa-apple-health-ltc — Apple Health long-term care (WA institutional/LTSS Medicaid) | UNK                    | Functional eligibility (NFLOC/institutional status) cannot be determined.                      |
| wa-cares-fund — WA Cares Fund (Washington long-term care insurance)                | NWI                    | WA Cares participation is **exempt**, so they cannot qualify.                                  |
| va-aid-attendance — VA Aid & Attendance (increased monthly pension)                | NWI                    | Person is not a veteran.                                                                       |
| va-housebound — VA Housebound benefit (increased monthly pension)                  | NWI                    | Person is not a veteran.                                                                       |
| medicare-home-health — Medicare home health benefit                                | UNK                    | Homebound status, skilled-care need, and provider certification are unknown.                   |
| medicare-snf — Medicare skilled nursing facility (SNF) coverage                    | UNK                    | No information about a qualifying inpatient hospital stay or skilled-care need.                |
| wa-pace — PACE — Program of All-Inclusive Care for the Elderly (Washington)        | NWI                    | Douglas County is outside Washington’s PACE service area.                                      |
| wa-tsoa — Tailored Supports for Older Adults (TSOA)                                | UNK                    | Age requirement is met, but eligibility depends on functional/caregiver criteria not provided. |
| wa-mac — Medicaid Alternative Care (MAC)                                           | NWI                    | No Apple Health enrollment or unpaid caregiver information; current coverage is Medicare only. |
| wa-respite-care — Respite care programs in Washington                              | UNK                    | No information about an unpaid caregiver or caregiver burden.                                  |


