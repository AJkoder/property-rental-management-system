# Property Rental Management System

A full-stack property rental and maintenance management system built for a small property management company — replacing spreadsheets and sticky notes with a real system for tracking units, maintenance requests, rent payments, and alerts.

**Live app:** https://property-rental-management-system-nine.vercel.app
**Backend API:** https://property-rental-backend-ummm.onrender.com

Demo credentials and full project documentation are in [SUBMISSION.md](./SUBMISSION.md).

## Stack

- **Frontend:** React (Vite) + Tailwind CSS v4 + React Router + recharts + axios
- **Backend:** Flask + SQLAlchemy + Flask-JWT-Extended + Flask-Bcrypt + Alembic
- **Database:** PostgreSQL (Supabase)
- **Hosting:** Vercel (frontend), Render (backend), Supabase (database)

## Features

- Email/password auth with two roles (property manager, maintenance contractor), enforced server-side
- Units management with archive/restore
- Maintenance requests with a strict status lifecycle (Reported → Triaged → Scheduled → Resolved), contractor assignment, and an immutable audit timeline
- Server-side search, filtering, sorting, and pagination on maintenance requests
- Bulk rent recording with matched/underpaid/overpaid/unmatched classification, plus CSV export of the rent roll
- Dashboard with portfolio stats, status/priority/contractor breakdowns, and a weekly resolved-requests chart
- Rent alerts with a grace period, dismiss action, and automatic reappearance if a unit is still unpaid the following month

## Project structure

property-rental-system/
├── backend/ Flask API
│ ├── app/
│ │ ├── models/ SQLAlchemy models, one file per table
│ │ ├── routes/ Flask blueprints, one file per resource
│ │ └── utils/ Role-based access control, status lifecycle rules
│ └── migrations/ Alembic migration history
├── frontend/ React app (Vite)
│ └── src/
│ ├── api/ axios wrappers, one file per backend resource
│ ├── pages/ One component per route
│ ├── components/ Shared UI (sidebar/layout)
│ └── context/ Auth state
└── docs/ architecture.md, schema.md, plan.md, decisions.md, ai-prompts.md

## Running locally

### Prerequisites

- Python 3.13+
- Node.js 22+
- A PostgreSQL database (a free Supabase project works well)

### Backend setup

```bash
cd backend
python -m venv venv
source venv/Scripts/activate   # Windows Git Bash; use `source venv/bin/activate` on Mac/Linux
pip install -r requirements.txt
```

Create a `.env` file in `backend/` with:

DATABASE_URL=postgresql://your-connection-string
SECRET_KEY=some-random-string
JWT_SECRET_KEY=another-random-string

Run migrations and start the server:

```bash
flask db upgrade
python run.py
```

Backend runs on `http://127.0.0.1:5000`.

### Frontend setup

```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/` with:

VITE_API_URL=http://127.0.0.1:5000/api

Start the dev server:

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`.

### Both need to be running at the same time for the app to work locally.

## Documentation

See the `docs/` folder for architecture decisions, database schema, the build plan, key technical decisions (including trade-offs and at least one reversal), and the AI usage log.
