import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { anthropic } from "./anthropic";
import { BAND_DESCRIPTIONS, Rubric } from "./rubrics";
import { computeBand } from "./scoring";

export const MarkingResultSchema = z.object({
  rawScore: z
    .number()
    .describe(
      "Score from 0 to 4 in increments of 0.1. Use a whole number when confidently in one band. Use a decimal near X.5 (e.g. 2.5, 2.6) when the submission sits on the boundary between band X and band X+1.",
    ),
  topicMismatch: z
    .boolean()
    .describe(
      "True if the submission does not actually address this assignment's topic/requirements at all (e.g. it looks like it was written for a different assignment).",
    ),
  mismatchReason: z
    .string()
    .describe("If topicMismatch is true, a one-sentence explanation of what the submission actually appears to be. Empty string otherwise."),
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
  topicMismatch: boolean;
  mismatchReason: string;
  feedback: MarkingResult["feedback"];
}

const SYSTEM_PROMPT = `You are marking AI Literacy assignments for Tech Educators, following their Assessment Recording and Marking Policy.

Mark on a 0-4 scale:
${BAND_DESCRIPTIONS.map((b) => `- ${b}`).join("\n")}

Marking approach:
- Look for reasons to give marks, rather than reasons not to.
- Mark against the assignment's stated requirements; award a 4 only if the stretch goal is also achieved.
- If the submission clearly is not attempting this assignment (wrong topic entirely), set topicMismatch to true and explain what it looks like instead - do not force a confident score onto unrelated content.
- Before settling on a whole-number score, explicitly consider whether a reasonable second marker could argue for the band above or below. If you can construct a genuine case for either of two adjacent bands, that is a boundary case: you MUST output a decimal score close to the midpoint (e.g. 2.4-2.6) rather than forcing a whole number, to flag it for human moderation, per the policy's second-marking practice. Reserve whole numbers for submissions where one band is clearly the best fit and you would not expect a second marker to disagree.

Feedback should:
- Recognise effort and achievement first.
- Explain the mark in relation to the rubric.
- Give two to four next steps, not more (avoid overwhelming the learner).
- End with brief motivation for future assignments.
- Always be positive in tone, with clear ways to improve.`;

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
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(rubric, anonymisedSubmission) }],
  });

  if (!response.parsed_output) {
    throw new Error("Marking model did not return a parsable result");
  }

  const result = response.parsed_output;
  const { mark, borderline } = computeBand(result.rawScore);

  return {
    rawScore: result.rawScore,
    mark,
    borderline,
    topicMismatch: result.topicMismatch,
    mismatchReason: result.mismatchReason,
    feedback: result.feedback,
  };
}
