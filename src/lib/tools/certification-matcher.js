/**
 * Certification Matcher Tool
 * 输入目标市场 → 输出所需认证 + 客信已有哪些 + 缺哪些
 */
import { siteConfig } from "../site.config.js";
import { renderHead, renderHeader, renderFooter, renderCTA } from "../layout.js";
import { webSiteSchema, softwareApplicationSchema } from "../schemas.js";

const BASE_URL = `${siteConfig.protocol}://${siteConfig.domain}`;

const MARKETS = [
  {
    code: "US",
    name_en: "United States",
    name_zh: "美国",
    flag: "🇺🇸",
    required: [
      { code: "FCC", name_en: "FCC (EMC)", name_zh: "FCC 电磁兼容", cost: "$800-1500", days: 14, mandatory: true },
      { code: "CA65", name_en: "California Prop 65", name_zh: "加州 65 号提案", cost: "$600-1200", days: 14, mandatory: true },
      { code: "UL", name_en: "UL (optional)", name_zh: "UL 安全认证（可选）", cost: "$2000-5000", days: 30, mandatory: false },
    ],
  },
  {
    code: "EU",
    name_en: "European Union",
    name_zh: "欧盟",
    flag: "🇪🇺",
    required: [
      { code: "CE", name_en: "CE Marking (LVD + EMC)", name_zh: "CE 认证（LVD + EMC）", cost: "$800-1500", days: 14, mandatory: true },
      { code: "ROHS", name_en: "ROHS 2.0", name_zh: "ROHS 2.0", cost: "$500-1000", days: 10, mandatory: true },
      { code: "REACH", name_en: "REACH SVHC", name_zh: "REACH SVHC", cost: "$400-800", days: 14, mandatory: true },
    ],
  },
  {
    code: "JP",
    name_en: "Japan",
    name_zh: "日本",
    flag: "🇯🇵",
    required: [
      { code: "PSE", name_en: "PSE Mark", name_zh: "PSE 认证", cost: "$1500-3000", days: 30, mandatory: true },
      { code: "TELEC", name_en: "TELEC (if wireless)", name_zh: "TELEC 无线认证（如含无线）", cost: "$2000-4000", days: 30, mandatory: false },
    ],
  },
  {
    code: "AU",
    name_en: "Australia",
    name_zh: "澳大利亚",
    flag: "🇦🇺",
    required: [
      { code: "RCM", name_en: "RCM (SAA + ACMA)", name_zh: "RCM 认证", cost: "$1500-2500", days: 21, mandatory: true },
    ],
  },
  {
    code: "RU",
    name_en: "Russia",
    name_zh: "俄罗斯",
    flag: "🇷🇺",
    required: [
      { code: "EAC", name_en: "EAC / GOST-R", name_zh: "EAC / GOST-R 认证", cost: "$2000-4000", days: 30, mandatory: true },
    ],
  },
  {
    code: "IN",
    name_en: "India",
    name_zh: "印度",
    flag: "🇮🇳",
    required: [
      { code: "BIS", name_en: "BIS (Bureau of Indian Standards)", name_zh: "BIS 印度标准", cost: "$1500-3000", days: 30, mandatory: true },
      { code: "WPC", name_en: "WPC (if wireless)", name_zh: "WPC 无线认证", cost: "$800-1500", days: 21, mandatory: false },
    ],
  },
];

const KEXIN_HAVE = ["ISO9001", "ROHS", "CE", "SGS", "IP67", "CA65"]; // we have these

