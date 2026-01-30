-- SQL Schema for Duo Bikes Reservation System
-- This file contains all tables and indexes needed for the application

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('VOLUNTEER', 'ADMIN')),
  is_active BOOLEAN DEFAULT true,
  balance_cents INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Locations table
CREATE TABLE IF NOT EXISTS locations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  instructions TEXT,
  hours_type VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED' CHECK (hours_type IN ('ALWAYS_OPEN', 'SCHEDULED')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Location Weekly Hours table (0-6 = Monday-Sunday)
CREATE TABLE IF NOT EXISTS location_weekly_hours (
  id SERIAL PRIMARY KEY,
  location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  weekday INTEGER NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
  open_time TIME,
  close_time TIME,
  is_closed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(location_id, weekday)
);

-- Location Hour Exceptions table (holidays, special closures, etc.)
CREATE TABLE IF NOT EXISTS location_hour_exceptions (
  id SERIAL PRIMARY KEY,
  location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  open_time TIME,
  close_time TIME,
  is_closed BOOLEAN DEFAULT false,
  reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(location_id, date)
);

-- Bikes table
CREATE TABLE IF NOT EXISTS bikes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255),
  location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'OUT_OF_SERVICE')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reservations table
CREATE TABLE IF NOT EXISTS reservations (
  id SERIAL PRIMARY KEY,
  bike_id INTEGER NOT NULL REFERENCES bikes(id) ON DELETE CASCADE,
  location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  volunteer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_datetime TIMESTAMP NOT NULL,
  end_datetime TIMESTAMP NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'BOOKED' CHECK (status IN ('BOOKED', 'CANCELED', 'COMPLETED')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_duration CHECK (end_datetime > start_datetime)
);

-- Issues / Maintenance Reports table
CREATE TABLE IF NOT EXISTS issues (
  id SERIAL PRIMARY KEY,
  bike_id INTEGER NOT NULL REFERENCES bikes(id) ON DELETE CASCADE,
  reported_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reservation_id INTEGER REFERENCES reservations(id) ON DELETE SET NULL,
  category VARCHAR(100) NOT NULL,
  severity VARCHAR(50) NOT NULL DEFAULT 'LOW' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH')),
  description TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'ACKNOWLEDGED', 'FIXED', 'CLOSED')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NULL REFERENCES users(id),
  reservation_id INTEGER NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT NULL,
  provider_response jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON transactions(user_id);
CREATE INDEX IF NOT EXISTS transactions_reservation_id_idx ON transactions(reservation_id);

-- Ledger entries table
CREATE TABLE IF NOT EXISTS ledger_entries (
  id SERIAL PRIMARY KEY,
  transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
  account TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  note TEXT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ledger_transaction_idx ON ledger_entries(transaction_id);

-- App settings table
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value_text TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS app_settings_key_idx ON app_settings(key);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  related_type TEXT NOT NULL,
  related_id INTEGER NOT NULL,
  payload JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS audit_logs_event_type_idx ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS audit_logs_related_idx ON audit_logs(related_type, related_id);

-- Delivery notifications (webhooks/email)
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload jsonb NULL,
  targets jsonb NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  last_attempt timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz NULL,
  error text NULL
);

CREATE INDEX IF NOT EXISTS notifications_status_idx ON notifications(status);

-- User-facing notifications
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_locations_name ON locations(name);
CREATE INDEX IF NOT EXISTS idx_location_weekly_hours_location_id ON location_weekly_hours(location_id);
CREATE INDEX IF NOT EXISTS idx_location_hour_exceptions_location_id ON location_hour_exceptions(location_id);
CREATE INDEX IF NOT EXISTS idx_location_hour_exceptions_date ON location_hour_exceptions(date);
CREATE INDEX IF NOT EXISTS idx_bikes_location_id ON bikes(location_id);
CREATE INDEX IF NOT EXISTS idx_bikes_status ON bikes(status);
CREATE INDEX IF NOT EXISTS idx_reservations_bike_id ON reservations(bike_id);
CREATE INDEX IF NOT EXISTS idx_reservations_volunteer_id ON reservations(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_reservations_location_id ON reservations(location_id);
CREATE INDEX IF NOT EXISTS idx_reservations_start_datetime ON reservations(start_datetime);
CREATE INDEX IF NOT EXISTS idx_reservations_end_datetime ON reservations(end_datetime);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_issues_bike_id ON issues(bike_id);
CREATE INDEX IF NOT EXISTS idx_issues_reported_by_user_id ON issues(reported_by_user_id);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
