var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// api/admin/inquiries.js
var CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://box.beeaa.com",
  "Access-Control-Allow-Methods": "GET, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token",
  "Access-Control-Max-Age": "86400"
};
var SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Frame-Options": "DENY"
};
var VALID_STATUS = ["new", "replied", "quoted", "closed", "spam"];
var RATE_LIMIT_BUCKET = /* @__PURE__ */ new Map();
var RATE_LIMIT_MAX = 60;
var RATE_LIMIT_WINDOW = 60 * 1e3;
function checkRateLimit(ip) {
  const now = Date.now();
  const arr = RATE_LIMIT_BUCKET.get(ip) || [];
  const recent = arr.filter((t) => now - t < RATE_LIMIT_WINDOW);
  if (recent.length >= RATE_LIMIT_MAX) return false;
  recent.push(now);
  RATE_LIMIT_BUCKET.set(ip, recent);
  return true;
}
__name(checkRateLimit, "checkRateLimit");
function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...SECURITY_HEADERS, ...extraHeaders }
  });
}
__name(json, "json");
function checkAuth(request, env) {
  const token = request.headers.get("X-Admin-Token");
  if (!env.ADMIN_TOKEN) return { ok: false, reason: "no_admin_token_configured" };
  if (!token) return { ok: false, reason: "missing_token" };
  if (token.length !== env.ADMIN_TOKEN.length) return { ok: false, reason: "invalid_token" };
  let mismatch = 0;
  for (let i = 0; i < token.length; i++) {
    mismatch |= token.charCodeAt(i) ^ env.ADMIN_TOKEN.charCodeAt(i);
  }
  if (mismatch !== 0) return { ok: false, reason: "invalid_token" };
  return { ok: true };
}
__name(checkAuth, "checkAuth");
var onRequestGet = /* @__PURE__ */ __name(async (context) => {
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
}, "onRequestGet");
var onRequestPatch = /* @__PURE__ */ __name(async (context) => {
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
  if (status !== void 0 && !VALID_STATUS.includes(status)) {
    return json({ success: false, error: "invalid_status", valid: VALID_STATUS }, 400);
  }
  try {
    const updates = [];
    const binds = [];
    if (status !== void 0) {
      updates.push("status = ?");
      binds.push(status);
    }
    if (notes !== void 0) {
      updates.push("notes = ?");
      binds.push(String(notes).substring(0, 2e3));
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
}, "onRequestPatch");
var onRequestOptions = /* @__PURE__ */ __name(async () => {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}, "onRequestOptions");

// api/inquiry.js
var CORS_HEADERS2 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400"
};
var SECURITY_HEADERS2 = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Frame-Options": "DENY"
};
var RATE_LIMIT_BUCKET2 = /* @__PURE__ */ new Map();
var RATE_LIMIT_MAX2 = 5;
var RATE_LIMIT_WINDOW2 = 60 * 1e3;
function checkRateLimit2(ip) {
  const now = Date.now();
  const arr = RATE_LIMIT_BUCKET2.get(ip) || [];
  const recent = arr.filter((t) => now - t < RATE_LIMIT_WINDOW2);
  if (recent.length >= RATE_LIMIT_MAX2) return false;
  recent.push(now);
  RATE_LIMIT_BUCKET2.set(ip, recent);
  return true;
}
__name(checkRateLimit2, "checkRateLimit");
var VALID_FIELDS = [
  "productLine",
  "size",
  "material",
  "ipRating",
  "color",
  "foamInsert",
  "logoPrint",
  "quantity",
  "targetPrice",
  "leadTime",
  "certification",
  "usage",
  "name",
  "company",
  "email",
  "phone",
  "country",
  "message",
  "lang"
];
var REQUIRED = ["name", "email", "phone", "country", "quantity", "productLine"];
function validate(data) {
  const errors = [];
  for (const f of REQUIRED) {
    const v = data[f];
    if (f === "productLine") {
      if (!Array.isArray(v) || v.length === 0) errors.push(`${f} required (at least 1)`);
    } else {
      if (!v || String(v).trim() === "") errors.push(`${f} required`);
    }
  }
  if (data.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)) {
    errors.push("email format invalid");
  }
  if (data.quantity && (isNaN(data.quantity) || Number(data.quantity) < 1)) {
    errors.push("quantity must be positive number");
  }
  return errors;
}
__name(validate, "validate");
var SPAM_KEYWORDS = [
  "viagra",
  "casino",
  "lottery",
  "crypto giveaway",
  "click here to claim",
  "free bitcoin",
  "make money fast",
  "work from home",
  "weight loss pill",
  "seo backlink",
  "buy followers",
  "click my link",
  "\u6295\u8D44\u7406\u8D22",
  "\u7F51\u8D5A",
  "\u514D\u8D39BTC",
  "\u7A33\u8D5A\u4E0D\u8D54",
  "\u535A\u5F69",
  "\u517C\u804C\u5237\u5355"
];
var URL_REGEX = /https?:\/\/[^\s]{20,}/gi;
function checkSpam(data) {
  if (data.website && String(data.website).trim() !== "") return { blocked: true, reason: "honeypot" };
  if (data.url && String(data.url).trim() !== "") return { blocked: true, reason: "honeypot" };
  const text = `${data.name || ""} ${data.message || ""} ${data.company || ""}`.toLowerCase();
  for (const kw of SPAM_KEYWORDS) {
    if (text.includes(kw.toLowerCase())) return { blocked: true, reason: "spam_keyword", keyword: kw };
  }
  if (data._ts) {
    const ts = Number(data._ts);
    if (!isNaN(ts) && ts > 0 && Date.now() - ts < 2e3) {
      return { blocked: true, reason: "submitted_too_fast" };
    }
  }
  const messageUrls = (data.message || "").match(URL_REGEX);
  if (messageUrls && messageUrls.length >= 2) {
    return { blocked: true, reason: "too_many_urls", count: messageUrls.length };
  }
  return { blocked: false };
}
__name(checkSpam, "checkSpam");
async function aiEnhance(env, data) {
  if (!env.AI) {
    return {
      translated: null,
      category: null,
      urgency: "normal"
    };
  }
  try {
    const prompt = `Analyze this B2B inquiry and provide:
1. Translation to English (if the original is Chinese) or Chinese (if English)
2. Category: which product line (military-tactical-case, drone-case, instrument-case, waterproof-case, medical-case, engineering-plastic-case, tool-box, camera-stage-case, trolley-case, or other)
3. Urgency: low/normal/high based on quantity and lead time

Original: ${data.lang === "zh" ? data.productLine.join("\u3001") + " | " + (data.message || "") : data.productLine.join(", ") + " | " + (data.message || "")}
Quantity: ${data.quantity}
Lead time: ${data.leadTime}
Target price: ${data.targetPrice}

Respond ONLY in JSON format: {"translation_zh": "...", "translation_en": "...", "category": "...", "urgency": "low|normal|high"}`;
    const response = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
      messages: [
        { role: "system", content: "You are a B2B inquiry classifier for a protective case manufacturer. Output only valid JSON." },
        { role: "user", content: prompt }
      ],
      max_tokens: 500
    });
    let text = response.response || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
      }
    }
  } catch (e) {
    console.error("AI enhance failed:", e);
  }
  return { translated: null, category: null, urgency: "normal" };
}
__name(aiEnhance, "aiEnhance");
function buildEmailHTML(data, ai) {
  const t = data.lang === "zh";
  const productNames = {
    "military-tactical-case": t ? "\u519B\u8B66\u6218\u672F\u9632\u62A4\u7BB1" : "Military / Tactical Case",
    "drone-case": t ? "\u65E0\u4EBA\u673A\u9632\u62A4\u7BB1" : "Drone Case",
    "instrument-case": t ? "\u4EEA\u5668\u4EEA\u8868\u7BB1" : "Instrument Case",
    "waterproof-case": t ? "\u9632\u6C34\u4FDD\u62A4\u7BB1" : "Waterproof Case",
    "medical-case": t ? "\u533B\u7597\u5668\u68B0\u7BB1" : "Medical Device Case",
    "engineering-plastic-case": t ? "\u5DE5\u7A0B\u5851\u6599\u7BB1" : "Engineering Plastic Case",
    "tool-box": t ? "\u5DE5\u5177\u6536\u7EB3\u7BB1" : "Tool Box",
    "camera-stage-case": t ? "\u6444\u5F71\u5668\u6750\u7BB1" : "Camera / Stage Case",
    "trolley-case": t ? "\u62C9\u6746\u9632\u62A4\u7BB1" : "Trolley Case"
  };
  const productsList = (data.productLine || []).map((p) => productNames[p] || p).join(", ");
  const labelMap = {
    size: t ? "\u5C3A\u5BF8" : "Size",
    material: t ? "\u6750\u8D28" : "Material",
    ipRating: t ? "\u9632\u62A4\u7B49\u7EA7" : "IP Rating",
    color: t ? "\u989C\u8272" : "Color",
    foamInsert: t ? "\u6CE1\u68C9" : "Foam Insert",
    logoPrint: t ? "\u5370\u5237" : "Logo Print",
    quantity: t ? "\u6570\u91CF" : "Quantity",
    targetPrice: t ? "\u76EE\u6807\u5355\u4EF7 (USD)" : "Target Price (USD)",
    leadTime: t ? "\u671F\u671B\u4EA4\u671F" : "Lead Time",
    certification: t ? "\u8BA4\u8BC1" : "Certifications",
    usage: t ? "\u7528\u9014" : "Usage",
    name: t ? "\u59D3\u540D" : "Name",
    company: t ? "\u516C\u53F8" : "Company",
    email: t ? "\u90AE\u7BB1" : "Email",
    phone: t ? "\u7535\u8BDD" : "Phone",
    country: t ? "\u56FD\u5BB6" : "Country",
    message: t ? "\u7559\u8A00" : "Message"
  };
  const rows = [];
  for (const [k, label] of Object.entries(labelMap)) {
    const v = data[k];
    if (v && k !== "productLine") {
      const safe = String(v).replace(/</g, "&lt;").replace(/>/g, "&gt;");
      rows.push(`<tr><td style="padding:8px 12px;background:#F1F5F9;color:#0F172A;font-weight:600;border:1px solid #E2E8F0;">${label}</td><td style="padding:8px 12px;color:#0F172A;border:1px solid #E2E8F0;">${safe}</td></tr>`);
    }
  }
  const productsRow = `<tr><td style="padding:8px 12px;background:#F1F5F9;color:#0F172A;font-weight:600;border:1px solid #E2E8F0;">${t ? "\u4EA7\u54C1\u7EBF" : "Product Lines"}</td><td style="padding:8px 12px;color:#0F172A;border:1px solid #E2E8F0;">${productsList}</td></tr>`;
  const urgency = ai?.urgency || "normal";
  const urgencyBg = urgency === "high" ? "#DC2626" : urgency === "low" ? "#10B981" : "#F59E0B";
  const urgencyLabel = (urgency || "NORMAL").toUpperCase();
  return `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light only">
  <title>${t ? "\u65B0 OEM \u8BE2\u76D8" : "New OEM Inquiry"}</title>
  <!--[if mso]>
  <style type="text/css">
    table, td, div, h1, h2, h3, p, a, span { font-family: Arial, sans-serif !important; }
    .beeaa-header { background-color:#C2410C !important; }
  </style>
  <xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#0F172A;line-height:1.5;-webkit-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#F8FAFC;">
    <tr>
      <td align="center" style="padding:20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background-color:#FFFFFF;border:1px solid #E2E8F0;border-radius:8px;overflow:hidden;">
          <!-- Header: \u6DF1\u6A59\u7EAF\u8272 + \u767D\u5B57 + Outlook VML fallback (\u53CC\u4FDD\u9669) -->
          <!--[if mso]>
          <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fillcolor="#C2410C" stroke="f" style="width:600px;height:140px;">
            <v:textbox inset="24px,24px,24px,24px">
              <![endif]-->
          <tr>
            <td class="beeaa-header" bgcolor="#C2410C" style="background-color:#C2410C;padding:28px 24px;color:#FFFFFF;mso-line-height-rule:exactly;">
              <h1 style="margin:0 0 10px;font-size:28px;font-weight:700;color:#FFFFFF;line-height:1.25;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;mso-style-priority:99;background-color:transparent;text-shadow:0 1px 2px rgba(0,0,0,0.25);">
                <span style="color:#FFFFFF !important;">\u{1F4E7} ${t ? "\u65B0 OEM \u8BE2\u76D8" : "New OEM Inquiry"}</span>
              </h1>
              <p style="margin:0;font-size:15px;color:#FFFFFF;line-height:1.5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;mso-style-priority:99;background-color:transparent;">
                <span style="color:#FFFFFF !important;font-weight:700;">${t ? "\u6765\u6E90" : "Source"}:</span>
                <a href="https://box.beeaa.com${data.lang === "zh" ? "/zh" : ""}/oem/" style="color:#FFFFFF !important;text-decoration:underline;font-weight:600;">box.beeaa.com${data.lang === "zh" ? "/zh" : ""}/oem/</a>
              </p>
              ${ai?.urgency ? `<p style="margin:14px 0 0;"><span style="background-color:${urgencyBg};color:#FFFFFF;padding:5px 12px;border-radius:4px;font-size:13px;font-weight:700;display:inline-block;font-family:Arial,sans-serif;border:1px solid rgba(255,255,255,0.3);">${t ? "\u7D27\u6025\u5EA6" : "Urgency"}: ${urgencyLabel}</span></p>` : ""}
            </td>
          </tr>
          <!--[if mso]>
            </v:textbox>
          </v:rect>
          <![endif]-->
          <!-- Body: \u8BE2\u76D8\u8BE6\u60C5 -->
          <tr>
            <td style="padding:24px;background-color:#FFFFFF;color:#0F172A;">
              <h2 style="margin:0 0 16px;font-size:18px;font-weight:700;color:#0F172A;">${t ? "\u8BE2\u76D8\u8BE6\u60C5" : "Inquiry Details"}</h2>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;font-size:14px;">
                ${productsRow}
                ${rows.join("")}
              </table>
              ${ai?.translation_en && data.lang === "zh" ? `<h3 style="margin:20px 0 8px;font-size:14px;font-weight:700;color:#0F172A;">\u{1F310} AI Translation (EN):</h3><div style="background-color:#F8FAFC;padding:12px;border-radius:6px;font-size:14px;color:#0F172A;border:1px solid #E2E8F0;">${ai.translation_en}</div>` : ""}
              ${ai?.translation_zh && data.lang !== "zh" ? `<h3 style="margin:20px 0 8px;font-size:14px;font-weight:700;color:#0F172A;">\u{1F310} AI \u7FFB\u8BD1:</h3><div style="background-color:#F8FAFC;padding:12px;border-radius:6px;font-size:14px;color:#0F172A;border:1px solid #E2E8F0;">${ai.translation_zh}</div>` : ""}
              ${ai?.category ? `<p style="margin-top:16px;font-size:12px;color:#475569;">AI \u5206\u7C7B: <strong style="color:#0F172A;">${ai.category}</strong></p>` : ""}
            </td>
          </tr>
          <!-- CTA: \u5BA2\u6237\u90AE\u7BB1\u76F4\u63A5\u56DE\u4FE1 -->
          <tr>
            <td style="padding:16px 24px;background-color:#F8FAFC;border-top:1px solid #E2E8F0;">
              <p style="margin:0;font-size:14px;color:#475569;">
                ${t ? "\u{1F4E7} \u76F4\u63A5\u56DE\u590D\u6B64\u90AE\u4EF6" : "\u{1F4E7} Reply directly to this email"}:
                <a href="mailto:${data.email}" style="color:#C2410C;font-weight:700;text-decoration:underline;background-color:transparent;">${data.email}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 24px;background-color:#F1F5F9;border-top:1px solid #E2E8F0;border-radius:0 0 8px 8px;">
              <p style="margin:0;font-size:12px;color:#64748B;text-align:center;line-height:1.5;">
                ${t ? "\u6B64\u90AE\u4EF6\u7531 box.beeaa.com OEM \u8868\u5355\u81EA\u52A8\u53D1\u9001" : "Auto-generated by box.beeaa.com OEM form"}<br>
                <a href="https://box.beeaa.com" style="color:#C2410C;font-weight:600;text-decoration:underline;background-color:transparent;">box.beeaa.com</a> \xB7 kexin@beeaa.com \xB7 +86 13590555309
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}
__name(buildEmailHTML, "buildEmailHTML");
function buildEmailText(data) {
  const lines = [];
  lines.push(`New OEM Inquiry from box.beeaa.com`);
  lines.push(`From: ${data.name} <${data.email}>`);
  lines.push(`Country: ${data.country}`);
  lines.push(`Phone: ${data.phone}`);
  lines.push(``);
  lines.push(`PRODUCTS: ${(data.productLine || []).join(", ")}`);
  lines.push(`Quantity: ${data.quantity}`);
  if (data.size) lines.push(`Size: ${data.size}`);
  if (data.material) lines.push(`Material: ${data.material}`);
  if (data.ipRating) lines.push(`IP Rating: ${data.ipRating}`);
  if (data.color) lines.push(`Color: ${data.color}`);
  if (data.foamInsert) lines.push(`Foam: ${data.foamInsert}`);
  if (data.logoPrint) lines.push(`Logo: ${data.logoPrint}`);
  if (data.targetPrice) lines.push(`Target Price: $${data.targetPrice}`);
  if (data.leadTime) lines.push(`Lead Time: ${data.leadTime}`);
  if (data.certification) lines.push(`Certifications: ${data.certification}`);
  if (data.usage) lines.push(`Usage: ${data.usage}`);
  if (data.message) {
    lines.push(``);
    lines.push(`Message:`);
    lines.push(data.message);
  }
  return lines.join("\n");
}
__name(buildEmailText, "buildEmailText");
function buildAutoReplyHTML(data, ai) {
  const t = data.lang === "zh";
  const productNames = {
    "military-tactical-case": t ? "\u519B\u4E8B\u6218\u672F\u4FDD\u62A4\u7BB1" : "Military / Tactical Case",
    "drone-case": t ? "\u65E0\u4EBA\u673A\u9632\u62A4\u7BB1" : "Drone Case",
    "instrument-case": t ? "\u4EEA\u5668\u4EEA\u8868\u7BB1" : "Instrument Case",
    "waterproof-case": t ? "\u9632\u6C34\u4FDD\u62A4\u7BB1" : "Waterproof Case",
    "medical-case": t ? "\u533B\u7597\u4EEA\u5668\u7BB1" : "Medical Device Case",
    "engineering-plastic-case": t ? "\u5DE5\u7A0B\u5851\u6599\u7BB1" : "Engineering Plastic Case",
    "tool-box": t ? "\u5DE5\u5177\u6536\u7EB3\u7BB1" : "Tool Box",
    "camera-stage-case": t ? "\u6444\u5F71\u5668\u6750\u7BB1" : "Camera / Stage Case",
    "trolley-case": t ? "\u62C9\u6746\u4FDD\u62A4\u7BB1" : "Trolley Case"
  };
  const productsList = (data.productLine || []).map((p) => productNames[p] || p).join(", ");
  const greeting = t ? `${data.name} \u5148\u751F/\u5973\u58EB\uFF0C\u60A8\u597D\uFF0C<br><br>\u611F\u8C22\u60A8\u9009\u62E9 <strong>\u5BA2\u4FE1\u65B0\u6750\u6599\uFF08KeXinMaterials\uFF09</strong>\uFF01\u6211\u4EEC\u5DF2\u6536\u5230\u60A8\u7684 OEM/ODM \u8BE2\u76D8\u3002` : `Dear ${data.name},<br><br>Thank you for choosing <strong>KeXinMaterials</strong>! We have received your OEM/ODM inquiry.`;
  const bodyText = t ? `<p>\u6211\u4EEC\u7684\u9500\u552E\u5DE5\u7A0B\u5E08\u5C06\u5728 <strong>12 \u5C0F\u65F6\u5185</strong>\u901A\u8FC7\u90AE\u4EF6\uFF08kexin@beeaa.com\uFF09\u6216 WhatsApp\uFF08+86 13590555309\uFF09\u56DE\u590D\u60A8\uFF0C\u63D0\u4F9B\u8BE6\u7EC6\u62A5\u4EF7\u3001\u6A21\u5177\u65B9\u6848\u3001\u8BA4\u8BC1\u6587\u4EF6\u7B49\u3002</p>
       <p>\u4E3A\u4E86\u52A0\u901F\u56DE\u590D\uFF0C\u5982\u60A8\u65B9\u4FBF\u8BF7\u540C\u6B65\u63D0\u4F9B\uFF1A<strong>3D \u56FE\u7EB8 / \u5B9E\u7269\u7167\u7247 / \u8BE6\u7EC6\u89C4\u683C\u8868</strong>\u3002</p>` : `<p>Our sales engineer will reply within <strong>12 hours</strong> via email (kexin@beeaa.com) or WhatsApp (+86 13590555309) with detailed quotation, mold plan, and certification documents.</p>
       <p>To accelerate the response, please also share if available: <strong>3D drawings / product photos / detailed specification sheet</strong>.</p>`;
  const slaBlock = t ? `<tr><td style="padding:8px 12px;background:#F1F5F9;color:#0F172A;font-weight:600;border:1px solid #E2E8F0;width:35%;">\u56DE\u590D\u65F6\u95F4</td><td style="padding:8px 12px;color:#0F172A;border:1px solid #E2E8F0;">\u2264 12 \u5C0F\u65F6\uFF08\u5DE5\u4F5C\u65E5 08:00-18:00 GMT+8\uFF09</td></tr>
       <tr><td style="padding:8px 12px;background:#F1F5F9;color:#0F172A;font-weight:600;border:1px solid #E2E8F0;">\u8BE2\u76D8\u7F16\u53F7</td><td style="padding:8px 12px;color:#0F172A;border:1px solid #E2E8F0;font-family:monospace;">${data._inquiry_id || "(\u5F85\u751F\u6210)"}</td></tr>
       <tr><td style="padding:8px 12px;background:#F1F5F9;color:#0F172A;font-weight:600;border:1px solid #E2E8F0;">\u4EA7\u54C1\u7EBF</td><td style="padding:8px 12px;color:#0F172A;border:1px solid #E2E8F0;">${productsList}</td></tr>
       <tr><td style="padding:8px 12px;background:#F1F5F9;color:#0F172A;font-weight:600;border:1px solid #E2E8F0;">\u6570\u91CF</td><td style="padding:8px 12px;color:#0F172A;border:1px solid #E2E8F0;">${data.quantity} \u4EF6</td></tr>` : `<tr><td style="padding:8px 12px;background:#F1F5F9;color:#0F172A;font-weight:600;border:1px solid #E2E8F0;width:35%;">Response time</td><td style="padding:8px 12px;color:#0F172A;border:1px solid #E2E8F0;">\u2264 12 hours (business days 08:00-18:00 GMT+8)</td></tr>
       <tr><td style="padding:8px 12px;background:#F1F5F9;color:#0F172A;font-weight:600;border:1px solid #E2E8F0;">Inquiry ID</td><td style="padding:8px 12px;color:#0F172A;border:1px solid #E2E8F0;font-family:monospace;">${data._inquiry_id || "(pending)"}</td></tr>
       <tr><td style="padding:8px 12px;background:#F1F5F9;color:#0F172A;font-weight:600;border:1px solid #E2E8F0;">Product lines</td><td style="padding:8px 12px;color:#0F172A;border:1px solid #E2E8F0;">${productsList}</td></tr>
       <tr><td style="padding:8px 12px;background:#F1F5F9;color:#0F172A;font-weight:600;border:1px solid #E2E8F0;">Quantity</td><td style="padding:8px 12px;color:#0F172A;border:1px solid #E2E8F0;">${data.quantity} pcs</td></tr>`;
  const footerText = t ? "\u6B64\u90AE\u4EF6\u7531 box.beeaa.com \u8BE2\u76D8\u7CFB\u7EDF\u81EA\u52A8\u53D1\u9001\uFF0C\u8BF7\u52FF\u76F4\u63A5\u56DE\u590D\uFF08\u56DE\u590D\u5C06\u65E0\u6CD5\u9001\u8FBE\uFF09\u3002\u5982\u6709\u7591\u95EE\u8BF7\u76F4\u63A5\u90AE\u4EF6 kexin@beeaa.com \u6216 WhatsApp +86 13590555309\u3002" : "This email is auto-generated by box.beeaa.com inquiry system. Please do not reply directly (replies cannot be delivered). For questions, email kexin@beeaa.com or WhatsApp +86 13590555309.";
  return `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${t ? "\u6211\u4EEC\u5DF2\u6536\u5230\u60A8\u7684\u8BE2\u76D8" : "We received your inquiry"}</title>
</head>
<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#0F172A;line-height:1.5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#F8FAFC;">
    <tr>
      <td align="center" style="padding:20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background-color:#FFFFFF;border:1px solid #E2E8F0;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="background-color:#0F766E;padding:28px 24px;color:#FFFFFF;">
              <h1 style="margin:0 0 6px;font-size:24px;font-weight:700;color:#FFFFFF;line-height:1.3;">\u2705 ${t ? "\u8BE2\u76D8\u5DF2\u6536\u5230" : "Inquiry Received"}</h1>
              <p style="margin:0;font-size:14px;color:#FFFFFF;opacity:0.95;">${t ? "\u5BA2\u4FE1\u65B0\u6750\u6599 \xB7 KeXinMaterials" : "KeXinMaterials \xB7 Your Trusted Case Manufacturer"}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 24px;background-color:#FFFFFF;color:#0F172A;">
              <div style="font-size:15px;line-height:1.65;color:#0F172A;">${greeting}</div>
              <div style="font-size:15px;line-height:1.65;color:#0F172A;margin-top:14px;">${bodyText}</div>
              <h3 style="margin:24px 0 12px;font-size:15px;font-weight:700;color:#0F172A;">${t ? "\u8BE2\u76D8\u6458\u8981" : "Inquiry Summary"}</h3>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;font-size:14px;border:1px solid #E2E8F0;">
                ${slaBlock}
              </table>
              <h3 style="margin:24px 0 12px;font-size:15px;font-weight:700;color:#0F172A;">${t ? "\u6211\u4EEC\u80FD\u4E3A\u60A8\u505A\u4EC0\u4E48" : "What we can do for you"}</h3>
              <ul style="margin:0;padding-left:20px;font-size:14px;color:#0F172A;line-height:1.7;">
                ${t ? `<li>OEM/ODM \u5B9A\u5236\uFF08\u5C3A\u5BF8/\u989C\u8272/\u6CE1\u68C9/logo/\u8BA4\u8BC1\uFF09</li>
                     <li>13,000 m\xB2 \u81EA\u6709\u5DE5\u5382\uFF0C60+ \u8BBE\u5907\uFF0C\u6708\u4EA7 50,000+ \u4EF6</li>
                     <li>MOQ 50 \u4EF6\u8D77\uFF0C30 \u5929\u6807\u51C6\u4EA4\u671F</li>
                     <li>ISO9001 / ROHS / CE / SGS / IP67 \u8BA4\u8BC1\u9F50\u5168</li>
                     <li>\u51FA\u53E3 50+ \u56FD\u5BB6\uFF0C\u7F8E/\u82F1/\u5FB7/\u52A0/\u65E5/\u4FC4\u7B49</li>` : `<li>OEM/ODM customization (size/color/foam/logo/certifications)</li>
                     <li>13,000 m\xB2 in-house factory, 60+ machines, 50,000+ pcs/month capacity</li>
                     <li>MOQ 50 pcs, 30-day standard delivery</li>
                     <li>ISO9001 / ROHS / CE / SGS / IP67 certified</li>
                     <li>Exported to 50+ countries (USA/UK/Germany/Canada/Japan/Russia etc.)</li>`}
              </ul>
              <div style="margin-top:24px;padding:16px;background-color:#FEF3C7;border-left:4px solid #F59E0B;border-radius:4px;">
                <p style="margin:0;font-size:13px;color:#78350F;line-height:1.6;">
                  ${t ? '\u{1F4A1} <strong>\u52A0\u901F\u56DE\u590D\u5C0F\u8D34\u58EB</strong>\uFF1A\u5C06\u60A8\u7684\u9700\u6C42\u76F4\u63A5\u56DE\u590D\u5230 <a href="mailto:kexin@beeaa.com" style="color:#C2410C;">kexin@beeaa.com</a>\uFF0C\u9644\u4E0A 3D \u56FE\u7EB8\u6216\u53C2\u8003\u56FE\uFF0C24 \u5C0F\u65F6\u5185\u53EF\u62FF\u5230\u521D\u7248\u62A5\u4EF7\u5355\u548C\u6A21\u5177\u65B9\u6848\u3002' : '\u{1F4A1} <strong>Tip to speed up the reply</strong>: Reply directly to <a href="mailto:kexin@beeaa.com" style="color:#C2410C;">kexin@beeaa.com</a> with your 3D drawings or reference photos. We can deliver an initial quotation and mold plan within 24 hours.'}
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 24px;background-color:#0F172A;color:#FFFFFF;">
              <p style="margin:0 0 8px;font-size:14px;font-weight:600;">${t ? "\u5BA2\u4FE1\u65B0\u6750\u6599\uFF08KeXinMaterials\uFF09" : "KeXinMaterials (Guangdong) Co., Ltd."}</p>
              <p style="margin:0;font-size:12px;color:#CBD5E1;line-height:1.6;">
                ${t ? "\u6E90\u5934\u53D1\u8D27\u5DE5\u5382 \xB7 12 \u5E74 OEM/ODM \u7ECF\u9A8C \xB7 13,000 m\xB2" : "Source factory \xB7 12 years OEM/ODM \xB7 13,000 m\xB2"}<br>
                \u{1F4E7} <a href="mailto:kexin@beeaa.com" style="color:#FBBF24;">kexin@beeaa.com</a>  \xB7  \u{1F4F1} <a href="https://wa.me/8613590555309" style="color:#FBBF24;">+86 13590555309 (WhatsApp)</a><br>
                \u{1F310} <a href="https://box.beeaa.com" style="color:#FBBF24;">box.beeaa.com</a>  \xB7  \u{1F3EA} <a href="https://beeaa.com" style="color:#FBBF24;">beeaa.com</a>
              </p>
              <p style="margin:12px 0 0;font-size:11px;color:#94A3B8;line-height:1.5;">${footerText}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}
