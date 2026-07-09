# Worksheet A — medicaid-edge-01

Bucket: **medicaid_edge**

## Family attributes


| Attribute                     | Answer           |
| ----------------------------- | ---------------- |
| Age of person needing care    | 54               |
| Washington county             | Pacific          |
| Living situation              | own_home         |
| Daily activities needing help | bathing          |
| Diagnosis                     | dementia         |
| Veteran                       | no               |
| Marital status                | married          |
| Monthly income bracket        | 3000_to_3999     |
| Countable assets bracket      | under_2000       |
| Home ownership                | rents            |
| Current coverage              | medicare         |
| Moved to WA in past 5 years   | no               |
| WA Cares participation        | not_contributing |
| Family note (free text)       | —                |


## Program judgments

Read the 12 corpus docs in `src/data/corpus/` against the attributes above. For each program write exactly one label in the Label column:

- `WI` — worth-investigating
- `NWI` — not-worth-investigating
- `UNK` — unknown-need-more-info (the docs plus these attributes do not settle it)


| Program                                                                            | Label (WI / NWI / UNK) | Why (one line)                                                                                         |
| ---------------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------ |
| wa-medicaid-copes — Medicaid COPES waiver (Community Options Program Entry System) | UNK                    | Under 65 but dementia may qualify as a disability; NFLOC and Medicaid eligibility are not established. |
| wa-medicaid-cfc — Medicaid Community First Choice (CFC)                            | UNK                    | Age 54 does not exclude CFC, but Medicaid eligibility and CARE assessment are unknown.                 |
| wa-apple-health-ltc — Apple Health long-term care (WA institutional/LTSS Medicaid) | UNK                    | Could qualify through disability, but functional and financial eligibility cannot be confirmed.        |
| wa-cares-fund — WA Cares Fund (Washington long-term care insurance)                | NWI                    | Only one ADL and not contributing to WA Cares.                                                         |
| va-aid-attendance — VA Aid & Attendance (increased monthly pension)                | NWI                    | Person is not a veteran.                                                                               |
| va-housebound — VA Housebound benefit (increased monthly pension)                  | NWI                    | Person is not a veteran.                                                                               |
| medicare-home-health — Medicare home health benefit                                | UNK                    | Homebound status, skilled-care need, and provider certification are not provided.                      |
| medicare-snf — Medicare skilled nursing facility (SNF) coverage                    | UNK                    | No qualifying inpatient hospital stay or physician-certified skilled-care need is provided.            |
| wa-pace — PACE — Program of All-Inclusive Care for the Elderly (Washington)        | NWI                    | PACE requires age **55+**; this person is 54.                                                          |
| wa-tsoa — Tailored Supports for Older Adults (TSOA)                                | NWI                    | TSOA requires age **55+**; this person is 54.                                                          |
| wa-mac — Medicaid Alternative Care (MAC)                                           | NWI                    | MAC requires the care receiver to be **55+** and already on Apple Health; neither is established.      |
| wa-respite-care — Respite care programs in Washington                              | WI                     | Dementia with an apparent unpaid caregiver makes respite worth investigating.                          |


