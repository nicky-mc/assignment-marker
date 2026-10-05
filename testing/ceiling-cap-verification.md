# ceilingBand cap: quick-set verification (AssisTED)

**Not committed, not pushed.** Run on 2026-10-05, dev server on port 3001, model `claude-opus-4-8`. 17 API calls, 0 errors, 0 retries.

## Result

**The cap mechanics work; the field that drives the cap is not reliable enough, so Test 6 is not fixed.** Test 6 scored 2, 2, 4, 2, 4 across five runs. Three runs set `ceilingBand` 2 and were capped from 3 to 2. In the other two the model flagged the own-writing piece as unmet but set `ceilingBand` 4, scored raw 3.5, and the mark came out **4**. Before the cap existed, the same text scored 3 in all five runs of the previous round, so those two runs are worse than before. No control was capped or dropped (0 false caps in 7).

## Run window (to match the Console)

- First call started: **10:23:14 BST** (09:23:14 UTC), 2026-10-05.
- Last call finished: **10:29:53 BST** (09:29:53 UTC), 2026-10-05.
- Calls made: **17** (5 Test 6, 4 existing controls, 3 new controls, 5 TESTING.md tests). Per-call timestamps are in the raw results.
- The real anonymised failing case was **not supplied, so it was not run**.

## What changed (the only code changes; all uncommitted)

| File | Change |
|---|---|
| `lib/marking.ts` | New required `ceilingBand` (integer 0 to 4) in the schema, generated after `presenceEvidence` and `bandReasoning`, before `boundaryCase` and `rawScore`. Passed to `computeBand`. `MarkOutcome` gains `ceilingBand` and `capped`. If `bandReasoning` is empty, `borderline` is set true; the mark is never changed because of it. The system prompt was not touched. |
| `lib/scoring.ts` | `computeBand(rawScore, modelFlaggedBoundary = false, ceilingBand = 4)`: `mark = Math.min(Math.round(clamped), ceilingBand)`; returns `capped` (true only when the cap lowered the mark). Rounding, the 0.4 to 0.6 window and the borderline logic are unchanged. |
| `components/MarkingForm.tsx` | When `capped`, the result card shows "Mark capped at N: required element not found (see evidence)". The editable feedback box is untouched. **This file is outside the "lib/marking.ts and lib/scoring.ts only" scope line, but item 4 of the request required a result-card change.** |
| `TESTING.md` | Tests 1, 2, 3 and 5 each gain one "What I wrote:" paragraph (53, 53, 57 and 54 words). Nothing else changed: 8 lines added, none removed. |

## Checks that needed no API calls

- `tsc --noEmit` and `eslint` on the three code files: clean.
- **SDK serialisation:** `ceilingBand` serialises as `{"type":"integer"}`, is in `required`, and the property order is `presenceEvidence`, `bandReasoning`, `ceilingBand`, `boundaryCase`, ..., `rawScore`. The SDK helper puts `minimum: 0, maximum: 4` into the description text rather than the schema, so the 0 to 4 range is enforced client-side by Zod (it rejected 5, -1 and 2.5 and accepted 0, 2, 4), not by the API grammar. An out-of-range value would surface as a parse error.
- **`computeBand`:** 8 of 8 checks pass, including the one that matters for policy: raw 2.5 with ceiling 4 still rounds **up** to 3 with `capped` false; raw 2.5 with ceiling 2 gives 2 with `capped` true; the old two-argument call shape still works; the 0.4 to 0.6 window is unchanged.
- **UI:** with the page's `fetch` mocked (0 real API calls from the browser), a capped response shows the exact line "Mark capped at 2: required element not found (see evidence)" and the feedback box is unchanged; an uncapped response shows no such line; no em dash on the page.

## Results (all 17 calls)

