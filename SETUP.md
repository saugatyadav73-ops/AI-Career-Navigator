# AI Career Navigator — Clean Setup

## Backend
```bash
cd backend
npm install
copy .env.example .env
npm start
```

Backend: `http://localhost:5000`

## Frontend
Open a second terminal:
```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Frontend: `http://localhost:5173`

For PowerShell, use `Copy-Item .env.example .env` instead of `copy` if needed.

## AI providers
Add one or more keys to `backend/.env`:
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `HUGGINGFACE_API_KEY`

The backend works without an AI key using deterministic fallback engines. When a real provider key is configured, the prompt orchestration layer sends the request server-side and logs the provider/model/result metadata.

## Verification
```bash
cd backend
npm test
npm run test:orchestration
```

Do not commit `.env` or the generated `backend/career_navigator.db`.

## New in the 130-item build

### Extra environment variables (all optional, see `backend/.env.example`)
- `ADMIN_EMAILS` / `FACULTY_EMAILS`: comma-separated emails that become admin / faculty. **Register that account first, then set the variable and restart** (or just log in again). Without an admin there is no access to the Admin dashboard.
- `GOOGLE_CLIENT_ID`: enables "Sign in with Google" (the button stays hidden until this is set). In Google Cloud Console add your frontend URL under *Authorized JavaScript origins*.
- `REQUIRE_AUTH_FOR_AI=true`: also requires login for the older AI endpoints.
- `BACKUP_INTERVAL_HOURS`, `BACKUP_KEEP`, `BACKUP_DIR`: automatic database backups. Manual: `npm run backup`.
- `TRUST_PROXY=1` when deployed behind Render/Railway so rate limits use the real client IP.

### Tests
```bash
cd backend
npm test                 # original smoke test
npm run test:orchestration
npm run test:modules     # 95 integration checks for the new feature layer
npm run test:all
```

### First-time walkthrough
1. Register, open **Student Profile**, save it. 2. **Practice & Tests**: take a test. 3. **Career Lab**: see the copilot, what-if and digital twin. 4. **Learning Planner**: generate a weekly plan. 5. **Portfolio Hub**, **Jobs & Placement**, **Community & XP**.
Faculty/admin: log in with an `ADMIN_EMAILS` account and open **Faculty / Admin** in the sidebar.

### What changed in existing files (everything else is new files)
- `backend/server.js`: one line, `require("./modules")(app);`, mounted before the existing feature router.
- `frontend/src/utils/studentStorage.js`: after each save/remove it also queues a background copy to the server (failures are ignored; localStorage still works exactly as before).
- `frontend/src/main.jsx`: loads `features.css` and runs a once-per-session restore of server data on a new device.
- `frontend/src/App.jsx`, `components/Sidebar.jsx`, `pages/Login.jsx`: new routes, menu entries, "Forgot password?" link and the optional Google button.
- `backend/package.json`, `.env.example`, `render.yaml`, `.gitignore`: new scripts / variables.

### Deployment warning
SQLite is a file. On Render's free plan the disk is wiped on every redeploy, which would delete all accounts and data (and the backups, since they are on the same disk). Use a persistent disk or a paid plan, and copy backups elsewhere.
