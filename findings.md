# Findings & Decisions

## Requirements
- User wants a robust scheme for organizing report data by year and month.
- The scheme should let users choose a report by year/month to view.
- The proposal should fit the current project structure and be ready for confirmation before implementation.

## Research Findings
- Current data source is a single file: `data/report-data.json`.
- Current page imports that file statically in `app/page.tsx`.
- `ReportDashboard` accepts exactly one `ReportData` object and does not manage report switching.
- `ReportData` already models a complete report payload well; the missing piece is a higher-level collection/index structure.
- The report generation script already supports a configurable `--output` path, so monthly files can be generated directly into year/month directories without rewriting the core payload builder.
- Project runtime is standard Next.js server mode (`next dev` / `next build` / `next start`) with no static export in `next.config.ts`, so server-side filesystem scanning is allowed.

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| Separate “report index” from “monthly report payload” | Lets the UI list available months without loading all report details |
| Preserve per-month payloads as standalone files | Keeps generation, maintenance, and debugging simple |
| Prefer filesystem loading in a server component over bundling all JSON via imports | Avoids shipping all monthly reports to the client and avoids dynamic import path friction |
| User-preferred fallback: infer year/month from directories and filenames | Removes duplicated index maintenance at the cost of some runtime scanning and weaker metadata control |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| No existing multi-report abstraction in types or page entry | Plan around a wrapper/index instead of forcing `ReportDashboard` changes first |

## Recommended Shape
- Index file example:
- `data/reports/report-index.json`
- Contains `latest`, `years`, and a flat `entries` list with lightweight metadata and file paths.
- Monthly payload example:
- `data/reports/2026/03.json`
- File contents stay compatible with current `ReportData`; optionally add `meta.period`.

## Revised Recommendation After User Preference
- If avoiding `report-index.json`, use directory discovery:
- `data/reports/2025/12.json`
- `data/reports/2026/01.json`
- Server code scans `data/reports`, treats folder names as years and `NN.json` as months.
- This is viable in the current Next.js runtime.
- Tradeoff: available periods are easy to infer, but list-page metadata such as title, sample size, or “latest” label must be computed from filenames or by opening each monthly JSON.

## Implemented Outcome
- Added a server-only loader at `/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/lib/report-loader.ts`.
- Home page now resolves `?year=YYYY&month=MM` and falls back to the latest discovered month.
- Dashboard now shows year and month switchers when archive data exists.
- Legacy `data/report-data.json` is still supported as a fallback when `data/reports` is absent.
- Seeded the archive structure with `data/reports/2026/03.json` copied from the existing single-month file.

## Resources
- `/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/data/report-data.json`
- `/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/app/page.tsx`
- `/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/lib/report-types.ts`
- `/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/components/report-dashboard.tsx`

## Visual/Browser Findings
- Not applicable for this task.
