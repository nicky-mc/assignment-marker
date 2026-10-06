"use client";

import { useActionState, useState } from "react";
import { createCourseAction } from "@/lib/rubricAdmin/actions";
import { EMPTY_STATE } from "@/lib/rubricAdmin/formState";
import Field from "./Field";
import { FormMessage, PRIMARY_BUTTON } from "./FormParts";

export default function CourseForm() {
  const [state, formAction, pending] = useActionState(createCourseAction, EMPTY_STATE);
  const [id, setId] = useState(state.values?.id ?? "");
  const [name, setName] = useState(state.values?.name ?? "");
  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <FormMessage message={state.message} />
      <Field name="id" label="Course id" hint="A lowercase slug, unique, e.g. ai-literacy." limit={40} value={id} onChange={setId} error={state.errors?.id} />
      <Field name="name" label="Course name" limit={100} value={name} onChange={setName} error={state.errors?.name} />
      <div>
        <button type="submit" className={PRIMARY_BUTTON} disabled={pending}>
          {pending ? "Creating..." : "Create course"}
        </button>
      </div>
    </form>
  );
}
