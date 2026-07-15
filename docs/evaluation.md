# Evaluation

CareNav is evaluated in two deliberately different ways: an automated
harness that measures whether the pipeline **faithfully preserves** its own
deterministic decisions end-to-end, and an independent blind-labeling pass
that measures whether those decisions are **actually right**. Conflating
the two is the classic failure of self-referential evals, so this document
keeps them separate throughout.

Artifacts: test set and harness in `eval/` (`npm run eval`); raw records in
`eval/results/run-latest.json`; automated results in
`eval/results/results.md`; independent labeling in
`eval/worksheets/` and `eval/results/independent-labeling-report.md`;
human quality rubric in `eval/rubric.md`.

## Methodology

1. **Synthetic test set** (`eval/testset/generate.ts`): 100 families across
   five buckets — simple, veteran, Medicaid-edge (bracket boundaries,
   spousal rules), high-asset, ambiguous/incomplete — produced from a
   seeded PRNG for reproducibility. 31 cases carry adversarial traits:
   missing income, conflicting answers, out-of-state ZIP in free text,
   recent relocation, an eligibility-guarantee request ("my mom definitely
   qualifies right?"), and a prompt-injection string in the free-text field.
2. **Rules-derived ground truth**: each case's expected program set,
   unknowns, and follow-up behavior derive from the rules engine itself.
   This makes the program-selection metrics **fidelity metrics** (see
   caveat below), while citation validity, refusal, unknown surfacing,
   hallucination, latency, and cost are measured against artifacts
   independent of the rules.
3. **Baseline comparison**: the same cases run through a deliberately
   primitive keyword search over the same corpus (`/api/baseline`) — every
   matching program, unranked, no citations, no unknown handling.
4. **Independent labeling pass (Phase 7.5)**: a stratified 26-family subset
   was labeled blind by a human rater reading only the corpus documents —
   the labeling path never imported or read the rules engine — plus 12
   retrieval queries labeled relevant/not-relevant across all 40 chunks.
   Labels locked before any comparison.
5. **Reconciliation pass**: every system-vs-manual disagreement was
   adjudicated against direct corpus quotes, deciding in each case whether
   the rules, the manual label, or both were wrong — then the fixes were
   implemented and re-verified.

## Automated harness results (100 cases)

From `eval/results/results.md`, low-effort re-baseline of 2026-07-10
(explanation effort `low`, retrieval top-k 5, migrated array-diagnosis
fixture, corrected refusal metric). The prior default-effort baseline
(2026-07-09) recorded mean latency 86.7s, mean output 8,527 tokens, and
$0.173/report ($17.31 total); setting effort to `low` roughly halved output
(mean 3,828 tokens) and latency at unchanged program-level fidelity, for
$0.107/report ($10.65 total).

| Metric | Baseline (keyword) | System (full pipeline) |
|---|---|---|
| Program precision | 60.1% | 100.0% |
| Program recall | 99.3% | 100.0% |
| Top-5 recall | 50.6% | 100.0% |
| Citation validity | n/a | 100.0% (1,456 checked) |
| Unknown detection | n/a | 100.0% |
| Refusal correctness | n/a | 100.0% |
| Follow-up compliance | n/a | 100.0% |
| Hallucinated-program rate | n/a | 0.0% (target 0%) |
| Mean latency | 2ms | 39.4s (target <10s — missed) |
| p95 latency | — | 51.7s |
| Mean cost / report | $0 | $0.107 |
| Pipeline failures | — | 0/100 |

**What the 100% figures do and do not mean.** Program precision/recall/
top-5 are computed against ground truth derived from the same rules engine
the pipeline uses, so 100% means the pipeline preserves and surfaces the
rules' decisions end-to-end — nothing dropped, added, or misordered. It
does **not** mean the decisions are correct; that question belongs to
Phase 7.5 below, which found real errors behind the perfect fidelity
numbers. The other 100%s are meaningful but narrow: citation validity
means every cited chunk exists and belongs to the cited program (not that
the prose perfectly paraphrases it — that is what the human rubric
samples); refusal correctness means no assertive eligibility-guarantee
language appeared (measured with negation-aware matching, since correct
refusals quote the banned phrases); unknown detection means rules-known
unknowns surfaced in the report. The adversarial injection case produced a
normal report: disclaimer intact, no fabricated citation, no
all-high relevance labels.

## Independent labeling (Phase 7.5)

26 families (5–6 per bucket) and 12 retrieval queries, labeled blind from
the corpus alone. Headline numbers at the time of the pass:

- **Exact program-set match**: strict (system = manual worth-investigating
  set) 0/26; lenient (system = manual WI∪UNK) 11/26 (42.3%). The strict
  zero mostly reflects a definitional mismatch — the system includes
  unknown-status programs by design — but not entirely.
- **Program-set precision/recall (lenient)**: precision 99.6% (one
  over-inclusion in 26 families), recall 82.5% — against the Phase 7
  fidelity numbers of 100%/100%. The gap **is** the finding: the system
  almost never surfaced anything a human reader rejected, but it excluded
  programs the corpus left unsettled.
- **Unknown handling**: of 110 manual unknown-need-more-info labels, the
  system included 93 (73 with an explicit missing-info flag) and excluded 17.
- **Retrieval vs manual relevance** (12 queries, then top-k 3): precision
  100%, recall 81.5%, top-5 recall 82.1%.

### Reconciliation outcomes

Every disagreement was adjudicated against direct corpus quotes
(`eval/results/independent-labeling-report.md`):

- **25 asset-policy rows: manual labels corrected.** The corpus states flat
  resource standards ($2,000 single for Medicaid LTSS; $84,354 single for
  TSOA) with no non-spousal pathway; asset bracket plus marital status
  settle ineligibility. The rules engine was right; the blind labels were
  too generous.
- **9 rows: the rules engine was wrong — fixed.** Three predicates guessed
  where the corpus is unsettled: reported Medicaid enrollment conflicting
  with above-limit assets (enrollment implies pathways the asset bracket
  cannot see); TSOA's Medicaid bar (the intake checkbox cannot distinguish
  barred CN/ABP coverage from MN/MSP coverage that "may still qualify");
  and a zero-ADL nursing-facility resident (residence leaves the
  daily-nursing-care criterion unresolved). All three now return `unknown`
  instead of `fail`, with boundary and regression tests, and a fresh
  100-case run confirmed all predicted changes and no regressions.
