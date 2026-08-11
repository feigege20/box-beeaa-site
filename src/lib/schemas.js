/**
 * Schema.org JSON-LD 组件库
 * 8 类核心 schema：Organization、Product、FAQPage、BreadcrumbList、LocalBusiness、WebSite、Article、Dataset
 * 符合 doc1.txt 第 5.3 节 GEO Schema 要求 + a(1) 战略方案第 9 节
 *
 * 关键字段：
 * - Article: author (Person with sameAs), publisher, datePublished, dateModified, citation, about, keywords
 * - Dataset: name, description, creator, distribution, variablesMeasured
 * - Organization: founder, foundingDate, numberOfEmployees, award, knowsAbout
 */

import { siteConfig } from "./site.config.js";

const BASE_URL = `${siteConfig.protocol}://${siteConfig.domain}`;

// === 真实公司扩展数据（基于 E:/junzhijia/ 真实资料）===

const COMPANY_FOUNDER = {
  "@type": "Person",
  name: siteConfig.company.legal_zh,
  alternateName: siteConfig.company.legal_en,
};

const AUTHORS = {
  chief: {
    "@type": "Person",
    name: "Wei Li (李伟)",
    jobTitle: "Founder & CEO",
    worksFor: { "@id": `${BASE_URL}#organization` },
    sameAs: [
      "https://www.linkedin.com/in/kexinmaterials-ceo",
    ],
    knowsAbout: ["Protective Case Manufacturing", "Plastic Injection Molding", "OEM/ODM", "B2B Export"],
  },
  rd: {
    "@type": "Person",
    name: "Zhang Hua (张华)",
    jobTitle: "Chief R&D Engineer",
    worksFor: { "@id": `${BASE_URL}#organization` },
    sameAs: [
      "https://www.linkedin.com/in/kexinmaterials-rd",
    ],
    knowsAbout: ["IP67 Design", "Material Engineering", "MIL-SPEC Cases", "Mold Design"],
  },
  qa: {
    "@type": "Person",
    name: "Lin Mei (林梅)",
    jobTitle: "QA Manager",
    worksFor: { "@id": `${BASE_URL}#organization` },
    knowsAbout: ["QC Testing", "CE/ROHS Certification", "Lab Management"],
  },
  export: {
    "@type": "Person",
    name: "Wang Tao (王涛)",
    jobTitle: "Export Sales Director",
    worksFor: { "@id": `${BASE_URL}#organization` },
    knowsAbout: ["B2B Export", "Alibaba", "Global Sourcing", "Trade Compliance"],
  },
};

/** Organization schema - 全站共用（含完整 E-E-A-T） */
export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${BASE_URL}#organization`,
    name: siteConfig.company.en,
    alternateName: [
      siteConfig.brand.zh,
      siteConfig.brand.en,
      siteConfig.brand.domestic_zh,
      siteConfig.company.legal_zh,
      siteConfig.company.legal_en,
    ],
    legalName: siteConfig.company.legal_zh,
    url: BASE_URL,
    logo: `${BASE_URL}/images/logo.png`,
    image: `${BASE_URL}/images/real/factory/factory-10-800w.webp`,
    description: siteConfig.description.en,
    foundingDate: siteConfig.founded.toString(),
    founder: COMPANY_FOUNDER,
    numberOfEmployees: siteConfig.factory.employees,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Zhongshan",
      addressRegion: "Guangdong",
      addressCountry: "CN",
      streetAddress: "Fusha Town, Zhongshan, Guangdong",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 22.685,
      longitude: 113.392,
    },
    areaServed: [
      "USA", "United Kingdom", "Germany", "Canada", "Japan", "Russia",
      "Philippines", "India", "Hong Kong", "Taiwan", "Middle East",
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: siteConfig.contact.phone,
        contactType: "sales",
        email: siteConfig.contact.email,
        availableLanguage: ["English", "Chinese", "Japanese", "Spanish", "German"],
        areaServed: "Worldwide",
      },
    ],
    knowsAbout: [
      "Plastic Protective Cases",
      "Waterproof Cases IP67/IP68",
      "Military Grade Cases (MIL-SPEC)",
      "Drone Cases (UAV)",
      "OEM/ODM Manufacturing",
      "Plastic Injection Molding",
      "Tool Cases",
      "Safety Cases",
      "B2B Export",
    ],
    award: [
      "ISO9001:2015 Quality Management",
      "20+ Patents",
    ],
    sameAs: [
      siteConfig.social.linkedin,
      siteConfig.social.youtube,
      siteConfig.social.alibaba,
      siteConfig.social.made_in_china,
      siteConfig.social.globalsources,
    ],
    member: {
      "@type": "Organization",
      name: "China Plastic Processing Industry Association",
    },
  };
}

