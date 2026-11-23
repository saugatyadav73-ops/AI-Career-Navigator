/** Operations: database backups (manual + scheduled), monitoring metrics, readiness probe. */
const express = require("express");
const fs = require("fs");
const path = require("path");
const db = require("../database");
const { requireAuth, requireRole, audit, metrics, LOG_DIR, V, bad } = require("./middleware");

const router = express.Router();
const BACKUP_DIR = process.env.BACKUP_DIR ? path.resolve(process.env.BACKUP_DIR) : path.join(__dirname, "..", "backups");
const adminOnly = [requireAuth, requireRole("admin")];

function createBackup() {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const name = `career_navigator-${new Date().toISOString().replace(/[:.]/g, "-")}.db`;
  const dest = path.join(BACKUP_DIR, name);
  db.exec(`VACUUM INTO '${dest.replace(/'/g, "''")}'`); // consistent snapshot, safe while the app is running
  const keep = Math.max(1, parseInt(process.env.BACKUP_KEEP || "7", 10));
  const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith(".db")).sort();
  for (const old of files.slice(0, Math.max(0, files.length - keep))) fs.unlinkSync(path.join(BACKUP_DIR, old));
  return { name, sizeBytes: fs.statSync(dest).size };
}
const listBackups = () => (fs.existsSync(BACKUP_DIR) ? fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith(".db")).sort().reverse().map((f) => { const s = fs.statSync(path.join(BACKUP_DIR, f)); return { name: f, sizeBytes: s.size, createdAt: s.mtime.toISOString() }; }) : []);

const hours = parseFloat(process.env.BACKUP_INTERVAL_HOURS || "0");
if (hours > 0) setInterval(() => { try { const b = createBackup(); console.log("[backup] created", b.name); } catch (e) { console.error("[backup] failed:", e.message); } }, hours * 3600 * 1000).unref();

router.post("/api/admin/backup", ...adminOnly, (req, res) => { try { const b = createBackup(); audit(req, "ops.backup", b.name); res.json({ success: true, backup: b }); } catch (e) { console.error(e); bad(res, "Backup failed.", 500); } });
router.get("/api/admin/backups", ...adminOnly, (req, res) => res.json({ success: true, directory: path.basename(BACKUP_DIR), keep: parseInt(process.env.BACKUP_KEEP || "7", 10), scheduledEveryHours: hours || null, backups: listBackups() }));

router.get("/api/admin/metrics", ...adminOnly, (req, res) => {
  const mem = process.memoryUsage(); let recentErrors = [];
  try {
    const f = path.join(LOG_DIR, `app-${new Date().toISOString().slice(0, 10)}.log`);
    if (fs.existsSync(f)) { const buf = fs.readFileSync(f, "utf8").split("\n").slice(-2000); recentErrors = buf.map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter((x) => x && x.s >= 500).slice(-20); }
  } catch { /* ignore */ }
  const ai = db.prepare("SELECT provider, status, COUNT(*) c, ROUND(AVG(latency_ms)) avgMs FROM ai_logs WHERE created_at >= datetime('now','-1 day') GROUP BY provider, status").all();
  res.json({ success: true, uptimeSeconds: Math.round(process.uptime()), node: process.version, memoryMB: { rss: Math.round(mem.rss / 1048576), heapUsed: Math.round(mem.heapUsed / 1048576) },
    requests: { total: metrics.requests, clientErrors: metrics.errors4xx, serverErrors: metrics.errors5xx, rateLimited: metrics.rateLimited }, aiLast24h: ai, recentServerErrors: recentErrors });
});

router.get("/api/status", (req, res) => {
  try { db.prepare("SELECT 1").get(); res.json({ success: true, status: "ok", database: "ok", uptimeSeconds: Math.round(process.uptime()) }); }
  catch { res.status(503).json({ success: false, status: "degraded", database: "error" }); }
});

module.exports = router;
module.exports.createBackup = createBackup;
