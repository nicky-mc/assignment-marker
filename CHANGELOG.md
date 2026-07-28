# Changelog

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