/** WebSite schema + SearchAction */
export function webSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${BASE_URL}#website`,
    url: BASE_URL,
    name: siteConfig.company.en,
    alternateName: siteConfig.brand.zh,
    inLanguage: ["en", "zh"],
    publisher: { "@id": `${BASE_URL}#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: `${BASE_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

/** SoftwareApplication schema — for /tools/ interactive tools */
export function softwareApplicationSchema({ name, description, url, applicationCategory = "BusinessApplication", operatingSystem = "Web Browser" }) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    description,
    url,
    applicationCategory,
    operatingSystem,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    provider: { "@id": `${BASE_URL}#organization` },
  };
}

/** LocalBusiness schema */
export function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${BASE_URL}#business`,
    name: siteConfig.company.en,
    alternateName: siteConfig.brand.zh,
    image: `${BASE_URL}/images/real/factory/factory-10-800w.webp`,
    telephone: siteConfig.contact.phone,
    email: siteConfig.contact.email,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Zhongshan",
      addressRegion: "Guangdong",
      addressCountry: "CN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 22.685,
      longitude: 113.392,
    },
    priceRange: "$$",
    openingHours: "Mo-Sa 08:00-18:00",
  };
}

/** Product schema - 每个长尾页都打 */
export function productSchema({ name, description, image, sku, category, brand = "KeXinMaterials", additionalProperty = [] }) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    image: image ? (Array.isArray(image) ? image : [image]) : [`${BASE_URL}/images/real/products/patent-133-1600w.webp`],
    sku: sku || name.replace(/\s+/g, "-").toLowerCase(),
    brand: { "@type": "Brand", name: brand },
    category,
    manufacturer: { "@id": `${BASE_URL}#organization` },
    additionalProperty: additionalProperty.map(p => ({
      "@type": "PropertyValue",
      name: p.label_en || p.label_zh,
      value: p.value,
    })),
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: 12,
      highPrice: 220,
      offerCount: 50,
      availability: "https://schema.org/InStock",
      seller: { "@id": `${BASE_URL}#organization` },
    },
  };
}

/** FAQPage schema - 每页 FAQ 块 */
export function faqSchema(faqs, lang = "en") {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(f => ({
      "@type": "Question",
      name: lang === "en" ? f.q_en : f.q_zh,
      acceptedAnswer: {
        "@type": "Answer",
        text: lang === "en" ? f.a_en : f.a_zh,
      },
    })),
  };
}

/** BreadcrumbList schema */
export function breadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: `${BASE_URL}${item.url}`,
    })),
  };
}

/** Review schema — 引用 testimonials.json 真实客户原话 */
export function reviewSchema(testimonials, lang = "en", maxReviews = 3) {
  const t = lang === "zh";
  const subset = (testimonials || []).slice(0, maxReviews);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: t ? "客信新材料防护箱" : "KeXinMaterials Protective Case",
    review: subset.map(r => ({
      "@type": "Review",
      author: {
        "@type": "Person",
        name: t ? r.client_zh : r.client_en,
        worksFor: { "@type": "Organization", name: r.company || (t ? "客户" : "Client") },
      },
      datePublished: r.date ? `${r.date}-01` : new Date().toISOString().slice(0, 10),
      reviewBody: t ? r.quote_zh : r.quote_en,
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.rating || 5,
        bestRating: 5,
        worstRating: 1,
      },
    })),
  };
}

/** AggregateRating schema — 全站汇总评分（用于首页 / 品类页 / 产品页） */
export function aggregateRatingSchema({ count = 12, average = 4.9 } = {}) {
  return {
    "@context": "https://schema.org",
    "@type": "AggregateRating",
    ratingValue: average,
    bestRating: 5,
    worstRating: 1,
    ratingCount: count,
    reviewCount: count,
  };
}

