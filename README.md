# Property Rental & Maintenance Management System

[![Live Demo](https://img.shields.io/badge/Live-Demo-success)](https://property-rental-management-system-nine.vercel.app)

A full-stack workspace for small property-management teams to run rental units, rent collection, maintenance requests, contractor work, and rent alerts from a single application — with server-enforced role separation between **managers** and **contractors**.

---

## Table of Contents

- [Live Demo](#live-demo)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Overview](#api-overview)
- [Testing & Verification](#testing--verification)
- [Documentation](#documentation)

---

## Live Demo

**App:** [property-rental-management-system-nine.vercel.app](https://property-rental-management-system-nine.vercel.app)  
**API:** [property-rental-backend-ummm.onrender.com](https://property-rental-backend-ummm.onrender.com)

**Demo credentials:**

| Role | Email | Password |
| --- | --- | --- |
| Property Manager | `manager@test.com` | `test123` |
| Maintenance Contractor | `ramesh@test.com` | `test123` |

---

## Features

### For Managers
- Create, edit, archive, and restore rental units and tenant records.
- Review, triage, schedule, and resolve maintenance requests, and assign them to contractors.
- Record one or more rent installments per unit per month — **payments are matched against the total paid for that month, not a single transaction**, so a partial payment followed by a top-up is correctly reconciled instead of flagged as underpaid.
- Historic rent amounts are locked to the month they were paid, so a later rent increase never rewrites the status of past months.
- Export a rent-roll CSV, view dashboard metrics, and manage rent alerts (generate, view, dismiss).
- Live alert badge surfaces unresolved rent issues without a page refresh.

### For Contractors
- View only maintenance requests they are personally assigned to.
- Move an assigned request through its lifecycle (Triaged → Scheduled → Resolved) and reopen it if needed.
- Add notes and upload photo attachments to their assigned requests.
- See a personal dashboard scoped to their own workload — no visibility into units, payments, or other contractors' requests.

### Access Control & Security
- Every role and ownership check is enforced **server-side** with JWT claims — the frontend hides UI, but the backend independently rejects out-of-scope requests with 403s, even when called directly (not just through the UI).
- Managers are scoped to the units they created; contractors are scoped to their own assignments — both enforced at the database query level, not just the list view.
- Passwords are hashed with bcrypt; JWTs expire after 24 hours.
- Every maintenance request keeps an **append-only** status/activity timeline — there is no update or delete route for history records, so the audit trail cannot be edited after the fact.

---

## Tech Stack

| Layer | Tools |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS, React Router, Axios, Recharts |
| Backend | Flask, SQLAlchemy, Flask-JWT-Extended, Flask-Bcrypt, Alembic |
| Database | PostgreSQL |
| Deployment | Vercel (frontend), Render (backend), Supabase (database hosting) |

---

## Project Structure

```
property-rental-management-system/
├── backend/
│   ├── app/
│   │   ├── models/         # SQLAlchemy models (User, Unit, MaintenanceRequest,
│   │   │                   # Assignment, Payment, Alert, Attachment, StatusHistory)
│   │   ├── routes/         # One blueprint per resource (auth, units, requests,
│   │   │                   # assignments, payments, dashboard, alerts, attachments)
│   │   ├── services/       # Demo data seeding / repair logic
│   │   ├── utils/          # Auth helpers, status-transition rules
│   │   ├── config.py
│   │   └── __init__.py     # App factory, blueprint registration
│   ├── migrations/         # Alembic migrations
│   ├── tests/              # Automated regression suite
│   └── run.py
├── frontend/
│   └── src/
│       ├── api/            # One thin Axios wrapper per backend resource
│       ├── components/     # Shared layout (nav, role-aware alert badge)
│       ├── context/        # AuthContext (session, role, token)
│       └── pages/          # Units, Requests, Payments, Dashboard, Alerts,
│                           # Login, Signup
├── docs/                   # Architecture, schema, decisions, plan, AI usage log
├── SUBMISSION.md           # Submission checklist and notes
└── NOTES.md
```

---

## Getting Started

### Prerequisites
- **Backend:** Python 3.13 or later, and a PostgreSQL database
- **Frontend:** Node.js 22 or later (for the Vite dev server and production build)

### 1. Backend setup

From the repository root:

```bash
cd backend
python -m venv venv

# Git Bash / macOS / Linux
source venv/Scripts/activate
# PowerShell alternative
.\venv\Scripts\Activate.ps1

pip install -r requirements.txt
```

Create `backend/.env`:

```env
DATABASE_URL=postgresql://your-connection-string
SECRET_KEY=generate-a-random-secret
JWT_SECRET_KEY=generate-a-different-random-secret
```

Apply migrations and start the API:

```bash
flask --app run:app db upgrade
python run.py
```

The API is now available at `http://127.0.0.1:5000/api`.

### 2. Frontend setup

In a second terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://127.0.0.1:5000/api
```

Start the dev server:

```bash
npm run dev
```

Open the local URL Vite prints — normally `http://localhost:5173`.

---

## API Overview

All routes are prefixed with `/api` and require a valid JWT (`Authorization: Bearer <token>`) unless noted otherwise. Role restrictions are enforced server-side, not just hidden in the UI.

| Resource | Method & Path | Description |
| --- | --- | --- |
| **Auth** | `POST /auth/signup` | Register a manager or contractor |
| | `POST /auth/login` | Log in, receive JWT |
| | `GET /auth/me` | Current user's profile |
| | `GET /auth/contractors` | List contractors (manager only) |
| **Units** | `GET /units` · `POST /units` | List / create rental units (manager only) |
| | `GET /units/<id>` · `PUT /units/<id>` | View / edit a unit |
| | `PATCH /units/<id>/archive` · `/restore` | Archive or restore a unit |
| | `GET /units/request-options` | Dropdown data for the request form |
| **Requests** | `GET /requests` · `POST /requests` | Search/filter/sort/paginate · create a request |
| | `GET /requests/<id>` · `PUT /requests/<id>` | View / edit a request |
| | `PATCH /requests/<id>/status` | Move through the status lifecycle |
| | `GET /requests/<id>/timeline` | Append-only activity history |
| | `POST /requests/<id>/notes` | Add a note to the timeline |
| **Assignments** | `POST /assignments` | Assign a contractor to a request (manager only) |
| | `DELETE /assignments/<id>` | Remove an assignment |
| | `GET /assignments/request/<id>` | List assignments for a request |
| **Payments** | `POST /payments/bulk` | Record one or more rent installments |
| | `GET /payments` | List recorded payments |
| | `GET /payments/export` | Download the rent-roll CSV |
| **Dashboard** | `GET /dashboard/summary` | Role-scoped metrics (managers see portfolio-wide; contractors see their own workload) |
| **Alerts** | `POST /alerts/generate` | Generate this month's rent alerts (manager only) |
| | `GET /alerts` · `PATCH /alerts/<id>/dismiss` | List / dismiss alerts |
| **Attachments** | `POST /attachments/request/<id>` | Upload a photo (JPEG/PNG/WEBP/GIF, max 3 MB) |
| | `GET /attachments/request/<id>` | List attachment metadata for a request |
| | `GET /attachments/<id>` | Fetch full attachment data |
| | `DELETE /attachments/<id>` | Remove an attachment (uploader or manager) |

---

## Testing & Verification

Run the backend regression suite from `backend/`:

```bash
python -m unittest discover -s tests -v
```

This covers authentication, the installment-based rent-matching logic (splitting a payment across two transactions and confirming it's still classified correctly against the monthly total), and a legacy-data migration/repair scenario.

Build the production frontend from `frontend/`:

```bash
npm run build
```

---

## Documentation

- [Architecture](./docs/architecture.md)
- [Database schema](./docs/schema.md)
- [Build plan](./docs/plan.md)
- [Technical decisions](./docs/decisions.md)
- [AI usage log](./docs/ai-prompts.md)
- [Submission checklist and notes](./SUBMISSION.md)
