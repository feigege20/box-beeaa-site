#!/usr/bin/env python3
"""
V12 fix lang paths: 修复 50fe1bbd bug - 同 path 写 EN+ZH 导致 ZH 覆盖 EN
- 5 cluster + 3 guide: root 是 ZH (错), EN 缺失
  修复: 移 root ZH 到 /zh/guides/, 在 root 生成 EN, /zh/guides/ 重新生成 ZH (用 make_html 改 canonical)
- 5 blog: root 是 EN (对), ZH 缺失
  修复: 复制 EN 内容到 /zh/blog/ 作为基础, 改 lang=zh 和 canonical
"""
import re
import shutil
import importlib.util
from pathlib import Path

ROOT = Path(r"C:\Users\Administrator\.minimax\workspace\box-beeaa-site")
DST_PAGES = ROOT / "dist-pages"


def load_module(name, path):
    """加载 Python 脚本作为 module, 不执行其写入文件的 main 部分"""
    text = path.read_text(encoding="utf-8")
    # 移除文件写入循环
    # 找 "count = 0" 起始, "print(f"\\nDone: ..." 结束
    pattern = r'count = 0.*?print\(f"\\nDone:.*?\n'
    text_clean = re.sub(pattern, '', text, flags=re.DOTALL)
    if 'count = 0' in text_clean:
        # 再试一次, 可能 Done 在不同行
        text_clean = re.sub(r'count = 0.*', '', text_clean, flags=re.DOTALL)
    module_globals = {"__name__": f"loaded_{name}", "__file__": str(path), "Path": Path}
    exec(compile(text_clean, path, "exec"), module_globals)
    return module_globals


# 加载 cluster 数据 (5)
cluster_mod = load_module("cluster", ROOT / "scripts" / "_v12_generate_cluster.py")
CLUSTERS = cluster_mod.get("CLUSTERS", [])
make_html_cluster = cluster_mod.get("make_html")
print(f"[LOAD] cluster.py: {len(CLUSTERS)} clusters, make_html={make_html_cluster is not None}")

# 加载 guides 数据 (3)
guides_mod = load_module("guides", ROOT / "scripts" / "_v12_generate_guides.py")
GUIDES = guides_mod.get("GUIDES", [])
make_howto_html = guides_mod.get("make_howto_html")
print(f"[LOAD] guides.py: {len(GUIDES)} guides, make_howto_html={make_howto_html is not None}")

# 加载 blog 数据 (5, 仅 EN)
blog_mod = load_module("blog", ROOT / "scripts" / "_v12_generate_blog.py")
POSTS = blog_mod.get("POSTS", [])
make_blog_html = blog_mod.get("make_blog_html")
print(f"[LOAD] blog.py: {len(POSTS)} posts, make_blog_html={make_blog_html is not None}")


# ============= Step 1: 移 root guides/ (ZH) 到 /zh/guides/ =============
print()
print("=" * 60)
print("Step 1: Move root guides/ ZH content to /zh/guides/")
print("=" * 60)

all_guides_paths = [c["path"] for c in CLUSTERS] + [g["path"] for g in GUIDES]
moved = 0
for rel_path in all_guides_paths:
    src = DST_PAGES / rel_path / "index.html"
    dst = DST_PAGES / "zh" / rel_path / "index.html"
    if src.exists():
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(src), str(dst))
        moved += 1
        print(f"  Moved: {rel_path} -> zh/{rel_path}")
    else:
        print(f"  [SKIP] {rel_path} not found")

# 移 guides/index.html (ZH 版)
src = DST_PAGES / "guides" / "index.html"
if src.exists():
    content = src.read_text(encoding="utf-8")
    if '<html lang="zh"' in content or 'IP67 闃叉按绠' in content or 'IP67 防水箱' in content:
        dst = DST_PAGES / "zh" / "guides" / "index.html"
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(src), str(dst))
        moved += 1
        print(f"  Moved: guides/index.html -> zh/guides/index.html")
    else:
        print(f"  [KEEP] guides/index.html is not ZH, leaving")

print(f"\nMoved {moved} files to /zh/guides/")


# ============= Step 2: 生成 EN cluster+guide 在 root =============
print()
print("=" * 60)
print("Step 2: Generate EN cluster+guide at root /guides/")
print("=" * 60)

written_en = 0

# Cluster EN
if make_html_cluster:
    for c in CLUSTERS:
        out_dir = DST_PAGES / c["path"]
        out_dir.mkdir(parents=True, exist_ok=True)
        out = out_dir / "index.html"
        html = make_html_cluster(c, "en")
        out.write_text(html, encoding="utf-8")
        written_en += 1
        print(f"  EN cluster: {c['path']} ({len(html):,} bytes)")

