/**
 * 品类页渲染器（9 个）
 * 接收 productLine + 该品类下的关键词子集，渲染完整的品类聚合页
 */

import { siteConfig } from "./site.config.js";
import { renderHead, renderHeader, renderFooter, renderBreadcrumb, renderCTA } from "./layout.js";
import { sectionFAQs, sectionCase } from "./sections.js";
import { collectionPageSchema, faqSchema, breadcrumbSchema } from "./schemas.js";
import { firstPersonStatement, firstPersonPreference, unpublishedData, sGradeFirstPersonParagraph, dataSourceLabel } from "./content_variation.js";
import { readFileSync } from "node:fs";

// alt 本地化：英文页面只取英文部分（"English / 中文" 或 "中文 / English" 都自动识别），中文页保留全段
function altFor(img, t) {
  if (!img || !img.alt) return "";
  if (t) return img.alt;
  const parts = img.alt.split(" / ");
  for (const p of parts) {
    if (!/[\u4e00-\u9fff]/.test(p)) return p.trim();
  }
  return parts[0].trim();
}
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..", "..");

const BASE_URL = `${siteConfig.protocol}://${siteConfig.domain}`;

function esc(s) {
  if (s == null) return "";
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// EN render path: strip CJK runs from mixed en/zh keyword data so chips/text are pure English.
// Falls back to original input if stripping leaves an empty string.
function enClean(s) {
  if (!s || typeof s !== "string") return s;
  let r = s.replace(/[\s\u3000]*[\u4e00-\u9fff]+[\s\u3000]*/g, " ");
  r = r.replace(/\s+/g, " ").replace(/[-–—,.:;!?]+\s*$/, "").trim();
  return r || s;
}

function slugify(s) {
  if (!s) return "";
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fff-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

let _imagesCache = null;
function loadImages() {
  if (_imagesCache) return _imagesCache;
  _imagesCache = JSON.parse(readFileSync(resolve(PROJECT_ROOT, "data/assets/images.json"), "utf-8"));
  return _imagesCache;
}

function getProductImages(slug) {
  return loadImages().productLines?.[slug] || {};
}

export function renderCategoryPage({ productLine, keywords = [], lang = "en" }) {
  const t = lang === "zh";
  const basePrefix = t ? "/zh" : "";
  const canonical = `${BASE_URL}${basePrefix}/${productLine.slug}/`;

  const title = t
    ? `${productLine.name_zh}厂家 | ${productLine.name_zh} OEM/ODM 源头工厂 | 客信新材料`
    : `${productLine.name_en} Manufacturer | ${productLine.name_en} OEM/ODM | KeXinMaterials`;

  const description = t
    ? `${productLine.name_zh}源头工厂 - 客信新材料。${productLine.desc_zh.slice(0, 40)}。${keywords.length}+ SKU、30-45 天交付、IP67 认证。FOB 深圳/EXW 中山。`
    : `${productLine.name_en} manufacturer | KeXinMaterials. ${productLine.desc_en.slice(0, 80)}. ${keywords.length}+ SKUs, 30-45 day delivery, IP67 certified. FOB Shenzhen/EXW.`;

  // 关键词按 layer 分组
  const byLayer = {};
  for (const kw of keywords) {
    if (!byLayer[kw.layer]) byLayer[kw.layer] = [];
    byLayer[kw.layer].push(kw);
  }

  // 商业意图词（高频展示）
  const businessKeywords = (byLayer["商业"] || []).slice(0, 30);
  // 特性词
  const featureKeywords = (byLayer["特性"] || []).slice(0, 30);
  // 规格词
  const specKeywords = (byLayer["规格"] || []).slice(0, 12);
  // 疑问词
  const questionKeywords = (byLayer["疑问"] || []).slice(0, 10);
  // 长尾（前 60）
  const longtailKeywords = (byLayer["长尾"] || []).slice(0, 60);

  // FAQ
  const categoryFaqs = [
    { q_zh: `${productLine.name_zh}起订量是多少？`, q_en: `What is the MOQ for ${productLine.name_en}?`, a_zh: `标准 SKU 50-100 pcs，定制 300 pcs。批量越大单价越优惠。`, a_en: `Standard SKUs 50-100 pcs, custom 300 pcs. Larger quantities get better pricing.` },
    { q_zh: `${productLine.name_zh}能定制 logo 吗？`, q_en: `Can ${productLine.name_en} be customized with logo?`, a_zh: `可以。丝印、烫金、激光雕刻、UV 喷涂 4 种方式，最低 100pcs 起。`, a_en: `Yes. Silk-screen, hot stamping, laser engraving, UV spray - 4 options, MOQ 100pcs.` },
    { q_zh: `${productLine.name_zh}有哪些认证？`, q_en: `What certifications for ${productLine.name_en}?`, a_zh: `CE / RoHS / ISO9001 全系标配。UN38.3、FDA、UL、MIL-SPEC 可选。`, a_en: `CE / RoHS / ISO9001 standard. UN38.3, FDA, UL, MIL-SPEC optional.` },
    { q_zh: `${productLine.name_zh}出口多久到？`, q_en: `How long for export delivery?`, a_zh: `生产 30-45 天，海运 25-40 天 DDP，空运 5-7 天，快递 3-5 天。`, a_en: `Production 30-45 days, sea 25-40 days DDP, air 5-7 days, express 3-5 days.` },
    { q_zh: `${productLine.name_zh}贸易条款？`, q_en: `What are the trade terms?`, a_zh: `FOB 深圳 / EXW 中山，T/T 30% 定金，余款发货前付清。`, a_en: `FOB Shenzhen / EXW Zhongshan, T/T 30% deposit, 70% balance before shipment.` },
  ];

  // 4 大商业意图小卡
  const intentCards = siteConfig.commercialIntents.map((intent, i) => {
    // WCAG AA: heading text colors must have 4.5:1 contrast against their bg
    const colors = ["#FFF7ED", "#FFFBEB", "#EFF6FF", "#ECFDF5"];
    const textColors = ["#9A3412", "#92400E", "#1E2FAA", "#065F46"];
    return `<a href="${basePrefix}/${productLine.slug}/${intent.slug}/" style="text-decoration:none;color:inherit;display:block;background:${colors[i]};padding:1.5rem;border-radius:12px;border:1px solid ${textColors[i]}40;">
      <h3 style="margin:0 0 0.5rem;font-size:1.125rem;color:${textColors[i]};">${esc(t ? intent.name_zh : intent.name_en)}</h3>
      <p style="margin:0;font-size:0.875rem;color:#475569;">${esc(t ? intent.cta_text_zh : intent.cta_text_en)}</p>
    </a>`;
  }).join("");

  // 该产品线的真实图片（取 5 张特色图）
  const lineImgs = getProductImages(productLine.slug);
  const productImages = Object.values(lineImgs).filter(img => img && img.src).slice(0, 5);

  // BUILD_SENTINEL_2026-08-12_12:23:45_chip_links_enabled
  
  // 链接规则 (P0 修复 2026-08-12): S/A/B/C 级都链到 /<pl>/<kw-slug>-<no>/ (实际生成的 -N 路径)
  // 之前 B/C 级是 <span> 不可点,FRED 看到 chip 不能点/URL 404
  function renderKwChips(kws, color) {
    if (kws.length === 0) return "";
    return `<div style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-top:1rem;">
      ${kws.map(kw => {
        const kwSlug = slugify(t ? kw.zh : enClean(kw.en));
        const no = kw.no || 1;
        const grade = kw.grade || "B";
        // EN: clean mixed en; ZH: keep as-is
        const displayText = t ? kw.zh : enClean(kw.en);
        // 全部级别都链到实际生成的 -N 路径
        const href = `${basePrefix}/${productLine.slug}/${kwSlug}-${no}/`;
        const textColor = (grade === "S" || grade === "A") ? "#0F172A" : "#1E293B";
        return `<a href="${href}" title="${grade} grade · ${esc(displayText)}" style="display:inline-block;padding:0.4rem 0.8rem;background:#${color};color:${textColor};border-radius:999px;font-size:0.75rem;text-decoration:none;">${esc(displayText)}</a>`;
      }).join("")}
    </div>`;
  }

  const html = renderHead({
    title,
    description,
    keywords: t ? siteConfig.keywords.zh : siteConfig.keywords.en,
    canonical,
    lang,
    theme: productLine.theme,
    schemas: [
      collectionPageSchema({ name: t ? productLine.name_zh : productLine.name_en, description, slug: productLine.slug, count: keywords.length }),
      faqSchema(categoryFaqs, lang),
      breadcrumbSchema([
        { name: t ? "首页" : "Home", url: `${basePrefix || ""}/` },
        { name: t ? productLine.short_zh : productLine.short_en, url: `${basePrefix}/${productLine.slug}/` },
      ]),
    ],
  })
  + renderHeader({ lang, currentPath: `${basePrefix}/${productLine.slug}/` })
  + renderBreadcrumb({
    items: [
      { name: t ? "首页" : "Home", url: `${basePrefix || ""}/` },
      { name: t ? productLine.name_zh : productLine.name_en, url: `${basePrefix}/${productLine.slug}/` },
    ],
    lang,
  })
  + `
  <section class="hero" style="padding:4rem 0;">
    <div class="container">
      <h1>${esc(t ? productLine.name_zh : productLine.name_en)} <span class="accent">${t ? "源头工厂" : "Source Factory"}</span> | OEM/ODM ${t ? "全球供货" : "Global Supply"}</h1>
      <p>${esc(description)}</p>
      <div class="hero-cta">
        <a href="mailto:${siteConfig.contact.email}?subject=${encodeURIComponent(t ? productLine.name_zh + " 询盘" : productLine.name_en + " Inquiry")}" class="btn btn-lg cta-orange">${t ? "📧 立即询盘" : "📧 Email Inquiry"}</a>
        <a href="https://wa.me/${siteConfig.contact.whatsapp}" class="btn btn-lg cta-green" target="_blank" rel="noopener">${t ? "💬 WhatsApp" : "💬 WhatsApp"}</a>
        <a href="${basePrefix}/${productLine.slug}/oem/" class="btn btn-lg cta-blue">${t ? "🏭 OEM 定制" : "🏭 OEM Custom"}</a>
      </div>
      ${productImages.length > 0 ? `
      <div class="grid grid-${Math.min(productImages.length, 3)}" style="margin-top:3rem;">
        ${productImages.map(img => `<img src="${esc(img.src)}" srcset="${esc(img.srcset || img.src)}" sizes="(max-width: 768px) 100vw, 380px" alt="${esc(altFor(img, t))}" width="800" height="446" loading="lazy" decoding="async" style="width:100%;height:240px;object-fit:cover;border-radius:12px;box-shadow:0 4px 12px rgba(15,23,42,0.08);" />`).join("")}
      </div>` : ""}
    </div>
  </section>

  <section class="section" style="background:#F8FAFC;">
    <div class="container">
      <h2>${t ? "4 大商业服务" : "4 Commercial Services"}</h2>
      <div class="grid grid-4">${intentCards}</div>
    </div>
  </section>

  ${businessKeywords.length > 0 ? `
  <section class="section">
    <div class="container">
      <h2>${t ? "热门商业意图" : "Popular Commercial Intents"}</h2>
      <p class="lead">${t ? "厂家、批发、OEM、代理等高频搜索词" : "High-frequency search: factory, wholesale, OEM, agency"}</p>
      ${renderKwChips(businessKeywords, "EEF2FF")}
    </div>
  </section>` : ""}

  ${(() => {
    // P1 修复 2026-08-13: Hub 5 维防检测 (firstPerson + firstPersonPreference + unpublishedData)
    // 每个 hub 根据 productLine.slug 做 seed,内容唯一
    const topic = t ? productLine.name_zh : productLine.name_en;
    const seedKey = productLine.slug + ':' + (keywords.length || 0);
    const sGradePara = sGradeFirstPersonParagraph(topic, t ? 'zh' : 'en');
    const dataLabel = dataSourceLabel(t ? 'zh' : 'en');
    return `
  <section class="section" style="background:linear-gradient(180deg,#FFFFFF 0%,#F8FAFC 100%);border-top:1px solid #E2E8F0;border-bottom:1px solid #E2E8F0;">
    <div class="container">
      <h2>${t ? "我厂 12 年实战经验" : "12 Years of Factory Experience"}</h2>
      <p class="lead">${t ? `关于「${topic}」的第一人称视角，不是教科书复述` : `First-hand perspective on "${topic}" — not a textbook rewrite`}</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;margin-top:2rem;">
        ${sGradePara.map(p => `<div style="background:#FFFFFF;padding:1.5rem;border-radius:12px;border:1px solid #E2E8F0;line-height:1.7;color:#334155;">${esc(p)}</div>`).join("")}
      </div>
      <p style="margin-top:1.5rem;font-size:0.75rem;color:#94A3B8;text-align:right;">${esc(dataLabel)}</p>
    </div>
  </section>`;
  })()}

  ${featureKeywords.length > 0 ? `
  <section class="section" style="background:#F8FAFC;">
    <div class="container">
      <h2>${t ? "产品特性" : "Product Features"}</h2>
      <p class="lead">${t ? "IP67、防水、防爆、防震、防潮等" : "IP67, waterproof, explosion-proof, shockproof, moisture-proof, etc."}</p>
      ${renderKwChips(featureKeywords, "FEF3C7")}
    </div>
  </section>` : ""}

  ${specKeywords.length > 0 ? `
  <section class="section">
    <div class="container">
      <h2>${t ? "规格尺寸" : "Specifications"}</h2>
      <p class="lead">${t ? "小型、中型、大型、超大、加长、加深" : "Small, Medium, Large, Extra-Large, Long, Deep"}</p>
      ${renderKwChips(specKeywords, "DCFCE7")}
    </div>
  </section>` : ""}

  ${longtailKeywords.length > 0 ? `
  <section class="section" style="background:#F8FAFC;">
    <div class="container">
      <h2>${t ? "长尾组合词" : "Long-tail Keywords"}</h2>
      <p class="lead">${t ? "特性 + 产品 + 商业意图" : "Feature + Product + Intent"}</p>
      ${renderKwChips(longtailKeywords.slice(0, 60), "E0E7FF")}
      ${longtailKeywords.length > 60 ? `<p style="margin-top:1rem;color:#64748B;font-size:0.875rem;">${t ? `共 ${longtailKeywords.length} 个长尾词，完整列表见 ` : `${longtailKeywords.length} long-tail keywords. Full list: `}<a href="${basePrefix}/${productLine.slug}/all/">sitemap</a></p>` : ""}
    </div>
  </section>` : ""}

  ${questionKeywords.length > 0 ? `
  <section class="section">
    <div class="container">
      <h2>${t ? "买家关心的问题" : "Buyer FAQs"}</h2>
      <div class="grid grid-2">
        ${questionKeywords.map(kw => {
          const qText = t ? kw.zh : enClean(kw.en);
          return `<a href="${basePrefix}/${productLine.slug}/${slugify(t ? kw.zh : enClean(kw.en))}/" class="card" style="text-decoration:none;color:inherit;">
          <h3 style="font-size:1rem;margin:0;">${esc(qText)}</h3>
          <p style="font-size:0.875rem;color:#3B5BFF;margin:0.5rem 0 0;">${t ? "查看答案 →" : "Get answer →"}</p>
        </a>`;
        }).join("")}
      </div>
    </div>
  </section>` : ""}

  ${sectionFAQs({ faqs: categoryFaqs, lang })}

  ${renderCTA({ lang })}

  ${renderFooter({ lang })}
  `;

  return html;
}
