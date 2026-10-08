begin;

alter table public.rubrics
  add column if not exists grading_mode text not null default 'banded',
  add column if not exists checklist jsonb not null default '[]'::jsonb;

alter table public.rubrics drop constraint if exists rubrics_grading_mode_check;
alter table public.rubrics add constraint rubrics_grading_mode_check
  check (grading_mode in ('banded', 'complete'));

alter table public.rubrics drop constraint if exists rubrics_checklist_is_array;
alter table public.rubrics add constraint rubrics_checklist_is_array
  check (jsonb_typeof(checklist) = 'array');

alter table public.rubrics drop constraint if exists rubrics_complete_needs_checklist;
alter table public.rubrics add constraint rubrics_complete_needs_checklist
  check (grading_mode = 'banded' or jsonb_array_length(checklist) > 0);

commit;
begin;

-- Tidy up the earlier combined course, only if it exists and no rubric uses it
delete from public.courses
where id = 'bbb'
  and not exists (select 1 from public.rubrics where course_id = 'bbb');

-- Three separate, modular courses
insert into public.courses (id, name)
select v.id, v.name
from (values
  ('build', 'Build'),
  ('brand', 'Brand'),
  ('balance', 'Balance')
) as v(id, name)
where not exists (select 1 from public.courses c where c.id = v.id);

commit;

-- Check: Build, Brand and Balance should appear alongside the others
select id, name from public.courses order by created_at;
-- Check: every existing rubric should show as banded
select grading_mode, count(*) from public.rubrics group by 1;
