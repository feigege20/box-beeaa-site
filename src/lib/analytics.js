/**
 * 隐私友好 Analytics 集成
 * 1. Cloudflare Web Analytics (免费, 无 cookie, FRED 在 dashboard 启用后自动获取 token)
 * 2. Plausible Analytics (可选, FRED 创建账号后填 domain)
 * 3. Umami self-hosted (可选, FRED 自己部署)
 *
 * 当前默认只加载 Cloudflare, token 留空时静默跳过
 */

const ANALYTICS_CONFIG = {
  // Cloudflare Web Analytics - 自动注入 token via env var
  cloudflare: {
    enabled: true,
    token: process.env.CF_ANALYTICS_TOKEN || "",  // FRED 从 CF dashboard 获取后填这里或环境变量
    src: "https://static.cloudflareinsights.com/beacon.min.js"
  },
  // Plausible - 轻量, 隐私友好, 1.4KB
  plausible: {
    enabled: false,  // 默认关闭, FRED 想要打开时设为 true
    domain: "box.beeaa.com",  // 在 plausible.io 注册后填这个
    src: "https://plausible.io/js/script.js"
  },
  // Umami self-hosted - 完全自主
  umami: {
    enabled: false,  // 默认关闭
    src: "https://umami.your-domain.com/script.js",
    websiteId: ""  // Umami dashboard 提供的 ID
  }
};

export function renderAnalytics() {
  const tags = [];

  if (ANALYTICS_CONFIG.cloudflare.enabled && ANALYTICS_CONFIG.cloudflare.token) {
    // Cloudflare Web Analytics - beacon.min.js, 零 cookie
    tags.push(`<!-- Cloudflare Web Analytics (privacy-first, no cookies) -->`);
    tags.push(`<script defer src='${ANALYTICS_CONFIG.cloudflare.src}' data-cf-beacon='{"token": "${ANALYTICS_CONFIG.cloudflare.token}"}'></script>`);
  }

  if (ANALYTICS_CONFIG.plausible.enabled && ANALYTICS_CONFIG.plausible.domain) {
    // Plausible - 1.4KB, 零 cookie, GDPR compliant
    tags.push(`<!-- Plausible Analytics (privacy-first, no cookies) -->`);
    tags.push(`<script defer data-domain="${ANALYTICS_CONFIG.plausible.domain}" src="${ANALYTICS_CONFIG.plausible.src}"></script>`);
  }

  if (ANALYTICS_CONFIG.umami.enabled && ANALYTICS_CONFIG.umami.src && ANALYTICS_CONFIG.umami.websiteId) {
    // Umami self-hosted - 完全自主
    tags.push(`<!-- Umami Analytics (self-hosted, no cookies) -->`);
    tags.push(`<script defer src="${ANALYTICS_CONFIG.umami.src}" data-website-id="${ANALYTICS_CONFIG.umami.websiteId}"></script>`);
  }

  if (tags.length === 0) {
    return `<!-- Analytics: none enabled. FRED 在 CF Dashboard 启用 Web Analytics 后会自动加载 (零 cookie) -->`;
  }

  return tags.join("\n  ");
}

export { ANALYTICS_CONFIG };
