import { formatPercent, getMaxRatio } from "@/lib/report-helpers";
import type { DistributionOption } from "@/lib/report-types";

type BarChartProps = {
  options: DistributionOption[];
  accent: string;
};

export function BarChart({ options, accent }: BarChartProps) {
  const maxRatio = getMaxRatio(options);

  return (
    <div className="bar-chart" role="img" aria-label="统计分布柱状图">
      {options.map((option) => {
        const normalizedWidth =
          maxRatio > 0 && option.count > 0
            ? Math.max((option.ratio / maxRatio) * 100, 6)
            : 0;

        return (
          <div className="bar-chart-row" key={option.label}>
            <div className="bar-chart-label">{option.label}</div>
            <div className="bar-chart-track" aria-hidden="true">
              <div
                className="bar-chart-fill"
                style={{
                  width: `${normalizedWidth}%`,
                  background: `linear-gradient(90deg, ${accent}, rgba(255, 255, 255, 0.92))`,
                }}
              />
            </div>
            <div className="bar-chart-value">
              <strong>{option.count}</strong>
              <span>{formatPercent(option.ratio)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
