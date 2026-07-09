# Phase 7.5 blind worksheets

26 family worksheets (Task A) and 12 query relevance
sheets (Task B) over 40 corpus chunks.

## Blind-fill protocol — read before starting

1. Fill every worksheet BEFORE looking at any system output for that family
   or query. Do not open `.system-retrieval-snapshot.json`, any report in
   `eval/results/`, or the app itself while filling. Seeing the system's
   answer first anchors your judgment and destroys the independence this
   exercise exists to establish.
2. Task A (family-*.md): for each family, read the 12 corpus docs
   (`src/data/corpus/`) against the attributes table and mark every program
   WI / NWI / UNK with a one-line why. UNK is a real answer — use it whenever
   the docs plus the attributes do not settle the question.
3. Task B (query-*.md): for each query, read all chunks in
   `chunk-reference.md` and mark every row R or NR. Relevance means "this
   chunk's text helps answer this query," decided by reading — never by
   whether a retriever would plausibly return it.
4. Do not consult `src/lib/rules/` or any CareNav code while labeling. The
   corpus docs are the only source of truth.
5. When every sheet is filled, say the word — labels lock at that point and
   only then does the comparison script run.
