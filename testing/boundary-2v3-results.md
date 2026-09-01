# Boundary test results — 2-vs-3

Read-only measurement exercise. All 3 submissions in [boundary-test-2v3.md](boundary-test-2v3.md) were run through the live dev server's `/api/mark` route (same code path production uses). No production file (`lib/rubrics.ts`, `lib/marking.ts`, `lib/scoring.ts`, the API route) was modified — `computeBand`'s rounding and 0.4-0.6 borderline threshold are untouched, per instructions.

## Results table

| Assignment | Boundary Tested | Raw Score | Mark | Borderline? |
|---|---|---|---|---|
| wk1-evaluate-llm-output | 2-vs-3 | 2.3 | 2 | No |
| dmai-wk4-digital-deep-dive | 2-vs-3 | 3.0 | 3 | No |
| di-wk3-ai-research-presentation | 2-vs-3 | 2.6 | 3 | Yes |

## Full explanation text and hedging analysis

Applying the same standard used in the 0-vs-1/3-vs-4 round: explicit "sits/places on the boundary between X and Y" language counts as genuine hedging; a plain statement of what's needed to reach the next band up (without "between"/"boundary"/"could go either way" framing) does not, even if it names a gap.

### wk1-evaluate-llm-output (raw 2.3, mark 2, not borderline)

> "The assignment asks for a 50 to 100 word evaluation to fully meet expectations, but your evaluation is only around 15 words. It shows understanding of the key contrasts, yet it is not developed enough to sit comfortably in the meets band, which places it on the boundary between showing understanding and being complete."

**Hedging language:** Yes — "places it on the boundary between showing understanding and being complete." This is explicit "between X and Y" language, not a weak/borderline case of the standard. **Score reflects it:** No — raw 2.3 sits just outside the 2.4-2.6 window (0.1 short) and is not flagged Borderline. **Gap case**, though the raw score came close to the window this time.

### dmai-wk4-digital-deep-dive (raw 3.0, mark 3, not borderline)

> "This meets the 3/4 band: you covered Objectives, Content Strategy, Channel Strategy, Media Strategy, Tactics, and Place within the sales funnel, and delivered a focused deep dive on Email with specific metrics and improvement tactics. To reach 4/4 you would need to add one clear recommendation for an additional, valid channel strategy, which was not present."

**Hedging language:** No — this states a confident placement in band 3 ("meets the 3/4 band") and describes what's missing for band 4 as a specific, absent requirement, not an ambiguous "could go either way" call. Under the stricter standard applied here (matching the note on `wk3-risk-appetite` being a weak/borderline instance last round), this does not qualify as hedging — it reads the same as ordinary "next steps to the higher band" feedback that appears throughout confidently-scored submissions. **Score reflects it:** N/A; raw score is a clean 3.0, not borderline.

### di-wk3-ai-research-presentation (raw 2.6, mark 3, borderline)

> "This sits on the boundary between bands 2 and 3. The submission meets many of the 3-mark criteria (shared correctly, own evaluation, good layout, sources attributed), but the second topic on limitations is noticeably thinner than the first and lacks the detail, examples and explanation needed for both research areas to be covered in depth."

**Hedging language:** Yes — "sits on the boundary between bands 2 and 3." **Score reflects it:** Yes, raw 2.6 sits exactly in the 2.4-2.6 window (the prompt's own worked example range) and is flagged Borderline.

## Summary of the 3

- **Hedging text WITH a matching borderline-range score:** 1/3 — di-wk3-ai-research-presentation (2.6)
- **Hedging text WITHOUT a matching borderline-range score (gap):** 1/3 — wk1-evaluate-llm-output (2.3, 0.1 outside the window)
- **No hedging, confident:** 1/3 — dmai-wk4-digital-deep-dive (3.0)

---

# Final combined comparison across all boundaries

Pulling the hedge/gap-classified cases from `testing/boundary-test-results.md` (1-vs-2, via its "Feedback detail for confidently-overscored cases" section), `testing/boundary-0v1-3v4-results.md` (0-vs-1 and 3-vs-4), and this round's 2-vs-3 results above. Only cases with full explanation text and an explicit hedge/gap classification are counted — the 7 AIL/DMAI cases in the original 10-case batch that scored a clean 1.0-1.3 with no borderline flag were never run through full hedge-text analysis, so they're excluded from this table rather than assumed either way.

| Boundary | Cases tested | Gap cases (hedge, no matching flag) | Matched cases (hedge, matching flag) | No-hedge cases | Gap rate |
|---|---|---|---|---|---|
| 0-vs-1 | 3 | 1 | 1 | 1 | 33% (1/3) |
| 1-vs-2 | 3 | 3 | 0 | 0 | 100% (3/3) |
| 2-vs-3 | 3 | 1 | 1 | 1 | 33% (1/3) |
| 3-vs-4 | 3 | 1 | 2 | 0 | 33% (1/3) |
| **Total** | **12** | **6** | **4** | **2** | **50% (6/12)** |

## Does 2-vs-3 show a meaningfully lower gap rate?

**No.** The 2-vs-3 gap rate is 33% (1/3) — identical to 0-vs-1 (33%, 1/3) and 3-vs-4 (33%, 1/3), the two boundaries furthest from the worked example. It is lower than 1-vs-2 (100%, 3/3), but 1-vs-2 is the boundary immediately adjacent to 2-vs-3, not one of the distant ones. A distance-based anchoring effect would predict the gap rate rising as boundaries get further from 2.4-2.6; instead the highest gap rate in the dataset sits right next door to the worked example, and the boundary with the example itself scores the same as the two furthest away. These are small samples (n=3 per boundary, n=12 total), so a single case shifts any given boundary's rate by 33 points — but the actual numbers as measured show no gradient favouring 2-vs-3.

## Final assessment

**The anchoring-to-the-single-worked-example hypothesis is not supported by this data.** If the model's calibration at a boundary depended on how close that boundary is to the prompt's 2.4-2.6 worked example, 2-vs-3 should show the lowest gap rate in the set, and the rate should climb with distance from it. Neither holds: 2-vs-3's gap rate (33%) is tied with the two most distant boundaries (0-vs-1 and 3-vs-4, both 33%), and the adjacent 1-vs-2 boundary has the highest rate measured (100%).

The alternative hypothesis fits better: the hedging phrase ("sits/places on the boundary between X and Y") is a stock feedback construction the model reaches for near many numeric boundaries, largely independent of where those boundaries sit relative to the prompt's single worked example. Across all 12 classified cases, whether the explanation hedges looks driven by something other than proximity to 2.4-2.6 — the 1-vs-2 boundary produced hedging in every case tested despite being no closer to the worked example than 2-vs-3 is, and 2-vs-3 itself produced a non-hedging, confidently-scored case (`dmai-wk4-digital-deep-dive`, raw 3.0) sitting right in the boundary the example is supposed to calibrate.
