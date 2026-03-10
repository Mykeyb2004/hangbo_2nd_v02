import "server-only";

import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";

import type { ReportData } from "@/lib/report-types";

const REPORTS_ROOT = path.join(process.cwd(), "data", "reports");
const LEGACY_REPORT_FILE = path.join(process.cwd(), "data", "report-data.json");
const YEAR_DIRECTORY_PATTERN = /^\d{4}$/;
const MONTH_FILE_PATTERN = /^(0[1-9]|1[0-2])\.json$/;

type RequestedPeriod = {
  year?: string;
  month?: string;
};

export type DiscoveredReport = {
  id: string;
  year: number;
  month: number;
  label: string;
  filePath: string;
};

export type DiscoveredArchive = {
  years: Array<{
    year: number;
    months: DiscoveredReport[];
  }>;
  latest: DiscoveredReport | null;
};

function formatPeriodLabel(year: number, month: number) {
  return `${year}年${month}月`;
}

function compareByPeriodDesc(left: DiscoveredReport, right: DiscoveredReport) {
  if (left.year !== right.year) {
    return right.year - left.year;
  }
  return right.month - left.month;
}

function compareMonthAsc(left: DiscoveredReport, right: DiscoveredReport) {
  return left.month - right.month;
}

async function fileExists(targetPath: string) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function readJsonFile<T>(targetPath: string) {
  const content = await readFile(targetPath, "utf-8");
  return JSON.parse(content) as T;
}

function withNormalizedPeriod(
  reportData: ReportData,
  period: Pick<DiscoveredReport, "id" | "year" | "month" | "label">,
): ReportData {
  return {
    ...reportData,
    meta: {
      ...reportData.meta,
      period: reportData.meta.period ?? {
        id: period.id,
        year: period.year,
        month: period.month,
        label: period.label,
      },
    },
  };
}

function normalizeRequestedYear(rawValue?: string) {
  if (!rawValue || !YEAR_DIRECTORY_PATTERN.test(rawValue)) {
    return null;
  }
  return Number(rawValue);
}

function normalizeRequestedMonth(rawValue?: string) {
  if (!rawValue) {
    return null;
  }
  const month = Number(rawValue);
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }
  return month;
}

function inferLegacyPeriod(reportData: ReportData): DiscoveredReport | null {
  const generatedAt = Date.parse(reportData.meta.generatedAt);
  if (Number.isNaN(generatedAt)) {
    return null;
  }

  const date = new Date(generatedAt);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  return {
    id: `${year}-${String(month).padStart(2, "0")}`,
    year,
    month,
    label: formatPeriodLabel(year, month),
    filePath: LEGACY_REPORT_FILE,
  };
}

export async function discoverReportArchive(): Promise<DiscoveredArchive> {
  if (!(await fileExists(REPORTS_ROOT))) {
    return {
      years: [],
      latest: null,
    };
  }

  const yearEntries = await readdir(REPORTS_ROOT, { withFileTypes: true });
  const years = await Promise.all(
    yearEntries
      .filter((entry) => entry.isDirectory() && YEAR_DIRECTORY_PATTERN.test(entry.name))
      .map(async (entry) => {
        const year = Number(entry.name);
        const yearPath = path.join(REPORTS_ROOT, entry.name);
        const monthEntries = await readdir(yearPath, { withFileTypes: true });
        const months = monthEntries
          .filter((fileEntry) => fileEntry.isFile() && MONTH_FILE_PATTERN.test(fileEntry.name))
          .map<DiscoveredReport>((fileEntry) => {
            const month = Number(fileEntry.name.slice(0, 2));
            return {
              id: `${year}-${fileEntry.name.slice(0, 2)}`,
              year,
              month,
              label: formatPeriodLabel(year, month),
              filePath: path.join(yearPath, fileEntry.name),
            };
          })
          .sort(compareMonthAsc);

        return {
          year,
          months,
        };
      }),
  );

  const nonEmptyYears = years
    .filter((yearEntry) => yearEntry.months.length > 0)
    .sort((left, right) => right.year - left.year);

  const latest =
    nonEmptyYears.flatMap((yearEntry) => yearEntry.months).sort(compareByPeriodDesc)[0] ??
    null;

  return {
    years: nonEmptyYears,
    latest,
  };
}

export async function loadRequestedReport(requested: RequestedPeriod) {
  const archive = await discoverReportArchive();
  const requestedYear = normalizeRequestedYear(requested.year);
  const requestedMonth = normalizeRequestedMonth(requested.month);

  if (archive.latest) {
    const selected =
      archive.years
        .flatMap((yearEntry) => yearEntry.months)
        .find(
          (entry) =>
            entry.year === requestedYear &&
            entry.month === requestedMonth,
        ) ?? archive.latest;

    const reportData = await readJsonFile<ReportData>(selected.filePath);
    return {
      archive,
      selected,
      data: withNormalizedPeriod(reportData, selected),
    };
  }

  if (await fileExists(LEGACY_REPORT_FILE)) {
    const reportData = await readJsonFile<ReportData>(LEGACY_REPORT_FILE);
    const inferredPeriod = inferLegacyPeriod(reportData);
    return {
      archive,
      selected: inferredPeriod,
      data: inferredPeriod ? withNormalizedPeriod(reportData, inferredPeriod) : reportData,
    };
  }

  throw new Error("No report data found in data/reports or data/report-data.json");
}
