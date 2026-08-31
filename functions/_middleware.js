/**
// bindings refresh 2026-08-18: D1 + 4 R2 active
// V12 update 2026-08-31: 8 B-tier PL paths R2 fallback (Phase 14 trim)
 * box.beeaa.com Pages Function Middleware — V12
 *
 * V11 改进 (2026-08-29):
 * - 修复 /de/ /es/ /fr/ /ja/ 4 langs 404 (BUCKET binding 失败兜底)
 * - 修复 /styles/* /images/* /favicon.ico /robots.txt /sitemap.xml R2 兜底 (避免 25K 限制)
 * - 增强 try/catch: 任何 R2 binding 错误都走 Pages 静态兜底
 * - 保留 V8 double-gzip decompress + V9 cache headers
 *
 * V12 改进 (2026-08-31):
 * - 8 B-tier PL paths R2 fallback (drone/camera/military/waterproof/instrument/tool/engineering/trolley)
 * - Phase 14: enable 40K sub-PL pages in R2 to serve production (CF Pages 20K trim 兼容)
 *
 * 路由:
 *   /zh/*                  -> R2 bucket: box-zh
 *   /de|/es|/fr|/ja        -> R2 box-de/box-es/box-fr/box-ja (with fallback)
 *   /medical-case/*        -> R2 box-en-b
 *   /drone-case/* etc 8 PLs -> R2 box-en-b (V12 NEW)
 *   /styles/* /images/*    -> R2 box-en-b static (R2 全兜底)
 *   other HTML paths       -> R2 box-en-b (B-tier) then Pages fallback
 *   other                  -> Pages static
 */

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com https://plausible.io",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://beeaa.com https://*.r2.cloudflarestorage.com",
    "font-src 'self' data:",
    "connect-src 'self' https://plausible.io https://static.cloudflareinsights.com",
    "media-src 'self' https://v.psste.com https://*.r2.cloudflarestorage.com blob: data:",
    "frame-src https://wa.me",
    "form-action 'self' mailto:",
    "base-uri 'self'",
    "object-src 'none'"
  ].join("; "),
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-site"
};

function applySecurityHeaders(headers) {
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    headers.set(k, v);
  }
  return headers;
}

async function withSecurityHeaders(responsePromise, request) {
  const response = await responsePromise;
  const newHeaders = new Headers(response.headers);
  applySecurityHeaders(newHeaders);
  const ct = newHeaders.get("content-type") || "";

  newHeaders.set("Cache-Control", "public, max-age=300, must-revalidate, no-transform");

  let bodyBuf;
  try {
    bodyBuf = await response.arrayBuffer();
  } catch (e) {
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers: newHeaders });
  }

  if (bodyBuf.byteLength >= 2 && bodyBuf[0] === 0x1f && bodyBuf[1] === 0x8b) {
    try {
      const stream = new Blob([bodyBuf]).stream().pipeThrough(new DecompressionStream('gzip'));
      const decompressed = await new Response(stream).arrayBuffer();
      newHeaders.delete('Content-Encoding');
      newHeaders.set('Content-Length', String(decompressed.byteLength));
      return new Response(decompressed, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
      });
    } catch (e) {
      // fall through
    }
  }

  return new Response(bodyBuf, { status: response.status, statusText: response.statusText, headers: newHeaders });
}

async function serveR2(obj, key, request) {
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  if (obj.httpEtag) headers.set("etag", obj.httpEtag);
  const k = key || "";
  if (k.endsWith(".html") || k.endsWith("/") || (!headers.has("content-type") && !k.includes("."))) {
    headers.set("Content-Type", "text/html; charset=utf-8");
  } else if (!headers.has("content-type")) {
    headers.set("Content-Type", "application/octet-stream");
  }
  headers.set("Cache-Control", "public, max-age=300, must-revalidate");
  applySecurityHeaders(headers);
  return await withSecurityHeaders(new Response(obj.body, { headers }), request);
}

