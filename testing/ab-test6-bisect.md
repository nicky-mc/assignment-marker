# Test 6 bisect: where the own-writing cap stops holding (AssisTED)

Measurement only. No code, prompt, rubric or settings were changed. No retries. 15 new calls (5 on each of three builds) plus the 5 recorded in `testing/epa-baseline.md`, 0 HTTP errors, 0 parse failures.

## Hypothesis and rule (verbatim)

> Hypothesis, written BEFORE running: the meaning-over-wording rule (meaning-v1) loosened what counts as the missing own-writing piece, so some Test 6 runs mark it as met and are not capped. Competing explanations: the tone changes, the longer prompt, or run-to-run variance. Rule for the result: a build "holds" if Test 6 is mark 2 and capped in 5 of 5 runs; 4 or fewer is "fails". No fixes in this experiment.

## Method

- Builds, in order: `presence-cap-quickset` (92cece2), `pre-meaning` (5a92998), `meaning-v1` (d476f09), `epa-baseline` (b2c57af, the five runs already recorded; not re-run).
- For each new build: `git worktree add --detach`, `.env.local` copied, `npm install`, `npm run dev -- -p 3001` with `AUTH_MODE=off RUBRIC_SOURCE=file` set inline, five Test 6 calls, server stopped, worktree removed.
- The runner was `testing/run-baseline.mjs` from the main folder (first five jobs only, `LIMIT=1` then `SKIP=1 LIMIT=4`), and the text came from the main folder's `testing/cases/test6.txt` (228 words, SHA-256 dafc825d...5f3d) for every build. Request body: `{ rubricId, anonymisedSubmission }` to `/api/mark`.
- Model on every build: claude-opus-4-8. Run window 2026-10-07 16:26 to about 16:42 UTC for the new calls.
- Token counts and stop reasons come from each server's own usage lines, matched to the calls by order (5 of 5 per build). The runner's live read of these was null for most calls, as in the baseline. The baseline row uses `epa-baseline-usage.jsonl`.
- The "own-writing" items below are every presenceEvidence item whose criterion mentions the learner's "own" writing, version or piece, other than the evaluation item (matched by text, so check the full list in the raw results).

## Result per build

| Build | Mark 2 and capped | Verdict |
|---|---|---|
| presence-cap-quickset (92cece2) | 5 of 5 | holds |
| pre-meaning (5a92998) | 4 of 5 | fails |
| meaning-v1 (d476f09) | 4 of 5 | fails |
| epa-baseline (b2c57af) | 3 of 5 | fails |

Five runs per build is a small sample.

## Runs

### presence-cap-quickset (92cece2)

| Run | mark | rawScore | capped | ceilingBand | boundaryCase | stop_reason | In | Out |
|---|---|---|---|---|---|---|---|---|
| 1 | 2 | 2.6 | true | 3 | true | end_turn | 4396 | 3114 |
| 2 | 2 | 2.5 | true | 2 | true | end_turn | 4396 | 3247 |
| 3 | 2 | 3.5 | true | 4 | true | end_turn | 4396 | 3379 |
| 4 | 2 | 2.5 | true | 2 | true | end_turn | 4396 | 2575 |
| 5 | 2 | 2.5 | true | 3 | true | end_turn | 4396 | 3186 |

Own-writing items:
- Run 1 (mark 2, capped true): [required] met=false "Learner's own writing on the same subject (written without AI)" (no quote)
- Run 2 (mark 2, capped true): [required] met=false "Learner's own ~100 word writing on the scenario, produced without AI help" (no quote)
- Run 3 (mark 2, capped true): [required] met=false "Learner's own written version (~100 words, no AI) on the scenario" (no quote)
- Run 4 (mark 2, capped true): [required] met=false "Learner's own ~100 word writing on the scenario produced without AI help" (no quote)
- Run 5 (mark 2, capped true): [required] met=false "Learner's own ~100 word writing on the scenario produced without AI" (no quote)

### pre-meaning (5a92998)

| Run | mark | rawScore | capped | ceilingBand | boundaryCase | stop_reason | In | Out |
|---|---|---|---|---|---|---|---|---|
| 1 | 2 | 3.5 | true | 4 | true | end_turn | 6513 | 4729 |
| 2 | 4 | 3.6 | false | 4 | true | end_turn | 6513 | 5110 |
| 3 | 2 | 3.4 | true | 4 | true | end_turn | 6513 | 5464 |
| 4 | 2 | 3.5 | true | 4 | true | end_turn | 6513 | 3836 |
| 5 | 2 | 2.5 | true | 2 | true | end_turn | 6513 | 3326 |

