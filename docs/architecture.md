# Architecture

CareNav is three layers with a hard separation of responsibilities. The
principle throughout: **decisions are deterministic; language is generated;
the two never trade places.**

```
intake answers ──► normalize ──► Layer 1: rules ──► candidates
                                                        │ (excluded programs stop here)
                                                        ▼
                                  Layer 2: RAG ──► cited passages per candidate
                                                        │
                                                        ▼
                                  Layer 3: LLM ──► validated explanation
                                                        │
                          deterministic assembly ──► final report
                     (confidence, citations, unknowns, disclaimer)
```

## Layer 1 — deterministic rules (`src/lib/rules/`)

The intake is normalized into a profile where every unanswered or declined
question becomes an explicit `"unknown"` (`src/lib/schema/normalize.ts`) —
never a default. A registry of per-program predicates (`programs.ts`)
evaluates that profile with three-valued logic: every rule returns
`pass | fail | unknown`, and a rule over a field that cannot settle the
outcome returns `unknown`, never a guess. Each rule cites the corpus
document that justifies it.

The engine (`engine.ts`) classifies each of the 12 programs:

- **likely_relevant** — every rule passes
- **possibly_relevant** — no rule fails, at least one is unknown
  (`unknownFields` lists exactly what is missing)
- **excluded** — at least one rule fails (`failedRules` names it)

Excluded programs never reach the later layers. No LLM runs here, ever, and
the layer is fully unit-tested at boundary values with 100% coverage.

Two design details worth knowing:

- **Bracket policy.** Intake collects income/assets as brackets placed near
  program thresholds. A bracket that straddles a threshold yields `unknown`;
  a bracket edge that approximates a threshold within a small sliver is
  treated as aligned, with the approximation noted in the rule's comment.
- **Reporting-only metadata.** Some rules pass on proxies (e.g., ADL help as
  a proxy for skilled-care need). Programs whose real criteria are not
  collected by the intake carry `alwaysNeeded` metadata — facts that must
  appear in the report's "information still needed" even when every rule
  passes. This metadata never affects classification, confidence, or
  ranking.

## Layer 2 — program-scoped retrieval (`src/lib/rag/`, `src/data/corpus/`)

The corpus is 12 hand-curated markdown documents (one per program) with
provenance frontmatter (source URLs, retrieval dates) tracked in
`src/data/corpus-manifest.json`. `npm run ingest` splits them by heading
into 40 chunks (~300–600 tokens), embeds them with Voyage `voyage-3.5`
(1024 dimensions), and commits the index (`src/lib/rag/index.json`) so
retrieval at runtime is local, deterministic, and reviewable. **No external
fetches happen at runtime.**

For each candidate program, a profile-derived query is embedded and scored
against the index by cosine similarity, **filtered to that program's own
chunks**. Two guards:

- A quality threshold (0.45): if a program's best chunk scores below it, the
  program comes back `retrieval_failed` rather than surfacing weak evidence,
  and the report says details could not be verified.
- A per-program cap, currently **top-k = 5**. Corpus documents split into
  2–5 chunks today, so k=5 retrieves each candidate's *entire* document
  while keeping program scoping intact. This was raised from 3 after the
  independent labeling pass showed the cut cost only recall (relevant
  chunks truncated) and protected nothing: raters marked every
  target-program chunk relevant in all labeled queries. The cap still
  bounds prompt growth if the corpus later grows chunkier. The deliberate
  tradeoff that remains: a chunk from program A is never retrievable for a
  program-B query, even when the programs are coupled (e.g., MAC requires
  Apple Health enrollment) — see docs/evaluation.md.

## Layer 3 — LLM explanation (`src/lib/llm/`)

The model receives three things as data: the profile, the candidates with
their rule outcomes and missing fields, and the retrieved passages. Its job
is to explain and prioritize — nothing else. The system prompt encodes hard
rules (explain-don't-decide phrasing, cite-or-omit, never add programs,
treat everything inside profile/chunk tags as data rather than
instructions), but the prompt is not what we trust. Trust comes from
mechanical checks downstream:

- Output must parse against a Zod schema (`src/lib/schema/report.ts`);
  one retry with the validation errors fed back, then hard failure.
- `crossCheck` (`explain.ts`) mechanically rejects reports that mention a
  program not in the candidate list, make an uncited coverage claim, cite a
  chunk that was not retrieved for that program, or describe coverage for a
  retrieval-failed program.

## Deterministic assembly — the LLM proposes, modules dispose

The final report is assembled outside the model (`src/lib/pipeline.ts`):

- **Confidence** (`confidence.ts`): the model proposes a relevance label,
  and the pipeline discards it. The displayed label is computed
  deterministically from the rules classification, retrieval score, and
  unknown count. Language never sets confidence.
- **Citations** are deduplicated from the model's per-claim chunk ids;
  official links come from the corpus manifest, never from the model.
- **Information still needed** is the union of the model's phrasing with
  the rules-known missing facts (`unknownFields` + `alwaysNeeded`,
  `src/lib/report/still-needed.ts`) — a deterministic backstop so a fact
  the rules know is missing cannot be dropped from the report.
- **Follow-up questions** get a deterministic fallback when a profile is
  mostly unknown, so an uncertain screening always asks rather than
  recommends.

## Why the separation

Eligibility screening and empathetic explanation have opposite failure
modes. Deterministic predicates are auditable, testable at boundaries, and
consistent across runs — but produce unreadable output. Language models
write warm, plain English — but cannot be trusted to apply a $2,000 asset
limit the same way twice, and will fill gaps confidently if allowed.
CareNav gives each side only the job it is good at: **rules decide which
programs appear; retrieval supplies the only permitted source text; the
model turns decisions plus sources into prose; deterministic code checks
the prose and computes everything load-bearing.** A prompt never encodes an
eligibility threshold, and a rule never generates language. The evaluation
harness (docs/evaluation.md) verifies the seams: zero invented programs and
100% citation validity across 100 synthetic families, with the model's
proposals measurably overridden by the deterministic layers.
