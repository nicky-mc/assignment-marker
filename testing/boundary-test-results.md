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
