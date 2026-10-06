// Database operations for the rubric admin screens. Server only.
// Every function acts as the signed-in admin (their session, Row Level Security), never with the secret key.
// Callers must have passed requireAdmin() first. Nothing is ever deleted, and history rows are only added.
import { createSupabaseServerClient } from "../auth/supabaseServer";
import type { RubricInput } from "./validate";

export class AdminError extends Error {}

export interface RubricRow {
  id: string;
  version: number;
  organisation: string;
  course_id: string;
  course_name: string;
  week: string;
  title: string;
  overview: string;
  requirements: string;
  stretch_goal: string;
  band_descriptions: string[] | null;
  status: "draft" | "approved" | "retired";
  sort_order: number;
  created_by: string | null;
  approved_by: string | null;
  created_at: string;
  approved_at: string | null;
}

export interface HistoryRow {
  id: number;
  rubric_id: string;
  version: number;
  action: string;
  changed_by: string | null;
  changed_at: string;
  snapshot: unknown;
}

export interface CourseRow {
  id: string;
  name: string;
}

export type HistoryAction = "created" | "edited" | "submitted" | "approved" | "retired" | "imported";

type Client = Awaited<ReturnType<typeof createSupabaseServerClient>>;

const fail = (what: string): never => {
  throw new AdminError(`Could not ${what}. Nothing was changed, or the change may be partial: please check the rubric page.`);
};

export function rowToInput(row: RubricRow): RubricInput {
  return {
    id: row.id,
    organisation: row.organisation,
    courseId: row.course_id,
    courseName: row.course_name,
    week: row.week,
    title: row.title,
    overview: row.overview,
    requirements: row.requirements,
    stretchGoal: row.stretch_goal,
    ...(row.band_descriptions ? { bandDescriptions: row.band_descriptions } : {}),
  };
}

function columns(input: RubricInput) {
  return {
    organisation: input.organisation,
    course_id: input.courseId,
    course_name: input.courseName,
    week: input.week,
    title: input.title,
    overview: input.overview,
    requirements: input.requirements,
    stretch_goal: input.stretchGoal,
    band_descriptions: input.bandDescriptions ?? null,
  };
}

async function logHistory(supabase: Client, email: string, row: RubricRow, action: HistoryAction) {
  const { error } = await supabase.from("rubric_history").insert({
    rubric_id: row.id,
    version: row.version,
    action,
    changed_by: email,
    snapshot: row,
  });
  if (error) fail("record the history entry");
}

export async function listCourseRows(): Promise<CourseRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("courses").select("id, name").order("name");
  if (error) fail("read courses");
  return (data ?? []) as CourseRow[];
}

export async function listAllRows(): Promise<{ rows: RubricRow[]; lastChange: Map<string, { by: string | null; at: string }> }> {
  const supabase = await createSupabaseServerClient();
  const [rubrics, history] = await Promise.all([
    supabase.from("rubrics").select("*").order("sort_order").order("version", { ascending: false }),
    supabase.from("rubric_history").select("rubric_id, version, changed_by, changed_at").order("changed_at", { ascending: false }),
  ]);
  if (rubrics.error || history.error) fail("read rubrics");
  const lastChange = new Map<string, { by: string | null; at: string }>();
  for (const h of (history.data ?? []) as { rubric_id: string; version: number; changed_by: string | null; changed_at: string }[]) {
    const key = `${h.rubric_id}@${h.version}`;
    if (!lastChange.has(key)) lastChange.set(key, { by: h.changed_by, at: h.changed_at });
  }
  return { rows: (rubrics.data ?? []) as RubricRow[], lastChange };
}

export async function getDetail(id: string): Promise<{ versions: RubricRow[]; history: HistoryRow[] }> {
  const supabase = await createSupabaseServerClient();
  const [versions, history] = await Promise.all([
    supabase.from("rubrics").select("*").eq("id", id).order("version", { ascending: false }),
    supabase.from("rubric_history").select("*").eq("rubric_id", id).order("changed_at", { ascending: false }),
  ]);
  if (versions.error || history.error) fail("read the rubric");
  return { versions: (versions.data ?? []) as RubricRow[], history: (history.data ?? []) as HistoryRow[] };
}

export async function createCourse(email: string, id: string, name: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("courses").insert({ id, name, created_by: email });
  if (error) {
    throw new AdminError(error.code === "23505" ? "That course id is already used." : "Could not create the course.");
  }
}

async function ensureCourse(supabase: Client, email: string, input: RubricInput) {
  const { data, error } = await supabase.from("courses").select("id").eq("id", input.courseId).maybeSingle();
  if (error) fail("check the course");
  if (!data) {
    const created = await supabase.from("courses").insert({ id: input.courseId, name: input.courseName, created_by: email });
    if (created.error) fail("create the course");
  }
}

