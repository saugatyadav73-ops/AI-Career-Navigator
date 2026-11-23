/** Assessments (technical/aptitude/communication/adaptive, server-graded), weak topics, progress, planner, daily goals, roadmap unlock/adapt. */
const express = require("express");
const jwt = require("jsonwebtoken");
const db = require("../database");
const K = require("../ai/knowledge");
const B = require("../ai/questionBank");
const X = require("../ai/extraBank");
const { requireAuth, V, bad } = require("./middleware");
const U = require("./util");

const router = express.Router();
router.use("/api/assessments", requireAuth);
router.use("/api/planner", requireAuth);

const LEVELS = ["beginner", "medium", "advanced"];
const normLevel = (l) => { const s = String(l || "beginner").toLowerCase(); return s === "intermediate" ? "medium" : LEVELS.includes(s) ? s : "beginner"; };
const TYPES = ["technical", "skill", "aptitude", "communication"];

// ---------------------------------------------------------------- question pools
function customPool(subject) {
  return db.prepare("SELECT * FROM custom_questions WHERE active = 1 AND lower(subject) = lower(?)").all(subject).map((r) => {
    const options = U.safeParse(r.options, []);
    return { topic: r.subject.toLowerCase(), level: normLevel(r.level), question: r.question, correctAnswer: r.correct, options, explanation: r.explanation || "" };
  }).filter((x) => x.options.length >= 2 && x.options.includes(x.correctAnswer));
}
function getPool(type, subject) {
  if (type === "aptitude") return { subject: "aptitude", pool: X.APTITUDE };
  if (type === "communication") return { subject: "communication", pool: X.COMMUNICATION };
  const key = B.resolveSubject(subject) || null;
  const base = key ? B.SUBJECT_BANK[key].map((x) => ({ ...x, topic: key })) : [];
  const extra = customPool(key || String(subject || ""));
  return { subject: key || String(subject || "").toLowerCase(), pool: [...base, ...extra] };
}
const order = (level) => { const l = normLevel(level); return l === "advanced" ? ["advanced", "medium", "beginner"] : l === "medium" ? ["medium", "beginner", "advanced"] : ["beginner", "medium", "advanced"]; };
function pick(pool, level, askedSet) {
  for (const lvl of order(level)) {
    const c = B.shuffle(pool.filter((x) => x.level === lvl && !askedSet.has(x.question)));
    if (c.length) return c[0];
  }
  return null;
}
const publicQ = (x, id) => ({ id, question: x.question, options: B.shuffle(x.options), topic: x.topic, difficulty: x.level });
const sign = (payload, mins = 45) => jwt.sign({ ...payload, purpose: "assessment" }, process.env.JWT_SECRET, { expiresIn: `${mins}m` });
function unsign(token, sid) {
  try { const p = jwt.verify(token, process.env.JWT_SECRET); return p.purpose === "assessment" && p.sid === sid ? p : null; } catch { return null; }
}

router.get("/api/assessments/types", (req, res) => res.json({ success: true,
  types: [{ type: "technical", needsSubject: true, subjects: B.listSubjects() }, { type: "aptitude", questions: X.APTITUDE.length }, { type: "communication", questions: X.COMMUNICATION.length }],
  modes: ["standard", "adaptive"] }));

// ---------------------------------------------------------------- standard attempt: start -> submit (server-side grading)
router.post("/api/assessments/start", (req, res) => {
  const type = V.oneOf(req.body?.type, TYPES, "technical");
  const { subject, pool } = getPool(type, req.body?.subject);
  if (!pool.length) return bad(res, `No questions available for "${V.str(req.body?.subject, 60)}". Try a listed subject.`, 404);
  const count = V.int(req.body?.count, 8, 3, 20);
  const level = normLevel(req.body?.difficulty);
  const chosen = []; const asked = new Set();
  while (chosen.length < Math.min(count, pool.length)) { const x = pick(pool, level, asked); if (!x) break; asked.add(x.question); chosen.push(x); }
  const answers = {}; const meta = {};
  const questions = chosen.map((x, i) => { answers[i + 1] = x.correctAnswer; meta[i + 1] = { e: x.explanation || "", t: x.topic || subject }; return publicQ(x, i + 1); });
  res.json({ success: true, type, subject, attemptToken: sign({ sid: req.studentId, type: type === "skill" ? "technical" : type, subject, answers, meta }), questions });
});

