# API: endpoints added by the checklist feature layer

All paths are under the backend base URL. **login** = needs `Authorization: Bearer <token>`. **faculty/admin** and **admin** need that role. Existing endpoints (see `API.md`) are unchanged.

Responses are JSON `{ success, ... }`; errors are `{ success:false, message }` with a 4xx/5xx status. Rate limits: 600 requests / 15 min per IP overall, 120 for AI endpoints, 30 for login/register (HTTP 429 when exceeded).

Auto-generated from the route files, so it matches the code. Request/response examples are in `backend/scripts/modules-test.js`.


## Auth, account, profile, data sync

| Method | Path | Access |
|---|---|---|
| POST | `/api/auth/forgot-password` | public |
| POST | `/api/auth/reset-password` | public |
| GET | `/api/auth/google/config` | public |
| POST | `/api/auth/google` | public |
| POST | `/api/auth/refresh` | login |
| POST | `/api/auth/logout-all` | login |
| GET | `/api/me` | login |
| PUT | `/api/me` | login |
| GET | `/api/me/settings` | login |
| PUT | `/api/me/settings` | login |
| POST | `/api/me/change-password` | login |
| DELETE | `/api/me` | login |
| GET | `/api/me/profile` | login |
| PUT | `/api/me/profile` | login |
| GET | `/api/me/data` | login |
| GET | `/api/me/data/:kind` | login |
| PUT | `/api/me/data/:kind` | login |
| DELETE | `/api/me/data/:kind` | login |
| GET | `/api/me/history/:kind` | login |

## Assessments, planner, roadmap

| Method | Path | Access |
|---|---|---|
| GET | `/api/assessments/types` | login |
| POST | `/api/assessments/start` | login |
| POST | `/api/assessments/submit` | login |
| POST | `/api/assessments/record` | login |
| POST | `/api/assessments/adaptive/start` | login |
| POST | `/api/assessments/adaptive/answer` | login |
| GET | `/api/assessments/history` | login |
| GET | `/api/assessments/weak-topics` | login |
| GET | `/api/assessments/progress` | login |
| POST | `/api/planner/estimate` | login |
| POST | `/api/planner/weekly` | login |
| GET | `/api/planner/weekly` | login |
| POST | `/api/planner/weekly/toggle` | login |
| GET | `/api/planner/daily` | login |
| POST | `/api/planner/daily` | login |
| POST | `/api/planner/daily/from-plan` | login |
| POST | `/api/planner/daily/:id/toggle` | login |
| DELETE | `/api/planner/daily/:id` | login |
| GET | `/api/planner/revision` | login |
| POST | `/api/planner/revision/done` | login |
| POST | `/api/roadmap/unlock-status` | login |
| POST | `/api/roadmap/adapt` | login |

## Career intelligence

| Method | Path | Access |
|---|---|---|
| GET | `/api/career/roles` | login |
| POST | `/api/career/what-if` | login |
| POST | `/api/career/compare` | login |
| POST | `/api/career/explain` | login |
| GET | `/api/career/digital-twin` | login |
| GET | `/api/copilot/next-actions` | login |

## Portfolio hub, GitHub, resume tools, interviews

| Method | Path | Access |
|---|---|---|
| GET | `/api/certificates` | login |
| POST | `/api/certificates` | login |
| PUT | `/api/certificates/:id` | login |
| DELETE | `/api/certificates/:id` | login |
| GET | `/api/hub/projects` | login |
| POST | `/api/hub/projects` | login |
| PUT | `/api/hub/projects/:id` | login |
| DELETE | `/api/hub/projects/:id` | login |
| POST | `/api/hub/projects/:id/roadmap` | login |
| POST | `/api/hub/projects/:id/milestone` | login |
| POST | `/api/hub/projects/:id/evaluate` | login |
| POST | `/api/github/analyze` | login |
| GET | `/api/github/analysis` | login |
| GET | `/api/portfolio/me` | login |
| PUT | `/api/portfolio/me` | login |
| GET | `/api/portfolio/strength` | login |
| GET | `/api/portfolio/public/:slug` | public |
| POST | `/api/resume/ats-check` | login |
| POST | `/api/resume/optimize` | login |
| POST | `/api/interviews/history` | login |
| GET | `/api/interviews/history` | login |

## Jobs & placement