| Stage | Case | Designed | Mark | rawScore | ceilingBand | capped | boundaryCase | borderline | bandReasoning chars | Unmet presence criteria |
|---|---|---|---|---|---|---|---|---|---|---|
| 1-test6 | Test6-run1 | n/a | 2 | 2.5 | 2 | **true** | true | true | 1044 | Learner's own ~100 word writing on the scenario, produced without AI |
| 1-test6 | Test6-run2 | n/a | 2 | 2.5 | 2 | **true** | true | true | **0 (empty)** | Learner's own ~100 word written version produced without AI; Evaluation comparing the learner's own writing and the LLM's output |
| 1-test6 | Test6-run3 | n/a | 4 | 3.5 | 4 | false | true | true | 1017 | Learner's own ~100 word written draft produced without AI |
| 1-test6 | Test6-run4 | n/a | 2 | 2.5 | 2 | **true** | true | true | **0 (empty)** | Learner's own ~100 word writing produced without AI help; Evaluation (50-100 words) comparing own writing and LLM output |
| 1-test6 | Test6-run5 | n/a | 4 | 3.5 | 4 | false | true | true | 885 | Learner's own ~100 word writing produced without AI |
| 2-existing-control | C1-AIL-wk1-own-piece-present-meets | 3 | 3 | 3 | 3 | false | false | false | 768 | Stretch: concrete next steps to improve the AI output, or examples of… |
| 2-existing-control | C2-AIL-wk1-own-piece-present-stretch | 4 | 4 | 4 | 4 | false | false | false | 851 | none |
| 2-existing-control | C3-DMAI-wk5-two-full-personas | 3 | 3 | 3 | 4 | false | false | false | 756 | Third persona (stretch); Sales funnel touchpoints and opportunities defined (stretch) |
| 2-existing-control | C4-DMAI-wk9-five-full-posts | 3 | 4 | 3.6 | 4 | false | true | true | 879 | none |
| 3-new-control | N1-AIL-wk1-own-piece-very-short | 3 | 3 | 3 | 3 | false | false | false | 786 | Stretch: concrete next steps to improve the AI output, or examples of… |
| 3-new-control | N2-AIL-wk1-own-piece-labelled-Draft-1 | 3 | 3 | 3.4 | 4 | false | true | true | 981 | Stretch: concrete next steps to improve the AI output, or examples of… |
| 3-new-control | N3-AIL-wk1-own-piece-embedded-mid-submission | 3 | 3 | 3 | 3 | false | false | false | 817 | Stretch: concrete next steps to improve the AI output or examples of … |
| 4-testing-md | Test1-strong | n/a | 4 | 4 | 4 | false | false | false | 795 | none |
| 4-testing-md | Test2-meets | n/a | 3 | 3 | 3 | false | false | false | 717 | Stretch: concrete next steps to improve the AI output or examples of … |
| 4-testing-md | Test3-thin | n/a | 2 | 1.5 | 2 | false | true | true | 1063 | The LLM's output on the same subject included in the submission; A 50-100 word evaluation comparing the two versions (readability, eng…; Stretch: concrete next steps to improve the AI output or examples of … |
| 4-testing-md | Test4-mismatch | n/a | 0 | 0 | 0 | false | false | false | 673 | Learner's own ~100 word writing on a real work scenario; LLM-produced output on the same subject; A 50-100 word evaluation comparing the learner's writing and the LLM …; Concrete next steps to improve the AI output (stretch) |
| 4-testing-md | Test5-borderline | n/a | 3 | 2.6 | 3 | false | true | true | **0 (empty)** | Stretch: concrete next steps to improve the AI output or examples of … |

## Test 6 ×5

| Run | Mark | Capped | ceilingBand | rawScore | Own-writing piece flagged unmet |
|---|---|---|---|---|---|
| 1 | 2 | true | 2 | 2.5 | yes |
| 2 | 2 | true | 2 | 2.5 | yes (bandReasoning empty) |
| 3 | **4** | false | **4** | 3.5 | yes |
| 4 | 2 | true | 2 | 2.5 | yes (bandReasoning empty) |
| 5 | **4** | false | **4** | 3.5 | yes |

Detection is 5 of 5. Enforcement is 3 of 5. In the two failures the model's own reasoning treats the missing piece as a weakness rather than a ceiling. Run 3: "the missing own-written draft ... keeps it from being a complete deliverable", then "this sits on the 3/4 boundary", `ceilingBand` 4. Run 5: "the scored requirement ... is fully delivered", `ceilingBand` 4. In the three capped runs it said the opposite (run 1: "This caps the submission below the meets-expectations band ... That places it at band 2"). Same text, five runs, two different readings of the same instruction: the cap is only as reliable as the model's willingness to set the number.