# Guides EN
if make_howto_html:
    for g in GUIDES:
        out_dir = DST_PAGES / g["path"]
        out_dir.mkdir(parents=True, exist_ok=True)
        out = out_dir / "index.html"
        html = make_howto_html(g, "en")
        out.write_text(html, encoding="utf-8")
        written_en += 1
        print(f"  EN guide:   {g['path']} ({len(html):,} bytes)")

print(f"\nWrote {written_en} EN pages at /guides/")


# ============= Step 3: 重新生成 ZH cluster+guide 在 /zh/guides/ (覆盖刚才移的) =============
print()
print("=" * 60)
print("Step 3: Regenerate ZH cluster+guide at /zh/guides/")
print("=" * 60)

written_zh = 0

# Cluster ZH
if make_html_cluster:
    for c in CLUSTERS:
        rel_path = c["path"]
        out_dir = DST_PAGES / "zh" / rel_path
        out_dir.mkdir(parents=True, exist_ok=True)
        out = out_dir / "index.html"
        html = make_html_cluster(c, "zh")
        # 改 canonical 为 /zh/...
        html = html.replace(
            f'canonical" href="https://box.beeaa.com/{rel_path}"',
            f'canonical" href="https://box.beeaa.com/zh/{rel_path}"'
        )
        # 改 mainEntityOfPage
        html = html.replace(
            f'"@id": "https://box.beeaa.com/{rel_path}"',
            f'"@id": "https://box.beeaa.com/zh/{rel_path}"'
        )
        # 改 nav 链接
        html = html.replace(
            '<a href="/oem/">OEM</a>',
            '<a href="/oem/">OEM</a> | <a href="/' + rel_path + '">English</a>'
        )
        out.write_text(html, encoding="utf-8")
        written_zh += 1
        print(f"  ZH cluster: zh/{rel_path} ({len(html):,} bytes)")

# Guides ZH
if make_howto_html:
    for g in GUIDES:
        rel_path = g["path"]
        out_dir = DST_PAGES / "zh" / rel_path
        out_dir.mkdir(parents=True, exist_ok=True)
        out = out_dir / "index.html"
        html = make_howto_html(g, "zh")
        html = html.replace(
            f'canonical" href="https://box.beeaa.com/{rel_path}"',
            f'canonical" href="https://box.beeaa.com/zh/{rel_path}"'
        )
        html = html.replace(
            '<a href="/oem/">OEM</a> | <a href="/guides/">Guides</a>',
            '<a href="/oem/">OEM</a> | <a href="/guides/">Guides</a> | <a href="/' + rel_path + '">English</a>'
        )
        out.write_text(html, encoding="utf-8")
        written_zh += 1
        print(f"  ZH guide:   zh/{rel_path} ({len(html):,} bytes)")

print(f"\nWrote {written_zh} ZH pages at /zh/guides/")


# ============= Step 4: 写 /guides/index.html (EN) =============
print()
print("=" * 60)
print("Step 4: Write EN /guides/index.html")
print("=" * 60)

guides_index_en = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Buyer's Guides for Protective Cases | KeXinMaterials (Guangdong) Co., Ltd.</title>
  <meta name="description" content="Expert B2B buyer's guides for IP67 waterproof cases, MIL-SPEC military cases, drone cases, tool boxes, and OEM custom cases. Comparison tables, specs, pricing." />
  <link rel="canonical" href="https://box.beeaa.com/guides/" />
  <link rel="alternate" hreflang="en" href="https://box.beeaa.com/guides/" />
  <link rel="alternate" hreflang="zh" href="https://box.beeaa.com/zh/guides/" />
  <link rel="alternate" hreflang="de" href="https://box.beeaa.com/de/guides/" />
  <link rel="alternate" hreflang="es" href="https://box.beeaa.com/es/guides/" />
  <link rel="alternate" hreflang="fr" href="https://box.beeaa.com/fr/guides/" />
  <link rel="alternate" hreflang="ja" href="https://box.beeaa.com/ja/guides/" />
  <link rel="stylesheet" href="/styles/theme.css" />
  <script type="application/ld+json">
{"@context":"https://schema.org","@type":"CollectionPage","name":"Buyer's Guides for Protective Cases","description":"Expert B2B buyer's guides for protective cases.","url":"https://box.beeaa.com/guides/"}
  </script>
