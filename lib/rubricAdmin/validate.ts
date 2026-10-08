// Validation for rubric text. Pure (no network, no database) so the browser form, the server actions,
// the import and scripts/check-rubric-validator.ts all use the same rules.
// Rubric text goes straight into the marking prompt, so it is treated as untrusted input.

import type { GradingMode } from "../rubrics";

export const LIMITS = {
  id: 60,
  courseId: 40,
  courseName: 100,
  organisation: 100,
  week: 40,
  title: 200,
  overview: 1500,
  requirements: 3000,
  stretchGoal: 1500,
  band: 1000,
  checklistItem: 300,
  checklistItems: 30,
} as const;

export interface RubricInput {
  id: string;
  organisation: string;
  courseId: string;
  courseName: string;
  week: string;
  title: string;
  overview: string;
  requirements: string;
  stretchGoal: string;
  bandDescriptions?: string[];
  /** Missing means "banded". In "complete" mode the checklist is required and bandDescriptions and stretchGoal are ignored. */
  gradingMode?: GradingMode;
  checklist?: string[];
}

export interface RubricWarning {
  field: string;
  phrase: string;
}

export interface ValidationContext {
  /** Create mode: ids already in use. A match is an error. Leave undefined for edit and import. */
  existingIds?: ReadonlySet<string>;
  /** Known course ids and their names. A known id with a different name is an error. */
  knownCourses?: ReadonlyMap<string, string>;
}

export interface ValidationResult {
  ok: boolean;
  errors: Record<string, string>;
  warnings: RubricWarning[];
  value?: RubricInput;
}

export const DEFAULT_ORGANISATION = "Tech Educators";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// Control characters (keeping tab, newline and carriage return) and invisible or direction-changing characters.
const BAD_CHARS_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁦-⁩﻿]/;
const HTML_RE = /<\/?[a-zA-Z!][^>]*>|<!--/;

const INSTRUCTION_PHRASES: [string, RegExp][] = [
  ["ignore", /\bignor(?:e|es|ed|ing)\b/i],
  ["disregard", /\bdisregard(?:s|ed|ing)?\b/i],
  ["always award", /\balways\s+award\b/i],
  ["system prompt", /\bsystem\s+prompt\b/i],
  ["you must", /\byou\s+must\b/i],
  ["full marks", /\bfull\s+marks\b/i],
  ["regardless", /\bregardless\b/i],
  ["override", /\boverrid(?:e|es|den|ing)\b/i],
  ["forget", /\bforget\s+(?:the\s+|all\s+|any\s+)?(?:previous|above|earlier|instructions)\b/i],
];

const REQUIRED_TEXT: { key: keyof typeof LIMITS & keyof RubricInput; label: string; oneLine: boolean }[] = [
  { key: "courseName", label: "Course name", oneLine: true },
  { key: "week", label: "Week", oneLine: true },
  { key: "title", label: "Title", oneLine: true },
  { key: "overview", label: "Overview", oneLine: false },
  { key: "requirements", label: "Requirements", oneLine: false },
  { key: "stretchGoal", label: "Stretch goal", oneLine: false },
];

function checkText(
  errors: Record<string, string>,
  field: string,
  label: string,
  raw: unknown,
  max: number,
  oneLine: boolean,
  required: boolean,
): string {
  if (raw === undefined || raw === null || raw === "") {
    if (required) errors[field] = `${label} is required.`;
    return "";
  }
  if (typeof raw !== "string") {
    errors[field] = `${label} must be text.`;
    return "";
  }
  const text = raw.trim();
  if (required && !text) errors[field] = `${label} is required.`;
  else if (BAD_CHARS_RE.test(text)) errors[field] = `${label} contains control or invisible characters. Please use plain text only.`;
  else if (HTML_RE.test(text)) errors[field] = `${label} contains HTML tags. Please use plain text only.`;
  else if (oneLine && /[\r\n]/.test(text)) errors[field] = `${label} must be one line.`;
  else if (text.length > max) errors[field] = `${label} is ${text.length} characters, over the limit of ${max}.`;
  return text;
}

