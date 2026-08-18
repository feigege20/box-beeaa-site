/**
 * OEM 表单询盘 API 端点
 * POST /api/inquiry
 * Body: { productLine: string[], size, material, ipRating, color, foamInsert, logoPrint,
 *         quantity, targetPrice, leadTime, certification, usage,
 *         name, company, email, phone, country, message,
 *         lang: 'en' | 'zh' }
 *
 * 处理流程:
 *  1. CORS + method 验证
 *  2. 验证必填字段
 *  3. 速率限制 (per IP, 5/min)
 *  4. Workers AI 自动翻译 (中→英 or 英→中) + 分类 (可选)
 *  5. 发送邮件 (优先级: Resend API > Cloudflare Email Service > mailto: fallback)
 *  6. 返回 success / error
 *
 * 配置 (任选其一):
 *  A) Resend (推荐, 免费 100/天):
 *     - FRED 注册 https://resend.com (免费, 无需信用卡)
 *     - Dashboard → API Keys → Create API Key
 *     - Pages Dashboard → Settings → Environment variables
 *       Variable: RESEND_API_KEY
 *       Value: re_xxx...
 *     - (可选) 验证 beeaa.com 后, From 改为 noreply@beeaa.com
 *     - 默认 From: onboarding@resend.dev (FRED 注册时验证邮箱)
 *
 *  B) Cloudflare Email Service (Paid plan 必需, 需独立 Worker):
 *     - Dashboard → Email Service → Add Domain (beeaa.com)
 *     - 验证 SPF/DKIM/DMARC (自动)
 *     - 单独部署一个 Worker 配 send_email binding
 *     - Pages 通过 fetch() 调用该 Worker
 *
 *  C) mailto: fallback (无后端, 默认):
 *     - 返回 mailto: 链接, 用户点击打开邮件客户端
 */

// 允许跨域 (form 在 box.beeaa.com, API 也在同域, 但保留 CORS 以防万一)
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400"
};

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Frame-Options": "DENY"
};

// 简单内存速率限制 (per IP, 5 次/分钟)
const RATE_LIMIT_BUCKET = new Map();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 min

function checkRateLimit(ip) {
  const now = Date.now();
  const arr = RATE_LIMIT_BUCKET.get(ip) || [];
  // 清理过期
  const recent = arr.filter(t => now - t < RATE_LIMIT_WINDOW);
  if (recent.length >= RATE_LIMIT_MAX) return false;
  recent.push(now);
  RATE_LIMIT_BUCKET.set(ip, recent);
  return true;
}

// 字段白名单
const VALID_FIELDS = [
  "productLine", "size", "material", "ipRating", "color",
  "foamInsert", "logoPrint", "quantity", "targetPrice",
  "leadTime", "certification", "usage",
  "name", "company", "email", "phone", "country", "message", "lang"
];

// 必填字段
const REQUIRED = ["name", "email", "phone", "country", "quantity", "productLine"];

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
  // 邮箱格式
  if (data.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)) {
    errors.push("email format invalid");
  }
  // 数量
  if (data.quantity && (isNaN(data.quantity) || Number(data.quantity) < 1)) {
    errors.push("quantity must be positive number");
  }
  return errors;
}

// === Spam 防护 (honeypot + 关键词黑名单 + 时间检查) ===
const SPAM_KEYWORDS = [
  "viagra", "casino", "lottery", "crypto giveaway", "click here to claim",
  "free bitcoin", "make money fast", "work from home", "weight loss pill",
  "seo backlink", "buy followers", "click my link", "投资理财", "网赚",
  "免费BTC", "稳赚不赔", "博彩", "兼职刷单"
];
const URL_REGEX = /https?:\/\/[^\s]{20,}/gi; // 长 URL 链
function checkSpam(data) {
  // Honeypot: 机器人会填 website/url 字段，正常用户不会
  if (data.website && String(data.website).trim() !== "") return { blocked: true, reason: "honeypot" };
  if (data.url && String(data.url).trim() !== "") return { blocked: true, reason: "honeypot" };
  // 关键词黑名单
  const text = `${data.name || ""} ${data.message || ""} ${data.company || ""}`.toLowerCase();
  for (const kw of SPAM_KEYWORDS) {
    if (text.includes(kw.toLowerCase())) return { blocked: true, reason: "spam_keyword", keyword: kw };
  }
  // 短时间戳检查 (form 提交 < 2 秒 = bot)
  if (data._ts) {
    const ts = Number(data._ts);
    if (!isNaN(ts) && ts > 0 && (Date.now() - ts) < 2000) {
      return { blocked: true, reason: "submitted_too_fast" };
    }
  }
  // 太多 URL = spam
  const messageUrls = (data.message || "").match(URL_REGEX);
  if (messageUrls && messageUrls.length >= 2) {
    return { blocked: true, reason: "too_many_urls", count: messageUrls.length };
  }
  return { blocked: false };
}

