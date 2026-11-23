# Pathway A — Review 2 Evidence Pack

This repository contains the three evidence areas requested for the next review:

1. **Explicit database schema** — `docs/DATABASE_SCHEMA.md` and executable DDL in `backend/schema.sql`.
2. **REST API specification** — `docs/API.md`, including authentication, request/response contracts and AI feature endpoints.
3. **AI prompt orchestration + audit logging** — `backend/ai/orchestrator.js`, `docs/AI_ORCHESTRATION.md`, SQLite `ai_logs`, and JSONL logging in `backend/logs/`.
4. **Target-user feedback collection** — `docs/USER_RESEARCH.md` and `POST /api/feedback` + `GET /api/feedback/summary`.

## Important submission rule: real user evidence

The repository intentionally does **not** invent participant identities, ratings, task times, or verbatim quotes. Pathway A requires evidence from at least three real target users, so the final submission must contain three genuine sessions with consent.

### Minimum evidence to add before submission

- 3 target users (CSE/IT students are the intended audience)
- Quantitative answers to Q1-Q7 for each participant
- Career-clarity score before and after the session
- Task time and observed errors
- At least one exact/verbatim quote from each participant, recorded with consent
- A short synthesis of the top pain points and changes made because of the findings

Use `docs/USER_RESEARCH.md` as the recording sheet. Ratings submitted through the app are persisted in SQLite and can be summarized through `/api/feedback/summary`.

## Verification commands

From `backend/`:

```bash
npm test
npm run test:orchestration
```

The first command checks the API in offline/rules mode. The second command uses a deterministic stub (no real AI API call) to verify provider failover and audit-log creation.
