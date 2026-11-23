/** Auth gaps + account: forgot/reset password, Google login, session mgmt, /me, settings, server-side profile & data sync. */
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const db = require("../database");
const { requireAuth, rateLimit, audit, V, bad, roleForEmail } = require("./middleware");
const U = require("./util");

const router = express.Router();
const RESET_MINUTES = 15;
const RESET_COOLDOWN_S = 60;
const strictAuth = rateLimit("auth", 20, 15 * 60 * 1000);

// ---------------------------------------------------------------- mail (same SMTP_* env vars as the main server)
let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: String(process.env.SMTP_SECURE) === "true", auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
}
const signToken = (s) => jwt.sign({ id: s.id, email: s.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
const publicStudent = (s) => ({ id: s.id, name: s.name, email: s.email, role: roleForEmail(s.email, s.role), emailVerified: true, avatarUrl: s.avatar_url || null });

// ---------------------------------------------------------------- forgot / reset password
router.post("/api/auth/forgot-password", strictAuth, async (req, res) => {
  const email = V.str(req.body?.email, 200).toLowerCase();
  if (!V.email(email)) return bad(res, "Please enter a valid email address.");
  const generic = { success: true, message: "If an account exists for this email, a reset code has been sent." };
  const s = db.prepare("SELECT id, name, email, reset_sent_at FROM students WHERE email = ?").get(email);
  if (!s) return res.json(generic); // do not reveal whether the email exists
  if (s.reset_sent_at && Date.now() - Date.parse(s.reset_sent_at.replace(" ", "T") + "Z") < RESET_COOLDOWN_S * 1000)
    return bad(res, `Please wait ${RESET_COOLDOWN_S} seconds before requesting another code.`, 429);
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
  const hash = await bcrypt.hash(code, 10);
  db.prepare("UPDATE students SET reset_code_hash = ?, reset_expires_at = ?, reset_sent_at = CURRENT_TIMESTAMP WHERE id = ?")
    .run(hash, new Date(Date.now() + RESET_MINUTES * 60000).toISOString(), s.id);
  audit({ student: { id: s.id, role: "student" }, ip: req.ip }, "auth.forgot_password", email);
  if (transporter) {
    try {
      await transporter.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to: s.email, subject: "AI Career Navigator - password reset code",
        html: `<p>Hi ${String(s.name).replace(/[<>&]/g, "")},</p><p>Your password reset code is:</p><h2 style="letter-spacing:6px">${code}</h2><p>It expires in ${RESET_MINUTES} minutes. If you did not request this, ignore this email.</p>` });
    } catch (e) { console.error("Reset email failed:", e.message); return bad(res, "Could not send the reset email. Please try again later.", 502); }
    return res.json(generic);
  }
  // No SMTP configured: dev convenience only (mirrors auto-verify behaviour). Never in production.
  if (process.env.NODE_ENV !== "production") return res.json({ ...generic, devCode: code, note: "SMTP is not configured, so the code is returned here (development only)." });
  return res.json(generic);
});

router.post("/api/auth/reset-password", strictAuth, async (req, res) => {
  const email = V.str(req.body?.email, 200).toLowerCase();
  const code = V.str(req.body?.code, 12);
  const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";
  if (!V.email(email) || !/^\d{6}$/.test(code)) return bad(res, "Email and the 6-digit code are required.");
  if (newPassword.length < 6 || newPassword.length > 200) return bad(res, "Password must be at least 6 characters.");
  const s = db.prepare("SELECT id, reset_code_hash, reset_expires_at FROM students WHERE email = ?").get(email);
  if (!s || !s.reset_code_hash || !s.reset_expires_at || Date.parse(s.reset_expires_at) < Date.now()) return bad(res, "Invalid or expired code.");
  if (!(await bcrypt.compare(code, s.reset_code_hash))) return bad(res, "Invalid or expired code.");
  db.prepare("UPDATE students SET password = ?, reset_code_hash = NULL, reset_expires_at = NULL, password_changed_at = CURRENT_TIMESTAMP, email_verified = 1 WHERE id = ?")
    .run(await bcrypt.hash(newPassword, 10), s.id);
  audit({ student: { id: s.id, role: "student" }, ip: req.ip }, "auth.reset_password", email);
  res.json({ success: true, message: "Password updated. You can now log in." });
});

