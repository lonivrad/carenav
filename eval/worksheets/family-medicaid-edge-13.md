# Worksheet A — medicaid-edge-13

Bucket: **medicaid_edge**

## Family attributes


| Attribute                     | Answer             |
| ----------------------------- | ------------------ |
| Age of person needing care    | 64                 |
| Washington county             | Skagit             |
| Living situation              | family_home        |
| Daily activities needing help | bathing, dressing  |
| Diagnosis                     | heart_disease      |
| Veteran                       | no                 |
| Marital status                | married            |
| Monthly income bracket        | 1000_to_2999       |
| Countable assets bracket      | under_2000         |
| Home ownership                | rents              |
| Current coverage              | medicare, medicaid |
| Moved to WA in past 5 years   | no                 |
| WA Cares participation        | not_contributing   |
| Family note (free text)       | —                  |




## Program judgments

Read the 12 corpus docs in `src/data/corpus/` against the attributes above. For each program write exactly one label in the Label column:

- `WI` — worth-investigating
- `NWI` — not-worth-investigating
- `UNK` — unknown-need-more-info (the docs plus these attributes do not settle it)


| Program                                                                            | Label (WI / NWI / UNK) | Why (one line)                                                                                       |
| ---------------------------------------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------- |
| wa-medicaid-copes — Medicaid COPES waiver (Community Options Program Entry System) | WI                     | Current Medicaid plus community care needs make COPES worth investigating.                           |
| wa-medicaid-cfc — Medicaid Community First Choice (CFC)                            | WI                     | Already on Medicaid and needs help with ADLs while living in the community.                          |
| wa-apple-health-ltc — Apple Health long-term care (WA institutional/LTSS Medicaid) | WI                     | Medicaid and functional care needs make LTSS eligibility worth investigating.                        |
| wa-cares-fund — WA Cares Fund (Washington long-term care insurance)                | NWI                    | Not contributing to WA Cares and does not meet the contribution requirement.                         |
| va-aid-attendance — VA Aid & Attendance (increased monthly pension)                | NWI                    | Person is not a veteran.                                                                             |
| va-housebound — VA Housebound benefit (increased monthly pension)                  | NWI                    | Person is not a veteran.                                                                             |
| medicare-home-health — Medicare home health benefit                                | UNK                    | Homebound status, skilled-care need, and provider certification are not provided.                    |
| medicare-snf — Medicare skilled nursing facility (SNF) coverage                    | UNK                    | No qualifying inpatient hospital stay or physician-certified skilled-care need is provided.          |
| wa-pace — PACE — Program of All-Inclusive Care for the Elderly (Washington)        | NWI                    | Skagit County is outside Washington’s PACE service area.                                             |
| wa-tsoa — Tailored Supports for Older Adults (TSOA)                                | WI                     | Age 55+, community dwelling, and functional needs make TSOA worth investigating.                     |
| wa-mac — Medicaid Alternative Care (MAC)                                           | WI                     | Already has Medicaid, is over 55, and lives at home; verify NFLOC and unpaid caregiver requirements. |
| wa-respite-care — Respite care programs in Washington                              | WI                     | Ongoing ADL assistance suggests respite is worth investigating if an unpaid caregiver is involved.   |


