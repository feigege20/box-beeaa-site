#!/usr/bin/env python3
"""
V13 Phase 11: 1 cluster (Tactical vs Pelican) + 1 blog (Quality Control Process)
"""
import json
from pathlib import Path

ROOT = Path(r"C:\Users\Administrator\.minimax\workspace\box-beeaa-site")
DST_PAGES = ROOT / "dist-pages"

CLUSTER_5 = {
    "slug": "tactical-vs-pelican-case",
    "path": "guides/tactical-vs-pelican-case/",
    "title_en": "Tactical Case vs Pelican Case: B2B Comparison 2026",
    "title_zh": "战术箱 vs Pelican 防护箱: B2B 对比 2026",
    "subtitle_en": "Tactical-grade vs premium brand cases. Material, certification, cost, use cases for B2B buyers.",
    "subtitle_zh": "战术级 vs 高端品牌防护箱. 材料, 认证, 成本, B2B 买家使用场景.",
    "intro_en": "<p>Tactical cases and Pelican-style cases serve overlapping but distinct B2B markets. This guide compares 12 dimensions to help buyers choose the right premium case for military, industrial, or commercial applications.</p>",
    "intro_zh": "<p>战术防护箱和 Pelican 风格防护箱服务于重叠但不同的 B2B 市场。本指南比较 12 个维度,帮助买家为军事、工业或商业应用选择正确的高端防护箱。</p>",
    "table_en": [
        ["Property", "Tactical Case (KeXinMaterials)", "Pelican-Style Case (Premium Brand)", "Best For"],
        ["Material", "PP+GF (30% glass fiber)", "Polypropylene copolymer (proprietary)", "Both: high impact"],
        ["Drop Test", "1.5-2.4m onto concrete (26 drops)", "1.5-2.4m onto concrete (26 drops)", "Same MIL-STD-810H"],
        ["IP Rating", "IP67-IP68", "IP67-IP68 (varies by model)", "Same"],
        ["MIL-SPEC", "MIL-STD-810H, MIL-STD-461 optional", "MIL-STD-810H, MIL-STD-461 (some models)", "Both available"],
        ["Temperature Range", "-40 to +120°C", "-40 to +99°C (varies)", "Tactical: wider range"],
        ["Latches", "Steel quick-release or TSA lock", "Press & pull latch (Pelican trademark)", "Both: durable"],
        ["Pressure Valve", "Automatic, Goretex membrane", "Manual, automatic (varies by model)", "Tactical: standard"],
        ["Foam", "Custom CNC-cut + pluck foam", "Custom CNC + pluck foam", "Same"],
        ["Brand Recognition", "B2B / OEM white-label", "Strong B2C brand (Pelican, Storm, SKB)", "Tactical: OEM"],
        ["Price (USD, MOQ 100)", "$50-200", "$150-500", "Tactical: 50-70% lower"],
        ["Lead Time", "30-45 days custom", "60-90 days custom (many models)", "Tactical: faster"],
        ["Warranty", "2 years", "Lifetime (Pelican)", "Pelican: stronger"],
        ["MOQ", "100-500 units", "1-10 units (B2C), 100+ (B2B)", "Tactical: B2B friendly"],
    ],
    "table_zh": [
        ["性能", "战术箱 (KeXinMaterials)", "Pelican 风格 (高端品牌)", "最佳选择"],
        ["材料", "PP+GF (30% 玻璃纤维)", "聚丙烯共聚物 (专利)", "两者: 高冲击"],
        ["跌落测试", "1.5-2.4m 落混凝土 (26 次)", "1.5-2.4m 落混凝土 (26 次)", "相同 MIL-STD-810H"],
        ["IP 防护", "IP67-IP68", "IP67-IP68 (型号而异)", "相同"],
        ["MIL-SPEC", "MIL-STD-810H, MIL-STD-461 可选", "MIL-STD-810H, MIL-STD-461 (部分型号)", "两者均可"],
        ["温度范围", "-40 至 +120°C", "-40 至 +99°C (型号而异)", "战术: 更宽"],
        ["锁扣", "钢制快拆或 TSA 锁", "按压拉式锁扣 (Pelican 专利)", "两者: 耐用"],
        ["压力阀", "自动, Goretex 膜", "手动, 自动 (型号而异)", "战术: 标准"],
        ["海绵", "定制 CNC 切割 + 可挖海绵", "定制 CNC + 可挖海绵", "相同"],
        ["品牌认知", "B2B / OEM 白标", "强 B2C 品牌 (Pelican, Storm, SKB)", "战术: OEM"],
        ["价格 (USD, MOQ 100)", "$50-200", "$150-500", "战术: 低 50-70%"],
        ["交付时间", "30-45 天定制", "60-90 天定制 (多型号)", "战术: 更快"],
        ["保修", "2 年", "终身 (Pelican)", "Pelican: 强"],
        ["MOQ", "100-500 件", "1-10 件 (B2C), 100+ (B2B)", "战术: B2B 友好"],
    ],
}


