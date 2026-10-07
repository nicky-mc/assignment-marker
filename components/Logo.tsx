import Image from "next/image";
import { cn } from "@/lib/utils";

export default function Logo({ className, centered = false }: { className?: string; centered?: boolean }) {
  const align = centered ? "object-center" : "object-left";
  return (
    <div className={cn("relative h-8 w-40", className)}>
      <Image
        src="/te-logo-light.png"
        alt="Tech Educators"
        fill
        priority
        sizes="208px"
        className={cn("object-contain dark:hidden", align)}
      />
      <Image
        src="/te-logo-dark.png"
        alt="Tech Educators"
        fill
        priority
        sizes="208px"
        className={cn("hidden object-contain dark:block", align)}
      />
    </div>
  );
}
