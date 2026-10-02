# User Research - Pathway A Evidence

> **Status: TEMPLATE - to be completed with real sessions.**
> Feedback from real users cannot be generated or invented. The structure, questionnaire and
> in-app collection endpoint are ready; fill in the tables below with your own sessions
> (minimum **3 target users**) before submission. Do not submit placeholder values.

**Target users:** CSE / IT students (years 1-4) choosing a career path.

## 1. Session protocol (15-20 min each)
1. Consent + background (year, branch, career clarity before tool: 1-5).
2. Task walk-through: register → interest quiz → career analysis → skill-gap test → roadmap → mock interview.
3. Record time-on-task and errors observed.
4. Post-test questionnaire (below) + open interview.

## 2. Quantitative questionnaire (1 = strongly disagree … 5 = strongly agree)
| Code | Statement |
|---|---|
| Q1 | The career recommendation matched my interests |
| Q2 | The skill-gap questions were relevant and the right difficulty |
| Q3 | The roadmap gave me clear next steps |
| Q4 | The mock-interview feedback was useful |
| Q5 | The tool was easy to use |
| Q6 | I would use it again / recommend it |
| Q7 | Career clarity AFTER using the tool (1-5) |

## 3. Results table (fill in)
| User | Year/Branch | Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Clarity before → after | Task time (min) |
|---|---|---|---|---|---|---|---|---|---|
| U1 | | | | | | | | | |
| U2 | | | | | | | | | |
| U3 | | | | | | | | | |
| **Mean** | | | | | | | | | |

## 4. Verbatim insights (fill in, quote exactly, with consent)
| User | Verbatim quote | Theme | Action taken |
|---|---|---|---|
| U1 | "…" | | |
| U2 | "…" | | |
| U3 | "…" | | |

## 5. Synthesis
- Top 3 pain points:
- Top 3 things that worked:
- Changes made as a result (link to commits/issues):

## 6. Collecting data inside the app
Participants (or you on their behalf) can submit ratings that are stored in the `feedback` table:
```bash
curl -X POST http://localhost:5000/api/feedback -H "Content-Type: application/json" \
  -d '{"feature":"career-analysis","rating":4,"comment":"exact quote from user"}'
curl http://localhost:5000/api/feedback/summary     # per-feature averages
```
