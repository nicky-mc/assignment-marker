# Testing the Assignment Marker

Six test cases exercise the marking pipeline end-to-end: the assignment rubric selection, the Anthropic-backed marking call, the rounding/borderline logic, the topic-mismatch flag, and (Test 6) the presence-evidence check that requires a quote for criteria that need a specific artefact to exist.

All six use the **Week 1 — Evaluate an LLM's Output** rubric (`wk1-evaluate-llm-output`), except Test 4 which deliberately submits Week 2 content against the Week 1 rubric.

Run each either through the UI (paste the submission, click Anonymise, tick the confirmation, click Mark) or directly against the API:

```bash
curl -s http://localhost:3000/api/mark \
  -H "Content-Type: application/json" \
  -d '{"rubricId": "wk1-evaluate-llm-output", "anonymisedSubmission": "<submission text>"}' | jq
```

## Test 1 — strong submission (expect mark 4, stretch goal achieved)

> I wrote about how I'd tell a customer their order was delayed. My version was short and apologetic but a bit robotic. I then asked an LLM to write the same update.
>
> The LLM's version was more polished and structured, with a clear apology, reason, and next steps. It read as more professional but slightly generic — mine felt more personal even though it was rougher. Neither reads as obviously AI-written once trimmed down, but the LLM's version leans on some stock phrases ("we sincerely apologise for any inconvenience") that mine didn't have.
>
> To improve the AI output, I'd prompt it to avoid stock apology phrases and to mention the specific delay reason up front rather than at the end. I already tried a follow-up prompt asking it to "sound like a person messaging a colleague, not a corporate template" and the result was noticeably better — shorter sentences, no stock phrases, and it kept the useful structure.

**Expect:** mark 4/4, no mismatch, no borderline badge.

## Test 2 — meets requirements only (expect mark 3, no stretch)

> I wrote a short paragraph explaining a price increase to a client. It was blunt and a bit terse. I then asked an LLM to write the same explanation.
>
> The LLM version was easier to read and more engaging — it used a friendlier tone and better structure with a clear opening and closing line. Mine felt more like an internal note than something meant for a client. The LLM's version reads more like something a human customer service rep would send, while mine reads more like a quick Slack message. Neither felt obviously AI-generated to me.

