#!/usr/bin/env python3
"""
V13 Phase 10.2: 1 cluster (PP+GF vs Glass Fiber) + 1 blog (Mold Design Process)
"""
import json
import re
from pathlib import Path

ROOT = Path(r"C:\Users\Administrator\.minimax\workspace\box-beeaa-site")
DST_PAGES = ROOT / "dist-pages"


CLUSTER_4 = {
    "slug": "pp-gf-vs-glass-fiber",
    "path": "guides/pp-gf-vs-glass-fiber-comparison/",
    "title_en": "PP+GF vs Pure PP vs Glass Fiber Reinforced Cases 2026",
    "title_zh": "PP+GF vs 纯 PP vs 玻璃纤维加固防护箱 2026",
    "subtitle_en": "Composite materials comparison. Tensile, impact, cost, applications for B2B cases.",
    "subtitle_zh": "复合材料对比. 拉伸, 冲击, 成本, B2B 防护箱应用.",
    "intro_en": "<p>Choosing between pure PP, PP+GF composite, and glass fiber reinforced cases impacts cost, weight, durability. This guide compares 10 dimensions to help B2B buyers select the right material.</p>",
    "intro_zh": "<p>在纯 PP、PP+GF 复合材料和玻璃纤维加固箱之间选择影响成本、重量、耐久性。本指南比较 10 个维度,帮助 B2B 买家选择正确材料。</p>",
    "table_en": [
        ["Property", "Pure PP", "PP+GF (30% glass fiber)", "Pure Glass Fiber", "Best For"],
        ["Tensile Strength (MPa)", "30-40", "60-100", "150-250", "GF: high stress"],
        ["Flexural Modulus (GPa)", "1.0-1.5", "5-8", "15-30", "GF: rigid"],
        ["Impact Strength (kJ/m²)", "5-15 (notched)", "10-25", "20-50", "GF: high impact"],
        ["Heat Deflection (°C, 0.45 MPa)", "100-115", "140-160", "200+", "GF: high temp"],
        ["Density (g/cm³)", "0.90-0.92", "0.95-1.10", "1.50-2.00", "PP+GF: balanced"],
        ["Cost (USD/kg, 2026)", "$1.20-1.40", "$1.50-2.20", "$3.00-5.00", "PP: lowest"],
        ["Weight per Case (30L)", "1.8-2.2 kg", "2.0-2.4 kg", "2.5-3.5 kg", "PP: lightest"],
        ["Mold Cost", "$5K-15K", "$8K-25K", "$15K-50K", "PP: cheapest tooling"],
        ["Recyclability", "100% closed-loop", "Limited (fiber contamination)", "Difficult (resin mix)", "PP: most recyclable"],
        ["Applications", "Consumer, basic industrial", "B2B industrial, OEM", "Aerospace, defense", "Tiered by use"],
    ],
    "table_zh": [
        ["性能", "纯 PP", "PP+GF (30% 玻璃纤维)", "纯玻璃纤维", "最佳选择"],
        ["拉伸强度 (MPa)", "30-40", "60-100", "150-250", "GF: 高应力"],
        ["弯曲模量 (GPa)", "1.0-1.5", "5-8", "15-30", "GF: 刚性"],
        ["冲击强度 (kJ/m²)", "5-15 (缺口)", "10-25", "20-50", "GF: 高冲击"],
        ["热变形温度 (°C, 0.45 MPa)", "100-115", "140-160", "200+", "GF: 高温"],
        ["密度 (g/cm³)", "0.90-0.92", "0.95-1.10", "1.50-2.00", "PP+GF: 平衡"],
        ["成本 (USD/kg, 2026)", "$1.20-1.40", "$1.50-2.20", "$3.00-5.00", "PP: 最低"],
        ["30L 箱重量", "1.8-2.2 kg", "2.0-2.4 kg", "2.5-3.5 kg", "PP: 最轻"],
        ["模具成本", "$5K-15K", "$8K-25K", "$15K-50K", "PP: 最便宜工具"],
        ["可回收性", "100% 闭环", "有限 (纤维污染)", "困难 (树脂混合)", "PP: 最可回收"],
        ["应用", "消费, 基础工业", "B2B 工业, OEM", "航空航天, 国防", "按用途分层"],
    ],
}


