import { cookies } from "next/headers";

import { ReportDashboard } from "@/components/report-dashboard";
import { ReportUnlockScreen } from "@/components/report-unlock-screen";
import { loadRequestedReport } from "@/lib/report-loader";
import {
  REPORT_UNLOCK_COOKIE_NAME,
  isReportUnlockCookieValid,
  isReportUnlockEnabled,
} from "@/lib/report-unlock";
import type { ReportArchiveNavigation } from "@/lib/report-types";

type HomePageProps = {
  searchParams?: Promise<{
    year?: string | string[];
    month?: string | string[];
  }>;
};

function pickFirst(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function buildPeriodHref(year: number, month: number) {
  return `/?year=${year}&month=${String(month).padStart(2, "0")}`;
}

function buildRequestedPeriodLabel(year?: string, month?: string) {
  if (!year || !month || !/^\d{4}$/.test(year) || !/^\d{1,2}$/.test(month)) {
    return undefined;
  }

  const numericMonth = Number(month);
  if (!Number.isInteger(numericMonth) || numericMonth < 1 || numericMonth > 12) {
    return undefined;
  }

  return `${year}年${String(numericMonth).padStart(2, "0")}月`;
}

function buildArchiveNavigation(
  archive: Awaited<ReturnType<typeof loadRequestedReport>>["archive"],
  selected: Awaited<ReturnType<typeof loadRequestedReport>>["selected"],
): ReportArchiveNavigation | undefined {
  if (!selected || archive.years.length === 0) {
    return undefined;
  }

  return {
    current: {
      id: selected.id,
      year: selected.year,
      month: selected.month,
      label: selected.label,
    },
    years: archive.years.map((yearEntry) => {
      const sameMonth = yearEntry.months.find((monthEntry) => monthEntry.month === selected.month);
      const defaultMonth = sameMonth ?? yearEntry.months[yearEntry.months.length - 1];
      return {
        year: yearEntry.year,
        href: buildPeriodHref(yearEntry.year, defaultMonth.month),
        months: yearEntry.months.map((monthEntry) => ({
          id: monthEntry.id,
          year: monthEntry.year,
          month: monthEntry.month,
          label: monthEntry.label,
          href: buildPeriodHref(monthEntry.year, monthEntry.month),
        })),
      };
    }),
    totalReports: archive.years.reduce(
      (count, yearEntry) => count + yearEntry.months.length,
      0,
    ),
  };
}

export default async function Home({ searchParams }: HomePageProps) {
  const params = (await searchParams) ?? {};
  const requestedYear = pickFirst(params.year);
  const requestedMonth = pickFirst(params.month);

  if (isReportUnlockEnabled()) {
    const cookieStore = await cookies();
    const unlockCookie = cookieStore.get(REPORT_UNLOCK_COOKIE_NAME)?.value;

    if (!isReportUnlockCookieValid(unlockCookie)) {
      return (
        <ReportUnlockScreen
          periodLabel={buildRequestedPeriodLabel(requestedYear, requestedMonth)}
        />
      );
    }
  }

  const report = await loadRequestedReport({
    year: requestedYear,
    month: requestedMonth,
  });

  return (
    <ReportDashboard
      data={report.data}
      archive={buildArchiveNavigation(report.archive, report.selected)}
    />
  );
}
