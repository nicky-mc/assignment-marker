// Spreadsheet and CSV to text. Runs in the browser (like the Word and PDF extraction) and in Node for the check script.
// Output is sheet by sheet: a heading, the header row once as column labels, then one line per non-blank row with
// each cell labelled by its column heading, in the style of the Word table extraction. Formulas are kept next to
// their values so "=B2-C2" can be told apart from a typed number.
import type { ExtractResult } from "./extractText";

/** Upload size limit for spreadsheets and CSV. Larger files are rejected before they are read. */
export const MAX_SPREADSHEET_BYTES = 5 * 1024 * 1024;
const MAX_UNCOMPRESSED_BYTES = 100 * 1024 * 1024; // zip bomb guard for .xlsx and .ods
const MAX_SHEETS = 10;
const MAX_ROWS_PER_SHEET = 200; // non-blank rows shown
const MAX_COLS = 30;
const MAX_CELLS_TOTAL = 4000;
const MAX_CELL_CHARS = 300;
const MAX_MERGES_LISTED = 20;

const MAX_MB = MAX_SPREADSHEET_BYTES / (1024 * 1024);

export function rejectedSpreadsheetMessage(name: string): string | null {
  const lower = name.toLowerCase();
  if (lower.endsWith(".xlsm") || lower.endsWith(".xlsb")) {
    return "Spreadsheets with macros or in binary format (.xlsm, .xlsb) aren't supported. Please save a copy as .xlsx or .csv, or copy and paste the text instead.";
  }
  return null;
}

/** One cell as it should be shown: text, with a formula kept alongside the value it gave. */
interface RenderedCell {
  text: string;
}

/** A sheet reduced to plain rows of rendered cells, indexed from 0. Row and column numbers are real sheet positions. */
interface SheetGrid {
  name: string;
  hidden: boolean;
  /** Rows by 0-based sheet row index; missing or empty rows are blank. */
  rows: Map<number, Map<number, RenderedCell>>;
  maxRow: number;
  maxCol: number;
  merges: string[];
  /** True when the parser itself stopped early because the sheet was longer than we read. */
  readCut: boolean;
}

export function columnLetter(index: number): string {
  let n = index;
  let s = "";
  do {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
}

function clip(text: string): string {
  const one = text.replace(/\s+/g, " ").trim();
  return one.length > MAX_CELL_CHARS ? `${one.slice(0, MAX_CELL_CHARS)}… [cell cut]` : one;
}

// ---------- CSV ----------

/** Decodes CSV bytes: UTF-16 with a BOM, UTF-8 with or without a BOM, otherwise Windows-1252. */
export function decodeCsv(bytes: Uint8Array): string {
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder("utf-16le").decode(bytes.subarray(2));
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder("utf-16be").decode(bytes.subarray(2));
  try {
    return new TextDecoder("utf-8", { fatal: true, ignoreBOM: false }).decode(bytes).replace(/^﻿/, "");
  } catch {
    return new TextDecoder("windows-1252").decode(bytes);
  }
}

/** Splits CSV text into records using one delimiter. Handles quoted fields, doubled quotes and newlines inside quotes. */
export function parseCsv(text: string, delimiter: string, maxRecords = Infinity): string[][] {
  const records: string[][] = [];
  let field = "";
  let record: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += ch;
    } else if (ch === '"' && field === "") {
      inQuotes = true;
    } else if (ch === delimiter) {
      record.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      record.push(field);
      records.push(record);
      field = "";
      record = [];
      if (records.length >= maxRecords) return records;
    } else field += ch;
  }
  if (field !== "" || record.length > 0) {
    record.push(field);
    records.push(record);
  }
  return records;
}

