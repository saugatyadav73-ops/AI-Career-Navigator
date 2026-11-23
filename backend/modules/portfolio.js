/** Portfolio hub: certificates, projects (history/roadmap/evaluation), portfolio builder + strength score, GitHub analyzer,
 *  resume optimizer + ATS check, interview history. */
const express = require("express");
const db = require("../database");
const K = require("../ai/knowledge");
const { requireAuth, rateLimit, V, bad } = require("./middleware");
const U = require("./util");

const router = express.Router();
const auth = requireAuth;
const j = (v) => JSON.stringify(v ?? null);
const own = (table, id, sid) => db.prepare(`SELECT * FROM ${table} WHERE id = ? AND student_id = ?`).get(id, sid);

// ================================================================= certificates
const certOut = (r) => ({ id: r.id, title: r.title, issuer: r.issuer, issueDate: r.issue_date, credentialUrl: r.credential_url, skills: U.safeParse(r.skills, []), createdAt: r.created_at });
router.get("/api/certificates", auth, (req, res) => res.json({ success: true, certificates: db.prepare("SELECT * FROM certificates WHERE student_id = ? ORDER BY COALESCE(issue_date,'') DESC, id DESC").all(req.studentId).map(certOut) }));
router.post("/api/certificates", auth, (req, res) => {
  const title = V.str(req.body?.title, 150); if (title.length < 3) return bad(res, "Certificate title is required.");
  if (db.prepare("SELECT COUNT(*) c FROM certificates WHERE student_id = ?").get(req.studentId).c >= 100) return bad(res, "Certificate limit reached.");
  const r = db.prepare("INSERT INTO certificates (student_id, title, issuer, issue_date, credential_url, skills) VALUES (?,?,?,?,?,?)")
    .run(req.studentId, title, V.str(req.body?.issuer, 120), V.date(req.body?.issueDate) || null, V.url(req.body?.credentialUrl) || null, j(K.normList(V.list(req.body?.skills, 12)).map(K.pretty)));
  const xp = U.awardXp(req.studentId, "certificate_added", { dedupe: `cert:${r.lastInsertRowid}` });
  res.status(201).json({ success: true, certificate: certOut(own("certificates", r.lastInsertRowid, req.studentId)), xp });
});
router.put("/api/certificates/:id", auth, (req, res) => {
  const c = own("certificates", req.params.id, req.studentId); if (!c) return bad(res, "Certificate not found.", 404);
  const b = req.body || {};
  db.prepare("UPDATE certificates SET title=?, issuer=?, issue_date=?, credential_url=?, skills=? WHERE id=?").run(
    V.str(b.title, 150) || c.title, b.issuer === undefined ? c.issuer : V.str(b.issuer, 120), b.issueDate === undefined ? c.issue_date : (V.date(b.issueDate) || null),
    b.credentialUrl === undefined ? c.credential_url : (V.url(b.credentialUrl) || null), b.skills === undefined ? c.skills : j(K.normList(V.list(b.skills, 12)).map(K.pretty)), c.id);
  res.json({ success: true, certificate: certOut(own("certificates", c.id, req.studentId)) });
});
router.delete("/api/certificates/:id", auth, (req, res) => (db.prepare("DELETE FROM certificates WHERE id=? AND student_id=?").run(req.params.id, req.studentId).changes ? res.json({ success: true }) : bad(res, "Certificate not found.", 404)));

// ================================================================= projects (history, roadmap, evaluation)
const STATUSES = ["planned", "in_progress", "completed"];
const projOut = (r) => ({ id: r.id, title: r.title, description: r.description, tech: U.safeParse(r.tech, []), difficulty: r.difficulty, status: r.status, githubUrl: r.github_url, liveUrl: r.live_url,
  milestones: U.safeParse(r.milestones, []), score: r.score, feedback: U.safeParse(r.feedback, null), createdAt: r.created_at, updatedAt: r.updated_at });
