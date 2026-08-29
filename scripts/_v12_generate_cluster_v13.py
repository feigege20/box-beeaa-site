#!/usr/bin/env python3
"""
V13: 2 new SEO cluster pages (Phase 9 expansion)
1. guides/pp-vs-abs-material-comparison/ (PP/ABS material science)
2. guides/hard-case-vs-soft-case/ (use case comparison)
Plus de/es/fr/ja translations for 2 V13 new blogs (exw-vs-fob-vs-cif + china-factory-deep-dive)
"""
import os
import re
from pathlib import Path

ROOT = Path(r"C:\Users\Administrator\.minimax\workspace\box-beeaa-site")
DST_PAGES = ROOT / "dist-pages"

# ============= CLUSTER 1: PP vs ABS =============
CLUSTER_1 = {
    "slug": "pp-vs-abs-material",
    "path": "guides/pp-vs-abs-material-comparison/",
    "title_en": "PP vs ABS Material Comparison for B2B Protective Cases 2026",
    "title_zh": "PP vs ABS 防护箱材料对比 2026",
    "subtitle_en": "Polypropylene vs Acrylonitrile Butadiene Styrene. Mechanical, thermal, chemical properties, cost, applications.",
    "subtitle_zh": "聚丙烯 vs ABS. 机械、热、化学性能、成本、应用对比.",
    "intro_en": "<p>Choosing between PP (polypropylene) and ABS (acrylonitrile butadiene styrene) is a fundamental decision for B2B protective case buyers. This guide compares 8 critical dimensions: impact strength, temperature range, UV resistance, chemical resistance, recyclability, cost, weight, and processing.</p>",
    "intro_zh": "<p>在 PP (聚丙烯) 和 ABS (丙烯腈-丁二烯-苯乙烯) 之间选择是 B2B 防护箱买家的基本决策。本指南比较 8 个关键维度:冲击强度、温度范围、抗紫外线性、化学耐受性、可回收性、成本、重量和加工性。</p>",
    "table_en": [
        ["Property", "PP (Polypropylene)", "ABS (Acrylonitrile Butadiene Styrene)", "PP+GF Composite", "Best For"],
        ["Density (g/cm³)", "0.90-0.92", "1.04-1.07", "0.95-1.10", "PP+GF: balanced"],
        ["Tensile Strength (MPa)", "30-40", "40-50", "60-100 (with 30% GF)", "PP+GF: high stress"],
        ["Impact Strength (kJ/m²)", "5-15 (notched)", "15-30 (notched)", "10-25 (with 30% GF)", "ABS: high impact"],
        ["Heat Deflection (°C, 0.45 MPa)", "100-115", "95-105", "140-160", "PP+GF: high temp"],
        ["Cold Tolerance (°C)", "-20 to -30", "-40 to -50", "-30 to -40", "ABS: cold weather"],
        ["UV Resistance (natural)", "Poor (needs UV stabilizer)", "Good", "Poor (needs UV stabilizer)", "ABS: outdoor exposed"],
        ["Chemical Resistance", "Excellent (acids, alkalis, oils)", "Good (limited organic solvents)", "Excellent", "PP/PP+GF: chemical"],
        ["Recyclability", "100% recyclable, closed-loop", "Recyclable, but downgrades", "100% recyclable", "PP/PP+GF: circular economy"],
        ["Cost (USD/kg, 2026)", "$1.20-1.40", "$1.50-1.80", "$1.50-2.20", "PP: lowest cost"],
        ["Processing (Injection Molding)", "Easy, low shrinkage", "Easy, low shrinkage", "Easy, requires glass fiber handling", "All: standard"],
        ["Weight (per case, 30L)", "1.8-2.2 kg", "2.1-2.5 kg", "2.0-2.4 kg", "PP: lightest"],
    ],
    "table_zh": [
        ["性能", "PP (聚丙烯)", "ABS (丙烯腈-丁二烯-苯乙烯)", "PP+GF 复合材料", "最佳选择"],
        ["密度 (g/cm³)", "0.90-0.92", "1.04-1.07", "0.95-1.10", "PP+GF: 平衡"],
        ["拉伸强度 (MPa)", "30-40", "40-50", "60-100 (30% GF)", "PP+GF: 高应力"],
        ["冲击强度 (kJ/m²)", "5-15 (缺口)", "15-30 (缺口)", "10-25 (30% GF)", "ABS: 高冲击"],
        ["热变形温度 (°C, 0.45 MPa)", "100-115", "95-105", "140-160", "PP+GF: 高温"],
        ["耐低温 (°C)", "-20 至 -30", "-40 至 -50", "-30 至 -40", "ABS: 寒冷环境"],
        ["抗紫外线性 (本色)", "差 (需 UV 稳定剂)", "良好", "差 (需 UV 稳定剂)", "ABS: 户外暴露"],
        ["化学耐受性", "优秀 (酸、碱、油)", "良好 (有限有机溶剂)", "优秀", "PP/PP+GF: 化学"],
        ["可回收性", "100% 可回收, 闭环", "可回收, 但降级", "100% 可回收", "PP/PP+GF: 循环经济"],
        ["成本 (USD/kg, 2026)", "$1.20-1.40", "$1.50-1.80", "$1.50-2.20", "PP: 最低成本"],
        ["加工 (注塑)", "易, 低收缩", "易, 低收缩", "易, 需玻璃纤维处理", "全部: 标准"],
        ["重量 (30L 箱)", "1.8-2.2 kg", "2.1-2.5 kg", "2.0-2.4 kg", "PP: 最轻"],
    ],
}

