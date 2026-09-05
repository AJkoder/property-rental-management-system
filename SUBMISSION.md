# Submission

## Links

- **GitHub repository:** https://github.com/AJkoder/property-rental-management-system
- **Live application:** https://property-rental-management-system-nine.vercel.app

## Notes for the reviewer

Everything here runs on free tiers. The backend (Render) sleeps after ~15 minutes of inactivity; an external cron pings its health endpoint every 10 minutes to keep it warm, so it's usually already awake — but if this is your very first visit after a longer idle stretch, the first request may still take up to a minute.

One thing worth knowing going in: I added **photo attachments on maintenance requests** as a stretch feature beyond the 10 required goals, and free-text notes on requests once a re-read of the brief flagged them as part of the timeline requirement, not optional.

## Demo credentials

| Role | Email | Password |
|---|---|---|
| Property Manager | manager@test.com | test123 |
| Maintenance Contractor | ramesh@test.com | test123 |

## Stack

| Layer | What I used | Why |
|---|---|---|
| Frontend | React (Vite), Tailwind CSS, React Router, Recharts, Axios | Fast to build consistent UI with, and I already had hands-on React experience to move quickly within the time budget |
| Backend | Flask, SQLAlchemy, Flask-JWT-Extended, Flask-Bcrypt, Alembic | The data model is heavily relational (units, requests, contractors, payments, many-to-many assignments); prior Flask experience let me focus time on the business logic rather than the framework |
| Database | PostgreSQL (Supabase) | Relational structure fits this domain naturally; Supabase gives a production-ready managed Postgres with no local setup |
| Hosting | Render (backend), Vercel (frontend), Supabase (database) | Free tier, matches the brief's suggested combination, each piece auto-redeploys independently on push |

## Goal checklist

| # | Goal | Status | Notes |
|---|---|---|---|
| 1 | Accounts and roles, server-enforced | Done | Role lives in the JWT; a `role_required()` decorator enforces it on every protected route. Verified a contractor token gets a 403 on manager-only routes even when called directly, not just hidden in the UI. |
| 2 | Units (create/edit, rent, archive/restore) | Done | Full CRUD with soft-delete (archive/restore preserves history). Rent uses a decimal type, not float, to avoid rounding errors. |
| 3 | Maintenance requests | Done | Either role can create and edit description/priority; only a manager can change the assigned-contractors list. |
| 4 | Status lifecycle with rules | Done | Reported → Triaged → Scheduled → Resolved via a lookup-table state machine. Can't schedule without an assigned contractor. Resolved reopens to Triaged, not Reported. Any other move is rejected with a message. |
| 5 | Assignment (many-to-many, manager-only) | Done | Separate join table between requests and contractors. Contractors have one endpoint returning every request assigned to them across all units. |
| 6 | Search, filters, sort, pagination (server-side) | Done | Search on description; filters for status, priority, unit, contractor; sort by date/priority/status; paginated with a total count — all applied at the SQL query level. |
| 7 | Bulk rent recording + CSV export | Done | Every row classified as matched/underpaid/overpaid/unmatched; a bad row doesn't fail the batch. CSV export streams the current rent roll. |
| 8 | Dashboard | Done | Open requests, resolved this week, rent collected this month, occupancy, breakdowns by status/priority/contractor, and a weekly resolved-requests chart. |
| 9 | Immutable timeline | Done | One append-only table logs creation, every status change, every assignment/removal, and notes. No update or delete route exists for it anywhere in the codebase. |
| 10 | Rent alerts (grace period, dismiss, reappear) | Done | One alert per unit per month via a unique constraint — dismissing only affects that month, so next month's check is fully independent and reappears naturally if still unpaid. |

## How much time did you actually spend?

Closer to 18 hours than the suggested 12. Roughly:

- **7–8 hours** on the backend — the status lifecycle and rent-matching logic had more real edge cases than they looked like on paper (installment payments, what happens to old records when rent changes, what a contractor can and can't touch)
- **4–5 hours** on the React frontend, most of it in the request detail view since it holds status changes, assignment, notes, photos, and the timeline together
- **The rest** on things that don't look like "features" but ate real time: deployment friction, a full re-read of the brief that caught genuine gaps I'd missed, a later security pass that found contractors could reach data they shouldn't have via direct API calls, and documentation written alongside the work rather than reconstructed at the end

I went slower than planned mostly because I kept testing "does this actually hold up" rather than moving on once something looked done — the security pass in particular meant going back through routes I'd already written and assumed were fine.

## What would you do next, with another 12 hours?

**To close remaining gaps:**
- Turn rent alert generation into a real scheduled job instead of a manager-triggered button — the one gap where the cost is a missed rent payment, not just inconvenience
- Expand the test suite beyond the one file it currently covers (login + rent-matching), specifically the status state machine and manager/contractor access boundaries
- Give requests and payments their own `manager_id` instead of inheriting scope through the unit relationship, so future queries can't accidentally forget to join through units first

**To make it something people would actually use, not just something that meets the brief:**
- Real payment collection built in (not just recording that rent arrived, but actually taking it)
- A shared calendar view for scheduled maintenance visits
- Basic in-app support/chat for tenants and contractors on smaller deployments
- More flexibility for how a management company is actually structured — shared contractor pools across managers, handing a unit off from one manager to another

That second list is the honest gap between "meets all ten goals" and "a product I'd point a real property management company at." I'd want to close that gap end to end if I kept going.

## What are you least happy with in this codebase, and why?

Most of the core logic I'd stand behind — the status lifecycle holds up under every edge case I tried, the timeline is genuinely append-only, and rent-matching handles real installment payments, not just a clean single-payment example. What I'm least happy with is less about a specific bug and more about a real manager living with this day to day:

- **Rent alerts need a human to click a button.** A manager who doesn't check in for a week could miss it entirely.
- **A contractor with many jobs has no way to prioritize at a glance** beyond a small tag on each row.
- **Two managers on the same instance can't share a contractor or hand off a unit** — scoping units to their creator was the right privacy call, but a real multi-manager company would hit this limitation within the first week.

None of these are broken, exactly — they're the honest distance between "meets the ten goals" and "something I'd hand to a real property manager and walk away from." Given more time, the alerts scheduler is what I'd fix first, since it's the only one where the gap costs actual money rather than just convenience.

---

One last note: whoever wrote the assignment brief and the `docs/` templates for this — thank you. They were unusually clear about exactly what was being evaluated and why, which made it much easier to actually build toward the right thing instead of guessing.
