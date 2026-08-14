-- ============================================
-- box-beeaa.com 询盘 D1 schema v2.0
-- 数据库名: box-beeaa-inquiries
-- 创建时间: 2026-08-11 (v1)
-- 升级时间: 2026-08-14 (v2: 添加分析 + 关联表)
-- 容量: Cloudflare D1 免费版 100K 行 / 5GB / 5M reads/day
-- ============================================

-- ============================================
-- 主表: 询盘 (v1 升级)
-- ============================================
CREATE TABLE IF NOT EXISTS inquiries (
  id TEXT PRIMARY KEY,                          -- INQ-XXXXXX-XXXX 格式
  created_at TEXT NOT NULL DEFAULT (datetime('now')),  -- UTC ISO 8601
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),  -- 最后修改时间
  lang TEXT NOT NULL DEFAULT 'en' CHECK (lang IN ('en', 'zh')),

  -- 客户信息
  name TEXT NOT NULL,
  company TEXT,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  country TEXT NOT NULL,
  country_code TEXT,                            -- ISO 3166-1 alpha-2 (US/CN/DE)

  -- 产品需求 (JSON 数组)
  product_line TEXT NOT NULL,                   -- JSON: ["drone-case", "instrument-case"]
  product_keywords TEXT,                        -- JSON: 用户搜索的关键词
  size TEXT,
  material TEXT,
  ip_rating TEXT,
  color TEXT,
  foam_insert TEXT,
  logo_print TEXT,
  custom_features TEXT,                         -- JSON: 其他定制需求

  -- 商务信息
  quantity TEXT NOT NULL,                       -- 字符串保留原始值 (e.g. "500-1000")
  target_price TEXT,
  currency TEXT DEFAULT 'USD',                  -- ISO 4217
  lead_time TEXT,
  certification TEXT,
  usage TEXT,
  message TEXT,

  -- AI 增强
  ai_category TEXT,                             -- military-tactical-case / drone-case / ...
  ai_urgency TEXT CHECK (ai_urgency IN ('low', 'normal', 'high')),
  ai_translation_zh TEXT,
  ai_translation_en TEXT,
  ai_sentiment TEXT CHECK (ai_sentiment IN ('positive', 'neutral', 'negative')),
  ai_estimated_value_usd REAL,                  -- AI 估算订单价值

  -- 营销归因 (UTM)
  referrer_url TEXT,                            -- 来源页 URL
  utm_source TEXT,                              -- google / bing / direct / ...
  utm_medium TEXT,                              -- organic / cpc / email / ...
  utm_campaign TEXT,                            -- 营销活动名
  utm_content TEXT,                             -- 链接 variant
  utm_term TEXT,                                -- 关键词

  -- 设备 + 浏览器
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
  browser_name TEXT,
  os_name TEXT,
  ip_address TEXT,
  user_agent TEXT,

  -- 状态 + 内部管理
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'replied', 'quoted', 'won', 'lost', 'spam')),
  notes TEXT,                                   -- admin 后台备注
  assigned_to TEXT,                             -- 分配给哪个 sales
  resend_message_id TEXT,                       -- Resend API 返回的 email ID

  -- GDPR 合规
  gdpr_consent_at TEXT,                         -- 客户同意时间
  data_retention_until TEXT,                    -- 数据保留到期
  deleted_at TEXT                               -- 软删除时间
);

-- v1 兼容: 添加 v2 新增列 (如果表已存在)
-- ALTER TABLE 不支持 IF NOT EXISTS in D1, 需要先检查
-- 推荐在 wrangler 脚本中先 PRAGMA table_info(inquiries) 然后动态 ALTER
-- 这里只声明 IF NOT EXISTS 的新表, 主表假设 v1 已部署

