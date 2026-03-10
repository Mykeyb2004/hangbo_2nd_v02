"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";

import { QuestionBlock } from "@/components/question-block";
import { buildHeroTitleLayout } from "@/lib/report-helpers";
import type { ReportArchiveNavigation, ReportData } from "@/lib/report-types";

type ReportDashboardProps = {
  data: ReportData;
  archive?: ReportArchiveNavigation;
};

type HighlightVisual = {
  toneClassName: string;
  icon: ReactNode;
};

type PeriodMenuKey = "year" | "month";

const defaultHighlightVisual: HighlightVisual = {
  toneClassName: "is-generic",
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
};

type AutoShrinkValueProps = {
  value: string;
};

function AutoShrinkValue({ value }: AutoShrinkValueProps) {
  const wrapperRef = useRef<HTMLElement>(null);
  const valueRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const element = valueRef.current;
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
      if (availableWidth <= 0 || textWidth <= 0) {
        return;
      }

      if (textWidth <= availableWidth) {
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

  return (
    <strong className="highlight-value" title={value} ref={wrapperRef}>
      <span ref={valueRef}>{value}</span>
    </strong>
  );
}

function getHighlightVisual(label: string): HighlightVisual {
  switch (label) {
    case "总体满意度均值":
      return {
        toneClassName: "is-score",
        icon: (
          <svg viewBox="0 0 160 160" fill="none" aria-hidden="true">
            <circle cx="80" cy="80" r="46" stroke="currentColor" strokeWidth="12" />
            <path
              d="M80 46L89.6 66.2L112 69.3L95.7 84.9L99.8 107L80 96.2L60.2 107L64.3 84.9L48 69.3L70.4 66.2L80 46Z"
              fill="currentColor"
            />
          </svg>
        ),
      };
    case "再次参加意愿":
      return {
        toneClassName: "is-intent",
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
      };
    case "最突出问题":
      return {
        toneClassName: "is-issue",
        icon: (
          <svg viewBox="0 0 160 160" fill="none" aria-hidden="true">
            <path
              d="M80 32C106.5 32 128 53.5 128 80C128 106.5 106.5 128 80 128C53.5 128 32 106.5 32 80C32 53.5 53.5 32 80 32Z"
              stroke="currentColor"
              strokeWidth="12"
            />
            <path
              d="M80 56V84"
              stroke="currentColor"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <circle cx="80" cy="104" r="7" fill="currentColor" />
          </svg>
        ),
      };
    case "优先改善方向":
      return {
        toneClassName: "is-action",
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
      };
    default:
      return defaultHighlightVisual;
  }
}

export function ReportDashboard({ data, archive }: ReportDashboardProps) {
  const heroTitle = buildHeroTitleLayout(data.meta.title);
  const pathname = usePathname();
  const router = useRouter();
  const [activeFilterKey, setActiveFilterKey] = useState(
    data.meta.filters[0]?.key ?? "overall",
  );
  const [isQuickNavOpen, setIsQuickNavOpen] = useState(false);
  const [openPeriodMenu, setOpenPeriodMenu] = useState<PeriodMenuKey | null>(null);
  const [isPeriodPending, startPeriodTransition] = useTransition();
  const quickNavRef = useRef<HTMLDivElement>(null);
  const periodControlsRef = useRef<HTMLDivElement>(null);
  const activeYear = archive?.years.find((yearItem) => yearItem.year === archive.current.year);

  const navigateToPeriod = (year: number, month: number) => {
    setOpenPeriodMenu(null);
    const href = `${pathname}?year=${year}&month=${String(month).padStart(2, "0")}`;
    startPeriodTransition(() => {
      router.push(href, { scroll: false });
    });
  };

  useEffect(() => {
    setActiveFilterKey(data.meta.filters[0]?.key ?? "overall");
    setIsQuickNavOpen(false);
    setOpenPeriodMenu(null);
  }, [data]);

  useEffect(() => {
    if (!isQuickNavOpen && !openPeriodMenu) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!quickNavRef.current?.contains(event.target as Node)) {
        setIsQuickNavOpen(false);
      }
      if (!periodControlsRef.current?.contains(event.target as Node)) {
        setOpenPeriodMenu(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsQuickNavOpen(false);
        setOpenPeriodMenu(null);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isQuickNavOpen, openPeriodMenu]);

  return (
    <main className="report-shell">
      <div className="report-orb report-orb-one" />
      <div className="report-orb report-orb-two" />

      <section className="hero-card">
        <div className="hero-text">
          <h1 className="hero-title">
            {heroTitle.lines.map((line, index) => (
              <span className="hero-title-line" key={line}>
                {line}
                {index === 0 && heroTitle.tag ? (
                  <em className="hero-title-tag">{heroTitle.tag}</em>
                ) : null}
              </span>
            ))}
          </h1>
          {data.meta.subtitle ? <p>{data.meta.subtitle}</p> : null}
          <div className="hero-meta">
            <span>样本总量 {data.meta.responseCount}</span>
            <span>客群页签 {data.meta.filters.length}</span>
            {archive ? <span>归档期数 {archive.totalReports}</span> : null}
            {archive ? (
              <div
                className="hero-meta-controls"
                aria-label="报告年月切换"
                ref={periodControlsRef}
              >
                <div className="report-menu">
                  <button
                    type="button"
                    className={
                      openPeriodMenu === "year"
                        ? "report-menu-trigger is-open"
                        : "report-menu-trigger"
                    }
                    aria-label="选择年份"
                    aria-haspopup="listbox"
                    aria-expanded={openPeriodMenu === "year"}
                    disabled={isPeriodPending}
                    onClick={() =>
                      setOpenPeriodMenu((current) =>
                        current === "year" ? null : "year",
                      )
                    }
                  >
                    <span className="report-menu-label">{archive.current.year}年</span>
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
                  {openPeriodMenu === "year" ? (
                    <div className="report-menu-panel" role="listbox" aria-label="年份列表">
                      {archive.years.map((yearItem) => (
                        <button
                          key={yearItem.year}
                          type="button"
                          className={
                            yearItem.year === archive.current.year
                              ? "report-menu-option is-selected"
                              : "report-menu-option"
                          }
                          onClick={() => {
                            const matchingMonth = yearItem.months.find(
                              (monthItem) => monthItem.month === archive.current.month,
                            );
                            const fallbackMonth =
                              matchingMonth ??
                              yearItem.months[yearItem.months.length - 1];
                            navigateToPeriod(yearItem.year, fallbackMonth.month);
                          }}
                        >
                          <span>{yearItem.year}年</span>
                          {yearItem.year === archive.current.year ? (
                            <strong>当前</strong>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="report-menu">
                  <button
                    type="button"
                    className={
                      openPeriodMenu === "month"
                        ? "report-menu-trigger is-open"
                        : "report-menu-trigger"
                    }
                    aria-label="选择月份"
                    aria-haspopup="listbox"
                    aria-expanded={openPeriodMenu === "month"}
                    disabled={isPeriodPending || !activeYear}
                    onClick={() =>
                      setOpenPeriodMenu((current) =>
                        current === "month" ? null : "month",
                      )
                    }
                  >
                    <span className="report-menu-label">
                      {String(archive.current.month).padStart(2, "0")}月
                    </span>
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
                  {openPeriodMenu === "month" ? (
                    <div className="report-menu-panel" role="listbox" aria-label="月份列表">
                      {activeYear?.months.map((monthItem) => (
                        <button
                          key={monthItem.id}
                          type="button"
                          className={
                            monthItem.month === archive.current.month
                              ? "report-menu-option is-selected"
                              : "report-menu-option"
                          }
                          onClick={() => {
                            navigateToPeriod(archive.current.year, monthItem.month);
                          }}
                        >
                          <span>{String(monthItem.month).padStart(2, "0")}月</span>
                          {monthItem.month === archive.current.month ? (
                            <strong>当前</strong>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="highlight-grid">
          {data.highlights.map((highlight) => {
            const visual = getHighlightVisual(highlight.label);

            return (
              <article
                className={`highlight-card ${visual.toneClassName}`}
                key={highlight.label}
              >
                <div className="highlight-card-art">{visual.icon}</div>
                <div className="highlight-card-content">
                  <span>{highlight.label}</span>
                  <AutoShrinkValue value={highlight.value} />
                  <small>{highlight.detail}</small>
                </div>
              </article>
            );
          })}
        </div>

        <div className="hero-footer">
          <div className="audience-strip" aria-label="全局客群筛选">
            {data.meta.filters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                className={
                  filter.key === activeFilterKey
                    ? "audience-pill is-active"
                    : "audience-pill"
                }
                onClick={() => setActiveFilterKey(filter.key)}
                aria-pressed={filter.key === activeFilterKey}
              >
                {filter.label}
                <strong>{filter.count}</strong>
              </button>
            ))}
          </div>
          {data.meta.notes.length > 0 ? (
            <ul className="note-list">
              {data.meta.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      <div className="report-layout">
        <div className="section-stack">
          {data.sections.map((section) => (
            <section className="section-card" id={section.id} key={section.id}>
              <div className="section-head">
                <div className="section-title-row">
                  <span className="section-index">{`${section.indexLabel}、`}</span>
                  <h2>{section.title}</h2>
                </div>
                {section.description ? (
                  <p className="section-description">{section.description}</p>
                ) : null}
              </div>

              <div className="question-stack">
                {section.questions.map((question) => (
                  <QuestionBlock
                    key={question.id}
                    question={question}
                    filters={data.meta.filters}
                    activeKey={activeFilterKey}
                    onFilterChange={setActiveFilterKey}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      <div className="quick-nav-fab" ref={quickNavRef}>
        <div
          className={
            isQuickNavOpen ? "quick-nav-panel is-open" : "quick-nav-panel"
          }
          id="report-quick-nav-panel"
        >
          <span className="nav-kicker">问卷结构</span>
          <nav aria-label="快速跳转">
            {data.sections.map((section) => (
              <a
                href={`#${section.id}`}
                key={section.id}
                onClick={() => setIsQuickNavOpen(false)}
              >
                <span>{section.indexLabel}</span>
                <strong>{section.title}</strong>
              </a>
            ))}
          </nav>
        </div>

        <button
          type="button"
          className={isQuickNavOpen ? "quick-nav-toggle is-open" : "quick-nav-toggle"}
          aria-expanded={isQuickNavOpen}
          aria-controls="report-quick-nav-panel"
          aria-label="切换快速跳转菜单"
          onClick={() => setIsQuickNavOpen((current) => !current)}
        >
          <span className="quick-nav-toggle-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M5 7H19"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M5 12H19"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M5 17H14"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </button>
      </div>

      <footer className="report-footer" aria-label="版权信息">
        <img
          className="report-footer-logo"
          src="/Field_logo.svg"
          alt="Field 标志"
          width={144}
          height={203}
        />
        <p className="report-footer-copy">
          <span>杭州菲尔德经济信息咨询有限公司</span>
          <span>提供技术支持。</span>
        </p>
      </footer>
    </main>
  );
}
