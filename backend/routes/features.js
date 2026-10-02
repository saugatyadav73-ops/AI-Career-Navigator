/**
 * Feature router - 10 AI features + offline-capable replacements for AI-only endpoints.
 *
 * Every endpoint:  1) tries the AI orchestrator (OpenAI -> Gemini -> HuggingFace, logged in ai_logs)
 *                  2) falls back to the deterministic rule engine, so the app NEVER dies without API keys.
 * Responses carry  engine: "ai" | "rules"  (+ provider/model when AI answered).
 *
 * This router is mounted BEFORE the legacy routes in server.js. For legacy paths
 * (/api/skill-gap/questions, /api/mock-interview/*, /api/resume/analyze) it calls next()
 * when an AI provider exists (legacy AI handler runs) and answers itself when none exists.
 */
const express = require("express");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const orchestrator = require("../ai/orchestrator");
const K = require("../ai/knowledge");
const B = require("../ai/questionBank");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ------------------------------------------------------------ helpers
function auth(req, res, next) {
  const h = req.headers.authorization || "";
  if (h.startsWith("Bearer ")) {
    try { req.studentId = jwt.verify(h.slice(7), process.env.JWT_SECRET).id; } catch { /* anonymous */ }
  }
  next();
}
const hasAI = () => orchestrator.availableProviders().length > 0;
const hasOpenAI = () => {
  const v = String(process.env.OPENAI_API_KEY || "").trim();
  return Boolean(v) && !/YOUR_|_HERE|CHANGE_ME|xxxx|<.*>/i.test(v);
};
const str = (v, d = "") => (typeof v === "string" && v.trim() ? v.trim() : d);
const arr = (v) => (Array.isArray(v) ? v : []);
const clamp = (n, a = 0, b = 100) => Math.max(a, Math.min(b, Number.isFinite(+n) ? +n : a));

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

/** Try AI (validated by `valid`), otherwise return the rule-engine result. */
async function aiOrRules({ task, prompt, userId, rules, valid = (x) => x && typeof x === "object" }) {
  if (hasAI()) {
    try {
      const r = await orchestrator.generate({ task, prompt, userId });
      const data = parseJson(r.text);
      if (valid(data)) return { data, engine: "ai", provider: r.provider, model: r.model };
    } catch (e) {
      if (e.name !== "AiUnavailableError") console.error(`[${task}]`, e.message);
    }
  }
  return { data: rules(), engine: "rules" };
}
const send = (res, key, out, extra = {}) =>
  res.json({ success: true, engine: out.engine, provider: out.provider, model: out.model, [key]: out.data, ...extra });

const fail = (res, e, msg) => {
  console.error(msg, e);
  return res.status(500).json({ success: false, message: msg, error: process.env.NODE_ENV === "production" ? undefined : e.message });
};

function roleFrom(body) {
  return K.findRole(`${str(body.targetRole)} ${str(body.career)} ${str(body.role)}`) || K.ROLES[0];
}
function profileOf(body) {
  const p = body.profile && typeof body.profile === "object" ? body.profile : body;
  return {
    skills: K.normList(p.skills), interests: arr(p.interests).length ? arr(p.interests).map(String) : K.normList(p.interests),
    education: str(p.education), projects: arr(p.projects),
    projectText: arr(p.projects).map((x) => (typeof x === "string" ? x : `${x.title || x.name || ""} ${x.description || ""} ${(x.tech || x.technologies || []).join?.(" ") || ""}`)).join(" "),
    name: str(p.name, "Student"), level: str(p.level, "beginner").toLowerCase(),
  };
}
function coverage(roleSkills, have) {
  const set = new Set(have);
  let total = 0, got = 0;
  const matched = [], missing = [];
  for (const [s, w] of roleSkills) {
    total += w;
    if (set.has(s)) { got += w; matched.push(s); } else missing.push({ skill: s, weight: w });
  }
  missing.sort((a, b) => b.weight - a.weight);
  return { percent: total ? Math.round((got / total) * 100) : 0, matched, missing };
}

// ======================================================== LEGACY INTERCEPTS (offline mode)
router.post("/api/skill-gap/questions", auth, (req, res, next) => {
  if (hasAI()) return next();
  const { skill, count = 10, difficulty = "beginner", completed = 0, previousQuestions = [] } = req.body || {};
  if (!str(skill)) return res.status(400).json({ success: false, message: "Skill is required." });
  const done = clamp(parseInt(completed, 10) || 0, 0, 100);
  const n = Math.min(clamp(parseInt(count, 10) || 10, 1, 10), 100 - done);
  const out = B.subjectQuestions({ subject: skill, difficulty, count: n, exclude: arr(previousQuestions) });
  if (!out) {
    return res.status(404).json({
      success: false,
      message: `No offline question bank for "${skill}". Add an AI key in backend/.env for any subject, or choose one of: ${B.listSubjects().map((s) => s.subject).join(", ")}.`,
    });
  }
  return res.json({ success: true, engine: "rules", skill: skill.trim(), difficulty, questions: out.questions, count: out.questions.length, completed: done, maximumQuestions: 100 });
});