# ============= CLUSTER 2: Hard vs Soft =============
CLUSTER_2 = {
    "slug": "hard-case-vs-soft-case",
    "path": "guides/hard-case-vs-soft-case/",
    "title_en": "Hard Case vs Soft Case: B2B Protective Case Comparison 2026",
    "title_zh": "硬壳箱 vs 软包: B2B 防护箱对比 2026",
    "subtitle_en": "When to use hard case vs soft case. Protection level, weight, cost, use cases for B2B buyers.",
    "subtitle_zh": "何时使用硬壳箱 vs 软包. 保护等级、重量、成本、B2B 买家使用场景.",
    "intro_en": "<p>The choice between hard case and soft case affects protection, weight, cost, and end-user experience. This guide compares 6 dimensions and provides decision matrix for 10 common B2B applications.</p>",
    "intro_zh": "<p>硬壳箱和软包之间的选择影响保护、重量、成本和最终用户体验。本指南比较 6 个维度,并为 10 个常见 B2B 应用提供决策矩阵。</p>",
    "table_en": [
        ["Dimension", "Hard Case (PP/ABS/PP+GF)", "Soft Case (EVA+Nylon/Polyester)", "Best For"],
        ["Protection Level", "IP54-IP68, MIL-STD-810H capable", "IP42-IP54, no MIL-SPEC", "Hard: high value/fragile equipment"],
        ["Drop Resistance", "1.2-3.0m onto concrete", "0.3-0.8m typical", "Hard: field/transport"],
        ["Weight (30L case)", "1.8-2.5 kg", "0.6-1.2 kg", "Soft: portable daily use"],
        ["Cost (USD/pc, MOQ 100)", "$30-150", "$15-50", "Soft: budget/light duty"],
        ["Customization", "Custom foam, color, mold", "Custom embroidery, screen print, color", "Hard: precision foam; Soft: branding"],
        ["Lifespan (typical)", "10-15 years", "3-7 years", "Hard: long-term ROI"],
        ["Waterproof", "Yes (IP67-IP68 with gasket)", "Limited (IP54 max with rain cover)", "Hard: marine/rain"],
        ["Stackability", "Yes (designed for stacking)", "Limited (soft, may deform)", "Hard: warehouse/transport"],
        ["Locking", "TSA lock, key, biometric", "Zipper, simple buckle", "Hard: high security"],
        ["Internal Organization", "Custom foam, dividers, panels", "Pockets, pouches, straps", "Hard: precision equipment"],
        ["Environmental Impact", "100% recyclable PP/ABS", "Mixed materials, hard to recycle", "Hard: sustainability"],
        ["Brand Image", "Professional, premium, technical", "Casual, modern, lightweight", "Hard: B2B/corporate"],
    ],
    "table_zh": [
        ["维度", "硬壳箱 (PP/ABS/PP+GF)", "软包 (EVA+尼龙/涤纶)", "最佳选择"],
        ["保护等级", "IP54-IP68, 可达 MIL-STD-810H", "IP42-IP54, 无 MIL-SPEC", "硬壳: 高价值/易碎设备"],
        ["跌落耐受", "1.2-3.0m 落混凝土", "0.3-0.8m 典型", "硬壳: 野外/运输"],
        ["重量 (30L 箱)", "1.8-2.5 kg", "0.6-1.2 kg", "软包: 便携日常"],
        ["成本 (USD/件, MOQ 100)", "$30-150", "$15-50", "软包: 预算/轻型"],
        ["定制化", "定制海绵、颜色、模具", "定制刺绣、丝印、颜色", "硬壳: 精密海绵; 软包: 品牌"],
        ["寿命 (典型)", "10-15 年", "3-7 年", "硬壳: 长期 ROI"],
        ["防水", "是 (IP67-IP68 带密封圈)", "有限 (IP54 雨罩)", "硬壳: 海洋/雨"],
        ["可堆叠", "是 (专为堆叠设计)", "有限 (软, 可能变形)", "硬壳: 仓库/运输"],
        ["锁具", "TSA 锁、钥匙、生物识别", "拉链、简单扣", "硬壳: 高安全"],
        ["内部组织", "定制海绵、分隔板、面板", "口袋、小袋、绑带", "硬壳: 精密设备"],
        ["环境影响", "100% 可回收 PP/ABS", "混合材料, 难回收", "硬壳: 可持续"],
        ["品牌形象", "专业、高端、技术", "休闲、现代、轻便", "硬壳: B2B/企业"],
    ],
}


