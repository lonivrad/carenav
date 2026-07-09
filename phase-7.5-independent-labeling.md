# Phase 7.5: Independent Ground-Truth Labeling

Run this after the Phase 7 harness completes. Fresh session. Does not modify the Phase 7 harness or rerun it.

## Purpose

Check whether CareNav's retrieval and program-selection numbers reflect correctness or only self-consistency. Produce a set of ground-truth labels derived without touching the system's own logic, compare them against what the harness produced, and report the agreement rate. A suspiciously perfect agreement is a finding to surface, not a result to celebrate.

## Independence constraints (hard rules)

These are the point of the task. Violating any one of them re-contaminates the labels.

1. Do not import, call, or read `src/lib/rules/` while producing these labels. Not for reference, not for a "sanity check."
2. Do not define a chunk as relevant because the retriever returned it. Relevance is decided by reading the chunk against the query.
3. Labels are recorded blind. The operator fills the worksheet before seeing any harness output for that family or query. The comparison happens only after labels are locked.
4. The label path may read the corpus docs in `src/data/corpus/` directly (that is the source of truth). It may not reuse the normalization, predicate, or retrieval code.

## Inputs

- The 100 families generated in Phase 7, attributes only, with their stratification bucket.
- The harness output per family: the program set it flagged as worth investigating, and per query the chunks it retrieved.
- The 12 corpus docs and their 40 chunks.

## Task A: Program-set ground truth (headline number)

1. Select a stratified subset of 25 to 30 families: 5 to 6 from each of the five buckets (simple, veteran, Medicaid edge, high-asset, ambiguous). Pull them from the already-generated families. Do not regenerate.
2. For each subset family, the operator reads the 12 program docs and marks each program as one of: `worth-investigating`, `not-worth-investigating`, or `unknown-need-more-info`. The third option matters: the system propagates unknowns, so the ground truth has to be able to say "the docs plus this family's attributes do not settle it" rather than being forced to a binary.
3. This is a manual judgment pass. A second automated derivation is acceptable only if it shares no code and no prompt with the system, and even then the manual labels are what anchor the comparison.

The tool's job here is mechanical only: generate a blind worksheet per family (attributes on top, the 12 programs as a checklist with the three-way option and a one-line "why" field), and later ingest the filled worksheets. It does not make or suggest the judgment.

## Task B: Retrieval relevance ground truth

1. Select 10 to 15 queries (drawn from the subset families' pipeline queries, spread across buckets).
2. For each query, the operator reads all 40 chunks and marks each as `relevant` or `not-relevant` to that query. Forty chunks is small enough to eyeball; most negatives are fast.
3. Store these as the relevance set for those queries.

## Agreement computation

Run only after all worksheets are locked.

Program set (per subset family, system vs manual as truth):
- Exact-set-match rate across the subset.
- Precision and recall of the system's program set against the manual set.
- A per-program confusion count: which programs the system over-includes and under-includes, and in which buckets.
- Unknown handling: how often the system marked unknown where the manual pass did, and where they diverge. Treat unknown-vs-included and unknown-vs-excluded as distinct disagreement types.

Retrieval (per labeled query):
- Recompute precision, recall, and top-5 recall against the manual relevance set.
- Put these next to the Phase 7 retriever-defined numbers. The gap between the two is the result.

## Outputs

- `eval/worksheets/` : the blind worksheets (one per subset family, plus the query relevance sheets).
- `eval/results/independent-labeling-report.md` : the agreement report. Centerpiece is a disagreement table with columns: family or query id, bucket, program or chunk, system label, manual label, and an empty reconciliation column for the operator to note which is correct and why.
- A short summary block at the top: subset size, exact-match rate, system-vs-manual P/R for both tasks, and the Phase 7 numbers alongside for contrast.

## Notes for the operator

- Fill worksheets blind. Seeing the system's answer first anchors the manual judgment and quietly destroys the independence the whole task exists to establish.
- If agreement comes out near-perfect, do not treat it as confirmation by itself. Check first that the labels were actually produced independently and blind. Near-perfect agreement from a truly blind pass is a real signal; near-perfect agreement from a leaky one is just the contamination showing up again.
- The disagreements are the useful part. Each one is either a system error worth fixing before Phase 8 writes it up, or a case where the manual label was wrong, which sharpens the corpus reading. Either way the reconciliation column is where the value lands.
- This agreement rate belongs in `docs/evaluation.md`. Reporting independent-vs-system agreement, rather than a single self-referential accuracy number, is the specific thing a reviewer hiring for applied-AI work checks for.
