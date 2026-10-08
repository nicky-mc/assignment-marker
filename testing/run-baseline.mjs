// EPA baseline runner. Measurement tooling only: it posts saved texts to /api/mark and records what comes back.
// Adapted from testing/legacy-runners/run-ceiling-v2.mjs (same request shape and output fields).
//
//   DRY=1 node testing/run-baseline.mjs                       lists the 53 jobs, loads every text, prints id, words and SHA-256. No API calls.
//   LIMIT=1 node testing/run-baseline.mjs <out.jsonl> <server.log>        runs only the first job
//   SKIP=1 node testing/run-baseline.mjs <out.jsonl> <server.log>         runs the rest (skips jobs already done)
//
// <server.log> is the file the dev server's output is redirected to. The API response carries no token counts or stop
// reason, so those are read from the server's usage line ("[marking] ... stop_reason= input_tokens= cache_creation_input_tokens= cache_read_input_tokens= output_tokens=").
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const CASES = `${REPO}/testing/cases`;
const BASE_URL = "http://localhost:3001/api/mark";
const sha = (s) => crypto.createHash("sha256").update(s).digest("hex");
const words = (s) => (s.trim() ? s.trim().split(/\s+/).length : 0);

// Designed band or mark where known: Test 1 to 5 from the earlier reports, DI Band files from their names, controls from v2, Test 6 is 2.
const TEST_DESIGNED = { "01": 4, "02": 3, "03": 1, "04": 0, "05": 3 };
const CONTROL_DESIGNED = { C1: 3, C2: 4, C3: 3, C4: 3, N1: 3, N2: 3, N3: 3 };

const index = JSON.parse(fs.readFileSync(`${CASES}/index.json`, "utf8"));
const set41 = index.filter((e) => e.stage === "4-set41");
const test6 = index.find((e) => e.stage === "1-test6");
const controls = index.filter((e) => e.stage === "2-control");

const load = (e) => {
  const file = `${CASES}/${e.file}`;
  if (!fs.existsSync(file)) throw new Error(`MISSING text file: ${e.file}`);
  return fs.readFileSync(file, "utf8");
};

