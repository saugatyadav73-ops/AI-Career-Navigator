/** Jobs & internships: catalogue/finder, recommendations, saved jobs, application tracker, deadline alerts, interview prep, placement dashboard. */
const express = require("express");
const db = require("../database");
const K = require("../ai/knowledge");
const B = require("../ai/questionBank");
const { requireAuth, V, bad } = require("./middleware");
const U = require("./util");
const { nextActions } = require("./career");

const router = express.Router();
const auth = requireAuth;
const STATUSES = ["saved", "applied", "interview", "offer", "rejected", "withdrawn"];
const q = (s) => encodeURIComponent(s);

// The catalogue lists *role profiles* (skills employers ask for) - not live vacancies. Live search links open real job boards.
function catalogue() {
  const jobs = K.JOBS.map((j) => ({ id: j.id, title: j.title, kind: "job", role: j.role, required: j.required, nice: j.nice || [] }));
  const interns = K.JOBS.filter((_, i) => i % 2 === 0).map((j) => ({ id: `${j.id}-intern`, title: `${j.title.replace(/\s*\(.*\)/, "")} Intern`, kind: "internship", role: j.role, required: j.required.slice(0, Math.max(2, Math.ceil(j.required.length * 0.6))), nice: [...j.required.slice(Math.ceil(j.required.length * 0.6)), ...(j.nice || [])] }));
  return [...jobs, ...interns];
}
const searchLinks = (title) => ({ linkedin: `https://www.linkedin.com/jobs/search/?keywords=${q(title)}`, indeed: `https://in.indeed.com/jobs?q=${q(title)}`, naukri: `https://www.naukri.com/${String(title).toLowerCase().replace(/[^a-z0-9]+/g, "-")}-jobs`, internshala: `https://internshala.com/internships/keywords-${q(title)}` });
function matchJob(job, have) {
  const set = new Set(have); const req = job.required.filter((s) => set.has(s)), nice = job.nice.filter((s) => set.has(s));
  const score = Math.round(((req.length / job.required.length) * 85) + (job.nice.length ? (nice.length / job.nice.length) * 15 : 15));
  return { ...job, matchScore: score, matched: req.map(K.pretty), missing: job.required.filter((s) => !set.has(s)).map(K.pretty), readiness: score >= 80 ? "ready" : score >= 55 ? "almost" : "needs-work", links: searchLinks(job.title) };
}
const mySkills = (sid) => { const weak = new Set(U.assessmentStats(sid).weakTopics.map((t) => K.normSkill(t.topic))); return U.profileSkills(U.loadProfile(sid)).filter((s) => !weak.has(s)); };

router.get("/api/jobs/catalog", auth, (req, res) => {
  const text = V.str(req.query.q, 80).toLowerCase(), kind = V.oneOf(req.query.kind, ["job", "internship"], null), role = V.str(req.query.role, 30);
  const have = mySkills(req.studentId);
  const items = catalogue().filter((j) => (!kind || j.kind === kind) && (!role || j.role === role) && (!text || `${j.title} ${j.required.join(" ")}`.toLowerCase().includes(text))).map((j) => matchJob(j, have)).sort((a, b) => b.matchScore - a.matchScore);
  res.json({ success: true, items, note: "Role profiles built from common employer requirements. Use the search links to find live openings." });
});
router.get("/api/jobs/recommendations", auth, (req, res) => {
  const have = mySkills(req.studentId); const all = catalogue().map((j) => matchJob(j, have)).sort((a, b) => b.matchScore - a.matchScore);
  res.json({ success: true, jobs: all.filter((j) => j.kind === "job").slice(0, 6), internships: all.filter((j) => j.kind === "internship").slice(0, 4), basedOn: have.map(K.pretty) });
});
router.get("/api/jobs/links", auth, (req, res) => { const t = V.str(req.query.title, 100); t ? res.json({ success: true, links: searchLinks(t) }) : bad(res, "title is required"); });

