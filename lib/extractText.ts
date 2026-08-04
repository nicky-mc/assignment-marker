export interface ExtractResult {
  text: string;
  warning?: string;
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

async function extractFromPdf(file: File): Promise<ExtractResult> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pageTexts: string[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => ("str" in item ? item.str : "")).join(" ");
    pageTexts.push(pageText);
  }

  const text = pageTexts.join("\n\n").trim();
  if (!text) {
    throw new Error(
      "No selectable text found in that PDF. It may be a scanned image rather than real text. Try copying and pasting the text instead.",
    );
  }
  return { text };
}

async function extractFromDocx(file: File): Promise<ExtractResult> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  const text = result.value.trim();
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
