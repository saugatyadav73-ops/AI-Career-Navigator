/**
 * AI Prompt Orchestration Layer
 * --------------------------------------------------------------
 * Single entry point for every LLM call in the backend.
 *
 *   generate({ task, prompt, userId })  ->  { text, provider, model, latencyMs }
 *
 * Responsibilities
 *   1. Provider abstraction  : OpenAI, Google Gemini, HuggingFace Inference
 *   2. Ordered failover      : AI_PROVIDER_ORDER=openai,gemini,huggingface
 *   3. Placeholder detection : keys such as "YOUR_..._HERE" are ignored
 *   4. Timeout + retry       : per-provider timeout, 1 retry on 429/5xx
 *   5. Audit logging         : every attempt is written to the `ai_logs`
 *                              SQLite table AND logs/ai-orchestration.log
 *                              (JSON lines) - prompts are stored truncated.
 *
 * When no provider is available / all fail, an AiUnavailableError is thrown so
 * routes can fall back to the rule-based engine (see ./fallback.js).
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const db = require("../database");

const LOG_DIR = path.join(__dirname, "..", "logs");
const LOG_FILE = path.join(LOG_DIR, "ai-orchestration.log");
fs.mkdirSync(LOG_DIR, { recursive: true });

const TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS) || 45000;
const PREVIEW_CHARS = 1000;

class AiUnavailableError extends Error {
  constructor(message, attempts = []) {
    super(message);
    this.name = "AiUnavailableError";
    this.attempts = attempts;
  }
}

function isRealKey(value) {
  if (!value || typeof value !== "string") return false;
  const v = value.trim();
  if (!v) return false;
  return !/YOUR_|_HERE|CHANGE_ME|xxxx|<.*>/i.test(v);
}

const PROVIDERS = {
  openai: {
    model: () => process.env.OPENAI_MODEL || process.env.AI_MODEL || "gpt-4o-mini",
    enabled: () => isRealKey(process.env.OPENAI_API_KEY),
    async call(prompt, model, signal) {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.4,
        }),
      });
      const data = await readJson(res);
      return data?.choices?.[0]?.message?.content || "";
    },
  },

  gemini: {
    model: () => process.env.GEMINI_MODEL || "gemini-3.5-flash",
    enabled: () => isRealKey(process.env.GEMINI_API_KEY),
    async call(prompt, model, signal) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model
      )}:generateContent`;
      const res = await fetch(url, {
        method: "POST",
        signal,
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4 },
        }),
      });
      const data = await readJson(res);
      return (data?.candidates?.[0]?.content?.parts || [])
        .map((p) => p.text || "")
        .join("");
    },
  },

  huggingface: {
    model: () =>
      process.env.HUGGINGFACE_MODEL || "meta-llama/Llama-3.1-8B-Instruct",
    enabled: () => isRealKey(process.env.HUGGINGFACE_API_KEY),
    async call(prompt, model, signal) {
      const res = await fetch("https://router.huggingface.co/v1/chat/completions", {
        method: "POST",
        signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.4,
          max_tokens: 2048,
        }),
      });
      const data = await readJson(res);
      return data?.choices?.[0]?.message?.content || "";
    },
  },
};

async function readJson(res) {
  const raw = await res.text();
  let data = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    /* non-JSON body */
  }
  if (!res.ok) {
    const err = new Error(
      data?.error?.message || data?.error || `HTTP ${res.status}: ${raw.slice(0, 200)}`
    );
    err.status = res.status;
    throw err;
  }
  return data;
}

function providerOrder() {
  const configured = (process.env.AI_PROVIDER_ORDER || "openai,gemini,huggingface")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => PROVIDERS[s]);
  return configured.length ? configured : Object.keys(PROVIDERS);
}

function availableProviders() {
  return providerOrder().filter((name) => PROVIDERS[name].enabled());
}

// ---------------------------------------------------------------- logging
const insertLog = db.prepare(`
  INSERT INTO ai_logs
    (task, provider, model, status, latency_ms, prompt_hash, prompt_chars,
     prompt_preview, response_preview, error, student_id)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

function writeLog(entry) {
  try {
    insertLog.run(
      entry.task,
      entry.provider,
      entry.model || null,
      entry.status,
      entry.latencyMs ?? null,
      entry.promptHash,
      entry.promptChars,
      entry.promptPreview,
      entry.responsePreview || null,
      entry.error || null,
      entry.userId ?? null
    );
  } catch (e) {
    console.error("ai_logs insert failed:", e.message);
  }
  try {
    fs.appendFileSync(
      LOG_FILE,
      JSON.stringify({ ts: new Date().toISOString(), ...entry }) + "\n"
    );
  } catch (e) {
    console.error("ai log file write failed:", e.message);
  }
}

// ---------------------------------------------------------------- core
async function callWithTimeout(provider, prompt, model) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await provider.call(prompt, model, controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

async function generate({ task, prompt, userId = null }) {
  const promptHash = crypto.createHash("sha256").update(prompt).digest("hex").slice(0, 16);
  const base = {
    task,
    promptHash,
    promptChars: prompt.length,
    promptPreview: prompt.slice(0, PREVIEW_CHARS),
    userId,
  };

  const names = availableProviders();
  if (!names.length) {
    writeLog({ ...base, provider: "none", status: "skipped", error: "No AI provider configured" });
    throw new AiUnavailableError("No AI provider is configured.");
  }

  const attempts = [];
  for (const name of names) {
    const provider = PROVIDERS[name];
    const model = provider.model();

    for (let attempt = 1; attempt <= 2; attempt++) {
      const started = Date.now();
      try {
        const text = await callWithTimeout(provider, prompt, model);
        if (!text || !text.trim()) throw new Error("Empty response from provider");

        writeLog({
          ...base,
          provider: name,
          model,
          status: "success",
          latencyMs: Date.now() - started,
          responsePreview: text.slice(0, PREVIEW_CHARS),
        });
        return { text, provider: name, model, latencyMs: Date.now() - started };
      } catch (error) {
        const message = error.name === "AbortError" ? "Timeout" : error.message;
        writeLog({
          ...base,
          provider: name,
          model,
          status: "error",
          latencyMs: Date.now() - started,
          error: `attempt ${attempt}: ${message}`,
        });
        attempts.push({ provider: name, attempt, error: message });
        const retryable = !error.status || error.status === 429 || error.status >= 500;
        if (!retryable || error.name === "AbortError") break;
      }
    }
  }

  throw new AiUnavailableError("All AI providers failed.", attempts);
}

function recentLogs(limit = 50) {
  return db
    .prepare(
      `SELECT id, task, provider, model, status, latency_ms, prompt_hash,
              prompt_chars, error, student_id, created_at
       FROM ai_logs ORDER BY id DESC LIMIT ?`
    )
    .all(Math.min(Math.max(Number(limit) || 50, 1), 200));
}

function stats() {
  return db
    .prepare(
      `SELECT provider, status, COUNT(*) AS calls,
              ROUND(AVG(latency_ms)) AS avg_latency_ms
       FROM ai_logs GROUP BY provider, status ORDER BY provider`
    )
    .all();
}

module.exports = {
  generate,
  availableProviders,
  recentLogs,
  stats,
  AiUnavailableError,
};
