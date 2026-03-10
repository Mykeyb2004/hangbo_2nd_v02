# Task Plan: Monthly Report Data Structure

## Goal
Design a practical data organization scheme so the project can support report browsing by year and month while preserving the current single-report rendering model.

## Current Phase
Phase 3

## Phases

### Phase 1: Requirements & Discovery
- [x] Understand user intent
- [x] Identify current report data constraints
- [x] Document findings in findings.md
- **Status:** complete

### Phase 2: Planning & Structure
- [x] Define recommended storage structure
- [x] Define front-end selection/loading pattern
- [x] Document tradeoffs and migration path
- **Status:** complete

### Phase 3: Delivery
- [x] Summarize recommended approach
- [x] Call out optional alternatives
- [x] Deliver confirmation-ready proposal
- **Status:** complete

## Key Questions
1. How can multiple monthly reports be stored without changing the existing `ReportData` shape?
2. How should the UI discover available year/month options without scanning large payloads client-side?

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Keep `ReportData` as the leaf payload format | Existing dashboard already renders this shape cleanly; wrapping instead of rewriting minimizes risk |
| Use `report-index.json` plus per-month JSON files | Lets the app list months cheaply and load only the selected report |
| Use year/month in file paths and URL params | Matches user mental model and simplifies lookup, caching, and maintenance |
| Final implementation uses directory inference instead of `report-index.json` | Matches user preference while remaining viable in the current Next.js server runtime |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| None | 1 | Not applicable |

## Notes
- Prefer a structure that supports adding months by file drop or generated output.
- Avoid bundling all months into one large JSON unless data volume stays tiny.
