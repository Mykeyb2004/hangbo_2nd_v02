# Findings & Decisions

## Requirements
- 用户要求：深度分析当前代码，合理提取和接入公共组件，减少代码冗余，并让整体结构更合理。
- 输出应是已落地的重构代码和验证结果，而不是停留在建议层面。
- 改动需要尽量保持现有页面行为与视觉结构稳定。

## Research Findings
- 冗余最明显的两个入口仍是：
  - `/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/components/report-dashboard.tsx`
  - `/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/components/question-block.tsx`
- 仓库中已经有一批“已抽但未接线”的组件：
  - `/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/components/report-hero.tsx`
  - `/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/components/period-picker.tsx`
  - `/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/components/highlights-grid.tsx`
  - `/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/components/highlight-card.tsx`
  - `/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/components/quick-nav.tsx`
  - `/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/components/section-card.tsx`
  - `/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/components/report-footer.tsx`
  - `/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/components/report-scaffold.tsx`
- `report-dashboard.tsx` 当前同时重复了高亮卡 icon 映射、自动缩字逻辑、period menu 交互、快速导航弹层、section 外壳和 footer 标记；这些能力已经分别在 `highlight-card`、`use-auto-shrink-text`、`period-picker`、`quick-nav`、`section-card`、`report-footer` 中存在。
- `question-block.tsx` 当前重复了 `question-renderers.tsx` 与 `metric-card.tsx` 已提供的 simple/matrix/branch 三种题型渲染逻辑，只是 className 体系还未完全对齐。
- `question-renderers.tsx` 自带 `WeakMap` 缓存，可复用矩阵题和分支题的可见项、雷达图指标计算；`question-block.tsx` 当前版本没有这些缓存。
- `question-card-shell.tsx` 已经覆盖了题卡头部、描述和筛选器槽位，但主链路仍在手写同一份结构。
- 现有 CSS 仍主要绑定在旧 className 上，例如 `metric-panel`、`branch-block`、`metric-panel-head`；如果直接接入 `metric-card` / `branch-card` 会产生样式回归，因此需要先对齐 className 或样式语义。
- 最终重构采用“主链路接线 + 样式别名补齐”的方式：
  - `report-dashboard.tsx` 改为编排层，只保留筛选状态与 period 跳转逻辑
  - `ReportScaffold` / `ReportHero` / `SectionCard` / `QuickNav` / `ReportFooter` 正式接入主渲染流程
  - `question-block.tsx` 改为 `QuestionCardShell + question-renderers` 组合
  - `app/globals.css` 为 `metric-card` / `branch-card` / `panel-head` / `stack-lg` 增加语义兼容
- `useMemo(() => buildVisibleSections(data.sections), [data.sections])` 让 `visibleSections` 不再随客群筛选切换重复构造，避免顶层额外派生开销。
- `uv run npm run build` 已通过，Playwright 本地快照显示 hero、题卡、快速导航和 footer 都正常渲染。
- 浏览器点击题卡内“参展商”筛选按钮后，顶部全局筛选和其他题卡筛选器同步切换，说明重构后全局筛选链路仍然正常。

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| 本轮优先做“接线式重构” | 仓库里已有不少组件，只是没有进入主链路，先接线收益最高 |
| `report-dashboard.tsx` 只保留页面状态与导航职责 | 页面骨架、hero、quick nav、footer 应下沉到独立组件 |
| `question-block.tsx` 复用已有 shell/renderers，而不是继续维护第二套题型分发 | 这能同时减少 JSX 重复和统计派生逻辑重复 |
| 抽象时以复用现有 CSS 语义为先 | 目标是减少冗余，不是引入额外样式回归面 |
| 在样式层做 alias，而不是强行替换全部旧 className | 可以让共享组件平滑接入，避免改动面继续扩大 |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| 共享组件已存在但 className 体系与主链路不一致 | 通过补齐样式 alias，让共享组件平滑复用现有视觉语义 |

## Resources
- `/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/components/report-dashboard.tsx`
- `/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/components/question-block.tsx`
- `/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/components/question-renderers.tsx`
- `/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/components/question-card-shell.tsx`
- `/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/components/report-hero.tsx`
- `/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/components/quick-nav.tsx`
- `/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/components/report-footer.tsx`
- `/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/components/report-scaffold.tsx`
- `/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/app/globals.css`

## Visual/Browser Findings
- 本地页面快照显示 hero 区、问卷 section、题卡、高亮卡、快速导航和 footer 都已正常出现在 DOM 中。
- 点击题卡“您本次的身份是？”中的“参展商”后，顶部“全局客群筛选”和后续题卡筛选器均同步进入 pressed 状态。
- 浏览器唯一控制台报错仍是 `GET /favicon.ico 404`，与本轮组件重构无关。
