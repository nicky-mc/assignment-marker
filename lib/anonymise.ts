const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const NAME_LINE_RE = /^\s*(name|student|submitted by|author)\s*[:\-]\s*.+$/gim;
const GREETING_RE = /^\s*(hi|hello|hey)[,!]?\s+(i'?m|i am|this is)\s+[A-Z][a-zA-Z'-]+.*$/gim;

export interface AnonymiseResult {
  text: string;
  redactionCount: number;
}

export function anonymise(raw: string): AnonymiseResult {
  let redactionCount = 0;
  let text = raw;

  text = text.replace(EMAIL_RE, () => {
    redactionCount += 1;
    return "[redacted email]";
  });
  text = text.replace(NAME_LINE_RE, () => {
    redactionCount += 1;
    return "[redacted identifying line]";
  });
  text = text.replace(GREETING_RE, () => {
    redactionCount += 1;
    return "[redacted greeting]";
  });

  return { text, redactionCount };
}
