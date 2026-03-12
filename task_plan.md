# Task Plan: Report Component Consolidation

## Goal
深度梳理报告页组件结构，提取并接入可复用的公共组件，减少 `report-dashboard` 与 `question-block` 中的重复实现，同时保持现有页面行为稳定。

## Current Phase
Phase 5

## Phases

### Phase 1: Discovery & Scope
- [x] Review current report/page component structure
- [x] Confirm which extracted components are duplicated or unused
- [x] Record findings and assumptions
- **Status:** complete

### Phase 2: Dashboard Structure Refactor
- [x] Replace inlined hero/nav/footer/section markup in `report-dashboard.tsx`
- [x] Reuse shared hooks/components for dismissable menus and highlight cards
- [x] Keep period navigation and global filter behavior unchanged
- **Status:** complete

### Phase 3: Question Rendering Refactor
- [x] Reuse shared question shell and renderer components inside `question-block.tsx`
- [x] Remove duplicated metric/matrix/branch rendering logic
- [x] Preserve current styles and empty-state behavior
- **Status:** complete

### Phase 4: Verification
- [x] Run targeted build/type verification
- [x] Re-check affected files for regressions
- [x] Log results in progress.md
- **Status:** complete

### Phase 5: Delivery
- [x] Summarize implemented changes
- [x] Call out residual risks or follow-ups
- **Status:** complete

## Key Questions
1. 哪些“已抽取组件”已经具备生产可用度，只是尚未接入主链路？
2. `report-dashboard.tsx` 中哪些本地逻辑已经在其他组件或 hooks 中重复存在？
3. `question-block.tsx` 与 `question-renderers.tsx` 的重复部分能否收敛到一套实现而不引入样式回归？

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| 优先复用仓库中已存在但未接线的组件，而不是继续新建抽象 | 当前冗余主要来自“主链路没接入已抽好的组件” |
| `report-dashboard.tsx` 的提取边界放在页面骨架层 | hero、period menu、highlights、quick nav、footer 重复明显且职责稳定 |
| `question-block.tsx` 的提取边界放在题目容器和渲染器层 | simple/matrix/branch 三种题型渲染已存在另一份实现，可直接收敛 |
| 通过补齐样式别名接入共享组件，而不大面积重写 CSS | 保留现有视觉语义，降低重构回归面 |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| `pyproject.toml` 不存在 | 1 | 确认该仓库当前验证入口以 `package.json` 为主 |

## Notes
- 重点不是“把文件拆碎”，而是让已有公共组件真正承接主链路
- 修改前后都要同步更新 `findings.md` 和 `progress.md`
