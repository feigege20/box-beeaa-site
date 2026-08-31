#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Phase 17-C: Generate real content for 10 broken pages
- 4 commercialIntents (wholesale/agency/oem/export) — 4 langs (en+zh) = 8 files
- 6 markets (north-america/europe/southeast-asia/middle-east/russia/japan-korea) — 2 langs = 12 files
- 1 faq — 2 langs = 2 files
Total: 22 files. oem is already correct, but we'll regenerate it for consistency.

Outputs to dist/ (full) + dist-pages/ (CF Pages deploy)
"""
import re
from pathlib import Path

# 9 product lines (link to /<slug>/)
PRODUCT_LINES = [
    {"slug": "drone-case", "name_en": "Drone Case", "name_zh": "无人机防护箱"},
    {"slug": "camera-stage-case", "name_en": "Camera & Stage Case", "name_zh": "摄影舞台防护箱"},
    {"slug": "military-tactical-case", "name_en": "Military Tactical Case", "name_zh": "军规战术防护箱"},
    {"slug": "medical-case", "name_en": "Medical Cold-Chain Case", "name_zh": "医疗冷链防护箱"},
    {"slug": "waterproof-case", "name_en": "Waterproof Outdoor Case", "name_zh": "防水户外防护箱"},
    {"slug": "instrument-case", "name_en": "Instrument Case", "name_zh": "精密仪器防护箱"},
    {"slug": "tool-box", "name_en": "Tool Box", "name_zh": "工具周转箱"},
    {"slug": "engineering-plastic-case", "name_en": "Engineering Plastic Case", "name_zh": "工程塑料防护箱"},
    {"slug": "trolley-case", "name_en": "Trolley Business Case", "name_zh": "拉杆商务箱"},
]

INTENTS = [
    {
        "slug": "wholesale", "name_en": "Wholesale", "name_zh": "批发采购",
        "lead_zh": "9 大产品线 防护箱源头工厂直批,MOQ 50-100 pcs 标准 SKU / 300 pcs 定制,30-45 天交付,FOB 深圳港",
        "lead_en": "Wholesale direct from source factory for 9 product lines. MOQ 50-100 pcs for standard SKUs, 300 pcs for custom. 30-45 day delivery. FOB Shenzhen Port.",
    },
    {
        "slug": "agency", "name_en": "Agency & Franchise", "name_zh": "代理加盟",
        "lead_zh": "区域独家代理 / 全球代理批发,经销价低于出厂价 20-35%,季度返点 + 市场推广支持,12 个月内独家保护",
        "lead_en": "Regional exclusive / global wholesale agency. 20-35% below factory price, quarterly rebate, marketing support, 12-month exclusive protection.",
    },
    {
        "slug": "export", "name_en": "Global Supply", "name_zh": "全球供货",
        "lead_zh": "13 年出口经验,服务 50+ 国家,北美/欧洲/东南亚/中东/俄/日韩 6 大市场本地化认证,海运 FOB 深圳 / 宁波",
        "lead_en": "13 years export experience, serving 50+ countries. Localized certifications for 6 markets: NA / EU / SEA / ME / RU / JP-KR. FOB Shenzhen / Ningbo.",
    },
    {
        "slug": "oem", "name_en": "OEM/ODM Custom", "name_zh": "OEM/ODM 定制",
        "lead_zh": "5 步提交定制需求,12 小时内获取工厂报价。源头工厂 OEM/ODM,MOQ 50 件起,30-45 天交期,IP67/ROHS/CE 全认证",
        "lead_en": "Submit custom requirements in 5 steps, get factory quote within 12 hours. Source factory OEM/ODM, MOQ 50 pcs, 30-day delivery, IP67/ROHS/CE certified.",
    },
]

MARKETS = [
    {
        "slug": "north-america", "name_en": "North America Market", "name_zh": "北美市场",
        "currency": "USD", "cert_zh": "UL / FCC / FDA / CPSIA / 加州 65",
        "cert_en": "UL / FCC / FDA / CPSIA / CA Prop 65",
        "countries_zh": "美国 / 加拿大", "countries_en": "USA / Canada",
        "key_products_zh": "无人机防护箱 / 摄影器材箱 / 军规战术箱 / 工具周转箱",
        "key_products_en": "Drone Case / Camera Case / Military Tactical Case / Tool Box",
        "shipping_zh": "长滩 / 洛杉矶 / 西雅图 / 温哥华。海运 14-21 天",
        "shipping_en": "Long Beach / LA / Seattle / Vancouver. Sea freight 14-21 days",
        "moq_zh": "标准 SKU 50 pcs / 定制 300 pcs / 混批 200 pcs",
        "moq_en": "Standard SKU 50 pcs / Custom 300 pcs / Mixed 200 pcs",
        "payment_zh": "T/T 30% 定金 + 70% 见提单副本,L/C 50 万 USD+ 可接",
        "payment_en": "T/T 30% deposit + 70% against B/L copy, L/C for 500K+ USD",
        "lead_zh": "13 年北美出口经验,服务 80+ 客户,IP67/MIL-SPEC 全认证,FBA 仓直发可对接",
        "lead_en": "13 years NA export, 80+ clients served, IP67/MIL-SPEC certified, FBA warehouse direct shipping",
    },
    {
        "slug": "europe", "name_en": "Europe Market", "name_zh": "欧洲市场",
        "currency": "EUR", "cert_zh": "CE / REACH / RoHS / EN 60529 IP 等级",
        "cert_en": "CE / REACH / RoHS / EN 60529 IP rating",
        "countries_zh": "德国 / 英国 / 法国 / 荷兰 / 意大利 / 西班牙 / 波兰",
        "countries_en": "Germany / UK / France / Netherlands / Italy / Spain / Poland",
        "key_products_zh": "防水户外箱 / 工具箱 / 仪器箱 / 摄影箱",
        "key_products_en": "Waterproof Case / Tool Box / Instrument Case / Camera Case",
        "shipping_zh": "汉堡 / 鹿特丹 / 安特卫普 / 费利克斯托。海运 28-35 天",
        "shipping_en": "Hamburg / Rotterdam / Antwerp / Felixstowe. Sea freight 28-35 days",
        "moq_zh": "标准 SKU 50 pcs / 定制 300 pcs",
        "moq_en": "Standard SKU 50 pcs / Custom 300 pcs",
        "payment_zh": "T/T 30/70,L/C EUR 50 万+ 可接,O/A 60 天老客户可申请",
        "payment_en": "T/T 30/70, L/C for 500K+ EUR, O/A 60 days for established clients",
        "lead_zh": "12 年欧洲出口经验,客户分布 15+ 国家,REACH/RoHS 全合规,德国 TÜV 报告齐备",
        "lead_en": "12 years EU export, clients in 15+ countries, REACH/RoHS compliant, TÜV reports available",
    },
    {
        "slug": "southeast-asia", "name_en": "Southeast Asia & HK/TW", "name_zh": "东南亚 / 港台市场",
        "currency": "USD", "cert_zh": "CE / RoHS / PSE (日本) / BSMI (台湾)",
        "cert_en": "CE / RoHS / PSE (Japan) / BSMI (Taiwan)",
        "countries_zh": "菲律宾 / 越南 / 泰国 / 印尼 / 马来西亚 / 新加坡 / 印度 / 香港 / 台湾",
        "countries_en": "Philippines / Vietnam / Thailand / Indonesia / Malaysia / Singapore / India / HK / TW",
        "key_products_zh": "防水户外箱 / 工具箱 / 摄影箱 / 无人机箱",
        "key_products_en": "Waterproof Case / Tool Box / Camera Case / Drone Case",
        "shipping_zh": "马尼拉 / 胡志明 / 曼谷 / 新加坡 / 香港。海运 7-12 天",
        "shipping_en": "Manila / HCMC / Bangkok / Singapore / HK. Sea freight 7-12 days",
        "moq_zh": "标准 SKU 50 pcs / 混批 100 pcs / ODM 200 pcs",
        "moq_en": "Standard SKU 50 pcs / Mixed 100 pcs / ODM 200 pcs",
        "payment_zh": "T/T 30/70,东南亚客户 L/C 谨慎,O/A 30 天可申请(老客户)",
        "payment_en": "T/T 30/70, L/C careful for SEA, O/A 30 days for established clients",
        "lead_zh": "热带气候高湿环境,推荐 IP67+ 防潮处理,15+ 国家本地代理,3 个海外仓合作",
        "lead_en": "Tropical climate high humidity, IP67+ moisture-proof recommended, 15+ countries with local agents, 3 overseas warehouse partners",
    },
    {
        "slug": "middle-east", "name_en": "Middle East Market", "name_zh": "中东市场",
        "currency": "USD/AED", "cert_zh": "SABER (沙特) / ECAS (阿联酋) / GSO (海湾)",
        "cert_en": "SABER (Saudi) / ECAS (UAE) / GSO (Gulf)",
        "countries_zh": "沙特阿拉伯 / 阿联酋 / 卡塔尔 / 科威特 / 以色列 / 土耳其",
        "countries_en": "Saudi Arabia / UAE / Qatar / Kuwait / Israel / Turkey",
        "key_products_zh": "防水 IP68 户外箱 / 军规战术箱 / 工具周转箱 / 拉杆商务箱",
        "key_products_en": "Waterproof IP68 Case / Military Tactical Case / Tool Box / Trolley Case",
        "shipping_zh": "迪拜 / 利雅得 / 多哈 / 伊斯坦布尔。海运 18-25 天",
        "shipping_en": "Dubai / Riyadh / Doha / Istanbul. Sea freight 18-25 days",
        "moq_zh": "标准 SKU 50 pcs / 定制 500 pcs (项目大单)",
        "moq_en": "Standard SKU 50 pcs / Custom 500 pcs (project orders)",
        "payment_zh": "T/T 30/70,信用证 L/C 普遍使用(50 万 USD+ 项目大单)",
        "payment_en": "T/T 30/70, L/C common (500K+ USD project orders)",
        "lead_zh": "高温 50°C+ 环境,推荐 IP68 + 抗 UV 材料,沙特 SABER / 阿联酋 ECAS 认证齐备",
        "lead_en": "High temp 50°C+ environment, IP68 + UV-resistant recommended, Saudi SABER / UAE ECAS certified",
    },
    {
        "slug": "russia", "name_en": "Russia Market", "name_zh": "俄罗斯市场",
        "currency": "USD/RUB", "cert_zh": "GOST-R / EAC (海关联盟) / 防火 FSS",
        "cert_en": "GOST-R / EAC (Customs Union) / Fire safety FSS",
        "countries_zh": "俄罗斯 / 白俄罗斯 / 哈萨克斯坦 / 亚美尼亚",
        "countries_en": "Russia / Belarus / Kazakhstan / Armenia",
        "key_products_zh": "寒带工具箱 / 军规战术箱 / 仪器箱 / 拉杆箱",
        "key_products_en": "Cold-climate Tool Box / Military Tactical Case / Instrument Case / Trolley Case",
        "shipping_zh": "圣彼得堡 / 符拉迪沃斯托克 / 新罗西克。海运 25-35 天 (中转)",
        "shipping_en": "St. Petersburg / Vladivostok / Novorossiysk. Sea freight 25-35 days (transit)",
        "moq_zh": "标准 SKU 50 pcs / 定制 300 pcs",
        "moq_en": "Standard SKU 50 pcs / Custom 300 pcs",
        "payment_zh": "T/T 30/70,L/C USD 50 万+,卢布结算 1-3% 折扣",
        "payment_en": "T/T 30/70, L/C for 500K+ USD, RUB payment 1-3% discount",
        "lead_zh": "寒带 -40°C 抗低温材料,EAC 认证必备,MOQ 灵活适合中俄边境贸易",
        "lead_en": "Cold -40°C low-temp materials, EAC required, flexible MOQ for China-Russia border trade",
    },
    {
        "slug": "japan-korea", "name_en": "Japan & Korea Market", "name_zh": "日韩市场",
        "currency": "JPY", "cert_zh": "PSE (日本) / KC (韩国) / VCCI",
        "cert_en": "PSE (Japan) / KC (Korea) / VCCI",
        "countries_zh": "日本 / 韩国",
        "countries_en": "Japan / Korea",
        "key_products_zh": "高端定制防护箱 / 摄影器材箱 / 无人机箱 / 仪器箱",
        "key_products_en": "Premium Custom Case / Camera Case / Drone Case / Instrument Case",
        "shipping_zh": "横滨 / 大阪 / 神户 / 釜山 / 仁川。海运 5-10 天",
        "shipping_en": "Yokohama / Osaka / Kobe / Busan / Incheon. Sea freight 5-10 days",
        "moq_zh": "标准 SKU 30 pcs / 定制 200 pcs (起订量比欧美低)",
        "moq_en": "Standard SKU 30 pcs / Custom 200 pcs (lower than EU/US)",
        "payment_zh": "T/T 30/70,信用证 L/C USD 30 万+,60 天 O/A 老客户可申请",
        "payment_en": "T/T 30/70, L/C for 300K+ USD, 60-day O/A for established clients",
        "lead_zh": "高标准 / 严质检,客信新材料 13 年日韩服务经验,客户以 OEM 定制为主,小 MOQ + 高品质",
        "lead_en": "High standard / strict QC, 13 years JP-KR service, OEM custom main business, low MOQ + high quality",
    },
]

FAQ_ZH = [
    ("客信新材料是工厂还是贸易商?", "客信新材料是源头工厂,18,000㎡ 厂房,自有材料改性、模具、注塑/滚塑、装配到出货全流程。2014 年成立,不是贸易商。"),
    ("支持 OEM/ODM 吗?", "支持。3D 设计 3 天、打样 7-10 天、开模 45 天、量产 30 天。MOQ 标准 SKU 50 件,定制 300 件,FOB 深圳 / 宁波港。"),
    ("如何询盘?", "邮件 kexin@beeaa.com 或 WhatsApp +86 13590555309,12 小时内回复。请提供: 数量 / 尺寸 / 用途 / 认证要求。"),
    ("MOQ 是多少?", "标准 SKU 50-100 pcs,定制 300 pcs。混批 (3-5 SKU) 100 pcs 起订。"),
    ("工厂在哪里?", "广东中山,18,000㎡ 自建厂房。13,000㎡ 生产 + 5,000㎡ 仓库。"),
    ("有什么认证?", "ISO9001 质量管理体系 / ROHS / CE / SGS / MAC / IP67 / 加州 65。20+ 外观设计专利。"),
    ("付款方式?", "T/T 30% 定金 + 70% 见提单副本。L/C USD/ EUR 50 万+ 可接。老客户可申请 30-60 天 O/A。"),
    ("交货期多久?", "标准 SKU 现货 7-15 天,定制 30-45 天 (含开模)。海运 FOB 深圳港 14-35 天到目的港。"),
    ("包装方式?", "出口 5 层瓦楞纸箱 + 防震泡棉 / EPE。每箱贴 SKU 标签 + 条形码。托盘出口可定制。"),
    ("样品政策?", "标准 SKU 样品免费 (运费买家承担),定制样品根据模具复杂度 $200-1500 + 7-10 天打样。"),
    ("最小订单金额?", "USD 5,000 一单起,低于此金额可拼单或转 EXW 中山。"),
    ("代理 / 经销政策?", "区域独家 / 全球代理,经销价低于出厂价 20-35%,季度返点 3-8%,市场推广支持 5-10% 销售返点。"),
    ("产品保修?", "正常工况下 1 年质保。批量订单可延长至 3 年。非人为损坏免费换新。"),
    ("如何验厂?", "支持视频验厂 + 第三方 SGS / TÜV / BV 现场验厂。预约: kexin@beeaa.com,7 天安排。"),
    ("环保 / 回收?", "PP / ABS 可回收材料占比 80%+。提供产品碳足迹报告 (ISO 14067)。"),
    ("紧急订单?", "加急费 30%,15-20 天交付。需提前 7 天预约产能。"),
    ("海外仓发货?", "可对接亚马逊 FBA / 海外仓。海外仓 3PL 合作伙伴:美国 / 德国 / 沙特 / 日本。"),
    ("Logo 定制?", "丝印 / 激光雕刻 / 模具咬花,3 种方式。MOQ 100 件起,免费打样。"),
    ("能否 FOB / CIF / DDP?", "支持 FOB 深圳 / 宁波。CIF / DDP 可代订但建议 FOB 自订海运更灵活。"),
    ("联系信息?", "邮箱: kexin@beeaa.com / 电话/微信/WhatsApp: +86 13590555309 / 主站: https://beeaa.com"),
]

FAQ_EN = [
    ("Is KeXinMaterials a factory or trader?", "KeXinMaterials is a source factory with 18,000㎡ facility, self-owned material compounding, mold, injection/rotomolding, assembly, and shipping. Established 2014, not a trader."),
    ("Do you support OEM/ODM?", "Yes. 3D design 3 days, sampling 7-10 days, mold 45 days, mass production 30 days. MOQ 50 pcs standard, 300 pcs custom. FOB Shenzhen/Ningbo Port."),
    ("How to inquire?", "Email kexin@beeaa.com or WhatsApp +86 13590555309, 12-hour reply. Please provide: qty / size / use case / certification required."),
    ("What's the MOQ?", "Standard SKU 50-100 pcs, custom 300 pcs. Mixed batch (3-5 SKUs) 100 pcs min."),
    ("Where is the factory?", "Zhongshan, Guangdong. 18,000㎡ self-built facility: 13,000㎡ production + 5,000㎡ warehouse."),
    ("What certifications?", "ISO9001 / ROHS / CE / SGS / MAC / IP67 / California Prop 65. 20+ design patents."),
    ("Payment terms?", "T/T 30% deposit + 70% against B/L copy. L/C for USD/EUR 500K+. O/A 30-60 days for established clients."),
    ("Lead time?", "Standard SKU in stock 7-15 days, custom 30-45 days (incl. mold). FOB sea freight 14-35 days to destination port."),
    ("Packaging?", "5-layer corrugated export carton + EPE foam. SKU label + barcode per carton. Pallet export customizable."),
    ("Sample policy?", "Standard SKU samples free (buyer pays shipping), custom sample USD 200-1500 + 7-10 days sampling."),
    ("Minimum order value?", "USD 5,000 per order. Below this can consolidate or switch to EXW Zhongshan."),
    ("Agency / distributor policy?", "Regional exclusive / global agency. 20-35% below factory price, quarterly rebate 3-8%, marketing support 5-10% sales rebate."),
    ("Product warranty?", "1 year under normal conditions. Bulk orders can extend to 3 years. Non-human damage free replacement."),
    ("Factory audit?", "Video audit + third-party SGS / TÜV / BV on-site audit supported. Book: kexin@beeaa.com, 7 days arrangement."),
    ("Eco / recycling?", "PP / ABS recyclable material 80%+. Product carbon footprint report (ISO 14067) available."),
    ("Rush orders?", "30% rush fee, 15-20 day delivery. Book 7 days in advance."),
    ("Overseas warehouse?", "FBA / overseas warehouse compatible. 3PL partners: USA / Germany / Saudi / Japan."),
    ("Logo customization?", "Silk print / laser engraving / mold texture, 3 options. MOQ 100 pcs, free proofing."),
    ("FOB / CIF / DDP?", "FOB Shenzhen / Ningbo supported. CIF / DDP available but FOB is more flexible for sea freight."),
    ("Contact info?", "Email: kexin@beeaa.com / Phone/WeChat/WhatsApp: +86 13590555309 / Main store: https://beeaa.com"),
]


def read_home_template(dist_path: Path) -> str:
    """Read home page as template base (head + body shell)."""
    return dist_path.read_text(encoding="utf-8")


def extract_template_parts(home_html: str) -> dict:
    """Extract <head>, <header>, <footer> from home page."""
    # Find <head>...</head>
    head_match = re.search(r'<head>.*?</head>', home_html, re.DOTALL)
    head = head_match.group(0) if head_match else ''

    # Find <header>...</header>
    header_match = re.search(r'<header.*?</header>', home_html, re.DOTALL)
    header = header_match.group(0) if header_match else ''

    # Find <footer>...</footer>
    footer_match = re.search(r'<footer.*?</footer>', home_html, re.DOTALL)
    footer = footer_match.group(0) if footer_match else ''

    return {"head": head, "header": header, "footer": footer}


def build_meta(parts: dict, lang: str, title: str, description: str, keywords: str,
               canonical: str, theme: str = "drone") -> str:
    """Replace title/description/keywords/canonical in head."""
    head = parts["head"]
    # Replace title
    head = re.sub(r'<title>.*?</title>', f'<title>{title}</title>', head, count=1)
    # Replace description
    head = re.sub(
        r'<meta name="description" content="[^"]*"',
        f'<meta name="description" content="{description}"', head, count=1
    )
    # Replace keywords
    head = re.sub(
        r'<meta name="keywords" content="[^"]*"',
        f'<meta name="keywords" content="{keywords}"', head, count=1
    )
    # Replace canonical
    head = re.sub(
        r'<link rel="canonical" href="[^"]*"',
        f'<link rel="canonical" href="{canonical}"', head, count=1
    )
    # Add hreflang if lang is zh, also add en alternate
    if lang == "zh":
        # Inject hreflang en + zh-Hans
        en_url = canonical.replace("/zh/", "/")
        hreflang_html = (
            f'<link rel="alternate" hreflang="en" href="{en_url}" />\n  '
            f'<link rel="alternate" hreflang="zh-Hans" href="{canonical}" />\n  '
            f'<link rel="alternate" hreflang="x-default" href="{en_url}" />'
        )
        head = re.sub(
            r'(<link rel="canonical" href="[^"]*"[^/]*/>)',
            rf'\1\n  {hreflang_html}', head, count=1
        )
    return head


def make_intent_page(intent: dict, lang: str, parts: dict) -> str:
    """Build a wholesale/agency/export/oem page."""
    if lang == "zh":
        title = f"{intent['name_zh']} | 客信新材料 · KeXinMaterials B2B 工厂"
        desc = f"{intent['lead_zh']} 9 大产品线源头工厂,18,000㎡ 厂房,ISO9001/ROHS/CE/IP67 认证。询盘 kexin@beeaa.com,12 小时回复。"
        kw = f"{intent['name_zh']},OEM,ODM,源头工厂,客信新材料,KeXinMaterials,B2B,防护箱"
        lead = intent['lead_zh']
    else:
        title = f"{intent['name_en']} | KeXinMaterials B2B Source Factory"
        desc = f"{intent['lead_en']} 9 product lines, source factory, 18,000㎡ facility, ISO9001/ROHS/CE/IP67 certified. Inquire kexin@beeaa.com, 12-hour reply."
        kw = f"{intent['name_en']},OEM,ODM,source factory,KeXinMaterials,B2B,protective case"
        lead = intent['lead_en']

    # Cross-link 9 product lines
    pl_links_html = []
    for pl in PRODUCT_LINES:
        name = pl['name_zh'] if lang == 'zh' else pl['name_en']
        href = f"/{'zh/' if lang == 'zh' else ''}{pl['slug']}/"
        pl_links_html.append(f'<a href="{href}" class="card card-feature"><div class="card-body"><h3>{name}</h3><span class="card-cta">{"查看详情" if lang=="zh" else "View Details"} →</span></div></a>')

    if lang == "zh":
        body = f'''
<main id="main">
<section class="section" style="background:#F8FAFC;">
<div class="container">
<h1>{intent['name_zh']}</h1>
<p class="lead">{lead}</p>
<div class="btn-group" style="margin-top:1.5rem;">
  <a href="mailto:kexin@beeaa.com?subject={intent['name_zh']} 询盘" class="btn btn-lg cta-orange">📧 邮件询盘</a>
  <a href="https://wa.me/8613590555309" class="btn btn-lg cta-green" target="_blank" rel="noopener">💬 WhatsApp</a>
  <a href="/zh/oem/" class="btn btn-lg" style="background:#3B5BFF;color:#FFFFFF;">🚀 OEM/ODM 定制</a>
</div>
</div>
</section>

<section class="section">
<div class="container">
<h2>9 大产品线 (源头工厂全品类直供)</h2>
<div class="grid grid-3">
{''.join(pl_links_html)}
</div>
</div>
</section>

<section class="section" style="background:#F8FAFC;">
<div class="container">
<h2>为什么选择客信新材料做 {intent['name_zh']}?</h2>
<div class="grid grid-3">
  <div class="card"><div class="card-body">
    <h3>🏭 源头工厂</h3>
    <p>18,000㎡ 自建厂房,2014 年成立,不是贸易商。从材料改性到出货全流程自主控制。</p>
  </div></div>
  <div class="card"><div class="card-body">
    <h3>💰 工厂直供价</h3>
    <p>经销价低于市场 20-35%,无中间商加价。批量大单另有专项折扣。</p>
  </div></div>
  <div class="card"><div class="card-body">
    <h3>⏱️ 12 小时报价</h3>
    <p>询盘后 12 小时内报价。30-45 天交付。紧急订单 15-20 天可加急。</p>
  </div></div>
  <div class="card"><div class="card-body">
    <h3>🌍 全球出口</h3>
    <p>13 年出口经验,50+ 国家客户。FOB 深圳 / 宁波港。</p>
  </div></div>
  <div class="card"><div class="card-body">
    <h3>📋 全认证</h3>
    <p>ISO9001 / ROHS / CE / SGS / MAC / IP67 / 加州 65。20+ 外观设计专利。</p>
  </div></div>
  <div class="card"><div class="card-body">
    <h3>🛠️ 灵活定制</h3>
    <p>3D 设计 3 天,打样 7-10 天,开模 45 天,量产 30 天。Logo / 颜色 / 尺寸全定制。</p>
  </div></div>
</div>
</div>
</section>

<section class="section">
<div class="container">
<h2>{intent['name_zh']} 流程</h2>
<div class="grid grid-4">
  <div class="card"><div class="card-body" style="text-align:center;">
    <div style="font-size:2.5rem;font-weight:800;color:#3B5BFF;">1</div>
    <h3>询盘</h3>
    <p>邮件 / WhatsApp 提供数量、尺寸、用途、认证</p>
  </div></div>
  <div class="card"><div class="card-body" style="text-align:center;">
    <div style="font-size:2.5rem;font-weight:800;color:#3B5BFF;">2</div>
    <h3>报价</h3>
    <p>12 小时内工厂报价 + 交期 + 物流方案</p>
  </div></div>
  <div class="card"><div class="card-body" style="text-align:center;">
    <div style="font-size:2.5rem;font-weight:800;color:#3B5BFF;">3</div>
    <h3>打样</h3>
    <p>标准 SKU 现货 / 定制 7-10 天打样</p>
  </div></div>
  <div class="card"><div class="card-body" style="text-align:center;">
    <div style="font-size:2.5rem;font-weight:800;color:#3B5BFF;">4</div>
    <h3>量产</h3>
    <p>30-45 天量产,FOB 深圳 / 宁波港</p>
  </div></div>
</div>
</div>
</section>

<section class="section" style="background:#0F172A;color:#FFFFFF;">
<div class="container" style="text-align:center;">
  <h2 style="color:#FFFFFF;">立即询盘,12 小时报价</h2>
  <p style="color:#CBD5E1;">源头工厂 · 30 天交付 · 12 小时响应</p>
  <div class="btn-group">
    <a href="mailto:kexin@beeaa.com?subject={intent['name_zh']} 询盘" class="btn btn-lg cta-orange">📧 邮件询盘</a>
    <a href="https://wa.me/8613590555309" class="btn btn-lg cta-green" target="_blank" rel="noopener">💬 WhatsApp</a>
  </div>
</div>
</section>
</main>'''
    else:
        body = f'''
<main id="main">
<section class="section" style="background:#F8FAFC;">
<div class="container">
<h1>{intent['name_en']}</h1>
<p class="lead">{lead}</p>
<div class="btn-group" style="margin-top:1.5rem;">
  <a href="mailto:kexin@beeaa.com?subject={intent['name_en']} inquiry" class="btn btn-lg cta-orange">📧 Email Inquiry</a>
  <a href="https://wa.me/8613590555309" class="btn btn-lg cta-green" target="_blank" rel="noopener">💬 WhatsApp</a>
  <a href="/oem/" class="btn btn-lg" style="background:#3B5BFF;color:#FFFFFF;">🚀 OEM/ODM Custom</a>
</div>
</div>
</section>

<section class="section">
<div class="container">
<h2>9 Product Lines (Source Factory Direct Supply)</h2>
<div class="grid grid-3">
{''.join(pl_links_html)}
</div>
</div>
</section>

<section class="section" style="background:#F8FAFC;">
<div class="container">
<h2>Why Choose KeXinMaterials for {intent['name_en']}?</h2>
<div class="grid grid-3">
  <div class="card"><div class="card-body">
    <h3>🏭 Source Factory</h3>
    <p>18,000㎡ self-built facility, established 2014, not a trader. Material compounding to shipping all in-house.</p>
  </div></div>
  <div class="card"><div class="card-body">
    <h3>💰 Factory Direct Price</h3>
    <p>20-35% below market. Bulk orders with special discount.</p>
  </div></div>
  <div class="card"><div class="card-body">
    <h3>⏱️ 12-Hour Quote</h3>
    <p>Inquiry to factory quote within 12 hours. 30-45 day delivery. Rush 15-20 days available.</p>
  </div></div>
  <div class="card"><div class="card-body">
    <h3>🌍 Global Export</h3>
    <p>13 years export, 50+ country clients. FOB Shenzhen / Ningbo Port.</p>
  </div></div>
  <div class="card"><div class="card-body">
    <h3>📋 Full Certification</h3>
    <p>ISO9001 / ROHS / CE / SGS / MAC / IP67 / California Prop 65. 20+ design patents.</p>
  </div></div>
  <div class="card"><div class="card-body">
    <h3>🛠️ Flexible Custom</h3>
    <p>3D design 3 days, sample 7-10 days, mold 45 days, mass production 30 days. Logo / color / size fully custom.</p>
  </div></div>
</div>
</div>
</section>

<section class="section">
<div class="container">
<h2>{intent['name_en']} Process</h2>
<div class="grid grid-4">
  <div class="card"><div class="card-body" style="text-align:center;">
    <div style="font-size:2.5rem;font-weight:800;color:#3B5BFF;">1</div>
    <h3>Inquiry</h3>
    <p>Email / WhatsApp qty, size, use case, certification</p>
  </div></div>
  <div class="card"><div class="card-body" style="text-align:center;">
    <div style="font-size:2.5rem;font-weight:800;color:#3B5BFF;">2</div>
    <h3>Quote</h3>
    <p>12-hour factory quote + lead time + shipping plan</p>
  </div></div>
  <div class="card"><div class="card-body" style="text-align:center;">
    <div style="font-size:2.5rem;font-weight:800;color:#3B5BFF;">3</div>
    <h3>Sample</h3>
    <p>Standard SKU in stock / custom 7-10 days</p>
  </div></div>
  <div class="card"><div class="card-body" style="text-align:center;">
    <div style="font-size:2.5rem;font-weight:800;color:#3B5BFF;">4</div>
    <h3>Mass Production</h3>
    <p>30-45 day production, FOB Shenzhen / Ningbo</p>
  </div></div>
</div>
</div>
</section>

<section class="section" style="background:#0F172A;color:#FFFFFF;">
<div class="container" style="text-align:center;">
  <h2 style="color:#FFFFFF;">Inquire Now, 12-Hour Quote</h2>
  <p style="color:#CBD5E1;">Source Factory · 30-Day Delivery · 12-Hour Response</p>
  <div class="btn-group">
    <a href="mailto:kexin@beeaa.com?subject={intent['name_en']} inquiry" class="btn btn-lg cta-orange">📧 Email Inquiry</a>
    <a href="https://wa.me/8613590555309" class="btn btn-lg cta-green" target="_blank" rel="noopener">💬 WhatsApp</a>
  </div>
</div>
</section>
</main>'''

    head = build_meta(parts, lang, title, desc, kw, parts['_canonical_base'])
    html = (
        '<!DOCTYPE html>\n'
        + head + '\n'
        + parts['_body_open'] + '\n'
        + parts['header'] + '\n'
        + body + '\n'
        + parts['footer']
    )
    return html


def make_market_page(market: dict, lang: str, parts: dict) -> str:
    """Build a market detail page (north-america, europe, etc.)."""
    if lang == "zh":
        title = f"{market['name_zh']} - 客信新材料 B2B 出口市场 | 客信新材料 · KeXinMaterials"
        desc = f"{market['lead_zh']} {market['name_zh']} 详情: 认证 {market['cert_zh']}、目的港 {market['shipping_zh']}、MOQ {market['moq_zh']}、付款 {market['payment_zh']}。9 大产品线源头工厂,18,000㎡ 厂房,30-45 天交付。"
        kw = f"{market['name_zh']},{market['countries_zh']},OEM,ODM,源头工厂,客信新材料,KeXinMaterials,B2B 出口"
        h1 = market['name_zh']
        lead = market['lead_zh']
        cert_label = "本地认证"
        ship_label = "海运路线"
        moq_label = "MOQ 政策"
        pay_label = "付款方式"
        products_label = "畅销产品"
        countries_label = "覆盖国家"
        currency_label = "结算货币"
    else:
        title = f"{market['name_en']} - KeXinMaterials B2B Export Market | Source Factory"
        desc = f"{market['lead_en']} {market['name_en']} details: certs {market['cert_en']}, shipping {market['shipping_en']}, MOQ {market['moq_en']}, payment {market['payment_en']}. 9 product lines source factory, 18,000㎡ facility, 30-45 day delivery."
        kw = f"{market['name_en']},{market['countries_en']},OEM,ODM,source factory,KeXinMaterials,B2B export"
        h1 = market['name_en']
        lead = market['lead_en']
        cert_label = "Local Certifications"
        ship_label = "Shipping Routes"
        moq_label = "MOQ Policy"
        pay_label = "Payment Terms"
        products_label = "Best-Selling Products"
        countries_label = "Coverage Countries"
        currency_label = "Settlement Currency"

    pl_links_html = []
    for pl in PRODUCT_LINES:
        name = pl['name_zh'] if lang == 'zh' else pl['name_en']
        href = f"/{'zh/' if lang == 'zh' else ''}{pl['slug']}/"
        pl_links_html.append(f'<a href="{href}" class="card card-feature"><div class="card-body"><h3>{name}</h3><span class="card-cta">{"查看详情" if lang=="zh" else "View Details"} →</span></div></a>')

    if lang == "zh":
        body = f'''
<main id="main">
<section class="section" style="background:#F8FAFC;">
<div class="container">
<h1>{h1}</h1>
<p class="lead">{lead}</p>
<div class="btn-group" style="margin-top:1.5rem;">
  <a href="mailto:kexin@beeaa.com?subject={market['name_zh']} 询盘" class="btn btn-lg cta-orange">📧 邮件询盘</a>
  <a href="https://wa.me/8613590555309" class="btn btn-lg cta-green" target="_blank" rel="noopener">💬 WhatsApp</a>
  <a href="/zh/export/" class="btn btn-lg" style="background:#3B5BFF;color:#FFFFFF;">🌍 全球供货</a>
</div>
</div>
</section>

<section class="section">
<div class="container">
<div class="grid grid-2">
  <div class="card"><div class="card-body">
    <h3>💰 {currency_label}</h3>
    <p style="font-size:1.5rem;font-weight:700;">{market['currency']}</p>
  </div></div>
  <div class="card"><div class="card-body">
    <h3>🌍 {countries_label}</h3>
    <p style="font-size:1.1rem;">{market['countries_zh']}</p>
  </div></div>
</div>
</div>
</section>

<section class="section" style="background:#F8FAFC;">
<div class="container">
<h2>本地化要求</h2>
<div class="grid grid-2">
  <div class="card"><div class="card-body">
    <h3>📋 {cert_label}</h3>
    <p style="font-size:1.1rem;line-height:1.8;">{market['cert_zh']}</p>
  </div></div>
  <div class="card"><div class="card-body">
    <h3>🚢 {ship_label}</h3>
    <p style="font-size:1.1rem;line-height:1.8;">{market['shipping_zh']}</p>
  </div></div>
  <div class="card"><div class="card-body">
    <h3>📦 {moq_label}</h3>
    <p style="font-size:1.1rem;line-height:1.8;">{market['moq_zh']}</p>
  </div></div>
  <div class="card"><div class="card-body">
    <h3>💳 {pay_label}</h3>
    <p style="font-size:1.1rem;line-height:1.8;">{market['payment_zh']}</p>
  </div></div>
</div>
</div>
</section>

<section class="section">
<div class="container">
<h2>{products_label}</h2>
<p class="lead">{market['key_products_zh']}</p>
<div class="grid grid-3">
{''.join(pl_links_html)}
</div>
</div>
</section>

<section class="section" style="background:#0F172A;color:#FFFFFF;">
<div class="container" style="text-align:center;">
  <h2 style="color:#FFFFFF;">{market['name_zh']} 询盘,12 小时报价</h2>
  <p style="color:#CBD5E1;">源头工厂 · {market['countries_zh']} · {market['cert_zh']}</p>
  <div class="btn-group">
    <a href="mailto:kexin@beeaa.com?subject={market['name_zh']} 询盘" class="btn btn-lg cta-orange">📧 邮件询盘</a>
    <a href="https://wa.me/8613590555309" class="btn btn-lg cta-green" target="_blank" rel="noopener">💬 WhatsApp</a>
  </div>
</div>
</section>
</main>'''
    else:
        body = f'''
<main id="main">
<section class="section" style="background:#F8FAFC;">
<div class="container">
<h1>{h1}</h1>
<p class="lead">{lead}</p>
<div class="btn-group" style="margin-top:1.5rem;">
  <a href="mailto:kexin@beeaa.com?subject={market['name_en']} inquiry" class="btn btn-lg cta-orange">📧 Email Inquiry</a>
  <a href="https://wa.me/8613590555309" class="btn btn-lg cta-green" target="_blank" rel="noopener">💬 WhatsApp</a>
  <a href="/export/" class="btn btn-lg" style="background:#3B5BFF;color:#FFFFFF;">🌍 Global Supply</a>
</div>
</div>
</section>

<section class="section">
<div class="container">
<div class="grid grid-2">
  <div class="card"><div class="card-body">
    <h3>💰 {currency_label}</h3>
    <p style="font-size:1.5rem;font-weight:700;">{market['currency']}</p>
  </div></div>
  <div class="card"><div class="card-body">
    <h3>🌍 {countries_label}</h3>
    <p style="font-size:1.1rem;">{market['countries_en']}</p>
  </div></div>
</div>
</div>
</section>

<section class="section" style="background:#F8FAFC;">
<div class="container">
<h2>Localized Requirements</h2>
<div class="grid grid-2">
  <div class="card"><div class="card-body">
    <h3>📋 {cert_label}</h3>
    <p style="font-size:1.1rem;line-height:1.8;">{market['cert_en']}</p>
  </div></div>
  <div class="card"><div class="card-body">
    <h3>🚢 {ship_label}</h3>
    <p style="font-size:1.1rem;line-height:1.8;">{market['shipping_en']}</p>
  </div></div>
  <div class="card"><div class="card-body">
    <h3>📦 {moq_label}</h3>
    <p style="font-size:1.1rem;line-height:1.8;">{market['moq_en']}</p>
  </div></div>
  <div class="card"><div class="card-body">
    <h3>💳 {pay_label}</h3>
    <p style="font-size:1.1rem;line-height:1.8;">{market['payment_en']}</p>
  </div></div>
</div>
</div>
</section>

<section class="section">
<div class="container">
<h2>{products_label}</h2>
<p class="lead">{market['key_products_en']}</p>
<div class="grid grid-3">
{''.join(pl_links_html)}
</div>
</div>
</section>

<section class="section" style="background:#0F172A;color:#FFFFFF;">
<div class="container" style="text-align:center;">
  <h2 style="color:#FFFFFF;">{market['name_en']} Inquiry, 12-Hour Quote</h2>
  <p style="color:#CBD5E1;">Source Factory · {market['countries_en']} · {market['cert_en']}</p>
  <div class="btn-group">
    <a href="mailto:kexin@beeaa.com?subject={market['name_en']} inquiry" class="btn btn-lg cta-orange">📧 Email Inquiry</a>
    <a href="https://wa.me/8613590555309" class="btn btn-lg cta-green" target="_blank" rel="noopener">💬 WhatsApp</a>
  </div>
</div>
</section>
</main>'''

    head = build_meta(parts, lang, title, desc, kw, parts['_canonical_base'])
    html = (
        '<!DOCTYPE html>\n'
        + head + '\n'
        + parts['_body_open'] + '\n'
        + parts['header'] + '\n'
        + body + '\n'
        + parts['footer']
    )
    return html


def make_faq_page(faq_data: list, lang: str, parts: dict) -> str:
    """Build FAQ page with all Q&A."""
    if lang == "zh":
        title = "FAQ 常见问答 | 客信新材料 · 客信新材料 B2B 工厂"
        desc = "客信新材料 FAQ 常见问答 20 题:工厂 / OEM/ODM / MOQ / 认证 / 付款 / 交期 / 包装 / 样品 / 代理 / 保修 / 验厂 / 环保 / 紧急 / 海外仓 / Logo 定制 / 物流"
        kw = "FAQ,常见问答,客信新材料,OEM,ODM,MOQ,认证,付款方式,交期,包装,样品,代理,保修,验厂"
        h1 = "FAQ 常见问答"
        lead = "客信新材料 13 年 B2B 防护箱工厂,这里是最常被问到的 20 个问题。涵盖工厂背景、OEM/ODM、MOQ、认证、付款、交期、包装、样品、代理、保修、验厂等。"
    else:
        title = "FAQ Frequently Asked Questions | KeXinMaterials B2B Factory"
        desc = "KeXinMaterials FAQ 20 questions: factory / OEM/ODM / MOQ / certs / payment / lead time / packaging / sample / agency / warranty / audit / eco / rush / overseas warehouse / logo / shipping"
        kw = "FAQ,frequently asked questions,KeXinMaterials,OEM,ODM,MOQ,certifications,payment,lead time,packaging,sample,agency,warranty,factory audit"
        h1 = "FAQ Frequently Asked Questions"
        lead = "KeXinMaterials 13 years B2B protective case factory. Here are 20 most common questions covering factory, OEM/ODM, MOQ, certifications, payment, lead time, packaging, sample, agency, warranty, factory audit, etc."

    # Render Q&A
    faq_html_items = []
    for i, (q, a) in enumerate(faq_data, 1):
        faq_html_items.append(f'''
<details class="faq-item">
  <summary>{q}</summary>
  <p>{a}</p>
</details>''')

    # Product line cross-links
    pl_links_html = []
    for pl in PRODUCT_LINES:
        name = pl['name_zh'] if lang == 'zh' else pl['name_en']
        href = f"/{'zh/' if lang == 'zh' else ''}{pl['slug']}/"
        pl_links_html.append(f'<a href="{href}" class="card card-feature"><div class="card-body"><h3>{name}</h3><span class="card-cta">{"查看详情" if lang=="zh" else "View Details"} →</span></div></a>')

    if lang == "zh":
        body = f'''
<main id="main">
<section class="section" style="background:#F8FAFC;">
<div class="container">
<h1>{h1}</h1>
<p class="lead">{lead}</p>
<div class="btn-group" style="margin-top:1.5rem;">
  <a href="mailto:kexin@beeaa.com?subject=FAQ 询盘" class="btn btn-lg cta-orange">📧 邮件询盘</a>
  <a href="https://wa.me/8613590555309" class="btn btn-lg cta-green" target="_blank" rel="noopener">💬 WhatsApp</a>
</div>
</div>
</section>

<section class="section">
<div class="container">
<h2>20 个常见问答</h2>
<div class="faq-list">
{''.join(faq_html_items)}
</div>
</div>
</section>

<section class="section" style="background:#F8FAFC;">
<div class="container">
<h2>9 大产品线</h2>
<div class="grid grid-3">
{''.join(pl_links_html)}
</div>
</div>
</section>

<section class="section" style="background:#0F172A;color:#FFFFFF;">
<div class="container" style="text-align:center;">
  <h2 style="color:#FFFFFF;">还有其他问题?</h2>
  <p style="color:#CBD5E1;">12 小时内回复</p>
  <div class="btn-group">
    <a href="mailto:kexin@beeaa.com?subject=FAQ 询盘" class="btn btn-lg cta-orange">📧 邮件询盘</a>
    <a href="https://wa.me/8613590555309" class="btn btn-lg cta-green" target="_blank" rel="noopener">💬 WhatsApp</a>
  </div>
</div>
</section>
</main>'''
    else:
        body = f'''
<main id="main">
<section class="section" style="background:#F8FAFC;">
<div class="container">
<h1>{h1}</h1>
<p class="lead">{lead}</p>
<div class="btn-group" style="margin-top:1.5rem;">
  <a href="mailto:kexin@beeaa.com?subject=FAQ inquiry" class="btn btn-lg cta-orange">📧 Email Inquiry</a>
  <a href="https://wa.me/8613590555309" class="btn btn-lg cta-green" target="_blank" rel="noopener">💬 WhatsApp</a>
</div>
</div>
</section>

<section class="section">
<div class="container">
<h2>20 Common Questions</h2>
<div class="faq-list">
{''.join(faq_html_items)}
</div>
</div>
</section>

<section class="section" style="background:#F8FAFC;">
<div class="container">
<h2>9 Product Lines</h2>
<div class="grid grid-3">
{''.join(pl_links_html)}
</div>
</div>
</section>

<section class="section" style="background:#0F172A;color:#FFFFFF;">
<div class="container" style="text-align:center;">
  <h2 style="color:#FFFFFF;">Other Questions?</h2>
  <p style="color:#CBD5E1;">12-hour response</p>
  <div class="btn-group">
    <a href="mailto:kexin@beeaa.com?subject=FAQ inquiry" class="btn btn-lg cta-orange">📧 Email Inquiry</a>
    <a href="https://wa.me/8613590555309" class="btn btn-lg cta-green" target="_blank" rel="noopener">💬 WhatsApp</a>
  </div>
</div>
</section>
</main>'''

    head = build_meta(parts, lang, title, desc, kw, parts['_canonical_base'])
    html = (
        '<!DOCTYPE html>\n'
        + head + '\n'
        + parts['_body_open'] + '\n'
        + parts['header'] + '\n'
        + body + '\n'
        + parts['footer']
    )
    return html


def main():
    base = Path(r"C:\Users\Administrator\.minimax\workspace\box-beeaa-site")

    # Read EN and ZH home pages as template sources
    for lang, dist_root, dist_prefix in [
        ("en", base / "dist", ""),
        ("zh", base / "dist", "zh"),
    ]:
        home_path = dist_root / dist_prefix / "index.html"
        if not home_path.exists():
            print(f"SKIP {lang}: home not found at {home_path}")
            continue
        home_html = home_path.read_text(encoding="utf-8")
        parts = extract_template_parts(home_html)
        # Find <body> open tag
        body_open_match = re.search(r'<body[^>]*>', home_html)
        parts['_body_open'] = body_open_match.group(0) if body_open_match else '<body>'

    # Generate for each lang
    total = 0
    for lang in ["zh", "en"]:
        dist_root = base / "dist"
        dist_prefix = "zh" if lang == "zh" else ""
        home_path = dist_root / dist_prefix / "index.html"
        if not home_path.exists():
            continue

        home_html = home_path.read_text(encoding="utf-8")
        parts = extract_template_parts(home_html)
        body_open_match = re.search(r'<body[^>]*>', home_html)
        parts['_body_open'] = body_open_match.group(0) if body_open_match else '<body>'

        domain = "box.beeaa.com"
        if lang == "zh":
            parts['_canonical_base'] = f"https://{domain}/zh/"
        else:
            parts['_canonical_base'] = f"https://{domain}/"

        # 1. 4 commercialIntents (wholesale/agency/oem/export)
        for intent in INTENTS:
            slug = intent['slug']
            out_dir = dist_root / dist_prefix / slug
            out_dir.mkdir(parents=True, exist_ok=True)
            # Override canonical for this page
            parts['_canonical_base'] = f"https://{domain}/{'zh/' if lang == 'zh' else ''}{slug}/"
            html = make_intent_page(intent, lang, parts)
            (out_dir / "index.html").write_text(html, encoding="utf-8")
            total += 1
            print(f"  [OK] {lang}/{slug}/index.html  ({len(html)} bytes)")

        # 2. 6 markets
        for market in MARKETS:
            slug = market['slug']
            out_dir = dist_root / dist_prefix / "markets" / slug
            out_dir.mkdir(parents=True, exist_ok=True)
            parts['_canonical_base'] = f"https://{domain}/{'zh/' if lang == 'zh' else ''}markets/{slug}/"
            html = make_market_page(market, lang, parts)
            (out_dir / "index.html").write_text(html, encoding="utf-8")
            total += 1
            print(f"  [OK] {lang}/markets/{slug}/index.html  ({len(html)} bytes)")

        # 3. FAQ
        out_dir = dist_root / dist_prefix / "faq"
        out_dir.mkdir(parents=True, exist_ok=True)
        parts['_canonical_base'] = f"https://{domain}/{'zh/' if lang == 'zh' else ''}faq/"
        faq_data = FAQ_ZH if lang == "zh" else FAQ_EN
        html = make_faq_page(faq_data, lang, parts)
        (out_dir / "index.html").write_text(html, encoding="utf-8")
        total += 1
        print(f"  [OK] {lang}/faq/index.html  ({len(html)} bytes)")

    print(f"\n=== Total: {total} files generated ===")


if __name__ == "__main__":
    main()
