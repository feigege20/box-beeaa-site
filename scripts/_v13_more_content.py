#!/usr/bin/env python3
"""
V13: 1 new cluster (ATA 300 vs MIL-SPEC) + 1 new blog (Quick Quote Process)
Phase 10 内容扩展, cache clear 后立即可用
"""
import json
import re
from pathlib import Path

ROOT = Path(r"C:\Users\Administrator\.minimax\workspace\box-beeaa-site")
DST_PAGES = ROOT / "dist-pages"


# ============= CLUSTER 3: ATA 300 vs MIL-SPEC =============
CLUSTER_3 = {
    "slug": "ata-300-vs-mil-spec",
    "path": "guides/ata-300-vs-mil-spec/",
    "title_en": "ATA 300 vs MIL-SPEC: Transit Case Standards Compared 2026",
    "title_zh": "ATA 300 vs MIL-SPEC: 运输箱标准对比 2026",
    "subtitle_en": "ATA 300 Category 1 vs MIL-STD-810H. Drop, vibration, dust, water. Use case recommendations.",
    "subtitle_zh": "ATA 300 Cat 1 vs MIL-STD-810H. 跌落, 振动, 灰尘, 水. 使用场景建议.",
    "intro_en": "<p>ATA 300 and MIL-SPEC are the two most common standards for protective transit cases. This guide compares their test methods, costs, and use cases to help B2B buyers choose the right standard.</p>",
    "intro_zh": "<p>ATA 300 和 MIL-SPEC 是防护运输箱最常用的两个标准。本指南对比其测试方法、成本和使用场景,帮助 B2B 买家选择正确的标准。</p>",
    "table_en": [
        ["Standard", "ATA 300 Category 1", "MIL-STD-810H Method 514.8", "Best For"],
        ["Issuing Body", "Air Transport Association (US)", "US Department of Defense", "ATA: commercial; MIL-SPEC: military"],
        ["Test Scope", "12 tests: drop, vibration, dust, water, heat, cold", "30+ methods: drop, vibration, humidity, sand, immersion, etc.", "MIL-SPEC: extreme conditions"],
        ["Drop Test", "1.2m onto concrete, 6 faces, 3 edges, 1 corner", "1.5-2.4m, 26 drops, 40G shock", "MIL-SPEC: heavier equipment"],
        ["Vibration Test", "1 hour sweep, 5-200 Hz, 1.5G peak", "60 min per axis, 5-500 Hz, 2.5G peak + random", "MIL-SPEC: long transport"],
        ["Dust Test", "6 hours, 25 mph wind", "Method 510.7: 6 hours, 25 mph wind + 90 min settling", "Same"],
        ["Water Test", "1 hour spray from each side", "Method 506.5: 40 min drip, 10 min spray, ice", "MIL-SPEC: heavy rain"],
        ["Temperature", "Operating: -20 to +60°C", "Method 501/502: -40 to +70°C, 3 cycles", "MIL-SPEC: arctic/desert"],
        ["Cycle Life", "12 round trips (~24 flights)", "Designed for indefinite field use", "ATA: rental; MIL-SPEC: long-term"],
        ["Cost Premium (vs IP67)", "+30-50%", "+100-200%", "ATA: mid; MIL-SPEC: premium"],
        ["Test Cost", "$3,000-5,000 (accredited lab)", "$10,000-25,000 (accredited lab)", "ATA: affordable; MIL-SPEC: expensive"],
        ["Test Duration", "4-6 weeks", "8-12 weeks", "ATA: faster"],
        ["Common Industries", "Music/AV rental, broadcast, photography, exhibition", "Military, aerospace, government, defense contractors", "ATA: commercial; MIL-SPEC: military"],
        ["Certifying Bodies", "SGS, TUV Rheinland, BV, Intertek (ATA)", "Same labs (MIL-SPEC)", "Both widely accepted"],
    ],
    "table_zh": [
        ["标准", "ATA 300 Category 1", "MIL-STD-810H Method 514.8", "最佳选择"],
        ["发布机构", "美国航空运输协会", "美国国防部", "ATA: 商业; MIL-SPEC: 军事"],
        ["测试范围", "12 项测试: 跌落, 振动, 灰尘, 水, 热, 冷", "30+ 方法: 跌落, 振动, 湿度, 沙, 浸没等", "MIL-SPEC: 极端条件"],
        ["跌落测试", "1.2m 落混凝土, 6 面, 3 边, 1 角", "1.5-2.4m, 26 次跌落, 40G 冲击", "MIL-SPEC: 重型设备"],
        ["振动测试", "1 小时扫描, 5-200 Hz, 1.5G 峰值", "每轴 60 分钟, 5-500 Hz, 2.5G 峰值 + 随机", "MIL-SPEC: 长途运输"],
        ["灰尘测试", "6 小时, 25 mph 风速", "方法 510.7: 6 小时, 25 mph 风速 + 90 分钟沉降", "相同"],
        ["水测试", "每侧 1 小时喷洒", "方法 506.5: 40 分钟滴, 10 分钟喷, 冰", "MIL-SPEC: 大雨"],
        ["温度", "操作: -20 至 +60°C", "方法 501/502: -40 至 +70°C, 3 个循环", "MIL-SPEC: 极地/沙漠"],
        ["循环寿命", "12 个往返 (约 24 个航班)", "设计为无限期野外使用", "ATA: 租赁; MIL-SPEC: 长期"],
        ["成本溢价 (vs IP67)", "+30-50%", "+100-200%", "ATA: 中; MIL-SPEC: 高"],
        ["测试成本", "$3,000-5,000 (认证实验室)", "$10,000-25,000 (认证实验室)", "ATA: 实惠; MIL-SPEC: 昂贵"],
        ["测试周期", "4-6 周", "8-12 周", "ATA: 更快"],
        ["常见行业", "音乐/AV 租赁, 广播, 摄影, 展览", "军事, 航空航天, 政府, 国防承包商", "ATA: 商业; MIL-SPEC: 军事"],
        ["认证机构", "SGS, TUV Rheinland, BV, Intertek (ATA)", "相同实验室 (MIL-SPEC)", "两者均广泛认可"],
    ],
}

