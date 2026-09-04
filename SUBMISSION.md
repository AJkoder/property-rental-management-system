# Submission

Submitted Successfully.

## Links

- **GitHub repository:** https://github.com/AJkoder/property-rental-management-system
- **Live application:** https://property-rental-management-system-nine.vercel.app

## Notes for the reviewer

The backend is hosted on Render's free tier, which sleeps after ~15 minutes of inactivity. To mitigate this, an external cron service pings the health endpoint every 10 minutes, so the deployed app should generally already be warm. If it is your very first visit and the app has been idle beyond that, the first request may still take up to a minute to wake up — a slow first load is a hosting characteristic, not a broken deployment.

## Demo credentials

| Role | Email | Password |
|------|-------|----------|
| Property Manager | manager@test.com | test123 |
| Maintenance Contractor | ramesh@test.com | test123 |

## Stack

| Layer | What you used | Why |
|-------|---------------|-----|
| Frontend | React (Vite) + Tailwind CSS v4 + React Router + recharts + axios | Fast dev experience, utility-first styling for consistent spacing/colors without heavy custom CSS, and I already had hands-on experience with React from prior projects |
| Backend | Flask + SQLAlchemy + Flask-JWT-Extended + Flask-Bcrypt + Alembic | The data model is heavily relational (units, requests, contractors, payments, many-to-many assignments), and I have direct prior experience building Flask APIs with real business logic, which let me move faster within the time budget |
| Database | PostgreSQL, hosted on Supabase | Relational structure fits this domain naturally; Supabase gives a free, production-ready managed Postgres instance with no local setup needed |
| Hosting | Render (backend), Vercel (frontend), Supabase (database) | All free-tier, matches the suggested combination in the brief, and each piece deploys independently and auto-redeploys on push |

## Goal checklist

Mark each honestly. Partial is fine — say what is partial.

| # | Goal | Status | Notes |
|---|------|--------|-------|
| 1 | Accounts and roles, server-enforced | Done | JWT carries the role as a claim; a `role_required()` decorator enforces permissions on every protected route server-side. Verified a contractor token is rejected (403) on manager-only routes even when called directly, not just hidden in the UI. |
| 2 | Units (create/edit, rent + grace period, archive/restore) | Done | Units CRUD complete with archive/restore (soft delete, preserves history). Rent amount uses a decimal type, not float, to avoid rounding errors. |
| 3 | Maintenance requests (description, priority, assignees, either role can edit description/priority) | Done | Requests belong to a unit, either role can create and edit description/priority, but only a manager can change the assigned-contractors list. |
| 4 | Status lifecycle with rules | Done | Reported → Triaged → Scheduled → Resolved enforced via a lookup-table state machine. Scheduling without an assigned contractor is rejected server-side. Resolved reopens to Triaged, not Reported, matching the spec exactly. Any other transition is rejected with a message. |
| 5 | Assignment (many-to-many, manager-only) | Done | Separate join table between requests and contractors. Only a manager can add/remove assignments. Contractors have a single endpoint returning every request assigned to them across all units. |
| 6 | Finding requests (search, filters, sort, pagination, server-side) | Done | Search on description, filters for status, priority, unit, and contractor, sortable by created date/priority/status, paginated with a total count — all applied at the SQL query level, not fetched-then-filtered client-side. |
| 7 | Bulk rent recording + CSV export | Done | Bulk endpoint classifies every row as matched/underpaid/overpaid/unmatched and returns a full per-row report; a bad row doesn't fail the batch. CSV export streams the current rent roll (unit, tenant, rent, payment status) as a downloadable file. |
| 8 | Dashboard | Done | Headline stats (open requests, resolved this week, rent collected this month, unit occupancy), breakdown by status, by priority, and by contractor, plus a chart of requests resolved per week over the last 8 weeks. |
| 9 | Immutable timeline | Done | A single append-only `status_history` table logs creation, every status change (old/new value and who), and every contractor assignment/removal. No update or delete route exists for this table anywhere in the codebase — immutability is enforced by the absence of any mutating endpoint, not a database trigger. |
| 10 | Rent alerts (grace period, dismiss, reappear) | Done | Alerts are scoped one-per-unit-per-month via a unique constraint, which is what makes "dismiss now, reappear next month if still unmatched" work naturally — dismissing only affects that month's row, and the next month's alert is generated independently. Alert generation is a manager-triggered endpoint rather than an automatic cron job, documented as a known simplification in decisions.md. |

## How much time did you actually spend?

Roughly 14-15 hours across the week, a little over the 12-hour guide. Backend (auth, all core CRUD, the status state machine, bulk rent logic, dashboard aggregation, and alerts) took the largest share — probably around 7-8 hours, most of it in the status lifecycle and rent-matching/alert logic since those had the most exact rules to get right. The React frontend took roughly 4-5 hours across all six pages. The remainder went to deployment, fixing a few gaps found on a final re-read against the exact brief wording (contractor filter, editable description/priority, timeline coverage of assignment events, and the dashboard's missing rent-collected/by-contractor/weekly-chart fields), and documentation.

## What would you do next, with another 12 hours?

- Automate rent alert generation with a real scheduled job (e.g. a daily cron worker) instead of the current manager-triggered endpoint, which is a pragmatic but not fully production-realistic simplification.
- Add a notes/comments feature on maintenance requests, since the timeline currently covers status changes and assignments but not free-text notes, which the brief's history requirement also mentions.
- Write an automated test suite (unit tests for the status state machine and bulk-payment classification logic, integration tests for the auth/role boundaries) — everything was tested manually via curl and the browser during development, which was fast for a solo 12-hour build but isn't something I'd want to rely on long-term.
- Polish the frontend further: a proper skeleton-loading state instead of plain "Loading..." text, more thorough mobile responsiveness, and toast notifications instead of inline error banners.
- Add pagination to the Units list and Payments history table, which currently just load everything (fine at this data scale, but would need it at real volume, similar to what I already did for the requests list).

## What are you least happy with in this codebase, and why?

The rent alert generation being a manually-triggered POST endpoint rather than an automatic background job. It works correctly and I documented the trade-off honestly in `decisions.md`, but it's the one piece where I made a scope call under time pressure rather than building the more realistic version — a real property manager wouldn't want to remember to click "check for alerts" every day. Adding a proper scheduler (Celery, or even a simple external cron hitting a `/generate` endpoint the way I already do for the Render keep-alive) would be the first thing I'd fix.
