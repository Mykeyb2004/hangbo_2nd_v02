"use client";

import { useEffect, type RefObject } from "react";

type UseDismissableLayerOptions = {
  enabled: boolean;
  refs: Array<RefObject<HTMLElement | null>>;
  onDismiss: () => void;
};

export function useDismissableLayer({
  enabled,
  refs,
  onDismiss,
}: UseDismissableLayerOptions) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const containsTarget = (target: Node) =>
      refs.some((ref) => ref.current?.contains(target));

    const handlePointerDown = (event: PointerEvent) => {
      if (!containsTarget(event.target as Node)) {
        onDismiss();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onDismiss();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, onDismiss, refs]);
}