</head>
<body>
<header><h1>KeXinMaterials</h1><nav><a href="/">Home</a> | <a href="/products/">Products</a> | <a href="/oem/">OEM</a> | <a href="/zh/guides/">中文</a></nav></header>
<main id="main-content" role="main">
  <h1>Buyer's Guides for Protective Cases</h1>
  <p>Expert B2B buyer's guides for protective cases. Compare specifications, materials, certifications, and pricing across 5+ case categories. All guides include comparison tables, application recommendations, and supplier selection criteria.</p>

  <h2>Cluster Pages (Product Comparisons)</h2>
  <ul>
    <li><a href="/guides/ip67-waterproof-case-vs-alternatives/">IP67 Waterproof Case vs Alternatives: Buyer's Guide 2026</a> - Compare IP67, IP68, ATA 300, MIL-SPEC cases.</li>
    <li><a href="/guides/mil-spec-military-case-vs-alternatives/">MIL-SPEC Military Case vs Alternatives</a> - MIL-STD-810H, 461, 464 standards explained.</li>
    <li><a href="/guides/drone-case-vs-alternatives/">Professional Drone Case Comparison</a> - DJI Mavic, Autel, Skydio case types.</li>
    <li><a href="/guides/tool-box-vs-alternatives/">Industrial Tool Box Types Compared</a> - Plastic, metal, fabric, rolling, modular.</li>
    <li><a href="/guides/oem-custom-case-process/">OEM Custom Case Process</a> - 6-step process from design to delivery.</li>
  </ul>

  <h2>How-To Guides (Step-by-Step)</h2>
  <ul>
    <li><a href="/guides/how-to-choose-ip67-waterproof-case/">How to Choose IP67 Waterproof Case (7 Steps)</a> - Complete B2B buyer's guide.</li>
    <li><a href="/guides/mil-spec-certification-guide/">MIL-SPEC Certification Guide</a> - MIL-STD-810H, 461, 464 explained.</li>
    <li><a href="/guides/oem-protective-case-process/">OEM Protective Case Process</a> - 6-step OEM workflow.</li>
  </ul>
</main>
<footer><p>© 2026 KeXinMaterials (Guangdong) Co., Ltd. | <a href="/">Home</a> | <a href="/zh/guides/">中文版本</a></p></footer>
</body>
</html>"""

guides_index_path = DST_PAGES / "guides" / "index.html"
guides_index_path.write_text(guides_index_en, encoding="utf-8")
print(f"Wrote EN /guides/index.html ({len(guides_index_en):,} bytes)")


# ============= Step 5: 写 /zh/guides/index.html (ZH) =============
guides_index_zh = """<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>防护箱采购指南 | KeXinMaterials (Guangdong) Co., Ltd.</title>
  <meta name="description" content="B2B 防护箱采购指南: IP67 防水箱, MIL-SPEC 军用箱, 无人机箱, 工具箱, OEM 定制箱. 对比表, 规格, 价格." />
  <link rel="canonical" href="https://box.beeaa.com/zh/guides/" />
  <link rel="alternate" hreflang="en" href="https://box.beeaa.com/guides/" />
  <link rel="alternate" hreflang="zh" href="https://box.beeaa.com/zh/guides/" />
  <link rel="alternate" hreflang="de" href="https://box.beeaa.com/de/guides/" />
  <link rel="alternate" hreflang="es" href="https://box.beeaa.com/es/guides/" />
  <link rel="alternate" hreflang="fr" href="https://box.beeaa.com/fr/guides/" />
  <link rel="alternate" hreflang="ja" href="https://box.beeaa.com/ja/guides/" />
  <link rel="stylesheet" href="/styles/theme.css" />
