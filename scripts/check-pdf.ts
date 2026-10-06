// Checks the PDF table markers against the fictional fixtures. Zero API calls.
// Run from the repo root:  npx tsx scripts/check-pdf.ts
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

// pdf.js expects a few browser classes at import time. Text extraction does not use them, so empty stand-ins do.
for (const k of ["DOMMatrix", "Path2D", "ImageData"]) {
  (globalThis as Record<string, unknown>)[k] ??= class {};
}

// Node before 24 has no Promise.try, which this pdf.js version calls.
const P = Promise as unknown as { try?: (fn: (...a: unknown[]) => unknown, ...args: unknown[]) => Promise<unknown> };
P.try ??= (fn, ...args) => new Promise((resolve) => resolve(fn(...args)));

// Likewise Uint8Array.prototype.toHex, used for document hashing.
const U8 = Uint8Array.prototype as unknown as { toHex?: () => string };
U8.toHex ??= function (this: Uint8Array) {
  return Array.from(this, (b) => b.toString(16).padStart(2, "0")).join("");
};

// And Map/WeakMap getOrInsert / getOrInsertComputed.
for (const proto of [Map.prototype, WeakMap.prototype] as unknown as Record<string, unknown>[]) {
  proto.getOrInsert ??= function (this: Map<unknown, unknown>, k: unknown, v: unknown) {
    if (!this.has(k)) this.set(k, v);
    return this.get(k);
  };
  proto.getOrInsertComputed ??= function (this: Map<unknown, unknown>, k: unknown, f: (k: unknown) => unknown) {
    if (!this.has(k)) this.set(k, f(k));
    return this.get(k);
  };
}

(Math as unknown as { sumPrecise?: (xs: Iterable<number>) => number }).sumPrecise ??= (xs) => {
  let t = 0;
  for (const x of xs) t += x;
  return t;
};

const DIR = "testing/fixtures";
const pdfs = readdirSync(DIR).filter((f) => f.toLowerCase().endsWith(".pdf")).sort();

const count = (text: string, needle: string) => text.split(needle).length - 1;
const toFile = (name: string) => new File([readFileSync(join(DIR, name))], name, { type: "application/pdf" });

// The function as it was before the markers were added, loaded from git, to prove that ordinary PDFs are unchanged.
const PREV_REF = process.env.PREV_REF ?? "pre-pdf";
const prevPath = join("lib", "__prevExtractText.ts");
writeFileSync(prevPath, execFileSync("git", ["show", `${PREV_REF}:lib/extractText.ts`], { encoding: "utf8" }));

async function main() {
  const { extractTextFromFile } = await import("../lib/extractText");
  const prev = (await import(["..", "lib", "__prevExtractText"].join("/"))) as typeof import("../lib/extractText");
  let failed = 0;
  for (const name of pdfs) {
    const now = await extractTextFromFile(toFile(name));
    const before = await prev.extractTextFromFile(toFile(name));
    const cells = count(now.text, "[next cell]");
    const gaps = count(now.text, " | ");
    const same = now.text === before.text;
    console.log(`${basename(name)}\n  [next cell]: ${cells}   " | " gaps: ${gaps}   notice: ${now.notice ? "yes" : "no"}   same text as ${PREV_REF}: ${same ? "yes" : "no"}`);
    if (name.includes("table-labelled")) {
      const ok = cells === 2 && gaps === 2 && !!now.notice;
      console.log(`  expect 2 and 2 with notice: ${ok ? "PASS" : "FAIL"}`);
      if (!ok) failed++;
    } else if (name.includes("unlabelled")) {
      const ok = cells === 0 && gaps === 0 && same && !now.notice;
      console.log(`  expect 0 markers, text unchanged, no notice: ${ok ? "PASS" : "FAIL"}`);
      if (!ok) failed++;
    } else {
      console.log(
        `  arrives ${cells + gaps > 0 ? "cell by cell (markers fired)" : "line by line or as plain prose (no markers fired)"}`,
      );
    }
  }
  return failed;
}

main()
  .then((failed) => {
    rmSync(prevPath, { force: true });
    process.exit(failed ? 1 : 0);
  })
  .catch((err) => {
    rmSync(prevPath, { force: true });
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
