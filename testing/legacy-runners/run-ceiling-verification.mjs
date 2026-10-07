import fs from "node:fs";
import crypto from "node:crypto";

const REPO = "/path/to/assignment-marker";
const BASE_URL = "http://localhost:3001/api/mark";
const OUT_FILE = process.argv[2];
if (!OUT_FILE) {
  console.error("Usage: node run-ceiling-verification.mjs <output-jsonl-path>");
  process.exit(1);
}
const sha = (s) => crypto.createHash("sha256").update(s).digest("hex");

// ---- load Tests 1-6 straight from the updated TESTING.md (blockquote lines only, bold markers stripped) ----
const md = fs.readFileSync(`${REPO}/TESTING.md`, "utf8");
function loadTest(n) {
  const re = new RegExp(`^## Test ${n} [^\\n]*\\n([\\s\\S]*?)(?=^## )`, "m");
  const section = md.match(re)[1];
  const lines = section.split("\n");
  const quoted = [];
  for (const l of lines) {
    if (l.startsWith("**Expect")) break;
    if (l.startsWith(">")) quoted.push(l.replace(/^>\s?/, ""));
  }
  return quoted.join("\n").replace(/\*\*/g, "").trim();
}
const tests = Object.fromEntries([1, 2, 3, 4, 5, 6].map((n) => [n, loadTest(n)]));

// ---- existing controls, loaded from the saved exact texts ----
const ctl = (file) => fs.readFileSync(`${REPO}/testing/cases/controls/${file}`, "utf8");
const existingControls = [
  { name: "C1-AIL-wk1-own-piece-present-meets", rubricId: "wk1-evaluate-llm-output", designedMark: 3, text: ctl("C1-AIL-wk1-own-piece-present-meets.txt") },
  { name: "C2-AIL-wk1-own-piece-present-stretch", rubricId: "wk1-evaluate-llm-output", designedMark: 4, text: ctl("C2-AIL-wk1-own-piece-present-stretch.txt") },
  { name: "C3-DMAI-wk5-two-full-personas", rubricId: "dmai-wk5-personas", designedMark: 3, text: ctl("C3-DMAI-wk5-two-full-personas.txt") },
  { name: "C4-DMAI-wk9-five-full-posts", rubricId: "dmai-wk9-more-reach", designedMark: 3, text: ctl("C4-DMAI-wk9-five-full-posts.txt") },
];

// ---- 3 new controls: own writing IS present but unusual ----
const newControls = [
  {
    name: "N1-AIL-wk1-own-piece-very-short",
    rubricId: "wk1-evaluate-llm-output",
    designedMark: 3,
    note: "Own piece is present but very short (about 22 words). LLM output and a 50-100 word evaluation present.",
    text: `What I wrote (my own words, no AI): "Tuesday's stock count was off by forty units. I rechecked bay 3, found a mislabelled pallet, and fixed the record before lunch."

The prompt I gave the LLM: "Write a short first-person note about a stock count that was off by forty units and how I fixed it."

The LLM's version: "During Tuesday's stock count we identified a discrepancy of forty units. After a thorough review of bay 3, I located a mislabelled pallet and promptly corrected the inventory record, ensuring accuracy before the end of the morning."

My evaluation: "The LLM version sounds more polished and a bit more formal, with phrases like "promptly corrected" and "ensuring accuracy" that I would never say out loud. Mine is blunter but easier to follow because it just says what happened. I think mine reads as more obviously human, and the AI version reads like a line from a report. Neither is hard to read, but mine is more engaging for a quick update."`,
  },
  {
    name: "N2-AIL-wk1-own-piece-labelled-Draft-1",
    rubricId: "wk1-evaluate-llm-output",
    designedMark: 3,
    note: "Own piece is labelled 'Draft 1' and the LLM output 'Draft 2'; neither is called 'my own writing'.",
    text: `Draft 1 (written by me before I used any AI):

"Welcome to the team, Priya. Your desk is by the window on the second floor, next to Marcus, who will show you the ropes this week. Your laptop and login details are in the envelope on the chair. Please join the 10am stand-up in the blue room tomorrow, and don't worry about knowing everything yet. We all asked a lot of questions in our first month. Come and find me if anything is unclear."

Draft 2 (the LLM's version, from the prompt "Write a warm welcome message to a new starter called Priya, about 80 words, mentioning her desk, laptop and the morning stand-up"):

"Welcome aboard, Priya! We are thrilled to have you join our team. Your desk is located on the second floor by the window, and your laptop and login credentials are waiting for you. Tomorrow at 10am, please join our stand-up in the blue room to meet everyone. Do not hesitate to ask questions; we are all here to support you as you settle in."

Evaluation of Draft 1 against Draft 2: Draft 2 is more upbeat and tidier, but it feels generic, and "thrilled" and "credentials" are not words anyone here would use. Draft 1 is warmer in a plain way, because it names Marcus and tells her not to worry. Draft 2 reads like AI to me, mostly because of the exclamation mark and the "do not hesitate" line. Draft 1 reads like a real colleague wrote it.`,
  },
  {
    name: "N3-AIL-wk1-own-piece-embedded-mid-submission",
    rubricId: "wk1-evaluate-llm-output",
    designedMark: 3,
    note: "Own piece is embedded in the middle of a narrative paragraph, with the LLM output and the evaluation in the same block of text.",
    text: `For this task I picked something I actually had to do last week at work, which was telling the night shift about a change to the cleaning rota. I'm a shift supervisor at a warehouse, so I tend to write things quickly on my phone. Here is what I sent, exactly as I typed it, before I'd tried any AI: "Night shift, from Monday the cleaning rota changes. Bay 1 and 2 are now done by whoever finishes first, not the same two people each time. Check the new sheet by the door. Any problems, speak to me before you start, not after. Cheers." After that I asked an LLM for its own version of the same message, and it gave me this: "Dear Night Shift Team, please be advised that effective Monday, the cleaning rota will be revised. Bays 1 and 2 will be cleaned on a rotating basis by the first available team members. The updated rota is displayed by the door. Should you have any concerns, please raise them with me before commencing your shift. Thank you for your cooperation." Comparing them, the AI version is more formal and complete, but it sounds like a notice from head office, and the night shift would probably ignore it. Mine is blunter and sounds like me. I think mine reads as clearly human, and the AI one reads as a template. It is better for a quick instruction, and worse for anything that needs to feel official.`,
  },
];

