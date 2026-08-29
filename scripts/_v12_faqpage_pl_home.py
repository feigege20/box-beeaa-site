#!/usr/bin/env python3
"""
V13: FAQPage schema injection for 9 PL home pages
- 9 PLs: camera-stage-case, drone-case, engineering-plastic-case, instrument-case,
  medical-case, military-tactical-case, tool-box, trolley-case, waterproof-case
- Add FAQPage JSON-LD with 5 B2B-relevant Q&A per PL
- Inject into <head> before </head>
"""
import os
from pathlib import Path

ROOT = Path(r"C:\Users\Administrator\.minimax\workspace\box-beeaa-site")
DST_PAGES = ROOT / "dist-pages"

# 9 PL definitions with 5 FAQ Q&A each
PL_FAQS = {
    "waterproof-case": {
        "name": "Waterproof Cases",
        "faqs": [
            {"q": "What's the difference between IP67 and IP68?", "a": "IP67 = dust tight + temporary immersion (1m for 30 min). IP68 = dust tight + continuous immersion (typically 3m+ for extended periods). For most outdoor and marine use, IP67 is sufficient. IP68 is required for sustained underwater use like diving."},
            {"q": "Can waterproof cases be used in extreme temperatures?", "a": "Yes, our waterproof cases operate from -40°C to +120°C. The polypropylene (PP) and ABS+PC materials maintain structural integrity across this range, making them suitable for arctic expeditions, desert operations, and industrial environments."},
            {"q": "What's the MOQ for custom waterproof cases?", "a": "Standard SKU MOQ is 100 units. Custom OEM (color, logo, foam insert) MOQ is 500 units. Mold customization for unique dimensions requires 1,000+ units. Sample lead time is 7 days, mass production 30-45 days."},
            {"q": "Do you provide IP rating test reports?", "a": "Yes, we provide IP67 and IP68 test reports from accredited labs (SGS, TUV Rheinland, BV). Test reports are issued per batch or per design. Sample reports available on request for serious RFQ evaluation."},
            {"q": "What industries use waterproof cases from KeXinMaterials?", "a": "Primary users: outdoor/marine (fishing, kayaking, diving), photography (underwater, expedition), military/tactical (field operations, drone transport), industrial (oil & gas, mining, utilities), and emergency services. 50+ countries, top destinations USA, Germany, UK, Australia."},
        ],
    },
    "drone-case": {
        "name": "Drone Cases",
        "faqs": [
            {"q": "Which drone models fit your cases?", "a": "Our drone cases fit DJI Mavic 3/Pro/Classic, DJI Air series, DJI Mini series, Autel EVO Lite/Lite+, Autel EVO II, Skydio 2/2+/X2, and custom foam inserts for any commercial drone. Custom foam cut available for new models on request."},
            {"q": "Can the case charge the drone while inside?", "a": "Yes, select models have built-in charging ports (USB-C, DJI proprietary, or custom). The case can be ordered with or without charging capability. Charging case variants add 8-15% to unit cost but save field setup time."},
            {"q": "How much foam customization is included?", "a": "Standard pluck foam (pre-cut grid) is included. Custom CNC-cut foam (precision-cut for specific drone + accessories) is $50-200 setup fee, included in orders of 100+ units. We provide foam design service with 3D preview before production."},
            {"q": "What's the lead time for custom drone cases?", "a": "Standard SKU: 7-day sample, 30-45 day mass production. Custom foam + color: 14-day sample, 30-45 day mass production. Custom dimensions + foam: 30-day sample, 45-60 day mass production. Rush 15-day available at 15% premium."},
            {"q": "Do you offer OEM branding on drone cases?", "a": "Yes, OEM options include: laser-etched logo, custom color (Pantone matching for 500+ units), branded latches, custom foam colors, packaging with your brand. Minimum 500 units for full OEM customization."},
        ],
    },
    "military-tactical-case": {
        "name": "Military & Tactical Cases",
        "faqs": [
            {"q": "What MIL-SPEC standards do your cases meet?", "a": "Our military cases meet MIL-STD-810H (environmental: drop, vibration, temperature, humidity, rain, sand, immersion, shock), MIL-STD-461 (EMI/RFI shielding, optional), and IP67/IP68 ratings. Test reports from SGS, TUV Rheinland, BV available."},
            {"q": "Are your cases used by defense contractors?", "a": "Yes, we supply to defense contractors, government agencies, and tactical operators in 15+ countries. Use cases include: rifle cases, optics transport, communication equipment, drone cases, sensitive electronics, medical kits. NDA and ITAR compliance available."},
            {"q": "What's the difference between roto-molded and injection-molded military cases?", "a": "Roto-molded cases: thicker walls (4-6mm), better impact resistance, heavier (3-5kg), suitable for heavy weapons. Injection-molded cases: thinner walls (2-3mm), lighter (1-3kg), better for tactical field use. Both meet MIL-STD-810H, choose based on weight vs ruggedness."},
            {"q": "Can you provide EMI/RFI shielding?", "a": "Yes, optional MIL-STD-461 EMI/RFI shielding with 60-100 dB effectiveness. Conductive coating applied to interior, suitable for radios, encrypted devices, sensitive electronics. Adds 20-35% to unit cost, requires 100+ unit MOQ."},
            {"q": "What colors and patterns are available for tactical cases?", "a": "Standard: black, olive drab, tan, desert sand, gray, white. Custom: multicam, ATACS, A-TACS AU, Kryptek, PenCott (MOQ 1,000+). Camouflage patterns add 30-50% to unit cost due to mold customization."},
        ],
    },
    "tool-box": {
        "name": "Tool Boxes",
        "faqs": [
            {"q": "What materials are your tool boxes made from?", "a": "Primary material is PP (polypropylene) for impact resistance and chemical resistance. Premium lines use PP+GF (glass fiber reinforced) for higher rigidity. Steel and aluminum options available for heavy-duty industrial use. All materials are recyclable."},
            {"q": "Can tool boxes be stackable and modular?", "a": "Yes, our modular stack system allows multiple sizes to interlock. Stack heights: 50mm, 100mm, 150mm, 200mm, 300mm. Compatible with major European/US tool box modular systems. Custom configurations available for OEM orders."},
            {"q": "What's the weight capacity of your tool boxes?", "a": "PP tool boxes: 30kg load capacity. PP+GF tool boxes: 50kg load capacity. Steel tool boxes: 80kg load capacity. Rolling tool chests: 200kg load capacity. All tested with 2x safety factor for static load."},
            {"q": "Do you offer tool boxes with wheels?", "a": "Yes, rolling tool boxes available in 50L, 75L, 100L, 150L, 200L capacities. Heavy-duty casters support up to 200kg. Telescopic handles for easy transport. Suitable for mechanics, electricians, factory maintenance."},
            {"q": "Are your tool boxes suitable for industrial chemical environments?", "a": "Yes, PP material is resistant to most acids, alkalis, oils, and solvents. Suitable for automotive, chemical, oil & gas, marine, and industrial use. ROHS and REACH SVHC compliant. We provide chemical resistance test reports on request."},
        ],
    },
    "instrument-case": {
        "name": "Instrument Cases",
        "faqs": [
            {"q": "What instruments do your cases protect?", "a": "Our cases protect: surveying equipment (total stations, GNSS receivers, theodolites), medical instruments, test & measurement equipment, optical devices, scientific instruments, precision sensors. Custom foam inserts for any instrument."},
            {"q": "How do you ensure instrument calibration during transport?", "a": "Our cases feature: precision-cut foam (vibration damping), internal suspension systems, anti-static foam for electronics, custom cradles for fragile parts. We work with instrument manufacturers to validate calibration preservation during typical transport shocks."},
            {"q": "What IP rating is suitable for field instruments?", "a": "IP65 minimum for outdoor use (dust + water jets). IP67 for rain and temporary immersion. IP68 for marine or sustained water exposure. Most field instruments use IP67 cases. We recommend IP rating based on your specific use environment."},
            {"q": "Do you provide foam design service for custom instruments?", "a": "Yes, we provide 3D foam design service. Customer provides 3D model (STEP, IGES) or physical instrument. We create foam design with cavities, dividers, accessory slots. Design preview within 3-5 days, sample foam within 7-10 days."},
            {"q": "Are your instrument cases suitable for air transport?", "a": "Yes, our cases meet IATA standards for checked and carry-on luggage. Pressure equalization valves for air transport. TSA-approved locks available. Lightweight design to minimize excess baggage fees. Many models fit airline carry-on size limits."},
        ],
    },
    "medical-case": {
        "name": "Medical Cases",
        "faqs": [
            {"q": "What medical applications do your cases serve?", "a": "Our medical cases serve: emergency medical services (EMS), military field medicine, disaster response, remote clinics, veterinary, dental, first aid kits, medical device transport, pharmaceutical cold chain (with insulation), diagnostic equipment."},
            {"q": "Are your medical cases FDA / CE compliant?", "a": "Yes, we provide CE marking for EU MDR compliance, and FDA-registered manufacturing for US market. We follow ISO 13485 quality management for medical device accessories. Documentation available for regulatory submissions."},
            {"q": "Can cases maintain temperature for cold chain medical supplies?", "a": "Yes, with optional insulation inserts, our cases maintain 2-8°C for 4-8 hours using gel packs, or 24+ hours with phase change material (PCM) packs. Validated for vaccine, insulin, biological sample transport. Cold chain validation reports provided."},
            {"q": "How are medical cases sterilized?", "a": "Our cases are designed for hospital-grade disinfection: alcohol wipes (70% IPA), quaternary ammonium compounds, hydrogen peroxide vapor. Material withstands 1000+ wipe cycles without degradation. Autoclavable foam inserts available for surgical instrument transport."},
            {"q": "What's the difference between medical kit case and first aid case?", "a": "Medical kit case: designed for diagnostic + treatment equipment (sphygmomanometer, otoscope, prescription drugs). First aid case: designed for emergency response (bandages, AED, trauma supplies). Different internal layouts and access patterns for use case."},
        ],
    },
    "engineering-plastic-case": {
        "name": "Engineering Plastic Cases",
        "faqs": [
            {"q": "What is engineering plastic vs regular plastic?", "a": "Engineering plastics (PP+GF, ABS+PC, PA) have enhanced mechanical, thermal, and chemical properties vs commodity plastics. They offer higher impact strength, better temperature resistance, longer fatigue life, suitable for industrial and protective applications."},
            {"q": "Why choose engineering plastic cases over metal cases?", "a": "Engineering plastic cases are 30-50% lighter, corrosion-free, electrically insulating, easier to customize, and lower cost than metal. They have slightly lower impact resistance than steel but are sufficient for most industrial and consumer applications."},
            {"q": "What customization is available for engineering plastic cases?", "a": "Custom colors (Pantone matching), custom sizes (CNC machined molds), custom foam inserts, custom branding (logo, label), custom hardware (latches, hinges, locks), custom surface finish (smooth, textured, anti-slip), custom packaging."},
            {"q": "Are your engineering plastic cases recyclable?", "a": "Yes, our cases are 100% recyclable. We offer: standard PP/ABS (recyclable), recycled PP+GF (30% recycled content, no cost premium for 500+ units), bio-based ABS option (8% premium, sugarcane-derived). Cradle-to-cradle certification available."},
            {"q": "What's the operating temperature range?", "a": "Standard: -20°C to +80°C. Engineering grade: -40°C to +120°C. High-temp grade: -50°C to +150°C. Cold-temp flexibility additives available for arctic use. We select material based on your application temperature range."},
        ],
    },
    "camera-stage-case": {
        "name": "Camera & Stage Cases",
        "faqs": [
            {"q": "What camera equipment do your cases protect?", "a": "Our cases protect: DSLR cameras, mirrorless cameras, cinema cameras (RED, ARRI, Blackmagic), lenses, lighting equipment, audio gear, drones, gimbals, tripods, support equipment, studio accessories. Custom foam for any gear combination."},
            {"q": "Are the cases suitable for air travel with camera gear?", "a": "Yes, our cases are designed for air travel. Many models fit IATA carry-on size limits (56×36×23cm). TSA-approved locks available. Pressure equalization valves for cargo holds. We offer airline-specific compliance guidance for major carriers."},
            {"q": "What foam density is best for camera protection?", "a": "We use multi-density foam: high-density (50kg/m³) for support and structure, low-density (25kg/m³) for cushioning. Custom foam can include convoluted (egg crate) top layer for additional vibration absorption. Foam design service included with OEM."},
            {"q": "Can the cases accommodate camera bodies with lenses attached?", "a": "Yes, our custom foam designs accommodate common body+lens combinations: full-frame DSLR with 24-70mm f/2.8, mirrorless with telephoto, cinema cameras with matte box and follow focus. Foam cavities designed to your specific gear."},
            {"q": "Do you offer color options for camera cases?", "a": "Standard colors: black, gray, dark blue. Custom colors: any Pantone (MOQ 500+). Many photographers prefer all-black for professional appearance. Bright colors (orange, red, yellow) for high-visibility location work. Color coding for multi-case workflows."},
        ],
    },
    "trolley-case": {
        "name": "Trolley Cases",
        "faqs": [
            {"q": "What are trolley cases typically used for?", "a": "Trolley cases are used for: trade show equipment transport, mobile presentations, sales demo kits, mobile office equipment, audio/visual gear, broadcast equipment, military command posts, mobile medical clinics, remote work setups, conference materials."},
            {"q": "What sizes are available for trolley cases?", "a": "Standard sizes: 40L, 60L, 80L, 100L, 120L cabin trolley (fits IATA cabin limits). Custom sizes available for OEM. Telescopic handles for all sizes. Heavy-duty wheels for 100L+ cases. Custom sizes require 1,000+ unit MOQ."},
            {"q": "How much weight can trolley cases carry?", "a": "PP trolley cases: 30kg load capacity. PP+GF trolley cases: 50kg load capacity. Aluminum-frame trolley cases: 80kg load capacity. For heavy equipment, we recommend reinforced frame + 4-wheel swivel system + telescopic handle."},
            {"q": "Are trolley cases suitable as carry-on luggage?", "a": "Yes, our 40L and 60L trolley cases meet IATA cabin size limits (56×36×23cm). They fit overhead bins on most airlines. We provide airline-specific compliance documentation. Check with your carrier for specific weight limits."},
            {"q": "Do trolley cases have laptop/document compartments?", "a": "Yes, select models include padded laptop sleeve (fits up to 17\" laptop) and document organizer pocket. Foam dividers can be customized for laptops, tablets, files, and accessories. Detachable accessory pouches available for organization."},
        ],
    },
}


