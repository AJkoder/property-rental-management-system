# AI Usage Log

Used Claude (Anthropic, via claude.ai chat) throughout this project as the primary development partner — architecture decisions, business logic design, code generation, debugging, and documentation drafting. Every piece of generated code was reviewed, tested manually, and understood before committing; nothing was merged without being able to explain what it does and why.

Also used Codex conversationally at a couple of points to compare approaches (see note near the bottom), though the actual committed code in this repository is Claude-generated/reviewed.

## Session 1 — Setup
- Asked for a recommendation between Flask+PostgreSQL and a MERN stack, given the relational nature of the data (units, requests, contractors, payments, many-to-many assignments) and my existing experience with Flask from prior projects. Used the reasoning to settle on Flask + PostgreSQL + React.
- Asked for the Flask app factory pattern setup (config, extensions, blueprints structure) rather than a single flat app.py.
- Asked how to fix a Supabase connection string failing to parse — the issue was a `@` character inside the database password conflicting with the URL's own separator character. Fixed by URL-encoding it as `%40`.

## Sessions 2-3 — Auth, Units, Maintenance Requests, Status Lifecycle
- Asked for password hashing setup with bcrypt and a JWT-based auth flow, with role information embedded in the token claims to avoid a database lookup on every permission check.
- Asked for a reusable role-based access control decorator (`role_required`) rather than repeating permission checks inline in every route.
- Asked for the maintenance request status lifecycle to be modelled as an explicit lookup table (current status -> allowed next statuses) rather than if/else chains, specifically so the business rules stay easy to read and change independently of the route code.
- Asked for the "cannot schedule without an assigned contractor" rule and the "resolved reopens to triaged, not reported" rule to be implemented as two separate, explicit checks rather than folded into the transition table, since they're conceptually different kinds of rules (data completeness vs. status ordering).
- Asked for the audit timeline (status_history) to be insert-only by design — no update/delete route written for it at all, rather than relying on a database-level trigger.

## Session 4 — Search/Filter/Pagination, Bulk Rent
- Asked for server-side filtering/sorting/pagination on the requests list, with an explicit callout to whitelist which columns can be sorted by, rather than passing the raw query parameter into `getattr()` unchecked — this was a deliberate security ask on my part after remembering it as a common mistake.
- Asked for the bulk rent recording endpoint to handle partial failures gracefully (a bad row shouldn't fail the whole batch) rather than an all-or-nothing transaction.
- **Something that went wrong and got corrected:** the first version of the bulk payment endpoint called `.to_dict()` on newly created Payment objects before `db.session.commit()`, so the generated IDs and the `unit` relationship were still None in the response (visible as `"id": null, "unit_number": null` in testing). Asked Claude to fix it — the fix was adding `db.session.flush()` before building the response objects, so IDs and relationships are populated within the same transaction before commit. This was caught by testing the actual API response, not by code review alone.

## Session 5 — Dashboard, Rent Alerts
- Asked for dashboard aggregations to use SQL-level `GROUP BY`/`COUNT` rather than fetching all rows and counting in Python.
- Asked specifically how to model rent alerts so that dismissing an alert doesn't permanently silence a unit, but a fresh alert appears if the unit is still unpaid the following month. The suggested and implemented solution was a unique constraint on (unit_id, month_covered), which makes the "reappear next month" behavior fall out of the data model itself rather than needing special-case reappear logic.

## Session 6 — React Frontend
- Asked for a design direction that avoids a generic "AI-template" look — explicitly requested a neutral/restrained color palette, no decorative emoji or stickers in the actual UI, and a consistent spacing/typography system, closer to a real SaaS product (Linear/Notion-style) than a default component-library demo.
- Asked for the CSV export to be implemented as an authenticated blob download through the existing axios client (so the JWT stays in the request header) rather than a raw link with the token embedded in the URL query string, which would have been a real (if minor) security smell.
- **Something that went wrong and got corrected:** repeated terminal heredoc pastes (`cat > file << EOF ... EOF`) were getting silently truncated mid-paste in Git Bash on Windows, producing broken files multiple times (missing imports, cut-off JSX). Diagnosed by checking file line counts and content directly rather than trusting that a paste "probably worked." Switched to creating/editing longer files directly in VS Code instead of the terminal for anything beyond a few lines.
- **Something that went wrong and got corrected:** at one point a file (`Layout.jsx`) got created at the project root instead of inside `frontend/src/components/`, because a `cd` command was run from the wrong working directory. Caught via `git status` showing an unexpected file location before committing, and fixed with a proper move rather than deleting and recreating (git correctly tracked it as a rename).

## Session 7 — Deployment, final gap review
- Asked for the production WSGI setup (gunicorn + Procfile) for Render, since Flask's built-in dev server explicitly isn't meant for production use.
- After deployment, asked Claude to re-read the original assignment brief's exact wording (not my own summary of it) and compare it line-by-line against what was actually built. This surfaced four real gaps that a paraphrased understanding of the goals had missed:
  - Maintenance requests had no way to edit description/priority after creation (goal 3 explicitly allows either role to edit these).
  - The requests search endpoint was missing a contractor filter (goal 6 lists unit, status, contractor, and priority as required filters; contractor had been missed).
  - The audit timeline only logged status changes, not contractor assignment/removal events (goal 9 requires both).
  - The dashboard was missing total rent collected this month, a by-contractor breakdown, and the 8-week resolved-per-week chart (goal 8 requires all three; only some had been built).
  All four were fixed, tested, and committed. This re-read-against-the-literal-brief step was deliberately requested specifically because early-session paraphrased understanding of a long spec is exactly where real gaps hide.
- One migration failure while fixing the timeline gap: adding a new `NOT NULL` column (`event_type`) to a table that already had existing rows failed with a `NotNullViolation`, since the existing rows had no value for the new column. Asked for the correct fix, which is the standard safe pattern: add the column as nullable, backfill existing rows with a default value via an `UPDATE`, then alter the column to `NOT NULL` once every row has a value.

## Final review — Codex
- Asked Codex to read the assignment brief, inspect the complete Git history and current repository, improve the documentation, and audit the application for bugs before any commit. The review found that the timeline did not yet support free-text notes (a literal requirement of Goal 9), and that contractors could access attachment or assignment details outside their assigned requests through direct API calls.
- Asked for narrowly scoped fixes only. The result was a note endpoint and UI, contractor-scoped assignment/attachment access checks, and a guard against leaving a Scheduled request with no contractors. The request-list contractor filter was also rewritten to use relationship `EXISTS` checks rather than joins, avoiding duplicate-row risks as filters combine.
- The review also rewrote the README and required documentation to answer the brief directly and removed an outdated claim that notes were still missing. These changes are intentionally left uncommitted for review before any commit is created.

## Note on Codex
The original implementation was developed with Claude as the primary partner. Codex was used for this final review and the narrowly scoped fixes documented above. As throughout the project, generated output was checked against the source and assignment rather than accepted blindly.

## Summary
AI was used for essentially the whole build, as permitted and encouraged by the brief. What was not delegated: the actual "did this pass" judgment calls (running the app, testing edge cases with curl and the browser, checking database state, deciding whether generated code was actually correct before committing) — direction and verification were mine throughout, and I can walk through any file in this repository and explain what it does and why it's written that way.