| Method | Path | Access |
|---|---|---|
| GET | `/api/jobs/catalog` | login |
| GET | `/api/jobs/recommendations` | login |
| GET | `/api/jobs/links` | login |
| GET | `/api/jobs/saved` | login |
| POST | `/api/jobs/saved` | login |
| DELETE | `/api/jobs/saved/:id` | login |
| GET | `/api/jobs/applications` | login |
| POST | `/api/jobs/applications` | login |
| PUT | `/api/jobs/applications/:id` | login |
| DELETE | `/api/jobs/applications/:id` | login |
| GET | `/api/jobs/deadlines` | login |
| POST | `/api/jobs/interview-prep` | login |
| GET | `/api/jobs/placement-dashboard` | login |

## Analytics, reports, notifications

| Method | Path | Access |
|---|---|---|
| GET | `/api/analytics/skills` | login |
| GET | `/api/analytics/timeline` | login |
| GET | `/api/analytics/career-charts` | login |
| GET | `/api/analytics/skill-demand` | login |
| GET | `/api/analytics/trends` | login |
| GET | `/api/analytics/report` | login |
| GET | `/api/analytics/report/download` | login |
| GET | `/api/notifications` | login |
| POST | `/api/notifications/refresh` | login |
| POST | `/api/notifications/read-all` | login |
| POST | `/api/notifications/:id/read` | login |
| DELETE | `/api/notifications/:id` | login |
| GET | `/api/dashboard/summary` | login |

## Gamification & community

| Method | Path | Access |
|---|---|---|
| GET | `/api/gamification/me` | login |
| POST | `/api/gamification/event` | login |
| GET | `/api/gamification/leaderboard` | login |
| GET | `/api/community/discussions` | login |
| POST | `/api/community/discussions` | login |
| GET | `/api/community/discussions/:id` | login |
| POST | `/api/community/discussions/:id/replies` | login |
| DELETE | `/api/community/discussions/:id` | login |
| GET | `/api/community/teams` | login |
| POST | `/api/community/teams` | login |
| POST | `/api/community/teams/:id/request` | login |
| GET | `/api/community/teams/:id/requests` | login |
| POST | `/api/community/teams/:id/requests/:rid` | login |
| POST | `/api/community/teams/:id/close` | login |
| GET | `/api/community/hackathons` | login |
| POST | `/api/community/hackathons` | login |
| DELETE | `/api/community/hackathons/:id` | login |
| GET | `/api/workspaces` | login |
| POST | `/api/workspaces` | login |
| GET | `/api/workspaces/:id` | login |
| POST | `/api/workspaces/:id/members` | login |
| POST | `/api/workspaces/:id/tasks` | login |
| PUT | `/api/workspaces/:id/tasks/:tid` | login |
| DELETE | `/api/workspaces/:id/tasks/:tid` | login |
| POST | `/api/workspaces/:id/messages` | login |
| POST | `/api/workspaces/:id/leave` | login |
| DELETE | `/api/workspaces/:id` | login |

## Faculty & admin

| Method | Path | Access |
|---|---|---|
| GET | `/api/faculty/students` | faculty/admin |
| GET | `/api/faculty/students/:id` | faculty/admin |
| GET | `/api/faculty/at-risk` | faculty/admin |
| GET | `/api/faculty/analytics` | faculty/admin |
| GET | `/api/admin/overview` | admin |
| GET | `/api/admin/users` | admin |
| PATCH | `/api/admin/users/:id` | admin |
| GET | `/api/admin/audit` | admin |
| GET | `/api/manage/questions` | faculty/admin |
| POST | `/api/manage/questions` | faculty/admin |
| PUT | `/api/manage/questions/:id` | faculty/admin |
| DELETE | `/api/manage/questions/:id` | faculty/admin |
| GET | `/api/courses` | login |
| POST | `/api/manage/courses` | faculty/admin |
| PUT | `/api/manage/courses/:id` | faculty/admin |
| DELETE | `/api/manage/courses/:id` | faculty/admin |
| GET | `/api/faculty/export/students.csv` | faculty/admin |
| GET | `/api/admin/export/:what` | admin |

## Operations

| Method | Path | Access |
|---|---|---|
| POST | `/api/admin/backup` | admin |
| GET | `/api/admin/backups` | admin |
| GET | `/api/admin/metrics` | admin |
| GET | `/api/status` | public |