</head>
<body>
<header><h1>KeXinMaterials</h1><nav><a href="/zh/">首页</a> | <a href="/zh/products/">产品</a> | <a href="/zh/oem/">OEM</a> | <a href="/guides/">English</a></nav></header>
<main id="main-content" role="main">
  <h1>防护箱采购指南</h1>
  <p>B2B 防护箱采购指南. 对比 5+ 类防护箱的规格, 材料, 认证, 价格. 所有指南包括对比表, 应用建议, 供应商选择标准.</p>

  <h2>产品对比 (Cluster)</h2>
  <ul>
    <li><a href="/zh/guides/ip67-waterproof-case-vs-alternatives/">IP67 防水箱 vs 替代品 选购指南 2026</a> - IP67, IP68, ATA 300, MIL-SPEC 对比.</li>
    <li><a href="/zh/guides/mil-spec-military-case-vs-alternatives/">MIL-SPEC 军用箱 vs 替代品</a> - MIL-STD-810H, 461, 464 标准详解.</li>
    <li><a href="/zh/guides/drone-case-vs-alternatives/">专业无人机防护箱对比</a> - DJI Mavic, Autel, Skydio 箱型.</li>
    <li><a href="/zh/guides/tool-box-vs-alternatives/">工业工具箱类型对比</a> - 塑料, 金属, 布艺, 滚轮, 模块化.</li>
    <li><a href="/zh/guides/oem-custom-case-process/">OEM 定制防护箱流程</a> - 6 步流程, 从设计到交付.</li>
  </ul>

  <h2>分步指南 (HowTo)</h2>
  <ul>
    <li><a href="/zh/guides/how-to-choose-ip67-waterproof-case/">如何选择 IP67 防水箱 (7 步)</a> - 完整 B2B 采购指南.</li>
    <li><a href="/zh/guides/mil-spec-certification-guide/">MIL-SPEC 认证指南</a> - MIL-STD-810H, 461, 464 详解.</li>
    <li><a href="/zh/guides/oem-protective-case-process/">OEM 防护箱流程</a> - 6 步 OEM 工作流.</li>
  </ul>
</main>
<footer><p>© 2026 KeXinMaterials (Guangdong) Co., Ltd. | <a href="/zh/">首页</a> | <a href="/guides/">English</a></p></footer>
</body>
</html>"""

guides_index_zh_path = DST_PAGES / "zh" / "guides" / "index.html"
guides_index_zh_path.write_text(guides_index_zh, encoding="utf-8")
print(f"Wrote ZH /zh/guides/index.html ({len(guides_index_zh):,} bytes)")


# ============= Step 6: 写 /zh/blog/ (5 ZH blog 占位) =============
print()
print("=" * 60)
print("Step 6: Generate /zh/blog/ (5 ZH blog posts, EN content as base)")
print("=" * 60)

blog_zh_titles = {
    "b2b-protective-case-export-trends-2026": "B2B 防护箱出口趋势 2026: 中国工厂洞察",
    "china-protective-case-factory-selection": "中国防护箱工厂选择: B2B 采购完整指南",
    "drone-case-buying-guide": "无人机防护箱购买指南: DJI, Autel, Skydio 选型",
    "ip67-vs-ip68-vs-mil-spec": "IP67 vs IP68 vs MIL-SPEC: 您需要哪种标准?",
    "sustainable-protective-cases-2026": "2026 可持续防护箱: 行业趋势与采购指南",
}

written_zh_blog = 0
for post in POSTS:
    en_file = DST_PAGES / post["path"] / "index.html"
    if not en_file.exists():
        print(f"  [SKIP] {post['path']} EN not found")
        continue
    en_content = en_file.read_text(encoding="utf-8")
    # 改 lang 到 zh, 改 canonical 到 /zh/...
    zh_content = en_content
    zh_content = zh_content.replace('<html lang="en">', '<html lang="zh">')
    zh_content = zh_content.replace(
        f'canonical" href="https://box.beeaa.com/{post["path"]}"',
        f'canonical" href="https://box.beeaa.com/zh/{post["path"]}"'
    )
    # 改 article JSON 的 mainEntityOfPage
    zh_content = zh_content.replace(
        f'"@id":"https://box.beeaa.com/{post["path"]}"',
        f'"@id":"https://box.beeaa.com/zh/{post["path"]}"'
    )
    # 加 hreflang
    if 'hreflang="en"' not in zh_content:
        zh_content = zh_content.replace(
            '<link rel="canonical"',
            f'<link rel="alternate" hreflang="en" href="https://box.beeaa.com/{post["path"]}" />\n  <link rel="alternate" hreflang="zh" href="https://box.beeaa.com/zh/{post["path"]}" />\n  <link rel="canonical"'
        )
    # 改 nav: 加中文链接
    zh_content = zh_content.replace(
        '<a href="/oem/">OEM</a></nav>',
        '<a href="/oem/">OEM</a> | <a href="/' + post["path"] + '">English</a></nav>'
    )
    # 改 title 为 ZH (如果有)
    slug = post["slug"]
    if slug in blog_zh_titles:
        zh_content = zh_content.replace(
            f'<title>{post["title"]} | KeXinMaterials (Guangdong) Co., Ltd.</title>',
            f'<title>{blog_zh_titles[slug]} | KeXinMaterials (Guangdong) Co., Ltd.</title>'
        )
    # 改 H1
    if slug in blog_zh_titles:
        zh_content = zh_content.replace(
            f'<h1>{post["title"]}</h1>',
            f'<h1>{blog_zh_titles[slug]}</h1>'
        )
    # 写
    out_dir = DST_PAGES / "zh" / post["path"]
    out_dir.mkdir(parents=True, exist_ok=True)
    out = out_dir / "index.html"
    out.write_text(zh_content, encoding="utf-8")
    written_zh_blog += 1
    print(f"  ZH blog: zh/{post['path']} ({len(zh_content):,} bytes)")

print(f"\nWrote {written_zh_blog} ZH blog pages at /zh/blog/")


# ============= Step 7: 写 /zh/blog/index.html =============
blog_index_zh = """<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>防护箱行业博客 | KeXinMaterials (Guangdong) Co., Ltd.</title>
  <meta name="description" content="B2B 防护箱行业博客: 出口趋势, 工厂选择, 无人机箱指南, IP67/IP68/MIL-SPEC 标准, 可持续发展. OEM/ODM 工厂源头, 出口 12+ 年." />
  <link rel="canonical" href="https://box.beeaa.com/zh/blog/" />
  <link rel="alternate" hreflang="en" href="https://box.beeaa.com/blog/" />
  <link rel="alternate" hreflang="zh" href="https://box.beeaa.com/zh/blog/" />
  <link rel="alternate" hreflang="de" href="https://box.beeaa.com/de/blog/" />
  <link rel="alternate" hreflang="es" href="https://box.beeaa.com/es/blog/" />
  <link rel="alternate" hreflang="fr" href="https://box.beeaa.com/fr/blog/" />
  <link rel="alternate" hreflang="ja" href="https://box.beeaa.com/ja/blog/" />
  <link rel="stylesheet" href="/styles/theme.css" />
