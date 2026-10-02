# AI Prompt Orchestration Layer

Code: [`backend/ai/orchestrator.js`](../backend/ai/orchestrator.js), fallbacks in [`backend/ai/fallback.js`](../backend/ai/fallback.js).

```
Route handler ─► build task prompt ─► aiOrchestrator.generate({task, prompt, userId})
                                        │
                     ┌──────────────────┼──────────────────┐
                  OpenAI             Gemini          HuggingFace      (AI_PROVIDER_ORDER)
                     └──── first success wins; 429/5xx retried once ───┘
                                        │
              every attempt ─► SQLite `ai_logs` + logs/ai-orchestration.log (JSONL)
                                        │
        all providers failed / none configured ─► rule-based engine (engine:"rules")
```

## Providers
| Provider | Env key | Default model | Endpoint |
|---|---|---|---|
| OpenAI | `OPENAI_API_KEY` | `gpt-4o-mini` | `/v1/chat/completions` |
| Google Gemini | `GEMINI_API_KEY` | `gemini-1.5-flash` | `models/{model}:generateContent` |
| HuggingFace | `HUGGINGFACE_API_KEY` | `meta-llama/Llama-3.1-8B-Instruct` | `router.huggingface.co/v1/chat/completions` |

Placeholder keys (`YOUR_…_HERE`) are treated as "not configured".

## Prompt tasks
| Task | Prompt contract | Post-processing |
|---|---|---|
| `career_analysis` | Student JSON in, strict JSON out (`recommendedCareer`, `careerMatch`…) | `cleanAIJson`, `clampScore`, array/string normalisation |
| `skill_gap_questions` | N MCQs with 4 options + answer | Server drops malformed/duplicate-option questions |
| `mock_interview_question/evaluate/report` | Coach persona, JSON-only | Score clamping, normalisation |

## Logging
Each attempt records task, provider, model, status, latency, prompt hash/size, 1000-char previews, error and student id. Inspect with `GET /api/ai/logs` (JWT required) or `tail -f backend/logs/ai-orchestration.log`. Prompts contain student data: treat logs as sensitive and rotate them.

## Verified behaviour
Tested with a stubbed network layer: OpenAI → HTTP 401 (not retried) → automatic failover to Gemini → success; both attempts present in `ai_logs`. With no keys configured, career analysis, interview questions and answer evaluation are served by the rule-based engine; skill-gap questions and reports return `503`.
