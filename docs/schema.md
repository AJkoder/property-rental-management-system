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
