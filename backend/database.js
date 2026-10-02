const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "career_navigator.db");

const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

// =====================================================
// CREATE STUDENTS TABLE
// =====================================================

db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// =====================================================
// AI ORCHESTRATION LOG TABLE
// =====================================================

db.exec(`
  CREATE TABLE IF NOT EXISTS ai_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT,
    status TEXT NOT NULL CHECK (status IN ('success','error','skipped')),
    latency_ms INTEGER,
    prompt_hash TEXT,
    prompt_chars INTEGER,
    prompt_preview TEXT,
    response_preview TEXT,
    error TEXT,
    student_id INTEGER REFERENCES students(id) ON DELETE SET NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_ai_logs_task ON ai_logs(task);
  CREATE INDEX IF NOT EXISTS idx_ai_logs_created ON ai_logs(created_at);
`);

// =====================================================
// USER FEEDBACK TABLE (quantitative + verbatim feedback)
// =====================================================

db.exec(`
  CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER REFERENCES students(id) ON DELETE SET NULL,
    feature TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// =====================================================
// DATABASE MIGRATION HELPER
// Adds a column only if it does not already exist.
// =====================================================

const addColumnIfMissing = (tableName, columnName, definition) => {
  const columns = db
    .prepare(`PRAGMA table_info(${tableName})`)
    .all();

  const exists = columns.some(
    (column) => column.name === columnName
  );

  if (!exists) {
    db.exec(
      `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`
    );

    return true;
  }

  return false;
};

// =====================================================
// EMAIL VERIFICATION COLUMNS
// =====================================================

const emailVerifiedAdded = addColumnIfMissing(
  "students",
  "email_verified",
  "INTEGER NOT NULL DEFAULT 0"
);

addColumnIfMissing(
  "students",
  "verification_code_hash",
  "TEXT"
);

addColumnIfMissing(
  "students",
  "verification_expires_at",
  "DATETIME"
);

addColumnIfMissing(
  "students",
  "verification_sent_at",
  "DATETIME"
);

// =====================================================
// PRESERVE EXISTING ACCOUNTS
// =====================================================
// Existing accounts created before email verification
// are treated as already verified.
//
// Only runs when the email_verified column is added for
// the first time. New registrations will still get
// email_verified = 0.

if (emailVerifiedAdded) {
  db.prepare(`
    UPDATE students
    SET email_verified = 1
    WHERE email_verified = 0
  `).run();
}

// =====================================================
// EXPORT DATABASE
// =====================================================

module.exports = db;