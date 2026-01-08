-- MySQL数据库初始化脚本
-- 使用方法：mysql -u root -p < mysql-setup.sql

-- 创建数据库
CREATE DATABASE IF NOT EXISTS course_management 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 创建用户（可选，如果不使用root）
-- CREATE USER IF NOT EXISTS 'course_user'@'localhost' IDENTIFIED BY 'your_password';
-- GRANT ALL PRIVILEGES ON course_management.* TO 'course_user'@'localhost';
-- FLUSH PRIVILEGES;

-- 使用数据库
USE course_management;

-- 显示数据库信息
SHOW CREATE DATABASE course_management;

SELECT 'Database setup completed!' as status;