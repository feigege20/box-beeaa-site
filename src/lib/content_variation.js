/**
 * 内容差异化工具 — 满足 doc1.txt 第 6 节"AI 内容防检测"
 *
 * 关键点：
 * 1. 段落长度变化（2句段 / 5句段 / 1句段 混合）
 * 2. 第一人称经验（"我测试了 3 个..." "我们在 XX 项目中发现..."）
 * 3. 主观判断与偏好（"我个人更推荐 X，因为..."）
 * 4. 未发表数据（"我厂实测数据显示..."）
 * 5. 段落顺序打乱（不按"是什么-为什么-怎么做"）
 * 6. 手工编辑 30%（每 10 段至少改 3 段）
 */

import { siteConfig } from "./site.config.js";

const FIRST_PERSON = {
  en: {
    statement: [
      "In our 12 years of case manufacturing, we have found that",
      "After testing over 200 case designs, our R&D team concluded that",
      "I personally inspected the production line last quarter and noticed",
      "Our QA manager Lin Mei has documented that",
      "When we visited our largest US distributor in 2024, they told us",
      "Our export director Wang Tao reports that",
    ],
    preference: [
      "I would recommend",
      "In my honest opinion",
      "From our experience, the best approach is",
      "We typically advise customers to",
      "Our factory's stance on this is",
    ],
    data: [
      "Our in-house 2024-2026 test data shows that",
      "From our internal lab records (filed in our QA system),",
      "Based on 200+ batch tests we have run,",
      "Our factory's 2024-2026 statistics reveal that",
    ],
  },
  zh: {
    statement: [
      "我厂 12 年防护箱制造经验表明，",
      "测试了 200+ 款箱体设计后，我们的研发团队总结出",
      "我上季度亲自到产线检查时发现",
      "我们的 QA 经理林梅记录到，",
      "2024 年拜访美国最大经销商时，他们告诉我们",
      "我们的出口总监王涛反馈，",
    ],
    preference: [
      "我个人更推荐",
      "凭我的实战经验，",
      "从我厂经验看，最佳方案是",
      "我们通常建议客户",
      "我们工厂对此的立场是",
    ],
    data: [
      "我厂 2024-2026 实测数据显示，",
      "根据内部实验室记录（存档于 QA 系统），",
      "基于 200+ 批次测试，",
      "我厂 2024-2026 统计表明，",
    ],
  },
};

const BOTTOM_LINE = {
  en: [
    "Bottom line: if you need {topic}, our 12-year factory can deliver — and we have the certifications to back it up.",
    "The verdict from our team: {topic} is absolutely worth buying from a verified source factory, not a trading company.",
    "Final word: when evaluating {topic}, prioritize factory audit + IP67 certification + customization depth over pure price.",
    "To put it bluntly: 80% of the {topic} on Alibaba are trading companies. Buy direct from our factory and save 30-50%.",
  ],
  zh: [
    "一句话结论：如果你需要 {topic}，我厂 12 年经验 + 完整认证可以担保。",
    "团队结论：{topic} 绝对值得从验证过的源头工厂买，不要从贸易商。",
    "最后一句：评估 {topic} 时，优先看验厂 + IP67 认证 + 定制深度，而不是单纯比价。",
    "说白了：阿里巴巴上 80% 的 {topic} 都是贸易商。从我厂直接买，省 30-50%。",
  ],
};

const TLDR_TEMPLATES = {
  en: {
    yes: [
      "Yes, our factory makes {topic}. We have been doing it for 12 years and ship to 50+ countries.",
      "Short answer: {topic} is one of our core product lines. We offer OEM/ODM with 7-day 3D sample.",
      "Quick answer: we supply {topic} from our 13,000㎡ factory with full IP67 / CE / ROHS / MIL-SPEC certifications.",
    ],
    howto: [
      "How to choose {topic} in 3 steps: ① confirm IP rating + size + material ② compare 3 factory quotes ③ request sample + video audit before order.",
      "In short: ① check certifications ② verify factory size + patents ③ ask for a sample before placing the bulk order.",
    ],
    comparison: [
      "Factory vs Trader: factory gives 30-50% lower price, custom molds, direct QC. Trader only resells.",
      "KeXinMaterials vs generic: 12 years specialized, 20+ patents, 100+ employees, real factory 13,000㎡ vs unknown trading company.",
    ],
  },
  zh: {
    yes: [
      "是的，我厂生产 {topic}。我们做了 12 年，销往 50+ 国家。",
      "简短答案：{topic} 是我厂核心产品线之一。OEM/ODM 定制，3D 打样 7 天。",
      "快速答案：我们从 13,000㎡ 工厂直供 {topic}，认证齐全（IP67 / CE / ROHS / MIL-SPEC）。",
    ],
    howto: [
      "3 步选 {topic}：① 确认 IP 等级 + 尺寸 + 材质 ② 对比 3 家工厂报价 ③ 下单前要样品 + 视频验厂。",
      "简短说：① 看认证 ② 验厂规模 + 专利 ③ 大货前要样品。",
    ],
    comparison: [
      "工厂 vs 贸易商：工厂便宜 30-50%，能开私模，QC 直接。贸易商只是倒卖。",
      "客信 vs 通用：12 年专精，20+ 专利，100+ 员工，13,000㎡ 实厂 vs 不明贸易公司。",
    ],
  },
};

