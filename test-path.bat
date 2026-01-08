@echo off
echo Current directory: %CD%
echo.

echo Listing files in current directory:
dir
echo.

echo Testing deployment-test path:
if exist "deployment-test" (
    echo ✅ deployment-test folder exists
    dir deployment-test
) else (
    echo ❌ deployment-test folder NOT found
)

echo.
echo Testing start-mysql.bat:
if exist "deployment-test\backend\start-mysql.bat" (
    echo ✅ start-mysql.bat exists
    echo Trying to run it...
    call deployment-test\backend\start-mysql.bat
) else (
    echo ❌ start-mysql.bat NOT found
    echo Current files in deployment-test\backend:
    if exist "deployment-test\backend" (
        dir deployment-test\backend
    ) else (
        echo deployment-test\backend folder not found
    )
)

pause