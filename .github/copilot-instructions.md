# Bike Reservation App - Development Guidelines

## Project Overview

This is a full-stack Next.js 15 application with PostgreSQL for managing bike reservations.

**Tech Stack:**
- Frontend: React 19 + Next.js 15 (App Router)
- Backend: Next.js API Routes
- Database: PostgreSQL
- Styling: Tailwind CSS + CSS-in-JS
- Language: TypeScript
- Package Manager: npm

## Development Setup

1. Install Node.js 18+ and PostgreSQL 12+
2. Run `npm install` to install dependencies
3. Set up PostgreSQL and update `.env.local` with connection string
4. Initialize database schema using SQL provided in README.md

## Key Directories

- `/src/app` - Next.js App Router pages and API routes
- `/src/components` - Reusable React components
- `/src/lib` - Utilities and database connections
- `/src/styles` - Global styles and Tailwind CSS

## Development Commands

- `npm run dev` - Start development server (localhost:3000)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Database

PostgreSQL is required. Database schema includes:
- `bikes` table - Bike inventory with availability status
- `reservations` table - User bike reservations

See README.md for SQL schema setup.

## API Routes

All API endpoints are in `/src/app/api/`:
- `/api/bikes` - Manage bike listings
- `/api/reservations` - Manage reservations

## Naming Conventions

- Files: `kebab-case` for files, `camelCase` for exports
- Components: PascalCase
- Variables: camelCase
- Constants: UPPER_SNAKE_CASE
- Database tables: snake_case

## Important Notes

- Always use TypeScript for new files
- Keep components in `/src/components`
- Put utilities in `/src/lib`
- Use Tailwind CSS for styling
- Database queries use the pool from `/src/lib/db.ts`
- Environment variables go in `.env.local`
