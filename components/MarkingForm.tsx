"use client";

import { useMemo, useRef, useState } from "react";
import { anonymise, suggestTerms, type RedactionCategory } from "@/lib/anonymise";
import { extractTextFromFile } from "@/lib/extractText";
import ResultCard, { type MarkOutcome } from "./ResultCard";

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

const CATEGORY_LABELS: Record<RedactionCategory, [string, string]> = {
  name: ["name", "names"],
  email: ["email", "emails"],
  phone: ["phone number", "phone numbers"],
  link: ["link", "links"],
  id: ["ID number", "ID numbers"],
  address: ["address", "addresses"],
  postcode: ["postcode", "postcodes"],
  business: ["business term", "business terms"],
  other: ["identifying line", "identifying lines"],
};

const PLACEHOLDER_STYLES: Record<string, string> = {
  NAME: "bg-yellow-200 text-yellow-950",
  EMAIL: "bg-sky-200 text-sky-950",
  PHONE: "bg-green-200 text-green-950",
  LINK: "bg-purple-200 text-purple-950",
  ID: "bg-orange-200 text-orange-950",
  ADDRESS: "bg-pink-200 text-pink-950",
  POSTCODE: "bg-pink-200 text-pink-950",
  BUSINESS: "bg-teal-200 text-teal-950",
  REDACTED: "bg-gray-300 text-gray-950",
};

const PLACEHOLDER_SPLIT_RE = /(\[(?:NAME|EMAIL|PHONE|LINK|ID|ADDRESS|POSTCODE|BUSINESS|REDACTED)\])/;

function summariseCounts(counts: Record<RedactionCategory, number>): string {
  const parts = (Object.keys(CATEGORY_LABELS) as RedactionCategory[])
    .filter((k) => counts[k] > 0)
    .map((k) => `${counts[k]} ${CATEGORY_LABELS[k][counts[k] === 1 ? 0 : 1]}`);
  return parts.length > 0 ? `Replaced: ${parts.join(", ")}` : "Nothing was replaced";
}

