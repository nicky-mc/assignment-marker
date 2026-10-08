// Round trip of the current rubrics through export and import, and through the database column mapping. No network,
// no API, no database.   npx tsx scripts/check-rubric-roundtrip.ts
import { COURSES, RUBRICS } from "../lib/rubrics";
import { rowToInput, rubricColumns, type RubricRow } from "../lib/rubricAdmin/store";
import { toExportShape, validateRubric, type RubricInput } from "../lib/rubricAdmin/validate";

let failed = 0;
const check = (label: string, ok: boolean, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : `  ${detail}`}`);
  if (!ok) failed++;
};

// What each current rubric looks like as an admin input (the file rubrics are all banded and carry no mode field).
const original: RubricInput[] = RUBRICS.map((r) => ({
  id: r.id,
  organisation: "Tech Educators",
  courseId: r.courseId,
  courseName: COURSES.find((c) => c.id === r.courseId)!.name,
  week: r.week,
  title: r.title,
  overview: r.overview,
  requirements: r.requirements,
  stretchGoal: r.stretchGoal,
  ...(r.bandDescriptions ? { bandDescriptions: r.bandDescriptions } : {}),
}));
check(`the current rubrics number 14`, original.length === 14, String(original.length));

// Export to JSON text, import it back through the validator.
const exported = JSON.stringify(original.map(toExportShape), null, 2);
const imported = (JSON.parse(exported) as unknown[]).map((item) => validateRubric(item));
check("every exported rubric imports cleanly", imported.every((v) => v.ok), imported.flatMap((v) => Object.values(v.errors)).join("; "));
const reExported = JSON.stringify(imported.map((v) => toExportShape(v.value!)), null, 2);
check("export, import, export is byte-identical", reExported === exported);
check("every current rubric is banded after the round trip", imported.every((v) => v.value!.gradingMode === "banded" && v.value!.checklist === undefined));
const same = imported.every((v, i) => {
  const { gradingMode: _g, ...rest } = v.value!;
  void _g;
  return JSON.stringify(rest) === JSON.stringify(toExportShape(original[i]) && (() => { const { gradingMode: _x, ...o } = toExportShape(original[i]); void _x; return o; })());
});
check("content identical to the originals (apart from the explicit mode)", same);

// An old export, with no grading mode or checklist at all, imports as banded.
const old = JSON.parse(JSON.stringify(original[0])) as Record<string, unknown>;
delete old.gradingMode;
delete old.checklist;
const oldV = validateRubric(old);
check("an old export without the new fields imports as banded", oldV.ok && oldV.value!.gradingMode === "banded");

// Through the database column mapping: input -> columns -> row -> input.
let dbOk = true;
for (const [i, inp] of imported.map((v) => v.value!).entries()) {
  const cols = rubricColumns(inp);
  const row = { ...cols, id: inp.id, version: 1 } as unknown as RubricRow;
  if (JSON.stringify(rowToInput(row)) !== JSON.stringify(inp)) {
    dbOk = false;
    console.log(`  mismatch at ${original[i].id}`);
  }
}
check("input -> database columns -> input is identical for all 14", dbOk);

// A complete rubric survives both round trips.
const complete = validateRubric({ ...original[0], id: "build-wk1-example", gradingMode: "complete", stretchGoal: "", bandDescriptions: undefined, checklist: ["Did A", "Did B", "Did C"] });
check("a complete rubric validates", complete.ok, JSON.stringify(complete.errors));
const cIn = complete.value!;
const cOut = validateRubric(JSON.parse(JSON.stringify(toExportShape(cIn))));
check("a complete rubric round-trips through export and import", cOut.ok && JSON.stringify(cOut.value) === JSON.stringify(cIn));
const cols = rubricColumns(cIn);
check("a complete rubric stores no stretch goal or bands, and its checklist", cols.grading_mode === "complete" && cols.stretch_goal === "" && cols.band_descriptions === null && cols.checklist.length === 3);
const cBack = rowToInput({ ...cols, id: cIn.id, version: 1 } as unknown as RubricRow);
check("a complete rubric round-trips through the database mapping", JSON.stringify(cBack) === JSON.stringify(cIn));
check("a banded rubric stores an empty checklist", JSON.stringify(rubricColumns(imported[0].value!).checklist) === "[]");

console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
