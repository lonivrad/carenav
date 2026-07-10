"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { reportSchema, type Report } from "@/lib/schema/report";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";
import { ProgramCard } from "@/components/report/ProgramCard";
import { ReportSummary } from "@/components/report/ReportSummary";
import { YourNextStep } from "@/components/report/YourNextStep";
import { UnknownsPanel } from "@/components/report/UnknownsPanel";
import { sortByRelevance } from "@/components/report/relevance";
import { splitLead, stripChunkIds } from "@/components/report/format";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; report: Report }
  | { status: "not-found" }
  | { status: "invalid" };

/** Reports are never persisted server-side; this is the only source of truth. */
function loadReport(id: string): LoadState {
  if (typeof window === "undefined") return { status: "loading" };
  const raw = sessionStorage.getItem(`carenav.report.${id}`);
  if (!raw) return { status: "not-found" };
  const parsed = reportSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) return { status: "invalid" };
  return { status: "ready", report: parsed.data };
}

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const [load, setLoad] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    // sessionStorage is a browser-only external store — this effect
    // synchronizes it into React state, which is what useEffect is for.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoad(loadReport(id));
  }, [id]);

  if (load.status === "loading") {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-text-body">Loading report…</p>
      </main>
    );
  }

  if (load.status === "not-found" || load.status === "invalid") {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-2xl font-semibold text-accent">Report not found</h1>
        <p className="mt-3 text-text-body">
          Reports are kept only in this browser session and aren&rsquo;t
          stored on a server. If you refreshed, opened this link elsewhere, or
          the session expired, you&rsquo;ll need to start a new screening.
        </p>
        <Link
          href="/intake"
          className="mt-6 inline-flex rounded-cta bg-accent px-6 py-3 font-semibold text-text-on-dark transition-colors duration-[var(--duration-nav)] hover:bg-accent-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Start a new screening
        </Link>
      </main>
    );
  }

  const r = load.report;
  const programs = sortByRelevance(r.programs);
  const { lead, rest } = splitLead(stripChunkIds(r.overallSummary));

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <DisclaimerBanner text={r.disclaimer} />

      <h1 className="mt-6 text-2xl font-semibold text-accent sm:text-3xl">
        Your screening report
      </h1>

      <div className="mt-3 space-y-2 text-base leading-relaxed text-text-body">
        <p>{lead}</p>
        {rest && <p>{rest}</p>}
      </div>

      <ReportSummary programs={programs} />

      <YourNextStep programs={programs} />

      {programs.length > 0 ? (
        <div className="mt-8 space-y-5">
          {programs.map((entry, i) => (
            <ProgramCard key={entry.programId} entry={entry} rank={i + 1} />
          ))}
        </div>
      ) : (
        <p className="mt-8 text-text-body">
          No programs appeared worth investigating based on the information
          provided. This isn&rsquo;t a determination that none apply — it
          reflects what could be screened from your answers.
        </p>
      )}

      <UnknownsPanel unknowns={r.unknowns} followUpQuestions={r.followUpQuestions} />

      <p className="mt-10 text-sm">
        <Link
          href="/intake"
          className="font-medium text-accent underline hover:text-accent-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Start a new screening
        </Link>
      </p>
    </main>
  );
}
