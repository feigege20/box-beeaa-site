-- ============================================
-- box-beeaa.com 询盘 D1 schema
-- 数据库名: box-beeaa-inquiries
-- 创建时间: 2026-08-11
-- 容量: Cloudflare D1 免费版 100K 行 / 5GB / 5M reads/day
-- ============================================

-- 询盘主表
CREATE TABLE IF NOT EXISTS inquiries (
  id TEXT PRIMARY KEY,                          -- INQ-XXXXXX-XXXX 格式
  created_at TEXT NOT NULL DEFAULT (datetime('now')),  -- UTC ISO 8601
  lang TEXT NOT NULL DEFAULT 'en' CHECK (lang IN ('en', 'zh')),

  -- 客户信息
  name TEXT NOT NULL,
  company TEXT,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  country TEXT NOT NULL,

  -- 产品需求 (JSON 数组)
  product_line TEXT NOT NULL,                   -- JSON: ["drone-case", "instrument-case"]
  size TEXT,
  material TEXT,
  ip_rating TEXT,
  color TEXT,
  foam_insert TEXT,
  logo_print TEXT,

  -- 商务信息
  quantity TEXT NOT NULL,                       -- 字符串保留原始值 (e.g. "500-1000")
  target_price TEXT,
  lead_time TEXT,
  certification TEXT,
  usage TEXT,
  message TEXT,

  -- AI 增强
  ai_category TEXT,                             -- military-tactical-case / drone-case / ...
  ai_urgency TEXT CHECK (ai_urgency IN ('low', 'normal', 'high')),
  ai_translation_zh TEXT,
  ai_translation_en TEXT,

  -- 状态 + 内部管理
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'replied', 'quoted', 'closed', 'spam')),
  notes TEXT,                                   -- admin 后台备注
  ip_address TEXT,
  user_agent TEXT,
  resend_message_id TEXT,                       -- Resend API 返回的 email ID

  -- 索引
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_email ON inquiries(email);
CREATE INDEX IF NOT EXISTS idx_inquiries_lang ON inquiries(lang);
CREATE INDEX IF NOT EXISTS idx_inquiries_urgency ON inquiries(ai_urgency) WHERE ai_urgency IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inquiries_country ON inquiries(country);

-- 触发器: 更新 updated_at
CREATE TRIGGER IF NOT EXISTS trg_inquiries_updated_at
AFTER UPDATE ON inquiries
FOR EACH ROW
BEGIN
  UPDATE inquiries SET updated_at = datetime('now') WHERE id = OLD.id;
END;

-- ============================================
-- 使用说明 (FRED)
-- ============================================
-- 1. Cloudflare Dashboard → Workers & Pages → D1 → Create database
--    Name: box-beeaa-inquiries
--
-- 2. 本地或 Dashboard 里执行本 schema:
--    npx wrangler d1 execute box-beeaa-inquiries --file=./schema/d1-inquiries.sql --remote
--    (去掉 --remote 用于本地 SQLite 测试)
--
-- 3. 把 database_id 填到 wrangler.toml 的 [[d1_databases]] 块
--
-- 4. 部署后, 询盘会自动写入 (如果 env.RESEND_API_KEY 存在且邮件成功)
--
-- 5. Admin 后台: https://box.beeaa.com/api/admin/inquiries
--    Header: X-Admin-Token: <env.ADMIN_TOKEN>
--    查询: ?status=new&limit=50&offset=0
--    更新: PATCH ?id=INQ-XXX, body: {"status": "replied", "notes": "..."}
--
-- 6. 隐私合规:
--    - IP + UA 在 90 天后可清理
--    - GDPR: 客户申请删除时, 单条 DELETE
--    - 加拿大/欧洲客户: 在 message 字段加密存储 (PII)
-- ============================================
