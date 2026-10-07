import PageShell from "@/components/PageShell";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <PageShell width="wide">
      <div aria-busy="true" className="flex flex-col gap-4">
        <Skeleton className="h-5 w-64" />
        <Skeleton className="h-28 rounded-[14px]" />
        <Skeleton className="h-32 rounded-[14px]" />
        <Skeleton className="h-32 rounded-[14px]" />
        <span className="sr-only" role="status">
          Loading rubric
        </span>
      </div>
    </PageShell>
  );
}
