@echo off
echo MySQL Service Type Checker
echo ========================
echo.

echo Checking if MySQL is installed as Windows service...
sc query mysql 2>nul
if %ERRORLEVEL% EQU 1060 (
    echo ❌ MySQL is NOT installed as Windows service
    echo.
    echo You probably have XAMPP or portable MySQL
    echo You need to start MySQL from its own control panel
    echo.
    echo Recommended: Use XAMPP Control Panel
    goto :xampp_info
) else (
    echo ✅ MySQL is installed as Windows service
    echo.
    echo You can start MySQL with:
    echo   net start mysql
    echo.
    echo And stop it with:
    echo   net stop mysql
    goto :end
)

:xampp_info
echo.
echo XAMPP Users:
echo 1. Open XAMPP Control Panel
echo 2. Click "Start" next to MySQL
echo 3. Keep XAMPP running (you can minimize it)
echo.

:end
pause