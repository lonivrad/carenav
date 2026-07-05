"use client";

import { useState } from "react";

import type { ProgramEntry } from "@/lib/schema/report";
import { ConfidenceBadge } from "@/components/report/ConfidenceBadge";
import { CitationLink } from "@/components/report/CitationLink";
import { NextSteps } from "@/components/report/NextSteps";

export interface ProgramCardProps {
  entry: ProgramEntry;
}

/** One program that appears worth investigating. Never asserts eligibility. */
export function ProgramCard({ entry }: ProgramCardProps) {
  const [expanded, setExpanded] = useState(false);
  const sourcesAnchor = `sources-${entry.programId}`;

  return (
    <article className="rounded border border-neutral-200 p-5">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-lg font-medium">{entry.programName}</h3>
        <ConfidenceBadge confidence={entry.relevanceLabel} />
      </div>

      {entry.status === "unverified" && (
        <p className="mt-2 text-sm text-neutral-500">
          We could not verify current details for this program from our
          sources — treat this entry as a starting point for your own
          research, not a confirmed match.
        </p>
      )}

      <p className="mt-3 text-neutral-800">{entry.whyThisMayApply}</p>

      {entry.whatItCovers.length > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 text-sm font-medium text-blue-700 hover:underline"
        >
          {expanded ? "Hide" : "Show"} what it generally covers
        </button>
      )}

      {expanded && entry.whatItCovers.length > 0 && (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-700">
          {entry.whatItCovers.map((claim, i) => (
            <li key={i}>
              {claim.text}
              {claim.chunkIds.map((chunkId, j) => (
                <CitationLink
                  key={chunkId}
                  chunkId={chunkId}
                  index={j + 1}
                  sourcesAnchor={sourcesAnchor}
                />
              ))}
            </li>
          ))}
        </ul>
      )}

      {entry.informationStillNeeded.length > 0 && (
        <div className="mt-3 rounded bg-neutral-50 p-3 text-sm text-neutral-600">
          <span className="font-medium">Information still needed: </span>
          {entry.informationStillNeeded.join("; ")}
        </div>
      )}

      <NextSteps steps={entry.nextSteps} />

      {entry.officialLinks.length > 0 && (
        <div id={sourcesAnchor} className="mt-4 border-t border-neutral-100 pt-3">
          <h4 className="text-sm font-medium text-neutral-700">Sources</h4>
          <ul className="mt-1 space-y-1 text-sm">
            {entry.officialLinks.map((url) => (
              <li key={url}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 hover:underline"
                >
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
