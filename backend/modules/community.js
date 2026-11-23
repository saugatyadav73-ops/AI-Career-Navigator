/** Gamification (XP, badges, streak, levels, weekly challenges, leaderboard) and community (discussions, team finder, hackathons, collaboration workspaces). */
const express = require("express");
const db = require("../database");
const K = require("../ai/knowledge");
const { requireAuth, V, bad } = require("./middleware");
const U = require("./util");

const router = express.Router();
const auth = requireAuth;
const mod = (req) => ["admin", "faculty"].includes(req.student.role);
const shortName = (n) => { const p = String(n || "Student").trim().split(/\s+/); return p.length > 1 ? `${p[0]} ${p[p.length - 1][0]}.` : p[0]; };

// ================================================================= gamification
router.get("/api/gamification/me", auth, (req, res) => {
  const sid = req.studentId; U.awardXp(sid, "login_daily", { dedupe: `login:${U.today()}` }); // opening the page counts as the day's activity
  const xp = U.totalXp(sid); const lvl = U.levelFor(xp); const have = new Set(db.prepare("SELECT badge FROM student_badges WHERE student_id=?").all(sid).map((r) => r.badge));
  res.json({ success: true, xp, level: { level: lvl.level, name: lvl.name, xpIntoLevel: xp - lvl.xp, xpForNext: lvl.next ? lvl.next.xp - lvl.xp : null, nextName: lvl.next?.name || null, percent: lvl.next ? Math.round(((xp - lvl.xp) / (lvl.next.xp - lvl.xp)) * 100) : 100 },
    streak: U.streakFor(sid), badges: U.BADGES.map((b) => ({ id: b.id, name: b.name, description: b.desc, earned: have.has(b.id) })), challenges: U.weeklyChallenges(sid), levels: U.LEVELS,
    recent: db.prepare("SELECT action, points, event_date AS date FROM xp_events WHERE student_id=? ORDER BY id DESC LIMIT 10").all(sid) });
});
// Client-driven events (only actions that happen in pages that do not call the server themselves)
const CLIENT_ACTIONS = ["roadmap_step", "resume_built", "revision_done"];
router.post("/api/gamification/event", auth, (req, res) => {
  const action = V.oneOf(req.body?.action, CLIENT_ACTIONS, null); if (!action) return bad(res, `action must be one of: ${CLIENT_ACTIONS.join(", ")}`);
  const ref = V.str(req.body?.ref, 80); res.json({ success: true, xp: U.awardXp(req.studentId, action, { dedupe: ref ? `${action}:${ref}` : null }) });
});
router.get("/api/gamification/leaderboard", auth, (req, res) => {
  const weekly = req.query.scope === "week"; const since = U.isoWeek().start;
  const me = U.getDoc(req.studentId, "settings", {}) || {};
  const rows = db.prepare(`SELECT s.id, s.name, COALESCE(SUM(x.points),0) AS xp FROM students s
    JOIN student_docs d ON d.student_id = s.id AND d.kind = 'settings' AND d.data LIKE '%"leaderboardOptIn":true%'
    LEFT JOIN xp_events x ON x.student_id = s.id ${weekly ? "AND x.event_date >= ?" : ""}
    WHERE s.is_active = 1 AND s.role = 'student' GROUP BY s.id ORDER BY xp DESC, s.id ASC LIMIT 50`).all(...(weekly ? [since] : []));
  const board = rows.map((r, i) => ({ rank: i + 1, name: shortName(r.name), xp: r.xp, level: U.levelFor(U.totalXp(r.id)).level, you: r.id === req.studentId }));
  res.json({ success: true, scope: weekly ? "week" : "all", optedIn: Boolean(me.leaderboardOptIn), board: board.slice(0, 20), you: board.find((b) => b.you) || null,
    note: me.leaderboardOptIn ? "Only students who opted in appear here, shown as first name + initial." : "The leaderboard is optional. Turn it on in Settings to appear on it." });
});