-- 索引
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_email ON inquiries(email);
CREATE INDEX IF NOT EXISTS idx_inquiries_lang ON inquiries(lang);
CREATE INDEX IF NOT EXISTS idx_inquiries_urgency ON inquiries(ai_urgency) WHERE ai_urgency IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inquiries_country ON inquiries(country);
CREATE INDEX IF NOT EXISTS idx_inquiries_assigned ON inquiries(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inquiries_product_line ON inquiries(product_line);
CREATE INDEX IF NOT EXISTS idx_inquiries_utm_source ON inquiries(utm_source) WHERE utm_source IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inquiries_utm_campaign ON inquiries(utm_campaign) WHERE utm_campaign IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inquiries_deleted ON inquiries(deleted_at) WHERE deleted_at IS NOT NULL;

-- 触发器: 更新 updated_at
CREATE TRIGGER IF NOT EXISTS trg_inquiries_updated_at
AFTER UPDATE ON inquiries
FOR EACH ROW
WHEN OLD.updated_at = NEW.updated_at
BEGIN
  UPDATE inquiries SET updated_at = datetime('now') WHERE id = OLD.id;
END;

-- ============================================
-- 表 2: 询盘事件 (状态变更历史)
-- ============================================
CREATE TABLE IF NOT EXISTS inquiry_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inquiry_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'created', 'viewed', 'replied', 'quoted', 'won', 'lost',
    'spam', 'assigned', 'noted', 'resent', 'archived', 'restored'
  )),
  from_status TEXT,
  to_status TEXT,
  actor TEXT,                                   -- admin email / system
  metadata TEXT,                                -- JSON
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_events_inquiry ON inquiry_events(inquiry_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_type ON inquiry_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_actor ON inquiry_events(actor) WHERE actor IS NOT NULL;

-- ============================================
-- 表 3: 询盘消息 (跟进邮件/报价)
-- ============================================
CREATE TABLE IF NOT EXISTS inquiry_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inquiry_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  direction TEXT NOT NULL CHECK (direction IN ('outbound', 'inbound')),
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp', 'phone', 'wechat', 'manual')),
  subject TEXT,
  body TEXT NOT NULL,
  body_html TEXT,
  resend_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('draft', 'sent', 'delivered', 'bounced', 'failed', 'read', 'replied')),
  attachments TEXT                              -- JSON 数组: [{name, url, size}]
);