- **20 rows: reporting gap — fixed.** Programs whose rules pass on proxies
  (Medicare home health, VA Aid & Attendance, VA Housebound) surfaced no
  "information still needed" for the facts the intake never collects
  (homebound certification, skilled-care need, clinical examination,
  substantial confinement). Fixed with reporting-only `alwaysNeeded`
  metadata plus a deterministic backstop that unions rules-known missing
  facts into every report entry — classification, confidence, and ranking
  provably unchanged.
- **Retrieval: top-k raised 3 → 5.** Seven of eleven retrieval
  disagreements were pure truncation: programs split into 4–5 chunks, and
  raters had marked 40/40 target-program chunks relevant, so the top-3 cut
  cost recall while protecting nothing. With k=5 (whole program docs,
  scoping preserved), recall against the locked labels moves 81.5% → 94.4%
  and top-5 recall to 95.0%, precision unchanged at 100%; measured prompt
  growth ≈ +1.8k input tokens per report, latency change within run noise.
- **Remaining tradeoff (accepted): cross-program scoping.** The other four
  retrieval rows are one query where a rater judged Apple Health LTC
  chunks relevant to a *MAC* query — reasonable, since MAC requires Apple
  Health enrollment. Program-scoped retrieval structurally cannot return
  them, and unscoping would break the citation-ownership invariant that
  every cited chunk belongs to the program it appears under. Accepted as a
  design cost, mitigated in practice because the coupled program is
  usually a sibling candidate in the same report with its own cited entry.

## Latency (honest status)

Mean 39.4s per report, p50 39.6s, p95 51.7s, worst case 56.5s, against a
documented target of <10s — still missed, though the gap narrowed
substantially after adopting reasoning-effort `low`. Instrumentation shows
~95% of it is one monolithic model call producing a fully-cited multi-
program report (retrieval, embedding, and assembly total ~3s). The <10s
target is unreachable under this architecture regardless of tuning.
Sequence: (1) the reasoning-effort experiment shipped — `low` is now the
default, cutting mean latency from 86.7s and p95 from 137.6s to the figures
above at no measured quality loss; (2) per-program parallel explanation plus a
short summary call was built and measured (2026-07-15), then reverted — on a
10-case like-for-like it cut mean latency 45.3s→34.1s (25%) but raised cost
$0.111→$0.191 (+72%), and prompt caching could not offset it (the shared
system+profile prefix is ~890 tokens, below Sonnet's 1024-token cache floor,
and most of the added cost is output growth caching cannot touch); (3)
re-baseline the documented
target on evidence (p95 now ~52s) with streaming/progress UI. The intake UI
sets expectations and the API route allows 120s — the worst observed case
(56.5s) now sits comfortably within it (the prior default-effort run had a
287s outlier).

## Explanation quality rubric

`eval/rubric.md` defines five 1–5 criteria (grounding, clarity, appropriate
hedging, actionability, unknown handling) scored on a 15-case stratified
sample listed at the bottom of `results.md`.

Recorded scores live in `eval/results/rubric-scores.md` and are
**model-generated (LLM-as-judge), not human-verified** — an automated interim
signal, not a human quality judgment. They are produced by `eval/rubric-judge.ts`
(`npm run eval:rubric`), which sends each sampled report to a judge model with
the rubric's criteria and anchors and records the returned 1–5 scores; the judge
prompt and schema live in that script, so the pass is reproducible and auditable
like the rest of the eval. Because the judge (`claude-sonnet-5`) shares the
explanation model's family, the scores may carry self-preference and should be
read as directional.

**Human scoring against this rubric remains the intended gold standard and the
next step** — the automated pass does not replace it, only fills the gap until a
human rater scores the sample.
