/**
 * Additive feature layer for the 130-item checklist.
 * Mounted from server.js with a single line (before the existing feature router) so security headers,
 * rate limits and request logging also cover the pre-existing endpoints. Existing routes are not modified.
 */
const { securityHeaders, rateLimit, requestLogger, enforceAuthForAI } = require("./middleware");

module.exports = function mountModules(app) {
  require("./schema");
  app.disable("x-powered-by");
  if (process.env.TRUST_PROXY) app.set("trust proxy", /^\d+$/.test(process.env.TRUST_PROXY) ? Number(process.env.TRUST_PROXY) : process.env.TRUST_PROXY);
  else if (process.env.NODE_ENV === "production") app.set("trust proxy", 1); // Render / Railway sit behind one proxy

  app.use(securityHeaders);
  app.use(requestLogger);
  app.use("/api", rateLimit("api", Number(process.env.RATE_LIMIT_MAX || 600), 15 * 60 * 1000));
  // brute-force protection for the pre-existing auth endpoints
  for (const p of ["/api/auth/login", "/api/auth/register", "/api/auth/verify-email", "/api/auth/resend-verification"]) app.use(p, rateLimit("legacy-auth", 30, 15 * 60 * 1000));
  // expensive AI endpoints: tighter per-IP cap
  app.use(["/api/mentor", "/api/resume", "/api/mock-interview", "/api/skill-gap", "/api/career-analysis", "/api/quiz", "/api/roadmap", "/api/projects", "/api/jobs/match", "/api/career/predict"], rateLimit("ai", Number(process.env.AI_RATE_LIMIT_MAX || 120), 15 * 60 * 1000));
  app.use(enforceAuthForAI);

  for (const m of ["auth", "learning", "career", "portfolio", "jobs", "insights", "community", "admin", "ops"]) app.use(require(`./${m}`));
};
