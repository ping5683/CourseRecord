# 🛠️ 后端启动脚本

本文件夹包含后端服务的各种启动和修复脚本。

## 📋 脚本说明

### 🚀 启动脚本

#### `start-mysql.bat` 
**使用场景**: 已安装MySQL数据库
**功能**: 自动安装MySQL驱动并启动后端

#### `start-sqlite.bat`
**使用场景**: 想使用SQLite数据库（需要C编译器）
**功能**: 设置CGO并启动后端

### 🔧 修复脚本

#### `fix-dependencies.bat`
**使用场景**: 编译错误、依赖问题
**功能**: 清理缓存、重新下载依赖、验证模块

## 🎯 使用方法

1. **选择数据库**：
   - MySQL → 运行 `start-mysql.bat`
   - SQLite → 运行 `start-sqlite.bat`

2. **遇到问题时**：
   - 运行 `fix-dependencies.bat`
   - 检查错误信息

## 📝 注意事项

- MySQL版本需要先创建数据库
- SQLite版本需要安装C编译器
- 首次运行可能需要较长时间下载依赖