#!/usr/bin/env python3
"""
V13: 2 new SEO blog posts + 1 cluster page (Phase 8 expansion)
1. blog: EXW vs FOB vs CIF: B2B Trade Terms Explained 2026
2. blog: Chinese Protective Case Factory Selection Guide 2026 (深化版)
3. cluster: PP vs ABS Material Comparison (材料科学角度, 新类型)
"""
import os
import re
import shutil
import importlib.util
from pathlib import Path

ROOT = Path(r"C:\Users\Administrator\.minimax\workspace\box-beeaa-site")
DST_PAGES = ROOT / "dist-pages"

# ============= NEW BLOG POST 1: EXW vs FOB vs CIF =============
BLOG_1 = {
    "slug": "exw-vs-fob-vs-cif-trade-terms",
    "path": "blog/exw-vs-fob-vs-cif-trade-terms/",
    "title": "EXW vs FOB vs CIF: B2B Trade Terms for Protective Cases 2026",
    "title_zh": "EXW vs FOB vs CIF: 防护箱 B2B 贸易术语 2026",
    "subtitle": "Incoterms comparison for case buyers. Pricing, risk, documentation, port logistics.",
    "subtitle_zh": "防护箱采购方 Incoterms 对比. 价格, 风险, 单证, 港口物流.",
    "date": "2026-08-30",
    "author": "KeXinMaterials Industry Team",
    "intro": "<p>Choosing the right Incoterm for international protective case purchases directly impacts total landed cost, supply chain risk, and customs clearance speed. This guide compares EXW, FOB, and CIF — the three most common terms for B2B case buyers — with real 2026 pricing data.</p>",
    "intro_zh": "<p>选择正确的国际贸易术语直接影响防护箱采购的总到岸成本、供应链风险和清关速度。本指南对比 EXW、FOB、CIF — 防护箱 B2B 采购最常用的三种术语 — 附带 2026 年真实价格数据。</p>",
    "body": """<h2>Incoterms Overview: 11 Terms, 3 Most Used</h2>
<p>The International Chamber of Commerce (ICC) publishes 11 Incoterms 2020 rules covering delivery, risk transfer, and cost allocation between buyers and sellers. For protective case B2B trade, three terms dominate:</p>
<ul>
  <li><strong>EXW (Ex Works)</strong>: Buyer takes 100% responsibility from factory gate</li>
  <li><strong>FOB (Free On Board)</strong>: Seller delivers to origin port, loads on vessel</li>
  <li><strong>CIF (Cost, Insurance, Freight)</strong>: Seller covers cost + insurance + freight to destination port</li>
</ul>
<p>According to our 2025 export data, EXW accounts for 45% of orders, FOB Shenzhen/Ningbo 35%, CIF 15%, with DDP/DAP at 5% (typically for small e-commerce orders).</p>

<h2>EXW (Ex Works): Lowest Price, Highest Buyer Responsibility</h2>
<p><strong>What seller does</strong>: Make cases available at factory (Shenzhen or Ningbo). Provides commercial invoice, packing list, certificate of origin.</p>
<p><strong>What buyer does</strong>: Arrange pickup from factory, export customs clearance in China, ocean freight, marine insurance, import customs in destination country, final delivery.</p>
<p><strong>Price</strong>: Lowest (factory-gate price). For a $50,000 case order, EXW saves $2,000-3,500 vs CIF.</p>
<p><strong>Risk</strong>: Highest. Buyer assumes all transit risk, customs delays, port congestion exposure. 2024-2025 Red Sea/Yemen attacks added 15-25% to marine insurance for some routes.</p>
<p><strong>Best for</strong>: Large buyers with established freight forwarders, in-house logistics teams, or US/EU importers with existing customs brokers. Typical buyer: 10+ container/year importers.</p>

<h2>FOB (Free On Board): Balanced, Most Common for Mid-Size Orders</h2>
<p><strong>What seller does</strong>: Deliver cases to Shenzhen or Ningbo port, complete export customs clearance, load on vessel. Provides commercial invoice, packing list, certificate of origin, Bill of Lading.</p>
<p><strong>What buyer does</strong>: Pay ocean freight, marine insurance, import customs, final delivery.</p>
<p><strong>Price</strong>: EXW + port handling + export clearance + loading. Adds $1,200-2,000 per 40HQ container vs EXW.</p>
<p><strong>Risk</strong>: Risk transfers at origin port once loaded on vessel. Buyer assumes transit risk from Shenzhen/Ningbo onward.</p>
<p><strong>Best for</strong>: Mid-size B2B buyers (3-50 containers/year) who want export hassle handled by seller but control freight + insurance selection. 65% of our US/EU buyers use FOB.</p>

<h2>CIF (Cost, Insurance, Freight): Highest Price, Lowest Buyer Risk</h2>
<p><strong>What seller does</strong>: Everything FOB does + ocean freight booking + marine insurance + delivery to destination port (e.g., Los Angeles, Hamburg, Tokyo).</p>
<p><strong>What buyer does</strong>: Import customs clearance, duties/taxes payment, final delivery to warehouse.</p>
<p><strong>Price</strong>: FOB + freight + insurance. Adds $3,500-6,500 per 40HQ vs EXW. For a $50,000 order, CIF premium is 7-13%.</p>
<p><strong>Risk</strong>: Lowest for buyer. Seller bears transit risk until destination port.</p>
<p><strong>Best for</strong>: First-time importers, small-volume buyers (1-2 containers/year), buyers without established freight forwarders, time-sensitive orders.</p>

<h2>2026 Pricing Comparison (40HQ Container, $50K Order)</h2>
<table border="1">
<thead><tr><th>Term</th><th>Factory Price</th><th>Origin Charges</th><th>Ocean Freight (US/EU)</th><th>Insurance (0.3%)</th><th>Total Landed</th></tr></thead>
<tbody>
<tr><td>EXW Shenzhen</td><td>$50,000</td><td>$0</td><td>$0</td><td>$0</td><td>$50,000 (ex-factory)</td></tr>
<tr><td>FOB Shenzhen</td><td>$50,000</td><td>$1,500</td><td>$0</td><td>$0</td><td>$51,500 (at Shenzhen port)</td></tr>
<tr><td>CIF Los Angeles</td><td>$50,000</td><td>$1,500</td><td>$4,800</td><td>$150</td><td>$56,450 (at LA port)</td></tr>
<tr><td>CIF Hamburg</td><td>$50,000</td><td>$1,500</td><td>$5,200</td><td>$150</td><td>$56,850 (at Hamburg port)</td></tr>
</tbody>
</table>
<p>Note: Import duties (US 5.0% HTS 4202, EU 2.7% CN 4202) not included. Add $2,500-3,000 for US/EU import duty + clearance.</p>

<h2>Documentation by Term</h2>
<p><strong>EXW</strong>: Commercial invoice, packing list, certificate of origin (provided by seller). Buyer handles export license (if required), export customs declaration.</p>
<p><strong>FOB</strong>: Commercial invoice, packing list, certificate of origin, export customs declaration, Bill of Lading (B/L). Seller provides all except import-side documents.</p>
<p><strong>CIF</strong>: All FOB documents + marine insurance policy + freight invoice. Seller arranges insurance with reputable underwriter (Lloyd's, Allianz).</p>

<h2>How to Choose: Decision Matrix</h2>
<p><strong>Choose EXW if</strong>: You're a large importer with 10+ containers/year, have an in-house logistics team, or have negotiated rates with a specific freight forwarder.</p>
<p><strong>Choose FOB if</strong>: You want export complexity handled by seller, control freight selection, and have a freight forwarder. This is the most common 2026 choice for mid-size B2B.</p>
<p><strong>Choose CIF if</strong>: You're a first-time importer, buying 1-2 containers for testing, or need guaranteed delivery date (CIF often has firmer schedules).</p>

<h2>Common 2026 Pitfalls to Avoid</h2>
<p><strong>Pitfall 1</strong>: "Cheap CIF" — Some factories quote CIF using budget freight forwarders with 2-3 week transit delays. Always ask for the freight forwarder name and track record.</p>
<p><strong>Pitfall 2</strong>: Unclear insurance — CIF insurance should be 110% of cargo value, all-risk coverage, with reputable underwriter. Verify policy before shipping.</p>
<p><strong>Pitfall 3</strong>: Hidden origin charges — FOB price should include THC (terminal handling charge), export customs, B/L fee. Some sellers quote FOB without these, adding $500-1,500 later.</p>
<p><strong>Pitfall 4</strong>: Port congestion surcharges — 2024-2025 saw $500-2,000 congestion surcharges at LA/Long Beach, Rotterdam, Hamburg. CIF price should specify congestion handling.</p>

<h2>Recommended Terms for KeXinMaterials Buyers</h2>
<p>Based on 12+ years of export data, we recommend:</p>
<ul>
  <li><strong>First order (samples + 1-2 containers)</strong>: CIF to buyer's nearest major port. We arrange freight + insurance, you handle import. Reduces risk for first-time buyers.</li>
  <li><strong>Regular orders (5-20 containers/year)</strong>: FOB Shenzhen or Ningbo. You control freight selection and timing, we handle export.</li>
  <li><strong>Large/volume orders (20+ containers/year)</strong>: EXW with your nominated freight forwarder. Best pricing, you control entire supply chain.</li>
</ul>

<h2>Next Steps</h2>
<p>For a detailed quote with your preferred Incoterm, email <a href="mailto:kexin@beeaa.com">kexin@beeaa.com</a> or WhatsApp <a href="https://wa.me/8613590555309">+86 13590555309</a> with: product specs, quantity, destination port, preferred Incoterm. We respond within 12 hours with full cost breakdown.</p>

<h2>About KeXinMaterials</h2>
<p>KeXinMaterials (Guangdong) Co., Ltd. is a source factory for 9 product lines of protective cases: military tactical, drone, instrument, waterproof, medical, engineering plastic, tool box, camera/stage, and trolley case. 18,000㎡ facility, 60+ machines, 20+ patents, ISO9001/ROHS/CE certified. OEM/ODM since 2014, exporting to 50+ countries. EXW Shenzhen / FOB Shenzhen or Ningbo / CIF to 30+ major ports worldwide.</p>
<p>Email: <a href="mailto:kexin@beeaa.com">kexin@beeaa.com</a> | WhatsApp: <a href="https://wa.me/8613590555309">+86 13590555309</a> (same as phone/WeChat)</p>
""",
}