def inject_faqpage(html_content, faqs, pl_name):
    """Inject FAQPage JSON-LD into HTML before </head>"""
    faq_items = []
    for faq in faqs:
        faq_items.append({
            "@type": "Question",
            "name": faq["q"],
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq["a"]
            }
        })
    
    faqpage_json = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "name": f"{pl_name} - Frequently Asked Questions",
        "mainEntity": faq_items
    }
    
    import json
    faqpage_str = json.dumps(faqpage_json, ensure_ascii=False, indent=2)
    
    faq_script = f'\n<script type="application/ld+json">\n{faqpage_str}\n</script>\n'
    
    # Inject before </head>
    if '</head>' in html_content:
        new_content = html_content.replace('</head>', faq_script + '</head>', 1)
    else:
        new_content = html_content + faq_script
    
    return new_content


# ============= Process 9 PL home pages =============
print("=" * 60)
print("FAQPage schema injection for 9 PL home pages")
print("=" * 60)

total_count = 0
total_bytes = 0
for pl_slug, pl_data in PL_FAQS.items():
    en_file = DST_PAGES / pl_slug / "index.html"
    if not en_file.exists():
        print(f"  [SKIP] {pl_slug}/index.html not found")
        continue
    
    content = en_file.read_text(encoding="utf-8")
    # Check if FAQPage already injected
    if '"@type": "FAQPage"' in content:
        print(f"  [ALREADY] {pl_slug}/index.html has FAQPage")
        continue
    
    new_content = inject_faqpage(content, pl_data["faqs"], pl_data["name"])
    en_file.write_text(new_content, encoding="utf-8")
    
    # Stats
    bytes_added = len(new_content) - len(content)
    total_count += 1
    total_bytes += bytes_added
    print(f"  [OK] {pl_slug}/index.html: {len(pl_data['faqs'])} Q&A, +{bytes_added:,} bytes")

