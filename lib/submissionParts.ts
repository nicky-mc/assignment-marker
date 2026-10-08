// A submission can arrive as several labelled parts (files, pasted text) plus optional links.
// This file is pure (no network, no browser): the marking form uses it to assemble the text, and the mark route uses it
// to find which part a quote came from. AssisTED never opens links. A link's URL is used only in the browser to work out
// the kind of site; it is never put into the assembled text, so it is never sent, stored or logged.
import { anonymise, type AnonymiseOptions, type RedactionCategory } from "./anonymise";

export const MAX_PARTS = 8;
export const MAX_LINKS = 5;
export const MAX_LABEL_LENGTH = 60;
/** Total size of all uploaded files together. Matches the existing 5 MB spreadsheet limit. */
export const MAX_TOTAL_UPLOAD_BYTES = 5 * 1024 * 1024;

export interface SubmissionPart {
  label: string;
  /** The file's name, if it came from a file. Shown in the part header after the learner's name has been removed. */
  fileName?: string;
  text: string;
}

export interface SubmissionLink {
  label: string;
  /** Only used here to work out the kind of site. Never sent. */
  url: string;
}

export interface LinkInfo {
  label: string;
  kind: LinkKind;
}

export type LinkKind = "Google Doc" | "Google Sheet" | "Google Slides" | "Google Drive file" | "Notion" | "Canva" | "other website";

/** Returns the kind of site for a web address, or null if it is not a usable http(s) address. */
export function linkKind(url: string): LinkKind | null {
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const host = u.hostname.toLowerCase();
  const is = (d: string) => host === d || host.endsWith(`.${d}`);
  if (host === "docs.google.com") {
    if (u.pathname.startsWith("/spreadsheets")) return "Google Sheet";
    if (u.pathname.startsWith("/presentation")) return "Google Slides";
    return "Google Doc";
  }
  if (host === "drive.google.com") return "Google Drive file";
  if (is("notion.so") || is("notion.site")) return "Notion";
  if (is("canva.com") || host === "canva.link") return "Canva";
  return "other website";
}

/** One line, no "=" runs (so a label cannot imitate a part header), trimmed and limited in length. */
export function cleanLabel(raw: string): string {
  return raw.replace(/\s+/g, " ").replace(/={2,}/g, "=").trim().slice(0, MAX_LABEL_LENGTH).trim();
}

/** The file name without the part before the first underscore (where learner names usually are) and without its extension. */
export function defaultLabelFromFileName(fileName: string): string {
  return cleanLabel(safeFileName(fileName).replace(/\.[^.]+$/, ""));
}

/** "Jane-Doe_budget.xlsx" -> "budget.xlsx". Learner names usually sit before the first underscore. */
export function safeFileName(fileName: string): string {
  const i = fileName.indexOf("_");
  return i >= 0 && i < fileName.length - 1 ? fileName.slice(i + 1) : fileName;
}

export interface AssembleResult {
  text: string;
  redactionCount: number;
  counts: Record<RedactionCategory, number>;
}

const EMPTY_COUNTS = (): Record<RedactionCategory, number> => ({ name: 0, email: 0, phone: 0, link: 0, id: 0, address: 0, postcode: 0, business: 0, other: 0 });

/**
 * Builds the text that is anonymised, previewed and sent for marking.
 *
 * Exactly one part and no links: just that part's text, anonymised, with no headers (single-submission marking is
 * exactly as before). Otherwise each part is anonymised on its own, with the same confirmed names and terms, and put
 * under a header "=== PART n: label (file name) ===", followed by a links section listing each link's label and kind.
 * Labels and file names are anonymised too, since they can contain a learner's name.
 */
export function assembleSubmission(parts: SubmissionPart[], links: SubmissionLink[], opts?: AnonymiseOptions): AssembleResult {
  const counts = EMPTY_COUNTS();
  const run = (raw: string) => {
    const out = anonymise(raw, opts);
    for (const k of Object.keys(counts) as RedactionCategory[]) counts[k] += out.counts[k];
    return out.text;
  };
  const finish = (text: string): AssembleResult => ({ text, redactionCount: Object.values(counts).reduce((a, b) => a + b, 0), counts });

  const usableLinks = links.map((l) => ({ label: cleanLabel(l.label), kind: linkKind(l.url) })).filter((l): l is { label: string; kind: LinkKind } => l.kind !== null);

  if (parts.length === 1 && usableLinks.length === 0) return finish(run(parts[0].text));

  const blocks = parts.map((p, i) => {
    const label = run(cleanLabel(p.label) || `Part ${i + 1}`);
    const file = p.fileName ? ` (${run(safeFileName(p.fileName))})` : "";
    return `=== PART ${i + 1}: ${label}${file} ===\n${run(p.text)}`;
  });
  if (usableLinks.length > 0) {
    const lines = usableLinks.map((l) => `- ${run(l.label || l.kind)} (${l.kind})`);
    blocks.push(`=== LINKS (not opened by AssisTED) ===\n${lines.join("\n")}`);
  }
  return finish(blocks.join("\n\n"));
}

