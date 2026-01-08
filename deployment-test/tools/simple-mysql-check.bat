@echo off
echo Checking MySQL...
echo.

echo Checking MySQL service...
sc query mysql

echo.
echo Checking common MySQL paths...
if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" echo MySQL Server found
if exist "C:\xampp\mysql\bin\mysql.exe" echo XAMPP MySQL found
if exist "C:\Program Files\MySQL\MySQL Workbench 8.0 CE\mysql-workbench.exe" echo MySQL Workbench found

echo.
echo If you only see MySQL Workbench, you need to install MySQL Server
echo Download: https://dev.mysql.com/downloads/installer/

pause