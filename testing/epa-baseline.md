# EPA baseline (AssisTED)

Measurement only. No code, prompt, rubric or settings file was changed. No retries were made. 53 calls, 0 HTTP errors, 0 parse failures (502).

## Environment

| Item | Value |
|---|---|
| Commit tested (origin/main, detached checkout) | `b2c57af7e85133f34e64e1d3f6ac6dbc49c76e8f`, tagged `epa-baseline` |
| Run window, UTC | 2026-10-07 15:39:08 to 2026-10-07 16:13:30 (2026-10-07) |
| Run window, BST | 2026-10-07 16:39:08 to 2026-10-07 17:13:30 (2026-10-07) |
| Model | claude-opus-4-8 (`lib/marking.ts`, adaptive thinking, effort high) |
| max_tokens | 6000 |
| AUTH_MODE | off (set inline on the command line) |
| RUBRIC_SOURCE | file (set inline on the command line) |
| Server | `npm run dev -- -p 3001` (development server, not a production build) |
| Runner | `testing/run-baseline.mjs` (new, adapted from the recovered `run-ceiling-v2.mjs`) |

## Results (53 calls)

"Designed" is the designed band or mark where known: Test 6 is 2; Tests 1 to 5 use the baseline marks from the earlier reports (4, 3, 1, 0, 3); the DI files use the band in their name; controls use their designed mark. The 20 other cases have no designed value in the repo and show n/a. "Presence" counts the presenceEvidence items; every item (criterion, level, met) is listed under "presenceEvidence items" below. Tokens are input and output (output includes hidden thinking). Seconds is the call duration.

