"use client";

import { BarChart } from "@/components/bar-chart";
import { RadarChart } from "@/components/radar-chart";
import { ScoreRing } from "@/components/score-ring";
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
  MatrixQuestion,
  Question,
  StatBlock,
} from "@/lib/report-types";

type QuestionBlockProps = {
  question: Question;
  filters: FilterTab[];
  activeKey: string;
  onFilterChange: (key: string) => void;
};

type MetricDisplayMode = "distribution" | "score";

function buildRadarMetrics(
  items: Array<{
    title: string;
    statsByAudience: Record<string, StatBlock>;
  }>,
  activeKey: string,
) {
  return items
    .filter((item) => hasBaseSamples(item.statsByAudience[activeKey]))
    .map((item) => {
      const stat = item.statsByAudience[activeKey];

      if (typeof stat.meanScore !== "number") {
        return null;
      }

      return {
        label: item.title,
        value: stat.meanScore,
        validCount: stat.validCount,
      };
    })
    .filter((metric): metric is NonNullable<typeof metric> => metric !== null);
}

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
  displayMode,
}: {
  title: string;
  stat: StatBlock;
  accent: string;
  note?: string;
  displayMode: MetricDisplayMode;
}) {
  if (!hasBaseSamples(stat)) {
    return <EmptyState message="当前客群下该题没有有效基础样本。" />;
  }

  if (displayMode === "score" && (stat.validCount === 0 || typeof stat.meanScore !== "number")) {
    return <EmptyState message="当前客群下该题暂无有效评分作答。" />;
  }

  const resolvedNote =
    note ??
    (displayMode === "score"
      ? "平均分按有效作答样本直接计算；非 1-10 的值已作为缺失处理。"
      : stat.note);

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
      <p className="metric-note">{resolvedNote}</p>
      <div
        className={
          displayMode === "score" ? "metric-layout metric-layout-score" : "metric-layout"
        }
      >
        {displayMode === "score" ? (
          <ScoreRing stat={stat} />
        ) : (
          <>
            <StatTable options={stat.options} />
            <BarChart options={stat.options} />
          </>
        )}
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
  const radarMetrics = buildRadarMetrics(branch.items, activeKey);

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
        <>
          <div className="matrix-grid">
            {branch.items.map((item) => (
              <MetricPanel
                key={item.id}
                title={item.title}
                stat={item.statsByAudience[activeKey]}
                accent={accent}
                displayMode="score"
              />
            ))}
          </div>
          {radarMetrics.length >= 3 ? (
            <RadarChart
              metrics={radarMetrics}
              accent={accent}
              contextLabel={`${branch.label}：`}
            />
          ) : null}
        </>
      ) : (
        <EmptyState message="当前分支暂无有效作答，保留题目结构但不展开统计。" />
      )}
    </div>
  );
}

function MatrixPanels({
  question,
  activeKey,
  accent,
}: {
  question: MatrixQuestion;
  activeKey: string;
  accent: string;
}) {
  const visibleItems = question.items.filter((item) =>
    hasBaseSamples(item.statsByAudience[activeKey]),
  );
  const radarMetrics = buildRadarMetrics(question.items, activeKey);

  if (visibleItems.length === 0) {
    return <EmptyState message="当前客群下该题没有有效作答。" />;
  }

  return (
    <>
      <div className="matrix-grid">
        {question.items.map((item) => (
          <MetricPanel
            key={item.id}
            title={item.title}
            stat={item.statsByAudience[activeKey]}
            accent={accent}
            displayMode="score"
          />
        ))}
      </div>
      {radarMetrics.length >= 3 ? (
        <RadarChart
          metrics={radarMetrics}
          accent={accent}
          contextLabel={`${question.title}：`}
        />
      ) : null}
    </>
  );
}

export function QuestionBlock({
  question,
  filters,
  activeKey,
  onFilterChange,
}: QuestionBlockProps) {
  const resolvedActiveKey = filters.some((filter) => filter.key === activeKey)
    ? activeKey
    : (filters[0]?.key ?? "overall");
  const activeIndex = Math.max(
    filters.findIndex((filter) => filter.key === resolvedActiveKey),
    0,
  );
  const accent = CHART_ACCENTS[activeIndex % CHART_ACCENTS.length];
  const activeFilter = filters[activeIndex] ?? filters[0];

  return (
    <article
      className="question-card"
      style={{ ["--accent" as string]: accent }}
    >
      <div className="question-head">
        <div className="question-heading">
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
          const active = filter.key === resolvedActiveKey;
          return (
            <button
              key={filter.key}
              type="button"
              className={active ? "tab-button is-active" : "tab-button"}
              onClick={() => onFilterChange(filter.key)}
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
          stat={question.statsByAudience[resolvedActiveKey]}
          accent={accent}
          note={
            question.description ||
            question.statsByAudience[resolvedActiveKey]?.note
          }
          displayMode={question.kind === "rating" ? "score" : "distribution"}
        />
      ) : null}

      {isMatrixQuestion(question) ? (
        <MatrixPanels
          question={question}
          activeKey={resolvedActiveKey}
          accent={accent}
        />
      ) : null}

      {isBranchQuestion(question) ? (
        <div className="branch-stack">
          {question.branches.map((branch) => (
            <BranchPanels
              key={branch.id}
              branch={branch}
              activeKey={resolvedActiveKey}
              activeFilter={activeFilter}
              accent={accent}
            />
          ))}
        </div>
      ) : null}
    </article>
  );
}
