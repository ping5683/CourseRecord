@echo off
echo Requesting Administrator privileges to start MySQL...
echo.

rem Check if running as administrator
net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Not running as administrator. Requesting elevation...
    powershell -Command "Start-Process cmd -ArgumentList '/c cd /d \"%~dp0\" && start-mysql.bat' -Verb RunAs"
    exit /b
)

echo Running as administrator...
echo Starting MySQL service...
net start mysql

if %ERRORLEVEL% EQU 0 (
    echo ✅ MySQL service started successfully!
) else (
    echo ❌ Failed to start MySQL service
    echo.
    echo Trying to find MySQL installation...
    echo.
    rem Check common MySQL paths
    if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" (
        echo Found MySQL at: C:\Program Files\MySQL\MySQL Server 8.0\
        echo Trying to start manually...
        "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" --console
    )
    if exist "C:\Program Files (x86)\MySQL\MySQL Server 8.0\bin\mysqld.exe" (
        echo Found MySQL at: C:\Program Files (x86)\MySQL\MySQL Server 8.0\
        echo Trying to start manually...
        "C:\Program Files (x86)\MySQL\MySQL Server 8.0\bin\mysqld.exe" --console
    )
    if not exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" (
        if not exist "C:\Program Files (x86)\MySQL\MySQL Server 8.0\bin\mysqld.exe" (
            echo MySQL installation not found in common locations
            echo Please ensure MySQL is properly installed
        )
    )
)

echo.
pause