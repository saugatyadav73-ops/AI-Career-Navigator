/**
 * Additive schema. Nothing here drops or rewrites existing tables; new tables use
 * CREATE TABLE IF NOT EXISTS and new `students` columns are added only when missing.
 */
const db = require("../database");

function addColumnIfMissing(table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some((c) => c.name === column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

// ---- students: roles, google, reset, activity
addColumnIfMissing("students", "role", "TEXT NOT NULL DEFAULT 'student'");
addColumnIfMissing("students", "is_active", "INTEGER NOT NULL DEFAULT 1");
addColumnIfMissing("students", "google_id", "TEXT");
addColumnIfMissing("students", "avatar_url", "TEXT");
addColumnIfMissing("students", "last_login_at", "DATETIME");
addColumnIfMissing("students", "last_active_at", "DATETIME");
addColumnIfMissing("students", "reset_code_hash", "TEXT");
addColumnIfMissing("students", "reset_expires_at", "DATETIME");
addColumnIfMissing("students", "reset_sent_at", "DATETIME");
addColumnIfMissing("students", "password_changed_at", "DATETIME");

db.exec(`
CREATE TABLE IF NOT EXISTS student_docs (
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (student_id, kind)
);

CREATE TABLE IF NOT EXISTS student_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_hist_student_kind ON student_history(student_id, kind, created_at);

CREATE TABLE IF NOT EXISTS certificates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  title TEXT NOT NULL, issuer TEXT, issue_date TEXT, credential_url TEXT, skills TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_cert_student ON certificates(student_id);

CREATE TABLE IF NOT EXISTS hub_projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  title TEXT NOT NULL, description TEXT, tech TEXT, difficulty TEXT DEFAULT 'beginner',
  status TEXT NOT NULL DEFAULT 'planned', github_url TEXT, live_url TEXT,
  milestones TEXT, score INTEGER, feedback TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_proj_student ON hub_projects(student_id);

CREATE TABLE IF NOT EXISTS job_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  company TEXT NOT NULL, title TEXT NOT NULL, kind TEXT NOT NULL DEFAULT 'job',
  status TEXT NOT NULL DEFAULT 'applied', deadline TEXT, url TEXT, notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_app_student ON job_applications(student_id, status);

CREATE TABLE IF NOT EXISTS saved_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  job_ref TEXT NOT NULL, title TEXT NOT NULL, company TEXT, kind TEXT DEFAULT 'job',
  url TEXT, deadline TEXT, data TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (student_id, job_ref)
);

CREATE TABLE IF NOT EXISTS daily_goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  goal_date TEXT NOT NULL, title TEXT NOT NULL, done INTEGER NOT NULL DEFAULT 0, source TEXT DEFAULT 'custom',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_goal_student_date ON daily_goals(student_id, goal_date);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  type TEXT NOT NULL, title TEXT NOT NULL, body TEXT, link TEXT,
  is_read INTEGER NOT NULL DEFAULT 0, dedupe TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (student_id, dedupe)
);
CREATE INDEX IF NOT EXISTS idx_notif_student ON notifications(student_id, is_read);

CREATE TABLE IF NOT EXISTS xp_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  action TEXT NOT NULL, points INTEGER NOT NULL, meta TEXT,
  event_date TEXT NOT NULL, dedupe TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (student_id, dedupe)
);
CREATE INDEX IF NOT EXISTS idx_xp_student_date ON xp_events(student_id, event_date);

CREATE TABLE IF NOT EXISTS student_badges (
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  badge TEXT NOT NULL, earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (student_id, badge)
);

CREATE TABLE IF NOT EXISTS discussions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  title TEXT NOT NULL, body TEXT NOT NULL, topic TEXT DEFAULT 'general',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS discussion_replies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  discussion_id INTEGER NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  body TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS team_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  title TEXT NOT NULL, description TEXT, skills_needed TEXT, hackathon_id INTEGER,
  status TEXT NOT NULL DEFAULT 'open', created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS team_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL REFERENCES team_posts(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  message TEXT, status TEXT NOT NULL DEFAULT 'pending', created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (post_id, student_id)
);

CREATE TABLE IF NOT EXISTS hackathons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  added_by INTEGER REFERENCES students(id) ON DELETE SET NULL,
  title TEXT NOT NULL, organizer TEXT, mode TEXT DEFAULT 'online', location TEXT,
  start_date TEXT, end_date TEXT, deadline TEXT, url TEXT, tags TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workspaces (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  name TEXT NOT NULL, description TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS workspace_members (
  workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  PRIMARY KEY (workspace_id, student_id)
);
CREATE TABLE IF NOT EXISTS workspace_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'todo',
  assignee_id INTEGER REFERENCES students(id) ON DELETE SET NULL,
  created_by INTEGER REFERENCES students(id) ON DELETE SET NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS workspace_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  body TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL, skill TEXT, provider TEXT, url TEXT, level TEXT DEFAULT 'beginner', hours INTEGER,
  added_by INTEGER REFERENCES students(id) ON DELETE SET NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS custom_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject TEXT NOT NULL, level TEXT NOT NULL DEFAULT 'beginner', question TEXT NOT NULL,
  options TEXT NOT NULL, correct TEXT NOT NULL, explanation TEXT, active INTEGER NOT NULL DEFAULT 1,
  added_by INTEGER REFERENCES students(id) ON DELETE SET NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_cq_subject ON custom_questions(subject, active);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_id INTEGER, actor_role TEXT, action TEXT NOT NULL, target TEXT, details TEXT, ip TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
`);

module.exports = { addColumnIfMissing };
