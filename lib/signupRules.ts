// Rules for the self sign-up domain list. Shared by the Users page (instant messages) and the server action.
// The database applies the same rules again in set_signup_settings, so this is a convenience, not the only guard.

export const MAX_SIGNUP_DOMAINS = 5;

export const FREE_MAIL_DOMAINS = [
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "yahoo.com",
  "icloud.com",
  "me.com",
  "proton.me",
  "protonmail.com",
];

const DOMAIN_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;

export type DomainCheck = { ok: true; domains: string[] } | { ok: false; message: string };

/** Lower-cases, trims and removes a leading @ and repeats. */
export function normaliseDomain(raw: string): string {
  return raw.trim().toLowerCase().replace(/^@/, "");
}

/** Checks one domain. Returns a plain-language problem, or null when it is fine. */
export function domainProblem(raw: string): string | null {
  const d = normaliseDomain(raw);
  if (!d || d.length > 253 || !DOMAIN_RE.test(d)) return "Enter a domain like techeducators.co.uk (no @ and no spaces).";
  if (FREE_MAIL_DOMAINS.includes(d)) return `${d} is a free email service, so anyone could sign up with it. Use your organisation's own domain.`;
  return null;
}

/** Checks a whole list. With enabled = true an empty list fails. */
export function validateDomains(list: string[], enabled: boolean): DomainCheck {
  const domains: string[] = [];
  for (const raw of list) {
    const problem = domainProblem(raw);
    if (problem) return { ok: false, message: problem };
    const d = normaliseDomain(raw);
    if (!domains.includes(d)) domains.push(d);
  }
  if (domains.length > MAX_SIGNUP_DOMAINS) return { ok: false, message: `You can allow at most ${MAX_SIGNUP_DOMAINS} domains.` };
  if (enabled && domains.length === 0) return { ok: false, message: "Add at least one domain before turning this on." };
  return { ok: true, domains };
}