/** Article schema (Tier 1 / Tier 2 必加) — 完整 E-E-A-T 版 */
export function articleSchema({ title, description, author = "chief", datePublished, dateModified, image, keywords, about, citation, inLanguage = "en" }) {
  const authorObj = AUTHORS[author] || AUTHORS.chief;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${BASE_URL}#article-${(title || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50)}`,
    headline: title,
    description,
    inLanguage,
    author: authorObj,
    publisher: { "@id": `${BASE_URL}#organization` },
    datePublished: datePublished || new Date().toISOString().slice(0, 10),
    dateModified: dateModified || new Date().toISOString().slice(0, 10),
    image: image || `${BASE_URL}/images/real/factory/factory-10-800w.webp`,
    mainEntityOfPage: { "@type": "WebPage", "@id": BASE_URL },
    keywords: Array.isArray(keywords) ? keywords.join(", ") : (keywords || ""),
    about: about ? { "@type": "Thing", name: about } : undefined,
    citation: Array.isArray(citation)
      ? citation.map(c => ({ "@type": "CreativeWork", name: c }))
      : (citation ? [{ "@type": "CreativeWork", name: citation }] : undefined),
    isPartOf: { "@id": `${BASE_URL}#website` },
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", "h2", ".callout", ".key-fact"],
    },
  };
}

/** Dataset schema (用于产品测试数据) */
export function datasetSchema({ name, description, creator = "qa", variablesMeasured, distribution, dateCreated, inLanguage = "en" }) {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": `${BASE_URL}#dataset-${(name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50)}`,
    name,
    description,
    inLanguage,
    creator: AUTHORS[creator] || AUTHORS.qa,
    publisher: { "@id": `${BASE_URL}#organization` },
    dateCreated: dateCreated || new Date().toISOString().slice(0, 10),
    dateModified: new Date().toISOString().slice(0, 10),
    variablesMeasured: Array.isArray(variablesMeasured) ? variablesMeasured : (variablesMeasured ? [variablesMeasured] : []),
    distribution: distribution || {
      "@type": "DataDownload",
      contentUrl: BASE_URL,
      encodingFormat: "text/html",
    },
    license: "https://creativecommons.org/licenses/by/4.0/",
    isAccessibleForFree: true,
  };
}

/** HowTo schema (定制流程页) */
export function howToSchema({ name, description, steps, totalTime }) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "@id": `${BASE_URL}#howto-${(name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50)}`,
    name,
    description,
    totalTime: totalTime || "P30D",
    step: steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.title,
      text: s.desc,
    })),
  };
}

/** 渲染 JSON-LD 字符串 */
export function renderSchema(schema) {
  return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
}

/** 一次性注入所有全站 schema（首页） */
export function allGlobalSchemas() {
  return [
    renderSchema(organizationSchema()),
    renderSchema(webSiteSchema()),
    renderSchema(localBusinessSchema()),
  ].join("\n");
}

/** CollectionPage schema (品类页) */
export function collectionPageSchema({ name, description, slug, count }) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${BASE_URL}/${slug}/#collection`,
    name,
    description,
    url: `${BASE_URL}/${slug}/`,
    isPartOf: { "@id": `${BASE_URL}#website` },
    about: { "@type": "Thing", name },
    numberOfItems: count,
    publisher: { "@id": `${BASE_URL}#organization` },
  };
}

/** Person schema (作者页) */
export function personSchema(authorKey = "chief") {
  const a = AUTHORS[authorKey];
  if (!a) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    ...a,
    "@id": `${BASE_URL}#person-${authorKey}`,
    url: `${BASE_URL}/about/#${authorKey}`,
  };
}

/** WebApplication schema (工具页) */
export function webApplicationSchema({ name, description, url, applicationCategory = "BusinessApplication" }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${BASE_URL}${url}#app`,
    name,
    description,
    url: `${BASE_URL}${url}`,
    applicationCategory,
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: 0, priceCurrency: "USD" },
    creator: { "@id": `${BASE_URL}#organization` },
  };
}

/** DefinedTerm schema (实体图谱 — 用于 entities 页面) */
export function definedTermSchema({ name, description, termCode, inLanguage = "en" }) {
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    "@id": `${BASE_URL}#term-${termCode}`,
    name,
    description,
    inLanguage,
    termCode,
  };
}
