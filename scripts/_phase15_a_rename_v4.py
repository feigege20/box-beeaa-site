#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Phase 15 A v4: R2-side rename — serial 5 workers with adaptive backoff
- Skip already-done keys from v2 mapping (11,570)
- 5 concurrent workers (R2-friendly)
- 0.3-1.0s sleep between requests
- Retry up to 5 times per key with exponential backoff
"""
import boto3
import json
import re
import sys
import time
from botocore.config import Config
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
import random

ACCOUNT = "e549bec27f3455b1700899fee6b1b08b"
R2_ENDPOINT = f"https://{ACCOUNT}.r2.cloudflarestorage.com"
ACCESS_KEY = "c8f96a505f27d2c8311aacefa446e5e3"
SECRET_KEY = "4f57350d6cc9c017f77d0bc1e581aced60e45403f805c78db759bd21fc8682ad"

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
LOG_FILE = OUT_DIR / "_phase15_a_rename_v4.log"
SUMMARY_FILE = OUT_DIR / "_phase15_a_summary_v4.json"


def make_s3():
    return boto3.client(
        "s3",
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=ACCESS_KEY,
        aws_secret_access_key=SECRET_KEY,
        config=Config(
            retries={"max_attempts": 3, "mode": "standard"},
            max_pool_connections=20,
        ),
    )


def log_line(msg: str):
    line = f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {msg}"
    print(line, flush=True)
    with LOG_FILE.open("a", encoding="utf-8") as f:
        f.write(line + "\n")


def extract_production_slug(html_bytes: bytes) -> str | None:
    head = html_bytes[:4096].decode("utf-8", errors="ignore")
    m = CANONICAL_RE.search(head)
    if not m:
        return None
    return m.group(1).strip("/") or None


def process_one(s3, bucket: str, old_key: str, max_retries: int = 5) -> dict:
    """Process one R2 object with retry."""
    for attempt in range(max_retries):
        try:
            resp = s3.get_object(Bucket=bucket, Key=old_key, Range="bytes=0-4095")
            body = resp["Body"].read()
            break
        except Exception as e:
            if attempt < max_retries - 1:
                # Exponential backoff with jitter
                sleep_s = (2 ** attempt) * 0.5 + random.uniform(0, 0.5)
                time.sleep(sleep_s)
                continue
            return {"ok": False, "old_key": old_key, "stage": "get", "err": str(e)[:200], "attempts": attempt + 1}

    slug = extract_production_slug(body)
    if not slug:
        return {"ok": False, "old_key": old_key, "stage": "parse", "err": "no canonical"}

    pl = old_key.split("/")[0]
    new_key = f"{pl}/{slug}/index.html"

    if new_key == old_key:
        return {"ok": True, "old_key": old_key, "new_key": new_key, "noop": True}

    # COPY with retry
    for attempt in range(max_retries):
        try:
            s3.copy_object(
                Bucket=bucket,
                Key=new_key,
                CopySource={"Bucket": bucket, "Key": old_key},
                MetadataDirective="REPLACE",
                ContentType="text/html; charset=utf-8",
                CacheControl="public, max-age=300",
            )
            return {"ok": True, "old_key": old_key, "new_key": new_key, "noop": False}
        except Exception as e:
            if attempt < max_retries - 1:
                sleep_s = (2 ** attempt) * 0.5 + random.uniform(0, 0.5)
                time.sleep(sleep_s)
                continue
            return {
                "ok": False, "old_key": old_key, "new_key": new_key,
                "stage": "copy", "err": str(e)[:200], "attempts": attempt + 1,
            }


def main():
    if LOG_FILE.exists():
        LOG_FILE.unlink()
    log_line("=== Phase 15 A v4: R2-side rename (5 workers + backoff) ===")
    s3 = make_s3()

    # Load v2 mapping (11,567 done)
    v2_map_file = OUT_DIR / "_phase15_a_mapping_v2.json"
    v2_done = set()
    v2_data = {}
    if v2_map_file.exists():
        with v2_map_file.open(encoding="utf-8") as f:
            v2_data = json.load(f)
        v2_done = set(v2_data.keys())
        log_line(f"v2 already done: {len(v2_done)} keys (will skip)")

    # List all B-tier keys
    log_line("Listing B-tier keys...")
    t0 = time.time()
    all_keys = []
    for bucket in BUCKETS_WITH_BTIER:
        paginator = s3.get_paginator("list_objects_v2")
        for page in paginator.paginate(Bucket=bucket, PaginationConfig={"PageSize": 10000}):
            for obj in page.get("Contents", []):
                k = obj["Key"]
                pl = k.split("/", 1)[0] if "/" in k else k
                if pl in BTIER_PL_PATHS:
                    all_keys.append((bucket, k))
    list_elapsed = time.time() - t0
    log_line(f"Listed {len(all_keys)} B-tier keys in {list_elapsed:.1f}s")

    # Filter out already-done
    tasks = [(b, k) for b, k in all_keys if k not in v2_done]
    log_line(f"To process: {len(tasks)} (skipped {len(all_keys) - len(tasks)} already done)")

    # Process with 5 workers
    workers = 5
    log_line(f"Step 2-3: processing {len(tasks)} tasks with {workers} workers + backoff...")
    t1 = time.time()
    ok = err = noop = 0
    err_samples = []
    mapping = {}

    with ThreadPoolExecutor(max_workers=workers) as ex:
        futures = {ex.submit(process_one, s3, b, k): (b, k) for b, k in tasks}
        for i, fut in enumerate(as_completed(futures), 1):
            r = fut.result()
            if r.get("ok"):
                if r.get("noop"):
                    noop += 1
                else:
                    ok += 1
                    mapping[r["old_key"]] = r["new_key"]
            else:
                err += 1
                if len(err_samples) < 30:
                    err_samples.append(r)
            if i % 1000 == 0 or i == len(tasks):
                elapsed = time.time() - t1
                rate = i / elapsed
                eta = (len(tasks) - i) / rate if rate > 0 else 0
                log_line(
                    f"  [{i}/{len(tasks)}] ok={ok} noop={noop} err={err} "
                    f"rate={rate:.2f}/s ETA={eta:.0f}s"
                )

    elapsed_total = time.time() - t0
    log_line(f"=== Done in {elapsed_total:.1f}s ===")
    log_line(f"  ok   = {ok}")
    log_line(f"  noop = {noop}")
    log_line(f"  err  = {err}")
    if err_samples:
        log_line("Error samples (first 30):")
        for r in err_samples:
            log_line(f"  {r}")

    # Merge v2 + v4 mappings
    combined = dict(v2_data) if v2_data else {}
    combined.update(mapping)

    combined_file = OUT_DIR / "_phase15_a_mapping_v4.json"
    with combined_file.open("w", encoding="utf-8") as f:
        json.dump(combined, f, ensure_ascii=False, indent=2)
    log_line(f"Combined mapping (v2+v4): {combined_file} ({len(combined)} entries)")

    summary = {
        "ts": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "elapsed_s": round(elapsed_total, 1),
        "list_elapsed_s": round(list_elapsed, 1),
        "total_listed": len(all_keys),
        "skipped_v2": len(all_keys) - len(tasks),
        "to_process": len(tasks),
        "ok": ok,
        "noop": noop,
        "err": err,
        "err_samples": err_samples,
        "v4_added_mappings": len(mapping),
        "combined_total": len(combined),
    }
    with SUMMARY_FILE.open("w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    log_line(f"Summary: {SUMMARY_FILE}")


if __name__ == "__main__":
    main()
