/**
 * MOQ & Pricing Estimator Tool
 * 根据数量档 + 定制程度 → 估算单价 + 交付期
 */
import { siteConfig } from "../site.config.js";
import { renderHead, renderHeader, renderFooter, renderCTA } from "../layout.js";
import { webSiteSchema, softwareApplicationSchema } from "../schemas.js";

const BASE_URL = `${siteConfig.protocol}://${siteConfig.domain}`;

const TIERS = [
  { min: 100, max: 499, label_en: "Small batch (100-499)", label_zh: "小批量 (100-499)", multiplier: 1.0, lead_weeks: 5 },
  { min: 500, max: 1999, label_en: "Medium batch (500-1,999)", label_zh: "中批量 (500-1,999)", multiplier: 0.75, lead_weeks: 4 },
  { min: 2000, max: 9999, label_en: "Large batch (2,000-9,999)", label_zh: "大批量 (2,000-9,999)", multiplier: 0.55, lead_weeks: 4 },
  { min: 10000, max: 999999, label_en: "Bulk (10,000+)", label_zh: "超大单 (10,000+)", multiplier: 0.42, lead_weeks: 6 },
];

const CUSTOM_LEVELS = [
  { key: "logo", label_en: "Logo print only", label_zh: "仅印 logo", add: 0.05, setup: 0 },
  { key: "color", label_en: "Custom color", label_zh: "定制颜色", add: 0.10, setup: 500 },
  { key: "foam", label_en: "Custom foam insert", label_zh: "定制内衬", add: 0.20, setup: 200 },
  { key: "size", label_en: "Custom size / mold", label_zh: "定制尺寸/开模", add: 0.50, setup: 3000 },
  { key: "full", label_en: "Full OEM/ODM", label_zh: "全套 OEM/ODM", add: 0.80, setup: 5000 },
];

const BASE_PRICE = 38; // USD per unit, base ABS M-size

