"use client";

import { useRef, useState } from "react";
import { COURSES, getRubricsForCourse } from "@/lib/rubrics";
import { anonymise } from "@/lib/anonymise";
import { extractTextFromFile } from "@/lib/extractText";

interface MarkOutcome {
  rawScore: number;
  mark: number;
  borderline: boolean;
  topicMismatch: boolean;
  mismatchReason: string;
  feedback: {
    recognition: string;
    explanation: string;
    nextSteps: string[];
    motivation: string;
  };
}

function buildFeedbackText(result: MarkOutcome): string {
  const lines: string[] = [];
  if (result.topicMismatch) {
    lines.push(result.mismatchReason, "");
  }
  lines.push(result.feedback.recognition, "");
  lines.push(result.feedback.explanation, "");
  lines.push("Next steps:");
  for (const step of result.feedback.nextSteps) {
    lines.push(`- ${step}`);
  }
  lines.push("", result.feedback.motivation);
  return lines.join("\n");
}

export default function MarkingForm() {
  const [courseId, setCourseId] = useState(COURSES[0].id);
  const rubricsForCourse = getRubricsForCourse(courseId);
  const [rubricId, setRubricId] = useState(rubricsForCourse[0].id);
  const [rawSubmission, setRawSubmission] = useState("");
  const [anonymisedText, setAnonymisedText] = useState("");
  const [hasAnonymised, setHasAnonymised] = useState(false);
  const [confirmedAnonymised, setConfirmedAnonymised] = useState(false);
  const [redactionCount, setRedactionCount] = useState(0);
  const [marking, setMarking] = useState(false);
  const [result, setResult] = useState<MarkOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editableFeedback, setEditableFeedback] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractWarning, setExtractWarning] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setExtracting(true);
    setExtractError(null);
    setExtractWarning(null);
    try {
      const { text, warning } = await extractTextFromFile(file);
      handleSubmissionChange(text);
      if (warning) setExtractWarning(warning);
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : "Could not read that file.");
    } finally {
      setExtracting(false);
    }
  }

  function handleAnonymise() {
    const { text, redactionCount } = anonymise(rawSubmission);
    setAnonymisedText(text);
    setRedactionCount(redactionCount);
    setHasAnonymised(true);
    setConfirmedAnonymised(false);
    setResult(null);
    setEditableFeedback("");
    setError(null);
  }

  function handleCourseChange(newCourseId: string) {
    setCourseId(newCourseId);
    setRubricId(getRubricsForCourse(newCourseId)[0].id);
    setResult(null);
    setEditableFeedback("");
  }

  function handleSubmissionChange(value: string) {
    setRawSubmission(value);
    setHasAnonymised(false);
    setConfirmedAnonymised(false);
    setAnonymisedText("");
    setResult(null);
    setEditableFeedback("");
    setExtractError(null);
    setExtractWarning(null);
  }

  const markLocked = !hasAnonymised || !confirmedAnonymised || !anonymisedText.trim();

  async function handleMark() {
    setMarking(true);
    setError(null);
    setResult(null);
    setEditableFeedback("");
    try {
      const res = await fetch("/api/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rubricId, anonymisedSubmission: anonymisedText }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Marking failed");
      }
      const outcome = data as MarkOutcome;
      setResult(outcome);
      setEditableFeedback(buildFeedbackText(outcome));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Marking failed");
    } finally {
      setMarking(false);
    }
  }

  const selectedRubric = rubricsForCourse.find((r) => r.id === rubricId) ?? rubricsForCourse[0];

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-6 rounded-lg p-6 bg-brand-primary text-brand-secondary">
        <div className="flex flex-col gap-2">
          <label htmlFor="course" className="font-medium">
            Course
          </label>
          <select
            id="course"
            className="border border-brand-secondary/40 rounded-md px-3 py-2 bg-white text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-secondary"
            value={courseId}
            onChange={(e) => handleCourseChange(e.target.value)}
          >
            {COURSES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="assignment" className="font-medium">
            Assignment
          </label>
          <select
            id="assignment"
            className="border border-brand-secondary/40 rounded-md px-3 py-2 bg-white text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-secondary"
            value={rubricId}
            onChange={(e) => {
              setRubricId(e.target.value);
              setResult(null);
            }}
          >
            {rubricsForCourse.map((r) => (
              <option key={r.id} value={r.id}>
                {r.week}: {r.title}
              </option>
            ))}
          </select>
          <p className="text-sm text-brand-secondary/85">{selectedRubric.overview}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <label htmlFor="submission" className="font-medium">
            Learner submission
          </label>
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={extracting}
              className="text-sm rounded-md border border-brand-primary/40 px-3 py-1 font-medium disabled:opacity-40"
            >
              {extracting ? "Reading file…" : "Upload a file"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.markdown,.pdf,.docx"
              className="hidden"
              onChange={handleFileInputChange}
            />
          </div>
        </div>
        <textarea
          id="submission"
          className="border border-brand-primary/20 rounded-md px-3 py-2 min-h-40 font-mono text-sm bg-white dark:bg-brand-primary-tint focus:outline-none focus:ring-2 focus:ring-brand-secondary"
          placeholder="Paste the learner's submission here..."
          value={rawSubmission}
          onChange={(e) => handleSubmissionChange(e.target.value)}
        />
        <p className="text-xs text-foreground/60">
          Accepts .txt, .md, .docx or .pdf, or just paste text directly, e.g. from Google Docs.
        </p>
        {extractError && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {extractError}
          </p>
        )}
        {extractWarning && <p className="text-sm text-amber-700 dark:text-amber-400">{extractWarning}</p>}
      </div>

      <button
        type="button"
        onClick={handleAnonymise}
        disabled={!rawSubmission.trim()}
        className="self-start rounded-md bg-brand-primary text-brand-secondary px-4 py-2 font-medium disabled:opacity-40"
      >
        Anonymise
      </button>

      {hasAnonymised && (
        <div className="flex flex-col gap-2 rounded-md p-4 border-4 border-brand-primary bg-brand-secondary text-brand-primary">
          <label htmlFor="anonymised" className="font-medium">
            Anonymised preview ({redactionCount} redaction{redactionCount === 1 ? "" : "s"})
          </label>
          <textarea
            id="anonymised"
            className="border border-brand-primary/30 rounded-md px-3 py-2 min-h-40 font-mono text-sm bg-white text-brand-primary placeholder:text-brand-primary/50 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            value={anonymisedText}
            onChange={(e) => {
              setAnonymisedText(e.target.value);
              setConfirmedAnonymised(false);
            }}
          />
          <label className="flex items-center gap-2 text-sm rounded-md px-3 py-2 bg-brand-primary text-brand-secondary w-fit">
            <input
              type="checkbox"
              checked={confirmedAnonymised}
              onChange={(e) => setConfirmedAnonymised(e.target.checked)}
              className="accent-brand-secondary w-4 h-4"
            />
            I confirm this submission is anonymised and ready to mark.
          </label>
        </div>
      )}

      <button
        type="button"
        onClick={handleMark}
        disabled={markLocked || marking}
        title={markLocked ? "Anonymise the submission and confirm before marking" : undefined}
        className="self-start rounded-md bg-brand-primary text-white px-4 py-2 font-medium disabled:opacity-40"
      >
        {marking ? "Marking…" : "Mark"}
      </button>

      {error && (
        <p className="text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      {result && (
        <p className="text-sm italic text-foreground/80 border-l-4 border-foreground/30 pl-3">
          The mark and feedback below are an AI-generated draft, not a finished result. Check the mark is
          fair, check every claim in the feedback is accurate, and edit and personalise it before it goes
          anywhere near the learner.
        </p>
      )}

      {result && (
        <div className="flex flex-col gap-3 rounded-md p-4 border-4 border-brand-primary bg-brand-secondary text-brand-primary">
          {result.topicMismatch ? (
            <div className="flex flex-col gap-1">
              <span className="inline-block w-fit rounded-full bg-amber-100 text-amber-900 px-3 py-1 text-sm font-medium">
                Possible mismatch
              </span>
              <p className="text-sm">{result.mismatchReason}</p>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-heading font-semibold text-brand-primary">{result.mark}/4</span>
              {result.borderline && (
                <span className="inline-block rounded-full bg-brand-primary text-brand-secondary px-3 py-1 text-sm font-medium">
                  Borderline
                </span>
              )}
              <span className="text-xs text-brand-primary/70">(raw score {result.rawScore.toFixed(1)})</span>
            </div>
          )}

          <div className="flex flex-col gap-2 text-sm">
            <p>{result.feedback.recognition}</p>
            <p>{result.feedback.explanation}</p>
            <ul className="list-disc pl-5">
              {result.feedback.nextSteps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ul>
            <p>{result.feedback.motivation}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="flex flex-col gap-2 rounded-md p-4 border-4 border-brand-primary bg-brand-secondary text-brand-primary">
          <label htmlFor="editable-feedback" className="font-medium">
            Feedback to send (editable)
          </label>
          <p className="text-sm">
            This is a starting point, not the finished feedback. Before it goes to the learner: check every
            claim above is actually true of their work, adjust the tone to how you would normally talk to them,
            add anything specific to their submission that the AI could not have known, and cut anything
            generic or repeated. Edit directly below, then copy the result to wherever you send feedback.
          </p>
          <textarea
            id="editable-feedback"
            className="border border-brand-primary/30 rounded-md px-3 py-2 min-h-48 text-sm bg-white text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
            value={editableFeedback}
            onChange={(e) => setEditableFeedback(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
