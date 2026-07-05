# Explanation-quality rubric (human scoring)

Score the 15 sample reports listed at the bottom of `eval/results/results.md`.
The full report JSON for each case id is in `eval/results/run-latest.json`
(`systemRecords[].report`); read the report as a family member would.

Score each criterion 1–5 independently. Do not average in your head while
reading — score one criterion at a time across all 15 cases if possible.

## Criteria

### 1. Grounding

Do the factual statements about programs match the cited corpus passages,
with nothing filled in from general knowledge?

- **5** — Every claim traceable to its citations; no unsupported statements.
- **3** — Claims are broadly supported but at least one sentence stretches
  past what the cited passage says.
- **1** — Statements appear invented or contradict the cited passages.

### 2. Clarity

Could a stressed family member with no benefits background understand this
on first read (plain words, short sentences, ~8th-grade level)?

- **5** — Reads effortlessly; jargon is absent or explained.
- **3** — Understandable but requires rereading or tolerating jargon.
- **1** — Bureaucratic, dense, or confusing.

### 3. Appropriate hedging

Does the language stay on the right side of "appears worth investigating"
— never implying a determination, never scaremongering, and saying plainly
when something is unknown?

- **5** — Consistently exploratory tone; unknowns stated without apology or
  false confidence; eligibility questions deflected correctly.
- **3** — Mostly right but at least one sentence overpromises or
  overqualifies.
- **1** — Asserts or strongly implies qualification/disqualification.

### 4. Actionability of next steps

Could the family act on the next steps today (who to call, what form, what
to gather), and are the steps the right ones for that program?

- **5** — Concrete, correctly targeted, realistically ordered.
- **3** — Directionally right but vague ("contact the agency").
- **1** — Missing, generic, or wrong-agency steps.

### 5. Unknown handling

Does the report make missing information feel like a manageable to-do list
(what's missing, why it matters, how to answer it) rather than a dead end?

- **5** — Unknowns are specific, explained, and paired with follow-up
  questions when they gate the screening.
- **3** — Unknowns listed but not connected to consequences.
- **1** — Unknowns ignored or glossed over.

## Recording scores

For each case, record a row:

| case id | grounding | clarity | hedging | next steps | unknowns | notes |
|---|---|---|---|---|---|---|

Flag any report that would have scored 1 on any criterion for review —
a single 1 is a defect to investigate, not an average to absorb.
