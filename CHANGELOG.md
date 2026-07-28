# Changelog

## 2026-07-28 — Preview textarea + draft-grade reminder

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
