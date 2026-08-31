# AI Usage Log

Used Claude (Anthropic) throughout this project for architecture guidance, business logic design, and code generation for complex/business-critical pieces. All generated code was reviewed and understood before committing. Used for:

- Deciding Flask + PostgreSQL vs MERN stack, and reasoning behind it
- Designing app factory pattern and project structure
- Designing User model schema (UUID primary key, indexed email, role field)
- Setting up Alembic migrations workflow
- Debugging DATABASE_URL connection string parsing issue (password containing '@' needed URL-encoding to %40)

Log will be updated incrementally as more features are built.
