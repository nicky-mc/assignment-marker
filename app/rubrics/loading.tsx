import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col flex-1 items-center" aria-busy="true">
      <main className="flex w-full max-w-3xl flex-col gap-4 px-6 pt-6 pb-16">
        <Skeleton className="h-24 rounded-[14px]" />
        <Skeleton className="h-10 rounded-[10px]" />
        {[0, 1].map((row) => (
          <div key={row} className="flex flex-col gap-3">
            <Skeleton className="h-6 w-48" />
            <div className="flex gap-4 overflow-hidden">
              {[0, 1, 2].map((c) => (
                <Skeleton key={c} className="h-44 w-64 shrink-0 rounded-[14px]" />
              ))}
            </div>
          </div>
        ))}
        <span className="sr-only" role="status">
          Loading rubrics
        </span>
      </main>
    </div>
  );
}
