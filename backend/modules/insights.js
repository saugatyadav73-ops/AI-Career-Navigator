/** Analytics & dashboards: skill analytics, timeline, comparison chart data, skill demand, trends, career report, notifications. */
const express = require("express");
const db = require("../database");
const K = require("../ai/knowledge");
const { requireAuth, V, bad } = require("./middleware");
const U = require("./util");
const { coverage, nextActions } = require("./career");
const { strength } = require("./portfolio");

const router = express.Router();
const auth = requireAuth;
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const effective = (sid) => { const weak = new Set(U.assessmentStats(sid).weakTopics.map((t) => K.normSkill(t.topic))); return U.profileSkills(U.loadProfile(sid)).filter((s) => !weak.has(s)); };

// ---------------------------------------------------------------- skill analytics
router.get("/api/analytics/skills", auth, (req, res) => {
  const a = U.assessmentStats(req.studentId); const role = U.targetRoleOf(req.studentId); const have = new Set(effective(req.studentId));
  res.json({ success: true, average: a.average, assessed: a.subjects.map((s) => ({ subject: s.subject, type: s.type, latest: s.latest, best: s.best, attempts: s.attempts, change: s.change })).sort((x, y) => y.latest - x.latest),
    weakTopics: a.weakTopics, strongest: a.subjects.filter((s) => s.latest >= 70).map((s) => s.subject),
    targetRole: role ? { name: role.name, skills: role.skills.map(([s, w]) => ({ skill: K.pretty(s), weight: w, have: have.has(s) })) } : null });
});

// ---------------------------------------------------------------- career progress timeline
router.get("/api/analytics/timeline", auth, (req, res) => {
  const sid = req.studentId; const ev = []; const add = (at, type, title, detail = "") => ev.push({ at: String(at).replace(" ", "T"), type, title, detail });
  const stu = db.prepare("SELECT created_at FROM students WHERE id=?").get(sid); add(stu.created_at, "account", "Joined AI Career Navigator");
  for (const a of U.listHistory(sid, "assessment", 100)) add(a.createdAt, "assessment", `${a.type || "skill"} assessment: ${a.subject}`, `${a.percent}% (${a.score}/${a.total})`);
  for (const i of U.listHistory(sid, "interview", 100)) add(i.createdAt, "interview", `${i.type} interview${i.role ? ` - ${i.role}` : ""}`, `Score ${i.score}`);
  for (const p of db.prepare("SELECT title, status, created_at FROM hub_projects WHERE student_id=?").all(sid)) add(p.created_at, "project", `Project: ${p.title}`, p.status);
  for (const c of db.prepare("SELECT title, issuer, created_at FROM certificates WHERE student_id=?").all(sid)) add(c.created_at, "certificate", `Certificate: ${c.title}`, c.issuer || "");
  for (const a of db.prepare("SELECT title, company, status, created_at FROM job_applications WHERE student_id=?").all(sid)) add(a.created_at, "application", `${a.status === "saved" ? "Saved" : "Applied"}: ${a.title}`, a.company);
  for (const b of db.prepare("SELECT badge, earned_at FROM student_badges WHERE student_id=?").all(sid)) add(b.earned_at, "badge", `Badge: ${U.BADGES.find((x) => x.id === b.badge)?.name || b.badge}`);
  for (const t of U.listHistory(sid, "twin", 30)) add(t.createdAt, "readiness", "Career readiness snapshot", `${t.readiness}%`);
  ev.sort((x, y) => (x.at < y.at ? 1 : -1));
  res.json({ success: true, events: ev.slice(0, V.int(req.query.limit, 100, 1, 300)) });
});

// ---------------------------------------------------------------- career comparison chart data
router.get("/api/analytics/career-charts", auth, (req, res) => {
  const have = effective(req.studentId); const rows = K.ROLES.map((r) => { const c = coverage(r, have); return { careerId: r.id, career: r.name, match: c.percent, matched: c.matched.length, missing: c.missing.length, total: r.skills.length }; }).sort((a, b) => b.match - a.match);
  const picks = V.list(req.query.careers, 3, 40); const radarRoles = (picks.length ? picks.map((p) => K.ROLES.find((r) => r.id === p) || K.findRole(p)).filter(Boolean) : K.ROLES.filter((r) => r.id === rows[0]?.careerId || r.id === rows[1]?.careerId));
  const set = new Set(have); const skillUnion = [...new Set(radarRoles.flatMap((r) => r.skills.map(([s]) => s)))];
  res.json({ success: true, bar: rows, radar: { axes: skillUnion.map(K.pretty), series: radarRoles.map((r) => ({ career: r.name, required: skillUnion.map((s) => (r.skills.find(([x]) => x === s)?.[1] || 0)), you: skillUnion.map((s) => (set.has(s) ? 3 : 0)) })) } });
});

