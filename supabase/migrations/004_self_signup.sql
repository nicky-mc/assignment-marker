-- AssisTED: staff self sign-up as marker. Run AFTER 001, 002 and 003, in the Supabase SQL editor.
-- One script that succeeds or fails as a whole (a single transaction), and is safe to run twice.
-- Still holds rubrics, staff emails and roles only: never learner submissions, feedback or marks.
--
-- What this changes from 001, 002 and 003 (everything else is untouched):
--   * remove_allowed_user (003) is replaced: it now also adds the email to access_blocklist, in the same transaction.
--   * add_allowed_user (003) is replaced: a manual add now also clears the email from access_blocklist.
--   * the check on user_access_history.action (003) is widened to also allow 'settings_changed' and 'unblocked'.
--   * is_admin(), is_allowed(), set_user_role(), the rubric functions and every existing policy are NOT changed.
--     The new tables use is_admin() in their read policies, and the new functions call it, so they follow the existing roles.
--
-- Safety rules, enforced here and not only in the app:
--   1. Self sign-up only ever creates the role 'marker'. Nothing here creates, promotes or changes an admin.
--   2. A person is added only if the setting is on, their Google email is verified (auth.users.email_confirmed_at is set and a
--      google identity exists), the domain after the @ EXACTLY equals one of the allowed domains, and the email is not blocked.
--   3. Removing a person blocks their email. Only an admin's "Allow again" (unblock_email) or a manual add clears the block.
--   4. Defaults: on, for techeducators.co.uk only.

begin;

-- ---------- tables ----------

create table if not exists public.signup_settings (
  id              boolean primary key default true check (id),
  enabled         boolean not null default true,
  allowed_domains text[] not null default '{techeducators.co.uk}',
  updated_by      text,
  updated_at      timestamptz
);

insert into public.signup_settings (id) values (true) on conflict (id) do nothing;

create table if not exists public.access_blocklist (
  email      text primary key check (email = lower(email)),
  blocked_by text,
  blocked_at timestamptz not null default now()
);

alter table public.signup_settings enable row level security;
alter table public.access_blocklist enable row level security;

revoke all on public.signup_settings from anon;
revoke all on public.access_blocklist from anon;
revoke insert, update, delete on public.signup_settings from authenticated;
revoke insert, update, delete on public.access_blocklist from authenticated;

drop policy if exists "signup_settings admin read" on public.signup_settings;
create policy "signup_settings admin read" on public.signup_settings
  for select to authenticated using (public.is_admin());

drop policy if exists "access_blocklist admin read" on public.access_blocklist;
create policy "access_blocklist admin read" on public.access_blocklist
  for select to authenticated using (public.is_admin());

-- The history table (003) gets two more kinds of entry.
alter table public.user_access_history drop constraint if exists user_access_history_action_check;
alter table public.user_access_history add constraint user_access_history_action_check
  check (action in ('added', 'role_changed', 'removed', 'settings_changed', 'unblocked'));

-- ---------- settings (admins only) ----------

