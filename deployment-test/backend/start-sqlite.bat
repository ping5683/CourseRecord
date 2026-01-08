@echo off
echo Starting Backend with SQLite...
echo.

echo Step 1: Enable CGO for SQLite...
set CGO_ENABLED=1
echo CGO_ENABLED = %CGO_ENABLED%

echo Step 2: Starting backend server...
echo.
cd ..\..
go run main.go

echo.
echo If you see CGO errors above:
echo 1. Install a C compiler (TDM-GCC or MinGW)
echo 2. Or switch to MySQL version
echo.
pause