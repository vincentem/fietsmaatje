# Duo Bikes - Volunteer Bike Reservation System

A comprehensive web application for managing volunteer bike reservations, specifically designed for duo bikes (2-person bikes) used by disabled riders. The system includes volunteer and admin portals with full reservation management, issue tracking, and location management capabilities.

## Features

### Volunteer Features
- **User Authentication**: Register and login with email/password
- **Find & Book Bikes**: Search bikes by location, date, and duration
- **Smart Availability**: Real-time availability checking with 30-minute buffers between reservations
- **Manage Reservations**: View upcoming and past bookings, cancel reservations
- **Report Issues**: Report bike problems with severity levels
- **Personal Statistics**: Track total rides, hours booked, and ride history

### Admin Features
- **Dashboard**: Overview of today's reservations, open issues, and out-of-service bikes
- **Bike Management**: Create, edit, and manage bike inventory
- **Location Management**: Configure locations with opening hours and exceptions
- **User Management**: Create volunteers and admin users, manage permissions
- **Reservation Oversight**: View all reservations across the system
- **Issue Management**: Track, acknowledge, and resolve reported issues
- **Pricing Settings**: Configure reservation fee
- **Transactions**: Track payments and ledger entries

### Mechanic Features
- **Maintenance Dashboard**: Quick status changes and maintenance logs

## Tech Stack

- **Frontend**: React 19 + Next.js 15 with TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL
- **Authentication**: JWT-based with bcrypt password hashing
- **Package Manager**: npm

## Project Structure

```
src/
├── app/
│   ├── api/                    # API routes
│   │   ├── auth/              # Authentication endpoints
│   │   ├── availability/      # Time bar availability
│   │   ├── bikes/             # Bike management
│   │   ├── issues/            # Issue reporting
│   │   ├── locations/         # Location configuration + hours
│   │   ├── maintenance/       # Maintenance logs
│   │   ├── notifications/     # Notification processing
│   │   ├── reservations/      # Reservation handling
│   │   ├── settings/          # Pricing settings
│   │   ├── transactions/      # Payments + ledger
│   │   ├── users/             # User management
│   │   └── volunteer/         # Volunteer dashboard
│   ├── volunteer/             # Volunteer portal pages
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── find-bike/
│   │   ├── reservations/
│   │   ├── report-issue/
│   │   └── stats/
│   ├── admin/                 # Admin portal pages
│   ├── mechanic/              # Mechanic portal pages
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── bikes/
│   │   ├── locations/
│   │   ├── users/
│   │   ├── reservations/
│   │   └── issues/
│   ├── layout.tsx
│   └── page.tsx
├── components/                 # Reusable React components
├── lib/
│   ├── db.ts                  # Database connection
│   ├── auth.ts                # Authentication utilities
│   ├── availability.ts        # Booking engine & validation
│   └── auth-context.tsx       # Auth context provider
└── styles/
    └── globals.css
```

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 12+

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Database

Create a PostgreSQL database and initialize the schema:

```bash
# Create database
createdb bike_reservation

# Run the schema setup
psql bike_reservation < db/schema.sql
```

### 3. Environment Configuration

Create `.env.local`:

```bash
cp .env.example .env.local
```

Update `.env.local` with your configuration:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/bike_reservation
JWT_SECRET=your-secret-key-here
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 4. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to access the application.

## Database Schema

The system uses PostgreSQL with the following main tables:

- **users** - Volunteers and admin accounts
- **locations** - Bike rental locations
- **location_weekly_hours** - Operating hours per day
- **location_hour_exceptions** - Holiday/special hours
- **bikes** - Bike inventory
- **reservations** - Booking records
- **issues** - Maintenance/issue reports
- **transactions** - Payment transactions
- **ledger_entries** - Double-entry accounting records
- **app_settings** - App configuration (pricing)
- **audit_logs** - Event audit trail

See `db/schema.sql` for complete schema details.

## Key Business Rules

### Booking Rules
- **Minimum Duration**: 1 hour
- **Time Granularity**: 30-minute increments
- **Buffer**: 30-minute gap required between reservations
- **Operating Hours**: Reservations must fit within location hours
- **Status**: AVAILABLE bikes only

### Location Hours
- Defined per location with weekly schedule
- Support for always-open locations
- Date-based exceptions for holidays/special events

### Availability Logic
A bike is unavailable if any existing reservation overlaps with:
```
[existing_start - 30min, existing_end + 30min)
```

## API Endpoints

### Authentication
- `POST /api/auth` - Login/Register

### Bikes
- `GET /api/bikes` - List all bikes
- `POST /api/bikes` - Create bike (admin)
- `GET/PUT/DELETE /api/bikes/[id]` - Manage individual bike

### Reservations
- `GET /api/reservations` - List reservations
- `POST /api/reservations` - Create reservation
- `GET/PUT/DELETE /api/reservations/[id]` - Manage reservation

### Availability
- `GET /api/availability/timebar` - Time slot availability

### Locations
- `GET /api/locations` - List locations
- `POST /api/locations` - Create location (admin)
- `GET/PUT/DELETE /api/locations/[id]` - Manage location
- `GET/POST /api/locations/[id]/hours` - Manage weekly hours
- `GET/POST /api/locations/[id]/exceptions` - Manage exceptions
- `GET/POST /api/locations/hours` - Fetch/update hours (admin helper)

### Users
- `GET /api/users` - List users (admin)
- `POST /api/users` - Create user (admin)
- `GET/PUT/DELETE /api/users/[id]` - Manage user
- `POST /api/users/[id]/balance` - Update user balance (admin)

### Issues
- `GET /api/issues` - List issues
- `POST /api/issues` - Report issue
- `GET/PUT /api/issues/[id]` - Manage issue

### Bikes
- `POST /api/bikes/[id]/status` - Update bike status
- `POST /api/bikes/[id]/maintenance` - Add maintenance entry

### Pricing
- `GET/PUT /api/settings/pricing` - Get/update reservation fee

### Transactions
- `GET /api/transactions` - List transactions
- `GET /api/transactions/[id]` - Get transaction details
- `POST /api/transactions/[id]/status` - Update status

### Notifications
- `POST /api/notifications/process` - Process queued notifications

## Development Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

## Workflow Examples

### Creating a Reservation (Volunteer)

1. Navigate to "Find a Bike"
2. Select location, date, start time, duration
3. System checks availability (includes 30-min buffers)
4. Validates against location opening hours
5. Creates reservation if all checks pass

### Managing Open Issues (Admin)

1. Go to Issues dashboard
2. View all reported issues with severity levels
3. Update status: OPEN → ACKNOWLEDGED → FIXED → CLOSED
4. Track maintenance history per bike

## Security Features

- Password hashing with bcryptjs
- JWT-based authentication
- Role-based access control (VOLUNTEER | ADMIN)
- Input validation on all endpoints
- Secure token handling

## Future Enhancements

- Email notifications for bookings
- Calendar export (ICS format)
- Multi-language support
- Advanced reporting & analytics
- Mobile app
- SMS notifications
- Integration with bike tracking systems

## Contributing

Contributions are welcome! Please ensure:
- Code follows existing patterns
- All new features include appropriate validation
- API changes are documented

## License

MIT License - See LICENSE file for details

## Support

For issues or questions, please refer to the admin dashboard documentation or contact the system administrator.

