// Checks the complete / not complete marking path.
//   npx tsx scripts/check-marking-complete.ts              offline checks of the code that derives the outcome. No API calls.
//   LIVE=1 npx tsx --env-file=<env file> scripts/check-marking-complete.ts    also marks the four fictional cases (4 API calls).
import { readFileSync } from "node:fs";
import { deriveOutcome, markComplete, quoteIsInSubmission, type CompleteResult } from "../lib/markingComplete";
import type { Rubric } from "../lib/rubrics";

let failed = 0;
const check = (label: string, ok: boolean, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : `  ${detail}`}`);
  if (!ok) failed++;
};

const CHECKLIST = [
  "Names the target user",
  "Describes the problem in at least two sentences",
  "Lists at least three features",
  "Explains why one feature was prioritised",
  "The linked prototype has a working sign-in screen",
];

const rubric: Rubric = {
  id: "build-wk1-product-brief",
  courseId: "build",
  week: "Week 1",
  title: "Write a Product Brief",
  overview: "The learner writes a short brief for a product idea and links to a prototype.",
  requirements: "A brief that names who the product is for, the problem it solves, its main features and the reasoning behind the first feature, with a link to a prototype.",
  stretchGoal: "",
  gradingMode: "complete",
  checklist: CHECKLIST,
};

type Ev = CompleteResult["checklistEvidence"][number];
const ev = (item: string, o: Partial<Ev> = {}): Ev => ({ item, cannotVerify: false, quote: null, met: false, ...o });

function offline() {
  const sub = "Who it is for:   StudyBuddy is for FIRST-year students.\nThe problem: they lose track of plans.";
  check("a quote matches ignoring case and whitespace", quoteIsInSubmission("studybuddy is for first-year   students", sub));
  check("a made-up quote does not match", !quoteIsInSubmission("StudyBuddy is for teachers", sub));
  check("a null or empty quote does not match", !quoteIsInSubmission(null, sub) && !quoteIsInSubmission("  ", sub));
  check("curly and straight quotes match", quoteIsInSubmission("it’s here", "It's here"));

  const two = ["A", "B"];
  const all = deriveOutcome(two, [ev("A", { met: true, quote: "alpha" }), ev("B", { met: true, quote: "beta" })], "alpha beta");
  check("all met with real quotes is complete", all.outcome === "complete" && all.checklist.every((l) => l.status === "met"));

  const fake = deriveOutcome(two, [ev("A", { met: true, quote: "alpha" }), ev("B", { met: true, quote: "gamma" })], "alpha beta");
  check("a met claim whose quote is not in the text is not met", fake.outcome === "not_complete" && fake.checklist[1].status === "not_met" && fake.checklist[1].quoteNotFound && fake.checklist[1].quote === null);

  const noQuote = deriveOutcome(two, [ev("A", { met: true, quote: "alpha" }), ev("B", { met: true, quote: null })], "alpha beta");
  check("met with no quote is not met", noQuote.outcome === "not_complete");

  const cv = deriveOutcome(two, [ev("A", { met: true, quote: "alpha" }), ev("B", { cannotVerify: true })], "alpha beta");
  check("an unverifiable item never causes not_complete", cv.outcome === "complete" && cv.needsMarkerCheck.join() === "B");

  const cvMissing = deriveOutcome(two, [ev("A"), ev("B", { cannotVerify: true })], "alpha beta");
  check("an unverifiable item does not rescue a missing one", cvMissing.outcome === "not_complete" && cvMissing.needsMarkerCheck.join() === "B");

  const allCv = deriveOutcome(two, [ev("A", { cannotVerify: true }), ev("B", { cannotVerify: true })], "alpha beta");
  check("nothing verifiable is not_complete, with every item listed for the marker", allCv.outcome === "not_complete" && allCv.needsMarkerCheck.length === 2);

  const swapped = deriveOutcome(two, [ev("B", { met: true, quote: "beta" }), ev("A", { met: true, quote: "alpha" })], "alpha beta");
  check("entries are matched by item text, not position", swapped.outcome === "complete");

  const missingEntry = deriveOutcome(two, [ev("A", { met: true, quote: "alpha" })], "alpha beta");
  check("a checklist line the model did not return is not met", missingEntry.outcome === "not_complete" && missingEntry.checklist[1].status === "not_met");

  const renamed = deriveOutcome(two, [ev("a (reworded)", { met: true, quote: "alpha" }), ev("b (reworded)", { met: true, quote: "beta" })], "alpha beta");
  check("same number of entries with reworded items falls back to position, using the rubric's own text", renamed.outcome === "complete" && renamed.checklist[0].item === "A");
}

async function live() {
  const cases: { file: string; label: string; expect: string }[] = [
    { file: "1-complete.txt", label: "complete", expect: "complete" },
    { file: "2-one-item-missing.txt", label: "one item missing", expect: "not_complete" },
    { file: "3-vague.txt", label: "vague", expect: "not_complete" },
    { file: "4-off-topic.txt", label: "off-topic", expect: "mismatch" },
  ];
  for (const c of cases) {
    const text = readFileSync(`testing/fixtures/complete/${c.file}`, "utf8");
    const r = await markComplete(rubric, text);
    const got = r.topicMismatch ? "mismatch" : r.outcome;
    check(`live: ${c.label} -> ${c.expect}`, got === c.expect, `got ${got}`);
    console.log(
      `      outcome=${r.outcome} topicMismatch=${r.topicMismatch} items=${r.checklist.map((l) => (l.status === "met" ? "Y" : l.status === "not_met" ? (l.quoteNotFound ? "x(quote not found)" : "N") : "?")).join("")} needsMarkerCheck=${r.needsMarkerCheck.length}`,
    );
  }
}

async function main() {
  offline();
  if (process.env.LIVE === "1") await live();
  console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
  process.exit(failed ? 1 : 0);
}
main();
