import type { StatBlock } from "@/lib/report-types";

type ScoreRingProps = {
  stat: StatBlock;
};

export function ScoreRing({ stat }: ScoreRingProps) {
  const meanScore = stat.meanScore ?? 0;
  const normalizedScore = Math.min(Math.max(meanScore / 10, 0), 1);

  return (
    <div className="score-card">
      <div
        className="score-ring-visual"
        style={{ ["--score-ratio" as string]: normalizedScore }}
        role="img"
        aria-label={`平均分 ${meanScore.toFixed(2)} 分，满分 10 分`}
      >
        <div className="score-ring-chart">
          <div className="score-ring-center">
            <strong>{meanScore.toFixed(2)}</strong>
            <span>/ 10</span>
          </div>
        </div>
      </div>
    </div>
  );
}
