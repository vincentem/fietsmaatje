# Duo Bikes - Comprehensive Development Guide

## Overview

This is a full-stack Next.js application for managing volunteer bike reservations with a focus on duo bikes (2-person bikes) for disabled riders. The system implements complex availability logic with time buffers and location-based operating hours.

## Branching & Deployment Workflow

Follow this workflow whenever you start a new piece of development that should land in `main` and be deployed to Vercel.

### 1. Create a feature branch

```bash
git fetch origin
git switch main
git pull --ff-only
git switch -c <feature-branch-name>
```

The current scratch branch is `testing-deployment`; push it (or any new branch) with:

```bash
git push -u origin <feature-branch-name>
```

### 2. Preview deployments on Vercel

- The GitHub→Vercel integration automatically creates a **Preview Deployment** for every branch once it is pushed.
- Each subsequent push to the same branch updates the same preview URL. Share that URL to review work without touching production.
- Pull Requests on GitHub show the preview status; wait for the green check before merging.

### 3. Optional dedicated testing project

If you want a stable “testing” environment that mirrors production without affecting it:

1. Duplicate the existing Vercel project in the Vercel dashboard and name it something like `fietsmaatje-testing`.
2. Set its Production Branch to a long‑lived branch such as `staging` (which you create from `main`).
3. Update the project’s Environment Variables so the testing project points to the correct Neon database branch (see below).
4. Deploy feature branches to this testing project by opening PRs that target `staging` instead of `main`, or by manually triggering Vercel deployments from the dashboard.

### 4. Neon database branches

- Create a Neon branch from the production database for each major feature if you need isolated data (`neonctl branch create my-feature` or through the Neon UI).
- Run migrations against that branch locally, then set the resulting connection string (`DATABASE_URL`, `DIRECT_URL`) inside the Vercel Preview or testing project.
- When the feature is merged into `main`, promote or rebase the Neon branch back into the primary branch, then update Vercel’s Production environment variables if schema changes occurred.

### 5. Merge back to `main`

1. Rebase your feature branch on top of `origin/main` to keep history clean.
2. Run automated checks plus any manual QA on the preview deployment.
3. Merge via Pull Request once everything passes. Vercel will redeploy the production environment automatically.

## Architecture

### Frontend Layer
- **React 19** with TypeScript for type safety
- **Next.js 15** App Router for routing and server-side capabilities
- **Tailwind CSS** for responsive UI
- **Client-side state**: Auth context for session management

### Backend Layer
- **Next.js API Routes** for all endpoints
- **PostgreSQL** for persistent data storage
- **JWT** for stateless authentication
- **bcryptjs** for secure password hashing

### Key Libraries
- `date-fns` - Date manipulation and formatting
- `pg` - PostgreSQL client
- `jsonwebtoken` - JWT token management
- `bcryptjs` - Password hashing
- `js-cookie` - Client-side cookie management
- `dotenv` - Environment variable loading

## Critical Business Logic

### Availability Engine (`src/lib/availability.ts`)

The availability logic is the core of this system:

**Key Constants:**
- `MIN_BOOKING_DURATION = 60 minutes`
- `BUFFER_TIME = 30 minutes`
- `TIME_INCREMENT = 30 minutes`

**Validation Steps:**
1. Check user authentication & active status
2. Validate duration ≥ 60 minutes
3. Ensure times align to 30-minute boundaries
4. Verify bike status is AVAILABLE
5. Check location opening hours
6. Verify no overlapping reservations with buffers
7. Create reservation atomically

**Buffer Logic:**
A reservation makes a bike unavailable during:
```
[start_time - 30min, end_time + 30min)
```

This prevents back-to-back bookings and allows cleaning/handoff time.

### Location Hours Management

**Two Operating Hour Types:**
1. **SCHEDULED** - Defined weekly schedule with date exceptions
2. **ALWAYS_OPEN** - Available 24/7

**Weekly Hours:**
- Stored per weekday (0-6 = Monday-Sunday)
- Can be marked as closed for that day

**Date Exceptions:**
- Override weekly schedule for specific dates
- Used for holidays, special events, maintenance days

### Reservation Lifecycle

```
BOOKED → COMPLETED
     ↘ CANCELED
```

Status transitions:
- **BOOKED**: Active reservation
- **COMPLETED**: Ride finished
- **CANCELED**: Canceled by volunteer or admin

## Database Schema Highlights

### Key Relationships
```
users (1) ─── (N) reservations
locations (1) ─── (N) bikes
locations (1) ─── (N) location_weekly_hours
locations (1) ─── (N) location_hour_exceptions
bikes (1) ─── (N) reservations
bikes (1) ─── (N) issues
```

### Important Indexes
- `idx_reservations_bike_id` - Fast bike availability checks
- `idx_reservations_start_datetime` - Calendar queries
- `idx_bikes_status` - Filter available bikes
- `idx_location_hour_exceptions_date` - Lookup special hours

## API Route Structure

### Authentication (`/api/auth/*`)
- `POST /api/auth` - Login/Register action
- `GET /api/auth/me` - Current user info

### Core Resources (`/api/{resource}`)
- `GET` - List all
- `POST` - Create new

### Individual Resources (`/api/{resource}/[id]`)
- `GET` - Fetch specific
- `PUT` - Update
- `DELETE` - Delete/deactivate

