# Build Notes — Property Rental Management System

My own working notes, written as we build. Not part of the official submission docs (those are schema.md / decisions.md / plan.md / ai-prompts.md) — this is the messier, more complete version for myself, so I can re-read this later and actually explain what I built and why.

Stack: Flask + SQLAlchemy + PostgreSQL (Supabase) on the backend, React on the frontend (later), deployed on Render + Vercel.

---

## Session 1 - Project Setup

Folder structure: split into backend/, frontend/, docs/ from the start.

Backend uses the "app factory" pattern - instead of one big app.py, Flask app gets built inside a create_app() function in app/__init__.py. Config lives in app/config.py, shared extensions (db, jwt, cors, etc.) live in app/extensions.py as bare instances that get .init_app(app)'d inside the factory. Reason: avoids circular imports, makes it possible to spin up multiple app instances cleanly (e.g. for tests).

Database: Supabase (hosted Postgres) instead of installing Postgres locally. Free tier, works the same for dev and prod, one less thing to set up on the laptop. Used the Transaction Pooler connection string (not Direct Connection) - meant for stateless/short-lived connections, which fits how Render's free tier will call the DB.

Bug hit: DB password contained an @ character, which broke the connection string parsing (@ is the reserved separator between password and host in a URL). Fixed by URL-encoding it as %40.

Secrets: .env holds DATABASE_URL, SECRET_KEY, JWT_SECRET_KEY - never committed (.gitignore blocks it). .env.example committed instead as a template.

Verified connection with a one-line Python script calling db.engine.connect() before building anything else, to isolate DB setup issues from feature bugs later.

---

## Session 2 - Auth + Units

### User model (app/models/user.py)
Columns: id (UUID string, not auto-increment int - avoids exposing guessable/sequential IDs in a public API), name, email (unique + indexed since login looks it up constantly), password_hash, role (manager or contractor), created_at.

Password handling: bcrypt via Flask-Bcrypt. set_password() hashes on signup, check_password() compares on login. Never store or log the plain password anywhere.

### Auth routes (app/routes/auth.py)
- POST /api/auth/signup - validates all fields present, role is one of the two allowed values, password length check, checks email isn't already taken (409 if so). Hashes password, creates user, returns a JWT immediately.
- POST /api/auth/login - looks up by email, checks password hash, returns JWT.
- GET /api/auth/me - test route, returns whoever the token belongs to.

JWT design: token claims include the user's role. Any route can check "is this a manager" just by reading the token - no extra DB query needed. Token expires in 24h.

### Role-based access control (app/utils/auth_helpers.py)
role_required(*roles) - a decorator. Put @role_required('manager') above any route and it verifies the JWT, pulls the role out, returns 403 if not allowed. Entirely server-side - a contractor can't get manager access by editing frontend code, because the backend decides permissions, not the frontend.

Tested: manager can hit manager-only routes, contractor gets a clean 403 on the same routes.

### Unit model (app/models/unit.py)
Columns: id (UUID), unit_number, address, rent_amount (Numeric(10,2), deliberately not Float - floats can introduce rounding drift with decimals which is unacceptable for money), tenant_name (nullable - unit can be vacant), is_archived (boolean, default false), created_at, updated_at (auto-updates via onupdate=).

### Units routes (app/routes/units.py)
Create/update/archive/restore are manager-only. List/get work for either role. List hides archived units by default, ?include_archived=true shows them.

Soft delete instead of hard delete: archiving just flips is_archived to true. Reasoning: a unit accumulates maintenance requests and rent payment history over time - hard-deleting it would orphan or force-cascade-delete that history.

Tested: manager creates a unit, contractor blocked (403), list/get work for both, archive/restore both work correctly.

---

## Session 3 - Maintenance Requests, Status Lifecycle, Assignments, Audit Timeline

This session had the actual hard business logic - the stuff most likely to come up in an interview.

### MaintenanceRequest model (app/models/maintenance_request.py)
Columns: id, unit_id (foreign key -> units.id, this is what makes the data relational - a request always belongs to exactly one unit), description, priority (Low/Medium/High/Urgent), status (defaults to Reported), created_by (foreign key -> users.id), timestamps.

Has a db.relationship('Unit', ...) so request.unit.address works directly without manual joins.

### Status lifecycle (app/utils/status_rules.py)
A separate file from route logic - just a lookup dictionary:
Reported -> Triaged
Triaged -> Scheduled or Reported
Scheduled -> Resolved or Triaged
Resolved -> Triaged

is_transition_allowed(current, new) checks this dict. Can't skip steps (Reported straight to Scheduled is blocked). Reopening Resolved goes to Triaged specifically, not back to Reported (matches assignment spec exactly).

Second, independent rule: check_scheduling_requirements() - can't move to Scheduled unless the request already has at least one contractor assigned. Checked separately from the transition table since it's a data-completeness rule, not a status-ordering rule.

Why its own file: keeps business rules readable and testable separately from Flask route code.

### Assignment model (app/models/assignment.py)
Many-to-many join table between requests and contractors. Needed its own table because one request can have multiple contractors and one contractor can be on multiple requests - a single foreign key column wouldn't support that. UniqueConstraint(request_id, contractor_id) so the same contractor can't get double-assigned to the same request.

### Assignment routes (app/routes/assignments.py)
Assign/remove are manager-only. Assign validates the contractor_id actually belongs to a user with role contractor.

