import { useEffect, type RefObject } from "react";

/**
 * Drag-to-scroll for MOUSE pointers only. Touch, trackpad and keyboard keep the browser's native scrolling.
 * While dragging, the element gets data-dragging="true" (CSS turns off scroll-snap and text selection and
 * shows a grabbing cursor). Movement over 5px counts as a drag, and the click that follows a drag is cancelled
 * so letting go over a card does not open it. On release the snap comes back and settles on the nearest card.
 */
export function useDragScroll(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let down = false;
    let dragged = false;
    let startX = 0;
    let startLeft = 0;

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      down = true;
      dragged = false;
      startX = e.clientX;
      startLeft = el.scrollLeft;
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
      if (dragged) el.scrollLeft = startLeft - dx;
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
    };

    // Cards and their links must not start a native drag (ghost image, or dragging a link).
    const onDragStart = (e: Event) => e.preventDefault();

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", finish);
    el.addEventListener("pointercancel", finish);
    el.addEventListener("dragstart", onDragStart);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", finish);
      el.removeEventListener("pointercancel", finish);
      el.removeEventListener("dragstart", onDragStart);
      delete el.dataset.dragging;
    };
  }, [ref]);
}
