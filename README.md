# DayFlow — Personal Productivity Assistant

A full-stack, working web app built from your DayFlow screens: Dashboard, My Tasks,
Focus Timer, Calendar & Time Blocking, Goals & OKRs, Performance Analytics, and Settings.

- **Frontend:** React + Vite + Tailwind CSS (matches your DESIGN.md tokens)
- **Backend:** Node.js + Express
- **Database:** SQLite (real relational DB, file-based, zero setup — `backend/db/dayflow.sqlite`)
- **Auth:** none (single user), as requested for v1
- **AI Assistant panels:** left as static UI for v1 (no live AI calls), per your request
- **Focus Timer:** fully working — server-authoritative countdown that survives page
  refreshes, pause/resume, extend, and auto-completes when time runs out

## What's actually functional

- **Tasks:** create, edit, delete, complete/reopen, start, reschedule, filter by
  today/upcoming/completed/overdue/all, category, priority, search
- **Focus Timer:** real countdown backed by the server clock (not just a local
  `setInterval` that resets on refresh) — start/pause/resume/extend/complete/end,
  logs time back onto the linked task
- **Calendar:** day timeline view, add/edit/delete time blocks, live "now" indicator
- **Goals & OKRs:** goals with milestones, progress bars computed from real
  milestone completion, linked tasks, add/toggle/delete milestones
- **Performance:** charts (Recharts) computed from your actual last-7-days task and
  focus-session data — not mock numbers
- **Settings:** profile, working hours, focus protocol, wellness toggles — persisted
  to the database

## Project structure

```
dayflow/
  backend/          Express API + SQLite database
    db/database.js  Schema + seed data
    routes/         tasks, focus-sessions, calendar-events, goals, settings, dashboard, performance
    server.js
  frontend/         React app (Vite)
    src/pages/       Dashboard, MyTasks, FocusTimer, Calendar, Goals, Performance, Settings
    src/components/  Sidebar, TopBar, TaskModal
    src/api/client.js
```

## Running it locally

**1. Backend (port 4000)**
```bash
cd backend
npm install
npm start
```

**2. Frontend (port 5173)**
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** — the Vite dev server proxies `/api/*` to the backend
automatically (see `frontend/vite.config.js`).

The SQLite database is created automatically on first run with the same seed data
shown in your original screens (ERP migration task, SAP goal, etc.) so the app looks
populated immediately.

## Swapping in MySQL later

The backend only touches the database through `backend/db/database.js`
(`better-sqlite3`). To move to MySQL for production, swap that file for a `mysql2`
connection pool and change the few `?`-style prepared statements to the `mysql2`
equivalent — the route files don't need to change since they just call
`db.prepare(...).run()/.get()/.all()`. Happy to do that swap for you if/when you're
ready to deploy.

## Next steps you may want

- Wire the "AI Assistant" panel to a real model (Claude API) for suggestions/insights
- Add authentication if this becomes multi-user
- Deploy: e.g. Railway/Render for the Node API + a MySQL add-on, Vercel/Netlify for
  the frontend build (`npm run build` → `frontend/dist`)
