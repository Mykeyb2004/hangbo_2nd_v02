# Findings & Decisions

## Requirements
- 用户要求：在报告页前增加一个模仿手机屏幕解锁的数字页面，点击数字输入 PIN 后才可查看报告。
- 用户明确要求：PIN 判断逻辑不能暴露到前端源码中。
- 约束：当前没有数据库，也没有账号/token 鉴权体系；解锁界面风格需要与现有报告页保持一致。

## Research Findings
- 当前页面入口 [app/page.tsx](/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/app/page.tsx) 会在服务端先调用 `loadRequestedReport()` 读取报告数据，然后把 `data` 直接传给客户端组件 `ReportDashboard`。
- 当前报告数据加载位于 [lib/report-loader.ts](/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/lib/report-loader.ts)，不存在任何 session、cookie、middleware 或 API 鉴权链路。
- 如果只在客户端组件里加“解锁遮罩”，报告数据仍会先进入浏览器，达不到“避免源码或网络层泄露报告内容”的目标。
- 现有视觉语言定义在 [app/globals.css](/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/app/globals.css)，核心特征是：
  - 浅色玻璃拟态卡片
  - 蓝色主色 + 琥珀色点缀
  - `Avenir Next` / `PingFang SC` 与 `IBM Plex Mono` 的字体组合
  - 柔和阴影、渐变背景和漂浮光斑
- 因为用户明确希望“模仿手机屏幕解锁”，更适合做成独立解锁卡片，而不是普通密码输入框；但风格应沿用当前玻璃感、圆角和配色，避免做成原生 iOS/Android 的强仿制皮肤。
- `ReportScaffold` 已经提供全页背景和漂浮光斑，适合作为解锁页与报告页共用的外层容器。
- 现有组件和样式普遍把 44px 作为可点击控件的最低高度，数字键盘按钮应继续沿用这一触控基线。

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| PIN 校验放在服务端 API 或 Server Action | 防止 PIN 出现在客户端 bundle 中 |
| 解锁状态使用 `HttpOnly` cookie | 客户端 JS 无法读取，且不需要数据库 |
| 页面在校验 cookie 前不加载报告数据 | 避免“先把数据传到前端，再遮罩”的伪保护 |
| 解锁 UI 延续当前设计 token | 保持站点整体风格一致，减少视觉断层 |
| 复用同一路由 `/` 做条件渲染 | 可直接保留 `year/month` 查询参数，无需单独增加登录页跳转 |
| 未配置 `REPORT_UNLOCK_PIN` 时保持原有直达行为 | 降低本地开发和已有部署的切换成本，按需开启解锁门槛 |

## Verification Findings
- `uv run npm run build` 通过，新增 `/api/report-unlock` 路由正常编译。
- 在 `REPORT_UNLOCK_PIN=123456` 条件下，访问 `/?year=2026&month=03` 时先显示锁屏页，说明服务端 gating 生效。
- 输入错误 PIN `111111` 后，页面停留在锁屏页并展示“PIN 不正确，请重试。”错误信息。
- 输入正确 PIN `123456` 后，页面切换回报告正文，URL 中的 `year=2026&month=03` 参数保持不变。
- Playwright 读取到 `report_unlock` cookie 为 `httpOnly: true`，符合设计预期。

## Follow-up Adjustments
- 按用户要求简化解锁页说明区，仅保留中间一张 meta 卡片，移除原第 1、3 张说明卡内容。
- `REPORT_UNLOCK_PIN` 的读取方式切换为项目根目录 `.env`，并补充 `.env.example` 说明结构。

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| 当前规划文件仍停留在上一轮组件重构任务 | 已切换 `task_plan.md` 到本轮“Report Unlock Gate”目标 |
| 浏览器上下文残留 cookie 导致初次验证直接进入报告页 | 清空 cookie 后重新验证未解锁链路 |

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
