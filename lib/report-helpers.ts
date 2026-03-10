import type {
  BranchQuestion,
  DistributionOption,
  MatrixQuestion,
  Question,
  SimpleQuestion,
  StatBlock,
} from "@/lib/report-types";

export const CHART_ACCENTS = [
  "#1e40af",
  "#c2410c",
  "#0f766e",
  "#15803d",
  "#be123c",
  "#7c3aed",
];

export type HeroTitleLayout = {
  lines: string[];
  tag?: string;
};

export function formatPercent(ratio: number) {
  return `${(ratio * 100).toFixed(ratio === 0 || ratio >= 0.1 ? 1 : 2)}%`;
}

export function formatGeneratedAt(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Shanghai",
  }).format(new Date(value));
}

export function getMaxRatio(options: DistributionOption[]) {
  return Math.max(...options.map((option) => option.ratio), 0);
}

export function hasBaseSamples(stat?: StatBlock) {
  return Boolean(stat && stat.baseCount > 0);
}

export function isSimpleQuestion(question: Question): question is SimpleQuestion {
  return (
    question.kind === "single_choice" ||
    question.kind === "rating" ||
    question.kind === "multiple_choice" ||
    question.kind === "open_text"
  );
}

export function isMatrixQuestion(question: Question): question is MatrixQuestion {
  return question.kind === "matrix_rating";
}

export function isBranchQuestion(question: Question): question is BranchQuestion {
  return question.kind === "branch_matrix";
}

export function buildStatPills(stat: StatBlock) {
  const pills = [
    `基础样本 ${stat.baseCount}`,
    `有效作答 ${stat.validCount}`,
  ];
  if (stat.missingCount > 0) {
    pills.push(`缺失 ${stat.missingCount}`);
  }
  if (typeof stat.meanScore === "number") {
    pills.push(`均值 ${stat.meanScore.toFixed(2)}`);
  }
  if (typeof stat.highScoreRate === "number") {
    pills.push(`8-10分 ${(stat.highScoreRate * 100).toFixed(1)}%`);
  }
  return pills;
}

export function buildHeroTitleLayout(title: string): HeroTitleLayout {
  const tagMatch = title.match(/（([^）]+)）/);
  const tag = tagMatch?.[1]?.trim();
  const sanitizedTitle = title.replace(/（[^）]+）/, "").trim();
  return { lines: [sanitizedTitle], tag };
}