router.post("/api/mock-interview/question", auth, (req, res, next) => {
  if (hasAI()) return next();
  const { career = "Software Developer", difficulty = "beginner", previousQuestions = [] } = req.body || {};
  const role = K.findRole(career);
  const item = B.interviewQuestion({ roleId: role?.id, difficulty, previousQuestions });
  return res.json({ success: true, engine: "rules", question: { question: item.question, category: role ? role.name : "General", difficulty: item.level, expectedPoints: item.keywords } });
});

function scoreAnswer(question, answer) {
  const item = B.findInterviewItem(question);
  const text = String(answer || "").toLowerCase();
  const words = text.split(/\s+/).filter(Boolean).length;
  const kws = item?.keywords || [];
  const hits = kws.filter((k) => text.includes(k.toLowerCase()));
  const kwScore = kws.length ? (hits.length / kws.length) * 70 : Math.min(words, 80) * 0.6;
  const depth = Math.min(words, 90) / 90 * 20;
  const example = /for example|for instance|e\.g\.|in my project|i built|i used/.test(text) ? 10 : 0;
  const score = Math.round(clamp(kwScore + depth + example, words < 5 ? 5 : 15, 98));
  return {
    score, rating: score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Average" : "Needs Improvement",
    feedback: `You covered ${hits.length}/${kws.length || "?"} key points${hits.length ? ` (${hits.join(", ")})` : ""}. ${words < 30 ? "Your answer is short - add more explanation." : "Good depth."} ${example ? "Nice use of an example." : "Add a real example from your projects."}`,
    strengths: [...(hits.length ? [`Mentioned key concepts: ${hits.slice(0, 4).join(", ")}`] : []), ...(words >= 40 ? ["Answer has reasonable depth"] : [])],
    improvements: [...kws.filter((k) => !hits.includes(k)).slice(0, 3).map((k) => `Cover "${k}"`), ...(example ? [] : ["Add a concrete example"])],
    idealAnswer: item?.ideal || "State the concept, give a short example from your own work, and end with the result or lesson learned.",
  };
}
router.post("/api/mock-interview/evaluate", auth, (req, res, next) => {
  if (hasAI()) return next();
  const { question, answer } = req.body || {};
  if (!str(question) || !str(answer)) return res.status(400).json({ success: false, message: "question and answer are required." });
  return res.json({ success: true, engine: "rules", evaluation: scoreAnswer(question, answer) });
});

router.post("/api/mock-interview/report", auth, (req, res, next) => {
  if (hasAI()) return next();
  const evs = arr(req.body?.evaluations).map((e) => e?.evaluation || e || {});
  if (!evs.length) return res.status(400).json({ success: false, message: "evaluations are required." });
  const scores = evs.map((e) => clamp(e.score));
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const strengths = [...new Set(evs.flatMap((e) => arr(e.strengths)))].slice(0, 5);
  const weaknesses = [...new Set(evs.flatMap((e) => arr(e.improvements)))].slice(0, 5);
  const report = {
    overallScore: avg, technicalKnowledge: clamp(avg + 3), communication: clamp(avg - 2), problemSolving: clamp(avg),
    technicalScore: clamp(avg + 3), communicationScore: clamp(avg - 2), problemSolvingScore: clamp(avg),
    readinessLevel: avg >= 80 ? "Interview Ready" : avg >= 60 ? "Almost Ready" : avg >= 40 ? "Developing" : "Needs Improvement",
    summary: `You answered ${evs.length} question(s) with an average score of ${avg}%.`,
    strengths: strengths.length ? strengths : ["Completed the full interview"],
    weaknesses: weaknesses.length ? weaknesses : ["Add more depth and examples"],
    recommendations: ["Revise the concepts listed under weaknesses", "Practise answers aloud using the STAR method", "Retake the mock interview after one week"],
  };
  return res.json({ success: true, engine: "rules", report });
});

router.post("/api/resume/analyze", auth, (req, res, next) => {
  // Legacy handler (OpenAI file analysis) owns the request when an OpenAI key exists.
  // Do not touch the body stream in that case.
  if (hasOpenAI()) return next();
  upload.single("resume")(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    try {
      const text = req.file ? await fileToText(req.file) : str(req.body?.resumeText);
      if (!text) {
        return res.status(422).json({ success: false, message: "Could not read text from this file. Upload a TXT/DOCX/text-based PDF (run npm install for PDF/DOCX support) or use the paste-text Resume Analyzer." });
      }
      const targetRole = str(req.body?.targetRole);
      const prompt = `You are an ATS and resume expert. Analyse this resume${targetRole ? ` for the role "${targetRole}"` : ""}.\nRESUME:\n"""${text.slice(0, 7000)}"""\nReturn valid JSON only: {"overallScore":0-100,"atsScore":0-100,"summary":"","strengths":[],"weaknesses":[],"atsIssues":[],"missingSkills":[],"missingKeywords":[],"suggestions":[]}`;
      const out = await aiOrRules({ task: "resume_analyzer_file", prompt, userId: req.studentId, valid: (d) => d && d.overallScore !== undefined, rules: () => ruleResumeAnalysis(text, targetRole) });
      return res.json({ success: true, engine: out.engine, analysis: out.data });
    } catch (e) { return fail(res, e, "Resume analysis failed."); }
  });
});

