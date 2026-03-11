import { memo } from "react";

import { MetricCard, EmptyState } from "@/components/metric-card";
import { RadarChart } from "@/components/radar-chart";
import { hasBaseSamples } from "@/lib/report-helpers";
import type {
  Branch,
  FilterTab,
  MatrixQuestion,
  Question,
  SimpleQuestion,
  StatBlock,
} from "@/lib/report-types";

type RadarMetric = {
  label: string;
  value: number;
  validCount: number;
};

type AudienceStatItem = {
  id: string;
  title: string;
  statsByAudience: Record<string, StatBlock>;
};

type RendererSharedProps = {
  activeKey: string;
  accent: string;
};

type SimpleQuestionPanelProps = RendererSharedProps & {
  question: SimpleQuestion;
};

type MatrixQuestionPanelProps = RendererSharedProps & {
  question: MatrixQuestion;
};

type BranchQuestionPanelProps = RendererSharedProps & {
  question: Extract<Question, { kind: "branch_matrix" }>;
  activeFilter: FilterTab;
};

const radarMetricsCache = new WeakMap<AudienceStatItem[], Map<string, RadarMetric[]>>();
const visibleItemsCache = new WeakMap<AudienceStatItem[], Map<string, AudienceStatItem[]>>();

function buildRadarMetrics(items: AudienceStatItem[], activeKey: string) {
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

function getCachedRadarMetrics(items: AudienceStatItem[], activeKey: string) {
  const cachedByFilter = radarMetricsCache.get(items);
  const cachedMetrics = cachedByFilter?.get(activeKey);
  if (cachedMetrics) {
    return cachedMetrics;
  }

  const radarMetrics = buildRadarMetrics(items, activeKey);
  const nextCache = cachedByFilter ?? new Map<string, RadarMetric[]>();
  nextCache.set(activeKey, radarMetrics);
  if (!cachedByFilter) {
    radarMetricsCache.set(items, nextCache);
  }
  return radarMetrics;
}

function getCachedVisibleItems(items: AudienceStatItem[], activeKey: string) {
  const cachedByFilter = visibleItemsCache.get(items);
  const cachedItems = cachedByFilter?.get(activeKey);
  if (cachedItems) {
    return cachedItems;
  }

  const visibleItems = items.filter((item) => hasBaseSamples(item.statsByAudience[activeKey]));
  const nextCache = cachedByFilter ?? new Map<string, AudienceStatItem[]>();
  nextCache.set(activeKey, visibleItems);
  if (!cachedByFilter) {
    visibleItemsCache.set(items, nextCache);
  }
  return visibleItems;
}

function BranchPanel({
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
  const visibleItems = getCachedVisibleItems(branch.items, activeKey);
  const radarMetrics = getCachedRadarMetrics(branch.items, activeKey);

  if (!isOverall && !isApplicable) {
    return null;
  }

  return (
    <div className="surface-card branch-card">
      <div className="panel-head">
        <div>
          <h4>{branch.label}</h4>
          <p className="branch-description">适用客群：{branch.applicableAudiences.join(" / ")}</p>
        </div>
        <span className="branch-badge">仅对适用样本统计</span>
      </div>
      {visibleItems.length > 0 ? (
        <>
          <div className="matrix-grid">
            {branch.items.map((item) => (
              <MetricCard
                key={item.id}
                title={item.title}
                stat={item.statsByAudience[activeKey]}
                accent={accent}
                mode="score"
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

export const SimpleQuestionPanel = memo(function SimpleQuestionPanel({
  question,
  activeKey,
  accent,
}: SimpleQuestionPanelProps) {
  return (
    <MetricCard
      title={question.title}
      stat={question.statsByAudience[activeKey]}
      accent={accent}
      note={question.description || question.statsByAudience[activeKey]?.note}
      mode={question.kind === "rating" ? "score" : "distribution"}
    />
  );
});

export const MatrixQuestionPanel = memo(function MatrixQuestionPanel({
  question,
  activeKey,
  accent,
}: MatrixQuestionPanelProps) {
  const visibleItems = getCachedVisibleItems(question.items, activeKey);
  const radarMetrics = getCachedRadarMetrics(question.items, activeKey);

  if (visibleItems.length === 0) {
    return <EmptyState message="当前客群下该题没有有效作答。" />;
  }

  return (
    <>
      <div className="matrix-grid">
        {question.items.map((item) => (
          <MetricCard
            key={item.id}
            title={item.title}
            stat={item.statsByAudience[activeKey]}
            accent={accent}
            mode="score"
          />
        ))}
      </div>
      {radarMetrics.length >= 3 ? (
        <RadarChart metrics={radarMetrics} accent={accent} contextLabel={`${question.title}：`} />
      ) : null}
    </>
  );
});

export const BranchQuestionPanel = memo(function BranchQuestionPanel({
  question,
  activeKey,
  activeFilter,
  accent,
}: BranchQuestionPanelProps) {
  return (
    <div className="stack-lg">
      {question.branches.map((branch) => (
        <BranchPanel
          key={branch.id}
          branch={branch}
          activeKey={activeKey}
          activeFilter={activeFilter}
          accent={accent}
        />
      ))}
    </div>
  );
});
