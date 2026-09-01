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

## Session 3 (cont.) — Immutable Audit Timeline
- Added StatusHistory model, insert-only by design
- Hooked automatic history logging into request creation and status update endpoints (same DB transaction)
- Added /timeline endpoint to view full history of a request
- Tested end-to-end: creation and status change both correctly logged with who/when/old/new

## Session 4 — Search, Filter, Sort, Pagination
- Extended requests list endpoint with: status/priority/unit_id filters, text search on description, whitelisted sort fields with asc/desc, page/per_page pagination (capped at 100/page)
- Response includes pagination metadata (page, per_page, total, total_pages)
- Tested all filter combinations, confirmed invalid sort_by is rejected cleanly (400, not a crash)

## Session 4 (cont.) — Bulk Rent Recording + CSV Export
- Added Payment model with amount_paid, expected_amount (snapshotted), month_covered, match_status
- Built bulk recording endpoint: classifies each entry as matched/underpaid/overpaid/unmatched, partial failures don't block the rest of the batch
- Built CSV export endpoint (streamed in-memory, no temp files)
- Bug hit + fixed: to_dict() was called before db.session.commit(), so generated IDs and relationships weren't populated yet. Fixed with db.session.flush() before building response.
- Tested bulk entry with a mix of all four outcomes, tested CSV export end-to-end

## Session 5 — Dashboard
- Built /api/dashboard/summary endpoint: unit occupancy, open/resolved maintenance counts, requests by status and priority, rent underpayment and missing-payment counts for current month
- Manager-only access, tested contractor correctly blocked (403)
- Verified counts against known test data
