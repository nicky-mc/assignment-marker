// Checks the self sign-up domain rules. No network, no API, no database.
//   npx tsx scripts/check-signup-rules.ts
import { validateDomains } from "../lib/signupRules";

const cases: { label: string; run: () => boolean }[] = [
  { label: "techeducators.co.uk passes", run: () => validateDomains(["techeducators.co.uk"], true).ok },
  { label: "case and a leading @ are tidied", run: () => { const v = validateDomains([" @TechEducators.co.uk "], true); return v.ok && v.domains[0] === "techeducators.co.uk"; } },
  { label: "repeats are removed", run: () => { const v = validateDomains(["a.org", "A.org"], true); return v.ok && v.domains.length === 1; } },
  { label: "five domains pass", run: () => validateDomains(["a.org", "b.org", "c.org", "d.org", "e.org"], true).ok },
  { label: "six domains fail", run: () => !validateDomains(["a.org", "b.org", "c.org", "d.org", "e.org", "f.org"], true).ok },
  { label: "gmail.com fails", run: () => !validateDomains(["gmail.com"], true).ok },
  { label: "every free-mail domain fails", run: () => ["googlemail.com", "outlook.com", "hotmail.com", "live.com", "yahoo.com", "icloud.com", "me.com", "proton.me", "protonmail.com"].every((d) => !validateDomains([d], true).ok) },
  { label: "a free-mail domain in a list fails", run: () => !validateDomains(["techeducators.co.uk", "Gmail.com"], true).ok },
  { label: "no dot fails", run: () => !validateDomains(["techeducators"], true).ok },
  { label: "a space fails", run: () => !validateDomains(["tech educators.co.uk"], true).ok },
  { label: "an email address fails", run: () => !validateDomains(["me@techeducators.co.uk"], true).ok },
  { label: "a leading hyphen fails", run: () => !validateDomains(["-bad.co.uk"], true).ok },
  { label: "an empty list fails when enabling", run: () => !validateDomains([], true).ok },
  { label: "an empty list is fine when turning off", run: () => validateDomains([], false).ok },
];

let failed = 0;
for (const c of cases) {
  const ok = c.run();
  if (!ok) failed += 1;
  console.log(`${ok ? "PASS" : "FAIL"} | ${c.label}`);
}
console.log(`\n${cases.length - failed} of ${cases.length} passed`);
process.exit(failed === 0 ? 0 : 1);