Own-writing items:
- Run 1 (mark 2, capped true): [required] met=false "Learner's own writing on the same subject (produced without AI)" (no quote)
- Run 2 (mark 4, capped false): [required] met=true "Learner's own writing referenced/produced for comparison" quote: "the tone didn't quite match how I actually talk to this client, who I've worked"
- Run 3 (mark 2, capped true): [required] met=false "Learner's own written version (~100 words) produced without AI" (no quote)
- Run 4 (mark 2, capped true): [required] met=false "Learner's own writing (~100 words) on the scenario produced without AI" (no quote)
- Run 5 (mark 2, capped true): [required] met=false "Learner's own ~100 word writing on the scenario, produced without AI" (no quote)

### meaning-v1 (d476f09)

| Run | mark | rawScore | capped | ceilingBand | boundaryCase | stop_reason | In | Out |
|---|---|---|---|---|---|---|---|---|
| 1 | 2 | 3.6 | true | 4 | true | end_turn | 6785 | 3513 |
| 2 | 2 | 3.5 | true | 4 | true | end_turn | 6785 | 5178 |
| 3 | 2 | 3.5 | true | 4 | true | end_turn | 6785 | 3751 |
| 4 | 4 | 3.6 | false | 4 | true | end_turn | 6785 | 3462 |
| 5 | 2 | 3.5 | true | 4 | true | end_turn | 6785 | 4084 |

Own-writing items:
- Run 1 (mark 2, capped true): [required] met=false "The learner's own writing on the same subject (written without AI)" (no quote)
- Run 2 (mark 2, capped true): [required] met=false "The learner's own written version (~100 words, without AI) presented as text" (no quote)
- Run 3 (mark 2, capped true): [required] met=false "Learner's own ~100 word version written without AI, shown in the submission" (no quote)
- Run 4 (mark 4, capped false): no own-writing item listed (4 items: A prompt given to an LLM on the work sce / The LLM's output described/produced on t / An evaluation comparing the learner's ow / Concrete next steps to improve the AI ou)
- Run 5 (mark 2, capped true): [required] met=false "Learner's own written version of the scenario (~100 words, no AI)" (no quote)

### epa-baseline (b2c57af) (recorded earlier, not re-run)

| Run | mark | rawScore | capped | ceilingBand | boundaryCase | stop_reason | In | Out |
|---|---|---|---|---|---|---|---|---|
| 1 | 4 | 4 | false | 4 | false | end_turn | 7645 | 2653 |
| 2 | 2 | 3.5 | true | 4 | true | end_turn | 7645 | 5761 |
| 3 | 2 | 3.6 | true | 4 | true | end_turn | 7645 | 3468 |
| 4 | 4 | 3.6 | false | 4 | true | end_turn | 7645 | 3235 |
| 5 | 2 | 2.5 | true | 2 | true | end_turn | 7645 | 4918 |

