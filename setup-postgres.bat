@echo off
REM Portable PostgreSQL Setup for Duo Bikes
REM This script initializes a local PostgreSQL database

setlocal enabledelayedexpansion

echo.
echo ===================================
echo Portable PostgreSQL Setup
echo ===================================
echo.

REM Check if postgres_portable folder exists
if not exist "postgres_portable" (
    echo ERROR: postgres_portable folder not found!
    echo.
    echo Please download PostgreSQL portable:
    echo 1. Go to: https://www.postgresql.org/download/windows/
    echo 2. Download the "Binary" version (not installer)
    echo 3. Extract to: C:\Data\Portfolio\postgres_portable\
    echo.
    pause
    exit /b 1
)

REM Set PostgreSQL paths
set PGBIN=postgres_portable\bin
set PGDATA=%CD%\postgres_data
set PGPORT=5432

echo Starting PostgreSQL setup...
echo.

REM Create data directory if it doesn't exist
if not exist "!PGDATA!" (
    echo Creating data directory: !PGDATA!
    mkdir "!PGDATA!"
    echo.
)

REM Initialize database cluster
echo Initializing PostgreSQL database cluster...
"!PGBIN!\initdb.exe" -D "!PGDATA!" -U postgres -A password -E utf8
if errorlevel 1 (
    echo ERROR: Failed to initialize database
    pause
    exit /b 1
)

echo.
echo ===================================
echo PostgreSQL Setup Complete!
echo ===================================
echo.
echo Next steps:
echo 1. Start PostgreSQL: run-postgres.bat
echo 2. Create database: setup-database.bat
echo 3. Restart dev server
echo.
pause
