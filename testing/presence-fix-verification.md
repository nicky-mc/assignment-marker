# Presence-evidence fix: verification report (AssisTED)

**Not committed. Nothing in the app was modified.** Code under test: `lib/marking.ts` at HEAD `fcc2359` (clean working tree throughout). Run on 2026-10-05, 09:49 to 10:05 BST, against AssisTED's dev server on port 3001. 50 API calls, 0 errors, 0 truncated responses.

## Result in one paragraph

**The fix is not verified as working.** The detection half works: on Test 6 the model flagged the missing own-writing piece as unmet (`met: false`, `quote: null`) in 5 of 5 runs. The enforcement half does not: all five runs still scored **3/4** (raw 2.5, `boundaryCase` true on 2/3), not the ~2/4 the human marker gave. That is better than the 4/4 seen on the first Test 6 run, but short of the target, and it is consistent rather than random. No control dropped below its designed mark, and no whole-number mark moved *down* anywhere in the 41-case set. Per step 5, I did not strengthen the prompt again; the code-level cap proposal is at the end, for your approval.

## Summary by step

| Step | What was asked | Result |
|---|---|---|
| 1 | Test 6 ×5 | Marks 3, 3, 3, 3, 3. rawScore 2.5 every time. `boundaryCase` true (2/3) every time. Own-writing criterion unmet 5/5. **Consistent but wrong.** |
| 2 | 4 controls with the artefact present | All four at or above their designed mark (3, 4, 3, 3 designed; 3, 4, 3, 4 actual). **None dropped.** No pre-fix baseline exists for these. |
| 3 | TESTING.md tests 1 to 5 | Marks 4, 3, 1, mismatch, 3, unchanged against baseline except Test 4's internal mark (see step 4). Run once, inside step 4's set, to save credits. See the caution below on what this does and does not show. |
| 4 | 41-case set vs `fix-verification-results-final.md` | 41/41 completed. **3 whole-number marks moved, all upward or neutral, none down:** Test4-mismatch 0 → 1 (topic mismatch still flagged), WK3-Band3 3 → 4 (raw 3.4 → 3.5), wk1-evaluate-llm-output-2v3 2 → 3 (raw 2.4 → 2.5). All three are rebuilt-text cases, so none can be attributed to the fix alone. |
| 5 | Cap proposal if Test 6 inconsistent | Test 6 is consistently wrong rather than inconsistent. I am treating that the same way and proposing the cap (see end). Prompt not changed. |

## Findings that matter more than the tables

1. **The model applies the ceiling in words and then undoes it in the number.** Test 6 run 4: "That caps it at band 2 ... so the 2/3 boundary is in genuine play", then `boundaryCase` true, raw 2.5. For `wk1-evaluate-llm-output-2v3` (the evaluation was about 16 words, not 50 to 100): "the submission is capped below band 3. It clearly sits at band 2 ... band 2 is the clear fit", and yet raw 2.5, `boundaryCase` true on 2/3, which the existing rounding turns into mark 3. The shortfall is in how a stated judgement becomes a score, not in finding the missing evidence. This is why a prompt change is the wrong lever.
2. **Seven of 50 calls returned an empty `bandReasoning`** (0 characters), so for those calls the reasoning step that carries the ceiling and the boundary decision never ran. None of those seven changed mark, and none were Test 6 or control calls. The earlier 15-case verification returned reasoning text in every case, so this is new. I have not tested the cause. The schema requires the field but cannot enforce a minimum length. Details in the errors section.
3. **A passing Tests 1 to 5 says less than it looks.** For Week 1, the model listed "the learner's own piece exists" as a presence criterion in 9 of 13 calls (including all of Test 6, both controls, and the 1-line submission) but **never listed it for TESTING.md Tests 1, 2, 3 and 5**, which describe the learner's own writing ("I wrote a short paragraph ...") without including it. So the check never examined that requirement on those fixtures; they did not "pass" it. Either the model treats "I wrote X" as sufficient or its choice of which criteria to enumerate is inconsistent. Also, under the strict reading that motivated this fix, Tests 1, 2 and 5 are themselves missing the own piece. That is a fixture question for you (see flags).
4. **The model decides which criteria count as presence-based, and does so loosely.** It files "Stretch" items, length requirements and quality judgements in the same list. Of 22 calls (41-case set plus controls) that scored 3 or above, 9 listed at least one unmet criterion; 6 of those were all labelled "Stretch", and 3 were not (a stretch item left unlabelled, a genuine length requirement, and a quality judgement). This matters for how a cap can be built.
5. **Test 4's mark moved 0 → 1 but the behaviour you care about did not.** `topicMismatch` is still true, and when it is true the UI shows the mismatch badge instead of the mark. The internal mark and `boundaryCase` changed because the model now scores the wrong-topic text 0.5 instead of 0.

## What was and was not controlled

- **No code was modified.** The only things created are this report and `testing/cases/`, both uncommitted.
- **Step 3 was folded into step 4** (the five TESTING.md submissions are cases 1 to 5 of the 41), saving five calls.
- **The 41 texts were rebuilt after the scratchpad was cleared.** See the provenance section: 18 match committed files exactly, 3 match after normalising markdown bold or em dashes, 20 are reconstructed. Mark changes cannot be attributed to the fix alone.
- **The controls have no pre-fix baseline**, so "dropped" means below designed mark.
- **The committed baseline has a hole.** `fix-verification-results-final.md` claims 41 cases but its table has 40 rows; `dmai-wk9-more-reach` is missing. I took that one baseline (mark 2) from the earlier run record and marked it with a dagger. I have not edited that file.
- **Token usage is an estimate, not a measurement** (the route does not return `usage`).

## Provenance of the 41 case texts

**None of the 41 texts was loaded programmatically from a committed file.** The scratchpad holding the original run scripts was cleared, so all 41 were transcribed by hand into a fresh script (`cases41.mjs`) from copies of the earlier scripts that were still in the conversation. Each text was then checked against the committed files (read from `HEAD`) to see whether the committed repo independently holds it.

| Result | Count |
|---|---|
| Text present in a committed file in `testing/` (whitespace-normalised) | 16 |
| Text present in committed `TESTING.md` (repo root, not `testing/`) | 5 |
| Reconstructed: no committed copy of this text | 20 |
| **Total** | **41** |

