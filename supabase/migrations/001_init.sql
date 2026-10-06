-- AssisTED: staff access and rubrics. Paste into the Supabase SQL editor and run.
-- Safe to run twice. Holds rubrics, staff emails and roles ONLY: never learner submissions, feedback or marks.

-- ---------- tables ----------

create table if not exists public.allowed_users (
  email      text primary key check (email = lower(email)),
  role       text not null check (role in ('admin', 'marker')),
  added_by   text,
  created_at timestamptz not null default now()
);

create table if not exists public.rubrics (
  id                text primary key,
  organisation      text not null,
  course_id         text not null,
  course_name       text not null,
  week              text not null,
  title             text not null,
  overview          text not null,
  requirements      text not null,
  stretch_goal      text not null,
  band_descriptions jsonb,
  version           integer not null default 1,
  status            text not null default 'draft' check (status in ('draft', 'approved', 'retired')),
  sort_order        integer not null default 0,
  created_by        text,
  approved_by       text,
  created_at        timestamptz not null default now(),
  approved_at       timestamptz
);

create table if not exists public.rubric_history (
  id         bigserial primary key,
  rubric_id  text not null,
  version    integer not null,
  action     text not null,
  changed_by text,
  changed_at timestamptz not null default now(),
  snapshot   jsonb not null
);

create index if not exists rubrics_status_sort_idx on public.rubrics (status, sort_order);
create index if not exists rubrics_course_idx on public.rubrics (course_id);
create index if not exists rubric_history_rubric_idx on public.rubric_history (rubric_id, changed_at desc);

-- ---------- helper functions (security definer so policies can ask "is this user allowed?" without recursion) ----------

create or replace function public.is_allowed() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.allowed_users where email = lower(auth.jwt() ->> 'email'));
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.allowed_users where email = lower(auth.jwt() ->> 'email') and role = 'admin');
$$;

revoke all on function public.is_allowed() from public, anon;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_allowed() to authenticated;
grant execute on function public.is_admin() to authenticated;

-- ---------- history: every insert or update of a rubric is recorded ----------

create or replace function public.record_rubric_history() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.rubric_history (rubric_id, version, action, changed_by, snapshot)
  values (
    new.id,
    new.version,
    case when tg_op = 'INSERT' then 'created' else 'updated' end,
    coalesce(auth.jwt() ->> 'email', 'service'),
    to_jsonb(new)
  );
  return new;
end;
$$;

drop trigger if exists rubrics_history_trg on public.rubrics;
create trigger rubrics_history_trg
  after insert or update on public.rubrics
  for each row execute function public.record_rubric_history();

-- ---------- Row Level Security: on for every table, and no policy and no grants for the anon role ----------

alter table public.allowed_users enable row level security;
alter table public.rubrics enable row level security;
alter table public.rubric_history enable row level security;

revoke all on public.allowed_users from anon;
revoke all on public.rubrics from anon;
revoke all on public.rubric_history from anon;
revoke all on sequence public.rubric_history_id_seq from anon;

-- allowed_users: you can read your own row (this is how the app checks access); admins can read and manage all rows.
drop policy if exists "allowed_users read own row" on public.allowed_users;
create policy "allowed_users read own row" on public.allowed_users
  for select to authenticated using (email = lower(auth.jwt() ->> 'email'));

drop policy if exists "allowed_users admin all" on public.allowed_users;
create policy "allowed_users admin all" on public.allowed_users
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- rubrics: allowed users read approved rubrics only; admins read and manage everything.
drop policy if exists "rubrics read approved" on public.rubrics;
create policy "rubrics read approved" on public.rubrics
  for select to authenticated using (status = 'approved' and public.is_allowed());

drop policy if exists "rubrics admin all" on public.rubrics;
create policy "rubrics admin all" on public.rubrics
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- rubric_history: admins can read. Rows are written only by the trigger above.
drop policy if exists "rubric_history admin read" on public.rubric_history;
create policy "rubric_history admin read" on public.rubric_history
  for select to authenticated using (public.is_admin());

-- ---------- first admin: uncomment, put your own email in (lower case), and run ----------
-- insert into public.allowed_users (email, role, added_by)
-- values ('your.name@example.com', 'admin', 'first admin')
-- on conflict (email) do nothing;
