# Key Technical Decisions

## Decision: Flask + PostgreSQL over MERN
Chose Flask + PostgreSQL + React over full MERN stack because the data model is heavily relational (units, maintenance requests, contractor assignments, payments, timeline — all foreign-key linked with a many-to-many assignment relationship). PostgreSQL handles this more naturally than MongoDB, which would require manually managing relationships. Also leveraged existing Flask experience for faster, more reliable delivery within the time budget.

## Decision: Transaction Pooler over Direct Connection (Supabase)
Chose Supabase's Transaction Pooler connection string over Direct Connection because it's designed for stateless/serverless-style hosting (like Render's free tier), which handles brief connections better than a persistent direct connection would on a constrained free tier.
