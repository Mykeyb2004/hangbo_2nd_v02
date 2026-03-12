# 组件清单

| 组件名 | 功能 | 代码文件名 | 备注 |
|---|---|---|---|
| `ReportDashboard` | 报告页主编排组件，负责全局客群状态、期数切换和 section 组装 | `components/report-dashboard.tsx` | 当前主链路入口，已收敛为状态编排层 |
| `ReportHero` | 渲染报告头部，包括标题、摘要指标、期数切换和全局筛选 | `components/report-hero.tsx` | 组合 `HighlightsGrid`、`PeriodPicker`、`AudienceFilterTabs` |
| `ReportScaffold` | 提供报告页主容器与背景装饰层 | `components/report-scaffold.tsx` | 结构型组件，包裹整页内容 |
| `ReportFooter` | 渲染页脚品牌与版权信息 | `components/report-footer.tsx` | 结构稳定，适合独立复用 |
| `QuickNav` | 提供右下角问卷结构快速跳转菜单 | `components/quick-nav.tsx` | 内部使用 dismissable layer 控制开合 |
| `SectionCard` | 渲染 section 标题、描述和内容容器 | `components/section-card.tsx` | 用于统一各问卷分节外壳 |
| `QuestionBlock` | 题目级业务容器，负责题卡布局、局部筛选器和题型分发 | `components/question-block.tsx` | 现已复用 `QuestionCardShell` 和 `question-renderers` |
| `QuestionCardShell` | 统一题卡头部、描述区和筛选器插槽 | `components/question-card-shell.tsx` | 题卡外壳抽象，减少重复 JSX |
| `AudienceFilterTabs` | 渲染客群筛选按钮组 | `components/audience-filter-tabs.tsx` | 顶部与题卡内部共用，支持紧凑模式和强调色 |
| `HighlightsGrid` | 渲染首页摘要指标卡片列表 | `components/highlights-grid.tsx` | 简单列表容器，内部循环 `HighlightCard` |
| `HighlightCard` | 渲染单个摘要指标卡，包括 icon、值和说明 | `components/highlight-card.tsx` | 内部使用自动缩字 hook，按高亮类型切换视觉 |
| `PeriodPicker` | 渲染年份/月度切换菜单 | `components/period-picker.tsx` | 内部封装双菜单交互与点击外部关闭 |
| `QuestionRenderers` | 提供 simple/matrix/branch 三类题目的公共渲染实现 | `components/question-renderers.tsx` | 包含缓存逻辑，减少矩阵题和分支题重复计算 |
| `MetricCard` | 渲染单个统计卡，支持分布型和评分型题目 | `components/metric-card.tsx` | `question-renderers` 的核心展示组件 |
| `StatTable` | 渲染选项分布统计表格 | `components/stat-table.tsx` | 强调最高样本项 |
| `BarChart` | 渲染选项分布柱状图 | `components/bar-chart.tsx` | 与 `StatTable` 搭配展示分布题结果 |
| `ScoreRing` | 渲染均值评分环图 | `components/score-ring.tsx` | 用于评分题和矩阵评分子项 |
| `RadarChart` | 渲染矩阵题/分支题的维度均值雷达图 | `components/radar-chart.tsx` | 支持维度说明列表与可访问性文案 |