**Expect:** mark 3/4 (meets the 50-100 word evaluation requirement, addresses the comparison questions, but gives no next steps to improve the AI output — so the stretch goal isn't met). No mismatch, no borderline badge.

## Test 3 — thin submission (expect a low mark, e.g. 1/4)

> I wrote something and the AI also wrote something. The AI one was better I think. It sounded fine. Not much else to say really, they were both okay.

**Expect:** mark 1/4 (attempted, but doesn't show understanding — no real comparison of readability/engagement/human-vs-AI, no evidence of critical evaluation). No mismatch, no borderline badge.

## Test 4 — topic mismatch (expect the mismatch flag, not a confident mark)

Marked against the **Week 1** rubric, but the content is actually a Week 2 SWOT analysis:

> **Strengths:** We already have a data protection policy and staff are aware of GDPR basics.
>
> **Weaknesses:** We haven't considered copyright risk in AI-generated marketing images, and there's no policy on checking AI output for defamatory claims before publishing.
>
> **Opportunities:** Getting ahead of the EU AI Act now would let us market ourselves as a compliant, trustworthy AI user to enterprise clients.
>
> **Threats:** If an AI tool trained on scraped data produces content that infringes someone's copyright, we could be liable even though we didn't write it ourselves.

**Expect:** `topicMismatch: true`, with a mismatch reason explaining this looks like a SWOT analysis rather than an evaluation of LLM-written content. No confident mark should be forced.

## Test 5 — borderline (expect it to round up to 3 with the borderline badge)

> I wrote a couple of sentences about announcing a new feature to users, then had an LLM write something similar. The LLM version read more smoothly, using shorter sentences than mine. Beyond that I didn't really compare them properly - I think mine sounded a bit more human because it had an odd turn of phrase in it, but I'm not fully sure that's a fair way to judge it. Both were fine overall, and I'd probably use the AI one as a starting point.

**Expect:** this touches on readability and the human-vs-AI question but stays surface-level and self-admits it isn't a full comparison — genuinely arguable between "incomplete but shows understanding" (2) and "meets expectations" (3). Expect a raw score around 2.5–2.6, which rounds up to **mark 3/4** with the **Borderline** badge shown.

## Test 6 — missing the comparison artefact (expect the comparison criterion marked unmet, mark around 2/4)

Added after a real case (a genuine learner submission) got 4/4 from the model, which stated the learner had produced a comparison, when in fact the learner had only written a prompt and evaluated the AI's response to it — no standalone human-authored piece existed anywhere in the submission for a like-for-like comparison. A human marker correctly caught this and scored it 2/4. This test reproduces that shape synthetically: a well-written prompt, a critique of the AI's output, and reflective commentary, but no standalone piece the learner wrote themselves on the same subject.

> I wanted the LLM to help me draft a client update on a project delay for my role. My prompt was: "Write a short, professional but warm email update to a client whose project is now two weeks behind schedule. Explain the reason (a supplier delay on materials), apologise appropriately, and reassure them about the revised delivery date without over-promising."
>
> The LLM's response was a well-structured email: it opened with a clear apology, explained the supplier delay in one sentence, gave a firm revised date, and closed with a reassurance about quality not being compromised. It used a slightly more formal tone than I'd normally use with this particular client, and it included a generic "we value your business" line that felt a bit corporate for them.
>
> Critique: the structure was strong and the reason for the delay was clear, but the tone didn't quite match how I actually talk to this client, who I've worked with for years and who prefers a more casual, direct style. I'd want to strip out the corporate closing line and shorten a couple of the sentences.
>
> Reflection: this showed me that even a fairly specific prompt still needs a tone/audience note to really land right. Next time I'll add a line like "keep the tone casual, like emailing a long-term contact" rather than assuming the model will infer that from context.

**Expect:** the model's `presenceEvidence` marks the "learner's own standalone written piece" criterion as `met: false` (with `quote: null`, since no such piece exists anywhere in the text), and the overall mark reflects that this criterion isn't satisfied regardless of how strong the prompt-writing, critique and reflection are elsewhere — landing around **2/4**, matching the human marker's judgement on the real case this is modelled on. No mismatch (the submission is clearly attempting this assignment's general shape, just missing one required artefact).

## Recording results

Run 2026-07-28, against `claude-opus-4-8`:

| Test | Expected | Actual mark | Actual raw score | Borderline? | Mismatch? |
|------|----------|--------------|-------------------|--------------|-----------|
| 1    | 4        | 4            | 4.0               | no           | no        |
| 2    | 3        | 3            | 3.0               | no           | no        |
| 3    | 1 (low)  | 1            | 1.0               | no           | no        |
| 4    | mismatch | -            | 0.0               | no           | **yes**   |
| 5    | 3 (borderline) | 3      | 2.6               | **yes**      | no        |

All five pass: Tests 1–3 got different marks (4, 3, 1), Test 4 was flagged as a mismatch rather than confidently marked, and Test 5 rounded up to 3 with the borderline badge shown.

Since marking runs through a live LLM call, exact raw scores can vary slightly between runs — the pass/fail criteria are the pattern above (Tests 1–3 differ, Test 4 flags, Test 5 borderline-rounds-to-3), not the exact decimal.

**Note on Test 5:** getting the model to reliably output a genuinely boundary-straddling decimal score (rather than confidently committing to a whole number) took several attempts at wording the fixture, and surfaced a real bug in [lib/scoring.ts](lib/scoring.ts): `2.4 - Math.floor(2.4)` isn't exactly `0.4` in JS floating-point arithmetic, so the borderline check was silently failing. Fixed by rounding the fraction to 1 decimal place before comparing.

**Status on Test 6 (presence-evidence fix, added 2026-09-17): not yet verified.** The `presenceEvidence` mechanism in `lib/marking.ts` correctly detected the missing artefact on the first run (`met: false`, `quote: null` for the learner's own written piece) but the score still came back 4/4 - the reasoning treated the gap as a minor boundary nuance rather than a hard ceiling. Strengthened the `bandReasoning` and system-prompt wording to make the ceiling explicit (a submission cannot reach meets-expectations or above if a required presence-based criterion is unmet). That change is untested: the re-run hit an Anthropic API billing error (credit balance too low) before a result came back, and Tests 1-5 haven't been re-checked against this final wording either. Do not treat Test 6, or the `max_tokens` increase from 2000 to 4000 that came with it, as verified until both have actually been run.
