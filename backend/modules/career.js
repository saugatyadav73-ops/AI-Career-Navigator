/** Career intelligence: what-if simulator, digital twin, comparison, explanation, copilot / next-best-action. */
const express = require("express");
const db = require("../database");
const K = require("../ai/knowledge");
const { requireAuth, V, bad } = require("./middleware");
const U = require("./util");

const router = express.Router();
// /api/career/predict is an existing public-compatible endpoint (routes/features.js); leave it untouched
router.use("/api/career", (req, res, next) => (req.path === "/predict" ? next() : requireAuth(req, res, next)));
router.use("/api/copilot", requireAuth);

const roleById = (idOrName) => K.ROLES.find((r) => r.id === idOrName) || K.findRole(idOrName);
function coverage(role, have) {
  const set = new Set(have); let total = 0, got = 0; const matched = [], missing = [];
  for (const [s, w] of role.skills) { total += w; if (set.has(s)) { got += w; matched.push(s); } else missing.push({ skill: s, weight: w }); }
  missing.sort((a, b) => b.weight - a.weight);
  return { percent: total ? Math.round((got / total) * 100) : 0, matched, missing };
}
const HOURS = { 3: 40, 2: 25, 1: 12 };
const weeksFor = (missing, hpw = 8) => Math.ceil(missing.reduce((a, m) => a + HOURS[m.weight], 0) / hpw);
const effectiveSkills = (sid) => {
  // skills the student has, minus those proven weak in assessments
  const weak = new Set(U.assessmentStats(sid).weakTopics.map((t) => K.normSkill(t.topic)));
  return U.profileSkills(U.loadProfile(sid)).filter((s) => !weak.has(s));
};
const rolesFromBody = (b, max = 4) => [...new Set(V.list(b?.careers || b?.roles, max, 80))].map(roleById).filter(Boolean);

router.get("/api/career/roles", (req, res) => res.json({ success: true, roles: K.ROLES.map((r) => ({ id: r.id, name: r.name, skills: r.skills.map(([s, w]) => ({ skill: K.pretty(s), weight: w })) })) }));

// ---------------------------------------------------------------- what-if simulator
router.post("/api/career/what-if", (req, res) => {
  const roles = rolesFromBody(req.body, 5);
  const addSkills = K.normList(V.list(req.body?.addSkills, 15));
  const hpw = V.int(req.body?.hoursPerWeek, 8, 1, 60);
  const base = [...new Set([...effectiveSkills(req.studentId), ...K.normList(V.list(req.body?.currentSkills, 40))])];
  const list = roles.length ? roles : K.ROLES.slice(0, 4);
  const scenarios = list.map((role) => {
    const now = coverage(role, base), after = coverage(role, [...base, ...addSkills]);
    return { career: role.name, careerId: role.id, now: now.percent, afterAdding: after.percent, gain: after.percent - now.percent,
      stillMissing: after.missing.slice(0, 6).map((m) => K.pretty(m.skill)), estimatedWeeksNow: weeksFor(now.missing, hpw), estimatedWeeksAfter: weeksFor(after.missing, hpw) };
  }).sort((a, b) => b.afterAdding - a.afterAdding);
  res.json({ success: true, scenario: { addedSkills: addSkills.map(K.pretty), hoursPerWeek: hpw, baseSkills: base.map(K.pretty) }, results: scenarios,
    best: scenarios[0] ? `${scenarios[0].career} becomes your closest match at ${scenarios[0].afterAdding}%.` : null,
    note: "Simulation uses skill coverage of the role definition; it is a planning aid, not a hiring prediction." });
});

// ---------------------------------------------------------------- comparison
router.post("/api/career/compare", (req, res) => {
  const roles = rolesFromBody(req.body, 4);
  if (roles.length < 2) return bad(res, "Choose at least two careers to compare.");
  const base = effectiveSkills(req.studentId); const hpw = V.int(req.body?.hoursPerWeek, 8, 1, 60);
  const all = roles.map((r) => new Set(r.skills.map(([s]) => s)));
  const common = [...all[0]].filter((s) => all.every((set) => set.has(s)));
  const compare = roles.map((role, i) => {
    const cov = coverage(role, base);
    const demand = K.JOBS.filter((j) => j.role === role.id).length;
    return { career: role.name, careerId: role.id, matchPercent: cov.percent, youHave: cov.matched.map(K.pretty),
      gaps: cov.missing.map((m) => ({ skill: K.pretty(m.skill), importance: m.weight, resource: K.resourcesFor(m.skill)[0] || null })),
      uniqueSkills: [...all[i]].filter((s) => !common.includes(s) && all.filter((set) => set.has(s)).length === 1).map(K.pretty),
      learningPath: cov.missing.slice(0, 5).map((m, n) => ({ step: n + 1, skill: K.pretty(m.skill), hours: HOURS[m.weight] })),
      estimatedWeeks: weeksFor(cov.missing, hpw), openRolesInCatalogue: demand };
  });
  res.json({ success: true, commonSkills: common.map(K.pretty), compare, recommendation: [...compare].sort((a, b) => b.matchPercent - a.matchPercent)[0]?.career });
});