export function renderMOQPricingEstimator({ lang = "en" } = {}) {
  const t = lang === "zh";

  const html = `
<section class="hero" style="padding:3rem 0 2rem;">
  <div class="container">
    <h1 style="font-size:clamp(2rem,5vw,3rem);font-weight:800;margin-bottom:1rem;">
      ${t ? "MOQ 与报价估算器" : "MOQ & Pricing Estimator"}
    </h1>
    <p style="font-size:1.125rem;color:var(--color-text-muted);max-width:720px;">
      ${t
        ? "输入数量 + 定制程度，10 秒估算单价区间 + 一次性开模费 + 交付期。基价 = ABS M 号防护箱 USD 38 / 件。"
        : "Enter quantity + customization level, get unit price + tooling + lead time in 10 seconds. Base = ABS M-size case USD 38 / unit."}
    </p>
  </div>
</section>

<section style="padding:2rem 0 4rem;">
  <div class="container">
    <div class="card card-elevated" style="max-width:720px;margin:0 auto;padding:2rem;">
      <form id="moqForm" onsubmit="return false;">
        <div class="form-group" style="margin-bottom:1.5rem;">
          <label style="font-weight:600;font-size:1.125rem;display:block;margin-bottom:0.5rem;">
            ${t ? "数量 (件)" : "Quantity (pcs)"}
          </label>
          <input type="number" name="quantity" min="100" max="100000" value="500" style="width:100%;padding:0.75rem;font-size:1rem;border:1px solid var(--color-border);border-radius:var(--radius);" />
          <p style="font-size:0.875rem;color:var(--color-text-muted);margin-top:0.5rem;">
            ${t ? "MOQ 100 件起，10000+ 走单独报价" : "MOQ 100 pcs; 10,000+ requires custom quote"}
          </p>
        </div>

        <div class="form-group" style="margin-bottom:1.5rem;">
          <label style="font-weight:600;font-size:1.125rem;display:block;margin-bottom:0.5rem;">
            ${t ? "定制程度" : "Customization Level"}
          </label>
          <select name="custom" style="width:100%;padding:0.75rem;font-size:1rem;border:1px solid var(--color-border);border-radius:var(--radius);">
            ${CUSTOM_LEVELS.map(c => `<option value="${c.key}">${t ? c.label_zh : c.label_en}</option>`).join("")}
          </select>
        </div>

        <button type="button" id="moqCalcBtn" class="btn btn-lg cta-orange" style="width:100%;margin-top:1rem;">
          ${t ? "💰 估算单价 + 交付" : "💰 Estimate Price + Lead Time"}
        </button>
      </form>

      <div id="moqResult" style="display:none;margin-top:2rem;padding:1.5rem;background:var(--color-accent-soft);border-radius:var(--radius-lg);border:2px solid var(--color-accent);"></div>
    </div>

    <div style="margin-top:3rem;max-width:720px;margin-left:auto;margin-right:auto;">
      <h2 style="font-size:1.5rem;font-weight:700;margin-bottom:1rem;">${t ? "价格档位参考" : "Price Tier Reference"}</h2>
      <div style="overflow-x:auto;">
        <table class="params-table" style="width:100%;">
          <thead>
            <tr><th>${t ? "数量" : "Qty"}</th><th>${t ? "单价系数" : "Multiplier"}</th><th>${t ? "基价" : "Base price"}</th><th>${t ? "交付" : "Lead"}</th></tr>
          </thead>
          <tbody>
            ${TIERS.map(t1 => `
              <tr>
                <td>${t1.min}${t1.max < 999999 ? '-' + t1.max : '+'}</td>
                <td>${t1.multiplier.toFixed(2)}×</td>
                <td>$${(BASE_PRICE * t1.multiplier).toFixed(2)}</td>
                <td>${t1.lead_weeks} ${t ? "周" : "weeks"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
      <p style="color:var(--color-text-muted);margin-top:1rem;font-size:0.875rem;">
        ${t
          ? "基价 USD 38 为 ABS M 号 8 系防护箱（含内衬白坯）。实际报价按图核算。"
          : "Base USD 38 = ABS M-size Series 8 case (no foam). Actual quote per drawing."}
      </p>
    </div>
  </div>
</section>
`;

  return renderHead({
    title: t ? "MOQ 与报价估算器 | 客信新材料" : "MOQ & Pricing Estimator | KeXinMaterials",
    description: t
      ? "MOQ 100 件起，按数量档和定制程度估算单价。基价 USD 38 / 件，12 小时正式报价。"
      : "MOQ 100 pcs. Estimate unit price by quantity tier + customization. Base USD 38, 12h formal quote.",
    keywords: "MOQ, pricing estimator, protective case quote, 报价估算, 客信新材料, OEM",
    canonical: `${BASE_URL}/${t ? "zh/" : ""}tools/moq-pricing-estimator/`,
    lang,
    theme: "engineering-plastic",
    schemas: [
      webSiteSchema(),
      softwareApplicationSchema({
        name: t ? "MOQ 与报价估算器" : "MOQ & Pricing Estimator",
        description: t ? "按数量档 + 定制程度估算单价" : "Estimate unit price by quantity + customization",
        url: `${BASE_URL}/${t ? "zh/" : ""}tools/moq-pricing-estimator/`,
      }),
    ],
  })
  + renderHeader({ lang, currentPath: "/tools/moq-pricing-estimator/" })
  + html
  + renderCTA({ lang })
  + renderFooter({ lang });
}

export const moqPricingEstimatorClientJS = `
(function() {
  var btn = document.getElementById('moqCalcBtn');
  var result = document.getElementById('moqResult');
  if (!btn || !result) return;
  var BASE = 38;
  var tiers = [
    {min:100,max:499,mult:1.0,lead:5},
    {min:500,max:1999,mult:0.75,lead:4},
    {min:2000,max:9999,mult:0.55,lead:4},
    {min:10000,max:999999,mult:0.42,lead:6}
  ];
  var customs = {
    logo: {add:0.05,setup:0,en:'Logo print only',zh:'仅印 logo'},
    color: {add:0.10,setup:500,en:'Custom color',zh:'定制颜色'},
    foam: {add:0.20,setup:200,en:'Custom foam insert',zh:'定制内衬'},
    size: {add:0.50,setup:3000,en:'Custom size / mold',zh:'定制尺寸/开模'},
    full: {add:0.80,setup:5000,en:'Full OEM/ODM',zh:'全套 OEM/ODM'}
  };
  btn.addEventListener('click', function() {
    var qty = parseInt(document.querySelector('#moqForm [name=quantity]').value, 10);
    var customKey = document.querySelector('#moqForm [name=custom]').value;
    if (!qty || qty < 100) {
      var tm = (document.documentElement.lang || 'en').toLowerCase().startsWith('zh') ? 'MOQ 100 件起' : 'MOQ is 100 pcs';
      result.style.display = 'block';
      result.innerHTML = '<p style="color:var(--color-danger);font-weight:600;">' + tm + '</p>';
      return;
    }
    var tier = tiers.find(function(t){ return qty >= t.min && qty <= t.max; });
    var custom = customs[customKey];
    var unitPrice = BASE * tier.mult * (1 + custom.add);
    var totalSetup = custom.setup;
    var total = unitPrice * qty + totalSetup;
    var isZh = (document.documentElement.lang || 'en').toLowerCase().startsWith('zh');
    result.style.display = 'block';
    result.innerHTML =
      '<h3 style="font-size:1.5rem;font-weight:800;color:var(--color-accent);margin-bottom:0.5rem;">' +
        (isZh ? '估算结果' : 'Estimate') +
      '</h3>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin:1rem 0;">' +
        '<div><strong>' + (isZh ? '数量' : 'Qty') + '</strong><br/>' + qty.toLocaleString() + ' ' + (isZh ? '件' : 'pcs') + '</div>' +
        '<div><strong>' + (isZh ? '定制' : 'Custom') + '</strong><br/>' + (isZh ? custom.zh : custom.en) + '</div>' +
        '<div><strong>' + (isZh ? '单价' : 'Unit') + '</strong><br/>$ ' + unitPrice.toFixed(2) + '</div>' +
        '<div><strong>' + (isZh ? '开模费' : 'Tooling') + '</strong><br/>$ ' + totalSetup.toFixed(2) + '</div>' +
        '<div><strong>' + (isZh ? '交付' : 'Lead') + '</strong><br/>' + tier.lead + ' ' + (isZh ? '周' : 'weeks') + '</div>' +
        '<div><strong>' + (isZh ? '总价' : 'Total') + '</strong><br/><span style="color:var(--color-accent);font-weight:800;">$ ' + total.toLocaleString(undefined, {maximumFractionDigits: 0}) + '</span></div>' +
      '</div>' +
      '<p style="color:var(--color-text-muted);font-size:0.875rem;margin-bottom:1rem;">' +
        (isZh ? '此为粗略估算，正式报价 12 小时内提供。' : 'Rough estimate. Formal quote within 12 hours.') +
      '</p>' +
      '<a href="mailto:' + '${siteConfig.contact.email}'.replace('@', '%40') + '?subject=' + encodeURIComponent((isZh ? '正式报价 - ' : 'Formal quote - ') + qty + ' pcs ' + (isZh ? custom.zh : custom.en)) + '" class="btn cta-orange">' +
        (isZh ? '📧 获取正式报价' : '📧 Get Formal Quote') +
      '</a>';
    result.scrollIntoView({behavior:'smooth', block:'center'});
  });
})();
`;
