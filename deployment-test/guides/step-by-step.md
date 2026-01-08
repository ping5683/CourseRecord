# 📖 超详细操作步骤

## 🔍 第1步：检查环境

### 检查Node.js
```bash
node --version
npm --version
```

**如果没有安装**：访问 https://nodejs.org/ 下载LTS版本

### 检查Go
```bash
go version
```

**如果没有安装**：访问 https://golang.org/dl/ 下载安装

## 📂 第2步：选择数据库

### 使用MySQL（推荐）
1. 确保MySQL已安装并运行
2. 创建数据库：
   ```sql
   mysql -u root -p
   CREATE DATABASE course_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   EXIT;
   ```
3. 更新 `backend/.env` 中的 `DB_PASSWORD`

### 使用SQLite（备选）
1. 安装C编译器：TDM-GCC
2. 下载地址：https://jmeubank.github.io/tdm-gcc/

## 🚀 第3步：启动服务

### 方法1：使用便捷脚本
```bash
# MySQL版本
deployment-test/backend/start-mysql.bat

# SQLite版本  
deployment-test/backend/start-sqlite.bat
```

### 方法2：手动启动
```bash
cd backend
go mod tidy
go run main.go
```

## 🎨 第4步：启动前端

```bash
cd frontend
npm install
npm run dev
```

## 🌐 第5步：访问测试

1. 打开浏览器：http://localhost:3000
2. 按照测试指南完成所有功能测试

## 💡 小贴士

- 保持两个命令窗口开启（后端+前端）
- 遇到问题先运行 `deployment-test/backend/fix-dependencies.bat`
- 查看浏览器控制台（F12）排查前端错误
- 检查后端日志排查API错误

## 📞 需要帮助？

如果遇到问题：
1. 查看对应脚本的错误信息
2. 确认环境配置正确
3. 检查数据库服务状态

祝你测试顺利！🎯