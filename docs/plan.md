# Build plan and delivery record

## Planning approach

The brief suggested about 12 hours over a week. I used that as a scope constraint rather than a race: my aim was to complete the ten required behaviours reliably before adding a stretch feature. I did not keep an hour-by-hour timesheet or write individual estimates at the start of each session, so I do not want to invent precision after the fact. My best retrospective estimate is closer to 17-18 hours across the week: 7-8 on backend/data work, 4-5 on the React experience, and the rest split across deployment, a literal re-read of the brief that caught real gaps, a later security pass, and documentation written alongside the work rather than reconstructed at the end.

## Session 1 — foundation

**Plan:** establish a deployable Flask/PostgreSQL base before building features.

**Delivered:** created the Flask app factory, shared extensions, Alembic setup, and environment-based configuration; created a Supabase PostgreSQL project and verified the connection; set up Git/GitHub and ignored local secrets.

**Why first:** every required feature relies on durable relational data. Validating the connection and migration flow early was cheaper than discovering a hosting/database problem after the UI existed.

## Session 2 — identity and units

**Plan:** establish roles and the core entity that every payment and request references.

**Delivered:** bcrypt password hashing, JWT signup/login, server-side role decorator, and manager-only unit CRUD with archive/restore. Manual API checks included proving a contractor token was rejected on manager-only endpoints.

**Why this order:** units are the centre of the domain model, while roles determine the boundaries for every later route.

## Session 3 — maintenance workflow and history

**Plan:** implement the most rule-heavy part before spending time on presentation.

**Delivered:** maintenance requests, the many-to-many contractor assignment table, a status state machine, the scheduled-assignee guard, reopen-to-Triaged behaviour, and an append-only history table.

**What took longer:** lifecycle behaviour has more edge cases than CRUD. I tested the complete path — Reported → Triaged → Scheduled → Resolved → Triaged — and invalid moves rather than trusting the happy path.

## Session 4 — portfolio operations

**Plan:** add the remaining backend behaviours while the data model was still fresh.

**Delivered:** SQL-side request search/filter/sort/pagination, bulk rent recording with per-row results, rent-roll CSV export, dashboard aggregates, and monthly rent alerts. A flush-before-response issue in the bulk-payment flow was found during API testing and corrected so newly created IDs/relationships were available in the result.

**Why this order:** these features are independent enough to build after the core request/unit relationships, and their APIs gave the frontend stable targets.

## Session 5 — React interface

**Plan:** build a usable end-to-end path for each role, not isolated API demonstrations.

**Delivered:** Vite/React foundation, persistent auth context, role-aware navigation, then Units, Requests, Payments, Dashboard, and Alerts pages. The request detail view combined assignment, status actions, photos, notes, and history; the payment page supports a batch result and CSV download.

**What I prioritised:** clear operational screens and direct feedback over a broad component library. The UI mirrors likely next status moves, but the server remains the rule enforcer.

## Session 6 — deployment, literal review, and polish

**Plan:** prove the hosted application works, then compare it directly with the brief rather than with my own condensed checklist.

**Delivered:** Render/Gunicorn backend, Vercel frontend, Supabase configuration, production secrets, health endpoint, and a cold-start mitigation ping. The literal review identified missing editable request fields, contractor filter coverage, and dashboard measures — all addressed rather than being hidden in the submission narrative. Two further gaps against the literal spec (assignment timeline events and the free-text note requirement) surfaced slightly later and were closed in session 7 alongside the security work.

## Session 7 — security audit and multi-manager scoping

**Plan:** before calling this finished, go through every route again specifically looking for the gap between "hidden in the UI" and "enforced by the server," since that's the exact distinction goal 1 calls out by name.

**Delivered:** found and fixed four real access-control gaps that earlier manual testing had missed. Contractors could reach a maintenance request's details, edits, status changes, and timeline directly by ID even when not assigned to it — only the list view had ever been correctly scoped, and every other route on the same resource had been left open. Units and payments had the same class of problem one level up: their list and detail endpoints checked that someone was logged in but never that they were a manager, so a contractor's own valid token could pull rent amounts and tenant names straight from the API. The assignment-lookup endpoint had no authentication check of any kind. Alongside these, I fixed a smaller correctness bug where the dashboard's "overdue" count ignored the grace period that Alerts correctly respects, rewrote the rent-roll CSV export so unpaid units actually appear in it instead of being silently absent, and removed a `Triaged → Reported` backward transition that was never part of the specified lifecycle.

**What this surfaced along the way:** fixing the units bug properly meant asking a question the brief never directly poses — if two different people both sign up as a property manager on the same deployed app, should they see each other's buildings? The honest answer is no, so I added a `manager_id` column to units and scoped every single unit route to the logged-in manager's own id, not just the list endpoint. Requests and payments inherit that scoping through their unit relationship rather than getting their own manager_id column, which is a smaller, more localised choice I'd revisit if the app kept growing.

**Also added this session:** free-text notes on a maintenance request (closing a literal requirement of goal 9 that the timeline had missed), and a guard preventing the last contractor from being removed from a request that's currently Scheduled, since that would leave the request in a state its own status claims is impossible.

**Why this mattered more than it might look:** none of these were exotic bugs. Every one of them was "the same permission check I wrote correctly on one route, but didn't repeat on the neighbouring route for the same resource." That's a process lesson as much as a code one — the fix going forward isn't just patching these instances, it's writing the check once as a shared helper so a new route can't be added without it.

## Scope choices and cuts

The ten required goals were the line of completion. Photo attachments were added after that as the selected stretch feature, later joined by free-text notes once the literal-brief review flagged them as part of goal 9 rather than optional. I deliberately did not build a tenant portal, payment-provider integration, lease workflow, owner/portfolio separation beyond manager-level unit scoping, utility billing, late fees, or preventive-maintenance scheduling.

The main ongoing cut is the size of the automated test suite. There's a real one now (`backend/tests/test_payments.py`), covering login and the installment rent-classification logic — it exists specifically because that's where a genuine bug was found during manual testing, not as a symbolic gesture. It does not yet cover the status state machine's illegal transitions, the contractor-assignment boundary checks, or the manager-scoping added in session 7, which is exactly where I'd extend it next.