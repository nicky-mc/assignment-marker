"use client";

import { useEffect } from "react";
import { toast } from "sonner";

// Shows a message passed back in the address (?msg= or ?error=) as a toast. The page also shows it as a visible banner.
export default function FlashMessage({ msg, error }: { msg?: string; error?: string }) {
  useEffect(() => {
    if (msg) toast.success(msg);
    if (error) toast.error(error);
  }, [msg, error]);
  return null;
}