| # | Stage | Case | Designed | Mark | rawScore | boundaryCase | borderline | capped | ceilingBand | topicMismatch | bandReasoning | Presence | stop_reason | In | Out | Sec |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1-test6 | Test6-run1 | 2 | 4 | 4 | false | false | false | 4 | false | no | 4 items, 0 required unmet | end_turn | 7645 | 2653 | 35.9 |
| 2 | 1-test6 | Test6-run2 | 2 | 2 | 3.5 | true | true | true | 4 | false | no | 4 items, 1 required unmet | end_turn | 7645 | 5761 | 78.7 |
| 3 | 1-test6 | Test6-run3 | 2 | 2 | 3.6 | true | true | true | 4 | false | no | 4 items, 1 required unmet | end_turn | 7645 | 3468 | 44.5 |
| 4 | 1-test6 | Test6-run4 | 2 | 4 | 3.6 | true | true | false | 4 | false | no | 4 items, 0 required unmet | end_turn | 7645 | 3235 | 43.6 |
| 5 | 1-test6 | Test6-run5 | 2 | 2 | 2.5 | true | true | true | 2 | false | no | 5 items, 1 required unmet | end_turn | 7645 | 4918 | 66.7 |
| 6 | 4-set41 | 01-testing-md__Test1-strong | 4 | 4 | 4 | false | false | false | 4 | false | no | 2 items, 0 required unmet | end_turn | 7540 | 1513 | 21.1 |
| 7 | 4-set41 | 02-testing-md__Test2-meets | 3 | 3 | 3 | false | false | false | 4 | false | no | 4 items, 0 required unmet | end_turn | 7411 | 1660 | 22.7 |
| 8 | 4-set41 | 03-testing-md__Test3-thin | 1 | 1 | 1.4 | true | true | false | 2 | false | no | 2 items, 1 required unmet | end_turn | 7295 | 1951 | 28.5 |
| 9 | 4-set41 | 04-testing-md__Test4-mismatch | 0 | 0 | 0 | false | false | false | 0 | true | no | 4 items, 3 required unmet | end_turn | 7434 | 1683 | 23.2 |
| 10 | 4-set41 | 05-testing-md__Test5-borderline | 3 | 3 | 2.6 | true | true | false | 3 | false | no | 2 items, 0 required unmet | end_turn | 7394 | 2186 | 31.0 |
| 11 | 4-set41 | 06-di__spot-check-dmai-wk1-ceo-audit | n/a | 3 | 3 | false | false | false | 4 | false | no | 6 items, 0 required unmet | end_turn | 7849 | 2028 | 28.8 |
| 12 | 4-set41 | 07-di__WK1-Band1 | 1 | 2 | 1.5 | true | true | false | 2 | false | no | 5 items, 3 required unmet | end_turn | 7500 | 2059 | 27.7 |
| 13 | 4-set41 | 08-di__WK1-Band2 | 2 | 2 | 2 | false | true | false | 2 | false | **empty** | 5 items, 2 required unmet | end_turn | 7498 | 1405 | 19.6 |
| 14 | 4-set41 | 09-di__WK1-Band3 | 3 | 3 | 3.4 | true | true | false | 4 | false | no | 5 items, 0 required unmet | end_turn | 7588 | 1953 | 27.3 |
| 15 | 4-set41 | 10-di__WK1-Band4 | 4 | 4 | 4 | false | false | false | 4 | false | no | 5 items, 0 required unmet | end_turn | 7685 | 1575 | 21.3 |
| 16 | 4-set41 | 11-di__WK3-Band1 | 1 | 1 | 1 | false | false | false | 1 | false | no | 5 items, 4 required unmet | end_turn | 7797 | 1974 | 28.6 |
| 17 | 4-set41 | 12-di__WK3-Band2 | 2 | 2 | 2 | false | false | false | 2 | false | no | 6 items, 1 required unmet | end_turn | 7809 | 1836 | 25.1 |
| 18 | 4-set41 | 13-di__WK3-Band3 | 3 | 3 | 3.4 | true | true | false | 4 | false | no | 7 items, 0 required unmet | end_turn | 7862 | 2255 | 29.3 |
| 19 | 4-set41 | 14-di__WK3-Band4 | 4 | 4 | 4 | false | false | false | 4 | false | no | 8 items, 0 required unmet | end_turn | 7974 | 2066 | 36.1 |
| 20 | 4-set41 | 15-di__WK4-Band1 | 1 | 2 | 1.5 | true | true | false | 2 | false | no | 6 items, 4 required unmet | end_turn | 7593 | 2114 | 29.2 |
| 21 | 4-set41 | 16-di__WK4-Band2 | 2 | 2 | 2 | false | false | false | 2 | false | no | 5 items, 2 required unmet | end_turn | 7609 | 1850 | 25.0 |
| 22 | 4-set41 | 17-di__WK4-Band3 | 3 | 3 | 3.4 | true | true | false | 4 | false | no | 7 items, 0 required unmet | end_turn | 7693 | 2193 | 33.0 |
| 23 | 4-set41 | 18-di__WK4-Band4 | 4 | 4 | 4 | false | false | false | 4 | false | no | 8 items, 0 required unmet | end_turn | 7863 | 1999 | 24.6 |
| 24 | 4-set41 | 19-di__WK5-Band1 | 1 | 1 | 1 | false | false | false | 1 | false | no | 8 items, 7 required unmet | end_turn | 8000 | 2067 | 27.4 |
| 25 | 4-set41 | 20-di__WK5-Band2 | 2 | 2 | 1.7 | true | true | false | 2 | false | no | 10 items, 5 required unmet | end_turn | 8057 | 2885 | 37.7 |
| 26 | 4-set41 | 21-di__WK5-Band3 | 3 | 3 | 3.3 | true | true | false | 4 | false | no | 10 items, 0 required unmet | end_turn | 8128 | 2094 | 27.1 |
| 27 | 4-set41 | 22-di__WK5-Band4 | 4 | 4 | 4 | false | false | false | 4 | false | no | 12 items, 0 required unmet | end_turn | 8238 | 2191 | 27.4 |
| 28 | 4-set41 | 23-ail-dmai__wk1-evaluate-llm-output | n/a | 2 | 1.5 | true | true | false | 2 | false | no | 1 items, 1 required unmet | end_turn | 7294 | 1829 | 26.4 |
| 29 | 4-set41 | 24-ail-dmai__wk2-swot-ai-industry-confident | n/a | 1 | 1.4 | true | true | false | 1 | false | no | 5 items, 2 required unmet | end_turn | 7323 | 1944 | 26.0 |
| 30 | 4-set41 | 25-ail-dmai__wk3-risk-appetite-confident | n/a | 1 | 1.4 | true | true | false | 2 | false | no | 5 items, 3 required unmet | end_turn | 7338 | 1541 | 22.8 |
| 31 | 4-set41 | 26-ail-dmai__wk5-pov-statement-confident | n/a | 1 | 1.4 | true | true | false | 2 | false | no | 6 items, 4 required unmet | end_turn | 7269 | 2075 | 27.9 |
| 32 | 4-set41 | 27-ail-dmai__dmai-wk1-ceo-audit-confident | n/a | 2 | 1.5 | true | true | false | 2 | false | no | 5 items, 3 required unmet | end_turn | 7645 | 1466 | 21.6 |
| 33 | 4-set41 | 28-ail-dmai__dmai-wk4-digital-deep-dive-confident | n/a | 1 | 1 | false | false | false | 1 | false | no | 8 items, 7 required unmet | end_turn | 7529 | 1567 | 21.6 |
| 34 | 4-set41 | 29-ail-dmai__dmai-wk5-personas-confident | n/a | 1 | 1.4 | true | true | false | 1 | false | no | 11 items, 9 required unmet | end_turn | 7591 | 1716 | 24.0 |
| 35 | 4-set41 | 30-ail-dmai__dmai-wk6-email-campaigns-confident | n/a | 1 | 1 | false | false | false | 1 | false | no | 9 items, 8 required unmet | end_turn | 7685 | 1807 | 23.7 |
| 36 | 4-set41 | 31-ail-dmai__dmai-wk7-content-plan | n/a | 2 | 1.5 | true | true | false | 2 | false | no | 3 items, 2 required unmet | end_turn | 7341 | 1706 | 24.9 |
| 37 | 4-set41 | 32-ail-dmai__dmai-wk9-more-reach | n/a | 2 | 1.6 | true | true | false | 2 | false | no | 8 items, 3 required unmet | end_turn | 7404 | 1586 | 20.9 |
| 38 | 4-set41 | 33-boundary-0v1-3v4__wk2-swot-ai-industry-ambiguous | n/a | 1 | 0.6 | true | true | false | 1 | false | no | 5 items, 2 required unmet | end_turn | 7335 | 1571 | 21.6 |
| 39 | 4-set41 | 34-boundary-0v1-3v4__dmai-wk1-ceo-audit-ambiguous | n/a | 1 | 0.5 | true | true | false | 1 | false | no | 3 items, 2 required unmet | end_turn | 7639 | 1417 | 19.4 |
| 40 | 4-set41 | 35-boundary-0v1-3v4__di-wk1-notion-page-ambiguous | n/a | 1 | 1.5 | true | true | true | 1 | false | no | 5 items, 2 required unmet | end_turn | 7466 | 1691 | 25.2 |
| 41 | 4-set41 | 36-boundary-0v1-3v4__wk3-risk-appetite-ambiguous | n/a | 3 | 3 | false | false | false | 4 | false | no | 6 items, 0 required unmet | end_turn | 7426 | 1828 | 25.0 |
| 42 | 4-set41 | 37-boundary-0v1-3v4__dmai-wk5-personas-ambiguous | n/a | 3 | 3.4 | true | true | false | 4 | false | no | 4 items, 0 required unmet | end_turn | 7644 | 2713 | 36.2 |
| 43 | 4-set41 | 38-boundary-0v1-3v4__di-wk5-marketing-email-ambiguous | n/a | 4 | 3.5 | true | true | false | 4 | false | no | 11 items, 0 required unmet | end_turn | 8038 | 2018 | 26.7 |
| 44 | 4-set41 | 39-boundary-2v3__wk1-evaluate-llm-output-2v3 | n/a | 2 | 2.5 | true | true | true | 2 | false | no | 4 items, 1 required unmet | end_turn | 7633 | 1981 | 27.4 |
| 45 | 4-set41 | 40-boundary-2v3__dmai-wk4-digital-deep-dive-2v3 | n/a | 3 | 3 | false | false | false | 4 | false | no | 8 items, 0 required unmet | end_turn | 7865 | 2648 | 33.4 |
| 46 | 4-set41 | 41-boundary-2v3__di-wk3-ai-research-presentation-2v3 | n/a | 3 | 2.5 | true | true | false | 4 | false | no | 6 items, 0 required unmet | end_turn | 7936 | 2293 | 32.1 |
| 47 | 2-control | C1-AIL-wk1-own-piece-present-meets | 3 | 3 | 3 | false | false | false | 4 | false | no | 5 items, 0 required unmet | end_turn | 7769 | 1916 | 25.0 |
| 48 | 2-control | C2-AIL-wk1-own-piece-present-stretch | 4 | 4 | 4 | false | false | false | 4 | false | no | 4 items, 0 required unmet | end_turn | 7739 | 1648 | 21.8 |
| 49 | 2-control | C3-DMAI-wk5-two-full-personas | 3 | 3 | 3 | false | false | false | 3 | false | no | 11 items, 0 required unmet | end_turn | 8038 | 1766 | 22.0 |
| 50 | 2-control | C4-DMAI-wk9-five-full-posts | 3 | 4 | 3.5 | true | true | false | 4 | false | no | 8 items, 0 required unmet | end_turn | 8017 | 2142 | 27.8 |
| 51 | 2-control | N1-AIL-wk1-own-piece-very-short | 3 | 3 | 3 | false | false | false | 4 | false | no | 5 items, 0 required unmet | end_turn | 7571 | 1837 | 24.3 |
| 52 | 2-control | N2-AIL-wk1-own-piece-labelled-Draft-1 | 3 | 3 | 3.4 | true | true | false | 4 | false | no | 4 items, 0 required unmet | end_turn | 7734 | 2624 | 33.3 |
| 53 | 2-control | N3-AIL-wk1-own-piece-embedded-mid-submission | 3 | 3 | 3 | false | false | false | 4 | false | no | 4 items, 0 required unmet | end_turn | 7672 | 1959 | 25.6 |

