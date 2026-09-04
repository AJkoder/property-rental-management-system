# Property Rental Management System

A full-stack system for a small property-management company to manage units, rent collection, maintenance work, contractor assignments, and rent alerts.

- Live application: https://property-rental-management-system-nine.vercel.app
- Backend API: https://property-rental-backend-ummm.onrender.com
- Demo accounts and requirement checklist: [SUBMISSION.md](./SUBMISSION.md)

## Highlights

- Server-enforced manager and contractor roles
- Unit CRUD, archive, and restore
- Maintenance lifecycle, assignment rules, and append-only timeline
- Server-side request search, filtering, sorting, and pagination
- Bulk rent recording, rent-roll CSV export, dashboard, and alerts
- Photo attachments as a stretch feature

## Stack

React/Vite/Tailwind/React Router/Axios/Recharts; Flask/SQLAlchemy/JWT/Bcrypt/Alembic; PostgreSQL on Supabase; Vercel and Render.

## Run locally

Prerequisites: Python 3.13+, Node.js 22+, and PostgreSQL.

```bash
cd backend
python -m venv venv
# Windows PowerShell: .\venv\Scripts\Activate.ps1
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
DATABASE_URL=postgresql://your-connection-string
SECRET_KEY=generate-a-random-secret
JWT_SECRET_KEY=generate-a-different-random-secret
```

```bash
flask db upgrade
python run.py
```

In a second terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://127.0.0.1:5000/api
```

```bash
npm run dev
```

## Documentation

- [Architecture](./docs/architecture.md)
- [Database schema](./docs/schema.md)
- [Build plan](./docs/plan.md)
- [Technical decisions](./docs/decisions.md)
- [AI usage log](./docs/ai-prompts.md)
