PRAGMA foreign_keys = ON;

-- ============================================
-- 1. 任务表 (tasks)
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    title           TEXT NOT NULL,
    description     TEXT,
    stage           TEXT NOT NULL DEFAULT '6-months',
    status          TEXT DEFAULT 'todo',
    assignee        TEXT NOT NULL,
    due_date        DATE,
    priority        INTEGER DEFAULT 1,
    is_recurring    INTEGER DEFAULT 0,
    recurring_type  TEXT,
    notes           TEXT,
    completed_at    DATETIME,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    CHECK (status IN ('todo', 'doing', 'done')),
    CHECK (assignee IN ('groom', 'bride', 'both')),
    CHECK (priority IN (1, 2, 3))
);

CREATE INDEX IF NOT EXISTS idx_tasks_stage_status ON tasks(stage, status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- ============================================
-- 2. 预算表 (budgets)
-- ============================================
CREATE TABLE IF NOT EXISTS budgets (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    category            TEXT NOT NULL,
    sub_category        TEXT,
    item_name           TEXT NOT NULL,
    estimated_amount    REAL DEFAULT 0.0,
    actual_amount       REAL DEFAULT 0.0,
    is_paid             INTEGER DEFAULT 0,
    paid_date           DATE,
    vendor              TEXT,
    remark              TEXT,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    CHECK (is_paid IN (0, 1))
);

CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category);
CREATE INDEX IF NOT EXISTS idx_budgets_paid ON budgets(is_paid);

-- ============================================
-- 3. 桌台表 (tables)
-- ============================================
CREATE TABLE IF NOT EXISTS tables (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL,
    capacity        INTEGER DEFAULT 10,
    location        TEXT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    CHECK (capacity > 0)
);

-- ============================================
-- 4. 宾客表 (guests)
-- ============================================
CREATE TABLE IF NOT EXISTS guests (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    name                TEXT NOT NULL,
    side                TEXT NOT NULL,
    relation            TEXT,
    phone               TEXT,
    attend_count        INTEGER DEFAULT 1,
    is_invited          INTEGER DEFAULT 0,
    is_confirmed        INTEGER DEFAULT 0,
    confirmed_at        DATETIME,
    gift_amount         REAL DEFAULT 0.0,
    table_id            INTEGER,
    remark              TEXT,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(table_id) REFERENCES tables(id),
    CHECK (is_invited IN (0, 1)),
    CHECK (is_confirmed IN (0, 1)),
    CHECK (attend_count > 0)
);

CREATE INDEX IF NOT EXISTS idx_guests_table ON guests(table_id);
CREATE INDEX IF NOT EXISTS idx_guests_confirmed ON guests(is_confirmed);
CREATE INDEX IF NOT EXISTS idx_guests_side ON guests(side);

-- ============================================
-- 5. 鉴权表 (auth_tokens)
-- ============================================
CREATE TABLE IF NOT EXISTS auth_tokens (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    token           TEXT NOT NULL UNIQUE,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at      DATETIME NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_auth_tokens_token ON auth_tokens(token);

-- ============================================
-- 6. 系统配置表 (settings)
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
    key             TEXT PRIMARY KEY,
    value           TEXT,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 7. 礼金记录表 (gifts)
-- ============================================
CREATE TABLE IF NOT EXISTS gifts (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    guest_name      TEXT NOT NULL,
    amount          REAL NOT NULL DEFAULT 0,
    gift_type       TEXT DEFAULT '现金',
    occasion        TEXT DEFAULT '婚礼',
    date_given      DATE,
    side            TEXT,
    notes           TEXT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gifts_date ON gifts(date_given);

-- ============================================
-- 8. 时光小记表 (diaries)
-- ============================================
CREATE TABLE IF NOT EXISTS diaries (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    author          TEXT NOT NULL DEFAULT '',
    content         TEXT,
    mood            TEXT,
    images          TEXT,
    date            DATE NOT NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_diaries_date ON diaries(date);

-- ============================================
-- 初始数据
-- ============================================
INSERT OR IGNORE INTO settings (key, value) VALUES
    ('wedding_date', '{}'),
    ('bride_name', '{"name": ""}'),
    ('groom_name', '{"name": ""}'),
    ('budget_total', '{"total": 0}');