## Comparison with earlier reports

Sources: `fix-verification-results-final.md` (the "After" column, 40 of the 41 set cases; `dmai-wk9-more-reach` has no row in that file) and `ceiling-cap-verification-v2.md` (Test 6 runs 1 to 5, the 7 controls, TESTING.md Tests 1 to 5, and WK1, WK3 and WK4 Band3). A case in both reports is compared with both. "Borderline" is the `borderline` field; "boundaryCase" is the model's own flag. The Test 4 mark in v2 is the internal mark (1); the final report records 0 with the mismatch flag.

### Whole-number marks that differ

| Case | Earlier report | Earlier mark | This run |
|---|---|---|---|
| Test6-run1 | ceiling-cap-verification-v2 | 2 | 4 |
| Test6-run4 | ceiling-cap-verification-v2 | 2 | 4 |
| 04-testing-md__Test4-mismatch | ceiling-cap-verification-v2 | 1 | 0 |
| 13-di__WK3-Band3 | ceiling-cap-verification-v2 | 4 | 3 |
| 27-ail-dmai__dmai-wk1-ceo-audit-confident | fix-verification-results-final | 1 | 2 |
| 34-boundary-0v1-3v4__dmai-wk1-ceo-audit-ambiguous | fix-verification-results-final | 0 | 1 |
| 37-boundary-0v1-3v4__dmai-wk5-personas-ambiguous | fix-verification-results-final | 4 | 3 |

### Capped flag that differs (v2 only; final.md has no capped column)

| Case | Earlier report | Earlier | This run |
|---|---|---|---|
| Test6-run1 | ceiling-cap-verification-v2 | true | false |
| Test6-run4 | ceiling-cap-verification-v2 | true | false |

### borderline flag that flipped

| Case | Earlier report | Earlier | This run |
|---|---|---|---|
| Test6-run1 | ceiling-cap-verification-v2 | true | false |
| 02-testing-md__Test2-meets | ceiling-cap-verification-v2 | true | false |
| 04-testing-md__Test4-mismatch | ceiling-cap-verification-v2 | true | false |
| 08-di__WK1-Band2 | fix-verification-results-final | false | true |
| 12-di__WK3-Band2 | fix-verification-results-final | true | false |
| 21-di__WK5-Band3 | fix-verification-results-final | false | true |
| 24-ail-dmai__wk2-swot-ai-industry-confident | fix-verification-results-final | false | true |
| 27-ail-dmai__dmai-wk1-ceo-audit-confident | fix-verification-results-final | false | true |
| 29-ail-dmai__dmai-wk5-personas-confident | fix-verification-results-final | false | true |
| C4-DMAI-wk9-five-full-posts | ceiling-cap-verification-v2 | false | true |
| N2-AIL-wk1-own-piece-labelled-Draft-1 | ceiling-cap-verification-v2 | false | true |

### boundaryCase flag that flipped

| Case | Earlier report | Earlier | This run |
|---|---|---|---|
| Test6-run1 | ceiling-cap-verification-v2 | true | false |
| 04-testing-md__Test4-mismatch | ceiling-cap-verification-v2 | true | false |
| 12-di__WK3-Band2 | fix-verification-results-final | true | false |
| 21-di__WK5-Band3 | fix-verification-results-final | false | true |
| 24-ail-dmai__wk2-swot-ai-industry-confident | fix-verification-results-final | false | true |
| 27-ail-dmai__dmai-wk1-ceo-audit-confident | fix-verification-results-final | false | true |
| 29-ail-dmai__dmai-wk5-personas-confident | fix-verification-results-final | false | true |
| C4-DMAI-wk9-five-full-posts | ceiling-cap-verification-v2 | false | true |
| N2-AIL-wk1-own-piece-labelled-Draft-1 | ceiling-cap-verification-v2 | false | true |

Cases with no row in either report: 32-ail-dmai__dmai-wk9-more-reach.

## Summary counts

| Measure | Result |
|---|---|
| Cases at the intended band (mark equals the designed value), excluding Test 6 | 25 of 28 with a designed value |
| Cases not at the designed value | 07-di__WK1-Band1 (designed 1, mark 2); 15-di__WK4-Band1 (designed 1, mark 2); C4-DMAI-wk9-five-full-posts (designed 3, mark 4) |
| Test 6 at mark 2 | 3 of 5 (marks 4, 2, 2, 4, 2) |
| Test 6 capped | 3 of 5 |
| Capped outside Test 6 (false caps counted as any cap outside Test 6) | 2: 35-boundary-0v1-3v4__di-wk1-notion-page-ambiguous (mark 1, 2 required unmet); 39-boundary-2v3__wk1-evaluate-llm-output-2v3 (mark 2, 1 required unmet) |
| Capped among the 7 controls | 0 of 7 |
| borderline flag true | 31 of 53 (58%) |
| boundaryCase true | 30 of 53 |
| Empty bandReasoning | 1: 08-di__WK1-Band2 |
| Parse failures (502) | 0 |
| Other HTTP errors | 0 |
| topicMismatch true | 1: 04-testing-md__Test4-mismatch (mark 0) |
| stop_reason | end_turn on 53 of 53 |
| Highest output tokens in one call | 5761 (max_tokens is 6000) |

## Test 6, five runs