// ---- Reading an assembled submission (server side) ----

export interface ParsedPart {
  number: number;
  label: string;
  text: string;
}

const PART_HEADER_RE = /^=== PART (\d+): (.*) ===$/;
const LINKS_HEADER = "=== LINKS (not opened by AssisTED) ===";

/** Splits an assembled submission into its parts and links. A single unlabelled submission has no parts and no links. */
export function parseSubmission(text: string): { parts: ParsedPart[]; links: LinkInfo[] } {
  const parts: ParsedPart[] = [];
  const links: LinkInfo[] = [];
  let current: { header: ParsedPart; lines: string[] } | null = null;
  let inLinks = false;
  const flush = () => {
    if (current) parts.push({ ...current.header, text: current.lines.join("\n") });
    current = null;
  };
  for (const line of text.split("\n")) {
    const m = PART_HEADER_RE.exec(line);
    // Headers must be numbered 1, 2, 3 in order, so text inside a file that imitates one is ignored.
    if (m && !inLinks && Number(m[1]) === parts.length + (current ? 1 : 0) + 1) {
      flush();
      // The label is shown without the "(file name)" that follows it in the header.
      const label = /^(.*) \([^()]+\.[A-Za-z0-9]{1,5}\)$/.exec(m[2])?.[1] ?? m[2];
      current = { header: { number: Number(m[1]), label, text: "" }, lines: [] };
    } else if (line === LINKS_HEADER && !inLinks && (current || parts.length > 0)) {
      flush();
      inLinks = true;
    } else if (inLinks) {
      const l = /^- (.*) \(([^()]*)\)$/.exec(line);
      if (l) links.push({ label: l[1], kind: l[2] as LinkKind });
    } else if (current) {
      current.lines.push(line);
    }
  }
  flush();
  return { parts, links };
}

/** Lower case, whitespace removed, curly quotes made straight: how a quote is compared with the text. */
function normalise(s: string): string {
  return s
    .replace(/[‘’‛]/g, "'")
    .replace(/[“”‟]/g, '"')
    .replace(/\s+/g, "")
    .toLowerCase();
}

/** The label of the first part that contains the quote, or undefined (no parts, or not found). */
export function partLabelForQuote(quote: string | null | undefined, parts: ParsedPart[]): string | undefined {
  if (!quote || parts.length === 0) return undefined;
  const q = normalise(quote);
  if (!q) return undefined;
  return parts.find((p) => normalise(p.text).includes(q))?.label;
}

interface QuoteEvidence {
  type: "quote" | "absence";
  text: string;
  from?: string;
}

/**
 * Adds a "from" label to every quote in a marking outcome (banded or complete) and a list of links that were not
 * opened. Does nothing for a single unlabelled submission, so that output is exactly as before.
 */
export function tagQuoteSources<T extends object>(outcome: T, submission: string): T & { links?: LinkInfo[] } {
  const { parts, links } = parseSubmission(submission);
  if (parts.length === 0 && links.length === 0) return outcome;
  const o = outcome as Record<string, unknown>;
  const tagEvidence = (e: unknown) => {
    const ev = e as QuoteEvidence | undefined;
    if (ev && ev.type === "quote") {
      const from = partLabelForQuote(ev.text, parts);
      if (from) ev.from = from;
    }
  };
  for (const p of (o.presenceEvidence as { quote: string | null; from?: string }[] | undefined) ?? []) {
    const from = partLabelForQuote(p.quote, parts);
    if (from) p.from = from;
  }
  for (const l of (o.checklist as { quote: string | null; from?: string }[] | undefined) ?? []) {
    const from = partLabelForQuote(l.quote, parts);
    if (from) l.from = from;
  }
  const notes = o.markerNotes as { explanationEvidence?: unknown; evidence?: unknown; nextStepNotes?: { evidence: unknown }[] } | undefined;
  if (notes) {
    tagEvidence(notes.explanationEvidence);
    tagEvidence(notes.evidence);
    for (const n of notes.nextStepNotes ?? []) tagEvidence(n.evidence);
  }
  return links.length > 0 ? Object.assign(outcome, { links }) : outcome;
}
