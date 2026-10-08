import { getRubric, RubricStoreError } from "@/lib/rubricStore";
import { markSubmission } from "@/lib/marking";
import { markComplete } from "@/lib/markingComplete";
import { tagQuoteSources } from "@/lib/submissionParts";
import { getAccess } from "@/lib/auth/access";
import { checkRateLimit, DRAFT_TRIES_PER_HOUR, MARKS_PER_HOUR } from "@/lib/auth/rateLimit";
import { getDraftRow, rowToInput } from "@/lib/rubricAdmin/store";

export async function POST(request: Request) {
  // Access first, so a request that is not allowed never reaches the AI and spends no credits.
  const access = await getAccess();
  if (access.status === "misconfigured") {
    return Response.json({ error: "Marking is unavailable: this deployment is not configured safely." }, { status: 503 });
  }
  if (access.status === "unauthenticated") {
    return Response.json({ error: "Please sign in to mark." }, { status: 401 });
  }
  if (access.status === "not_allowed") {
    return Response.json({ error: "Your account has not been given access. Please ask an admin." }, { status: 403 });
  }
  if (access.status === "error") {
    return Response.json({ error: "Could not check your access just now. Please try again shortly." }, { status: 503 });
  }

  // Only a rubric id and the submission are read from the request. Rubric text never comes from the client.
  let body: { rubricId?: string; anonymisedSubmission?: string; draft?: boolean };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be JSON" }, { status: 400 });
  }
  const { rubricId, anonymisedSubmission } = body;
  // Admins only: try a rubric that is still a draft. Real marking never uses drafts.
  const wantsDraft = body.draft === true;
  if (wantsDraft && access.role !== "admin") {
    return Response.json({ error: "Only admins can try a draft rubric." }, { status: 403 });
  }

  if (access.email) {
    const limit = wantsDraft
      ? checkRateLimit(`draft:${access.email}`, Date.now(), DRAFT_TRIES_PER_HOUR)
      : checkRateLimit(access.email);
    if (!limit.ok) {
      const what = wantsDraft ? `${DRAFT_TRIES_PER_HOUR} draft tries` : `${MARKS_PER_HOUR} marks`;
      return Response.json(
        { error: `You have reached the limit of ${what} an hour. Please try again in about ${limit.retryAfterMinutes} minute${limit.retryAfterMinutes === 1 ? "" : "s"}.` },
        { status: 429 },
      );
    }
  }

  if (!rubricId || !anonymisedSubmission || !anonymisedSubmission.trim()) {
    return Response.json(
      { error: "rubricId and anonymisedSubmission are required" },
      { status: 400 },
    );
  }

  let rubric;
  try {
    if (wantsDraft) {
      const row = await getDraftRow(rubricId);
      rubric = row && { ...rowToInput(row), version: row.version, source: "database" as const };
    } else {
      rubric = await getRubric(rubricId);
    }
  } catch (err) {
    const message = err instanceof RubricStoreError ? err.message : "Could not load the rubric.";
    return Response.json({ error: `${message} Nothing was marked.` }, { status: 503 });
  }
  if (!rubric) {
    return Response.json({ error: `Unknown rubricId: ${rubricId}` }, { status: 400 });
  }

  try {
    // Complete / not complete rubrics have their own path; the banded path below is unchanged.
    const outcome = rubric.gradingMode === "complete" ? await markComplete(rubric, anonymisedSubmission) : await markSubmission(rubric, anonymisedSubmission);
    // Add the part each quote came from, and the links that were not opened. A single unlabelled submission is left as it is.
    return Response.json({ ...tagQuoteSources(outcome, anonymisedSubmission), rubric: { version: rubric.version, source: rubric.source, ...(wantsDraft ? { draft: true } : {}) } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error while marking";
    return Response.json({ error: message }, { status: 502 });
  }
}
