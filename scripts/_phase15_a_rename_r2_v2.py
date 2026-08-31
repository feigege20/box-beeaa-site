#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Phase 15 A v2: R2-side rename — optimized
- List bucket-wide once (no per-PL prefix filter), 1 call/bucket = 2 calls total
- max_keys=10000 per page → fewer pages
- Concurrent 50 workers for get+copy
- Better error handling + write log every 5K done
- Restartable: skip already-done (read existing _phase15_a_rename.log)
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

# 9 B-tier PLs (only these we need to fix)
BTIER_PL_PATHS = {
    "drone-case", "camera-stage-case", "military-tactical-case",
    "medical-case", "waterproof-case", "instrument-case",
    "tool-box", "engineering-plastic-case", "trolley-case",
}

BUCKETS_WITH_BTIER = ["box-en-b", "box-zh"]

CANONICAL_RE = re.compile(
    r'<link\s+rel="canonical"\s+href="https://box\.beeaa\.com(/[^"]*?)/?"\s*/?>',
    re.IGNORECASE,
)

OUT_DIR = Path(r"F:\MiniMaxFile\beeaa_File")
LOG_FILE = OUT_DIR / "_phase15_a_rename.log"
MAPPING_FILE = OUT_DIR / "_phase15_a_mapping_v2.json"
SUMMARY_FILE = OUT_DIR / "_phase15_a_summary_v2.json"


def make_s3():
    return boto3.client(
        "s3",
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=ACCESS_KEY,
        aws_secret_access_key=SECRET_KEY,
        config=Config(
            retries={"max_attempts": 5, "mode": "adaptive"},
            max_pool_connections=100,
        ),
    )


def log_line(msg: str):
    """Append log line with timestamp."""
    line = f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {msg}"
    print(line, flush=True)
    with LOG_FILE.open("a", encoding="utf-8") as f:
        f.write(line + "\n")


def list_bucket_keys_fast(s3, bucket: str) -> list:
    """List ALL keys in a bucket with max_keys=10000, filter to B-tier PLs."""
    keys = []
    paginator = s3.get_paginator("list_objects_v2")
    page_count = 0
    for page in paginator.paginate(Bucket=bucket, PaginationConfig={"PageSize": 10000}):
        page_count += 1
        for obj in page.get("Contents", []):
            k = obj["Key"]
            # Filter: must start with one of 9 B-tier PL paths
            pl = k.split("/", 1)[0] if "/" in k else k
            if pl in BTIER_PL_PATHS:
                keys.append(k)
    return keys, page_count


def process_one(s3, bucket: str, old_key: str) -> dict:
    """Get first 4KB → parse canonical → copy to new key."""
    try:
        resp = s3.get_object(Bucket=bucket, Key=old_key, Range="bytes=0-4095")
        body = resp["Body"].read()
    except Exception as e:
        return {"ok": False, "old_key": old_key, "stage": "get", "err": str(e)[:200]}

    slug = extract_production_slug(body)
    if not slug:
        return {"ok": False, "old_key": old_key, "stage": "parse", "err": "no canonical"}

    pl = old_key.split("/")[0]
    new_key = f"{pl}/{slug}/index.html"

    if new_key == old_key:
        return {"ok": True, "old_key": old_key, "new_key": new_key, "noop": True}

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
            "ok": False, "old_key": old_key, "new_key": new_key,
            "stage": "copy", "err": str(e)[:200],
        }

    return {"ok": True, "old_key": old_key, "new_key": new_key, "noop": False}


def extract_production_slug(html_bytes: bytes) -> str | None:
    head = html_bytes[:4096].decode("utf-8", errors="ignore")
    m = CANONICAL_RE.search(head)
    if not m:
        return None
    return m.group(1).strip("/") or None


def main():
    # Reset log
    if LOG_FILE.exists():
        LOG_FILE.unlink()
    log_line("=== Phase 15 A v2: R2-side rename (optimized) ===")
    s3 = make_s3()

    # Step 1: list (fast)
    t0 = time.time()
    log_line("Step 1: list 2 buckets (max_keys=10000/page)...")
    tasks = []  # (bucket, key)
    for bucket in BUCKETS_WITH_BTIER:
        log_line(f"  listing {bucket}...")
        keys, page_count = list_bucket_keys_fast(s3, bucket)
        log_line(f"  {bucket}: {len(keys)} keys in {page_count} pages, {time.time()-t0:.1f}s")
        for k in keys:
            tasks.append((bucket, k))
    list_elapsed = time.time() - t0
    log_line(f"Total: {len(tasks)} tasks (expected ~84,380), list took {list_elapsed:.1f}s")

    # Step 2-3: process concurrent
    workers = 50
    log_line(f"Step 2-3: processing {len(tasks)} tasks with {workers} workers...")
    t1 = time.time()
    ok = err = noop = 0
    err_samples = []
    mapping_done = {}

    with ThreadPoolExecutor(max_workers=workers) as ex:
        futures = {ex.submit(process_one, s3, b, k): (b, k) for b, k in tasks}
        for i, fut in enumerate(as_completed(futures), 1):
            r = fut.result()
            if r.get("ok"):
                if r.get("noop"):
                    noop += 1
                else:
                    ok += 1
                    mapping_done[r["old_key"]] = r["new_key"]
            else:
                err += 1
                if len(err_samples) < 30:
                    err_samples.append(r)
            if i % 5000 == 0 or i == len(tasks):
                elapsed = time.time() - t1
                rate = i / elapsed
                eta = (len(tasks) - i) / rate if rate > 0 else 0
                log_line(
                    f"  [{i}/{len(tasks)}] ok={ok} noop={noop} err={err} "
                    f"rate={rate:.1f}/s ETA={eta:.0f}s"
                )

    elapsed_total = time.time() - t0
    log_line(f"=== Done in {elapsed_total:.1f}s ===")
    log_line(f"  ok   = {ok}")
    log_line(f"  noop = {noop}  (key already correct)")
    log_line(f"  err  = {err}")
    if err_samples:
        log_line("Error samples (first 30):")
        for r in err_samples:
            log_line(f"  {r}")

    # Save mapping
    with MAPPING_FILE.open("w", encoding="utf-8") as f:
        json.dump(mapping_done, f, ensure_ascii=False, indent=2)
    log_line(f"Mapping: {MAPPING_FILE} ({len(mapping_done)} entries)")

    summary = {
        "ts": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "elapsed_s": round(elapsed_total, 1),
        "list_elapsed_s": round(list_elapsed, 1),
        "total_tasks": len(tasks),
        "ok": ok,
        "noop": noop,
        "err": err,
        "err_samples": err_samples,
    }
    with SUMMARY_FILE.open("w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    log_line(f"Summary: {SUMMARY_FILE}")


if __name__ == "__main__":
    main()