export function renderCertificationMatcher({ lang = "en" } = {}) {
  const t = lang === "zh";

  const html = `
<section class="hero" style="padding:3rem 0 2rem;">
  <div class="container">
    <h1 style="font-size:clamp(2rem,5vw,3rem);font-weight:800;margin-bottom:1rem;">
      ${t ? "认证匹配器" : "Certification Matcher"}
    </h1>
    <p style="font-size:1.125rem;color:var(--color-text-muted);max-width:720px;">
      ${t
        ? "选择目标市场，自动列出所需认证 + 客信已有哪些 + 还需补哪些。"
        : "Select your target market. Get required certifications + which KeXinMaterials already has + what's missing."}
    </p>
  </div>
</section>

<section style="padding:2rem 0 4rem;">
  <div class="container">
    <div class="card card-elevated" style="max-width:720px;margin:0 auto;padding:2rem;">
      <form id="certForm" onsubmit="return false;">
        <div class="form-group" style="margin-bottom:1.5rem;">
          <label style="font-weight:600;font-size:1.125rem;display:block;margin-bottom:0.5rem;">
            ${t ? "目标市场" : "Target Market"}
          </label>
          <select name="market" style="width:100%;padding:0.75rem;font-size:1rem;border:1px solid var(--color-border);border-radius:var(--radius);">
            ${MARKETS.map(m => `<option value="${m.code}">${m.flag} ${t ? m.name_zh : m.name_en}</option>`).join("")}
          </select>
        </div>

        <button type="button" id="certMatchBtn" class="btn btn-lg cta-orange" style="width:100%;margin-top:1rem;">
          ${t ? "🎯 查看所需认证" : "🎯 See Required Certifications"}
        </button>
      </form>

      <div id="certResult" style="display:none;margin-top:2rem;"></div>
    </div>

    <div style="margin-top:3rem;max-width:720px;margin-left:auto;margin-right:auto;">
      <h2 style="font-size:1.5rem;font-weight:700;margin-bottom:1rem;">${t ? "客信已持有的认证" : "KeXinMaterials Existing Certifications"}</h2>
      <div style="display:flex;flex-wrap:wrap;gap:0.5rem;">
        ${KEXIN_HAVE.map(c => `<span class="badge" style="padding:0.5rem 1rem;background:var(--color-success);color:#FFFFFF;border-radius:var(--radius-full);font-weight:600;">${c} ✓</span>`).join("")}
      </div>
    </div>
  </div>
</section>
`;

  return renderHead({
    title: t ? "认证匹配器 | 客信新材料" : "Certification Matcher | KeXinMaterials",
    description: t
      ? "选择目标市场，自动列出所需认证（CE / ROHS / FCC / PSE / EAC / BIS 等）+ 客信已有哪些 + 缺哪些。"
      : "Select target market. Get required certs (CE/ROHS/FCC/PSE/EAC/BIS) + which KeXinMaterials has + missing.",
    keywords: "certification, CE, ROHS, FCC, MIL-SPEC, IP67, certification matcher, 认证匹配",
    canonical: `${BASE_URL}/${t ? "zh/" : ""}tools/certification-matcher/`,
    lang,
    theme: "military-tactical",
    schemas: [
      webSiteSchema(),
      softwareApplicationSchema({
        name: t ? "认证匹配器" : "Certification Matcher",
        description: t ? "按目标市场匹配所需认证" : "Match required certifications to target market",
        url: `${BASE_URL}/${t ? "zh/" : ""}tools/certification-matcher/`,
      }),
    ],
  })
  + renderHeader({ lang, currentPath: "/tools/certification-matcher/" })
  + html
  + renderCTA({ lang })
  + renderFooter({ lang });
}

