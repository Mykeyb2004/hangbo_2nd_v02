#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import json
import sys
import zipfile
from collections import Counter
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from scripts.generate_survey_field_mapping import (
    col_to_index,
    read_shared_strings,
    read_sheet_rows,
    workbook_sheet_targets,
)


REPORT_TITLE = "杭州国际博览中心二期（测试）展会体验与服务反馈统计报告"
REPORT_SUBTITLE = ""

AUDIENCE_ORDER = [
    "参展商",
    "专业观众",
    "普通观众",
    "展会服务商/搭建商/物流商",
    "主办方/协办方工作人员",
    "其他",
]

RATING_OPTIONS = [str(index) for index in range(1, 11)]

SECTION_SPECS: list[dict[str, Any]] = [
    {
        "id": "section-respondent",
        "index_label": "一",
        "title": "受访者信息",
        "questions": [
            {
                "id": "q2",
                "code": "Q2",
                "kind": "single_choice",
                "title": "您本次的身份是？",
                "badge": "单选题",
                "options": AUDIENCE_ORDER,
            },
            {
                "id": "q3",
                "code": "Q3",
                "kind": "single_choice",
                "title": "性别",
                "badge": "单选题",
                "options": ["男", "女"],
            },
            {
                "id": "q4",
                "code": "Q4",
                "kind": "single_choice",
                "title": "年龄",
                "badge": "单选题",
                "options": ["18-25岁", "26-35岁", "36-45岁", "46-55岁", "56岁以上"],
            },
        ],
    },
    {
        "id": "section-overall",
        "index_label": "二",
        "title": "总体体验评价",
        "questions": [
            {
                "id": "q7",
                "code": "Q7",
                "kind": "rating",
                "title": "请问您对本次在杭州国际博览中心二期参展/参观的总体满意程度如何？",
                "badge": "10分制单选",
                "description": "1 分代表“非常不满意”，10 分代表“非常满意”。",
            },
            {
                "id": "q8",
                "code": "Q8",
                "kind": "single_choice",
                "title": "在您看来，当前二期作为“测试展会场地”，整体体验是否达到您的预期？",
                "badge": "单选题",
                "options": ["超出预期", "基本符合预期", "略低于预期", "明显低于预期"],
            },
            {
                "id": "q9",
                "code": "Q9",
                "kind": "single_choice",
                "title": "如果后续二期场馆继续举办展会，您是否愿意再次选择/继续参加？",
                "badge": "单选题",
                "options": ["愿意", "视改善情况而定", "不太愿意", "不愿意"],
            },
        ],
    },
    {
        "id": "section-arrival",
        "index_label": "三",
        "title": "关键环节满意度评价",
        "description": "填写说明：请根据您的实际体验，对以下项目进行打分。1 分代表“非常不满意”，10 分代表“非常满意”。",
        "questions": [
            {
                "id": "q12",
                "code": "Q12",
                "kind": "matrix_rating",
                "title": "请您对以下“到达与入场体验”进行评价",
                "badge": "矩阵题 · 10分制",
                "items": [
                    "外部交通便利性（容易到达）",
                    "停车便利性",
                    "入馆流程顺畅性",
                    "现场导视与指引清晰度",
                    "从入口到展区的动线安排",
                ],
            },
            {
                "id": "q13",
                "code": "Q13",
                "kind": "matrix_rating",
                "title": "请您对以下“场馆环境与基础条件”进行评价",
                "badge": "矩阵题 · 10分制",
                "items": [
                    "展会区域整体环境整洁度",
                    "展区温度、通风及舒适度",
                    "卫生间、公共区域等基础配套情况",
                    "休息区、等候区等便利设施设置",
                    "现场噪音、粉尘、围挡等对体验的影响控制",
                ],
            },
            {
                "id": "q14",
                "code": "Q14",
                "kind": "matrix_rating",
                "title": "请您对以下“测试阶段现场管理”进行评价",
                "badge": "矩阵题 · 10分制",
                "items": [
                    "现场秩序管理",
                    "安全管理与风险提示",
                    "工作人员服务态度",
                    "工作人员响应速度",
                    "现场问题协调处理效率",
                ],
            },
            {
                "id": "q15-17",
                "kind": "branch_matrix",
                "title": "请您对以下“展会体验”进行评价",
                "badge": "按身份显示的分支矩阵题 · 10分制",
                "description": "这里使用逻辑跳转，不同身份看到不同小项；统计结果仅在适用样本内计算。",
                "branches": [
                    {
                        "id": "q15",
                        "code": "Q15",
                        "label": "若为展会服务商/搭建商/物流商，则评价",
                        "applicable_audiences": ["参展商", "展会服务商/搭建商/物流商"],
                        "items": [
                            "布撤展便利性",
                            "货运/卸货/进出场便利性",
                            "餐饮、休息等配套便利性",
                            "与场馆方沟通协调顺畅度",
                        ],
                    },
                    {
                        "id": "q16",
                        "code": "Q16",
                        "label": "若为观众/专业观众/其他，则评价",
                        "applicable_audiences": ["专业观众", "普通观众", "其他"],
                        "items": [
                            "展区参观便利性",
                            "找馆找展便利性",
                            "现场接待/咨询服务",
                            "餐饮、休息等配套便利性",
                        ],
                    },
                    {
                        "id": "q17",
                        "code": "Q17",
                        "label": "若为主办方/协办方工作人员，则评价",
                        "applicable_audiences": ["主办方/协办方工作人员"],
                        "items": [
                            "场地适配性",
                            "现场支持配合",
                            "问题响应效率",
                            "测试条件下的整体可执行性",
                        ],
                    },
                ],
            },
        ],
    },
    {
        "id": "section-test-state",
        "index_label": "四",
        "title": "针对“测试”状态的专项评价",
        "questions": [
            {
                "id": "q19",
                "code": "Q19",
                "kind": "single_choice",
                "title": "您是否感受到当前二期场馆尚处于分阶段启用/部分未完工状态？",
                "badge": "单选题",
                "options": ["明显感受到", "有一定感受", "不太明显", "基本没感受到"],
            },
            {
                "id": "q20",
                "code": "Q20",
                "kind": "single_choice",
                "title": "当前场馆尚未完全完工的情况，对您的体验影响程度如何？",
                "badge": "单选题",
                "options": ["影响很大", "有一定影响", "影响较小", "基本没有影响"],
            },
            {
                "id": "q21",
                "code": "Q21",
                "kind": "multiple_choice",
                "title": "以下哪些问题是您本次体验中感受较明显的？",
                "badge": "多选题",
                "description": "比例按当前筛选样本量计算；“其他”按文本补充人数统计。",
                "options": [
                    "导视不清、找路不便",
                    "停车或上下客不便",
                    "现场围挡/施工痕迹影响观感",
                    "噪音、粉尘或异味影响体验",
                    "配套设施不足（休息区、餐饮、卫生间等）",
                    "场馆服务响应不够及时",
                    "布撤展/物流组织不够顺畅",
                    "安全提示或秩序管理不足",
                    "数字化服务/信息发布不够清晰",
                    "其他",
                    "本次没有明显问题",
                ],
            },
        ],
    },
    {
        "id": "section-suggestions",
        "index_label": "五",
        "title": "评价或建议",
        "questions": [
            {
                "id": "q23",
                "code": "Q23",
                "kind": "multiple_choice",
                "title": "您觉得场馆哪些方面还有待提升？",
                "badge": "多选题",
                "description": "比例按当前筛选样本量计算；“其他”按文本补充人数统计。",
                "options": [
                    "导视与动线",
                    "环境与基础配套",
                    "布撤展/物流组织",
                    "现场服务响应",
                    "安全秩序管理",
                    "餐饮服务",
                    "其他",
                ],
            },
            {
                "id": "q24",
                "code": "Q24",
                "kind": "open_text",
                "title": "请写下您对本次二期展会体验的意见或建议。",
                "badge": "开放题",
                "description": "开放题内容未做自动语义归纳，这里仅统计填写率。",
            },
        ],
    },
]


