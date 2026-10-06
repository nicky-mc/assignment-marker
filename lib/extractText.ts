export interface ExtractResult {
  text: string;
  warning?: string;
  /** Informational only: shown in the upload area, never blocks marking. */
  notice?: string;
}

const PLAIN_TEXT_EXTENSIONS = [".txt", ".md", ".markdown"];

function hasExtension(name: string, ext: string): boolean {
  return name.toLowerCase().endsWith(ext);
}

/**
 * Documents (especially PDFs) commonly extract with doubled inter-word spacing,
 * stray form-feed page breaks, and runs of blank lines. Clean that up so the
 * result reads like normal prose rather than a mess of odd whitespace.
 */
function normalizeExtractedText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/\f/g, "\n\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const PDF_TABLE_NOTICE =
  "This PDF seems to contain a table. PDF tables are read approximately, so please check the preview. A Word file or Google Doc link keeps tables more reliably.";

const CELL_BREAK = "\n\n[next cell]\n\n";
const COLUMN_GAP = " | ";

interface PdfItemLike {
  str: string;
  width: number;
  height: number;
  transform: number[];
}

/**
 * Joins one page's text items with a space, as before, except where the position shows a table:
 * a sharp jump up (more than 3 line heights) starts a new cell, and a wide gap to the right (more than
 * 2 line heights) on the same line separates header cells. Nothing is added when neither fires, so
 * ordinary single-column PDFs come out exactly as they did before.
 */
export function joinPdfItems(items: PdfItemLike[]): { text: string; markers: number } {
  let text = "";
  let markers = 0;
  let prev: PdfItemLike | null = null;
  items.forEach((item, i) => {
    let sep = i > 0 ? " " : "";
    if (prev && item.str.trim()) {
      const lineHeight = Math.abs(prev.height) || Math.abs(prev.transform[3]);
      const dy = item.transform[5] - prev.transform[5];
      const gapX = item.transform[4] - (prev.transform[4] + prev.width);
      if (lineHeight > 0 && dy > 3 * lineHeight) {
        sep = CELL_BREAK;
        markers += 1;
      } else if (lineHeight > 0 && Math.abs(dy) < lineHeight / 2 && gapX > 2 * lineHeight) {
        sep = COLUMN_GAP;
        markers += 1;
      }
    }
    text += sep + item.str;
    if (item.str.trim()) prev = item;
  });
  return { text, markers };
}

async function extractFromPdf(file: File): Promise<ExtractResult> {
  const pdfjsLib = await import("pdfjs-dist");
  // In the browser the worker is served from /public; elsewhere (e.g. Node scripts) pdf.js finds its own.
  if (typeof window !== "undefined") pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pageTexts: string[] = [];
  let markers = 0;
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    // Position is compared within a page only; each page starts fresh.
    const items = content.items.map((item) =>
      "str" in item
        ? { str: item.str, width: item.width, height: item.height, transform: item.transform }
        : { str: "", width: 0, height: 0, transform: [0, 0, 0, 0, 0, 0] },
    );
    const page_ = joinPdfItems(items);
    markers += page_.markers;
    pageTexts.push(page_.text);
  }

  const text = pageTexts.join("\n\n").trim();
  if (!text) {
    throw new Error(
      "No selectable text found in that PDF. It may be a scanned image rather than real text. Try copying and pasting the text instead.",
    );
  }
  return { text, notice: markers > 0 ? PDF_TABLE_NOTICE : undefined };
}

function cellText(cell: Element): string {
  const paragraphs = Array.from(cell.querySelectorAll("p"))
    .map((p) => (p.textContent ?? "").replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const parts = paragraphs.length > 0 ? paragraphs : [(cell.textContent ?? "").replace(/\s+/g, " ").trim()];
  return parts.join(" / ");
}

/** Renders a table as labelled text: "[Table 1]", then "Row 1: [Col 1] a | [Col 2] b" per row. */
function tableToText(table: HTMLTableElement, tableNumber: number): string {
  const lines = [`[Table ${tableNumber}]`];
  Array.from(table.rows).forEach((row, r) => {
    const cells = Array.from(row.cells).map((cell, c) => `[Col ${c + 1}] ${cellText(cell)}`.trimEnd());
    lines.push(`Row ${r + 1}: ${cells.join(" | ")}`);
  });
  return lines.join("\n");
}

function docxHtmlToText(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const blocks: string[] = [];
  let tableNumber = 0;
  for (const el of Array.from(doc.body.children)) {
    if (el.tagName === "TABLE") {
      tableNumber += 1;
      blocks.push(tableToText(el as HTMLTableElement, tableNumber));
    } else if (el.tagName === "UL" || el.tagName === "OL") {
      for (const li of Array.from(el.children)) blocks.push(`- ${(li.textContent ?? "").trim()}`);
    } else {
      const text = (el.textContent ?? "").trim();
      if (text) blocks.push(text);
    }
  }
  return blocks.join("\n\n");
}

async function extractFromDocx(file: File): Promise<ExtractResult> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  // Images are dropped: only text is wanted, and inlining them as base64 would be wasteful.
  const result = await mammoth.convertToHtml(
    { arrayBuffer },
    { convertImage: mammoth.images.imgElement(async () => ({ src: "" })) },
  );
  const text = docxHtmlToText(result.value).trim();
  if (!text) {
    throw new Error("Couldn't find any text in that document.");
  }
  return {
    text,
    warning: result.messages.length > 0 ? "Some formatting may not have converted cleanly, check the text below." : undefined,
  };
}

async function extractFromPlainText(file: File): Promise<ExtractResult> {
  const text = (await file.text()).trim();
  if (!text) {
    throw new Error("That file appears to be empty.");
  }
  return { text };
}

export async function extractTextFromFile(file: File): Promise<ExtractResult> {
  const name = file.name;

  if (hasExtension(name, ".doc")) {
    throw new Error(
      "Old .doc files aren't supported. Please save it as .docx, export it as a PDF, or copy and paste the text instead.",
    );
  }

  let result: ExtractResult;
  if (hasExtension(name, ".pdf") || file.type === "application/pdf") {
    result = await extractFromPdf(file);
  } else if (hasExtension(name, ".docx")) {
    result = await extractFromDocx(file);
  } else if (PLAIN_TEXT_EXTENSIONS.some((ext) => hasExtension(name, ext)) || file.type.startsWith("text/")) {
    result = await extractFromPlainText(file);
  } else {
    throw new Error("Unsupported file type. Upload a .txt, .md, .docx or .pdf file, or paste the text directly.");
  }

  return { ...result, text: normalizeExtractedText(result.text) };
}