async function fileToText(file) {
  const name = (file.originalname || "").toLowerCase();
  if (file.mimetype === "text/plain" || name.endsWith(".txt")) return file.buffer.toString("utf8");
  try {
    if (name.endsWith(".pdf")) { const pdf = require("pdf-parse"); return (await pdf(file.buffer)).text || ""; }
    if (name.endsWith(".docx")) { const m = require("mammoth"); return (await m.extractRawText({ buffer: file.buffer })).value || ""; }
  } catch { /* optional dependency not installed */ }
  return "";
}

function ruleResumeAnalysis(text, targetRole) {
  const t = text.toLowerCase();
  const role = K.findRole(targetRole) || K.findRole(text) || K.ROLES[0];
  const found = K.extractSkills(text);
  const cov = coverage(role.skills, found);
  const issues = [];
  const checks = [
    [/[\w.+-]+@[\w-]+\.[\w.]+/.test(text), "Add a professional email address"],
    [/(\+?\d[\d\s-]{8,})/.test(text), "Add a phone number"],
    [/linkedin\.com|github\.com/.test(t), "Add LinkedIn / GitHub links"],
    [/education|b\.?tech|b\.?e\b|bachelor|degree|university|college/.test(t), "Add an Education section"],
    [/project/.test(t), "Add a Projects section with tech stack and results"],
    [/skills?/.test(t), "Add a dedicated Skills section"],
    [/experience|intern|work/.test(t), "Add Experience / Internship section (or relevant coursework)"],
    [/\d+\s?%|\d+\+|\b\d{2,}\b/.test(text), "Quantify achievements (e.g. 'reduced load time by 30%')"],
    [/(built|developed|designed|implemented|created|led|optimi[sz]ed|deployed)/.test(t), "Start bullets with strong action verbs (built, designed, optimised)"],
  ];
  for (const [ok, msg] of checks) if (!ok) issues.push(msg);
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words < 150) issues.push("Resume is very short - expand projects and skills");
  if (words > 900) issues.push("Resume is too long - keep it to 1 page for freshers");
  const score = Math.round(clamp(cov.percent * 0.45 + (checks.length - issues.filter((i) => checks.some((c) => c[1] === i)).length) / checks.length * 45 + (words >= 150 && words <= 900 ? 10 : 0)));
  return {
    engine: "rules", overallScore: score, atsScore: score, targetRole: role.name,
    summary: `ATS-style check against ${role.name}: ${found.length} skills detected, ${cov.percent}% of role skills covered.`,
    strengths: [...(found.length ? [`Detected skills: ${found.slice(0, 8).map(K.pretty).join(", ")}`] : []), ...(issues.length < 4 ? ["Resume structure is mostly ATS-friendly"] : [])],
    weaknesses: issues.slice(0, 8),
    atsIssues: issues,
    missingSkills: cov.missing.slice(0, 8).map((m) => K.pretty(m.skill)),
    missingKeywords: cov.missing.slice(0, 8).map((m) => K.pretty(m.skill)),
    suggestions: [
      ...cov.missing.slice(0, 3).map((m) => `Learn and add a project using ${K.pretty(m.skill)}`),
      "Use a single-column layout with standard headings (Education, Skills, Projects, Experience)",
      "Tailor keywords to each job description",
    ],
  };
}

