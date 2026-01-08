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
	
	fmt.Printf("SQL查询结果:\n")
	fmt.Printf("id: %d\n", course.ID)
	fmt.Printf("name: %s\n", course.Name)
	fmt.Printf("contract_path: %s\n", course.ContractPath)
	
	// 检查字段名是否正确
	fmt.Printf("\n字段名检查:\n")
	fmt.Printf("ContractPath字段值: %s\n", course.ContractPath)
	fmt.Printf("ContractImages字段值: %s\n", course.ContractImages)
}