// The one door to rubrics. The rest of the app (dropdowns, /api/mark) uses only this interface.
// Two implementations, chosen by RUBRIC_SOURCE:
//   file     reads lib/rubrics.ts, exactly as before (the default, and the seed for the database)
//   supabase reads approved rubrics from the database as the signed-in user (Row Level Security)
// There is deliberately no fallback from supabase to file: if the database is unreachable, it throws.
import { BAND_DESCRIPTIONS, COURSES, RUBRICS, type Course, type Rubric } from "./rubrics";
import { authMode, rubricSource } from "./auth/config";
import { createSupabaseServerClient } from "./auth/supabaseServer";

export type RubricSourceName = "file" | "database";

export type StoredRubric = Rubric & { version: number; source: RubricSourceName };

/** Who is reading. Markers see only live (approved) rubrics; admins see every status. Decided on the server from the role. */
export type Viewer = "marker" | "admin";

export interface LibraryItem {
  id: string;
  courseId: string;
  courseName: string;
  week: string;
  title: string;
  overview: string;
  /** The version shown: the live one if there is one, otherwise the latest draft, otherwise the latest retired. */
  status: "approved" | "draft" | "retired";
  version: number;
  /** Admins only: a draft exists (any status above). */
  hasDraft: boolean;
  /** Admins only: a live version AND a newer draft exist. */
  draftPending: boolean;
}

export interface LibraryDetail extends LibraryItem {
  organisation: string;
  requirements: string;
  stretchGoal: string;
  /** Per-assignment band descriptions, or undefined when the generic policy bands apply. */
  bandDescriptions?: string[];
  genericBands: string[];
  source: RubricSourceName;
}

export interface RubricStore {
  getRubric(id: string): Promise<StoredRubric | undefined>;
  listCourses(): Promise<Course[]>;
  listRubrics(courseId?: string): Promise<StoredRubric[]>;
  /** Read-only library views. Markers never receive drafts or retired rubrics (and row-level security backs this up). */
  listLibrary(viewer: Viewer): Promise<LibraryItem[]>;
  getLibraryDetail(id: string, viewer: Viewer): Promise<LibraryDetail | undefined>;
}

export class RubricStoreError extends Error {}

function fileItem(r: Rubric): LibraryItem {
  return {
    id: r.id,
    courseId: r.courseId,
    courseName: COURSES.find((c) => c.id === r.courseId)?.name ?? r.courseId,
    week: r.week,
    title: r.title,
    overview: r.overview,
    status: "approved",
    version: 1,
    hasDraft: false,
    draftPending: false,
  };
}

const fileStore: RubricStore = {
  async listLibrary() {
    return RUBRICS.map(fileItem);
  },
  async getLibraryDetail(id) {
    const r = RUBRICS.find((x) => x.id === id);
    if (!r) return undefined;
    return {
      ...fileItem(r),
      organisation: "Tech Educators",
      requirements: r.requirements,
      stretchGoal: r.stretchGoal,
      bandDescriptions: r.bandDescriptions,
      genericBands: BAND_DESCRIPTIONS,
      source: "file",
    };
  },
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
  organisation?: string;
  status?: "draft" | "approved" | "retired";
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

const LIBRARY_COLUMNS = `${COLUMNS}, organisation, status`;

// Reads as the signed-in user, so row-level security applies whatever `viewer` says: a marker's session
// cannot see drafts or retired rubrics at all. For markers the query is also filtered to approved, as a second layer.
async function libraryRows(viewer: Viewer, id?: string): Promise<RubricRow[]> {
  if (authMode() !== "on") {
    throw new RubricStoreError("RUBRIC_SOURCE=supabase needs AUTH_MODE=on, because rubrics are read with the signed-in user's session.");
  }
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("rubrics").select(LIBRARY_COLUMNS).order("sort_order").order("version", { ascending: false });
  if (viewer === "marker") query = query.eq("status", "approved");
  if (id) query = query.eq("id", id);
  const { data, error } = await query;
  if (error) throw new RubricStoreError("Could not read rubrics from the database.");
  return (data ?? []) as unknown as RubricRow[];
}

function toItems(rows: RubricRow[]): { item: LibraryItem; row: RubricRow }[] {
  const byId = new Map<string, RubricRow[]>();
  for (const r of rows) byId.set(r.id, [...(byId.get(r.id) ?? []), r]);
  return Array.from(byId.values()).map((versions) => {
    const live = versions.find((v) => v.status === "approved");
    const draft = versions.find((v) => v.status === "draft");
    const primary = live ?? draft ?? versions[0]; // versions are newest first
    return {
      row: primary,
      item: {
        id: primary.id,
        courseId: primary.course_id,
        courseName: primary.course_name,
        week: primary.week,
        title: primary.title,
        overview: primary.overview,
        status: primary.status ?? "approved",
        version: primary.version,
        hasDraft: Boolean(draft),
        draftPending: Boolean(live && draft && draft.version > live.version),
      },
    };
  });
}

const supabaseStore: RubricStore = {
  async listLibrary(viewer) {
    return toItems(await libraryRows(viewer)).map((x) => x.item);
  },
  async getLibraryDetail(id, viewer) {
    const found = toItems(await libraryRows(viewer, id))[0];
    if (!found) return undefined;
    return {
      ...found.item,
      organisation: found.row.organisation ?? "",
      requirements: found.row.requirements,
      stretchGoal: found.row.stretch_goal,
      bandDescriptions: found.row.band_descriptions ?? undefined,
      genericBands: BAND_DESCRIPTIONS,
      source: "database",
    };
  },
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
export const listLibrary: RubricStore["listLibrary"] = (viewer) => store().listLibrary(viewer);
export const getLibraryDetail: RubricStore["getLibraryDetail"] = (id, viewer) => store().getLibraryDetail(id, viewer);
