/**
 * 询盘管理后台 API
 * GET /api/admin/inquiries?status=new&limit=50&offset=0&order=created_at_desc
 * Headers: X-Admin-Token: <env.ADMIN_TOKEN>
 *
 * 返回询盘列表 + 统计概览。如果 env.DB 不存在返回 503。
 *
 * 操作:
 *   GET    /api/admin/inquiries               列表 + 统计
 *   PATCH  /api/admin/inquiries?id=INQ-XXX    更新状态 (status: new|replied|quoted|closed)
 *
 * FRED 鉴权: Pages Dashboard → Settings → Environment variables → ADMIN_TOKEN
 *   取一个随机 32+ 字符串 (e.g. openssl rand -hex 32), 设为 Secret
 *
 * 安全:
 *   - 仅 GET + PATCH 方法
 *   - 必须 X-Admin-Token
 *   - CORS 限制: 仅同源 (无 Access-Control-Allow-Origin: *)
 *   - 不返回 IP/UA 给前端 (这些是隐私)
 *   - 速率限制: 60 req/min per IP
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://box.beeaa.com",
  "Access-Control-Allow-Methods": "GET, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token",
  "Access-Control-Max-Age": "86400"
};
const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Frame-Options": "DENY"
};

const VALID_STATUS = ["new", "replied", "quoted", "closed", "spam"];
const RATE_LIMIT_BUCKET = new Map();
const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_WINDOW = 60 * 1000;

function checkRateLimit(ip) {
  const now = Date.now();
  const arr = RATE_LIMIT_BUCKET.get(ip) || [];
  const recent = arr.filter(t => now - t < RATE_LIMIT_WINDOW);
  if (recent.length >= RATE_LIMIT_MAX) return false;
  recent.push(now);
  RATE_LIMIT_BUCKET.set(ip, recent);
  return true;
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...SECURITY_HEADERS, ...extraHeaders }
  });
}

function checkAuth(request, env) {
  const token = request.headers.get("X-Admin-Token");
  if (!env.ADMIN_TOKEN) return { ok: false, reason: "no_admin_token_configured" };
  if (!token) return { ok: false, reason: "missing_token" };
  // Constant-time comparison
  if (token.length !== env.ADMIN_TOKEN.length) return { ok: false, reason: "invalid_token" };
  let mismatch = 0;
  for (let i = 0; i < token.length; i++) {
    mismatch |= token.charCodeAt(i) ^ env.ADMIN_TOKEN.charCodeAt(i);
  }
  if (mismatch !== 0) return { ok: false, reason: "invalid_token" };
  return { ok: true };
}

export const onRequestGet = async (context) => {
  const { request, env } = context;
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";

  if (!checkRateLimit(ip)) return json({ success: false, error: "rate_limited" }, 429);
  const auth = checkAuth(request, env);
  if (!auth.ok) return json({ success: false, error: "unauthorized", reason: auth.reason }, 401);

  if (!env.DB) {
    return json({
      success: false,
      error: "no_d1_binding",
      message: "D1 binding not configured. Create a D1 database and add [[d1_databases]] binding in wrangler.toml.",
      setup_hint: "wrangler d1 create box-beeaa-inquiries && update wrangler.toml database_id"
    }, 503);
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 200);
  const offset = parseInt(url.searchParams.get("offset") || "0", 10);
  const order = url.searchParams.get("order") || "created_at_desc";
  const search = url.searchParams.get("q");

  try {
    // Build query
    let where = [];
    let binds = [];
    if (status && VALID_STATUS.includes(status)) {
      where.push("status = ?");
      binds.push(status);
    }
    if (search) {
      where.push("(name LIKE ? OR email LIKE ? OR company LIKE ? OR message LIKE ?)");
      const s = `%${search}%`;
      binds.push(s, s, s, s);
    }
    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const orderClause = order === "created_at_asc" ? "ORDER BY created_at ASC" : "ORDER BY created_at DESC";

    // Stats (always)
    const statsQuery = await env.DB.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_count,
        SUM(CASE WHEN status = 'replied' THEN 1 ELSE 0 END) as replied_count,
        SUM(CASE WHEN status = 'quoted' THEN 1 ELSE 0 END) as quoted_count,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_count,
        SUM(CASE WHEN status = 'spam' THEN 1 ELSE 0 END) as spam_count,
        SUM(CASE WHEN ai_urgency = 'high' THEN 1 ELSE 0 END) as high_urgency,
        SUM(CASE WHEN created_at >= datetime('now', '-7 days') THEN 1 ELSE 0 END) as last_7d,
        SUM(CASE WHEN created_at >= datetime('now', '-30 days') THEN 1 ELSE 0 END) as last_30d
      FROM inquiries
    `).all();
    const stats = statsQuery.results?.[0] || {};

    // List
    const listQuery = await env.DB.prepare(`
      SELECT id, created_at, lang, name, company, email, phone, country,
             product_line, size, material, ip_rating, color, quantity,
             target_price, lead_time, certification, usage, message,
             ai_category, ai_urgency, status, resend_message_id
      FROM inquiries
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `).bind(...binds, limit, offset).all();
    const list = listQuery.results || [];

    return json({
      success: true,
      stats: {
        total: Number(stats.total || 0),
        new: Number(stats.new_count || 0),
        replied: Number(stats.replied_count || 0),
        quoted: Number(stats.quoted_count || 0),
        closed: Number(stats.closed_count || 0),
        spam: Number(stats.spam_count || 0),
        high_urgency: Number(stats.high_urgency || 0),
        last_7d: Number(stats.last_7d || 0),
        last_30d: Number(stats.last_30d || 0)
      },
      pagination: { limit, offset, returned: list.length },
      inquiries: list
    });
  } catch (e) {
    console.error("Admin list failed:", e);
    return json({ success: false, error: "db_error", message: e.message }, 500);
  }
};

export const onRequestPatch = async (context) => {
  const { request, env } = context;
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";

  if (!checkRateLimit(ip)) return json({ success: false, error: "rate_limited" }, 429);
  const auth = checkAuth(request, env);
  if (!auth.ok) return json({ success: false, error: "unauthorized", reason: auth.reason }, 401);

  if (!env.DB) {
    return json({ success: false, error: "no_d1_binding" }, 503);
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id || !/^INQ-[A-Z0-9-]+$/i.test(id)) {
    return json({ success: false, error: "invalid_id" }, 400);
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ success: false, error: "invalid_json" }, 400);
  }
  const { status, notes } = body;
  if (status !== undefined && !VALID_STATUS.includes(status)) {
    return json({ success: false, error: "invalid_status", valid: VALID_STATUS }, 400);
  }

  try {
    const updates = [];
    const binds = [];
    if (status !== undefined) {
      updates.push("status = ?");
      binds.push(status);
    }
    if (notes !== undefined) {
      updates.push("notes = ?");
      binds.push(String(notes).substring(0, 2000));
    }
    if (updates.length === 0) {
      return json({ success: false, error: "no_fields_to_update" }, 400);
    }
    binds.push(id);
    const result = await env.DB.prepare(
      `UPDATE inquiries SET ${updates.join(", ")} WHERE id = ?`
    ).bind(...binds).run();

    if (result.meta?.changes === 0) {
      return json({ success: false, error: "not_found" }, 404);
    }
    return json({ success: true, id, updated_fields: Object.keys(body) });
  } catch (e) {
    console.error("Admin update failed:", e);
    return json({ success: false, error: "db_error", message: e.message }, 500);
  }
};

export const onRequestOptions = async () => {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
};
