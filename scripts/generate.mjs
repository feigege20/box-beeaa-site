/**
 * box.beeaa.com 站点生成器主入口
 *
 * 流程：
 *   1. 读 data/keywords.json（OCR 提取的 32k 关键词）
 *   2. 读 data/assets/*.json（7 大资产池）
 *   3. 遍历所有产品线 + 关键词，生成 64k 页面（双语）
 *   4. 写 dist/（dist/en/... + dist/zh/...）
 *   5. 生成 robots.txt / llms.txt / llms-full.txt / sitemap.xml
 *   6. 复制 public/ 静态资源
 *
 * 用法：
 *   node scripts/generate.mjs              # 全量生成
 *   node scripts/generate.mjs --limit 50   # 每个产品线只生成 50 个长尾（试跑）
 *   node scripts/generate.mjs --only home   # 只生成首页和品类页
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { siteConfig } from "../src/lib/site.config.js";
import { renderPage } from "../src/lib/renderer.js";
import { renderHome } from "../src/lib/home.js";
import { renderCategoryPage } from "../src/lib/category.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "data");
const ASSETS = path.join(DATA, "assets");
const PUBLIC = path.join(ROOT, "public");
const LANG_DIRS = { en: "", zh: "zh" };

const args = process.argv.slice(2);
const limit = (() => {
  const i = args.indexOf("--limit");
  return i >= 0 ? parseInt(args[i + 1], 10) : Infinity;
})();
const only = (() => {
  const i = args.indexOf("--only");
  return i >= 0 ? args[i + 1] : null;
})();
const SKIP_LONGTAIL = args.includes("--no-longtail");
const SKIP_B = args.includes("--no-b");      // Phase 1 跳过 B（Pages 20K 限制）
const SKIP_B_NOINDEX_SITEMAP = args.includes("--no-b-noindex-sitemap"); // 跳过 B 级 noindex sitemap（默认生成）
const ONLY_B = args.includes("--only-b");    // Phase 2 B-en bucket：只生成 B 级
const EN_ONLY = args.includes("--en-only");   // Phase 1 先上英文，zh 用 R2/二期再加
const ONLY_B_ZH = args.includes("--only-b-zh"); // Phase 3 B-zh bucket：只生成 B 级中文
const ZH_EXTRAS_ONLY = args.includes("--zh-extras-only"); // Phase 3+: 仅生成中文 extras (sitemap-zh, 404, robots)
// 3 模式: --en-only 跳 zh；--zh-extras-only 仅生成 zh 协议文件 (sitemap-zh, 404, llms); 默认双语
const LANG_LOOP = ONLY_B_ZH || ZH_EXTRAS_ONLY ? ["zh"] : (EN_ONLY ? ["en"] : ["en", "zh"]);
// 输出目录：根据 flag 决定
const DIST = ONLY_B_ZH
  ? path.join(ROOT, "dist-b-zh")
  : ONLY_B
    ? path.join(ROOT, "dist-b-en")
    : path.join(ROOT, "dist");

async function readJson(p) {
  const raw = await fs.readFile(p, "utf-8");
  return JSON.parse(raw);
}

function ensureDir(p) {
  return fs.mkdir(p, { recursive: true });
}

async function copyDir(src, dst) {
  await ensureDir(dst);
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) await copyDir(s, d);
    else await fs.copyFile(s, d);
  }
}

async function copyStatic() {
  // 复制 public/* 到 dist/*（只复制 webp 和小文件，不复制原图 PNG/JPG）
  if (await fs.stat(PUBLIC).catch(() => null)) {
    await copyDirWebpOnly(PUBLIC, DIST);
  }
  // 复制 src/styles/theme.css
  const cssSrc = path.join(ROOT, "src/styles/theme.css");
  const cssDst = path.join(DIST, "styles/theme.css");
  await ensureDir(path.dirname(cssDst));
  await fs.copyFile(cssSrc, cssDst);
  // 复制 functions/_middleware.js 到 dist/functions/（Pages Functions bundle）
  const funcSrc = path.join(ROOT, "functions/_middleware.js");
  if (await fs.stat(funcSrc).catch(() => null)) {
    const funcDst = path.join(DIST, "functions/_middleware.js");
    await ensureDir(path.dirname(funcDst));
    await fs.copyFile(funcSrc, funcDst);
  }
  // 复制 .well-known 文件
  const wellKnownSrc = path.join(ROOT, "src/wellknown");
  if (await fs.stat(wellKnownSrc).catch(() => null)) {
    const wellKnownDst = path.join(DIST, ".well-known");
    await ensureDir(wellKnownDst);
    const entries = await fs.readdir(wellKnownSrc, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile()) {
        // _headers / _redirects 是 Cloudflare Pages 配置，不放 .well-known
        if (entry.name.startsWith("_")) {
          await fs.copyFile(
            path.join(wellKnownSrc, entry.name),
            path.join(DIST, entry.name)
          );
          continue;
        }
        // .js 文件是源文件，不复制到 .well-known
        if (entry.name.endsWith(".js")) continue;
        await fs.copyFile(
          path.join(wellKnownSrc, entry.name),
          path.join(wellKnownDst, entry.name)
        );
      }
    }
    // manifest.json 还要放在根目录
    const manifestSrc = path.join(wellKnownSrc, "manifest.json");
    if (await fs.stat(manifestSrc).catch(() => null)) {
      await fs.copyFile(manifestSrc, path.join(DIST, "manifest.json"));
    }
  }
}

async function copyDirWebpOnly(src, dst) {
  await ensureDir(dst);
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      // 跳过 patents PDF 目录
      if (entry.name === "patents") continue;
      // admin 子目录走 copyAdminStatic 单独处理（包含 .html）
      if (entry.name === "admin") {
        await copyAdminStatic(s, d);
        continue;
      }
      await copyDirWebpOnly(s, d);
    } else {
      // 只复制 webp 和小文件
      const ext = path.extname(entry.name).toLowerCase();
      if (ext === ".webp" || ext === ".svg" || entry.name === "favicon.svg" || entry.name.startsWith("favicon")) {
        await fs.copyFile(s, d);
      }
    }
  }
}

// admin/ 目录：递归复制所有 .html / .json / .webp / .svg / .txt / .xml (FRED-only 内部工具)
async function copyAdminStatic(src, dst) {
  await ensureDir(dst);
  const entries = await fs.readdir(src, { withFileTypes: true });
  const allowedExts = [".html", ".json", ".webp", ".svg", ".txt", ".xml", ".css", ".js", ".md"];
  for (const entry of entries) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      await copyAdminStatic(s, d);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (allowedExts.includes(ext) || entry.name.startsWith("favicon")) {
        await fs.copyFile(s, d);
      }
    }
  }
}

function slugify(s) {
  if (!s) return "";
  // 保留 ASCII 字母数字 + 空格 + 连字符 + CJK 中文 (U+4E00-U+9FFF)
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fff-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

// EN: 移除 mixed_en 数据里的中文 runs (修复 2026-08-06 Chinese leak)
function enCleanForSlug(s) {
  if (!s || typeof s !== "string") return s;
  let r = s.replace(/[\s\u3000]*[\u4e00-\u9fff]+[\s\u3000]*/g, " ");
  r = r.replace(/\s+/g, " ").replace(/[-–—,.:;!?]+\s*$/, "").trim();
  return r || s;
}

