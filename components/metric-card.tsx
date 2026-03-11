import { memo, type CSSProperties } from "react";

import { BarChart } from "@/components/bar-chart";
import { ScoreRing } from "@/components/score-ring";
import { StatTable } from "@/components/stat-table";
import { buildStatPills, hasBaseSamples } from "@/lib/report-helpers";
import type { StatBlock } from "@/lib/report-types";

export type MetricDisplayMode = "distribution" | "score";

type MetricVisualizationProps = {
  mode: MetricDisplayMode;
  stat: StatBlock;
};

type MetricCardProps = {
  title: string;
  stat: StatBlock;
  mode: MetricDisplayMode;
  accent: string;
  note?: string;
};

const statPillsCache = new WeakMap<StatBlock, string[]>();

function getCachedStatPills(stat: StatBlock) {
  const cached = statPillsCache.get(stat);
  if (cached) {
    return cached;
  }

  const pills = buildStatPills(stat);
  statPillsCache.set(stat, pills);
  return pills;
}

export const EmptyState = memo(function EmptyState({ message }: { message: string }) {
  return (
    <div className="empty-state">
      <strong>暂无可展示数据</strong>
      <span>{message}</span>
    </div>
  );
});

export const MetricVisualization = memo(function MetricVisualization({
  mode,
  stat,
}: MetricVisualizationProps) {
  return (
    <div className={mode === "score" ? "metric-layout metric-layout-score" : "metric-layout"}>
      {mode === "score" ? (
        <ScoreRing stat={stat} />
      ) : (
        <>
          <StatTable options={stat.options} />
          <BarChart options={stat.options} />
        </>
      )}
    </div>
  );
});

export const MetricCard = memo(function MetricCard({
  title,
  stat,
  mode,
  accent,
  note,
}: MetricCardProps) {
  if (!hasBaseSamples(stat)) {
    return <EmptyState message="当前客群下该题没有有效基础样本。" />;
  }

  if (mode === "score" && (stat.validCount === 0 || typeof stat.meanScore !== "number")) {
    return <EmptyState message="当前客群下该题暂无有效评分作答。" />;
  }

  const resolvedNote =
    note ??
    (mode === "score"
      ? "平均分按有效作答样本直接计算；非 1-10 的值已作为缺失处理。"
      : stat.note);
  const style = { ["--accent" as string]: accent } as CSSProperties;

  return (
    <article className="surface-card metric-card" style={style}>
      <div className="panel-head">
        <h4>{title}</h4>
        <div className="pill-row">
          {getCachedStatPills(stat).map((pill) => (
            <span className="pill" key={pill}>
              {pill}
            </span>
          ))}
        </div>
      </div>
      <p className="metric-note">{resolvedNote}</p>
      <MetricVisualization mode={mode} stat={stat} />
    </article>
  );
});