export function validateRubric(raw: unknown, ctx: ValidationContext = {}): ValidationResult {
  const errors: Record<string, string> = {};
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, errors: { _form: "Expected a rubric object." }, warnings: [] };
  }
  const r = raw as Record<string, unknown>;

  const id = checkText(errors, "id", "Id", r.id, LIMITS.id, true, true);
  if (id && !errors.id) {
    if (!SLUG_RE.test(id)) errors.id = "Id must be a lowercase slug: letters, numbers and single hyphens, e.g. wk2-swot.";
    else if (ctx.existingIds?.has(id)) errors.id = "That id is already used. Ids must be unique.";
  }

  const courseId = checkText(errors, "courseId", "Course id", r.courseId, LIMITS.courseId, true, true);
  if (courseId && !errors.courseId && !SLUG_RE.test(courseId)) {
    errors.courseId = "Course id must be a lowercase slug, e.g. ai-literacy.";
  }

  const organisation = checkText(errors, "organisation", "Organisation", r.organisation, LIMITS.organisation, true, false) || DEFAULT_ORGANISATION;

  // Grading mode: missing means banded, so old exports and old rubrics keep working.
  let gradingMode: GradingMode = "banded";
  if (r.gradingMode !== undefined && r.gradingMode !== null) {
    if (r.gradingMode === "banded" || r.gradingMode === "complete") gradingMode = r.gradingMode;
    else errors.gradingMode = 'Grading mode must be "banded" or "complete".';
  }
  const complete = gradingMode === "complete";

  const text: Record<string, string> = {};
  for (const f of REQUIRED_TEXT) {
    // A complete / not complete rubric has no stretch goal.
    if (complete && f.key === "stretchGoal") continue;
    text[f.key] = checkText(errors, f.key, f.label, r[f.key], LIMITS[f.key], f.oneLine, true);
  }
  text.stretchGoal ??= "";

  if (courseId && text.courseName && !errors.courseId && !errors.courseName) {
    const known = ctx.knownCourses?.get(courseId);
    if (known !== undefined && known !== text.courseName) {
      errors.courseName = `Course id "${courseId}" already exists with the name "${known}". Use that name.`;
    }
  }

  // Band descriptions: none (generic policy bands are used), or exactly five (bands 0 to 4).
  let bandDescriptions: string[] | undefined;
  const rawBands = complete ? undefined : r.bandDescriptions; // ignored in complete mode
  if (rawBands !== undefined && rawBands !== null) {
    if (!Array.isArray(rawBands)) {
      errors.bandDescriptions = "Band descriptions must be a list of five texts, for bands 0 to 4.";
    } else if (rawBands.some((b) => typeof b !== "string" && b !== null && b !== undefined)) {
      errors.bandDescriptions = "Each band description must be text.";
    } else {
      const trimmed = rawBands.map((b) => (typeof b === "string" ? b.trim() : ""));
      if (trimmed.some(Boolean)) {
        if (trimmed.length !== 5 || trimmed.some((b) => !b)) {
          errors.bandDescriptions = "Provide all five band descriptions (0 to 4), or leave them all empty to use the generic policy bands.";
        } else {
          trimmed.forEach((b, i) => {
            checkText(errors, `bandDescriptions.${i}`, `Band ${i}`, b, LIMITS.band, false, true);
          });
          bandDescriptions = trimmed;
        }
      }
    }
  }

  // Checklist: required in complete mode (1 to 30 plain one-line items); ignored in banded mode.
  let checklist: string[] | undefined;
  if (complete) {
    const rawList = r.checklist;
    if (!Array.isArray(rawList)) {
      errors.checklist = "A complete / not complete rubric needs a checklist: a list of the things a complete submission must do.";
    } else if (rawList.some((x) => typeof x !== "string")) {
      errors.checklist = "Each checklist item must be text.";
    } else if (rawList.length === 0 || rawList.every((x) => !(x as string).trim())) {
      errors.checklist = "Add at least one checklist item.";
    } else if (rawList.length > LIMITS.checklistItems) {
      errors.checklist = `A checklist can have at most ${LIMITS.checklistItems} items.`;
    } else {
      const items = (rawList as string[]).map((x) => x.trim());
      if (items.some((x) => !x)) {
        errors.checklist = "Remove the empty checklist items.";
      } else {
        items.forEach((x, i) => {
          checkText(errors, `checklist.${i}`, `Checklist item ${i + 1}`, x, LIMITS.checklistItem, true, true);
        });
        checklist = items;
      }
    }
  }

  const value: RubricInput = {
    id,
    organisation,
    courseId,
    courseName: text.courseName,
    week: text.week,
    title: text.title,
    overview: text.overview,
    requirements: text.requirements,
    stretchGoal: text.stretchGoal,
    gradingMode,
    ...(bandDescriptions ? { bandDescriptions } : {}),
    ...(checklist ? { checklist } : {}),
  };

  const warnings: RubricWarning[] = [];
  const scan = (field: string, s: string) => {
    for (const [phrase, re] of INSTRUCTION_PHRASES) {
      if (re.test(s) && !warnings.some((w) => w.field === field && w.phrase === phrase)) warnings.push({ field, phrase });
    }
  };
  for (const f of ["title", "overview", "requirements", "stretchGoal", "week", "courseName"] as const) scan(f, value[f]);
  value.bandDescriptions?.forEach((b, i) => scan(`bandDescriptions.${i}`, b));
  value.checklist?.forEach((b, i) => scan(`checklist.${i}`, b));

  const ok = Object.keys(errors).length === 0;
  return { ok, errors, warnings, value: ok ? value : undefined };
}

