"use client";

import { useMemo, useRef, useState } from "react";

import { useDismissableLayer } from "@/lib/use-dismissable-layer";
import type { ReportArchiveYear, ReportPeriod } from "@/lib/report-types";

type PeriodMenuKey = "year" | "month";

type PeriodPickerProps = {
  current: ReportPeriod;
  years: ReportArchiveYear[];
  pending: boolean;
  onSelectYear: (year: number) => void;
  onSelectMonth: (month: number) => void;
};

type PeriodMenuProps = {
  label: string;
  value: string;
  isOpen: boolean;
  disabled?: boolean;
  options: Array<{
    key: string | number;
    label: string;
    selected: boolean;
    onSelect: () => void;
  }>;
  onToggle: () => void;
};

function PeriodMenu({
  label,
  value,
  isOpen,
  disabled,
  options,
  onToggle,
}: PeriodMenuProps) {
  return (
    <div className="report-menu">
      <button
        type="button"
        className={isOpen ? "report-menu-trigger is-open" : "report-menu-trigger"}
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={onToggle}
      >
        <span className="report-menu-label">{value}</span>
        <span className="report-menu-icon" aria-hidden="true">
          <svg viewBox="0 0 20 20" fill="none">
            <path
              d="M5 7.5L10 12.5L15 7.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
      {isOpen ? (
        <div className="report-menu-panel" role="listbox" aria-label={`${label}列表`}>
          {options.map((option) => (
            <button
              key={option.key}
              type="button"
              className={
                option.selected ? "report-menu-option is-selected" : "report-menu-option"
              }
              onClick={option.onSelect}
            >
              <span>{option.label}</span>
              {option.selected ? <strong>当前</strong> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function PeriodPicker({
  current,
  years,
  pending,
  onSelectYear,
  onSelectMonth,
}: PeriodPickerProps) {
  const controlsRef = useRef<HTMLDivElement>(null);
  const [openMenu, setOpenMenu] = useState<PeriodMenuKey | null>(null);
  const activeYear = useMemo(
    () => years.find((yearItem) => yearItem.year === current.year),
    [current.year, years],
  );

  useDismissableLayer({
    enabled: openMenu !== null,
    refs: [controlsRef],
    onDismiss: () => setOpenMenu(null),
  });

  return (
    <div className="hero-meta-controls" aria-label="报告年月切换" ref={controlsRef}>
      <PeriodMenu
        label="选择年份"
        value={`${current.year}年`}
        isOpen={openMenu === "year"}
        disabled={pending}
        onToggle={() => setOpenMenu((value) => (value === "year" ? null : "year"))}
        options={years.map((yearItem) => ({
          key: yearItem.year,
          label: `${yearItem.year}年`,
          selected: yearItem.year === current.year,
          onSelect: () => {
            setOpenMenu(null);
            onSelectYear(yearItem.year);
          },
        }))}
      />

      <PeriodMenu
        label="选择月份"
        value={`${String(current.month).padStart(2, "0")}月`}
        isOpen={openMenu === "month"}
        disabled={pending || !activeYear}
        onToggle={() => setOpenMenu((value) => (value === "month" ? null : "month"))}
        options={
          activeYear?.months.map((monthItem) => ({
            key: monthItem.id,
            label: `${String(monthItem.month).padStart(2, "0")}月`,
            selected: monthItem.month === current.month,
            onSelect: () => {
              setOpenMenu(null);
              onSelectMonth(monthItem.month);
            },
          })) ?? []
        }
      />
    </div>
  );
}

export type { PeriodPickerProps };
