# Key Technical Decisions

## Decision: Flask + PostgreSQL over MERN
Chose Flask + PostgreSQL + React over full MERN stack because the data model is heavily relational (units, maintenance requests, contractor assignments, payments, timeline — all foreign-key linked with a many-to-many assignment relationship). PostgreSQL handles this more naturally than MongoDB, which would require manually managing relationships. Also leveraged existing Flask experience for faster, more reliable delivery within the time budget.

## Decision: Transaction Pooler over Direct Connection (Supabase)
Chose Supabase's Transaction Pooler connection string over Direct Connection because it's designed for stateless/serverless-style hosting (like Render's free tier), which handles brief connections better than a persistent direct connection would on a constrained free tier.

## Decision: Numeric type for rent_amount, not Float
Used SQLAlchemy's Numeric(10,2) instead of Float for rent_amount. Floats use binary representation and can introduce rounding errors with decimal currency values (e.g. 19.999999999 instead of 20.00). Numeric stores exact decimal values, which matters for anything involving money.

## Decision: Soft-delete (archive) over hard-delete for Units
Units are never actually deleted from the database — archiving just sets is_archived=true. This preserves historical maintenance requests and rent payment records tied to that unit, which would otherwise be orphaned or lost. Matches Goal #2's requirement for archive/restore rather than deletion.

## Decision: Status lifecycle as explicit state machine (lookup table), not scattered if/else
Implemented ALLOWED_TRANSITIONS as a dictionary lookup (current status -> list of valid next statuses) in a dedicated status_rules.py file, rather than inline if/else chains in the route. This makes the business rules easy to read, test, and modify independently of the API layer. The "Resolved reopens to Triaged, not Reported" rule and the "Scheduled requires a contractor" rule are enforced as two separate, explicit checks.

## Decision: Contractors see only their assigned requests (query-level filtering)
Rather than filtering results after fetching everything, the contractor role filter is applied directly in the SQL query (join on Assignment, filter by contractor_id) before the request even leaves the database. Keeps this efficient and ensures contractors can never see other contractors' or unassigned requests, even via direct API calls.

## Decision: Immutability enforced by omission, not database triggers
Chose to make status_history immutable simply by never writing UPDATE or DELETE routes for it, rather than using database-level triggers or permissions to block writes. Simpler to reason about and sufficient for this application's needs, though a stricter production system might add a DB-level trigger as defense-in-depth.

## Decision: History write happens in the same transaction as the status change
Both the MaintenanceRequest.status update and the StatusHistory insert happen before a single db.session.commit() call. This guarantees they can never get out of sync — either both succeed or (on any error) neither does.

## Decision: Whitelisted sort fields, not raw column names from query params
sort_by only accepts a fixed list of column names (created_at, updated_at, priority, status) rather than passing the user's input directly into getattr() unchecked. Prevents sorting by unintended/sensitive columns and avoids any risk of arbitrary attribute access from user input.

## Decision: Filtering, sorting, and pagination all happen at the SQL query level
All list-endpoint filtering (status, priority, unit_id, search) and pagination (offset/limit) are applied as SQLAlchemy query modifiers before the query executes, not by fetching all rows and slicing in Python. This keeps memory usage and response size bounded regardless of how much data exists, and is what "server-side" pagination/filtering actually means as opposed to just hiding rows in the frontend.

## Decision: Snapshot expected_amount on the payment record, not a live reference
expected_amount is copied from the unit's current rent_amount at the moment a payment is recorded, rather than being calculated on-the-fly by joining to the unit each time. If rent changes later, old payment records still accurately reflect what was expected when they were recorded, instead of silently changing to match the new rent.

## Decision: Partial failure handling in bulk operations
A bad row in a bulk payment submission (missing fields, non-existent unit, invalid amount) is classified as "unmatched" with a reason, rather than failing the entire batch. This matters practically — a manager pasting 50 rows shouldn't lose all 50 because of one typo. Used db.session.flush() before building response data (not just relying on the ORM defaults) to make sure generated IDs and relationships are available immediately, since the eventual commit happens once at the end of the loop.

## Decision: Dashboard aggregation done in SQL (GROUP BY / COUNT), not Python loops
Counts and group-by breakdowns (requests by status, requests by priority) use SQLAlchemy's func.count() with group_by(), letting the database do the aggregation. This stays efficient regardless of how much data exists, versus fetching all rows and counting in Python.

## Decision: Dashboard is manager-only
Occupancy, financial, and portfolio-wide maintenance data isn't something a contractor needs or should see - they only need their own assigned requests. Enforced with the same role_required('manager') pattern used elsewhere.

## Decision: One alert row per (unit, month) via unique constraint
Rather than tracking dismissal as a mutable flag that persists indefinitely, each alert is scoped to a specific month. Dismissing an alert only affects that month's row. The next time /generate runs in a new month, it checks that month's payment status independently and creates a fresh alert if still unpaid - it never looks at whether a previous month's alert was dismissed. This makes the "dismiss now, reappear next month if still unpaid" requirement fall out naturally from the data model rather than needing special-case logic.

## Decision: Alert generation as a manual manager-triggered endpoint, not a background cron job
In a real production system, alert generation would run automatically on a schedule (e.g. daily cron job). Since this take-home has no background job infrastructure (and adding one, like Celery, would be disproportionate for the assignment's scope), it's exposed as a manager-triggered POST endpoint instead. Documented here as a known simplification, not an oversight.
