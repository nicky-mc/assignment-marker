// Marking for "complete / not complete" rubrics: the submission is checked against a checklist.
// The model reports evidence per checklist line; the outcome is derived here in code, never by the model.
// There is no score, band, borderline flag or ceiling in this mode. The banded path lives in lib/marking.ts and is untouched.
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { anthropic } from "./anthropic";
import type { Rubric } from "./rubrics";
import { TONE_GUIDE } from "./toneGuide";

const EvidenceSchema = z.object({
  type: z.enum(["quote", "absence"]).describe('Exactly "quote" if text is copied from the submission, or exactly "absence" if text describes something expected that was not found.'),
  text: z
    .string()
    .describe(
      "If type is quote: about 5 to 25 words copied exactly from the submission, never invented. If type is absence: one short plain sentence saying what was expected and not found.",
    ),
});

export const CompleteResultSchema = z.object({
  topicMismatch: z
    .boolean()
    .describe("True if the submission does not actually address this assignment at all (for example it looks like it was written for a different assignment)."),
  mismatchReason: z
    .string()
    .describe("If topicMismatch is true, a one-sentence explanation of what the submission actually appears to be. Empty string otherwise."),
  checklistEvidence: z
    .array(
      z.object({
        item: z.string().describe("The checklist line, copied exactly as it appears in the assignment details. One entry per checklist line, in the same order."),
        cannotVerify: z
          .boolean()
          .describe(
            "True only if this item cannot be judged from the submission text because what it asks for lives only in a link, another file, an image or an attachment that the text merely points to. False whenever the submission text itself shows the item is present or absent.",
          ),
        quote: z
          .string()
          .nullable()
          .describe(
            "The exact text copied from the submission that satisfies this item. Must be genuine and verbatim, not a paraphrase or inference. Null if no such text exists. If cannotVerify is true, the text that points to the link or file, or null.",
          ),
        met: z.boolean().describe("True only if quote is a genuine quote that satisfies the item. Must be false whenever quote is null or cannotVerify is true."),
      }),
    )
    .describe(
      "Before any other reasoning: one entry for every checklist line. For each, quote the exact submission text that satisfies it, or set quote to null and met to false if you cannot find it anywhere in the text. Do not infer that something exists because the rest of the submission is strong.",
    ),
  outcomeReasoning: z
    .string()
    .describe(
      "Reason through the checklist evidence above in a few sentences: which items are met, which are not yet included, and which could not be verified. Do not state a final complete or not complete decision: the app works that out from checklistEvidence.",
    ),
  feedback: z.object({
    recognition: z.string().describe("One or two sentences recognising the learner's effort and achievement."),
    explanation: z.string().describe("One or two sentences explaining where the work stands against the checklist, tied to the checklist items."),
    nextSteps: z.array(z.string()).min(2).max(4).describe("Two to four concrete, bullet-pointed next steps. If anything is not yet included, these say what to add."),
    motivation: z.string().describe("One sentence of encouragement/motivation for future assignments."),
  }),
  markerNotes: z
    .object({
      rationale: z
        .string()
        .describe(
          "For the marker only, never sent to the learner. 2 to 4 short sentences in plain everyday English restating the reasoning already in checklistEvidence and outcomeReasoning. Do not introduce any new reason.",
        ),
      evidence: EvidenceSchema.describe("Evidence from the submission that backs up feedback.explanation."),
      nextStepNotes: z
        .array(
          z.object({
            evidence: EvidenceSchema.describe("Evidence from the submission that relates to this next step."),
            why: z.string().describe("One plain sentence on why this next step will help this learner."),
          }),
        )
        .describe("Exactly one entry per item in feedback.nextSteps, in the same order."),
    })
    .describe("Notes for the marker only. Written after feedback. Never repeated in or copied into feedback."),
});

export type CompleteResult = z.infer<typeof CompleteResultSchema>;

export type ChecklistStatus = "met" | "not_met" | "needs_marker_check";

export interface ChecklistLine {
  /** The checklist line exactly as in the rubric. */
  item: string;
  status: ChecklistStatus;
  /** Only a quote that was found in the submission. Null otherwise. */
  quote: string | null;
  /** The model said this was met, but its quote was not found in the submission, so it counts as not met. */
  quoteNotFound: boolean;
}

export interface CompleteOutcome {
  gradingMode: "complete";
  /** Derived in code: "complete" if every verifiable item is met (and at least one was verified), otherwise "not_complete". */
  outcome: "complete" | "not_complete";
  topicMismatch: boolean;
  mismatchReason: string;
  checklist: ChecklistLine[];
  /** Checklist lines that could not be checked from the text. They never cause not_complete. */
  needsMarkerCheck: string[];
  outcomeReasoning: string;
  feedback: CompleteResult["feedback"];
  markerNotes: CompleteResult["markerNotes"];
}

