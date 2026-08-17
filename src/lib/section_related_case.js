/**
 * Section renderer - Related Case Studies (B-tier 内部链接增强)
 * 同 PL 随机 4 个 + 跨 PL 2 个 case study
 */
function esc(s) {
  if (s == null) return "";
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/**
 * 同 PL 随机 4 个 case study (基于 keyword hash 选择, 保证同 keyword 总是相同 related)
 * @param {Object} keyword - 当前 keyword
 * @param {Array} allKws - 同 PL 所有 keyword
 * @param {number} count - 选几个 (默认 4)
 * @param {string} lang - 'en' | 'zh'
 * @returns {Array<{no, slug, title}>}
 */
export function pickRelatedCaseStudies(keyword, allKws, count = 4, lang = "en") {
  if (!allKws || allKws.length === 0) return [];
  // Filter same PL
  const same = allKws.filter(k => k.no !== keyword.no && k._product_line === keyword._product_line);
  if (same.length === 0) return [];
  // Use keyword no as seed for deterministic selection
  const seed = keyword.no * 31;
  const picked = [];
  const used = new Set();
  for (let i = 0; i < count && i < same.length; i++) {
    const idx = (seed + i * 17) % same.length;
    let attempts = 0;
    let finalIdx = idx;
    while (used.has(finalIdx) && attempts < same.length) {
      finalIdx = (finalIdx + 1) % same.length;
      attempts++;
    }
    if (used.has(finalIdx)) break;
    used.add(finalIdx);
    picked.push(same[finalIdx]);
  }
  return picked.map(k => {
    const slug = `${k.en.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${k.no}`;
    return { no: k.no, slug, title: k.en, title_zh: k.zh, _product_line: k._product_line };
  });
}


/**
 * Render Related Case Studies section
 * @param {Array} relatedKws - 4-6 keywords to link to
 * @param {string} currentSlug - 当前 keyword slug (排除自己)
 * @param {string} lang - 'en' | 'zh'
 * @param {string} basePrefix - '' for EN, '/zh' for ZH
 * @param {string} productLine - fallback if k._product_line missing
 * @returns {string} HTML
 */
export function sectionRelatedCaseStudies({ relatedKws, currentSlug, lang, basePrefix = "", productLine = "" }) {
  if (!relatedKws || relatedKws.length === 0) return "";
  const t = lang === "zh";
  const prefix = basePrefix || (t ? "/zh" : "");
  return `<section class="section" style="background:#F8FAFC;">
  <div class="container">
    <h2>${t ? "相关案例研究" : "Related Case Studies"}</h2>
    <p style="color:#475569;margin-bottom:1.5rem;">${t
      ? `探索我们其他 ${relatedKws.length} 个同系列案例研究, 全部源头工厂直供、IP67 认证、30-45 天交付。`
      : `Explore our other ${relatedKws.length} case studies in the same category, all source factory direct, IP67 certified, 30-45 day delivery.`}</p>
    <div class="grid grid-${Math.min(relatedKws.length, 4)}">
      ${relatedKws.map(k => {
        const title = t ? (k.title_zh || k.title) : k.title;
        const pl = k._product_line || productLine || "";
        const link = `${prefix}/${pl}/${k.slug}/`;
        return `<a href="${esc(link)}" class="card" style="text-decoration:none;display:block;padding:1.25rem;border:1px solid #E2E8F0;border-radius:8px;transition:all 0.2s;background:#FFFFFF;">
          <div style="font-weight:600;color:#0F172A;margin-bottom:0.5rem;font-size:0.9375rem;line-height:1.4;">${esc(title)}</div>
          <div style="font-size:0.8125rem;color:#64748B;">${t ? "查看案例 →" : "View Case Study →"}</div>
        </a>`;
      }).join("")}
    </div>
  </div>
</section>`;
}


/**
 * Top 50 Case Studies (for hub pages)
 * @param {Array} kws - top keywords (sorted by score)
 * @param {string} currentSlug - 当前 hub slug
 * @param {string} lang - 'en' | 'zh'
 * @param {string} basePrefix
 * @param {number} count - 50
 */
export function sectionTopCaseStudies({ kws, currentSlug, lang, basePrefix = "", count = 50 }) {
  if (!kws || kws.length === 0) return "";
  const t = lang === "zh";
  const prefix = basePrefix || (t ? "/zh" : "");
  const top = kws.slice(0, count);
  return `<section class="section" style="background:#F8FAFC;">
  <div class="container">
    <h2>${t ? "热门案例研究 Top 50" : "Top 50 Case Studies"}</h2>
    <p style="color:#475569;margin-bottom:1.5rem;">${t
      ? `按搜索量 + 商业意图评分排序的 ${top.length} 个本类目热门关键词, 全部已生成独立页面。`
      : `${top.length} top keywords in this category ranked by search demand + commercial intent, all with dedicated pages.`}</p>
    <div class="grid grid-4" style="gap:0.75rem;">
      ${top.map(k => {
        const slug = `${k.en.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${k.no}`;
        const title = t ? (k.zh || k.en) : k.en;
        const link = `${prefix}/${k._product_line || currentSlug}/${slug}/`;
        return `<a href="${esc(link)}" style="display:block;padding:0.625rem 0.875rem;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:6px;font-size:0.8125rem;color:#0F172A;text-decoration:none;line-height:1.4;transition:all 0.15s;" onmouseover="this.style.borderColor='#3B5BFF';this.style.background='#EEF2FF';" onmouseout="this.style.borderColor='#E2E8F0';this.style.background='#FFFFFF';">
          ${esc(title.length > 50 ? title.slice(0, 47) + "..." : title)}
        </a>`;
      }).join("")}
    </div>
  </div>
</section>`;
}
