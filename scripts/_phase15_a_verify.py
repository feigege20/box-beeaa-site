#!/usr/bin/env python3
"""Verify Phase 15 A v4 — sample 20 random URLs from mapping."""
import json
import random
import urllib.request
import urllib.error
from pathlib import Path

mapping_file = Path(r"C:\Users\Administrator\.minimax\workspace\box-beeaa-site\_phase15_a_mapping_v4.json")
if not mapping_file.exists():
    mapping_file = Path(r"F:\MiniMaxFile\beeaa_File\_phase15_a_mapping_v4.json")

with mapping_file.open(encoding="utf-8") as f:
    mapping = json.load(f)

print(f"Total mappings: {len(mapping)}")

# Sample 20 random entries
keys = list(mapping.items())
random.seed(42)
sample = random.sample(keys, 20)

ok = 0
not_found = 0
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
                not_found += 1
                print(f"  HOME  {r.status}  {url}")
            else:
                ok += 1
                print(f"  REAL  {r.status}  {url}")
    except urllib.error.HTTPError as e:
        not_found += 1
        print(f"  {e.code}  {url}")
    except Exception as e:
        not_found += 1
        print(f"  ERR  {url}  {str(e)[:80]}")

print(f"\n=== Summary ===")
print(f"REAL (correct): {ok}/{len(sample)}")
print(f"HOME/404/ERR:   {not_found}/{len(sample)}")
