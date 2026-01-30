-- Migration: add transactions and ledger entries for bookkeeping

BEGIN;

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NULL REFERENCES users(id),
  reservation_id INTEGER NULL, -- optional link to reservation if available
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, refunded, failed
  payment_method TEXT NULL, -- e.g. 'card', 'cash', 'invoice'
  provider_response jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON transactions(user_id);
CREATE INDEX IF NOT EXISTS transactions_reservation_id_idx ON transactions(reservation_id);

CREATE TABLE IF NOT EXISTS ledger_entries (
  id SERIAL PRIMARY KEY,
  transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
  account TEXT NOT NULL, -- e.g. 'revenue', 'bank', 'fees'
  amount_cents INTEGER NOT NULL,
  note TEXT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ledger_transaction_idx ON ledger_entries(transaction_id);

COMMIT;