CREATE INDEX IF NOT EXISTS idx_messages_inquiry ON inquiry_messages(inquiry_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_direction ON inquiry_messages(direction);
CREATE INDEX IF NOT EXISTS idx_messages_status ON inquiry_messages(status);

-- ============================================
-- 表 4: 询盘附件 (文件上传)
-- ============================================
CREATE TABLE IF NOT EXISTS inquiry_attachments (
  id TEXT PRIMARY KEY,                          -- ATT-XXXXXX
  inquiry_id TEXT NOT NULL,
  uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  r2_key TEXT NOT NULL,                         -- R2 bucket: box-attachments/<inquiry_id>/<filename>
  r2_bucket TEXT NOT NULL,
  uploaded_by TEXT,                             -- email of uploader
  scanned_at TEXT,                              -- 病毒扫描时间
  scan_result TEXT CHECK (scan_result IN ('clean', 'infected', 'error', 'pending'))
);

CREATE INDEX IF NOT EXISTS idx_attachments_inquiry ON inquiry_attachments(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_attachments_scan ON inquiry_attachments(scan_result) WHERE scan_result IS NOT NULL;

-- ============================================
-- 表 5: 报价 (admin 发送给客户的报价)
-- ============================================
CREATE TABLE IF NOT EXISTS quotations (
  id TEXT PRIMARY KEY,                          -- QT-XXXXXX
  inquiry_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  valid_until TEXT,                             -- 报价有效期
  currency TEXT NOT NULL DEFAULT 'USD',
  subtotal REAL NOT NULL,
  shipping_cost REAL DEFAULT 0,
  tax REAL DEFAULT 0,
  total REAL NOT NULL,
  incoterms TEXT,                               -- FOB Shenzhen / EXW Zhongshan / CIF Hamburg
  payment_terms TEXT,                           -- T/T 30% deposit
  lead_time_days INTEGER,
  line_items TEXT NOT NULL,                     -- JSON 数组: [{sku, qty, unit_price, total}]
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  sent_at TEXT,
  accepted_at TEXT,
  rejected_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_quotations_inquiry ON quotations(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_valid ON quotations(valid_until) WHERE status = 'sent';

-- ============================================
-- 表 6: 访客会话 (轻量级分析)
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,                          -- SES-XXXXXX
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
  ip_address TEXT,
  country_code TEXT,                            -- 推测国家
  device_type TEXT,
  browser_name TEXT,
  referrer_url TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  page_count INTEGER DEFAULT 1,
  duration_seconds INTEGER DEFAULT 0,
  bounced INTEGER DEFAULT 0,                    -- 1 = 单页即离开
  converted INTEGER DEFAULT 0,                  -- 1 = 提交了询盘
  inquiry_id TEXT                               -- 关联到询盘
);

CREATE INDEX IF NOT EXISTS idx_sessions_created ON sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_utm ON sessions(utm_source, utm_campaign);
CREATE INDEX IF NOT EXISTS idx_sessions_converted ON sessions(converted) WHERE converted = 1;

-- ============================================
-- 表 7: 询盘标签 (灵活分类)
-- ============================================
CREATE TABLE IF NOT EXISTS inquiry_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inquiry_id TEXT NOT NULL,
  tag TEXT NOT NULL,                            -- e.g. "VIP", "follow-up", "big-quantity"
  color TEXT,                                   -- e.g. "#FF6B6B" for UI
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_tags_inquiry ON inquiry_tags(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_tags_tag ON inquiry_tags(tag);

-- ============================================
-- 视图 1: 询盘汇总
-- ============================================
CREATE VIEW IF NOT EXISTS v_inquiry_summary AS
SELECT
  i.id,
  i.created_at,
  i.lang,
  i.name,
  i.company,
  i.email,
  i.country,
  i.product_line,
  i.quantity,
  i.status,
  i.ai_urgency,
  i.ai_estimated_value_usd,
  i.utm_source,
  i.utm_campaign,
  i.assigned_to,
  COUNT(DISTINCT m.id) AS message_count,
  COUNT(DISTINCT a.id) AS attachment_count,
  COUNT(DISTINCT q.id) AS quotation_count,
  MAX(m.created_at) AS last_message_at
FROM inquiries i
LEFT JOIN inquiry_messages m ON m.inquiry_id = i.id
LEFT JOIN inquiry_attachments a ON a.inquiry_id = i.id
LEFT JOIN quotations q ON q.inquiry_id = i.id
WHERE i.deleted_at IS NULL
GROUP BY i.id;

-- ============================================
-- 视图 2: 月度询盘统计
-- ============================================
CREATE VIEW IF NOT EXISTS v_inquiry_monthly AS
SELECT
  strftime('%Y-%m', created_at) AS month,
  lang,
  country,
  status,
  COUNT(*) AS inquiry_count,
  COUNT(DISTINCT email) AS unique_emails,
  AVG(ai_estimated_value_usd) AS avg_estimated_value,
  SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) AS won_count,
  SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END) AS lost_count
FROM inquiries
WHERE deleted_at IS NULL
GROUP BY month, lang, country, status;

-- ============================================
-- 视图 3: UTM 营销归因
-- ============================================
CREATE VIEW IF NOT EXISTS v_inquiry_attribution AS
SELECT
  COALESCE(utm_source, 'direct') AS source,
  COALESCE(utm_campaign, '(none)') AS campaign,
  utm_medium,
  COUNT(*) AS total_inquiries,
  COUNT(DISTINCT email) AS unique_leads,
  COUNT(DISTINCT country) AS country_count,
  SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) AS won,
  SUM(CASE WHEN status = 'quoted' THEN 1 ELSE 0 END) AS quoted,
  AVG(ai_estimated_value_usd) AS avg_value
FROM inquiries
WHERE deleted_at IS NULL
GROUP BY utm_source, utm_campaign, utm_medium;

-- ============================================
-- 触发器: 询盘创建时自动添加 event
-- ============================================
CREATE TRIGGER IF NOT EXISTS trg_inquiry_created
AFTER INSERT ON inquiries
FOR EACH ROW
BEGIN
  INSERT INTO inquiry_events (inquiry_id, event_type, to_status, actor, metadata)
  VALUES (
    NEW.id,
    'created',
    NEW.status,
    NEW.email,
    json_object('lang', NEW.lang, 'country', NEW.country, 'product_line', NEW.product_line)
  );
END;

-- 触发器: 询盘状态变更时记录
CREATE TRIGGER IF NOT EXISTS trg_inquiry_status_changed
AFTER UPDATE OF status ON inquiries
FOR EACH ROW
WHEN OLD.status != NEW.status
BEGIN
  INSERT INTO inquiry_events (inquiry_id, event_type, from_status, to_status, actor, metadata)
  VALUES (
    NEW.id,
    CASE
      WHEN NEW.status = 'replied' THEN 'replied'
      WHEN NEW.status = 'quoted' THEN 'quoted'
      WHEN NEW.status = 'won' THEN 'won'
      WHEN NEW.status = 'lost' THEN 'lost'
      WHEN NEW.status = 'spam' THEN 'spam'
      ELSE 'noted'
    END,
    OLD.status,
    NEW.status,
    NEW.assigned_to,
    NULL
  );
END;

-- ============================================
-- 函数: 标记为已转化 session
-- ============================================
CREATE TRIGGER IF NOT EXISTS trg_session_converted
AFTER UPDATE OF converted ON sessions
FOR EACH ROW
WHEN NEW.converted = 1 AND OLD.converted = 0
BEGIN
  UPDATE sessions SET inquiry_id = NEW.inquiry_id WHERE id = OLD.id;
END;

-- ============================================
-- 部署说明
-- ============================================
-- 1. Cloudflare Dashboard → Workers & Pages → D1 → Create database
--    Name: box-beeaa-inquiries
--
-- 2. 本地或 Dashboard 里执行 v2 schema (会创建新表, 不影响 v1 主表):
--    npx wrangler d1 execute box-beeaa-inquiries --file=./schema/d1-inquiries-v2.sql --remote
--
-- 3. 把 database_id 填到 wrangler.toml 的 [[d1_databases]] 块
--
-- 4. 部署后, 询盘会自动写入 (如果 env.RESEND_API_KEY 存在且邮件成功)
--
-- 5. Admin 后台增强:
--    - https://box.beeaa.com/api/admin/inquiries (list)
--    - https://box.beeaa.com/api/admin/inquiries/INQ-XXX (detail + events + messages)
--    - https://box.beeaa.com/api/admin/inquiries/stats (analytics)
--    - Header: X-Admin-Token: <env.ADMIN_TOKEN>
--
-- 6. 隐私合规:
--    - IP + UA 在 90 天后可清理: DELETE FROM inquiries WHERE created_at < datetime('now', '-90 days') AND gdpr_consent_at IS NULL;
--    - GDPR: 客户申请删除时, 单条软删除: UPDATE inquiries SET deleted_at = datetime('now') WHERE id = ?;
--    - 数据保留到期: DELETE FROM inquiries WHERE data_retention_until < datetime('now');
--
-- 7. 数据迁移 (v1 → v2):
--    如果 v1 主表已存在, v2 SQL 中 ALTER TABLE 部分需要单独执行:
--    ALTER TABLE inquiries ADD COLUMN country_code TEXT;
--    ALTER TABLE inquiries ADD COLUMN product_keywords TEXT;
--    ALTER TABLE inquiries ADD COLUMN custom_features TEXT;
--    ALTER TABLE inquiries ADD COLUMN currency TEXT DEFAULT 'USD';
--    ALTER TABLE inquiries ADD COLUMN ai_sentiment TEXT CHECK (ai_sentiment IN ('positive', 'neutral', 'negative'));
--    ALTER TABLE inquiries ADD COLUMN ai_estimated_value_usd REAL;
--    ALTER TABLE inquiries ADD COLUMN utm_source TEXT;
--    ALTER TABLE inquiries ADD COLUMN utm_medium TEXT;
--    ALTER TABLE inquiries ADD COLUMN utm_campaign TEXT;
--    ALTER TABLE inquiries ADD COLUMN utm_content TEXT;
--    ALTER TABLE inquiries ADD COLUMN utm_term TEXT;
--    ALTER TABLE inquiries ADD COLUMN device_type TEXT;
--    ALTER TABLE inquiries ADD COLUMN browser_name TEXT;
--    ALTER TABLE inquiries ADD COLUMN os_name TEXT;
--    ALTER TABLE inquiries ADD COLUMN referrer_url TEXT;
--    ALTER TABLE inquiries ADD COLUMN assigned_to TEXT;
--    ALTER TABLE inquiries ADD COLUMN gdpr_consent_at TEXT;
--    ALTER TABLE inquiries ADD COLUMN data_retention_until TEXT;
--    ALTER TABLE inquiries ADD COLUMN deleted_at TEXT;
--    (执行前先 PRAGMA table_info(inquiries); 检查已存在的列)
