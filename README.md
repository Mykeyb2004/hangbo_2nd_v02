# Hangbo Survey Report

基于 Next.js 的展会满意度统计报告项目。前端页面不直接读取 Excel，而是在构建前将问卷原始数据聚合为 JSON，再由页面静态导入并渲染。

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

1. 原始问卷数据存放在 `data/data.xlsx`
2. 构建前执行 `uv run python scripts/build_survey_report_data.py`
3. 脚本读取 `data/data.xlsx` 和 `outputs/survey_field_mapping.csv`
4. 脚本输出 `data/report-data.json`
5. Next.js 页面导入 `data/report-data.json` 并渲染

[package.json](/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/package.json) 已配置：

- `prepare-data`: `uv run python scripts/build_survey_report_data.py`
- `predev`: 开发前自动生成 JSON
- `prebuild`: 构建前自动生成 JSON

所以运行 `npm run dev` 或 `npm run build` 时，数据会先自动预处理一次。

## `data.xlsx` 是否需要预处理

需要，但这是项目内的自动预处理，不是人工手工预处理。

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

结论是：

- 不需要手工把 Excel 转成 CSV/JSON 再使用
- 需要保留当前这一步自动聚合流程
- 如果只替换了 `data/data.xlsx` 且表头结构不变，重新运行 `npm run dev` 或 `npm run build` 即可

## 本地运行

仓库约定使用 `uv`。

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

- 如果 `data/data.xlsx` 的表头结构变化较大，可能需要重新生成或调整 `outputs/survey_field_mapping.csv`
- 如果新增题目但没有同步到字段映射和 `scripts/build_survey_report_data.py` 的 `SECTION_SPECS`，前端不会自动展示该题
- 当前项目的统计口径主要写在 [scripts/build_survey_report_data.py](/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/scripts/build_survey_report_data.py)
