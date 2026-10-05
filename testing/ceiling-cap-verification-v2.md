# Derived cap (v2): quick-set verification (AssisTED)

**Status: complete. The pass rule is met.** Test 6 scored mark 2 in 5 of 5 runs, and no control, round-up case or TESTING.md test was capped. Not committed, not pushed. The 41-case set was not run.

## Run windows

| Part | BST | UTC |
|---|---|---|
| Resume run (17 jobs) | 15:06:27 to 15:12:21 | 14:06:27 to 14:12:21 |
| Test 6 runs 1 to 3, kept from the earlier interrupted run | 11:56:31 to 11:58:39 | 10:56:31 to 10:58:39 |

All times 2026-10-05. **21 API calls in total**: 4 in the earlier run (3 kept, plus the Test 6 run 4 call that failed with a 502 at 10:59:34 UTC, which was re-run in the resume) and 17 in the resume. The resume had 0 failures.

## Pass rule

| Rule | Result |
|---|---|
| Test 6 at mark 2 in 5 of 5 | **Met.** Marks 2, 2, 2, 2, 2; all five capped. |
| No control capped | **Met.** 0 of 7 controls capped. |
| No round-up case capped | **Met.** 0 of 3 capped. |
| Any failure showing `stop_reason` max_tokens | None. 0 failures; all 17 resume calls ended with `end_turn`. |

## What was changed