// ================================================================= peer learning: discussions
const discOut = (r) => ({ id: r.id, title: r.title, body: r.body, topic: r.topic, author: shortName(r.author), mine: r.mine === 1, replies: r.replies ?? undefined, createdAt: r.created_at });
router.get("/api/community/discussions", auth, (req, res) => {
  const t = V.str(req.query.topic, 40), qq = V.str(req.query.q, 80).toLowerCase();
  const rows = db.prepare(`SELECT d.*, s.name AS author, (d.student_id = ?) AS mine, (SELECT COUNT(*) FROM discussion_replies r WHERE r.discussion_id = d.id) AS replies
    FROM discussions d JOIN students s ON s.id = d.student_id ORDER BY d.id DESC LIMIT 200`).all(req.studentId).filter((r) => (!t || r.topic === t) && (!qq || `${r.title} ${r.body}`.toLowerCase().includes(qq)));
  res.json({ success: true, discussions: rows.slice(0, 50).map(discOut) });
});
router.post("/api/community/discussions", auth, (req, res) => {
  const title = V.str(req.body?.title, 150), body = V.str(req.body?.body, 3000); if (title.length < 5 || body.length < 10) return bad(res, "Add a title (5+ chars) and a message (10+ chars).");
  if (db.prepare("SELECT COUNT(*) c FROM discussions WHERE student_id=? AND created_at > datetime('now','-1 hour')").get(req.studentId).c >= 10) return bad(res, "You are posting too quickly. Please wait a bit.", 429);
  const r = db.prepare("INSERT INTO discussions (student_id, title, body, topic) VALUES (?,?,?,?)").run(req.studentId, title, body, V.str(req.body?.topic, 40).toLowerCase() || "general");
  res.status(201).json({ success: true, id: Number(r.lastInsertRowid), xp: U.awardXp(req.studentId, "discussion_post", { dedupe: `disc:${r.lastInsertRowid}` }) });
});
router.get("/api/community/discussions/:id", auth, (req, res) => {
  const d = db.prepare("SELECT d.*, s.name AS author, (d.student_id = ?) AS mine FROM discussions d JOIN students s ON s.id = d.student_id WHERE d.id = ?").get(req.studentId, req.params.id);
  if (!d) return bad(res, "Discussion not found.", 404);
  const replies = db.prepare("SELECT r.id, r.body, r.created_at, s.name AS author, (r.student_id = ?) AS mine FROM discussion_replies r JOIN students s ON s.id = r.student_id WHERE r.discussion_id = ? ORDER BY r.id").all(req.studentId, d.id).map((r) => ({ id: r.id, body: r.body, author: shortName(r.author), mine: r.mine === 1, createdAt: r.created_at }));
  res.json({ success: true, discussion: discOut(d), replies });
});
router.post("/api/community/discussions/:id/replies", auth, (req, res) => {
  const body = V.str(req.body?.body, 2000); if (body.length < 2) return bad(res, "Reply cannot be empty.");
  if (!db.prepare("SELECT 1 x FROM discussions WHERE id=?").get(req.params.id)) return bad(res, "Discussion not found.", 404);
  const r = db.prepare("INSERT INTO discussion_replies (discussion_id, student_id, body) VALUES (?,?,?)").run(req.params.id, req.studentId, body);
  res.status(201).json({ success: true, id: Number(r.lastInsertRowid), xp: U.awardXp(req.studentId, "discussion_reply", { dedupe: `reply:${r.lastInsertRowid}` }) });
});
router.delete("/api/community/discussions/:id", auth, (req, res) => {
  const d = db.prepare("SELECT student_id FROM discussions WHERE id=?").get(req.params.id); if (!d) return bad(res, "Discussion not found.", 404);
  if (d.student_id !== req.studentId && !mod(req)) return bad(res, "You can only delete your own posts.", 403);
  db.prepare("DELETE FROM discussions WHERE id=?").run(req.params.id); res.json({ success: true });
});