__name(buildAutoReplyHTML, "buildAutoReplyHTML");
function buildAutoReplyText(data) {
  const t = data.lang === "zh";
  const lines = [];
  if (t) {
    lines.push(`\u60A8\u597D ${data.name}\uFF0C`);
    lines.push(``);
    lines.push(`\u611F\u8C22\u60A8\u9009\u62E9\u5BA2\u4FE1\u65B0\u6750\u6599\uFF08KeXinMaterials\uFF09\uFF01\u6211\u4EEC\u5DF2\u6536\u5230\u60A8\u7684 OEM/ODM \u8BE2\u76D8\u3002`);
    lines.push(``);
    lines.push(`\u8BE2\u76D8\u7F16\u53F7\uFF1A${data._inquiry_id || "(\u5F85\u751F\u6210)"}`);
    lines.push(`\u4EA7\u54C1\u7EBF\uFF1A${(data.productLine || []).join(", ")}`);
    lines.push(`\u6570\u91CF\uFF1A${data.quantity} \u4EF6`);
    lines.push(``);
    lines.push(`\u6211\u4EEC\u7684\u9500\u552E\u5DE5\u7A0B\u5E08\u5C06\u5728 12 \u5C0F\u65F6\u5185\u901A\u8FC7\u90AE\u4EF6\u6216 WhatsApp \u56DE\u590D\u60A8\u3002`);
    lines.push(``);
    lines.push(`\u52A0\u901F\u56DE\u590D\u5C0F\u8D34\u58EB\uFF1A\u5C06\u60A8\u7684\u9700\u6C42\u76F4\u63A5\u56DE\u590D\u5230 kexin@beeaa.com\uFF0C\u9644\u4E0A 3D \u56FE\u7EB8\u6216\u53C2\u8003\u56FE\uFF0C24 \u5C0F\u65F6\u5185\u53EF\u62FF\u5230\u521D\u7248\u62A5\u4EF7\u5355\u548C\u6A21\u5177\u65B9\u6848\u3002`);
    lines.push(``);
    lines.push(`--`);
    lines.push(`\u5BA2\u4FE1\u65B0\u6750\u6599\uFF08KeXinMaterials\uFF09`);
    lines.push(`\u6E90\u5934\u53D1\u8D27\u5DE5\u5382 \xB7 12 \u5E74 OEM/ODM \u7ECF\u9A8C`);
    lines.push(`kexin@beeaa.com \xB7 +86 13590555309 (WhatsApp)`);
    lines.push(`box.beeaa.com \xB7 beeaa.com`);
  } else {
    lines.push(`Dear ${data.name},`);
    lines.push(``);
    lines.push(`Thank you for choosing KeXinMaterials! We have received your OEM/ODM inquiry.`);
    lines.push(``);
    lines.push(`Inquiry ID: ${data._inquiry_id || "(pending)"}`);
    lines.push(`Product lines: ${(data.productLine || []).join(", ")}`);
    lines.push(`Quantity: ${data.quantity} pcs`);
    lines.push(``);
    lines.push(`Our sales engineer will reply within 12 hours via email or WhatsApp.`);
    lines.push(``);
    lines.push(`Tip to speed up: Reply directly to kexin@beeaa.com with your 3D drawings or reference photos. We can deliver an initial quotation and mold plan within 24 hours.`);
    lines.push(``);
    lines.push(`--`);
    lines.push(`KeXinMaterials (Guangdong) Co., Ltd.`);
    lines.push(`Source factory \xB7 12 years OEM/ODM \xB7 13,000 m\xB2`);
    lines.push(`kexin@beeaa.com \xB7 +86 13590555309 (WhatsApp)`);
    lines.push(`box.beeaa.com \xB7 beeaa.com`);
  }
  return lines.join("\n");
}
__name(buildAutoReplyText, "buildAutoReplyText");
async function saveToD1(env, data, ai, messageId, ip, userAgent) {
  if (!env.DB) return { saved: false, reason: "no_d1_binding" };
  try {
    const id = `INQ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    data._inquiry_id = id;
    const stmt = env.DB.prepare(`
      INSERT INTO inquiries (
        id, created_at, lang, name, company, email, phone, country,
        product_line, size, material, ip_rating, color, foam_insert, logo_print,
        quantity, target_price, lead_time, certification, usage, message,
        ai_category, ai_urgency, ai_translation_zh, ai_translation_en,
        status, ip_address, user_agent, resend_message_id
      ) VALUES (?, datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, ?)
    `);
    await stmt.bind(
      id,
      data.lang || "en",
      data.name,
      data.company || null,
      data.email,
      data.phone,
      data.country,
      JSON.stringify(data.productLine || []),
      data.size || null,
      data.material || null,
      data.ipRating || null,
      data.color || null,
      data.foamInsert || null,
      data.logoPrint || null,
      String(data.quantity),
      data.targetPrice || null,
      data.leadTime || null,
      data.certification || null,
      data.usage || null,
      data.message || null,
      ai?.category || null,
      ai?.urgency || null,
      ai?.translation_zh || null,
      ai?.translation_en || null,
      ip,
      userAgent,
      messageId || null
    ).run();
    return { saved: true, id };
  } catch (e) {
    console.error("D1 save failed:", e);
    return { saved: false, error: e.message };
  }
}
__name(saveToD1, "saveToD1");
async function sendWebhookNotification(env, data, ai, inquiryId) {
  if (!env.NOTIFY_WEBHOOK) return { sent: false, reason: "no_webhook" };
  try {
    const productNames = {
      "military-tactical-case": "Military / Tactical Case",
      "drone-case": "Drone Case",
      "instrument-case": "Instrument Case",
      "waterproof-case": "Waterproof Case",
      "medical-case": "Medical Case",
      "engineering-plastic-case": "Engineering Plastic Case",
      "tool-box": "Tool Box",
      "camera-stage-case": "Camera / Stage Case",
      "trolley-case": "Trolley Case"
    };
    const productList = (data.productLine || []).map((p) => productNames[p] || p).join(", ");
    const urgency = ai?.urgency || "normal";
    const urgencyEmoji = urgency === "high" ? "\u{1F534}" : urgency === "low" ? "\u{1F7E2}" : "\u{1F7E1}";
    const urgencyColor = urgency === "high" ? "#DC2626" : urgency === "low" ? "#10B981" : "#F59E0B";
    const payload = {
      text: `${urgencyEmoji} New OEM Inquiry from ${data.name} (${data.country}) - ${data.quantity}pcs`,
      attachments: [{
        color: urgencyColor,
        title: `${data.name} - ${data.company || "N/A"}`,
        title_link: `mailto:${data.email}`,
        fields: [
          { title: "Email", value: data.email, short: true },
          { title: "Phone", value: data.phone, short: true },
          { title: "Country", value: data.country, short: true },
          { title: "Quantity", value: `${data.quantity} pcs`, short: true },
          { title: "Products", value: productList, short: false },
          { title: "Inquiry ID", value: inquiryId || "(no D1)", short: true },
          { title: "Urgency", value: `${urgencyEmoji} ${urgency.toUpperCase()}`, short: true },
          { title: "Lead time", value: data.leadTime || "\u2014", short: true },
          { title: "Target price", value: data.targetPrice ? `$${data.targetPrice}/pc` : "\u2014", short: true }
        ],
        text: data.message ? `\u{1F4DD} Message: ${data.message.substring(0, 200)}${data.message.length > 200 ? "..." : ""}` : void 0,
        footer: "box.beeaa.com inquiry system",
        ts: Math.floor(Date.now() / 1e3)
      }]
    };
    const resp = await fetch(env.NOTIFY_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (resp.ok) return { sent: true };
    const errText = await resp.text();
    return { sent: false, error: `webhook_${resp.status}`, body: errText.substring(0, 200) };
  } catch (e) {
    console.error("Webhook notification failed:", e);
    return { sent: false, error: e.message };
  }
}
__name(sendWebhookNotification, "sendWebhookNotification");
async function sendAutoReply(env, data, ai, fromEmail) {
  if (!env.RESEND_API_KEY) return { sent: false, reason: "no_resend_key" };
  const t = data.lang === "zh";
  const subject = t ? `\u2705 \u6211\u4EEC\u5DF2\u6536\u5230\u60A8\u7684\u8BE2\u76D8 ${data._inquiry_id || ""} \u2014 \u5BA2\u4FE1\u65B0\u6750\u6599` : `\u2705 We received your inquiry ${data._inquiry_id || ""} \u2014 KeXinMaterials`;
  const autoHtml = buildAutoReplyHTML(data, ai);
  const autoText = buildAutoReplyText(data);
  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [data.email],
        subject,
        text: autoText,
        html: autoHtml,
        // 自动回复不该让客户 reply-to 业务邮箱
        reply_to: env.RESEND_TO || "kexin@beeaa.com"
      })
    });
    if (resp.ok) {
      const result = await resp.json();
      return { sent: true, messageId: result.id };
    }
    const err = await resp.json().catch(() => ({}));
    return { sent: false, error: err.message || `resend_${resp.status}` };
  } catch (e) {
    return { sent: false, error: e.message };
  }
}
__name(sendAutoReply, "sendAutoReply");
var onRequestPost = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  if (!checkRateLimit2(ip)) {
    return new Response(JSON.stringify({
      success: false,
      error: "rate_limited",
      message: "Too many requests. Please wait 1 minute."
    }), {
      status: 429,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS2, ...SECURITY_HEADERS2 }
    });
  }
  let data;
  try {
    const ct = request.headers.get("Content-Type") || "";
    if (ct.includes("application/json")) {
      data = await request.json();
    } else if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
      const form = await request.formData();
      data = {};
      for (const [k, v] of form.entries()) {
        if (k in data) {
          data[k] = [].concat(data[k], v);
        } else {
          data[k] = v;
        }
      }
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: "unsupported_media_type"
      }), {
        status: 415,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS2, ...SECURITY_HEADERS2 }
      });
    }
  } catch (e) {
    return new Response(JSON.stringify({
      success: false,
      error: "invalid_json",
      message: e.message
    }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS2, ...SECURITY_HEADERS2 }
    });
  }
  const clean = {};
  for (const f of VALID_FIELDS) {
    if (data[f] !== void 0) clean[f] = data[f];
  }
  clean.lang = clean.lang || "en";
  const errors = validate(clean);
  if (errors.length > 0) {
    return new Response(JSON.stringify({
      success: false,
      error: "validation_failed",
      errors
    }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS2, ...SECURITY_HEADERS2 }
    });
  }
  const spamCheck = checkSpam(clean);
  if (spamCheck.blocked) {
    console.log(`[inquiry] Blocked (${spamCheck.reason}): ${clean.email}`);
    return new Response(JSON.stringify({
      success: false,
      error: "blocked",
      reason: spamCheck.reason
    }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS2, ...SECURITY_HEADERS2 }
    });
  }
  const ai = await aiEnhance(env, clean);
  const subject = `[OEM Inquiry] ${clean.name} - ${clean.country} - ${(clean.productLine || []).length} product(s) - ${clean.quantity}pcs`;
  const html = buildEmailHTML(clean, ai);
  const text = buildEmailText(clean);
  const fromEmail = env.RESEND_FROM || "KeXinMaterials Inquiry <onboarding@resend.dev>";
  const userAgent = request.headers.get("User-Agent") || "";
  if (env.RESEND_API_KEY) {
    const toEmail = env.RESEND_TO || "kexin@beeaa.com";
    try {
      const resendResp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [toEmail],
          reply_to: clean.email,
          // 让回复直接到客户邮箱
          subject,
          text,
          html
        })
      });
      const result = await resendResp.json();
      if (resendResp.ok) {
        const [d1Result, autoReplyResult, notifyResult] = await Promise.all([
          saveToD1(env, clean, ai, result.id, ip, userAgent),
          sendAutoReply(env, clean, ai, fromEmail),
          sendWebhookNotification(env, clean, ai, null)
          // D1 之后如果有 ID 会再发一次
        ]);
        if (d1Result.saved && d1Result.id) {
          await sendWebhookNotification(env, clean, ai, d1Result.id);
        }
        return new Response(JSON.stringify({
          success: true,
          method: "resend",
          message: "Your inquiry has been sent. A confirmation email is on its way to your inbox. We will reply within 12 hours.",
          messageId: result.id,
          inquiryId: d1Result.id || null,
          autoReply: autoReplyResult,
          persisted: d1Result,
          notified: notifyResult,
          ai
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...CORS_HEADERS2, ...SECURITY_HEADERS2 }
        });
      } else {
        console.error("Resend failed:", result);
        return new Response(JSON.stringify({
          success: false,
          error: "resend_failed",
          message: result.message || "Email service error",
          details: result
        }), {
          status: 502,
          headers: { "Content-Type": "application/json", ...CORS_HEADERS2, ...SECURITY_HEADERS2 }
        });
      }
    } catch (e) {
      console.error("Resend exception:", e);
      return new Response(JSON.stringify({
        success: false,
        error: "resend_exception",
        message: e.message
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS2, ...SECURITY_HEADERS2 }
      });
    }
  }
  if (env.EMAIL_WORKER_URL) {
    try {
      const cfResp = await fetch(env.EMAIL_WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: "kexin@beeaa.com", from: "noreply@beeaa.com", subject, text, html })
      });
      if (cfResp.ok) {
        const [d1Result, autoReplyResult, notifyResult] = await Promise.all([
          saveToD1(env, clean, ai, null, ip, userAgent),
          sendAutoReply(env, clean, ai, fromEmail),
          sendWebhookNotification(env, clean, ai, null)
        ]);
        if (d1Result.saved && d1Result.id) {
          await sendWebhookNotification(env, clean, ai, d1Result.id);
        }
        return new Response(JSON.stringify({
          success: true,
          method: "cf_email_service",
          message: "Your inquiry has been sent. A confirmation email is on its way. We will reply within 12 hours.",
          inquiryId: d1Result.id || null,
          autoReply: autoReplyResult,
          persisted: d1Result,
          notified: notifyResult,
          ai
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...CORS_HEADERS2, ...SECURITY_HEADERS2 }
        });
      }
    } catch (e) {
      console.error("CF Email Service failed:", e);
    }
  }
  const mailto = `mailto:kexin@beeaa.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
  return new Response(JSON.stringify({
    success: true,
    method: "mailto_fallback",
    message: "Email service not configured. Please use the mailto link or contact us directly.",
    mailto,
    ai,
    setup_hint: "Configure RESEND_API_KEY in Cloudflare Pages environment variables for automatic email sending. See GUIDE_2026-08-01_Resend_Setup.md"
  }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS2, ...SECURITY_HEADERS2 }
  });
}, "onRequestPost");
var onRequestOptions2 = /* @__PURE__ */ __name(async () => {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS2
  });
}, "onRequestOptions");
var onRequestGet2 = /* @__PURE__ */ __name(async () => {
  return new Response(JSON.stringify({
    success: false,
    error: "method_not_allowed",
    message: "Use POST"
  }), {
    status: 405,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS2, ...SECURITY_HEADERS2 }
  });
}, "onRequestGet");

