// Checks spreadsheet and CSV extraction against the fictional fixtures. Zero API calls.
// Run from the repo root:  npx tsx scripts/check-spreadsheet.ts
// (The fixtures are written by scripts/make-spreadsheet-fixtures.ts.)
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as XLSX from "xlsx";
import { extractTextFromFile } from "../lib/extractText";
import { MAX_SPREADSHEET_BYTES } from "../lib/extractSpreadsheet";

const DIR = "testing/fixtures";
let failed = 0;
const check = (label: string, ok: boolean, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : `  ${detail}`}`);
  if (!ok) failed++;
};
const load = (name: string) => new File([readFileSync(join(DIR, name))], name);
const has = (text: string, needle: string) => text.includes(needle);
const rejects = async (file: File) => extractTextFromFile(file).then(() => null, (e: Error) => e.message);

async function main() {
  // xlsx and ods give the same text, with formulas kept beside their values.
  const xlsx = await extractTextFromFile(load("Jane-Doe_budget.xlsx"));
  const ods = await extractTextFromFile(load("Jane-Doe_budget.ods"));
  for (const [kind, r] of [["xlsx", xlsx], ["ods", ods]] as const) {
    const t = r.text;
    check(`${kind}: sheet names`, has(t, "[Sheet 1: Budget]") && has(t, "[Sheet 2: Summary]"));
    check(`${kind}: heading row shown as column labels`, has(t, "Row 1 (column headings): [Col A] Item | [Col B] Budget"));
    check(`${kind}: rows labelled by heading`, has(t, "[Item] Venue hire | [Budget] 1200 | [Actual] 1150"));
    check(`${kind}: formula and value together`, has(t, "[Variance] =B2-C2 (value: 50)"));
    check(`${kind}: typed number has no formula`, has(t, "[Budget] 1200 |") && !has(t, "=1200"));
    check(`${kind}: SUM formula kept`, has(t, "=SUM(B2:B5) (value: 2150)"));
    check(`${kind}: date is unambiguous`, has(t, "[Due] 2025-01-05"));
    check(`${kind}: blank row 4 skipped`, !has(t.split("[Sheet 2")[0], "Row 4:"));
    check(`${kind}: merged cell noted once`, has(t, "Merged cells: A1:C1") && has(t, "Event summary 2025"));
    check(`${kind}: boolean formula`, has(t, "=D6<0 (value: TRUE)"));
    check(`${kind}: no truncation warning`, r.warning === undefined);
  }

  // CSV: BOM, quoted commas, doubled quotes.
  const cash = await extractTextFromFile(load("Jane-Doe_cashflow.csv"));
  check("csv: BOM removed", !cash.text.includes("﻿") && has(cash.text, "[Col A] Month"));
  check("csv: comma delimiter, labelled rows", has(cash.text, "[Month] Jan | [Money in] 1500 | [Money out] 1200 | [Net] 300"));
  check("csv: quoted comma kept in one cell", has(cash.text, "[Notes] Rent, bills"));
  check("csv: doubled quotes", has(cash.text, 'Car repair ("MOT" failed)'));

  // CSV: semicolon delimiter and Windows-1252 (the pound sign).
  const semi = await extractTextFromFile(load("Jane-Doe_cashflow-semicolon.csv"));
  check("csv: Windows-1252 pound sign", has(semi.text, "[Income (£)] 1500,50") && !semi.text.includes("�"));
  check("csv: semicolon delimiter", has(semi.text, "[Month] Feb | [Income (£)] 1500,00 | [Spend (£)] 1650,75"));

  // CSV: tab delimiter, built in memory.
  const tab = await extractTextFromFile(new File(["Name\tScore\nA\t1\nB\t2\n"], "t.csv"));
  check("csv: tab delimiter", has(tab.text, "[Name] A | [Score] 1"));

  // Messy: blank rows and columns, heading not on row 1, missing middle cell.
  const messy = await extractTextFromFile(load("Jane-Doe_messy.csv"));
  check("messy: heading found on row 3", has(messy.text, "Row 3 (column headings): [Col A] Product | [Col B] Units | [Col D] Price"));
  check("messy: blank rows skipped", !has(messy.text, "Row 5:") && !has(messy.text, "Row 6:") && !has(messy.text, "Row 8:"));
  check("messy: missing cell omitted, not shifted", has(messy.text, "Row 7: [Product] Gadget | [Price] 4.00"));
  check("messy: last row", has(messy.text, "Row 9: [Product] Gizmo | [Units] 7 | [Price] 1.25"));

  // Rejections and limits.
  for (const ext of ["xlsm", "xlsb"]) {
    const msg = await rejects(new File(["x"], `book.${ext}`));
    check(`${ext} rejected with a plain message`, !!msg && has(msg, ".xlsm, .xlsb") && has(msg, ".xlsx or .csv"), String(msg));
  }
  const notZip = await rejects(new File(["just text"], "fake.xlsx"));
  check("a .xlsx that is not a spreadsheet is rejected", !!notZip && has(notZip, "valid spreadsheet"), String(notZip));
  const big = await rejects(new File([new Uint8Array(MAX_SPREADSHEET_BYTES + 1)], "big.csv"));
  check("over the size limit is rejected", !!big && has(big, "too large"), String(big));

  // Truncation: 12 sheets of 250 rows and 40 columns; and a long CSV.
  const book = XLSX.utils.book_new();
  for (let s = 0; s < 12; s++) {
    const rows = [Array.from({ length: 40 }, (_, c) => `Head${c}`)];
    for (let r = 0; r < 250; r++) rows.push(Array.from({ length: 40 }, (_, c) => `r${r}c${c}`));
    XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(rows), `S${s + 1}`);
  }
  const bigBook = new File([XLSX.write(book, { type: "array", bookType: "xlsx" })], "many.xlsx");
  if (bigBook.size > MAX_SPREADSHEET_BYTES) console.log(`(note: test workbook is ${bigBook.size} bytes)`);
  const many = await extractTextFromFile(bigBook);
  check("sheet cap noted", has(many.text, "Only the first 10 sheets are shown; 2 more not shown") && !has(many.text, "[Sheet 11:"));
  check("column cap noted", has(many.text, "only the first 30 columns are shown") && !has(many.text, "[Head30]"));
  check("row/cell cap noted", /more rows? not shown \(limit of/.test(many.text));
  check("truncation also returned as a warning", !!many.warning && has(many.warning, "shortened"));
  const rows = ["A,B", ...Array.from({ length: 300 }, (_, i) => `x${i},y${i}`)].join("\n");
  const longCsv = await extractTextFromFile(new File([rows], "long.csv"));
  check("csv row cap noted", has(longCsv.text, "100 more rows not shown (limit of 200 rows per sheet)") && !has(longCsv.text, "x250"), longCsv.text.slice(-200));

  // Existing formats still routed as before.
  const txt = await extractTextFromFile(new File(["hello"], "a.txt"));
  check("plain text unchanged", txt.text === "hello");

  console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
  process.exit(failed ? 1 : 0);
}
main();
