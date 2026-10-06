"use client";

import { useId, useState } from "react";

export interface Evidence {
  type: "quote" | "absence";
  text: string;
}

export interface MarkOutcome {
  rawScore: number;
  mark: number;
  borderline: boolean;
  ceilingBand: number;
  capped: boolean;
  topicMismatch: boolean;
  mismatchReason: string;
  presenceEvidence?: { criterion: string; level: "required" | "stretch"; quote: string | null; met: boolean }[];
  feedback: {
    recognition: string;
    explanation: string;
    nextSteps: string[];
    motivation: string;
  };
  rubric?: { version: number; source: "file" | "database" };
  markerNotes: {
    rationale: string;
    explanationEvidence: Evidence;
    nextStepNotes: { evidence: Evidence; why: string }[];
  };
}

// Focus rings: visible on the purple bar, and on the neutral reading surface in both modes.
const FOCUS_ON_BAR = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";
const FOCUS_ON_SURFACE =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary dark:focus-visible:outline-brand-secondary";

const SURFACE =
  "rounded-lg border-2 border-brand-primary dark:border-brand-secondary/50 overflow-hidden bg-white dark:bg-brand-primary-tint text-foreground";
const SECTION_HEADER = "font-heading text-xl font-semibold bg-brand-primary text-brand-secondary px-4 py-3";
const READABLE = "max-w-[70ch] break-words";

function Badge({ glyph, children }: { glyph: string; children: React.ReactNode }) {
  return (
    <li className="inline-flex items-center gap-1.5 rounded-full bg-white text-brand-primary px-3 py-1 text-sm font-semibold">
      <span aria-hidden="true">{glyph}</span>
      {children}
    </li>
  );
}

function ToggleButton({
  expanded,
  controls,
  onClick,
  children,
  className = "",
}: {
  expanded: boolean;
  controls?: string;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-expanded={expanded}
      aria-controls={controls}
      onClick={onClick}
      className={`rounded-md border px-3 py-1.5 text-sm font-medium ${className}`}
    >
      {children}
    </button>
  );
}

function QuoteBlock({ evidence, id }: { evidence: Evidence; id: string }) {
  if (evidence.type === "absence") {
    return (
      <p
        id={id}
        className={`border-l-4 border-brand-primary dark:border-brand-secondary bg-brand-primary-tint dark:bg-background rounded-r-md px-3 py-2 text-sm ${READABLE}`}
      >
        Not found in the submission: {evidence.text}
      </p>
    );
  }
  return (
    <blockquote
      id={id}
      className={`border-l-4 border-brand-primary dark:border-brand-secondary bg-brand-primary-tint dark:bg-background rounded-r-md px-3 py-2 ${READABLE}`}
    >
      <span className="block text-sm font-semibold">Quote</span>
      <span className="block text-sm">&ldquo;{evidence.text}&rdquo;</span>
    </blockquote>
  );
}

// One evidence item: a short heading line, an optional plain note, and a closed-by-default evidence toggle.
function EvidenceItem({
  id,
  title,
  note,
  evidence,
  shown,
  onToggle,
}: {
  id: string;
  title: string;
  note?: string;
  evidence: Evidence;
  shown: boolean;
  onToggle: () => void;
}) {
  const panelId = `${id}-panel`;
  return (
    <li className="flex flex-col gap-2">
      <p className={READABLE}>
        <span className="font-semibold">{title}</span>
        {note ? <span className="block text-sm">{note}</span> : null}
      </p>
      <div>
        <ToggleButton expanded={shown} controls={panelId} onClick={onToggle} className={`border-brand-primary/50 ${FOCUS_ON_SURFACE}`}>
          {shown ? "Hide evidence" : "Show evidence"}
        </ToggleButton>
      </div>
      {shown && <QuoteBlock evidence={evidence} id={panelId} />}
    </li>
  );
}