// ======================================================== NEW FEATURES
// 1. AI Career Mentor ---------------------------------------------------------------
router.post("/api/mentor/chat", auth, async (req, res) => {
  try {
    const message = str(req.body?.message);
    if (!message) return res.status(400).json({ success: false, message: "message is required." });
    const history = arr(req.body?.history).slice(-8).map((m) => `${m.role === "assistant" ? "Mentor" : "Student"}: ${String(m.content || "").slice(0, 600)}`).join("\n");
    const p = profileOf(req.body || {});
    const prompt = `You are a friendly, practical AI career mentor for Indian CSE/IT students. Answer in simple Hinglish-friendly English.
Student profile: ${JSON.stringify({ skills: p.skills, interests: p.interests, education: p.education })}
Conversation so far:\n${history || "(none)"}
Student question: ${message}
Return valid JSON only: {"reply":"<helpful answer, max 180 words>","suggestedActions":["<3 short next steps>"],"relatedRoles":["<up to 3 roles>"]}`;
    const out = await aiOrRules({
      task: "career_mentor", prompt, userId: req.studentId,
      valid: (d) => d && typeof d.reply === "string",
      rules: () => ruleMentor(message, p),
    });
    send(res, "answer", out);
  } catch (e) { fail(res, e, "Mentor failed."); }
});
function ruleMentor(message, p) {
  const t = message.toLowerCase();
  const role = K.findRole(t) || K.findRole(p.interests.join(" ")) || K.ROLES[0];
  const cov = coverage(role.skills, p.skills);
  let reply;
  if (/resume|cv/.test(t)) reply = "Keep your resume to one page: Education, Skills, 2-3 Projects with measurable results, and links to GitHub/LinkedIn. Use action verbs and tailor keywords to the job. Use the Resume Analyzer to get your ATS score.";
  else if (/interview/.test(t)) reply = `Practise role-specific questions for ${role.name}. Explain concepts out loud, add one example from your projects per answer, and use the Mock Interview module weekly.`;
  else if (/project/.test(t)) reply = `Build 2 projects for ${role.name}: one guided clone to learn fundamentals and one original idea solving a real problem. Use the Project Generator for ideas with milestones.`;
  else if (/roadmap|learn|start|begin|how to/.test(t)) reply = `For ${role.name}, learn in this order: ${role.skills.slice().sort((a, b) => b[1] - a[1]).slice(0, 5).map((s) => K.pretty(s[0])).join(" -> ")}. Use the Roadmap tool to get a week-by-week plan.`;
  else reply = `Based on your interests, ${role.name} looks like a good direction. You already cover about ${cov.percent}% of its core skills${cov.missing.length ? `; focus next on ${cov.missing.slice(0, 3).map((m) => K.pretty(m.skill)).join(", ")}` : ""}.`;
  return {
    reply, relatedRoles: [role.name, ...K.ROLES.filter((r) => r.id !== role.id).slice(0, 2).map((r) => r.name)],
    suggestedActions: ["Run the Skill Gap analysis for your target role", "Generate your learning roadmap", "Build one portfolio project"],
  };
}

// 2. Resume Analyzer (text) -----------------------------------------------------------
router.post("/api/resume/analyze-text", auth, async (req, res) => {
  try {
    const text = str(req.body?.resumeText);
    if (text.length < 40) return res.status(400).json({ success: false, message: "Paste your resume text (at least a few lines)." });
    const targetRole = str(req.body?.targetRole);
    const prompt = `You are an ATS and resume expert. Analyse this resume${targetRole ? ` for the role "${targetRole}"` : ""}.
RESUME:\n"""${text.slice(0, 7000)}"""
Return valid JSON only: {"overallScore":0-100,"atsScore":0-100,"summary":"","strengths":[],"weaknesses":[],"atsIssues":[],"missingSkills":[],"missingKeywords":[],"suggestions":[]}`;
    const out = await aiOrRules({ task: "resume_analyzer", prompt, userId: req.studentId, valid: (d) => d && d.overallScore !== undefined, rules: () => ruleResumeAnalysis(text, targetRole) });
    send(res, "analysis", out);
  } catch (e) { fail(res, e, "Resume analysis failed."); }
});

// 3. Job Matcher -------------------------------------------------------------------
router.post("/api/jobs/match", auth, async (req, res) => {
  try {
    const p = profileOf(req.body || {});
    if (!p.skills.length) return res.status(400).json({ success: false, message: "Add at least one skill." });
    const jd = str(req.body?.jobDescription);
    const items = [...K.JOBS.map((j) => ({ ...j, required: j.required, nice: j.nice }))];
    if (jd) items.unshift({ id: "custom", title: str(req.body?.jobTitle, "Your Job Description"), required: K.extractSkills(jd), nice: [] });
    const rules = () => items.map((j) => {
      const req_ = j.required.map(K.normSkill);
      const have = req_.filter((s) => p.skills.includes(s));
      const nice = j.nice.map(K.normSkill).filter((s) => p.skills.includes(s));
      const pct = req_.length ? Math.round(((have.length + nice.length * 0.3) / (req_.length + 0.3 * j.nice.length)) * 100) : 0;
      return { id: j.id, title: j.title, matchPercentage: clamp(pct), matchedSkills: have.map(K.pretty), missingSkills: req_.filter((s) => !p.skills.includes(s)).map(K.pretty), niceToHaveMissing: j.nice.map(K.normSkill).filter((s) => !p.skills.includes(s)).map(K.pretty) };
    }).sort((a, b) => b.matchPercentage - a.matchPercentage).slice(0, 8);
    const out = { data: rules(), engine: "rules" };
    if (hasAI() && jd) {
      const prompt = `Compare this student with the job.\nSTUDENT SKILLS: ${p.skills.join(", ")}\nJOB DESCRIPTION: """${jd.slice(0, 4000)}"""\nReturn valid JSON only: {"matches":[{"id":"custom","title":"","matchPercentage":0-100,"matchedSkills":[],"missingSkills":[],"niceToHaveMissing":[]}]}`;
      const ai = await aiOrRules({ task: "job_matcher", prompt, userId: req.studentId, valid: (d) => Array.isArray(d?.matches) && d.matches.length, rules: () => null });
      if (ai.engine === "ai") { out.data = [...ai.data.matches.map((m) => ({ ...m, id: "custom", matchPercentage: clamp(m.matchPercentage) })), ...out.data.filter((x) => x.id !== "custom")]; out.engine = "ai"; out.provider = ai.provider; out.model = ai.model; }
    }
    send(res, "matches", out);
  } catch (e) { fail(res, e, "Job matching failed."); }
});

