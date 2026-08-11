#!/usr/bin/env python3
"""
OCR 完整提取 567 页 PDF 关键词，后台跑。
先下模型，再逐页 OCR → 解析 → 写入 data/keywords.json（增量更新）。
"""
import re
import json
import pymupdf
import easyocr
import numpy as np
from pathlib import Path
from collections import defaultdict, OrderedDict
from PIL import Image
import io
import sys
import time

PDF_PATH = Path(r"C:\Users\Administrator\.minimax\v2\assets\2026\07\29\13-55-22-067-asset_20260729-135522-067_896f063f17d7_c238dbdf-箱体行业关键词布局报告(全量版).pdf")
OUT_PATH = Path(r"C:\Users\Administrator\.mavis\workspace\box-beeaa-site\data\keywords.json")
PROGRESS_PATH = Path(r"C:\Users\Administrator\.mavis\workspace\box-beeaa-site\data\keywords-progress.json")

PRODUCT_LINES = OrderedDict([
    ("military-tactical-case", {"name_zh": "军工战术防护系列", "name_en": "Military & Tactical Case", "slug": "military-tactical-case"}),
    ("drone-case", {"name_zh": "无人机与机器人系列", "name_en": "Drone & Robotics Case", "slug": "drone-case"}),
    ("instrument-case", {"name_zh": "精密仪器仪表系列", "name_en": "Precision Instrument Case", "slug": "instrument-case"}),
    ("waterproof-case", {"name_zh": "防水户外安全系列", "name_en": "Waterproof Outdoor Case", "slug": "waterproof-case"}),
    ("medical-case", {"name_zh": "医疗急救冷链系列", "name_en": "Medical & Cold Chain Case", "slug": "medical-case"}),
    ("engineering-plastic-case", {"name_zh": "工程塑料工艺系列", "name_en": "Engineering Plastic Case", "slug": "engineering-plastic-case"}),
    ("tool-box", {"name_zh": "工具箱工业周转系列", "name_en": "Tool Box & Industrial Case", "slug": "tool-box"}),
    ("camera-stage-case", {"name_zh": "摄影数码舞台系列", "name_en": "Camera & Stage Case", "slug": "camera-stage-case"}),
    ("trolley-case", {"name_zh": "拉杆箱商务生活系列", "name_en": "Trolley & Business Case", "slug": "trolley-case"}),
])

LINE_HEADERS = {
    "军工战术防护系列": "military-tactical-case",
    "无人机与机器人系列": "drone-case",
    "精密仪器仪表系列": "instrument-case",
    "防水户外安全系列": "waterproof-case",
    "医疗急救冷链系列": "medical-case",
    "工程塑料工艺系列": "engineering-plastic-case",
    "工具箱工业周转系列": "tool-box",
    "摄影数码舞台系列": "camera-stage-case",
    "拉杆箱商务生活系列": "trolley-case",
}

# 数据行解析
ROW_RE = re.compile(
    r"^\s*(\d+)\s+(.+?)\s+([A-Za-z][A-Za-z0-9\s\-\&\/\.\,\(\)\#\']+?)\s+(原始|特性|规格|商业|长尾|市场|疑问|核心)\s*$"
)

def ocr_page(reader, pdf, page_idx, zoom=2.5):
    """OCR 单页 PDF → 文本行"""
    page = pdf[page_idx]
    mat = pymupdf.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat)
    img = Image.open(io.BytesIO(pix.tobytes("png")))
    arr = np.array(img)
    result = reader.readtext(arr, detail=0, paragraph=False)
    return result

def main():
    print(f"[OCR] Loading PDF: {PDF_PATH.name}", flush=True)
    pdf = pymupdf.open(PDF_PATH)
    print(f"[OCR] PDF pages: {len(pdf)}", flush=True)

    print(f"[OCR] Loading easyocr (ch_sim + en)...", flush=True)
    reader = easyocr.Reader(["ch_sim", "en"], gpu=False, verbose=False)
    print(f"[OCR] EasyOCR ready", flush=True)

    # 加载已有进度
    result = defaultdict(list)
    current_line = None
    seen_no = set()
    last_page = -1
    if PROGRESS_PATH.exists():
        with open(PROGRESS_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            result = defaultdict(list, data.get("data", {}))
            current_line = data.get("current_line")
            seen_no = set(data.get("seen_no", []))
            last_page = data.get("last_page", -1)
            print(f"[OCR] Resuming from page {last_page + 1}, current_line={current_line}, {len(seen_no)} seen", flush=True)

    start_time = time.time()

    for page_idx in range(last_page + 1, len(pdf)):
        try:
            lines = ocr_page(reader, pdf, page_idx)
        except Exception as e:
            print(f"[OCR] Page {page_idx+1} error: {e}", flush=True)
            continue

        for line in lines:
            line = line.strip()
            if not line:
                continue

            # 检测产品线标题
            matched_line = None
            for header, slug in LINE_HEADERS.items():
                if header in line and "系列" in line and len(line) < 50:
                    matched_line = slug
                    break
            if matched_line:
                current_line = matched_line
                continue

            # 解析数据行
            m = ROW_RE.match(line)
            if m and current_line:
                no = int(m.group(1))
                if no in seen_no:
                    continue
                seen_no.add(no)
                zh = m.group(2).strip()
                en = m.group(3).strip()
                layer = m.group(4).strip()
                result[current_line].append({
                    "no": no,
                    "zh": zh,
                    "en": en,
                    "layer": layer,
                })

        # 每 5 页报告进度
        if (page_idx + 1) % 5 == 0 or page_idx == len(pdf) - 1:
            elapsed = time.time() - start_time
            total = sum(len(v) for v in result.values())
            print(f"[OCR] Page {page_idx+1}/{len(pdf)} | {total} keywords | current_line={current_line} | {elapsed:.0f}s", flush=True)
            # 增量保存
            with open(PROGRESS_PATH, "w", encoding="utf-8") as f:
                json.dump({
                    "data": dict(result),
                    "current_line": current_line,
                    "seen_no": list(seen_no),
                    "last_page": page_idx,
                }, f, ensure_ascii=False)

    # 最终输出
    out = OrderedDict()
    out["_meta"] = {
        "version": "1.0",
        "source": "箱体行业关键词布局报告(全量版).pdf (OCR)",
        "extracted_at": "2026-07-29",
        "total": sum(len(v) for v in result.values()),
    }
    out["product_lines"] = {slug: dict(meta, keywords=result[slug]) for slug, meta in PRODUCT_LINES.items()}
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(f"[OCR] DONE: {sum(len(v) for v in result.values())} keywords → {OUT_PATH}", flush=True)

if __name__ == "__main__":
    main()
