/** Faculty & admin: dashboards, student/college analytics, at-risk detection, user/assessment/course management, exports, audit logs. */
const express = require("express");
const db = require("../database");
const K = require("../ai/knowledge");
const { requireAuth, requireRole, audit, V, bad } = require("./middleware");
const U = require("./util");

const router = express.Router();
const staff = [requireAuth, requireRole("faculty", "admin")];
const adminOnly = [requireAuth, requireRole("admin")];

const studentIds = (q = "", college = "") => {
  const rows = db.prepare("SELECT id, name, email FROM students WHERE role = 'student' AND is_active = 1 ORDER BY id").all();
  return rows.filter((r) => {
    const ql = q.toLowerCase(); if (ql && !`${r.name} ${r.email}`.toLowerCase().includes(ql)) return false;
    if (college && !String(U.loadProfile(r.id).college || "").toLowerCase().includes(college.toLowerCase())) return false; return true;
  }).map((r) => r.id);
};
const AT_RISK = { inactiveDays: 14, lowScore: 40, lowProfile: 40 };
function riskOf(s) {
  const reasons = []; const days = s.lastActiveAt ? Math.floor((Date.now() - Date.parse(String(s.lastActiveAt).replace(" ", "T") + (String(s.lastActiveAt).includes("Z") ? "" : "Z"))) / 86400000) : null;
  if (days === null || days >= AT_RISK.inactiveDays) reasons.push(`Inactive for ${days ?? "many"} days`);
  if (s.avgScore !== null && s.avgScore < AT_RISK.lowScore) reasons.push(`Low assessment average (${s.avgScore}%)`);
  if (s.assessmentAttempts === 0) reasons.push("No assessments taken");
  if (s.profileCompletion < AT_RISK.lowProfile) reasons.push(`Profile only ${s.profileCompletion}% complete`);
  if (s.weakTopics.length >= 3) reasons.push(`${s.weakTopics.length} weak topics`);
  return { level: reasons.length >= 3 ? "high" : reasons.length === 2 ? "medium" : reasons.length === 1 ? "low" : "none", reasons, inactiveDays: days };
}
const withRisk = (s) => ({ ...s, risk: riskOf(s) });

