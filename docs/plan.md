# Build plan and delivery record

## Planning approach

The brief suggested about 12 hours over a week. I used that as a scope constraint rather than a race: my aim was to complete the ten required behaviours reliably before adding a stretch feature. I did not keep an hour-by-hour timesheet or write individual estimates at the start of each session, so I do not want to invent precision after the fact. My best retrospective estimate is 14–15 hours: 7–8 on backend/data work, 4–5 on the React experience, and the rest on deployment, verification, documentation, and final fixes.

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

**What took longer:** lifecycle behaviour has more edge cases than CRUD. I tested the complete path—Reported → Triaged → Scheduled → Resolved → Triaged—and invalid moves rather than trusting the happy path.

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

**Delivered:** Render/Gunicorn backend, Vercel frontend, Supabase configuration, production secrets, health endpoint, and a cold-start mitigation ping. The literal review identified missing editable request fields, contractor filter coverage, assignment timeline events, dashboard measures, and later the free-text note requirement. Those were addressed rather than being hidden in the submission narrative.

## Scope choices and cuts

The ten required goals were the line of completion. Photo attachments were added only after that as the selected stretch feature. I deliberately did not build a tenant portal, payment-provider integration, lease workflow, owner/portfolio separation, utility billing, late fees, or preventive-maintenance scheduling.

The main cut was automated testing. I manually exercised endpoints and browser flows during the take-home because it was the best fit for the time available, but this is not the long-term choice I would defend. The first follow-up would be integration tests around role boundaries, request transitions, rent classifications, alert reappearance, and the request-scoped attachment controls.
