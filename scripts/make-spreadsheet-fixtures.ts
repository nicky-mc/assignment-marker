// Writes the fictional spreadsheet fixtures into testing/fixtures. All names and figures are made up.
// Run from the repo root:  npx tsx scripts/make-spreadsheet-fixtures.ts
import * as XLSX from "xlsx";
import { writeFileSync } from "node:fs";

const DIR = "testing/fixtures";

const num = (v: number, f?: string, z?: string): XLSX.CellObject => ({ t: "n", v, ...(f ? { f } : {}), ...(z ? { z } : {}) });
const str = (v: string): XLSX.CellObject => ({ t: "s", v });

function budgetBook(): XLSX.WorkBook {
  const budget: XLSX.WorkSheet = {
    A1: str("Item"), B1: str("Budget"), C1: str("Actual"), D1: str("Variance"), E1: str("Due"),
    A2: str("Venue hire"), B2: num(1200), C2: num(1150), D2: num(50, "B2-C2"), E2: { t: "d", v: new Date(Date.UTC(2025, 0, 5)), z: "dd/mm/yyyy" },
    A3: str("Catering"), B3: num(800), C3: num(910), D3: num(-110, "B3-C3"),
    // row 4 left blank on purpose
    A5: str("Printing"), B5: num(150), C5: num(150), D5: num(0, "B5-C5"),
    A6: str("Total"), B6: num(2150, "SUM(B2:B5)"), C6: num(2210, "SUM(C2:C5)"), D6: num(-60, "SUM(D2:D5)"),
    "!ref": "A1:E6",
  };
  const summary: XLSX.WorkSheet = {
    A1: str("Event summary 2025"),
    A3: str("Overspend?"), B3: { t: "b", v: true, f: "D6<0" },
    A4: str("Overspend as share of budget"), B4: num(-0.0279, "D6/B6", "0.0%"),
    "!ref": "A1:C4",
    "!merges": [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }],
  };
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, budget, "Budget");
  XLSX.utils.book_append_sheet(book, summary, "Summary");
  return book;
}

const book = budgetBook();
XLSX.writeFile(book, `${DIR}/Jane-Doe_budget.xlsx`, { bookType: "xlsx", cellDates: true });
XLSX.writeFile(book, `${DIR}/Jane-Doe_budget.ods`, { bookType: "ods", cellDates: true });

// Comma-delimited, UTF-8 with a BOM, quoted fields containing commas and a doubled quote.
writeFileSync(
  `${DIR}/Jane-Doe_cashflow.csv`,
  "﻿Month,Money in,Money out,Net,Notes\nJan,1500,1200,300,\"Rent, bills\"\nFeb,1500,1650,-150,\"Car repair (\"\"MOT\"\" failed)\"\nMar,1600,1300,300,\n",
);

// Semicolon-delimited with decimal commas, saved as Windows-1252 (a pound sign is the single byte 0xA3).
writeFileSync(
  `${DIR}/Jane-Doe_cashflow-semicolon.csv`,
  Buffer.concat([Buffer.from([...Buffer.from("Month;Income (£);Spend (£)\nJan;1500,50;1200,25\nFeb;1500,00;1650,75\n", "latin1")])]),
);

// Blank rows and columns, a heading row that is not on row 1, and a row with a missing middle cell.
writeFileSync(
  `${DIR}/Jane-Doe_messy.csv`,
  ",,,\n,,,\nProduct,Units,,Price\nWidget,10,,2.50\n,,,\n\nGadget,,,4.00\n,,,\nGizmo,7,,1.25\n",
);
console.log("Wrote fixtures to", DIR);
