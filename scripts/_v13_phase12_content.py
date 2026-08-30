#!/usr/bin/env python3
"""
V13 Phase 12.2: 1 cluster (EVA Foam vs PE Foam) + 1 blog (RoHS Compliance 2026)
"""
import json
from pathlib import Path

ROOT = Path(r"C:\Users\Administrator\.minimax\workspace\box-beeaa-site")
DST_PAGES = ROOT / "dist-pages"

CLUSTER_7 = {
    "slug": "eva-foam-vs-pe-foam",
    "path": "guides/eva-foam-vs-pe-foam/",
    "title_en": "EVA Foam vs PE Foam: Custom Case Insert Comparison 2026",
    "title_zh": "EVA 海绵 vs PE 海绵: 定制防护箱内衬对比 2026",
    "subtitle_en": "Foam insert material comparison. Density, water resistance, cost, applications for B2B cases.",
    "subtitle_zh": "海绵内衬材料对比. 密度, 防水性, 成本, B2B 防护箱应用.",
    "intro_en": "<p>Custom foam inserts are critical for protective case value. EVA (Ethylene-Vinyl Acetate) and PE (Polyethylene) are the two most common materials. This guide compares 10 dimensions to help B2B buyers select the right foam.</p>",
    "intro_zh": "<p>定制海绵内衬对防护箱价值至关重要。EVA (乙烯-醋酸乙烯共聚物) 和 PE (聚乙烯) 是两种最常用的材料。本指南比较 10 个维度,帮助 B2B 买家选择正确的海绵。</p>",
    "table_en": [
        ["Property", "EVA Foam (Closed-Cell)", "PE Foam (Polyethylene)", "Best For"],
        ["Density (kg/m³)", "30-200 (typical 50-100)", "25-80 (typical 35-50)", "EVA: high density"],
        ["Water Absorption", "< 1% (closed-cell)", "1-3% (cross-linked: < 1%)", "Both: closed-cell low"],
        ["Compression Set (50% recover)", "Good (5-10% permanent)", "Excellent (2-5% permanent)", "PE: long-term shape"],
        ["Tear Strength", "Fair (1.5-3.0 kN/m)", "Good (3-5 kN/m)", "PE: rough handling"],
        ["Temperature Range", "-40 to +80°C", "-50 to +90°C", "PE: wider range"],
        ["Chemical Resistance", "Good (acids, alkalis)", "Excellent (oils, fuels)", "PE: oils/fuels"],
        ["Custom Cut Cost (per case)", "$15-30 (laser)", "$10-20 (water jet)", "PE: 25% cheaper"],
        ["Density Cost (per kg)", "$8-15", "$5-10", "PE: lower cost"],
        ["Color Options", "Black, gray, blue, custom", "Black, white, custom", "Similar"],
        ["Eco-Friendliness", "Recyclable, ROHS compliant", "Recyclable, ROHS compliant", "Similar"],
        ["Best Applications", "Camera, medical, electronics", "Tools, military, industrial", "Match use"],
    ],
    "table_zh": [
        ["性能", "EVA 海绵 (闭孔)", "PE 海绵 (聚乙烯)", "最佳选择"],
        ["密度 (kg/m³)", "30-200 (典型 50-100)", "25-80 (典型 35-50)", "EVA: 高密度"],
        ["吸水率", "< 1% (闭孔)", "1-3% (交联: < 1%)", "两者: 闭孔低"],
        ["压缩形变 (50% 恢复)", "良好 (5-10% 永久)", "优秀 (2-5% 永久)", "PE: 长期形状"],
        ["撕裂强度", "一般 (1.5-3.0 kN/m)", "良好 (3-5 kN/m)", "PE: 粗暴搬运"],
        ["温度范围", "-40 至 +80°C", "-50 至 +90°C", "PE: 更宽"],
        ["化学耐受", "良好 (酸, 碱)", "优秀 (油, 燃料)", "PE: 油/燃料"],
        ["定制切割成本 (每件)", "$15-30 (激光)", "$10-20 (水刀)", "PE: 便宜 25%"],
        ["密度成本 (每 kg)", "$8-15", "$5-10", "PE: 更低成本"],
        ["颜色选项", "黑, 灰, 蓝, 定制", "黑, 白, 定制", "相似"],
        ["环保性", "可回收, ROHS 合规", "可回收, ROHS 合规", "相似"],
        ["最佳应用", "相机, 医疗, 电子", "工具, 军事, 工业", "按用途选择"],
    ],
}