// 4. Career Prediction --------------------------------------------------------------
router.post("/api/career/predict", auth, async (req, res) => {
  try {
    const p = profileOf(req.body || {});
    if (!p.skills.length && !p.interests.length && !p.projectText) return res.status(400).json({ success: false, message: "Provide skills, interests or projects." });
    const text = `${p.interests.join(" ")} ${p.projectText} ${p.education}`.toLowerCase();
    const rules = () => K.ROLES.map((r) => {
      const cov = coverage(r.skills, p.skills);
      const kw = r.keywords.filter((k) => text.includes(k)).length;
      const interest = Math.min(100, (kw / Math.max(3, r.keywords.length / 2)) * 100);
      const match = Math.round(clamp(cov.percent * 0.6 + interest * 0.4));
      return { role: r.name, matchPercentage: match, why: `Skills coverage ${cov.percent}%, interest/project alignment ${Math.round(interest)}%.`, matchedSkills: cov.matched.map(K.pretty), skillsToLearn: cov.missing.slice(0, 5).map((m) => K.pretty(m.skill)) };
    }).sort((a, b) => b.matchPercentage - a.matchPercentage).slice(0, 4);
    const prompt = `Predict the best career roles for this student.
Skills: ${p.skills.join(", ")}\nInterests: ${p.interests.join(", ")}\nEducation: ${p.education}\nProjects: ${p.projectText.slice(0, 1500)}
Return valid JSON only: {"predictions":[{"role":"","matchPercentage":0-100,"why":"","matchedSkills":[],"skillsToLearn":[]}]} with 3-4 roles ranked best first.`;
    const out = await aiOrRules({ task: "career_prediction", prompt, userId: req.studentId, valid: (d) => Array.isArray(d?.predictions) && d.predictions.length, rules });
    send(res, "predictions", { ...out, data: Array.isArray(out.data) ? out.data : out.data.predictions });
  } catch (e) { fail(res, e, "Career prediction failed."); }
});

// 5. Skill Gap AI -------------------------------------------------------------------
router.post("/api/skill-gap/analyze", auth, async (req, res) => {
  try {
    const p = profileOf(req.body || {});
    const jd = str(req.body?.jobDescription);
    const role = roleFrom(req.body || {});
    let required = role.skills;
    if (jd) { const ex = K.extractSkills(jd); if (ex.length >= 3) required = ex.map((s) => [s, role.skills.find((x) => x[0] === s)?.[1] || 2]); }
    const rules = () => {
      const cov = coverage(required, p.skills);
      return {
        targetRole: role.name, readinessPercent: cov.percent,
        haveSkills: cov.matched.map(K.pretty),
        gaps: cov.missing.map((m) => ({ skill: K.pretty(m.skill), priority: m.weight >= 3 ? "High" : m.weight === 2 ? "Medium" : "Low", reason: `${K.pretty(m.skill)} is ${m.weight >= 3 ? "a core requirement" : "commonly expected"} for ${role.name}.` })),
        summary: `You cover ${cov.percent}% of the skills expected for ${role.name}. Close the High priority gaps first.`,
      };
    };
    const prompt = `Compare the student's skills with the target job.\nTarget role: ${role.name}\n${jd ? `Job description: """${jd.slice(0, 3000)}"""\n` : ""}Student skills: ${p.skills.join(", ")}\nReturn valid JSON only: {"targetRole":"","readinessPercent":0-100,"haveSkills":[],"gaps":[{"skill":"","priority":"High|Medium|Low","reason":""}],"summary":""}`;
    const out = await aiOrRules({ task: "skill_gap_analysis", prompt, userId: req.studentId, valid: (d) => Array.isArray(d?.gaps), rules });
    send(res, "analysis", out);
  } catch (e) { fail(res, e, "Skill gap analysis failed."); }
});

