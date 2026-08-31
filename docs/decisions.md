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
