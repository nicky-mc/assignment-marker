import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { anthropic } from "./anthropic";
import { BAND_DESCRIPTIONS, Rubric } from "./rubrics";
import { computeBand } from "./scoring";

export const MarkingResultSchema = z.object({
  topicMismatch: z
    .boolean()
    .describe(
      "True if the submission does not actually address this assignment's topic/requirements at all (e.g. it looks like it was written for a different assignment).",
    ),
  mismatchReason: z
    .string()
    .describe("If topicMismatch is true, a one-sentence explanation of what the submission actually appears to be. Empty string otherwise."),
  bandReasoning: z
    .string()
    .describe(
      "Reason through this before scoring: state which band the submission best fits and why, then explicitly consider whether a reasonable second marker could genuinely argue for the adjacent band above or below instead. Decide this before boundaryCase and rawScore below, since they must follow from this reasoning rather than the other way round.",
    ),
  boundaryCase: z
    .boolean()
    .describe(
      "True only if bandReasoning above found a genuine case for two adjacent bands (a reasonable second marker could argue either way), not merely a minor quality difference within one band. False if one band is clearly the best fit and you would not expect a second marker to disagree.",
    ),
  boundaryBandLower: z
    .number()
    .nullable()
    .describe(
      "If boundaryCase is true, the lower of the two adjacent band numbers in tension (e.g. 2 if torn between band 2 and band 3). Null if boundaryCase is false.",
    ),
  boundaryBandUpper: z
    .number()
    .nullable()
    .describe(
      "If boundaryCase is true, the higher of the two adjacent band numbers in tension (e.g. 3 if torn between band 2 and band 3). Null if boundaryCase is false.",
    ),
  rawScore: z
    .number()
    .describe(
      "Score from 0 to 4 in increments of 0.1, consistent with bandReasoning and boundaryCase above. If boundaryCase is false, use a whole number. If boundaryCase is true, use a decimal near the midpoint between boundaryBandLower and boundaryBandUpper (e.g. 2.4-2.6 for bands 2 and 3, 0.4-0.6 for bands 0 and 1).",
    ),
  feedback: z.object({
    recognition: z.string().describe("One or two sentences recognising the learner's effort and achievement."),
    explanation: z.string().describe("One or two sentences explaining why this mark was awarded, tied to the rubric."),
    nextSteps: z
      .array(z.string())
      .min(2)
      .max(4)
      .describe("Two to four concrete, bullet-pointed next steps for future assignments."),
    motivation: z.string().describe("One sentence of encouragement/motivation for future assignments."),
  }),
});

export type MarkingResult = z.infer<typeof MarkingResultSchema>;

export interface MarkOutcome {
  rawScore: number;
  mark: number;
  borderline: boolean;
  /** The model's own reasoning about which band(s) fit, written before boundaryCase/rawScore. Surfaced for review/debugging; not currently shown in the UI. */
  bandReasoning: string;
  /** The model's own explicit boundary-case judgement, from bandReasoning above. Primary signal behind `borderline`. */
  boundaryCase: boolean;
  /** The two adjacent band numbers in tension, e.g. [2, 3]. Null when boundaryCase is false. */
  boundaryBands: [number, number] | null;
  topicMismatch: boolean;
  mismatchReason: string;
  feedback: MarkingResult["feedback"];
}

function buildSystemPrompt(rubric: Rubric): string {
  const bands = rubric.bandDescriptions ?? BAND_DESCRIPTIONS;
  return `You are marking assignments for Tech Educators, following their Assessment Recording and Marking Policy.

Mark on a 0-4 scale, using the band descriptions for this specific assignment:
${bands.map((b) => `- ${b}`).join("\n")}

Marking approach:
- Look for reasons to give marks, rather than reasons not to.
- Mark strictly against the band descriptions above, which are specific to this assignment.
- If the submission clearly is not attempting this assignment (wrong topic entirely), set topicMismatch to true and explain what it looks like instead - do not force a confident score onto unrelated content.
- Work through bandReasoning first: state which band the submission best fits and why, then explicitly consider whether a reasonable second marker could genuinely argue for the adjacent band above or below instead. This applies at every boundary (0/1, 1/2, 2/3, 3/4), not just one midpoint - work through whichever adjacent pair is actually in play for this submission.
- Only after that reasoning is written down, decide boundaryCase: true if you found a genuine case for two adjacent bands, false if one band is clearly the best fit and you would not expect a second marker to disagree. If true, set boundaryBandLower/boundaryBandUpper to the two band numbers in tension.
- Finally, set rawScore consistent with that decision: a whole number when boundaryCase is false, or a decimal near the midpoint between boundaryBandLower and boundaryBandUpper when boundaryCase is true, to flag it for human moderation per the policy's second-marking practice.

Feedback should:
- Recognise effort and achievement first.
- Explain the mark in relation to the band descriptions.
- Give two to four next steps, not more (avoid overwhelming the learner).
- End with brief motivation for future assignments.
- Always be positive in tone, with clear ways to improve.
- Never use em-dashes. Use full stops, commas, or colons instead.`;
}

function buildUserPrompt(rubric: Rubric, anonymisedSubmission: string): string {
  return `Assignment: ${rubric.week} - ${rubric.title}

Overview: ${rubric.overview}

Requirements for 3/4 (meets expectations): ${rubric.requirements}

Stretch goal for 4/4: ${rubric.stretchGoal}

--- Learner submission (anonymised) ---
${anonymisedSubmission}
--- end submission ---

Mark this submission against the assignment above.`;
}

export async function markSubmission(rubric: Rubric, anonymisedSubmission: string): Promise<MarkOutcome> {
  const response = await anthropic.messages.parse({
    model: "claude-opus-4-8",
    max_tokens: 2000,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "high",
      format: zodOutputFormat(MarkingResultSchema),
    },
    system: buildSystemPrompt(rubric),
    messages: [{ role: "user", content: buildUserPrompt(rubric, anonymisedSubmission) }],
  });

  if (!response.parsed_output) {
    throw new Error("Marking model did not return a parsable result");
  }

  const result = response.parsed_output;
  const { mark, borderline } = computeBand(result.rawScore, result.boundaryCase);
  const boundaryBands: [number, number] | null =
    result.boundaryCase && result.boundaryBandLower !== null && result.boundaryBandUpper !== null
      ? [result.boundaryBandLower, result.boundaryBandUpper]
      : null;

  return {
    rawScore: result.rawScore,
    mark,
    borderline,
    bandReasoning: result.bandReasoning,
    boundaryCase: result.boundaryCase,
    boundaryBands,
    topicMismatch: result.topicMismatch,
    mismatchReason: result.mismatchReason,
    feedback: result.feedback,
  };
}