Codes: **CE** = found exactly in a committed file; **CN** = found after normalising markdown bold or em dashes (the words are the same, the bytes are not); **R** = reconstructed.

| # | Group | Case | Code | Committed source | Note |
|---|---|---|---|---|---|
| 1 | testing-md | Test1-strong | CN | `TESTING.md` | Same words; committed file uses em dashes where this run used ` - `; file is at repo root, not in testing/ |
| 2 | testing-md | Test2-meets | CN | `TESTING.md` | Same words; committed file uses em dashes where this run used ` - `; file is at repo root, not in testing/ |
| 3 | testing-md | Test3-thin | CE | `TESTING.md` | Text found in the committed file (whitespace-normalised); file is at repo root, not in testing/ |
| 4 | testing-md | Test4-mismatch | CN | `TESTING.md` | Same words; committed file adds markdown bold (`**`); file is at repo root, not in testing/ |
| 5 | testing-md | Test5-borderline | CE | `TESTING.md` | Text found in the committed file (whitespace-normalised); file is at repo root, not in testing/ |
| 6 | di | spot-check-dmai-wk1-ceo-audit | R | none | Reconstructed from memory earlier (CHANGELOG describes the spot check but does not contain the text) |
| 7 | di | WK1-Band1 | R | none | No committed copy. Transcribed from the earlier run script; source was the user's chat paste of DI_Test_Submissions.md (committed testing/di-test-results.md holds only a condensed paraphrase for 2 of these) |
| 8 | di | WK1-Band2 | R | none | No committed copy. Transcribed from the earlier run script; source was the user's chat paste of DI_Test_Submissions.md (committed testing/di-test-results.md holds only a condensed paraphrase for 2 of these) |
| 9 | di | WK1-Band3 | R | none | No committed copy. Transcribed from the earlier run script; source was the user's chat paste of DI_Test_Submissions.md (committed testing/di-test-results.md holds only a condensed paraphrase for 2 of these) |
| 10 | di | WK1-Band4 | R | none | No committed copy. Transcribed from the earlier run script; source was the user's chat paste, and the Band 4 text was expanded by merging the Band 3 text with the Band 4 additions |
| 11 | di | WK3-Band1 | R | none | No committed copy. Transcribed from the earlier run script; source was the user's chat paste of DI_Test_Submissions.md (committed testing/di-test-results.md holds only a condensed paraphrase for 2 of these) |
| 12 | di | WK3-Band2 | R | none | No committed copy. Transcribed from the earlier run script; source was the user's chat paste of DI_Test_Submissions.md (committed testing/di-test-results.md holds only a condensed paraphrase for 2 of these) |
| 13 | di | WK3-Band3 | R | none | No committed copy. Transcribed from the earlier run script; source was the user's chat paste of DI_Test_Submissions.md (committed testing/di-test-results.md holds only a condensed paraphrase for 2 of these) |
| 14 | di | WK3-Band4 | R | none | No committed copy. Transcribed from the earlier run script; source was the user's chat paste, and the Band 4 text was expanded by merging the Band 3 text with the Band 4 additions |
| 15 | di | WK4-Band1 | R | none | No committed copy. Transcribed from the earlier run script; source was the user's chat paste of DI_Test_Submissions.md (committed testing/di-test-results.md holds only a condensed paraphrase for 2 of these) |
| 16 | di | WK4-Band2 | R | none | No committed copy. Transcribed from the earlier run script; source was the user's chat paste of DI_Test_Submissions.md (committed testing/di-test-results.md holds only a condensed paraphrase for 2 of these) |
| 17 | di | WK4-Band3 | R | none | No committed copy. Transcribed from the earlier run script; source was the user's chat paste of DI_Test_Submissions.md (committed testing/di-test-results.md holds only a condensed paraphrase for 2 of these) |
| 18 | di | WK4-Band4 | R | none | No committed copy. Transcribed from the earlier run script; source was the user's chat paste, and the Band 4 text was expanded by merging the Band 3 text with the Band 4 additions |
| 19 | di | WK5-Band1 | R | none | No committed copy. Transcribed from the earlier run script; source was the user's chat paste of DI_Test_Submissions.md (committed testing/di-test-results.md holds only a condensed paraphrase for 2 of these) |
| 20 | di | WK5-Band2 | R | none | No committed copy. Transcribed from the earlier run script; source was the user's chat paste of DI_Test_Submissions.md (committed testing/di-test-results.md holds only a condensed paraphrase for 2 of these) |
| 21 | di | WK5-Band3 | R | none | No committed copy. Transcribed from the earlier run script; source was the user's chat paste of DI_Test_Submissions.md (committed testing/di-test-results.md holds only a condensed paraphrase for 2 of these) |
| 22 | di | WK5-Band4 | R | none | No committed copy. Transcribed from the earlier run script; source was the user's chat paste, and the Band 4 text was expanded by merging the Band 3 text with the Band 4 additions |
| 23 | ail-dmai | wk1-evaluate-llm-output | CE | `testing/boundary-test-submissions-ail-dmai.md` | Text found in the committed file (whitespace-normalised) |
| 24 | ail-dmai | wk2-swot-ai-industry-confident | CE | `testing/boundary-test-submissions-ail-dmai.md` | Text found in the committed file (whitespace-normalised) |
| 25 | ail-dmai | wk3-risk-appetite-confident | CE | `testing/boundary-test-submissions-ail-dmai.md` | Text found in the committed file (whitespace-normalised) |
| 26 | ail-dmai | wk5-pov-statement-confident | CE | `testing/boundary-test-submissions-ail-dmai.md` | Text found in the committed file (whitespace-normalised) |
| 27 | ail-dmai | dmai-wk1-ceo-audit-confident | CE | `testing/boundary-test-submissions-ail-dmai.md` | Text found in the committed file (whitespace-normalised) |
| 28 | ail-dmai | dmai-wk4-digital-deep-dive-confident | CE | `testing/boundary-test-submissions-ail-dmai.md` | Text found in the committed file (whitespace-normalised) |
| 29 | ail-dmai | dmai-wk5-personas-confident | CE | `testing/boundary-test-submissions-ail-dmai.md` | Text found in the committed file (whitespace-normalised) |
| 30 | ail-dmai | dmai-wk6-email-campaigns-confident | CE | `testing/boundary-test-submissions-ail-dmai.md` | Text found in the committed file (whitespace-normalised) |
| 31 | ail-dmai | dmai-wk7-content-plan | CE | `testing/boundary-test-submissions-ail-dmai.md` | Text found in the committed file (whitespace-normalised) |
| 32 | ail-dmai | dmai-wk9-more-reach | CE | `testing/boundary-test-submissions-ail-dmai.md` | Text found in the committed file (whitespace-normalised) |
| 33 | boundary-0v1-3v4 | wk2-swot-ai-industry-ambiguous | CE | `testing/boundary-test-0v1-3v4.md` | Text found in the committed file (whitespace-normalised); file text is a description of a submission, used verbatim as the submission |
| 34 | boundary-0v1-3v4 | dmai-wk1-ceo-audit-ambiguous | CE | `testing/boundary-test-0v1-3v4.md` | Text found in the committed file (whitespace-normalised); file text is a description of a submission, used verbatim as the submission |
| 35 | boundary-0v1-3v4 | di-wk1-notion-page-ambiguous | CE | `testing/boundary-test-0v1-3v4.md` | Text found in the committed file (whitespace-normalised); file text is a description of a submission, used verbatim as the submission |
| 36 | boundary-0v1-3v4 | wk3-risk-appetite-ambiguous | CE | `testing/boundary-test-0v1-3v4.md` | Text found in the committed file (whitespace-normalised); file text is a description of a submission, used verbatim as the submission |
| 37 | boundary-0v1-3v4 | dmai-wk5-personas-ambiguous | CE | `testing/boundary-test-0v1-3v4.md` | Text found in the committed file (whitespace-normalised); file text is a description of a submission, used verbatim as the submission |
| 38 | boundary-0v1-3v4 | di-wk5-marketing-email-ambiguous | CE | `testing/boundary-test-0v1-3v4.md` | Text found in the committed file (whitespace-normalised); file text is a description of a submission, used verbatim as the submission |
| 39 | boundary-2v3 | wk1-evaluate-llm-output-2v3 | R | none | Committed testing/boundary-test-2v3.md holds only a description of this submission; the text used was authored from it earlier and exists in no committed file |
| 40 | boundary-2v3 | dmai-wk4-digital-deep-dive-2v3 | R | none | Committed testing/boundary-test-2v3.md holds only a description of this submission; the text used was authored from it earlier and exists in no committed file |
| 41 | boundary-2v3 | di-wk3-ai-research-presentation-2v3 | R | none | Committed testing/boundary-test-2v3.md holds only a description of this submission; the text used was authored from it earlier and exists in no committed file |

