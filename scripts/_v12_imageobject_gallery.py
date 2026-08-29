#!/usr/bin/env python3
"""
V13: ImageObject gallery injection for 9 PL home pages (Phase 9.3)
- Extract 3 <img> tags per PL home
- Inject ImageGallery JSON-LD with ImageObject array
- Helps Google Images indexing for product images
"""
import json
import re
from pathlib import Path

ROOT = Path(r"C:\Users\Administrator\.minimax\workspace\box-beeaa-site")
DST_PAGES = ROOT / "dist-pages"

PL_SLUGS = [
    "waterproof-case", "drone-case", "military-tactical-case", "tool-box",
    "instrument-case", "medical-case", "engineering-plastic-case",
    "camera-stage-case", "trolley-case",
]


def extract_images(html_content):
    """Extract <img> tags: url, alt, width, height"""
    images = []
    # 匹配 <img src="..." ... alt="..." ... width="..." ... height="..." ...>
    img_pattern = re.compile(
        r'<img\s+[^>]*?src="([^"]+)"[^>]*?(?:alt="([^"]*)")?[^>]*?(?:width="(\d+)")?[^>]*?(?:height="(\d+)")?[^>]*?/?>',
        re.IGNORECASE
    )
    for match in img_pattern.finditer(html_content):
        src = match.group(1)
        alt = match.group(2) or ""
        width = match.group(3)
        height = match.group(4)
        # 跳过 logo / 装饰图
        if "logo" in src or "icon" in src:
            continue
        # 转 width/height 为 int
        try:
            w = int(width) if width else 800
            h = int(height) if height else 600
        except (ValueError, TypeError):
            w, h = 800, 600
        # 完整 URL (相对转绝对)
        if src.startswith("/"):
            full_url = f"https://box.beeaa.com{src}"
        else:
            full_url = src
        images.append({
            "url": full_url,
            "alt": alt,
            "width": w,
            "height": h
        })
    return images


def inject_image_gallery(html_content, images, pl_name):
    """Inject ImageGallery JSON-LD before </head>"""
    if not images:
        return html_content, False

    # 创建 ImageObject 列表
    image_objects = []
    for img in images[:6]:  # 最多 6 张
        image_objects.append({
            "@type": "ImageObject",
            "url": img["url"],
            "name": img["alt"] or f"{pl_name} product image",
            "description": img["alt"] or f"{pl_name} product image - KeXinMaterials B2B factory",
            "width": str(img["width"]),
            "height": str(img["height"]),
            "encodingFormat": "image/webp",
            "contentUrl": img["url"]
        })

    gallery_json = {
        "@context": "https://schema.org",
        "@type": "ImageGallery",
        "name": f"{pl_name} Product Image Gallery",
        "description": f"{pl_name} product images from KeXinMaterials B2B protective case factory",
        "image": image_objects
    }

    gallery_str = json.dumps(gallery_json, ensure_ascii=False, indent=2)
    gallery_script = f'\n<script type="application/ld+json">\n{gallery_str}\n</script>\n'

    if '</head>' in html_content:
        new_content = html_content.replace('</head>', gallery_script + '</head>', 1)
        return new_content, True
    return html_content, False


# ============= Process 9 PL home EN + ZH =============
print("=" * 60)
print("V13: ImageObject gallery for 9 PL home (EN + ZH)")
print("=" * 60)

total_count = 0
total_images = 0
for pl_slug in PL_SLUGS:
    pl_name = pl_slug.replace("-", " ").title()

    for lang_suffix, pl_label in [("", "EN"), ("zh/", "ZH")]:
        pl_file = DST_PAGES / lang_suffix / pl_slug / "index.html"
        if not pl_file.exists():
            print(f"  [SKIP] {pl_label} {pl_slug}/index.html not found")
            continue

        content = pl_file.read_text(encoding="utf-8")
        if '"@type": "ImageGallery"' in content:
            print(f"  [ALREADY] {pl_label} {pl_slug}/index.html has ImageGallery")
            continue

        images = extract_images(content)
        if not images:
            print(f"  [WARN] {pl_label} {pl_slug}/index.html has no images")
            continue

        new_content, success = inject_image_gallery(content, images, pl_name)
        if success:
            pl_file.write_text(new_content, encoding="utf-8")
            bytes_added = len(new_content) - len(content)
            total_count += 1
            total_images += len(images)
            print(f"  [OK] {pl_label} {pl_slug}/index.html: {len(images)} images, +{bytes_added:,} bytes")

print(f"\nTotal: {total_count} PL home pages updated, {total_images} images indexed")
