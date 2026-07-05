"use client";

import { useState } from "react";

interface BaselineResult {
  programId: string;
  programName: string;
  matchedTerms: string[];
}

export default function BaselinePage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BaselineResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search() {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/baseline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) {
        setError(`Search failed (status ${res.status}).`);
        setResults(null);
        return;
      }
      const body = await res.json();
      setResults(body.results);
    } catch {
      setError("Search failed. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-semibold">Baseline search</h1>
      <p className="mt-2 text-sm text-neutral-500">
        A plain keyword search over the same program corpus CareNav uses —
        deliberately primitive. It lists every program whose text matches a
        search term, in no particular order, with no explanation, no
        confidence level, and no handling of missing information. This exists
        as a comparison point for evaluating the full screening tool.
      </p>

      <div className="mt-6 flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder='e.g. "Washington veteran Parkinson&rsquo;s"'
          className="flex-1 rounded border border-neutral-300 px-3 py-2"
        />
        <button
          type="button"
          onClick={search}
          disabled={loading || !query.trim()}
          className="rounded bg-neutral-900 px-4 py-2 text-white disabled:opacity-40"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </div>

      {error && <p className="mt-4 text-red-700">{error}</p>}

      {results !== null && (
        <div className="mt-6">
          <p className="text-sm text-neutral-500">
            {results.length} matching program{results.length === 1 ? "" : "s"}{" "}
            (unranked)
          </p>
          <ul className="mt-3 divide-y divide-neutral-200 border-y border-neutral-200">
            {results.map((r) => (
              <li key={r.programId} className="py-3">
                <div className="font-medium">{r.programName}</div>
                <div className="text-sm text-neutral-500">
                  matched: {r.matchedTerms.join(", ")}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
