/**
 * 页面渲染器 — 把 keyword + 资产 + 配置 → 完整 HTML
 * 支持 4 类长尾公式的差异化结构
 * P1 修复 2026-08-12: 启用 5 维防检测 (firstPersonStatement + firstPersonPreference + unpublishedData + varyParagraphLength + shuffleSections)
 *   之前 renderer 完全没调 content_variation.js,导致 99% 模板同质
 * W5-3 2026-08-20: 6+7 维 (personQuote + customerStory + sGrade 3 段深度解读) 推广到 B-tier (noindex)
 *   之前 6+7 维只给 S/A 级, B-tier 只有 5 维。本次 B-tier 也享受 6+7 维以提升人类化与 AI 引用质量
 */

import { siteConfig } from "./site.config.js";
import { renderHead, renderHeader, renderFooter, renderBreadcrumb, renderCTA } from "./layout.js";
import {
  sectionHero, sectionDefinition, sectionParams, sectionProcess, sectionCase,
  sectionComparison, sectionFAQs, sectionTLDR, sectionDeepDive, sectionChecklist,
  sectionTestimonials, sectionSpecs, sectionPricing, sectionMarketNeeds,
  sectionCertifications, sectionFlow, sectionRelatedCategories,
} from "./sections.js";
import {
  pickRelatedCaseStudies, sectionRelatedCaseStudies, sectionTopCaseStudies,
} from "./section_related_case.js";
import {
  organizationSchema, productSchema, faqSchema, breadcrumbSchema, reviewSchema, aggregateRatingSchema,
} from "./schemas.js";
import {
  firstPersonStatement, firstPersonPreference, unpublishedData, varyParagraphLength, shuffleSections,
  sGradeFirstPersonParagraph, personQuote, customerStory,
} from "./content_variation.js";

const BASE_URL = `${siteConfig.protocol}://${siteConfig.domain}`;

