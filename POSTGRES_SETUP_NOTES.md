# Local Postgres Setup Notes (Portfolio)

## What was fixed
- The local Postgres server is running on `localhost:5432`.
- `bike_reservation` is the active database.
- Missing tables `app_settings` and `audit_logs` were added by loading `db/schema.sql`.
- `db/schema.sql` is now idempotent (`IF NOT EXISTS` on tables and indexes), so re-running it is safe.

## Current state (verified)
- Pricing GET endpoint returns `{"fee_cents":1000}` from `http://localhost:3000/api/settings/pricing`.
- `app_settings` exists but is empty.

## Useful commands
```powershell
# Start Postgres (portable)
postgres_portable\bin\pg_ctl.exe -D postgres_data -l postgres_log.txt -o "-p 5432" start

# Check server status
postgres_portable\bin\pg_isready.exe -h localhost -p 5432

# List databases
postgres_portable\bin\psql.exe -U postgres -p 5432 -l

# List tables in bike_reservation
postgres_portable\bin\psql.exe -U postgres -p 5432 -d bike_reservation -c "\dt"

# Load/refresh schema (safe to re-run)
postgres_portable\bin\psql.exe -U postgres -p 5432 -d bike_reservation -f db\schema.sql
```

## Next steps (optional)
- Set `reservation_fee_cents` via the pricing PUT API (requires admin token).
