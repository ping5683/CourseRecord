@echo off
echo Checking MySQL service status...
echo.

echo Step 1: Checking MySQL service...
sc query mysql 2>nul
if %ERRORLEVEL% EQU 1060 (
    echo MySQL service not found.
    echo Please install MySQL first.
    goto :end
)

sc query mysql | findstr "RUNNING" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ MySQL service is RUNNING
    echo.
    echo Step 2: Testing database connection...
    echo Make sure your .env file has correct credentials.
) else (
    echo ❌ MySQL service is STOPPED
    echo.
    echo Starting MySQL service...
    net start mysql
    if %ERRORLEVEL% EQU 0 (
        echo ✅ MySQL service started successfully!
    ) else (
        echo ❌ Failed to start MySQL service
        echo Please check MySQL installation
    )
)

echo.
echo Step 3: Connection test
echo Run this command to test connection:
echo mysql -u root -p
echo.

:end
pause