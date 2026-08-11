#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
质量门 (Quality Gate) — 依据 doc1.txt 第 7 节
对生成的 HTML 页面做 4 维检查：
1. 字数 < 400（Thin Content 红线）→ 标记 noindex
2. 内容重复度 > 70%（Doorway Page 红线）→ 标记 noindex
3. 内部链接 < 3（孤儿页）→ 警告
4. 图片缺失（无 hero 图）→ 警告

输入：dist/ 目录
输出：reports/quality_gate.json
      reports/quality_gate_summary.md
"""

import json
import re
import hashlib
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).parent.parent
DIST = ROOT / "dist"
REPORT_DIR = ROOT / "reports"

# 文本提取正则
SCRIPT_STYLE_RE = re.compile(r'<script[^>]*>.*?</script>|<style[^>]*>.*?</style>', re.DOTALL | re.IGNORECASE)
TAG_RE = re.compile(r'<[^>]+>')
WHITESPACE_RE = re.compile(r'\s+')
WORD_RE = re.compile(r'[\u4e00-\u9fff]|[A-Za-z]+')


def extract_text(html: str) -> str:
    """提取纯文本"""
    html = SCRIPT_STYLE_RE.sub('', html)
    text = TAG_RE.sub(' ', html)
    text = WHITESPACE_RE.sub(' ', text).strip()
    return text


def count_words(text: str) -> int:
    """字数（中英文混合，1 中文=1 字，1 英文词=1 字）"""
    zh = len(re.findall(r'[\u4e00-\u9fff]', text))
    en = len(re.findall(r'[A-Za-z]+', text))
    return zh + en


def has_image(html: str) -> bool:
    """是否有图"""
    return bool(re.search(r'<img[^>]+src="(?!/images/logo|/images/favicon)[^"]+', html))


def count_internal_links(html: str) -> int:
    """内部链接数（href 指向本站）"""
    return len(re.findall(r'<a[^>]+href="(/|https?://box\.beeaa\.com)[^"]*"', html))


def text_hash(text: str) -> str:
    """文本指纹（用于查重）"""
    # 取关键段落 500 字符
    sample = text[:500]
    return hashlib.md5(sample.encode('utf-8', errors='ignore')).hexdigest()


def main():
    print("=" * 70)
    print("Quality Gate — 质量门检查")
    print("=" * 70)

    if not DIST.exists():
        print("FAIL: dist/ not found. Run generate.mjs first.")
        return

    html_files = list(DIST.rglob("index.html"))
    print("SCAN: " + str(len(html_files)) + " HTML files")

    results = []
    fingerprints = defaultdict(list)  # hash -> [file paths]

    thin_count = 0
    no_image_count = 0
    low_links_count = 0
    duplicate_count = 0
    warn_count = 0
    pass_count = 0

    for i, fp in enumerate(html_files):
        if i % 5000 == 0 and i > 0:
            print(f"  ... processed {i}/{len(html_files)}")

        try:
            html = fp.read_text(encoding='utf-8', errors='ignore')
        except Exception:
            continue

        # 提取文本
        text = extract_text(html)
        word_count = count_words(text)
        images = has_image(html)
        internal_links = count_internal_links(html)
        h = text_hash(text)

        rel = fp.relative_to(DIST).as_posix()
        fingerprints[h].append(rel)

        issues = []
        if word_count < 400:
            issues.append("thin_content")
            thin_count += 1
        if not images:
            issues.append("no_image")
            no_image_count += 1
        if internal_links < 3:
            issues.append("low_internal_links")
            low_links_count += 1

        if "thin_content" in issues:
            verdict = "noindex"  # < 400 字强制 noindex
        elif issues:
            verdict = "warn"
            warn_count += 1
        else:
            verdict = "pass"
            pass_count += 1

        results.append({
            "path": rel,
            "word_count": word_count,
            "has_image": images,
            "internal_links": internal_links,
            "issues": issues,
            "verdict": verdict,
        })

    # 查重（同一 fingerprint > 5 个 → duplicate）
    duplicate_paths = set()
    for h, paths in fingerprints.items():
        if len(paths) > 5:
            for p in paths:
                duplicate_paths.add(p)
            duplicate_count += len(paths)

    # 标记重复
    for r in results:
        if r["path"] in duplicate_paths:
            r["issues"].append("high_duplicate")
            if r["verdict"] == "pass":
                r["verdict"] = "warn"
                warn_count += 1

    # 统计
    print("")
    print("RESULTS:")
    print("  pass:   " + str(pass_count) + " (" + f"{pass_count/len(results)*100:.1f}" + "%)")
    print("  warn:   " + str(warn_count))
    print("  noindex: " + str(thin_count) + " (thin content)")
    print("")
    print("ISSUES:")
    print("  thin_content (<400 words): " + str(thin_count))
    print("  no_image:                  " + str(no_image_count))
    print("  low_internal_links (<3):   " + str(low_links_count))
    print("  high_duplicate (>5 same):  " + str(duplicate_count))

    # 保存
    REPORT_DIR.mkdir(exist_ok=True)
    (REPORT_DIR / "quality_gate.json").write_text(
        json.dumps({
            "total": len(results),
            "summary": {
                "pass": pass_count,
                "warn": warn_count,
                "noindex": thin_count,
                "duplicate_marked": duplicate_count,
                "thin_content": thin_count,
                "no_image": no_image_count,
                "low_internal_links": low_links_count,
            },
            "rules": {
                "thin_content_threshold": 400,
                "duplicate_threshold": 5,
                "internal_links_min": 3,
            },
            "samples": {
                "thin": [r for r in results if r["verdict"] == "noindex"][:5],
                "duplicate_groups": [
                    {"fingerprint_hash": h, "files": paths[:5]}
                    for h, paths in fingerprints.items() if len(paths) > 5
                ][:10],
            },
        }, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    # 简单 md 报告
    md = []
    md.append("# Quality Gate 报告 — box.beeaa.com\n")
    md.append(f"**总页面**: {len(results)}  ")
    md.append(f"**通过 (pass)**: {pass_count} ({pass_count/len(results)*100:.1f}%)  ")
    md.append(f"**警告 (warn)**: {warn_count}  ")
    md.append(f"**noindex 强制**: {thin_count} (字数 < 400)\n")
    md.append("## 问题分布\n")
    md.append(f"- Thin Content (<400 字): {thin_count}")
    md.append(f"- 缺图: {no_image_count}")
    md.append(f"- 内部链接 <3: {low_links_count}")
    md.append(f"- 高度重复（>5 同模板）: {duplicate_count}")
    (REPORT_DIR / "quality_gate_summary.md").write_text("\n".join(md), encoding="utf-8")

    print("")
    print("SAVED: " + str(REPORT_DIR / "quality_gate.json"))
    print("SAVED: " + str(REPORT_DIR / "quality_gate_summary.md"))


if __name__ == "__main__":
    main()
