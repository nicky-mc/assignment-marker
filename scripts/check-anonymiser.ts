// Privacy control check for the anonymiser. Zero API calls, fictional data only.
// Run from the repo root:  npx tsx scripts/check-anonymiser.ts
// Contract used: anonymise(raw, opts?) returns { text }, where opts.names is the
// marker-confirmed list of name parts to remove (for example ["Jane", "Doe"]).
import { spawnSync } from "node:child_process";
import { anonymise } from "../lib/anonymise";

// Child mode: only used by the speed guard below, so a hang cannot freeze this script.
if (process.argv.includes("--speed")) {
  anonymise("Thanks\n" + "word ".repeat(40) + "end.");
  process.exit(0);
}

type Case = {
  label: string;
  input: string;
  names?: string[];
  gone?: string[]; // must NOT appear in the output
  kept?: string[]; // must still appear in the output
};

const run = (c: Case) =>
  anonymise(c.input, c.names ? { names: c.names } : undefined).text;

const cases: Case[] = [
  // ---- must be removed ----
  {
    label: "sign-off, same line",
    input: "Some text.\nRegards, Jane Doe",
    gone: ["Jane Doe"],
  },
  {
    label: "sign-off, next line",
    input: "Some text.\nRegards,\nJane Doe",
    gone: ["Jane Doe"],
  },
  { label: "greeting: I'm", input: "I'm Jane Doe.", gone: ["Jane Doe"] },
  {
    label: "greeting: Hi, I'm",
    input: "Hi, I'm Jane Doe.",
    gone: ["Jane Doe"],
  },
  {
    label: "greeting: My name is",
    input: "My name is Jane Doe.",
    gone: ["Jane Doe"],
  },
  {
    label: "email",
    input: "Write to alice@example.com please",
    gone: ["alice@"],
  },
  {
    label: "phone +44 mobile",
    input: "Call me on +44 7700 900123 today",
    gone: ["900123"],
  },
  {
    label: "phone 07 mobile",
    input: "Call 07700 900123 today",
    gone: ["900123"],
  },
  {
    label: "phone +44 landline",
    input: "Call +44 20 7946 0123 today",
    gone: ["7946"],
  },
  {
    label: "phone (020) landline",
    input: "Call (020) 7946 0123 today",
    gone: ["7946"],
  },
  { label: "postcode", input: "I live at AB12 3CD", gone: ["AB12"] },
  {
    label: "https link",
    input: "See https://example.com/jane-doe for more",
    gone: ["jane-doe"],
  },
  {
    label: "bare domain link",
    input: "See linkedin.com/in/janedoe for more",
    gone: ["janedoe"],
  },
  {
    label: "social handle",
    input: "Follow me @janedoe on socials",
    gone: ["janedoe"],
  },
  {
    label: "ICO-style registration",
    input: "Acme Ltd is ICO registered (ZA000123) and compliant",
    gone: ["ZA000123"],
  },
  {
    label: "NI number",
    input: "My NI number is QQ123456C",
    gone: ["QQ123456C"],
  },
  { label: "VAT number", input: "VAT GB123456789", gone: ["123456789"] },
  {
    label: "company number",
    input: "Company number 12345678",
    gone: ["12345678"],
  },
  {
    label: "sort code and account",
    input: "Sort code 12-34-56 account 87654321",
    gone: ["12-34-56", "87654321"],
  },
  { label: "date of birth", input: "DOB 01/02/1990", gone: ["1990"] },
  {
    label: "street address",
    input: "Based at 12 Fictional Road, Testville",
    gone: ["Fictional Road"],
  },
  {
    label: "labelled cover-sheet lines",
    input: "Name: Jane Doe\nStudent ID: 12345\nSome essay text.",
    gone: ["Jane Doe", "12345"],
    kept: ["Some essay text"],
  },
  // ---- marker-supplied names ----
  {
    label: "name in body",
    input: "Jane Doe said the policy was unclear.",
    names: ["Jane", "Doe"],
    gone: ["Jane", "Doe"],
  },
  {
    label: "possessive name",
    input: "Jane's business has no policy.",
    names: ["Jane"],
    gone: ["Jane"],
  },
  {
    label: "ALL CAPS name",
    input: "JANE DOE wrote this.",
    names: ["Jane", "Doe"],
    gone: ["JANE", "DOE"],
  },
  {
    label: "hyphenated name",
    input: "Jane-Doe wrote this.",
    names: ["Jane", "Doe"],
    gone: ["Jane", "Doe"],
  },
  {
    label: "name is whole-word only",
    input: "He does not agree.",
    names: ["Doe"],
    kept: ["does not agree"],
  },
  // ---- must be left alone (over-redaction guards) ----
  {
    label: "heading: Privacy Law",
    input: "Privacy Law\nSome content about GDPR and consent.",
    kept: ["Privacy Law", "GDPR"],
  },
  {
    label: "title: Risk Appetite Analysis",
    input: "Risk Appetite Analysis\nBody text here.",
    kept: ["Risk Appetite Analysis"],
  },
  {
    label: "last line: Contract Law",
    input: "Body text.\nContract Law",
    kept: ["Contract Law"],
  },
  {
    label: "'From 2020' sentence",
    input: "From - 2020 to 2022 we grew.",
    kept: ["we grew"],
  },
  {
    label: "'Learner -' definition",
    input: "Learner - a person who is learning",
    kept: ["a person who is learning"],
  },
  {
    label: "'Thanks' then lowercase line",
    input: "Thanks\nfor reading this far",
    kept: ["for reading this far"],
  },
  {
    label: "'Best' then lowercase line",
    input: "Best\npractice matters",
    kept: ["practice matters"],
  },
  {
    label: "ordinary dates stay",
    input:
      "EU AI Act duties apply from 2 August 2026. The Data (Use and Access) Act 2025 changed this.",
    kept: ["EU AI Act", "2 August 2026", "Act 2025"],
  },
  {
    label: "vendor names stay",
    input: "GoHighLevel, Google and Stripe are named processors.",
    kept: ["GoHighLevel", "Stripe"],
  },
  {
    label: "small numbers stay",
    input:
      "Acme works with 12 clients and liability is capped at six months of fees.",
    kept: ["12 clients", "six months"],
  },
];

let failed = 0;
const rows: string[] = [];
for (const c of cases) {
  const out = run(c);
  const leaked = (c.gone ?? []).filter((g) => out.includes(g));
  const lost = (c.kept ?? []).filter((k) => !out.includes(k));
  const ok = leaked.length === 0 && lost.length === 0;
  if (!ok) failed++;
  const why = [
    leaked.length ? `still present: ${leaked.join(", ")}` : "",
    lost.length ? `wrongly removed: ${lost.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("; ");
  rows.push(`${ok ? "PASS" : "FAIL"} | ${c.label.padEnd(30)} | ${why}`);
}

// Speed guard: a long line after a sign-off word must not freeze the tab.
// Runs in a child process with a 3 second limit (startup included).
const t0 = Date.now();
const child = spawnSync(
  process.argv[0],
  [...process.execArgv, process.argv[1], "--speed"],
  { timeout: 3000 },
);
const ms = Date.now() - t0;
const speedOk = child.status === 0;
if (!speedOk) failed++;
rows.push(
  `${speedOk ? "PASS" : "FAIL"} | ${"speed: 40 words after 'Thanks'".padEnd(30)} | ${speedOk ? ms + " ms" : "did not finish within 3 seconds (can freeze the browser tab)"}`,
);

console.log(rows.join("\n"));
console.log(`\n${rows.length - failed} of ${rows.length} passed`);
process.exit(failed ? 1 : 0);
