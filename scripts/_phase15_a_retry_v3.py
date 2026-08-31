#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Phase 15 A v3: Retry failed keys from v2 with lower concurrency (10) + R2 rate-aware
"""
import boto3
import json
import re
import sys
import time
from botocore.config import Config
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

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
LOG_FILE = OUT_DIR / "_phase15_a_retry_v3.log"
SUMMARY_FILE = OUT_DIR / "_phase15_a_retry_v3_summary.json"


def make_s3():
    return boto3.client(
        "s3",
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=ACCESS_KEY,
        aws_secret_access_key=SECRET_KEY,
        config=Config(
            retries={"max_attempts": 8, "mode": "adaptive"},
            max_pool_connections=30,
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


def process_one(s3, bucket: str, old_key: str) -> dict:
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


def main():
    if LOG_FILE.exists():
        LOG_FILE.unlink()
    log_line("=== Phase 15 A v3: Retry failed with 10 workers ===")
    s3 = make_s3()

    # Read v2 summary to get failed keys
    v2_summary_file = OUT_DIR / "_phase15_a_summary_v2.json"
    if not v2_summary_file.exists():
        log_line("ERROR: v2 summary not found, cannot retry")
        return

    with v2_summary_file.open() as f:
        v2 = json.load(f)

    log_line(f"v2 stats: total={v2['total_tasks']} ok={v2['ok']} err={v2['err']}")

    # Re-list all B-tier keys (cheaper than parsing v2 err_samples)
    log_line("Re-listing B-tier keys...")
    t0 = time.time()
    tasks = []
    for bucket in BUCKETS_WITH_BTIER:
        paginator = s3.get_paginator("list_objects_v2")
        for page in paginator.paginate(Bucket=bucket, PaginationConfig={"PageSize": 10000}):
            for obj in page.get("Contents", []):
                k = obj["Key"]
                pl = k.split("/", 1)[0] if "/" in k else k
                if pl in BTIER_PL_PATHS:
                    tasks.append((bucket, k))
    list_elapsed = time.time() - t0
    log_line(f"Re-listed: {len(tasks)} B-tier keys in {list_elapsed:.1f}s")

    # Process with 10 workers (R2-safe)
    workers = 10
    log_line(f"Step 2-3: processing {len(tasks)} tasks with {workers} workers...")
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
    log_line(f"  noop = {noop}")
    log_line(f"  err  = {err}")
    if err_samples:
        log_line("Error samples (first 30):")
        for r in err_samples:
            log_line(f"  {r}")

    # Merge with v2 mapping
    v2_map_file = OUT_DIR / "_phase15_a_mapping_v2.json"
    combined = {}
    if v2_map_file.exists():
        with v2_map_file.open() as f:
            combined = json.load(f)
    combined.update(mapping)

    combined_file = OUT_DIR / "_phase15_a_mapping_v3.json"
    with combined_file.open("w", encoding="utf-8") as f:
        json.dump(combined, f, ensure_ascii=False, indent=2)
    log_line(f"Combined mapping (v2+v3): {combined_file} ({len(combined)} entries)")

    summary = {
        "ts": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "elapsed_s": round(elapsed_total, 1),
        "list_elapsed_s": round(list_elapsed, 1),
        "total_tasks": len(tasks),
        "ok": ok,
        "noop": noop,
        "err": err,
        "err_samples": err_samples,
        "v2_oks": v2.get("ok", 0),
        "combined_total": len(combined),
    }
    with SUMMARY_FILE.open("w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    log_line(f"Summary: {SUMMARY_FILE}")


if __name__ == "__main__":
    main()