// ---------------------------------------------------------------- faculty: students
router.get("/api/faculty/students", ...staff, (req, res) => {
  const list = studentIds(V.str(req.query.q, 80), V.str(req.query.college, 80)).map((id) => withRisk(U.studentSnapshot(id)));
  const sort = V.oneOf(req.query.sort, ["readiness", "avgScore", "xp", "name", "risk"], "readiness"); const rank = { high: 3, medium: 2, low: 1, none: 0 };
  list.sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : sort === "risk" ? rank[b.risk.level] - rank[a.risk.level] : (b[sort] ?? -1) - (a[sort] ?? -1));
  const page = V.int(req.query.page, 1, 1, 1000), size = V.int(req.query.pageSize, 25, 1, 100);
  res.json({ success: true, total: list.length, page, pageSize: size, students: list.slice((page - 1) * size, page * size) });
});
router.get("/api/faculty/students/:id", ...staff, (req, res) => {
  const id = V.int(req.params.id, -1); const row = db.prepare("SELECT id, role FROM students WHERE id=?").get(id);
  if (!row || row.role !== "student") return bad(res, "Student not found.", 404);
  audit(req, "faculty.view_student", String(id));
  const snap = U.studentSnapshot(id); const a = U.assessmentStats(id);
  res.json({ success: true, student: withRisk(snap), assessments: a, recentAssessments: U.listHistory(id, "assessment", 10), interviews: U.listHistory(id, "interview", 10).map((i) => ({ type: i.type, role: i.role, score: i.score, createdAt: i.createdAt })),
    projects: db.prepare("SELECT title, status, score FROM hub_projects WHERE student_id=?").all(id), certificates: db.prepare("SELECT COUNT(*) c FROM certificates WHERE student_id=?").get(id).c });
});
router.get("/api/faculty/at-risk", ...staff, (req, res) => {
  const list = studentIds().map((id) => withRisk(U.studentSnapshot(id))).filter((s) => s.risk.level !== "none").sort((a, b) => b.risk.reasons.length - a.risk.reasons.length);
  res.json({ success: true, criteria: AT_RISK, count: list.length, students: list.map((s) => ({ id: s.id, name: s.name, email: s.email, college: s.college, risk: s.risk, readiness: s.readiness, avgScore: s.avgScore })) });
});
router.get("/api/faculty/analytics", ...staff, (req, res) => {
  const snaps = studentIds(V.str(req.query.q, 80), V.str(req.query.college, 80)).map((id) => ({ id, ...U.studentSnapshot(id) }));
  const avg = (arr) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null);
  const subjects = {}, roles = {}, skills = {};
  for (const s of snaps) {
    for (const x of U.assessmentStats(s.id).subjects) (subjects[x.subject] ||= []).push(x.latest);
    if (s.targetRole) roles[s.targetRole] = (roles[s.targetRole] || 0) + 1;
    for (const k of U.profileSkills(U.loadProfile(s.id))) skills[k] = (skills[k] || 0) + 1;
  }
  const risk = snaps.map(withRisk).reduce((o, s) => ({ ...o, [s.risk.level]: (o[s.risk.level] || 0) + 1 }), {});
  res.json({ success: true, analytics: { students: snaps.length, averageReadiness: avg(snaps.map((s) => s.readiness)), averageProfileCompletion: avg(snaps.map((s) => s.profileCompletion)), averageAssessmentScore: avg(snaps.filter((s) => s.avgScore !== null).map((s) => s.avgScore)),
    activeLast7Days: snaps.filter((s) => riskOf(s).inactiveDays !== null && riskOf(s).inactiveDays <= 7).length, risk,
    subjectAverages: Object.entries(subjects).map(([subject, v]) => ({ subject, average: avg(v), students: v.length })).sort((a, b) => a.average - b.average),
    careerInterest: Object.entries(roles).map(([career, students]) => ({ career, students })).sort((a, b) => b.students - a.students),
    topSkills: Object.entries(skills).map(([s, students]) => ({ skill: K.pretty(s), students })).sort((a, b) => b.students - a.students).slice(0, 15),
    readinessBands: { "0-39": snaps.filter((s) => s.readiness < 40).length, "40-69": snaps.filter((s) => s.readiness >= 40 && s.readiness < 70).length, "70-100": snaps.filter((s) => s.readiness >= 70).length } } });
});