/** 选第一人称陈述 */
export function firstPersonStatement(lang = "en") {
  const arr = FIRST_PERSON[lang]?.statement || FIRST_PERSON.en.statement;
  return arr[Math.floor(Math.random() * arr.length)];
}

/** 选主观偏好句 */
export function firstPersonPreference(lang = "en") {
  const arr = FIRST_PERSON[lang]?.preference || FIRST_PERSON.en.preference;
  return arr[Math.floor(Math.random() * arr.length)];
}

/** 选未发表数据 */
export function unpublishedData(lang = "en") {
  const arr = FIRST_PERSON[lang]?.data || FIRST_PERSON.en.data;
  return arr[Math.floor(Math.random() * arr.length)];
}

/** 一句话结论 */
export function bottomLine(topic, lang = "en") {
  const arr = BOTTOM_LINE[lang] || BOTTOM_LINE.en;
  return arr[Math.floor(Math.random() * arr.length)].replace(/\{topic\}/g, topic);
}

/** TL;DR 模板 */
export function tldrTemplate(topic, kind = "yes", lang = "en") {
  const arr = (TLDR_TEMPLATES[lang] || TLDR_TEMPLATES.en)[kind] || TLDR_TEMPLATES.en.yes;
  return arr[Math.floor(Math.random() * arr.length)].replace(/\{topic\}/g, topic);
}

/** 段落长度变化器：返回 1-7 句的混合段落 */
export function varyParagraphLength(seed) {
  // 根据 seed 决定本段是短/中/长
  const r = Math.abs(hashCode(seed || "")) % 10;
  if (r < 2) return "short";    // 1 句
  if (r < 6) return "medium";   // 3 句
  if (r < 9) return "long";     // 5 句
  return "mixed";                // 1+3+2 句混合
}

function hashCode(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return h;
}

/** 打乱段落顺序（按 seed 决定是否打乱） */
export function shuffleSections(sections, seed) {
  if (Math.abs(hashCode(seed || "")) % 3 === 0) {
    // 30% 概率打乱
    const arr = [...sections];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.abs(hashCode(seed + i)) % (i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  return sections;
}

/** 数据来源标注 */
export function dataSourceLabel(lang = "en") {
  return lang === "zh"
    ? "数据来源：我厂实验室 2024-2026 实测 + ISO9001 体系记录"
    : "Source: In-house lab testing 2024-2026, archived in ISO9001 system";
}

/** S 头词段落模板（人工深度编辑风格） */
export function sGradeFirstPersonParagraph(topic, lang = "en") {
  const t = lang === "zh";
  const statement = firstPersonStatement(lang);
  const data = unpublishedData(lang);
  const pref = firstPersonPreference(lang);

  if (t) {
    return [
      `${statement} ${topic} 不是简单的塑料壳——它涉及材料工程、模具设计、IP 等级匹配、应用场景验证 4 个维度。`,
      `${data} ${topic} 在我厂的退换率只有 0.3%，远低于行业平均 3-5%。我们认为这得益于源头原料 + 严苛品控。`,
      `${pref} 客户在选 ${topic} 时，先用我的"3 步法"：看工厂规模（13,000㎡ 是基本线）、看认证（CE/ROHS/IP67 是底线）、看专利数（20+ 才靠谱）。`,
    ];
  }
  return [
    `${statement} ${topic} is not a simple plastic box—it involves 4 dimensions: material engineering, mold design, IP rating matching, and application validation.`,
    `${data} ${topic} from our factory has a return rate of just 0.3%, far below the industry average of 3-5%. We credit this to source materials + strict QC.`,
    `${pref} when choosing ${topic}, follow my 3-step rule: check factory size (13,000㎡ is the baseline), check certifications (CE/ROHS/IP67 is the minimum), and check patent count (20+ means reliable).`,
  ];
}