function saveAttempt(sid, rec) {
  const id = U.addHistory(sid, "assessment", rec);
  const x = [U.awardXp(sid, "assessment_submit", { meta: { subject: rec.subject, percent: rec.percent } })];
  if (rec.percent === 100 && rec.total >= 3) x.push(U.awardXp(sid, "perfect_score", { meta: { subject: rec.subject } }));
  return { id, xp: x.reduce((a, r) => a + (r.awarded || 0), 0), newBadges: x.flatMap((r) => r.newBadges || []) };
}

router.post("/api/assessments/submit", (req, res) => {
  const t = unsign(req.body?.attemptToken, req.studentId);
  if (!t) return bad(res, "This attempt has expired or is invalid. Please start again.");
  const given = req.body?.answers && typeof req.body.answers === "object" ? req.body.answers : {};
  const topicAgg = {}; const review = []; let correct = 0;
  for (const [id, right] of Object.entries(t.answers)) {
    const mine = typeof given[id] === "string" ? given[id] : null;
    const ok = mine === right; if (ok) correct++;
    const topic = t.meta[id]?.t || t.subject;
    const o = (topicAgg[topic] ||= { topic, correct: 0, total: 0 }); o.total++; if (ok) o.correct++;
    review.push({ id: Number(id), yourAnswer: mine, correctAnswer: right, correct: ok, explanation: t.meta[id]?.e || "" });
  }
  const total = Object.keys(t.answers).length;
  const percent = total ? Math.round((correct / total) * 100) : 0;
  const rec = { type: t.type, subject: t.subject, mode: "standard", score: correct, total, percent, topics: Object.values(topicAgg) };
  const saved = saveAttempt(req.studentId, rec);
  res.json({ success: true, result: { ...rec, level: percent >= 80 ? "Strong" : percent >= 60 ? "Good" : percent >= 40 ? "Developing" : "Needs work" }, review, saved });
});

// client-side assessments (existing pages) can still push their result into the server history
router.post("/api/assessments/record", (req, res) => {
  const total = V.int(req.body?.total, 0, 1, 500), score = V.int(req.body?.score, 0, 0, total);
  const rec = { type: V.oneOf(req.body?.type, ["technical", "skill", "aptitude", "communication", "interest"], "skill"), subject: V.str(req.body?.subject, 60).toLowerCase() || "general", mode: "recorded", score, total, percent: Math.round((score / total) * 100), topics: [] };
  res.json({ success: true, saved: saveAttempt(req.studentId, rec), result: rec });
});

