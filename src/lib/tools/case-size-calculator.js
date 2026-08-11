/**
 * Case Size Calculator Tool
 * 输入设备尺寸 + foam padding → 推荐防护箱内部尺寸
 */
import { siteConfig } from "../site.config.js";
import { renderHead, renderHeader, renderFooter, renderCTA } from "../layout.js";
import { webSiteSchema, softwareApplicationSchema } from "../schemas.js";

const BASE_URL = `${siteConfig.protocol}://${siteConfig.domain}`;

export function renderCaseSizeCalculator({ lang = "en" } = {}) {
  const t = lang === "zh";

  const html = `
<section class="hero" style="padding:3rem 0 2rem;">
  <div class="container">
    <h1 style="font-size:clamp(2rem,5vw,3rem);font-weight:800;margin-bottom:1rem;">
      ${t ? "防护箱尺寸计算器" : "Case Size Calculator"}
    </h1>
    <p style="font-size:1.125rem;color:var(--color-text-muted);max-width:720px;">
      ${t
        ? "输入设备尺寸 + 内衬缓冲厚度，自动算出防护箱的内部最小尺寸和推荐 SKU 范围。"
        : "Enter equipment dimensions + foam padding thickness. Get internal minimum dimensions and recommended SKU ranges."}
    </p>
  </div>
</section>

<section style="padding:2rem 0 4rem;">
  <div class="container">
    <div class="card card-elevated" style="max-width:720px;margin:0 auto;padding:2rem;">
      <form id="sizeForm" onsubmit="return false;">
        <h2 style="font-size:1.25rem;font-weight:700;margin-bottom:1rem;">${t ? "设备尺寸" : "Equipment Dimensions"}</h2>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1.5rem;">
          <div>
            <label style="display:block;margin-bottom:0.5rem;font-weight:500;">${t ? "长 (mm)" : "Length (mm)"}</label>
            <input type="number" name="length" min="10" max="2000" placeholder="300" style="width:100%;padding:0.75rem;border:1px solid var(--color-border);border-radius:var(--radius);" />
          </div>
          <div>
            <label style="display:block;margin-bottom:0.5rem;font-weight:500;">${t ? "宽 (mm)" : "Width (mm)"}</label>
            <input type="number" name="width" min="10" max="2000" placeholder="200" style="width:100%;padding:0.75rem;border:1px solid var(--color-border);border-radius:var(--radius);" />
          </div>
          <div>
            <label style="display:block;margin-bottom:0.5rem;font-weight:500;">${t ? "高 (mm)" : "Height (mm)"}</label>
            <input type="number" name="height" min="10" max="2000" placeholder="100" style="width:100%;padding:0.75rem;border:1px solid var(--color-border);border-radius:var(--radius);" />
          </div>
        </div>

        <h2 style="font-size:1.25rem;font-weight:700;margin-bottom:1rem;">${t ? "缓冲设置" : "Foam Padding"}</h2>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem;">
          <div>
            <label style="display:block;margin-bottom:0.5rem;font-weight:500;">${t ? "单边泡棉厚度 (mm)" : "Padding per side (mm)"}</label>
            <select name="padding" style="width:100%;padding:0.75rem;border:1px solid var(--color-border);border-radius:var(--radius);">
              <option value="10">10 mm (${t ? "薄" : "thin"})</option>
              <option value="20" selected>20 mm (${t ? "标准" : "standard"})</option>
              <option value="30">30 mm (${t ? "厚" : "thick"})</option>
              <option value="50">50 mm (${t ? "超厚" : "extra thick"})</option>
            </select>
          </div>
          <div>
            <label style="display:block;margin-bottom:0.5rem;font-weight:500;">${t ? "间隙余量 (mm)" : "Clearance (mm)"}</label>
            <select name="clearance" style="width:100%;padding:0.75rem;border:1px solid var(--color-border);border-radius:var(--radius);">
              <option value="5">5 mm (${t ? "紧" : "tight"})</option>
              <option value="10" selected>10 mm (${t ? "标准" : "standard"})</option>
              <option value="20">20 mm (${t ? "松" : "loose"})</option>
            </select>
          </div>
        </div>

        <button type="button" id="sizeCalcBtn" class="btn btn-lg cta-orange" style="width:100%;margin-top:1rem;">
          ${t ? "📐 计算最小内部尺寸" : "📐 Calculate Minimum Internal Size"}
        </button>
      </form>

      <div id="sizeResult" style="display:none;margin-top:2rem;padding:1.5rem;background:var(--color-accent-soft);border-radius:var(--radius-lg);border:2px solid var(--color-accent);"></div>
    </div>

    <div style="margin-top:3rem;max-width:720px;margin-left:auto;margin-right:auto;">
      <h2 style="font-size:1.5rem;font-weight:700;margin-bottom:1rem;">${t ? "客信尺寸 SKU 参考" : "KeXinMaterials SKU Size Reference"}</h2>
      <p style="color:var(--color-text-muted);margin-bottom:1rem;">
        ${t
          ? "客信 8 系防护箱标准 SKU 范围：S (250×180×80) ~ XXL (1200×800×500)，覆盖 95% 设备。"
          : "KeXinMaterials Series 8 standard SKU range: S (250×180×80) ~ XXL (1200×800×500), covers 95% of equipment."}
      </p>
    </div>
  </div>
</section>
`;

  return renderHead({
    title: t ? "防护箱尺寸计算器 | 客信新材料" : "Case Size Calculator | KeXinMaterials",
    description: t
      ? "输入设备尺寸 + 泡棉厚度，自动算出防护箱内部最小尺寸。客信 8 系标准 SKU 250×180×80 ~ 1200×800×500。"
      : "Enter equipment + foam padding, auto-calculate minimum case internal size. KeXinMaterials Series 8 SKU range 250×180×80 to 1200×800×500.",
    keywords: "case size calculator, protective case dimensions, 防护箱尺寸计算器, 客信 8 系, foam insert",
    canonical: `${BASE_URL}/${t ? "zh/" : ""}tools/case-size-calculator/`,
    lang,
    theme: "drone",
    schemas: [
      webSiteSchema(),
      softwareApplicationSchema({
        name: t ? "防护箱尺寸计算器" : "Case Size Calculator",
        description: t ? "输入设备尺寸自动算防护箱内部尺寸" : "Auto-calculate case internal dimensions from equipment",
        url: `${BASE_URL}/${t ? "zh/" : ""}tools/case-size-calculator/`,
      }),
    ],
  })
  + renderHeader({ lang, currentPath: "/tools/case-size-calculator/" })
  + html
  + renderCTA({ lang })
  + renderFooter({ lang });
}

