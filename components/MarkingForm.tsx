"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { anonymise, suggestTerms, type RedactionCategory } from "@/lib/anonymise";
import { extractTextFromFile } from "@/lib/extractText";
import { Eye, EyeOff, Upload, X } from "lucide-react";
import { toast } from "sonner";
import Alert from "./Alert";
import SegmentedControl from "./SegmentedControl";
import ResultCard, { type MarkOutcome } from "./ResultCard";
import { AppCard } from "./AppCard";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Skeleton } from "./ui/skeleton";
import { NativeSelect } from "./ui/native-select";
import { Textarea } from "./ui/textarea";

type StepKey = "course" | "submission" | "anonymise" | "preview";

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
      className="min-h-40 max-h-96 overflow-auto whitespace-pre-wrap rounded-[10px] border-2 border-field-border bg-field px-3 py-2 text-sm text-ink"
      role="region"
      tabIndex={0}
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
// Tokens that contain digits or look like assignment wording (assignment, week, course names...) are not names and are skipped.
const NOT_NAME_WORDS = ["assignment", "week", "ail", "dmai", "di", "f"];
function namesFromFileName(fileName: string, courseNames: string[]): string[] {
  const skip = new Set([...NOT_NAME_WORDS, ...courseNames.flatMap((c) => [c, ...c.split(/[^A-Za-z0-9]+/)]).map((w) => w.toLowerCase()).filter(Boolean)]);
  const base = fileName.replace(/\.[^.]+$/, "");
  const beforeUnderscore = base.split("_")[0];
  const tokens = beforeUnderscore.split(/[-\s]+/).filter(Boolean).filter((t) => !/\d/.test(t) && !skip.has(t.toLowerCase()));
  return Array.from(new Set(tokens));
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
  // Which step cards are open. Opening or closing never resets anything by itself: the reset rules apply only when content changes.
  const [openSteps, setOpenSteps] = useState<Record<StepKey, boolean>>({ course: true, submission: true, anonymise: true, preview: true });
  const openBeforeMark = useRef<Record<StepKey, boolean> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const [marking, setMarking] = useState(false);
  const [result, setResult] = useState<MarkOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editableFeedback, setEditableFeedback] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractWarning, setExtractWarning] = useState<string | null>(null);
  const [extractNotice, setExtractNotice] = useState<string | null>(null);
  const [feedbackCopied, setFeedbackCopied] = useState(false);
  const [previewView, setPreviewView] = useState<"highlighted" | "edit">("highlighted");
  const [hideOriginal, setHideOriginal] = useState(false);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleCopyFeedback() {
    try {
      await navigator.clipboard.writeText(editableFeedback);
      setFeedbackCopied(true);
      toast.success("Copied");
      setTimeout(() => setFeedbackCopied(false), 2000);
    } catch {
      // Clipboard API unavailable - marker can still select and copy manually.
      toast.error("Could not copy. Select the text and copy it yourself.");
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
      setNames(namesFromFileName(file.name, courses.map((c) => c.name)));
      setDismissed([]);
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
    setHideOriginal(false);
    setPreviewView("highlighted");
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

  const selectedRubric = rubricsForCourse.find((r) => r.id === rubricId) ?? rubricsForCourse[0];

  // Words in the assignment's own title and overview are not worth flagging, so they are left out of the suggestions.
  const assignmentText = `${selectedRubric.week} ${selectedRubric.title} ${selectedRubric.overview} ${courses.find((c) => c.id === courseId)?.name ?? ""}`;
  const assignmentWords = useMemo(() => new Set(assignmentText.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)), [assignmentText]);
  const suggestions = useMemo(
    () =>
      suggestTerms(rawSubmission, [...names, ...terms]).filter(
        (s) => !dismissed.includes(s.term) && !s.term.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).every((w) => assignmentWords.has(w)),
      ),
    [rawSubmission, names, terms, dismissed, assignmentWords],
  );

  const markLocked = !hasAnonymised || !confirmedAnonymised || !anonymisedText.trim();

  async function handleMark() {
    const requestId = ++markRequestId.current;
    // Collapse the step cards so the result is the focus. Remember how they were, to restore them if marking fails.
    openBeforeMark.current = openSteps;
    setAllSteps(false);
    setHideOriginal(true); // the original text is hidden as soon as Mark is pressed
    const controller = new AbortController();
    abortRef.current = controller;
    setMarking(true);
    setError(null);
    setResult(null);
    setEditableFeedback("");
    try {
      const res = await fetch("/api/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rubricId, anonymisedSubmission: anonymisedText }),
        signal: controller.signal,
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
      // Cancelled or failed: put the cards back as they were. A failure also shows the existing error message.
      if (openBeforeMark.current) setOpenSteps(openBeforeMark.current);
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Marking failed");
    } finally {
      if (requestId === markRequestId.current) setMarking(false);
    }
  }

  // Cancel stops waiting for the answer. The server may still finish the request it has already started.
  function handleCancelMark() {
    abortRef.current?.abort();
  }

  // One-line summaries for collapsed cards. They never include the file name or any of the learner's text.
  const wordCount = rawSubmission.trim() ? rawSubmission.trim().split(/\s+/).length : 0;
  const summaries: Record<StepKey, string> = {
    course: `${courses.find((c) => c.id === courseId)?.name ?? ""}, ${selectedRubric.week}: ${selectedRubric.title}`,
    submission: wordCount === 0 ? "No text yet" : `${wordCount.toLocaleString("en-GB")} ${wordCount === 1 ? "word" : "words"}`,
    anonymise: counts ? summariseCounts(counts) : "Identifying details not removed yet",
    preview: hasAnonymised && confirmedAnonymised ? "Preview checked and confirmed" : "Preview not confirmed yet",
  };
  const setStep = (key: StepKey) => (open: boolean) => setOpenSteps((p) => ({ ...p, [key]: open }));
  const setAllSteps = (open: boolean) => setOpenSteps({ course: open, submission: open, anonymise: open, preview: open });

  // When the result arrives: scroll it into view, move focus to its heading, and announce it.
  useEffect(() => {
    if (!result) return;
    const box = resultRef.current;
    if (!box) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    box.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    const heading = box.querySelector("h2");
    if (heading instanceof HTMLElement) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  }, [result]);

  return (
    <div className="flex w-full flex-col gap-4">
      <p role="status" aria-live="polite" className="sr-only">
        {result ? "Draft ready" : ""}
      </p>
      {result && (
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => setAllSteps(true)}>
            Expand all
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setAllSteps(false)}>
            Collapse all
          </Button>
        </div>
      )}
      <AppCard tone="purple" step={1} title="Course and assignment" collapsible={{ open: openSteps.course, onOpenChange: setStep("course"), summary: summaries.course, label: "Course and assignment" }}>
        <div className="flex flex-col gap-2">
          <label htmlFor="course" className="font-medium">
            Course
          </label>
          <NativeSelect id="course" value={courseId} onChange={(e) => handleCourseChange(e.target.value)}>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </NativeSelect>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="assignment" className="font-medium">
            Assignment
          </label>
          <NativeSelect
            id="assignment"
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
          </NativeSelect>
          <p className="text-sm text-purple-body">{selectedRubric.overview}</p>
        </div>
      </AppCard>

      <AppCard
        step={2}
        title={hideOriginal ? "Learner submission" : <label htmlFor="submission">Learner submission</label>}
        collapsible={{ open: openSteps.submission, onOpenChange: setStep("submission"), summary: summaries.submission, label: "Learner submission" }}
        action={
          <>
            {hasAnonymised && (
              <Button type="button" variant="outline" size="sm" onClick={() => setHideOriginal((h) => !h)}>
                {hideOriginal ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}
                {hideOriginal ? "Show original" : "Hide original"}
              </Button>
            )}
            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={extracting}>
              <Upload aria-hidden="true" />
              {extracting ? "Reading file…" : "Upload a file"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.markdown,.pdf,.docx,.csv,.xlsx,.ods"
              className="hidden"
              onChange={handleFileInputChange}
              aria-label="Choose a file to upload"
            />
          </>
        }
        helper="Accepts .txt, .md, .docx, .pdf, .xlsx, .ods or .csv, or just paste text directly, e.g. from Google Docs."
      >
        {hideOriginal ? (
          <div className="flex min-h-40 flex-col items-start justify-center gap-3 rounded-[10px] border-2 border-dashed border-field-border bg-field px-4 py-6">
            <p className="flex items-center gap-2 font-medium">
              <EyeOff aria-hidden="true" className="size-5" />
              Original text hidden
            </p>
            <Button type="button" variant="outline" size="sm" onClick={() => setHideOriginal(false)}>
              Show
            </Button>
          </div>
        ) : (
          <Textarea
            id="submission"
            className="min-h-40"
            placeholder="Paste the learner's submission here..."
            value={rawSubmission}
            onChange={(e) => handleSubmissionChange(e.target.value)}
          />
        )}
        {extractError && (
          <Alert variant="error" title="Could not read that file">
            {extractError}
          </Alert>
        )}
        {extractWarning && (
          <Alert variant="warning" title="Check the extracted text">
            {extractWarning}
          </Alert>
        )}
        {extractNotice && (
          <Alert variant="warning" title="Tables were read approximately">
            {extractNotice}
          </Alert>
        )}
      </AppCard>

      <AppCard step={3} title="Remove identifying details" collapsible={{ open: openSteps.anonymise, onOpenChange: setStep("anonymise"), summary: summaries.anonymise, label: "Remove identifying details" }}>
        <div className="flex flex-col gap-2">
          <label htmlFor="name-input" className="font-medium">
            Names to remove
          </label>
          <p className="text-[13px] text-ink-2">
            Pre-filled from the file name when you upload a file. Please confirm or edit them: only the names
            listed here are removed from the body of the text.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {names.map((n) => (
              <Badge key={n} className="gap-1.5 pr-1.5">
                {n}
                <button
                  type="button"
                  onClick={() => removeName(n)}
                  aria-label={`Remove ${n}`}
                  className="flex size-6 items-center justify-center rounded-full hover:bg-brand-secondary hover:text-brand-primary"
                >
                  <X aria-hidden="true" />
                </button>
              </Badge>
            ))}
            <Input
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
              className="w-auto min-w-52 flex-1"
            />
          </div>
          {names.length === 0 && (
            <Alert variant="warning" title="No names entered">
              Names in the text will not be removed.
            </Alert>
          )}
        </div>

        {rawSubmission.trim() && (
          <div className="flex flex-col gap-2">
            <h3 className="font-heading font-semibold">Check before marking</h3>
            <p className="text-[13px] text-ink-2">
              Capitalised words that appear mid-sentence or three or more times and are not common terms. If one
              is a business or person that could identify the learner, redact it.
            </p>
            {suggestions.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <li
                    key={s.term}
                    className="inline-flex items-center gap-2 rounded-[10px] border-2 border-surface-border px-2 py-1 text-sm"
                  >
                    <span>
                      {s.term} <span className="text-ink-2">({s.count})</span>
                    </span>
                    <Button type="button" variant="outline" size="xs" onClick={() => addTerm(s.term)} aria-label={`Redact ${s.term}`}>
                      Redact
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => setDismissed((d) => [...d, s.term])}
                      aria-label={`Dismiss ${s.term}`}
                    >
                      Dismiss
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm">No suggestions</p>
            )}
            {terms.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span>Will be replaced with [BUSINESS]:</span>
                {terms.map((t) => (
                  <Badge key={t} className="gap-1.5 pr-1.5">
                    {t}
                    <button
                      type="button"
                      onClick={() => removeTerm(t)}
                      aria-label={`Stop redacting ${t}`}
                      className="flex size-6 items-center justify-center rounded-full hover:bg-brand-secondary hover:text-brand-primary"
                    >
                      <X aria-hidden="true" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={handleAnonymise} disabled={!rawSubmission.trim()}>
            Anonymise
          </Button>
          {hasAnonymised && counts && <p className="text-sm font-medium">{summariseCounts(counts)}</p>}
        </div>
      </AppCard>

      <AppCard step={4} title="Check the preview" collapsible={{ open: openSteps.preview, onOpenChange: setStep("preview"), summary: summaries.preview, label: "Check the preview" }}>
        {hasAnonymised && (
          <div className="flex flex-col gap-3">
            <h3 className="font-heading font-semibold">
              Preview ({redactionCount} replacement{redactionCount === 1 ? "" : "s"})
            </h3>
            <p className="text-sm">
              Identifying details removed where found. Please read the preview: context can still identify
              someone.
            </p>
            <SegmentedControl
              label="Preview view"
              name="preview-view"
              value={previewView}
              onChange={setPreviewView}
              options={[
                { value: "highlighted", label: "Highlighted" },
                { value: "edit", label: "Edit" },
              ]}
            />
            {previewView === "highlighted" ? (
              <HighlightedPreview text={anonymisedText} />
            ) : (
              <>
                <p className="text-[13px] text-ink-2">The text below is what will be sent for marking. Edit it if anything else needs removing.</p>
                <Textarea
                  id="anonymised"
                  aria-label="Anonymised text, this is what is sent for marking"
                  className="min-h-40 max-h-96 text-sm"
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
              </>
            )}
            <label className="flex w-fit items-center gap-2 rounded-[10px] border-2 border-surface-border px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={confirmedAnonymised}
                onChange={(e) => setConfirmedAnonymised(e.target.checked)}
                className="size-5 accent-brand-primary dark:accent-brand-secondary"
              />
              I have checked the preview and removed anything that could identify the learner.
            </label>
          </div>
        )}
        <div>
          <Button
            type="button"
            onClick={handleMark}
            disabled={markLocked || marking}
            title={markLocked ? "Run Anonymise and confirm the preview before marking" : undefined}
          >
            {marking ? "Marking…" : "Mark"}
          </Button>
        </div>
      </AppCard>

      {error && (
        <Alert variant="error" title="Marking did not complete">
          {error}
        </Alert>
      )}

      {result && (
        <Alert variant="warning" title="AI-generated draft, not a finished result">
          Check the mark is fair, check every claim in the feedback is accurate, and edit and personalise it before it goes
          anywhere near the learner.
        </Alert>
      )}

      {marking && (
        <AppCard title="Marking this submission...">
          <div role="status" aria-busy="true" className="flex flex-col gap-3">
            <span className="sr-only">Marking this submission</span>
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div>
            <Button type="button" variant="outline" size="sm" onClick={handleCancelMark}>
              Cancel
            </Button>
          </div>
        </AppCard>
      )}

      {result && (
        <div ref={resultRef} className="flex scroll-mt-4 flex-col gap-4">
          <ResultCard
            result={result}
            editableFeedback={editableFeedback}
            onFeedbackChange={setEditableFeedback}
            aiDraft={buildFeedbackText(result)}
            onCopy={handleCopyFeedback}
            copied={feedbackCopied}
          />
        </div>
      )}
    </div>
  );
}