| Run | Mark | rawScore | capped | ceilingBand | boundaryCase | Required items unmet |
|---|---|---|---|---|---|---|
| Test6-run1 | 4 | 4 | false | 4 | false | none (4 items listed) |
| Test6-run2 | 2 | 3.5 | true | 4 | true | Learner's own written version (~100 words, no AI) shown as a produced sample to compare against (4 items listed) |
| Test6-run3 | 2 | 3.6 | true | 4 | true | Learner's own ~100 word writing on the same subject, produced without AI (4 items listed) |
| Test6-run4 | 4 | 3.6 | false | 4 | true | none (4 items listed) |
| Test6-run5 | 2 | 2.5 | true | 2 | true | Learner's own ~100 word written version of the scenario, produced without AI (5 items listed) |

## Provenance

| Group | File(s) | Status | Notes |
|---|---|---|---|
| Test 6 (x5) | testing/cases/test6.txt | Committed in origin/main | index.json: same text as the Test 6 blockquote in TESTING.md |
| Set of 41: testing-md | 5 files, set41/01-testing-md__Test1-strong.txt to set41/05-testing-md__Test5-borderline.txt | Committed in origin/main | index.json provenance values: CN: TESTING.md; CE: TESTING.md |
| Set of 41: di | 17 files, set41/06-di__spot-check-dmai-wk1-ceo-audit.txt to set41/22-di__WK5-Band4.txt | Committed in origin/main | index.json provenance values: R: none |
| Set of 41: ail-dmai | 10 files, set41/23-ail-dmai__wk1-evaluate-llm-output.txt to set41/32-ail-dmai__dmai-wk9-more-reach.txt | Committed in origin/main | index.json provenance values: CE: testing/boundary-test-submissions-ail-dmai.md |
| Set of 41: boundary-0v1-3v4 | 6 files, set41/33-boundary-0v1-3v4__wk2-swot-ai-industry-ambiguous.txt to set41/38-boundary-0v1-3v4__di-wk5-marketing-email-ambiguous.txt | Committed in origin/main | index.json provenance values: CE: testing/boundary-test-0v1-3v4.md |
| Set of 41: boundary-2v3 | 3 files, set41/39-boundary-2v3__wk1-evaluate-llm-output-2v3.txt to set41/41-boundary-2v3__di-wk3-ai-research-presentation-2v3.txt | Committed in origin/main | index.json provenance values: R: none |
| Controls C1 to C4 | testing/cases/controls/C1-...txt to C4-...txt | Committed in origin/main | index.json: New in this run; not in any committed file |
| Controls N1 to N3 | testing/cases/controls/N1.txt, N2.txt, N3.txt | Recovered from the earlier session record (original wording), hash-verified; new files in this PR | SHA-256 matches the hashes recorded when they were recovered |
| Runner | testing/run-baseline.mjs | Recovered v2, adapted | Based on testing/legacy-runners/run-ceiling-v2.mjs, which was recovered from a session record and not verified against a file on disk |

`testing/cases/index.json` gained three entries for N1 to N3 (additions only). The runner reads texts from the index, and a dry run before any call confirmed 53 jobs, every text loaded and every SHA-256 equal to its index entry.

## Tokens and cost

| Measure | Value |
|---|---|
| Calls | 53 |
| Input tokens | 405,983 |
| Output tokens (including hidden thinking) | 112,861 |
| Cost | **$4.85** at $5 per million input and $25 per million output tokens |
| Average per call | 7660 in, 2129 out, $0.092 |
| Total call time | 25.6 minutes (longest 78.7 s) |

The rates are the ones used in `ceiling-cap-verification-v2.md` for this model. I did not look up current published prices.

Token counts and stop reasons were read from the dev server's own usage lines after the run, matched to the calls by order, rubric id and time window (53 of 53 matched, 0 mismatches), and saved as `testing/baseline-raw/epa-baseline-usage.jsonl`. The runner was meant to read them live and recorded null for every call (a fault in the runner's log reading that I did not investigate), so the raw results file has null in those three fields.

## What differs from the v2 runner

- **Job list:** 53 jobs: Test 6 run five times, the 41 cases in `testing/cases/set41/` (the v2 runner ran only a 20-job quick set), and the 7 controls. v2 had 20 jobs.
- **Where texts come from:** the saved files in this checkout via `testing/cases/index.json` (set of 41 including Tests 1 to 5, `test6.txt`, and `controls/` including N1 to N3). v2 read TESTING.md for Tests 1 to 6 and took N1 to N3 from the source of an earlier script.
- **Stop rules:** stop at once on HTTP 400, 401, 402, 403 or 429; a 502 is recorded and the run continues, stopping after 3; any other failure stops the run. No retries. v2 stopped on the first error of any kind.
- **Extra fields recorded:** designed value, word count, HTTP status, `stop_reason` and token counts (read from the server log), whether bandReasoning was empty, and the presenceEvidence items (criterion, level, met). The request body is the same as v2's: `{ rubricId, anonymisedSubmission }` to `/api/mark`.
- **Run control:** `LIMIT` and `SKIP` environment variables (to make the one first call), and a dry-run mode that prints each text's id, word count and SHA-256 with no API calls.
- **Output:** each result is appended to disk as soon as it completes, as in v2.

## presenceEvidence items (all 53 calls)

**1. Test6-run1** (mark 4, capped false, ceilingBand 4)
- [required] met: A prompt given to an LLM on a work scenario
- [required] met: An evaluation comparing the learner's own writing/style and the LLM's output
- [required] met: Comment on tone/engagement/whether it reads as human or AI-written
- [stretch] met: Concrete next steps to improve the AI output, or examples of improvements already made (stretch)

**2. Test6-run2** (mark 2, capped true, ceilingBand 4)
- [required] met: Evaluation comparing the learner's own writing and the LLM's output
- [required] met: LLM output on the chosen work subject reported/described
- [required] **UNMET**: Learner's own written version (~100 words, no AI) shown as a produced sample to compare against
- [stretch] met: Concrete next steps to improve the AI output, or examples of improvements already made (stretch)

**3. Test6-run3** (mark 2, capped true, ceilingBand 4)
- [required] met: Evaluation comparing the learner's own writing and the LLM's output
- [required] met: LLM output on the chosen work subject (with the prompt used)
- [required] **UNMET**: Learner's own ~100 word writing on the same subject, produced without AI
- [stretch] met: Concrete next steps to improve the AI output, or examples of improvement already made

