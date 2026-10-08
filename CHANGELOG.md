# Changelog

## 2026-10-08: How to page: no borderline or score wording, and a section on checking what is hidden

- Removed the Borderline card and the score and borderline fields from the page's example result, so the example shows the mark only. Added "Staff will review the evidence and agree or not as appropriate." under step 5.
- New section "Check what is hidden before you mark": a before and after example using invented text (the "after" block is produced by the real anonymiser when the page renders), lists of what is hidden and what can be missed, steps for redacting in the Edit view of Check the preview, and a "Why we review it" box. `scripts/check-how-to-example.ts` fails if the code starts hiding something the page says it misses, or if banned wording or dashes appear. Copy and layout only: marking logic, the result schema and `lib/anonymise.ts` are untouched.

## 2026-10-08: How to use AssisTED page

- New `/how-to` page (same sign-in rules as the other pages): a friendly header with Start marking, five numbered step cards with small original SVG illustrations, Good to know cards, an example result card with made-up data labelled "Example, not real marking", a keyboard-operable FAQ, and Start marking again at the bottom. Linked from the header menu and from "First time? See how it works" on the marking page.
- All wording is in `content/how-to.ts`. Gentle entrance motion only, switched off for reduced motion. No analytics, no API calls. Marking logic, rubrics and the database are untouched.
- Checked: `tsc`, lint, `npm run build` (route dynamic), and a look in light and dark mode at phone and desktop-ish widths.

## 2026-10-08: Several files, pasted text and links, each labelled