/** Picks comma, semicolon or tab: the one that gives the most rows with the same (more than one) field count. */
export function detectDelimiter(text: string): string {
  const candidates = [",", ";", "\t"];
  let best = ",";
  let bestScore = 0;
  for (const d of candidates) {
    const sample = parseCsv(text, d, 30).filter((r) => r.some((c) => c.trim() !== ""));
    const counts = new Map<number, number>();
    for (const r of sample) if (r.length > 1) counts.set(r.length, (counts.get(r.length) ?? 0) + 1);
    const score = Math.max(0, ...counts.values());
    if (score > bestScore) {
      best = d;
      bestScore = score;
    }
  }
  return best;
}

function csvToGrid(bytes: Uint8Array, name: string): SheetGrid {
  const text = decodeCsv(bytes);
  const records = parseCsv(text, detectDelimiter(text));
  const rows = new Map<number, Map<number, RenderedCell>>();
  let maxCol = 0;
  records.forEach((rec, r) => {
    const cells = new Map<number, RenderedCell>();
    rec.forEach((value, c) => {
      if (value.trim() !== "") {
        cells.set(c, { text: clip(value) });
        maxCol = Math.max(maxCol, c);
      }
    });
    if (cells.size > 0) rows.set(r, cells);
  });
  return { name: name.replace(/\.[^.]+$/, ""), hidden: false, rows, maxRow: records.length - 1, maxCol, merges: [], readCut: false };
}

// ---------- xlsx and ods ----------

/** Total uncompressed size declared by a zip's central directory, or null if it cannot be read as a zip. */
export function zipUncompressedSize(bytes: Uint8Array): number | null {
  if (bytes.length < 22 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 65535); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) return null;
  const entries = view.getUint16(eocd + 10, true);
  let offset = view.getUint32(eocd + 16, true);
  let total = 0;
  for (let e = 0; e < entries; e++) {
    if (offset + 46 > bytes.length || view.getUint32(offset, true) !== 0x02014b50) return null;
    const size = view.getUint32(offset + 24, true);
    if (size === 0xffffffff) return Infinity; // zip64: treat as too big
    total += size;
    offset += 46 + view.getUint16(offset + 28, true) + view.getUint16(offset + 30, true) + view.getUint16(offset + 32, true);
  }
  return total;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

