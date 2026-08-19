/**
 * Privacy-friendly analytics integration
 * 1. Cloudflare Web Analytics (free, no cookies, admin enables via dashboard)
 * 2. Plausible Analytics (optional, configure domain after signup)
 * 3. Umami self-hosted (optional, deploy your own instance)
 *
 * Default: Cloudflare only. Skipped silently when token is empty.
 */

const ANALYTICS_CONFIG = {
  // Cloudflare Web Analytics - token injected via env var
  cloudflare: {
    enabled: true,
    token: process.env.CF_ANALYTICS_TOKEN || "",  // FRED copies from CF dashboard to here or env var
    src: "https://static.cloudflareinsights.com/beacon.min.js"
  },
  // Plausible - lightweight, privacy-friendly, 1.4KB
  plausible: {
    enabled: false,  // off by default, FRED sets true when needed
    domain: "box.beeaa.com",  // fill after signup at plausible.io
    src: "https://plausible.io/js/script.js"
  },
  // Umami self-hosted - fully self-managed
  umami: {
    enabled: false,  // off by default
    src: "https://umami.your-domain.com/script.js",
    websiteId: ""  // from Umami dashboard
  }
};

export function renderAnalytics() {
  const tags = [];

  if (ANALYTICS_CONFIG.cloudflare.enabled && ANALYTICS_CONFIG.cloudflare.token) {
    // Cloudflare Web Analytics - beacon.min.js, zero cookies
    tags.push(`<!-- Cloudflare Web Analytics (privacy-first, no cookies) -->`);
    tags.push(`<script defer src='${ANALYTICS_CONFIG.cloudflare.src}' data-cf-beacon='{"token": "${ANALYTICS_CONFIG.cloudflare.token}"}'></script>`);
  }

  if (ANALYTICS_CONFIG.plausible.enabled && ANALYTICS_CONFIG.plausible.domain) {
    // Plausible - 1.4KB, zero cookies, GDPR compliant
    tags.push(`<!-- Plausible Analytics (privacy-first, no cookies) -->`);
    tags.push(`<script defer data-domain="${ANALYTICS_CONFIG.plausible.domain}" src="${ANALYTICS_CONFIG.plausible.src}"></script>`);
  }

  if (ANALYTICS_CONFIG.umami.enabled && ANALYTICS_CONFIG.umami.src && ANALYTICS_CONFIG.umami.websiteId) {
    // Umami Analytics - self-hosted, no cookies
    tags.push(`<!-- Umami Analytics (self-hosted, no cookies) -->`);
    tags.push(`<script defer src="${ANALYTICS_CONFIG.umami.src}" data-website-id="${ANALYTICS_CONFIG.umami.websiteId}"></script>`);
  }

  if (tags.length === 0) {
    return `<!-- Analytics: none enabled. Enable Cloudflare Web Analytics in dashboard to auto-load (zero cookies) -->`;
  }

  return tags.join("\n  ");
}

export { ANALYTICS_CONFIG };
