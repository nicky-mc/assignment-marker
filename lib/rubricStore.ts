// The one door to rubrics. The rest of the app (dropdowns, /api/mark) uses only this interface.
// Two implementations, chosen by RUBRIC_SOURCE:
//   file     reads lib/rubrics.ts, exactly as before (the default, and the seed for the database)
//   supabase reads approved rubrics from the database as the signed-in user (Row Level Security)
// There is deliberately no fallback from supabase to file: if the database is unreachable, it throws.
import { COURSES, RUBRICS, type Course, type Rubric } from "./rubrics";
import { authMode, rubricSource } from "./auth/config";
import { createSupabaseServerClient } from "./auth/supabaseServer";

export type RubricSourceName = "file" | "database";

export type StoredRubric = Rubric & { version: number; source: RubricSourceName };

export interface RubricStore {
  getRubric(id: string): Promise<StoredRubric | undefined>;
  listCourses(): Promise<Course[]>;
  listRubrics(courseId?: string): Promise<StoredRubric[]>;
}

export class RubricStoreError extends Error {}

const fileStore: RubricStore = {
  async getRubric(id) {
    const r = RUBRICS.find((x) => x.id === id);
    return r && { ...r, version: 1, source: "file" };
  },
  async listCourses() {
    return COURSES;
  },
  async listRubrics(courseId) {
    return RUBRICS.filter((r) => !courseId || r.courseId === courseId).map((r) => ({ ...r, version: 1, source: "file" as const }));
  },
};

interface RubricRow {
  id: string;
  course_id: string;
  course_name: string;
  week: string;
  title: string;
  overview: string;
  requirements: string;
  stretch_goal: string;
  band_descriptions: string[] | null;
  version: number;
}

const COLUMNS = "id, course_id, course_name, week, title, overview, requirements, stretch_goal, band_descriptions, version";

function fromRow(row: RubricRow): StoredRubric {
  return {
    id: row.id,
    courseId: row.course_id,
    week: row.week,
    title: row.title,
    overview: row.overview,
    requirements: row.requirements,
    stretchGoal: row.stretch_goal,
    ...(row.band_descriptions ? { bandDescriptions: row.band_descriptions } : {}),
    version: row.version,
    source: "database",
  };
}

async function approvedRows(filter?: { id?: string; courseId?: string }): Promise<RubricRow[]> {
  if (authMode() !== "on") {
    throw new RubricStoreError("RUBRIC_SOURCE=supabase needs AUTH_MODE=on, because rubrics are read with the signed-in user's session.");
  }
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("rubrics").select(COLUMNS).eq("status", "approved").order("sort_order");
  if (filter?.id) query = query.eq("id", filter.id);
  if (filter?.courseId) query = query.eq("course_id", filter.courseId);
  const { data, error } = await query;
  if (error) throw new RubricStoreError("Could not read rubrics from the database.");
  return (data ?? []) as RubricRow[];
}

const supabaseStore: RubricStore = {
  async getRubric(id) {
    const rows = await approvedRows({ id });
    return rows[0] ? fromRow(rows[0]) : undefined;
  },
  async listCourses() {
    const seen = new Map<string, Course>();
    for (const row of await approvedRows()) {
      if (!seen.has(row.course_id)) seen.set(row.course_id, { id: row.course_id, name: row.course_name });
    }
    return Array.from(seen.values());
  },
  async listRubrics(courseId) {
    return (await approvedRows({ courseId })).map(fromRow);
  },
};

function store(): RubricStore {
  return rubricSource() === "supabase" ? supabaseStore : fileStore;
}

export const getRubric: RubricStore["getRubric"] = (id) => store().getRubric(id);
export const listCourses: RubricStore["listCourses"] = () => store().listCourses();
export const listRubrics: RubricStore["listRubrics"] = (courseId) => store().listRubrics(courseId);
