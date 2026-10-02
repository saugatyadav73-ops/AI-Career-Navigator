# Database Schema

Engine: **SQLite** (`better-sqlite3`), file `backend/career_navigator.db`, created automatically on first start. Canonical DDL: [`backend/schema.sql`](../backend/schema.sql).

```
students 1 ──< ai_logs      (student_id, nullable, ON DELETE SET NULL)
students 1 ──< feedback     (student_id, nullable, ON DELETE SET NULL)
```

## students
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK AUTOINCREMENT | |
| name | TEXT NOT NULL | max 100 chars |
| email | TEXT NOT NULL UNIQUE | lower-cased |
| password | TEXT NOT NULL | bcrypt hash (cost 10) |
| created_at | DATETIME | default `CURRENT_TIMESTAMP` |
| email_verified | INTEGER NOT NULL DEFAULT 0 | 1 = verified |
| verification_code_hash | TEXT | bcrypt hash of 6-digit code |
| verification_expires_at | DATETIME | code valid for 10 min |
| verification_sent_at | DATETIME | 60 s resend cooldown |

## ai_logs
One row per AI-provider attempt (see [AI_ORCHESTRATION.md](AI_ORCHESTRATION.md)).

| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| task | TEXT | `career_analysis`, `skill_gap_questions`, `mock_interview_question`, `mock_interview_evaluate`, `mock_interview_report` |
| provider | TEXT | `openai` / `gemini` / `huggingface` / `none` |
| model | TEXT | model id used |
| status | TEXT | `success` / `error` / `skipped` |
| latency_ms | INTEGER | |
| prompt_hash | TEXT | first 16 hex chars of SHA-256 |
| prompt_chars | INTEGER | |
| prompt_preview / response_preview | TEXT | first 1000 chars |
| error | TEXT | provider error / timeout |
| student_id | INTEGER FK | set when a valid JWT is sent |
| created_at | DATETIME | |

## feedback
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| student_id | INTEGER FK | optional |
| feature | TEXT | e.g. `career-analysis`, `mock-interview` |
| rating | INTEGER | 1-5 (CHECK constraint) |
| comment | TEXT | verbatim user comment |
| created_at | DATETIME | |

> Per-student learning progress (skill assessment, roadmap, resume results) is currently stored client-side in `localStorage` keyed per student (`frontend/src/utils/studentStorage.js`). Moving these to server tables is listed under *Next steps* in the README.
