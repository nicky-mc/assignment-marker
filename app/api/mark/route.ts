import { getRubric, RubricStoreError } from "@/lib/rubricStore";
import { markSubmission } from "@/lib/marking";
import { getAccess } from "@/lib/auth/access";
import { checkRateLimit, MARKS_PER_HOUR } from "@/lib/auth/rateLimit";

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
  if (access.email) {
    const limit = checkRateLimit(access.email);
    if (!limit.ok) {
      return Response.json(
        { error: `You have reached the limit of ${MARKS_PER_HOUR} marks an hour. Please try again in about ${limit.retryAfterMinutes} minute${limit.retryAfterMinutes === 1 ? "" : "s"}.` },
        { status: 429 },
      );
    }
  }

  // Only a rubric id and the submission are read from the request. Rubric text never comes from the client.
  let body: { rubricId?: string; anonymisedSubmission?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be JSON" }, { status: 400 });
  }
  const { rubricId, anonymisedSubmission } = body;

  if (!rubricId || !anonymisedSubmission || !anonymisedSubmission.trim()) {
    return Response.json(
      { error: "rubricId and anonymisedSubmission are required" },
      { status: 400 },
    );
  }

  let rubric;
  try {
    rubric = await getRubric(rubricId);
  } catch (err) {
    const message = err instanceof RubricStoreError ? err.message : "Could not load the rubric.";
    return Response.json({ error: `${message} Nothing was marked.` }, { status: 503 });
  }
  if (!rubric) {
    return Response.json({ error: `Unknown rubricId: ${rubricId}` }, { status: 400 });
  }

  try {
    const outcome = await markSubmission(rubric, anonymisedSubmission);
    return Response.json({ ...outcome, rubric: { version: rubric.version, source: rubric.source } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error while marking";
    return Response.json({ error: message }, { status: 502 });
  }
}