// ---------------------------------------------------------------- adaptive quiz (difficulty follows performance)
router.post("/api/assessments/adaptive/start", (req, res) => {
  const type = V.oneOf(req.body?.type, TYPES, "technical");
  const { subject, pool } = getPool(type, req.body?.subject);
  if (!pool.length) return bad(res, `No questions available for "${V.str(req.body?.subject, 60)}".`, 404);
  const total = Math.min(V.int(req.body?.total, 8, 4, 15), pool.length);
  const level = normLevel(req.body?.startLevel || "medium");
  const first = pick(pool, level, new Set());
  const state = { sid: req.studentId, type: type === "skill" ? "technical" : type, subject, total, level, asked: [first.question], history: [], cur: { c: first.correctAnswer, e: first.explanation || "", t: first.topic || subject, l: first.level } };
  res.json({ success: true, adaptive: true, subject, index: 1, total, question: publicQ(first, 1), attemptToken: sign(state, 60) });
});
router.post("/api/assessments/adaptive/answer", (req, res) => {
  const st = unsign(req.body?.attemptToken, req.studentId);
  if (!st || !st.cur) return bad(res, "This attempt has expired or is invalid. Please start again.");
  const mine = typeof req.body?.answer === "string" ? req.body.answer : null;
  const ok = mine === st.cur.c;
  const history = [...st.history, { topic: st.cur.t, level: st.cur.l, correct: ok }];
  const feedback = { correct: ok, correctAnswer: st.cur.c, explanation: st.cur.e };
  // next level: step up after a correct answer, down after a wrong one
  const idx = LEVELS.indexOf(normLevel(st.cur.l));
  const nextLevel = LEVELS[Math.max(0, Math.min(2, idx + (ok ? 1 : -1)))];
  if (history.length >= st.total) {
    const topics = {}; for (const h of history) { const o = (topics[h.topic] ||= { topic: h.topic, correct: 0, total: 0 }); o.total++; if (h.correct) o.correct++; }
    const score = history.filter((h) => h.correct).length;
    // weight harder questions more for the ability estimate
    const wt = { beginner: 1, medium: 2, advanced: 3 };
    const ability = Math.round((history.reduce((a, h) => a + (h.correct ? wt[normLevel(h.level)] : 0), 0) / history.reduce((a, h) => a + wt[normLevel(h.level)], 0)) * 100);
    const rec = { type: st.type, subject: st.subject, mode: "adaptive", score, total: history.length, percent: Math.round((score / history.length) * 100), abilityScore: ability, topics: Object.values(topics), path: history.map((h) => h.level) };
    return res.json({ success: true, finished: true, feedback, result: rec, saved: saveAttempt(req.studentId, rec) });
  }
  const { pool } = getPool(st.type, st.subject);
  const nxt = pick(pool, nextLevel, new Set(st.asked));
  if (!nxt) return res.json({ success: true, finished: true, feedback, result: { type: st.type, subject: st.subject, mode: "adaptive", score: history.filter((h) => h.correct).length, total: history.length, percent: Math.round((history.filter((h) => h.correct).length / history.length) * 100), topics: [] }, note: "Question pool exhausted." });
  const state = { ...st, level: nextLevel, asked: [...st.asked, nxt.question], history, cur: { c: nxt.correctAnswer, e: nxt.explanation || "", t: nxt.topic || st.subject, l: nxt.level } };
  delete state.exp; delete state.iat;
  res.json({ success: true, finished: false, feedback, index: history.length + 1, total: st.total, question: publicQ(nxt, history.length + 1), attemptToken: sign(state, 60) });
});

// ---------------------------------------------------------------- history / weak topics / progress / reassessment
router.get("/api/assessments/history", (req, res) => {
  let items = U.listHistory(req.studentId, "assessment", 200);
  if (req.query.type) items = items.filter((i) => i.type === req.query.type);
  if (req.query.subject) items = items.filter((i) => String(i.subject).toLowerCase() === String(req.query.subject).toLowerCase());
  res.json({ success: true, items: items.slice(0, V.int(req.query.limit, 50, 1, 200)) });
});
router.get("/api/assessments/weak-topics", (req, res) => {
  const a = U.assessmentStats(req.studentId);
  res.json({ success: true, weakTopics: a.weakTopics.map((t) => ({ ...t, resources: K.resourcesFor(t.topic).slice(0, 2) })), threshold: 60, note: a.weakTopics.length ? "Topics below 60% across at least 3 answered questions." : "No weak topics detected yet (need at least 3 answered questions per topic)." });
});
router.get("/api/assessments/progress", (req, res) => {
  const a = U.assessmentStats(req.studentId);
  res.json({ success: true, average: a.average, attempts: a.totalAttempts,
    skills: a.subjects.map((s) => ({ ...s, trend: s.attempts < 2 ? "new" : s.latest > s.previous ? "improving" : s.latest < s.previous ? "declining" : "steady" })),
    reassessment: a.subjects.filter((s) => s.attempts >= 2).map((s) => ({ subject: s.subject, type: s.type, previous: s.previous, latest: s.latest, delta: s.latest - s.previous })) });
});

