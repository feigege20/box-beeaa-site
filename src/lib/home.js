/**
 * 首页 + 品类页 + FAQ 聚合页 + 商业意图页 + 全球市场页
 */

import { siteConfig } from "./site.config.js";
import { renderHead, renderHeader, renderFooter, renderCTA } from "./layout.js";
import { sectionHero, sectionFAQs, sectionCase, sectionCertifications, sectionFlow } from "./sections.js";
import { webSiteSchema } from "./schemas.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..", "..");

const BASE_URL = `${siteConfig.protocol}://${siteConfig.domain}`;

function esc(s) {
  if (s == null) return "";
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

let _imagesCache = null;
function loadImages() {
  if (_imagesCache) return _imagesCache;
  const path = resolve(PROJECT_ROOT, "data/assets/images.json");
  _imagesCache = JSON.parse(readFileSync(path, "utf-8"));
  return _imagesCache;
}

function getProductImage(slug) {
  const imgs = loadImages().productLines?.[slug];
  return imgs?.default || null;
}

function getFactoryImage(key) {
  return loadImages().factory?.[key] || null;
}

function getHero(key) {
  return loadImages().hero?.[key] || null;
}

function getProductImg(slug) {
  return loadImages().products?.[slug] || null;
}

// 本地化 alt：英文页面只取英文部分（"English / 中文" 或 "中文 / English" 都自动识别），中文页保留全段
function altFor(img, t) {
  if (!img || !img.alt) return "";
  if (t) return img.alt;
  // 切到第一个 " / "，选择不含中文字符的那一半
  const parts = img.alt.split(" / ");
  for (const p of parts) {
    if (!/[\u4e00-\u9fff]/.test(p)) return p.trim();
  }
  return parts[0].trim();
}

function renderPicture(img, classes = "", sizes = "(max-width: 768px) 100vw, 1200px", loading = "lazy", t = false) {
  if (!img) return "";
  return `<img src="${esc(img.src)}" srcset="${esc(img.srcset)}" sizes="${esc(sizes)}" alt="${esc(altFor(img, t))}" loading="${loading}" decoding="async" class="${classes}" style="width:100%;height:auto;border-radius:12px;" />`;
}

export function renderHome({ lang = "en" } = {}) {
  const t = lang === "zh";
  const basePrefix = t ? "/zh" : "";
  const canonical = `${BASE_URL}${basePrefix || ""}/`;

  const title = t
    ? "客信新材料 · 箱体制造源头工厂 | 9 大产品线 OEM/ODM 全球供货"
    : "KeXinMaterials · Source Factory of Protective Cases | 9 Product Lines · OEM/ODM · Global Supply";

  const description = t
    ? "客信新材料（广东）有限公司，9 大产品线防护箱、安全箱、工具箱源头工厂。32,308 关键词全球买家覆盖，IP67 防水、MIL-SPEC 军规、防爆认证、30-45 天交付。FOB 深圳/EXW 中山，T/T 30% 定金。批发、代理加盟、OEM/ODM、全球供货。kexin@beeaa.com / +86 13590555309"
    : "KeXinMaterials (Guangdong) Co., Ltd. - source factory for protective cases across 9 product lines. 32,308 keywords covering global buyers. IP67 waterproof, MIL-SPEC, explosion-proof certified, 30-45 day delivery. FOB Shenzhen / EXW Zhongshan, T/T 30% deposit. Wholesale, Agency, OEM/ODM, Global Supply. kexin@beeaa.com / +86 13590555309";

  // 9 大产品线卡片（带真实 WebP 图）
  const productCards = siteConfig.productLines.map(p => {
    const img = getProductImage(p.slug);
    return `<a href="${basePrefix}/${p.slug}/" class="card" style="text-decoration:none;color:inherit;display:block;overflow:hidden;">
      ${img ? `<img src="${esc(img.src)}" srcset="${esc(img.srcset)}" sizes="(max-width: 768px) 100vw, 380px" alt="${esc(altFor(img, t))}" loading="lazy" decoding="async" style="width:100%;height:180px;object-fit:cover;border-radius:8px 8px 0 0;margin:-1.5rem -1.5rem 1rem;width:calc(100% + 3rem);max-width:calc(100% + 3rem);" />` : ""}
      <h3>${esc(t ? p.name_zh : p.name_en)}</h3>
      <p>${esc(t ? p.desc_zh : p.desc_en)}</p>
      <div style="margin-top:1rem;color:#3B5BFF;font-weight:600;font-size:0.875rem;">${t ? "查看产品 →" : "View Products →"}</div>
    </a>`;
  }).join("");

  // 4 大商业意图 banner
  const intentBanners = siteConfig.commercialIntents.map((intent, i) => {
    const colors = ["#F97316", "#F59E0B", "#3B5BFF", "#10B981"];
    return `<a href="${basePrefix}/${intent.slug}/" style="text-decoration:none;color:#FFFFFF;display:block;background:${colors[i]};padding:2rem;border-radius:12px;transition:transform 0.2s;">
      <h3 style="color:#FFFFFF;margin:0 0 0.5rem;">${esc(t ? intent.name_zh : intent.name_en)}</h3>
      <p style="margin:0;opacity:0.9;">${esc(t ? intent.cta_text_zh : intent.cta_text_en)}</p>
    </a>`;
  }).join("");

  // 数据条
  const stats = [
    { num: "32,308", label: t ? "关键词覆盖" : "Keywords" },
    { num: "9", label: t ? "产品线" : "Product Lines" },
    { num: "150+", label: t ? "产品规格" : "SKUs" },
    { num: "20+", label: t ? "专利证书" : "Patents" },
    { num: "13,000㎡", label: t ? "工厂面积" : "Factory" },
  ];

  // 主推产品（8 系防护箱）— 用真实产品图
  const featured = siteConfig.featuredProduct;
  const featured8 = getHero("main");  // 用 hero02 作为 8 系主图

  // 视频
  const videoUrl = siteConfig.media?.factory_video;

  // 工厂实景（真实图，6 张网格）
  const factoryImgs = [getFactoryImage("production-line"), getFactoryImage("warehouse"), getFactoryImage("quality-control")].filter(Boolean);
  const factoryGrid2 = [getFactoryImage("shipping"), getFactoryImage("team"), getFactoryImage("exterior")].filter(Boolean);
  const renderFactoryImg = (img) => `<img src="${esc(img.src)}" srcset="${esc(img.srcset)}" sizes="(max-width: 768px) 100vw, 380px" alt="${esc(altFor(img, t))}" loading="lazy" decoding="async" style="width:100%;height:240px;object-fit:cover;border-radius:12px;" />`;
  const factoryGrid = factoryImgs.length > 0
    ? `<div class="grid grid-3">
        ${factoryImgs.map(renderFactoryImg).join("")}
      </div>
      <div class="grid grid-3" style="margin-top:1rem;">
        ${factoryGrid2.map(img => `<img src="${esc(img.src)}" srcset="${esc(img.srcset)}" sizes="(max-width: 768px) 100vw, 380px" alt="${esc(altFor(img, t))}" loading="lazy" decoding="async" style="width:100%;height:180px;object-fit:cover;border-radius:12px;" />`).join("")}
      </div>`
    : "";

  // 认证（真实）— 英文页面去除中文后缀，保留 ISO/ROHS 等代号
  const certsRaw = (siteConfig.certifications || []).slice(0, 12);
  const certs = t ? certsRaw : certsRaw.map(c => {
    // 去除中文字符，只保留 ISO/ROHS/CE/SGS 等英文字母
    return c.replace(/[\u4e00-\u9fff]+/g, "").replace(/\s+/g, " ").trim() || c;
  });

  // FAQ
  const homeFaqs = [
    { q_zh: "客信新材料是工厂还是贸易商？", q_en: "Is KeXinMaterials a factory or trading company?", a_zh: "客信新材料是源头工厂，18,000㎡ 厂房，自主材料改性、模具、注塑/滚塑、装配到出货全流程。", a_en: "KeXinMaterials is a source factory with 18,000㎡ facility, controlling material modification, mold, injection/rotomolding, assembly, and shipping." },
    { q_zh: "支持 OEM/ODM 吗？", q_en: "Do you support OEM/ODM?", a_zh: "支持。3D 设计 3 天、打样 7-10 天、开模 45 天、量产 30 天。交货期 30-45 天，FOB 深圳/EXW 中山，T/T 30% 定金。", a_en: "Yes. 3D design 3 days, sample 7-10 days, mold 45 days, mass production 30 days. Lead time 30-45 days, FOB Shenzhen / EXW Zhongshan, T/T 30% deposit." },
    { q_zh: "如何询盘？", q_en: "How to inquire?", a_zh: "邮件 kexin@beeaa.com 或 WhatsApp +86 13590555309，12 小时内回复。", a_en: "Email kexin@beeaa.com or WhatsApp +86 13590555309, reply within 12 hours." },
    { q_zh: "MOQ 是多少？", q_en: "What is MOQ?", a_zh: "标准 SKU 50-100 pcs，定制 300 pcs。", a_en: "Standard SKUs 50-100 pcs, custom 300 pcs." },
  ];

  const html = renderHead({
    title,
    description,
    keywords: t ? siteConfig.keywords.zh : siteConfig.keywords.en,
    canonical,
    lang,
    theme: "drone",
    schemas: [webSiteSchema()],
  })
  + renderHeader({ lang, currentPath: "/" })
  + `
  <section class="hero">
    <div class="container">
      <h1>${esc(title)}</h1>
      <p>${esc(description)}</p>
      <div class="hero-cta">
        <a href="mailto:${siteConfig.contact.email}" class="btn btn-lg cta-orange">${t ? "📧 立即询盘" : "📧 Email Inquiry"}</a>
        <a href="https://wa.me/${siteConfig.contact.whatsapp}" class="btn btn-lg cta-green" target="_blank" rel="noopener">${t ? "💬 WhatsApp" : "💬 WhatsApp"}</a>
        <a href="${siteConfig.contact.main_site}" class="btn btn-lg" style="background:#FFFFFF;color:#0F172A;border:1px solid #E2E8F0;" target="_blank" rel="noopener">${t ? "🛒 去主站采购" : "🛒 Shop at Main Site"}</a>
      </div>
    </div>
  </section>

  <section class="section" style="background:#F8FAFC;">
    <div class="container">
      <div class="stat-strip">
        ${stats.map(s => `<div class="stat"><div class="stat-num">${s.num}</div><div class="stat-label">${s.label}</div></div>`).join("")}
      </div>
    </div>
  </section>

  <!-- Featured Series 8 Protective Case -->
  <section class="section" style="background:linear-gradient(135deg,#FEF3C7 0%,#FFFFFF 100%);">
    <div class="container">
      <div class="grid grid-2" style="align-items:center;gap:3rem;">
        <div>
          <div style="display:inline-block;background:#F59E0B;color:#1F2937;padding:0.4rem 1rem;border-radius:999px;font-size:0.875rem;font-weight:700;margin-bottom:1rem;">⭐ ${t ? "2024 主推产品" : "2024 STAR PRODUCT"}</div>
          <h2 style="font-size:2.5rem;margin-top:0;">${t ? featured.name_zh : featured.name_en}</h2>
          <p class="lead">${t ? featured.description_zh : featured.description_en}</p>
          <div style="display:flex;gap:1rem;margin-top:1.5rem;flex-wrap:wrap;">
            <span style="background:#FFFFFF;padding:0.5rem 1rem;border-radius:8px;font-size:0.875rem;border:1px solid #F59E0B;">✓ IP67 ${t ? "防水 7 级" : "Waterproof L7"}</span>
            <span style="background:#FFFFFF;padding:0.5rem 1rem;border-radius:8px;font-size:0.875rem;border:1px solid #F59E0B;">✓ ${t ? "防尘 6 级" : "Dustproof L6"}</span>
            <span style="background:#FFFFFF;padding:0.5rem 1rem;border-radius:8px;font-size:0.875rem;border:1px solid #F59E0B;">✓ ${t ? "抗压测试" : "Compression Test"}</span>
            <span style="background:#FFFFFF;padding:0.5rem 1rem;border-radius:8px;font-size:0.875rem;border:1px solid #F59E0B;">✓ ROHS</span>
            <span style="background:#FFFFFF;padding:0.5rem 1rem;border-radius:8px;font-size:0.875rem;border:1px solid #F59E0B;">✓ ${t ? "加州 65" : "California 65"}</span>
          </div>
          <div style="margin-top:2rem;display:flex;gap:1rem;flex-wrap:wrap;">
            <a href="mailto:${siteConfig.contact.email}?subject=${encodeURIComponent(t ? "8 系防护箱询价" : "Series 8 Inquiry")}" class="btn cta-orange">${t ? "📧 询 8 系报价" : "📧 Quote Series 8"}</a>
            <a href="/zh/military-tactical-case/" class="btn cta-blue">${t ? "查看军规产品" : "View MIL-SPEC"}</a>
          </div>
        </div>
        <div>
          ${featured8 ? `<img src="${esc(featured8.src)}" srcset="${esc(featured8.srcset)}" sizes="(max-width: 768px) 100vw, 600px" alt="${esc(altFor(featured8, t))}" loading="lazy" decoding="async" style="width:100%;height:auto;border-radius:16px;box-shadow:0 20px 40px -10px rgba(15,23,42,0.2);" />` : ""}
        </div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <h2>${t ? "9 大产品线" : "9 Product Lines"}</h2>
      <p class="lead">${t ? "覆盖军工、无人机、精密仪器、防水户外、医疗、工程塑料、工具周转、摄影舞台、拉杆商务全场景" : "Covering military, drone, instruments, waterproof, medical, engineering, tool, camera, trolley — every scenario."}</p>
      <div class="grid grid-3">${productCards}</div>
    </div>
  </section>

  <section class="section" style="background:#F8FAFC;">
    <div class="container">
      <h2>${t ? "4 大商业服务" : "4 Commercial Services"}</h2>
      <p class="lead">${t ? "批发、代理、定制、全球供货 — 一站式 B2B 服务" : "Wholesale, Agency, Custom, Global Supply — one-stop B2B."}</p>
      <div class="grid grid-4">${intentBanners}</div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <h2>${t ? "工厂实景" : "Factory Showcase"}</h2>
      <p class="lead">${t ? "13,000㎡ 工厂 · 2014 年成立 · 100+ 员工 · 60+ 设备" : "13,000㎡ Factory · Est. 2014 · 100+ Employees · 60+ Machines"}</p>
      ${factoryGrid}
    </div>
  </section>

  ${videoUrl ? `
  <section class="section" style="background:#0F172A;color:#FFFFFF;">
    <div class="container">
      <h2 style="color:#FFFFFF;">${t ? "工厂视频实拍" : "Factory Video Tour"}</h2>
      <p style="color:#CBD5E1;margin-bottom:1.5rem;">${t ? "13,000㎡ 现代化工厂 · 60+ 先进设备 · 100+ 专业员工" : "13,000㎡ Modern Facility · 60+ Advanced Machines · 100+ Skilled Workers"}</p>
      <video id="factoryVideo" autoplay muted loop playsinline controls preload="auto" playsinline webkit-playsinline style="width:100%;max-width:960px;border-radius:12px;background:#000;aspect-ratio:16/9;cursor:pointer;" poster="/images/real/hero/factory-video-poster-1120w.webp" onclick="if(this.paused){this.play()}">
        <source src="${esc(videoUrl)}" type="video/mp4" />
        ${t ? "您的浏览器不支持视频播放。" : "Your browser does not support video."}
      </video>
      <script>
        // Autoplay fallback: some browsers (Chrome 88+, Safari 14+, mobile) block autoplay
        // even with muted attribute. Explicit .play() with promise handling ensures best-effort.
        (function() {
          var v = document.getElementById('factoryVideo');
          if (!v) return;
          // Try explicit play
          var tryPlay = function() {
            var p = v.play();
            if (p && p.catch) {
              p.catch(function(err) {
                // Autoplay blocked — that's OK, user can click to play (poster is visible)
                console.log('[factoryVideo] autoplay blocked, user can click to play:', err && err.name);
              });
            }
          };
          // Multiple triggers: loadedmetadata, canplay, user interaction
          v.addEventListener('loadedmetadata', tryPlay);
          v.addEventListener('canplay', tryPlay);
          // Also try on first user interaction with page (some browsers allow autoplay after interaction)
          ['click','touchstart','keydown','scroll'].forEach(function(evt) {
            document.addEventListener(evt, function once() {
              tryPlay();
              document.removeEventListener(evt, once, true);
            }, { once: true, capture: true });
          });
        })();
      </script>
    </div>
  </section>` : ""}

  <section class="section" style="background:#F8FAFC;">
    <div class="container">
      <h2>${t ? "权威认证" : "Certifications"}</h2>
      <p class="lead">${t ? "ISO9001 · CE · ROHS · SGS · MAC · IP67 · 加州 65" : "ISO9001 · CE · ROHS · SGS · MAC · IP67 · California 65"}</p>
      <div class="grid grid-4">
        ${certs.map(c => `<div class="card" style="text-align:center;"><div style="font-size:1.5rem;font-weight:800;color:#3B5BFF;">${esc(c)}</div><div style="font-size:0.75rem;color:#64748B;margin-top:0.5rem;">${t ? "已认证" : "Certified"}</div></div>`).join("")}
      </div>
    </div>
  </section>

  <!-- Patent Certificates E-E-A-T Trust Zone -->
  <section class="section" style="background:#FFFFFF;">
    <div class="container">
      <h2>${t ? "20+ 项外观设计专利" : "20+ Design Patents"}</h2>
      <p class="lead">${t ? "所有产品均拥有自主知识产权，工具箱爪扣 / 双开 / 多功能等核心结构已申请专利保护" : "All products carry independent IP. Tool box claw latch / dual-open / multi-function core structures are patent-protected."}</p>
      <div class="grid grid-3">
        <div class="card" style="text-align:center;">
          <div style="font-size:2.5rem;font-weight:800;color:#3B5BFF;">20+</div>
          <div style="color:#64748B;">${t ? "外观设计专利" : "Design Patents"}</div>
        </div>
        <div class="card" style="text-align:center;">
          <div style="font-size:2.5rem;font-weight:800;color:#10B981;">${t ? "ZL 2022/2023" : "ZL 2022/2023"}</div>
          <div style="color:#64748B;">${t ? "最近专利授权" : "Latest Patent Grants"}</div>
        </div>
        <div class="card" style="text-align:center;">
          <div style="font-size:2.5rem;font-weight:800;color:#F59E0B;">10 ${t ? "年" : "yr"}</div>
          <div style="color:#64748B;">${t ? "专利保护期" : "Protection Period"}</div>
        </div>
      </div>
      <p style="margin-top:1.5rem;font-size:0.875rem;color:#64748B;text-align:center;">
        ${t ? "专利权人：客信新材料（广东）有限公司 · 详情" : "Patent Owner: Zhongshan Weili Plastic Products Co., Ltd. · "}
        <a href="mailto:${siteConfig.contact.email}?subject=${encodeURIComponent(t ? "专利详情" : "Patent Details")}">${t ? "联系索取证书副本" : "Request Certificate Copies"}</a>
      </p>
    </div>
  </section>

  ${sectionFAQs({ faqs: homeFaqs, lang })}

  ${renderCTA({ lang })}

  ${renderFooter({ lang })}
  `;

  return html;
}

function getProductEmoji(slug) {
  const map = {
    "military-tactical-case": "🪖",
    "drone-case": "🛸",
    "instrument-case": "🔬",
    "waterproof-case": "💧",
    "medical-case": "🏥",
    "engineering-plastic-case": "🧪",
    "tool-box": "🧰",
    "camera-stage-case": "🎬",
    "trolley-case": "🧳",
  };
  return map[slug] || "📦";
}
