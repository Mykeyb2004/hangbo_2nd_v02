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

## 从 `data.xlsx` 生成 JSON

仓库约定使用 `uv`。如果你更新了 [data/data.xlsx](/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/data/data.xlsx) 或 [outputs/survey_field_mapping.csv](/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/outputs/survey_field_mapping.csv)，可以执行：

```bash
uv run python scripts/build_survey_report_data.py
```

默认会生成或覆盖：

- [data/report-data.json](/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/data/report-data.json)

如果你想输出到其他文件，也可以显式指定路径：

```bash
uv run python scripts/build_survey_report_data.py --output data/reports/2026/03.json
```

当前脚本默认不会自动同时写入 `data/report-data.json` 和 `data/reports/` 两个位置。如果你需要同时更新“默认展示数据”和“历史归档数据”，需要分别执行两次，或者在生成后手动复制文件。

## `data/reports` 命名规则

服务端优先读取 [data/reports](/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/data/reports) 下的归档 JSON；只有在该目录不存在可用归档时，才会回退到 [data/report-data.json](/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/data/report-data.json)。

归档目录和文件名必须遵循下面的规则：

- 年目录使用四位数字：`data/reports/YYYY/`
- 月文件使用两位数字：`MM.json`
- 合法示例：`data/reports/2026/03.json`
- 非法示例：`data/reports/26/3.json`、`data/reports/2026/3.json`、`data/reports/2026/March.json`

页面通过 URL 参数选择归档月份，例如：

- `/?year=2026&month=03`

如果请求的年月不存在，页面会自动回退到当前归档目录中最新的一期数据。

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

前端开发默认直接读取现成的 `data/report-data.json`，或者在存在归档时读取 `data/reports` 下最新一期。

```bash
npm run dev
```

如需启用报告 PIN 解锁页，可在项目根目录创建 `.env`，写入：

```bash
REPORT_UNLOCK_PIN=123456
```

说明：

- `REPORT_UNLOCK_PIN` 仅在服务端读取，不会下发到前端源码
- 仓库提供了 `.env.example` 作为结构参考
- 未配置该变量时，报告页维持原有直达访问行为
- 配置后，访问 `/` 时会先看到数字解锁页；解锁状态通过短期 `HttpOnly` cookie 保留

如只想单独刷新前端数据：

```bash
uv run python scripts/build_survey_report_data.py
```

生产构建：

```bash
npm run build
```

整理可部署目录：

```bash
npm run bundle
```

执行后会生成 `dist/`，其中包含：

- `server.js`
- `.next/static`
- `public/`
- `data/`

进入 `dist/` 后可直接执行：

```bash
node server.js
```

如果需要把发布目录压缩成单个包：

```bash
npm run bundle:archive
```

执行后会在项目根目录生成 `dist.tar.gz`。

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