// ---------------------------------------------------------------- saved jobs
const savedOut = (r) => ({ id: r.id, jobRef: r.job_ref, title: r.title, company: r.company, kind: r.kind, url: r.url, deadline: r.deadline, createdAt: r.created_at });
router.get("/api/jobs/saved", auth, (req, res) => res.json({ success: true, saved: db.prepare("SELECT * FROM saved_jobs WHERE student_id = ? ORDER BY id DESC").all(req.studentId).map(savedOut) }));
router.post("/api/jobs/saved", auth, (req, res) => {
  const b = req.body || {}; const title = V.str(b.title, 150); if (title.length < 2) return bad(res, "Job title is required.");
  const ref = V.str(b.jobRef, 100) || `${title}|${V.str(b.company, 100)}`.toLowerCase();
  if (db.prepare("SELECT COUNT(*) c FROM saved_jobs WHERE student_id=?").get(req.studentId).c >= 200) return bad(res, "Saved jobs limit reached.");
  const r = db.prepare("INSERT OR IGNORE INTO saved_jobs (student_id, job_ref, title, company, kind, url, deadline) VALUES (?,?,?,?,?,?,?)")
    .run(req.studentId, ref, title, V.str(b.company, 120), V.oneOf(b.kind, ["job", "internship"], "job"), V.url(b.url) || null, V.date(b.deadline) || null);
  if (!r.changes) return bad(res, "Already saved.", 409);
  res.status(201).json({ success: true, saved: savedOut(db.prepare("SELECT * FROM saved_jobs WHERE id=?").get(r.lastInsertRowid)) });
});
router.delete("/api/jobs/saved/:id", auth, (req, res) => (db.prepare("DELETE FROM saved_jobs WHERE id=? AND student_id=?").run(req.params.id, req.studentId).changes ? res.json({ success: true }) : bad(res, "Not found.", 404)));

// ---------------------------------------------------------------- application tracker
const appOut = (r) => ({ id: r.id, company: r.company, title: r.title, kind: r.kind, status: r.status, deadline: r.deadline, url: r.url, notes: r.notes, createdAt: r.created_at, updatedAt: r.updated_at });
router.get("/api/jobs/applications", auth, (req, res) => {
  const rows = db.prepare("SELECT * FROM job_applications WHERE student_id = ? ORDER BY id DESC").all(req.studentId).map(appOut);
  const counts = Object.fromEntries(STATUSES.map((s) => [s, rows.filter((r) => r.status === s).length]));
  res.json({ success: true, applications: V.oneOf(req.query.status, STATUSES, null) ? rows.filter((r) => r.status === req.query.status) : rows, counts, total: rows.length });
});
router.post("/api/jobs/applications", auth, (req, res) => {
  const b = req.body || {}; const company = V.str(b.company, 120), title = V.str(b.title, 150);
  if (company.length < 2 || title.length < 2) return bad(res, "Company and job title are required.");
  if (db.prepare("SELECT COUNT(*) c FROM job_applications WHERE student_id=?").get(req.studentId).c >= 500) return bad(res, "Application limit reached.");
  const r = db.prepare("INSERT INTO job_applications (student_id, company, title, kind, status, deadline, url, notes) VALUES (?,?,?,?,?,?,?,?)")
    .run(req.studentId, company, title, V.oneOf(b.kind, ["job", "internship"], "job"), V.oneOf(b.status, STATUSES, "applied"), V.date(b.deadline) || null, V.url(b.url) || null, V.str(b.notes, 1000));
  res.status(201).json({ success: true, application: appOut(db.prepare("SELECT * FROM job_applications WHERE id=?").get(r.lastInsertRowid)), xp: U.awardXp(req.studentId, "application_added", { dedupe: `app:${r.lastInsertRowid}` }) });
});
router.put("/api/jobs/applications/:id", auth, (req, res) => {
  const a = db.prepare("SELECT * FROM job_applications WHERE id=? AND student_id=?").get(req.params.id, req.studentId); if (!a) return bad(res, "Application not found.", 404);
  const b = req.body || {};
  db.prepare("UPDATE job_applications SET company=?, title=?, kind=?, status=?, deadline=?, url=?, notes=?, updated_at=CURRENT_TIMESTAMP WHERE id=?").run(
    V.str(b.company, 120) || a.company, V.str(b.title, 150) || a.title, V.oneOf(b.kind, ["job", "internship"], a.kind), V.oneOf(b.status, STATUSES, a.status),
    b.deadline === undefined ? a.deadline : (V.date(b.deadline) || null), b.url === undefined ? a.url : (V.url(b.url) || null), b.notes === undefined ? a.notes : V.str(b.notes, 1000), a.id);
  res.json({ success: true, application: appOut(db.prepare("SELECT * FROM job_applications WHERE id=?").get(a.id)) });
});
router.delete("/api/jobs/applications/:id", auth, (req, res) => (db.prepare("DELETE FROM job_applications WHERE id=? AND student_id=?").run(req.params.id, req.studentId).changes ? res.json({ success: true }) : bad(res, "Application not found.", 404)));

