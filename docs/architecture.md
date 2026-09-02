# System Architecture

## Overview

Three-tier architecture: React frontend, Flask REST API backend, PostgreSQL database (hosted on Supabase). Deployed with the frontend on Vercel and the backend on Render.

Data flow: React Frontend (Vercel) --HTTPS/JWT--> Flask Backend (Render) --SQL--> PostgreSQL (Supabase)

## Backend structure

Flask app factory pattern (app/**init**.py -> create_app()), with:

- app/config.py - loads settings from environment variables
- app/extensions.py - shared instances (SQLAlchemy, JWT manager, CORS, Bcrypt, Migrate)
- app/models/ - one file per database table (User, Unit, MaintenanceRequest, Assignment, StatusHistory, Payment, Alert)
- app/routes/ - one Blueprint per resource (auth, units, maintenance_requests, assignments, payments, dashboard, alerts)
- app/utils/ - cross-cutting logic: auth_helpers.py (role-based access control decorator) and status_rules.py (the maintenance request status state machine)
- migrations/ - Alembic migration history, one migration per schema change

## Frontend structure

React (Vite) single-page app with client-side routing (React Router):

- src/api/ - one file per backend resource, wraps axios calls
- src/context/AuthContext.jsx - shared login state (user, login/signup/logout) via React Context
- src/pages/ - one component per route (Login, Signup, Units, Requests, Payments, Dashboard, Alerts)
- src/components/Layout.jsx - shared sidebar/shell, renders role-aware navigation

## Authentication flow

1. User submits email/password to /api/auth/login
2. Backend verifies password hash, issues a JWT containing the user's id and role as claims
3. Frontend stores the token in localStorage, attaches it to every subsequent request via an axios interceptor
4. Backend's role_required() decorator reads the role directly from the JWT claims on every protected route - no database lookup needed just to check permissions
5. On a 401 response (expired/invalid token), the frontend automatically clears storage and redirects to login

## Data flow example: changing a maintenance request's status

1. Frontend sends PATCH /api/requests/id/status with the new status
2. Backend checks the transition against status_rules.py's lookup table (is this a valid next status from the current one)
3. If the target is "Scheduled", backend separately checks at least one contractor is assigned
4. If both checks pass, the request's status is updated AND a new StatusHistory row is inserted, both within the same database transaction
5. Response returns the updated request; frontend re-fetches the timeline to show the new history entry

## Deployment

- Frontend: Vercel, auto-deploys from the frontend/ directory on every push to main
- Backend: Render, auto-deploys from the backend/ directory on every push to main, served via gunicorn (not Flask's dev server)
- Database: Supabase-hosted PostgreSQL, accessed via connection pooling (Transaction Pooler mode) suited to the backend's short-lived request-response connections
- Keep-alive: an external cron service pings the backend's health endpoint every 10 minutes to avoid Render free-tier cold starts affecting the demo experience
