"use client";

import { useActionState, useMemo, useState } from "react";
import { saveRubricAction } from "@/lib/rubricAdmin/actions";
import { EMPTY_STATE } from "@/lib/rubricAdmin/formState";
import { LIMITS, validateRubric } from "@/lib/rubricAdmin/validate";
import Field from "./Field";
import { FormMessage, PRIMARY_BUTTON, WarningPanel } from "./FormParts";

export interface RubricFormValues {
  id: string;
  courseId: string;
  week: string;
  title: string;
  overview: string;
  requirements: string;
  stretchGoal: string;
  bands: string[]; // five entries, without the "N - " prefix
}

export const EMPTY_FORM: RubricFormValues = {
  id: "",
  courseId: "",
  week: "",
  title: "",
  overview: "",
  requirements: "",
  stretchGoal: "",
  bands: ["", "", "", "", ""],
};

export default function RubricForm({
  mode,
  courses,
  initial,
  genericBands,
  heading,
  note,
}: {
  mode: "create" | "edit";
  courses: { id: string; name: string }[];
  initial: RubricFormValues;
  genericBands: string[];
  heading: string;
  note?: string;
}) {
  const [state, formAction, pending] = useActionState(saveRubricAction, EMPTY_STATE);
  const [v, setV] = useState<RubricFormValues>(initial);
  const set = (key: keyof Omit<RubricFormValues, "bands">) => (value: string) => setV((p) => ({ ...p, [key]: value }));
  const setBand = (i: number) => (value: string) => setV((p) => ({ ...p, bands: p.bands.map((b, j) => (j === i ? value : b)) }));
  const err = state.errors ?? {};

  // The same rules the server applies, so warnings show as you type.
  const liveWarnings = useMemo(() => {
    const course = courses.find((c) => c.id === v.courseId);
    const bands = v.bands.map((b, i) => (b.trim() ? `${i} - ${b.trim()}` : ""));
    return validateRubric({
      id: v.id || "x",
      courseId: v.courseId || "x",
      courseName: course?.name ?? "x",
      week: v.week || "x",
      title: v.title || "x",
      overview: v.overview || "x",
      requirements: v.requirements || "x",
      stretchGoal: v.stretchGoal || "x",
      bandDescriptions: bands.some(Boolean) ? bands : undefined,
    }).warnings;
  }, [v, courses]);
  const warnings = state.warnings && state.warnings.length > liveWarnings.length ? state.warnings : liveWarnings;

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <h2 className="font-heading text-xl font-semibold">{heading}</h2>
      {note && <p className="text-base max-w-[70ch]">{note}</p>}
      <input type="hidden" name="mode" value={mode} />
      <FormMessage message={state.message} />

      <Field
        name="id"
        label="Id"
        hint={mode === "edit" ? "The id is locked after creation." : "A lowercase slug, unique, e.g. wk2-swot-ai-industry. It cannot be changed later."}
        limit={LIMITS.id}
        value={v.id}
        onChange={set("id")}
        readOnly={mode === "edit"}
        error={err.id}
      />
      <Field
        name="courseId"
        label="Course"
        hint="Create the course first (New course) if it is not listed."
        value={v.courseId}
        onChange={set("courseId")}
        options={courses.map((c) => ({ value: c.id, label: c.name }))}
        error={err.courseId}
      />
      <Field name="week" label="Week" limit={LIMITS.week} value={v.week} onChange={set("week")} error={err.week} placeholder="Week 3" />
      <Field name="title" label="Title" limit={LIMITS.title} value={v.title} onChange={set("title")} error={err.title} />
      <Field name="overview" label="Overview" limit={LIMITS.overview} rows={4} value={v.overview} onChange={set("overview")} error={err.overview} />
      <Field
        name="requirements"
        label="Requirements"
        hint="What a submission needs to include to meet expectations (3 out of 4)."
        limit={LIMITS.requirements}
        rows={6}
        value={v.requirements}
        onChange={set("requirements")}
        error={err.requirements}
      />
      <Field
        name="stretchGoal"
        label="Stretch goal"
        hint="What a submission would include to exceed expectations (4 out of 4)."
        limit={LIMITS.stretchGoal}
        rows={4}
        value={v.stretchGoal}
        onChange={set("stretchGoal")}
        error={err.stretchGoal}
      />

      <fieldset className="flex flex-col gap-4 border-2 border-brand-primary/30 rounded-md p-4">
        <legend className="font-heading text-lg font-semibold px-2">Band descriptions (optional)</legend>
        <p className="text-base max-w-[70ch]">
          Fill in all five (bands 0 to 4), or leave all five empty. If they are all empty, the generic policy
          bands are used. Write only the description: the number is added for you.
        </p>
        {err.bandDescriptions && (
          <p role="alert" className="text-sm font-semibold text-red-700 dark:text-red-400">
            {err.bandDescriptions}
          </p>
        )}
        {v.bands.map((b, i) => (
          <Field
            key={i}
            name={`band${i}`}
            label={`Band ${i} description`}
            limit={LIMITS.band}
            rows={3}
            value={b}
            onChange={setBand(i)}
            error={err[`bandDescriptions.${i}`]}
            placeholder={genericBands[i]}
          />
        ))}
      </fieldset>

      <WarningPanel warnings={warnings} error={err.acknowledged} />

      <div className="flex flex-wrap gap-3">
        <button type="submit" className={PRIMARY_BUTTON} disabled={pending}>
          {pending ? "Saving..." : mode === "edit" ? "Save as draft" : "Create draft"}
        </button>
      </div>
    </form>
  );
}
