/** Shared helpers: per-student documents/history, notifications, XP/levels/badges/challenges, student snapshot, AI-with-fallback. */
const db = require("../database");
const orchestrator = require("../ai/orchestrator");
const K = require("../ai/knowledge");

const today = () => new Date().toISOString().slice(0, 10);
const safeParse = (t, d = null) => { try { return JSON.parse(t); } catch { return d; } };
const clamp = (n, a = 0, b = 100) => Math.max(a, Math.min(b, Number.isFinite(+n) ? +n : a));

// ------------------------------------------------------------------ documents (1 JSON blob per student per kind)
const MAX_DOC_BYTES = 300 * 1024;
const getDoc = (sid, kind, def = null) => {
  const r = db.prepare("SELECT data FROM student_docs WHERE student_id = ? AND kind = ?").get(sid, kind);
  return r ? safeParse(r.data, def) : def;
};
function setDoc(sid, kind, data) {
  const text = JSON.stringify(data === undefined ? null : data);
  if (Buffer.byteLength(text) > MAX_DOC_BYTES) throw Object.assign(new Error("Data too large."), { status: 413 });
  db.prepare(`INSERT INTO student_docs (student_id, kind, data, updated_at) VALUES (?,?,?,CURRENT_TIMESTAMP)
              ON CONFLICT(student_id, kind) DO UPDATE SET data = excluded.data, updated_at = CURRENT_TIMESTAMP`).run(sid, kind, text);
  return data;
}
const delDoc = (sid, kind) => db.prepare("DELETE FROM student_docs WHERE student_id = ? AND kind = ?").run(sid, kind).changes;

// ------------------------------------------------------------------ history (append-only events)
function addHistory(sid, kind, data) {
  const text = JSON.stringify(data);
  if (Buffer.byteLength(text) > MAX_DOC_BYTES) throw Object.assign(new Error("Data too large."), { status: 413 });
  const r = db.prepare("INSERT INTO student_history (student_id, kind, data) VALUES (?,?,?)").run(sid, kind, text);
  return Number(r.lastInsertRowid);
}
const listHistory = (sid, kind, limit = 50) =>
  db.prepare("SELECT id, data, created_at FROM student_history WHERE student_id = ? AND kind = ? ORDER BY id DESC LIMIT ?").all(sid, kind, limit)
    .map((r) => ({ id: r.id, createdAt: r.created_at, ...safeParse(r.data, {}) }));

// ------------------------------------------------------------------ notifications
function notify(sid, { type = "info", title, body = "", link = "", dedupe = null }) {
  try {
    db.prepare("INSERT OR IGNORE INTO notifications (student_id, type, title, body, link, dedupe) VALUES (?,?,?,?,?,?)")
      .run(sid, type, String(title).slice(0, 200), String(body).slice(0, 500), link, dedupe);
  } catch (e) { console.error("notify failed:", e.message); }
}

// ------------------------------------------------------------------ gamification
const LEVELS = [
  { level: 1, name: "Beginner", xp: 0 }, { level: 2, name: "Explorer", xp: 100 }, { level: 3, name: "Learner", xp: 250 },
  { level: 4, name: "Builder", xp: 500 }, { level: 5, name: "Practitioner", xp: 900 }, { level: 6, name: "Achiever", xp: 1400 },
  { level: 7, name: "Specialist", xp: 2000 }, { level: 8, name: "Expert", xp: 2800 }, { level: 9, name: "Master", xp: 3800 },
  { level: 10, name: "Legend", xp: 5000 },
];
// action -> [points, max awards per day (0 = unlimited)]
const XP_ACTIONS = {
  login_daily: [5, 1], profile_complete: [50, 1], assessment_submit: [20, 5], perfect_score: [30, 3], interview_done: [25, 5],
  project_added: [30, 5], project_completed: [50, 5], certificate_added: [15, 5], daily_goal_done: [10, 10], weekly_plan_created: [15, 1],
  application_added: [5, 10], discussion_post: [5, 5], discussion_reply: [3, 10], roadmap_step: [15, 10], github_analyzed: [10, 1],
  resume_built: [20, 3], team_post: [5, 3], workspace_created: [10, 3], revision_done: [10, 5], challenge_complete: [40, 0],
};
const levelFor = (xp) => { let cur = LEVELS[0]; for (const l of LEVELS) if (xp >= l.xp) cur = l; const next = LEVELS.find((l) => l.xp > xp) || null; return { ...cur, next }; };
const totalXp = (sid) => db.prepare("SELECT COALESCE(SUM(points),0) AS t FROM xp_events WHERE student_id = ?").get(sid).t;

