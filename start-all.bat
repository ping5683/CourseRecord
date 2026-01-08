@echo off
echo Starting Complete Course Management System...
echo.

echo Step 1: Starting MySQL...
net start mysql

echo Step 2: Checking MySQL status...
sc query mysql | findstr "RUNNING" >nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ MySQL failed to start. Please check MySQL installation.
    pause
    exit /b
)
echo ✅ MySQL is running

echo Step 3: Starting backend in new window...
start "Backend" cmd /k "cd /d %~dp0backend && go run main.go"

echo Step 4: Starting frontend in new window...
start "Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ✅ All services started!
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo Close this window if you want to stop all services.
pause