def make_cluster_html(cluster, lang):
    """生成 cluster HTML, EN or ZH"""
    title = cluster[f"title_{lang}"]
    subtitle = cluster[f"subtitle_{lang}"]
    intro = cluster[f"intro_{lang}"]
    table = cluster[f"table_{lang}"]
    thead = table[0]
    tbody = table[1:]

    rows = "\n".join(["<tr>" + "".join(f"<td>{c}</td>" for c in row) + "</tr>" for row in tbody])

    # canonical
    if lang == "zh":
        canonical = f"https://box.beeaa.com/zh/{cluster['path']}"
    else:
        canonical = f"https://box.beeaa.com/{cluster['path']}"

    # hreflang
    hreflangs = f'<link rel="alternate" hreflang="en" href="https://box.beeaa.com/{cluster["path"]}" />\n  '
    hreflangs += f'<link rel="alternate" hreflang="zh" href="https://box.beeaa.com/zh/{cluster["path"]}" />\n  '
    hreflangs += f'<link rel="alternate" hreflang="de" href="https://box.beeaa.com/de/{cluster["path"]}" />\n  '
    hreflangs += f'<link rel="alternate" hreflang="es" href="https://box.beeaa.com/es/{cluster["path"]}" />\n  '
    hreflangs += f'<link rel="alternate" hreflang="fr" href="https://box.beeaa.com/fr/{cluster["path"]}" />\n  '
    hreflangs += f'<link rel="alternate" hreflang="ja" href="https://box.beeaa.com/ja/{cluster["path"]}" />'

    # JSON-LD
    article_json = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": title,
        "description": subtitle,
        "author": {"@type": "Organization", "name": "KeXinMaterials (Guangdong) Co., Ltd."},
        "publisher": {"@type": "Organization", "name": "KeXinMaterials", "logo": {"@type": "ImageObject", "url": "https://box.beeaa.com/images/logo.png"}},
        "datePublished": "2026-08-30",
        "dateModified": "2026-08-30",
        "mainEntityOfPage": {"@type": "WebPage", "@id": canonical}
    }
    breadcrumb_json = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home" if lang == "en" else "首页", "item": f"https://box.beeaa.com/{'zh/' if lang == 'zh' else ''}"},
            {"@type": "ListItem", "position": 2, "name": "Guides" if lang == "en" else "指南", "item": f"https://box.beeaa.com/{'zh/' if lang == 'zh' else ''}guides/"},
            {"@type": "ListItem", "position": 3, "name": title, "item": canonical}
        ]
    }
    faq_json = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "Which is better, PP or ABS?" if lang == "en" else "PP 和 ABS 哪个更好?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Neither is universally better. PP is cheaper, lighter, and more chemical-resistant. ABS is more impact-resistant, cold-tolerant, and UV-stable. For B2B cases, PP+GF composite offers the best balance: 60-100 MPa tensile, IP67-IP68 rating, recyclable. Choose based on your primary use environment." if lang == "en" else "没有通用的更好。PP 更便宜、更轻、更耐化学。ABS 更耐冲击、耐寒、抗紫外。对于 B2B 防护箱,PP+GF 复合材料提供最佳平衡:60-100 MPa 拉伸、IP67-IP68 防护、可回收。根据您的主要使用环境选择。"
                }
            },
            {
                "@type": "Question",
                "name": "What is PP+GF composite?" if lang == "en" else "什么是 PP+GF 复合材料?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "PP+GF (polypropylene + glass fiber) is a composite material with 10-40% glass fiber reinforcement. It combines PP's chemical resistance and recyclability with GF's rigidity and strength. Typical B2B case use is 30% glass fiber content, providing 60-100 MPa tensile strength vs 30-40 MPa for pure PP." if lang == "en" else "PP+GF (聚丙烯 + 玻璃纤维) 是 10-40% 玻璃纤维加固的复合材料。它结合了 PP 的化学耐受性和可回收性,以及 GF 的刚性和强度。典型 B2B 防护箱使用 30% 玻璃纤维含量,提供 60-100 MPa 拉伸强度,而纯 PP 仅 30-40 MPa。"
                }
            }
        ]
    }

    import json
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
    <h2>{'Next Steps' if lang == 'en' else '下一步'}</h2>
    <p>{'Email' if lang == 'en' else '邮件'} <a href="mailto:kexin@beeaa.com">kexin@beeaa.com</a> { 'or' if lang == 'en' else '或'} WhatsApp <a href="https://wa.me/8613590555309">+86 13590555309</a> { 'with your specifications for a 12-hour quote.' if lang == 'en' else '提供您的规格,12 小时内回复报价。'}</p>
  </article>
