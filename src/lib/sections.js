/**
 * Section 渲染器 — 40+ 套结构变体的核心
 * 依据 doc1.txt + a(1).html + a(2).html：
 * - 25+ 模板变体（不再是 4 个）
 * - Key Facts / Summary / Dataset / Expert Opinion / Sources（AI 引用增强）
 * - 第一人称 + 主观判断 + 未发表数据（AI 防检测）
 * - 段落长度变化 + 段落顺序打乱
 * - Author byline + E-E-A-T 模块
 */

function esc(s) {
  if (s == null) return "";
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

const LABELS = {
  zh: {
    definition: "一句话定义", params: "关键参数", process: "5 步定制流程", case: "客户案例",
    comparison: "与同类对比", faqs: "常见问答", cta: "立即询盘", tldr: "TL;DR 速答",
    deep_dive: "深度解读", checklist: "选购清单", testimonials: "用户评价",
    specs: "规格详解", pricing: "批发价目", warehouse: "仓库实景", logistics: "物流方案",
    market_needs: "市场需求", certifications: "认证清单", export_process: "出口流程",
    local_case: "当地案例", local_faqs: "本地常见问答",
    key_facts: "关键事实", expert_opinion: "专家观点", sources: "数据来源",
    author_byline: "作者署名", dataset: "实测数据", about_company: "关于工厂",
    rd_team: "研发团队", test_reports: "检测报告", pros_cons: "优缺点",
    market_share: "市场占比", faq_quick: "快速问答", bottom_line: "一句话结论",
  },
  en: {
    definition: "Definition", params: "Key Specifications", process: "5-Step Customization", case: "Case Study",
    comparison: "Comparison", faqs: "FAQs", cta: "Inquire Now", tldr: "TL;DR",
    deep_dive: "Deep Dive", checklist: "Selection Checklist", testimonials: "Testimonials",
    specs: "Specifications", pricing: "Wholesale Pricing", warehouse: "Warehouse", logistics: "Logistics",
    market_needs: "Market Needs", certifications: "Certifications", export_process: "Export Process",
    local_case: "Local Case", local_faqs: "Local FAQs",
    key_facts: "Key Facts", expert_opinion: "Expert Opinion", sources: "Data Sources",
    author_byline: "Author", dataset: "Test Data", about_company: "About the Factory",
    rd_team: "R&D Team", test_reports: "Test Reports", pros_cons: "Pros & Cons",
    market_share: "Market Share", faq_quick: "Quick Answers", bottom_line: "Bottom Line",
  },
};

// === 基础模块（继承原有）===

export function sectionHero({ title, subtitle, image, lang, primaryCta, secondaryCta }) {
  return `<section class="hero">
  <div class="container">
    <h1>${esc(title)}</h1>
    <p>${esc(subtitle)}</p>
    <div class="hero-cta">
      <a href="#contact" class="btn btn-lg cta-orange">${esc(primaryCta || (lang === "zh" ? "📧 立即询盘" : "📧 Email Inquiry"))}</a>
      <a href="https://wa.me/8613590555309" class="btn btn-lg cta-green" target="_blank" rel="noopener">${lang === "zh" ? "💬 WhatsApp" : "💬 WhatsApp"}</a>
    </div>
    ${image ? `<div style="margin-top:3rem;">${image}</div>` : ""}
  </div>
</section>`;
}

export function sectionDefinition({ text, lang }) {
  return `<section class="section">
  <div class="container">
    <div class="callout">
      <div class="callout-label">${LABELS[lang].definition}</div>
      <p>${esc(text)}</p>
    </div>
  </div>
</section>`;
}

export function sectionParams({ params, lang }) {
  const t = lang === "zh";
  const labelMap = {
    material: { zh: "材质", en: "Material" },
    ip_rating: { zh: "防护等级", en: "IP Rating" },
    temp_range: { zh: "适用温度", en: "Temp Range" },
    moq: { zh: "起订量", en: "MOQ" },
    lead_time_days: { zh: "交付周期", en: "Lead Time" },
    certifications: { zh: "认证", en: "Certifications" },
  };
  const rows = Object.entries(params).map(([k, v]) =>
    `<tr><td><strong>${labelMap[k]?.[lang] || k}</strong></td><td>${esc(Array.isArray(v) ? v.join(", ") : v)}</td></tr>`
  ).join("");
  return `<section class="section">
  <div class="container">
    <h2>${LABELS[lang].params}</h2>
    <table class="params-table">
      <thead><tr><th>${t ? "参数" : "Parameter"}</th><th>${t ? "规格" : "Specification"}</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
</section>`;
}

export function sectionProcess({ steps, lang }) {
  return `<section class="section" style="background:#F8FAFC;">
  <div class="container">
    <h2>${LABELS[lang].process}</h2>
    <div class="grid grid-${Math.min(steps.length, 4)}">
      ${steps.map((s, i) => `<div class="card">
        <div style="font-size:2rem;color:#3B5BFF;font-weight:800;margin-bottom:0.5rem;">${i + 1}</div>
        <h3>${esc(s.title)}</h3>
        <p>${esc(s.desc)}</p>
      </div>`).join("")}
    </div>
  </div>
</section>`;
}

export function sectionCase({ caseData, lang }) {
  const t = lang === "zh";
  if (!caseData) return "";
  return `<section class="section">
  <div class="container">
    <h2>${LABELS[lang].case}</h2>
    <div class="card" style="background:linear-gradient(135deg,#0F172A 0%,#1E293B 100%);color:#FFFFFF;border:none;">
      <div class="grid grid-3 text-sm">
        <div><div class="callout-label" style="color:#FACC15;">${t ? "客户" : "Client"}</div><p style="color:#FFFFFF;">${esc(caseData[t ? "client" : "client_en"])}</p></div>
        <div><div class="callout-label" style="color:#FACC15;">${t ? "行业" : "Industry"}</div><p style="color:#FFFFFF;">${esc(caseData.industry)}</p></div>
        <div><div class="callout-label" style="color:#FACC15;">${t ? "市场" : "Market"}</div><p style="color:#FFFFFF;">${esc(caseData.market)} · ${caseData.year}</p></div>
      </div>
      <div style="margin-top:1.5rem;padding-top:1.5rem;border-top:1px solid #334155;">
        <p><strong style="color:#FACC15;">${t ? "痛点" : "Challenge"}:</strong> <span style="color:#CBD5E1;">${esc(caseData[t ? "challenge" : "challenge_en"] || caseData.challenge)}</span></p>
        <p style="margin-top:0.75rem;"><strong style="color:#FACC15;">${t ? "方案" : "Solution"}:</strong> <span style="color:#CBD5E1;">${esc(caseData[t ? "solution" : "solution_en"] || caseData.solution)}</span></p>
        <p style="margin-top:0.75rem;"><strong style="color:#FACC15;">${t ? "结果" : "Result"}:</strong> <span style="color:#CBD5E1;">${esc(caseData[t ? "result" : "result_en"] || caseData.result)}</span></p>
      </div>
    </div>
  </div>
</section>`;
}

export function sectionComparison({ comparison, lang }) {
  if (!comparison) return "";
  const t = lang === "zh";
  const headerRow = comparison.rows[0];
  const dataRows = comparison.rows.slice(1);
  return `<section class="section">
  <div class="container">
    <h2>${LABELS[lang].comparison}</h2>
    <table class="params-table">
      <thead><tr>${headerRow.map(h => `<th>${esc(h)}</th>`).join("")}</tr></thead>
      <tbody>${dataRows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody>
    </table>
  </div>
</section>`;
}

export function sectionFAQs({ faqs, lang }) {
  if (!faqs || faqs.length === 0) return "";
  const t = lang === "zh";
  return `<section class="section" style="background:#F8FAFC;">
  <div class="container">
    <h2>${LABELS[lang].faqs}</h2>
    <div class="faq-list">
      ${faqs.map(f => `<details class="faq-item">
        <summary>${esc(t ? f.q_zh : f.q_en)}</summary>
        <p>${esc(t ? f.a_zh : f.a_en)}</p>
      </details>`).join("")}
    </div>
  </div>
</section>`;
}

export function sectionTLDR({ text, lang }) {
  return `<section class="section" style="background:linear-gradient(135deg,#FEF3C7 0%,#FFFFFF 100%);">
  <div class="container">
    <h2>${LABELS[lang].tldr}</h2>
    <div class="callout" style="background:#FFFFFF;">
      <p style="font-size:1.125rem;line-height:1.8;">${esc(text)}</p>
    </div>
  </div>
</section>`;
}

export function sectionDeepDive({ paragraphs, lang }) {
  return `<section class="section">
  <div class="container container-narrow">
    <h2>${LABELS[lang].deep_dive}</h2>
    ${paragraphs.map(p => `<p style="margin-bottom:1.5rem;line-height:1.8;">${esc(p)}</p>`).join("")}
  </div>
</section>`;
}

export function sectionChecklist({ items, lang }) {
  return `<section class="section" style="background:#F8FAFC;">
  <div class="container">
    <h2>${LABELS[lang].checklist}</h2>
    <ul style="list-style:none;padding:0;">
      ${items.map(i => `<li style="padding:0.75rem 0;border-bottom:1px solid #E2E8F0;display:flex;gap:0.75rem;">
        <span style="color:#10B981;font-weight:800;">✓</span>
        <span>${esc(i)}</span>
      </li>`).join("")}
    </ul>
  </div>
</section>`;
}

export function sectionTestimonials({ items, lang }) {
  if (!items || items.length === 0) return "";
  const uid = "tc-" + Math.random().toString(36).slice(2, 8);
  return `<section class="section">
  <div class="container">
    <div class="tc-head">
      <h2 style="margin:0;">${LABELS[lang].testimonials}</h2>
      <div class="tc-controls" aria-label="carousel controls">
        <button class="tc-btn" data-tc-prev="${uid}" aria-label="Previous">‹</button>
        <button class="tc-btn" data-tc-next="${uid}" aria-label="Next">›</button>
      </div>
    </div>
    <div class="tc-track" id="${uid}">
      ${items.map(t => `<div class="tc-card">
        <div class="tc-stars" aria-label="${t.rating || 5} stars">${"★".repeat(t.rating || 5)}${"☆".repeat(5 - (t.rating || 5))}</div>
        <blockquote class="tc-quote">"${esc(lang === "zh" ? t.quote_zh : t.quote_en)}"</blockquote>
        <div class="tc-author">— ${esc(lang === "zh" ? t.client_zh : t.client_en)}</div>
        <div class="tc-meta">${esc(t.company)} · ${t.date}</div>
      </div>`).join("")}
    </div>
  </div>
</section>
<style>
  .tc-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; gap:1rem; }
  .tc-controls { display:flex; gap:0.5rem; }
  .tc-btn { width:40px; height:40px; border-radius:8px; border:1px solid #E2E8F0; background:#FFFFFF; color:#0F172A; font-size:24px; line-height:1; cursor:pointer; transition:all 0.2s; }
  .tc-btn:hover { border-color:#C2410C; color:#C2410C; background:#FFF7ED; }
  .tc-btn:active { transform:scale(0.95); }
  .tc-track { display:flex; gap:1rem; overflow-x:auto; scroll-snap-type:x mandatory; scroll-behavior:smooth; padding:0.5rem 0 1rem; -webkit-overflow-scrolling:touch; scrollbar-width:thin; }
  .tc-track::-webkit-scrollbar { height:6px; }
  .tc-track::-webkit-scrollbar-thumb { background:#CBD5E1; border-radius:3px; }
  .tc-card { flex:0 0 calc(100% - 2rem); min-width:280px; max-width:380px; scroll-snap-align:start; background:#FFFFFF; border:1px solid #E2E8F0; border-radius:12px; padding:1.25rem; box-shadow:0 1px 3px rgba(0,0,0,0.04); }
  @media (min-width:768px) { .tc-card { flex:0 0 calc(50% - 0.5rem); } }
  @media (min-width:1024px) { .tc-card { flex:0 0 calc(33.333% - 0.667rem); } }
  .tc-stars { color:#F59E0B; font-size:18px; margin-bottom:0.5rem; letter-spacing:2px; }
  .tc-quote { font-style:italic; color:#1E293B; margin:0 0 1rem; line-height:1.6; font-size:0.95rem; }
  .tc-author { font-size:0.875rem; color:#475569; font-weight:600; }
  .tc-meta { font-size:0.75rem; color:#94A3B8; margin-top:0.25rem; }
</style>
<script>
  // Testimonial carousel: arrow button navigation
  (function() {
    document.querySelectorAll('[data-tc-prev]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var id = btn.getAttribute('data-tc-prev');
        var t = document.getElementById(id);
        if (t) t.scrollBy({ left: -t.clientWidth * 0.8, behavior: 'smooth' });
      });
    });
    document.querySelectorAll('[data-tc-next]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var id = btn.getAttribute('data-tc-next');
        var t = document.getElementById(id);
        if (t) t.scrollBy({ left: t.clientWidth * 0.8, behavior: 'smooth' });
      });
    });
  })();
</script>`;
}

export function sectionSpecs({ specs, lang }) {
  return `<section class="section">
  <div class="container">
    <h2>${LABELS[lang].specs}</h2>
    <div class="grid grid-3">
      ${specs.map(s => `<div class="card">
        <h3>${esc(s.name)}</h3>
        <p>${esc(s.desc)}</p>
        ${s.price ? `<p style="color:#3B5BFF;font-weight:700;margin-top:0.5rem;">${esc(s.price)}</p>` : ""}
      </div>`).join("")}
    </div>
  </div>
</section>`;
}

export function sectionPricing({ tiers, lang }) {
  return `<section class="section" style="background:#F8FAFC;">
  <div class="container">
    <h2>${LABELS[lang].pricing}</h2>
    <table class="params-table">
      <thead><tr><th>${lang === "zh" ? "数量" : "Quantity"}</th><th>${lang === "zh" ? "单价" : "Unit Price"}</th><th>${lang === "zh" ? "折扣" : "Discount"}</th><th>${lang === "zh" ? "交期" : "Lead Time"}</th></tr></thead>
      <tbody>${tiers.map(t => `<tr><td>${esc(t.qty)}</td><td><strong>${esc(t.price)}</strong></td><td>${esc(t.discount || "-")}</td><td>${esc(t.leadTime)}</td></tr>`).join("")}</tbody>
    </table>
  </div>
</section>`;
}

export function sectionMarketNeeds({ content, lang }) {
  return `<section class="section">
  <div class="container">
    <h2>${LABELS[lang].market_needs}</h2>
    <p style="line-height:1.8;">${esc(content)}</p>
  </div>
</section>`;
}

export function sectionCertifications({ certs, lang }) {
  return `<section class="section" style="background:#F8FAFC;">
  <div class="container">
    <h2>${LABELS[lang].certifications}</h2>
    <div class="grid grid-4">
      ${certs.map(c => `<div class="card" style="text-align:center;">
        <div style="font-size:1.5rem;font-weight:800;color:#3B5BFF;margin-bottom:0.5rem;">${esc(c)}</div>
        <div style="font-size:0.75rem;color:#64748B;">${lang === "zh" ? "认证标准" : "Standard"}</div>
      </div>`).join("")}
    </div>
  </div>
</section>`;
}

export function sectionFlow({ flow, lang }) {
  if (!flow) return "";
  return `<section class="section">
  <div class="container">
    <h2>${lang === "zh" ? flow.name_zh : flow.name_en}</h2>
    <div style="background:#FFFFFF;padding:1.5rem;border-radius:12px;border:1px solid #E2E8F0;">${flow.svg}</div>
  </div>
</section>`;
}

// === AI 引用增强模块 ===

export function sectionKeyFacts({ facts, lang }) {
  if (!facts || facts.length === 0) return "";
  return `<section class="section" style="background:linear-gradient(135deg,#EFF6FF 0%,#FFFFFF 100%);">
  <div class="container">
    <h2>${LABELS[lang].key_facts}</h2>
    <ul style="list-style:none;padding:0;display:grid;gap:0.75rem;">
      ${facts.map(f => `<li style="padding:1rem;background:#FFFFFF;border-left:4px solid #3B5BFF;border-radius:4px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
        <strong style="color:#1E40AF;">${esc(f.label)}:</strong> <span style="color:#1F2937;">${esc(f.value)}</span>
      </li>`).join("")}
    </ul>
  </div>
</section>`;
}

export function sectionExpertOpinion({ quote, author, title, lang }) {
  if (!quote) return "";
  return `<section class="section" style="background:#F8FAFC;">
  <div class="container">
    <h2>${LABELS[lang].expert_opinion}</h2>
    <div class="card" style="border-left:4px solid #F59E0B;background:#FFFBEB;">
      <p style="font-size:1.125rem;font-style:italic;line-height:1.8;margin-bottom:1rem;">"${esc(quote)}"</p>
      <div style="font-size:0.875rem;color:#92400E;">
        <strong>— ${esc(author)}</strong>${title ? `, ${esc(title)}` : ""}
      </div>
    </div>
  </div>
</section>`;
}

export function sectionSources({ sources, lang }) {
  if (!sources || sources.length === 0) return "";
  return `<section class="section">
  <div class="container">
    <h2>${LABELS[lang].sources}</h2>
    <ol style="font-size:0.875rem;color:#64748B;line-height:1.8;">
      ${sources.map(s => `<li>${esc(s)}</li>`).join("")}
    </ol>
  </div>
</section>`;
}

export function sectionAuthorByline({ author, role, datePublished, dateModified, profileUrl, lang }) {
  if (!author) return "";
  return `<section class="section" style="background:#F8FAFC;padding:1.5rem 0;">
  <div class="container">
    <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;font-size:0.875rem;color:#475569;">
      <div>
        <strong style="color:#1E293B;">${LABELS[lang].author_byline}:</strong>
        <a href="${esc(profileUrl || "#")}" style="color:#3B5BFF;text-decoration:none;font-weight:600;">${esc(author)}</a>
        ${role ? `<span style="color:#94A3B8;"> · ${esc(role)}</span>` : ""}
      </div>
      ${datePublished ? `<div style="color:#94A3B8;">📅 ${lang === "zh" ? "发布" : "Published"}: ${esc(datePublished)}${dateModified && dateModified !== datePublished ? ` (${lang === "zh" ? "更新" : "Updated"}: ${esc(dateModified)})` : ""}</div>` : ""}
    </div>
  </div>
</section>`;
}

export function sectionDataset({ data, lang }) {
  if (!data || data.length === 0) return "";
  return `<section class="section">
  <div class="container">
    <h2>${LABELS[lang].dataset}</h2>
    <p style="font-size:0.875rem;color:#64748B;margin-bottom:1rem;">${lang === "zh" ? "以下数据基于我厂 2024-2026 年实测" : "Data below based on in-house testing 2024-2026"}</p>
    <table class="params-table">
      <thead><tr><th>${lang === "zh" ? "测试项" : "Test Item"}</th><th>${lang === "zh" ? "标准" : "Standard"}</th><th>${lang === "zh" ? "实测" : "Actual"}</th><th>${lang === "zh" ? "判定" : "Result"}</th></tr></thead>
      <tbody>${data.map(d => `<tr><td><strong>${esc(d.item)}</strong></td><td>${esc(d.standard)}</td><td>${esc(d.actual)}</td><td style="color:${d.pass ? "#10B981" : "#EF4444"};font-weight:700;">${d.pass ? (lang === "zh" ? "✓ 通过" : "✓ Pass") : (lang === "zh" ? "✗ 失败" : "✗ Fail")}</td></tr>`).join("")}</tbody>
    </table>
  </div>
</section>`;
}

export function sectionProsCons({ pros, cons, lang }) {
  if (!pros || !cons) return "";
  const t = lang === "zh";
  return `<section class="section">
  <div class="container">
    <h2>${LABELS[lang].pros_cons}</h2>
    <div class="grid grid-2">
      <div class="card" style="background:#F0FDF4;border:1px solid #86EFAC;">
        <h3 style="color:#16A34A;">✓ ${t ? "优点" : "Pros"}</h3>
        <ul>${pros.map(p => `<li>${esc(p)}</li>`).join("")}</ul>
      </div>
      <div class="card" style="background:#FEF2F2;border:1px solid #FCA5A5;">
        <h3 style="color:#DC2626;">✗ ${t ? "缺点" : "Cons"}</h3>
        <ul>${cons.map(c => `<li>${esc(c)}</li>`).join("")}</ul>
      </div>
    </div>
  </div>
</section>`;
}

export function sectionAboutCompany({ lang }) {
  const t = lang === "zh";
  const title = t ? "关于客信新材料工厂" : "About KeXinMaterials Factory";
  const content = t
    ? `客信新材料（广东）有限公司，2014 年成立，13,000㎡ 工厂，60+ 台先进制造设备，20+ 项专利，100+ 名员工，150+ 现货规格。主营塑料工具箱、防护箱、安全箱、防水箱 OEM/ODM 定制，覆盖户外考察、军警消防、电子电器、科学探测、航空通信。已出口美国、英国、德国、加拿大、日本、俄罗斯、菲律宾、印度、港台、中东等 30+ 国家。`
    : `KeXinMaterials (Guangdong) Co., Ltd., Founded 2014. 13,000㎡ facility, 60+ advanced machines, 20+ patents, 100+ employees, 150+ in-stock SKUs. Specializing in plastic tool boxes, protective cases, safety cases, waterproof cases — OEM/ODM custom for outdoor exploration, military/fire/police, electronics, scientific research, aerospace & communications. Exported to 30+ countries: USA, UK, Germany, Canada, Japan, Russia, Philippines, India, HK/TW, Middle East.`;
  return `<section class="section" style="background:#F8FAFC;">
  <div class="container">
    <h2>${title}</h2>
    <p style="line-height:1.8;">${esc(content)}</p>
  </div>
</section>`;
}

export function sectionRDTeam({ lang }) {
  const t = lang === "zh";
  return `<section class="section">
  <div class="container">
    <h2>${t ? "研发团队" : "R&D Team"}</h2>
    <div class="grid grid-3">
      <div class="card">
        <h3>${t ? "结构设计" : "Structural Design"}</h3>
        <p>${t ? "8 人团队，平均 8 年防护箱设计经验。SolidWorks + AutoCAD + 3D 打印快速打样。" : "8 engineers, avg 8 years case design. SolidWorks + AutoCAD + 3D rapid prototyping."}</p>
      </div>
      <div class="card">
        <h3>${t ? "材料工程" : "Materials Engineering"}</h3>
        <p>${t ? "5 人团队，专注 PP / ABS / PC / 玻纤增强材料配方与改性。军规 IP67 配方自主研发。" : "5 engineers, PP / ABS / PC / glass-fiber reinforced. Self-developed MIL-SPEC IP67 formula."}</p>
      </div>
      <div class="card">
        <h3>${t ? "工艺工程" : "Process Engineering"}</h3>
        <p>${t ? "12 人团队，注塑 + 吹塑 + 吸塑 + 模压全工艺。模具设计、试模、量产工艺优化。" : "12 engineers, injection + blow + vacuum + compression molding. Mold design, trial, mass production."}</p>
      </div>
    </div>
  </div>
</section>`;
}

export function sectionTestReports({ reports, lang }) {
  if (!reports || reports.length === 0) return "";
  return `<section class="section" style="background:#F8FAFC;">
  <div class="container">
    <h2>${LABELS[lang].test_reports}</h2>
    <div class="grid grid-2">
      ${reports.map(r => `<div class="card">
        <h3>${esc(r.name)}</h3>
        <p style="font-size:0.875rem;color:#64748B;">${esc(r.standard)} · ${esc(r.date)}</p>
        <p>${esc(r.result)}</p>
      </div>`).join("")}
    </div>
  </div>
</section>`;
}

export function sectionBottomLine({ text, lang }) {
  return `<section class="section" style="background:linear-gradient(135deg,#0F172A 0%,#1E293B 100%);color:#FFFFFF;">
  <div class="container">
    <h2 style="color:#FFFFFF;">${LABELS[lang].bottom_line}</h2>
    <p style="font-size:1.25rem;line-height:1.8;color:#F1F5F9;">${esc(text)}</p>
  </div>
</section>`;
}

export function sectionFAQQuick({ faqs, lang }) {
  if (!faqs || faqs.length === 0) return "";
  const t = lang === "zh";
  return `<section class="section">
  <div class="container">
    <h2>${LABELS[lang].faq_quick}</h2>
    <div class="grid grid-2">
      ${faqs.map(f => `<div class="card" style="background:#FEF3C7;border-left:4px solid #F59E0B;">
        <h3 style="color:#92400E;font-size:1rem;">Q: ${esc(t ? f.q_zh : f.q_en)}</h3>
        <p style="font-size:0.875rem;margin-top:0.5rem;">A: ${esc(t ? f.a_zh : f.a_en)}</p>
      </div>`).join("")}
    </div>
  </div>
</section>`;
}

export function sectionMarketShare({ data, lang }) {
  if (!data || data.length === 0) return "";
  return `<section class="section" style="background:#F8FAFC;">
  <div class="container">
    <h2>${LABELS[lang].market_share}</h2>
    <div class="grid grid-${Math.min(data.length, 4)}">
      ${data.map(d => `<div class="card" style="text-align:center;">
        <div style="font-size:2.5rem;font-weight:800;color:#3B5BFF;">${esc(d.value)}</div>
        <div style="font-size:0.875rem;color:#64748B;margin-top:0.5rem;">${esc(d.label)}</div>
      </div>`).join("")}
    </div>
  </div>
</section>`;
}
