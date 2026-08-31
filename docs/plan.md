# Project Plan

## Session 1 — Setup & Foundation
- Initialized Git repo, connected to GitHub (public)
- Set up Flask app factory pattern (app/config.py, extensions.py, __init__.py)
- Installed dependencies: Flask, SQLAlchemy, Flask-CORS, Flask-JWT-Extended, psycopg2, python-dotenv
- Created Supabase PostgreSQL project (Singapore region), connected via Transaction Pooler
- Verified DB connection successfully from Flask
- Set up .gitignore to exclude .env and venv/
- First commit + push to GitHub

## Session 2 — Auth + Units CRUD
- Added password hashing (bcrypt) to User model
- Built signup/login endpoints with JWT token generation
- Built role-based access control middleware (role_required decorator)
- Tested and confirmed server-side role enforcement (contractor blocked from manager-only routes)
- Added Unit model (units table) with soft-delete pattern
- Built full Units CRUD: create, list, get, update, archive, restore
- Tested all endpoints manually via curl, confirmed permission checks work correctly

## Session 3 — Maintenance Requests, Status Lifecycle, Assignments
- Built MaintenanceRequest model with foreign key to Unit
- Built Assignment model (many-to-many between requests and contractors)
- Designed and implemented status state machine (Reported -> Triaged -> Scheduled -> Resolved)
- Enforced "Scheduled requires contractor assigned" business rule
- Enforced "Resolved reopens to Triaged, not Reported" rule
- Built contractor assignment/removal endpoints (manager-only)
- Built role-based request filtering (contractors see only their assigned requests)
- Tested entire lifecycle end-to-end via curl: invalid transitions correctly blocked, valid path (Reported -> Triaged -> Scheduled -> Resolved -> Triaged) works correctly