// ================================================================= team finder
const teamOut = (r, extra = {}) => ({ id: r.id, title: r.title, description: r.description, skillsNeeded: U.safeParse(r.skills_needed, []), hackathonId: r.hackathon_id, status: r.status, owner: shortName(r.author), mine: r.mine === 1, createdAt: r.created_at, ...extra });
router.get("/api/community/teams", auth, (req, res) => {
  const skill = K.normSkill(V.str(req.query.skill, 40)); const have = U.profileSkills(U.loadProfile(req.studentId));
  const rows = db.prepare(`SELECT t.*, s.name AS author, (t.student_id = ?) AS mine, (SELECT status FROM team_requests r WHERE r.post_id = t.id AND r.student_id = ?) AS myRequest
    FROM team_posts t JOIN students s ON s.id = t.student_id WHERE t.status = 'open' OR t.student_id = ? ORDER BY t.id DESC LIMIT 100`).all(req.studentId, req.studentId, req.studentId)
    .filter((r) => !skill || U.safeParse(r.skills_needed, []).map(K.normSkill).includes(skill));
  res.json({ success: true, teams: rows.map((r) => { const need = U.safeParse(r.skills_needed, []).map(K.normSkill); return teamOut(r, { myRequest: r.myRequest || null, skillFit: need.length ? Math.round((need.filter((s) => have.includes(s)).length / need.length) * 100) : null }); }).sort((a, b) => (b.skillFit ?? -1) - (a.skillFit ?? -1)) });
});
router.post("/api/community/teams", auth, (req, res) => {
  const title = V.str(req.body?.title, 120); if (title.length < 5) return bad(res, "Give your team post a title (5+ chars).");
  const r = db.prepare("INSERT INTO team_posts (student_id, title, description, skills_needed, hackathon_id) VALUES (?,?,?,?,?)").run(req.studentId, title, V.str(req.body?.description, 1500), JSON.stringify(K.normList(V.list(req.body?.skillsNeeded, 10)).map(K.pretty)), V.int(req.body?.hackathonId, 0) || null);
  res.status(201).json({ success: true, id: Number(r.lastInsertRowid), xp: U.awardXp(req.studentId, "team_post", { dedupe: `team:${r.lastInsertRowid}` }) });
});
router.post("/api/community/teams/:id/request", auth, (req, res) => {
  const t = db.prepare("SELECT * FROM team_posts WHERE id=?").get(req.params.id); if (!t || t.status !== "open") return bad(res, "This team post is not open.", 404);
  if (t.student_id === req.studentId) return bad(res, "You cannot join your own team post.");
  const r = db.prepare("INSERT OR IGNORE INTO team_requests (post_id, student_id, message) VALUES (?,?,?)").run(t.id, req.studentId, V.str(req.body?.message, 500));
  if (!r.changes) return bad(res, "You have already requested to join.", 409);
  U.notify(t.student_id, { type: "team", title: `${shortName(req.student.name)} wants to join "${t.title}"`, link: "/community", dedupe: `teamreq:${t.id}:${req.studentId}` });
  res.status(201).json({ success: true });
});
router.get("/api/community/teams/:id/requests", auth, (req, res) => {
  const t = db.prepare("SELECT * FROM team_posts WHERE id=? AND student_id=?").get(req.params.id, req.studentId); if (!t) return bad(res, "Only the owner can see requests.", 403);
  res.json({ success: true, requests: db.prepare("SELECT r.id, r.message, r.status, r.created_at, s.name FROM team_requests r JOIN students s ON s.id = r.student_id WHERE r.post_id=? ORDER BY r.id").all(t.id).map((r) => ({ id: r.id, name: shortName(r.name), message: r.message, status: r.status, createdAt: r.created_at })) });
});
router.post("/api/community/teams/:id/requests/:rid", auth, (req, res) => {
  const t = db.prepare("SELECT * FROM team_posts WHERE id=? AND student_id=?").get(req.params.id, req.studentId); if (!t) return bad(res, "Only the owner can respond.", 403);
  const action = V.oneOf(req.body?.action, ["accept", "decline"], null); if (!action) return bad(res, "action must be accept or decline.");
  const r = db.prepare("SELECT * FROM team_requests WHERE id=? AND post_id=?").get(req.params.rid, t.id); if (!r) return bad(res, "Request not found.", 404);
  db.prepare("UPDATE team_requests SET status=? WHERE id=?").run(action === "accept" ? "accepted" : "declined", r.id);
  U.notify(r.student_id, { type: "team", title: `Your request for "${t.title}" was ${action === "accept" ? "accepted" : "declined"}`, link: "/community", dedupe: `teamresp:${r.id}:${action}` });
  res.json({ success: true });
});
router.post("/api/community/teams/:id/close", auth, (req, res) => (db.prepare("UPDATE team_posts SET status='closed' WHERE id=? AND student_id=?").run(req.params.id, req.studentId).changes ? res.json({ success: true }) : bad(res, "Team post not found.", 404)));

