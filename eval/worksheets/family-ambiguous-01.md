# Worksheet A — ambiguous-01

Bucket: **ambiguous**

## Family attributes


| Attribute                     | Answer                        |
| ----------------------------- | ----------------------------- |
| Age of person needing care    | (declined: unknown)           |
| Washington county             | (declined: prefer_not_to_say) |
| Living situation              | (declined: unknown)           |
| Daily activities needing help | (declined: unknown)           |
| Diagnosis                     | (declined: prefer_not_to_say) |
| Veteran                       | (declined: unknown)           |
| Marital status                | (declined: unknown)           |
| Monthly income bracket        | (declined: prefer_not_to_say) |
| Countable assets bracket      | (declined: prefer_not_to_say) |
| Home ownership                | (declined: unknown)           |
| Current coverage              | (declined: unknown)           |
| Moved to WA in past 5 years   | (declined: unknown)           |
| WA Cares participation        | (declined: unknown)           |
| Family note (free text)       | —                             |




## Program judgments

Read the 12 corpus docs in `src/data/corpus/` against the attributes above. For each program write exactly one label in the Label column:

- `WI` — worth-investigating
- `NWI` — not-worth-investigating
- `UNK` — unknown-need-more-info (the docs plus these attributes do not settle it)


| Program                                                                            | Label (WI / NWI / UNK) | Why (one line)                                                                        |
| ---------------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------- |
| wa-medicaid-copes — Medicaid COPES waiver (Community Options Program Entry System) | UNK                    | Missing age, functional status, financial eligibility, and NFLOC information.         |
| wa-medicaid-cfc — Medicaid Community First Choice (CFC)                            | UNK                    | Cannot determine Medicaid eligibility or nursing-facility level of care.              |
| wa-apple-health-ltc — Apple Health long-term care (WA institutional/LTSS Medicaid) | UNK                    | Insufficient information to determine LTSS financial and functional eligibility.      |
| wa-cares-fund — WA Cares Fund (Washington long-term care insurance)                | UNK                    | Contribution history, ADL needs, and exemption status are unknown.                    |
| va-aid-attendance — VA Aid & Attendance (increased monthly pension)                | UNK                    | Veteran status, qualifying service, discharge, and financial eligibility are unknown. |
| va-housebound — VA Housebound benefit (increased monthly pension)                  | UNK                    | Veteran status and housebound/pension eligibility are unknown.                        |
| medicare-home-health — Medicare home health benefit                                | UNK                    | Homebound status, skilled-care need, and provider certification are unknown.          |
| medicare-snf — Medicare skilled nursing facility (SNF) coverage                    | UNK                    | No information about qualifying hospital stay or skilled nursing need.                |
| wa-pace — PACE — Program of All-Inclusive Care for the Elderly (Washington)        | UNK                    | Age, county/service area, NFLOC, and financial eligibility are unknown.               |
| wa-tsoa — Tailored Supports for Older Adults (TSOA)                                | UNK                    | Age, unpaid caregiver, functional status, and financial eligibility are unknown.      |
| wa-mac — Medicaid Alternative Care (MAC)                                           | UNK                    | Apple Health enrollment, NFLOC, and unpaid caregiver information are unknown.         |
| wa-respite-care — Respite care programs in Washington                              | UNK                    | Caregiver status and program eligibility cannot be determined.                        |


