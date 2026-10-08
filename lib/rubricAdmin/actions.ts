"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "../auth/adminAccess";
import type { FormState } from "./formState";
import {
  AdminError,
  approveDraft,
  createCourse,
  createRubric,
  listAllRows,
  listCourseRows,
  retireApproved,
  saveNewVersion,
  submitDraft,
} from "./store";
import { validateRubric, withBandPrefix, type RubricInput, type RubricWarning } from "./validate";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_IMPORT_BYTES = 500_000;

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

function messageOf(err: unknown): string {
  return err instanceof AdminError ? err.message : "Something went wrong. Please try again.";
}

export async function createCourseAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const id = str(formData, "id").trim();
  const name = str(formData, "name").trim();
  const errors: Record<string, string> = {};
  if (!SLUG_RE.test(id) || id.length > 40) errors.id = "Course id must be a lowercase slug of up to 40 characters, e.g. ai-literacy.";
  if (!name) errors.name = "Course name is required.";
  else if (name.length > 100) errors.name = "Course name must be 100 characters or fewer.";
  else if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁦-⁩﻿]|<\/?[a-zA-Z!][^>]*>/.test(name)) {
    errors.name = "Course name must be plain text.";
  }
  if (Object.keys(errors).length) return { errors, values: { id, name } };
  try {
    await createCourse(admin.email, id, name);
  } catch (err) {
    return { message: messageOf(err), values: { id, name } };
  }
  redirect(`/admin/rubrics?msg=${encodeURIComponent(`Course "${name}" created. It appears in the Course dropdown once its first rubric is approved.`)}`);
}

function readRubricForm(formData: FormData) {
  const bands = [0, 1, 2, 3, 4].map((n) => withBandPrefix(n, str(formData, `band${n}`)));
  const values: Record<string, string> = {
    id: str(formData, "id"),
    courseId: str(formData, "courseId"),
    week: str(formData, "week"),
    title: str(formData, "title"),
    overview: str(formData, "overview"),
    requirements: str(formData, "requirements"),
    stretchGoal: str(formData, "stretchGoal"),
    band0: str(formData, "band0"),
    band1: str(formData, "band1"),
    band2: str(formData, "band2"),
    band3: str(formData, "band3"),
    band4: str(formData, "band4"),
    gradingMode: str(formData, "gradingMode") === "complete" ? "complete" : "banded",
    checklist: str(formData, "checklist"),
  };
  // The checklist arrives as a JSON list of texts; anything else is treated as no checklist, which validation rejects in complete mode.
  let checklist: string[] = [];
  try {
    const parsed: unknown = JSON.parse(values.checklist || "[]");
    if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) checklist = parsed.slice(0, 100);
  } catch {
    checklist = [];
  }
  return { values, bands, checklist };
}

export async function saveRubricAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const mode = str(formData, "mode") === "edit" ? "edit" : "create";
  const { values, bands, checklist } = readRubricForm(formData);

  let courses;
  let existingIds: Set<string> | undefined;
  try {
    courses = await listCourseRows();
    if (mode === "create") existingIds = new Set((await listAllRows()).rows.map((r) => r.id));
  } catch (err) {
    return { message: messageOf(err), values };
  }
  const course = courses.find((c) => c.id === values.courseId);
  if (!course) return { errors: { courseId: "Choose a course. Create the course first if it is not listed." }, values };

  const result = validateRubric(
    {
      id: values.id,
      courseId: course.id,
      courseName: course.name,
      week: values.week,
      title: values.title,
      overview: values.overview,
      requirements: values.requirements,
      stretchGoal: values.stretchGoal,
      gradingMode: values.gradingMode,
      bandDescriptions: bands.some(Boolean) ? bands : undefined,
      checklist,
    },
    { existingIds },
  );
  if (!result.ok || !result.value) return { errors: result.errors, warnings: result.warnings, values };

  // A flagged draft is saved only after the admin has ticked that they read it.
  if (result.warnings.length > 0 && str(formData, "acknowledged") !== "yes") {
    return {
      warnings: result.warnings,
      needsAcknowledgement: true,
      errors: { acknowledged: "Please tick the box to confirm you have read this, then save again." },
      values,
    };
  }

  try {
    if (mode === "create") await createRubric(admin.email, result.value);
    else await saveNewVersion(admin.email, result.value, "edited");
  } catch (err) {
    return { message: messageOf(err), values };
  }
  redirect(`/admin/rubrics/${encodeURIComponent(result.value.id)}?msg=${encodeURIComponent("Saved as a draft. It is not live until it is approved.")}`);
}

