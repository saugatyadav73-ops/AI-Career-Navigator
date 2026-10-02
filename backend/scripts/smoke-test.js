/* Smoke test: starts the server on a random port and calls every feature endpoint.
   Usage: npm test   (works with or without AI keys) */
const { spawn } = require("child_process");
const path = require("path");
const PORT = 5600 + Math.floor(Math.random() * 300);
const base = `http://localhost:${PORT}`;
const profile = { name: "Asha", skills: ["Python", "SQL", "Git"], interests: ["AI", "data analysis"], education: "B.Tech CSE", projects: [{ title: "Sales Dashboard", description: "SQL reports", tech: ["SQL", "Python"] }] };
const post = (p, b) => fetch(base + p, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }).then(async (r) => ({ status: r.status, body: await r.json() }));
const tests = [
  ["GET /api/health", () => fetch(base + "/api/health").then(async (r) => ({ status: r.status, body: await r.json() })), (b) => b.status === "healthy"],
  ["mentor", () => post("/api/mentor/chat", { message: "How do I start in AI?", profile }), (b) => b.answer?.reply],
  ["resume analyze-text", () => post("/api/resume/analyze-text", { resumeText: "Asha Rao asha@x.com 9876543210 github.com/asha\nEducation B.Tech CSE\nSkills Python SQL Git\nProjects Built a sales dashboard with SQL and Python improving reporting speed by 30%. Developed a classifier.", targetRole: "Data Analyst" }), (b) => b.analysis?.overallScore >= 0],
  ["job match", () => post("/api/jobs/match", { profile }), (b) => b.matches?.length > 0],
  ["career predict", () => post("/api/career/predict", { profile }), (b) => b.predictions?.length > 0],
  ["skill gap analyze", () => post("/api/skill-gap/analyze", { profile, targetRole: "Data Analyst" }), (b) => Array.isArray(b.analysis?.gaps)],
  ["roadmap", () => post("/api/roadmap/generate", { profile, targetRole: "Data Analyst", quizScores: { sql: 40 } }), (b) => b.roadmap?.phases?.length > 0],
  ["resources", () => post("/api/resources/recommend", { missingSkills: ["Pandas", "Power BI"] }), (b) => b.recommendations?.length === 2],
  ["project generator", () => post("/api/projects/generate", { profile, targetRole: "Data Analyst", level: "beginner" }), (b) => b.projects?.length > 0],
  ["resume builder", () => post("/api/resume/build", { profile, targetRole: "Data Analyst", email: "a@x.com" }), (b) => b.resume?.header && b.text],
  ["quiz (python)", () => post("/api/quiz/generate", { subject: "Python", difficulty: "medium", count: 4 }), (b) => b.questions?.length > 0],
  ["quiz (react)", () => post("/api/quiz/generate", { subject: "React", count: 3 }), (b) => b.questions?.length > 0],
  ["legacy skill-gap questions", () => post("/api/skill-gap/questions", { skill: "SQL", count: 5, difficulty: "beginner" }), (b) => b.questions?.length > 0],
  ["legacy interview question", () => post("/api/mock-interview/question", { career: "Full Stack Web Developer", difficulty: "medium", previousQuestions: [] }), (b) => b.question?.question],
  ["legacy interview evaluate", () => post("/api/mock-interview/evaluate", { question: "Explain the event loop in Node.js.", answer: "Node uses a single thread with a non-blocking event loop; callbacks and async promises are queued by libuv. For example in my project I used async calls." }), (b) => b.evaluation?.score > 0],
  ["legacy interview report", () => post("/api/mock-interview/report", { evaluations: [{ score: 70, strengths: ["a"], improvements: ["b"] }, { score: 50 }] }), (b) => b.report?.overallScore === 60],
  ["feedback", () => post("/api/feedback", { feature: "smoke", rating: 5, comment: "ok" }), (b) => b.success],
];
(async () => {
  const srv = spawn("node", ["server.js"], { cwd: path.join(__dirname, ".."), env: { ...process.env, PORT: String(PORT) }, stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 1500));
  let failed = 0;
  for (const [name, run, ok] of tests) {
    try {
      const { status, body } = await run();
      const pass = status < 400 && ok(body);
      if (!pass) failed++;
      console.log(`${pass ? "PASS" : "FAIL"}  ${name}  (${status}${body.engine ? ", " + body.engine : ""})${pass ? "" : " " + JSON.stringify(body).slice(0, 200)}`);
    } catch (e) { failed++; console.log(`FAIL  ${name}  ${e.message}`); }
  }
  srv.kill();
  console.log(failed ? `\n${failed} test(s) failed` : "\nAll tests passed");
  process.exit(failed ? 1 : 0);
})();