// ---------------------------------------------------------------- explanation of a recommendation
router.post("/api/career/explain", async (req, res) => {
  const role = roleById(V.str(req.body?.career, 100)) || U.targetRoleOf(req.studentId);
  if (!role) return bad(res, "Tell us which career to explain (e.g. \"Data Analyst\").");
  const profile = U.loadProfile(req.studentId); const skills = effectiveSkills(req.studentId); const cov = coverage(role, skills);
  const interests = K.normList(profile.interests).concat(K.normList(profile.careerInterest));
  const interestHits = role.keywords.filter((k) => interests.some((i) => i.includes(k) || k.includes(i)));
  const a = U.assessmentStats(req.studentId);
  const rules = () => ({
    career: role.name, matchPercent: cov.percent,
    reasons: [
      cov.matched.length ? `You already have ${cov.matched.length} of ${role.skills.length} core skills: ${cov.matched.map(K.pretty).join(", ")}.` : "You are starting fresh, so this fit comes from interests rather than skills.",
      interestHits.length ? `Your interests overlap with this field (${interestHits.slice(0, 4).join(", ")}).` : "Your stated interests do not strongly overlap yet; consider exploring this field through a small project.",
      a.average !== null ? `Your assessment average is ${a.average}%, which ${a.average >= 60 ? "supports" : "suggests more practice before"} this path.` : "No assessments taken yet, so the score is based on profile data only.",
    ],
    gaps: cov.missing.slice(0, 5).map((m) => K.pretty(m.skill)), confidence: cov.matched.length >= 4 && a.average !== null ? "high" : cov.matched.length >= 2 ? "medium" : "low",
    nextStep: cov.missing[0] ? `Start with ${K.pretty(cov.missing[0].skill)} (highest-weight gap).` : "You cover all core skills. Build a portfolio project.",
  });
  const out = await U.aiOrRules({ task: "career_explanation", userId: req.studentId, rules,
    prompt: `Explain in JSON {"career","matchPercent","reasons":[3 strings],"gaps":[strings],"confidence":"low|medium|high","nextStep"} why ${role.name} suits this student.\nSkills: ${skills.join(", ")}\nInterests: ${interests.join(", ")}\nMatched: ${cov.matched.join(", ")}\nMissing: ${cov.missing.map((m) => m.skill).join(", ")}\nAssessment average: ${a.average}\nReturn JSON only.`,
    valid: (d) => d && Array.isArray(d.reasons) && d.reasons.length });
  res.json({ success: true, engine: out.engine, explanation: out.data });
});