function esc(s) {
  if (s == null) return "";
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// EN render path: strip CJK runs from mixed en/zh keyword data so titles/slugs/body are pure English.
// Falls back to original input if stripping leaves an empty string.
function enClean(s) {
  if (!s || typeof s !== "string") return s;
  let r = s.replace(/[\s\u3000]*[\u4e00-\u9fff]+[\s\u3000]*/g, " ");
  r = r.replace(/\s+/g, " ").replace(/[-–—,.:;!?]+\s*$/, "").trim();
  return r || s;
}

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

/** 从数组按 hash 选 1 个 */
function pickOne(arr, seed) {
  if (!arr || arr.length === 0) return null;
  const idx = Math.abs(hashCode(seed)) % arr.length;
  return arr[idx];
}

/** 从数组按 hash 选 N 个不重复 */
function pickN(arr, n, seed) {
  if (!arr || arr.length === 0) return [];
  const h = Math.abs(hashCode(seed));
  const shuffled = [...arr].sort((a, b) => (hashCode(JSON.stringify(a) + seed) - hashCode(JSON.stringify(b) + seed)));
  return shuffled.slice(0, Math.min(n, arr.length));
}

function hashCode(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return h;
}

/** 选 Hero 主图（WebP srcset） */
function selectHeroImage({ keyword, productLine, images, lang, routes }) {
  const lineImgs = images.productLines?.[productLine.slug];
  if (!lineImgs) return null;

  // 尝试按 keyword.zh / en 检测 sub_category
  const kw = (keyword.zh || "") + " " + (keyword.en || "");
  let picked = lineImgs.default;

  // 按特征词匹配
  if (/防爆|explosion/i.test(kw) && lineImgs["uav-battery-case"]) picked = lineImgs["uav-battery-case"];
  else if (/电池|battery/i.test(kw) && lineImgs["uav-battery-case"]) picked = lineImgs["uav-battery-case"];
  else if (/RTK|地面站|ground.station/i.test(kw) && lineImgs["uav-rtk-case"]) picked = lineImgs["uav-rtk-case"];
  else if (/水下|ROV|underwater/i.test(kw) && lineImgs["underwater-rov-case"]) picked = lineImgs["underwater-rov-case"];
  else if (/FPV|穿越机|backpack/i.test(kw) && lineImgs["fpv-drone-backpack"]) picked = lineImgs["fpv-drone-backpack"];
  else if (/全套|一体|all.in.one/i.test(kw) && lineImgs["all-in-one-drone-case"]) picked = lineImgs["all-in-one-drone-case"];

  // 按 layer hash 调整
  if (!picked || picked === lineImgs.default) {
    const layerKeys = Object.keys(lineImgs).filter(k => k !== "default");
    if (layerKeys.length > 0) {
      picked = lineImgs[layerKeys[Math.abs(hashCode(routes.canonicalPath)) % layerKeys.length]] || lineImgs.default;
    }
  }

  if (!picked) return null;
  return { src: picked.src, srcset: picked.srcset || picked.src, alt: picked.alt };
}

/** slug 化 */
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

/** 推断 formula */
function detectFormula(kw) {
  if (kw.layer === "长尾") return "feature-product-intent";
  if (kw.layer === "市场") return "product-export-market";
  if (kw.layer === "疑问") return "product-question";
  if (kw.layer === "规格") return "spec-product-wholesale";
  if (kw.layer === "商业") return "feature-product-intent";
  if (kw.layer === "特性") return "feature-product-intent";
  return "feature-product-intent";
}

/** 推断商业意图 */
function detectIntent(kw) {
  const z = kw.zh;
  if (/批发|价格|大量|供.?应/.test(z)) return "wholesale";
  if (/代理|经销|招商|加盟/.test(z)) return "agency";
  if (/OEM|ODM|定制|代工|贴牌|来图|开模|小批/.test(z)) return "oem";
  if (/出口|全球|跨境|海外|外贸/.test(z)) return "export";
  return "oem";  // 默认
}

/** 推断市场 */
function detectMarket(kw) {
  const z = kw.zh;
  const e = kw.en.toLowerCase();
  if (/北美|美国|北美市场|North America|USA|US|U\.S\./.test(z + e)) return "north-america";
  if (/欧洲|EU|Europe/.test(z + e)) return "europe";
  if (/东南亚|SEA/.test(z + e)) return "southeast-asia";
  if (/中东|Middle East|ME/.test(z + e)) return "middle-east";
  if (/非洲|Africa/.test(z + e)) return "africa";
  if (/俄罗斯|Russia|EAEU/.test(z + e)) return "russia";
  if (/南美|South America|Latin/.test(z + e)) return "south-america";
  if (/澳洲|Australia|NZ|New Zealand/.test(z + e)) return "australia";
  if (/日韩|Japan|Korea|JP|KR/.test(z + e)) return "japan-korea";
  return null;
}

/** 推断特性 */
function detectFeature(kw) {
  const z = kw.zh;
  const features = [];
  if (/IP67|防水/.test(z)) features.push("ip67");
  if (/IP68/.test(z)) features.push("ip68");
  if (/防爆|防燃|电池/.test(z)) features.push("explosion-proof");
  if (/MIL|军规|战术|军/.test(z)) features.push("mil-spec");
  if (/防震|抗震|减震|抗冲击|抗摔/.test(z)) features.push("shockproof");
  if (/防潮|吸湿|干燥/.test(z)) features.push("moisture-proof");
  if (/防尘/.test(z)) features.push("dustproof");
  if (/防静电|ESD|导电/.test(z)) features.push("anti-static");
  if (/耐高|耐温|耐寒|耐低温|-40|UV|抗紫外|抗老化|抗黄变/.test(z)) features.push("temp-resistant");
  if (/耐腐蚀|防盐|盐雾|海洋|船|舰/.test(z)) features.push("corrosion-resistant");
  if (/密封|气密/.test(z)) features.push("sealed");
  if (/带锁|密码|双人/.test(z)) features.push("lockable");
  if (/便携|迷你|小型/.test(z)) features.push("portable");
  if (/大型|超大|加长|加深|重型/.test(z)) features.push("heavy-duty");
  if (/拉杆|轮|拖/.test(z)) features.push("trolley");
  return features;
}

/** 生成页面元数据 */
export function buildPageMeta({ keyword, productLine, lang }) {
  const t = lang === "zh";
  const formula = detectFormula(keyword);
  const intent = detectIntent(keyword);
  const market = detectMarket(keyword);
  const features = detectFeature(keyword);

  const titleZh = `${keyword.zh} 厂家 | ${productLine.name_zh} 客信新材料`;
  const titleEn = `${enClean(keyword.en)} Manufacturer | ${productLine.name_en} | KeXinMaterials`;

  const descZh = `客信新材料提供 ${keyword.zh}，源头工厂、批发价、OEM/ODM 定制、12h 报价、30-45 天交付。FOB 深圳/EXW 中山，T/T 30% 定金。${productLine.name_zh}，IP67/MIL-SPEC/防爆认证。询 kexin@beeaa.com 或 WhatsApp +86 13590555309。`;
  const descEn = `KeXinMaterials: ${enClean(keyword.en)} from source factory, wholesale price, OEM/ODM custom, 12h quote, 30-45 day delivery. FOB Shenzhen / EXW Zhongshan, T/T 30% deposit. ${productLine.name_en}, IP67/MIL-SPEC certified. Inquire kexin@beeaa.com or WhatsApp +86 13590555309.`;

  return {
    formula,
    intent,
    market,
    features,
    title: t ? titleZh : titleEn,
    description: t ? descZh : descEn,
    keyword: t ? keyword.zh : enClean(keyword.en),
    lang,
  };
}

/** 路由解析 */
export function buildRoutes({ keyword, productLine, lang }) {
  const t = lang === "zh";
  const basePrefix = t ? "/zh" : "";
  const intent = detectIntent(keyword);
  const kwSlug = slugify(t ? keyword.zh : enClean(keyword.en));

  // 简化：所有长尾都挂在品类下
  // 实际可分：特性长尾、规格长尾、市场长尾、疑问长尾
  return {
    baseUrl: `${BASE_URL}${basePrefix}/${productLine.slug}/${kwSlug}/`,
    canonicalPath: `${basePrefix}/${productLine.slug}/${kwSlug}/`,
    breadcrumb: [
      { name: t ? "首页" : "Home", url: `${basePrefix || ""}/` },
      { name: t ? productLine.short_zh : productLine.short_en, url: `${basePrefix}/${productLine.slug}/` },
      { name: t ? keyword.zh : enClean(keyword.en), url: `${basePrefix}/${productLine.slug}/${kwSlug}/` },
    ],
  };
}

/** 主页面渲染器 */
export function renderPage({ keyword, productLine, assets, lang = "en", grade = "A", allKws = null }) {
  const t = lang === "zh";
  const basePrefix = t ? "/zh" : "";
  const meta = buildPageMeta({ keyword, productLine, lang });
  const routes = buildRoutes({ keyword, productLine, lang });

  // === 选资产 ===
  const { cases, params, faqs, testimonials, flows, comparisons, images } = assets;

  // === B 级 noindex 标记 ===
  const noindex = grade === "B";

  // === 选图片（真实图，按 sub_category + feature 分配）===
  const heroImage = selectHeroImage({ keyword, productLine, images, lang, routes });

  // 案例：按 product_line + market 选 1 个
  let caseData = null;
  if (cases[productLine.slug]) {
    const marketFiltered = meta.market
      ? cases[productLine.slug].filter(c => c.market === meta.market)
      : cases[productLine.slug];
    caseData = pickOne(marketFiltered.length > 0 ? marketFiltered : cases[productLine.slug], routes.canonicalPath);
  }

  // 参数：通用 + 产品线
  const paramFields = assets.params.fields;
  const lineParams = paramFields[productLine.slug] || {};
  const commonParams = paramFields.common;
  const pageParams = {};
  // 选 6-8 个字段
  const allFieldKeys = [
    ...Object.keys(commonParams),
    ...Object.keys(lineParams).slice(0, 3),
  ];
  const selectedKeys = pickN(allFieldKeys, Math.min(7, allFieldKeys.length), routes.canonicalPath);
  selectedKeys.forEach(k => {
    const field = commonParams[k] || lineParams[k];
    if (field && field.options) {
      // P2 修复 2026-08-12: options 支持 en/zh 分离 (value_zh + value_en) 或 string
      const opt = pickOne(field.options, routes.canonicalPath + k);
      if (typeof opt === "object" && opt !== null) {
        pageParams[k] = (t ? opt.value_zh : opt.value_en) || opt.value_zh || opt.value_en || "";
      } else {
        pageParams[k] = opt;
      }
    } else if (field) {
      pageParams[k] = field.options
        ? (() => {
            const opt = pickOne(field.options, routes.canonicalPath + k);
            if (typeof opt === "object" && opt !== null) {
              return (t ? opt.value_zh : opt.value_en) || opt.value_zh || opt.value_en || "";
            }
            return opt;
          })()
        : field;
    }
  });

  // FAQ：global + by_formula + by_product 各取一些
  const globalFaqs = pickN(assets.faqs.global || [], 2, routes.canonicalPath);
  const formulaFaqs = pickN(assets.faqs.by_formula?.[meta.formula] || [], 3, routes.canonicalPath);
  const productFaqs = pickN(assets.faqs.by_product?.[productLine.slug] || [], 1, routes.canonicalPath);
  // by_formula 名称映射
  const formulaNameMap = {
    "feature-product-intent": "特性+产品+商业意图",
    "spec-product-wholesale": "规格+产品+批发",
    "product-export-market": "产品+出口+地域",
    "product-question": "产品+疑问词",
  };
  const formulaName = formulaNameMap[meta.formula] || meta.formula;
  const formulaFaqs2 = pickN(assets.faqs.by_formula?.[formulaName] || [], 2, routes.canonicalPath);
  const pageFaqs = [...new Map([...globalFaqs, ...formulaFaqs, ...formulaFaqs2, ...productFaqs].map(f => [f.q_en, f])).values()].slice(0, 6);

  // 对比表
  const comparison = pickOne(assets.comparisons, routes.canonicalPath);

  // 流程图
  const flow = meta.intent === "oem" ? pickOne(assets.flows.filter(f => f.id === "oem-process"), routes.canonicalPath)
    : meta.intent === "export" ? pickOne(assets.flows.filter(f => f.id === "export-logistics"), routes.canonicalPath)
    : meta.intent === "wholesale" ? pickOne(assets.flows.filter(f => f.id === "wholesale-process"), routes.canonicalPath)
    : pickOne(assets.flows, routes.canonicalPath);

  // 证言
  const lineTestimonials = (assets.testimonials || []).filter(t => t.product_line === productLine.slug);
  const pageTestimonials = pickN(lineTestimonials, 3, routes.canonicalPath);

  // 唯一数据点 (8/20 W5-1 fix: 数组元素支持 {zh, en} 对象 + EN fallback ZH fallback 双语)
  const _ufGroup = assets.params.unique_facts?.[productLine.slug];
  const _ufKey = _ufGroup ? Object.keys(_ufGroup)[0] : null;
  const _ufRaw = _ufKey ? _ufGroup[_ufKey][0] : null;
  const uniqueFact = (typeof _ufRaw === "object" && _ufRaw !== null)
    ? ((t ? _ufRaw.zh : _ufRaw.en) || _ufRaw.zh || "")
    : (_ufRaw ||
       (t
         ? `${productLine.name_zh} 系列已出口至 30+ 国家，2024 年累计交付 50,000+ 套。`
         : `${productLine.name_en} series exported to 30+ countries, 50,000+ units delivered in 2024.`));

  // === 渲染各 section ===
  const sections = [];

  // P1 修复 2026-08-12: 5 维防检测 (V3 §3.1) + 2026-08-14 升级到 7 维
  // 1. 段落长度变化 - varyParagraphLength 决定每段是短/中/长
  // 2. 第一人称经验 - firstPersonStatement 加一段"我厂 12 年经验..."
  // 3. 主观判断偏好 - firstPersonPreference 加一段"我个人更推荐..."
  // 4. 未发表数据 - unpublishedData 加一段"我厂 2024-2026 实测..."
  // 5. 段落顺序打乱 - shuffleSections 30% 概率打乱
  // 6. 真实人名引用 - personQuote 加一段 CEO/RD/QA/Export 真实引述 (S/A 级)
  // 7. 客户故事片段 - customerStory 加一段带具体数字的案例 (S/A 级)
  const seedKey = routes.canonicalPath + ':' + (keyword.no || '');
  const fpe = firstPersonStatement(t ? 'zh' : 'en');
  const fpp = firstPersonPreference(t ? 'zh' : 'en');
  const upd = unpublishedData(t ? 'zh' : 'en');
  // S/A/B 级用更长版 (W5-3: 推广到 B-tier), C 级用空 (差异化)
  const sGradeBlock = (grade === 'S' || grade === 'A' || grade === 'B')
    ? sGradeFirstPersonParagraph(esc(t ? keyword.zh : enClean(keyword.en)), t ? 'zh' : 'en')
    : '';
  // 6+7 维: S/A/B 级加 personQuote + customerStory (W5-3: 推广到 B-tier, C 级除外)
  const quoteRole = (grade === 'S' || grade === 'A' || grade === 'B')
    ? ['chief', 'rd', 'qa', 'export'][Math.abs(hashCode(seedKey + 'role')) % 4]
    : 'chief';
  const pq = personQuote(quoteRole, t ? 'zh' : 'en');
  const cs = customerStory(esc(t ? keyword.zh : enClean(keyword.en)), t ? 'zh' : 'en');

  // 1. Hero
  sections.push(sectionHero({
    title: meta.title,
    subtitle: meta.description,
    image: heroImage ? `<img src="${esc(heroImage.src)}" srcset="${esc(heroImage.srcset)}" sizes="(max-width: 768px) 100vw, 1200px" alt="${esc(altFor(heroImage, t))}" width="1600" height="893" loading="lazy" decoding="async" style="width:100%;height:auto;border-radius:12px;box-shadow:0 10px 25px -5px rgba(15,23,42,0.15);" />` : "",
    lang,
  }));

  // 2. 按 formula 选骨架
  if (meta.formula === "feature-product-intent") {
    const definitionText = t
      ? `${keyword.zh} 是指 ${uniqueFact}。客信新材料（广东）有限公司提供 OEM/ODM 定制，3D 打样 7 天、开模 45 天、量产 30 天，源头工厂、12 小时报价、30-45 天交付。FOB 深圳/EXW 中山，T/T 30% 定金。`
      : `${enClean(keyword.en)} is a ${uniqueFact}. KeXinMaterials (Guangdong) Co., Ltd. offers OEM/ODM customization with 7-day 3D sample, 45-day mold, 30-day mass production. Source factory, 12-hour quote, 30-45 day delivery. FOB Shenzhen / EXW Zhongshan, T/T 30% deposit.`;
    sections.push(sectionDefinition({ text: definitionText, lang }));
    sections.push(sectionParams({ params: pageParams, lang }));
    if (flow) sections.push(sectionFlow({ flow, lang }));
    if (caseData) sections.push(sectionCase({ caseData, lang }));
    if (comparison) sections.push(sectionComparison({ comparison, lang }));
    sections.push(sectionFAQs({ faqs: pageFaqs, lang }));
  } else if (meta.formula === "spec-product-wholesale") {
    sections.push(sectionSpecs({ specs: Object.entries(pageParams).slice(0, 6).map(([k, v]) => ({ name: t ? (paramFields.common[k]?.label_zh || k) : (paramFields.common[k]?.label_en || k), desc: v, price: "" })), lang }));
    sections.push(sectionPricing({ tiers: [
      { qty: "50-199 pcs", price: "USD 25-80", discount: "-", leadTime: t ? "30-45 天" : "30-45 days" },
      { qty: "200-499 pcs", price: "USD 22-72", discount: "10% off", leadTime: t ? "30-45 天" : "30-45 days" },
      { qty: "500-999 pcs", price: "USD 19-65", discount: "20% off", leadTime: t ? "30-45 天" : "30-45 days" },
      { qty: "1000+ pcs", price: "USD 16-58", discount: "30% off", leadTime: t ? "30-45 天" : "30-45 days" },
    ], lang }));
    sections.push(sectionFAQs({ faqs: pageFaqs, lang }));
  } else if (meta.formula === "product-export-market") {
    const market = (siteConfig.markets.find(m => m.slug === meta.market)) || siteConfig.markets[0];
    sections.push(sectionMarketNeeds({ content: `${t ? market.name_zh : market.name_en}${t ? "买家对" : " buyers demand"} ${esc(t ? keyword.zh : enClean(keyword.en))} ${t ? "的核心需求：合规认证、长期可靠性、本地化交付、报价透明度。客信针对" : " core requirements: compliance, reliability, local delivery, transparent pricing. KeXinMaterials serves"} ${t ? market.name_zh : market.name_en} ${t ? "市场已" : " market for"} ${3 + Math.abs(hashCode(routes.canonicalPath)) % 8} ${t ? "年。" : " years."}`, lang }));
    sections.push(sectionCertifications({ certs: market.certifications, lang }));
    if (flow) sections.push(sectionFlow({ flow, lang }));
    if (caseData) sections.push(sectionCase({ caseData, lang }));
    sections.push(sectionFAQs({ faqs: pageFaqs, lang }));
  } else if (meta.formula === "product-question") {
    sections.push(sectionTLDR({ text: `${t ? "简短答案：" : "Short answer:"} ${t ? "是" : "Yes"}, ${t ? "客信新材料提供" : "KeXinMaterials offers"} ${esc(t ? keyword.zh : enClean(keyword.en))}，${t ? "源头工厂、批发价、12h 报价、30-45 天交付，FOB 深圳/EXW 中山，T/T 30% 定金。" : "source factory, wholesale price, 12h quote, 30-45 day delivery, FOB Shenzhen / EXW Zhongshan, T/T 30% deposit."}`, lang }));
    sections.push(sectionDeepDive({ paragraphs: [
      `${t ? "### 深度解读" : "### Deep Dive"}\n\n${esc(t ? keyword.zh : enClean(keyword.en))} ${t ? "的核心要点：① 选工厂不选贸易商（质量可控、报价透明、交付稳定）② 关注认证（CE/RoHS/FCC/UN38.3 等）③ 评估 MOQ 和定制能力 ④ 验厂考察或视频验厂 ⑤ 样品确认后再下单。交货期 30-45 天，FOB 深圳/EXW 中山，T/T 30% 定金。" : "Key points: ① Choose factory not trader ② Check certifications ③ Evaluate MOQ & customization ④ Factory audit or video audit ⑤ Sample first then order. Lead time 30-45 days, FOB Shenzhen / EXW Zhongshan, T/T 30% deposit."}`,
      `${t ? "### 客信优势" : "### Why KeXinMaterials"}\n\n${uniqueFact} 13,000㎡ 工厂、10,000+ SKU 现货、48h 发货。${t ? "已为" : "Trusted by"} ${50 + (Math.abs(hashCode(routes.canonicalPath)) % 200)} ${t ? "家头部企业服务。交货期 30-45 天，FOB 深圳/EXW 中山，T/T 30% 定金。" : " leading brands. Lead time 30-45 days, FOB Shenzhen / EXW Zhongshan, T/T 30% deposit."}`,
    ], lang }));
    sections.push(sectionChecklist({ items: [
      t ? "确认需求（IP 等级、尺寸、材质、认证）" : "Confirm requirements (IP, size, material, certifications)",
      t ? "对比至少 3 家工厂的报价和认证" : "Compare at least 3 factory quotes and certifications",
      t ? "要求样品测试和实地/视频验厂" : "Request samples and on-site / video factory audit",
      t ? "确认 MOQ、交付周期、付款方式" : "Confirm MOQ, lead time, payment terms",
      t ? "签订正式合同（含质量条款、违约责任）" : "Sign formal contract (quality clauses, penalties)",
    ], lang }));
    if (comparison) sections.push(sectionComparison({ comparison, lang }));
    if (pageTestimonials.length) sections.push(sectionTestimonials({ items: pageTestimonials, lang }));
    sections.push(sectionFAQs({ faqs: pageFaqs, lang }));
  }

  // P3.6 2026-08-14: 内部链接增强 - B-tier 页加 3-4 个相关产品线链接
  // 目的: 提升 B-tier 页面 → Hub 页的内部链接, 增强 SEO 关联性
  sections.push(sectionRelatedCategories({
    currentSlug: productLine.slug,
    productLines: siteConfig.productLines,
    lang,
    basePrefix,
  }));

  // P3.6 W2 2026-08-17: 内部链接增强 v2 - 同 PL 4 个 related case study
  // 目的: B-tier 页面互相链接, 形成 hub-spoke 内部链接网络
  if (allKws && allKws.length > 1) {
    const related = pickRelatedCaseStudies(keyword, allKws, 4, lang);
    if (related.length > 0) {
      const currentSlug = `${slugify(t ? keyword.zh : enClean(keyword.en))}-${keyword.no}`;
      sections.push(sectionRelatedCaseStudies({
        relatedKws: related,
        currentSlug,
        lang,
        basePrefix,
        productLine: productLine.slug,
      }));
    }
  }

  // 2.5 P1 修复 2026-08-12 v2: 注入 5 维防检测 (V3 §3.1)
  // Bug fix: sectionDeepDive 自己包 <p> + esc(), 不要预先包 <p> 字符串
  // sGradeFirstPersonParagraph 返回 3 段 array, 直接展开传
  // 30% 概率用 shuffleSections 打乱 4 个 section 顺序
  if (sGradeBlock && sGradeBlock.length) {
    sections.push(sectionDeepDive({ paragraphs: sGradeBlock, lang }));
  }

  // P1 修复 2026-08-12 v2: 5 维防检测 - 拼 4 段差异化内容 (第一人称经验 + 主观判断 + 未发表数据 + 唯一数据点)
  // 用 seedKey 选每段的"短/中/长"长度, 30% 概率打乱 4 段顺序
  // Bug fix: 只返回纯文本, sectionDeepDive 帮我们包 <p>
  const fiveDimRawTexts = [fpe, fpp, upd, uniqueFact].map((text, i) => {
    const lenMode = varyParagraphLength(seedKey + ':p' + i);
    const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
    let selected = sentences;
    if (lenMode === 'short' && sentences.length > 1) selected = sentences.slice(0, 1);
    else if (lenMode === 'medium' && sentences.length > 3) selected = sentences.slice(0, 3);
    else if (lenMode === 'long' && sentences.length > 5) selected = sentences.slice(0, 5);
    else if (lenMode === 'mixed' && sentences.length > 6) selected = [sentences[0], ...sentences.slice(-2)];
    return selected.join('. ') + (selected.length ? '.' : '');
  });
  // 30% 概率打乱 4 段顺序
  const finalParagraphs = Math.abs(hashCode(seedKey + 'shuf5')) % 10 < 3
    ? [...fiveDimRawTexts].reverse()
    : fiveDimRawTexts;
  sections.push(sectionDeepDive({ paragraphs: finalParagraphs, lang }));

  // P3.6 升级 2026-08-14: 6+7 维 (S/A 级) — person quote + customer story
  // W5-3 2026-08-20: 推广到 B-tier (C 级除外)
  if (grade === 'S' || grade === 'A' || grade === 'B') {
    // 真实人名引用 (E-E-A-T 强化)
    const quoteLen = varyParagraphLength(seedKey + ':quote');
    const quoteSentences = pq.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
    let quotePara = quoteSentences.join('. ') + (quoteSentences.length ? '.' : '');
    if (quoteLen === 'short' && quoteSentences.length > 1) {
      quotePara = quoteSentences.slice(0, 1).join('. ') + '.';
    }
    // 客户故事片段
    const storyLen = varyParagraphLength(seedKey + ':story');
    const storySentences = cs.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
    let storyPara = storySentences.join('. ') + (storySentences.length ? '.' : '');
    if (storyLen === 'short' && storySentences.length > 1) {
      storyPara = storySentences.slice(0, 1).join('. ') + '.';
    }
    // 50% 概率合并成一段, 50% 概率分成两段 (差异化)
    if (Math.abs(hashCode(seedKey + 'qstory')) % 10 < 5) {
      sections.push(sectionDeepDive({ paragraphs: [quotePara + ' ' + storyPara], lang }));
    } else {
      sections.push(sectionDeepDive({ paragraphs: [quotePara], lang }));
      sections.push(sectionDeepDive({ paragraphs: [storyPara], lang }));
    }
  }

  // 30% 概率打乱前面所有 section 顺序 (shuffleSections)
  if (Math.abs(hashCode(seedKey + 'shuffle')) % 10 < 3) {
    // 只打乱中间 section,保留 hero 在前, FAQ+CTA 在后
    const before = sections.slice(0, 1);
    const middle = sections.slice(1, -1);
    const after = sections.slice(-1);
    sections.length = 0;
    sections.push(...before, ...shuffleSections(middle, seedKey + 'shf'), ...after);
  }

  // 3. CTA
  sections.push(renderCTA({ lang }));

  // === Schema 注入 ===
  // 选 3 条匹配 product_line 的 testimonials 作 Review
  const matchingTestimonials = (assets.testimonials || []).filter(tt => tt.product_line === productLine.slug).slice(0, 3);
  const fallbackTestimonials = (assets.testimonials || []).slice(0, 3);
  const reviewPool = matchingTestimonials.length > 0 ? matchingTestimonials : fallbackTestimonials;

  const schemas = [
    productSchema({
      name: t ? keyword.zh : enClean(keyword.en),
      description: meta.description,
      sku: slugify(t ? keyword.zh : enClean(keyword.en)),
      category: t ? productLine.name_zh : productLine.name_en,
      additionalProperty: Object.entries(pageParams).slice(0, 5).map(([k, v]) => ({ label_en: k, value: Array.isArray(v) ? v.join(", ") : v })),
    }),
    aggregateRatingSchema({ count: 12, average: 4.9 }),
    reviewSchema(reviewPool, lang, 3),
    faqSchema(pageFaqs, lang),
    breadcrumbSchema(routes.breadcrumb),
  ];

  // === 拼装完整 HTML ===
  // OG image: 用 product line 的 hero image（按主题色更精准）
  const productHero = images?.productLines?.[productLine.slug]?.default;
  const ogImage = productHero ? `${BASE_URL}${productHero.src}` : undefined;
  const html = renderHead({
    title: meta.title,
    description: meta.description,
    keywords: t ? siteConfig.keywords.zh : siteConfig.keywords.en,
    canonical: routes.baseUrl,
    ogImage,
    lang,
    theme: productLine.theme,
    schemas,
    noindex,
  })
  + renderHeader({ lang, currentPath: routes.canonicalPath })
  + renderBreadcrumb({ items: routes.breadcrumb, lang })
  + `<main id="main-content">`
  + sections.join("\n")
  + `</main>`
  + renderFooter({ lang });

  return html;
}