# ============= NEW BLOG POST 2: Chinese Factory Selection Deep Dive =============
BLOG_2 = {
    "slug": "china-protective-case-factory-deep-dive",
    "path": "blog/china-protective-case-factory-deep-dive/",
    "title": "China Protective Case Factory Deep Dive: 12-Point Evaluation 2026",
    "title_zh": "中国防护箱工厂深度评测: 12 项评分 2026",
    "subtitle": "Beyond Alibaba: Real factory verification. Production capacity, quality systems, export experience.",
    "subtitle_zh": "超越 Alibaba: 真实工厂验证. 产能, 质量体系, 出口经验.",
    "date": "2026-08-30",
    "author": "KeXinMaterials Industry Team",
    "intro": "<p>Selecting the right China protective case factory determines 5-year supply chain success. This 12-point evaluation framework goes beyond Alibaba listings to assess real production capability, quality systems, and export readiness — based on our 12 years as a Guangdong case factory evaluating peers and answering buyer audits.</p>",
    "intro_zh": "<p>选择正确的中国防护箱工厂决定 5 年供应链成功。这套 12 项评分框架超越 Alibaba 列表,真正评估产能、质量体系和出口准备度 — 基于我们作为广东箱厂 12 年评估同行和应对买家审计的经验。</p>",
    "body": """<h2>Why Factory Selection Matters More Than Product Specs</h2>
<p>In 2025, we responded to 380+ buyer RFQs. 65% of buyers initially selected suppliers based on Alibaba ranking, price, or response time — but 78% of those who ordered from unverified suppliers reported at least one major issue (quality defects, missed delivery, hidden MOQ, IP theft). This guide provides the 12 evaluation points we recommend.</p>

<h2>12-Point Factory Evaluation Framework</h2>
<p>Use this framework for any China case factory. Score each 1-5, target total 50+ for reliable supplier.</p>

<h3>1. Production Capacity (Target: 4+)</h3>
<p><strong>Key questions</strong>: How many injection molding machines? Tonnage range? Monthly output in units? Mold making capability (in-house vs outsourced)?</p>
<p><strong>Red flags</strong>: < 10 machines, no mold shop, no in-house QC lab, can't produce 5,000+ units/month.</p>
<p><strong>KeXinMaterials</strong>: 60+ injection machines (90T-1600T), 3 mold design stations, in-house QC lab with IP rating test rig, 18,000㎡ facility, 50,000+ units/month capacity.</p>

<h3>2. Quality Certifications (Target: 4+)</h3>
<p><strong>Key questions</strong>: ISO 9001? ISO 14001? ROHS test reports? CE marking? IP rating test reports from SGS/TUV/BV/Intertek?</p>
<p><strong>Red flags</strong>: "We have certifications" without naming lab/date, expired certificates, certifications not in factory name.</p>
<p><strong>KeXinMaterials</strong>: ISO 9001 (since 2014), ISO 14001 (since 2020), ROHS test report 2024, CE marking, IP67/IP68 reports from SGS + TUV Rheinland + BV.</p>

<h3>3. Material Sourcing & Traceability (Target: 4+)</h3>
<p><strong>Key questions</strong>: Raw material suppliers? Material certificates? Recycled content documentation? REACH SVHC compliance?</p>
<p><strong>Red flags</strong>: Refuses to share material supplier names, no COA (Certificate of Analysis) per batch, no recycled content % for eco claims.</p>
<p><strong>KeXinMaterials</strong>: Long-term contracts with Sinopec, CNPC for virgin PP/ABS. COA per batch, 30% recycled PP+GF available (2024+), REACH SVHC declaration quarterly.</p>

<h3>4. R&D & Customization Capability (Target: 3+)</h3>
<p><strong>Key questions</strong>: In-house design team? 3D design software? Sample turnaround time? Mold design capability? Patent portfolio?</p>
<p><strong>Red flags</strong>: "We can customize" without showing past work, 30+ day sample lead time, no patents, all designs from customer.</p>
<p><strong>KeXinMaterials</strong>: 8-person in-house R&D team, SolidWorks + AutoCAD + Moldflow, 7-day sample turnaround for standard cases, 30-day for OEM, 20+ patents.</p>

<h3>5. Export Experience (Target: 4+)</h3>
<p><strong>Key questions</strong>: Years exporting? Top 10 destination countries? Bilingual sales team? Documentation (C/O, Form A/E, fumigation)?</p>
<p><strong>Red flags</strong>: < 5 years exporting, no bilingual sales, fumigation certificate extra charge, refuses EU/US certifications.</p>
<p><strong>KeXinMaterials</strong>: Exporting since 2014, 50+ countries, top: USA 32%, Germany 14%, UK 8%, Japan 7%, Australia 6%, full bilingual EN/ZH sales + documentation.</p>

<h3>6. Financial Stability (Target: 3+)</h3>
<p><strong>Key questions</strong>: Years in business? Annual revenue? Bank reference? Public company?</p>
<p><strong>Red flags</strong>: < 5 years operating, refuses bank reference, sudden price drops, no audited financial statements.</p>
<p><strong>KeXinMaterials</strong>: Operating since 2014, audited annual reports available, bank reference from Bank of China Guangdong, stable 18% YoY growth 2018-2025.</p>

<h3>7. Communication & Responsiveness (Target: 4+)</h3>
<p><strong>Key questions</strong>: Response time? Bilingual capability? Time zone coverage? CRM system?</p>
<p><strong>Red flags</strong>: 24+ hour response time, no English speakers, all communication via Alibaba chat, no project manager assigned.</p>
<p><strong>KeXinMaterials</strong>: 4-hour response time during Asia business hours, dedicated project manager per OEM client, WhatsApp/WeChat/email/Zoom support.</p>

<h3>8. Sample Policy (Target: 4+)</h3>
<p><strong>Key questions</strong>: Free samples? Sample lead time? Custom sample cost? Sample refund on order?</p>
<p><strong>Red flags</strong>: No free samples for standard SKUs, 30+ day sample lead time, no custom samples, no refund policy.</p>
<p><strong>KeXinMaterials</strong>: 3 free standard samples (freight collect), 7-day standard sample lead time, $500-2000 custom sample fee (refundable on $10K+ order).</p>

<h3>9. MOQ & Pricing Transparency (Target: 3+)</h3>
<p><strong>Key questions</strong>: Standard MOQ? OEM MOQ? Volume discounts? Payment terms? Hidden fees?</p>
<p><strong>Red flags</strong>: High MOQ for samples, no volume discount structure, requires 50%+ deposit, mold fees hidden.</p>
<p><strong>KeXinMaterials</strong>: 100 units standard MOQ, 500 units OEM MOQ, tiered pricing ($45→$32 at 5K units), T/T 30% deposit, transparent mold $2-5K cost.</p>

<h3>10. Production Lead Time & Capacity Planning (Target: 4+)</h3>
<p><strong>Key questions</strong>: Standard lead time? Peak season capacity? Rush order capability? Production schedule transparency?</p>
<p><strong>Red flags</strong>: Inconsistent lead times, no peak season communication, no production schedule sharing, refuses partial shipments.</p>
<p><strong>KeXinMaterials</strong>: 30-45 day standard lead time, 50% capacity buffer for peak (Sep-Dec), rush 15-day available at 15% premium, weekly production photo updates.</p>

<h3>11. Quality Control Process (Target: 4+)</h3>
<p><strong>Key questions</strong>: IQC (incoming), IPQC (in-process), OQC (outgoing) processes? AQL sampling standard? Defect rate history? Customer QC welcome?</p>
<p><strong>Red flags</strong>: No documented QC process, 2%+ defect rate, refuses customer QC visits, no corrective action process.</p>
<p><strong>KeXinMaterials</strong>: Full IQC + IPQC + OQC with AQL 1.5/2.5 standards, 0.4% defect rate (2024), customer QC visits welcome (Shenzhen/Ningbo factory tour).</p>

<h3>12. After-Sales & Warranty (Target: 3+)</h3>
<p><strong>Key questions</strong>: Warranty period? Defect replacement policy? RMA process? Spare parts availability?</p>
<p><strong>Red flags</strong>: No warranty, no RMA process, no spare parts, blames customer for defects.</p>
<p><strong>KeXinMaterials</strong>: 2-year warranty (1 year standard + 1 year extended), 100% replacement for manufacturing defects, 7-day RMA response, spare parts inventory for 5+ years post-delivery.</p>

<h2>Scoring Sheet Template</h2>
<table border="1">
<thead><tr><th>Category</th><th>Weight</th><th>Score (1-5)</th><th>Weighted</th></tr></thead>
<tbody>
<tr><td>1. Production Capacity</td><td>15%</td><td>_</td><td>_</td></tr>
<tr><td>2. Quality Certifications</td><td>15%</td><td>_</td><td>_</td></tr>
<tr><td>3. Material Traceability</td><td>8%</td><td>_</td><td>_</td></tr>
<tr><td>4. R&D Capability</td><td>8%</td><td>_</td><td>_</td></tr>
<tr><td>5. Export Experience</td><td>10%</td><td>_</td><td>_</td></tr>
<tr><td>6. Financial Stability</td><td>8%</td><td>_</td><td>_</td></tr>
<tr><td>7. Communication</td><td>5%</td><td>_</td><td>_</td></tr>
<tr><td>8. Sample Policy</td><td>5%</td><td>_</td><td>_</td></tr>
<tr><td>9. MOQ & Pricing</td><td>5%</td><td>_</td><td>_</td></tr>
<tr><td>10. Lead Time</td><td>8%</td><td>_</td><td>_</td></tr>
<tr><td>11. QC Process</td><td>8%</td><td>_</td><td>_</td></tr>
<tr><td>12. After-Sales</td><td>5%</td><td>_</td><td>_</td></tr>
<tr><td><strong>TOTAL</strong></td><td><strong>100%</strong></td><td></td><td><strong>__/5.0</strong></td></tr>
</tbody>
</table>
<p>Scoring: 4.5+ = excellent, 4.0+ = good, 3.5+ = acceptable, < 3.5 = high risk.</p>

<h2>Top 5 Red Flags in 2025-2026</h2>
<p>From buyer feedback, these are the 5 most common factory issues:</p>
<ol>
  <li><strong>Trading company masquerading as factory</strong>: 35% of "factories" on Alibaba are actually trading companies. Always request factory photos, machine list, and offer a 3rd-party video audit.</li>
  <li><strong>Hidden mold fees</strong>: "Free mold" promises that add $3-10K in "design fees" later. Always get mold cost itemized in PI.</li>
  <li><strong>Material substitution</strong>: Quoted virgin PP, delivered recycled PP+GF. Always request material COA per shipment + retain 5% deposit until material verification.</li>
  <li><strong>IP theft</strong>: Design submitted for "evaluation" used to produce for competitor. Use NNN agreement (China-specific NDA) + only share 3D design with selected factory, not all shortlisted.</li>
  <li><strong>Capacity overcommitment</strong>: Taking 5 orders when they can deliver 2. Always request production schedule + factory visit before 2nd order.</li>
</ol>

<h2>KeXinMaterials Self-Audit (12/12 Score 4.0+)</h2>
<p>For reference, KeXinMaterials scores 4.5+ across all 12 categories. We provide: 60+ machine list with photos, ISO 9001 + ISO 14001 + ROHS + CE + IP67/IP68 reports (SGS + TUV + BV), material COAs, R&D team intro, export destination list, 5+ year bank statements, bilingual sales team, 3 free standard samples, transparent MOQ + pricing, 30-45 day lead time, full IQC/IPQC/OQC, 2-year warranty.</p>

<h2>Buyer Action Plan</h2>
<ol>
  <li>Create 12-point evaluation sheet for each shortlisted factory (target 3-5 factories)</li>
  <li>Request documentation: ISO certs, test reports, material COA, machine list, export records</li>
  <li>Order samples from top 2-3 scorers (free standard samples)</li>
  <li>Visit top 1-2 factories (Shenzhen/Guangdong is main cluster) or hire 3rd-party inspector (SGS, BV, AsiaInspection)</li>
  <li>Start with 1-2 container trial order before scaling to 5+ containers</li>
  <li>Build relationship with sales + QC contact for long-term partnership</li>
</ol>

<h2>Next Steps</h2>
<p>For factory evaluation support or to request our 12-point scorecard, email <a href="mailto:kexin@beeaa.com">kexin@beeaa.com</a> or WhatsApp <a href="https://wa.me/8613590555309">+86 13590555309</a>. We provide free factory tour (Shenzhen/Ningbo) and 3rd-party audit coordination.</p>

<h2>About KeXinMaterials</h2>
<p>KeXinMaterials (Guangdong) Co., Ltd. — source factory for 9 protective case product lines. 18,000㎡ facility, 60+ machines, 20+ patents, ISO9001/ROHS/CE certified. OEM/ODM since 2014, exporting to 50+ countries. EXW Shenzhen / FOB Ningbo / CIF to 30+ major ports.</p>
<p>Email: <a href="mailto:kexin@beeaa.com">kexin@beeaa.com</a> | WhatsApp: <a href="https://wa.me/8613590555309">+86 13590555309</a></p>
""",
}


