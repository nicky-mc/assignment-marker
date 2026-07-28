import { getRubric } from "@/lib/rubrics";
import { markSubmission } from "@/lib/marking";

export async function POST(request: Request) {
  const body = await request.json();
  const { rubricId, anonymisedSubmission } = body as {
    rubricId?: string;
    anonymisedSubmission?: string;
  };

  if (!rubricId || !anonymisedSubmission || !anonymisedSubmission.trim()) {
    return Response.json(
      { error: "rubricId and anonymisedSubmission are required" },
      { status: 400 },
    );
  }

  const rubric = getRubric(rubricId);
  if (!rubric) {
    return Response.json({ error: `Unknown rubricId: ${rubricId}` }, { status: 400 });
  }

  try {
    const outcome = await markSubmission(rubric, anonymisedSubmission);
    return Response.json(outcome);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error while marking";
    return Response.json({ error: message }, { status: 502 });
  }
}
