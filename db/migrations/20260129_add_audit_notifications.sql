-- Migration: add audit_logs and notifications tables

BEGIN;

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  related_type TEXT NULL,
  related_id INTEGER NULL,
  payload jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by INTEGER NULL
);

CREATE INDEX IF NOT EXISTS audit_logs_related_idx ON audit_logs(related_type, related_id);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload jsonb NULL,
  targets jsonb NULL, -- array of {type:'webhook'|'email', value:...}
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  last_attempt timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz NULL,
  error text NULL
);

CREATE INDEX IF NOT EXISTS notifications_status_idx ON notifications(status);

COMMIT;