BLOG_5 = {
    "slug": "quality-control-process-2026",
    "path": "blog/quality-control-process-2026/",
    "title": "Quality Control Process: IQC, IPQC, OQC for B2B Case Manufacturing 2026",
    "title_zh": "质量控制流程: B2B 防护箱制造的 IQC, IPQC, OQC 2026",
    "subtitle": "3-stage QC. AQL standards, defect rate benchmarks, supplier evaluation for B2B buyers.",
    "subtitle_zh": "3 阶段质量控制. AQL 标准, 缺陷率基准, B2B 买家供应商评估.",
    "date": "2026-08-30",
    "author": "KeXinMaterials QC Team",
    "intro": "<p>Quality control is the single most important factor in B2B case supply. This guide covers 3-stage QC (IQC, IPQC, OQC), AQL sampling standards, defect rate benchmarks, and supplier evaluation checklist for B2B buyers.</p>",
    "intro_zh": "<p>质量控制是 B2B 防护箱供应中最重要的因素。本指南涵盖 3 阶段质量控制 (IQC, IPQC, OQC)、AQL 抽样标准、缺陷率基准,以及 B2B 买家供应商评估清单。</p>",
    "body": """<h2>3-Stage Quality Control (IQC, IPQC, OQC)</h2>
<p>Industry-standard 3-stage QC process for B2B case manufacturing:</p>

<h3>Stage 1: IQC (Incoming Quality Control)</h3>
<p><strong>What</strong>: Inspect raw materials (PP, ABS, glass fiber, hardware) before production.</p>
<p><strong>Checks</strong>:</p>
<ul>
<li>Material COA (Certificate of Analysis) per batch</li>
<li>Melt flow index (MFI) test for PP/ABS (typical: 10-15 g/10min)</li>
<li>Density verification (PP: 0.90-0.92 g/cm³)</li>
<li>Tensile strength sample test (PP: 30-40 MPa)</li>
<li>Color match (Pantone vs actual)</li>
<li>Hardware visual inspection (latches, hinges, valves)</li>
</ul>
<p><strong>AQL</strong>: 1.0 (ISO 2859-1, General Inspection Level II)</p>
<p><strong>Frequency</strong>: 100% of incoming batches (every container, every truckload)</p>
<p><strong>Defect rate target</strong>: < 0.5%</p>

<h3>Stage 2: IPQC (In-Process Quality Control)</h3>
<p><strong>What</strong>: Inspect during production at each major step.</p>
<p><strong>Checks</strong>:</p>
<ul>
<li>First-off inspection (first 5-10 pieces after mold setup)</li>
<li>Visual: flash, warping, sink marks, weld lines, color consistency</li>
<li>Dimensional: ±0.5mm critical dimensions (latch position, hinge alignment, foam slot)</li>
<li>Functional: latch operation, hinge swing, valve pressure</li>
<li>IP rating spot test: 5% of batch immersion test</li>
</ul>
<p><strong>AQL</strong>: 1.5 (ISO 2859-1, General Inspection Level II)</p>
<p><strong>Frequency</strong>: Every 1-2 hours during production, every 100-200 pieces</p>
<p><strong>Defect rate target</strong>: < 1.0% (during production), < 0.4% (post-process)</p>

<h3>Stage 3: OQC (Outgoing Quality Control)</h3>
<p><strong>What</strong>: Final inspection before shipment.</p>
<p><strong>Checks</strong>:</p>
<ul>
<li>Visual: 100% inspection for cosmetic defects</li>
<li>Dimensional: AQL 1.5 sampling for critical dimensions</li>
<li>Functional: 100% latch/hinge/valve operation</li>
<li>IP rating: 1-2% sample test (per batch)</li>
<li>Drop test: 1-2% sample (1.5m onto concrete)</li>
<li>Packaging: drop test, label accuracy, weight</li>
<li>Documentation: COA, test report, batch traceability</li>
</ul>
<p><strong>AQL</strong>: 1.5 (ISO 2859-1, General Inspection Level II)</p>
<p><strong>Frequency</strong>: 100% visual + AQL sampling for other checks</p>
<p><strong>Defect rate target</strong>: < 0.4% (overall, including all stages)</p>

<h2>AQL Standards Explained</h2>
<p>AQL (Acceptable Quality Level) is the maximum percentage of defective items considered acceptable in a sample. Industry-standard AQL for protective cases:</p>
<table border="1">
<thead><tr><th>Defect Type</th><th>AQL Level</th><th>Acceptance (per 1000)</th><th>Common Use</th></tr></thead>
<tbody>
<tr><td>Critical (safety, function)</td><td>0.10</td><td>1 piece</td><td>Pressure valve failure, structural crack</td></tr>
<tr><td>Major (visible defect)</td><td>1.0</td><td>10 pieces</td><td>Flash, warping, color mismatch</td></tr>
<tr><td>Minor (cosmetic)</td><td>2.5</td><td>25 pieces</td><td>Small scratch, slight color variation</td></tr>
<tr><td>Overall (combined)</td><td>1.5</td><td>15 pieces</td><td>All defects combined</td></tr>
</tbody>
</table>
<p>For B2B case orders, demand AQL 1.5 overall with 0% critical defects.</p>

<h2>Defect Rate Benchmarks (2026)</h2>
<table border="1">
<thead><tr><th>Quality Tier</th><th>Defect Rate</th><th>Example Factories</th><th>Price Range (USD, 30L case, MOQ 100)</th></tr></thead>
<tbody>
<tr><td>Premium (lifetime warranty)</td><td>< 0.1%</td><td>Pelican, SKB, Storm</td><td>$200-500</td></tr>
<tr><td>High-quality B2B</td><td>0.1-0.4%</td><td>Top 10% China factories (incl. KeXinMaterials)</td><td>$50-150</td></tr>
<tr><td>Mid-tier B2B</td><td>0.5-1.0%</td><td>Average China factories</td><td>$30-80</td></tr>
<tr><td>Budget</td><td>1.0-2.5%</td><td>Trading companies, low-end factories</td><td>$15-40</td></tr>
<tr><td>Reject</td><td>> 2.5%</td><td>Quality issues unacceptable</td><td>—</td></tr>
</tbody>
</table>

<h2>How to Verify Supplier QC (5 Steps)</h2>
<ol>
<li><strong>Request QC documentation</strong>: ISO 9001 cert, IQC/IPQC/OQC process docs, AQL standards, defect rate data (last 6-12 months).</li>
<li><strong>Visit factory or hire 3rd-party inspector</strong>: SGS, BV, AsiaInspection for in-person QC verification ($500-2,000 per audit).</li>
<li><strong>Order pre-production sample (T0/T1/T2/T3)</strong>: Free standard samples + paid custom samples ($50-200 each). Inspect 100% before mass production approval.</li>
<li><strong>Production monitoring</strong>: Request daily production photos, weekly QC reports, AQL inspection reports per batch.</li>
<li><strong>Pre-shipment inspection (PSI)</strong>: Hire 3rd-party inspector to inspect finished goods before shipment. Standard for orders 1,000+ units or $20K+ value.</li>
</ol>

<h2>Common Defects in B2B Cases</h2>
<table border="1">
<thead><tr><th>Defect Type</th><th>Frequency</th><th>Cause</th><th>Prevention</th></tr></thead>
<tbody>
<tr><td>Flash (excess material)</td><td>3-5%</td><td>Mold wear, improper clamping force</td><td>Regular mold maintenance, AQL check</td></tr>
<tr><td>Warping</td><td>1-3%</td><td>Uneven cooling, residual stress</td><td>Optimized cooling channels, annealing</td></tr>
<tr><td>Sink marks</td><td>1-2%</td><td>Thick wall sections, insufficient packing</td><td>Uniform wall thickness, proper packing</td></tr>
<tr><td>Weld lines</td><td>5-10%</td><td>Material flow meeting at mold intersection</td><td>Gate location optimization</td></tr>
<tr><td>Color mismatch</td><td>1-2%</td><td>Material batch variation, color drift</td><td>Pantone matching, batch testing</td></tr>
<tr><td>Latch failure</td><td>0.5-1%</td><td>Improper assembly, spring fatigue</td><td>100% latch function test</td></tr>
<tr><td>Foam mis-cut</td><td>2-5%</td><td>CNC drift, design error</td><td>First article approval, design freeze</td></tr>
</tbody>
</table>

<h2>Defect Resolution Process</h2>
<p>When defects are found post-delivery:</p>
<ol>
<li>Document defects: photos, batch number, quantity affected</li>
<li>Notify supplier within 7 days of receipt (B2B standard)</li>
<li>Supplier investigates: root cause analysis, batch traceability</li>
<li>Resolution options: replacement, credit, refund (negotiate per contract)</li>
<li>Corrective action: supplier updates process to prevent recurrence</li>
</ol>
<p>Standard B2B warranty: 2-year coverage for manufacturing defects, 1-year for hardware.</p>

<h2>KeXinMaterials QC Process</h2>
<ul>
<li>ISO 9001:2015 certified quality management</li>
<li>3-stage QC: IQC, IPQC, OQC with documented procedures</li>
<li>AQL 1.5/2.5 (ISO 2859-1, General Inspection Level II)</li>
<li>2024 defect rate: 0.4% (industry-leading for tier-2 pricing)</li>
<li>2-year warranty, 100% replacement for manufacturing defects</li>
<li>Weekly QC report available on request for orders 1,000+ units</li>
<li>Customer QC visits welcome (Shenzhen/Ningbo factory)</li>
<li>3rd-party inspection coordination (SGS, BV, AsiaInspection)</li>
</ul>

<h2>Buyer QC Checklist</h2>
<p>Before placing order:</p>
<ul>
<li>✓ ISO 9001 certification (verified)</li>
<li>✓ AQL standards documented</li>
<li>✓ Defect rate benchmark (last 6-12 months)</li>
<li>✓ Pre-shipment sample approval (T2/T3)</li>
<li>✓ Production monitoring plan agreed</li>
<li>✓ PSI (pre-shipment inspection) arranged for orders 1,000+</li>
<li>✓ Warranty terms (2-year minimum)</li>
<li>✓ Defect resolution process documented</li>
</ul>

<h2>Next Steps</h2>
<p>For KeXinMaterials QC documentation, sample test reports, or 3rd-party audit coordination, email <a href="mailto:kexin@beeaa.com">kexin@beeaa.com</a> or WhatsApp <a href="https://wa.me/8613590555309">+86 13590555309</a>. We provide free QC report samples and 3 free standard samples for evaluation.</p>
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
    faq_json = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": "Is a tactical case as good as a Pelican case?" if lang == "en" else "战术箱和 Pelican 一样好吗?", "acceptedAnswer": {"@type": "Answer", "text": "For 90% of B2B applications, yes. Tactical cases from quality factories meet the same MIL-STD-810H, IP67/IP68, and drop test standards as Pelican. Pelican has stronger B2C brand recognition and lifetime warranty. Tactical offers 50-70% lower pricing, 30-45 day lead time (vs 60-90), and 2-year warranty. Choose Pelican for consumer retail, tactical for B2B/OEM where cost matters more than brand." if lang == "en" else "对于 90% 的 B2B 应用,是的。高质量工厂的战术箱达到与 Pelican 相同的 MIL-STD-810H、IP67/IP68 和跌落测试标准。Pelican 在 B2C 品牌认知和终身保修方面更强。战术箱价格低 50-70%, 交付时间 30-45 天 (对比 60-90), 2 年保修。消费零售选 Pelican, B2B/OEM (成本比品牌更重要) 选战术箱。"}}, {"@type": "Question", "name": "What's the most important factor when choosing between tactical and Pelican-style cases?" if lang == "en" else "战术 vs Pelican 风格选择时最重要的因素是什么?", "acceptedAnswer": {"@type": "Answer", "text": "Application scenario. For retail/B2C where brand matters, choose Pelican. For B2B/OEM where cost and lead time matter, choose tactical. For military/aerospace where certifications and traceability matter, both work. For high-volume (5,000+ units/year) where tooling cost amortizes, custom tactical is best. For low-volume (under 1,000 units/year) with specific features, Pelican standard SKUs may be more cost-effective." if lang == "en" else "应用场景。零售/B2C 品牌重要选 Pelican。B2B/OEM 成本和交付时间重要选战术箱。军事/航空航天 认证和可追溯性重要,两者都可。高产量 (5,000+ 件/年) 模具成本摊销,定制战术箱最佳。低产量 (1,000 件/年以下) 特定功能,Pelican 标准 SKU 可能更具成本效益。"}}]}

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
print("Cluster 5: Tactical vs Pelican Case (EN + ZH)")
print("=" * 60)
for lang in ["en", "zh"]:
    html = make_cluster_html(CLUSTER_5, lang)
    if lang == "zh":
        out = DST_PAGES / "zh" / CLUSTER_5["path"] / "index.html"
    else:
        out = DST_PAGES / CLUSTER_5["path"] / "index.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding="utf-8")
    print(f"  [{lang}] {out.relative_to(ROOT)} ({len(html):,} bytes)")

print()
print("=" * 60)
print("Blog 5: Quality Control Process (EN + ZH)")
print("=" * 60)
for lang in ["en", "zh"]:
    html = make_blog_html(BLOG_5, lang)
    if lang == "zh":
        out = DST_PAGES / "zh" / BLOG_5["path"] / "index.html"
    else:
        out = DST_PAGES / BLOG_5["path"] / "index.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding="utf-8")
    print(f"  [{lang}] {out.relative_to(ROOT)} ({len(html):,} bytes)")

print("\nDONE: 1 cluster + 1 blog (4 files)")
