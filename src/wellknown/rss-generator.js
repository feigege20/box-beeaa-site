/**
 * RSS Feed Generator — 给 S 级 270 个 guides + 9 品类 + 4 商业意图 + 8 市场
 */
import { siteConfig } from "../lib/site.config.js";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function escapeXml(s) {
  return String(s).replace(/[<>&'"]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]));
}

export async function generateRssFeed(lang = "en", outputPath = null) {
  const t = lang === "zh";
  const base = siteConfig.protocol + "://" + siteConfig.domain;
  const langPrefix = t ? "/zh" : "";

  // 收集 S 级 guides + 9 品类 + 4 intent + 8 市场 + 5 tools
  const items = [];

  // 1. 9 品类
  for (const p of siteConfig.productLines) {
    items.push({
      title: t ? p.name_zh : p.name_en,
      url: `${base}${langPrefix}/${p.slug}/`,
      description: t ? p.desc_zh : p.desc_en,
      category: "Product Line",
      pubDate: "2026-07-31T00:00:00Z",
    });
  }

  // 2. 4 商业意图
  for (const i of siteConfig.commercialIntents) {
    items.push({
      title: t ? i.name_zh : i.name_en,
      url: `${base}${langPrefix}/${i.slug}/`,
      description: t ? i.desc_zh : i.desc_en,
      category: "Service",
      pubDate: "2026-07-31T00:00:00Z",
    });
  }

  // 3. 8 市场
  for (const m of siteConfig.markets) {
    items.push({
      title: t ? m.name_zh : m.name_en,
      url: `${base}${langPrefix}/markets/${m.slug}/`,
      description: t ? m.name_zh : m.name_en,
      category: "Market",
      pubDate: "2026-07-31T00:00:00Z",
    });
  }

  // 4. 5 tools
  for (const tool of siteConfig.tools) {
    items.push({
      title: t ? tool.zh : tool.en,
      url: `${base}${langPrefix}/tools/${tool.slug}/`,
      description: t ? tool.desc_zh : tool.desc_en,
      category: "Tool",
      pubDate: "2026-07-31T00:00:00Z",
    });
  }

  // 5. S 级 guides (if available)
  try {
    const headTerms = await fs.readFile(path.join(ROOT, "data/keywords_S_with_slug.json"), "utf-8");
    const head = JSON.parse(headTerms);
    for (const h of head.slice(0, 30)) {
      items.push({
        title: t ? h.zh : h.en,
        url: `${base}${langPrefix}/guides/${h.slug}/`,
        description: (t ? h.zh : h.en) + " — KeXinMaterials industry guide",
        category: "Guide",
        pubDate: "2026-07-31T00:00:00Z",
      });
    }
  } catch (e) {
    // head terms not found
  }

  // 6. 8 entities
  for (const ent of siteConfig.entities) {
    items.push({
      title: t ? ent.name_zh : ent.name_en,
      url: `${base}${langPrefix}/entities/${ent.slug}/`,
      description: t ? ent.name_zh : ent.name_en,
      category: "Entity",
      pubDate: "2026-07-31T00:00:00Z",
    });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
<channel>
  <title>${escapeXml(t ? "客信新材料 防护箱行业资讯" : "KeXinMaterials Protective Case Industry News")}</title>
  <link>${base}${langPrefix}/</link>
  <description>${escapeXml(t ? "B2B 出口工厂 | 9 大产品线 | 32,308 关键词 | OEM/ODM 全球供货" : "B2B Source Factory | 9 Product Lines | 32,308 Keywords | OEM/ODM Global Supply")}</description>
  <language>${t ? "zh-cn" : "en-us"}</language>
  <atom:link href="${base}${langPrefix}/rss.xml" rel="self" type="application/rss+xml" />
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  <generator>KeXinMaterials Custom Generator</generator>
${items.map(item => `  <item>
    <title>${escapeXml(item.title)}</title>
    <link>${item.url}</link>
    <description>${escapeXml(item.description)}</description>
    <category>${escapeXml(item.category)}</category>
    <pubDate>${item.pubDate}</pubDate>
    <guid isPermaLink="true">${item.url}</guid>
  </item>`).join("\n")}
</channel>
</rss>`;

  if (outputPath) {
    await fs.writeFile(outputPath, xml, "utf-8");
    console.log(`[GEN] RSS feed: ${outputPath} (${items.length} items)`);
  }
  return xml;
}