function serve404() {
  const body = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>404 Not Found | KeXinMaterials</title>
<meta robots="noindex">
<style>
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif; background:#F8FAFC;color:#0F172A;display:flex; align-items:center;justify-content:center;min-height:100vh;margin:0;padding:1rem; }
.box { max-width:560px; text-align:center; }
h1 { font-size:5rem; margin:0 0 0.5rem; color:#C2410C; }
h2 { font-size:1.5rem; margin:0 0 1rem; }
p { color:#475569; line-height:1.6; margin:0 5px 0 0; }
.cta { display:inline-block; margin-top:1.5rem; padding:0.75rem 1.5rem; background:#0F172A; color:#fff; text-decoration:none; border-radius:6px; }
</style>
</head>
<body>
<div class="box">
<h1>404</h1>
<h2>Page Not Found</h2>
<p>The page you requested is not in our catalog. This may be an old or mistyped URL. Browse our <a href="/">home page</a> for the latest products, or contact us for a custom quote.</p>
<a href="/" class="cta">Back to Home</a>
</div>
</body>
</html>`;
  return new Response(body, {
    status: 404,
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}

function serve301(targetUrl) {
  return new Response(null, {
    status: 301,
    headers: { "Location": targetUrl }
  });
}

function parseBslug(slug) {
  const m = slug.match(/^(.*?)-(\d{4,6})$/);
  if (m) {
    return { base: m[1], hasSuffix: true, suffix: m[2], fullSlug: slug };
  }
  return { base: slug, hasSuffix: false, suffix: null, fullSlug: slug };
}

const B_TIER_CACHE = new Map();
const B_TIER_TTL_MS = 5 * 60 * 1000;

async function findBslugSuffix(env, bucketBinding, productLine, slug) {
  if (bucketBinding !== "BOX_EN_B" && bucketBinding !== "BOX_ZH") return null;
  const cacheKey = `${bucketBinding}|${productLine}|${slug}`;
  const now = Date.now();
  if (B_TIER_CACHE.has(cacheKey)) {
    const e = B_TIER_CACHE.get(cacheKey);
    if (now - e.ts < B_TIER_TTL_MS) return e.value;
  }
  const bucket = env[bucketBinding];
  if (!bucket) {
    B_TIER_CACHE.set(cacheKey, { ts: now, value: null });
    return null;
  }
  try {
    const prefix = `${productLine}/${slug}-`;
    const params = {
      Bucket: bucketBinding === "BOX_EN_B" ? "box-en-b" : "box-zh",
      Prefix: prefix,
      Delimiter: "/",
      MaxKeys: 50
    };
    const resp = await bucket.list(params);
    for (const cp of resp.CommonPrefixes || []) {
      const matched = cp.Prefix.match(new RegExp(`^${productLine.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}/${slug.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}-(\\d{4,6})/$`));
      if (matched) {
        const found = matched[1];
        B_TIER_CACHE.set(cacheKey, { ts: now, value: found });
        return found;
      }
    }
    B_TIER_CACHE.set(cacheKey, { ts: now, value: null });
    return null;
  } catch (e) {
    B_TIER_CACHE.set(cacheKey, { ts: now, value: null });
    return null;
  }
}

// V11: Safe R2 get with try/catch and binding check
async function safeR2Get(env, bucketBinding, key) {
  try {
    const bucket = env[bucketBinding];
    if (!bucket) return null;
    return await bucket.get(key);
  } catch (e) {
    return null;
  }
}

export const onRequest = async (context) => {
  const url = new URL(context.request.url);
  let path;
  try {
    path = decodeURIComponent(url.pathname);
  } catch (e) {
    path = url.pathname;
  }

  // === /zh/* 路由 ===
  if (path === "/zh" || path === "/zh/" || path.startsWith("/zh/")) {
    return await handleZHRoute(context, path);
  }

  // === /de/* 路由 (5 langs: de/es/fr/ja) ===
  if (path === "/de" || path === "/de/" || path.startsWith("/de/")) {
    return await handleLangRoute(context, path, "BUCKET_DE");
  }
  if (path === "/es" || path === "/es/" || path.startsWith("/es/")) {
    return await handleLangRoute(context, path, "BUCKET_ES");
  }
  if (path === "/fr" || path === "/fr/" || path.startsWith("/fr/")) {
    return await handleLangRoute(context, path, "BUCKET_FR");
  }
  if (path === "/ja" || path === "/ja/" || path.startsWith("/ja/")) {
    return await handleLangRoute(context, path, "BUCKET_JA");
  }

  // === /medical-case/* 路由 ===
  if (path === "/medical-case" || path === "/medical-case/" || path.startsWith("/medical-case/")) {
    return await handleProductLineRoute(context, path, "medical-case", "BOX_EN_B");
  }

  // === V12 B-tier R2 fallback (8 PL paths) ===
  // Phase 14: enable R2 fallback for B-tier product line sub-PL pages
  // (trimmed from CF Pages git tree in commits e9022c2e + aa27a4d9)
  const bTierPLs = [
    "drone-case",
    "camera-stage-case",
    "military-tactical-case",
    "waterproof-case",
    "instrument-case",
    "tool-box",
    "engineering-plastic-case",
    "trolley-case"
  ];
  for (const pl of bTierPLs) {
    if (path === "/" + pl || path === "/" + pl + "/" || path.startsWith("/" + pl + "/")) {
      return await handleProductLineRoute(context, path, pl, "BOX_EN_B");
    }
  }

  // === V11 静态资源 R2 兜底 ===
  // /styles/* /images/* /favicon.ico /robots.txt /sitemap.xml /sitemap-noindex.xml
  if (path.startsWith("/styles/") || path.startsWith("/images/") || path === "/favicon.ico" || path === "/favicon-16x16.png" || path === "/favicon-32x32.png" || path === "/favicon-48x48.png" || path === "/manifest.json" || path === "/robots.txt" || path === "/sitemap.xml" || path === "/sitemap-noindex.xml") {
    return await handleStaticAssetR2(context, path);
  }

  // === 其他 HTML 路径(非静态资源) ===
  const skipPrefixes = [
    "api/", "_", ".well-known/", "rss", "llms", "guides/", "entities/", "tools/", "about/", "contact/", "products/", "markets/", "wholesale", "agency", "oem", "export", "faq", "blog"
  ];
  const isStaticAsset = path === "/" || path === "/index.html"
    || skipPrefixes.some(p => path === p.replace(/\/$/, "") || path.startsWith(p) || path.startsWith("/" + p));

  if (!isStaticAsset) {
    return await handleGenericRoute(context, path);
  }

  // === 静态资源:Pages 默认 ===
  return withSecurityHeaders(context.next(), context.request);
};

async function handleZHRoute(context, path) {
  const pathNoSlash = path.replace(/^\/+|\/+$/g, "");
  const endsWithSlash = path === "/zh" || path.endsWith("/");

  const exactKeys = [];
  if (endsWithSlash) {
    exactKeys.push(pathNoSlash + "/index.html");
    exactKeys.push(pathNoSlash + "/");
  } else {
    exactKeys.push(pathNoSlash);
    exactKeys.push(pathNoSlash + "/index.html");
  }

  for (const key of exactKeys) {
    const obj = await safeR2Get(context.env, "BOX_ZH", key);
    if (obj) {
      return await serveR2(obj, key, context.request);
    }
  }

  if (endsWithSlash) {
    const m = pathNoSlash.match(/^zh\/([^/]+)\/([^/]+)\/?$/);
    if (m) {
      const productLine = m[1];
      const slug = m[2];
      const slugInfo = parseBslug(slug);
      if (!slugInfo.hasSuffix) {
        const suffixNum = await findBslugSuffix(context.env, "BOX_ZH", productLine, slug);
        if (suffixNum) {
          return serve301(`/zh/${productLine}/${slug}-${suffixNum}/`);
        }
      }
    }
  }

  return withSecurityHeaders(serve404(), context.request);
}

async function handleLangRoute(context, path, bucketBinding) {
  const pathNoSlash = path.replace(/^\/+|\/+$/g, "");
  const endsWithSlash = path.endsWith("/");

  const langMatch = pathNoSlash.match(/^(de|es|fr|ja)(?:\/(.*))?$/);
  const stripped = langMatch ? (langMatch[2] || "") : pathNoSlash;

  const exactKeys = [];
  if (endsWithSlash) {
    if (stripped) {
      exactKeys.push(stripped + "/index.html");
      exactKeys.push(stripped + "/");
    } else {
      exactKeys.push("index.html");
      exactKeys.push("");
    }
  } else {
    if (stripped) {
      exactKeys.push(stripped);
      exactKeys.push(stripped + "/index.html");
    } else {
      exactKeys.push("index.html");
    }
  }

  for (const key of exactKeys) {
    const obj = await safeR2Get(context.env, bucketBinding, key);
    if (obj) {
      return await serveR2(obj, key, context.request);
    }
  }

  return withSecurityHeaders(serve404(), context.request);
}

async function handleProductLineRoute(context, path, productLine, bucketBinding) {
  const pathNoSlash = path.replace(/^\/+|\/+$/g, "");
  const endsWithSlash = path === `/${productLine}` || path.endsWith("/");

  const exactKeys = [];
  if (endsWithSlash) {
    exactKeys.push(pathNoSlash + "/index.html");
  } else {
    exactKeys.push(pathNoSlash);
    exactKeys.push(pathNoSlash + "/index.html");
  }

  for (const key of exactKeys) {
    const obj = await safeR2Get(context.env, bucketBinding, key);
    if (obj) {
      return await serveR2(obj, key, context.request);
    }
  }

  if (endsWithSlash) {
    const m = pathNoSlash.match(/^([^/]+)\/([^/]+)\/?$/);
    if (m) {
      const pl = m[1];
      const slug = m[2];
      const slugInfo = parseBslug(slug);
      if (!slugInfo.hasSuffix) {
        const suffixNum = await findBslugSuffix(context.env, bucketBinding, pl, slug);
        if (suffixNum) {
          return serve301(`/${pl}/${slug}-${suffixNum}/`);
        }
      }
    }
  }

  return withSecurityHeaders(serve404(), context.request);
}

// V11: 静态资源 R2 兜底 (从 box-en-b 桶拉)
async function handleStaticAssetR2(context, path) {
  // path like /styles/theme.css -> R2 key: styles/theme.css
  // /favicon.ico -> favicon.ico
  // /robots.txt -> robots.txt
  // /sitemap.xml -> sitemap.xml
  const key = path.replace(/^\/+/, "");

  // 试 box-en-b 桶
  let obj = await safeR2Get(context.env, "BOX_EN_B", key);

  // 试 box-zh 桶 (for zh static if needed)
  if (!obj) {
    obj = await safeR2Get(context.env, "BOX_ZH", key);
  }

  if (obj) {
    return await serveR2(obj, key, context.request);
  }

  // R2 没找到, 走 Pages 静态
  return withSecurityHeaders(context.next(), context.request);
}

async function handleGenericRoute(context, path) {
  const pathNoSlash = path.replace(/^\/+|\/+$/g, "");
  const endsWithSlash = path.endsWith("/");

  if (pathNoSlash.startsWith("_")) {
    return withSecurityHeaders(context.next(), context.request);
  }

  const exactKeys = [];
  if (endsWithSlash) {
    exactKeys.push(pathNoSlash + "/index.html");
  } else {
    exactKeys.push(pathNoSlash);
    exactKeys.push(pathNoSlash + "/index.html");
  }

  for (const key of exactKeys) {
    const obj = await safeR2Get(context.env, "BOX_EN_B", key);
    if (obj) {
      return await serveR2(obj, key, context.request);
    }
  }

  if (endsWithSlash) {
    const m = pathNoSlash.match(/^([^/]+)\/([^/]+)\/?$/);
    if (m) {
      const pl = m[1];
      const slug = m[2];
      const slugInfo = parseBslug(slug);
      if (!slugInfo.hasSuffix) {
        const suffixNum = await findBslugSuffix(context.env, "BOX_EN_B", pl, slug);
        if (suffixNum) {
          return serve301(`/${pl}/${slug}-${suffixNum}/`);
        }
      }
    }
  }

  return withSecurityHeaders(serve404(), context.request);
}// V11 emergency fix: 4 langs R2 binding + static assets R2 fallback (2026-08-29)
