# Property Rental Management System

A full-stack application for small property-management teams to manage rental units, rent collection, maintenance requests, contractor work, and rent alerts from one workspace.

**Live App:** [property-rental-management-system-nine.vercel.app](https://property-rental-management-system-nine.vercel.app)  
**API:** [property-rental-backend-ummm.onrender.com](https://property-rental-backend-ummm.onrender.com)

## What it does

- Separates manager and contractor access with server-enforced JWT roles.
- Manages units, tenants, monthly rent, archival, and restoration.
- Tracks maintenance from report through triage, scheduling, and resolution.
- Supports contractor assignments and an append-only activity timeline.
- Provides server-side search, filtering, sorting, and pagination for requests.
- Records one or more rent installments per unit/month, with correct monthly paid, underpaid, and overpaid status.
- Produces rent-roll CSV exports, dashboard metrics, and overdue-rent alerts.
- Supports maintenance-photo attachments.

## Rent collection integrity

Rent is evaluated by the **total paid for a unit in a month**, rather than by a single transaction. For example, payments of ₹13,000 and ₹2,000 against monthly rent of ₹15,000 are both shown as part of a matched rent month.

The application also preserves the rent amount recorded for a month, so a subsequent rent change cannot alter the status of historic payments. Database migrations reconcile legacy payment records and stale active alerts when deployed.

## Technology

| Layer | Tools |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS, React Router, Axios, Recharts |
| Backend | Flask, SQLAlchemy, Flask-JWT-Extended, Flask-Bcrypt, Alembic |
| Database | PostgreSQL |
| Deployment | Vercel, Render, Supabase |

## Run locally

### Prerequisites

- **Backend:** Python 3.13 or later and PostgreSQL
- **Frontend:** Node.js 22 or later (only for the React/Vite development server and production build)

### 1. Start the backend

From the repository root:

```bash
cd backend
python -m venv venv
# Git Bash/macOS/Linux
source venv/Scripts/activate
# PowerShell alternative: .\venv\Scripts\Activate.ps1
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

The API is available at `http://127.0.0.1:5000/api`.

### 2. Start the frontend

In a second terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://127.0.0.1:5000/api
```

Start Vite:

```bash
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

## Demo access

| Role | Email | Password |
| --- | --- | --- |
| Property Manager | `manager@test.com` | `test123` |
| Maintenance Contractor | `ramesh@test.com` | `test123` |

The manager demo includes an installment example: ₹13,000 + ₹2,000 against ₹15,000 for the same rent month.

## Verification

Run the backend regression suite from `backend/`:

```bash
python -m unittest discover -s tests -v
```

Build the production frontend from `frontend/`:

```bash
npm run build
```

## Documentation

- [Architecture](./docs/architecture.md)
- [Database schema](./docs/schema.md)
- [Build plan](./docs/plan.md)
- [Technical decisions](./docs/decisions.md)
- [AI usage log](./docs/ai-prompts.md)
- [Submission checklist and notes](./SUBMISSION.md)
