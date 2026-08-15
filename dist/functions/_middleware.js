/**
 * box.beeaa.com Pages Function Middleware 鈥?V6
 * 
 * 淇 V5 bug:
 * - 绉婚櫎 tryKeys.push("zh/index.html") / "medical-case/index.html" 鍏滃簳 (404 闈欓粯鍥為椤?
 * - 绉婚櫎鍏朵粬 HTML 璺緞鐨?R2 鍏滃簳 (404 搴斿綋杩斿洖 404)
 * - 鏂板 B-tier 301 妯＄硦鍖归厤: URL 涓嶅甫鏁板瓧鍚庣紑 鈫?鑷姩鍔?-<NNNNN> 鍚?301 閲嶅畾鍚?
 * 
 * 璺敱:
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
 * 404 鍝嶅簲 鈥?鏍囧噯 404 + HTML body
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
<a href="/" class="cta">鈫?Back to Home</a>
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
 * 瑙ｆ瀽 B-tier slug 鏄惁甯?-NNNNN 鏁板瓧鍚庣紑
 * 杩斿洖 { base, hasSuffix, suffix, fullSlug }
 */
function parseBslug(slug) {
  const m = slug.match(/^(.*?)-(\d{4,6})$/);
  if (m) {
    return { base: m[1], hasSuffix: true, suffix: m[2], fullSlug: slug };
  }
  return { base: slug, hasSuffix: false, suffix: null, fullSlug: slug };
}

/**
 * 鐢?R2 List API 鏌ユ壘涓嶅甫鏁板瓧鍚庣紑鐨?slug 瀵瑰簲鐨勫疄闄?-NNNNN URL
 * 闄愬埗: 姣忎釜 prefix 鏈€澶?1 涓尮閰?(5min KV cache)
 */
const B_TIER_CACHE = new Map();
const B_TIER_TTL_MS = 5 * 60 * 1000;

async function findBslugSuffix(env, bucketName, productLine, slug) {
  // 鍙湪 box-en-b / box-zh 鎵?
  if (bucketName !== "BOX_EN_B" && bucketName !== "BOX_ZH") return null;
  const cacheKey = `${bucketName}|${productLine}|${slug}`;
  const now = Date.now();
  if (B_TIER_CACHE.has(cacheKey)) {
    const e = B_TIER_CACHE.get(cacheKey);
    if (now - e.ts < B_TIER_TTL_MS) return e.value;
  }
  // List 鎵句互 slug- 寮€澶寸殑 key (delimiter "/" 闄愬畾鍙?list 瀛愮洰褰?
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
        // cp.Prefix 褰㈠ "product-line/slug-NNNNN/"
        const matched = cp.Prefix.match(new RegExp(`^${productLine.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}/${slug.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}-(\\d{4,6})/$`));
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

  // 瑙ｆ瀽璺緞娈? 璺宠繃宸茬煡 segment
  const skipPrefixes = [
    "zh/", "medical-case/", "styles/", "images/", "_",
    "llms", "sitemap", "robots", "rss", "manifest", ".well-known",
    "guides/", "entities/", "tools/", "about/", "contact/", "products/", "markets/",
    "wholesale", "agency", "oem", "export", "faq", "blog"
  ];
  const isStaticAsset = path === "/" || path === "/index.html" || path === "/favicon.ico"
    || skipPrefixes.some(p => path === p.replace(/\/$/, "") || path.startsWith(p));

  // === /zh/* 璺敱 ===
  if (path === "/zh" || path === "/zh/" || path.startsWith("/zh/")) {
    return await handleZHRoute(context, path);
  }

  // === /medical-case/* 璺敱 ===
  if (path === "/medical-case" || path === "/medical-case/" || path.startsWith("/medical-case/")) {
    return await handleProductLineRoute(context, path, "medical-case", "BOX_EN_B");
  }

  // === 鍏朵粬 HTML 璺緞(闈為潤鎬佽祫婧? ===
  if (!isStaticAsset) {
    return await handleGenericRoute(context, path);
  }

  // === 闈欐€佽祫婧?Pages 榛樿 ===
  return withSecurityHeaders(context.next());
};

async function handleZHRoute(context, path) {
  // path 浠?/zh 寮€澶?
  const pathNoSlash = path.replace(/^\/+|\/+$/g, ""); // "zh/..." or "zh"
  
  // 妫€娴嬫槸鍚﹀甫灏鹃儴鏂滄潬
  const endsWithSlash = path === "/zh" || path.endsWith("/");

  // 绗竴杞? 绮剧‘鍖归厤
  const exactKeys = [];
  if (endsWithSlash) {
    exactKeys.push(pathNoSlash + "/index.html"); // zh/camera-stage-case/foo/index.html (FIX: 加上 /)
    exactKeys.push(pathNoSlash + "/"); // zh/camera-stage-case/foo/
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
  
  // 绗簩杞? B-tier 妯＄硦鍖归厤 鈫?301
  if (endsWithSlash) {
    // 璺緞鏄?/zh/<product-line>/<slug>/
    const m = pathNoSlash.match(/^zh\/([^/]+)\/([^/]+)\/?$/);
    if (m) {
      const productLine = m[1];
      const slug = m[2];
      const slugInfo = parseBslug(slug);
      if (!slugInfo.hasSuffix) {
        // 鏌ユ壘鍚庣紑
        const suffixNum = await findBslugSuffix(context.env, "BOX_ZH", productLine, slug);
        if (suffixNum) {
          const newPath = `/zh/${productLine}/${slug}-${suffixNum}/`;
          return serve301(newPath);
        }
      }
    }
  }
  
  // 鐪?404
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
  
  // 妯＄硦鍖归厤
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
  
  // 璺宠繃 _api, _next 涔嬬被
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
  
  // 妯＄硦鍖归厤 B-tier: 璺緞鏄?/<product-line>/<slug>/
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
