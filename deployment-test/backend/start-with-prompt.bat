@echo off
echo Starting Backend with Password Prompt...
echo.

echo Step 1: Installing MySQL driver...
cd /d "%~dp0..\..\backend"
go get gorm.io/driver/mysql

echo Step 2: Updating modules...
go mod tidy

echo Step 3: Starting backend...
echo.
echo If MySQL asks for password, enter it now.
echo Otherwise, press Enter if password is empty.
echo.
go run main.go