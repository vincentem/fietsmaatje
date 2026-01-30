# Quick Start Guide - Duo Bikes

Get the application running locally in 5 minutes!

## Prerequisites

- Node.js 18+
- PostgreSQL 12+
- npm

## Step 1: Setup Database

```bash
# Create database
createdb bike_reservation

# Load schema
psql bike_reservation < db/schema.sql
```

## Step 2: Environment Setup

```bash
# Copy env template
cp .env.example .env.local

# Edit .env.local
nano .env.local
```

Minimum required:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/bike_reservation
JWT_SECRET=your-secret-key-change-this-in-production
# Reservation fee in cents (e.g. 1000 = EUR 10.00)
RESERVATION_FEE_CENTS=1000
# Optional client-side fallback
NEXT_PUBLIC_RESERVATION_FEE_CENTS=1000
```

## Step 3: Install & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Server runs at: **http://localhost:3000**

## Step 4: Create Test Data

Use admin account to create locations and bikes:

```bash
# Create initial admin user (via database)
psql bike_reservation
```

```sql
-- Create admin account
INSERT INTO users (email, password_hash, name, role, is_active) 
VALUES (
  'admin@example.com',
  '$2a$10$...',  -- bcrypt hash of 'password123'
  'Admin User',
  'ADMIN',
  true
);

-- Create sample location
INSERT INTO locations (name, address, hours_type)
VALUES ('Downtown Hub', '123 Main St', 'SCHEDULED');

-- Add location hours (weekday 0-6, Monday-Sunday)
INSERT INTO location_weekly_hours (location_id, weekday, open_time, close_time, is_closed)
VALUES (1, 0, '09:00:00', '17:00:00', false);

-- Create sample bike
INSERT INTO bikes (code, name, location_id, status)
VALUES ('BIKE-001', 'Blue Duo', 1, 'AVAILABLE');
```

**Note:** For production, use proper password hashing tools.

## First Login

### Volunteer
1. Go to http://localhost:3000
2. Click "Volunteer Portal"
3. Sign up with new account
4. Dashboard appears
5. Click "Find a Bike"
6. Search for bikes

### Admin
1. Go to http://localhost:3000
2. Click "Admin Portal"
3. Login with admin credentials
4. Dashboard with quick stats
5. Manage bikes, locations, users

## Key Features to Try

### Booking a Bike
1. Find a Bike → Select location
2. Pick date and time (must align to :00 or :30)
3. Select duration (1+ hour)
4. Click "Book This Bike"
5. Confirmation appears

### Checking Availability
- The system prevents overlapping reservations
- 30-minute buffer automatically enforced
- Location hours respected

### Reporting Issues
1. Click "Report Issue"
2. Select affected bike
3. Choose category (Flat Tire, etc.)
4. Set severity (LOW/MEDIUM/HIGH)
5. Describe problem
6. Admin notified

### Admin Tasks
1. **Manage Bikes**: Add/edit bikes
2. **Manage Locations**: Configure opening hours
3. **Create Users**: Add volunteers or admins
4. **View Issues**: Track maintenance

## Common Commands

```bash
# Development
npm run dev

# Production build
npm run build
npm start

# Lint code
npm run lint

# Database shell
psql bike_reservation
```

## Useful Database Queries

```sql
-- View all bikes
SELECT id, code, location_id, status FROM bikes;

-- Check reservations for a date
SELECT * FROM reservations 
WHERE DATE(start_datetime) = '2026-01-29'
ORDER BY start_datetime;

-- List open issues
SELECT * FROM issues WHERE status = 'OPEN'
ORDER BY severity DESC, created_at DESC;

-- View location hours
SELECT * FROM location_weekly_hours WHERE location_id = 1
ORDER BY weekday;
```

## Architecture Overview

```
┌─────────────────────────────────────┐
│  Browser (Volunteer/Admin Portal)   │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│  Next.js 15 (Frontend + API)        │
│  - Pages (React components)         │
│  - API Routes (/api/*)              │
│  - Authentication (JWT)             │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│  PostgreSQL Database                │
│  - Users, Bikes, Reservations       │
│  - Locations, Issues                │
└─────────────────────────────────────┘
```

## Troubleshooting

### "Can't connect to database"
```bash
# Check PostgreSQL running
psql -U postgres

# Verify connection string
echo $DATABASE_URL

# Check schema exists
psql bike_reservation -c "\dt"
```

### "Module not found"
```bash
# Reinstall deps
rm -rf node_modules package-lock.json
npm install
```

### "Port 3000 already in use"
```bash
# Use different port
npm run dev -- -p 3001
```

### "Reservation rejected when it should work"
1. Check bike status = AVAILABLE
2. Verify location hours include the time
3. Ensure no overlapping reservations (with 30-min buffer)
4. Confirm times align to :00 or :30

## Next Steps

1. **Data**: Create more locations and bikes
2. **Testing**: Try booking conflicts to see validation
3. **Admin**: Explore issue management workflow
4. **Development**: Read [DEVELOPMENT.md](./DEVELOPMENT.md) for architecture details

## Production Deployment

See deployment docs for:
- Environment configuration
- Database setup
- Security hardening
- Performance optimization
- Monitoring setup

---

**Happy booking! 🚴**
