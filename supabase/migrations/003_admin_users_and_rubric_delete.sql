-- AssisTED: user management and deleting rubrics or empty courses. Run AFTER 001 and 002, in the Supabase SQL editor.
-- One script that succeeds or fails as a whole (it runs in a single transaction), and is safe to run twice.
-- Still holds rubrics, staff emails and roles only: never learner submissions, feedback or marks.
--
-- What this changes from 001 and 002 (everything else is untouched):
--   * policy "allowed_users admin all" (001) is replaced by "allowed_users admin read": admins can now only READ allowed_users.
--   * insert, update and delete on public.allowed_users are revoked from authenticated: changes go through the functions below.
--   * is_admin(), is_allowed(), approve_rubric(), the rubrics and courses policies, and the "allowed_users read own row" policy
--     are not changed. They are security definer or read-only, so they keep working.
--   * rubric_history has no foreign key or cascade to rubrics (checked in 001), so its rows already survive a delete. No change.
--   * 002 blocks deletes by REVOKING the delete privilege from authenticated (there is no trigger). The delete functions below are
--     security definer, so they run as the table owner and can delete; direct deletes by anyone through the API stay blocked.

begin;

-- ---------- audit tables (read-only for admins, nobody can write directly) ----------

create table if not exists public.user_access_history (
  id         bigserial primary key,
  email      text not null,
  action     text not null check (action in ('added', 'role_changed', 'removed')),
  old_role   text,
  new_role   text,
  changed_by text,
  changed_at timestamptz not null default now()
);

create table if not exists public.rubric_deletions (
  id         bigserial primary key,
  kind       text not null default 'rubric' check (kind in ('rubric', 'course')),
  rubric_id  text,
  title      text,
  course_id  text,
  snapshot   jsonb not null,
  deleted_by text,
  deleted_at timestamptz not null default now()
);

create index if not exists user_access_history_changed_at_idx on public.user_access_history (changed_at desc);
create index if not exists rubric_deletions_deleted_at_idx on public.rubric_deletions (deleted_at desc);

alter table public.user_access_history enable row level security;
alter table public.rubric_deletions enable row level security;

revoke all on public.user_access_history from anon;
revoke all on public.rubric_deletions from anon;
revoke insert, update, delete on public.user_access_history from authenticated;
revoke insert, update, delete on public.rubric_deletions from authenticated;

drop policy if exists "user_access_history admin read" on public.user_access_history;
create policy "user_access_history admin read" on public.user_access_history
  for select to authenticated using (public.is_admin());

drop policy if exists "rubric_deletions admin read" on public.rubric_deletions;
create policy "rubric_deletions admin read" on public.rubric_deletions
  for select to authenticated using (public.is_admin());

-- ---------- allowed_users becomes read-only through the API ----------

drop policy if exists "allowed_users admin all" on public.allowed_users;
drop policy if exists "allowed_users admin read" on public.allowed_users;
create policy "allowed_users admin read" on public.allowed_users
  for select to authenticated using (public.is_admin());

revoke insert, update, delete on public.allowed_users from authenticated;

-- ---------- user management functions ----------

