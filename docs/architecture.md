# Architecture

TODO: layered diagram + rationale.

- Layer 1 — deterministic rules (`src/lib/rules/`)
- Layer 2 — RAG over the curated corpus (`src/lib/rag/`, `src/data/corpus/`)
- Layer 3 — LLM explanation with structured, validated output (`src/lib/llm/`)