const jobs = [
  ...[1, 2, 3, 4, 5].map((i) => ({ stage: "1-test6", name: `Test6-run${i}`, rubricId: "wk1-evaluate-llm-output", text: tests[6] })),
  ...existingControls.map((c) => ({ stage: "2-existing-control", ...c })),
  ...newControls.map((c) => ({ stage: "3-new-control", ...c })),
  { stage: "4-testing-md", name: "Test1-strong", rubricId: "wk1-evaluate-llm-output", text: tests[1] },
  { stage: "4-testing-md", name: "Test2-meets", rubricId: "wk1-evaluate-llm-output", text: tests[2] },
  { stage: "4-testing-md", name: "Test3-thin", rubricId: "wk1-evaluate-llm-output", text: tests[3] },
  { stage: "4-testing-md", name: "Test4-mismatch", rubricId: "wk1-evaluate-llm-output", text: tests[4] },
  { stage: "4-testing-md", name: "Test5-borderline", rubricId: "wk1-evaluate-llm-output", text: tests[5] },
];

process.stderr.write(`Total jobs: ${jobs.length}\n`);
for (const j of jobs) process.stderr.write(`  ${j.stage}/${j.name} (${j.text.length} chars, sha ${sha(j.text).slice(0, 10)})\n`);

for (const job of jobs) {
  process.stderr.write(`Running: ${job.stage}/${job.name}...\n`);
  const startedAt = new Date();
  let record;
  let failed = false;
  try {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rubricId: job.rubricId, anonymisedSubmission: job.text }),
    });
    const data = await res.json();
    const endedAt = new Date();
    const base = { ...job, sha256: sha(job.text), startedAt: startedAt.toISOString(), endedAt: endedAt.toISOString(), ms: endedAt - startedAt };
    if (!res.ok || data.error) {
      failed = true;
      record = { ...base, error: data.error ?? `HTTP ${res.status}`, httpStatus: res.status };
      process.stderr.write(`  ERROR: ${record.error}\n`);
    } else {
      record = { ...base, outcome: data };
      process.stderr.write(
        `  mark=${data.mark} raw=${data.rawScore} ceilingBand=${data.ceilingBand} capped=${data.capped} boundaryCase=${data.boundaryCase} borderline=${data.borderline} mismatch=${data.topicMismatch} (${record.ms}ms)\n`,
      );
    }
  } catch (err) {
    failed = true;
    const endedAt = new Date();
    record = { ...job, sha256: sha(job.text), startedAt: startedAt.toISOString(), endedAt: endedAt.toISOString(), error: String(err) };
    process.stderr.write(`  EXCEPTION: ${err}\n`);
  }
  fs.appendFileSync(OUT_FILE, JSON.stringify(record) + "\n");
  if (failed) {
    process.stderr.write("STOPPED: first API error, not retrying.\n");
    process.exit(2);
  }
}
process.stderr.write("DONE\n");
