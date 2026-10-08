// Loads lib/rubrics.ts into the rubrics table as approved, version 1. Safe to re-run: existing rows are left alone.
// Uses the secret key, so run it only on your own machine:
//   npx tsx --env-file=.env.local scripts/seed-rubrics.ts
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
  const now = new Date().toISOString();
  const rows = RUBRICS.map((r, i) => ({
    id: r.id,
    organisation: "Tech Educators",
    course_id: r.courseId,
    course_name: COURSES.find((c) => c.id === r.courseId)?.name ?? r.courseId,
    week: r.week,
    title: r.title,
    overview: r.overview,
    requirements: r.requirements,
    stretch_goal: r.stretchGoal,
    band_descriptions: r.bandDescriptions ?? null,
    grading_mode: r.gradingMode ?? "banded",
    checklist: r.gradingMode === "complete" ? (r.checklist ?? []) : [],
    version: 1,
    status: "approved",
    sort_order: i,
    created_by: "seed",
    approved_by: "seed",
    approved_at: now,
  }));
  const { error } = await supabase.from("rubrics").upsert(rows, { onConflict: "id", ignoreDuplicates: true });
  if (error) {
    console.error(`Seed failed: ${error.message}`);
    process.exit(1);
  }
  console.log(`Seeded ${rows.length} rubrics (existing rows left unchanged). Now run the read-back check.`);
}

main();