// 6. Dynamic Roadmap ----------------------------------------------------------------
// Roadmap changes with: skills the student has, quiz scores per skill (weak -> extra time), completed skills.
router.post("/api/roadmap/generate", auth, async (req, res) => {
  try {
    const p = profileOf(req.body || {});
    const role = roleFrom(req.body || {});
    const scores = {};
    for (const [k, v] of Object.entries(req.body?.quizScores || {})) scores[K.normSkill(k)] = clamp(v);
    const completed = new Set(K.normList(req.body?.completedSkills));
    const hoursPerWeek = clamp(req.body?.hoursPerWeek || 8, 2, 40);
    const rules = () => {
      const cov = coverage(role.skills, p.skills.filter((s) => !(scores[s] < 50)));
      const todo = role.skills.filter(([s]) => !completed.has(s) && (!p.skills.includes(s) || (scores[s] !== undefined && scores[s] < 60)));
      todo.sort((a, b) => b[1] - a[1]);
      let week = 1;
      const phases = todo.map(([s, w]) => {
        const weak = scores[s] !== undefined && scores[s] < 60;
        const weeks = Math.max(1, Math.round((w + (weak ? 1 : 0) + (p.skills.includes(s) ? 0 : 1)) * (8 / hoursPerWeek)));
        const ph = { skill: K.pretty(s), reason: weak ? `Quiz score ${scores[s]}% - revise fundamentals` : "Missing skill for the target role", priority: w >= 3 ? "High" : w === 2 ? "Medium" : "Low", startWeek: week, endWeek: week + weeks - 1, tasks: [`Learn ${K.pretty(s)} basics from the recommended resources`, `Solve 10 practice exercises on ${K.pretty(s)}`, `Take the ${K.pretty(s)} quiz and score 70%+`], miniProject: `Build a small ${K.pretty(s)} demo and push it to GitHub`, resources: K.resourcesFor(s) };
        week += weeks;
        return ph;
      });
      return { targetRole: role.name, currentReadiness: cov.percent, totalWeeks: Math.max(0, week - 1), hoursPerWeek, phases, note: phases.length ? "Roadmap re-generates when quiz scores or completed skills change." : "You already cover all core skills - start interview preparation and portfolio projects." };
    };
    const prompt = `Create a personalised week-by-week learning roadmap.\nTarget role: ${role.name}\nCurrent skills: ${p.skills.join(", ")}\nQuiz scores (weak <60 need more time): ${JSON.stringify(scores)}\nCompleted: ${[...completed].join(", ")}\nHours per week: ${hoursPerWeek}\nReturn valid JSON only: {"targetRole":"","currentReadiness":0-100,"totalWeeks":0,"hoursPerWeek":0,"phases":[{"skill":"","reason":"","priority":"High|Medium|Low","startWeek":1,"endWeek":2,"tasks":[],"miniProject":"","resources":[{"type":"","title":"","url":""}]}],"note":""}`;
    const out = await aiOrRules({ task: "dynamic_roadmap", prompt, userId: req.studentId, valid: (d) => Array.isArray(d?.phases), rules });
    send(res, "roadmap", out);
  } catch (e) { fail(res, e, "Roadmap generation failed."); }
});

// 7. Resource Recommendation ----------------------------------------------------------
router.post("/api/resources/recommend", auth, async (req, res) => {
  try {
    const skills = K.normList(req.body?.missingSkills || req.body?.skills);
    if (!skills.length) return res.status(400).json({ success: false, message: "missingSkills is required." });
    const rules = () => skills.slice(0, 12).map((s) => ({ skill: K.pretty(s), resources: K.resourcesFor(s) }));
    const prompt = `For each skill recommend free, well-known learning resources (official docs, courses, YouTube channels). Skills: ${skills.join(", ")}\nReturn valid JSON only: {"recommendations":[{"skill":"","resources":[{"type":"Documentation|Course|Video|Practice","title":"","url":""}]}]}. Only use URLs you are certain exist (official documentation homepages).`;
    const out = await aiOrRules({ task: "resource_recommendation", prompt, userId: req.studentId, valid: (d) => Array.isArray(d?.recommendations), rules });
    send(res, "recommendations", { ...out, data: Array.isArray(out.data) ? out.data : out.data.recommendations });
  } catch (e) { fail(res, e, "Resource recommendation failed."); }
});

