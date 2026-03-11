import { AudienceFilterTabs } from "@/components/audience-filter-tabs";
import { HighlightsGrid } from "@/components/highlights-grid";
import { PeriodPicker } from "@/components/period-picker";
import { buildHeroTitleLayout } from "@/lib/report-helpers";
import type { Highlight, ReportArchiveNavigation, ReportData } from "@/lib/report-types";

type ReportHeroProps = {
  meta: ReportData["meta"];
  highlights: Highlight[];
  archive?: ReportArchiveNavigation;
  activeFilterKey: string;
  isPeriodPending: boolean;
  onFilterChange: (key: string) => void;
  onSelectYear: (year: number) => void;
  onSelectMonth: (month: number) => void;
};

export function ReportHero({
  meta,
  highlights,
  archive,
  activeFilterKey,
  isPeriodPending,
  onFilterChange,
  onSelectYear,
  onSelectMonth,
}: ReportHeroProps) {
  const heroTitle = buildHeroTitleLayout(meta.title);

  return (
    <section className="surface-card hero-card">
      <div className="hero-text">
        <h1 className="hero-title">
          {heroTitle.lines.map((line, index) => (
            <span className="hero-title-line" key={line}>
              {line}
              {index === 0 && heroTitle.tag ? <em className="hero-title-tag">{heroTitle.tag}</em> : null}
            </span>
          ))}
        </h1>
        {meta.subtitle ? <p>{meta.subtitle}</p> : null}
        <div className="hero-meta">
          <span>样本总量 {meta.responseCount}</span>
          <span>客群页签 {meta.filters.length}</span>
          {archive ? <span>归档期数 {archive.totalReports}</span> : null}
          {archive ? (
            <PeriodPicker
              current={archive.current}
              years={archive.years}
              pending={isPeriodPending}
              onSelectYear={onSelectYear}
              onSelectMonth={onSelectMonth}
            />
          ) : null}
        </div>
      </div>

      <HighlightsGrid highlights={highlights} />

      <div className="hero-footer">
        <AudienceFilterTabs
          items={meta.filters}
          activeKey={activeFilterKey}
          onChange={onFilterChange}
          ariaLabel="全局客群筛选"
        />
        {meta.notes.length > 0 ? (
          <ul className="note-list">
            {meta.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