@dataclass
class MappingRow:
    column: str
    question_code: str
    chart_title: str
    field_type: str
    analysis_status: str
    applicable_to: str
    source_header: str
    notes: str


def strip_numeric_prefix(text: str) -> str:
    text = str(text or "").replace("\r", " ").replace("\n", " ").strip()
    while text.startswith(("—", "_")):
        text = text[1:].strip()
    for separator in (".", "、"):
        prefix, marker, suffix = text.partition(separator)
        if marker and prefix.isdigit():
            return suffix.strip()
    return text


def normalize_categorical_answer(raw_value: str) -> str:
    label = strip_numeric_prefix(raw_value)
    if not label:
        return ""
    if label.startswith("其他"):
        return "其他"
    return label


def audience_display_label(raw_value: str) -> str:
    label = strip_numeric_prefix(raw_value)
    if label.startswith("其他-"):
        return label.replace("其他-", "其他 · ", 1)
    return label


def audience_base_label(raw_value: str) -> str:
    label = strip_numeric_prefix(raw_value)
    if label.startswith("其他"):
        return "其他"
    return label


def slugify(value: str) -> str:
    cleaned = []
    for char in value.lower():
        if char.isascii() and char.isalnum():
            cleaned.append(char)
        else:
            cleaned.append("-")
    slug = "".join(cleaned)
    while "--" in slug:
        slug = slug.replace("--", "-")
    return slug.strip("-") or "group"