export const certificationMatcherClientJS = `
(function() {
  var btn = document.getElementById('certMatchBtn');
  var result = document.getElementById('certResult');
  if (!btn || !result) return;
  var MARKETS = {
    US: {en:'United States', zh:'美国', flag:'🇺🇸', certs: [
      {code:'FCC', en:'FCC (EMC)', zh:'FCC 电磁兼容', cost:'$800-1500', days:14, req:true},
      {code:'CA65', en:'California Prop 65', zh:'加州 65 号提案', cost:'$600-1200', days:14, req:true},
      {code:'UL', en:'UL (optional)', zh:'UL 安全认证（可选）', cost:'$2000-5000', days:30, req:false}
    ]},
    EU: {en:'European Union', zh:'欧盟', flag:'🇪🇺', certs: [
      {code:'CE', en:'CE Marking', zh:'CE 认证', cost:'$800-1500', days:14, req:true},
      {code:'ROHS', en:'ROHS 2.0', zh:'ROHS 2.0', cost:'$500-1000', days:10, req:true},
      {code:'REACH', en:'REACH SVHC', zh:'REACH SVHC', cost:'$400-800', days:14, req:true}
    ]},
    JP: {en:'Japan', zh:'日本', flag:'🇯🇵', certs: [
      {code:'PSE', en:'PSE Mark', zh:'PSE 认证', cost:'$1500-3000', days:30, req:true}
    ]},
    AU: {en:'Australia', zh:'澳大利亚', flag:'🇦🇺', certs: [
      {code:'RCM', en:'RCM (SAA + ACMA)', zh:'RCM 认证', cost:'$1500-2500', days:21, req:true}
    ]},
    RU: {en:'Russia', zh:'俄罗斯', flag:'🇷🇺', certs: [
      {code:'EAC', en:'EAC / GOST-R', zh:'EAC / GOST-R', cost:'$2000-4000', days:30, req:true}
    ]},
    IN: {en:'India', zh:'印度', flag:'🇮🇳', certs: [
      {code:'BIS', en:'BIS', zh:'BIS 印度标准', cost:'$1500-3000', days:30, req:true}
    ]}
  };
  var HAVE = ['ISO9001','ROHS','CE','SGS','IP67','CA65'];
  btn.addEventListener('click', function() {
    var code = document.querySelector('#certForm [name=market]').value;
    var market = MARKETS[code];
    var isZh = (document.documentElement.lang || 'en').toLowerCase().startsWith('zh');
    var rows = market.certs.map(function(c) {
      var have = HAVE.indexOf(c.code) >= 0;
      var badge = have
        ? '<span style="color:var(--color-success);font-weight:700;">✓ ' + (isZh ? '已有' : 'Have') + '</span>'
        : '<span style="color:var(--color-danger);font-weight:700;">✗ ' + (isZh ? '需补' : 'Need') + '</span>';
      var reqLabel = c.req ? ('<strong style="color:var(--color-danger);">' + (isZh ? '必须' : 'Required') + '</strong>') : ('<span style="color:var(--color-text-muted);">' + (isZh ? '可选' : 'Optional') + '</span>');
      return '<tr><td>' + reqLabel + '</td><td><strong>' + c.code + '</strong> ' + (isZh ? c.zh : c.en) + '</td><td>' + c.cost + '</td><td>' + c.days + ' ' + (isZh ? '天' : 'days') + '</td><td>' + badge + '</td></tr>';
    }).join('');
    var totalCost = market.certs.filter(function(c){ return HAVE.indexOf(c.code) < 0; }).reduce(function(s, c){
      var m = c.cost.match(/\\$([0-9]+)-([0-9]+)/);
      return s + (m ? (parseInt(m[1],10)+parseInt(m[2],10))/2 : 0);
    }, 0);
    result.style.display = 'block';
    result.innerHTML =
      '<h3 style="font-size:1.5rem;font-weight:800;color:var(--color-accent);margin-bottom:0.5rem;">' + market.flag + ' ' + (isZh ? market.zh : market.en) + '</h3>' +
      '<p style="color:var(--color-text-muted);margin-bottom:1rem;">' + (isZh ? '客信已持有：' : 'Already have: ') + HAVE.join(', ') + '</p>' +
      '<table class="params-table" style="width:100%;"><thead><tr><th>' + (isZh ? '类别' : 'Type') + '</th><th>' + (isZh ? '认证' : 'Cert') + '</th><th>' + (isZh ? '费用' : 'Cost') + '</th><th>' + (isZh ? '周期' : 'Days') + '</th><th>' + (isZh ? '状态' : 'Status') + '</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<p style="margin-top:1rem;font-weight:600;">' + (isZh ? '需补费用估算：$' : 'Missing cost: $') + Math.round(totalCost).toLocaleString() + ' ' + (isZh ? '(不含可选)' : '(excluding optional)') + '</p>' +
      '<a href="mailto:${siteConfig.contact.email}".replace("@", "%40") + "?subject=" + encodeURIComponent((isZh ? "认证咨询" : "Certification inquiry") + " - " + (isZh ? market.zh : market.en)) + "" class="btn cta-orange" style="margin-top:1rem;">' +
        (isZh ? '📧 认证咨询' : '📧 Ask About Certs') +
      '</a>';
    result.scrollIntoView({behavior:'smooth', block:'center'});
  });
})();
`;