// ---------------------------------------------------------------- skill demand (from the role/job catalogue)
router.get("/api/analytics/skill-demand", auth, (req, res) => {
  const demand = {};
  for (const j of K.JOBS) { for (const s of j.required) (demand[s] ||= { required: 0, nice: 0 }).required++; for (const s of j.nice || []) (demand[s] ||= { required: 0, nice: 0 }).nice++; }
  const have = new Set(effective(req.studentId)); const total = K.JOBS.length;
  const list = Object.entries(demand).map(([s, d]) => ({ skill: K.pretty(s), requiredIn: d.required, niceIn: d.nice, demandPercent: Math.round((d.required / total) * 100), youHave: have.has(s) })).sort((a, b) => b.requiredIn - a.requiredIn || b.niceIn - a.niceIn);
  res.json({ success: true, basedOn: `${total} role profiles in the catalogue`, skills: list.slice(0, V.int(req.query.limit, 20, 1, 60)), inDemandYouLack: list.filter((s) => !s.youHave).slice(0, 5).map((s) => s.skill),
    note: "Demand is measured across the platform's curated role catalogue, not live job-board data." });
});

// ---------------------------------------------------------------- career trends (curated reference list)
const TRENDS = [
  { id: "aiml", area: "AI & Machine Learning Engineering", outlook: "Very high", why: "Companies are embedding ML and LLM features into products.", skills: ["python", "machine learning", "deep learning", "pytorch"] },
  { id: "devops", area: "Cloud & Platform / DevOps", outlook: "High", why: "Cloud-native delivery and automation keep growing.", skills: ["linux", "docker", "kubernetes", "aws"] },
  { id: "cyber", area: "Cybersecurity", outlook: "High", why: "Rising threats and compliance needs drive hiring.", skills: ["networking", "linux", "cybersecurity", "penetration testing"] },
  { id: "data", area: "Data Analytics & Engineering", outlook: "High", why: "Data-driven decisions need analysts and pipelines.", skills: ["sql", "python", "pandas", "data visualization"] },
  { id: "fullstack", area: "Full Stack (TypeScript / React)", outlook: "Steady-high", why: "Web products remain the largest software segment.", skills: ["javascript", "react", "node.js", "typescript"] },
  { id: "mobile", area: "Cross-platform Mobile", outlook: "Steady", why: "Teams prefer one codebase for iOS and Android.", skills: ["react native", "flutter", "rest apis"] },
  { id: "backend", area: "Backend & Distributed Systems", outlook: "Steady-high", why: "Scalable services and APIs underpin every product.", skills: ["java", "sql", "rest apis", "dsa"] },
];
router.get("/api/analytics/trends", auth, (req, res) => {
  const have = effective(req.studentId);
  res.json({ success: true, trends: TRENDS.map((t) => { const role = K.ROLES.find((r) => r.id === t.id); const c = role ? coverage(role, have) : null; return { ...t, skills: t.skills.map(K.pretty), yourMatch: c?.percent ?? null }; }),
    note: "Curated qualitative outlook for planning. It is not live labour-market data; verify with current job boards and industry reports." });
});

