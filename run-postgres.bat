@echo off
REM Start Portable PostgreSQL Server

setlocal enabledelayedexpansion

set PGBIN=postgres_portable\bin
set PGDATA=%CD%\postgres_data
set PGPORT=5432

if not exist "!PGDATA!" (
    echo ERROR: Database not initialized. Run setup-postgres.bat first.
    pause
    exit /b 1
)

echo Starting PostgreSQL on port !PGPORT!...
"!PGBIN!\postgres.exe" -D "!PGDATA!" -p !PGPORT!
