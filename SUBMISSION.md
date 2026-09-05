# Submission

Project completed Successfully.

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
| 9 | Immutable timeline | Done | A single append-only `status_history` table logs creation, every status change (old/new value and who), contractor assignment/removal, notes, and attachment activity. No update or delete route exists for this table anywhere in the codebase — immutability is enforced by the absence of any mutating endpoint, not a database trigger. |
| 10 | Rent alerts (grace period, dismiss, reappear) | Done | Alerts are scoped one-per-unit-per-month via a unique constraint, which is what makes "dismiss now, reappear next month if still unmatched" work naturally — dismissing only affects that month's row, and the next month's alert is generated independently. Alert generation is a manager-triggered endpoint rather than an automatic cron job, documented as a known simplification in decisions.md. |

## How much time did you actually spend?

Closer to 18 hours than the suggested 12, spread unevenly rather than in clean 2-hour blocks. Backend and data modelling took the biggest single share — somewhere around 7-8 hours — mostly because the status lifecycle and rent-matching logic had more edge cases than they looked like on paper (what happens to an old payment when rent changes mid-month, what a partial/installment payment should do to a month's classification, what a contractor is and isn't allowed to touch on a request they're not assigned to). The React frontend was another 4-5 hours across the six pages plus the request detail view, which ended up being the most complex single component since it holds status changes, assignment, notes, photos, and the timeline together.

The rest went to things that don't show up as "features" but took real time: deployment and its usual friction (Render/Vercel env vars, a Postgres connection string that needed URL-encoding, a couple of failed migrations from adding NOT NULL columns to tables that already had rows), a full re-read of the brief against what was actually built which caught real gaps (missing contractor filter, an unedittable description field, an incomplete timeline, a dashboard missing three of its required numbers), and a later security pass that found contractors could reach requests, units, and rent data they shouldn't have been able to via direct API calls rather than through the UI. That last round alone was probably 2 hours by itself, since fixing it properly meant checking every route again rather than patching the one place it was first noticed. Documentation — writing this file and the five under docs/ properly rather than as an afterthought — was another 2 hours or so, done in parallel with development rather than all at the end, which is the only reason the decisions and plan below are specific rather than reconstructed from memory.

## What would you do next, with another 12 hours?

- Turn rent alert generation into an actual scheduled job instead of a manager-triggered button. I know why I made it manual (no background worker in scope for a free-tier take-home) and I'd still make the same call under the same time pressure, but of everything left undone, this is the one where the gap costs something real — a missed rent payment nobody noticed — rather than just inconvenience.
- Expand the automated test suite. There's a real one now (`backend/tests/test_payments.py`) covering login and the installment-classification logic, which came directly out of finding a bug in that exact area — but it only covers one file. I'd add tests for the status state machine's illegal transitions, the contractor-assignment boundary checks, and the manager-scoping on units, since those are the three places a regression would be both easy to introduce and hard to notice by eye.
- Give requests and payments their own `manager_id` rather than inheriting scope through the unit relationship. It works today, but every future query against those tables has to remember to join through units first, and that's exactly the kind of thing that's fine until someone forgets it once.
- Pagination on the Units list and payment history table, which load everything at once right now. Fine at demo scale, not fine at a few hundred units.
- Frontend polish that I kept deferring in favour of functionality: real skeleton loaders instead of a plain "Loading..." string, toast notifications instead of inline banners, and a proper pass at mobile widths below where the sidebar currently just disappears.

## What are you least happy with in this codebase, and why?

Most of the core logic I'd stand behind — the status lifecycle holds up under every edge case I tried, the timeline is genuinely append-only, and the rent-matching handles the messier real case of installment payments, not just a clean single-payment example. What I'm least happy with is more about a real manager actually living with this day to day, rather than any one bug.

**Rent alerts still need a human to click a button.** A property manager checking in once a week would eventually miss a month where nobody happened to open the Alerts page. The right version watches the calendar itself and doesn't depend on someone remembering to ask. I left it manual because a scheduled background job needs infrastructure this free-tier setup doesn't have, and I'd rather ship it honestly manual than fake a "daily" job that's actually triggered by whoever last logged in.

**A contractor with a lot of active jobs has no way to prioritize at a glance.** Their one screen lists every assigned request, but there's no "these three are Urgent" surfacing beyond a small tag on each row — fine for the two or three requests in the demo data, less fine for someone juggling fifteen real ones across a week.

**Two managers using the same instance can't share a contractor pool or hand off a unit.** Scoping units to the manager who created them was the right call for privacy, but it also means there's no way today to say "this contractor works for both of us" or transfer a building from one manager to another without going into the database directly. A real company with more than one manager would hit that within the first week.

None of these are things I'd call broken — they're the honest gap between "meets the ten goals" and "something I'd hand to an actual property manager and walk away from." Given more time, the alerts scheduler is the one I'd fix first, since it's the only one where the cost of the gap is a missed rent payment rather than an inconvenience.