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

const REPORT_SUFFIXES = [
  "反馈统计报告",
  "满意度研究报告",
  "统计报告",
  "研究报告",
  "分析报告",
  "数据看板",
  "报告",
  "看板",
];

const SPLIT_MARKERS = [
  "体验与服务",
  "服务体验",
  "用户体验",
  "展会体验",
  "体验",
  "服务",
  "反馈",
  "研究",
  "分析",
  "展会",
  "中心",
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
  const suffix = REPORT_SUFFIXES.find((item) => sanitizedTitle.endsWith(item));
  const body = suffix ? sanitizedTitle.slice(0, -suffix.length).trim() : sanitizedTitle;
  const firstLine = splitHeroTitleBody(body);
  const lines = [firstLine.left, firstLine.right, suffix].filter(
    (value): value is string => Boolean(value && value.trim()),
  );

  return { lines, tag };
}

function splitHeroTitleBody(value: string) {
  const phaseMatch = value.match(/^(.+?[一二三四五六七八九十]期)(.+)$/);
  if (phaseMatch) {
    return {
      left: phaseMatch[1].trim(),
      right: phaseMatch[2].trim(),
    };
  }

  const midpoint = Math.ceil(value.length / 2);
  const candidates = SPLIT_MARKERS.flatMap((marker) => {
    const index = value.indexOf(marker);
    if (index === -1) {
      return [];
    }
    const splitAt = index + marker.length;
    const left = value.slice(0, splitAt).trim();
    const right = value.slice(splitAt).trim();

    if (left.length < 4 || right.length < 4) {
      return [];
    }

    return [{ left, right, distance: Math.abs(splitAt - midpoint) }];
  });

  if (candidates.length === 0) {
    return { left: value, right: "" };
  }

  candidates.sort((a, b) => a.distance - b.distance);
  return candidates[0];
}