// 8. Project Generator -------------------------------------------------------------------
const PROJECT_IDEAS = {
  fullstack: [["Job Tracker Dashboard", "Track applications, statuses and reminders", ["React", "Node.js", "Express", "MongoDB"]], ["Real-time Chat App", "Rooms, typing indicator, message history", ["React", "Node.js", "Socket.io", "MongoDB"]], ["Expense Splitter", "Split bills among friends with settlements", ["React", "Express", "SQL"]], ["Online Quiz Platform", "Timed quizzes, leaderboard and admin panel", ["React", "Node.js", "SQL"]]],
  aiml: [["Student Performance Predictor", "Predict grades from study habits", ["Python", "pandas", "scikit-learn"]], ["Resume Skill Extractor (NLP)", "Extract skills from resumes", ["Python", "spaCy", "Flask"]], ["Image Classifier", "Classify plant diseases from photos", ["Python", "TensorFlow", "Streamlit"]], ["Fake News Detector", "Text classification with TF-IDF", ["Python", "scikit-learn"]]],
  data: [["Sales Insights Dashboard", "KPIs and trends from sales CSVs", ["SQL", "Python", "Power BI"]], ["COVID/Weather Data Explorer", "Clean, analyse, visualise a public dataset", ["Python", "pandas", "Matplotlib"]], ["Customer Churn Analysis", "Find churn drivers with SQL + Python", ["SQL", "pandas", "scikit-learn"]]],
  cyber: [["Password Strength & Breach Checker", "Entropy scoring and hashed breach lookups", ["Python", "hashlib"]], ["Network Port Scanner", "Scan hosts you own and report services", ["Python", "sockets"]], ["Secure Login System", "Hashing, rate limits, JWT, OWASP checks", ["Node.js", "bcrypt", "JWT"]]],
  backend: [["Library Management API", "CRUD, auth, fines and search", ["Java", "Spring Boot", "SQL"]], ["URL Shortener Service", "Short links with analytics", ["Java", "SQL", "Redis"]], ["Bank Transaction Simulator", "Accounts, transfers, ACID", ["Java", "SQL"]]],
  devops: [["CI/CD Pipeline for a Web App", "Build, test and deploy on every push", ["GitHub Actions", "Docker", "AWS"]], ["Containerised Microservices", "Two services with Docker Compose", ["Docker", "Linux", "Node.js"]], ["Monitoring Dashboard", "Metrics and alerts for a sample app", ["Prometheus", "Grafana", "Docker"]]],
  mobile: [["Habit Tracker App", "Streaks, reminders, charts", ["React Native", "SQLite"]], ["Campus Event App", "Browse and RSVP to events", ["Flutter", "Firebase"]], ["Expense Tracker", "Offline-first with sync", ["React Native", "REST API"]]],
};
router.post("/api/projects/generate", auth, async (req, res) => {
  try {
    const p = profileOf(req.body || {});
    const role = roleFrom(req.body || {});
    const level = ["beginner", "intermediate", "advanced"].includes(str(req.body?.level).toLowerCase()) ? str(req.body.level).toLowerCase() : "beginner";
    const count = clamp(parseInt(req.body?.count, 10) || 3, 1, 5);
    const avoid = new Set(arr(req.body?.previousProjects).map((x) => String(x).toLowerCase()));
    const rules = () => {
      const pool = (PROJECT_IDEAS[role.id] || PROJECT_IDEAS.fullstack).filter((x) => !avoid.has(x[0].toLowerCase()));
      return B.shuffle(pool.length ? pool : PROJECT_IDEAS[role.id]).slice(0, count).map(([title, desc, stack]) => ({
        title, description: desc, level, techStack: stack,
        skillsPracticed: stack.map((s) => s), estimatedWeeks: level === "beginner" ? 2 : level === "intermediate" ? 4 : 6,
        milestones: [{ week: 1, goal: "Plan features, design data model, set up repo" }, { week: 2, goal: "Build core features end-to-end" }, ...(level !== "beginner" ? [{ week: 3, goal: "Add authentication, validation and tests" }, { week: 4, goal: "Polish UI, write README, deploy" }] : [{ week: 2, goal: "Deploy and write README with screenshots" }]), ...(level === "advanced" ? [{ week: 5, goal: "Add caching/CI pipeline and performance tuning" }, { week: 6, goal: "Load test and document architecture" }] : [])],
        stretchGoals: ["Add unit tests", "Add CI with GitHub Actions", "Write a short blog post about what you learned"],
      }));
    };
    const prompt = `Generate ${count} NEW and DIFFERENT project ideas for a ${level} student targeting ${role.name}.\nStudent skills: ${p.skills.join(", ")}\nAvoid these: ${[...avoid].join(", ")}\nRandom seed: ${Math.random().toString(36).slice(2, 8)}\nReturn valid JSON only: {"projects":[{"title":"","description":"","level":"${level}","techStack":[],"skillsPracticed":[],"estimatedWeeks":0,"milestones":[{"week":1,"goal":""}],"stretchGoals":[]}]}`;
    const out = await aiOrRules({ task: "project_generator", prompt, userId: req.studentId, valid: (d) => Array.isArray(d?.projects) && d.projects.length, rules });
    send(res, "projects", { ...out, data: Array.isArray(out.data) ? out.data : out.data.projects });
  } catch (e) { fail(res, e, "Project generation failed."); }
});