// AI 翻译 + 分类 (如果有 Workers AI binding)
async function aiEnhance(env, data) {
  if (!env.AI) {
    return {
      translated: null,
      category: null,
      urgency: "normal"
    };
  }
  try {
    // 简化的 prompt, Llama 3 8b
    const prompt = `Analyze this B2B inquiry and provide:
1. Translation to English (if the original is Chinese) or Chinese (if English)
2. Category: which product line (military-tactical-case, drone-case, instrument-case, waterproof-case, medical-case, engineering-plastic-case, tool-box, camera-stage-case, trolley-case, or other)
3. Urgency: low/normal/high based on quantity and lead time

Original: ${data.lang === "zh" ? data.productLine.join("、") + " | " + (data.message || "") : data.productLine.join(", ") + " | " + (data.message || "")}
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
    // 尝试提取 JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {}
    }
  } catch (e) {
    console.error("AI enhance failed:", e);
  }
  return { translated: null, category: null, urgency: "normal" };
}

// 构建 HTML 邮件正文
function buildEmailHTML(data, ai) {
  const t = data.lang === "zh";
  const productNames = {
    "military-tactical-case": t ? "军警战术防护箱" : "Military / Tactical Case",
    "drone-case": t ? "无人机防护箱" : "Drone Case",
    "instrument-case": t ? "仪器仪表箱" : "Instrument Case",
    "waterproof-case": t ? "防水保护箱" : "Waterproof Case",
    "medical-case": t ? "医疗器械箱" : "Medical Device Case",
    "engineering-plastic-case": t ? "工程塑料箱" : "Engineering Plastic Case",
    "tool-box": t ? "工具收纳箱" : "Tool Box",
    "camera-stage-case": t ? "摄影器材箱" : "Camera / Stage Case",
    "trolley-case": t ? "拉杆防护箱" : "Trolley Case"
  };
  const productsList = (data.productLine || []).map(p => productNames[p] || p).join(", ");
  const labelMap = {
    size: t ? "尺寸" : "Size",
    material: t ? "材质" : "Material",
    ipRating: t ? "防护等级" : "IP Rating",
    color: t ? "颜色" : "Color",
    foamInsert: t ? "泡棉" : "Foam Insert",
    logoPrint: t ? "印刷" : "Logo Print",
    quantity: t ? "数量" : "Quantity",
    targetPrice: t ? "目标单价 (USD)" : "Target Price (USD)",
    leadTime: t ? "期望交期" : "Lead Time",
    certification: t ? "认证" : "Certifications",
    usage: t ? "用途" : "Usage",
    name: t ? "姓名" : "Name",
    company: t ? "公司" : "Company",
    email: t ? "邮箱" : "Email",
    phone: t ? "电话" : "Phone",
    country: t ? "国家" : "Country",
    message: t ? "留言" : "Message"
  };
  const rows = [];
  for (const [k, label] of Object.entries(labelMap)) {
    const v = data[k];
    if (v && (k !== "productLine")) {
      const safe = String(v).replace(/</g, "&lt;").replace(/>/g, "&gt;");
      rows.push(`<tr><td style="padding:8px 12px;background:#F1F5F9;color:#0F172A;font-weight:600;border:1px solid #E2E8F0;">${label}</td><td style="padding:8px 12px;color:#0F172A;border:1px solid #E2E8F0;">${safe}</td></tr>`);
    }
  }
  const productsRow = `<tr><td style="padding:8px 12px;background:#F1F5F9;color:#0F172A;font-weight:600;border:1px solid #E2E8F0;">${t ? "产品线" : "Product Lines"}</td><td style="padding:8px 12px;color:#0F172A;border:1px solid #E2E8F0;">${productsList}</td></tr>`;
  const urgency = ai?.urgency || "normal";
  const urgencyBg = urgency === "high" ? "#DC2626" : urgency === "low" ? "#10B981" : "#F59E0B";
  const urgencyLabel = (urgency || "NORMAL").toUpperCase();
  // 邮件模板设计原则:
  // 1. 纯色背景 (Outlook 不支持 gradient, 会渲染丢失 → 白字糊底)
  // 2. 所有元素显式 color (避免暗色模式/继承失败)
  // 3. Header 用品牌深橙 #C2410C 背景 + 白字 + 大字号 28px + 700 weight + text-shadow 强对比
  // 4. body 用 #F8FAFC 浅灰 (暗色模式下也不变黑)
  // 5. 加 VML <v:rect> 给 Outlook 用 (Outlook 渲染 table bgcolor 也不稳, 必加)
  // 6. 加 mso-line-height-rule + mso-style-priority 防 Outlook 篡改
  return `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light only">
  <title>${t ? "新 OEM 询盘" : "New OEM Inquiry"}</title>
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
          <!-- Header: 深橙纯色 + 白字 + Outlook VML fallback (双保险) -->
          <!--[if mso]>
          <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fillcolor="#C2410C" stroke="f" style="width:600px;height:140px;">
            <v:textbox inset="24px,24px,24px,24px">
              <![endif]-->
          <tr>
            <td class="beeaa-header" bgcolor="#C2410C" style="background-color:#C2410C;padding:28px 24px;color:#FFFFFF;mso-line-height-rule:exactly;">
              <h1 style="margin:0 0 10px;font-size:28px;font-weight:700;color:#FFFFFF;line-height:1.25;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;mso-style-priority:99;background-color:transparent;text-shadow:0 1px 2px rgba(0,0,0,0.25);">
                <span style="color:#FFFFFF !important;">📧 ${t ? "新 OEM 询盘" : "New OEM Inquiry"}</span>
              </h1>
              <p style="margin:0;font-size:15px;color:#FFFFFF;line-height:1.5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;mso-style-priority:99;background-color:transparent;">
                <span style="color:#FFFFFF !important;font-weight:700;">${t ? "来源" : "Source"}:</span>
                <a href="https://box.beeaa.com${data.lang === "zh" ? "/zh" : ""}/oem/" style="color:#FFFFFF !important;text-decoration:underline;font-weight:600;">box.beeaa.com${data.lang === "zh" ? "/zh" : ""}/oem/</a>
              </p>
              ${ai?.urgency ? `<p style="margin:14px 0 0;"><span style="background-color:${urgencyBg};color:#FFFFFF;padding:5px 12px;border-radius:4px;font-size:13px;font-weight:700;display:inline-block;font-family:Arial,sans-serif;border:1px solid rgba(255,255,255,0.3);">${t ? "紧急度" : "Urgency"}: ${urgencyLabel}</span></p>` : ""}
            </td>
          </tr>
          <!--[if mso]>
            </v:textbox>
          </v:rect>
          <![endif]-->
          <!-- Body: 询盘详情 -->
          <tr>
            <td style="padding:24px;background-color:#FFFFFF;color:#0F172A;">
              <h2 style="margin:0 0 16px;font-size:18px;font-weight:700;color:#0F172A;">${t ? "询盘详情" : "Inquiry Details"}</h2>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;font-size:14px;">
                ${productsRow}
                ${rows.join("")}
              </table>
              ${ai?.translation_en && data.lang === "zh" ? `<h3 style="margin:20px 0 8px;font-size:14px;font-weight:700;color:#0F172A;">🌐 AI Translation (EN):</h3><div style="background-color:#F8FAFC;padding:12px;border-radius:6px;font-size:14px;color:#0F172A;border:1px solid #E2E8F0;">${ai.translation_en}</div>` : ""}
              ${ai?.translation_zh && data.lang !== "zh" ? `<h3 style="margin:20px 0 8px;font-size:14px;font-weight:700;color:#0F172A;">🌐 AI 翻译:</h3><div style="background-color:#F8FAFC;padding:12px;border-radius:6px;font-size:14px;color:#0F172A;border:1px solid #E2E8F0;">${ai.translation_zh}</div>` : ""}
              ${ai?.category ? `<p style="margin-top:16px;font-size:12px;color:#475569;">AI 分类: <strong style="color:#0F172A;">${ai.category}</strong></p>` : ""}
            </td>
          </tr>
          <!-- CTA: 客户邮箱直接回信 -->
          <tr>
            <td style="padding:16px 24px;background-color:#F8FAFC;border-top:1px solid #E2E8F0;">
              <p style="margin:0;font-size:14px;color:#475569;">
                ${t ? "📧 直接回复此邮件" : "📧 Reply directly to this email"}:
                <a href="mailto:${data.email}" style="color:#C2410C;font-weight:700;text-decoration:underline;background-color:transparent;">${data.email}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 24px;background-color:#F1F5F9;border-top:1px solid #E2E8F0;border-radius:0 0 8px 8px;">
              <p style="margin:0;font-size:12px;color:#64748B;text-align:center;line-height:1.5;">
                ${t ? "此邮件由 box.beeaa.com OEM 表单自动发送" : "Auto-generated by box.beeaa.com OEM form"}<br>
                <a href="https://box.beeaa.com" style="color:#C2410C;font-weight:600;text-decoration:underline;background-color:transparent;">box.beeaa.com</a> · kexin@beeaa.com · +86 13590555309
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

// 纯文本版本
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

// === 自动回复邮件 (客户确认) ===
function buildAutoReplyHTML(data, ai) {
  const t = data.lang === "zh";
  const productNames = {
    "military-tactical-case": t ? "军事战术保护箱" : "Military / Tactical Case",
    "drone-case": t ? "无人机防护箱" : "Drone Case",
    "instrument-case": t ? "仪器仪表箱" : "Instrument Case",
    "waterproof-case": t ? "防水保护箱" : "Waterproof Case",
    "medical-case": t ? "医疗仪器箱" : "Medical Device Case",
    "engineering-plastic-case": t ? "工程塑料箱" : "Engineering Plastic Case",
    "tool-box": t ? "工具收纳箱" : "Tool Box",
    "camera-stage-case": t ? "摄影器材箱" : "Camera / Stage Case",
    "trolley-case": t ? "拉杆保护箱" : "Trolley Case"
  };
  const productsList = (data.productLine || []).map(p => productNames[p] || p).join(", ");
  const greeting = t
    ? `${data.name} 先生/女士，您好，<br><br>感谢您选择 <strong>客信新材料（KeXinMaterials）</strong>！我们已收到您的 OEM/ODM 询盘。`
    : `Dear ${data.name},<br><br>Thank you for choosing <strong>KeXinMaterials</strong>! We have received your OEM/ODM inquiry.`;
  const bodyText = t
    ? `<p>我们的销售工程师将在 <strong>12 小时内</strong>通过邮件（kexin@beeaa.com）或 WhatsApp（+86 13590555309）回复您，提供详细报价、模具方案、认证文件等。</p>
       <p>为了加速回复，如您方便请同步提供：<strong>3D 图纸 / 实物照片 / 详细规格表</strong>。</p>`
    : `<p>Our sales engineer will reply within <strong>12 hours</strong> via email (kexin@beeaa.com) or WhatsApp (+86 13590555309) with detailed quotation, mold plan, and certification documents.</p>
       <p>To accelerate the response, please also share if available: <strong>3D drawings / product photos / detailed specification sheet</strong>.</p>`;
  const slaBlock = t
    ? `<tr><td style="padding:8px 12px;background:#F1F5F9;color:#0F172A;font-weight:600;border:1px solid #E2E8F0;width:35%;">回复时间</td><td style="padding:8px 12px;color:#0F172A;border:1px solid #E2E8F0;">≤ 12 小时（工作日 08:00-18:00 GMT+8）</td></tr>
       <tr><td style="padding:8px 12px;background:#F1F5F9;color:#0F172A;font-weight:600;border:1px solid #E2E8F0;">询盘编号</td><td style="padding:8px 12px;color:#0F172A;border:1px solid #E2E8F0;font-family:monospace;">${data._inquiry_id || "(待生成)"}</td></tr>
       <tr><td style="padding:8px 12px;background:#F1F5F9;color:#0F172A;font-weight:600;border:1px solid #E2E8F0;">产品线</td><td style="padding:8px 12px;color:#0F172A;border:1px solid #E2E8F0;">${productsList}</td></tr>
       <tr><td style="padding:8px 12px;background:#F1F5F9;color:#0F172A;font-weight:600;border:1px solid #E2E8F0;">数量</td><td style="padding:8px 12px;color:#0F172A;border:1px solid #E2E8F0;">${data.quantity} 件</td></tr>`
    : `<tr><td style="padding:8px 12px;background:#F1F5F9;color:#0F172A;font-weight:600;border:1px solid #E2E8F0;width:35%;">Response time</td><td style="padding:8px 12px;color:#0F172A;border:1px solid #E2E8F0;">≤ 12 hours (business days 08:00-18:00 GMT+8)</td></tr>
       <tr><td style="padding:8px 12px;background:#F1F5F9;color:#0F172A;font-weight:600;border:1px solid #E2E8F0;">Inquiry ID</td><td style="padding:8px 12px;color:#0F172A;border:1px solid #E2E8F0;font-family:monospace;">${data._inquiry_id || "(pending)"}</td></tr>
       <tr><td style="padding:8px 12px;background:#F1F5F9;color:#0F172A;font-weight:600;border:1px solid #E2E8F0;">Product lines</td><td style="padding:8px 12px;color:#0F172A;border:1px solid #E2E8F0;">${productsList}</td></tr>
       <tr><td style="padding:8px 12px;background:#F1F5F9;color:#0F172A;font-weight:600;border:1px solid #E2E8F0;">Quantity</td><td style="padding:8px 12px;color:#0F172A;border:1px solid #E2E8F0;">${data.quantity} pcs</td></tr>`;
  const footerText = t
    ? "此邮件由 box.beeaa.com 询盘系统自动发送，请勿直接回复（回复将无法送达）。如有疑问请直接邮件 kexin@beeaa.com 或 WhatsApp +86 13590555309。"
    : "This email is auto-generated by box.beeaa.com inquiry system. Please do not reply directly (replies cannot be delivered). For questions, email kexin@beeaa.com or WhatsApp +86 13590555309.";
  return `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${t ? "我们已收到您的询盘" : "We received your inquiry"}</title>
</head>
<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#0F172A;line-height:1.5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#F8FAFC;">
    <tr>
      <td align="center" style="padding:20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background-color:#FFFFFF;border:1px solid #E2E8F0;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="background-color:#0F766E;padding:28px 24px;color:#FFFFFF;">
              <h1 style="margin:0 0 6px;font-size:24px;font-weight:700;color:#FFFFFF;line-height:1.3;">✅ ${t ? "询盘已收到" : "Inquiry Received"}</h1>
              <p style="margin:0;font-size:14px;color:#FFFFFF;opacity:0.95;">${t ? "客信新材料 · KeXinMaterials" : "KeXinMaterials · Your Trusted Case Manufacturer"}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 24px;background-color:#FFFFFF;color:#0F172A;">
              <div style="font-size:15px;line-height:1.65;color:#0F172A;">${greeting}</div>
              <div style="font-size:15px;line-height:1.65;color:#0F172A;margin-top:14px;">${bodyText}</div>
              <h3 style="margin:24px 0 12px;font-size:15px;font-weight:700;color:#0F172A;">${t ? "询盘摘要" : "Inquiry Summary"}</h3>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;font-size:14px;border:1px solid #E2E8F0;">
                ${slaBlock}
              </table>
              <h3 style="margin:24px 0 12px;font-size:15px;font-weight:700;color:#0F172A;">${t ? "我们能为您做什么" : "What we can do for you"}</h3>
              <ul style="margin:0;padding-left:20px;font-size:14px;color:#0F172A;line-height:1.7;">
                ${t
                  ? `<li>OEM/ODM 定制（尺寸/颜色/泡棉/logo/认证）</li>
                     <li>13,000 m² 自有工厂，60+ 设备，月产 50,000+ 件</li>
                     <li>MOQ 50 件起，30 天标准交期</li>
                     <li>ISO9001 / ROHS / CE / SGS / IP67 认证齐全</li>
                     <li>出口 50+ 国家，美/英/德/加/日/俄等</li>`
                  : `<li>OEM/ODM customization (size/color/foam/logo/certifications)</li>
                     <li>13,000 m² in-house factory, 60+ machines, 50,000+ pcs/month capacity</li>
                     <li>MOQ 50 pcs, 30-day standard delivery</li>
                     <li>ISO9001 / ROHS / CE / SGS / IP67 certified</li>
                     <li>Exported to 50+ countries (USA/UK/Germany/Canada/Japan/Russia etc.)</li>`}
              </ul>
              <div style="margin-top:24px;padding:16px;background-color:#FEF3C7;border-left:4px solid #F59E0B;border-radius:4px;">
                <p style="margin:0;font-size:13px;color:#78350F;line-height:1.6;">
                  ${t
                    ? "💡 <strong>加速回复小贴士</strong>：将您的需求直接回复到 <a href=\"mailto:kexin@beeaa.com\" style=\"color:#C2410C;\">kexin@beeaa.com</a>，附上 3D 图纸或参考图，24 小时内可拿到初版报价单和模具方案。"
                    : "💡 <strong>Tip to speed up the reply</strong>: Reply directly to <a href=\"mailto:kexin@beeaa.com\" style=\"color:#C2410C;\">kexin@beeaa.com</a> with your 3D drawings or reference photos. We can deliver an initial quotation and mold plan within 24 hours."}
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 24px;background-color:#0F172A;color:#FFFFFF;">
              <p style="margin:0 0 8px;font-size:14px;font-weight:600;">${t ? "客信新材料（KeXinMaterials）" : "KeXinMaterials (Guangdong) Co., Ltd."}</p>
              <p style="margin:0;font-size:12px;color:#CBD5E1;line-height:1.6;">
                ${t ? "源头发货工厂 · 12 年 OEM/ODM 经验 · 13,000 m²" : "Source factory · 12 years OEM/ODM · 13,000 m²"}<br>
                📧 <a href="mailto:kexin@beeaa.com" style="color:#FBBF24;">kexin@beeaa.com</a>  ·  📱 <a href="https://wa.me/8613590555309" style="color:#FBBF24;">+86 13590555309 (WhatsApp)</a><br>
                🌐 <a href="https://box.beeaa.com" style="color:#FBBF24;">box.beeaa.com</a>  ·  🏪 <a href="https://beeaa.com" style="color:#FBBF24;">beeaa.com</a>
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

function buildAutoReplyText(data) {
  const t = data.lang === "zh";
  const lines = [];
  if (t) {
    lines.push(`您好 ${data.name}，`);
    lines.push(``);
    lines.push(`感谢您选择客信新材料（KeXinMaterials）！我们已收到您的 OEM/ODM 询盘。`);
    lines.push(``);
    lines.push(`询盘编号：${data._inquiry_id || "(待生成)"}`);
    lines.push(`产品线：${(data.productLine || []).join(", ")}`);
    lines.push(`数量：${data.quantity} 件`);
    lines.push(``);
    lines.push(`我们的销售工程师将在 12 小时内通过邮件或 WhatsApp 回复您。`);
    lines.push(``);
    lines.push(`加速回复小贴士：将您的需求直接回复到 kexin@beeaa.com，附上 3D 图纸或参考图，24 小时内可拿到初版报价单和模具方案。`);
    lines.push(``);
    lines.push(`--`);
    lines.push(`客信新材料（KeXinMaterials）`);
    lines.push(`源头发货工厂 · 12 年 OEM/ODM 经验`);
    lines.push(`kexin@beeaa.com · +86 13590555309 (WhatsApp)`);
    lines.push(`box.beeaa.com · beeaa.com`);
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
    lines.push(`Source factory · 12 years OEM/ODM · 13,000 m²`);
    lines.push(`kexin@beeaa.com · +86 13590555309 (WhatsApp)`);
    lines.push(`box.beeaa.com · beeaa.com`);
  }
  return lines.join("\n");
}

// === D1 持久化 (可选) — 如果 env.DB 存在则写入 ===
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
      id, data.lang || "en",
      data.name, data.company || null, data.email, data.phone, data.country,
      JSON.stringify(data.productLine || []),
      data.size || null, data.material || null, data.ipRating || null, data.color || null,
      data.foamInsert || null, data.logoPrint || null,
      String(data.quantity),
      data.targetPrice || null, data.leadTime || null, data.certification || null, data.usage || null,
      data.message || null,
      ai?.category || null, ai?.urgency || null, ai?.translation_zh || null, ai?.translation_en || null,
      ip, userAgent, messageId || null
    ).run();
    return { saved: true, id };
  } catch (e) {
    console.error("D1 save failed:", e);
    return { saved: false, error: e.message };
  }
}

// === Slack / Discord / Telegram webhook 通知 (可选) — 如果 env.NOTIFY_WEBHOOK 存在则推送 ===
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
    const productList = (data.productLine || []).map(p => productNames[p] || p).join(", ");
    const urgency = ai?.urgency || "normal";
    const urgencyEmoji = urgency === "high" ? "🔴" : urgency === "low" ? "🟢" : "🟡";
    const urgencyColor = urgency === "high" ? "#DC2626" : urgency === "low" ? "#10B981" : "#F59E0B";

    // Slack/Discord 兼容格式 (Embed)
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
          { title: "Lead time", value: data.leadTime || "—", short: true },
          { title: "Target price", value: data.targetPrice ? `$${data.targetPrice}/pc` : "—", short: true }
        ],
        text: data.message ? `📝 Message: ${data.message.substring(0, 200)}${data.message.length > 200 ? "..." : ""}` : undefined,
        footer: "box.beeaa.com inquiry system",
        ts: Math.floor(Date.now() / 1000)
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

// === Resend 发送自动回复 (给客户) ===
async function sendAutoReply(env, data, ai, fromEmail) {
  if (!env.RESEND_API_KEY) return { sent: false, reason: "no_resend_key" };
  const t = data.lang === "zh";
  const subject = t
    ? `✅ 我们已收到您的询盘 ${data._inquiry_id || ""} — 客信新材料`
    : `✅ We received your inquiry ${data._inquiry_id || ""} — KeXinMaterials`;
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

export const onRequestPost = async (context) => {
  const { request, env } = context;
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";

  // 速率限制
  if (!checkRateLimit(ip)) {
    return new Response(JSON.stringify({
      success: false,
      error: "rate_limited",
      message: "Too many requests. Please wait 1 minute."
    }), {
      status: 429,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...SECURITY_HEADERS }
    });
  }

  // 解析 body
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
        headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...SECURITY_HEADERS }
      });
    }
  } catch (e) {
    return new Response(JSON.stringify({
      success: false,
      error: "invalid_json",
      message: e.message
    }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...SECURITY_HEADERS }
    });
  }

  // 清理: 只保留白名单字段
  const clean = {};
  for (const f of VALID_FIELDS) {
    if (data[f] !== undefined) clean[f] = data[f];
  }
  // 默认 lang
  clean.lang = clean.lang || "en";

  // 验证
  const errors = validate(clean);
  if (errors.length > 0) {
    return new Response(JSON.stringify({
      success: false,
      error: "validation_failed",
      errors
    }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...SECURITY_HEADERS }
    });
  }

  // Spam 防护
  const spamCheck = checkSpam(clean);
  if (spamCheck.blocked) {
    console.log(`[inquiry] Blocked (${spamCheck.reason}): ${clean.email}`);
    return new Response(JSON.stringify({
      success: false,
      error: "blocked",
      reason: spamCheck.reason
    }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...SECURITY_HEADERS }
    });
  }

  // AI 增强 (如果有)
  const ai = await aiEnhance(env, clean);

  // 发送邮件
  const subject = `[OEM Inquiry] ${clean.name} - ${clean.country} - ${(clean.productLine || []).length} product(s) - ${clean.quantity}pcs`;
  const html = buildEmailHTML(clean, ai);
  const text = buildEmailText(clean);
  const fromEmail = env.RESEND_FROM || "KeXinMaterials Inquiry <onboarding@resend.dev>";
  const userAgent = request.headers.get("User-Agent") || "";

  // 1) Resend API (推荐, 免费 100/天)
  if (env.RESEND_API_KEY) {
    // 收件人优先级: env.RESEND_TO (覆盖) > 真实业务邮箱
    // FRED 测试时可设 RESEND_TO=zhaofei9818@gmail.com (Resend 账号邮箱)
    // 生产时设为 kexin@beeaa.com (Beeaa 业务邮箱, 需先验证 beeaa.com 域名)
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
          reply_to: clean.email,  // 让回复直接到客户邮箱
          subject,
          text,
          html
        })
      });
      const result = await resendResp.json();
      if (resendResp.ok) {
        // ✅ 邮件发送成功 → 异步执行持久化 + 自动回复 + 通知
        const [d1Result, autoReplyResult, notifyResult] = await Promise.all([
          saveToD1(env, clean, ai, result.id, ip, userAgent),
          sendAutoReply(env, clean, ai, fromEmail),
          sendWebhookNotification(env, clean, ai, null)  // D1 之后如果有 ID 会再发一次
        ]);
        // 二次 webhook 通知带 D1 ID
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
          ai: ai
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...SECURITY_HEADERS }
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
          headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...SECURITY_HEADERS }
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
        headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...SECURITY_HEADERS }
      });
    }
  }

  // 2) Cloudflare Email Service (未来: 独立 Worker 调用)
  if (env.EMAIL_WORKER_URL) {
    try {
      const cfResp = await fetch(env.EMAIL_WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: "kexin@beeaa.com", from: "noreply@beeaa.com", subject, text, html })
      });
      if (cfResp.ok) {
        // ✅ 邮件发送成功 → 持久化 + 通知
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
          ai: ai
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...SECURITY_HEADERS }
        });
      }
    } catch (e) {
      console.error("CF Email Service failed:", e);
    }
  }

  // 3) Fallback: mailto 链接 — still persist to D1 so inquiry isn't lost
  const [d1Result] = await Promise.all([
    saveToD1(env, clean, ai, null, ip, userAgent),
    Promise.resolve(null),
  ]);
  if (d1Result && d1Result.saved && d1Result.id) {
    try { await sendWebhookNotification(env, clean, ai, d1Result.id); } catch (e) { /* ignore */ }
  }
  const mailto = `mailto:kexin@beeaa.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
  return new Response(JSON.stringify({
    success: true,
    method: "mailto_fallback",
    message: "Email service not configured. Please use the mailto link or contact us directly.",
    mailto,
    ai: ai,
    inquiryId: d1Result && d1Result.id ? d1Result.id : null,
    persisted: d1Result,
    setup_hint: "Configure RESEND_API_KEY in Cloudflare Pages environment variables for automatic email sending. See GUIDE_2026-08-01_Resend_Setup.md"
  }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...SECURITY_HEADERS }
  });
};

export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS
  });
};

export const onRequestGet = async () => {
  return new Response(JSON.stringify({
    success: false,
    error: "method_not_allowed",
    message: "Use POST"
  }), {
    status: 405,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...SECURITY_HEADERS }
  });
};
