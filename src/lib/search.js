/**
 * Search Page — client-side fuzzy search across 9 product lines + tools + guides
 * Index data embedded in HTML for instant client-side search (no server roundtrip)
 */
import { siteConfig } from "./site.config.js";
import { renderHead, renderHeader, renderFooter, renderCTA } from "./layout.js";
import { webSiteSchema, softwareApplicationSchema } from "./schemas.js";

const BASE_URL = `${siteConfig.protocol}://${siteConfig.domain}`;

function esc(s) {
  if (s == null) return "";
  return String(s).replace(/[<>&'"]/g, c => ({ "<": "&lt;", ">": "&gt;", "&amp;": "&amp;", "'": "&apos;", '"': "&quot;" }[c]));
}

export function renderSearchPage({ lang = "en" } = {}) {
  const t = lang === "zh";

  // Build search index (embedded as JSON in HTML for client-side search)
  const searchIndex = [
    ...siteConfig.productLines.map(p => ({
      type: "product",
      title: t ? p.name_zh : p.name_en,
      desc: t ? p.desc_zh : p.desc_en,
      url: `${BASE_URL}${t ? "/zh" : ""}/${p.slug}/`,
      keywords: `${p.slug} ${p.name_en} ${p.name_zh} ${p.desc_en} ${p.desc_zh}`,
    })),
    ...siteConfig.tools.map(tool => ({
      type: "tool",
      title: t ? tool.zh : tool.en,
      desc: t ? tool.desc_zh : tool.desc_en,
      url: `${BASE_URL}${t ? "/zh" : ""}/tools/${tool.slug}/`,
      keywords: `${tool.slug} ${tool.en} ${tool.zh}`,
    })),
    ...siteConfig.commercialIntents.map(i => ({
      type: "service",
      title: t ? i.name_zh : i.name_en,
      desc: t ? i.desc_zh : i.desc_en,
      url: `${BASE_URL}${t ? "/zh" : ""}/${i.slug}/`,
      keywords: `${i.slug} ${i.name_en} ${i.name_zh}`,
    })),
    ...siteConfig.markets.map(m => ({
      type: "market",
      title: t ? m.name_zh : m.name_en,
      desc: (m.countries || []).slice(0, 5).join(", "),
      url: `${BASE_URL}${t ? "/zh" : ""}/markets/${m.slug}/`,
      keywords: `${m.slug} ${m.name_en} ${m.name_zh} ${(m.countries || []).join(" ")}`,
    })),
    ...siteConfig.headTerms.slice(0, 30).map(h => ({
      type: "guide",
      title: t ? h.zh : h.en,
      desc: (t ? h.zh : h.en) + " - Industry Guide",
      url: `${BASE_URL}${t ? "/zh" : ""}/guides/${h.slug}/`,
      keywords: `${h.en} ${h.zh} ${h.slug || ""}`,
    })),
  ];

  const html = `
<section class="hero" style="padding:3rem 0 2rem;">
  <div class="container">
    <h1 style="font-size:clamp(2rem,5vw,3rem);font-weight:800;margin-bottom:1rem;">
      🔍 ${t ? "搜索" : "Search"}
    </h1>
    <p style="font-size:1.125rem;color:var(--color-text-muted);max-width:720px;">
      ${t
        ? "搜索 9 大产品线、5 大工具、商业服务、全球市场。输入关键词立即找到你需要的内容。"
        : "Search across 9 product lines, 5 tools, commercial services, and global markets. Type to find what you need instantly."}
    </p>
  </div>
</section>

<section style="padding:2rem 0 4rem;">
  <div class="container" style="max-width:900px;">
    <div class="card card-elevated" style="padding:1.5rem;">
      <input
        type="search"
        id="searchInput"
        placeholder="${t ? "输入关键词 (如: 防护箱, IP67, OEM)..." : "Type a keyword (e.g. protective case, IP67, OEM)..."}"
        style="width:100%;padding:1rem;font-size:1.25rem;border:2px solid var(--color-border);border-radius:var(--radius);font-family:inherit;"
        autofocus
      />
      <p id="searchStats" style="margin-top:0.5rem;color:var(--color-text-muted);font-size:0.875rem;">
        ${t ? "索引中含 " : "Indexed: "}${searchIndex.length}${t ? " 项" : " items"}
      </p>
    </div>

    <div id="searchResults" style="margin-top:2rem;display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem;"></div>

    <div id="searchEmpty" style="display:none;margin-top:2rem;text-align:center;padding:3rem;color:var(--color-text-muted);">
      <p style="font-size:1.125rem;">${t ? "没有匹配的结果。试试其他关键词？" : "No matches. Try different keywords?"}</p>
    </div>
  </div>
</section>

<script type="application/json" id="searchIndexData">${JSON.stringify(searchIndex)}</script>
<script>
(function() {
  var dataEl = document.getElementById('searchIndexData');
  if (!dataEl) return;
  var data = JSON.parse(dataEl.textContent);
  var input = document.getElementById('searchInput');
  var results = document.getElementById('searchResults');
  var stats = document.getElementById('searchStats');
  var empty = document.getElementById('searchEmpty');
  var lang = (document.documentElement.lang || 'en').toLowerCase().startsWith('zh') ? 'zh' : 'en';
  var msgCount = lang === 'zh' ? '找到 ' : 'Found ';
  var msgIn = lang === 'zh' ? ' 项匹配' : ' matches';

  function score(item, q) {
    var s = 0;
    var qLower = q.toLowerCase();
    if (item.title.toLowerCase().indexOf(qLower) >= 0) s += 10;
    if (item.desc && item.desc.toLowerCase().indexOf(qLower) >= 0) s += 5;
    if (item.keywords && item.keywords.toLowerCase().indexOf(qLower) >= 0) s += 3;
    return s;
  }

  function render(results) {
    if (!results.length) {
      resultsEl().style.display = 'none';
      empty.style.display = 'block';
      stats.textContent = msgCount + '0' + msgIn;
      return;
    }
    empty.style.display = 'none';
    var html = results.map(function(r) {
      var badgeColor = r.type === 'product' ? 'var(--color-accent)' : r.type === 'tool' ? 'var(--color-success)' : r.type === 'service' ? 'var(--color-warning)' : 'var(--color-info)';
      return '<a href="' + r.url + '" class="card card-feature" style="text-decoration:none;color:inherit;">' +
        '<div class="card-body">' +
          '<span class="badge" style="background:' + badgeColor + ';color:#fff;padding:0.25rem 0.75rem;border-radius:var(--radius-full);font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em;">' + r.type + '</span>' +
          '<h3 style="margin-top:0.75rem;">' + r.title + '</h3>' +
          '<p style="color:var(--color-text-muted);font-size:0.875rem;">' + (r.desc || '').substring(0, 120) + '</p>' +
          '<span class="card-cta">' + (lang === 'zh' ? '查看 →' : 'View →') + '</span>' +
        '</div>' +
      '</a>';
    }).join('');
    resultsEl().innerHTML = html;
    stats.textContent = msgCount + results.length + msgIn;
  }

  function resultsEl() {
    return document.getElementById('searchResults');
  }

  input.addEventListener('input', function() {
    var q = input.value.trim();
    if (q.length < 2) {
      render([]);
      return;
    }
    var scored = data.map(function(item) {
      return { item: item, s: score(item, q) };
    }).filter(function(x) { return x.s > 0; });
    scored.sort(function(a, b) { return b.s - a.s; });
    render(scored.slice(0, 30).map(function(x) { return x.item; }));
  });
})();
</script>
`;

  return renderHead({
    title: t ? "搜索 | 客信新材料" : "Search | KeXinMaterials",
    description: t
      ? "搜索 9 大产品线、5 大工具、商业服务、全球市场。输入关键词立即找到你需要的内容。"
      : "Search 9 product lines, 5 tools, commercial services, and global markets.",
    keywords: t ? "搜索, 防护箱, 客信新材料" : "search, protective case, KeXinMaterials",
    canonical: `${BASE_URL}/${t ? "zh/" : ""}search/`,
    lang,
    theme: "drone",
    schemas: [
      webSiteSchema(),
      softwareApplicationSchema({
        name: t ? "网站搜索" : "Site Search",
        description: t ? "客户端模糊搜索 9 大产品线 + 5 工具" : "Client-side fuzzy search across 9 product lines + 5 tools",
        url: `${BASE_URL}/${t ? "zh/" : ""}search/`,
      }),
    ],
  })
  + renderHeader({ lang, currentPath: "/search/" })
  + html
  + renderCTA({ lang })
  + renderFooter({ lang });
}
