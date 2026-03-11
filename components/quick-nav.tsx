"use client";

import { useRef, useState } from "react";

import { useDismissableLayer } from "@/lib/use-dismissable-layer";
import type { Section } from "@/lib/report-types";

type QuickNavProps = {
  sections: Section[];
};

export function QuickNav({ sections }: QuickNavProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useDismissableLayer({
    enabled: isOpen,
    refs: [containerRef],
    onDismiss: () => setIsOpen(false),
  });

  return (
    <div className="quick-nav-fab" ref={containerRef}>
      <div className={isOpen ? "quick-nav-panel is-open" : "quick-nav-panel"} id="report-quick-nav-panel">
        <span className="nav-kicker">问卷结构</span>
        <nav aria-label="快速跳转">
          {sections.map((section) => (
            <a href={`#${section.id}`} key={section.id} onClick={() => setIsOpen(false)}>
              <span>{section.indexLabel}</span>
              <strong>{section.title}</strong>
            </a>
          ))}
        </nav>
      </div>

      <button
        type="button"
        className={isOpen ? "quick-nav-toggle is-open" : "quick-nav-toggle"}
        aria-expanded={isOpen}
        aria-controls="report-quick-nav-panel"
        aria-label="切换快速跳转菜单"
        onClick={() => setIsOpen((value) => !value)}
      >
        <span className="quick-nav-toggle-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M5 7H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M5 12H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M5 17H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </span>
      </button>
    </div>
  );
}
