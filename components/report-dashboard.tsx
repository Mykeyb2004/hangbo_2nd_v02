"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { QuestionBlock } from "@/components/question-block";
import { buildHeroTitleLayout } from "@/lib/report-helpers";
import type { ReportData } from "@/lib/report-types";

type ReportDashboardProps = {
  data: ReportData;
};

type HighlightVisual = {
  toneClassName: string;
  icon: ReactNode;
};

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

export function ReportDashboard({ data }: ReportDashboardProps) {
  const heroTitle = buildHeroTitleLayout(data.meta.title);
  const [activeFilterKey, setActiveFilterKey] = useState(
    data.meta.filters[0]?.key ?? "overall",
  );

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
        <aside className="report-nav">
          <div className="nav-card">
            <span className="nav-kicker">问卷结构</span>
            <h2>快速跳转</h2>
            <nav>
              {data.sections.map((section) => (
                <a href={`#${section.id}`} key={section.id}>
                  <span>{section.indexLabel}</span>
                  <strong>{section.title}</strong>
                </a>
              ))}
            </nav>
          </div>
        </aside>

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
    </main>
  );
}
