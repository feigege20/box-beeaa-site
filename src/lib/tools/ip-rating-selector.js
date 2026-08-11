/**
 * IP Rating Selector Tool
 * 交互式选择器: 用户输入 4 个条件 (water exposure / dust / impact / temperature) → 输出推荐 IP 等级
 */
import { siteConfig } from "../site.config.js";
import { renderHead, renderHeader, renderFooter, renderCTA } from "../layout.js";
import { webSiteSchema, softwareApplicationSchema } from "../schemas.js";

const BASE_URL = `${siteConfig.protocol}://${siteConfig.domain}`;

const IP_LEVELS = [
  { code: "IP54", dust: 5, water: 4, desc_en: "Dust-protected + splashing water", desc_zh: "防尘 + 溅水" },
  { code: "IP55", dust: 5, water: 5, desc_en: "Dust-protected + water jets", desc_zh: "防尘 + 喷水" },
  { code: "IP65", dust: 6, water: 5, desc_en: "Dust-tight + water jets", desc_zh: "完全防尘 + 喷水" },
  { code: "IP66", dust: 6, water: 6, desc_en: "Dust-tight + powerful water jets", desc_zh: "完全防尘 + 强力喷水" },
  { code: "IP67", dust: 6, water: 7, desc_en: "Dust-tight + temporary immersion (1m/30min)", desc_zh: "完全防尘 + 短时浸水（1 米/30 分钟）" },
  { code: "IP68", dust: 6, water: 8, desc_en: "Dust-tight + continuous immersion", desc_zh: "完全防尘 + 持续浸水" },
];

const QUESTIONS = [
  {
    id: "dust",
    label_en: "Dust exposure level",
    label_zh: "粉尘暴露等级",
    options: [
      { v: 0, e: "None / Clean indoor", z: "无 / 洁净室内" },
      { v: 1, e: "Light dust (workshop)", z: "轻微粉尘（车间）" },
      { v: 2, e: "Heavy dust (construction)", z: "重度粉尘（工地）" },
      { v: 3, e: "Fine particles (mining)", z: "细微颗粒（矿场）" },
    ],
  },
  {
    id: "water",
    label_en: "Water exposure",
    label_zh: "水暴露",
    options: [
      { v: 0, e: "None", z: "无" },
      { v: 1, e: "Dripping / splashes", z: "滴落 / 飞溅" },
      { v: 2, e: "Rain / light spray", z: "雨水 / 轻度喷淋" },
      { v: 3, e: "Water jets", z: "高压水枪" },
      { v: 4, e: "Temporary immersion (≤1m, ≤30min)", z: "短时浸没（≤1 米, ≤30 分钟）" },
      { v: 5, e: "Continuous submersion (>1m, >30min)", z: "持续浸没（>1 米, >30 分钟）" },
    ],
  },
  {
    id: "impact",
    label_en: "Impact / drop risk",
    label_zh: "冲击 / 跌落风险",
    options: [
      { v: 0, e: "None", z: "无" },
      { v: 1, e: "Light (1m drop)", z: "轻度（1 米跌落）" },
      { v: 2, e: "Medium (2m drop)", z: "中度（2 米跌落）" },
      { v: 3, e: "Heavy (MIL-SPEC 1.2m 26x)", z: "重度（军规 1.2 米 26 次）" },
    ],
  },
  {
    id: "temp",
    label_en: "Temperature range",
    label_zh: "温度范围",
    options: [
      { v: 0, e: "Indoor (0–40°C)", z: "室内（0-40°C）" },
      { v: 1, e: "Outdoor (-20–60°C)", z: "户外（-20-60°C）" },
      { v: 2, e: "Extreme (-40–85°C)", z: "极寒/极热（-40-85°C）" },
    ],
  },
];

function recommendIP(answers) {
  const minDust = Math.max(1, Math.ceil(answers.dust * 2) + 4); // map 0-3 to IP level 4-6
  const minWater = answers.water + 4; // 0-5 to 4-9
  return IP_LEVELS.find(l => l.dust >= minDust && l.water >= minWater) || IP_LEVELS[IP_LEVELS.length - 1];
}