// ---------------------------------------------------------------- career report
function buildReport(sid) {
  const snap = U.studentSnapshot(sid); const profile = U.loadProfile(sid); const have = effective(sid); const a = U.assessmentStats(sid);
  const ranked = K.ROLES.map((r) => ({ r, ...coverage(r, have) })).sort((x, y) => y.percent - x.percent).slice(0, 3);
  const projects = db.prepare("SELECT title, status, score FROM hub_projects WHERE student_id=? ORDER BY id DESC LIMIT 10").all(sid);
  const certs = db.prepare("SELECT title, issuer FROM certificates WHERE student_id=? ORDER BY id DESC LIMIT 10").all(sid);
  const interviews = U.listHistory(sid, "interview", 20);
  return { generatedAt: new Date().toISOString(), student: { name: profile.fullName, email: profile.email, college: profile.college || "", education: profile.education || "" },
    readiness: snap.readiness, profileCompletion: snap.profileCompletion, level: snap.level, xp: snap.xp, streak: snap.streak, targetRole: snap.targetRole,
    skills: have.map(K.pretty), topCareers: ranked.map((x) => ({ career: x.r.name, match: x.percent, gaps: x.missing.slice(0, 4).map((m) => K.pretty(m.skill)) })),
    assessments: a.subjects.map((s) => ({ subject: s.subject, latest: s.latest, attempts: s.attempts })), weakTopics: a.weakTopics.map((t) => t.topic),
    projects, certificates: certs, interviewAverage: interviews.length ? Math.round(interviews.reduce((x, i) => x + i.score, 0) / interviews.length) : null, portfolioStrength: strength(sid).score,
    nextSteps: nextActions(sid).slice(0, 5).map((n) => `${n.title} - ${n.why}`) };
}
router.get("/api/analytics/report", auth, (req, res) => { const report = buildReport(req.studentId); U.addHistory(req.studentId, "report", { readiness: report.readiness }); res.json({ success: true, report }); });
router.get("/api/analytics/report/download", auth, (req, res) => {
  const r = buildReport(req.studentId); U.addHistory(req.studentId, "report", { readiness: r.readiness, downloaded: true });
  const li = (arr) => (arr.length ? `<ul>${arr.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : "<p><em>None yet</em></p>");
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Career Report - ${esc(r.student.name)}</title><style>
body{font-family:Arial,Helvetica,sans-serif;max-width:820px;margin:32px auto;color:#0f172a;line-height:1.5;padding:0 16px}h1{margin-bottom:0}h2{border-bottom:2px solid #e2e8f0;padding-bottom:4px;margin-top:28px}
.k{display:flex;gap:12px;flex-wrap:wrap}.c{border:1px solid #e2e8f0;border-radius:10px;padding:10px 16px;min-width:120px}.c b{display:block;font-size:22px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #e2e8f0;padding:6px 10px;text-align:left}@media print{body{margin:0}}</style></head><body>
<h1>Career Report</h1><p>${esc(r.student.name)} &middot; ${esc(r.student.email)}${r.student.college ? ` &middot; ${esc(r.student.college)}` : ""}<br><small>Generated ${esc(new Date(r.generatedAt).toUTCString())} (print this page to save as PDF)</small></p>
<div class="k"><div class="c"><b>${r.readiness}%</b>Career readiness</div><div class="c"><b>${r.profileCompletion}%</b>Profile</div><div class="c"><b>${r.portfolioStrength}</b>Portfolio score</div><div class="c"><b>L${r.level}</b>${r.xp} XP</div><div class="c"><b>${r.streak}</b>Day streak</div></div>
<h2>Target career</h2><p>${esc(r.targetRole || "Not chosen yet")}</p><h2>Best-fit careers</h2><table><tr><th>Career</th><th>Match</th><th>Top gaps</th></tr>${r.topCareers.map((c) => `<tr><td>${esc(c.career)}</td><td>${c.match}%</td><td>${esc(c.gaps.join(", ") || "-")}</td></tr>`).join("")}</table>
<h2>Skills</h2><p>${esc(r.skills.join(", ") || "None recorded")}</p><h2>Assessments</h2>${r.assessments.length ? `<table><tr><th>Subject</th><th>Latest</th><th>Attempts</th></tr>${r.assessments.map((s) => `<tr><td>${esc(s.subject)}</td><td>${s.latest}%</td><td>${s.attempts}</td></tr>`).join("")}</table>` : "<p><em>No assessments yet</em></p>"}
<p><b>Weak topics:</b> ${esc(r.weakTopics.join(", ") || "none detected")}</p><h2>Projects</h2>${li(r.projects.map((p) => `${p.title} (${p.status}${p.score != null ? `, score ${p.score}` : ""})`))}
<h2>Certificates</h2>${li(r.certificates.map((c) => `${c.title}${c.issuer ? ` - ${c.issuer}` : ""}`))}<h2>Interview practice</h2><p>${r.interviewAverage != null ? `Average score ${r.interviewAverage}` : "No mock interviews yet"}</p><h2>Recommended next steps</h2>${li(r.nextSteps)}</body></html>`;
  res.setHeader("Content-Type", "text/html; charset=utf-8"); res.setHeader("Content-Disposition", 'attachment; filename="career-report.html"'); res.send(html);
});

// ---------------------------------------------------------------- notifications
const nOut = (r) => ({ id: r.id, type: r.type, title: r.title, body: r.body, link: r.link, read: Boolean(r.is_read), createdAt: r.created_at });
router.get("/api/notifications", auth, (req, res) => {
  const rows = db.prepare("SELECT * FROM notifications WHERE student_id=? ORDER BY id DESC LIMIT ?").all(req.studentId, V.int(req.query.limit, 40, 1, 100)).map(nOut);
  res.json({ success: true, notifications: rows, unread: db.prepare("SELECT COUNT(*) c FROM notifications WHERE student_id=? AND is_read=0").get(req.studentId).c });
});
router.post("/api/notifications/refresh", auth, (req, res) => {
  const sid = req.studentId; const d = U.today(); const settings = U.getDoc(sid, "settings", {}) || {};
  if (settings.inAppNotifications === false) return res.json({ success: true, created: 0, note: "In-app notifications are turned off in settings." });
  const before = db.prepare("SELECT COUNT(*) c FROM notifications WHERE student_id=?").get(sid).c;
  const streak = U.streakFor(sid);
  if (streak.current >= 2 && !streak.activeToday) U.notify(sid, { type: "streak", title: `Your ${streak.current}-day streak is at risk`, body: "Complete one activity today to keep it.", link: "/planner", dedupe: `streak:${d}` });
  const plan = U.getDoc(sid, "weekly_plan", null);
  if (plan) { const t = plan.days.flatMap((x) => x.tasks); const done = t.filter((x) => x.done).length; if (t.length && done / t.length >= 0.5) U.notify(sid, { type: "progress", title: `Halfway there: ${done}/${t.length} planned tasks done`, link: "/planner", dedupe: `plan50:${plan.weekStart}` }); }
  const gaps = U.assessmentStats(sid).weakTopics[0]; if (gaps) U.notify(sid, { type: "revision", title: `Revise ${gaps.topic}`, body: `You scored ${gaps.percent}% - a short revision session can lift this.`, link: "/planner", dedupe: `weak:${gaps.topic}:${d.slice(0, 7)}` });
  const last = db.prepare("SELECT last_active_at FROM students WHERE id=?").get(sid)?.last_active_at;
  const comp = U.profileCompletion(U.loadProfile(sid)); if (comp.percent < 60) U.notify(sid, { type: "profile", title: "Finish your profile for better recommendations", body: `${comp.percent}% complete`, link: "/profile", dedupe: `profile:${d.slice(0, 7)}` });
  for (const x of db.prepare("SELECT id, title, company, deadline FROM job_applications WHERE student_id=? AND status IN ('saved','applied') AND deadline BETWEEN ? AND date(?, '+3 day')").all(sid, d, d)) U.notify(sid, { type: "deadline", title: `Deadline soon: ${x.title}`, body: `${x.company} - ${x.deadline}`, link: "/jobs", dedupe: `deadline:application:${x.id}:${x.deadline}` });
  void last;
  res.json({ success: true, created: db.prepare("SELECT COUNT(*) c FROM notifications WHERE student_id=?").get(sid).c - before });
});
router.post("/api/notifications/read-all", auth, (req, res) => { db.prepare("UPDATE notifications SET is_read=1 WHERE student_id=?").run(req.studentId); res.json({ success: true }); });
router.post("/api/notifications/:id/read", auth, (req, res) => (db.prepare("UPDATE notifications SET is_read=1 WHERE id=? AND student_id=?").run(req.params.id, req.studentId).changes ? res.json({ success: true }) : bad(res, "Notification not found.", 404)));
router.delete("/api/notifications/:id", auth, (req, res) => (db.prepare("DELETE FROM notifications WHERE id=? AND student_id=?").run(req.params.id, req.studentId).changes ? res.json({ success: true }) : bad(res, "Notification not found.", 404)));

// ---------------------------------------------------------------- unified personalised dashboard summary
router.get("/api/dashboard/summary", auth, (req, res) => {
  const snap = U.studentSnapshot(req.studentId); const actions = nextActions(req.studentId);
  res.json({ success: true, summary: { ...snap, nextBestAction: actions[0] || null, unreadNotifications: db.prepare("SELECT COUNT(*) c FROM notifications WHERE student_id=? AND is_read=0").get(req.studentId).c, level: U.levelFor(snap.xp) } });
});

module.exports = router;
