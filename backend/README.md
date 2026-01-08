# 课程管理后端 (Go版本)

使用Go语言实现的课程管理APP后端服务，提供完整的API接口和定时提醒功能。

## 技术栈

- **Go 1.21+** - 主要编程语言
- **Gin** - HTTP Web框架
- **GORM** - ORM库
- **SQLite** - 数据库（可替换为PostgreSQL/MySQL）
- **JWT** - 身份认证
- **Cron** - 定时任务调度
- **Web Push** - 推送通知（可选）

## 快速开始

### 1. 安装Go

确保您的系统已安装Go 1.21或更高版本：

```bash
# 检查Go版本
go version

# 如果未安装，请访问 https://golang.org/dl/ 下载安装
```

### 2. 安装依赖

```bash
# 进入后端目录
cd backend-go

# 下载Go模块依赖
go mod download
```

### 3. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑.env文件（可选）
# 默认配置已足够开发和测试使用
```

### 4. 初始化数据库

```bash
# 运行数据库初始化脚本
go run scripts/init.go
```

### 5. 插入测试数据（可选）

```bash
# 运行测试数据插入脚本
go run scripts/seed.go
```

### 6. 启动服务

```bash
# 启动开发服务器
go run main.go
```

服务将在 http://localhost:3001 启动

## 项目结构

```
backend-go/
├── main.go              # 主入口文件
├── config/              # 配置文件
│   └── config.go
├── database/            # 数据库相关
│   └── database.go
├── models/              # 数据模型
│   ├── user.go
│   ├── course.go
│   ├── schedule.go
│   ├── attendance.go
│   ├── consumption.go
│   └── models.go
├── handlers/            # HTTP处理器
│   ├── auth.go
│   ├── course.go
│   ├── attendance.go
│   ├── notification.go
│   └── health.go
├── middleware/          # 中间件
│   ├── auth.go
│   └── logger.go
├── services/           # 业务逻辑服务
│   ├── scheduler.go
│   └── notification.go
├── utils/              # 工具函数
│   ├── jwt.go
│   └── response.go
├── scripts/            # 脚本文件
│   ├── init.go        # 数据库初始化
│   └── seed.go       # 测试数据插入
├── .env.example        # 环境变量模板
├── go.mod             # Go模块文件
└── README.md          # 项目说明
```

## API接口

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/profile` - 获取用户信息

### 课程管理接口
- `GET /api/courses` - 获取课程列表
- `POST /api/courses` - 创建新课程
- `GET /api/courses/:id` - 获取课程详情
- `PUT /api/courses/:id` - 更新课程信息
- `DELETE /api/courses/:id` - 删除课程
- `GET /api/courses/today` - 获取今日课程

### 出勤管理接口
- `GET /api/attendance` - 获取出勤记录
- `POST /api/attendance/:courseId/checkin` - 签到/请假
- `GET /api/attendance/reminders/tomorrow` - 获取明日课程提醒

### 通知接口
- `POST /api/notifications/subscribe` - 订阅推送通知
- `POST /api/notifications/unsubscribe` - 取消订阅
- `POST /api/notifications/test` - 发送测试通知

### 系统接口
- `GET /health` - 健康检查

## 定时任务

系统内置两个定时任务：

1. **每小时检查明天课程** - 自动创建第二天的出勤记录
2. **每晚8点发送提醒** - 推送第二天的课程提醒

## 环境变量配置

| 变量名 | 默认值 | 说明 |
|---------|--------|------|
| PORT | 3001 | 服务器端口 |
| NODE_ENV | development | 运行环境 |
| DB_PATH | ./database/courses.db | 数据库文件路径 |
| JWT_SECRET | your-secret-key | JWT签名密钥 |
| FRONTEND_URL | http://localhost:3000 | 前端URL（CORS） |

## 构建和部署

### 构建可执行文件

```bash
# 构建Linux版本
GOOS=linux GOARCH=amd64 go build -o course-management-backend main.go

# 构建Windows版本
GOOS=windows GOARCH=amd64 go build -o course-management-backend.exe main.go

# 构建macOS版本
GOOS=darwin GOARCH=amd64 go build -o course-management-backend-mac main.go
```

### 生产环境部署

1. **设置环境变量**
```bash
export NODE_ENV=production
export JWT_SECRET=your-production-secret
export PORT=8080
```

2. **初始化数据库**
```bash
go run scripts/init.go
```

3. **启动服务**
```bash
# 直接运行
./course-management-backend

# 或使用进程管理器
pm2 start course-management-backend --name "course-api"
```

### Docker部署

```dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY . .
RUN go mod download && go build -o course-management-backend main.go

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/course-management-backend .
COPY --from=builder /app/.env.example .env
EXPOSE 3001
CMD ["./course-management-backend"]
```

## 性能优势

相比Node.js版本，Go版本具有以下优势：

1. **执行效率** - 编译型语言，执行速度快3-5倍
2. **内存占用** - 内存消耗减少60%以上
3. **并发性能** - Goroutine轻量级，支持更高并发
4. **部署简单** - 单一可执行文件，无依赖
5. **类型安全** - 编译时类型检查，减少运行时错误

## 开发和测试

### 运行测试

```bash
# 运行所有测试
go test ./...

# 运行特定包的测试
go test ./handlers

# 显示测试覆盖率
go test -cover ./...
```

### 代码格式化

```bash
# 格式化代码
go fmt ./...

# 检查代码规范
go vet ./...
```

### 热重载开发

安装air工具实现热重载：

```bash
# 安装air
go install github.com/cosmtrek/air@latest

# 运行air
air
```

## 故障排除

### 常见问题

1. **端口被占用**
   - 修改.env中的PORT配置
   - 或终止占用端口的进程

2. **数据库权限问题**
   - 确保数据库目录有写权限
   - 检查文件路径是否正确

3. **依赖下载失败**
   - 检查网络连接
   - 配置Go代理：`go env -w GOPROXY=https://goproxy.cn,direct`

### 日志查看

Go版本提供详细的日志输出，包括：
- 请求日志
- 数据库操作日志
- 定时任务执行日志
- 错误堆栈信息

## 与前端的兼容性

Go版本后端与现有的前端代码完全兼容，无需任何修改：

- API接口保持不变
- 请求响应格式一致
- 认证机制相同
- WebSocket连接支持

## 升级指南

如果您想从Node.js版本迁移到Go版本：

1. **备份数据**
   - 导出现有SQLite数据库
   - 保存重要配置文件

2. **数据迁移**
   - 数据库表结构完全兼容
   - 可直接使用现有数据库文件

3. **配置迁移**
   - 复制环境变量配置
   - 调整Go特有的配置项

4. **验证部署**
   - 运行健康检查：`GET /health`
   - 测试API接口
   - 验证前端连接

详细的完整项目文档请参考项目根目录的 README.md 文件。