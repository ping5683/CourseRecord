package database

import (
	"fmt"
	"log"
	"os"
	"course-management-backend/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// InitDatabase 初始化数据库
func InitDatabase() error {
	// 获取数据库连接字符串
	dsn := getMySQLDSN()

	// 连接数据库
	var err error
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return err
	}

	// 测试连接
	sqlDB, err := DB.DB()
	if err != nil {
		return err
	}
	if err = sqlDB.Ping(); err != nil {
		return err
	}

	// 自动迁移
	if err = models.AutoMigrate(DB); err != nil {
		return err
	}

	// 创建上传目录
	uploadDir := "./uploads"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		log.Printf("创建上传目录失败: %v", err)
	}

	log.Println("MySQL数据库初始化成功")
	return nil
}

// CloseDatabase 关闭数据库连接
func CloseDatabase() {
	if DB != nil {
		sqlDB, err := DB.DB()
		if err == nil {
			sqlDB.Close()
		}
	}
}

// GetDB 获取数据库实例
func GetDB() *gorm.DB {
	return DB
}

// getMySQLDSN 获取MySQL连接字符串
func getMySQLDSN() string {
	// 从环境变量获取数据库配置，如果没有则使用默认值
	host := getEnvOrDefault("DB_HOST", "localhost")
	port := getEnvOrDefault("DB_PORT", "3306")
	user := getEnvOrDefault("DB_USER", "root")
	password := getEnvOrDefault("DB_PASSWORD", "")
	dbname := getEnvOrDefault("DB_NAME", "course_management")
	charset := getEnvOrDefault("DB_CHARSET", "utf8mb4")
	
	// 构建DSN
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=%s&parseTime=True&loc=Local",
		user, password, host, port, dbname, charset)
	
	return dsn
}

// getEnvOrDefault 获取环境变量或返回默认值
func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}