export function renderIPRatingSelector({ lang = "en" } = {}) {
  const t = lang === "zh";

  const html = `
<section class="hero" style="padding:3rem 0 2rem;">
  <div class="container">
    <h1 style="font-size:clamp(2rem,5vw,3rem);font-weight:800;margin-bottom:1rem;">
      ${t ? "IP 防护等级选择器" : "IP Rating Selector"}
    </h1>
    <p style="font-size:1.125rem;color:var(--color-text-muted);max-width:720px;">
      ${t
        ? "4 个简单问题，10 秒内为你推荐合适的 IP 防护等级（IP54 / IP65 / IP67 / IP68）。所有推荐基于 IEC 60529 国际标准。"
        : "4 simple questions. In 10 seconds, find the right IP rating (IP54 / IP65 / IP67 / IP68) for your application. Recommendations based on IEC 60529 international standard."}
    </p>
  </div>
</section>

<section style="padding:2rem 0 4rem;">
  <div class="container">
    <div class="card card-elevated" style="max-width:720px;margin:0 auto;padding:2rem;">
      <form id="ipForm" onsubmit="return false;">
        ${QUESTIONS.map((q, qi) => `
          <div class="form-group" style="margin-bottom:2rem;">
            <label style="font-weight:600;font-size:1.125rem;display:block;margin-bottom:0.75rem;">
              ${qi + 1}. ${t ? q.label_zh : q.label_en}
            </label>
            <select name="${q.id}" class="form-select" data-q="${q.id}" style="width:100%;padding:0.75rem;font-size:1rem;border:1px solid var(--color-border);border-radius:var(--radius);">
              <option value="">-- ${t ? "请选择" : "Select"} --</option>
              ${q.options.map(o => `<option value="${o.v}">${t ? o.z : o.e}</option>`).join("")}
            </select>
          </div>
        `).join("")}

        <button type="button" id="ipRecommendBtn" class="btn btn-lg cta-orange" style="width:100%;margin-top:1rem;">
          ${t ? "🔍 推荐 IP 等级" : "🔍 Recommend IP Rating"}
        </button>
      </form>

      <div id="ipResult" style="display:none;margin-top:2rem;padding:1.5rem;background:var(--color-accent-soft);border-radius:var(--radius-lg);border:2px solid var(--color-accent);"></div>
    </div>

    <div style="margin-top:3rem;max-width:720px;margin-left:auto;margin-right:auto;">
      <h2 style="font-size:1.5rem;font-weight:700;margin-bottom:1rem;">
        ${t ? "IP 等级参考表" : "IP Rating Reference Table"}
      </h2>
      <div style="overflow-x:auto;">
        <table class="params-table" style="width:100%;">
          <thead>
            <tr>
              <th>IP ${t ? "等级" : "Code"}</th>
              <th>${t ? "防尘" : "Dust"}</th>
              <th>${t ? "防水" : "Water"}</th>
              <th>${t ? "说明" : "Description"}</th>
            </tr>
          </thead>
          <tbody>
            ${IP_LEVELS.map(l => `
              <tr>
                <td><strong>${l.code}</strong></td>
                <td>${l.dust} ${t ? "级" : ""}</td>
                <td>${l.water} ${t ? "级" : ""}</td>
                <td>${t ? l.desc_zh : l.desc_en}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</section>

<section style="padding:3rem 0;background:var(--color-bg-alt);">
  <div class="container" style="max-width:720px;">
    <h2 style="font-size:1.5rem;font-weight:700;margin-bottom:1rem;">
      ${t ? "客信 IP67 防护箱推荐" : "KeXinMaterials IP67 Protective Cases"}
    </h2>
    <p style="color:var(--color-text-muted);margin-bottom:1.5rem;">
      ${t
        ? "8 系防护箱通过 IEC 60529 IP67 认证（防尘 6 级 + 防水 7 级），承重 150kg，工作温度 -40°C ~ 85°C。MOQ 100 件，12 小时报价，30 天交付。"
        : "Series 8 cases are IEC 60529 IP67 certified (dust level 6 + water level 7), 150kg load, -40°C to 85°C operating. MOQ 100 pcs, 12h quote, 30-day delivery."}
    </p>
    <a href="/${t ? "zh/" : ""}waterproof-case/" class="btn cta-orange">
      ${t ? "查看 IP67 防护箱" : "View IP67 Cases"} →
    </a>
  </div>
</section>
`;

  return renderHead({
    title: t ? "IP 防护等级选择器 | KeXinMaterials 客信新材料" : "IP Rating Selector | KeXinMaterials Protective Cases",
    description: t
      ? "4 问选择器，10 秒推荐 IP54 / IP65 / IP67 / IP68。基于 IEC 60529 标准。客信新材料 8 系 IP67 防护箱源头工厂。"
      : "4-question selector finds your IP54 / IP65 / IP67 / IP68 in 10 seconds. Based on IEC 60529. KeXinMaterials Series 8 IP67 cases source factory.",
    keywords: "IP rating selector, IP67, IP68, IEC 60529, protective case, 防护等级选择器, 客信新材料",
    canonical: `${BASE_URL}/${t ? "zh/" : ""}tools/ip-rating-selector/`,
    lang,
    theme: "drone",
    schemas: [
      webSiteSchema(),
      softwareApplicationSchema({
        name: t ? "IP 防护等级选择器" : "IP Rating Selector",
        description: t
          ? "4 问题选择器推荐合适的 IP 防护等级"
          : "4-question selector for IP rating recommendation",
        url: `${BASE_URL}/${t ? "zh/" : ""}tools/ip-rating-selector/`,
      }),
    ],
  })
  + renderHeader({ lang, currentPath: "/tools/ip-rating-selector/" })
  + html
  + renderCTA({ lang })
  + renderFooter({ lang });
}

// Client-side JS injected separately
export const ipRatingSelectorClientJS = `
(function() {
  var btn = document.getElementById('ipRecommendBtn');
  var result = document.getElementById('ipResult');
  if (!btn || !result) return;
  btn.addEventListener('click', function() {
    var selects = document.querySelectorAll('#ipForm select[data-q]');
    var answers = {};
    var missing = [];
    selects.forEach(function(s) {
      if (s.value === '') {
        missing.push(s.getAttribute('data-q'));
      } else {
        answers[s.getAttribute('data-q')] = parseInt(s.value, 10);
      }
    });
    if (missing.length > 0) {
      var t = (document.documentElement.lang || 'en').toLowerCase().startsWith('zh') ? '请回答所有问题' : 'Please answer all questions';
      result.style.display = 'block';
      result.innerHTML = '<p style="color:var(--color-danger);font-weight:600;">' + t + '</p>';
      return;
    }
    var minDust = Math.max(1, Math.ceil(answers.dust * 2) + 4);
    var minWater = answers.water + 4;
    var levels = [
      {code:'IP54',dust:5,water:4,en:'Dust-protected + splashing water',zh:'防尘 + 溅水'},
      {code:'IP55',dust:5,water:5,en:'Dust-protected + water jets',zh:'防尘 + 喷水'},
      {code:'IP65',dust:6,water:5,en:'Dust-tight + water jets',zh:'完全防尘 + 喷水'},
      {code:'IP66',dust:6,water:6,en:'Dust-tight + powerful water jets',zh:'完全防尘 + 强力喷水'},
      {code:'IP67',dust:6,water:7,en:'Dust-tight + temporary immersion (1m/30min)',zh:'完全防尘 + 短时浸水'},
      {code:'IP68',dust:6,water:8,en:'Dust-tight + continuous immersion',zh:'完全防尘 + 持续浸水'}
    ];
    var rec = levels.find(function(l){ return l.dust >= minDust && l.water >= minWater; }) || levels[levels.length-1];
    var isZh = (document.documentElement.lang || 'en').toLowerCase().startsWith('zh');
    result.style.display = 'block';
    result.innerHTML =
      '<h3 style="font-size:1.5rem;font-weight:800;color:var(--color-accent);margin-bottom:0.5rem;">' + rec.code + '</h3>' +
      '<p style="font-size:1.125rem;font-weight:500;margin-bottom:1rem;">' + (isZh ? rec.zh : rec.en) + '</p>' +
      '<p style="color:var(--color-text-muted);font-size:0.875rem;margin-bottom:1rem;">' +
        (isZh
          ? '基于 IEC 60529 标准 — 粉尘 ' + rec.dust + ' 级 / 水 ' + rec.water + ' 级'
          : 'Per IEC 60529 — dust ' + rec.dust + ' / water ' + rec.water) +
      '</p>' +
      '<a href="/' + (isZh ? 'zh/' : '') + 'waterproof-case/" class="btn cta-orange">' +
        (isZh ? '查看 IP67 防护箱 →' : 'View IP67 Cases →') +
      '</a>';
    result.scrollIntoView({behavior:'smooth', block:'center'});
  });
})();
`;
