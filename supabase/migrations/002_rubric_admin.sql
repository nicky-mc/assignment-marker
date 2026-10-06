-- AssisTED: rubric management for admins. Run AFTER 001_init.sql, in the Supabase SQL editor. Safe to run twice.
-- Still holds rubrics, staff emails and roles only: never learner submissions, feedback or marks.

-- ---------- several versions of one rubric ----------
-- A rubric id can now have an approved version live and a newer draft being prepared, so the key becomes (id, version).

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.rubrics'::regclass and contype = 'p' and array_length(conkey, 1) = 2
  ) then
    alter table public.rubrics drop constraint rubrics_pkey;
    alter table public.rubrics add constraint rubrics_pkey primary key (id, version);
  end if;
end $$;

-- At most one approved version and one draft per rubric id.
create unique index if not exists rubrics_one_approved_idx on public.rubrics (id) where status = 'approved';
create unique index if not exists rubrics_one_draft_idx on public.rubrics (id) where status = 'draft';

-- ---------- history is written by the app, so the automatic trigger from 001 is removed (it would double-count) ----------

drop trigger if exists rubrics_history_trg on public.rubrics;
drop function if exists public.record_rubric_history();

-- ---------- courses, so a course can exist before its first rubric ----------

create table if not exists public.courses (
  id         text primary key,
  name       text not null,
  created_by text,
  created_at timestamptz not null default now()
);

insert into public.courses (id, name, created_by)
select distinct on (course_id) course_id, course_name, 'seed' from public.rubrics order by course_id, sort_order
on conflict (id) do nothing;

alter table public.courses enable row level security;
revoke all on public.courses from anon;

drop policy if exists "courses admin all" on public.courses;
create policy "courses admin all" on public.courses
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- nothing is ever deleted, and history can only be added to ----------

revoke delete on public.rubrics from authenticated;
revoke delete on public.courses from authenticated;
revoke update, delete on public.rubric_history from authenticated;

drop policy if exists "rubric_history admin insert" on public.rubric_history;
create policy "rubric_history admin insert" on public.rubric_history
  for insert to authenticated
  with check (public.is_admin() and changed_by = lower(auth.jwt() ->> 'email'));

-- ---------- approve: retire the old live version and approve the draft in one step ----------

create or replace function public.approve_rubric(p_id text, p_version integer, p_require_second boolean default false)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me text := lower(auth.jwt() ->> 'email');
  draft_row public.rubrics%rowtype;
  live_row public.rubrics%rowtype;
begin
  if not public.is_admin() then
    raise exception 'admin_required';
  end if;

  select * into draft_row from public.rubrics where id = p_id and version = p_version for update;
  if not found then
    raise exception 'not_found';
  end if;
  if draft_row.status <> 'draft' then
    raise exception 'not_a_draft';
  end if;
  if p_require_second and lower(coalesce(draft_row.created_by, '')) = me then
    raise exception 'second_approver_required';
  end if;

  select * into live_row from public.rubrics where id = p_id and status = 'approved' for update;
  if found then
    update public.rubrics set status = 'retired' where id = live_row.id and version = live_row.version;
    insert into public.rubric_history (rubric_id, version, action, changed_by, snapshot)
    select r.id, r.version, 'retired', me, to_jsonb(r) from public.rubrics r where r.id = live_row.id and r.version = live_row.version;
  end if;

  update public.rubrics set status = 'approved', approved_by = me, approved_at = now()
  where id = draft_row.id and version = draft_row.version;
  insert into public.rubric_history (rubric_id, version, action, changed_by, snapshot)
  select r.id, r.version, 'approved', me, to_jsonb(r) from public.rubrics r where r.id = draft_row.id and r.version = draft_row.version;
end;
$$;

revoke all on function public.approve_rubric(text, integer, boolean) from public, anon;
grant execute on function public.approve_rubric(text, integer, boolean) to authenticated;