// ---------------------------------------------------------------- admin: overview, users, audit
router.get("/api/admin/overview", ...adminOnly, (req, res) => {
  const c = (sql, ...p) => db.prepare(sql).get(...p).c;
  res.json({ success: true, overview: {
    users: { total: c("SELECT COUNT(*) c FROM students"), students: c("SELECT COUNT(*) c FROM students WHERE role='student'"), faculty: c("SELECT COUNT(*) c FROM students WHERE role='faculty'"), admins: c("SELECT COUNT(*) c FROM students WHERE role='admin'"), deactivated: c("SELECT COUNT(*) c FROM students WHERE is_active=0"),
      newLast7Days: c("SELECT COUNT(*) c FROM students WHERE created_at >= datetime('now','-7 day')"), activeLast7Days: c("SELECT COUNT(*) c FROM students WHERE last_active_at >= datetime('now','-7 day')") },
    content: { assessmentsTaken: c("SELECT COUNT(*) c FROM student_history WHERE kind='assessment'"), interviews: c("SELECT COUNT(*) c FROM student_history WHERE kind='interview'"), projects: c("SELECT COUNT(*) c FROM hub_projects"), certificates: c("SELECT COUNT(*) c FROM certificates"), applications: c("SELECT COUNT(*) c FROM job_applications"), discussions: c("SELECT COUNT(*) c FROM discussions"), customQuestions: c("SELECT COUNT(*) c FROM custom_questions WHERE active=1"), courses: c("SELECT COUNT(*) c FROM courses") },
    ai: { last24h: db.prepare("SELECT status, COUNT(*) c FROM ai_logs WHERE created_at >= datetime('now','-1 day') GROUP BY status").all() } } });
});
router.get("/api/admin/users", ...adminOnly, (req, res) => {
  const q = V.str(req.query.q, 80).toLowerCase(), role = V.oneOf(req.query.role, ["student", "faculty", "admin"], null);
  const rows = db.prepare("SELECT id, name, email, role, is_active, created_at, last_active_at, google_id FROM students ORDER BY id DESC").all().filter((r) => (!role || r.role === role) && (!q || `${r.name} ${r.email}`.toLowerCase().includes(q)));
  const page = V.int(req.query.page, 1, 1, 1000), size = V.int(req.query.pageSize, 25, 1, 100);
  res.json({ success: true, total: rows.length, page, pageSize: size, users: rows.slice((page - 1) * size, page * size).map((r) => ({ id: r.id, name: r.name, email: r.email, role: r.role, active: Boolean(r.is_active), createdAt: r.created_at, lastActiveAt: r.last_active_at, google: Boolean(r.google_id) })) });
});
router.patch("/api/admin/users/:id", ...adminOnly, (req, res) => {
  const id = V.int(req.params.id, -1); const u = db.prepare("SELECT id, role, is_active FROM students WHERE id=?").get(id); if (!u) return bad(res, "User not found.", 404);
  const role = req.body?.role === undefined ? u.role : V.oneOf(req.body.role, ["student", "faculty", "admin"], null); if (!role) return bad(res, "role must be student, faculty or admin.");
  const active = typeof req.body?.isActive === "boolean" ? (req.body.isActive ? 1 : 0) : u.is_active;
  const losingAdmin = u.role === "admin" && (role !== "admin" || active === 0);
  if (losingAdmin && db.prepare("SELECT COUNT(*) c FROM students WHERE role='admin' AND is_active=1").get().c <= 1) return bad(res, "At least one active admin must remain.", 409);
  db.prepare("UPDATE students SET role=?, is_active=? WHERE id=?").run(role, active, id);
  audit(req, "admin.update_user", String(id), { role, active: Boolean(active), previousRole: u.role }); res.json({ success: true });
});
router.get("/api/admin/audit", ...adminOnly, (req, res) => {
  const action = V.str(req.query.action, 60);
  const rows = db.prepare(`SELECT a.id, a.actor_id AS actorId, s.email AS actorEmail, a.actor_role AS actorRole, a.action, a.target, a.details, a.ip, a.created_at AS createdAt FROM audit_logs a LEFT JOIN students s ON s.id = a.actor_id ${action ? "WHERE a.action LIKE ?" : ""} ORDER BY a.id DESC LIMIT ?`).all(...(action ? [`${action}%`] : []), V.int(req.query.limit, 100, 1, 500));
  res.json({ success: true, logs: rows.map((r) => ({ ...r, details: U.safeParse(r.details, {}) })) });
});

