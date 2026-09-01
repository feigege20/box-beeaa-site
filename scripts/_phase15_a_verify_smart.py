#!/usr/bin/env python3
"""Verify Phase 15 A v4 — sample 30 real production URLs (filter out /zh/, /<pl>/ leftovers)."""
import json
import random
import re
import urllib.request
import urllib.error
from pathlib import Path

mapping_file = Path(r"F:\MiniMaxFile\beeaa_File\_phase15_a_mapping_v4.json")
with mapping_file.open(encoding="utf-8") as f:
    mapping = json.load(f)

print(f"Total mappings: {len(mapping)}")

# Filter to URLs that v2/v4 actually renamed (new_key != old_key, no -NNNN suffix)
SUFFIX_RE = re.compile(r"-\d{4,6}$")
PL_SLUG_RE = re.compile(r"^[a-z0-9-]+$")
real_keys = []
for old_key, new_key in mapping.items():
    if "/zh/" in old_key or "/zh/" in new_key:
        continue
    parts = new_key.split("/")
    if len(parts) < 3:
        continue
    pl = parts[0]
    slug = parts[1]
    # Skip <pl>/<pl>/ pattern (junk leftover)
    if pl == slug:
        continue
    # Skip <pl>/index.html (top-level)
    if slug == "index.html" or not PL_SLUG_RE.match(slug):
        continue
    # Only include if RENAME happened (new != old, both -NNNN removed)
    if old_key == new_key:
        continue
    real_keys.append((old_key, new_key))

print(f"Real production mappings: {len(real_keys)}")

random.seed(42)
sample = random.sample(real_keys, 30)

ok = 0
not_found = 0
home_fallback = 0
real_correct = 0
samples_list = []
for old_key, new_key in sample:
    pl = new_key.split("/")[0]
    slug = new_key.split("/")[1]
    url = f"https://box.beeaa.com/{pl}/{slug}/"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mavis-Verify/1.0"})
        with urllib.request.urlopen(req, timeout=20) as r:
            body = r.read().decode("utf-8", errors="ignore")
            h1_m = body[:8000]
            if "防护箱源头工厂" in h1_m or "Protective Case Factory" in h1_m:
                home_fallback += 1
                samples_list.append(f"  HOME  {r.status}  {url}")
            else:
                real_correct += 1
                samples_list.append(f"  REAL  {r.status}  {url}")
            ok += 1
    except urllib.error.HTTPError as e:
        not_found += 1
        samples_list.append(f"  {e.code}  {url}")
    except Exception as e:
        not_found += 1
        samples_list.append(f"  ERR  {url}  {str(e)[:80]}")

for s in samples_list:
    print(s)

print(f"\n=== Summary ===")
print(f"Total sampled:  {len(sample)}")
print(f"REAL (correct B-tier sub-PL): {real_correct}/{len(sample)} = {100*real_correct/len(sample):.1f}%")
print(f"HOME (fallback):              {home_fallback}")
print(f"404/ERR:                      {not_found}")
