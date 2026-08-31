#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Phase 15 A: R2-side rename — copy 84,380 B-tier sub-PL objects
from old keys (with -<num> suffix like drone-case/100l-drone-case-32012/index.html)
to new keys (production slugs like drone-case/dji-mavic-3-classic-case/index.html).

Strategy:
- Step 1: list all R2 objects in box-en-b + box-zh (only 9 B-tier PL paths)
- Step 2: for each, get first 4KB → extract <link rel="canonical" href="...">
- Step 3: COPY object to new key (1 R2 API call, not 2)
- Step 4: verify with sample URLs

Concurrent: ThreadPoolExecutor(20) → ~5-10 min total
"""
import boto3
import json
import re
import sys
import time
from botocore.config import Config
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

# ===== R2 config =====
ACCOUNT = "e549bec27f3455b1700899fee6b1b08b"
R2_ENDPOINT = f"https://{ACCOUNT}.r2.cloudflarestorage.com"
ACCESS_KEY = "c8f96a505f27d2c8311aacefa446e5e3"
SECRET_KEY = "4f57350d6cc9c017f77d0bc1e581aced60e45403f805c78db759bd21fc8682ad"

# 9 B-tier PL paths
BTIER_PL_PATHS = [
    "drone-case",
    "camera-stage-case",
    "military-tactical-case",
    "medical-case",
    "waterproof-case",
    "instrument-case",
    "tool-box",
    "engineering-plastic-case",
    "trolley-case",
]

# 2 lang buckets that have B-tier PLs
BUCKETS_WITH_BTIER = ["box-en-b", "box-zh"]

# Canonical regex
CANONICAL_RE = re.compile(
    r'<link\s+rel="canonical"\s+href="https://box\.beeaa\.com(/[^"]*?)/?"\s*/?>',
    re.IGNORECASE,
)

# Output
OUT_DIR = Path(r"F:\MiniMaxFile\beeaa_File")
OUT_DIR.mkdir(parents=True, exist_ok=True)

# S3 client factory
def make_s3():
    return boto3.client(
        "s3",
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=ACCESS_KEY,
        aws_secret_access_key=SECRET_KEY,
        config=Config(
            retries={"max_attempts": 5, "mode": "adaptive"},
            max_pool_connections=50,
        ),
    )


def list_bucket_objects(s3, bucket: str, prefix: str) -> list:
    """List all objects under prefix."""
    objs = []
    paginator = s3.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=bucket, Prefix=prefix + "/"):
        for obj in page.get("Contents", []):
            objs.append(obj["Key"])
    return objs


def extract_production_slug(html_bytes: bytes) -> str | None:
    """Extract production slug from canonical URL in HTML head."""
    # Read only first 4KB (canonical is in <head>)
    head = html_bytes[:4096].decode("utf-8", errors="ignore")
    m = CANONICAL_RE.search(head)
    if not m:
        return None
    slug = m.group(1).strip("/")
    if not slug:
        return None
    return slug


def process_one(s3, bucket: str, old_key: str) -> dict:
    """Process one R2 object: get → parse → copy."""
    # Get first 4KB only via Range
    try:
        resp = s3.get_object(Bucket=bucket, Key=old_key, Range="bytes=0-4095")
        body = resp["Body"].read()
    except Exception as e:
        return {"ok": False, "old_key": old_key, "stage": "get", "err": str(e)[:200]}

    slug = extract_production_slug(body)
    if not slug:
        return {
            "ok": False,
            "old_key": old_key,
            "stage": "parse",
            "err": "no canonical",
        }

    # Compute new key: <pl>/<slug>/index.html
    # old_key format: <pl>/<oldslug>/index.html
    pl = old_key.split("/")[0]
    new_key = f"{pl}/{slug}/index.html"

    if new_key == old_key:
        return {"ok": True, "old_key": old_key, "new_key": new_key, "noop": True}

    # COPY to new key
    try:
        s3.copy_object(
            Bucket=bucket,
            Key=new_key,
            CopySource={"Bucket": bucket, "Key": old_key},
            MetadataDirective="REPLACE",
            ContentType="text/html; charset=utf-8",
            CacheControl="public, max-age=300",
        )
    except Exception as e:
        return {
            "ok": False,
            "old_key": old_key,
            "new_key": new_key,
            "stage": "copy",
            "err": str(e)[:200],
        }

    return {"ok": True, "old_key": old_key, "new_key": new_key, "noop": False}


def main():
    s3 = make_s3()
    print("=== Phase 15 A: R2-side rename ===")
    print(f"Time: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    # ===== Step 1: list all 84,380 objects =====
    t0 = time.time()
    tasks = []  # (bucket, old_key) tuples
    for bucket in BUCKETS_WITH_BTIER:
        for pl in BTIER_PL_PATHS:
            keys = list_bucket_objects(s3, bucket, pl)
            for k in keys:
                tasks.append((bucket, k))
            print(f"  {bucket}/{pl}/  → {len(keys)} objects")
    print(f"\nTotal tasks: {len(tasks)} (expected ~84,380)")
    print(f"List elapsed: {time.time() - t0:.1f}s")
    print()

    # ===== Step 2-3: process concurrent =====
    workers = 20
    ok = err = noop = 0
    err_samples = []
    started = time.time()
    with ThreadPoolExecutor(max_workers=workers) as ex:
        futures = [
            ex.submit(process_one, s3, bucket, key) for bucket, key in tasks
        ]
        for i, fut in enumerate(as_completed(futures), 1):
            r = fut.result()
            if r.get("ok"):
                if r.get("noop"):
                    noop += 1
                else:
                    ok += 1
            else:
                err += 1
                if len(err_samples) < 20:
                    err_samples.append(r)
            if i % 5000 == 0 or i == len(tasks):
                rate = i / (time.time() - started)
                eta = (len(tasks) - i) / rate if rate > 0 else 0
                print(
                    f"  [{i}/{len(tasks)}]  ok={ok}  err={err}  noop={noop}  "
                    f"rate={rate:.1f}/s  ETA={eta:.0f}s"
                )

    elapsed = time.time() - started
    print()
    print(f"=== Done in {elapsed:.1f}s ===")
    print(f"  ok   = {ok}")
    print(f"  noop = {noop}  (key already correct)")
    print(f"  err  = {err}")
    if err_samples:
        print()
        print("Error samples (first 20):")
        for r in err_samples:
            print(f"  {r}")

    # Save mapping
    mapping_file = OUT_DIR / "_phase15_a_mapping.json"
    # (could re-derive from list if needed, skip for now)

    # Save summary
    summary = {
        "ts": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "elapsed_s": round(elapsed, 1),
        "total_tasks": len(tasks),
        "ok": ok,
        "noop": noop,
        "err": err,
        "err_samples": err_samples,
    }
    summary_file = OUT_DIR / "_phase15_a_summary.json"
    with summary_file.open("w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    print(f"\nSummary: {summary_file}")


if __name__ == "__main__":
    main()
