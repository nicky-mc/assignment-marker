import fs from "node:fs";
import crypto from "node:crypto";

const REPO = "/path/to/assignment-marker";
const SCRATCH = new URL(".", import.meta.url).pathname;
const BASE_URL = "http://localhost:3001/api/mark";
const OUT_FILE = process.argv[2];
if (!OUT_FILE) {
  console.error("Usage: node run-ceiling-v2.mjs <output-jsonl-path>");
  process.exit(1);
}
const sha = (s) => crypto.createHash("sha256").update(s).digest("hex");

// ---- Tests 1-6 loaded straight from TESTING.md (blockquote lines only, bold markers stripped) ----
const md = fs.readFileSync(`${REPO}/TESTING.md`, "utf8");
function loadTest(n) {
  const re = new RegExp(`^## Test ${n} [^\\n]*\\n([\\s\\S]*?)(?=^## )`, "m");
  const quoted = [];
  for (const l of md.match(re)[1].split("\n")) {
    if (l.startsWith("**Expect")) break;
    if (l.startsWith(">")) quoted.push(l.replace(/^>\s?/, ""));
  }
  return quoted.join("\n").replace(/\*\*/g, "").trim();
}
const tests = Object.fromEntries([1, 2, 3, 4, 5, 6].map((n) => [n, loadTest(n)]));

// ---- existing controls (saved exact texts) ----
const ctl = (f) => fs.readFileSync(`${REPO}/testing/cases/controls/${f}.txt`, "utf8");
const existingControls = [
  { name: "C1-AIL-wk1-own-piece-present-meets", rubricId: "wk1-evaluate-llm-output", designedMark: 3 },
  { name: "C2-AIL-wk1-own-piece-present-stretch", rubricId: "wk1-evaluate-llm-output", designedMark: 4 },
  { name: "C3-DMAI-wk5-two-full-personas", rubricId: "dmai-wk5-personas", designedMark: 3 },
  { name: "C4-DMAI-wk9-five-full-posts", rubricId: "dmai-wk9-more-reach", designedMark: 3 },
].map((c) => ({ ...c, text: ctl(c.name) }));

// ---- 3 new controls from last round: same strings, taken from last round's runner source ----
const prevSrc = fs.readFileSync(`${SCRATCH}run-ceiling-verification.mjs`, "utf8");
const iN = prevSrc.indexOf("const newControls = [");
const iJ = prevSrc.indexOf("const jobs = [");
const newControls = new Function(prevSrc.slice(iN, iJ) + "; return newControls;")();

// ---- round-up checks (saved exact texts from the 41-case set) ----
const setDir = `${REPO}/testing/cases/set41`;
const setFile = (suffix) => fs.readdirSync(setDir).find((f) => f.endsWith(suffix));
const roundUps = [
  { name: "WK1-Band3", rubricId: "di-wk1-notion-page", baselineMark: 3, presenceRunMark: 3, file: setFile("__WK1-Band3.txt") },
  { name: "WK3-Band3", rubricId: "di-wk3-ai-research-presentation", baselineMark: 3, presenceRunMark: 4, file: setFile("__WK3-Band3.txt") },
  { name: "WK4-Band3", rubricId: "di-wk4-notebooklm-vs-gems", baselineMark: 3, presenceRunMark: 3, file: setFile("__WK4-Band3.txt") },
].map((c) => ({ ...c, text: fs.readFileSync(`${setDir}/${c.file}`, "utf8") }));

const jobs = [
  ...[1, 2, 3, 4, 5].map((i) => ({ stage: "1-test6", name: `Test6-run${i}`, rubricId: "wk1-evaluate-llm-output", text: tests[6] })),
  ...existingControls.map((c) => ({ stage: "2-existing-control", ...c })),
  ...newControls.map((c) => ({ stage: "3-new-control", ...c })),
  { stage: "4-testing-md", name: "Test1-strong", rubricId: "wk1-evaluate-llm-output", baselineMark: 4, text: tests[1] },
  { stage: "4-testing-md", name: "Test2-meets", rubricId: "wk1-evaluate-llm-output", baselineMark: 3, text: tests[2] },
  { stage: "4-testing-md", name: "Test3-thin", rubricId: "wk1-evaluate-llm-output", baselineMark: 1, text: tests[3] },
  { stage: "4-testing-md", name: "Test4-mismatch", rubricId: "wk1-evaluate-llm-output", baselineMark: 0, text: tests[4] },
  { stage: "4-testing-md", name: "Test5-borderline", rubricId: "wk1-evaluate-llm-output", baselineMark: 3, text: tests[5] },
  ...roundUps.map((c) => ({ stage: "5-round-up", ...c })),
];

if (process.env.DRY === "1") {
  const prev = fs.readFileSync(`${SCRATCH}ceiling-verification.jsonl`, "utf8").trim().split("\n").map(JSON.parse);
  const prevSha = new Map(prev.map((r) => [r.name, r.sha256]));
  process.stderr.write(`DRY RUN: ${jobs.length} jobs\n`);
  let same = 0, diff = [], fresh = [];
  for (const j of jobs) {
    if (!prevSha.has(j.name)) { fresh.push(j.name); continue; }
    if (prevSha.get(j.name) === sha(j.text)) same++; else diff.push(j.name);
  }
  process.stderr.write(`DRY RUN: texts byte-identical to last round: ${same}; different: ${diff.join(",") || "none"}; not used last round: ${fresh.join(",")}\n`);
  process.exit(0);
}

process.stderr.write(`Total jobs: ${jobs.length}\n`);
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
      process.stderr.write(`  mark=${data.mark} raw=${data.rawScore} capped=${data.capped} ceilingBand=${data.ceilingBand} boundaryCase=${data.boundaryCase} mismatch=${data.topicMismatch} (${record.ms}ms)\n`);
    }
  } catch (err) {
    failed = true;
    record = { ...job, sha256: sha(job.text), startedAt: startedAt.toISOString(), endedAt: new Date().toISOString(), error: String(err) };
    process.stderr.write(`  EXCEPTION: ${err}\n`);
  }
  fs.appendFileSync(OUT_FILE, JSON.stringify(record) + "\n");
  if (failed) {
    process.stderr.write("STOPPED: first API error, not retrying.\n");
    process.exit(2);
  }
}
process.stderr.write("DONE\n");