**Attribution caveat.** Even the CE/CN rows cannot be proven byte-identical to the text the *baseline* run used, because the baseline scripts no longer exist; they match the committed files, and the baseline was built from the same files, but that is an inference. For the R rows there is nothing to compare against at all. **Any whole-number mark change on any of these 41 cases cannot be attributed to the presence-evidence fix alone**: it could equally be a wording difference in the rebuilt text, or ordinary run-to-run variance (earlier rounds saw the same unchanged text return different `boundaryCase` values and raw scores up to 0.4 apart). Attribution is weakest for the 20 R rows.

The exact texts sent in this run are saved in `testing/cases/` (uncommitted; see `testing/cases/index.json` for checksums and a check that each saved file is byte-identical to what was sent).
## Step 1: Test 6 run five times

Expected (TESTING.md Test 6): the learner's own written piece is marked unmet, and the mark lands around 2/4.

| Run | rawScore | mark | boundaryCase | boundaryBands | Own-writing criterion flagged unmet? | Unmet criteria (count) |
|---|---|---|---|---|---|---|
| 1 | 2.5 | 3 | true | [2,3] | yes | 1 |
| 2 | 2.5 | 3 | true | [2,3] | yes | 1 |
| 3 | 2.5 | 3 | true | [2,3] | yes | 1 |
| 4 | 2.5 | 3 | true | [2,3] | yes | 1 |
| 5 | 2.5 | 3 | true | [2,3] | yes | 2 |

**Spread:** marks 3, 3, 3, 3, 3; distinct marks 3; rawScore 2.5 to 2.5; runs at mark 3 or above: 5/5; own-writing criterion detected as unmet: 5/5; boundaryCase true: 5/5.

**Verdict on consistency: CONSISTENT but WRONG (all five runs mark 3, expected about 2).**

### Per-run presenceEvidence and reasoning

