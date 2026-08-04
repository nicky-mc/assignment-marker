export interface AnonymiseResult {
  text: string;
  redactionCount: number;
}

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// UK mobile/landline shapes: +44 7xxx xxx xxx, 07xxx xxxxxx, 0xxx xxx xxxx, with optional
// brackets/spaces/dots/dashes as separators.
const PHONE_RE = /\b(?:\+44\s?7\d{3}|\(?0\d{2,4}\)?)[\s.-]?\d{3,4}[\s.-]?\d{3,4}\b/g;

// A line that opens with a label like "Name:" or "Student ID -" naming who the work belongs to.
const LABELLED_LINE_RE =
  /^\s*(full name|student name|learner name|candidate name|name|student|learner|candidate|student id|candidate number|id number|submitted by|prepared by|written by|created by|author|from)\s*[:\-]\s*.+$/gim;

// "Hi, I'm Jane" / "Hello, I am Jane" / "My name is Jane" / "This is Jane" style self-introductions.
const GREETING_RE =
  /^\s*(?:(?:hi|hello|hey)[,!]?\s+)?(?:i'?m|i am|my name is|this is)\s+[A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+)?\b.*$/gim;

const SIGNOFF_WORDS =
  "regards|kind regards|best regards|warm regards|best wishes|many thanks|thank you|thanks|cheers|sincerely|yours sincerely|yours faithfully|best";

// "Regards, Jane Doe" all on one line.
const SIGNOFF_SAMELINE_RE = new RegExp(
  `^\\s*(?:${SIGNOFF_WORDS})\\s*,\\s*[A-Z][a-zA-Z'-]+(?:\\s+[A-Z][a-zA-Z'-]+)?\\s*$`,
  "gim",
);

// "Regards," on its own line, with the name on the line after - a very common sign-off shape.
const SIGNOFF_NEXTLINE_RE = new RegExp(
  `^\\s*(?:${SIGNOFF_WORDS})\\s*,?\\s*\\n+\\s*[A-Z][a-zA-Z'-]+(?:\\s+[A-Z][a-zA-Z'-]+)?\\s*$`,
  "gim",
);

// A line that is just "Jane Doe" or "Jane A. Doe" and nothing else - typical of a name printed
// as its own header/footer line, so only checked near the start/end of the document (see below).
const STANDALONE_NAME_LINE_RE = /^\s*[A-Z][a-z'-]+(?:\s[A-Z]\.)?\s+[A-Z][a-z'-]+\s*$/;

function redactBoundaryNameLines(text: string, tally: () => void): string {
  const lines = text.split("\n");
  const nonBlankIndices = lines
    .map((line, i) => ({ line, i }))
    .filter(({ line }) => line.trim().length > 0)
    .map(({ i }) => i);

  const boundary = new Set([...nonBlankIndices.slice(0, 3), ...nonBlankIndices.slice(-5)]);

  const redacted = lines.map((line, i) => {
    if (boundary.has(i) && STANDALONE_NAME_LINE_RE.test(line)) {
      tally();
      return "[redacted name]";
    }
    return line;
  });

  return redacted.join("\n");
}

export function anonymise(raw: string): AnonymiseResult {
  let redactionCount = 0;
  const tally = () => {
    redactionCount += 1;
  };

  let text = raw;
  text = text.replace(EMAIL_RE, () => {
    tally();
    return "[redacted email]";
  });
  text = text.replace(PHONE_RE, () => {
    tally();
    return "[redacted phone number]";
  });
  text = text.replace(LABELLED_LINE_RE, () => {
    tally();
    return "[redacted identifying line]";
  });
  text = text.replace(GREETING_RE, () => {
    tally();
    return "[redacted greeting]";
  });
  text = text.replace(SIGNOFF_NEXTLINE_RE, () => {
    tally();
    return "[redacted sign-off]";
  });
  text = text.replace(SIGNOFF_SAMELINE_RE, () => {
    tally();
    return "[redacted sign-off]";
  });
  text = redactBoundaryNameLines(text, tally);

  return { text, redactionCount };
}
