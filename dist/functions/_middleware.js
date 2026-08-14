/**
 * box.beeaa.com Pages Function Middleware — V6.1-rebuild
 *
 * 修复 V5 bug:
 * - 移除 tryKeys.push("zh/index.html") / "medical-case/index.html" 净底 (404 静态回首页)
 * - 移除其他 HTML 路径的 R2 净底 (404 应当返回 404)
 * - 新增 B-tier 301 模糊匹配: URL 不带数字后缀 → 自动加 -<NNNNN> 后 301 重定向
 *
 * 路由:
 *   /zh/*             -> R2 bucket: box-zh
 *   /medical-case/*   -> R2 bucket: box-en-b (manual override)
 *   other HTML paths  -> R2 box-en-b (B-tier) then Pages fallback
 *   other             -> Pages static
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

async function withSecurityHeaders(responsePromise) {
  const response = await responsePromise;
  const newHeaders = new Headers(response.headers);
  applySecurityHeaders(newHeaders);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}

function serveR2(obj) {
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  if (obj.httpEtag) headers.set("etag", obj.httpEtag);
  headers.set("Cache-Control", "public, max-age=3600");
  applySecurityHeaders(headers);
  return new Response(obj.body, { headers });
}

/**
 * 404 响应 — 标准 404 + HTML body
 */
