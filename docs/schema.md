# Database Schema

## users
| Column | Type | Notes |
|---|---|---|
| id | String(36) UUID | Primary key. UUID chosen over auto-increment int to avoid exposing sequential/guessable IDs in a public-facing API. |
| name | String(120) | Required |
| email | String(120) | Unique, indexed — used for login lookups |
| password_hash | String(255) | Never stores plain password; hashed with bcrypt at signup |
| role | String(20) | 'manager' or 'contractor' — drives all permission checks server-side |
| created_at | DateTime (UTC) | Set automatically on creation |

More tables (units, maintenance_requests, assignments, payments, status_history, alerts) will be added here as they're built in upcoming sessions.

## units
| Column | Type | Notes |
|---|---|---|
| id | String(36) UUID | Primary key |
| unit_number | String(50) | Required |
| address | String(255) | Required |
| rent_amount | Numeric(10,2) | Required. Uses Numeric not Float to avoid floating-point rounding errors with currency. |
| tenant_name | String(120) | Nullable — unit may be vacant |
| is_archived | Boolean | Soft-delete flag. Units are never hard-deleted (preserves historical maintenance/payment records). Default false. |
| created_at | DateTime (UTC) | Auto-set on creation |
| updated_at | DateTime (UTC) | Auto-updates on every change |
