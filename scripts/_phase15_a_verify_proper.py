#!/usr/bin/env python3
"""Verify Phase 15 A v4 — sample 30 URLs using the proper format (pl/pl/slug)."""
import json
import random
import urllib.request
import urllib.error
from pathlib import Path

mapping_file = Path(r"F:\MiniMaxFile\beeaa_File\_phase15_a_mapping_v4.json")
with mapping_file.open(encoding="utf-8") as f:
    mapping = json.load(f)

# Use new_key as-is (with pl/pl/slug pattern)
random.seed(42)
items = list(mapping.items())
sample = random.sample(items, 30)

real_correct = 0
home_fallback = 0
err404 = 0
print(f"Sampling 30 URLs with format: box.beeaa.com/<pl>/<pl>/<slug>/")
print()
for old_key, new_key in sample:
    parts = new_key.split("/")
    pl = parts[0]
    pl2 = parts[1]  # should be same as pl
    slug = parts[2]
    url = f"https://box.beeaa.com/{pl}/{pl2}/{slug}/"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mavis-Verify/1.0"})
        with urllib.request.urlopen(req, timeout=20) as r:
            body = r.read().decode("utf-8", errors="ignore")
            h1_m = body[:8000]
            if "防护箱源头工厂" in h1_m or "Protective Case Factory" in h1_m:
                home_fallback += 1
                print(f"  HOME  {r.status}  {url}")
            else:
                real_correct += 1
                print(f"  REAL  {r.status}  {url}")
    except urllib.error.HTTPError as e:
        err404 += 1
        print(f"  {e.code}  {url}")
    except Exception as e:
        err404 += 1
        print(f"  ERR  {url}")

print(f"\n=== Summary ===")
print(f"Total sampled:   30")
print(f"REAL (correct):  {real_correct}/30 = {100*real_correct/30:.1f}%")
print(f"HOME (fallback):  {home_fallback}")
print(f"404/ERR:          {err404}")
