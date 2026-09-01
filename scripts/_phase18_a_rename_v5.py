#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Phase 18 v5: Phase 15 A slug 璺緞 bug 淇
- 璇?v2+v4 mapping (100,118 keys)
- 瀵规瘡涓?old_key 鈫?浠?R2 鎷?HTML 鈫?瑙ｆ瀽 canonical 鈫?淇 slug
- 淇閫昏緫:
  1. 鍘绘帀 /zh/ 鍓嶇紑 (濡傛灉瀛樺湪)
  2. 鍘绘帀 PL 鍓嶇紑 (濡傛灉 slug 浠?pl 寮€澶?鍗虫棫 v2/v4 鐨勯噸澶?PL bug)
- copy_object 鍒版纭?new_key
- 5 workers + 0.5-2s 鎸囨暟 backoff

棰勮 2-3h 瀹屾垚 100,118 rename
"""
import boto3
import json
import re
import sys
import time
import random
from botocore.config import Config
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ACCOUNT = "e549bec27f3455b1700899fee6b1b08b"
R2_ENDPOINT = f"https://{ACCOUNT}.r2.cloudflarestorage.com"
ACCESS_KEY = "c8f96a505f27d2c8311aacefa446e5e3"
SECRET_KEY = "4f57350d6cc9c017f77d0bc1e581aced60e45403f805c78db759bd21fc8682ad"

BUCKETS_WITH_BTIER = ["box-en-b", "box-zh"]

CANONICAL_RE = re.compile(
    r'<link\s+rel="canonical"\s+href="https://box\.beeaa\.com(/[^"]*?)/?"\s*/?>',
    re.IGNORECASE,
)

OUT_DIR = Path(r"F:\MiniMaxFile\beeaa_File")
LOG_FILE = OUT_DIR / "_phase18_a_rename_v5.log"
SUMMARY_FILE = OUT_DIR / "_phase18_a_summary_v5.json"
MAPPING_FILE = OUT_DIR / "_phase18_a_mapping_v5.json"


def make_s3():
    return boto3.client(
        "s3",
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=ACCESS_KEY,
        aws_secret_access_key=SECRET_KEY,
        config=Config(
            retries={"max_attempts": 5, "mode": "adaptive"},
            max_pool_connections=30,
        ),
    )


def log_line(msg: str):
    line = f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {msg}"
    print(line, flush=True)
    try:
        with LOG_FILE.open("a", encoding="utf-8") as f:
            f.write(line + "\n")
    except PermissionError:
        pass


def extract_production_slug(html_bytes: bytes) -> str | None:
    head = html_bytes[:4096].decode("utf-8", errors="ignore")
    m = CANONICAL_RE.search(head)
    if not m:
        return None
    return m.group(1).strip("/") or None


def fix_slug(old_key: str, slug: str) -> str:
    """Fix the v2/v4 bug: strip /zh/ prefix and PL prefix from canonical slug.
    - old_key: 'drone-case/100l-drone-case-32012/index.html' (3 segments)
    - slug from canonical: 'drone-case/dji-mavic-3-classic-case' (with PL)
    - slug from /zh/ canonical: 'zh/drone-case/anti-static-...-case'
    Returns: 'drone-case/dji-mavic-3-classic-case' or 'drone-case/anti-static-...-case'
    """
    pl = old_key.split("/")[0]
    # Strip /zh/ prefix (if /zh/ is the first segment)
    if slug.startswith("zh/"):
        slug = slug[3:]
    # Strip PL prefix (duplicate PL bug)
    if slug.startswith(pl + "/"):
        slug = slug[len(pl) + 1:]
    return f"{pl}/{slug}/index.html"


def process_one(s3, bucket: str, old_key: str, max_retries: int = 5) -> dict:
    # Probe both buckets because v4 mapping doesn't store bucket info
    # v4 input was a mix of box-en-b and box-zh keys
    actual_bucket = None
    body = None
    for probe_bucket in [bucket, "box-zh" if bucket == "box-en-b" else "box-en-b"]:
        for attempt in range(max_retries):
            try:
                resp = s3.get_object(Bucket=probe_bucket, Key=old_key, Range="bytes=0-4095")
                body = resp["Body"].read()
                actual_bucket = probe_bucket
                break
            except Exception as e:
                code = ""
                if hasattr(e, "response"):
                    code = e.response.get("Error", {}).get("Code", "")
                if code in ("404", "NoSuchKey", "NotFound"):
                    # Not in this bucket, try next
                    break
                if attempt < max_retries - 1:
                    sleep_s = (2 ** attempt) * 0.5 + random.uniform(0, 0.5)
                    time.sleep(sleep_s)
                    continue
                # Don't return yet 鈥?try other bucket first
                break
        if body is not None:
            break
    if body is None:
        return {"ok": False, "old_key": old_key, "stage": "get", "err": "not found in either bucket"}

    slug = extract_production_slug(body)
    if not slug:
        return {"ok": False, "old_key": old_key, "stage": "parse", "err": "no canonical", "actual_bucket": actual_bucket}

    new_key = fix_slug(old_key, slug)

    if new_key == old_key:
        return {"ok": True, "old_key": old_key, "new_key": new_key, "noop": True}

    for attempt in range(max_retries):
        try:
            s3.copy_object(
                Bucket=actual_bucket,
                Key=new_key,
                CopySource={"Bucket": actual_bucket, "Key": old_key},
                MetadataDirective="REPLACE",
                ContentType="text/html; charset=utf-8",
                CacheControl="public, max-age=300",
            )
            return {"ok": True, "old_key": old_key, "new_key": new_key, "noop": False, "actual_bucket": actual_bucket}
        except Exception as e:
            if attempt < max_retries - 1:
                sleep_s = (2 ** attempt) * 0.5 + random.uniform(0, 0.5)
                time.sleep(sleep_s)
                continue
            return {
                "ok": False, "old_key": old_key, "new_key": new_key,
                "stage": "copy", "err": str(e)[:200], "actual_bucket": actual_bucket,
            }


def main():
    log_line("=== Phase 18 v5: Fix slug path bug + 100,118 R2 re-rename ===")
    s3 = make_s3()

    # Load v4 mapping to get all old_keys already processed
    v4_map_file = OUT_DIR / "_phase15_a_mapping_v4.json"
    if not v4_map_file.exists():
        log_line("ERROR: v4 mapping not found")
        return
    with v4_map_file.open(encoding="utf-8") as f:
        v4_mapping = json.load(f)
    log_line(f"v4 mapping: {len(v4_mapping)} entries")

    # Tasks: (bucket, old_key) 鈥?old_key from v2/v4 mapping
    # v2/v4 only renamed B-tier sub-PL pages, which are in box-en-b and box-zh
    tasks = []
    for old_key in v4_mapping.keys():
        # Determine bucket by path prefix (heuristic: ZH keys have /zh/ in them OR old_key structure)
        if "/zh/" in old_key or "zh" in old_key.split("/")[0]:
            # ZH bucket
            tasks.append(("box-zh", old_key))
        else:
            tasks.append(("box-en-b", old_key))
    log_line(f"Tasks: {len(tasks)} (EN={sum(1 for b,_ in tasks if b=='box-en-b')}, ZH={sum(1 for b,_ in tasks if b=='box-zh')})")

    # Process 5 workers + backoff
    workers = 5
    log_line(f"Processing {len(tasks)} tasks with {workers} workers + backoff...")
    t0 = time.time()
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
                elapsed = time.time() - t0
                rate = i / elapsed
                eta = (len(tasks) - i) / rate if rate > 0 else 0
                log_line(
                    f"  [{i}/{len(tasks)}] ok={ok} noop={noop} err={err} "
                    f"rate={rate:.2f}/s ETA={eta:.0f}s"
                )

    elapsed = time.time() - t0
    log_line(f"=== Done in {elapsed:.1f}s ===")
    log_line(f"  ok   = {ok}")
    log_line(f"  noop = {noop}")
    log_line(f"  err  = {err}")
    if err_samples:
        log_line("Error samples (first 30):")
        for r in err_samples:
            log_line(f"  {r}")

    with MAPPING_FILE.open("w", encoding="utf-8") as f:
        json.dump(mapping, f, ensure_ascii=False, indent=2)
    log_line(f"Mapping: {MAPPING_FILE} ({len(mapping)} entries)")

    summary = {
        "ts": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "elapsed_s": round(elapsed, 1),
        "total_tasks": len(tasks),
        "ok": ok,
        "noop": noop,
        "err": err,
        "err_samples": err_samples,
        "new_mapping_count": len(mapping),
    }
    with SUMMARY_FILE.open("w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    log_line(f"Summary: {SUMMARY_FILE}")


if __name__ == "__main__":
    main()