async function generateSitemap(enEntries, enNoindexEntries = [], zhEntries = [], zhNoindexEntries = []) {
  const base = siteConfig.protocol + "://" + siteConfig.domain;
  const today = new Date().toISOString().split('T')[0];

  // EN sitemap (只写非空)
  if (enEntries.length > 0) {
    const enXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${enEntries.map(e => `  <url>
    <loc>${e.url}</loc>
    <lastmod>${e.lastmod || today}</lastmod>
    <changefreq>${e.changefreq || "weekly"}</changefreq>
    <priority>${e.priority || "0.7"}</priority>
    ${e.hreflang_en ? `<xhtml:link rel="alternate" hreflang="en" href="${e.hreflang_en}" />` : ""}
    ${e.hreflang_zh ? `<xhtml:link rel="alternate" hreflang="zh-Hans" href="${e.hreflang_zh}" />` : ""}
    <xhtml:link rel="alternate" hreflang="x-default" href="${e.hreflang_en || e.url}" />
  </url>`).join("\n")}
</urlset>`;
    await fs.writeFile(path.join(DIST, "sitemap.xml"), enXml, "utf-8");
  }

  // ZH sitemap (只写非空)
  if (zhEntries.length > 0) {
    const zhXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${zhEntries.map(e => `  <url>
    <loc>${e.url}</loc>
    <lastmod>${e.lastmod || today}</lastmod>
    <changefreq>${e.changefreq || "weekly"}</changefreq>
    <priority>${e.priority || "0.7"}</priority>
    ${e.hreflang_en ? `<xhtml:link rel="alternate" hreflang="en" href="${e.hreflang_en}" />` : ""}
    ${e.hreflang_zh ? `<xhtml:link rel="alternate" hreflang="zh-Hans" href="${e.hreflang_zh}" />` : ""}
    <xhtml:link rel="alternate" hreflang="x-default" href="${e.hreflang_en || e.url}" />
  </url>`).join("\n")}
</urlset>`;
    await fs.writeFile(path.join(DIST, "sitemap-zh.xml"), zhXml, "utf-8");
  }

  // B-grade noindex: EN (只写非空)
  if (enNoindexEntries.length > 0) {
    const xml2 = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${enNoindexEntries.map(e => `  <url>
    <loc>${e.url}</loc>
    <lastmod>${e.lastmod || today}</lastmod>
    <changefreq>${e.changefreq || "monthly"}</changefreq>
    <priority>${e.priority || "0.4"}</priority>
    ${e.hreflang_en ? `<xhtml:link rel="alternate" hreflang="en" href="${e.hreflang_en}" />` : ""}
    ${e.hreflang_zh ? `<xhtml:link rel="alternate" hreflang="zh-Hans" href="${e.hreflang_zh}" />` : ""}
    <xhtml:link rel="alternate" hreflang="x-default" href="${e.hreflang_en || e.url}" />
  </url>`).join("\n")}
</urlset>`;
    await fs.writeFile(path.join(DIST, "sitemap-noindex.xml"), xml2, "utf-8");
  }

  // B-grade noindex: ZH (只写非空)
  if (zhNoindexEntries.length > 0) {
    const xml3 = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${zhNoindexEntries.map(e => `  <url>
    <loc>${e.url}</loc>
    <lastmod>${e.lastmod || today}</lastmod>
    <changefreq>${e.changefreq || "monthly"}</changefreq>
    <priority>${e.priority || "0.4"}</priority>
    ${e.hreflang_en ? `<xhtml:link rel="alternate" hreflang="en" href="${e.hreflang_en}" />` : ""}
    ${e.hreflang_zh ? `<xhtml:link rel="alternate" hreflang="zh-Hans" href="${e.hreflang_zh}" />` : ""}
    <xhtml:link rel="alternate" hreflang="x-default" href="${e.hreflang_en || e.url}" />
  </url>`).join("\n")}
</urlset>`;
    await fs.writeFile(path.join(DIST, "sitemap-noindex-zh.xml"), xml3, "utf-8");
  }

  // sitemap-index.xml: 用 dist 现有文件判断（避免 --zh-extras-only 模式覆盖 en sitemap）
  const sitemapFiles = [
    { name: "sitemap.xml", loc: `${base}/sitemap.xml` },
    { name: "sitemap-zh.xml", loc: `${base}/sitemap-zh.xml` },
    { name: "sitemap-noindex.xml", loc: `${base}/sitemap-noindex.xml` },
    { name: "sitemap-noindex-zh.xml", loc: `${base}/sitemap-noindex-zh.xml` },
  ];
  const indexItems = [];
  for (const sf of sitemapFiles) {
    if (await fs.stat(path.join(DIST, sf.name)).catch(() => null)) {
      indexItems.push(`  <sitemap><loc>${sf.loc}</loc><lastmod>${today}</lastmod></sitemap>`);
    }
  }
  const indexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexItems.join("\n")}
</sitemapindex>`;
  await fs.writeFile(path.join(DIST, "sitemap-index.xml"), indexXml, "utf-8");
}

async function generateRobots() {
  const base = siteConfig.protocol + "://" + siteConfig.domain;
  const content = `# robots.txt for ${base}
# 客信新材料 (KeXinMaterials) box.beeaa.com
# 架构依据：doc1.txt + a(1).html V3.0 + a(2).html
# 3 万 + 关键词分桶：
#   Tier 1 (S-grade head terms, ~270): /guides/ — 人工深度编辑，全索引
#   Tier 2 (A-grade, 12,877): /[product-line]/[keyword]/ — 标准 SEO，全索引
#   Tier 3 (B-grade, 18,438): /[product-line]/[keyword]/ — noindex, follow (sitemap-noindex.xml)
#   C-grade (173): 不创建文件，跳过

User-agent: *
Allow: /
Disallow: /admin/
Disallow: /private/

