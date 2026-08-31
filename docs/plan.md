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
