# Digital Innovators (DI) rubric — marking pipeline test results

Read-only measurement exercise. All 16 test submissions plus 1 DMAI spot-check were run against the live dev server's `/api/mark` route (same code path production uses — anonymised text in, `markSubmission()`/Claude structured-output call, JSON mark/rawScore/borderline/feedback out). No production file (`lib/rubrics.ts`, `lib/marking.ts`, `lib/scoring.ts`, `lib/anonymise.ts`, the API route) was modified to produce this report.

## Spot-checks (run before the DI batch)

**1. `di-wk5-marketing-email` band 3 `bandDescriptions` text**, as currently defined in `lib/rubrics.ts`:

> "3 - Complete and meets expectations: purpose stated and suited to the audience; subject line includes the learner's full name, course, assignment title, and a custom subject matter; at least two design principles correctly applied and explained; at least two persuasive techniques used effectively; logical, visually organised structure; branding/consistency evident; proofread, polished, with appropriate links; screenshots and explanation adequately demonstrate the requirements are met; self-reflection included."

**2. DMAI regression spot-check.** `TESTING.md` currently contains only AI Literacy (`wk1-evaluate-llm-output`) cases — no DMAI submission is recorded there, so the instruction to "pick any [DMAI submission] from TESTING.md" could not be followed literally. Substituted the `dmai-wk1-ceo-audit` bakery submission previously documented in `CHANGELOG.md` as the original DMAI spot-check example.

| | Before DI rubrics were added | Re-run now |
|---|---|---|
| Mark | 3 | 3 |
| Raw score | 3.2 | 3.0 |
| Borderline | false | false |

Same band, same mark. The shared band-override logic was not affected by adding the DI rubrics.

## Results table

| Assignment | Intended Band | Returned Score (mark / raw) | Borderline? | Match |
|---|---|---|---|---|
| WK1 — Band 1 | 1 | 2 / 1.5 | Yes | **No** |
| WK1 — Band 2 | 2 | 2 / 2.0 | No | Yes |
| WK1 — Band 3 | 3 | 3 / 3.4 | Yes | Yes |
| WK1 — Band 4 | 4 | 4 / 4.0 | No | Yes |
| WK3 — Band 1 | 1 | 1 / 1.2 | No | Yes |
| WK3 — Band 2 | 2 | 2 / 2.2 | No | Yes |
| WK3 — Band 3 | 3 | 3 / 3.4 | Yes | Yes |
| WK3 — Band 4 | 4 | 4 / 4.0 | No | Yes |
| WK4 — Band 1 | 1 | 2 / 1.6 | Yes | **No** |
| WK4 — Band 2 | 2 | 2 / 2.0 | No | Yes |
| WK4 — Band 3 | 3 | 3 / 3.2 | No | Yes |
| WK4 — Band 4 | 4 | 4 / 4.0 | No | Yes |
| WK5 — Band 1 | 1 | 1 / 1.0 | No | Yes |
| WK5 — Band 2 | 2 | 2 / 1.9 | No | Yes |
| WK5 — Band 3 | 3 | 3 / 3.0 | No | Yes |
| WK5 — Band 4 | 4 | 4 / 4.0 | No | Yes |

## Agreement rates

- **WK1** (`di-wk1-notion-page`): 3/4 matched intended band
- **WK3** (`di-wk3-ai-research-presentation`): 4/4 matched intended band
- **WK4** (`di-wk4-notebooklm-vs-gems`): 3/4 matched intended band
- **WK5** (`di-wk5-marketing-email`): 4/4 matched intended band

**Overall: 14/16 matched intended band (87.5%)**

Both mismatches were the "Band 1" example for their assignment, both scored one band high (returned 2 instead of 1), and both were themselves flagged **Borderline** by the app (raw 1.5 and 1.6 — just over the 1.4 midpoint between bands 1 and 2). The app's own borderline detection correctly surfaced both as boundary cases needing human review, even though the rounding rule pushed the mark to 2 rather than 1.

## Full feedback for mismatches

### WK1 — Band 1 (intended 1, returned mark 2, raw 1.5, borderline)

Submission: Notion page, unpublished, link shared as a screenshot instead of a URL. One heading + one paragraph ("I want to learn stuff on this course and get better at computers."). No other blocks. No reflection.