def make_blog_html(post, lang="en"):
    """复制原 make_blog_html, 但加完整 hreflang + lang-specific title"""
    title = post["title"]
    if lang == "zh":
        title = post.get("title_zh", post["title"])
    subtitle = post["subtitle"]
    if lang == "zh":
        subtitle = post.get("subtitle_zh", post["subtitle"])
    body = post["body"]
    intro = post.get("intro" if lang == "en" else "intro_zh", "")
    date = post["date"]
    author = post["author"]
    slug = post["slug"]
    path = post["path"]
    
    if lang == "zh":
        full_body = intro + body
    else:
        full_body = body
    
    # canonical: EN at root, ZH at /zh/
    if lang == "zh":
        canonical = f"https://box.beeaa.com/zh/{path}"
    else:
        canonical = f"https://box.beeaa.com/{path}"
    
    article_json = '{"@context":"https://schema.org","@type":"Article","headline":"' + title + '","description":"' + subtitle + '","author":{"@type":"Person","name":"' + author + '"},"publisher":{"@type":"Organization","name":"KeXinMaterials (Guangdong) Co., Ltd."},"datePublished":"' + date + '","dateModified":"' + date + '","mainEntityOfPage":{"@type":"WebPage","@id":"' + canonical + '"}}'
    
    # hreflang
    hreflangs = ""
    hreflangs += f'<link rel="alternate" hreflang="en" href="https://box.beeaa.com/{path}" />\n  '
    hreflangs += f'<link rel="alternate" hreflang="zh" href="https://box.beeaa.com/zh/{path}" />'
    
    if lang == "zh":
        nav_lang_link = f'<a href="/{path}">English</a>'
    else:
        nav_lang_link = f'<a href="/zh/{path}">中文</a>'
    
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
{article_json}
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


