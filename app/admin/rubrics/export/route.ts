import { requireAdmin } from "@/lib/auth/adminAccess";
import { exportRows, rowToInput } from "@/lib/rubricAdmin/store";
import { BLANK_TEMPLATE, toExportShape } from "@/lib/rubricAdmin/validate";

function download(body: unknown, filename: string) {
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

export async function GET(request: Request) {
  await requireAdmin();
  const params = new URL(request.url).searchParams;

  if (params.get("template")) return download(toExportShape(BLANK_TEMPLATE), "rubric-template.json");

  const id = params.get("id") ?? undefined;
  const versionParam = params.get("version");
  const version = versionParam ? Number.parseInt(versionParam, 10) : undefined;
  if (!id && !params.get("all")) return Response.json({ error: "Use ?id=... or ?all=1" }, { status: 400 });

  try {
    const rows = await exportRows(id, Number.isInteger(version) ? version : undefined);
    if (id) {
      if (rows.length === 0) return Response.json({ error: "Not found" }, { status: 404 });
      return download(toExportShape(rowToInput(rows[0])), `${id}.json`);
    }
    return download(rows.map((r) => toExportShape(rowToInput(r))), "rubrics.json");
  } catch {
    return Response.json({ error: "Could not read rubrics." }, { status: 503 });
  }
}