- **Earlier this session (unchanged this round):** `level` ("required" or "stretch") on each `presenceEvidence` item; the cap derived in `lib/scoring.ts` (any required item unmet caps the mark at 2; the model's `ceilingBand` can only lower that cap to 0 or 1 and is ignored at 3 or 4; stretch shortfalls never cap; no evidence means no cap; rounding unchanged when no cap applies); one UI line in `MarkingForm.tsx`.
- **This round, `lib/marking.ts` only (18 lines):** one server-console line per call (timestamp, rubric id, `stop_reason`, `input_tokens`, `output_tokens`), and when the SDK returns no parsed output the error message now includes `stop_reason` and `output_tokens`. Scope check against a pre-edit snapshot: `lib/scoring.ts`, `MarkingForm.tsx`, the API route and `TESTING.md` changed 0 lines this round.
- **This round, test script only:** on a 400, 401 or 429 the runner stops immediately; on a 502 parse failure it records `stop_reason` and `output_tokens` and continues; it stops after 3 parse failures, or at once if a failure shows `max_tokens`. The route reports every upstream error as HTTP 502, so 400, 401 and 429 are recognised from the message prefix as well as the status.
- Test 6 runs 1 to 3 ran before the logging was added; the logging does not affect behaviour.

## Checks that needed no API calls

- `tsc --noEmit` and `eslint`: clean.
- **No text in the logs (stubbed client with distinctive marker strings in the submission, reasoning, feedback, evidence and an SDK error message): 12 of 12 checks pass.** One log line per call; it holds only the timestamp, rubric id, stop reason and token counts; none of the marker strings appears in a log line or in the failure message; when the SDK throws, only the error class name is logged and the original error is rethrown unchanged; success response bodies contain no usage fields. The only `console` call in `lib/` or the route is the usage line.
- **Runner stop rules (local mock server, 5 scenarios): all behave as specified.** Three interleaved parse failures continue until the third, then stop; an upstream 429 stops immediately; a parse failure with `max_tokens` stops immediately; an upstream 400 stops immediately; an all-ok run completes 17 jobs with exit 0.

## Results (20 results: 3 kept plus 17 from the resume)

| Stage | Case | Baseline mark | Mark | Capped | rawScore | Model ceilingBand | boundaryCase | borderline | Reasoning chars | Required unmet | Stretch unmet |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1-test6 | Test6-run1 | n/a | 2 | **true** | 3.6 | 4 | true | true | 899 | Learner's own ~100 word writing produced without AI | 0 |
| 1-test6 | Test6-run2 | n/a | 2 | **true** | 3.5 | 4 | true | true | 951 | Learner's own ~100 word writing on the scenario produced without AI | 0 |
| 1-test6 | Test6-run3 | n/a | 2 | **true** | 3.6 | 4 | true | true | 990 | The learner's own written draft produced without AI (process step from ove… | 0 |
| 1-test6 | Test6-run4 | n/a | 2 | **true** | 2.5 | 2 | true | true | 1132 | Learner's own ~100 word writing on the scenario (produced without AI); A 50-100 word evaluation comparing the learner's own writing and the LLM's… | 0 |
| 1-test6 | Test6-run5 | n/a | 2 | **true** | 3.5 | 4 | true | true | 1024 | Learner's own written content (~100 words) on the scenario written without… | 0 |
| 2-existing-control | C1-AIL-wk1-own-piece-present-meets | designed 3 | 3 | false | 3 | 4 | false | false | 787 | none | 1 |
| 2-existing-control | C2-AIL-wk1-own-piece-present-stretch | designed 4 | 4 | false | 4 | 4 | false | false | 738 | none | 0 |
| 2-existing-control | C3-DMAI-wk5-two-full-personas | designed 3 | 3 | false | 3 | 3 | false | false | 757 | none | 2 |
| 2-existing-control | C4-DMAI-wk9-five-full-posts | designed 3 | 4 | false | 4 | 4 | false | false | 908 | none | 0 |
| 3-new-control | N1-AIL-wk1-own-piece-very-short | designed 3 | 3 | false | 3 | 4 | false | false | 830 | none | 1 |
| 3-new-control | N2-AIL-wk1-own-piece-labelled-Draft-1 | designed 3 | 3 | false | 3 | 4 | false | false | 989 | none | 1 |
| 3-new-control | N3-AIL-wk1-own-piece-embedded-mid-submission | designed 3 | 3 | false | 3 | 4 | false | false | 667 | none | 1 |
| 4-testing-md | Test1-strong | 4 | 4 | false | 4 | 4 | false | false | 732 | none | 0 |
| 4-testing-md | Test2-meets | 3 | 3 | false | 3 | 4 | false | true | **0 (empty)** | none | 1 |
| 4-testing-md | Test3-thin | 1 | 1 | false | 1.4 | 2 | true | true | 931 | The LLM's output on the same subject; A 50-100 word evaluation comparing own writing and LLM output (readability… | 1 |
| 4-testing-md | Test4-mismatch | 0 (mismatch) | 1 | false | 0.5 | 1 | true | true | 797 | Learner's own ~100 word writing on a real work scenario (produced without …; An LLM-produced piece of content on the same subject; A 50-100 word evaluation comparing the learner's own writing and the LLM's… | 1 |
| 4-testing-md | Test5-borderline | 3 | 3 | false | 2.6 | 3 | true | true | 1045 | none | 1 |
| 5-round-up | WK1-Band3 | 3 | 3 | false | 3.4 | 4 | true | true | 952 | none | 1 |
| 5-round-up | WK3-Band3 | 3 | 4 | false | 3.5 | 4 | true | true | 1004 | none | 0 |
| 5-round-up | WK4-Band3 | 3 | 3 | false | 3.3 | 4 | true | true | 876 | none | 2 |

"Baseline mark" is the mark in the committed `fix-verification-results-final.md` for the TESTING.md tests and the three round-up cases; controls show their designed mark.

## Test 6, per run: the presenceEvidence items

**Test6-run1** (mark 2, capped true, raw 3.6, model ceilingBand 4)
- [required] **UNMET**: Learner's own ~100 word writing produced without AI (quote null)
- [required] met: LLM output on the same subject (prompt and result)
- [required] met: A 50-100 word evaluation comparing own writing and the LLM's output
- [stretch] met: Concrete next steps to improve the AI output, or examples of improvement

**Test6-run2** (mark 2, capped true, raw 3.5, model ceilingBand 4)
- [required] met: Prompt given to the LLM
- [required] met: The LLM's output on the same subject
- [required] **UNMET**: Learner's own ~100 word writing on the scenario produced without AI (quote null)
- [required] met: A 50-100 word evaluation comparing the learner's own writing and the LLM's output
- [stretch] met: Concrete next steps to improve the AI output or examples of improvement

**Test6-run3** (mark 2, capped true, raw 3.6, model ceilingBand 4)
- [required] met: A 50-100 word evaluation comparing the learner's own writing and the LLM's output
- [required] met: Reference to the LLM output being produced from a prompt on the same subject
- [required] **UNMET**: The learner's own written draft produced without AI (process step from overview) (quote null)
- [stretch] met: Concrete next steps to improve the AI output, or examples of improvements made

**Test6-run4** (mark 2, capped true, raw 2.5, model ceilingBand 2)
- [required] **UNMET**: Learner's own ~100 word writing on the scenario (produced without AI) (quote null)
- [required] met: LLM output on the same subject produced via a prompt
- [required] **UNMET**: A 50-100 word evaluation comparing the learner's own writing and the LLM's output
- [stretch] met: Concrete next steps to improve the AI output (or examples of improvement already made)

**Test6-run5** (mark 2, capped true, raw 3.5, model ceilingBand 4)
- [required] met: Prompt given to the LLM
- [required] met: LLM's output on the same subject
- [required] **UNMET**: Learner's own written content (~100 words) on the scenario written without AI (quote null)
- [required] met: Evaluation comparing the learner's own writing and the LLM's output
- [stretch] met: Concrete next steps to improve the AI output (stretch)

## Token usage and cost (resume run, 17 calls, measured from the server log)

| Job | stop_reason | Input tokens | Output tokens (incl. thinking) |
|---|---|---|---|
| Test6-run4 | end_turn | 4396 | 2393 |
| Test6-run5 | end_turn | 4396 | 3384 |
| C1-AIL-wk1-own-piece-present-meets | end_turn | 4520 | 1320 |
| C2-AIL-wk1-own-piece-present-stretch | end_turn | 4490 | 1214 |
| C3-DMAI-wk5-two-full-personas | end_turn | 4789 | 1396 |
| C4-DMAI-wk9-five-full-posts | end_turn | 4768 | 1285 |
| N1-AIL-wk1-own-piece-very-short | end_turn | 4322 | 1249 |
| N2-AIL-wk1-own-piece-labelled-Draft-1 | end_turn | 4485 | 1508 |
| N3-AIL-wk1-own-piece-embedded-mid-submission | end_turn | 4423 | 1315 |
| Test1-strong | end_turn | 4398 | 1245 |
| Test2-meets | end_turn | 4266 | 1107 |
| Test3-thin | end_turn | 4149 | 1380 |
| Test4-mismatch | end_turn | 4185 | 1243 |
| Test5-borderline | end_turn | 4246 | 2076 |
| WK1-Band3 | end_turn | 4339 | 1233 |
| WK3-Band3 | end_turn | 4613 | 1505 |
| WK4-Band3 | end_turn | 4444 | 1538 |
| **Total (17 calls)** | | **75,229** | **26,391** |

**Cost: $1.04** for the 17 measured calls (75,229 input and 26,391 output tokens, output including hidden thinking, at $5 and $25 per million tokens for `claude-opus-4-8`). The earlier 4 calls were made before usage logging existed, so they are not measured. At Test 6's typical size (about 4.4k tokens in, 2.4k to 3.4k out) they add roughly $0.30 to $0.40, which is an estimate. All 21 calls together: about $1.4.

## Findings

1. **The derived cap works on the case it was built for: 5 of 5.** In 4 of the 5 runs the model set its own `ceilingBand` to 4 and scored a 3/4 boundary (raw 3.5 or 3.6), which would have rounded to 4. The own-writing piece was tagged required and unmet each time, so the code capped the mark at 2 regardless. In run 4 the model's own `ceilingBand` was 2 and it also listed the evaluation as unmet; the cap is 2 either way. So the model's `ceilingBand` was irrelevant in 4 of 5 runs, which is what the change was for. Five runs is a small sample.
2. **No false caps.** None of the 7 controls (the 4 existing and the 3 "own writing present but unusual": very short, labelled "Draft 1", embedded mid-text) had a required item unmet, and none was capped. All met their designed marks (C4 scored 4 against a designed 3, as in earlier rounds).
3. **The round-up cases kept their marks and were not capped.** WK1-Band3 3 (raw 3.4), WK4-Band3 3 (raw 3.3), WK3-Band3 4 (raw 3.5, rounded up). The committed baseline has 3 for all three; WK3-Band3's 4 matches the earlier presence-evidence run and differs from the baseline only because raw was 3.5 here and 3.4 there. That is `Math.round` doing what the policy intends, not a cap.
4. **TESTING.md tests 1 to 5 did not move:** 4, 3, 1, mismatch (still flagged), 3. Test 4's internal mark is 1 (raw 0.5) against a baseline of 0, which the UI does not show because the mismatch badge replaces the mark. Tests 3 and 4 had required items unmet but the cap did not bind because their marks were already 2 or below.
5. **No failures this round.** The earlier Test 6 run 4 failure (502, "did not return a parsable result") did not recur, so its cause is still undetermined; that call predates the logging. **Observation, not a diagnosis:** the usage data show Test 6 is the heaviest case. Test 6 run 5 used 3,384 output tokens and run 4 used 2,393, against `max_tokens` 4000, while every other call used 1,107 to 2,076. That leaves about 15 percent headroom on the heaviest call and is consistent with the earlier failure having been a `max_tokens` cut-off, but it does not prove it. **`max_tokens` was not changed; raising it needs your decision.**
6. **One empty `bandReasoning` in 20 results** (Test 2). `borderline` was set true by the empty-reasoning rule and the mark was not changed (3).

## Notes and flags

- On a parse failure the error message now carries `stop_reason` and `output_tokens`, and the API route returns that message to the browser as a 502. Success responses are unchanged (checked with the stubbed client).
- The model's `ceilingBand` is now largely redundant. It can still lower the cap to 0 or 1, so I left it in place.
- Carried from earlier: TESTING.md Test 5 still says the Borderline badge is shown (the badge was removed from the UI); the Test 6 "Status" note in TESTING.md is out of date.
- Raw per-call results and the server log live in the scratchpad, not the repo. Say if you want them kept.
- Still uncommitted: `TESTING.md`, `components/MarkingForm.tsx`, `lib/marking.ts`, `lib/scoring.ts`, and the untracked report files and `testing/cases/`. HEAD is `fcc2359`.

## Decision for you

Next step would be the 41-case set, to see the derived cap's effect more widely (in particular 3/4 boundary cases with only a stretch element missing, which must still round up). That is roughly 41 calls, about $2.50 at this run's per-call average, but needs your approval. Separately, decide whether to raise `max_tokens` given the Test 6 headroom above.