# 显式放行 AI 爬虫（让 AI 搜索引擎抓取引用）
User-agent: GPTBot
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: anthropic-ai
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: Google-Extended
Allow: /
User-agent: Bytespider
Allow: /
User-agent: CCBot
Allow: /
User-agent: Applebot-Extended
Allow: /

# Tier 1 / Tier 2 页面：允许索引
Allow: /guides/
Allow: /entities/
Allow: /tools/
Allow: /about/

# Sitemap（主 + 副 + 分语种）
Sitemap: ${base}/sitemap-index.xml
Sitemap: ${base}/sitemap.xml
Sitemap: ${base}/sitemap-zh.xml
Sitemap: ${base}/sitemap-noindex.xml
Sitemap: ${base}/sitemap-noindex-zh.xml
`;
  await fs.writeFile(path.join(DIST, "robots.txt"), content, "utf-8");
}

async function generate404Page() {
  // Pages 默认 404 兜底页（noindex）
  const base = siteConfig.protocol + "://" + siteConfig.domain;
  const html = `<!DOCTYPE html>
<html lang="en" data-theme="drone">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>404 - Page Not Found | ${siteConfig.brand.en}</title>
<meta name="description" content="The page you are looking for does not exist on box.beeaa.com. Browse our 9 product lines or contact us for a quote." />
<meta name="robots" content="noindex,follow" />
<link rel="canonical" href="${base}/404.html" />
<link rel="alternate" hreflang="en" href="${base}/404.html" />
<link rel="alternate" hreflang="zh-Hans" href="${base}/zh/404.html" />
<link rel="alternate" hreflang="x-default" href="${base}/404.html" />
<meta property="og:title" content="404 - Page Not Found" />
<meta property="og:url" content="${base}/404.html" />
<meta property="og:type" content="website" />
<link rel="preload" as="image" href="/images/real/hero/hero02-1600w.webp" type="image/webp" />
<link rel="stylesheet" href="/styles/theme.css" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
</head>
<body>
<header class="site-header">
  <div class="container">
    <nav class="nav" aria-label="Main">
      <a href="/" class="logo" aria-label="KeXinMaterials">
        <svg viewBox="0 0 240 60" xmlns="http://www.w3.org/2000/svg" aria-label="KeXinMaterials Logo"><rect x='0' y='10' width='40' height='40' rx='6' fill='#0F172A'/><text x='20' y='38' text-anchor='middle' fill='#FACC15' font-size='20' font-family='system-ui' font-weight='800'>K</text><text x='52' y='38' fill='#0F172A' font-size='20' font-family='system-ui' font-weight='800'>KeXin</text><text x='130' y='38' fill='#0F172A' font-size='20' font-family='system-ui' font-weight='300'>Materials</text></svg>
      </a>
    </nav>
  </div>
</header>
<main>
  <section class="hero" style="padding:6rem 0 4rem;text-align:center;">
    <div class="container">
      <h1 style="font-size:clamp(3rem,8vw,6rem);font-weight:800;color:#0F172A;margin:0 0 1rem;">404</h1>
      <h2 style="font-size:clamp(1.5rem,4vw,2.5rem);font-weight:600;margin:0 0 1.5rem;color:#475569;">Page Not Found</h2>
      <p style="font-size:1.125rem;color:#64748B;max-width:600px;margin:0 auto 2rem;">
        The page you are looking for doesn't exist or has been moved.
        Browse our 9 product lines below or contact us for a custom quote.
      </p>
      <div class="btn-group" style="justify-content:center;">
        <a href="/" class="btn btn-lg cta-orange">← Back to Home</a>
        <a href="mailto:${siteConfig.contact.email}" class="btn btn-lg cta-green">📧 Contact Us</a>
        <a href="https://wa.me/${siteConfig.contact.whatsapp}" class="btn btn-lg" style="background:#25D366;color:#FFFFFF;" target="_blank" rel="noopener">💬 WhatsApp</a>
      </div>
    </div>
  </section>
  <section style="padding:3rem 0 5rem;">
    <div class="container">
      <h2 class="text-center" style="margin-bottom:2rem;">Explore 9 Product Lines</h2>
      <div class="card-grid">
        ${siteConfig.productLines.map(p => `
        <a href="/${p.slug}/" class="card card-feature">
          <div class="card-body">
            <h3>${p.short_en}</h3>
            <p>${p.desc_en}</p>
            <span class="card-cta">Explore →</span>
          </div>
        </a>`).join("")}
      </div>
    </div>
  </section>
</main>
<footer class="site-footer">
  <div class="container">
    <div class="footer-bottom">
      <span>© 2026 ${siteConfig.company.en}. All rights reserved.</span>
      <span>B2B Source Factory · Global Supply</span>
    </div>
  </div>
