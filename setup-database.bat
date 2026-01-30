@echo off
REM Create and initialize the bike_reservation database

setlocal enabledelayedexpansion

set PGBIN=postgres_portable\bin
set PGPORT=5432

echo Creating database bike_reservation...
"!PGBIN!\createdb.exe" -U postgres -p !PGPORT! bike_reservation

if errorlevel 1 (
    echo Database might already exist, continuing...
)

echo.
echo Loading schema...
"!PGBIN!\psql.exe" -U postgres -p !PGPORT! -d bike_reservation -f db\schema.sql

if errorlevel 1 (
    echo ERROR: Failed to load schema
    pause
    exit /b 1
)

echo.
echo ===================================
echo Database Setup Complete!
echo ===================================
echo.
echo Your database is ready to use.
echo Connection: postgresql://postgres:postgres@localhost:5432/bike_reservation
echo.
pause
