#!/usr/bin/env python3
"""Phase 17-C: Mirror 22 files from dist/ to dist-pages/ + git add."""
import shutil
from pathlib import Path

BASE = Path(r"C:\Users\Administrator\.minimax\workspace\box-beeaa-site")
DIST = BASE / "dist"
DIST_PAGES = BASE / "dist-pages"

INTENTS = ["wholesale", "agency", "oem", "export", "faq"]
MARKETS = ["north-america", "europe", "southeast-asia", "middle-east", "russia", "japan-korea"]

count = 0
for lang_prefix, target_prefix in [("zh", "zh"), ("", "")]:
    # Intents
    for slug in INTENTS:
        src = DIST / lang_prefix / slug / "index.html" if lang_prefix else DIST / slug / "index.html"
        dst = DIST_PAGES / target_prefix / slug / "index.html"
        if src.exists():
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst)
            count += 1
            print(f"  [OK] {src.relative_to(BASE)} → {dst.relative_to(BASE)}  ({dst.stat().st_size} bytes)")
    # Markets
    for slug in MARKETS:
        src = DIST / lang_prefix / "markets" / slug / "index.html" if lang_prefix else DIST / "markets" / slug / "index.html"
        dst = DIST_PAGES / target_prefix / "markets" / slug / "index.html"
        if src.exists():
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst)
            count += 1
            print(f"  [OK] {src.relative_to(BASE)} → {dst.relative_to(BASE)}  ({dst.stat().st_size} bytes)")

print(f"\n=== Total: {count} files mirrored ===")