</footer>
</body>
</html>`;
  await fs.writeFile(path.join(DIST, "404.html"), html, "utf-8");
  // zh 404
  const zhHtml = html
    .replace('lang="en"', 'lang="zh-Hans"')
    .replace('404 - Page Not Found | ${siteConfig.brand.en}', '404 - 页面未找到 | ${siteConfig.brand.zh}')
    .replace('The page you are looking for doesn\'t exist or has been moved.\n        Browse our 9 product lines below or contact us for a custom quote.', '您访问的页面不存在或已被移动。\n        请浏览我们的 9 大产品线或联系我们获取报价。')
    .replace('← Back to Home', '← 返回首页')
    .replace('📧 Contact Us', '📧 联系我们')
    .replace('💬 WhatsApp', '💬 WhatsApp')
    .replace('Page Not Found', '页面未找到')
    .replace('Explore 9 Product Lines', '浏览 9 大产品线')
    .replace(/<h3>\$\{p\.short_en\}<\/h3>/g, '<h3>${p.short_zh}</h3>')
    .replace(/<p>\$\{p\.desc_en\}<\/p>/g, '<p>${p.desc_zh || p.desc_en}</p>')
    .replace('Explore →', '查看 →')
    .replace('${siteConfig.company.en}. All rights reserved.', '${siteConfig.company.zh}. 版权所有')
    .replace('B2B Source Factory · Global Supply', 'B2B 出口工厂 · 跨境供货')
    .replace('href="/${p.slug}/"', 'href="/zh/${p.slug}/"')
    .replace('href="/"', 'href="/zh/"');
  const zhDir = path.join(DIST, "zh");
  await ensureDir(zhDir);
  await fs.writeFile(path.join(zhDir, "404.html"), zhHtml, "utf-8");
}

async function generateZhExtrasFromEn() {
  // 从 EN sitemap.xml 复制 URL 翻译成 zh（加 /zh/ 前缀），输出到 dist/zh/sitemap.xml 和 sitemap-zh.xml
  // 注意：sitemap-zh.xml 是协议文件名（B-zh bucket 也用）
  const enSitemap = path.join(DIST, "sitemap.xml");
  if (!(await fs.stat(enSitemap).catch(() => null))) {
    console.log("[GEN] No EN sitemap to translate");
    return;
  }
  const xml = await fs.readFile(enSitemap, "utf-8");
  // 在 <loc>...</loc> 中 URL 前加 /zh/
  const zhXml = xml
    .replace(/<loc>https:\/\/box\.beaa\.com\//g, "<loc>https://box.beeaa.com/zh/")
    .replace(/hreflang="en" href="https:\/\/box\.beaa\.com\//g, "hreflang=\"en\" href=\"https://box.beeaa.com/")
    .replace(/hreflang="zh-Hans" href="https:\/\/box\.beaa\.com\/zh\//g, "hreflang=\"zh-Hans\" href=\"https://box.beeaa.com/zh/");
  // 写 dist/sitemap-zh.xml (主用)
  await fs.writeFile(path.join(DIST, "sitemap-zh.xml"), zhXml, "utf-8");
  // 也写 dist/zh/sitemap.xml (兜底，给 Pages 静态查找)
  const zhDir = path.join(DIST, "zh");
  await ensureDir(zhDir);
  await fs.writeFile(path.join(zhDir, "sitemap.xml"), zhXml, "utf-8");

  // 同样翻译 sitemap-noindex.xml → sitemap-noindex-zh.xml
  const enNoindex = path.join(DIST, "sitemap-noindex.xml");
  if (await fs.stat(enNoindex).catch(() => null)) {
    const niXml = await fs.readFile(enNoindex, "utf-8");
    const zhNiXml = niXml.replace(/<loc>https:\/\/box\.beaa\.com\//g, "<loc>https://box.beeaa.com/zh/");
    await fs.writeFile(path.join(DIST, "sitemap-noindex-zh.xml"), zhNiXml, "utf-8");
  }

  // 复制 dist/tools/ 下所有文件到 dist/zh/tools/（保留结构）
  const enToolsDir = path.join(DIST, "tools");
  if (await fs.stat(enToolsDir).catch(() => null)) {
    const zhToolsDir = path.join(DIST, "zh", "tools");
    await ensureDir(zhToolsDir);
    const entries = await fs.readdir(enToolsDir, { withFileTypes: true });
    for (const e of entries) {
      const s = path.join(enToolsDir, e.name);
      const d = path.join(zhToolsDir, e.name);
      if (e.isDirectory()) {
        await ensureDir(d);
        const subEntries = await fs.readdir(s, { withFileTypes: true });
        for (const se of subEntries) {
          if (se.isFile()) {
            await fs.copyFile(path.join(s, se.name), path.join(d, se.name));
          }
        }
      } else if (e.isFile()) {
        await fs.copyFile(s, d);
      }
    }
  }

  // 生成 zh search page (with proper Chinese strings)
  try {
    const searchMod = await import("file:///" + path.join(ROOT, "src/lib/search.js").replace(/\\/g, "/"));
    const zhSearchDir = path.join(DIST, "zh", "search");
    await ensureDir(zhSearchDir);
    await fs.writeFile(path.join(zhSearchDir, "index.html"), searchMod.renderSearchPage({ lang: "zh" }), "utf-8");
  } catch (e) {
    console.warn("[GEN] ZH search page failed:", e.message);
  }

  // 生成 zh/llms.txt 翻译版
  const enLlms = path.join(DIST, "llms.txt");
  if (await fs.stat(enLlms).catch(() => null)) {
    const llms = await fs.readFile(enLlms, "utf-8");
    // 在所有 url 前加 /zh/
    const zhLlms = llms.replace(/\(https:\/\/box\.beaa\.com\//g, "(https://box.beeaa.com/zh/");
    await fs.writeFile(path.join(DIST, "llms-zh.txt"), zhLlms, "utf-8");
    await fs.writeFile(path.join(zhDir, "llms.txt"), zhLlms, "utf-8");
  }
}

async function generateLlmsTxt(assets) {
  const base = siteConfig.protocol + "://" + siteConfig.domain;
  const content = `# ${siteConfig.brand.en} (${siteConfig.brand.zh}) — box.beeaa.com

> ${siteConfig.description.en}
> 公司: ${siteConfig.company.legal_zh} / ${siteConfig.company.legal_en}
> 对外品牌: ${siteConfig.brand.en} / ${siteConfig.brand.zh}
> 工厂: ${siteConfig.factory.area_sqm}㎡ · ${siteConfig.factory.employees} 员工 · ${siteConfig.factory.equipment} · ${siteConfig.factory.patents} 专利
> 主营: ${(siteConfig.mainProducts || []).join("、")}
> 成立: ${siteConfig.founded} 年
> 联系: ${siteConfig.contact.email} / ${siteConfig.contact.phone} (WhatsApp/WeChat)
> 主站采购: ${siteConfig.contact.main_site}

## 网站架构 (Site Architecture)

依据 doc1.txt + a(1) V3.0 + a(2)，本目录采用 3-Tier 程序化 SEO + GEO + AI 引用架构：

- **Tier 1 头部词** (${siteConfig.headTerms.length} 示例): /guides/ — 人工深度编辑 (2000+ 字)，含 Article Schema + author/date/citation
- **Tier 2 中长尾** (~12,877 词): /[product-line]/[keyword]/ — 模板 + 人工审核
- **Tier 3 长尾** (~18,438 词): /[product-line]/[keyword]-[no]/ — 程序化 (noindex 试投)
- **C 级** (173 词): 跳过不创建

## 9 大产品线 (9 Product Lines)

${siteConfig.productLines.map(p => `- [${p.name_en}](${base}/${p.slug}/) — ${p.name_zh} — ${p.desc_en}`).join("\n")}

## 4 大商业服务 (4 Commercial Services)

${siteConfig.commercialIntents.map(i => `- [${i.name_en}](${base}/${i.slug}/) — ${i.name_zh} — ${i.cta_text_en}`).join("\n")}

## Tier 1 头部词指南 (Industry Guides, Tier 1)

${siteConfig.headTerms.map(h => `- [${h.en}](${base}/guides/${h.slug}/) — ${h.zh}`).join("\n")}

## 实体图谱 (Entity Graph)

