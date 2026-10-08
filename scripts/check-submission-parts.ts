// Checks how a submission is put together from several labelled parts and links, and how quotes are traced back to
// their part. Fictional fixtures only. No network, no Anthropic API calls.   npx tsx scripts/check-submission-parts.ts
import { readFileSync } from "node:fs";
import { anonymise } from "../lib/anonymise";
import { extractTextFromFile } from "../lib/extractText";
import { assembleSubmission, cleanLabel, defaultLabelFromFileName, linkKind, parseSubmission, tagQuoteSources, type SubmissionPart } from "../lib/submissionParts";

let failed = 0;
const check = (label: string, ok: boolean, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : `  ${detail}`}`);
  if (!ok) failed++;
};
const has = (t: string, s: string) => t.includes(s);

const load = (dir: string, name: string) => new File([readFileSync(`testing/fixtures/${dir}/${name}`)], name);

// What the marking form does with one dropped file: a failed file is kept (with the reason) but is not a part.
async function read(file: File): Promise<{ part?: SubmissionPart; error?: string }> {
  try {
    const { text } = await extractTextFromFile(file);
    return { part: { label: defaultLabelFromFileName(file.name), fileName: file.name, text } };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "failed" };
  }
}

async function main() {
  const plan = await read(load("parts", "Jane-Doe_plan.txt"));
  const reflection = await read(load("parts", "Jane-Doe_reflection.md"));
  const budget = await read(load("", "Jane-Doe_budget.xlsx"));
  const empty = await read(load("parts", "Jane-Doe_empty.txt"));
  const opts = { names: ["Jane", "Doe"], terms: [] };
  const named = (p: SubmissionPart | undefined, label: string) => ({ ...p!, label });

  // 1. A single file or pasted text and no links: exactly as before, no headers.
  const one = assembleSubmission([plan.part!], [], opts);
  check("single file, no links: identical to anonymising its text", one.text === anonymise(plan.part!.text, opts).text);
  check("single file, no links: no part headers", !has(one.text, "=== "));
  const pasted = assembleSubmission([{ label: "Pasted text", text: "Hello Jane Doe" }], [], opts);
  check("single pasted text, no links: unchanged", pasted.text === anonymise("Hello Jane Doe", opts).text && !has(pasted.text, "==="));
  check("single case counts match anonymise()", one.redactionCount === anonymise(plan.part!.text, opts).redactionCount);

  // 2. Three parts.
  const parts = [named(plan.part, "Event plan"), named(budget.part, "Budget"), named(reflection.part, "Reflection")];
  const links = [
    { label: "Prototype", url: "https://www.notion.so/secret-workspace-123abc" },
    { label: "Poster", url: "https://www.canva.com/design/DAFxyz/edit" },
    { label: "Not a link", url: "banana" },
  ];
  const three = assembleSubmission(parts, links, opts);
  const t = three.text;
  check("three parts: numbered headers with labels", has(t, "=== PART 1: Event plan (plan.txt) ===") && has(t, "=== PART 2: Budget (budget.xlsx) ===") && has(t, "=== PART 3: Reflection (reflection.md) ==="), t.slice(0, 200));
  check("file names lose the part before the underscore", !has(t, "Jane-Doe_") && !has(t, "Doe_"));
  check("each part's text is under its own header", t.indexOf("=== PART 2") < t.indexOf("=Variance") || t.indexOf("=== PART 2") < t.indexOf("[Variance]"));
  check("per-part anonymisation: email and phone in part 1 removed", !has(t, "jane.doe@example.com") && !has(t, "07700 900123") && has(t, "[EMAIL]") && has(t, "[PHONE]"));
  check("confirmed names removed in every part (part 3 has Jane's)", !/Jane/.test(t.split("=== PART 3")[1]) && has(t.split("=== PART 3")[1], "[NAME] first budget"));
  check("counts are summed across parts", three.counts.email === 1 && three.counts.phone === 1 && three.counts.name >= 2, JSON.stringify(three.counts));
  check("links section lists label and kind", has(t, "=== LINKS (not opened by AssisTED) ===") && has(t, "- Prototype (Notion)") && has(t, "- Poster (Canva)"));
  check("an invalid link is left out", !has(t, "Not a link"));
  check("the URL is never in the assembled text", !has(t, "secret-workspace") && !has(t, "notion.so") && !has(t, "canva.com") && !has(t, "http"));
  check("link kinds", linkKind("https://docs.google.com/document/d/1/edit") === "Google Doc" && linkKind("https://docs.google.com/spreadsheets/d/1") === "Google Sheet" && linkKind("https://x.notion.site/a") === "Notion" && linkKind("https://example.org") === "other website" && linkKind("javascript:alert(1)") === null && linkKind("not a url") === null);

  // 3. A failed file stays visible with the reason and is not part of the submission.
  check("an empty file fails with a reason", !!empty.error && !empty.part, String(empty.error));
  const xlsm = await read(new File(["x"], "book.xlsm"));
  check("an .xlsm file fails with a plain reason", !!xlsm.error && has(xlsm.error, ".xlsx or .csv"), String(xlsm.error));
  const withFailed = assembleSubmission([plan.part!, reflection.part!].map((p, i) => named(p, ["Event plan", "Reflection"][i])), [], opts);
  check("failed files add nothing to the assembled text", has(withFailed.text, "=== PART 2: Reflection") && !has(withFailed.text, "PART 3"));

  // 4. Labels cannot imitate headers or run on.
  check("a label cannot imitate a header", !has(cleanLabel("x\n=== PART 9: fake ==="), "==="));
  check("a long label is limited", cleanLabel("a".repeat(200)).length === 60);

  // 5. Reading it back, and tracing quotes to parts.
  const back = parseSubmission(t);
  check("parseSubmission finds the three parts with their labels", back.parts.map((p) => p.label).join("|") === "Event plan|Budget|Reflection", back.parts.map((p) => p.label).join("|"));
  check("parseSubmission finds the links", back.links.length === 2 && back.links[0].kind === "Notion" && back.links[0].label === "Prototype");
  const spoof = assembleSubmission([{ label: "A", text: "=== PART 2: Fake ===\nbody" }, { label: "B", text: "second" }], [], opts);
  check("a fake header inside a file is not read as a part", parseSubmission(spoof.text).parts.length === 2, parseSubmission(spoof.text).parts.map((p) => p.label).join("|"));

  const banded = {
    mark: 3,
    presenceEvidence: [
      { criterion: "a", level: "required", quote: "Catering cost more than planned", met: true },
      { criterion: "b", level: "required", quote: "main aim is to get 40 sign-ups", met: true },
      { criterion: "c", level: "stretch", quote: null, met: false },
    ],
    markerNotes: {
      rationale: "r",
      explanationEvidence: { type: "quote", text: "[Variance] =B2-C2 (value: 50)" },
      nextStepNotes: [{ evidence: { type: "absence", text: "nothing" }, why: "w" }, { evidence: { type: "quote", text: "ask for quotes earlier" }, why: "w" }],
    },
  };
  const tagged = tagQuoteSources(structuredClone(banded), t) as typeof banded & { links?: unknown[] };
  check("banded: each quote gets the label of its part", tagged.presenceEvidence[0].quote !== null && (tagged.presenceEvidence[0] as { from?: string }).from === "Reflection" && (tagged.presenceEvidence[1] as { from?: string }).from === "Event plan");
  check("banded: markerNotes evidence is labelled, absences are not", (tagged.markerNotes.explanationEvidence as { from?: string }).from === "Budget" && (tagged.markerNotes.nextStepNotes[0].evidence as { from?: string }).from === undefined && (tagged.markerNotes.nextStepNotes[1].evidence as { from?: string }).from === "Reflection");
  check("links are added for the marker", tagged.links?.length === 2);
  const complete = { outcome: "complete", checklist: [{ item: "i", status: "met", quote: "Next time I would ask for quotes earlier", quoteNotFound: false }], markerNotes: { evidence: { type: "quote", text: "event for first-year students" }, nextStepNotes: [] } };
  const tc = tagQuoteSources(structuredClone(complete), t) as typeof complete;
  check("complete: checklist quotes and evidence are labelled", (tc.checklist[0] as { from?: string }).from === "Reflection" && (tc.markerNotes.evidence as { from?: string }).from === "Event plan");
  const untouched = structuredClone(banded);
  check("single unlabelled submission: outcome is not changed at all", JSON.stringify(tagQuoteSources(untouched, one.text)) === JSON.stringify(banded));

  console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
  process.exit(failed ? 1 : 0);
}
main();