export async function importAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  let text = str(formData, "json");
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_IMPORT_BYTES) return { message: "That file is too large (500 KB limit)." };
    text = await file.text();
  }
  if (!text.trim()) return { message: "Paste some JSON or choose a file." };
  if (text.length > MAX_IMPORT_BYTES) return { message: "That is too large (500 KB limit)." };

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { message: "That is not valid JSON.", values: { json: text } };
  }
  const items = Array.isArray(parsed) ? parsed : [parsed];
  if (items.length === 0 || items.length > 100) return { message: "Provide between 1 and 100 rubrics.", values: { json: text } };

  let knownCourses: Map<string, string>;
  try {
    knownCourses = new Map((await listCourseRows()).map((c) => [c.id, c.name]));
  } catch (err) {
    return { message: messageOf(err), values: { json: text } };
  }

  const errors: Record<string, string> = {};
  const warnings: RubricWarning[] = [];
  const valid: RubricInput[] = [];
  items.forEach((item, i) => {
    const label = `Rubric ${i + 1}`;
    const r = validateRubric(item, { knownCourses });
    for (const [field, msg] of Object.entries(r.errors)) errors[`${label}: ${field}`] = msg;
    for (const w of r.warnings) warnings.push({ field: `${label}: ${w.field}`, phrase: w.phrase });
    if (r.ok && r.value) valid.push(r.value);
  });
  const ids = valid.map((v) => v.id);
  if (new Set(ids).size !== ids.length) errors["Rubric ids"] = "The same id appears more than once in this import.";
  if (Object.keys(errors).length) return { errors, warnings, values: { json: text } };

  if (warnings.length > 0 && str(formData, "acknowledged") !== "yes") {
    return {
      warnings,
      needsAcknowledgement: true,
      errors: { acknowledged: "Please tick the box to confirm you have read this, then import again." },
      values: { json: text },
    };
  }

  try {
    for (const v of valid) await saveNewVersion(admin.email, v, "imported");
  } catch (err) {
    return { message: `${messageOf(err)} Some rubrics may already have been imported as drafts.`, values: { json: text } };
  }
  redirect(`/admin/rubrics?msg=${encodeURIComponent(`Imported ${valid.length} rubric${valid.length === 1 ? "" : "s"} as drafts. Nothing is live until approved.`)}`);
}

export async function rubricStatusAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const intent = str(formData, "intent");
  const id = str(formData, "id");
  const version = Number.parseInt(str(formData, "version"), 10);
  const back = `/admin/rubrics/${encodeURIComponent(id)}`;
  if (!id || !Number.isInteger(version)) redirect(`${back}?error=${encodeURIComponent("Missing rubric details.")}`);

  let message: string;
  try {
    if (intent === "submit") {
      await submitDraft(admin.email, id, version);
      message = `Version ${version} submitted for approval.`;
    } else if (intent === "approve") {
      await approveDraft(admin.email, id, version, process.env.REQUIRE_SECOND_APPROVER === "true");
      message = `Version ${version} approved and live. Any earlier approved version was retired.`;
    } else if (intent === "retire") {
      await retireApproved(admin.email, id, version);
      message = `Version ${version} retired. It is no longer used for marking.`;
    } else {
      throw new AdminError("Unknown action.");
    }
  } catch (err) {
    redirect(`${back}?error=${encodeURIComponent(messageOf(err))}`);
  }
  redirect(`${back}?msg=${encodeURIComponent(message)}`);
}