BLOG_4 = {
    "slug": "mold-design-process-2026",
    "path": "blog/mold-design-process-2026/",
    "title": "Mold Design Process: From 3D Concept to Production Tool 2026",
    "title_zh": "模具设计流程: 从 3D 概念到生产工具 2026",
    "subtitle": "7-step mold design. Cost, lead time, materials, common pitfalls for custom case OEM.",
    "subtitle_zh": "7 步模具设计. 成本, 交付时间, 材料, 定制箱 OEM 常见陷阱.",
    "date": "2026-08-30",
    "author": "KeXinMaterials R&D Team",
    "intro": "<p>Custom case OEM starts with mold design. This 7-step process guide covers 3D design, mold material selection, machining, testing, and validation — with cost and lead time benchmarks for B2B buyers.</p>",
    "intro_zh": "<p>定制防护箱 OEM 始于模具设计。本 7 步流程指南涵盖 3D 设计、模具材料选择、机加工、测试和验证 — 附 B2B 买家成本和交付时间基准。</p>",
    "body": """<h2>7-Step Mold Design Process</h2>
<ol>
<li><strong>Step 1: 3D Design (3-5 days)</strong> — Customer provides specification or 3D model (STEP, IGES, SolidWorks). Our engineering team creates optimized design with draft angles, wall thickness, ribs, and bosses. Free service for orders 1,000+ units.</li>
<li><strong>Step 2: Mold Flow Analysis (2-3 days)</strong> — Moldflow simulation predicts filling, cooling, warping. Identifies potential defects before machining. Saves 2-4 weeks of trial-and-error.</li>
<li><strong>Step 3: Mold Material Selection (1-2 days)</strong> — Choose mold steel based on production volume:
<ul>
<li>PP+ABS: P20 (pre-hardened steel), 1,000-50,000 cycles</li>
<li>PP+GF: H13 (hardened steel), 50,000-500,000 cycles</li>
<li>Aluminum: 7075-T6 (for prototypes), 1,000-10,000 cycles</li>
</ul>
</li>
<li><strong>Step 4: Mold Machining (15-25 days)</strong> — CNC milling, EDM (electrical discharge machining), grinding. Precision: ±0.02mm. Includes cooling channels, ejector pins, parting line.</li>
<li><strong>Step 5: Mold Polishing & Assembly (3-5 days)</strong> — Mirror polish for high-gloss finish, texture for matte. Assembly: cores, cavities, slides, lifters.</li>
<li><strong>Step 6: First Article Testing (5-10 days)</strong> — T0 (initial sample) injection, dimensional check, material testing. Iterate 2-3 times to T1/T2/T3 (final samples).</li>
<li><strong>Step 7: Mass Production (30-45 days)</strong> — Full production run with IQC/IPQC/OQC. First batch: 5-10% scrap rate acceptable, then < 0.5% for stabilized process.</li>
</ol>
<p>Total lead time: 60-90 days from spec to first production batch.</p>

<h2>Mold Cost Benchmarks (2026)</h2>
<table border="1">
<thead><tr><th>Case Size</th><th>Complexity</th><th>Material</th><th>Mold Cost (USD)</th><th>Cycle Life</th><th>Lead Time</th></tr></thead>
<tbody>
<tr><td>Small (5-15L)</td><td>Simple (1 cavity)</td><td>Aluminum</td><td>$3,000-5,000</td><td>10K cycles</td><td>30-45 days</td></tr>
<tr><td>Small (5-15L)</td><td>Moderate (1 cavity + slider)</td><td>P20 steel</td><td>$5,000-10,000</td><td>50K cycles</td><td>40-55 days</td></tr>
<tr><td>Medium (15-50L)</td><td>Moderate (1 cavity + inserts)</td><td>P20 steel</td><td>$8,000-20,000</td><td>100K cycles</td><td>50-65 days</td></tr>
<tr><td>Medium (15-50L)</td><td>Complex (multi-cavity)</td><td>H13 steel</td><td>$25,000-50,000</td><td>500K cycles</td><td>60-80 days</td></tr>
<tr><td>Large (50-100L)</td><td>Complex (multi-cavity + slider)</td><td>H13 steel</td><td>$40,000-80,000</td><td>500K cycles</td><td>70-90 days</td></tr>
<tr><td>Custom (100L+)</td><td>Very complex (multi-action)</td><td>H13 + beryllium copper</td><td>$80,000-150,000</td><td>1M cycles</td><td>90-120 days</td></tr>
</tbody>
</table>

<h2>Amortization Strategies</h2>
<p>Mold cost is a one-time investment amortized over production volume. Three common strategies:</p>
<ol>
<li><strong>Volume-based amortization</strong> — Buyer pays $50K mold, amortized over 100K units = $0.50/unit. Standard B2B practice.</li>
<li><strong>Free mold with volume commitment</strong> — Factory absorbs mold cost in exchange for multi-year purchase commitment (typically 5K+ units/year for 3-5 years). Win-win for stable volume.</li>
<li><strong>Shared mold</strong> — For standard sizes (e.g., 20L camera case), factory offers existing mold with $500-2000 customization fee for unique features (color, branding). Fastest lead time (15-25 days).</li>
</ol>

<h2>Common Mold Design Pitfalls</h2>
<p><strong>Pitfall 1</strong>: Inadequate draft angles (less than 1°). Causes part sticking, warping, and shortened mold life. Standard: 1-2° for PP, 2-3° for ABS+PC.</p>
<p><strong>Pitfall 2</strong>: Uniform wall thickness. Causes sink marks, warping, voids. Vary thickness 25-40% (e.g., 2.5mm wall + 3.5mm rib base).</p>
<p><strong>Pitfall 3</strong>: Poor gate location. Causes weld lines, flow hesitation. Gate should be at thickest section, oriented with material flow direction.</p>
<p><strong>Pitfall 4</strong>: Inadequate cooling channels. Causes cycle time increase (15-30% longer) and warping. Use conformal cooling for complex parts.</p>
<p><strong>Pitfall 5</strong>: No design for assembly (DFA). Snap fits, threaded inserts, hinges should be designed into the part, not assembled later. Reduces assembly time and cost.</p>

<h2>Design Validation Checklist</h2>
<p>Before approving mold production, validate:</p>
<ul>
<li>✓ Wall thickness 2-4mm (uniform ±10%)</li>
<li>✓ Draft angles 1-3°</li>
<li>✓ Radii ≥ 0.5mm (avoid sharp corners)</li>
<li>✓ Rib thickness ≤ 0.6× wall thickness</li>
<li>✓ Boss diameter ≥ 2× hole diameter</li>
<li>✓ Parting line location (visible vs hidden)</li>
<li>✓ Gate location (thickest section, no flow hesitation)</li>
<li>✓ Cooling channel placement (uniform, near hot spots)</li>
<li>✓ Ejector pin location (no cosmetic surface marks)</li>
<li>✓ Material shrinkage compensation (1-2.5% for PP+GF)</li>
</ul>

<h2>KeXinMaterials Mold Capabilities</h2>
<ul>
<li>3 in-house mold design stations (SolidWorks + AutoCAD + Moldflow)</li>
<li>Sample lead time: 7-10 days for standard, 14-30 days for custom</li>
<li>Mold cost range: $3,000-150,000 depending on complexity</li>
<li>Production lead time: 30-45 days from T1 approval</li>
<li>Free mold for orders 5,000+ units (with 3-year volume commitment)</li>
<li>20+ patents on case design and mold cooling</li>
</ul>

<h2>Next Steps</h2>
<p>For custom case OEM, email <a href="mailto:kexin@beeaa.com">kexin@beeaa.com</a> or WhatsApp <a href="https://wa.me/8613590555309">+86 13590555309</a> with: case dimensions, application, quantity, target cost. We provide free 3D design and mold flow analysis for orders 1,000+ units.</p>
<p>Email: <a href="mailto:kexin@beeaa.com">kexin@beeaa.com</a> | WhatsApp: <a href="https://wa.me/8613590555309">+86 13590555309</a></p>
""",
}


