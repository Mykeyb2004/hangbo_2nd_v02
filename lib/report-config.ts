import type { Highlight, HighlightKind } from "@/lib/report-types";

export const HIDDEN_QUESTION_CODES = new Set(["Q24"]);

const HIGHLIGHT_KIND_BY_LABEL: Record<string, HighlightKind> = {
  "总体满意度均值": "score",
  "再次参加意愿": "intent",
  "最突出问题": "issue",
  "优先改善方向": "action",
};

export function resolveHighlightKind(highlight: Highlight): HighlightKind {
  return highlight.kind ?? HIGHLIGHT_KIND_BY_LABEL[highlight.label] ?? "generic";
}