// ---------------------------------------------------------------- assessment management (question bank additions)
const qOut = (r) => ({ id: r.id, subject: r.subject, level: r.level, question: r.question, options: U.safeParse(r.options, []), correct: r.correct, explanation: r.explanation, active: Boolean(r.active) });
function readQuestion(b) {
  const options = V.list(b?.options, 6, 200); const correct = V.str(b?.correct, 200); const question = V.str(b?.question, 500), subject = V.str(b?.subject, 60).toLowerCase();
  if (!subject || question.length < 8) return { error: "Subject and a question (8+ chars) are required." };
  if (options.length < 2 || !options.includes(correct)) return { error: "Provide 2-6 options and set `correct` to exactly one of them." };
  return { value: { subject, level: V.oneOf(String(b?.level || "").toLowerCase(), ["beginner", "medium", "advanced"], "beginner"), question, options, correct, explanation: V.str(b?.explanation, 500) } };
}
router.get("/api/manage/questions", ...staff, (req, res) => { const s = V.str(req.query.subject, 60).toLowerCase(); res.json({ success: true, questions: db.prepare(`SELECT * FROM custom_questions ${s ? "WHERE lower(subject)=?" : ""} ORDER BY id DESC LIMIT 300`).all(...(s ? [s] : [])).map(qOut) }); });
router.post("/api/manage/questions", ...staff, (req, res) => {
  const r = readQuestion(req.body); if (r.error) return bad(res, r.error); const v = r.value;
  const x = db.prepare("INSERT INTO custom_questions (subject, level, question, options, correct, explanation, added_by) VALUES (?,?,?,?,?,?,?)").run(v.subject, v.level, v.question, JSON.stringify(v.options), v.correct, v.explanation, req.studentId);
  audit(req, "question.create", String(x.lastInsertRowid), { subject: v.subject }); res.status(201).json({ success: true, id: Number(x.lastInsertRowid) });
});
router.put("/api/manage/questions/:id", ...staff, (req, res) => {
  const cur = db.prepare("SELECT * FROM custom_questions WHERE id=?").get(req.params.id); if (!cur) return bad(res, "Question not found.", 404);
  const r = readQuestion({ ...qOut(cur), ...req.body }); if (r.error) return bad(res, r.error); const v = r.value;
  db.prepare("UPDATE custom_questions SET subject=?, level=?, question=?, options=?, correct=?, explanation=?, active=? WHERE id=?").run(v.subject, v.level, v.question, JSON.stringify(v.options), v.correct, v.explanation, typeof req.body?.active === "boolean" ? (req.body.active ? 1 : 0) : cur.active, cur.id);
  audit(req, "question.update", String(cur.id)); res.json({ success: true });
});
router.delete("/api/manage/questions/:id", ...staff, (req, res) => { const n = db.prepare("DELETE FROM custom_questions WHERE id=?").run(req.params.id).changes; if (n) audit(req, "question.delete", String(req.params.id)); n ? res.json({ success: true }) : bad(res, "Question not found.", 404); });

// ---------------------------------------------------------------- course management (learning resources)
const cOut = (r) => ({ id: r.id, title: r.title, skill: r.skill, provider: r.provider, url: r.url, level: r.level, hours: r.hours });
router.get("/api/courses", requireAuth, (req, res) => { const s = K.normSkill(V.str(req.query.skill, 60)); res.json({ success: true, courses: db.prepare("SELECT * FROM courses ORDER BY id DESC LIMIT 300").all().filter((c) => !s || K.normSkill(c.skill || "") === s).map(cOut) }); });
router.post("/api/manage/courses", ...staff, (req, res) => {
  const title = V.str(req.body?.title, 150), url = V.url(req.body?.url); if (title.length < 3 || !url) return bad(res, "Title and a valid https link are required.");
  const r = db.prepare("INSERT INTO courses (title, skill, provider, url, level, hours, added_by) VALUES (?,?,?,?,?,?,?)").run(title, V.str(req.body?.skill, 60).toLowerCase(), V.str(req.body?.provider, 80), url, V.oneOf(String(req.body?.level || "").toLowerCase(), ["beginner", "medium", "advanced"], "beginner"), V.int(req.body?.hours, 0, 0, 2000) || null, req.studentId);
  audit(req, "course.create", String(r.lastInsertRowid), { title }); res.status(201).json({ success: true, id: Number(r.lastInsertRowid) });
});
router.put("/api/manage/courses/:id", ...staff, (req, res) => {
  const c = db.prepare("SELECT * FROM courses WHERE id=?").get(req.params.id); if (!c) return bad(res, "Course not found.", 404); const b = req.body || {};
  db.prepare("UPDATE courses SET title=?, skill=?, provider=?, url=?, level=?, hours=? WHERE id=?").run(V.str(b.title, 150) || c.title, b.skill === undefined ? c.skill : V.str(b.skill, 60).toLowerCase(), b.provider === undefined ? c.provider : V.str(b.provider, 80), V.url(b.url) || c.url,
    V.oneOf(String(b.level || "").toLowerCase(), ["beginner", "medium", "advanced"], c.level), b.hours === undefined ? c.hours : (V.int(b.hours, 0, 0, 2000) || null), c.id);
  audit(req, "course.update", String(c.id)); res.json({ success: true });
});
router.delete("/api/manage/courses/:id", ...staff, (req, res) => { const n = db.prepare("DELETE FROM courses WHERE id=?").run(req.params.id).changes; if (n) audit(req, "course.delete", String(req.params.id)); n ? res.json({ success: true }) : bad(res, "Course not found.", 404); });

