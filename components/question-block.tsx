"use client";

import { AudienceFilterTabs } from "@/components/audience-filter-tabs";
import { BranchQuestionPanel, MatrixQuestionPanel, SimpleQuestionPanel } from "@/components/question-renderers";
import { QuestionCardShell } from "@/components/question-card-shell";
import {
  CHART_ACCENTS,
  isBranchQuestion,
  isMatrixQuestion,
  isSimpleQuestion,
} from "@/lib/report-helpers";
import type { FilterTab, Question } from "@/lib/report-types";

type QuestionBlockProps = {
  question: Question;
  filters: FilterTab[];
  activeKey: string;
  onFilterChange: (key: string) => void;
};

function renderQuestionPanel(
  question: Question,
  activeKey: string,
  activeFilter: FilterTab,
  accent: string,
) {
  if (isSimpleQuestion(question)) {
    return (
      <SimpleQuestionPanel
        question={question}
        activeKey={activeKey}
        accent={accent}
      />
    );
  }

  if (isMatrixQuestion(question)) {
    return (
      <MatrixQuestionPanel
        question={question}
        activeKey={activeKey}
        accent={accent}
      />
    );
  }

  if (isBranchQuestion(question)) {
    return (
      <BranchQuestionPanel
        question={question}
        activeKey={activeKey}
        activeFilter={activeFilter}
        accent={accent}
      />
    );
  }

  return null;
}

export function QuestionBlock({
  question,
  filters,
  activeKey,
  onFilterChange,
}: QuestionBlockProps) {
  if (filters.length === 0) {
    return null;
  }

  const resolvedActiveKey = filters.some((filter) => filter.key === activeKey)
    ? activeKey
    : filters[0].key;
  const activeIndex = Math.max(
    filters.findIndex((filter) => filter.key === resolvedActiveKey),
    0,
  );
  const activeFilter = filters[activeIndex] ?? filters[0];
  const accent = CHART_ACCENTS[activeIndex % CHART_ACCENTS.length];

  return (
    <QuestionCardShell
      title={question.title}
      description={question.description}
      accent={accent}
      filterTabs={(
        <AudienceFilterTabs
          items={filters}
          activeKey={resolvedActiveKey}
          onChange={onFilterChange}
          ariaLabel={`${question.title} 客群筛选`}
          accent={accent}
        />
      )}
    >
      {renderQuestionPanel(question, resolvedActiveKey, activeFilter, accent)}
    </QuestionCardShell>
  );
}