**4. Test6-run4** (mark 4, capped false, ceilingBand 4)
- [required] met: A 50-100 word evaluation comparing the learner's own writing and the LLM's output
- [required] met: Reference to/inclusion of the learner's own writing as one side of the comparison
- [required] met: Reference to the LLM's output as the other side of the comparison
- [stretch] met: Concrete next steps to improve the AI output, or examples of how it has already been improved (stretch)

**5. Test6-run5** (mark 2, capped true, ceilingBand 2)
- [required] **UNMET**: Learner's own ~100 word written version of the scenario, produced without AI
- [required] met: A prompt given to the LLM
- [required] met: The LLM's output on the same subject
- [required] met: An evaluation comparing the learner's own writing and the LLM's output
- [stretch] met: Concrete next steps to improve the AI output, or examples of improvement already made

**6. 01-testing-md__Test1-strong** (mark 4, capped false, ceilingBand 4)
- [required] met: Evaluation comparing own writing and the LLM's output
- [stretch] met: Concrete next steps to improve the AI output, or examples of how already improved

**7. 02-testing-md__Test2-meets** (mark 3, capped false, ceilingBand 4)
- [required] met: A 50-100 word evaluation comparing the learner's own writing and the LLM's output
- [required] met: Comparison touching on readability and engagement
- [required] met: Judgement on whether either reads as human- or AI-written
- [stretch] **UNMET**: Concrete next steps to improve the AI output, or examples of how it was already improved

**8. 03-testing-md__Test3-thin** (mark 1, capped false, ceilingBand 2)
- [required] **UNMET**: A 50-100 word evaluation comparing the learner's own writing and the LLM's output
- [stretch] **UNMET**: Concrete next steps to improve the AI output, or examples of improvements already made

**9. 04-testing-md__Test4-mismatch** (mark 0, capped false, ceilingBand 0)
- [required] **UNMET**: Learner's own ~100 word piece written without AI on a work scenario
- [required] **UNMET**: An LLM-produced piece on the same subject
- [required] **UNMET**: A 50-100 word evaluation comparing the learner's own writing and the LLM output (readability, engagement, human- vs AI-feel)
- [stretch] **UNMET**: Concrete next steps to improve the AI output, or examples of improvements already made

**10. 05-testing-md__Test5-borderline** (mark 3, capped false, ceilingBand 3)
- [required] met: A 50-100 word evaluation comparing the learner's own writing and the LLM's output
- [stretch] **UNMET**: Concrete next steps to improve the AI output, or examples of how it has already been improved

**11. 06-di__spot-check-dmai-wk1-ceo-audit** (mark 3, capped false, ceilingBand 4)
- [required] met: Company vision stated
- [required] met: Company mission stated
- [required] met: Company values stated
- [required] met: 7Ps applied to the business
- [required] met: Gaps/future suggestions noted where Ps are weak
- [stretch] **UNMET**: Outbound/inbound tactics organised into paid/owned/earned media types

**12. 07-di__WK1-Band1** (mark 2, capped false, ceilingBand 2)
- [required] **UNMET**: Page published with a link (URL) provided
- [required] **UNMET**: Variety of at least 3 content blocks
- [required] **UNMET**: Self-reflection (written or recorded)
- [required] met: Page on a chosen topic, structured and presented
- [stretch] **UNMET**: Advanced content blocks (database, columns, embedding)

**13. 08-di__WK1-Band2** (mark 2, capped false, ceilingBand 2)
- [required] met: Page published with a working link provided
- [required] met: Page on a chosen topic, structured and titled
- [required] **UNMET**: Uses a variety of at least 3 content blocks
- [required] **UNMET**: Self-reflection submitted (written or recorded)
- [stretch] **UNMET**: More advanced content blocks (database, columns, embedding)

**14. 09-di__WK1-Band3** (mark 3, capped false, ceilingBand 4)
- [required] met: Page published with a link provided
- [required] met: Page on a chosen topic/theme
- [required] met: Variety of at least 3 content blocks
- [required] met: Self-reflection (written or recorded)
- [stretch] **UNMET**: More advanced content blocks (database, columns, embedding) that fit the page

**15. 10-di__WK1-Band4** (mark 4, capped false, ceilingBand 4)
- [required] met: Page on a chosen topic, structured and presented clearly
- [required] met: Variety of at least 3 content blocks
- [required] met: Published with a link provided
- [required] met: Self-reflection (written or recorded)
- [stretch] met: Advanced content blocks (database, columns, embedding) fitting the page

**16. 11-di__WK3-Band1** (mark 1, capped false, ceilingBand 1)
- [required] met: At least two research areas present
- [required] **UNMET**: Shared correctly via public link or published page
- [required] **UNMET**: Content is learner's own evaluation rather than pasted output
- [required] **UNMET**: Resources attributed with links
- [required] **UNMET**: Presentation within length limit (max 10 slides / 2 pages)

**17. 12-di__WK3-Band2** (mark 2, capped false, ceilingBand 2)
- [required] met: At least two research areas covered
- [required] met: Shared correctly via public/published link
- [required] met: Content is the learner's own evaluation and understanding
- [required] **UNMET**: Resources attributed with links
- [required] met: Attention to presentation and layout (headings, visuals, within length limit)
- [stretch] **UNMET**: Stretch: deeper explanation, extra research, comparison, ethics, or creative presentation

**18. 13-di__WK3-Band3** (mark 3, capped false, ceilingBand 4)
- [required] met: At least two research areas covered with detail
- [required] met: Shared correctly (published page or public link)
- [required] met: Content is the learner's own evaluation rather than pasted AI output
- [required] met: Resources attributed with links
- [required] met: Attention to presentation and layout (headings, visuals, length limit)
- [stretch] met: Original diagram/infographic or other creative element
- [stretch] **UNMET**: Critical thinking about benefits/risks/implications, ethical challenges, or LLM comparison

**19. 14-di__WK3-Band4** (mark 4, capped false, ceilingBand 4)
- [required] met: At least two research areas covered in depth
- [required] met: Shared correctly as a published page or public link
- [required] met: Content is the learner's own evaluation rather than pasted AI output
- [required] met: Resources attributed with links
- [required] met: Presentation and layout with headings, visuals, within length limit
- [stretch] met: Comparison of specific LLMs (case study/comparison)
- [stretch] met: Discussion of how AI might affect the learner's own field
- [stretch] met: Ethical challenges / risks explored (bias, misinformation)

