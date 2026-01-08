@echo off
echo MySQL Password Setup Helper
echo ========================
echo.

echo This will help you set a MySQL password for the application.
echo.

set /p new_password="Enter your desired MySQL password: "

if "%new_password%"=="" (
    echo Password cannot be empty!
    pause
    exit /b
)

echo.
echo Updating .env file with new password...
echo DB_PASSWORD=%new_password% > backend\.env
echo DB_HOST=localhost >> backend\.env
echo DB_PORT=3306 >> backend\.env
echo DB_USER=root >> backend\.env
echo DB_NAME=course_management >> backend\.env
echo DB_CHARSET=utf8mb4 >> backend\.env

echo.
echo ✅ .env file updated with new password
echo.
echo Now you need to:
echo 1. Set this password in MySQL
echo 2. Create the database: CREATE DATABASE course_management;
echo.
echo To set MySQL password, run as administrator:
echo ALTER USER 'root'@'localhost' IDENTIFIED BY '%new_password%';
echo.

pause