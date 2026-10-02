-- AI Career Navigator - SQLite schema (auto-created by backend/database.js)
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS students (
  id                      INTEGER PRIMARY KEY AUTOINCREMENT,
  name                    TEXT NOT NULL,
  email                   TEXT NOT NULL UNIQUE,
  password                TEXT NOT NULL,                 -- bcrypt hash
  created_at              DATETIME DEFAULT CURRENT_TIMESTAMP,
  email_verified          INTEGER NOT NULL DEFAULT 0,    -- 0 / 1
  verification_code_hash  TEXT,                          -- bcrypt hash of 6-digit code
  verification_expires_at DATETIME,
  verification_sent_at    DATETIME
);

CREATE TABLE IF NOT EXISTS ai_logs (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  task             TEXT NOT NULL,        -- career_analysis, skill_gap_questions, ...
  provider         TEXT NOT NULL,        -- openai | gemini | huggingface | none
  model            TEXT,
  status           TEXT NOT NULL CHECK (status IN ('success','error','skipped')),
  latency_ms       INTEGER,
  prompt_hash      TEXT,                 -- sha256 prefix, for dedupe/tracing
  prompt_chars     INTEGER,
  prompt_preview   TEXT,                 -- first 1000 chars
  response_preview TEXT,                 -- first 1000 chars
  error            TEXT,
  student_id       INTEGER REFERENCES students(id) ON DELETE SET NULL,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ai_logs_task    ON ai_logs(task);
CREATE INDEX IF NOT EXISTS idx_ai_logs_created ON ai_logs(created_at);

CREATE TABLE IF NOT EXISTS feedback (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id  INTEGER REFERENCES students(id) ON DELETE SET NULL,
  feature     TEXT NOT NULL,
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
