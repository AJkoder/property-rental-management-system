# Technical decisions

## 1. Flask + PostgreSQL + React instead of a full MERN stack

**Chose:** Flask, SQLAlchemy, PostgreSQL, and React.

**Rejected:** MongoDB as the primary persistence model.

**Why:** the core of this product is relational: one unit has payments and requests, users act on those records, and contractors join to requests many-to-many. PostgreSQL can enforce foreign keys and uniqueness where the data lives. I was also already comfortable with Flask, which reduced delivery risk within the time budget.

## 2. Soft archive instead of deleting units

**Chose:** an `is_archived` flag and restore action.

**Rejected:** hard deletion.

**Why:** a unit can have maintenance and payment history that remains meaningful after it leaves the active portfolio. Deleting the parent would either destroy that evidence or make every dependent relationship more awkward. Soft archiving meets the brief and keeps the default operational list clean.

## 3. Numeric money and payment snapshots

**Chose:** `Numeric(10,2)` for rent and payment amounts, plus `expected_amount` stored on a payment.

**Rejected:** floating-point database amounts and calculating old results from the current unit rent.

**Why:** binary floats are a poor representation for currency. More importantly, a unit's rent can change. The expected amount on an old payment should record what was due when it was logged, rather than silently changing when the current rent is edited.

## 4. Explicit status state machine

**Chose:** a small transition mapping in `status_rules.py`, with the scheduling-assignment rule separate.

**Rejected:** scattered route-level `if/else` conditions.

**Why:** the allowed path is a business policy someone should be able to read at a glance. "Has an assignee" is not an edge in the lifecycle; it is a prerequisite for one destination, so keeping it as a separate check makes both ideas clear. The API, rather than the UI, enforces it.

## 5. Server-side authorization and discovery

**Chose:** JWT role claims plus server-side manager guards and contractor request scoping; SQL-level filters/pagination.

**Rejected:** hiding buttons in React or loading every request and filtering client-side.

**Why:** neither UI visibility nor browser filtering protects data from a direct request. The query itself limits contractors to assigned work, while the frontend's role-aware navigation is simply a better user experience. Server-side request discovery also keeps response size bounded as data grows.

## 6. Append-only history by API design

**Chose:** write a history event in the same transaction as status, assignment, note, and attachment actions; expose no history mutation route.

**Rejected:** treating a request's current status as sufficient history, or adding database triggers immediately.

**Why:** records need to explain who did what and when. The single transaction keeps the primary action and its history coherent. Database triggers would add stronger defence in depth, but were disproportionate for the take-home once the API surface was already closed to mutation.

## 7. A decision I reversed: status history alone was incomplete

**Initial view:** logging creation and status changes covered the important audit trail.

**What changed:** a literal re-read of the brief made it clear that assignment changes and notes were required as well. Assignment events were added first; the final audit also added free-text notes and records attachment activity.

**Why this matters:** this was not cosmetic. An assignee change or a contractor's note explains the operational story just as much as a status change. I would rather correct an interpretation before submission than defend an incomplete one because the first version was already built.

## 8. Free-tier deployment with a manual alert trigger

**Chose:** Supabase for PostgreSQL, Render for the API, Vercel for the client, a health-check ping for Render, and a manager-triggered alert-generation route.

**Rejected:** adding a queue/scheduler such as Celery solely for this exercise.

**Why:** the selected services meet the free hosting constraint and keep each deployable component simple. A real system should generate alerts automatically; making it an explicit manager action was a deliberate scope trade-off, documented rather than obscured.

## 8. Free-tier deployment with a manual alert trigger

**Chose:** Supabase for PostgreSQL, Render for the API, Vercel for the client, a health-check ping for Render, and a manager-triggered alert-generation route.

**Rejected:** adding a queue/scheduler such as Celery solely for this exercise.

**Why:** the selected services meet the free hosting constraint and keep each deployable component simple. A real system should generate alerts automatically; making it an explicit manager action was a deliberate scope trade-off, documented rather than obscured.


## 9. Scoping units to the manager who owns them

**Chose:** a `manager_id` foreign key on `units`, filtered into every units route (create, list, get, update, archive, restore), not just the default list view.

**Rejected:** treating all managers as one shared portfolio, or scoping only the list endpoint and trusting the frontend not to request another manager's unit id directly.

**Why:** the brief writes as if there's a single management company, but nothing stops two different people from signing up as manager on the same deployed instance. Once that's possible, "manager can create and archive units" quietly implies "their own units," and a shared-portfolio model would let one manager see or edit another's tenants and rent by design, not by bug. I added the column once this became obvious while testing with two manager accounts, and had to go back and add the same `manager_id` check to `get_unit`, `update_unit`, `archive_unit`, and `restore_unit` individually — filtering only the list endpoint would have left the single-record routes exploitable by guessing or copying a unit id from the network tab.

**What I'd still tighten:** requests and payments aren't given their own `manager_id` column; they inherit scoping through their `unit_id` relationship instead. That's fine at this size but means every new query that touches requests or payments has to remember to join through units and filter there — a duplicated `manager_id` with proper indexing would make that harder to forget as the codebase grows.