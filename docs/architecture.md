# System architecture

## The shape of the application

This is a conventional three-tier web application. I chose that shape because the problem is fundamentally about shared operational data: several people need to see the same units, payments, requests, and history, while the rules around who may change each record need to be enforced somewhere the browser cannot bypass.

```text
React client (Vercel)
        │ HTTPS + JWT
        ▼
Flask REST API (Render / Gunicorn)
        │ SQLAlchemy
        ▼
PostgreSQL (Supabase)
```

The React client owns presentation, local interaction state, and route navigation. Flask owns authentication, authorization, validation, lifecycle rules, and all database access. PostgreSQL owns persistent relational data and the database-level integrity constraints. The browser never connects directly to Supabase.

## What runs where

| Piece | Responsibility | Where it runs |
|---|---|---|
| React + Vite | The manager/contractor interface, charts, forms, and client-side navigation | Vercel static hosting |
| Flask API | REST endpoints, role checks, status rules, rent classification, exports, and dashboard queries | Render, served by Gunicorn |
| PostgreSQL | Users, units, requests, assignments, history, payments, alerts, and attachment metadata/data | Supabase |
| External health check | Periodically calls `/api/health` to reduce Render free-tier cold starts | cron-job.org |

Secrets are not part of the repository. The backend reads `DATABASE_URL`, `SECRET_KEY`, and `JWT_SECRET_KEY` from its environment; the frontend reads `VITE_API_URL` at build time.

## Backend organisation

`backend/app/__init__.py` is an application factory. It configures SQLAlchemy, Flask-JWT-Extended, Flask-Bcrypt, Flask-Migrate, and CORS once, then registers a Blueprint for each API area. Keeping Blueprints separate means a feature such as rent alerts can evolve without turning a single `app.py` into the place where every concern accumulates.

| Area | Main responsibility |
|---|---|
| `routes/auth.py` | Signup, login, current-user lookup, and contractor listing |
| `routes/units.py` | Manager-only unit CRUD and archive/restore |
| `routes/maintenance_requests.py` | Request creation, discovery, editing, status changes, notes, and timeline |
| `routes/assignments.py` | Manager-only contractor assignment/removal and scoped assignment reads |
| `routes/payments.py` | Bulk rent recording, payment history, and CSV rent-roll export |
| `routes/dashboard.py` | Portfolio aggregates and the eight-week resolved trend |
| `routes/alerts.py` | Monthly unpaid/underpaid alert generation and dismissal |
| `routes/attachments.py` | Optional photo upload, retrieval, deletion, and request-scoped access |

Two small utility modules hold the business rules that should not be duplicated in request handlers. `auth_helpers.py` exposes `role_required()` plus helpers for the current JWT identity. `status_rules.py` expresses the maintenance lifecycle as a single mapping, with the scheduling-assignment rule intentionally checked separately.

## Authentication and authorization

When a user signs in, Flask verifies the bcrypt password hash and issues a JWT carrying the user ID and role. Axios stores the token in the browser's local storage and sends it as a bearer token on future calls. A 401 response clears the session and returns the user to login.

Manager-only operations use `role_required('manager')` on the server. Contractor access has a second constraint: a contractor may see or update only a maintenance request to which they are currently assigned. This check is applied to direct request reads, updates, timelines, assignment reads, and attachment reads—not merely represented by hidden navigation in the UI. The client-side role-aware sidebar is convenience, not security.

## Representative flow: resolving a maintenance request

1. A manager or assigned contractor opens a request in the React detail panel and selects `Resolved`.
2. The frontend sends `PATCH /api/requests/<id>/status` with the requested status and the JWT.
3. Flask finds the request, confirms access for a contractor, and asks `status_rules.py` whether the transition is allowed.
4. If the destination is `Scheduled`, the route separately checks that at least one contractor is assigned. Invalid moves return a 400 response with an explanation.
5. For a valid move, the request's status changes and a `status_history` event with the old status, new status, actor, and timestamp is added before one database commit.
6. The browser refreshes the request details and timeline, so the visible state and audit entry come from the same committed operation.

That transaction boundary matters: a status cannot appear to change without a corresponding history entry, or vice versa.

## Frontend organisation

The frontend is a Vite React single-page app. `AuthContext` centralises the signed-in user, login, signup, and logout behavior. The `api/` folder contains narrow Axios wrappers so pages do not repeat HTTP details. Pages represent the main workspaces; `Layout` provides the shared navigation and alert badge.

The request detail panel is the densest UI because it brings together status controls, assignment management, photos, notes, and history. The backend remains the authority for every action: the UI may only present the next likely transition, but the API rejects a forged or stale request.

## Deliberate limits

The application meets the core portfolio workflow, but it is not pretending to be a complete property-management suite. The following were consciously excluded to stay within the take-home scope:

- no tenant-facing portal or online rent payment provider;
- no leases, owner/portfolio separation, late fees, or accounting ledger;
- no worker queue or scheduled alert job—alert generation is manager-triggered;
- no automated test suite yet; verification was manual through API calls and the browser;
- attachments are stored as base64 in the database for a small demo. Production would use object storage and retain only a URL/key in PostgreSQL.

The first production-focused follow-up would be automated integration tests around roles, status transitions, payment classification, and alerts, followed by an actual scheduled alert job.
