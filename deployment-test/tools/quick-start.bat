@echo off
echo Course Management System - Quick Start
echo =====================================
echo.

echo Choose database type:
echo 1. MySQL (recommended)
echo 2. SQLite
echo.
set /p choice="Enter your choice (1 or 2): "

if "%choice%"=="1" (
    echo.
    echo Starting with MySQL...
    echo Make sure MySQL is running and database exists.
    echo.
    cd ..\backend
    ..\deployment-test\backend\start-mysql.bat
) else if "%choice%"=="2" (
    echo.
    echo Starting with SQLite...
    echo Make sure you have a C compiler installed.
    echo.
    cd ..\backend
    ..\deployment-test\backend\start-sqlite.bat
) else (
    echo Invalid choice. Please enter 1 or 2.
)

pause