// ---------------------------------------------------------------- learning time estimator
const BASE_HOURS = { 3: 40, 2: 25, 1: 12 };
const LEVEL_FACTOR = { beginner: 1, intermediate: 0.7, medium: 0.7, advanced: 0.45 };
function estimate(skills, roleId, hoursPerWeek, level) {
  const role = roleId ? K.ROLES.find((r) => r.id === roleId) : null;
  const weights = new Map((role?.skills || []).map(([s, w]) => [s, w]));
  const items = skills.map((s) => { const n = K.normSkill(s); const w = weights.get(n) || 2; const h = Math.round(BASE_HOURS[w] * (LEVEL_FACTOR[level] ?? 1)); return { skill: K.pretty(n), weight: w, hours: h, weeks: Math.max(1, Math.ceil(h / hoursPerWeek)) }; });
  const hours = items.reduce((a, i) => a + i.hours, 0);
  return { items, totalHours: hours, totalWeeks: hours ? Math.ceil(hours / hoursPerWeek) : 0, hoursPerWeek };
}
router.post("/api/planner/estimate", (req, res) => {
  const role = U.targetRoleOf(req.studentId, V.str(req.body?.targetRole, 100));
  const skills = V.list(req.body?.skills, 25);
  if (!skills.length) return bad(res, "Provide at least one skill to estimate.");
  const hpw = V.int(req.body?.hoursPerWeek, 8, 1, 80);
  res.json({ success: true, targetRole: role?.name || null, estimate: estimate(skills, role?.id, hpw, V.str(req.body?.level, 20).toLowerCase() || "beginner"), note: "Estimates are planning guides based on skill weight and your level, not guarantees." });
});

// ---------------------------------------------------------------- weekly planner
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
function weekStart(d = new Date()) { const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7)); return x; }
const iso = (d) => d.toISOString().slice(0, 10);
function neededSkills(sid, roleId, explicit) {
  if (explicit.length) return explicit.map(K.normSkill);
  const profile = U.loadProfile(sid); const have = new Set(U.profileSkills(profile));
  const role = roleId ? K.ROLES.find((r) => r.id === roleId) : U.targetRoleOf(sid);
  const weak = U.assessmentStats(sid).weakTopics.map((t) => t.topic);
  const gaps = (role?.skills || []).filter(([s]) => !have.has(s)).sort((a, b) => b[1] - a[1]).map(([s]) => s);
  return [...new Set([...weak, ...gaps])].slice(0, 6);
}
router.post("/api/planner/weekly", (req, res) => {
  const role = U.targetRoleOf(req.studentId, V.str(req.body?.targetRole, 100));
  const settings = U.getDoc(req.studentId, "settings", {}) || {};
  const hpw = V.int(req.body?.hoursPerWeek, settings.weeklyStudyHours || 8, 2, 60);
  const skills = neededSkills(req.studentId, role?.id, V.list(req.body?.skills, 8));
  if (!skills.length) return bad(res, "No skill gaps found to plan for. Add skills to your profile target or pass `skills` explicitly.", 422);
  const start = weekStart();
  const perDay = Math.round((hpw * 60) / 6 / 15) * 15 || 30; // Mon-Sat study, Sunday revision/rest
  let n = 0;
  const days = DAYS.map((name, i) => {
    const date = iso(new Date(start.getTime() + i * 86400000));
    if (i === 6) return { day: name, date, tasks: [{ id: `t${++n}`, title: "Weekly revision: review notes and redo weak quiz questions", skill: "revision", minutes: Math.max(30, Math.round(perDay / 2)), done: false }] };
    const skill = skills[i % skills.length]; const r = K.resourcesFor(skill);
    const lesson = Math.floor(i / skills.length);
    const title = lesson === 0 ? `Learn ${K.pretty(skill)} fundamentals` : lesson === 1 ? `Practice ${K.pretty(skill)} with exercises` : `Build a mini task using ${K.pretty(skill)}`;
    return { day: name, date, tasks: [{ id: `t${++n}`, title, skill: K.pretty(skill), minutes: perDay, done: false, resource: r[0] ? { title: r[0].title, url: r[0].url } : null }] };
  });
  const plan = { weekStart: iso(start), hoursPerWeek: hpw, targetRole: role?.name || null, skills: skills.map(K.pretty), days, createdAt: new Date().toISOString() };
  U.setDoc(req.studentId, "weekly_plan", plan);
  U.awardXp(req.studentId, "weekly_plan_created", { dedupe: `plan:${plan.weekStart}` });
  res.json({ success: true, plan });
});
router.get("/api/planner/weekly", (req, res) => {
  const plan = U.getDoc(req.studentId, "weekly_plan", null);
  if (!plan) return res.json({ success: true, plan: null });
  const total = plan.days.reduce((a, d) => a + d.tasks.length, 0), done = plan.days.reduce((a, d) => a + d.tasks.filter((t) => t.done).length, 0);
  res.json({ success: true, plan, stale: plan.weekStart !== iso(weekStart()), progress: { done, total, percent: total ? Math.round((done / total) * 100) : 0 } });
});
router.post("/api/planner/weekly/toggle", (req, res) => {
  const plan = U.getDoc(req.studentId, "weekly_plan", null);
  if (!plan) return bad(res, "No weekly plan yet.", 404);
  let found = null;
  for (const d of plan.days) for (const t of d.tasks) if (t.id === req.body?.taskId) { t.done = !t.done; found = t; }
  if (!found) return bad(res, "Task not found.", 404);
  U.setDoc(req.studentId, "weekly_plan", plan);
  const xp = found.done ? U.awardXp(req.studentId, "daily_goal_done", { dedupe: `wk:${plan.weekStart}:${found.id}` }) : null;
  res.json({ success: true, task: found, xp });
});

