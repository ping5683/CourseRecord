package main

import (
	"log"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"course-management-backend/config"
	"course-management-backend/database"
	"course-management-backend/handlers"
	"course-management-backend/middleware"
	"course-management-backend/routes"
	"course-management-backend/services"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// 加载环境变量
	if err := godotenv.Load(); err != nil {
		log.Println("未找到.env文件，使用默认配置")
	}

	// 初始化数据库
	if err := database.InitDatabase(); err != nil {
		log.Fatal("数据库初始化失败:", err)
	}

	// 初始化定时任务
	scheduler := services.NewSchedulerService()
	go scheduler.Start()

	// 设置Gin模式
	if config.GetEnv("NODE_ENV", "development") == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// 创建路由器
	r := gin.Default()

	// 为静态文件添加CORS头（必须在静态文件服务之前注册）
	r.Use(func(c *gin.Context) {
		if c.Request.URL.Path == "/uploads" || c.Request.URL.Path == "/uploads/" || strings.HasPrefix(c.Request.URL.Path, "/uploads/") {
			c.Header("Access-Control-Allow-Origin", "http://localhost:5173")
			c.Header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
			c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization")
			c.Header("Access-Control-Allow-Credentials", "true")
			
			if c.Request.Method == "OPTIONS" {
				c.AbortWithStatus(204)
				return
			}
		}
		c.Next()
	})

	// 静态文件服务（必须在CORS中间件之后）
	r.Static("/uploads", "./uploads")

	// API路由的CORS配置
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{
			config.GetEnv("FRONTEND_URL", "http://localhost:3000"),
			"http://localhost:5173", // Vite开发服务器
			"http://localhost:5174", // Vite备用端口
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "X-Requested-With"},
		ExposeHeaders:    []string{"Content-Length", "Access-Control-Allow-Origin"},
		AllowCredentials: true,
	}))

	r.Use(gin.Recovery())
	r.Use(middleware.Logger())

	// 健康检查
	r.GET("/health", handlers.HealthCheck)

	// 设置API路由
	routes.SetupRoutes(r)

	// 获取端口
	port := config.GetEnv("PORT", "3001")
	
	log.Printf("服务器启动在端口 %s", port)
	log.Printf("API文档: http://localhost:%s/api-docs", port)

	// 启动服务器
	go func() {
		if err := r.Run(":" + port); err != nil {
			log.Fatal("服务器启动失败:", err)
		}
	}()

	// 优雅关闭
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("正在关闭服务器...")
	scheduler.Stop()
	database.CloseDatabase()
	log.Println("服务器已关闭")
}