export default function ResultCard({
  result,
  editableFeedback,
  onFeedbackChange,
  onCopy,
  copied,
}: {
  result: MarkOutcome;
  editableFeedback: string;
  onFeedbackChange: (value: string) => void;
  onCopy: () => void;
  copied: boolean;
}) {
  const uid = useId();
  const [showDetails, setShowDetails] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const notes = result.markerNotes;
  // Match notes to steps by position; if the counts differ, show no note rather than a wrong one.
  const stepNotes =
    notes?.nextStepNotes && notes.nextStepNotes.length === result.feedback.nextSteps.length ? notes.nextStepNotes : null;
  const presence = result.presenceEvidence ?? [];

  const evidenceKeys = [
    ...(notes?.explanationEvidence ? ["explanation"] : []),
    ...(stepNotes ? stepNotes.map((_, i) => `step-${i}`) : []),
    ...presence.map((p, i) => (p.met && p.quote ? `presence-${i}` : null)).filter((k): k is string => k !== null),
  ];
  const allShown = evidenceKeys.length > 0 && evidenceKeys.every((k) => open[k]);
  const toggle = (k: string) => setOpen((prev) => ({ ...prev, [k]: !prev[k] }));
  const toggleAll = () => setOpen(Object.fromEntries(evidenceKeys.map((k) => [k, !allShown])));

  const detailsId = `${uid}-details`;

  return (
    <div className="flex flex-col gap-4">
      {/* a. Summary bar */}
      <section aria-labelledby={`${uid}-summary`} className="rounded-lg bg-brand-primary text-brand-secondary p-4 flex flex-col gap-3">
        <h2 id={`${uid}-summary`} className="sr-only">
          Result summary
        </h2>
        {result.topicMismatch ? (
          <p className={`text-base ${READABLE}`}>{result.mismatchReason}</p>
        ) : (
          <p className="font-heading text-4xl font-semibold">
            <span className="sr-only">Mark: </span>
            {result.mark}/4
          </p>
        )}
        {(result.borderline || result.capped || result.topicMismatch) && (
          <ul className="flex flex-wrap gap-2" aria-label="Flags">
            {result.borderline && <Badge glyph="◐">Borderline</Badge>}
            {result.capped && <Badge glyph="▼">Capped</Badge>}
            {result.topicMismatch && <Badge glyph="!">May not match the assignment</Badge>}
          </ul>
        )}
        {result.capped && !result.topicMismatch && (
          <p className={`text-base ${READABLE}`}>
            Mark capped at {result.mark}: a required element was not found in the submission
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          {result.rubric?.source === "database" && (
            <span className="text-sm">Rubric v{result.rubric.version}, database</span>
          )}
          <ToggleButton
            expanded={showDetails}
            controls={detailsId}
            onClick={() => setShowDetails((v) => !v)}
            className={`border-brand-secondary/70 text-brand-secondary ${FOCUS_ON_BAR}`}
          >
            Details
          </ToggleButton>
        </div>
        {showDetails && (
          <p id={detailsId} className="text-sm">
            Raw score {result.rawScore.toFixed(1)}
          </p>
        )}
      </section>

      {/* b. For the marker */}
      <section aria-labelledby={`${uid}-marker`} className={SURFACE}>
        <h2 id={`${uid}-marker`} className={SECTION_HEADER}>
          For the marker
        </h2>
        <div className="p-4 flex flex-col gap-5 text-base">
          <p className={`text-sm ${READABLE}`}>Quotes are copied by the AI. Please check them against the submission.</p>

          {notes?.rationale && (
            <div className="flex flex-col gap-1">
              <h3 className="font-heading text-lg font-semibold">Why this mark</h3>
              <p className={READABLE}>{notes.rationale}</p>
            </div>
          )}

          {presence.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="font-heading text-lg font-semibold">Presence checks</h3>
              <ul className="flex flex-col gap-3">
                {presence.map((p, i) => {
                  const key = `presence-${i}`;
                  const hasQuote = p.met && !!p.quote;
                  return (
                    <li key={key} className="flex flex-col gap-2">
                      <p className={READABLE}>
                        <span className="font-semibold">
                          <span aria-hidden="true">{p.met ? "✓ " : "✗ "}</span>
                          {p.met ? "Found" : "Not found"}
                        </span>
                        {": "}
                        {p.criterion}
                        <span className="text-sm"> ({p.level === "required" ? "required" : "stretch goal"})</span>
                      </p>
                      {hasQuote && (
                        <>
                          <div>
                            <ToggleButton
                              expanded={!!open[key]}
                              controls={`${uid}-${key}-panel`}
                              onClick={() => toggle(key)}
                              className={`border-brand-primary/50 ${FOCUS_ON_SURFACE}`}
                            >
                              {open[key] ? "Hide evidence" : "Show evidence"}
                            </ToggleButton>
                          </div>
                          {open[key] && <QuoteBlock evidence={{ type: "quote", text: p.quote! }} id={`${uid}-${key}-panel`} />}
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {evidenceKeys.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-heading text-lg font-semibold">Evidence for the feedback</h3>
                <ToggleButton expanded={allShown} onClick={toggleAll} className={`border-brand-primary/50 ${FOCUS_ON_SURFACE}`}>
                  {allShown ? "Hide all evidence" : "Show all evidence"}
                </ToggleButton>
              </div>
              <ul className="flex flex-col gap-4">
                {notes?.explanationEvidence && (
                  <EvidenceItem
                    id={`${uid}-explanation`}
                    title="Explanation of the mark"
                    evidence={notes.explanationEvidence}
                    shown={!!open.explanation}
                    onToggle={() => toggle("explanation")}
                  />
                )}
                {stepNotes?.map((note, i) => (
                  <EvidenceItem
                    key={i}
                    id={`${uid}-step-${i}`}
                    title={`Next step ${i + 1}: ${result.feedback.nextSteps[i]}`}
                    note={note.why}
                    evidence={note.evidence}
                    shown={!!open[`step-${i}`]}
                    onToggle={() => toggle(`step-${i}`)}
                  />
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* c. Draft feedback for the learner */}
      <section aria-labelledby={`${uid}-learner`} className={SURFACE}>
        <h2 id={`${uid}-learner`} className={SECTION_HEADER}>
          Draft feedback for the learner
        </h2>
        <div className="p-4 flex flex-col gap-4 text-base">
          <div className="flex flex-col gap-3">
            <p className={READABLE}>{result.feedback.recognition}</p>
            <p className={READABLE}>{result.feedback.explanation}</p>
            <h3 className="font-heading text-lg font-semibold">Next steps</h3>
            <ul className="list-disc pl-5 flex flex-col gap-2">
              {result.feedback.nextSteps.map((step, i) => (
                <li key={i} className={READABLE}>
                  {step}
                </li>
              ))}
            </ul>
            <p className={READABLE}>{result.feedback.motivation}</p>
          </div>

          <div className="flex flex-col gap-2 border-t-2 border-brand-primary/20 pt-4">
            <label htmlFor="editable-feedback" className="font-heading text-lg font-semibold">
              Feedback to send (editable)
            </label>
            <p className={`text-sm ${READABLE}`}>
              This is a starting point, not the finished feedback. Before it goes to the learner: check every
              claim above is actually true of their work, adjust the tone to how you would normally talk to them,
              add anything specific to their submission that the AI could not have known, and cut anything
              generic or repeated. Edit directly below, then copy the result to wherever you send feedback.
            </p>
            <textarea
              id="editable-feedback"
              className="w-full max-w-[70ch] border border-brand-primary/40 rounded-md px-3 py-2 min-h-48 text-base bg-white text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
              value={editableFeedback}
              onChange={(e) => onFeedbackChange(e.target.value)}
            />
            <div>
              <button
                type="button"
                onClick={onCopy}
                className={`rounded-md border px-3 py-1.5 text-sm font-medium border-brand-primary/50 ${FOCUS_ON_SURFACE}`}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
