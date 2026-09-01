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

## maintenance_requests
| Column | Type | Notes |
|---|---|---|
| id | String(36) UUID | Primary key |
| unit_id | String(36) FK -> units.id | Which unit this request belongs to |
| description | Text | Required |
| priority | String(20) | Low / Medium / High / Urgent |
| status | String(20) | Reported / Triaged / Scheduled / Resolved. Default 'Reported' |
| created_by | String(36) FK -> users.id | Who reported it |
| created_at / updated_at | DateTime (UTC) | Auto-managed |

## assignments
| Column | Type | Notes |
|---|---|---|
| id | String(36) UUID | Primary key |
| request_id | String(36) FK -> maintenance_requests.id | |
| contractor_id | String(36) FK -> users.id | |
| assigned_at | DateTime (UTC) | |
| Unique constraint | (request_id, contractor_id) | Prevents duplicate assignment of same contractor to same request |

Many-to-many relationship: one request can have multiple contractors, one contractor can be on multiple requests.

## status_history
| Column | Type | Notes |
|---|---|---|
| id | String(36) UUID | Primary key |
| request_id | String(36) FK -> maintenance_requests.id | |
| old_status | String(20) | Nullable — null on the very first entry (creation) |
| new_status | String(20) | Required |
| changed_by | String(36) FK -> users.id | Who made the change |
| changed_at | DateTime (UTC) | |

Insert-only table — no update or delete routes exist for this table anywhere in the API, by design. This is what makes the audit trail immutable: it's not a database-level lock, it's a deliberate absence of any mutating endpoint.