// ---------------------------------------------------------------- digital twin
function buildTwin(sid) {
  const snap = U.studentSnapshot(sid); const profile = U.loadProfile(sid); const skills = effectiveSkills(sid); const a = U.assessmentStats(sid);
  const ranked = K.ROLES.map((r) => ({ role: r, ...coverage(r, skills) })).sort((x, y) => y.percent - x.percent);
  const top = ranked.slice(0, 3);
  const strengths = a.subjects.filter((s) => s.latest >= 70).map((s) => s.subject);
  return {
    generatedAt: new Date().toISOString(), name: profile.fullName, education: profile.education || null, college: profile.college || null,
    skills: skills.map(K.pretty), interests: K.normList(profile.interests).map(K.pretty), strengths, weakAreas: a.weakTopics.slice(0, 5).map((t) => t.topic),
    topCareers: top.map((t) => ({ career: t.role.name, match: t.percent, nextSkill: t.missing[0] ? K.pretty(t.missing[0].skill) : null })),
    targetRole: snap.targetRole, readiness: snap.readiness, profileCompletion: snap.profileCompletion, assessmentAverage: a.average,
    level: snap.level, xp: snap.xp, streak: snap.streak, projects: db.prepare("SELECT COUNT(*) c FROM hub_projects WHERE student_id=?").get(sid).c,
    certificates: db.prepare("SELECT COUNT(*) c FROM certificates WHERE student_id=?").get(sid).c, interviews: db.prepare("SELECT COUNT(*) c FROM student_history WHERE student_id=? AND kind='interview'").get(sid).c,
  };
}
router.get("/api/career/digital-twin", (req, res) => {
  const twin = buildTwin(req.studentId);
  U.setDoc(req.studentId, "digital_twin", twin);
  const prev = U.listHistory(req.studentId, "twin", 1)[0];
  if (!prev || prev.createdAt.slice(0, 10) !== U.today()) U.addHistory(req.studentId, "twin", { readiness: twin.readiness, skills: twin.skills.length, topCareer: twin.topCareers[0]?.career || null, avg: twin.assessmentAverage });
  const history = U.listHistory(req.studentId, "twin", 12).reverse();
  res.json({ success: true, twin, history, changes: prev ? { readiness: twin.readiness - (prev.readiness ?? 0), skills: twin.skills.length - (prev.skills ?? 0) } : null });
});

// ---------------------------------------------------------------- copilot / next-best-action
function nextActions(sid) {
  const out = []; const add = (priority, title, why, link) => out.push({ priority, title, why, link });
  const profile = U.loadProfile(sid); const comp = U.profileCompletion(profile);
  if (comp.percent < 80) add(1, "Complete your profile", `${comp.percent}% done. Missing: ${comp.missing.slice(0, 3).map((m) => m.label).join(", ")}.`, "/profile");
  const a = U.assessmentStats(sid);
  if (!a.totalAttempts) add(2, "Take your first skill assessment", "Assessments unlock weak-topic detection and a more accurate career match.", "/practice");
  if (a.weakTopics[0]) add(2, `Revise ${a.weakTopics[0].topic}`, `You scored ${a.weakTopics[0].percent}% on it.`, "/planner");
  const role = U.targetRoleOf(sid);
  if (!role) add(3, "Pick a target career", "Choose a career so roadmap, planner and job matching can be personalised.", "/careers");
  else { const cov = coverage(role, effectiveSkills(sid)); if (cov.missing[0]) add(3, `Learn ${K.pretty(cov.missing[0].skill)}`, `Biggest gap for ${role.name}.`, "/roadmap"); }
  const goals = db.prepare("SELECT COUNT(*) c, SUM(done) d FROM daily_goals WHERE student_id=? AND goal_date=?").get(sid, U.today());
  if (!goals.c) add(4, "Set today's learning goals", "A small daily target keeps your streak alive.", "/planner");
  else if ((goals.d || 0) < goals.c) add(4, "Finish today's goals", `${goals.c - (goals.d || 0)} left for today.`, "/planner");
  if (!db.prepare("SELECT 1 x FROM student_history WHERE student_id=? AND kind='interview' LIMIT 1").get(sid)) add(5, "Try a mock interview", "Practice answers out loud before real interviews.", "/mock-interview");
  if (!db.prepare("SELECT 1 x FROM hub_projects WHERE student_id=? LIMIT 1").get(sid)) add(5, "Start a portfolio project", "Projects are the strongest proof of skill for recruiters.", "/portfolio");
  const soon = db.prepare("SELECT title, company, deadline FROM job_applications WHERE student_id=? AND status IN ('saved','applied') AND deadline IS NOT NULL AND deadline BETWEEN ? AND date(?, '+3 day') ORDER BY deadline LIMIT 1").get(sid, U.today(), U.today());
  if (soon) add(1, `Deadline soon: ${soon.title} at ${soon.company}`, `Due ${soon.deadline}.`, "/jobs");
  if (!U.streakFor(sid).activeToday) add(6, "Do one small activity today", "Keep your learning streak going.", "/community");
  return out.sort((x, y) => x.priority - y.priority);
}
router.get("/api/copilot/next-actions", (req, res) => {
  const actions = nextActions(req.studentId);
  res.json({ success: true, best: actions[0] || null, actions: actions.slice(0, 6) });
});

module.exports = router;
module.exports.nextActions = nextActions;
module.exports.buildTwin = buildTwin;
module.exports.coverage = coverage;