create or replace function public.add_allowed_user(p_email text, p_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me text := lower(auth.jwt() ->> 'email');
  e  text := lower(btrim(coalesce(p_email, '')));
begin
  if not public.is_admin() then
    raise exception 'admin_required';
  end if;
  if p_role is null or p_role not in ('admin', 'marker') then
    raise exception 'invalid_role';
  end if;
  if length(e) > 254 or e !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'invalid_email';
  end if;
  if exists (select 1 from public.allowed_users where email = e) then
    raise exception 'already_allowed';
  end if;

  insert into public.allowed_users (email, role, added_by) values (e, p_role, me);
  insert into public.user_access_history (email, action, new_role, changed_by) values (e, 'added', p_role, me);
end;
$$;

create or replace function public.set_user_role(p_email text, p_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me text := lower(auth.jwt() ->> 'email');
  e  text := lower(btrim(coalesce(p_email, '')));
  old_role text;
begin
  if not public.is_admin() then
    raise exception 'admin_required';
  end if;
  if p_role is null or p_role not in ('admin', 'marker') then
    raise exception 'invalid_role';
  end if;

  -- Lock the admin rows so two people cannot demote the last two admins at the same moment.
  perform 1 from public.allowed_users where role = 'admin' for update;

  select role into old_role from public.allowed_users where email = e for update;
  if not found then
    raise exception 'not_found';
  end if;
  if old_role = p_role then
    raise exception 'no_change';
  end if;
  if old_role = 'admin' and p_role = 'marker'
     and (select count(*) from public.allowed_users where role = 'admin') <= 1 then
    raise exception 'last_admin';
  end if;

  update public.allowed_users set role = p_role where email = e;
  insert into public.user_access_history (email, action, old_role, new_role, changed_by)
  values (e, 'role_changed', old_role, p_role, me);
end;
$$;

create or replace function public.remove_allowed_user(p_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me text := lower(auth.jwt() ->> 'email');
  e  text := lower(btrim(coalesce(p_email, '')));
  old_role text;
begin
  if not public.is_admin() then
    raise exception 'admin_required';
  end if;
  if e = me then
    raise exception 'own_access';
  end if;

  perform 1 from public.allowed_users where role = 'admin' for update;

  select role into old_role from public.allowed_users where email = e for update;
  if not found then
    raise exception 'not_found';
  end if;
  if old_role = 'admin' and (select count(*) from public.allowed_users where role = 'admin') <= 1 then
    raise exception 'last_admin';
  end if;

  delete from public.allowed_users where email = e;
  insert into public.user_access_history (email, action, old_role, changed_by)
  values (e, 'removed', old_role, me);
end;
$$;

-- ---------- deleting a rubric, or an empty course (admins only; a copy is kept in rubric_deletions) ----------

create or replace function public.delete_rubric(p_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me text := lower(auth.jwt() ->> 'email');
  last_title text;
  last_course text;
  last_version integer;
begin
  if not public.is_admin() then
    raise exception 'admin_required';
  end if;
  if not exists (select 1 from public.rubrics where id = p_id) then
    raise exception 'not_found';
  end if;
  if exists (select 1 from public.rubrics where id = p_id and status = 'approved') then
    raise exception 'live_version';
  end if;

  select title, course_id, version into last_title, last_course, last_version
  from public.rubrics where id = p_id order by version desc limit 1;

  -- Keep a full copy of every version first, in the same transaction.
  insert into public.rubric_deletions (kind, rubric_id, title, course_id, snapshot, deleted_by)
  select 'rubric', p_id, last_title, last_course, jsonb_agg(to_jsonb(r) order by r.version), me
  from public.rubrics r where r.id = p_id;

  -- The history rows are kept: rubric_history has no foreign key to rubrics. Add one for the deletion itself.
  insert into public.rubric_history (rubric_id, version, action, changed_by, snapshot)
  values (p_id, last_version, 'deleted', me, jsonb_build_object('title', last_title, 'course_id', last_course));

  delete from public.rubrics where id = p_id;
end;
$$;

create or replace function public.delete_course(p_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me text := lower(auth.jwt() ->> 'email');
  course_row public.courses%rowtype;
begin
  if not public.is_admin() then
    raise exception 'admin_required';
  end if;
  select * into course_row from public.courses where id = p_id;
  if not found then
    raise exception 'not_found';
  end if;
  if exists (select 1 from public.rubrics where course_id = p_id) then
    raise exception 'course_not_empty';
  end if;

  insert into public.rubric_deletions (kind, title, course_id, snapshot, deleted_by)
  values ('course', course_row.name, p_id, to_jsonb(course_row), me);

  delete from public.courses where id = p_id;
end;
$$;

-- ---------- who can run the functions: signed-in users only (each one checks is_admin() inside) ----------

revoke all on function public.add_allowed_user(text, text) from public, anon;
revoke all on function public.set_user_role(text, text) from public, anon;
revoke all on function public.remove_allowed_user(text) from public, anon;
revoke all on function public.delete_rubric(text) from public, anon;
revoke all on function public.delete_course(text) from public, anon;

grant execute on function public.add_allowed_user(text, text) to authenticated;
grant execute on function public.set_user_role(text, text) to authenticated;
grant execute on function public.remove_allowed_user(text) to authenticated;
grant execute on function public.delete_rubric(text) to authenticated;
grant execute on function public.delete_course(text) to authenticated;

commit;
