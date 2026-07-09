# Worksheet A — ambiguous-12

Bucket: **ambiguous**

## Family attributes


| Attribute                     | Answer                        |
| ----------------------------- | ----------------------------- |
| Age of person needing care    | (declined: unknown)           |
| Washington county             | (declined: unknown)           |
| Living situation              | (declined: prefer_not_to_say) |
| Daily activities needing help | toileting, dressing, eating   |
| Diagnosis                     | heart_disease                 |
| Veteran                       | no                            |
| Marital status                | (declined: unknown)           |
| Monthly income bracket        | (declined: prefer_not_to_say) |
| Countable assets bracket      | under_2000                    |
| Home ownership                | (declined: unknown)           |
| Current coverage              | (declined: prefer_not_to_say) |
| Moved to WA in past 5 years   | no                            |
| WA Cares participation        | (declined: prefer_not_to_say) |
| Family note (free text)       | —                             |




## Program judgments

Read the 12 corpus docs in `src/data/corpus/` against the attributes above. For each program write exactly one label in the Label column:

- `WI` — worth-investigating
- `NWI` — not-worth-investigating
- `UNK` — unknown-need-more-info (the docs plus these attributes do not settle it)


| Program                                                                            | Label (WI / NWI / UNK) | Why (one line)                                                                                           |
| ---------------------------------------------------------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------- |
| wa-medicaid-copes — Medicaid COPES waiver (Community Options Program Entry System) | UNK                    | Three ADLs suggest need, but age and NFLOC/financial eligibility are not fully established.              |
| wa-medicaid-cfc — Medicaid Community First Choice (CFC)                            | UNK                    | Functional need is present, but Medicaid eligibility and CARE assessment are unknown.                    |
| wa-apple-health-ltc — Apple Health long-term care (WA institutional/LTSS Medicaid) | UNK                    | LTSS eligibility depends on age/institutional status and functional determination, which are incomplete. |
| wa-cares-fund — WA Cares Fund (Washington long-term care insurance)                | UNK                    | Meets the 3-ADL trigger, but contribution/exemption history is unknown.                                  |
| va-aid-attendance — VA Aid & Attendance (increased monthly pension)                | NWI                    | Person is not a veteran.                                                                                 |
| va-housebound — VA Housebound benefit (increased monthly pension)                  | NWI                    | Person is not a veteran.                                                                                 |
| medicare-home-health — Medicare home health benefit                                | UNK                    | Homebound status, skilled-care need, and provider certification are unknown.                             |
| medicare-snf — Medicare skilled nursing facility (SNF) coverage                    | UNK                    | No evidence of a qualifying inpatient hospital stay or skilled-care need.                                |
| wa-pace — PACE — Program of All-Inclusive Care for the Elderly (Washington)        | UNK                    | Age, county, and nursing-facility level of care cannot be confirmed.                                     |
| wa-tsoa — Tailored Supports for Older Adults (TSOA)                                | UNK                    | Age, living situation, caregiver status, and financial eligibility are unknown.                          |
| wa-mac — Medicaid Alternative Care (MAC)                                           | UNK                    | Apple Health enrollment, living situation, unpaid caregiver, and NFLOC are unknown.                      |
| wa-respite-care — Respite care programs in Washington                              | UNK                    | Care needs are evident, but caregiver information is missing.                                            |