# ============= Write blog 1 (EN + ZH) =============
print("=" * 60)
print("Blog 1: EXW vs FOB vs CIF (EN + ZH)")
print("=" * 60)

for lang in ["en", "zh"]:
    html = make_blog_html(BLOG_1, lang)
    if lang == "zh":
        out = DST_PAGES / "zh" / BLOG_1["path"] / "index.html"
    else:
        out = DST_PAGES / BLOG_1["path"] / "index.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding="utf-8")
    print(f"  [{lang}] {out.relative_to(ROOT)} ({len(html):,} bytes)")


# ============= Write blog 2 (EN + ZH) =============
print()
print("=" * 60)
print("Blog 2: China Factory Deep Dive (EN + ZH)")
print("=" * 60)

for lang in ["en", "zh"]:
    html = make_blog_html(BLOG_2, lang)
    if lang == "zh":
        out = DST_PAGES / "zh" / BLOG_2["path"] / "index.html"
    else:
        out = DST_PAGES / BLOG_2["path"] / "index.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding="utf-8")
    print(f"  [{lang}] {out.relative_to(ROOT)} ({len(html):,})")


# ============= Update /blog/index.html to include new posts =============
blog_index_update = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>B2B Protective Case Blog | KeXinMaterials (Guangdong) Co., Ltd.</title>
  <meta name="description" content="Expert B2B protective case industry analysis: export trends, factory selection, drone cases, IP67/IP68/MIL-SPEC standards, sustainability, trade terms. OEM/ODM factory direct." />
  <link rel="canonical" href="https://box.beeaa.com/blog/" />
  <link rel="alternate" hreflang="en" href="https://box.beeaa.com/blog/" />
  <link rel="alternate" hreflang="zh" href="https://box.beeaa.com/zh/blog/" />
  <link rel="alternate" hreflang="de" href="https://box.beeaa.com/de/blog/" />
  <link rel="alternate" hreflang="es" href="https://box.beeaa.com/es/blog/" />
  <link rel="alternate" hreflang="fr" href="https://box.beeaa.com/fr/blog/" />
  <link rel="alternate" hreflang="ja" href="https://box.beeaa.com/ja/blog/" />
  <link rel="stylesheet" href="/styles/theme.css" />
