/* Deterministic orchestration test: no real provider/API key is used.
   It stubs fetch to prove failover + audit logging work end-to-end. */
const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cn-orchestration-"));
process.env.DB_PATH = path.join(tempDir, "career_navigator.db");

const db = require("../database");

process.env.AI_PROVIDER_ORDER = "openai,gemini";
process.env.OPENAI_API_KEY = "test-openai-key";
process.env.GEMINI_API_KEY = "test-gemini-key";
process.env.AI_TIMEOUT_MS = "3000";

global.fetch = async (url) => {
  if (url.includes("api.openai.com")) {
    return new Response(JSON.stringify({ error: { message: "stub unauthorized" } }), { status: 401 });
  }
  return new Response(JSON.stringify({
    candidates: [{ content: { parts: [{ text: '"stubbed AI response"' }] } }],
  }), { status: 200 });
};

(async () => {
  try {
    const before = db.prepare("SELECT COUNT(*) AS c FROM ai_logs").get().c;
    const orchestrator = require("../ai/orchestrator");

    const result = await orchestrator.generate({
      task: "orchestration_test",
      prompt: "Return a short test response.",
      userId: null,
    });

    assert.strictEqual(result.provider, "gemini");
    assert.strictEqual(result.text, '"stubbed AI response"');

    const rows = db.prepare(`
      SELECT provider, status FROM ai_logs
      WHERE task = 'orchestration_test'
      ORDER BY id DESC LIMIT 2
    `).all();

    assert.strictEqual(rows.length, 2);
    assert.strictEqual(rows[0].provider, "gemini");
    assert.strictEqual(rows[0].status, "success");
    assert.strictEqual(rows[1].provider, "openai");
    assert.strictEqual(rows[1].status, "error");
    assert.ok(db.prepare("SELECT COUNT(*) AS c FROM ai_logs").get().c >= before + 2);

    console.log("PASS  AI orchestration failover + audit logging");
  } catch (error) {
    console.error("FAIL  AI orchestration test:", error);
    process.exitCode = 1;
  } finally {
    try { db.close(); } catch { /* ignore */ }
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
})();