### Status update route (PATCH /requests/id/status)
Runs both checks in order: is the transition valid per the state machine, then (if targeting Scheduled) is a contractor assigned. Only updates if both pass.

### Audit timeline (app/models/status_history.py)
Logs every status change: request_id, old_status (nullable, null on first entry), new_status, changed_by, changed_at.

Immutable just means: no update or delete route exists for this table anywhere. Not a DB-level lock, just a deliberate absence of any mutating endpoint.

Same-transaction guarantee: both the status update and the history insert happen before one db.session.commit(). Can't end up out of sync.

Tested end to end: created a request, watched timeline log creation (null -> Reported), moved to Triaged, watched second entry appear (Reported -> Triaged). Also re-verified full lifecycle including the contractor-requirement blocking Scheduled correctly.

---

## Things worth remembering if asked to explain any of this later

- Every route that changes data checks the role server-side via role_required() - permissions are never decided by the frontend.
- Money fields use Numeric, never Float.
- IDs are UUIDs everywhere, not sequential integers.
- Nothing is hard-deleted - units are archived, history is append-only, the whole app is built around not losing data.
- The status state machine and the "must have contractor" rule are two separate, independently-checked pieces of logic.
- Contractors querying their maintenance requests get filtered at the database query level (.join(Assignment).filter(...)), not fetched-then-filtered in Python.

## Still to build (as of end of Session 3)
- Server-side search/filter/sort/pagination on the requests list
- Bulk rent recording + CSV export
- Dashboard aggregations
- Rent alerts (grace period + dismiss/reappear logic)
- React frontend
- Deployment (Render + Vercel)

---

## Session 6 - React Frontend (all 6 pages)

Built the whole frontend: Vite + React + Tailwind v4 (the newer plugin-based setup, not the old PostCSS config way - v4 removed the CLI init workflow).

Auth: AuthContext holds user state, login/signup/logout, backed by localStorage so a refresh doesn't log you out. axios client has an interceptor that auto-attaches the JWT to every request and auto-logs-out on a 401.

Pages built: Login, Signup, Units (table + create/edit modal + archive), Requests (list with filters + detail modal showing status buttons that only show VALID next states pulled from the same lifecycle rules as the backend + timeline + contractor assignment UI), Payments (bulk entry rows + CSV export via authenticated blob download, not a raw link with the token in the URL), Dashboard (stat cards + recharts donut/bar charts), Alerts (generate/dismiss).

Design choice: no emoji/stickers anywhere in the actual UI, neutral slate palette, one dark accent color, lucide-react icons only where functionally useful - deliberately avoided the "generic AI-generated app" look.

Two real mistakes made and caught here:
1. Terminal heredoc pastes (cat > file << EOF) kept silently truncating mid-paste in Git Bash on Windows - caused broken/incomplete files multiple times without obvious errors. Fix: switched to creating/editing anything more than a few lines directly in VS Code instead of the terminal.
2. Created Layout.jsx at the project root instead of inside frontend/src/components/ because a cd command ran from the wrong directory. Caught via git status showing the file in an unexpected location before committing - fixed with a move (git tracked it correctly as a rename), not a delete+recreate.

## Session 7 - Deployment + final gap review

Backend: added gunicorn + Procfile (Flask's dev server explicitly isn't for production). Deployed to Render, root directory set to backend/, env vars for DATABASE_URL/SECRET_KEY/JWT_SECRET_KEY/PYTHON_VERSION. Discovered SECRET_KEY and JWT_SECRET_KEY had never actually been generated locally the whole project - only DATABASE_URL existed in .env, meaning the app had silently been running on insecure hardcoded fallback defaults from config.py this whole time. Generated real ones for both local and Render.

Frontend: deployed to Vercel, root directory frontend/, VITE_API_URL env var pointing at the live Render URL.

Set up an external cron (cron-job.org) pinging /api/health every 10 min so Render's free tier doesn't cold-start on a reviewer's first click.

Most important part of this session: went back and reread the ORIGINAL brief's exact wording (not my own paraphrased understanding of the 10 goals) and diffed it against what was actually built. Found 4 real gaps that had been missed:
1. No way to edit a request's description/priority after creation (goal 3 explicitly requires this for both roles)
2. Requests search was missing a contractor filter (goal 6 lists it explicitly)
3. Timeline only logged status changes, not assignment/removal events (goal 9 requires both)
4. Dashboard was missing total rent collected, by-contractor breakdown, and the 8-week resolved chart (goal 8 requires all three)

All 4 fixed. The lesson here: early in a long build you form a mental summary of the spec and start coding against that summary, and the summary quietly drifts from the literal ask. A final read-the-actual-text-again pass caught things a "I basically know what this needs" pass would not have.

One more bug hit while fixing gap 3: added a new NOT NULL column to a table that already had rows, migration failed with NotNullViolation. Fixed with the standard safe pattern - add column as nullable, backfill existing rows via UPDATE, then alter to NOT NULL.

Seeded the live database with more realistic demo data afterward (5 units, requests across different statuses/priorities, one deliberately underpaid rent record) so the live app doesn't look like an empty shell to a reviewer.

## Final state
All 10 goals done and verified against literal brief wording. Backend + frontend live and tested end to end. All 5 required docs plus SUBMISSION.md and README.md complete. Remaining: final UI polish pass (optional, app is functionally complete either way) and one last full click-through before calling it submitted.
