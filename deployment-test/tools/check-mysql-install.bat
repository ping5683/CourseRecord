@echo off
echo MySQL Installation Checker
echo ========================
echo.

echo Checking for MySQL installations...

rem Check MySQL Server installations
if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" (
    echo Found MySQL Server 8.0 (64-bit): C:\Program Files\MySQL\MySQL Server 8.0\
)
if exist "C:\Program Files (x86)\MySQL\MySQL Server 8.0\bin\mysql.exe" (
    echo Found MySQL Server 8.0 (32-bit): C:\Program Files (x86)\MySQL\MySQL Server 8.0\
)

rem Check XAMPP
if exist "C:\xampp\mysql\bin\mysql.exe" (
    echo Found XAMPP MySQL: C:\xampp\mysql\
)

rem Check MySQL Workbench (not the service)
if exist "C:\Program Files\MySQL\MySQL Workbench 8.0 CE\mysql-workbench.exe" (
    echo Found MySQL Workbench (管理工具，不是数据库服务)
)

echo.
echo What you should do:
echo 1. If you see MySQL Server above - use "deployment-test/tools/admin-start-mysql.bat"
echo 2. If you see XAMPP above - open XAMPP Control Panel and click Start
echo 3. If you only see Workbench - you need to install MySQL Server
echo.
echo MySQL Server download: https://dev.mysql.com/downloads/installer/
echo.

pause