export interface ExtractResult {
  text: string;
  warning?: string;
}

const PLAIN_TEXT_EXTENSIONS = [".txt", ".md", ".markdown"];

function hasExtension(name: string, ext: string): boolean {
  return name.toLowerCase().endsWith(ext);
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
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/[ \t]+/g, " ");
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

  if (hasExtension(name, ".pdf") || file.type === "application/pdf") {
    return extractFromPdf(file);
  }

  if (hasExtension(name, ".docx")) {
    return extractFromDocx(file);
  }

  if (PLAIN_TEXT_EXTENSIONS.some((ext) => hasExtension(name, ext)) || file.type.startsWith("text/")) {
    return extractFromPlainText(file);
  }

  throw new Error("Unsupported file type. Upload a .txt, .md, .docx or .pdf file, or paste the text directly.");
}