print(f"\nTotal: {total_count} PL home pages updated, +{total_bytes:,} bytes")


# ============= Also add FAQPage to /zh/ versions =============
print()
print("=" * 60)
print("FAQPage schema for /zh/ PL home pages (mirror, accept English body)")
print("=" * 60)

zh_count = 0
zh_bytes = 0
for pl_slug, pl_data in PL_FAQS.items():
    zh_file = DST_PAGES / "zh" / pl_slug / "index.html"
    if not zh_file.exists():
        # /zh/ versions are 9 PL home (no PL sub-PL pages)
        continue
    
    content = zh_file.read_text(encoding="utf-8")
    if '"@type": "FAQPage"' in content:
        print(f"  [ALREADY] zh/{pl_slug}/index.html has FAQPage")
        continue
    
    new_content = inject_faqpage(content, pl_data["faqs"], pl_data["name"])
    zh_file.write_text(new_content, encoding="utf-8")
    
    bytes_added = len(new_content) - len(content)
    zh_count += 1
    zh_bytes += bytes_added
    print(f"  [OK] zh/{pl_slug}/index.html: {len(pl_data['faqs'])} Q&A, +{bytes_added:,} bytes")

print(f"\nTotal ZH: {zh_count} PL home pages updated, +{zh_bytes:,} bytes")
print(f"\nGRAND TOTAL: {total_count + zh_count} files, +{total_bytes + zh_bytes:,} bytes")