// ---------------------------------------------------------------- reports & exports (CSV, spreadsheet-formula safe)
const cell = (v) => { let s = v === null || v === undefined ? "" : String(v); if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const csv = (headers, rows) => [headers.join(","), ...rows.map((r) => r.map(cell).join(","))].join("\r\n");
function sendCsv(res, name, text) { res.setHeader("Content-Type", "text/csv; charset=utf-8"); res.setHeader("Content-Disposition", `attachment; filename="${name}-${U.today()}.csv"`); res.send("\uFEFF" + text); }
const studentRows = () => studentIds().map((id) => U.studentSnapshot(id)).map((s) => [s.id, s.name, s.email, s.college, s.targetRole, s.readiness, s.profileCompletion, s.avgScore, s.assessmentAttempts, s.moduleProgress, s.xp, s.level, s.streak, s.lastActiveAt]);
const studentHeaders = ["id", "name", "email", "college", "target_role", "readiness", "profile_completion", "avg_assessment", "assessments", "module_progress", "xp", "level", "streak", "last_active"];
router.get("/api/faculty/export/students.csv", ...staff, (req, res) => { audit(req, "export.students", "faculty"); sendCsv(res, "students", csv(studentHeaders, studentRows())); });
router.get("/api/admin/export/:what", ...adminOnly, (req, res) => {
  const what = req.params.what.replace(/\.csv$/, ""); audit(req, "export.data", what);
  if (what === "students") return sendCsv(res, "students", csv(studentHeaders, studentRows()));
  if (what === "users") return sendCsv(res, "users", csv(["id", "name", "email", "role", "active", "created_at", "last_active_at"], db.prepare("SELECT id,name,email,role,is_active,created_at,last_active_at FROM students ORDER BY id").all().map((r) => Object.values(r))));
  if (what === "assessments") return sendCsv(res, "assessments", csv(["student_id", "type", "subject", "mode", "score", "total", "percent", "date"], db.prepare("SELECT student_id, data, created_at FROM student_history WHERE kind='assessment' ORDER BY id").all().map((r) => { const d = U.safeParse(r.data, {}); return [r.student_id, d.type, d.subject, d.mode, d.score, d.total, d.percent, r.created_at]; })));
  if (what === "applications") return sendCsv(res, "applications", csv(["student_id", "company", "title", "kind", "status", "deadline", "created_at"], db.prepare("SELECT student_id,company,title,kind,status,deadline,created_at FROM job_applications ORDER BY id").all().map((r) => Object.values(r))));
  if (what === "audit") return sendCsv(res, "audit", csv(["id", "actor_id", "actor_role", "action", "target", "details", "ip", "created_at"], db.prepare("SELECT id,actor_id,actor_role,action,target,details,ip,created_at FROM audit_logs ORDER BY id DESC LIMIT 5000").all().map((r) => Object.values(r))));
  return bad(res, "Unknown export. Use students, users, assessments, applications or audit.", 404);
});

module.exports = router;
