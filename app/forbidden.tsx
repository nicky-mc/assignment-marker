import Link from "next/link";

export default function Forbidden() {
  return (
    <div className="flex flex-col flex-1 items-center">
      <main className="flex w-full max-w-3xl flex-col gap-6 pt-6 pb-16 px-6">
        <div className="flex flex-col gap-3 rounded-[14px] border-2 border-surface-border bg-surface p-5 text-ink">
          <h1 className="text-2xl font-semibold">403: Admins only</h1>
          <p className="text-base">This page is only for admins. If you need access, please ask an admin.</p>
          <Link href="/" className="underline font-medium w-fit">
            Back to marking
          </Link>
        </div>
      </main>
    </div>
  );
}