// ---------------------------------------------------------------- deadline alerts
function upcomingDeadlines(sid, days) {
  const from = U.today();
  const apps = db.prepare("SELECT id, title, company, deadline, status FROM job_applications WHERE student_id=? AND status IN ('saved','applied') AND deadline BETWEEN ? AND date(?, ?)").all(sid, from, from, `+${days} day`).map((r) => ({ source: "application", id: r.id, title: r.title, company: r.company, deadline: r.deadline, status: r.status }));
  const saved = db.prepare("SELECT id, title, company, deadline FROM saved_jobs WHERE student_id=? AND deadline BETWEEN ? AND date(?, ?)").all(sid, from, from, `+${days} day`).map((r) => ({ source: "saved", id: r.id, title: r.title, company: r.company, deadline: r.deadline }));
  return [...apps, ...saved].map((d) => ({ ...d, daysLeft: Math.round((Date.parse(d.deadline) - Date.parse(from)) / 86400000) })).sort((a, b) => a.daysLeft - b.daysLeft);
}
router.get("/api/jobs/deadlines", auth, (req, res) => {
  const items = upcomingDeadlines(req.studentId, V.int(req.query.days, 14, 1, 90));
  for (const d of items.filter((x) => x.daysLeft <= 3)) U.notify(req.studentId, { type: "deadline", title: `Deadline ${d.daysLeft === 0 ? "today" : `in ${d.daysLeft} day(s)`}: ${d.title}`, body: d.company || "", link: "/jobs", dedupe: `deadline:${d.source}:${d.id}:${d.deadline}` });
  res.json({ success: true, deadlines: items });
});

// ---------------------------------------------------------------- job-specific interview preparation
router.post("/api/jobs/interview-prep", auth, (req, res) => {
  const job = catalogue().find((j) => j.id === req.body?.jobId);
  const title = job?.title || V.str(req.body?.title, 120); if (!title) return bad(res, "Provide a jobId or title.");
  const skills = K.normList(job ? job.required : V.list(req.body?.skills, 10)); const role = job ? K.ROLES.find((r) => r.id === job.role) : K.findRole(title);
  const technical = skills.flatMap((s) => { const r = B.subjectQuestions({ subject: s, difficulty: "beginner", count: 2 }); return r ? r.questions.map((x) => ({ skill: K.pretty(s), question: x.question, answerHint: x.correctAnswer, explanation: x.explanation })) : []; }).slice(0, 10);
  const asked = []; const interview = [];
  for (let i = 0; i < 5; i++) { const x = B.interviewQuestion({ roleId: role?.id, difficulty: "medium", previousQuestions: asked }); if (!x) break; asked.push(x.question); interview.push({ question: x.question, keyPoints: x.keywords, idealAnswer: x.ideal }); }
  res.json({ success: true, prep: { job: title, skillsToRevise: skills.map(K.pretty), technicalQuestions: technical, roleQuestions: interview,
    hrQuestions: ["Tell me about yourself.", "Why do you want this role and our company?", "Describe a challenge you faced in a project and how you solved it.", "Where do you see yourself in three years?", "Do you have any questions for us?"],
    tips: ["Research the company's product and recent news.", "Prepare two projects you can explain end-to-end.", "Use the STAR method for behavioural answers.", "Practice aloud with the Mock Interview module."],
    resources: skills.slice(0, 4).map((s) => ({ skill: K.pretty(s), resource: K.resourcesFor(s)[0] })) } });
});

// ---------------------------------------------------------------- placement dashboard
router.get("/api/jobs/placement-dashboard", auth, (req, res) => {
  const sid = req.studentId; const snap = U.studentSnapshot(sid); const apps = db.prepare("SELECT status, kind, COUNT(*) c FROM job_applications WHERE student_id=? GROUP BY status, kind").all(sid);
  const by = (st) => apps.filter((a) => a.status === st).reduce((x, a) => x + a.c, 0); const total = apps.reduce((x, a) => x + a.c, 0);
  const interviews = U.listHistory(sid, "interview", 20); const have = mySkills(sid);
  const top = catalogue().map((j) => matchJob(j, have)).sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);
  const checks = [["Profile 80%+ complete", snap.profileCompletion >= 80], ["Target career chosen", Boolean(snap.targetRole)], ["At least one assessment taken", snap.assessmentAttempts > 0], ["Resume completed", Boolean((U.getDoc(sid, "moduleProgress", {}) || {}).resume)],
    ["At least 2 projects", db.prepare("SELECT COUNT(*) c FROM hub_projects WHERE student_id=?").get(sid).c >= 2], ["Practised mock interviews (2+)", interviews.length >= 2], ["Applications started", total > 0]];
  res.json({ success: true, dashboard: {
    readiness: snap.readiness, checklist: checks.map(([item, done]) => ({ item, done })), checklistPercent: Math.round((checks.filter((c) => c[1]).length / checks.length) * 100),
    funnel: { tracked: total, applied: by("applied"), interview: by("interview"), offer: by("offer"), rejected: by("rejected") },
    responseRate: total ? Math.round(((by("interview") + by("offer")) / total) * 100) : null, interviewAverage: interviews.length ? Math.round(interviews.reduce((a, i) => a + i.score, 0) / interviews.length) : null,
    topMatches: top, deadlines: upcomingDeadlines(sid, 14).slice(0, 5), nextActions: nextActions(sid).slice(0, 3) } });
});

module.exports = router;
