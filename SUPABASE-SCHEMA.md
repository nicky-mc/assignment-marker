## Table `allowed_users`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `email` | `text` | Primary |
| `role` | `text` |  |
| `added_by` | `text` |  Nullable |
| `created_at` | `timestamptz` |  |

## Table `rubrics`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `text` | Primary |
| `organisation` | `text` |  |
| `course_id` | `text` |  |
| `course_name` | `text` |  |
| `week` | `text` |  |
| `title` | `text` |  |
| `overview` | `text` |  |
| `requirements` | `text` |  |
| `stretch_goal` | `text` |  |
| `band_descriptions` | `jsonb` |  Nullable |
| `grading_mode` | `text` |  `banded` (default) or `complete` |
| `checklist` | `jsonb` |  JSON array; must be non-empty when `grading_mode` is `complete` |
| `version` | `int4` | Primary |
| `status` | `text` |  |
| `sort_order` | `int4` |  |
| `created_by` | `text` |  Nullable |
| `approved_by` | `text` |  Nullable |
| `created_at` | `timestamptz` |  |
| `approved_at` | `timestamptz` |  Nullable |

## Table `rubric_history`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary |
| `rubric_id` | `text` |  |
| `version` | `int4` |  |
| `action` | `text` |  |
| `changed_by` | `text` |  Nullable |
| `changed_at` | `timestamptz` |  |
| `snapshot` | `jsonb` |  |

## Table `courses`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `text` | Primary |
| `name` | `text` |  |
| `created_by` | `text` |  Nullable |
| `created_at` | `timestamptz` |  |

## Table `user_access_history`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary |
| `email` | `text` |  |
| `action` | `text` |  |
| `old_role` | `text` |  Nullable |
| `new_role` | `text` |  Nullable |
| `changed_by` | `text` |  Nullable |
| `changed_at` | `timestamptz` |  |

## Table `rubric_deletions`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary |
| `kind` | `text` |  |
| `rubric_id` | `text` |  Nullable |
| `title` | `text` |  Nullable |
| `course_id` | `text` |  Nullable |
| `snapshot` | `jsonb` |  |
| `deleted_by` | `text` |  Nullable |
| `deleted_at` | `timestamptz` |  |

## RLS Policies

### `rubrics`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `rubrics admin all` | ALL | authenticated | PERMISSIVE | `is_admin()` | `is_admin()` |
| `rubrics read approved` | SELECT | authenticated | PERMISSIVE | `((status = 'approved'::text) AND is_allowed())` | — |

### `courses`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `courses admin all` | ALL | authenticated | PERMISSIVE | `is_admin()` | `is_admin()` |

### `rubric_history`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `rubric_history admin insert` | INSERT | authenticated | PERMISSIVE | — | `(is_admin() AND (changed_by = lower((auth.jwt() ->> 'email'::text))))` |
| `rubric_history admin read` | SELECT | authenticated | PERMISSIVE | `is_admin()` | — |

### `user_access_history`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `user_access_history admin read` | SELECT | authenticated | PERMISSIVE | `is_admin()` | — |

### `rubric_deletions`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `rubric_deletions admin read` | SELECT | authenticated | PERMISSIVE | `is_admin()` | — |

### `allowed_users`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `allowed_users admin read` | SELECT | authenticated | PERMISSIVE | `is_admin()` | — |
| `allowed_users read own row` | SELECT | authenticated | PERMISSIVE | `(email = lower((auth.jwt() ->> 'email'::text)))` | — |

