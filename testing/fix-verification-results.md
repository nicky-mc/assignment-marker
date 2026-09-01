# Fix verification results — PARTIAL (31 of 41 cases)

**Status: stopped mid-run at the user's request, before completion. This is not a finished verification report — no conclusions about whether the fix works should be drawn from this file alone.** 31 of 41 planned cases finished before the run was stopped; the 32nd case (`dmai-wk9-more-reach`) was in flight and was cut off with no result. The remaining 10 cases were never started. `lib/marking.ts` and `lib/scoring.ts` are in their finished state for this fix and were not touched further after this partial run.

Only summary fields were captured for these results (`rawScore`, `mark`, `borderline`, `boundaryCase`, `boundaryBands`, `topicMismatch`) — the run's progress log streams these per case, but the full feedback text (`bandReasoning`, `recognition`, `explanation`, `nextSteps`, `motivation`) is only written to disk in one final JSON dump at the end of all 41 cases, which never happened. So full feedback text is not available for any case in this partial run.

## Cases completed (31/41)

"Prior" = the rawScore/mark/borderline recorded in the earlier testing/*.md rounds, before this fix. "New" = this partial re-run, after the fix.

| Group | Case | Prior raw/mark/borderline | New raw/mark/borderline | New boundaryCase | New boundaryBands |
|---|---|---|---|---|---|
| testing-md | Test1-strong | 4.0 / 4 / No | 4.0 / 4 / No | false | null |
| testing-md | Test2-meets | 3.0 / 3 / No | 3.0 / 3 / No | false | null |
| testing-md | Test3-thin | 1.0 / 1 / No | 1.4 / 1 / **Yes** | true | [1,2] |
| testing-md | Test4-mismatch | 0.0 / mismatch / No | 0.0 / 0 / No (mismatch=true) | false | null |
| testing-md | Test5-borderline | 2.6 / 3 / Yes | 2.5 / 3 / Yes | true | [2,3] |
| di | spot-check-dmai-wk1-ceo-audit | 3.0 / 3 / No | 3.4 / 3 / **Yes** | true | [3,4] |
| di | WK1-Band1 | 1.5 / 2 / Yes | 1.5 / 2 / Yes | true | [1,2] |
| di | WK1-Band2 | 2.0 / 2 / No | 2.0 / 2 / No | false | null |
| di | WK1-Band3 | 3.4 / 3 / Yes | 3.4 / 3 / Yes | true | [3,4] |
| di | WK1-Band4 | 4.0 / 4 / No | 4.0 / 4 / No | false | null |
| di | WK3-Band1 | 1.2 / 1 / No | 1.0 / 1 / No | false | null |
| di | WK3-Band2 | 2.2 / 2 / No | 2.4 / 2 / **Yes** | true | [2,3] |
| di | WK3-Band3 | 3.4 / 3 / Yes | 3.4 / 3 / Yes | true | [3,4] |
| di | WK3-Band4 | 4.0 / 4 / No | 4.0 / 4 / No | false | null |
| di | WK4-Band1 | 1.6 / 2 / Yes | 1.5 / 2 / Yes | true | [1,2] |
| di | WK4-Band2 | 2.0 / 2 / No | 2.0 / 2 / No | false | null |
| di | WK4-Band3 | 3.2 / 3 / No | 3.4 / 3 / **Yes** | true | [3,4] |
| di | WK4-Band4 | 4.0 / 4 / No | 4.0 / 4 / No | false | null |
| di | WK5-Band1 | 1.0 / 1 / No | 1.0 / 1 / No | false | null |
| di | WK5-Band2 | 1.9 / 2 / No | 1.6 / 2 / **Yes** | true | [1,2] |
| di | WK5-Band3 | 3.0 / 3 / No | 3.0 / 3 / No | false | null |
| di | WK5-Band4 | 4.0 / 4 / No | 4.0 / 4 / No | false | null |
| ail-dmai | wk1-evaluate-llm-output (prior 1v2 gap case) | 1.8 / 2 / No | 1.5 / 2 / **Yes** | true | [1,2] |
| ail-dmai | wk2-swot-ai-industry-confident | 1.3 / 1 / No | 1.0 / 1 / No | false | null |
| ail-dmai | wk3-risk-appetite-confident | 1.0 / 1 / No | 1.4 / 1 / **Yes** | true | [1,2] |
| ail-dmai | wk5-pov-statement-confident | 1.2 / 1 / No | 1.4 / 1 / **Yes** | true | [1,2] |
| ail-dmai | dmai-wk1-ceo-audit-confident | 1.0 / 1 / No | 1.4 / 1 / **Yes** | true | [1,2] |
| ail-dmai | dmai-wk4-digital-deep-dive-confident | 1.0 / 1 / No | 1.0 / 1 / No | false | null |
| ail-dmai | dmai-wk5-personas-confident | 1.0 / 1 / No | 1.0 / 1 / No | false | null |
| ail-dmai | dmai-wk6-email-campaigns-confident | 1.0 / 1 / No | 1.0 / 1 / No | false | null |
| ail-dmai | dmai-wk7-content-plan (prior 1v2 gap case) | 1.8 / 2 / No | 1.6 / 2 / **Yes** | true | [1,2] |

## Cases not completed (10/41)

- `ail-dmai/dmai-wk9-more-reach` — started, in flight when stopped, no result captured.
- All 6 of the 0-vs-1 / 3-vs-4 boundary group: `wk2-swot-ai-industry-ambiguous`, `dmai-wk1-ceo-audit-ambiguous`, `di-wk1-notion-page-ambiguous`, `wk3-risk-appetite-ambiguous`, `dmai-wk5-personas-ambiguous`, `di-wk5-marketing-email-ambiguous` — never started.
- All 3 of the 2-vs-3 boundary group: `wk1-evaluate-llm-output-2v3`, `dmai-wk4-digital-deep-dive-2v3`, `di-wk3-ai-research-presentation-2v3` — never started.

## What this partial data does and doesn't show

Both submissions that were previously identified as "gap" cases at the 1-vs-2 boundary (`wk1-evaluate-llm-output` and `dmai-wk7-content-plan`, both previously raw 1.8, mark 2, not borderline) completed in this run and are now flagged `boundaryCase: true` / borderline. That's consistent with the fix working as intended on those two specific cases, but two data points aren't the full picture the complete run was meant to produce.

Also worth noting plainly, without interpreting it further here: several previously confident, non-borderline scores (`wk3-risk-appetite-confident`, `wk5-pov-statement-confident`, `dmai-wk1-ceo-audit-confident`, all prior raw 1.0-1.2) came back at raw 1.4 and flagged borderline in this run. Whether that's the fix correctly catching genuine ambiguity the old fraction-window check also would have caught at 1.4 anyway, or a shift in how often the model now reaches for `boundaryCase: true`, isn't something this partial data can answer — that assessment needs the full run's `bandReasoning` text (not captured here) and the complete gap-rate comparison across all 41 cases, including the 10 that never ran.

No production file was modified during or after this partial run beyond the fix itself, which was already complete and committed-pending before this run started.
