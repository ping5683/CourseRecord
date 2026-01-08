# 🛠️ 部署工具

本文件夹包含各种部署和配置工具。

## 📁 文件说明

### 🗄️ `mysql-setup.sql`
**用途**: MySQL数据库初始化脚本
**使用方法**: 
```bash
mysql -u root -p < mysql-setup.sql
```

### 🚀 `quick-start.bat`
**用途**: 一键选择数据库并启动后端
**功能**: 
- 交互式选择MySQL或SQLite
- 自动调用对应的启动脚本

## 🎯 使用建议

### 新手推荐流程
1. 先查看 `../guides/step-by-step.md`
2. 使用本文件夹的 `quick-start.bat` 快速启动
3. 按照指南完成功能测试

### 有经验用户
1. 直接使用对应的启动脚本
2. 参考 `../guides/e2e-testing-guide.md` 进行测试

## 💡 注意事项

- 使用MySQL前需要先运行数据库初始化脚本
- SQLite版本需要C编译器支持
- 所有工具都假设你已经安装了必要的环境（Go、Node.js）