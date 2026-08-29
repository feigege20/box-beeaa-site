#!/usr/bin/env python3
"""
V13: 修复 de/es/fr/ja 翻译 for 2 V13 new blogs (path 修正: blog/ 前缀)
"""
import re
from pathlib import Path

ROOT = Path(r"C:\Users\Administrator\.minimax\workspace\box-beeaa-site")
DST_PAGES = ROOT / "dist-pages"

BLOG_TRANSLATIONS = {
    "blog/exw-vs-fob-vs-cif-trade-terms": {
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
    "blog/china-protective-case-factory-deep-dive": {
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
    en_file = DST_PAGES / blog_path / "index.html"
    if not en_file.exists():
        return None, 0, "EN file not found"

    en_content = en_file.read_text(encoding="utf-8")
    new_content = en_content

    # 改 lang
    new_content = re.sub(r'<html lang="en">', f'<html lang="{lang}">', new_content, count=1)

    # 改 canonical
    new_content = re.sub(
        r'<link rel="canonical" href="https://box\.beeaa\.com/' + re.escape(blog_path) + r'"\s*/>',
        f'<link rel="canonical" href="https://box.beeaa.com/{lang}/{blog_path}" />',
        new_content
    )

    # 改 title
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

    # 改 H1
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

    # 加 hreflang
    if f'hreflang="{lang}"' not in new_content:
        # 找最后一个 hreflang 之后插入
        new_content = re.sub(
            r'(<link rel="alternate" hreflang="ja" href="[^"]+"\s*/>)',
            f'\\1\n  <link rel="alternate" hreflang="{lang}" href="https://box.beeaa.com/{lang}/{blog_path}" />',
            new_content,
            count=1
        )
        # 如果没有 ja, 找 zh 之后
        if f'hreflang="{lang}"' not in new_content:
            new_content = re.sub(
                r'(<link rel="alternate" hreflang="zh" href="[^"]+"\s*/>)',
                f'\\1\n  <link rel="alternate" hreflang="{lang}" href="https://box.beeaa.com/{lang}/{blog_path}" />',
                new_content,
                count=1
            )

    # 写文件
    out = DST_PAGES / lang / blog_path / "index.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(new_content, encoding="utf-8")

    return out, len(new_content), "OK"


# ============= Process 2 blogs × 4 langs =============
print("=" * 60)
print("V13: de/es/fr/ja 翻译 2 V13 blogs (path 修正)")
print("=" * 60)

total_files = 0
total_bytes = 0
for blog_path, translations in BLOG_TRANSLATIONS.items():
    for lang, tr in translations.items():
        out, bsize, status = translate_blog(blog_path, lang, tr["title"], tr["subtitle"])
        if out:
            total_files += 1
            total_bytes += bsize
            print(f"  [{lang}] {out.relative_to(ROOT)} ({bsize:,} bytes) [{status}]")
        else:
            print(f"  [{lang}] {blog_path} -> {status}")

print(f"\nTotal: {total_files} files, {total_bytes:,} bytes")
print(f"\nDONE")