### Special Endpoints
- `GET /api/bikes?location_id=N` - Filter by location
- `GET /api/reservations?volunteer_id=N` - User's reservations
- `GET /api/issues?status=OPEN` - Filter issues
- `GET /api/availability/timebar` - Time slot availability
- `GET/PUT /api/settings/pricing` - Reservation fee settings
- `GET /api/transactions` - Payment transactions
- `POST /api/transactions/[id]/status` - Update payment status
- `POST /api/bikes/[id]/status` - Update bike status
- `POST /api/bikes/[id]/maintenance` - Add maintenance entry
- `POST /api/notifications/process` - Process notifications

## Authentication Flow

### Login/Register
1. User submits credentials
2. Backend hashes password & stores user
3. Generate JWT token
4. Return token & user info
5. Client stores in localStorage

### Protected Routes
1. Client includes `Authorization: Bearer <token>` header
2. Server verifies JWT signature
3. Extract user info from token
4. Validate user role for admin operations

## Volunteer Workflow

### 1. Registration
- Email, password, name
- Role defaults to VOLUNTEER
- Password hashed with bcryptjs

### 2. Browse & Book
- Select location
- Pick date & time (30-min aligned)
- Choose duration (1+ hours)
- System checks:
  - Bike availability (no overlapping reservations + buffers)
  - Location opening hours
  - Time alignment
- Confirm booking
- Create atomic transaction to prevent race conditions

### 3. View Reservations
- Upcoming (BOOKED status)
- Past (COMPLETED status)
- Can cancel upcoming bookings

### 4. Report Issues
- Select affected bike
- Choose issue category
- Set severity level (LOW/MEDIUM/HIGH)
- Describe problem
- Admin notified automatically

### 5. View Stats
- Total rides count
- Total hours booked
- Completed rides

## Admin Workflow

### Dashboard
- Quick overview of:
  - Today's reservations
  - Open issues
  - Out-of-service bikes
  - Quick actions to problem areas

### Bike Management
- Add bikes to locations
- Change availability status
- Assign to locations
- Track maintenance notes

### Location Management
- Create locations with address & instructions
- Configure weekly operating hours
- Set special hours (holidays, maintenance windows)
- View all bikes at location

### User Management
- Create admin & volunteer accounts
- Activate/deactivate users
- Reset passwords
- Audit user activity

### Issue Management
- View all reported issues with severity
- Filter by status or severity
- Update status: OPEN → ACKNOWLEDGED → FIXED → CLOSED
- Track maintenance history

## Development Patterns

### API Endpoint Pattern
```typescript
export async function GET(request: NextRequest) {
  // Validate auth if needed
  const token = getTokenFromHeader(request);
  if (!token) return unauthorized();

  // Fetch data
  const result = await query(sql, params);

  // Return response
  return NextResponse.json(result.rows);
}
```

### Component Pattern
```typescript
'use client';

export default function Component() {
  const { token } = useAuth();
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [token]);

  return <div>...</div>;
}
```

### Error Handling
- All endpoints return JSON
- HTTP status codes indicate success/failure
- Error responses include `error` message
- Client shows user-friendly messages

## Common Tasks

### Add a New Bike Status
1. Update SQL schema enum
2. Modify validation in availability check
3. Update UI dropdown options
4. Document in business rules

### Add Location Exception
1. POST `/api/locations/[id]/exceptions`
2. Provide: date, open_time, close_time, is_closed, reason
3. System automatically uses for availability checks

### Handle Bike Maintenance
1. Set bike status to OUT_OF_SERVICE
2. Prevent new reservations
3. Admin comments in bike notes
4. Update back to AVAILABLE when ready

## Performance Considerations

### Database Queries
- Use indexes for common filters
- Batch related queries when possible
- Avoid N+1 queries with joins

### Frontend
- Lazy load location data
- Cache bike availability locally
- Debounce search inputs
- Minimize re-renders with memoization

## Security Checklist

- ✅ Passwords hashed with bcryptjs (10 salt rounds)
- ✅ JWT tokens with expiration
- ✅ Role-based access control
- ✅ SQL injection prevention via parameterized queries
- ✅ CORS headers managed by Next.js
- ✅ Environment variables for secrets
- ✅ Active user checks (is_active flag)

## Testing Scenarios

### Booking Conflicts
```
Reservation 1: 10:00-11:00
Attempted:     10:45-11:45
Result: REJECTED (overlaps with buffer)

Expected buffers:
Reservation 1 blocks: 9:30-11:30
```

### Location Hours
```
Location open: 9:00-17:00
User tries: 16:30-17:30
Result: REJECTED (outside hours)
```

### Alignment
```
User selects: 10:15-11:15
System requires: 30-min alignment
Result: REJECTED (must be :00 or :30)
```

## Deployment Considerations

1. Set `JWT_SECRET` to strong random value
2. Use environment-specific database URLs
3. Enable HTTPS in production
4. Set up PostgreSQL backups
5. Configure appropriate CORS origins
6. Monitor database connection pool
7. Set up error logging/monitoring
8. Plan capacity for ~80 locations, ~100 bikes

## Troubleshooting

### "Bike not available" despite empty calendar
- Check 30-minute buffers
- Verify location opening hours
- Confirm bike status is AVAILABLE

### Login fails with correct credentials
- Verify user.is_active = true
- Check password hash in database
- Ensure JWT_SECRET is consistent

### Reservations not showing
- Verify volunteer_id matches user
- Check reservation status filters
- Ensure date range is correct

---

**Last Updated:** January 29, 2026
**Version:** 1.0.0 (MVP)