/** Lower case, whitespace removed, curly quotes made straight: how a quote is compared with the submission. */
export function normaliseForQuote(s: string): string {
  return s
    .replace(/[‘’‛]/g, "'")
    .replace(/[“”‟]/g, '"')
    .replace(/\s+/g, "")
    .toLowerCase();
}

export function quoteIsInSubmission(quote: string | null | undefined, submission: string): boolean {
  if (!quote) return false;
  const q = normaliseForQuote(quote);
  return q.length > 0 && normaliseForQuote(submission).includes(q);
}

/**
 * Turns the model's per-line evidence into the final checklist, outcome and needs-marker-check list.
 * A line counts as met only if the model said met AND its quote is found in the submission. A line the model
 * marked cannotVerify (and that is not verifiably met) never causes not_complete. Lines are matched by their exact
 * text, or by position when the model returned the right number of entries; a line the model did not return is not met.
 */
export function deriveOutcome(
  checklist: readonly string[],
  evidence: CompleteResult["checklistEvidence"],
  submission: string,
): Pick<CompleteOutcome, "outcome" | "checklist" | "needsMarkerCheck"> {
  const byText = new Map(evidence.map((e) => [normaliseForQuote(e.item), e]));
  const positional = evidence.length === checklist.length;
  const lines: ChecklistLine[] = checklist.map((item, i) => {
    const e = byText.get(normaliseForQuote(item)) ?? (positional ? evidence[i] : undefined);
    if (!e) return { item, status: "not_met", quote: null, quoteNotFound: false };
    const verified = e.met && quoteIsInSubmission(e.quote, submission);
    if (verified) return { item, status: "met", quote: e.quote, quoteNotFound: false };
    if (e.cannotVerify) return { item, status: "needs_marker_check", quote: null, quoteNotFound: false };
    return { item, status: "not_met", quote: null, quoteNotFound: e.met };
  });
  const verifiable = lines.filter((l) => l.status !== "needs_marker_check");
  const outcome = verifiable.length > 0 && verifiable.every((l) => l.status === "met") ? "complete" : "not_complete";
  return { outcome, checklist: lines, needsMarkerCheck: lines.filter((l) => l.status === "needs_marker_check").map((l) => l.item) };
}

// Prompt caching, as in lib/marking.ts: a stable prefix and a variable tail, in this order.
//   1. system block: instructions, schema guidance and tone guide (identical for every call). Breakpoint.
//   2. user block 1: this assignment's details and checklist (identical for every call on the same rubric). Breakpoint.
//   3. user block 2: the submission (varies per call). No breakpoint.
function buildSystemPrompt(): string {
  return `You are checking assignments for Tech Educators against a checklist, following their Assessment Recording and Marking Policy. This assignment is graded complete or not complete. There is no mark, score or band: never mention one.

Checking approach:
- Look for reasons to credit the work, rather than reasons not to.
- Judge each checklist item by what the work does, not by the words it uses. Accept equivalent labels, synonyms, layouts and formats (a table, headings, bullet groups, paragraphs, a table pasted as text). Credit the substance when it is clearly present.
- Set topicMismatch to true only when the content is about something different from this assignment (wrong topic entirely), and explain what it looks like instead. The absence of the assignment's own terms or headings is not a reason to flag a mismatch. When unsure, do not flag a mismatch. Write mismatchReason in the marker-facing voice described at the end of the tone guide below.
- Before any other reasoning, work through checklistEvidence: one entry for every checklist line in the assignment details, in the same order, with the item text copied exactly. For each, quote the exact submission text that satisfies it, or set quote to null and met to false if you cannot find it anywhere in the text. Do not infer that something exists because the rest of the submission reads as strong or complete. A quote must be copied exactly from the submission, never paraphrased or tidied up.
- Use cannotVerify only when an item cannot be judged from the submission text because what it asks for lives only in a link, another file, an image or an attachment that the text merely points to. If the text itself shows the item is present or absent, cannotVerify is false. Never use cannotVerify to avoid a judgement you can make from the text.
- Then write outcomeReasoning: which items are met, which are not yet included, and which could not be verified. Do not decide whether the work is complete: the app works that out from checklistEvidence.
- If the submission includes a reflection, refer to it in the feedback. A missing reflection never makes work not complete unless a checklist item asks for one.

Feedback should:
- Recognise effort and achievement first.
- Explain where the work stands against the checklist, in line with checklistEvidence. If every item you could check is met, say the work is complete. If any item is not yet included, describe the work as "not yet complete" and say what to add next. Never use "fail", "failed" or "not complete" on its own in feedback.
- Give two to four next steps, not more (avoid overwhelming the learner). If the work is complete, they are optional ideas for building further.
- End with brief motivation for future assignments.
- Always be positive in tone, with clear ways to improve.
- Never use em-dashes. Use full stops, commas, or colons instead.
- Write the feedback object following the tone guide below, in British English.

Tone guide (applies only to mismatchReason, the feedback object and markerNotes, never to checklistEvidence or outcomeReasoning):
${TONE_GUIDE}

Marker notes (markerNotes, written after feedback, for the marker only and never sent to the learner):
- Use plain English: everyday words, short sentences, no rubric jargon. A busy marker should be able to read it in 20 seconds.
- rationale: 2 to 4 sentences restating the reasoning already in checklistEvidence and outcomeReasoning in plain words. Do not introduce any new reason. Mention any item that could not be verified so the marker can check it.
- evidence: evidence from the submission for the explanation in the feedback.
- nextStepNotes: exactly one entry per next step, in the same order as feedback.nextSteps. Each has the evidence first, then why: one plain sentence on why that step will help this learner.
- Evidence of type "quote" must be copied exactly from the submission, about 5 to 25 words. Never invent or tidy up a quote. Evidence of type "absence" says what was expected and not found.
- Never use em-dashes in markerNotes either.
- Write markerNotes (the rationale and each "why") in the marker-facing voice described at the end of the tone guide above, in British English.`;
}

