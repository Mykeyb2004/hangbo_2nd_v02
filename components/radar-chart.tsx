type RadarChartMetric = {
  label: string;
  value: number;
  validCount: number;
};

type RadarChartProps = {
  metrics: RadarChartMetric[];
  accent: string;
  contextLabel: string;
};

const CHART_SIZE = 320;
const CHART_CENTER = CHART_SIZE / 2;
const CHART_RADIUS = 106;
const GRID_LEVELS = [0.2, 0.4, 0.6, 0.8, 1];

function toPolarPoint(index: number, count: number, distance: number) {
  const angle = -Math.PI / 2 + (Math.PI * 2 * index) / count;

  return {
    x: CHART_CENTER + Math.cos(angle) * distance,
    y: CHART_CENTER + Math.sin(angle) * distance,
  };
}

function buildPolygonPoints(count: number, distance: number) {
  return Array.from({ length: count }, (_, index) => {
    const point = toPolarPoint(index, count, distance);
    return `${point.x},${point.y}`;
  }).join(" ");
}

export function RadarChart({ metrics, accent, contextLabel }: RadarChartProps) {
  const ariaLabel = metrics
    .map((metric, index) => `${index + 1}.${metric.label}${metric.value.toFixed(2)}分`)
    .join("；");

  const dataPoints = metrics.map((metric, index) =>
    toPolarPoint(index, metrics.length, (metric.value / 10) * CHART_RADIUS),
  );

  return (
    <section className="matrix-radar-panel">
      <div className="matrix-radar-head">
        <div>
          <h4>维度均值雷达图</h4>
          <p>
            {contextLabel}当前客群下 {metrics.length} 个统计卡片的平均分，满分 10 分。
          </p>
        </div>
        <span className="pill">维度 {metrics.length}</span>
      </div>

      <div className="matrix-radar-layout">
        <div className="radar-chart-card">
          <svg
            viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`}
            className="radar-chart-svg"
            role="img"
            aria-label={`${contextLabel}维度均值雷达图：${ariaLabel}`}
          >
            {GRID_LEVELS.map((level) => (
              <polygon
                key={level}
                points={buildPolygonPoints(metrics.length, CHART_RADIUS * level)}
                className="radar-grid-polygon"
              />
            ))}

            {metrics.map((metric, index) => {
              const axisEnd = toPolarPoint(index, metrics.length, CHART_RADIUS);
              const badgePoint = toPolarPoint(index, metrics.length, CHART_RADIUS + 26);

              return (
                <g key={metric.label}>
                  <line
                    x1={CHART_CENTER}
                    y1={CHART_CENTER}
                    x2={axisEnd.x}
                    y2={axisEnd.y}
                    className="radar-axis-line"
                  />
                  <circle
                    cx={badgePoint.x}
                    cy={badgePoint.y}
                    r="12"
                    className="radar-axis-badge"
                  />
                  <text
                    x={badgePoint.x}
                    y={badgePoint.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="radar-axis-badge-text"
                  >
                    {index + 1}
                  </text>
                </g>
              );
            })}

            <polygon
              points={dataPoints.map((point) => `${point.x},${point.y}`).join(" ")}
              fill={accent}
              fillOpacity="0.18"
              stroke={accent}
              strokeWidth="3"
            />

            {dataPoints.map((point, index) => (
              <g key={metrics[index].label}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="5.5"
                  fill="#ffffff"
                  stroke={accent}
                  strokeWidth="3"
                />
              </g>
            ))}

            {GRID_LEVELS.map((level, index) => (
              <text
                key={level}
                x={CHART_CENTER}
                y={CHART_CENTER - CHART_RADIUS * level + 14}
                textAnchor="middle"
                className="radar-scale-text"
              >
                {(index + 1) * 2}
              </text>
            ))}
          </svg>
        </div>

        <div className="radar-legend" aria-label="雷达图维度说明">
          {metrics.map((metric, index) => (
            <article className="radar-legend-item" key={metric.label}>
              <span className="radar-legend-index">{index + 1}</span>
              <div className="radar-legend-copy">
                <strong>{metric.label}</strong>
                <span>有效作答 {metric.validCount}</span>
              </div>
              <strong className="radar-legend-score">{metric.value.toFixed(2)}</strong>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