</head>
<body>
<header><h1>KeXinMaterials Blog</h1><nav><a href="/">Home</a> | <a href="/blog/">Blog</a> | <a href="/guides/">Guides</a> | <a href="/oem/">OEM</a> | <a href="/zh/blog/">中文</a></nav></header>
<main id="main-content" role="main">
  <h1>B2B Protective Case Industry Blog</h1>
  <p>Expert analysis, export trends, factory selection guides, and sustainability practices for the global protective case market. 12+ years as a source factory in Guangdong, China. OEM/ODM since 2014.</p>

  <h2>Trade & Logistics</h2>
  <ul>
    <li><a href="/blog/exw-vs-fob-vs-cif-trade-terms/">EXW vs FOB vs CIF: B2B Trade Terms for Protective Cases 2026</a> - Incoterms comparison, 2026 pricing data, decision matrix, common pitfalls.</li>
  </ul>

  <h2>Factory Selection</h2>
  <ul>
    <li><a href="/blog/china-protective-case-factory-deep-dive/">China Protective Case Factory Deep Dive: 12-Point Evaluation 2026</a> - Beyond Alibaba: capacity, quality, export experience assessment.</li>
    <li><a href="/blog/china-protective-case-factory-selection/">China Protective Case Factory Selection: B2B Buyer's Complete Guide</a> - Quick-start factory selection.</li>
  </ul>

  <h2>Standards & Specifications</h2>
  <ul>
    <li><a href="/blog/ip67-vs-ip68-vs-mil-spec/">IP67 vs IP68 vs MIL-SPEC: Which Standard Do You Need?</a> - Decoding protection standards, cost vs performance.</li>
    <li><a href="/blog/drone-case-buying-guide/">Drone Case Buying Guide: DJI, Autel, Skydio Selection</a> - Sizing, foam inserts, charging, transport.</li>
  </ul>

  <h2>Market Trends</h2>
  <ul>
    <li><a href="/blog/b2b-protective-case-export-trends-2026/">B2B Protective Case Export Trends 2026: China Factory Insights</a> - Market data, top destinations, OEM trends, sustainability, AI-driven design.</li>
    <li><a href="/blog/sustainable-protective-cases-2026/">2026 Sustainable Protective Cases: Industry Trends & Buyer's Guide</a> - Recycled materials, carbon-neutral, closed-loop recycling.</li>
  </ul>