**20. 15-di__WK4-Band1** (mark 2, capped false, ceilingBand 2)
- [required] met: Created and used a Gemini Gem
- [required] met: Created and used a NotebookLM notebook
- [required] **UNMET**: Evaluation comparing performance between the two
- [required] **UNMET**: Link to the evaluation / shared artefact
- [required] **UNMET**: Self-reflection (written or recorded)
- [required] **UNMET**: Stated real goal for using both tools

**21. 16-di__WK4-Band2** (mark 2, capped false, ceilingBand 2)
- [required] met: Created and used a Gemini Gem
- [required] met: Created and used a NotebookLM notebook
- [required] **UNMET**: Evaluated the performance between the two tools
- [required] met: Provided a link to the evaluation
- [required] **UNMET**: Provided a self-reflection (written or recorded)

**22. 17-di__WK4-Band3** (mark 3, capped false, ceilingBand 4)
- [required] met: Created and used a Gemini Gem
- [required] met: Created and used a NotebookLM notebook
- [required] met: Evaluation comparing the performance of the two tools
- [required] met: Link to the evaluation provided
- [required] met: Self-reflection (written or recorded)
- [required] met: Within the 500-word limit
- [stretch] **UNMET**: More than one Gem and Notebook, or future use cases, or audience/presentation design

**23. 18-di__WK4-Band4** (mark 4, capped false, ceilingBand 4)
- [required] met: Created and used a Gemini Gem
- [required] met: Created and used a NotebookLM notebook
- [required] met: Evaluation comparing the two tools' performance
- [required] met: Link to the evaluation provided
- [required] met: Self-reflection included
- [stretch] met: More than one Gem and Notebook with further evaluation
- [stretch] met: Future personal/workplace use cases explained
- [stretch] met: Consideration of audience/presentation

**24. 19-di__WK5-Band1** (mark 1, capped false, ceilingBand 1)
- [required] met: Clear purpose for the email
- [required] **UNMET**: Custom subject line with full name, course, assignment title and custom subject matter
- [required] **UNMET**: At least two design principles visibly applied
- [required] **UNMET**: At least two persuasive techniques
- [required] **UNMET**: Logical structure and layout
- [required] **UNMET**: Branding/consistency
- [required] **UNMET**: Professional polish with appropriate links/buttons
- [required] **UNMET**: Screenshots plus explanation included

**25. 20-di__WK5-Band2** (mark 2, capped false, ceilingBand 2)
- [required] met: Clear purpose for the email
- [required] **UNMET**: Subject line with full name, course, assignment title and custom subject matter
- [required] **UNMET**: At least two design principles applied
- [required] **UNMET**: At least two persuasive techniques
- [required] met: Logical structure and layout
- [required] **UNMET**: Branding/consistency (colours, fonts, tone)
- [required] **UNMET**: Professional polish (proofread, visuals, links/buttons)
- [required] met: Screenshots included
- [required] met: Explanation included
- [stretch] **UNMET**: Self-reflection with insight

**26. 21-di__WK5-Band3** (mark 3, capped false, ceilingBand 4)
- [required] met: Clear purpose for the email
- [required] met: Subject line with full name, course, assignment title and custom subject matter
- [required] met: At least two design principles applied and explained
- [required] met: At least two persuasive communication techniques
- [required] met: Logical structure and layout
- [required] met: Branding/consistency
- [required] met: Professional polish with appropriate links/buttons
- [required] met: Screenshots plus an explanation
- [required] met: Self-reflection
- [stretch] **UNMET**: Stretch: deeper self-reflection, data-driven justification, or exceptional creativity

**27. 22-di__WK5-Band4** (mark 4, capped false, ceilingBand 4)
- [required] met: Clear purpose for the email
- [required] met: Custom subject line with full name, course, assignment title, and custom subject matter
- [required] met: At least two design principles applied and explained
- [required] met: At least two persuasive techniques
- [required] met: Logical structure and layout
- [required] met: Branding/consistency
- [required] met: Professional polish with appropriate links/buttons
- [required] met: Screenshots plus an explanation
- [required] met: Self-reflection included
- [stretch] met: Original/cleverly integrated imagery or creativity
- [stretch] met: Research-based justification for design decisions
- [stretch] met: Deeper self-reflection with insight/critical evaluation

**28. 23-ail-dmai__wk1-evaluate-llm-output** (mark 2, capped false, ceilingBand 2)
- [required] **UNMET**: A 50-100 word evaluation comparing the learner's own writing and the LLM's output

**29. 24-ail-dmai__wk2-swot-ai-industry-confident** (mark 1, capped false, ceilingBand 1)
- [required] met: SWOT structure (Strengths, Weaknesses, Opportunities, Threats)
- [required] **UNMET**: Uses relevant legal/ethical issues (IP law, privacy law, defamation, product liability, contract law, labour law, AI regulation)
- [required] **UNMET**: Explains what each issue means rather than just listing it
- [stretch] **UNMET**: Refers to all key issue areas and explains any omitted
- [stretch] **UNMET**: Reflects on how the task develops understanding of the business or AI

**30. 25-ail-dmai__wk3-risk-appetite-confident** (mark 1, capped false, ceilingBand 2)
- [required] met: Defines the business's risk appetite
- [required] **UNMET**: Identifies three AI application areas
- [required] **UNMET**: Benefits, risks (legal, ethical, reputational, financial, operational) and alignment for each area
- [required] **UNMET**: ~300 word reflection on LLM usefulness (if an LLM was used)
- [stretch] **UNMET**: Comparison with a different type of business, regulation/reputation/culture discussion and a suggested governance measure

**31. 26-ail-dmai__wk5-pov-statement-confident** (mark 1, capped false, ceilingBand 2)
- [required] **UNMET**: The prompts used with the LLM
- [required] **UNMET**: What the AI surfaced that the learner had forgotten (comparison with manually generated problems)
- [required] **UNMET**: The highest priority problems, prioritised by customer value
- [required] met: The Point of View statement(s)
- [required] **UNMET**: An assessment of the AI output
- [stretch] **UNMET**: Uses the LLM to refine the POV statements by tweaking prompts

**32. 27-ail-dmai__dmai-wk1-ceo-audit-confident** (mark 2, capped false, ceilingBand 2)
- [required] met: States the company's mission
- [required] **UNMET**: States the company's vision
- [required] **UNMET**: States the company's values
- [required] **UNMET**: Applies the 7Ps of Marketing to the business (noting gaps/future suggestions)
- [stretch] **UNMET**: Examples of outbound/inbound tactics organised into paid/owned/earned media

