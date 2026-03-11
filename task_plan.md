# Task Plan: Audience Filter Component Unification

## Goal
将顶部第 1 组客群筛选器抽成共用组件，并替换题块中后续所有客群筛选器，统一点击行为和状态语义。

## Current Phase
Phase 4

## Phases

### Phase 1: Discovery & Scope
- [x] Review current filter implementations
- [x] Confirm reuse scope across dashboard and question blocks
- [x] Record findings and assumptions
- **Status:** complete

### Phase 2: Shared Component Refactor
- [x] Align shared audience filter component API with current usage
- [x] Replace hero filter rendering with shared component
- [x] Replace question-level filters with shared component
- [x] Remove duplicated filter markup and obsolete styles
- **Status:** complete

### Phase 3: Verification
- [x] Run targeted build/type verification
- [x] Re-check affected files for regressions
- [x] Log results in progress.md
- **Status:** complete

### Phase 4: Delivery
- [x] Summarize implemented changes
- [x] Call out residual risks or follow-ups
- **Status:** complete

## Key Questions
1. 现有 `AudienceFilterTabs` 是否已足够承接顶部和题内两种筛选器，只缺接入和样式补齐？
2. 题内筛选器是否应该继续保留 `tab/tablist` 语义，还是统一为与顶部一致的 `button + aria-pressed` 过滤器语义？
3. 在统一组件后，是否还能保留题块的强调色能力，而不再维持两套独立 DOM 和样式？

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| 复用现有 `components/audience-filter-tabs.tsx`，不再新建第二套组件 | 仓库里已经存在共享组件雏形，继续收敛更稳妥 |
| 将题内筛选器语义统一为筛选按钮而非 tab | 它们控制的是同一份全局筛选状态，不对应独立 panel |
| 优先做最小侵入改造，不顺带重构 `report-dashboard.tsx` 为 `report-hero.tsx` | 用户诉求是修复筛选器实现，不是整页组件拆分 |
| 顺手补齐高亮卡片缺失的类型/导出 | 该缺口直接阻塞前端构建验证，且属于低风险静态修复 |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| `pyproject.toml` 不存在 | 1 | 确认该仓库当前验证入口以 `package.json` 为主 |

## Notes
- 上一轮排查已确认后续筛选器共享同一个全局状态，本轮只统一组件实现
- 修改前后都要同步更新 `findings.md` 和 `progress.md`
