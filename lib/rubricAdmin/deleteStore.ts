import { createSupabaseServerClient } from "../auth/supabaseServer";

export interface DeletionRow {
  id: number;
  kind: "rubric" | "course";
  rubric_id: string | null;
  title: string | null;
  course_id: string | null;
  deleted_by: string | null;
  deleted_at: string;
}

/** The deletion log, newest first. Admins only (row-level security). Does not include the snapshots. */
export async function listDeletions(): Promise<DeletionRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("rubric_deletions")
    .select("id, kind, rubric_id, title, course_id, deleted_by, deleted_at")
    .order("deleted_at", { ascending: false })
    .limit(100);
  if (error) throw new Error("Could not read the deletion log.");
  return (data ?? []) as DeletionRow[];
}
