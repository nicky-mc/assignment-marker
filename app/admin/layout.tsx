import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col flex-1 items-center">
      <main className="flex w-full max-w-4xl flex-col gap-6 pt-6 pb-16 px-6">
        <nav aria-label="Admin" className="flex flex-wrap gap-4 text-base">
          <Link href="/" className="underline font-medium">
            Back to marking
          </Link>
          <Link href="/admin/rubrics" className="underline font-medium">
            All rubrics
          </Link>
        </nav>
        {children}
      </main>
    </div>
  );
}