// ---------------------------------------------------------------- daily goals
const goalDate = (v) => V.date(v) || U.today();
router.get("/api/planner/daily", (req, res) => {
  const date = goalDate(req.query.date);
  const goals = db.prepare("SELECT id, title, done, source, goal_date AS date FROM daily_goals WHERE student_id = ? AND goal_date = ? ORDER BY id").all(req.studentId, date).map((g) => ({ ...g, done: Boolean(g.done) }));
  res.json({ success: true, date, goals, summary: { total: goals.length, done: goals.filter((g) => g.done).length } });
});
router.post("/api/planner/daily", (req, res) => {
  const title = V.str(req.body?.title, 200);
  if (title.length < 3) return bad(res, "Goal title must be at least 3 characters.");
  const date = goalDate(req.body?.date);
  if (db.prepare("SELECT COUNT(*) c FROM daily_goals WHERE student_id = ? AND goal_date = ?").get(req.studentId, date).c >= 15) return bad(res, "Maximum 15 goals per day.");
  const r = db.prepare("INSERT INTO daily_goals (student_id, goal_date, title) VALUES (?,?,?)").run(req.studentId, date, title);
  res.status(201).json({ success: true, goal: { id: Number(r.lastInsertRowid), title, done: false, date } });
});
router.post("/api/planner/daily/from-plan", (req, res) => {
  const plan = U.getDoc(req.studentId, "weekly_plan", null);
  const date = goalDate(req.body?.date);
  const day = plan?.days.find((d) => d.date === date);
  if (!day) return bad(res, "Your weekly plan has no tasks for that date.", 404);
  let added = 0;
  for (const t of day.tasks) {
    if (db.prepare("SELECT 1 x FROM daily_goals WHERE student_id=? AND goal_date=? AND title=?").get(req.studentId, date, t.title)) continue;
    db.prepare("INSERT INTO daily_goals (student_id, goal_date, title, source) VALUES (?,?,?, 'plan')").run(req.studentId, date, t.title); added++;
  }
  res.json({ success: true, added });
});
router.post("/api/planner/daily/:id/toggle", (req, res) => {
  const g = db.prepare("SELECT * FROM daily_goals WHERE id = ? AND student_id = ?").get(req.params.id, req.studentId);
  if (!g) return bad(res, "Goal not found.", 404);
  const done = g.done ? 0 : 1;
  db.prepare("UPDATE daily_goals SET done = ? WHERE id = ?").run(done, g.id);
  const xp = done ? U.awardXp(req.studentId, "daily_goal_done", { dedupe: `goal:${g.id}` }) : null;
  res.json({ success: true, done: Boolean(done), xp });
});
router.delete("/api/planner/daily/:id", (req, res) => {
  const r = db.prepare("DELETE FROM daily_goals WHERE id = ? AND student_id = ?").run(req.params.id, req.studentId);
  r.changes ? res.json({ success: true }) : bad(res, "Goal not found.", 404);
});