BLOG_7 = {
    "slug": "rohs-reach-compliance-2026",
    "path": "blog/rohs-reach-compliance-2026/",
    "title": "ROHS & REACH Compliance for Protective Cases: 2026 Guide",
    "title_zh": "防护箱 ROHS 和 REACH 合规指南 2026",
    "subtitle": "B2B compliance essentials. Substance restrictions, testing, certification, supplier audit for EU/US markets.",
    "subtitle_zh": "B2B 合规要点. 物质限制, 测试, 认证, 欧盟/美国市场供应商审核.",
    "date": "2026-08-30",
    "author": "KeXinMaterials Compliance Team",
    "intro": "<p>ROHS and REACH compliance is mandatory for B2B protective cases sold in EU, US, and most Asian markets. This guide covers substance restrictions, testing procedures, certification, and supplier audit for 2026 B2B buyers.</p>",
    "intro_zh": "<p>ROHS 和 REACH 合规是欧盟、美国和大多数亚洲市场 B2B 防护箱销售的强制要求。本指南涵盖 2026 年 B2B 买家的物质限制、测试程序、认证和供应商审核。</p>",
    "body": """<h2>ROHS (Restriction of Hazardous Substances) 2026</h2>
<p><strong>Scope</strong>: All electronic and electrical equipment, including cases with electronic components (locks, sensors).</p>
<p><strong>Restricted substances (10)</strong>:</p>
<ol>
<li>Lead (Pb) - < 0.1% (1,000 ppm)</li>
<li>Mercury (Hg) - < 0.1% (1,000 ppm)</li>
<li>Cadmium (Cd) - < 0.01% (100 ppm)</li>
<li>Hexavalent chromium (Cr6+) - < 0.1% (1,000 ppm)</li>
<li>Polybrominated biphenyls (PBB) - < 0.1%</li>
<li>Polybrominated diphenyl ethers (PBDE) - < 0.1%</li>
<li>Bis(2-ethylhexyl) phthalate (DEHP) - < 0.1%</li>
<li>Butyl benzyl phthalate (BBP) - < 0.1%</li>
<li>Dibutyl phthalate (DBP) - < 0.1%</li>
<li>Diisobutyl phthalate (DIBP) - < 0.1%</li>
</ol>
<p><strong>ROHS 3 (effective 2019)</strong>: Added 4 phthalates (DEHP, BBP, DBP, DIBP) to restricted list.</p>
<p><strong>For protective cases</strong>: Plastic enclosures (PP, ABS, PP+GF) are typically compliant. Risk areas: paint, printing, anti-static coating, metal hardware (zinc, lead-containing plating).</p>

<h2>REACH (EU Chemicals Regulation) 2026</h2>
<p><strong>Scope</strong>: All chemical substances used in products imported to EU, regardless of industry.</p>
<p><strong>SVHC (Substances of Very High Concern)</strong>: 235 substances (as of 2026, ECHA updates 2x/year). Manufacturers/importers must communicate if SVHC > 0.1% by weight.</p>
<p><strong>For protective cases</strong>:</p>
<ul>
<li>Most common SVHCs to check: phthalates (plasticizers), brominated flame retardants, lead chromate (yellow pigments)</li>
<li>Standard PP/ABS/PP+GF pellets: typically SVHC-free</li>
<li>Custom colors and additives require testing</li>
<li>Anti-static coating may contain SVHCs (verify per material)</li>
</ul>

<h2>Testing & Certification Process</h2>
<p><strong>For B2B protective cases</strong>:</p>
<ol>
<li><strong>Material testing</strong>: Test plastic pellets, colorants, additives for 10 ROHS + 235 SVHC substances. Test by accredited lab (SGS, TUV Rheinland, BV, Intertek). Cost: $500-1,500 per material formulation. Lead time: 5-15 days.</li>
<li><strong>Final product testing</strong>: XRF screening for heavy metals + solvent extraction for phthalates. Cost: $300-800 per sample. Lead time: 3-7 days.</li>
<li><strong>Certificate issuance</strong>: Lab issues ROHS certificate + REACH SVHC declaration. Validity: 1-3 years depending on material change.</li>
<li><strong>Ongoing monitoring</strong>: ECHA updates SVHC list 2x/year. Re-test if formulation changes or SVHC list adds relevant substances.</li>
</ol>

<h2>Regional Variations (2026)</h2>
<table border="1">
<thead><tr><th>Region</th><th>Standard</th><th>Threshold</th><th>Certification Required</th></tr></thead>
<tbody>
<tr><td>European Union</td><td>ROHS 3 + REACH</td><td>ROHS 0.1% / REACH 0.1% SVHC</td><td>CE marking, Declaration of Conformity</td></tr>
<tr><td>USA</td><td>ROHS-like (CA, NY, NJ state laws)</td><td>0.1% (4 phthalates)</td><td>State-specific labeling</td></tr>
<tr><td>China</td><td>GB/T 26572 (ROHS equivalent)</td><td>0.1%</td><td>China RoHS marking</td></tr>
<tr><td>Japan</td><td>JIS C 0950</td><td>0.1%</td><td>J-MOSS marking</td></tr>
<tr><td>South Korea</td><td>Korean RoHS</td><td>0.1%</td><td>KCC marking</td></tr>
<tr><td>California</td><td>Proposition 65</td><td>Specific SVHCs</td><td>Warning label</td></tr>
</tbody>
</table>

<h2>Documentation Required for B2B Orders</h2>
<ol>
<li><strong>Material Safety Data Sheet (MSDS/SDS)</strong>: For all plastic pellets, colorants, additives</li>
<li><strong>ROHS Test Report</strong>: From accredited lab, dated within 24 months</li>
<li><strong>REACH SVHC Declaration</strong>: Self-declaration + supporting lab reports</li>
<li><strong>Declaration of Conformity (CE)</strong>: For EU sales, signed by manufacturer/importer</li>
<li><strong>Test reports (batch-level)</strong>: For orders 5,000+ units, optional batch-level testing</li>
</ol>

<h2>Common Non-Compliance Issues</h2>
<ol>
<li><strong>Paint/coating</strong>: Yellow pigments may contain lead chromate. Verify with supplier or use lead-free alternatives.</li>
<li><strong>Anti-static foam</strong>: Some anti-static additives contain SVHCs. Verify with foam supplier.</li>
<li><strong>Metal hardware</strong>: Zinc plating may contain hexavalent chromium. Specify RoHS-compliant plating (trivalent chromium or zinc-nickel).</li>
<li><strong>Recycled materials</strong>: Recycled PP/ABS may contain legacy contaminants. Test thoroughly.</li>
<li><strong>Adhesives</strong>: Foam-to-case adhesives may contain phthalates. Specify low-VOC, phthalate-free adhesives.</li>
</ol>

<h2>Supplier Audit Checklist</h2>
<p>When auditing suppliers for compliance:</p>
<ul>
<li>✓ ROHS test report dated within 24 months</li>
<li>✓ REACH SVHC declaration with supporting lab data</li>
<li>✓ Material SDS for all plastic formulations</li>
<li>✓ Manufacturing process documentation (no banned substances in production)</li>
<li>✓ Third-party lab audit (annual) for ongoing compliance</li>
<li>✓ Batch-level test report for orders 5,000+ units</li>
<li>✓ Recall/withdrawal policy if non-compliance found</li>
<li>✓ Insurance/liability coverage for compliance violations</li>
</ul>

<h2>Cost & Lead Time Summary</h2>
<table border="1">
<thead><tr><th>Test/Cert</th><th>Cost (USD)</th><th>Lead Time</th><th>Validity</th></tr></thead>
<tbody>
<tr><td>ROHS test (10 substances)</td><td>$300-800</td><td>3-7 days</td><td>Material change / 24 months</td></tr>
<tr><td>REACH SVHC screening (235 substances)</td><td>$500-1,500</td><td>5-15 days</td><td>ECHA update / 6 months</td></tr>
<tr><td>Full material SDS</td><td>$200-500</td><td>3-5 days</td><td>Formulation change</td></tr>
<tr><td>CE marking + Declaration</td><td>$1,000-3,000</td><td>7-14 days</td><td>Annual</td></tr>
</tbody>
</table>

<h2>KeXinMaterials Compliance</h2>
<ul>
<li>All standard materials: ROHS 3 compliant (tested annually)</li>
<li>REACH SVHC declaration available (updated semi-annually per ECHA)</li>
<li>ISO 9001, ISO 14001 certified manufacturing</li>
<li>Material SDS for all standard colors and additives</li>
<li>Free ROHS test report provided with orders 1,000+ units</li>
<li>Custom color testing: 7-day lead time, $300-500 per formulation</li>
</ul>

<h2>2026 Trend: Sustainability Compliance</h2>
<p>Beyond ROHS/REACH, 2026 buyers increasingly require:</p>
<ul>
<li>Recycled content documentation (30% recycled PP+GF as standard)</li>
<li>Carbon footprint declaration (per ISO 14064)</li>
<li>End-of-life recycling program (closed-loop for OEM orders)</li>
<li>Bio-based material options (sugarcane-based ABS, 8% premium)</li>
</ul>

<h2>Next Steps</h2>
<p>For ROHS/REACH test reports, REACH SVHC declaration, or compliance audit, email <a href="mailto:kexin@beeaa.com">kexin@beeaa.com</a> or WhatsApp <a href="https://wa.me/8613590555309">+86 13590555309</a>. We provide free ROHS test report with orders 1,000+ units, REACH SVHC declaration on request.</p>
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
    faq_json = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": "Is EVA or PE foam better for custom case inserts?" if lang == "en" else "EVA 还是 PE 海绵更适合定制防护箱内衬?", "acceptedAnswer": {"@type": "Answer", "text": "Depends on application. EVA is better for: camera, medical, electronics (higher density, custom laser-cut precision, aesthetic). PE is better for: tools, military, industrial (better tear strength, lower cost, wider temperature range). For most B2B cases under 50L with electronics, EVA is the default. For tools/military/heavy equipment, PE is better. Many premium cases use multi-layer foam: PE base layer + EVA top layer for best of both." if lang == "en" else "取决于应用。EVA 更适合: 相机, 医疗, 电子 (高密度, 定制激光切割精度, 美观)。PE 更适合: 工具, 军事, 工业 (更好撕裂强度, 更低成本, 更宽温度范围)。对于 50L 以下的 B2B 防护箱带电子设备,EVA 是默认。对于工具/军事/重型设备,PE 更好。许多高端防护箱使用多层海绵: PE 底层 + EVA 顶层,两者兼得。"}}, {"@type": "Question", "name": "How much does custom foam insert cost?" if lang == "en" else "定制海绵内衬多少钱?", "acceptedAnswer": {"@type": "Answer", "text": "Pluck foam (DIY): $5-15 per case, no setup fee. CNC-cut foam (standard shapes): $30-80 per case + $50-200 setup fee. CNC-cut foam (complex shapes): $80-200 per case + $200-500 setup fee. Custom molded foam (high precision): $150-400 per case + $1,000-3,000 setup fee. For orders 1,000+ units, setup fees amortize. PE foam is 20-30% cheaper than EVA. Lead time: 7-15 days for custom cut, 30 days for molded." if lang == "en" else "可挖海绵 (DIY): 每箱 $5-15,无设置费。CNC 切割海绵 (标准形状): 每箱 $30-80 + $50-200 设置费。CNC 切割海绵 (复杂形状): 每箱 $80-200 + $200-500 设置费。定制模具海绵 (高精度): 每箱 $150-400 + $1,000-3,000 设置费。对于 1,000+ 件订单,设置费摊销。PE 海绵比 EVA 便宜 20-30%。交付时间: 定制切割 7-15 天,模具成型 30 天。"}}]}

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
print("Cluster 7: EVA Foam vs PE Foam (EN + ZH)")
print("=" * 60)
for lang in ["en", "zh"]:
    html = make_cluster_html(CLUSTER_7, lang)
    if lang == "zh":
        out = DST_PAGES / "zh" / CLUSTER_7["path"] / "index.html"
    else:
        out = DST_PAGES / CLUSTER_7["path"] / "index.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding="utf-8")
    print(f"  [{lang}] {out.relative_to(ROOT)} ({len(html):,} bytes)")

print()
print("=" * 60)
print("Blog 7: ROHS REACH Compliance 2026 (EN + ZH)")
print("=" * 60)
for lang in ["en", "zh"]:
    html = make_blog_html(BLOG_7, lang)
    if lang == "zh":
        out = DST_PAGES / "zh" / BLOG_7["path"] / "index.html"
    else:
        out = DST_PAGES / BLOG_7["path"] / "index.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding="utf-8")
    print(f"  [{lang}] {out.relative_to(ROOT)} ({len(html):,} bytes)")

print("\nDONE: 1 cluster + 1 blog (4 files)")