export const caseSizeCalculatorClientJS = `
(function() {
  var btn = document.getElementById('sizeCalcBtn');
  var result = document.getElementById('sizeResult');
  if (!btn || !result) return;
  btn.addEventListener('click', function() {
    var L = parseFloat(document.querySelector('#sizeForm [name=length]').value);
    var W = parseFloat(document.querySelector('#sizeForm [name=width]').value);
    var H = parseFloat(document.querySelector('#sizeForm [name=height]').value);
    var pad = parseFloat(document.querySelector('#sizeForm [name=padding]').value);
    var clr = parseFloat(document.querySelector('#sizeForm [name=clearance]').value);
    if (!L || !W || !H) {
      var t = (document.documentElement.lang || 'en').toLowerCase().startsWith('zh') ? '请输入完整尺寸' : 'Please enter all dimensions';
      result.style.display = 'block';
      result.innerHTML = '<p style="color:var(--color-danger);font-weight:600;">' + t + '</p>';
      return;
    }
    var innerL = L + 2*pad + 2*clr;
    var innerW = W + 2*pad + 2*clr;
    var innerH = H + 2*pad + 2*clr;
    // Recommend SKU bucket
    var maxDim = Math.max(innerL, innerW, innerH);
    var sku;
    if (maxDim < 250) sku = 'S';
    else if (maxDim < 400) sku = 'M';
    else if (maxDim < 600) sku = 'L';
    else if (maxDim < 800) sku = 'XL';
    else if (maxDim < 1100) sku = 'XXL';
    else sku = 'XXXL (custom)';
    var isZh = (document.documentElement.lang || 'en').toLowerCase().startsWith('zh');
    result.style.display = 'block';
    result.innerHTML =
      '<h3 style="font-size:1.5rem;font-weight:800;color:var(--color-accent);margin-bottom:0.5rem;">' +
        (isZh ? '推荐 SKU：' : 'Recommended SKU: ') + sku +
      '</h3>' +
      '<p style="font-size:1.125rem;font-weight:500;margin-bottom:1rem;">' +
        (isZh ? '最小内部尺寸：' : 'Min internal dimensions: ') +
        Math.ceil(innerL) + ' × ' + Math.ceil(innerW) + ' × ' + Math.ceil(innerH) + ' mm' +
      '</p>' +
      '<p style="color:var(--color-text-muted);font-size:0.875rem;margin-bottom:1rem;">' +
        (isZh
          ? '设备 ' + L + '×' + W + '×' + H + ' mm + 单边泡棉 ' + pad + 'mm + 间隙 ' + clr + 'mm = 内部 ' + Math.ceil(innerL) + '×' + Math.ceil(innerW) + '×' + Math.ceil(innerH) + ' mm'
          : 'Equipment ' + L + '×' + W + '×' + H + ' mm + ' + pad + 'mm foam + ' + clr + 'mm clearance = ' + Math.ceil(innerL) + '×' + Math.ceil(innerW) + '×' + Math.ceil(innerH) + ' mm internal') +
      '</p>' +
      '<a href="/' + (isZh ? 'zh/' : '') + 'oem/" class="btn cta-orange">' +
        (isZh ? '获取定制报价 →' : 'Get Custom Quote →') +
      '</a>';
    result.scrollIntoView({behavior:'smooth', block:'center'});
  });
})();
`;
