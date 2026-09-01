# Boundary test results — 0-vs-1 and 3-vs-4

Read-only measurement exercise. All 6 submissions in [boundary-test-0v1-3v4.md](boundary-test-0v1-3v4.md) were run through the live dev server's `/api/mark` route (same code path production uses). No production file (`lib/rubrics.ts`, `lib/marking.ts`, `lib/scoring.ts`, the API route) was modified — `computeBand`'s rounding and 0.4-0.6 borderline threshold are untouched, per instructions.

## Results table

| Assignment | Boundary Tested | Raw Score | Mark | Borderline? |
|---|---|---|---|---|
| wk2-swot-ai-industry | 0-vs-1 | 0.5 | 1 | Yes |
| dmai-wk1-ceo-audit | 0-vs-1 | 0 | 0 | No |
| di-wk1-notion-page | 0-vs-1 | 1.3 | 1 | No |
| wk3-risk-appetite | 3-vs-4 | 3.1 | 3 | No |
| dmai-wk5-personas | 3-vs-4 | 3.5 | 4 | Yes |
| di-wk5-marketing-email | 3-vs-4 | 3.5 | 4 | Yes |

## Full explanation text and hedging analysis

### wk2-swot-ai-industry (0-vs-1, raw 0.5, mark 1, borderline)

> "Because the table is empty and there is no analysis of any legal or ethical AI issues, the submission cannot yet show understanding of the content, placing it at the very bottom of the scale between not attempted and attempted."

**Hedging language:** Yes — "between not attempted and attempted." **Score reflects it:** Yes, raw 0.5 sits exactly in the 0.4-0.6 borderline window and is flagged Borderline.

### dmai-wk1-ceo-audit (0-vs-1, raw 0, mark 0, not borderline)

> "This scores 0 because the assignment has not yet been attempted: there is no content covering Mission, Vision and Values, the 7Ps, or media use, only a placeholder note to complete it later."

**Hedging language:** No — confident, unqualified 0. **Score reflects it:** N/A (no hedge to match); raw score is a clean 0, not borderline.

### di-wk1-notion-page (0-vs-1, raw 1.3, mark 1, not borderline)

> "The mark reflects that the page was attempted and successfully published, but it contains only a title with no content blocks, no text, and no self-reflection, so it does not yet demonstrate understanding of building a page with varied content. This places it at the boundary between an attempt and an incomplete-but-developing submission."

**Hedging language:** Yes — "at the boundary between an attempt and an incomplete-but-developing submission" (this is 1-vs-2 boundary language, not 0-vs-1 — the model treated the successful publish as enough to clear band 0 entirely and instead reasoned about the boundary one band up). **Score reflects it:** No — raw 1.3 is not within 0.4 of either the 0.4-0.6 or 1.4-1.6 windows; not flagged Borderline despite the explicit "at the boundary" language. **Gap case.**

### wk3-risk-appetite (3-vs-4, raw 3.1, mark 3, not borderline)

> "This meets all the requirements for a 3... The single line comparing your business to a bank shows you are reaching toward the stretch goal, but it does not yet explore regulation, reputation, or culture differences, nor suggest a governance measure, so it falls short of a full 4."

**Hedging language:** Weak/moderate — "falls short of a full 4" acknowledges a near-miss but reads as a confident placement in band 3 rather than genuine "could go either way" ambiguity. Included here as a hedge for consistency with how "falls short of" was classified as hedging language in the prior DI/AIL/DMAI rounds. **Score reflects it:** No — raw 3.1 is nowhere near the 3.4-3.6 borderline window; not flagged Borderline. **Gap case** (weaker instance).

### dmai-wk5-personas (3-vs-4, raw 3.5, mark 4, borderline)

> "You have fully met the 3 mark band by delivering the required detail across three personas, and you have started reaching into the stretch goal by sketching touchpoints and funnel opportunities. Because that funnel work only covers one persona rather than being defined for a generalised sale, the submission sits on the boundary between meeting and exceeding expectations."

**Hedging language:** Yes — "sits on the boundary between meeting and exceeding expectations." **Score reflects it:** Yes, raw 3.5 sits exactly in the 3.4-3.6 borderline window and is flagged Borderline.

### di-wk5-marketing-email (3-vs-4, raw 3.5, mark 4, borderline)

> "This sits right on the boundary between meeting and exceeding expectations... the self-reflection restates what was done rather than critically evaluating it, which holds it just short of a confident 4."

**Hedging language:** Yes — "sits right on the boundary between meeting and exceeding expectations." **Score reflects it:** Yes, raw 3.5 sits exactly in the 3.4-3.6 borderline window and is flagged Borderline.

## Summary of the 6

- **Hedging text WITH a matching borderline-range score:** 3/6 — wk2-swot-ai-industry (0.5), dmai-wk5-personas (3.5), di-wk5-marketing-email (3.5)
- **Hedging text WITHOUT a matching borderline-range score (the gap pattern):** 2/6 — di-wk1-notion-page (1.3), wk3-risk-appetite (3.1, weaker hedge)
- **No hedging, confident either way:** 1/6 — dmai-wk1-ceo-audit (0)

By boundary: 0-vs-1 produced 1 match, 1 gap, 1 confident-no-hedge. 3-vs-4 produced 2 matches, 1 gap.

## Comparison to the 2-vs-3 boundary

This cannot be done as a direct, like-for-like comparison from data collected so far: **no round of testing to date — this one included — has run a submission specifically targeting the 2-vs-3 boundary** (the one with the worked example in the prompt, raw 2.4-2.6). All prior rounds targeted the 1-vs-2 boundary (the original DI mismatches and the AIL/DMAI confidently-overscored check), and this round targeted 0-vs-1 and 3-vs-4. There is no 2-vs-3 baseline in any results file to compare against.

What the existing data does show: the hedge-without-matching-score gap pattern is not confined to the 1-vs-2 boundary where it was first observed. It also appears at 0-vs-1 (di-wk1-notion-page) and 3-vs-4 (wk3-risk-appetite) — i.e. at both boundaries furthest from the prompt's single worked example. So the gap generalises across every boundary tested so far. Whether it is more, less, or equally common at the 2-vs-3 boundary itself is not something this data can answer.

## Hypothesis assessment

**Not confirmed — insufficient data, not ruled out either.** The anchoring-to-the-single-worked-example hypothesis specifically requires comparing gap frequency at boundaries far from the worked example (0-vs-1, 3-vs-4) against gap frequency at the boundary the example actually covers (2-vs-3). No 2-vs-3 boundary test has ever been run in this testing effort, so that comparison isn't possible from current data. What can be reported: the gap pattern (hedging explanation text paired with a confidently non-borderline score) occurs at every boundary tested so far — 0-vs-1, 1-vs-2, and 3-vs-4 — so it is not unique to boundaries distant from the worked example. Confirming, partially confirming, or ruling out the anchoring hypothesis would require running genuinely-ambiguous 2-vs-3 boundary submissions the same way this round tested 0-vs-1 and 3-vs-4.