// ---------------------------------------------------------------- revision recommendations
router.get("/api/planner/revision", (req, res) => {
  const a = U.assessmentStats(req.studentId);
  const items = a.weakTopics.slice(0, 8).map((t) => ({ topic: t.topic, percent: t.percent, why: `Scored ${t.percent}% over ${t.total} questions`, resources: K.resourcesFor(t.topic).slice(0, 3), suggestedMinutes: t.percent < 40 ? 60 : 30 }));
  const stale = a.subjects.filter((s) => s.attempts >= 1).filter((s) => s.latest < 75).map((s) => ({ subject: s.subject, latest: s.latest })).slice(0, 5);
  res.json({ success: true, revision: items, reassessSuggestions: stale, note: items.length ? "Revise these, then retake the assessment to measure improvement." : "Nothing urgent to revise. Take more assessments so weak areas can be detected." });
});
router.post("/api/planner/revision/done", (req, res) => {
  const topic = V.str(req.body?.topic, 80); if (!topic) return bad(res, "Topic is required.");
  res.json({ success: true, xp: U.awardXp(req.studentId, "revision_done", { dedupe: `rev:${topic.toLowerCase()}:${U.today()}` }) });
});

// ---------------------------------------------------------------- roadmap: module unlock + adaptive re-ordering (works on /api/roadmap/generate output)
function normPhases(v) { return (Array.isArray(v) ? v : []).filter((p) => p && typeof p === "object" && typeof p.skill === "string").slice(0, 40); }
router.post("/api/roadmap/unlock-status", requireAuth, (req, res) => {
  const phases = normPhases(req.body?.phases); const done = new Set(K.normList(req.body?.completedSkills));
  if (!phases.length) return bad(res, "`phases` (from /api/roadmap/generate) is required.");
  let blocked = false; // only the first incomplete module is open; everything after it stays locked
  const out = phases.map((p, i) => {
    const completed = done.has(K.normSkill(p.skill));
    const status = completed ? "completed" : blocked ? "locked" : "unlocked";
    if (!completed) blocked = true;
    return { ...p, status, prerequisite: i === 0 ? null : phases[i - 1].skill };
  });
  res.json({ success: true, phases: out, completed: out.filter((p) => p.status === "completed").length, total: out.length });
});
router.post("/api/roadmap/adapt", requireAuth, (req, res) => {
  const phases = normPhases(req.body?.phases); const done = new Set(K.normList(req.body?.completedSkills));
  const scores = {}; for (const [k, v] of Object.entries(req.body?.quizScores || {})) scores[K.normSkill(k)] = U.clamp(v);
  if (!phases.length) return bad(res, "`phases` (from /api/roadmap/generate) is required.");
  const remaining = phases.filter((p) => !done.has(K.normSkill(p.skill)));
  const rank = (p) => { const s = scores[K.normSkill(p.skill)]; return (s !== undefined && s < 60 ? 0 : 1) * 10 + ({ High: 0, Medium: 1, Low: 2 }[p.priority] ?? 1); };
  const sorted = [...remaining].sort((a, b) => rank(a) - rank(b));
  let week = 1;
  const adapted = sorted.map((p) => {
    const len = Math.max(1, (Number(p.endWeek) || 1) - (Number(p.startWeek) || 1) + 1);
    const s = scores[K.normSkill(p.skill)]; const weak = s !== undefined && s < 60;
    const weeks = weak ? len + 1 : s !== undefined && s >= 80 ? Math.max(1, len - 1) : len;
    const o = { ...p, startWeek: week, endWeek: week + weeks - 1, adaptedReason: weak ? `Quiz score ${s}% - moved earlier and extended` : s !== undefined && s >= 80 ? `Quiz score ${s}% - shortened` : undefined };
    week += weeks; return o;
  });
  res.json({ success: true, phases: adapted, removedCompleted: phases.length - remaining.length, totalWeeks: week - 1 });
});

module.exports = router;