function awardXp(sid, action, { meta = {}, dedupe = null, points = null } = {}) {
  const def = XP_ACTIONS[action];
  if (!def) return { awarded: 0 };
  const [base, daily] = def;
  const d = today();
  if (daily > 0 && db.prepare("SELECT COUNT(*) c FROM xp_events WHERE student_id=? AND action=? AND event_date=?").get(sid, action, d).c >= daily) return { awarded: 0, capped: true };
  const pts = points ?? base;
  const before = totalXp(sid);
  const r = db.prepare("INSERT OR IGNORE INTO xp_events (student_id, action, points, meta, event_date, dedupe) VALUES (?,?,?,?,?,?)")
    .run(sid, action, pts, JSON.stringify(meta).slice(0, 500), d, dedupe);
  if (!r.changes) return { awarded: 0, duplicate: true };
  const after = before + pts;
  if (levelFor(after).level > levelFor(before).level) {
    const l = levelFor(after);
    notify(sid, { type: "level", title: `Level up! You are now Level ${l.level} - ${l.name}`, link: "/community", dedupe: `level:${l.level}` });
  }
  const newBadges = evaluateBadges(sid);
  checkChallenges(sid);
  return { awarded: pts, totalXp: after, newBadges };
}

function streakFor(sid) {
  const days = new Set(db.prepare("SELECT DISTINCT event_date d FROM xp_events WHERE student_id = ?").all(sid).map((r) => r.d));
  const iso = (dt) => dt.toISOString().slice(0, 10);
  let cur = new Date(); let streak = 0;
  if (!days.has(iso(cur))) cur.setUTCDate(cur.getUTCDate() - 1); // streak stays alive until end of today
  while (days.has(iso(cur))) { streak++; cur.setUTCDate(cur.getUTCDate() - 1); }
  const sorted = [...days].sort(); let best = 0, run = 0, prev = null;
  for (const dd of sorted) { run = prev && (Date.parse(dd) - Date.parse(prev)) === 86400000 ? run + 1 : 1; best = Math.max(best, run); prev = dd; }
  return { current: streak, best, activeToday: days.has(today()) };
}

