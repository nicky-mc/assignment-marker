import { requireAdmin } from "@/lib/auth/adminAccess";
import ImportForm from "@/components/admin/ImportForm";

export default async function ImportPage() {
  await requireAdmin();
  return (
    <>
      <h1 className="font-heading text-3xl font-semibold">Import JSON</h1>
      <p className="max-w-[70ch] text-base">
        Imported rubrics always land as drafts, never approved. Use the template, then paste or upload your JSON.
      </p>
      <ImportForm />
    </>
  );
}
