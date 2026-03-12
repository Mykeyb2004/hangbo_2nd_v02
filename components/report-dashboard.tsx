"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import { QuestionBlock } from "@/components/question-block";
import { QuickNav } from "@/components/quick-nav";
import { ReportFooter } from "@/components/report-footer";
import { ReportHero } from "@/components/report-hero";
import { ReportScaffold } from "@/components/report-scaffold";
import { SectionCard } from "@/components/section-card";
import type { ReportArchiveNavigation, ReportData } from "@/lib/report-types";

type ReportDashboardProps = {
  data: ReportData;
  archive?: ReportArchiveNavigation;
};

const HIDDEN_QUESTION_CODES = new Set(["Q24"]);

function buildVisibleSections(sections: ReportData["sections"]) {
  return sections
    .map((section) => ({
      ...section,
      questions: section.questions.filter(
        (question) => !("code" in question && HIDDEN_QUESTION_CODES.has(question.code)),
      ),
    }))
    .filter((section) => section.questions.length > 0);
}

export function ReportDashboard({ data, archive }: ReportDashboardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeFilterKey, setActiveFilterKey] = useState(
    data.meta.filters[0]?.key ?? "overall",
  );
  const [isPeriodPending, startPeriodTransition] = useTransition();
  const visibleSections = useMemo(() => buildVisibleSections(data.sections), [data.sections]);

  const navigateToPeriod = (year: number, month: number) => {
    const href = `${pathname}?year=${year}&month=${String(month).padStart(2, "0")}`;
    startPeriodTransition(() => {
      router.push(href, { scroll: false });
    });
  };

  const handleSelectYear = (year: number) => {
    if (!archive) {
      return;
    }

    const yearEntry = archive.years.find((item) => item.year === year);
    if (!yearEntry) {
      return;
    }

    const matchingMonth = yearEntry.months.find(
      (monthItem) => monthItem.month === archive.current.month,
    );
    const fallbackMonth = matchingMonth ?? yearEntry.months[yearEntry.months.length - 1];
    navigateToPeriod(year, fallbackMonth.month);
  };

  const handleSelectMonth = (month: number) => {
    if (!archive) {
      return;
    }

    navigateToPeriod(archive.current.year, month);
  };

  useEffect(() => {
    setActiveFilterKey(data.meta.filters[0]?.key ?? "overall");
  }, [data]);

  return (
    <ReportScaffold>
      <ReportHero
        meta={data.meta}
        highlights={data.highlights}
        archive={archive}
        activeFilterKey={activeFilterKey}
        isPeriodPending={isPeriodPending}
        onFilterChange={setActiveFilterKey}
        onSelectYear={handleSelectYear}
        onSelectMonth={handleSelectMonth}
      />

      <div className="report-layout">
        <div className="section-stack">
          {visibleSections.map((section) => (
            <SectionCard key={section.id} section={section}>
              <div className="question-stack">
                {section.questions.map((question) => (
                  <QuestionBlock
                    key={question.id}
                    question={question}
                    filters={data.meta.filters}
                    activeKey={activeFilterKey}
                    onFilterChange={setActiveFilterKey}
                  />
                ))}
              </div>
            </SectionCard>
          ))}
        </div>
      </div>

      <QuickNav sections={visibleSections} />
      <ReportFooter />
    </ReportScaffold>
  );
}
