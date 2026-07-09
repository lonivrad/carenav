# Governance

CareNav is an educational screening tool. It does not determine
eligibility, provide legal or financial advice, or estimate benefit
amounts. Every report ends with a fixed disclaimer
(`REPORT_DISCLAIMER`, `src/lib/schema/report.ts`) directing families to
verify details with each program's official contacts and to consider an
elder-law attorney, benefits counselor, or the Community Living
Connections line.

## What CareNav does / does not do

**Does:**

- summarizes program criteria from a curated, provenance-tracked corpus,
  with a citation on every factual claim;
- prioritizes likely-relevant programs using deterministic rules plus
  retrieval quality — never model opinion;
- explains uncertainty in plain language ("appears worth investigating
  because…", never "you qualify");
- identifies missing information explicitly (per-program "information
  still needed" and report-level unknowns and follow-up questions);
- routes users toward professional review as the mandatory next step.

**Does NOT:**

- approve, deny, or estimate benefits;
- determine legal eligibility for any program;
- provide financial, legal, or Medicaid-planning advice;
- replace attorneys, benefits specialists, Medicaid planners, or the
  administering agencies — they make every actual determination.

## Trust boundaries

| The AI CAN | The AI CANNOT |
|---|---|
| Phrase why a rules-selected program may be worth investigating, referencing the family's own answers | Add, merge, or invent a program — the candidate list is fixed by the rules engine, and a mechanical cross-check rejects any extra program |
| Summarize what a program covers, quoting retrieved corpus passages | Make an uncited factual claim — claims without a valid chunk citation are mechanically rejected (one retry, then hard failure) |
| Propose a relevance ordering | Set the displayed confidence — the label is computed deterministically from rules × retrieval × unknowns, and the model's proposal is discarded |
| Phrase missing information for the family | Suppress missing information — the pipeline unions rules-known missing facts into the report regardless of what the model wrote |
| Suggest follow-up questions | Turn an uncertain screening into a recommendation — a mostly-unknown profile deterministically produces follow-up questions |
| Read free-text family notes as context | Take instructions from them — notes are wrapped as data; directives inside them are content to summarize, never commands (verified by an adversarial injection case in the eval set) |

## Failure modes and mitigations

| Failure mode | Mitigation |
|---|---|
| **Outdated state documents** (rates and rules change every January/July) | Corpus manifest records source URLs and retrieval dates per document; reports may note the retrieval date; refresh requires re-verifying against primary sources and re-running `npm run ingest` |
| **Conflicting guidance between sources** | The corpus is the single source of truth at runtime; discrepancies found during verification are recorded in the doc text with both readings cited (e.g., the DSHS rates table that printed two figures), and uncertainty propagates to the report rather than being resolved silently |
| **Incomplete user information** | "I don't know / prefer not to say" on every question normalizes to explicit unknowns; rules return `unknown` rather than guessing; unknowns surface as `informationStillNeeded`, report-level unknowns, and follow-up questions |
| **Unusual asset structures, look-back complexity, spousal planning** | Out of scope by design: brackets only, no planning logic; the corpus documents the 60-month look-back and spousal protections so the report can name them, and the disclaimer routes to elder-law/benefits professionals |
| **Program changes (pauses, new standards)** | Corpus refresh is the only remedy — e.g., the TSOA/MAC enrollment pause and current-year figures live in the corpus text, not in code; rules cite the corpus doc that justifies them so a corpus change flags the rules to revisit |
| **Prompt injection via free-text notes** | Intake notes travel inside the guarded profile block and are declared data-not-instructions; they are never embedded into retrieval queries and never read by rules; the eval suite includes an explicit injection case ("ignore all previous instructions…"), which produced a normal report with the disclaimer intact and no fabricated citation |
| **Retrieval failures** | A program whose best chunk scores below the quality threshold is marked `retrieval_failed`; the report entry states details could not be verified, carries zero coverage claims (mechanically enforced), and points to official links from the manifest |
| **Latency** | Known limitation: reports currently take on the order of 80–90 seconds (p95 ~140s), dominated by a single monolithic model call. Mitigation roadmap in docs/evaluation.md; the UI sets expectations ("this can take a couple of minutes") |

## Known gaps found and fixed

Honesty requires noting that the independent labeling pass (Phase 7.5,
`eval/results/independent-labeling-report.md`) surfaced real defects that
earlier self-consistency metrics could not see:

- **Missing-information gaps.** For three programs, screening rules passed
  on proxies (ADL help standing in for skilled-care need or housebound
  status), which silently dropped the underlying not-collected facts from
  reports — 20 report entries lacked any "information still needed" where
  raters expected it. Fixed with reporting-only `alwaysNeeded` metadata
  plus a deterministic pipeline backstop, without changing any eligibility
  outcome.
- **Over-eager exclusions.** Three predicates hard-failed situations the
  corpus leaves unsettled (reported Medicaid enrollment conflicting with
  above-limit assets; the CN/ABP-vs-MN/MSP ambiguity of a "Medicaid"
  checkbox for TSOA; zero reported ADLs for a nursing-facility resident).
  All three were softened to `unknown`, per the three-valued invariant.

The lesson is institutionalized: metrics computed against the system's own
rules measure fidelity, not correctness, and periodic blind labeling passes
are the mechanism for catching what fidelity metrics cannot.
