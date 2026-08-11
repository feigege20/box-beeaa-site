#!/usr/bin/env python3
r"""
图片优化脚本：把所有图片转 WebP + 多尺寸
- hero: 1600w (质量 75)
- product: 800w (质量 80)
- thumb: 400w (质量 80)
"""
import os
import sys
from pathlib import Path
from PIL import Image

# 源目录
REAL_DIR = Path(r"C:\Users\Administrator\.mavis\workspace\box-beeaa-site\public\images\real")
AI_DIR = Path(r"C:\Users\Administrator\.mavis\workspace\box-beeaa-site\public\images")

# 三个尺寸
SIZES = [
    ("1600w", 1600, 75),   # hero/banner: 1600px wide, quality 75
    ("800w", 800, 80),     # product: 800px wide, quality 80
    ("400w", 400, 80),     # thumb: 400px wide, quality 80
]

# 支持格式
EXTS = {".jpg", ".jpeg", ".png"}

def optimize_image(src_path: Path, sizes):
    """把一张图转成多个 WebP 尺寸"""
    results = []
    try:
        img = Image.open(src_path)
        # 处理 EXIF 方向
        try:
            from PIL import ImageOps
            img = ImageOps.exif_transpose(img)
        except Exception:
            pass
        # 转为 RGB（如果是 RGBA/P 模式）
        if img.mode in ("RGBA", "LA", "P"):
            # 保留 PNG 透明用 PNG 输出
            pass
        # 计算原图大小
        orig_size = src_path.stat().st_size
        for suffix, max_width, quality in sizes:
            # 等比缩放
            w, h = img.size
            if w > max_width:
                new_h = int(h * max_width / w)
                img_resized = img.resize((max_width, new_h), Image.LANCZOS)
            else:
                img_resized = img
            # 输出 WebP
            out_path = src_path.with_name(f"{src_path.stem}-{suffix}.webp")
            # 统一 RGB
            if img_resized.mode != "RGB":
                img_resized = img_resized.convert("RGB")
            img_resized.save(out_path, "WEBP", quality=quality, method=6, optimize=True)
            new_size = out_path.stat().st_size
            results.append((out_path.name, new_size, orig_size))
        return results
    except Exception as e:
        return [("ERROR: " + str(e), 0, 0)]

def main():
    # 处理 real/ 下所有图
    targets = []
    for d in [REAL_DIR, AI_DIR]:
        if not d.exists():
            continue
        for p in d.rglob("*"):
            if p.is_file() and p.suffix.lower() in EXTS:
                targets.append(p)
    print(f"[OPT] Found {len(targets)} images to optimize")

    total_orig = 0
    total_new = 0
    count = 0
    for src in targets:
        if src.name.endswith(".webp"):
            continue
        results = optimize_image(src, SIZES)
        for r in results:
            if "ERROR" in r[0]:
                print(f"  X {src.relative_to(src.parents[1])}: {r[0]}")
            else:
                total_orig += r[2]
                total_new += r[1]
                count += 1
                if count % 10 == 0:
                    print(f"  OK {count} done | {(total_orig - total_new) / 1024 / 1024:.1f} MB saved")
    print(f"\n[OPT] Total: {count} WebP files generated")
    print(f"[OPT] Original: {total_orig / 1024 / 1024:.1f} MB")
    print(f"[OPT] Optimized: {total_new / 1024 / 1024:.1f} MB")
    print(f"[OPT] Saved: {(total_orig - total_new) / 1024 / 1024:.1f} MB ({(1 - total_new / total_orig) * 100:.1f}%)")

if __name__ == "__main__":
    main()