def make_cluster_html(cluster, lang):
    title = cluster[f"title_{lang}"]
    subtitle = cluster[f"subtitle_{lang}"]
    intro = cluster[f"intro_{lang}"]
    table = cluster[f"table_{lang}"]
    thead = table[0]
    tbody = table[1:]
    rows = "\n".join(["<tr>" + "".join(f"<td>{c}</td>" for c in row) + "</tr>" for row in tbody])

    if lang == "zh":
        canonical = f"https://box.beeaa.com/zh/{cluster['path']}"
    else:
        canonical = f"https://box.beeaa.com/{cluster['path']}"

    hreflangs = f'<link rel="alternate" hreflang="en" href="https://box.beeaa.com/{cluster["path"]}" />\n  '
    hreflangs += f'<link rel="alternate" hreflang="zh" href="https://box.beeaa.com/zh/{cluster["path"]}" />'

    article_json = {"@context": "https://schema.org", "@type": "Article", "headline": title, "description": subtitle, "author": {"@type": "Organization", "name": "KeXinMaterials (Guangdong) Co., Ltd."}, "publisher": {"@type": "Organization", "name": "KeXinMaterials", "logo": {"@type": "ImageObject", "url": "https://box.beeaa.com/images/logo.png"}}, "datePublished": "2026-08-30", "dateModified": "2026-08-30", "mainEntityOfPage": {"@type": "WebPage", "@id": canonical}}
    breadcrumb_json = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": 1, "name": "Home" if lang == "en" else "首页", "item": f"https://box.beeaa.com/{'zh/' if lang == 'zh' else ''}"}, {"@type": "ListItem", "position": 2, "name": "Guides" if lang == "en" else "指南", "item": f"https://box.beeaa.com/{'zh/' if lang == 'zh' else ''}guides/"}, {"@type": "ListItem", "position": 3, "name": title, "item": canonical}]}
    faq_json = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": "Is PP+GF worth the cost over pure PP?" if lang == "en" else "PP+GF 相比纯 PP 值得额外成本吗?", "acceptedAnswer": {"@type": "Answer", "text": "For 90% of B2B protective cases, yes. PP+GF (30% glass fiber) doubles tensile strength (30-40 → 60-100 MPa), increases heat deflection (100-115°C → 140-160°C), and improves impact resistance. Cost premium: 25-60% over pure PP. For lightweight consumer cases, pure PP is fine. For industrial/military/OEM, PP+GF is the standard." if lang == "en" else "对于 90% 的 B2B 防护箱,值得。PP+GF (30% 玻璃纤维) 将拉伸强度提高一倍 (30-40 → 60-100 MPa), 提高热变形温度 (100-115°C → 140-160°C), 并改善冲击强度。成本溢价: 比纯 PP 高 25-60%。对于轻量化消费箱,纯 PP 即可。对于工业/军用/OEM,PP+GF 是标准。"}}, {"@type": "Question", "name": "How long does a PP+GF case mold last?" if lang == "en" else "PP+GF 防护箱模具寿命多久?", "acceptedAnswer": {"@type": "Answer", "text": "P20 steel mold: 50,000-100,000 cycles (~3-5 years at 50K units/year). H13 hardened steel mold: 500,000-1,000,000 cycles (~15-25 years). For glass fiber composites, H13 or beryllium copper inserts are recommended due to abrasive wear. Proper maintenance (cleaning, lubrication, polishing) extends mold life by 30-50%." if lang == "en" else "P20 钢模具: 50,000-100,000 循环 (50K 件/年约 3-5 年)。H13 硬化钢模具: 500,000-1,000,000 循环 (约 15-25 年)。对于玻璃纤维复合材料,建议使用 H13 或铍铜插件,因磨损较大。适当的维护 (清洁、润滑、抛光) 可延长模具寿命 30-50%。"}}]}

    article_str = json.dumps(article_json, ensure_ascii=False, indent=2)
    breadcrumb_str = json.dumps(breadcrumb_json, ensure_ascii=False, indent=2)
    faq_str = json.dumps(faq_json, ensure_ascii=False, indent=2)

    nav_lang_link = f'<a href="/{cluster["path"]}">English</a>' if lang == "zh" else f'<a href="/zh/{cluster["path"]}">中文</a>'

    return f"""<!DOCTYPE html>
<html lang="{lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title} | KeXinMaterials (Guangdong) Co., Ltd.</title>
  <meta name="description" content="{subtitle} OEM/ODM factory since 2014. EXW Shenzhen/FOB Ningbo, T/T 30% deposit, 30-45 day delivery." />
  <meta name="keywords" content="{cluster['slug']}, B2B, OEM, ODM, protective case, factory, KeXinMaterials" />
  <link rel="canonical" href="{canonical}" />
  {hreflangs}
  <link rel="stylesheet" href="/styles/theme.css" />
  <script type="application/ld+json">
{article_str}
  </script>
  <script type="application/ld+json">
{breadcrumb_str}
  </script>
  <script type="application/ld+json">
{faq_str}
  </script>
</head>
<body>
<header><h1>KeXinMaterials</h1><nav><a href="/{'zh/' if lang == 'zh' else ''}">Home</a> | <a href="/{'zh/products/' if lang == 'zh' else 'products/'}">Products</a> | <a href="/{'zh/oem/' if lang == 'zh' else 'oem/'}">OEM</a> | {nav_lang_link}</nav></header>
<main id="main-content" role="main">
  <article>
    <h1>{title}</h1>
    <p class="lead">{subtitle}</p>
    {intro}
    <h2>{'Comparison Table' if lang == 'en' else '对比表'}</h2>
    <table border="1">
      <thead><tr>{''.join(f'<th>{c}</th>' for c in thead)}</tr></thead>
      <tbody>
        {rows}
      </tbody>
    </table>
    <h2>{'Why Choose KeXinMaterials' if lang == 'en' else '为什么选择 KeXinMaterials'}</h2>
    <ul>
      <li>18,000㎡ factory, 60+ machines, 20+ patents</li>
      <li>ISO9001, ROHS, CE, SGS, IP67 certified</li>
      <li>OEM/ODM since 2014, 30-45 day delivery</li>
      <li>EXW Shenzhen/FOB Ningbo, T/T 30% deposit</li>
      <li>kexin@beeaa.com | +86 13590555309 | WhatsApp same</li>
    </ul>
  </article>
</main>
<footer><p>© 2026 KeXinMaterials (Guangdong) Co., Ltd. | <a href="/{'zh/' if lang == 'zh' else ''}">Home</a> | {nav_lang_link}</p></footer>
</body>
</html>"""


