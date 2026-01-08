package main

import (
	"course-management-backend/database"
	"course-management-backend/models"
	"fmt"
	"log"
)

func main() {
	if err := database.InitDatabase(); err != nil {
		log.Fatal("数据库初始化失败:", err)
	}
	defer database.CloseDatabase()
	
	// 获取课程ID为3的数据
	var course models.Course
	if err := database.DB.Where("id = ?", 3).First(&course).Error; err != nil {
		log.Fatal("获取课程失败:", err)
	}
	
	fmt.Printf("当前数据库实际数据:\n")
	fmt.Printf("id: %d\n", course.ID)
	fmt.Printf("name: %s\n", course.Name)
	fmt.Printf("contractPath: '%s'\n", course.ContractPath)
	fmt.Printf("contractPath长度: %d\n", len(course.ContractPath))
	fmt.Printf("contractImages: '%s'\n", course.ContractImages)
}