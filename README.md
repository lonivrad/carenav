# CareNav

An educational screening tool that helps Washington families identify which
long-term care funding programs may be worth exploring with a professional.

CareNav does **not** determine eligibility, provide legal or financial
advice, or estimate benefit amounts. Every report carries that disclaimer,
and the system is built so it structurally cannot overstate: eligibility
logic is deterministic and auditable, every factual claim cites a curated
source passage, and missing answers surface as explicit unknowns rather
than guesses.

## Current status

v1, measured against the latest committed evaluation baseline
(`eval/results/results.md`):

- Explanation reasoning effort: **low**
- Evaluation size: **100 synthetic cases**
- Mean latency: **39.4 s** · p95 latency: **51.7 s**
- Mean cost per report: **$0.1065** · total evaluation cost: **$10.65**
- Hallucinated-program rate: **0%**
- Citation validity: **100%**
- Refusal correctness: **100%**

## Architecture

```
Intake
  ↓
Rules engine
  ↓
Candidate programs
  ↓
Retrieval (top-k = 5)
  ↓
LLM explanation
  ↓
Cross-check + citations
  ↓
Report UI
```

## The problem

Long-term-care funding in Washington is fragmented across at least a dozen
programs — Medicaid waivers (COPES, CFC), institutional Apple Health, the
WA Cares Fund, two VA pension enhancements, two Medicare benefits, PACE,
TSOA, MAC, and respite programs — each with its own agency, eligibility
rules, income and asset standards, and application path. Families typically
discover them one at a time, mid-crisis, from pages written for caseworkers.
Caregiver accounts suggest this research can consume many hours spread over
weeks (figures like "15+ hours" circulate; treat any such number as
illustrative — we have not sourced a rigorous estimate). CareNav compresses
the *orientation* step into a structured screening: roughly 30 minutes
(illustrative) from questionnaire to a cited, prioritized shortlist a family
can take to a benefits professional.

## Workflow

```
family answers intake (~10 min, every question offers "I don't know")
      │
      ▼
deterministic rules narrow 12 programs to candidates     (src/lib/rules/)
      │        excluded programs never reappear
      ▼
program-scoped retrieval pulls passages from the         (src/lib/rag/)
curated corpus for each candidate
      │
      ▼
LLM explains and prioritizes ONLY those candidates,      (src/lib/llm/)
citing retrieved passages; output is schema-validated
and mechanically cross-checked
      │
      ▼
family reviews the report — then takes it to a benefits
professional, who makes any actual determination
```

## What it looks like

**Intake** asks one plain-language question at a time (about 10 minutes).
Answers can be a numeric age, a single choice, or a multi-select — including
multiple diagnoses. Every question can be skipped: the "I don't know" and
"Prefer not to say" actions are shown as secondary "Skip this question"
controls, and a skipped answer is recorded as an explicit unknown, never a
guess. A review step lists every answer before submitting.

![An intake question with multi-select answers and demoted skip actions](artifacts/intake-question.png)

![The review step listing every answer before submitting](artifacts/intake-review.png)

**The report** opens with the programs most worth exploring first — a ranked
index that links to each program — followed by a single "Your next step"
drawn from the highest-ranked program's own next actions. Each program is a
numbered card (matching the index) with a one-line reason it may apply, its
next steps shown inline, and collapsible sections for what it generally
covers, information still needed, and sources. Every factual claim links to a
cited source passage. A closing "What we couldn't determine" section groups
the answers left unknown, so a family can see what would sharpen the result.

![The report overview: ranked programs and a single next step](artifacts/report-overview.png)

![A program card with next steps and grouped detail sections](artifacts/report-details.png)

The layout is responsive and readable on a phone:

![The report on a mobile viewport](artifacts/report-mobile.png)

## Design principles

- Built for adult children helping aging parents, older adults, and families
  navigating stressful care and funding decisions.
- Calm, government-adjacent, operational design — deliberately not
  startup-marketing aesthetics.
- Large typography and strong contrast for legibility.
- Accessible: keyboard support with visible focus, native disclosure
  controls, no dark mode.
- Educational only — it never determines eligibility.
- Never guesses missing information; unanswered questions surface as explicit
  unknowns.

## Known limitations

- Washington State programs only.
- Educational screening only — not legal, financial, or eligibility advice.
- Program administrators (DSHS, the Health Care Authority, Medicare, the VA,
  and the local Area Agency on Aging) make the final eligibility decisions.
- Evaluation uses synthetic cases whose ground truth derives from the
  deterministic rules engine.
- Latency remains around 40 seconds per report because every claim is sourced
  from the corpus and validated before it is shown.

## Quickstart

```bash
npm install
cp .env.example .env.local    # fill in ANTHROPIC_API_KEY and VOYAGE_API_KEY
npm run dev                   # http://localhost:3000 — start at /intake
```

Heads-up: generating a report calls paid APIs and takes ~40 s (~$0.11 per
report at list prices).

Other commands:

```bash
npm test              # unit + boundary tests (colocated *.test.ts)
npm run ingest        # rebuild the RAG index from src/data/corpus/
npm run eval          # 100-case evaluation harness — paid APIs, ~$11 and
                      # ~13 min per full run (use -- --limit N to sample)
npm run eval:generate # regenerate the synthetic test set
npm run build         # production build
```

`/baseline` hosts a deliberately primitive keyword-search comparator used by
the evaluation harness.

## Documentation

- [Architecture](docs/architecture.md) — the three-layer design and why
  deterministic logic is separated from generated language.
- [Governance](docs/governance.md) — what CareNav does and does not do,
  trust boundaries, failure modes and mitigations.
- [Evaluation](docs/evaluation.md) — methodology, current results, the
  independent labeling pass, and known limitations (including latency).
