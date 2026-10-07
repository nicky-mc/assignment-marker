"use client";

import { useLayoutEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";

// A text area that grows with its content, using the field tokens.
export default function AutoTextarea({
  value,
  onChange,
  minRows = 3,
  ...props
}: Omit<React.ComponentProps<typeof Textarea>, "onChange" | "value"> & {
  value: string;
  onChange: (v: string) => void;
  minRows?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [value]);
  return <Textarea ref={ref} rows={minRows} value={value} onChange={(e) => onChange(e.target.value)} className="resize-none overflow-hidden" {...props} />;
}
