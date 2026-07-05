"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { reportSchema, type Report } from "@/lib/schema/report";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";
import { ProgramCard } from "@/components/report/ProgramCard";
import { UnknownsPanel } from "@/components/report/UnknownsPanel";

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
      <main className="mx-auto max-w-3xl p-8">
        <p className="text-neutral-500">Loading report…</p>
      </main>
    );
  }

  if (load.status === "not-found" || load.status === "invalid") {
    return (
      <main className="mx-auto max-w-3xl p-8">
        <h1 className="text-2xl font-semibold">Report not found</h1>
        <p className="mt-2 text-neutral-600">
          Reports are kept only in this browser session and aren&rsquo;t
          stored on a server. If you refreshed, opened this link elsewhere, or
          the session expired, you&rsquo;ll need to start a new screening.
        </p>
        <Link
          href="/intake"
          className="mt-6 inline-block rounded bg-neutral-900 px-4 py-2 text-white"
        >
          Start a new screening
        </Link>
      </main>
    );
  }

  const r = load.report;

  return (
    <>
      <DisclaimerBanner text={r.disclaimer} />
      <main className="mx-auto max-w-3xl p-8">
        <h1 className="text-2xl font-semibold">Your screening report</h1>
        <p className="mt-3 text-neutral-700">{r.overallSummary}</p>

        <UnknownsPanel unknowns={r.unknowns} followUpQuestions={r.followUpQuestions} />

        <div className="mt-8 space-y-5">
          {r.programs.map((entry) => (
            <ProgramCard key={entry.programId} entry={entry} />
          ))}
        </div>

        {r.programs.length === 0 && (
          <p className="mt-8 text-neutral-600">
            No programs appeared worth investigating based on the information
            provided. This isn&rsquo;t a determination that none apply — it
            reflects what could be screened from your answers.
          </p>
        )}

        <p className="mt-10 text-sm text-neutral-500">
          <Link href="/intake" className="text-blue-700 hover:underline">
            Start a new screening
          </Link>
        </p>
      </main>
    </>
  );
}
