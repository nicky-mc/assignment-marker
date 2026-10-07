import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col flex-1 items-center" aria-busy="true">
      <main className="flex w-full max-w-3xl flex-col gap-4 px-6 pt-6 pb-16">
        <Skeleton className="h-5 w-64" />
        <Skeleton className="h-28 rounded-[14px]" />
        <Skeleton className="h-32 rounded-[14px]" />
        <Skeleton className="h-32 rounded-[14px]" />
        <span className="sr-only" role="status">
          Loading rubric
        </span>
      </main>
    </div>
  );
}
