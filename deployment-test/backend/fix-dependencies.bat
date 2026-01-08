@echo off
echo Fixing Go modules and compilation issues...

echo Step 1: Clean module cache...
go clean -modcache

echo Step 2: Download dependencies...
go mod download

echo Step 3: Tidy dependencies...
go mod tidy

echo Step 4: Try to build...
go build -o temp-check.exe .
if %ERRORLEVEL% EQU 0 (
    echo SUCCESS: Build completed!
    del temp-check.exe
) else (
    echo Build failed, check error messages above
)

echo Step 5: Verify modules...
go mod verify

echo.
echo ========================================
echo Fix complete!
echo ========================================
echo.
pause