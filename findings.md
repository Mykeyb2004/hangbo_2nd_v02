# Findings & Decisions

## Requirements
- 用户反馈：手机端打开平台，在切换 4 个客群标签时，点击标签后偶发感觉切换不及时。
- 本轮目标：先查问题，不改代码。
- 输出应包含原因定位和证据链，重点解释是否是点击事件、状态更新或渲染性能问题。

## Research Findings
- 搜索命中两个直接相关入口：
  - `/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/components/report-dashboard.tsx`
  - `/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/components/question-block.tsx`
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

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| 先梳理点击到渲染的链路，再看具体性能热点 | 用户描述是“有时不及时”，优先判断是否存在偶发阻塞或竞争 |
| 把“整页重渲染”作为首要嫌疑点继续验证 | 当前代码没有异步请求链路，主要成本看起来集中在 React 渲染和派生计算 |
| 将“样式过渡叠加重渲染”作为最终结论方向 | 这更符合“点击有时感觉切换不及时”的体感描述 |
| 排除老式移动端点击延迟 | 页面具备正常 viewport，且问题更符合渲染后置而不是 click 触发延迟 |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| 搜索命令包含不存在目录，退出码非零 | 采用已有命中结果，后续收窄路径 |

## Resources
- `/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/components/report-dashboard.tsx`
- `/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/components/question-block.tsx`
- `/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/app/globals.css`
- `/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/data/reports/2026/03.json`

## Visual/Browser Findings
- Next 输出包含 `meta[name="viewport"] = "width=device-width, initial-scale=1"`，不存在老式 300ms 点击延迟问题。
- 页面在移动端宽度下仍一次性渲染完整内容，没有虚拟列表或按需挂载。
- 页面在移动端宽度下约有 1731 个 DOM 元素。
- 点击题块内部页签后，顶部全局客群状态同步切换，验证了“局部点击触发全局更新”。