- The marking form takes up to 8 files (picker or drag and drop; 5 MB in total), pasted text, and up to 5 optional links, each with a label (suggestions come from the assignment's checklist or requirements). A file that could not be read stays visible with the reason and is left out. Links are never opened: only the label and the kind of site go into the text; the web address is never sent, stored or logged.
- `lib/submissionParts.ts` assembles labelled parts ("=== PART n: label (file) ===" then a links section), anonymising each part with the same confirmed names. Exactly one file or pasted text with no links is sent exactly as before, with no headers. The route finds which part each quote came from and `ResultCard` shows "From: label", plus a "Not opened, please check" list.
- One sentence added to the banded and complete-mode instructions about labelled parts and links. Banded scoring, schema and tone guide are unchanged.
- Checks: `scripts/check-submission-parts.ts` (27, no API calls), `tsc`, lint, build; two live calls (single file mark matched the previous run, three-part quotes carried the right labels). Not looked at in a browser.

## 2026-10-08: Marking path for complete / not complete rubrics

- New `lib/markingComplete.ts`, called by `/api/mark` when a rubric's grading mode is complete (replaces the "not supported yet" guard). The model returns per-line checklist evidence (verbatim quote, met, cannotVerify), then reasoning, then feedback and marker notes. The outcome is derived in code: a line counts as met only if its quote is found in the submission (case and whitespace ignored); the work is "complete" if every verifiable line is met, otherwise "not complete"; lines that cannot be checked from the text never cause "not complete" and are listed as needing the marker's check. No score, band, borderline or ceiling.
- Same model, max_tokens, anonymisation, rate limiting and two-breakpoint caching structure as the banded path; the tone guide is reused unchanged. The banded path (`lib/marking.ts`, `lib/scoring.ts`, `lib/toneGuide.ts`) is untouched.
- Result card: Complete / Not complete chip, checklist panel with quotes, "Needs your check" list, the usual feedback sections; the copied feedback starts with the outcome.
- Checks: `scripts/check-marking-complete.ts` (13 offline checks, plus 4 live cases with `LIVE=1`).

## 2026-10-08: Complete / not complete rubrics (data model and admin only)

- Rubrics have a grading mode: banded (0 to 4, as before) or complete / not complete with a checklist. A missing mode means banded, so existing rubrics and old JSON exports are unchanged. A complete rubric needs a non-empty checklist (up to 30 plain one-line items) and ignores band descriptions and the stretch goal. Export and import carry both fields.
- Admin editor: Grading mode selector; in complete mode the stretch goal and band descriptions are hidden and a checklist editor (add, remove, move up or down) appears. Library cards show a Complete / Not complete badge. New empty courses Build, Brand and Balance are in `COURSES` (the file source lists a course only once it has a rubric).
- `/api/mark` refuses a complete rubric with a clear "not supported yet" message (501) and never returns a banded mark. Marking, scoring and anonymising code are untouched.
- Needs `supabase/migrations/005_grading_mode.sql` (already run by hand; committed unchanged). Checks: `tsc`, lint, `npm run build`, `scripts/check-rubric-validator.ts` 25 of 25, `scripts/check-rubric-roundtrip.ts` (14 current rubrics identical after export and import). Not run against Supabase or looked at in a browser.

## 2026-10-07: Staff self sign-up as marker (domain-limited, removal sticks)

- A person who signs in with a verified Google account at an allowed domain (default techeducators.co.uk, exact match only) is added as a marker on first sign-in, by the database function `claim_marker_access()` called from the server. It never creates or changes an admin. Removing a person blocks their email until an admin chooses Allow again or adds them by hand.
- Users page: Staff sign-up card (on or off, up to 5 domains, free-mail refused, confirmation before any change), Self sign-up and New labels, Removed people list with Allow again, self sign-up shown in the history.
- Needs `supabase/migrations/004_self_signup.sql` (paste into the SQL editor; it changes `add_allowed_user`, `remove_allowed_user` and the history action check). Checks: `scripts/check-signup-rules.ts` 14 of 14, `tsc`, lint, `npm run build`. Not run against Supabase or looked at in a browser.

## 2026-10-07: UI standards polish (presentation only)

- Two page widths as tokens (narrow 720px, wide 1040px) with the header inside the page container; centred sign-in card with logo and an optional "Need access?" line; one editable "Feedback to send" field with Reset to AI draft and Copy feedback; one Highlighted or Edit preview surface; compact evidence rows with Expand all and Collapse all; one sticky save bar with "Edited" labels on the rubric editor; retired banner and lighter dialog backdrops; users page breadcrumbs, validation and own-row reasons; fewer name suggestions with Dismiss; proper alerts; Hide original after Anonymise and when Mark is pressed; skip link, page titles and focus return. No marking, scoring, anonymising, SQL, API or rubric content changes. Not added: the rubric and build audit line (no build or commit variable exists).

## 2026-10-07: Smooth carousel and collapsible marking steps

- Carousel: no scroll-snap, drag with the mouse from anywhere on a card or gap, a short glide on release (skipped for reduced motion), native touch, trackpad and keyboard unchanged.
- Marking page: the four step cards collapse with a one-line summary (never the file name or learner text), collapse automatically when Mark is pressed, show a progress card with Cancel while marking, then scroll to the result, focus its heading and announce "Draft ready". Expand all and Collapse all appear once there is a result.
- Checks: `tsc`, lint, anonymiser script 38 of 38, `npm run build` (routes dynamic). Not yet looked at in a browser.

## 2026-10-07: Admin user management and deleting rubrics or empty courses

- `/admin/users` (admins only): add people, make admin or marker, remove access, each behind a confirmation, with a history timeline. "Manage users" is in the menu for admins. Changes go through database functions that refuse to remove the last admin or your own access.
- Admins can delete a rubric (only when no version is live; typing its id if it was ever live) or an empty course, with a full copy kept in an audit log and a Deletion log sheet. Direct deletes stay blocked.
- Needs `supabase/migrations/003_admin_users_and_rubric_delete.sql`. Checked with `npm run build` (routes dynamic), `tsc` and lint; not yet run against Supabase or looked at in a browser.

## 2026-10-07: Rubric library admin (edit in place, create, approve, history)

- Admins reading rubrics from the database can edit each block in place (with counters, instruction-wording warnings and an unsaved-changes guard), edit band descriptions, add assignments and courses, import and export, approve and retire through confirm dialogs, try a draft in a sheet, and see a history timeline. Markers see none of it.
- Uses the existing server actions unchanged; `/admin/rubrics*` pages redirect to the library. Toasts and inline banners report results.
- Checks: `npm run build` (routes dynamic), `tsc` and lint. Not yet looked at in a browser or run against Supabase.

## 2026-10-07: Library polish

- The rubric carousel can be dragged with a mouse (touch, trackpad and keyboard stay native), its scrollbar is hidden, and Previous and Next disable at the ends. `color-scheme` now follows the theme, so native controls match.
- Detail page: band descriptions are a numbered list instead of tabs, a tidier two-column layout from 900px, and the admin note is plain language inside the hero card (no environment variable names in the interface).
- Checks: `npm run build` (routes dynamic), `tsc` and lint. Not yet looked at in a browser.

## 2026-10-07: Rubric library and read-only detail pages

- New `/rubrics` (course rows with scrolling assignment cards, search, admin status filters) and `/rubrics/[id]` (read-only detail with band tabs) for every signed-in user. Markers see live rubrics only, enforced by reading with their own session (row-level security) plus a server-side filter; admins see every status.
- `rubricStore` gained `listLibrary` and `getLibraryDetail`; `/admin/rubrics` now redirects admins to `/rubrics`; the menu has "Rubric library" for everyone. Editing controls arrive in the next update.
- Checks: `npm run build` (routes dynamic), `tsc` and lint. Not yet looked at in a browser.

## 2026-10-07: Design system (presentation only)

- shadcn/ui (Base UI, Tailwind v4) with softer light and dark tokens in `app/globals.css`, no pure white anywhere, fields dark in dark mode, and shared `AppCard`, `HeroCard` and `SummaryCard`. The marking page is now four step cards plus a summary card and marker and learner cards.
- The header email pill is replaced by a button-activated Menu (`HeaderMenu` and `AppMenu`): email and role, Mark, Rubric library (admins), Sign out. Behaviour of the marking page is unchanged.
- Checks: `npm run build` (routes still dynamic), anonymiser script 38 of 38, `tsc` and lint. Not yet looked at in a browser.

## 2026-10-07: Run access checks per request

- `requirePageAccess`, `requireAdmin` and the `/login` and `/no-access` pages now await `connection()`, so seven routes that were prerendered at build time (baking in the build-time `AUTH_MODE`) are dynamic. No change to what the checks decide.

## 2026-10-07: Rubric management screens for admins

- `/admin/rubrics` (admin role only, checked on the server): list, new course, new and edit rubric with limits and prompt-injection safeguards, import and export JSON, approve and retire, and an admin-only "try a draft" through `/api/mark`. Only approved rubrics are used for marking; history is append-only.
- Needs `supabase/migrations/002_rubric_admin.sql` (rubric key becomes id + version, courses table, `approve_rubric` function); new `REQUIRE_SECOND_APPROVER` switch; `scripts/check-rubric-validator.ts` (12 of 12).
- **Not yet run** against Supabase: checked with `tsc`, lint and the validator script only.

## 2026-10-07: Optional Google sign-in and Supabase rubric store (off by default)

- New switches `AUTH_MODE` and `RUBRIC_SOURCE` (defaults keep today's behaviour); sign-in, allowlist, per-user rate limit and `proxy.ts` live in `lib/auth/`, and all rubric access goes through `lib/rubricStore.ts` with file and Supabase implementations.
- `supabase/migrations/001_init.sql`, seed and read-back scripts, `.env.example`; production fails closed unless `AUTH_MODE=on`. Result card shows "Rubric vN, database" only for database rubrics.
- **Not yet run:** no SQL, scripts or sign-in tried; checked with `tsc` and lint only.

## 2026-10-06: Add plain-English marker rationale and evidence

- New `markerNotes` object after `feedback` in the schema (`lib/marking.ts`): a plain-English rationale, evidence for the explanation, and a why plus evidence for each next step. Prompt rules added, `max_tokens` raised from 4000 to 6000.
- `components/MarkingForm.tsx` shows "Why this mark" and the evidence blocks on the marker-facing card only; the editable "Feedback to send" text is built exactly as before and contains none of it.
- **Not yet run against the API.** Checked with `tsc` and lint only.

## 2026-09-04: Fix DI week 3/4 mix-up, dropdown order, remove Borderline badge

- **DI week labels were swapped**: "Present Your AI Research" was labelled Week 3 and "AI Tools Showdown: NotebookLM vs Gemini Gems" was labelled Week 4, the wrong way round. Swapped the `week` field on both `lib/rubrics.ts` entries (`di-wk3-ai-research-presentation` is now `week: "Week 4"`, `di-wk4-notebooklm-vs-gems` is now `week: "Week 3"`) - the ids and all other rubric content stay attached to their existing topics, only the displayed week label moved.
- **Assignment dropdown wasn't in week order** for Digital Innovators once the labels above were corrected (it follows array order, not the `week` field), showing Week 1, 4, 3, 5. Reordered the two `RUBRICS` entries so the array itself reads Week 1, 3, 4, 5.
- **Removed the "Borderline" badge** from the marker-facing results panel (`components/MarkingForm.tsx`) at the user's request. The raw score is still shown next to the mark, and the underlying `borderline` flag is still returned by the API and used for `computeBand`'s logic - only the visible badge text was removed, nothing about the second-marking/boundary-detection mechanism changed.

**Verification:** `npx tsc --noEmit` and `npx eslint` clean on both changed files. Drove the actual UI in the Browser pane: switching to Digital Innovators now shows the assignment dropdown in Week 1/3/4/5 order with the corrected topic-to-week mapping; ran a known-borderline AI Literacy submission (raw score 2.5) through Mark and confirmed the result panel shows the mark and raw score with no "Borderline" text anywhere on the page.

## 2026-09-02: Fix the boundary-flag text-to-score gap (partial fix)

**Background - six rounds of testing.** After the DI rubrics landed, a series of test rounds (`testing/di-test-results.md`, `testing/boundary-test-results.md`, `testing/boundary-0v1-3v4-results.md`, `testing/boundary-2v3-results.md`) probed how reliably the marking pipeline's `Borderline` flag caught genuinely ambiguous submissions. The pattern that emerged: the model could write explicit boundary-case reasoning in its feedback text ("sits between band 1 and 2", "between an attempt and showing understanding") while still outputting a confident, non-borderline decimal score - because in the old schema, `rawScore` was generated *before* any reasoning field, so the reasoning had no way to feed back into the number, and the only signal available to `computeBand` was a blunt 0.4-0.6 fractional-window heuristic on a score the model had already committed to. The final round tested all four adjacent-band boundaries (0v1, 1v2, 2v3, 3v4) including the one boundary the marking prompt's own worked example covers (2.4-2.6), and found the gap at roughly the same rate (~33-50%) everywhere, including right at the worked example - ruling out "the model is only well-calibrated near its one example" as the explanation, and pointing instead to the reasoning/scoring order problem as the real root cause.

**The fix**, entirely in `lib/marking.ts` and `lib/scoring.ts`:

- `MarkingResultSchema` gained `bandReasoning` (a required free-text field, positioned before scoring) and two structured fields the model must set directly from that reasoning: `boundaryCase` (boolean) and `boundaryBandLower`/`boundaryBandUpper` (the two adjacent band numbers in tension, or null). Since structured output is generated in schema-declaration order, the model now has to reason about which band(s) fit and explicitly decide whether it's a boundary case *before* it writes `rawScore` - rather than the old order, where `rawScore` came first and any reasoning that followed couldn't influence it.
- `buildSystemPrompt` was restructured to match: reason about the best-fitting band, explicitly consider whether a second marker could argue for the adjacent band, decide `boundaryCase` and name the two bands in tension, then set `rawScore` consistent with that decision. Generalised the guidance to any adjacent band pair (0/1, 1/2, 2/3, 3/4), not just the single 2.4-2.6 worked example. The band definitions, the "look for reasons to give marks" ethos, and the feedback-writing instructions (recognition/explanation/next steps/motivation, tone) are unchanged.
- `computeBand` now takes the model's `boundaryCase` as an explicit second argument and uses it as the *primary* signal for the `Borderline` flag (`borderline = boundaryCase || fractionIndicatesBoundary`). The old 0.4-0.6 fraction-window check is kept as a fallback, not removed, in case the explicit flag is ever wrong or omitted.
- Mid-verification, found and fixed a second bug: `bandReasoning` was being generated by the model (it's required by the schema) but never included in `markSubmission`'s return value, so it never reached the API response and couldn't be inspected. Added it to `MarkOutcome`.

**Verification** (`testing/fix-verification-results.md` for the interrupted partial run, `testing/fix-verification-results-final.md` for the complete report): re-ran all 41 previously-tested cases (5 from `TESTING.md`, 17 DI cases, 10 AIL/DMAI boundary cases, and the 12 cases classified across all four boundaries) through the updated pipeline.

- **Gap rate on the 12 classified boundary cases: 50% (6/12) before -> 0% (0/12) after.**
- **Zero regressions**: across all 41 cases, no whole-number mark changed from its pre-fix value.
- **Not fully deterministic**: re-running identical submissions through identical code sometimes flips `boundaryCase` true/false - directly observed in 3 separate cases, plus one case whose raw score varied across 2.0/2.3/2.4 on three identical calls. The 0% gap rate is a snapshot, not a guarantee.
- **A modest false-positive tendency**: of 11 flagged cases with full reasoning text, 2 (~18%) had `bandReasoning` that explicitly called the counter-case "marginal" or "a stretch" while still setting `boundaryCase: true`. The other 9 (~82%) showed reasoning that genuinely supported the flag.

**Verdict: partially fixed.** Closes the reasoning-score gap on average and with no regressions, but does not make individual flag decisions deterministic - the same submission can still be flagged on one run and not on another. Both remaining issues (non-determinism, false positives) fail in the safe direction for a flag-for-human-review mechanism: they cost extra review, not missed review.

## 2026-07-28: Add Digital Innovators course

Added a third course, **Digital Innovators** (`courseId: "di"`), with four rubrics (`di-` prefix, following the `dmai-` convention): Week 1 Create and Publish a Page Full of Content, Week 3 Present Your AI Research, Week 4 AI Tools Showdown (NotebookLM vs Gemini Gems), Week 5 Create an Effective Marketing Email. Purely additive to `lib/rubrics.ts` - one new `COURSES` entry plus four new `RUBRICS` entries appended after the existing DMAI ones; no existing entry, the `Rubric`/`Course` interfaces, the loader functions, or any other file was touched. Each new rubric has its own `bandDescriptions`, same as DMAI, since these assignments also have materially different pass/fail conditions per band rather than the generic AIL scale.

Judgement calls made condensing the brief into band descriptions (none of this was fully spelled out in the source brief, so noting it here for future reference):

- Every one of these four assignments' "4" criteria was specified as "meets 3, plus stretch goals and/or deeper understanding and/or creativity/innovation" followed by a list of examples. Kept that structure literally in `bandDescriptions[4]` (parroting the same qualifier language) rather than trying to compress the examples into a firmer checklist, since the brief itself treats them as illustrative, not exhaustive.
- Week 5 (marketing email)'s required subject line format (learner's full name, course, assignment title, plus a custom subject matter) is stated once in the brief's requirements list but not repeated in the band-3 text. Pulled it explicitly into both `bandDescriptions[2]` (as a named example of a "required element" that can be missing) and `bandDescriptions[3]` (as its own checklist item), rather than leaving it only in the `requirements` field - otherwise a marking model has no clear, checkable band-3 criterion to test the subject line against, which is exactly the failure mode the spot-check below targets.
- Week 3's brief lists a long, comma-heavy set of stretch examples (deeper research, critical thinking, creative formats, ethics, case studies, own-field discussion). Kept all of them in `bandDescriptions[4]` rather than trimming, since band 4 is explicitly meant to reward any one of several different kinds of "exceeds," not a specific combination.

**Verification:**

- `npx tsc --noEmit` and `npm run lint` clean.
- `git diff lib/rubrics.ts` confirmed the change is purely additive (only `+` lines besides the closing-bracket context line) - no existing rubric content altered.
- Course dropdown now lists AI Literacy / Digital Marketing with AI / **Digital Innovators**; selecting Digital Innovators correctly filters the Assignment dropdown to its four new entries only, same pattern as AIL/DMAI.
- Spot-checked `di-wk5-marketing-email` against a submission with a generic subject line ("New Autumn Collection Now Available" - no name, course, assignment title, or custom subject matter) but otherwise solid design/persuasion/polish. Result: **2/4** (raw score exactly 2.0, no Borderline badge), with the feedback explicitly naming the missing subject line format as what kept it out of the meets-expectations band and the next steps telling the learner to rework the subject line to include their full name, course, assignment title and a custom subject matter - confirms the `bandDescriptions` override is driving the mark, not the generic policy bands.
- Did not re-run the full TESTING.md suite (unrelated rubrics, unaffected by an additive change) or the `dmai-wk1-ceo-audit` recheck, since nothing touched the DMAI entries or the marking prompt logic itself.

Ran into an unrelated stale-Turbopack-manifest error ("Manifest file is empty") when first reloading the dev server for this session, from switching between `npm run build` and `npm run dev` earlier in the day - fixed by clearing `.next` and restarting, nothing to do with this change.

## 2026-07-28: Rename header to AssisTED

Renamed the header heading from "Marking Assistant" to "AssisTED" (capitalised TED), and updated the browser tab title to match. Left the subtitle line under it as-is.

## 2026-07-28: Cleaner upload typography, copy button, stronger anonymiser

**Upload typography.** Two separate causes were making uploaded documents look messy:

- The Learner submission and Anonymised preview textareas used `font-mono`, so ordinary prose (plus any leftover irregular spacing from extraction) rendered like code. Dropped `font-mono` from both - they now use the app's normal body font.
- `lib/extractText.ts` now runs a `normalizeExtractedText()` pass on every extracted file (not on pasted text - that stays exactly as the marker typed or pasted it): CRLF to LF, form-feed page breaks to paragraph breaks, collapsed repeated spaces/tabs per line, trimmed trailing whitespace, and runs of 3+ blank lines collapsed to one. Verified directly in Node against messy sample input - quadruple line breaks, doubled inter-word spacing, tabs, and a form feed all normalized correctly.

**Copy button.** The "Feedback to send (editable)" box now has a Copy button next to its label, using `navigator.clipboard.writeText()`, with the label flipping to "Copied!" for two seconds. Wrapped in a try/catch so a denied clipboard permission fails silently rather than crashing - the text is still a normal textarea the marker can select and copy by hand either way. Could not verify the actual copy-to-clipboard in this environment's sandboxed browser (`NotAllowedError: Write permission denied` - a restriction of the test browser itself, not something a real user's browser does over `https`/`localhost`), so this needs a manual check.

**Anonymiser.** It only caught emails, "Name:"-style lines, and "Hi, I'm X" greetings - genuinely thin, as flagged. Expanded `lib/anonymise.ts` to also catch:

- UK-shaped phone numbers (mobile and landline).
- A much longer list of label keywords (student ID, candidate number, learner, submitted by, prepared by, written by, created by, from, ...), not just "name"/"student"/"author".
- Sign-offs, both same-line ("Regards, Jane Doe") and the more common next-line shape ("Regards,\nJane Doe").
- Standalone name-only lines (e.g. "Jane Doe" alone on its own line) - but only checked in the first 3 and last 5 non-blank lines of the document, not the whole body, since a bare two-capitalised-word line is too likely to be something else (a place, a product name) once you're inside the actual submission text rather than its header/footer.

Verified all of the above directly in Node against realistic sample submissions (name/ID header, email, phone, body text, sign-off) - all expected redactions fired and nothing in ordinary prose was incorrectly flagged.

## 2026-07-28: Light/dark mode toggle

The app previously only followed the OS-level `prefers-color-scheme` setting, with no way to override it. Added a manual toggle (sun/moon button, top-right of the header, next to the logo):

- `app/globals.css` now defines dark-mode colours three ways: the existing `@media (prefers-color-scheme: dark)` block as the no-JS/first-paint fallback, and `:root[data-theme="dark"]` / `:root[data-theme="light"]` rules (higher specificity, so an explicit choice always wins over the OS setting in both directions). Also added `@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *))` so every existing `dark:` Tailwind utility across the app (Logo's light/dark swap, error text colours, etc.) responds to the same attribute instead of the media query.
- `components/ThemeToggle.tsx` reads/writes `data-theme` on `<html>` and mirrors the choice to `localStorage`.
- `app/layout.tsx` runs a small inline script via `next/script` with `strategy="beforeInteractive"` (placed as a sibling of `<body>`, per the Next.js docs - not inside a hand-written `<head>`, which isn't the documented pattern for the App Router) that reads `localStorage` before first paint and sets `data-theme` immediately, so a returning visitor never sees a flash of the wrong theme. `<html>` needs `suppressHydrationWarning` since this attribute is set outside React's own render.

`ThemeToggle`'s initial state has to be synced in a `useEffect` (not read during render) because the server has no `document` and always renders as if light - reading the real value during render instead of after mount would itself cause a hydration mismatch. Added a targeted `eslint-disable-next-line react-hooks/set-state-in-effect` with a comment explaining why, rather than restructuring around a lint rule that doesn't have an exception for this genuinely-necessary case.

Verified end-to-end in the browser: toggling flips every themed element (header, cards, logo, badges) correctly, the choice survives a full page reload with no flash, and toggling back to light restores the OS-default-matching state.

## 2026-07-28: File upload for .txt/.md/.pdf/.docx

Added an "Upload a file" button next to the Learner submission box. Extraction happens entirely in the browser (no new API route, nothing sent to the server until the marker has anonymised and confirmed as before):

- `.txt`/`.md` via the File API's `.text()`.
- `.pdf` via `pdfjs-dist`, reading the embedded text layer page by page. A scanned/image-only PDF with no text layer throws a clear error asking the marker to paste instead.
- `.docx` via `mammoth`.
- `.doc` (old binary Word format) is explicitly rejected with a message pointing at `.docx`, PDF export, or copy-paste - no good lightweight JS parser exists for it.

Both libraries are dynamically imported inside `lib/extractText.ts` rather than imported at the top of the file, so their browser-only code never runs during Next.js's server-side render pass of this client component.

`pdfjs-dist` needs its worker script served as a static file; `scripts/copy-pdf-worker.mjs` copies it from `node_modules` into `public/pdf.worker.min.mjs` on every `npm install` (added as a `postinstall` script) so it can't drift out of sync with the installed version. Also had to add `public/**` to `eslint.config.mjs`'s ignore list - ESLint was trying to lint the 1.2MB minified worker file as source and produced over 1500 warnings.

Verified `mammoth` and `pdfjs-dist` extraction directly against real generated `.docx`/`.pdf` files in Node (matching the exact library calls used in the browser code) - both recovered the original text correctly. Normalised repeated spaces in the PDF path after noticing one PDF generator's text layer used doubled inter-word spacing. Could not drive an actual OS file-picker dialog through either available browser automation tool in this environment to test the click-through in a live tab, so that last step (button click -> file dialog -> textarea fills in) needs a manual check.

## 2026-07-28: Editable feedback box, fuller draft warning

Added a second panel below the grading result: "Feedback to send (editable)". It is seeded with the same recognition, explanation, next steps and motivation as the read-only card above, combined into one plain-text block a marker can edit directly (a `- ` line per next step), then copy out to wherever they actually send feedback. Seeded in `handleMark`'s success path rather than a `useEffect` watching `result`, since deriving state from a prop/state change belongs in the event handler that caused the change, not a synchronised effect (this also avoided an eslint `react-hooks/set-state-in-effect` error).

Expanded the existing "this is a draft" reminder above the grading card, and added a second, more specific one directly above the new editable box: check claims are accurate, check the tone fits how the marker would normally talk to that learner, add anything specific to their submission, and cut anything generic before it goes out.

## 2026-07-28: Align top logo with header card monogram

The top-left wordmark logo lived in a full-width `<header>` with fixed `px-6` padding, while the header card sits inside `<main className="max-w-3xl">`, which centres itself at wide viewports. At 1400px wide that put the logo and the card's monogram 332px apart. Gave the header the same `max-w-3xl mx-auto` constraint as `main`, plus a `pl-12` to also match the card's own `p-6` inset (main's 24px `px-6` plus the card's 24px `p-6` = 48px). Verified both sit at the exact same x position at 800px and 1400px viewport widths.

## 2026-07-28: Monogram in the header card, tighten logo gap

- Added `public/te-monogram.png` (`TE_Monogram_Negative_Green_Small.png`) inline before the "Marking Assistant" heading in the purple header card. The card's background is fixed purple regardless of theme, so this always uses the light-on-dark ("negative") monogram variant rather than swapping with `prefers-color-scheme`.
- The gap between the top-left wordmark logo and the header card was 80px (header `py-4` plus main `py-16`). Changed header to `pt-4 pb-0` and main's top padding to `pt-6`, bringing it down to 24px.

## 2026-07-28: Add Tech Educators logo and favicon

Added the real Tech Educators branding assets, supplied by the user:

- `public/te-logo-light.png` (`TE_Logo_Positive_Green_Small.png`, purple wordmark) shown in light mode.
- `public/te-logo-dark.png` (`TE_Logo_Negative_Green_Small.png`, green wordmark) shown in dark mode.
- `app/favicon.ico` replaced with `TE_Monogram_Negative_Green_Small.ico`.

New `components/Logo.tsx` renders both images and toggles visibility with Tailwind's `dark:` variant (this app has no theme toggle, so it follows `prefers-color-scheme` the same way the rest of the app's colours already do). Placed in `app/layout.tsx` as a small header above `{children}`, so it appears top-left on every page, not just the marking form.

## 2026-07-28: Fix header/card width mismatch

The header card in `page.tsx` sits directly in `<main className="max-w-3xl">`, but `MarkingForm`'s root div independently capped itself at `max-w-2xl`, a narrower width. That made the purple header visibly wider than the Course/Assignment card and everything else below it. Removed the redundant `max-w-2xl` from `MarkingForm` so `<main>`'s width is the only constraint. Verified both cards now measure the same 720px width at the same left edge.

## 2026-07-28: Dark mode fix and no em-dashes

- The draft-grade reminder used a fixed dark purple text colour that was illegible on the dark-mode background (dark purple text on a near-black background). Switched it to the theme-aware `text-foreground` token so it flips to cream in dark mode, same as the rest of the plain page text.
- Removed all em-dashes from app source text (the assignment dropdown separator and the draft-grade reminder) and added an explicit instruction to the marking system prompt so AI-generated feedback does not use them either.

## 2026-07-28: Preview textarea + draft-grade reminder

- Anonymised preview: the textarea itself is now white (was blending into the green panel), and the surrounding panel got a thick `#3F1046` border to match the treatment now also added to the Mark output panel, so the two "output" panels read as a matched pair.
- Added a reminder between the Mark button and the grading panel: "The grade below is a draft — review, edit and personalise it before sharing with the learner." Only shows once a result exists.

## 2026-07-28 — Colour-blocked brand cards, rename to Marking Assistant

Confirmed `#3F1046` text on `#2AD385` (and the reverse) sits at ~7.8:1 contrast - passes AAA - so switched several panels from tinted/muted brand colours to literal solid blocks:

- Header and the Course/Assignment card: solid `#3F1046` background, `#2AD385` text.
- Anonymised preview panel: solid `#2AD385` background, `#3F1046` text; the confirmation checkbox sits in a reversed `#3F1046`/`#2AD385` chip within it.
- Mark output panel: solid `#2AD385` background, `#3F1046` text; the Borderline badge is reversed (`#3F1046` bg / `#2AD385` text) so it stands out against the green panel.
- Anonymise button: solid `#3F1046` background, `#2AD385` text (was outlined before).
- Main app background changed from the approximated cream to off-white (`#FAFAFA`).
- Renamed "Assignment Marker" to "Marking Assistant", subtitle to "Assistant to help grade learner submissions against Tech Educators Rubrics".

Left the mismatch warning badge amber and error text red - those are semantic states, not decorative brand colour, so didn't remap them into the two-colour scheme.

## 2026-07-28 — Brand styling

Applied brand fonts and colours: **Space Grotesk** for headings, **Lexend Deca** for body text, primary `#3F1046` (deep purple), secondary `#2AD385` (green), defined as CSS variables/Tailwind v4 theme tokens in `app/globals.css` and wired through `MarkingForm.tsx`.

- The background cream and the tint shades used behind badges/panels are approximated from the swatch you shared, since I don't have the exact hex for those - easy to swap in `app/globals.css` if you have them.
- Colour pairings were chosen for contrast, not just to use both brand colours everywhere: primary purple text on cream/white (very high contrast), white text on primary purple buttons (very high contrast), and the secondary green used as a light tint background with dark purple text for the Borderline badge rather than white-on-green, which tends to fail AA at normal text sizes.
- Semantic colours (amber for the mismatch warning, red for errors) were left as-is rather than remapped to brand colours, since the brand palette doesn't specify warning/error colours and repurposing an accent colour for "error" risks confusing state with brand identity.

## 2026-07-28 — Add Digital Marketing with AI course

Added a **Course** dropdown (AI Literacy / Digital Marketing with AI) above the Assignment dropdown; changing course repopulates the assignment list with that course's rubrics and resets the selection to the first one.

Added the six Digital Marketing with AI rubrics from the assignment criteria doc: Week 1 CEO Audit, Week 4 Digital Deep Dive, Week 5 Customer Personas, Week 6 Email Campaigns, Week 7 Content Plan, Week 9 More Reach.

- `Rubric` gained a `courseId` field and an optional `bandDescriptions` array. The AI Literacy rubrics still use the generic 0-4 policy bands, but the DMAI criteria define materially different pass/fail conditions per band per assignment (e.g. Week 1's band 2 is "missing Vision/Mission/Values or 2+ other headings", Week 6's band 3 is "either a 3-stage funnel campaign or a SMYKM email, each with its own specific checklist") - reusing the generic bands would have lost that fidelity, so the system prompt now uses `rubric.bandDescriptions` when present, falling back to the generic policy bands otherwise.
- IDs for the new rubrics are prefixed `dmai-` to avoid collision with the AI Literacy rubrics (both courses happen to have a "Week 1" and a "Week 5").

Spot-checked `dmai-wk1-ceo-audit` against a sample submission — correctly marked 3/4 and specifically flagged the missing paid/owned/earned classification needed for the stretch goal, confirming the assignment-specific band descriptions are actually driving the mark rather than the generic ones.

## 2026-07-28 — Initial build

Built from scratch: a small marking tool for Tech Educators' AI Literacy assignments, using Claude to mark against the four rubrics in the marking policy PDF (Week 1 evaluate-LLM-output, Week 2 SWOT, Week 3 risk appetite, Week 5 point-of-view statement).

Design decisions not specified up front, made while building:

- **Anonymisation gate**: a heuristic client-side redaction step (strips emails, "Name:"-style lines, and "Hi, I'm X" greetings) produces an editable preview. The Mark button stays disabled until the marker has run this step and ticked a confirmation checkbox. This isn't foolproof PII detection - it's a deliberate speed bump, not a guarantee - so the preview is editable before confirming.
- **Marking score**: Claude returns a decimal score (0-4, e.g. 2.6) rather than a whole number directly, plus a `topicMismatch` flag. The decimal rounds to a whole mark; scores near a band midpoint (fractional part 0.4-0.6) are flagged **Borderline** in the UI, echoing the marking policy's second-marking/moderation practice. `topicMismatch` lets the tool flag a submission that doesn't address the selected assignment at all, rather than forcing a confident (and wrong) score onto it.
- **Structured output**: uses the Anthropic SDK's `messages.parse()` with a Zod schema (`output_config.format`) rather than asking Claude to write JSON in prose, so the response always parses.
- **Model**: `claude-opus-4-8` with adaptive thinking and `effort: "high"`, since marking accuracy matters more than latency/cost here.

### Bug fixed during testing

`computeBand()` in `lib/scoring.ts` compared `rawScore - Math.floor(rawScore)` directly against `0.4`/`0.6` to detect borderline scores. JS floating-point means `2.4 - Math.floor(2.4)` isn't exactly `0.4` (it's `0.39999999999999947`), so a genuinely borderline 2.4 score silently failed the borderline check. Fixed by rounding the fraction to 1 decimal place before comparing. Found by running TESTING.md Test 5 and seeing `borderline: false` on a score that should have flagged.

### Testing

All 5 cases in TESTING.md pass against `claude-opus-4-8`: three submissions of differing quality get three different marks (4, 3, 1), a submission from the wrong assignment gets flagged as a mismatch instead of confidently marked, and a genuinely boundary-straddling submission rounds up to 3 with the Borderline badge shown.