function serve404() {
  const body = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>404 Not Found | KeXinMaterials</title>
<meta name="robots" content="noindex">
<style>
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif; background:#F8FAFC;color:#0F172A;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:1rem; }
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
<a href="/" class="cta">← Back to Home</a>
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

/**
 * 解析 B-tier slug 是否带 -NNNNN 数字后缀
 * 返回 { base, hasSuffix, suffix, fullSlug }
 */
function parseBslug(slug) {
  const m = slug.match(/^(.*?)-(\d{4,6})$/);
  if (m) {
    return { base: m[1], hasSuffix: true, suffix: m[2], fullSlug: slug };
  }
  return { base: slug, hasSuffix: false, suffix: null, fullSlug: slug };
}

/**
 * 用 R2 List API 查找不带数字后缀的 slug 对应的实际 -NNNNN URL
 * 限制: 每个 prefix 最多 1 个匹配 (5min KV cache)
 */
const B_TIER_CACHE = new Map();
const B_TIER_TTL_MS = 5 * 60 * 1000;

async function findBslugSuffix(env, bucketName, productLine, slug) {
  // 只在 box-en-b / box-zh 查
  if (bucketName !== "BOX_EN_B" && bucketName !== "BOX_ZH") return null;
  const cacheKey = `${bucketName}|${productLine}|${slug}`;
  const now = Date.now();
  if (B_TIER_CACHE.has(cacheKey)) {
    const e = B_TIER_CACHE.get(cacheKey);
    if (now - e.ts < B_TIER_TTL_MS) return e.value;
  }
  // List 查以 slug- 开头的 key (delimiter "/" 限定只 list 子目录)
  const prefix = `${productLine}/${slug}-`;
  const bucket = bucketName === "BOX_EN_B" ? env.BOX_EN_B : env.BOX_ZH;
  try {
    let continuationToken = null;
    let found = null;
    for (let i = 0; i < 3 && !found; i++) {
      const params = {
        Bucket: bucketName === "BOX_EN_B" ? "box-en-b" : "box-zh",
        Prefix: prefix,
        Delimiter: "/",
        MaxKeys: 50
      };
      if (continuationToken) params.ContinuationToken = continuationToken;
      const resp = await bucket.list(params);
      for (const cp of resp.CommonPrefixes || []) {
        // cp.Prefix 形如 "product-line/slug-NNNNN/"
        const matched = cp.Prefix.match(new RegExp(`^${productLine.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/${slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-(\d{4,6})/$`));
        if (matched) {
          found = matched[1];
          break;
        }
      }
      continuationToken = resp.NextContinuationToken;
      if (!resp.IsTruncated) break;
    }
    B_TIER_CACHE.set(cacheKey, { ts: now, value: found });
    return found;
  } catch (e) {
    B_TIER_CACHE.set(cacheKey, { ts: now, value: null });
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

  // 解析路径段: 跳过已知 segment
  const skipPrefixes = [
    "zh/", "medical-case/", "styles/", "images/", "_",
    "llms", "sitemap", "robots", "rss", "manifest", ".well-known",
    "guides/", "entities/", "tools/", "about/", "markets/",
    "wholesale", "agency", "oem", "export", "faq", "blog"
  ];
  const isStaticAsset = path === "/" || path === "/index.html" || path === "/favicon.ico"
    || skipPrefixes.some(p => path === p.replace(/\/$/, "") || path.startsWith(p));

  // === /zh/* 路由 ===
  if (path === "/zh" || path === "/zh/" || path.startsWith("/zh/")) {
    return await handleZHRoute(context, path);
  }

  // === /medical-case/* 路由 ===
  if (path === "/medical-case" || path === "/medical-case/" || path.startsWith("/medical-case/")) {
    return await handleProductLineRoute(context, path, "medical-case", "BOX_EN_B");
  }

  // === 其他 HTML 路径(非静态资源) ===
  if (!isStaticAsset) {
    return await handleGenericRoute(context, path);
  }

  // === 静态资源:Pages 默认 ===
  return withSecurityHeaders(context.next());
};

async function handleZHRoute(context, path) {
  // path 以 /zh 开头
  const pathNoSlash = path.replace(/^\/+|\/+$/g, ""); // "zh/..." or "zh" (no leading/trailing slash)

  // 检测是否带尾部斜杠
  const endsWithSlash = path === "/zh" || path.endsWith("/");
  let suffix = "";
  if (endsWithSlash) {
    suffix = "index.html";
  }

  // 第一轮: 精确匹配
  const exactKeys = [];
  if (endsWithSlash) {
    exactKeys.push(pathNoSlash + suffix); // zh/camera-stage-case/foo/index.html
    exactKeys.push(pathNoSlash); // zh/camera-stage-case/foo/
  } else {
    exactKeys.push(pathNoSlash); // zh/camera-stage-case/foo
    exactKeys.push(pathNoSlash + "/index.html"); // zh/camera-stage-case/foo/index.html
  }

  for (const key of exactKeys) {
    try {
      const obj = await context.env.BOX_ZH.get(key);
      if (obj) {
        return serveR2(obj);
      }
    } catch (e) { /* continue */ }
  }

  // 第二轮: B-tier 模糊匹配 → 301
  if (endsWithSlash) {
    // 路径是 /zh/<product-line>/<slug>/
    const m = pathNoSlash.match(/^zh\/([^/]+)\/([^/]+)\/?$/);
    if (m) {
      const productLine = m[1];
      const slug = m[2];
      const slugInfo = parseBslug(slug);
      if (!slugInfo.hasSuffix) {
        // 查找后缀
        const suffixNum = await findBslugSuffix(context.env, "BOX_ZH", productLine, slug);
        if (suffixNum) {
          const newPath = `/zh/${productLine}/${slug}-${suffixNum}/`;
          return serve301(newPath);
        }
      }
    }
  }

  // 否则 404
  return withSecurityHeaders(serve404());
}

async function handleProductLineRoute(context, path, productLine, bucketName) {
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
    try {
      const obj = await context.env[bucketName].get(key);
      if (obj) {
        return serveR2(obj);
      }
    } catch (e) { /* continue */ }
  }

  // 模糊匹配
  if (endsWithSlash) {
    const m = pathNoSlash.match(/^([^/]+)\/([^/]+)\/?$/);
    if (m) {
      const pl = m[1];
      const slug = m[2];
      const slugInfo = parseBslug(slug);
      if (!slugInfo.hasSuffix) {
        const suffixNum = await findBslugSuffix(context.env, bucketName, pl, slug);
        if (suffixNum) {
          const newPath = `/${pl}/${slug}-${suffixNum}/`;
          return serve301(newPath);
        }
      }
    }
  }

  return withSecurityHeaders(serve404());
}

async function handleGenericRoute(context, path) {
  const pathNoSlash = path.replace(/^\/+|\/+$/g, "");
  const endsWithSlash = path.endsWith("/");

  // 跳过 _api, _next 之类
  if (pathNoSlash.startsWith("_")) {
    return withSecurityHeaders(context.next());
  }

  const exactKeys = [];
  if (endsWithSlash) {
    exactKeys.push(pathNoSlash + "/index.html");
  } else {
    exactKeys.push(pathNoSlash);
    exactKeys.push(pathNoSlash + "/index.html");
  }

  for (const key of exactKeys) {
    try {
      const obj = await context.env.BOX_EN_B.get(key);
      if (obj) {
        return serveR2(obj);
      }
    } catch (e) { /* continue */ }
  }

  // 模糊匹配 B-tier: 路径是 /<product-line>/<slug>/
  if (endsWithSlash) {
    const m = pathNoSlash.match(/^([^/]+)\/([^/]+)\/?$/);
    if (m) {
      const pl = m[1];
      const slug = m[2];
      const slugInfo = parseBslug(slug);
      if (!slugInfo.hasSuffix) {
        const suffixNum = await findBslugSuffix(context.env, "BOX_EN_B", pl, slug);
        if (suffixNum) {
          const newPath = `/${pl}/${slug}-${suffixNum}/`;
          return serve301(newPath);
        }
      }
    }
  }

  return withSecurityHeaders(serve404());
}