create or replace function public.set_signup_settings(p_enabled boolean, p_domains text[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me text := lower(auth.jwt() ->> 'email');
  free_mail text[] := array['gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'live.com', 'yahoo.com', 'icloud.com', 'me.com', 'proton.me', 'protonmail.com'];
  raw text;
  d text;
  cleaned text[] := '{}';
  old_row public.signup_settings%rowtype;
begin
  if not public.is_admin() then
    raise exception 'admin_required';
  end if;
  if p_enabled is null then
    raise exception 'invalid_setting';
  end if;

  foreach raw in array coalesce(p_domains, '{}') loop
    d := lower(btrim(coalesce(raw, '')));
    if length(d) > 253 or d !~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$' then
      raise exception 'invalid_domain';
    end if;
    if d = any(free_mail) then
      raise exception 'freemail_domain';
    end if;
    if not (d = any(cleaned)) then
      cleaned := cleaned || d;
    end if;
  end loop;

  if cardinality(cleaned) > 5 then
    raise exception 'too_many_domains';
  end if;
  if p_enabled and cardinality(cleaned) = 0 then
    raise exception 'no_domains';
  end if;

  select * into old_row from public.signup_settings where id for update;

  update public.signup_settings
  set enabled = p_enabled, allowed_domains = cleaned, updated_by = me, updated_at = now()
  where id;

  insert into public.user_access_history (email, action, old_role, new_role, changed_by)
  values (
    me,
    'settings_changed',
    case when old_row.enabled then 'on: ' || array_to_string(old_row.allowed_domains, ', ') else 'off' end,
    case when p_enabled then 'on: ' || array_to_string(cleaned, ', ') else 'off' end,
    me
  );
end;
$$;

-- ---------- self sign-up: a person can only ever claim marker access for THEMSELVES ----------

create or replace function public.claim_marker_access()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  u_email text;
  u_confirmed timestamptz;
  e text;
  dom text;
  s public.signup_settings%rowtype;
  existing text;
  inserted integer;
begin
  if uid is null then
    return null;
  end if;

  select email, email_confirmed_at into u_email, u_confirmed from auth.users where id = uid;
  if not found then
    return null;
  end if;
  e := lower(btrim(coalesce(u_email, '')));
  if e = '' then
    return null;
  end if;

  -- Already on the list: change nothing and return the existing role.
  select role into existing from public.allowed_users where email = e;
  if found then
    return existing;
  end if;

  select * into s from public.signup_settings where id;
  if not found or not s.enabled then
    return null;
  end if;
  if u_confirmed is null then
    return null;
  end if;
  if not exists (select 1 from auth.identities where user_id = uid and provider = 'google') then
    return null;
  end if;
  if e !~ '^[^@[:space:]]+@[^@[:space:]]+$' then
    return null;
  end if;
  dom := split_part(e, '@', 2);
  if not (dom = any(s.allowed_domains)) then -- exact match only: no suffix or subdomain matching
    return null;
  end if;
  if exists (select 1 from public.access_blocklist where email = e) then
    return null;
  end if;

  insert into public.allowed_users (email, role, added_by) values (e, 'marker', 'self sign-up')
  on conflict (email) do nothing;
  get diagnostics inserted = row_count;

  if inserted = 0 then
    select role into existing from public.allowed_users where email = e;
    return existing;
  end if;

  insert into public.user_access_history (email, action, new_role, changed_by) values (e, 'added', 'marker', 'self sign-up');
  return 'marker';
end;
$$;

-- ---------- removal sticks; manual add and "Allow again" clear the block ----------

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
  insert into public.access_blocklist (email, blocked_by) values (e, me)
  on conflict (email) do update set blocked_by = excluded.blocked_by, blocked_at = now();
  insert into public.user_access_history (email, action, old_role, changed_by)
  values (e, 'removed', old_role, me);
end;
$$;

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
  delete from public.access_blocklist where email = e;
  insert into public.user_access_history (email, action, new_role, changed_by) values (e, 'added', p_role, me);
end;
$$;

create or replace function public.unblock_email(p_email text)
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
  delete from public.access_blocklist where email = e;
  if not found then
    raise exception 'not_found';
  end if;
  insert into public.user_access_history (email, action, changed_by) values (e, 'unblocked', me);
end;
$$;

-- ---------- who can run the functions: signed-in users only (the admin ones check is_admin() inside) ----------

revoke all on function public.set_signup_settings(boolean, text[]) from public, anon;
revoke all on function public.claim_marker_access() from public, anon;
revoke all on function public.unblock_email(text) from public, anon;
revoke all on function public.add_allowed_user(text, text) from public, anon;
revoke all on function public.remove_allowed_user(text) from public, anon;

grant execute on function public.set_signup_settings(boolean, text[]) to authenticated;
grant execute on function public.claim_marker_access() to authenticated;
grant execute on function public.unblock_email(text) to authenticated;
grant execute on function public.add_allowed_user(text, text) to authenticated;
grant execute on function public.remove_allowed_user(text) to authenticated;

commit;