${siteConfig.entities.map(e => `- [${e.name_en}](${base}/entities/${e.slug}/) — ${e.name_zh} (${e.type})`).join("\n")}

## 工具 (Tools)

${siteConfig.tools.map(t => `- [${t.en}](${base}/tools/${t.slug}/) — ${t.zh}`).join("\n")}

## 主推产品 (Featured Product)

- **${siteConfig.featuredProduct.name_en} / ${siteConfig.featuredProduct.name_zh}**: ${siteConfig.featuredProduct.description_en}

## 实际出口市场 (Real Export Markets)

${(siteConfig.exportMarkets || []).map(m => `- ${m.country_en} / ${m.country}`).join("\n")}

## 8 大全球市场 (8 Global Markets)

${siteConfig.markets.map(m => `- [${m.name_en}](${base}/markets/${m.slug}/) — ${m.name_zh} — ${(m.countries || []).join("、")}`).join("\n")}

## 真实认证 (Real Certifications)

${(siteConfig.certifications || []).join("、")}

## 定制服务 (Custom Services)

${(siteConfig.customServices || []).map(s => `- ${s.name_zh} / ${s.name_en}`).join("\n")}

## 团队 (Team / E-E-A-T)

${(siteConfig.team || []).map(m => `- ${m.name} — ${m.role_en} (${m.role_zh})`).join("\n")}

## 检测报告 (Test Reports)

${(siteConfig.testReports || []).map(r => `- ${r.name_en} (${r.standard}) — ${r.date} — ${r.result_en}`).join("\n")}

## 联系方式 (Contact)

- Email: ${siteConfig.contact.email}
- Phone/WhatsApp/WeChat: ${siteConfig.contact.phone}
- Main Store (采购): ${siteConfig.contact.main_site}
- Address: ${siteConfig.factory.location.en} (${siteConfig.factory.location.zh})

## 跨语言 (Multilingual)

- English (default): ${base}/
- 中文: ${base}/zh/

## 站点信息 (Site Info)

- Sitemap: ${base}/sitemap.xml (S + A + 品类 + 商业意图 + 市场, ${(await readJsonSafe(path.join(DATA, "keywords_scored.json"), "kos") ).filter ? "" : ""} + 实体 + 工具 + 关于)
- Sitemap (B-grade noindex): ${base}/sitemap-noindex.xml
- Robots: ${base}/robots.txt
- Full LLM data: ${base}/llms-full.txt
`;
  await fs.writeFile(path.join(DIST, "llms.txt"), content, "utf-8");
}

async function readJsonSafe(p) {
  try { return JSON.parse(await fs.readFile(p, "utf-8")); } catch { return {}; }
}

async function generateLlmsFullTxt(keywords, assets) {
  // 简化版：把 9 大产品线 + 商业意图 + 关键 FAQ 输出
  const base = siteConfig.protocol + "://" + siteConfig.domain;
  const lines = [];
  lines.push(`# ${siteConfig.brand.en} (${siteConfig.brand.zh}) — Full LLM Data\n`);
  lines.push(`## About\n`);
  lines.push(`${siteConfig.description.en}\n\nCompany: ${siteConfig.company.en}\nEmail: ${siteConfig.contact.email}\nPhone: ${siteConfig.contact.phone}\n\n`);

  // 9 大产品线
  lines.push("## 9 Product Lines\n");
  for (const p of siteConfig.productLines) {
    lines.push(`### ${p.name_en} (${p.name_zh})\n`);
    lines.push(`${p.desc_en}\nURL: ${base}/${p.slug}/\n\n`);
  }

  // FAQ 全量
  lines.push("## All FAQs\n");
  for (const faq of (assets.faqs.global || [])) {
    lines.push(`Q: ${faq.q_en}\nA: ${faq.a_en}\n\n`);
  }
  for (const [formula, faqs] of Object.entries(assets.faqs.by_formula || {})) {
    for (const faq of faqs) {
      lines.push(`Q: ${faq.q_en}\nA: ${faq.a_en}\n\n`);
    }
  }

  await fs.writeFile(path.join(DIST, "llms-full.txt"), lines.join(""), "utf-8");
}

