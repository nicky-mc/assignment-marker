import { useEffect, type RefObject } from "react";

/**
 * Drag-to-scroll for MOUSE pointers, from anywhere on the row (cards, links, text or gaps), with a short glide on release.
 * Touch, trackpad and keyboard keep the browser's native scrolling.
 *
 * - A press and move over 5px starts a drag: the row captures the pointer and follows it. Below 5px a normal click
 *   still opens the card. The click that follows a real drag is cancelled.
 * - While dragging, the row has data-dragging="true" (CSS: grabbing cursor, no text selection).
 * - On release the row glides on: the speed of the last few pointer moves, decaying about 5 percent a frame,
 *   stopping under 0.1px a frame or at either end. The glide stops on the next pointerdown, wheel, keydown or focus
 *   scroll, and is skipped for visitors who prefer reduced motion.
 */
export function useDragScroll(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let down = false;
    let dragged = false;
    let startX = 0;
    let startLeft = 0;
    let samples: { x: number; t: number }[] = [];
    let frame = 0;

    const stopGlide = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      window.removeEventListener("pointerdown", stopGlide, true);
    };

    const glide = (velocityPerFrame: number) => {
      let v = velocityPerFrame;
      window.addEventListener("pointerdown", stopGlide, true);
      const step = () => {
        v *= 0.95;
        if (Math.abs(v) < 0.1) return stopGlide();
        const before = el.scrollLeft;
        el.scrollLeft = before + v;
        if (el.scrollLeft === before) return stopGlide(); // reached either end
        frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    };

    const onPointerDown = (e: PointerEvent) => {
      stopGlide();
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      down = true;
      dragged = false;
      startX = e.clientX;
      startLeft = el.scrollLeft;
      samples = [{ x: e.clientX, t: e.timeStamp }];
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (!dragged && Math.abs(dx) > 5) {
        dragged = true;
        el.dataset.dragging = "true";
        try {
          el.setPointerCapture(e.pointerId);
        } catch {
          // Not critical: the drag still works while the pointer stays over the row.
        }
      }
      if (!dragged) return;
      el.scrollLeft = startLeft - dx;
      samples.push({ x: e.clientX, t: e.timeStamp });
      if (samples.length > 5) samples.shift();
    };

    const finish = (e: PointerEvent) => {
      if (!down) return;
      down = false;
      if (!dragged) return;
      delete el.dataset.dragging;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        // Already released.
      }
      // The click that follows a drag must not open a card.
      const cancelClick = (ev: Event) => {
        ev.preventDefault();
        ev.stopPropagation();
      };
      el.addEventListener("click", cancelClick, { capture: true, once: true });
      window.setTimeout(() => el.removeEventListener("click", cancelClick, true), 0);

      const first = samples[0];
      const last = samples[samples.length - 1];
      const dt = last && first ? last.t - first.t : 0;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      // Only glide if the pointer was still moving when released.
      if (!reduce && dt > 0 && e.timeStamp - last.t < 80) {
        const velocity = (-(last.x - first.x) / dt) * 16; // scroll pixels per frame
        if (Math.abs(velocity) > 0.5) glide(velocity);
      }
    };

    // Links and images must not start a native drag; keyboard, wheel and focus scrolling take over from a glide.
    const onDragStart = (e: Event) => e.preventDefault();

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", finish);
    el.addEventListener("pointercancel", finish);
    el.addEventListener("dragstart", onDragStart);
    el.addEventListener("wheel", stopGlide, { passive: true });
    el.addEventListener("keydown", stopGlide);
    el.addEventListener("focusin", stopGlide);
    return () => {
      stopGlide();
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", finish);
      el.removeEventListener("pointercancel", finish);
      el.removeEventListener("dragstart", onDragStart);
      el.removeEventListener("wheel", stopGlide);
      el.removeEventListener("keydown", stopGlide);
      el.removeEventListener("focusin", stopGlide);
      delete el.dataset.dragging;
    };
  }, [ref]);
}