function milestonesFor(title, difficulty, tech) {
  const t = tech.slice(0, 3).join(", ") || "your stack";
  const base = [`Define scope, users and success criteria for "${title}"`, `Set up the repository, environment and project structure (${t})`, "Build the core feature end-to-end (MVP)", "Add input validation and error handling", "Write basic tests for the main flows"];
  const mid = ["Add authentication or data persistence", "Polish UI/UX and make it responsive"];
  const adv = ["Add caching/performance improvements and logging", "Set up CI and automated checks", "Document architecture decisions and trade-offs"];
  const end = ["Deploy and share a live link", "Write a README with setup steps, screenshots and what you learned"];
  return [...base, ...(difficulty !== "beginner" ? mid : []), ...(difficulty === "advanced" ? adv : []), ...end].map((m, i) => ({ id: i + 1, title: m, done: false }));
}
function evaluate(p) {
  const tech = Array.isArray(p.tech) ? p.tech : [], ms = Array.isArray(p.milestones) ? p.milestones : [];
  const doneRatio = ms.length ? ms.filter((m) => m.done).length / ms.length : 0;
  const parts = [
    ["Description", (p.description || "").length >= 150 ? 15 : (p.description || "").length >= 60 ? 9 : 3, 15, (p.description || "").length >= 150 ? "Clear description." : "Expand the description: problem, solution, impact."],
    ["Tech stack", Math.min(15, tech.length * 5), 15, tech.length >= 3 ? "Good variety of technologies." : "List at least 3 relevant technologies."],
    ["Source code", p.githubUrl ? 20 : 0, 20, p.githubUrl ? "Source is public on GitHub." : "Publish the code on GitHub."],
    ["Live demo", p.liveUrl ? 15 : 0, 15, p.liveUrl ? "Live demo available." : "Deploy it and add a live link."],
    ["Milestones", Math.round(doneRatio * 20), 20, ms.length ? `${Math.round(doneRatio * 100)}% of milestones done.` : "Generate a milestone roadmap and track it."],
    ["Complexity", { beginner: 5, medium: 10, advanced: 15 }[p.difficulty] || 5, 15, p.difficulty === "advanced" ? "Challenging scope." : "Stretch scope with one advanced feature (auth, caching, tests)."],
  ];
  const score = parts.reduce((a, x) => a + x[1], 0);
  return { score, breakdown: parts.map(([area, got, max, note]) => ({ area, got, max, note })), improvements: parts.filter((x) => x[1] < x[2] * 0.6).map((x) => x[3]) };
}
router.get("/api/hub/projects", auth, (req, res) => {
  const rows = db.prepare("SELECT * FROM hub_projects WHERE student_id = ? ORDER BY id DESC").all(req.studentId).map(projOut);
  res.json({ success: true, projects: rows, summary: { total: rows.length, completed: rows.filter((p) => p.status === "completed").length, inProgress: rows.filter((p) => p.status === "in_progress").length } });
});
router.post("/api/hub/projects", auth, (req, res) => {
  const b = req.body || {}; const title = V.str(b.title, 120); if (title.length < 3) return bad(res, "Project title is required.");
  if (db.prepare("SELECT COUNT(*) c FROM hub_projects WHERE student_id = ?").get(req.studentId).c >= 100) return bad(res, "Project limit reached.");
  const difficulty = V.oneOf(String(b.difficulty || "").toLowerCase(), ["beginner", "medium", "advanced"], "beginner");
  const tech = V.list(b.tech, 12, 40); const status = V.oneOf(b.status, STATUSES, "planned");
  const ms = Array.isArray(b.milestones) ? b.milestones.slice(0, 30).map((m, i) => ({ id: i + 1, title: V.str(m?.title, 200), done: Boolean(m?.done) })).filter((m) => m.title) : milestonesFor(title, difficulty, tech);
  const r = db.prepare("INSERT INTO hub_projects (student_id, title, description, tech, difficulty, status, github_url, live_url, milestones) VALUES (?,?,?,?,?,?,?,?,?)")
    .run(req.studentId, title, V.str(b.description, 2000), j(tech), difficulty, status, V.url(b.githubUrl) || null, V.url(b.liveUrl) || null, j(ms));
  const xp = [U.awardXp(req.studentId, "project_added", { dedupe: `proj:${r.lastInsertRowid}` })];
  if (status === "completed") xp.push(U.awardXp(req.studentId, "project_completed", { dedupe: `projdone:${r.lastInsertRowid}` }));
  res.status(201).json({ success: true, project: projOut(own("hub_projects", r.lastInsertRowid, req.studentId)), xp: xp.reduce((a, x) => a + (x.awarded || 0), 0) });
});
router.put("/api/hub/projects/:id", auth, (req, res) => {
  const p = own("hub_projects", req.params.id, req.studentId); if (!p) return bad(res, "Project not found.", 404);
  const b = req.body || {};
  const status = b.status === undefined ? p.status : V.oneOf(b.status, STATUSES, p.status);
  const ms = Array.isArray(b.milestones) ? j(b.milestones.slice(0, 30).map((m, i) => ({ id: i + 1, title: V.str(m?.title, 200), done: Boolean(m?.done) })).filter((m) => m.title)) : p.milestones;
  db.prepare("UPDATE hub_projects SET title=?, description=?, tech=?, difficulty=?, status=?, github_url=?, live_url=?, milestones=?, updated_at=CURRENT_TIMESTAMP WHERE id=?").run(
    V.str(b.title, 120) || p.title, b.description === undefined ? p.description : V.str(b.description, 2000), b.tech === undefined ? p.tech : j(V.list(b.tech, 12, 40)),
    b.difficulty === undefined ? p.difficulty : V.oneOf(String(b.difficulty).toLowerCase(), ["beginner", "medium", "advanced"], p.difficulty),
    status, b.githubUrl === undefined ? p.github_url : (V.url(b.githubUrl) || null), b.liveUrl === undefined ? p.live_url : (V.url(b.liveUrl) || null), ms, p.id);
  const xp = status === "completed" && p.status !== "completed" ? U.awardXp(req.studentId, "project_completed", { dedupe: `projdone:${p.id}` }) : null;
  res.json({ success: true, project: projOut(own("hub_projects", p.id, req.studentId)), xp });
});
router.delete("/api/hub/projects/:id", auth, (req, res) => (db.prepare("DELETE FROM hub_projects WHERE id=? AND student_id=?").run(req.params.id, req.studentId).changes ? res.json({ success: true }) : bad(res, "Project not found.", 404)));
router.post("/api/hub/projects/:id/roadmap", auth, (req, res) => {
  const p = own("hub_projects", req.params.id, req.studentId); if (!p) return bad(res, "Project not found.", 404);
  const ms = milestonesFor(p.title, p.difficulty, U.safeParse(p.tech, []));
  db.prepare("UPDATE hub_projects SET milestones=?, updated_at=CURRENT_TIMESTAMP WHERE id=?").run(j(ms), p.id);
  res.json({ success: true, milestones: ms });
});
router.post("/api/hub/projects/:id/milestone", auth, (req, res) => {
  const p = own("hub_projects", req.params.id, req.studentId); if (!p) return bad(res, "Project not found.", 404);
  const ms = U.safeParse(p.milestones, []); const m = ms.find((x) => x.id === V.int(req.body?.milestoneId, -1));
  if (!m) return bad(res, "Milestone not found.", 404);
  m.done = !m.done; db.prepare("UPDATE hub_projects SET milestones=?, updated_at=CURRENT_TIMESTAMP WHERE id=?").run(j(ms), p.id);
  res.json({ success: true, milestones: ms });
});
router.post("/api/hub/projects/:id/evaluate", auth, (req, res) => {
  const p = own("hub_projects", req.params.id, req.studentId); if (!p) return bad(res, "Project not found.", 404);
  const ev = evaluate(projOut(p));
  db.prepare("UPDATE hub_projects SET score=?, feedback=?, updated_at=CURRENT_TIMESTAMP WHERE id=?").run(ev.score, j(ev), p.id);
  res.json({ success: true, evaluation: ev, note: "Rubric-based evaluation of the project's presentation and completeness (not a code review)." });
});

