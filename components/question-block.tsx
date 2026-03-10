"use client";

import { useState } from "react";

import { BarChart } from "@/components/bar-chart";
import { StatTable } from "@/components/stat-table";
import {
  buildStatPills,
  CHART_ACCENTS,
  hasBaseSamples,
  isBranchQuestion,
  isMatrixQuestion,
  isSimpleQuestion,
} from "@/lib/report-helpers";
import type {
  Branch,
  FilterTab,
  MatrixItem,
  Question,
  StatBlock,
} from "@/lib/report-types";

type QuestionBlockProps = {
  question: Question;
  filters: FilterTab[];
};

function EmptyState({ message }: { message: string }) {
  return (
    <div className="empty-state">
      <strong>暂无可展示数据</strong>
      <span>{message}</span>
    </div>
  );
}

function MetricPanel({
  title,
  stat,
  accent,
  note,
}: {
  title: string;
  stat: StatBlock;
  accent: string;
  note?: string;
}) {
  if (!hasBaseSamples(stat)) {
    return <EmptyState message="当前客群下该题没有有效基础样本。" />;
  }

  return (
    <article className="metric-panel">
      <div className="metric-panel-head">
        <h4>{title}</h4>
        <div className="pill-row">
          {buildStatPills(stat).map((pill) => (
            <span className="pill" key={pill}>
              {pill}
            </span>
          ))}
        </div>
      </div>
      <p className="metric-note">{note ?? stat.note}</p>
      <div className="metric-layout">
        <StatTable options={stat.options} />
        <BarChart options={stat.options} accent={accent} />
      </div>
    </article>
  );
}

function BranchPanels({
  branch,
  activeKey,
  activeFilter,
  accent,
}: {
  branch: Branch;
  activeKey: string;
  activeFilter: FilterTab;
  accent: string;
}) {
  const isOverall = activeKey === "overall";
  const isApplicable =
    isOverall || branch.applicableAudiences.includes(activeFilter.baseLabel);
  const branchHasAnyData = branch.items.some((item) =>
    hasBaseSamples(item.statsByAudience[activeKey]),
  );

  if (!isOverall && !isApplicable) {
    return null;
  }

  return (
    <div className="branch-block">
      <div className="branch-head">
        <div>
          <h4>{branch.label}</h4>
          <p>
            适用客群：{branch.applicableAudiences.join(" / ")}
          </p>
        </div>
        <span className="branch-badge">仅对适用样本统计</span>
      </div>
      {branchHasAnyData ? (
        <div className="matrix-grid">
          {branch.items.map((item) => (
            <MetricPanel
              key={item.id}
              title={item.title}
              stat={item.statsByAudience[activeKey]}
              accent={accent}
            />
          ))}
        </div>
      ) : (
        <EmptyState message="当前分支暂无有效作答，保留题目结构但不展开统计。" />
      )}
    </div>
  );
}

function MatrixPanels({
  items,
  activeKey,
  accent,
}: {
  items: MatrixItem[];
  activeKey: string;
  accent: string;
}) {
  const visibleItems = items.filter((item) =>
    hasBaseSamples(item.statsByAudience[activeKey]),
  );

  if (visibleItems.length === 0) {
    return <EmptyState message="当前客群下该题没有有效作答。" />;
  }

  return (
    <div className="matrix-grid">
      {items.map((item) => (
        <MetricPanel
          key={item.id}
          title={item.title}
          stat={item.statsByAudience[activeKey]}
          accent={accent}
        />
      ))}
    </div>
  );
}

export function QuestionBlock({ question, filters }: QuestionBlockProps) {
  const [activeKey, setActiveKey] = useState(filters[0]?.key ?? "overall");
  const activeIndex = Math.max(
    filters.findIndex((filter) => filter.key === activeKey),
    0,
  );
  const accent = CHART_ACCENTS[activeIndex % CHART_ACCENTS.length];
  const activeFilter = filters[activeIndex] ?? filters[0];
  const code =
    "code" in question && typeof question.code === "string"
      ? question.code
      : "Q15-Q17";

  return (
    <article
      className="question-card"
      style={{ ["--accent" as string]: accent }}
    >
      <div className="question-head">
        <div className="question-heading">
          <span className="question-code">{code}</span>
          <div>
            <h3>{question.title}</h3>
          </div>
        </div>
        {"description" in question && question.description ? (
          <p className="question-description">{question.description}</p>
        ) : null}
      </div>

      <div className="tab-list" role="tablist" aria-label={`${question.title} 客群筛选`}>
        {filters.map((filter) => {
          const active = filter.key === activeKey;
          return (
            <button
              key={filter.key}
              type="button"
              className={active ? "tab-button is-active" : "tab-button"}
              onClick={() => setActiveKey(filter.key)}
              role="tab"
              aria-selected={active}
            >
              <span>{filter.label}</span>
              <small>{filter.count}</small>
            </button>
          );
        })}
      </div>

      {isSimpleQuestion(question) ? (
        <MetricPanel
          title={question.title}
          stat={question.statsByAudience[activeKey]}
          accent={accent}
          note={question.description || question.statsByAudience[activeKey]?.note}
        />
      ) : null}

      {isMatrixQuestion(question) ? (
        <MatrixPanels
          items={question.items}
          activeKey={activeKey}
          accent={accent}
        />
      ) : null}

      {isBranchQuestion(question) ? (
        <div className="branch-stack">
          {question.branches.map((branch) => (
            <BranchPanels
              key={branch.id}
              branch={branch}
              activeKey={activeKey}
              activeFilter={activeFilter}
              accent={accent}
            />
          ))}
        </div>
      ) : null}
    </article>
  );
}