# ============= BLOG 3: Quick Quote Process =============
BLOG_3_NEW = {
    "slug": "quick-quote-process-2026",
    "path": "blog/quick-quote-process-2026/",
    "title": "Quick Quote Process: How to Get a Protective Case Quote in 24 Hours",
    "title_zh": "快速报价流程: 24 小时内获得防护箱报价",
    "subtitle": "5-step quote process. Required info, expected response time, common pitfalls, sample cost breakdown.",
    "subtitle_zh": "5 步报价流程. 必要信息, 预期响应时间, 常见陷阱, 示例成本拆解.",
    "date": "2026-08-30",
    "author": "KeXinMaterials Sales Team",
    "intro": "<p>Getting a fast, accurate quote for custom protective cases requires preparation. This guide covers the 5-step process, the 7 required pieces of information, expected response time, and common pitfalls to avoid for B2B buyers.</p>",
    "intro_zh": "<p>获得快速准确的定制防护箱报价需要准备。本指南涵盖 5 步流程,7 项必要信息,预期响应时间,以及 B2B 买家应避免的常见陷阱。</p>",
    "body": """<h2>5-Step Quote Process (24 Hours Total)</h2>
<ol>
<li><strong>Step 1: Initial inquiry (10 min)</strong> — Email sales@beeaa.com or WhatsApp with project basics. Expect auto-reply within 1 hour.</li>
<li><strong>Step 2: Specification clarification (1-4 hours)</strong> — Sales engineer asks follow-up questions about application, environment, quantity, target price.</li>
<li><strong>Step 3: Quotation preparation (4-12 hours)</strong> — Sales + engineering team prepares detailed quote with cost breakdown, lead time, MOQ, payment terms.</li>
<li><strong>Step 4: Quote delivery (within 12 hours of complete info)</strong> — Formal PDF quote via email with all commercial terms, technical specs, sample cost breakdown.</li>
<li><strong>Step 5: Negotiation & sample (3-7 days)</strong> — Buyer reviews quote, may request samples ($50-200 + shipping), negotiates terms, signs PI.</li>
</ol>
<p>Total time from initial inquiry to PI signing: typically 3-7 days for standard SKUs, 7-14 days for custom OEM.</p>

<h2>7 Required Pieces of Information</h2>
<p>To get an accurate quote in 24 hours, prepare these 7 items:</p>
<ol>
<li><strong>Product application</strong> — What equipment or items will the case protect? Use case (transport, storage, display)?</li>
<li><strong>Internal dimensions</strong> — L × W × H in mm or cm. Allow 30-50mm foam padding on each side.</li>
<li><strong>Quantity</strong> — First order quantity (sample + production) and estimated annual volume.</li>
<li><strong>Material preference</strong> — PP, ABS, PP+GF, aluminum, soft case? Cost vs durability tradeoffs.</li>
<li><strong>IP / MIL-SPEC rating</strong> — IP54, IP67, IP68, MIL-STD-810H? Affects material + cost.</li>
<li><strong>Customization</strong> — Custom foam, color, branding, hardware? Most customizations require 500+ MOQ.</li>
<li><strong>Target delivery date + destination port</strong> — For shipping cost + lead time calculation.</li>
</ol>

<h2>Common Pitfalls to Avoid</h2>
<p><strong>Pitfall 1</strong>: Vague specifications ("I need a case for my drone"). Always include: drone model, accessories, foam design preferences, transport mode.</p>
<p><strong>Pitfall 2</strong>: Hidden requirements. Mention: temperature extremes, chemical exposure, EMI shielding, custom branding, certifications needed.</p>
<p><strong>Pitfall 3</strong>: Unrealistic timeline. Standard lead time is 30-45 days. Rush orders (15-20 days) add 15-20% premium.</p>
<p><strong>Pitfall 4</strong>: Comparing only unit price. Include: tooling, samples, shipping, duties, payment terms, warranty, defect policy.</p>
<p><strong>Pitfall 5</strong>: No budget range. "As cheap as possible" doesn't help. Better: "$50-80 per unit acceptable for 1,000 units".</p>

<h2>Sample Cost Breakdown (1,000 units custom waterproof case)</h2>
<table border="1">
<thead><tr><th>Component</th><th>Cost (USD)</th><th>% of Total</th><th>Notes</th></tr></thead>
<tbody>
<tr><td>Raw material (PP+GF)</td><td>$8,500</td><td>21%</td><td>8.5 kg/unit × $1/kg</td></tr>
<tr><td>Manufacturing (labor + overhead)</td><td>$12,000</td><td>30%</td><td>$12/unit standard</td></tr>
<tr><td>Custom foam (CNC-cut)</td><td>$5,000</td><td>12%</td><td>$5/unit, 1 setup $500</td></tr>
<tr><td>Hardware (latches, hinges, valve)</td><td>$3,000</td><td>7%</td><td>$3/unit, 5 components</td></tr>
<tr><td>Tooling (custom mold amortized)</td><td>$4,000</td><td>10%</td><td>$4,000 / 1,000 units = $4/unit</td></tr>
<tr><td>QA + testing (IP67, SGS)</td><td>$1,500</td><td>4%</td><td>$1,500 setup + $1/unit test</td></tr>
<tr><td>Packaging</td><td>$1,000</td><td>2%</td><td>Carton + foam wrap</td></tr>
<tr><td>Logistics (EXW Shenzhen)</td><td>$0</td><td>0%</td><td>Buyer arranges</td></tr>
<tr><td>Margin (15% for factory)</td><td>$5,250</td><td>13%</td><td>Standard B2B margin</td></tr>
<tr><td><strong>Total (EXW)</strong></td><td><strong>$40,250</strong></td><td>100%</td><td><strong>$40.25/unit</strong></td></tr>
<tr><td>+ Ocean freight (40HQ to LA)</td><td>$4,800</td><td>—</td><td>$4.80/unit (FOB $45.05)</td></tr>
<tr><td>+ Insurance + CIF (LA port)</td><td>$5,000</td><td>—</td><td>$5.00/unit (CIF $45.25)</td></tr>
<tr><td>+ US import duty (5% HTS 4202)</td><td>$2,260</td><td>—</td><td>$2.26/unit landed</td></tr>
<tr><td><strong>Landed cost (LA warehouse)</strong></td><td><strong>$47.51/unit</strong></td><td>—</td><td>Total delivered</td></tr>
</tbody>
</table>

<h2>What to Expect in the Quote (PDF)</h2>
<p>A professional quote should include:</p>
<ol>
<li>Header: company name, contact, date, quote validity (30 days standard)</li>
<li>Product description + reference image</li>
<li>Specifications: material, dimensions, weight, IP rating, color</li>
<li>Quantity tiers: pricing for MOQ, mid-tier, high-volume</li>
<li>Tooling cost: amortized or one-time</li>
<li>Lead time: sample + production + shipping</li>
<li>Payment terms: T/T 30% deposit, 70% before shipment (standard)</li>
<li>Incoterms: EXW/FOB/CIF options with cost</li>
<li>Validity: 30 days price lock</li>
<li>Warranty: 2-year coverage terms</li>
<li>Test certificates: ISO 9001, ROHS, IP67, MIL-SPEC if applicable</li>
</ol>

<h2>How to Evaluate Multiple Quotes</h2>
<p>When comparing 3-5 factory quotes, score on these 10 criteria (weighted):</p>
<ol>
<li>Total landed cost (25%)</li>
<li>Lead time to first delivery (15%)</li>
<li>Quality certifications (15%)</li>
<li>Communication responsiveness (10%)</li>
<li>Sample quality (10%)</li>
<li>Warranty terms (5%)</li>
<li>Payment flexibility (5%)</li>
<li>Capacity (5%)</li>
<li>Export experience (5%)</li>
<li>References/reviews (5%)</li>
</ol>
<p>Don't auto-pick the lowest price. Often 10-15% higher cost = 50% better quality + 20% faster delivery = better ROI.</p>

<h2>KeXinMaterials Quote Process</h2>
<p>Our standard quote process:</p>
<ul>
<li>Initial inquiry: 1-hour response time (business hours Asia)</li>
<li>Specification clarification: 1-4 hours via WhatsApp/email/Zoom</li>
<li>Detailed quote: 4-12 hours with cost breakdown PDF</li>
<li>Free 3 standard samples (freight collect) for evaluation</li>
<li>Custom sample: 7-10 days, $50-200 (refundable on $10K+ order)</li>
<li>30-day quote validity</li>
</ul>
<p>Email <a href="mailto:kexin@beeaa.com">kexin@beeaa.com</a> or WhatsApp <a href="https://wa.me/8613590555309">+86 13590555309</a> to start.</p>

<h2>About KeXinMaterials</h2>
<p>KeXinMaterials (Guangdong) Co., Ltd. is a source factory for 9 product lines of protective cases. 18,000㎡ facility, 60+ machines, 20+ patents, ISO9001/ROHS/CE certified. OEM/ODM since 2014, exporting to 50+ countries. EXW Shenzhen / FOB Ningbo / CIF to 30+ major ports. 30-45 day lead time, 2-year warranty, 0.4% defect rate (2024).</p>
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
    faq_json = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": "What's the cost difference between ATA 300 and MIL-SPEC?" if lang == "en" else "ATA 300 和 MIL-SPEC 之间的成本差异?", "acceptedAnswer": {"@type": "Answer", "text": "ATA 300 adds 30-50% to base IP67 cost. MIL-STD-810H adds 100-200% to base. ATA 300 testing is $3,000-5,000 in 4-6 weeks. MIL-SPEC testing is $10,000-25,000 in 8-12 weeks. Choose based on use case: ATA for commercial/rental, MIL-SPEC for military/aerospace." if lang == "en" else "ATA 300 比基础 IP67 高 30-50%。MIL-STD-810H 高 100-200%。ATA 300 测试 $3,000-5,000 / 4-6 周。MIL-SPEC 测试 $10,000-25,000 / 8-12 周。根据使用场景选择: ATA 用于商业/租赁, MIL-SPEC 用于军事/航空航天。"}}, {"@type": "Question", "name": "Do I need both ATA 300 and MIL-SPEC?" if lang == "en" else "我需要同时 ATA 300 和 MIL-SPEC 吗?", "acceptedAnswer": {"@type": "Answer", "text": "Rarely. Most cases only need one standard. Choose ATA 300 for commercial air freight or rental fleets. Choose MIL-SPEC for military, aerospace, or extreme environment. If you ship via multiple modes (air + ground + sea), MIL-SPEC provides broader coverage. Budget is usually the deciding factor." if lang == "en" else "很少。大多数箱只需要一个标准。商业空运或租赁选择 ATA 300。军事、航空航天或极端环境选择 MIL-SPEC。如果通过多种方式运输 (空+陆+海), MIL-SPEC 提供更广泛的覆盖。预算通常是决定因素。"}}]}

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


# ============= Write cluster EN + ZH =============
print("=" * 60)
print("Cluster 3: ATA 300 vs MIL-SPEC (EN + ZH)")
print("=" * 60)

for lang in ["en", "zh"]:
    html = make_cluster_html(CLUSTER_3, lang)
    if lang == "zh":
        out = DST_PAGES / "zh" / CLUSTER_3["path"] / "index.html"
    else:
        out = DST_PAGES / CLUSTER_3["path"] / "index.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding="utf-8")
    print(f"  [{lang}] {out.relative_to(ROOT)} ({len(html):,} bytes)")


# ============= Write blog EN + ZH =============
print()
print("=" * 60)
print("Blog 3: Quick Quote Process (EN + ZH)")
print("=" * 60)

for lang in ["en", "zh"]:
    html = make_blog_html(BLOG_3_NEW, lang)
    if lang == "zh":
        out = DST_PAGES / "zh" / BLOG_3_NEW["path"] / "index.html"
    else:
        out = DST_PAGES / BLOG_3_NEW["path"] / "index.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding="utf-8")
    print(f"  [{lang}] {out.relative_to(ROOT)} ({len(html):,} bytes)")


print()
print("=" * 60)
print("DONE: V13 Phase 10 - 1 cluster + 1 blog (4 files)")
print("=" * 60)