// ================================================================= hackathon finder
const hackOut = (r) => ({ id: r.id, title: r.title, organizer: r.organizer, mode: r.mode, location: r.location, startDate: r.start_date, endDate: r.end_date, deadline: r.deadline, url: r.url, tags: U.safeParse(r.tags, []), mine: r.mine === 1 });
router.get("/api/community/hackathons", auth, (req, res) => {
  const tag = V.str(req.query.tag, 40).toLowerCase(), mode = V.oneOf(req.query.mode, ["online", "offline", "hybrid"], null), all = req.query.past === "true";
  const rows = db.prepare("SELECT h.*, (h.added_by = ?) AS mine FROM hackathons h ORDER BY COALESCE(h.deadline, h.start_date, '9999') ASC").all(req.studentId).map(hackOut)
    .filter((h) => (all || !(h.deadline || h.endDate || h.startDate) || (h.deadline || h.endDate || h.startDate) >= U.today()) && (!mode || h.mode === mode) && (!tag || h.tags.map((x) => x.toLowerCase()).includes(tag)));
  res.json({ success: true, hackathons: rows, note: rows.length ? undefined : "No hackathons listed yet. Add ones you find, so other students can see them.",
    searchLinks: { devpost: "https://devpost.com/hackathons", unstop: "https://unstop.com/hackathons", mlh: "https://mlh.io/seasons/2026/events" } });
});
router.post("/api/community/hackathons", auth, (req, res) => {
  const b = req.body || {}; const title = V.str(b.title, 150); if (title.length < 4) return bad(res, "Hackathon name is required.");
  const url = V.url(b.url); if (!url) return bad(res, "A valid registration/info link (https://...) is required.");
  const r = db.prepare("INSERT INTO hackathons (added_by, title, organizer, mode, location, start_date, end_date, deadline, url, tags) VALUES (?,?,?,?,?,?,?,?,?,?)")
    .run(req.studentId, title, V.str(b.organizer, 120), V.oneOf(b.mode, ["online", "offline", "hybrid"], "online"), V.str(b.location, 120), V.date(b.startDate) || null, V.date(b.endDate) || null, V.date(b.deadline) || null, url, JSON.stringify(V.list(b.tags, 8, 30)));
  res.status(201).json({ success: true, id: Number(r.lastInsertRowid) });
});
router.delete("/api/community/hackathons/:id", auth, (req, res) => {
  const h = db.prepare("SELECT added_by FROM hackathons WHERE id=?").get(req.params.id); if (!h) return bad(res, "Hackathon not found.", 404);
  if (h.added_by !== req.studentId && !mod(req)) return bad(res, "You can only remove entries you added.", 403);
  db.prepare("DELETE FROM hackathons WHERE id=?").run(req.params.id); res.json({ success: true });
});

// ================================================================= collaboration workspaces
const member = (wid, sid) => db.prepare("SELECT role FROM workspace_members WHERE workspace_id=? AND student_id=?").get(wid, sid);
const gate = (req, res) => { const m = member(req.params.id, req.studentId); if (!m) { bad(res, "Workspace not found.", 404); return null; } return m; };
router.get("/api/workspaces", auth, (req, res) => res.json({ success: true, workspaces: db.prepare(`SELECT w.id, w.name, w.description, m.role, (SELECT COUNT(*) FROM workspace_members x WHERE x.workspace_id = w.id) AS members,
  (SELECT COUNT(*) FROM workspace_tasks t WHERE t.workspace_id = w.id AND t.status <> 'done') AS openTasks FROM workspaces w JOIN workspace_members m ON m.workspace_id = w.id AND m.student_id = ? ORDER BY w.id DESC`).all(req.studentId) }));