// Highlights each placeholder in colour. The category is also the text of the placeholder itself.
function HighlightedPreview({ text }: { text: string }) {
  return (
    <div
      className="border border-brand-primary/30 rounded-md px-3 py-2 max-h-60 overflow-auto text-sm whitespace-pre-wrap bg-white text-brand-primary"
      aria-label="Highlighted preview, read only"
    >
      {text.split(PLACEHOLDER_SPLIT_RE).map((part, i) => {
        const m = /^\[([A-Z]+)\]$/.exec(part);
        const style = m ? PLACEHOLDER_STYLES[m[1]] : undefined;
        return style ? (
          <mark key={i} className={`rounded px-1 font-semibold ${style}`} title={`Replaced: ${m![1].toLowerCase()}`}>
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </div>
  );
}

// "Jane-Doe_Assignment 1.docx" -> ["Jane", "Doe"]: the part before the first underscore, split on hyphens and spaces.
// Only these derived name parts are kept. The file name itself is never stored or sent anywhere.
function namesFromFileName(fileName: string): string[] {
  const base = fileName.replace(/\.[^.]+$/, "");
  const beforeUnderscore = base.split("_")[0];
  return Array.from(new Set(beforeUnderscore.split(/[-\s]+/).filter(Boolean)));
}

export interface CourseOption {
  id: string;
  name: string;
}

export interface RubricOption {
  id: string;
  courseId: string;
  week: string;
  title: string;
  overview: string;
}

export default function MarkingForm({ courses, rubrics }: { courses: CourseOption[]; rubrics: RubricOption[] }) {
  const getRubricsForCourse = (id: string) => rubrics.filter((r) => r.courseId === id);
  const [courseId, setCourseId] = useState(courses[0].id);
  const rubricsForCourse = getRubricsForCourse(courseId);
  const [rubricId, setRubricId] = useState(rubricsForCourse[0].id);
  const [rawSubmission, setRawSubmission] = useState("");
  const [anonymisedText, setAnonymisedText] = useState("");
  const [hasAnonymised, setHasAnonymised] = useState(false);
  const [confirmedAnonymised, setConfirmedAnonymised] = useState(false);
  const [redactionCount, setRedactionCount] = useState(0);
  const [counts, setCounts] = useState<Record<RedactionCategory, number> | null>(null);
  const [names, setNames] = useState<string[]>([]);
  const [nameInput, setNameInput] = useState("");
  const [terms, setTerms] = useState<string[]>([]);
  const markRequestId = useRef(0);
  const [marking, setMarking] = useState(false);
  const [result, setResult] = useState<MarkOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editableFeedback, setEditableFeedback] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractWarning, setExtractWarning] = useState<string | null>(null);
  const [extractNotice, setExtractNotice] = useState<string | null>(null);
  const [feedbackCopied, setFeedbackCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleCopyFeedback() {
    try {
      await navigator.clipboard.writeText(editableFeedback);
      setFeedbackCopied(true);
      setTimeout(() => setFeedbackCopied(false), 2000);
    } catch {
      // Clipboard API unavailable - marker can still select and copy manually.
    }
  }

  async function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setExtracting(true);
    setExtractError(null);
    setExtractWarning(null);
    setExtractNotice(null);
    try {
      const { text, warning, notice } = await extractTextFromFile(file);
      handleSubmissionChange(text);
      setNames(namesFromFileName(file.name));
      setTerms([]);
      if (warning) setExtractWarning(warning);
      if (notice) setExtractNotice(notice);
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : "Could not read that file.");
    } finally {
      setExtracting(false);
    }
  }

  // Clears the preview, the confirmation tick and the result card, and ignores any mark still in flight.
  function resetPreview() {
    markRequestId.current += 1;
    setMarking(false);
    setHasAnonymised(false);
    setConfirmedAnonymised(false);
    setAnonymisedText("");
    setRedactionCount(0);
    setCounts(null);
    setResult(null);
    setEditableFeedback("");
    setError(null);
  }

  function handleAnonymise() {
    resetPreview();
    const out = anonymise(rawSubmission, { names, terms });
    setAnonymisedText(out.text);
    setRedactionCount(out.redactionCount);
    setCounts(out.counts);
    setHasAnonymised(true);
  }

  function handleCourseChange(newCourseId: string) {
    setCourseId(newCourseId);
    setRubricId(getRubricsForCourse(newCourseId)[0].id);
    resetPreview();
  }

  function handleSubmissionChange(value: string) {
    setRawSubmission(value);
    resetPreview();
    setExtractError(null);
    setExtractWarning(null);
    setExtractNotice(null);
  }

  function addNames(raw: string) {
    const parts = raw.split(/[,\s]+/).map((p) => p.trim()).filter(Boolean);
    if (parts.length === 0) return;
    setNames((prev) => Array.from(new Set([...prev, ...parts])));
    setNameInput("");
    resetPreview();
  }

  function removeName(name: string) {
    setNames((prev) => prev.filter((n) => n !== name));
    resetPreview();
  }

  function addTerm(term: string) {
    setTerms((prev) => (prev.includes(term) ? prev : [...prev, term]));
    resetPreview();
  }

  function removeTerm(term: string) {
    setTerms((prev) => prev.filter((t) => t !== term));
    resetPreview();
  }

  const suggestions = useMemo(
    () => suggestTerms(rawSubmission, [...names, ...terms]),
    [rawSubmission, names, terms],
  );

  const markLocked = !hasAnonymised || !confirmedAnonymised || !anonymisedText.trim();

  async function handleMark() {
    const requestId = ++markRequestId.current;
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
      if (requestId !== markRequestId.current) return; // the text or assignment changed meanwhile
      if (!res.ok) {
        throw new Error(data.error ?? "Marking failed");
      }
      const outcome = data as MarkOutcome;
      setResult(outcome);
      setEditableFeedback(buildFeedbackText(outcome));
    } catch (err) {
      if (requestId !== markRequestId.current) return;
      setError(err instanceof Error ? err.message : "Marking failed");
    } finally {
      if (requestId === markRequestId.current) setMarking(false);
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
            {courses.map((c) => (
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
              resetPreview();
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
          className="border border-brand-primary/20 rounded-md px-3 py-2 min-h-40 text-sm bg-white dark:bg-brand-primary-tint focus:outline-none focus:ring-2 focus:ring-brand-secondary"
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
        {extractNotice && (
          <p className="text-sm text-amber-700 dark:text-amber-400" role="status">
            {extractNotice}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2 rounded-md p-4 border-2 border-brand-primary/40">
        <label htmlFor="name-input" className="font-medium">
          Names to remove
        </label>
        <p className="text-xs text-foreground/70">
          Pre-filled from the file name when you upload a file. Please confirm or edit them: only the names
          listed here are removed from the body of the text.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {names.map((n) => (
            <span
              key={n}
              className="inline-flex items-center gap-1 rounded-full bg-brand-primary text-brand-secondary px-3 py-1 text-sm"
            >
              {n}
              <button type="button" onClick={() => removeName(n)} aria-label={`Remove name ${n}`} className="font-bold">
                ×
              </button>
            </span>
          ))}
          <input
            id="name-input"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addNames(nameInput);
              } else if (e.key === "Backspace" && nameInput === "" && names.length > 0) {
                removeName(names[names.length - 1]);
              }
            }}
            onBlur={() => addNames(nameInput)}
            placeholder="Type a name, press Enter"
            className="border border-brand-primary/30 rounded-md px-2 py-1 text-sm bg-white dark:bg-brand-primary-tint focus:outline-none focus:ring-2 focus:ring-brand-secondary"
          />
        </div>
        {names.length === 0 && (
          <p className="text-sm font-medium text-amber-700 dark:text-amber-400" role="status">
            No names entered: names in the text will not be removed
          </p>
        )}
      </div>

      {rawSubmission.trim() && (
        <div className="flex flex-col gap-2 rounded-md p-4 border-2 border-brand-primary/40">
          <h2 className="font-medium">Check before marking</h2>
          <p className="text-xs text-foreground/70">
            Capitalised words that appear mid-sentence or three or more times and are not common terms. If one
            is a business or person that could identify the learner, redact it.
          </p>
          {suggestions.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <li
                  key={s.term}
                  className="inline-flex items-center gap-2 rounded-md border border-brand-primary/30 px-2 py-1 text-sm"
                >
                  <span>
                    {s.term} <span className="text-foreground/60">({s.count})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => addTerm(s.term)}
                    className="rounded border border-brand-primary/40 px-2 text-xs font-medium"
                    aria-label={`Redact ${s.term}`}
                  >
                    Redact
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm">No suggestions.</p>
          )}
          {terms.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span>Will be replaced with [BUSINESS]:</span>
              {terms.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full bg-brand-primary text-brand-secondary px-3 py-1"
                >
                  {t}
                  <button type="button" onClick={() => removeTerm(t)} aria-label={`Stop redacting ${t}`} className="font-bold">
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

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
          <h2 className="font-medium">
            Preview ({redactionCount} replacement{redactionCount === 1 ? "" : "s"})
          </h2>
          <p className="text-sm">
            Identifying details removed where found. Please read the preview: context can still identify
            someone.
          </p>
          {counts && <p className="text-sm font-medium">{summariseCounts(counts)}</p>}
          <HighlightedPreview text={anonymisedText} />
          <label htmlFor="anonymised" className="text-sm font-medium">
            Edit the text below if anything else needs removing (this is what will be sent for marking)
          </label>
          <textarea
            id="anonymised"
            className="border border-brand-primary/30 rounded-md px-3 py-2 min-h-40 text-sm bg-white text-brand-primary placeholder:text-brand-primary/50 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            value={anonymisedText}
            onChange={(e) => {
              setAnonymisedText(e.target.value);
              setConfirmedAnonymised(false);
              // Editing the preview makes any earlier result stale.
              markRequestId.current += 1;
              setMarking(false);
              setResult(null);
              setEditableFeedback("");
            }}
          />
          <label className="flex items-center gap-2 text-sm rounded-md px-3 py-2 bg-brand-primary text-brand-secondary w-fit">
            <input
              type="checkbox"
              checked={confirmedAnonymised}
              onChange={(e) => setConfirmedAnonymised(e.target.checked)}
              className="accent-brand-secondary w-4 h-4"
            />
            I have checked the preview and removed anything that could identify the learner.
          </label>
        </div>
      )}

      <button
        type="button"
        onClick={handleMark}
        disabled={markLocked || marking}
        title={markLocked ? "Run Anonymise and confirm the preview before marking" : undefined}
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
        <ResultCard
          result={result}
          editableFeedback={editableFeedback}
          onFeedbackChange={setEditableFeedback}
          onCopy={handleCopyFeedback}
          copied={feedbackCopied}
        />
      )}
    </div>
  );
}
