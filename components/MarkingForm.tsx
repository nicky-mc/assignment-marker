"use client";

import { useState } from "react";
import { COURSES, getRubricsForCourse } from "@/lib/rubrics";
import { anonymise } from "@/lib/anonymise";

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

  function handleAnonymise() {
    const { text, redactionCount } = anonymise(rawSubmission);
    setAnonymisedText(text);
    setRedactionCount(redactionCount);
    setHasAnonymised(true);
    setConfirmedAnonymised(false);
    setResult(null);
    setError(null);
  }

  function handleCourseChange(newCourseId: string) {
    setCourseId(newCourseId);
    setRubricId(getRubricsForCourse(newCourseId)[0].id);
    setResult(null);
  }

  function handleSubmissionChange(value: string) {
    setRawSubmission(value);
    setHasAnonymised(false);
    setConfirmedAnonymised(false);
    setAnonymisedText("");
    setResult(null);
  }

  const markLocked = !hasAnonymised || !confirmedAnonymised || !anonymisedText.trim();

  async function handleMark() {
    setMarking(true);
    setError(null);
    setResult(null);
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
      setResult(data as MarkOutcome);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Marking failed");
    } finally {
      setMarking(false);
    }
  }

  const selectedRubric = rubricsForCourse.find((r) => r.id === rubricId) ?? rubricsForCourse[0];

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl">
      <div className="flex flex-col gap-2">
        <label htmlFor="course" className="font-medium">
          Course
        </label>
        <select
          id="course"
          className="border rounded-md px-3 py-2 bg-white dark:bg-zinc-900"
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
          className="border rounded-md px-3 py-2 bg-white dark:bg-zinc-900"
          value={rubricId}
          onChange={(e) => {
            setRubricId(e.target.value);
            setResult(null);
          }}
        >
          {rubricsForCourse.map((r) => (
            <option key={r.id} value={r.id}>
              {r.week} — {r.title}
            </option>
          ))}
        </select>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{selectedRubric.overview}</p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="submission" className="font-medium">
          Learner submission
        </label>
        <textarea
          id="submission"
          className="border rounded-md px-3 py-2 min-h-40 font-mono text-sm bg-white dark:bg-zinc-900"
          placeholder="Paste the learner's submission here..."
          value={rawSubmission}
          onChange={(e) => handleSubmissionChange(e.target.value)}
        />
      </div>

      <button
        type="button"
        onClick={handleAnonymise}
        disabled={!rawSubmission.trim()}
        className="self-start rounded-md border px-4 py-2 font-medium disabled:opacity-40"
      >
        Anonymise
      </button>

      {hasAnonymised && (
        <div className="flex flex-col gap-2 border rounded-md p-4 bg-zinc-50 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <label htmlFor="anonymised" className="font-medium">
              Anonymised preview ({redactionCount} redaction{redactionCount === 1 ? "" : "s"})
            </label>
          </div>
          <textarea
            id="anonymised"
            className="border rounded-md px-3 py-2 min-h-40 font-mono text-sm bg-white dark:bg-zinc-950"
            value={anonymisedText}
            onChange={(e) => {
              setAnonymisedText(e.target.value);
              setConfirmedAnonymised(false);
            }}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={confirmedAnonymised}
              onChange={(e) => setConfirmedAnonymised(e.target.checked)}
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
        className="self-start rounded-md bg-black text-white dark:bg-white dark:text-black px-4 py-2 font-medium disabled:opacity-40"
      >
        {marking ? "Marking…" : "Mark"}
      </button>

      {error && (
        <p className="text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      {result && (
        <div className="flex flex-col gap-3 border rounded-md p-4">
          {result.topicMismatch ? (
            <div className="flex flex-col gap-1">
              <span className="inline-block w-fit rounded-full bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100 px-3 py-1 text-sm font-medium">
                Possible mismatch
              </span>
              <p className="text-sm">{result.mismatchReason}</p>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-semibold">{result.mark}/4</span>
              {result.borderline && (
                <span className="inline-block rounded-full bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100 px-3 py-1 text-sm font-medium">
                  Borderline
                </span>
              )}
              <span className="text-xs text-zinc-500">(raw score {result.rawScore.toFixed(1)})</span>
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
    </div>
  );
}
