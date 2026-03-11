"use client";

import { useLayoutEffect, useRef } from "react";

export function useAutoShrinkText(value: string) {
  const wrapperRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const element = textRef.current;
    if (!wrapper || !element) {
      return;
    }

    const minFontSize = 16;
    let frameId = 0;

    const fitText = () => {
      element.style.fontSize = "";

      const baseFontSize = Number.parseFloat(getComputedStyle(element).fontSize);
      if (!Number.isFinite(baseFontSize)) {
        return;
      }

      const availableWidth = wrapper.clientWidth;
      const textWidth = element.scrollWidth;
      if (availableWidth <= 0 || textWidth <= 0 || textWidth <= availableWidth) {
        return;
      }

      let nextFontSize = Math.floor(baseFontSize * (availableWidth / textWidth));
      nextFontSize = Math.max(minFontSize, nextFontSize);
      element.style.fontSize = `${nextFontSize}px`;

      while (element.scrollWidth > availableWidth && nextFontSize > minFontSize) {
        nextFontSize -= 1;
        element.style.fontSize = `${nextFontSize}px`;
      }
    };

    const scheduleFit = () => {
      cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(fitText);
    };

    scheduleFit();

    const resizeObserver = new ResizeObserver(scheduleFit);
    resizeObserver.observe(wrapper);

    window.addEventListener("resize", scheduleFit);
    document.fonts?.ready.then(scheduleFit).catch(() => {});

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", scheduleFit);
    };
  }, [value]);

  return {
    wrapperRef,
    textRef,
  };
}
