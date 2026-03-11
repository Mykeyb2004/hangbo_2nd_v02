"use client";

import type { ReactNode } from "react";

import { getHighlightToneClassName } from "@/lib/report-helpers";
import { resolveHighlightKind } from "@/lib/report-config";
import { useAutoShrinkText } from "@/lib/use-auto-shrink-text";
import type { Highlight, HighlightKind } from "@/lib/report-types";

type HighlightVisual = {
  icon: ReactNode;
};

const HIGHLIGHT_VISUALS: Record<HighlightKind, HighlightVisual> = {
  score: {
    icon: (
      <svg viewBox="0 0 160 160" fill="none" aria-hidden="true">
        <circle cx="80" cy="80" r="46" stroke="currentColor" strokeWidth="12" />
        <path
          d="M80 46L89.6 66.2L112 69.3L95.7 84.9L99.8 107L80 96.2L60.2 107L64.3 84.9L48 69.3L70.4 66.2L80 46Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  intent: {
    icon: (
      <svg viewBox="0 0 160 160" fill="none" aria-hidden="true">
        <path
          d="M80 122C114 101.8 128 83.3 128 60.8C128 45.4 116.1 34 101.8 34C91.5 34 84.7 39.2 80 46.8C75.3 39.2 68.5 34 58.2 34C43.9 34 32 45.4 32 60.8C32 83.3 46 101.8 80 122Z"
          fill="currentColor"
        />
        <path
          d="M80 122C114 101.8 128 83.3 128 60.8C128 45.4 116.1 34 101.8 34C91.5 34 84.7 39.2 80 46.8C75.3 39.2 68.5 34 58.2 34C43.9 34 32 45.4 32 60.8C32 83.3 46 101.8 80 122Z"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  issue: {
    icon: (
      <svg viewBox="0 0 160 160" fill="none" aria-hidden="true">
        <path
          d="M80 32C106.5 32 128 53.5 128 80C128 106.5 106.5 128 80 128C53.5 128 32 106.5 32 80C32 53.5 53.5 32 80 32Z"
          stroke="currentColor"
          strokeWidth="12"
        />
        <path d="M80 56V84" stroke="currentColor" strokeWidth="12" strokeLinecap="round" />
        <circle cx="80" cy="104" r="7" fill="currentColor" />
      </svg>
    ),
  },
  action: {
    icon: (
      <svg viewBox="0 0 160 160" fill="none" aria-hidden="true">
        <path
          d="M44 116L116 44"
          stroke="currentColor"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M68 44H116V92"
          stroke="currentColor"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M42 86V118H74"
          stroke="currentColor"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  generic: {
    icon: (
      <svg viewBox="0 0 160 160" fill="none" aria-hidden="true">
        <circle cx="80" cy="80" r="44" stroke="currentColor" strokeWidth="12" />
        <path
          d="M80 38V80L108 100"
          stroke="currentColor"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
};

type HighlightCardProps = {
  highlight: Highlight;
};

export function HighlightCard({ highlight }: HighlightCardProps) {
  const kind = resolveHighlightKind(highlight);
  const visual = HIGHLIGHT_VISUALS[kind];
  const { wrapperRef, textRef } = useAutoShrinkText(highlight.value);

  return (
    <article className={`surface-card highlight-card ${getHighlightToneClassName(highlight)}`}>
      <div className="highlight-card-art">{visual.icon}</div>
      <div className="highlight-card-content">
        <span>{highlight.label}</span>
        <strong className="highlight-value" title={highlight.value} ref={wrapperRef}>
          <span ref={textRef}>{highlight.value}</span>
        </strong>
        <small>{highlight.detail}</small>
      </div>
    </article>
  );
}
