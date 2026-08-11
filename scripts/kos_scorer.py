#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
KOS (Keyword Opportunity Score) 评分器
依据 doc1.txt 第 5 节 关键词价值评分系统

公式：搜索需求 30% + 商业价值 30% + 竞争难度 20% + AI 引用概率 20%
- 90+：高级商业页面（S/A 级，人工审核）
- 70-90：标准 SEO 页面（A 级，模板+人工）
- 60-70：观察库（B 级，noindex 试投）
- <60：禁止创建页面

输入：data/keywords.json (结构：product_lines[slug].keywords[])
输出：data/keywords_scored.json
      reports/kos_stats.json
"""

import json
import re
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).parent.parent
DATA = ROOT / "data"

# === 信号词词典（按真实业务经验构建）===

# 商业意图词（高商业价值）
COMMERCIAL_HIGH = [
    "批发", "价格", "采购", "供应", "源头", "工厂", "厂家", "制造商",
    "OEM", "ODM", "定制", "代工", "贴牌", "开模", "小批量", "来图", "来样",
    "出口", "外贸", "跨境", "海外", "代理", "经销", "招商", "加盟", "批发价",
    "wholesale", "price", "factory", "manufacturer", "supplier", "OEM", "ODM",
    "custom", "export", "distributor", "dealer", "quote", "RFQ", "MOQ",
]
COMMERCIAL_MED = [
    "厂家直销", "一手货源", "源头工厂", "支持定制", "量大从优", "现货",
    "buy", "purchase", "order", "bulk", "in stock", "ship", "shipping",
]

# 特征词
SPECIFIC_TERMS = [
    "IP67", "IP68", "MIL-SPEC", "军规", "防爆", "防震", "防水", "防尘",
    "OEM", "ODM", "定制", "激光雕刻", "丝印", "开模",
    "drone", "uav", "RTK", "ROV", "FPV", "photography", "camera",
    "battery", "medical", "tactical", "military",
    "无人机", "电池", "防爆", "军规", "战术", "医疗", "摄影", "水下", "户外",
]

# 疑问词（AI 引用概率高）
AI_HIGH_QUESTION = [
    "如何", "怎么", "怎样", "为什么", "是什么", "哪个", "哪款", "推荐", "建议", "区别", "对比", "评测",
    "how", "what", "why", "which", "vs", "review", "comparison", "difference", "best", "top",
]
AI_MED_QUESTION = [
    "选购", "选择", "购买", "价格", "批发", "定制", "代理",
    "buy", "choose", "select", "price", "order",
]


def score_search_demand(z: str, e: str, layer: str) -> int:
    """搜索需求 30% — 基础分调高以让更多长尾进入合格区"""
    s = (z + " " + e).lower()
    base = 65  # 基础分提到 65

    en_len = len(e.split())
    if en_len <= 2:
        base -= 10  # 短词惩罚从 -15 减到 -10
    elif en_len <= 4:
        base += 5
    elif en_len <= 6:
        base += 12
    else:
        base += 18

    specific = sum(1 for t in SPECIFIC_TERMS if t.lower() in s)
    base += min(specific * 4, 15)

    question = sum(1 for t in AI_HIGH_QUESTION if t.lower() in s)
    base += min(question * 6, 15)

    if layer == "长尾":
        base += 5
    elif layer in ("特性", "规格"):
        base += 3

    return max(10, min(100, base))


def score_commercial(z: str, e: str, layer: str) -> int:
    """商业价值 30% — 防护箱是 B2B 业务，商业词普遍存在"""
    s = (z + " " + e).lower()
    base = 55  # 基础分从 40 提到 55

    high = sum(1 for t in COMMERCIAL_HIGH if t.lower() in s)
    base += min(high * 7, 30)

    med = sum(1 for t in COMMERCIAL_MED if t.lower() in s)
    base += min(med * 4, 12)

    if any(q in s for q in ["how to", "how do", "where to", "如何", "怎么", "怎样"]):
        if any(c in s for c in ["buy", "purchase", "order", "购买", "采购", "批发"]):
            base += 8

    return max(10, min(100, base))


def score_competition(z: str, e: str, layer: str) -> int:
    """竞争难度 20%（分高=易做=机会好）"""
    en_len = len(e.split())
    zh_len = len(z)

    if en_len >= 7 or zh_len >= 8:
        return 85
    elif en_len >= 5 or zh_len >= 6:
        return 72
    elif en_len >= 3 or zh_len >= 4:
        return 55
    else:
        return 30  # 头部词从 20 提到 30


def score_ai_citation(z: str, e: str, layer: str) -> int:
    """AI 引用概率 20%"""
    s = (z + " " + e).lower()
    base = 45  # 基础分从 30 提到 45

    question = sum(1 for t in AI_HIGH_QUESTION if t.lower() in s)
    base += min(question * 12, 40)

    med = sum(1 for t in AI_MED_QUESTION if t.lower() in s)
    base += min(med * 4, 12)

    if any(t in s for t in ["vs", "对比", "区别", "评测", "review", "comparison"]):
        base += 15

    if any(t in s for t in ["什么是", "是什么", "如何选", "怎么选", "哪个好", "what is", "how to choose"]):
        base += 12

    if any(t in s for t in ["价格", "批发", "price", "wholesale", "factory"]) and not any(t in s for t in ["vs", "对比", "评测"]):
        base -= 8

    return max(10, min(100, base))


def total_score(kw: dict) -> dict:
    z = kw.get("zh", "")
    e = kw.get("en", "")
    layer = kw.get("layer", "")

    sd = score_search_demand(z, e, layer)
    co = score_commercial(z, e, layer)
    cd = score_competition(z, e, layer)
    ai = score_ai_citation(z, e, layer)

    total = round(sd * 0.30 + co * 0.30 + cd * 0.20 + ai * 0.20, 1)

    if total >= 85:
        grade = "S"  # 头词手工编辑
    elif total >= 70:
        grade = "A"  # 中长尾标准 SEO
    elif total >= 55:
        grade = "B"  # 长尾程序化（需差异化 + Schema）
    else:
        grade = "C"  # 跳过不创建

    return {
        **kw,
        "score": total,
        "grade": grade,
        "scores_breakdown": {
            "search_demand": sd,
            "commercial": co,
            "competition": cd,
            "ai_citation": ai,
        },
    }


def main():
    print("=" * 70)
    print("KOS 关键词评分器 — 客信新材料 box.beeaa.com")
    print("=" * 70)

    kw_path = DATA / "keywords.json"
    if not kw_path.exists():
        print("FAIL: " + str(kw_path) + " not found")
        return

    raw = json.loads(kw_path.read_text(encoding="utf-8"))
    product_lines = raw.get("product_lines", {})
    print("LOAD: " + str(sum(len(pl.get("keywords", [])) for pl in product_lines.values())) + " keywords from " + str(len(product_lines)) + " product lines")

    # 打散到全局列表
    all_keywords = []
    for pl_slug, pl in product_lines.items():
        for kw in pl.get("keywords", []):
            kw2 = dict(kw)
            kw2["_product_line"] = pl_slug
            all_keywords.append(kw2)

    print("TOTAL: " + str(len(all_keywords)) + " keywords to score")

    # 评分
    scored = [total_score(kw) for kw in all_keywords]
    scored.sort(key=lambda x: -x["score"])

    # === S 头词种子：按产品线均匀抽 top 200 ===
    # doc1.txt：Tier 1 头部词 200~500 个，人工深度编辑
    pl_top = defaultdict(list)
    for s in scored:
        pl_top[s.get("_product_line", "?")].append(s)
    s_seeds = []
    for pl_slug, items in pl_top.items():
        # 每产品线取 top 25-30 头词
        for s in items[:30]:
            s_copy = dict(s)
            s_copy["grade"] = "S"
            s_copy["_seed_reason"] = "top-by-product-line"
            s_seeds.append(s_copy)
    s_seeds.sort(key=lambda x: -x["score"])
    s_seeds = s_seeds[:300]  # 总共 300 个 S 头词

    # 从 scored 中移除 S 头词（避免重复）
    s_nos = {s["no"] for s in s_seeds}
    remaining = [s for s in scored if s["no"] not in s_nos]

    # 重新统计
    grade_count = defaultdict(int)
    layer_grade = defaultdict(lambda: defaultdict(int))
    pl_grade = defaultdict(lambda: defaultdict(int))
    all_graded = s_seeds + remaining
    for s in all_graded:
        grade_count[s["grade"]] += 1
        layer_grade[s.get("layer", "?")][s["grade"]] += 1
        pl_grade[s.get("_product_line", "?")][s["grade"]] += 1

    print("")
    print("GRADE DISTRIBUTION (S=300 head terms seeded):")
    total = len(all_graded)
    for g in ["S", "A", "B", "C"]:
        pct = grade_count[g] / total * 100
        print("  " + g + ": " + str(grade_count[g]) + " (" + f"{pct:.1f}" + "%)")

    print("")
    print("BY LAYER:")
    for layer in sorted(layer_grade.keys()):
        line = "  " + layer.ljust(10) + " | "
        for g in ["S", "A", "B", "C"]:
            line += g + "=" + str(layer_grade[layer][g]).rjust(5) + " | "
        print(line)

    print("")
    print("BY PRODUCT LINE:")
    for pl in sorted(pl_grade.keys()):
        line = "  " + pl.ljust(25) + " | "
        for g in ["S", "A", "B", "C"]:
            line += g + "=" + str(pl_grade[pl][g]).rjust(5) + " | "
        print(line)

    print("")
    print("SAMPLE (S-grade top 10):")
    for s in s_seeds[:10]:
        print("  [" + str(s["score"]) + "] " + s["zh"] + " | " + s["en"] + " | " + s.get("layer", ""))

    # 保存全量 scored
    out_path = DATA / "keywords_scored.json"
    out_path.write_text(json.dumps(all_graded, ensure_ascii=False, indent=2), encoding="utf-8")
    print("")
    print("SAVED: " + str(out_path))

    # 按 grade 分桶保存（用于生成器分流）
    buckets = defaultdict(list)
    for s in all_graded:
        buckets[s["grade"]].append(s)

    for g in ["S", "A", "B", "C"]:
        path = DATA / ("keywords_" + g + ".json")
        path.write_text(json.dumps(buckets[g], ensure_ascii=False, indent=2), encoding="utf-8")
        print("SAVED: " + str(path) + " (" + str(len(buckets[g])) + ")")

    # 统计
    stats = {
        "total": len(all_graded),
        "grade_count": dict(grade_count),
        "layer_grade": {k: dict(v) for k, v in layer_grade.items()},
        "pl_grade": {k: dict(v) for k, v in pl_grade.items()},
        "threshold": {"S": 85, "A": 70, "B": 55, "C": 0},
        "rules": {
            "S_action": "Tier 1 head terms - human-edited /guides/ page, 2000+ words, full E-E-A-T, Article Schema with author/date/citation",
            "A_action": "Tier 2 mid-tail - template+human review, /[product-line]/[keyword]/, 800-1500 words, FAQPage + BreadcrumbList + Product",
            "B_action": "Tier 3 long-tail - programmatic, /[product-line]/[keyword]-[no]/, 400-800 words, noindex in HTML head (only in sitemap for discovery)",
            "C_action": "BLOCKED - skip generation entirely, saves ~70% of file count",
        },
    }
    report_dir = ROOT / "reports"
    report_dir.mkdir(exist_ok=True)
    (report_dir / "kos_stats.json").write_text(json.dumps(stats, ensure_ascii=False, indent=2), encoding="utf-8")
    print("SAVED: " + str(report_dir / "kos_stats.json"))

    print("")
    print("DONE.")


if __name__ == "__main__":
    main()
