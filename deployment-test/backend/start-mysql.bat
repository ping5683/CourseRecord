@echo off
echo Starting Backend with MySQL...
echo.

echo Step 1: Going to backend directory...
cd /d "%~dp0..\..\backend"
echo Now in: %CD%

echo Step 2: Installing MySQL driver...
go get gorm.io/driver/mysql

echo Step 3: Updating modules...
go mod tidy

echo Step 4: Starting backend...
go run main.go

echo.
echo If you get connection errors:
echo 1. Make sure MySQL is running
echo 2. Update .env file with correct MySQL credentials
echo 3. Create database: CREATE DATABASE course_management;
echo.
pause