// ---------------------------------------------------------------- Google login (needs GOOGLE_CLIENT_ID)
router.get("/api/auth/google/config", (req, res) => res.json({ success: true, enabled: Boolean(process.env.GOOGLE_CLIENT_ID), clientId: process.env.GOOGLE_CLIENT_ID || null }));
router.post("/api/auth/google", strictAuth, async (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID) return bad(res, "Google login is not configured on this server (GOOGLE_CLIENT_ID missing).", 501);
  const credential = V.str(req.body?.credential, 5000);
  if (!credential) return bad(res, "Google credential is required.");
  let info;
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 8000);
    const r = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`, { signal: ctl.signal });
    clearTimeout(t);
    if (!r.ok) return bad(res, "Google sign-in could not be verified.", 401);
    info = await r.json();
  } catch { return bad(res, "Could not reach Google to verify sign-in.", 502); }
  if (info.aud !== process.env.GOOGLE_CLIENT_ID || String(info.email_verified) !== "true" || !V.email(info.email)) return bad(res, "Google sign-in could not be verified.", 401);
  const email = info.email.toLowerCase();
  let s = db.prepare("SELECT * FROM students WHERE email = ?").get(email);
  if (!s) {
    const r = db.prepare("INSERT INTO students (name, email, password, email_verified, google_id, avatar_url) VALUES (?,?,?,1,?,?)")
      .run(V.str(info.name, 100) || email.split("@")[0], email, await bcrypt.hash(crypto.randomBytes(24).toString("hex"), 10), String(info.sub), V.url(info.picture) || null);
    s = db.prepare("SELECT * FROM students WHERE id = ?").get(r.lastInsertRowid);
  } else {
    if (Number(s.is_active) === 0) return bad(res, "This account has been deactivated.", 403);
    db.prepare("UPDATE students SET google_id = COALESCE(google_id, ?), avatar_url = COALESCE(avatar_url, ?), email_verified = 1 WHERE id = ?").run(String(info.sub), V.url(info.picture) || null, s.id);
    s = db.prepare("SELECT * FROM students WHERE id = ?").get(s.id);
  }
  db.prepare("UPDATE students SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?").run(s.id);
  audit({ student: { id: s.id, role: s.role }, ip: req.ip }, "auth.google_login", email);
  res.json({ success: true, message: "Login successful.", token: signToken(s), student: publicStudent(s) });
});

// ---------------------------------------------------------------- session management
router.post("/api/auth/refresh", requireAuth, (req, res) => {
  const s = db.prepare("SELECT * FROM students WHERE id = ?").get(req.studentId);
  res.json({ success: true, token: signToken(s), student: publicStudent(s) });
});
router.post("/api/auth/logout-all", requireAuth, (req, res) => {
  db.prepare("UPDATE students SET password_changed_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.studentId);
  audit(req, "auth.logout_all", String(req.studentId));
  res.json({ success: true, message: "All other sessions have been signed out. Please log in again on this device." });
});

// ---------------------------------------------------------------- /me, settings, password, delete
router.get("/api/me", requireAuth, (req, res) => {
  const s = db.prepare("SELECT id, name, email, role, avatar_url, created_at, google_id FROM students WHERE id = ?").get(req.studentId);
  res.json({ success: true, student: { id: s.id, name: s.name, email: s.email, role: req.student.role, avatarUrl: s.avatar_url, createdAt: s.created_at, googleLinked: Boolean(s.google_id) } });
});
router.put("/api/me", requireAuth, (req, res) => {
  const name = V.str(req.body?.name, 100);
  if (name.length < 2) return bad(res, "Name must be at least 2 characters.");
  db.prepare("UPDATE students SET name = ? WHERE id = ?").run(name, req.studentId);
  res.json({ success: true, student: { ...req.student, name } });
});
const DEFAULT_SETTINGS = { theme: "light", language: "en", emailNotifications: true, inAppNotifications: true, leaderboardOptIn: false, weeklyStudyHours: 8, publicPortfolio: false };
router.get("/api/me/settings", requireAuth, (req, res) => res.json({ success: true, settings: { ...DEFAULT_SETTINGS, ...(U.getDoc(req.studentId, "settings", {}) || {}) } }));
router.put("/api/me/settings", requireAuth, (req, res) => {
  const b = req.body || {};
  const cur = { ...DEFAULT_SETTINGS, ...(U.getDoc(req.studentId, "settings", {}) || {}) };
  const next = {
    theme: V.oneOf(b.theme, ["light", "dark"], cur.theme), language: V.str(b.language, 10) || cur.language,
    emailNotifications: typeof b.emailNotifications === "boolean" ? b.emailNotifications : cur.emailNotifications,
    inAppNotifications: typeof b.inAppNotifications === "boolean" ? b.inAppNotifications : cur.inAppNotifications,
    leaderboardOptIn: typeof b.leaderboardOptIn === "boolean" ? b.leaderboardOptIn : cur.leaderboardOptIn,
    publicPortfolio: typeof b.publicPortfolio === "boolean" ? b.publicPortfolio : cur.publicPortfolio,
    weeklyStudyHours: V.int(b.weeklyStudyHours, cur.weeklyStudyHours, 1, 80),
  };
  U.setDoc(req.studentId, "settings", next);
  res.json({ success: true, settings: next });
});
router.post("/api/me/change-password", requireAuth, strictAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (typeof newPassword !== "string" || newPassword.length < 6 || newPassword.length > 200) return bad(res, "New password must be at least 6 characters.");
  const s = db.prepare("SELECT password FROM students WHERE id = ?").get(req.studentId);
  if (typeof currentPassword !== "string" || !(await bcrypt.compare(currentPassword, s.password))) return bad(res, "Current password is incorrect.", 401);
  db.prepare("UPDATE students SET password = ?, password_changed_at = CURRENT_TIMESTAMP WHERE id = ?").run(await bcrypt.hash(newPassword, 10), req.studentId);
  audit(req, "auth.change_password", String(req.studentId));
  const fresh = db.prepare("SELECT * FROM students WHERE id = ?").get(req.studentId);
  res.json({ success: true, message: "Password changed.", token: signToken(fresh) });
});
router.delete("/api/me", requireAuth, strictAuth, async (req, res) => {
  const s = db.prepare("SELECT password FROM students WHERE id = ?").get(req.studentId);
  if (typeof req.body?.password !== "string" || !(await bcrypt.compare(req.body.password, s.password))) return bad(res, "Password is incorrect.", 401);
  if (req.student.role === "admin" && db.prepare("SELECT COUNT(*) c FROM students WHERE role='admin' AND is_active=1").get().c <= 1) return bad(res, "You are the only admin. Assign another admin first.", 409);
  audit(req, "account.delete", String(req.studentId));
  db.prepare("DELETE FROM students WHERE id = ?").run(req.studentId); // child tables cascade
  res.json({ success: true, message: "Account and all its data have been deleted." });
});

// ---------------------------------------------------------------- server-side profile (+ completion)
router.get("/api/me/profile", requireAuth, (req, res) => {
  const profile = U.loadProfile(req.studentId);
  res.json({ success: true, profile, completion: U.profileCompletion(profile) });
});
router.put("/api/me/profile", requireAuth, (req, res) => {
  const b = req.body || {};
  const text = (k, max = 300) => (b[k] === undefined ? undefined : V.str(String(b[k] ?? ""), max));
  const patch = {
    fullName: text("fullName", 100), phone: text("phone", 30), college: text("college", 150), education: text("education", 200), year: text("year", 20),
    skills: b.skills === undefined ? undefined : (Array.isArray(b.skills) ? b.skills.join(", ") : V.str(String(b.skills), 600)),
    interests: b.interests === undefined ? undefined : (Array.isArray(b.interests) ? b.interests.join(", ") : V.str(String(b.interests), 600)),
    careerInterest: text("careerInterest", 150), targetRole: text("targetRole", 150), projects: text("projects", 2000), experience: text("experience", 2000),
    github: text("github", 60)?.replace(/^https?:\/\/github\.com\//i, "").replace(/\/.*$/, ""), linkedin: text("linkedin", 200), bio: text("bio", 600), cgpa: text("cgpa", 6),
  };
  for (const k of Object.keys(patch)) if (patch[k] === undefined) delete patch[k];
  if (patch.phone && !/^[+\d][\d\s-]{6,20}$/.test(patch.phone)) return bad(res, "Phone number looks invalid.");
  if (patch.cgpa && !(parseFloat(patch.cgpa) >= 0 && parseFloat(patch.cgpa) <= 10)) return bad(res, "CGPA must be between 0 and 10.");
  const merged = { ...(U.getDoc(req.studentId, "studentProfile", {}) || {}), ...patch };
  U.setDoc(req.studentId, "studentProfile", merged);
  if (patch.fullName && patch.fullName.length >= 2) db.prepare("UPDATE students SET name = ? WHERE id = ?").run(patch.fullName, req.studentId);
  const profile = U.loadProfile(req.studentId);
  const completion = U.profileCompletion(profile);
  let xp = null;
  if (completion.percent >= 80) xp = U.awardXp(req.studentId, "profile_complete", { dedupe: "profile_complete" });
  res.json({ success: true, profile, completion, xp });
});

// ---------------------------------------------------------------- generic per-student data sync (replaces browser-only localStorage as source of truth)
const KIND_RE = /^[A-Za-z0-9_-]{1,80}$/;
const RESERVED = new Set(["settings"]); // managed through dedicated endpoints
router.get("/api/me/data", requireAuth, (req, res) => {
  const rows = db.prepare("SELECT kind, data, updated_at FROM student_docs WHERE student_id = ?").all(req.studentId).filter((r) => !RESERVED.has(r.kind));
  res.json({ success: true, data: Object.fromEntries(rows.map((r) => [r.kind, U.safeParse(r.data)])), updatedAt: Object.fromEntries(rows.map((r) => [r.kind, r.updated_at])) });
});
router.get("/api/me/data/:kind", requireAuth, (req, res) => {
  if (!KIND_RE.test(req.params.kind) || RESERVED.has(req.params.kind)) return bad(res, "Invalid data key.");
  res.json({ success: true, kind: req.params.kind, data: U.getDoc(req.studentId, req.params.kind, null) });
});
router.put("/api/me/data/:kind", requireAuth, rateLimit("sync", 300, 15 * 60 * 1000), (req, res) => {
  const kind = req.params.kind;
  if (!KIND_RE.test(kind) || RESERVED.has(kind)) return bad(res, "Invalid data key.");
  let data = req.body?.data;
  if (data === undefined) return bad(res, "`data` is required.");
  if (kind === "studentProfile" && data && typeof data === "object" && !Array.isArray(data)) data = { ...(U.getDoc(req.studentId, kind, {}) || {}), ...data }; // keep server-only extras
  try { U.setDoc(req.studentId, kind, data); } catch (e) { return bad(res, e.message, e.status || 400); }
  if (kind === "studentProfile" && data?.fullName && String(data.fullName).trim().length >= 2) db.prepare("UPDATE students SET name = ? WHERE id = ?").run(String(data.fullName).trim().slice(0, 100), req.studentId);
  res.json({ success: true });
});
router.delete("/api/me/data/:kind", requireAuth, (req, res) => {
  if (!KIND_RE.test(req.params.kind) || RESERVED.has(req.params.kind)) return bad(res, "Invalid data key.");
  U.delDoc(req.studentId, req.params.kind);
  res.json({ success: true });
});

// ---------------------------------------------------------------- generic history (append-only), whitelisted kinds
const HISTORY_KINDS = ["assessment", "interview", "twin", "timeline", "report"];
router.get("/api/me/history/:kind", requireAuth, (req, res) => {
  if (!HISTORY_KINDS.includes(req.params.kind)) return bad(res, "Unknown history type.");
  res.json({ success: true, items: U.listHistory(req.studentId, req.params.kind, V.int(req.query.limit, 50, 1, 200)) });
});

module.exports = router;
