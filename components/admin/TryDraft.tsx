"use client";

import { useState } from "react";
import ResultCard, { type MarkOutcome } from "../ResultCard";
import { PRIMARY_BUTTON } from "./FormParts";

// Marks a fictional sample against a DRAFT rubric, through the normal marking route (admins only, rate limited).
export default function TryDraft({ rubricId, version }: { rubricId: string; version: number }) {
  const [sample, setSample] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MarkOutcome | null>(null);
  const [feedback, setFeedback] = useState("");

  async function run() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rubricId, draft: true, anonymisedSubmission: sample }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Marking failed");
      const outcome = data as MarkOutcome;
      setResult(outcome);
      setFeedback([outcome.feedback.recognition, outcome.feedback.explanation, ...outcome.feedback.nextSteps.map((s) => `- ${s}`), outcome.feedback.motivation].join("\n\n"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Marking failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p role="status" className="rounded-md border-2 border-amber-700 bg-amber-50 text-amber-950 px-3 py-2 font-semibold">
        DRAFT, not live. This marks against draft version {version}. Real marking is not affected.
      </p>
      <div className="flex flex-col gap-1">
        <label htmlFor="try-sample" className="font-medium text-base">
          Fictional sample submission
        </label>
        <p className="text-sm max-w-[70ch]">Use made-up text only. Do not paste real learner work.</p>
        <textarea
          id="try-sample"
          rows={8}
          value={sample}
          onChange={(e) => setSample(e.target.value)}
          className="w-full max-w-[70ch] border border-brand-primary/40 rounded-md px-3 py-2 text-base bg-white text-brand-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary dark:focus-visible:outline-brand-secondary"
        />
      </div>
      <div>
        <button type="button" onClick={run} disabled={busy || !sample.trim()} className={PRIMARY_BUTTON}>
          {busy ? "Marking..." : "Mark against this draft"}
        </button>
      </div>
      {error && (
        <p role="alert" className="font-semibold text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
      {result && (
        <div className="flex flex-col gap-3">
          <p role="status" className="rounded-md bg-amber-100 text-amber-950 px-3 py-2 font-semibold">
            DRAFT, not live
          </p>
          <ResultCard result={result} editableFeedback={feedback} onFeedbackChange={setFeedback} onCopy={() => navigator.clipboard?.writeText(feedback)} copied={false} />
        </div>
      )}
    </div>
  );
}