// _middleware.js
var SECURITY_HEADERS3 = {
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
  for (const [k, v] of Object.entries(SECURITY_HEADERS3)) {
    headers.set(k, v);
  }
  return headers;
}
__name(applySecurityHeaders, "applySecurityHeaders");
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
__name(withSecurityHeaders, "withSecurityHeaders");
function serveR2(obj) {
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  if (obj.httpEtag) headers.set("etag", obj.httpEtag);
  headers.set("Cache-Control", "public, max-age=3600");
  applySecurityHeaders(headers);
  return new Response(obj.body, { headers });
}
__name(serveR2, "serveR2");
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
<a href="/" class="cta">\u2190 Back to Home</a>
</div>
</body>
</html>`;
  return new Response(body, {
    status: 404,
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}
__name(serve404, "serve404");
function serve301(targetUrl) {
  return new Response(null, {
    status: 301,
    headers: { "Location": targetUrl }
  });
}
__name(serve301, "serve301");
function parseBslug(slug) {
  const m = slug.match(/^(.*?)-(\d{4,6})$/);
  if (m) {
    return { base: m[1], hasSuffix: true, suffix: m[2], fullSlug: slug };
  }
  return { base: slug, hasSuffix: false, suffix: null, fullSlug: slug };
}
__name(parseBslug, "parseBslug");
var B_TIER_CACHE = /* @__PURE__ */ new Map();
var B_TIER_TTL_MS = 5 * 60 * 1e3;
async function findBslugSuffix(env, bucketName, productLine, slug) {
  if (bucketName !== "BOX_EN_B" && bucketName !== "BOX_ZH") return null;
  const cacheKey = `${bucketName}|${productLine}|${slug}`;
  const now = Date.now();
  if (B_TIER_CACHE.has(cacheKey)) {
    const e = B_TIER_CACHE.get(cacheKey);
    if (now - e.ts < B_TIER_TTL_MS) return e.value;
  }
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
__name(findBslugSuffix, "findBslugSuffix");
var onRequest = /* @__PURE__ */ __name(async (context) => {
  const url = new URL(context.request.url);
  let path;
  try {
    path = decodeURIComponent(url.pathname);
  } catch (e) {
    path = url.pathname;
  }
  const skipPrefixes = [
    "zh/",
    "medical-case/",
    "styles/",
    "images/",
    "_",
    "llms",
    "sitemap",
    "robots",
    "rss",
    "manifest",
    ".well-known",
    "guides/",
    "entities/",
    "tools/",
    "about/",
    "markets/",
    "wholesale",
    "agency",
    "oem",
    "export",
    "faq",
    "blog"
  ];
  const isStaticAsset = path === "/" || path === "/index.html" || path === "/favicon.ico" || skipPrefixes.some((p) => path === p.replace(/\/$/, "") || path.startsWith(p));
  if (path === "/zh" || path === "/zh/" || path.startsWith("/zh/")) {
    return await handleZHRoute(context, path);
  }
  if (path === "/medical-case" || path === "/medical-case/" || path.startsWith("/medical-case/")) {
    return await handleProductLineRoute(context, path, "medical-case", "BOX_EN_B");
  }
  if (!isStaticAsset) {
    return await handleGenericRoute(context, path);
  }
  return withSecurityHeaders(context.next());
}, "onRequest");
async function handleZHRoute(context, path) {
  const pathNoSlash = path.replace(/^\/+/, "");
  const endsWithSlash = path === "/zh" || path.endsWith("/");
  let suffix = "";
  if (endsWithSlash) {
    suffix = "index.html";
  }
  const exactKeys = [];
  if (endsWithSlash) {
    exactKeys.push(pathNoSlash + suffix);
    exactKeys.push(pathNoSlash);
  } else {
    exactKeys.push(pathNoSlash);
    exactKeys.push(pathNoSlash + "/index.html");
  }
  for (const key of exactKeys) {
    try {
      const obj = await context.env.BOX_ZH.get(key);
      if (obj) {
        return serveR2(obj);
      }
    } catch (e) {
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
          const newPath = `/zh/${productLine}/${slug}-${suffixNum}/`;
          return serve301(newPath);
        }
      }
    }
  }
  return withSecurityHeaders(serve404());
}
__name(handleZHRoute, "handleZHRoute");
async function handleProductLineRoute(context, path, productLine, bucketName) {
  const pathNoSlash = path.replace(/^\/+/, "");
  const endsWithSlash = path === `/${productLine}` || path.endsWith("/");
  const exactKeys = [];
  if (endsWithSlash) {
    exactKeys.push(pathNoSlash + "index.html");
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
    } catch (e) {
    }
  }
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
__name(handleProductLineRoute, "handleProductLineRoute");
async function handleGenericRoute(context, path) {
  const pathNoSlash = path.replace(/^\/+/, "");
  const endsWithSlash = path.endsWith("/");
  if (pathNoSlash.startsWith("_")) {
    return withSecurityHeaders(context.next());
  }
  const exactKeys = [];
  if (endsWithSlash) {
    exactKeys.push(pathNoSlash + "index.html");
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
    } catch (e) {
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
          const newPath = `/${pl}/${slug}-${suffixNum}/`;
          return serve301(newPath);
        }
      }
    }
  }
  return withSecurityHeaders(serve404());
}
__name(handleGenericRoute, "handleGenericRoute");

// ../.wrangler/tmp/pages-bFsOJK/functionsRoutes-0.307371743749542.mjs
var routes = [
  {
    routePath: "/api/admin/inquiries",
    mountPath: "/api/admin",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/admin/inquiries",
    mountPath: "/api/admin",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions]
  },
  {
    routePath: "/api/admin/inquiries",
    mountPath: "/api/admin",
    method: "PATCH",
    middlewares: [],
    modules: [onRequestPatch]
  },
  {
    routePath: "/api/inquiry",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/api/inquiry",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions2]
  },
  {
    routePath: "/api/inquiry",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/",
    mountPath: "/",
    method: "",
    middlewares: [onRequest],
    modules: []
  }
];

// ../node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
export {
  pages_template_worker_default as default
};
