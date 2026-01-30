-- Migration: add maintenance_logs and bike status

BEGIN;

ALTER TABLE bikes
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available',
  ADD COLUMN IF NOT EXISTS last_maintenance_at timestamptz NULL;

CREATE TABLE IF NOT EXISTS maintenance_logs (
  id SERIAL PRIMARY KEY,
  bike_id INTEGER NOT NULL REFERENCES bikes(id) ON DELETE CASCADE,
  mechanic_id INTEGER NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  type TEXT NOT NULL DEFAULT 'inspection',
  status_after TEXT NULL,
  notes TEXT NULL,
  duration_minutes INTEGER NULL,
  parts jsonb NULL,
  attachments jsonb NULL
);

CREATE INDEX IF NOT EXISTS maintenance_logs_bike_id_idx ON maintenance_logs(bike_id);
CREATE INDEX IF NOT EXISTS maintenance_logs_mechanic_id_idx ON maintenance_logs(mechanic_id);

COMMIT;