// ================================================================= GitHub integration + analyzer
const GH_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
async function gh(path) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 9000);
  try {
    const r = await fetch(`https://api.github.com${path}`, { signal: ctl.signal, headers: { "User-Agent": "ai-career-navigator", Accept: "application/vnd.github+json", ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}) } });
    return { status: r.status, body: r.ok ? await r.json() : null, remaining: r.headers.get("x-ratelimit-remaining") };
  } finally { clearTimeout(t); }
}
function analyzeGithub(user, repos) {
  const own = repos.filter((r) => !r.fork); const langs = {}; let stars = 0, forks = 0, described = 0, recent = 0;
  const cutoff = Date.now() - 90 * 86400000;
  for (const r of own) { if (r.language) langs[r.language] = (langs[r.language] || 0) + 1; stars += r.stargazers_count || 0; forks += r.forks_count || 0; if (r.description) described++; if (Date.parse(r.pushed_at) > cutoff) recent++; }
  const score = Math.min(100, Math.min(25, own.length * 3) + Math.min(15, Object.keys(langs).length * 3) + Math.min(15, stars * 1.5) + Math.min(20, recent * 5) + Math.round((own.length ? described / own.length : 0) * 15) + (user.bio ? 5 : 0) + (user.followers >= 5 ? 5 : 0));
  const tips = [];
  if (own.length < 4) tips.push("Publish more original projects (aim for 4+).");
  if (own.length && described / own.length < 0.7) tips.push("Add a short description to every repository.");
  if (recent < 2) tips.push("Commit regularly - fewer than 2 repositories were updated in the last 90 days.");
  if (!user.bio) tips.push("Add a bio to your GitHub profile.");
  if (Object.keys(langs).length < 2) tips.push("Show range: add projects in a second language/stack.");
  return { username: user.login, profileUrl: user.html_url, name: user.name, publicRepos: user.public_repos, originalRepos: own.length, followers: user.followers, totalStars: stars, totalForks: forks, activeLast90Days: recent,
    languages: Object.entries(langs).sort((a, b) => b[1] - a[1]).map(([language, repos]) => ({ language, repos })), score: Math.round(score), tips,
    topRepos: [...own].sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0)).slice(0, 5).map((r) => ({ name: r.name, url: r.html_url, stars: r.stargazers_count, language: r.language, description: r.description })) };
}
router.post("/api/github/analyze", auth, rateLimit("github", 20, 60 * 60 * 1000), async (req, res) => {
  const username = V.str(req.body?.username, 60).replace(/^https?:\/\/github\.com\//i, "").replace(/\/.*$/, "") || V.str(U.loadProfile(req.studentId).github, 60);
  if (!GH_RE.test(username)) return bad(res, "Enter a valid GitHub username.");
  let u, r;
  try { u = await gh(`/users/${username}`); if (u.status === 404) return bad(res, "GitHub user not found.", 404); if (!u.body) return bad(res, "GitHub is rate-limiting requests right now. Try again later.", 503); r = await gh(`/users/${username}/repos?per_page=100&sort=pushed`); }
  catch { return bad(res, "Could not reach GitHub. Try again later.", 502); }
  const analysis = analyzeGithub(u.body, r?.body || []);
  U.setDoc(req.studentId, "github_analysis", { ...analysis, analyzedAt: new Date().toISOString() });
  if (req.body?.save !== false) U.setDoc(req.studentId, "studentProfile", { ...(U.getDoc(req.studentId, "studentProfile", {}) || {}), github: username }); // "GitHub integration": connect profile
  res.json({ success: true, analysis, xp: U.awardXp(req.studentId, "github_analyzed", { dedupe: `gh:${U.today()}` }) });
});
router.get("/api/github/analysis", auth, (req, res) => res.json({ success: true, analysis: U.getDoc(req.studentId, "github_analysis", null) }));

// ================================================================= portfolio builder + strength score
const slugify = (s) => String(s || "student").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30) || "student";
const slugFor = (sid) => `${slugify(U.loadProfile(sid).fullName)}-${sid}`;
function strength(sid) {
  const profile = U.loadProfile(sid); const comp = U.profileCompletion(profile); const pf = U.getDoc(sid, "portfolio", {}) || {};
  const skills = U.profileSkills(profile); const projects = db.prepare("SELECT score, status FROM hub_projects WHERE student_id=?").all(sid);
  const certs = db.prepare("SELECT COUNT(*) c FROM certificates WHERE student_id=?").get(sid).c; const gha = U.getDoc(sid, "github_analysis", null);
  const evald = projects.filter((p) => p.score != null); const mp = U.getDoc(sid, "moduleProgress", {}) || {};
  const parts = [
    ["Profile completeness", Math.round(comp.percent * 0.15), 15, comp.percent < 100 ? "Complete the missing profile fields." : "Profile is complete."],
    ["Skills listed", Math.min(10, skills.length), 10, skills.length >= 8 ? "Good skill coverage." : "List at least 8 relevant skills."],
    ["Projects", Math.min(20, projects.length * 7), 20, projects.length >= 3 ? "Strong project count." : "Add at least 3 projects."],
    ["Project quality", evald.length ? Math.round((evald.reduce((a, p) => a + p.score, 0) / evald.length / 100) * 10) : 0, 10, evald.length ? "Raise project scores with demos, tests and docs." : "Evaluate your projects to see quality scores."],
    ["GitHub", (profile.github ? 5 : 0) + (gha ? Math.round((gha.score / 100) * 5) : 0), 10, profile.github ? (gha ? "GitHub analysed." : "Run the GitHub analyzer.") : "Connect your GitHub username."],
    ["Certificates", Math.min(10, certs * 4), 10, certs >= 3 ? "Good certificate record." : "Add certificates for completed courses."],
    ["Headline & about", (pf.headline ? 5 : 0) + ((pf.about || "").length >= 80 ? 5 : 0), 10, pf.headline && (pf.about || "").length >= 80 ? "Bio is ready." : "Write a headline and an about section (80+ chars)."],
    ["Links", (profile.linkedin || pf.links?.linkedin ? 3 : 0) + (pf.links?.website ? 2 : 0), 5, "Add LinkedIn and a personal website."],
    ["Resume", mp.resume ? 10 : 0, 10, mp.resume ? "Resume completed." : "Build or analyse your resume."],
  ];
  const score = parts.reduce((a, p) => a + p[1], 0);
  return { score, grade: score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Getting started", breakdown: parts.map(([area, got, max, tip]) => ({ area, got, max, tip })), improvements: parts.filter((p) => p[1] < p[2] * 0.6).map((p) => p[3]) };
}
router.get("/api/portfolio/me", auth, (req, res) => {
  const profile = U.loadProfile(req.studentId); const pf = U.getDoc(req.studentId, "portfolio", {}) || {}; const settings = U.getDoc(req.studentId, "settings", {}) || {};
  res.json({ success: true, portfolio: { headline: pf.headline || "", about: pf.about || "", theme: pf.theme || "clean", links: pf.links || { github: profile.github ? `https://github.com/${profile.github}` : "", linkedin: profile.linkedin || "", website: "" }, featuredProjectIds: pf.featuredProjectIds || [], featuredCertificateIds: pf.featuredCertificateIds || [] },
    isPublic: Boolean(settings.publicPortfolio), slug: slugFor(req.studentId), strength: strength(req.studentId) });
});
router.put("/api/portfolio/me", auth, (req, res) => {
  const b = req.body || {}; const cur = U.getDoc(req.studentId, "portfolio", {}) || {};
  const links = b.links && typeof b.links === "object" ? { github: V.url(b.links.github), linkedin: V.url(b.links.linkedin), website: V.url(b.links.website) } : cur.links;
  const ids = (v, table) => (Array.isArray(v) ? v.map((x) => V.int(x, -1)).filter((id) => id > 0 && own(table, id, req.studentId)).slice(0, 20) : undefined);
  const next = { ...cur, headline: b.headline === undefined ? cur.headline : V.str(b.headline, 120), about: b.about === undefined ? cur.about : V.str(b.about, 1200), theme: V.oneOf(b.theme, ["clean", "dark", "colorful"], cur.theme || "clean"), links,
    featuredProjectIds: ids(b.featuredProjectIds, "hub_projects") ?? cur.featuredProjectIds, featuredCertificateIds: ids(b.featuredCertificateIds, "certificates") ?? cur.featuredCertificateIds };
  U.setDoc(req.studentId, "portfolio", next);
  if (typeof b.isPublic === "boolean") U.setDoc(req.studentId, "settings", { ...(U.getDoc(req.studentId, "settings", {}) || {}), publicPortfolio: b.isPublic });
  res.json({ success: true, portfolio: next, strength: strength(req.studentId), slug: slugFor(req.studentId) });
});
router.get("/api/portfolio/strength", auth, (req, res) => res.json({ success: true, strength: strength(req.studentId) }));
router.get("/api/portfolio/public/:slug", rateLimit("portfolio-public", 120, 60 * 1000), (req, res) => {
  const id = parseInt(String(req.params.slug).split("-").pop(), 10);
  const stu = Number.isInteger(id) ? db.prepare("SELECT id, is_active FROM students WHERE id = ?").get(id) : null;
  const settings = stu ? (U.getDoc(stu.id, "settings", {}) || {}) : {};
  if (!stu || !stu.is_active || !settings.publicPortfolio || slugFor(stu.id) !== req.params.slug) return bad(res, "Portfolio not found.", 404);
  const profile = U.loadProfile(stu.id); const pf = U.getDoc(stu.id, "portfolio", {}) || {};
  const pick = (rows, ids) => (ids && ids.length ? rows.filter((r) => ids.includes(r.id)) : rows);
  const projects = pick(db.prepare("SELECT * FROM hub_projects WHERE student_id=? ORDER BY id DESC").all(stu.id).map(projOut), pf.featuredProjectIds).map((p) => ({ title: p.title, description: p.description, tech: p.tech, githubUrl: p.githubUrl, liveUrl: p.liveUrl, status: p.status }));
  const certificates = pick(db.prepare("SELECT * FROM certificates WHERE student_id=? ORDER BY id DESC").all(stu.id).map(certOut), pf.featuredCertificateIds).map((c) => ({ title: c.title, issuer: c.issuer, issueDate: c.issueDate, credentialUrl: c.credentialUrl }));
  res.json({ success: true, portfolio: { name: profile.fullName, headline: pf.headline || "", about: pf.about || "", theme: pf.theme || "clean", skills: U.profileSkills(profile).map(K.pretty), education: profile.education || "", links: pf.links || {}, projects, certificates } });
});

// ================================================================= resume: job-specific optimizer + ATS check (text based)
const SECTION_WORDS = { education: /education|academic/i, skills: /skills|technologies|tech stack/i, experience: /experience|internship|employment|work history/i, projects: /projects?/i, summary: /summary|objective|profile/i };
const VERBS = /\b(built|developed|designed|implemented|created|led|improved|optimized|reduced|increased|launched|automated|deployed|analy[sz]ed|managed|delivered)\b/gi;
function atsCheck(text) {
  const t = String(text || ""); const words = t.split(/\s+/).filter(Boolean).length; const issues = []; let score = 100;
  const miss = (cond, pts, msg) => { if (!cond) { score -= pts; issues.push(msg); } };
  miss(/[^\s@]+@[^\s@]+\.[^\s@]+/.test(t), 10, "Add a professional email address.");
  miss(/(\+?\d[\d\s-]{8,})/.test(t), 5, "Add a phone number.");
  for (const [k, re] of Object.entries(SECTION_WORDS)) if (k !== "summary") miss(re.test(t), 8, `Add a clear "${k[0].toUpperCase() + k.slice(1)}" section heading.`);
  miss(words >= 250, 10, "Resume looks too short (under 250 words). Add detail on projects and skills.");
  miss(words <= 1000, 8, "Resume is long (over 1000 words). Aim for one page for freshers.");
  const verbs = (t.match(VERBS) || []).length; miss(verbs >= 4, 8, "Start bullets with strong action verbs (built, developed, optimized...).");
  const metrics = (t.match(/\b\d+(\.\d+)?\s?(%|x|k|\+|users|ms|hours|days)/gi) || []).length; miss(metrics >= 2, 8, "Quantify impact with numbers (e.g. \"reduced load time by 30%\").");
  miss(/linkedin\.com|github\.com/i.test(t), 5, "Add LinkedIn and/or GitHub links.");
  miss(!/[\u2022\u25CF\u25A0]{3,}|\t{3,}/.test(t), 4, "Avoid tables/columns and decorative symbols; ATS parsers read them poorly.");
  return { score: Math.max(0, score), words, checks: { actionVerbs: verbs, quantifiedResults: metrics }, issues };
}
router.post("/api/resume/ats-check", auth, (req, res) => {
  const text = V.str(req.body?.resumeText, 30000); if (text.length < 80) return bad(res, "Paste your resume text (at least 80 characters).");
  res.json({ success: true, ats: atsCheck(text) });
});
router.post("/api/resume/optimize", auth, (req, res) => {
  const resume = V.str(req.body?.resumeText, 30000), jd = V.str(req.body?.jobDescription, 15000);
  if (resume.length < 80 || jd.length < 40) return bad(res, "Provide both resumeText and jobDescription.");
  const need = K.extractSkills(jd), have = new Set(K.extractSkills(resume)); const matched = need.filter((s) => have.has(s)), missing = need.filter((s) => !have.has(s));
  const keywordMatch = need.length ? Math.round((matched.length / need.length) * 100) : null; const ats = atsCheck(resume);
  const suggestions = [...missing.slice(0, 8).map((s) => `If you genuinely know ${K.pretty(s)}, add it to Skills and mention it in a project bullet.`), ...ats.issues.slice(0, 4)];
  if (!need.length) suggestions.unshift("No recognisable technical skills were found in the job description; paste the full requirements section.");
  res.json({ success: true, optimization: { keywordMatch, matchedKeywords: matched.map(K.pretty), missingKeywords: missing.map(K.pretty), atsScore: ats.score, suggestions, note: "Only add skills you can honestly demonstrate." } });
});

// ================================================================= interview history (technical / HR / voice)
router.post("/api/interviews/history", auth, (req, res) => {
  const b = req.body || {};
  const answers = (Array.isArray(b.answers) ? b.answers : []).slice(0, 30).map((a) => ({ question: V.str(a?.question, 400), score: V.int(a?.score, 0, 0, 100), feedback: V.str(a?.feedback, 600) }));
  const score = b.score !== undefined ? V.int(b.score, 0, 0, 100) : answers.length ? Math.round(answers.reduce((a, x) => a + x.score, 0) / answers.length) : 0;
  const rec = { type: V.oneOf(b.type, ["technical", "hr", "voice", "mixed"], "mixed"), role: V.str(b.role, 100), score, questions: answers.length || V.int(b.questions, 0, 0, 100), answers, durationSec: V.int(b.durationSec, 0, 0, 36000) };
  const id = U.addHistory(req.studentId, "interview", rec);
  res.status(201).json({ success: true, id, record: rec, xp: U.awardXp(req.studentId, "interview_done", { dedupe: `iv:${id}` }) });
});
router.get("/api/interviews/history", auth, (req, res) => {
  let items = U.listHistory(req.studentId, "interview", 100); if (req.query.type) items = items.filter((i) => i.type === req.query.type);
  const scores = items.map((i) => i.score).reverse();
  res.json({ success: true, items, comparison: scores.length ? { attempts: scores.length, latest: scores[scores.length - 1], previous: scores.length > 1 ? scores[scores.length - 2] : null, best: Math.max(...scores), average: Math.round(scores.reduce((a, s) => a + s, 0) / scores.length), trend: scores.length > 1 ? (scores[scores.length - 1] > scores[scores.length - 2] ? "improving" : scores[scores.length - 1] < scores[scores.length - 2] ? "declining" : "steady") : "new" } : null });
});

module.exports = router;
module.exports.strength = strength;
