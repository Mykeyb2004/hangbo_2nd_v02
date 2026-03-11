# Task Plan: Mobile Audience Tab Switching Investigation

## Goal
定位手机端切换 4 个客群标签时偶发“不及时”的原因，只做排查和结论输出，不修改业务代码。

## Current Phase
Phase 5

## Phases

### Phase 1: Requirements & Discovery
- [x] Understand user intent
- [x] Identify constraints and requirements
- [x] Document findings in findings.md
- **Status:** complete

### Phase 2: Interaction Path Analysis
- [x] Read audience switching entry points
- [x] Trace event handling and state updates
- [x] Document decisions with rationale
- **Status:** complete

### Phase 3: Render Cost Analysis
- [x] Inspect derived data and expensive renders
- [x] Check chart/table recomputation on tab switch
- [x] Narrow likely bottlenecks
- **Status:** complete

### Phase 4: Verification
- [x] Run targeted local verification
- [x] Cross-check findings against code paths
- [x] Document test results in progress.md
- **Status:** complete

### Phase 5: Delivery
- [x] Review notes and evidence
- [x] Summarize root cause candidates
- [ ] Deliver concise findings to user
- **Status:** in_progress

## Key Questions
1. 客群标签点击后，状态是否立即更新，还是被异步流程或重计算阻塞？
2. 切换时是否会让整页图表、表格、题块重新计算和重渲染，导致移动端主线程卡顿？

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| 先查 `report-dashboard.tsx` 和 `question-block.tsx` | 搜索结果显示这两个文件直接承载全局客群切换与题内页签切换 |
| 只做静态排查和必要验证，不动代码 | 用户明确要求先查问题 |
| 将根因收敛为“共享状态导致的整页更新”而非“点击事件延迟” | 代码和浏览器验证都显示按钮点击能立即触发状态变化，但会带来大面积重渲染 |
| 将样式过渡作为体感放大的次级因素 | `transition: 160ms` 会让高亮变化看起来不是瞬时发生 |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| `rg` 扫描不存在的目录返回 exit code 2 | 1 | 保留已有结果，后续改为只扫描存在路径 |

## Notes
- 聚焦移动端点击响应慢的根因，不扩散到样式微调
- 需要在每轮关键发现后同步到 `findings.md` 和 `progress.md`