**Run 1** — raw 2.5, mark 3, boundaryCase true [2,3], borderline true
  - **[UNMET]** Learner's own ~100 word writing produced without AI on the same subject (quote: null)
  - [met] A prompt given to the LLM (quote: "My prompt was: "Write a short, professional but warm email update to a client whose project is now two weeks …")
  - [met] The LLM's output on the same subject (quote: "The LLM's response was a well-structured email: it opened with a clear apology, explained the supplier delay …")
  - [met] An evaluation comparing the learner's own writing and the LLM's output (quote: "the tone didn't quite match how I actually talk to this client, who I've worked with for years and who prefer…")
  - [met] Stretch: concrete next steps to improve the AI output (quote: "Next time I'll add a line like "keep the tone casual, like emailing a long-term contact" rather than assuming…")
  - bandReasoning (start): The submission clearly addresses the assignment topic. The prompt, the LLM output, a thoughtful evaluation, and stretch-goal next steps are all present, and the reflection is genuinely insightful. However, applying the hard ceiling: the meets-expectations band requires an evaluation comparing the learner's own writing and the LLM's output, and the overview specifies the learner first writes ~100 words without AI. Th…

**Run 2** — raw 2.5, mark 3, boundaryCase true [2,3], borderline true
  - **[UNMET]** Learner's own ~100 word writing on the scenario, produced without AI (quote: null)
  - [met] A prompt given to an LLM on the same subject (quote: "My prompt was: "Write a short, professional but warm email update to a client whose project is now two weeks …")
  - [met] The LLM's output described (quote: "The LLM's response was a well-structured email: it opened with a clear apology, explained the supplier delay …")
  - [met] A short evaluation comparing the learner's own writing and the LLM's output (quote: "the structure was strong and the reason for the delay was clear, but the tone didn't quite match how I actual…")
  - [met] Concrete next steps to improve the AI output (stretch) (quote: "I'd want to strip out the corporate closing line and shorten a couple of the sentences.")
  - bandReasoning (start): The submission includes a clear prompt, a description of the LLM output, a thoughtful critique, and concrete next steps to improve the output, which would satisfy the stretch goal. However, a core presence requirement is missing: the learner's own ~100 word piece of writing on the same subject, produced without AI. The evaluation compares the LLM output against the learner's general style and how they usually talk t…

**Run 3** — raw 2.5, mark 3, boundaryCase true [2,3], borderline true
  - **[UNMET]** Learner's own ~100 word writing on the scenario (produced without AI) (quote: null)
  - [met] Prompt given to the LLM (quote: "My prompt was: "Write a short, professional but warm email update to a client whose project is now two weeks …")
  - [met] LLM's output on the same subject described (quote: "The LLM's response was a well-structured email: it opened with a clear apology, explained the supplier delay …")
  - [met] Evaluation comparing the learner's own writing and the LLM's output (quote: "the tone didn't quite match how I actually talk to this client, who I've worked with for years and who prefer…")
  - [met] Comment on readability/engagement/human vs AI feel (quote: "it included a generic "we value your business" line that felt a bit corporate for them")
  - [met] Stretch: concrete next steps to improve the AI output (quote: "Next time I'll add a line like "keep the tone casual, like emailing a long-term contact" rather than assuming…")
  - bandReasoning (start): The submission contains a clear prompt, a detailed description of the LLM output, a thoughtful critique, a reflection, and concrete next steps that would satisfy the stretch goal. However, the overview requires the learner to first write ~100 words on the scenario themselves, and the 3/4 requirement is an evaluation comparing the learner's own writing against the LLM output. No actual own-written version is present …

**Run 4** — raw 2.5, mark 3, boundaryCase true [2,3], borderline true
  - **[UNMET]** Learner's own ~100 word writing on the scenario, produced without AI (quote: null)
  - [met] LLM output produced on the same subject (quote: "The LLM's response was a well-structured email: it opened with a clear apology, explained the supplier delay …")
  - [met] Evaluation comparing the learner's own writing and the LLM's output (quote: "the structure was strong and the reason for the delay was clear, but the tone didn't quite match how I actual…")
  - [met] Stretch: concrete next steps to improve the AI output or examples of improvement (quote: "Next time I'll add a line like "keep the tone casual, like emailing a long-term contact" rather than assuming…")
  - bandReasoning (start): Applying the hard ceiling first: the meets-expectations band rests on an evaluation that compares the learner's own writing with the LLM's output. The submission never includes the learner's own ~100 word draft written without AI; it only describes the prompt, paraphrases the LLM output, and compares the output to how the learner generally talks to the client rather than to an actual written version they produced. B…

**Run 5** — raw 2.5, mark 3, boundaryCase true [2,3], borderline true
  - **[UNMET]** Learner's own ~100 word writing produced without AI help (quote: null)
  - [met] A prompt given to the LLM (quote: "My prompt was: "Write a short, professional but warm email update to a client whose project is now two weeks …")
  - [met] The LLM's output described (quote: "The LLM's response was a well-structured email: it opened with a clear apology, explained the supplier delay …")
  - **[UNMET]** Evaluation comparing the learner's own writing and the LLM's output (quote: "the tone didn't quite match how I actually talk to this client, who I've worked with for years and who prefer…")
  - [met] Concrete next steps to improve the AI output (stretch) (quote: "Next time I'll add a line like "keep the tone casual, like emailing a long-term contact" rather than assuming…")
  - bandReasoning (start): The submission clearly addresses the assignment topic and shows strong understanding of how to evaluate AI output. The prompt, the LLM's output, a thoughtful critique, a reflection, and concrete next steps (the stretch element) are all present. However, the core presence criterion for the meets-expectations band is a comparison between the learner's OWN written version and the LLM's output. The learner never produce…

## Step 2: control submissions where the required artefact is present

"Designed mark" is the mark each control was written to earn. No pre-fix run was made on these (credits are tight and reverting the code would double the cost), so a "drop" here means *below the designed mark*, not below a measured baseline.

| Control | Rubric | Designed mark | Actual mark | rawScore | boundaryCase | Dropped below design? | Unmet criteria |
|---|---|---|---|---|---|---|---|
| C1-AIL-wk1-own-piece-present-meets | wk1-evaluate-llm-output | 3 | 3 | 3 | false null | no | Stretch: concrete next steps to improve AI output or examples of impr… |
| C2-AIL-wk1-own-piece-present-stretch | wk1-evaluate-llm-output | 4 | 4 | 4 | false null | no | none |
| C3-DMAI-wk5-two-full-personas | dmai-wk5-personas | 3 | 3 | 3 | false null | no | Stretch: 3 full personas; Stretch: touchpoints and sales funnel opportunities defined |
| C4-DMAI-wk9-five-full-posts | dmai-wk9-more-reach | 3 | 4 | 4 | false null | no (above design) | none |

**Controls that dropped below their designed mark: none.**

### Per-control presenceEvidence

**C1-AIL-wk1-own-piece-present-meets** (Standalone human-written piece, LLM output and a 50-100 word evaluation all present; no next steps, so stretch not met.)
  - [met] Own writing ~50-100 words without AI (quote: "Last Tuesday our main supplier told us the new batch of packaging would arrive a week late. I rang the three …")
  - [met] Prompt given to the LLM (quote: "The prompt I gave the LLM: "Write about how I handled a delayed packaging shipment from a supplier, in the fi…")
  - [met] LLM's output on the same subject (quote: "When our packaging supplier warned that a shipment would arrive a week late, I immediately contacted every af…")
  - [met] 50-100 word evaluation comparing own writing and LLM output (readability, engagement, human/AI) (quote: "The LLM version is smoother and more polished, with tighter sentences, but it reads as generic... Mine is mor…")
  - **[UNMET]** Stretch: concrete next steps to improve AI output or examples of improvement (quote: null)
  - bandReasoning (start): All presence-based criteria for the 3/4 (meets expectations) band are satisfied: the learner provided their own ~95 word writing without AI, the exact prompt, the LLM output on the same subject, and a focused evaluation (around 90 words) that compares readability, engagement and whether each reads as human or AI written. This clearly meets the requirements band. The only missing element is the stretch goal: the eval…

**C2-AIL-wk1-own-piece-present-stretch** (Standalone human-written piece, LLM output and a 50-100 word evaluation present, plus concrete next steps for improving the AI output (stretch goal).)
  - [met] Own writing (~100 words) produced without AI (quote: "Our weekly team meeting kept overrunning to an hour, so last month I changed it.")
  - [met] A prompt given to an LLM on the same subject (quote: "The prompt I gave the LLM: "Write about how I shortened my team's weekly meeting, first person, about 100 wor…")
  - [met] The LLM's output included (quote: "To tackle our overrunning weekly meeting, I introduced a streamlined format.")
  - [met] A short (50-100 word) evaluation comparing own writing and LLM output (quote: "The LLM version is crisper and more confident, but it flattens the story... Mine is warmer and more specific,…")
  - [met] Comment on readability/engagement/human vs AI feel (quote: "The LLM version is crisper and more confident, but it flattens the story")
  - [met] Stretch: concrete next steps to improve AI output or examples of improvement (quote: "To improve the AI output I would prompt it to keep my specific details and avoid unsupported claims, and I ha…")
  - bandReasoning (start): All presence-based criteria for the meets-expectations band (3) are satisfied: own ~90 word piece without AI, a prompt, the LLM output, and a focused ~90 word comparative evaluation touching on readability, engagement and human vs AI feel. The submission then clearly achieves the stretch goal, giving both a concrete next step (prompt to keep specific details and avoid unsupported claims) and an actual example of an …

**C3-DMAI-wk5-two-full-personas** (Two personas each written out with all nine required elements; no touchpoint/funnel mapping, so stretch not met.)
  - [met] 2-3 customer personas (quote: "Persona 1 - Persona name: Priya Nair")
  - [met] Persona name (quote: "Persona name: Daniel Okafor")
  - [met] Location (quote: "Location: Leeds, UK")
  - [met] Profession or industry (quote: "Profession or industry: Primary school teaching assistant")
  - [met] Income or turnover (quote: "Income or turnover: about 24,000 pounds a year (household income around 48,000 pounds)")
  - [met] Point of need/challenge (quote: "Point of need/challenge: wants healthy, quick weekday meals for two children without spending evenings cooking")
  - [met] Buying behaviour and frequency (quote: "Buying behaviour and frequency: orders a weekly meal box online, usually on a Sunday evening, and buys occasi…")
  - [met] Communication style (quote: "Communication style: short, friendly messages; skims email on her phone; likes clear prices")
  - [met] Preferred channel(s) (quote: "Preferred channel(s): Instagram and email")
  - [met] Tone of voice (quote: "Tone of voice: warm, practical, reassuring")
  - **[UNMET]** Stretch: 3 full personas (quote: null)
  - **[UNMET]** Stretch: touchpoints and sales funnel opportunities defined (quote: null)
  - bandReasoning (start): Both personas present every required element: name, location, profession, income, point of need, buying behaviour and frequency, communication style, preferred channels, and tone of voice. This fully satisfies the meets-expectations band requirement of 2-3 complete personas. The submission does not reach band 4 because it includes only 2 personas (not 3) and does not define any touchpoints or sales funnel opportunit…

**C4-DMAI-wk9-five-full-posts** (Five posts, each with Channel, Post Type, Date, Caption, Image Assets & Descriptions and Hashtags written out.)
  - [met] At least 5 social posts (quote: "Post 1 ... Post 2 ... Post 3 ... Post 4 ... Post 5")
  - [met] Channel for each post (quote: "Channel: Instagram")
  - [met] Post Type for each post (quote: "Post type: Reel")
  - [met] Date for each post (quote: "Date: Monday 7 April")
  - [met] Caption for each post (quote: "Caption: "Something is blooming in the oven... Spring Blossom cakes arrive on Saturday."")
  - [met] Image Assets & Descriptions for each post (quote: "Image assets & descriptions: 15-second video of a cake being decorated with edible flowers.")
  - [met] Relevant Hashtags for each post (quote: "Hashtags: #SpringBlossom #RyeAndRise #BakeryLove")
  - [met] Links the series to a content cluster, event, or brand-based persona (quote: "Five social posts promoting the launch of the new Spring Blossom cake range at Rye & Rise Bakery.")
  - bandReasoning (start): All presence-based criteria for the meets-expectations band (3) are satisfied: there are 5 complete posts, each containing Channel, Post Type, Date, Caption, Image Assets & Descriptions, and Hashtags. The submission also clearly links the whole series to a single event and content cluster, the launch of the Spring Blossom cake range, with posts building in sequence from teaser (7 April) to launch day (12 April). Thi…

## Step 3: TESTING.md tests 1 to 5 on the final code

These five submissions are cases 1 to 5 of the 41-case set, so they were run once, in that set, rather than twice (to save credits). Their results are in the table below and repeated here.

| Test | Baseline mark (final report) | New mark | rawScore | boundaryCase | Unmet presence criteria |
|---|---|---|---|---|---|
| Test1-strong | 4 | 4 | 4 | false | none |
| Test2-meets | 3 | 3 | 3 | false | Concrete next steps to improve AI output or examples of improvements made (stre… |
| Test3-thin | 1 | 1 | 1.4 | true | A 50-100 word evaluation comparing own writing and LLM output; Comparison referencing readability/engagement or whether text reads as human/AI…; Stretch: concrete next steps to improve the AI output or examples of improvemen… |
| Test4-mismatch | 0 | 1 | 0.5 | true | Learner's own ~100 word writing on a real work scenario (no AI); LLM-produced output on the same subject; A 50-100 word evaluation comparing the two versions (readability, engagement, h…; Concrete next steps to improve the AI output (stretch goal) |
| Test5-borderline | 3 | 3 | 2.5 | true | Stretch: concrete next steps to improve the AI output or examples of improvemen… |

Test 4 is the topic-mismatch case: pass means `topicMismatch: true` is still returned. Observed: topicMismatch true, mark 1.
## Step 4: the 41-case set against `fix-verification-results-final.md`

Baseline = the "After" mark in the committed final report (boundary-fix code). New = this run (presence-evidence code, HEAD `fcc2359`). Prov codes are defined in the provenance section.

| # | Case | Prov | Base mark | New mark | Moved? | New raw | boundaryCase (base → new) | Unmet presence criteria |
|---|---|---|---|---|---|---|---|---|
| 1 | Test1-strong | CN | 4 | 4 | no | 4 | false → false | none |
| 2 | Test2-meets | CN | 3 | 3 | no | 3 | false → false | Concrete next steps to improve AI output or examples of improvements … |
| 3 | Test3-thin | CE | 1 | 1 | no | 1.4 | true → true | A 50-100 word evaluation comparing own writing and LLM output; Comparison referencing readability/engagement or whether text reads a…; Stretch: concrete next steps to improve the AI output or examples of … |
| 4 | Test4-mismatch | CN | 0 | 1 | **MOVED** | 0.5 | false → true | Learner's own ~100 word writing on a real work scenario (no AI); LLM-produced output on the same subject; A 50-100 word evaluation comparing the two versions (readability, eng…; Concrete next steps to improve the AI output (stretch goal) |
| 5 | Test5-borderline | CE | 3 | 3 | no | 2.5 | true → true | Stretch: concrete next steps to improve the AI output or examples of … |
| 6 | spot-check-dmai-wk1-ceo-audit | R | 3 | 3 | no | 3 | false → false | Outbound/inbound tactics organised into paid/owned/earned media (stre… |
| 7 | WK1-Band1 | R | 2 | 2 | no | 1.5 | true → true | Variety of at least 3 content blocks; Published with a link provided (URL); Self-reflection included |
| 8 | WK1-Band2 | R | 2 | 2 | no | 2 | false → false | Variety of at least 3 content blocks; Self-reflection submitted (written or recorded) |
| 9 | WK1-Band3 | R | 3 | 3 | no | 3.4 | true → true | none |
| 10 | WK1-Band4 | R | 4 | 4 | no | 4 | false → false | none |
| 11 | WK3-Band1 | R | 1 | 1 | no | 1 | false → false | Shared correctly (published page or public link); Content is learner's own evaluation rather than pasted/copied output; Resources attributed with links; No more than 10 slides / 2 pages of A4 |
| 12 | WK3-Band2 | R | 2 | 2 | no | 2 | true → false | Resources attributed with links; Attention to presentation/layout with visuals; Two areas covered with detail |
| 13 | WK3-Band3 | R | 3 | 4 | **MOVED** | 3.5 | true → true | none |
| 14 | WK3-Band4 | R | 4 | 4 | no | 4 | false → false | none |
| 15 | WK4-Band1 | R | 2 | 2 | no | 1.5 | true → true | Evaluated the performance between the two; Provided a link to the evaluation / shared artefact; Provided a self-reflection (written or recorded); Stated a real goal to use both tools toward |
| 16 | WK4-Band2 | R | 2 | 2 | no | 2 | false → false | Evaluated performance between the two; Provided a self-reflection |
| 17 | WK4-Band3 | R | 3 | 3 | no | 3.4 | true → true | none |
| 18 | WK4-Band4 | R | 4 | 4 | no | 4 | false → false | none |
| 19 | WK5-Band1 | R | 1 | 1 | no | 1 | false → false | Custom subject line with learner's full name, course, assignment titl…; At least two design principles applied; At least two persuasive techniques; Logical structure and layout; Branding/consistency; Professional polish with appropriate links/buttons; Screenshots plus explanation included |
| 20 | WK5-Band2 | R | 2 | 2 | no | 1.6 | true → true | Subject line with full name, course, assignment title, and custom sub…; At least two design principles applied and explained; At least two persuasive techniques used; Self-reflection included |
| 21 | WK5-Band3 | R | 3 | 3 | no | 3 | false → false | none |
| 22 | WK5-Band4 | R | 4 | 4 | no | 4 | false → false | none |
| 23 | wk1-evaluate-llm-output | CE | 2 | 2 | no | 1.5 | true → true | Own writing (~100 words) on a real work scenario without AI; A 50-100 word evaluation comparing own writing and LLM output; Stretch: concrete next steps to improve the AI output or examples of … |
| 24 | wk2-swot-ai-industry-confident | CE | 1 | 1 | no | 1.4 | false → true | Uses relevant legal/ethical issues (IP law, privacy, defamation, prod…; Explains what each issue means rather than just listing it; Refers to all key issue areas, explaining why any omitted (stretch); Reflects on how the task develops understanding of business or AI (st… |
| 25 | wk3-risk-appetite-confident | CE | 1 | 1 | no | 1.4 | true → true | Identifies three AI application areas; Benefits for each area; Risks for each area (legal, ethical, reputational, financial, operati…; Alignment with risk appetite for each area; ~300 word reflection on LLM usefulness/limitation (if LLM used); Stretch: comparison with a different type of business; Stretch: governance measure to expand AI use within risk appetite |
| 26 | wk5-pov-statement-confident | CE | 1 | 1 | no | 1.4 | true → true | Prompts used submitted; What the AI surfaced that the learner had forgotten; Comparison with manually generated problems; Highest priority problems (prioritised by customer value); Assessment of the AI output; Stretch: uses LLM to refine the POV statements |
| 27 | dmai-wk1-ceo-audit-confident | CE | 1 | 1 | no | 1.4 | false → true | Company Vision stated; Company Values stated; 7Ps of Marketing applied to the business; Outbound/inbound tactics organised into paid/owned/earned media |
| 28 | dmai-wk4-digital-deep-dive-confident | CE | 1 | 1 | no | 1 | false → false | Objectives; Content Strategy; Channel Strategy; Media Strategy; Tactics; Place within the sales funnel; Deep dive of at least one of Website, Email, or Social Media; Recommendation for an additional valid channel strategy |
| 29 | dmai-wk5-personas-confident | CE | 1 | 1 | no | 1 | false → false | Persona name; Location; Profession or industry; Income or turnover; Point of need/challenge; Buying behaviour and frequency; Communication style; Tone of voice; 2-3 distinct personas created; Sales funnel touchpoints/opportunities (stretch) |
| 30 | dmai-wk6-email-campaigns-confident | CE | 1 | 1 | no | 1 | false → false | Defined audience / clear persona; 3 separate emails forming a full funnel; Clear call to action in each email; SMYKM subject line; Non-salesy first sentence; Clear transition; Clear challenge; Clear value proposition; Clear objection handling; Concise close; Follow-up email; Reflection/evaluation of AI output and usefulness to business |
| 31 | dmai-wk7-content-plan | CE | 2 | 2 | no | 1.5 | true → true | Each piece of content fully described in the plan outline; Using and explaining each of the areas described in the content plan …; Content covers each stage/area of the sales funnel (stretch) |
| 32 | dmai-wk9-more-reach † | CE | 2 | 2 | no | 1.5 | true → true | At least 5 social posts; Image Assets & Descriptions; Relevant Hashtags; Link to content cluster, event, or brand-based persona |
| 33 | wk2-swot-ai-industry-ambiguous | CE | 1 | 1 | no | 0.5 | true → true | Relevant legal/ethical issues (IP law, privacy, defamation, product l…; Explanation of what each issue means; Reference to all key issue areas (stretch); Reflection on how the task develops understanding (stretch) |
| 34 | dmai-wk1-ceo-audit-ambiguous | CE | 0 | 0 | no | 0.4 | true → true | Vision stated; Mission stated; Values stated; 7Ps of Marketing applied; Outbound/inbound tactics organised into paid/owned/earned media |
| 35 | di-wk1-notion-page-ambiguous | CE | 1 | 1 | no | 1.4 | true → true | Uses a variety of at least 3 content blocks; Page structured well with clear content; A self-reflection (written or recorded) |
| 36 | wk3-risk-appetite-ambiguous | CE | 3 | 3 | no | 3 | false → false | Discusses how regulation/reputation/culture differences affect AI ado…; Suggests a governance measure to expand AI use within risk appetite |
| 37 | dmai-wk5-personas-ambiguous | CE | 4 | 4 | no | 3.5 | true → true | none |
| 38 | di-wk5-marketing-email-ambiguous | CE | 4 | 4 | no | 3.5 | true → true | none |
| 39 | wk1-evaluate-llm-output-2v3 | R | 2 | 3 | **MOVED** | 2.5 | true → true | Evaluation is 50-100 words; Stretch: concrete next steps to improve AI output or examples of impr… |
| 40 | dmai-wk4-digital-deep-dive-2v3 | R | 3 | 3 | no | 3 | false → false | Recommendation for an additional, valid channel strategy (stretch) |
| 41 | di-wk3-ai-research-presentation-2v3 | R | 3 | 3 | no | 2.5 | true → true | Each area covered with detail, clarity and structure |

† Case 31 (`dmai-wk9-more-reach`) is **not in the committed final report's table** (that table has 40 rows, not 41). Its baseline here (mark 2, raw 1.5, boundaryCase true) comes from the earlier 15-case re-run record in the working session, not from a committed file.

**Completed: 41/41. Whole-number marks that moved: 3.**

| # | Case | Prov | Baseline → new |
|---|---|---|---|
| 4 | Test4-mismatch | CN | 0 → 1 |
| 13 | WK3-Band3 | R | 3 → 4 |
| 39 | wk1-evaluate-llm-output-2v3 | R | 2 → 3 |

**Attribution warning:** every case above is one of the 41 whose text was rebuilt after the scratchpad was cleared (see provenance). A mark change on any of them cannot be attributed to the fix alone; it may reflect a wording difference in the rebuilt text or ordinary sampling variance. Rows coded R (reconstructed, no committed copy) are the least attributable.

**boundaryCase flips (informational; the instruction was about whole-number marks): 4.** #4 Test4-mismatch (false → true); #12 WK3-Band2 (true → false); #24 wk2-swot-ai-industry-confident (false → true); #27 dmai-wk1-ceo-audit-confident (false → true).
## Parse errors and truncated output

Truncation at the `max_tokens` ceiling shows up as unparsable JSON (an "Unterminated string" parse error), so parse errors and truncations are the same list. The runner stops at the first error and does not retry.

- Calls made: 50 of 50 planned.
- Cases that returned a parse error or truncated output: **none**
- Cases not run (because the run stopped or had not finished): none
- Returned parseable JSON but with a required field left empty: 
  - Empty `bandReasoning` (0 characters; the schema requires the field but does not enforce a minimum length): 7/50 calls — WK1-Band1 (mark 2, boundaryCase true); WK4-Band2 (mark 2, boundaryCase false); wk5-pov-statement-confident (mark 1, boundaryCase true); dmai-wk4-digital-deep-dive-confident (mark 1, boundaryCase false); dmai-wk5-personas-confident (mark 1, boundaryCase false); dmai-wk6-email-campaigns-confident (mark 1, boundaryCase false); di-wk5-marketing-email-ambiguous (mark 4, boundaryCase true)
  - Empty `presenceEvidence` list: 0/50 calls
  - No next steps: 0/50 calls

An empty `bandReasoning` means that call skipped the step that carries the ceiling instruction and the boundary reasoning, so its `boundaryCase` and `rawScore` were not preceded by written reasoning. None of those seven calls changed whole-number mark against the baseline, and none of the 9 Test 6 / control calls had an empty reasoning field.
## Token usage and approximate cost

**Exact usage was not captured.** The `/api/mark` route does not return the API's `usage` object, and this task forbids modifying code, so there is no measured token count. What follows is a bounded estimate. For exact figures, check the Anthropic Console usage page for the window below.

- Run window: 05/10/2026, 9:49:49 BST to 05/10/2026, 10:05:29 BST.
- Model: `claude-opus-4-8`, adaptive thinking, effort high, `max_tokens` 4000. Price used: $5 per million input tokens, $25 per million output tokens (claude-api reference, cached 2026-09-25). Thinking tokens are billed as output tokens.
- Calls made: 50 (50 returned a result, 0 errored). Sum of per-call latency: 15.7 minutes.

| Component | Low estimate | High estimate | Basis |
|---|---|---|---|
| Input tokens (system prompt + rubric + submission) | 65.3k | 87k | 261,009 chars measured from the real prompt templates; chars/4 (low) to chars/3 (high, allows for the newer tokenizer using up to about 1.35x more tokens) |
| Structured-output schema, if counted as input | 0 | 89.6k | 5,374 chars per call × 50; whether this counts as input is not confirmed by the API reference, so it is only in the high figure |
| Output tokens, visible response only | 36.7k | 48.9k | 146,726 chars of returned JSON; chars/4 to chars/3 |
| Output tokens, including hidden thinking | 36.7k | 200k | Thinking is not returned, so it is unmeasured. Floor = visible only. Ceiling = 50 calls × 4000 `max_tokens`, which bounds the output of each call (per Anthropic docs, `max_tokens` covers thinking plus the visible response) |

**Approximate cost: about $1.24 (floor) to about $5.88 (ceiling) for the whole run.** The floor assumes no thinking tokens; the ceiling assumes every call used its full 4000-token output allowance. Calls averaged about 19 seconds; generating 4000 tokens would normally take longer than that, so the ceiling is probably pessimistic, but that rests on an assumption about generation speed that I did not measure. Treat the figure as a bound, not a bill. Errored calls (if any) are counted at the ceiling.

## Step 5: proposed code-level cap (for your approval; nothing implemented)

**Why a cap and not another prompt change.** Test 6 did not come out inconsistent, it came out consistently wrong (3 in 5 of 5). That is not literally step 5's trigger, but the remedy it names fits: the prompt route has now been tried twice, and the evidence above shows the model already reaches the right conclusion in prose (a ceiling at band 2) and loses it between the reasoning and the rounded mark. Prompt wording cannot fix a rounding step, so I did not strengthen it.

**Option A (recommended): the model states the ceiling as a number, the code enforces it.**
- `lib/marking.ts`: add a required numeric field `ceilingBand` (0 to 4) to the schema, generated before `boundaryCase`: "the highest band this submission can reach given any required evidence that is missing; 4 if nothing required is missing."
- `lib/scoring.ts`: give `computeBand` an optional third argument, `ceilingBand` (default 4, so existing callers and every uncapped case behave exactly as now): `mark = Math.min(Math.round(clamped), ceilingBand)`. Rounding and the 0.4 to 0.6 window are untouched for uncapped cases.
- Design choice for you: when the cap actually lowers a mark, also set `borderline` true, so a second marker sees it. I would, because a capped mark is one a human should confirm.
- Why this shape: it is the same pattern as `boundaryCase` (an explicit field the code can act on). In 4 of 5 Test 6 runs the reasoning says the work is capped (runs 3 and 4 name band 2; runs 2 and 5 say "below band 3"; run 1 is softer, "cannot fully sit at band 3"), and `wk1-evaluate-llm-output-2v3` says "capped below band 3 ... band 2 is the clear fit". The model already worked out the ceiling in prose. A numeric field makes that decision enforceable. A required number also cannot be silently left empty the way `bandReasoning` was in 7 of 50 calls (it can be wrong, but not absent).
- Risks: the model can set `ceilingBand` too high (no protection) or too low for quality reasons (a false cap). Untested.

**Option B: per-criterion tag.** Add `requiredForMeets: boolean` to each `presenceEvidence` item and cap the mark at 2 when any required item is unmet. Evidence against it: the model's own list is loose. Of 22 calls scoring 3 or above, 9 had an unmet item, so an untagged "any unmet" cap would wrongly hit all 9. Even tagged, `di-wk3-ai-research-presentation-2v3` listed "each area covered with detail, clarity and structure" as unmet (a quality judgement filed as presence). A tagged cap would likely have dropped that case from 3 to 2. That case is a deliberately ambiguous 2/3 submission, so it is arguable, but it is a false-cap risk Option A does not share.

**If you approve A:** implement in `lib/marking.ts` and `lib/scoring.ts` only, then re-run Test 6 ×5, the 4 controls and the 41-case set (50 calls, same estimated cost bound as this run: about $1.2 to $5.9). Acceptance: Test 6 at mark 2 in 5 of 5 runs; no control below its designed mark; no 41-case mark changing except through the cap on cases that genuinely lack a required artefact. I would also add a minimum length to `bandReasoning` in the schema description, but that is a separate change and I have not tested whether it fixes the empty-reasoning calls.

## Flags (observed, not changed)

1. **`fix-verification-results-final.md` has a 40-row table under a "41 cases" heading.** `dmai-wk9-more-reach` is missing from the AIL/DMAI table. This is my error from the earlier round.
2. **TESTING.md fixtures conflict with the new rule.** Tests 1, 2, 3 and 5 describe the learner's own piece instead of including it. If the fix is meant to enforce "a standalone own piece must exist", those fixtures should now score lower, and Test 6 is the only one that includes a deliberate absence. Your call whether to revise the fixtures or accept description as evidence.
3. **TESTING.md Test 5 still says the Borderline badge is shown**, but the badge was removed from the UI on 2026-09-04.
4. **TESTING.md's "Status on Test 6" note is out of date.** It says Test 6 and the `max_tokens` 4000 change are unverified. After this run: `max_tokens` 4000 produced no truncation in 50 calls, and Test 6 is verified as *not* meeting its expectation.
5. **The DI case texts exist in no committed file.** Only `testing/cases/` (uncommitted) now holds them. If you want the 41 texts kept, commit `testing/cases/` once you are happy with it.
6. **The runner and report scripts live only in the scratchpad**, which has already been cleared once. Say if you want them saved under `testing/` or `scripts/`.
7. **Exact cost needs the Anthropic Console.** The window for this run is in the cost section.

## Files created (all uncommitted)

- `testing/presence-fix-verification.md` (this report)
- `testing/cases/` (47 files: 41 case texts in `set41/`, `test6.txt`, 4 control texts in `controls/`, and `index.json` with checksums and a byte-identity check against what was sent)
