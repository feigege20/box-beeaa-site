#!/usr/bin/env python3
"""查找最近创建的 PNG 文件"""
import os
import glob
import time
import datetime

cutoff = time.time() - 1800  # 30 分钟前
found = []

roots = [
    r"C:\Users\Administrator\.minimax",
    r"C:\Users\Administrator\.mavis",
]

for root_dir in roots:
    if not os.path.exists(root_dir):
        continue
    for dirpath, dirnames, filenames in os.walk(root_dir):
        # 限制深度避免太慢
        depth = dirpath[len(root_dir):].count(os.sep)
        if depth > 6:
            dirnames.clear()
            continue
        # 跳过明显无关的目录
        skip = ["node_modules", ".git", "wp-content/plugins", "wp-includes", "wp-admin"]
        dirnames[:] = [d for d in dirnames if d not in skip]

        for f in filenames:
            if f.endswith(".png"):
                full = os.path.join(dirpath, f)
                try:
                    if os.path.getmtime(full) > cutoff:
                        found.append((full, os.path.getmtime(full), os.path.getsize(full)))
                except (OSError, PermissionError):
                    pass

found.sort(key=lambda x: -x[1])
print(f"找到 {len(found)} 个最近 PNG 文件")
for f, t, s in found[:30]:
    print(f"  {datetime.datetime.fromtimestamp(t).strftime('%H:%M:%S')}  {s:>10} bytes  {f}")
