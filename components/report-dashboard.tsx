"use client";

import { useState } from "react";

import { QuestionBlock } from "@/components/question-block";
import { buildHeroTitleLayout } from "@/lib/report-helpers";
import type { ReportData } from "@/lib/report-types";

type ReportDashboardProps = {
  data: ReportData;
};

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
          {data.highlights.map((highlight) => (
            <article className="highlight-card" key={highlight.label}>
              <span>{highlight.label}</span>
              <strong>{highlight.value}</strong>
              <small>{highlight.detail}</small>
            </article>
          ))}
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
