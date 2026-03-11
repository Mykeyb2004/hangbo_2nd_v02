"use client";

import type { CSSProperties } from "react";

import type { FilterTab } from "@/lib/report-types";

type AudienceFilterTabsProps = {
  items: FilterTab[];
  activeKey: string;
  onChange: (key: string) => void;
  ariaLabel: string;
  accent?: string;
  density?: "default" | "compact";
};

export function AudienceFilterTabs({
  items,
  activeKey,
  onChange,
  ariaLabel,
  accent,
  density = "default",
}: AudienceFilterTabsProps) {
  const style = accent
    ? ({ ["--filter-accent" as string]: accent } as CSSProperties)
    : undefined;
  const isCompact = density === "compact";

  return (
    <div
      className={isCompact ? "audience-strip is-compact" : "audience-strip"}
      role="group"
      aria-label={ariaLabel}
      style={style}
    >
      {items.map((item) => {
        const isActive = item.key === activeKey;

        return (
          <button
            key={item.key}
            type="button"
            className={
              isActive
                ? isCompact
                  ? "audience-pill is-compact is-active"
                  : "audience-pill is-active"
                : isCompact
                  ? "audience-pill is-compact"
                  : "audience-pill"
            }
            onClick={() => onChange(item.key)}
            aria-pressed={isActive}
          >
            <span>{item.label}</span>
            <strong>{item.count}</strong>
          </button>
        );
      })}
    </div>
  );
}
