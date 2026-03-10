import { formatPercent } from "@/lib/report-helpers";
import type { DistributionOption } from "@/lib/report-types";

type StatTableProps = {
  options: DistributionOption[];
};

export function StatTable({ options }: StatTableProps) {
  const maxCount = Math.max(...options.map((option) => option.count), 0);

  return (
    <div className="table-wrap">
      <table className="stats-table">
        <thead>
          <tr>
            <th>选项</th>
            <th>样本数</th>
            <th>占比</th>
          </tr>
        </thead>
        <tbody>
          {options.map((option) => (
            <tr
              key={option.label}
              className={option.count === maxCount && maxCount > 0 ? "is-emphasis" : undefined}
            >
              <td>{option.label}</td>
              <td>{option.count}</td>
              <td>{formatPercent(option.ratio)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