const count = (sql, ...p) => db.prepare(sql).get(...p).c;
const BADGES = [
  { id: "first_steps", name: "First Steps", desc: "Complete your profile", test: (s) => count("SELECT COUNT(*) c FROM xp_events WHERE student_id=? AND action='profile_complete'", s) > 0 },
  { id: "quiz_starter", name: "Quiz Starter", desc: "Finish your first assessment", test: (s) => count("SELECT COUNT(*) c FROM student_history WHERE student_id=? AND kind='assessment'", s) >= 1 },
  { id: "quiz_master", name: "Quiz Master", desc: "Finish 10 assessments", test: (s) => count("SELECT COUNT(*) c FROM student_history WHERE student_id=? AND kind='assessment'", s) >= 10 },
  { id: "perfectionist", name: "Perfectionist", desc: "Score 100% in an assessment", test: (s) => count("SELECT COUNT(*) c FROM xp_events WHERE student_id=? AND action='perfect_score'", s) >= 1 },
  { id: "streak_3", name: "3-Day Streak", desc: "Be active 3 days in a row", test: (s) => streakFor(s).best >= 3 },
  { id: "streak_7", name: "Week Warrior", desc: "Be active 7 days in a row", test: (s) => streakFor(s).best >= 7 },
  { id: "streak_30", name: "Consistency King", desc: "Be active 30 days in a row", test: (s) => streakFor(s).best >= 30 },
  { id: "interviewer", name: "Interview Ready", desc: "Complete 3 mock interviews", test: (s) => count("SELECT COUNT(*) c FROM student_history WHERE student_id=? AND kind='interview'", s) >= 3 },
  { id: "builder", name: "Builder", desc: "Add 3 projects", test: (s) => count("SELECT COUNT(*) c FROM hub_projects WHERE student_id=?", s) >= 3 },
  { id: "certified", name: "Certified", desc: "Add 3 certificates", test: (s) => count("SELECT COUNT(*) c FROM certificates WHERE student_id=?", s) >= 3 },
  { id: "job_hunter", name: "Job Hunter", desc: "Track 5 applications", test: (s) => count("SELECT COUNT(*) c FROM job_applications WHERE student_id=?", s) >= 5 },
  { id: "community", name: "Community Voice", desc: "Post 5 times in discussions", test: (s) => count("SELECT (SELECT COUNT(*) FROM discussions WHERE student_id=?1) + (SELECT COUNT(*) FROM discussion_replies WHERE student_id=?1) c", s) >= 5 },
  { id: "level_5", name: "Practitioner", desc: "Reach level 5", test: (s) => levelFor(totalXp(s)).level >= 5 },
  { id: "xp_1000", name: "1000 XP Club", desc: "Earn 1000 XP", test: (s) => totalXp(s) >= 1000 },
];
function evaluateBadges(sid) {
  const have = new Set(db.prepare("SELECT badge FROM student_badges WHERE student_id = ?").all(sid).map((r) => r.badge));
  const earned = [];
  for (const b of BADGES) {
    if (have.has(b.id)) continue;
    let ok = false; try { ok = b.test(sid); } catch { ok = false; }
    if (ok) {
      db.prepare("INSERT OR IGNORE INTO student_badges (student_id, badge) VALUES (?,?)").run(sid, b.id);
      notify(sid, { type: "badge", title: `Badge earned: ${b.name}`, body: b.desc, link: "/community", dedupe: `badge:${b.id}` });
      earned.push({ id: b.id, name: b.name });
    }
  }
  return earned;
}

// weekly challenges: 3 picked from the pool by ISO week number
const CHALLENGE_POOL = [
  { id: "quiz3", title: "Finish 3 assessments", action: "assessment_submit", target: 3 },
  { id: "goals5", title: "Complete 5 daily goals", action: "daily_goal_done", target: 5 },
  { id: "interview2", title: "Practice 2 mock interviews", action: "interview_done", target: 2 },
  { id: "project1", title: "Add or finish a project", action: "project_added", target: 1 },
  { id: "apps3", title: "Track 3 job applications", action: "application_added", target: 3 },
  { id: "social3", title: "Help peers: 3 posts or replies", action: "discussion_reply", target: 3 },
  { id: "steps3", title: "Complete 3 roadmap steps", action: "roadmap_step", target: 3 },
  { id: "active5", title: "Be active on 5 different days", action: "login_daily", target: 5 },
];
function isoWeek(date = new Date()) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7; d.setUTCDate(d.getUTCDate() + 4 - day);
  const y = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - y) / 86400000 + 1) / 7);
  const mon = new Date(date); mon.setUTCDate(mon.getUTCDate() - ((mon.getUTCDay() + 6) % 7));
  return { key: `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`, week, start: mon.toISOString().slice(0, 10) };
}
function weeklyChallenges(sid) {
  const w = isoWeek();
  const picks = [0, 1, 2].map((i) => CHALLENGE_POOL[(w.week * 3 + i) % CHALLENGE_POOL.length]);
  return { week: w.key, start: w.start, challenges: picks.map((c) => {
    const progress = count("SELECT COUNT(*) c FROM xp_events WHERE student_id=? AND action=? AND event_date>=?", sid, c.action, w.start);
    const done = db.prepare("SELECT 1 x FROM xp_events WHERE student_id=? AND dedupe=?").get(sid, `challenge:${w.key}:${c.id}`);
    return { ...c, progress: Math.min(progress, c.target), completed: Boolean(done), reward: 40 };
  }) };
}
function checkChallenges(sid) {
  try {
    for (const c of weeklyChallenges(sid).challenges) {
      if (!c.completed && c.progress >= c.target) {
        const w = isoWeek();
        const r = awardXp(sid, "challenge_complete", { dedupe: `challenge:${w.key}:${c.id}`, meta: { challenge: c.id } });
        if (r.awarded) notify(sid, { type: "challenge", title: `Weekly challenge complete: ${c.title}`, body: "+40 XP", link: "/community", dedupe: `chal:${w.key}:${c.id}` });
      }
    }
  } catch (e) { console.error("challenge check failed:", e.message); }
}

