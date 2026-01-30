# 🚴 Duo Bikes - System Architecture & Flow

## User Journey Maps

### Volunteer Flow
```
┌─────────────┐
│   Landing   │
│   Page      │
└──────┬──────┘
       │
       ├─→ Sign Up
       │    └─→ Confirm
       │         └─→ Volunteer Dashboard
       │              │
       │              ├─→ Find a Bike
       │              │    ├─→ Select Location
       │              │    ├─→ Pick Date/Time
       │              │    ├─→ Choose Duration
       │              │    └─→ Book! ✓
       │              │
       │              ├─→ My Reservations
       │              │    ├─→ View Upcoming
       │              │    └─→ Cancel (optional)
       │              │
       │              ├─→ Report Issue
       │              │    ├─→ Select Bike
       │              │    ├─→ Choose Category
       │              │    ├─→ Set Severity
       │              │    └─→ Submit ✓
       │              │
       │              └─→ My Stats
       │                   └─→ View Metrics
       │
       └─→ Login
            └─→ Same as above (skip signup)
```

### Admin Flow
```
┌─────────────┐
│   Landing   │
│   Page      │
└──────┬──────┘
       │
       └─→ Admin Login
            └─→ Admin Dashboard
                 │
                 ├─→ Manage Bikes
                 │    ├─→ List All
                 │    ├─→ Add New
                 │    ├─→ Edit Status
                 │    └─→ Delete
                 │
                 ├─→ Manage Locations
                 │    ├─→ List All
                 │    ├─→ Create Location
                 │    ├─→ Configure Hours
                 │    │    ├─→ Weekly Schedule
                 │    │    └─→ Date Exceptions
                 │    └─→ Delete
                 │
                 ├─→ Manage Users
                 │    ├─→ List All
                 │    ├─→ Create User
                 │    ├─→ Edit Role
                 │    └─→ Deactivate
                 │
                 ├─→ View Reservations
                 │    ├─→ Filter by Date
                 │    ├─→ Filter by Status
                 │    └─→ View Details
                 │
                 └─→ Manage Issues
                      ├─→ Filter by Severity
                      ├─→ Update Status
                      ├─→ Mark Fixed
                      └─→ Close
```

---

## Booking Engine - Detailed Flow

```
┌─────────────────────────────────────┐
│    User Submits Booking Request     │
│  bike_id, date, time, duration      │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│ 1. Check Duration ≥ 60 minutes      │
│    ✓ PASS → Continue                │
│    ✗ FAIL → ERROR                   │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│ 2. Validate Time Alignment          │
│    Times must be :00 or :30         │
│    ✓ PASS → Continue                │
│    ✗ FAIL → ERROR                   │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│ 3. Check Bike Status                │
│    Status = AVAILABLE?              │
│    ✓ PASS → Continue                │
│    ✗ FAIL → ERROR                   │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│ 4. Check Location Hours             │
│    Fits within opening hours?       │
│    Check weekly + exceptions        │
│    ✓ PASS → Continue                │
│    ✗ FAIL → ERROR                   │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│ 5. Check Availability with Buffer   │
│                                     │
│  Blocked Window:                    │
│  [start - 30min, end + 30min)       │
│                                     │
│  Any overlap with existing?         │
│    ✓ NO OVERLAP → Continue          │
│    ✗ OVERLAP → ERROR                │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│ 6. ALL CHECKS PASS!                 │
│    Create Reservation Atomically    │
│    INSERT INTO reservations...      │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│ ✓ RESERVATION CONFIRMED             │
│   Show confirmation page            │
│   Reserve successfully              │
└─────────────────────────────────────┘
```

### Example Scenario

```
Bike #1 at Location A (hours: 9:00-17:00)

Existing Reservations:
├─ 10:00-11:00  BOOKED
├─ 13:00-14:00  BOOKED
└─ 15:00-16:00  BOOKED

User Attempts:
1. 9:30-10:30   → REJECTED (overlaps 10:00-11:00 buffer)
   Blocked: 9:30-11:30

2. 11:30-12:30  → REJECTED (overlaps 10:00-11:00 buffer)
   Blocked: 10:30-11:30

3. 11:30-13:30  → REJECTED (overlaps 13:00-14:00)
   Blocked: 13:00-14:30

4. 14:30-15:30  → REJECTED (overlaps 15:00-16:00)
   Blocked: 14:30-16:30

5. 16:30-17:30  → REJECTED (after closing time 17:00)
   Location closed at 17:00

6. 12:00-13:00  → ACCEPTED ✓
   No overlaps, within hours
```

---

## Database Relationships (ER Diagram)

