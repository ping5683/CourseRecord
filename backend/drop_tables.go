package main

import (
	"course-management-backend/database"
	"course-management-backend/models"
	"log"
)

func main() {
	// 初始化数据库连接
	err := database.InitDatabase()
	if err != nil {
		log.Fatal("数据库连接失败:", err)
	}
	defer database.CloseDatabase()

	db := database.GetDB()

	// 删除 course_schedules 表
	err = db.Migrator().DropTable(&models.CourseSchedule{})
	if err != nil {
		log.Fatal("删除表失败:", err)
	}
	
	log.Println("course_schedules 表删除成功")

	// 重新创建表（如果需要）
	err = db.AutoMigrate(&models.CourseSchedule{})
	if err != nil {
		log.Fatal("重新创建表失败:", err)
	}
	
	log.Println("course_schedules 表重新创建成功")
}