async function main() {
  console.log("[GEN] box-beeaa-site generator starting...\n");

  // 加载数据
  console.log("[GEN] Loading data...");
  const keywords = await readJson(path.join(DATA, "keywords.json"));
  const params = await readJson(path.join(ASSETS, "params.json"));
  const cases = await readJson(path.join(ASSETS, "cases.json"));
  const faqs = await readJson(path.join(ASSETS, "faqs.json"));
  const testimonials = (await readJson(path.join(ASSETS, "testimonials.json"))).testimonials;
  const flows = (await readJson(path.join(ASSETS, "flows.json"))).flows;
  const comparisons = await readJson(path.join(ASSETS, "comparisons.json"));
  const images = await readJson(path.join(ASSETS, "images.json"));

  const assets = {
    params, cases, faqs, testimonials, flows, comparisons, images,
  };

  // 加载 KOS 评分（如有），按 grade 过滤
  let scoredKeywords = null;
  try {
    scoredKeywords = await readJson(path.join(DATA, "keywords_scored.json"));
    console.log(`[GEN] KOS scored loaded: ${scoredKeywords.length} keywords`);
    const gradeCount = {};
    for (const s of scoredKeywords) {
      gradeCount[s.grade] = (gradeCount[s.grade] || 0) + 1;
    }
    console.log(`[GEN] KOS grades: S=${gradeCount.S || 0}, A=${gradeCount.A || 0}, B=${gradeCount.B || 0}, C=${gradeCount.C || 0}`);
  } catch (e) {
    console.log("[GEN] No KOS scored file found, using all keywords (run kos_scorer.py first)");
  }

  const totalKw = Object.values(keywords.product_lines || {}).reduce((s, p) => s + (p.keywords?.length || 0), 0);
  console.log(`[GEN] Keywords loaded: ${totalKw} (${Object.keys(keywords.product_lines).length} product lines)`);
  console.log(`[GEN] Testimonials: ${testimonials.length}, Cases: ${Object.values(cases.cases).flat().length}, FAQs: ${faqs.global.length + Object.values(faqs.by_formula).flat().length + Object.values(faqs.by_product).flat().length}`);

  // 准备 dist
  // ZH_EXTRAS_ONLY 模式：不删 dist（保留 EN 已经生成的内容），只追加 zh extras
  if (!ZH_EXTRAS_ONLY) {
    await fs.rm(DIST, { recursive: true, force: true });
  }
  await ensureDir(DIST);

  // 复制静态
  await copyStatic();

  // === 生成页面 ===
  const enSitemapEntries = [];
  const enSitemapNoindexEntries = []; // B 级 noindex 页 — 给搜索引擎做发现用
  const zhSitemapEntries = [];
  const zhSitemapNoindexEntries = [];
  const sitemapEntries = []; // 兼容老调用（不再使用，由 generateSitemap 内部处理）
  const sitemapNoindexEntries = [];
  let count = { home: 0, category: 0, detail: 0, blog: 0, faq: 0, market: 0, intent: 0, noindex: 0, skipped: 0, tool: 0 };

  for (const lang of LANG_LOOP) {
    const basePrefix = lang === "zh" ? "zh" : "";
    const baseDir = path.join(DIST, basePrefix);
    await ensureDir(baseDir);

    // ZH_EXTRAS_ONLY: 只生成中文 extras (sitemap/robots/404/llms)，不生成 HTML 页面
    if (ZH_EXTRAS_ONLY) {
      console.log(`[GEN] [${lang}] Extras-only mode: skipping home/categories/long-tail/intents/markets/faq`);
      // 生成 404.html 给 Pages 提供兜底
      if (lang === "zh") {
        // Use the 404 generator
        await generate404Page();
      }
      continue; // 跳过 HTML 页面生成
    }

    // 1. 首页
    const homeHtml = renderHome({ lang });
    const homeUrl = `${siteConfig.protocol}://${siteConfig.domain}${basePrefix ? "/" + basePrefix : ""}/`;
    await fs.writeFile(path.join(baseDir, "index.html"), homeHtml, "utf-8");
    const enHomeUrl = homeUrl.replace("/zh/", "/");
    const zhHomeUrl = homeUrl.includes("/zh/") ? homeUrl : homeUrl.replace(/\/$/, "/zh/");
    const homeEntry = { url: homeUrl, hreflang_en: enHomeUrl, hreflang_zh: zhHomeUrl, changefreq: "daily", priority: "1.0" };
    (lang === "zh" ? zhSitemapEntries : enSitemapEntries).push(homeEntry);
    count.home++;
    console.log(`[GEN] [${lang}] Home: 1`);

    if (!only || only !== "home") {
      // 2. 9 个品类 landing
      for (const line of siteConfig.productLines) {
        const lineKw = keywords.product_lines[line.slug]?.keywords || [];
        const html = renderCategoryPage({ productLine: line, keywords: lineKw, lang });
        const dir = path.join(baseDir, line.slug);
        await ensureDir(dir);
        await fs.writeFile(path.join(dir, "index.html"), html, "utf-8");
        const url = `${siteConfig.protocol}://${siteConfig.domain}${basePrefix ? "/" + basePrefix : ""}/${line.slug}/`;
        const entry = {
          url,
          hreflang_en: url.replace("/zh/", "/"),
          hreflang_zh: url.includes("/zh/") ? url : url.replace(/^(https?:\/\/[^\/]+)/, "$1/zh"),
          changefreq: "weekly", priority: "0.9"
        };
        (lang === "zh" ? zhSitemapEntries : enSitemapEntries).push(entry);
        count.category++;
      }
      console.log(`[GEN] [${lang}] Categories: ${count.category}`);

      // 3. 长尾详情页（每个关键词一个）
      if (!SKIP_LONGTAIL) {
        let totalDetail = 0;
        let totalNoindex = 0;
        let totalSkipped = 0;
        for (const line of siteConfig.productLines) {
          const lineKw = keywords.product_lines[line.slug]?.keywords || [];
          const productLine = siteConfig.productLines.find(p => p.slug === line.slug);
          const lineLimit = Math.min(lineKw.length, limit === Infinity ? lineKw.length : limit);
          for (let i = 0; i < lineLimit; i++) {
            const kw = lineKw[i];

            // KOS 评分过滤
            let grade = "A"; // 默认
            if (scoredKeywords) {
              const found = scoredKeywords.find(s => s.no === kw.no && s.zh === kw.zh);
              if (found) grade = found.grade;
            }

            // C 级直接跳过（不创建文件）
            if (grade === "C") {
              totalSkipped++;
              continue;
            }
            // --no-b 时也跳过 B（Cloudflare Pages 20K 文件限制）
            if (SKIP_B && grade === "B") {
              // 但仍加入 noindex sitemap（搜索引擎做发现用）
              if (!SKIP_B_NOINDEX_SITEMAP) {
                const entry = {
                  url: `${siteConfig.protocol}://${siteConfig.domain}${basePrefix ? "/" + basePrefix : ""}/${line.slug}/${slugify(lang === "zh" ? kw.zh : enCleanForSlug(kw.en))}-${kw.no}/`,
                  hreflang_en: `${siteConfig.protocol}://${siteConfig.domain}/${line.slug}/${slugify(enCleanForSlug(kw.en))}-${kw.no}/`,
                  hreflang_zh: `${siteConfig.protocol}://${siteConfig.domain}/zh/${line.slug}/${slugify(kw.zh)}-${kw.no}/`,
                  changefreq: "monthly", priority: "0.4"
                };
                (lang === "zh" ? zhSitemapNoindexEntries : enSitemapNoindexEntries).push(entry);
              }
              totalSkipped++;
              continue;
            }
            // --only-b 时只保留 B（用于 R2 B-en bucket 单独生成）
            if (ONLY_B && grade !== "B") {
              totalSkipped++;
              continue;
            }

            let kwSlug = slugify(lang === "zh" ? kw.zh : enCleanForSlug(kw.en));
            if (!kwSlug) kwSlug = "page";
            // 用 no 后缀保证唯一性（同一英文多中文共享时）
            kwSlug = `${kwSlug}-${kw.no}`;
            const dir = path.join(baseDir, line.slug, kwSlug);
            await ensureDir(dir);
            try {
              // B 级加 noindex 标记（doc1.txt 第 3 节关键原则）
              const kwWithGrade = { ...kw, _grade: grade };
              const html = renderPage({ keyword: kwWithGrade, productLine, assets, lang, grade });
              await fs.writeFile(path.join(dir, "index.html"), html, "utf-8");
              const url = `${siteConfig.protocol}://${siteConfig.domain}${basePrefix ? "/" + basePrefix : ""}/${line.slug}/${kwSlug}/`;

              if (grade === "B") {
                // B 级 noindex，但仍加入 sitemap（搜索引擎可发现，权重传递用）
                const entry = {
                  url, hreflang_en: url.replace("/zh/", "/"),
                  hreflang_zh: url.includes("/zh/") ? url : url.replace(/^(https?:\/\/[^\/]+)/, "$1/zh"),
                  changefreq: "monthly", priority: "0.4"
                };
                (lang === "zh" ? zhSitemapNoindexEntries : enSitemapNoindexEntries).push(entry);
                totalNoindex++;
              } else {
                // A 级正常索引
                const entry = {
                  url, hreflang_en: url.replace("/zh/", "/"),
                  hreflang_zh: url.includes("/zh/") ? url : url.replace(/^(https?:\/\/[^\/]+)/, "$1/zh"),
                  changefreq: "monthly", priority: "0.6"
                };
                (lang === "zh" ? zhSitemapEntries : enSitemapEntries).push(entry);
                totalDetail++;
              }
            } catch (e) {
              console.error(`[ERR] ${line.slug}/${kwSlug}: ${e.message}`);
            }
          }
        }
        count.detail += totalDetail;
        count.noindex += totalNoindex;
        count.skipped += totalSkipped;
        console.log(`[GEN] [${lang}] Long-tail: A=${totalDetail} (index), B=${totalNoindex} (noindex), C=${totalSkipped} (skipped)`);
      }

      // 4. 5 大交互式工具 (sitemap 收录)
      if (!ONLY_B && !ONLY_B_ZH) {
        // 4.1 tools 索引页
        await ensureDir(path.join(baseDir, "tools"));
        const toolsIdxHtml = `<!DOCTYPE html>
<html lang="${lang === "zh" ? "zh-Hans" : "en"}" data-theme="drone">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${lang === "zh" ? "工具 | 客信新材料" : "Tools | KeXinMaterials"}</title>
<meta name="description" content="${lang === "zh" ? "5 大交互式工具：IP 防护等级选择器、尺寸计算器、材料对比、MOQ 估算、认证匹配。" : "5 interactive tools: IP rating selector, case size calculator, material comparator, MOQ estimator, certification matcher."}" />
<link rel="canonical" href="${siteConfig.protocol}://${siteConfig.domain}${basePrefix ? "/" + basePrefix : ""}/tools/" />
<link rel="stylesheet" href="/styles/theme.css" />
</head>
<body>
<main style="padding:4rem 0;">
<div class="container" style="max-width:900px;">
<h1>${lang === "zh" ? "工具" : "Tools"}</h1>
<p style="color:var(--color-text-muted);margin-bottom:2rem;">${lang === "zh" ? "5 大交互式工具帮您快速选型" : "5 interactive tools for fast selection"}</p>
<div class="card-grid" style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr));">
${siteConfig.tools.map(tool => `
<a href="${basePrefix ? "/" + basePrefix : ""}/tools/${tool.slug}/" class="card card-feature">
  <div class="card-body">
    <h3>${lang === "zh" ? tool.zh : tool.en}</h3>
    <p>${lang === "zh" ? tool.desc_zh : tool.desc_en}</p>
    <span class="card-cta">${lang === "zh" ? "打开工具" : "Open Tool"} →</span>
  </div>
</a>
`).join("")}
</div>
</div>
</main>
</body>
</html>`;
        await fs.writeFile(path.join(baseDir, "tools/index.html"), toolsIdxHtml, "utf-8");

        for (const tool of siteConfig.tools) {
          const toolUrl = `${siteConfig.protocol}://${siteConfig.domain}${basePrefix ? "/" + basePrefix : ""}/tools/${tool.slug}/`;
          (lang === "zh" ? zhSitemapEntries : enSitemapEntries).push({
            url: toolUrl,
            hreflang_en: `${siteConfig.protocol}://${siteConfig.domain}/tools/${tool.slug}/`,
            hreflang_zh: `${siteConfig.protocol}://${siteConfig.domain}/zh/tools/${tool.slug}/`,
            changefreq: "monthly", priority: "0.7"
          });
          count.tool++;
        }
        // tools index 也进 sitemap
        (lang === "zh" ? zhSitemapEntries : enSitemapEntries).push({
          url: `${siteConfig.protocol}://${siteConfig.domain}${basePrefix ? "/" + basePrefix : ""}/tools/`,
          hreflang_en: `${siteConfig.protocol}://${siteConfig.domain}/tools/`,
          hreflang_zh: `${siteConfig.protocol}://${siteConfig.domain}/zh/tools/`,
          changefreq: "monthly", priority: "0.8"
        });
      }

      // 5. 4 大商业意图专题
      for (const intent of siteConfig.commercialIntents) {
        const dir = path.join(baseDir, intent.slug);
        await ensureDir(dir);
        let html;
        if (intent.slug === "oem") {
          // OEM 页用 5 步询盘表单 (独立 layout, 跳过 home 页 hero)
          const oemMod = await import("file:///" + path.join(ROOT, "src/lib/oem-form.js").replace(/\\/g, "/"));
          const { renderHead, renderHeader, renderFooter, renderCTA } = await import("file:///" + path.join(ROOT, "src/lib/layout.js").replace(/\\/g, "/"));
          const langTitle = lang === "zh" ? "OEM/ODM 询盘 - 5 步定制报价" : "OEM/ODM Inquiry - 5-Step Custom Quote";
          const langDesc = lang === "zh"
            ? "5 步提交您的定制需求, 12 小时内获取工厂报价。源头工厂、OEM/ODM 定制、MOQ 50 件起、30 天交付。"
            : "Submit your custom requirements in 5 steps, get factory quote within 12 hours. Source factory, OEM/ODM, MOQ 50 pcs, 30-day delivery.";
          const canonicalOem = `${siteConfig.protocol}://${siteConfig.domain}${basePrefix ? "/" + basePrefix : ""}/oem/`;
          const oemContent = oemMod.renderOEMFormPage({ lang });
          html =
            renderHead({
              title: `${langTitle} | ${siteConfig.brand.en}`,
              description: langDesc,
              keywords: lang === "zh" ? "OEM 询盘,ODM 定制,5 步询价,客信新材料" : "OEM inquiry,ODM custom,5-step quote,KeXinMaterials",
              canonical: canonicalOem,
              lang,
              theme: "drone"
            })
            + renderHeader({ lang })
            + `<section class="hero" style="padding: 3rem 0 2rem;">
                <div class="container">
                  <h1>${langTitle}</h1>
                  <p class="lead">${lang === "zh" ? "12 小时回复 · 源头工厂 · 30 天交付 · MOQ 50 件起" : "12-Hour Reply · Source Factory · 30-Day Delivery · MOQ 50 pcs"}</p>
                </div>
              </section>`
            + oemContent
            + renderCTA({ lang })
            + renderFooter({ lang });
        } else {
          html = renderHome({ lang }).replace(
            /<title>.*?<\/title>/,
            `<title>${lang === "zh" ? intent.name_zh : intent.name_en} | ${siteConfig.brand.en}</title>`
          );
        }
        await fs.writeFile(path.join(dir, "index.html"), html, "utf-8");
        count.intent++;
      }

      // 5. 8 大市场
      for (const market of siteConfig.markets) {
        const dir = path.join(baseDir, "markets", market.slug);
        await ensureDir(dir);
        const html = renderHome({ lang }).replace(
          /<title>.*?<\/title>/,
          `<title>${lang === "zh" ? market.name_zh : market.name_en} | ${siteConfig.brand.en}</title>`
        );
        await fs.writeFile(path.join(dir, "index.html"), html, "utf-8");
        count.market++;
      }

      // 6. FAQ 聚合
      const faqDir = path.join(baseDir, "faq");
      await ensureDir(faqDir);
      await fs.writeFile(path.join(faqDir, "index.html"), renderHome({ lang }).replace(/<title>.*?<\/title>/, `<title>FAQ | ${siteConfig.brand.en}</title>`), "utf-8");
      count.faq++;

      // 7. 5 大交互式工具 (V3 doc1.txt §5.3 GEO Schema + AI 引用架构)
      if (!ONLY_B && !ONLY_B_ZH) {
        // 7.0 search page (client-side fuzzy search)
        const searchDir = path.join(baseDir, "search");
        await ensureDir(searchDir);
        try {
          const searchMod = await import("file:///" + path.join(ROOT, "src/lib/search.js").replace(/\\/g, "/"));
          await fs.writeFile(path.join(searchDir, "index.html"), searchMod.renderSearchPage({ lang }), "utf-8");
        } catch (e) {
          console.warn("[GEN] Search page failed:", e.message);
        }
        // 7.1 tools 索引页
        const toolsDir = path.join(baseDir, "tools");
        await ensureDir(toolsDir);
        // 每个工具一个文件夹
        for (const tool of siteConfig.tools) {
          const toolDir = path.join(toolsDir, tool.slug);
          await ensureDir(toolDir);
          let html;
          try {
            // 动态 import tool renderer (Windows path → file:// URL)
            const toolPath = path.join(ROOT, "src/lib/tools", `${tool.slug}.js`);
            const toolUrl = "file:///" + toolPath.replace(/\\/g, "/");
            const mod = await import(toolUrl);
            // 找 render* 函数
            const renderFn = Object.values(mod).find(v => typeof v === "function" && /^render/.test(v.name));
            if (!renderFn) throw new Error("no render function found in " + tool.slug);
            html = renderFn({ lang });
            // 注入 client-side JS — 找 *ClientJS export
            const clientJsKey = Object.keys(mod).find(k => k.endsWith("ClientJS"));
            const clientJs = clientJsKey ? mod[clientJsKey] : null;
            if (clientJs) {
              html = html.replace("</body>", `<script>${clientJs}</script></body>`);
            }
          } catch (e) {
            // fallback: 通用 placeholder
            console.warn(`[GEN] Tool ${tool.slug} not found or failed: ${e.message}. Using placeholder.`);
            html = renderHome({ lang }).replace(
              /<title>.*?<\/title>/,
              `<title>${lang === "zh" ? tool.zh : tool.en} | ${siteConfig.brand.en}</title>`
            );
          }
          await fs.writeFile(path.join(toolDir, "index.html"), html, "utf-8");
          count.tool = (count.tool || 0) + 1;
        }
        console.log(`[GEN] [${lang}] Tools: ${count.tool || 0}`);
      }
    }
  }

  // 协议文件
  if (ZH_EXTRAS_ONLY) {
    // 跳过 generateSitemap 主流程（会覆写 EN sitemap.xml），先调翻译函数，再调 generateSitemap 用空 entries 重写 index
    await generateRobots();
    await generateLlmsTxt(assets);
    await generateLlmsFullTxt(keywords, assets);
    await generateZhExtrasFromEn();
    // 现在 zh extras 已写到 dist/，让 generateSitemap 重写 index（用现有文件判断）
    await generateSitemap([], [], [], []);
  } else {
    await generateSitemap(enSitemapEntries, enSitemapNoindexEntries, zhSitemapEntries, zhSitemapNoindexEntries);
    await generateRobots();
    await generateLlmsTxt(assets);
    await generateLlmsFullTxt(keywords, assets);
    await generate404Page();
    // RSS feed (en + zh)
    try {
      const rssMod = await import("file:///" + path.join(ROOT, "src/wellknown/rss-generator.js").replace(/\\/g, "/"));
      await rssMod.generateRssFeed("en", path.join(DIST, "rss.xml"));
      await rssMod.generateRssFeed("zh", path.join(DIST, "zh/rss.xml"));
    } catch (e) {
      console.warn("[GEN] RSS generation failed:", e.message);
    }
  }

  console.log("\n[GEN] === Summary ===");
  console.log(`[GEN] Home: ${count.home}`);
  console.log(`[GEN] Categories: ${count.category}`);
  console.log(`[GEN] Long-tail (A-grade, index): ${count.detail}`);
  console.log(`[GEN] Long-tail (B-grade, noindex): ${count.noindex}`);
  console.log(`[GEN] Long-tail (C-grade, skipped): ${count.skipped}`);
  console.log(`[GEN] Commercial intents: ${count.intent}`);
  console.log(`[GEN] Markets: ${count.market}`);
  console.log(`[GEN] FAQ: ${count.faq}`);
  console.log(`[GEN] Sitemap entries (index): ${sitemapEntries.length}`);
  console.log(`[GEN] Sitemap entries (noindex): ${sitemapNoindexEntries.length}`);
  console.log(`[GEN] Output: ${DIST}`);

  // 统计 dist 大小
  const distFiles = await countFiles(DIST);
  console.log(`[GEN] Total files: ${distFiles}`);

  // RSS feed (any mode)
  try {
    const rssMod = await import("file:///" + path.join(ROOT, "src/wellknown/rss-generator.js").replace(/\\/g, "/"));
    await rssMod.generateRssFeed("en", path.join(DIST, "rss.xml"));
    // For zh, write both /rss.xml (Pages static) and /zh/rss.xml (R2/Pages fallback)
    await rssMod.generateRssFeed("zh", path.join(DIST, "rss.xml".replace("rss.xml", "zh/rss.xml")));
  } catch (e) {
    console.warn("[GEN] RSS generation failed:", e.message);
  }
}

async function countFiles(dir) {
  let count = 0;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) count += await countFiles(path.join(dir, entry.name));
    else count++;
  }
  return count;
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