```json
{
  "recognition": "You made a start by creating a Notion page and giving it a clear heading, which shows you have begun exploring the tool.",
  "explanation": "The submission sits between bands: it was attempted with a heading and paragraph, but the page was not published properly (a screenshot was shared instead of a URL), the content is very minimal with only two blocks, and no self-reflection was included, so it falls short of the 3 mark expectations.",
  "nextSteps": [
    "Publish the page properly and share the actual public URL rather than a screenshot so it can be viewed live.",
    "Add a variety of at least three different content block types, for example a bulleted list, an image, a callout, or a toggle.",
    "Expand the content so your goals are described in more detail and the page feels complete and clearly structured.",
    "Include a short written or recorded self-reflection on what you created and learned."
  ],
  "motivation": "You have the basics in place, so with a bit more content and a proper published link you will hit the mark next time."
}
```

Note the `explanation` text itself says the submission "falls short of the 3 mark expectations" — i.e. the model's own reasoning is anchored on the boundary between the *sitting-below-3* case and something higher, not clearly distinguishing "attempted" (band 1) from "shows some understanding" (band 2).

### WK4 — Band 1 (intended 1, returned mark 2, raw 1.6, borderline)

Submission: "I made a Gem and a Notebook, they were both good for research." No goal stated, no comparison, no link — evaluation pasted directly into the text box with no shared artefact.

```json
{
  "recognition": "Well done for engaging with both tools and creating a Gem and a Notebook, which shows you got hands-on with the technologies.",
  "explanation": "The submission mentions creating both tools but does not state a goal, does not compare their performance, provides no link, and offers no real self-reflection, which places it between an attempt and showing understanding rather than meeting the expectations for 2 or 3 marks.",
  "nextSteps": [
    "State a clear, real goal that you used both the Gem and the Notebook to work towards.",
    "Write a genuine comparison of how each tool performed against that goal, noting strengths and weaknesses of each.",
    "Include a shared link to your evaluation artefact rather than only pasting a sentence into the text box.",
    "Add a short self-reflection on what you learned and how you might use these tools in future."
  ],
  "motivation": "You have made a solid start with the tools, and with a little more detail and evidence your next submission can really shine."
}
```

Here the model's own words — "between an attempt and showing understanding" — explicitly describe a boundary case, then the raw score (1.6) rounds up rather than down.

## Observations on rubric wording / testing methodology

- **Pattern across both mismatches**: both are the minimal, one-or-two-sentence "Band 1 (attempted, no real evidence)" style examples, and in both cases the model's own explanation text describes the submission as sitting *between* two bands rather than confidently in the lower one. The raw scores (1.5, 1.6) landed just above the round-to-1 threshold. This may reflect that a bare, low-effort attempt still ticks a "some engagement/hands-on" box in the model's reasoning (e.g. "created a Gem and Notebook," "made a start by creating a page") even when every specific requirement in the band 2/3 descriptions is absent — the recognition of *effort* may be pulling the raw score upward independent of *requirements met*.
- **WK1 and WK3 Band 3 examples** (which matched) both landed borderline too (raw 3.4), with the explanation text noting the submission "nudges towards the exceeds band" — i.e. the model consistently treats the band 3 descriptions as a floor it can exceed on partial credit for band-4-style elements, not just a target to hit. Not a mismatch, but worth noting as the same general tendency (raw score drifting toward the upper edge of the intended band) shows up on a passing case too.
- **Testing methodology note**: the source test file wrote each Band 4 example as "Same as Band 3, plus: [additions]" rather than as a self-contained submission. To test a realistic, complete submission at each API call (rather than an ellipsis-laden fragment), each Band 4 case in this run was expanded to the full Band 3 text plus the stated Band 4 additions, merged verbatim. This is a testing-methodology choice, not a rubric issue, but is disclosed here since it means the Band 4 submissions actually marked were longer/more complete than the shorthand in the source file might suggest.
- **TESTING.md gap**: `TESTING.md` contains no DMAI test cases at all (only AI Literacy `wk1-evaluate-llm-output` cases), which meant the requested "pick any DMAI submission from TESTING.md" instruction couldn't be followed as written — see spot-check #2 above for the substitution used instead.
