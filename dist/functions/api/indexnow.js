/**
 * Bing/Yandex IndexNow 自动通知 API 端点
 * 用途: 新发布/更新 URL 时,立即通知 Bing 索引,比等爬虫快 10-100x
 *
 * 路由:
 *   GET  /api/indexnow?url=<single_url>           单 URL 提交
 *   GET  /api/indexnow?urls=<url1,url2,url3>      多个 URL 提交 (comma 隔开)
 *   POST /api/indexnow { urls: [url1, ...] }      批量提交 (JSON body)
 *
 * 配置:
 *   Pages Dashboard → Settings → Environment variables
 *     Variable: INDEXNOW_API_KEY
 *     Value:    157a760c3ca4465180e39f429cb4a91f
 *
 * 验证 key 文件 (推荐,放 dist-pages 根):
 *   157a760c3ca4465180e39f429cb4a91f.txt 内容就是 key 本身
 *   → https://box.beeaa.com/157a760c3ca4465180e39f429cb4a91f.txt
 *
 * IndexNow endpoint: https://api.indexnow.org/indexnow
 * 官方文档: https://www.indexnow.org/
 *
 * 响应 codes (IndexNow):
 *   200: OK
 *   202: Accepted (queue)
 *   400: Bad request (key 不对 / urlList 空)
 *   403: Forbidden (key 不在指定 host)
 *   422: Unprocessable (urls 不在 host)
 *   429: Too Many Requests
 */

const HOST = "box.beeaa.com";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const KEY_FILE = "157a760c3ca4465180e39f429cb4a91f.txt";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400"
};

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Frame-Options": "DENY"
};

const ALL_HEADERS = {
  ...CORS_HEADERS,
  ...SECURITY_HEADERS,
  "Content-Type": "application/json; charset=utf-8"
};

// 限速: per IP, 60 次/小时 (IndexNow 官方建议)
const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 3600 * 1000;

// Cloudflare KV (可选,如果没绑,fallback 到 in-memory)
async function checkRateLimit(env, ip) {
  if (!env.RATE_KV) {
    // in-memory fallback (Workers 单实例内有效)
    if (!globalThis.__indexnowRate) globalThis.__indexnowRate = new Map();
    const now = Date.now();
    const arr = globalThis.__indexnowRate.get(ip) || [];
    const fresh = arr.filter(t => now - t < RATE_WINDOW_MS);
    if (fresh.length >= RATE_LIMIT) return false;
    fresh.push(now);
    globalThis.__indexnowRate.set(ip, fresh);
    return true;
  }
  const key = `indexnow:${ip}`;
  const cur = await env.RATE_KV.get(key);
  const count = parseInt(cur || "0", 10);
  if (count >= RATE_LIMIT) return false;
  await env.RATE_KV.put(key, String(count + 1), { expirationTtl: 3600 });
  return true;
}

// URL validation: must be on our host
function isValidUrl(url) {
  try {
    const u = new URL(url);
    if (u.hostname !== HOST && u.hostname !== `www.${HOST}`) return false;
    if (u.protocol !== "https:") return false;
    return true;
  } catch {
    return false;
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: ALL_HEADERS
  });
}

async function submitToIndexNow(urls, key) {
  const body = {
    host: HOST,
    key,
    keyLocation: `https://${HOST}/${KEY_FILE}`,
    urlList: urls
  };
  const r = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body)
  });
  const text = await r.text();
  return {
    status: r.status,
    body: text,
    ok: r.status === 200 || r.status === 202
  };
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method.toUpperCase();

  // CORS preflight
  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // API key from env
  const key = env.INDEXNOW_API_KEY;
  if (!key) {
    return json({
      error: "INDEXNOW_API_KEY not configured",
      hint: "Set it in Pages Dashboard → Settings → Environment variables"
    }, 500);
  }

  // 限速
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  if (!(await checkRateLimit(env, ip))) {
    return json({ error: "Rate limit exceeded (60/hour per IP)" }, 429);
  }

  // 解析 URL 列表
  let urls = [];
  if (method === "GET") {
    const single = url.searchParams.get("url");
    const multi = url.searchParams.get("urls");
    if (single) urls = [single];
    else if (multi) urls = multi.split(",").map(s => s.trim()).filter(Boolean);
    else {
      // info endpoint
      return json({
        service: "IndexNow",
        host: HOST,
        keyFile: `https://${HOST}/${KEY_FILE}`,
        endpoint: INDEXNOW_ENDPOINT,
        usage: {
          "GET single": "/api/indexnow?url=https://box.beeaa.com/...",
          "GET multiple": "/api/indexnow?urls=https://...,https://...",
          "POST batch": '{ "urls": ["https://...", "https://..."] }'
        },
        rateLimit: "60 submissions per hour per IP",
        status: "ready"
      });
    }
  } else if (method === "POST") {
    try {
      const body = await request.json();
      urls = Array.isArray(body.urls) ? body.urls : [];
    } catch (e) {
      return json({ error: "Invalid JSON body", detail: e.message }, 400);
    }
  } else {
    return json({ error: `Method ${method} not allowed` }, 405);
  }

  // 验证
  if (urls.length === 0) {
    return json({ error: "No URLs provided" }, 400);
  }
  if (urls.length > 10000) {
    return json({ error: "Too many URLs (max 10000 per request)" }, 400);
  }
  const invalid = urls.filter(u => !isValidUrl(u));
  if (invalid.length > 0) {
    return json({
      error: "Invalid URLs (must be https://box.beeaa.com/...)",
      invalid: invalid.slice(0, 5),
      total: urls.length
    }, 400);
  }

  // 提交
  const start = Date.now();
  try {
    const result = await submitToIndexNow(urls, key);
    const elapsed = Date.now() - start;
    return json({
      submitted: urls.length,
      indexnowStatus: result.status,
      indexnowResponse: result.body || "(empty)",
      elapsedMs: elapsed,
      sample: urls.slice(0, 3)
    }, result.ok ? 200 : 502);
  } catch (e) {
    return json({
      error: "IndexNow API call failed",
      detail: e.message,
      submitted: urls.length
    }, 502);
  }
}
