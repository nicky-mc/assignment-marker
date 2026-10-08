// Keeps the How to page honest. No network, no API.   npx tsx scripts/check-how-to-example.ts
// 1. The "what AssisTED sends" example is produced by the real anonymiser: check it still hides what the page says it
//    hides, and still leaves visible what the page says it can miss. If the code improves, update the example.
// 2. The page copy has no em or en dashes, and no mention of a borderline flag or a score.
import { readFileSync } from "node:fs";
import { anonymise } from "../lib/anonymise";
import { ANONYMISING, EXAMPLE_RESULT, HOW_TO } from "../content/how-to";

let failed = 0;
const check = (label: string, ok: boolean, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : `  ${detail}`}`);
  if (!ok) failed++;
};

const after = anonymise(ANONYMISING.before).text;
for (const ph of ["[NAME]", "[EMAIL]", "[PHONE]", "[LINK]", "[ADDRESS]", "[POSTCODE]"]) check(`example is hidden as ${ph}`, after.includes(ph));
for (const raw of ["Jo Example", "jo@sunnysidebakery.co.uk", "07700 900123", "@sunnysidebakes", "14 Mill Lane", "BA13 4AA"]) check(`"${raw}" is no longer in the text sent`, !after.includes(raw));
for (const m of ANONYMISING.missed) check(`"${m.text}" (${m.label}) is still visible, as the page says`, after.includes(m.text), "the code now hides it: update the page");

const copy = JSON.stringify({ HOW_TO, ANONYMISING, EXAMPLE_RESULT }) + readFileSync("app/how-to/page.tsx", "utf8");
check("no em or en dashes in the page copy", !/[–—]/.test(copy));
check("no mention of borderline or a score in the page copy", !/borderline|raw ?score|\bscore\b/i.test(copy.replace(/ceilingBand|rawScore/g, "")), (copy.match(/borderline|raw ?score|\bscore\b/gi) ?? []).join(","));
check("the example result carries no score or borderline fields", !("rawScore" in EXAMPLE_RESULT) && !("borderline" in EXAMPLE_RESULT));
const CARD_LINE = "Staff will review the evidence and agree or not as appropriate.";
check("step 5 has the staff review sentence, with context", HOW_TO.steps.some((s) => "note" in s && s.note === "Whatever AssisTED suggests, staff review the evidence and agree or not as appropriate."));
check("the exact result card line is not repeated in the page copy", !copy.includes(CARD_LINE));
check("the result card shows the line in both banded and complete results", (readFileSync("components/ResultCard.tsx", "utf8").match(/\{STAFF_REVIEW_LINE\}/g) ?? []).length === 2);
check("the Privacy card uses the agreed wording", JSON.stringify(HOW_TO.goodToKnow).includes("AssisTED hides the names and contact details it recognises, and you check the rest before marking. AssisTED is designed not to keep submissions, feedback or marks."));
const step3 = HOW_TO.steps[2] as { body: string; link?: { text: string; href: string } };
check("step 3 links to the anonymising section", step3.link?.href === "#anon-heading" && readFileSync("app/how-to/page.tsx", "utf8").includes('id="anon-heading"'));
check("the lists match the code: .shop is hidden, .bakery is not", anonymise("a sunnysidebakes.shop b").text.includes("[LINK]") && anonymise("a sunnysidebakes.bakery b").text.includes("sunnysidebakes.bakery"));

console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
