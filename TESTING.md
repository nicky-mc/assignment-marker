# Testing the Assignment Marker

Five test cases exercise the marking pipeline end-to-end: the assignment rubric selection, the Anthropic-backed marking call, the rounding/borderline logic, and the topic-mismatch flag.

All five use the **Week 1 — Evaluate an LLM's Output** rubric (`wk1-evaluate-llm-output`), except Test 4 which deliberately submits Week 2 content against the Week 1 rubric.

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