// 9. Resume Builder -----------------------------------------------------------------------
router.post("/api/resume/build", auth, async (req, res) => {
  try {
    const b = req.body || {};
    const p = profileOf(b);
    const role = roleFrom(b);
    const rules = () => {
      const projects = arr(b.projects || b.profile?.projects).map((x) => typeof x === "string" ? { title: x, description: "", tech: [] } : { title: x.title || x.name || "Project", description: x.description || "", tech: x.tech || x.technologies || [] });
      const verbs = ["Built", "Designed", "Implemented", "Developed"];
      return {
        header: { name: p.name, email: str(b.email || b.profile?.email), phone: str(b.phone || b.profile?.phone), links: arr(b.links || b.profile?.links) },
        summary: `Aspiring ${role.name} with hands-on experience in ${p.skills.slice(0, 4).map(K.pretty).join(", ") || "core CS fundamentals"}. ${p.education ? `Currently pursuing ${p.education}. ` : ""}Eager to build reliable, user-focused software and keep learning.`,
        skills: p.skills.map(K.pretty),
        education: p.education ? [{ degree: p.education, institution: str(b.institution || b.profile?.institution), year: str(b.year || b.profile?.year) }] : [],
        projects: projects.map((pr, i) => ({ title: pr.title, tech: pr.tech, bullets: [`${verbs[i % verbs.length]} ${pr.title}${pr.description ? ` - ${pr.description}` : ""}${pr.tech.length ? ` using ${pr.tech.join(", ")}` : ""}.`, "Wrote clean, documented code and hosted it on GitHub.", "Tested core flows and fixed issues found during testing."] })),
        experience: arr(b.experience || b.profile?.experience),
        achievements: arr(b.achievements || b.profile?.achievements),
      };
    };
    const prompt = `Write an ATS-friendly fresher resume as JSON for a ${role.name} role. Use ONLY the facts given; never invent employers, degrees or numbers.\nFACTS: ${JSON.stringify({ name: p.name, email: b.email, phone: b.phone, education: p.education, skills: p.skills, projects: b.projects, experience: b.experience, achievements: b.achievements })}\nReturn valid JSON only: {"header":{"name":"","email":"","phone":"","links":[]},"summary":"","skills":[],"education":[{"degree":"","institution":"","year":""}],"projects":[{"title":"","tech":[],"bullets":[""]}],"experience":[{"title":"","company":"","duration":"","bullets":[""]}],"achievements":[]}`;
    const out = await aiOrRules({ task: "resume_builder", prompt, userId: req.studentId, valid: (d) => d?.header && Array.isArray(d?.skills), rules });
    const r = out.data;
    const text = [`${r.header.name}`, [r.header.email, r.header.phone, ...arr(r.header.links)].filter(Boolean).join(" | "), "", "SUMMARY", r.summary, "", "SKILLS", arr(r.skills).join(", "), "", "EDUCATION", ...arr(r.education).map((e) => `${e.degree} - ${e.institution || ""} ${e.year || ""}`), "", "PROJECTS", ...arr(r.projects).flatMap((x) => [`${x.title}${arr(x.tech).length ? ` (${x.tech.join(", ")})` : ""}`, ...arr(x.bullets).map((t) => `  - ${t}`)]), ...(arr(r.experience).length ? ["", "EXPERIENCE", ...arr(r.experience).flatMap((x) => [`${x.title || ""} - ${x.company || ""} ${x.duration || ""}`, ...arr(x.bullets).map((t) => `  - ${t}`)])] : []), ...(arr(r.achievements).length ? ["", "ACHIEVEMENTS", ...r.achievements.map((a) => `  - ${a}`)] : [])].join("\n");
    send(res, "resume", out, { text });
  } catch (e) { fail(res, e, "Resume building failed."); }
});

// 10. Subject quiz generator (different questions every call) ---------------------------
router.get("/api/subjects", (req, res) => res.json({ success: true, subjects: B.listSubjects(), note: "With an AI key any subject works; offline mode serves these banks." }));
router.post("/api/quiz/generate", auth, async (req, res) => {
  try {
    const subject = str(req.body?.subject);
    if (!subject) return res.status(400).json({ success: false, message: "subject is required." });
    const difficulty = str(req.body?.difficulty, "beginner").toLowerCase();
    const count = clamp(parseInt(req.body?.count, 10) || 5, 1, 10);
    const previous = arr(req.body?.previousQuestions);
    const rules = () => B.subjectQuestions({ subject, difficulty, count, exclude: previous })?.questions || null;
    const prompt = `Generate ${count} NEW multiple-choice questions on "${subject}" at ${difficulty} level.\nDo NOT repeat: ${JSON.stringify(previous.slice(-30))}\nSeed: ${Math.random().toString(36).slice(2, 8)}\nReturn valid JSON only: {"questions":[{"question":"","options":["A","B","C","D"],"correctAnswer":"<must equal one option>","explanation":""}]}`;
    const out = await aiOrRules({
      task: "quiz_generator", prompt, userId: req.studentId,
      valid: (d) => Array.isArray(d?.questions) && d.questions.some((q) => Array.isArray(q.options) && q.options.length === 4 && q.options.includes(q.correctAnswer)),
      rules: () => ({ questions: rules() }),
    });
    const qs = arr(out.data.questions).filter((q) => q && Array.isArray(q.options) && q.options.length === 4 && q.options.includes(q.correctAnswer)).slice(0, count).map((q, i) => ({ id: i + 1, ...q, options: B.shuffle(q.options) }));
    if (!qs.length) return res.status(404).json({ success: false, message: `No offline questions for "${subject}". Add an AI key or pick: ${B.listSubjects().map((s) => s.subject).join(", ")}.` });
    res.json({ success: true, engine: out.engine, provider: out.provider, model: out.model, subject, difficulty, questions: qs, count: qs.length });
  } catch (e) { fail(res, e, "Quiz generation failed."); }
});

router.get("/api/features", (req, res) => res.json({
  success: true, aiProviders: orchestrator.availableProviders(), mode: hasAI() ? "ai+rules-fallback" : "rules-only",
  features: ["mentor", "resume-analyzer", "mock-interview", "job-matcher", "career-prediction", "skill-gap", "roadmap", "resources", "project-generator", "resume-builder", "quiz"],
}));

module.exports = router;
