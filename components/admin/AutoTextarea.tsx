"use client";

import { useLayoutEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";

// A text area that grows with its content, using the field tokens. With `maxViewportHeight` (a fraction of the window
// height, for example 0.7) it stops growing there and only then shows a scrollbar.
export default function AutoTextarea({
  value,
  onChange,
  minRows = 3,
  maxViewportHeight,
  ...props
}: Omit<React.ComponentProps<typeof Textarea>, "onChange" | "value"> & {
  value: string;
  onChange: (v: string) => void;
  minRows?: number;
  maxViewportHeight?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.height = "auto";
      const wanted = el.scrollHeight + 2;
      const max = maxViewportHeight ? window.innerHeight * maxViewportHeight : Infinity;
      el.style.height = `${Math.min(wanted, max)}px`;
      el.style.overflowY = wanted > max ? "auto" : "hidden";
    };
    fit();
    if (!maxViewportHeight) return;
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [value, maxViewportHeight]);
  return <Textarea ref={ref} rows={minRows} value={value} onChange={(e) => onChange(e.target.value)} className="resize-none overflow-hidden" {...props} />;
}