Own-writing items:
- Run 1 (mark 4, capped false): no own-writing item listed (4 items: A prompt given to an LLM on a work scena / An evaluation comparing the learner's ow / Comment on tone/engagement/whether it re / Concrete next steps to improve the AI ou)
- Run 2 (mark 2, capped true): [required] met=false "Learner's own written version (~100 words, no AI) shown as a produced sample to compare against" (no quote)
- Run 3 (mark 2, capped true): [required] met=false "Learner's own ~100 word writing on the same subject, produced without AI" (no quote)
- Run 4 (mark 4, capped false): [required] met=true "Reference to/inclusion of the learner's own writing as one side of the comparison" quote: "the tone didn't quite match how I actually talk to this client, who I've worked"
- Run 5 (mark 2, capped true): [required] met=false "Learner's own ~100 word written version of the scenario, produced without AI" (no quote)

## Input tokens per call

| Build | Run 1 | Run 2 | Run 3 | Run 4 | Run 5 |
|---|---|---|---|---|---|
| presence-cap-quickset | 4396 | 4396 | 4396 | 4396 | 4396 |
| pre-meaning | 6513 | 6513 | 6513 | 6513 | 6513 |
| meaning-v1 | 6785 | 6785 | 6785 | 6785 | 6785 |
| epa-baseline | 7645 | 7645 | 7645 | 7645 | 7645 |

## git diff --stat between consecutive builds (file names and line counts only)

### presence-cap-quickset to pre-meaning

```
 AGENTS.md                   |   5 +++
 BACKLOG.md                  |   4 +++
 CHANGELOG.md                |   6 ++++
 components/MarkingForm.tsx  | 315 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++-------------
 lib/anonymise.ts            | 279 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++----------------------------------
 lib/extractText.ts          |  44 +++++++++++++++++++++--
 lib/marking.ts              |  52 ++++++++++++++++++++++++---
 lib/rubrics.ts              |   2 +-
 lib/toneGuide.ts            |  21 +++++++++++
 scripts/check-anonymiser.ts | 242 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 10 files changed, 874 insertions(+), 96 deletions(-)
```

### pre-meaning to meaning-v1

```
 lib/marking.ts | 5 +++--
 1 file changed, 3 insertions(+), 2 deletions(-)
```

### meaning-v1 to epa-baseline

```
 .env.example                                                       |   17 +
 .gitignore                                                         |    1 +
 AGENTS.md                                                          |   40 ++
 BACKLOG.md                                                         |    3 +
 CHANGELOG.md                                                       |   62 +++
 SUPABASE-SCHEMA.md                                                 |  130 +++++
 app/admin/layout.tsx                                               |    5 +
 app/admin/rubrics/[id]/page.tsx                                    |   19 +
 app/admin/rubrics/courses/new/page.tsx                             |    8 +
 app/admin/rubrics/export/route.ts                                  |   35 ++
 app/admin/rubrics/import/page.tsx                                  |   15 +
 app/admin/rubrics/new/page.tsx                                     |    8 +
 app/admin/rubrics/page.tsx                                         |   13 +
 app/admin/users/page.tsx                                           |   56 ++
 app/api/mark/route.ts                                              |   66 ++-
 app/auth/callback/route.ts                                         |   26 +
 app/auth/signout/route.ts                                          |    8 +
 app/config-error/page.tsx                                          |   20 +
 app/forbidden.tsx                                                  |   19 +
 app/globals.css                                                    |  308 +++++++++--
 app/layout.tsx                                                     |   16 +-
 app/login/page.tsx                                                 |   35 ++
 app/no-access/page.tsx                                             |   30 ++
 app/page.tsx                                                       |   58 ++-
 app/rubrics/[id]/loading.tsx                                       |   18 +
 app/rubrics/[id]/page.tsx                                          |  193 +++++++
 app/rubrics/loading.tsx                                            |   26 +
 app/rubrics/new/page.tsx                                           |   58 +++
 app/rubrics/page.tsx                                               |   71 +++
 components.json                                                    |   25 +
 components/Alert.tsx                                               |   35 ++
 components/AppCard.tsx                                             |  104 ++++
 components/AppMenu.tsx                                             |   93 ++++
 components/Breadcrumbs.tsx                                         |   34 ++
 components/FlashMessage.tsx                                        |   13 +
 components/HeaderMenu.tsx                                          |   26 +
 components/HeroCard.tsx                                            |   44 ++
 components/Logo.tsx                                                |   14 +-
 components/MarkingForm.tsx                                         |  706 +++++++++++++------------
 components/NeedAccess.tsx                                          |   19 +
 components/PageShell.tsx                                           |   25 +
 components/ResultCard.tsx                                          |  359 +++++++++++++
 components/RubricLibrary.tsx                                       |  292 +++++++++++
 components/SegmentedControl.tsx                                    |   36 ++
 components/SignInButton.tsx                                        |   19 +
 components/SignOutButton.tsx                                       |   11 +
 components/SiteHeader.tsx                                          |   18 +
 components/StatusBadge.tsx                                         |   33 ++
 components/SummaryCard.tsx                                         |   35 ++
 components/ThemeToggle.tsx                                         |    2 +-
 components/admin/AutoTextarea.tsx                                  |   37 ++
 components/admin/CourseMenu.tsx                                    |   74 +++
 components/admin/Field.tsx                                         |   87 ++++
 components/admin/FormParts.tsx                                     |   47 ++
 components/admin/HistoryTimeline.tsx                               |   38 ++
 components/admin/ImportForm.tsx                                    |   74 +++
 components/admin/LibraryMoreMenu.tsx                               |   69 +++
 components/admin/NewCourseDialog.tsx                               |   89 ++++
 components/admin/RubricEditor.tsx                                  |  578 +++++++++++++++++++++
 components/admin/RubricMoreMenu.tsx                                |  126 +++++
 components/admin/SignupSettingsCard.tsx                            |  233 +++++++++
 components/admin/StatusActionDialog.tsx                            |   60 +++
 components/admin/TryDraft.tsx                                      |   84 +++
 components/admin/TryDraftSheet.tsx                                 |   24 +
 components/admin/UserHistoryTimeline.tsx                           |   35 ++
 components/admin/UsersPanel.tsx                                    |  271 ++++++++++
 components/admin/ui.tsx                                            |   28 +
 components/ui/alert-dialog.tsx                                     |  187 +++++++
 components/ui/badge.tsx                                            |   51 ++
 components/ui/button.tsx                                           |   50 ++
 components/ui/card.tsx                                             |  102 ++++
 components/ui/checkbox.tsx                                         |   28 +
 components/ui/dialog.tsx                                           |  160 ++++++
 components/ui/dropdown-menu.tsx                                    |  267 ++++++++++
 components/ui/input.tsx                                            |    9 +
 components/ui/label.tsx                                            |   19 +
 components/ui/native-select.tsx                                    |    9 +
 components/ui/separator.tsx                                        |   24 +
 components/ui/sheet.tsx                                            |  138 +++++
 components/ui/skeleton.tsx                                         |   13 +
 components/ui/sonner.tsx                                           |   58 +++
 components/ui/textarea.tsx                                         |    8 +
 components/useDragScroll.ts                                        |  127 +++++
 lib/auth/access.ts                                                 |   48 ++
 lib/auth/adminAccess.ts                                            |   16 +
 lib/auth/claimAccess.ts                                            |   20 +
 lib/auth/config.ts                                                 |   28 +
 lib/auth/pageAccess.ts                                             |   15 +
 lib/auth/rateLimit.ts                                              |   20 +
 lib/auth/supabaseBrowser.ts                                        |    9 +
 lib/auth/supabaseServer.ts                                         |   24 +
 lib/extractText.ts                                                 |   62 ++-
 lib/marking.ts                                                     |    4 +-
 lib/rubricAdmin/actions.ts                                         |  205 ++++++++
 lib/rubricAdmin/deleteActions.ts                                   |   29 ++
 lib/rubricAdmin/deleteStore.ts                                     |   23 +
 lib/rubricAdmin/formState.ts                                       |   14 +
 lib/rubricAdmin/slug.ts                                            |   14 +
 lib/rubricAdmin/store.ts                                           |  264 ++++++++++
 lib/rubricAdmin/validate.ts                                        |  231 +++++++++
 lib/rubricNotes.ts                                                 |    3 +
 lib/rubricStore.ts                                                 |  226 ++++++++
 lib/signupRules.ts                                                 |   48 ++
 lib/toneGuide.ts                                                   |   19 +-
 lib/userAdmin/actions.ts                                           |   53 ++
 lib/userAdmin/store.ts                                             |   94 ++++
 lib/utils.ts                                                       |    6 +
 next.config.ts                                                     |    5 +-
 package-lock.json                                                  | 3476 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++------
 package.json                                                       |   11 +
 proxy.ts                                                           |   60 +++
 scripts/check-pdf.ts                                               |   88 ++++
 scripts/check-rubric-validator.ts                                  |   41 ++
 scripts/check-rubrics-db.ts                                        |   59 +++
 scripts/check-signup-rules.ts                                      |   29 ++
 scripts/seed-rubrics.ts                                            |   44 ++
 supabase/migrations/001_init.sql                                   |  123 +++++
 supabase/migrations/002_rubric_admin.sql                           |  101 ++++
 supabase/migrations/003_admin_users_and_rubric_delete.sql          |  252 +++++++++
 supabase/migrations/004_self_signup.sql                            |  294 +++++++++++
 testing/fixtures/Jane-Doe_F-10_AIL_Week2_paragraphs-unlabelled.pdf |  Bin 0 -> 43045 bytes
 testing/fixtures/Jane-Doe_F-10_AIL_Week2_table-labelled.pdf        |  Bin 0 -> 46795 bytes
 122 files changed, 11993 insertions(+), 576 deletions(-)
```

## Where the failure first appears

Going from the earliest build to the latest, the first build that fails the rule is **pre-meaning** (4 of 5 at mark 2 and capped). Counts by build: presence-cap-quickset 5/5, pre-meaning 4/5, meaning-v1 4/5, epa-baseline 3/5. Five runs per build is a small sample.

The first failing build comes before meaning-v1 in the build order. Between the last holding build and the first failing build the diff is the first stat above (input tokens per call rose from 4,396 to 6,513 over that step).
