# Database schema

## Modelling approach

The data has several real relationships: a payment belongs to one unit, a request belongs to one unit, people create and act on requests, and requests can have more than one contractor. PostgreSQL is a better fit than an embedded-document model here because the relationships, history, and uniqueness rules are central to the product rather than incidental.

All IDs are UUIDs stored as `String(36)`. Timestamps are set by the application in UTC. UUIDs avoid exposing a simple sequence of records in API URLs; they are not a substitute for authorization checks.

## Tables

### `users`

| Column | Type | Notes |
|---|---|---|
| `id` | `String(36)` | Primary key UUID |
| `name` | `String(120)` | Required display name |
| `email` | `String(120)` | Required, unique, indexed login identifier |
| `password_hash` | `String(255)` | bcrypt hash; plaintext is never stored |
| `role` | `String(20)` | `manager` or `contractor` |
| `created_at` | `DateTime` | UTC creation time |

### `units`

| Column | Type | Notes |
|---|---|---|
| `id` | `String(36)` | Primary key UUID |
| `unit_number` | `String(50)` | Required label shown to managers |
| `address` | `String(255)` | Required address |
| `rent_amount` | `Numeric(10,2)` | Exact monthly rent, not a floating-point database column |
| `tenant_name` | `String(120)` | Nullable because a unit may be vacant |
| `is_archived` | `Boolean` | Soft-delete flag; defaults false |
| `created_at`, `updated_at` | `DateTime` | UTC audit timestamps |

### `maintenance_requests`

| Column | Type | Notes |
|---|---|---|
| `id` | `String(36)` | Primary key UUID |
| `unit_id` | `String(36)` FK | Required reference to `units.id` |
| `description` | `Text` | Required issue description |
| `priority` | `String(20)` | Low, Medium, High, or Urgent |
| `status` | `String(20)` | Reported, Triaged, Scheduled, or Resolved |
| `created_by` | `String(36)` FK | Required reference to `users.id` |
| `created_at`, `updated_at` | `DateTime` | UTC timestamps |

### `assignments`

| Column | Type | Notes |
|---|---|---|
| `id` | `String(36)` | Primary key UUID |
| `request_id` | `String(36)` FK | Reference to `maintenance_requests.id` |
| `contractor_id` | `String(36)` FK | Reference to `users.id` |
| `assigned_at` | `DateTime` | UTC assignment time |

The unique constraint on (`request_id`, `contractor_id`) prevents assigning the same contractor twice. This is the join table that implements the many-to-many relationship: a request may have several contractors and a contractor may work on several requests.

### `status_history`

| Column | Type | Notes |
|---|---|---|
| `id` | `String(36)` | Primary key UUID |
| `request_id` | `String(36)` FK | Request the event belongs to |
| `event_type` | `String(20)` | Status, assignment, note, or attachment event type |
| `old_status`, `new_status` | `String(20)` | Nullable for non-status events; creation has no old status |
| `detail` | `String(255)` | Human-readable assignment/attachment description or a note |
| `changed_by` | `String(36)` FK | User who caused the event |
| `changed_at` | `DateTime` | UTC event time |

This table has no API update/delete route. It is append-only by application design; a database trigger would be a worthwhile defence-in-depth addition for a regulated production system.

### `payments`

| Column | Type | Notes |
|---|---|---|
| `id` | `String(36)` | Primary key UUID |
| `unit_id` | `String(36)` FK | Paying unit |
| `amount_paid` | `Numeric(10,2)` | Received amount |
| `expected_amount` | `Numeric(10,2)` | Rent snapshot at recording time |
| `month_covered` | `String(7)` | `YYYY-MM` rent month |
| `match_status` | `String(20)` | matched, underpaid, or overpaid |
| `recorded_by` | `String(36)` FK | Manager who recorded it |
| `recorded_at` | `DateTime` | UTC timestamp |

### `alerts`

| Column | Type | Notes |
|---|---|---|
| `id` | `String(36)` | Primary key UUID |
| `unit_id` | `String(36)` FK | Related unit |
| `month_covered` | `String(7)` | Month this alert concerns |
| `reason` | `String(50)` | `no_payment` or `underpaid` |
| `is_dismissed` | `Boolean` | Defaults false |
| `dismissed_at` | `DateTime` | Nullable timestamp |
| `dismissed_by` | `String(36)` FK | Nullable manager reference |
| `created_at` | `DateTime` | UTC timestamp |

The unique (`unit_id`, `month_covered`) constraint allows a dismissal to affect only one month. A still-unpaid unit naturally gets a new alert when the following month's alert is generated.

### `attachments`

| Column | Type | Notes |
|---|---|---|
| `id` | `String(36)` | Primary key UUID |
| `request_id` | `String(36)` FK | Related maintenance request |
| `file_name` | `String(255)` | Original upload name |
| `content_type` | `String(100)` | Restricted to supported image MIME types |
| `file_data` | `Text` | Base64 image data, kept small for the demo |
| `uploaded_by` | `String(36)` FK | User who uploaded it |
| `uploaded_at` | `DateTime` | UTC timestamp |

## Database constraints versus application rules

PostgreSQL enforces primary/foreign keys, unique user email, unique request-contractor pairs, and one alert per unit/month. Those are facts that should remain true even if another API process or script reaches the database.

Application code enforces role permissions, valid priority/status values, request transitions, the “assigned before scheduled” rule, maximum attachment size/type, and contractor visibility. These rules depend on the current caller or on business state across rows, so they fit the API layer. The scheduled-request guard also prevents removing the final contractor while a request is Scheduled.

## Intentional denormalisation and scale limits

`expected_amount` is copied onto each payment rather than calculated from a live unit join. That preserves what was expected at the time, even if rent changes later. `match_status` is stored so bulk results and rent-roll queries are straightforward. `status_history.detail` keeps a readable event description without reconstructing it from a current user/assignment state.

At 100× the data, unpaginated unit/payment/alert lists, attachment storage in Postgres, and dashboard aggregate reads would be the first pressure points. I would add indexes for request and payment filters, paginate the other lists, move photos to object storage, and use indexed or cached reporting aggregates.