**33. 28-ail-dmai__dmai-wk4-digital-deep-dive-confident** (mark 1, capped false, ceilingBand 1)
- [required] **UNMET**: Objectives for the chosen channel
- [required] **UNMET**: Content Strategy
- [required] **UNMET**: Channel Strategy
- [required] **UNMET**: Media Strategy
- [required] **UNMET**: Tactics
- [required] **UNMET**: Place within the sales funnel
- [required] **UNMET**: Deep dive on at least one of Website, Email, or Social Media
- [stretch] **UNMET**: One recommendation for an additional, valid channel strategy

**34. 29-ail-dmai__dmai-wk5-personas-confident** (mark 1, capped false, ceilingBand 1)
- [required] **UNMET**: Persona name
- [required] **UNMET**: Location
- [required] **UNMET**: Profession or industry
- [required] **UNMET**: Income or turnover
- [required] **UNMET**: Point of need/challenge
- [required] **UNMET**: Buying behaviour and frequency
- [required] **UNMET**: Communication style
- [required] met: Preferred channel(s)
- [required] **UNMET**: Tone of voice
- [required] **UNMET**: 2-3 personas present
- [stretch] **UNMET**: 3 personas plus sales funnel touchpoints/opportunities

**35. 30-ail-dmai__dmai-wk6-email-campaigns-confident** (mark 1, capped false, ceilingBand 1)
- [required] **UNMET**: Defined audience with a clear persona for a 3-stage funnel
- [required] **UNMET**: Three separate emails forming a full sales-funnel approach
- [required] **UNMET**: A clear call to action in each funnel email
- [required] **UNMET**: SMYKM subject line (alternative route)
- [required] **UNMET**: Non-salesy first sentence (SMYKM route)
- [required] **UNMET**: Clear transition, challenge, value proposition and objection handling (SMYKM route)
- [required] **UNMET**: Concise close plus a follow-up email (SMYKM route)
- [required] **UNMET**: Reflection evaluating the AI output and its usefulness to the business
- [stretch] **UNMET**: Both a funnel campaign AND a SMYKM email with follow-up

**36. 31-ail-dmai__dmai-wk7-content-plan** (mark 2, capped false, ceilingBand 2)
- [required] **UNMET**: A content plan containing at least three pieces of content
- [required] **UNMET**: Each area of the content plan template used and explained for the content
- [stretch] **UNMET**: Content covers each stage of the sales funnel

**37. 32-ail-dmai__dmai-wk9-more-reach** (mark 2, capped false, ceilingBand 2)
- [required] **UNMET**: At least 5 social posts in a series
- [required] met: Channel specified for each post
- [required] met: Post Type specified for each post
- [required] met: Date specified for each post
- [required] met: Caption for each post
- [required] **UNMET**: Image Assets & Descriptions for each post
- [required] **UNMET**: Relevant Hashtags for each post
- [stretch] **UNMET**: Links the series to a content cluster, event, or brand-based persona

**38. 33-boundary-0v1-3v4__wk2-swot-ai-industry-ambiguous** (mark 1, capped false, ceilingBand 1)
- [required] **UNMET**: Relevant legal/ethical issues (IP, privacy, defamation, product liability, contract, labour law, AI regulation) used in the analysis
- [required] **UNMET**: Explanation of what each issue means rather than just listing it
- [required] met: SWOT structure with the four headings
- [stretch] **UNMET**: Refers to all key issue areas, explaining why any omitted are not relevant
- [stretch] **UNMET**: Reflection on how the task develops understanding of the business or of AI

**39. 34-boundary-0v1-3v4__dmai-wk1-ceo-audit-ambiguous** (mark 1, capped false, ceilingBand 1)
- [required] **UNMET**: Vision, Mission and Values detailed for the business
- [required] **UNMET**: 7Ps of Marketing applied to the business
- [stretch] **UNMET**: Outbound/inbound tactics organised into paid/owned/earned media

**40. 35-boundary-0v1-3v4__di-wk1-notion-page-ambiguous** (mark 1, capped true, ceilingBand 1)
- [required] met: A page created on a chosen topic/theme
- [required] **UNMET**: Page uses a variety of at least 3 content blocks
- [required] met: Page is published with a working link provided
- [required] **UNMET**: A self-reflection (written or recorded) is included
- [stretch] **UNMET**: More advanced content blocks (database, columns, embedding) that fit the page

**41. 36-boundary-0v1-3v4__wk3-risk-appetite-ambiguous** (mark 3, capped false, ceilingBand 4)
- [required] met: Defines the business's risk appetite
- [required] met: Identifies three AI application areas with benefits, risks and alignment for each
- [required] met: ~300 word reflection on how useful or limited the LLM was (if an LLM was used)
- [stretch] met: Compares the organisation's risk appetite with a different type of business
- [stretch] **UNMET**: Discusses how regulation/reputation/culture differences affect AI adoption
- [stretch] **UNMET**: Suggests a governance measure to expand AI use within risk appetite

**42. 37-boundary-0v1-3v4__dmai-wk5-personas-ambiguous** (mark 3, capped false, ceilingBand 4)
- [required] met: 2-3 customer personas created
- [required] met: Each persona includes all nine required elements (name, location, profession/industry, income/turnover, point of need, buying behaviour & frequency, communication style, preferred channels, tone of voice)
- [stretch] met: Three full personas (stretch count)
- [stretch] **UNMET**: Number of touchpoints and relevant sales-funnel opportunities defined for a generalised sale (working hypothesis acceptable)

**43. 38-boundary-0v1-3v4__di-wk5-marketing-email-ambiguous** (mark 4, capped false, ceilingBand 4)
- [required] met: Clear purpose for the email
- [required] met: Custom subject line with full name, course, assignment title and custom subject matter
- [required] met: At least two design principles applied and explained
- [required] met: At least two persuasive techniques used
- [required] met: Logical structure and layout
- [required] met: Branding/consistency
- [required] met: Professional polish
- [required] met: Screenshots plus explanation
- [required] met: Self-reflection included
- [stretch] met: Stretch: original/custom imagery or graphics
- [stretch] **UNMET**: Stretch: deeper self-reflection with insight and critical evaluation

**44. 39-boundary-2v3__wk1-evaluate-llm-output-2v3** (mark 2, capped true, ceilingBand 2)
- [required] met: Learner's own ~100 word writing sample on a work scenario, written without AI
- [required] met: LLM output produced on the same subject
- [required] **UNMET**: A 50-100 word evaluation comparing the learner's own writing and the LLM output
- [stretch] **UNMET**: Concrete next steps to improve the AI output, or examples of improvements already made

