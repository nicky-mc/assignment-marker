"use client";

import { useState } from "react";
import { toast } from "sonner";
import Alert from "../Alert";
import ResultCard, { type MarkOutcome } from "../ResultCard";
import { PRIMARY_BUTTON } from "./FormParts";

// Marks a fictional sample against a DRAFT rubric, through the normal marking route (admins only, rate limited).
export default function TryDraft({ rubricId, version }: { rubricId: string; version: number }) {
  const [sample, setSample] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MarkOutcome | null>(null);
  const [feedback, setFeedback] = useState("");
  const [aiDraft, setAiDraft] = useState("");

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
      const draft = [outcome.feedback.recognition, outcome.feedback.explanation, ...outcome.feedback.nextSteps.map((s) => `- ${s}`), outcome.feedback.motivation].join("\n\n");
      setFeedback(draft);
      setAiDraft(draft);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Marking failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Alert variant="warning" title="DRAFT, not live">
        This marks against draft version {version}. Real marking is not affected.
      </Alert>
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
          className="field-control max-w-[70ch]"
        />
      </div>
      <div>
        <button type="button" onClick={run} disabled={busy || !sample.trim()} className={PRIMARY_BUTTON}>
          {busy ? "Marking..." : "Mark against this draft"}
        </button>
      </div>
      {error && (
        <Alert variant="error" title="Marking did not complete">
          {error}
        </Alert>
      )}
      {result && (
        <div className="flex flex-col gap-3">
          <ResultCard
            result={result}
            editableFeedback={feedback}
            onFeedbackChange={setFeedback}
            aiDraft={aiDraft}
            onCopy={() => navigator.clipboard?.writeText(feedback).then(() => toast.success("Copied"), () => toast.error("Could not copy. Select the text and copy it yourself."))}
            copied={false}
          />
        </div>
      )}
    </div>
  );
}
