# AI Career Navigator

Career guidance platform for CSE students: interest quiz → AI career recommendation → skill-gap test → roadmap → resume analysis → mock interviews.

**Stack:** React 19 + Vite (frontend) · Node/Express 5 + SQLite (backend) · OpenAI / Gemini / HuggingFace via an orchestration layer.

## Quick start
```bash
# 1. Backend  (http://localhost:5000)
cd backend
cp .env.example .env        # optional: add an AI key and/or SMTP settings
npm install
npm start

# 2. Frontend (http://localhost:5173)
cd ../frontend
cp .env.example .env
npm install
npm run dev
```
Works **without any API keys**: accounts are auto-verified (no SMTP), and career analysis, interview questions and answer scoring use the built-in rule-based engine. Add `OPENAI_API_KEY`, `GEMINI_API_KEY` or `HUGGINGFACE_API_KEY` for full LLM features (skill-gap questions, interviews and resume analysis now also work offline; `npm install` adds PDF/DOCX text extraction).

## Production deployment
This project is set up for a split deployment:
- Frontend: Vercel
- Backend: Render or Railway
- Database: SQLite on the backend host

Recommended setup:
```bash
# Frontend env
VITE_API_URL=https://your-backend.onrender.com

# Backend env
PORT=5000
JWT_SECRET=your-long-production-secret
ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

Important: the SQLite database stored in [backend/database.js](backend/database.js) is file-based, so the backend should run on a service with persistent storage. Vercel is only suitable for the frontend.

## 10 AI features (sidebar -> "AI Tools")
Career Mentor · Resume Analyzer · Mock Interview · Job Matcher · Career Prediction · Skill Gap AI · Dynamic Roadmap · Resource Recommendation · Project Generator · Resume Builder (+ Subject Quiz generator for any subject).
All work offline (rule engine) and upgrade automatically to LLM answers when an API key is set. Verify with `cd backend && npm test`.

## Documentation
- [REST API specification](docs/API.md)
- [Database schema](docs/DATABASE_SCHEMA.md) · [`backend/schema.sql`](backend/schema.sql)
- [AI prompt orchestration & logging](docs/AI_ORCHESTRATION.md)
- [User research (Pathway A) - template to complete](docs/USER_RESEARCH.md)

## Project layout
```
backend/   server.js · database.js · schema.sql · ai/{orchestrator,fallback}.js · logs/
frontend/  src/pages · src/components · src/utils
docs/      API · schema · AI orchestration · user research
```

## Fixes in this version
- Invalid default model `gpt-5.6-luna` → `gpt-4o-mini`; placeholder API key no longer counts as configured.
- Registration no longer fails with HTTP 500 when SMTP is missing (dev auto-verify).
- All LLM calls go through one orchestrator (failover, retry, timeout, audit log) instead of 5 direct SDK calls.
- Rule-based fallbacks so core features survive provider outages.
- JWT is now verified (`optionalAuth` / `requireAuth`); it was previously issued but never checked.
- Frontend: 0 ESLint errors (was 35), removed unused imports and 3 stale backup pages; local `.env` no longer points to the production server.
- Removed committed secrets/DB files, stray backup server files and empty root-level `src/` scaffolding.

## Known limitations / next steps
- Student progress is still stored in browser `localStorage`; move to server tables.
- The frontend stores the JWT but does not yet send it on every request (server accepts anonymous calls for AI endpoints).
- No automated tests; add API tests (supertest) and component tests.
- Complete `docs/USER_RESEARCH.md` with real participant data before submission.