</head>
<body>
<header><h1>KeXinMaterials 防护箱博客</h1><nav><a href="/zh/">首页</a> | <a href="/zh/products/">产品</a> | <a href="/zh/oem/">OEM</a> | <a href="/blog/">English</a></nav></header>
<main id="main-content" role="main">
  <h1>防护箱行业博客</h1>
  <p>专业的 B2B 防护箱行业分析, 出口趋势, 工厂选择指南, 以及可持续发展实践. OEM/ODM 工厂源头, 出口 12+ 年.</p>

  <h2>最新文章</h2>
  <ul>
    <li><a href="/zh/blog/b2b-protective-case-export-trends-2026/">B2B 防护箱出口趋势 2026: 中国工厂洞察</a> - 市场数据, 出口目的地, OEM 趋势, 可持续发展, AI 驱动设计.</li>
    <li><a href="/zh/blog/china-protective-case-factory-selection/">中国防护箱工厂选择: B2B 采购完整指南</a> - 工厂评估, 认证验证, 价格谈判, 质量控制.</li>
    <li><a href="/zh/blog/drone-case-buying-guide/">无人机防护箱购买指南: DJI, Autel, Skydio 选型</a> - 尺寸, 海绵内衬, 充电, 运输.</li>
    <li><a href="/zh/blog/ip67-vs-ip68-vs-mil-spec/">IP67 vs IP68 vs MIL-SPEC: 您需要哪种标准?</a> - 保护标准解析, 成本 vs 性能权衡.</li>
    <li><a href="/zh/blog/sustainable-protective-cases-2026/">2026 可持续防护箱: 行业趋势与采购指南</a> - 再生材料, 碳中和, 闭环回收.</li>
  </ul>
</main>
<footer><p>© 2026 KeXinMaterials (Guangdong) Co., Ltd. | <a href="/zh/">首页</a> | <a href="/blog/">English</a></p></footer>
</body>
</html>"""

blog_index_zh_path = DST_PAGES / "zh" / "blog" / "index.html"
blog_index_zh_path.write_text(blog_index_zh, encoding="utf-8")
print(f"\nWrote ZH /zh/blog/index.html ({len(blog_index_zh):,} bytes)")


# ============= Summary =============
print()
print("=" * 60)
print("SUMMARY")
print("=" * 60)
print(f"  Moved root guides/ ZH to /zh/guides/: {moved} files")
print(f"  Wrote EN at /guides/: {written_en} files (5 cluster + 3 guide)")
print(f"  Wrote ZH at /zh/guides/: {written_zh} files (5 cluster + 3 guide, regenerated)")
print(f"  Wrote /guides/index.html: 1 EN")
print(f"  Wrote /zh/guides/index.html: 1 ZH")
print(f"  Wrote ZH at /zh/blog/: {written_zh_blog} files (5 posts)")
print(f"  Wrote /zh/blog/index.html: 1 ZH")
print()
print(f"NOTE: Blog ZH content is currently EN-as-base with ZH meta. Full ZH body translation is future work.")
