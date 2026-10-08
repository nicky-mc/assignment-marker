"use client";

import { useId, useState } from "react";
import { Check, ChevronDown, ClipboardCheck, ClipboardCopy, Quote, RotateCcw, SearchX, X } from "lucide-react";
import AutoTextarea from "./admin/AutoTextarea";
import { AppCard } from "./AppCard";
import { SummaryBadge, SummaryCard } from "./SummaryCard";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

export interface Evidence {
  type: "quote" | "absence";
  text: string;
  /** The label of the part of the submission the quote came from, when the submission had several parts. */
  from?: string;
}

/** A link that was part of the submission. AssisTED never opens links. */
export interface NotOpenedLink {
  label: string;
  kind: string;
}

export interface MarkOutcome {
  mark: number;
  ceilingBand: number;
  capped: boolean;
  topicMismatch: boolean;
  mismatchReason: string;
  presenceEvidence?: { criterion: string; level: "required" | "stretch"; quote: string | null; met: boolean; from?: string }[];
  links?: NotOpenedLink[];
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

import type { CompleteOutcome } from "@/lib/markingComplete";

export type CompleteResult = Omit<CompleteOutcome, "checklist"> & {
  checklist: (CompleteOutcome["checklist"][number] & { from?: string })[];
  links?: NotOpenedLink[];
  rubric?: { version: number; source: "file" | "database" };
};
export type ResultData = MarkOutcome | CompleteResult;

export function isCompleteResult(r: ResultData): r is CompleteResult {
  return (r as CompleteResult).gradingMode === "complete";
}

// One muted line under the mark, in banded and Complete / Not complete results.
const STAFF_REVIEW_LINE = "Staff will review the evidence and agree or not as appropriate.";

const READABLE = "max-w-[70ch] break-words";

const PLACEHOLDER_RE = /(\[(?:NAME|EMAIL|PHONE|LINK|ID|ADDRESS|POSTCODE|BUSINESS|REDACTED)\]|\n*\[next cell\]\n*| \| )/;

// Display only: placeholders become small muted chips, and table separators and "[next cell]" become muted markers.
// The stored text is never changed.
function QuoteText({ text }: { text: string }) {
  return (
    <>
      {text.split(PLACEHOLDER_RE).map((part, i) => {
        const ph = /^\[([A-Z]+)\]$/.exec(part);
        if (ph) {
          return (
            <span key={i} className="mx-0.5 inline-block rounded border border-surface-border bg-muted px-1 align-baseline text-[12px] leading-5 font-medium text-ink-2">
              <span className="sr-only">[</span>
              {ph[1]}
              <span className="sr-only">]</span>
            </span>
          );
        }
        if (part === " | ") {
          return (
            <span key={i} aria-hidden="true" className="mx-1 text-ink-2 select-none">
              |
            </span>
          );
        }
        if (/^\n*\[next cell\]\n*$/.test(part)) {
          return (
            <span key={i} aria-hidden="true" className="mx-1 text-[12px] text-ink-2 italic select-none">
              next cell
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function QuoteBlock({ evidence, id }: { evidence: Evidence; id: string }) {
  if (evidence.type === "absence") {
    return (
      <p id={id} className={`border-l-4 border-surface-border bg-field rounded-r-[10px] px-3 py-2 text-sm ${READABLE}`}>
        Not found in the submission: {evidence.text}
      </p>
    );
  }
  return (
    <blockquote id={id} className={`border-l-4 border-surface-border bg-field rounded-r-[10px] px-3 py-2 ${READABLE}`}>
      <span className="block text-sm font-semibold">Quote</span>
      {evidence.from && <span className="block text-sm text-ink-2">From: {evidence.from}</span>}
      <span className="block text-sm whitespace-pre-line">
        &ldquo;<QuoteText text={evidence.text} />&rdquo;
      </span>
    </blockquote>
  );
}

// A compact row. With a quote, the whole row is the toggle (aria-expanded). Without one it is a plain row.
function EvidenceRow({
  panelId,
  icon,
  status,
  text,
  note,
  toggleLabel,
  expanded,
  onToggle,
  children,
}: {
  panelId: string;
  icon: React.ReactNode;
  status: string;
  text?: React.ReactNode;
  note?: string;
  toggleLabel?: string;
  expanded?: boolean;
  onToggle?: () => void;
  children?: React.ReactNode;
}) {
  const content = (
    <>
      <span aria-hidden="true" className="mt-0.5 shrink-0">
        {icon}
      </span>
      <span className={`min-w-0 flex-1 ${READABLE}`}>
        <span className="font-semibold">{status}</span>
        {text ? <span>{": "}{text}</span> : null}
        {note ? <span className="block text-sm text-ink-2">{note}</span> : null}
      </span>
    </>
  );
  return (
    <li className="rounded-[10px] border-2 border-surface-border">
      {onToggle ? (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={onToggle}
          className="flex min-h-11 w-full items-start gap-3 rounded-[8px] px-3 py-2 text-left hover:bg-hover"
        >
          {content}
          <span className="mt-0.5 flex shrink-0 items-center gap-1 text-sm font-medium text-ink-2">
            {toggleLabel}
            <ChevronDown aria-hidden="true" className={cn("size-4 transition-transform duration-150 motion-reduce:transition-none", expanded && "rotate-180")} />
          </span>
        </button>
      ) : (
        <div className="flex min-h-11 items-start gap-3 px-3 py-2">{content}</div>
      )}
      {expanded && children && <div className="px-3 pb-3">{children}</div>}
    </li>
  );
}

function NotOpenedList({ links }: { links?: NotOpenedLink[] }) {
  if (!links || links.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      <h3 className="font-heading text-lg font-semibold">Not opened, please check</h3>
      <p className={`text-sm ${READABLE}`}>AssisTED does not open links, so nothing in these was marked.</p>
      <ul className="list-disc pl-5">
        {links.map((l, i) => (
          <li key={i} className={READABLE}>
            {l.label} <span className="text-sm text-ink-2">({l.kind})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ExpandCollapse({ onExpand, onCollapse }: { onExpand: () => void; onCollapse: () => void }) {
  return (
    <div className="flex gap-1">
      <Button type="button" variant="ghost" size="sm" onClick={onExpand}>
        Expand all
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={onCollapse}>
        Collapse all
      </Button>
    </div>
  );
}

function FeedbackToSend({
  editableFeedback,
  onFeedbackChange,
  aiDraft,
  onCopy,
  copied,
}: {
  editableFeedback: string;
  onFeedbackChange: (value: string) => void;
  /** The text the AI produced, for "Reset to AI draft". */
  aiDraft: string;
  onCopy: () => void;
  copied: boolean;
}) {
  function resetToDraft() {
    if (editableFeedback !== aiDraft && !window.confirm("Replace your edits with the AI draft?")) return;
    onFeedbackChange(aiDraft);
  }

  return (
    <AppCard title="Feedback to send" className="text-base" helper="Edit directly, then copy the result to wherever you send feedback.">
      <div role="note" className="flex flex-col gap-2 rounded-[10px] border-2 border-surface-border bg-field px-4 py-3">
        <p className="text-sm font-semibold">Before you send</p>
        <ul className="flex flex-col gap-1 text-sm">
          {["Check each claim is true of their work", "Make the tone sound like you", "Add anything specific the AI could not know"].map((t) => (
            <li key={t} className="flex items-start gap-2">
              <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              {t}
            </li>
          ))}
        </ul>
      </div>
      <AutoTextarea
        id="editable-feedback"
        aria-label="Feedback to send"
        value={editableFeedback}
        onChange={onFeedbackChange}
        minRows={8}
        maxViewportHeight={0.7}
        className="max-w-[70ch] resize-none"
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={onCopy}>
          {copied ? <ClipboardCheck aria-hidden="true" /> : <ClipboardCopy aria-hidden="true" />}
          {copied ? "Copied" : "Copy feedback"}
        </Button>
        <Button type="button" variant="outline" onClick={resetToDraft} disabled={editableFeedback === aiDraft}>
          <RotateCcw aria-hidden="true" />
          Reset to AI draft
        </Button>
        <p role="status" aria-live="polite" className="sr-only">
          {copied ? "Feedback copied to the clipboard" : ""}
        </p>
      </div>
    </AppCard>
  );
}

function BandedResultCard({
  result,
  editableFeedback,
  onFeedbackChange,
  aiDraft,
  onCopy,
  copied,
}: {
  result: MarkOutcome;
  editableFeedback: string;
  onFeedbackChange: (value: string) => void;
  /** The text the AI produced, for "Reset to AI draft". */
  aiDraft: string;
  onCopy: () => void;
  copied: boolean;
}) {
  const uid = useId();
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const notes = result.markerNotes;
  // Match notes to steps by position; if the counts differ, show no note rather than a wrong one.
  const stepNotes =
    notes?.nextStepNotes && notes.nextStepNotes.length === result.feedback.nextSteps.length ? notes.nextStepNotes : null;
  const presence = result.presenceEvidence ?? [];

  const presenceKeys = presence.map((p, i) => (p.met && p.quote ? `presence-${i}` : null)).filter((k): k is string => k !== null);
  const evidenceKeys = [...(notes?.explanationEvidence ? ["explanation"] : []), ...(stepNotes ? stepNotes.map((_, i) => `step-${i}`) : [])];
  const toggle = (k: string) => setOpen((prev) => ({ ...prev, [k]: !prev[k] }));
  const setMany = (keys: string[], value: boolean) => setOpen((prev) => ({ ...prev, ...Object.fromEntries(keys.map((k) => [k, value])) }));

  const evidenceIcon = (e: Evidence) =>
    e.type === "absence" ? <SearchX className="size-5" /> : <Quote className="size-5" />;
  const evidenceStatus = (e: Evidence) => (e.type === "absence" ? "Not found" : "Quote found");

  return (
    <div className="flex flex-col gap-4">
      {/* a. Summary card */}
      <SummaryCard heading="Result summary">
        {result.topicMismatch ? (
          <p className={`text-base ${READABLE}`}>{result.mismatchReason}</p>
        ) : (
          <p className="font-heading text-4xl font-semibold">
            <span className="sr-only">Mark: </span>
            {result.mark}/4
          </p>
        )}
        <p className="text-[13px]">{STAFF_REVIEW_LINE}</p>
        {(result.capped || result.topicMismatch) && (
          <ul className="flex flex-wrap gap-2" aria-label="Flags">
            {result.capped && <SummaryBadge glyph="▼">Capped</SummaryBadge>}
            {result.topicMismatch && <SummaryBadge glyph="!">May not match the assignment</SummaryBadge>}
          </ul>
        )}
        {result.capped && !result.topicMismatch && (
          <p className={`text-base ${READABLE}`}>
            Mark capped at {result.mark}: a required element was not found in the submission
          </p>
        )}
        {result.rubric?.source === "database" && <p className="text-sm">Rubric v{result.rubric.version}, database</p>}
      </SummaryCard>

      {/* b. For the marker */}
      <AppCard title="For the marker" className="text-base">
        <div className="flex flex-col gap-5">
          <p className={`text-sm ${READABLE}`}>Quotes are copied by the AI. Please check them against the submission.</p>

          {notes?.rationale && (
            <div className="flex flex-col gap-1">
              <h3 className="font-heading text-lg font-semibold">Why this mark</h3>
              <p className={READABLE}>{notes.rationale}</p>
            </div>
          )}

          {presence.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-heading text-lg font-semibold">Presence checks</h3>
                {presenceKeys.length > 0 && <ExpandCollapse onExpand={() => setMany(presenceKeys, true)} onCollapse={() => setMany(presenceKeys, false)} />}
              </div>
              <ul className="flex flex-col gap-2">
                {presence.map((p, i) => {
                  const key = `presence-${i}`;
                  const hasQuote = p.met && !!p.quote;
                  const panelId = `${uid}-${key}-panel`;
                  return (
                    <EvidenceRow
                      key={key}
                      panelId={panelId}
                      icon={p.met ? <Check className="size-5" /> : <X className="size-5" />}
                      status={p.met ? "Found" : "Not found"}
                      text={
                        <>
                          {p.criterion}
                          <span className="text-sm text-ink-2"> ({p.level === "required" ? "required" : "stretch goal"})</span>
                        </>
                      }
                      toggleLabel={hasQuote ? "View quote" : undefined}
                      expanded={!!open[key]}
                      onToggle={hasQuote ? () => toggle(key) : undefined}
                    >
                      {hasQuote && <QuoteBlock evidence={{ type: "quote", text: p.quote!, from: p.from }} id={panelId} />}
                    </EvidenceRow>
                  );
                })}
              </ul>
            </div>
          )}

          <NotOpenedList links={result.links} />

          {evidenceKeys.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-heading text-lg font-semibold">Evidence for the feedback</h3>
                <ExpandCollapse onExpand={() => setMany(evidenceKeys, true)} onCollapse={() => setMany(evidenceKeys, false)} />
              </div>
              <ul className="flex flex-col gap-2">
                {notes?.explanationEvidence && (
                  <EvidenceRow
                    panelId={`${uid}-explanation-panel`}
                    icon={evidenceIcon(notes.explanationEvidence)}
                    status={evidenceStatus(notes.explanationEvidence)}
                    text="Explanation of the mark"
                    toggleLabel={notes.explanationEvidence.type === "absence" ? "View note" : "View quote"}
                    expanded={!!open.explanation}
                    onToggle={() => toggle("explanation")}
                  >
                    <QuoteBlock evidence={notes.explanationEvidence} id={`${uid}-explanation-panel`} />
                  </EvidenceRow>
                )}
                {stepNotes?.map((note, i) => (
                  <EvidenceRow
                    key={i}
                    panelId={`${uid}-step-${i}-panel`}
                    icon={evidenceIcon(note.evidence)}
                    status={evidenceStatus(note.evidence)}
                    text={`Next step ${i + 1}: ${result.feedback.nextSteps[i]}`}
                    note={note.why}
                    toggleLabel={note.evidence.type === "absence" ? "View note" : "View quote"}
                    expanded={!!open[`step-${i}`]}
                    onToggle={() => toggle(`step-${i}`)}
                  >
                    <QuoteBlock evidence={note.evidence} id={`${uid}-step-${i}-panel`} />
                  </EvidenceRow>
                ))}
              </ul>
            </div>
          )}
        </div>
      </AppCard>

      {/* c. One editable surface: the AI draft, pre-filled */}
      <FeedbackToSend editableFeedback={editableFeedback} onFeedbackChange={onFeedbackChange} aiDraft={aiDraft} onCopy={onCopy} copied={copied} />
    </div>
  );
}

const STATUS_TEXT = { met: "Met", not_met: "Not found", needs_marker_check: "Needs your check" } as const;

function CompleteResultCard({
  result,
  editableFeedback,
  onFeedbackChange,
  aiDraft,
  onCopy,
  copied,
}: {
  result: CompleteResult;
  editableFeedback: string;
  onFeedbackChange: (value: string) => void;
  aiDraft: string;
  onCopy: () => void;
  copied: boolean;
}) {
  const uid = useId();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const notes = result.markerNotes;
  const stepNotes = notes?.nextStepNotes && notes.nextStepNotes.length === result.feedback.nextSteps.length ? notes.nextStepNotes : null;
  const quoteKeys = result.checklist.map((l, i) => (l.status === "met" && l.quote ? `item-${i}` : null)).filter((k): k is string => k !== null);
  const evidenceKeys = [...(notes?.evidence ? ["explanation"] : []), ...(stepNotes ? stepNotes.map((_, i) => `step-${i}`) : [])];
  const toggle = (k: string) => setOpen((prev) => ({ ...prev, [k]: !prev[k] }));
  const setMany = (keys: string[], value: boolean) => setOpen((prev) => ({ ...prev, ...Object.fromEntries(keys.map((k) => [k, value])) }));
  const complete = result.outcome === "complete";
  const unverified = result.checklist.filter((l) => l.quoteNotFound);

  const evidenceIcon = (e: Evidence) => (e.type === "absence" ? <SearchX className="size-5" /> : <Quote className="size-5" />);
  const evidenceStatus = (e: Evidence) => (e.type === "absence" ? "Not found" : "Quote found");

  return (
    <div className="flex flex-col gap-4">
      <SummaryCard heading="Result summary">
        {result.topicMismatch ? (
          <p className={`text-base ${READABLE}`}>{result.mismatchReason}</p>
        ) : (
          <p className="font-heading text-3xl font-semibold">
            <span className="sr-only">Outcome: </span>
            {complete ? "Complete" : "Not complete"}
          </p>
        )}
        <p className="text-[13px]">{STAFF_REVIEW_LINE}</p>
        <ul className="flex flex-wrap gap-2" aria-label="Flags">
          <SummaryBadge glyph={complete ? "✓" : "○"}>{complete ? "Complete" : "Not complete"}</SummaryBadge>
          {result.needsMarkerCheck.length > 0 && <SummaryBadge glyph="?">Needs your check</SummaryBadge>}
          {result.topicMismatch && <SummaryBadge glyph="!">May not match the assignment</SummaryBadge>}
        </ul>
        {result.rubric?.source === "database" && <p className="text-sm">Rubric v{result.rubric.version}, database</p>}
      </SummaryCard>

      <AppCard title="For the marker" className="text-base">
        <div className="flex flex-col gap-5">
          <p className={`text-sm ${READABLE}`}>
            The outcome is worked out by the app from the checklist below. A tick counts only when the AI&rsquo;s quote is found in the submission. Please check the quotes against the submission.
          </p>

          {notes?.rationale && (
            <div className="flex flex-col gap-1">
              <h3 className="font-heading text-lg font-semibold">Why this outcome</h3>
              <p className={READABLE}>{notes.rationale}</p>
            </div>
          )}

          {unverified.length > 0 && (
            <p role="note" className={`rounded-[10px] border-2 border-surface-border bg-field px-3 py-2 text-sm ${READABLE}`}>
              The AI said {unverified.length === 1 ? "one item was" : `${unverified.length} items were`} met but its quote could not be found in the submission, so{" "}
              {unverified.length === 1 ? "it is" : "they are"} shown as not found. The feedback draft below may describe {unverified.length === 1 ? "it" : "them"} as done, so please check.
            </p>
          )}

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-heading text-lg font-semibold">Checklist</h3>
              {quoteKeys.length > 0 && <ExpandCollapse onExpand={() => setMany(quoteKeys, true)} onCollapse={() => setMany(quoteKeys, false)} />}
            </div>
            <ul className="flex flex-col gap-2">
              {result.checklist.map((l, i) => {
                const key = `item-${i}`;
                const hasQuote = l.status === "met" && !!l.quote;
                const panelId = `${uid}-${key}-panel`;
                return (
                  <EvidenceRow
                    key={key}
                    panelId={panelId}
                    icon={l.status === "met" ? <Check className="size-5" /> : l.status === "needs_marker_check" ? <SearchX className="size-5" /> : <X className="size-5" />}
                    status={STATUS_TEXT[l.status]}
                    text={l.item}
                    toggleLabel={hasQuote ? "View quote" : undefined}
                    expanded={!!open[key]}
                    onToggle={hasQuote ? () => toggle(key) : undefined}
                  >
                    {hasQuote && <QuoteBlock evidence={{ type: "quote", text: l.quote!, from: l.from }} id={panelId} />}
                  </EvidenceRow>
                );
              })}
            </ul>
          </div>

          <NotOpenedList links={result.links} />

          {result.needsMarkerCheck.length > 0 && (
            <div className="flex flex-col gap-1">
              <h3 className="font-heading text-lg font-semibold">Needs your check</h3>
              <p className={`text-sm ${READABLE}`}>These could not be checked from the text, for example because they are in a link or another file. They do not change the outcome.</p>
              <ul className="list-disc pl-5">
                {result.needsMarkerCheck.map((item) => (
                  <li key={item} className={READABLE}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {evidenceKeys.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-heading text-lg font-semibold">Evidence for the feedback</h3>
                <ExpandCollapse onExpand={() => setMany(evidenceKeys, true)} onCollapse={() => setMany(evidenceKeys, false)} />
              </div>
              <ul className="flex flex-col gap-2">
                {notes?.evidence && (
                  <EvidenceRow
                    panelId={`${uid}-explanation-panel`}
                    icon={evidenceIcon(notes.evidence)}
                    status={evidenceStatus(notes.evidence)}
                    text="Explanation of the outcome"
                    toggleLabel={notes.evidence.type === "absence" ? "View note" : "View quote"}
                    expanded={!!open.explanation}
                    onToggle={() => toggle("explanation")}
                  >
                    <QuoteBlock evidence={notes.evidence} id={`${uid}-explanation-panel`} />
                  </EvidenceRow>
                )}
                {stepNotes?.map((note, i) => (
                  <EvidenceRow
                    key={i}
                    panelId={`${uid}-step-${i}-panel`}
                    icon={evidenceIcon(note.evidence)}
                    status={evidenceStatus(note.evidence)}
                    text={`Next step ${i + 1}: ${result.feedback.nextSteps[i]}`}
                    note={note.why}
                    toggleLabel={note.evidence.type === "absence" ? "View note" : "View quote"}
                    expanded={!!open[`step-${i}`]}
                    onToggle={() => toggle(`step-${i}`)}
                  >
                    <QuoteBlock evidence={note.evidence} id={`${uid}-step-${i}-panel`} />
                  </EvidenceRow>
                ))}
              </ul>
            </div>
          )}
        </div>
      </AppCard>

      <FeedbackToSend editableFeedback={editableFeedback} onFeedbackChange={onFeedbackChange} aiDraft={aiDraft} onCopy={onCopy} copied={copied} />
    </div>
  );
}

export default function ResultCard(props: {
  result: ResultData;
  editableFeedback: string;
  onFeedbackChange: (value: string) => void;
  /** The text the AI produced, for "Reset to AI draft". */
  aiDraft: string;
  onCopy: () => void;
  copied: boolean;
}) {
  const { result, ...rest } = props;
  return isCompleteResult(result) ? <CompleteResultCard result={result} {...rest} /> : <BandedResultCard result={result} {...rest} />;
}
