/** Security headers, rate limiting, request logging, strict auth, roles, audit trail, validation helpers. */
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const db = require("../database");

const LOG_DIR = path.join(__dirname, "..", "logs");
const metrics = { startedAt: Date.now(), requests: 0, errors5xx: 0, errors4xx: 0, rateLimited: 0 };

// ---------------------------------------------------------------- security headers
function securityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-DNS-Prefetch-Control", "off");
  res.setHeader("Permissions-Policy", "camera=(), geolocation=()");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  if (process.env.NODE_ENV === "production") res.setHeader("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
  next();
}

// ---------------------------------------------------------------- rate limiting (in-memory, per IP)
const buckets = new Map();
function rateLimit(name, max, windowMs) {
  return (req, res, next) => {
    if (process.env.RATE_LIMIT_DISABLED === "true") return next();
    const key = `${name}:${req.ip || req.socket?.remoteAddress || "x"}`;
    const now = Date.now();
    let b = buckets.get(key);
    if (!b || b.reset <= now) { b = { count: 0, reset: now + windowMs }; buckets.set(key, b); }
    b.count++;
    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader("X-RateLimit-Remaining", String(Math.max(0, max - b.count)));
    if (b.count > max) {
      metrics.rateLimited++;
      res.setHeader("Retry-After", String(Math.ceil((b.reset - now) / 1000)));
      return res.status(429).json({ success: false, message: "Too many requests. Please slow down and try again shortly." });
    }
    next();
  };
}
setInterval(() => { const now = Date.now(); for (const [k, b] of buckets) if (b.reset <= now) buckets.delete(k); }, 60_000).unref();

// ---------------------------------------------------------------- request logging / monitoring
function requestLogger(req, res, next) {
  const start = Date.now();
  res.on("finish", () => {
    if (!req.originalUrl.startsWith("/api")) return;
    metrics.requests++;
    if (res.statusCode >= 500) metrics.errors5xx++; else if (res.statusCode >= 400) metrics.errors4xx++;
    if (process.env.REQUEST_LOG === "false") return;
    const line = JSON.stringify({ t: new Date().toISOString(), m: req.method, u: req.originalUrl.split("?")[0], s: res.statusCode, ms: Date.now() - start, uid: req.studentId || null, ip: req.ip }) + "\n";
    fs.mkdir(LOG_DIR, { recursive: true }, () => fs.appendFile(path.join(LOG_DIR, `app-${new Date().toISOString().slice(0, 10)}.log`), line, () => {}));
  });
  next();
}

// ---------------------------------------------------------------- auth
const list = (v) => String(v || "").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);
function roleForEmail(email, current) {
  const e = String(email || "").toLowerCase();
  if (list(process.env.ADMIN_EMAILS).includes(e)) return "admin";
  if (current !== "admin" && list(process.env.FACULTY_EMAILS).includes(e)) return "faculty";
  return current || "student";
}

function loadStudent(req) {
  const h = req.headers.authorization || "";
  if (!h.startsWith("Bearer ")) return { error: 401, message: "Authentication required." };
  let payload;
  try { payload = jwt.verify(h.slice(7), process.env.JWT_SECRET); } catch { return { error: 401, message: "Session expired or invalid. Please log in again." }; }
  const s = db.prepare("SELECT id, name, email, role, is_active, password_changed_at FROM students WHERE id = ?").get(payload.id);
  if (!s) return { error: 401, message: "Account not found." };
  if (Number(s.is_active) === 0) return { error: 403, message: "This account has been deactivated." };
  // tokens issued before a password change / "log out everywhere" are no longer valid
  if (s.password_changed_at && payload.iat && payload.iat < Math.floor(Date.parse(s.password_changed_at.replace(" ", "T") + "Z") / 1000)) return { error: 401, message: "Session expired. Please log in again." };
  const role = roleForEmail(s.email, s.role);
  if (role !== s.role) db.prepare("UPDATE students SET role = ? WHERE id = ?").run(role, s.id);
  return { student: { id: s.id, name: s.name, email: s.email, role } };
}

/** Strict auth: 401 without a valid token. */
function requireAuth(req, res, next) {
  const r = loadStudent(req);
  if (r.error) return res.status(r.error).json({ success: false, message: r.message });
  req.student = r.student; req.studentId = r.student.id;
  // lightweight activity stamp (at most once per minute per request path is fine for SQLite)
  try { db.prepare("UPDATE students SET last_active_at = CURRENT_TIMESTAMP WHERE id = ?").run(r.student.id); } catch { /* ignore */ }
  next();
}

/** Role gate. Must come after requireAuth. */
const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.student?.role) ? next() : res.status(403).json({ success: false, message: "You do not have permission to do this." });

/** Optional: when REQUIRE_AUTH_FOR_AI=true, legacy AI endpoints also need a valid token. Off by default. */
const AI_PATHS = /^\/api\/(mentor|resume|jobs|career|skill-gap|roadmap|resources|projects|quiz|mock-interview|career-analysis)/;
function enforceAuthForAI(req, res, next) {
  if (process.env.REQUIRE_AUTH_FOR_AI !== "true") return next();
  if (req.method === "OPTIONS" || !AI_PATHS.test(req.path)) return next();
  return requireAuth(req, res, next);
}

// ---------------------------------------------------------------- audit trail
function audit(req, action, target = "", details = {}) {
  try {
    db.prepare("INSERT INTO audit_logs (actor_id, actor_role, action, target, details, ip) VALUES (?,?,?,?,?,?)")
      .run(req.student?.id || null, req.student?.role || null, action, String(target).slice(0, 200), JSON.stringify(details).slice(0, 2000), req.ip || null);
  } catch (e) { console.error("audit failed:", e.message); }
}

// ---------------------------------------------------------------- validation helpers
const V = {
  str: (v, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : ""),
  int: (v, def = 0, min = -1e9, max = 1e9) => { const n = parseInt(v, 10); return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : def; },
  num: (v, def = 0) => (Number.isFinite(+v) ? +v : def),
  oneOf: (v, allowed, def) => (allowed.includes(v) ? v : def),
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || "").trim()),
  url: (v, max = 500) => { const s = typeof v === "string" ? v.trim().slice(0, max) : ""; return /^https?:\/\/[^\s<>"']+$/i.test(s) ? s : ""; },
  date: (v) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v || "")) && !Number.isNaN(Date.parse(v)) ? v : ""),
  list: (v, max = 30, each = 60) => (Array.isArray(v) ? v : typeof v === "string" ? v.split(/[,;\n]/) : []).map((x) => String(x).trim().slice(0, each)).filter(Boolean).slice(0, max),
};
const bad = (res, message, status = 400) => res.status(status).json({ success: false, message });

module.exports = { metrics, securityHeaders, rateLimit, requestLogger, requireAuth, requireRole, enforceAuthForAI, audit, roleForEmail, V, bad, LOG_DIR };
