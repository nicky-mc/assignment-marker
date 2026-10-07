import * as React from "react"
import { cn } from "@/lib/utils"

// A native select (keeps the browser's keyboard and mobile behaviour) styled with the field tokens and a custom chevron.
function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return <select data-slot="native-select" className={cn("field-control", className)} {...props} />
}

export { NativeSelect }