/** The shape written by Export and accepted by Import, with the fields in a fixed order. */
export function toExportShape(r: RubricInput): RubricInput {
  return {
    id: r.id,
    organisation: r.organisation,
    courseId: r.courseId,
    courseName: r.courseName,
    week: r.week,
    title: r.title,
    overview: r.overview,
    requirements: r.requirements,
    stretchGoal: r.stretchGoal,
    gradingMode: r.gradingMode ?? "banded",
    ...(r.bandDescriptions ? { bandDescriptions: r.bandDescriptions } : {}),
    ...(r.checklist && r.gradingMode === "complete" ? { checklist: r.checklist } : {}),
  };
}

export const BLANK_TEMPLATE: RubricInput = {
  id: "example-week-1",
  organisation: DEFAULT_ORGANISATION,
  courseId: "example-course",
  courseName: "Example Course",
  week: "Week 1",
  title: "Example assignment title",
  overview: "One or two sentences describing what the learner is asked to do.",
  requirements: "What a submission needs to include to meet expectations (3 out of 4).",
  stretchGoal: "What a submission would include to exceed expectations (4 out of 4).",
  gradingMode: "banded",
  bandDescriptions: [
    "0 - Not attempted or no submission.",
    "1 - Attempted but does not show understanding.",
    "2 - Incomplete or not fully developed, but shows understanding.",
    "3 - Complete and meets the requirements.",
    "4 - Complete and exceeds the requirements (stretch goal achieved).",
  ],
};

const BAND_PREFIX_RE = /^[0-4]\s*-\s*/;

/** Form helper: the stored text starts "3 - ..."; the form shows only the words after the number. */
export function stripBandPrefix(s: string): string {
  return s.replace(BAND_PREFIX_RE, "");
}

/** Form helper: adds "N - " to a band description unless it already starts with one. */
export function withBandPrefix(n: number, s: string): string {
  const t = s.trim();
  return !t || BAND_PREFIX_RE.test(t) ? t : `${n} - ${t}`;
}
