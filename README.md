# CareNav

An educational screening tool that helps Washington families identify which
long-term care funding programs may be worth exploring with a professional.

CareNav does **not** determine eligibility, provide legal or financial
advice, or estimate benefit amounts. Every report carries that disclaimer,
and the system is built so it structurally cannot overstate: eligibility
logic is deterministic and auditable, every factual claim cites a curated
source passage, and missing answers surface as explicit unknowns rather
than guesses.

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

## Quickstart

```bash
npm install
cp .env.example .env.local    # fill in ANTHROPIC_API_KEY and VOYAGE_API_KEY
npm run dev                   # http://localhost:3000 — start at /intake
```

Heads-up: generating a report calls paid APIs and currently takes 1–2
minutes (~$0.17 per report at list prices).

Other commands:

```bash
npm test              # unit + boundary tests (colocated *.test.ts)
npm run ingest        # rebuild the RAG index from src/data/corpus/
npm run eval          # 100-case evaluation harness — paid APIs, ~$17 and
                      # ~25–30 min per full run (use -- --limit N to sample)
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
