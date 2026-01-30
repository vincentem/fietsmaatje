-- Migration: add user_notifications table

BEGIN;

CREATE TABLE IF NOT EXISTS user_notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  payload jsonb NULL,
  status TEXT NOT NULL DEFAULT 'unread',
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz NULL
);

CREATE INDEX IF NOT EXISTS user_notifications_user_idx ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS user_notifications_status_idx ON user_notifications(status);

COMMIT;
