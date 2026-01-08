@echo off
echo MySQL Startup Helper
echo ====================
echo.

echo Checking MySQL installation type...

rem Check if XAMPP is installed
if exist "C:\xampp\mysql\bin\mysqld.exe" (
    echo ✅ Found XAMPP installation
    echo.
    echo Starting MySQL via XAMPP...
    echo Please start XAMPP Control Panel and click Start next to MySQL
    echo.
    echo XAMPP Control Panel location:
    echo C:\xampp\xampp-control.exe
    goto :xampp_launch
) else (
    echo ❌ XAMPP not found in default location
)

rem Check if MySQL is a Windows service
sc query mysql 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Found MySQL Windows service
    echo.
    echo Starting MySQL service...
    net start mysql
    if %ERRORLEVEL% EQU 0 (
        echo ✅ MySQL service started successfully!
    ) else (
        echo ❌ Failed to start MySQL service
        echo Trying as administrator...
        echo Please run this command as Administrator:
        echo net start mysql
    )
    goto :end
)

echo ❌ MySQL installation not found
echo.
echo Please install MySQL first:
echo 1. Download XAMPP: https://www.apachefriends.org/
echo 2. Or download MySQL: https://dev.mysql.com/downloads/mysql/
goto :end

:xampp_launch
echo.
echo Launching XAMPP Control Panel...
if exist "C:\xampp\xampp-control.exe" (
    start "" "C:\xampp\xampp-control.exe"
    echo ✅ XAMPP Control Panel opened
    echo Please click "Start" next to MySQL
) else (
    echo ❌ XAMPP Control Panel not found
)

:end
echo.
echo After MySQL is running, you can start the backend:
echo deployment-test\backend\start-mysql.bat
echo.
pause