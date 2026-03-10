# Task Plan: Next.js 问卷统计报告

## Goal
基于 `survey_field_mapping.csv`、`问卷.md` 和 `data/data.xlsx`，交付一个按问卷顺序展示的 Next.js 网页统计报告。每题都需要提供按“您本次的身份是？”切换的客群页签，并在页签过滤下同步展示统计表格和柱状图。

## Current Phase
Complete

## Phases
### Phase 1: Discovery & Data Scope
- [x] 确认仓库现状、问卷结构和字段映射
- [x] 明确题型、客群分布和分支题口径
- [x] 记录关键发现与风险
- **Status:** complete

### Phase 2: Data Pipeline
- [x] 编写前端可消费的 JSON 生成脚本
- [x] 处理单选、多选、10 分制、开放题填写率和分支矩阵题
- [x] 生成 `data/report-data.json`
- **Status:** complete

### Phase 3: Next.js UI Implementation
- [x] 初始化 App Router 工程
- [x] 完成现代化页面布局、章节导航和高亮概览
- [x] 完成每题页签、统计表格和柱状图组件
- **Status:** complete

### Phase 4: Verification & Handoff
- [x] 运行 `npm install`
- [x] 运行生产构建并清理 warning
- [x] 启动页面并抽查页签交互
- [x] 更新计划、发现和进度记录
- **Status:** complete

## Key Questions
1. 如何在不引入额外图表依赖的前提下，完成可读性足够的统计图表？
2. 分支题在“总体”页签下应如何避免与全样本口径混算？
3. 开放题无法直接做结构化图表时，用什么方式保持页面结构完整？

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| 使用 Python 标准库预处理 Excel，并输出前端 JSON | 避免在 Next.js 运行时解析 xlsx，也规避当前环境缺少 `openpyxl`/`pandas` |
| 图表使用原生 HTML/CSS 实现横向柱状图 | 减少依赖、降低构建风险，并保留表格作为可访问替代 |
| 每题单独维护本地客群页签状态 | 满足“每题都加入页签”的要求，避免一个全局筛选影响整页阅读 |
| 分支矩阵题在“总体”页签下仅统计适用样本 | 保证 `Q15`/`Q16`/`Q17` 不与全体样本混算 |
| 开放题展示填写率而不是文本内容 | 保留结构完整性，同时避免未经归纳直接展示原始意见文本 |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| `uv run` 环境缺少 `openpyxl` | 1 | 继续沿用已有标准库 xlsx 解析方案 |
| `uv run` 在 `npm run build` 中访问沙箱外缓存失败 | 1 | 申请无沙箱构建验证，确认 Next.js 工程能正常编译 |

## Notes
- 当前实际存在的客群页签为：`总体`、`参展商`、`专业观众`、`普通观众`、`其他 · 电商服务商`
- `Q17` 主办方分支当前无有效作答，页面保留结构并显示空状态提示
- `npm run dev` / `npm run build` 均会自动执行 `uv run python scripts/build_survey_report_data.py`