// ------------------------------------------------------------------ profile + snapshot
const PROFILE_FIELDS = [
  ["fullName", "Full name"], ["phone", "Phone"], ["college", "College"], ["education", "Education"], ["year", "Year of study"],
  ["skills", "Skills"], ["interests", "Interests"], ["careerInterest", "Career interest"], ["projects", "Projects"], ["experience", "Experience"], ["github", "GitHub username"],
];
function profileCompletion(profile = {}) {
  const missing = PROFILE_FIELDS.filter(([k]) => {
    const v = profile[k];
    return Array.isArray(v) ? v.length === 0 : !String(v ?? "").trim();
  }).map(([k, label]) => ({ field: k, label }));
  return { percent: Math.round(((PROFILE_FIELDS.length - missing.length) / PROFILE_FIELDS.length) * 100), missing };
}
function loadProfile(sid) {
  const stu = db.prepare("SELECT name, email FROM students WHERE id = ?").get(sid) || {};
  const p = getDoc(sid, "studentProfile", {}) || {};
  return { ...p, fullName: p.fullName || stu.name, email: p.email || stu.email };
}
const profileSkills = (p) => K.normList(p.skills);
function profileForAi(sid) {
  const p = loadProfile(sid);
  return { name: p.fullName, skills: profileSkills(p), interests: K.normList(p.interests), education: p.education || "", projects: p.projects ? [String(p.projects)] : [], level: "beginner" };
}
function targetRoleOf(sid, explicit) {
  const p = loadProfile(sid);
  return K.findRole(`${explicit || ""} ${p.targetRole || ""} ${p.careerInterest || ""}`) || null;
}

/** Assessment records -> per-subject stats + weak topics. */
function assessmentStats(sid) {
  const rows = listHistory(sid, "assessment", 500).reverse(); // oldest first
  const bySubject = {};
  const topics = {};
  for (const r of rows) {
    const key = `${r.type || "skill"}:${(r.subject || "general").toLowerCase()}`;
    (bySubject[key] ||= { type: r.type || "skill", subject: (r.subject || "general").toLowerCase(), attempts: [] }).attempts.push({ percent: r.percent, at: r.createdAt });
    for (const t of Array.isArray(r.topics) ? r.topics : [{ topic: r.subject || "general", correct: r.score, total: r.total }]) {
      const name = String(t.topic || r.subject || "general").toLowerCase();
      const o = (topics[name] ||= { topic: name, correct: 0, total: 0 });
      o.correct += Number(t.correct) || 0; o.total += Number(t.total) || 0;
    }
  }
  const subjects = Object.values(bySubject).map((s) => {
    const first = s.attempts[0].percent, last = s.attempts[s.attempts.length - 1].percent;
    const prev = s.attempts.length > 1 ? s.attempts[s.attempts.length - 2].percent : null;
    return { type: s.type, subject: s.subject, attempts: s.attempts.length, first, latest: last, previous: prev, change: s.attempts.length > 1 ? last - first : 0, best: Math.max(...s.attempts.map((a) => a.percent)) };
  });
  const weak = Object.values(topics).filter((t) => t.total >= 3).map((t) => ({ ...t, percent: Math.round((t.correct / t.total) * 100) })).filter((t) => t.percent < 60).sort((a, b) => a.percent - b.percent);
  const avg = subjects.length ? Math.round(subjects.reduce((a, s) => a + s.latest, 0) / subjects.length) : null;
  return { subjects, weakTopics: weak, average: avg, totalAttempts: rows.length };
}

