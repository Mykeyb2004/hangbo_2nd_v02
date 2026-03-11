# Findings & Decisions

## Requirements
- 用户反馈：手机端打开平台，在切换 4 个客群标签时，点击标签后偶发感觉切换不及时。
- 新目标：将顶部第 1 组筛选器封装为共用组件，并替换后续题块筛选器。
- 输出应是已落地的代码改动和验证结果，不再停留在排查结论。

## Research Findings
- 搜索命中两个直接相关入口：
  - `/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/components/report-dashboard.tsx`
  - `/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/components/question-block.tsx`
- 仓库中已存在共享组件雏形 `/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/components/audience-filter-tabs.tsx`，以及已接入它的 `/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/components/report-hero.tsx`。
- 全局客群切换样式位于 `/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/app/globals.css`
- `report-dashboard.tsx` 中的全局客群按钮 `onClick={() => setActiveFilterKey(filter.key)}` 只做本地状态切换，没有等待接口请求。
- 所有题块都从 `ReportDashboard` 接收同一个 `activeFilterKey`，点击任一客群按钮都会让页面中每个 `QuestionBlock` 重新渲染。
- `question-block.tsx` 内部会在每次渲染时重新执行多个 `filter/map/some` 计算，并重新构造表格、柱状图、评分环和雷达图所需的数据。
- `RadarChart`、`BarChart`、`StatTable`、`ScoreRing` 都是纯函数组件，没有 `memo` 或缓存；父层状态变化时会整批重新执行。
- 当前报告数据规模不是小页面：4 个客群、5 个 section、15 个题块，其中 3 个矩阵题共 15 个矩阵项，1 个分支矩阵题含 3 个分支共 12 个分支项。
- 这意味着一次客群切换会同步刷新大量按钮、统计卡、表格和 SVG 图表，对手机主线程比桌面更敏感。
- 本地页面快照显示当前页面含 56 个页签按钮、63 个按钮、74 个 `article`、9 个表格、12 个 SVG 图形，切换不是局部更新。
- 在本机浏览器里模拟点击全局客群按钮时，单次切换产生约 547 到 582 次 DOM mutation，首帧更新时间约 33.2ms 到 53.7ms；真实手机通常会更慢。
- `.audience-pill` 和 `.tab-button` 默认带有 160ms 的 `transition`，即使状态很快提交，视觉高亮也会有一个刻意的过渡时间。
- `report-dashboard.tsx` 在组件 render 顶部直接构造 `visibleSections`，会在每次 `activeFilterKey` 变化时重新 `map/filter` 出新的 section/question 对象，进一步放大子树重渲染范围。
- 题目内客群页签并不是局部状态；浏览器验证显示点击任一题块里的“参展商”页签，会同步改掉顶部全局客群按钮，说明这是一次整页筛选，而不是局部 tab。
- 当前 `AudienceFilterTabs` 还未接入 `report-dashboard.tsx` 和 `question-block.tsx`，并且 `app/globals.css` 中尚未定义 `filter-tabs` / `filter-tab` / `filter-tab-badge` 样式，说明它是一个未完成接线的共享组件。
- 题内筛选器当前使用 `role="tablist"` / `role="tab"`，但其行为本质上是全局过滤器；顶部筛选器使用的是更贴合当前行为的 `aria-pressed`。
- 改造后，顶部筛选器与所有题块筛选器都统一为 `group > button[aria-pressed]` 结构，并共享 `AudienceFilterTabs`。
- 题块筛选器保留了按题块强调色高亮的能力，通过 `--filter-accent` 注入，不再需要独立的 `tab-button` 样式体系。
- 浏览器验证显示，点击任意题块筛选器后，顶部筛选器与其他题块筛选器同步更新为相同 pressed 状态，说明当前页面已经只剩一套筛选器实现。
- `uv run npm run build` 已通过；此前阻塞构建的 `highlight-card` 缺失 helper/type 问题已补齐。

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| 先梳理点击到渲染的链路，再看具体性能热点 | 用户描述是“有时不及时”，优先判断是否存在偶发阻塞或竞争 |
| 把“整页重渲染”作为首要嫌疑点继续验证 | 当前代码没有异步请求链路，主要成本看起来集中在 React 渲染和派生计算 |
| 将“样式过渡叠加重渲染”作为最终结论方向 | 这更符合“点击有时感觉切换不及时”的体感描述 |
| 排除老式移动端点击延迟 | 页面具备正常 viewport，且问题更符合渲染后置而不是 click 触发延迟 |
| 本轮改造直接复用 `AudienceFilterTabs` | 与用户要求一致，也能避免顶部与题内继续维护两份按钮实现 |
| 统一筛选器语义为 `button + aria-pressed` | 当前所有筛选器都控制同一份过滤状态，不是局部 tab 切 panel |
| 保留题块色彩差异，但底层按钮结构完全统一 | 满足“用第 1 个筛选器替换后续筛选器”的目标，同时不丢失视觉区分 |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| 搜索命令包含不存在目录，退出码非零 | 采用已有命中结果，后续收窄路径 |
| `pyproject.toml` 不存在 | 验证入口改为 `package.json` 中的前端构建脚本 |
| 前端构建被 `highlight-card` 缺失导出阻塞 | 补充 `HighlightKind` 类型和 `getHighlightToneClassName` helper 后恢复 |

## Resources
- `/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/components/report-dashboard.tsx`
- `/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/components/question-block.tsx`
- `/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/components/audience-filter-tabs.tsx`
- `/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/app/globals.css`
- `/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/data/reports/2026/03.json`

## Visual/Browser Findings
- Next 输出包含 `meta[name="viewport"] = "width=device-width, initial-scale=1"`，不存在老式 300ms 点击延迟问题。
- 页面在移动端宽度下仍一次性渲染完整内容，没有虚拟列表或按需挂载。
- 页面在移动端宽度下约有 1731 个 DOM 元素。
- 点击题块内部页签后，顶部全局客群状态同步切换，验证了“局部点击触发全局更新”。
