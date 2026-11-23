/* Integration test for the checklist feature layer (auth gaps, assessments, planner, career, portfolio, jobs, analytics,
   community, faculty/admin, ops). Starts server.js on a random port with a throw-away database copy.
   Usage: npm run test:modules   (no AI key / SMTP / internet required) */
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

const PORT = 5900 + Math.floor(Math.random() * 90);
const base = `http://localhost:${PORT}`;
const stamp = Date.now();
const emails = { a: `ana-${stamp}@example.test`, b: `ben-${stamp}@example.test`, admin: `admin-${stamp}@example.test`, faculty: `fac-${stamp}@example.test` };
const tokens = {};
let passed = 0, failed = 0;

async function call(method, p, body, who) {
  const r = await fetch(base + p, { method, headers: { "Content-Type": "application/json", ...(who && tokens[who] ? { Authorization: `Bearer ${tokens[who]}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  const type = r.headers.get("content-type") || "";
  return { status: r.status, body: type.includes("json") ? await r.json() : await r.text(), headers: r.headers };
}
function check(name, ok, extra = "") { if (ok) { passed++; console.log(`PASS ${name}`); } else { failed++; console.log(`FAIL ${name} ${extra}`); } }
const t = async (name, fn) => { try { const r = await fn(); check(name, r === true || r === undefined, r === false ? "" : String(r)); } catch (e) { failed++; console.log(`FAIL ${name} threw: ${e.message}`); } };
const decode = (jwt) => JSON.parse(Buffer.from(jwt.split(".")[1], "base64url").toString());

(async () => {
  const dbCopy = path.join(os.tmpdir(), `cn-test-${stamp}`);
  fs.mkdirSync(dbCopy, { recursive: true });
  const srv = spawn("node", ["server.js"], { cwd: path.join(__dirname, ".."), stdio: "ignore",
    env: { ...process.env, PORT: String(PORT), SMTP_HOST: "", SMTP_USER: "", SMTP_PASS: "", NODE_ENV: "test", RATE_LIMIT_DISABLED: "true", JWT_SECRET: "test-secret-" + stamp,
      ADMIN_EMAILS: emails.admin, FACULTY_EMAILS: emails.faculty, BACKUP_DIR: path.join(dbCopy, "backups"), DB_PATH: path.join(dbCopy, "career_navigator.db"), REQUEST_LOG: "false" } });
  await new Promise((r) => setTimeout(r, 2000));
  try {
    // ---------- accounts
    for (const [k, email] of Object.entries(emails)) {
      await t(`register ${k}`, async () => { const r = await call("POST", "/api/auth/register", { name: `Test ${k}`, email, password: "Passw0rd!" }); tokens[k] = r.body.token; return r.status < 300 || r.body.requiresVerification === true; });
      await t(`login ${k}`, async () => { const r = await call("POST", "/api/auth/login", { email, password: "Passw0rd!" }); tokens[k] = r.body.token; return Boolean(r.body.token); });
    }
    await t("GET /api/me with role", async () => { const r = await call("GET", "/api/me", undefined, "a"); return r.body.student?.role === "student"; });
    await t("admin role from ADMIN_EMAILS", async () => (await call("GET", "/api/me", undefined, "admin")).body.student?.role === "admin");
    await t("faculty role from FACULTY_EMAILS", async () => (await call("GET", "/api/me", undefined, "faculty")).body.student?.role === "faculty");
    await t("strict routes reject anonymous", async () => (await call("GET", "/api/me")).status === 401);
    await t("legacy AI endpoint still anonymous", async () => { const r = await call("POST", "/api/mentor/chat", { message: "How do I start in AI?", profile: { skills: ["Python"] } }); return r.body.success === true; });
    await t("legacy /api/career/predict still anonymous", async () => (await call("POST", "/api/career/predict", { profile: { skills: ["Python", "SQL"] } })).body.success === true);
    await t("security headers present", async () => (await call("GET", "/api/status")).headers.get("x-content-type-options") === "nosniff");

    // ---------- forgot / reset password, change password, sessions
    let devCode;
    await t("forgot password returns generic + dev code", async () => { const r = await call("POST", "/api/auth/forgot-password", { email: emails.b }); devCode = r.body.devCode; return r.body.success && /^\d{6}$/.test(devCode || ""); });
    await t("forgot password hides unknown emails", async () => { const r = await call("POST", "/api/auth/forgot-password", { email: "nobody@example.test" }); return r.body.success && !r.body.devCode; });
    await t("reset password rejects wrong code", async () => (await call("POST", "/api/auth/reset-password", { email: emails.b, code: "000000", newPassword: "NewPass123" })).status === 400);
    await t("reset password works", async () => (await call("POST", "/api/auth/reset-password", { email: emails.b, code: devCode, newPassword: "NewPass123" })).body.success === true);
    await t("login with reset password", async () => { const r = await call("POST", "/api/auth/login", { email: emails.b, password: "NewPass123" }); tokens.b = r.body.token; return Boolean(r.body.token); });
    await t("old password no longer works", async () => (await call("POST", "/api/auth/login", { email: emails.b, password: "Passw0rd!" })).status === 401);
    await t("change password needs correct current", async () => (await call("POST", "/api/me/change-password", { currentPassword: "wrong", newPassword: "Another123" }, "a")).status === 401);
    await t("google login reports not configured", async () => (await call("POST", "/api/auth/google", { credential: "x" })).status === 501);

    // ---------- profile / settings / data sync
    await t("profile update + completion", async () => { const r = await call("PUT", "/api/me/profile", { fullName: "Ana Rao", phone: "+91 9876543210", college: "ABC College", education: "B.Tech CSE", year: "3", skills: "Python, SQL, Git, Pandas", interests: "data analysis, AI", careerInterest: "Data Analyst", projects: "Sales dashboard", experience: "Intern", github: "octocat" }, "a"); return r.body.completion?.percent === 100; });
    await t("profile rejects bad phone", async () => (await call("PUT", "/api/me/profile", { phone: "abc" }, "a")).status === 400);
    await t("settings round trip", async () => { await call("PUT", "/api/me/settings", { theme: "dark", leaderboardOptIn: true, weeklyStudyHours: 10 }, "a"); const r = await call("GET", "/api/me/settings", undefined, "a"); return r.body.settings.theme === "dark" && r.body.settings.leaderboardOptIn === true; });
    await t("data sync put/get/isolation", async () => { await call("PUT", "/api/me/data/skillAssessment", { data: { score: 7, total: 10 } }, "a"); const mine = await call("GET", "/api/me/data/skillAssessment", undefined, "a"); const theirs = await call("GET", "/api/me/data/skillAssessment", undefined, "b"); return mine.body.data?.score === 7 && theirs.body.data === null; });
    await t("data sync rejects bad key", async () => (await call("PUT", "/api/me/data/..%2Fx", { data: 1 }, "a")).status >= 400);
    await t("legacy profile sync keeps server extras", async () => { await call("PUT", "/api/me/data/studentProfile", { data: { fullName: "Ana Rao", phone: "+91 9876543210" } }, "a"); const r = await call("GET", "/api/me/profile", undefined, "a"); return r.body.profile.github === "octocat"; });

    // ---------- assessments
    await t("assessment types", async () => (await call("GET", "/api/assessments/types", undefined, "a")).body.types?.length === 3);
    for (const [type, subject] of [["technical", "python"], ["aptitude", ""], ["communication", ""]]) {
      await t(`standard ${type} attempt graded server-side`, async () => {
        const s = await call("POST", "/api/assessments/start", { type, subject, count: 5 }, "a"); if (!s.body.attemptToken) return JSON.stringify(s.body);
        if (s.body.questions.some((q) => "correctAnswer" in q)) return "answers leaked to client";
        const key = decode(s.body.attemptToken).answers; const answers = {}; Object.entries(key).forEach(([id, v], i) => { answers[id] = i === 0 ? "definitely wrong" : v; });
        const r = await call("POST", "/api/assessments/submit", { attemptToken: s.body.attemptToken, answers }, "a");
        return r.body.result?.score === Object.keys(key).length - 1 && r.body.review?.length === Object.keys(key).length;
      });
    }
    await t("tampered attempt token rejected", async () => (await call("POST", "/api/assessments/submit", { attemptToken: "a.b.c", answers: {} }, "a")).status === 400);
    await t("adaptive quiz adjusts and finishes", async () => {
      let r = await call("POST", "/api/assessments/adaptive/start", { type: "technical", subject: "python", total: 4 }, "a"); let guard = 0; const levels = [r.body.question.difficulty];
      while (r.body.attemptToken && !r.body.finished && guard++ < 10) { const right = decode(r.body.attemptToken).cur.c; r = await call("POST", "/api/assessments/adaptive/answer", { attemptToken: r.body.attemptToken, answer: right }, "a"); if (r.body.question) levels.push(r.body.question.difficulty); }
      return r.body.finished === true && r.body.result?.percent === 100 && r.body.result?.mode === "adaptive";
    });
    await t("assessment history + progress + weak topics", async () => {
      await call("POST", "/api/assessments/record", { type: "technical", subject: "sql", score: 1, total: 10 }, "a"); await call("POST", "/api/assessments/record", { type: "technical", subject: "sql", score: 2, total: 10 }, "a");
      const h = await call("GET", "/api/assessments/history", undefined, "a"); const p = await call("GET", "/api/assessments/progress", undefined, "a"); const w = await call("GET", "/api/assessments/weak-topics", undefined, "a");
      return h.body.items.length >= 5 && p.body.reassessment.some((x) => x.subject === "sql" && x.delta === 10) && Array.isArray(w.body.weakTopics);
    });

    // ---------- planner / roadmap
    await t("time estimator", async () => (await call("POST", "/api/planner/estimate", { skills: ["Pandas", "Power BI"], hoursPerWeek: 10 }, "a")).body.estimate?.totalHours > 0);
    await t("weekly plan create/get/toggle", async () => {
      const c = await call("POST", "/api/planner/weekly", { targetRole: "Data Analyst" }, "a"); if (!c.body.plan) return JSON.stringify(c.body);
      const id = c.body.plan.days[0].tasks[0].id; const tg = await call("POST", "/api/planner/weekly/toggle", { taskId: id }, "a"); const g = await call("GET", "/api/planner/weekly", undefined, "a");
      return c.body.plan.days.length === 7 && tg.body.task?.done === true && g.body.progress.done === 1;
    });
    await t("daily goals add/toggle/delete + from plan", async () => {
      const a = await call("POST", "/api/planner/daily", { title: "Solve 5 SQL problems" }, "a"); const id = a.body.goal.id; const tg = await call("POST", `/api/planner/daily/${id}/toggle`, {}, "a"); const l = await call("GET", "/api/planner/daily", undefined, "a");
      const other = await call("POST", `/api/planner/daily/${id}/toggle`, {}, "b"); const d = await call("DELETE", `/api/planner/daily/${id}`, undefined, "a");
      return tg.body.done === true && l.body.summary.total >= 1 && other.status === 404 && d.body.success;
    });
    await t("revision recommendations", async () => (await call("GET", "/api/planner/revision", undefined, "a")).body.success === true);
    const phases = [{ skill: "SQL", priority: "High", startWeek: 1, endWeek: 2 }, { skill: "Pandas", priority: "Medium", startWeek: 3, endWeek: 4 }, { skill: "Statistics", priority: "Low", startWeek: 5, endWeek: 5 }];
    await t("roadmap unlock locks later modules", async () => { const r = await call("POST", "/api/roadmap/unlock-status", { phases, completedSkills: ["SQL"] }, "a"); return r.body.phases.map((p) => p.status).join() === "completed,unlocked,locked"; });
    await t("roadmap adapts to weak quiz scores", async () => { const r = await call("POST", "/api/roadmap/adapt", { phases, completedSkills: [], quizScores: { statistics: 30 } }, "a"); return r.body.phases[0].skill === "Statistics" && Boolean(r.body.phases[0].adaptedReason); });

    // ---------- career intelligence
    await t("what-if simulator", async () => { const r = await call("POST", "/api/career/what-if", { careers: ["Data Analyst", "AI / Machine Learning Engineer"], addSkills: ["Power BI", "Statistics", "Excel"] }, "a"); return r.body.results?.length === 2 && r.body.results.some((x) => x.gain > 0); });
    await t("career comparison", async () => { const r = await call("POST", "/api/career/compare", { careers: ["data", "aiml", "backend"] }, "a"); return r.body.compare?.length === 3 && Array.isArray(r.body.commonSkills); });
    await t("career comparison needs 2+", async () => (await call("POST", "/api/career/compare", { careers: ["data"] }, "a")).status === 400);
    await t("career explanation", async () => (await call("POST", "/api/career/explain", { career: "Data Analyst" }, "a")).body.explanation?.reasons?.length >= 2);
    await t("digital twin + history", async () => { const r = await call("GET", "/api/career/digital-twin", undefined, "a"); return r.body.twin?.skills?.length > 0 && r.body.twin.topCareers.length === 3 && r.body.history.length >= 1; });
    await t("copilot next actions", async () => (await call("GET", "/api/copilot/next-actions", undefined, "b")).body.actions?.length > 0);

    // ---------- portfolio hub
    let projId, certId;
    await t("certificate create/list/delete", async () => { const c = await call("POST", "/api/certificates", { title: "Google Data Analytics", issuer: "Coursera", issueDate: "2026-05-01", credentialUrl: "https://example.com/c/1", skills: ["SQL"] }, "a"); certId = c.body.certificate?.id; const l = await call("GET", "/api/certificates", undefined, "a"); const x = await call("DELETE", `/api/certificates/${certId}`, undefined, "b"); return l.body.certificates.length === 1 && x.status === 404; });
    await t("project create + roadmap + milestone + evaluate", async () => {
      const c = await call("POST", "/api/hub/projects", { title: "Sales Dashboard", description: "Interactive dashboard on sales data using SQL and Python to find regional trends and forecast revenue for managers.", tech: ["SQL", "Python", "Pandas"], difficulty: "medium", githubUrl: "https://github.com/example/sales" }, "a"); projId = c.body.project?.id;
      const m = await call("POST", `/api/hub/projects/${projId}/milestone`, { milestoneId: 1 }, "a"); const e = await call("POST", `/api/hub/projects/${projId}/evaluate`, {}, "a");
      return c.body.project.milestones.length >= 7 && m.body.milestones[0].done && e.body.evaluation.score > 20 && e.body.evaluation.breakdown.length === 6;
    });
    await t("project isolation", async () => (await call("PUT", `/api/hub/projects/${projId}`, { title: "hijack" }, "b")).status === 404);
    await t("portfolio save/public/strength", async () => {
      const s = await call("PUT", "/api/portfolio/me", { headline: "Aspiring data analyst", about: "I love turning messy data into clear decisions and I build dashboards for real problems.", isPublic: true, featuredProjectIds: [projId] }, "a");
      const pub = await call("GET", `/api/portfolio/public/${s.body.slug}`); const priv = await call("GET", `/api/portfolio/public/ana-rao-99999`);
      return s.body.strength.score > 20 && pub.body.portfolio?.projects?.length === 1 && !JSON.stringify(pub.body).includes(emails.a) && priv.status === 404;
    });
    await t("private portfolio hidden", async () => { const me = await call("GET", "/api/portfolio/me", undefined, "b"); return (await call("GET", `/api/portfolio/public/${me.body.slug}`)).status === 404; });
    await t("github analyzer handles offline gracefully", async () => [200, 404, 502, 503].includes((await call("POST", "/api/github/analyze", { username: "octocat" }, "a")).status));
    await t("github analyzer validates username", async () => (await call("POST", "/api/github/analyze", { username: "bad name!" }, "a")).status === 400);
    const resumeText = "Ana Rao ana@example.com +91 9876543210 github.com/ana linkedin.com/in/ana\nEducation B.Tech CSE\nSkills Python SQL Pandas Git\nProjects Built a sales dashboard with SQL and Python reducing report time by 30%. Developed a classifier with 92% accuracy. Designed ETL scripts. Implemented unit tests. Deployed on cloud. Analyzed 10k rows of data.\nExperience Data intern at XYZ, improved reporting by 2x. ".repeat(3);
    await t("ATS check", async () => (await call("POST", "/api/resume/ats-check", { resumeText }, "a")).body.ats?.score > 0);
    await t("job-specific resume optimizer", async () => { const r = await call("POST", "/api/resume/optimize", { resumeText, jobDescription: "We need SQL, Python, Power BI and Tableau skills and statistics knowledge." }, "a"); return r.body.optimization?.missingKeywords?.includes("Power BI") && r.body.optimization.keywordMatch > 0; });
    await t("interview history + comparison", async () => { await call("POST", "/api/interviews/history", { type: "technical", role: "Data Analyst", answers: [{ question: "q1", score: 50 }, { question: "q2", score: 60 }] }, "a"); await call("POST", "/api/interviews/history", { type: "voice", role: "Data Analyst", score: 80 }, "a"); const r = await call("GET", "/api/interviews/history", undefined, "a"); return r.body.items.length === 2 && r.body.comparison.trend === "improving" && r.body.comparison.previous === 55; });

    // ---------- jobs
    await t("job catalogue + internships", async () => { const j = await call("GET", "/api/jobs/catalog?kind=internship", undefined, "a"); return j.body.items.length > 0 && j.body.items.every((x) => x.kind === "internship") && Boolean(j.body.items[0].links.linkedin); });
    await t("job recommendations", async () => { const r = await call("GET", "/api/jobs/recommendations", undefined, "a"); return r.body.jobs.length > 0 && r.body.jobs[0].matchScore >= r.body.jobs[r.body.jobs.length - 1].matchScore; });
    const soon = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
    let appId;
    await t("application tracker CRUD", async () => { const c = await call("POST", "/api/jobs/applications", { company: "Acme", title: "Data Analyst", status: "applied", deadline: soon }, "a"); appId = c.body.application.id; const u = await call("PUT", `/api/jobs/applications/${appId}`, { status: "interview" }, "a"); const l = await call("GET", "/api/jobs/applications", undefined, "a"); const x = await call("PUT", `/api/jobs/applications/${appId}`, { status: "offer" }, "b"); return u.body.application.status === "interview" && l.body.counts.interview === 1 && x.status === 404; });
    await t("saved jobs + duplicate guard", async () => { const a = await call("POST", "/api/jobs/saved", { title: "BI Analyst", company: "Globex", deadline: soon }, "a"); const b = await call("POST", "/api/jobs/saved", { title: "BI Analyst", company: "Globex" }, "a"); return a.status === 201 && b.status === 409; });
    await t("deadline alerts", async () => { const r = await call("GET", "/api/jobs/deadlines?days=7", undefined, "a"); return r.body.deadlines.length === 1 && r.body.deadlines[0].source === "saved" && r.body.deadlines[0].daysLeft <= 2; });
    await t("job interview prep", async () => { const r = await call("POST", "/api/jobs/interview-prep", { jobId: "j6" }, "a"); return r.body.prep?.technicalQuestions?.length > 0 && r.body.prep.roleQuestions.length > 0; });
    await t("placement dashboard", async () => { const r = await call("GET", "/api/jobs/placement-dashboard", undefined, "a"); return r.body.dashboard?.funnel?.tracked === 1 && r.body.dashboard.checklist.length === 7; });

    // ---------- analytics
    await t("skill analytics", async () => (await call("GET", "/api/analytics/skills", undefined, "a")).body.assessed?.length > 0);
    await t("timeline", async () => { const r = await call("GET", "/api/analytics/timeline", undefined, "a"); return r.body.events.length > 5 && r.body.events.some((e) => e.type === "assessment"); });
    await t("career comparison charts", async () => { const r = await call("GET", "/api/analytics/career-charts", undefined, "a"); return r.body.bar.length === 7 && r.body.radar.series.length >= 1; });
    await t("skill demand", async () => (await call("GET", "/api/analytics/skill-demand", undefined, "a")).body.skills?.[0]?.requiredIn > 1);
    await t("career trends", async () => (await call("GET", "/api/analytics/trends", undefined, "a")).body.trends?.length >= 5);
    await t("career report JSON + download", async () => { const j = await call("GET", "/api/analytics/report", undefined, "a"); const d = await call("GET", "/api/analytics/report/download", undefined, "a"); return j.body.report?.readiness >= 0 && typeof d.body === "string" && d.body.includes("<h1>Career Report</h1>") && /attachment/.test(d.headers.get("content-disposition")); });
    await t("notifications refresh/list/read", async () => { await call("POST", "/api/notifications/refresh", {}, "a"); const l = await call("GET", "/api/notifications", undefined, "a"); const first = l.body.notifications[0]; if (!first) return "no notifications"; const r = await call("POST", `/api/notifications/${first.id}/read`, {}, "a"); const x = await call("POST", `/api/notifications/${first.id}/read`, {}, "b"); return r.body.success && x.status === 404; });
    await t("dashboard summary", async () => (await call("GET", "/api/dashboard/summary", undefined, "a")).body.summary?.readiness >= 0);

    // ---------- gamification & community
    await t("gamification profile (xp, level, badges, challenges)", async () => { const r = await call("GET", "/api/gamification/me", undefined, "a"); return r.body.xp > 50 && r.body.level.level >= 2 && r.body.badges.some((b) => b.earned) && r.body.challenges.challenges.length === 3 && r.body.streak.current >= 1; });
    await t("client xp events whitelisted + deduped", async () => { const a = await call("POST", "/api/gamification/event", { action: "roadmap_step", ref: "sql" }, "a"); const b = await call("POST", "/api/gamification/event", { action: "roadmap_step", ref: "sql" }, "a"); const c = await call("POST", "/api/gamification/event", { action: "profile_complete" }, "a"); return a.body.xp.awarded === 15 && b.body.xp.awarded === 0 && c.status === 400; });
    await t("leaderboard is opt-in", async () => { const a = await call("GET", "/api/gamification/leaderboard", undefined, "a"); const b = await call("GET", "/api/gamification/leaderboard", undefined, "b"); return a.body.board.length === 1 && a.body.board[0].you && b.body.optedIn === false && !JSON.stringify(a.body).includes(emails.a); });
    let discId;
    await t("discussions + replies", async () => { const d = await call("POST", "/api/community/discussions", { title: "Best way to learn SQL joins?", body: "Looking for practice resources for SQL joins.", topic: "sql" }, "a"); discId = d.body.id; const r = await call("POST", `/api/community/discussions/${discId}/replies`, { body: "Try SQLBolt, it is interactive." }, "b"); const g = await call("GET", `/api/community/discussions/${discId}`, undefined, "b"); const del = await call("DELETE", `/api/community/discussions/${discId}`, undefined, "b"); return r.status === 201 && g.body.replies.length === 1 && del.status === 403; });
    await t("team finder request/accept", async () => { const p = await call("POST", "/api/community/teams", { title: "Need a React dev for hackathon", skillsNeeded: ["React", "Python"] }, "a"); const id = p.body.id; const own = await call("POST", `/api/community/teams/${id}/request`, {}, "a"); const rq = await call("POST", `/api/community/teams/${id}/request`, { message: "I know React" }, "b"); const dup = await call("POST", `/api/community/teams/${id}/request`, {}, "b"); const list = await call("GET", `/api/community/teams/${id}/requests`, undefined, "a"); const nope = await call("GET", `/api/community/teams/${id}/requests`, undefined, "b"); const acc = await call("POST", `/api/community/teams/${id}/requests/${list.body.requests[0].id}`, { action: "accept" }, "a"); return own.status === 400 && rq.status === 201 && dup.status === 409 && nope.status === 403 && acc.body.success; });
    await t("hackathon finder", async () => { const bad = await call("POST", "/api/community/hackathons", { title: "No link hack" }, "a"); const future = new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10); const ok = await call("POST", "/api/community/hackathons", { title: "Smart India Hackathon", url: "https://example.com/sih", deadline: future, tags: ["AI"] }, "a"); const l = await call("GET", "/api/community/hackathons", undefined, "b"); return bad.status === 400 && ok.status === 201 && l.body.hackathons.length === 1; });
    await t("collaboration workspace", async () => {
      const w = await call("POST", "/api/workspaces", { name: "Capstone team" }, "a"); const id = w.body.id; const hidden = await call("GET", `/api/workspaces/${id}`, undefined, "b");
      const add = await call("POST", `/api/workspaces/${id}/members`, { email: emails.b }, "a"); const shown = await call("GET", `/api/workspaces/${id}`, undefined, "b");
      const tk = await call("POST", `/api/workspaces/${id}/tasks`, { title: "Design DB schema" }, "b"); const up = await call("PUT", `/api/workspaces/${id}/tasks/${tk.body.id}`, { status: "doing" }, "a"); const msg = await call("POST", `/api/workspaces/${id}/messages`, { body: "Kickoff at 6pm" }, "b"); const full = await call("GET", `/api/workspaces/${id}`, undefined, "a");
      return hidden.status === 404 && add.status === 201 && shown.body.members.length === 2 && up.body.success && full.body.tasks[0].status === "doing" && full.body.messages.length === 1;
    });

    // ---------- faculty / admin
    await t("students cannot use faculty/admin routes", async () => (await call("GET", "/api/faculty/students", undefined, "a")).status === 403 && (await call("GET", "/api/admin/users", undefined, "a")).status === 403 && (await call("GET", "/api/admin/audit", undefined, "faculty")).status === 403);
    await t("faculty student list + detail", async () => { const l = await call("GET", "/api/faculty/students", undefined, "faculty"); const row = l.body.students.find((s) => s.email === emails.a); const d = await call("GET", `/api/faculty/students/${row.id}`, undefined, "faculty"); return l.body.total >= 2 && row.readiness > 0 && d.body.student?.risk && d.body.projects.length === 1; });
    await t("at-risk detection flags inactive/empty student", async () => { const r = await call("GET", "/api/faculty/at-risk", undefined, "faculty"); const b = r.body.students.find((s) => s.email === emails.b); return b && b.risk.reasons.some((x) => /No assessments/.test(x)); });
    await t("college analytics", async () => { const r = await call("GET", "/api/faculty/analytics", undefined, "faculty"); return r.body.analytics.students >= 2 && r.body.analytics.subjectAverages.length > 0 && r.body.analytics.topSkills.length > 0; });
    await t("admin overview", async () => { const r = await call("GET", "/api/admin/overview", undefined, "admin"); return r.body.overview.users.total >= 4 && r.body.overview.users.admins >= 1; });
    await t("admin role change + audit trail", async () => { const users = await call("GET", `/api/admin/users?q=${emails.b}`, undefined, "admin"); const id = users.body.users[0].id; const p = await call("PATCH", `/api/admin/users/${id}`, { role: "faculty" }, "admin"); const back = await call("PATCH", `/api/admin/users/${id}`, { role: "student" }, "admin"); const au = await call("GET", "/api/admin/audit?action=admin.update_user", undefined, "admin"); return p.body.success && back.body.success && au.body.logs.length >= 2; });
    await t("last admin cannot be demoted", async () => { const me = await call("GET", "/api/me", undefined, "admin"); return (await call("PATCH", `/api/admin/users/${me.body.student.id}`, { isActive: false }, "admin")).status === 409; });
    await t("deactivated account is blocked", async () => { const users = await call("GET", `/api/admin/users?q=${emails.b}`, undefined, "admin"); const id = users.body.users[0].id; await call("PATCH", `/api/admin/users/${id}`, { isActive: false }, "admin"); const blocked = await call("GET", "/api/me", undefined, "b"); await call("PATCH", `/api/admin/users/${id}`, { isActive: true }, "admin"); return blocked.status === 403; });
    await t("question management feeds assessments", async () => { const c = await call("POST", "/api/manage/questions", { subject: "campusquiz", level: "beginner", question: "Which office handles placements here?", options: ["Training & Placement Cell", "Library", "Canteen"], correct: "Training & Placement Cell", explanation: "The T&P cell." }, "faculty"); const bad = await call("POST", "/api/manage/questions", { subject: "x", question: "Bad question here?", options: ["a", "b"], correct: "c" }, "faculty"); const s = await call("POST", "/api/assessments/start", { type: "technical", subject: "campusquiz", count: 3 }, "a"); const stud = await call("POST", "/api/manage/questions", {}, "a"); return c.status === 201 && bad.status === 400 && s.body.questions?.length === 1 && stud.status === 403; });
    await t("course management", async () => { const c = await call("POST", "/api/manage/courses", { title: "SQL Bootcamp", skill: "sql", provider: "College LMS", url: "https://example.com/sql", hours: 12 }, "faculty"); const l = await call("GET", "/api/courses?skill=SQL", undefined, "a"); return c.status === 201 && l.body.courses.length === 1; });
    await t("CSV exports are formula-safe", async () => { await call("PUT", "/api/me", { name: "=HYPERLINK(\"x\")" }, "b"); const r = await call("GET", "/api/faculty/export/students.csv", undefined, "faculty"); const a = await call("GET", "/api/admin/export/audit", undefined, "admin"); const f = await call("GET", "/api/faculty/export/students.csv", undefined, "a"); return typeof r.body === "string" && r.body.includes("'=HYPERLINK") && !/,=HYPERLINK/.test(r.body) && a.status === 200 && f.status === 403; });

    // ---------- ops
    await t("backup create + list", async () => { const b = await call("POST", "/api/admin/backup", {}, "admin"); const l = await call("GET", "/api/admin/backups", undefined, "admin"); return b.body.backup?.sizeBytes > 1000 && l.body.backups.length >= 1; });
    await t("metrics", async () => { const r = await call("GET", "/api/admin/metrics", undefined, "admin"); return r.body.requests.total > 10 && r.body.uptimeSeconds >= 0; });

    // ---------- sessions & account deletion
    await t("logout-all invalidates older tokens", async () => { const old = tokens.a; await new Promise((r) => setTimeout(r, 1100)); await call("POST", "/api/auth/logout-all", {}, "a"); const r1 = await call("GET", "/api/me", undefined, "a"); const login = await call("POST", "/api/auth/login", { email: emails.a, password: "Passw0rd!" }); tokens.a = login.body.token; const r2 = await call("GET", "/api/me", undefined, "a"); void old; return r1.status === 401 && r2.status === 200; });
    await t("account deletion cascades", async () => { const bad = await call("DELETE", "/api/me", { password: "nope" }, "b"); const ok = await call("DELETE", "/api/me", { password: "NewPass123" }, "b"); const after = await call("GET", "/api/me", undefined, "b"); return bad.status === 401 && ok.body.success && after.status === 401; });
  } finally { srv.kill(); try { fs.rmSync(dbCopy, { recursive: true, force: true }); } catch { /* ignore */ } }
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})();

