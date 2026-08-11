#!/usr/bin/env python3
"""验证 dist HTML 实际内容"""
import re
import sys

path = sys.argv[1] if len(sys.argv) > 1 else r"C:\Users\Administrator\.mavis\workspace\box-beeaa-site\dist\zh\index.html"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

print(f"=== {path} ===")
print(f"File size: {len(content)} chars")
print()

# 关键元素检查
h1 = re.search(r"<h1>(.*?)</h1>", content)
if h1:
    print(f"H1: {h1.group(1)}")
desc = re.search(r'<meta name="description" content="(.*?)"', content)
if desc:
    print(f"DESC: {desc.group(1)[:200]}")

# 13,000 出现
print(f"\n13,000 occurrences: {len(re.findall(r'13[,,\\s]?000', content))}")

# 8 系
series8 = re.findall(r"8 系.{20}", content)
print(f"\n8 系 contexts (前 3):")
for s in series8[:3]:
    print(f"  {s}")

# 视频
video = re.search(r"video[^>]*src=\"([^\"]+)\"", content)
if video:
    print(f"\nVideo src: {video.group(1)}")

# 真实公司
print(f"\n公司名出现:")
for kw in ["客信新材料", "军之甲", "KeXinMaterials", "中山"]:
    count = content.count(kw)
    print(f"  {kw}: {count}")

# WebP + srcset
webp = len(re.findall(r"\.webp", content))
srcset = len(re.findall(r"srcset=", content))
print(f"\nWebP references: {webp}")
print(f"srcset attributes: {srcset}")

# preload
preload = re.findall(r'<link[^>]+preload[^>]+>', content)
print(f"\nPreload links:")
for p in preload:
    print(f"  {p}")

# 8 系专题
print(f"\nFeatured 8 系 block:")
featured = re.search(r"8 系防护箱[^<]*", content)
if featured:
    print(f"  {featured.group(0)[:200]}")
