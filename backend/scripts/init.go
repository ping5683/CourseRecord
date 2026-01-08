package main

import (
	"log"
	"os"
	"path/filepath"
	"course-management-backend/config"
	"course-management-backend/database"
	"course-management-backend/models"

	"gorm.io/gorm"
)

func main() {
	// 确保数据库目录存在
	dbPath := getDatabasePath()
	dbDir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dbDir, 0755); err != nil {
		log.Fatalf("创建数据库目录失败: %v", err)
	}
	log.Printf("创建数据库目录: %s", dbDir)

	// 连接数据库
	if err := database.InitDatabase(); err != nil {
		log.Fatalf("数据库连接失败: %v", err)
	}
	log.Println("数据库连接成功")

	// 同步所有模型
	db := database.GetDB()
	if err := models.AutoMigrate(db); err != nil {
		log.Fatalf("数据库表创建失败: %v", err)
	}
	log.Println("数据库表创建完成")

	// 创建上传目录
	uploadDir := "./uploads"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		log.Printf("创建上传目录失败: %v", err)
	} else {
		log.Printf("创建上传目录: %s", uploadDir)
	}

	log.Println("数据库初始化完成")
}

func getDatabasePath() string {
	if dbPath := config.GetEnv("DB_PATH", ""); dbPath != "" {
		return dbPath
	}
	return "./database/courses.db"
}