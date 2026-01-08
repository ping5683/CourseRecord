@echo off
echo MySQL Password Reset Tool
echo ====================

echo This will help you reset MySQL root password.
echo You need to run this as Administrator.
echo.

rem Check admin privileges
net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Requesting administrator privileges...
    powershell -Command "Start-Process cmd -ArgumentList '/c %~dpnx0 reset-mysql-password.bat' -Verb RunAs"
    exit /b
)

echo.
echo Stopping MySQL service...
net stop mysql

echo.
echo Starting MySQL in safe mode...
start "MySQL Safe Mode" "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" --skip-grant-tables --console

echo.
echo Waiting for you to open another terminal and reset password...
echo In the new terminal:
echo 1. mysql -u root
echo 2. USE mysql;
echo 3. UPDATE user SET authentication_string='' WHERE user='root';
echo 4. FLUSH PRIVILEGES;
echo 5. exit
echo.

echo Then press any key to continue...
pause

echo.
echo Stopping safe mode...
taskkill /f /im mysqld.exe

echo.
echo Starting MySQL service...
net start mysql

echo.
echo ✅ Password reset complete! Password is now empty.
echo You can now run the backend.
echo.

pause