```
┌──────────────┐
│    USERS     │
├──────────────┤
│ id (PK)      │
│ email (UQ)   │
│ password_hash│
│ name         │
│ role         │
│ is_active    │
└──────┬───────┘
       │ (1)
       │
       │ (N) creates issues
       │ (N) makes reservations
       │
       ├─────────────────────────────┬──────────────────────────┐
       │                             │                          │
       ↓ (1)                    ↓ (N)                      ↓ (N)
┌────────────────┐      ┌────────────────┐      ┌────────────────┐
│   LOCATIONS    │      │  RESERVATIONS  │      │    ISSUES      │
├────────────────┤      ├────────────────┤      ├────────────────┤
│ id (PK)        │      │ id (PK)        │      │ id (PK)        │
│ name           │      │ bike_id (FK)   │      │ bike_id (FK)   │
│ address        │      │ location_id(FK)│      │ reported_by    │
│ instructions   │      │ volunteer_id(FK)      │ (FK USERS)     │
│ hours_type     │      │ start_datetime │      │ category       │
└────┬───────────┘      │ end_datetime   │      │ severity       │
     │ (1)              │ status         │      │ description    │
     │                  └────┬───────────┘      │ status         │
     │ (N) has bikes         │                  └────────────────┘
     │ (N) has weekly_hours  │
     │ (N) has exceptions    │ (N) for
     │                       │ bike
     ↓                       │
┌──────────────────┐         │ (N) reservation_id
│  LOCATION_       │         │
│  WEEKLY_HOURS    │    ┌─────────────┐
├──────────────────┤    │   BIKES     │
│ id               │    ├─────────────┤
│ location_id (FK) │    │ id (PK)     │
│ weekday (0-6)    │    │ code (UQ)   │
│ open_time        │    │ name        │
│ close_time       │    │ location_id │
│ is_closed        │    │ (FK)        │
└──────────────────┘    │ status      │
                        │ notes       │
┌──────────────────┐    └─────────────┘
│  LOCATION_HOUR_  │
│  EXCEPTIONS      │
├──────────────────┤
│ id               │
│ location_id (FK) │
│ date             │
│ open_time        │
│ close_time       │
│ is_closed        │
│ reason           │
└──────────────────┘
```

---

## API Request/Response Examples

### Booking a Bike

**Request:**
```
POST /api/reservations
Authorization: Bearer <token>
Content-Type: application/json

{
  "bike_id": 1,
  "location_id": 1,
  "start_datetime": "2026-02-15T14:00:00Z",
  "end_datetime": "2026-02-15T15:00:00Z"
}
```

**Success Response (201):**
```json
{
  "id": 42,
  "bike_id": 1,
  "location_id": 1,
  "volunteer_id": 5,
  "start_datetime": "2026-02-15T14:00:00Z",
  "end_datetime": "2026-02-15T15:00:00Z",
  "status": "BOOKED",
  "created_at": "2026-01-29T16:45:00Z"
}
```

**Error Response (400):**
```json
{
  "error": "Bike is not available during this time"
}
```

---

## Data Flow Diagram

```
┌─────────────────┐
│   User Input    │
│  (Browser)      │
└────────┬────────┘
         │
         ↓ HTTP Request
┌─────────────────────────┐
│  Next.js API Route      │
│  /api/...               │
│                         │
│  ├─ Parse request       │
│  ├─ Validate auth       │
│  ├─ Validate input      │
│  └─ Check business rules│
└────────┬────────────────┘
         │
         ↓ SQL Query
┌─────────────────────────┐
│  PostgreSQL Database    │
│                         │
│  ├─ Execute query       │
│  ├─ Apply constraints   │
│  └─ Return result       │
└────────┬────────────────┘
         │
         ↓ Transform
┌─────────────────────────┐
│  Format Response        │
│  (JSON)                 │
└────────┬────────────────┘
         │
         ↓ HTTP Response
┌─────────────────┐
│  Browser/App    │
│  Update UI      │
└─────────────────┘
```

---

## Component Hierarchy

```
RootLayout
├── Volunteer Portal
│   ├── Login Page (form)
│   ├── Dashboard (grid of options)
│   ├── Find Bike Page
│   │   ├── Location Selector
│   │   ├── Date/Time Picker
│   │   ├── Duration Selector
│   │   └── Bike Card Grid
│   ├── Reservations Page
│   │   └── Reservation Card List
│   ├── Report Issue Page
│   │   ├── Bike Selector
│   │   ├── Category Dropdown
│   │   ├── Severity Selector
│   │   └── Description Input
│   └── Stats Page
│       └── Stat Cards
│
└── Admin Portal
    ├── Login Page (form)
    ├── Dashboard
    │   ├── Quick Stats
    │   ├── Today's Reservations
    │   └── Open Issues
    ├── Bikes Page
    │   ├── Bike Form
    │   └── Bikes Table
    ├── Locations Page
    │   ├── Location Form
    │   └── Location Cards
    ├── Users Page
    │   ├── User Form
    │   └── Users Table
    ├── Reservations Page
    │   └── Reservations Table
    └── Issues Page
        └── Issues List
```

---

## Authentication Flow

```
User Input:
email + password
       │
       ↓
POST /api/auth
       │
       ├─→ Find user by email
       │   ├─ User not found → ERROR
       │   └─ User found
       │
       ├─→ Compare passwords
       │   ├─ Mismatch → ERROR
       │   └─ Match
       │
       ├─→ Check is_active
       │   ├─ Inactive → ERROR
       │   └─ Active
       │
       ├─→ Generate JWT Token
       │
       ↓
Response:
{
  user: { id, email, name, role },
  token: "<jwt>"
}
       │
       ↓
Store in localStorage
       │
       ↓
Set Authorization header
for future requests
```

---

**This architecture ensures:**
✅ Data integrity  
✅ Conflict prevention  
✅ Scalability  
✅ Security  
✅ User experience  
