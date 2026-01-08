# Go版本后端安装指南

## 环境要求

- Go 1.21 或更高版本
- Git
- 终端/命令行工具

## 快速开始

### 1. 安装Go语言

#### Windows
1. 访问 [https://golang.org/dl/](https://golang.org/dl/)
2. 下载Windows MSI安装包
3. 双击安装，按提示完成
4. 重启命令行，验证安装：
```bash
go version
```

#### macOS
```bash
# 使用Homebrew安装
brew install go

# 或从官网下载PKG文件安装
```

#### Linux (Ubuntu/Debian)
```bash
# 使用apt安装
sudo apt update
sudo apt install golang-go

# 或下载官方版本
wget https://go.dev/dl/go1.21.5.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.21.5.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc
```

### 2. 配置Go环境（推荐）

```bash
# 设置Go工作目录
go env -w GOPATH=$HOME/go
go env -w GOPROXY=https://goproxy.cn,direct

# 添加到PATH（如果自动配置失败）
echo 'export PATH=$PATH:$HOME/go/bin' >> ~/.bashrc
source ~/.bashrc
```

### 3. 克隆并运行项目

```bash
# 进入项目目录
cd project-memory/backend-go

# 下载依赖
go mod download

# 配置环境变量（可选）
cp .env.example .env

# 初始化数据库
go run scripts/init.go

# 插入测试数据（可选）
go run scripts/seed.go

# 启动服务
go run main.go
```

服务将在 http://localhost:3001 启动

### 4. 验证安装

打开浏览器访问：
- 健康检查：http://localhost:3001/health
- API文档：前端启动后可测试接口

## 开发工具

### 热重载开发

安装air工具实现代码变更时自动重启：

```bash
# 安装air
go install github.com/cosmtrek/air@latest

# 运行air
air
```

### 代码检查和格式化

```bash
# 格式化代码
go fmt ./...

# 检查代码问题
go vet ./...

# 运行测试
go test ./...

# 查看测试覆盖率
go test -cover ./...
```

## 生产环境部署

### 1. 构建可执行文件

```bash
# 构建当前平台
go build -o course-management-backend main.go

# 交叉编译（构建其他平台）
# Linux 64位
GOOS=linux GOARCH=amd64 go build -o course-management-backend-linux main.go

# Windows 64位
GOOS=windows GOARCH=amd64 go build -o course-management-backend.exe main.go

# macOS 64位
GOOS=darwin GOARCH=amd64 go build -o course-management-backend-mac main.go
```

### 2. 运行可执行文件

```bash
# Linux/macOS
./course-management-backend

# Windows
./course-management-backend.exe
```

### 3. 使用进程管理器

#### PM2 (推荐)
```bash
# 安装PM2
npm install -g pm2

# 启动服务
pm2 start course-management-backend --name "course-api"

# 查看状态
pm2 status

# 查看日志
pm2 logs course-api

# 重启服务
pm2 restart course-api

# 停止服务
pm2 stop course-api
```

#### Systemd (Linux)
```bash
# 创建服务文件
sudo nano /etc/systemd/system/course-management.service
```

配置内容：
```ini
[Unit]
Description=Course Management API
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/backend-go
ExecStart=/path/to/backend-go/course-management-backend
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=JWT_SECRET=your-production-secret

[Install]
WantedBy=multi-user.target
```

启动服务：
```bash
sudo systemctl daemon-reload
sudo systemctl enable course-management
sudo systemctl start course-management
sudo systemctl status course-management
```

## Docker部署

### 1. 创建Dockerfile

项目根目录已包含Dockerfile，可直接使用。

### 2. 构建和运行

```bash
# 构建镜像
docker build -t course-management-backend .

# 运行容器
docker run -d \
  --name course-api \
  -p 3001:3001 \
  -v $(pwd)/database:/app/database \
  -e NODE_ENV=production \
  -e JWT_SECRET=your-production-secret \
  course-management-backend
```

### 3. Docker Compose

创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  backend:
    build: ./backend-go
    ports:
      - "3001:3001"
    volumes:
      - ./database:/app/database
      - ./uploads:/app/uploads
    environment:
      - NODE_ENV=production
      - JWT_SECRET=your-production-secret
      - PORT=3001
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
    restart: unless-stopped
```

运行：
```bash
docker-compose up -d
```

## 性能优化

### 1. 生产环境配置

设置以下环境变量优化性能：

```bash
# Go运行时优化
GOMAXPROCS=4                    # 使用4个CPU核心
GOGC=100                        # GC触发百分比

# 服务配置
NODE_ENV=production
JWT_SECRET=your-strong-secret
PORT=8080
```

### 2. 数据库优化

对于生产环境，建议使用PostgreSQL：

1. 修改数据库连接配置
2. 安装PostgreSQL驱动：`go get gorm.io/driver/postgres`
3. 更新连接字符串

### 3. 反向代理配置

使用Nginx作为反向代理：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 监控和日志

### 1. 日志配置

Go版本提供详细的日志输出，包括：
- HTTP请求日志
- 数据库操作日志
- 定时任务执行日志
- 错误堆栈信息

### 2. 监控指标

健康检查接口 `/health` 返回：
- 服务状态
- 启动时间
- 运行时长

### 3. 性能监控

可以使用以下工具监控Go应用：
- **pprof** - Go内置性能分析
- **Prometheus** - 指标收集
- **Grafana** - 可视化监控

## 故障排除

### 常见问题

1. **Go版本过低**
```bash
go version  # 确保是1.21+
```

2. **依赖下载失败**
```bash
# 设置国内代理
go env -w GOPROXY=https://goproxy.cn,direct

# 清理模块缓存
go clean -modcache
go mod download
```

3. **端口被占用**
```bash
# 查看端口占用
lsof -i :3001  # Linux/macOS
netstat -ano | findstr :3001  # Windows

# 修改.env中的PORT配置
PORT=3002
```

4. **数据库权限错误**
```bash
# 检查目录权限
ls -la database/

# 修改权限
chmod 755 database/
chmod 644 database/courses.db
```

### 调试模式

启用详细日志：

```bash
# 设置环境变量
export NODE_ENV=development

# 或在.env中配置
NODE_ENV=development
```

## 与Node.js版本的对比

| 特性 | Node.js版本 | Go版本 |
|------|-------------|---------|
| 启动时间 | ~2秒 | ~0.1秒 |
| 内存占用 | ~80MB | ~25MB |
| CPU使用 | 中等 | 低 |
| 并发处理 | 一般 | 优秀 |
| 部署复杂度 | 中等 | 简单 |
| 开发速度 | 快 | 中等 |
| 性能 | 中等 | 优秀 |

Go版本特别适合：
- 高并发场景
- 资源受限环境
- 长期运行服务
- 微服务架构

详细的项目文档请参考 `backend-go/README.md`。