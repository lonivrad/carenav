# Eval results (2026-07-05T21:28:03.394Z)

100 synthetic cases (eval/testset/families.json). Ground truth derives from the deterministic rules engine; the baseline is unranked keyword search over the same corpus.

| Metric | Baseline (keyword) | System (full pipeline) |
|---|---|---|
| Program precision | 58.5% | 100.0% |
| Program recall | 99.3% | 100.0% |
| Top-5 recall | 48.5% | 100.0% |
| Citation validity | n/a (no citations) | 100.0% (1403 checked) |
| Unknown detection | n/a (not modeled) | 100.0% |
| Refusal correctness | n/a (no prose) | 100.0% |
| Follow-up compliance | n/a | 100.0% |
| Hallucinated-program rate | n/a | 0.0% (target 0%) |
| Mean latency | 3ms | 79.9s (target <10s) |
| p95 latency | — | 115.8s |
| Mean cost / report | $0 | $0.166 |
| Total cost | $0 | $16.61 |
| Pipeline failures | — | 0/100 |

> **Caveat — self-consistency, not independent correctness:** program
> precision, program recall, and top-5 recall are computed against ground
> truth derived from the rules engine (`src/lib/rules/`). Because the
> system's program selection runs through that same engine, these three
> numbers confirm the pipeline preserves and surfaces the rules engine's
> decisions end-to-end (no programs dropped, added, or reordered into the
> top 5) — they do not independently verify that the selections are
> *correct*. Independently-labeled retrieval-quality numbers are pending
> (Phase 7.5). All other metrics (citation validity, unknown
> detection, refusal correctness, hallucinated-program rate, latency,
> cost) are measured against artifacts independent of the rules engine
> and stand as-is.

## Human rubric sample

Score these 15 cases against eval/rubric.md (1–5 per criterion); the full reports are in eval/results/run-latest.json under each case id:

- simple-01
- simple-11
- simple-20
- veteran-01
- veteran-11
- veteran-20
- medicaid-edge-01
- medicaid-edge-11
- medicaid-edge-20
- high-asset-01
- high-asset-11
- high-asset-20
- ambiguous-01
- ambiguous-11
- ambiguous-20
