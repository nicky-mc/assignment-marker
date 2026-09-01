# Boundary test results — AI Literacy & Digital Marketing with AI

Read-only measurement exercise. All 10 submissions in [boundary-test-submissions-ail-dmai.md](boundary-test-submissions-ail-dmai.md) were run through the live dev server's `/api/mark` route (same code path production uses). No production file (`lib/rubrics.ts`, `lib/marking.ts`, `lib/scoring.ts`, the API route) was modified — `computeBand`'s rounding and 0.4-0.6 borderline threshold are untouched, per instructions.

## Results table

| Assignment | Raw Score | Mark | Borderline? |
|---|---|---|---|
| wk1-evaluate-llm-output | 1.8 | 2 | No |
| wk2-swot-ai-industry | 1.3 | 1 | No |
| wk3-risk-appetite | 1.0 | 1 | No |
| wk5-pov-statement | 1.2 | 1 | No |
| dmai-wk1-ceo-audit | 1.0 | 1 | No |
| dmai-wk4-digital-deep-dive | 1.0 | 1 | No |
| dmai-wk5-personas | 1.0 | 1 | No |
| dmai-wk6-email-campaigns | 1.0 | 1 | No |
| dmai-wk7-content-plan | 1.8 | 2 | No |
| dmai-wk9-more-reach | 1.9 | 2 | No |

## Per-course summary

**AI Literacy (4 submissions)**
- Average raw score: 1.325 ((1.8 + 1.3 + 1.0 + 1.2) / 4)
- Landed in 1.4-1.6 range: **0/4**

**Digital Marketing with AI (6 submissions)**
- Average raw score: 1.283 ((1.0 + 1.0 + 1.0 + 1.0 + 1.8 + 1.9) / 6)
- Landed in 1.4-1.6 range: **0/6**

**Combined: 0/10 landed in the 1.4-1.6 range.**

## Comparison to DI boundary results

In the DI run (`di-test-results.md`), the two Band 1 mismatches scored raw 1.5 and 1.6 — both inside the 0.4-0.6 fractional borderline window, both flagged Borderline, both rounding up to mark 2.

None of the 10 AIL/DMAI submissions here reproduced that pattern. Instead the raw scores split into two clusters with a gap through the 1.4-1.6 zone:
- 5/10 landed at exactly 1.0 (mark 1, not borderline)
- 2/10 landed at 1.2-1.3 (mark 1, not borderline)
- 3/10 landed at 1.8-1.9 (mark 2, not borderline)

No submission in this batch triggered the Borderline flag at all.

## Hypothesis assessment

**Not confirmed.** The specific 1.4-1.6 raw-score clustering that produced the two DI mismatches does not appear in this AIL/DMAI batch — no case landed in that range, and no case was flagged Borderline. Reporting the numbers as instructed, without speculating on why the DI rubrics produced boundary-hugging scores here and these did not.

## Feedback detail for confidently-overscored cases (1.8-1.9, not borderline)

Reproducibility check: the three submissions that scored raw 1.8-1.9 (mark 2, not borderline) were re-run through the same `/api/mark` code path a second time, on separate calls, to check whether the score and reasoning hold up. `wk1-evaluate-llm-output` and `dmai-wk7-content-plan` reproduced raw 1.8 exactly; `dmai-wk9-more-reach` returned raw 1.8 on the re-run versus 1.9 originally (both round to mark 2, neither borderline) — a small run-to-run drift consistent with normal LLM output variance, not a code-path issue.

### wk1-evaluate-llm-output (raw 1.8, mark 2, not borderline)

```json
{
  "recognition": "Well done for engaging with the task, writing about your own role, and generating an LLM version to compare against it.",
  "explanation": "The band descriptions place this between an attempt that shows limited understanding and an incomplete-but-developing response: you make a comparison and a judgement, but the evaluation is well under the 50 to 100 word guide and does not yet explore readability, engagement, or whether either version reads as human or AI-written.",
  "nextSteps": [
    "Expand your evaluation to the 50 to 100 word range so you have room to justify your view.",
    "Explain why the AI version felt more professional, using specific features such as tone, structure, or word choice.",
    "Comment on readability and engagement for both pieces, and say which one reads as more human.",
    "For the stretch goal, add one or two concrete ways you could improve the AI output, or show an edit you made."
  ],
  "motivation": "You have made a solid start, and with a little more detail your evaluations will really shine in the coming weeks."
}
```

### dmai-wk7-content-plan (raw 1.8, mark 2, not borderline)

```json
{
  "recognition": "You have made a start by identifying three different content types: a blog post, an Instagram post, and a video, which shows you understand that a plan can mix content formats.",
  "explanation": "This sits between attempted and incomplete: you have named relevant content pieces, but there is no detail and none of the content plan template areas have been used or explained, so it does not yet meet the requirement for three fully described pieces of content.",
  "nextSteps": [
    "Use the content plan template and work through each of its areas for every piece of content, rather than leaving details for later.",
    "Fully describe your three pieces of content, including the goal, audience, and message for each.",
    "Link each piece of content to a specific marketing or business goal so the plan clearly supports your aims.",
    "Aim for the stretch goal by mapping each piece of content to a different stage of the sales funnel."
  ],
  "motivation": "You have the right building blocks here, and adding the detail from the template will quickly turn this into a strong, complete plan."
}
```

### dmai-wk9-more-reach (raw 1.9 originally / 1.8 on re-run, mark 2, not borderline)

```json
{
  "recognition": "You have made a start and clearly understand the basic structure of a social post, including channel, post type, and a caption.",
  "explanation": "The band descriptions require a series of at least 5 posts with full details for a 3, and your submission includes only one post with several fields missing or vague, so it sits between attempting the task and showing partial understanding.",
  "nextSteps": [
    "Build the plan out to at least 5 distinct posts to meet the core requirement.",
    "Complete every field for each post: a specific date, image assets with descriptions, and relevant hashtags.",
    "Write fuller, more engaging captions rather than a single short line.",
    "For the stretch, link your posts together around a content cluster, event, or brand persona."
  ],
  "motivation": "You have the right idea, so with a little more detail and a few more posts you will hit the full marks next time."
}
```

### Does the explanation text hedge?

**Yes, all three do.** Despite none of these being flagged Borderline by the app (all sit at raw 1.8-1.9, outside the 0.4-0.6 fractional window), the `explanation` field in every one of the three uses explicit between-bands language:

- wk1: "between an attempt that shows limited understanding and an incomplete-but-developing response"
- dmai-wk7: "sits between attempted and incomplete"
- dmai-wk9: "sits between attempting the task and showing partial understanding"

This is the same style of hedge seen in the DI mismatches ("falls short of the 3 mark expectations", "between an attempt and showing understanding"). The difference here is that the numeric raw score (1.8-1.9) doesn't land in the app's borderline detection window even though the model's own explanation text describes a boundary case in almost identical language to the cases that did get flagged. In other words: the app's Borderline flag is catching some liminal cases (the DI 1.5/1.6 ones) but not others (these AIL/DMAI 1.8/1.9 ones) that the model itself describes with the same hedging language.