def load_mapping_rows(path: Path) -> dict[str, list[MappingRow]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        grouped: dict[str, list[MappingRow]] = {}
        for row in reader:
            mapping_row = MappingRow(
                column=row["column"],
                question_code=row["question_code"],
                chart_title=row["chart_title"],
                field_type=row["field_type"],
                analysis_status=row["analysis_status"],
                applicable_to=row["applicable_to"],
                source_header=row["source_header"],
                notes=row["notes"],
            )
            grouped.setdefault(mapping_row.question_code, []).append(mapping_row)
    for rows in grouped.values():
        rows.sort(key=lambda item: col_to_index(item.column))
    return grouped


def load_workbook_rows(path: Path) -> tuple[list[dict[str, str]], dict[str, str]]:
    with zipfile.ZipFile(path) as workbook:
        shared_strings = read_shared_strings(workbook)
        sheet_name, target = workbook_sheet_targets(workbook)[0]
        rows = read_sheet_rows(workbook, target, shared_strings)
    if not rows:
        raise SystemExit("Workbook does not contain any rows.")
    return rows[1:], rows[0]


def sort_audience_entries(entries: list[dict[str, Any]]) -> list[dict[str, Any]]:
    order_map = {label: index for index, label in enumerate(AUDIENCE_ORDER)}
    return sorted(
        entries,
        key=lambda item: (
            order_map.get(item["baseLabel"], len(order_map)),
            item["displayOrder"],
            -item["count"],
            item["label"],
        ),
    )


def build_audience_tabs(rows: list[dict[str, str]], audience_column: str) -> tuple[list[dict[str, Any]], dict[str, dict[str, Any]]]:
    grouped: dict[str, dict[str, Any]] = {}
    for row in rows:
        raw_value = str(row.get(audience_column, "") or "").strip()
        if not raw_value:
            continue
        display_label = audience_display_label(raw_value)
        base_label = audience_base_label(raw_value)
        entry = grouped.setdefault(
            raw_value,
            {
                "rawValue": raw_value,
                "label": display_label,
                "baseLabel": base_label,
                "count": 0,
                "displayOrder": len(grouped),
            },
        )
        entry["count"] += 1

    tabs = [
        {
            "key": "overall",
            "label": "总体",
            "baseLabel": "总体",
            "count": len(rows),
            "rawValue": "",
        }
    ]
    lookup = {
        "overall": {
            "key": "overall",
            "label": "总体",
            "baseLabel": "总体",
            "count": len(rows),
            "rawValue": "",
        }
    }
    for index, entry in enumerate(sort_audience_entries(list(grouped.values())), start=1):
        key = f"aud-{index}-{slugify(entry['label'])}"
        tab = {
            "key": key,
            "label": entry["label"],
            "baseLabel": entry["baseLabel"],
            "count": entry["count"],
            "rawValue": entry["rawValue"],
        }
        tabs.append(tab)
        lookup[key] = tab
    return tabs, lookup


def select_rows(rows: list[dict[str, str]], audience_column: str, audience: dict[str, Any]) -> list[dict[str, str]]:
    if audience["key"] == "overall":
        return rows
    raw_value = audience["rawValue"]
    return [row for row in rows if str(row.get(audience_column, "") or "").strip() == raw_value]


def select_branch_rows(
    rows: list[dict[str, str]],
    audience_column: str,
    audience: dict[str, Any],
    applicable_audiences: list[str],
) -> list[dict[str, str]]:
    if audience["key"] == "overall":
        return [
            row
            for row in rows
            if audience_base_label(str(row.get(audience_column, "") or "").strip()) in applicable_audiences
        ]
    if audience["baseLabel"] not in applicable_audiences:
        return []
    return select_rows(rows, audience_column, audience)


def build_single_choice_stats(
    rows: list[dict[str, str]],
    column: str,
    options: list[str],
) -> dict[str, Any]:
    base_count = len(rows)
    answers = [normalize_categorical_answer(row.get(column, "")) for row in rows]
    answers = [answer for answer in answers if answer]
    valid_count = len(answers)
    counts = Counter(answers)
    option_list = []
    for option in options:
        count = counts.get(option, 0)
        ratio = (count / valid_count) if valid_count else 0.0
        option_list.append({"label": option, "count": count, "ratio": round(ratio, 4)})
    return {
        "baseCount": base_count,
        "validCount": valid_count,
        "missingCount": max(base_count - valid_count, 0),
        "options": option_list,
        "note": "比例按有效作答样本计算。",
    }


def build_rating_stats(rows: list[dict[str, str]], column: str) -> dict[str, Any]:
    base_count = len(rows)
    answers = []
    for row in rows:
        raw_value = str(row.get(column, "") or "").strip()
        if raw_value.isdigit() and 1 <= int(raw_value) <= 10:
            answers.append(raw_value)
    valid_count = len(answers)
    counts = Counter(answers)
    option_list = []
    weighted_sum = 0
    for option in RATING_OPTIONS:
        count = counts.get(option, 0)
        weighted_sum += int(option) * count
        ratio = (count / valid_count) if valid_count else 0.0
        option_list.append({"label": option, "count": count, "ratio": round(ratio, 4)})
    mean_score = round(weighted_sum / valid_count, 2) if valid_count else None
    high_score_rate = round(
        sum(counts.get(option, 0) for option in ("8", "9", "10")) / valid_count,
        4,
    ) if valid_count else None
    return {
        "baseCount": base_count,
        "validCount": valid_count,
        "missingCount": max(base_count - valid_count, 0),
        "options": option_list,
        "meanScore": mean_score,
        "highScoreRate": high_score_rate,
        "note": "比例按有效作答样本计算；非 1-10 的值已作为缺失处理。",
    }


def build_multiple_choice_stats(
    rows: list[dict[str, str]],
    mapping_rows: list[MappingRow],
    option_labels: list[str],
) -> dict[str, Any]:
    base_count = len(rows)
    option_list = []
    for label, mapping_row in zip(option_labels, mapping_rows):
        if mapping_row.field_type == "open_text":
            count = sum(1 for row in rows if str(row.get(mapping_row.column, "") or "").strip())
        else:
            count = sum(1 for row in rows if str(row.get(mapping_row.column, "") or "").strip() == "1")
        ratio = (count / base_count) if base_count else 0.0
        option_list.append({"label": label, "count": count, "ratio": round(ratio, 4)})
    return {
        "baseCount": base_count,
        "validCount": base_count,
        "missingCount": 0,
        "options": option_list,
        "note": "比例按当前筛选样本量计算。",
    }


def build_open_text_stats(rows: list[dict[str, str]], column: str) -> dict[str, Any]:
    base_count = len(rows)
    answered_count = sum(1 for row in rows if str(row.get(column, "") or "").strip())
    return {
        "baseCount": base_count,
        "validCount": answered_count,
        "missingCount": max(base_count - answered_count, 0),
        "options": [
            {"label": "有填写", "count": answered_count, "ratio": round((answered_count / base_count), 4) if base_count else 0.0},
            {"label": "未填写", "count": max(base_count - answered_count, 0), "ratio": round(((base_count - answered_count) / base_count), 4) if base_count else 0.0},
        ],
        "note": "开放题仅展示填写率，未对文本内容做自动归纳。",
    }


def build_stats_by_audience(
    rows: list[dict[str, str]],
    audience_column: str,
    audiences: list[dict[str, Any]],
    builder,
) -> dict[str, Any]:
    stats = {}
    for audience in audiences:
        filtered_rows = select_rows(rows, audience_column, audience)
        stats[audience["key"]] = builder(filtered_rows)
    return stats


def build_matrix_items(
    rows: list[dict[str, str]],
    audience_column: str,
    audiences: list[dict[str, Any]],
    mapping_rows: list[MappingRow],
    item_labels: list[str],
) -> list[dict[str, Any]]:
    items = []
    for index, (mapping_row, item_label) in enumerate(zip(mapping_rows, item_labels), start=1):
        items.append(
            {
                "id": f"{mapping_row.question_code.lower()}-item-{index}",
                "title": item_label,
                "statsByAudience": build_stats_by_audience(
                    rows,
                    audience_column,
                    audiences,
                    lambda filtered_rows, column=mapping_row.column: build_rating_stats(filtered_rows, column),
                ),
            }
        )
    return items


def find_question_column(mapping_rows_by_code: dict[str, list[MappingRow]], question_code: str) -> str:
    rows = mapping_rows_by_code.get(question_code, [])
    if not rows:
        raise SystemExit(f"Unable to locate mapping rows for {question_code}.")
    return rows[0].column


def build_simple_questions(
    question_spec: dict[str, Any],
    rows: list[dict[str, str]],
    audience_column: str,
    audiences: list[dict[str, Any]],
    mapping_rows_by_code: dict[str, list[MappingRow]],
) -> dict[str, Any]:
    code = question_spec["code"]
    mapping_rows = mapping_rows_by_code.get(code, [])
    if not mapping_rows:
        raise SystemExit(f"Missing mapping rows for question {code}.")
    column = mapping_rows[0].column
    kind = question_spec["kind"]
    if kind == "single_choice":
        stats_by_audience = build_stats_by_audience(
            rows,
            audience_column,
            audiences,
            lambda filtered_rows: build_single_choice_stats(filtered_rows, column, question_spec["options"]),
        )
    elif kind == "rating":
        stats_by_audience = build_stats_by_audience(
            rows,
            audience_column,
            audiences,
            lambda filtered_rows: build_rating_stats(filtered_rows, column),
        )
    elif kind == "multiple_choice":
        stats_by_audience = build_stats_by_audience(
            rows,
            audience_column,
            audiences,
            lambda filtered_rows: build_multiple_choice_stats(filtered_rows, mapping_rows, question_spec["options"]),
        )
    elif kind == "open_text":
        stats_by_audience = build_stats_by_audience(
            rows,
            audience_column,
            audiences,
            lambda filtered_rows: build_open_text_stats(filtered_rows, column),
        )
    else:
        raise SystemExit(f"Unsupported question kind: {kind}")

    return {
        "id": question_spec["id"],
        "code": code,
        "kind": kind,
        "title": question_spec["title"],
        "badge": question_spec["badge"],
        "description": question_spec.get("description", ""),
        "statsByAudience": stats_by_audience,
    }


def build_branch_question(
    question_spec: dict[str, Any],
    rows: list[dict[str, str]],
    audience_column: str,
    audiences: list[dict[str, Any]],
    mapping_rows_by_code: dict[str, list[MappingRow]],
) -> dict[str, Any]:
    branches = []
    for branch_spec in question_spec["branches"]:
        mapping_rows = mapping_rows_by_code.get(branch_spec["code"], [])
        items = []
        for index, (mapping_row, item_label) in enumerate(zip(mapping_rows, branch_spec["items"]), start=1):
            stats = {}
            for audience in audiences:
                filtered_rows = select_branch_rows(
                    rows,
                    audience_column,
                    audience,
                    branch_spec["applicable_audiences"],
                )
                stats[audience["key"]] = build_rating_stats(filtered_rows, mapping_row.column)
            items.append(
                {
                    "id": f"{branch_spec['id']}-item-{index}",
                    "title": item_label,
                    "statsByAudience": stats,
                }
            )
        branches.append(
            {
                "id": branch_spec["id"],
                "code": branch_spec["code"],
                "label": branch_spec["label"],
                "applicableAudiences": branch_spec["applicable_audiences"],
                "items": items,
            }
        )

    return {
        "id": question_spec["id"],
        "kind": "branch_matrix",
        "title": question_spec["title"],
        "badge": question_spec["badge"],
        "description": question_spec.get("description", ""),
        "branches": branches,
    }


def build_sections(
    rows: list[dict[str, str]],
    audience_column: str,
    audiences: list[dict[str, Any]],
    mapping_rows_by_code: dict[str, list[MappingRow]],
) -> list[dict[str, Any]]:
    built_sections = []
    for section_spec in SECTION_SPECS:
        built_questions = []
        for question_spec in section_spec["questions"]:
            kind = question_spec["kind"]
            if kind in {"single_choice", "rating", "multiple_choice", "open_text"}:
                built_questions.append(
                    build_simple_questions(question_spec, rows, audience_column, audiences, mapping_rows_by_code)
                )
            elif kind == "matrix_rating":
                mapping_rows = mapping_rows_by_code.get(question_spec["code"], [])
                built_questions.append(
                    {
                        "id": question_spec["id"],
                        "code": question_spec["code"],
                        "kind": "matrix_rating",
                        "title": question_spec["title"],
                        "badge": question_spec["badge"],
                        "description": question_spec.get("description", ""),
                        "items": build_matrix_items(
                            rows,
                            audience_column,
                            audiences,
                            mapping_rows,
                            question_spec["items"],
                        ),
                    }
                )
            elif kind == "branch_matrix":
                built_questions.append(
                    build_branch_question(question_spec, rows, audience_column, audiences, mapping_rows_by_code)
                )
            else:
                raise SystemExit(f"Unsupported section question kind: {kind}")

        built_sections.append(
            {
                "id": section_spec["id"],
                "indexLabel": section_spec["index_label"],
                "title": section_spec["title"],
                "description": section_spec.get("description", ""),
                "questions": built_questions,
            }
        )
    return built_sections


def rating_summary(stat_block: dict[str, Any]) -> tuple[float | None, int]:
    return stat_block.get("meanScore"), stat_block.get("validCount", 0)


def top_option_label(stat_block: dict[str, Any], exclude: set[str] | None = None) -> str:
    exclude = exclude or set()
    options = [option for option in stat_block["options"] if option["label"] not in exclude]
    if not options:
        return "-"
    winner = max(options, key=lambda item: (item["ratio"], item["count"], item["label"]))
    return winner["label"]


def build_highlights(sections: list[dict[str, Any]]) -> list[dict[str, Any]]:
    q7 = sections[1]["questions"][0]["statsByAudience"]["overall"]
    q9 = sections[1]["questions"][2]["statsByAudience"]["overall"]
    q21 = sections[3]["questions"][2]["statsByAudience"]["overall"]
    q23 = sections[4]["questions"][0]["statsByAudience"]["overall"]

    willingness = next((option for option in q9["options"] if option["label"] == "愿意"), None)
    return [
        {
            "label": "总体满意度均值",
            "value": f"{q7['meanScore']:.2f}" if q7.get("meanScore") is not None else "-",
            "detail": f"有效样本 {q7['validCount']} 份",
        },
        {
            "label": "再次参加意愿",
            "value": f"{(willingness['ratio'] * 100):.1f}%" if willingness else "-",
            "detail": f"“愿意”人数 {willingness['count'] if willingness else 0}",
        },
        {
            "label": "最突出问题",
            "value": top_option_label(q21, exclude={"其他", "本次没有明显问题"}),
            "detail": "按多选题勾选率排序",
        },
        {
            "label": "优先改善方向",
            "value": top_option_label(q23, exclude={"其他"}),
            "detail": "按“待提升方面”选择率排序",
        },
    ]


def main() -> None:
    parser = argparse.ArgumentParser(description="Build a front-end friendly JSON dataset for the survey report.")
    parser.add_argument("--input", default="data/data.xlsx", help="Path to the source workbook")
    parser.add_argument("--mapping", default="outputs/survey_field_mapping.csv", help="Path to the field mapping CSV")
    parser.add_argument("--output", default="data/report-data.json", help="Where to write the aggregated report JSON")
    args = parser.parse_args()

    input_path = Path(args.input)
    mapping_path = Path(args.mapping)
    output_path = Path(args.output)

    if not input_path.exists():
        raise SystemExit(f"Workbook not found: {input_path}")
    if not mapping_path.exists():
        raise SystemExit(f"Field mapping not found: {mapping_path}")

    rows, _headers = load_workbook_rows(input_path)
    mapping_rows_by_code = load_mapping_rows(mapping_path)
    audience_column = find_question_column(mapping_rows_by_code, "Q2")
    audiences, audience_lookup = build_audience_tabs(rows, audience_column)
    sections = build_sections(rows, audience_column, audiences, mapping_rows_by_code)

    payload = {
        "meta": {
            "title": REPORT_TITLE,
            "subtitle": REPORT_SUBTITLE,
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "responseCount": len(rows),
            "audienceQuestion": "您本次的身份是？",
            "filters": audiences,
            "notes": [],
            "audienceLookup": audience_lookup,
        },
        "highlights": build_highlights(sections),
        "sections": sections,
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)

    print(f"Wrote report dataset to {output_path}")
    print(f"Responses: {len(rows)}")
    print(f"Audience tabs: {len(audiences)}")


if __name__ == "__main__":
    main()
