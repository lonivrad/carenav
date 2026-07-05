"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { intakeSchema, type Intake } from "@/lib/schema/intake";
import { reportSchema } from "@/lib/schema/report";
import { ProgressBar } from "@/components/intake/ProgressBar";
import { QuestionStep } from "@/components/intake/QuestionStep";
import { ReviewScreen } from "@/components/intake/ReviewScreen";
import {
  visibleQuestions,
  type QuestionDef,
  type RawAnswers,
} from "@/components/intake/questions";

type Phase = "questions" | "review" | "done" | "error";

export function IntakeFlow() {
  const router = useRouter();
  const [answers, setAnswers] = useState<RawAnswers>({});
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("questions");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const questions = useMemo(() => visibleQuestions(answers), [answers]);
  const current = questions[index];
  const answered = current !== undefined && answers[current.id] !== undefined;

  function setAnswer(id: QuestionDef["id"], value: RawAnswers[QuestionDef["id"]]) {
    setAnswers((prev) => {
      const next = { ...prev, [id]: value };
      // Clearing veteran status invalidates the conditional follow-ups.
      if (id === "isVeteran" && value !== "yes") {
        delete next.serviceEra;
        delete next.dischargeType;
      }
      return next;
    });
  }

  function goNext() {
    if (index + 1 < questions.length) setIndex(index + 1);
    else setPhase("review");
  }

  function goBack() {
    if (phase === "review") setPhase("questions");
    else if (index > 0) setIndex(index - 1);
  }

  function editQuestion(id: QuestionDef["id"]) {
    const i = questions.findIndex((q) => q.id === id);
    if (i >= 0) {
      setIndex(i);
      setPhase("questions");
    }
  }

  async function submit() {
    const parsed = intakeSchema.safeParse(answers);
    if (!parsed.success) {
      setPhase("error");
      setMessage(
        "Some answers are missing or invalid. Please go back and complete every question.",
      );
      return;
    }
    setSubmitting(true);
    try {
      sessionStorage.setItem("carenav.intake", JSON.stringify(parsed.data));
      const res = await fetch("/api/screen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data satisfies Intake),
      });
      if (res.status === 501) {
        setPhase("done");
        setMessage(
          "Your answers were validated and saved in this browser session. Report generation is not available yet — it arrives in a later phase of this project.",
        );
      } else if (res.ok) {
        const body = await res.json();
        const parsedReport = reportSchema.safeParse(body.report);
        if (!parsedReport.success) {
          setPhase("error");
          setMessage("The report came back in an unexpected format. Please try again.");
          return;
        }
        const id = crypto.randomUUID();
        sessionStorage.setItem(
          `carenav.report.${id}`,
          JSON.stringify(parsedReport.data),
        );
        router.push(`/report/${id}`);
      } else {
        setPhase("error");
        setMessage(`Submission failed (status ${res.status}). Please try again.`);
      }
    } catch {
      setPhase("error");
      setMessage("Submission failed. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (phase === "done" || phase === "error") {
    return (
      <div className="rounded border border-neutral-200 p-6">
        <h2 className="text-xl font-medium">
          {phase === "done" ? "Answers received" : "Something went wrong"}
        </h2>
        <p className="mt-2 text-neutral-600">{message}</p>
        {phase === "error" && (
          <button
            type="button"
            onClick={() => setPhase("review")}
            className="mt-4 rounded border border-neutral-300 px-4 py-2"
          >
            Back to review
          </button>
        )}
      </div>
    );
  }

  if (phase === "review") {
    return (
      <ReviewScreen
        questions={questions}
        answers={answers}
        onEdit={editQuestion}
        onSubmit={submit}
        submitting={submitting}
      />
    );
  }

  return (
    <div>
      <ProgressBar step={index + 1} total={questions.length} />
      <QuestionStep
        key={current.id}
        question={current}
        value={answers[current.id]}
        onChange={(v) => setAnswer(current.id, v)}
      />
      <div className="mt-6 flex justify-between">
        <button
          type="button"
          onClick={goBack}
          disabled={index === 0}
          className="rounded border border-neutral-300 px-4 py-2 disabled:opacity-40"
        >
          Back
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={!answered}
          className="rounded bg-neutral-900 px-6 py-2 text-white disabled:opacity-40"
        >
          {index + 1 === questions.length ? "Review answers" : "Next"}
        </button>
      </div>
    </div>
  );
}