const jobs = [
  ...[1, 2, 3, 4, 5].map((i) => ({ stage: "1-test6", id: `Test6-run${i}`, designed: 2, rubricId: test6.rubricId, e: test6 })),
  ...set41.map((e) => {
    const prefix = e.file.split("/")[1].slice(0, 2);
    const band = /Band(\d)/.exec(e.name)?.[1];
    return { stage: "4-set41", id: e.file.replace(/^set41\//, "").replace(/\.txt$/, ""), designed: e.group === "testing-md" ? TEST_DESIGNED[prefix] : band ? Number(band) : null, rubricId: e.rubricId, e };
  }),
  ...controls.map((e) => ({ stage: "2-control", id: e.name.split("-")[0] + "-" + e.name.split("-").slice(1).join("-"), designed: CONTROL_DESIGNED[e.name.split("-")[0]] ?? null, rubricId: e.rubricId, e })),
].map((j) => ({ ...j, text: load(j.e), indexSha: j.e.sha256, e: undefined }));

if (jobs.length !== 53) throw new Error(`Expected 53 jobs, found ${jobs.length}`);

if (process.env.DRY === "1") {
  let bad = 0;
  for (const [i, j] of jobs.entries()) {
    const match = j.indexSha ? (sha(j.text) === j.indexSha ? "index-hash-ok" : "INDEX-HASH-MISMATCH") : "no-index-hash";
    if (match === "INDEX-HASH-MISMATCH") bad++;
    console.log(`${String(i + 1).padStart(2)} ${j.stage} ${j.id} | rubric=${j.rubricId} | designed=${j.designed ?? "?"} | words=${words(j.text)} | sha256=${sha(j.text)} | ${match}`);
  }
  console.log(`\n${jobs.length} jobs, all texts loaded, ${bad} index hash mismatches`);
  process.exit(bad ? 1 : 0);
}

const OUT_FILE = process.argv[2];
const LOG_FILE = process.argv[3];
if (!OUT_FILE || !LOG_FILE) {
  console.error("Usage: node testing/run-baseline.mjs <out.jsonl> <server.log>");
  process.exit(1);
}
const LIMIT = process.env.LIMIT ? Number(process.env.LIMIT) : jobs.length;
const SKIP = process.env.SKIP ? Number(process.env.SKIP) : 0;
const STOP_CODES = new Set([400, 401, 402, 403, 429]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// The usage line the server printed for the call just made (read from after the previous end of the log).
async function usageSince(offset) {
  for (let t = 0; t < 20; t++) {
    const buf = fs.existsSync(LOG_FILE) ? fs.readFileSync(LOG_FILE, "utf8") : "";
    const m = /\[marking\] \S+ rubric=\S+ stop_reason=(\S+) input_tokens=(\S+) cache_creation_input_tokens=(\S+) cache_read_input_tokens=(\S+) output_tokens=(\S+)/.exec(buf.slice(offset));
    const num = (v) => (v === "n/a" ? null : Number(v));
    if (m) return { stop_reason: m[1], input_tokens: num(m[2]), cache_creation_input_tokens: num(m[3]), cache_read_input_tokens: num(m[4]), output_tokens: num(m[5]) };
    await sleep(500);
  }
  return { stop_reason: null, input_tokens: null, cache_creation_input_tokens: null, cache_read_input_tokens: null, output_tokens: null };
}

let parseFailures = 0;
for (const [i, job] of jobs.entries()) {
  if (i < SKIP) continue;
  if (i >= LIMIT + SKIP) break;
  process.stderr.write(`[${i + 1}/53] ${job.stage}/${job.id} ...\n`);
  const offset = fs.existsSync(LOG_FILE) ? fs.statSync(LOG_FILE).size : 0;
  const startedAt = new Date();
  let record;
  let stop = false;
  try {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rubricId: job.rubricId, anonymisedSubmission: job.text }),
    });
    const data = await res.json();
    const endedAt = new Date();
    const usage = await usageSince(offset);
    const base = {
      n: i + 1, stage: job.stage, id: job.id, designed: job.designed, rubricId: job.rubricId, words: words(job.text), sha256: sha(job.text),
      startedAt: startedAt.toISOString(), endedAt: endedAt.toISOString(), ms: endedAt - startedAt, httpStatus: res.status, ...usage,
    };
    if (!res.ok || data.error) {
      record = { ...base, error: data.error ?? `HTTP ${res.status}` };
      if (STOP_CODES.has(res.status)) stop = true;
      else if (res.status === 502) { parseFailures++; if (parseFailures >= 3) stop = true; }
      else stop = true; // any other failure: stop, never retry
      process.stderr.write(`  ERROR ${res.status} stop_reason=${usage.stop_reason} output_tokens=${usage.output_tokens}\n`);
    } else {
      record = {
        ...base,
        mark: data.mark, rawScore: data.rawScore, borderline: data.borderline, boundaryCase: data.boundaryCase, capped: data.capped, ceilingBand: data.ceilingBand,
        topicMismatch: data.topicMismatch, bandReasoningEmpty: !(data.bandReasoning ?? "").trim(),
        presenceEvidence: (data.presenceEvidence ?? []).map((p) => ({ criterion: p.criterion, level: p.level, met: p.met })),
        outcome: data,
      };
      process.stderr.write(`  mark=${data.mark} raw=${data.rawScore} boundary=${data.boundaryCase} capped=${data.capped} ceil=${data.ceilingBand} (${record.ms}ms)\n`);
    }
  } catch (err) {
    stop = true;
    record = { n: i + 1, stage: job.stage, id: job.id, sha256: sha(job.text), startedAt: startedAt.toISOString(), error: String(err) };
    process.stderr.write(`  EXCEPTION ${err}\n`);
  }
  fs.appendFileSync(OUT_FILE, JSON.stringify(record) + "\n"); // each result is on disk as soon as it completes
  if (stop) {
    process.stderr.write("STOPPED by the stop rules. Not retrying.\n");
    process.exit(2);
  }
}
process.stderr.write("DONE\n");
