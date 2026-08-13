/**
 * 公共布局组件：head / header / footer
 * 所有页面共享
 */

import { siteConfig } from "./site.config.js";
import { renderSchema, allGlobalSchemas } from "./schemas.js";
import { renderAnalytics } from "./analytics.js";

const BASE_URL = `${siteConfig.protocol}://${siteConfig.domain}`;

function escapeHtml(s) {
  if (s == null) return "";
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function renderHead({ title, description, keywords, canonical, ogImage, lang = "en", theme = "drone", schemas = [], noindex = false, article = false }) {
  // hreflang: 双向指向 + x-default
  // 当前页是 EN → hreflangEn = 当前, hreflangZh = 当前 + /zh/
  // 当前页是 ZH → hreflangEn = 当前去 /zh/, hreflangZh = 当前
  let hreflangEn, hreflangZh;
  if (lang === "zh") {
    hreflangZh = canonical;
    // EN 版 = canonical 去掉 /zh/ 段
    hreflangEn = canonical.includes("/zh/")
      ? canonical.replace("/zh/", "/")
      : canonical.replace(BASE_URL, BASE_URL).replace(/\/+$/, "") + "/";
  } else {
    hreflangEn = canonical;
    hreflangZh = canonical.replace(BASE_URL + "/", BASE_URL + "/zh/");
  }
  const hreflangDefault = hreflangEn;

  // robots: noindex 时强制 max-snippet:-1 让搜索引擎放弃
  const robotsContent = noindex
    ? "noindex,follow,max-snippet:-1"
    : "index,follow,max-image-preview:large,max-snippet:-1";

  return `<!DOCTYPE html>
<html lang="${lang === "zh" ? "zh-Hans" : "en"}" data-theme="${theme}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta name="keywords" content="${escapeHtml(keywords || "")}" />
  <link rel="canonical" href="${canonical}" />
  <link rel="alternate" hreflang="en" href="${hreflangEn}" />
  <link rel="alternate" hreflang="zh-Hans" href="${hreflangZh}" />
  <link rel="alternate" hreflang="x-default" href="${hreflangDefault}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:type" content="${article ? "article" : "website"}" />
  <meta property="og:locale" content="${lang === "zh" ? "zh_CN" : "en_US"}" />
  ${ogImage ? `<meta property="og:image" content="${ogImage}" />` : `<meta property="og:image" content="${BASE_URL}/images/real/hero/hero02-1600w.webp" />`}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="robots" content="${robotsContent}" />
  ${noindex ? '<meta name="googlebot" content="noindex" />' : ""}
  ${article ? `<meta name="article:author" content="KeXinMaterials Editorial" />
  <meta name="article:publisher" content="KeXinMaterials (Guangdong) Co., Ltd." />` : ""}
  <link rel="preload" as="image" href="/images/real/hero/hero02-1600w.webp" type="image/webp" fetchpriority="high" />
  <link rel="stylesheet" href="/styles/theme.css" />
  <link rel="icon" type="image/x-icon" href="/favicon.ico" sizes="any" />
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
  <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
  <link rel="apple-touch-icon" sizes="152x152" href="/apple-touch-icon-152x152.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#C2410C" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="KeXinMaterials" />
  ${renderAnalytics()}
  ${allGlobalSchemas()}
  ${schemas.map(s => renderSchema(s)).join("\n")}
</head>
<body>`;
}

export function renderHeader({ lang = "en", currentPath = "/" } = {}) {
  const t = lang === "zh";
  // 移动端: logo 短版 + 主题切换 + 汉堡 (3 项 132px 适合 375px 视口)
  // 桌面端: 完整 nav-links + 主题切换
  return `<header class="site-header">
  <div class="container">
    <nav class="nav" aria-label="Main">
      <a href="${t ? "/zh/" : "/"}" class="logo" aria-label="KeXinMaterials">
        <svg class="logo-full" viewBox="0 0 240 60" xmlns="http://www.w3.org/2000/svg" aria-label="KeXinMaterials Logo"><rect x='0' y='10' width='40' height='40' rx='6' fill='#0F172A'/><text x='20' y='38' text-anchor='middle' fill='#FACC15' font-size='20' font-family='system-ui' font-weight='800'>K</text><text x='52' y='38' fill='#0F172A' font-size='20' font-family='system-ui' font-weight='800'>KeXin</text><text x='130' y='38' fill='#0F172A' font-size='20' font-family='system-ui' font-weight='300'>Materials</text></svg>
        <svg class="logo-short" viewBox="0 0 110 60" xmlns="http://www.w3.org/2000/svg" aria-label="KeXinMaterials"><rect x='0' y='10' width='40' height='40' rx='6' fill='#0F172A'/><text x='20' y='38' text-anchor='middle' fill='#FACC15' font-size='20' font-family='system-ui' font-weight='800'>K</text><text x='52' y='38' fill='#0F172A' font-size='20' font-family='system-ui' font-weight='800'>KeXin</text></svg>
      </a>
      <div class="nav-links" id="navLinks">
        ${siteConfig.productLines.map(p => `
          <a href="${t ? "/zh" : ""}/${p.slug}/">${t ? p.short_zh : p.short_en}</a>
        `).join("")}
        <a href="${t ? "/zh" : ""}/wholesale/">${t ? "批发" : "Wholesale"}</a>
        <a href="${t ? "/zh" : ""}/oem/">${t ? "OEM" : "OEM"}</a>
        <a href="${t ? "/zh" : ""}/export/">${t ? "出口" : "Export"}</a>
        <a href="mailto:${siteConfig.contact.email}" class="cta-blue">${t ? "询盘" : "Inquiry"}</a>
        <a href="${t ? "/" : "/zh/"}" class="lang-switch nav-lang">${t ? "EN" : "中"}</a>
      </div>
      <div class="header-controls">
        <a href="${t ? "/" : "/zh/"}" class="lang-switch header-lang" aria-label="${t ? "切换语言" : "Switch language"}">${t ? "EN" : "中"}</a>
        <button type="button" class="theme-toggle" id="themeToggle" aria-label="${t ? "切换暗色模式" : "Toggle dark mode"}" title="${t ? "暗色模式" : "Dark mode"}">
          <span class="theme-icon-light" aria-hidden="true">☀️</span>
          <span class="theme-icon-dark" aria-hidden="true">🌙</span>
        </button>
        <button type="button" class="hamburger" id="navToggle" aria-label="${t ? "打开菜单" : "Open menu"}" aria-expanded="false" aria-controls="navLinks">
          <span></span><span></span><span></span>
        </button>
      </div>
    </nav>
  </div>
  <script>
  (function() {
    var btn = document.getElementById('navToggle');
    var menu = document.getElementById('navLinks');
    if (btn && menu) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var open = menu.classList.toggle('is-open');
        btn.classList.toggle('is-open', open);
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        document.body.style.overflow = open ? 'hidden' : '';
      });
      menu.querySelectorAll('a').forEach(function(a) {
        a.addEventListener('click', function() {
          if (window.innerWidth < 1024) {
            menu.classList.remove('is-open');
            btn.classList.remove('is-open');
            btn.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
          }
        });
      });
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && menu.classList.contains('is-open')) {
          menu.classList.remove('is-open');
          btn.classList.remove('is-open');
          btn.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
        }
      });
      document.addEventListener('click', function(e) {
        if (!menu.classList.contains('is-open')) return;
        if (menu.contains(e.target) || btn.contains(e.target)) return;
        menu.classList.remove('is-open');
        btn.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    }
    var themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
      var stored = null;
      try { stored = localStorage.getItem('theme'); } catch (e) {}
      var sysDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      var initial = stored || (sysDark ? 'dark' : 'light');
      if (initial === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
      else document.documentElement.setAttribute('data-theme', 'light');
      themeBtn.addEventListener('click', function() {
        var cur = document.documentElement.getAttribute('data-theme');
        var next = cur === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        try { localStorage.setItem('theme', next); } catch (e) {}
      });
    }
  })();
  </script>
</header>`;
}

export function renderFooter({ lang = "en" } = {}) {
  const t = lang === "zh";
  return `<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div>
        <h3 style="font-size:1rem;font-weight:700;">${t ? siteConfig.brand.zh : siteConfig.brand.en}</h3>
        <p>${t ? siteConfig.tagline.zh : siteConfig.tagline.en}</p>
        <p style="margin-top:1rem;">
          <strong>${t ? "邮箱" : "Email"}:</strong> <a href="mailto:${siteConfig.contact.email}">${siteConfig.contact.email}</a><br/>
          <strong>${t ? "电话/微信/WhatsApp" : "Phone/WeChat/WhatsApp"}:</strong> <a href="tel:${siteConfig.contact.phone}">${siteConfig.contact.phone}</a><br/>
          <strong>${t ? "主站采购" : "Main Store"}:</strong> <a href="${siteConfig.contact.main_site}" target="_blank" rel="noopener">${siteConfig.contact.main_site}</a>
        </p>
      </div>
      <div>
        <h3 style="font-size:1rem;font-weight:700;">${t ? "9 大产品线" : "9 Product Lines"}</h3>
        <ul style="list-style:none;padding:0;margin:0;line-height:2;">
          ${siteConfig.productLines.map(p => `<li><a href="${t ? "/zh" : ""}/${p.slug}/">${t ? p.short_zh : p.short_en}</a></li>`).join("")}
        </ul>
      </div>
      <div>
        <h3 style="font-size:1rem;font-weight:700;">${t ? "商业服务" : "Services"}</h3>
        <ul style="list-style:none;padding:0;margin:0;line-height:2;">
          <li><a href="${t ? "/zh" : ""}/wholesale/">${t ? "批发采购" : "Wholesale"}</a></li>
          <li><a href="${t ? "/zh" : ""}/agency/">${t ? "代理加盟" : "Agency"}</a></li>
          <li><a href="${t ? "/zh" : ""}/oem/">${t ? "OEM/ODM" : "OEM/ODM"}</a></li>
          <li><a href="${t ? "/zh" : ""}/export/">${t ? "全球供货" : "Global Supply"}</a></li>
        </ul>
      </div>
      <div>
        <h3 style="font-size:1rem;font-weight:700;">${t ? "全球市场" : "Global Markets"}</h3>
        <ul style="list-style:none;padding:0;margin:0;line-height:2;">
          ${siteConfig.markets.slice(0, 6).map(m => `<li><a href="${t ? "/zh" : ""}/markets/${m.slug}/">${t ? m.name_zh : m.name_en}</a></li>`).join("")}
        </ul>
      </div>
      <div>
        <h3 style="font-size:1rem;font-weight:700;">${t ? "资源" : "Resources"}</h3>
        <ul style="list-style:none;padding:0;margin:0;line-height:2;">
          <li><a href="${t ? "/zh" : ""}/faq/">FAQ</a></li>
          <li><a href="${t ? "/zh" : ""}/blog/">${t ? "博客" : "Blog"}</a></li>
          <li><a href="${t ? "/zh" : ""}/llms.txt">llms.txt</a></li>
          <li><a href="${t ? "/zh" : ""}/sitemap.xml">Sitemap</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© 2026 ${t ? siteConfig.company.zh : siteConfig.company.en}. ${t ? "版权所有" : "All rights reserved"}.</span>
      <span>${t ? "B2B 出口工厂" : "B2B Source Factory"} · ${t ? "跨境供货" : "Global Supply"}</span>
    </div>
  </div>
</footer>
<script>
  // PWA service worker registration
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
  }
</script>
</body>
</html>`;
}

/** 通用 CTA 块 */
export function renderCTA({ lang = "en", title, subtitle, primaryCta, secondaryCta } = {}) {
  const t = lang === "zh";
  return `<section class="cta-block">
  <div class="container">
    <h2>${escapeHtml(title || (t ? "立即询盘，30 天交付" : "Inquire Now · 30-Day Delivery"))}</h2>
    <p>${escapeHtml(subtitle || (t ? "源头工厂、批发价、12 小时报价" : "Source factory, wholesale price, 12-hour quote"))}</p>
    <div class="btn-group">
      <a href="mailto:${siteConfig.contact.email}?subject=${encodeURIComponent(t ? "询盘" : "Inquiry")}" class="btn btn-lg cta-orange">${primaryCta || (t ? "📧 邮件询盘" : "📧 Email Inquiry")}</a>
      <a href="https://wa.me/${siteConfig.contact.whatsapp}?text=${encodeURIComponent(t ? "您好，我想咨询防护箱" : "Hello, I'd like to inquire about protective cases")}" class="btn btn-lg cta-green" target="_blank" rel="noopener">${t ? "💬 WhatsApp" : "💬 WhatsApp"}</a>
      <a href="${siteConfig.contact.main_site}" class="btn btn-lg" style="background:#FFFFFF;color:#0F172A;" target="_blank" rel="noopener">${secondaryCta || (t ? "🛒 去主站采购" : "🛒 Shop at Main Site")}</a>
    </div>
  </div>
</section>`;
}

/** 面包屑 */
export function renderBreadcrumb({ items, lang = "en" }) {
  return `<div class="container">
  <nav class="breadcrumb" aria-label="breadcrumb">
    ${items.map((item, i) => {
      const isLast = i === items.length - 1;
      return isLast
        ? `<span>${escapeHtml(item.name)}</span>`
        : `<a href="${item.url}">${escapeHtml(item.name)}</a><span>›</span>`;
    }).join("")}
  </nav>
</div>`;
}

/** 公共参数表渲染 */
export function renderParamsTable(params, lang = "en") {
  const t = lang === "zh";
  const rows = Object.entries(params)
    .map(([key, val]) => `<tr><td><strong>${escapeHtml(t ? labelsZh[key] || key : labelsEn[key] || key)}</strong></td><td>${escapeHtml(Array.isArray(val) ? val.join("、") : val)}</td></tr>`)
    .join("");
  return `<table class="params-table">
    <thead>
      <tr><th>${t ? "参数" : "Parameter"}</th><th>${t ? "规格" : "Specification"}</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
}

const labelsZh = { material: "材质", ip_rating: "防护等级", temp_range: "适用温度", moq: "起订量", lead_time_days: "交付周期", certifications: "认证" };
const labelsEn = { material: "Material", ip_rating: "IP Rating", temp_range: "Temp Range", moq: "MOQ", lead_time_days: "Lead Time", certifications: "Certifications" };
