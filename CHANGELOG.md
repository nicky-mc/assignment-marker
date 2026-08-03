# Changelog

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