## Controls: false caps and drops

- **False caps: 0 of 7** (the 4 existing controls and the 3 new "own writing present but unusual" ones). Nothing outside Test 6 was capped in all 17 calls.
- **Drops below designed mark: 0 of 7.** C4 scored 4 against a designed 3 (above design, as before).
- The three unusual-placement controls all scored their designed 3 with `ceilingBand` 3 or 4: the very short own piece (22 words, N1), the piece labelled "Draft 1" (N2), and the piece embedded mid-paragraph (N3). The model did not treat any of them as missing the artefact.
- **Watch item:** the model set `ceilingBand` 3 on 5 calls (C1, N1, N3, Test 2, Test 5) where only a stretch element was missing. That is a literal reading of "highest band reachable" and was harmless here, because those raws rounded to 3 anyway. But it means the cap will also bind on a 3/4 boundary score (3.5 rounds to 4) whenever a stretch item is unmet. That did not occur in this set. The 41-case set contains several 3/4 boundary cases (raw 3.4 to 3.5), so it is where to look for it.

## TESTING.md tests 1 to 5 (with the new own-writing samples)

| Test | Baseline mark (`fix-verification-results-final.md`) | New mark | rawScore | capped | Moved? |
|---|---|---|---|---|---|
| 1 | 4 | 4 | 4 | false | no |
| 2 | 3 | 3 | 3 | false | no |
| 3 | 1 | **2** | 1.5 | false | **yes, up** |
| 4 (mismatch) | 0 | 0, `topicMismatch` true | 0 | false | no (mismatch still flagged) |
| 5 | 3 | 3 | 2.6 | false | no |

Test 3 moved 1 to 2 with no cap involved: its fixture now contains a real own-writing sample, and the model scored a boundary 1.5, which rounds up. That change cannot be separated from the fixture edit, so it is not attributable to the cap. TESTING.md still describes Test 3's expectation as "mark 1/4"; I did not change that text.

## Empty `bandReasoning`

3 of 17 calls returned an empty `bandReasoning` (Test 6 runs 2 and 4, and Test 5). `borderline` was true on all three, as the new rule requires (it was already true through `boundaryCase`, so the new rule changed no outcome here), and no mark was changed because of it. In Test 6 runs 2 and 4 the cap still fired with an empty reasoning field, which is consistent with the ceiling being a separate required number.

## Verdict and decision for you

Not fixed. The cap does what it was built to do and caused no false caps in this set, but the model sets `ceilingBand` 4 in about 2 of 5 runs on the very case it exists for, and in those runs the result is worse than before. Nothing was changed after seeing this; I did not touch the prompt.

Options, not implemented:
1. **Derive the cap from the evidence list as well.** Cap at 2 if any `presenceEvidence` item that is both unmet and tagged required-for-3 exists, taking the lower of that and `ceilingBand`. This catches runs 3 and 5 (both listed the own piece as unmet). Risk seen earlier: the model's list is loose (quality judgements and stretch items filed as presence), so the tag needs its own test and could cause false caps.
2. **Leave the cap as it is and add the 41-case run** to see whether the 3 of 5 behaviour holds more widely and whether the stretch-driven `ceilingBand` 3 ever binds on a 3/4 boundary. This does not address the 2 of 5 failure.

## Flags (observed, not changed)

- The UI text "(see evidence)" has nothing to point at: `presenceEvidence` is returned by the API but is not shown anywhere in the UI.
- Before the cap, Test 6 was consistent (mark 3 in 5 of 5 runs). With the cap it is spread (2, 2, 4, 2, 4). Five runs is a small sample, but the spread itself is the finding.
- Test 5's intro still says "a couple of sentences" while its new sample is five sentences; I left the intro alone as instructed.

Raw per-call data (including timestamps and full outcomes) is in the scratchpad `ceiling-verification.jsonl` and is not saved in the repo; say if you want it kept.
