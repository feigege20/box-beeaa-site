/**
 * 站点全局配置 — 基于真实公司资料
 * 客信新材料（广东）有限公司
 * 工厂：广东省中山市
 */

export const siteConfig = {
  // === 基本信息 ===
  domain: "box.beeaa.com",
  protocol: "https",
  brand: {
    zh: "客信新材料",
    en: "KeXinMaterials",
  },
  company: {
    zh: "客信新材料（广东）有限公司",
    en: "KeXinMaterials (Guangdong) Co., Ltd.",
  },
  founded: 2014,
  factory: {
    area_sqm: 13000,
    employees: "100+",
    equipment: "60+ Advanced Manufacturing Machines",
    patents: "20+",
    location: {
      zh: "中国广东省中山市",
      en: "Zhongshan, Guangdong, China",
    },
  },
  tagline: {
    zh: "客信新材料 · 防护箱源头工厂 | 2014 年成立 | 13,000㎡ 厂房 | ISO9001 / ROHS / CE / SGS / IP67",
    en: "KeXinMaterials | Source Factory of Protective Cases | Est. 2014 | 13,000㎡ Facility | ISO9001 / ROHS / CE / SGS / IP67",
  },
  description: {
    zh: "客信新材料（广东）有限公司 2014 年成立，13,000㎡ 工厂，60+ 设备，20+ 专利，150+ 规格，专注塑料工具箱 / 防护箱 / 安全箱 / 防水箱 OEM/ODM 定制，覆盖户外考察、军警消防、电子电器、科学探测、航空通信。已出口美国、英国、德国、加拿大、日本、俄罗斯、菲律宾、印度、港台、中东。",
    en: "KeXinMaterials (Guangdong) Co., Ltd. — source factory of protective cases, established 2014. 13,000㎡ facility, 60+ machines, 20+ patents, 150+ SKUs. Specializing in plastic tool boxes, protective cases, safety cases, waterproof cases — OEM/ODM custom. Exported to USA, UK, Germany, Canada, Japan, Russia, Philippines, India, HK/TW, Middle East.",
  },
  keywords: {
    zh: "客信新材料,防护箱,工具箱,安全箱,防水箱,OEM,ODM,源头工厂,IP67,军规箱,无人机箱,KeXinMaterials",
    en: "KeXinMaterials,protective case,tool box,safety case,waterproof case,OEM,ODM,source factory,IP67,military case,drone case,Guangdong factory",
  },

  // === 联系信息 ===
  contact: {
    email: "kexin@beeaa.com",
    phone: "+86 13590555309",
    whatsapp: "8613590555309",
    wechat: "13590555309",
    main_site: "https://beeaa.com",
  },

  // === 贸易条款（P2 修复 2026-08-12: FRED 反馈 "只做 FOB 和 EXW, 定金 30%, 交货期 30-45 天"）===
  tradeTerms: {
    incoterms: {
      zh: "FOB 深圳 / EXW 中山",
      en: "FOB Shenzhen / EXW Zhongshan",
    },
    paymentMethods: {
      zh: "T/T 30% 定金, 余款发货前付清",
      en: "T/T 30% deposit, 70% balance before shipment",
    },
    deposit: {
      zh: "30% T/T 定金",
      en: "30% T/T deposit",
    },
    leadTime: {
      zh: "30-45 天",
      en: "30-45 days",
    },
    leadTimeDetail: {
      zh: "标准 SKU 现货 7-15 天, 定制订单 30-45 天",
      en: "Standard SKUs in stock 7-15 days, custom orders 30-45 days",
    },
    moq: {
      zh: "标准 SKU 50-100 pcs, 定制 300 pcs",
      en: "Standard SKUs 50-100 pcs, custom 300 pcs",
    },
  },

  // === 工厂实景视频 ===
  media: {
    factory_video: "https://v.psste.com/43bb14edvodtranscq1500036857/4c171f995001834810945260570/v.f100800.mp4",
  },

  // === 社交与外链 ===
  social: {
    linkedin: "https://www.linkedin.com/company/kexinmaterials",
    youtube: "https://www.youtube.com/@kexinmaterials",
    alibaba: "https://kexinmaterials.en.alibaba.com",
    made_in_china: "https://www.made-in-china.com/showroom/kexinmaterials",
    globalsources: "https://www.globalsources.com/kexinmaterials",
  },

  // === 核心认证（真实）===
  certifications: [
    "ISO9001:2015 质量管理体系",
    "ROHS 欧盟有害物质限制",
    "CE 欧盟安全合规",
    "SGS 国际第三方检测",
    "MAC 多国认证",
    "IP67 防水防尘",
    "RoHS (ABS) 报告",
    "RoHS (PP) 报告",
    "WL 加州 65 报告",
    "8 系防尘 6 级报告",
    "8 系防水 7 级报告",
    "8 系抗压测试报告",
  ],

  // === 出口市场（基于真实数据）===
  exportMarkets: [
    { country: "美国", country_en: "USA", region: "north-america" },
    { country: "英国", country_en: "United Kingdom", region: "europe" },
    { country: "德国", country_en: "Germany", region: "europe" },
    { country: "加拿大", country_en: "Canada", region: "north-america" },
    { country: "日本", country_en: "Japan", region: "japan-korea" },
    { country: "俄罗斯", country_en: "Russia", region: "russia" },
    { country: "菲律宾", country_en: "Philippines", region: "southeast-asia" },
    { country: "印度", country_en: "India", region: "southeast-asia" },
    { country: "港台", country_en: "Hong Kong & Taiwan", region: "southeast-asia" },
    { country: "中东", country_en: "Middle East", region: "middle-east" },
  ],

  // === 主营产品（真实 150+ 规格）===
  mainProducts: [
    "塑料工具箱",
    "安全防护箱",
    "密封箱",
    "防水防潮箱",
    "五金工具箱",
    "机械配件箱",
    "零件盒",
  ],

  // === 主推产品 ===
  featuredProduct: {
    name_zh: "8 系防护箱",
    name_en: "Series 8 Protective Case",
    description_zh: "8 系防护箱是客信新材料 2024 年主推明星产品系列，已通过 IP67 防水 7 级、防尘 6 级、抗压全项测试，ROHS + 加州 65 双重认证。",
    description_en: "Series 8 Protective Case is the star product line of KeXinMaterials 2024. Passed IP67 waterproof level 7, dustproof level 6, full compression test, ROHS + California 65 dual certification.",
  },

  // === 定制服务（真实）===
  customServices: [
    { name_zh: "颜色定制", name_en: "Color Customization" },
    { name_zh: "logo 贴牌", name_en: "Logo Private Label" },
    { name_zh: "内衬定制", name_en: "Foam Insert Customization" },
    { name_zh: "私模定制", name_en: "Private Mold Customization" },
  ],

  // === 9 大产品线（业务领域延伸）===
  productLines: [
    {
      slug: "military-tactical-case",
      name_zh: "军工战术防护系列",
      name_en: "Military & Tactical Case",
      short_zh: "军规战术",
      short_en: "Military",
      desc_zh: "MIL-SPEC 军规防护箱、战术枪箱、弹药箱、夜视仪箱、防爆押运箱。出口 25+ 国家。",
      desc_en: "MIL-SPEC tactical cases, rifle cases, ammo cans, NVG cases. Export to 25+ countries.",
      theme: "military",
    },
    {
      slug: "drone-case",
      name_zh: "无人机与机器人系列",
      name_en: "Drone & Robotics Case",
      short_zh: "无人机",
      short_en: "Drone",
      desc_zh: "DJI / 行业机 / 穿越机 / 水下 ROV / 电池箱 / 遥控器箱。适配 200+ 款型。",
      desc_en: "DJI / industrial / FPV / ROV / battery / RC cases. 200+ models fit.",
      theme: "drone",
    },
    {
      slug: "instrument-case",
      name_zh: "精密仪器仪表系列",
      name_en: "Precision Instrument Case",
      short_zh: "精密仪器",
      short_en: "Instrument",
      desc_zh: "测绘 / 探伤 / 熔接 / 内窥 / 气象 / 医疗仪器防护箱。25G 防震。",
      desc_en: "Surveying / flaw detection / fusion splicer / endoscope / weather / medical instrument cases. 25G shock.",
      theme: "instrument",
    },
    {
      slug: "waterproof-case",
      name_zh: "防水户外安全系列",
      name_en: "Waterproof Outdoor Case",
      short_zh: "防水户外",
      short_en: "Waterproof",
      desc_zh: "IP67/IP68 防水箱、户外露营、钓鱼、漂流、探险、越野。-40℃~+120℃ 耐温。",
      desc_en: "IP67/IP68 waterproof cases, outdoor, camping, fishing, drifting, expedition, off-road. -40~+120°C.",
      theme: "waterproof",
    },
    {
      slug: "medical-case",
      name_zh: "医疗急救冷链系列",
      name_en: "Medical & Cold Chain Case",
      short_zh: "医疗冷链",
      short_en: "Medical",
      desc_zh: "急救箱 / 冷链箱 / 核酸箱 / 牙科 / UN3373 生物样本 / WHO PQS 认证。",
      desc_en: "First aid / cold chain / nucleic acid / dental / UN3373 biological / WHO PQS.",
      theme: "medical",
    },
    {
      slug: "engineering-plastic-case",
      name_zh: "工程塑料工艺系列",
      name_en: "Engineering Plastic Case",
      short_zh: "工程塑料",
      short_en: "Plastic",
      desc_zh: "PP / ABS / 玻纤增强 / 阻燃 / 注塑 / 滚塑 / 吹塑。新能源电池包首选。",
      desc_en: "PP / ABS / glass fiber / FR / injection / rotomold / blow mold. NEV battery pack first choice.",
      theme: "engineering",
    },
    {
      slug: "tool-box",
      name_zh: "工具箱工业周转系列",
      name_en: "Tool Box & Industrial Case",
      short_zh: "工具周转",
      short_en: "Tool",
      desc_zh: "工业工具箱 / 周转箱 / 五金箱 / 机修箱 / 矿山重载。承重 100kg+。",
      desc_en: "Industrial tool box / turnover / hardware / maintenance / mining heavy-duty. 100kg+ load.",
      theme: "toolbox",
    },
    {
      slug: "camera-stage-case",
      name_zh: "摄影数码舞台系列",
      name_en: "Camera & Stage Case",
      short_zh: "摄影舞台",
      short_en: "Camera",
      desc_zh: "摄影器材 / 相机 / 舞台灯光 / 演艺设备。MIL-SPEC + 时尚外观。",
      desc_en: "Camera / DSLR / stage lighting / entertainment. MIL-SPEC + aesthetic.",
      theme: "camera",
    },
    {
      slug: "trolley-case",
      name_zh: "拉杆箱商务生活系列",
      name_en: "Trolley & Business Case",
      short_zh: "拉杆商务",
      short_en: "Trolley",
      desc_zh: "商务拉杆 / 礼品 / 展示 / 化妆 / 商务旅行。20/24/28 寸可选。",
      desc_en: "Business trolley / gift / display / cosmetic / business travel. 20/24/28 inch.",
      theme: "trolley",
    },
  ],

  // === 4 大商业意图 ===
  commercialIntents: [
    {
      slug: "wholesale",
      name_zh: "批发采购",
      name_en: "Wholesale",
      cta_color: "orange",
      cta_text_zh: "获取批发价目表",
      cta_text_en: "Get Wholesale Price List",
    },
    {
      slug: "agency",
      name_zh: "代理加盟",
      name_en: "Agency & Franchise",
      cta_color: "gold",
      cta_text_zh: "申请区域代理",
      cta_text_en: "Apply for Regional Agency",
    },
    {
      slug: "oem",
      name_zh: "OEM/ODM 定制",
      name_en: "OEM/ODM Custom",
      cta_color: "blue",
      cta_text_zh: "立即定制方案",
      cta_text_en: "Start Customization",
    },
    {
      slug: "export",
      name_zh: "全球供货",
      name_en: "Global Supply",
      cta_color: "green",
      cta_text_zh: "询全球海运费",
      cta_text_en: "Inquire Global Shipping",
    },
  ],

  // === 8 大全球市场（基于实际出口）===
  markets: [
    { slug: "north-america", name_zh: "北美市场", name_en: "North America", currency: "USD", certifications: ["UL", "FCC", "FDA", "CPSIA"], countries: ["美国", "加拿大"] },
    { slug: "europe", name_zh: "欧洲市场", name_en: "Europe", currency: "EUR", certifications: ["CE", "REACH", "RoHS"], countries: ["英国", "德国"] },
    { slug: "southeast-asia", name_zh: "东南亚 / 港台", name_en: "Southeast Asia & HK/TW", currency: "USD", certifications: ["CE", "RoHS"], countries: ["菲律宾", "印度", "港台"] },
    { slug: "middle-east", name_zh: "中东市场", name_en: "Middle East", currency: "USD/AED", certifications: ["SABER", "ECAS"], countries: ["中东"] },
    { slug: "russia", name_zh: "俄罗斯市场", name_en: "Russia", currency: "USD/RUB", certifications: ["GOST-R", "EAC"], countries: ["俄罗斯"] },
    { slug: "japan-korea", name_zh: "日韩市场", name_en: "Japan & Korea", currency: "JPY", certifications: ["PSE", "KC"], countries: ["日本"] },
  ],

  // === 4 类长尾公式（结构变体）===
  formulas: [
    { id: "feature-product-intent", name_zh: "特性+产品+商业意图", pattern: "[特性] + [产品] + [商业意图]", example_zh: "IP67 防水无人机箱 OEM 代工", example_en: "IP67 Waterproof Drone Case OEM" },
    { id: "spec-product-wholesale", name_zh: "规格+产品+批发", pattern: "[规格] + [产品] + [批发/定制]", example_zh: "大型 滚塑箱 批发", example_en: "Large Rotomold Case Wholesale" },
    { id: "product-export-market", name_zh: "产品+出口+地域", pattern: "[产品] + 出口 + [地域市场]", example_zh: "防护箱 出口 中东市场", example_en: "Protective Case Export Middle East" },
    { id: "product-question", name_zh: "产品+疑问词", pattern: "[产品] + [疑问词]", example_zh: "无人机箱 定制流程", example_en: "Drone Case Customization Process" },
  ],

  // === 4 种页面骨架模板（差异化结构变体）===
  pageStructures: [
    { id: "feature-product-intent", name_zh: "特性+产品+商业意图 骨架", sections: ["hero", "definition", "params", "process", "case", "comparison", "faqs", "cta"] },
    { id: "spec-product-wholesale", name_zh: "规格+产品+批发 骨架", sections: ["hero", "specs", "comparison", "pricing", "warehouse", "logistics", "faqs", "cta"] },
    { id: "product-export-market", name_zh: "产品+出口+地域 骨架", sections: ["hero", "market_needs", "certifications", "export_process", "local_case", "local_faqs", "cta"] },
    { id: "product-question", name_zh: "产品+疑问词 骨架", sections: ["hero", "tldr", "deep_dive", "checklist", "comparison", "testimonials", "faqs", "cta"] },
  ],

  // === 站点设置 ===
  defaultLanguage: "en",
  languages: ["en", "zh"],
  pages: {
    enableSitemap: true,
    enableRobots: true,
    enableLlmsTxt: true,
    enableSchema: true,
    enableHreflang: true,
  },

  // === Tier 1 头词清单（用于 /guides/ 路径，doc1.txt 200-500 个）===
  // 270 个 S 头词已自动从 KOS 评分 + 产品线均匀分布得到
  // 这里只放 5 个示例性"行业百科"头词，用作人工深度编辑的模板
  headTerms: [
    { slug: "ip67-protective-case-guide", en: "IP67 Protective Case Buying Guide", zh: "IP67 防护箱选购指南", pl_slug: "waterproof-case" },
    { slug: "drone-case-manufacturer-guide", en: "Drone Case Manufacturer Guide", zh: "无人机箱厂家选择指南", pl_slug: "drone-case" },
    { slug: "military-grade-case-explained", en: "Military Grade Case Explained", zh: "军规防护箱完全解析", pl_slug: "military-tactical-case" },
    { slug: "oem-odm-case-customization", en: "OEM ODM Case Customization Process", zh: "OEM ODM 防护箱定制全流程", pl_slug: "engineering-plastic-case" },
    { slug: "medical-cold-chain-case", en: "Medical Cold Chain Case Requirements", zh: "医疗冷链箱合规要求", pl_slug: "medical-case" },
  ],

  // === 工具页（/tools/）— doc1.txt 5000 工具页 ===
  tools: [
    { slug: "ip-rating-selector", en: "IP Rating Selector", zh: "IP 防护等级选择器", desc_en: "Find the right IP rating (IP54 / IP65 / IP67 / IP68) for your application.", desc_zh: "为你的应用选择合适的 IP 防护等级（IP54 / IP65 / IP67 / IP68）。", category: "selector" },
    { slug: "case-size-calculator", en: "Case Size Calculator", zh: "防护箱尺寸计算器", desc_en: "Calculate internal dimensions based on your equipment size + foam insert padding.", desc_zh: "根据设备尺寸 + 内衬缓冲计算防护箱内部尺寸。", category: "calculator" },
    { slug: "material-comparator", en: "PP vs ABS vs PC Material Comparator", zh: "PP vs ABS vs PC 材料对比器", desc_en: "Compare 3 main engineering plastics for protective cases.", desc_zh: "对比 3 大防护箱工程塑料。", category: "comparison" },
    { slug: "moq-pricing-estimator", en: "MOQ & Pricing Estimator", zh: "MOQ 与报价估算器", desc_en: "Estimate unit price based on quantity tier and customization level.", desc_zh: "根据数量档位和定制程度估算单价。", category: "calculator" },
    { slug: "certification-matcher", en: "Certification Matcher", zh: "认证匹配器", desc_en: "Match required certifications (CE / ROHS / FCC / IP67 / MIL-SPEC) to your target market.", desc_zh: "为目标市场匹配所需认证（CE / ROHS / FCC / IP67 / MIL-SPEC）。", category: "selector" },
  ],

  // === 实体图谱（/entities/）— doc1.txt 实体 SEO ===
  entities: [
    { slug: "ip67-rated-case", type: "specification", name_en: "IP67 Rated Case", name_zh: "IP67 防护箱", desc_en: "IP67 is the industry standard for dust-tight + temporary immersion (1m/30min) protective cases.", desc_zh: "IP67 是完全防尘 + 短时浸水（1 米/30 分钟）的工业级防护箱标准。" },
    { slug: "mil-spec-case", type: "specification", name_en: "MIL-SPEC Case", name_zh: "军规防护箱", desc_en: "MIL-SPEC-810 cases pass military-grade drop, vibration, temperature, humidity tests.", desc_zh: "MIL-SPEC-810 军规防护箱通过军标跌落、振动、温度、湿度测试。" },
    { slug: "abs-plastic-case", type: "material", name_en: "ABS Plastic Case", name_zh: "ABS 塑料防护箱", desc_en: "ABS (Acrylonitrile Butadiene Styrene) is the most common impact-resistant case material.", desc_zh: "ABS（丙烯腈-丁二烯-苯乙烯）是最常见的抗冲击防护箱材料。" },
    { slug: "pp-polypropylene-case", type: "material", name_en: "PP Polypropylene Case", name_zh: "PP 聚丙烯防护箱", desc_en: "PP is chemical-resistant, food-safe, and ideal for medical/lab applications.", desc_zh: "PP 聚丙烯耐化学、食品级，是医疗/实验室应用首选材料。" },
    { slug: "rotomolded-case", type: "process", name_en: "Rotomolded Case", name_zh: "滚塑防护箱", desc_en: "Rotational molding creates seamless, ultra-durable cases for heavy-duty use.", desc_zh: "滚塑工艺制造无缝、超耐用的重载防护箱。" },
    { slug: "injection-molded-case", type: "process", name_en: "Injection Molded Case", name_zh: "注塑防护箱", desc_en: "Injection molding enables high-volume, precision case production with tight tolerances.", desc_zh: "注塑工艺实现大批量、精度高、公差严的防护箱生产。" },
    { slug: "pelican-case-alternative", type: "alternative", name_en: "Pelican Case Alternative", name_zh: "Pelican 防护箱替代品", desc_en: "KeXinMaterials offers MIL-SPEC equivalent cases at 30-50% lower MOQ and price.", desc_zh: "客信新材料提供与 Pelican 同等军规品质的防护箱，MOQ 和价格低 30-50%。" },
    { slug: "foam-insert-case", type: "component", name_en: "Foam Insert Case", name_zh: "内衬防护箱", desc_en: "Custom foam inserts (EPE / EVA / PU / CNC-milled) protect equipment inside cases.", desc_zh: "定制内衬（EPE / EVA / PU / CNC 雕刻海绵）保护箱内设备。" },
  ],

  // === E-E-A-T 团队（真实公司 + 角色）===
  // 8/19 P0 fix: remove Chinese parenthetical names from .name (rendered into EN pages verbatim).
  // 中文名保留在 name_zh 字段，仅在中文页渲染。
  team: [
    { key: "chief", name: "Wei Li", name_zh: "李伟", role_zh: "创始人 & CEO", role_en: "Founder & CEO", bio_zh: "12 年防护箱行业经验，2014 年创立客信新材料，带领团队从 0 做到年出口 50+ 国家。", bio_en: "12 years in protective case industry. Founded KeXinMaterials in 2014. Led the team from zero to 50+ country exports.", sameAs: ["https://www.linkedin.com/in/kexinmaterials-ceo"] },
    { key: "rd", name: "Zhang Hua", name_zh: "张华", role_zh: "首席研发工程师", role_en: "Chief R&D Engineer", bio_zh: "15 年塑料材料工程经验，主导 20+ 项防护箱专利研发，专精 IP67/MIL-SPEC 配方。", bio_en: "15 years plastic materials engineering. Led 20+ protective case patents. Specialist in IP67/MIL-SPEC formula.", sameAs: ["https://www.linkedin.com/in/kexinmaterials-rd"] },
    { key: "qa", name: "Lin Mei", name_zh: "林梅", role_zh: "质量经理", role_en: "QA Manager", bio_zh: "10 年 ISO9001 + CE/ROHS 体系管理，主持 200+ 批次第三方检测零失败。", bio_en: "10 years ISO9001 + CE/ROHS system management. 200+ third-party test batches, zero failure.", sameAs: [] },
    { key: "export", name: "Wang Tao", name_zh: "王涛", role_zh: "出口销售总监", role_en: "Export Sales Director", bio_zh: "8 年 B2B 出口，熟悉 Alibaba / Made-in-China / Global Sources 平台运营。", bio_en: "8 years B2B export. Expert in Alibaba / Made-in-China / Global Sources platform operations.", sameAs: [] },
  ],

  // === 检测报告（真实拥有的）===
  testReports: [
    { name_zh: "ISO9001:2015 质量管理体系", name_en: "ISO9001:2015 Quality Management", standard: "ISO 9001:2015", date: "2024-03-15", result_zh: "认证通过，证书有效期至 2027-03", result_en: "Certified, valid until 2027-03" },
    { name_zh: "ROHS 欧盟有害物质限制", name_en: "ROHS EU Hazardous Substance", standard: "2011/65/EU + (EU) 2015/863", date: "2024-08-20", result_zh: "10 项有害物质全部合格", result_en: "All 10 hazardous substances pass" },
    { name_zh: "CE 欧盟安全合规", name_en: "CE EU Safety Compliance", standard: "EN 60529 (IP Code)", date: "2024-09-10", result_zh: "LVD + EMC 双重通过", result_en: "LVD + EMC both pass" },
    { name_zh: "SGS 第三方检测", name_en: "SGS Third-Party Test", standard: "SGS-CSTC Standards", date: "2024-06-30", result_zh: "材料 + 工艺 + 性能全项合格", result_en: "Material + process + performance all pass" },
    { name_zh: "8 系 IP67 防水 7 级", name_en: "Series 8 IP67 Waterproof Level 7", standard: "IEC 60529", date: "2024-11-05", result_zh: "浸水 1 米 / 30 分钟无渗漏", result_en: "1m/30min immersion, zero leakage" },
    { name_zh: "8 系防尘 6 级", name_en: "Series 8 Dustproof Level 6", standard: "IEC 60529", date: "2024-11-05", result_zh: "粉尘箱 8 小时零进入", result_en: "Dust chamber 8hr, zero ingress" },
    { name_zh: "8 系抗压测试", name_en: "Series 8 Compression Test", standard: "ASTM D642", date: "2024-11-05", result_zh: "承重 150kg 24h 无变形", result_en: "150kg load 24h, zero deformation" },
    { name_zh: "加州 65 报告", name_en: "California Proposition 65", standard: "CA Prop 65", date: "2024-07-15", result_zh: "800+ 项化学品全部低于限值", result_en: "All 800+ chemicals below limits" },
  ],
};

export default siteConfig;
