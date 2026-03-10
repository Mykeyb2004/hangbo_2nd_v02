# Hangbo Survey Report

基于 Next.js 的展会满意度统计报告项目。前端页面不直接读取 Excel，而是读取手工维护或离线生成的 JSON 数据文件并静态渲染。

## 项目结构

- `data/data.xlsx`: 原始问卷数据
- `outputs/survey_field_mapping.csv`: 字段映射，定义题型、问题编号、适用范围和是否参与分析
- `scripts/generate_survey_field_mapping.py`: 解析 Excel 表头并生成字段映射
- `scripts/build_survey_report_data.py`: 将 Excel 和字段映射聚合为前端可消费的 JSON
- `data/report-data.json`: 前端实际读取的数据文件
- `app/page.tsx`: 页面入口，直接导入 `report-data.json`
- `components/`: 报告页面组件

## 数据读取方式

当前前端的数据入口是 [data/report-data.json](/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/data/report-data.json)，不是 [data/data.xlsx](/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/data/data.xlsx)。

页面入口 [app/page.tsx](/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/app/page.tsx) 中直接执行：

```tsx
import reportData from "@/data/report-data.json";
```

因此浏览器端不会解析 Excel，也不会在运行时做统计聚合。React 组件只负责消费已经生成好的 `meta`、`highlights`、`sections` 和 `statsByAudience`。

## 实际数据链路

1. 手工处理后的前端数据文件放在 `data/report-data.json`
2. Next.js 页面导入 `data/report-data.json` 并渲染

[package.json](/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/package.json) 已配置：

- `prepare-data`: `uv run python scripts/build_survey_report_data.py`

现在 `npm run dev` 和 `npm run build` 都不会自动生成数据。`prepare-data` 仅作为可选离线工具保留，供你在需要时手动从 Excel 重新生成 `data/report-data.json`。

## `data.xlsx` 是否需要预处理

如果你继续使用 Excel 作为原始来源，那么需要先做离线预处理；但这一步不再绑定到构建流程。

当前脚本会做这些事情：

- 读取 `.xlsx` 压缩包中的 XML，提取工作表行列数据
- 根据 `survey_field_mapping.csv` 识别字段类型和问题编号
- 跳过联系方式、提交时间、审核任务 id 等元数据字段
- 单选题按选项分布统计
- 评分题只保留 `1-10`，像 `11` 这样的值按缺失处理
- 多选题按 one-hot 列统计，`1=选中`，空值=未选
- 多选题“其他”文本列按“有填写人数”统计
- 开放题只输出填写率，不把原文直接送到前端
- 条件题 `Q15/Q16/Q17` 会按适用身份过滤后再统计，避免总体口径混算

当前约定是：

- 前端唯一数据入口是 `data/report-data.json`
- `npm run dev` / `npm run build` 不会自动覆盖这个文件
- 你可以手工上传处理后的 JSON
- 如果你想继续沿用现有脚本，也可以手动执行 `uv run python scripts/build_survey_report_data.py` 重新生成该文件

## 本地运行

仓库约定使用 `uv`。前端开发默认直接读取现成的 `data/report-data.json`。

```bash
npm run dev
```

如只想单独刷新前端数据：

```bash
uv run python scripts/build_survey_report_data.py
```

生产构建：

```bash
npm run build
```

## 当前实现特点

- 前端消费聚合结果而非原始答卷
- 每题支持按客群切换统计
- 分支题只在适用样本内统计
- 图表使用原生组件实现，未引入额外图表库
- 开放题当前只展示填写率，不做自动文本归纳

## 注意事项

- 如果你手工上传 `data/report-data.json`，其结构必须满足 [lib/report-types.ts](/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/lib/report-types.ts#L1)
- 如果继续从 `data/data.xlsx` 离线生成 JSON，而 Excel 表头结构变化较大，可能需要重新生成或调整 `outputs/survey_field_mapping.csv`
- 如果新增题目但没有同步到手工 JSON 或 `scripts/build_survey_report_data.py` 的 `SECTION_SPECS`，前端不会自动展示该题
- 当前项目的统计口径主要写在 [scripts/build_survey_report_data.py](/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/scripts/build_survey_report_data.py)