**45. 40-boundary-2v3__dmai-wk4-digital-deep-dive-2v3** (mark 3, capped false, ceilingBand 4)
- [required] met: Objectives stated
- [required] met: Content Strategy
- [required] met: Channel Strategy
- [required] met: Media Strategy
- [required] met: Tactics
- [required] met: Place within the sales funnel
- [required] met: Deep dive of at least one of Website, Email, or Social Media
- [stretch] **UNMET**: Recommendation for an additional, valid channel strategy

**46. 41-boundary-2v3__di-wk3-ai-research-presentation-2v3** (mark 3, capped false, ceilingBand 4)
- [required] met: At least two research areas covered
- [required] met: Shared correctly via published page or public link
- [required] met: Content is learner's own evaluation, not pasted AI output
- [required] met: Resources attributed with links
- [required] met: Attention to presentation and layout (headings, logical flow, length limit)
- [stretch] **UNMET**: Deeper explanation / critical thinking / creativity beyond the basics

**47. C1-AIL-wk1-own-piece-present-meets** (mark 3, capped false, ceilingBand 4)
- [required] met: Learner's own ~100 word writing on a real work scenario
- [required] met: Prompt given to the LLM
- [required] met: LLM's output on the same subject
- [required] met: A 50-100 word evaluation comparing own writing and LLM output (readability, engagement, human vs AI)
- [stretch] **UNMET**: Concrete next steps to improve the AI output, or examples of how the learner has already improved it

**48. C2-AIL-wk1-own-piece-present-stretch** (mark 4, capped false, ceilingBand 4)
- [required] met: Learner's own ~50-100 word writing on a real work scenario without AI
- [required] met: LLM output on the same subject
- [required] met: A short (50-100 word) evaluation comparing the learner's own writing and the LLM's output
- [stretch] met: Concrete next steps to improve the AI output, or examples of how it has already been improved

**49. C3-DMAI-wk5-two-full-personas** (mark 3, capped false, ceilingBand 3)
- [required] met: At least 2 personas with a persona name
- [required] met: Location for each persona
- [required] met: Profession or industry
- [required] met: Income or turnover
- [required] met: Point of need/challenge
- [required] met: Buying behaviour and frequency
- [required] met: Communication style
- [required] met: Preferred channel(s)
- [required] met: Tone of voice
- [stretch] **UNMET**: A third full persona
- [stretch] **UNMET**: Number of touchpoints and sales funnel opportunities for a generalised sale

**50. C4-DMAI-wk9-five-full-posts** (mark 4, capped false, ceilingBand 4)
- [required] met: At least 5 social posts
- [required] met: Channel specified for each post
- [required] met: Post Type specified for each post
- [required] met: Date specified for each post
- [required] met: Caption specified for each post
- [required] met: Image Assets & Descriptions for each post
- [required] met: Relevant Hashtags for each post
- [stretch] met: Demonstrates how the series links to a content cluster, event, or brand-based persona

**51. N1-AIL-wk1-own-piece-very-short** (mark 3, capped false, ceilingBand 4)
- [required] met: Own ~100 word writing on a real work scenario without AI
- [required] met: A prompt given to an LLM on the same subject
- [required] met: The LLM's output
- [required] met: A 50-100 word evaluation comparing the two versions (readability, engagement, human/AI feel)
- [stretch] **UNMET**: Concrete next steps to improve the AI output, or examples of improvement already made

**52. N2-AIL-wk1-own-piece-labelled-Draft-1** (mark 3, capped false, ceilingBand 4)
- [required] met: Own writing produced without AI on a real work scenario
- [required] met: LLM output on the same subject
- [required] met: A 50-100 word evaluation comparing the learner's own writing and the LLM's output
- [stretch] **UNMET**: Concrete next steps to improve the AI output, or examples of already improving it

**53. N3-AIL-wk1-own-piece-embedded-mid-submission** (mark 3, capped false, ceilingBand 4)
- [required] met: Learner's own writing on a real work scenario (produced without AI)
- [required] met: LLM output on the same subject
- [required] met: A short (50-100 word) evaluation comparing the two versions (readability, engagement, human vs AI)
- [stretch] **UNMET**: Concrete next steps to improve the AI output, or examples of improvements already made

## Surprising or worth noting

1. **Test 6 scored mark 2 in 3 of 5 runs.** Runs 2, 3 and 5 were capped at 2 with the own-writing item unmet. Runs 1 and 4 scored mark 4 and were not capped. In run 1 the presenceEvidence list has no own-writing item at all (three required items, all met). In run 4 the own-writing item is worded "Reference to/inclusion of the learner's own writing as one side of the comparison" and is marked met. `ceiling-cap-verification-v2.md` recorded mark 2 in 5 of 5.
2. **Input tokens per call are about 7,660 on average (range 7,269 to 8,238).** The same texts used about 4,400 input tokens in `ceiling-cap-verification-v2.md` (for example Test 6 run 5: 4,396 then, 7,645 now). Output tokens also differ for the same text (Test 6 run 5: 3,384 then, 4,918 now).
3. **The longest call used 5,761 output tokens (Test6-run2) against a max_tokens of 6000.** All 53 ended with end_turn.
4. **Two cases outside Test 6 were capped:** `35-boundary-0v1-3v4__di-wk1-notion-page-ambiguous` (mark 1, raw 1.5, two required items unmet) and `39-boundary-2v3__wk1-evaluate-llm-output-2v3` (mark 2, raw 2.5, the 50-100 word evaluation unmet). Neither has a designed value in the repo.
5. **Seven whole-number marks differ from the earlier reports** (table above): two in Test 6 (runs 1 and 4, 2 to 4), WK3-Band3 (4 to 3 against v2), `dmai-wk1-ceo-audit-confident` (1 to 2), `dmai-wk1-ceo-audit-ambiguous` (0 to 1), `dmai-wk5-personas-ambiguous` (4 to 3), and Test 4's internal mark (1 to 0).
6. **WK1-Band1 and WK4-Band1 scored 2 against a designed band of 1** (the same marks as in `fix-verification-results-final.md`). C4 scored 4 against a designed 3 (also as in v2).
7. **borderline was true on 31 of 53 calls.** One call had an empty bandReasoning (`08-di__WK1-Band2`).
8. **`fix-verification-results-final.md` says it covers 41 cases but has 40 rows**; `dmai-wk9-more-reach` is missing, so that case has no comparison here.
9. **The runner did not capture token counts or stop reasons live** (null in the raw results file). They come from the server log and are saved separately.