async function workbookToGrids(bytes: Uint8Array): Promise<{ grids: SheetGrid[]; totalSheets: number }> {
  const mod = await import("xlsx");
  const XLSX = ((mod as unknown as { default?: typeof mod }).default ?? mod) as typeof mod;
  const workbook = XLSX.read(bytes, {
    type: "array",
    cellFormula: true,
    cellDates: true,
    cellStyles: false,
    cellHTML: false,
    sheetRows: MAX_ROWS_PER_SHEET * 5, // read a bounded window; blank rows inside it are skipped
  });

  const grids = workbook.SheetNames.slice(0, MAX_SHEETS).map((sheetName, index) => {
    const ws = workbook.Sheets[sheetName];
    const hidden = (workbook.Workbook?.Sheets?.[index]?.Hidden ?? 0) !== 0;
    const rows = new Map<number, Map<number, RenderedCell>>();
    const ref = ws["!ref"];
    const range = ref ? XLSX.utils.decode_range(ref) : null;
    const merges = (ws["!merges"] ?? []) as { s: { r: number; c: number }; e: { r: number; c: number } }[];
    const covered = new Set<string>();
    for (const m of merges) {
      for (let r = m.s.r; r <= m.e.r; r++) {
        for (let c = m.s.c; c <= m.e.c; c++) if (r !== m.s.r || c !== m.s.c) covered.add(`${r}:${c}`);
      }
    }
    let maxCol = 0;
    let maxRow = -1;
    if (range) {
      const lastCol = Math.min(range.e.c, range.s.c + MAX_COLS * 4);
      for (let r = range.s.r; r <= range.e.r; r++) {
        const cells = new Map<number, RenderedCell>();
        for (let c = range.s.c; c <= lastCol; c++) {
          if (covered.has(`${r}:${c}`)) continue;
          const cell = ws[XLSX.utils.encode_cell({ r, c })];
          if (!cell) continue;
          let value: string;
          if (cell.t === "d" && cell.v instanceof Date) {
            // Dates are shown unambiguously (yyyy-mm-dd) so day/month order never depends on the viewer's locale.
            const d = cell.v;
            const hasTime = d.getUTCHours() + d.getUTCMinutes() + d.getUTCSeconds() > 0;
            value = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}${hasTime ? ` ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}` : ""}`;
          } else if (cell.t === "e") {
            value = cell.w ?? "#ERROR";
          } else {
            value = cell.w ?? (cell.v === undefined || cell.v === null ? "" : String(cell.v));
          }
          const formula = typeof cell.f === "string" && cell.f !== "" ? `=${cell.f}` : "";
          const text = formula ? (value.trim() === "" ? formula : `${formula} (value: ${value})`) : value;
          if (text.trim() === "") continue;
          cells.set(c, { text: clip(text) });
          maxCol = Math.max(maxCol, c);
        }
        if (cells.size > 0) {
          rows.set(r, cells);
          maxRow = Math.max(maxRow, r);
        }
      }
    }
    const readCut = Boolean(range && range.e.r + 1 >= MAX_ROWS_PER_SHEET * 5 && ws["!fullref"]);
    return {
      name: sheetName,
      hidden,
      rows,
      maxRow,
      maxCol,
      merges: merges.map((m) => XLSX.utils.encode_range(m)),
      readCut,
    };
  });
  return { grids, totalSheets: workbook.SheetNames.length };
}

// ---------- rendering ----------

function renderSheet(grid: SheetGrid, number: number, budget: { cells: number }): { text: string; truncated: string[] } {
  const truncated: string[] = [];
  const title = `[Sheet ${number}: ${grid.name}]${grid.hidden ? " (hidden sheet)" : ""}`;
  const rowIndexes = [...grid.rows.keys()].sort((a, b) => a - b);
  if (rowIndexes.length === 0) return { text: `${title}\n(No data in this sheet.)`, truncated };

  const colLimit = Math.min(grid.maxCol, MAX_COLS - 1);
  if (grid.maxCol > colLimit) truncated.push(`Sheet "${grid.name}": only the first ${MAX_COLS} columns are shown.`);

  const lines = [title];

  // The heading row is the first of the first few non-blank rows that has at least two cells, all plain text (no
  // formula, no number). A lone title above it (often a merged cell) is shown as an ordinary row without labels.
  const labels = new Map<number, string>();
  const isHeading = (cells: Map<number, RenderedCell>) =>
    cells.size >= 2 && [...cells.values()].every((c) => !c.text.startsWith("=") && Number.isNaN(Number(c.text.replace(/,/g, ""))));
  const headingAt = rowIndexes.slice(0, 5).findIndex((r) => isHeading(grid.rows.get(r)!));
  let startAt = 0;
  if (headingAt >= 0) {
    for (let i = 0; i < headingAt; i++) {
      const cells = [...grid.rows.get(rowIndexes[i])!.entries()].filter(([c]) => c <= colLimit);
      lines.push(`Row ${rowIndexes[i] + 1}: ${cells.map(([c, cell]) => `[Col ${columnLetter(c)}] ${cell.text}`).join(" | ")}`);
    }
    const first = grid.rows.get(rowIndexes[headingAt])!;
    const seen = new Set<string>();
    for (const [c, cell] of first) {
      if (c > colLimit) continue;
      if (seen.has(cell.text)) continue; // a repeated heading cannot tell columns apart; that column falls back to its letter
      seen.add(cell.text);
      labels.set(c, cell.text);
    }
    const parts = [...first.entries()].filter(([c]) => c <= colLimit).map(([c, cell]) => `[Col ${columnLetter(c)}] ${cell.text}`);
    lines.push(`Row ${rowIndexes[headingAt] + 1} (column headings): ${parts.join(" | ")}`);
    budget.cells -= parts.length;
    startAt = headingAt + 1;
  }

  let shown = 0;
  for (let i = startAt; i < rowIndexes.length; i++) {
    if (shown >= MAX_ROWS_PER_SHEET || budget.cells <= 0) {
      const left = rowIndexes.length - i;
      truncated.push(
        `Sheet "${grid.name}": ${left} more row${left === 1 ? "" : "s"} not shown (limit of ${shown >= MAX_ROWS_PER_SHEET ? `${MAX_ROWS_PER_SHEET} rows per sheet` : `${MAX_CELLS_TOTAL} cells in total`}).`,
      );
      break;
    }
    const r = rowIndexes[i];
    const cells = [...grid.rows.get(r)!.entries()].filter(([c]) => c <= colLimit);
    if (cells.length === 0) continue;
    const parts = cells.map(([c, cell]) => `[${labels.get(c) ?? `Col ${columnLetter(c)}`}] ${cell.text}`);
    budget.cells -= cells.length;
    lines.push(`Row ${r + 1}: ${parts.join(" | ")}`);
    shown++;
  }

  if (grid.readCut) truncated.push(`Sheet "${grid.name}": this sheet is very long and only its first rows were read.`);
  if (grid.merges.length > 0) {
    const listed = grid.merges.slice(0, MAX_MERGES_LISTED).join(", ");
    const more = grid.merges.length > MAX_MERGES_LISTED ? ` and ${grid.merges.length - MAX_MERGES_LISTED} more` : "";
    lines.push(`(Merged cells: ${listed}${more}. A merged cell's value is shown once, in its top-left cell.)`);
  }
  return { text: lines.join("\n"), truncated };
}

export async function extractFromSpreadsheet(file: File): Promise<ExtractResult> {
  if (file.size > MAX_SPREADSHEET_BYTES) {
    throw new Error(`That file is too large (${MAX_MB} MB limit for spreadsheets). Try a smaller copy, or copy and paste the part to mark.`);
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const isCsv = file.name.toLowerCase().endsWith(".csv");
  let grids: SheetGrid[];
  let totalSheets = 1;

  if (isCsv) {
    grids = [csvToGrid(bytes, file.name)];
  } else {
    const uncompressed = zipUncompressedSize(bytes);
    if (uncompressed === null) {
      throw new Error("That doesn't look like a valid spreadsheet. If it is password protected, remove the password and try again.");
    }
    if (uncompressed > MAX_UNCOMPRESSED_BYTES) {
      throw new Error("That spreadsheet is too large once opened. Try a smaller copy, or copy and paste the part to mark.");
    }
    try {
      ({ grids, totalSheets } = await workbookToGrids(bytes));
    } catch {
      throw new Error("Couldn't read that spreadsheet. Try saving a copy as .xlsx or .csv, or copy and paste the text instead.");
    }
  }

  const truncated: string[] = [];
  if (totalSheets > MAX_SHEETS) {
    truncated.push(`Only the first ${MAX_SHEETS} sheets are shown; ${totalSheets - MAX_SHEETS} more not shown.`);
  }
  const budget = { cells: MAX_CELLS_TOTAL };
  const blocks = grids.map((g, i) => {
    const out = renderSheet(g, i + 1, budget);
    truncated.push(...out.truncated);
    return out.text;
  });
  if (blocks.every((b) => b.includes("(No data in this sheet.)"))) {
    throw new Error("Couldn't find any data in that spreadsheet.");
  }
  if (truncated.length > 0) blocks.push(`[Note: this text is shortened. ${truncated.join(" ")}]`);

  return {
    text: blocks.join("\n\n"),
    warning: truncated.length > 0 ? `This spreadsheet was shortened to fit. ${truncated.join(" ")}` : undefined,
  };
}
