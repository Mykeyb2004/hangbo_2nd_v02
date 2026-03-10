# Findings & Decisions

## Requirements
- 读取并理解 `data/data.xlsx` 的结构
- 编写 Python 脚本完成结构分析
- 生成字段映射文件
- 将题干精简成适合作为图表标题的表述
- 标记不需要分析的字段
- 基于原始数据、字段映射和问卷结构设计动态报告生成方案
- 方案不能写死具体统计值或固定客群结果
- 方案需要支持总体展示、分客群对比、客群专属题展示

## Research Findings
- 代码库当前很小，项目根目录只有 `data/`、`venv/` 与说明文件
- `data/data.xlsx` 已存在，文件大小约 25 KB，适合先做结构探查
- 工作簿只有 1 个工作表 `问卷数据`
- 表头在第 1 行，数据范围为 `A1:BS75`，共 71 列、74 条答卷
- 题目字段主要分为：基础属性题、单选题、10 分制评分题、拆列多选题、开放题、平台元数据
- `Q15`、`Q16`、`Q17` 是按受访身份分流的条件题，其中 `Q17` 当前整组无有效作答
- `Q21`、`Q23` 的多选题已拆成 one-hot 列，通常 `1=选中，空=未选`
- 多个“10分制”字段出现值 `11`，疑似代表“不适用/未体验”，正式分析前需要确认编码定义
- `Q24` 及多选题“其他”字段属于自由文本，更适合单独做文本归纳
- 联系方式、提交时间、审核任务 id 等列属于隐私或系统元数据，不建议纳入满意度分析
- 当前报告大纲已明确三层展示结构：`全体共性体验`、`客群共性对比`、`客群专属体验`
- `survey_field_mapping.csv` 当前包含 `47` 个可分析字段、`3` 个文本归纳字段、`21` 个跳过字段
- `applicable_to` 已可识别 `参展商/服务商`、`观众`、`主办方工作人员` 三类专属客群
- 当前样本身份分布并不均衡，因此开发方案必须支持最小样本量阈值和小样本不单列规则
- 开发重点不是静态写报告，而是构建“规则驱动 + 模板装配”的报告生成流程
- 全体共性可分析字段的 `question_group` 已能稳定覆盖总体态度、三大共性评分模块、测试状态和改进方向等章节主题
- 当前适用样本专属字段仅稳定覆盖 `参展商/服务商展会体验` 与 `观众展会体验`，主办方专属题需要 guard 逻辑处理无样本情况
- 当前仓库原本没有 Next.js 工程，需要从零创建前端骨架
- 实际存在的身份客群只有 `参展商`、`专业观众`、`普通观众`、`其他-电商服务商` 四类，因此页签只展示这四类加 `总体`
- `Q24` 在原始数据里 74 份样本均有填写，因此开放题填写率在总体视角下为 `100%`
- `Q21` 的最高问题选择项是 `导视不清、找路不便`，`Q23` 的最高改善方向是 `环境与基础配套`
- 使用原生 CSS/HTML 横向柱状图即可满足本任务的图表需求，无需额外图表库

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| 使用 `uv run` 执行脚本 | 符合仓库约定 |
| 使用标准库直接解析 `.xlsx` | 当前环境没有 `openpyxl` / `pandas`，避免增加依赖 |
| 同时生成 CSV、JSON、Markdown 三份结果 | 兼顾 Excel 复核、程序消费与人工阅读 |
| 动态报告模板应以字段映射和配置驱动章节生成 | 降低对单次样本结构的耦合 |
| 分支题只在适用样本内求总体，不参与全体总体汇总 | 避免不同适用范围数据被错误混算 |
| 模板配置和规则配置分离 | 一个定义“报告要长什么样”，一个定义“统计和分群怎么跑” |
| 前端先消费聚合后的 `report-data.json`，而不是直接读 Excel | 简化 Next.js 页面逻辑，提高可维护性 |
| 图表使用原生实现而不引入第三方库 | 保持工程轻量，减少安装和构建不确定性 |
| 开放题用“填写率”替代强行量化内容 | 兼顾问卷结构完整性和统计口径合理性 |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| `uv run` 中无法导入 `scripts.generate_survey_field_mapping` | 在脚本中显式注入项目根目录到 `sys.path` |
| `npm run build` 期间 `uv` 访问沙箱外缓存目录被拒绝 | 使用批准后的无沙箱构建完成编译验证 |

## Resources
- `/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/data/data.xlsx`
- `/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/venv`
- `/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/scripts/generate_survey_field_mapping.py`
- `/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/outputs/survey_field_mapping.csv`
- `/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/满意度研究报告大纲.md`
- `/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/configs/report_template.yaml`
- `/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/configs/report_rules.yaml`
- `/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/scripts/build_survey_report_data.py`
- `/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/data/report-data.json`
- `/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/app/page.tsx`
- `/Users/zhangqijin/PycharmProjects/hangbo_2nd_v02/components/question-block.tsx`

## Visual/Browser Findings
- 页面结构已按 `问卷.md` 的章节顺序展开，并提供左侧章节导航
- 每题都带有客群页签，切换后表格、样本数和柱状图会同步变化
- 总览区已提供样本量、关键指标卡和客群概览条，整体风格为浅色现代数据看板

## Code Reading Findings
- 前端页面入口 `app/page.tsx` 直接静态导入 `data/report-data.json`，没有在浏览器端解析 `data/data.xlsx`
- `package.json` 中 `predev` / `prebuild` 都会先执行 `uv run python scripts/build_survey_report_data.py`，说明 Excel 到 JSON 的预处理是当前运行链路的一部分
- `scripts/build_survey_report_data.py` 会先读取 `outputs/survey_field_mapping.csv`，再读取 `data/data.xlsx`，据此识别每个问题的列、题型和适用客群
- `scripts/generate_survey_field_mapping.py` 使用标准库直接解析 `.xlsx` 压缩包内的 XML，而不是依赖 `pandas` / `openpyxl`
- 评分题预处理口径是：只保留 `1-10`，其余值视为缺失；因此原始表中出现的 `11` 会被丢弃
- 多选题预处理口径是：one-hot 列中 `1=选中`、空值=未选；“其他”文本列按“有填写人数”统计
- 开放题 `Q24` 当前不会把原文传给前端，只输出填写率统计
- 条件题 `Q15/Q16/Q17` 会按身份过滤样本后再统计，避免在“总体”里把不适用样本混入分母
