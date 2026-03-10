#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import json
import re
import zipfile
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable
from xml.etree import ElementTree as ET

NS_MAIN = {"a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
NS_REL = {"r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships"}

METADATA_FIELD_RULES = {
    "提交序号": ("skip", "系统流水号，不属于问卷分析字段"),
    "状态": ("skip", "审核状态字段，且全列常量"),
    "Q5-联系方式（非必填）": ("skip", "联系方式涉及隐私，不建议纳入分析"),
    "扩展字段": ("skip", "系统保留字段"),
    "用户ID": ("skip", "系统用户字段"),
    "修改用户": ("skip", "系统用户字段"),
    "提交时间": ("skip", "提交时间元数据，非题目答案"),
    "修改时间": ("skip", "修改时间元数据，非题目答案"),
    "录音": ("skip", "平台扩展字段，无有效内容"),
    "填表时长": ("skip", "平台扩展字段，无有效内容"),
    "开始填表时间": ("skip", "平台扩展字段，无有效内容"),
    "待审核的任务id": ("skip", "工作流字段，且全列常量"),
    "上次审核的任务id": ("skip", "工作流字段，且全列常量"),
    "层级列表": ("skip", "平台扩展字段"),
    "待审核的用户": ("skip", "工作流字段，且全列常量"),
    "填表地址": ("skip", "平台扩展字段，无有效内容"),
    "用户名称": ("skip", "平台扩展字段，无有效内容"),
}

QUALITATIVE_COLUMNS = {
    "AV": "“其他”补充文本，建议人工归纳后再分析",
    "BD": "“其他”补充文本，建议人工归纳后再分析",
    "BE": "开放题文本，适合做文本归纳而非直接图表统计",
}

QUESTION_GROUP_OVERRIDES = {
    "Q12": "到达与入场体验",
    "Q13": "场馆环境与基础条件",
    "Q14": "测试阶段现场管理",
    "Q15": "参展商/服务商展会体验",
    "Q16": "观众展会体验",
    "Q17": "主办方工作人员展会体验",
    "Q21": "明显问题",
    "Q23": "待提升方面",
}

SCOPE_OVERRIDES = {
    "Q15": "参展商/服务商",
    "Q16": "观众",
    "Q17": "主办方工作人员",
}

TITLE_OVERRIDES = {
    "Q2": "受访身份",
    "Q3": "性别",
    "Q4": "年龄",
    "Q7": "总体满意度",
    "Q8": "整体体验是否达预期",
    "Q9": "是否愿意再次参加",
    "Q19": "是否感受到未完工状态",
    "Q20": "未完工状态影响程度",
    "Q24": "意见建议",
}

TEXT_REPLACEMENTS = {
    "联系方式（非必填）": "联系方式",
    "外部交通便利性（容易到达）": "外部交通便利性",
    "从入口到展区的动线安排": "入场动线安排",
    "展会区域整体环境整洁度": "展区环境整洁度",
    "卫生间、公共区域等基础配套情况": "基础配套情况",
    "休息区、等候区等便利设施设置": "休息等便利设施",
    "现场噪音、粉尘、围挡等对体验的影响控制": "施工干扰控制",
    "工作人员服务态度": "服务态度",
    "工作人员响应速度": "响应速度",
    "现场问题协调处理效率": "问题协调效率",
    "货运/卸货/进出场便利性": "货运进出场便利性",
    "与场馆方沟通协调顺畅度": "与场馆方沟通顺畅度",
    "现场接待/咨询服务": "接待咨询服务",
    "测试条件下的整体可执行性": "整体可执行性",
    "导视不清、找路不便": "导视不清/找路不便",
    "现场围挡/施工痕迹影响观感": "施工痕迹影响观感",
    "噪音、粉尘或异味影响体验": "噪音粉尘异味影响",
    "配套设施不足（休息区、餐饮、卫生间等）": "配套设施不足",
    "场馆服务响应不够及时": "服务响应不及时",
    "布撤展/物流组织不够顺畅": "布撤展物流不顺畅",
    "安全提示或秩序管理不足": "安全提示或秩序不足",
    "数字化服务/信息发布不够清晰": "数字化信息不清晰",
    "本次没有明显问题": "无明显问题",
}

EMPTY_MARKERS = {"", " ", None}


@dataclass
class ColumnProfile:
    sheet_name: str
    column: str
    source_header: str
    question_code: str
    question_group: str
    chart_title: str
    field_type: str
    applicable_to: str
    non_empty_count: int
    unique_count: int
    analysis_status: str
    skip_reason: str
    notes: str


def normalize_text(text: str) -> str:
    text = text.replace("\r", "\n")
    parts = [part.strip() for part in text.split("\n")]
    text = " / ".join(part for part in parts if part)
    text = re.sub(r"\s+", " ", text).strip(" /")
    return text


def col_to_index(col: str) -> int:
    value = 0
    for char in col:
        value = value * 26 + ord(char) - 64
    return value


def extract_text_from_si(node: ET.Element) -> str:
    return "".join(text_node.text or "" for text_node in node.iter("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t"))


def read_shared_strings(zf: zipfile.ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in zf.namelist():
        return []
    root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
    return [extract_text_from_si(item) for item in root.findall("a:si", NS_MAIN)]


def workbook_sheet_targets(zf: zipfile.ZipFile) -> list[tuple[str, str]]:
    workbook = ET.fromstring(zf.read("xl/workbook.xml"))
    rels = ET.fromstring(zf.read("xl/_rels/workbook.xml.rels"))
    rel_map = {node.attrib["Id"]: node.attrib["Target"] for node in rels}
    sheets = []
    for node in workbook.find("a:sheets", NS_MAIN):
        rel_id = node.attrib["{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"]
        target = rel_map[rel_id]
        if not target.startswith("xl/"):
            target = f"xl/{target}"
        sheets.append((node.attrib["name"], target))
    return sheets


def read_cell_value(cell: ET.Element, shared_strings: list[str]) -> str:
    cell_type = cell.attrib.get("t")
    if cell_type == "inlineStr":
        node = cell.find("a:is", NS_MAIN)
        return extract_text_from_si(node) if node is not None else ""
    value_node = cell.find("a:v", NS_MAIN)
    if value_node is None or value_node.text is None:
        return ""
    raw = value_node.text
    if cell_type == "s":
        return shared_strings[int(raw)]
    return raw


def read_sheet_rows(zf: zipfile.ZipFile, target: str, shared_strings: list[str]) -> list[dict[str, str]]:
    root = ET.fromstring(zf.read(target))
    rows = []
    for row in root.find("a:sheetData", NS_MAIN).findall("a:row", NS_MAIN):
        row_map: dict[str, str] = {}
        for cell in row.findall("a:c", NS_MAIN):
            ref = cell.attrib.get("r", "")
            col = "".join(ch for ch in ref if ch.isalpha())
            row_map[col] = read_cell_value(cell, shared_strings)
        rows.append(row_map)
    return rows


def clean_label(text: str) -> str:
    text = normalize_text(text)
    text = re.sub(r"^Q\d+-\s*", "", text)
    text = text.replace("【单选】", "")
    text = text.replace("【多选题】", "")
    text = text.replace("【多选】", "")
    text = text.replace("【开放题】", "")
    text = text.replace("【10分制】", "")
    text = re.sub(r"^[_—]+\s*", "", text)
    text = re.sub(r"^[0-9]+[.、]\s*", "", text)
    text = re.sub(r"\s+", " ", text)
    text = text.strip(" /-_")
    return TEXT_REPLACEMENTS.get(text, text)


def parse_header_components(header: str) -> tuple[str, str, str]:
    normalized = normalize_text(header)
    question_match = re.match(r"^(Q\d+)", normalized)
    question_code = question_match.group(1) if question_match else ""
    body = re.sub(r"^Q\d+-\s*", "", normalized)
    scope = ""
    scope_match = re.search(r"（([^）]+)）", body)
    if scope_match:
        scope = scope_match.group(1)
    body = re.sub(r"（[^）]+）", "", body)

    split_match = re.search(r"(?: / )?([—_].+)$", body)
    if split_match:
        intro = body[: split_match.start()].strip(" /")
        item = split_match.group(1)
    else:
        intro = body
        item = ""
    return question_code, clean_label(intro), clean_label(item)


def detect_field_type(header: str, column: str, values: list[str]) -> str:
    normalized = normalize_text(header)
    if normalized in METADATA_FIELD_RULES:
        return "metadata"
    if column in QUALITATIVE_COLUMNS:
        return "open_text"
    if "【开放题】" in header:
        return "open_text"
    if "【多选" in header:
        return "multiple_choice_option"
    if "【单选】" in header:
        return "single_choice"
    if "【10分制】" in header:
        return "rating_10pt"
    non_empty = [value for value in values if str(value).strip()]
    if non_empty and all(re.match(r"^\d+[.].+", value) for value in non_empty):
        return "single_choice"
    if non_empty and all(value == "1" for value in non_empty):
        return "multiple_choice_option"
    return "other"


def normalize_answers(field_type: str, values: list[str]) -> tuple[list[str], list[str]]:
    normalized: list[str] = []
    invalid_rating_values: list[str] = []
    for value in values:
        text = str(value).strip()
        if not text:
            continue
        if field_type == "rating_10pt":
            if re.fullmatch(r"\d+", text) and 1 <= int(text) <= 10:
                normalized.append(text)
            else:
                invalid_rating_values.append(text)
            continue
        normalized.append(text)
    return normalized, invalid_rating_values


def build_value_hint(field_type: str, non_empty_values: list[str]) -> str:
    unique_values = sorted(set(non_empty_values))
    if not unique_values:
        return ""
    if field_type == "rating_10pt":
        if "11" in unique_values:
            return "1-10 分，另含 11（疑似不适用/未体验）"
        return "1-10 分"
    if field_type == "multiple_choice_option":
        if all(value == "1" for value in unique_values):
            return "1=选中，空=未选"
        return "多选文本/补充说明"
    if field_type == "open_text":
        return "自由文本"
    if field_type == "single_choice":
        return " / ".join(unique_values)
    if len(unique_values) <= 8:
        return " / ".join(unique_values)
    return " / ".join(unique_values[:8]) + " ..."


def determine_group(question_code: str, intro: str) -> str:
    if question_code in QUESTION_GROUP_OVERRIDES:
        return QUESTION_GROUP_OVERRIDES[question_code]
    if question_code in TITLE_OVERRIDES:
        return TITLE_OVERRIDES[question_code]
    return intro


def determine_chart_title(
    column: str,
    question_code: str,
    intro: str,
    item: str,
    field_type: str,
) -> tuple[str, str]:
    applicable_to = SCOPE_OVERRIDES.get(question_code, "")

    if question_code in TITLE_OVERRIDES:
        return TITLE_OVERRIDES[question_code], applicable_to

    if question_code == "Q21":
        return f"明显问题-{item}", applicable_to
    if question_code == "Q23":
        return f"待提升-{item}", applicable_to
    if question_code in {"Q15", "Q16", "Q17"}:
        prefix = {
            "Q15": "参展商体验",
            "Q16": "观众体验",
            "Q17": "主办方体验",
        }[question_code]
        return f"{prefix}-{item}", applicable_to

    if item:
        return item, applicable_to

    if field_type == "metadata":
        return clean_label(intro or column), applicable_to

    return clean_label(intro or column), applicable_to


def determine_analysis_status(
    column: str,
    normalized_header: str,
    field_type: str,
    non_empty_values: list[str],
) -> tuple[str, str]:
    if normalized_header in METADATA_FIELD_RULES:
        return METADATA_FIELD_RULES[normalized_header]
    if column in QUALITATIVE_COLUMNS:
        return "qualitative_review", QUALITATIVE_COLUMNS[column]
    if not non_empty_values:
        return "skip", "本列无有效作答"
    return "analyze", ""


def build_notes(
    field_type: str,
    question_code: str,
    non_empty_values: list[str],
    invalid_rating_values: list[str],
    analysis_status: str,
) -> str:
    notes: list[str] = []
    if field_type == "rating_10pt" and invalid_rating_values:
        invalid_text = "/".join(sorted(set(invalid_rating_values)))
        notes.append(f"原始值中的 {invalid_text} 已按空值处理")
    if question_code in {"Q15", "Q16", "Q17"}:
        notes.append("条件题，仅对对应身份样本有值")
    if analysis_status == "qualitative_review":
        notes.append("建议单独做文本归纳")
    return "；".join(notes)


def profile_sheet(sheet_name: str, rows: list[dict[str, str]]) -> list[ColumnProfile]:
    if not rows:
        return []
    header_row = rows[0]
    columns = sorted(header_row, key=col_to_index)
    response_count = max(len(rows) - 1, 0)
    profiles: list[ColumnProfile] = []

    for column in columns:
        header = header_row.get(column, "")
        values = [row.get(column, "") for row in rows[1:]]
        non_empty_values = [value for value in values if str(value).strip()]
        normalized_header = normalize_text(header)
        question_code, intro, item = parse_header_components(header)
        field_type = detect_field_type(header, column, values)
        non_empty_values, invalid_rating_values = normalize_answers(field_type, values)
        question_group = determine_group(question_code, intro)
        chart_title, applicable_to = determine_chart_title(column, question_code, intro, item, field_type)
        analysis_status, skip_reason = determine_analysis_status(column, normalized_header, field_type, non_empty_values)
        unique_count = len(set(non_empty_values))
        notes = build_notes(field_type, question_code, non_empty_values, invalid_rating_values, analysis_status)
        profiles.append(
            ColumnProfile(
                sheet_name=sheet_name,
                column=column,
                source_header=normalized_header,
                question_code=question_code,
                question_group=question_group,
                chart_title=chart_title,
                field_type=field_type,
                applicable_to=applicable_to,
                non_empty_count=len(non_empty_values),
                unique_count=unique_count,
                analysis_status=analysis_status,
                skip_reason=skip_reason,
                notes=notes,
            )
        )

    return disambiguate_duplicate_titles(profiles)


def disambiguate_duplicate_titles(profiles: list[ColumnProfile]) -> list[ColumnProfile]:
    title_groups: dict[str, list[ColumnProfile]] = defaultdict(list)
    for profile in profiles:
        title_groups[profile.chart_title].append(profile)

    for title, group in title_groups.items():
        if len(group) == 1:
            continue
        for profile in group:
            if profile.applicable_to:
                profile.chart_title = f"{profile.applicable_to}-{title}"
            elif profile.question_group and profile.question_group != title:
                profile.chart_title = f"{profile.question_group}-{title}"
    return profiles


def write_csv(path: Path, profiles: Iterable[ColumnProfile]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    field_names = [
        "sheet_name",
        "column",
        "question_code",
        "question_group",
        "chart_title",
        "field_type",
        "applicable_to",
        "non_empty_count",
        "unique_count",
        "analysis_status",
        "skip_reason",
        "notes",
        "source_header",
    ]
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=field_names)
        writer.writeheader()
        for profile in profiles:
            writer.writerow(profile.__dict__)


def write_json(path: Path, profiles: Iterable[ColumnProfile]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    data = [
        {
            "sheet_name": profile.sheet_name,
            "column": profile.column,
            "question_code": profile.question_code,
            "question_group": profile.question_group,
            "chart_title": profile.chart_title,
            "field_type": profile.field_type,
            "applicable_to": profile.applicable_to,
            "non_empty_count": profile.non_empty_count,
            "unique_count": profile.unique_count,
            "analysis_status": profile.analysis_status,
            "skip_reason": profile.skip_reason,
            "notes": profile.notes,
            "source_header": profile.source_header,
        }
        for profile in profiles
    ]
    with path.open("w", encoding="utf-8") as handle:
        json.dump(data, handle, ensure_ascii=False, indent=2)


def build_summary(sheet_name: str, response_count: int, profiles: list[ColumnProfile]) -> str:
    field_type_counts = Counter(profile.field_type for profile in profiles)
    analysis_counts = Counter(profile.analysis_status for profile in profiles)
    skip_fields = [profile for profile in profiles if profile.analysis_status == "skip"]
    qualitative_fields = [profile for profile in profiles if profile.analysis_status == "qualitative_review"]
    normalized_rating_fields = [
        profile for profile in profiles if profile.field_type == "rating_10pt" and "已按空值处理" in profile.notes
    ]

    lines = [
        "# 杭博二期满意度问卷字段结构摘要",
        "",
        "## 数据概览",
        f"- 工作表：`{sheet_name}`",
        f"- 数据行数：{response_count}",
        f"- 字段数：{len(profiles)}",
        "",
        "## 字段类型统计",
    ]
    for field_type, count in sorted(field_type_counts.items()):
        lines.append(f"- `{field_type}`: {count}")

    lines.extend(
        [
            "",
            "## 分析建议统计",
        ]
    )
    for status, count in sorted(analysis_counts.items()):
        lines.append(f"- `{status}`: {count}")

    lines.extend(
        [
            "",
            "## 关键结构结论",
            "- 表头位于第 1 行，数据位于第 2-75 行。",
            "- `Q12`-`Q17` 为分组评分题；其中 `Q15`、`Q16`、`Q17` 属于按身份分流的条件题。",
            "- `Q21`、`Q23` 的多选题已经被导出为拆分后的 one-hot 列，通常 `1=选中，空=未选`。",
            "- `Q24` 为开放题；`Q21`/`Q23` 的“其他”列为补充文本，适合单独做文本归纳。",
            "- 末尾多列为问卷平台元数据或审核流程字段，不建议纳入满意度分析。",
        ]
    )

    if normalized_rating_fields:
        lines.extend(
            [
                "",
                "## 评分题空值处理",
                "- 以下评分题出现了非 `1-10` 的原始值，脚本已统一按空值处理：",
            ]
        )
        for profile in normalized_rating_fields:
            lines.append(f"- `{profile.column}` `{profile.chart_title}`: {profile.notes}")

    if qualitative_fields:
        lines.extend(["", "## 建议做文本归纳的字段"])
        for profile in qualitative_fields:
            lines.append(f"- `{profile.column}` `{profile.chart_title}`: {profile.skip_reason}")

    if skip_fields:
        lines.extend(["", "## 已标记为跳过的字段"])
        for profile in skip_fields:
            lines.append(f"- `{profile.column}` `{profile.chart_title}`: {profile.skip_reason}")

    return "\n".join(lines) + "\n"


def main() -> None:
    parser = argparse.ArgumentParser(description="Analyze the survey workbook and generate field mapping files.")
    parser.add_argument("--input", default="data/data.xlsx", help="Path to the source xlsx file")
    parser.add_argument("--output-dir", default="outputs", help="Directory for generated mapping files")
    args = parser.parse_args()

    input_path = Path(args.input)
    output_dir = Path(args.output_dir)
    if not input_path.exists():
        raise SystemExit(f"Input workbook not found: {input_path}")

    with zipfile.ZipFile(input_path) as zf:
        shared_strings = read_shared_strings(zf)
        sheets = workbook_sheet_targets(zf)
        if not sheets:
            raise SystemExit("No worksheet found in workbook.")
        sheet_name, target = sheets[0]
        rows = read_sheet_rows(zf, target, shared_strings)

    profiles = profile_sheet(sheet_name, rows)
    response_count = max(len(rows) - 1, 0)

    write_csv(output_dir / "survey_field_mapping.csv", profiles)
    write_json(output_dir / "survey_field_mapping.json", profiles)
    summary = build_summary(sheet_name, response_count, profiles)
    (output_dir / "survey_structure_summary.md").write_text(summary, encoding="utf-8")

    print(f"Analyzed workbook: {input_path}")
    print(f"Sheet: {sheet_name}")
    print(f"Responses: {response_count}")
    print(f"Fields: {len(profiles)}")
    print(f"Generated: {output_dir / 'survey_field_mapping.csv'}")
    print(f"Generated: {output_dir / 'survey_field_mapping.json'}")
    print(f"Generated: {output_dir / 'survey_structure_summary.md'}")


if __name__ == "__main__":
    main()
