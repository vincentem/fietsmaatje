-- Migration: add balance_cents column to users for dummy balances

BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS balance_cents INTEGER NOT NULL DEFAULT 0;

COMMIT;
