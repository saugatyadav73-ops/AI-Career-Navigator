# REST API Specification

Base URL: `http://localhost:5000` (configurable via `VITE_API_URL` on the frontend).
All bodies are JSON unless noted. Every response contains `success: boolean`; errors add `message`.
Auth: `Authorization: Bearer <JWT>` (7-day token returned by login/register). Marked **Auth** = required, **Opt** = used for attribution only.

| # | Method | Path | Auth | Purpose |
|---|---|---|---|---|
| 1 | GET | `/` , `/api/health` | – | Health + configured AI providers |
| 2 | POST | `/api/auth/register` | – | Create account |
| 3 | POST | `/api/auth/verify-email` | – | Verify 6-digit code |
| 4 | POST | `/api/auth/resend-verification` | – | Resend code (60 s cooldown) |
| 5 | POST | `/api/auth/login` | – | Obtain JWT |
| 6 | GET | `/api/interest-questions` | – | 5 interest MCQs |
| 7 | POST | `/api/career-analysis` | Opt | AI career recommendation |
| 8 | POST | `/api/resume/analyze` | Opt | Resume analysis (multipart) |
| 9 | POST | `/api/skill-gap/questions` | Opt | Generate skill MCQs |
| 10 | POST | `/api/mock-interview/question` | Opt | Next interview question |
| 11 | POST | `/api/mock-interview/evaluate` | Opt | Score an answer |
| 12 | POST | `/api/mock-interview/report` | Opt | Final interview report |
| 13 | POST | `/api/feedback` | Opt | Submit rating + comment |
| 14 | GET | `/api/feedback/summary` | – | Average rating per feature |
| 15 | GET | `/api/ai/logs?limit=50` | **Auth** | AI orchestration audit log |

## Auth

### POST `/api/auth/register`
Request `{ "name": "Asha", "email": "asha@x.com", "password": "min6chars" }`
- `201` with SMTP configured: `{ success, requiresVerification: true, email, student }` (code emailed)
- `201` without SMTP (dev mode): `{ success, requiresVerification: false, token, student }` (auto-verified)
- `400` validation · `409` email exists

### POST `/api/auth/verify-email`  `{ email, code }` → `{ success, emailVerified: true, student }` (then log in) · `400` invalid/expired code · `404` unknown email
### POST `/api/auth/resend-verification`  `{ email }` → `{ success }` · `429` cooldown
### POST `/api/auth/login`  `{ email, password }`
→ `200 { success, token, student: { id, name, email, emailVerified } }` · `401` bad credentials · `403 { requiresVerification: true }`

## Career engine

### POST `/api/career-analysis`
Request: any student profile object, e.g. `{ "interests": ["Cybersecurity"], "skills": ["Python"], "answers": {...} }`
Response:
```json
{ "success": true,
  "analysis": {
    "recommendedCareer": "Cybersecurity Analyst",
    "careerMatch": 87,
    "summary": "...", "strengths": ["..."], "skillsToImprove": ["..."],
    "nextSteps": ["..."], "reason": "...",
    "engine": "rules"   // present only when the rule-based fallback answered
  } }
```

### POST `/api/resume/analyze` (multipart/form-data, field `resume`; PDF/DOC/DOCX/TXT ≤ 10 MB)
→ `{ success, analysis: { overallScore, summary, strengths[], weaknesses[], missingSkills[], suggestions[] } }`
`503` if `OPENAI_API_KEY` is not configured (file input uses OpenAI).

### POST `/api/skill-gap/questions`
`{ "skill": "Python", "count": 10, "difficulty": "beginner|medium|advanced", "completed": 0 }`
→ `{ success, skill, difficulty, questions: [{ question, options[4], correctAnswer, explanation }] }` · `503` no AI provider

## Mock interview
- `POST /api/mock-interview/question` `{ career, difficulty, previousQuestions[] }` → `{ success, question: { question, category, difficulty } }`
- `POST /api/mock-interview/evaluate` `{ question, answer, career }` → `{ success, evaluation: { score, rating, feedback, strengths[], improvements[], idealAnswer } }`
- `POST /api/mock-interview/report` `{ ...session data }` → `{ success, report: { overallScore, summary, technicalScore, communicationScore, problemSolvingScore, strengths[], weaknesses[], recommendations[] } }`

## Feedback & observability
- `POST /api/feedback` `{ feature, rating (1-5), comment? }` → `201 { success, id }`
- `GET /api/feedback/summary` → `{ success, summary: [{ feature, responses, average_rating }] }`
- `GET /api/ai/logs` → `{ success, providers[], stats[], logs[] }`

## Error format
`{ "success": false, "message": "Human readable", "error": "detail (non-production)" }`
Status codes: 400 validation · 401 auth · 403 CORS/unverified · 404 unknown route · 429 cooldown · 500 server · 503 AI not configured.