async function nextSortOrder(supabase: Client): Promise<number> {
  const { data } = await supabase.from("rubrics").select("sort_order").order("sort_order", { ascending: false }).limit(1);
  return ((data?.[0]?.sort_order as number | undefined) ?? -1) + 1;
}

async function latestRow(supabase: Client, id: string): Promise<RubricRow | null> {
  const { data, error } = await supabase.from("rubrics").select("*").eq("id", id).order("version", { ascending: false }).limit(1);
  if (error) fail("read the rubric");
  return ((data ?? [])[0] as RubricRow | undefined) ?? null;
}

/** Brand-new rubric: always a draft, version 1. */
export async function createRubric(email: string, input: RubricInput, action: HistoryAction = "created"): Promise<RubricRow> {
  const supabase = await createSupabaseServerClient();
  await ensureCourse(supabase, email, input);
  const { data, error } = await supabase
    .from("rubrics")
    .insert({ id: input.id, version: 1, status: "draft", sort_order: await nextSortOrder(supabase), created_by: email, ...columns(input) })
    .select("*")
    .single();
  if (error || !data) {
    throw new AdminError(error?.code === "23505" ? "That id is already used." : "Could not save the rubric.");
  }
  await logHistory(supabase, email, data as RubricRow, action);
  return data as RubricRow;
}

/**
 * Edit or import onto an existing rubric. An existing draft is updated in place; otherwise (the latest
 * version is approved or retired) a NEW draft is created at version + 1. Approved versions are never touched.
 */
export async function saveNewVersion(email: string, input: RubricInput, action: "edited" | "imported"): Promise<RubricRow> {
  const supabase = await createSupabaseServerClient();
  const latest = await latestRow(supabase, input.id);
  if (!latest) return createRubric(email, input, action === "imported" ? "imported" : "created");
  await ensureCourse(supabase, email, input);

  let saved: RubricRow;
  if (latest.status === "draft") {
    const { data, error } = await supabase
      .from("rubrics")
      .update(columns(input))
      .eq("id", latest.id)
      .eq("version", latest.version)
      .select("*")
      .single();
    if (error || !data) return fail("save the draft");
    saved = data as RubricRow;
  } else {
    const { data, error } = await supabase
      .from("rubrics")
      .insert({ id: latest.id, version: latest.version + 1, status: "draft", sort_order: latest.sort_order, created_by: email, ...columns(input) })
      .select("*")
      .single();
    if (error || !data) return fail("save the new draft");
    saved = data as RubricRow;
  }
  await logHistory(supabase, email, saved, action);
  return saved;
}

export async function submitDraft(email: string, id: string, version: number): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("rubrics").select("*").eq("id", id).eq("version", version).maybeSingle();
  if (error) fail("read the rubric");
  if (!data || (data as RubricRow).status !== "draft") throw new AdminError("Only a draft can be submitted for approval.");
  await logHistory(supabase, email, data as RubricRow, "submitted");
}

export async function approveDraft(email: string, id: string, version: number, requireSecond: boolean): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("rubrics").select("created_by, status").eq("id", id).eq("version", version).maybeSingle();
  if (requireSecond && data && (data.created_by ?? "").toLowerCase() === email.toLowerCase()) {
    throw new AdminError("A different admin must approve this draft, because you created it.");
  }
  const { error } = await supabase.rpc("approve_rubric", { p_id: id, p_version: version, p_require_second: requireSecond });
  if (error) {
    if (error.message.includes("second_approver_required")) throw new AdminError("A different admin must approve this draft, because you created it.");
    if (error.message.includes("not_a_draft")) throw new AdminError("Only a draft can be approved.");
    if (error.message.includes("admin_required")) throw new AdminError("Only admins can approve.");
    throw new AdminError("Could not approve. Nothing was changed.");
  }
}

export async function retireApproved(email: string, id: string, version: number): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("rubrics")
    .update({ status: "retired" })
    .eq("id", id)
    .eq("version", version)
    .eq("status", "approved")
    .select("*")
    .maybeSingle();
  if (error) fail("retire the rubric");
  if (!data) throw new AdminError("Only an approved version can be retired.");
  await logHistory(supabase, email, data as RubricRow, "retired");
}

/** The draft of a rubric, for an admin trying it out. Never used for real marking. */
export async function getDraftRow(id: string): Promise<RubricRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("rubrics").select("*").eq("id", id).eq("status", "draft").maybeSingle();
  if (error) fail("read the draft");
  return (data as RubricRow | null) ?? null;
}

/** The latest version of one rubric, or of every rubric, in the Import/Export shape. */
export async function exportRows(id?: string, version?: number): Promise<RubricRow[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("rubrics").select("*").order("sort_order").order("version", { ascending: false });
  if (id) query = query.eq("id", id);
  if (id && version) query = query.eq("version", version);
  const { data, error } = await query;
  if (error) fail("read rubrics");
  const seen = new Set<string>();
  const latest: RubricRow[] = [];
  for (const r of (data ?? []) as RubricRow[]) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    latest.push(r);
  }
  return latest;
}