function moduleProgressPercent(sid) {
  const mp = getDoc(sid, "moduleProgress", {}) || {};
  const keys = ["profile", "assessment", "interest", "career", "skillGap", "roadmap", "projects", "readiness", "resume", "jobPreparation"];
  return Math.round((keys.filter((k) => mp[k]).length / keys.length) * 100);
}

function studentSnapshot(sid) {
  const stu = db.prepare("SELECT id, name, email, role, created_at, last_active_at, last_login_at, is_active FROM students WHERE id = ?").get(sid);
  if (!stu) return null;
  const profile = loadProfile(sid);
  const completion = profileCompletion(profile);
  const a = assessmentStats(sid);
  const xp = totalXp(sid);
  const apps = db.prepare("SELECT status, COUNT(*) c FROM job_applications WHERE student_id = ? GROUP BY status").all(sid);
  const role = targetRoleOf(sid);
  const cov = role ? (() => { const have = new Set(profileSkills(profile)); let t = 0, g = 0; for (const [s, w] of role.skills) { t += w; if (have.has(s)) g += w; } return t ? Math.round((g / t) * 100) : 0; })() : null;
  const readiness = Math.round(
    (completion.percent * 0.2) + ((a.average ?? 0) * 0.3) + ((cov ?? 0) * 0.3) + (moduleProgressPercent(sid) * 0.2));
  return {
    id: stu.id, name: stu.name, email: stu.email, role: stu.role, college: profile.college || "", joinedAt: stu.created_at,
    lastActiveAt: stu.last_active_at || stu.last_login_at || stu.created_at, active: Number(stu.is_active) === 1,
    profileCompletion: completion.percent, avgScore: a.average, assessmentAttempts: a.totalAttempts, weakTopics: a.weakTopics.slice(0, 5),
    targetRole: role?.name || null, roleCoverage: cov, moduleProgress: moduleProgressPercent(sid), readiness,
    xp, level: levelFor(xp).level, streak: streakFor(sid).current,
    applications: Object.fromEntries(apps.map((r) => [r.status, r.c])),
  };
}

// ------------------------------------------------------------------ AI with deterministic fallback (same contract as routes/features.js)
function parseJson(text) {
  if (typeof text !== "string") return null;
  const t = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  try { return JSON.parse(t); } catch { /* continue */ }
  for (const [o, c] of [["{", "}"], ["[", "]"]]) {
    const s = t.indexOf(o), e = t.lastIndexOf(c);
    if (s !== -1 && e > s) { try { return JSON.parse(t.slice(s, e + 1)); } catch { /* continue */ } }
  }
  return null;
}
async function aiOrRules({ task, prompt, userId, rules, valid = (x) => x && typeof x === "object" }) {
  if (orchestrator.availableProviders().length > 0) {
    try {
      const r = await orchestrator.generate({ task, prompt, userId });
      const data = parseJson(r.text);
      if (valid(data)) return { data, engine: "ai", provider: r.provider, model: r.model };
    } catch (e) { if (e.name !== "AiUnavailableError") console.error(`[${task}]`, e.message); }
  }
  return { data: rules(), engine: "rules" };
}

module.exports = {
  today, safeParse, clamp, getDoc, setDoc, delDoc, addHistory, listHistory, notify, awardXp, streakFor, levelFor, totalXp,
  LEVELS, XP_ACTIONS, BADGES, evaluateBadges, weeklyChallenges, checkChallenges, isoWeek,
  profileCompletion, loadProfile, profileSkills, profileForAi, targetRoleOf, assessmentStats, moduleProgressPercent, studentSnapshot, aiOrRules, PROFILE_FIELDS,
};
