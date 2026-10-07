import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LibraryItem } from "@/lib/rubricStore";

// Status is always text. Markers see just "Live"; admins see "Live v1", "Draft v2" or "Retired v1".
// `onPurple` is for badges placed on a purple card.
export function StatusBadge({
  status,
  version,
  admin,
  onPurple = false,
}: {
  status: LibraryItem["status"];
  version: number;
  admin: boolean;
  onPurple?: boolean;
}) {
  if (status === "approved") {
    return (
      <Badge className="border-brand-secondary bg-brand-secondary text-brand-primary">
        Live{admin ? ` v${version}` : ""}
      </Badge>
    );
  }
  if (status === "draft") {
    return <Badge className="border-draft bg-draft text-draft-ink">Draft v{version}</Badge>;
  }
  return (
    <Badge className={cn("border-[1.5px] bg-transparent", onPurple ? "border-purple-body text-purple-body" : "border-border text-foreground")}>
      Retired v{version}
    </Badge>
  );
}