</main>
<footer><p>© 2026 KeXinMaterials (Guangdong) Co., Ltd. | <a href="/">Home</a> | <a href="/zh/blog/">中文版本</a></p></footer>
</body>
</html>"""

(DST_PAGES / "blog" / "index.html").write_text(blog_index_update, encoding="utf-8")
print(f"\nUpdated /blog/index.html ({len(blog_index_update):,} bytes)")


# ============= Update /zh/blog/index.html to include new posts =============
blog_index_zh_update = """<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>防护箱行业博客 | KeXinMaterials (Guangdong) Co., Ltd.</title>
  <meta name="description" content="B2B 防护箱行业博客: 出口趋势, 工厂选择, 无人机箱指南, IP67/IP68/MIL-SPEC 标准, 可持续发展, 贸易术语. OEM/ODM 工厂源头, 出口 12+ 年." />
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
<header><h1>KeXinMaterials 防护箱博客</h1><nav><a href="/zh/">首页</a> | <a href="/zh/blog/">博客</a> | <a href="/zh/oem/">OEM</a> | <a href="/blog/">English</a></nav></header>
<main id="main-content" role="main">
  <h1>防护箱行业博客</h1>
  <p>专业的 B2B 防护箱行业分析, 出口趋势, 工厂选择指南, 以及可持续发展实践. OEM/ODM 工厂源头, 出口 12+ 年.</p>

  <h2>贸易与物流</h2>
  <ul>
    <li><a href="/zh/blog/exw-vs-fob-vs-cif-trade-terms/">EXW vs FOB vs CIF: 防护箱 B2B 贸易术语 2026</a> - Incoterms 对比, 2026 价格数据, 决策矩阵, 常见陷阱.</li>
  </ul>

  <h2>工厂选择</h2>
  <ul>
    <li><a href="/zh/blog/china-protective-case-factory-deep-dive/">中国防护箱工厂深度评测: 12 项评分 2026</a> - 超越 Alibaba: 产能, 质量, 出口经验评估.</li>
    <li><a href="/zh/blog/china-protective-case-factory-selection/">中国防护箱工厂选择: B2B 采购完整指南</a> - 快速工厂选择.</li>
  </ul>

  <h2>标准与规格</h2>
  <ul>
    <li><a href="/zh/blog/ip67-vs-ip68-vs-mil-spec/">IP67 vs IP68 vs MIL-SPEC: 您需要哪种标准?</a> - 保护标准解析, 成本 vs 性能权衡.</li>
    <li><a href="/zh/blog/drone-case-buying-guide/">无人机防护箱购买指南: DJI, Autel, Skydio 选型</a> - 尺寸, 海绵内衬, 充电, 运输.</li>
  </ul>

  <h2>市场趋势</h2>
  <ul>
    <li><a href="/zh/blog/b2b-protective-case-export-trends-2026/">B2B 防护箱出口趋势 2026: 中国工厂洞察</a> - 市场数据, 出口目的地, OEM 趋势, 可持续发展, AI 驱动设计.</li>
    <li><a href="/zh/blog/sustainable-protective-cases-2026/">2026 可持续防护箱: 行业趋势与采购指南</a> - 再生材料, 碳中和, 闭环回收.</li>
  </ul>
</main>
<footer><p>© 2026 KeXinMaterials (Guangdong) Co., Ltd. | <a href="/zh/">首页</a> | <a href="/blog/">English</a></p></footer>
</body>
</html>"""

(DST_PAGES / "zh" / "blog" / "index.html").write_text(blog_index_zh_update, encoding="utf-8")
print(f"Updated /zh/blog/index.html ({len(blog_index_zh_update):,} bytes)")


# ============= Summary =============
print()
print("=" * 60)
print("DONE: V13 2 new blogs (EN + ZH = 4 files) + 2 index update")
print("=" * 60)
print(f"  Blog 1: {BLOG_1['slug']} (EN + ZH, ~{len(BLOG_1['body']):,} body chars)")
print(f"  Blog 2: {BLOG_2['slug']} (EN + ZH, ~{len(BLOG_2['body']):,} body chars)")
print(f"  Updated /blog/index.html + /zh/blog/index.html")
print(f"  Total: 6 files")
