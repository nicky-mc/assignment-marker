// Reads the rubrics table back and confirms it matches lib/rubrics.ts field by field. Prints PASS or FAIL per rubric.
//   npx tsx --env-file=.env.local scripts/check-rubrics-db.ts
import { createClient } from "@supabase/supabase-js";
import { COURSES, RUBRICS } from "../lib/rubrics";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (!url || !secretKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY. Run with --env-file=.env.local from the repo root.");
  process.exit(1);
}

const supabase = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });

async function main() {
  const { data, error } = await supabase.from("rubrics").select("*").order("sort_order");
  if (error) {
    console.error(`Could not read rubrics: ${error.message}`);
    process.exit(1);
  }
  const rows = new Map((data ?? []).map((r) => [r.id as string, r]));
  let failed = 0;

  RUBRICS.forEach((r, i) => {
    const row = rows.get(r.id);
    const problems: string[] = [];
    if (!row) {
      problems.push("not in database");
    } else {
      const expected: Record<string, unknown> = {
        organisation: "Tech Educators",
        course_id: r.courseId,
        course_name: COURSES.find((c) => c.id === r.courseId)?.name,
        week: r.week,
        title: r.title,
        overview: r.overview,
        requirements: r.requirements,
        stretch_goal: r.stretchGoal,
        band_descriptions: r.bandDescriptions ?? null,
        status: "approved",
        sort_order: i,
      };
      for (const [field, want] of Object.entries(expected)) {
        if (JSON.stringify(row[field]) !== JSON.stringify(want)) problems.push(field);
      }
      if (row.version !== 1) problems.push(`version is ${row.version}, expected 1 for a fresh seed`);
    }
    if (problems.length) failed++;
    console.log(`${problems.length ? "FAIL" : "PASS"} | ${r.id.padEnd(36)} | ${problems.join(", ")}`);
  });

  const extra = [...rows.keys()].filter((id) => !RUBRICS.some((r) => r.id === id));
  if (extra.length) console.log(`Note: ${extra.length} rubric(s) in the database are not in lib/rubrics.ts: ${extra.join(", ")}`);

  console.log(`\n${RUBRICS.length - failed} of ${RUBRICS.length} match`);
  process.exit(failed ? 1 : 0);
}

main();
