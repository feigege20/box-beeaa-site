/**
 * Material Comparator Tool
 * PP vs ABS vs PC 三大防护箱材料对比
 */
import { siteConfig } from "../site.config.js";
import { renderHead, renderHeader, renderFooter, renderCTA } from "../layout.js";
import { webSiteSchema, softwareApplicationSchema } from "../schemas.js";

const BASE_URL = `${siteConfig.protocol}://${siteConfig.domain}`;

const MATERIALS = [
  {
    code: "PP",
    name_en: "PP (Polypropylene)",
    name_zh: "PP 聚丙烯",
    density: "0.91 g/cm³",
    impact: "8-10 kJ/m²",
    temp: "-20 to 100°C",
    cost: 1.0,
    chem: "★★★★★",
    uv: "★★★",
    food: "Yes (FDA)",
    recycling: "100%",
    best_en: "Medical, food, chemical resistance",
    best_zh: "医疗、食品、耐化学",
    color: "#3B82F6",
  },
  {
    code: "ABS",
    name_en: "ABS (Acrylonitrile Butadiene Styrene)",
    name_zh: "ABS 丙烯腈-丁二烯-苯乙烯",
    density: "1.04 g/cm³",
    impact: "15-20 kJ/m²",
    temp: "-20 to 80°C",
    cost: 1.2,
    chem: "★★★",
    uv: "★★",
    food: "No",
    recycling: "100%",
    best_en: "General purpose, OEM customization",
    best_zh: "通用、OEM 定制",
    color: "#EF4444",
  },
  {
    code: "PC",
    name_en: "PC (Polycarbonate)",
    name_zh: "PC 聚碳酸酯",
    density: "1.20 g/cm³",
    impact: "60-80 kJ/m² (high)",
    temp: "-40 to 120°C",
    cost: 1.8,
    chem: "★★",
    uv: "★★★★",
    food: "Conditional",
    recycling: "100%",
    best_en: "High impact, military, transparent",
    best_zh: "高抗冲、军规、透明",
    color: "#10B981",
  },
];

export function renderMaterialComparator({ lang = "en" } = {}) {
  const t = lang === "zh";

  const html = `
<section class="hero" style="padding:3rem 0 2rem;">
  <div class="container">
    <h1 style="font-size:clamp(2rem,5vw,3rem);font-weight:800;margin-bottom:1rem;">
      ${t ? "PP vs ABS vs PC 材料对比器" : "PP vs ABS vs PC Material Comparator"}
    </h1>
    <p style="font-size:1.125rem;color:var(--color-text-muted);max-width:720px;">
      ${t
        ? "对比防护箱三大工程塑料的密度、抗冲、温度、成本、化学耐性、UV 耐性。帮你选最适合应用的材料。"
        : "Compare 3 main engineering plastics for protective cases: density, impact, temperature, cost, chemical resistance, UV resistance."}
    </p>
  </div>
</section>

<section style="padding:2rem 0 4rem;">
  <div class="container">
    <div class="card-grid" style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;max-width:1100px;margin:0 auto;">
      ${MATERIALS.map(m => `
        <div class="card card-feature" style="border-top:6px solid ${m.color};">
          <div class="card-body">
            <h3 style="color:${m.color};font-size:1.75rem;font-weight:800;margin-bottom:0.5rem;">${m.code}</h3>
            <p style="color:var(--color-text-muted);font-size:0.875rem;margin-bottom:1.5rem;">${t ? m.name_zh : m.name_en}</p>

            <table class="params-table" style="width:100%;font-size:0.875rem;">
              <tr><td><strong>${t ? "密度" : "Density"}</strong></td><td>${m.density}</td></tr>
              <tr><td><strong>${t ? "抗冲强度" : "Impact"}</strong></td><td>${m.impact}</td></tr>
              <tr><td><strong>${t ? "耐温" : "Temp range"}</strong></td><td>${m.temp}</td></tr>
              <tr><td><strong>${t ? "成本倍数" : "Cost factor"}</strong></td><td>${m.cost.toFixed(1)}×</td></tr>
              <tr><td><strong>${t ? "耐化学" : "Chemical"}</strong></td><td>${m.chem}</td></tr>
              <tr><td><strong>${t ? "UV 耐性" : "UV"}</strong></td><td>${m.uv}</td></tr>
              <tr><td><strong>${t ? "食品级" : "Food-safe"}</strong></td><td>${m.food}</td></tr>
              <tr><td><strong>${t ? "可回收" : "Recyclable"}</strong></td><td>${m.recycling}</td></tr>
            </table>

            <p style="margin-top:1rem;padding:0.75rem;background:var(--color-bg-alt);border-radius:var(--radius);font-size:0.875rem;">
              <strong>${t ? "最佳应用" : "Best for"}：</strong>${t ? m.best_zh : m.best_en}
            </p>

            <a href="mailto:${siteConfig.contact.email}?subject=${encodeURIComponent((t ? "材料咨询: " : "Material inquiry: ") + m.code)}" class="btn cta-orange" style="width:100%;margin-top:1rem;">
              ${t ? "询问 " : "Inquire "}${m.code} ${t ? "报价" : "Quote"} →
            </a>
          </div>
        </div>
      `).join("")}
    </div>

    <div style="max-width:1100px;margin:3rem auto 0;">
      <h2 style="font-size:1.5rem;font-weight:700;margin-bottom:1rem;">${t ? "客信推荐" : "KeXinMaterials Recommendation"}</h2>
      <p style="color:var(--color-text-muted);">
        ${t
          ? "客信 8 系防护箱默认 ABS 材质（性价比最高）。可定制 PP（医疗/食品）或 PC（军规高抗冲）。MOQ 100 件起，材料差价仅 10-30%。"
          : "KeXinMaterials Series 8 defaults to ABS (best value). Custom PP (medical/food) or PC (MIL-SPEC high impact) available. MOQ 100 pcs, material cost difference only 10-30%."}
      </p>
    </div>
  </div>
</section>
`;

  return renderHead({
    title: t ? "PP vs ABS vs PC 材料对比器 | 客信新材料" : "PP vs ABS vs PC Material Comparator | KeXinMaterials",
    description: t
      ? "对比防护箱 3 大工程塑料（PP / ABS / PC）：密度、抗冲、耐温、成本、化学耐性。"
      : "Compare 3 engineering plastics for protective cases: density, impact, temperature, cost, chemical resistance.",
    keywords: "PP, ABS, PC, material comparison, engineering plastic, protective case material, 工程塑料对比",
    canonical: `${BASE_URL}/${t ? "zh/" : ""}tools/material-comparator/`,
    lang,
    theme: "engineering-plastic",
    schemas: [
      webSiteSchema(),
      softwareApplicationSchema({
        name: t ? "材料对比器" : "Material Comparator",
        description: t ? "PP/ABS/PC 工程塑料对比" : "Compare PP/ABS/PC engineering plastics",
        url: `${BASE_URL}/${t ? "zh/" : ""}tools/material-comparator/`,
      }),
    ],
  })
  + renderHeader({ lang, currentPath: "/tools/material-comparator/" })
  + html
  + renderCTA({ lang })
  + renderFooter({ lang });
}