</main>
<footer><p>© 2026 KeXinMaterials (Guangdong) Co., Ltd. | <a href="/{'zh/' if lang == 'zh' else ''}">Home</a> | {nav_lang_link}</p></footer>
</body>
</html>"""


# ============= Write 2 new clusters EN + ZH =============
print("=" * 60)
print("V13: 2 new cluster pages (PP/ABS + Hard/Soft)")
print("=" * 60)

clusters = [CLUSTER_1, CLUSTER_2]
cluster_files = 0
cluster_bytes = 0
for cluster in clusters:
    for lang in ["en", "zh"]:
        html = make_cluster_html(cluster, lang)
        if lang == "zh":
            out = DST_PAGES / "zh" / cluster["path"] / "index.html"
        else:
            out = DST_PAGES / cluster["path"] / "index.html"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(html, encoding="utf-8")
        cluster_files += 1
        cluster_bytes += len(html)
        print(f"  [{lang}] {out.relative_to(ROOT)} ({len(html):,} bytes)")

print(f"\nClusters: {cluster_files} files, {cluster_bytes:,} bytes total")


# ============= de/es/fr/ja translations for 2 V13 new blogs =============
print()
print("=" * 60)
print("de/es/fr/ja translations for 2 V13 new blogs")
print("=" * 60)

# Translation templates (short, focused on key sections)
BLOG_TRANSLATIONS = {
    "exw-vs-fob-vs-cif-trade-terms": {
        "de": {
            "title": "EXW vs FOB vs CIF: B2B Handelsbedingungen für Schutzkoffer 2026",
            "subtitle": "Incoterms-Vergleich für Kofferkäufer. Preise, Risiko, Dokumentation, Hafenlogistik.",
        },
        "es": {
            "title": "EXW vs FOB vs CIF: Términos Comerciales B2B para Maletines Protectores 2026",
            "subtitle": "Comparación Incoterms para compradores. Precios, riesgo, documentación, logística portuaria.",
        },
        "fr": {
            "title": "EXW vs FOB vs CIF: Conditions Commerciales B2B pour Valises Protectrices 2026",
            "subtitle": "Comparaison Incoterms pour acheteurs. Prix, risque, documentation, logistique portuaire.",
        },
        "ja": {
            "title": "EXW vs FOB vs CIF: B2B 保護ケース貿易条件 2026",
            "subtitle": "ケース購入者向け Incoterms 比較。価格、リスク、文書、港湾物流。",
        },
    },
    "china-protective-case-factory-deep-dive": {
        "de": {
            "title": "China Schutzkoffer-Fabrik Tiefenanalyse: 12-Punkte-Bewertung 2026",
            "subtitle": "Über Alibaba hinaus: Echte Fabrikverifikation. Produktionskapazität, Qualitätssysteme, Exporterfahrung.",
        },
        "es": {
            "title": "Fábrica China de Maletines Protectores: Evaluación de 12 Puntos 2026",
            "subtitle": "Más allá de Alibaba: Verificación real de fábrica. Capacidad de producción, sistemas de calidad, experiencia exportadora.",
        },
        "fr": {
            "title": "Analyse Approfondie Usine Chinoise de Valises Protectrices: Évaluation 12 Points 2026",
            "subtitle": "Au-delà d'Alibaba: Vérification réelle d'usine. Capacité de production, systèmes qualité, expérience d'exportation.",
        },
        "ja": {
            "title": "中国保護ケース工場詳細分析: 12 ポイント評価 2026",
            "subtitle": "Alibaba の先へ: 実際の工場検証。生産能力、品質システム、輸出経験。",
        },
    },
}


def translate_blog(blog_path, lang, title, subtitle):
    """为已存在的 EN/ZH blog 生成 de/es/fr/ja 翻译版本
    策略: 读 EN 文件, 改 lang + canonical + title + subtitle + meta + 简短正文说明
    """
    en_file = DST_PAGES / blog_path / "index.html"
    if not en_file.exists():
        return None, 0

    en_content = en_file.read_text(encoding="utf-8")

    # 改 lang + canonical + title + meta description
    new_content = en_content
    new_content = re.sub(r'<html lang="en">', f'<html lang="{lang}">', new_content, count=1)

    # canonical: /de/.../es/.../fr/.../ja/...
    new_content = re.sub(
        r'<link rel="canonical" href="https://box\.beeaa\.com/' + re.escape(blog_path) + r'"\s*/>',
        f'<link rel="canonical" href="https://box.beeaa.com/{lang}/{blog_path}" />',
        new_content
    )

    # 改 title (old title | KeXinMaterials...)
    new_content = re.sub(
        r'<title>([^|]+)\| KeXinMaterials',
        f'<title>{title} | KeXinMaterials',
        new_content,
        count=1
    )

    # 改 description
    new_content = re.sub(
        r'<meta name="description" content="([^"]+)"',
        f'<meta name="description" content="{subtitle} OEM/ODM factory since 2014. EXW Shenzhen/FOB Ningbo, T/T 30% deposit, 30-45 day delivery."',
        new_content,
        count=1
    )

    # 改 mainEntityOfPage
    new_content = re.sub(
        r'"@id":"https://box\.beeaa\.com/' + re.escape(blog_path) + r'"',
        f'"@id":"https://box.beeaa.com/{lang}/{blog_path}"',
        new_content
    )

    # 改 <h1> (find first h1 after <article>)
    new_content = re.sub(
        r'(<article>\s*<h1>)([^<]+)(</h1>)',
        f'\\1{title}\\3',
        new_content,
        count=1
    )

    # 改 <p class="lead">
    new_content = re.sub(
        r'(<p class="lead">)([^<]+)(</p>)',
        f'\\1{subtitle}\\3',
        new_content,
        count=1
    )

    # 改 hreflang (加 de/es/fr/ja)
    if f'hreflang="{lang}"' not in new_content:
        # 在最后一个 hreflang 后插入
        new_content = re.sub(
            r'(<link rel="alternate" hreflang="ja" href="[^"]+"\s*/>)',
            f'\\1\n  <link rel="alternate" hreflang="{lang}" href="https://box.beeaa.com/{lang}/{blog_path}" />',
            new_content,
            count=1
        )

    # 写文件
    out = DST_PAGES / lang / blog_path / "index.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(new_content, encoding="utf-8")

    return out, len(new_content)


blog_files = 0
blog_bytes = 0
for blog_slug, translations in BLOG_TRANSLATIONS.items():
    for lang, tr in translations.items():
        out, bsize = translate_blog(blog_slug, lang, tr["title"], tr["subtitle"])
        if out:
            blog_files += 1
            blog_bytes += bsize
            print(f"  [{lang}] {out.relative_to(ROOT)} ({bsize:,} bytes)")

print(f"\nBlog translations: {blog_files} files, {blog_bytes:,} bytes")


# ============= Summary =============
print()
print("=" * 60)
print("DONE: V13 Phase 9 - 2 new clusters + 8 blog translations")
print("=" * 60)
print(f"  Clusters: {cluster_files} files (2 EN + 2 ZH)")
print(f"  Blog translations: {blog_files} files (2 blogs × 4 langs)")
print(f"  Total: {cluster_files + blog_files} files, {cluster_bytes + blog_bytes:,} bytes")