function buildRubricPrompt(rubric: Rubric): string {
  return `Assignment: ${rubric.week} - ${rubric.title}

Overview: ${rubric.overview}

Requirements: ${rubric.requirements}

Checklist (copy each line exactly into checklistEvidence, in this order):
${(rubric.checklist ?? []).map((c) => `- ${c}`).join("\n")}

`;
}

function buildSubmissionPrompt(anonymisedSubmission: string): string {
  return `--- Learner submission (anonymised) ---
${anonymisedSubmission}
--- end submission ---

Check this submission against the checklist above.`;
}

// Usage metadata only, in the same line format as lib/marking.ts so the batch runner reads it. Never log the
// submission, the model's reasoning or any feedback text, and never log an error message.
function logUsage(rubricId: string, stopReason: string, u: { input: number | null; cacheCreation: number | null; cacheRead: number | null; output: number | null }) {
  const n = (v: number | null) => v ?? "n/a";
  console.log(
    `[marking] ${new Date().toISOString()} rubric=${rubricId} stop_reason=${stopReason} input_tokens=${n(u.input)} cache_creation_input_tokens=${n(u.cacheCreation)} cache_read_input_tokens=${n(u.cacheRead)} output_tokens=${n(u.output)}`,
  );
}

export async function markComplete(rubric: Rubric, anonymisedSubmission: string): Promise<CompleteOutcome> {
  const checklist = rubric.checklist ?? [];
  if (rubric.gradingMode !== "complete" || checklist.length === 0) {
    throw new Error("This rubric has no checklist, so it cannot be checked.");
  }

  const response = await anthropic.messages
    .parse({
      model: "claude-opus-4-8",
      max_tokens: 6000,
      thinking: { type: "adaptive" },
      output_config: {
        effort: "high",
        format: zodOutputFormat(CompleteResultSchema),
      },
      system: [{ type: "text", text: buildSystemPrompt(), cache_control: { type: "ephemeral" } }],
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: buildRubricPrompt(rubric), cache_control: { type: "ephemeral" } },
            { type: "text", text: buildSubmissionPrompt(anonymisedSubmission) },
          ],
        },
      ],
    })
    .catch((err: unknown) => {
      logUsage(rubric.id, `none(${err instanceof Error ? err.name : "unknown"})`, { input: null, cacheCreation: null, cacheRead: null, output: null });
      throw err;
    });

  logUsage(rubric.id, String(response.stop_reason), {
    input: response.usage.input_tokens,
    cacheCreation: response.usage.cache_creation_input_tokens,
    cacheRead: response.usage.cache_read_input_tokens,
    output: response.usage.output_tokens,
  });

  if (!response.parsed_output) {
    throw new Error(`Marking model did not return a parsable result (stop_reason=${response.stop_reason}, output_tokens=${response.usage.output_tokens})`);
  }

  const result = response.parsed_output;
  const derived = deriveOutcome(checklist, result.checklistEvidence, anonymisedSubmission);
  return {
    gradingMode: "complete",
    ...derived,
    topicMismatch: result.topicMismatch,
    mismatchReason: result.mismatchReason,
    outcomeReasoning: result.outcomeReasoning,
    feedback: result.feedback,
    markerNotes: result.markerNotes,
  };
}