router.post("/api/workspaces", auth, (req, res) => {
  const name = V.str(req.body?.name, 100); if (name.length < 3) return bad(res, "Workspace name is required.");
  if (db.prepare("SELECT COUNT(*) c FROM workspaces WHERE owner_id=?").get(req.studentId).c >= 20) return bad(res, "Workspace limit reached.");
  const r = db.prepare("INSERT INTO workspaces (owner_id, name, description) VALUES (?,?,?)").run(req.studentId, name, V.str(req.body?.description, 500));
  db.prepare("INSERT INTO workspace_members (workspace_id, student_id, role) VALUES (?,?, 'owner')").run(r.lastInsertRowid, req.studentId);
  res.status(201).json({ success: true, id: Number(r.lastInsertRowid), xp: U.awardXp(req.studentId, "workspace_created", { dedupe: `ws:${r.lastInsertRowid}` }) });
});
router.get("/api/workspaces/:id", auth, (req, res) => {
  const m = gate(req, res); if (!m) return; const w = db.prepare("SELECT id, name, description FROM workspaces WHERE id=?").get(req.params.id);
  res.json({ success: true, workspace: w, myRole: m.role,
    members: db.prepare("SELECT s.id, s.name, wm.role FROM workspace_members wm JOIN students s ON s.id = wm.student_id WHERE wm.workspace_id=?").all(w.id).map((x) => ({ id: x.id, name: shortName(x.name), role: x.role })),
    tasks: db.prepare("SELECT id, title, status, assignee_id AS assigneeId FROM workspace_tasks WHERE workspace_id=? ORDER BY id").all(w.id),
    messages: db.prepare("SELECT m.id, m.body, m.created_at AS createdAt, s.name FROM workspace_messages m JOIN students s ON s.id = m.student_id WHERE m.workspace_id=? ORDER BY m.id DESC LIMIT 50").all(w.id).reverse().map((x) => ({ ...x, name: shortName(x.name) })) });
});
router.post("/api/workspaces/:id/members", auth, (req, res) => {
  const m = gate(req, res); if (!m) return; if (m.role !== "owner") return bad(res, "Only the owner can add members.", 403);
  const email = V.str(req.body?.email, 200).toLowerCase(); const s = V.email(email) ? db.prepare("SELECT id, name FROM students WHERE email=? AND is_active=1").get(email) : null;
  if (!s) return bad(res, "No active student found with that email.", 404);
  if (db.prepare("SELECT COUNT(*) c FROM workspace_members WHERE workspace_id=?").get(req.params.id).c >= 15) return bad(res, "Workspace is full (15 members).");
  const r = db.prepare("INSERT OR IGNORE INTO workspace_members (workspace_id, student_id) VALUES (?,?)").run(req.params.id, s.id);
  if (!r.changes) return bad(res, "Already a member.", 409);
  U.notify(s.id, { type: "workspace", title: `You were added to a workspace by ${shortName(req.student.name)}`, link: "/community", dedupe: `wsadd:${req.params.id}:${s.id}` });
  res.status(201).json({ success: true });
});
router.post("/api/workspaces/:id/tasks", auth, (req, res) => {
  if (!gate(req, res)) return; const title = V.str(req.body?.title, 200); if (title.length < 2) return bad(res, "Task title is required.");
  const assignee = V.int(req.body?.assigneeId, 0) || null; if (assignee && !member(req.params.id, assignee)) return bad(res, "Assignee must be a workspace member.");
  const r = db.prepare("INSERT INTO workspace_tasks (workspace_id, title, assignee_id, created_by) VALUES (?,?,?,?)").run(req.params.id, title, assignee, req.studentId);
  res.status(201).json({ success: true, id: Number(r.lastInsertRowid) });
});
router.put("/api/workspaces/:id/tasks/:tid", auth, (req, res) => {
  if (!gate(req, res)) return; const t = db.prepare("SELECT * FROM workspace_tasks WHERE id=? AND workspace_id=?").get(req.params.tid, req.params.id); if (!t) return bad(res, "Task not found.", 404);
  const assignee = req.body?.assigneeId === undefined ? t.assignee_id : (V.int(req.body.assigneeId, 0) || null); if (assignee && !member(req.params.id, assignee)) return bad(res, "Assignee must be a workspace member.");
  db.prepare("UPDATE workspace_tasks SET status=?, assignee_id=?, title=? WHERE id=?").run(V.oneOf(req.body?.status, ["todo", "doing", "done"], t.status), assignee, V.str(req.body?.title, 200) || t.title, t.id);
  res.json({ success: true });
});
router.delete("/api/workspaces/:id/tasks/:tid", auth, (req, res) => { if (!gate(req, res)) return; db.prepare("DELETE FROM workspace_tasks WHERE id=? AND workspace_id=?").run(req.params.tid, req.params.id); res.json({ success: true }); });
router.post("/api/workspaces/:id/messages", auth, (req, res) => {
  if (!gate(req, res)) return; const body = V.str(req.body?.body, 1500); if (!body) return bad(res, "Message cannot be empty.");
  db.prepare("INSERT INTO workspace_messages (workspace_id, student_id, body) VALUES (?,?,?)").run(req.params.id, req.studentId, body); res.status(201).json({ success: true });
});
router.post("/api/workspaces/:id/leave", auth, (req, res) => {
  const m = gate(req, res); if (!m) return; if (m.role === "owner") return bad(res, "The owner cannot leave. Delete the workspace instead.");
  db.prepare("DELETE FROM workspace_members WHERE workspace_id=? AND student_id=?").run(req.params.id, req.studentId); res.json({ success: true });
});
router.delete("/api/workspaces/:id", auth, (req, res) => { const m = gate(req, res); if (!m) return; if (m.role !== "owner") return bad(res, "Only the owner can delete the workspace.", 403); db.prepare("DELETE FROM workspaces WHERE id=?").run(req.params.id); res.json({ success: true }); });

module.exports = router;
