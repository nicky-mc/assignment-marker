// Local-only anonymiser. No network calls, no logging of text. Every quantifier is bounded or
// unambiguous so no input can make a pattern run for more than a few milliseconds.
//
// Patterns that need Unicode property escapes or lookbehind are built with new RegExp(String.raw`...`)
// so they work whatever the TypeScript target is. The i flag is never combined with \p{Lu}.

export type RedactionCategory = "name" | "email" | "phone" | "link" | "id" | "address" | "postcode" | "business" | "other";

export interface AnonymiseOptions {
  /** Marker-confirmed name parts to remove wherever they appear, e.g. ["Jane", "Doe"]. */
  names?: string[];
  /** Marker-chosen business or other terms to remove, replaced by [BUSINESS]. Same matching as names. */
  terms?: string[];
}

export interface AnonymiseResult {
  text: string;
  redactionCount: number;
  counts: Record<RedactionCategory, number>;
}

const EMAIL_RE = /[a-zA-Z0-9._%+-]{1,64}@[a-zA-Z0-9.-]{1,255}\.[a-zA-Z]{2,24}/g;

const URL_RE = /https?:\/\/[^\s<>()"']{1,300}/gi;

// A bare domain such as linkedin.com/in/janedoe, with an optional path.
const DOMAIN_RE =
  /\b[a-z0-9-]{1,63}(?:\.[a-z0-9-]{1,63}){0,3}\.(?:com|co\.uk|org\.uk|org|net|io|uk|dev|app|me|ai|edu|gov|info|biz|xyz|shop|store|blog|online|site|eu)\b(?:\/[^\s<>()"']{0,200})?/gi;

// A bare www. address with any ending: www.sunnysidebakes.bakery, www.example.zzz/menu.
const WWW_RE = /\bwww\.[a-z0-9-]{1,63}(?:\.[a-z0-9-]{1,63}){1,3}(?:\/[^\s<>()"']{0,200})?/gi;

const HANDLE_RE = new RegExp(String.raw`(?<![\w@])@[A-Za-z0-9_]{2,30}\b`, "g");

// +44 followed by 9 or 10 digits, with optional separators and an optional (0).
const PHONE_INTL_RE = /\+44[\s.-]?(?:\(0\)[\s.-]?)?\d(?:[\s.-]?\d){8,9}(?!\d)/g;

// UK 0-prefixed numbers: 07xxx xxxxxx, 020 7946 0123, (020) 7946 0123.
const PHONE_UK_RE = new RegExp(String.raw`(?<![\d])\(?0\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}(?!\d)`, "g");

const NI_RE = /\b[A-Z]{2}[ ]?\d{2}[ ]?\d{2}[ ]?\d{2}[ ]?[A-D]\b/g;

const DOB_LABEL = String.raw`(?:dob|d\.o\.b\.?|date of birth|born)`;
const DOB_DATE = String.raw`(?:\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}|\d{1,2}(?:st|nd|rd|th)?[ ]+[a-z]{3,9}[ ]+\d{4})`;
const DOB_RE = new RegExp(String.raw`\b${DOB_LABEL}[ \t]{0,3}:?[ \t]{0,3}(?:on[ ]+)?${DOB_DATE}`, "gi");

const SORT_CODE_RE = /(?<!\d)\d{2}-\d{2}-\d{2}(?!\d)/g;

// Letters then 5 or more digits: company numbers, ICO and VAT numbers (ZA000123, GB123456789).
const LETTER_ID_RE = /\b[A-Z]{1,3}\d{5,12}\b/g;

// Any run of 8 or more digits: account numbers, company numbers.
const LONG_DIGITS_RE = /(?<!\d)\d{8,}(?!\d)/g;

const POSTCODE_RE = /\b[A-Z]{1,2}\d[A-Z\d]?[ ]?\d[A-Z]{2}\b/g;

const STREET_TYPES =
  "Road|Street|Lane|Avenue|Close|Drive|Court|Place|Gardens|Crescent|Terrace|Square|Grove|Mews|Park|Walk";
const ADDRESS_RE = new RegExp(
  String.raw`\b\d{1,4}[A-Za-z]?[ ]+(?:\p{Lu}[\p{L}'’-]{1,20}[ ]+){1,3}(?:${STREET_TYPES})\b`,
  "gu",
);

// A line that opens with a cover-sheet label and a colon, e.g. "Name: Jane Doe".
const LABELLED_LINE_RE =
  /^[ \t]*(?:full name|student name|learner name|candidate name|name|student id|candidate number|submitted by|prepared by|written by|author)[ \t]*:[^\r\n]+$/gim;

// "Hi, I'm Jane" / "I am Jane Doe" / "My name is Jane": only the name is removed, not the rest of the line.
const GREETING_RE = new RegExp(
  String.raw`^([ \t]*(?:(?:[Hh]i|[Hh]ello|[Hh]ey)[,!]?[ \t]+)?(?:[Ii]['’]m|[Ii] am|[Mm]y name is)[ \t]+)\p{Lu}[\p{L}'’-]{1,30}(?:[ \t]+\p{Lu}[\p{L}'’-]{1,30})?`,
  "gmu",
);

const SIGNOFF = String.raw`(?:(?:[Kk]ind|[Bb]est|[Ww]arm)[ ]+[Rr]egards|[Rr]egards|[Bb]est[ ]+wishes|[Mm]any[ ]+thanks|[Tt]hank[ ]+you|[Tt]hanks|[Cc]heers|[Ss]incerely|[Yy]ours[ ]+(?:sincerely|faithfully)|[Bb]est)`;
// A sign-off name must start with a capital letter, so "Best" then "practice matters" is left alone.
const SIGNOFF_NAME = String.raw`\p{Lu}[\p{L}'’-]{0,30}(?:[ \t]+\p{Lu}[\p{L}'’-]{0,30}){0,2}`;

// "Regards, Jane Doe" all on one line.
const SIGNOFF_SAMELINE_RE = new RegExp(
  String.raw`^[ \t]*${SIGNOFF}[ \t]*,[ \t]*${SIGNOFF_NAME}[ \t]*(?=\r?$)`,
  "gmu",
);

// "Regards," on its own line, with the name on the next line.
const SIGNOFF_NEXTLINE_RE = new RegExp(
  String.raw`^[ \t]*${SIGNOFF}[ \t]*,?[ \t]*\r?\n[ \t]*${SIGNOFF_NAME}[ \t]*(?=\r?$)`,
  "gmu",
);

const PLACEHOLDERS: Record<RedactionCategory, string> = {
  name: "[NAME]",
  email: "[EMAIL]",
  phone: "[PHONE]",
  link: "[LINK]",
  id: "[ID]",
  address: "[ADDRESS]",
  postcode: "[POSTCODE]",
  business: "[BUSINESS]",
  other: "[REDACTED]",
};

const MAX_NAME_PARTS = 50;
const MAX_NAME_LENGTH = 60;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildWordsRegExp(names: string[] | undefined): RegExp | null {
  const parts = Array.from(
    new Set(
      (names ?? [])
        .map((n) => n.trim())
        .filter((n) => n.length > 0 && n.length <= MAX_NAME_LENGTH),
    ),
  )
    .slice(0, MAX_NAME_PARTS)
    .sort((a, b) => b.length - a.length);
  if (parts.length === 0) return null;
  const alternatives = parts.map(escapeRegExp).join("|");
  // Whole word only (a hyphen is not a word character here, so "Jane-Doe" matches both parts),
  // with an optional possessive, in any case.
  return new RegExp(String.raw`(?<![\p{L}\p{N}_])(?:${alternatives})(?:['’]s)?(?![\p{L}\p{N}_])`, "giu");
}

export function anonymise(raw: string, opts?: AnonymiseOptions): AnonymiseResult {
  const counts: Record<RedactionCategory, number> = {
    name: 0,
    email: 0,
    phone: 0,
    link: 0,
    id: 0,
    address: 0,
    postcode: 0,
    business: 0,
    other: 0,
  };

  let text = raw;
  const redact = (re: RegExp, category: RedactionCategory) => {
    text = text.replace(re, () => {
      counts[category] += 1;
      return PLACEHOLDERS[category];
    });
  };

  redact(EMAIL_RE, "email");
  redact(URL_RE, "link");
  redact(WWW_RE, "link");
  redact(DOMAIN_RE, "link");
  redact(HANDLE_RE, "link");
  redact(PHONE_INTL_RE, "phone");
  redact(DOB_RE, "id");
  redact(SORT_CODE_RE, "id");
  redact(NI_RE, "id");
  redact(LETTER_ID_RE, "id");
  redact(PHONE_UK_RE, "phone");
  redact(LONG_DIGITS_RE, "id");
  redact(POSTCODE_RE, "postcode");
  redact(ADDRESS_RE, "address");
  redact(LABELLED_LINE_RE, "other");

  text = text.replace(GREETING_RE, (_m, lead: string) => {
    counts.name += 1;
    return `${lead}${PLACEHOLDERS.name}`;
  });
  redact(SIGNOFF_NEXTLINE_RE, "name");
  redact(SIGNOFF_SAMELINE_RE, "name");

  const termsRe = buildWordsRegExp(opts?.terms);
  if (termsRe) redact(termsRe, "business");
  const namesRe = buildWordsRegExp(opts?.names);
  if (namesRe) redact(namesRe, "name");

  const redactionCount = Object.values(counts).reduce((a, b) => a + b, 0);
  return { text, redactionCount, counts };
}

// ---- Suggestions for the "Check before marking" panel ----

export interface TermSuggestion {
  term: string;
  count: number;
}

const STOP_WORDS = new Set(
  "a an and are as at be but by for from has have he her his how i if in is it its my of on or our she so than that the their them then there these they this those to was we were what when where which who why will with you your also however because after before while although since both each every some any all one two three first second third finally overall therefore moreover furthermore instead given according under over between during".split(
    " ",
  ),
);

const ALLOWED_WORDS = new Set(
  `gdpr ai uk eu us usa ico hmrc fca ofcom cma act acts law laws legal privacy data protection contract contracts employment copyright consumer rights intellectual property company companies regulation regulations directive bill code policy terms conditions liability tort negligence trademark patent confidentiality consent compliance equality discrimination health safety table row col
  google microsoft stripe gohighlevel highlevel chatgpt claude gemini gems gem notebooklm copilot openai anthropic zapier slack notion canva excel word powerpoint zoom whatsapp linkedin facebook instagram tiktok youtube mailchimp shopify xero hubspot salesforce airtable midjourney perplexity github gmail drive docs sheets slides teams outlook meta amazon apple aws azure wordpress wix squarespace paypal zendesk intercom calendly typeform trello asana
  january february march april may june july august september october november december monday tuesday wednesday thursday friday saturday sunday
  tech educators digital innovators literacy dmai`.split(/\s+/),
);

const CAP_PHRASE_RE = new RegExp(
  String.raw`\p{Lu}[\p{L}\p{N}'’&-]{0,40}(?:[ ]\p{Lu}[\p{L}\p{N}'’&-]{0,40}){0,3}`,
  "gu",
);

function isSentenceStart(text: string, index: number): boolean {
  let i = index - 1;
  while (i >= 0 && (text[i] === " " || text[i] === "\t")) i--;
  if (i < 0) return true;
  const c = text[i];
  if (c === "\n" || c === "\r" || c === "." || c === "!" || c === "?" || c === ":" || c === "•" || c === "-" || c === "*" || c === "|" || c === "/" || c === "]" || c === ")") return true;
  return /\d/.test(c);
}

/**
 * Capitalised words or phrases in the original text that appear mid-sentence or 3 or more times and are
 * not on the allowlist. They are candidates for business or personal names the marker may want to remove.
 */
export function suggestTerms(text: string, exclude: string[] = []): TermSuggestion[] {
  const excluded = new Set(exclude.map((e) => e.trim().toLowerCase()).filter(Boolean));
  const stats = new Map<string, { count: number; mid: number }>();
  for (const m of text.matchAll(CAP_PHRASE_RE)) {
    const index = m.index ?? 0;
    if (index > 0 && text[index - 1] === "[") continue;
    const sentenceStart = isSentenceStart(text, index);
    let words = m[0].split(" ");
    // Drop leading and trailing common words ("The Risk Appetite" -> "Risk Appetite").
    let startedMid = !sentenceStart;
    while (words.length > 0 && STOP_WORDS.has(words[0].toLowerCase())) {
      words = words.slice(1);
      startedMid = true;
    }
    while (words.length > 0 && STOP_WORDS.has(words[words.length - 1].toLowerCase())) words = words.slice(0, -1);
    if (words.length === 0) continue;
    const term = words.join(" ");
    if (term.length < 2) continue;
    const lower = term.toLowerCase();
    if (excluded.has(lower) || words.some((w) => excluded.has(w.toLowerCase()))) continue;
    if (words.every((w) => ALLOWED_WORDS.has(w.toLowerCase()))) continue;
    const entry = stats.get(term) ?? { count: 0, mid: 0 };
    entry.count += 1;
    if (startedMid) entry.mid += 1;
    stats.set(term, entry);
  }
  return Array.from(stats, ([term, { count, mid }]) => ({ term, count, mid }))
    .filter((s) => s.mid >= 1 || s.count >= 3)
    .sort((a, b) => b.count - a.count || a.term.localeCompare(b.term))
    .slice(0, 40)
    .map(({ term, count }) => ({ term, count }));
}