def make_blog_html(post, lang="en"):
    title = post["title"]
    if lang == "zh":
        title = post.get("title_zh", post["title"])
    subtitle = post["subtitle"]
    if lang == "zh":
        subtitle = post.get("subtitle_zh", post["subtitle"])
    body = post["body"]
    intro = post.get("intro_zh" if lang == "zh" else "intro", "")
    date = post["date"]
    author = post["author"]
    slug = post["slug"]
    path = post["path"]

    if lang == "zh":
        full_body = intro + body
    else:
        full_body = body

    if lang == "zh":
        canonical = f"https://box.beeaa.com/zh/{path}"
    else:
        canonical = f"https://box.beeaa.com/{path}"

    hreflangs = f'<link rel="alternate" hreflang="en" href="https://box.beeaa.com/{path}" />\n  '
    hreflangs += f'<link rel="alternate" hreflang="zh" href="https://box.beeaa.com/zh/{path}" />'

    article_json = {"@context": "https://schema.org", "@type": "Article", "headline": title, "description": subtitle, "author": {"@type": "Person", "name": author}, "publisher": {"@type": "Organization", "name": "KeXinMaterials (Guangdong) Co., Ltd."}, "datePublished": date, "dateModified": date, "mainEntityOfPage": {"@type": "WebPage", "@id": canonical}}
    article_str = json.dumps(article_json, ensure_ascii=False, indent=2)
    nav_lang_link = f'<a href="/{path}">English</a>' if lang == "zh" else f'<a href="/zh/{path}">中文</a>'

    return f"""<!DOCTYPE html>
<html lang="{lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title} | KeXinMaterials (Guangdong) Co., Ltd.</title>
  <meta name="description" content="{subtitle} OEM/ODM factory since 2014. EXW Shenzhen/FOB Ningbo, T/T 30% deposit, 30-45 day delivery." />
  <meta name="keywords" content="{slug}, B2B, OEM, ODM, protective case, factory, KeXinMaterials" />
  <link rel="canonical" href="{canonical}" />
  {hreflangs}
  <link rel="stylesheet" href="/styles/theme.css" />
  <script type="application/ld+json">
{article_str}
  </script>
</head>
<body>
<header><h1>KeXinMaterials Blog</h1><nav><a href="/{'zh/' if lang == 'zh' else ''}">Home</a> | <a href="/{'zh/blog/' if lang == 'zh' else 'blog/'}">Blog</a> | <a href="/{'zh/oem/' if lang == 'zh' else 'oem/'}">OEM</a> | {nav_lang_link}</nav></header>
<main id="main-content" role="main">
  <article>
    <h1>{title}</h1>
    <p class="meta">By {author} | {date}</p>
    <p class="lead">{subtitle}</p>
    {full_body}
  </article>
</main>
<footer><p>© 2026 KeXinMaterials (Guangdong) Co., Ltd. | <a href="/{'zh/' if lang == 'zh' else ''}">Home</a> | {nav_lang_link}</p></footer>
</body>
</html>"""


print("=" * 60)
print("Cluster 4: PP+GF vs Pure PP vs Glass Fiber (EN + ZH)")
print("=" * 60)
for lang in ["en", "zh"]:
    html = make_cluster_html(CLUSTER_4, lang)
    if lang == "zh":
        out = DST_PAGES / "zh" / CLUSTER_4["path"] / "index.html"
    else:
        out = DST_PAGES / CLUSTER_4["path"] / "index.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding="utf-8")
    print(f"  [{lang}] {out.relative_to(ROOT)} ({len(html):,} bytes)")

print()
print("=" * 60)
print("Blog 4: Mold Design Process (EN + ZH)")
print("=" * 60)
for lang in ["en", "zh"]:
    html = make_blog_html(BLOG_4, lang)
    if lang == "zh":
        out = DST_PAGES / "zh" / BLOG_4["path"] / "index.html"
    else:
        out = DST_PAGES / BLOG_4["path"] / "index.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding="utf-8")
    print(f"  [{lang}] {out.relative_to(ROOT)} ({len(html):,} bytes)")

print("\nDONE: 1 cluster + 1 blog (4 files)")
